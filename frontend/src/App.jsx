import React, { useEffect, useMemo, useState } from "react";
import TopBar from "./components/dashboard/TopBar";
import ScenarioPanel from "./components/dashboard/ScenarioPanel";
import CenterPanel from "./components/dashboard/CenterPanel";
import ReasoningPanel from "./components/dashboard/ReasoningPanel";
import { evaluateEvent } from "./lib/utils";

export default function App() {
  const [system, setSystem] = useState("Simulation Mode");
  const [mode, setMode] = useState("ClawSentinel AI");
  const [currentEvent, setCurrentEvent] = useState(null);
  const [analysis, setAnalysis] = useState({
    anomalyScore: 0,
    riskLevel: "Normal",
    reasoning: "Select a scenario to begin live analysis.",
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
    }, 500);
  };

  const timeline = useMemo(() => eventLog.slice().reverse(), [eventLog]);

  return (
    <main className="min-h-screen overflow-hidden bg-[#080b10] text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.12),transparent_34%),linear-gradient(135deg,rgba(15,23,42,0.88),rgba(8,11,16,0.96)_48%,rgba(28,25,23,0.82))]" />
      <div className="relative flex min-h-screen flex-col">
        <TopBar system={system} setSystem={setSystem} mode={mode} setMode={setMode} />
        <section className="grid flex-1 grid-cols-1 gap-4 px-4 pb-4 lg:grid-cols-[310px_minmax(0,1fr)_360px]">
          <ScenarioPanel activeScenario={activeScenario} onTrigger={triggerScenario} />
          <CenterPanel
            currentEvent={currentEvent}
            analysis={analysis}
            eventLog={eventLog}
            timeline={timeline}
            isThinking={isThinking}
          />
          <ReasoningPanel analysis={analysis} isThinking={isThinking} mode={mode} />
        </section>
      </div>
    </main>
  );
}
