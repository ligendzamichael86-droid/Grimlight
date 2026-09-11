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
