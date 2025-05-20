#!/usr/bin/env python
"""
Simple HTTP server for testing connectivity.
This provides a basic API endpoint that returns JSON.
"""

import http.server
import socketserver
import json
import uuid
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("http_server")

# Port to listen on
PORT = 8005

class TestHandler(http.server.BaseHTTPRequestHandler):
    """Custom request handler for the test server."""

    def _set_headers(self):
        """Set common headers for responses."""
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()

    def do_GET(self):
        """Handle GET requests."""
        logger.info(f"GET request received: {self.path}")
        
        # Route for health check
        if self.path == '/health':
            self._set_headers()
            response = {
                "status": "healthy",
                "version": "0.1.0"
            }
            self.wfile.write(json.dumps(response).encode())
        
        # Route for ping
        elif self.path == '/ping':
            self._set_headers()
            response = {
                "type": "pong",
                "message": "Server is alive!",
                "session_id": str(uuid.uuid4())
            }
            self.wfile.write(json.dumps(response).encode())
        
        # Default route
        else:
            self._set_headers()
            response = {
                "message": f"Endpoint {self.path} not found",
                "available_endpoints": ["/health", "/ping"]
            }
            self.wfile.write(json.dumps(response).encode())

    def do_POST(self):
        """Handle POST requests."""
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        logger.info(f"POST request received: {self.path}, data: {post_data}")
        
        try:
            data = json.loads(post_data)
            
            # Echo endpoint
            if self.path == '/echo':
                self._set_headers()
                response = {
                    "type": "echo",
                    "message": data,
                    "session_id": str(uuid.uuid4())
                }
                self.wfile.write(json.dumps(response).encode())
            
            # Default route
            else:
                self._set_headers()
                response = {
                    "message": f"Endpoint {self.path} not found",
                    "available_endpoints": ["/echo"]
                }
                self.wfile.write(json.dumps(response).encode())
                
        except json.JSONDecodeError:
            self._set_headers()
            response = {
                "error": "Invalid JSON in request body"
            }
            self.wfile.write(json.dumps(response).encode())

def run_server():
    """Start the HTTP server."""
    with socketserver.TCPServer(("", PORT), TestHandler) as httpd:
        logger.info(f"Starting HTTP test server on port {PORT}")
        httpd.serve_forever()

if __name__ == "__main__":
    try:
        run_server()
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    except Exception as e:
        logger.error(f"Server error: {e}")
        import sys
        sys.exit(1) 