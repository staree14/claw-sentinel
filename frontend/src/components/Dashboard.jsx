import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import TopBar from "./dashboard/TopBar";
import ScenarioPanel from "./dashboard/ScenarioPanel";
import CenterPanel from "./dashboard/CenterPanel";
import ReasoningPanel from "./dashboard/ReasoningPanel";
import Toast from "./ui/Toast";
import useSystemStore from "../store/useSystemStore";
import { checkBackendHealth, getBackendTrace, executeAction } from "../lib/api";
import { processEvent } from "../core/processEvent";

export default function Dashboard() {
  const [system, setSystem] = useState("Simulation Mode");
  const store = useSystemStore();
  const [eventLog, setEventLog] = useState([]);
  const [isThinking, setIsThinking] = useState(false);

  // Watch for currentEvent changes to handle isThinking
  useEffect(() => {
    if (store.reasoning === 'Analyzing context...' || store.actionTaken === 'Awaiting decision...') {
      setIsThinking(true);
    } else {
      setIsThinking(false);
      
      // Update eventLog only when reasoning finishes
      if (store.currentEvent && store.reasoning !== 'Analyzing context...') {
        setEventLog(prev => {
          const exists = prev.find(p => p.event.id === store.currentEvent.id);
          if (exists) {
            return prev.map(p => p.event.id === store.currentEvent.id ? { event: store.currentEvent, analysis: store } : p);
          }
          return [...prev, { event: store.currentEvent, analysis: store }].slice(-8);
        });
      }
    }
  }, [store.currentEvent, store.reasoning, store.actionTaken]);

  // Initial sync with backend
  useEffect(() => {
    async function sync() {
      const online = await checkBackendHealth();
      store.setSystemState({ backendOnline: online });
      
      if (online) {
        setSystem("Live Mode");
        try {
          const { traces } = await getBackendTrace(8);
          if (traces && traces.length > 0) {
            setEventLog(traces);
            const latest = traces[traces.length - 1];
            store.setSystemState({
              currentEvent: latest.event,
              anomalyScore: latest.analysis.anomalyScore,
              riskLevel: latest.analysis.riskLevel,
              reasoning: latest.analysis.reasoning,
              actionTaken: latest.analysis.actionTaken,
              suggestedActions: latest.analysis.suggestedActions || [],
              trace: latest.analysis.trace || [],
              activeScenario: latest.event.id || null,
            });
          }
        } catch (err) {
          console.error("[Dashboard] Initial sync failed:", err);
        }
      }
    }
    sync();
  }, []);

  const triggerScenario = (scenario) => {
    processEvent({ ...scenario.event, scenarioId: scenario.id, scenarioLabel: scenario.label });
  };

  const handleAction = async (actionName) => {
    if (!store.backendOnline) {
      console.warn("Backend offline, simulating action locally:", actionName);
      store.setSystemState({ trace: [...store.trace, `Simulated Action: ${actionName}`] });
      return;
    }
    try {
      await executeAction(actionName, store.currentEvent?.id);
      store.setSystemState({ trace: [...store.trace, `Executed Action: ${actionName}`] });
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
          mode={store.mode}
          setMode={(mode) => store.setSystemState({ mode })}
          backendOnline={store.backendOnline}
        />
        <section className="grid flex-1 grid-cols-1 gap-6 p-6 lg:grid-cols-[300px_minmax(0,1fr)_340px]">
          <ScenarioPanel activeScenario={store.activeScenario} onTrigger={triggerScenario} />
          <CenterPanel
            activeScenario={store.activeScenario}
            currentEvent={store.currentEvent}
            analysis={store}
            eventLog={eventLog}
            timeline={timeline}
            isThinking={isThinking}
          />
          <ReasoningPanel 
            analysis={store} 
            isThinking={isThinking} 
            mode={store.mode} 
            backendOnline={store.backendOnline} 
            onAction={handleAction}
          />
        </section>
      </div>
      <Toast />
    </motion.main>
  );
}
