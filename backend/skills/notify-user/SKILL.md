---
name: notify-user
description: >-
  Sends a real-time contextual alert to the user's primary mobile device via the Telegram Bot API.
  Trigger this skill whenever the DecisionAgent identifies an event as 'ALERT' or 'MONITOR'.
version: 1.0.0
metadata:
  openclaw:
    requires:
      env:
        - TELEGRAM_BOT_TOKEN
        - TELEGRAM_CHAT_ID
---

# Instructions
Use this skill to keep the user informed of the security state of their environment.

- **For ALERT Decisions**: Include the event type, source, and risk level. Use the 🚨 emoji.
- **For MONITOR Decisions**: Include a note that the system is tracking the event but no immediate action is required. Use the ⚠️ emoji.
- **Rules**: Always include a timestamp to ensure the user knows the event's recency.

## Procedures
1. Format the alert message with clear visual markers (emojis/bolding).
2. Attach interactive buttons (ReplyKeyboardMarkup) for follow-up actions (Lock Door, Start Recording).
3. Send the message via the configured Telegram channel.
4. Log the delivery status back to the ContextAgent for the HEARTBEAT log.
