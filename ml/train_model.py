import os
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
import joblib

# -----------------------------
# 1. LOAD DATA
# -----------------------------
# Get the directory where this script is located
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

df = pd.read_csv(os.path.join(BASE_DIR, "..", "data", "sensor_data.csv"))

print("[SUCCESS] Data loaded:", df.shape)

# -----------------------------
# 2. PREPROCESSING
# -----------------------------

# Convert day_of_week → numeric
day_map = {
    "Mon":1, "Tue":2, "Wed":3,
    "Thu":4, "Fri":5, "Sat":6, "Sun":7
}
df["day_of_week"] = df["day_of_week"].map(day_map)

# Convert location → numeric encoding
df["location"] = df["location"].astype("category").cat.codes

# -----------------------------
# 3. FEATURE ENGINEERING
# -----------------------------

df["is_night"] = (df["hour"] < 5).astype(int)
df["is_weekend"] = df["day_of_week"].isin([6,7]).astype(int)
df["activity"] = df["motion"] + df["door"]

# Optional: normalize hour (helps model)
df["hour_norm"] = df["hour"] / 24.0

# -----------------------------
# 4. FEATURE SELECTION
# -----------------------------

features = [
    "hour_norm",
    "day_of_week",
    "motion",
    "door",
    "user_home",
    "location",
    "is_night",
    "is_weekend",
    "activity"
]

X = df[features]

# -----------------------------
# 5. TRAIN MODEL
# -----------------------------

model = IsolationForest(
    n_estimators=100,
    contamination=0.05,   # assume 5% anomalies
    random_state=42
)

model.fit(X)

print("[SUCCESS] Model trained")

# -----------------------------
# 6. PREDICTIONS
# -----------------------------

df["anomaly_score"] = model.decision_function(X)
df["anomaly"] = model.predict(X)  # -1 = anomaly, 1 = normal

# -----------------------------
# 7. RISK CLASSIFICATION
# -----------------------------

def classify(score):
    if score > 0.08:
        return "Normal"
    elif score > 0.0:
        return "Suspicious"
    else:
        return "Dangerous"

df["risk"] = df["anomaly_score"].apply(classify)

# -----------------------------
# 8. SAVE OUTPUT
# -----------------------------

df.to_csv(os.path.join(BASE_DIR, "..", "data", "output.csv"), index=False)

# Save model
joblib.dump(model, os.path.join(BASE_DIR, "..", "ml", "model.pkl"))

print("[SUCCESS] Output saved to data/output.csv")
print("[SUCCESS] Model saved to ml/model.pkl")

# -----------------------------
# 9. QUICK STATS (for debugging)
# -----------------------------

print("\n--- Risk Distribution ---")
print(df["risk"].value_counts())

# --- ALERT SUMMARY ---
dangerous_events = df[df["risk"] == "Dangerous"]
if not dangerous_events.empty:
    print(f"\n[ALERT] Found {len(dangerous_events)} Dangerous anomalies!")
    print(dangerous_events[["timestamp", "location", "hour", "anomaly_score"]].to_string(index=False))
else:
    print("\n[INFO] No Dangerous anomalies detected.")

print("\n--- Sample Output ---")
print(df[["timestamp", "motion", "user_home", "anomaly_score", "risk"]].head())