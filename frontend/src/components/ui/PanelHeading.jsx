import React from "react";

export default function PanelHeading({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-white/8">
        <Icon className="h-5 w-5 text-teal-100" />
      </div>
      <div>
        <h2 className="font-semibold text-white">{title}</h2>
        <p className="text-sm text-slate-400">{subtitle}</p>
      </div>
    </div>
  );
}
