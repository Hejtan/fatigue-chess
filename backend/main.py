from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
import os
from dotenv import load_dotenv

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

