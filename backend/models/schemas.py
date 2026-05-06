from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime


class EventInput(BaseModel):
    """Raw sensor event payload from the frontend or IoT device."""
    time: str = Field(..., example="03:00", description="Time in HH:MM format")
    event: str = Field(..., example="door_open", description="Sensor event type")
    user_home: bool = Field(..., description="Whether user is currently home")
    motion: bool = Field(..., description="Whether motion was detected")
    source: str = Field(default="unknown", description="Sensor/camera source ID")
    description: Optional[str] = Field(None, description="Human-readable event description")
    id: Optional[str] = Field(None, description="Unique event ID from frontend")
    scenario: Optional[str] = Field(None, description="Scenario label (simulation mode)")


class RiskAssessment(BaseModel):
    anomaly_score: float
    risk_level: str   # Normal | Suspicious | Dangerous
    z_score: float
    raw_score: Optional[float] = None


class DecisionOutput(BaseModel):
    decision: str     # ALERT | MONITOR | IGNORE
    reasoning: str


class PipelineResponse(BaseModel):
    """Full response returned by POST /event — mirrors frontend evaluateEvent() contract."""
    event: dict
    anomaly_score: float
    risk_level: str
    decision: str
    reasoning: str
    action_taken: str
    actions: List[str]
    suggested_actions: List[str]
    trace: List[str]
    escalated: bool = False
    timestamp: str


class StateResponse(BaseModel):
    """Response for GET /state — returns current memory snapshot."""
    soul_baseline: str
    recent_events_count: int
    recent_decisions: List[dict]
    system_status: str


class TraceResponse(BaseModel):
    """Response for GET /trace — returns last N decision traces."""
    traces: List[dict]
    total: int


class ActionInput(BaseModel):
    """Request payload for executing a confirmed action."""
    action: str = Field(..., example="Lock door")
    event_id: Optional[str] = None


class TelegramWebhook(BaseModel):
    # Flexible schema for raw Telegram updates
    update_id: int
    callback_query: Optional[dict] = None
    message: Optional[dict] = None
