#!/usr/bin/env python3
"""serve_apk.py — liefert das Debug-APK auf Port 8125 aus. Slice 4 §2.2/§0.8.

Warum ein eigener Server statt tools/serve.py:
  * Port 8123 ist Michaels Dev-Server und wird NIE angefasst (Spec §0.8).
  * Chrome auf Android startet den Download zuverlaessig bei
    'application/octet-stream'. Pythons mimetypes wuerde
    'application/vnd.android.package-archive' raten — damit versucht Chrome
    teils zu installieren statt zu speichern (Landkarte A.4).
  * Es wird GENAU EINE Datei ausgeliefert, kein Verzeichnis: das APK. Kein
    Directory-Listing, kein Zugriff auf das Repo.

Aufruf:
    python3 tools/serve_apk.py                 # Vordergrund, Strg-C beendet
    python3 tools/serve_apk.py --port 8125     # Port frei waehlbar (8123 gesperrt)

Im Hintergrund laufen lassen, waehrend Michael tippt (der Kanal muss offen
bleiben, auch wenn die Agenten-Shell endet):
    nohup python3 tools/serve_apk.py > .tmp/serve_apk_8125.log 2>&1 &
    echo $! > .tmp/serve_apk_8125.pid
Stoppen:
    kill "$(cat .tmp/serve_apk_8125.pid)"

Headless-Nachweis (Spec A2, der Proxy-Weg gehoert zu Michaels Anleitung):
    curl -sI http://127.0.0.1:8125/app-debug.apk
    -> HTTP/1.0 200 OK, Content-Type: application/octet-stream, Content-Length
"""
import argparse
import http.server
import os
import socket
import sys
import time

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
APK = os.path.join(ROOT, 'mobile', 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk')
NAME = 'app-debug.apk'
STANDARD_PORT = 8125
GESPERRT = {8123}  # Michaels Dev-Server. Nie belegen.


class Handler(http.server.BaseHTTPRequestHandler):
    server_version = 'GrimlightAPK/1.0'
    protocol_version = 'HTTP/1.0'

    def log_message(self, fmt, *args):
        sys.stdout.write('%s  %s  %s\n' % (
            time.strftime('%H:%M:%S'), self.address_string(), fmt % args))
        sys.stdout.flush()

    # ---- gemeinsame Kopfzeilen ------------------------------------------
    def _apk_kopf(self, groesse):
        self.send_response(200)
        # octet-stream ist der zuverlaessige Download-Ausloeser in Chrome.
        self.send_header('Content-Type', 'application/octet-stream')
        self.send_header('Content-Length', str(groesse))
        self.send_header('Content-Disposition', 'attachment; filename="%s"' % NAME)
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()

    def _seite(self, koerper, code=200):
        roh = koerper.encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Content-Length', str(len(roh)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        return roh

    # ---- Routen ----------------------------------------------------------
    def _pfad(self):
        return self.path.split('?', 1)[0].rstrip('/') or '/'

    def do_HEAD(self):
        p = self._pfad()
        if p in ('/' + NAME, '/'):
            if not os.path.isfile(APK):
                self.send_error(404, 'APK noch nicht gebaut')
                return
            if p == '/':
                self._seite(startseite())
                return
            self._apk_kopf(os.path.getsize(APK))
            return
        self.send_error(404, 'nur /%s wird ausgeliefert' % NAME)

    def do_GET(self):
        p = self._pfad()
        if p == '/':
            roh = self._seite(startseite())
            self.wfile.write(roh)
            return
        if p == '/' + NAME:
            if not os.path.isfile(APK):
                self.send_error(404, 'APK noch nicht gebaut — erst bash tools/build_apk.sh')
                return
            groesse = os.path.getsize(APK)
            self._apk_kopf(groesse)
            with open(APK, 'rb') as f:
                while True:
                    stueck = f.read(64 * 1024)
                    if not stueck:
                        break
                    self.wfile.write(stueck)
            return
        self.send_error(404, 'nur /%s wird ausgeliefert' % NAME)


def startseite():
    if os.path.isfile(APK):
        mb = os.path.getsize(APK) / (1024 * 1024)
        stand = time.strftime('%d.%m.%Y %H:%M', time.localtime(os.path.getmtime(APK)))
        zeile = '<p>app-debug.apk &middot; %.1f MB &middot; gebaut %s</p>' % (mb, stand)
        # Der Link wird per Skript auf den vollen Pfad umgeschrieben: hinter
        # dem code-server-Proxy loest ein relativer href sonst falsch auf,
        # wenn die Seite OHNE Schlussstrich geoeffnet wurde (/proxy/8125 ->
        # Browser-Basis /proxy/ -> "invalid port"). Beleg: Michael 15.08.2026.
        knopf = '<p><a id="dl" href="%s">Grimlight herunterladen</a></p>' % NAME
    else:
        zeile = '<p>Noch kein APK gebaut.</p>'
        knopf = '<p>Auf dem Server zuerst <code>bash tools/build_apk.sh</code> laufen lassen.</p>'
    return (
        '<!doctype html><html lang="de"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width, initial-scale=1">'
        '<title>Grimlight APK</title>'
        '<style>body{font-family:system-ui,sans-serif;background:#1a2a1b;color:#f1e9d3;'
        'margin:0;padding:2rem;line-height:1.6}a{color:#f0bf4e;font-size:1.4rem}'
        'code{background:#0f1a12;padding:.1rem .3rem}</style></head><body>'
        '<h1>Grimlight</h1>' + zeile + knopf +
        '<p>Danach die Datei antippen. Android fragt einmalig nach der Freigabe '
        'fuer unbekannte Quellen.</p>'
        '<script>var a=document.getElementById("dl");if(a){var p=location.pathname;'
        'if(p.charAt(p.length-1)!=="/"){p+="/";}a.href=p+a.getAttribute("href");}'
        '</script></body></html>')


def port_frei(port):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        s.bind(('0.0.0.0', port))
        return True
    except OSError:
        return False
    finally:
        s.close()


def main():
    ap = argparse.ArgumentParser(description='Liefert das Grimlight-Debug-APK aus.')
    ap.add_argument('--port', type=int, default=STANDARD_PORT)
    args = ap.parse_args()

    if args.port in GESPERRT:
        print('FEHLER: Port %d ist gesperrt (Michaels Dev-Server, Spec §0.8).' % args.port,
              file=sys.stderr)
        return 2
    if not port_frei(args.port):
        print('FEHLER: Port %d ist belegt. Laeuft schon ein serve_apk.py?' % args.port,
              file=sys.stderr)
        return 2
    if not os.path.isfile(APK):
        print('WARNUNG: %s fehlt — erst  bash tools/build_apk.sh' % APK, file=sys.stderr)

    server = http.server.ThreadingHTTPServer(('0.0.0.0', args.port), Handler)
    print('Grimlight-APK-Server auf Port %d' % args.port)
    print('  Datei    %s' % APK)
    print('  lokal    http://127.0.0.1:%d/%s' % (args.port, NAME))
    proxy = os.environ.get('VSCODE_PROXY_URI')
    if proxy:
        print('  Handy    %s%s' % (proxy.replace('{{port}}', str(args.port)), NAME))
    print('  Stoppen  Strg-C  (oder kill auf die PID)')
    sys.stdout.flush()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nServer gestoppt.')
    finally:
        server.server_close()
    return 0


if __name__ == '__main__':
    sys.exit(main())
