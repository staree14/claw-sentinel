"""
DecisionAgent — The Reasoning Brain
=====================================
Agent 4 in the ClawSentinel pipeline.
Uses Google Gemini to generate a human-readable Decision Trace
and decide: ALERT | MONITOR | IGNORE.

Falls back to deterministic rule-based decision if Gemini is unavailable.
"""

import json
import logging
import os
import re

import google.generativeai as genai

logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")


class DecisionAgent:
    """
    The Reasoning Brain.

    Sends a structured prompt to Gemini containing:
    - Normalized sensor event
    - Behavioral context from ContextAgent
    - Anomaly score + risk level from RiskAgent

    Receives back: decision (ALERT/MONITOR/IGNORE) + human-readable reasoning.
    """

    def __init__(self):
        self._gemini_ready = False
        self._model = None
        self._setup_gemini()

    def _setup_gemini(self):
        """Initialize Gemini client if API key is set."""
        if not GEMINI_API_KEY:
            logger.warning("[DecisionAgent] No GEMINI_API_KEY — using rule-based fallback")
            return
        try:
            genai.configure(api_key=GEMINI_API_KEY)
            self._model = genai.GenerativeModel(GEMINI_MODEL)
            self._gemini_ready = True
            logger.info(f"[DecisionAgent] Gemini ready — model={GEMINI_MODEL}")
        except Exception as e:
            logger.warning(f"[DecisionAgent] Gemini setup failed: {e}")

    async def decide(self, event: dict, context: dict, risk: dict) -> dict:
        """
        Generate a decision and reasoning for the pipeline.

        Args:
            event  : Normalized event from SensorAgent.
            context: Behavioral context from ContextAgent.
            risk   : Anomaly assessment from RiskAgent.

        Returns:
            {"decision": str, "reasoning": str}
        """
        logger.info("[DecisionAgent] Generating decision")

        if self._gemini_ready:
            return await self._gemini_decide(event, context, risk)
        return self._rule_decide(event, context, risk)

    # ──────────────────────────────────────────
    # Gemini Path (Real LLM)
    # ──────────────────────────────────────────

    async def _gemini_decide(self, event: dict, context: dict, risk: dict) -> dict:
        """Call Gemini API for real LLM-powered reasoning."""
        prompt = self._build_prompt(event, context, risk)
        try:
            response = await self._model.generate_content_async(prompt)
            raw = response.text.strip()
            return self._parse_gemini_response(raw, risk)
        except Exception as e:
            logger.error(f"[DecisionAgent] Gemini call failed: {e} — using rule fallback")
            return self._rule_decide(event, context, risk)

    def _build_prompt(self, event: dict, context: dict, risk: dict) -> str:
        """Build the structured prompt sent to Gemini."""
        return f"""You are ClawSentinel, an advanced AI safety agent for smart home environments.
Your job is to analyze sensor events and decide if they represent a security threat.

=== SENSOR EVENT ===
- Time: {event.get('time')} (Hour: {event.get('hour')})
- Event Type: {event.get('event')}
- Motion Detected: {event.get('motion')}
- User Home: {event.get('user_home')}
- Sensor Source: {event.get('source')}
- Description: {event.get('description', 'N/A')}

=== BEHAVIORAL CONTEXT ===
- Recent Activity: {context.get('routine_summary')}
- Recent Decisions: {context.get('recent_summary')}
- Is Typical Hour: {context.get('is_typical_hour')}
- User Presence Expected: {context.get('is_typical_user_state')}
- Recent ALERT Count: {context.get('recent_alert_count')}

=== RISK ASSESSMENT ===
- Anomaly Score: {risk.get('anomaly_score')} (0=normal, 1=dangerous)
- Risk Level: {risk.get('risk_level')}
- Z-Score: {risk.get('z_score')} (deviation from normal hour)

=== BEHAVIORAL BASELINE SUMMARY ===
User is typically home before 9 AM and after 5 PM on weekdays.
Night hours (22:00–06:00) should have near-zero activity.
Any motion while user is away during night is HIGH RISK.

=== YOUR TASK ===
Decide: ALERT, MONITOR, or IGNORE.
- ALERT: Immediate threat — send notification, lock door
- MONITOR: Unusual but not immediately dangerous — watch closely
- IGNORE: Matches normal behavioral pattern — log quietly

Respond ONLY with valid JSON:
{{
  "decision": "ALERT" or "MONITOR" or "IGNORE",
  "reasoning": "2-3 sentence explanation referencing the specific event, time, user presence, and behavioral context."
}}"""

    def _parse_gemini_response(self, raw: str, risk: dict) -> dict:
        """Parse Gemini's JSON response with fallback extraction."""
        try:
            # Try direct JSON parse
            data = json.loads(raw)
            decision = data.get("decision", "").upper()
            reasoning = data.get("reasoning", "")
            if decision in ["ALERT", "MONITOR", "IGNORE"] and reasoning:
                return {"decision": decision, "reasoning": reasoning}
        except json.JSONDecodeError:
            pass

        # Fallback: extract from markdown code block
        try:
            match = re.search(r'\{.*?\}', raw, re.DOTALL)
            if match:
                data = json.loads(match.group())
                decision = data.get("decision", "").upper()
                reasoning = data.get("reasoning", raw[:300])
                if decision in ["ALERT", "MONITOR", "IGNORE"]:
                    return {"decision": decision, "reasoning": reasoning}
        except Exception:
            pass

        # Last resort: infer from risk level
        logger.warning("[DecisionAgent] Could not parse Gemini response — inferring from risk")
        return self._infer_from_risk(risk, raw[:400] if raw else "")

    # ──────────────────────────────────────────
    # Rule-Based Fallback
    # ──────────────────────────────────────────

    def _rule_decide(self, event: dict, context: dict, risk: dict) -> dict:
        """Deterministic rule-based decision when Gemini is unavailable."""
        risk_level = risk.get("risk_level", "Normal")
        score = risk.get("anomaly_score", 0.0)
        hour = event.get("hour", 12)
        user_home = event.get("user_home", True)
        event_type = event.get("event", "")

        if risk_level == "Dangerous" or score > 0.75:
            decision = "ALERT"
            reasoning = (
                f"High-risk pattern detected: {event_type} at {event.get('time')} "
                f"with anomaly score {score:.2f}. User home={user_home}. "
                f"Event falls outside expected behavioral baseline — immediate action required."
            )
        elif risk_level == "Suspicious" or score > 0.45:
            decision = "MONITOR"
            reasoning = (
                f"Unusual activity: {event_type} at {event.get('time')} (hour={hour}). "
                f"Anomaly score {score:.2f} is elevated but not critical. "
                f"Pattern partially matches baseline — elevated monitoring recommended."
            )
        else:
            decision = "IGNORE"
            reasoning = (
                f"Event {event_type} at {event.get('time')} matches expected household routine. "
                f"Anomaly score {score:.2f} is within normal range. "
                f"User presence and timing are consistent with 90-day behavioral baseline."
            )

        return {"decision": decision, "reasoning": reasoning}

    def _infer_from_risk(self, risk: dict, raw_text: str) -> dict:
        risk_level = risk.get("risk_level", "Normal")
        if risk_level == "Dangerous":
            return {"decision": "ALERT", "reasoning": raw_text or "High anomaly score — alert triggered."}
        if risk_level == "Suspicious":
            return {"decision": "MONITOR", "reasoning": raw_text or "Elevated anomaly — monitoring."}
        return {"decision": "IGNORE", "reasoning": raw_text or "Normal pattern — ignoring."}
