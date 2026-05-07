import httpx
import asyncio

async def test_webhook():
    url = "http://localhost:8000/telegram/webhook"
    payload = {
        "message": {
            "text": "🔒 Lock Door",
            "from": {"username": "testuser"}
        }
    }
    async with httpx.AsyncClient() as client:
        try:
            res = await client.post(url, json=payload)
            print("Status:", res.status_code)
            print("Response:", res.json())
        except Exception as e:
            print("Error:", e)

if __name__ == "__main__":
    asyncio.run(test_webhook())
