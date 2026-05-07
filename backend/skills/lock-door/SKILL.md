---
name: lock-door
description: >-
  Executes a physical lock command on the primary entry point (front_entry, garage_entry).
  This is a critical security action that should be used to neutralize an immediate threat.
version: 1.0.0
metadata:
  openclaw:
    requires:
      hardware:
        - smart_lock_gateway
    safety:
      confirmation_required: true
---

# Instructions
Use this skill to secure the home when an intrusion is suspected.

- **Safe-by-Design**: NEVER execute this skill without explicit user confirmation via the Telegram interface or Dashboard, unless in 'Auto-Defense' mode (if enabled).
- **Confirmation**: Once confirmed, send the signal to the smart lock hardware.
- **Feedback**: Notify the user immediately once the lock is confirmed engaged.

## Procedures
1. Verify the current state of the lock.
2. Present the user with a "Lock Door" confirmation button.
3. Upon confirmation, trigger the physical actuator.
4. Update the HEARTBEAT log with the confirmation and execution status.
