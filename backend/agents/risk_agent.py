"""
RiskAgent — The Math Engine
============================
Agent 3 in the ClawSentinel pipeline.
Uses the trained IsolationForest model (ml/model.pkl) to compute
an anomaly score for each event.

Formula reference: z = (x - μ) / σ  (Z-score against behavioral baseline)
"""

import logging
import os
from datetime import datetime

import joblib
import numpy as np

logger = logging.getLogger(__name__)

# Fixed location encoding — must match training data (alphabetical category codes)
# Training: df["location"].astype("category").cat.codes
# Unique locations: bedroom, hallway, kitchen, living_room → 0, 1, 2, 3
LOCATION_ENCODING = {
    "bedroom": 0,
    "hallway": 1,
    "kitchen": 2,
    "living_room": 3,
}

# Map sensor source strings → location category
SOURCE_TO_LOCATION = {
    "front_entry": "hallway",
    "garage_entry": "hallway",
    "porch_camera": "hallway",
    "hallway_sensor": "hallway",
    "kitchen": "kitchen",
    "bedroom": "bedroom",
    "living_room": "living_room",
    "hallway": "hallway",
}


class RiskAgent:
    """
    The Math Engine.
    Computes anomaly_score (0.0–1.0) and risk_level using the trained ML model.
    Falls back to rule-based heuristics if model is unavailable.
    """

    def __init__(self):
        self.model = None
        self._model_loaded = False

    def load_model(self, model_path: str):
        """Load the IsolationForest model. Called once at app startup."""
        try:
            self.model = joblib.load(model_path)
            self._model_loaded = True
            logger.info(f"[RiskAgent] IsolationForest model loaded from {model_path}")
        except Exception as e:
            logger.warning(f"[RiskAgent] Model load failed: {e} — heuristic fallback active")
            self._model_loaded = False

    def assess(self, event: dict, context: dict) -> dict:
        """
        Compute risk assessment for a normalized event.

        Returns:
            {
                "anomaly_score": float,   # 0.0 (normal) → 1.0 (dangerous)
                "risk_level": str,        # Normal | Suspicious | Dangerous
                "z_score": float,         # Statistical deviation from baseline
                "raw_score": float|None   # Raw IsolationForest score
            }
        """
        logger.info("[RiskAgent] Computing anomaly score")

        if self._model_loaded:
            return self._model_assess(event, context)
        return self._heuristic_assess(event, context)

    # ──────────────────────────────────────────
    # ML Model Path
    # ──────────────────────────────────────────

    def _model_assess(self, event: dict, context: dict) -> dict:
        """Score using IsolationForest model.pkl."""
        try:
            features = self._extract_features(event)
            feature_array = np.array([list(features.values())])

            # decision_function: positive = normal, negative = anomalous
            raw_score = float(self.model.decision_function(feature_array)[0])

            # Normalize to [0.05, 0.98]: higher = more dangerous
            anomaly_score = max(0.05, min(0.98, 0.5 - raw_score * 3.0))

            risk_level = self._classify_raw(raw_score)
            z_score = self._compute_z_score(event)

            logger.info(
                f"[RiskAgent] ML → raw={raw_score:.4f}, "
                f"normalized={anomaly_score:.4f}, risk={risk_level}"
            )
            return {
                "anomaly_score": round(anomaly_score, 4),
                "risk_level": risk_level,
                "z_score": round(z_score, 4),
                "raw_score": round(raw_score, 4),
            }

        except Exception as e:
            logger.error(f"[RiskAgent] ML inference failed: {e} — falling back to heuristic")
            return self._heuristic_assess(event, context)

    # ──────────────────────────────────────────
    # Heuristic Fallback Path
    # ──────────────────────────────────────────

    def _heuristic_assess(self, event: dict, context: dict) -> dict:
        """Rule-based scoring when ML model is unavailable."""
        hour = event.get("hour", 12)
        user_home = event.get("user_home", True)
        event_type = event.get("event", "")
        motion = event.get("motion", False)

        score = 0.18
        if hour < 5 or hour >= 23:      score += 0.36
        if not user_home:               score += 0.28
        if event_type == "door_open":   score += 0.18
        if event_type == "doorbell" and 8 <= hour <= 18:    score -= 0.14
        if event_type == "indoor_motion" and user_home:     score -= 0.16
        if motion and not user_home and (hour < 5 or hour >= 23): score += 0.15

        score = max(0.05, min(0.98, score))
        risk_level = (
            "Dangerous" if score > 0.75 else
            "Suspicious" if score > 0.45 else
            "Normal"
        )
        return {
            "anomaly_score": round(score, 4),
            "risk_level": risk_level,
            "z_score": round(self._compute_z_score(event), 4),
            "raw_score": None,
        }

    # ──────────────────────────────────────────
    # Feature Engineering (mirrors train_model.py)
    # ──────────────────────────────────────────

    def _extract_features(self, event: dict) -> dict:
        """
        Extract the exact feature vector used during training.
        Must match: hour_norm, day_of_week, motion, door, user_home,
                    location, is_night, is_weekend, activity
        """
        hour = event.get("hour", 0)
        source = event.get("source", "hallway")
        event_type = event.get("event", "")

        location_name = SOURCE_TO_LOCATION.get(source, "hallway")
        location_code = LOCATION_ENCODING.get(location_name, 1)

        # Use current real-world day of week (1=Mon … 7=Sun)
        day_of_week = datetime.now().isoweekday()

        motion = 1 if event.get("motion", False) else 0
        door = 1 if event_type in ["door_open"] else 0
        user_home = 1 if event.get("user_home", True) else 0
        is_night = 1 if hour < 5 else 0
        is_weekend = 1 if day_of_week in [6, 7] else 0
        activity = motion + door

        return {
            "hour_norm": hour / 24.0,
            "day_of_week": day_of_week,
            "motion": motion,
            "door": door,
            "user_home": user_home,
            "location": location_code,
            "is_night": is_night,
            "is_weekend": is_weekend,
            "activity": activity,
        }

    def _classify_raw(self, raw_score: float) -> str:
        """Classify risk level using same thresholds as train_model.py."""
        if raw_score > 0.08:  return "Normal"
        if raw_score > 0.0:   return "Suspicious"
        return "Dangerous"

    def _compute_z_score(self, event: dict) -> float:
        """
        Z-score: how many std deviations from the expected activity hour.
        z = (x - μ) / σ
        Baseline: μ=14.5 (2:30 PM mean activity), σ=4.5 hours
        Amplified when user is away unexpectedly.
        """
        hour = event.get("hour", 12)
        mu, sigma = 14.5, 4.5
        z = (hour - mu) / sigma
        if not event.get("user_home", True):
            z *= 1.5  # Amplify: unexpected presence without user
        return round(z, 3)
