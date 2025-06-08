from fastapi import FastAPI, Request, Body, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
import os
from dotenv import load_dotenv
import joblib
import pymc as pm
import arviz as az
import numpy as np
import pandas as pd
import pickle
from pydantic import BaseModel

load_dotenv()

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://fatigue-frontend.onrender.com"],
    allow_methods=["*"],
    allow_headers=["*"],
)

MONGO_URL = os.getenv("MONGO_URL")
client = MongoClient(MONGO_URL)
db = client["fatigue"]

# Separate collections for each test stage
rested = db["rested"]
tired1 = db["tired1"]
tired2 = db["tired2"]

model = az.from_netcdf("satisfaction_model.netcdf")
scaler = joblib.load("satisfaction_scaler.pkl")

with pm.Model() as pm_model:
    pm_model = model

with open("participant_mapping.pkl", "rb") as f:
    participant_mapping = pickle.load(f)

xgb_pipeline = joblib.load("xgb_pipeline.pkl")
feature_names = joblib.load("feature_names.pkl")

def extract_wisconsin_features(trials):
    df = pd.DataFrame(trials)

    mean_time_correct = df.loc[df['trialType'] == 'correct', 'timeMs'].mean()
    mean_time_unexpected = df.loc[df['trialType'] == 'unexpected', 'timeMs'].mean()
    mean_time_rulechange = df.loc[df['trialType'] == 'rule-change-expected', 'timeMs'].mean()

    features = pd.DataFrame([{
        'mean_time': df['timeMs'].mean(),
        'std_time': df['timeMs'].std(),
        'min_time': df['timeMs'].min(),
        'max_time': df['timeMs'].max(),
        'median_time': df['timeMs'].median(),
        'correct_rate': (df['trialType'] == 'correct').mean(),
        'unexpected_error_rate': (df['trialType'] == 'unexpected').mean(),
        'rulechange_error_rate': (df['trialType'] == 'rule-change-expected').mean(),
        'mean_time_correct': mean_time_correct,
        'mean_time_unexpected': mean_time_unexpected if pd.notna(mean_time_unexpected) else 100,
        'mean_time_rulechange': mean_time_rulechange,
        'trial_count': df.shape[0]
    }])

    return features[feature_names]

@app.get("/")
async def root():
    return {"message": "Fatigue study backend"}

@app.get("/check")
def check(code: str):
    """
    Check if the participant code exists in rested and doesn't yet exist in tired1 or tired2.
    Used for verifying code before starting tired tests.
    """
    in_rested = rested.find_one({"participantCode": code})
    in_tired1 = tired1.find_one({"participantCode": code})
    in_tired2 = tired2.find_one({"participantCode": code})

    return {
        "in_rested": bool(in_rested),
        "in_tired1": bool(in_tired1),
        "in_tired2": bool(in_tired2)
    }

@app.post("/submit/rested")
async def submit_rested(request: Request):
    """
    Submit full rested test data. Creates new entry only if code doesn't already exist.
    """
    data = await request.json()
    code = data.get("participantCode")
    if not code:
        return {"error": "Missing participantCode"}
    
    if rested.find_one({"participantCode": code}):
        return {"error": "Code already exists in rested"}

    rested.insert_one(data)
    return {"status": "ok"}

@app.post("/submit/tired1")
async def submit_tired1(request: Request):
    """
    Submit tired1 data. Requires code to exist in rested and not yet in tired1.
    """
    data = await request.json()
    code = data.get("participantCode")
    if not code:
        return {"error": "Missing participantCode"}
    
    if not rested.find_one({"participantCode": code}):
        return {"error": "Code not found in rested"}

    if tired1.find_one({"participantCode": code}):
        return {"error": "Code already exists in tired1"}

    tired1.insert_one(data)
    return {"status": "ok"}

@app.post("/submit/tired2")
async def submit_tired2(request: Request):
    """
    Submit tired2 data.
    """
    data = await request.json()
    code = data.get("participantCode")
    if code:
        if not rested.find_one({"participantCode": code}):
            return {"error": "Code not found in rested"}
        if not tired1.find_one({"participantCode": code}):
            return {"error": "Code not found in tired1 (tired1 test must be completed first)"}
        if tired2.find_one({"participantCode": code}):
            return {"error": "Code already exists in tired2"}

    tired2.insert_one(data)
    return {"status": "ok"}


class PredictionRequest(BaseModel):
    participantCode: str | None = None
    difficulty: int
    wisc_correct_rt: float
    wisc_incorrect_rt: float
    state: str

@app.post("/predict_difficulty_adjustment")
async def predict_difficulty_adjustment(data: dict = Body()):
    print("##########\nPOST received with data:", data)
    print("##########\n")
    participant_code = data.get("participant_code")
    difficulty = data.get("difficulty")
    wisconsin_results = data.get("winsconsin_results")

    if difficulty is None or not wisconsin_results:
        return {"error": "Missing difficulty or Wisconsin results"}

    correct_rts = []
    incorrect_rts = []

    for trial in wisconsin_results:
        raw_time = trial.get("timeMs")

        error_type = trial.get("errorType")

        if error_type is None:
            correct_rts.append(raw_time)
        elif error_type == "unexpected":
            incorrect_rts.append(raw_time)

    if not correct_rts:
        return {"error": "No correct trials found"}

    wisc_correct_rt = np.mean(correct_rts)
    wisc_incorrect_rt = np.mean(incorrect_rts) if incorrect_rts else 100

    # Define difficulty levels to try
    difficulties_to_try = [difficulty - 2, difficulty - 1, difficulty, difficulty + 1, difficulty + 2]

    if participant_code and participant_code in participant_mapping:
        participant_idx = participant_mapping[participant_code]
        use_alpha = "participant"
    else:
        participant_idx = -1
        use_alpha = "global"

    # Load model components
    mu_alpha = model.posterior["mu_alpha"].values.flatten()
    alpha_samples = model.posterior["alpha"].values
    beta_difficulty = model.posterior["beta_difficulty"].values.flatten()
    beta_fatigue = model.posterior["beta_fatigue"].values.flatten()
    beta_wisc_correct = model.posterior["beta_wisc_correct"].values.flatten()
    beta_wisc_incorrect = model.posterior["beta_wisc_incorrect"].values.flatten()

    fatigue = 1  # fixed as we're in tired2 mode

    predictions = []
    for d in difficulties_to_try:
        input_df = pd.DataFrame([{
            "difficulty": d,
            "wisc_correct_rt": wisc_correct_rt,
            "wisc_incorrect_rt": wisc_incorrect_rt
        }])
        scaled_input = scaler.transform(input_df).flatten()
        diff, wisc_c_std, wisc_i_std = scaled_input

        alpha = (
            alpha_samples[:, :, participant_idx].flatten()
            if use_alpha == "participant"
            else mu_alpha
        )

        sat_samples = (
            alpha
            + beta_wisc_correct * wisc_c_std
            + beta_wisc_incorrect * wisc_i_std
            + beta_difficulty * diff
            + beta_fatigue * fatigue
        )

        predictions.append((d, np.mean(sat_samples)))

    best_difficulty, _ = max(predictions, key=lambda x: x[1])

    print("#########\n")

    print(wisconsin_results)
    try:
        feature_df = extract_wisconsin_features(wisconsin_results)
        tired_pred = xgb_pipeline.predict(feature_df)[0]
        tired_prob = xgb_pipeline.predict_proba(feature_df)[0][1]  # probability of "tired"
        print("Tiredness prediction:", tired_pred, "with probability:", tired_prob)
    except Exception as e:
        print(f"Error during tiredness prediction: {e}")
        tired_pred = None
        tired_prob = None
    
    print("Best difficulty found:", best_difficulty)
    print("Predictions:", predictions)
    print("#########\n")

    return {
        "predicted_satisfaction": {str(d): round(sat, 3) for d, sat in predictions},
        "suggested_difficulty": best_difficulty,
        "tiredness_prediction": {
            "label": int(tired_pred) if tired_pred is not None else None,
            "probability": round(tired_prob, 3) if tired_prob is not None else None
        }
    }