#!/usr/bin/env python3
"""
Diagnostic script to identify issues with Python and system environment.
"""
import sys
import os
import platform
import subprocess

def run_command(cmd):
    """Run a system command and return its output."""
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, shell=True)
        return f"Exit code: {result.returncode}\nOutput:\n{result.stdout}\nError:\n{result.stderr}"
    except Exception as e:
        return f"Error running command: {e}"

print("==================== SYSTEM DIAGNOSTICS ====================")
print(f"Python version: {sys.version}")
print(f"Python executable: {sys.executable}")
print(f"Python path: {sys.path}")
print(f"Platform: {platform.platform()}")
print(f"Machine: {platform.machine()}")
print(f"Processor: {platform.processor()}")
print(f"System: {platform.system()}")
print(f"Current directory: {os.getcwd()}")

print("\n==================== INSTALLED PACKAGES ====================")
print("Attempting to import required packages:")

try:
    import fastapi
    print(f"FastAPI version: {fastapi.__version__}")
except ImportError as e:
    print(f"FastAPI import error: {e}")

try:
    import uvicorn
    print(f"Uvicorn version: {uvicorn.__version__}")
except ImportError as e:
    print(f"Uvicorn import error: {e}")

try:
    import websockets
    print(f"Websockets version: {websockets.__version__}")
    print(f"Websockets modules: {dir(websockets)}")
    if hasattr(websockets, 'datastructures'):
        print("websockets.datastructures is available")
    else:
        print("websockets.datastructures is NOT available")
except ImportError as e:
    print(f"Websockets import error: {e}")

print("\n==================== ENVIRONMENT ====================")
print("Environment variables:")
for key, value in os.environ.items():
    print(f"{key}={value}")

print("\n==================== SYSTEM COMMANDS ====================")
commands = [
    "which python3",
    "which uvicorn",
    "ls -la ./venv/bin/python3",
    "netstat -tulpn | grep 8000",
    "ps aux | grep uvicorn",
    "pip list"
]

for cmd in commands:
    print(f"\nRunning command: {cmd}")
    print(run_command(cmd))

print("\n==================== MAIN FILE CHECK ====================")
if os.path.exists("main.py"):
    print("main.py exists in the current directory")
    print(f"Size: {os.path.getsize('main.py')} bytes")
else:
    print("main.py does NOT exist in the current directory")

print("\nDiagnostics completed. Please share this output for troubleshooting.")

if __name__ == "__main__":
    # Try to start the server
    try:
        print("\n==================== SERVER STARTUP ATTEMPT ====================")
        print("Attempting to start Uvicorn server...")
        import uvicorn
        uvicorn.run("main:app", host="0.0.0.0", port=8000)
    except Exception as e:
        print(f"Error starting server: {e}") 