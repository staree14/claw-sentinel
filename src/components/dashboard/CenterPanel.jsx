import React from "react";
import { Bot, Clock3 } from "lucide-react";
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

      <div className="grid gap-4">
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
