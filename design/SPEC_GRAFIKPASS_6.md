# SPEC Grafikpass 6 — "Licht & Maßstab" (Rev 1, 07.08.2026, Fable)

Grundlage: Michaels Entscheid OPTION A (design/DOSSIER_GRAFIKBLOCK.md),
Landkarte design/GP6_LANDKARTE.md (wf_69e483d4-2fd, HEAD 7e1d86d).
Umfang: Dossier-Hebel 1-4 plus R3-Restliste. Hebel 5
(Karten-Autorenschaft) ist NICHT Teil dieses Passes.

**NEU: Die Abnahme läuft über MESSZIELE (§1), nicht über die
10er-Skala.** Die Jury prüft, ob die Messungen das Richtige messen,
und liefert Sichtbefunde — aber "fertig" ist definiert, bevor der
erste Agent baut, und kann nicht mehr wandern.

---

## §0 Eiserne Regeln

0.1 **Kanonische Flusstests** (.tmp/check_main_slice1.mjs,
check_inventory_slice2.mjs, check_boss_slice3.mjs): NULL Änderungen
— mit der EINEN Ausnahme der sanktionierten Ambient-Zeilen aus §7.A.
Keine Stub-Erweiterungen. `.tmp/check_lighting_input_slice1.mjs` ist
BEKANNT ROT und NICHT kanonisch (Landkarte T1 §0) — kein Agent
behandelt ihn als Regression, niemand fasst ihn an.
`.tmp/debug_victory_*.mjs` sind tot — nicht anfassen.

0.2 **ambientAlpha-Detektor** (inhaltlich, Zeilennummern wandern):
Der Ambient-Fill in lighting.js (heute :138, `octx.globalAlpha =
ambient` + `fillRect` Vollbild) bleibt der ERSTE und EINZIGE
fillRect mit 0 < globalAlpha < 1 auf einem Nicht-Main-Canvas in
jedem Frame. JEDE weitere Offscreen-Zeichnung führt ihre Deckung in
der rgba(...)-Füllfarbe bei globalAlpha === 1 — das gilt
ausdrücklich AUCH für destination-out-Stanzen per fillRect (§2).
Kein zweites Offscreen aus dem OFFSCREEN-Kontext erzeugen
(ownerDocument-Crash, Landkarte T1 §1.2); neue Offscreens nur aus
dem Haupt-ctx und erst NACH main.js:71.

0.3 **Canvas-Whitelist** wie GP4/GP5 (SPEC_GRAFIKPASS_4.md:35-42):
fillRect, drawImage (bei Licht/Overlays/Tiles NUR 3-Argument), arc,
fill, beginPath, save, restore, clearRect, createRadialGradient,
fillText + globalAlpha/globalCompositeOperation/fillStyle.
VERBOTEN bleibt insbesondere getImageData/putImageData und jede
Transform. Nach JEDEM lighter-/destination-out-Block expliziter
Reset `globalCompositeOperation='source-over'; globalAlpha=1`
(check_boss-restore stellt gco NICHT wieder her).

0.4 **Golden-Hashes sol/geo: NULL Änderungen.** Ein geo-Drift ist
ein STOPP-Signal. Die AMBIENT-Konstante smoke:1996 ist davon
getrennt und über §7.B sanktioniert.

0.5 **Reihenfolge-Wächter:** Neue SPRITES-/TILE_ART-Keys NUR ans
ENDE der Objektliterale; neue Flip-Keys NUR ans Ende der Liste
main.js:55-68; neue Canvases (Tint-Masken, Bakes) entstehen
frühestens nach main.js:71 (Canvas→Name-Mapping der Flusstests
läuft über die Erzeugungsreihenfolge, Indizes 0..74 sind bindend).
Der ERSTE drawImage je Entity-Sprite bleibt IMMER das
Original-Canvas aus gfx (Wächter B, Landkarte T3 §4.1).

0.6 **Hash-Disziplin:** variantIndex nur mit UNGERADEM n,
teilerfremd zu 3/5/7/17/29/47 am selben Ort, versetzte Koordinaten.
Kein Math.random/Date.now in world/ und art/.

0.7 **fringeOverlays bleibt byte-eingefroren**; jede neue Emission
lebt in NEUEN Funktionen (Komplement-Regel wie GP5).

0.8 **Die 0.8-Flicker-Schwelle** (Warm-Glow/Lit-Dither/Reflexion)
wandert nicht.

0.9 **Tabu-Aufhebungen für GP6** (eng): core/lighting.js,
core/sprite_factory.js (nur additiv: buildTintMask), main.js
(Zeichenblöcke, Schatten, Fassaden-ctx), ui/hud.js, world/tilemap.js
(additiv + die zwei sanktionierten Bestandsstellen §7), world/maps.js
+ map_fluestergruft.js + map_bosskammer.js (ambient/Tint/extraLights/
Legenden/OVER_ROWS/depthOverlays), art/*. entities/ bleibt TABU
(die Fassade macht Sprite-Licht ohne entities/-Zeile möglich).
God-Mode-Verhalten (7e1d86d) bleibt unangetastet.

0.10 Port 8123 NIE anfassen; Agenten-Server auf 8124.
Commit-Disziplin: Hauptloop committet jeden grünen Stand.

---

## §1 MESSZIEL-ABNAHME (das neue Abnahmesystem)

**Werkzeug:** `.tmp/shot_gfx6.py` — portiert Rig, Kamera-Disziplin,
Crop/Strip, Teillauf-Merge und die übernehmbaren Gates aus
shot_gfx5.py (Landkarte T6 §1). Mess-Disziplin bindend wie GP5:
(a) Juror-eigene bzw. hier Spec-eigene Metrik, (b) validierte
Fenster, (c) Positiv- UND Negativ-Kontrolle je Methode, (d) Modus
über 9 Läufe bei allem Bewegten, (e) Schwellen werden NIE
nachträglich angepasst. Messung auf dem internen 320×180-Backing-
Store, Luminanz Rec.601, HUD-Maske wie Landkarte T2 §3 (Panel +
Boss-Bar IMMER + Item-Box, je +1 px Rand).

**Der Pass ist abgenommen, wenn ALLE Messziele M1-M5 grün sind UND
die Jury (§9) keinen neuen Prio-0-Befund meldet.** Die 10er-Note
wird weiterhin erhoben, ist aber INFORMATIV.

### M1 Belichtung (je Karte, feste Kameras aus Landkarte T2 §3)

| Karte | Median-L | Anteil L>128 | Anteil L<16 |
|---|---|---|---|
| GRAVEYARD (beide Szenen) | 38..46 | ≥ 0,5 % | ≤ 2,0 % |
| CATACOMBS | 40..50 | ≥ 2,0 % | ≤ 6,0 % |
| FLUESTERGRUFT | 34..44 | ≥ 1,5 % | ≤ 8,0 % |
| BOSS_KAMMER | 38..48 | ≥ 1,5 % | ≤ 4,0 % |

Positiv-Kontrolle: Messung auf dem GP5-Archivbild reproduziert
Median 24,9 (graveyard_teich) ±0,5. Negativ-Kontrolle:
Schwarzbild-Test (Median < 5, L>128-Anteil 0). IST-Werte: T2 §3.1.

### M2 Licht-Quantisierung (3-Kanal-Schätzer, validiert T6 §4b)

A/B-Aufnahme (mit Licht / `__noLight`), Restdunkelheit a per
Least-Squares, CATACOMBS-Kamera (40,190):
- `lichtstufen_anzahl`: distinkte a-Werte (Raster 0,01) in der
  Punch-Zone **≤ 12** (IST 77).
- `lichtstufen_plateau_anteil`: Texel auf einer der DEKLARIERTEN
  Stufen (±0,01) **≥ 95 %** (IST 49,3 %). Stufenliste wird aus der
  Engine-Konstante hergeleitet (§2), nicht frei gewählt. Abtastung
  auf 2×2-Block-Zentren (Bayer-Kanten zählen nicht als Stufen).
- Gradient-Schnitt vom Fackelzentrum (72 px): 8..12 Sprünge, jeder
  ≥ 0,04, kein Plateau < 3 px — als Jury-Bild beigelegt.
- Glow-Zone getrennt: distinkte (A−B)-Werte ≤ 24 (gestufte Ringe ×
  quantisierter Pulse, §2.6).
Kontrollen: A-gegen-A → exakt 1 Stufe; fackelferne Zone → a ==
mapDef.ambient ±0,01 (beide bereits nachgewiesen, T6 §4b).

### M3 Sprite-Beleuchtung (Verfahren T6 §4c)

Silhouetten-Vergleich NAH (unter Fackel) / FERN, CATACOMBS; Spieler
UND ein Skelett (Gegner = ohne Eigenlicht, Pflichtmessung):
- `ΔWarm = (R−B)_nah − (R−B)_fern` **≥ +18** (IST +5,6).
- Halbseiten-Modellierung: L-Differenz fackelzugewandte gegen
  -abgewandte Silhouettenhälfte NAH **≥ +6 L**; FERN < 2 L.
- Ausbrennen: 0 Silhouetten-Texel mit L > 240.
Positiv-Kontrolle: mit `__noLight` sind ΔWarm und dE == 0.
Negativ-Kontrolle: zwei ferne Standorte gegeneinander: dE < 4.

### M4 Kronen-Maßstab & Verdeckung

- Art-Ebene (check_gfx6_art): ≥ 3 Kronen-Keys mit Tinten-Bbox
  ≥ 40×28, davon ≥ 1 mit ≥ 56×40 (IST-Maximum 32×31).
- Geschlossenes Dach: bestes 48×32-Fenster auf GRAVEYARD ≥ 85 %
  Kronen-Pixel-Deckung (IST 70 %).
- Spieler-unter-Laub (A/B/C/D-Verfahren, Beweiszelle NEU nach §5.5):
  `verdeckt_kopf ≥ 120` Texel UND Quotient verdeckt/silhouette
  ≥ 0,75 (IST-Gate: 52 Texel, alte Zelle). NEU Pflicht-Kontrollen:
  A-gegen-A → silhouette 0; kronenfreie Standkachel → verdeckt 0.
- Kein Rechtsrand-Ploppen: Culling-Fix §5.4 per Smoke belegt.

### M5 Kontaktschatten-Abdeckung (Verfahren T6 §4e)

- Geometrie (Smoke, additiv): JEDE Klasse Spieler/Skelett/Ghul/
  Grufthund/Rostpanzer/Boss/Vase/Urne/Truhe hat ≥ 8 sichtbare
  Schatten-Texel UNTER der Fußkante (IST: 0 überall außer Boss 18).
- Bild: ΔL ≥ 6 auf ≥ 8 Texeln unter der Fußkante, in mindestens
  zwei Karten (außen + innen), Entity-da/weg-Differenzmaske.
Positiv-Kontrolle: der Boss (heute 18) muss grün sein.
Negativ-Kontrollen: Projektil → 0; Frame-gegen-sich-selbst → 0.

---

## §2 PAKET L — Licht-Quantisierung (Hebel 1)

**Weg: Landkarte T1 Option (d)** — das Offscreen-Lichtbild wird
rechnerisch als quantisiertes Stufenbild gebaut, nicht mehr per
arc-Stanzen. Präzedenz: Vignette-Bake hud.js:454-509.

2.1 **Stufen-Konstante** in lighting.js (exportiert):
`LIGHT_STEPS = 12` Stufen der Restdunkelheit, gleichverteilt
zwischen 0 und 1: `quantizeLight(f)` rundet auf k/12. Diese eine
Funktion ist die Quelle für Overlay (2.3), lightAt (§4.1) und
Tint-Stufen (§4.2) — Drift ausgeschlossen.

2.2 **Pure Funktion** `lightRuns(lights, camera, ambient, timeSec,
viewW, viewH)` in lighting.js (Node-testbar, additiv): rechnet je
2×2-Block die kombinierte Restdunkelheit `a = ambient · Π rest_l`
(Ring-Profil aus einer Lookup-Tabelle, die das bisherige
PUNCH_RINGS-Kumulativ 1/0,82/0,64/0,461/0,299/0,15/0 auf 12 Stufen
verfeinert), quantisiert per quantizeLight + Bayer-4×4 auf
Blockebene, und liefert waagerechte LÄUFE gleicher Stufe
`{x, y, w, h:2, stufe}`. Rechnen NUR innerhalb der
Licht-Bounding-Boxen; außerhalb gilt Stufe "voll ambient".
Flicker-Radius wird auf GANZE 2-px-Schritte gerundet (nimmt den
Subpixel-Shimmer, T1 §2d); der Anti-Kornkreis-Jitter rWob geht in
die Lookup-Distanz ein und BLEIBT (T1 §5d).

2.3 **draw()**: Ambient-Fill UNVERÄNDERT als erste Operation
(Detektor-Sonde, §0.2). Danach statt arc-Stanzen: für jeden Lauf
`destination-out`-fillRect mit `rgba(0,0,0,X)` bei globalAlpha=1,
X = 1 − a/ambient je Stufe. Abschluss `ctx.drawImage(off,0,0)`
unverändert 3-arg. Frame-Cache: Läufe nur neu berechnen, wenn sich
ganzzahlige Kamera oder ein quantisierter Radius geändert hat.

2.4 **Performance-Budget (Phase 0, VOR dem Build bindend):**
Browser-Messung auf 8124, CATACOMBS-Worst-View (12 Fackeln),
300 Frames: Licht-Pass gesamt Mittel ≤ 3,0 ms, P95 ≤ 6,0 ms.
Entschärfungsstufen in dieser Reihenfolge, falls gerissen:
(1) Cache aggressiver (Flicker-Radius auf 4-px-Schritte),
(2) Bayer nur an Stufengrenzen ±1 Block, (3) NUR DANN als
sanktionierte Ausnahme: 160×90-Offscreen + 5-arg-drawImage
(Stub-verträglich belegt, T1 §5d-2; die 3-arg-Regel §0.3 bekommt
dafür eine dokumentierte Einzelausnahme NUR für diesen einen
Aufruf). Reicht auch das nicht → STOPP, Eskalation an den Hauptloop.

2.5 **Warm-Pass bleibt** (GLOW/FLOOR/HOT_RINGS sind schon gestuft),
aber: `pulse` wird auf 5 feste Werte quantisiert (0,5/0,625/0,75/
0,875/1,0) — die letzte stufenlose Zeitmodulation fällt.

2.6 **HOT_RINGS wandern an den Docht** (cy−3 → cy+2), im
Gleichschritt mit dem Flammen-Umbau §6.6; der GP5-Weiß-Stresstest
wird danach wiederholt (0 reine Weiß-Texel außerhalb Kernradius).

2.7 Smoke additiv (§7.F): quantizeLight-Wertemenge (genau 13 Werte
0..1), lightRuns-Determinismus, Läufe ⊆ Bounding-Boxen,
Stufen ⊆ Deklarationsliste, Radius-Rundung, 5-Argument-Verbot
(bzw. Einzelausnahme) per Aufrufprotokoll.

---

## §3 PAKET B — Belichtungs-Sockel (Hebel 2)

**Kernbefund bindend (T2 §4): Ambient allein kann draußen nie 40
erreichen — die Palette deckelt bei 31,9.** Deshalb Doppelzug:

3.1 **Paletten-Offset AUSSEN (Variante "Offset", T2 §4.3):**
Gras-Rampe +15,1 L → e 47,0 / E 61,1 / a 82,8 / m 104,5 / K 111,2 /
A 129,2 ('D' 156,8 bleibt harter Deckel). Dunkeltöne k/n/0/*/+
bleiben UNTEN (Silhouetten-Kontrast). **Wasser-Rampe im
GLEICHSCHRITT:** w 47 (kühlerer Farbort erhalten, T2 §4.3-Zitat),
Kamm:Tal ≈ 2,3:1 → '=' ≈ 108; Auflagen: '=' < 'A', kein Wasserton
hellster Ton im Frame, Sättigung unter 'A'. Wiesenlicht-Klassen
(6 Grids) werden auf ±2..4 L um das NEUE Pool-Mittel (~50)
zusammengezogen — das erledigt zugleich Restliste 5a (Steppdecke).
Der 47er-Pool selbst wird NUR per Offset verschoben, seine innere
Streuung (±3 L, bereits konform) bleibt.

3.2 **Ambient-Werte** (die EINZIGE Flusstest-Änderung, §7.A):
GRAVEYARD 0,45 → **0,22** · CATACOMBS 0,78 → **0,55** ·
FLUESTERGRUFT 0,85 → **0,52** · BOSS_KAMMER 0,66 → **0,48**.
Alle vier Werte bleiben paarweise VERSCHIEDEN (die Flusstests
unterscheiden Karten am ambientAlpha — Gleichstände würden
Assertions entwerten). Modell-/Sweep-Prognose der Mediane: 38,9 /
41,2 / ~34,6 / ~39,8 — alle in den M1-Bändern.

3.3 **Testfreie Begleit-Hebel:** Vignette VIG_STEP 0,09 → 0,06
(Max-Alpha 0,30; Bayer-Muster bleibt); ambientTints dürfen je Karte
in Runde 2/3 zur Feinjustierung ±4 L / wärmer variiert werden
(deklarationspflichtig); FLUESTERGRUFT erhält 2 extraLights im
Kanalraum (Muster map_bosskammer.js:99, flicker 0,5, r ≤ 88).
FLUESTERGRUFT bleibt per M1-Band die dunkelste Karte
(Rollen-Erhalt "dunkelste Ebene" über das Band, nicht über 0,85).

3.4 Highlight-Anteil M1 (≥0,5 % außen) kommt aus dem Offset selbst
('A' 129,2 liegt über 128), aus Kronen-Spitzlichtern (§5) und dem
Teich-Specular (§6.4) — NICHT aus Weiß.

---

## §4 PAKET S — Sprite-Beleuchtung + Kontaktschatten (Hebel 3)

4.1 **`lightAt(lights, wx, wy, ambient, timeSec)`** als reine
Funktion in lighting.js, Rückgabe `{f, warm}` (f = 1−Restdunkelheit
via EXAKT derselben Lookup+quantizeLight wie §2; warm = 0..1 aus
den Glow-Ringen, nur flicker ≥ 0,8). Abtastpunkt ist der
Schatten-Anker (cx, Fußkante−1) — Sprite-Licht und Schatten teilen
denselben Weltpunkt.

4.2 **Tint-Masken + Fassaden-ctx** (T3 §4.5, testneutral):
`buildTintMask(grid, palette, toneHex)` additiv in
sprite_factory.js — identische Alpha-Form, ein Farbton, gebaut mit
fillStyle bei globalAlpha=1, LAZY und damit nach main.js:71.
Je Sprite drei Masken: WARM-L (Ton 216,114,42, Helligkeits-Rampe
von links gebacken), WARM-R (von rechts), KALT (ambientTint-Ton,
flach). Fassaden-ctx um die renderables-Schleife main.js:672:
erster drawImage = Original (Wächter B), danach optional
Masken-Draw source-over mit stufigem globalAlpha:
warm-Alpha ∈ {0, 0,12, 0,24, 0,36} nach warm-Stufe, Seite nach
Fackelrichtung; kalt-Alpha ∈ {0, 0,08, 0,16} nach Dunkel-Stufe.
KEIN 'lighter' auf Sprites (Weiß-Sättigungs-Lehre GP5). Nach jedem
Masken-Draw globalAlpha=1. Level-Up-Ring, Drops, Projektile: ohne
Tint (Deklaration).

4.3 **Kontaktschatten-Standardprofil** bekommt die Boss-Lösung:
SHADOW_DY [0,1,2] → **[−1,0,1,2]**, SHADOW_W [0,90, 0,95, 0,7,
0,4], SHADOW_A [0,30, 0,40, 0,20, 0,10]. BIG-Profil unverändert.
Damit erfüllen alle Klassen M5 (Zeile −1 liegt unter der Fußkante
und ist nie vom eigenen Sprite verdeckt). Der gegenphasig blinkende
Schatten beim Unverwundbar-Blinken bleibt (deklariert, kein Umbau).

4.4 Smoke additiv (§7.F): Schatten-Texel-Geometrie je Klasse
(≥ 8 unter Fußkante), lightAt-Determinismus + Wertemenge,
Masken-Bau erst nach TILE_ART (Erzeugungsindex-Beweis).

---

## §5 PAKET K — Kronen-Maßstab (Hebel 4)

5.1 **Drei XL-Klassen** (Art-Canvas EXAKT span·16, T4 Fußnote A):
`tree_canopy_xl_a` span [3,2] 48×32, `tree_canopy_xl_b` span [4,3]
64×48, `tree_canopy_xl_c` span [3,2] 48×32, jeweils + gespiegelte
`_m`-Fassung. Tinten-Bbox-Ziele: M4. Blattcluster mit Trennlinien
(dunkle 'k'/'n'-Nähte zwischen Ballen), Spitzlicht-Tier oben links
(Hauptlichtrichtung GP4-R3), Werteumfang der neuen Gras-Rampe §3.1.
Erzeugung über Generator `.tmp/gen_crowns_gp6.mjs` (Präzedenz
gen_crowns_gp5r2), Verifikation im Skript.

5.2 **Sway = gebackene Scher-Posen** (T4 Weg B, EIN drawImage pro
Zelle — smoke:695-697 bleibt unangetastet): neues Legendenfeld
`swayPoses: [8 Einträge]` mit den 5 echten Posen art/sh1/sh2/sh1m/
sh2m in der Folge [0,+1,+2,+1,0,−1,−2,−1]; Scherung zeilenweise
nach Höhe gebacken (Unterkante fix). Auswertung über NEUE pure
Funktion `swayPose8(tx,ty,timeSec,rate)` (additiv; SWAY_DX und
smoke:2390 bleiben unberührt). Validierung in createTilemap:
swayPoses nur auf span>1-Defs, Länge 8, poses[0]===art, alle Keys
existent; die anim/variants-Sperre auf span bleibt bestehen und
swayPoses ist von ihr ausgenommen. Ruhelage timeSec=0 ist byte-
gleich zu heute (alle Anker-/Determinismus-Tests messen bei t=0).
ANCHOR_CLAMP: jeder XL-Key W=4, `_m`-Fassungen identisch —
KEIN Rückfall auf Default 14.

5.3 **XL-Schatten als EIN-Draw-Bake** (T4 §5.2): je XL-Klasse ein
`canopy_shadow_xl_[a|b|c]` (sw·16 × 32, Silhouetten-Projektion mit
Randerosion statt 50-%-Schachbrett, Töne 'k'-basiert mit
Bayer-25-%-Dichte — erledigt zugleich Restliste 5b), gezeichnet an
EINER Stelle, Versatz +2/+2 (Lichtrichtung oben-links). Kleine
2×2-Kronen behalten canopy_shadow (Bestand), aber der Zeichen-Ort
wandert in einen ZWEITEN Durchgang nach den Bodenkacheln desselben
Fensters (behebt den dx>0-Anschnitt-Riss, T4 Schwäche 3).
canopy_shadow selbst wird von Schachbrett auf Bayer-25 % über 'k'
umgebaut. Schatten scheren NICHT mit.

5.4 **Culling-Fix rechts:** `txEnd = min(wTiles−1, tx1+1)` im
Over-Zweig (T4 §1.4, reproduzierter Defekt). Sanktionierte
Alt-Test-Änderung §7.E.

5.5 **GRAVEYARD_OVER_ROWS neu** per Generator `.tmp/gen_over_gp6.mjs`:
zwei geschlossene XL-Dächer (Nord-Wald um (31,9), Süd-West um
(12,22)), Rest-Bestand aus 2×2/Back-Kronen ausgedünnt; Hänge-Kronen
B/C nur noch als Rand-Füller ≤ 6 Stück. Guards: Zeile 12 Spalten
0..20 bleibt leer, Spalte 21 leer, keine span-Zeichen in
Ground-rows, Stammdeckung span-generisch. Beweiszelle für M4:
unter dem Nord-Dach, vom Spawn erreichbar (Kandidaten-Rechnung wie
T4 §3.4; die Szene wird in shot_gfx6.py auf die neue Zelle gelegt).
sol/geo-Hashes sind von OVER_ROWS unberührt (T4 §2.2-7).

---

## §6 PAKET R — Restliste-Politur

6.1 **Kanal-Uferring:** DREI neue Grids `water_shallow_vert`,
`_vert_v1`, `_vert_v2` (water_mid-Formensprache, KOLLISIONSFREIES
Präfix — `water_shallow_v` ist wegen der `${base}_v${vi}`-Ableitung
VERBOTEN, T5 §1) + EINE Legendenzeile map_fluestergruft.js:97:
`depthOverlays: ['water_shallow_vert', 'water_mid']`. Friedhofsteich
unberührt. Messgate: Kanal-Ufer-Anisotropie längs ≥ 2,0 (IST
0,84/1,11; Mitte 3,97 als Positiv-Kontrolle).

6.2 **Boss-Kratzer kalt:** floor_decal_crack verliert 'T' und das
'm'-Erbstück; Kratzer als 'L'+'k'-Dither (kalt, R−B ≤ −6 je Ton).
Messgate: Δ(R−B) Kratzer-gegen-Boden im gerenderten Bild ≤ +8
(IST +20..27; Lit-Dither-Blinken T5-Hypothese B wird durch die
Messung im 9-Lauf-Modus mit erfasst und im Jury-Material erklärt).

6.3 **Wegsporn ans Wasser:** NEUE Legendenzeile (unbenutztes
Zeichen) mit Weg-Ton-Art `path_pebbles` und EXAKT den
Emissions-Flags von 'p' (fringeSource, fringeSet 'grass', bankSet
'g', solid false); ROWS-Tausch NUR an (28,15) und (29,15)
'p'→neues Zeichen. KEIN Tausch auf '=' (T5-Risikomessung: reißt
die Ufer-Emission um). Beleg: fringe/shore/bank-Emissionsvektoren
der 6 Nachbarzellen VOR/NACH byte-identisch (Node-Probe im
Integrator-Auftrag); sol (solid false→false) und geo (keine
Fackel/Spawn/Portal-Zelle) unberührt — im Smoke-Lauf bewiesen.

6.4 **Teich:** Specular-Tier zurück — 4..6 Texel '=' (neuer Wert
~108) pro Flachring-Kachel NUR auf water_shallow/_v1/_v2
(24 Ring-0-Kacheln, T5 §4a), Ziel 96..144 Specular-Texel im
Teich-Fenster. Ufer-Entregelung an shore_n/s/e/w + shore_diag_*:
(a) Lichtrichtung: shore_n behält die helle W-Zeile, shore_s/e/w
dämpfen auf ≤ 48 L; (b) höchstens EINE durchgehende Konturlinie je
Kachel (heute 3); (c) Lückenraster je Kachelrichtung verschieden
(kein 6-7-px-Gleichtakt N==S); (d) shore_diag: die 4-Zeilen-
Wiederholung brechen, keine 2 vollen Spalten. Emissions-LOGIK
(smoke:2171-2232) bleibt byte-unberührt — nur Grid-INHALTE ändern
sich (T5-Risikomatrix P4b).

6.5 **Gras:** 5a über §3.1 (Wiesenlicht-Zusammenzug). 5c
Halm-Größenklassen: 'u'- und 'j'-Pools von n=3 auf n=5 erweitern
(zwei neue Größenstufen je Pool; 5 ist ungerade und teilerfremd ✓;
variants[0]===art bleibt).

6.6 **Flammen-Wertegefälle:** Kern '1' wandert an den Docht
(Zeilen 5..7), Spitze wird 'o'/'r'-dominant und schmaler; Silhouette
bleibt ≤ 5 breit, Fläche ±20 % (Gates in check_gfx6_art). HOT_RINGS
ziehen mit (§2.6). Für alle 6 Fackel-Grids.

6.7 **HUD:** (a) XP-Leiste eigene Farbidentität — Rinne dunkles
Moosgrün (~L 30), Füllrampe grün-golden 8 Zeilen, Kontrast Rinne→
Füllung ≥ 100 L (IST 65,6; Vorbild Boss-Balken 125). (b) GOLD-/
Trank-ZIFFERN als 3×5-Pixelziffern per fillRect ÜBER dem
fillText-Wert: der fillText-Aufruf bleibt UNVERÄNDERT bestehen
(Flusstest-Sonde 'GOLD <n>'), wird aber von einem panel-farbenen
Deckrechteck + Pixelziffern überdeckt; Deklaration im Jury-Prompt.
Nur die WERT-Spalte, das Wort GOLD bleibt fillText. (c) Boss-Lag-
Streifen bekommt die 8-Zeilen-Rampe (entsättigte BOSS_FILL_RAMP-
Schwester) statt Flachton. Alles fillRect-only, keine neuen
Teilalpha-fillRects auf Offscreens, GOTT-Anzeige unangetastet.

---

## §7 TEST-ÄNDERUNGS-KATALOG (abschließend — sonst NICHTS)

**A. Flusstests — GENAU 13 Wert-Anpassungen** (GP3-Muster T2 §2.4/2.5):
- check_main_slice1.mjs ~202/246/283: `0.45` → `0.22` (3 Zeilen);
  ~229/236: `0.78` → `0.55` (2 Zeilen).
- check_boss_slice3.mjs ~143/172/185/244/264: `0.66` → `0.48`
  (5 Zeilen); ~157/165/277: `0.85` → `0.52` (3 Zeilen).
PRO ZEILE dürfen BEIDE Wert-Vorkommen angepasst werden (Assertion-
Literal UND Meldungs-String derselben Zeile); die Folgezeilen 158/
278 sind interpoliert und werden NICHT angefasst. Assertion-Struktur
und alles Übrige byte-identisch. check_inventory_slice2.mjs: NULL.
Abnahme per git-diff-Beweis. Das Kontingent gilt danach erneut als
VERBRAUCHT.

**B. tools/smoke_test.mjs:1996** AMBIENT auf 0.22/0.55/0.52/0.48 +
die zwei Kommentarzeilen :1975/:1994-1995 (Marker `GP6-§7B`).

**C. smoke:658-666** Stammdeckung span-generisch (Fenster aus
legend[ch].span, Zeichenliste aus der Legende) (`GP6-§7C`).

**D. smoke:1762-1799** Kronen-Schatten: Schattenzeile ay+sh über sw
Spalten, XL-Ein-Draw, Zweitpass-Reihenfolge (Koordinaten-Assertions
bleiben lagegleich) (`GP6-§7D`).

**E. smoke:1875-1968** Anker-Klassen-Tabelle + rechter Culling-Rand
tx1+1 (`GP6-§7E`).

**F. ADDITIVE NEUE Blöcke** (Marker `GP6-§7F`, kein Bestandstest):
quantizeLight/lightRuns/lightAt (§2.7, §4.4), swayPose8 + swayPoses-
Validierung, Schatten-Texel-Geometrie je Klasse, XL-Existenz +
Bbox-Mindestmaße, canopy_shadow_xl-Emission, water_shallow_vert-
Verdrahtung, Wegsporn-Legende + Emissions-Byte-Gleichheit,
Tint-Masken-Erzeugungsindex.

**G. check_gfx6_art.mjs ERSETZT check_gfx5_art.mjs** (§0.8-Muster):
portiert alle Wächter; NEU: Maßtabelle {16, 32, 48×32, 64×48} statt
16/32-Dichotomie; NEW_TONES auf die Offset-Palette; Flammen-Gate
auf Docht-Kern umgestellt; Kratzer-Gate: kein 'T'/'m' + R−B-Kälte;
Kronen-Bbox-Gate (M4); Specular-Zählung 4..6/Kachel.

**H. Verboten bleibt:** fringeOverlays-Bytes, sol/geo, Stub-
Erweiterungen, jede nicht oben gelistete Bestandszeile.

---

## §8 BUILD-TOPOLOGIE (alle Ausführenden Opus, exklusiver Besitz)

**Phase 0 (parallel):**
P0a Perf-Probe §2.4 auf 8124 (Prototyp lightRuns als .tmp-Skript,
Budget-Entscheid dokumentieren — bei Rot: Entschärfungskette).
P0b Generatoren: gen_crowns_gp6.mjs (XL + Posen + Schatten-Bakes),
gen_over_gp6.mjs (OVER_ROWS + Guards + Beweiszellen-Rechnung),
Paletten-Offset-Rechner (Soll-Hex-Tabelle für Art).

**Phase 1 (parallel):**
ART: art/sprites.js + art/palette.js — §3.1 Rampen, §5.1 XL-Kronen
+ Posen + XL-Schatten, §6.1 water_shallow_vert, §6.4 Teich/Ufer,
§6.5 Halme, §6.6 Flammen, §6.2 Kratzer, path_pebbles.
ENGINE-A: core/lighting.js (§2 komplett, §4.1 lightAt, §2.6
HOT_RINGS) + world/tilemap.js (§5.2 swayPose8/swayPoses, §5.3
Schatten-Zweitpass + XL-Schatten, §5.4 Culling).

**Phase 2:** ENGINE-B: main.js (§4.2 Fassade + Masken-Verwaltung,
§4.3 Schatten-Profil), core/sprite_factory.js (buildTintMask),
ui/hud.js (§6.7, §3.3 Vignette), world/maps.js + map_*.js (§3.2
ambient, §3.3 Tint/extraLights, §5.5 OVER_ROWS, §6.1 Legendenzeile,
§6.3 Wegsporn-Legende+ROWS).

**Phase 3:** INTEGRATOR: §7 komplett (sanktionierte Zeilen,
additive Blöcke, check_gfx6_art), alles grün: syntax, smoke 3×,
3 Flusstests, check_gfx6_art; Emissions-Byte-Beweis §6.3.

**Phase 4:** PROOF: .tmp/shot_gfx6.py — alle M1-M5-Gates mit
Kontrollen, 13+ Szenen (GP5-Kameras + neue Beweiszellen), 9 Crops
4-6×, Sway-/Flammen-Strips, Ergebnis-JSON.

Nach jeder Phase: Hauptloop prüft + committet grün.

---

## §9 JURY (3 direkte Opus-Agenten, PNG-Lesen freigegeben)

Aufgaben-Verschiebung ggü. GP5: Die Jury (a) prüft die MESSUNGEN
(misst das Gate das Richtige? Fenster valide? Kontrollen echt?),
(b) liefert Sichtbefunde auf Crops/Strips (neue Prio-0-Defekte),
(c) vergibt die 10er-Note INFORMATIV. Deklarationsliste im Prompt:
bewusste Entscheide (fillText-Überdeckung §6.7b, Schatten-Blinken
§4.3, Hänge-Kronen-Rest §5.5, Lit-Dither-Blinken §6.2, ambientTint-
Feinjustierung §3.3, Einzelausnahme 5-arg falls §2.4-3 zog).
Material: Vollszenen + 9 Crops + Strips + Gradient-Schnitt-Bild +
Messreport. Max. 3 Runden; Runde N+1 baut NUR Jury-Prio-0 +
rote Messziele. Nach Runde 3: Ergebnis an Michael.

## §10 ABNAHME

Grün = M1-M5 vollständig + Jury ohne neuen Prio-0 + alle Suiten
grün (syntax, smoke 3×, 3 Flusstests MIT genau den §7.A-Zeilen per
git-diff belegt, check_gfx6_art) + Übergabe in uebergaben/ +
Commit. Die 10er-Note wird berichtet, entscheidet aber nicht.
