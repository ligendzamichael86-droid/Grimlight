# GP6 Spec-Review Runde 1 (12.08.2026, wf_9f7551ad-ff4) — Befunde gegen Rev 1



---

# PRÜFER 1 — Tests & Wächter (4 BLOCKER / 9 MAJOR / 9 MINOR)


## Befunde — adversariale Prüfung SPEC_GRAFIKPASS_6.md (Rev 1)

Baseline verifiziert (read-only): `tools/smoke_test.mjs` GRÜN, `check_main_slice1` 25/25, `check_inventory_slice2` 25/25, `check_boss_slice3` 33/33; `.tmp/check_lighting_input_slice1.mjs` crasht (bestätigt "bekannt rot"). Keine Spieldatei angefasst, Port 8123 nicht berührt.

---

### BLOCKER

**B1 — §6.7(a): 8-Zeilen-Füllrampe passt physisch nicht in die XP-Leiste**
Beleg: `game/js/ui/hud.js:181-182` — `const xx = 4, xy = 36, xw = 26, xh = 5;` / `ih = xh - 2` ⇒ **Innenhöhe 3 px**. Eine "Füllrampe grün-golden 8 Zeilen" ist dort arithmetisch unmöglich. Vergrößern auf 12 px (Boss-Bar-Sprache) schiebt die Leiste auf y 36..47 und damit aus dem Panel `hud.js:54` (`px=2, py=2, pw=54, ph=40` ⇒ y2..42) **und aus der M1-HUD-Maske** (§1: "Panel (2,2,54,40) +1 px") — die Negativ-Kontrolle "Anteil L>128 = 0" kippt dann durch HUD-Leckage.
Fix: Entweder Rampe auf 3 Zeilen (Glanz/Grundton/Tief) spezifizieren, oder XP-Leiste auf `xh=12` + Panel `ph` 40→52 + M1-Maske in §1 explizit auf das neue Panel-Rechteck nachziehen (beides deklarationspflichtig, weil M1-Fenster).

**B2 — §2.1/§2.7 gegen M2: 12 Stufen ⇒ 13 Werte, Gate verlangt ≤ 12**
Beleg: §2.1 "`LIGHT_STEPS = 12` … rundet auf k/12"; §2.7 "quantizeLight-Wertemenge (**genau 13 Werte** 0..1)"; §1/M2 "`lichtstufen_anzahl`: distinkte a-Werte … **≤ 12**". In der Punch-Zone (innerhalb der Licht-Bbox, §2.2) treten k=0..12 auf, also 13 distinkte a-Werte. Das Messziel ist per Konstruktion rot.
Fix: `LIGHT_STEPS = 11` (12 Werte) setzen ODER M2 auf `≤ LIGHT_STEPS + 1` formulieren und die Zahl aus der Engine-Konstante ableiten (wie es §1 für die Stufenliste ohnehin fordert).

**B3 — §7.G Maßtabelle deckt eine §5.3-Größe nicht ab ⇒ check_gfx6_art geht rot**
Beleg: §5.3 fordert `canopy_shadow_xl_[a|b|c]` mit **`sw·16 × 32`**; §5.1 gibt xl_b `span [4,3]` ⇒ Schatten **64×32**. §7.G nennt die Maßtabelle `{16, 32, 48×32, 64×48}` — 64×32 fehlt. Der zu portierende Wächter ist hart: `.tmp/check_gfx5_art.mjs:92-95` (`const want = … ? 32 : 16; if (g.length !== want || g[0].length !== want) bad(...)`) — jedes nicht gelistete Maß meldet FEHLER.
Fix: Maßtabelle in §7.G auf `{16×16, 32×32, 48×32, 64×48, 64×32}` erweitern (oder xl_b-Schatten auf 64×48 vereinheitlichen).

**B4 — §2.6 und §6.6 verschieben "den Docht" an zwei verschiedene Orte**
Beleg: Lichtzentrum ist die Kachelmitte (`main.js:214-216`: `map.findTiles(ch).map(t => ({x: t.x, y: t.y, …}))`, tc-Mitte ⇒ Sprite-Zeile 8). Heute `lighting.js:260` `const hotY = cy - 3;` = **Sprite-Zeile 5**. §6.6 legt den Flammenkern `'1'` auf **Zeilen 5..7** — das ist genau `cy−3 … cy−1`. §2.6 verschiebt HOT_RINGS aber auf **`cy+2` = Zeile 10**; in `torch_0` (Probe) sind Zeilen 8-13 `k/P/p` = **Holzgriff**, in `torch_wall_0` ist Zeile 10 die **Wandziegelzeile**. Der additive Hotspot säße 3-5 Zeilen unter dem neuen Kern.
Fix: §2.6 streichen bzw. auf `cy−3` (unverändert) oder `cy−2` festschreiben und im selben Satz an §6.6 koppeln ("Hotspot-Zentrum = Mitte des neuen '1'-Kerns"); der Weiß-Stresstest referenziert dann denselben Punkt.

---

### MAJOR

**M1 — §3.4/M1: der Highlight-Anteil kann aus den genannten Quellen nicht kommen (Rechnung ignoriert das Overlay)**
Beleg: Das Dunkel-Overlay ist source-over (`lighting.js:136-138,176`), also `L_out = L_src·(1−a) + L_tint·a`. Break-even für L>128 im unbeleuchteten Bild:
GRAVEYARD (tint `#0a0a18`, L 11,6; a 0,22) ⇒ `L_src > 160,8` · CATACOMBS (`#06080f`, 8,2; 0,55) ⇒ **274 (unmöglich)** · FLUESTERGRUFT (`#04100c`, 12,0; 0,52) ⇒ 253,7 · BOSS_KAMMER (`#120608`, 9,8; 0,48) ⇒ 237,1.
§3.4 nennt als Quellen 'A' 129,2 (liest unbeleuchtet **103,3**), Kronen-Spitzlichter aus derselben Rampe (≤ 'A') und das Teich-Specular '=' ≈ 108 (liest **86,8**) — keine davon überschreitet 128 außerhalb voll gestanzter Lichtkerne. GRAVEYARD hat dafür nur **3 Fackeln** (Probe `findTiles('F')` = `(248,88)`, `(152,232)`, `(456,296)`; je Messkamera ist genau **eine** im Bild) plus die Spielerlaterne r=40.
Fix: §3.4 durch einen echten Hebel ersetzen — ein Spitzlicht-Ton oberhalb des Break-even (z. B. Kronen-/Specular-Highlight ≥ L 165) deklarieren, ODER M1 auf `Anteil(L > 96)` umstellen, ODER den L>128-Anteil nur innerhalb der Punch-Zonen messen (mit angepasster Schwelle).

**M2 — M3-Positiv-Kontrolle „`__noLight` ⇒ ΔWarm = 0" ist mit dem geerbten Rig nicht herstellbar**
Beleg: `.tmp/shot_gfx5.py:219-230` — `WRAP_LIGHTING` unterdrückt ausschließlich `createLighting(...).draw`. Die Sprite-Tinten der §4.2-Fassade sitzen laut §4.2/§8-Phase-2 in **`main.js` (um die renderables-Schleife `main.js:672`)**, und `main.js` wird vom Rig nicht geroutet (`ROUTE_RE`, shot_gfx5.py:247-249, listet nur player/enemies/projectiles/props/tilemap/particles/lighting/hud). Unter `__noLight` bleiben die Warm-/Kalt-Masken also gezeichnet ⇒ ΔWarm ≠ 0, die Kontrolle ist tot.
Fix: In §4.2 einen Rig-Schalter mitspezifizieren — entweder Fassade an `window.__noTint` koppeln (main.js darf window lesen, `main.js:97`-Muster), oder `core/sprite_factory.js` in §1 als zusätzlich wrappbares Modul deklarieren und shot_gfx6.py mit `WRAP_SPRITE_FACTORY` ausstatten.

**M3 — §2.3 Frame-Cache invalidiert nicht auf Lichtpositionen**
Beleg: §2.3 "Läufe nur neu berechnen, wenn sich **ganzzahlige Kamera oder ein quantisierter Radius** geändert hat." `main.js:154-155` bewegt `playerLight.x/y` **jeden Frame** mit dem Spieler; `main.js` hängt zusätzlich pro Frame Drop- und Elite-Lichter an `frameLights` an (Selten-Drop-Lichter, `eliteLights(enemies)`, `mapDef.extraLights`). Mit dem spezifizierten Cache-Schlüssel klebt der Laternenkegel an der letzten Kameraposition.
Fix: Cache-Schlüssel um die gerundeten Lichtpositionen, die Lichtanzahl und die quantisierten Flicker-Phasen erweitern (oder Cache nur für Lichter mit `flicker >= 0.8` und statischer Position, Rest jeden Frame rechnen).

**M4 — §2.2 legt die Quantisierungs-REIHENFOLGE bei mehreren Lichtern nicht fest; beide Lesarten brechen je eine M2-Kontrolle**
Beleg: §2.2 "`a = ambient · Π rest_l` … quantisiert per quantizeLight". Lesart A (jedes `rest_l` einzeln quantisieren): Produkte von k/12 liegen nicht mehr auf dem Raster ⇒ in der CATACOMBS-Worst-View (12 Fackeln, §2.4) weit mehr als 12 Stufen ⇒ `lichtstufen_plateau_anteil ≥ 95 %` fällt. Lesart B (das fertige `a` inkl. ambient quantisieren): dann ist a ∈ k/12, und die M2-Kontrolle "fackelferne Zone → `a == mapDef.ambient ±0,01`" scheitert, weil 0,55 kein Vielfaches von 1/12 ist (nächster Wert 7/12 = 0,5833, Δ = 0,033).
Fix: In §2.2 verbindlich schreiben: „`rest = Π rest_l` wird **nach** dem Produkt EINMAL quantisiert, `a = ambient · quantizeLight(rest)`" — damit gilt `quantizeLight(1) = 1` und die Fernzonen-Kontrolle stimmt exakt; §2.3's `X = 1 − a/ambient` ist dann konsistent.

**M5 — §5.3 „Versatz +2/+2" reißt den XL-Schatten von der Krone ab**
Beleg: Der Bestandsschatten trägt bewusst **denselben Ankerversatz** wie die Krone (`tilemap.js:774-778` speichert `anchorOffset(def,tx,ty)` in `shadowCells`, `tilemap.js:1021-1024` zeichnet mit `sx + soff.dx, sy + soff.dy`; Kommentar `tilemap.js:759-762`: "sonst risse er bei bis zu ±14/±4 px sichtbar ab"). §5.2 gibt den XL-Keys `ANCHOR_CLAMP` W=4 ⇒ dx ∈ [−4,4], dy ∈ [−4,4]. Ein fixes +2/+2 statt/zusätzlich zu diesem Offset ergibt bis zu 6 px Abriss. Außerdem nennt §5.3 nur drei Schatten-Keys `[a|b|c]`, §5.1 aber **sechs** XL-Kronen (inkl. `_m`) — für die gespiegelten Fassungen ist keine Schatten-Zuordnung definiert.
Fix: §5.3 präzisieren: "Versatz = `anchorOffset` der Krone **plus** (+2,+2)"; und festlegen, dass `_m`-Kronen denselben `canopy_shadow_xl_*`-Key spiegelbildlich (oder unverändert) ziehen.

**M6 — §6.4/§7.G: das portierte '='-Zähl-Gate misst die falschen Kacheln**
Beleg: `.tmp/check_gfx5_art.mjs:108-115` zählt `'='` **nur über `water`/`water_1`/`water_2`/`water_3`** (Gate ≥ 20). §6.4 legt das Specular auf `water_shallow/_v1/_v2`, §7.G ergänzt nur "Specular-Zählung 4..6/Kachel" — ob das alte Gate bestehen bleibt (und ob die Water-Frames ihre `'='` behalten dürfen) ist offen. Zusätzlich: `'='` steigt laut §3.1 von 74,3 auf ~108, was jedes Specular-Pixel in den 4 Wasser-Frames mit-anhebt, ohne dass §6.4 das für den Teich-Kern deklariert.
Fix: §7.G explizit machen: altes '='-Gate auf `water_shallow*` umhängen (bzw. beide Gates getrennt führen) und in §6.4 sagen, ob die vier `water_*`-Frames ihre `'='`-Tupfer behalten.

**M7 — God-Mode-Regression hängt in keinem Gate; der zu portierende Rig-Wrapper ist schon veraltet**
Beleg: §0.9 fordert "God-Mode-Verhalten (7e1d86d) bleibt unangetastet", §8 Phase 3 / §10 listen als Suiten nur "syntax, smoke 3×, 3 Flusstests, check_gfx6_art" — `.tmp/probe_god.mjs` (25 Assertions, u. a. `gottText() === 2`, `goldText() === 'GOLD 500'`) taucht nirgends auf. Zusätzlich verschluckt `shot_gfx5.py:110-113` (`export function createPlayer(spawn) { const p = __cp(spawn); … }`) das zweite Argument von `main.js:169` `createPlayer(spawn, { god: godMode })` — beim Port nach shot_gfx6.py wandert der Defekt mit.
Fix: `.tmp/probe_god.mjs` in §10 in die Grün-Liste aufnehmen; in §1 anweisen, `WRAP_PLAYER` beim Port auf `(...a)`-Durchreichung zu korrigieren.

**M8 — M4 `verdeckt_kopf ≥ 120` ist gegen die geerbte Fensterdefinition nicht belegbar**
Beleg: Landkarte T-Zeile 1940 definiert das Bestandsgate als "≥ 20 verdeckte **Kopf**-Texel (`KRONEN_HEAD_ROWS=9`)" auf der Sprite-Box `(cx−8, cy−17, +16, +24)` ⇒ Kopf-Fenster **16×9 = 144 Texel maximal**. §1/M4 fordert `verdeckt_kopf ≥ 120` — das sind 83 % Volldeckung — nennt aber `KRONEN_HEAD_ROWS` für GP6 nicht neu. Die Landkarten-Rechnung dahinter (3·16−17 = 31 Zeilen) setzt eine **3 Kacheln hohe** Krone voraus; §5.5 legt für das Nord-Dach um (31,9) aber keine XL-Klasse fest, und zwei der drei Klassen (§5.1 xl_a/xl_c, `span [3,2]`) sind nur 2 Kacheln hoch.
Fix: In M4 `KRONEN_HEAD_ROWS` für GP6 explizit setzen (z. B. 16) und in §5.5 festschreiben, dass die Beweiszelle unter einer `span [4,3]`-Krone (xl_b) liegt.

**M9 — §4.2: die Fassade braucht zwei nicht spezifizierte Kanäle**
Beleg: Drops (`main.js:666`) und Projektile (`main.js:669`) liegen **innerhalb** der renderables-Schleife, die §4.2 umhüllt — die geforderte Ausnahme "Level-Up-Ring, Drops, Projektile: ohne Tint" braucht also einen Pro-Renderable-Schalter. Zweitens sieht die Fassade nur das **Canvas** aus `gfx`, `buildTintMask(grid, palette, toneHex)` braucht aber das **Grid** — eine Canvas→Name/Grid-Rückabbildung ist nirgends spezifiziert.
Fix: §4.2 um zwei Sätze ergänzen: `renderables.push({fy, tint:false, draw})` als Flag, und "die Masken-Registry wird beim Bau von `gfx` als `Map<canvas, {name, grid}>` mit aufgebaut (additiv, nach main.js:71)".

---

### MINOR

**m1 — §7.D öffnet einen Bestandstest, der gar nicht bricht.** `tools/smoke_test.mjs:1795-1797` prüft `shadowAt.length === 2 && hit(2,4) && hit(3,4)` mit `hit = (x,y) => shadowAt.some(...)` — **reihenfolge-unabhängig**. Der Schatten-Zweitpass (§5.3) allein macht keine Änderung nötig; nur der XL-Ein-Draw tut es.
Fix: §7.D auf "XL-Ein-Draw + span-generische Schattenzeile" eingrenzen, "Zweitpass-Reihenfolge" streichen.

**m2 — §3.3 Vignette: VIG_MAX_LEVEL bleibt unerwähnt.** Mit `VIG_STEP 0,06` und unverändertem `VIG_MAX_LEVEL = 5` (`hud.js:461`) wird Stufe 5 bereits bei Profilwert a ≥ 0,30 erreicht (t ≈ 0,78) — die Bildecken (d ≈ 168..184 px) laufen ins Plateau statt weiter abzudunkeln.
Fix: In §3.3 ergänzen "VIG_MAX_LEVEL bleibt 5; das stückweise lineare Profil wird auf a_max 0,30 reskaliert" (oder das Plateau bewusst deklarieren).

**m3 — §5.2: Scherposen und Bestands-Pixel-Sway laufen dann parallel.** `tilemap.js:931` addiert span-Ankern bereits `swayPhase(...).dx` (±1 px). §5.2 sagt nur "SWAY_DX und smoke:2390 bleiben unberührt", nicht, ob der Pixel-Versatz für XL-Anker entfällt — sonst schert UND wackelt die Krone.
Fix: Einen Satz: "für Defs mit `swayPoses` entfällt der Pixel-Versatz `ax += swayPhase(...).dx`".

**m4 — §5.2/§0.6: swayPose8 ohne Hash-Vorgabe.** §0.6 verlangt ungerades n für `variantIndex`; die 8-Posen-Folge darf deshalb nicht über `variantIndex(...,8)` laufen.
Fix: "swayPose8 arbeitet rein zeitbasiert nach dem Muster `swayPhase` (`tilemap.js:576-587`), Cluster-Versatz weiterhin `SWAY_CLUSTER_N = 7`."

**m5 — §3.1/§5.1/§6.2 gegen den eingefrorenen Palettenumfang.** `.tmp/check_gfx5_art.mjs:51-54` friert 61 alnum + 3 Symboltöne ein (heute exakt 64 Keys, verifiziert). §7.G zieht nur `NEW_TONES` nach; ob GP6 **neue** Töne anlegen darf, sagt die Spec nirgends.
Fix: In §3.1 ein Satz: "Es entstehen KEINE neuen Palettenschlüssel; check_gfx6_art hält 61 alnum + 3 Symbole" (oder die neue Zahl nennen).

**m6 — §6.3 ist sachlich korrekt, aber der Beleg lässt sich schärfen.** Nachgeprüft: `GRAVEYARD.rows[15][28] === 'p'` und `[29] === 'p'`, `legend['p'] = {art:'pebble_small', solid:false, fringeSource:true, fringeSet:'grass', bankSet:'g'}`; `torchChars = ['F']`, playerSpawn tc(3,12), einziges Portal tc(32,2), nächster Spawn (200,152) = tc(12,9) ⇒ **sol und geo nachweislich unberührt** (`solHash` liest nur `.solid`, `geoHash` nur `findTiles('F')`, `tilemap.js:813` ist ground-only).
Fix: Die konkreten Belegstellen (maps.js-Zeile der ROWS, `smoke_test.mjs:1998-2008`) in §6.3 aufnehmen, damit der Integrator nicht neu suchen muss.

**m7 — §0.5 „Indizes 0..74" stimmt nur zufällig.** `SPRITES` hat exakt 75 Keys (verifiziert), aber beide Flusstests mappen die Flip-Kanäle unvollständig: `check_main_slice1.mjs:94-99` listet 12 Flips, `check_inventory_slice2.mjs` 22 — `main.js:55-67` erzeugt **31**. Ab Index 87 bzw. 97 sind alle TILE_ART-Namen in `nameOf` bereits heute um 19 bzw. 9 verschoben. Alle namensbasierten Assertions (`playerScreen`, `nearestSkeletonRel`, `heart_full/_empty`, `icon_boomerang`) liegen in 0..74, deshalb ist der Bestand grün — und die §4.2-Masken landen korrekt in `extra_N` (nameOf-Snapshot wird vor dem ersten Frame gebaut).
Fix: In §0.5 ergänzen: "namensbasierte Assertions nur auf SPRITES-Indizes 0..74; TILE_ART-Namen der Flusstests sind bereits verschoben und dürfen von keiner neuen Assertion benutzt werden".

**m8 — §5.5-Guard bitte zeilenexplizit.** Nachgeprüft: Über-Fenster im Bestandstest ist `ty 0..12` (`tyEnd = ty1+1`, `tilemap.js:905`) und wird mit §5.4 auf `tx 0..21`. Heute sind Zeile 12 und Spalte 21 leer (Probe über `GRAVEYARD.overRows`) — der Guard ist also notwendig UND heute erfüllt.
Fix: Formulierung schärfen auf "Spalte 21 in **allen** Zeilen 0..12 leer, Zeile 12 in allen Spalten 0..21 leer", sonst rechnet der Generator nur die Kamera-Zeile durch.

**m9 — §2.4 Perf-Budget ohne Run-Obergrenze.** Im Viewport liegen 160×90 = 14 400 2×2-Blöcke; Bayer auf Blockebene bricht Läufe an jeder Stufengrenze. Ohne Deckel kann der Licht-Pass in der 12-Fackel-View mehrere tausend `fillRect` je Frame absetzen — Entschärfungsstufe (2) ist dann schon Pflicht, nicht Reserve.
Fix: In §2.4 eine harte Zusatzschwelle nennen (z. B. "≤ 1 200 fillRect je Frame, sonst Stufe 2 sofort"), messbar im Aufrufprotokoll aus §2.7.

---

**Bilanz: 4 BLOCKER / 9 MAJOR / 9 MINOR.**


---

# PRÜFER 2 — Renderer, Performance, Machbarkeit (5 BLOCKER / 10 MAJOR / 4 MINOR)


Alle Prüfungen sind gelaufen (5 eigene Proben in `.tmp/`, keine Spieldatei berührt, kein Port belegt — Playwright lief über `set_content` ohne Server). Hier der Befund.

---

# LINSE 2 — Renderer, Performance, Machbarkeit
Prüfling: `design/SPEC_GRAFIKPASS_6.md` (Rev 1) · HEAD 7e1d86d

**Eigene Probendateien:** `/home/coder/Grimlight/.tmp/gp6_pruef_lightruns.mjs`, `.tmp/gp6_pruef_lightruns2.mjs`, `.tmp/gp6_pruef_fillrate.py`, `.tmp/gp6_pruef_fillrate2.py`, `.tmp/gp6_pruef_sprite_licht.mjs` (+ PNG-Decoder/Belichtungsmodell im Scratchpad).

---

## BLOCKER

### B1 — §2.4: Das Perf-Budget liegt UNTER den Kosten des unveränderten Renderers
**Beleg** (`.tmp/gp6_pruef_fillrate2.py`, Chromium, 300 Frames, Nachbau von `lighting.js:127-277` inkl. Warm-Pass):
```
HEUTIGER Licht-Pass komplett (Punch+Warm),  8 Fackeln: 2.22 ms/Frame
HEUTIGER Licht-Pass komplett (Punch+Warm), 12 Fackeln: 3.19 ms/Frame
HEUTIGER Licht-Pass komplett (Punch+Warm), 20 Fackeln: 4.54 ms/Frame
```
§2.4 fordert „Licht-Pass gesamt Mittel ≤ 3,0 ms". Der BESTAND reißt das bei 12 Fackeln bereits (3,19 ms), und §2.5 behält den Warm-Pass ausdrücklich bei. Zusätzlich ist die Annahme „CATACOMBS-Worst-View (12 Fackeln)" falsch: `maps.js:610` (`torchChars: ['W']`) ergibt **25 Fackeln**, der dichteste Kamerastand hat **20 Lichter im Culling-Rect** (`.tmp/gp6_pruef_lightruns.mjs`: `Worst-View: Kamera (96,72) mit 20 Lichtern`). Die Entschärfungskette endet damit zwangsläufig bei „STOPP, Eskalation" — aus einem Grund, der mit der Quantisierung nichts zu tun hat.
**Fix:** Budget auf einen gemessenen Bestands-Baseline-Wert beziehen („≤ 1,3× Bestand am selben Worst-View, P95 ≤ 1,5×") statt auf eine absolute ms-Zahl, und den Worst-View mit 20+1 Lichtern definieren; die Baseline in Phase 0 zuerst messen, dann das Delta-Gate setzen.

### B2 — §2.3: Der Lauf-basierte Punch kostet gemessen 10,4 ms/Frame
**Beleg** (`.tmp/gp6_pruef_lightruns.mjs` = Prototyp von §2.2 mit echten CATACOMBS-Fackeln; `.tmp/gp6_pruef_fillrate.py` = reale Canvas-Kosten):
```
Worst-View: reine JS-Rechenzeit 1.437 ms/Frame | Laeufe/Frame Mittel 7801, max 7989
§2.3-Umbau:  2300 destination-out-fillRect-Laeufe/Frame:   3.47 ms/Frame
§2.3-Umbau:  7800 destination-out-fillRect-Laeufe/Frame:  10.42 ms/Frame
IST-Referenz (Bestand: 20 Lichter x 6 arc+fill):           3.18 ms/Frame
```
Der Umbau ersetzt 120 `arc`+`fill` durch ~7800 `fillRect` — Faktor 65 an Draw-Calls. Ursache ist §2.2 selbst: Bayer auf Blockebene zerschlägt die Lauflängen (`.tmp/gp6_pruef_lightruns2.mjs`: 1 Fackel **2756** Läufe mit Bayer gegen **468** ohne; 8 Fackeln 8729 gegen 2294). Auch die vollständig durchgezogene Entschärfungsstufe §2.4-2 („Bayer nur an Stufengrenzen") landet bei ~2300 Läufen = 3,47 ms + 1,4 ms JS ≈ 4,9 ms.
**Fix:** Läufe auf ganze **Ringbänder** statt auf 2×2-Blöcke abbilden (ein `fillRect` je Scanline-Segment einer Stufe, Bayer nur als ±1-Block-Saum an den Bandgrenzen, Zielgröße ≤ 600 Läufe), oder Option (c) der Landkarte (Zell-Pass im `litDitherCells`-Muster, 1 `drawImage` je 16er-Kachel) wählen; die Zahl der Draw-Calls gehört als hartes Gate in §2.7.

### B3 — §2.3/§2.4-1: Der Frame-Cache greift nie und ist zudem falsch geschlüsselt
**Beleg** (`.tmp/gp6_pruef_lightruns.mjs`, Kamera FIX, 600 Frames, 26 Lichter):
```
Cache (§2.3): quantisierter Radius aendert sich in 100.0 % der Frames (2-px-Raster)
Cache (§2.4-1): dasselbe im 4-px-Raster: 99.3 % der Frames invalidiert
```
Grund: `lighting.js:146-149` moduliert r mit zwei Sinus (13 / 8,3 rad/s) bei `flicker: 1`; über 20 Fackeln kreuzt in praktisch jedem Frame eine das 2-px-Raster. Zweiter, schwererer Punkt: der Cache-Schlüssel kennt **keine Licht-POSITIONEN**. `playerLight` wird in `main.js:154-155` jeden Frame mutiert und steckt in `lights` (`main.js:217`); Eliten-Lichter (`main.js:702`) und Selten-Drop-Lichter (`main.js:691-696`) kommen und gehen. Bei am Kartenrand geklammerter Kamera bewegt sich der Spieler, die ganzzahlige Kamera nicht → das Overlay friert sichtbar ein.
**Fix:** Cache streichen oder den Schlüssel über alle Lichter (gerundete x/y, gerundeter Radius, Anzahl) UND die Kamera bilden — und §2.4 Entschärfungsstufe 1 ersatzlos entfernen, weil sie messbar nichts bringt.

### B4 — §1/M1 Spalte „Anteil L>128": vier von fünf Zeilen sind mit den beschlossenen Hebeln unerreichbar, §3.4 rechnet falsch
**Beleg 1** (eigenes Modell auf `.tmp/screenshots/gp6_ist_*_palette_pur.png`, Positiv-Kontrolle reproduziert `graveyard_wald` 22,8 gegen gemessene 22,7):
```
Renderwert bei GRAVEYARD ambient 0,22:
  'A' neu (Gras-Spitzlicht, §3.1)   L_pal 129,2 -> Render 103,3
  'D' harter Deckel (§3.1)          L_pal 156,8 -> Render 124,9
  '=' neu (Teich-Specular, §6.4)    L_pal 108,0 -> Render  86,8
Noetige Palette-Luminanz fuer Render >128:  GRAVEYARD 160,8 | CATACOMBS 274,4 | GRUFT 253,7 | BOSS 237,1
Texel-Anteil mit L_pal >= 160,8: graveyard_teich 0,112 % | graveyard_wald 0,078 %
```
§3.4 begründet den Highlight-Anteil mit „'A' 129,2 liegt über 128" — das ist die PALETTEN-Luminanz; M1 misst den Backing-Store nach dem Ambient-Blend. Alle drei in §3.4 genannten Quellen liegen im Render unter 128.
**Beleg 2** (Landkarte-Sweep, echte Renderdaten, `.tmp/gp6_belichtung_ist.json`, auf die §3.2-Werte interpoliert, Vignetten-Entlastung §3.3 mit dem halben gemessenen Vignetten-Delta gutgeschrieben):

| Karte | ambient §3.2 | >L128 erwartet | M1-Gate |
|---|---|---|---|
| GRAVEYARD teich / wald | 0,22 | 0,20 % / 0,13 % | ≥ 0,5 % ✗ |
| CATACOMBS | 0,55 | 2,00 % | ≥ 2,0 % (Kante) |
| FLUESTERGRUFT | 0,52 | 1,09 % | ≥ 1,5 % ✗ |
| BOSS_KAMMER | 0,48 | 1,48 % | ≥ 1,5 % ✗ |

Außen ist selbst die physikalische Decke (`amb_0_ohne_vignette`) nur 0,45 / 0,47 % — unter dem Gate. §6.6 (Flammenspitze schmaler, Kern an den Docht) und §2.6 arbeiten zusätzlich dagegen.
**Fix:** Entweder einen echten Spitzlicht-Hebel beauftragen, der im RENDER über 128 kommt (Palettenton ≥ 161 außen bzw. Textur-Texel innerhalb der Lichtkegel: 'D'/'N'/'b'-Anteile, Kanten-Spitzlichter, Specular auf Stein), oder die M1-Spalte auf den gemessenen Erreichbarkeitsraum senken (außen ≥ 0,35 %, Gruft ≥ 1,0 %, Boss ≥ 1,3 %) — und §3.4 auf Render-Luminanz statt Palette-Luminanz umschreiben.

### B5 — §1/M2 Gradient-Schnitt widerspricht §2.2 (Bayer auf 2-px-Blöcken)
**Beleg** (`.tmp/gp6_pruef_lightruns2.mjs`, waagerechter 72-px-Schnitt vom Fackelzentrum):
```
MIT  Bayer: 18 Spruenge, Plateaus [px] = 18,10,2,2,2,2,2,2,2,2,2,2,2,2,6,2,2,10,2 -> Plateaus < 3 px: 15
OHNE Bayer:  6 Spruenge, Plateaus [px] = 18,10,12,10,12,10,2                      -> Plateaus < 3 px: 1
```
Das Gate lautet „8..12 Sprünge, jeder ≥ 0,04, kein Plateau < 3 px". Mit Bayer sind es 18 Sprünge und 15 Plateaus von genau 2 px — **die Blockbreite selbst ist 2 px, jede Bayer-Alternation erzeugt zwangsläufig ein 2-px-Plateau**. Ohne Bayer sind es 6 Sprünge, also unter dem Minimum. Zusatzbefund: die Sprunghöhe ist `ambient/12` — CATACOMBS 0,0458 (gerade so ≥ 0,04), GRAVEYARD 0,0183 (das Gate wäre dort nie erfüllbar, falls jemand den Schnitt außen fährt).
**Fix:** Den Schnitt auf Block-Zentren-Abtastung festlegen (wie beim Plateau-Anteil bereits geregelt) und die Plateau-Regel auf „kein Plateau < 2 px" bzw. „≥ 8 Sprünge auf der bayer-freien Referenzkurve" umformulieren; die Sprunghöhen-Auflage explizit nur für die CATACOMBS-Kamera binden.

---

## MAJOR

### M-1 — §2.1/§2.7 gegen M2 „≤ 12 distinkte a-Werte": 13 Werte, Zone undefiniert
`LIGHT_STEPS = 12` erzeugt k = 0..12, also 13 Stufen — §2.7 verlangt das sogar wörtlich („genau 13 Werte 0..1"). Ob M2 grün wird, hängt allein daran, ob die „Punch-Zone" den Kern (a=0) und/oder das Außenfeld (a=ambient) ausschließt; die Landkarte maß mit `a > 0,02` (T6 §4b), die Spec schreibt die Zone nirgends fest. Damit steht das Gate bei bestenfalls 12 von 12 ohne jede Reserve.
**Fix:** `LIGHT_STEPS = 11` setzen (12 Werte) oder das Gate auf ≤ 13 anheben — und die Punch-Zone in §1/M2 wörtlich definieren (`a > 0,02`, Ring `0,48·r < d ≤ r` ja/nein).

### M-2 — §2.2: Quantisierung vor oder nach der Multiplikation? (M2-Plateau-Gate hängt daran)
§2.2 schreibt „rechnet je 2×2-Block die kombinierte Restdunkelheit `a = ambient · Π rest_l` … quantisiert per quantizeLight"; das Dossier (Hebel 1) sagt dagegen „Bayer VOR der Multiplikation". Wird je Licht quantisiert, liegt das Produkt zweier Stufen (z. B. 11/12 · 11/12 = 0,840) NICHT mehr auf der deklarierten Liste — in den CATACOMBS überlappen sich Fackelkegel großflächig, und `lichtstufen_plateau_anteil ≥ 95 %` fällt. Ebenso offen: ob die Läufe über die UNION der Bounding-Boxen laufen oder je Licht (dann wird derselbe Texel mehrfach gestanzt).
**Fix:** In §2.2 festschreiben: „quantizeLight wird GENAU EINMAL auf das fertige Produkt angewandt; die Läufe entstehen in EINEM Durchgang über die Vereinigung der Bounding-Boxen; kein Texel wird zweimal gestanzt."

### M-3 — §4.2: `buildTintMask` kann die geforderte Helligkeits-Rampe nicht bauen, ohne die Rampe fällt M3
§4.2 verlangt gleichzeitig „identische Alpha-Form, EIN Farbton, gebaut mit fillStyle bei globalAlpha=1" und „WARM-L (Ton 216,114,42, **Helligkeits-Rampe von links gebacken**)". Die Signatur `buildTintMask(grid, palette, toneHex)` hat kein Rampen-Argument, und eine Rampe ist mit einem Ton bei Alpha 1 und identischer Alphaform nicht darstellbar. Ohne Rampe ist die Maske über die ganze Silhouette konstant → die M3-Halbseiten-Differenz („NAH ≥ +6 L") ist strukturell 0.
**Fix:** Entweder `buildTintMask(grid, palette, toneHexDunkel, toneHexHell, richtung)` mit einer je Spalte gewählten Ton-STUFE (weiterhin globalAlpha=1, Detektor unberührt), oder M3-Halbseite streichen und die Landkarte-Metrik `Streuung_nah/Streuung_fern ≥ 1,25` (T6 §4c) übernehmen.

### M-4 — §1/M3 Negativ-Kontrolle „FERN < 2 L" bricht an der gebackenen Kunst
**Beleg** (`.tmp/gp6_pruef_sprite_licht.mjs`, Halbseiten-Mittel über die Silhouette der Grids in `art/sprites.js`):
```
player_down_0   58.9 / 59.9 -> Eigen-Differenz -1.0 L
player_side_0   54.1 / 62.6 -> Eigen-Differenz -8.6 L
skeleton_0     128.4 /128.1 -> Eigen-Differenz +0.4 L
ghoul_0         72.2 / 68.5 -> Eigen-Differenz +3.7 L
```
M3 fixiert NUR die Weltorte (T6 §4c), nicht die Pose. Steht der Spieler am fernen Ort im Seitensprite, misst die Kontrolle 8,6 L Eigen-Differenz aus der Kunst und ist rot, ohne dass der Renderer etwas falsch macht — dasselbe gilt für gespiegelte Gegnerframes (`_flip`).
**Fix:** In §1/M3 die Frames festnageln (`player_down_0` und `skeleton_0`, ungespiegelt, Blickrichtung per Rig gesetzt) und die Kontrolle „FERN < 2 L" auf die DIFFERENZ zur ungetönten Referenz desselben Frames umstellen.

### M-5 — §4.1/§4.2: Sprite-Tönung stroboskopiert (kein Bayer, keine Hysterese, 4 statt 12 Stufen)
**Beleg** (`.tmp/gp6_pruef_sprite_licht.mjs`, STEHENDER Spieler, nur der Flacker-Radius bewegt sich):
```
Abstand 50 px: Bodenstufe wechselt 4.1 x/s, Sprite-Warmstufe (4 Stufen, Alpha-Sprung 0,12) 4.1 x/s
Abstand 60 px: Bodenstufe wechselt 4.1 x/s, Sprite-Warmstufe 4.1 x/s
```
Ein Alpha-Sprung von 0,12 über die GESAMTE Silhouette, vier Mal pro Sekunde, an einer stillstehenden Figur. Dazu die Kohärenzfrage: das Overlay ditherst mit Bayer auf Blockebene, `lightAt` (§4.1) nicht — an jeder Stufengrenze zeigt der Boden ein gemischtes Raster, das Sprite dagegen eine harte Kante, die bei Bewegung springt.
**Fix:** `lightAt` mit dem UNGEJITTERTEN Radius (`light.radius`, ohne den Flacker-`wob`) abtasten und eine 1-Stufen-Hysterese vorschreiben; die Warm-Stufenzahl an `LIGHT_STEPS` koppeln statt frei auf 4 zu setzen.

### M-6 — §5.3: Der XL-Schatten (64×32) wird im Ground-Pass zu ~87 % übermalt
Der Schattenzweig liegt IM Zellen-Loop (`tilemap.js:1021-1025`), der `ty` und `tx` aufsteigend durchläuft. Ein 64×32-Bake an der Zelle `(shx, shy)` ragt in die Spalten `shx+1..shx+3` und in die Zeile `shy+1` — alle vier werden danach mit ihrer opaken Bodenkachel überzeichnet; übrig bleibt das linke obere 16×16. §5.3 hängt den ZWEITEN Durchgang sprachlich aber nur an die „kleinen 2×2-Kronen" („Kleine 2×2-Kronen behalten canopy_shadow …, aber der Zeichen-Ort wandert in einen ZWEITEN Durchgang").
**Fix:** In §5.3 unmissverständlich formulieren: „ALLE Kronen-Schatten (canopy_shadow UND canopy_shadow_xl_*) werden in einem zweiten Durchgang NACH allen Bodenkacheln, Fringes, Shore-, Bank- und Depth-Overlays des Fensters gezeichnet."

### M-7 — §3.3: Die zugelassene ambientTint-Feinjustierung (±4 L) kann FLUESTERGRUFT aus dem M1-Band kippen
Der Median folgt `(1−a)·L_Boden + a·L_Tint`; bei a = 0,52 kostet eine Tint-Absenkung um 4 L genau 2,1 L Median. Prognose §3.2 ist 34,6 bei Bandboden 34,0 — Reserve 0,6 L. Damit macht ein in §3.3 ausdrücklich erlaubter, deklarationspflichtiger Runde-2-Hebel das Messziel rot. (Gegenprobe: außen bei a = 0,22 kosten 4 L Tint nur 0,9 L, dort trägt die Reserve von 1,2 L.)
**Fix:** §3.3 auf „ambientTint darf nur zu HELLEREN/wärmeren Tönen variiert werden, und nur solange die M1-Messung mit ≥ 1,5 L Reserve grün bleibt" einschränken, oder das FLUESTERGRUFT-Band auf 33..44 öffnen.

### M-8 — §1/M1 „Anteil L<16 ≤ 2,0 %" außen gegen §5.3/§5.5 (mehr dunkle Kronen- und Schattenfläche)
Modellwert nach §3.1-Offset, ambient 0,22, VIG_STEP 0,06: `graveyard_teich` **0,82 %**, `graveyard_wald` **1,74 %** — 0,26 pp unter dem Gate. Genau in diese Kamera legen §5.5 (zwei geschlossene XL-Dächer) und §5.3 (`canopy_shadow_xl`, Bayer-25 % über `'k'`) zusätzliche dunkle Fläche; ein `'k'`-Texel fällt nach Ambient+Vignette in **26 % der Bildfläche** unter L 16 (Probe im Scratchpad). §3.1 hält `k/n/0/*/+` bewusst unten.
**Fix:** Für den Kronen-/Schattenton nicht `'k'` (18,3), sondern `'n'` (30,9) bzw. `'0'` (21,8) als dunkelsten zulässigen Ton vorschreiben, oder das GRAVEYARD-Band auf ≤ 3,0 % öffnen; in beiden Fällen M1 nach dem OVER_ROWS-Umbau erneut messen, nicht davor.

### M-9 — §1/M5 Bild-Gate „ΔL ≥ 6" ist innen ohne Lichtkegel nicht erreichbar
Der Kontaktschatten wird VOR dem Overlay gezeichnet, seine Differenz wird also mit (1−a) multipliziert und danach von der Vignette weiter gedämpft. CATACOMBS, ambient 0,55, Bodenton `'t'` 45,7, oberste Schattenzeile Alpha 0,30: ΔL = 0,45·0,30·45,7 = **6,2** in der Bildmitte, mit Vignette (0,30) nur **4,3**. Das Gate verlangt ΔL ≥ 6 auf ≥ 8 Texeln „in mindestens zwei Karten (außen + innen)".
**Fix:** In M5 den Innen-Messort verbindlich in einen Fackelkegel legen (a ≤ 0,15) und die Vignetten-Zone (d > 90 px vom Bildzentrum) für dieses Gate ausschließen.

### M-10 — §4.2: Der „Fassaden-ctx um die renderables-Schleife main.js:672" ist so nicht baubar
`ctx` ist ein Modul-`const` (`main.js:33`), und die Zeichen-Closures fangen es bereits bei ihrer Erzeugung in `main.js:665-670` lexikalisch ein (`draw: () => drawDrop(ctx, …)`, `player.draw(ctx, …)`). Eine Fassade „um die Schleife" bei :672 erreicht keinen einzigen Aufruf; sie muss beim BAU der renderables injiziert werden.
**Fix:** §4.2 auf „Fassade wird in `main.js:665-670` als erstes Argument der Zeichen-Closures übergeben" korrigieren und dort zugleich den Abtastpunkt `{ax, ay}` mitführen (Landkarte T3 §3.3); außerdem deklarieren, ob PROPS (Vase/Urne/Truhe) getönt werden — §4.2 nennt nur Drops/Projektile/Level-Up-Ring als tint-frei.

---

## MINOR

### m-1 — §5.2 sagt nicht, ob die Sway-TRANSLATION der Span-Anker entfällt
`tilemap.js:931` addiert heute `swayPhase(...).dx` auf `ax`. Kommen gebackene Scher-Posen dazu, ohne dass die Translation entfernt wird, wiegt die Krone doppelt (Scherung + Kachelversatz).
**Fix:** In §5.2 ergänzen: „bei gesetztem `swayPoses` entfällt die `ax`-Translation des Span-Zweigs (`tilemap.js:931`) ersatzlos; Hänge-Kronen (`:955`) bleiben unberührt."

### m-2 — §1/M2 Glow-Gate „≤ 24 distinkte (A−B)-Werte" hat kaum Reserve
Gemessen für EINE Fackel bei pulse = 1 (`.tmp/gp6_pruef_sprite_licht.mjs`): **19** distinkte RGB-Tripel / 18 Luminanzen. Zwei überlappende Fackeln oder die HOT_RINGS-Verschiebung §2.6 (cy−3 → cy+2, dadurch fast konzentrisch mit den FLOOR_RINGS bei cy+5) verschieben das schnell über 24.
**Fix:** Das Gate auf eine EINZELN stehende Fackel und einen definierten Ring (`d ≤ 0,48·r`) einschränken oder auf ≤ 32 anheben.

### m-3 — §6.7b: `GOLD` wird zweimal per fillText gezeichnet, und die Wertspalte ist ohne `measureText` nur geschätzt
`hud.js:155` und `:157` ziehen beide `GOLD ${player.gold}` (Doppel-Zug für die 1-px-Kontur). §6.7b spricht von „dem fillText-Aufruf" im Singular; das Deckrechteck muss beide überdecken und seine x-Position fest verdrahten, weil `measureText` verboten ist (Landkarte T3 §4.1).
**Fix:** In §6.7b beide Zeilen benennen und die Deckrechteck-Geometrie als feste Konstante (x ab 28, Höhe 8) vorschreiben, mit Sichtprüfung im Jury-Material.

### m-4 — §7.G verweist auf ein „§0.8-Muster", das in DIESER Spec etwas anderes ist
GP6 §0.8 ist die 0,8-Flicker-Schwelle; die Ersetzungsregel für den Art-Selbstcheck ist `SPEC_GRAFIKPASS_5.md:52` (Listenpunkt 8 des dortigen §0).
**Fix:** In §7.G „nach dem Muster SPEC_GRAFIKPASS_5.md:52" schreiben.

---

## Geprüft und in Ordnung (damit die Runde-2-Debatte nicht dorthin abbiegt)

- **§2.3 Alpha-Mathematik korrekt.** Der Ambient-Fill hinterlässt Alpha = ambient; `destination-out` multipliziert `dst_a *= (1−X)`. Mit X = 1 − a/ambient folgt exakt `dst_a = a`. Auch die 8-Bit-Alpha-Rundung bleibt mit ±0,002 unter dem M2-Raster von 0,01.
- **§2.3/§0.2 Detektor-Sicherheit.** Die Läufe tragen ihre Deckung in `rgba(...)` bei globalAlpha = 1; `ambientAlpha()` (`check_main_slice1.mjs:154-157`) findet weiterhin den Ambient-Fill als erstes Teilalpha-`fillRect`.
- **§2.4-3 (5-arg-Einzelausnahme) ist stub-sicher.** Alle drei Stubs protokollieren variadisch (`check_main_slice1.mjs:41`, `check_inventory_slice2.mjs:53`, `check_boss_slice3.mjs:59`); `args.length === 2` filtert ausschließlich `heart_full`/`heart_empty` (`:164-167`), sonst nirgends. `playerScreen()` liest nur Sprite-Draws, `fadeAlpha()` nur `fillRect`. Zusatz: der 2×-Hochzug bleibt hart, weil `main.js:34` `ctx.imageSmoothingEnabled = false` setzt.
- **§5.2 Ruhelage t=0.** `swayPhase` (`tilemap.js:576-587`) baut `p = t·rate + shift/7` mit `shift ∈ 0..6`; bei t=0 ist `floor(p) = 0` für JEDEN Cluster → Index 0 → `poses[0] === art`. Byte-Gleichheit hält, sofern `swayPose8` `% 8` statt `% 4` rechnet.
- **§5.4 Culling-Fix reicht.** `tx1+1` deckt |dx| ≤ 16 ab; bei ANCHOR_CLAMP W=4 (XL) wie bei W=14 (Back/Default) kann ein Anker bei `tx1+2` nie mehr in den Viewport ragen. Das Smoke-Fenster (`smoke:690-692`, tx 0..20 / ty 0..11) bleibt korrekt, solange Spalte 21 und Zeile 12 leer bleiben (§5.5-Guard).
- **§5.3 verdeckt keine Nachbar-Pässe.** Marker, Props, Lit-Dither und Wasser-Reflexionen laufen in `main.js` NACH `map.draw('ground')` (die beiden letzten additiv mit `lighter`) — der XL-Schatten liegt darunter.
- **§7.A stimmt zeilengenau.** 5 Zeilen in `check_main_slice1.mjs` (202/229/236/246/283) und 8 in `check_boss_slice3.mjs` (143/157/165/172/185/244/264/277); es existieren keine weiteren 0.45/0.78/0.85/0.66-Literale in diesen Dateien. `smoke:1996` + Kommentare `:1975`/`:1994-1995` passen.
- **§3.2 Median-Prognosen tragen.** Eigenes Modell (Positiv-Kontrolle: `graveyard_wald` 22,8 sim / 22,7 gemessen) ergibt außen nach Offset **39,2** (Spec 38,9) für BEIDE Szenen; der Median bleibt am `'e'`-Plateau (49,95 % Flächenanteil, Rang ~13…63 %) — er kippt in der Teichszene NICHT auf einen anderen Ton. Innen sind 41,2 / 34,6 / 39,8 saubere Interpolationen des gemessenen Sweeps am ALTEN `'t'`-Ton, also selbstkonsistent (die Innen-Töne sind nicht „vergessen", sie werden schlicht nicht gebraucht) — Reserven zum Bandboden aber nur 1,2 / 0,6 / 1,8 L (siehe M-7).
- **§4.2/M3 ΔWarm ≥ +18 wird erreicht**, und zwar mit großem Abstand: 0,64·base + 0,36·174 gegen den mit (1−0,55) gedämpften Fernwert ergibt **ΔWarm ≈ +68** (Probe). Der Overlay dämpft die Warm-Differenz NICHT, weil der Nahwert im Punch-Kern bei a ≈ 0 liegt.
- **§4.3 erfüllt M5 geometrisch.** Die neue Zeile `dy = −1` liegt bei `baseY+1` und damit unter der Sprite-Unterkante (`y+h−1`); Breiten 11 px (Spieler/Skelett, w=12) bis 14 px (Truhe) ≥ 8 Texel.
- **entities/ ist wirklich fassadenfähig:** `grep` über `game/js/entities/*.js` liefert 11 Treffer, ausnahmslos `ctx.drawImage`. Der Level-Up-Ring (`main.js:675-684`) läuft NACH der Schleife am echten ctx vorbei — korrekt so, §4.2 deklariert ihn tint-frei.
- **§6.1 Namensableitung kollidiert nicht:** `depthVarArt` bildet `${base}_v${vi}` (`tilemap.js:711`), aus `water_shallow_vert` wird `water_shallow_vert_v1/_v2` — genau die in §6.1 genannten Keys.

---

**Bilanz: 5 BLOCKER / 10 MAJOR / 4 MINOR.**


---

# PRÜFER 3 — Art, Palette, Messziele (7 BLOCKER / 16 MAJOR / 7 MINOR)


# LINSE 3 — Befunde (Art, Palette, Messziele)

## BLOCKER

**B1 — §2.1 + §2.3: `X = 1 − a/ambient` wird NEGATIV, `fillStyle` fällt still aus**
§2.1 rastet `quantizeLight` auf das ABSOLUTE Raster `k/12`; §2.3 stanzt mit `rgba(0,0,0,X)`, `X = 1 − a/ambient`. Am Kegelrand ist `a = ambient·1`. Für GRAVEYARD 0,22 → `round(2,64)/12 = 0,25` → `X = −0,136`; CATACOMBS 0,55 → `7/12 = 0,5833` → `X = −0,061`; BOSS 0,48 → `0,50` → `X = −0,042`. Drei von vier Karten. Eine ungültige `rgba(...)`-Farbe wird von Canvas 2D ignoriert, der vorherige `fillStyle` bleibt stehen: falsche Deckung, kein Fehler, kein Test schlägt an. Belege: `game/js/core/lighting.js:136-138`, `game/js/world/maps.js:537/605`, `map_bosskammer.js:80`.
**Fix:** relativ statt absolut quantisieren: `a = ambient · round(rest·12)/12`. Damit ist `X = 1 − k/12 ∈ [0,1]`, das Fernfeld liegt exakt auf `k=12`, und B2/M-4 lösen sich mit auf.

**B2 — §2.1 gegen M2 „Gradient-Schnitt 8..12 Sprünge": arithmetisch unmöglich**
Mit absolutem `k/12` liegen zwischen 0 und `ambient` bei CATACOMBS 0,55 nur `k=0..6`, also 7 Stufen und damit maximal 7 Sprünge (inkl. Anschluss ans Fernfeld). M2 fordert „8..12 Sprünge, jeder ≥ 0,04". Bei GRAVEYARD 0,22 sind es sogar nur 3 Stufen. Zugleich hat `lichtstufen_anzahl ≤ 12` keine untere Schranke, d. h. die Kopfzahl wird trivial grün, während das einzige Gate mit Auflösungs-Untergrenze rot bleiben MUSS.
**Fix:** Fix aus B1 übernehmen (13 Stufen innerhalb jedes Kegels, unabhängig vom ambient-Wert), dann ist 8..12 erreichbar; alternativ M2 auf „≥ 5 Sprünge" absenken (dann aber vor dem Bau, nicht nachträglich).

**B3 — §2.6 (`cy−3 → cy+2`) widerspricht §6.6 (Kern in Zeilen 5..7) und trifft den Pfosten**
`findTiles` setzt `y = ty*16 + 8` (`game/js/world/tilemap.js:818`), also entspricht `cy` der Grid-Zeile 8. Damit ist `cy+2` = Zeile 10. `torch_0/_1/_2` Zeile 10 = `'eeeeeekpPkeeeeee'`, das ist der Erd-Pfosten (`k/p/P`), drei Zeilen UNTER der Glutzeile 7 `'orro'` (`game/js/art/sprites.js:2867/2885/4654`). Bei den drei Wandfackeln ist Zeile 10 = `'tttttttktttttttk'`, also Ziegelwand unter der Stahlschale (Schale Zeilen 6-9, Glutzeile 5; `sprites.js:2906/2925/4672`). §6.6 verlangt den Kern `'1'` in Zeilen 5..7, das sind `cy−3 .. cy−1`. Der Hotspot landet also 3 bis 5 Zeilen unter dem Kern, den er beleuchten soll. Zusatzproblem: bei den Wandfackeln endet die Flamme in Zeile 5, ein `'1'` in Zeile 6/7 läge IM Metallgehäuse, §6.6 gilt aber „für alle 6 Fackel-Grids".
**Fix:** §2.6 auf `hotY = cy − 2` (Bodenfackel) korrigieren und für Wandfackeln getrennt festlegen (Flamme endet dort eine Zeile höher), oder §6.6 auf Zeilen 4..6 (Boden) bzw. 3..5 (Wand) umschreiben. Der `baseY = cy + 5`-Bodenglow (`lighting.js:238`) bleibt der einzige Effekt unterhalb der Glut.

**B4 — §6.4(a) „shore_s/e/w dämpfen auf ≤ 48 L" ist nach §3.1 unerreichbar**
Gemessene Kachelmittel heute (eigene Probe über `TILE_ART` + Palette): `shore_n 45,5 · shore_s 45,9 · shore_e 45,7 · shore_w 45,7` (deckt sich mit Landkarte T5 §4b). Nach dem Doppel-Offset (Gras +15,1; Wasser `w 47`, `'=' 108`) werden daraus **67,0 / 67,6 / 67,3 / 67,3**. Der niedrigste Ton auf diesen Kacheln ist dann `'w' = 47`; ein Kachelmittel ≤ 48 L wäre nur mit einer fast reinen `'w'`-Kachel erreichbar, also durch Löschen der gesamten Uferkontur. Die 48 stammt aus der Vor-Offset-Messung und ist nicht nachgezogen.
**Fix:** Die Schwelle relativ setzen (z. B. „shore_s/e/w mindestens 8 L unter `shore_n`", heute Differenz 0,4 L) statt absolut, und den Zielwert nach der Offset-Tabelle aus P0b neu beziffern.

**B5 — M4 `verdeckt_kopf ≥ 120` liegt über der Obergrenze des Verfahrens (99)**
Das übernommene Verfahren zählt nur Sprite-Zeilen oberhalb der Kronen-Unterkante: `head_rows = KRONEN_OVER[1]*TILE + TILE − sprite_t` (`.tmp/shot_gfx5.py:2901`), heute 9 Zeilen. `g5_proof_results.json` → `silhouette_texel_kopf = 99`, `verdeckt_kopf = 52`. Mit dieser Definition ist 120 nie erreichbar. Die Formel unterstellt zudem `h = 1` und ist für span-`h`-XL-Kronen falsch. Und selbst bei „Kopf = ganze Silhouette" (265 Texel) bindet nicht die 120, sondern der Quotient ≥ 0,75, also 199 Texel; welche Silhouette gemeint ist (gesamt 265 oder Kopf 99), sagt die Spec nicht.
**Fix:** `head_rows` span-generisch definieren (`(anchor_ty + sh)*16 − sprite_t`, geklammert auf 0..24), die Bezugsgröße des Quotienten benennen und die 120 gegen die neue Obergrenze re-basieren.

**B6 — §6.7(a): 8-Zeilen-Füllrampe in einen 3 Zeilen hohen Trog**
`game/js/ui/hud.js:179`: `const xx = 4, xy = 36, xw = 26, xh = 5;` → Innenfläche `24 × 3`. Eine „Füllrampe grün-golden 8 Zeilen" braucht 8 Innenzeilen (so hat es der Boss-Balken, `bh = 12`). Vergrößern geht nicht: das Panel endet bei `py + ph = 42` (`hud.js:55`), der Balken beginnt bei y 36.
**Fix:** Auf 3 Zeilen Rampe (hell/mittel/dunkel) umschreiben ODER den Balken auf `xy = 33, xh = 8` ziehen und die Kollisionsfreiheit gegen Trank-Zeile (y 25..35) und Panel-Unterkante im Text belegen.

**B7 — §3.4/M1: die drei benannten Highlight-Quellen liegen ALLE unter L 128 im Bild**
M1 misst auf dem gerenderten 320×180-Backing-Store. Dort gilt `L = L_pal·(1−a) + L_tint·a`, GRAVEYARD `ambientTint '#0a0a18'` = L 11,60 (`maps.js:539`). Bei `a = 0,22` liegt die Schwelle L 128 bei **Paletten-L 160,8**. Die drei Quellen aus §3.4: `'A'` neu 129,2 → rendert **103,4**; Kronen-Spitzlicht nutzt laut §5.1 „Werteumfang der neuen Gras-Rampe", also ≤ `'A'` → ≤ 103,4; Teich-Specular `'='` 108 → rendert **86,8**. Keine davon kreuzt. Eigene Ton-Zählung über die sichtbaren Ground-Kacheln beider Mess-Kameras (280,190 und 320,204) ergibt als Anteil > L128 nach dem Offset **0,107 % bzw. 0,086 %** (Träger sind nur noch `b/N/y/1`), Ziel ist ≥ 0,50 %. Die Vignette drückt zusätzlich.
**Fix:** Entweder M1-Spalte auf einen Wert setzen, den die Palettendecke hergibt (z. B. „≥ 1,5 % über L 96"), oder die Highlight-Messung explizit auf dem palettenreinen Bild (ambient 0, Vignette aus) definieren, oder eine echte Spitzlicht-Stufe oberhalb 160 L einführen (dann kollidiert sie mit dem `'D'`-Deckel und braucht eine eigene Auflage).

---

## MAJOR

**M1 — §2.3 Frame-Cache invalidiert nicht auf Lichtposition**
„Läufe nur neu berechnen, wenn sich ganzzahlige Kamera oder ein quantisierter Radius geändert hat." Es gibt aber bewegte Lichter: `playerLight` (`main.js:213`, `syncPlayerLight`), `eliteLights(enemies)` und Drop-Lichter (`main.js:700-707`). Bei stehender Kamera (Raum kleiner als Karte, Kamera geklammert) friert die Spielerlaterne an ihrer alten Stelle ein.
**Fix:** Cache-Schlüssel um die gerundeten Bildschirmkoordinaten `Math.round(light.x−camera.x)/…y` JEDES Lichts erweitern.

**M2 — §2.2/§2.3 fordern keine DISJUNKTEN Läufe; genau das erzeugt die Zwischenstufen wieder**
`destination-out` ist multiplikativ. Werden Läufe je Licht-Bounding-Box emittiert, wird ein Texel im Überlappungsgebiet zweimal gestanzt: `dst *= (1−X₁)(1−X₂)`. Das Produkt zweier gerasterter Alphas liegt NICHT auf dem Raster, die Stufen entstehen neu, und zwar exakt im Messfenster. Im M2-Fenster CATACOMBS (40,190) sind 12 Fackeln relevant und **24 Kegelpaare überlappen** (u. a. (13,13)/(12,14) d=22,6 px; (15,9)/(18,10) d=50,6 px; eigene Rechnung über `findTiles` + `TORCH_RADIUS = 72`, `main.js:30`). §2.2 quantisiert zwar korrekt das PRODUKT `a = ambient·Π rest_l` (das ist die entscheidende Formulierung und sie ist richtig), aber §2.3 sagt nirgends, dass die Laufmenge eine PARTITION ist.
**Fix:** In §2.2 festschreiben: `lightRuns` liefert eine paarweise disjunkte Überdeckung der VEREINIGUNG aller Bounding-Boxen, ein Texel wird genau einmal gestanzt; Smoke-Gate §2.7 um „keine zwei Läufe überlappen" ergänzen.

**M3 — M2: das Messfenster „Punch-Zone" ist nicht definiert**
Die Landkarte gibt zwei unvereinbare Definitionen (T6 §4b: „reine Punch-Zone (`a > 0,02`)" bzw. „Punch-Messung auf den Ring `r·0.48 < d ≤ r` beschränken"). Die Spec übernimmt keine. Ohne Ringbeschränkung liegt der additive Warm-Glow (`gr = r·0.48 = 34,6 px`, `lighting.js:212`) im Messgebiet, dort gilt das multiplikative Modell nicht. Mess-Disziplin (b) „validierte Fenster" ist damit nicht erfüllt.
**Fix:** In M2 wörtlich aufnehmen: Punch-Zone = `r·0,48 < d ≤ r` je Fackel, Vereinigung über alle Fackeln, plus Fenster-Validierungsschritt im Report.

**M4 — M2: die „deklarierte Stufenliste" enthält `ambient` nicht, Plateau-Gate und Fernfeld-Kontrolle widersprechen sich**
Die Liste wird „aus der Engine-Konstante hergeleitet" (§2.1: `k/12`, §2.7: „genau 13 Werte"). Die Kontrolle verlangt aber `a == mapDef.ambient ± 0,01`, und 0,55 / 0,22 / 0,52 / 0,48 liegen nicht auf `k/12`. Das Plateau-Gate ≥ 95 % würde jedes Fernfeld-Texel als „nicht auf einer Stufe" werten.
**Fix:** Mit B1 zusammen erledigen (relative Quantisierung); sonst die Stufenliste explizit als `{k/12} ∪ {ambient}` deklarieren.

**M5 — M2 Glow-Gate „distinkte (A−B) ≤ 24" ist durch nichts in §2 gedeckt**
§2.5 lässt den Warm-Pass auf `arc()/fill()` (`lighting.js:224-269`). Canvas-Bögen sind antialiast, jede Ringkante liefert ein 1-2 px Zwischenband; `GLOW_RINGS` trägt zusätzlich den stetigen `rWob`-Jitter (`lighting.js:226`). Im Messfenster überlappen 4 Glow-Paare (Abstand < 2·34,6 px), deren Deckungen sich additiv summieren: 6 Glow-Niveaus × 6 = 36 Kombinationen, dazu Floor (4 × 5 Pulse) und Hot (3 × 5). 24 ist damit nicht plausibel.
**Fix:** Entweder das Gate auf einen empirisch belegten Wert setzen (Phase-0-Vormessung, nicht nachträglich) oder den Warm-Pass in §2.5 ebenfalls auf gerasterte fillRect-Läufe umstellen.

**M6 — M2 ist per Trick erfüllbar (Goodhart), das Gegen-Gate fehlt**
`lichtstufen_anzahl ≤ 12` und `plateau_anteil ≥ 95 %` werden UMSO leichter grün, je grober das Licht wird: ein 4-Stufen-Licht besteht beide. Die einzige Untergrenze steckt im Gradient-Schnitt, und der ist nach B2 unerreichbar.
**Fix:** Untergrenze in die Flächenmetrik ziehen, z. B. „≥ 9 UND ≤ 12 distinkte a-Werte in der Punch-Zone", dann ist Vergröbern kein Ausweg mehr.

**M7 — §6.4 Teich-Specular: die Zahl 96..144 passt nicht zum Fenster und ist heute schon erfüllt**
Das Teich-Fenster des Proof-Rigs ist `TEICH_RECT = (464,256,512,288)` (`.tmp/shot_gfx5.py:1101`), also 48×32 Weltpixel = 6 Kacheln (`texels_in_crop: 1536` im GP5-Ergebnis). Die Landkarte rechnet die 96..144 dagegen über **24 Flachring-Kacheln** (T5 §4a). Im 6-Kachel-Fenster liegen 4 Ring-0-Kacheln, bei 4..6 Texeln je Kachel also 16..24 Specular-Texel, nicht 96..144. Zweitens trägt `water_shallow` bereits **26** `'='`-Texel je Kachel (`sprites.js:2227`, `_v1/_v2` je 25); „Specular-Tier zurück, 4..6 Texel" hieße wörtlich eine Reduktion um 80 % und würde die Ufer-Aufhellung zerstören, die laut `sprites.js:2274` allein den Tiefen-Gradienten trägt. Drittens misst das GP5-Gate heute schon `glanz_max = 129` im selben Fenster, also mitten im geforderten Band 96..144.
**Fix:** Bezugsfläche eindeutig benennen (24-Kachel-Flachring ODER `TEICH_RECT`), das Zählverfahren festlegen (Zielton + Toleranz, getrennt von den `'9'`-Treffern) und den Sollwert gegen den IST-Wert in DERSELBEN Zählweise setzen.

**M8 — Proof-Konstanten werden von §3.1/§6.3 entwertet, §1 zieht sie nicht nach**
(a) `.tmp/shot_gfx5.py:1107 GLANZ_RGB = (0x34,0x53,0x58)` ist der ALTE `'='`-Hex; mit dem neuen `'='` (~108 L) zählt das portierte Glanz-Gate bei Toleranz 20 andere Texel. `palette.js:93-96` dokumentiert genau diesen Fehlermodus schon einmal aus GP5-R3. (b) Das `wegsporn`-Gate friert `soll_legende {"28,15":"p","29,15":"p"}` und `trittstein_arts ["pebble_small","pebble_small"]` ein; §6.3 tauscht genau diese zwei Zellen. (c) `check_gfx5_art.mjs:47` friert `'='` in `NEW_TONES` ein (von §7.G abgedeckt, aber nur dort).
**Fix:** In §1 eine explizite Nachzugsliste für `shot_gfx6.py` aufnehmen (GLANZ_RGB, wegsporn-Sollwerte, alle Ton-Tripel der Offset-Palette), sonst laufen portierte Gates auf Altwerten.

**M9 — §3.1 lässt `'W'` und `'9'` offen, obwohl beide Rollen tragen und eingefroren werden**
Genannt sind nur `w 47` und `'=' 108`. Die Rampe ist damit gestreckt (Spanne 43 → 61), nicht „im Gleichschritt" verschoben; `'W'` (Wellental unter dem Kamm) und `'9'` (Wellenkamm) haben kein Ziel, obwohl `check_gfx6_art` sie per NEW_TONES einfrieren soll und `palette.js:187-191` ihnen feste Rollen zuweist. Sie sind zudem die Hauptfläche der Ufer- und Kanalkacheln (`shore_*` tragen 31-55 `'W'`/`'9'`-Texel je Kachel).
**Fix:** Vier Sollwerte in §3.1 ausschreiben (z. B. `w 47 · W 67,3 · 9 87,7 · '=' 108`, gleichmäßige Schritte wie heute) und die Rampen-Ordnung `k < w = e < W < 9 < '=' < A < D` als Auflage mitschreiben.

**M10 — §3.1 heißt „Paletten-Offset AUSSEN", die Palette ist aber global**
Die Gras-Rampe wird von zahlreichen INNENRAUM-Grids benutzt (eigene Zählung über `TILE_ART`): `brick_wall_v2` (m=11, a=13, K=4), `brick_moss_tl` (a=7, m=13, K=2), `brick_moss_br`, `brick_wall`, `stone_floor`/`_v1..v3`, `pillar`, `sarcophagus`/`_v1/_v2`, `floor_decal_crack`, `floor_decal_bones`, `torch_wall_0/1/2`. Alle hellen mit auf, inklusive Boss-Kammer. §3.2 rechnet die Innen-Mediane aber aus dem unveränderten `'t' = 45,7`.
**Fix:** In §3.1 deklarieren, welche Innenraum-Grids den Offset erben, und die Prognosen aus §3.2 gegen den Moos-Anteil gegenprüfen (Katakomben `m` 2,41 %, `a` u. a. laut `.tmp/gp6_belichtung_tonzensus.json`).

**M11 — §3.1 reißt den GP5-R2-Entscheid zum Back-Kronen-Rim wieder auf**
`palette.js:155-159`: der Rim wurde von `'C'` auf `'E'` gesetzt, `'a'` wurde ausdrücklich verworfen, weil es „den Defekt in Gruen neu erzeugt" hätte (Jury-Prio-0 „Stahlband quer durch den Wald"). `tree_canopy_back_a/_b/_c` bestehen aus `'+'` (35,5) und `'*'` (26,6) mit `'E'`-Rim. Nach dem Offset steht `'E'` bei 61,1, `'+'`/`'*'` bleiben unten: der Rim-Kontrast springt von 10,5 L auf **25,6 L**, also über den damals verworfenen `'a'`-Wert (Kontrast 32,2 wäre `a`, 25,6 liegt dazwischen).
**Fix:** In §3.1 festlegen, dass die drei Back-Kronen-Grids ihren Rim auf einen Ton umsetzen, der nach dem Offset wieder ~10 L über `'+'` liegt (also `'+'`-nah neu gemischt), und den Punkt in die Jury-Deklarationsliste §9 aufnehmen.

**M12 — M3 Positiv-Kontrolle „mit `__noLight` sind ΔWarm und dE == 0" ist so nicht herstellbar**
Der Rig-Schalter unterdrückt NUR `lighting.draw` (`.tmp/shot_gfx5.py:218-229`, Wrapper-Kommentar wörtlich: „unterdrueckt NUR lighting.draw"). Die Sprite-Tönung aus §4.2 sitzt aber in der `renderables`-Schleife in `main.js:672`, läuft also unter `__noLight` weiter. Die Kontrolle würde immer scheitern und damit die ganze M3-Messung entwerten.
**Fix:** Entweder einen zweiten Rig-Schalter `__noSpriteTint` spezifizieren (Fassaden-ctx in main.js prüft ihn) oder die Positiv-Kontrolle auf „Warm-Stufe 0 erzwungen" umstellen und das im Verfahren beschreiben.

**M13 — M1 Highlight-Spalte ist per Stellschraube fälschbar, Gegen-Gate fehlt**
Die Schwelle L 128 entspricht bei `a = 0,22` Paletten-L **160,83**. Der Stein-Spitzlichtton `'F' = #a39cb2` liegt bei **160,58**, also 0,25 L darunter, und stellt in den beiden Mess-Szenen 0,26 % bzw. 0,43 % der Fläche (eigene Ton-Zählung). §3.3 erlaubt testfrei `ambientTint`-Variation „±4 L / wärmer". Ein Tint-Schritt von ~1 L schiebt `'F'` über die Schwelle und hebt die Highlight-Spalte von 0,09 % auf 0,4-0,55 %, ohne dass sich am Bild etwas ändert. Das ist der Goodhart-Ausgang von M1.
**Fix:** Zusätzliches Gegen-Gate „Highlight-Texel müssen auf ≥ 3 verschiedene Tonklassen und ≥ 20 zusammenhängende Cluster verteilt sein" oder Schwelle auf einen Wert legen, der nicht innerhalb 1 L neben einem Flächenton liegt.

**M14 — §3.1 verdoppelt den Teich-Zonensprung, weil `'k'` unten bleibt**
`water_mid_calm` besteht ausschließlich aus `'k'` (`sprites.js:2290`, 16 Texel), `palette.js` dokumentiert den Abdunkelungsschritt mit „13 Luminanzstufen" und den Zonensprung mit „5,2 Stufen". Nach dem Offset: `'w' 47` gegen `'k' 18,3` = **28,7 L je Texel**, Kachel-Zonensprung shallow gegen calm **5,2 → 8,0 L** (eigene Rechnung). Das ist genau die Größe, die das portierte Gate `schwarze_rechtecke` über `haerte_schwelle = delta/2` misst.
**Fix:** `'k'` in `water_mid_calm` durch einen neuen Tiefenton ersetzen, der ~13 L unter dem neuen `'w'` liegt (also ~34 L), oder die Deckung des Schleiers senken; in §3.1 mitschreiben.
(Zur ausdrücklichen Frage: Wasser wird dadurch NICHT wieder die dunkelste Großfläche, Teichkachel-Mittel `water+calm` 53,0 gegen Gras 47,0.)

**M15 — M4 „85 % Kronen-Deckung im besten 48×32-Fenster" hat kein Gegen-Gate**
Ein einziges nahezu volles Rechteck erfüllt das Gate. Die dunklen `'k'/'n'`-Nähte aus §5.1 zählen als Kronen-Pixel mit, sind also kein Ausschluss. Das Ziel „Blätterdach statt Busch" wird damit nicht gemessen.
**Fix:** Zweite Zahl dazu, z. B. „Silhouetten-Umfang / Fläche ≥ x" oder „≥ 2 verschiedene XL-Keys im Fenster, kein Key stellt > 60 % der Deckung".

**M16 — §5.2 braucht eine dritte Bestandsstelle in `tilemap.js`, §0.9 sanktioniert zwei**
`swayPoses` muss von `artFor` (bzw. dem Over-Zeichenpfad) ausgewertet werden; das ist Bestand. Dazu kommen §5.3 (Schatten-Zweitpass) und §5.4 (Culling `tilemap.js:907`). §0.9 nennt „additiv + die zwei sanktionierten Bestandsstellen §7", §7 listet für `tilemap.js` gar keine.
**Fix:** §0.9 auf drei benannte Bestandsstellen erweitern (artFor-Pose-Auswahl, canopy_shadow-Zeichenort, Culling-Grenze) und sie in §7 mit Marker aufführen.

---

## MINOR

**m1 — §3.1 sagt nicht, ob der Offset additiv (RGB +c) oder multiplikativ gerechnet wird.** Beide treffen die genannten L-Werte, liefern aber verschiedene Hex-Tabellen: additiv sinkt `'A'`-Sättigung von 0,422 auf 0,378 (und die Wasser-Auflage „unter `'A'`" wird enger), multiplikativ bleibt sie. Der Paletten-Offset-Rechner (§8 P0b) und `NEW_TONES` in `check_gfx6_art` müssen exakt dieselbe Operation verwenden.
**Fix:** Eine Zeile in §3.1: „Offset = additiv je Kanal um `+c`, `c` so gewählt, dass ΔL = 15,1" (oder multiplikativ), und die Soll-Hex-Tabelle als Anhang.

**m2 — §5.4 nennt `txEnd = min(wTiles−1, tx1+1)` ohne den Over-Guard.** Die tx-Schleife ist zwischen Ground und Over geteilt (`tilemap.js:907`); ohne Ternär zeichnet auch der Ground-Pass eine Spalte mehr.
**Fix:** In §5.4 die Form ausschreiben: `const txEnd = over ? Math.min(wTiles-1, tx1+1) : tx1;`.

**m3 — §6.7(b) Deckrechteck liegt über ZWEI Panel-Tönen.** Panel-Grundfläche `#0a0a12`, oberes Drittel `#10101c` bis y 15 (`hud.js:70-75`); der GOLD-Zug sitzt bei y 15..23, kreuzt also die Kante. Zudem gibt es kein `measureText` in der Whitelist §0.3 (und keins im Flusstest-Stub), die x-Position der Wertespalte muss hartkodiert werden und hängt an der UA-Vorschubbreite von `8px monospace`.
**Fix:** Zwei Deckrechtecke (eins je Panel-Band) und die Wertespalte als feste Konstante mit Herleitung deklarieren.

**m4 — §6.7(b) lässt die GOLD-Null auf Game-Over/Sieg stehen.** `hud.js:539/557` rendern `GOLD: ${gold}` über `centerText` mit `8px monospace`; der Θ-Defekt (Landkarte T5 §7b) bleibt dort sichtbar.
**Fix:** Entweder mit abdecken oder als bewusste Auslassung in die Deklarationsliste §9 aufnehmen.

**m5 — M2 „Abtastung auf 2×2-Block-Zentren" ist bei gerader Blockgröße nicht definiert** (ein 2×2-Block hat kein Zentrums-Texel).
**Fix:** Festlegen: Blockmittelwert der 4 Texel oder das Texel (x, y) mit geraden Koordinaten.

**m6 — M3 nennt in den Kontrollen ein `dE`, das die Spec nirgends definiert** („Positiv-Kontrolle: ΔWarm und dE == 0"; „Negativ-Kontrolle: dE < 4").
**Fix:** `dE` als Formel angeben (vermutlich euklidischer RGB-Abstand der Silhouetten-Mittelwerte) oder durch ΔWarm ersetzen.

**m7 — §5.3 setzt `canopy_shadow` auf `'k'`, während das Gras auf 50 L steigt.** Heute ist der Schatten ein `n`/`0`-Schachbrett mit Kachelmittel 26,6 gegen Gras 34,9 (Δ 8,3). Neu: `'k'` 18,3 gegen Gras 50,0, also **31,7 L je Texel**; bei 25 % Bayer-Dichte ist das Kachelmittel zwar unauffällig (42,1), einzelne Texel lesen bei 4-6× als schwarze Sprenkel.
**Fix:** Statt `'k'` einen Ton ~12-15 L unter dem neuen Gras wählen (z. B. `'e'`-Nachbar bei ~35 L) und die Dichte gegen die Bayer-Kachel prüfen.

---

## Geprüft, KEIN Befund (zur Entlastung der Bau-Agenten)

- **`'w' ≈ 'e'` mit kühlerem Farbort bleibt erhalten** (beide 47; RGB (38,51,53) gegen (40,51,44), B > G bleibt) — die Auflage `palette.js:85-89` ist gehalten.
- **Kamm:Tal 2,3:1** ist auf Palettenebene erfüllt (108/47 = 2,30) und gilt im KANAL identisch, weil `water_v/_1/_2/_3` dieselben vier Töne führen (`w=158, W=49, 9=33, '='=16` je Kachel). `'=' < 'A'` (108 < 129,2) und `'A' < 'D'` (129,2 < 156,8) halten.
- **§2.2 quantisiert das PRODUKT, nicht die Faktoren** — die Formulierung „`a = ambient · Π rest_l` …, quantisiert per quantizeLight" ist an dieser Stelle präzise genug. Die Lücke liegt nicht in der Formel, sondern in der fehlenden Disjunktheits-Auflage (M2) und im absoluten Raster (B1/B2).
- **M5-Geometrie ist erreichbar:** `round(w·0,90)` ergibt Spieler 11, Skelett 11, Ghul/Hund/Rostpanzer 13, Vase/Urne 11, Truhe 14, Boss 18 Texel, alle ≥ 8; `dys = −1` zeichnet nach `main.js:590` tatsächlich UNTER die Fußkante, und alle drei Profil-Arrays bleiben gleich lang (`main.js:545-547`).
- **§6.7(b) ist M1-neutral:** kein Test liest GOLD-PIXEL, nur das fillText-Protokoll (`check_main_slice1.mjs:124/200`, `check_inventory_slice2.mjs:214/306`); und das Deckrechteck (x 4..~42, y 15..23) liegt vollständig in der HUD-Maske (Panel x 2..56, y 2..42, Landkarte T2 §3).
- **§7.A stimmt zeilengenau:** 0.45 in `check_main_slice1.mjs:202/246/283`, 0.78 in :229/236, 0.66 in `check_boss_slice3.mjs:143/172/185/244/264`, 0.85 in :157/165/277 = 13 Zeilen; die Folgezeilen 158/278 tragen nur `${ambientAlpha()}`, kein Literal. `smoke_test.mjs:1996` und die Kommentarzeilen 1975/1994-1995 sind korrekt bezeichnet, ebenso §7.C (`smoke:658-666`), §7.D (`smoke:1763-1799`), §7.E (`smoke:1875-1968`).
- **§6.1 Namensableitung ist sauber:** `depthVarArt = ${base}_v${vi}` (`tilemap.js:712`), `water_shallow_vert` + `_vert_v1` + `_vert_v2` deckt alle drei Varianten-Indizes ab.

---

**Bilanz: 7 BLOCKER / 16 MAJOR / 7 MINOR.**