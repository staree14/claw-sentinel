import os
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random

# CONFIG
DAYS = 90
START_DATE = datetime(2026, 1, 1)

locations = ["kitchen", "bedroom", "hallway", "living_room"]

# Get the directory where this script is located
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

data = []

for day in range(DAYS):
    current_date = START_DATE + timedelta(days=day)
    day_of_week = current_date.strftime("%a")

    # Weekend flag
    is_weekend = day_of_week in ["Sat", "Sun"]

    for hour in range(24):

        # --------------------------
        # USER PRESENCE LOGIC
        # --------------------------
        if 9 <= hour <= 17:
            user_home = 0  # working hours
        else:
            user_home = 1

        # weekends → more at home
        if is_weekend:
            user_home = 1 if random.random() > 0.1 else 0

        # --------------------------
        # ACTIVITY PROBABILITY
        # --------------------------
        if 6 <= hour <= 9:
            activity_prob = 0.8   # morning rush
        elif 18 <= hour <= 22:
            activity_prob = 0.7   # evening active
        elif 0 <= hour <= 4:
            activity_prob = 0.05  # night low
        else:
            activity_prob = 0.3   # normal

        if user_home == 0:
            activity_prob *= 0.1  # almost no activity if away

        # number of events this hour
        events = np.random.poisson(2)

        for _ in range(events):

            motion = 1 if random.random() < activity_prob else 0
            door = 1 if random.random() < (activity_prob * 0.3) else 0

            # --- ANOMALY INJECTION ---
            curr_hour = hour
            curr_user_home = user_home
            if random.random() < 0.03:
                curr_hour = random.choice([1, 2, 3])
                motion = 1
                door = random.choice([0, 1])
                curr_user_home = 0
            # -------------------------

            # location logic
            if motion == 1:
                if 6 <= curr_hour <= 9:
                    location = random.choice(["kitchen", "hallway"])
                elif 22 <= curr_hour or curr_hour <= 6:
                    location = "bedroom"
                else:
                    location = random.choice(locations)
            else:
                location = random.choice(locations)

            timestamp = current_date + timedelta(hours=curr_hour)

            data.append([
                timestamp.strftime("%Y-%m-%d %H:%M"),
                curr_hour,
                day_of_week,
                motion,
                door,
                curr_user_home,
                location
            ])

# CREATE DATAFRAME
df = pd.DataFrame(data, columns=[
    "timestamp", "hour", "day_of_week",
    "motion", "door", "user_home", "location"
])

# SAVE
df.to_csv(os.path.join(BASE_DIR, "sensor_data.csv"), index=False)

print("[SUCCESS] Dataset generated:", len(df), "rows")