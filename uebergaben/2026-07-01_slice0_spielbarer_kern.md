# Übergabe 2026-07-01 — Slice 0 "Spielbarer Kern" FERTIG

## Status

Slice 0 ist komplett gebaut, verifiziert und abgenommen:
- `bash tools/check_syntax.sh` → grün (13 JS-Dateien)
- `node tools/smoke_test.mjs` → grün (23 Assertions, 1268 simulierte Ticks, 8 Wiederholungsläufe stabil)
- Headless-Chromium-Proof: Titel, Gameplay und Action-Szene ohne einen einzigen
  Konsolen-Fehler; Screenshots in `.tmp/screenshots/`

## Was spielbar ist

Titelbildschirm → Friedhofs-Map (40×24 Tiles, Kamera folgt) → Held mit Schwert
(WASD/Pfeile + J/Leertaste, Touch: linke Hälfte Joystick, rechts Angriffs-Button)
→ 6 Skelette (wandern, verfolgen ab 96 px, Kontaktschaden) → Gold-Drops einsammeln
→ Sieg-Banner bzw. Game Over mit Neustart. 3 Herzen à 2 HP mit Halbherz-Anzeige,
1 s Unverwundbarkeit nach Treffer, Vignette + flackernde Fackeln für die Stimmung.

## Testen

```
python3 tools/serve.py     # Port 8123, dann im Browser http://localhost:8123
```

## Wichtige Festlegungen aus dem Build (bindend für kommende Slices)

1. Spawn-Koordinaten in `maps.js` sind Weltpixel und meinen das ZENTRUM der
   Entity-AABB (12×14). Umrechnung: `x = spawn.x - w/2`.
2. Einmal-Treffer pro Schwertschwung über `player.attackId` / `enemy.hitAttackId`;
   Schaden und Knockback wendet `updateEnemies` an.
3. Knockback: 140 px/s Start, 0,15 s linear auslaufend, immer durch
   `moveWithCollision` (nie direkt Position setzen → sonst Wand-Tunneling).
4. Drops tragen eine `map`-Referenz, Streu-Impuls läuft durch `moveWithCollision`
   (kein Drop in soliden Tiles → Sieg-Bedingung bleibt immer erfüllbar).
5. Angriff blockiert Bewegung nur 0,27 s (Ausholen + aktiv), im Rest-Cooldown ist
   Bewegung frei — fühlt sich deutlich besser an.
6. Rendering: ALLE Zeichner runden `weltX - camera.x` (nicht die Kamera vorab),
   Tile-Culling bis `floor(cam + view)` — sonst Lücken/Jitter.
7. `input.js` leert alle gedrückten Tasten bei `window blur` / `visibilitychange`
   (sonst läuft der Held nach Alt-Tab endlos weiter).
8. Touch-Joystick: 40 px Radius / 8 px Deadzone in BILDSCHIRM-Pixeln, Umrechnung
   über realen Skalierungsfaktor `rect.width/320`.

## Verifikations-Bilanz (Multi-Agent-Lauf, 10 Agenten)

- Spec-Review vor dem Build: 12 Issues → als Klärungen in die Builder-Prompts
- Nach dem Build: 4 relevante Findings (Fokus-Verlust, Tile-Rundung,
  Halbherz-Anzeige, Joystick-Maße) → alle gefixt, Tests danach erneut grün

## Offen für Slice 1 (Diablo-Atmosphäre)

- Katakomben-/Dungeon-Ebene mit Licht/Fackelschein, zerschlagbare Vasen, Tränke
- Map wirkt noch etwas leer → mehr Deko-Tiles, Variation, evtl. Nebel
- Sound fehlt komplett (geplant Slice 5, WebAudio-Chiptune)
- Playwright-Umgebung liegt in einem Session-venv unter /tmp — für dauerhafte
  Screenshot-Tools ggf. venv ins Projekt legen (`.tmp/` oder `tools/`-Doku)

## Referenzen

- Vision/Design: `design/GDD.md`, Stil: `design/ART_DIRECTION.md`
- Bindende Technik-Spezifikation: `design/SPEC_SLICE_0.md`
- Ablauf-SOP: `workflows/SLICE_0_spielbarer_kern.md`
