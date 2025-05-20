#!/usr/bin/env python
"""
Standalone WebSocket server for testing WebSocket connections.
This is a simple echo server that doesn't depend on the Virgil backend.
"""

import asyncio
import json
import logging
import sys
import uuid
from typing import Dict, Any

# Import the standard websockets library
import websockets

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,  # Set to DEBUG for more verbose logging
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("websocket_server")

# Dictionary to store active connections - use Any type to avoid deprecation warning
active_connections: Dict[str, Any] = {}

async def register(websocket, session_id):
    """Register a new WebSocket connection."""
    active_connections[session_id] = websocket
    logger.info(f"Client connected with session ID {session_id}. Total connections: {len(active_connections)}")

async def unregister(session_id):
    """Unregister a WebSocket connection when it's closed."""
    if session_id in active_connections:
        del active_connections[session_id]
        logger.info(f"Client disconnected with session ID {session_id}. Total connections: {len(active_connections)}")

async def handle_websocket(websocket, path):
    """Handle WebSocket connections."""
    # Extract session ID from path
    if path.startswith('/ws/audio/'):
        session_id = path[len('/ws/audio/'):]
    else:
        session_id = str(uuid.uuid4())
    
    logger.debug(f"New connection request with path: {path}, using session ID: {session_id}")
    
    # Register the connection
    await register(websocket, session_id)
    
    try:
        # Send a welcome message
        welcome_msg = json.dumps({
            "type": "info",
            "message": f"Connected to test WebSocket server with session ID: {session_id}"
        })
        logger.debug(f"Sending welcome message: {welcome_msg}")
        await websocket.send(welcome_msg)
        
        # Process incoming messages
        async for message in websocket:
            logger.info(f"Received message from {session_id}: {message}")
            
            try:
                # Try to parse as JSON
                data = json.loads(message)
                logger.debug(f"Parsed JSON: {data}")
                
                # Handle ping command
                if isinstance(data, dict) and data.get("command") == "ping":
                    response = json.dumps({
                        "type": "pong",
                        "session_id": session_id,
                        "message": "Server is alive!"
                    })
                    logger.debug(f"Sending ping response: {response}")
                    await websocket.send(response)
                # Echo other commands
                else:
                    response = json.dumps({
                        "type": "echo",
                        "session_id": session_id,
                        "message": data
                    })
                    logger.debug(f"Sending echo response: {response}")
                    await websocket.send(response)
            except json.JSONDecodeError:
                # Not JSON, just echo as text
                response = json.dumps({
                    "type": "echo",
                    "session_id": session_id,
                    "message": message
                })
                logger.debug(f"Sending non-JSON echo response: {response}")
                await websocket.send(response)
                
    except websockets.exceptions.ConnectionClosed as e:
        logger.info(f"Connection closed for {session_id}: code={e.code}, reason={e.reason}")
    except Exception as e:
        logger.error(f"Error handling WebSocket for {session_id}: {e}")
        import traceback
        logger.error(traceback.format_exc())
    finally:
        # Unregister the connection
        await unregister(session_id)

async def main():
    """Start the WebSocket server."""
    # Use port 8003 to avoid conflict
    port = 8003
    logger.info(f"Starting WebSocket test server on port {port}")
    
    # Start the WebSocket server
    async with websockets.serve(handle_websocket, "localhost", port):
        await asyncio.Future()  # Run forever

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    except Exception as e:
        logger.error(f"Server error: {e}")
        sys.exit(1) 