#!/usr/bin/env python
"""
Simple WebSocket Echo Server

This server uses the websockets library to create a simple echo server
that returns any messages sent to it.
"""

import asyncio
import json
import logging
import uuid
from websockets.server import serve

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("ws_server")

# Port to listen on
PORT = 8006

# Store active connections
active_connections = set()

async def echo_handler(websocket):
    """Handle WebSocket connections."""
    try:
        # Add websocket to active connections
        active_connections.add(websocket)
        client_id = str(uuid.uuid4())[:8]
        logger.info(f"New client connected! ID: {client_id}")
        
        # Send welcome message
        welcome_msg = json.dumps({
            "type": "connection_established",
            "client_id": client_id
        })
        await websocket.send(welcome_msg)
        logger.debug(f"Sent welcome message to client {client_id}")

        # Handle incoming messages
        async for message in websocket:
            try:
                logger.info(f"Received message from client {client_id}: {message}")
                
                # Try to parse as JSON
                data = json.loads(message)
                
                # Handle different message types
                if data.get("command") == "ping":
                    response = {
                        "type": "pong",
                        "timestamp": asyncio.get_event_loop().time()
                    }
                    await websocket.send(json.dumps(response))
                    logger.debug(f"Sent pong response to client {client_id}")
                else:
                    # Echo back the message
                    response = {
                        "type": "echo",
                        "original_message": data,
                        "timestamp": asyncio.get_event_loop().time()
                    }
                    await websocket.send(json.dumps(response))
                    logger.debug(f"Echoed message back to client {client_id}")
                    
            except json.JSONDecodeError:
                logger.warning(f"Received non-JSON message from client {client_id}")
                # Echo back non-JSON messages as plain text
                response = {
                    "type": "echo",
                    "original_message": message,
                    "error": "Message was not valid JSON"
                }
                await websocket.send(json.dumps(response))
                
    except Exception as e:
        logger.error(f"Error handling WebSocket connection: {e}")
    finally:
        # Remove websocket from active connections
        active_connections.remove(websocket)
        logger.info(f"Client {client_id} disconnected")

async def main():
    """Start the WebSocket server."""
    logger.info(f"Starting WebSocket echo server on port {PORT}")
    async with serve(echo_handler, "localhost", PORT):
        await asyncio.Future()  # Run forever

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    except Exception as e:
        logger.error(f"Server error: {e}")
        import sys
        sys.exit(1) 