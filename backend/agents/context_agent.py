"""
ContextAgent — The Memory Keeper
=================================
Agent 2 in the ClawSentinel pipeline.
Maintains short-term (HEARTBEAT.md) and long-term (SOUL.md) behavioral memory.
Compares incoming events against the 90-day behavioral baseline.
"""

import logging
import os
from collections import deque
from datetime import datetime

import aiofiles

logger = logging.getLogger(__name__)

SOUL_MD_PATH = os.getenv("SOUL_MD_PATH", "./memory/SOUL.md")
HEARTBEAT_MD_PATH = os.getenv("HEARTBEAT_MD_PATH", "./memory/HEARTBEAT.md")


class ContextAgent:
    """
    The Memory Keeper.

    Maintains:
    - soul_baseline  : Long-term behavioral profile loaded from SOUL.md
    - event_history  : Rolling deque of last 50 events (in-memory)
    - decision_log   : Rolling deque of last 10 decisions (in-memory + HEARTBEAT.md)
    """

    def __init__(self):
        self.soul_baseline: str = ""
        self.event_history: deque = deque(maxlen=50)
        self.decision_log: deque = deque(maxlen=10)
        self._initialized: bool = False

    async def initialize(self):
        """Load SOUL.md on startup. Called once from FastAPI lifespan."""
        try:
            async with aiofiles.open(SOUL_MD_PATH, "r", encoding="utf-8") as f:
                self.soul_baseline = await f.read()
            logger.info("[ContextAgent] SOUL.md loaded — long-term baseline active")
        except FileNotFoundError:
            logger.warning("[ContextAgent] SOUL.md not found — using empty baseline")
            self.soul_baseline = "No behavioral baseline available."
        self._initialized = True

    def get_context(self, event: dict) -> dict:
        """
        Retrieve behavioral context for the current event.
        Compares timing, user state, and recent history against baseline.

        Args:
            event: Normalized event from SensorAgent.

        Returns:
            Context dict used by RiskAgent and DecisionAgent.
        """
        hour = event.get("hour", 0)
        user_home = event.get("user_home", True)
        event_type = event.get("event", "unknown")

        # Is this a typical hour for activity?
        is_typical_hour = 6 <= hour <= 22

        # Is user presence consistent with expected routine?
        # Baseline: user home before 9am and after 5pm on weekdays
        expected_home = hour < 9 or hour >= 17
        is_typical_user_state = user_home == expected_home

        # Count repeated same-type events in recent history (pattern detection)
        recent_same_events = sum(
            1 for e in self.event_history if e.get("event") == event_type
        )

        # Count recent ALERT decisions (for escalation logic)
        recent_alert_count = sum(
            1 for d in self.decision_log if d.get("decision") == "ALERT"
        )

        context = {
            "soul_baseline": self.soul_baseline,
            "routine_summary": self._build_routine_summary(),
            "recent_summary": self._build_recent_summary(),
            "is_typical_hour": is_typical_hour,
            "is_typical_user_state": is_typical_user_state,
            "recent_same_event_count": recent_same_events,
            "recent_alert_count": recent_alert_count,
            "total_events_in_memory": len(self.event_history),
        }

        logger.info(
            f"[ContextAgent] Context → typical_hour={is_typical_hour}, "
            f"typical_user_state={is_typical_user_state}, recent_alerts={recent_alert_count}"
        )
        return context

    async def update_context(self, event: dict, decision: str, reasoning: str):
        """
        Update in-memory store and append entry to HEARTBEAT.md.

        Args:
            event    : Normalized event that was processed.
            decision : Final decision from DecisionAgent (ALERT/MONITOR/IGNORE).
            reasoning: Human-readable reasoning string.
        """
        self.event_history.append(event)

        entry = {
            "timestamp": datetime.now().isoformat(),
            "event": event.get("event"),
            "source": event.get("source"),
            "time": event.get("time"),
            "decision": decision,
            "reasoning": reasoning[:150] + "..." if len(reasoning) > 150 else reasoning,
        }
        self.decision_log.append(entry)

        await self._append_heartbeat(event, decision, reasoning)
        logger.info(f"[ContextAgent] Memory updated — decision={decision} stored")

    def get_state(self) -> dict:
        """Return current memory state snapshot for GET /state."""
        return {
            "soul_baseline": self.soul_baseline,
            "recent_events_count": len(self.event_history),
            "recent_decisions": list(self.decision_log),
            "system_status": "online" if self._initialized else "initializing",
        }

    # ──────────────────────────────────────────
    # Private helpers
    # ──────────────────────────────────────────

    def _build_routine_summary(self) -> str:
        if not self.event_history:
            return "No recent activity. System freshly initialized."
        recent = list(self.event_history)[-5:]
        types = [e.get("event", "unknown") for e in recent]
        return f"Last {len(recent)} events: {', '.join(types)}"

    def _build_recent_summary(self) -> str:
        if not self.decision_log:
            return "No prior decisions in current session."
        recent = list(self.decision_log)[-3:]
        parts = [f"{d['event']} @ {d['time']} → {d['decision']}" for d in recent]
        return " | ".join(parts)

    async def _append_heartbeat(self, event: dict, decision: str, reasoning: str):
        """Append a Markdown-formatted log entry to HEARTBEAT.md."""
        try:
            os.makedirs(os.path.dirname(os.path.abspath(HEARTBEAT_MD_PATH)), exist_ok=True)
            entry = (
                f"\n## [{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}]\n"
                f"- **Event**: `{event.get('event')}` @ {event.get('time')}\n"
                f"- **Source**: {event.get('source')}\n"
                f"- **User Home**: {event.get('user_home')}\n"
                f"- **Decision**: `{decision}`\n"
                f"- **Reasoning**: {reasoning[:250]}\n"
                f"---\n"
            )
            async with aiofiles.open(HEARTBEAT_MD_PATH, "a", encoding="utf-8") as f:
                await f.write(entry)
        except Exception as e:
            logger.warning(f"[ContextAgent] HEARTBEAT.md write failed: {e}")
