# SOUL.md — ClawSentinel Long-Term Behavioral Baseline
# Generated from 90-day synthetic dataset analysis
# Last updated: 2026-01-01 to 2026-04-01

## Identity
This home belongs to a single occupant with a consistent 9-to-5 work schedule.

## Daily Routine
- **06:00–09:00**: Morning rush. High activity in kitchen and hallway. Door events expected (leaving for work).
- **09:00–17:00**: Working hours. User is typically AWAY. Low/zero indoor activity expected. Any motion during this window is SUSPICIOUS.
- **17:00–19:00**: Evening return window. Door open events expected. User arrives home.
- **18:00–22:00**: Evening active period. High activity across living room and kitchen.
- **22:00–06:00**: Night/sleep hours. Near-zero activity expected. ANY motion is HIGH RISK.

## Location Patterns
- **Kitchen**: Active 06:00–09:00 and 18:00–21:00
- **Bedroom**: Active 22:00–07:00 (sleep), 07:00–08:00 (morning prep)
- **Hallway**: Entry/exit events at 08:30 (leave) and 18:00–19:00 (return)
- **Living Room**: Active 18:00–22:00 (evening leisure)

## Weekend Behavior
- User stays home ~90% of weekend days
- Activity spread throughout the day (not concentrated in morning/evening)
- Door events still expected but less predictable

## Known Anomaly Signatures (from 90-day training data)
- Motion at 01:00–04:00 while user is marked AWAY → HIGH ANOMALY (injected test pattern)
- Door open at 03:00 → CRITICAL
- Continuous motion during working hours (09:00–17:00) → SUSPICIOUS

## Baseline Statistics
- Average daily events: ~48
- Normal anomaly rate: ~3% of events
- Dangerous threshold: IsolationForest score < 0.0
- Suspicious threshold: IsolationForest score 0.0–0.08
