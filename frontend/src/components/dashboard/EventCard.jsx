import React from "react";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function EventCard({ currentEvent, isThinking }) {
  return (
    <div className="rounded-[2rem] border border-white/5 bg-white/[0.02] backdrop-blur-2xl p-6 xl:p-8 flex flex-col justify-between min-h-[340px]">
      <div className="flex items-center justify-between gap-3 mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Live Telemetry</h2>
        <AnimatePresence>
          {isThinking && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-2 text-xs uppercase tracking-widest text-cyan-400 font-medium"
            >
              <Loader2 className="h-3 w-3 animate-spin" />
              Processing
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        {currentEvent ? (
          <motion.div
            key={currentEvent.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="flex-1 flex flex-col justify-between"
          >
            <div className="grid grid-cols-2 gap-4">
              <TelemetryMetric label="Time" value={currentEvent.time} />
              <TelemetryMetric label="Event" value={currentEvent.event.replace("_", " ")} />
              <TelemetryMetric label="Occupancy" value={currentEvent.user_home ? "Home" : "Away"} />
              <TelemetryMetric label="Motion" value={currentEvent.motion ? "Detected" : "Clear"} />
            </div>
            
            <div className="mt-6 pt-6 border-t border-white/5">
              <p className="text-sm tracking-[0.2em] uppercase text-slate-500 font-semibold mb-3">Context</p>
              <p className="text-[15px] leading-relaxed text-slate-300 font-light">{currentEvent.description}</p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex items-center justify-center"
          >
            <div className="text-center px-4 py-8 rounded-2xl border border-dashed border-white/10 bg-white/[0.01]">
              <p className="text-sm font-light text-slate-500 tracking-wide">Awaiting sensor input</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TelemetryMetric({ label, value }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-1">{label}</p>
      <p className="text-sm font-medium text-slate-200 capitalize">{value}</p>
    </div>
  );
}
