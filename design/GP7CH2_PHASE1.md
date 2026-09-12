# GP7-CH-2 Phase 1 — Ergebnisse + Rev-2.1-Ergaenzungen (12.09.2026, Fable)

Commits: 5eb42d5 (Engine Schritt 1: Flash-Zaehler, Decal-Liste, 3 Blink-
Stellen raus, provisorische *_decal-Keys), c2d713b (Engine Schritt 2: 37
additive smoke-Gates, smoke-Kanon 825 -> 862), ef1b27e (Kunst: fuenf
Gegner + vier Decals, diese Doku, Uebergabe). Basis: c60d153 (Phase 0 + Palette +8).
Ablauf: drei DIREKTE Opus-Agenten parallel (Engine E, Zeichner A Skelett/
Hund/Warden, Zeichner B Rost/Ghul) in EINER Sprite-Datei unter Mutex
(.tmp/gp7ch2_p1/LOCK via mkdir), art-first (jede Runde 12x rendern + Read;
A 10+13+3 Schleifen, B 13+16). Pruefung: V-TESTS (GRUEN), V-SPEC (1 BLOCKER,
3 MAJOR, 6 MINOR), drei Blind-Squint-Juroren, Fix-Runde 1 mit Knaeuel-
Nachbesserung, Werkzeug-Nachzug in zwei Runden, dann r2. Planer-Notizen:
.tmp/gp7ch2_p0/FABLE_ENTSCHEIDE.md (Abschnitte PHASE 1 ff.).

## REV-2.1-ERGAENZUNGEN AUS PHASE 1 (bindend; ersetzen widersprechenden Rev-2-Text)

### Engine (E)
P1-A1 Kill-Flash-Zaehler zeichnet zu Ende (spur_kill-Fassung, R-A1 umgesetzt):
neue Flanken im die/dead-Zustand ueber den Vorframe-Zustand gesperrt; der
Todesframe traegt den Kill-Flash (4 Frames), Spieler dead ab Frame 5 = 0.
P1-A2 Decals werden nach den Kacheln VOR den Weichschatten gezeichnet
(noTint-Hoist, R-A3), Fusslinie = AABB-Unterkante, Grid-Hoehe frei.
P1-A3 §5(5) additive smoke-Gates: 37 Zusicherungen (Silhouetten-Verlust 0,
Flash 3/<=4/0, kalte Maske 6 Hz, Decal-Reinheit, REISENDES DORF-Gate 2 -> 0
+ CATACOMBS 1 -> 0 + Respawn 0, Deckel ueber nur lesenden Debug-Deckel
window.__decalDeckel (Spiel: 24), *_decal-Positivkontrolle je Sorte, Frame-
Diff-Untergrenzen). smoke-Kanon = 862 ok-Zeilen; "smoke x2 identisch" =
alle Zeilen ausser "Simulierte Ticks gesamt".
P1-A4 Rost-Decal ist behavioral belegt (V-TESTS: FLUESTERGRUFT God-Kill,
28 Zustands-Ticks, Decal ab Folgeframe, Fussposition Δ 0/0) — die Engine-
Notiz "Rost headless nicht toetbar" ist ueberholt.
P1-A5 Weltkoordinaten-Beweis: Konserve .tmp/gp7ch2_vorprobe/out/konserve_
main.json (sha 32bcafd4…), Spur-sha 8786da17… vorher = nachher, auch auf
der NEUEN Kunst reproduziert (V-TESTS zn/zv-Zonen).

### Kunst-Gates (Lesarten, keine Schwellenaenderung)
P1-B1 G5 SPIEGELGLEICHHEIT urteilt auf der Landkarte-C-TON-Lesart <= 65 %
(Anteil opaker Texel mit gleichem Ton am bbox-Spiegelplatz); Teil-A-
Silhouetten-Lesart und E5-Ton-Lesart informativ. Grund gemessen: auf der
Silhouetten-Lesart liegen ALLE CH-1-abgenommenen Menschen bei 82,9..89,7.
P1-B2 *_decal-Grids: ausgenommen von G2 Konturtoene, G3 Rim, G4 Halb-
seiten, G5 Spiegel (flach, nie geflippt, 25-%-Rahmendeckel); es gelten
G1 Schwarz, G6 Solitaer und das additive G12 DECAL-GATE: Breite = Basis,
Hoehe <= min(6, floor(0,4*H), Hund 4), Rahmen <= 25 % auf dem eigenen
Grid, messbar verschieden von *_die (Texel-Diff >= 30 % ODER >= 2 Zeilen
flacher ODER Flaechen-L -20; E5-Koerper-L ist bei Decals leer), PLUS
(nach V-SPEC B1/M4): >= 1 Konturton mit >= 4 Texeln als BODENKANTE, Rim
<= 15 % der Decal-Texel. Decals muessen als liegende Leiche der Sorte
lesen (Bild-Gate).
P1-B3 shield_side/_up/_down: ausgenommen von G4, G5, G7 (Requisit mit
gewolltem Seitenlicht, Platte).
P1-B4 E-B9 fuer den ROSTPANZER neu gefasst: KEIN kalter Rim '|' (liest auf
warmem Rost als Frost/Schnee und rueckt ihn an den Torwaechter); Rim =
'_' als 2-3 Texel harter Glanzpunkt nur auf der Helmkuppe + '6' (hellste
eigene Rampenstufe) als weiche Lichtkante auf den Plattenoberkanten
(Anker-Regel 7). Material-Tabelle rim ['_','6']. Der Grund fuer '|'
(b-Flaeche L 203 neben '_') ist mit Knochen 3,3 % entfallen. Warden
behaelt '|'. LESARTEN: figuren_messung G3 zaehlt die deklarierten Rim-
Toene auf der Kontur (Rost 40 % ueber '6'); tools/horden_bogen zaehlt in
der Trenn-Rate nur harte Rim-Toene C/_/| — beides deklariert, nicht
angeglichen (der Rost trennt im Knaeuel ueber dL).
P1-B5 Ziel-Kopf-Schulter-Profile (R-B3) sind Vorschlaege; Gate = <= 65 je
Paar / <= 60 ganze Figur. Reale Profile: Skelett [4,4,6,6,9,10]-nah,
Ghul [9,13,16,15,13,10], Rost [4,7,8,14,19,20], Hund [2,3,11].
P1-B6 Schild-Landezone (E-B9/P4): der rechte Rost-Arm belegt die Zone
Spalten 13-18 / Zeilen 6-15 und wird vom Schild-Overlay vollstaendig
gedeckt — gestalterisch akzeptiert (V-SPEC).
P1-B7 Tafel-B-Trenn-Rate: Gate >= 80 % (schalterlos); gleiche Sorten
trennen nur ueber Rim oder |dL| >= 25 — deshalb UNGLEICHE Kontaktkanten
je Figur (Skelett: rechte Rumpfkante '/' gegen '$'-Arm des Nachbarn;
Ghul: rechter Arm '<' gegen 'd'); im Knaeuel beruehrt die RECHTE Flanke
den Nachbarn (B-Messreihe). Endstand Tafel B 91,3 %, A 85,8 %, D 100 %.

### Deklarierte Abweichungen (Kunst; "gruen ODER deklariert" = Bilanz 2)
P1-D1 Grufthund G7: Hue-Spanne 19,2 < 20 (R-B5; Rev-2-Fenster exakt 20).
P1-D2 Rostpanzer G7: Hue-Spanne 12,0 (Rampe 4/5/6 eingefroren); Rost-
Spiegel (Silhouette) 81,45 informativ.
P1-D3 Warden: G4 warden_dash 15,29 (Ausfallschritt-Pose, Eichkoerper;
alle anderen Warden-Grids <= 6,5 = Gate), G7 (Bestandsrampe O/B/b/N,
CH-1-gekoppelt), G11 b 21,25 % ueber alle Grids (E-C5 verlangt "b senken"
fuer Koerper-L 131..134 — erfuellt: alle Grids gesunken; je Grid max
warden_die 37,6 %, summon 26,5, windup_b 23,5, stuck 23,1, idle 16,3; 10-%-
Deckel war die Rost-Regel; die 10-%-Fassung wurde gebaut und am Bild
verworfen = graue Masse).
P1-D4 Schild G7 (Requisit, keine Materialflaeche).
P1-D5 Ghul G7: Schaedel H/3 als 2-Stufen-Akzentflaeche > 40 Texel (kein
Palettenbudget fuer eine dritte Stufe; der grosse bleiche Schaedel ist die
Identitaet — Juror 2 hatte den kleinen Schaedel nicht mehr gelesen) und
Lumpen 'd' 64,9 % > 55 (Koerper-L-Band 105..113 mit 75-Texel-Schaedel bei
~172 L erzwingt dunkle Lumpen; Alternative 'd' 49 % -> Koerper-L 118,6 rot).
P1-D6 Ghul-Arme enden auf Kniehoehe (Steckbrief "unter die Knie"): jede
Zeile mehr reisst P1 Ghul/Rost (61,3 > 60).
P1-D7 Skelett G7: Einzelton '/' bis 70 % (Ist 59,3): die Knochenrampe hat
faktisch zwei brauchbare Stufen — '"' (#4b5686, hue 287,8 erzwungen) liest
neben hellem Knochen als gesaettigtes Blau (Sonnenbrille/Krawatte-Befund)
und steht nur mit 2 Texeln im skeleton_die; '$' (#8c7671) liest als
Fleisch und darf nur Kanten tragen (Juror 2: "rosa-bleicher Schaedel").
CH-3-NOTIZ: warm-neutraler dritter Knochenton statt '"' (Palettenbudget!).
P1-D8 Skelett-Rumpf mit hell/dunkel-Kanten (links '$', rechts '/'): Sel-Out-
Logik wie beim Helden; Halbseiten 4,99 <= 6,5 (M3-hart 8,2); Flip-Bild
von V-SPEC r2 zu bestaetigen.
P1-D9 Hund: ein Sehnenpaar je Grid an der Rumpf-Oberkante (zweites Paar
reisst hound_leap G2/G4).
P1-D10 Werkzeuggrenze: die M1-Realmessung (messung_p4, clear_world=True)
zeigt Gegner nur in g6_05 (Warden); "neue Gegner im Bild" wird durch
Horden-Bogen, Spielprobe und M3 an skeleton_0 getragen.

### Squint-Blind-Test (E-B10) — Befund und Lesart
Drei frische Juroren, nur die 40 Kacheln, Aufloesung nie im Kontext.
VORHER-Satz: 40/40 (die alten Figuren lebten bei 1x von EXTREMEN Werten:
Skelett L 162 "hellster Fleck", Hund 75 "dunkler Klecks"). NACHHER v1:
Juror 1 6x 5/5 beide Boeden, 1x gruft 4/5, 1x gras 1/5; Juror 2 vertauschte
Skelett/Ghul in ALLEN 8 Serien (Ursache: Skelett-Schaedel im rosa Mittelton
+ Sand-Koerper = "Ghul", Ghul-Rim-Balken = "Klinge", Schaedel zu klein) —
das war der Ausloeser fuer die Fix-Runde. NACHHER v2 (Juror 3, frisch): 40/40 — 1x 5/5 und 6x 5/5 auf beiden Boeden in Farbe UND Grau; E-B10-Ziel erfuellt. Die Skelett/Ghul-Vertauschung ist mit grossem Ghul-Schaedel, Rim-Segmenten und Skelett-Gesicht ohne '$' verschwunden.
LESART: der Einzelfiguren-Blindtest misst Identitaet in Isolation; die
Rev-2-Wertleiter (85..134) komprimiert die Werte absichtlich (kein
"Leuchten" gegen den Boden, dL +143) — das kostet 1x-Pop im Grau; 6x
entspricht der Geraeteansicht; die Knaeuel-Trennung traegt Tafel B.

## GEBUNDENE ZAHLEN (Stand nach Fix-Runde 1, vor r2)
Gate-Bilanz (figuren_messung, Gesamt 65 Gates): Skelett 12/12 (G7 MAXTON
59,3 deklariert), Ghul 11/12, Grufthund 11/12, Rostpanzer 11/12, Warden
5/8, Schild 8/9 — Bilanz 2 "gruen oder deklariert" = 65/65 (Werkzeug-
Nachzug r2). Paar-Gates: ganze Figur max Gh/Ro 58,6; Kopf-Schulter max
Gh/Ro 61,3; Wertleiter Rost 85,2 < Hund 94,1 < Ghul 112,2 < Skelett 124,0
< Warden 131,9 (Abstaende 8,9/18,1/11,8/7,9 L). Innenraum: Skelett 146,35,
Ghul ~114,5, Hund 103,97, Rost 93,63, Warden 141,61 (alle im Band).
Horden-Bogen (Gruft, schalterlos): Schwarz A 16,3 / B 16,4 / C 20,0 /
D 17,0 % (vorher 37,6/39,6/31,1/34,9); Trenn-Rate A 85,8 % (vorher 44,4),
B 91,3 % (vorher 78,1; Gate >= 80), D 100 %; Decal-Boden 1,41 %.
Minderheit: Hund auf GRAVEYARD-Weg dE00 31,1 (dL nur +3,7) — ueber Farbe.
Realmessung (V-TESTS r1): M3 skeleton_0 dWarm 51,5 / K3 6,08 / ausgebrannt
0 / Fern -1,83; Bild-M5 10 (>= 8); M1 d1-d6 unveraendert (d3 +0,125),
g6_01-05 im Band; M4 Vollsilhouette 237 (Warnung, kein Gate).
V-SPEC r1 Noten (Vorher-Cast ~4): Skelett 7, Grufthund 8, Rostpanzer 7,
Ghul 6, Warden 7, Horde 7. Noten r2: siehe unten.

## LEHREN
L1 Workflow-Laeufer = 2 Agenten parallel; direkte Agenten fuer echte
Parallelitaet (Ports je Agent, IDs sofort sichern).
L2 Nie String.replace mit '$' im Ersatztext beim Patchen von Sprite-
Grids (Datei verdreifacht sich); Funktions-Ersetzung + Key-Zaehlung nach
jedem Schreiben. Mutex-Schreiber muessen eigene Kommentarzeilen mit
ersetzen (Dubletten).
L3 Ausnahmen an Gates werden in die GEGENRICHTUNG genutzt (0 Kontur, Rim
50 %) — jede Ausnahme braucht eine Untergrenze in der anderen Richtung.
L4 Ein einzelner Bildmodell-Juror auf 32x48-Kacheln streut stark; drei
Juroren (vorher, nachher, nachher v2) statt einem.
L5 Kontaktkanten gleicher Sorten: die Diagnose gehoert in eine Kopie des
Werkzeugs (hb_diag.mjs), nicht ins Raten — die Kanten lagen am Rumpf, nicht
an den Armen, und die rechte Flanke beruehrt den Nachbarn.
L6 Read auf PNG faellt aus, wenn der IDE-Host-Client weg ist ("PreToolUse
hook did not respond"); Bash geht weiter; Zeichner ueberbruecken mit ASCII-
Wertvorschau und sehen danach jede Fassung als Bild.

## RUNDE 2 (V-SPEC r2, Juror 3, V-TESTS r2)

V-SPEC r2: GRUEN. Runde-1-Punkte: 1 Blocker (Decals) BEHOBEN — Schaedel-
rund + Knochenschaft / Vierbeiner-Kontur / Haufen mit Schaedelrest /
gekippte Plattenlage, Bodenkanten 23,8/18,2/0/14,3 % Schwarz (Hund fuehrt
'{' als Kante = Sel-Out), Tafel D liest als Schlachtfeld mit Ueberresten;
2 (Ghul-Rim-Balken) BEHOBEN mit Rest (max Lauf 3; bei 9-px-Abstand stossen
Nachbarsegmente zu 5er-Laeufen — die Einzelfigur zaehlt jetzt ueber den
Schaedel); 3 (Rost-Frost) BEHOBEN — Abstand zum Torwaechter GROESSER als
vorher (kalter Helmglanz gehoert jetzt allein dem Torwaechter); 4 (Decal-
Ausnahme) BEHOBEN (Rim 4,8/9,1/6,7/0 %); 5 DEKLARIERT (P1-D7); 6 OFFEN-
MINOR: erhobener Skelett-Unterarm zu 5/7 '_' -> "rosa Kopf + rosa Hand" im
Squint, zugleich der Marker, der die Skelette im Knaeuel zaehlbar macht —
akzeptiert, Kandidat fuer eine spaetere Politur (Arm '/', nur Oberecke
'_'); 7 BEHOBEN; 8 Buchhaltung (P1-D3 nennt jetzt max 37,6); 9 BEHOBEN;
10 BEHOBEN (Rost Schwarz 23,0/22,2). Neue MINOR: 11 Ghul-Kutte flacher
('d' 98 Texel, deklariert P1-D5; Politur-Idee Faltenband '<' 12-15 Texel);
12 Kopf-Schulter Sk/Gh 66,3 nach V-SPEC-min/max-Formel (nicht die E5-
Lesart; Werkzeug 52,6 — V-TESTS r2 rechnet); 13 Innenraum-Lesart: Skelett
148,6 > Warden 136,3 (E5-Koerper-L-Gate hat die richtige Reihenfolge
124 < 131,9; Bild unkritisch: Warden liest ueber die b-Maske als hellste
Figur); 14 tools/__pycache__ untracked (entfernt, .gitignore).
Neuschaeden gesucht, keine gefunden: Skelett-Rumpfkanten flip-neutral
(Halbseiten 4,99/1,84/0,68; alle Gegner-Grids ausser warden_dash <= 6,5),
Ghul kippt nicht ins Skelett, Tafel B vier Baender mit je fuenf zaehlbaren
Figuren (6x + Squint), Rost ohne '|' von Torwaechter und Ghul getrennt,
Schild ohne '|' lesbar, Flash gut, 64 Nicht-Gegner-Keys byte-gleich.
NOTEN r2 (r1): Skelett 8 (7), Grufthund 8 (8), Rostpanzer 8 (7), Ghul 7
(6), Grabwaechter 7 (7), HORDE 8 (7).

Blind-Juror 3 (NACHHER v2): 40/40 (siehe oben).

Cast-Juror (frisch, nur Bilder, eigene Skala): Skelett 4,0 -> 5,0, Ghul 4,0
-> 6,5, Grufthund 4,0 -> 7,0, Rostpanzer 3,5 -> 7,0, Grabwaechter 4,5 ->
4,5, Horde 3,5 -> 6,0, CAST 4,0 -> 6,25. Kurzurteil: Sorten auf einen Blick
erkennbar (Hund/Rost/Ghul), im Gedraenge ueber Farbbaender; Skelett liest
"eher wie kleiner nackter Mann mit Brille als Knochen", Grabwaechter "wie
aus einem anderen Spiel". Abweichung zu V-SPEC r2 (8/7/8/8/7/8): der Cast-
Juror bewertet Identitaet und Plastizitaet, V-SPEC Steckbrief-Treue und
Messziele. BEIDE stehen; die Entscheidung ueber eine Politur-Runde (CH-2b:
Skelett-Identitaet vs Wertleiter, Warden-Haertung, Decal-Plastizitaet,
Rostreihe) liegt bei Michael nach dem Geraetetest (E-D).

V-TESTS r2: alles gruen (Suiten, beide Bilanzen 57/64 + 64/64 mit
greifenden Deklarationen, Paar-Gates, Tafel B 91,27 % x2 byte-gleich,
Decals 6/6 Pruefungen, Sperrlisten 0 rot, Konserve byte-gleich, M1/M4/M5
gruen) AUSSER M3 an skeleton_0: K3 3,11 (< 6,0) + Fern -2,12 — die neue
eigene Halbseiten-Neigung (-4,99, rechts heller) laeuft mit dem Szenen-
licht. Aufloesung: Kanten bleiben (Knaeuel), Haelften innen ausgeglichen
(<= 2,0 L) — Skelett v4 (A): Haelften innen ausgeglichen (skeleton_0 -0,75, skeleton_1
+1,51), Augenhoehlen als zwei Hoehlen mit Nasensteg, Arm-Rim 3 Texel
Oberecke (rosa Hand weg), Koerper-L 125,29, Tafel B 86,5 % (Preis der
Arm-Rim-Ruecknahme; Gate >= 80). V-TESTS r2b: alles gruen (beide Bilanzen 57/64 + 64/64, Skelett-Gates,
Suiten, Tafel B 86,45 % x2 byte-gleich, Fern-Kontrolle geheilt -1,62, Gate
gueltig) AUSSER M3 K3 an skeleton_0 = 4,64 (Soll >= 6,0; Runde 2: 3,11).
Ursache gemessen: nicht mehr die Asymmetrie (Grid-dL -0,75), sondern die
KNOCHENHELLIGKEIT (Mittel-L 138,9; Runde 1 mit 129,3 bestand mit 6,08) —
die warme Tint-Maske hat auf hellem Knochen kaum Kopfraum; Heilung braeuchte
~30 Tausche '/' -> '$' im Innenraum (= sichtbar dunkler/khaki, genau die
Cast-Juror-Kritik in Gegenrichtung).
P1-D11 DEKLARIERT (Praezedenz CH-1 G-A'): M3-K3 an skeleton_0 4,64 statt
>= 6,0. Belegt bleibt die Lichtwirkung: dWarm 51,2 (Gate 18), Fern-
Kontrolle -1,62 (< 2,0), ausgebrannt 0, Held-Kontrolle K3 17,44 unver-
aendert (Engine/Werkzeug nicht Ursache), Bild-M5 10 (>= 8), M4 gruen.
Bedingung: skeleton_0 Halbseiten <= 2,0 (jetzt 0,75). NOTIZ CH-3: M3-
Messfigur auf eine mittelhelle Figur (ghoul_0, L 112) umstellen —
sanktionsbeduerftig (shot_gfx6.py-Aenderung), in CH-2 nicht erlaubt.
 Duenne Reserven notiert:
Rost G8 85,21 (Band ab 85), Ghul G8 112,21 (bis 113), Warden G8 131,91
(ab 131), Warden Walk-Diff +0,9 pp, G12-Bodenkanten exakt 4 Texel.
Lesart-Notiz: die Anker-Positivkontrolle ist nur mit der IST-Material-
tabelle aussagekraeftig; V-SPECs Kopf-Schulter 66,3 war nicht reproduzier-
bar (52,56 in beiden Formeln, algebraisch identisch).
