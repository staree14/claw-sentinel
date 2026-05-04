import React from "react";
import { CheckCircle2, Loader2, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PanelHeading from "../ui/PanelHeading";
import ActionButton from "../ui/ActionButton";

export default function ReasoningPanel({ analysis, isThinking, mode }) {
  return (
    <aside className="rounded-[2rem] border border-white/5 bg-white/[0.02] backdrop-blur-2xl p-6 xl:p-8 flex flex-col">
      <PanelHeading icon={ShieldAlert} title="AI Engine" subtitle={mode} />
      
      <div className="mt-8 flex-1 flex flex-col gap-6">
        <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-5">
          <div className="mb-4 flex items-center gap-3 text-xs uppercase tracking-[0.2em] font-medium text-slate-500">
            {isThinking ? <Loader2 className="h-4 w-4 animate-spin text-cyan-400" /> : <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
            Decision Trace
          </div>
          <AnimatePresence mode="wait">
            <motion.p
              key={isThinking ? "thinking" : analysis.reasoning}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.3 }}
              className={`min-h-[120px] text-[15px] leading-relaxed font-light ${isThinking ? "text-slate-500" : "text-slate-300"}`}
            >
              {isThinking ? "Analyzing time, occupancy, motion, and sensor type sequence..." : analysis.reasoning}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-5">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">System Action</h2>
          <AnimatePresence mode="wait">
            <motion.p
              key={isThinking ? "pending" : analysis.actionTaken}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`mt-3 text-[15px] font-medium leading-relaxed ${isThinking ? "text-slate-500" : "text-emerald-400"}`}
            >
              {isThinking ? "Awaiting decision matrix..." : analysis.actionTaken}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-5 mt-auto">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 mb-4">Recommended Operator Actions</h2>
          <div className="grid gap-3">
            {analysis.suggestedActions.map((action) => (
              <ActionButton key={action} action={action} disabled={isThinking} />
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
