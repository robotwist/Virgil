from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
import os
import httpx
from typing import Dict, Any
import json

app = FastAPI()

# Get frontend and backend URLs from environment variables or use defaults
frontend_url = os.getenv("FRONTEND_URL", "https://virgil-ai-assistant.netlify.app")
cors_origins_env = os.getenv("CORS_ORIGINS", "")
default_origins = [frontend_url, "https://virgil-ai-assistant.netlify.app"]
cors_origins = cors_origins_env.split(",") if cors_origins_env else default_origins

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/tones")
async def get_tones():
    """Forward the tones request to the actual backend"""
    return {
        "tones": [
            {"id": "default", "name": "Default", "description": "Standard assistant mode"},
            {"id": "friendly", "name": "Friendly", "description": "Warm and approachable tone"},
            {"id": "professional", "name": "Professional", "description": "Formal and precise tone"}
        ]
    }

@app.post("/guide")
async def guide(request: Request):
    """Handle the guide endpoint"""
    body = await request.json()
    # Process the request and respond
    return {
        "reply": f"I've received your message: {body.get('message', '')}. This is a temporary response while we fix the backend connection.",
        "session_id": body.get("session_id") or "new-session-id",
        "response_time": 0.5
    }

@app.post("/quick-guide")
async def quick_guide(request: Request):
    """Handle the quick-guide endpoint"""
    body = await request.json()
    # Process the request and respond
    return {
        "reply": f"Quick response to: {body.get('message', '')}. This is a temporary response while we fix the backend connection.",
        "session_id": "new-session-id",
        "response_time": 0.2
    } 