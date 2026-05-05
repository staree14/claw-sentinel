"""
SensorAgent — The Normalizer
============================
Agent 1 in the ClawSentinel pipeline.
Receives raw event JSON and normalizes it into a consistent
structured format for all downstream agents.
"""

import logging
from datetime import datetime

logger = logging.getLogger(__name__)


class SensorAgent:
    """
    Normalizes raw sensor event packets.
    Ensures consistent field types and populates derived fields (e.g., hour).
    """

    def process(self, raw_event: dict) -> dict:
        """
        Normalize a raw event dict into a standardized format.

        Args:
            raw_event: Raw incoming JSON from the API layer.

        Returns:
            Normalized event dict with all required fields guaranteed.
        """
        logger.info("[SensorAgent] Processing raw event packet")

        # Parse hour from time string "HH:MM"
        try:
            hour = int(str(raw_event.get("time", "00:00")).split(":")[0])
        except (ValueError, IndexError):
            hour = datetime.now().hour

        # Normalize boolean fields — handle string "true"/"false" from JSON
        user_home = bool(raw_event.get("user_home", False))
        motion = bool(raw_event.get("motion", False))

        # Lowercase and strip the event type
        event_type = str(raw_event.get("event", "unknown")).lower().strip()

        normalized = {
            "time": raw_event.get("time", f"{datetime.now().hour:02d}:00"),
            "event": event_type,
            "user_home": user_home,
            "motion": motion,
            "source": str(raw_event.get("source", "unknown")),
            "hour": hour,
            "description": raw_event.get("description", ""),
            "id": raw_event.get("id"),
            "scenario": raw_event.get("scenario"),
        }

        logger.info(
            f"[SensorAgent] Normalized → event={event_type}, "
            f"hour={hour}, user_home={user_home}, motion={motion}"
        )
        return normalized
