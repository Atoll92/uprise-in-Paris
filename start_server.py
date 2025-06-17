#!/usr/bin/env python3
"""
Simple HTTP server for Paris Tactical RPG 3D
Run this to serve the game with texture support
"""

import http.server
import socketserver
import webbrowser
import os
import time

PORT = 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers to allow texture loading
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        super().end_headers()

def main():
    # Change to the directory containing this script
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    print("🎮 Starting Paris Tactical RPG 3D Server...")
    print(f"📁 Serving files from: {os.getcwd()}")
    print(f"🌐 Server URL: http://localhost:{PORT}")
    print("🚀 Opening game in browser...")
    print("\n✨ Features enabled:")
    print("   - Parisian cobblestone textures")
    print("   - Zoom controls")
    print("   - Arrow key camera movement")
    print("   - Audio effects")
    
    try:
        with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
            print(f"\n🟢 Server running on port {PORT}")
            print("🔗 Game URL: http://localhost:8000")
            print("\n💡 Press Ctrl+C to stop the server")
            
            # Open browser after a short delay
            time.sleep(1)
            webbrowser.open(f'http://localhost:{PORT}')
            
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ Port {PORT} is already in use!")
            print("💡 Try killing existing server: lsof -ti:8000 | xargs kill")
        else:
            print(f"❌ Error starting server: {e}")

if __name__ == "__main__":
    main()