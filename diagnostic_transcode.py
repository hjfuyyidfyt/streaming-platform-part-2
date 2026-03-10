import os
import asyncio
import logging
from sqlmodel import Session, select
from backend.database import engine
from backend.models import Video
from backend.services.transcoder import transcode_video, check_ffmpeg_installed, get_video_info

# Setup basic logging to console
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("transcode_diagnostic")

async def run_diagnostic():
    logger.info("Starting transcoding diagnostic for Video 76...")
    
    # 1. Check FFmpeg
    if not check_ffmpeg_installed():
        logger.error("FFmpeg not found in path!")
        return
    logger.info("FFmpeg is available.")
    
    # 2. Find source file
    temp_uploads_dir = "backend/temp_uploads"
    if not os.path.exists(temp_uploads_dir):
        logger.error(f"Temp uploads dir {temp_uploads_dir} missing!")
        return
        
    # Get newest mp4 in temp_uploads
    files = [os.path.join(temp_uploads_dir, f) for f in os.listdir(temp_uploads_dir) if f.endswith('.mp4')]
    if not files:
        logger.error("No mp4 files found in temp_uploads to use as source.")
        return
    
    files.sort(key=os.path.getmtime, reverse=True)
    source_file = files[0]
    logger.info(f"Using source file: {source_file}")
    
    # 3. Get Video Info
    try:
        info = get_video_info(source_file, is_encrypted=False)
        logger.info(f"Video Info: {info}")
    except Exception as e:
        logger.error(f"Failed to get video info: {e}")
        return
        
    # 4. Attempt Transcode (Dry run/Test)
    test_output_dir = "backend/temp_transcodes/diagnostic_76"
    os.makedirs(test_output_dir, exist_ok=True)
    
    logger.info(f"Starting test transcode into {test_output_dir}...")
    try:
        # We'll just try 240p to be fast
        results = await asyncio.get_event_loop().run_in_executor(
            None, 
            lambda: transcode_video(source_file, test_output_dir, target_resolutions=["240p"], is_encrypted=False)
        )
        logger.info(f"Transcoding Results: {results}")
        
        if "240p" in results:
             logger.info("SUCCESS: Transcoding worked manually.")
        else:
             logger.error("FAILURE: Transcoding returned no files.")
             
    except Exception as e:
        logger.error(f"Transcoding crashed: {e}")

if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv("backend/.env", override=True)
    asyncio.run(run_diagnostic())
