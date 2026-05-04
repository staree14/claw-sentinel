import React from "react";
import { riskMeter } from "../../lib/constants";

export default function AnomalyScore({ analysis, isThinking }) {
  const percent = Math.round(analysis.anomalyScore * 100);
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/45 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-slate-400">Anomaly Score</h2>
        <span className="text-3xl font-semibold tabular-nums text-white">{isThinking ? "--" : percent}</span>
      </div>
      <div className="mt-6 h-4 overflow-hidden rounded-full bg-slate-800 ring-1 ring-white/10">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${riskMeter[analysis.riskLevel]} transition-all duration-700 ease-out`}
          style={{ width: `${isThinking ? 35 : percent}%` }}
        />
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2 text-xs text-slate-400">
        <span>Normal</span>
        <span className="text-center">Suspicious</span>
        <span className="text-right">Dangerous</span>
      </div>
    </div>
  );
}
