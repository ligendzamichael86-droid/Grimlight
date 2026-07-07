# Technische Spezifikation — Grafikpass 2 "Struktur statt Politur"

Stand: 07.07.2026, BINDEND. Adversarialer 3-Blickwinkel-Review eingearbeitet
(1 Blocker: falsche Smoke-Abschnittsnummer 18→21 samt Freeze-Widerspruch;
3 Majors: dritte Kronensilhouette, Wasser-Frame-0-Freigabe, Laub-Rampen-
Kohärenz der Alt-Füller; 8 Minors, alle eingearbeitet).

Ausgangslage: Grafikpass 1 endete bei Juror-Noten 6 / 6 / 6,5 mit der Diagnose
"Grenze der Kachel-Politur, Note 8 braucht Struktur-Arbeit" (workflows/
SLICE_1_5_grafikpass.md, Erkenntnis 5). Dieser Pass liefert genau diese
Struktur-Arbeit. Messlatte bleibt Secret of Mana (CLAUDE.md, Vorgabe des
Auftraggebers vom 02.07.2026). Ziel: Juror-Median >= 8.

Bindend bleiben alle früheren Specs und Übergabe-Festlegungen. Grüne Basis ist
Commit 17063fa (Slice 3 komplett, alle Tests grün).

## 0. Eiserne Regeln (gelten für ALLE Agenten dieses Passes)

1. **KEINE Gameplay-Änderung.** Begehbarkeit, Spawns, Portale, Hitboxen,
   Kampfwerte, XP, Loot: alles bleibt exakt wie in 17063fa.
2. **Die Ground-ROWS-Arrays aller vier Maps bleiben byte-identisch.**
   (GRAVEYARD_ROWS, CATACOMBS_ROWS, FLUESTERGRUFT_ROWS, BOSS_KAMMER_ROWS.)
   Nur Legenden und GRAVEYARD_OVER_ROWS ändern sich. Der Verify-Agent belegt
   das per git diff.
3. **Flusstests sind unantastbar:** `.tmp/check_main_slice1.mjs`,
   `.tmp/check_inventory_slice2.mjs`, `.tmp/check_boss_slice3.mjs` werden
   NICHT editiert und müssen unverändert grün laufen. Es gibt in diesem Pass
   NULL erlaubte Flusstest-Änderungen.
4. **Tabu-Dateien:** `game/js/items/` (komplett), `game/js/entities/`
   (komplett), `game/js/ui/` (komplett), `game/js/core/` (komplett),
   `game/js/main.js`. Ausnahme main.js: nur der Integrator, nur bei einem
   nachgewiesenen Integrationsfehler, dokumentiert in der Übergabe.
   (Die draw-Pfade sind seit Slice 1.5 größenagnostisch; es gibt keinen
   erwarteten Grund, sie anzufassen.)
5. **Kein `Math.random`, kein `Date.now` in `game/js/world/` und
   `game/js/art/`.** Varianten- und Animationsauswahl sind reine Funktionen
   von (tx, ty, timeSec). Wird per neuem Smoke-Wächter erzwungen (§5).
6. Port 8123 gehört dem Auftraggeber. Agenten starten ihren eigenen Server
   auf Port 8124 (`python3 -m http.server 8124 --directory game`); bei
   "Address already in use" erst prüfen, ob dort schon ein game/-Server
   läuft, und ihn dann mitbenutzen.
7. Sprite-/Tile-MASSE bleiben in diesem Pass ausnahmslos unverändert
   (nur Pixel-Inhalt ändert sich). Einzige neue Maße: die drei 32×32-Kronen.
   Damit ist ausgeschlossen, dass draw-Offsets, elite_glow-Ausrichtung oder
   Flusstest-Anker driften.
8. Die Flip-Liste in main.js wird nicht angefasst (keine neuen Flip-Keys).

## 1. Scope: vier Baustellen

1. **2×2-Großkronen:** Der Friedhofswald bekommt echte 32×32-Baumkronen im
   Over-Layer (Multi-Tile-Anker in der Engine), DREI Silhouetten (a/b/c) —
   Kronen sind nicht spiegelbar (keine neuen Flip-Keys, §0.8), darum trägt
   nur eine dritte Silhouette die ~22 Stämme lange Ost-Baumreihe ohne
   sichtbare a/b-Alternation. Die bisherigen 16×16-Zweiteiler (K/B) und
   Einzelkronen (C) bleiben als Füller für schmale Stellen.
2. **Tile-Varianten gegen Wiederholung:** Gras, Weg, Friedhofsmauer,
   Steinboden und Ziegelwand bekommen 2 bis 3 Varianten mit deterministischer
   Auswahl aus der Tile-Koordinate.
3. **Wasser lebt und kommt in die Route:** Wasser wird ein 3-Frame-Loop
   (synchron, langsam) und bekommt zwei Pflicht-Szenen in der neuen
   Screenshot-Route (Friedhofsteich, gefluteter Gruft-Korridor).
4. **Sprite-Politur zweite Reihe:** Skelett, Ghul, Grufthund, Rostpanzer und
   die Props (Vasen, Urnen, Truhen, Grabsteine, Sarkophag, Pfeiler …) werden
   auf das Rampen-Niveau von Held/Grabwächter gehoben.

Nicht-Ziele (explizit): keine neuen Mechaniken, keine Map-Layout-Änderungen,
keine Held-/Grabwächter-/UI-Sprite-Änderungen, kein Sound, kein main.js-Umbau,
keine Katakomben-overRows (bewusst vertagt; der Nutzen liegt im Friedhofswald).

Bewusst akzeptierte Risiken (Review-Befund, Entscheidung Hauptloop): KEIN
Kronen-Schlagschatten auf dem Boden (der Over-Layer zeichnet nach den
Entities; ein Bodenschatten bräuchte eine neue Ground-Overlay-Ebene) und
KEINE dunkle Wasser-Uferkante (bräuchte nachbarschaftsabhängige
water_edge-Overlays; die Gras-Fringes liegen auch über Wegen und dürfen
keine Wasserkante tragen). Beide sind Kandidaten für die
Struktur-Eskalation der Juror-Schleife (§6.3), falls Juroren sie als
notenentscheidend benennen.

## 2. Engine: `game/js/world/tilemap.js` (Besitz: Engine-Builder)

### 2.1 Neue optionale Legenden-Felder

```js
// span: [w, h]     NUR für Over-Layer-Einträge. 1 <= w, h <= 4 (ganzzahlig).
//                  Die Zelle in overRows ist der ANKER = obere linke Ecke;
//                  das Art-Canvas MUSS exakt w*16 x h*16 px groß sein.
// variants: [...]  Array von TILE_ART-Keys. PFLICHT: variants[0] === def.art
//                  (createTilemap wirft sonst). Auswahl deterministisch pro
//                  Tile-Koordinate, gleichverteilt über die Einträge.
// animRate: n      Frames pro Sekunde für def.anim (Default 6, wie bisher).
// animSync: true   Kein Positions-Offset im Frame-Index — alle Tiles dieser
//                  Art animieren synchron (Wasserwellen). Default false
//                  (Fackeln bleiben entsynchronisiert).
```

Validierungen in `createTilemap` (Datenfehler laut sichtbar machen, wie
bisheriger Stil):
- `variants` und `anim` am selben Eintrag: throw.
- `span` (w>1 oder h>1) kombiniert mit `variants` oder `anim`: throw
  (Kronen-Abwechslung kommt aus drei getrennten Legenden-Zeichen, §4.2;
  die Engine bleibt ohne ungetestete Kombinationspfade).
- `span` mit w>1 oder h>1 an einem Zeichen, das in den GROUND-rows vorkommt:
  throw (der Ground-Layer bleibt strikt 1×1).
- `variants[0] !== def.art`: throw.
- `span`-Werte außerhalb 1..4 oder nicht ganzzahlig: throw.
- Bestehende Regel bleibt: Over-Zeichen mit `solid: true`: throw.

### 2.2 Deterministische Variantenwahl (exakt so umsetzen)

```js
// Reine Funktion, exportieren (Smoke-Test prüft sie direkt).
export function variantIndex(tx, ty, n) {
  let h = (tx * 374761393 + ty * 668265263) >>> 0;
  h = (h ^ (h >>> 13)) >>> 0;
  h = Math.imul(h, 1274126177) >>> 0;
  return h % n;
}
```

`artFor` neu (bestehendes Verhalten für Fackeln unverändert):

```js
function artFor(def, tx, ty, timeSec) {
  if (def.anim) {
    const rate = def.animRate || 6;
    const offset = def.animSync ? 0 : tx * 13 + ty * 7;
    const frame = (Math.floor(timeSec * rate) + offset) % def.anim.length;
    return def.anim[frame];
  }
  if (def.variants) {
    return def.variants[variantIndex(tx, ty, def.variants.length)];
  }
  return def.art;
}
```

### 2.3 Over-Layer: Anker-Zeichnung und Culling

- Zeichnung: unverändert `ctx.drawImage(img, sx, sy)` am Anker — ein
  32×32-Canvas zeichnet sich selbst in voller Größe. Kein Skalier-Code.
- Culling: `createTilemap` berechnet einmalig `maxSpanW/maxSpanH` über alle
  in overCells tatsächlich vorkommenden Defs. Im over-Zweig von `draw` wird
  das Startfenster nach links/oben erweitert:
  `tx0over = Math.max(0, tx0 - (maxSpanW - 1))`, analog ty. So zeichnen
  Anker, die knapp links/oberhalb des Viewports liegen, ihre in den Viewport
  ragenden Kronenteile trotzdem.
- Zeichenreihenfolge bleibt zeilenweise (row-major): Anker weiter unten
  zeichnen später und liegen damit korrekt VOR Kronen weiter oben
  (Top-Down-Tiefe). Überlappende Anker sind erlaubt und erwünscht
  (organische Waldränder).
- Fringe-Logik, findTiles (GROUND-only), Kollision: unverändert.

## 3. Art: `game/js/art/sprites.js` + `palette.js` (Besitz: Art-Builder)

### 3.1 Neue TILE_ART-Keys (Maße bindend)

| Key | Maß | Inhalt |
|---|---|---|
| `tree_canopy_2x2_a` | 32 Zeilen × 32 Zeichen | dichte Großkrone, asymmetrische Silhouette, Licht von oben links |
| `tree_canopy_2x2_b` | 32 Zeilen × 32 Zeichen | zweite Großkrone, deutlich andere Silhouette/Lichtführung als _a |
| `tree_canopy_2x2_c` | 32 Zeilen × 32 Zeichen | dritte Großkrone, dritte Silhouette (z. B. windschief/gelichtet) — Pflicht wegen der nicht spiegelbaren Ost-Baumreihe |
| `grass_dark_v1`, `grass_dark_v2` | 16×16 | Gras-Varianten: gleiche Grundhelligkeit wie `grass_dark`, andere Büschel-Anordnung |
| `path_v1` | 16×16 | Weg-Variante: andere Furchen-/Steinchen-Anordnung |
| `wall_v1` | 16×16 | Friedhofsmauer-Variante (Risse, versetzte Fugen) |
| `stone_floor_v1`, `stone_floor_v2` | 16×16 | Steinboden-Varianten (Platten-Versatz, dezente Abnutzung) |
| `brick_wall_v1`, `brick_wall_v2` | 16×16 | Ziegel-Varianten (fehlender Ziegel, Feuchtefleck) |
| `water_1`, `water_2` | 16×16 | Wasser-Animationsframes (siehe 3.2); `water` bleibt Frame 0 des Loops. KLARSTELLUNG (Review): der Artist DARF das bestehende `water`-Grid dafür NEU ZEICHNEN — eingefroren sind nur die Map-rows (§0.2), nicht der TILE_ART-Inhalt; der Smoke-Test prüft nur Keys, keine Pixel |

Varianten-Designregel: Varianten werden GLEICHVERTEILT gestreut (je 1/2 bzw.
1/3 der Fläche). Keine Variante darf ein Blickfang sein — gleiche mittlere
Helligkeit, gleiches Material, nur andere Detail-Anordnung. Auffällige
Einzelstücke (Schädel im Boden o. Ä.) gehören NICHT in Varianten, dafür gibt
es Akzent-Zeichen in den rows (`,`), und die rows sind eingefroren.

### 3.2 Wasser-Loop

3 Frames als PING-PONG: `anim: ['water', 'water_1', 'water_2', 'water_1']`
(animRate 2, animSync true, Loop-Dauer 2 s). Ping-Pong statt Zyklus, weil
eine Ein-Richtungs-Wanderung beim Umschlag Frame2→Frame0 einen sichtbaren
Rücksprung erzeugen würde (Review-Befund). Wellenkämme (c/C-Ringe, i-Glanz)
schwellen an und wandern 1 bis 2 px hin und zurück; die w/W-Flächen bleiben
ruhig. Alle 3 Frames werden GEMEINSAM entworfen (Frame-0-Neuzeichnung
erlaubt, §3.1). Ziel: träges, zähes Grabwasser (Diablo), kein fröhliches
Geplätscher.

### 3.3 Sprite-Politur zweite Reihe (Maße ALLE unverändert)

Priorität A (in den Juror-Szenen §6.1 sichtbar, PFLICHT):

- `skeleton_0/1/die` (16×16): Knochen-Rampe O→B→b→N ausreizen, Gelenke und
  Rippen definieren, Silhouette gegen dunkle Böden absichern (k-Umriss
  lückenlos), Laufpose lesbarer.
- `ghoul_0/1/die` (16×20): d→G→H→3-Rampe, aufgedunsener Bauch, hängende Arme,
  Kopf-Spitzlicht.
- `hound_0/1/telegraph/leap/down/die`: Fell-Schattierung, Muskel-Andeutung,
  Pose-Lesbarkeit (telegraph muss als "gleich springt er" lesbar sein).
- `rust_0/1/die`: Rost-Rampe 4→5→6 plus Nieten-Spitzlichter, Plattenkanten.
- Props in SPRITES: `vase`, `urn`, `chest_closed`, `chest_open` (Holz-Rampe
  q→j→Q→J, Beschlag Y/y).
- Props in TILE_ART: `gravestone`, `gravestone_2`, `gravestone_3`, `pillar`:
  Stein-Rampe bis F/D-Spitzlichter, Bodenkontakt-Schatten (1 px n unter der
  Basis), leichte Asymmetrie.
- Kronen-Kohärenz (Review-Major): `tree_trunk`, `tree_canopy`,
  `tree_canopy_top`, `tree_canopy_bottom` werden auf dieselbe Laub-Rampe
  gehoben wie die neuen 2×2-Kronen (inklusive eventueller neuer
  Tiefen-Töne, §3.4) — die Füller stehen in denselben Waldrändern; ein
  Paletten-Sprung zwischen Alt-Füller und Großkrone wäre in g2_02 sofort
  sichtbar. Maße unverändert.

Priorität B (best effort, nur wenn die Runde Luft lässt; in den Szenen kaum
sichtbar): `sarcophagus`, `rubble`, `bones`, `skull`, `fence`, `bush_dead`.
- TABU (nicht anfassen): `player_*`, `warden_*`, `sword_*`, `shield_*`,
  `boomerang_*`, `item_*`, `icon_*`, `heart_*`, `coin_*`, `sparkle_*`,
  `fog_blob`, `elite_glow`, `levelup_*`, `block_spark`, `prop_break_*`,
  alle `torch_*` und `fringe_*`/`moss_fringe_*`.

### 3.4 Palette

Maximal 4 neue Töne. Bevorzugt `0` und `9` (weder Paletten- noch
Legenden-Zeichen, völlig kollisionsfrei lesbar); `K` und `M` nur, wenn
zwingend mehr als 2 Töne gebraucht werden. `l` ist wegen
Verwechslungsgefahr mit `1` verboten. Bestehende Töne dürfen NICHT
umdefiniert werden. Erwarteter Bedarf: 1 Ton Wasser-Zwischenblau,
1 bis 2 Töne Laub-Tiefe für die Großkronen (die laut §3.3 auch die
Alt-Füller bekommen).
Hinweis Namensräume: Map-Legenden-Zeichen und Paletten-Zeichen sind
getrennte Dictionaries. 'K' ist bereits Legenden-Zeichen (canopy_top),
'M'/'N'/'O' werden es (§4.1), 'N' ist zugleich Paletten-Ton
(Knochen-Spitzlicht) — funktional alles kollisionsfrei, aber beim Lesen
verwechselbar; daher die 0/9-Präferenz.

## 4. Maps: Legenden + Over-Layer (Besitz: Engine-Builder)

### 4.1 Legenden-Änderungen (alle Flags wie solid/fringe* bleiben unberührt)

GRAVEYARD (`maps.js`):
- `'.'`: `variants: ['grass_dark', 'grass_dark_v1', 'grass_dark_v2']`
- `'='`: `variants: ['path', 'path_v1']`
- `'#'`: `variants: ['wall', 'wall_v1']`
- `'~'`: Eintrag IN PLACE ergänzen um
  `anim: ['water', 'water_1', 'water_2', 'water_1'], animRate: 2,
  animSync: true` — `art: 'water'` BLEIBT als Frame 0/Fallback stehen
  (Muster Fackeln: art + anim; Smoke-Abschnitt "Legenden-Arts existieren"
  prüft cell.art direkt), solid: true bleibt, fringeTarget bleibt.
- NEU `'M'`: `{ art: 'tree_canopy_2x2_a', span: [2, 2], solid: false }`
- NEU `'N'`: `{ art: 'tree_canopy_2x2_b', span: [2, 2], solid: false }`
- NEU `'O'`: `{ art: 'tree_canopy_2x2_c', span: [2, 2], solid: false }`
- `','` (grass_detail) bleibt ohne Varianten (ist selbst der Akzent).

CATACOMBS (`maps.js`) und FLUESTERGRUFT (`map_fluestergruft.js`):
- `'#'`: `variants: ['brick_wall', 'brick_wall_v1', 'brick_wall_v2']`
- `'.'`: `variants: ['stone_floor', 'stone_floor_v1', 'stone_floor_v2']`
- FLUESTERGRUFT `'~'`: Wasser-Anim wie oben, ebenfalls IN PLACE
  (`art: 'water'` bleibt; solid: false bleibt, fringeTarget bleibt).

BOSS_KAMMER (`map_bosskammer.js`):
- `'#'` und `'.'` wie CATACOMBS (der Boden der Arena ist die größte
  zusammenhängende Wiederholungsfläche im Spiel).

### 4.2 GRAVEYARD_OVER_ROWS neu (Generator: `.tmp/gen_overrows2.mjs`)

Der Engine-Builder schreibt einen deterministischen Generator (kein
Math.random; Streuung z. B. via variantIndex-Hash) und checkt dessen AUSGABE
als neues GRAVEYARD_OVER_ROWS-Literal ein (das Modul bleibt reines
Daten-Modul, der Generator bleibt Wegwerf-Werkzeug in .tmp/).

Regeln für die Kronen-Setzung:
1. Jeder Baumstamm ('T' in den ground rows) ist bedeckt: entweder liegt auf
   seiner Zelle ein 'B' (alter Zweiteiler) oder seine Zelle liegt in der
   2×2-Fläche eines M/N/O-Ankers.
2. Bevorzugt Großkronen: Stämme werden zu Clustern gruppiert; ein Anker
   deckt nach Möglichkeit 2 Stämme (Baumreihen am Ost-/Westrand: versetzte
   Anker in Spalte trunkX-1 oder trunkX, Reihe trunkY-1, Parität aus der
   Stamm-Koordinate). Einzelstämme in engen Lücken behalten K/B.
   Entlang der Ost-Baumreihe (Spalte 38) dürfen aufeinanderfolgende Anker
   NIE dieselbe Silhouette tragen und nicht strikt alternieren
   (a/b/a/b verboten) — die Drei-Silhouetten-Rotation aus Regel 5 stellt
   das her.
3. Die untere Kronenhälfte liegt AUF der Stammzeile (Wurzeln bleiben
   sichtbar), d. h. Anker-Reihe = trunkY - 1. Anker-Flächen dürfen
   einander überlappen (organische Ränder), müssen aber vollständig in der
   Map liegen.
4. Kein Anker-Bereich und kein K/B/C-Tile über einem 'F'-, 'D'- oder
   '='-Tile (Fackeln, Krypta-Treppe und der Hauptweg bleiben frei sichtbar;
   Ausnahme: die zwei Weg-Reihen y=12/13 dürfen an den äußersten
   Ost-Spalten x>=34 von Kronen überragt werden, dort steht die Baumreihe
   direkt am Weg).
5. Abwechslung M/N/O deterministisch aus der Anker-Koordinate
   (z. B. variantIndex(ankerX, ankerY, 3) → M/N/O).
6. 'K'/'B'/'C' bleiben als Legenden-Einträge erhalten (Füller).

Verifikation im Generator (wirft bei Verstoß): Regeln 1 bis 4, plus
Dimensionen (24 Zeilen × 40 Zeichen), plus "alle Zeichen in Legende und
nie solid".

## 5. Tests (Besitz: Engine-Builder; Integrator macht grün)

`tools/smoke_test.mjs` — GENAU DIESE Änderungen sind erlaubt, alles andere
ist Spec-Verstoß. (Review-Korrektur: die Over-Layer-Checks liegen in
ABSCHNITT 21, Zeilen ~545-612; Abschnitt 18 ist der Fackel-findTiles-Test
und bleibt unangetastet.)

1. **Abschnitt 16 (additiv):** die neuen TILE_ART-Pflicht-Keys aus §3.1 in
   die Existenz-Liste aufnehmen.
2. **Abschnitt 21 (einziger Pflicht-Umbau, minimal):** der
   Stamm-Deckungs-Check "Jeder Baumstamm trägt eine Krone im Over-Layer"
   (Zeilen ~561-566: `if (ch === 'T' && over[y][x] === '.') …`) versteht
   M/N/O-Anker: Deckung = 'B' auf der Zelle ODER Zelle liegt in der
   2×2-Span-Fläche eines Ankers. SONST NICHTS in Abschnitt 21 ändern —
   der Over-Draw-Präfixcheck (`startsWith('tree_canopy')`, Zeile ~591)
   deckt die 2x2-Keys bereits ab, und die Zähl-Invariante "ein draw pro
   Nicht-'.'-Zelle" (Zeile ~590) hält bei Kamera (0,0) unverändert
   (Anker zeichnen genau einmal). Beide bleiben wie sie sind.
3. **NEU Abschnitt 35 "Grafikpass 2" (additiv), prüft mindestens:**
   - `variantIndex`: deterministisch (gleiche Eingabe → gleicher Index über
     mehrere Aufrufe), Wertebereich 0..n-1, Streuung über einen
     SYNTHETISCHEN Koordinaten-Sweep (0..31 × 0..31: für n=2 und n=3
     kommt jeder Index vor) — map-unabhängig und damit robust gegen
     Konstanten/Map-Interferenz (Review-Befund). Dass auch die ECHTE
     GRAVEYARD-Grasfläche alle Varianten zeigt, verifiziert der
     Engine-Builder als Bau-Vorbedingung im Generator-Dev-Check
     (.tmp/, nicht im Smoke).
   - Stub-Draw GRAVEYARD: dieselbe Kamera zweimal gezeichnet liefert exakt
     dieselbe Key-Folge (Render-Determinismus).
   - Varianten-Integrität: für jede Map-Legende existiert jeder
     variants-Key in TILE_ART und variants[0] === art.
   - createTilemap-Würfe: variants+anim kombiniert wirft; span+variants
     kombiniert wirft; span-Zeichen in ground rows wirft; variants[0] !==
     art wirft; span [0,2] wirft.
   - Span-Culling: Kamera so, dass ein M-Anker links oberhalb des Viewports
     liegt, dessen Fläche hineinragt → sein Key erscheint in der Draw-Liste.
   - Wasser-Anim (Ping-Pong, §3.2): mit animRate 2/animSync true liefert
     artFor (via Stub-Draw bei timeSec 0,25 / 0,75 / 1,25 / 1,75 — bewusst
     FRAME-MITTEN, nicht die floor()-Grenzen) die Folge water → water_1 →
     water_2 → water_1 an einer festen Koordinate, und ZWEI verschiedene
     Wasser-Koordinaten zeigen zum selben timeSec denselben Frame.
   - Grid-Maße: alle TILE_ART-Grids sind 16 Zeichen breit und 16 Zeilen
     hoch, AUSSER die drei span-Keys tree_canopy_2x2_a/b/c (exakt
     span*16, also 32×32); alle Zeilen eines Grids gleich lang.
   - Quelltext-Wächter: kein 'Math.random' und kein 'Date.now' in
     game/js/world/*.js und game/js/art/*.js (fs.readFileSync).
   - Ground-rows-Freeze: die vier ROWS-Arrays enthalten keine
     M/N/O-Zeichen.
4. Bestehende Abschnitte 1 bis 15, 17 bis 20, 22 bis 34: UNVERÄNDERT.
   (Geändert werden ausschließlich 16 additiv, 21 minimal laut Punkt 2,
   und 35 kommt neu dazu.)

Weiter gelten: `bash tools/check_syntax.sh` grün, `node tools/smoke_test.mjs`
grün (Abnahme: 3 Läufe), alle drei Flusstests grün OHNE jede Änderung an
ihnen (Regel §0.3).

Hinweis (Review): die ALT-Dev-Checks `.tmp/check_art_slice1.mjs` und
`.tmp/check_art_slice15.mjs` asserten 16×16 für alle TILE_ART-Grids und
sind durch die 32×32-Kronen obsolet. Sie sind NICHT Teil der Abnahme,
werden weder editiert noch ausgeführt; niemand "repariert" sie nebenbei.

## 6. Screenshot-Route + Juror-Schleife (Kern des Passes)

### 6.1 Szenen (neues Skript `.tmp/shot_gfx2.py`, Besitz: Proof-Agent)

Vorlage ist `.tmp/shot_slice3.py` (Zeitlupe/Freeze via performance.now-
Wrapper, Route-Interception für Telemetrie, park_foes-Kamera-Rig). Server auf
Port 8124. Jede Szene: null Konsolen-Fehler, sonst rot.

| Datei | Szene | Was sie beweisen muss |
|---|---|---|
| `g2_01_friedhof_teich.png` | Südost-Quadrant Friedhof, Spieler am Teichufer (~Tile 27,17) | Wasser-Rampe, Ufer-Fringes, Gras-Varianten auf großer Fläche |
| `g2_02_friedhof_waldrand.png` | Ostrand (x 33 bis 39), Spieler läuft halb unter einer Großkrone | 2×2-Kronen: Volumen, Überlappung, Layering über dem Spieler |
| `g2_03_katakomben_halle.png` | Nordhalle mit Pfeilern und Wandfackeln | Boden-/Wand-Varianten, Moos-Fringes, Lichtstimmung |
| `g2_04_gruft_wasser_a/b/c.png` | Flüstergruft, gefluteter Süd-Korridor, Spieler IM Wasser, Fackel nah; DREI Shots bei Spielzeit t=0,25 / 0,75 / 1,25 s nach Freeze-Anker (FRAME-MITTEN, nicht die 0,5-s-Grenzen — Float-Risiko, Review) | Wasser-Loop sichtbar (Serie zeigt water → water_1 → water_2), begehbares Wasser, dunkelste Ebene |
| `g2_05_zweite_reihe.png` | Friedhof im Fackelschein: geparkte Gegner (Skelett, Ghul, Grufthund, Rostpanzer) plus Vase/Urne/Truhe neben dem Spieler | Sprite-Politur, Größenverhältnisse, Umriss-Konsistenz |
| `g2_06_boss_arena.png` | Bosskammer, Grabwächter idle, Spieler am Südeingang | Steinboden-Varianten auf der größten gleichzeitig sichtbaren Fläche (166 Boden-Tiles, Ein-Bildschirm-Arena) |

### 6.2 Juroren (3 parallel, verschiedene Blickwinkel, Median zählt)

Blickwinkel: (1) SNES-Pixel-Art-Handwerk (Rampen, Cluster, Dithering,
Umrisse), (2) Szenen-Komposition/Weltglaubwürdigkeit (Wiederholung, Struktur,
Silhouetten), (3) Spielbarkeits-Lesbarkeit (Figuren vor Grund, Gefahr vor
Deko, HUD-Integration).

Jeder Juror sieht: die g2_*-PNGs der Runde, die Baselines
(`slice1_graveyard_action.png`, `slice1_catacombs_action.png`,
`s3_01_fluestergruft_panorama.png`, `s3_02_elite_glut_augen.png`) und ab
Runde 2 die g2_*-Vorrunde. Er benotet 1 bis 10 gesamt plus je Kriterium:

1. Wiederholungsfreiheit der Flächen (greifen die Varianten?)
2. Waldsilhouette und Kronenvolumen (wirken die 2×2-Kronen?)
3. Wasserdarstellung (Rampe, Uferübergänge, Bewegung in der Serie)
4. Zweite-Reihe-Sprites und Props (Rampen, Silhouetten, Konsistenz)
5. Gesamtkohärenz Richtung Secret of Mana (Licht, Palette, Dichte)

Pflicht: pro Kriterium unter 8 mindestens eine PIXELGENAU umsetzbare
Anweisung ("Kronenrand braucht 1-px-k-Lücken alle 3 bis 5 px", nicht "schöner
machen").

### 6.3 Schleife

Runde = Screenshots → 3 Juroren parallel → Median der Gesamtnoten.
- **Abnahmeziel des PROJEKTS ist 10 (Vorgabe Michael, 07.07.2026):** die
  Schleife stoppt NICHT mehr früh bei Median 8. Eine 8 ist Meilenstein
  dieses Passes, keine Endabnahme; alle 3 Runden werden genutzt, außer der
  Median erreicht 10. Die grafische Endabnahme des Projekts erfolgt über
  weitere Pässe (nach Slice 4/5), bis Median 10 steht.
- Median < 8 und Runde < 3: Art-Fixer setzt die Juror-Anweisungen um (nur
  `game/js/art/`-Dateien), danach Selbstcheck + Smoke, nächste Runde.
- **Struktur-Eskalation INNERHALB der Runde (Review-Major):** Anweisungen,
  die Engine/Maps betreffen (Kronen-Setzung/gen_overrows2, Legenden,
  tilemap.js — z. B. "Ostkante braucht dichtere Anker-Staffelung"), gehen
  SOFORT an den Hauptloop; der entscheidet und lässt einen Engine-Fixer
  (Opus) die Änderung NOCH VOR der nächsten Screenshot-Runde umsetzen
  (Smoke + Flusstests danach grün). Der Pass heißt "Struktur statt
  Politur" — die Schleife darf die Struktur-Achse nicht aushungern, sonst
  stallt genau das Kopf-Kriterium 2 unter 8.
- Nach Runde 3: Abbruch mit Dokumentation des Fortschritts (Noten je Runde)
  in der Übergabe.

## 7. Datei-Besitz (exklusiv, kein paralleles Schreiben an derselben Datei)

| Agent | Dateien |
|---|---|
| Engine-Builder | `game/js/world/tilemap.js`, `game/js/world/maps.js`, `game/js/world/map_fluestergruft.js`, `game/js/world/map_bosskammer.js`, `tools/smoke_test.mjs`, `.tmp/gen_overrows2.mjs` |
| Art-Builder | `game/js/art/palette.js`, `game/js/art/sprites.js`, eigene Dev-Checks in `.tmp/` |
| Integrator | darf alle NICHT-Tabu-Dateien beider Builder anfassen, um alles grün zu machen; main.js nur laut §0.4 |
| Proof-Agent | `.tmp/shot_gfx2.py`, `.tmp/screenshots/g2_*` |
| Art-Fixer (Schleife) | wie Art-Builder |

Schnittstelle Engine↔Art: die Key-Namen und Maße aus §3.1 sind eingefroren.
Der Engine-Builder darf für seine Dev-Checks Platzhalter-Grids in .tmp/
verwenden, niemals in sprites.js schreiben. Bei versehentlicher Doppelanlage
gewinnt der Besitzer; Inhalt = wörtlich diese Spec (Muster aus Slice 3).

## 8a. Runde-2-Entscheidungen des Hauptloops (Struktur-Eskalation nach §6.3)

Jury-Runde 1: 6 / 6 / 6,5, Median 6. Die strukturellen Juror-Befunde wurden
im Hauptloop geprüft (inkl. eigenem Live-Screenshot-Vergleich gegen die
Baseline). Ergebnis: die "Licht-Regression" ist KEINE Regression dieses
Passes (lighting.js/Werte seit f620c2a unverändert; die Slice-1-Baseline
stammt aus einer helleren Balancing-Ära), aber der Befund ist in der Sache
richtig und notenrelevant. Für Runde 2 gelten folgende DOKUMENTIERTE
Ausnahmen und Erweiterungen (eng begrenzt, gameplay-neutral):

1. **Licht-Feintuning:** main.js AUSSCHLIESSLICH die Konstante
   TORCH_RADIUS (56 → 72). lighting.js AUSSCHLIESSLICH ein zusätzlicher
   additiver Warm-Glow-Pass für stark flackernde Lichter (flicker >= 0.8,
   also nur Fackeln): radialer Gradient in Fackel-Orange, Alpha <= 0.15,
   composite 'lighter'. KEINE Logik-/Strukturänderung. Ambient-Werte der
   Maps bleiben unverändert (Diablo-Identität).
2. **Palette:** Die Bestandstöne a, m, V, P dürfen um maximal 12 %
   aufgehellt werden (Farbton bleibt); zusätzlich sind 'K' (warmes
   Mittelgrün) und 'M' (Sandbraun/Tan für den Weg) freigegeben.
   Gesamtbudget neuer Töne bleibt 4 (0, 9, K, M).
3. **Ufer-Kacheln (Teich):** Neue TILE_ART-Keys `shore_n/e/s/w/ne/nw/se/sw`
   (16×16). Engine: das GRAVEYARD-'~' bekommt ein Legenden-Feld, das den
   Fringe-Präfix für diesen TARGET auf 'shore' umlenkt (nur bei
   Quelle-Set 'grass'; die Moos-Ufer der FLUESTERGRUFT bleiben unverändert,
   die Juroren haben sie gelobt). Ergebnis: Schaumsaum + dunkle Wasserlinie
   statt harter Rechteckkante; Ecken-Tiles runden die Teichform optisch.
4. **Kronen-Schlagschatten:** Neuer TILE_ART-Key `canopy_shadow` (16×16,
   50%-Dither aus dunklen Tönen, KEIN Alpha nötig). tilemap.js zeichnet ihn
   im GROUND-Pass (unter den Entities) auf die Zellen direkt UNTER jeder
   2×2-Anker-Fläche (ax..ax+1, ay+2; außerhalb der Map: überspringen).
   Deterministisch aus overCells abgeleitet.
5. **Kronen-Stagger:** gen_overrows2.mjs staffelt vertikale Anker-Läufe
   (Ost-/West-Baumreihen) per Parität zwischen Spalte trunkX-1 und trunkX
   (±16 px Versatz) — gegen den "gerade Wand"-Befund.
6. **Weg-Varianten:** `path_v2`, `path_v3` (16×16) neu; GRAVEYARD-'='
   erhält alle vier in variants. Optional `grass_dark_v3` als vierte
   Gras-Variante.
7. Smoke-Test: Abschnitte 16/35 werden für die neuen Keys/Features additiv
   erweitert (Shore-Präfix-Logik, Schatten-Zellen, 4 Weg-Varianten).
8. **Unverändert TABU:** warden_*, torch_*, fringe_*/moss_fringe_*,
   entities/, items/, ui/, Flusstests. Die Juror-Anweisungen zum Boss-
   Umriss und zur Fackel-Flamme werden bewusst NICHT umgesetzt (Warm-Glow
   aus Punkt 1 übernimmt die Fackel-Wirkung); Priorität liegt auf den
   Median-Treibern.

## 8b. Runde-3-Entscheidungen des Hauptloops (Struktur-Eskalation nach §6.3)

Jury-Runde 2: 6 / 6,5 / 6,5, Median 6,5 (Runde 1: 6). Eigenbefund des
Hauptloops an den Bildern: der Teich rendert als "Bilderrahmen-Gitter",
weil die Tiefen-Rampe PRO KACHEL statt über den WASSERKÖRPER umgesetzt
wurde — Ursache war eine fehlerhafte Konsolidierung der Juror-Anweisung
durch den Hauptloop selbst (dokumentiert, Lehre für die Übergabe).
Für Runde 3 (letzte Runde dieses Passes) gilt zusätzlich:

1. **Wasser-Tiefen-Autotiling (Engine):** createTilemap berechnet einmalig
   je Wasser-Tile die Chebyshev-Distanz zum nächsten Nicht-Wasser-Tile.
   Legenden-Feld `depthOverlays: ['water_shallow', 'water_mid']` am '~'
   (GRAVEYARD + FLUESTERGRUFT): Distanz 0 → 'water_shallow'-Overlay,
   Distanz 1 → 'water_mid', tiefer → nichts. Zeichnung im Ground-Pass NACH
   Tile und Shore/Fringe. Deterministisch, keine Anim-Interaktion (die
   Overlays sind statisch über dem animierten Wasser).
2. **Art-Wasser-Neubau:** Die Pro-Kachel-Randaufhellung wird ENTFERNT
   (Basis flächig dunkel); Tiefe kommt ausschließlich aus den neuen
   Overlays water_shallow/water_mid (lichte Dither-Schleier, 16×16, viel
   '.'). Kräusel: längere horizontale Striche (4-6 px, 2-3 Zeilen pro
   Kachel), Drift 2-3 px pro Frame (muss in der g2_04-Serie SICHTBAR
   sein; der Proof-Agent belegt das per Pixel-Diff der Frames a/b/c).
   Shore-Band entschärfen (Schaum statt Neon-Rahmen), Ecken-Shores mit
   2-3 px Gras-Biss (optische Teich-Rundung). Der Ton '9' darf als
   Runde-2-Neuton frei nachjustiert werden.
3. **Katakomben-Paket:** brick_wall_v3 (Diagonalriss, versetzte
   Highlight-Reihen) und stone_floor_v3 (gebrochene Platte) NEU; die
   Bestandsvarianten v1/v2 werden DEUTLICH unterscheidbar nachgeschärft
   (fehlender Ziegel = dunkles Loch, Moosfleck satter). Die kalten
   Katakomben-Steintöne t/T/L/D dürfen um bis zu 10 % aufgehellt werden
   (Mobile-Lesbarkeit; Ausweitung von §8a.2).
4. **Ambient: VERWORFEN (Eskalations-Entscheid des Hauptloops im Lauf):**
   Die geplante Anhebung (CATACOMBS 0.78, BOSS_KAMMER 0.66) kollidiert mit
   den unantastbaren Flusstests (asserten ambient 0.82 bzw. 0.70). Die
   Eiserne Regel §0.3 schlägt die Runden-Entscheidung — alle Ambient-Werte
   bleiben unverändert. Die Mobile-Lesbarkeit trägt stattdessen §8b.3
   (Steinton-Aufhellung). Ambient-Rebalancing wandert ins Backlog für
   Grafikpass 3, wo die Flusstest-Anpassung sauber per Spec eingeplant
   wird (mit erlaubten Alt-Test-Änderungen wie in Slice 3 §4).
5. **Kronen-Licht:** Licht-Kappe oben-links je Laub-Lappen (2 Stufen bis
   'A'), 1-px-Glanzcluster auf Hauptlappen, Zwischenräume der Lappen auf
   '0' vertieft; die zwei freistehenden Einzel-Füller bekommen dieselbe
   3-Ton-Rundung plus Kerben; Hecken (gestapelte tree_canopy) oben 2 px
   Lichtkante, unten 3 px Schattensaum. Eine positionsabhängige
   Hinterreihen-Abdunklung wird NICHT gebaut (bräuchte Tiefen-Wissen im
   Renderer; als Kandidat für Pass 3 notiert).
6. **Sprite-Erdung:** Kontaktschatten werden als 1-px-Dither-Reihe UNTER
   die Füße/Basis DIREKT IN die Sprites gebacken (vase, urn, chest_*,
   skeleton, ghoul, hound, rust) — kein entities/-Eingriff. Ghul: Brust/
   Gesicht heller, Flanke dunkler; Skelett-Silhouette aufräumen (dickere
   Knochen, klarer Schädel); globale Lichtrichtung oben-links.
7. Smoke additiv (16/35): neue Keys (water_shallow, water_mid,
   brick_wall_v3, stone_floor_v3), Depth-Overlay-Determinismus-Test
   (Distanz-0/1/2-Zellen liefern shallow/mid/nichts).
8. Danach ist der Pass ABGESCHLOSSEN (3 Runden voll): Abnahme mit dem
   Notenverlauf, Rest-Anweisungen wandern als Backlog in die Übergabe für
   Grafikpass 3 (neue Skala: 10 = moderne Handy-Pixel-Art, SoM ≈ 8,5-9).

## 8. Abnahme

1. `bash tools/check_syntax.sh` grün; `node tools/smoke_test.mjs` 3× grün.
2. Alle drei Flusstests grün, UND `git diff --stat` beweist: keine Änderung
   an `.tmp/check_*.mjs`, `game/js/entities/`, `game/js/items/`,
   `game/js/ui/`, `game/js/core/`, `game/js/main.js` (oder dokumentierte
   Integrator-Ausnahme), Ground-rows byte-identisch.
3. Drei dokumentierte Runden mit Notenverlauf (Ziel dieses Passes:
   Median >= 8 als Meilenstein; PROJEKT-Abnahmeziel bleibt 10 und wird
   über Folgepässe verfolgt — Vorgabe Michael 07.07.2026).
4. Null Konsolen-Fehler in allen finalen Screenshots.
5. Finale g2_*-Screenshots liegen in `.tmp/screenshots/`.
6. Übergabe in `uebergaben/`, Erkenntnisse in `workflows/GRAFIKPASS_2.md`,
   Git-Commit, Memory-Update (letzteres macht der Hauptloop).
