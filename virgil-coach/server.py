#!/usr/bin/env python3
"""
Simple HTTPS development server for Virgil Coach PWA
PWA features require HTTPS, so this provides a local development server with SSL
"""

import http.server
import ssl
import socketserver
import os
import sys
from pathlib import Path

# Configuration
PORT = 8443
HOST = 'localhost'
CERT_FILE = 'localhost.pem'
KEY_FILE = 'localhost-key.pem'

class PWAHandler(http.server.SimpleHTTPRequestHandler):
    """Custom handler with PWA-friendly headers"""
    
    def end_headers(self):
        # Add security headers for PWA
        self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        self.send_header('Cross-Origin-Resource-Policy', 'same-origin')
        
        # Service Worker headers
        if self.path.endswith('.js'):
            self.send_header('Service-Worker-Allowed', '/')
            
        # Manifest headers
        if self.path.endswith('.json'):
            self.send_header('Content-Type', 'application/manifest+json')
            
        super().end_headers()
    
    def do_GET(self):
        # Serve index.html for PWA routes
        if self.path == '/' or self.path.startswith('/?'):
            self.path = '/index.html'
        return super().do_GET()

def generate_self_signed_cert():
    """Generate a self-signed certificate for HTTPS development"""
    try:
        import subprocess
        
        print("Generating self-signed certificate...")
        
        # Generate private key
        subprocess.run([
            'openssl', 'genpkey', '-algorithm', 'RSA', '-out', KEY_FILE, 
            '-pkcs8', '-aes256', '-pass', 'pass:password'
        ], check=True, capture_output=True)
        
        # Generate certificate
        subprocess.run([
            'openssl', 'req', '-new', '-x509', '-key', KEY_FILE, 
            '-out', CERT_FILE, '-days', '365', '-passin', 'pass:password',
            '-subj', f'/CN={HOST}'
        ], check=True, capture_output=True)
        
        print(f"✅ Certificate generated: {CERT_FILE}")
        return True
        
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ Could not generate certificate. Install OpenSSL or provide existing certificates.")
        return False

def check_files():
    """Check if required files exist"""
    required_files = ['index.html', 'app.js', 'manifest.json', 'sw.js']
    missing_files = []
    
    for file in required_files:
        if not Path(file).exists():
            missing_files.append(file)
    
    if missing_files:
        print(f"❌ Missing required files: {', '.join(missing_files)}")
        return False
    
    print("✅ All required files found")
    return True

def start_server():
    """Start the HTTPS development server"""
    if not check_files():
        sys.exit(1)
    
    # Check for certificates
    if not (Path(CERT_FILE).exists() and Path(KEY_FILE).exists()):
        if not generate_self_signed_cert():
            print("❌ Cannot start HTTPS server without certificates")
            sys.exit(1)
    
    # Create SSL context
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    try:
        context.load_cert_chain(CERT_FILE, KEY_FILE, password='password')
    except ssl.SSLError:
        # Try without password
        try:
            context.load_cert_chain(CERT_FILE, KEY_FILE)
        except ssl.SSLError as e:
            print(f"❌ SSL certificate error: {e}")
            sys.exit(1)
    
    # Start server
    with socketserver.TCPServer((HOST, PORT), PWAHandler) as httpd:
        httpd.socket = context.wrap_socket(httpd.socket, server_side=True)
        
        print(f"""
🎭 Virgil Coach Development Server
┌──────────────────────────────────────┐
│ URL: https://{HOST}:{PORT}              │
│ PWA: Features enabled with HTTPS    │
│ Mode: Development                    │
└──────────────────────────────────────┘

📝 Setup Instructions:
1. Accept the self-signed certificate warning
2. Grant microphone permissions
3. Install as PWA when prompted

⚠️  Browser Warning:
Your browser will warn about the self-signed certificate.
Click "Advanced" → "Proceed to {HOST}" to continue.

🛑 Press Ctrl+C to stop
        """)
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n👋 Server stopped")

if __name__ == '__main__':
    start_server() 