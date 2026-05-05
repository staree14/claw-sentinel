import useSystemStore from '../store/useSystemStore';
import { evaluateEvent } from '../lib/utils';
import { submitEventToBackend, executeAction } from '../lib/api';

const delay = (ms) => new Promise(res => setTimeout(res, ms));

function appendTrace(message) {
  const store = useSystemStore.getState();
  store.setSystemState({ trace: [...store.trace, message] });
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

  await delay(500);

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
    appendTrace('Evaluating context locally...');
    await delay(300);
    
    appendTrace('Checking user presence...');
    await delay(300);
    
    analysis = evaluateEvent(event, store.mode);
    
    appendTrace('Risk computed');
    await delay(300);
  }

  // Generate decision
  const decision = analysis.riskLevel === "Dangerous" ? "ALERT" 
    : analysis.riskLevel === "Suspicious" ? "MONITOR" : "IGNORE";
  
  appendTrace(`Decision: ${decision}`);
  await delay(300);

  appendTrace('Action triggered');

  // Update store with final analysis
  useSystemStore.getState().setSystemState({
    anomalyScore: analysis.anomalyScore,
    riskLevel: analysis.riskLevel,
    reasoning: analysis.reasoning,
    actionTaken: analysis.actionTaken,
    suggestedActions: analysis.suggestedActions || [],
  });

  // Automatically execute action if dangerous and backend is online
  if (decision === "ALERT" && store.backendOnline) {
     executeAction("Alert user", event.id).catch(err => console.error(err));
  }
}
