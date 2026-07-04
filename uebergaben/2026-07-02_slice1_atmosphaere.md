# Übergabe 2026-07-02 — Slice 1 "Diablo-Atmosphäre + Grafik-Pass" FERTIG

## Status

Slice 1 komplett gebaut, verifiziert, abgenommen:
- `bash tools/check_syntax.sh` → grün (15 JS-Dateien)
- `node tools/smoke_test.mjs` → grün (81+ Checks, ~2472 Ticks, 10 Läufe stabil)
- Headless-Flusstests durch die ECHTE main.js: Titel → Friedhof → Portal-Fade →
  Katakomben → Rückweg → Tod → Game Over → Neustart (24 Assertions) sowie
  Sieg-Pfad bis Truhe/Banner/Reset (13 Assertions)
- Playwright-Proof: 6 Screenshots (`.tmp/screenshots/s1_*.png`), null Konsolen-Fehler
- 1 Verify-Finding gefixt: `?map=`-Parameter nutzte truthy-Lookup `MAPS[q]` —
  `?map=constructor` hätte buildWorld gecrasht → `Object.hasOwn`-Prüfung

## Was neu spielbar ist

- **Katakomben** unter dem Friedhof (Krypta-Treppe im Nordosten, Fade-Übergang,
  Treppe zurück), ambient 0.82 dunkel, nur Fackelschein + Spieler-Laterne
- **Licht-System**: posterisierte Lichtkreise (3 Stufen), deterministisches
  Flackern, Viewport-Culling
- **Vasen/Urnen** zerschlagbar (Schwert oder Berührung) → Gold/Trank-Drops
- **Tränke**: max. 3, HUD-Zähler, K/E oder Touch-Button B, heilt 1 Herz;
  Überlauf-Pickup → +2 Gold
- **Ghul**: hp 4, Kontaktschaden 2, 50% Knockback-Resistenz, bewacht die Truhe
- **Schatztruhe** = neues Sieg-Ziel (Münzregen, Banner nach 1,2 s)
- **Grafik-Pass**: 4-Frame-Laufzyklen, Sterbe-Frames, Friedhof-Deko (Grabstein-
  Varianten, Zäune, Schädel, Knochen), komplettes Katakomben-Tileset, Nebel auf
  dem Friedhof, Titel-Untertitel jetzt "Ein Friedhof. Eine Krypta. Ein Schatz."

## Bindende Festlegungen aus dem Build (zusätzlich zu Slice 0)

1. `updateProps(dt, props, player, map, drops, events)` — map-Parameter kam dazu
   (Drops tragen map-Referenz).
2. `drawFog(ctx, camera, gfx, timeSec)` — Blobs wrappen über den Viewport
   (halbe Parallaxe), nicht über die Map.
3. `input.potion` ist PEGEL; die Flankenerkennung sitzt in player.js.
4. Sieg/Tod-Race: `player_died` gewinnt immer, Prüfreihenfolge Tod → Portal →
   Truhe; `victoryTimer` lebt in main.js, pausiert während Fade.
5. Map-Wechsel erzeugt ein NEUES Player-Objekt (hp/gold/potions übernommen,
   Timer/attackId frisch); während des Fades keine Welt-Updates.
6. Gegnerwerte sind Felder am Gegner (wanderSpeed/chaseSpeed/sight/contactDamage/
   knockFactor) — neue Gegnertypen brauchen nur createX-Fabrik.
7. Neustart → GRAVEYARD (mit `?map=`-Dev-Parameter bewusst auf dessen Map).
8. Gegner/Props einer Map resetten beim erneuten Betreten (Slice-1-Kompromiss).
9. Lighting: Offscreen lazy aus `ctx.canvas.ownerDocument`; Kreiszentren werden
   wie alles andere gerundet (`Math.round(x - cam.x)`).

## Bekannte Restrisiken / offene Punkte

- Sieg/Tod-Race im 1,2-s-Fenster implementiert, aber ohne automatisierten
  Timing-Test (headless schwer deterministisch).
- Truhe öffnen + sofort Portal: Banner erscheint nach dem Wechsel auf dem
  Friedhof (bewusst, dokumentiert).
- Playwright: venv ist vergänglich (Session-Scratchpad), Chromium-Builds liegen
  persistent in `~/.cache/ms-playwright` → neues venv + `pip install playwright`
  genügt; Proof-Skript-Vorlage: `.tmp/screenshot_proof_slice1.py`.
- `.tmp/check_*-Flusstests` fahren deterministische Routen (Math.random-Stub) —
  brechen bei Map-Layout-Änderungen, sind Wegwerf-Vorlagen.
- Props sind nicht solide (Spieler läuft durch Vasen) — Slice-1-Kompromiss.

## Nächste Slices

- Slice 2: Loot mit Affixen, Inventar, Zelda-Zweitwaffe
- Slice 3: XP/Level, Boss, mehr Räume
- Slice 4: Capacitor/Android+iOS (npm via corepack beschaffen)
- Slice 5: WebAudio-Chiptune, Polish

## Testen

Server: `python3 tools/serve.py` (läuft i.d.R. schon auf 8123).
Browser: `http://localhost:8123` — Katakomben direkt: `http://localhost:8123/?map=CATACOMBS`
