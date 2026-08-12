# GP6-Landkarte "Licht & Maßstab" (07.08.2026, wf_69e483d4-2fd)

Sechs Opus-Leser, read-only, HEAD 7e1d86d. Grundlage für SPEC_GRAFIKPASS_6.md.
Jede Behauptung mit Datei:Zeile im jeweiligen Bericht.



---

# TEIL 1: Hebel 1 — Licht-Pipeline & Quantisierung


Alle Messungen liefen read-only, Skripte nur im Scratchpad, keine Spieldatei berührt, kein Server gestartet.

---

# GP6 Hebel 1 — Landkarte der Licht-Pipeline

## 0. Zwei Korrekturen zur Auftragsformulierung (wichtig für die Spec)

1. **Pfad:** Die Datei heißt `/home/coder/Grimlight/game/js/core/lighting.js`, nicht `world/lighting.js`. `game/js/world/` enthält `tilemap.js`, `maps.js`, `coords.js`, `map_fluestergruft.js`, `map_bosskammer.js`.
2. **Zeilennummer veraltet:** Der geschützte Teilalpha-`fillRect` steht heute auf **`lighting.js:138`**, nicht `:66`. Die Referenz ist zweimal gewandert: `SPEC_GRAFIKPASS_4.md:44` sagt „lighting.js:49", `SPEC_GRAFIKPASS_5.md:29` sagt „lighting.js:66", `lighting.js:37` sagt selbst „Zeile ~66". **Die GP6-Spec muss `lighting.js:138` schreiben** (oder besser: den Detektor inhaltlich statt per Zeilennummer beschreiben, siehe §3).

Baseline verifiziert grün auf HEAD `7e1d86d`:
`node tools/smoke_test.mjs` → SMOKE-TEST GRÜN (7630 Ticks) · `check_main_slice1.mjs` 25 Assertions grün · `check_boss_slice3.mjs` 33 grün · `check_inventory_slice2.mjs` 25 grün.
**Ausnahme:** `/home/coder/Grimlight/.tmp/check_lighting_input_slice1.mjs` ist **bereits ROT** (`TypeError: ctx.save is not a function` an `lighting.js:193`) und seit GP2 verwaist; seine Assertion `arcs.length === 9` (Zeile 60) stammt aus der 3-Ring-Ära und ist gegen die heutigen 6 `PUNCH_RINGS` sowieso falsch. **Er ist kein bindender Test** und darf die GP6-Spec nicht binden, sollte aber ausdrücklich als „bekannt rot, nicht kanonisch" deklariert werden, damit ihn kein Agent versehentlich als Regression liest.

---

## 1. Wie das Lichtbild entsteht und wie es angewandt wird

### 1.1 Aufbau und Aufrufkette

| Schritt | Ort |
|---|---|
| Fabrik ohne Browser-Zugriff | `lighting.js:102` `export function createLighting(viewW, viewH)` |
| Instanz (1x, Modulebene) | `main.js:76` `const lighting = createLighting(VIEW_W, VIEW_H);` |
| Aufruf pro Frame | `main.js:709` `lighting.draw(ctx, camera, frameLights, mapDef.ambient, timeSec, mapDef.ambientTint);` |
| Signatur | `lighting.js:127` `function draw(ctx, camera, lights, ambient, timeSec, tint)` |

Es gibt **genau einen** Aufrufer. `lighting.js` selbst ist Node-importierbar (kein `window`/`document` auf Modulebene), belegt durch Smoke-Test `tools/smoke_test.mjs:590-596`.

### 1.2 Offscreen-Canvas (lazy, gecacht)

```js
// lighting.js:106-112
function ensureOffscreen(ctx) {
  if (off) return;
  off = ctx.canvas.ownerDocument.createElement('canvas');
  off.width = viewW;
  off.height = viewH;
  octx = off.getContext('2d');
}
```

Erzeugt beim **ersten** `draw()`, danach gecacht. Zwei Konsequenzen für GP6:

* Das Offscreen wird aus **`ctx.canvas.ownerDocument`** erzeugt, also aus dem HAUPT-Canvas. In den Flusstest-Stubs trägt nur `mainCanvas` ein `ownerDocument` (`check_main_slice1.mjs:83`); erzeugte Canvases haben `ownerDocument: null` (`check_main_slice1.mjs:54`, `check_inventory_slice2.mjs:66`, `check_boss_slice3.mjs:68`). **Ein zweites Offscreen, das aus dem OFFSCREEN-Kontext erzeugt wird, crasht alle drei Flusstests.** Ein zweites Offscreen aus dem Haupt-`ctx` ist dagegen technisch möglich.
* Der Zeitpunkt ist sicher: `createLighting` selbst erzeugt nichts, `ensureOffscreen` läuft erst im ersten Render, also **nach** `buildAll(SPRITES)` (`main.js:50`), Flips (`main.js:55-70`) und `buildAll(TILE_ART)` (`main.js:71`). Das ist entscheidend, weil `check_main_slice1.mjs:100-106` Canvas→Sprite-Namen **über die Erzeugungsreihenfolge** mappt (`[...Object.keys(SPRITES), ...FLIP_LIST…, ...Object.keys(TILE_ART)]`). Zusätzliche Offscreens am Ende sind unschädlich (`extra_N`).

### 1.3 Das Lichtbild pro Frame (Dunkelheit als Alpha-Kanal)

```js
// lighting.js:128-138
if (!(ambient > 0)) return;
ensureOffscreen(ctx);
octx.globalCompositeOperation = 'source-over';
octx.clearRect(0, 0, viewW, viewH);
octx.globalAlpha = ambient;                 // <-- DER Detektor-Wert
octx.fillStyle = tint || '#050510';
octx.fillRect(0, 0, viewW, viewH);          // <-- lighting.js:138, der geschützte fillRect
```

Danach werden die Lichtkegel **ausgestanzt** (`destination-out`, multiplikativ `dst *= (1-a)`):

```js
// lighting.js:93-100
const PUNCH_RINGS = [
  { rf: 1.00, a: 0.18 }, { rf: 0.85, a: 0.22 }, { rf: 0.70, a: 0.28 },
  { rf: 0.55, a: 0.35 }, { rf: 0.40, a: 0.50 }, { rf: 0.25, a: 1.00 },
];
```

Schleife `lighting.js:140-172`: pro Licht Flicker-Radius (`:145-149`), Viewport-Culling (`:151-156`), gerundete Bildschirmmitte (`:158-159`), deterministischer Radius-Jitter pro Ring (`:165-170`, `punch()` in `:115-120`).

Anwendung auf die Szene:

```js
// lighting.js:176
ctx.drawImage(off, 0, 0);   // 3-Argument (GP5 §0.3-konform), source-over
```

**Kein `globalCompositeOperation: 'multiply'`.** Das Licht ist ein normales `source-over`-Dunkel-Overlay mit per-Pixel-Alpha. „Lichtfaktor quantisieren VOR der Anwendung" heißt hier konkret: **den Alphakanal von `off` in Stufen erzeugen**, bevor `drawImage` läuft.

### 1.4 Der additive Warm-Pass (auf dem HAUPT-ctx)

`lighting.js:193-271`, `save()` → `globalCompositeOperation = 'lighter'` → Schleife über Lichter mit `flicker >= 0.8` (`:196`, also nur Fackeln) → drei Ring-Sätze, danach `restore()` plus explizite Composite-Hygiene:

```js
// lighting.js:275-276
ctx.globalCompositeOperation = 'source-over';
ctx.globalAlpha = 1;
```

Ring-Sätze (alle seit GP5 R2 gestuft statt Gradient, alle mit `rgba`-`fillStyle` bei `globalAlpha = 1`):

| Konstante | Zeile | Radius | Ringe | Spitzendeckung |
|---|---|---|---|---|
| `GLOW_RINGS` (Warm-Glow) | `:45-52`, gezeichnet `:222-231` | `r * 0.48` (`:212`) | 6 | Σ 0.130 |
| `FLOOR_RINGS` (Boden-Glow) | `:53-58`, gezeichnet `:248-254` | 8 px bei `cy+5` (`:238-241`) | 4 | Σ 0.15 × `pulse` |
| `HOT_RINGS` (Flammen-Hotspot) | `:87-91`, gezeichnet `:263-269` | 2.25 px bei `cy-3` (`:260-261`) | 3 | Σ 0.18 × `pulse` |

### 1.5 Die Parameter im Einzelnen

| Begriff | Herkunft | Werte |
|---|---|---|
| `ambient` | `mapDef.ambient` → `main.js:709` | GRAVEYARD 0.45 (`maps.js:537`), CATACOMBS 0.78 (`maps.js:605`), FLUESTERGRUFT 0.85 (`map_fluestergruft.js:160`), BOSS_KAMMER 0.66 (`map_bosskammer.js:80`). **Eingefroren** (`smoke_test.mjs:1996`, `SPEC_GRAFIKPASS_5.md:28`) |
| `ambientTint` | `mapDef.ambientTint`, 6. Argument | `#0a0a18` / `#06080f` / `#04100c` / `#120608` (`maps.js:539`, `:607`, `map_fluestergruft.js:162`, `map_bosskammer.js:82`); Default `#050510` (`lighting.js:137`) |
| `flicker` | pro Licht-Objekt | Fackeln 1 (`main.js:216`), Spieler 0.3 (`main.js:213`), seltene Drops 0.3 (`main.js:694`), Eliten via `eliteLights()` (`main.js:699`), `extraLights` 0.5 (`map_bosskammer.js:99`). **0.8 ist die Schwelle** für Warm-Glow (`lighting.js:196`), Lit-Dither (`main.js:606`) und Wasser-Reflexion |
| `TORCH_RADIUS` | `main.js:30` | `= 72`, gesetzt in `main.js:216` |
| `lights` (statisch je Map) | `main.js:214-217` | Fackel-Tiles aus `torchChars` + Spielerlaterne. Fackelzahl gemessen: GRAVEYARD 3, CATACOMBS 25, FLUESTERGRUFT 9, BOSS_KAMMER 6 |
| `frameLights` (pro Frame) | `main.js:691-707` | `lights.slice()` + Selten-Drop-Lichter (r 18) + Elite-Lichter + `mapDef.extraLights` |
| `playerLightRadius` | `maps.js:540`, `:608`, `map_fluestergruft.js:163`, `map_bosskammer.js:83` | 40 / 52 / 52 / 52 |

### 1.6 Frame-Reihenfolge (`main.js:597-719`)

```
map.draw('ground')            :598
Lit-Dither-Pass ('lighter')   :605-627
Wasser-Reflexionen ('lighter'):636-...
Schatten, Entities, Props
map.draw('over')              :686
drawFog                       :687
frameLights zusammenstellen   :691-707
lighting.draw   <-- HIER      :709
particles.draw                :715   (Funken NACH dem Overlay, bewusst unabgedunkelt)
drawVignette                  :716
drawHUD / drawPickupToast     :717-718
```

Alles vor `:709` wird abgedunkelt, alles danach nicht. **Für Hebel 1 heißt das:** Sprite-Beleuchtung (Hebel 3) und Licht-Quantisierung (Hebel 1) greifen an derselben Stelle, aber Hebel 1 ändert nur den Inhalt von `off`.

---

## 2. Befund: wo genau sitzt das „weiche Licht" heute noch

Das ist der belastbare Kern für die Spec, denn die Punch-Stufen sind **bereits** quantisiert.

**(a) Der Kegel EINES Lichts hat 7 Stufen, nicht unendlich viele.** Aus `PUNCH_RINGS` (`lighting.js:93-100`) folgt kumulativ 1 → 0.82 → 0.6396 → 0.4605 → 0.2993 → 0.1497 → 0 (die Kommentar-Rechnung `lighting.js:16-19` bestätigt das). Ein einzelner Kegel ist also schon nahe an den geforderten 10-12 Stufen.

**(b) ÜBERLAGERUNG ist die eigentliche Weichzeichner-Quelle.** `destination-out` ist multiplikativ; zwei überlappende Lichter erzeugen bis zu 7×7 = 49, drei bis zu 343 verschiedene Restdunkelheiten. In den Katakomben liegen im Worst Case **12 Fackeln gleichzeitig im Viewport** (gemessen, siehe §5). **Genau hier fehlt die Quantisierung**, und genau das meint das Juror-Zitat „Lichtfaktor auf 10-12 Stufen".

**(c) Antialiasing an jeder Ringkante.** `octx.arc()` + `fill()` (`lighting.js:117-119`) rastert kantengeglättet; `imageSmoothingEnabled` (`main.js:34`) wirkt nur auf `drawImage`, nicht auf Pfade. Jede der 6 Ringkanten pro Licht trägt einen ~1 px weichen Saum. Bei 12 Lichtern sind das ~72 weiche Kanten im Bild. (Herleitung aus dem Canvas-Verhalten, nicht aus dem Code zitierbar — sollte im GP6-Abnahmebild nachgemessen werden.)

**(d) Kontinuierliche Zeitmodulation.** Drei Stellen sind explizit **nicht** gestuft:
* `lighting.js:149` `const r = light.radius * (1 + flicker * 0.1 * wob);` — Fließkomma-Radius, die Bänder wandern subpixelweise.
* `lighting.js:237` `const pulse = 0.75 + 0.25 * wob;`, angewandt in `:250` und `:265` als `(ring.a * pulse).toFixed(3)` — 1/1000-Schritte, faktisch stufenlos.
* `lighting.js:169` `rWob = Math.sin(seed + k * 2.399) * 0.02` bzw. `:226` `* 0.03` — bewusster Anti-Kornkreis-Jitter, aber ebenfalls kontinuierlich.

**Wichtig für die Spec:** (d) ist der Anti-Kornkreis-Schutz aus GP4 R2 (`lighting.js:160-164`). Wer ihn zum Quantisieren opfert, holt das „aufgemalte Rosetten/Kornkreise"-Problem zurück, das GP4 explizit gelöst hat. Das war auch der Grund, warum GP5 den Fackelscheiben-Bake gestrichen hat (`SPEC_GRAFIKPASS_5.md:9-12`):

> „Fackelscheiben-Bake (D2 alt): Detektor-Kollision, Bayer im Whitelist-Rahmen nicht legal, hätte den Anti-Kornkreis-Jitter gekillt. Kegel bleibt arc-basiert (bereits 6 Stufen) — die Raster-Sprache zeigen Vignette + Lit-Dither."

Diese Streichung muss GP6 bewusst und begründet revidieren, sonst wiederholt der Pass eine bereits getroffene Entscheidung. **Die Teilaussage „Bayer im Whitelist-Rahmen nicht legal" ist inzwischen widerlegt** — siehe §4.2.

---

## 3. KRITISCHE CONSTRAINT: der ambientAlpha-Detektor

### 3.1 Die drei Fundstellen (wörtlich, identisch)

Der Detektor existiert **dreifach**, nicht nur in den Boss-Flusstests:

```js
// /home/coder/Grimlight/.tmp/check_main_slice1.mjs:154-157
function ambientAlpha() {
  const f = ops.find((o) => o.op === 'fillRect' && o.canvas !== mainCanvas && o.alpha > 0 && o.alpha < 1);
  return f ? f.alpha : null;
}
```

```js
// /home/coder/Grimlight/.tmp/check_boss_slice3.mjs:120-123
function ambientAlpha() {
  const f = ops.find((o) => o.op === 'fillRect' && o.canvas !== mainCanvas && o.alpha > 0 && o.alpha < 1);
  return f ? f.alpha : null;
}
```

```js
// /home/coder/Grimlight/.tmp/check_inventory_slice2.mjs:210-213
function ambientAlpha() {
  const f = ops.find((o) => o.op === 'fillRect' && o.canvas !== mainCanvas && o.alpha > 0 && o.alpha < 1);
  return f ? f.alpha : null;
}
```

`ops.find` liefert den **ersten** Treffer pro Frame (`ops` wird je Frame geleert, `check_main_slice1.mjs:110`). Es gibt also keine „Reihenfolge-Toleranz": der allererste Teilalpha-`fillRect` auf einem Nicht-Main-Canvas **muss** `lighting.js:138` sein.

### 3.2 Was daran hängt (13 Assertions)

| Datei | Zeilen | Erwartung |
|---|---|---|
| `check_main_slice1.mjs` | 202, 229, 236, 246, 283 | 0.45 / 0.78 / 0.78 / 0.45 / 0.45 |
| `check_boss_slice3.mjs` | 143, 157-158, 165, 172, 185, 244, 264, 277-278 | 0.66 / 0.85 |
| `check_inventory_slice2.mjs` | 226-227 | 0.6 (injizierte TESTMAP, `:130`) |

Die Flusstests sind **kanonisch und NULL-Änderungen** (`SPEC_GRAFIKPASS_5.md:27-28`, `SPEC_GRAFIKPASS_4.md:34`).

### 3.3 Das erlaubte Gegenmuster (bereits zweimal erprobt)

`SPEC_GRAFIKPASS_5.md:29-31`:

> „ambientAlpha-Detektor: lighting.js:66 bleibt der EINZIGE Teilalpha-fillRect auf einem Nicht-Main-Canvas. Overlays/Bakes auf Offscreens nutzen rgba-fillStyle bei globalAlpha=1."

Umgesetzt in `hud.js:449-453`:

> „DETEKTOR-PFLICHT (§0.1): der Bake laeuft auf einem NICHT-Main-Canvas — die Deckung steckt deshalb in der rgba-FUELLFARBE, globalAlpha bleibt exakt 1. Sonst waere dieser fillRect der erste Teilalpha-fillRect auf einem Offscreen und der ambientAlpha-Detektor der Boss-Flusstests laese ihn statt lighting.js:66."

Und in `hud.js:229-233`:

> „Bar bleibt in drawHUD NACH lighting.draw, damit der ambientAlpha-Detektor der Boss-Flusstests (erstes Teilalpha-fillRect auf dem Lighting-Offscreen, NICHT auf dem Haupt-Canvas) unberuehrt bleibt."

**Formulierungsvorschlag für die GP6-Spec** (statt einer Zeilennummer, die wieder wandert):

> Der einzige `fillRect` mit `0 < globalAlpha < 1` auf einem Nicht-Main-Canvas ist der Ambient-Fill in `lighting.js` (heute `:138`, `octx.globalAlpha = ambient`). Er muss der ERSTE `fillRect`-Aufruf dieses Frames auf einem Nicht-Main-Canvas bleiben. Jede weitere Offscreen-Zeichnung führt die Deckung in der `rgba(...)`-Füllfarbe bei `globalAlpha === 1`.

Zweite, weniger offensichtliche Falle: `destination-out`-Stanzen laufen mit `octx.globalAlpha = alpha` (`lighting.js:116`), aber via `arc`/`fill`, **nicht** via `fillRect`. Wer eine Stanzstufe auf `fillRect` umstellt (z. B. für rechteckige Dither-Läufe), erzeugt **sofort** einen zweiten Teilalpha-`fillRect` auf dem Offscreen. Der landet zwar hinter dem Ambient-Fill (`find` nimmt den ersten), aber die Reihenfolge-Abhängigkeit wäre dann tragend statt zufällig. Die Spec sollte das explizit verbieten: **Offscreen-Stanzen nur über `rgba`-Alpha bei `globalAlpha = 1`, wenn sie `fillRect` verwenden.**

---

## 4. Präzedenzen

### 4.1 `litDitherCells` (GP4 §2.2a, „Licht trifft Textur")

**Signatur** `tilemap.js:59`:
```js
export function litDitherCells(lights, camera, timeSec, viewW, viewH, isLit)
```
Reine Funktion, kein Canvas, kein RNG, kein `Date.now`. Liefert `{tx, ty, stufe, key}` je Zelle, Stufe 2 bei `dist < r*0.40`, Stufe 1 bei `< r*0.70` (`tilemap.js:81-82`), Key über `variantIndex(tx, ty, 2)` (`tilemap.js:85`, Hash `:34-39`).

**Der Flicker-Radius ist aus `lighting.js` DUPLIZIERT** (`tilemap.js:74-77` gegen `lighting.js:145-149`), ausdrücklich sanktioniert (`tilemap.js:44-48`):

> „die Formel aus lighting.js:57-60 ist hierher DUPLIZIERT (Spec §2.2a erlaubt Duplikat), damit der Kegel deckungsgleich mit dem gestanzten Lichtkreis pulst und die Funktion headless (ohne core/lighting.js) baubar bleibt."

(Auch diese Zeilenreferenz ist veraltet; die Formel steht heute `lighting.js:145-149`. **Wenn GP6 die Flicker-Formel ändert, MÜSSEN beide Stellen mitziehen**, sonst driften Kegel und Dither auseinander.)

**Der `isLit`-Parameter** (GP5 §1.7, `tilemap.js:54-58`, `:68`): optionales Prädikat `(tx, ty) => bool`; `false` schließt die Zelle aus. Fehlt er, ist das Verhalten byte-gleich zu vorher — das ist der Kunstgriff, mit dem GP5 eine Signatur erweitern konnte, ohne bestehende 5-argumentige Testaufrufe rot zu machen. **Genau dieses Muster sollte GP6 für Hebel 1 kopieren.** Aufrufer: `main.js:611` mit `litFilter` (`main.js:530-533`: keine anim-, Wasser- oder Ufer-Kacheln).

**Aufrufer des Zeichenpfads:** `main.js:605-627`, nur auf `LIT_FLOOR_MAPS` (`main.js:524`: CATACOMBS, FLUESTERGRUFT, BOSS_KAMMER), nur Lichter mit `flicker >= 0.8` (`main.js:606`), `drawImage` 3-Argument mit `'lighter'` und `globalAlpha` 0.30/0.18 (`main.js:614-619`), danach explizite Composite-Hygiene (`main.js:622-625`).

**Tests:** `tools/smoke_test.mjs:2077-2132` — Determinismus (`:2082`), Stufen-Radien (`:2093`, `:2098`), kein Kegel jenseits `r*0.70` (`:2106`), Key-Regel (`:2107`), und vier Regressions-Checks für den optionalen 6. Parameter (`:2123-2131`), darunter der entscheidende:
```js
// smoke_test.mjs:2130-2131
check('§1.7 litDither-Filter: Direktaufruf mit 5 Argumenten unveraendert (Parameter optional)',
  JSON.stringify(litDitherCells(lightsW, camW, 0.4, 320, 180)) === JSON.stringify(unfiltered));
```
Die Art-Kacheln `licht_dither_1/_2` liegen in `sprites.js:4092` und `:4110` (16×16-Grids mit sehr dünner Streuung, ~6 gesetzte Pixel bzw. ~20).

### 4.2 `drawVignette` (GP5 §5.D1) — **Bayer IST bereits legal umgesetzt**

Das ist die wichtigste Präzedenz und widerlegt die GP5-Annahme „Bayer im Whitelist-Rahmen nicht legal":

```js
// hud.js:454-464
const BAYER4 = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
const VIG_STEP = 0.09;
const VIG_MAX_LEVEL = 5;
const VIG_STYLES = [];
for (let i = 0; i <= VIG_MAX_LEVEL; i++) VIG_STYLES.push(`rgba(5,3,9,${(i * VIG_STEP).toFixed(2)})`);
```

Kern des Bakes (`hud.js:479-509`): Doppelschleife über alle 320×180 Pixel, Stufe = `Math.floor(a / VIG_STEP + BAYER4[y & 3][x & 3] / 16)` (`:492-495`), zusammenhängende Pixel gleicher Stufe = **EIN** `fillRect(runStart, y, x - runStart, 1)` (`:503`), `vctx.globalAlpha = 1` (`:478`), Deckung in `rgba` (`:502`). Angewandt per `ctx.drawImage(vignetteCanvas, 0, 0)` (`:511`).

**Erlaubt ist das Verfahren also nachweislich.** Der Unterschied zu Hebel 1: die Vignette wird **einmal** gebacken (`if (!vignetteCanvas)`, `:467`), das Licht müsste **pro Frame** neu.

---

## 5. Optionen für die Quantisierung

Messungen (Node, reine JS-Rechenzeit ohne Canvas-Rasterisierung, Skripte: `/tmp/claude-1000/-home-coder/2135f5db-b185-41ca-95a9-9bd4f9302d40/scratchpad/measure_quant.mjs` und `.../measure_bands.mjs`):

```
Vignetten-Bake (hud.js, EINMALIG):                    12137 fillRect-Läufe
Licht-Vollbild  1 Licht,  12 Stufen:  3433 Läufe,  0,96 ms/Frame
Licht-Vollbild  4 Lichter, 12 Stufen: 15018 Läufe, 3,38 ms/Frame
Licht-Vollbild  8 Lichter, 12 Stufen: 16914 Läufe, 7,25 ms/Frame
Band-Zellen (16x16) Worst Case: CATACOMBS 252 (12 sichtbare Fackeln),
                                FLUESTERGRUFT 218, BOSS_KAMMER 213
                                (theoretisches Maximum 273 = 21x13)
bandCells über ALLE 25 Katakomben-Fackeln ohne Culling: 0,443 ms/Frame
Vergleich Bestand: litDitherCells Worst Case CATACOMBS 200 Zellen/Frame
```

### Option (a) — `getImageData`/`putImageData` pro Frame

**SOFORT AUSGESCHLOSSEN, harter Blocker.** `getImageData` steht namentlich auf der VERBOTEN-Liste:

```
// SPEC_GRAFIKPASS_4.md:38-41
VERBOTEN:
getImageData, putImageData, ellipse, roundRect, createPattern,
clip, moveTo/lineTo/rect/closePath, measureText, scale/transform/
setTransform, strokeRect, translate, rotate.
```

Die Stubs kennen die Methode nicht (`check_main_slice1.mjs:30-51`, `check_inventory_slice2.mjs:41-63`, `check_boss_slice3.mjs:49-66`): der Aufruf würde mit `TypeError: octx.getImageData is not a function` **alle drei kanonischen Flusstests killen**, exakt so wie es `check_lighting_input_slice1.mjs` heute schon vorführt. Eine Stub-Erweiterung ist per `SPEC_GRAFIKPASS_4.md:34` („NULL Änderungen, keine Stub-Erweiterungen") verboten. Aufwand einer Legalisierung: 3 Flusstests ändern = Bruch der eisernen Regel 1. **Nicht empfehlen.**

### Option (b) — gestufte konzentrische Ringe (Ausbau des Bestands)

`PUNCH_RINGS` von 6 auf 10-12 Einträge erweitern (`lighting.js:93-100`), gleichverteilte kumulative Restdunkelheit.

* **Aufwand:** sehr klein (eine Konstanten-Tabelle, `lighting.js:93-100`; die Schleife `:166-171` ist schon generisch über `PUNCH_RINGS.length`).
* **Testrisiko:** **null**. Keine neue Canvas-Methode, kein neues Canvas, kein neuer `fillRect`. Alle 4 Suiten bleiben grün.
* **Performance:** +4 bis +6 `arc`/`fill` pro Licht pro Frame; bei 12 sichtbaren Fackeln also ~+70 Pfadfüllungen. Vernachlässigbar gegen die 213-252 `drawImage` des bestehenden Lit-Dither.
* **Wirkung:** **löst das eigentliche Problem NICHT.** Es adressiert (a) aus §2, das bereits gelöst ist. Weder Überlagerung (b) noch Antialiasing (c) noch Zeitmodulation (d) werden angefasst. Der Juror würde weiterhin weiche Rampen messen. **Als alleiniger Hebel ungenügend**, als Begleitmaßnahme sinnvoll.

### Option (c) — Bayer-Bänder als eigener Zell-Pass (Muster `litDitherCells`)

Neue reine Funktion in `tilemap.js`, z. B. `lightBandCells(lights, camera, timeSec, viewW, viewH, isLit)`, liefert 16×16-Zellen, deren Zentrum in einem Band um eine Ringkante liegt, plus Stufenindex. Gezeichnet in `main.js` per 3-Argument-`drawImage` einer Dither-Kachel mit `'lighter'` oder `'source-over'`.

* **Aufwand:** mittel. Neue Funktion `tilemap.js` (Ende der Datei, keine Bestandsberührung), neuer Zeichenblock `main.js`, 1-2 neue TILE_ART-Keys, neuer Smoke-Katalog-Block.
* **Stub-Verträglichkeit:** **vollständig.** Nur `drawImage` 3-Argument, `save/restore`, `globalAlpha`, `globalCompositeOperation` — alles in allen drei Stubs vorhanden und geloggt.
* **Performance gemessen:** 213-252 `drawImage`/Frame Worst Case, Rechenzeit 0,44 ms selbst ohne Culling über alle 25 Fackeln. Direkt vergleichbar mit dem produktiv laufenden Lit-Dither (200 Zellen). **Unbedenklich.**
* **Detektor:** unberührt (kein `fillRect`, kein Offscreen).
* **Golden-Hashes:** unberührt (siehe §5.1).
* **Risiko 1 — Reihenfolge der TILE_ART-Keys:** neue Kacheln **müssen am ENDE** des `TILE_ART`-Objektliterals stehen. `check_main_slice1.mjs:100-104` mappt Canvas→Name über `[...Object.keys(SPRITES), ...FLIP_LIST, ...Object.keys(TILE_ART)]`; ein Einschub in der Mitte verschiebt die Zuordnung und macht `playerScreen()`/Herzen-Assertions rot. Der Kommentar `main.js:62-65` warnt bereits genau davor.
* **Risiko 2 — Zellraster gegen Radialgeometrie:** Ein 16-px-Raster kann eine Ringkante bei r=72 nur grob nachzeichnen. Das kann als Treppe lesen. Mildernd: die Bänder wandern durch den Flicker ohnehin.
* **Risiko 3 — der Pass läge auf dem Haupt-ctx NACH `lighting.draw`**, also über dem Dunkel-Overlay. Er kann Kanten *aufhellen*, aber keine Bänder *innerhalb* des Overlay-Alphas erzeugen. Das ist konzeptionell schwächer als „VOR der Anwendung", was das Juror-Zitat verlangt.

### Option (d) — Zeilenweiser Quantisierungs-Bake auf dem Lichtcanvas (Vignetten-Muster, PRO FRAME)

Das Offscreen nicht mehr per `arc`-Stanzen bauen, sondern wie `hud.js:479-509`: pro Zeile den Lichtfaktor **rechnerisch** ermitteln (Distanz zu jedem Licht, Punch-Profil aus einer Lookup-Tabelle), auf 10-12 Stufen quantisieren, Bayer-4×4 addieren, Läufe gleicher Stufe als **ein** `fillRect` mit `rgba`-Füllfarbe bei `globalAlpha = 1` zeichnen.

* **Trifft das Juror-Zitat exakt:** die Quantisierung passiert im Alphakanal von `off`, also **vor** `ctx.drawImage(off, 0, 0)` (`lighting.js:176`). Überlagerung, Antialiasing und Zeitmodulation verschwinden **alle drei** in einem Zug, weil der Faktor pro Pixel einmal berechnet und dann gerastet wird.
* **Stub-Verträglichkeit:** vollständig (`fillRect`, `clearRect`, `drawImage`) — dieselbe Methodenmenge wie heute.
* **Detektor:** **funktioniert nur mit dem `rgba`-bei-`globalAlpha=1`-Muster.** Der bisherige Ambient-`fillRect` (`lighting.js:136-138`) mit `globalAlpha = ambient` müsste **bleiben** (er ist die Detektor-Sonde für 13 Assertions), aber alle Stufen-Läufe darüber müssten `globalAlpha = 1` fahren. Umsetzbar: Ambient-Fill als Stufe 0 stehenlassen (`fillRect` voll, `globalAlpha = ambient`), Aufhellung dann per `destination-out`-`fillRect`-Läufe mit `rgba(0,0,0,X)` bei `globalAlpha = 1`. **Das muss die Spec wörtlich vorschreiben, sonst kippt der Detektor.**
* **Performance gemessen — der Knackpunkt:** 15018 `fillRect`-Aufrufe bei 4 Lichtern, 16914 bei 8, zuzüglich 3,4-7,3 ms reiner JS-Rechenzeit. Bei 60 Hz stehen 16,6 ms zur Verfügung. Selbst wenn ein `fillRect` nur 0,5 µs kostet, kommen 8 ms Canvas-Zeit dazu. **Auf einem Mittelklasse-Handy ist das im aktuellen Zuschnitt nicht haltbar.**
* **Entschärfungen, die die Spec vorgeben müsste (in dieser Reihenfolge):**
  1. **Nur innerhalb der Licht-Bounding-Boxen rechnen**, außerhalb ein einziger Voll-`fillRect` mit `ambient` (der Detektor-Fill). Reduziert die Pixelmenge in den Katakomben grob um den Faktor 2-3.
  2. **Halbauflösung:** 160×90 Offscreen, dann per 3-Argument-`drawImage` auf 320×180 hochskaliert. Viertelt die Läufe auf ~4000 und passt zum Pixel-Look (2-px-Lichtraster liest sogar retro-korrekter). `drawImage` mit 3 Argumenten skaliert allerdings nicht — dafür bräuchte man die 5-Argument-Form, die `SPEC_GRAFIKPASS_5.md:36-37` für Licht/Overlays auf 3 Argumente begrenzt. **Das wäre eine bewusst zu sanktionierende Ausnahme** (die Stubs loggen `drawImage(img, ...a)` variadisch, `check_main_slice1.mjs:41`, brechen also NICHT; nur `fullHearts()`/`emptyHearts()` filtern auf `o.args.length === 2`, `:164-167`, und das betrifft nur HUD-Herzen). Alternativ: Offscreen mit `width=160` erzeugen und per CSS-freiem `drawImage(off, 0, 0)`... geht nicht, 3-Argument zeichnet 1:1. **Die Spec muss hier entscheiden.**
  3. **2-px-Bayer-Blöcke statt 1-px:** halbiert die Lauf-Aufsplittung an den Bandgrenzen.
  4. **Cache über Frames:** das Lichtbild nur neu bauen, wenn sich Kamera (ganzzahlig) oder ein quantisierter Flicker-Radius geändert hat. Erfordert, dass `r` (`lighting.js:149`) auf ganze Pixel gerundet wird — was ohnehin ein Quantisierungsgewinn ist (§2d) und den Kanten-Shimmer nimmt.
* **Risiko für den Anti-Kornkreis-Jitter:** Der Jitter (`lighting.js:165-170`, `:222-226`) lebt heute in den `arc`-Radien. In einem rechnerischen Profil bleibt er trivial erhalten (`r * (rf + rWob)` in die Lookup-Distanz einsetzen). **GP5s Sorge trifft diese Variante NICHT** — das ist der entscheidende Unterschied zum gestrichenen Fackelscheiben-Bake, der auf gecachte Scheiben-Sprites setzte.

### Empfehlung an die Spec-Ebene

**(d) mit den Entschärfungen 1+4, begleitet von (b)** trifft das Juror-Zitat, ist detektorsicher und hat mit `drawVignette` eine im Repo laufende Präzedenz. **(c)** ist der risikoärmste, aber inhaltlich schwächere Rückfallpfad und arbeitet auf der falschen Seite des Overlays. **(a)** ist ausgeschlossen. **Die Performance ist der einzige echte Blocker von (d) und muss vor der Spec-Verabschiedung im Browser auf Port 8124 gegengemessen werden** — meine Zahlen sind reine JS-Zeit ohne Canvas-Rasterisierung und damit eine Untergrenze.

### 5.1 Golden-Hashes: nicht betroffen

`smoke_test.mjs:1984-2013`. `solHash` hasht das Soliditätsraster aus `rows`+`legend` (`:1998-1999`), `geoHash` Spawns, Portale und `torchChars`-`findTiles` (`:2000-2007`). **Kein Renderpfad, keine Lichtparameter.** Zusätzlich `:2012` `check('§36 ${name}: Ambient == ${AMBIENT[name]}')`. Solange Hebel 1 nur `lighting.js`, `main.js` (Zeichenblock) und additiv `tilemap.js`/`sprites.js` anfasst und `ambient` nicht verändert, bleiben alle 12 Hash-Assertions unberührt. **Achtung Abgrenzung: Hebel 2 (Belichtungs-Sockel) bricht `smoke_test.mjs:2012` plus 13 Flusstest-Zeilen und braucht die von `DOSSIER_GRAFIKBLOCK.md` genannte sanktionierte Test-Runde.**

### 5.2 Stub-Whitelist, verifiziert je Datei

| Methode | `check_main_slice1` | `check_inventory_slice2` | `check_boss_slice3` |
|---|---|---|---|
| `fillRect` (geloggt) | :39 | :50 | :57 |
| `clearRect` (no-op) | :40 | :52 | :58 |
| `drawImage` (geloggt, variadisch) | :41 | :53 | :59 |
| `fillText` (geloggt) | :42 | :54 | :60 |
| `beginPath`/`arc`/`fill`/`stroke` | :43 | :55 | :61 |
| `save`/`restore` | :44-48 | :56-60 | :62-63 |
| `createRadialGradient` (`addColorStop` no-op) | :49 | :61 | :64 |
| `strokeRect` | **fehlt** | :51 | :58 |
| `translate`/`rotate` | **fehlt** | **fehlt** | :61 |
| `getImageData`/`putImageData` | **fehlt** | **fehlt** | **fehlt** |
| Properties | `globalAlpha`, `globalCompositeOperation`, `fillStyle`, `strokeStyle`, `lineWidth`, `font`, `textAlign`, `textBaseline`, `imageSmoothingEnabled` | dito | dito |

**Die effektive Whitelist ist der Schnitt**, also `check_main_slice1.mjs:30-51`. Kein `strokeRect`, kein `translate`, kein `rotate`.

Ein zweiter, oft übersehener Unterschied: `restore()` stellt `globalCompositeOperation` in `check_main_slice1.mjs:47` und `check_inventory_slice2.mjs:59` wieder her, in **`check_boss_slice3.mjs:63` NICHT** (`{ a: this.globalAlpha, f: this.fillStyle }`). Deshalb ist die explizite Composite-Hygiene Pflicht (`lighting.js:272-276`, `main.js:622-625`, `SPEC_GRAFIKPASS_4.md:46-51`). **Jeder neue `lighter`- oder `destination-out`-Block in GP6 braucht denselben expliziten Reset.**

---

## 6. Test-Abschnitte, die das Lichtsystem binden

| # | Ort | Zeilen | Bindung |
|---|---|---|---|
| 1 | `tools/smoke_test.mjs` | 590-596 | `createLighting` liefert `draw`, ohne Browser importierbar. **Einzige direkte Lighting-Assertion im Smoke-Test.** `lighting.js` darf kein `window`/`document` auf Modulebene bekommen |
| 2 | `tools/smoke_test.mjs` | 2077-2108 | `litDitherCells`: Determinismus, Stufenradien 0.40/0.70, Key-Regel |
| 3 | `tools/smoke_test.mjs` | 2109-2132 | `isLit`-Filter, inkl. Regression „5 Argumente byte-gleich" (`:2130-2131`) — das Muster für optionale Signatur-Erweiterungen |
| 4 | `tools/smoke_test.mjs` | 2299-2306 | `waterReflections`: Lichter mit `flicker < 0.8` werfen keine Reflexion. **Bindet die 0.8-Schwelle** |
| 5 | `tools/smoke_test.mjs` | 2459-2466 | `extraLights`: BOSS_KAMMER genau 1 Füll-Licht mit `flicker === 0.5`; alle Füll-Lichter unter 0.8 |
| 6 | `tools/smoke_test.mjs` | 1984-2013 | Golden-Hashes + `ambient == 0.45/0.78/0.85/0.66` |
| 7 | `.tmp/check_main_slice1.mjs` | 154-157 (Detektor), 202/229/236/246/283 | ambientAlpha 0.45/0.78 |
| 8 | `.tmp/check_boss_slice3.mjs` | 120-123 (Detektor), 143/157/165/172/185/244/264/277 | ambientAlpha 0.66/0.85; `restore()` ohne gco |
| 9 | `.tmp/check_inventory_slice2.mjs` | 210-213 (Detektor), 226-227 | ambientAlpha 0.6 (injizierte TESTMAP) |
| 10 | `.tmp/check_main_slice1.mjs` | 100-106, 128-139, 164-167 | Canvas→Sprite-Mapping über Erzeugungsreihenfolge. **Bindet die Reihenfolge von `SPRITES`, `FLIP_LIST` und `TILE_ART` sowie den Zeitpunkt jeder `createElement`-Canvas-Erzeugung** |
| 11 | `.tmp/check_lighting_input_slice1.mjs` | 43-72 | **BEREITS ROT/verwaist** (`arcs.length === 9` gegen 6 Punch-Ringe; `ctx.save` fehlt im Stub). Nicht kanonisch, in der Spec als „bekannt rot" deklarieren |

Weitere Wächter, die ein Art-Zulieferer für Option (c) treffen würde: `smoke_test.mjs:481-520` (Pflicht-TILE_ART-Keys, u. a. `'licht_dither_1', 'licht_dither_2'` in `:517`), `smoke_test.mjs:587` (alle Legenden-Arts existieren), `.tmp/check_gfx5_art.mjs` (Palette 61 Alnum + `=`/`+`/`*`, Maße, laut `SPEC_GRAFIKPASS_5.md:52-55`).

---

## 7. Weitere Fallen für die Spec

1. **Doppelte Flicker-Formel.** `lighting.js:145-149` und `tilemap.js:74-77` sind bewusste Duplikate. Auch `lighting.js:198-201` (Warm-Pass) enthält sie ein drittes Mal. **Drei Stellen**, alle müssen bei einer Änderung der Flicker-Formel synchron ziehen, sonst driften Kegel, Lit-Dither und Warm-Glow auseinander.
2. **`ambient === 0` beendet `draw()` sofort** (`lighting.js:128`). Ein GP6-Pass, der Quantisierung in `draw()` einbaut, darf für Tag-Maps nicht plötzlich zeichnen. Aktuell hat keine Map `ambient === 0`.
3. **`lights` enthält IMMER das Spielerlicht** (`main.js:217`, `flicker 0.3`). Ein „nur Fackeln"-Filter muss explizit auf `>= 0.8` prüfen, wie `main.js:606` und `lighting.js:196` es tun.
4. **`main.js:723` und `:733`/`:745` zeichnen Teilalpha-`fillRect` auf dem HAUPT-Canvas.** Der `fadeAlpha()`-Detektor (`check_main_slice1.mjs:158-163`) sucht dort `fillStyle === '#000'`, `0 < alpha < 1`, exakt 320×180. Ein neues Vollbild-`fillRect` mit `#000` und Teilalpha auf dem Haupt-Canvas würde den **Fade-Detektor** stören (er nimmt den letzten Treffer, `:162`). Für Hebel 1 nur relevant, falls jemand eine Vollbild-Abdunklung auf dem Haupt-ctx ergänzt.
5. **Die 0.8-Schwelle ist an vier Stellen hartkodiert** (`lighting.js:196`, `main.js:606`, `tilemap.js` in `waterReflections`, plus die Smoke-Assertions #4/#5). Sie ist faktisch Teil des Licht-Interfaces und sollte in GP6 nicht stillschweigend wandern.
6. **Kein `Math.random`/`Date.now` in `world/` und `art/`** (`SPEC_GRAFIKPASS_5.md:39-42`, auch in Kommentaren). Eine `lightBandCells`-Funktion in `tilemap.js` muss rein deterministisch bleiben; neue Hashes über `variantIndex` mit versetzten Koordinaten und ungeradem, zu allen anderen `n` am selben Ort teilerfremdem `n`.


---

# TEIL 2: Hebel 2 — Belichtungs-Sockel (inkl. Ist-Messung)


# GP6-Landkarte — Belichtungs-Sockel (Hebel 2): Kartierung + IST-Messung

Alle Angaben gegen HEAD `7e1d86d`. Keine Spieldatei berührt; geschrieben wurde nur in `.tmp/`. Server lief auf 8124 und ist gestoppt (`8123` unberührt).

---

## 1. Wo der Belichtungs-Sockel definiert ist

### 1.1 Die vier Ambient-Werte — alle in den Map-Daten, keiner in `main.js`

| Karte | Datei:Zeile | Wert | `ambientTint` | Datei:Zeile |
|---|---|---|---|---|
| GRAVEYARD | `game/js/world/maps.js:537` | `ambient: 0.45,` | `'#0a0a18'` (L 11,6) | `maps.js:539` |
| CATACOMBS | `game/js/world/maps.js:605` | `ambient: 0.78,` | `'#06080f'` (L 8,2) | `maps.js:607` |
| FLUESTERGRUFT | `game/js/world/map_fluestergruft.js:160` | `ambient: 0.85,          // dunkelste Ebene` | `'#04100c'` (L 12,0) | `map_fluestergruft.js:162` |
| BOSS_KAMMER | `game/js/world/map_bosskammer.js:80` | `ambient: 0.66,          // Grafikpass 3 §4.2: 0.70 -> 0.66 (jetzt UMGESETZT; die fuenf sanktionierten check_boss_slice3.mjs-Zeilen sind laut §5.1 mitgezogen)` | `'#120608'` (L 9,8) | `map_bosskammer.js:82` |

Konvention wörtlich, `maps.js:16`:
```
// - ambient: 0..1 Dunkelheitsgrad (lighting.js), playerLightRadius: Radius
```

### 1.2 Was `ambient`/`ambientTint` tatsächlich tun

Durchreichung, `game/js/main.js:709`:
```js
lighting.draw(ctx, camera, frameLights, mapDef.ambient, timeSec, mapDef.ambientTint);
```

Wirkung, `game/js/core/lighting.js:127-138` und `:176`:
```js
function draw(ctx, camera, lights, ambient, timeSec, tint) {
    if (!(ambient > 0)) return;
...
    octx.globalAlpha = ambient;
    octx.fillStyle = tint || '#050510'; // Farbtemperatur der Map (§2.3), Default fast schwarz/blau
    octx.fillRect(0, 0, viewW, viewH);
...
    ctx.drawImage(off, 0, 0);
```
Also: EIN halbtransparenter Vollbild-Fill in Tint-Farbe auf einem Offscreen, danach werden die Lichtkegel per `destination-out` herausgestanzt (6 Ringe, `PUNCH_RINGS`), dann wird das Overlay per `drawImage` auf den Haupt-Canvas gelegt. **`ambient` ist also ein reiner linearer Blend gegen den Tint-Ton**, nicht etwa eine Gamma-/Multiplikations-Operation:

> L_render = L_palette · (1 − a) + L_tint · a  (außerhalb jedes Lichtkegels)

Das ist der Kern für Abschnitt 4: **`ambient` kann nur ABDUNKELN.** Der Grenzwert `ambient → 0` ist die Palette selbst — mehr Helligkeit als der Palettenton gibt es über diesen Hebel physikalisch nicht.

Nachbarn im selben Sockel (mitkartiert, weil sie dieselbe Kennzahl bewegen):
- `ambientTint` ist **nirgends testgebunden** (grep über `tools/smoke_test.mjs` und alle `.tmp/check_*.mjs`: kein Treffer auf `ambientTint` oder die vier Hex-Werte) — freier Hebel.
- **Vignette**, `game/js/main.js:716` → `hud.js:466`, Profil `hud.js:460-461` (`VIG_STEP = 0.09`, 6 Stufen, Max-Alpha 0,45 in `rgba(5,3,9,…)`, R_IN 90 / R_OUT 190). Kostet gemessen 0,6–1,8 L Median und verdreifacht den Anteil sehr dunkler Pixel (siehe §3.3).
- **`extraLights`**, `map_bosskammer.js:99-101` — `{ x: 160, y: 96, radius: 88, flicker: 0.5 }`; additiv in `main.js:704-706`. Additive Füll-Lichter sind ein testfreier Zusatz-Hebel für Sockel-Anhebung ohne Ambient-Änderung.
- `playerLightRadius` 40 (GRAVEYARD) bzw. 52 (Rest), `maps.js:540`, `:608`, `map_fluestergruft.js:163`, `map_bosskammer.js:83` — ebenfalls testfrei.

---

## 2. Testbindungen des Sockels + das GP3-Sanktionsmuster

### 2.1 Die bindenden Zeilen — vollständig, wörtlich

**A) `tools/smoke_test.mjs` — Abschnitt 36 (harte Wert-Gleichheit, alle 4 Karten in EINER Zeile)**

`tools/smoke_test.mjs:1996`:
```js
  const AMBIENT = { GRAVEYARD: 0.45, CATACOMBS: 0.78, FLUESTERGRUFT: 0.85, BOSS_KAMMER: 0.66 };
```
`tools/smoke_test.mjs:2012`:
```js
    check(`§36 ${name}: Ambient == ${AMBIENT[name]}`, Math.abs(def.ambient - AMBIENT[name]) < 1e-9, `ist ${def.ambient}`);
```
Dazu zwei Kommentarzeilen, die den Wert nennen und bei einer Änderung mitgezogen werden müssten: `:1975` (`… Ambient-Werte exakt 0.45/0.78/0.85/0.66`) und `:1994-1995`.

**B) `.tmp/check_main_slice1.mjs` — 5 Zeilen (kanonischer Flusstest, 25 Assertions)**
```
202: ok(Math.abs(ambientAlpha() - 0.45) < 1e-9, `Friedhof: ambient 0.45 (ist ${ambientAlpha()})`);
229: ok(Math.abs(ambientAlpha() - 0.78) < 1e-9, `Katakomben geladen: ambient 0.78 (ist ${ambientAlpha()})`);
236: ok(Math.abs(ambientAlpha() - 0.78) < 1e-9 && fadeAlpha() === null, 'kein Portal-Ping-Pong am Spawn');
246: ok(Math.abs(ambientAlpha() - 0.45) < 1e-9, `zurück auf dem Friedhof: ambient 0.45 (ist ${ambientAlpha()})`);
283: ok(Math.abs(ambientAlpha() - 0.45) < 1e-9, 'Respawn: auf der aktuellen Map (GRAVEYARD, ambient 0.45)');
```

**C) `.tmp/check_boss_slice3.mjs` — 8 Zeilen (kanonischer Flusstest, 33 Assertions)**
```
143: ok(Math.abs(ambientAlpha() - 0.66) < 1e-9, `?map=BOSS_KAMMER: ambient 0.66 (ist ${ambientAlpha()})`);
157: ok(Math.abs(ambientAlpha() - 0.85) < 1e-9,
165: ok(Math.abs(ambientAlpha() - 0.85) < 1e-9, 'ohne Schluessel bleibt der Spieler in der FLUESTERGRUFT');
172: ok(Math.abs(ambientAlpha() - 0.66) < 1e-9, `mit Schluessel: Uebergang in die BOSS_KAMMER (ambient ${ambientAlpha()})`);
185: ok(Math.abs(ambientAlpha() - 0.66) < 1e-9 && hasText('VERSIEGELT'),
244: ok(Math.abs(ambientAlpha() - 0.66) < 1e-9 && curBoss() && curBoss().state === 'idle',
264: ok(Math.abs(ambientAlpha() - 0.66) < 1e-9, 'Respawn in der BOSS_KAMMER (kein Titel/Reset)');
277: ok(Math.abs(ambientAlpha() - 0.85) < 1e-9,
```
(Bei `:157` und `:277` steht der Wert zusätzlich im Meldungs-String der FOLGEzeile `:158` bzw. `:278` — `ambient ${ambientAlpha()}`, also interpoliert, kein Literal.)

**Summe: 13 Zeilen** — exakt die Zahl aus `design/SPEC_GRAFIKPASS_4.md:33`: *"Ambient-Werte 0.45/0.78/0.85/0.66 EINGEFROREN (GP3-Kontingent verbraucht; §36 + 13 Flusstest-Zeilen). Keine Ausnahme."*

**Der Detektor** (identisch in beiden Flusstests, `check_main_slice1.mjs:154-157`):
```js
function ambientAlpha() {
  const f = ops.find((o) => o.op === 'fillRect' && o.canvas !== mainCanvas && o.alpha > 0 && o.alpha < 1);
  return f ? f.alpha : null;
}
```
Er liest das ERSTE Teilalpha-`fillRect` auf einem Nicht-Main-Canvas — das ist `lighting.js:138`. Bindende Auflage aus `design/SPEC_GRAFIKPASS_5.md:29-31`: *"ambientAlpha-Detektor: lighting.js:66 bleibt der EINZIGE Teilalpha-fillRect auf einem Nicht-Main-Canvas."* (Zeilennummer inzwischen 138.) **Jeder GP6-Renderer-Umbau, der ein weiteres Teilalpha-`fillRect` auf einem Offscreen erzeugt — z. B. eine Bayer-/Quantisierungs-Kachel für Hebel 1 —, bricht diese 13 Zeilen, ohne dass ein Ambient-Wert angefasst wurde.** Das ist die versteckte Kopplung zwischen Hebel 1 und Hebel 2.

### 2.2 Was NICHT bindet (geprüft, damit die Spec nicht überreguliert)

| Stelle | Warum unkritisch |
|---|---|
| `.tmp/check_lighting_input_slice1.mjs:57` (`… f[1] - 0.82 …`) | 0.82 ist ein SYNTHETISCH injizierter Wert: `.tmp/check_lighting_input_slice1.mjs:51` ruft `lighting.draw(ctx, cam, lights, 0.82, i * 0.016)` direkt auf. Keine Map-Bindung. |
| `.tmp/check_inventory_slice2.mjs:130 / 226 / 227` (`0.6`) | injizierte TESTMAP (`ambient: 0.6,` in der Test-eigenen Map-Definition). Keine Map-Bindung. |
| `.tmp/check_world_slice1.mjs:59` | reine Typ-/Bereichsprüfung `m.ambient >= 0 && m.ambient <= 1`. |
| `.tmp/debug_victory_trace.mjs:242/243/302`, `.tmp/debug_victory_nospawns.mjs:245/246/305` (`0.82`) | **tote Wegwerf-Skripte** aus Slice 1 (Kopfkommentar `debug_victory_trace.mjs:1`: *"Wegwerf-Check (Builder B, Slice 1)"*). Sie tragen noch den PRE-GP3-Wert 0.82 und könnten seit GP3 gar nicht mehr grün sein. Kanonisch sind laut `design/SPEC_GRAFIKPASS_5.md:27` ausschließlich `check_main` / `check_inventory` / `check_boss`. **Nicht mit sanktionieren, nicht anfassen.** |
| `ambientTint`-Werte | keinerlei Testbindung (grep). |

### 2.3 Ausgangslage verifiziert (heute nachgefahren)

```
node .tmp/check_main_slice1.mjs    -> CHECK GRÜN (25 Assertions)
node .tmp/check_boss_slice3.mjs    -> CHECK GRÜN (33 Assertions)
node .tmp/check_inventory_slice2.mjs -> CHECK GRÜN (25 Assertions)
```

### 2.4 Wie die GP3-Sanktionierung ablief (das zu kopierende Muster)

1. **Sanktionierung entsteht in der SPEC, nicht im Build.** `design/SPEC_GRAFIKPASS_3.md:274` trägt einen eigenen, benannten Abschnitt: `### 5.1 Flusstests — GENAU SIEBEN Wert-Anpassungen, sonst NICHTS`.
2. **Datei + ungefähre Zeile + Alt-Wert → Neu-Wert einzeln aufgezählt**, `SPEC_GRAFIKPASS_3.md:276-280`:
   ```
   - .tmp/check_main_slice1.mjs Zeile ~229 und ~236: `0.82` → `0.78` (2 Zeilen).
   - .tmp/check_boss_slice3.mjs Zeilen ~143, ~172, ~185, ~244, ~264: `0.7` → `0.66` (5 Zeilen).
   ```
3. **Der Änderungsumfang PRO Zeile wird ausdrücklich geregelt** (`:281-284`): *"PRO ZEILE dürfen BEIDE Wert-Vorkommen angepasst werden (Assertion-Literal UND der Wert im Meldungs-String derselben Zeile — sonst meldete der grüne Test irreführend 'ambient 0.82'; Review-Minor). Assertion-Struktur und alles Übrige bleiben byte-identisch."*
4. **Explizite Null-Erlaubnisse als Gegengewicht** (`:284-286`): *"check_inventory_slice2.mjs: NULL Änderungen. Es werden KEINE Stub-Methoden ergänzt — §2.5/§2.6 sind absichtlich fillRect-only, damit die Stubs unverändert tragen."*
5. **Der Smoke-Wächter wird im selben Zug NEU angelegt statt aufgeweicht** (`:305-311`, Abschnitt 36): Solidity-/Geo-Golden-Hashes + `Ambient-Werte exakt 0.45/0.78/0.85/0.66`. Der Kommentarkopf `tools/smoke_test.mjs:1975-1976` nennt sie *"die EINZIGEN erlaubten Zahlaenderungen, §4.2"*.
6. **Datei-Besitz namentlich**, `SPEC_GRAFIKPASS_3.md:358`: `… tools/smoke_test.mjs, …, die 7 Flusstest-Zeilen (§5.1)` liegen beim **Engine-Builder**; grün machen ist Sache des **Integrators** (`:272` "Besitz: Engine-Builder; Integrator macht grün").
7. **Abnahme per git-diff-Beweis**, `SPEC_GRAFIKPASS_3.md:394`: *"Flusstests grün mit GENAU den 7 Zeilen-Anpassungen aus §5.1 (git diff …)"* — bestätigt in `uebergaben/2026-07-12_grafikpass3.md:8-11` ("On-Disk belegt").
8. **Kontingent-Verfall wird in der Übergabe festgeschrieben**, `uebergaben/2026-07-12_grafikpass3.md:68-70`: *"Die 7 Flusstest-Ambient-Zeilen sind verbraucht; weitere Ambient-Änderungen brauchen wieder eine Spec mit sanktionierten Alt-Test-Änderungen."* Der Workflow spiegelt das in einer Zeile: `workflows/GRAFIKPASS_3.md:37-39`.

### 2.5 Was für eine NEUE sanktionierte Runde in GP6 analog zu tun ist

1. **Eigener Spec-Abschnitt** `§X.1 Flusstests — GENAU N Wert-Anpassungen, sonst NICHTS` mit der Zeilenliste aus §2.1 oben, gefiltert auf die Karten, deren Wert sich wirklich ändert. Obergrenze bei einer Änderung ALLER vier Karten: **13 Zeilen** (5 in `check_main_slice1.mjs`, 8 in `check_boss_slice3.mjs`) + `tools/smoke_test.mjs:1996` (die `AMBIENT`-Konstante) + die zwei Kommentarzeilen `:1975`/`:1994-1995`.
2. **Die Pro-Zeile-Klausel wörtlich übernehmen** (Literal + Meldungs-String derselben Zeile, sonst byte-identisch). Achtung Abweichung zu GP3: bei `check_boss_slice3.mjs:157/277` müsste zusätzlich **die Folgezeile** `:158`/`:278` erfasst werden, falls dort ein Literal stünde — steht dort nicht (interpoliert), also **nicht sanktionieren**; das explizit hinschreiben, sonst ändert ein Builder sie „vorsorglich".
3. **Null-Erlaubnisse mit-benennen**: `check_inventory_slice2.mjs` = 0 Änderungen; keine Stub-Erweiterung; `.tmp/debug_victory_*.mjs` sind tot und bleiben unangetastet; `ambientTint` braucht überhaupt keine Sanktion.
4. **Detektor-Klausel erneuern** (die eigentliche Falle für GP6): `lighting.js:138` bleibt das EINZIGE Teilalpha-`fillRect` auf einem Nicht-Main-Canvas. Wenn Hebel 1 (Licht-Quantisierung) Offscreen-Passes ergänzt, dann **rgba-fillStyle bei `globalAlpha = 1`** — genau so, wie GP5 es für die Glow-Ringe gelöst hat (`lighting.js:36-40`).
5. **Smoke §36 anpassen statt entschärfen**: `AMBIENT` auf die neuen Zielwerte setzen; Solidity-/Geo-Golden-Hashes (`smoke_test.mjs:1980-1983`) bleiben **byte-eingefroren** — sie sind der Beweis, dass ein Belichtungspass gameplay-neutral ist.
6. **Besitz + Abnahme**: eine Datei = ein Agent; git-diff-Beweis über den Pass; Übergabe schreibt fest, ob das Kontingent erneut als verbraucht gilt.
7. **Messziel-Abnahme (neu ggü. GP3)**: Ziel-Median/-Perzentile pro Karte in die Spec, und das Messwerkzeug (`.tmp/gp6_belichtung_messung.py`, siehe §3) als Gate. Die GP5-Mess-Disziplin gilt (`uebergaben/2026-08-07_grafikpass5.md:56-60`): Juror-eigene Metrik, validierte Fenster, Positiv-/Negativkontrolle, Modus über mehrere Läufe.

---

## 3. MESSUNG — IST-Belichtung

**Werkzeuge (neu, in `.tmp/`):**
- `/home/coder/Grimlight/.tmp/gp6_belichtung_messung.py` — Haupt-Messung + Ambient-Sweep
- `/home/coder/Grimlight/.tmp/gp6_belichtung_tonzensus.py` — Ton-Zensus
- Rohdaten: `/home/coder/Grimlight/.tmp/gp6_belichtung_ist.json`, `/home/coder/Grimlight/.tmp/gp6_belichtung_tonzensus.json`
- Bilder: `/home/coder/Grimlight/.tmp/screenshots/gp6_ist_*.png` (je `_4x.png` als 6×-taugliche NEAREST-Vergrößerung, `_amb040`/`_amb000` = Sweep-Belege, `_palette_pur` = ambient 0 + Vignette aus)

**Methode.** Playwright-venv-Muster und Modul-Wrapper übernommen aus `.tmp/shot_gfx5.py` (Route-Interception; **Spieldateien unangetastet**, der Ambient-Override lebt im `.tmp`-Wrapper). Server `.tmp/serve8124.py` (Port 8124), danach gestoppt. Gemessen wird der **Canvas-Backing-Store 320×180** via `toDataURL` — also die internen Pixel, nicht der hochskalierte Bildschirm. Bild eingefroren (`__timeScale = 0`), Welt geräumt (Gegner/Props/Drops), Kamera ganzzahlig. Kameras **identisch zu den GP5-Jury-Szenen** (`shot_gfx5.py:1210` / `:1806` / `:1898` / `:2050` / `:2287`) — damit ist die Messung direkt mit dem Juror-Befund vergleichbar.

**Luminanz** L = 0.299R + 0.587G + 0.114B (Rec. 601). Das ist die projekt-eigene Kennzahl: die Palettenkommentare in `game/js/art/palette.js:83-85` rechnen exakt so (`w 31,4 | A 114,1 | D 156,8` — nachgerechnet und bestätigt).

**HUD-Maske** (3712 von 57600 px = 6,4 %), Koordinaten aus `game/js/ui/hud.js`:
- Panel `hud.js:55` `const px = 2, py = 2, pw = 54, ph = 40;` + 1-px-Schlagschatten `hud.js:60/61` → x 2..56, y 2..42 (Herzen/GOLD/Trank/XP-Balken `hud.js:179` liegen darin)
- Boss-Balken `hud.js:240` `const bx = 120, by = 7, bw = 80, bh = 12;` → x 120..199, y 7..18 (auf **allen** Karten maskiert, sonst wären die Karten nicht vergleichbar)
- Item-Box `hud.js:318` `ctx.fillRect(296, 4, 20, 20);` → x 296..315, y 4..23
- je +1 px Sicherheitsrand. Touch-Overlay und `GOTT`-Text erscheinen nicht (Desktop, kein `?god=1`).

### 3.1 IST-Tabelle (Auslieferungszustand, `ambient` wie in den Map-Dateien)

| Szene (Karte) | ambient | P5 | P25 | **Median** | P75 | P95 | Mittel | **% > L128** | % > L64 | % < L16 |
|---|---|---|---|---|---|---|---|---|---|---|
| graveyard_teich (GRAVEYARD) | 0.45 | 17,0 | 19,8 | **24,9** | 42,4 | 60,6 | 31,9 | **0,15** | 3,52 | 3,00 |
| graveyard_wald (GRAVEYARD) | 0.45 | 16,6 | 22,2 | **22,7** | 35,5 | 55,9 | 30,3 | **0,08** | 2,23 | 4,61 |
| catacombs (CATACOMBS) | 0.78 | 13,3 | 26,7 | **38,9** | 55,3 | 103,4 | 45,1 | **1,56** | 18,93 | 10,03 |
| fluestergruft (FLUESTERGRUFT) | 0.85 | 12,7 | 17,1 | **27,8** | 39,4 | 77,9 | 33,3 | **0,74** | 8,62 | 17,96 |
| boss_kammer (BOSS_KAMMER) | 0.66 | 15,6 | 29,9 | **37,7** | 43,8 | 87,0 | 41,0 | **1,06** | 10,43 | 5,54 |

0 Konsolenfehler.

**Der Juror-Befund ist exakt reproduziert:** `design/GP5_RUNDE2_JURY.md:65` sagt *"Außen-Median L 22-27, <0,5 % Pixel über L 128"* — gemessen **22,7 und 24,9** bei **0,08 % / 0,15 %** über L128. Die Messmethode ist damit validiert.

Zweitbefund, in der Eskalation nicht genannt: **die FLUESTERGRUFT ist mit Median 27,8 und 17,96 % Pixeln unter L16 das dunkelste Bild des Spiels** — dunkler als die Katakomben. Sie gehört mit in den Hebel.

### 3.2 Ambient-Sweep — was der Sockel-Hebel ALLEIN leisten kann

Median L bei künstlich übersteuertem `ambient` (Vignette an, Palette unverändert):

| Szene | IST | 0.60 | 0.50 | 0.45 | 0.40 | 0.30 | 0.20 | 0.10 | **0.00 (Decke)** |
|---|---|---|---|---|---|---|---|---|---|
| graveyard_teich (IST 0.45) | 24,9 | – | – | – | 25,0 | 26,6 | 28,8 | 30,0 | **31,9** |
| graveyard_wald (IST 0.45) | 22,7 | – | – | – | 23,4 | 25,5 | 27,4 | 29,4 | **31,9** |
| catacombs (IST 0.78) | 38,9 | 40,8 | 41,6 | 42,1 | 42,6 | 43,6 | 44,6 | 45,0 | **45,7** |
| fluestergruft (IST 0.85) | 27,8 | 32,5 | 35,1 | 36,0 | 37,1 | 38,7 | 40,3 | 42,9 | **45,7** |
| boss_kammer (IST 0.66) | 37,7 | 38,4 | 39,5 | 40,2 | 40,9 | 41,6 | 43,0 | 44,7 | **45,7** |

### 3.3 Vignetten-Anteil und Paletten-Decke

| Szene | IST | IST ohne Vignette | ambient 0 (Vign. an) | **ambient 0 + Vign. aus = reine Palette** |
|---|---|---|---|---|
| graveyard_teich | 24,9 (< L16: 3,00 %) | 25,5 (1,01 %) | 31,9 | **31,9** (P25 31,9 · < L16: 0,00 %) |
| graveyard_wald | 22,7 (4,61 %) | 24,0 (2,10 %) | 31,9 | **31,9** (P25 31,9 · 0,00 %) |
| catacombs | 38,9 (10,03 %) | 40,6 (7,48 %) | 45,7 | **45,7** (P25 45,7 · 0,00 %) |
| fluestergruft | 27,8 (17,96 %) | 29,2 (10,62 %) | 45,7 | **45,7** (P25 45,7 · 0,00 %) |
| boss_kammer | 37,7 (5,54 %) | 38,5 (3,82 %) | 45,7 | **45,7** (P25 45,7 · 0,00 %) |

### 3.4 Ton-Zensus — warum die Decke genau dort liegt

Bei `ambient 0` + Vignette aus (Palettenfarben unverfälscht), HUD maskiert, Top-Töne:

| Szene | dominanter Ton | Anteil | L | zweit-/drittgrößte |
|---|---|---|---|---|
| graveyard_teich | `'e'` `#19241d` Gras-Basis | **49,15 %** | **31,9** | `a` 11,81 % (67,7) · `M` Weg 8,15 % (91,5) · **`w` Wasser-Tal 5,70 % (31,3)** |
| graveyard_wald | `'e'` | **45,52 %** | **31,9** | `M` 10,24 % · `E` 7,43 % (46,0) · **`w` 5,54 % (31,3)** |
| catacombs | `'t'` `#2a2e36` Stein-Basis | **43,29 %** | **45,7** | `k` 17,93 % (18,3) · `T` 12,09 % (73,4) · `L` 10,74 % (112,0) |
| fluestergruft | `'t'` | **45,30 %** | **45,7** | `k` 13,04 % · `T` 9,69 % · `L` 7,75 % · `w` 5,90 % |
| boss_kammer | `'t'` | **66,49 %** | **45,7** | `k` 8,49 % · `T` 6,84 % · `L` 5,97 % |

**Der Median IST der Boden-Grundton.** `'e'` = 31,9 draußen, `'t'` = 45,7 drinnen — genau die gemessenen Decken. Der Median hat keinerlei Spielraum nach oben, weil ein einzelner Ton 43–66 % der Fläche stellt.

**Modell-Gegenprobe (GRAVEYARD):** Median(a) = 31,91 − 20,32·a (aus L(`e`)=31,91, L(Tint `#0a0a18`)=11,60). Vorhersage a=0.45 → 22,77; **gemessen 22,7**. a=0.30 → 25,82; gemessen 25,5. a=0 → 31,91; gemessen 31,9. Abweichungen ≤ 0,4 L (Vignette + Fackelkegel). Das Modell trägt für die Spec-Rechnung.

---

## 4. Einschätzung: Wieviel kann `ambient` allein, wo muss die Palette ran

### 4.1 Die harte Zahl

**Der Weg 22 → 40 ist über den Ambient-Wert allein NICHT erreichbar — bei keinem Wert, auch nicht bei `ambient = 0`.** Denn `ambient` blendet linear gegen den (dunkleren) Tint; sein Grenzwert ist die Palette, und die liegt draußen bei **31,9**.

| Weg-Anteil 22,7 → 40,0 (Δ = 17,3 L) | Ambient-Beitrag | Rest für die Palette |
|---|---|---|
| `ambient` 0.45 → 0.30 (moderat) | +3,1 L | **18 %** | 82 % |
| `ambient` 0.45 → 0.20 (aggressiv) | +5,1 L | **29 %** | 71 % |
| `ambient` 0.45 → 0.00 (Nacht abgeschafft) | +9,2 L | **53 %** | 47 % |
| zusätzlich Vignette aus | +1,3 L | +8 % | – |

**Fazit: Der Ambient-Sockel liefert draußen realistisch 18–30 % des Weges, im Maximum (unter Aufgabe der Nachtstimmung) 53 %. Der Rest MUSS aus dem Boden-Grundton kommen.** Das ist auch der Grund, warum GP3 mit 7 Test-Zeilen nur ~1 L bewegt hat (0.82 → 0.78 in den Katakomben = +0,8 L) — das Kontingent wurde für einen Hebel verbraucht, der die Belichtungsfrage strukturell gar nicht lösen kann.

### 4.2 Was die Palette liefern muss (`ambient` als freie Variable)

Erforderliche Luminanz des Gras-Grundtons `'e'` für Ziel-Median 40, aus L_basis = (40 − 11,60·a)/(1 − a):

| ambient bleibt bei | nötige L(`e`) | heute 31,9 → | Faktor |
|---|---|---|---|
| 0.45 (unverändert) | **63,2** | +31,3 | 1,98× |
| 0.40 | 58,9 | +27,0 | 1,85× |
| 0.30 | 52,2 | +20,3 | 1,63× |
| **0.25** | **49,5** | +17,6 | 1,55× |
| **0.20** | **47,1** | +15,2 | 1,48× |
| 0.10 | 43,2 | +11,2 | 1,35× |
| 0.00 | 40,0 | +8,1 | 1,25× |

**Empfohlener Arbeitspunkt für die Spec: `ambient` 0.45 → ~0.20-0.25 UND Gras-Grundton auf L ≈ 47-50.** Zum Vergleich: L 46,0 ist heute `'E'` (`#253522`, „Gras dunkel"). Der neue Grundton entspricht also ungefähr der HEUTIGEN zweiten Stufe — die ganze Gras-Rampe rutscht um eine Stufe hoch und braucht oben eine neue.

Für die Innenräume ist der Befund entspannter: `'t'` = 45,7 liegt schon fast bei 40 nach Render. Katakomben (38,9) und Bosskammer (37,7) erreichen 40+ **allein** über `ambient` (0.78 → ~0.55 bzw. 0.66 → ~0.45). **Nur die FLUESTERGRUFT braucht `ambient` ≤ 0.20**, um 40 zu erreichen — und verliert damit ihre Rolle als „dunkelste Ebene" (`map_fluestergruft.js:160`). Hier ist eher ein Palette-Plus auf `'t'` + `extraLights` (testfrei!) im Kanalraum der bessere Weg als ein Ambient-Kahlschlag.

### 4.3 Die Wertehierarchie-Falle (GP5-Errungenschaft in Gefahr)

Das ist der kritischste Punkt für die Spec.

- Gras-Grundton `'e'` = **31,9** · Wasser-Wellental `'w'` `#162325` = **31,3**. Die beiden liegen 0,6 L auseinander — **absichtlich**. `palette.js:87-90` wörtlich:
  > *"HUE: die Rampe ist um einen Hauch KUEHLER gesetzt … weil 'w' durch die Anhebung sonst fast deckungsgleich mit dem Gras-Grundton 'e' (#19241d, Luminanz 31,9) waere und der Teich als Wiese laese. Jetzt: w (22,35,37) gegen e (25,36,29) — gleiche Helligkeit, klar kuehlerer Farbort."*
- Flächenanteile draußen (§3.4): Gras `'e'` 45-49 %, Wasser `'w'` 5,5-5,7 %. **Wird `'e'` auf 47 gehoben und die Wasser-Rampe nicht mitgezogen, ist Wasser sofort wieder die dunkelste Großfläche** — genau der GP5-R3-Befund, der als „messtechnisch bestätigt geliefert" abgenommen wurde (`uebergaben/2026-08-07_grafikpass5.md:20`).

**Die Wasser-Rampe muss im Gleichschritt mit.** Sie steht heute auf `w 31,3 → W 45,7 → 9 60,0 → '=' 74,3` (gleichmäßige Schritte ~14,3; `palette.js:78-82`) mit drei bindenden Auflagen:
1. **Kamm : Tal ≈ 2,3 : 1** (`palette.js:76-79`) — heute 74,3/31,3 = 2,37.
2. **Kein Wasserpixel gesättigter als das hellste Gras `'A'`** (S = 0,4216; `palette.js:91-93`) — bei reiner Luminanz-Anhebung unter Hue-Erhalt bleibt S konstant, also unkritisch.
3. **Kein Wasserpixel darf hellster Ton im Frame werden** (GP3-R3-Auflage, `palette.js:180-182`): `'='` < `'A'` (114,1) < `'D'` (156,8).

Rechnung: `'w'` auf 47 (gleichauf mit dem neuen `'e'`, kühlerer Farbort erhalten) → `'='` = 2,3 · 47 ≈ **108**. Das passt nur, solange `'A'` ≥ ~114 bleibt.

**Daraus folgt die Konstruktionsvorschrift für den Paletten-Teil (Empfehlung an die Spec): Schwarzpunkt anheben, Weißpunkt HALTEN — also eine Offset-/Kompressions-Operation, kein Skalieren.**
- Variante „Offset" (Kontrast erhalten): gesamte Gras-Rampe +15,1 L → `e 47,0 · E 61,1 · a 82,8 · m 104,5 · K 111,2 · A 129,2`. `'A'` bleibt mit 129 unter `'D'` (156,8) ✓, `'='` 108 bleibt unter `'A'` ✓, Rampen-Abstände unverändert ✓. Der Preis: das Gras-Spitzlicht wird deutlich heller — das muss die Jury im Bild abnehmen.
- Variante „Kompression" (Weißpunkt fix bei A = 114): `e 47,0 · E 58,5 · a 76,2 · m 93,8 · K 99,4 · A 114,1`. Der Ton-Umfang der Gras-Rampe schrumpft von 82 auf 67 L (−18 %) — das Gras wird flacher, was direkt gegen die Jury-Kritik „Steppdecke / Kachelmittel-Streuung" arbeitet (`uebergaben/2026-08-07_grafikpass5.md:45`).

**Empfehlung: Offset-Variante, mit `'D'` als hartem Deckel.** Die Dunkeltöne `k` 18,3, `n` 30,9, `0` 21,8, `*` 26,6, `+` 35,5 bleiben dabei bewusst UNTEN — dadurch wächst der Umriss-/Silhouetten-Kontrast, was dem Pixel-Look nützt und dem Hebel-1-Ziel (Licht-Quantisierung) in die Hände spielt.

### 4.4 Nebenbefund für das zweite Messziel

Der Juror nennt zwei Zahlen; die zweite wird meist übersehen: **„< 0,5 % Pixel über L 128"**. Gemessen draußen 0,08–0,15 %. Selbst bei `ambient = 0` **und** Vignette aus steigt der Anteil nur auf 0,45–0,47 % — **auch dieses Ziel ist über den Sockel prinzipiell unerreichbar**. Es braucht Spitzlichter (Specular-Texel, Kanten, `A`/`D`-Anteile), also wieder Palette und Kachel-Arbeit, nicht Belichtung. In der Spec sollten Median und Highlight-Anteil deshalb als **zwei getrennte Messziele mit getrennten Hebeln** stehen.

### 4.5 Kürzester Weg zum Ziel (Vorschlag für die Spec-Struktur)

| Hebel | Testkosten | Wirkung außen (Median) |
|---|---|---|
| `ambient` 0.45 → 0.20-0.25 | **13 sanktionierte Zeilen + smoke §36** | +4,1 … +5,1 |
| Vignette entschärfen (`hud.js:460` `VIG_STEP`/Profil) | **0** (testfrei) | +1,3 (und < L16 halbiert sich) |
| `ambientTint` heller/wärmer (`maps.js:539` etc.) | **0** (testfrei) | +0,5 … +1,5 je nach Tint-Luminanz |
| `extraLights` auf GRAVEYARD/FLUESTERGRUFT (Muster `map_bosskammer.js:99`) | **0** (testfrei, additiv) | lokal, hebt P5/P25 |
| **Boden-Grundtöne `'e'`/`'t'` + Rampen + Wasser-Rampe im Gleichschritt** | **0** (Palette ist nicht ambient-testgebunden; `check_gfx5_art.mjs` friert allerdings `'='` in `NEW_TONES` ein — Art-Besitz, mitzuziehen) | **+8 … +15 — der eigentliche Hebel** |

Bemerkenswert: **vier der fünf Hebel kosten null Testzeilen.** Nur der Ambient-Wert selbst braucht die sanktionierte Runde — und er ist der schwächste von allen. Wenn Michael die Testrunde scheut, kommt man mit Palette + Vignette + Tint + `extraLights` auf ~85 % des Weges, ohne eine einzige Testzeile anzufassen.


---

# TEIL 3: Hebel 3 — Entity-Rendering, Schatten, Sprite-Beleuchtung


# GP6-Landkarte: Entity-Rendering + Schattenpfad (Hebel 3)

Stand HEAD `7e1d86d`, keine Spieldatei verändert (`git status` sauber). Zwei Messskripte neu in `.tmp/`: `/home/coder/Grimlight/.tmp/gp6_probe_playershadow.py` (Pixel-Diff der g5_10-Aufnahmen) und `/home/coder/Grimlight/.tmp/gp6_shadow_coverage.mjs` (Verdeckungsrechnung je Entity). Die drei kanonischen Flusstests sind als Baseline grün gelaufen (25 / 25 / 33 Assertions).

---

## 1. Der Renderpfad, Datei:Zeile-Kette

### 1.1 Boot und Sprite-Bau (einmalig, Importzeit)

| Schritt | Ort |
|---|---|
| `const gfx = buildAll(SPRITES, PALETTE)` | `game/js/main.js:50` |
| Flip-Varianten `${key}_flip` aus fester Liste | `game/js/main.js:55-70` |
| `const tiles = buildAll(TILE_ART, PALETTE)` | `game/js/main.js:71` |
| `buildSprite` / `buildAll` (Text-Grid nach Canvas) | `game/js/core/sprite_factory.js:4-25` / `27-33` |
| `import './entities/boss.js'` (registriert kind `graveward`) | `game/js/main.js:15` |

### 1.2 Frame: `createLoop({update, render}).start()` (`main.js:750`, Loop in `core/loop.js:9-45`)

`render()` (`main.js:721-748`) füllt Schwarz, verzweigt auf `title`, sonst `drawWorld()` (`main.js:597-719`). Die bindende Reihenfolge steht als Kommentar in `main.js:472-475`. Real gezeichnet wird:

| # | Was | main.js |
|---|---|---|
| 1 | `map.draw(..., 'ground')` (Boden inkl. Fringes) | `:598` (Impl. `world/tilemap.js:878-1000`) |
| 2 | Lit-Dither-Pass, `lighter`, 3-arg drawImage, nur `LIT_FLOOR_MAPS` | `:605-627` |
| 3 | Wasser-Reflexionen, `lighter`, 3-arg drawImage | `:636-652` |
| 4 | `drawMarkers()` (Boss-Boden-Telegraphen, prozedural) | `:654`, Impl. `:481-519` |
| 5 | **`drawSoftShadow(player)`; für jeden Gegner; für jeden Prop** | **`:658-660`** |
| 6 | **Y-sortierte `renderables`-Schleife** | `:665-672` |
| 7 | Level-Up-Ring über dem Spieler | `:675-684` |
| 8 | `map.draw(..., 'over')` (Kronen ÜBER den Entities) | `:686` |
| 9 | `drawFog` | `:687` |
| 10 | `frameLights` bauen (statisch + Selten-Drops + Eliten + `extraLights`) | `:691-707` |
| 11 | **`lighting.draw(...)`** (Dunkel-Overlay + additiver Warm-Pass) | `:709` |
| 12 | `particles.draw` (Funken NACH dem Overlay) | `:715` |
| 13 | Vignette, HUD, Toast | `:716-718` |

Wichtig für Hebel 3: **Punkt 11 kommt nach Punkt 6.** Das Licht-Overlay legt sich pauschal über Boden UND Sprites, es "beleuchtet" das Sprite also nicht, es dunkelt es genauso ab wie den Boden darunter. Genau das ist die Jury-Beobachtung "Figuren bleiben neben Fackeln farblich tot": es gibt heute keinen einzigen Codepfad, der einen Entity-Pixel anders behandelt als einen Bodenpixel.

### 1.3 Y-Sortierung (main.js:662-672, wörtlich)

```js
  const renderables = [];
  drops.forEach((d, i) => renderables.push({ fy: d.y + d.h, draw: () => drawDrop(ctx, camera, d, i, gfx, timeSec) }));
  for (const p of props) renderables.push({ fy: p.y + p.h, draw: () => drawProp(ctx, camera, p, gfx, timeSec) });
  for (const e of enemies) renderables.push({ fy: e.y + e.h, draw: () => drawEnemy(ctx, camera, e, gfx, timeSec) });
  for (const p of projectiles.list) renderables.push({ fy: p.y + p.h, draw: () => drawProjectile(ctx, camera, p, gfx, timeSec) });
  renderables.push({ fy: player.y + player.h, draw: () => player.draw(ctx, camera, gfx, timeSec) });
  renderables.sort((a, b) => a.fy - b.fy);
  for (const r of renderables) r.draw();
```

Sortierschlüssel ist die AABB-Fußkante `y + h`. `Array.sort` ist stabil, der Spieler wird zuletzt gepusht und liegt bei Gleichstand oben.

### 1.4 Zeichner-Dispatch bis zum Sprite

- `drawEnemy(ctx, cam, e, gfx, timeSec)` in `entities/enemies.js:610-676`. Erste Zeile: `const drawer = DRAWERS[e.kind]; if (drawer) return drawer(...)` (`:612-613`).
- `DRAWERS = {}` in `enemies.js:433`, befüllt ausschließlich über `registerEnemyKind(kind, creator, behavior, drawer = null)` in `enemies.js:172-176`.
- Einziger Eintrag heute: `registerEnemyKind('graveward', createGraveward, updateGraveward, drawGraveward)` in `entities/boss.js:336`, Zeichner `boss.js:309-334`.
- Generischer Pfad baut den Key aus `e.kind` + Frame + `_flip` (`enemies.js:615-631`), zeichnet dann `enemies.js:637-641`.
- Spieler: `player.draw` in `entities/player.js:227-249`, Key aus `spriteKey()` `player.js:210-225`.
- Props: `props.js:123-139`. Drops: `enemies.js:699-720`. Projektile: `projectiles.js:190-197`.

### 1.5 Einheitliche Anker-Konvention (gilt für ALLE Entity-Zeichner)

Horizontal auf die AABB zentriert, Füße bündig auf der AABB-Unterkante, Größe aus dem Canvas gelesen:

```js
// player.js:236-240
ctx.drawImage(
  img,
  Math.round(player.x + (player.w - img.width) / 2 - cam.x),
  Math.round(player.y + player.h - img.height - cam.y)
);
```

Identisch in `enemies.js:637-641`, `boss.js:328-332`, `props.js:134-138`. Drops/Projektile zentrieren stattdessen auf das AABB-Zentrum (`enemies.js:704-708`, `projectiles.js:192-196`).

### 1.6 Befund mit hoher Hebelwirkung für §4

**Jeder Entity-Zeichner benutzt exakt EIN ctx-Member: `drawImage`, und zwar immer 3-argumentig.** Verifiziert per `grep -n "ctx\." entities/*.js`: 11 Treffer, alle `ctx.drawImage(`, keine einzige weitere Property, kein `save`/`restore`, kein `globalAlpha`, kein `fillStyle`. Der einzige 9-arg-`drawImage` im ganzen Projekt ist `ui/hud.js:142` (halbes Herz, Bestandspraxis, nicht im Entity-Pfad).

Konsequenz: Ein Fassaden-`ctx` um die `r.draw()`-Schleife in `main.js:672` kann jeden Sprite-Zeichenvorgang abfangen, ohne dass in `entities/` eine Zeile geändert wird. Details unter §4.

---

## 2. `drawSoftShadow`: Signatur, Empfängerkreis, und warum g5_10 leer aussah

### 2.1 Signatur und Profile (`main.js:545-595`)

```js
const SHADOW_W = [0.95, 0.7, 0.4];
const SHADOW_A = [0.40, 0.20, 0.10];
const SHADOW_DY = [0, 1, 2];          // Zeilen OBERHALB der Fusskante
const SHADOW_W_BIG = [0.90, 0.95, 0.85, 0.65, 0.40];
const SHADOW_A_BIG = [0.34, 0.44, 0.36, 0.24, 0.12];
const SHADOW_DY_BIG = [-1, 0, 1, 2, 3];               // -1 = UNTER der Fusskante
function drawSoftShadow(ent) {
  const big = ent.w >= 18 && ent.h >= 20;
  ...
  const cx = ent.x + ent.w / 2;
  const baseY = ent.y + ent.h - 1;
  ctx.save();
  ctx.fillStyle = '#000';
  for (let i = 0; i < ws.length; i++) {
    ctx.globalAlpha = as[i];
    const w = Math.max(1, Math.round(ent.w * ws[i]));
    ctx.fillRect(Math.round(cx - w / 2 - camera.x), Math.round(baseY - camera.y) - dys[i], w, 1);
  }
  ctx.restore();
}
```

Ein Parameter (`ent`), liest nur `ent.x/y/w/h`, greift auf `ctx` und `camera` als Modul-Closure zu. Reines `fillRect`, kein `ellipse`/`roundRect` (Stub-Grund, `main.js:536-538`).

### 2.2 Wer bekommt ihn (main.js:658-660)

**Alle drei Gruppen: Spieler, JEDER Gegner (inkl. Boss), JEDER Prop.** Es gibt keine Ausnahme und keinen fehlenden Aufruf. Die Dossier-Formulierung "Schatten-Abdeckung lückenhaft (Vasen ja, Spieler/Boss nein)" beschreibt die WIRKUNG, nicht den Aufruf. Für den Boss ist das seit GP5 R3 aktenkundig, siehe der Befundblock `main.js:549-579`.

Nebenbefunde, die in die Spec gehören:
- Der Schatten wird auch gezeichnet, wenn der Spieler wegen Unverwundbarkeit gerade unsichtbar blinkt (`player.js:229-231` kehrt vorzeitig zurück, `drawSoftShadow` läuft trotzdem). Der Schatten blinkt also gegenphasig allein.
- Auch zerbrechende Props (`state === 'break'`, Scherbensprite) behalten den vollen Schatten.
- Drops und Projektile bekommen KEINEN Schatten (stehen nicht in `:658-660`).

### 2.3 Warum der Spieler-Kontaktschatten in g5_10 per Pixel-Diff nicht auffindbar war

**Ursache: Er wird gezeichnet und liegt zu 100 % im Bounding-Box-Bereich des eigenen Sprites, weil `SHADOW_DY = [0,1,2]` ausschließlich Zeilen AUF und ÜBER der Fußkante belegt. Die GP4-Lehre "Zeilen überlappen nicht" trifft hier nicht zu, das Problem ist Sprite-Verdeckung.**

Geometrie der Szene (`.tmp/shot_gfx5.py:2850-2860`, Kamera aus `.tmp/g5_cams.json` = `{x:168, y:204}`, Scale 4):

- Standkachel (20,18), Spielerzentrum Welt (328,296), AABB 12x14 = (322,289)-(334,303).
- Sprite `player_down_0` ist 16x24 (`art/sprites.js:2`, Grid `:15-40`), gezeichnet bei Bildschirm (152,75), belegt also x 152..167, y 75..98.
- Schattenzeilen: `baseY = 302`, Bildschirm-y = `round(302-204) - dy` = **98, 97, 96**. Das sind exakt die Sprite-Zeilen 23, 22, 21. Breiten 11 / 8 / 5 px gegen 16 px Sprite-Breite.

Gemessen am echten PNG-Paar C/D (Spieler an/aus, Laub aus), `.tmp/gp6_probe_playershadow.py`:

```
y= 96 .......##########.........   <- alles innerhalb x152..167
y= 97 .......#########..........
y= 98 .......###########........
y= 99 ..........................   <- UNTER der Fusskante: NULL Differenz
```

Detail y=98 (Alpha 0,40): x155..158 und x159..160 sind Sprite-Pixel; **nur x161..165 sind echter Schatten**, C=(15,21,17) gegen D=(25,36,29). y=97: nur x159/160 mit C=(20,28,23), das ist rechnerisch exakt Schwarz bei Alpha 0,20 über (25,36,29). y=96: x159/160 mit Alpha 0,10.

**Ergebnis: 9 sichtbare Schatten-Texel insgesamt, davon 5 in einer Lücke rechts neben dem Fußcluster, 0 Texel unterhalb der Fußkante.** Für einen Juror, der auf einen Bodenkontakt unter der Figur schaut, ist das leer, und die 5 verbleibenden Texel lesen als Teil der Silhouette, nicht als Schatten.

### 2.4 Der Vergleich, der es beweisbar macht (`.tmp/gp6_shadow_coverage.mjs`)

Sichtbare Schatten-Texel = Profil-Texel minus die vom eigenen Sprite verdeckten:

| Entity | AABB | Sprite | Profil | sichtbar je Zeile | Summe | davon unter der Fußkante |
|---|---|---|---|---|---|---|
| Spieler idle/down | 12x14 | 16x24 | std(3) | 5/11@0,40 · 2/8@0,20 · 2/5@0,10 | **9** | **0** |
| Spieler walk/down | 12x14 | 16x24 | std(3) | 3/11 · 1/8 · 1/5 | **5** | **0** |
| Spieler side | 12x14 | 16x24 | std(3) | 7/11 · 5/8 · 4/5 | 16 | 0 |
| Skelett | 12x14 | 16x16 | std(3) | 5/11 · 2/8 · 1/5 | 8 | 0 |
| Ghul | 14x14 | 16x20 | std(3) | 5/13 · 2/10 · 1/6 | 8 | 0 |
| Rostpanzer | 14x16 | 16x18 | std(3) | 5/13 · 2/10 · 1/6 | 8 | 0 |
| Grufthund | 14x12 | 16x12 | std(3) | 13/13 · 3/10 · 3/6 | 19 | 0 |
| **BOSS Grabwächter** | 20x24 | 24x32 | **BIG(5)** | 18/18 · 14/19 · 10/17 · 6/13 · 1/8 | **49** | **18** |
| **Vase** | 12x12 | 16x16 | std(3) | **11/11 · 8/8** · 1/5 | **20** | 0 |
| Urne | 12x12 | 16x16 | std(3) | 11/11 · 8/8 · 0/5 | 19 | 0 |
| Truhe zu | 16x14 | 16x16 | std(3) | 15/15 · 11/11 · 6/6 | 32 | 0 |

**Die Asymmetrie ist rein grafisch, nicht logisch:** Vase/Urne/Truhe haben in ihren 16x16-Grids UNTEN LEERE ZEILEN (`sprites.js:698-700` Vase-Zeilen 14/15 sind komplett `'.'`), während der Spieler-Grid bündig bis Zeile 23 durchgezeichnet ist (`sprites.js:37-39`, Zeile 23 = `'...kkkknn.......'`). Deshalb ist der Vasen-Schatten von der Jury bestätigt und der Spieler-Schatten unauffindbar. Der Boss wurde in GP5 R3 gerettet, weil `ent.w >= 18 && ent.h >= 20` ihn ins BIG-Profil hebt und dort `dys[0] = -1` eine Zeile UNTER die Fußkante legt. Spieler (12x14), Skelett, Ghul, Hund, Rostpanzer fallen alle unter die Schwelle.

**Ableitung für die GP6-Spec:** Der Fix ist derselbe wie beim Boss, also mindestens eine Zeile mit `dy = -1` auch im Standardprofil, plus ein messbares Abnahmekriterium "sichtbare Schatten-Texel unterhalb der Fußkante >= N je Entity". Das lässt sich mit dem A/B/C/D-Verfahren aus `.tmp/shot_gfx5.py:2856-2932` und dem Coverage-Skript beidseitig belegen.

---

## 3. Lichtabfrage an Weltposition (x,y)

### 3.1 Exportiert lighting.js so etwas? NEIN.

`core/lighting.js` exportiert genau eine Funktion: `createLighting(viewW, viewH)` (`:102`), deren Rückgabe `{ draw }` ist (`:279`). Es gibt keine Abfrage, keinen Cache, keinen Zwischenwert. Der Lichtzustand existiert ausschließlich als Alpha-Kanal auf dem privaten Offscreen `off` (`:103-112`), und der wird per `ctx.drawImage(off, 0, 0)` (`:176`) verbraucht. Auslesen wäre `getImageData`, und das ist verboten (siehe §4.4).

Der nächstliegende Präzedenzfall ist `litDitherCells(lights, camera, timeSec, viewW, viewH, isLit)` in `world/tilemap.js:59-91`: eine REINE Funktion, die pro Kachel aus denselben Licht-Objekten eine 3-stufige Lichtklasse ableitet (`dist < r*0.40` = Stufe 2, `dist < r*0.70` = Stufe 1). Genau dieses Muster (pure Funktion + Node-Smoke-Test) trägt Hebel 1 und Hebel 3.

### 3.2 Der Wert ist rechnerisch exakt rekonstruierbar (pure Funktion machbar: JA)

Alle Eingaben sind Zahlen, die `main.js` ohnehin pro Frame in der Hand hat: `frameLights` (`main.js:691-707`), `mapDef.ambient`, `timeSec`, `mapDef.ambientTint`.

**Schritt 1, Flacker-Radius je Licht** (`lighting.js:145-149`, identisch in `tilemap.js:73-77`):
```js
const flicker = light.flicker || 0;
const wob = Math.sin(timeSec * 13 + light.x * 7) * 0.6
          + Math.sin(timeSec * 8.3 + light.y * 5 + light.x * 3) * 0.4;
const r = light.radius * (1 + flicker * 0.1 * wob);
```

**Schritt 2, Restdunkelheit eines Lichts.** `destination-out` ist multiplikativ (`dst *= (1-a)`), die Ringe sind konzentrisch, ein Pixel im Abstand `d` wird von allen Ringen mit `r*rf >= d` getroffen. Aus `PUNCH_RINGS` (`lighting.js:93-100`) plus dem Radius-Jitter `rWob = Math.sin(seed + k*2.399) * 0.02` mit `seed = light.x*0.7 + light.y*1.3`, innerster Ring ungejittert (`lighting.js:165-171`):

| Zone (Anteil von r) | kumulierte Restdunkelheit |
|---|---|
| 0,85 .. 1,00 | 0,820 |
| 0,70 .. 0,85 | 0,640 |
| 0,55 .. 0,70 | 0,461 |
| 0,40 .. 0,55 | 0,299 |
| 0,25 .. 0,40 | 0,150 |
| <= 0,25 | 0,000 |

Die Werte stimmen mit dem Kommentar `lighting.js:16-18` überein.

**Schritt 3, Kombination.** Der Offscreen startet auf `globalAlpha = ambient` (`lighting.js:136-138`) und jedes Licht multipliziert. Also:

```
overlayAlpha(x,y) = ambient * Π über alle Lichter  rest_l( dist(x,y,l) / r_l )
Lichtfaktor(x,y)  = 1 - overlayAlpha(x,y)          // 0 = stockdunkel, 1 = voll hell
```

Signaturvorschlag, exakt im Stil von `litDitherCells`, Node-testbar, ohne jedes Browser-Global:
```js
export function lightAt(lights, x, y, ambient, timeSec)   // -> 0..1
```

**Optional, für die Farbe statt nur der Helligkeit:** Der additive Warm-Pass (`lighting.js:193-271`) läuft nur für `flicker >= 0.8`, mit `gr = r * 0.48` und den Ringtabellen `GLOW_RINGS` (`:45-52`), `FLOOR_RINGS` (`:53-58`), `HOT_RINGS` (`:87-91`). Daraus lässt sich mit derselben Ringlogik ein zweiter Rückgabewert `warm` (0..1) bilden, mit dem das Sprite-Tinting die Fackel-Farbe (216,114,42) einmischen kann statt nur zu dimmen. Genau das adressiert "Figuren bleiben neben Fackeln FARBLICH tot". Empfehlung: `lightAt` liefert `{ f, warm }`.

Hinweis zur Kohärenz mit Hebel 1: Wenn GP6 den Lichtfaktor auf 10 bis 12 Stufen quantisiert, MUSS `lightAt` dieselbe Quantisierungsfunktion benutzen wie der Overlay-Pfad, sonst driften Boden- und Sprite-Beleuchtung auseinander. Eine gemeinsame `quantizeLight(f)` in `lighting.js` ist der saubere Schnitt.

### 3.3 Einhak-Punkt im Draw-Pfad

**Abtastpunkt (Fußpixel), identisch zum Schattenanker aus `main.js:585-586`:**
```js
const px = ent.x + ent.w / 2;
const py = ent.y + ent.h - 1;
```
Damit stehen Sprite-Beleuchtung und Kontaktschatten garantiert auf demselben Weltpunkt, was für die Glaubwürdigkeit entscheidend ist (Schatten dunkel, wo die Figur dunkel ist).

**Einhak-Stelle:** `main.js:672`, die Schleife `for (const r of renderables) r.draw();`. Der Lichtfaktor wird pro Renderable EINMAL vor `r.draw()` berechnet. Damit die Berechnung nicht dupliziert wird, sollte `renderables` beim Bauen (`main.js:665-670`) den Abtastpunkt gleich mitführen (`{ fy, ax, ay, draw }`).

Alternative, falls die Fassade aus §4.5 nicht gewollt ist: Signaturerweiterung der Zeichner um einen sechsten Parameter (`drawEnemy(ctx, cam, e, gfx, timeSec, light)`), rückwärtskompatibel per Default. Das berührt aber `entities/`, das in GP5 §0.10 Tabu war und für GP6 explizit freigegeben werden müsste.

---

## 4. Technik-Optionen fürs Tinting

### 4.1 Die Stub-Whitelist, wörtlich

`design/SPEC_GRAFIKPASS_4.md:35-42`:
> **Flusstests .tmp/check_\*.mjs: NULL Änderungen, keine Stub-Erweiterungen.** Methoden-Whitelist für neuen Render-Code: fillRect, drawImage, arc, fill, beginPath, save, restore, clearRect, createRadialGradient, fillText + Properties globalAlpha/globalCompositeOperation/fillStyle. VERBOTEN: getImageData, putImageData, ellipse, roundRect, createPattern, clip, moveTo/lineTo/rect/closePath, measureText, scale/transform/setTransform, strokeRect, translate, rotate.

`design/SPEC_GRAFIKPASS_5.md:36-38`:
> Canvas-Whitelist wie GP4; drawImage bei Licht/Overlays nur 3-Argument; Composite-Hygiene (expliziter Reset) nach jedem lighter/destination-out-Block.

Der tatsächliche Stub steht z.B. in `.tmp/check_boss_slice3.mjs:49-67` (`makeCtx`) und `:68-74` (`makeCanvas`, liefert `getContext`, `width`, `height`, `ownerDocument`). Da `drawImage(img, ...a)` variadisch protokolliert, würde ein 9-arg-Aufruf technisch nicht crashen, aber die 3-arg-Regel ist Spec und einige Leser filtern auf `args.length === 2` (`.tmp/check_main_slice1.mjs:164-167`).

Zwei weitere harte Wächter, die JEDE Tinting-Variante überleben muss:

**(A) ambientAlpha-Detektor** (`.tmp/check_main_slice1.mjs:154-155`, `.tmp/check_inventory_slice2.mjs:210-211`, `.tmp/check_boss_slice3.mjs:120-121`, identischer Wortlaut):
```js
const f = ops.find((o) => o.op === 'fillRect' && o.canvas !== mainCanvas && o.alpha > 0 && o.alpha < 1);
```
Es ist das ERSTE Vorkommen, das zählt. Jeder Tint-Bake auf einem Offscreen muss also mit `globalAlpha = 1` arbeiten (rgba-`fillStyle` ist erlaubt, siehe `SPEC_GRAFIKPASS_5.md:9-10`). `buildSprite` erfüllt das heute schon: es setzt nur `fillStyle` und nie `globalAlpha` (`sprite_factory.js:20-21`).

**(B) Canvas-nach-Sprite-Namensauflösung über die ERZEUGUNGSREIHENFOLGE** (`.tmp/check_main_slice1.mjs:100-106`, gleich in `.tmp/check_inventory_slice2.mjs:145-151`):
```js
const orderedNames = [ ...Object.keys(SPRITES), ...FLIP_LIST.map((k) => `${k}_flip`), ...Object.keys(TILE_ART) ];
const nameOf = new Map();
createdCanvases.forEach((c, i) => nameOf.set(c, orderedNames[i] || `extra_${i}`));
```
Die Map wird EINMAL direkt nach `await import('../game/js/main.js')` gebaut, vor dem ersten Frame. Und sie wird von den Assertions benutzt:
- `.tmp/check_main_slice1.mjs:127-129`: `playerScreen()` filtert `String(nameOf.get(o.img) || '').startsWith('player')`
- `.tmp/check_main_slice1.mjs:143`: `nearestSkeletonRel()` mit `/^skeleton_[01](_flip)?$/`
- `.tmp/check_main_slice1.mjs:164-167`: `heart_full` / `heart_empty`
- `.tmp/check_inventory_slice2.mjs:171-173`: `hasSprite(n)` über `drawnNames()`

**Daraus folgt die schärfste Nebenbedingung des ganzen Hebels: Wenn ein Zeichner statt `gfx['player_down_0']` ein GETÖNTES Ersatz-Canvas an `drawImage` übergibt, findet `nameOf` keinen Namen, `playerScreen()` liefert `null` und `check_main_slice1`/`check_inventory_slice2` gehen ROT.** Ein Sprite-Austausch ist damit nur möglich, wenn Michael eine sanktionierte Änderung dieser Flusstests freigibt (GP3-Muster). Die Alternative, die ohne Teständerung auskommt, steht in §4.5.

Randbedingung, die Luft lässt: Nur die Indizes 0..74 (`Object.keys(SPRITES)`, 75 Keys) sind heute korrekt ausgerichtet. Die `FLIP_LIST` in den Tests hat 12 Einträge, `main.js:55-68` erzeugt 31 Flips, ab Index 87 ist die Zuordnung ohnehin schon verschoben und wird von keiner Assertion benutzt. **Zusätzliche Canvases, die NACH `buildAll(TILE_ART, ...)` (`main.js:71`) oder lazy zur Laufzeit entstehen, landen hinter allen benannten Indizes und bekommen `extra_i`. Das ist unschädlich, solange sie nie als `img` an einen inspizierten `drawImage`-Aufruf gehen.**

### 4.2 Option (a): getönter Offscreen-Bake pro Sprite x quantisierter Lichtstufe

**Umsetzung:** `buildSprite(grid, palette, opts)` bekommt eine zweite Palettenabbildung, also `tintedPalette = mapPalette(PALETTE, stufe)`. Der Bake ist damit derselbe Code wie heute: `createElement` + `getContext` + `fillStyle` + `fillRect` (`sprite_factory.js:7-22`). Zusätzlicher Vorteil: die Tönung passiert im PALETTENRAUM (61 Farben), nicht im Pixelraum, ist also eine Rampen-Operation und damit exakt das, was der SNES-Look verlangt (keine Airbrush-Interpolation).

- **Whitelist:** vollständig sauber. Kein `drawImage`, kein `getImageData`, kein `globalCompositeOperation`, kein `globalAlpha != 1`. Detektor (A) unberührt.
- **Synergie Hebel 1:** Die quantisierte Lichtstufe aus `quantizeLight()` ist direkt der Cache-Key. 10 bis 12 Stufen ist genau die Größenordnung, die Hebel 1 ohnehin einführt.
- **Kosten:** 75 Basissprites + 31 Flips = 106 Canvases, zusammen ca. 32000 Pixel. Bei 12 Stufen also ca. 1272 Canvases / 384k Pixel, das ist unter 2 MB und für ein Handy unkritisch. Lazy backen (erst bei erstem Bedarf) drückt das im Normalfall auf einen Bruchteil.
- **Risiko:** Nur Wächter (B). Eager backen VOR `main.js:71` würde die Indexausrichtung 0..74 zerstören und alle drei Flusstests rot machen. Eager NACH `:71` oder lazy ist unschädlich, solange der Zeichner das getönte Canvas nicht als `img` durchreicht, was er ja gerade tun soll. Deshalb ist (a) allein NICHT testneutral.
- **Aufwand:** mittel.

### 4.3 Option (b): `globalAlpha`-Overlay-Rechteck über dem Sprite

**Nicht brauchbar.** Ein `fillRect` über der Sprite-Bounding-Box färbt auch die transparenten Randpixel und erzeugt einen sichtbaren Halo-Kasten um jede Figur. Die Rettung wäre `clip` (verboten, GP4 §0.3) oder `globalCompositeOperation = 'source-atop'` auf dem Hauptcanvas, was aber ALLES darunter Gezeichnete miterfassen würde, also Boden, Schatten, Marker. Auf einem Offscreen wäre `source-atop` korrekt, dann ist man aber wieder bei einem Bake und damit bei (a). Option (b) fällt aus.

### 4.4 Option (c): zweiter `drawImage` mit Composite

`ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = t; ctx.drawImage(sameSprite, x, y);` addiert die Eigenfarbe des Sprites auf sich selbst.

- **Whitelist:** sauber (3-arg drawImage + `globalCompositeOperation` + `globalAlpha`, alle in der Liste). Composite-Hygiene-Pflicht beachten, expliziter Reset auf `'source-over'` und `globalAlpha = 1`, siehe das Muster `main.js:624-625` und `lighting.js:275-276`.
- **Testneutral:** JA, wenn der ERSTE `drawImage` weiterhin das Original-Canvas benutzt. `nameOf` findet es, `playerScreen()` bleibt grün, der Zusatz-Aufruf hat einen unbenannten `img` und fällt aus allen Filtern heraus.
- **Grenze:** kann NUR aufhellen und sättigt dabei zum Weiß. Das ist die dokumentierte GP5-Lehre 4 aus der Übergabe (`uebergaben/2026-08-07_grafikpass5.md`): "Additiv gezeichneter Staub saturiert zu Weiß". Für Abdunkeln bräuchte man `'multiply'`, das steht NICHT in der Whitelist.
- **Aufwand:** klein. **Risiko:** Ausbrennen der hellen Sprite-Töne, genau der Fehler, der in GP5 R3 beim Hotspot-Weiß korrigiert werden musste (`lighting.js:59-86`).

### 4.5 Empfehlung: (a) als MASKEN-Bake plus Fassaden-ctx, testneutral

Der Zuschnitt, der alle drei Wächter überlebt und `entities/` nicht anfasst:

1. **Zwei Masken-Bakes pro Sprite** statt 12 Vollbakes: ein Canvas in kaltem Dunkelton (Ambient-Tint der Map), ein Canvas in Fackel-Warm (216,114,42), jeweils mit der IDENTISCHEN Alpha-Maske des Originals. Erzeugt per `buildSprite` mit einer konstanten Palettenabbildung, also whitelist-sauber und `globalAlpha = 1`. Kosten: 212 Zusatz-Canvases, erzeugt NACH `main.js:71`.
2. **Die Lichtstufe steuert `globalAlpha` beim Draw**, quantisiert auf dieselben 10 bis 12 Stufen wie Hebel 1. Damit ist der Look posterisiert (kein Airbrush) und der Speicher konstant.
3. **Fassaden-ctx um `main.js:672`.** Weil jeder Entity-Zeichner ausschließlich `ctx.drawImage(img, x, y)` benutzt (§1.6, verifiziert), genügt:
   ```js
   // Skizze, gehört in main.js
   const tintCtx = {
     drawImage(img, x, y) {
       ctx.drawImage(img, x, y);                    // Original: Flusstests sehen es unverändert
       const m = tintMaskFor(img, curLight);        // null -> nichts weiter
       if (m) { ctx.globalAlpha = m.a; ctx.drawImage(m.img, x, y); ctx.globalAlpha = 1; }
     },
   };
   ```
   Der kalte Ton läuft `source-over` (dunkelt korrekt ab, ohne Halo, weil die Maske dieselbe Alpha-Form hat), der warme Ton optional mit `'lighter'` und explizitem Reset.
4. **Kontaktschatten in derselben Runde mitziehen**: Standardprofil um eine Zeile mit `dy = -1` erweitern, analog `SHADOW_DY_BIG` (`main.js:579`). Beides teilt sich den Abtastpunkt aus §3.3, also einen Ankerbegriff.

**Was die Spec zwingend fixieren muss**, damit das nicht in Runde 2 auffliegt:
- Der erste `drawImage` je Sprite bleibt das Original-Canvas (Wächter B).
- Alle Tint-Bakes mit `globalAlpha = 1` (Wächter A).
- Bakes entstehen frühestens nach `main.js:71` (Indexausrichtung 0..74).
- Nach jedem `lighter`-Block expliziter Reset auf `'source-over'` und `globalAlpha = 1`.
- Messziel-Abnahme: mindestens (i) Farbabstand Spieler-Fußpixel zwischen "an der Fackel" und "im Dunkeln" in Delta-R/G/B, (ii) sichtbare Schatten-Texel unterhalb der Fußkante je Entity, (iii) Nachweis, dass kein Sprite-Pixel auf 255,255,255 klemmt (Stresstest-Muster aus GP5 R3).

---

## 5. Flip-Listen-Regel und sprite-factory-Struktur

### 5.1 sprite-factory (`game/js/core/sprite_factory.js`, 33 Zeilen, das ganze Modul)

- `buildSprite(grid, palette, { flipX = false } = {})` (`:4-25`): erzeugt ein `document.createElement('canvas')` in Grid-Maßen, malt jeden Nicht-`'.'`-Pixel per `ctx.fillRect(flipX ? w-1-x : x, y, 1, 1)`. `flipX` ist also KEIN Transform, sondern eine Index-Spiegelung beim Malen (deshalb kein `scale`/`transform`, beide verboten).
- Unbekannter Palettenschlüssel wirft hart (`:17-19`), das ist der Art-Wächter.
- `buildAll(sprites, palette)` (`:27-33`): map über `Object.keys`, EIN Canvas je Key, KEINE Flips.
- Node-Sicherheit: `document` wird erst im Funktionskörper angefasst, der Import bleibt Node-tauglich (CLAUDE.md Grundentscheidung 4).

**Das ist die einzige Stelle im Projekt, an der aus Text-Grids Canvas-Sprites entstehen. Ein Tint-Cache setzt genau hier an**, entweder als dritter Parameter (`palette`-Ersatz, siehe §4.2) oder als neue Schwesterfunktion `buildTintMask(grid, palette, tone)`. Beides bleibt in `core/`, das in GP5 §0.10 bis auf `lighting.js`+`particles.js` gesperrt war, für GP6 also freizugeben ist.

### 5.2 Flip-Listen-Regel (`main.js:51-70`)

Regel: **`buildAll` erzeugt NUR ungespiegelte Sprites. Für jeden Key, den irgendein Zeichner als `${key}_flip` anfragt, MUSS der Key in der Liste `main.js:55-68` stehen, sonst ist `gfx[...]` `undefined` und `drawImage` wirft im Browser.** Der Kommentar sagt das wörtlich (`main.js:51-54`): "Flip-Liste: ALLE Keys, die player.draw/drawEnemies links-gespiegelt anfordern ... sonst drawImage(undefined) -> Konsolen-Fehler."

Zweite, härtere Regel, `main.js:62-65` wörtlich:
> Slice 3: Grabwaechter-Flips AUSSCHLIESSLICH ans ENDE angehaengt (nach shield_side). Die Bestandsreihenfolge ist EINGEFROREN, check_main_slice1 und check_inventory_slice2 mappen Canvas nach Sprite ueber die Erzeugungsreihenfolge; ein Einschub davor macht beide Alt-Tests rot.

Aktueller Stand: 31 Flip-Keys, gebaut in einer `for..of`-Schleife über ein Literal-Array, `gfx[`${key}_flip`] = buildSprite(SPRITES[key], PALETTE, { flipX: true })` (`main.js:69`).

Konsumenten der `_flip`-Keys: `player.js:218` und `:224`, `enemies.js:618`, `:626`, `:629`, `:646`, `boss.js:325`. **Nur `boss.js:325` prüft defensiv** (`const key = (e.facingLeft && gfx[\`${base}_flip\`]) ? ... : base;`), alle anderen setzen die Existenz voraus.

**Für GP6 heißt das:** Neue Sprite-Keys ans ENDE von `SPRITES` in `art/sprites.js`, neue Flip-Keys ans ENDE der Liste in `main.js:55-68`, neue Tint-Bakes an eine Stelle NACH `main.js:71`. Dann bleiben die Indizes 0..74 der Flusstest-Namensauflösung intakt und alle drei kanonischen Tests bleiben ohne Änderung grün.


---

# TEIL 4: Hebel 4 — Kronen-/Span-Mechanik


# GP6-Landkarte: Kronen-/Span-Mechanik (Hebel 4 "Kronen-Maßstab")

Read-only-Erhebung auf HEAD `7e1d86d`. Keine Spieldatei geändert. Mess-Skripte liegen in `/tmp/claude-1000/-home-coder/2135f5db-b185-41ca-95a9-9bd4f9302d40/scratchpad/` (`analyze_crowns.mjs`, `coverage.mjs`, `reach.mjs`, `culling.mjs`, `shadow.mjs`, `shadow_order.mjs`, `guard.mjs`, `perf.mjs`, `cells.mjs`). Smoke-Test-Baseline: `node tools/smoke_test.mjs` = **GRÜN** (7653 Ticks).

---

## 1. Wie Kronen heute funktionieren (Datei:Zeile-Kette)

### 1.1 Datenmodell: der Over-Layer

`GRAVEYARD` ist die **einzige** Karte mit `overRows` (`/home/coder/Grimlight/game/js/world/maps.js:510`); `map_fluestergruft.js` und `map_bosskammer.js` haben keinen Over-Layer (verifiziert per grep). Der Over-Layer ist also heute exakt eine Karte breit.

Legenden-Vertrag (`/home/coder/Grimlight/game/js/world/tilemap.js:16-17`, wörtlich):

```js
// - span: [w, h]   NUR Over-Layer, 1<=w,h<=4 ganzzahlig. Die overRows-Zelle ist
//                  der ANKER (obere linke Ecke); das Art-Canvas ist w*16 x h*16.
```

Die Kronen-Zeichen (`/home/coder/Grimlight/game/js/world/maps.js:117-146`):

| Zeichen | Art-Key | span | Klasse |
|---|---|---|---|
| `B` | `tree_canopy_bottom` (+variants `_top`, `tree_canopy`) | **keins** | 16x16-Hänge-Krone |
| `K` | `tree_canopy_top` | keins | 16x16 (in overRows heute unbenutzt) |
| `C` | `tree_canopy` (+variants `_v1`, `_v2`) | **keins** | 16x16-Hänge-Krone |
| `M`/`N`/`O` | `tree_canopy_2x2_a/_b/_c` | `[2,2]` | Front |
| `Q`/`V`/`X` | `tree_canopy_2x2_am/_bm/_cm` | `[2,2]` | Front gespiegelt |
| `Y`/`Z`/`A` | `tree_canopy_back_a/_b/_c` | `[2,2]` | Back-Kuppe |

`GRAVEYARD_OVER_ROWS` (`maps.js:378-403`), gemessene Belegung:
`M:4, N:4, O:3, Q:3, V:4, X:4, Y:11, Z:3, A:4` = **40 Span-Anker**, plus `B:10, C:6` = **16 Hänge-Kronen ohne span**. `K` kommt nicht mehr vor.

### 1.2 Sprites und Größen (`/home/coder/Grimlight/game/js/art/sprites.js`)

Alle Kronen-Grids gemessen (opake Pixel / BBox):

| Key | Zeile | Maß | opak | BBox |
|---|---|---|---|---|
| `tree_canopy` | 3213 | 16x16 | 164 (64 %) | 16x16 |
| `tree_canopy_top` | 3231 | 16x16 | 145 | 14x16 |
| `tree_canopy_bottom` | 3249 | 16x16 | 161 | 16x16 |
| `tree_canopy_2x2_a` | 3276 | 32x32 | 460 (45 %) | 24x31 |
| `tree_canopy_2x2_b` | 3313 | 32x32 | 549 (54 %) | 32x28 |
| `tree_canopy_2x2_c` | 3347 | 32x32 | 299 (29 %) | 19x26 |
| `tree_canopy_2x2_am/_bm/_cm` | 3385/3419/3453 | 32x32 | 464/552/297 | wie oben gespiegelt |
| `tree_canopy_back_a/_b/_c` | 4473/4507/4541 | 32x32 | 247/285/210 (21-28 %) | 25x14 / 29x14 / 21x14 |
| `tree_canopy_v1` (klein) | 6273 | 16x16 | 100 | 12x13 |
| `tree_canopy_v2` (breit) | 6291 | 16x16 | 182 | 16x16 |
| `canopy_shadow` | 4691 | 16x16 | 214 (84 %) | 16x15 |

**Die größte existierende Krone ist 32x32, ihre größte opake BBox 32x28** (`_b`). Die Back-Kuppen sind nur 14 px hoch. Das ist die harte Zahl hinter "Busch statt Blätterdach".

### 1.3 Validierung beim Kartenaufbau (`tilemap.js:610-621`)

```js
if (def.span) {
  const [sw, sh] = def.span;
  if (!Number.isInteger(sw) || !Number.isInteger(sh) || sw < 1 || sw > 4 || sh < 1 || sh > 4) {
    throw new Error(`createTilemap: span von '${ch}' = [${sw},${sh}] ausserhalb 1..4 oder nicht ganzzahlig`);
  }
  if (sw > 1 || sh > 1) {
    if (def.variants || def.anim) throw new Error(`createTilemap: span (>1) mit variants/anim an '${ch}' kombiniert`);
    for (let ty = 0; ty < hTiles; ty++) {
      if (rows[ty].indexOf(ch) !== -1) throw new Error(`createTilemap: span-Zeichen '${ch}' (w>1/h>1) kommt in den GROUND-rows vor (Ground bleibt 1x1)`);
    }
  }
}
```

Drei Konsequenzen, die für GP6 zentral sind:
1. **span ist NICHT auf 2x2 festgenagelt.** `[3,2]` (48x32) und `[4,3]` (64x48) sind heute schon gültig, ohne eine einzige Zeile Engine-Änderung. Die Obergrenze ist 4x4 = **64x64**.
2. **span (>1) und `variants`/`anim` schließen sich aus.** Eine Groß-Krone kann heute weder Varianten noch Animationsframes ziehen (das ist die Bremse für Kronen-Scherung, siehe §4).
3. Es gibt **nirgends** eine Prüfung, dass das Art-Canvas wirklich `w*16 x h*16` groß ist. `draw` zeichnet 3-argumentig, was auch immer im Grid steht. Der Kommentar `tilemap.js:17` ist eine Konvention, kein Zwang. Der einzige Wächter dafür sitzt in `.tmp/check_gfx5_art.mjs` (siehe §2.2).

### 1.4 Culling (`tilemap.js:889-905`)

```js
const tyStart = over ? Math.max(0, ty0 - (maxSpanH - 1) - 1) : ty0;
const txStart = over ? Math.max(0, tx0 - (maxSpanW - 1) - 1) : tx0;
const tyEnd   = over ? Math.min(hTiles - 1, ty1 + 1) : ty1;
for (let ty = tyStart; ty <= tyEnd; ty++) {
  for (let tx = txStart; tx <= tx1; tx++) {
```

`maxSpanW/maxSpanH` werden bei `createTilemap` aus den **tatsächlich vorkommenden** Over-Defs abgeleitet (`tilemap.js:744-753`), sind also automatisch korrekt, sobald eine größere Legende gesetzt wird.

**Befund (belegt, `culling.mjs`): das Fenster ist rechts löchrig.** `tx1` wird nicht erweitert. Ein Anker eine Spalte rechts von `tx1` mit `dx` bis `-14` (Klasse Back/Default) ragt bis zu 14 px in den Viewport, wird aber gecullt. Reproduziert:

```
tx1 = AX-1: camX=-33 -> Krone gezeichnet: false; linke Kronenkante bei Screen-x 56 (Viewport 0..64)
   >>> LUECKE: die Krone waere sichtbar (linke Kante im Viewport), wird aber gecullt.
```

Der Fehler ist von der Kronen-GRÖSSE unabhängig (er wird durch `|dx|` begrenzt, nicht durch `sw`), aber bei größeren Kronen fällt der 14-px-Streifen, der am rechten Bildrand ein- und ausploppt, deutlich stärker auf.

### 1.5 Anker-Offset GP5 §4.C2 (`tilemap.js:487-515`)

```js
const ANCHOR_CLAMP = {
  tree_canopy_back_a: 14, tree_canopy_back_b: 14, tree_canopy_back_c: 14,
  tree_canopy_2x2_b: 6,  tree_canopy_2x2_bm: 6,
  tree_canopy_2x2_a: 2,  tree_canopy_2x2_am: 2,
  tree_canopy_2x2_c: 2,  tree_canopy_2x2_cm: 2,
};
const ANCHOR_CLAMP_DEFAULT = 14; // Front ohne Stammdeckung

export function anchorOffset(def, tx, ty) {
  const dxRaw = variantIndex(tx + 1013, ty + 571, 29);
  const dx0 = dxRaw - 14;
  const key = def && def.art;
  const W = ... ANCHOR_CLAMP[key] : ANCHOR_CLAMP_DEFAULT;
  const dx = Math.max(-W, Math.min(W, dx0));
  const dyRaw = variantIndex(tx + 421, ty + 907, 17);
  const dy = (dyRaw % 9) - 4;
  return { dx, dy };
}
```

Die Tabelle ist **per Art-Key** geführt. Jeder NEUE Kronen-Key ohne Eintrag fällt auf `W = 14` zurück, also auf fast eine ganze Kachel horizontalen Versatz. Für stammgebundene Groß-Kronen wäre das ein Abriss vom Stamm. Reale Verteilung auf GRAVEYARD: `dx` von -13 bis +13, `dy` von -4 bis +4 (`analyze_crowns.mjs`).

Angewandt wird der Offset **nur** im Over-Zweig und **nur** für `def.span` (`tilemap.js:918-921`), plus identisch im Schatten-Pfad (`tilemap.js:774`, `tilemap.js:1021-1025`).

### 1.6 artFor und Sway (4 Phasen)

Konstanten (`tilemap.js:564-572`):
```js
const SWAY_DX = [0, 1, 0, -1];
const SWAY_CLUSTER_N = 7;
const CROWN_SWAY_RATE = 1.6;
const HANG_SWAY_AMP = 2;
```

Reine Phasenfunktion (`tilemap.js:576-587`): `swayPhase(tx,ty,timeSec,rate)` liefert `{step 0..3, dx}` aus einem 2x2-Block-Hash mit Bruchteil-Phasenversatz. Bei `timeSec = 0` steht global `dx = 0`.

`artFor` (`tilemap.js:825-871`): Span-Defs haben weder `anim` noch `variants`, fallen also durch auf `return def.art` (Zeile 870). **Groß-Kronen ziehen heute immer genau ein Grid.** Nur `B`/`C` (16x16) laufen über `def.variants`.

Sway-Anwendung, zwei getrennte Zweige:

- Span-Anker, Amplitude x1 (`tilemap.js:931`):
  ```js
  ax += swayPhase(tx, ty, timeSec, CROWN_SWAY_RATE).dx;
  ```
- Hänge-Kronen ohne span, Amplitude x2 (`tilemap.js:955`):
  ```js
  ax += swayPhase(tx, ty, timeSec, CROWN_SWAY_RATE).dx * HANG_SWAY_AMP;
  ```

Beides ist eine **reine Translation der ganzen Kachel** (`ax` ist der Ziel-x von `ctx.drawImage(img, ax, ay)`, `tilemap.js:958`). Der Schatten schwingt bewusst nicht mit (`tilemap.js:929-930`).

### 1.7 Kronen-Schatten (`tilemap.js:755-781` Aufbau, `:1021-1025` Zeichnung)

```js
const [sw, sh] = def.span;
const shy = ty + sh;                    // GENAU EINE Zeile, direkt unter der Span-Flaeche
...
for (let dx = 0; dx < sw; dx++) { const shx = tx + dx; ... shadowCells[shy][shx] = off; }
```
```js
if (!over && shadowCells[ty][tx]) {
  const shimg = tileCanvases['canopy_shadow'];
  const soff = shadowCells[ty][tx];
  if (shimg) ctx.drawImage(shimg, sx + soff.dx, sy + soff.dy);
}
```

Der Schatten ist also **immer genau `sw` Kacheln breit und 1 Kachel hoch**, unabhängig von der Kronenhöhe, und `canopy_shadow` ist ein flaches 50-%-Dither aus `n` (#221c26) und `0` (#0f1a12) ohne jede Formbindung an die Krone (`sprites.js:4691-4708`).

Gemessen auf GRAVEYARD (`shadow.mjs`):
- 76 Schattenzellen (aus 80 Soll-Emissionen; 4 gehen durch Überschreiben verloren, `tilemap.js:762-765`).
- **53 davon liegen auf SOLIDEM Grund, 31 direkt auf einem Stamm `T`.** Nur 23 liegen auf begehbarem Boden. Der "Boden-Schattenwurf" trifft also überwiegend Stämme und Grabsteine.
- Die **16 Hänge-Kronen (`B`/`C`) haben gar keinen `canopy_shadow`** (kein span, keine Schattenzelle) und leben nur von einer gebackenen 1-px-Kontaktlinie im Grid.

### 1.8 Ist-Zahlen im Bild (Messung, nicht Schätzung)

- Kronen-Pixel auf der ganzen Karte bei t=0: **15 239 von 245 760 = 6,2 %**.
- Kronen-bedeckte Kacheln: 128 von 960 (13,3 %); davon begehbar 55 von 699 (**7,9 %**).
- **Größtes zusammenhängendes Laubfenster**: ein 32x32-Fenster erreicht 91 % Deckung, ein 48x32-Fenster nur noch **70 %**, ein 64x48-Fenster **51 %**. Es gibt auf der Karte nirgends eine Fläche, die als geschlossenes Blätterdach lesbar wäre. Das ist die quantitative Fassung von "16px-Kronen bleiben Hüte" (`design/GP5_RUNDE2_JURY.md:70-72`).

---

## 2. Was 40x28- bis 64x48-Kronen bräuchten

### 2.1 Die Span-Mechanik trägt das, mit drei Fußnoten

**Keine feste 2x2-Annahme in der Engine.** `span` ist ein freies `[w,h]` in 1..4 (`tilemap.js:612`). Culling (`:744-753, :903-905`), Schattenzeile (`:770-779`) und Anker-Offset (`:918-921`) sind alle span-generisch geschrieben. `[3,2]` = 48x32 und `[4,3]` = 64x48 laufen ohne Engine-Änderung.

Fußnote A: **40x28 ist nicht rasterkonform.** 40/16 = 2,5, 28/16 = 1,75. Da `draw` 3-argumentig zeichnet, würde ein 40x28-Grid an span `[3,2]` zwar korrekt gezeichnet, aber die Schattenzeile läge bei `ay + 2*16 = ay+32`, also 4 px unter der Kronenunterkante. **Empfehlung für die Spec: Art-Canvas exakt `span*16`, Silhouette innen frei.** Also die Klassen 48x32 (`[3,2]`), 48x48 (`[3,3]`), 64x48 (`[4,3]`) statt 40x28.

Fußnote B: **`span (>1)` verbietet `variants` und `anim`** (`tilemap.js:616`). Größenklassen/Spiegelungen müssen wie heute über eigene Legenden-ZEICHEN laufen (M/N/O/Q/V/X-Muster), nicht über `variants`.

Fußnote C: **`ANCHOR_CLAMP` (`tilemap.js:487-497`) muss um jeden neuen Key erweitert werden**, sonst greift `W = 14` und die Groß-Krone reißt vom Stamm. Bei 64x48 mit Stammbindung wäre eher `W = 2..4` richtig.

### 2.2 Hart verdrahtete Größen-Annahmen (die Blocker-Liste)

1. **`/home/coder/Grimlight/.tmp/check_gfx5_art.mjs:93-96`** ist der eigentliche Größen-Riegel:
   ```js
   for (const [n, g] of Object.entries(TILE_ART)) {
     const want = (SPAN.test(n) || BACK.includes(n)) ? 32 : 16;
     if (g.length !== want || g[0].length !== want) bad(`Masse ${n}: ${g[0].length}x${g.length}, erwartet ${want}`);
   }
   ```
   mit `const SPAN = /^tree_canopy_2x2_[abc]m?$/;` (`:74`). **Jedes TILE_ART-Grid muss heute exakt 16x16 oder 32x32 sein.** Da dieses Skript in `.tmp` lebt und pro Pass neu geschrieben wird (`check_gfx4` -> `check_gfx5`, Spec §0.8), ist das kein Blocker, aber der GP6-Nachfolger braucht eine **Maß-Tabelle statt der 16/32-Dichotomie**.

2. **`tools/smoke_test.mjs:658-666`**, der Stamm-Deckungs-Test, kodiert 2x2 hart:
   ```js
   const trunkCovered = (x, y) => {
     if (over[y][x] === 'B') return true;
     for (let ay = Math.max(0, y - 1); ay <= y; ay++) {
       for (let ax = Math.max(0, x - 1); ax <= x; ax++) {
         if ('MNOQVX'.includes(over[ay][ax])) return true; // Anker deckt 2x2
       }
     }
     return false;
   };
   ```
   Bei `[4,3]` muss das Fenster `ay in y-sh+1..y`, `ax in x-sw+1..x` lauten und die Zeichenliste aus `GRAVEYARD.legend[ch].span` gelesen werden statt aus dem String `'MNOQVX'`.

3. **`tools/smoke_test.mjs:1762-1799`**, der Schatten-Test, kodiert `ay+2` und genau 2 Zellen hart:
   ```js
   check('Kronen-Schatten: canopy_shadow im GROUND-Pass unter der 2×2-Anker-Fläche (ay+2), mit dem Anker-Offset §4.C2',
     shadowAt.length === 2 && hit(2, 4) && hit(3, 4), ...)
   ```

4. **`tools/smoke_test.mjs:695-697`**, der Over-Zeichnungs-Test (die schärfste Klammer für §4):
   ```js
   check('Over-Layer zeichnet genau die Kronen-Zellen im Sichtfenster',
     drawn.length === expectedOver && drawn.every((k) => String(k).startsWith('tree_canopy')),
     `gezeichnet ${drawn.length}, erwartet ${expectedOver}`);
   ```
   **Genau EIN `drawImage` pro Over-Zelle, und jeder Key muss mit `tree_canopy` beginnen.**

5. **`tools/smoke_test.mjs:1875-1968`** (Anker-Offset + Culling) spiegelt die §4.C2-Formeln wörtlich und die Klassen-Tabelle W=2/6/14. Neue Kronen-Klassen brauchen dort neue Zeilen.

6. **`tools/smoke_test.mjs:1641-1646`**: die Wächter-Tests für `span [0,2]`, `span+variants`, `span-Zeichen in GROUND-rows`. Bleiben gültig, müssten aber um `span [5,x]` (Obergrenze) ergänzt werden, falls die 4er-Grenze angefasst wird.

7. **Guard-Zonen des Smoke-Fensters:** `maps.js:374-375` deklariert "Zeile 12 und Spalte 21 des Smoke-Fensters bleiben LEER". Gegengerechnet (`guard.mjs`): Das Over-Schleifenfenster bei cam(0,0) ist heute `tx 0..20, ty 0..12` und ändert sich bei `maxSpan 3x2` und `4x3` **nicht** (txStart/tyStart sind schon auf 0 geklammert, `tyEnd = ty1+1` ist span-unabhängig). Zeile 12 ist heute nur bei Spalte 38 belegt, Spalte 21 komplett leer. **Der Test bleibt bei größeren Spans grün, solange Zeile 12 in den Spalten 0..20 leer bleibt.** Das ist die einzige Guard-Auflage an den OVER_ROWS-Generator.

### 2.3 Zu zitierende §6-Klassen (SPEC_GRAFIKPASS_5.md:242-264)

Der GP5-Katalog listet die erlaubten Test-Eingriffe. Die GP6-Fassung braucht diese Klassen:

> `1. #1 smoke ~1832-1840: Anker-Formel/-Bereiche auf das §4.C2-Schema (WÖRTLICH die Formeln oben; Determinismus bleibt; Culling-Test 1840 auf die neuen Fenster angepasst).`

-> **Klasse "Anker/Culling"**: neue Anker-Klassen-Tabelle (W je Groß-Kronen-Key) plus, neu, der rechte Culling-Rand (`tx1 + 1`).

> `3. #3 smoke §16 additiv: grass_g5-Zählung >= 47 (Präfix), bank_*_g/s, shore_cap_*, water_reflect_0/_1, neue A2-Varianten.`

-> **Klasse "additive Existenzprüfung"**: die neuen `tree_canopy_XL_*`-Keys in die `gfxN Tiles`-Liste (`smoke:463-570`).

> `4. #4 additive NEUE Tests: (a) ... (d) Sway-Cluster-Gleichphase (2×2 → identische Phase); (e) n-UNGERADE-Wächter über alle Legenden-variants; (f) defAt-Export.`

-> **Klasse "additive NEUE Tests"**: hier gehören die drei GP6-Kronen-Tests hin: (i) Span-generische Stammdeckung, (ii) Schattenzeile `ay+sh` über `sw` Spalten für ein `[3,2]`- und ein `[4,3]`-Beispiel, (iii) Ein-Draw-pro-Zelle bei Groß-Kronen.

> `5. Varianten-Integritäts-Regel beachten: '.'-art wird grass_g5_00 (variants[0]===art — Review).`
> `6. check_gfx5_art.mjs laut §0.8 (portierte Wächter + neue Gates).`

-> **Klasse "Art-Selbstcheck"**: `check_gfx6_art.mjs` ersetzt `check_gfx5_art.mjs` und portiert dessen Wächter, ersetzt aber die 16/32-Maß-Regel (`check_gfx5_art.mjs:93-96`) durch eine Tabelle `{16, 32, 48x32, 64x48}`.

> `7. Kanonische Flusstests NULL; Golden-Hashes NULL.`

-> bleibt. `.tmp/check_main_slice1.mjs` darf nicht angefasst werden (siehe §4).

Nicht im GP5-Katalog abgedeckt und deshalb **neu zu sanktionieren**: die Änderung von `smoke:658-666` (Stammdeckung) und `smoke:1762-1799` (Schattenzeile). Beides sind Bestandstests, keine additiven; sie brauchen eine explizite "erlaubte Alt-Test-Änderung"-Nummer im GP6-§6, im Stil von `smoke:1780` ("erlaubte Alt-Test-Aenderung #1, GP5-§6").

### 2.4 Performance-Einschätzung Culling

Gemessen (`perf.mjs`, 4212 Kamerapositionen im 4-px-Raster über die ganze Karte):

| Metrik | Ist (max span 2x2) |
|---|---|
| Over-Layer `drawImage`/Frame | **max 31**, Mittel 9,9 |
| Gezeichnete Kronen-Pixel/Frame | max 23 040 (= 40 % von 320x180) |
| Ground-Layer `drawImage`/Frame zum Vergleich | 326 |

Schleifenkosten des Over-Zweigs (`culling.mjs`):

| maxSpan | besuchte Zellen/Frame |
|---|---|
| 2x2 (heute) | 23 x 16 = 368 |
| 3x2 | 24 x 16 = 384 |
| 4x3 | 25 x 17 = 425 |

**Einschätzung: unkritisch.** Das Schleifenfenster wächst um 15 %, die Zahl der Zeichenaufrufe sinkt sogar (weniger, größere Kronen statt vieler kleiner), die Füllrate steigt maximal um Faktor 3 (64x48 = 3072 px gegen 32x32 = 1024 px) auf grob 60-70 kpx pro Frame, also gut eine Bildschirmfläche. Der Over-Layer bleibt damit unter 20 % der Ground-Layer-Last (326 Aufrufe). Der Speicher für gebackene Canvases (`main.js:71` `buildAll(TILE_ART, PALETTE)`) wächst pro 64x48-Krone um 3072 px = 12 KB RGBA; selbst 45 zusätzliche Groß-Grids sind ~0,5 MB.

Der einzige echte Culling-Punkt ist die **rechte Kante** (§1.4): `tx1` muss um `ceil(maxDx/16) = 1` erweitert werden, sonst wächst mit der Kronenbreite die Auffälligkeit des ein- und ausploppenden 14-px-Streifens.

---

## 3. SPIELER UNTER LAUB

### 3.1 Wo der Over-Layer im Renderpfad liegt

`/home/coder/Grimlight/game/js/main.js:473-476` (bindende Reihenfolge, wörtlich):

```
// Render-Reihenfolge (bindend, Slice 1.5): Boden-Layer → Entities Y-SORTIERT
// nach Fußkante (Drops/Props/Gegner/Spieler gemeinsam; wer weiter unten steht,
// ist davor) → Over-Layer (Baumkronen ÜBER den Entities) → Fog → Lighting →
// Vignette → HUD (HUD wird NICHT abgedunkelt).
```

Umgesetzt:
- `main.js:598` `map.draw(ctx, camera, tiles, timeSec, 'ground');`
- `main.js:665-672` Y-Sortierung, `renderables.push({ fy: player.y + player.h, ... })`, dann `for (const r of renderables) r.draw();`
- `main.js:686` `map.draw(ctx, camera, tiles, timeSec, 'over');`
- danach Fog (`:687`), `lighting.draw` (`:709`), Partikel, Vignette, HUD.

**Der Over-Layer liegt also unbestreitbar über dem Spieler und wird selbst noch vom Ambient-Overlay mitverdunkelt.** Die CLAUDE.md-Pflicht "Layering (Kronen über dem Spieler)" ist im Code erfüllt.

### 3.2 Funktioniert die Verdeckung? Ja, gemessen.

Der Beweis existiert seit GP5 §4.C5: `.tmp/shot_gfx5.py:2856-2930` fährt eine A/B/C/D-Vierfachaufnahme (Spieler an/aus x Over-Layer an/aus, Kamera und Zeit eingefroren) und misst die verdeckte Silhouette. Ergebnis aus `/home/coder/Grimlight/.tmp/g5_proof_results.json` (`gates.unter_kronen`):

```json
{ "standkachel": [20,18], "kronenkachel_over": [20,17],
  "sprite_world_box": [320,279,336,303], "kopfzeilen": 9,
  "silhouette_texel": 265, "silhouette_texel_kopf": 99,
  "verdeckt_gesamt": 52, "verdeckt_kopf": 52,
  "threshold": ">=20 verdeckte Kopf-Texel", "pass": true }
```

Bilder: `/home/coder/Grimlight/.tmp/screenshots/g5_10_unter_kronen.png` und `/home/coder/Grimlight/.tmp/screenshots/g5_crop_j_unter_kronen.png`.

### 3.3 Warum es trotzdem "nie ein Beweisbild" gab

Drei Ursachen, alle belegbar:

1. **Bis GP4 gab es die Szene schlicht nicht.** `.tmp/shot_gfx4.py` enthält 0 Treffer für "Kronen"/"unter"/"verdeck" (grep). Deshalb GP4-R3 (`design/GP4_RUNDE3_JURY.md:65-66`): "KRONEN ÜBER DEM SPIELER sichtbar machen (M: in keinem Screenshot nachweisbar, obwohl CLAUDE.md-Pflicht — Route/Layer prüfen!)". Es war nie ein Layer-Fehler, sondern eine **Proof-Lücke**.

2. **GP5 hat die Szene für die schwächste Kronenklasse gebaut.** `maps.js:371-373` beschreibt es selbst: das dritte Cluster besteht aus "sechs 'C'-Mittel-Fueller ueber begehbarem Grund". `C` ist eine **16x16**-Hänge-Krone. Der Beweiszelle (20,18) liegt genau eine solche Kachel über dem Kopf.

3. **Deshalb ist die Verdeckung im Bild kein Blätterdach.** Gemessen über alle 699 erreichbaren begehbaren Kacheln (`reach.mjs`, Sprite-Box 16x24 gegen die Kronen-Pixelmaske bei t=0):

   | Standkachel | Kopf-Pixel (max 144) | Sprite gesamt (von 384) | Laubquelle |
   |---|---|---|---|
   | **(20,18) = Beweisszene** | **70** | **70 (18 %)** | `C@20,17: tree_canopy` (eine 16x16-Krone) |
   | (31,9) | 100 | **326 (85 %)** | `Y@31,7 back_a` + `M@31,8 2x2_a` + `O@30,9 2x2_c` |
   | (35,22) | 134 | 318 (83 %) | `A@34,20 back_c` + `N@35,21 2x2_b` |
   | (12,22) | 127 | 307 (80 %) | `Y@12,20 back_a` + `V@12,21 2x2_bm` |
   | (37,1) | 139 | 305 (79 %) | `V@37,0 2x2_bm` |
   | (3,21) | 126 | 271 (71 %) | 3x `back_a` + `X@2,21 2x2_cm` |

   Insgesamt: 57 erreichbare Kacheln mit Kopfverdeckung, 44 davon über der 20-Texel-Schwelle. **Die gewählte Beweiszelle rangiert auf Platz ~19 von 44.** Das Crop zeigt folgerichtig einen Busch hinter dem Kopf, nicht ein Dach über der Figur.

### 3.4 Welche Szene es beweisen würde (Koordinaten auf GRAVEYARD)

Alle Kandidaten existieren **heute schon**, ohne eine einzige Art- oder Map-Änderung:

- **Primär: Standkachel (31,9)** (`grass_g5_00`, begehbar, von Spawn (3,12) erreichbar). 326 von 384 Sprite-Pixeln unter Laub = 85 %, Kopf 100 Pixel, aus **drei** Kronen gleichzeitig (`tree_canopy_back_a`, `tree_canopy_2x2_a`, `tree_canopy_2x2_c`). Kamera bei zentrierter Sicht (320,62), Spieler auf Screen (184,90), also fast bildmittig, kein Kamera-Clamp am oberen Rand.
- **Alternative A: (12,22)** (`grass_g5_00`). 307/384 = 80 %, Kopf 127. Kamera (40,204), Spieler auf Screen (160,156), perfekt horizontal zentriert.
- **Alternative B: (35,22)** (`grass_tuft`). 318/384 = 83 %, Kopf 134. Kamera (320,204).
- **Alternative C: (3,21)** (`grass_dark_v3`), 271/384 = 71 %, Kopf 126, vier Kronen (drei Back-Kuppen plus `2x2_cm`), also das dichteste "Mehrschichten"-Bild.

Empfehlung für die Spec: Beweis-Szene auf **(31,9)** umziehen, Gate von "≥20 verdeckte Kopf-Texel" auf **"≥60 verdeckte Kopf-Texel UND ≥50 % der gesamten Sprite-Silhouette verdeckt"** anheben. Das ist mit dem heutigen Stand bereits erfüllbar und wird mit 64x48-Kronen zur echten Messlatte statt zur Formalie.

---

## 4. Kronen-Scherung statt Translation (R3-Restliste 6)

Auftrag im Wortlaut (`/home/coder/Grimlight/uebergaben/2026-08-07_grafikpass5.md:47-48`):
> `6. Kronen: Scherung statt Translation im Sway (0/+1/+2 nach Höhe), 5 echte Posen, Blattcluster mit Trennlinien, Layering-Beweisbild.`

### 4.1 Wo der Sway-Offset heute angewandt wird

Genau zwei Stellen, beide im Over-Zweig von `draw` und beide als **Translation der ganzen Kachel**:
- `tilemap.js:931` (span-Anker, `dx` aus `SWAY_DX = [0,1,0,-1]`, Amplitude 1)
- `tilemap.js:955` (Hänge-Kronen, `* HANG_SWAY_AMP = 2`)

Gezeichnet wird an `tilemap.js:958`: `if (img) ctx.drawImage(img, ax, ay);`

### 4.2 Warum Scherung im Renderer NICHT geht

Drei unabhängige Riegel:

1. **Transform-Verbot.** `design/SPEC_GRAFIKPASS_4.md:36-41`, übernommen von GP5 §0.3 ("Canvas-Whitelist wie GP4"): erlaubt sind `fillRect, drawImage, arc, fill, beginPath, save, restore, clearRect, createRadialGradient, fillText`; **verboten** unter anderem `scale/transform/setTransform`, `translate`, `rotate`. Eine Scherung per `setTransform(1,0,k,1,...)` ist damit ausgeschlossen.

2. **Der Flusstest-Stub hat die Methoden gar nicht.** `/home/coder/Grimlight/.tmp/check_main_slice1.mjs:30-51` definiert den ctx ohne `translate/rotate/setTransform/scale`. `check_boss_slice3.mjs:61` hat `translate()`/`rotate()` nachgerüstet (wegen `drawMarkers`), `check_main` **nicht**. Und GP5 §0.1 friert die Flusstests ein: "Kanonische Flusstests (check_main/check_inventory/check_boss): NULL Änderungen", GP4 §0.3: "keine Stub-Erweiterungen". Jede Transform-Nutzung im Tilemap-Pfad wäre ein TypeError in `check_main`.

3. **9-argumentiges `drawImage` (Quellrechteck) bricht die Kronen-Smoke-Stubs.** GP5 §0.3: "drawImage bei Licht/Overlays nur 3-Argument". Ein Präzedenzfall für 9-arg existiert zwar (`game/js/ui/hud.js:142`, halbes Herz), aber die kronenrelevanten Smoke-Stubs lesen Argument 2/3 als ZIELkoordinate:
   - `smoke:1777` `drawImage: (img, sx, sy) => { if (img === 'canopy_shadow') shadowAt.push([sx, sy]); }`
   - `smoke:1914` `drawImage: (img, sx, sy) => { if (img === art) { store.x = sx; store.y = sy; } }`
   Bei 9 Argumenten wären das die QUELL-Koordinaten. Der Anker-Offset-Test (`smoke:1898-1910`) würde falsch messen.

**Fazit: Streifen aus einem Grid herausschneiden ist nicht möglich. Jeder Streifen bräuchte einen eigenen Bake.**

### 4.3 Die zwei gangbaren Wege

**Weg A: Streifen-Bakes (mehrere `drawImage` pro Krone)**

Die Krone wird in N waagerechte Bänder zerlegt, jedes Band als eigenes 3-arg-Grid gebacken (z. B. `tree_canopy_xl_a_b0/_b1/_b2`, jeweils volle Canvasbreite, nur das eigene Band opak), und mit eigenem `ax + shear[band]` gezeichnet.

- Pro: beliebig feine Scherung aus EINEM Basisbake, Art-Kosten linear in N statt in Posen.
- Contra: **bricht `smoke:695-697` frontal** (`drawn.length === expectedOver`, ein Draw pro Zelle). Verdreifacht die Over-Zeichenaufrufe (max 31 -> ~93/Frame, immer noch harmlos). Braucht eine sanktionierte Änderung dieses Bestandstests im GP6-§6.
- Contra: Bandgrenzen erzeugen bei ungleichem Versatz 1-px-Risse in der Silhouette, wenn die Art-Bänder nicht mit Überlappung gebacken werden.

**Weg B: Gebackene Scher-Posen (ein `drawImage` pro Krone)** -- empfohlen

Pro Krone und Phase ein vollständig vorgeschertes Grid, z. B. `tree_canopy_xl_a` / `_sh1` (rechts) / `_sh3` (links). Erzeugung deterministisch in einem `.tmp/gen_crowns_gp6.mjs` (Präzedenz: `.tmp/gen_crowns_gp5r2.mjs`, `sprites.js:3212`), Verschiebung pro Zeile nach Höhe, z. B. `dx(y) = round(2 * (1 - y/h))` -> 0/+1/+2 wie im Juror-Rezept, Unterkante (Stammansatz) bleibt fix.

- Pro: **exakt ein `drawImage` pro Over-Zelle**, `smoke:695-697` bleibt unangetastet, Culling/Schatten/Anker-Offset unverändert.
- Pro: die Silhouette ändert sich wirklich (Scherung, nicht Translation), also genau das, was die Jury verlangt.
- Contra: Engine braucht einen **neuen Legenden-Weg**, denn `span (>1) mit anim/variants` wirft (`tilemap.js:616`) und `artFor` liefert für Span-Defs stur `def.art` (`tilemap.js:870`). Sauberster Schnitt: ein neues Feld `swayPoses: [ruhe, rechts, ruhe, links]`, das ausschließlich im Over-Zweig ausgewertet wird, indexiert mit `swayPhase(tx,ty,timeSec,CROWN_SWAY_RATE).step` (die Funktion liefert `step` bereits, `tilemap.js:586`). Die `anim`-Sperre bleibt bestehen, `swayPoses` wird explizit von ihr ausgenommen und eigenständig validiert (Länge 4 oder 8, `poses[0] === def.art`, analog zur `variants[0] === art`-Regel aus `smoke:1624`).
- Contra: Art-Menge. 9 Span-Keys x 3 unterschiedliche Zustände (SWAY_DX hat nur die Werte 0/+1/-1) = 18 zusätzliche Grids. Für die geforderten "5 echte Posen" bräuchte es eine 8-Phasen-Tabelle `SWAY_DX = [0,1,2,1,0,-1,-2,-1]` und 9 x 4 = 36 zusätzliche Grids. Bei 64x48 sind das ~110 kpx, unkritisch.
- Anmerkung: `SWAY_DX` (`tilemap.js:564`) ist heute an mehreren Stellen im Smoke verankert (`smoke:2390` prüft die Formel `SWAY_DX[(floor(t*rate*2 + variantIndex(...)/7)) % 4]`). Eine Erweiterung auf 8 Phasen ist eine Alt-Test-Änderung und gehört in den GP6-§6-Katalog.

**Wichtig für beide Wege:** der `canopy_shadow` darf nicht mitscheren (`tilemap.js:929-930`, "der Schlagschatten liegt auf dem Boden, nur die Krone wiegt sich").

---

## 5. Boden-Schattenwurf großer Kronen

### 5.1 Heutiger Mechanismus, drei Schwächen

Aufbau `tilemap.js:766-781`, Zeichnung `tilemap.js:1021-1025` (siehe §1.7). Art: `sprites.js:4691-4708`, ein 50-%-Schachbrett aus `n` (#221c26) und `0` (#0f1a12), 16x15 opak.

**Schwäche 1: Der Schatten ist eine 1-Kachel-Leiste, unabhängig von der Kronenhöhe.** Bei `[4,3]` (64x48) wären das 64x16 Schatten unter 64x48 Krone: proportional ein Viertel der Kronenhöhe. Der Wurf liest dann als Sockelstreifen, nicht als Laubschatten.

**Schwäche 2: Der Schatten landet zu 70 % auf soliden Objekten.** Gemessen (`shadow.mjs`): 53 von 76 Schattenzellen auf soliden Kacheln, davon **31 direkt auf einem Stamm `T`**. Da der Schatten im Ground-Pass NACH der Kachel gezeichnet wird (`tilemap.js:1021`), liegt ein flächiges Dunkeldither auf senkrechten Stämmen. Nur 23 Zellen liegen wirklich auf Boden.

**Schwäche 3 (neu gefunden, reproduziert mit `shadow_order.mjs`): der Schatten wird von der Nachbarkachel angeschnitten.** Der Ground-Pass läuft `ty` aufsteigend, `tx` aufsteigend. Ist `dx > 0`, ragt der Schatten von Zelle `(tx,ty)` um `dx` px in Spalte `tx+1`, die erst danach ihre opake Bodenkachel zeichnet:

```
Anker (3,2) dx=2 dy=2: Schatten-Draws [50,66]@44 [66,66]@46
   Bodenkachel (4,4) bei x=64 wird an Index 45 gezeichnet, Schatten (3,4) an 44
   -> RECHTE 2px des Schattens werden UEBERMALT (Luecke)
```

Ergebnis: bei `dx > 0` klafft in jedem mehrspaltigen Kronenschatten ein `dx` px breiter senkrechter Riss zwischen den Schattenkacheln; bei `dy > 0` fehlt entsprechend die Unterkante. Bei `dx < 0` tritt es nicht auf (getestet: Anker (2,2) dx=-2 und (2,3) dx=-2 sind sauber). Mit `W = 14` für Back-Kuppen und stammlose Fronten wird der Riss bis zu 14 px breit. Bei 4 Spalten Kronenbreite gibt es dann drei solche Risse.

**Schwäche 4:** die 16 Hänge-Kronen (`B`/`C`) werfen gar keinen `canopy_shadow`.

### 5.2 Was bei 64x48 zu ändern wäre

1. **Schattenfläche an die Krone koppeln, nicht an eine feste Zeile.** Entweder ein neues Legendenfeld `shadowSpan: [w,h]` (Default `[sw,1]`, für Groß-Kronen z. B. `[4,2]`), oder ein eigenes, ebenfalls span-großes Schatten-Grid `canopy_shadow_xl` (64x32), das an EINER Stelle mit 3-arg gezeichnet wird. **Die Ein-Draw-Variante ist vorzuziehen**, weil sie Schwäche 3 strukturell auflöst: ein einziger Bake kann von keiner Nachbarkachel in der Mitte angeschnitten werden, nur an den Außenrändern.
2. **Zeichenreihenfolge trennen.** Der saubere Fix zu Schwäche 3 ist ein eigener Schatten-Durchgang: erst alle Bodenkacheln, dann alle `canopy_shadow`. Das kostet eine zweite Schleife über dasselbe Fenster (368 Zellen, siehe §2.4) und ist die einzige Änderung, die die Risse restlos beseitigt. Alternative ohne zweite Schleife: den Schatten immer bei der Zelle zeichnen, deren Index am größten ist (also `tx + ceil(dx/16)`), was aber bei negativem `dy` wieder bricht.
3. **Formbindung statt Schachbrett.** Der Schattenbake sollte die Silhouetten-Projektion der zugehörigen Krone tragen (Randerosion, weichere Dichte nach außen), nicht ein globales 50-%-Dither. Da jede Groß-Kronen-Klasse ohnehin einen eigenen Bake bekommt, ist der Schatten pro Klasse (`_a/_b/_c`) generierbar.
4. **Lichtrichtung.** GP4-R3 §5 fordert eine Hauptlichtrichtung oben-links für ALLE Objekte. Der Schatten müsste also nach unten-rechts versetzt sitzen (heute exakt zentriert unter dem Anker plus Anker-Offset). Ein konstanter `SHADOW_LIGHT_DX/DY` in `tilemap.js` neben `anchorOffset` wäre additiv und testbar.
5. **Ton.** Die R2-Jury-Auflage (`design/GP5_RUNDE2_JURY.md:47-50`) lautet für Props: "der '0'-Ton ist gegen Gras fast unsichtbar -> 'k' (#14101a) verwenden". `canopy_shadow` nutzt `n` (#221c26) und `0` (#0f1a12); mit 64x48-Kronen wird die Schattenfläche groß genug, dass dieselbe Kritik greift.
6. **Hänge-Kronen einbeziehen** oder sie ersatzlos durch Groß-Kronen ablösen. Solange sie ohne Schatten im Bild stehen, bleibt der Vorwurf "Seerosenblätter auf Rasen" (GP5-R1 §3) an ihnen hängen.

---

## 6. Kurzfassung der harten Fakten für die Spec

| Frage | Antwort mit Beleg |
|---|---|
| Ist die Span-Mechanik auf 2x2 festgenagelt? | **Nein.** `tilemap.js:612` erlaubt 1..4, also bis 64x64. Culling/Schatten/Anker sind span-generisch. |
| Was blockiert größere Kronen wirklich? | Der Art-Selbstcheck `.tmp/check_gfx5_art.mjs:93-96` (jedes Grid 16 oder 32), plus vier hartkodierte 2x2-Annahmen in `tools/smoke_test.mjs` (`:658-666`, `:695-697`, `:1762-1799`, `:1875-1968`). |
| Funktioniert Spieler-unter-Laub? | **Ja**, `main.js:686` nach `main.js:672`. Gate `unter_kronen` PASS: 52 von 99 Kopf-Texeln verdeckt. |
| Warum wirkt es nicht? | Die Beweiszelle (20,18) nutzt eine **16x16**-Krone (70/384 Sprite-Pixel = 18 %). 44 bessere Zellen existieren, die beste (31,9) mit **326/384 = 85 %**. |
| Warum "Busch statt Blätterdach"? | Größte opake Kronen-BBox = 32x28. Bestes 48x32-Fenster auf der Karte: 70 % Deckung, bestes 64x48-Fenster: **51 %**. Kein geschlossenes Dach existiert. |
| Geht Scherung im Renderer? | **Nein.** Transform-Verbot (`SPEC_GRAFIKPASS_4.md:36-41`), Stub ohne `translate/rotate` (`check_main_slice1.mjs:41-49`, eingefroren), 9-arg-`drawImage` bricht `smoke:1777`/`smoke:1914`. Nur gebackene Scher-Posen (1 Draw) oder Streifen-Bakes (N Draws, bricht `smoke:695-697`). |
| Performance? | Over-Layer heute max 31 `drawImage`/Frame gegen 326 im Ground-Layer; Schleifenfenster wächst bei `4x3` von 368 auf 425 Zellen. **Unkritisch.** |
| Neu gefundene Defekte | (a) Culling-Lücke am **rechten** Bildrand (`tx1` nicht erweitert, bis 14 px Kronenrand poppt; reproduziert). (b) Kronenschatten wird bei `dx > 0` von der Nachbar-Bodenkachel angeschnitten, Riss bis 14 px (reproduziert). (c) 53 von 76 Schattenzellen liegen auf soliden Kacheln, 31 auf Stämmen. (d) 16 Hänge-Kronen ganz ohne `canopy_shadow`. |


---

# TEIL 5: R3-Restliste — Fundstellen


## GP6-LANDKARTE (Lese-Bericht, keine Spieldatei verändert)

Stand HEAD `7e1d86d`. Messskripte (wegwerfbar, nur in `.tmp/`): `/home/coder/Grimlight/.tmp/gp6_landkarte_probe.mjs`, `…probe2.mjs`, `…probe3.mjs`, `…gp6_probe4.mjs`, `…gp6_probe5.mjs`. Alle Zahlen unten sind daraus reproduzierbar.

---

## 1. KANAL-UFERRING

**Fundstelle bestätigt.** `/home/coder/Grimlight/game/js/world/map_fluestergruft.js:97`:

```js
'~': { art: 'water_v', solid: false, fringeTarget: true, shorePrefix: 'wet', anim: ['water_v', 'water_v_1', 'water_v_2', 'water_v_3'], animRate: 3, animSync: true, depthOverlays: ['water_shallow', 'water_mid'] },
```

`depthOverlays[0]` = `water_shallow` = `sprites.js:2227`, waagerechte Striche auf den Zeilen 2/3/8/9/10 (Teich-Sprache). `depthOverlays[1]` = `water_mid` = `sprites.js:2362`, korrekt senkrecht (Talspalten, GP5-R3-Neubau).

**Die transponierte Kachel existiert NICHT.** Vollständige Wasser-Keys in `sprites.js`: `water_shallow` (2227), `water_shallow_v1` (6368), `water_shallow_v2` (6386), `water_mid_calm` (2290) + `_v1`/`_v2`, `water_mid` (2362) + `_v1` (6476)/`_v2` (6494). Kein `water_shallow_v`.

**KRITISCH: Namenskollision.** `tilemap.js:711-712` bildet den Variantenschlüssel als `` `${base}_v${vi}` `` mit `vi ∈ {1,2}`:

```js
const vi = variantIndex(tx + 617, ty + 293, DEPTH_VARIANT_N);
depthVarArt[ty][tx] = vi === 0 ? null : `${base}_v${vi}`;
```

Setzt man `depthOverlays[0]` auf den Namen `water_shallow_v`, zieht die Engine für `vi=1/2` die Keys `water_shallow_v1` / `water_shallow_v2`, und die **existieren bereits als horizontale Varianten**. Gemessen am echten Kanal (probe5): Ring 0 hat **21 Zellen im Kanal** (x≥17), Verteilung **9× Basis / 7× \_v1 / 5× \_v2**. Der Fix griffe damit nur auf 9 von 21 Zellen, 12 blieben waagerecht.

**Kleinster sinnvoller Eingriff:** DREI neue Art-Grids unter kollisionsfreiem Präfix (z. B. `water_shallow_vert`, `_vert_v1`, `_vert_v2`, Bauart = `water_mid`-Sprache um die Kammlage gedreht) plus **eine** Legendenzeile `map_fluestergruft.js:97`: `depthOverlays: ['water_shallow_vert', 'water_mid']`. Der Friedhofsteich (`maps.js:345`) bleibt unberührt.

**Risiken:** keine. `solHash` hasht nur `def.legend[ch].solid` über `def.rows` (`tools/smoke_test.mjs:1998`), `geoHash` nur Spawns/Portale/`torchChars`-findTiles (2000-2007). `depthOverlays` fließt in keinen von beiden. Graceful degradation ist verdrahtet (`tilemap.js:669-672`, hasOwnProperty-Prüfung): fehlt ein Key, rendert es still wie heute. Kein `variants`-Feld betroffen, also kein Ungerade-n-Gesetz (`smoke_test.mjs:2413-2426`, `check_gfx5_art.mjs:300-305`); `DEPTH_VARIANT_N = 3` bleibt.

---

## 2. BOSS-KRATZER MESSEN WARM

**Fundstellen:**
- Grid: `sprites.js:4149` `floor_decal_crack` (Kommentarblock 4129-4148 dokumentiert die GP5-R3-Umfärbung auf `'T'`).
- Legende: `map_bosskammer.js:55` `'c': { art: 'floor_decal_crack', … }`, gesetzt auf `(6,3)` und `(13,8)` (ROWS 21/26).
- Wächter: `.tmp/check_gfx5_art.mjs:457-460` prüft **nur** die Abwesenheit von `'O'`, es gibt kein R−B-Gate.

**Gemessen (probe: Ton-Bilanz):** 20 Pixel weichen von `stone_floor` (`sprites.js:2633`) ab, davon 10× `t→T` (Kratzer) und 10× `t/n→k` (Schatten).

| Ton | Hex | R−B | Luminanz |
|---|---|---|---|
| `t` Boden | `#2a2e36` | **−12** | 45,7 |
| `k` Schatten | `#14101a` | −6 | 18,3 |
| `L` | `#687180` | −24 | 112,0 |
| `D` | `#949eae` | −26 | 156,8 |
| **`T` Kratzer** | `#4a4a45` | **+5** | 73,4 |
| `m` (Erbstück aus `stone_floor`, 1 px) | `#506341` | +15 | 89,4 |

**Hypothese A (die stärkste, Ton-Wurzel):** `'T'` ist das **einzige Glied der Katakomben-Stein-Rampe mit positivem R−B**. `palette.js:106-109` sagt das ausdrücklich: *"T: '#4a4a45' … GP3-R3 (M-K5b/Palette-5): blauen Kalt-Cast entzogen, Hauch waermer -> gemeinsamer warmer Mittelton mit dem Friedhof-Erdweg (M/P)"*. Der GP5-R3-Auftrag "kalte L/D-Rampe, 2 Stufen dunkler" wurde also mit dem einzigen nicht kalten Glied erfüllt. Kratzer gegen Boden: **Δ(R−B) = +17**.

**Hypothese B (Licht-Pass wärmt, Lit-Dither):** `BOSS_KAMMER` steht in `LIT_FLOOR_MAPS` (`main.js:524`). Der Pass zeichnet `licht_dither_1/_2` (`sprites.js:4092`/`4110`) additiv mit `'lighter'` bei α 0,18/0,30 (`main.js:614-619`). Die Dither-Töne sind `'6'` `#c06a33` (**R−B +141**) und `'V'` `#9a8264` (**R−B +54**). Rechnung: α 0,18 auf `'6'` gibt ΔR +34,6 / ΔB +9,2, also **Δ(R−B) = +25,3** und damit exakt die Jury-Spanne. Reichweite: `litDitherCells` Stufe 1 bei `dist < r*0.70` (`tilemap.js:81-84`), `TORCH_RADIUS = 72` (`main.js:30`). Beide `'c'`-Zellen liegen bei **50,6 px** vom nächsten Fackelzentrum, die Schwelle bei 50,4 px, und `r` wackelt per Flicker ±10 % (`tilemap.js:75-79`) auf bis zu 55,4 px. **Die Decal-Kacheln blinken also in und aus dem Lit-Dither.**

**Hypothese C (Warm-Glow) ist widerlegt.** `GLOW_RINGS` (`lighting.js:45-52`) summiert im Kern zu ΔR +26,5 / ΔB +6,2, also Δ(R−B) = **+20,4**, was zahlenmäßig ebenfalls passt. Aber der Glow-Radius ist `r*0.48 = 34,6 px` (`lighting.js:212`), und die nächstgelegenen Kachelpunkte der `'c'`-Zellen liegen bei **40,8 px** bzw. **42,0 px**. Beide Decals liegen außerhalb, auch bei maximalem Flicker (38,0 px).

**Hypothese D (ambientTint):** `map_bosskammer.js:82` `ambientTint: '#120608'` = (18,6,8), R−B **+10**, source-over bei `ambient 0.66` (`lighting.js:136-138`). Hebt `'T'` von +5 auf +8,3, den Boden von −12 auf +2,5. Erklärt allein nicht +20..27, addiert aber auf B.

**Kleinster Eingriff:** `'T'` in den 10 Kratzerpixeln von `sprites.js:4149` gegen einen echt kalten Ton unter `'L'` tauschen. Der Bestand hat keinen: die Rampe springt `t` (45,7) → `T` (73,4) → `L` (112,0). Entweder `'L'` mit dichterem `'k'`-Anteil dithern (kein neuer Ton, Luminanz sinkt, R−B bleibt −24), oder Δ(R−B) als Messziel in die Spec schreiben und den Licht-Pass an dieser Stelle prüfen. Der 1 px `'m'` bei (13,13) ist ein `stone_floor`-Erbstück und im gleichen Zug mitzunehmen.

**Risiken:** `floor_decal_crack` ist eine Kopie von `stone_floor`; das Grid trägt keine `variants`, keine Legende ändert sich, `solHash`/`geoHash` unberührt. Der Gate-Text `check_gfx5_art.mjs:459` verbietet `'O'`, ein neues Gate für R−B fehlt und muss mitgeliefert werden.

---

## 3. SPIELER-KONTAKTSCHATTEN IN g5_10 (nur Lokalisierung)

**Zeichenpfad:**
- `main.js:580-595` `drawSoftShadow(ent)`
- `main.js:658` `drawSoftShadow(player);` (im `drawWorld`, nach `drawMarkers()`, vor der `renderables`-Schleife)
- Profile: `main.js:545-547` `SHADOW_W = [0.95, 0.7, 0.4]`, `SHADOW_A = [0.40, 0.20, 0.10]`, `SHADOW_DY = [0, 1, 2]`
- Großprofil (Boss): `main.js:577-579` `SHADOW_W_BIG/SHADOW_A_BIG/SHADOW_DY_BIG` mit `SHADOW_DY_BIG = [-1, 0, 1, 2, 3]`
- Klassifizierung: `main.js:581` `const big = ent.w >= 18 && ent.h >= 20;`
- Spieler-AABB: `player.js:56-57` `w: 12, h: 14`
- Sprite-Zeichnung: `player.js:236-240` (Füße auf AABB-Unterkante, horizontal zentriert)
- Sprite-Maße: `sprites.js:15` `player_down_0`, 16×24
- Szene: `.tmp/shot_gfx5.py:2856` `def g5_10(pw)`, Standkachel `KRONEN_STAND = (20, 18)` im GRAVEYARD (Zeile 2851), Kamera `g5_10` = (168, 204) in `.tmp/g5_cams.json`

**Messung der Geometrie (probe, `player_down_0`):** Sprite-Offset x = px−2, y = py−10. Alle drei Schattenzeilen fallen auf Sprite-Zeilen 23/22/21.

| Zeile | α | Breite | Sprite-Zeile | nicht verdeckte Pixel |
|---|---|---|---|---|
| 0 | 0,40 | 11 px | 23 `...kkkknn.......` | **5** (Spalten 9-13, nur rechts) |
| 1 | 0,20 | 8 px | 22 `...kjjk..nnn....` | **2** (Spalten 7,8) |
| 2 | 0,10 | 5 px | 21 `...kjqk..kkkk...` | **2** (Spalten 7,8) |

Damit sind von den drei Schattenzeilen **9 Pixel überhaupt sichtbar**, und die satteste Zeile liegt asymmetrisch rechts. `GRAVEYARD.ambient = 0.45`, `ambientTint = '#0a0a18'`, Untergrund ist Gras `'e'` (L 31,9).

Das ist derselbe Geometriedefekt, den `main.js:560-566` für den Boss diagnostiziert hat. Der Spieler (12×14) liegt unter der `big`-Schwelle aus `main.js:581` und behält das alte Profil ohne die Zeile unter der Fußkante.

**Risiken bei Änderung:** `SHADOW_*`-Konstanten sind reine Renderwerte, keine Golden-Hashes betroffen. Eine Absenkung der `big`-Schwelle würde auch Skelett/Ghul/Hund/Props umklassifizieren, der Kommentar `main.js:573-576` hält die heutige Trennung fest (Boss 20×24 über, Spieler 12×14 und alle Props unter der Schwelle).

---

## 4. TEICH

### 4a. Specular-Tier, Flachring

**Flachring gemessen (probe, Chebyshev-BFS wie `tilemap.js:673-716`):** GRAVEYARD hat **28 Wasserkacheln**, BBox tx 29-37 / ty 14-18.

- **Ring 0 = Flachring = 24 Kacheln** (`water_shallow`): (32,14) (33,14) | (30,15)-(35,15) | (29,16) (30,16) (35,16) (36,16) (37,16) | (29,17)-(37,17) | (31,18) (32,18)
- **Ring 1 = 4 Kacheln** (`water_mid_calm`): (31,16) (32,16) (33,16) (34,16)
- Ring 2+: **0 Kacheln**

Bei 4-6 px/Kachel ergibt der Auftrag also **96 bis 144 Specular-Pixel** auf 24 Kacheln.

**Heutiger Glanz-Bestand (probe3, `'='`-Zählung):** `water` 7 px, `water_1` 6, `water_2` 6, `water_3` 8; `water_shallow` 26, `_v1` 25, `_v2` 25; `water_mid_calm`/`_v1`/`_v2` **0**; `'i'` (Stahlglanz) kommt in **keiner** Wasserkachel mehr vor. Der frühere Sparkle-Tier ist in GP5 abgeschafft worden, `palette.js:164-166` hält es fest: *"kalter 'i'-Schaum auf den Konkav-Ufern -> 'W'"*.

**Ansatzpunkt:** die Depth-Overlays des Flachrings, also `sprites.js:2227` `water_shallow` sowie `6368`/`6386` `water_shallow_v1/_v2`, weil `variants` auf `anim`-Kacheln verboten ist und der Flachring der einzige statische Träger ist. Der hellste erlaubte Ton ist `'='` `#345358` (L 74,3), eingefroren in `.tmp/check_gfx5_art.mjs:47` `NEW_TONES`. Ein hellerer Ton bräche zwei Bestandsauflagen zugleich (`palette.js:66-67` Sättigung unter `'A'`, `palette.js:180-182` Wasser nicht hellster Ton im Frame).

### 4b. Ufer-Ziernaht entregeln

**Sprites:** `sprites.js:3866` `shore_n`, `3884` `shore_s`, `3902` `shore_e`, `3920` `shore_w`; Ecken `3938`-`4069` (`shore_ne/nw/se/sw`, `shore_ine/inw/ise/isw`); Kappen `6077`-`6203` (`shore_cap_*`); 45-Grad-Treppe `6536`-`6590` (`shore_diag_ne/nw/se/sw`); Uferband auf der Landseite `5771`-`6053` (`bank_*_g|s`) plus `6608`-`6644` (`bank_n_g_v1..v3`). Emissionslogik: `tilemap.js:158-176` (fringe), `tilemap.js:238-285` (shoreEdges/Caps/Diag), `tilemap.js:297-…` (bankOverlays).

**Gemessen (probe2):**

1. **Lichtrichtung fehlt vollständig.** `shore_n` Mittel **45,5 L**, `shore_s` Mittel **45,9 L**, `shore_e` 45,7, `shore_w` 45,7. Die hellste Zeile von `shore_n` (Zeile 1, L 60,0) und die hellste von `shore_s` (Zeile 14, L 60,0) sind **wertgleich**. `shore_n` Zeile 0 und `shore_s` Zeile 15 sind sogar **byte-identisch**: `'WWWW..WWWWW..WWW'`.
2. **Doppelkontur, sogar Tripel.** Voll belegte (durchgehende) Linien: `shore_n` Zeilen **1,2,3**; `shore_s` Zeilen **12,13,14**; `shore_e` Spalten **12,13,14**; `shore_w` Spalten **1,2,3**. Drei ununterbrochene Konturzeilen je Kachel.
3. **Stufenrhythmus.** Das identische Lückenmuster `'WWWW..WWWWW..WWW'` steht in N und S an derselben Stelle; die Unterbrechungen sitzen bei x4/x5 und x11/x12, also periodisch alle 6-7 px.
4. **45-Grad-Schraffur.** `shore_diag_ne` (`sprites.js:6536`) hat 5 volle Zeilen (0,1,2,3,6) und 2 volle Spalten (12,14); das Muster wiederholt sich exakt alle 4 Zeilen (`'wW9.WWWWnEaeeeEe'` ab Zeile 4 ist Zeile 0 um 4 versetzt). Das ist die zu kappende Schraffur.

### 4c. Wegsporn bis ANS Wasser

**Map-Zeilen (`maps.js`, GRAVEYARD_ROWS):**
- Zeile **80** (ty=13) und **79** (ty=12): der durchgehende Hauptweg `'#================================='`
- Zeile **81** (ty=14): `'#I,..b...F..fiif........,..s=.dy~~....T#'`, Index 28 = `'='` (letzte echte Weg-Kachel des Sporns)
- Zeile **82** (ty=15): `'#ee..Gkg....IGjhI.......III.pp~~~~~~w.T#'`, Index **27 = `'.'`**, Index **28/29 = `'p'` `'p'`**, Index **30 = `'~'`**

Der Sporn ist also `(28,13)='='` → `(28,14)='='` → `(28,15)='p'` → `(29,15)='p'`, und `(29,15)` grenzt bereits orthogonal ans Wasser `(30,15)`.

**Der Befund ist optisch, nicht topologisch (probe3):** `pebble_small` (`sprites.js`, Grid gemessen) besteht zu **226 von 256 Pixeln aus dem Gras-Grundton `'e'`**, Mittel-Luminanz **39,1**. `path`/`path_v6` liegen bei **90,9 / 91,5**. Die letzte als Weg lesbare Kachel ist damit `(28,14)`; die beiden Trittsteine lesen als Gras mit Kieseln. **Der Weg endet visuell 32 px vor dem Wasser.**

**RISIKO, gemessen (probe4), sehr ernst:** ein naheliegender Tausch `(29,15) 'p' → '='` reißt die gesamte Ufer-Emission um, weil `'p'` `fringeSource:true` trägt und `'='` `fringeTarget:true`:

| Zelle | heute | nach `p → =` |
|---|---|---|
| (30,15) `~` | fringe `[shore_inw]`, shore `[shore_cap_ws, shore_diag_nw]` | fringe `[shore_n]`, shore `[shore_w, shore_cap_ws, shore_diag_nw]` |
| (29,16) `~` | fringe `[shore_inw]`, shore `[shore_cap_ne, shore_diag_nw]` | fringe `[shore_w]`, shore `[shore_n, shore_cap_ne, shore_diag_nw]` |
| (29,15) | fringe `[]` | fringe `[fringe_n, fringe_w]` (Gras-Fransen auf dem Weg) |
| (29,14) `.` | bank `[]` | bank `[bank_se_g]` (neues Uferband auf einer Nicht-Ufer-Kachel) |

**Kleinster sinnvoller Eingriff:** kein ROWS-Tausch auf `'='`, sondern ein **neues Art-Grid im Weg-Ton auf einer `fringeSource`-Legende** (Kacheldichte wie `pebble_small`, Ton wie `path`), oder eine zusätzliche Legendenzeile mit `fringeSource: true, fringeSet: 'grass', bankSet: 'g'` und Weg-Art. Dann bleiben alle Emissionen byte-gleich.

**Risiken Punkt 4 gesamt:** ROWS-Änderungen sind für `solHash` nur dann neutral, wenn das getauschte Zeichen denselben `solid`-Wert trägt; im GRAVEYARD ist `'~'` **solid: true** (`maps.js:345`), alle Landzeichen sind `solid: false` (probe4-Tabelle). `geoHash` bricht, sobald eine Fackel-, Spawn-, Prop- oder Portalzelle betroffen ist. `fringeOverlays`/`shoreEdges`/`bankOverlays` sind im Smoke mit expliziten Wahrheitstabellen eingefroren (`tools/smoke_test.mjs:2171-2232`, insbesondere 2183-2215 für die Komplement-Regel und 2215 "der Friedhofsteich hat rohe Kanten > 0"). `'='` als Palettenton ist in `check_gfx5_art.mjs:47` byte-eingefroren.

---

## 5. GRAS

### 5a. Kachelmittel-Streuung (Steppdecke)

**Fundstellen:** 47er-Pool verdrahtet in `maps.js:162-174` (`'.'`), Teil-Pools `maps.js:181-188` (`','`, n=13) und `maps.js:311-317` (`'e'`, n=9). Grids: `sprites.js:4718` ff. `grass_g5_00..46`.

**GEMESSEN (probe, Kachelmittel-Luminanz über alle nicht-transparenten Pixel):**

```
n=47  Mittel 34,95  MIN 32,24 (grass_g5_02)  MAX 38,29 (grass_g5_41)
SPANNE 6,05 L   Std-Abw 1,88   Ausreisser |dL| > 4: 0 von 47
```

**Der 47er-Pool erfüllt die Auflage ±2-4 L bereits** (±3,0 um den Mittelwert). Die Steppdecke kommt woanders her, nämlich aus den **Wiesenlicht-Klassen** (`maps.js:240-291`):

| Klasse | Kachelmittel | Delta zum Pool-Mittel |
|---|---|---|
| `grass_lumahi` | **65,57** | **+30,6** |
| `grass_lumahi_mix75` | 59,04 | +24,1 |
| `grass_lumahi_mix` | 49,95 | +15,0 |
| `grass_lumalo` | 44,50 | +9,6 |
| `grass_lumalo_mix75` | 42,68 | +7,7 |
| `grass_lumalo_mix` | 39,15 | +4,2 |
| `grass_dark_v3` (`'e'`) | 34,63 | −0,3 |
| 47er-Pool | 34,95 | 0 |

**Spanne der gerenderten Wiese: 34,6 bis 65,6 L, also 31,0 L.** Anmerkung nebenbei: `grass_lumalo` ("lo" = dunkel) liegt mit 44,5 **über** dem Grundgras, die Klasse hellt auf statt abzudunkeln.

**Kleinster Eingriff:** nicht am 47er-Pool ansetzen, sondern die sechs Wiesenlicht-Grids (`sprites.js`, Keys `grass_lumahi`, `grass_lumahi_mix75`, `grass_lumahi_mix`, `grass_lumalo`, `grass_lumalo_mix75`, `grass_lumalo_mix`) auf ±2-4 L um 34,95 zusammenziehen. Die Legenden in `maps.js:240-291` bleiben dabei unberührt, also auch das n=7-Gesetz.

### 5b. Nacht-Dither, 1px-Schachbrett

**Ich habe im gesamten `TILE_ART`-Bestand nach echtem 1px-Schachbrett gesucht (probe3, strenge Definition: alle 4 Orthonachbarn andersfarbig UND gegenüberliegende gleich). GENAU EIN TREFFER:**

**`sprites.js:4691` `canopy_shadow`**, 78 % Schachbrett-Anteil, 83,6 % Deckung, exakt alternierend aus `'n'` (`#221c26`, L 30,9) und `'0'` (`#0f1a12`, L 21,7):

```
'.n0n0n0n0n0n0n0.',
'n0n0n0n0n0n0n0n0',
'0n0n0n0n0n0n0n0n',
```

Das ist der Kronen-Schlagschatten und liegt ausschließlich auf Gras. Gezeichnet im Ground-Pass: `tilemap.js:755-759` (Ableitung aus `overCells`) und `tilemap.js:1022` `const shimg = tileCanvases['canopy_shadow'];`. Er schwingt bewusst nicht mit dem Sway (`tilemap.js:929`, `941`).

Nebenbefund: `.tmp/check_gfx5_art.mjs:452` verbietet den Ton `'0'` als *"alter unsichtbarer '0'-Kontaktschatten"* in den Props, `canopy_shadow` behält ihn.

**Kein anderer 1px-Schachbrett-Kandidat existiert.** Der 47er-Gras-Pool hat einen Median-Alternanzscore von 7,1 % (Maximum `grass_g5_12` mit 17,3 %). `licht_dither_1/_2` (`sprites.js:4092`/`4110`) sind Streupixel, keine Schachbretter, und laufen nur auf `LIT_FLOOR_MAPS` (`main.js:524`), also **nicht** auf dem Friedhof. Die Vignette (`hud.js:445-500`) ist bereits Bayer-4x4 (`hud.js:454` `BAYER4`, `hud.js:494`). Die `_mix`-Kacheln waren früher Schachbretter, sind seit GP5-R2 Klumpenstempel (`sprites.js:4243-4252`, "kleinste Periode x=16, y=16").

Falls die Spec eine andere Stelle meint, muss der Juror-Wortlaut aus der R3-Task-Ausgabe nachgezogen werden. Aus dem Code heraus ist `canopy_shadow` der einzige Kandidat.

### 5c. Halm-Größenklassen

**Gemessen (probe2, Glyph = alle Pixel außer Grundton `'e'`):**

| Key | Glyph-Pixel | BBox | Legende |
|---|---|---|---|
| `grass_tuft` | 53 | 9×11 | `maps.js:200` `'u'` |
| `grass_tuft_r1` | 53 | 11×9 | `'u'` |
| `grass_tuft_v1` | 62 | 10×12 | `'u'` |
| `grass_tuft_f1` / `_f2` | 53 / 53 | 9×11 / 10×11 | `maps.js:213` `'w'` (anim) |
| `grass_blade` | 19 | 3×11 | `maps.js:201` `'j'` |
| `grass_blade_v1` | 17 | 3×10 | `'j'` |
| `grass_blade_r1` | 19 | 11×3 | `'j'` |
| `grass_blade_f1` / `_f2` | 19 / 19 | 5×11 / 4×11 | `maps.js:214` `'y'` (anim) |
| `grass_speck` / `_v1` / `_r1` | 6 / 6 / 6 | 3×3 | `maps.js:202` `'k'` |

Es gibt heute **drei** Klassen (53-62 / 17-19 / 6 Pixel), innerhalb jeder Klasse ist die Größe praktisch konstant. Die Streuung liegt in Rotation und Spiegelung, nicht in der Größe.

**Risiken Punkt 5:** Alle drei Teilaufgaben sind reine Grid-Änderungen in `sprites.js`. Die Legenden `maps.js:200-214`/`240-291` dürfen ihre `variants`-Längen (3, 3, 3, 7, 7, 7, 7, 7, 7) nicht ändern, sonst schlägt der Ungerade-n-Wächter zu (`smoke_test.mjs:2413-2426`, `check_gfx5_art.mjs:300-305`). Neue Halm-Grids anzuhängen verlangt, dass die Listenlänge ungerade bleibt.

---

## 6. KRONEN-POSEN UND BLATTCLUSTER

**Gemessen (probe2): Es existieren 14 Kronen-Grids und NULL Sway-Posen.**

| Key | Größe | Deckung | Zeile |
|---|---|---|---|
| `tree_canopy` | 16×16 | 64,1 % | `sprites.js:3213` |
| `tree_canopy_top` | 16×16 | 56,6 % | 3231 |
| `tree_canopy_bottom` | 16×16 | 62,9 % | 3249 |
| `tree_canopy_v1` | 16×16 | 39,1 % | 6273 |
| `tree_canopy_v2` | 16×16 | 71,1 % | 6291 |
| `tree_canopy_2x2_a` / `_b` / `_c` | 32×32 | 44,9 / 53,6 / 29,2 % | 3276 / 3313 / 3347 |
| `tree_canopy_2x2_am` / `_bm` / `_cm` | 32×32 | 45,3 / 53,9 / 29,0 % | 3385 / 3419 / 3453 |
| `tree_canopy_back_a` / `_b` / `_c` | 32×32 | 24,1 / 27,8 / 20,5 % | 4473 / 4507 / 4541 |
| `canopy_shadow` | 16×16 | 83,6 % | 4691 |

Suche nach Pose-Suffixen (`_f1`, `_f2`, `_s0`, `_pose`) über alle `tree_canopy*`-Keys: **KEINE**.

**Der Sway ist heute reine Translation, kein Grid-Wechsel:**
- `tilemap.js:564` `const SWAY_DX = [0, 1, 0, -1];`
- `tilemap.js:931` (2x2-Span-Anker, Amplitude ±1 px): `ax += swayPhase(tx, ty, timeSec, CROWN_SWAY_RATE).dx;`
- `tilemap.js:955` (16×16-Hängekronen, Amplitude ±2 px): `ax += swayPhase(tx, ty, timeSec, CROWN_SWAY_RATE).dx * HANG_SWAY_AMP;`
- `tilemap.js:572` `const HANG_SWAY_AMP = 2;`, `tilemap.js:568` `CROWN_SWAY_RATE = 1.6`

Die Kommentare halten das selbst fest (`tilemap.js:560-563`): *"Die volle 4-Phasen-Auslenkung IST bereits sichtbar auf den KRONEN: der Over-Layer ist transparent, dort wird SWAY_DX als echter Pixel-Versatz gezeichnet"*.

**Zwischenstand gegen den Auftrag:** "5 echte Posen" bedeutet 5 neue Grid-Sätze je Silhouette, heute existieren 0. "Scherung statt Translation (0/+1/+2 nach Höhe)" ist mit dem heutigen Pfad **nicht** erreichbar, weil `drawImage` die ganze Kachel um ein `dx` verschiebt; eine höhenabhängige Scherung muss entweder in die Grids gebacken (Posen) oder zeilenweise gezeichnet werden.

Verdrahtung der Kronen: `maps.js:117-146` (`'B'` mit n=3, `'K'`, `'C'` mit n=3, `'M'/'N'/'O'/'Q'/'V'/'X'` span 2×2, `'Y'/'Z'/'A'` Back-Kuppen), Setzung in `GRAVEYARD_OVER_ROWS` `maps.js:378-403`.

**Risiken:** neue Kronen-Grids anhängen heißt `variants`-Listen verlängern (`maps.js:119` n=3, `maps.js:124` n=3); die neue Länge muss **ungerade** bleiben und teilerfremd zu 5/7/17/29/47 (`smoke_test.mjs:2413-2426`). Der Anker-Offset `anchorOffset` (`tilemap.js`, §4.C2) und das Culling `tilemap.js:903-905` (`maxSpanH-1`, `+1`) hängen an `def.span`; die Smoke-Guards in `GRAVEYARD_OVER_ROWS` (Zeile 12 und Spalte 21 bleiben leer, `maps.js:374-375`) dürfen nicht belegt werden. Alle Anker-/Determinismus-Tests messen bei `timeSec = 0`, wo `SWAY_DX[0] = 0` ist; jede Pose muss diese Ruhelage identisch reproduzieren.

---

## 7. HUD

### 7a. XP-Trog-Kontrast und Farbidentität

**Fundstellen:** `hud.js:177-220`, Blockkommentar 170-176.
- Rahmen `hud.js:184` `'#14101a'` (L 18,3)
- **Rinne `hud.js:187` `'#3a3542'` (L 56,0)** = Palettenton `'g'` Stein dunkel
- Füllung oben `hud.js:198` `'#9a90a6'` (L 149,5), unten `hud.js:200` `'#7d7588'` (L 121,6) = Palettenton `'S'` Stein hell
- Anfangs-Schimmer `hud.js:206` `'#f1e9d3'` (L 232,9)
- Bevel `hud.js:211` `'#575061'` α 0,4, `hud.js:216` `'#14101a'` α 0,5

**Gemessen:** Kontrast Rinne → Füllung **65,6 L**. Zum Vergleich der Boss-Balken: Rinne `hud.js:264` `'#3a2320'` (L 41,5) → Lag `hud.js:275` `'#b8a09c'` (L 166,7), also **125,2 L**, fast das Doppelte.

**Farbidentität:** die XP-Leiste besteht ausschließlich aus der grau-violetten Stein-Rampe (`g`/`S`/`575061`), also demselben Material wie das Panel. Der Boss-Balken hat mit `'#3a2320'` einen eigenen rotbraunen Farbort. Die XP-Leiste hat keinen.

### 7b. GOLD-Null liest als Theta

**Fundstellen:** `hud.js:146` `ctx.font = '8px monospace';` und `hud.js:154-157`:

```js
ctx.fillStyle = '#14101a';
ctx.fillText(`GOLD ${player.gold}`, 5, 16);
ctx.fillStyle = '#f0bf4e';
ctx.fillText(`GOLD ${player.gold}`, 4, 15);
```

**Ursache liegt hier:** der GOLD-Wert wird als **System-Font gerendert**, nicht aus einem Pixel-Grid. Die Null vieler Monospace-Fonts trägt Schrägstrich oder Innenpunkt und liest bei 8 px Kantenlänge als Θ. Weitere Fundstellen desselben Musters: `hud.js:162` (Trankzähler), `hud.js:539` und `hud.js:557` (`GOLD: ${player.gold}` in Game-Over/Victory, `'8px monospace'` via `centerText`). Es gibt im Bestand **keine** Ziffern-Grids in `sprites.js`.

### 7c. Lag-Geist-Rampe

**Fundstelle:** `hud.js:267-279`.

```js
const lagW = Math.max(fw, Math.min(iw, Math.round(bb.lagW ?? fw)));
if (lagW > fw) {
  ctx.fillStyle = '#b8a09c';                 // entsaettigt hell
  ctx.fillRect(ix, iy, lagW, ih);
  ctx.fillStyle = '#7d6a67';                 // Unterkante des Lag-Streifens
  ctx.fillRect(ix, iy + ih - 1, lagW, 1);
}
```

Die Lag-Schicht ist **ein Flachton über alle 8 Innenzeilen** plus 1 px Unterkante, also 2 Werte. Die Füllung daneben trägt eine echte 8-Zeilen-Rampe (`hud.js:289-294`, `BOSS_FILL_RAMP`, ein Ton je Zeile). Der Lag-Geist bricht damit genau die Rampen-Sprache, die R2/R3 für den Balken durchgesetzt haben.

### 7d. Flammen-Wertegefälle, Kern gehört an den Docht

**Fundstellen:** `sprites.js:4149` liegt daneben, die Flammen sind `sprites.js:2867` `torch_0`, `2885` `torch_1`, `4654` `torch_2`, `2906` `torch_wall_0`, `2925` `torch_wall_1`, `4672` `torch_wall_2`. Kommentarblock 2830-2866 dokumentiert den GP5-R3-Umbau. Gate: `.tmp/check_gfx5_art.mjs:462-471` (breiteste Zeile ≤ 5 px über `o`/`y`/`1`).

**Gemessen (probe2, Silhouette 5 breit × 8 hoch bestätigt):**

| Zeile | `torch_0` Glyph | Luminanz |
|---|---|---|
| 0 | `.......1........` | **233,1** |
| 1 | `......y1y.......` | 206,2 |
| 2 | `......y11y......` | 212,9 |
| 3 | `.....yy1yy......` | 200,8 |
| 4 | `......oyyo......` | 164,5 |
| 5 | `......oyyo......` | 164,5 |
| 6 | `......oyyo......` | 164,5 |
| 7 (Glutzeile am Docht) | `......orro......` | **94,0** |

**Das Wertegefälle ist streng invertiert:** hellster Punkt an der Zungenspitze (233,1), dunkelster am Docht (94,0), Spanne 139,1 L monoton fallend nach unten. Identisch in `torch_1`, `torch_2` (Zeile 0 = 233,1, Zeile 7 = 94,0) und in beiden Wandfackeln (`torch_wall_0/_1`, Zeile 0 = 233,1, Glutzeile 5 = 94,0, Silhouette 5×6). Der Kern `'1'` (`#ffe9b0`) liegt in allen sechs Grids ausschließlich in den Zeilen 0-3.

**Risiken Punkt 7:** `hud.js` zeichnet ausschließlich mit `fillRect`/`fillText`; die Boss-Flusstests hängen am `ambientAlpha`-Detektor (erstes Teilalpha-`fillRect` auf dem Lighting-Offscreen, `lighting.js:136-138`), Reihenfolge und Composite-Hygiene sind in `hud.js:181/219` und `hud.js:242/305` per `save/restore` gekapselt. Die GOLD-Textzüge werden von Flusstests per `find`/`startsWith` auf `'GOLD <n>'` gelesen (`hud.js:151-153`), ein Ersatz durch Pixel-Ziffern bricht diese Tests. Die Flammen-Umkehr muss das 5-px-Breitengate `check_gfx5_art.mjs:462-471`, die Flächenauflage ±20 % (heute 29/28/30 bzw. 21/21 Texel) und das Weiß-Verbot aus `lighting.js:60-86` (HOT_RINGS-Rechnung) halten; mehr `'1'`-Texel unten am Docht laufen direkt in den additiven Hotspot hinein.

---

## Querschnitt: Risiko-Matrix

| Eingriff | `solHash` | `geoHash` | fringe/shore/bank eingefroren | Ungerade-n | eingefrorene Töne |
|---|---|---|---|---|---|
| P1 `depthOverlays`-Key (`map_fluestergruft.js:97`) | sicher | sicher | nein | nein (n=3 bleibt) | nein |
| P2 Kratzer-Ton (`sprites.js:4149`) | sicher | sicher | nein | nein | `check_gfx5_art.mjs:459` prüft nur `'O'` |
| P3 `SHADOW_*` (`main.js:545-581`) | sicher | sicher | nein | nein | nein |
| P4a Specular (`sprites.js:2227/6368/6386`) | sicher | sicher | nein | nein | **`'='` in `check_gfx5_art.mjs:47`** |
| P4b Ufer-Grids (`sprites.js:3866-4069`, `6536-6590`) | sicher | sicher | **Emission ja** (`smoke:2171-2232`), Grid-Inhalt nein | nein | nein |
| P4c Wegsporn ROWS (`maps.js:81-82`) | nur bei gleichem `solid` | **bricht bei Fackel/Spawn/Portal** | **JA, gemessen in probe4** | nein | nein |
| P5 Gras-Grids (`sprites.js`) | sicher | sicher | nein | **ja bei Listenlänge** | nein |
| P6 Kronen-Posen (`sprites.js`, `maps.js:119/124`) | sicher | sicher | nein | **ja** (`smoke:2413-2426`) | nein |
| P7 HUD (`hud.js`) + Flammen (`sprites.js`) | sicher | sicher | nein | nein | Flammen-Gate `check_gfx5_art.mjs:462-471` |


---

# TEIL 6: Mess-Infrastruktur & Messziel-Entwürfe


Server auf 8124 wieder gestoppt, keine Spieldatei berührt.

---

# GP6-Landkarte: Mess- und Gate-Infrastruktur + Entwurf Messziel-Abnahme

## 0. Kurzfassung

Die GP5-Infrastruktur ist für GP6 zu ~80 % wiederverwendbar: Rig, Kamera-Disziplin, Crop-/Strip-Werkzeug und 9 der 27 Gates lassen sich unverändert übernehmen, 5 weitere sind zu erweitern. Für alle fünf geforderten Messziel-Felder existiert ein implementierbares Verfahren; für die beiden riskantesten (Licht-Quantisierung, Sprite-Licht) habe ich das Verfahren in `.tmp/` **kontrolliert nachgewiesen** (Positiv- und Negativ-Kontrolle bestanden) und IST-Werte gemessen. Das entscheidende Ergebnis vorweg: der 3-Kanal-Schätzer für die Restdunkelheit reproduziert exakt die sechs `PUNCH_RINGS` aus `lighting.js` und misst **77 distinkte Lichtstufen bei nur 65,7 % Plateau-Anteil** (Sollbild Hebel 1: ≤ 12 Stufen, ≥ 95 % Plateau).

---

## 1. `.tmp/shot_gfx5.py` (4163 Zeilen) vollständig kartiert

### 1.1 Rig (Zeilen 73-251) — GP6 unverändert übernehmbar

| Baustein | Datei:Zeile | Was es tut |
|---|---|---|
| `INIT_JS` | `shot_gfx5.py:73-105` | `performance.now`-Wrapper mit `window.__timeScale`; `__armFreeze(condSrc, timeoutMs)` friert die Zeit ein, sobald eine Bedingung greift |
| Modul-Wrapper via Route-Interception | `:107-246` | `player/enemies/projectiles/props/tilemap/particles/hud/lighting` werden per `page.route(ROUTE_RE, route_handler)` durch `.tmp`-Wrapper ersetzt. **Spieldateien bleiben unangetastet** |
| Mess-Schalter | `:157-231` | `__noOver` (Over-Layer aus), `__noLitDither`, `__noFog`, `__noVignette`, **`__noLight`** (unterdrückt `lighting.draw` komplett) |
| Introspektion | `:157-181` | `window.__map` (`defAt`/`findTiles`), `__camera`, `__tiles`, `__timeSec`, `__player`, `__enemies`, `__particles` |
| Kamera-Disziplin | `:441-479` | `settle_camera()` + `assert_int_camera()`: **nicht-ganzzahlige Kamera = FEHLER** in jeder Szene |
| Crop/Strip | `:913-967` | `crop_zoom()` 6× NEAREST, `join()`/`panel_from()` für Strips |
| Teillauf-Merge | `:4047-4106` | `GATE_ERROR_TAGS` ordnet Alt-Fehler den Gates zu; ein Teillauf überschreibt **nur** die neu gemessenen Gates, nicht zuordenbare Alt-Fehler werden konservativ behalten |

**Für GP6 kritisch:** `WRAP_LIGHTING` (`:218-231`) existiert bereits und ist exakt der Hebel, mit dem sich das Lichtfeld isoliert messen lässt:

```js
export function createLighting(viewW, viewH) {
  const L = __cl(viewW, viewH);
  const __draw = L.draw;
  L.draw = function (...a) {
    if (window.__noLight) return undefined;
    return __draw.apply(L, a);
  };
  return L;
}
```

### 1.2 Metrik-Werkzeugkasten (Zeilen 494-960) — GP6 wiederverwendbar

| Funktion | Zeile | Kennzahl |
|---|---|---|
| `crop_changed_pct` | 508 | Anteil geänderter Texel zwischen zwei Bildern (Kanalabstand > thresh) |
| `internal_crop_rgb` / `internal_crop_L` | 530 / 538 | Rückskalierung des 1280×720-Shots auf die internen 320×180-Texel (NEAREST) |
| `run_lengths` | 548 | mittlere Lauflänge gleicher Werte je Zeile |
| `anisotropy_rgb` | 598 | Zweitwert (quantisierte RGB-Läufe, `ANISO_QUANT = 8`) |
| **`anisotropy_hell`** | 676 | **Juror-Metrik**: mittlere waagerechte/senkrechte Laufweite HELLER Pixel (hell := L > Median + `ANISO_HELL_OFFSET = 8`) |
| `wcag_lum` / `luma601` / `luma_ratio` / `wcag_ratio` | 699 / 711 / 717 / 730 | zwei Luminanz-Systeme parallel; `luma_ratio` ist die **rekonstruierte Juror-Arithmetik** (Juror teilte Luma, nicht WCAG) |
| `two_means` | 760 | 1D-k-means (2 Cluster) |
| `longest_straight_boundary` | 781 | längster gerader Klassen-Kantenlauf |
| `depth_zone_edges` | 820 | „schwarze Rechtecke", längster harter Zonenrand |
| `count_tone_texels` | 903 | Texel im Toleranzband um einen Zielton |

### 1.3 Die 27 Gates (Stand `g5_proof_results.json`, alle `pass=true`)

| # | Gate | Szene | Fenster (Welt-Rect) | Schwelle | Kontrolle | GP6 |
|---|---|---|---|---|---|---|
| 1-3 | `archiv_gp4_final`, `archiv_gp5_runde1`, `archiv_gp5_runde2` | `check_archive*` :1003/1042/1084 | – | Soll-Dateilisten `GP4_ARCHIV_SOLL` :990, `GP5_R1_..` :1023, `GP5_R2_..` :1060 | – | **übernehmen** (neu: `gp5_runde3`) |
| 4 | `teich_fenster_9lauf` | g5_01 | `TEICH_RECT=(464,256,512,288)` :1101 | Modus 1,5-15 % über **9 Läufe**, Erkennung `TEICH_DIFF_THRESH=10` :1136 | **Positiv** (R2-Archiv ≥ 6,9 %) + **Negativ** (`TEICH_NEG_RECT=(288,224,432,256)`, < 0,5 %) :1146 | Muster übernehmen |
| 5 | `teich_glanz` | g5_01 | dito | > 20 `'='`-Texel, `GLANZ_RGB=#345358`, tol 20 :1107 | enge Zählung tol 6 als Zweitwert | – |
| 6 | `wasser_anisotropie` | g5_01 | Crop (b) 32×32 | ≥ 2,5 (Juror-Zahl) | **Pflicht-Validierung** auf R1-Archiv, Band `ANISO_R1_BAND=(0.75,1.35)` :647 | Muster übernehmen |
| 7 | `wasser_anisotropie_r1_kontrolle` | g5_01 | R1-Archivbild | „nahe 1,03" | ist selbst die Kontrolle | **Vorbild** |
| 8 | `schwarze_rechtecke` | g5_01 | `depth_zone_edges` :820 | längster harter Rand ≤ 8 px | – | – |
| 9 | `teich_kamm_tal` | g5_01 | Teich-Crop | Luma-Verhältnis (Juror-Arithmetik) | WCAG-Wert läuft als Zweitwert mit | – |
| 10 | `bank_unterdrueckung` | g5_01 | ganze Karte (Engine) + Crop | 0 warme Texel im Becken UND 0 Engine-Verletzer | Engine-Seite + Bild-Seite doppelt | **Muster: Engine+Bild** |
| 11 | `ziegel_luminanz_gesichter` | g5_03 | `KATA_ZIEGEL_RECT=(192,112,256,176)` :1826 | ≥ 4 Gesichter à ≥ 20 Texel, ≥ 4 `'#'`-Varianten :1845-1847 | – | – |
| 12 | `reflexion` | g5_04 | `KANAL_REFLEX_RECT=(296,152,376,264)` :2009 | warme Texel ⊆ Reflexionszellen ∪ Fackelnähe (`TORCH_RADIUS=72` :2017); Crop (i) > 15 | Spieler-Sprite ausgeschlossen | – |
| 13 | `reflexion_orientierung` | g5_04 | dito | Diagnose (`pass=None`) | – | – |
| 14 | `funken` | g5_07 | `FUNKEN_RECT=(240,60,256,92)` :2319 | peak ≥ 10 % | **Fenster-Validierung**: Hülle y 63..90 über 6 Panels gemessen, altes GP4-Fenster dokumentiert verworfen (:2308-2318) | **Vorbild Fenster-Nachweis** |
| 15 | `funken_wolkenbreite` | g5_07 | dito | Kern ≤ 10 px | – | – |
| 16 | `funken_realfenster` | g5_07 | GP4-Altfenster | Diagnose | ist die Gegenprobe | – |
| 17 | `funken_warm` | g5_07 | Crop (h) | 0 reine Weiß-Texel außerhalb `EMBER_CORE_R_PROOF=3` | – | – |
| 18 | **`lit_texel`** | g5_09 | Kegel `CONE_RECT=(272,272,352,304)`, Referenz `REF_RECT=(112,240,144,272)` :2777 | > 30 Texel über `ref_p95 + 8` | **eingebaute Referenzfläche** = Negativ-Kontrolle | **direkt weiterverwenden** |
| 19 | **`unter_kronen`** | g5_10 | Sprite-Box `(cx-8, cy-17, +16, +24)` | ≥ 20 verdeckte **Kopf**-Texel (`KRONEN_HEAD_ROWS=9`) :2849-2853 | **A/B/C/D-Vierfachaufnahme** + Kamera-Drift-Assertion | **Basis für Messziel (d)** |
| 20 | `klassenkanten` | g5_11 | 6 Wiesen-Kameras :2966 | längster gerader Lauf ≤ 3 Kacheln, **Maximum über Q ∈ {2,3,4,6,8}** :2969 | 5 Mess-Schalter aus, Fremd-Overlays ausgeschlossen (:2936-2965) | **Vorbild „ungünstigste Quantisierung"** |
| 21 | `wegsporn` | g5_12 | `WEGSPORN_CROP_RECT=(432,208,496,272)` :3778 | 3 Sporn-Kacheln komplett im Fenster | Soll-Zeichen `WEGSPORN_SOLL` :3776 | – |
| 22 | `boss_damage_lag` | g5_13 | `BOSS_BAR_INNER=(122,9,198,17)` :3877 | Füllanteil 0,55..0,65 UND Lag-Streifen ≥ 4 px | – | – |
| 23 | `sway_gate` | strip_sway | `SWAY_RECT=(272,288,336,352)` :3236 | b1 Vorzeichen gleichsinnig im Cluster, b2 ≥ 3 verschiedene dx (`SWAY_MIN_DX_WERTE`), Totband 0,05 px | **`SWAY_REF_TILE=(16,20)` statische Kontrollkachel, die sich NICHT ändern darf** :3237 | **Vorbild Negativ-Kontrolle** |
| 24 | `kanal_residuum` | kanal | Kanal-Fenster | Residuum-Drift abwärts | – | – |
| 25 | `kanal_anisotropie` | kanal | `KANAL_ANISO_RECT` | ≥ 2,5 längs der Fließachse | – | – |
| 26 | `png_sanity` | `png_size_gate()` :3991 | alle `g5_*`/`strip_*` PNGs | Vollbild > 5 KB; Crop/Strip ≥ 8 Farben | Werkzeug-Selbsttest, ausdrücklich **kein Spec-Schwellwert** | **übernehmen** |
| 27 | `konsolenfehler` | `main()` :4130 | – | 0 | – | **übernehmen** |

Szenen-Registry: `SCENES` in `shot_gfx5.py:3982-3989` (13 Szenen + 3 Strips + Kanal).

### 1.4 Die etablierte Mess-Disziplin (bindend, Übergabe §Bindende Erkenntnisse Nr. 2)

Wörtlich aus `uebergaben/2026-08-07_grafikpass5.md`:

> 2. Mess-Disziplin: Gates brauchen (a) die JUROR-eigene Metrik, (b) validierte Fenster (fransenfrei/spielerfrei), (c) Positiv- UND Negativ-Kontrollen bei jeder Methoden-Änderung, (d) Modus über 9 Läufe statt Einzelrender. Alle Justierungen sind im Code begründet; Schwellen wurden NIE angepasst.

Die vier Regeln mit ihrem Beleg im Code:

**(a) Juror-eigene Metrik.** `shot_gfx5.py:615-647`:
> ENTSCHEID: das Gate misst ab hier die JUROR-EIGENE Kennzahl, nicht mehr eine selbstgebaute Ersatzgroesse. […] Ein Gate, das gegen die Jury-Zahl 2,5 prueft, muss die Groesse messen, aus der die 2,5 stammt; sonst vergleicht es zwei verschiedene Dinge.

**(b) Validierte Fenster.** `FUNKEN_RECT` wurde verschoben, aber nur mit Nachweis (`:2308-2318`): „gemessene Huelle aller Funken ueber 6 Panels: y 63..90. Das alte Fenster (y 48..78) schneidet davon nur den obersten Zipfel an und misst sonst leeren Himmel". Das alte Fenster läuft als `funken_realfenster` weiter mit. Ebenso `TEICH_NEG_RECT` (`:1140-1146`): alle 18 Kacheln per `m.defAt()` geprüft, `anim=0`, kein Prop/Kronen-Span, **und** der Nicht-Leer-Beleg „105 verschiedene Farben, Luma-SD 11,1".

**(c) Positiv- UND Negativ-Kontrolle bei Methoden-Änderung.** `shot_gfx5.py:1305-1312`:
> Die Erkennungsschwelle des Gates ist von >24 auf >10 gesenkt worden […]. Eine Schwellensenkung ist nur dann eine Messkorrektur und keine Schoenrechnung, wenn sie (1) auf dem alten Material mindestens so viel Bewegung findet wie die alte Schwelle und (2) auf unbewegtem Material weiterhin nahe Null misst. Beides wird bei JEDEM Lauf nachgewiesen.

Und die Konsequenz (`:1341-1343`): „Das Gate ist NUR bestanden, wenn der Fensterwert stimmt UND die Messung selbst validiert ist. Eine gesenkte Schwelle ohne bestandene Validierung darf kein gruenes Gate erzeugen." Beim Anisotropie-Gate identisch (`:640-644`): „Liegt sie dort nicht nahe 1,0, misst der Nachbau nicht die Juror-Metrik — dann wird FEHLER gemeldet statt PASS."

**(d) Modus über 9 Läufe.** `TEICH_RUNS = 9` (`:1109`), Modus-Bildung `shot_gfx5.py:1270-1276`: auf 0,1 % gerundet, häufigster Wert, bei Gleichstand der kleinste. Zusätzlich werden alle 9 Einzelwerte, `min`, `max` und `max_cam_drift_px` mitgeschrieben.

**(e) Schwellen NIE nachträglich anpassen.** Belegt an drei Stellen: `:601` „SCHWELLE UNVERAENDERT: >= 2,5. Die Rekalibrierung korrigiert die METHODE, nicht die Anforderung."; `:637` „SCHWELLE: >= 2,5 — die ZAHL DES JURORS, unveraendert uebernommen."; `:1129-1131` „NICHT geaendert: die FENSTER-SCHWELLE des Gates bleibt 1,5-15 %; DIFF_THRESH (24) bleibt fuer alle anderen Gates unveraendert."

Ergänzend (Werkzeug-Selbsttest, `:3999-4004`): die 5-KB-Regel wurde für Crops durch „≥ 8 Farben" ersetzt, ausdrücklich begründet als „eine SCHAERFUNG der Aussagekraft, keine Absenkung eines Jury-/Spec-Schwellwerts".

---

## 2. Smoke-Test-Regeln

### 2.1 Die Regel (SPEC_GRAFIKPASS_5.md §0.2, wörtlich)

> 2. `tools/smoke_test.mjs`: NUR Katalog §6. fringeOverlays ist byte-eingefroren (smoke ~1905-1950) — ALLE Neuerungen leben in NEUEN Funktionen; shoreEdges/bankOverlays emittieren NUR für Kanten, die fringeOverlays NICHT bedient (Komplement-Regel §3).

Dazu §0.6: „NULL Golden-Hash-Änderungen im ganzen Pass." Der Katalog selbst steht in `design/SPEC_GRAFIKPASS_5.md:242-263` (7 nummerierte Punkte).

### 2.2 Sanktionierte Alt-Test-Änderungen (annotierte Hunks)

Jede Änderung an einem Bestandstest trägt einen nummerierten Marker. Vollständige Liste im aktuellen `tools/smoke_test.mjs`:

| Zeile | Marker |
|---|---|
| 9 | `#5, GP4-§5` (fringeOverlays + litDitherCells importiert) |
| 11 | `#4, GP5-§6` (shoreEdges/bankOverlays/waterReflections importiert) |
| 15 | `GP5-R3-Verdrahtungs-Nachzug` (bankVariantFor) |
| 162 | `#1` Slice 3 |
| 510 | `#4, GP4-§5` additive Existenz-Prüfung |
| 529 | `#3, GP5-§6` additive Existenz-Prüfung |
| 1697 | `#3, GP4-§5` Back-Kronen |
| 1729 | `#2, GP4-§5` Anker 'Y','Z','A' |
| 1780 / 1875 | `#1, GP5-§6` Anker-Offset (Schatten-Hälfte) |
| 1985 | `#1, GP4-§5` GRAVEYARD.sol neu erzeugt |
| 2030 | `#5, GP4-§5` drei additive NEUE Tests |
| 2084 / 2109 | `#2, GP5-§6` Radien 0.40/0.70 + Wasser-Filter |
| 2160 | `#4, GP5-§6` sechs additive NEUE Tests |
| 2320 | `GP5 Runde 2 — Engine-A, gemeldet` |

### 2.3 Die additiven Blöcke der R3 (wörtlich, `tools/smoke_test.mjs:2493-2496`)

```js
  // =========================================================================
  // GRAFIKPASS 5 RUNDE 3 — ADDITIVE Tests (Engine-A). NUR NEUE Bloecke, kein
  // Bestandstest angefasst; fringeOverlays (~1905-1950) bleibt byte-identisch.
  // Beide Mechaniken sind neu und ohne Test nicht abgesichert (R3-Liste 1+2e).
  // =========================================================================
```

und `tools/smoke_test.mjs:2619-2622`:

```js
  // =========================================================================
  // GP5 RUNDE 3 — VERDRAHTUNGS-NACHZUG. Wieder NUR NEUE Bloecke; kein
  // Bestandstest angefasst, fringeOverlays (~1905-1950) byte-identisch.
  // Alle drei Mechaniken waren als ART fertig und ohne Emission wirkungslos.
  // =========================================================================
```

Blöcke darin: (g) `bankOverlays`-Unterdrückung, (h) Depth-Varianten, (i) `shore_diag`-Emission.

### 2.4 Ungerade-n-Wächter

**Bindende Erkenntnis 1** (Übergabe): „variantIndex ist für GERADE n ein Diagonalgitter — UNGERADE n überall erzwungen (Wächter in check_gfx5_art + Smoke)."

`.tmp/check_gfx5_art.mjs:277-279` Blockkopf `NEU B) §2.A1/§2.A2 VERDRAHTUNGS-GATES + n-UNGERADE-WAECHTER`, darin die zwei Prüfungen:

```js
// Zeile 295 (Teil-Pools ',' und 'e'):
if (cell.variants.length % 2 === 0) bad(`'${ch}'-Teil-Pool n = ${cell.variants.length} ist GERADE`);
if (cell.variants.length % 5 === 0) bad(`'${ch}'-Teil-Pool n = ${cell.variants.length} hat Faktor 5 (Kollision mit dem Jitter-Hash, §0.4)`);
```

```js
// Zeile 302-306: (3) n-UNGERADE-WAECHTER (§2.A2) ueber ALLE vier Map-Legenden.
for (const [name, def] of Object.entries(MAPS)) {
  for (const [ch, cell] of Object.entries(def.legend)) {
    if (!cell.variants) continue;
    if (cell.variants.length % 2 === 0) bad(`${name} '${ch}': variants-n = ${cell.variants.length} ist GERADE (§2.A2)`);
    if (cell.variants[0] !== cell.art) bad(`${name} '${ch}': variants[0] !== art`);
```

Smoke-Seite, `tools/smoke_test.mjs:2613-2615`:
```js
check('§6#4h Depth-Varianten: n = 3 ist UNGERADE und teilerfremd zu 5/7/17/29/47',
  3 % 2 === 1 && [5, 7, 17, 29, 47].every((m) => m % 3 !== 0));
```

Kopf von `check_gfx5_art.mjs:1-15` dokumentiert außerdem, dass es `check_gfx4_art.mjs` ersetzt und dessen Wächter portiert; **einziger Wegfall** ist das Innenfeld-Gebot (gfx4:92/93).

---

## 3. Golden-Hashes

Definiert in `tools/smoke_test.mjs:1984-1992` (Abschnitt §36), Basis-Commit **204e28f**, sha256:

```js
const GOLD = {
  GRAVEYARD:     { sol: '432b1c32…b4a9', geo: '4c9372d0…7f2e' },
  CATACOMBS:     { sol: '82c22c6d…394c', geo: 'ce78746e…b9cb' },
  FLUESTERGRUFT: { sol: '0cca3204…3489', geo: '2ac0a890…6fa7' },
  BOSS_KAMMER:   { sol: 'ebe999cf…d611', geo: 'a7d72c33…85eb' },
};
```

**Zwei Hashes je Karte, vier Karten = 8 Golden-Hashes.**

- `solHash` (`:1998-1999`): Solidität aller Kacheln als 0/1-Raster über `def.rows` × `def.legend[ch].solid`, zeilenweise verkettet. Deckt ab: jede Änderung an Begehbarkeit/Kollision.
- `geoHash` (`:2000-2007`): sha256 über JSON aus `playerSpawn`, `skeletonSpawns`, `ghoulSpawns`, `enemySpawns`, `propSpawns`, `portals` und `torchChars.map(ch => [ch, tm.findTiles(ch)])`. Deckt ab: Spawns, Portale, Fackelzellen-Positionen.
- Geprüft in der Schleife `:2008-2013`, dort zusätzlich `AMBIENT` (`:1995`): `GRAVEYARD 0.45 / CATACOMBS 0.78 / FLUESTERGRUFT 0.85 / BOSS_KAMMER 0.66`, Toleranz `< 1e-9`.

Sanktions-Vermerk `:1985-1988`: `GRAVEYARD.sol` wurde **einmal** neu erzeugt (Teich-Umformung GP4 §2.7a), und ausdrücklich: „geo BLEIBT byte-identisch (Spawns/Portale/torch-findTiles unberuehrt) — ein geo-Drift waere ein STOPP-Signal."

Übergabe-Bilanz GP5: „Alle kanonischen Flusstests über den gesamten Pass NULL verändert; Golden-Hashes NULL verändert."

**GP6-Relevanz:** Hebel 2 (Belichtungssockel) ändert `mapDef.ambient` und trifft damit die `AMBIENT`-Konstante in `smoke_test.mjs:1995`. Das ist **keine** Golden-Hash-Änderung (sol/geo bleiben unberührt), sondern genau die eine Sorte Zahländerung, die die Spec schon einmal ausdrücklich sanktioniert hat (`smoke_test.mjs:1976`: „Ambient-Werte exakt 0.45/0.78/0.85/0.66 (die EINZIGEN erlaubten Zahlaenderungen, §4.2)"). Also: **1 sanktionierte Alt-Test-Zeile, sol/geo unangetastet.**

---

## 4. ENTWURF: die fünf Messziel-Felder

Gemeinsame Konventionen für alle fünf: Messung auf dem **internen 320×180-Backing-Store** (`toDataURL`, nicht auf dem hochskalierten Shot), Luminanz ITU-R 601 (identisch zu Pillow `convert('L')` und zu den Palettenkommentaren), Kamera ganzzahlig per `assert_int_camera`, Zeit per `__timeScale = 0` eingefroren, Modus über 9 Läufe wo Bewegung im Spiel ist.

---

### (a) Belichtungs-Perzentile je Karte

**Metrik.** Auf der HUD-maskierten Vollbildfläche: `P5, P25, Median, P75, P95, Mittel` der Luminanz sowie `Anteil(L > 128)`, `Anteil(L > 64)`, `Anteil(L < 16)`.

**Fenster.** Vollbild 320×180 minus drei feste HUD-Rechtecke (je +1 px Sicherheitsrand), Koordinaten wörtlich aus `game/js/ui/hud.js`: Panel `(2,2,54,40)` + 1 px Schlagschatten, Boss-Bar `(120,7,80,12)`, Item-Box `(296,4,20,20)`. Die Boss-Bar wird **immer** maskiert, auch wenn sie fehlt, sonst sind die Karten nicht vergleichbar.

**Szenen.** Fünf feste Kameras, eine je Karte/Biotop: `graveyard_teich (280,190)`, `graveyard_wald (320,110)`, `catacombs (120,0)`, `fluestergruft (168,142)`, `boss_kammer (0,12)`.

**IST (bereits gemessen, `.tmp/gp6_belichtung_ist.json`, Schwester-Agent):**

| Szene | ambient | P5 | P25 | Median | P75 | P95 | > 128 % | < 16 % |
|---|---|---|---|---|---|---|---|---|
| graveyard_teich | 0,45 | 17,0 | 19,8 | **24,9** | 42,4 | 60,6 | 0,15 | 3,0 |
| graveyard_wald | 0,45 | 16,6 | 22,2 | **22,7** | 35,5 | 55,9 | 0,08 | 4,6 |
| catacombs | 0,78 | 13,3 | 26,7 | **38,9** | 55,3 | 103,4 | 1,56 | 10,0 |
| fluestergruft | 0,85 | 12,7 | 17,1 | **27,8** | 39,4 | 77,9 | 0,74 | 18,0 |
| boss_kammer | 0,66 | 15,6 | 29,9 | **37,7** | 43,8 | 87,0 | 1,06 | 5,5 |

**Der harte Befund, den die Spec kennen muss:** bei `ambient = 0.00` (Overlay komplett aus, Vignette aus) erreicht `graveyard_teich` nur Median **31,9** und `graveyard_wald` **31,9**. **Das Ziel „Median außen ~40" ist über den Ambient-Regler allein nicht erreichbar** — die Friedhofs-Kunst selbst ist zu dunkel. GP6 braucht dort einen Ton-Hub in `art/` (Gras-Pool + Weg + Wasser), nicht nur eine Zahl in `maps.js`. Für die Innenräume genügt der Regler (`catacombs` erreicht bei amb 0,20 schon 44,6).

**Vorschlag Messziel.** Je Karte ein Zielband statt einer Zahl, weil die Karten dramaturgisch verschieden hell sein sollen:

| Karte | Median-L | Anteil L > 128 | Anteil L < 16 |
|---|---|---|---|
| GRAVEYARD (außen) | 38..46 | ≥ 0,5 % | ≤ 2,0 % |
| CATACOMBS | 40..50 | ≥ 2,0 % | ≤ 6,0 % |
| FLUESTERGRUFT | 34..44 | ≥ 1,5 % | ≤ 8,0 % |
| BOSS_KAMMER | 38..48 | ≥ 1,5 % | ≤ 4,0 % |

`Anteil(L > 128)` ist die Gegen-Sicherung: er verhindert, dass der Median durch flächiges Aufhellen ohne Spitzlichter erreicht wird (Milchsuppe). `Anteil(L < 16)` sichert gegen „Matsch" im Sinne des Juror-Zitats.

**Positiv-Kontrolle.** Dieselbe Messung auf dem GP5-Archivbild derselben Kamera muss die dort dokumentierten Werte reproduzieren (Median 24,9 für `graveyard_teich`). Trifft sie das nicht, misst das Werkzeug etwas anderes als beim IST-Lauf.
**Negativ-Kontrolle.** Reine Schwarzfläche (Vollbild bei `ambient = 1`, alle Lichter gecullt) muss Median < 5 und `Anteil(L>128) = 0` liefern; ein von Null verschiedener Wert wiese auf HUD-Leckage durch die Maske hin.

**Werkzeug.** `.tmp/gp6_belichtung_messung.py` (Schwester-Agent) implementiert Fenster, Maske und Perzentile bereits; für GP6 ist es als Gate in `shot_gfx6.py` zu übernehmen, nicht neu zu bauen.

---

### (b) Licht-Quantisierung nachweisen

**Das Robustheitsproblem.** „Anzahl distinkter Lichtstufen in einem Fackel-Gradient-Schnitt" ist als Zählung *ausgegebener Luminanzwerte* nicht messbar: unter dem Licht liegt die Kunst mit eigenen Tonstufen, und die Zahl hängt dann an der Kunst, nicht am Licht. Der Juror hat trotzdem recht: er zählt Stufen, die er sieht.

**Lösung: das Lichtfeld isolieren statt die Ausgabe zählen.** Der Dunkelheits-Pass ist multiplikativ (`destination-out`: `dst *= (1-a)`), also gilt pro Texel

```
out = src·(1 − a) + tint·a          mit tint = '#050510' = (5,5,16)   [lighting.js:137]
```

Zwei Aufnahmen desselben eingefrorenen Augenblicks: **A** mit Licht, **B** mit `window.__noLight = true` (Wrapper existiert, `shot_gfx5.py:218-231`). Dann ist `a` per Least-Squares über die drei Kanäle exakt bestimmt:

```
a = ((B − A) · (B − tint)) / |B − tint|²        nur wo |B − tint|² ≥ 3·40²
```

`a` ist die **Restdunkelheit**, also genau die Größe, die Hebel 1 auf 10-12 Stufen rasten soll. Sie ist von der Kunst darunter unabhängig (die kürzt sich heraus), und sie ist dreifach überbestimmt, also rauschfest.

**Nachgewiesen, nicht behauptet.** Ich habe das kontrolliert gemessen (`.tmp/gp6_landkarte_lichtprobe_live.py`, CATACOMBS, Kamera (40,190) = die `g5_09`-Kamera, `__noFog`/`__noVignette` an, Zeit eingefroren):

- **Negativ-Kontrolle A gegen A:** `a = 0.000` bei 16276/16276 Texeln, **genau 1 distinkte Stufe**. Der Schätzer hat null Eigenrauschen.
- **Positiv-Kontrolle:** in der fackelfernen Zone misst er `a = 0,78` bei 1928 Texeln — das ist auf zwei Nachkommastellen **`MAPS.CATACOMBS.ambient`**, ein vom Werkzeug unabhängig bekannter Engine-Wert.
- **Stärkste Validierung:** die gemessenen Plateaus sind `0,77 / 0,63 / 0,49 / 0,36 / 0,23 / 0,12 / 0,00`. Aus `PUNCH_RINGS` (`lighting.js:93-100`, Alphas 0.18/0.22/0.28/0.35/0.50/1.00) folgen kumulativ `1,00 / 0,82 / 0,64 / 0,46 / 0,30 / 0,15 / 0,00`, mal `ambient 0,78` = `0,780 / 0,640 / 0,499 / 0,359 / 0,234 / 0,117 / 0,000`. **Der Schätzer rekonstruiert die sechs Ringe der Engine texelgenau.**

**IST-Werte (dieselbe Messung):**

| Größe | Wert |
|---|---|
| distinkte `a`-Stufen, Rasterung 0,01, reine Punch-Zone (`a > 0,02`) | **77** |
| dito Rasterung 0,02 | 39 |
| Anteil Texel auf einem der 7 Soll-Plateaus, Toleranz ±0,02 | **65,7 %** |
| dito ±0,01 | 49,3 % |
| additiv aufgehellte Texel (`a < −0,02`, Warm-Glow/Hotspot) | 2648 |

Die ~70 Zwischenwerte kommen aus der Kantenglättung der `arc()`-Füllungen und aus überlagerten Fackeln. Genau das ist der „Airbrush", den Juror H mit „blockiert jede Note über ~7,5" meint.

**Vorschlag Messziel.** Zwei Zahlen statt einer, weil eine Stufenzahl allein durch Rundung gefälscht werden könnte:

1. **`lichtstufen_anzahl`**: distinkte `a`-Werte bei Rasterung 0,01 in der Punch-Zone **≤ 12** (IST 77).
2. **`lichtstufen_plateau_anteil`**: Anteil der Texel, die bei Toleranz ±0,01 auf einer der deklarierten Stufen sitzen, **≥ 95 %** (IST 49,3 %). Die Soll-Stufenliste wird aus der Engine-Konstante hergeleitet, nicht frei gewählt.

Zusätzlich ein **Gradient-Schnitt** als Jury-Bild: radiale Linie vom Fackelzentrum nach außen (Länge `TORCH_RADIUS = 72` px, `main.js:216`), `a` entlang der Linie als Treppenprofil; Gate: ≥ 8 und ≤ 12 Sprünge, jeder Sprung ≥ 0,04, kein Plateau kürzer als 3 px.

**Der additive Warm-Glow braucht ein eigenes Gate.** In der Glow-Zone (`a < 0`) ist das Modell nicht multiplikativ; dort gilt `A − B·(1−a_punch) = Glow`. Praktikabel: die Punch-Messung auf den Ring `r·0.48 < d ≤ r` beschränken (außerhalb `gr = r·0.48`, `lighting.js:212`, wirkt kein Glow), und für die Glow-Zone separat die distinkten Werte von `A − B` zählen. `GLOW_RINGS` (6), `FLOOR_RINGS` (4), `HOT_RINGS` (3) sind bereits gestuft; ihre Summen an den Überlappungsrändern sind die Restquelle.

**Werkzeuge liegen bereit:** `.tmp/gp6_landkarte_lichtprobe_live.py` (Rig + beide Kontrollen), `.tmp/gp6_landkarte_plateau_probe.py` (Plateau-Anteil), Bildpaar `.tmp/gp6_probe_licht_A.png` / `_B.png`.

---

### (c) Sprite-Beleuchtung

**Warum es heute fehlt.** `main.js:709` ruft `lighting.draw(...)` **nach** `drawWorld()` (`:728`) auf. Das Dunkel-Overlay und der Warm-Glow liegen also als Bildschirm-Ebene über allem, inklusive Sprites; es gibt **keinen** Per-Sprite-Lichtwert. Nur Partikel bekommen die Lichter durchgereicht (`main.js:715`: `particles.draw(ctx, camera, frameLights, mapDef.ambient)`).

**Metrik.** Derselbe Sprite an zwei Standorten, verglichen auf seiner **eigenen Silhouette** (Differenzmaske „Spieler da" gegen „Spieler weg", Verfahren aus `g5_10`, `shot_gfx5.py:2856-2925`):

- `dE` = euklidischer RGB-Abstand der Silhouetten-Mittelfarben NAH gegen FERN
- `ΔWarm` = `(R−B)_nah − (R−B)_fern` (die eigentliche Jury-Beschwerde „farblich tot" ist eine **Farbton**-, keine Helligkeitsfrage)
- `Streuung_nah` = Standardabweichung der Luminanz **innerhalb** der Silhouette am Fackel-Standort, geteilt durch dieselbe Größe am fernen Standort. Misst, ob das Sprite eine Licht-**Modellierung** bekommt oder nur global heller wird.

**Fenster.** Sprite-Weltbox `(cx−8, cy−17, +16, +24)` wie in `g5_10`. NAH = Bodenkachel direkt unter einer Fackelkachel (`MAPS.CATACOMBS.torchChars = ['W']`, `maps.js:610`, 25 Fackeln), FERN = begehbare Kachel mit maximalem Abstand zu allen Fackeln.

**IST (gemessen, `.tmp/gp6_landkarte_spritelicht_probe.py`, CATACOMBS):**

| | NAH (Welt 88,48, unter Fackel tx5/ty1) | FERN (Welt 632,40, 137 px entfernt) |
|---|---|---|
| Silhouette | 260 Texel | 247 Texel |
| Mittelfarbe RGB | (75,2 / 58,5 / 70,2) | (51,5 / 41,8 / 52,1) |
| R−B | **+5,0** | **−0,6** |

`dE = 34,1`, `ΔWarm = +5,6`.

**Interpretation und Fallstrick.** `dE = 34` sieht zunächst gut aus, entsteht aber fast vollständig aus dem Bildschirm-Overlay (der Kegel-Punch nimmt am Fackelstandort die Dunkelheit weg, also wird alles dort heller, auch das Sprite). **`dE` allein taugt darum nicht als Gate** — es wäre schon heute grün. Die aussagekräftige Zahl ist `ΔWarm = +5,6`: die Figur wird heller, aber kaum wärmer. Weiterer Fallstrick, der in der Spec stehen muss: der Spieler trägt ein **eigenes** Licht (`main.js:213`, `flicker: 0.3`), das mitwandert; „FERN" ist also nicht unbeleuchtet. Als Kontrolle sollte deshalb zusätzlich ein **Gegner** (kein eigenes Licht) gemessen werden.

**Vorschlag Messziel.**

1. `ΔWarm ≥ +18` (IST +5,6) — die Figur muss am Feuer sichtbar warm werden.
2. `Streuung_nah / Streuung_fern ≥ 1,25` — die Figur muss am Feuer *modelliert* sein, nicht nur heller.
3. Zusatzkriterium **gegen** Ausbrennen: 0 Texel mit `L > 240` in der Silhouette (Lehre aus dem GP5-R3-Hotspot-Weiß, `lighting.js:60-86`).

**Positiv-Kontrolle.** Dieselbe Messung mit `__noLight`: `dE` und `ΔWarm` müssen dann **0** sein (der einzige Unterschied wäre die Kunst, und die ist identisch). Ist sie es nicht, verwechselt die Maske Sprite mit Boden.
**Negativ-Kontrolle.** Zwei fackelferne Standorte gegeneinander: `dE < 4`, `ΔWarm < 2`. Andernfalls misst das Gate Kartenunterschiede statt Licht.

---

### (d) Kronen-Maßstab und Überlappung

**Metrik 1: Kronen-Bounding-Höhe in px.** Kein Renderlauf nötig, direkt auf den Pixel-Grids in `art/sprites.js`: Tinten-Bounding-Box (alle Zeichen ≠ `'.'`) je Kronen-Key.

**IST (gemessen über `game/js/art/sprites.js`):**

| Key | Grid | Tinten-Bbox |
|---|---|---|
| `tree_canopy_2x2_a` / `_am` | 32×32 | 24×**31** |
| `tree_canopy_2x2_b` / `_bm` | 32×32 | 32×**28** |
| `tree_canopy_2x2_c` / `_cm` | 32×32 | 19×**26** |
| `tree_canopy_back_a/_b/_c` | 32×32 | 25..29 × **14** |
| `tree_canopy`, `_top`, `_bottom`, `_v1`, `_v2` | 16×16 | 12..16 × 13..16 |
| `canopy_shadow` | 16×16 | 16×15 |

Größte Krone im Spiel: **32 × 31 px**. Dossier-Ziel: 40×28 bis 64×48. Die Span-Mechanik trägt das ohne Engine-Änderung: `tilemap.js:610-618` erlaubt `span: [w,h]` mit `1 ≤ w,h ≤ 4`, also bis **64×64**; heute nutzen alle Kronen `span: [2,2]` (`maps.js:130-146`). Ein `span: [4,3]` = 64×48 wäre regelkonform. Achtung `tilemap.js:616`: span > 1 verbietet die Kombination mit `variants`/`anim`, und `:618` verbietet span-Zeichen in den Ground-rows.

**Vorschlag Messziel 1.** Mindestens 3 Kronen-Keys mit Tinten-Bbox ≥ 40 px Breite **und** ≥ 28 px Höhe; mindestens einer ≥ 56×40. Gemessen wird die **Tinte**, nicht das Grid — sonst zählt leere Fläche mit. Wächter gehört nach `check_gfx6_art.mjs` (Art-Besitz), nicht in den Proof.

**Metrik 2: Spieler-unter-Laub-Pixel-Beweis.** Das Verfahren aus `g5_10` unverändert übernehmen (`shot_gfx5.py:2846-2925`): Vierfachaufnahme A/B/C/D bei eingefrorener Kamera und Zeit,

- Silhouette `S = { p | C(p) ≠ D(p) }` (Spieler an/aus, Laub aus)
- Verdeckt `V = { p ∈ S | A(p) = B(p) }` (mit Laub ist der Spieler dort nicht mehr zu sehen)

plus die vorhandene Kamera-Drift-Assertion (`:2887-2890`), die den Beweis ungültig erklärt, wenn die Kamera zwischen den vier Aufnahmen wandert.

**IST-Schwelle:** `KRONEN_MIN_VERDECKT = 20` Kopf-Texel bei `KRONEN_HEAD_ROWS = 9` (`shot_gfx5.py:2851-2852`).

**Vorschlag Messziel 2.** Schwelle mit der Kronengröße mitziehen: bei einer 3 Kacheln hohen Krone deckt das Laub die oberen `3·16 − 17 = 31` Sprite-Zeilen ab. Ziel: `verdeckt_kopf ≥ 120` Texel **und** `verdeckt_kopf / silhouette_kopf ≥ 0,75`. Der Quotient ist wichtig: eine absolute Zahl ließe sich auch durch ein größeres Sprite erreichen.

**Positiv-Kontrolle.** `silhouette_kopf > 0` muss gelten, sonst zeichnet der Spieler dort gar nicht (das Gate wäre trivial grün). Zusätzlich: eine Standkachel **ohne** Kronen-Zelle darüber muss `verdeckt_kopf = 0` liefern.
**Negativ-Kontrolle.** `A` gegen `A` (zweimal derselbe Frame) muss `silhouette = 0` und `verdeckt = 0` ergeben — Nachweis, dass kein Render-Rauschen als Verdeckung zählt. In `g5_10` fehlt diese Kontrolle heute; für GP6 aufnehmen.

**Metrik 3 (neu, Dossier „Boden-Schattenwurf").** `canopy_shadow`-Abdeckung: Anteil der Bodentexel unter einem Kronen-Span, die gegenüber demselben Boden ohne Krone (`__noOver` ist dafür ungeeignet, der Schatten läuft im Ground-Pass, `tilemap.js:1021-1023`) messbar dunkler sind. Braucht einen neuen Rig-Schalter `__noCanopyShadow` im `tilemap`-Wrapper, additiv, gleiches Muster wie `__noOver`.

---

### (e) Kontaktschatten-Abdeckung

**Der Befund, der das Feld nötig macht.** R3-Restliste Punkt 3: „Spieler-Kontaktschatten in g5_10 nicht nachweisbar (Pixel-Diff)". Ursache ist Geometrie, nicht ein fehlender Codepfad: `drawSoftShadow` (`main.js:580-596`) zeichnet **vor** der `renderables`-Schleife (`main.js:658-660`), das Sprite liegt also darüber, und die drei Schattenzeilen liegen bei `SHADOW_DY = [0, 1, 2]` (`main.js:547`) **oberhalb** der Fußkante, also hinter dem Sprite. Nur der Boss hat seit R3 ein Profil mit `SHADOW_DY_BIG = [-1, 0, 1, 2, 3]` (`main.js:579`), dessen unterste Zeile unter der Fußkante liegt.

**IST (gemessen, `.tmp/gp6_shadow_coverage.mjs` des Schwester-Agenten, rein geometrisch, kein Render nötig):**

| Entity | AABB | Profil | sichtbare Schatten-Texel | davon **unter** der Fußkante |
|---|---|---|---|---|
| Spieler idle/down | 12×14 | std(3) | 9 | **0** |
| Spieler walk/down | 12×14 | std(3) | 5 | **0** |
| Spieler side | 12×14 | std(3) | 16 | **0** |
| Skelett | 12×14 | std(3) | 8 | **0** |
| Ghul | 14×14 | std(3) | 8 | **0** |
| Grufthund | 14×12 | std(3) | 19 | **0** |
| Rostpanzer | 14×16 | std(3) | 8 | **0** |
| **Boss Grabwächter** | 20×24 | BIG(5) | 49 | **18** |
| Vase / Urne / Truhe | 12×12 / 12×12 / 16×14 | std(3) | 20 / 19 / 32 | 0 |

**Metrik.** Zwei Ebenen, beide nötig:

1. **Geometrisch (Node, kein Browser):** sichtbare Schatten-Texel je Entity = Schattenprofil minus der vom eigenen Sprite verdeckten Texel; getrennt ausgewiesen als „unter der Fußkante". Deterministisch, schnell, gehört in den Smoke-Test als **neuer additiver Block**.
2. **Im Bild (Proof):** Differenzmaske „Entity da" gegen „Entity weg" bei eingefrorener Kamera, gezählt werden Texel unterhalb der Fußkante mit Luminanzabfall `ΔL ≥ 6`. Das ist die Zahl, die die Jury sieht.

**Vorschlag Messziel.**

- Jede Entity-Klasse (Spieler, Skelett, Ghul, Grufthund, Rostpanzer, Boss, Vase, Urne, Truhe): **≥ 8 sichtbare Schatten-Texel unter der Fußkante** (IST: 0 bei allen außer Boss mit 18).
- Zusätzlich im Bild: `ΔL ≥ 6` auf ≥ 8 Texeln, in **mindestens zwei** Karten (Außen und Innen). Der Boss steht in `BOSS_KAMMER` bei ambient 0,66; auf dunklem Boden verschwindet ein Alpha-0,12-Rand, die Bildmessung fängt das, die Geometriemessung nicht.

**Positiv-Kontrolle.** Der **Boss** ist die eingebaute Positiv-Kontrolle: er hat heute 18 Texel unter der Fußkante, das Gate muss ihn grün finden. Findet es ihn rot, misst es falsch.
**Negativ-Kontrolle.** Eine Entity, die per Definition keinen Schatten bekommt (Projektil, `main.js:659-660` schließt sie aus) muss **0** liefern. Zweite Negativ-Kontrolle: derselbe Frame zweimal, `ΔL`-Zählung muss 0 ergeben.

---

## 5. Was der Spec-Autor noch entscheiden muss

1. **Belichtung ist nicht mit dem Ambient-Regler zu lösen.** Bei `ambient = 0` erreicht der Friedhof Median 31,9, nicht 40. Entweder das GRAVEYARD-Ziel auf ~34 senken (dann ist es mit dem Regler + Vignette erreichbar) oder einen Ton-Hub im Gras-Pool (47 Kacheln), Weg und Wasser beauftragen. Zweiteres bewegt `check_gfx5_art`-Gates (Kachel-Mittel, Dichteklassen) und braucht eine sanktionierte Wächter-Runde.
2. **Der `AMBIENT`-Block in `tools/smoke_test.mjs:1995`** ist der einzige Testeingriff, den Hebel 2 zwingend erfordert. Golden-Hashes (`sol`/`geo`) bleiben unberührt. Das sollte in §0 der GP6-Spec als sanktionierte Alt-Test-Änderung #1 stehen, mit der Fortsetzung der Nummerierung.
3. **Hebel 1 ändert `lighting.js`**, das ist bereits GP5-erlaubt (`SPEC_GRAFIKPASS_5.md:59-60` nimmt `core/` vom Tabu aus „außer `lighting.js` + `particles.js`"). `ambientAlpha`-Detektor beachten: `lighting.js:138` muss der **einzige** Teilalpha-`fillRect` auf einem Nicht-Main-Canvas bleiben (§0.1).
4. **Hebel 3 (Sprite-Licht + Kontaktschatten als Engine-Feature)** berührt `main.js` (`drawSoftShadow`, Zeichenreihenfolge) und braucht einen Lichtwert-Abgriff am Fußpixel. Als **reine Funktion** in `core/lighting.js` bauen (`lightAt(lights, wx, wy, ambient) → a`), dann ist sie Node-testbar und folgt dem `litDitherCells`-Präzedenzfall (`tilemap.js:59-91`). `entities/` bleibt damit Tabu.
5. **Kronen ≥ 40×28** verlangen `span: [3,2]` oder `[4,3]`. `tilemap.js:616` verbietet dann `variants`/`anim` an demselben Zeichen — die heutigen Kronen haben beides nicht, aber der Sway-Versatz läuft über die Span-Anker (`tilemap.js:918-950`), das ist zu prüfen, bevor die Spec 64×48 zusagt.
6. **Namenskollision in `.tmp/`:** ein paralleler Agent hat ebenfalls Dateien mit dem Präfix `gp6_landkarte_` angelegt (`gp6_landkarte_probe.mjs`, `_probe2.mjs`, `_probe3.mjs`). Meine Dateien sind ausschließlich die unten genannten; überschrieben wurde nichts.

---

## 6. Von mir angelegte Dateien (alle in `.tmp/`, read-only gegenüber `game/`)

| Datei | Zweck |
|---|---|
| `/home/coder/Grimlight/.tmp/gp6_landkarte_lichtprobe_live.py` | **Kernstück (b):** Rig aus `shot_gfx5.py` importiert, rendert A/B mit `__noLight`, 3-Kanal-Schätzer, Positiv- und Negativ-Kontrolle |
| `/home/coder/Grimlight/.tmp/gp6_landkarte_plateau_probe.py` | Plateau-Anteil gegen die aus `PUNCH_RINGS` hergeleiteten Soll-Stufen |
| `/home/coder/Grimlight/.tmp/gp6_landkarte_spritelicht_probe.py` | **Kernstück (c):** Silhouetten-Mittelfarbe NAH/FERN, `dE` und `ΔWarm` |
| `/home/coder/Grimlight/.tmp/gp6_landkarte_lichtstufen_probe.py` | Vorstufe (1-Kanal-Quotient); zeigt, warum der 3-Kanal-Schätzer nötig ist |
| `/home/coder/Grimlight/.tmp/gp6_landkarte_lichtstufen_probe2.py` | Vorstufe auf Altbildern; **nicht zitierfähig**, die Herkunft von `probe_w_ohnelicht.png` ist nicht belegbar |
| `/home/coder/Grimlight/.tmp/gp6_probe_licht_A.png` / `_B.png` | Belegbildpaar CATACOMBS (40,190), mit/ohne Licht |
| `/home/coder/Grimlight/.tmp/serve8124_gp6karte.log` | Serverlog (Server wieder gestoppt, Port 8124 frei, 8123 nie berührt) |