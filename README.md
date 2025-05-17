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
