import React from "react";
import { AlertTriangle, Bell, CheckCircle2, Clock3, DoorClosed, Home, Lock, RadioTower, ShieldCheck } from "lucide-react";

export default function ActionButton({ action, disabled }) {
  const icons = {
    "Lock door": Lock,
    "Alert user": AlertTriangle,
    "Start recording": RadioTower,
    "Notify user": Bell,
    "Review camera": RadioTower,
    "Keep monitoring": ShieldCheck,
    Ignore: CheckCircle2,
    "Log event": Clock3,
    "Maintain schedule": Home,
  };
  const Icon = icons[action] || DoorClosed;

  return (
    <button
      disabled={disabled}
      className="flex h-11 items-center gap-3 rounded-lg border border-white/10 bg-white/7 px-3 text-left text-sm text-slate-200 transition hover:border-teal-200/35 hover:bg-teal-300/10 disabled:cursor-not-allowed disabled:opacity-55"
    >
      <Icon className="h-4 w-4 text-teal-100" />
      {action}
    </button>
  );
}
