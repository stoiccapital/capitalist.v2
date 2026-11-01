#!/usr/bin/env python3
"""Dev server with no-cache headers.
   python3 serve.py              # port 8000
"""
import sys
from http.server import SimpleHTTPRequestHandler, HTTPServer

class NoCache(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
HTTPServer(('', port), NoCache).serve_forever()
