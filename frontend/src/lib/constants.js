import { Moon, PackageCheck, PawPrint, UserRoundCheck } from "lucide-react";

export const scenarios = [
  {
    id: "intrusion",
    label: "Late-night intrusion",
    detail: "3 AM, user away",
    icon: Moon,
    event: {
      time: "03:00",
      event: "door_open",
      user_home: false,
      motion: true,
      source: "front_entry",
      description: "Front door opened while the owner is marked away.",
    },
  },
  {
    id: "delivery",
    label: "Delivery at door",
    detail: "2 PM",
    icon: PackageCheck,
    event: {
      time: "14:00",
      event: "doorbell",
      user_home: false,
      motion: true,
      source: "porch_camera",
      description: "Motion and doorbell detected during normal delivery hours.",
    },
  },
  {
    id: "pet",
    label: "Pet roaming",
    detail: "night activity",
    icon: PawPrint,
    event: {
      time: "01:20",
      event: "indoor_motion",
      user_home: true,
      motion: true,
      source: "hallway_sensor",
      description: "Low-height movement detected in hallway while home is occupied.",
    },
  },
  {
    id: "return",
    label: "Owner returns home",
    detail: "authorized entry",
    icon: UserRoundCheck,
    event: {
      time: "18:10",
      event: "door_open",
      user_home: true,
      motion: true,
      source: "garage_entry",
      description: "Known owner presence detected; normal evening arrival matching the routine learned by the ML model.",
    },
  },
];

export const riskStyles = {
  Normal: "border-emerald-400/35 bg-emerald-400/12 text-emerald-200",
  Suspicious: "border-amber-300/35 bg-amber-300/12 text-amber-100",
  Dangerous: "border-rose-400/35 bg-rose-400/14 text-rose-100",
};

export const riskMeter = {
  Normal: "from-emerald-300 to-teal-300",
  Suspicious: "from-amber-200 to-orange-300",
  Dangerous: "from-rose-300 to-red-500",
};
