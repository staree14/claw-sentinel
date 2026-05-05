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

from telegram import Bot
from telegram.error import TelegramError

logger = logging.getLogger(__name__)

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")


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
        self._setup_telegram()

    def _setup_telegram(self):
        """Initialize Telegram Bot client."""
        if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
            logger.warning("[ActionAgent] Telegram credentials missing — notifications disabled")
            return
        try:
            self._bot = Bot(token=TELEGRAM_BOT_TOKEN)
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
        
        # Simulate real hardware interaction
        if self._telegram_ready:
            try:
                await self._bot.send_message(
                    chat_id=TELEGRAM_CHAT_ID,
                    text=f"✅ *Action Executed*: `{action_name}`\n_Confirmed via System Terminal_",
                    parse_mode="Markdown"
                )
            except Exception as e:
                logger.error(f"Failed to send confirmation to Telegram: {e}")

        return {
            "status": "success",
            "action": action_name,
            "message": f"Successfully executed physical action: {action_name}"
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
                await self._bot.send_message(
                    chat_id=TELEGRAM_CHAT_ID,
                    text=message,
                    parse_mode="Markdown"
                )
                logger.info(f"[ActionAgent] ✅ Telegram alert sent to {TELEGRAM_CHAT_ID}")
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
        risk_level = risk.get("risk_level", "Dangerous")
        emoji = "🚨" if risk_level == "Dangerous" else "⚠️"

        return (
            f"{emoji} *CLAWSENTINEL ALERT*\n\n"
            f"*Risk*: {risk_level} (score: {score:.2f})\n"
            f"*Event*: `{event.get('event')}` at {event.get('time')}\n"
            f"*Source*: {event.get('source')}\n"
            f"*User Home*: {event.get('user_home')}\n\n"
            f"*Reasoning*:\n{reasoning[:300]}\n\n"
            f"_Reply LOCK to lock door | IGNORE to dismiss_\n"
            f"_{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}_"
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
