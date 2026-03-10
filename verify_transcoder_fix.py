import sys
import os
import shutil

# Add backend to path
sys.path.append(os.getcwd())

from backend.services.transcoder import get_video_info, transcode_video
from backend.services.crypto import encrypt_stream_to_file

def run_test():
    print("Starting Transcoder Fix Verification...")
    
    dummy_vid = "temp_debug_dummy.mp4"
    encrypted_vid = "temp_debug_dummy.enc"
    output_dir = "temp_test_output"
    
    # Ensure source exists (from previous debug step or create new)
    if not os.path.exists(encrypted_vid):
        print("Creating dummy video...")
        import subprocess
        subprocess.run([
            "ffmpeg", "-f", "lavfi", "-i", "testsrc=duration=5:size=1280x720:rate=30",
            "-c:v", "libx264", "-pix_fmt", "yuv420p", "-y", dummy_vid
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        with open(dummy_vid, "rb") as f:
            encrypt_stream_to_file(f, encrypted_vid)
    
    # Test 1: Info
    print("\n--- Testing get_video_info ---")
    info = get_video_info(encrypted_vid)
    print(f"Info: {info}")
    
    if info.get("duration") == 5.0 and info.get("height") == 720:
        print("PASS: Metadata correct")
    else:
        print("FAIL: Metadata incorrect")
        # Cleanup and exit if failed
        return

    # Test 2: Transcode
    print("\n--- Testing transcode_video ---")
    if os.path.exists(output_dir):
        shutil.rmtree(output_dir)
        
    results = transcode_video(encrypted_vid, output_dir)
    print(f"Results: {results}")
    
    if "480p" in results and "240p" in results:
        print("PASS: Transcoding successful")
    else:
        print("FAIL: Transcoding failed")
        
    # Cleanup
    # shutil.rmtree(output_dir)
    # os.remove(dummy_vid)
    # os.remove(encrypted_vid)

if __name__ == "__main__":
    run_test()
