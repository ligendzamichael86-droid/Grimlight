# Übergabe: Slice 2 "Loot & Inventar" (04.07.2026)

## Status

SLICE 2 KOMPLETT ABGESCHLOSSEN. Spiel und Tests fertig und verifiziert,
alle 7 Abnahme-Screenshots liegen gesichtet in `.tmp/screenshots/`
(Details im Nachtrag am Ende).

## Was Slice 2 liefert

1. **Knochen-Bumerang** (Zelda-Zweitwaffe): Truhe in der Westkammer der
   Katakomben, Taste L bzw. Touch-Button W. 0 Schaden, nur Stun; holt
   Coin/Trank-Drops magnetisch heran, zerschlägt Vasen auf Distanz.
2. **Loot-System**: Gegner droppen Waffe/Rüstung/Ring mit 1 (Normal) oder
   2 (Selten) Fest-Affixen aus einem 8er-Pool. Drop-Chancen: Skelett 4%,
   Ghul 8%, Hund 10%, Rostpanzer 35%; Pity-Drop nach 12 Kills ohne Fund.
   Seltene Drops leuchten (Licht Radius 18) und glitzern.
3. **Inventar**: I/Tab oder Tap auf die HUD-Item-Box; Vollpause, 7 Plätze,
   3 Ausrüstungs-Slots, ANLEGEN per Button, Wirkung sofort (player.stats).
4. **Neue Gegner**: Grufthund (Orbit, Telegraph, Sprung; Bumerang wirft ihn
   um) und Rostpanzer-Skelett (blockt frontal, seitlich verwundbar, bester
   Loot-Lieferant). Spawns: 2 Hunde Friedhof; 2 Hunde + 3 Rostpanzer
   Katakomben.
5. **HUD**: Item-Box oben rechts (Neu-Punkt bei frischem Fund), Pickup-Toast,
   dritter Touch-Button W (dokumentierte GDD-Paragraph-7-Abweichung).

## Wie testen

1. Server: `python3 tools/serve.py` (Port 8123, gehört dem Auftraggeber)
   oder der Agenten-Server auf 8124. Im Browser via Port-Weiterleitung.
2. Headless: `bash tools/check_syntax.sh`, `node tools/smoke_test.mjs`
   (29 Abschnitte, komplett grün, 4080 Ticks), Flusstests in `.tmp/`:
   `check_main_slice1.mjs` (24), `check_victory_slice1.mjs` (13),
   `check_inventory_slice2.mjs` (25 Assertions).

## Build-Verlauf (Multi-Agent)

1. Phase 1 parallel mit exklusivem Datei-Besitz: Builder A (items.js NEU,
   input.js, maps.js), Builder B (entities komplett, projectiles.js NEU),
   Art (24 neue Sprites, 3 neue Rost-Palettenfarben, Alt-Sprites per
   SHA-256-Hash byte-identisch belegt). Alle Dev-Checks in `.tmp/dev_*.mjs`.
2. Phase 2 sequenziell: Integrator (inventory_ui.js NEU, hud.js, main.js,
   Smoke-Abschnitte 22 bis 29, neuer Flusstest), danach unabhängiger
   Verify-Agent: grün in Runde 1, alle 12 Testläufe, kein Blocker.

## Bindende Entscheidungen und dokumentierte Abweichungen

1. **check_victory_slice1.mjs leert MAPS.CATACOMBS.enemySpawns vor dem
   Import** (Kommentarblock im Test). Grund: echter Spec-Konflikt, die
   neuen Pflicht-Spawns kippen das HP-Budget des alten Testszenarios
   (per Trace belegt). Szenario und alle 13 Assertions unverändert.
2. Pity-Lesart: ab pity 12 ersetzt der garantierte Normal-Drop den
   regulären Wurf komplett (nie selten, Slot uniform).
3. enemies.js exportiert zusätzlich `isBlocked` (projectiles.js nutzt
   dieselbe Frontkegel-Prüfung).
4. Bumerang legt den Grufthund auch im Zustand wander um (konsistente
   Erweiterung); erneuter Treffer refresht den downTimer.
5. Bumerang-Rückflug beschleunigt mit 280 px/s Quadrat von 150 auf 220.
6. Nachwurfsperre (0,2 s) lebt als Modulzustand in createProjectiles;
   das Spec-Feld lockTimer am Projektil trägt die Dauer.
7. Rostpanzer-Münzen 2 bis 4 über die Gegner-Felder coinMin/coinMax.
8. Schild-Overlay-Maße (Spec offen): side 6x12, up/down 12x6.
9. Nachträgliche Fixes nach dem unabhängigen Verify (beide getestet):
   attackSwallow in main.js (Schließen-Tap aufs Inventar-X löste einen
   Schwerthieb aus; Pegel wird jetzt bis zum Loslassen geschluckt) und
   zwei Gedankenstriche in neuen Kommentaren bereinigt.

## Screenshot-Proof

Werkzeug: `.tmp/shot_slice2.py` (Playwright aus `.tmp/venv`, Port 8124,
nie 8123). Inszenierung ohne Spieldatei-Änderung: performance.now-Wrapper
für Zeitlupe/Frame-Freeze, Math.random-Würfelschlange NUR im
spawnDeathDrops-Stack (erzwingt Drops ohne das Wandern zu verbiegen),
Telemetrie-Wrapper per Route-Interception. Szene A (Friedhof: s2_01 Orbit,
s2_02 Hund down + Schwert) und Szene B (Katakomben: s2_03 Block, s2_04
Bumerang-Flug, s2_05 Inventar 2+ Items, s2_06 Selten-Drop leuchtet,
s2_07 HUD-Box + W-Button). Ablage `.tmp/screenshots/s2_*.png`.

## Offen für die nächsten Slices

1. Baumkronen bleiben der schwächste Grafikpunkt (Jury-Befund aus 1.5).
2. Slice 3 (Progression): Balance-Leitplanke aus der Spec beachten,
   Boss-HP 24 bis 28, auf den Median-Build balanciert.
3. Empfehlung Betrieb: `git init` im Projekt als Rollback-Netz gegen
   halbfertige Edits bei Session-Abbrüchen (bisher kein Git).

## Nachtrag Screenshot-Proof

Alle 7 Motive bewiesen und einzeln gesichtet, Browser-Konsole fehlerfrei:
s2_01 Hund-Orbit, s2_02 Hund am Boden + Schwertschwung, s2_03 Rostpanzer-
Block mit Funken, s2_04 Bumerang im Flug (+ Item-Box mit Neu-Punkt),
s2_05 Inventar mit Seelenring und Grabwachtpanzer inkl. Affix-Text und
Vorschau-Zeile, s2_06 Seelenring mit Sparkle und Lichtschein am Boden,
s2_07 volles Touch-Overlay mit W/A/B und Item-Box.

Die Katakomben-Szene brauchte drei Skript-Iterationen; die Erkenntnisse
stehen als Kamera-Rig-Tricks im Skript-Kopf und gelten fuer kuenftige
Slices: (1) HP-Dauerauffuellung gegen Staging-Tode, (2) verfolgende
Gegner an einen fernen begehbaren Spawn parken (park_foes), (3) fuer
Wurf-Motive den Spieler an die gegnerfernste Ecke teleportieren (ein
getroffener Spieler darf nicht werfen), (4) fehlende Inventar-Requisiten
notfalls direkt ins JSON-Inventar legen (UI-Beweis; die Drop-Pipeline ist
headless durch check_inventory_slice2.mjs belegt; in den finalen Bildern
stammt der Seelenring aus einem echten Drop, der Grabwachtpanzer ist
Requisite), (5) gelungene Motive per SHOT_DONE/CLI-Skip nie wiederholen.
