import httpx
import json

def diagnose():
    try:
        with httpx.Client(timeout=30.0) as client:
            print("Fetching video 18...")
            resp = client.get("http://127.0.0.1:8000/videos/18")
            if resp.status_code == 200:
                data = resp.json()
                print(f"Title: {data.get('title')}")
                sources = data.get('sources', [])
                print(f"Total Sources: {len(sources)}")
                providers = [s.get('provider') for s in sources]
                print(f"Providers: {set(providers)}")
                for s in sources:
                    print(f" - {s.get('provider')} / {s.get('resolution')}")
            else:
                print(f"Error: {resp.status_code}")
                print(resp.text)
    except Exception as e:
        print(f"Connection Error: {e}")

if __name__ == "__main__":
    diagnose()
