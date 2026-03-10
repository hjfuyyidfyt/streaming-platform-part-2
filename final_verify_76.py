import os
import asyncio
from sqlmodel import Session, select
from backend.database import engine
from backend.models import Video, VideoResolution, TelegramInfo, VideoSource
from dotenv import load_dotenv

async def final_fix_76():
    load_dotenv("backend/.env", override=True)
    
    with Session(engine) as session:
        # Check if video 76 exists
        video = session.get(Video, 76)
        if not video:
            print("Video 76 not found in DB.")
            return

        print(f"Repairing Video 76: {video.title}")
        
        # Check TelegramInfo
        tg = session.exec(select(TelegramInfo).where(TelegramInfo.video_id == 76)).first()
        if not tg:
            print("No TelegramInfo found! This video might not have been uploaded to Telegram properly.")
            return

        print(f"Base Telegram Message ID: {tg.channel_message_id}")

        # Since we've confirmed 240p exists and 1080p is the source,
        # we can manually add common resolutions if they are actually uploaded.
        # However, without the proper file_ids from Telegram, the 'quality' selector won't work in the player.
        
        # ROOT CAUSE: The background quality conversion process (transcoding + upload to Telegram) 
        # was interrupted, so no file_ids or message_ids exist for 720p/480p/240p.
        
        # The fix is to re-run the FULL background process for this video.
        # I have already triggered 'transcode_only_task' in reprocess_76.py which should be running now.
        
        # Let's check for any resolutions that DID get saved in the last few minutes.
        res = session.exec(select(VideoResolution).where(VideoResolution.video_id == 76)).all()
        if res:
            print(f"Found resolutions: {[r.resolution for r in res]}")
        else:
            print("Still no resolutions found. Transcoding/Upload might still be in progress.")

if __name__ == "__main__":
    asyncio.run(final_fix_76())
