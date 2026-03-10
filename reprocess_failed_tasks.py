
import os
import shutil
import asyncio
from sqlmodel import Session, select
from backend.database import engine
from backend.models import Video, VideoSource, TelegramInfo
from backend.services.telegram_queue import telegram_queue, TelegramUploadJob
from backend.services.external_storage import upload_to_streamtape, upload_to_doodstream
from dotenv import load_dotenv

load_dotenv('backend/.env')

# Force correct engine to avoid SQLite default
from sqlmodel import create_engine
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL or "postgresql" not in DATABASE_URL:
    raise ValueError(f"DATABASE_URL not found or invalid in backend/.env: {DATABASE_URL}")
engine = create_engine(DATABASE_URL)

TRANSCODE_DIR = "backend/temp_transcodes"

async def save_source(video_id, provider, res, file_id, embed_url=None):
    with Session(engine) as session:
        # Check if exists
        existing = session.exec(select(VideoSource).where(
            VideoSource.video_id == video_id,
            VideoSource.provider == provider,
            VideoSource.resolution == res
        )).first()
        if existing:
            return
        
        source = VideoSource(
            video_id=video_id,
            provider=provider,
            resolution=res,
            file_id=file_id,
            embed_url=embed_url
        )
        session.add(source)
        session.commit()
        print(f"  [DB] Saved {provider} - {res} for Video {video_id}")

async def reprocess_video(video_id):
    print(f"Processing Video {video_id}...")
    video_dir = os.path.join(TRANSCODE_DIR, str(video_id))
    if not os.path.exists(video_dir):
        print(f"  No transcode dir found for {video_id}")
        return

    files = os.listdir(video_dir)
    transcoded = {}
    for f in files:
        if f.endswith('.mp4'):
            # Resolution is usually at the end of the filename
            for res in ['1080p', '720p', '480p', '360p', '240p']:
                if res in f:
                    transcoded[res] = os.path.join(video_dir, f)
                    break
    
    if not transcoded:
        print(f"  No valid transcoded mp4 files found in {video_dir}")
        return

    print(f"  Found resolutions: {list(transcoded.keys())}")

    # For each resolution, upload to Telegram and StreamTape/DoodStream
    from backend.services.telegram_uploader import upload_video_to_telegram
    
    for res, path in transcoded.items():
        print(f"  Handling {res}...")
        
        # 1. Upload to Telegram
        try:
            tg_data = await upload_video_to_telegram(path, caption=f"Video {video_id} [{res}]", is_encrypted=False)
            if tg_data:
                # Save TelegramInfo if it doesn't exist for this video
                with Session(engine) as session:
                    existing_tg = session.exec(select(TelegramInfo).where(TelegramInfo.video_id == video_id)).first()
                    if not existing_tg and res == "Original": # Usually we only save TelegramInfo for original
                         tg_info = TelegramInfo(
                             video_id=video_id,
                             file_id=tg_data['file_id'],
                             file_unique_id=tg_data['file_unique_id'],
                             file_size=tg_data['file_size'],
                             mime_type=tg_data['mime_type'],
                             channel_message_id=tg_data['channel_message_id']
                         )
                         session.add(tg_info)
                         session.commit()
                
                await save_source(video_id, "telegram", res, tg_data['file_id'])
        except Exception as e:
            print(f"    Telegram upload failed: {e}")

        # 2. Upload to StreamTape
        try:
            st_data = await upload_to_streamtape(path, title=f"Video {video_id} {res}")
            if st_data:
                await save_source(video_id, "streamtape", res, st_data['file_id'], st_data['embed_url'])
        except Exception as e:
            print(f"    StreamTape upload failed: {e}")

        # 3. Upload to DoodStream
        try:
            dd_data = await upload_to_doodstream(path, title=f"Video {video_id} {res}")
            if dd_data:
                await save_source(video_id, "doodstream", res, dd_data['file_id'], dd_data['embed_url'])
        except Exception as e:
            print(f"    DoodStream upload failed: {e}")

async def main():
    # Find all dirs in TRANSCODE_DIR
    if not os.path.exists(TRANSCODE_DIR):
        print("No TRANSCODE_DIR found.")
        return

    dirs = os.listdir(TRANSCODE_DIR)
    for d in dirs:
        if d.isdigit():
            await reprocess_video(int(d))

if __name__ == "__main__":
    asyncio.run(main())
