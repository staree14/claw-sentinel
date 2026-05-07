import React from "react";
import { ChevronDown, ShieldCheck } from "lucide-react";

export default function TopBar({ system, setSystem, mode, setMode, backendOnline }) {
  return (
    <header className="flex flex-col gap-6 border-b border-white/5 bg-white/[0.01] px-6 py-5 backdrop-blur-2xl md:flex-row md:items-center md:justify-between sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 shadow-[0_0_30px_rgba(34,211,238,0.15)]">
          <ShieldCheck className="h-6 w-6 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
            ClawSentinel
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`w-1.5 h-1.5 rounded-full ${backendOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
            <p className="text-xs font-light tracking-[0.1em] text-slate-500 uppercase">
              {backendOnline ? 'Live Backend' : 'Local Mode'}
            </p>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">


        <div className="grid grid-cols-2 rounded-xl border border-white/10 bg-white/5 p-1 h-11">
          {["Legacy System", "ClawSentinel AI"].map((item) => (
            <button
              key={item}
              onClick={() => setMode(item)}
              className={`rounded-lg px-4 text-xs font-medium tracking-wide transition-all duration-300 ${mode === item
                  ? "bg-white text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
