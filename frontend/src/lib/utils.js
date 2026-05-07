export function evaluateEvent(event, mode) {
  const hour = Number(event.time.split(":")[0]);
  const lateNight = hour < 5 || hour >= 23;
  const daytime = hour >= 8 && hour <= 18;

  if (mode === "Legacy System") {
    // Legacy system is simple/reactive, but let's make it a bit more dynamic
    // so the user doesn't see "86%" for everything.
    let legacyScore = 0.5;
    if (event.motion) legacyScore += 0.24;
    if (event.event === "door_open") legacyScore += 0.12;
    if (hour < 6 || hour > 22) legacyScore += 0.10;
    legacyScore = Math.min(0.96, legacyScore);

    return {
      anomalyScore: legacyScore,
      riskLevel: legacyScore > 0.8 ? "Dangerous" : legacyScore > 0.6 ? "Suspicious" : "Normal",
      reasoning:
        "Legacy rule engine raised an alert because activity was detected. It does not consider user presence, delivery windows, or event context.",
      actionTaken: "Alert user and dispatch generic siren notification.",
      suggestedActions: ["Alert user", "Lock door", "Review camera"],
    };
  }

  let score = 0.18;
  if (lateNight) score += 0.42;  // Increased from 0.36
  if (!event.user_home) score += 0.32; // Increased from 0.28
  if (event.event === "door_open") score += 0.20; // Increased from 0.18
  if (event.event === "doorbell" && daytime) score -= 0.14;
  if (event.event === "indoor_motion" && event.user_home) score -= 0.16;
  score = Math.max(0.05, Math.min(0.98, score));

  const riskLevel = score > 0.8 ? "Dangerous" : score > 0.5 ? "Suspicious" : "Normal";
  const suggestedActions =
    riskLevel === "Dangerous"
      ? ["Lock door", "Alert user", "Start recording"]
      : riskLevel === "Suspicious"
        ? ["Notify user", "Review camera", "Keep monitoring"]
        : ["Ignore", "Log event", "Maintain schedule"];

  const reasoning =
    riskLevel === "Dangerous"
      ? "ClawSentinel detected a high-risk pattern: late activity, owner away, motion present, and an entry event. The event is outside the expected household rhythm."
      : riskLevel === "Suspicious"
        ? "ClawSentinel found context that deserves attention, but the pattern is not severe enough for escalation. Time, presence, and sensor type partially explain the event."
        : "ClawSentinel matched this to expected household behavior. User presence and timing reduce the anomaly score, so the event can be logged without escalation.";

  return {
    anomalyScore: score,
    riskLevel,
    reasoning,
    actionTaken:
      riskLevel === "Dangerous"
        ? "Door locked, owner alerted, and camera recording prioritized."
        : riskLevel === "Suspicious"
          ? "User notification queued with camera snapshot."
          : "Event logged quietly with no interruption.",
    suggestedActions,
  };
}

export function dotColor(risk) {
  if (risk === "Dangerous") return "bg-rose-300 shadow-[0_0_18px_rgba(251,113,133,0.55)]";
  if (risk === "Suspicious") return "bg-amber-200 shadow-[0_0_18px_rgba(253,224,71,0.45)]";
  return "bg-teal-200 shadow-[0_0_18px_rgba(94,234,212,0.45)]";
}
