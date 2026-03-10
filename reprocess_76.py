import asyncio
import os
import logging
from dotenv import load_dotenv
load_dotenv("backend/.env", override=True)

from sqlmodel import Session
from backend.database import engine
from backend.models import Video
from backend.routers.admin import TEMP_DIR, load_settings
from backend.routers.upload import transcode_only_task

async def run_internal():
    logger = logging.getLogger("reprocess_76")
    logging.basicConfig(level=logging.INFO)
    
    with Session(engine) as session:
        video = session.get(Video, 76)
        if not video:
            print("Video 76 not found.")
            return
        
        print(f"Reprocessing Video 76: {video.title}")
        
        mp4_files = []
        for f in os.listdir(TEMP_DIR):
            fpath = os.path.join(TEMP_DIR, f)
            if os.path.isfile(fpath) and f.endswith('.mp4') and not f.endswith('.tg_queue_copy'):
                mp4_files.append((fpath, os.path.getmtime(fpath)))
        
        if not mp4_files:
            print("No source files in temp_uploads.")
            return
            
        mp4_files.sort(key=lambda x: x[1], reverse=True)
        source_file = mp4_files[0] # Note: current fix_video logic uses a tuple
        if isinstance(source_file, tuple):
             source_file = source_file[0]
             
        print(f"Found source: {source_file}")
        
        settings = load_settings()
        active_providers = [k for k, v in settings.storage_providers.items() if v['enabled']]
        
        # We need to run this in a loop so background threads work correctly? 
        # Actually transcode_only_task starts its own thread.
        transcode_only_task(
            video_id=video.id,
            source_file=source_file,
            title=video.title,
            original_resolution=video.original_resolution or "1080p",
            active_providers=active_providers
        )
        print("Reprocessing task started in background. Please wait ~2-3 minutes for ffmpeg to finish.")

if __name__ == "__main__":
    import logging
    asyncio.run(run_internal())
