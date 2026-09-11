# SPEC GP7-CH-2 — "Die Horde wird lesbar" (Rev 1, 11.09.2026, Fable)

Grundlage: GP7CH2_LANDKARTE.md (V1-V13 BINDEND) + Teil A (E5-Messung,
Engine) + Teil C (Zielbild, Steckbriefe, Horden-Bogen). Praezedenz:
SPEC_GP7CH1.md Rev 2.3 (G-A..G-N), GP7CH1_ANKER_HELD.md (10 Erbregeln
gelten fuer JEDEN Gegner — alle werden gespiegelt gezeichnet).
Deliverable: 5 Gegner neu (Skelett, Grufthund, Rostpanzer 20x18,
Ghul; Warden nachgezogen) + Fussvolk (Grids ohne Spawn) + FLASH statt
Blink + zweistufiges Sterben mit Decals + Horden-Bogen als Beweis —
auf Michaels Geraet in der Fluestergruft (15 Gegner) sichtbar.
SPIELDYNAMIK BLEIBT: kein Timer, kein Zustand, keine Zahl der Kampf-
logik aendert sich (Beweisplan §6).

## §0 EISERNE REGELN
0.1 Koerper-L = E5-Lesart (Teil A 1.1); Landkarte-C-Zahlen sind KEINE
Anker. Anker = Teil A 1.2/7.2 (E5 gemessen, HEAD 3853dda).
0.2 *_die-Keys behalten Namen UND Position (Flip-Indizes 8/11/17/20
eingefroren; smoke:5669 zaehlt sie). Neue SPRITES-Keys NUR ans Ende;
neue Flip-Eintraege NUR hinter npc_torwaechter_talk (Index 36).
0.3 AABB unantastbar (smoke:3336-3341, main.js:2559 BIG-Schwelle).
Grid-Masse: Rost 20x18 erlaubt (gate-frei), Ghul 16x20 + Warden 24x32
FEST, Skelett 16x16 / Hund 16x12 FEST (Groessenleiter V8).
0.4 ghoul_0 behaelt 'C' (check_gfx6_art:200). Bestandsrampen O/B/b/N,
u/U/X, 4/5/6 werden NICHT im Hex veraendert (CH-1-Kopplung).
0.5 Flash-Canvases EAGER nach dem TILE_ART-Bau (main.js:130), NIE lazy;
gezeichnet nach den Tint-Masken; Sprite-Alpha nie < 1 (check_engineB).
0.6 DIE_TIME 0,4 / Boss 1,0, dieTimer, spawnDeathDrops, events,
enemies.splice: BYTE-GLEICH. Decal-Code lebt nur in main.js.
0.7 Suiten-Kanon wie CH-1 (Smoke 825+, Flusstests 25/25/33, gfx6,
check_save 63, probe_god, probe_s4_engine, builderA 106, engineB_gp6
GRUEN, gp6_art_self 6 Rot [+1 bei Symbol-Deckel = 7, deklariert]).
0.8 Art-first (Rev 2.2 M1): DIREKTE Zeichner, Render 6x/12x + Read je
Schleife, >=3 Schleifen je Figur; Zahlen sind Leitplanken, "liest als
DIESER Gegner bei 1x und 6x" ist das Gate; Horden-Bogen nach jeder
Figur; Konflikt Bild vs Zahl -> melden.

## §1 MESSZIELE (eingefroren; Werkzeuge §2)
Je Gegner-Grid: Schwarz k+n <= 25 % (Grufthund <= 30, deklariert);
>= 3 Konturtoene >= 8 Texel (ohne Requisit); Rim >= 12 % der Kontur,
FLIP-NEUTRAL (Seitenframes |dL links-rechts| <= 6,5 L — Skelett auch
M3-relevant, Grenze 8,2); bbox-Spiegelgleichheit <= 65 %; Solitaer
<= 8 % (ohne Requisit/Merkmal, Material-Tabelle Pflicht, Merkmal-
Deckel 12/Grid); Materialflaeche >= 40 Texel: >= 3 Stufen, Schritt
<= 1,6, kein Ton > 55 %, Hue-Spanne >= 20 Grad; Koerper-L im
V2-Fenster + Wertstufe: Hund 90..100, Rost 85..100, Ghul 105..117,
Fussvolk 105..117, Skelett 118..126, Warden 128..134 — Abstand
benachbarter Stufen >= 5 L, Familie+Stufe nie beide gleich;
Minderheitsklassen-Kriterium V2 (dL>=10 ODER dE00>=20 ODER Rim>=12).
Sperrliste (E6-Aequivalent): Hund != Erde z/p/v/P/V; Ghul != Stein g;
Skelett != bones/floor_decal_bones-dominant; Rost/Warden Knochen b
nur <= 10 % (Rippenlinie). Profil (E5, fussbuendig): ganze Figur <= 60
familienuebergreifend; Kopf-Schulter-Zone (oberste 6 Zeilen) <= 55
JEDES Paar. Frame-Diff-Untergrenzen = IST (Teil A 7.2: Skelett 12/8,
Ghul 25/14, Hund 32/20, Rost 32/16, Warden 66/66); Paare ungleich.
Decal: <= 25 % Rahmen, <= 6 Zeilen. HORDEN-BOGEN (Tafeln A-D, Gruft-
Stein + Gras, 1x/6x/Squint): Schwarz-Sprenkel-Anteil <= 25 %; Trenn-
Rate im Ueberlapp >= 80 %; Squint-Trennbarkeit >= 5/6 bei 1x, 6/6
bei 6x (Juror); Wertleiter 3 Stufen >= 5 L; Decal-Bodenbedeckung
<= 12 % nach 30 Toden. ENGINE: Silhouetten-Verlust-Frames je Treffer
= 0 (Gegner + Spieler, headless zaehlbar); Decal-Gates (V7).
Positiv-/Negativkontrolle: Werkzeug reproduziert die Teil-A-Anker.

## §2 PHASE 0 (je eigener Commit)
P0.a Werkzeug-Erweiterung figuren_messung.mjs (V10; Anker neu nach E5).
P0.b Paletten-Rechner: bis zu 7 neue Symbol-Toene (Kandidaten " $ /
< > { } — Kollisionsnachweis gegen ALLE Grids/Legenden/Format-Guards/
Grid-Literale, ' \ . ausgeschlossen) + x/f/_/| aus Bestand; Zuteilung
Skelett-Knochen 3 / Ghul-Lumpen 2 / Hund-Kalt 2; Auflagen E3 (dE00
>= 10 zu allen 78, >= 8 in Rampe, >= 12 zwischen Rampen, C*ab < 30,5)
+ Wertstufen aus §1. Sanktion §5.
P0.c tools/horden_bogen.mjs (aus .tmp/gp7ch_ch2_sonde/horde.mjs +
knaeuel.mjs; Tafeln A-D, Schalter Rim/Flash/Grau, deterministisch)
+ figuren_bogen um Gruft-Stein-Boden + Gegner-Zeilen.
P0.d REFERENZ: Figuren-Bogen (Gegner) + Horden-Bogen VORHER nach
design/referenz/ versioniert — Phase 1 startet nicht ohne.
P0.e Additive Gegner-Masstabelle in check_gfx6_art (skeleton 16x16,
hound 16x12, rust 20x18 nach Umbau [Uebergangs-Regel: Gate erst mit
dem Rost-Commit scharf], ghoul 16x20 bestehend, fussvolk 16x14,
*_decal-Masse), Marker GP7CH2.
P0.f Engine-Vorprobe (kein Spielcode-Commit): Machbarkeitsprobe, dass
ein eager Flash-Canvas nach tiles-Bau check_engineB_gp6 gruen laesst
(Sonde im Scratch mit Kopie von main.js) — bevor §4 baut.

## §3 PHASE 1 ART (zwei DIREKTE Zeichner, Mutex wie 1b)
A: Skelett (Platz 1) -> Grufthund (Platz 2) -> Warden nachziehen (Rim,
Kante, Sekundaerbewegung; Koerper-L 128..134). B: Rostpanzer 20x18
(inkl. shield_*-Overlays) -> Ghul -> Fussvolk. Steckbriefe Teil C §2
vertieft (bindend, mit V3-Korrektur beim Hund) + Anker-Regeln.
Je Figur: Material-Tabelle (rim/requisit/merkmal), 3 Varianten als
Tauschschluessel-Definition (JSON, keine Grids), Decal-Grid *_decal
(Hund NEU flach; Skelett/Ghul/Rost aus *_die ableiten, <= 25 %/6 Z.),
Frame-Diffs >= IST, flip-neutrales Licht (Skelett: M3!). Horden-Bogen
nach jeder Figur rendern + ansehen.

## §4 PHASE 1e ENGINE (ein direkter Agent, parallel zu §3)
Flash (V6) + Decal-Liste (V7) in main.js; entities/-Eingriff EXAKT
die drei return-Blinkzeilen; Spieler-Unverwundbarkeit = 2-Frame-Flash
+ Flash-Masken-Puls 6 Hz Alpha 0..0,35 (nie Sprite-Alpha); sword_slash/
npc_blase/NPCs blitzen nie; Zeichenreihenfolge Original->Kalt->Warm->
Flash. Beweisplan: statisch (Rueckgabewerte ungelesen, keine Timer-
Schreibstelle) + dynamisch (Suiten-Zahlen unveraendert, Positions-
folgen der Flusstests byte-gleich, DIE_TIME-Anker gruen, check_boss:
253 Null-Frame-Toleranz) + neue additive Gates (§5).

## §5 SANKTIONS-KATALOG (abschliessend, Marker GP7CH2)
(1) entities/enemies.js:620 + boss.js:323-324 + player.js:228-231:
NUR die Sichtbarkeits-return-Zeilen des Blinks (erste sanktionierte
entities-Oeffnung seit Slice 3 — je genau eine Zeile; Hund-Aufsteh-
Blink :621-624 BLEIBT). (2) check_gfx6_art SYM-Deckel (+<=7 Zeichen);
(3) check_gfx6_art additiv: Gegner-Masstabelle (P0.e); (4) gp6_art_
self erwartete Rot 6 -> 7 (deklariert); (5) ADDITIVE Gates in smoke:
Silhouetten-Verlust 0 (Gegner+Spieler), Decal-Reinheit (kein Event/
keine Mutation), Decals nach buildWorld = 0 (DORF-Gate bleibt gruen),
Deckel 24, *_decal-Positivkontrolle, Frame-Diff-Untergrenzen Gegner.
(6) NICHTS SONST: keine Flusstests, kein Golden, keine AABB.

## §6 PRUEFUNG
V-TESTS: Suiten x2; git-Umfang; Werkzeug-Gates aller Gegner +
Horden-Bogen-Zahlen unabhaengig nachgemessen; Realmessung shot_gfx6
m3,m4,m5 (skeleton_0 ist M3-Messfigur! dWarm>=18, K3>=6, ausgebrannt
0, Bild-M5 >= 8) + Bestandskarten-M1 g6_01-05 (neue Gegner im Bild;
Decals: Messhygiene — keine Tode in Messszenen) + DORF d1-d6 unver-
aendert; Spielprobe headless: Treffer -> Flash sichtbar, 0 Verlust-
frames; Tod -> *_die dann *_decal; Kartenwechsel -> 0 Decals; Boss-
Adds-Pfad; check_boss 33 gruen. V-SPEC (Bild): Steckbrief-Treue je
Gegner, Squint-Trennbarkeit am Horden-Bogen, "eine Hand" mit dem
Menschen-Cast, Flip-Neutralitaet, Stilregeln.

## §7 JURY + ABNAHME + UEBERGABE
Cast-Juror (direkt, PNG): Figuren-Bogen Gegner vorher/nachher +
Horden-Bogen Tafeln A-D; Note je Gegner + Horde. Danach APK auf 8125
und MICHAEL (finale Instanz): "?god=1 in die Fluestergruft, lass dich
von allen verfolgen: (1) erkennst du auf einen Blick, welche Sorte wo
steht? (2) fuehlt sich Draufhauen jetzt nach etwas an, oder flackert
es nur?" >= 2 Iterationsrunden budgetiert. Uebergabe + Memory + Slice-
6-Abnahmefrage (Menschen + Dorf + Gegner) neu stellen.

## §8 DEKLARATIONEN
Rost ortsgetrennt exklusiv (V5); Warden traegt u/U/X (Bestand, CH-4);
questKillBeobachter zaehlt Boss-Adds als 'skeleton' in BOSS_KAMMER
(latent, Q1 GRAVEYARD-gebunden — NICHT gefixt, Dynamik); Hund-Aufsteh-
Blink bleibt (Telegraph); Warden ohne Decal; Fussvolk ohne CREATORS/
Spawn/Flip (Slice 7); Groessenleiter eingefroren; Diablo-Silhouetten-
Kollaps im Lichtsystem = CH-4-Backlog; Perf-Schatten-Bake = Kampf-
Slice; Grufthund Schwarz <= 30 (vier Laeufe); 2-Frame-Zusammensacken
NICHT in CH-2 (waere Drawer-Aenderung enemies.js:618) — *_die-Pose
wird nur besser gezeichnet.

# REV 2 (11.09.2026, Fable) — ALLE 10 BLOCKER / 25 MAJOR / 25 MINOR EINGEARBEITET

Quelle: design/GP7CH2_SPEC_REVIEW.md (beide Linsen; Fix-Formulierungen
BINDEND, gelten woertlich wo hier nur der Entscheid steht). Rev 1
bleibt Grundlage; die folgenden Entscheide ERSETZEN widersprechenden
Rev-1-Text. Verifizierte Bauwege (Flash eager, eigene Decal-Keys,
DIE_TIME byte-gleich, Rigs gruen) bleiben.

## E-A ENGINE (Linse 1 B1/B2/B4, M1/M3/M4/M7, m1/m2/m5/m11/m12; Linse 2 M13/M16/m3/m6)
E-A1 FLASH-QUELLE = FLANKEN-ZAEHLER in main.js (WeakMap je Entity, im
ZEICHENPFAD dekrementiert, nie im Update-Zweig): Flanke hurtTimer/
invulnTimer 0->>0 setzt 3 Frames (4 beim Kill). NIE `hurtTimer>0`
direkt (Timer frieren im die/dead-Zweig ein — Leichen wuerden
dauerblitzen). Ausschluesse woertlich: Gegner state!=='die', Spieler
state!=='dead'. Sanktion: enemies.js:620 (1 Zeile), boss.js:324
(1 Zeile), player.js:229-231 (ein dreizeiliger if-Block) — sonst
nichts; Hund-Aufsteh-Blink :621-624 bleibt.
E-A2 FLASH-MASKE GEOMETRISCH: Kontur-Texel (E5: opak mit >=1 trans-
parentem 4er-Nachbarn oder Rahmenkante) -> '.', NICHT Tonfilter k/n
(der brennt Held-Umriss 47 % weiss und laesst Loecher). Ton #fff8ea
(L 248,5; >=12 L ueber JEDEM hellsten Koerperton, auch N 232,9).
Zeichenreihenfolge Original->Kalt->Warm->Flash; eager nach main.js:131.
E-A3 UNVERWUNDBARKEIT = eigene Vokabel: KALTE Maske (|-Familie
#abdcda) im 6-Hz-Puls, Alpha nur diskret {0, 0,08, 0,12, 0,16}; warm
= getroffen, kalt = geschuetzt. P0.f prueft beide Masken.
E-A4 DECALS: buildWorld raeumt `decals` UND `lebendeVorFrame` in
derselben Zeile; Frame-Diff NUR im else-Zweig direkt hinter
updateEnemies (main.js:2079), nie ueber eine buildWorld-Grenze.
KEINE Flip-Keys fuer Decals (Leiche hat keine Blickrichtung; bei
Bedarf aus *_die_flip einfrieren) — Rig smoke:6396-6408 bleibt
unangetastet. Decal-Draw setzt tintCfg.flash=0 explizit, respektiert
window.__noTint, wird vor den Renderables gezeichnet; deklariert:
Leichen behalten das Licht ihres Todesmoments (CH-4-Revision).
*_decal unterscheidet sich MESSBAR von *_die (Texel-Diff >=30 % ODER
>=2 Zeilen flacher ODER Wertabsenkung >=20 L). Uebergang lebend->
*_die ist ein bewusster Ein-Frame-Schnitt (HITSTOP_K kaschiert).
E-A5 DYNAMIK-BEWEIS: Gleichheit der WELTKOORDINATEN je Tick (player/
enemies x,y aus Scratch-Sonde) — nicht der playerScreen()-Folge (die
aendert sich absichtlich: Draw-Verlust 90->0). Additives Quelltext-
Gate (Muster smoke:5294-5300): Flash-/Decal-Block enthaelt keine
Zuweisung an hurtTimer|invulnTimer|dieTimer|hitstop|DIE_TIME;
entities-Dateien behalten die Zuweisungszahl. Silhouetten-Verlust-
Gate zaehlt nur Frames innerhalb hurtTimer>0 / invulnTimer>0.
E-A6 Gate "Decals nach buildWorld = 0" MUSS von einer Kampfkarte MIT
Kill nach DORF reisen (S6-Boot startet in DORF — waere falsch-gruen).
E-A7 gp6_art_self bleibt bei 6 Rot (Symbolzeile seit CH-1 rot). Neue
Sanktion §5(7): .tmp/shot_gfx6.py:309 Palettenregex um Symboltoene
(misst sonst in einer 64-Ton-Welt); §5(3) = ZWEI Beruehrungen von
check_gfx6_art (P0.e additiv "rust aus {16x18,20x18}", Rost-Commit
verschaerft auf 20x18). main.js:131 (nicht 130).

## E-B KUNST-GATES (Linse 1 B3/M2/M5/M8, m3/m4/m8/m9; Linse 2 B1/B2/B5/M1-M3/M5/M6/M14/M15/M17, m4/m5/m7/m10-m12)
E-B1 LEITKLASSEN nach V2 WOERTLICH (>=80 % der BEGEHBAREN Zellen):
GRAVEYARD = grass_*+dirt_patch* (85,4 %, L 47,0..56,3); CAT/FG/BOSS =
stone_floor* (L 52,5). ALLES andere (Weg 11,6 %, water_v 14 %, bones,
skull, stairs, floor_decal_*) = Minderheitsklasse. FENSTER (dL 25..90):
Skelett/Hund 81,3..137,0; Ghul/Rost 78,0..142,5; Warden 77,5..142,5.
WERTLEITER (Baender >=5 L getrennt): DUNKEL 85..100 (Hund, Rost) /
MITTEL 105..113 (Ghul) / HELL 120..126 (Skelett) / GROSS 131..134
(Warden). Koerper-L ist INNENRAUM-Groesse (E5, Kontur raus): P0.a
gibt je Figur das Rampen-Mittel der Innenflaeche ohne k/n als
Zeichner-Zielzahl aus (Skelett ~138..148, Hund ~95..108, Rost
~92..108, Ghul ~108..122).
E-B2 MINDERHEITS-KRITERIUM (Weg/Wasser): dL>=10 ODER dE00>=20 ODER
(Rim>=12 % UND dL >= VORHER+15). P0.a weist dL/dE00 gegen Weg und
Wasser je Gegner separat aus; Rot ist deklarationspflichtig (G-J).
E-B3 PROFIL: FUSSBUENDIGE E5-Lesart (Teil C 0.3; Teil-A-Matrix ist
KEIN Anker; P0.a reproduziert Teil C: 59,7/78,9/86,9/80,4/80,0/77,6).
Ganze Figur <=60 fuer JEDES Gegner-Paar (auch innerfamiliaer);
Fallback <=70 nur mit Nicht-Profil-Differenzierer am Squint-Bogen
(G-K-Muster). Kopf-Schulter = oberste 6 BELEGTE Zeilen (Hund: 3):
<=65 jedes Paar, <=55 innerhalb einer Familie; Warden-Paare ausge-
nommen (Eichkoerper). Paarmenge = die 5 Gegner untereinander (nicht
gegen Menschen). P0.a rechnet Ziel-Kopf-Schulter-Profile VOR und
friert sie als Steckbriefzeile ein.
E-B4 FAMILIEN (eingefroren): AUFRECHT-SCHMAL Skelett / AUFRECHT-
MASSIG Ghul / AUFRECHT-BREIT Rostpanzer (20x18) / VIERBEINER Hund /
GROSS Warden. Familie+Wertstufe nie beide gleich.
E-B5 FLIP-NEUTRAL gilt fuer JEDES Gegner-Grid (alle werden gespiegelt,
enemies.js:634-641): Halbseiten-L-Differenz <=6,5 L; Skelett M3-hart
<=8,2. Rechenhilfe: ein Rampenschritt auf 9 Texeln = ~4 L Halbseite.
E-B6 dE00 ZWISCHEN RAMPEN: im Band L601 80..95 ist >=12 arithmetisch
unerreichbar (Maximum 10,7..11,7) -> dort gilt >=10 zu allen 78 UND
>=8 innerhalb UND dokumentierte Nicht-Farb-Trennung (Familie +
Wertstufe + Rim). P0.b rechnet die Reserve je Ziel-L VOR.
E-B7 WALK: Silhouetten-Diff >=8 % UND Aenderung in >=2 getrennten
Zeilenbaendern (heute Fuss-only) — zusaetzlich >=IST als Untergrenze;
gilt fuer JEDES Posenpaar (P0.a misst hound_telegraph/leap/down und
Warden-Grids nach).
E-B8 Sekundaerstrukturen (Sehnen, Rippen, Nieten) >=2 Texel in einer
Richtung; 1-px-Diagonalen zaehlen als Solitaer; Merkmal-Deckel nur
Augen/Glut/Glanz namentlich. Umriss-Ersetzung deklariert: Gate =
Schwarz k+n <=25 % (Hund <=30), nicht E5-Umriss/opak.
E-B9 Rost/Warden Rim = '|' (b hat L 203,3 = '_' — im Grau unsichtbar).
Rost 20x18: Schild-Landezone Spalten 13-18/Zeilen 4-15 bleibt zurueck-
gesetzt; Ausladung in Spalten 0-2/17-19; Silhouetten-Nachweis in
Seitenansicht MIT gezeichnetem Schild. Hund-Decal <=4 Zeilen, Band
8-11. Decal allgemein <=6 Zeilen UND <=40 % der Basisgrid-Hoehe;
Rahmen-% aufs eigene *_decal-Grid.
E-B10 HORDEN-BOGEN-GATES: Trenn-Rate NEU = Grenzkanten nur zwischen
MATERIAL-Texeln (k/n raus), getrennt bei Rim ODER |dL|>=25 ODER
dE00>=20, Anker in P0.c neu gemessen (Teil-C-0 % ungueltig); Zweit-
gate mittlere |dL| benachbarter Koerper-L >=15. Szenen-Schwarz <=26 %
als KENNZAHL (gewichtetes Mittel; Hund-Ausnahme mitgerechnet). Decal-
Bodenbedeckung: Gate GESTRICHEN (physisch max 3,75 %) -> Kennzahl
<=4 % + Sichtpruefung "Schlachtfeld, nicht Teppich". SQUINT BLIND:
Juror (nicht Zeichner) bekommt die Squint-Kacheln ohne Legende in
Zufallsreihenfolge, Treffer nur bei Farbe UND Graustufe; Ziel 1x
>=4/5, 6x 5/5.

## E-C UMFANG + PALETTE (Linse 2 B3/B4/B6/M12, m13; Linse 1 m7/m10)
E-C1 FUSSVOLK GESTRICHEN aus CH-2 (Backlog Kampf-Slice: eigene Rampe
+ Spawn dort). Grund: keine freie Bestandsrampe im Fenster ausser den
CH-1-Menschenrampen (wuerde als Bran/Mile lesen) und kein Tonbudget.
E-C2 VARIANTEN GESTRICHEN aus CH-2 (Backlog Kampf-Slice) — kein
Budget, kein Gate, kein Bild. Elite-Overlay-Ideen bleiben Notiz.
E-C3 PALETTE: x (Trank/Herz, C*ab 64) und f (fog_blob 234 Texel,
GRAVEYARD fog:true, dE00 3,9 zu D) sind GESPERRT. Bedarf: Skelett-
Knochen 3 + Ghul-Lumpen 2 + Hund 3 = 8 neue Symbol-Toene. Kandidaten
" $ / < > { } (7, kollisionsfrei: einfach gequotete Grid-Literale,
Legenden nur # . , = ~ -, Guards generisch) + `  (Backtick, mit
Nachweis) = 8. Auflagen E3 + E-B6. JSON-Deliverables escapen `"`;
nie RegExp-Zeichenklassen ueber Palettenschluessel.
E-C4 SPERRLISTE ERGAENZT: kein Gegner fuehrt eine CH-1-Menschenrampe
(!/%/G, &/(/), :/;/?, @/[/]) als dominante Flaeche; Hund zusaetzlich
!= t/T/L/D (Katakomben-Stein) und != &/(/) (Corm) im Hex — Hund =
KALT-GESAETTIGT Petrol hue 195..215, C*ab 24..30, EIGENE 3 Toene,
ortsgetrennt zu Corm (DORF) deklariert; "kalt-neutral" entfaellt
(existiert bei L 90..100 nicht). Blutakzente ueber r/R, nie x.
E-C5 WARDEN = dritte Vollfigur des Passes? NEIN — Ausnahmeliste
(deklariert): Rim flip-neutral '|' >=12 %, lueckenlose Kante, Sekun-
daerbewegung Stoff, Koerper-L 131..134 (b-Anteil senken); AUSGESETZT
fuer den Warden: Spiegelgleichheit, Solitaer, Konturtoene-Zahl
(Eichkoerper, 9 Grids). Skelett/Ghul/Rost/Hund = Vollfiguren.
E-C6 Referenz-Boegen nach design/referenz/gp7ch2/ (CH-1-Dateien bleiben).
Horden-Bogen VORHER eingefroren: seed 12345, Roster 12 Skelett/8 Ghul/
5 Hund/4 Rost/1 Warden, Kachelsatz stone_floor+_v1/_v2/_v3+_cracked
Formel (tx*7+ty*11)%n, 320x180, Y-Sort y+aabb.h, Frame 0, Schatten wie
Prototyp; Tafel C vorher/nachher 5-spaltig; sha256 je PNG.

## E-D ABNAHME (Linse 2 M10)
Michael-Auftrag NEU: "?god=1 durch die Fluestergruft bis zur Schluessel-
kammer UND durch die Katakomben (3 Rost, keine Eliten): (1) sag mir bei
JEDEM Gegner, den du siehst, welche Sorte das ist, BEVOR du drauf bist;
(2) fuehlt sich Draufhauen jetzt nach etwas an, oder flackert es nur?"
Deklariert: die 30er-Horde ist am Geraet nicht herstellbar (max 6-7
gleichzeitig sichtbar) — ihr Beleg ist der Horden-Bogen.
