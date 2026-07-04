# Technische Spezifikation — Slice 1 "Diablo-Atmosphäre + Grafik-Pass"

Baut auf Slice 0 auf. Bindend sind weiterhin `SPEC_SLICE_0.md` (Interfaces bleiben
gültig) und die Festlegungen in `uebergaben/2026-07-01_slice0_spielbarer_kern.md`
(Spawn-Anker, attackId-Treffer, Knockback via moveWithCollision, Rendering-Rundung,
Fokus-Reset, Joystick-Maße). Abweichungen nur wenn technisch nötig, dann dokumentieren.

## 1. Umfang

1. **Zweite Map: Katakomben** unter dem Friedhof, erreichbar über eine Krypta-Treppe;
   Rückweg über Treppe nach oben. Map-Wechsel mit Fade-Übergang.
2. **Licht-System:** Dunkelheits-Overlay mit ausgestanzten Lichtkreisen (Fackeln +
   Spieler-Laterne), posterisiert in Stufen für den Retro-Look.
3. **Zerschlagbare Props:** Vasen/Urnen mit Drops (Gold/Trank), Schatztruhe als
   Slice-Ziel.
4. **Tränke:** sammelbar (max. 3), per Taste/Touch-Button trinken, heilt 1 Herz.
5. **Neuer Gegner: Ghul** (langsamer Brocken für die Katakomben).
6. **Grafik-Pass:** 4-Frame-Laufzyklen für den Helden, Sterbe-Frames, neue
   Deko-Tiles gegen die Leere des Friedhofs, komplettes Katakomben-Tileset,
   Nebelschwaden auf dem Friedhof.
7. **Sieg-Bedingung neu:** Schatztruhe in den Katakomben geöffnet (nicht mehr
   "alle Gegner tot").

## 2. Neue/geänderte Interfaces (bindend)

### js/core/lighting.js — NEU (Besitz: Builder A)
```js
export function createLighting(viewW, viewH)
// → { draw(ctx, camera, lights, ambient, timeSec) }
// lights: [{x, y, radius, flicker}] in WELTpixeln; flicker 0..1 (0 = statisch)
// ambient: 0..1 Dunkelheitsgrad der Map (0 = Tag, 1 = schwarz)
```
Implementierung: internes Offscreen-Canvas 320×180. Pro Frame: mit dunkler Farbe
(fast schwarz, leicht blau, z.B. #050510) und Alpha=ambient füllen, dann pro Licht
per `destination-out` **3 konzentrische Kreise** stanzen (posterisierte Stufen statt
weichem Gradient: volle Stanzung bis 0,45×r, mittlere bis 0,75×r, schwache bis 1×r).
Flackern deterministisch über `sin(timeSec*13 + tx*7)`-Kombinationen (KEIN
Math.random im Renderpfad), Radius-Jitter max. ±10%. Modul ohne Browser-Bezug auf
Modulebene (Canvas erst in draw/lazy erzeugen bzw. injizierbar).

### js/core/input.js — ERWEITERT (Besitz: Builder A)
```js
// NEU: input.potion — true bei K oder E (Tastatur) bzw. Touch-Button 'B'
// touch.buttons: Button A (Angriff, wie gehabt) + Button B {x:252, y:156, r:12, label:'B'}
```
Bestehende Felder und Verhalten unverändert (inkl. Fokus-Reset).

### js/world/tilemap.js — ERWEITERT (Besitz: Builder A)
```js
// NEU: findTiles(char) → [{tx, ty, x, y}]  (x/y = Tile-ZENTRUM in Weltpixeln)
```

### js/world/maps.js — ERWEITERT (Besitz: Builder A)
```js
export const GRAVEYARD = { rows, legend, playerSpawn, skeletonSpawns, ghoulSpawns: [],
  propSpawns: [{x, y, kind}], portals: [{x, y, w, h, target, spawn: {x,y}}],
  ambient: 0.45, playerLightRadius: 40, fog: true }
export const CATACOMBS = { /* gleiche Struktur */ ambient: 0.82, playerLightRadius: 52, fog: false }
export const MAPS = { GRAVEYARD, CATACOMBS }
```
- Portale sind Welt-AABBs; `target` ist ein Schlüssel in MAPS; `spawn` = Zentrum
  der Spieler-AABB in der Zielmap (begehbar, nicht direkt wieder im Ziel-Portal!).
- GRAVEYARD überarbeiten: Krypta-Eingang (Treppe abwärts, umbaut mit Mauer) im
  Nordosten; deutlich mehr Deko (Grabstein-Varianten, tote Büsche, Knochen,
  Schädel, Zäune); 6 Skelette wie gehabt; 4-6 Vasen/Urnen.
- CATACOMBS: 40×24, Gänge + 3-4 Kammern, Rand komplett solide; Fackeln an Wänden
  entlang der Wege (sie sind die Hauptlichtquelle); Treppe aufwärts am Eingang
  (Portal zurück, spawn neben der Krypta); 8 Skelette + 4 Ghule; 10-14 Vasen/Urnen;
  **1 Schatztruhe** in der hintersten Kammer, von Ghulen bewacht.
- Fackel-Lichter werden NICHT in maps.js gepflegt, sondern in main.js via
  `tilemap.findTiles(fackelZeichen)` extrahiert; maps.js exportiert dafür je Map
  `torchChars: ['…']` (alle Zeichen, die Fackel-Tiles sind).

### js/entities/props.js — NEU (Besitz: Builder B)
```js
export function createProps(propSpawns)  // kind: 'vase' | 'urn' | 'chest'
export function updateProps(dt, props, player, drops, events)
export function drawProps(ctx, cam, props, gfx, timeSec)
```
- Vase/Urne: AABB 12×12, zerbricht bei Schwert-Treffer (attackId-Einmaltreffer wie
  bei Gegnern) ODER Spieler-Berührung; 0,25 s Scherben-Animation; Drop: 60% 1-2
  Münzen, 25% 1 Trank, 15% nichts. Props sind nicht solide (bewusster Kompromiss).
- Truhe: AABB 16×14, öffnet NUR bei Schwert-Treffer; danach `chest_open`-Sprite,
  8-12 Münzen mit Streu-Impuls, Event `'chest_opened'` (genau einmal!).

### js/entities/enemies.js — ERWEITERT (Besitz: Builder B)
```js
export function createGhoul(spawn) // {…, w:14, h:14, hp:4, kind:'ghoul'}
```
- Ghul: Tempo 30 (chase) / 18 (wander), Sichtweite 80, Kontaktschaden **2**,
  Knockback wirkt nur 50%, sonst gleiche State-Maschine wie Skelett.
- Drops-Erweiterung: Drop-Objekte bekommen `kind: 'coin' | 'potion'`;
  `updateDrops` sammelt beide ein (Radius 12) und pusht `'gold_pickup'` bzw.
  `'potion_pickup'`-Events. Ghul-Drop: 1-3 Münzen, 20% zusätzlich 1 Trank.

### js/entities/player.js — ERWEITERT (Besitz: Builder B)
```js
// NEU: player.potions (Start 0, max 3), player.heal(n),
// Trinken: input.potion (Flankenerkennung) && potions>0 && hp<maxHp
//   → potions-1, heal(2), 0,3 s Cooldown, Event 'potion_drunk'
// Trank-Pickup bei vollen Taschen: liegen lassen? NEIN → +2 Gold, Event 'potion_full_gold'
```

### js/ui/hud.js — ERWEITERT (Besitz: Builder B)
- Trank-Anzeige: Flaschen-Icon + `x N` unter den Herzen.
- Touch aktiv: Button B (Trank) zusätzlich zeichnen, gedrückt-Zustand sichtbar.
- Fog: `drawFog(ctx, camera, timeSec)` — 8 driftende Nebel-Ellipsen (Sprite
  `fog_blob`, globalAlpha ≈ 0,10, Tempo 4-8 px/s, deterministisch aus timeSec
  abgeleitet, wrappt über die Map). Wird nur bei `map.fog === true` gezeichnet.

### js/main.js — ERWEITERT (Besitz: Builder B)
- Welt-Zustand pro Map neu aufbauen (`buildWorld(mapKey)`); Spieler-Werte (hp,
  gold, potions) überleben den Map-Wechsel; Gegner-/Prop-Zustand einer Map darf
  beim erneuten Betreten zurückgesetzt werden (Slice-1-Kompromiss, dokumentieren).
- Portal-Übergang: Spieler-AABB schneidet Portal → 0,3 s Fade zu Schwarz →
  Map-Wechsel → 0,3 s Fade auf. Während des Fades keine Updates. Nach Spawn:
  Spieler steht NICHT im Portal (sonst Ping-Pong; Spawns entsprechend setzen,
  zusätzlich Portal erst scharf, wenn Spieler es einmal verlassen hat).
- Licht: `lights` = Fackeln (findTiles über torchChars, radius 56, flicker 1) +
  Spieler-Laterne (radius = map.playerLightRadius, flicker 0,3, folgt Spieler).
- Render-Reihenfolge: Welt → Drops/Props/Gegner/Spieler → Fog → Lighting →
  Vignette → HUD (HUD wird NICHT abgedunkelt).
- Sieg: Event `'chest_opened'` → nach 1,2 s Victory-State.
- Dev-Parameter: `?map=CATACOMBS` startet nach dem Titel direkt in der Map
  (nur echtes location.search-Parsing in main.js, kein Einfluss auf andere Module).

### js/art/palette.js + sprites.js — ERWEITERT (Besitz: Art)
- **Alle bestehenden Schlüssel bleiben erhalten und kompatibel** (Grids dürfen
  verbessert werden, Namen nicht brechen). Neue Palettenfarben erlaubt (Stein-Grau-
  Rampe, Moos, Trank-Rot, Holz), weiterhin 1 Zeichen pro Farbe, kein '.'.
- Neue SPRITES: `player_down_2/3, player_up_2/3, player_side_2/3` (4-Frame-Zyklus,
  _0.._3, bestehende _0/_1 bleiben Frame 0/1), `player_die_0/1`,
  `ghoul_0, ghoul_1, ghoul_die`, `vase, urn, prop_break_0, prop_break_1`,
  `chest_closed, chest_open`, `potion` (10×10), `fog_blob` (32×16, ein Grauton).
- Neue TILE_ART (16×16): `gravestone_2, gravestone_3, bush_dead, bones, skull,
  fence, crypt_stairs_down, stairs_up, stone_floor, stone_floor_cracked,
  brick_wall, pillar, rubble, sarcophagus, torch_wall_0, torch_wall_1`.
- Selbstcheck per Node-Skript wie in Slice 0 (Zeilenlängen, Palettendeckung,
  alle ALTEN Schlüssel noch vorhanden).

## 3. Tools / Tests (Besitz: Builder B, außer serve/syntax unverändert)

`tools/smoke_test.mjs` erweitern, zusätzlich grün zu prüfen:
- `createLighting` in Node importierbar (ohne draw-Aufruf).
- Beide Maps: Legende deckt alle Zeichen, Ränder solide, alle Spawns (Spieler,
  Gegner, Props, Portal-Ziele) auf begehbaren Tiles; jedes Portal-`target`
  existiert in MAPS; Portal-Ziel-Spawn liegt NICHT im Gegenportal.
- Vase zerbricht durch simulierten Schwert-Treffer und durch Berührung; Drop-Kinds
  nur 'coin'/'potion'; Truhe öffnet genau einmal und pusht `'chest_opened'` genau einmal.
- Trank: Pickup erhöht potions (max 3, Überlauf → +2 Gold), Trinken heilt 2 HP,
  nicht über maxHp, nicht bei 0 Tränken, nicht bei vollen Herzen.
- Ghul: stirbt nach 4 Schadenspunkten (2 Schwünge à… nein: 4 Treffer aus 4
  getrennten Schwüngen), macht 2 Kontaktschaden, reduzierter Knockback.
- Alle neuen Sprite-/Tile-Schlüssel existieren; 4-Frame-Zyklen vollständig.

## 4. Abnahmekriterien Slice 1

1. `bash tools/check_syntax.sh` und `node tools/smoke_test.mjs` grün.
2. Browser Friedhof: sichtbar vollere Map, Nebel driftet, mildes Licht, Vasen
   zerschlagbar, Krypta-Eingang führt mit Fade in die Katakomben.
3. Browser Katakomben: deutlich dunkler, Fackelschein flackert posterisiert,
   Ghule spürbar zäher, Truhe öffnet → Münzregen → Sieg-Banner.
4. Tränke: sammeln, HUD-Zähler, Trinken heilt (Tastatur UND Touch-Button B).
5. Kein einziger Konsolen-Fehler im Playwright-Proof (Friedhof + `?map=CATACOMBS`).
