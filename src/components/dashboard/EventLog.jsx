import React from "react";
import { Bell } from "lucide-react";
import PanelHeading from "../ui/PanelHeading";
import EmptyState from "../ui/EmptyState";
import { riskStyles } from "../../lib/constants";

export default function EventLog({ eventLog }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.055] p-5 backdrop-blur-xl">
      <PanelHeading icon={Bell} title="Event Log" subtitle="Past scenario evaluations" />
      <div className="mt-5 overflow-hidden rounded-lg border border-white/10">
        {eventLog.length === 0 ? (
          <EmptyState text="Analyzed events will appear here." />
        ) : (
          eventLog.map(({ event, analysis: itemAnalysis }) => (
            <div
              key={event.id}
              className="grid gap-3 border-b border-white/10 bg-slate-950/35 px-4 py-3 text-sm last:border-b-0 md:grid-cols-[88px_1fr_120px_90px]"
            >
              <span className="tabular-nums text-slate-400">{event.time}</span>
              <span className="text-slate-200">{event.scenario}</span>
              <span className="text-slate-400">{event.source}</span>
              <span className={`w-fit rounded-full border px-2 py-1 text-xs ${riskStyles[itemAnalysis.riskLevel]}`}>
                {itemAnalysis.riskLevel}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
