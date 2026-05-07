import asyncio
import os
import sys
from telegram import Update
from telegram.ext import Application, MessageHandler, filters, ContextTypes
from dotenv import load_dotenv

# Ensure we can import from the agents directory
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from agents.action_agent import ActionAgent

# Load environment variables
load_dotenv()

# Initialize the agent once to save time
agent = ActionAgent()

async def handle_telegram_reply(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    This is the 'Ear'. It hears you click the button on your phone.
    """
    if not update.message or not update.message.text:
        return
        
    user_choice = update.message.text
    print(f"DEBUG: Message received: '{user_choice}'")

    # Define the actions we care about
    # We use a simple 'in' check or mapping to be flexible with emojis
    choice_lower = user_choice.lower()
    
    action_label = None
    if "lock" in choice_lower or "secure" in choice_lower:
        action_label = "Lock Door"
    elif "off" in choice_lower:
        action_label = "Off Device"
    elif "record" in choice_lower:
        action_label = "Start Recording"
    elif "dismiss" in choice_lower or "safe" in choice_lower:
        action_label = "Dismiss"

    if action_label:
        print(f"DEBUG: Matched action: {action_label}")
        # --- IMMEDIATE FEEDBACK ---
        await update.message.reply_html(
            f"✅ <b>Action Executed</b>: {action_label}\n\n"
            f"🏠 Home Status: <b>Secure</b>\n"
            f"📡 Mode: Offline AI Active\n"
            f"🧠 Monitoring continues..."
        )

        # Now let the agent handle the background logic (logging, etc)
        await agent.execute_confirmed_action(user_choice, send_telegram=False)
    else:
        print(f"DEBUG: No action matched for '{user_choice}'")

async def main():
    # 1. Initialize the Bot Application
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not token:
        print("Error: TELEGRAM_BOT_TOKEN not found in environment.")
        return

    application = Application.builder().token(token).build()

    # 2. Tell the bot to listen for ALL text messages
    # We filter inside the handler for better flexibility and debugging
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_telegram_reply))

    print("🚀 ClawSentinel is LIVE. Listening for your confirmation...")
    
    # 3. Start the bot's 'ears' (Polling)
    # Using the standard application.run_polling() for simplicity in a runner script
    await application.initialize()
    await application.start()
    await application.updater.start_polling()
    
    # Keep it running
    try:
        while True:
            await asyncio.sleep(1)
    finally:
        await application.stop()
        await application.shutdown()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nSentinel Offline.")
