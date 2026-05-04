import React from "react";

export default function EmptyState({ text }) {
  return <div className="rounded-lg border border-dashed border-white/12 bg-white/[0.03] p-5 text-sm text-slate-500">{text}</div>;
}
