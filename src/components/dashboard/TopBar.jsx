import React from "react";
import { ChevronDown, ShieldCheck } from "lucide-react";

export default function TopBar({ system, setSystem, mode, setMode }) {
  return (
    <header className="flex flex-col gap-4 border-b border-white/10 px-4 py-4 backdrop-blur-xl md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-lg border border-teal-300/25 bg-teal-300/10 shadow-glow">
          <ShieldCheck className="h-5 w-5 text-teal-200" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-normal text-white">ClawSentinel Dashboard</h1>
          <p className="text-sm text-slate-400">Smart home AI control and incident reasoning</p>
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative">
          <select
            value={system}
            onChange={(event) => setSystem(event.target.value)}
            className="h-11 w-full appearance-none rounded-lg border border-white/10 bg-white/8 px-4 pr-10 text-sm text-slate-100 outline-none transition hover:border-teal-200/45 focus:border-teal-200/70 sm:w-56"
          >
            <option>SmartThings</option>
            <option>Generic API</option>
            <option>Simulation Mode</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-3 h-5 w-5 text-slate-400" />
        </div>
        <div className="grid grid-cols-2 rounded-lg border border-white/10 bg-white/8 p-1">
          {["Legacy System", "ClawSentinel AI"].map((item) => (
            <button
              key={item}
              onClick={() => setMode(item)}
              className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                mode === item ? "bg-teal-300 text-slate-950 shadow-sm" : "text-slate-300 hover:text-white"
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
