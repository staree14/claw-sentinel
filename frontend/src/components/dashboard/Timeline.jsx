import React from "react";
import { Clock } from "lucide-react";
import { dotColor } from "../../lib/utils";

export default function Timeline({ timeline }) {
  return (
    <div className="rounded-[2rem] border border-white/5 bg-white/[0.02] backdrop-blur-2xl p-6 xl:p-8 flex flex-col flex-1">
      <div className="flex items-center gap-3 mb-6">
        <Clock className="h-4 w-4 text-slate-400" />
        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Timeline</h3>
      </div>
      
      <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scroll max-h-[300px]">
        {timeline.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm font-light text-slate-500 tracking-wide">No events recorded in current session</p>
          </div>
        ) : (
          timeline.slice(0, 10).map(({ event, analysis: itemAnalysis }) => (
            <div key={event.id || Math.random()} className="flex items-center gap-4 group">
              <div className={`h-2.5 w-2.5 rounded-full ${dotColor(itemAnalysis.riskLevel)} group-hover:scale-125 transition-transform shrink-0`} />
              <div className="h-px flex-1 bg-gradient-to-r from-white/5 to-transparent min-w-[20px]" />
              <div className="flex flex-col items-end shrink-0">
                <span className="text-sm font-medium text-slate-300">
                  {event.scenario || (event.event ? event.event.replace("_", " ") : "Unknown Event")}
                </span>
                <span className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">{event.time}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
