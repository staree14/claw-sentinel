import React from "react";
import { Activity, Clock } from "lucide-react";
import RiskBadge from "../ui/RiskBadge";
import EventCard from "./EventCard";
import AnomalyScore from "./AnomalyScore";
import EventLog from "./EventLog";
import { dotColor } from "../../lib/utils";
import HouseScene from "../HouseScene";

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

      <div className="grid gap-6 xl:grid-cols-2 mt-auto">
        <div className="rounded-[2rem] border border-white/5 bg-white/[0.02] backdrop-blur-2xl p-6 xl:p-8 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="h-4 w-4 text-slate-400" />
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Anomaly Visualization</h3>
          </div>
          <div className="flex-1 min-h-[220px] rounded-lg overflow-hidden relative">
            <HouseScene />
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/5 bg-white/[0.02] backdrop-blur-2xl p-6 xl:p-8 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="h-4 w-4 text-slate-400" />
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Timeline</h3>
          </div>
          
          <div className="space-y-4 flex-1">
            {timeline.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm font-light text-slate-500 tracking-wide">No events recorded in current session</p>
              </div>
            ) : (
              timeline.slice(0, 4).map(({ event, analysis: itemAnalysis }) => (
                <div key={event.id || Math.random()} className="flex items-center gap-4 group">
                  <div className={`h-2.5 w-2.5 rounded-full ${dotColor(itemAnalysis.riskLevel)} group-hover:scale-125 transition-transform`} />
                  <div className="h-px flex-1 bg-gradient-to-r from-white/5 to-transparent" />
                  <span className="text-sm font-medium text-slate-300 min-w-[140px] truncate">
                    {event.scenario || (event.event ? event.event.replace("_", " ") : "Unknown Event")}
                  </span>
                  <span className="w-16 text-right text-xs uppercase tracking-widest text-slate-500">{event.time}</span>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
