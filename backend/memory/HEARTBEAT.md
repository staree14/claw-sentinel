# HEARTBEAT.md — ClawSentinel Short-Term Rolling Event Log
# This file is auto-written by the ContextAgent on every pipeline run.
# Stores the last N agent decisions for dashboard timeline and audit.

---

## [2026-05-05 01:27:14]
- **Event**: `door_open` @ 03:00
- **Source**: front_entry
- **User Home**: False
- **Decision**: `ALERT`
- **Reasoning**: High-risk pattern detected: door_open at 03:00 with anomaly score 0.60. User home=False. Event falls outside expected behavioral baseline — immediate action required.
---

## [2026-05-05 02:47:21]
- **Event**: `doorbell` @ 14:00
- **Source**: porch_camera
- **User Home**: False
- **Decision**: `MONITOR`
- **Reasoning**: Unusual activity: doorbell at 14:00 (hour=14). Anomaly score 0.29 is elevated but not critical. Pattern partially matches baseline — elevated monitoring recommended.
---

## [2026-05-05 02:47:30]
- **Event**: `door_open` @ 03:00
- **Source**: front_entry
- **User Home**: False
- **Decision**: `ALERT`
- **Reasoning**: High-risk pattern detected: door_open at 03:00 with anomaly score 0.60. User home=False. Event falls outside expected behavioral baseline — immediate action required.
---

## [2026-05-05 02:47:51]
- **Event**: `door_open` @ 18:10
- **Source**: garage_entry
- **User Home**: True
- **Decision**: `MONITOR`
- **Reasoning**: Unusual activity: door_open at 18:10 (hour=18). Anomaly score 0.39 is elevated but not critical. Pattern partially matches baseline — elevated monitoring recommended.
---
