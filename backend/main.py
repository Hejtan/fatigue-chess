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
    Submit tired2 data. Requires code to exist in rested AND tired1, and not yet in tired2.
    """
    data = await request.json()
    code = data.get("participantCode")
    if not code:
        return {"error": "Missing participantCode"}
    
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
    participant_code = data.get("participantCode")
    difficulty = data.get("actualDifficulty")
    wisc_correct_rt = data.get("wiscCorrectRT")
    wisc_incorrect_rt = data.get("wiscIncorrectRT")

    # Validate required fields
    if None in [difficulty, wisc_correct_rt, wisc_incorrect_rt]:
        return {"error": "Missing one or more required fields"}

    # Prepare list of difficulties to test
    difficulties_to_try = [difficulty - 2, difficulty - 1, difficulty, difficulty + 1, difficulty + 2]

    # Determine participant index (used in hierarchical model) or fallback to -1
    if participant_code and participant_code in participant_mapping:
        participant_idx = participant_mapping[participant_code]
        use_alpha = "participant"
    else:
        participant_idx = -1
        use_alpha = "global"
    
    # Extract samples from model trace
    mu_alpha = model.posterior["mu_alpha"].values.flatten()
    sigma_alpha = model.posterior["sigma_alpha"].values.flatten()
    alpha_samples = model.posterior["alpha"].values  # shape: (chains, draws, participants)
    beta_difficulty = model.posterior["beta_difficulty"].values.flatten()
    beta_fatigue = model.posterior["beta_fatigue"].values.flatten()
    beta_wisc_correct = model.posterior["beta_wisc_correct"].values.flatten()
    beta_wisc_incorrect = model.posterior["beta_wisc_incorrect"].values.flatten()

    # Use mean fatigue of 1 (tired) for prediction
    fatigue = 1

    # Prepare predictions
    predictions = []
    for d in difficulties_to_try:
        # Standardize input like in training
        input_array = np.array([[d, wisc_correct_rt, wisc_incorrect_rt]])
        scaled_input = scaler.transform(input_array).flatten()

        diff, wisc_c_std, wisc_i_std = scaled_input

        # Select alpha
        if use_alpha == "participant":
            alpha = alpha_samples[:, :, participant_idx].flatten()
        else:
            alpha = mu_alpha

        # Compute predicted satisfaction samples
        sat_samples = (
            alpha
            + beta_wisc_correct * wisc_c_std
            + beta_wisc_incorrect * wisc_i_std
            + beta_difficulty * diff
            + beta_fatigue * fatigue
        )

        mean_satisfaction = np.mean(sat_samples)
        predictions.append((d, mean_satisfaction))

    # Choose best difficulty
    best_difficulty, best_satisfaction = max(predictions, key=lambda x: x[1])

    return {
        "predicted_satisfaction": {str(d): round(sat, 3) for d, sat in predictions},
        "suggested_difficulty": best_difficulty
    }
