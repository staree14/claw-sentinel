import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import TopBar from "./dashboard/TopBar";
import ScenarioPanel from "./dashboard/ScenarioPanel";
import CenterPanel from "./dashboard/CenterPanel";
import ReasoningPanel from "./dashboard/ReasoningPanel";
import { evaluateEvent } from "../lib/utils";
import { submitEventToBackend, checkBackendHealth, getBackendTrace, executeAction } from "../lib/api";

export default function Dashboard() {
  const [system, setSystem] = useState("Simulation Mode");
  const [mode, setMode] = useState("ClawSentinel AI");
  const [currentEvent, setCurrentEvent] = useState(null);
  const [analysis, setAnalysis] = useState({
    anomalyScore: 0,
    riskLevel: "Normal",
    reasoning: "System initialized. Awaiting sensor telemetry.",
    actionTaken: "Standing by.",
    suggestedActions: ["Ignore", "Log event", "Maintain schedule"],
    decision: null,
    trace: [],
    escalated: false,
  });
  const [eventLog, setEventLog] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const [activeScenario, setActiveScenario] = useState(null);
  const [backendOnline, setBackendOnline] = useState(false);

  // Initial sync with backend
  useEffect(() => {
    async function sync() {
      const online = await checkBackendHealth();
      setBackendOnline(online);
      
      if (online) {
        setSystem("Live Mode");
        try {
          const { traces } = await getBackendTrace(8);
          if (traces && traces.length > 0) {
            // Backend returns oldest first, so we keep that order in eventLog
            // because timeline reverses it to show newest first.
            setEventLog(traces);
            
            // Set the most recent one as current
            const latest = traces[traces.length - 1];
            setCurrentEvent(latest.event);
            setAnalysis(latest.analysis);
            setActiveScenario(latest.event.id || null);
          }
        } catch (err) {
          console.error("[Dashboard] Initial sync failed:", err);
        }
      }
    }
    sync();
  }, []);

  const triggerScenario = async (scenario) => {
    const event = { ...scenario.event, id: crypto.randomUUID(), scenario: scenario.label };
    setActiveScenario(scenario.id);
    setCurrentEvent(event);
    setIsThinking(true);

    try {
      let nextAnalysis;

      if (mode === "ClawSentinel AI" && backendOnline) {
        // ── Real backend: 5-agent pipeline ──────────────────
        nextAnalysis = await submitEventToBackend(event);
      } else {
        // ── Fallback: local heuristic (Legacy or offline) ───
        await new Promise((r) => setTimeout(r, 600));
        nextAnalysis = evaluateEvent(event, mode);
        nextAnalysis.decision = nextAnalysis.riskLevel === "Dangerous" ? "ALERT"
          : nextAnalysis.riskLevel === "Suspicious" ? "MONITOR" : "IGNORE";
        nextAnalysis.trace = ["Local heuristic engine used (backend offline or Legacy mode)"];
        nextAnalysis.escalated = false;
      }

      setAnalysis(nextAnalysis);
      setEventLog((items) => [...items, { event, analysis: nextAnalysis }].slice(-8));
    } catch (err) {
      console.error("[Dashboard] Backend call failed, falling back:", err);
      // Graceful fallback
      const fallback = evaluateEvent(event, mode);
      fallback.decision = "MONITOR";
      fallback.trace = [`Backend error: ${err.message}`, "Fell back to local heuristic"];
      fallback.escalated = false;
      setAnalysis(fallback);
      setEventLog((items) => [...items, { event, analysis: fallback }].slice(-8));
      setBackendOnline(false);
      setSystem("Simulation Mode (Backend Offline)");
    } finally {
      setIsThinking(false);
    }
  };

  const handleAction = async (actionName) => {
    if (!backendOnline) {
      console.warn("Backend offline, simulating action locally:", actionName);
      return;
    }
    try {
      await executeAction(actionName, currentEvent?.id);
    } catch (err) {
      console.error("Failed to execute action:", err);
    }
  };

  const timeline = useMemo(() => eventLog.slice().reverse(), [eventLog]);

  return (
    <motion.main
      key="dashboard"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="min-h-screen overflow-hidden bg-[#0B0F14] text-slate-100 font-sans selection:bg-emerald-500/30"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(20,184,166,0.08),transparent_50%),radial-gradient(ellipse_at_top_right,rgba(15,23,42,0.5),transparent_50%)]" />
      
      <div className="relative flex min-h-screen flex-col mx-auto max-w-[1600px]">
        <TopBar
          system={system}
          setSystem={setSystem}
          mode={mode}
          setMode={setMode}
          backendOnline={backendOnline}
        />
        <section className="grid flex-1 grid-cols-1 gap-6 p-6 lg:grid-cols-[300px_minmax(0,1fr)_340px]">
          <ScenarioPanel activeScenario={activeScenario} onTrigger={triggerScenario} />
          <CenterPanel
            activeScenario={activeScenario}
            currentEvent={currentEvent}
            analysis={analysis}
            eventLog={eventLog}
            timeline={timeline}
            isThinking={isThinking}
          />
          <ReasoningPanel 
            analysis={analysis} 
            isThinking={isThinking} 
            mode={mode} 
            backendOnline={backendOnline} 
            onAction={handleAction}
          />
        </section>
      </div>
    </motion.main>
  );
}

