import subprocess
import os
import sys

def check_ffmpeg():
    print("Checking FFmpeg...")
    try:
        result = subprocess.run(
            ["ffmpeg", "-version"],
            capture_output=True,
            text=True,
            timeout=10
        )
        if result.returncode == 0:
            print("FFmpeg is INSTALLED.")
            print(result.stdout.split('\n')[0])
            return True
        else:
            print("FFmpeg command failed.")
            print(result.stderr)
            return False
    except FileNotFoundError:
        print("FFmpeg binary NOT FOUND in PATH.")
        return False
    except Exception as e:
        print(f"Error checking FFmpeg: {e}")
        return False

def check_ffprobe():
    print("\nChecking FFprobe...")
    try:
        result = subprocess.run(
            ["ffprobe", "-version"],
            capture_output=True,
            text=True,
            timeout=10
        )
        if result.returncode == 0:
            print("FFprobe is INSTALLED.")
            print(result.stdout.split('\n')[0])
            return True
        else:
            print("FFprobe command failed.")
            print(result.stderr)
            return False
    except FileNotFoundError:
        print("FFprobe binary NOT FOUND in PATH.")
        return False
    except Exception as e:
        print(f"Error checking FFprobe: {e}")
        return False

if __name__ == "__main__":
    v = check_ffmpeg()
    p = check_ffprobe()
    
    if not v or not p:
        print("\nCRITICAL: FFmpeg/FFprobe missing. This causes 0 duration uploads.")
    else:
        print("\nFFmpeg seems okay. Issue likely in pipe/decryption or specific file.")
