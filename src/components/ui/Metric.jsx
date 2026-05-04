import React from "react";

export default function Metric({ label, value }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/6 p-3">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 break-words text-sm font-medium text-white">{value}</p>
    </div>
  );
}
