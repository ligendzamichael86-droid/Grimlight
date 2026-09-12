# GP7-CH-2 Phase 0 — Ergebnisse + Rev-2.1-Entscheide (12.09.2026, Fable)

Commit: Phase-0-Commit 12.09.2026 (siehe git log, Folge-Commit von 9bc205e). Basis HEAD 9bc205e
(SPEC_GP7CH2 Rev 2). Ablauf: der Phase-0-Workflow starb zweimal
(Compact/Neustart, kein Paket fertig); auf Michaels Entscheid ("mache es
so") liefen die fuenf Pakete als DIREKTE Opus-Agenten parallel — der
Workflow-Laeufer laesst nur 2 Agenten gleichzeitig zu (ueber alle 8
bisherigen Laeufe gemessen). Alle fuenf Pakete GRUEN, zusammen 61
Abweichungen/Punkte gemeldet; die bindenden Aufloesungen stehen hier.
Wo Zahlen stehen, ERSETZEN sie Rev-2-Schaetzwerte. Die Rohreports
liegen in .tmp/gp7ch2_p0/FABLE_ENTSCHEIDE.md (Planer-Notizen) und den
Paket-Ausgaben (.tmp/gp7ch_p0/, .tmp/gp7ch2_p0/, .tmp/gp7ch2_p0c/,
.tmp/gp7ch2_vorprobe/).

## REV-2.1-ENTSCHEIDE (Fable) — ersetzen widersprechenden Rev-2-Text

### Engine (aus P0.f, Vorprobe im Klon .tmp/gp7ch2_vorprobe/)
R-A1 **Kill-Flash lebt:** Rev 2 E-A1 "Ausschluss state!=='die'" macht
den 4-Frame-Kill-Flash woertlich zur toten Vorschrift (enemies.js:467/
482 setzen hurtTimer UND state='die' im selben Tick; gemessen: toed-
licher Hieb 0 Flash-Frames). BINDEND: der Ausschluss die/dead gilt nur
fuer das AUSWERTEN NEUER FLANKEN (kein Neustart aus eingefrorenen
Timern); ein bereits gesetzter Zaehler zeichnet zu Ende (max 4 Frames,
kann per Konstruktion nicht dauerblitzen). Beleg Variante spur_kill:
skeleton_die_flip 4 Frames, player_die_0 3, danach 0 (naiv: 28/51
Dauerblitzer). Gate Phase 1e: Signal-Draws ueber *_die <= 4 je Kill,
ueber *_decal = 0, im dead-Zustand ab Frame 5 = 0. Der gelieferte
Patch traegt noch die woertliche Fassung — Phase 1e baut spur_kill.
R-A2 **Puls-Implementierung:** 6-Hz-Puls als 24-Hz-Schritt ueber
[0,16, 0,12, 0,08, 0] (ein Zyklus je 1/6 s) akzeptiert; Alphas gate-
konform; Sichtentscheid Jury.
R-A3 **Decals UNTER Weichschatten:** `const noTint` wird vor
drawSoftShadow(player) (main.js:2663) hochgezogen, damit der Decal-
Zeichner vor den Weichschatten laeuft (E-A4 woertlich "unter allen
Renderables"). Diese zusaetzliche Verschiebung im Bestand ist SANKTIO-
NIERT (main.js ist ohnehin im Umfang).
R-A4 **Decal-Kunst:** *_decal ist im Klon provisorisch = *_die; die
E-A4-Auflage (Texel-Diff >=30 % ODER >=2 Zeilen flacher ODER Wert
-20 L) bleibt Zeichner-Gate. hound_die reisst heute beide Decal-Ziele
(41,2 % Rahmen / 7 Zeilen) -> Hund-Decal ist NEUZEICHNUNG (<=4 Zeilen,
Band 8-11), keine Ableitung. Kein warden_decal (§8).
R-A5 **Weltkoordinaten-Beweis = Konserve:** check_main_slice1 steuert
sich aus dem gezeichneten Bild (nearestSkeletonRel liest drawImage-
Namen) und divergiert ohne Blink ab Tick 1378 — kein Engine-Fehler.
BINDEND fuer Phase 1e/V-TESTS: Tastenfolge je Frame einfrieren und in
beiden Staenden abspielen (Werkzeuge .tmp/gp7ch2_vorprobe/sonden/
mk_spur.mjs, mk_konserve.mjs, spur_lauf.mjs; Vorher-Konserve 1530
Frames/82 Ereignisse, konserve_main.json sha256 32bcafd4e8446bf5…; Abspiel
vorher = nachher byte-gleich, Spur-sha256 8786da171f8ef8ad…); inventory/boss direkt
byte-gleich (524/688 Ticks).
R-A6 **Das DORF-Gate MUSS reisen (E-A6 bestaetigt):** Phantom-Zone mit
7 Decals im DORF laeuft durch smoke 825 GRUEN inkl. "S6-§7F(d) …
NULL Gegner" — falsch-gruen belegt (10892 Decal-Draws im DORF).
§5(5) BINDEND: eigener Boot ?god=1 -> GRAVEYARD -> 1 Kill -> Westtor
tileRect(1,12) -> DORF; Gate = 0 Decal-Draws in DORF UND Decal-Zahl
1 -> 0 am Kartenwechsel.
R-A7 **__noTint:** unter window.__noTint blitzt und pulst nichts
(tintDrawImage steigt bei !tintCfg.on aus) — bewusst; Messszenen
(shot_gfx6) zeigen nie einen Flash. Deckel 24 nur mittelbar belegt
(DECAL_MAX=2-Sonde: 1,2,2,2,2); 24 echte Leichen sind auf keiner
Karte erreichbar (max 17 Gegner).
R-A8 **Sanktionszahlen nachgezogen:** §5(2) SYM-Deckel in
check_gfx6_art:84-95 = 17 -> 25 (Bedarf +8, nicht "+<=7"; alnum
bleibt 61, Palette 86). §5(7) shot_gfx6.py:309 = EINE Zeile, ZWEI
Beruehrungen (jetzt +14 CH-1-Zeichen = 64 -> 78 Toene; beim Paletten-
Commit +8 = 86). §5(3) unveraendert (P0.e additiv + Rost-Zeile).
R-A9 **PALETTE +8 ALS VORAB-COMMIT** (neu): VOR Phase 1 traegt der
Engine-Agent die 8 Toene in palette.js ein, hebt SYM_SOLL auf 25,
erweitert shot_gfx6:309 um die 8 Zeichen, gp6_art_self bleibt 6 Rot,
smoke 825 + check_gfx6_art gruen. Damit haben beide Zeichner sofort
alle Toene und palette.js faellt aus dem Mutex.
R-A10 **smoke-Tick-Zeile ist NICHT deterministisch** (Block 25 laeuft
mit echtem Math.random: 7641/7643/7606/7650/7644/7660 in sechs
Laeufen). "smoke x2 identisch" heisst: 825 ok-Zeilen UND alle Zeilen
byte-gleich AUSSER "Simulierte Ticks gesamt".

### Kunst-Gates (aus P0.a Messwerkzeug, P0.c Horden-Bogen)
R-B1 **Innenraum-Zielzahlen BINDEND** (Rampenmittel der Innenflaeche
ohne k/n; ersetzt die Rev-2-Schaetzungen): Skelett 139,6..146,7 (IST
190,3) / Ghul 112,6..121,3 (IST 103,0) / Rost 102,4..121,4 (IST 137,7)
/ Hund 88,7..104,6 (IST 78,8) / Warden 140,7..143,9 (IST 149,6).
Empfindlichkeit je umgefaerbtem Innen-Schwarztexel: Skelett -0,89 /
Ghul -0,37 / Hund -0,22 / Rost -0,39 / Warden -0,04 L.
R-B2 **Minderheitskriterium vorzeichenbehaftet** (Figur muss HELLER
sein; Betragslesart waere No-op). Befund vorher: Grufthund auf dem
GRAVEYARD-Weg ROT (dL -15,4/-15,7, dE00 6,4/5,6, Rim 0). Aufloesung:
nach Phase 1 ueber den dE00-Zweig (Petrol gegen Erde/Weg z p v M P V
= 29,38 >= 20). Zeichner-A-Auflage: der Hund muss auf dem Weg ueber
FARBE lesen, Wert allein reicht nicht.
R-B3 **Ziel-Kopf-Schulter-Profile EINGEFROREN** (oberste 6 belegte
Zeilen, Hund 3; Suche ueber vollstaendige Pools, Seed 20260912):
Skelett [4,4,6,6,9,10] (IST [8,10,10,10,10,8], 21 Texel) / Ghul
[8,10,11,11,11,14] (IST [6,9,11,11,11,10], 7) / Rost [2,2,4,9,14,18]
(IST [5,7,7,9,9,8], 26) / Hund [4,9,13] (unveraendert) / Warden
[2,6,12,16,19,20] fest. Zielpaare: Sk/Gh 60,00, Sk/Ro 60,00, Gh/Ro
58,33, Sk/Hu 54,76, Ro/Hu 53,06, Gh/Hu 40,00 (Gate 65 / 55 Familie).
Warden-Paare Ro/Wa 65,33, Gh/Wa 64,71, Sk/Wa 48,05, Hu/Wa 34,67
(ausgenommen).
R-B4 **Halbseiten-Gate (E-B5):** shield_side/_up/_down sind AUSGENOMMEN
(Requisit mit gewolltem Seitenlicht, 23,5 L). *_die BLEIBEN im Gate
(werden geflippt gezeichnet, Flip-Indizes 8/11/17/20): skeleton_die
-20,4 und ghoul_die +16,8 sind Kunstarbeit Phase 1, kein Messfehler.
R-B5 **E-B6 ERRATUM:** im Band L601 80..95 ist das Maximum 10,36
(L90) .. 11,71 (L95), nicht "10,7..11,7". >=12 ist erst ab L601 98
moeglich. DEKLARIERT (Praezedenz CH-1 9,04): Hund innerhalb der
Rampe dE00 6,49 statt >=8 (erschoepfend bewiesen ueber alle 960
Fenster-Zellen; Trennung ueber L601-Schritte 13,0/18,6 — Zeichner
setzt Hund-Stufen als WERT-Stufen, nie zwei Nachbarstufen ohne
Zwischenzeile); Hund Hue-Spanne 19,17 statt >=20 (das Rev-2-Fenster
war exakt 20 breit — Spec-Fehler; kein Rim nur um die Zahl zu retten);
'"' gegen Held-X 10,45 statt 12 (CH-1 V6; kalt-dunkel unerreichbar,
Trennung Wert+Familie+Ort); '/' gegen Ghul-Bestand H 10,28 statt 12
(dL 17,9 — das Skelett-Licht 154,1 ist DUNKLER als der Ghul-Akzent H
172,0; Trennung ueber Familie + Ort: der Ghul fuehrt H nur als Schaedel-
Akzent, nie als Flaeche, die Figur-Mittel liegen in getrennten Baendern).
R-B6 **Horden-Bogen-Gates (E-B10) korrigiert:** (a) Zweitgate
"mittlere |dL| benachbarter Koerper-L >=15" GESTRICHEN — mit der
E-B1-Wertleiter arithmetisch unvereinbar (Skelett allein ins Fenster
-> 13,89; volle Leiter mit Hund+Rost im DUNKEL-Band -> ~10). Ersatz:
E-B1-Baender + Trenn-Rate + E-B2. (b) Trenn-Raten-GATE haengt an
TAFEL B (Knaeuel, 73 Material-Kanten): >=80 %; Tafel A (18 Kanten,
5,6 Punkte je Kante) nur informativ >= vorher. (c) Gate IMMER am
schalterlosen Lauf; --rim/--flash/--grau sind Vorschau (--rim macht
das Gate ohne Kunst gruen und vergroessert den Nenner). Echte Rim-
Texel '|' in den Grids zaehlen als Material. (d) "benachbart" =
Bildnachbarn (beruehrende Paare verschiedenen Typs), informativ.
(e) dE00>=20-Zweig trennt am IST nichts — bleibt (wird wirksam, sobald
Petrol/Knochen/Lumpen neben Rost stehen). Tafel B enthaelt weder Hund
noch Warden (Roster 5 Sk/5 Gh/5 Ro/5 Sk, eingefroren): das Gate misst
die drei Aufrechten, die sich heute verwechseln; Hund und Warden trennen
sich ueber Familie (Vierbeiner/Gross) und laufen auf Tafel A informativ.
R-B7 **Anker-Lesarten:** Spiegel-Gate rechnet auf der Teil-A-
Silhouetten-Lesart (opaker Spiegelplatz; <=65); Ton-Lesarten laufen
ohne Gate mit. Solitaer-Anker = Landkarte C H7 (8/8 exakt; Teil A 1.2
nicht reproduzierbar). Leitklassen ueber den Legenden-Kunstschluessel
(bindend; Variantenlesart nur informativ). Warden-Rim-Anker 12,5 %
ist Requisit-Artefakt (C in der Klinge) — echter Warden-Rim 0 ->
Rim '|' ist Kunstarbeit (Nachzug Zeichner A).
R-B8 **Groesster Hebel des Passes:** Schwarz k+n je Typ 52,9 (Skelett)
/ 44,2 (Ghul) / 49,3 (Hund, eigene 30-%-Ausnahme gerissen) / 54,6
(Rost) / 28,1 (Warden) %; Konturtoene 1 bei allen; Rim 0 bei allen
(Ghul-Basis 12,9); Spiegel >92 % bei allen; Frame-Diff 1 Zeilenband
bei allen. Vorher-Bilanz: Figuren gruen 0/6, Gates 11/63.

### Umfang + Palette (aus P0.b)
R-C1 **Die 8 Toene sind gebunden** (Tabelle unten, toene_ch2.json
sha256 831356c5…). Skelett-Schatten '"' liegt ERZWUNGEN bei hue 287,8
/ L601 88,2 statt 250..270 / ~105: der kalte Sektor 250..270 hat im
gesamten Bereich L601 70..122 keine Zelle mit min-dE00 >= 9,5 (C, @,
[, L, f, D, i belegen ihn); >=10 gibt es kalt nur bei L601 85..94,
hue 283..289. Zeichner-Auflage Skelett: >=65 % Lichtstufe '/' im
Innenraum (Rechnung 0,10/0,25/0,65 = 139,95 im bindenden Band
139,6..146,7; bei 60 % nur 138,45 = unter der Untergrenze), '"' nur als Kanten-/
Rippenschatten, nie flaechig. Ghul: 2 neue Stufen + Bestand 'd' als
dunkelste (84,2/119,5/142,0, Verhaeltnis 1,57; 'O' verworfen: gegen
GY-Weg P nur dE00 5,56). Hund: 3 Petrol-Stufen 92,1/105,2/123,8, hue
195,5..214,6, C*ab 28,0..29,1, dE00 zu Corm-Wolle 10,09, zu t/T/L/D
18,75. Selbstauflage C*ab <= 30,0 (E3-Decke 30,5).
R-C2 **Palette-Bilanz nach CH-2:** 86 Toene = 61 alnum + 25 Symbole
(3 alt + 14 CH-1 + 8 CH-2). Kollisionsnachweis: 435 Grids / 214.912
Texel, 5 Kartenlegenden in 4 world-Dateien (Symbole # , - . = ~), alle Guards generisch, keine
RegExp-Klasse ueber Palettenschluessel; keines der 8 Zeichen ist in
einer Zeichenklasse Metazeichen. Regel: Palettenschluessel im JS
immer einfach gequotet ('"', '`'), im JSON escapt nur ".
R-C3 **Referenz (E-C6):** nur der schalterlose Kanon + Squint-Blind-
Satz werden eingefroren; --rim/--flash/--grau nicht. Tafel C hat 6
Zellen (5 Gegner in Roster-Reihenfolge + Held als Massstab), nicht
nach Koerper-L sortiert, damit Vorher/Nachher deckungsgleich liegen.
Tafel B benutzt den eingefrorenen 5er-Kachelsatz (Prototyp hatte 3);
Tafel A ist byte-identisch zum Prototyp-PNG. Der Prototyp-RNG ist
woertlich inkl. 2^53-Quirk uebernommen (Positionen eingefroren).
R-C4 **ERRATUM design/GP7CH1_PHASE0.md:** die Tabelle "Die 14 neuen
Toene" ist NICHT der Auslieferungsstand — die Cast-Jury-Runde 10.09.
rechnete 7 Toene neu (palette.js:361-380 ist die Wahrheit): & #005356,
( #1d6862, ) #4d7468, : #83564c, ; #b0725f, ? #b0998b, % #ae7189.
Corm liegt bei L601 58,5/80,9/103,0 (statt 98,1/123,3/146,3). Alle
CH-2-Rechnungen laufen gegen die lebende palette.js.

### Prozess
R-P1 Workflow-Laeufer = max 2 Agenten gleichzeitig; fuer echt
parallele Pakete DIREKTE Agenten (Ports je Agent zuweisen, Rueckgabe-
format '## OK / ## REPORT / ## ABWEICHUNGEN', IDs sofort sichern).
R-P2 Menschen-Anker (CH-1) sind am HEAD 26/27 rot, weil die CH-1-Kunst
seit 75106c7 wuchs — mit `--vorher-zeiger 75106c7` 27/27 gruen. Kein
Befund, Werkzeug-Doku.

## GEBUNDENE ZAHLEN AUS PHASE 0

### Die 8 neuen Toene (P0.b, .tmp/gp7ch2_p0/toene_ch2.json)

| Zeichen | Hex | L601 | C*ab | Hue | Rolle | Rampe | min dE00 (Partner) |
|---|---|---|---|---|---|---|---|
| " | #4b5686 | 88,18 | 29,64 | 287,82 | Schatten (kalt) | SKELETT-KNOCHEN | 10,45 (X) |
| $ | #8c7671 | 124,01 | 9,71 | 37,60 | Mitte | SKELETT-KNOCHEN | 11,90 (S) |
| / | #ae9a66 | 154,05 | 29,99 | 90,15 | Licht (warm) | SKELETT-KNOCHEN | 10,17 (V) |
| < | #737b71 | 119,47 | 6,69 | 138,48 | Lumpen mittel | GHUL-LUMPEN (+d) | 10,77 (=) |
| > | #7f968c | 141,98 | 10,52 | 166,01 | Lumpen hell | GHUL-LUMPEN (+d) | 13,97 (B) |
| { | #008190 | 92,14 | 29,12 | 214,62 | Fell dunkel | HUND-PETROL | 10,10 (=) |
| } | #268685 | 105,18 | 27,99 | 195,46 | Fell mittel | HUND-PETROL | 10,09 ()) |
| Backtick | #3a9897 | 123,78 | 28,43 | 195,70 | Fell licht | HUND-PETROL | 10,05 (]) |

Rampen innen: Skelett 25,47/47,11/21,54 (L-Schritte 35,8/30,0, Verh.
1,19, Hue-Drehung 162°); Ghul d/</> 18,10/27,36/10,46 (Verh. 1,57,
Hue 58°); Hund 6,67/10,43/6,49 (DEKLARIERT, Verh. 1,43, Hue 19,17°).
Zwischen Rampen: Sk/Gh 17,11, Sk/Hu 25,51, Gh/Hu 12,79 (alle >=12).
Sperrlisten-Minima: Corm 24,09/11,46/10,09; Katakomben t/T/L/D
13,89/13,92/18,75; Held u/U/X/^/Z 10,45/24,60/23,36; Mile @/[/]
16,87/14,09/10,05; Knochen O/B/b/N 10,42/11,03/24,41; Rost 4/5/6
19,16/28,46/42,47. Reserve je Ziel-L (globales Maximum min-dE00,
C*ab<30,45): L85 10,70 / L90 10,36 / L95 11,71 / L100 12,20 / L110
12,79 / L120 13,14 / L130 13,77 / L140 15,22 / L150 15,72 / L154 15,86.
Hund-Fenster (hue 195..215, C 24..30) nutzbar nur L601 89..127,
Maximum 12,78 bei L109.

### Leitklassen + E1-Fenster (P0.a, gegner_e1fenster_vorher.json — BINDEND)

| Karte | Leitklasse | Anteil begehbar | L-Spanne | Fenster (maxL+25 .. minL+90) |
|---|---|---|---|---|
| GRAVEYARD | GY-Gras (grass_*+dirt_patch*) | 85,41 % | 47,0..56,3 | 81,3..137,0 |
| CATACOMBS | Gruft-Stein (stone_floor*) | 99,44 % | 52,5..53,0 | 78,0..142,5 |
| FLUESTERGRUFT | Gruft-Stein | 85,47 % | | 77,5..142,5 |
| BOSS_KAMMER | Gruft-Stein | 96,43 % | | 77,5..142,5 |

Wirkorte: Skelett 21 Spawns/4 Karten (inkl. 4 Boss-Adds), Ghul 8/2,
Hund 7/3, Rost 4/2, Warden 1/1. Wertleiter (E-B1): DUNKEL 85..100
(Hund, Rost) / MITTEL 105..113 (Ghul) / HELL 120..126 (Skelett) /
GROSS 131..134 (Warden).

### Vorher-Tabelle Gegner (P0.a, gegner_messung_vorher.json, HEAD 9bc205e)

| Gate | Skelett | Ghul | Grufthund | Rostpanzer | Warden | Schild |
|---|---|---|---|---|---|---|
| G1 Schwarz k+n max % (<=25/30) | 52,94 ROT | 44,23 ROT | 49,33 ROT | 54,55 ROT | 28,10 ROT | 40,68 ROT |
| G2 Konturtoene >=8 Tx (>=3) | 1 ROT | 1 ROT | 1 ROT | 1 ROT | 1 (ausgesetzt) | 1 ROT |
| G3 Rim/Kontur min % (>=12) | 0,00 ROT | 3,85 ROT (Basis 12,86) | 0,00 ROT | 0,00 ROT | 0,00 (idle 12,50 = Requisit) | 0,00 ROT |
| G4 Halbseiten max abs dL (<=6,5) | 20,38 ROT (die) | 16,84 ROT (die) | 7,46 ROT (down) | 5,29 gruen | 41,98 ROT | (ausgenommen, 23,48) |
| G5 Spiegel Teil-A max % (<=65) | 96,08 ROT | 98,08 ROT | 92,79 ROT | 96,97 ROT | 94,70 (ausgesetzt) | 100,00 ROT |
| G6 Solitaer bereinigt % (<=8) | 18,75 ROT | 9,25 ROT | 21,52 ROT | 32,30 ROT | 14,91 (ausgesetzt) | 0,00 gruen |
| G7 Materialflaechen (3/1,6/55/20°) | ROT (Knochen) | ROT (Lumpen, Schaedel) | ROT (Fell) | ROT (Knochen, Rost) | ROT (4 Flaechen) | ROT (Platte) |
| G8 Koerper-L E5 | 162,56 ROT (Ziel 120..126) | 96,17 ROT (Ziel 105..113) | 75,55 ROT (Ziel 85..100) | 112,85 ROT (Ziel 85..100) | 139,21 ROT (Ziel 131..134) | 89,32 gruen |
| G9 Minderheiten Weg/Wasser | gruen | gruen | ROT (Weg dL -15,4) | gruen | gruen | gruen |
| G10 Frame-Diff (Silh >=8 % UND >=2 Baender) | 6,0 %/1 ROT | 6,9 %/1 ROT | 18,0 %/1 ROT | 9,0 %/1 ROT | 15,0 %/1 ROT | — |
| G11 Sperrliste | gruen | g 20,09 % ROT | Erdrampe 53,95 % ROT | b 17,54 % ROT | b 29,63 % ROT | gruen |

Paar-Gates vorher: Profil ganze Figur <=60 ROT (Gh/Ro 78,9, Sk/Ro
67,7, Sk/Hu 60,1); Kopf-Schulter <=65 ROT (Sk/Gh 86,9, Sk/Ro 80,4,
Gh/Ro 77,6); Wertleiter >=5 L gruen (Hund 75,6 < Ghul 96,2 < Rost
112,8 < Warden 139,2 < Skelett 162,6). Frame-Diff-Untergrenzen (Texel/
Silhouette, ab jetzt >=IST): Skelett 8,96/5,97 %, Ghul 12,32/6,90,
Hund 28,83/18,02 (telegraph/leap/down mitgemessen), Rost 17,98/8,99,
Warden 15,03/15,03. Sehnen-Zensus (Diagonalketten/Einzeltexel):
Skelett 26/10, Ghul 17/14, Hund 23/58, Rost 44/29, Warden 311/239.

### Horden-Bogen Vorher-Anker (P0.c, horden_bogen_vorher_messung.json)

| Tafel | Schwarz-Sprenkel | Ueberlapp | Trenn-Rate NEU | Kanten | mdL Leiter | mdL Bild | Decal-Boden | Flaeche |
|---|---|---|---|---|---|---|---|---|
| A Feld (30) | 37,58 % | 50,0 % | 44,44 % (informativ) | 18 | 20,92 | 64,78 | — | 8,18 % |
| B Knaeuel (20) | 39,60 % | 100,0 % | 78,08 % (GATE >=80) | 73 | 33,37 | 45,10 | — | 23,06 % |
| C Leiter (5+Held) | 31,09 % | 0 | n/a | 0 | 20,92 | n/a | — | 15,32 % |
| D Schlachtfeld (10+30) | 34,86 % | 20,0 % | n/a | 0 | 20,92 | 28,13 | 2,90 % (Obergrenze) | 3,36 % |

mdL Leiter 20,92 = Frame-0-Lesart (skeleton_0 163,74 / ghoul_0 97,00 /
hound_0 80,05 / rust_0 114,52 / warden_idle 135,60); G8 rechnet ueber
ALLE Grids. Trenn-Ursachen vorher: ausschliesslich |dL|>=25 (A 8, B 57), 0x Rim,
0x dE00. Schwarz je Typ: Rost 44,94 / Hund 40,54 / Ghul 37,93 /
Skelett 37,31 / Warden 24,24 %. Gras- und Gruft-Werte identisch
(Figur-Messung bodenunabhaengig). Squint-Trennbarkeit misst NUR der
Juror (40 Blind-Kacheln + Aufloesung; Aufloesung fuer den Juror TABU).

### Engine-Vorprobe (P0.f) — Beweise, die Phase 1e reproduzieren muss

Patch .tmp/gp7ch2_vorprobe/PATCH_flash_decal.diff (441 Zeilen, 5
Dateien: main.js +213/-3, sprites_figuren.js +88 (4 *_decal-Keys am
Ende, keine Flips), enemies.js -1, boss.js -2, player.js -4; git apply
--directory=game/js gruen gegen 9bc205e). Klon-Suiten vorher/nachher:
engineB_gp6 GRUEN/GRUEN, main 25/25, inventory 25/25, boss 33/33,
smoke 825/825. Canvases boot 472 -> 632 (+4 Decal +156 Signal = 78 x
{flash, kalt}), alle unter `boot` -> gate-frei. Draw-Verlust Spieler
[30,31,30,60] -> [0,0,0,0], Skelett [6] -> [0]. Zeichenstapel
ORIGINAL -> TINTMASKE 0,08 -> SIGNAL 0,8; Signal-Alphas {0,08: 66,
0,12: 73, 0,16: 70, 0,8: 19}; Flash-Laeufe [3,3,3,3,3,3,1]. Signal-
Draws ueber *_die/*_decal: 0 (naiv 79). Decal-Zahl an Uebergaengen
1 -> 0 (CATACOMBS), 0 -> 0, Respawn 0 -> 0; Phantom-Zone 7/17
(Review B2 reproduziert). Timer-Zuweisungen entities vorher = nachher
(alle Zahlen gleich). Flip-Liste main.js:106-128 byte-gleich.

### Masstabelle (P0.e, .tmp/check_gfx6_art.mjs, Marker GP7CH2)

144 Zeilen additiv vor console.log/process.exit (0 Minus-Zeilen).
Gates: skeleton_* 16x16 (>=3 Keys), hound_* 16x12 (>=6), ghoul_*
16x20 (>=3), warden_* 24x32 (>=9), rust_0/_1/_die gleich gross und
aus {16x18, 20x18} (Rost-Commit ersetzt ERLAUBT durch [[20,18]] =
zweite Beruehrung §5(3)), *_decal: Breite = Basisgrid, Hoehe <=
min(6, floor(0,4*Basis), Hund 4), unbekannte Familie rot.
Negativkontrolle 6 Faelle gruen/rot wie gefordert. INFO-Zeile:
"skeleton 3/3 @ 16x16 | hound 6/6 @ 16x12 | ghoul 3/3 @ 16x20 |
warden 9/9 @ 24x32 | rust 16x18 (Uebergang) | decals 0".

### Werkzeuge + Aufrufe

```
node .tmp/gp7ch_p0/figuren_messung.mjs --beides        # Menschen + Gegner
node .tmp/gp7ch_p0/figuren_messung.mjs --vorher --vorher-zeiger 75106c7
node .tmp/gp7ch_p0/figuren_messung.mjs --material-gegner <pfad.json>
node tools/figuren_bogen.mjs --modus vorher|nachher --out <dir>
node tools/horden_bogen.mjs --etikett vorher|nachher --out <dir> [--squintblind] [--rim] [--flash] [--grau] [--tafel A|B|C|D] [--boden gruft|gras] [--nurmessen]
   Erfolg: "HORDEN-BOGEN FERTIG"; Fehler: "FEHLER:" (Exit-Codes nie glauben)
node .tmp/check_gfx6_art.mjs                            # inkl. GP7CH2-Masstabelle
python3 .tmp/shot_gfx6.py                               # Regex :309 sieht 78 Toene
```
figuren_messung.mjs 4723 Zeilen (sha256 3951ac27…), Menschen-Ausgaben
byte-gleich zum Stand davor; figuren_bogen.mjs Rev 3 (503 Zeilen, 9
Menschen-PNG byte-gleich, +Gruft-Boden, +Gegner-Bogen 27 Grids);
horden_bogen.mjs 1017 Zeilen, deterministisch (67 Dateien x2 byte-
gleich), Tafel A byte-identisch zum Prototyp.

### Referenz (P0.d, design/referenz/gp7ch2/, 94 Dateien, 2,4 MB)

Inhalt: 24 Figuren-PNG (Menschen + Gegner-Bogen je gras/lehm/weg/gruft
x 1x/6x/squint) + Legende, 24 Horden-Tafeln (A-D x gruft/gras x 1x/6x/
squint) + Mess-JSON + Legende, 40 Squint-Blind-Kacheln + Aufloesung
(fuer den Juror TABU), vorher_messung.json (559 kB, Horden-Messung +
sechs P0.a-JSONs mit Quell-sha256), README.md (Anordnung, Reproduktion,
sha256 jeder Datei). Determinismus: zweiter Lauf 92/92 byte-gleich;
Tafeln/Blind/JSON/Legende byte-gleich zum P0.c-Kanon; Menschen-PNG
byte-gleich zum Rev-2-Lauf desselben Kunst-Stands. 21 CH-1-Dateien
direkt in design/referenz/ unberuehrt (sha-Listen vorher/nachher
identisch). Provenienz beider Boegen = Kunst-Stand 9bc205e
(sprites_figuren.js 729e6885…, palette.js f89ff2e3…).

R-D1 **CH-1-Nachher-Beleg zeigt nicht den freigegebenen Cast** (P0.d-
Befund, von V-P0 korrigiert): design/referenz/figuren_bogen_nachher_*
(versioniert mit 3853dda, 10.09. 21:00) traegt die Provenienz
sprites_figuren.js aee65951… / palette.js c7a7dd51… = exakt der
Commit adc8c0a1 ("Phase 1b NPCs Versuch 2", 10.09. 15:48). Danach
kamen 9c01e14 (Mile), 2ccf0da (Cast-Jury-Palette, 7 Toene), f3302d5
(Bran/Hedda), 9ef18ee (Korrektur) — der Bogen ist also ein aelterer,
committeter Zwischenstand, nicht der abgenommene Cast. ENTSCHEID: die
CH-1-Dateien bleiben unangetastet (E-C6); der HEAD-Stand der Menschen
ist in gp7ch2/figuren_bogen_vorher_{gras,lehm,weg,gruft}_* eingefroren
und gilt ab jetzt als CH-1-Nachher-Beleg AM HEAD und CH-2-Vorher-Beleg
zugleich. Lehre fuer Uebergaben: Referenz-Boegen zuletzt rendern, aus
sauberem Baum, mit Commit-Hash in der Legende.

### V-P0 (adversarial, 12.09.) — Ergebnis + Aufloesungen

Urteil: Werkzeuge, Rohdaten, Referenz und Vorprobe-Patch sachlich in
Ordnung und reproduzierbar (Suiten: smoke 2x 825 mit genau der Tick-
Zeile als einziger Differenz, Flusstests 25/25/33, gfx6 GRUEN inkl.
Masstabelle, save 63, probe_god/s4 GRUEN, builderA 106, engineB GRUEN,
gp6_art_self 6 Rot; eigene CIEDE2000-Nachrechnung aller 8 Toene und
des 250..270-Sektors ueber den vollen sRGB-Raum (Maximum 9,349 —
Zwang echt); Stichproben Koerper-L 162,5609 / Kopf-Schulter 86,8852 /
Halbseite +0,3679 von Hand; Determinismus 67/67 + 25/25 byte-gleich;
Patch git apply --check gruen, Suiten im Worktree gruen, eigene
Phantom-Sonde 1 -> 0; Trenn-Rate-Definition per Negativkontrolle
belegt: ohne k/n-Ausschluss 441 Kanten/66,0 % statt 73/78,1 %).
ROT waren 10 Dokumentationsfehler (R1-R10), alle in dieser Fassung
behoben: sechs Zahlen der Ton-Tabelle/Sperrlisten (aus einem aelteren
P0.b-Lauf uebernommen), mdL-Bild-Rundungen, Zeilenzahl 4723, "5
Legenden" statt 8, Frame-Diff-IST 8,96, die Provenienz-Behauptung
zum CH-1-Bogen (R-D1 neu), und die GP7CH2-Marker in check_gfx6_art
umschliessen jetzt den ganzen Block inkl. Kopfkommentar (143 Zeilen
zwischen den Markern + eine Leerzeile davor = 144 Zusatzzeilen).

Restpunkte (P1-P15), bindend aufgeloest:
P1 CH-1-Bogen veraltet -> R-D1 (kein Neu-Rendern in place).
P2 Tafel B ohne Hund/Warden -> R-B6(e) neu gefasst (Gate = die drei
Aufrechten; Hund/Warden ueber Familie, Tafel A informativ).
P3 "<=55 in Familie" ist in CH-2 leer (alle 5 Familien haben ein
Mitglied, matrix.familie_gleich = false bei allen 10 Paaren): gilt
erst wieder im Kampf-Slice (Fussvolk/Varianten). Deklariert.
P4 Rost-Zielprofil [2,2,4,9,14,18] vs E-B9-Landezone: Ziel-Profile
sind VORSCHLAEGE der Suche, das Gate bleibt <=65 je Paar. E-B9
praezisiert: Schild-Landezone = Spalten 13-18, Zeilen 6-15 (unterhalb
des Kopf-Schulter-Bands); im Band Zeilen 0-5 darf die Schulter bis
Spalte 18 reichen; "Ausladung 0-2/17-19" gilt nur oberhalb Zeile 6.
Zeichner B entscheidet die Form, misst gegen <=65 und Landezone.
P5 Skelett-Auflage auf >=65 % '/' korrigiert (R-C1).
P6 Hund-Beispielmischung 104,614 liegt 0,035 ueber dem bindenden Band
104,579: die P0.b-Mischung ist nicht bindend, das Band R-B1 ist es;
Zeichner A misst mit dem Werkzeug (innen_ohne_kn_L), nicht per Hand.
P7 Vorzeichen '/' vs H -> R-B5 neu formuliert.
P8 Beruehrungen check_gfx6_art gesamt DREI: (1) P0.e-Block additiv,
(2) §5(2) SYM-Deckel 17 -> 25 im Paletten-Vorab-Commit R-A9, (3) Rost-
Zeile ERLAUBT -> [[20,18]] im Rost-Commit. §5(3) zaehlt (1)+(3),
§5(2) ist (2). Sonst nichts an dieser Datei.
P9 sha256 8786da17… = Weltkoordinaten-Spur, Konserve = 32bcafd4… (R-A5).
P10 "Respawn 8" nicht belegt -> gestrichen (7/17 belegt).
P11 Werkzeug-Log zeigt bei G3 den Basisgrid-Wert (12,857) und urteilt
richtig auf dem Minimum (3,85): Anzeige-Schoenheitsfehler, kein Gate-
Fehler; Nachzug im Werkzeug erlaubt (kein Gate wird veraendert).
P12 Zwei Koerper-L-Lesarten -> im Horden-Abschnitt ausgewiesen.
P13 Erratum GP7CH1_PHASE0.md: Zeilenangabe korrigiert (447-478).
P14 BLINDTEST-HYGIENE: Der Squint-Juror muss ein FRISCHER Agent sein,
der weder horden_blind_vorher_aufloesung.txt noch die Legenden/JSONs
noch einen Pruefer-Report im Kontext hat; er bekommt AUSSCHLIESSLICH
die 40 PNG-Pfade. Fable hat die Aufloesung nicht gelesen und liest sie
nicht. Wird sie einem Juror bekannt, Blindsatz mit neuem Seed ziehen.
P15 Alle vier Warden-Paare in R-B3 genannt.
