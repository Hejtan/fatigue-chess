from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
import os

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

MONGO_URL = os.getenv("MONGO_URL")
client = MongoClient(MONGO_URL)
db = client["fatigue"]
participant_codes = db["participant_codes"]

@app.get("/")
async def root():
    return {"message": "Hello, World!"}

@app.get("/check")
def check(code: str):
    """
    Check if the participant code exists in the database.
    """
    exists = participant_codes.find_one({"code": code})
    return {"exists": bool(exists)}

@app.post("/add_code")
async def add_code(request: Request):
    """
    Add a new participant code to the database.
    """
    data = await request.json()
    code = data.get("code")
    if not code:
        return {"error": "Code is required"}
    
    # Check if the code already exists
    exists = participant_codes.find_one({"code": code})
    if exists:
        return {"error": "Code already exists"}
    
    # Add the new code to the database
    participant_codes.insert_one({"code": code})
    return {"status": "ok"}