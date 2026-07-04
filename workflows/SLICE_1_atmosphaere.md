# Workflow: Slice 1 — Diablo-Atmosphäre + Grafik-Pass

## Ziel

Katakomben-Ebene unter dem Friedhof mit echtem Licht-System (Dunkelheit +
posterisierte Fackel-Lichtkreise), zerschlagbare Vasen/Urnen mit Drops, Tränke
(sammeln + trinken, Touch-Button B), neuer Gegner Ghul, Schatztruhe als neues
Slice-Ziel, plus Grafik-Pass: 4-Frame-Laufzyklen, Sterbe-Animation, Deko-Tiles
gegen die leere Map, Nebelschwaden auf dem Friedhof.

## Inputs

- `design/SPEC_SLICE_1.md` (bindend)
- `uebergaben/2026-07-01_slice0_spielbarer_kern.md` (bindende Festlegungen)
- Bestehender Slice-0-Code (Interfaces bleiben gültig)

## Ablauf (Multi-Agent-Pipeline, wie Slice 0 erprobt)

1. **Design (parallel):** Pixel-Artist erweitert `art/` abwärtskompatibel
   (alte Schlüssel bleiben); Spec-Reviewer zerpflückt die Spezifikation gegen
   den echten Slice-0-Code → Klärungen für die Builder
2. **Build (sequentiell, exklusiver Besitz):**
   - Builder A: `core/lighting.js` (neu), `input.js` (Trank-Taste/Button B),
     `tilemap.findTiles`, `maps.js` (Friedhof-Überarbeitung + Katakomben)
   - Builder B (erhält Handover A): `entities/props.js` (neu), Tränke im Player,
     Ghul, HUD (Tränke, Fog), `main.js` (Map-Wechsel mit Fade, Lichter,
     Sieg via Truhe, `?map=`-Dev-Parameter), Smoke-Test-Erweiterung
3. **Verify (parallel, lesend):** Testlauf (3× Smoke wegen Zufallspfaden),
   Bug-Review (Map-Wechsel-, Licht-, Props-, Trank-Ecken), Spec-Compliance
4. **Fix:** Fixer arbeitet kritische/mittlere Findings ab, Tests wieder grün
5. **Proof:** Playwright-Screenshots Friedhof UND Katakomben (`?map=CATACOMBS`),
   Konsolen-Fehler-Protokoll

## Betriebshinweise (aus Slice 0 gelernt)

- Dev-Server läuft dauerhaft auf Port 8123 → Agenten dürfen ihn weder starten
  noch killen (kein pkill auf python!)
- Playwright-venv liegt im Session-Scratchpad (`…/scratchpad/pwenv`),
  Chromium-Deps sind systemweit installiert
- Smoke-Test mehrfach laufen lassen (Wander-/Drop-Zufall)

## Abnahme

Siehe `design/SPEC_SLICE_1.md` Abschnitt 4. Übergabedokument in `uebergaben/`.

## Erkenntnisse / Änderungen (Lauf 01./02.07.2026, 2 Anläufe, 13 Agenten gesamt)

- Session-Limit brach den ersten Lauf mitten in Builder B ab → **Workflow-Resume
  mit resumeFromRunId funktioniert**: Design + Builder A kamen aus dem Cache,
  nur Builder B und Folgephasen liefen neu. Abbrüche kosten so fast nichts.
- Builder B fand seine Dateien teilimplementiert vor (Stand vor dem Abbruch) und
  hat verifiziert statt blind neu geschrieben — Prompts sollten weiterhin
  "prüfe Vorhandenes gegen Spec" zulassen.
- Headless-Flusstests durch die echte main.js (mit gestubbtem Canvas/rAF) haben
  sich bewährt: kompletter Spieldurchlauf inkl. Sieg-Pfad ohne Browser testbar.
- Verify fand nur 1 echtes Finding (`?map=constructor`-Crash via truthy-Lookup);
  der adversariale Spec-Review vor dem Build hatte die großen Fallen
  (Portal-Ping-Pong, attackId über Props+Gegner, Sieg/Tod-Race) schon entschärft.
- Dauerhaft laufender Dev-Server auf 8123 + explizites "nicht killen" in allen
  Agenten-Prompts hat Kollisionen sauber verhindert.
- Details und bindende Festlegungen: `uebergaben/2026-07-02_slice1_atmosphaere.md`.
