import React from "react";
import { Activity } from "lucide-react";
import RiskBadge from "../ui/RiskBadge";
import EventCard from "./EventCard";
import AnomalyScore from "./AnomalyScore";
import EventLog from "./EventLog";
import HouseScene from "../HouseScene";
import Timeline from "./Timeline";

export default function CenterPanel({ activeScenario, currentEvent, analysis, eventLog, timeline, isThinking }) {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full border border-white/10 bg-white/5 flex items-center justify-center">
            <Activity className="h-4 w-4 text-emerald-400" />
          </div>
          <h2 className="text-lg font-medium tracking-wide text-white">System Analysis</h2>
        </div>
        <RiskBadge risk={analysis.riskLevel} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <EventCard currentEvent={currentEvent} isThinking={isThinking} />
        <AnomalyScore analysis={analysis} isThinking={isThinking} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[2.3fr_1fr]">
        <div className="rounded-[2rem] border border-white/5 bg-white/[0.02] backdrop-blur-2xl p-6 xl:p-8 flex flex-col min-h-[400px]">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="h-4 w-4 text-slate-400" />
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Anomaly Visualization</h3>
          </div>
          <div className="flex-1 rounded-lg overflow-hidden relative">
            <HouseScene />
          </div>
        </div>

        <Timeline timeline={timeline} />
      </div>
    </section>
  );
}
