import os
import asyncio
import httpx
import json

# Manually load settings/env to be sure
DOODSTREAM_API_KEY = os.getenv("DOODSTREAM_API_KEY", "358485y0d0d8s8f8s0d8f") # Replace if you know it, otherwise rely on env

async def test_dood():
    print("Testing DoodStream...")
    key = os.environ.get("DOODSTREAM_API_KEY")
    if not key:
        print("ERROR: DOODSTREAM_API_KEY not found in env")
        return

    print(f"API Key found: {key[:5]}...")
    url = "https://doodapi.co/api/upload/server"
    
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(url, params={"key": key})
            print(f"Status: {resp.status_code}")
            print(f"Response: {resp.text}")
            
            data = resp.json()
            if data['status'] == 200:
                print("SUCCESS: Got upload server.")
            else:
                print("FAILURE: API returned error.")
        except Exception as e:
            print(f"EXCEPTION: {e}")

if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()
    asyncio.run(test_dood())
