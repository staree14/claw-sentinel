import os
import pandas as pd
import matplotlib.pyplot as plt
import numpy as np

# Get the directory where this script is located
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Load output
df = pd.read_csv(os.path.join(BASE_DIR, "..", "data", "output.csv"))

print("[SUCCESS] Loaded output:", df.shape)

# -----------------------------
# 1. HOURLY ACTIVITY HEATMAP
# -----------------------------
hourly = df.groupby("hour").size()

plt.figure()
hourly.plot(kind="bar")
plt.title("Hourly Activity Pattern")
plt.xlabel("Hour of Day")
plt.ylabel("Number of Events")
plt.show()

# -----------------------------
# 2. WEEKLY PATTERN
# -----------------------------
df["day_of_week"] = df["day_of_week"].map({
    1:"Mon",2:"Tue",3:"Wed",4:"Thu",5:"Fri",6:"Sat",7:"Sun"
})

weekly = df.groupby("day_of_week").size()

plt.figure()
weekly.plot(kind="bar")
plt.title("Weekly Activity Pattern")
plt.xlabel("Day")
plt.ylabel("Events")
plt.show()

# -----------------------------
# 3. RISK DISTRIBUTION
# -----------------------------
risk_counts = df["risk"].value_counts()

plt.figure()
risk_counts.plot(kind="bar")
plt.title("Risk Distribution")
plt.xlabel("Risk Level")
plt.ylabel("Count")
plt.show()

# -----------------------------
# 4. FALSE ALARM TREND (SIMULATED LEARNING)
# -----------------------------
# simulate decreasing false alarms over time
weeks = np.arange(1, 13)
false_alarm_rate = np.linspace(0.35, 0.05, 12)

plt.figure()
plt.plot(weeks, false_alarm_rate)
plt.title("False Alarm Rate Over Time (Learning Effect)")
plt.xlabel("Weeks")
plt.ylabel("False Alarm Rate")
plt.show()