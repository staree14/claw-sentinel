import React from "react";
import { CheckCircle2, Loader2, ShieldAlert, Terminal, Zap, WifiOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PanelHeading from "../ui/PanelHeading";
import ActionButton from "../ui/ActionButton";

// Decision badge colours
const DECISION_STYLE = {
  ALERT:   "border-rose-400/40 bg-rose-400/10 text-rose-300",
  MONITOR: "border-amber-300/40 bg-amber-300/10 text-amber-200",
  IGNORE:  "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
};

export default function ReasoningPanel({ analysis, isThinking, mode, backendOnline, onAction }) {
  const decision = analysis.decision;
  const trace = analysis.trace || [];
  const escalated = analysis.escalated || false;

  return (
    <aside className="rounded-[2rem] border border-white/5 bg-white/[0.02] backdrop-blur-2xl p-6 xl:p-8 flex flex-col gap-5 overflow-y-auto">
      <PanelHeading icon={ShieldAlert} title="AI Engine" subtitle={mode} />

      {/* Backend status pill */}
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-semibold uppercase tracking-widest w-fit ${
        backendOnline
          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-400"
          : "border-slate-600/40 bg-slate-600/10 text-slate-500"
      }`}>
        {backendOnline
          ? <><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Live Backend</>
          : <><WifiOff className="w-3 h-3" />Local Mode</>
        }
      </div>

      {/* Escalation banner */}
      <AnimatePresence>
        {escalated && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 flex items-center gap-3"
          >
            <Zap className="h-4 w-4 text-rose-400 shrink-0" />
            <p className="text-xs text-rose-300 font-medium">
              ⚠️ ESCALATED — 3+ consecutive alerts detected
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decision badge */}
      {decision && !isThinking && (
        <AnimatePresence mode="wait">
          <motion.div
            key={decision}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className={`rounded-xl border px-4 py-3 flex items-center justify-between ${DECISION_STYLE[decision] ?? DECISION_STYLE.IGNORE}`}
          >
            <span className="text-xs font-bold uppercase tracking-[0.2em]">Verdict</span>
            <span className="text-sm font-bold tracking-wide">{decision}</span>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Decision Trace / Reasoning */}
      <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-5">
        <div className="mb-4 flex items-center gap-3 text-xs uppercase tracking-[0.2em] font-medium text-slate-500">
          {isThinking
            ? <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
            : <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
          Decision Trace
        </div>
        <AnimatePresence mode="wait">
          <motion.p
            key={isThinking ? "thinking" : analysis.reasoning}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.3 }}
            className={`text-[14px] leading-relaxed font-light ${isThinking ? "text-slate-500" : "text-slate-300"}`}
          >
            {isThinking
              ? "Querying Gemini — analyzing time, occupancy, motion, and sensor sequence..."
              : analysis.reasoning}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* System Action */}
      <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-5">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">System Action</h2>
        <AnimatePresence mode="wait">
          <motion.p
            key={isThinking ? "pending" : analysis.actionTaken}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`mt-3 text-[14px] font-medium leading-relaxed ${isThinking ? "text-slate-500" : "text-emerald-400"}`}
          >
            {isThinking ? "Awaiting decision matrix..." : analysis.actionTaken}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Agent Trace Log (real backend only) */}
      {trace.length > 0 && !isThinking && (
        <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-5">
          <div className="flex items-center gap-2 mb-3">
            <Terminal className="h-3.5 w-3.5 text-slate-500" />
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Pipeline Log</h2>
          </div>
          <div className="space-y-1 max-h-[160px] overflow-y-auto pr-1 custom-scroll">
            {trace.map((step, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="text-[11px] text-slate-500 font-mono leading-relaxed"
              >
                <span className="text-slate-600 mr-2">{String(i + 1).padStart(2, "0")}</span>
                {step}
              </motion.p>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Actions */}
      <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-5 mt-auto">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 mb-4">
          Recommended Operator Actions
        </h2>
        <div className="grid gap-3">
          {analysis.suggestedActions.map((action) => (
            <ActionButton 
              key={action} 
              action={action} 
              disabled={isThinking} 
              onClick={onAction}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}
