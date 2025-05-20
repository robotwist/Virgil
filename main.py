from fastapi import FastAPI, Request, Response, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
import os
import httpx
from typing import Dict, Any, List, Optional
import json
import time
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

# Hugging Face API settings
HUGGINGFACE_API_URL = "https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3-8B-Instruct"
HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY", "")  # Will use free access if not provided
HTTP_CLIENT = httpx.AsyncClient(timeout=60.0)  # Longer timeout for model inference

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

def get_previous_messages(session_id: str, max_count: int = 5) -> List[Dict[str, str]]:
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

async def generate_response(messages: List[Dict[str, str]], max_tokens: int = 400) -> str:
    """Generate a response using Hugging Face Inference API"""
    try:
        # Format messages for the Hugging Face API (similar to Llama chat format)
        formatted_prompt = ""
        
        # Add system message if present
        system_message = next((msg for msg in messages if msg["role"] == "system"), None)
        if system_message:
            formatted_prompt += f"<|system|>\n{system_message['content']}\n"
        
        # Add conversation history
        for msg in messages:
            if msg["role"] == "system":
                continue  # Already handled above
            elif msg["role"] == "user":
                formatted_prompt += f"<|user|>\n{msg['content']}\n"
            elif msg["role"] == "assistant":
                formatted_prompt += f"<|assistant|>\n{msg['content']}\n"
        
        # Add the assistant prompt to indicate we want a response
        formatted_prompt += "<|assistant|>\n"
        
        # Set headers based on whether we have an API key
        headers = {"Content-Type": "application/json"}
        if HUGGINGFACE_API_KEY:
            headers["Authorization"] = f"Bearer {HUGGINGFACE_API_KEY}"
        
        # Make request to Hugging Face API
        payload = {
            "inputs": formatted_prompt,
            "parameters": {
                "max_new_tokens": max_tokens,
                "temperature": 0.7,
                "return_full_text": False
            }
        }
        
        response = await HTTP_CLIENT.post(
            HUGGINGFACE_API_URL,
            json=payload,
            headers=headers
        )
        
        # Check for errors
        response.raise_for_status()
        
        # Process the response
        result = response.json()
        
        # Extract generated text from the response
        if isinstance(result, list) and len(result) > 0:
            if "generated_text" in result[0]:
                return result[0]["generated_text"]
            else:
                return str(result[0])
        
        # Fallback if we didn't get the expected format
        logger.warning(f"Unexpected response format from Hugging Face API: {result}")
        return str(result)
        
    except httpx.HTTPStatusError as e:
        # Handle specific HTTP errors
        status_code = e.response.status_code
        if status_code == 429:
            return "I'm currently experiencing high demand. Please try again in a moment."
        elif status_code == 503:
            return "The service is currently warming up. Your first request might take a bit longer."
        else:
            logger.error(f"HTTP error from Hugging Face API: {e}")
            return "I encountered an error processing your request. Please try again later."
    
    except Exception as e:
        logger.error(f"Error generating response: {str(e)}")
        return "I'm having trouble connecting to my knowledge base right now. Please try again shortly."

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
        
        # Generate response
        ai_response = await generate_response(messages, max_tokens=800)
        
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
        
        # Generate response with reduced tokens for faster response
        ai_response = await generate_response(messages, max_tokens=400)
        
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