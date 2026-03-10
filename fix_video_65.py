import os
import asyncio
from pathlib import Path
from dotenv import load_dotenv
load_dotenv(dotenv_path="backend/.env", override=True)

from sqlmodel import Session, select
from backend.database import engine
from backend.models import VideoSource, TelegramInfo, Video, VideoResolution
from telethon import TelegramClient

async def fix_video_65():
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    api_id = os.getenv("TELEGRAM_API_ID")
    api_hash = os.getenv("TELEGRAM_API_HASH")
    channel_id_str = os.getenv("TELEGRAM_CHANNEL_ID")
    
    if not all([token, api_id, api_hash, channel_id_str]):
        print("Missing credentials.")
        return
        
    channel_id = int(channel_id_str.strip())
    session_path = str(Path("backend/bot_session").resolve())
    
    client = TelegramClient(session_path, int(api_id), api_hash)
    await client.start(bot_token=token)
    
    print("Fetching message 33...")
    message = await client.get_messages(channel_id, ids=33)
    
    if not message or not message.media:
        print("Could not find message or it has no media.")
        await client.disconnect()
        return
        
    video = message.video if getattr(message, 'video', None) else message.document
    if not video:
        print("No video in message.")
        await client.disconnect()
        return
        
    file_id = str(video.id)
    file_unique_id = f"{video.id}_{video.access_hash}"
    file_size = video.size
    mime_type = video.mime_type
    
    print(f"Extracted properties: file_id={file_id}, file_unique_id={file_unique_id}, file_size={file_size}")
    
    video_id = 65
    res_val = "720p"  # from log: [TelegramQueue] FAILED: video_id=65, res=720p
    
    with Session(engine) as session:
        # Check if already exists
        existing = session.exec(select(TelegramInfo).where(TelegramInfo.video_id == video_id)).first()
        if not existing:
            print("Adding TelegramInfo...")
            tg_info = TelegramInfo(
                video_id=video_id,
                file_id=file_id,
                file_unique_id=file_unique_id,
                file_size=file_size,
                mime_type=mime_type,
                channel_message_id=33
            )
            session.add(tg_info)
            
        existing_res = session.exec(
            select(VideoResolution).where(
                VideoResolution.video_id == video_id,
                VideoResolution.resolution == res_val
            )
        ).first()
        
        if not existing_res:
            print("Adding VideoResolution...")
            new_res = VideoResolution(
                video_id=video_id,
                resolution=res_val,
                file_id=file_id,
                file_unique_id=file_unique_id,
                file_size=file_size,
                channel_message_id=33
            )
            session.add(new_res)
            
        existing_src = session.exec(
            select(VideoSource).where(
                VideoSource.video_id == video_id,
                VideoSource.provider == "telegram"
            )
        ).first()
        
        if not existing_src:
            print("Adding VideoSource...")
            source = VideoSource(
                video_id=video_id,
                provider="telegram",
                resolution=res_val,
                file_id=file_id
            )
            session.add(source)
            
        session.commit()
        print("Successfully fixed database for video 65!")
        
    await client.disconnect()

if __name__ == "__main__":
    asyncio.run(fix_video_65())
