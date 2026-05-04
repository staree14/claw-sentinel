import React from "react";
import { motion } from "framer-motion";

export default function AnomalyScore({ analysis, isThinking }) {
  const percent = Math.round(analysis.anomalyScore * 100);

  let colorClass = "from-emerald-400 to-cyan-400";
  let glowClass = "shadow-[0_0_60px_rgba(16,185,129,0.08)]";
  if (analysis.riskLevel === "Suspicious") {
    colorClass = "from-amber-400 to-orange-400";
    glowClass = "shadow-[0_0_60px_rgba(245,158,11,0.08)]";
  } else if (analysis.riskLevel === "Dangerous") {
    colorClass = "from-rose-500 to-red-500";
    glowClass = "shadow-[0_0_60px_rgba(244,63,94,0.12)]";
  }

  return (
    <div className={`relative rounded-[2rem] border border-white/5 bg-white/[0.02] backdrop-blur-3xl p-8 flex flex-col items-center justify-center min-h-[340px] transition-all duration-700 ${glowClass}`}>
      <h2 className="absolute top-6 left-6 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        Anomaly Score
      </h2>
      
      <div className="relative flex items-center justify-center w-full mt-4">
        <motion.div 
          key={isThinking ? "thinking" : percent}
          initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
          className="text-[8rem] xl:text-[10rem] font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-slate-500 leading-none"
        >
          {isThinking ? "--" : percent}
          <span className="text-4xl xl:text-5xl text-slate-600 ml-2">%</span>
        </motion.div>
      </div>

      <div className="absolute bottom-8 w-full px-8 xl:px-12">
        <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
          <motion.div
            className={`h-full bg-gradient-to-r ${colorClass}`}
            initial={{ width: 0 }}
            animate={{ width: isThinking ? "20%" : `${percent}%` }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
        <div className="mt-4 flex justify-between text-[10px] uppercase tracking-[0.2em] font-medium text-slate-600">
          <span className={`transition-colors duration-500 ${analysis.riskLevel === "Normal" ? "text-emerald-400" : ""}`}>Normal</span>
          <span className={`transition-colors duration-500 ${analysis.riskLevel === "Suspicious" ? "text-amber-400" : ""}`}>Suspicious</span>
          <span className={`transition-colors duration-500 ${analysis.riskLevel === "Dangerous" ? "text-rose-400 animate-pulse" : ""}`}>Dangerous</span>
        </div>
      </div>
    </div>
  );
}
