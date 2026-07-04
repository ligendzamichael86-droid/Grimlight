# Workflow: Slice 0 — Spielbarer Kern

## Ziel

Ein im Browser spielbarer Kern von Grimlight: düstere Friedhofs-Map, Held mit
Schwert, Skelette mit einfacher KI, Herzen-HUD, Gold-Drops, Titel/Game-Over/Sieg,
Steuerung per Tastatur UND Touch.

## Inputs

- `CLAUDE.md` (Grundentscheidungen, Slice-Fahrplan)
- `design/SPEC_SLICE_0.md` (bindende technische Spezifikation)

## Ablauf (Multi-Agent-Pipeline mit Handovers)

1. **Design-Panel (parallel):**
   - GDD-Agent → `design/GDD.md` (Gesamtvision, Säulen, Loops, Gegner-Roster)
   - Pixel-Art-Agent → `game/js/art/palette.js` + `sprites.js` (Grafik als Code)
     + `design/ART_DIRECTION.md`; prüft sich selbst per Node-Checkskript
   - Spec-Review-Agent → zerpflückt die Spezifikation adversarial, Findings
     fließen als Klärungen in die Builder-Prompts
2. **Build (sequentiell, exklusiver Datei-Besitz):**
   - Builder A: `core/`, `world/`, `index.html`, `css/`, `tools/serve.py`,
     `tools/check_syntax.sh` → Handover = Interface-Übersicht aller Exporte
   - Builder B (erhält Handover A): `entities/`, `ui/`, `main.js`,
     `tools/smoke_test.mjs` → Handover = Testergebnis + Abweichungen
3. **Verify (parallel, nur lesend):** Testlauf (Syntax, Smoke, HTTP-Serve),
   Bug-Review (Kollision, Input-Edge-Cases, Loop, States), Spec-Compliance
4. **Fix:** Ein Fixer-Agent arbeitet alle kritischen/mittleren Findings ab,
   bis `check_syntax.sh` und `smoke_test.mjs` grün sind
5. **Proof:** Playwright + Chromium headless, Screenshots (Titel, Gameplay,
   Action) nach `.tmp/screenshots/`, Konsolen-Fehler werden mitprotokolliert

## Tools

- `tools/serve.py` — Dev-Server, Port 8123, serviert `game/`
- `tools/check_syntax.sh` — Node-Syntax-Check über alle JS-Module
- `tools/smoke_test.mjs` — Headless-Gameplay-Simulation (≥600 Ticks) mit Asserts

## Abnahme

Siehe `design/SPEC_SLICE_0.md` Abschnitt 5. Zusätzlich: Übergabedokument in
`uebergaben/` mit Testanleitung für den Auftraggeber.

## Erkenntnisse / Änderungen (Lauf vom 2026-07-01, 10 Agenten, ~47 Min.)

- Der adversariale Spec-Review VOR dem Build hat sich gelohnt: 12 Issues
  (u.a. Spawn-Anker, Doppel-Treffer pro Schwung, Touch-Letterbox-Umrechnung)
  flossen als Klärungen in die Builder-Prompts und mussten nicht nachträglich
  repariert werden.
- Sequentieller Build mit Interface-Handover (A → B) erzeugte keinerlei
  Integrationskonflikte; exklusiver Datei-Besitz strikt einhalten.
- Verify fand trotzdem noch 4 echte Findings (Fokus-Verlust-Reset, Tile-Rundung,
  Halbherz-Anzeige, Joystick-Skalierung) → die Read-only-Verify-Phase bleibt
  Pflicht, auch wenn Builder-Selbsttests grün sind.
- Playwright/Chromium funktioniert in dieser Umgebung: pip ist PEP-668-gesperrt
  → venv nötig; Chromium brauchte `sudo playwright install-deps chromium`.
- Detaillierte Festlegungen: siehe `uebergaben/2026-07-01_slice0_spielbarer_kern.md`.
