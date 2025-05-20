from fastapi import FastAPI, Request, Response, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
import os
import httpx
from typing import Dict, Any, List, Optional
import json
import time
import logging
import random
import uuid

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
HUGGINGFACE_API_URL = "https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1"
HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY", "")
HTTP_CLIENT = httpx.AsyncClient(timeout=120.0)  # Longer timeout for model inference

# Track ongoing conversations
CONVERSATION_HISTORY = {}
MAX_HISTORY_LENGTH = 10  # Maximum number of message pairs to store

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

@app.get("/")
async def root():
    """Root endpoint with API status information"""
    return {
        "status": "ok",
        "name": "Virgil AI Assistant API",
        "version": "1.0.0",
        "endpoints": {
            "/health": "Health check",
            "/tones": "Available conversation tones",
            "/guide": "Main conversation endpoint with context",
            "/quick-guide": "Quick response endpoint"
        },
        "huggingface_status": "Testing API connectivity with DistilBERT model. Please make request to verify token.",
        "docs": "/docs"
    }

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

def get_previous_messages(session_id):
    """Get previous messages for a session."""
    return CONVERSATION_HISTORY.get(session_id, [])

def append_message(session_id, message):
    """Append a message to the conversation history."""
    if session_id not in CONVERSATION_HISTORY:
        CONVERSATION_HISTORY[session_id] = []
    
    CONVERSATION_HISTORY[session_id].append(message)
    
    # Trim history if it gets too long
    if len(CONVERSATION_HISTORY[session_id]) > MAX_HISTORY_LENGTH * 2:  # * 2 for user + assistant pairs
        CONVERSATION_HISTORY[session_id] = CONVERSATION_HISTORY[session_id][-MAX_HISTORY_LENGTH * 2:]

def get_fallback_response(message, tone=None):
    """Get a fallback response based on the message content."""
    message = message.lower()
    
    # Check for specific topics in the message
    if "water" in message or "drink" in message:
        return "Staying hydrated is important! The recommended daily water intake varies by individual, but a general guideline is about 8 glasses (64 ounces) per day."
    
    if "who are you" in message or "what are you" in message or "your name" in message:
        return "I'm Virgil, an AI assistant designed to be helpful, harmless, and honest. I'm here to assist with information and tasks to the best of my abilities."
    
    # Default responses based on tone
    if tone == "friendly":
        return random.choice([
            "I'd love to help with that! Let me know if you need more information.",
            "Great question! I'm here to assist you with whatever you need.",
            "I'm excited to help you with this! What else would you like to know?"
        ])
    elif tone == "professional":
        return random.choice([
            "I'd be pleased to assist with your inquiry. Please let me know if you require additional information.",
            "Thank you for your question. I'm available to provide further assistance as needed.",
            "I'm here to provide the information you're seeking. Please don't hesitate to ask for clarification."
        ])
    else:
        return random.choice(FALLBACK_RESPONSES)

async def generate_response(message, tone=None, previous_messages=None):
    """Generate a response using the Hugging Face API."""
    logging.info(f"Testing API key with user message: {message}")
    
    try:
        # Format messages for Mixtral model
        formatted_prompt = ""
        if previous_messages:
            for msg in previous_messages:
                if msg["role"] == "user":
                    formatted_prompt += f"<s>[INST] {msg['content']} [/INST]"
                else:  # assistant
                    formatted_prompt += f" {msg['content']} </s>"
        
        # Add current message
        if formatted_prompt:
            formatted_prompt += f"<s>[INST] {message} [/INST]"
        else:
            formatted_prompt = f"<s>[INST] {message} [/INST]"
        
        # Add tone instruction if provided
        if tone and tone != "default":
            formatted_prompt = f"<s>[INST] Please respond in a {tone} tone to the following: {message} [/INST]"
        
        payload = {
            "inputs": formatted_prompt,
            "parameters": {
                "max_new_tokens": 500,
                "temperature": 0.7,
                "top_p": 0.95,
                "do_sample": True
            }
        }
        
        headers = {"Authorization": f"Bearer {HUGGINGFACE_API_KEY}"}
        
        logging.info("Sending request to Hugging Face API")
        response = await HTTP_CLIENT.post(
            HUGGINGFACE_API_URL,
            json=payload,
            headers=headers
        )
        
        if response.status_code == 200:
            result = response.json()
            # Extract the generated text from the response
            if isinstance(result, list) and len(result) > 0:
                generated_text = result[0].get("generated_text", "")
                # Clean up the response - remove the input prompt part
                if formatted_prompt in generated_text:
                    generated_text = generated_text[len(formatted_prompt):].strip()
                return generated_text
            else:
                logging.error(f"Unexpected response format: {result}")
                return get_fallback_response(message)
        else:
            logging.error(f"HTTP error {response.status_code} from Hugging Face API: {response.text}")
            return get_fallback_response(message)
            
    except Exception as e:
        logging.exception(f"Error generating response: {str(e)}")
        return get_fallback_response(message)

@app.post("/guide")
async def guide(request: Request):
    """Main endpoint for guided interactions."""
    try:
        data = await request.json()
        
        message = data.get("message", "")
        session_id = data.get("session_id", str(uuid.uuid4()))
        tone = data.get("tone", "default")
        
        logging.info(f"Processing guide request with tone {tone}")
        
        # Get previous messages
        previous_messages = get_previous_messages(session_id)
        
        start_time = time.time()
        
        # Generate response
        ai_response = await generate_response(message, tone, previous_messages)
        
        # Save to conversation history
        append_message(session_id, {"role": "user", "content": message})
        append_message(session_id, {"role": "assistant", "content": ai_response})
        
        end_time = time.time()
        
        return {
            "reply": ai_response,
            "session_id": session_id,
            "response_time": end_time - start_time
        }
    except Exception as e:
        logging.exception(f"Error in guide: {str(e)}")
        return {"reply": "I apologize, but I encountered an error. Please try again.", "error": str(e)}

@app.post("/quick-guide")
async def quick_guide(request: Request):
    """Endpoint for one-off responses without maintaining conversation history."""
    try:
        data = await request.json()
        
        message = data.get("message", "")
        tone = data.get("tone", "default")
        
        logging.info(f"Processing quick-guide request with tone {tone}")
        
        start_time = time.time()
        
        # Generate response with no previous messages
        ai_response = await generate_response(message, tone)
        
        end_time = time.time()
        
        return {
            "reply": ai_response,
            "session_id": "quick-response",
            "response_time": end_time - start_time
        }
    except Exception as e:
        logging.exception(f"Error in quick-guide: {str(e)}")
        return {"reply": "I apologize, but I encountered an error. Please try again.", "error": str(e)} 