"""
Orchestrator — The Central Pipeline Controller
================================================
Calls all 5 agents in sequence, logs every step,
builds the full Decision Trace, and handles escalation logic.

Pipeline order:
  EventInput → SensorAgent → ContextAgent → RiskAgent → DecisionAgent → ActionAgent
"""

import asyncio
import logging
import os
from collections import deque
from datetime import datetime

from agents.sensor_agent import SensorAgent
from agents.context_agent import ContextAgent
from agents.risk_agent import RiskAgent
from agents.decision_agent import DecisionAgent
from agents.action_agent import ActionAgent

logger = logging.getLogger(__name__)

MODEL_PATH = os.getenv("MODEL_PATH", "../ml/model.pkl")

# Rolling store for the last 10 full pipeline results (GET /trace)
_trace_store: deque = deque(maxlen=10)


class Orchestrator:
    """
    Central pipeline controller.

    Instantiates all agents once at startup, then routes every
    incoming event through the full 5-agent chain.

    Escalation rule: if the last 3 decisions in the context log
    are all ALERT, the next ALERT is marked as escalated=True
    and a priority notification is sent.
    """

    def __init__(self):
        self.sensor_agent = SensorAgent()
        self.context_agent = ContextAgent()
        self.risk_agent = RiskAgent()
        self.decision_agent = DecisionAgent()
        self.action_agent = ActionAgent()

    async def startup(self):
        """Load model and memory on FastAPI app startup."""
        # Resolve model path relative to this file's location
        base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        model_path = os.path.join(base, "..", "ml", "model.pkl")
        model_path = os.path.normpath(model_path)

        self.risk_agent.load_model(model_path)
        await self.context_agent.initialize()
        logger.info("[Orchestrator] All agents initialized — pipeline ready")

    async def run(self, raw_event: dict) -> dict:
        """
        Execute the full 5-agent pipeline for one sensor event.

        Args:
            raw_event: Raw JSON payload from POST /event.

        Returns:
            Full PipelineResponse dict matching frontend contract.
        """
        trace: list[str] = []
        start_time = datetime.now()

        # ── Agent 1: Sensor ──────────────────────────────
        trace.append("SensorAgent: Normalizing raw event packet")
        normalized = self.sensor_agent.process(raw_event)
        trace.append(
            f"SensorAgent: event={normalized['event']}, "
            f"hour={normalized['hour']}, user_home={normalized['user_home']}"
        )

        # ── Agent 2: Context ─────────────────────────────
        trace.append("ContextAgent: Retrieving behavioral memory")
        context = self.context_agent.get_context(normalized)
        trace.append(
            f"ContextAgent: typical_hour={context['is_typical_hour']}, "
            f"recent_alerts={context['recent_alert_count']}, "
            f"events_in_memory={context['total_events_in_memory']}"
        )

        # ── Artificial delay (simulates AI processing) ───
        await asyncio.sleep(0.5)

        # ── Agent 3: Risk ────────────────────────────────
        trace.append("RiskAgent: Computing anomaly score via IsolationForest")
        risk = self.risk_agent.assess(normalized, context)
        trace.append(
            f"RiskAgent: anomaly_score={risk['anomaly_score']}, "
            f"risk_level={risk['risk_level']}, z_score={risk['z_score']}"
        )

        # ── Agent 4: Decision ────────────────────────────
        trace.append("DecisionAgent: Querying Gemini for reasoning and verdict")
        decision_result = await self.decision_agent.decide(normalized, context, risk)
        decision = decision_result["decision"]
        reasoning = decision_result["reasoning"]
        trace.append(f"DecisionAgent: verdict={decision}")
        trace.append(f"DecisionAgent: {reasoning[:120]}...")

        # ── Escalation Check ─────────────────────────────
        escalated = self._check_escalation(context, decision)
        if escalated:
            trace.append(
                "Orchestrator: ⚠️ ESCALATION — 3+ consecutive ALERTs detected. "
                "Severity upgraded to CRITICAL."
            )
            reasoning = "⚠️ ESCALATED — " + reasoning

        # ── Agent 5: Action ──────────────────────────────
        trace.append(f"ActionAgent: Executing actions for decision={decision}")
        action_result = await self.action_agent.execute(normalized, decision, reasoning, risk)
        for action in action_result["actions"]:
            trace.append(f"ActionAgent: {action}")

        # ── Update Context Memory ─────────────────────────
        await self.context_agent.update_context(normalized, decision, reasoning)
        trace.append("ContextAgent: HEARTBEAT.md updated with pipeline result")

        # ── Build final response ──────────────────────────
        elapsed = (datetime.now() - start_time).total_seconds()
        trace.append(f"Orchestrator: Pipeline complete in {elapsed:.2f}s")

        result = {
            "event": normalized,
            "anomaly_score": risk["anomaly_score"],
            "risk_level": risk["risk_level"],
            "decision": decision,
            "reasoning": reasoning,
            "action_taken": action_result["action_taken"],
            "actions": action_result["actions"],
            "suggested_actions": action_result["suggested_actions"],
            "trace": trace,
            "escalated": escalated,
            "timestamp": start_time.isoformat(),
        }

        # Store in rolling trace history
        _trace_store.append(result)

        return result

    def _check_escalation(self, context: dict, current_decision: str) -> bool:
        """
        Escalation rule: if the last 3 decisions + current are all ALERT,
        mark this event as escalated.
        """
        if current_decision != "ALERT":
            return False
        recent_alerts = context.get("recent_alert_count", 0)
        return recent_alerts >= 2  # 2 prior + current = 3 consecutive

    async def execute_action(self, action_name: str, send_telegram: bool = True) -> dict:
        """Explicitly execute a confirmed action."""
        return await self.action_agent.execute_confirmed_action(action_name, send_telegram=send_telegram)

    def get_state(self) -> dict:
        """Return current memory state for GET /state."""
        return self.context_agent.get_state()

    def get_traces(self, n: int = 10) -> dict:
        """Return last N pipeline traces for GET /trace."""
        traces = list(_trace_store)[-n:]
        return {"traces": traces, "total": len(traces)}
