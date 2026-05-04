import React from "react";
import { riskStyles } from "../../lib/constants";

export default function RiskBadge({ risk }) {
  return <span className={`w-fit rounded-full border px-4 py-2 text-sm font-semibold ${riskStyles[risk]}`}>{risk}</span>;
}
