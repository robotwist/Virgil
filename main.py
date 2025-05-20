from fastapi import FastAPI, Request, Response, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
import os
import httpx
from typing import Dict, Any, List, Optional
import json
import time
from openai import OpenAI
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Track ongoing conversations
conversation_history = {}

def get_system_prompt(tone: str = "default") -> str:
    """Get the system prompt based on the selected tone"""
    base_prompt = "You are Virgil, a helpful and knowledgeable AI assistant."
    
    if tone == "friendly":
        return f"{base_prompt} Respond in a warm, approachable, and conversational manner, using simple language and occasionally adding personal touches to build rapport."
    elif tone == "professional":
        return f"{base_prompt} Respond in a formal, precise, and structured manner, using professional language and focusing on delivering accurate and comprehensive information."
    else:  # default
        return f"{base_prompt} Provide helpful, accurate, and concise responses while balancing friendliness with professionalism."

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "ok"}

@app.get("/tones")
async def get_tones():
    """Return available conversation tones"""
    return {
        "tones": [
            {"id": "default", "name": "Default", "description": "Standard assistant mode"},
            {"id": "friendly", "name": "Friendly", "description": "Warm and approachable tone"},
            {"id": "professional", "name": "Professional", "description": "Formal and precise tone"}
        ]
    }

def get_previous_messages(session_id: str, max_count: int = 10) -> List[Dict[str, str]]:
    """Retrieve previous messages for the session"""
    if session_id not in conversation_history:
        conversation_history[session_id] = []
    
    # Get the most recent messages, limited by max_count
    return conversation_history[session_id][-max_count:]

def append_message(session_id: str, role: str, content: str):
    """Add a message to the conversation history"""
    if session_id not in conversation_history:
        conversation_history[session_id] = []
    
    conversation_history[session_id].append({"role": role, "content": content})

@app.post("/guide")
async def guide(request: Request):
    """Handle the guide endpoint with full conversation context"""
    try:
        start_time = time.time()
        body = await request.json()
        
        message = body.get("message", "")
        session_id = body.get("session_id", "new-session-id")
        tone = body.get("tone", "default")
        
        logger.info(f"Processing guide request for session {session_id} with tone {tone}")
        
        # Build conversation history
        messages = []
        
        # Add system message with appropriate tone
        messages.append({"role": "system", "content": get_system_prompt(tone)})
        
        # Add conversation history
        previous_messages = get_previous_messages(session_id)
        messages.extend(previous_messages)
        
        # Add the current user message
        messages.append({"role": "user", "content": message})
        
        # Call OpenAI API
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages,
            temperature=0.7,
            max_tokens=800
        )
        
        # Extract response
        ai_response = response.choices[0].message.content
        
        # Save to conversation history
        append_message(session_id, "user", message)
        append_message(session_id, "assistant", ai_response)
        
        end_time = time.time()
        response_time = end_time - start_time
        
        return {
            "reply": ai_response,
            "session_id": session_id,
            "response_time": response_time
        }
    except Exception as e:
        logger.error(f"Error processing guide request: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")

@app.post("/quick-guide")
async def quick_guide(request: Request):
    """Handle the quick-guide endpoint for faster responses without full context"""
    try:
        start_time = time.time()
        body = await request.json()
        
        message = body.get("message", "")
        tone = body.get("tone", "default")
        
        logger.info(f"Processing quick-guide request with tone {tone}")
        
        # Simplified conversation with just the system message and user query
        messages = [
            {"role": "system", "content": get_system_prompt(tone)},
            {"role": "user", "content": message}
        ]
        
        # Call OpenAI API with reduced tokens for faster response
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages,
            temperature=0.7,
            max_tokens=400
        )
        
        # Extract response
        ai_response = response.choices[0].message.content
        
        end_time = time.time()
        response_time = end_time - start_time
        
        return {
            "reply": ai_response,
            "session_id": "quick-response", # No session tracking for quick responses
            "response_time": response_time
        }
    except Exception as e:
        logger.error(f"Error processing quick-guide request: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}") 