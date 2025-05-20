# Virgil Voice Interface Setup Guide

This guide provides detailed instructions for setting up and using the voice interaction capabilities in the Virgil application.

## Prerequisites

The voice interface requires several Python packages and libraries. You'll need:

- Python 3.8 or higher
- Virtual environment (venv or conda)
- Node.js and npm (for the frontend)
- Git (for cloning the repository)
- Sufficient disk space for ML models (approx. 5GB for Whisper and Bark models)

## Backend Setup

### 1. Create a Virtual Environment

```bash
# Navigate to the project directory
cd /path/to/virgil

# Create a virtual environment
python -m venv .venv

# Activate the virtual environment
# On Linux/macOS:
source .venv/bin/activate
# On Windows:
# .venv\Scripts\activate
```

### 2. Install Required Packages

```bash
# Navigate to the backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Optional: If you want to use GPU acceleration
# pip install torch==2.0.1 torchvision==0.15.2 torchaudio==2.0.2 --index-url https://download.pytorch.org/whl/cu118
```

**Note**: The initial download of Whisper and Bark models will occur the first time you run the application. This may take several minutes depending on your internet connection.

### 3. Configure Environment (Optional)

Create a `.env` file in the backend directory to configure voice settings:

```
# Voice options
WHISPER_MODEL=base  # Options: tiny, base, small, medium, large
BARK_VOICE=v2/en_speaker_6  # Default voice for TTS
MAX_AUDIO_LENGTH=60  # Maximum audio length in seconds to process
```

## Frontend Setup

### 1. Install Dependencies

```bash
# Navigate to the frontend directory
cd ../frontend/frontend

# Install dependencies
npm install
```

### 2. Configure Environment

Create a `.env` file in the frontend/frontend directory:

```
VITE_API_URL=http://localhost:8000
```

## Starting the Application

### 1. Start the Backend

```bash
# From the project root directory
cd backend
source .venv/bin/activate  # If not already activated
python -m uvicorn main:app --reload --port 8000
```

### 2. Start the Frontend

```bash
# Open a new terminal
cd frontend/frontend
npm run dev
```

The application should now be running at `http://localhost:5173`.

## Testing the Voice Interface

### 1. Using the Test Script

We provide a comprehensive test script to verify the voice interface functionality:

```bash
# From the project root directory
python test_voice.py --test-all
```

This will test:
- Speech-to-text conversion
- Text-to-speech synthesis
- WebSocket functionality

You can also test individual components:

```bash
# Test only speech-to-text
python test_voice.py --test-stt

# Test only text-to-speech
python test_voice.py --test-tts

# Test only WebSocket functionality
python test_voice.py --test-ws
```

### 2. Manual Testing in Browser

1. Open the application in a browser (Chrome recommended)
2. Grant microphone permissions when prompted
3. Use the microphone button in the input box to start voice recording
4. Speak your query
5. Click the button again to stop recording and process the audio
6. You should receive both a text response and audio playback

## Troubleshooting

### Microphone Not Working

- Ensure your browser has permission to access the microphone
- Check that no other application is using the microphone
- Verify your microphone is properly connected and working

### Voice Services Not Available

If the voice services are not available in the health check:

1. Check backend logs for error messages
2. Ensure all required dependencies are installed
3. Verify models were downloaded correctly

Common model directories:
- Whisper: `~/.cache/whisper`
- Bark: `~/.cache/suno/bark_v0`

### WebSocket Connection Issues

1. Verify the backend is running and accessible
2. Check that the WebSocket URL is correctly formatted (`ws://` vs `wss://`)
3. Examine network logs in browser DevTools for connection errors

## Advanced Configuration

### Using a Different Whisper Model

```bash
# Edit .env file in backend directory
WHISPER_MODEL=medium  # Options: tiny, base, small, medium, large
```

Larger models provide better transcription quality but require more resources and time.

### Customizing TTS Voices

```bash
# Edit .env file in backend directory
BARK_VOICE=v2/en_speaker_9  # Different voice preset
```

Available voice presets are in the Bark documentation. If not specified, the default voice `v2/en_speaker_6` is used.

## Monitoring and Logging

Voice processing logs are available in the backend terminal. You can increase log verbosity by setting the log level:

```python
# In backend/main.py:
logging.basicConfig(level=logging.DEBUG)  # Change from INFO to DEBUG
```

## Security Considerations

- The voice interface transmits audio data to the server
- Audio is processed locally and not sent to external services
- No audio recordings are permanently stored
- WebSockets use the same authentication as the rest of the application 