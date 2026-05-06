import asyncio
import os
import logging
from dotenv import load_dotenv

# Mocking enough to run ActionAgent
load_dotenv()

import sys
sys.path.append('.')

from agents.action_agent import ActionAgent

logging.basicConfig(level=logging.INFO)

async def test_alert():
    agent = ActionAgent()
    event = {
        "event": "door_open",
        "time": "03:00",
        "source": "front_entry",
        "user_home": False
    }
    risk = {
        "anomaly_score": 0.96,
        "risk_level": "Dangerous"
    }
    reasoning = "Test reasoning"
    
    print("Testing _handle_alert...")
    result = await agent.execute(event, "ALERT", reasoning, risk)
    print("Result:", result)

if __name__ == "__main__":
    asyncio.run(test_alert())
