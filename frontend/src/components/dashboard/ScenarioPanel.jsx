import React from "react";
import { RadioTower } from "lucide-react";
import PanelHeading from "../ui/PanelHeading";
import { scenarios } from "../../lib/constants";

export default function ScenarioPanel({ activeScenario, onTrigger }) {
  return (
    <aside className="rounded-lg border border-white/10 bg-white/[0.055] p-4 backdrop-blur-xl">
      <PanelHeading icon={RadioTower} title="Scenario Triggers" subtitle="Inject simulated sensor packets" />
      <div className="mt-5 space-y-3">
        {scenarios.map((scenario) => {
          const Icon = scenario.icon;
          const active = activeScenario === scenario.id;
          return (
            <button
              key={scenario.id}
              onClick={() => onTrigger(scenario)}
              className={`group w-full rounded-lg border p-4 text-left transition duration-300 ${
                active
                  ? "border-teal-200/55 bg-teal-300/12 shadow-glow"
                  : "border-white/10 bg-slate-950/35 hover:border-teal-200/35 hover:bg-white/8"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/8 text-teal-100 transition group-hover:border-teal-200/35">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-white">{scenario.label}</p>
                  <p className="mt-1 text-sm text-slate-400">{scenario.detail}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
