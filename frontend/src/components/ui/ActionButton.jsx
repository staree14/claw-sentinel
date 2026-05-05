import React from "react";
import { AlertTriangle, Bell, CheckCircle2, Clock3, DoorClosed, Home, Lock, RadioTower, ShieldCheck } from "lucide-react";

export default function ActionButton({ action, disabled, onClick }) {
  const [loading, setLoading] = React.useState(false);
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

  const handleClick = async () => {
    if (!onClick || disabled || loading) return;
    setLoading(true);
    try {
      await onClick(action);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || loading}
      className="group flex h-12 items-center gap-4 rounded-xl border border-white/5 bg-white/[0.02] px-4 text-left text-[13px] font-medium tracking-wide text-slate-300 transition-all duration-300 hover:border-emerald-400/30 hover:bg-emerald-400/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
      ) : (
        <Icon className="h-4 w-4 text-slate-500 transition-colors duration-300 group-hover:text-emerald-400" />
      )}
      {action}
    </button>
  );
}
