from fastapi import FastAPI, Request, Response, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
import os
import httpx
from typing import Dict, Any, List, Optional
import json
import time
import logging
import random

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
HUGGINGFACE_API_URL = "https://api-inference.huggingface.co/models/facebook/opt-1.3b"
HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY", "")  # Will use free access if not provided
HTTP_CLIENT = httpx.AsyncClient(timeout=60.0)  # Longer timeout for model inference

# Track ongoing conversations
conversation_history = {}

# Pre-defined responses for fallback
FALLBACK_RESPONSES = [
    "I'm Virgil, your helpful AI assistant. I'm here to provide information, answer questions, and assist with various tasks. How can I help you today?",
    "Hello! I'm Virgil, designed to be your helpful AI companion. I can provide information on a wide range of topics and assist with various tasks. What would you like to know?",
    "As Virgil, I'm here to assist you with information, answer your questions, and help with tasks within my capabilities. Feel free to ask me anything!",
    "I'm your AI assistant Virgil, ready to provide helpful, accurate, and thoughtful responses to your questions. What can I help you with today?",
    "Greetings! I'm Virgil, an AI assistant created to provide information and assistance. I'm always learning and aim to be as helpful as possible. How may I assist you?",
]

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

def get_fallback_response(message: str, tone: str) -> str:
    """Get a fallback response when API is unavailable"""
    # Simple checks for common question types
    lower_message = message.lower()
    
    # About Virgil
    if any(phrase in lower_message for phrase in ["who are you", "what are you", "tell me about yourself", "your name"]):
        return "I'm Virgil, your friendly AI assistant! I'm designed to help answer questions, provide information, and assist with various tasks. I'm built using advanced language models and aim to be helpful, accurate, and conversational. How can I assist you today?"
    
    # About water (as an example specific response)
    if "water" in lower_message:
        return "Water is a transparent, odorless, tasteless liquid that forms the world's streams, lakes, oceans, and rain. It's essential for all known forms of life and consists of hydrogen and oxygen (H₂O)."
    
    # General fallback
    return random.choice(FALLBACK_RESPONSES)

async def generate_response(messages: List[Dict[str, str]], max_tokens: int = 400) -> str:
    """Generate a response using Hugging Face Inference API with fallback"""
    # Extract the user's message for fallback purposes
    user_message = next((msg["content"] for msg in messages if msg["role"] == "user"), "")
    tone = "default"
    
    # Determine tone from system message
    system_msg = next((msg["content"] for msg in messages if msg["role"] == "system"), "")
    if "warm" in system_msg.lower():
        tone = "friendly"
    elif "formal" in system_msg.lower():
        tone = "professional"
    
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
        
        logger.info("Sending request to Hugging Face API")
        response = await HTTP_CLIENT.post(
            HUGGINGFACE_API_URL,
            json=payload,
            headers=headers,
            timeout=60.0  # Explicit timeout for this request
        )
        
        # Check for errors
        response.raise_for_status()
        
        # Process the response
        result = response.json()
        logger.info(f"Received response from Hugging Face API: {result}")
        
        # Extract generated text from the response
        if isinstance(result, list) and len(result) > 0:
            if "generated_text" in result[0]:
                return result[0]["generated_text"]
            else:
                logger.warning(f"Unexpected response format: {result}")
                return str(result[0])
        
        # Fallback if we didn't get the expected format
        logger.warning(f"Unexpected response format from Hugging Face API: {result}")
        return get_fallback_response(user_message, tone)
        
    except httpx.HTTPStatusError as e:
        # Handle specific HTTP errors
        status_code = e.response.status_code
        error_text = e.response.text
        logger.error(f"HTTP error {status_code} from Hugging Face API: {error_text}")
        
        if status_code == 429:
            return "I'm currently experiencing high demand. Please try again in a moment."
        elif status_code == 503:
            return "The service is currently warming up. Your first request might take a bit longer."
        else:
            return get_fallback_response(user_message, tone)
            
    except httpx.TimeoutException:
        logger.error("Request to Hugging Face API timed out")
        return "I'm taking longer than expected to process your request. Here's what I can tell you: " + get_fallback_response(user_message, tone)
            
    except Exception as e:
        logger.error(f"Error generating response: {str(e)}")
        return get_fallback_response(user_message, tone)

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
        return {
            "reply": "I apologize, but I encountered an issue processing your request. Please try again shortly.",
            "session_id": body.get("session_id", "new-session-id") if isinstance(body, dict) else "new-session-id",
            "response_time": 0.1
        }

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
        return {
            "reply": "I apologize, but I encountered an issue processing your request. Please try again shortly.",
            "session_id": "quick-response",
            "response_time": 0.1
        } 