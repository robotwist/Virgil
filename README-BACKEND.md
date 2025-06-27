# Virgil Backend Setup

This document provides step-by-step instructions for setting up and running the Virgil backend server.

## System Requirements

- Python 3.10+
- pip (Python package manager)
- Virtual environment module (venv)

## Setup Steps

1. **Open a terminal outside of Cursor IDE**
   - Cursor appears to intercept certain commands, so use a standalone terminal

2. **Navigate to the backend directory**
   ```bash
   cd /home/robwistrand/code/solo/virgil/backend
   ```

3. **Setup a fresh virtual environment**
   ```bash
   # Remove existing venv if it's causing issues
   rm -rf venv_new
   
   # Create a new virtual environment
   python3 -m venv venv_new
   
   # Activate the new environment
   source venv_new/bin/activate
   ```

4. **Install dependencies with specific versions**
   ```bash
   pip install fastapi==0.109.2
   pip install uvicorn[standard]==0.22.0
   pip install websockets==9.1
   pip install -r requirements.txt
   ```

5. **Run the server**
   ```bash
   # Start the server
   python -m uvicorn main:app --host 0.0.0.0 --port 8000
   ```

6. **Verify the server is running**
   - In another terminal window:
   ```bash
   curl http://localhost:8000/health
   ```
   - You should see a JSON response indicating the server is healthy

## Troubleshooting

If you encounter errors:

1. **Check for port conflicts**
   ```bash
   sudo lsof -i :8000
   ```
   If the port is in use, try a different port with `--port 8080`

2. **Check error logs**
   - Look for error messages in the terminal running the server

3. **Python import issues**
   - Ensure all dependencies are installed in the correct environment
   ```bash
   pip list | grep websockets
   pip list | grep uvicorn
   ```

4. **Cursor IDE interference**
   - If running in Cursor's terminal, some commands may be intercepted
   - Use an external terminal for better control

## Additional Notes

- The frontend expects the backend at `http://localhost:8000` by default
- If you change the backend port, update the frontend environment variables accordingly 