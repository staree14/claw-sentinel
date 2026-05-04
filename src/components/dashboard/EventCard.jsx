import React from "react";
import { Loader2 } from "lucide-react";
import Metric from "../ui/Metric";
import EmptyState from "../ui/EmptyState";

export default function EventCard({ currentEvent, isThinking }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/45 p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-slate-400">Current Event</h2>
        {isThinking ? (
          <span className="flex items-center gap-2 text-sm text-teal-100">
            <Loader2 className="h-4 w-4 animate-spin" />
            AI thinking
          </span>
        ) : null}
      </div>
      {currentEvent ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Metric label="Time" value={currentEvent.time} />
          <Metric label="Event" value={currentEvent.event} />
          <Metric label="User Home" value={currentEvent.user_home ? "Yes" : "No"} />
          <Metric label="Motion" value={currentEvent.motion ? "Detected" : "None"} />
          <div className="sm:col-span-2">
            <p className="text-sm leading-6 text-slate-300">{currentEvent.description}</p>
          </div>
        </div>
      ) : (
        <EmptyState text="Choose a scenario to stream a simulated sensor event." />
      )}
    </div>
  );
}
