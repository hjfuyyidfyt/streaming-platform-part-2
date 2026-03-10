import asyncio
import httpx

async def test_auth():
    async with httpx.AsyncClient() as client:
        print("Testing register...")
        res = await client.post("http://localhost:8000/auth/register", json={
            "username": "testuser",
            "email": "testuser@example.com",
            "password": "Password123!",
            "display_name": "Test User"
        })
        print(f"Register status: {res.status_code}")
        print(f"Register response: {res.text}")
        
        print("\nTesting login...")
        res = await client.post("http://localhost:8000/auth/login", data={
            "username": "testuser@example.com",
            "password": "Password123!"
        })
        print(f"Login status: {res.status_code}")
        print(f"Login response: {res.text}")

if __name__ == "__main__":
    asyncio.run(test_auth())
