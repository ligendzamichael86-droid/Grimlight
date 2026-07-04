#!/usr/bin/env python3
"""Dev-Server für Grimlight: serviert game/ auf Port 8123, ohne Cache."""
import http.server
import os
import sys

PORT = 8123
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


def main():
    server = http.server.ThreadingHTTPServer(('0.0.0.0', PORT), Handler)
    print(f'Grimlight-Dev-Server: http://localhost:{PORT}  (serviert {ROOT})')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nServer gestoppt.')
        sys.exit(0)


if __name__ == '__main__':
    main()
