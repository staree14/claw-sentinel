import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import TopBar from "./dashboard/TopBar";
import ScenarioPanel from "./dashboard/ScenarioPanel";
import CenterPanel from "./dashboard/CenterPanel";
import ReasoningPanel from "./dashboard/ReasoningPanel";
import { evaluateEvent } from "../lib/utils";

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
  });
  const [eventLog, setEventLog] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const [activeScenario, setActiveScenario] = useState(null);

  useEffect(() => {
    if (!currentEvent || isThinking) return;
    setAnalysis(evaluateEvent(currentEvent, mode));
  }, [currentEvent, isThinking, mode]);

  const triggerScenario = (scenario) => {
    const event = { ...scenario.event, id: crypto.randomUUID(), scenario: scenario.label };
    setActiveScenario(scenario.id);
    setCurrentEvent(event);
    setIsThinking(true);

    window.setTimeout(() => {
      const nextAnalysis = evaluateEvent(event, mode);
      setAnalysis(nextAnalysis);
      setEventLog((items) => [{ event, analysis: nextAnalysis }, ...items].slice(0, 8));
      setIsThinking(false);
    }, 600);
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
        <TopBar system={system} setSystem={setSystem} mode={mode} setMode={setMode} />
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
          <ReasoningPanel analysis={analysis} isThinking={isThinking} mode={mode} />
        </section>
      </div>
    </motion.main>
  );
}
