# 🧭 VIRGIL — AI-Powered Real-Time Guide (Open Source Version)

Virgil is your whisper-in-the-ear guide—an AI-powered companion that helps you move through high-stakes work and life moments with clarity, confidence, and grace.

Think: the **right insight at the right time**, without surveillance or noise. This is your NeuroLink—on a budget and without the home invasion.

## 🏗️ Tech Stack

### Frontend
- React (Vite)
- Pure CSS
- Axios for API communication

### Backend
- FastAPI (Python)
- Modular structure with routes, services, and memory

### Open Source Components
- **Ollama** for local LLM inference (replacing OpenAI)
- **ChromaDB** for vector storage (replacing Pinecone)
- **Sentence Transformers** for embeddings
- 100% free and self-hostable
- Docker support for easy deployment

## 📁 Project Structure

```
virgil/
├── frontend/
│ └── frontend/ # Vite-powered React app
│   ├── src/
│   │ ├── components/
│   │ ├── pages/
│   │ └── styles/
│   └── package.json
├── backend/ # FastAPI backend
│ ├── main.py
│ ├── Dockerfile
│ ├── docker-compose.yml
│ ├── run.sh
│ ├── auth/ # Simplified authentication
│ ├── analytics/ # Basic analytics tracking
│ ├── monetization/ # Mock subscription services
│ ├── ai/
│ │ └── ollama_service.py # Open source LLM service
│ └── memory/
│   └── chroma_vector_store.py # ChromaDB vector storage
├── data/ # Local data storage
├── .env.example # Example configuration
└── README.md
```

## 🚀 Getting Started

### Option 1: Local Setup

1. Clone the repository
```bash
git clone <your-repo-url>
cd virgil
```

2. Set up the backend
```bash
cd backend
chmod +x run.sh
./run.sh
```

This script will:
- Create a virtual environment
- Install dependencies
- Check for Ollama and install it if needed
- Download the required LLM model
- Start the FastAPI server

3. Set up the frontend
```bash
cd ../frontend/frontend
npm install
npm run dev
```

### Option 2: Docker Deployment

For a containerized deployment using Docker:

1. Clone the repository
```bash
git clone <your-repo-url>
cd virgil/backend
```

2. Build and run with Docker Compose
```bash
docker-compose up --build
```

This will:
- Build the API container
- Run the Ollama service in a separate container
- Mount appropriate volumes for data persistence
- Expose the API on port 8000

3. Set up the frontend
```bash
cd ../frontend/frontend
npm install
npm run dev
```

## 🔧 Configuration

Copy the example environment file:
```bash
cd backend
cp .env.example .env
```

Key configuration options:
- `OLLAMA_MODEL`: Choose which LLM to use (default: llama3)
- `FRONTEND_URL`: URL of your frontend for CORS (default: http://localhost:5173)

## 📋 Features

- **Real-time AI Guide**: Get contextual guidance during important moments
- **Memory**: Conversation history and vector-based memory for context
- **Tone Templates**: Adjust the AI's tone for different situations
- **Open Source**: All components are free and open source
- **Self-hostable**: Run everything locally without external services
- **Docker Support**: Containerized deployment for easy setup

## 🔜 Coming Soon

- Voice input/output support
- Enhanced memory capabilities
- Additional LLM model support
- Mobile responsive design
- Advanced analytics and user profiles

## 📚 Documentation

For detailed setup and configuration options:
- [Backend Documentation](backend/README.md)
- [Frontend Documentation](frontend/frontend/README.md)

## 📜 License

MIT — and in the spirit of authenticity and guidance, you are encouraged to fork and personalize this with intention.

# Virgil AI Assistant

Virgil is an AI-powered real-time guide and assistant built with FastAPI, React, and Ollama. It provides a chat interface for users to interact with an AI assistant using various conversation tones and styles.

![Virgil Logo](frontend/frontend/src/assets/images/Virgil-Logo-2.png)

## Live Demo

- **Frontend**: [https://virgil-ai-assistant.netlify.app](https://virgil-ai-assistant.netlify.app)
- **Backend API**: [https://virgil-ai-assistant-56761cb0db9a.herokuapp.com](https://virgil-ai-assistant-56761cb0db9a.herokuapp.com)

## Features

- 💬 **AI Chat Interface**: Engage in natural conversations with Virgil AI
- 🎭 **Multiple Tones**: Switch between different AI assistant personalities (friendly, professional, etc.)
- 👤 **User Authentication**: Register, login, and access personal conversation history
- 💾 **Memory and Context**: Virgil remembers previous parts of your conversation
- 📊 **Admin Analytics**: Track usage metrics and popular tones (admin only)
- 💸 **Subscription System**: Simple subscription system with free and premium tiers
- 🌐 **Web-based Interface**: Clean, responsive UI built with React

## Architecture

Virgil consists of two main components:

1. **Backend API** (FastAPI)
   - Authentication service
   - AI integration with Ollama
   - Memory management
   - Analytics tracking
   - Subscription handling

2. **Frontend** (React)
   - User interface for chat
   - Authentication forms
   - Tone selection
   - Subscription management

## Local Development Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- npm 9+
- [Ollama](https://ollama.com/) (for local LLM integration)

### Backend Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/robotwist/Virgil.git
   cd Virgil/backend
   ```

2. Set up a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the Ollama setup script:
   ```bash
   ./setup_ollama.sh
   ```

5. Start the backend server:
   ```bash
   uvicorn main:app --reload
   ```

   The API will be available at http://localhost:8000

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with the backend URL:
   ```
   VITE_API_URL=http://localhost:8000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

   The frontend will be available at http://localhost:5173

## Deployment

### Backend Deployment (Heroku)

1. Create a Heroku account and install the Heroku CLI
2. Create a new Heroku app:
   ```bash
   heroku create your-app-name
   ```

3. Set environment variables:
   ```bash
   heroku config:set FRONTEND_URL=https://your-frontend-url.netlify.app
   heroku config:set JWT_SECRET_KEY=your_secret_key
   ```

4. Deploy the backend:
   ```bash
   git push heroku main
   ```

### Frontend Deployment (Netlify)

1. Create a Netlify account and install the Netlify CLI
2. Build the frontend:
   ```bash
   cd frontend/frontend
   npm run build
   ```

3. Deploy to Netlify:
   ```bash
   netlify deploy --prod --dir=dist
   ```

## API Endpoints

### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/token` - Login and get JWT token
- `GET /auth/me` - Get current user info

### AI Guide
- `POST /guide` - Send a message to Virgil
- `GET /tones` - Get available conversation tones
- `GET /tone/{tone_id}` - Get details for a specific tone

### Subscription
- `POST /subscription/create-checkout` - Create a checkout session
- `GET /subscription/status` - Get subscription status

### Admin
- `GET /admin/metrics` - Get analytics metrics
- `GET /admin/active-users` - Get active users count
- `GET /admin/top-tones` - Get most popular tones

## Local vs. Production

The application is designed to run in two modes:

1. **Local Mode**: Uses Ollama for AI responses and in-memory storage for user data.
2. **Production Mode**: Uses a fallback response system without ML dependencies (to keep Heroku slug size small).

To use the full ML capabilities:
- Run locally with Ollama installed
- Or deploy to a service without size constraints (not Heroku free tier)

## License

MIT License

## Credits

- Frontend UI inspired by modern chat applications
- Uses Ollama for LLM capabilities
