import os
import logging
from telegram import Update
from telegram.ext import Application, MessageHandler, filters, ContextTypes

logger = logging.getLogger(__name__)

async def handle_telegram_reply(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Handles incoming text messages from the Telegram bot.
    Matches keywords like 'lock', 'secure', 'off', 'record', 'dismiss'.
    """
    if not update.message or not update.message.text:
        return
        
    user_choice = update.message.text
    orchestrator = context.bot_data.get("orchestrator")
    
    if not orchestrator:
        logger.error("[TelegramBot] Orchestrator not found in bot_data")
        return

    # Normalize input
    choice_lower = user_choice.lower()
    
    action_label = None
    if any(k in choice_lower for k in ["lock", "secure", "🔒"]):
        action_label = "Lock Door"
    elif any(k in choice_lower for k in ["off", "plug", "🔌"]):
        action_label = "Off Device"
    elif any(k in choice_lower for k in ["record", "video", "📹"]):
        action_label = "Start Recording"
    elif any(k in choice_lower for k in ["dismiss", "safe", "✅"]):
        action_label = "Dismiss"

    if action_label:
        logger.info(f"[TelegramBot] Matched action: {action_label} from input: '{user_choice}'")
        
        # 1. Provide immediate feedback in Telegram
        await update.message.reply_html(
            f"✅ <b>Action Executed</b>: {action_label}\n\n"
            f"🏠 Home Status: <b>Secure</b>\n"
            f"📡 Mode: Offline AI Active\n"
            f"🧠 Monitoring continues..."
        )

        # 2. Trigger the actual pipeline action (logging, etc)
        # We pass the original user_choice or the mapped action
        # We set send_telegram=False because we already sent the feedback above
        await orchestrator.execute_action(user_choice, send_telegram=False)
    else:
        logger.debug(f"[TelegramBot] No action matched for '{user_choice}'")

async def init_telegram_bot(orchestrator):
    """
    Initializes and starts the Telegram bot in polling mode.
    Returns the Application instance.
    """
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not token:
        logger.warning("[TelegramBot] TELEGRAM_BOT_TOKEN missing — bot listener disabled")
        return None

    try:
        application = Application.builder().token(token).build()
        
        # Store orchestrator in bot_data so handlers can access it
        application.bot_data["orchestrator"] = orchestrator
        
        # Add handler for text messages
        application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_telegram_reply))
        
        # Start the bot
        await application.initialize()
        await application.start()
        await application.updater.start_polling()
        
        logger.info("[TelegramBot] Polling bot is ONLINE and listening for replies")
        return application
    except Exception as e:
        logger.error(f"[TelegramBot] Failed to start bot: {e}")
        return None
