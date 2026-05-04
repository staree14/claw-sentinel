import React from "react";

export default function PanelHeading({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-4 mb-2">
      <div className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 shadow-[0_0_15px_rgba(34,211,238,0.1)]">
        <Icon className="h-4 w-4 text-cyan-400" />
      </div>
      <div>
        <h2 className="text-sm font-semibold text-slate-200 tracking-wide">{title}</h2>
        <p className="text-xs text-slate-500 font-light mt-0.5 tracking-wider">{subtitle}</p>
      </div>
    </div>
  );
}
