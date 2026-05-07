"""
API Routes — ClawSentinel Endpoints
=====================================
POST /event  → Run full 5-agent pipeline
GET  /state  → Return current memory snapshot
GET  /trace  → Return last N decision traces
GET  /health → Health check
"""

import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, Request

from models.schemas import EventInput, PipelineResponse, StateResponse, TraceResponse, ActionInput, TelegramWebhook

logger = logging.getLogger(__name__)

router = APIRouter()


def get_orchestrator(request: Request):
    """Retrieve the shared Orchestrator instance from app state."""
    return request.app.state.orchestrator


# ──────────────────────────────────────────────────────────────
# POST /event
# ──────────────────────────────────────────────────────────────

@router.post(
    "/event",
    response_model=PipelineResponse,
    summary="Submit sensor event to the pipeline",
    description=(
        "Runs the full 5-agent pipeline: "
        "SensorAgent → ContextAgent → RiskAgent → DecisionAgent → ActionAgent. "
        "Returns anomaly score, risk level, decision, reasoning, and full trace."
    ),
)
async def submit_event(payload: EventInput, request: Request) -> PipelineResponse:
    """
    Trigger the ClawSentinel pipeline for an incoming sensor event.

    The pipeline:
    1. Normalizes the raw event (SensorAgent)
    2. Retrieves behavioral context (ContextAgent)
    3. Computes anomaly score via IsolationForest (RiskAgent)
    4. Generates LLM reasoning and decision via Gemini (DecisionAgent)
    5. Executes actions and sends Telegram alert if needed (ActionAgent)
    """
    orchestrator = get_orchestrator(request)
    try:
        result = await orchestrator.run(payload.model_dump())
        return PipelineResponse(**result)
    except Exception as e:
        logger.error(f"[Routes /event] Pipeline error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Pipeline failed: {str(e)}")


# ──────────────────────────────────────────────────────────────
# GET /state
# ──────────────────────────────────────────────────────────────

@router.get(
    "/state",
    response_model=StateResponse,
    summary="Retrieve current memory state",
    description=(
        "Returns the current contents of SOUL.md (long-term baseline), "
        "recent event count, and last N decisions from HEARTBEAT.md."
    ),
)
async def get_state(request: Request) -> StateResponse:
    """Return the agent memory snapshot."""
    orchestrator = get_orchestrator(request)
    try:
        state = orchestrator.get_state()
        return StateResponse(**state)
    except Exception as e:
        logger.error(f"[Routes /state] Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ──────────────────────────────────────────────────────────────
# GET /trace
# ──────────────────────────────────────────────────────────────

@router.get(
    "/trace",
    response_model=TraceResponse,
    summary="Retrieve last N decision traces",
    description=(
        "Returns the last N full pipeline traces for the dashboard timeline. "
        "Each trace contains the event, risk scores, decision, and step-by-step agent log."
    ),
)
async def get_trace(
    request: Request,
    n: int = Query(default=10, ge=1, le=50, description="Number of traces to return"),
) -> TraceResponse:
    """Return rolling history of pipeline executions."""
    orchestrator = get_orchestrator(request)
    try:
        traces = orchestrator.get_traces(n)
        return TraceResponse(**traces)
    except Exception as e:
        logger.error(f"[Routes /trace] Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/action",
    summary="Confirm and execute a physical action",
    description="Explicitly triggers a physical action (like locking a door) that requires human-in-the-loop confirmation.",
)
async def execute_action(payload: ActionInput, request: Request):
    """Execute a confirmed action."""
    orchestrator = get_orchestrator(request)
    try:
        result = await orchestrator.execute_action(payload.action)
        return result
    except Exception as e:
        logger.error(f"[Routes /action] Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/telegram/webhook",
    summary="Handle Telegram callbacks",
    description="Processes button clicks from the Telegram alert message.",
)
async def telegram_webhook(payload: dict, request: Request):
    """Handle incoming Telegram callback queries."""
    orchestrator = get_orchestrator(request)
    try:
        # Simple extraction for demo purposes
        # In production, use python-telegram-bot's Update.de_json
        # Handle button clicks (Legacy Inline buttons or manual callbacks)
        if "callback_query" in payload:
            cb = payload["callback_query"]
            cb_id = cb.get("id")
            action = cb.get("data")
            user = cb.get("from", {}).get("username", "User")
            
            logger.info(f"[Telegram Webhook] Callback '{action}' triggered by @{user}")
            
            # Execute the action
            result = await orchestrator.execute_action(action)
            
            # Answer callback query
            try:
                bot = orchestrator.action_agent._bot
                if bot and cb_id:
                    await bot.answer_callback_query(callback_query_id=cb_id)
            except Exception: pass

            return {"status": "ok", "action": action, "user": user}

        # Handle text messages (from ReplyKeyboardMarkup or manual typing)
        elif "message" in payload:
            msg = payload["message"]
            text = msg.get("text", "")
            user = msg.get("from", {}).get("username", "User")

            logger.info(f"[Telegram Webhook] Text received: '{text}' from @{user}")

            # Map common text phrases to actions (case-insensitive)
            normalized_text = text.lower()
            action = None
            if "secure" in normalized_text:   action = "lock_door"
            elif "record" in normalized_text: action = "start_recording"
            elif "safe" in normalized_text:   action = "dismiss"
            elif "lock" in normalized_text:   action = "lock_door"
            elif "off" in normalized_text:    action = "off_device"
            elif "dismiss" in normalized_text: action = "dismiss"

            if action:
                logger.info(f"[Telegram Webhook] Mapped text '{text}' to action '{action}'")
                result = await orchestrator.execute_action(action)
                return {"status": "ok", "action": action, "user": user}
            else:
                logger.warning(f"[Telegram Webhook] No action mapped for text: '{text}'")
            
        return {"status": "ignored"}
    except Exception as e:
        logger.error(f"[Telegram Webhook] Error: {e}", exc_info=True)
        return {"status": "error", "detail": str(e)}


# ──────────────────────────────────────────────────────────────
# GET /health
# ──────────────────────────────────────────────────────────────

@router.get("/health", summary="Health check")
async def health_check(request: Request):
    """Quick liveness probe."""
    orchestrator = get_orchestrator(request)
    state = orchestrator.get_state()
    return {
        "status": "online",
        "system": "ClawSentinel",
        "pipeline": "5-agent MAS",
        "memory_status": state.get("system_status", "unknown"),
        "events_in_memory": state.get("recent_events_count", 0),
    }
