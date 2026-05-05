/**
 * api.js — ClawSentinel Backend API Service
 * Connects the frontend to the FastAPI 5-agent pipeline.
 * Falls back to local evaluateEvent() if backend is unreachable.
 */

const BACKEND_URL = "http://localhost:8000";

/**
 * Helper to map snake_case backend response to camelCase frontend shape
 */
function mapBackendAnalysis(data) {
  return {
    anomalyScore: data.anomaly_score,
    riskLevel: data.risk_level,
    reasoning: data.reasoning,
    actionTaken: data.action_taken,
    suggestedActions: data.suggested_actions || [],
    decision: data.decision,
    actions: data.actions || [],
    trace: data.trace || [],
    escalated: data.escalated || false,
    timestamp: data.timestamp,
  };
}

/**
 * POST /event — run the full 5-agent pipeline
 */
export async function submitEventToBackend(event) {
  const res = await fetch(`${BACKEND_URL}/event`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
  });
  if (!res.ok) throw new Error(`Backend error: ${res.status}`);
  const data = await res.json();

  return mapBackendAnalysis(data);
}

/** GET /state — retrieve memory snapshot */
export async function getBackendState() {
  const res = await fetch(`${BACKEND_URL}/state`);
  if (!res.ok) throw new Error(`State fetch error: ${res.status}`);
  return res.json();
}

/** GET /trace?n=N — retrieve last N pipeline traces */
export async function getBackendTrace(n = 10) {
  const res = await fetch(`${BACKEND_URL}/trace?n=${n}`);
  if (!res.ok) throw new Error(`Trace fetch error: ${res.status}`);
  const data = await res.json();
  
  // Map internal traces
  return {
    ...data,
    traces: data.traces.map(t => ({
      event: t.event,
      analysis: mapBackendAnalysis(t)
    }))
  };
}

/** POST /action — execute a confirmed action */
export async function executeAction(action, eventId = null) {
  const res = await fetch(`${BACKEND_URL}/action`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, event_id: eventId }),
  });
  if (!res.ok) throw new Error(`Action execution failed: ${res.status}`);
  return res.json();
}


/** GET /health — check if backend is online */
export async function checkBackendHealth() {
  try {
    const res = await fetch(`${BACKEND_URL}/health`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

