import React from "react";
import { CheckCircle2, Loader2, ShieldAlert } from "lucide-react";
import PanelHeading from "../ui/PanelHeading";
import ActionButton from "../ui/ActionButton";

export default function ReasoningPanel({ analysis, isThinking, mode }) {
  return (
    <aside className="rounded-lg border border-white/10 bg-white/[0.055] p-4 backdrop-blur-xl">
      <PanelHeading icon={ShieldAlert} title="AI Reasoning" subtitle={mode} />
      <div className="mt-5 rounded-lg border border-white/10 bg-slate-950/45 p-4">
        <div className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-300">
          {isThinking ? <Loader2 className="h-4 w-4 animate-spin text-teal-200" /> : <CheckCircle2 className="h-4 w-4 text-teal-200" />}
          Decision trace
        </div>
        <p className="min-h-32 text-sm leading-6 text-slate-300 transition">
          {isThinking ? "Analyzing time, occupancy, motion, and sensor type..." : analysis.reasoning}
        </p>
      </div>
      <div className="mt-4 rounded-lg border border-white/10 bg-slate-950/45 p-4">
        <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-slate-400">Action Taken</h2>
        <p className="mt-3 text-sm leading-6 text-white">{isThinking ? "Pending model decision." : analysis.actionTaken}</p>
      </div>
      <div className="mt-4 rounded-lg border border-white/10 bg-slate-950/45 p-4">
        <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-slate-400">Suggested Actions</h2>
        <div className="mt-4 grid gap-3">
          {analysis.suggestedActions.map((action) => (
            <ActionButton key={action} action={action} disabled={isThinking} />
          ))}
        </div>
      </div>
    </aside>
  );
}
