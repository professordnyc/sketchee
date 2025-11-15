#!/usr/bin/env python3
"""
Simple HTTP Server for Sketchee MVP
"""

import http.server
import socketserver
import webbrowser
import os

PORT = 8080

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=os.getcwd(), **kwargs)
    
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        super().end_headers()

def start_server():
    try:
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            print("Starting Sketchee MVP server...")
            print(f"Server running at: http://localhost:{PORT}")
            print(f"Serving from: {os.getcwd()}")
            print(f"Open: http://localhost:{PORT}/index-final.html")
            print("Press Ctrl+C to stop")
            
            try:
                webbrowser.open(f'http://localhost:{PORT}/index-final.html')
                print("Opening browser...")
            except:
                print("Manually open: http://localhost:{PORT}/index-final.html")
            
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\nServer stopped")
    except OSError as e:
        if e.errno == 10048:
            print(f"Port {PORT} is already in use!")
        else:
            print(f"Error: {e}")

if __name__ == "__main__":
    start_server()
