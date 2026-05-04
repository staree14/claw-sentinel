import os
import pandas as pd
from river import anomaly

# Get the directory where this script is located
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Load data
df = pd.read_csv(os.path.join(BASE_DIR, "..", "data", "sensor_data.csv"))

# preprocess (same as before)
day_map = {"Mon":1,"Tue":2,"Wed":3,"Thu":4,"Fri":5,"Sat":6,"Sun":7}
df["day_of_week"] = df["day_of_week"].map(day_map)
df["location"] = df["location"].astype("category").cat.codes

df["is_night"] = (df["hour"] < 5).astype(int)
df["activity"] = df["motion"] + df["door"]

features = [
    "hour","day_of_week","motion",
    "door","user_home","location",
    "is_night","activity"
]

# -----------------------------
# STREAMING MODEL
# -----------------------------
model = anomaly.HalfSpaceTrees()

scores = []
risks = []

def classify(score):
    if score > 0.5:     # Top ~5%
        return "Dangerous"
    elif score > 0.28:  # Next ~10-15%
        return "Suspicious"
    else:              # Remaining ~80%
        return "Normal"

# simulate streaming
for _, row in df.iterrows():
    x = row[features].to_dict()

    # Invert score so that 1.0 = Most Anomalous, 0.0 = Most Normal
    score = 1 - model.score_one(x)
    model.learn_one(x)

    scores.append(score)
    risks.append(classify(score))

df["stream_score"] = scores
df["stream_risk"] = risks

# save
df.to_csv(os.path.join(BASE_DIR, "..", "data", "stream_output.csv"), index=False)

print("[SUCCESS] Streaming model complete")
print(df["stream_risk"].value_counts())