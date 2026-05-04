import React from "react";
import { riskStyles } from "../../lib/constants";

export default function RiskBadge({ risk }) {
  return (
    <span className={`w-fit rounded-full border px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] font-semibold backdrop-blur-md shadow-sm transition-colors duration-500 ${riskStyles[risk]}`}>
      {risk}
    </span>
  );
}
