# Übergabe 2026-07-06 — Slice 3 "Progression" FERTIG

## Status

Komplett gebaut, verifiziert, abgenommen — erster Lauf vollständig nach der neuen
Regel "Fable plant, Opus baut" (alle 8 Workflow-Agenten auf Opus, 0 Ausfälle):
- `check_syntax.sh` grün (23 Dateien)
- `smoke_test.mjs` 5× grün (inkl. neue Abschnitte 30-34; 7640 Ticks/Lauf)
- Flusstests grün: `check_main_slice1.mjs` (25), `check_inventory_slice2.mjs` (25),
  `check_boss_slice3.mjs` (NEU, 33 — ersetzt spec-konform check_victory_slice1)
- Verify-Panel (Testlauf + Bug-Review + Spec-Compliance inkl. Touch-Fairness §2.3):
  **0 kritische/mittlere Findings** — Fixer hatte nichts zu tun
- Screenshot-Proof s3_01–s3_08 über 3 Durchläufe: keine Konsolen-Fehler

## Was neu spielbar ist

- **XP & Level:** Schwellen [0,20,50,90,140], Cap 5; Level-Up = +2 maxHp +
  Vollheilung, goldener Ring + "STUFE N!"-Toast; XP-Balken im HUD, STUFE in der
  Gesamtwerte-Zeile (hinter TEMPO)
- **Flüstergruft** (40×24, ambient 0.85): begehbares Wasser, 15 Gegner (64 XP
  gesamt), Eliten mit Glut-Augen (elite_glow + frameLights, nur Faktoren),
  Schlüssel-Truhe und Herzcontainer-Truhe
- **Bosskammer** (20×12): **Grabwächter** (HP 26, Intro-Toast, segmentierter
  HP-Balken): idle bis Aggro (64 px oder Treffer), Muster A Rundumschlag /
  B Sturmschlag mit roten Bodenmarkern (Telegraphie), Phasenwechsel bei 17/9 HP
  mit Skelett-Adds (max. Deckel), Bumerang bricht Casts ab und verlängert stuck
- **Tod = Respawn** statt Run-Neustart: Gold halbiert, zurück zum Eintritts-Spawn
  der Map, Boss resettet nur wenn nicht besiegt; Fluchtklausel: bossLocked
  blockt nur solange der Boss nicht idle ist
- **Sieg wandert hinter den Boss**: Siegtruhe erscheint in der Bosskammer;
  die alte Katakomben-Truhe gibt jetzt Gold

## Bindende Festlegungen aus dem Build

1. `progression.js` wurde von Builder B spec-exakt vorab angelegt (Import-Bedarf),
   Builder A hat sie unverändert übernommen — Inhalt = Spec §3, byte-genau.
2. `check_victory_slice1.mjs` existiert nicht mehr (erlaubte Alt-Test-Änderung #2);
   Nachfolger ist `check_boss_slice3.mjs`. Die weiteren erlaubten Änderungen:
   Smoke-Assertion CATACOMBS-Truhe (#1), Game-Over-Abschnitt in check_main (#3).
3. main.js: carry überträgt `player.prog` als Referenz; BOSS_KAMMER filtert den
   Grabwächter beim Erzeugen wenn bossDead und legt die Siegtruhe statisch bei
   tc(10,4); Bodenmarker rendern NACH Ground / VOR Entities; Grabwächter-Flips
   hängen ausschließlich am Ende der Flip-Liste.
4. Toast-Prioritäten: level_up > key/heart/weapon > item_pickup > Rest.
5. Eliten-Werte im Smoke-Test verankert: hp 8 / xp 8; elite-Flags nur FLUESTERGRUFT.

## Betriebsnotizen

- Verwaister 8124-Server aus einer früheren Session (PID 2204019) wurde nach dem
  Lauf beendet; künftige Proof-Agenten sollen bei "Address already in use" prüfen,
  ob ein funktionierender game/-Server läuft, statt blind zu scheitern (hat hier
  der Proof-Agent korrekt so gemacht).
- Screenshot-Inszenierung: `.tmp/shot_slice3.py` (Nachfolger von shot_slice2.py,
  gleiche Technik: Zeitlupe, Route-Interception, Kamera-Rig).

## Nächste Slices

- Slice 4: Capacitor-Wrap Android/iOS, Save-System, Performance (npm via corepack)
- Slice 5: WebAudio-Chiptune, Polish
- Grafik-Kandidat aus 1.5 offen: 2×2-Großkronen, Tile-Varianten, Wasser in die
  Screenshot-Route (Juror-Decke bei Note 6,5)

## Testen

Server läuft in Michaels Terminal (Port 8123): Friedhof → Katakomben → Flüstergruft
(Schlüssel holen!) → Bosskammer. Dev-Abkürzungen: `?map=FLUESTERGRUFT`,
`?map=BOSS_KAMMER`.
