import React from "react";
import { RadioTower, RefreshCw } from "lucide-react";
import PanelHeading from "../ui/PanelHeading";
import { scenarios } from "../../lib/constants";
import useSystemStore from "../../store/useSystemStore";

export default function ScenarioPanel({ activeScenario, onTrigger }) {
  return (
    <aside className="rounded-[2rem] border border-white/5 bg-white/[0.02] backdrop-blur-2xl p-6 xl:p-8 flex flex-col">
      <PanelHeading icon={RadioTower} title="Command Line" subtitle="Inject telemetry" />
      <div className="mt-8 space-y-4 flex-1">
        {scenarios.map((scenario) => {
          const Icon = scenario.icon;
          const active = activeScenario === scenario.id;
          return (
            <button
              key={scenario.id}
              onClick={() => onTrigger(scenario)}
              className={`group w-full rounded-2xl border p-4 text-left transition-all duration-500 ${
                active
                  ? "border-cyan-400/30 bg-cyan-400/5 shadow-[0_0_30px_rgba(34,211,238,0.1)]"
                  : "border-white/5 bg-white/[0.01] hover:border-white/20 hover:bg-white/5"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl border transition-colors duration-500 ${
                  active ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-400" : "border-white/10 bg-white/5 text-slate-400 group-hover:text-slate-200"
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="pt-1">
                  <p className={`font-medium tracking-wide transition-colors ${active ? "text-cyan-50" : "text-slate-200"}`}>{scenario.label}</p>
                  <p className="mt-1.5 text-xs text-slate-500 tracking-wide font-light leading-relaxed">{scenario.detail}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <div className="mt-6 pt-6 border-t border-white/5">
        <button
          onClick={() => useSystemStore.getState().resetSystem()}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-rose-500/30 bg-rose-500/5 text-rose-400 hover:bg-rose-500/20 transition-colors text-sm font-medium tracking-wide uppercase"
        >
          <RefreshCw className="h-4 w-4" />
          Reset Simulation
        </button>
      </div>
    </aside>
  );
}
