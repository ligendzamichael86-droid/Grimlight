---
name: reference-server-umgebung
description: "Entwicklungsserver (code-server-Container 172.18.0.3, Hostinger-VPS): Werkzeuge, Browser, sudo, Ports, Proxy-Eigenheiten"
metadata:
  type: reference
---

- code-server unter https://code.srv1457801.hstgr.cloud/, Proxy `/proxy/<port>/` (mit Schlussstrich);
  **Direktlinks auf Unterpfade → 401**, Downloads/Startseiten immer als Root-Seite eines eigenen Ports.
- Ports: 8123 Michael NIE, 8125 Grimlight, 8126 Fotoscanner, 8127 Küchensklave-App, 8128 Küchensklave-Download.
- 2 Kerne, 7 GB RAM, /dev/shm 64 MB (Chromium braucht --disable-dev-shm-usage). Workflow-Cap = 2 Agenten je Workflow.
- **sudo ohne Passwort funktioniert** (`sudo -n true`), apt möglich (10.09.2026 festgestellt).
- Playwright in /home/coder/Fotoscanner/app/node_modules (kein npx: `node_modules/.bin/playwright`);
  Browser: chromium-1228 **und seit 10.09.2026 webkit-2311** (Safari-Maschine, install-deps per sudo erledigt).
- Python 3.13 System; Pillow/OpenCV nur in /home/coder/Fotoscanner/.venv; JDK 17 + Android-SDK in /home/coder/Grimlight/toolchain/.
- Read-Werkzeug fällt zeitweise aus (PreToolUse-Hook-Timeout, VS-Code-Host offline) — Bash läuft weiter; Bilder dann per SendUserFile an Michael.
