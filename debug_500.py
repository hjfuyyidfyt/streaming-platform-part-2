from fastapi.testclient import TestClient
from backend.main import app
import traceback

client = TestClient(app)

print("Testing GET /videos/ ...")
try:
    response = client.get("/videos/?skip=0&limit=12")
    print(f"Status: {response.status_code}")
    if response.status_code != 200:
        print(f"Body: {response.text}")
except Exception:
    print("Caught Exception:")
    traceback.print_exc()

print("\nTesting GET /videos/categories/all ...")
try:
    response = client.get("/videos/categories/all")
    print(f"Status: {response.status_code}")
except Exception:
    traceback.print_exc()
