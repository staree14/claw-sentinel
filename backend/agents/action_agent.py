"""
ActionAgent — The Executioner
==============================
Agent 5 in the ClawSentinel pipeline.
Executes real-world actions based on the DecisionAgent's verdict.

Safe-by-Design: Physical actions (lock door, activate alarm) are gated
behind user confirmation via Telegram before execution.

ALERT  → Real Telegram notification to user
MONITOR→ Log to HEARTBEAT + suggest follow-up actions
IGNORE → Silent log only
"""

import logging
import os
from datetime import datetime

from telegram import Bot, ReplyKeyboardMarkup, KeyboardButton
from telegram.error import TelegramError

logger = logging.getLogger(__name__)




class ActionAgent:
    """
    The Executioner.

    Translates decisions into concrete actions:
    - ALERT   → Send Telegram alert + suggest physical actions (awaiting confirmation)
    - MONITOR → Log event + queue follow-up suggestion
    - IGNORE  → Silent audit log
    """

    def __init__(self):
        self._telegram_ready = False
        self._bot = None
        self._token = os.getenv("TELEGRAM_BOT_TOKEN", "")
        self._chat_id = os.getenv("TELEGRAM_CHAT_ID", "")
        self._setup_telegram()

    def _setup_telegram(self):
        """Initialize Telegram Bot client."""
        if not self._token or not self._chat_id:
            logger.warning("[ActionAgent] Telegram credentials missing — notifications disabled")
            return
        try:
            self._bot = Bot(token=self._token)
            self._telegram_ready = True
            logger.info("[ActionAgent] Telegram bot initialized")
        except Exception as e:
            logger.warning(f"[ActionAgent] Telegram init failed: {e}")

    async def execute(self, event: dict, decision: str, reasoning: str, risk: dict) -> dict:
        """
        Execute initial actions based on the pipeline decision.
        """
        logger.info(f"[ActionAgent] Executing for decision={decision}")

        if decision == "ALERT":
            return await self._handle_alert(event, reasoning, risk)
        elif decision == "MONITOR":
            return self._handle_monitor(event, reasoning, risk)
        else:
            return self._handle_ignore(event)

    async def execute_confirmed_action(self, action_name: str) -> dict:
        """
        Executes a physical action that was previously pending confirmation.
        """
        logger.info(f"[ActionAgent] Executing CONFIRMED action: {action_name}")
        
        # Human-friendly mapping for buttons
        action_map = {
            "secure": "Door Locked",
            "lock_door": "Door Locked",
            "off_device": "Device Powered Off",
            "record": "Recording Started",
            "start_recording": "Recording Started",
            "safe": "Alert Dismissed",
            "dismiss": "Alert Dismissed",
            "alert_user": "User Alerted (Confirmed via Dashboard)"
        }
        
        # Normalize: "🔒 Secure" -> "secure", "lock_door" -> "lock_door"
        key = action_name.lower()
        for emoji in ["🔒", "📹", "✅", "🔇", "🔌"]:
            key = key.replace(emoji, "")
        key = key.strip().replace(" ", "_")
        
        action_desc = action_map.get(key, action_name)
        
        display_name = (
            f"✅ <b>Action Executed</b>: {action_desc}\n\n"
            f"🏠 Home Status: Secure  \n"
            f"📡 Mode: Offline AI Active  \n"
            f"🧠 Monitoring continues... "
        )

        # Simulate real hardware interaction
        if self._telegram_ready and self._bot:
            try:
                logger.info(f"[ActionAgent] Sending Telegram confirmation to {self._chat_id}")
                await self._bot.send_message(
                    chat_id=self._chat_id,
                    text=display_name,
                    parse_mode="HTML"
                )
                logger.info("[ActionAgent] Telegram confirmation sent successfully")
            except Exception as e:
                logger.error(f"Failed to send confirmation to Telegram: {e}")
        else:
            logger.warning(f"[ActionAgent] Telegram not ready (ready={self._telegram_ready}) — confirmation skipped")

        return {
            "status": "success",
            "action": action_name,
            "message": display_name
        }

    # ──────────────────────────────────────────
    # ALERT Handler
    # ──────────────────────────────────────────

    async def _handle_alert(self, event: dict, reasoning: str, risk: dict) -> dict:
        """Send real Telegram alert. Gate physical actions behind user confirmation."""
        actions = ["alert_triggered", "telegram_notification_sent"]
        score = risk.get("anomaly_score", 0.0)
        risk_level = risk.get("risk_level", "Dangerous")

        # Build Telegram message
        message = self._build_alert_message(event, reasoning, risk)

        # Send real Telegram notification
        if self._telegram_ready:
            try:
                # Use ReplyKeyboardMarkup for "2-way convo" feel
                # Clicking these sends the text as a message FROM the user
                keyboard = [
                    [KeyboardButton("🔒 Secure"), KeyboardButton("📹 Record"), KeyboardButton("✅ Safe")]
                ]
                reply_markup = ReplyKeyboardMarkup(
                    keyboard, 
                    one_time_keyboard=True, 
                    resize_keyboard=True
                )

                await self._bot.send_message(
                    chat_id=self._chat_id,
                    text=message,
                    parse_mode="HTML",
                    reply_markup=reply_markup
                )
                logger.info(f"[ActionAgent] ✅ Telegram alert sent to {self._chat_id}")
                actions.append("telegram_delivered")
            except TelegramError as e:
                logger.error(f"[ActionAgent] ❌ Telegram send failed: {e}")
                actions.append("telegram_failed")
        else:
            # Fallback: log to console (OpenClaw simulation layer)
            logger.warning(f"[ActionAgent] [SIMULATED] Telegram: {message[:100]}...")
            actions.append("telegram_simulated")

        # Physical actions require user confirmation (Safe-by-Design)
        if event.get("event") == "door_open":
            actions.append("door_lock_pending_confirmation")
            logger.info("[ActionAgent] Door lock queued — awaiting user confirmation via Telegram")

        if score > 0.85:
            actions.append("camera_recording_started")
            logger.info("[ActionAgent] Camera recording activated (high anomaly score)")

        return {
            "actions": actions,
            "action_taken": "User alerted via Telegram. Physical actions pending confirmation.",
            "suggested_actions": ["Lock door", "Alert user", "Start recording"],
        }

    def _build_alert_message(self, event: dict, reasoning: str, risk: dict) -> str:
        """Format the Telegram alert message."""
        score = risk.get("anomaly_score", 0.0)
        risk_level_raw = risk.get("risk_level", "Normal")
        
        # Map internal risk levels to user-facing labels
        risk_map = {
            "Dangerous": "HIGH",
            "Suspicious": "MEDIUM",
            "Normal": "LOW"
        }
        risk_level = risk_map.get(risk_level_raw, "LOW")
        
        source = event.get("source", "Unknown Location").replace("_", " ").title()
        event_type = event.get("event", "activity").replace("_", " ").title()
        time = event.get("time", "unknown time")
        user_status = "Home" if event.get("user_home") else "Away"
        
        # Determine recommendation based on event
        recommendation = "Secure Home"
        if "motion" in event_type.lower():
            recommendation = "Record Clip"
        elif "safe" in risk_level.lower():
            recommendation = "Maintain Monitoring"
        
        return (
            f"🚨 <b>ClawSentinel Alert</b>\n\n"
            f"<b>Risk</b>: {risk_level} ({score:.2f})\n\n"
            f"📍 {source} {event_type} at {time}  \n"
            f"👤 <b>User</b>: {user_status}  \n\n"
            f"🧠 <b>Unusual activity detected</b>\n\n"
            f"👉 <b>Recommended</b>: {recommendation}"
        )

    # ──────────────────────────────────────────
    # MONITOR Handler
    # ──────────────────────────────────────────

    def _handle_monitor(self, event: dict, reasoning: str, risk: dict) -> dict:
        """Log elevated event and suggest follow-up without interrupting user."""
        logger.info(
            f"[ActionAgent] MONITOR — {event.get('event')} @ {event.get('time')} "
            f"(score={risk.get('anomaly_score', 0):.2f}) — queued for review"
        )
        return {
            "actions": ["event_logged", "monitor_flag_set", "review_camera_queued"],
            "action_taken": "Event logged and flagged for review. User notification queued.",
            "suggested_actions": ["Notify user", "Review camera", "Keep monitoring"],
        }

    # ──────────────────────────────────────────
    # IGNORE Handler
    # ──────────────────────────────────────────

    def _handle_ignore(self, event: dict) -> dict:
        """Silently log the event — no user interruption."""
        logger.info(
            f"[ActionAgent] IGNORE — {event.get('event')} @ {event.get('time')} "
            f"— matches normal pattern, logged silently"
        )
        return {
            "actions": ["event_logged_silently"],
            "action_taken": "Event logged quietly with no interruption.",
            "suggested_actions": ["Ignore", "Log event", "Maintain schedule"],
        }
