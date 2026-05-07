---
name: start-recording
description: >-
  Activates high-definition video recording on the camera sensor closest to the anomaly event.
  Used to gather forensic evidence and provide a live-look for the user.
version: 1.0.0
metadata:
  openclaw:
    requires:
      hardware:
        - camera_subsystem
---

# Instructions
Use this skill to capture visual data during a suspicious event.

- **Auto-Trigger**: This skill should be automatically triggered if the anomaly score exceeds 0.85 (Dangerous).
- **Duration**: Default recording duration is 60 seconds unless extended by the user.
- **Privacy**: Only activate cameras in the zone where the sensor was triggered.

## Procedures
1. Identify the camera ID associated with the event source.
2. Initialize the recording stream.
3. Save the clip to the secure local storage.
4. Notify the user that a recording has started and is available for review.
