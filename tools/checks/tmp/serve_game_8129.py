#!/usr/bin/env python3
"""Vorschau-Server fuer Michael auf 8129 (gleicher Handler wie tools/serve.py, kein Cache). 8123 bleibt Michaels eigener Server."""
import sys, os, http.server
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'tools'))
import serve
srv = http.server.ThreadingHTTPServer(('0.0.0.0', 8129), serve.Handler)
print('Grimlight-Vorschau auf 8129 (serviert', serve.ROOT, ')', flush=True)
srv.serve_forever()
