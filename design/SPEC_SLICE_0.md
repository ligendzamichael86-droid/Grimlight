# Technische Spezifikation — Slice 0 "Spielbarer Kern"

Ziel: Ein im Browser spielbarer Kern. Held läuft über eine düstere Friedhofs-Map,
kämpft mit dem Schwert gegen Skelette, hat Herzen, sammelt Gold. Steuerung per
Tastatur UND Touch. Titelbildschirm, Game Over, Sieg-Banner.

Diese Spezifikation ist bindend. Abweichungen nur, wenn technisch nötig — dann in
der Übergabe dokumentieren.

## 1. Rahmen

- Interne Auflösung: **320×180** px, Canvas wird ganzzahlig auf Fenstergröße
  skaliert (Letterbox, schwarzer Rand), `image-rendering: pixelated`.
- Tilegröße: **16 px**. Map Slice 0: **40×24 Tiles** (640×384 px Welt), Kamera
  folgt dem Spieler, an Weltränder geklemmt.
- Fixed Timestep: Update 60 Hz über Akkumulator (max. 5 Updates/Frame gegen
  Spiral-of-Death), Render per requestAnimationFrame. `dt` ist konstant 1/60 s.
- Alle Positionen sind Floats in Weltpixeln. AABB = `{x, y, w, h}`, x/y = oben links.
- `game/package.json` mit `{"type": "module"}` (nur damit Node die ES-Module versteht).

## 2. Node-Importierbarkeit (Pflicht)

Jedes Modul außer `js/main.js` darf auf Modulebene **kein** `window`, `document`,
`navigator` oder Canvas anfassen. Browser-Objekte werden erst in Funktionen benutzt
oder per Parameter injiziert. Grund: `tools/smoke_test.mjs` importiert World- und
Entity-Module in purem Node und simuliert Gameplay headless.

## 3. Modul-Interfaces (bindend)

### js/art/palette.js  (Besitz: Art)
```js
export const PALETTE = { /* key: '#rrggbb' */ };
```
Düstere Diablo-Palette, ca. 16–24 Farben, Schlüssel = 1 Zeichen (für Pixel-Grids).

### js/art/sprites.js  (Besitz: Art)
```js
// Jedes Sprite: Array von Strings, jedes Zeichen = PALETTE-Key, '.' = transparent.
export const SPRITES = {
  player_down_0, player_down_1, player_up_0, player_up_1,
  player_side_0, player_side_1,          // side = nach rechts, links wird gespiegelt
  player_attack_down, player_attack_up, player_attack_side,
  skeleton_0, skeleton_1, skeleton_die,
  sword_slash_down, sword_slash_up, sword_slash_side,
  coin_0, coin_1,
  heart_full, heart_empty,               // 8×8 für HUD
};
export const TILE_ART = {
  grass_dark, grass_detail, path, tree, gravestone, wall, water,
  torch_0, torch_1,                       // 2 Frames Flacker-Animation
};
```
Figuren 16×16 (Spieler darf 16 hoch, 12 breit Hitbox haben), HUD-Herzen 8×8.

### js/core/sprite_factory.js  (Besitz: Builder A)
```js
export function buildSprite(grid, palette, {flipX = false} = {}) // → Canvas (nur im Browser aufrufen)
export function buildAll(sprites, palette)                        // → { name: Canvas }
```

### js/core/loop.js  (Besitz: Builder A)
```js
export function createLoop({update, render, raf, now}) // raf/now optional, default: browser
// → { start(), stop() } — update(dt) mit dt=1/60, Akkumulator-Logik hier drin
```

### js/core/input.js  (Besitz: Builder A)
```js
export function createInput() // → input
// input.attach(canvasElement)  — Listener anmelden (Browser); ohne attach nutzbar (Tests)
// input.dirX, input.dirY      — -1..1 (normalisiert, Tastatur ODER Touch-Joystick)
// input.attack                — true solange Angriff gedrückt (J, Leertaste, Touch-Button)
// input.confirm               — Enter/Leertaste/Tap (für Title/Game-Over)
// input.touch                 — {active, joyBaseX, joyBaseY, joyX, joyY, buttons:[{x,y,r,label,pressed}]} für HUD-Overlay
// input.postUpdate()          — Frame-Ende (edge detection für confirm)
```
Tastatur: WASD + Pfeile, Angriff J/Leertaste. Touch: linke Bildschirmhälfte =
dynamischer Joystick (Deadzone 8 px, Radius 40 px Bildschirm), rechte Hälfte =
Angriffs-Button. Koordinaten intern auf 320×180 umgerechnet.

### js/core/camera.js  (Besitz: Builder A)
```js
export function createCamera(viewW, viewH) // → {x, y, follow(cx, cy, worldW, worldH)}
```
Zentriert auf Punkt, klemmt an Weltränder, rundet beim Rendern auf ganze Pixel.

### js/world/tilemap.js  (Besitz: Builder A)
```js
export function createTilemap(rows, legend)
// rows: Array von Strings (ein Zeichen = ein Tile)
// legend: { char: {art: 'tile_art_key', solid: bool, anim?: ['a','b'] } }
// → { wTiles, hTiles, wPx, hPx, isSolidAt(px, py), rectCollides(aabb),
//     draw(ctx, camera, tileCanvases, timeSec) }
```

### js/world/maps.js  (Besitz: Builder A)
```js
export const GRAVEYARD = { rows, legend, playerSpawn: {x,y}, skeletonSpawns: [{x,y}…] };
```
40×24, Friedhofsstimmung: dunkles Gras, Wege, Bäume/Mauern als Rand, Grabsteine,
kleiner Teich, 2–3 Fackeln. Begehbarer Raum großzügig, 6 Skelett-Spawns verteilt,
Spawn-Punkte nie in soliden Tiles.

### js/entities/entity.js  (Besitz: Builder B)
```js
export function aabbOverlap(a, b)
export function moveWithCollision(ent, map, dx, dy) // Achsen getrennt, gleitet an Wänden
```

### js/entities/player.js  (Besitz: Builder B)
```js
export function createPlayer(spawn) // → player
// Felder: x,y,w:12,h:14, hp, maxHp:6 (=3 Herzen à 2), gold, facing('up'|'down'|'left'|'right'),
//         state('idle'|'walk'|'attack'|'hurt'|'dead'), invulnTimer, animTimer
// player.update(dt, input, map, enemies, events)
// player.getSwordHitbox() → AABB|null (nur während aktiver Angriffsphase)
// player.hurt(dmg, fromX, fromY) — Knockback + 1 s Unverwundbarkeit (blinkt)
// player.draw(ctx, cam, gfx, timeSec)
```
Werte: Tempo 90 px/s; Angriff: 0,12 s Ausholen, 0,15 s aktiv, 0,35 s Gesamt-Cooldown;
Schwert-Hitbox 16×16, 12 px vor dem Spieler in Blickrichtung; Schaden 1.
`events` ist ein Array, in das Entities Strings pushen (z.B. 'player_died',
'enemy_died', 'gold_pickup') — main.js wertet es aus.

### js/entities/enemies.js  (Besitz: Builder B)
```js
export function createSkeleton(spawn) // → enemy {x,y,w:12,h:14,hp:2,state,…}
export function updateEnemies(dt, enemies, player, map, drops, events)
export function updateDrops(dt, drops, player, events)   // Münzen einsammeln (Radius 12)
export function drawEnemies(ctx, cam, enemies, gfx, timeSec)
export function drawDrops(ctx, cam, drops, gfx, timeSec)
```
Skelett-KI: `wander` (zufällige Richtung 1–2 s, Tempo 25) → `chase` wenn Spieler
< 96 px Sicht (Tempo 55) → Kontaktschaden 1 (Kollision mit Spieler-AABB),
danach 0,5 s eigener Angriffs-Cooldown. Bei Tod: 0,4 s Sterbe-Animation, dann
1–3 Münzen als Drops mit kleinem Streu-Impuls. Getroffene Skelette: Knockback,
0,2 s `hurt`-Blitzen.

### js/ui/hud.js  (Besitz: Builder B)
```js
export function drawHUD(ctx, player, input, gfx)      // Herzen oben links (voll/leer), Gold-Zähler
export function drawVignette(ctx)                      // gecachte Radial-Vignette (Diablo-Stimmung)
export function drawTitle(ctx, timeSec)                // Titelbild: GRIMLIGHT + Blink-Prompt
export function drawGameOver(ctx, player, timeSec)
export function drawVictory(ctx, player, timeSec)
```
Alle Texte pixelig (ctx.font '8px monospace' o.ä., ganzzahlige Positionen).
Touch aktiv → Joystick + Angriffs-Button halbtransparent zeichnen.

### js/main.js  (Besitz: Builder B — einziges Browser-gebundenes Modul)
Boot: Canvas + Skalierung einrichten, Sprites bauen, States `title` → `playing`
→ `gameover`/`victory` → (confirm) → Neustart (Welt komplett neu aufbauen).
Sieg, wenn alle Skelette tot und alle Drops eingesammelt.

### game/index.html + game/css/style.css  (Besitz: Builder A)
Schwarzer Hintergrund, zentriertes Canvas, kein Scrollen/Zoomen auf Touch
(`touch-action: none`), Viewport-Meta für Mobile, lädt `js/main.js` als Modul.

## 4. Tools (Besitz: Builder A, Smoke-Test: Builder B)

- `tools/serve.py` — Python-HTTP-Server auf Port 8123, serviert `game/`,
  korrekte MIME-Types für .js, kein Cache.
- `tools/check_syntax.sh` — `node --check` über alle JS-Dateien in `game/js/`.
- `tools/smoke_test.mjs` — importiert world/entities/art in Node, baut Map und
  Entities, simuliert ≥ 600 Ticks mit synthetischem Input und assertet mindestens:
  Spieler bewegt sich; Wand stoppt Spieler; Schwert tötet Skelett (2 Treffer);
  Skelett verfolgt und verletzt Spieler; Unverwundbarkeit verhindert Doppelschaden;
  Münz-Drop wird eingesammelt (Gold steigt); alle Sprites referenzieren nur
  existierende Palettenfarben; Map-Legende deckt alle Zeichen der Map ab;
  Spawns liegen nicht in soliden Tiles. Exit-Code 0 = grün, sonst Fehlerliste.

## 5. Abnahmekriterien Slice 0

1. `bash tools/check_syntax.sh` grün.
2. `node tools/smoke_test.mjs` grün.
3. Browser: Titel → Spiel; WASD-Bewegung, Kollision, Schwert, Skelette sterben,
   Herzen sinken bei Kontakt, Game Over + Neustart, Sieg-Banner; Touch-Steuerung
   am Handy/Emulation nutzbar.
4. Atmosphäre: dunkle Palette, Vignette, flackernde Fackeln erkennbar.
