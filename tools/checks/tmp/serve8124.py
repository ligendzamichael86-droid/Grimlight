#!/usr/bin/env python3
"""Agenten-Dev-Server fuer Grimlight auf Port 8124 (NIE 8123 = Auftraggeber).
Identisch zu tools/serve.py, nur der Port ist 8124. Serviert game/ ohne Cache."""
import http.server
import os
import sys

PORT = 8124
ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'game'))


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.js': 'text/javascript',
        '.mjs': 'text/javascript',
        '.json': 'application/json',
    }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        super().end_headers()

    def log_message(self, *args):
        pass  # ruhig halten


def main():
    server = http.server.ThreadingHTTPServer(('127.0.0.1', PORT), Handler)
    print(f'Grimlight-Agenten-Server: http://127.0.0.1:{PORT}  (serviert {ROOT})')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        sys.exit(0)


if __name__ == '__main__':
    main()
