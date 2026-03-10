"""
Test script to manually upload a video with multi-resolution transcoding.
Run this to test the full flow.
"""
import asyncio
import os
import sys

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from backend.services.transcoder import get_video_info, transcode_video, check_ffmpeg_installed
from backend.services.telegram_uploader import upload_video_to_telegram

async def test_upload(video_path: str):
    print(f"Testing upload for: {video_path}")
    print(f"FFmpeg installed: {check_ffmpeg_installed()}")
    
    # Get video info
    info = get_video_info(video_path)
    print(f"Video info: {info}")
    
    if not info:
        print("ERROR: Could not get video info!")
        return
    
    original_resolution = info.get("resolution", "unknown")
    print(f"Original resolution: {original_resolution}")
    
    # Upload original
    print("\n=== Uploading original... ===")
    try:
        result = await upload_video_to_telegram(video_path, caption="Test Original")
        print(f"Original uploaded! file_id: {result['file_id'][:30]}...")
    except Exception as e:
        print(f"ERROR uploading original: {e}")
        return
    
    # Transcode
    print("\n=== Transcoding... ===")
    transcode_dir = "backend/test_transcode_output"
    transcoded = transcode_video(video_path, transcode_dir)
    print(f"Transcoded files: {transcoded}")
    
    if not transcoded:
        print("No lower resolutions created")
        return
    
    # Upload each resolution
    for res, path in transcoded.items():
        print(f"\n=== Uploading {res}... ===")
        try:
            result = await upload_video_to_telegram(path, caption=f"Test {res}")
            print(f"{res} uploaded! file_id: {result['file_id'][:30]}...")
        except Exception as e:
            print(f"ERROR uploading {res}: {e}")

if __name__ == "__main__":
    video = "backend/temp_uploads/7dfcad0e-376c-4733-95c4-5397d644aa8a.mp4"
    if len(sys.argv) > 1:
        video = sys.argv[1]
    
    asyncio.run(test_upload(video))
