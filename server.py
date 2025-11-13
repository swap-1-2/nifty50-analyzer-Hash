#!/usr/bin/env python3
"""
Simple HTTP Server for Stock Analysis App
Run this file to start a local web server and avoid CORS issues.
"""

import http.server
import socketserver
import webbrowser
import os

PORT = 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

# Change to the script's directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))

Handler = MyHTTPRequestHandler

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    url = f"http://localhost:{PORT}"
    print(f"✅ Server started successfully!")
    print(f"🌐 Open your browser and go to: {url}")
    print(f"📊 Stock Analysis App is running...")
    print(f"⏹️  Press Ctrl+C to stop the server\n")
    
    # Automatically open browser
    try:
        webbrowser.open(url)
    except:
        pass
    
    httpd.serve_forever()
