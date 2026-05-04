import React from "react";
import { ChevronDown, ShieldCheck } from "lucide-react";

export default function TopBar({ system, setSystem, mode, setMode }) {
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
          <p className="text-xs font-light tracking-[0.1em] text-slate-500 uppercase mt-1">
            System Control Terminal
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative group">
          <select
            value={system}
            onChange={(event) => setSystem(event.target.value)}
            className="h-11 w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-4 pr-10 text-sm font-medium tracking-wide text-slate-200 outline-none transition-all duration-300 hover:border-cyan-400/40 focus:border-cyan-400/60 sm:w-56"
          >
            <option value="SmartThings">SmartThings API</option>
            <option value="Generic API">Generic REST</option>
            <option value="Simulation Mode">Simulation Mode</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-4 top-[14px] h-4 w-4 text-slate-500 transition-colors duration-300 group-hover:text-cyan-400" />
        </div>
        
        <div className="grid grid-cols-2 rounded-xl border border-white/10 bg-white/5 p-1 h-11">
          {["Legacy System", "ClawSentinel AI"].map((item) => (
            <button
              key={item}
              onClick={() => setMode(item)}
              className={`rounded-lg px-4 text-xs font-medium tracking-wide transition-all duration-300 ${
                mode === item 
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
