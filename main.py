# --- ALL IMPORTS AT TOP ---
import os
import httpx
import json
import time
import logging
import random
import uuid
import math
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from fastapi import FastAPI, Request, Response, HTTPException, Depends, WebSocket, WebSocketDisconnect
from jose import JWTError, jwt
from pydantic import BaseModel
import asyncio
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# --- APP INIT ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
app = FastAPI()

# (Database setup and models are defined later in the file)

# --- CORS & ENV ---

# --- CORS & ENV ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://virgil-ai-assistant.netlify.app",
        "http://localhost:5173",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- GLOBALS ---
HUGGINGFACE_API_URL = "https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1"
HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY", "")
HTTP_CLIENT = httpx.AsyncClient(timeout=120.0)
CONVERSATION_HISTORY = {}
MAX_HISTORY_LENGTH = 10

# --- AUTH (simple JWT for demo) ---
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev_secret_change_me")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenPayload(BaseModel):
    sub: Optional[str] = None


def create_access_token(*, data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_current_user_from_request(request: Request) -> str:
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    token = auth.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        sub = payload.get("sub")
        if not sub:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        return sub
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Connection manager for real-time notifications
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.lock = asyncio.Lock()

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        async with self.lock:
            self.active_connections[user_id] = websocket

    async def disconnect(self, user_id: str):
        async with self.lock:
            if user_id in self.active_connections:
                try:
                    await self.active_connections[user_id].close()
                except Exception:
                    pass
                del self.active_connections[user_id]

    async def send_personal_message(self, user_id: str, message: str):
        async with self.lock:
            ws = self.active_connections.get(user_id)
            if not ws:
                return False
            try:
                await ws.send_text(message)
                return True
            except Exception:
                # If sending fails, remove the stale connection
                del self.active_connections[user_id]
                return False

    async def broadcast(self, message: str):
        async with self.lock:
            for uid, ws in list(self.active_connections.items()):
                try:
                    await ws.send_text(message)
                except Exception:
                    del self.active_connections[uid]

manager = ConnectionManager()

# Background task handle
_background_tasks = []

# --- UTILS ---
# (get_user_id and cleanup_reminders_db are defined once later in the file)

# --- ENDPOINTS ---

# Complex calculation endpoint
@app.post("/calculate")
async def calculate(request: Request):
    data = await request.json()
    expr = data.get('expression')
    if not expr:
        raise HTTPException(status_code=400, detail="Missing expression")
    allowed_names = {k: v for k, v in math.__dict__.items() if not k.startswith("__")}
    allowed_names['abs'] = abs
    allowed_names['round'] = round
    try:
        result = eval(expr, {"__builtins__": {}}, allowed_names)
        return {"result": result}
    except Exception as e:
        logger.error(f"Calculation error: {e}")
        raise HTTPException(status_code=400, detail=f"Calculation error: {e}")

# Real-time translation endpoint
LIBRETRANSLATE_URL = os.getenv("LIBRETRANSLATE_URL", "https://libretranslate.de/translate")
LIBRETRANSLATE_API_KEY = os.getenv("LIBRETRANSLATE_API_KEY", "")
@app.post("/translate")
async def translate_text(request: Request):
    data = await request.json()
    text = data.get('text')
    source = data.get('source', 'auto')
    target = data.get('target', 'en')
    if not text or not target:
        raise HTTPException(status_code=400, detail="Missing text or target language")
    payload = {
        "q": text,
        "source": source,
        "target": target,
        "format": "text"
    }
    if LIBRETRANSLATE_API_KEY:
        payload["api_key"] = LIBRETRANSLATE_API_KEY
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(LIBRETRANSLATE_URL, json=payload)
            resp.raise_for_status()
            result = resp.json()
            return {"translated": result.get("translatedText", "")}
    except Exception as e:
        logger.error(f"Translation error: {e}")
        raise HTTPException(status_code=500, detail="Translation service error")


@app.get("/tones")
async def get_tones():
    """Return available conversation tones/modes for the frontend tone selector."""
    # For frontend compatibility return a simple list of tone ids (strings)
    tones = ["default", "friendly", "professional"]
    return {"tones": tones}

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# SQLite setup for persistent memory
SQLALCHEMY_DATABASE_URL = os.getenv("VIRGIL_DB_URL", "sqlite:///./virgil_memory.db")
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Conversation(Base):
    __tablename__ = "conversations"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    message = Column(Text)
    response = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)

class PersistentReminder(Base):
    __tablename__ = "reminders"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    message = Column(Text)
    remind_at = Column(DateTime)
    delivered = Column(Boolean, default=False)

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

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


CONVERSATION_HISTORY = {}  # Still used for fast access, but now also persist
MAX_HISTORY_LENGTH = 10
from datetime import datetime, timedelta
def get_user_id(request: Request) -> str:
    # Prefer JWT subject if provided in Authorization header
    auth = request.headers.get("Authorization")
    if auth and auth.startswith("Bearer "):
        token = auth.split(" ", 1)[1]
        try:
            payload = jwt.decode(token, os.getenv("JWT_SECRET_KEY", "dev_secret_change_me"), algorithms=[os.getenv("JWT_ALGORITHM", "HS256")])
            sub = payload.get("sub")
            if sub:
                return sub
        except JWTError:
            # fall through to header-based fallback
            pass
    # For demo, fallback to explicit header or IP
    return request.headers.get('X-User-Id') or request.client.host or 'guest'


# Helper to clean up delivered reminders in DB
def cleanup_reminders_db(db, user_id):
    db.query(PersistentReminder).filter_by(user_id=user_id, delivered=True).delete()
    db.commit()


# Endpoint to schedule a reminder (persistent)
@app.post("/reminder")
async def schedule_reminder(request: Request):
    data = await request.json()
    message = data.get('message')
    remind_at = data.get('remind_at')  # ISO8601 string
    if not message or not remind_at:
        raise HTTPException(status_code=400, detail="Missing message or remind_at")
    try:
        remind_time = datetime.fromisoformat(remind_at)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid remind_at format")
    user_id = get_user_id(request)
    db = next(get_db())
    reminder = PersistentReminder(user_id=user_id, message=message, remind_at=remind_time, delivered=False)
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    return {"status": "scheduled", "reminder": {
        'id': reminder.id,
        'message': reminder.message,
        'remind_at': reminder.remind_at.isoformat(),
        'delivered': reminder.delivered
    }}


# Endpoint to fetch due reminders (persistent)
@app.get("/reminders")
async def get_due_reminders(request: Request):
    user_id = get_user_id(request)
    now = datetime.utcnow()
    db = next(get_db())
    due = db.query(PersistentReminder).filter_by(user_id=user_id, delivered=False).filter(PersistentReminder.remind_at <= now).all()
    reminders_out = []
    for r in due:
        reminders_out.append({
            'id': r.id,
            'message': r.message,
            'remind_at': r.remind_at.isoformat(),
            'delivered': r.delivered
        })
        r.delivered = True
    db.commit()
    cleanup_reminders_db(db, user_id)
    return {"reminders": reminders_out}


@app.websocket("/ws/notify/{user_id}")
async def ws_notify(websocket: WebSocket, user_id: str):
    """Accept a websocket connection and keep it for sending notifications to a specific user_id.

    For now this accepts any connection and associates it with the path user_id. In the next step
    we'll require tokens or stronger auth.
    """
    # Basic auth: accept connections if one of these is true:
    #  - Authorization header with valid token whose subject matches user_id
    #  - query param token with valid token
    #  - X-User-Id header equals the path user_id (backwards-compatible)
    # Fallback: allow guest connections but note they are unauthenticated.
    token = None
    # WebSocket headers are available under websocket.headers
    auth_header = websocket.headers.get("authorization") or websocket.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1]
    elif websocket.query_params.get("token"):
        token = websocket.query_params.get("token")

    if token:
            try:
                payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
                sub = payload.get("sub")
                if not sub or str(sub) != str(user_id):
                    await websocket.close(code=403)
                    return
            except JWTError:
                await websocket.close(code=403)
                return
    else:
        # try X-User-Id header for backward compatibility
        header_user = websocket.headers.get("x-user-id") or websocket.headers.get("X-User-Id")
        if header_user is None and user_id != "guest":
                # reject unauthenticated named users
                await websocket.close(code=403)
                return
    try:
        await manager.connect(user_id, websocket)
        logger.info(f"WebSocket connected for user: {user_id}")
        while True:
            # Keep the connection alive by echoing pings — we don't expect incoming messages in this simple notifier
            try:
                data = await websocket.receive_text()
                # Optional: handle incoming messages or pings
                await websocket.send_text(json.dumps({"ack": data}))
            except WebSocketDisconnect:
                break
            except Exception:
                # Sleep briefly and continue; keep connection until client disconnects
                await asyncio.sleep(0.1)
    finally:
        await manager.disconnect(user_id)
        logger.info(f"WebSocket disconnected for user: {user_id}")


async def _reminder_pusher_loop(interval: float = 3.0):
    """Background loop to check DB for due reminders and push notifications to connected clients."""
    while True:
        try:
            db = next(get_db())
            now = datetime.utcnow()
            due = db.query(PersistentReminder).filter_by(delivered=False).filter(PersistentReminder.remind_at <= now).all()
            for r in due:
                payload = json.dumps({
                    "type": "reminder",
                    "id": r.id,
                    "message": r.message,
                    "remind_at": r.remind_at.isoformat()
                })
                sent = await manager.send_personal_message(r.user_id, payload)
                # mark delivered if we sent it; otherwise leave pending so client can query
                if sent:
                    r.delivered = True
            db.commit()
            # Optional cleanup to remove delivered reminders
            # (cleanup_reminders_db is safe here but will be done when a client fetches reminders)
        except Exception as e:
            logger.exception(f"Error in reminder pusher loop: {e}")
        await asyncio.sleep(interval)


@app.on_event("startup")
async def startup_tasks():
    # start background reminder pusher task
    task = asyncio.create_task(_reminder_pusher_loop())
    _background_tasks.append(task)


@app.on_event("shutdown")
async def shutdown_tasks():
    for t in _background_tasks:
        t.cancel()
    # close any open websockets
    async with manager.lock:
        for uid, ws in list(manager.active_connections.items()):
            try:
                await ws.close()
            except Exception:
                pass
        manager.active_connections.clear()


# --- USER DATA ENDPOINTS ---
@app.get("/history")
async def get_conversation_history(request: Request):
    # Prefer JWT-based user id, fall back to X-User-Id or client IP
    try:
        user_id = get_current_user_from_request(request)
    except HTTPException:
        # Fallback behavior (maintain compatibility with existing frontend):
        user_id = request.headers.get('X-User-Id') or request.client.host or 'guest'
    db = next(get_db())
    history_db = db.query(Conversation).filter_by(user_id=user_id).order_by(Conversation.timestamp.asc()).all()
    history = [
        {
            "id": h.id,
            "user_id": h.user_id,
            "message": h.message,
            "response": h.response,
            "timestamp": h.timestamp.isoformat()
        }
        for h in history_db
    ]
    return {"history": history}


@app.post("/auth/token")
async def auth_token(request: Request):
    # Support both JSON and form-encoded (multipart/form-data) clients
    username = None
    password = None
    try:
        data = await request.json()
        username = data.get("username")
        password = data.get("password")
    except Exception:
        # Try form data
        try:
            form = await request.form()
            username = form.get("username")
            password = form.get("password")
        except Exception:
            username = None
            password = None
    if not username or not password:
        raise HTTPException(status_code=400, detail="username and password required")
    # Demo auth: accept any username/password for now (replace with real user validation)
    access_token = create_access_token(data={"sub": username})
    return {"access_token": access_token, "token_type": "bearer"}


@app.delete("/user-data")
async def delete_user_data(request: Request):
    # Require JWT auth for destructive operations
    try:
        explicit_user = get_current_user_from_request(request)
    except HTTPException as e:
        return JSONResponse({"error": e.detail}, status_code=e.status_code)

    # Require an explicit confirmation header or query param to prevent accidental deletes
    confirm_header = request.headers.get("X-Confirm-Delete", "false").lower()
    confirm_query = request.query_params.get("confirm", "false").lower()
    if confirm_header != "true" and confirm_query != "true":
        return JSONResponse({
            "error": "Delete not confirmed. Include header X-Confirm-Delete: true or ?confirm=true to proceed."
        }, status_code=400)

    user_id = explicit_user
    db = next(get_db())
    # Delete conversations
    db.query(Conversation).filter_by(user_id=user_id).delete()
    # Delete reminders
    db.query(PersistentReminder).filter_by(user_id=user_id).delete()
    db.commit()
    return JSONResponse({"status": "deleted", "user_id": user_id})


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


@app.post("/guide")
async def guide(request: Request):
    data = await request.json()
    message = data.get("message")
    session_id = data.get("session_id", "default")
    tone = data.get("tone", "default")
    username = data.get("username", "guest")
    if not message:
        raise HTTPException(status_code=400, detail="Missing message")
    # Retrieve conversation history for context (from DB)
    db = next(get_db())
    history_db = db.query(Conversation).filter_by(user_id=session_id).order_by(Conversation.timestamp.desc()).limit(MAX_HISTORY_LENGTH).all()
    history = [{"user": h.message, "assistant": h.response} for h in reversed(history_db)]
    # Compose prompt
    prompt = get_system_prompt(tone)
    # Add history to prompt
    context = "\n".join([f"User: {h['user']}\nVirgil: {h['assistant']}" for h in history])
    full_prompt = f"{prompt}\n{context}\nUser: {message}\nVirgil:"
    # Call LLM (simulate with fallback if needed)
    reply = await call_llm(full_prompt, message)
    # Save to history (in-memory for fast access)
    history_mem = CONVERSATION_HISTORY.get(session_id, [])
    history_mem.append({"user": message, "assistant": reply})
    if len(history_mem) > MAX_HISTORY_LENGTH:
        history_mem = history_mem[-MAX_HISTORY_LENGTH:]
    CONVERSATION_HISTORY[session_id] = history_mem
    # Save to persistent DB
    db.add(Conversation(user_id=session_id, message=message, response=reply))
    db.commit()
    return {"reply": reply, "session_id": session_id, "response_time": 0.5}
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