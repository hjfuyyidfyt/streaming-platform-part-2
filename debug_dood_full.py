import os
import asyncio
import httpx
import json
import subprocess

# Load Env
from dotenv import load_dotenv
load_dotenv()

async def test_full_upload():
    print("Testing Full DoodStream Upload...")
    key = os.getenv("DOODSTREAM_API_KEY")
    if not key:
        print("ERROR: DOODSTREAM_API_KEY is missing")
        return

    # 1. Create Dummy Video
    dummy_vid = "dood_test.mp4"
    if not os.path.exists(dummy_vid):
        print("Creating dummy video...")
        subprocess.run([
            "ffmpeg", "-f", "lavfi", "-i", "testsrc=duration=5:size=640x360:rate=30",
            "-c:v", "libx264", "-pix_fmt", "yuv420p", "-y", dummy_vid
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    
    # 2. Get Server
    async with httpx.AsyncClient() as client:
        server_url = "https://doodapi.co/api/upload/server"
        print("Getting upload server...")
        resp = await client.get(server_url, params={"key": key})
        data = resp.json()
        
        if data['status'] != 200:
            print(f"FAILED to get server: {data}")
            return
            
        upload_url = data['result']
        print(f"Upload URL: {upload_url}")
        
        # 3. Upload
        print("Uploading file...")
        with open(dummy_vid, 'rb') as f:
            files = {'file': ('dood_test.mp4', f, 'video/mp4')}
            # Fix: Use 'api_key' in form data body
            data = {'api_key': key}
            resp = await client.post(upload_url, files=files, data=data, timeout=60.0)
            
            print(f"Upload Status: {resp.status_code}")
            print(f"Upload Response: {resp.text}")
            
            if resp.status_code == 200:
                try:
                    res_json = resp.json()
                    if res_json['status'] == 200:
                        print("SUCCESS: Full upload worked!")
                        print(f"File Code: {res_json['result'][0]['filecode'] if isinstance(res_json['result'], list) else res_json['result']['filecode']}")
                    else:
                        print("FAILURE: API returned error in upload response.")
                except:
                    print("FAILURE: Could not parse response.")
            else:
                print("FAILURE: HTTP Error.")

if __name__ == "__main__":
    asyncio.run(test_full_upload())
