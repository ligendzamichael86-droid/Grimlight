# SPEC GP7-CH-1 — "Die Menschen bekommen Kleider und Gesichter" (Rev 2, 16.08.2026, Fable)

REV 2 = Rev 1 (69f4948) + design/GP7CH1_SPEC_REVIEW.md (BEIDE
Linsen; 7 BLOCKER / 25 MAJOR / ~18 MINOR — ALLE eingearbeitet,
die Fix-Formulierungen der Pruefer sind BINDEND und gelten
woertlich, wo dieser Text nur den Entscheid nennt). Grundlagen:
GP7CH_LANDKARTE.md (V1-V6, V3/V5/V6 unveraendert) + Teile A/B/C.

## DIE REV-2-ENTSCHEIDE (ersetzen Rev-1-Text)

E1 **dL-KONTRAST (Blocker beider Linsen):** dL 25..90 gilt gegen
die Leitkacheln der BODEN-KLASSE des Wirkorts (nicht jede Kachel
des Spiels); Umriss- und Rim-Texel sind aus der Koerpermittelung
ausgenommen; ERSATZKLAUSEL: dL<25 gilt als bestanden, wenn
dE00(Koerper,Kachel)>=25 (der Held liest heute schon ueber
Farbton — die Metrik muss das sehen koennen). Je Figur wird das
zulaessige Koerper-L-Fenster in PHASE 0 AUSGERECHNET und als
Zahlen eingefroren (Baender aus Review: GY-Gras 88..137,
DORF-Lehm 100..159, Weg 117..181, Gruft-Stein 85..127 — je Figur
geschnitten nach ihrem Wirkort). WEG-PFLICHTPRUEFUNG fuer ALLE
(M17: der HELD hat auf dem Weg dL -12 — schlechter als der
"Grufthund-Skandal" — und wird in CH-1 MITBEHANDELT; Standkacheln
aus map_dorf.js:266-270 sind der Beleg). REIHENFOLGE ZWINGEND
(M14): dL-Ziele festlegen -> M3-Realmessung -> Art; faellt
ausgebrannt>0, gibt das HELD-dL-Ziel nach, nie die M3-Schwelle.

E2 **TUEREN (Blocker beider Linsen — der Rev-1-Weg wirft in
tilemap.js:752/900 und ueber KEINER der 7 Tueren steht freie
Wand):** Tueren werden ZWEI KACHELN BREIT statt doppelt hoch
(Referenz-Zitat Teil C 4.1). Umsetzung: 4 neue 16x16-Keys
dorf_tuer_zu_l/_r + dorf_tuer_offen_l/_r (TILE_ART ans ENDE),
2 neue Legendenzeichen solid:true, 7 Ein-Zeichen-Aenderungen in
DORF_ROWS bei denen AUSSCHLIESSLICH solide Wandzeichen durch
solide Tuerhaelften ersetzt werden -> Soliditaets-RASTER
byte-gleich (S6-§7F(c)-Golden bleibt gruen — Beweis Pflicht),
geo unberuehrt. Beide Haelften zeichnen Sturzbogen+Schwelle so,
dass die sichtbaren ~11 px (Traufe verdeckt den Rest — gemessen)
als Torbogen lesen. Die 16x32-Masstabellen-Sanktion ENTFAELLT
ersatzlos. Ein echter Hoch-Span ist als eigener Welt-Pass
deklariert, kein Nebenauftrag.

E3 **PALETTE +14 (Blocker: 8 deckte die Steckbriefe nicht):**
feste Zuteilung G-Rampe 2 (Schatten dreht WARM Richtung Braunrot
15..30 Grad — der kuehle Sektor gehoert dem Helden; M12-Beweis:
kuehl laesst nur 4,7 % Kandidaten, alle hart an U) / Corm-Wolle 3
/ Bran-Leder 3 (Bran verlaesst Rost — Rost bleibt EXKLUSIV beim
Torwaechter, M9) / Mile-Kittel 3 (eigene Familie; nicht Krapp
[Heddas Alleinstellung], nicht Gruen [Gras-Sperrliste]) /
Held-Zwischenstufe X..Z 1 (Schrittverhaeltnis 1,75 -> <=1,6) /
Rim-Toene 2 (deklarierte Ausnahme von Stilregel 10). Auflagen
(M11): dE00>=10 zu ALLEN 64 Bestandstoenen, >=8 innerhalb einer
neuen Rampe, >=12 zwischen neuen Rampen, >=12 zu u/U/X/Z;
C*ab<30,5. Zeichen: 14 aus dem bewiesen kollisionsfreien Satz
! % & ( ) : ; ? @ [ ] ^ _ | (m3). KEINE Paletten-L-Regel gegen
das M1-Band (M13 Kategorienfehler) — stattdessen Realmessungs-
Pflicht nach dem Umbau (M1 56..69, E1>=0,64, L<16<=2,0).

E4 **STILBIBEL-SANKTION (Blocker B4):** design/ART_DIRECTION.md
wird im GP7CH-Rahmen an DREI Stellen neu gefasst (Marker GP7CH,
Wortlaut = Pruefer-Fix): Regel 2 "LUECKENLOSE Silhouettenkante
mit selektivem Kantenton (k Schattenseite, dunkelster Materialton
Lichtseite, Rim obere Lichtkante; Aussetzen zu transparent NICHT
erlaubt)"; Regel 4 "warm als MATERIAL erlaubt, warmes LEUCHTEN
(o/y/1) bleibt Feuer/Gold/Klingenreflex" (deckt sich mit §9.M1);
Regel 10 + Rim-Ausnahme.

E5 **MESSZIEL-DEFINITIONEN (M5-M8, m21 — alle Formeln fix):**
KONTUR = opake Texel mit >=1 transparentem 4er-Nachbarn oder
Rahmenkante. UMRISS-ANTEIL = |Kontur|/|opak| <= 25 %;
UMRISSTOENE = Toene auf der Kontur mit >=8 Texeln, OHNE
Requisitentoene (Klinge/Speer/Stock), Ziel >=3.
SPIEGELGLEICHHEIT um die BBOX-Mittelachse der opaken Texel
(Anker: Corm 47,9 / Bran 84,2 / Held-down 26,0), Ziel <=65 —
Defekt sitzt bei Bran/Mile/Torwaechter. PROFILAEHNLICHKEIT =
100*(1 - Sum|a_i-b_i| / Sum max(a_i,b_i)) ueber zeilenindizierte
Breitenprofile, Held-Referenz player_down_0, Ziel paarweise <=70;
P0.d rechnet Ziel-Breitenbaender je Figur VOR und friert sie ein
(m23: machbar, verlangt Massenspreizung 151..242 Texel).
MATERIALFLAECHEN via MATERIAL-TABELLE des Art-Agenten (Figur ->
Material -> Tonmenge, Deliverable-Pflicht; P0.d liest sie).
KOERPER-L = Mittel der opaken Nicht-Kontur-Nicht-Rim-Texel ueber
ALLE Grids der Figur (m21-Eindeutigkeit). RIM >=12 % DER KONTUR
(Rim-Texel liegen AUF oder 1 innerhalb der Kontur — zaehlen);
Rim in CH-1 STATISCH oben-links (M7; seite-Kopplung = CH-4).
TALK-ECHT >=6 % Texel-Diff MIT Silhouettenaenderung ist CH-1-GATE
in §3 (M12; die 5 Talk-Grids zaehlen zum Umfang). Positiv-/
Negativkontrolle: P0.d reproduziert die Anker ALLER sechs Figuren
aus dem Review (nicht nur zwei).

E6 **SPERRLISTE NAMENTLICH (M4/M8/M9/m4):** verbotene dominante
Rampen je Figur: Bran Holz+Erde; Corm Stein(g/s/S)+Erde; Hedda
Erde; Mile Erde+Knochen(O/B/b); Torwaechter Erde+Palisade (Rost
ERLAUBT und exklusiv); Held: keine Boden-Leitrampe seines
Wirkorts (alle Karten). ZUSATZREGEL: keine zwei Menschen teilen
dieselbe dominante Rampe; verwandte Rampen brauchen dE00>=15
der Leittoene.

E7 **BESTANDSSCHUTZ PRAEZISIERT:** §0.3 neu: das Node-M5-Gate
(smoke:3336-3392) ist BEWIESEN art-invariant solange die AABB
12x14 bleibt (M9-Tests: volldeckendes Ersatz-Grid aendert keinen
Wert) — die relevante Grenze ist das BILD-M5 aus shot_gfx6.py
(texel 10 vs Soll 8, Marge 2). §0.4 neu (M10): Aufruf
python3 .tmp/shot_gfx6.py mit Teillauf-Schalter m3,m4; venv
.tmp/venv braucht pip install playwright (Binaries liegen in
~/.cache/ms-playwright); eigener Server Port 8124 (nie 8123),
danach beenden; Szenen: GRAVEYARD mit player_down_0+skeleton_0;
IST-ANKER: dWarm 66,53 (min 18), K3-Tint 11,02 (min 6),
ausgebrannt 0, M4 V(Kopf) 0,529 (0,45..0,85), voll_lesbar 100
(min 25); voll_silhouette 265 vs Referenz 275 ist WARNUNG ohne
Gate (deklariert — eine umgebaute Silhouette darf sie ausloesen).

E8 **SANKTIONS-KATALOG NEU (abschliessend, Marker GP7CH):**
(1) check_gfx6_art.mjs:74-79 Symbol-Deckel '=+*' -> +14 Zeichen
(inkl. Kommentarzeilen :5/:14, m2); (2) ART_DIRECTION.md Regeln
2/4/10 (E4); (3) check_gfx6_art ADDITIV: alle /^(player|npc)_/-
Keys ausser npc_blase sind 16 breit / 24 hoch (M18);
(4) DEKLARIERT-TOT zusaetzlich: .tmp/check_gfx4_art.mjs (heute
schon rot, Beleg '='-Ton; M19); (5) check_gp6_art_self: erwartete
Rot-Zahl 5 -> 6 (Zeile :26 sym-Deckel kippt durch E3; namentlich
deklariert, M11-Tests). SONST NICHTS — insbesondere KEINE
Masstabellen-Zeile (E2) und kein Flusstest.

E9 **UMFANG + TOPOLOGIE (m5/m6/m24):** Phase 1 wird geteilt:
1a HELD (17 player_-Grids + 3 sword_slash_-Grids — die Klinge
gehoert zum Helden; m6) -> 1b NPCs (15 npc_-Grids inkl. der 5
ECHTEN Talk-Frames; gleiche Datei, seriell nach 1a) -> 1c
parallel zu 1a/1b: TUEREN (sprites_tiles.js + map_dorf.js E2)
+ PALETTEN-ANWENDUNG. shield_* gehoert dem ROSTPANZER und ist
CH-2 (deklariert, niemand "repariert es mit"). npc_blase-Anker:
Kopfoberkante bleibt in Grid-Zeile 0/1 jeder Figur (m6), sonst
schwebt die Questblase. FLIP-DEKLARATION (m7): Mile-Tasche und
Torwaechter-Speer wechseln beim Linkslauf die Seite —
AKZEPTIERT wie das Helden-Schild (Bestandsverhalten).

E10 **PHASE 0 NEU (P0.a-e, je eigener Commit):**
P0.a Split (V2, Fassade, sha256-Beweis der Key-Reihenfolge; m10).
P0.b Paletten-Rechner nach E3.
P0.c FIGUREN-BOGEN: reiner Node-PNG-Dump OHNE Browser (m8;
Muster .tmp/png.mjs + gp7ch_probe/render.mjs), ECHTE Kacheln
grass_g5_00 (L49,9) / dorf_lehm_00 (72,8) / path (90,9),
Reihenfolge Held down/up/side dann Bran/Hedda/Corm/Mile/
Torwaechter je 0/1/talk, Squint via Nearest-Neighbour 50 %,
Dateischema figuren_bogen_<vorher|nachher>_<boden>_<1x|6x|squint>
.png (M16).
P0.d Messwerkzeug nach E5 mit Kontrollpflicht.
P0.e REFERENZ-BOGEN (M15): VOR Phase 1 gegen die HEUTIGEN Grids,
Ausgabe VERSIONIERT nach design/referenz/ (nicht .tmp!), eigener
Commit — Phase 1 startet NICHT ohne diese Datei; Nachher-Bogen
mit identischer Anordnung.

## UNVERAENDERT AUS REV 1
Steckbriefe Teil C §2 (mit E3/E6-Anpassungen: Bran-Leder eigene
Rampe, Mile-Kittel eigene Familie), Suiten-Kanon §0.2 (+
check_boss_slice3 namentlich als dritter Flusstest, m9),
Jury/Abnahme §5 (2 Juroren + Michael-Geraetefrage, >=2
Iterationsrunden budgetiert), V3-Ausstiegs-Gate, Bau nur Opus,
Exit-Codes nie glauben, Port 8123 tabu.

## REV 2.2 (22.08.2026, Fable) — METHODENWECHSEL NACH VERSUCH 1

Versuch 1 (Branch gp7ch1-versuch1) wurde von V-TESTS+V-SPEC ABGELEHNT:
Held +45,4 L aufgehellt (verboten), Held-Animation zerstoert
(Laufframe-Diff 43->6 Texel, Angriffspose 135->20), Umriss bei 6/6
schlechter, Bran/Hedda/Corm lesen nicht als Menschen (Sack/Amphore/
Zelt). Ursache: Workflow-Agenten konnten ihre Renders NICHT als Bild
lesen und optimierten blind gegen Zahlen-Gates (Goodhart).
Fundament+Sanktion waren sauber und sind auf main (Commit oben).

BINDEND AB VERSUCH 2:
M1 ART-FIRST: Zeichner laufen als DIREKTE Agenten mit Bild-
   Selbstkontrolle (render 6x -> Read -> korrigieren, >= 3 interne
   Schleifen je Figur; Vergleich gegen design/referenz/-Vorher).
   PRIMAERES GATE = "liest als Mensch bei 1x UND 6x" + Steckbrief-
   Treue (Bild-Juror). Zahlen-Gates sind LEITPLANKEN danach;
   Konflikt Lesbarkeit vs. Zahl -> MELDEN, nie erzwingen.
M2 NEUE HARTE LEITPLANKEN (Untergrenzen aus dem Vorher-Stand):
   Held Koerper-L bleibt 78,8 +- 8 (dE00-Pfad NUR ueber Hue/
   Saettigung, nie Helligkeit); Frame-Diffs >= VORHER (Walk-Paar
   >= 43 Texel, Attack vs Stand >= 135, side/down >= 161);
   Frame-Paare ungleich (Bestandsgate); jede Figur behaelt
   erkennbare Arme, Schultern, Requisit.
M3 MESSWERKZEUG-FIX PFLICHT vor der Gate-Auswertung: RIMTOENE aus
   der Material-Tabelle (nicht hartcodiert), Solitaer-Prozent ohne
   Rundung, Anker-Modus vorher/nachher, Corm-Messszene (d6 Kapelle
   (21,6)) in der Realmessung.
M4 REIHENFOLGE: Held (1 Agent, direkt) -> Bild-Juror -> Iteration;
   danach NPCs mit dem Held als Stilanker; Versuch-1-Stand von Mile/
   Torwaechter darf als Ausgangspunkt dienen (lasen als Figuren).

## REV 2.3 (22.08.2026, Fable) — GATE-AUFLOESUNGEN NACH HELD-VERSUCH 2

Held-Versuch 2 (art-first, 10 Bild-Schleifen, alle M2-Leitplanken
gruen, Animation lebendiger) belegt arithmetisch vier Gate-Konflikte.
Aufloesung (bindend, KEIN stilles Schwellen-Basteln — jede Aenderung
hat einen gemessenen Grund):
G-A **dE00>=25 fuer den Helden ist an seiner L-Lage UNERREICHBAR**
    (Werkzeug-E1-Tabelle: max 21,9 auf Lehm; Gras/Gruft nie unter
    C*ab<30,5). Der einzige Weg waere der +48-L-Sprung, den PHASE0
    verbietet. ENTSCHEID: Held-Bodentrennung = Rim >=12 % (ist 15,4)
    + geschlossene Silhouettenkante + dE00 >= VORHER je Klasse (kein
    Rueckschritt). dE00>=25 bleibt NPC-Gate (ihre L-Fenster sind
    breit genug).
G-B **Umriss-Anteil (geometrisch) fuer den Helden:** der noetige
    Beinspalt (Laufanimation = harte M2-Untergrenze) + der vom
    Steckbrief verlangte lesbare Schwertgriff sperren <=25 %
    (Minimum rechnerisch 24,9 % nur bei geschlossenen Beinen).
    ENTSCHEID: fuer FIGUREN MIT LAUFANIMATION gilt die TON-Lesart:
    Schwarz-Anteil k+n <= 28 % (ist 26,8, vorher 35,2) UND >= 3
    Umrisstoene (ist 3). NPCs (ohne Laufzyklus in CH-1) behalten
    das geometrische <=25 %.
G-C **Solitaer-Texel:** bewusste Ein-Texel-MERKMALE (Augen, Glanz-
    punkt, Hand) sind kein Rauschen. ENTSCHEID: die Material-Tabelle
    fuehrt eine Flaeche art:"merkmal"; Solitaer-Gate <=8 % rechnet
    OHNE deklarierte Merkmal-Texel (Deckel: max 12 Merkmal-Texel je
    Grid, sonst Missbrauch). Bild-Juror prueft, ob die Augen als
    Augen lesen — sonst gilt die Ausnahme nicht.
G-D **Hue-Spanne Umhang 22,1 Grad** (von 3) ist das Maximum aus dem
    Bestandssatz u/U/X/^/Z; >=40 braeuchte neue Hexwerte fuer X/Z
    (M3/M4-gebunden, Bestand). ENTSCHEID: fuer CH-1 akzeptiert und
    deklariert; Revision in CH-4 (Licht auf Figuren).
G-E Profilaehnlichkeit Held/Hedda 88,8 und Held/Corm 87,9 sind
    nach 1a gestiegen (Held voller) — wird in 1b durch die NPC-
    Silhouetten geloest (NPCs weichen dem Helden aus, nicht
    umgekehrt; Held ist der Stil-Anker).
G-F **Licht beim Linkslauf (Bild-Juror Held V2, Fehler erster
    Ordnung):** die Engine spiegelt Seitenframes (`_flip`), ein
    einseitiger Rim landet links-laufend auf der Schattenseite und
    wuerde von JEDER Figur geerbt. ENTSCHEID (Art-only, CH-1): in
    SEITENFRAMES ist der Rim/Z-Lichtakzent FLIP-NEUTRAL (Licht von
    OBEN: Kuppel/Schulter-Oberkante, keine einseitige senkrechte
    Lichtkante); Front/Rueck behalten oben-links. Ein richtungs-
    abhaengiger Rim NACH dem Spiegeln ist Engine-Arbeit (seite in
    pushTinted) und wird fuer CH-4 deklariert. Gilt fuer alle
    Figuren mit Seitenansicht (Held jetzt; Gegner in CH-2).
G-G Juror-Bestaetigung zu G-B/G-C: Schwarz-Anteil Held 34,3 -> 23,9 %
    (T2 bestanden, Konturtoene 4 -> 12); Solitaer-Rauschen liegt zu
    57 % im STOFF (139 Einzeltexel "Sekundaerbewegung" unter der
    Wahrnehmungsschwelle), nicht in den Augen (16) — Augen/Griff als
    Merkmal raus, Stoff-Rauschen muss real weg (Korrekturrunde).
G-A' **Nachtrag zu G-A (Held V2 Korrekturrunde):** dE00 je Boden-
    klasse liegt 0,3-0,5 UNTER Vorher (21,5/3,1/21,1/10,3 vs
    21,8/3,6/21,6/10,8). Gemessene Ursache: 143 reinschwarze
    Umrisstexel -> Materialtoene (Stilregel 2, verlangt) + dunkle
    Stoffmasse heben Koerper-L um 1,6 und senken C*ab um 0,6; die
    Mittelfarb-Metrik nimmt den Rim aus und sieht die real bessere
    Kantentrennung (Rim +44 %, Schwarz -12,3 pp, Konturtoene 1->3)
    nicht. Drei Gegenmassnahmen gebaut+gemessen (0,0/+0,1/0,0),
    verworfen. ENTSCHEID: Toleranz dE00 >= Vorher - 0,6 bei
    dokumentierter Stilregel-2-Ursache; die Bodentrennung des
    Helden wird ueber Rim/Kante + Bild-Juror abgenommen.
