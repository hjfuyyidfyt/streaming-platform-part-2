import subprocess
import os
import json
import threading
import sys
from backend.services.crypto import encrypt_stream_to_file, decrypt_file_generator

# Mock logger
class Logger:
    def info(self, msg): print(f"[INFO] {msg}")
    def error(self, msg): print(f"[ERROR] {msg}")
logger = Logger()

def feed_stdin(process, input_generator):
    try:
        for chunk in input_generator:
            try:
                process.stdin.write(chunk)
            except BrokenPipeError:
                # Expected if process exits early
                break
        process.stdin.close()
    except Exception as e:
        if "Broken pipe" not in str(e):
             logger.error(f"Error feeding stdin: {e}")

def get_video_info_debug(file_path):
    cmd = [
        "ffprobe",
        "-v", "error", # Show errors
        "-print_format", "json",
        "-show_format",
        "-show_streams",
        "pipe:0"
    ]
    
    print(f"Running: {' '.join(cmd)}")
    
    process = subprocess.Popen(
        cmd,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        # text=False # Binary mode for pipes
    )
    
    gen = decrypt_file_generator(file_path)
    t = threading.Thread(target=feed_stdin, args=(process, gen))
    t.start()
    
    stdout, stderr = process.communicate(timeout=30)
    t.join()
    
    print(f"Return Code: {process.returncode}")
    if stderr:
        print(f"STDERR: {stderr.decode('utf-8', errors='ignore')}")
    
    if process.returncode == 0:
        try:
            data = json.loads(stdout.decode('utf-8'))
            print("JSON Output Parsed Successfully.")
            print(json.dumps(data, indent=2))
        except:
            print("Failed to parse JSON")
            print(stdout)
    else:
         print("FFprobe failed.")

def verify_decryption(original, encrypted):
    print("Verifying decryption...")
    decrypted_file = "temp_decrypted_check.mp4"
    
    gen = decrypt_file_generator(encrypted)
    with open(decrypted_file, "wb") as f:
        for chunk in gen:
            f.write(chunk)
            
    # Compare
    with open(original, "rb") as f1, open(decrypted_file, "rb") as f2:
        if f1.read() == f2.read():
            print("Decryption Integrity: PASSED (Files match)")
            # os.remove(decrypted_file)
            return True
        else:
            print("Decryption Integrity: FAILED (Files do not match)")
            return False

def run_test():
    # 1. Create Dummy Video
    dummy_vid = "temp_debug_dummy.mp4"
    encrypted_vid = "temp_debug_dummy.enc"
    
    if not os.path.exists(dummy_vid):
        print("Generating dummy video...")
        subprocess.run([
            "ffmpeg", "-f", "lavfi", "-i", "testsrc=duration=5:size=1280x720:rate=30",
            "-c:v", "libx264", "-pix_fmt", "yuv420p", "-y", dummy_vid
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    
    # 2. Encrypt It
    print("Encrypting video...")
    with open(dummy_vid, "rb") as f:
        encrypt_stream_to_file(f, encrypted_vid)
    
    # 3. Verify Integrity
    if verify_decryption(dummy_vid, encrypted_vid):
        # 4. Probe It
        print("Probing encrypted video...")
        get_video_info_debug(encrypted_vid)
    else:
        print("Skipping probe testing due to encryption failure.")

if __name__ == "__main__":
    run_test()
