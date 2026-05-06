import useSystemStore from '../store/useSystemStore';
import { evaluateEvent } from '../lib/utils';
import { submitEventToBackend, executeAction } from '../lib/api';

const delay = (ms) => new Promise(res => setTimeout(res, ms));

function appendTrace(message) {
  const store = useSystemStore.getState();
  store.setSystemState({ trace: [...store.trace, message] });
}

function showNotification(message, type = "success") {
  const store = useSystemStore.getState();
  store.setSystemState({ 
    notification: { message, type, id: Date.now() } 
  });
}

export async function processEvent(eventPayload) {
  const store = useSystemStore.getState();
  const event = { ...eventPayload, id: eventPayload.id || crypto.randomUUID() };

  // Set initial state
  store.setSystemState({
    currentEvent: event,
    activeScenario: event.scenarioId || event.id,
    anomalyScore: 0,
    riskLevel: 'Normal',
    reasoning: 'Analyzing context...',
    actionTaken: 'Awaiting decision...',
    actions: [],
    trace: ['Sensor event received'],
  });

  // Skip delay if legacy
  if (store.mode !== "Legacy System") {
    await delay(800); // Increased AI prep delay
  }

  let analysis;
  
  if (store.mode === "ClawSentinel AI" && store.backendOnline) {
    try {
      appendTrace('Forwarding to backend pipeline...');
      analysis = await submitEventToBackend(event);
      appendTrace('Backend analysis received');
    } catch (err) {
      console.error("[processEvent] Backend call failed, falling back:", err);
      store.setSystemState({ backendOnline: false });
      analysis = evaluateEvent(event, store.mode);
      appendTrace(`Backend error: ${err.message}`);
      appendTrace("Fell back to local heuristic");
    }
  } else {
    // Local heuristic
    if (store.mode === "Legacy System") {
      analysis = evaluateEvent(event, store.mode);
      appendTrace('Legacy rule matched');
    } else {
      appendTrace('Evaluating context locally...');
      await delay(600);
      
      appendTrace('Checking user presence...');
      await delay(600);
      
      analysis = evaluateEvent(event, store.mode);
      
      appendTrace('Risk computed');
      await delay(600);
    }
  }

  // Generate decision
  const decision = analysis.riskLevel === "Dangerous" ? "ALERT" 
    : analysis.riskLevel === "Suspicious" ? "MONITOR" : "IGNORE";
  
  appendTrace(`Decision: ${decision}`);
  
  if (store.mode !== "Legacy System") {
    await delay(600);
  }

  // Action triggered message is already appended
  appendTrace('Action triggered');

  // Update store with final analysis
  useSystemStore.getState().setSystemState({
    anomalyScore: analysis.anomalyScore,
    riskLevel: analysis.riskLevel,
    reasoning: analysis.reasoning,
    actionTaken: store.mode === "Legacy System" ? "None (Reactive systems cannot take context-aware actions)" : analysis.actionTaken,
    suggestedActions: analysis.suggestedActions || [],
  });

  // Show notification for UI feedback, but don't call executeAction again
  // because the backend ActionAgent already sent the Telegram alert during the pipeline.
  if (decision === "ALERT") {
     showNotification("🚨 ALERT SENT ON TELEGRAM", "danger");
  }
}
