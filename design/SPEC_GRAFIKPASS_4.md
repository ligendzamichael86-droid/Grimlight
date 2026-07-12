# SPEC Grafikpass 4 — "Struktur & Licht" (Ziel: Median 8, Block-Ende)

Stand 12.07.2026, Hauptloop (Fable), REVISION 2 nach adversarialem
Review (3 Opus-Prüfer: 1 Blocker, 10 Majors, 15 Minors — alle
eingearbeitet, Änderungen mit [REV] markiert). Bindend.

Auftrag Michael: "wir machen mit grafik weiter bis 8/10, dann erneute
entscheidung". MEILENSTEIN-LOGIK [REV]: Median >= 8 in irgendeiner
Runde → Grafik-Block endet sofort mit Abnahme. Nach Runde 3:
7,5-7,9 → Pass-Abnahme, Grafikpass 5 wird geplant (Block läuft
weiter); < 7,5 → Eskalation an Michael mit Ursachen-Analyse.

Grundlage: design/GP3_RUNDE3_JURY.md (Backlog), technische Landkarte
(4 Opus-Leser), Review-Protokoll (Workflow wf_f15f4d25), grüne Basis
Commit 2914649.

## 0. Eiserne Regeln

1. **Gameplay-Neutralität mit EINER sanktionierten Ausnahme:** Die
   GRAVEYARD-Teich-Silhouette wird umgeformt (§2.7a). [REV] Harte
   Grenzen: nur Zellen mit Chebyshev-Distanz >= 2 zu JEDER Fackel-,
   Spawn-, Portal-, Truhen- und Prop-Zelle (gemessen: F-Fackel und
   Urne liegen auf Distanz 1 — der Generator CLIPPT hart); Region
   bleibt zusammenhängend und geschlossen (keine Abschnürung, keine
   neuen Durchgänge); keine Wasserzelle mit >= 3 Gras-Orthonachbarn
   (§2.1-Wahrheitstabelle deckt max. 2); Budget max. ±12 Zellen
   INNERHALB dieser Grenzen. Deko-Tausche begehbar↔begehbar in
   GRAVEYARD/CATACOMBS/BOSS_KAMMER bleiben zusätzlich erlaubt
   (verifyNeutral-Gate; ändern sol/geo-Hashes nicht). [REV] Die
   Formulierung "exakt 2914649" gilt für Kollision/Spawns/Portale/
   Werte — nicht für rows-Bytes.
2. **Ambient-Werte 0.45/0.78/0.85/0.66 EINGEFROREN** (GP3-Kontingent
   verbraucht; §36 + 13 Flusstest-Zeilen). Keine Ausnahme.
3. **Flusstests .tmp/check_*.mjs: NULL Änderungen, keine
   Stub-Erweiterungen.** Methoden-Whitelist für neuen Render-Code:
   fillRect, drawImage, arc, fill, beginPath, save, restore,
   clearRect, createRadialGradient, fillText + Properties
   globalAlpha/globalCompositeOperation/fillStyle. VERBOTEN:
   getImageData, putImageData, ellipse, roundRect, createPattern,
   clip, moveTo/lineTo/rect/closePath, measureText, scale/transform/
   setTransform, strokeRect, translate, rotate.
4. **ambientAlpha-Detektor-Schutz:** kein neues Offscreen-Canvas mit
   Teilalpha-fillRect; neue Zeichnungen auf den Haupt-ctx.
   lighting.js:49 bleibt der einzige Treffer (check_main:154-157,
   check_boss:120-123).
5. **[REV] Composite-Hygiene-PFLICHT:** Jeder Block, der
   globalCompositeOperation setzt, stellt am Blockende EXPLIZIT
   'source-over' und globalAlpha=1 wieder her (zusätzlich zu
   save/restore — der Boss-Stub restauriert gco NICHT; ein Leak
   bliebe in allen Tests grün und bräche im Browser Portal-Fade und
   HUD).
6. Kein Math.random/Date.now in world/ und art/ (particles.js-
   Spawn-Ausnahme bleibt); Determinismus via variantIndex/Hash.
7. Port 8123 = Auftraggeber; Agenten nur 8124.
8. Maße: Tiles 16×16, alle Kronen 32×32. Keine Grid-Resizes.
9. **Palette VOLL** (61 Alnum belegt, 'l' verboten): neue Töne NUR
   als Symbol-Keys laut Tabelle §3.6 (jetzt 3 statt 4 [REV]).
   Hinweis: '=' ist zugleich GRAVEYARD-WEG-Legendenzeichen — Legende
   und Palette sind getrennte Namespaces, aber Generator-/Agenten-
   Doku muss das nennen.
10. Tabu: entities/, items/, core/ außer lighting.js+particles.js,
    ui/ außer hud.js, map_fluestergruft.js. player_* offen wie
    GP3-§8c.1 (nur Pixel).

## 1. Scope: sieben Pakete

A. **Wasser-Struktur:** Teich-Reparatur (Schimmer-Loop statt
   Scroll-Loop [REV]) + organische Uferlinie (Konkav-Autotiling +
   Silhouetten-Umformung).
B. **Wald-Tiefe:** zweite dunklere Kronenreihe + Volumen-Carving der
   6 Front-Kronen.
C. **Licht-trifft-Textur (Flaggschiff):** Lit-Dither-Pass (nur
   Stein-Maps [REV]), Fackel-Boden-Glow + Flammen-Hotspot,
   Staub-Mote-Bündelung.
D. **Sprite-Modellierung:** Ghul-Neuzeichnung (= der "Wraith";
   NICHT der warden — Beleg shot_gfx3.py:464-467), 2-Ton-Rampe +
   Rim auf allen Gegnern, Hund-Ridge, Grabsteine, Boss-Decals.
E. **Schatten-Vereinheitlichung (rescoped [REV]):** Engine-Pass auf
   ~35 % Kontaktdeckung korrigieren + echte Props einbeziehen;
   Grabstein/Zaun-TILES behalten gebackene Schatten.
F. **HUD & Flächen:** XP-Balken, Panel, Herzen; Wiesenlicht-Makro,
   Glyphen, Weg-Spuren [REV].
G. **[REV] Animations-Politur (minimal, gegen den SoM-Deckel):**
   Fackel-Flamme 3-Frame, Gras-Sway der Deko-Glyphen,
   Teich-Schimmer (via A).

Nicht-Ziele (Pass-5-Kandidaten): Parallaxe, Per-Pixel-Reflexe,
Marching-Squares-Vollsystem, Sub-Tile-Kollision, Gegner-/Helden-
Animationsphasen (entities/-Tabu), "Spieler steht auf Wasser".

## 2. Engine (Besitz: Engine-Builder)

### 2.1 tilemap.js — Ufer-Autotiling [REV: Wahrheitstabelle, 4 Keys]

fringeOverlays() (tilemap.js:52-97) für shorePrefix 'shore', pro
Wasser-Zelle mit Gras-Nachbarn (SIGNATUR UNVERÄNDERT — Node-getestet):

| Gras-Nachbarschaft (orthogonal) | Emission |
|---|---|
| genau 1 Seite (N o. S o. E o. W) | shore_n/s/e/w (BESTAND, byte-gleich) |
| genau 2 ADJAZENTE Seiten (N+E, N+W, S+E, S+W) | NUR shore_ine/inw/ise/isw — ERSETZT die bisherige Doppel-Emission der zwei Ortho-Keys auf dieser Zelle [REV] |
| 2 OPPONIERTE Seiten (N+S, E+W) | Bestand (beide Ortho-Keys) — nach §0.1 (keine >= 3-Nachbar-Zellen, keine 1er-Finger) selten |
| nur diagonal (kein Ortho) | shore_ne/nw/se/sw (BESTAND, byte-gleich) |

Es gibt KEINE shore_d*-Familie mehr [REV — Review: Doppel-Overlay-
Kollision mit der bestehenden corner()-Emission]. Die konkaven
i-Keys zeichnen die Innenecke als EINEN organischen Diagonal-Bogen
(§3.2). Deterministisch aus (tx,ty). Additive Smoke-Tests §5#5
prüfen genau diese Tabelle.

### 2.2 Lit-Dither-Pass [REV: Pure-Function + Composite-Reset + nur Stein-Maps]

(a) NEUE reine, Node-importierbare Funktion in **tilemap.js**:
`litDitherCells(lights, camera, timeSec, viewW, viewH)` → Liste
`{tx, ty, stufe, key}` für jedes sichtbare Boden-Tile, dessen Zentrum
im Fackelkegel liegt (Stufe 2: Distanz < r*0.45; Stufe 1: < r*0.75;
r inkl. des deterministischen Doppel-Sinus-Flickers — Formel aus
lighting.js:57-60 wird hierher DUPLIZIERT oder in eine geteilte
Export-Funktion gezogen). key = licht_dither_1/_2 via
variantIndex(tx,ty,2). [REV Blocker-Fix: dadurch ist der
§5#5-Determinismus-Test headless baubar.]
(b) main.js-Block ruft sie NACH map.draw('ground'), VOR den Entities:
drawImage je Zelle mit globalCompositeOperation='lighter',
globalAlpha 0.18 (Stufe 1) / 0.30 (Stufe 2), auf dem HAUPT-ctx.
DANACH PFLICHT: gco='source-over', globalAlpha=1 (§0.5).
(c) [REV] NUR Maps mit Stein-Boden: CATACOMBS, FLUESTERGRUFT,
BOSS_KAMMER (Flag `mapDef.litFloor: true` in deren Defs; GRAVEYARD
bekommt es NICHT — Stahl-Texel auf Gras wirken fremd, Ambient 0.45
braucht es nicht). Nur statische mapDef-Fackellichter.

### 2.3 lighting.js — Boden-Glow + Flammen-Hotspot

Im Warm-Glow-Pass (lighting.js:96-121, 'lighter'): (a) pro Fackel ein
flacher Boden-Glow an der Fackelbasis — EIN createRadialGradient-
Kreis mit kleinem Radius (~10 px), Stops max. 0.15→0, pulsierend über
den Doppel-Sinus [REV: keine Zwei-Kreis-"Erdnuss"; ein Kreis liest
am Boden durch die Draufsicht ausreichend oval]; (b) 2-3 px additiver
weiß-gelber Hotspot am Flammenkern (Radial-Glow, Stops ~0.5→0,
Radius ~3 px). Composite-Hygiene §0.5.

### 2.4 main.js — Schatten-Korrektur [REV: Mathe-Fix + Rescope]

BEFUND Review: die 3 drawSoftShadow-Zeilen liegen auf VERSCHIEDENEN
y (main.js:492, baseY-i) — sie überlappen nicht; reale Kontaktdeckung
ist 0.14, NICHT ~0.35. Jury will ~35 %. FIX: Zeilen-Alphas werden
[0.32 (Basiszeile, breiteste), 0.20, 0.10] — bewusst als Gradient
(unten satt, oben auslaufend); gilt für Spieler UND Gegner UND
(neu) echte Props. AUSWEITUNG: drawSoftShadow zusätzlich für die
props-Liste aufrufen (vor der y-sortierten Schleife). GEKOPPELT mit
§3.5b: NUR vase, urn, chest_closed, chest_open verlieren ihre
gebackenen '0'-Schatten [REV — Grabsteine/Zaun sind LEGENDEN-TILES
mit opakem Gras-Grund, kein Engine-Schatten möglich; sie BEHALTEN
ihre gebackenen 'n'-Schatten (von der R3-Jury gelobt); die
§3.5-Phantome "Kreuze/Töpfe/Sack" existieren nicht].

### 2.5 particles.js/main.js — Staub-Mote-Bündelung

Motes spawnen in 2-3 Clustern nahe der Fackelpositionen (Streuung um
Fackel-Koordinaten statt gleichverteilt), dunkle Raummitte bleibt
frei. Obergrenze 60 unverändert.

### 2.6 ui/hud.js — XP-Balken + Panel (fillRect-only)

XP-Balken auf **26×5** bei (4,36) (kollisionsfrei verifiziert: Panel
y2..42, Herzen y4, Gold y15, Trank/Key y25..33, Boss-Bar 120,7) in
Boss-Bar-Sprache: 1px-Dunkelrahmen, entsättigte Rinne,
2-Band-Gradient-Füllung, 1px-Innenbevel; keine Ticks. Panel: helle
Kante oben-links, dunkle unten-rechts, Innen-Schlagschatten, [REV]
leichter Vertikal-Gradient (oberes Drittel +6 Luma, fillRect-Bänder).

### 2.7 maps.js / map_bosskammer.js — Generator .tmp/gen_gfx4.mjs

(a) TEICH-UMFORMUNG unter den §0.1-Grenzen [REV]: unregelmäßige
Treppung, 2 Ausbuchtungen + 1 Einbuchtung; die Einbuchtung öffnet
keinen neuen Durchgang. Generator prüft: Spawns/Fackeln/Portale/
Truhen byte-identisch (inkl. findTiles('F')-Ergebnis!), Distanz-
Clipping, Zusammenhang, max ±12. Danach §36-GOLD.GRAVEYARD.sol neu
(§5#1). depth-BFS rechnet automatisch.
(b) WIESENLICHT-MAKRO (GRAVEYARD): Hell-/Dunkel-Luma-Patches
(grass_lumahi/lumalo, 48-64 px Skala, unregelmäßig) + Glyphen-
Streuung: Rotations-Varianten, [REV] Positions-Jitter in den Grids
(hash(x,y)%5−2, gebacken), 15 % bewusst leere Zellen.
(c) BOSS-ARENA-DECALS: 3-4 begehbare Decals in map_bosskammer.js-rows
(floor_decal_crack dunkler, floor_decal_bones HELLER als Boden via
Knochen-Töne b/B/N [REV — der alte '%'-Plan lag UNTER dem Bodenton]);
verifyNeutral; sol/geo-Hashes bleiben automatisch grün.

### 2.8 GRAVEYARD_OVER_ROWS — zweite Kronenreihe [REV: ASCII + Arithmetik]

Anker-Zeichen **'Y','Z','A'** [REV — Umlaute sind ein NFD/Längen-
Risiko (createTilemap:196 wirft bei Multi-Code-Unit); Y/Z/A sind in
GRAVEYARD-Legende+rows verifiziert frei; Namespace Legende≠Palette
dokumentieren] für tree_canopy_back_a/_b/_c, span:[2,2], EINE Zeile
über den Front-Ankern, getrennte Zellen. ARITHMETIK [REV]: Anker
+16 px, Art-Inhalt im Grid **8-10 px TIEFER** gezeichnet → Netto-
Überstand 6-8 px; mit Anker-Jitter ±2 px je Anker (relativ ±4)
schwankt der Überstand 2-12 px — akzeptiert, Ziel-Mitte 7 px. Back-
Grids zeichnen NUR die obere Kronenkuppe (untere ~10 Zeilen
transparent — wird von der Front verdeckt, vermeidet Clipping).
Non-solid, kein trunkCovered-Anspruch. BUILD-REIHENFOLGE [REV]: der
§21-Zähl-Check (smoke:633) wird erst grün, wenn die Back-ARTS
existieren — Integrator prüft Engine+Art gemeinsam.

## 3. Art (Besitz: Art-Builder)

### 3.1 Teich: Schimmer-Loop statt Scroll-Loop [REV — Kernumbau]

BEFUND Review: water_1..3 sind heute strikte rollDown(water, 4·N)-
Verschiebungen — jeder "driftende" Glanz bräche den Wrap oder läse
als Strömung. FIX: die 4 Teich-Frames werden von der Scroll-Schleife
auf eine SCHIMMER-Schleife umgebaut (Smoke §35 prüft nur den
4-Frame-Zyklus + animSync, NICHT die Roll-Eigenschaft — verifiziert):
Basis-Ripples bleiben pro Frame ortsfest und ändern nur Phase/Länge
um ±1-2 px; 2-3 GLANZ-Streifen (Ton '=', 1 px hoch, 6-10 px lang, 3
versetzte Höhen) blenden über die 4 Frames weich ein/aus (Twinkle),
Frame 3→0 nahtlos konstruiert. Ergebnis: ruhige Spiegelfläche
(Jury-Prio 1), sichtbar belebt statt fließend. Speckle-Dichte −30 %,
Kämme zu 3-5-px-Läufen gebündelt. water_v (Kanal) UNVERÄNDERT —
dort ist Fließen gewollt.

### 3.2 Shore: 8 Bestands-Tiles organisch + 4 Konkav-Keys [REV]

Bestands-8 (shore_n/s/e/w/ne/nw/se/sw): sichtbare gebrochene
Schaumlinie (1-2 px, 'i'/'='), 1 px in den Gras-Rand gedithert
(buildSprite kennt kein Teil-Alpha — Dither statt Alpha [REV]),
organische Kanten ±2-3 px Jitter, [REV] plus 1 px dunkleres
Tiefen-Band innen (Backlog-Punkt). NEU NUR: shore_ine/inw/ise/isw
(16×16, Innenecken-Bogen, Wasser-Seite geschnitten, stilgleich).
Schnitt IMMER auf der Wasser-Seite (Spieler stoppt max. ~8 px vor
der Wasserlinie — Entscheid; nie Gras-Seite).

### 3.3 Kronen

(a) BACK-REIHE tree_canopy_back_a/_b/_c (32×32): nur obere
Kronenkuppe, Inhalt 8-10 px unter Grid-Oberkante beginnend (§2.8),
Rampe über '+'/'*' (~−20 % Value, verifiziert zwischen E und 0),
eigene ruhige Außenlinie. (b) FRONT (6 Grids): innere
Schatten-Taschen unten-rechts je Laub-Klumpen, geclusterte
Specular-Tupfer ('A', 3-4 px) am Ober-links-Kamm, 2-3 px
Schatten-Spalt zwischen Keulen, Keulenradius ±2 px, untere
Blätter-Ausbuchtungen 2-3 px, 2-px-Stamm-Ansätze.

### 3.4 Gegner

(a) GHUL (ghoul_0/_1/_die, 16×20): Wertsprung heller Schädel
('3'/'H' am Kopf konzentriert) vs. dunkleres Körper-Tuch ('d'/'G'
abgedunkelt); kühler Rim bleibt. (b) alle Gegner: 2-Ton-Körperrampe
mit Brust-/Schattenlinie + 1-px-Richtungs-Rim (warm bei
Fackel-Kontext, kühl Freiland). (c) Hund: 'V'-Ridge verstärken,
Beintrennung soweit 2-px-Läufe erlauben (bewusst subtil).
(d) warden/Boss: NICHT anfassen.

### 3.5 Props & HUD-Sprites [REV: reale Liste]

(a) gravestone_4 (gebrochen/schräg) + gravestone_5 (Kreuz), 16×16,
via variants[]; sie erhalten wie die Bestands-Grabsteine GEBACKENE
'n'-Kontaktschatten (Tiles, kein Engine-Schatten [REV]).
(b) GEBACKENE '0'-Schatten ENTFERNEN nur bei: vase, urn,
chest_closed, chest_open (echte Props — Engine-Pass §2.4 übernimmt).
Grabsteine/Zaun: Schatten BLEIBEN. (c) heart_full/heart_empty:
1 px Innen-Highlight. (d) [REV] WEG-SPUREN: path_v4 (2 parallele
1-px-Fahrspur-Linien, leicht gebogen) + path_v5 (Kiesel-Gruppe) als
zusätzliche variants der Weg-Tiles.

### 3.6 Palette — Symbol-Key-Tabelle [REV: 3 Töne, '=' entschärft]

| Key | Zweck | Richtwert |
|---|---|---|
| '=' | Teich-Glanz (gedämpftes Hell-Teal) | ~#3f7a70 (Luma ~100 — NICHT #5aa89c; R3-Entsättigung bleibt gewahrt) |
| '+' | Kronen-Back dunkel 1 | ~#1a2a1b |
| '*' | Kronen-Back dunkel 2 | ~#141f15 |

'%' GESTRICHEN [REV] — Decals nutzen Bestands-Töne (Knochen b/B/N,
Risse k/dunkel), Luma-Patches nutzen die Gras-Rampe. Bestehende Töne
±10 % nachjustierbar (dokumentiert), Wasser-Rampe w/W/9 NICHT.

### 3.7 Neue Tile-Keys (Interface eingefroren)

licht_dither_1/_2 (16×16, sparse helle Texel: ~8-10 bzw. ~16-20 px,
Töne 'V'/'i', unregelmäßig); floor_decal_crack + floor_decal_bones
(16×16, Boss-Boden) [REV]; grass_lumahi/grass_lumalo (16×16,
nahtlose hellere/dunklere Gras-Basis); Rotations-Varianten
grass_tuft_r1/grass_blade_r1/grass_speck_r1 [REV].

### 3.8 [REV] Paket G — Animations-Politur (minimal)

(a) FACKEL: dritter Flammen-Frame torch_2 + torch_wall_2 (3-Frame-
Zyklus via Legenden-anim, animRate wie Bestand, KEIN Engine-Code);
(b) GRAS-SWAY: grass_tuft_f1 + grass_blade_f1 (zweiter Frame, Halme
1 px gebogen), als anim in den Deko-Legendeneinträgen (animRate
langsam ~0.8, animSync false-artig gestaffelt via Bestands-Mechanik —
nur Legende, kein Engine-Code); (c) Teich-Schimmer = §3.1.
Begründung: SoM ist der Juror-Maßstab, CLAUDE.md fordert "mehr
Animationsphasen" — GP4 liefert die billigsten drei Hebel ohne
entities/-Berührung.

## 4. Maps & Legenden (Besitz: Engine-Builder)

Legendeneinträge: 'Y','Z','A' (GRAVEYARD-OVER, span, non-solid);
grass_lumahi/lumalo + Decal-Zeichen (GRAVEYARD/BOSS_KAMMER-Ground,
fringeSource:true/fringeSet:'grass' wo Gras-angrenzend); Deko-Glyphen-
Einträge erhalten anim-Frames (§3.8b); torch-Legenden auf 3-Frame.
Generator .tmp/gen_gfx4.mjs deterministisch; verifyNeutral-Gate für
ALLE rows-Änderungen (Teich: Spezialmodus laut §2.7a).

## 5. Tests — EXAKTER Katalog (sonst NICHTS)

Inline-Annotation: "(erlaubte Alt-Test-Änderung #N, GP4-§5)".

1. **#1 smoke §36:** GOLD.GRAVEYARD.**sol** neu erzeugen (Ursache
   §2.7a; actual aus Testlauf). [REV] GOLD.GRAVEYARD.**geo** wird
   NICHT angefasst — ändert sich geo im Testlauf, ist das ein
   STOPP-SIGNAL (Fackel/Spawn berührt → Umformung korrigieren).
   Hashes der 3 anderen Maps byte-identisch.
2. **#2 smoke §35 Ground-rows-Freeze (Z.1665):** + 'Y','Z','A'.
3. **#3 smoke §35 spanKeys (Z.1632-1635):** + tree_canopy_back_a/_b/_c.
4. **#4 smoke §16 (additiv):** shore_ine/inw/ise/isw,
   licht_dither_1/_2, tree_canopy_back_a/_b/_c, gravestone_4/_5,
   grass_lumahi/grass_lumalo, floor_decal_crack/_bones, torch_2,
   torch_wall_2, grass_tuft_f1, grass_blade_f1, grass_tuft_r1,
   grass_blade_r1, grass_speck_r1, path_v4, path_v5 [REV:
   vollständige Liste — der generische Fänger smoke:517-524 verlangt
   jede Legenden-art ohnehin].
5. **#5 additive NEUE Smoke-Tests:** (a) Konkav-Shore-Emission gegen
   die §2.1-Wahrheitstabelle (synthetische Nachbarschaften → exakte
   Key-Erwartung, inkl. ERSETZUNGS-Fall); (b) litDitherCells-
   Determinismus (Import aus tilemap.js [REV Blocker-Fix]: gleiche
   Args → identische Liste; Stufen-Radien korrekt); (c) Back-Kronen-
   Z-Ordnung (Back-Anker zeichnet vor Front-Anker).
6. trunkCovered (Z.601) und §21-Prefix-Check: NICHT anfassen
   (Back-Keys erfüllen den Prefix automatisch).
7. Flusstests: NULL Änderungen (Whitelist §0.3 + §0.4/§0.5 by design).

## 6. Screenshot-Route + Jury

.tmp/shot_gfx4.py (Vorlage gfx3, Port 8124): g4_01..g4_08 = g3-Szenen
(Kamera identisch) + g4_09_licht_boden.png (Katakomben-Fackel nah:
Lit-Dither + Boden-Glow). Serien: g4_01-Teich a/b/c, g4_04-Kanal
a/b/c, g4_07-Funken a/b/c. PIXEL-DIFF-PFLICHTEN [REV kalibriert]:
Teich >= 1,5 % UND <= 15 % (Unter-Grenze beweist "lebt",
Ober-Grenze beweist "ruhig" — das Beruhigungsziel ist Teil des
Beweises) PLUS Glanz-Nachweis ('='-Texel > 20 im Teich-Crop);
Kanal: Residuum-Verfahren (.tmp/kanal_proof.py); Funken >= 10 %;
Lit-Pass: g4_09-Kegel-Crop vs. fackelfernes Referenz-Crop → > 30
aufgehellte Texel. 0 Konsolen-Fehler.

JURY: 3 direkte Opus-Agenten (nie Workflow-Subagenten), Skala
unverändert, Anker: GP2 ≈ 4,5-5, GP3-Final = 6,5 (Archiv gp3_final/ —
Proof-Agent archiviert die g3_*-Stände VOR dem ersten g4-Render).
bilder_gelesen-Pflichtfeld; bewusste Entscheide im Prompt deklarieren
(Schimmer statt Drift, Wasser-Seite-Schnitt, Tile- vs. Prop-Schatten,
XP-Balken-Wachstum, Lit-Pass nur Stein-Maps). Max. 3 Runden;
Meilenstein-Logik siehe Kopf [REV].

## 7. Datei-Besitz

| Agent | Dateien |
|---|---|
| Engine-Builder | world/tilemap.js, world/maps.js, world/map_bosskammer.js, core/lighting.js, core/particles.js, main.js (NUR §2.2b/§2.4/§2.5-Blöcke), ui/hud.js (§2.6), tools/smoke_test.mjs (NUR Katalog §5), .tmp/gen_gfx4.mjs |
| Art-Builder | art/palette.js, art/sprites.js, eigene Dev-Checks in .tmp/ |
| Integrator | Nicht-Tabu-Dateien beider Builder; Konflikt → Spec gewinnt; prüft KOPPLUNGEN: §2.4+§3.5b (Schatten beidseitig), §2.8+§3.3a (Back-Arts vor §21-Lauf), §2.2+§3.7 (dither-Keys) |
| Proof-Agent | .tmp/shot_gfx4.py, .tmp/screenshots/g4_*, Archiv gp3_final/ |

Interface eingefroren: alle Keys aus §3.7/§3.8, Anker 'Y','Z','A',
Symbol-Töne §3.6, litDitherCells-Signatur §2.2a.

## 8. Abnahme

1. check_syntax grün; Smoke 3× grün (inkl. §5.5-Neutests).
2. Flusstests grün OHNE jede Änderung (git diff belegt).
3. git-diff: nur §7-Dateien; smoke-Änderungen = exakt Katalog §5;
   GOLD-Änderung = NUR GRAVEYARD.sol mit Inline-Annotation.
4. Effekt-Beweise laut §6 (Teich-Fenster 1,5-15 %, Glanz-Texel,
   Kanal-Residuum, Funken, Lit-Texel); 0 Konsolen-Fehler.
5. Notenverlauf dokumentiert; Median >= 8 → Block-Ende-Vermerk.
6. Übergabe, Erkenntnisse in workflows/GRAFIKPASS_4.md, Commit,
   Memory.
