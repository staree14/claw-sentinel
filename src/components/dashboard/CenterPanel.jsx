import React from "react";
import { Bot, Clock3, Sparkles } from "lucide-react";
import PanelHeading from "../ui/PanelHeading";
import RiskBadge from "../ui/RiskBadge";
import EventCard from "./EventCard";
import AnomalyScore from "./AnomalyScore";
import EmptyState from "../ui/EmptyState";
import EventLog from "./EventLog";
import { dotColor } from "../../lib/utils";

export default function CenterPanel({ currentEvent, analysis, eventLog, timeline, isThinking }) {
  return (
    <section className="grid min-h-[680px] grid-rows-[auto_1fr_auto] gap-4">
      <div className="rounded-lg border border-white/10 bg-white/[0.055] p-5 backdrop-blur-xl">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <PanelHeading icon={Bot} title="Event Analysis" subtitle="Live sensor event and anomaly signal" />
          <RiskBadge risk={analysis.riskLevel} />
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
          <EventCard currentEvent={currentEvent} isThinking={isThinking} />
          <AnomalyScore analysis={analysis} isThinking={isThinking} />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_0.95fr]">
        <div className="rounded-lg border border-white/10 bg-white/[0.055] p-5 backdrop-blur-xl">
          <PanelHeading icon={Sparkles} title="Anomaly Visualization" subtitle="Context-weighted risk profile" />
          <div className="mt-6 grid grid-cols-12 items-end gap-2 rounded-lg border border-white/10 bg-slate-950/45 p-4">
            {Array.from({ length: 24 }).map((_, index) => {
              const hour = index;
              const activeHour = currentEvent ? Number(currentEvent.time.split(":")[0]) : -1;
              const height = 18 + ((index * 17) % 56);
              const isActive = hour === activeHour;
              return (
                <div key={hour} className="col-span-1 flex min-h-44 flex-col justify-end gap-2">
                  <div
                    className={`rounded-t transition-all duration-500 ${
                      isActive ? "bg-teal-200 shadow-glow" : "bg-slate-700/70"
                    }`}
                    style={{ height: `${isActive ? Math.max(height, 88) : height}px` }}
                  />
                  <span className="hidden text-center text-[10px] text-slate-500 sm:block">
                    {hour % 6 === 0 ? `${String(hour).padStart(2, "0")}` : ""}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.055] p-5 backdrop-blur-xl">
          <PanelHeading icon={Clock3} title="Timeline" subtitle="Recent sensor decisions" />
          <div className="mt-6 space-y-3">
            {timeline.length === 0 ? (
              <EmptyState text="No scenarios have been triggered yet." />
            ) : (
              timeline.map(({ event, analysis: itemAnalysis }) => (
                <div key={event.id} className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${dotColor(itemAnalysis.riskLevel)}`} />
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="w-14 text-right text-sm tabular-nums text-slate-400">{event.time}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <EventLog eventLog={eventLog} />
    </section>
  );
}
