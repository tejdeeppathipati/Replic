#!/usr/bin/env python3
"""
Mock core service for testing decision webhooks.

This simple HTTP server receives decision callbacks from the approval gateway
and prints them to stdout. Useful for local testing.

Usage:
    python tools/mock_core.py [--port 9000]
"""

import argparse
from http.server import HTTPServer, BaseHTTPRequestHandler
import json


class DecisionHandler(BaseHTTPRequestHandler):
    """HTTP handler for receiving decision callbacks."""
    
    def do_POST(self):
        """Handle POST requests."""
        if self.path == "/decisions":
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            
            try:
                decision = json.loads(body)
                
                print("\n" + "="*60)
                print("DECISION RECEIVED")
                print("="*60)
                print(f"Candidate ID:  {decision.get('id')}")
                print(f"Decision:      {decision.get('decision')}")
                print(f"Final Text:    {decision.get('final_text')}")
                print(f"Decider:       {decision.get('decider')}")
                print(f"Latency:       {decision.get('latency_ms')}ms")
                print("="*60 + "\n")
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "ok"}).encode())
                
            except json.JSONDecodeError:
                print("Invalid JSON received")
                self.send_response(400)
                self.end_headers()
        else:
            self.send_response(404)
            self.end_headers()
    
    def log_message(self, format, *args):
        """Suppress default logging."""
        pass


def main():
    parser = argparse.ArgumentParser(description="Mock core service for testing")
    parser.add_argument("--port", type=int, default=9000, help="Port to listen on")
    args = parser.parse_args()
    
    server = HTTPServer(('localhost', args.port), DecisionHandler)
    
    print(f"🎭 Mock Core Service")
    print(f"   Listening on http://localhost:{args.port}")
    print(f"   Decision webhook: http://localhost:{args.port}/decisions")
    print(f"\n   Waiting for decisions from approval gateway...\n")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n\nShutting down mock core service")
        server.shutdown()


if __name__ == "__main__":
    main()

