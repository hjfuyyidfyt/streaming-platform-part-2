import httpx
import json

def test_api():
    try:
        # Use a longer timeout or check why it times out (maybe localhost vs 127.0.0.1)
        with httpx.Client(timeout=10.0) as client:
            resp = client.get("http://127.0.0.1:8000/videos/18")
            print(f"Status: {resp.status_code}")
            print(f"JSON Output: {json.dumps(resp.json(), indent=2)}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_api()
