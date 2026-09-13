# GP7-CH-2 Phase 0 — Fable-Entscheide zu den Paket-Abweichungen (Stand 12.09.2026, laufend)
Quelle: Reports P0.e (06:46), P0.b (07:15), P0.f (07:22). Werden in design/GP7CH2_PHASE0.md (Rev 2.1-Block) uebernommen.

## P0.e (Masstabelle) — GRUEN, keine Entscheide noetig
- E1: Block sitzt VOR console.log/process.exit (sonst toter Code). Additiv (0 Minus-Zeilen). Akzeptiert.
- E2: fussvolk NICHT im Block (Rev 2 E-C1). Akzeptiert.
- E3: Beobachtung "Simulierte Ticks 7660 vs 7642": P0.f klaert: Block 25 laeuft mit echtem Math.random (7641/7643/7606 in drei Basislaeufen) -> KEIN Determinismus-Anspruch auf die Tick-Zahl; die 825 ok-Zeilen sind der Kanon. V-P0: "smoke x2 identisch" = 825 ok-Zeilen + Zeilen byte-gleich AUSSER der Tick-Zeile.

## P0.b (Palette) — GRUEN mit 10 Abweichungen
- B1 HUND innen dE00 6,49 statt >=8: ENTSCHEID (a) DEKLARIEREN (Praezedenz CH-1: 9,04). Petrol-Vokabel bleibt (Fenster hue 195..215 NICHT auf 185..225 oeffnen: der helle Ton rutscht sonst zu Corm ')' und '7'). Nicht-Farb-Trennung der Stufen = L601-Schritte 13,0 / 18,6 (das Auge liest Wert). Zeichner-Auflage: Hund-Stufen als WERT-Stufen setzen, nie zwei benachbarte Stufen ohne Zwischenzeile mischen.
- B2 HUND Hue-Spanne 19,17 statt >=20: ENTSCHEID: DEKLARIEREN (0,83 Grad ist unsichtbar; das Rev-2-Fenster war exakt 20 breit = mein Spec-Fehler). KEIN Rim '|' fuer den Hund nur um die Zahl zu retten — Hund-Rim bleibt so wie Rev 2 E-B es vorsieht (nachschlagen beim PHASE0-Schreiben).
- B3 SKELETT-Schatten hue 287,8 / L601 88,2 statt 250..270 / ~105: ERZWUNGEN (kalter Sektor voll belegt), akzeptiert. Zeichner-Auflage Skelett: >=60 % Lichtstufe '/' im Innenraum (Rechnung 139,95 im Ziel 138..148); Schatten '"' nur als Kanten-/Rippenschatten, nie flaechig.
- B4 GHUL 2 neue + Bestand 'd' als dunkelste Stufe (84/119/142, Verh. 1,57): akzeptiert inkl. Beweis gegen 'O' (Weg-Unsichtbarkeit).
- B5 '"' gegen Held 'X' 10,45 statt 12 (CH-1 V6): DEKLARIEREN (arithmetisch unerreichbar; Trennung Wert + Familie + Ort).
- B6 Skelett '/' gegen Ghul-Bestand 'H' 10,28 statt 12: DEKLARIEREN (Bestandston; dL 17,9, HELL vs MITTEL).
- B7 E-B6-Zahl: Spec "10,7..11,7" -> real 10,36..11,71 (Minimum bei L90). ERRATUM in PHASE0 + Rev 2.1.
- B8 §5(2) SYM-Deckel: 17 -> 25 (61 alnum bleibt, Gesamt 86). Sanktion Rev 2.1: "SYM_SOLL +8" statt "+<=7". Das ist die ZWEITE Beruehrung von check_gfx6_art (erste = P0.e-Block; Rost-Verschaerfung = dritte?!) -> ACHTUNG §5(3) i.d.F. E-A7 spricht von ZWEI Beruehrungen: P0.e additiv + Rost-Zeile. Der SYM-Deckel ist §5(2) (eigene Sanktion, Zeilen 84-95), zaehlt nicht zu §5(3). Klarstellen in Rev 2.1.
- B9 C*ab <= 30,0 Selbstauflage: akzeptiert.
- B10 GP7CH1_PHASE0.md Tontabelle veraltet (Cast-Juror 10.09. rechnete 7 Toene neu, palette.js:361-380 ist die Wahrheit; Corm jetzt L601 58,5/80,9/103,0): ERRATUM-Zeile in design/GP7CH1_PHASE0.md nachtragen (Doku-Commit, keine Kunst). Michael-Frage "Corm zu hell?" ist damit teilweise beantwortet: bereits abgedunkelt am 10.09.
- Deliverable: .tmp/gp7ch2_p0/toene_ch2.json (sha 831356c5...). Palette-Einbau (palette.js +8) erst in Phase 1 (Zeichner A traegt Skelett+Hund ein, Zeichner B Ghul — MUTEX: palette.js gehoert dem, der das LOCK haelt; oder: EIN Vorab-Commit "Palette +8" durch den Engine-Agenten VOR Phase 1 — BEVORZUGT, weil dann beide Zeichner sofort alle Toene haben und check_gfx6_art SYM 25 in demselben Commit kommt).

## P0.f (Engine-Vorprobe) — GRUEN mit 11 Punkten
- F1/F2 Kill-Flash 4 Frames tot unter woertlichem Ausschluss: ENTSCHEID Rev 2.1 E-A1: Der Ausschluss die/dead gilt nur fuer das AUSWERTEN NEUER FLANKEN (kein Neustart aus eingefrorenen Timern); ein bereits gesetzter Zaehler zeichnet zu Ende (max 4 Frames, kann per Konstruktion nicht dauerblitzen). Beleg: Variante spur_kill: skeleton_die_flip 4, player_die_0 3, keine Dauerblitzer (gegen 28/51 naiv). Phase 1e baut spur_kill-Fassung, NICHT die woertliche im Patch. Gate: "Signal-Draws ueber *_die <= 4 je Kill, ueber *_decal = 0, im dead-Zustand ab Frame 5 = 0".
- F3 6-Hz-Puls als 24-Hz-Schritt ueber [0.16,0.12,0.08,0]: akzeptiert, Jury-Sichtentscheid.
- F4 Decal-Zeichner hinter drawSoftShadow (Leichen UEBER Weichschatten Lebender): ENTSCHEID: `const noTint` vor drawSoftShadow(player) (main.js:2663) hochziehen, Decals UNTER Weichschatten (E-A4 woertlich "unter allen Renderables"). Zusaetzliche Verschiebung im Bestand = sanktioniert in Rev 2.1 (main.js ist ohnehin im Umfang).
- F5 *_decal provisorisch = *_die: Phase-1-Kunst; E-A4-Auflage (Texel-Diff >=30 % ODER >=2 Zeilen flacher ODER Wert -20 L) bleibt Gate der Zeichner. hound_die reisst heute beide Decal-Ziele (41,2 % / 7 Zeilen) -> Hund-Decal ist Neuzeichnung, nicht Ableitung.
- F6 kein warden_decal (§8): bestaetigt.
- F7 __noTint -> kein Flash/Puls in Messszenen: bestaetigt als bewusst.
- F8 Flusstests als Dynamik-Beweis NUR mit Konserve (check_main_slice1 steuert aus dem Bild): Rev 2.1 E-A5: Weltkoordinaten-Beweis = Konserven-Abspiel (Werkzeuge .tmp/gp7ch2_vorprobe/sonden/ mk_spur.mjs, mk_konserve.mjs, spur_lauf.mjs), inventory/boss direkt. V-TESTS Phase 1e nutzt genau diese.
- F9 Deckel 24 nur mittelbar (max 17 Gegner/Karte): akzeptiert; Sonde mit DECAL_MAX=2 ist der Beweis.
- F10 Additives smoke-Gate "0 Decals nach buildWorld" MUSS reisen: Rev 2.1 §5(5): eigener Boot Kampfkarte -> Kill -> Westtor -> DORF, Gate = 0 Decal-Draws in DORF (Phantom-Zone: 10892 Draws, smoke trotzdem gruen = falsch-gruen belegt).
- F11 Patch: .tmp/gp7ch2_vorprobe/PATCH_flash_decal.diff (441 Zeilen, 5 Dateien, git apply --directory=game/js, Check gruen gegen 9bc205e). Phase 1e = Patch + Aenderungen F1/F4 + echte *_decal-Grids + smoke-Gate F10 + SYM 25.
- Ticks-Zeile smoke ist nicht deterministisch (Block 25 Math.random) -> siehe E3.

## P0.c (Horden-Bogen) — GRUEN mit 16 Punkten (Report 08:10)
- C1 Neue Vorher-Anker Trenn-Rate (Definition NEU, Material-Material-Kanten): Tafel A 44,44 % (8/18), Tafel B 78,08 % (57/73). Teil-C-Wert 0 % ist ungueltig (Review B5). Schwarz-Sprenkel A 37,58 / B 39,60 / C 31,09 / D 34,86 %. Decal-Bodenbedeckung D 2,90 % (Obergrenze, Platzhalter *_die). mdL Leiter 20,92.
- C2 Tafel A nur 18 Kanten -> statistisch nicht belastbar. ENTSCHEID: Trenn-Raten-GATE haengt an TAFEL B (>= 80 %, 73 Kanten); Tafel A nur informativ (>= vorher 44,44 %).
- C3 dE00>=20-Zweig trennt am IST nichts: bleibt — er ist fuer Hund(Petrol)/Rost(4/5/6) im gemeinsamen DUNKEL-Band gedacht (P0.b: dE00 Hund/Rost 42,47).
- C4 --rim ist Simulation und macht das Gate gruen ohne Kunst; Rim-/Nicht-Rim-Raten nicht vergleichbar (Nenner waechst). ENTSCHEID: Gate wird IMMER am schalterlosen Lauf gemessen; echte Rim-Texel '|' in den Grids zaehlen als Material (dann waechst der Nenner ehrlich mit). --rim/--flash/--grau sind nur Vorschau.
- C5 E-B10-Zweitgate "mittlere |dL| benachbarter Koerper-L >= 15" ist mit der E-B1-Wertleiter (Hund+Rost teilen DUNKEL 85..100; Skelett -> ~122) arithmetisch unvereinbar (Skelett allein -> 13,89; volle Leiter -> ~10). ENTSCHEID: Zweitgate GESTRICHEN (Rev 2.1). Ersatz: E-B1-Baender + Trenn-Rate B >= 80 % + Minderheitskriterium E-B2. Kennzahl mdL bleibt informativ.
- C6 "benachbarte Typen": ENTSCHEID Bildnachbarn (im Bild beruehrende Paare verschiedenen Typs), informativ.
- C7 kein *_decal-Grid; nachher 29 Decals (Warden keins). OK.
- C8 Tafel C 6 Zellen (5 Gegner + Held), Roster-Reihenfolge fest (Vorher/Nachher deckungsgleich). OK.
- C9 Tafel B Boden = eingefrorener 5er-Satz (nicht Prototyp-3er). OK. Tafel A byte-identisch zum Prototyp-PNG.
- C10/C11 Simulationen deklariert; Prototyp-RNG inkl. 2^53-Quirk woertlich (Positionen eingefroren). OK.
- C12 Positivkontrolle Koerper-L bis 0,29 L neben Teil A (Toleranz 0,5): akzeptiert; V-P0 soll die Grid-Menge (Flips/Schild?) als Ursache benennen, kein Blocker.
- C13/C14 Legende = Manifest (nicht byte-gleich, PNG byte-gleich); CH-1-Referenz auf damaligem Art-Stand. OK.
- C15 Schwarz-Sprenkel: alle Typen ausser Warden ueber Deckel (Rost 44,9, Hund 40,5 > eigene 30-%-Ausnahme, Ghul 37,9, Skelett 37,3) = groesster Hebel des Passes. In Zeichner-Auftraege.
- C16 Squint-Trennbarkeit nur durch Juror (40 Blind-Kacheln + Aufloesung). OK.
- Werkzeuge: tools/horden_bogen.mjs (1017 Z., NEU), tools/figuren_bogen.mjs Rev 3 (additiv, Menschen-PNG byte-gleich, +Gruft-Boden +Gegner-Bogen 27 Grids). Kanon-Lauf .tmp/gp7ch2_p0c/bogen/ (145 Dateien). Erfolgs-String "HORDEN-BOGEN FERTIG".

## P0.a (Messwerkzeug Gegner) — GRUEN mit 14 Punkten (Report 08:15)
- Vorher-Bilanz: Figuren gruen 0/6, Gates gruen 11/63. Groesste Hebel: Schwarz k+n (52,9/44,2/49,3/54,6/28,1 %), Konturtoene 1 (alle), Rim 0 (alle ausser Ghul-Basis 12,9), Spiegel >92 % (alle), Frame-Diff 1 Band (alle), Koerper-L Skelett 162,6 -> Ziel 120..126.
- Ziel-Kopf-Schulter-Profile EINGEFROREN: Skelett [4,4,6,6,9,10], Ghul [8,10,11,11,11,14], Rost [2,2,4,9,14,18], Hund [4,9,13] (unveraendert), Warden fest. Max Paar 60,00. Innenraum-Zielzahlen: Skelett 139,6..146,7, Ghul 112,6..121,3, Rost 102,4..121,4, Hund 88,7..104,6, Warden 140,7..143,9.
- A1 Spiegel-Gate rechnet auf Teil-A-Silhouetten-Lesart (<=65). OK.
- A2 Solitaer-Anker = Landkarte C H7 (8/8 exakt), Teil A 1.2 nicht reproduzierbar. OK.
- A3 drei Teil-A-Sammelzeilen-Felder auf null. OK.
- A4/A5 Leitklassen ueber Legenden-Kunstschluessel (bindend); Fenster exakt 81,3..137,0 / 78,0..142,5 / 77,5..142,5. OK.
- A6 E-B2 dL vorzeichenbehaftet -> Grufthund auf GY-Weg ROT (dL -15,4). ENTSCHEID: echter Befund; nach Phase 1 erfuellt der Hund das Minderheitskriterium ueber den dE00-Zweig (P0.b: Petrol gegen Erde/Weg 29,38 >= 20). In Zeichner-A-Auftrag: Hund-Petrol muss auf dem Weg ueber Farbe lesen, Wert-Trennung reicht nicht.
- A7 Warden-Rim-Anker 12,5 % = Requisit-Artefakt (C in der Klinge). Echter Warden-Rim = 0 -> Rim '|' ist Kunstarbeit Phase 1 (Nachzug Zeichner A).
- A8 RAMPEN-Tabelle kennt 7/8/y/Y nicht (Anzeige 'unbekannt'): kosmetisch, Material-Tabellen sind separat korrekt (0 Zuordnungsfehler). OK.
- A9 hueSpanne 161,8 vs 198,2 (Komplement): beide gruen. OK.
- A10 Menschen-Anker am HEAD rot (26/27) weil CH-1-Kunst seit 75106c7 wuchs; mit --vorher-zeiger 75106c7 27/27. OK, dokumentieren.
- A11 Halbseiten-Gate trifft *_die (Skelett -20,4, Ghul +16,8) und shield_* (23,5). ENTSCHEID: *_die bleiben im Gate (werden geflippt gezeichnet, Anker-Regel 1 gilt); shield_* (Requisit mit gewolltem Seitenlicht) aus dem Halbseiten-Gate AUSGENOMMEN, Rev 2.1 E-B5.
- A12 Warden-Paare 65,33/64,71 knapp, ausgenommen. OK.
- A13 __pycache__ geloescht, A14 Baum = P0.c. OK.
- Werkzeug: .tmp/gp7ch_p0/figuren_messung.mjs (4608 Z., sha 3951ac27...), Ausgaben .tmp/gp7ch_p0/gegner_*.json; shot_gfx6.py:309 Regex 64->78 Toene, M1-Gates koennen nur gruener werden (statisch belegt). Phase 1: Regex braucht die 8 NEUEN Zeichen " $ / < > { } ` zusaetzlich (dritte Sanktion §5(7)? -> Rev 2.1: §5(7) = EINE Zeile, ZWEI Beruehrungen: jetzt +14, bei Palette +8 nochmal).

# PHASE 1 — Entscheide (12.09., laufend)
## Zeichner B (Rost 20x18 + Ghul) — Report 17:35, 8 Abweichungen
- Gates 11/63 -> 41/63; Rost 9/11, Ghul 9/11; Paar-Gates alle gruen; Tafel B Trenn-Rate 84,85 % (Gate >= 80 GRUEN), Schwarz-Sprenkel B 18,55 %.
- B1 Spiegel <= 65: ROST 81,45 DEKLARIERT (Familienidentitaet Platten+Helm; Restasymmetrie vorhanden). GHUL 92,31 NICHT akzeptiert -> Nachzieh-Runde "ungleiche Schultern" (Steckbrief bindend), Zielband <= 80 deklariert.
- B2 Rost Hue-Spanne 12 Grad (4/5/6 eingefroren): DEKLARIERT (auch Warden-Schienen).
- B3/B4 *_decal-Grids: G2 Konturtoene, G3 Rim, G4 Halbseiten GELTEN NICHT (flach, nie geflippt, 25-%-Deckel macht 3x8+Rim arithmetisch unmoeglich). Werkzeug-Nachzug in der Fix-Phase (figuren_messung: *_decal aus G2/G3/G4 ausnehmen; shield_* aus G4 gemaess R-B4).
- B5 Schild G4/G5/G7: DEKLARIERT (Requisit; Platte = 100 % Spiegel).
- B6 Profile als Vorschlag verlassen (Rost [4,7,8,14,19,20], Ghul [13,14,14,14,12,11]): OK (P4).
- B7 Ghul 'C' als waagerechter Nasenschatten (merkmal): OK.
- B8 Schaedel < 40 Texel: Juror.
- Material-Tabellen A + B muessen von Fable zu EINER Datei zusammengefuehrt werden (B's Datei enthaelt veraltete A-Eintraege).
- Paar-Matrix nach A's Abschluss WIEDERHOLEN (A hatte keine _fertig.json abgelegt).
- B Nachzieh-Runde Ghul v2 (18:30): ungleiche Schultern gebaut, Spiegel ghoul_0/_1 79,8/78,3 (Band <= 80), ghoul_die/decal 92 unberuehrt (deklariert), Paar-Gates gruen (Gh/Ro 58,8 / KS 60,9), Tafel B 82,47 % (>= 80), Koerper-L 110,0. Warden von A inzwischen 132,6.
## Zeichner A (Skelett, Hund, Warden) — Report 20:00, 9 Punkte
- Gates 11 -> 49/63; Skelett 10/11, Hund 8/11, Warden 5/8; Paar-Gates gruen; Tafel B 82,5 %, Schwarz A 17,9 %.
- A1 ZWISCHENFALL: String.replace mit '$' im Ersatztext zerstoerte sprites_figuren.js kurzzeitig (3x jeder Key); repariert, verifiziert (Fable: 95 Keys je 1x, Import ok, gfx6 GRUEN, keine Menschen-Keys im Diff). LEHRE (in Uebergabe + AUFTRAG_COMMON): nie String.replace mit '$' im Ersatztext, nur Funktions-Ersetzung/Konkatenation.
- A2 G5 Spiegel: Teil-A-Silhouetten-Lesart ist fuer JEDEN Zweibeiner unerreichbar (CH-1-abgenommene Menschen 82,9..89,7). ENTSCHEID: G5 = TON-Lesart <= 65 (bindend; Skelett 24,8, Hund 30,6), Silhouetten-Lesart informativ. Werkzeug-Nachzug Punkt 5. Rost/Ghul Ton-Werte misst V-TESTS; > 65 -> deklarieren wie B1.
- A3 *_decal ohne G2 (wie B3). skeleton_decal erfuellt es trotzdem.
- A4 Hund Hue 19,2: deklariert (R-B5).
- A5 Warden: warden_dash Halbseiten 15,29 (Ausfallschritt-Pose, Eichkoerper, E-C5 verbietet Posenaenderung) DEKLARIERT — uebrige Warden-Grids muessen <= 6,5 (V-TESTS prueft); G11 b 23,0 % DEKLARIERT (E-C5 verlangt "b senken" fuer Koerper-L, kein 10-%-Deckel; 10 % war Rost-Regel; Bild-Beleg: 10-%-Fassung = graue Masse, verworfen); G7 Bestandsrampe deklariert.
- A6 Hund KS [2,3,11] (Kopf tiefer als Schulter): OK (P4).
- A7 Innenraum-Zielzahlen: alle im Band. OK.
- A8 '"' (Skelett-Schatten #4b5686) liest neben hellem Knochen als gesaettigtes Blau, nicht als Schatten -> nur 2 Texel im die-Haufen; '/' 76,8 %. DEKLARIERT; Notiz CH-3: ggf. warm-neutraler dritter Knochenton (Palettenbudget!). Der Ton bleibt in der Palette (0-2 Texel).
- A9 material_B: 'n' im Ghul-/Schild-Umriss ohne Texel (Tabellenfehler-Zeile) -> Nachzug-Agent weist aus. Decal-Kommentar rust_decal 16 -> Nachtrag von Fable eingefuegt.
## Werkzeug-Nachzug (21:30) — Entscheide
- G5-Gate = Landkarte-C-Ton-Lesart (Nenner nur opake Texel; Anker Hund 30,6 = hound_0) <= 65; Silhouette + E5-Ton informativ. OK. ("Skelett 24,8" aus A-Report war ein Zeilenverrutscher, kein Anker.)
- G12 Decal-Gates additiv im Messwerkzeug; Wert-L der Decals = Mittel L601 aller opaken Texel (E5 dort leer); Texel-Diff ungedeckelt (>100 % moeglich). OK.
- Gate-Nenner jetzt 65 (G12 +4, Schild -2). Stand: Figuren gruen 1/6, Gates 57/65. NICHT deklarierte Rote = NUR ghoul_die: G2 Konturtoene 2 und G5 Ton 73,08 -> FIX-RUNDE B (zusammen mit F1 Schaedel/Rim). Alle anderen Rote deklariert (Hund G7 Hue 19,2; Rost G7 Hue 12; Warden G4 dash/G7/G11 b 23; Schild G7).
- material_gesamt.json: 'n' im Ghul-/Schild-Umriss ohne Texel -> Fable entfernt die zwei Eintraege beim Merge (kosmetisch).
## V-SPEC (22:05) — 1 BLOCKER, 3 MAJOR, 6 MINOR; Noten Sk 7 / Hu 8 / Ro 7 / Gh 6 / Wa 7 / Horde 7 — ENTSCHEIDE fuer Fix-Runde 1
- B1 Decals abstrakt (skeleton_decal 4x gleicher 2x3-Block, hound_decal zwei Rechtecke, 0 Kontur, Rim 33/50 %): FIX A. NEUE DECAL-REGEL (praezisiert E-A4/B3, ersetzt "ohne G2/G3"): je *_decal >= 1 Konturton (k/n oder dunkelster Materialton) mit >= 4 Texeln als BODENKANTE, Rim <= 15 % der Decal-Texel, Schwarz <= 25 %, liest als liegende Leiche der Sorte (Schaedelrund/Rumpf+Beinstummel). Werkzeug G12 um diese zwei Zahlen ergaenzen (Nachzug-Agent, nach V-TESTS).
- M2 Ghul-Rim 8er-Balken -> Knaeuel-Wand in Cyan (= Juror-2-"Klinge"): FIX B — Rim in 2-3-Texel-Segmente (Schaedeldecke, Schulterspitze, Armoberkante), >= 12 % bleibt.
- M3 Rost-Rim '|' liest als Frost + rueckt an den Torwaechter: E-B9 fuer den ROST NEU GEFASST (der Grund fuer '|' — b-Flaeche L 203 neben '_' — ist mit Knochen 3,3 % weg): Rim = '_' 2-3 Texel harter Glanzpunkt NUR Helmkuppe + '6' (hellste eigene Stufe) als weiche Lichtkante auf den Plattenoberkanten (Anker-Regel 7). Material-Tabelle: rim ['_','6']. Warden behaelt '|' (kalt-blasses Material u/U/X + Stahl).
- M4 Decal-Ausnahme als Freibrief (0 Kontur, Rim ueberschossen): siehe B1-Regel. Deklaration B3/A3 wird ersetzt.
- m5 Skelett Zweiton-Rampe ('"' tot): CH-3-Notiz (warm-neutraler dritter Knochenton). In Fix-Runde: A nutzt '$' als Unterseiten-/Rippenschatten am Koerper (drei sichtbare Stufen $ / / _), NICHT im Gesicht.
- m6 Skelett-Schaedel rosa im Squint ('_' 3 Texel + '$' im Gesicht): FIX A — Gesicht nur '/' + Augenhoehlen; '_' auf Zeile 0 max 2 Texel. (= Juror-2 F2)
- m7 Hund-Sehne liest als Wunde: FIX A — die 2 '$'-Texel an Rumpf-Oberkante/Schulterkerbe, optional zweite Sehne Hinterhand.
- m8 Warden b-Deklaration: Hoechstwerte je Grid: warden_die 37,6 %, summon 26,5, windup_b 23,5, stuck 23,1 (alle gefallen vs vorher) — Deklaration A5 auf "max je Grid 37,6 (die), alle gesunken" umgeschrieben; keine Kunst.
- m9 Warden Stoff-Sekundaerbewegung 4 Texel = Alibi: FIX A — Saum ueber Zeilen 19-21 je 1-2 Texel versetzt in walk_1 (Silhouette).
- m10 rust_0 Schwarz exakt 25,0: FIX B — je Arm eine Innenkante auf '4' (Sel-Out), ~8 Texel Luft.
- Zusatz V-SPEC: Skelett Innenraum eigene Messung 154,9 (anderer Nenner als Werkzeug 146,35) -> V-TESTS klaert; Ghul-Arme enden auf Hueftheohe statt "unter den Knien" (Steckbrief) -> B prueft, ob 1-2 Zeilen laenger ohne Profil-Kollision moeglich.
- Juror 2 (Sk<->Gh vertauscht): F1 GHUL grosser bleicher Schaedel (H/3 als 2-Stufen-Akzentflaeche > 40 Texel ERLAUBT, G7-Ausnahme "Ghul-Schaedel 2 Stufen" DEKLARIERT, kein Palettenbudget); F2 SKELETT Schultern <= 10 px, Gesicht ohne '$'. Dazu ghoul_die G2 (3 Konturtoene) + G5 Ton <= 65.
- REIHENFOLGE: V-TESTS zu Ende laufen lassen (misst den lebenden Stand), DANN A + B parallel (Mutex), DANN Nachzug-Agent G12-Ergaenzung, DANN V-TESTS r2 + V-SPEC r2 + Blind-Juror 3 (frisch).
## V-TESTS (12.09., ~18:30 UTC) — GRUEN, kein neuer Befund; Restpunkte-Entscheide
- R1 M1-Realmessung sieht Gegner nicht (messung_p4 clear_world=True; nur g6_05 mit Warden): DEKLARIERT als Werkzeuggrenze; "neue Gegner im Bild" wird durch Horden-Bogen + Spielprobe + M3 an skeleton_0 getragen. Kein clear_world=False (Messhygiene).
- R2 K3 skeleton_0 6,08 vs 6,0: Zeichner A gewarnt (Lichtseite nicht dunkler, Halbseiten symmetrisch); V-TESTS r2 misst M3 erneut.
- R3 Schild G7 im Werkzeug nicht ausgenommen (Deklaration B5 sagt G4/G5/G7): Nachzug-Agent nimmt shield_* auch aus G7 (Buchhaltung, 58/65).
- R4 Anker-Kontrolle vorher 1/6 Koerper-L (Offset ~-1 L) + ghoul rim 0: URSACHE = Vorher-Lauf mit der NEUEN Material-Tabelle (Rim '|' statt 'C' etc.); Anker gelten mit gegner_material_IST.json (P0.a: 6/6). Kein Defekt; in Doku vermerken.
- R5 V-SPEC "Skelett Innenraum 154,9" nicht reproduzierbar (11 Nenner geprueft) — Werkzeug 146,35 steht.
- R6 Doppelter Kommentar vor ghoul_decal: B entfernt.
- R7 neue Decal-Regel (Rim <= 15 %, Bodenkante >= 4) im Werkzeug ergaenzen: Nachzug-Agent NACH den Zeichnern (G-L).
- R8 check_gfx6_art Rost-Zeile ERLAUBT -> [[20,18]] (§5(3) zweite Beruehrung, "Rost-Commit"): Nachzug-Agent, vor dem Kunst-Commit.
- R9 Rost-Decal jetzt behavioral belegt (FLUESTERGRUFT God-Kill, 28 Ticks, Δ 0/0): Engine-Beweis-Notiz korrigieren.
- R10/R11 M4-Warnung 237 vs 275, d3/g6_01-Drift: deklariert, kein Gate.
- Reserven fuer r2: Warden Walk-Diff +0,9/+0,5 pp, Hund +3,8/+2,4 pp (A gewarnt).
- Zeitnotiz: Uhrzeiten in fruehen Notizen dieses Abschnitts waren geschaetzt (zu hoch); reale Zeit V-TESTS-Ende 18:35 UTC.
## Fix-Runde 1 — Zeichner B FERTIG (12.09. ~20:45 UTC)
- Ghul: Rim 5 Segmente (max Lauf 3), Schaedel 75 Texel H/3, ghoul_die 3 Konturtoene + Ton-Spiegel 42,9; G5 gruen; Ghul 11/12. Rost: kein '|' mehr, Rim '_' Helmkuppe + '6' weiche Kante, Schwarz 22,95; Decals mit k-Bodenkante, Rim 9,1 % / 0 %. Doppelkommentar-Ursache (Mutex-Schreiber) behoben.
- ENTSCHEIDE: (1) Ghul-Lumpen 'd' 64,9 % > 55 %-Einzelton-Deckel DEKLARIERT (Grund: Koerper-L-Band 105..113 mit 75-Texel-Schaedel bei ~172 L erzwingt dunkle Lumpen; G7 beim Ghul ohnehin ueber die Schaedel-Ausnahme rot) — ein roter Gate statt zwei. (2) Ghul-Arme auf Kniehoehe DEKLARIERT (jede Zeile mehr reisst P1 Gh/Ro auf 61,3). (3) Tafel B 81,35 % akzeptiert (Preis des warmen Rost-Rims; Frost-Befund war schwerer). (4) Ghul-Silhouetten-Spiegel 98 informativ — V-SPEC r2 prueft, ob die ungleichen Schultern im Bild noch tragen. (5) G12-Erweiterung (Rim <= 15 %, Bodenkante >= 4) -> Nachzug-Agent nach A.
## Fix-Runde 1 — Zeichner A FERTIG (12.09. ~21:20 UTC) + Nachbesserung Knaeuel
- A: Decals als Leichen (Rim 4,8/6,7 %, Bodenkante k bzw. '{'), Skelett Gesicht nur '/', Schultern 10 px, Koerper-L 123,95, Skelett 12/12; Hund Sehne an Rumpf-Oberkante (zweites Paar reisst G2/G4 -> gestrichen); Warden Saum 3 Zeilen. Read-Hook-Ausfall ~5 min, mit ASCII-Vorschau ueberbrueckt, alles danach als Bild gesehen.
- BEFUND Tafel B 76,8 % (< 80): Fable-Diagnose (hb_diag.mjs, Kopie des Tools mit Kanten-Aufschluesselung): 77 nicht getrennt = skeleton/skeleton 40 ('$$' 32, '//' 8), ghoul/ghoul 24 ('dd'), rust/rust 8, ghoul/skeleton 5 ('/H' dL 18). Gleiche Sorten trennen nur ueber Rim oder dL >= 25.
- ENTSCHEIDE: (1) A: Rim '_' auf Oberkante des erhobenen Arms + ungleiche Armkanten ('/' erhoben, '$' haengend) -> Kontakt dL 30. (2) B: ungleiche Ghul-Armkanten ('<' vs 'd') -> dL 35. (3) DEKLARIERT: Skelett-Knochenflaeche Einzelton '/' bis 70 % (zwei brauchbare Stufen; '"' liest blau, '$' Fleisch) — Decal-Umweg fuer den Deckel entfaellt. (4) Horden-Tool zaehlt Rim = harte Toene C/_/| (RIM_TOENE_ALLGEMEIN); messung G3 zaehlt deklarierte Material-Rims (Rost '_'+'6' auf der Kontur) — beide Lesarten deklariert, nicht angleichen (Rost kann G3 mit harten Toenen nach E-B9-Aenderung nicht erreichen). (5) Zeichnerische Schaetzung: 32+24 Kanten gewinnbar -> ~90 %.
- B Nachbesserung FERTIG (~22:20 UTC): A/B-Reihe zeigte, dass die RECHTE Ghul-Flanke den Nachbarn beruehrt -> rechter Arm '<' (hell), linker 'd' + 5 Flankentexel dunkler fuer G8; Tafel B 81,63 % (271/332), Ghul 11/12, Silhouette unveraendert. Fable-Sichtkontrolle: Read-Werkzeug (Bild) faellt aktuell mit PreToolUse-Hook-Timeout aus ("host client may be unreachable" = IDE-Client weg); Textgrid geprueft: Aenderungen sind reine Tonwechsel, Struktur (Schaedel H, Rim-Segmente Zeile 0/6, Arme) intakt. Bild-Sichtungen (V-SPEC r2, Blind-Juror 3) erst wieder moeglich, wenn Read auf PNG antwortet — vorher testen.
- A Nachbesserung FERTIG (~22:40 UTC): die 32 Sk/Sk-Kanten waren Rumpfkante (Sp. 11) gegen haengenden Arm des Nachbarn (Sp. 3), nicht die Armkanten -> rechte Rumpfkante Zeilen 6-9 auf '/', Rim auf Oberecke des erhobenen Arms, Decal-Lichttexel zurueck. Tafel B 91,3 % (303/332), A 85,8 %, D 100 %. Skelett G7 MAXTON 59,3 (deklariert <= 70), Halbseiten 4,99 (rechts heller; asymmetrischer Brustkorb wie Held-Sel-Out — innerhalb 6,5; V-SPEC r2 prueft Flip-Bild). DEKLARIERT: Skelett-Rumpf mit hell/dunkel-Kanten (Sel-Out-Logik), Halbseiten-Schwelle bleibt das Gate.
- NAECHSTER SCHRITT: Nachzug-Agent (Werkzeug): G12 +Rim<=15 %/+Bodenkante>=4; shield ohne G7; DEKLARATIONSLISTE im Werkzeug (Hund Hue 19,2; Rost Hue 12; Warden G4 dash/G7/G11; Schild G7; Ghul G7 Schaedel 2 Stufen + d 64,9; Skelett MAXTON <= 70) mit zweiter Bilanz "gruen oder deklariert"; check_gfx6_art Rost [[20,18]]. Dann V-TESTS r2; V-SPEC r2 + Juror 3 sobald Read auf PNG geht.
## Werkzeug-Nachzug Runde 2 (12.09. ~23:20 UTC) — Entscheide
- Zweite Bilanz 64/64 akzeptiert (Schild G7 ausgenommen statt deklariert). Deklarationsrahmen des Agenten ratifiziert mit zwei Verschaerfungen: Ghul MAXTON-Deckel bleibt 90 (deckt Schaedel-Akzent H 86,7; Lumpen 66,5 dokumentiert, Erwartung <= 70 in der Doku), Warden 90 -> 75 (Guertel 70,2); Hund Hue-Untergrenze 19, Rost 10, Skelett 70 bleiben. Warden G4 nur warden_dash; G11 nur knochen_b. Erste Bilanz bleibt das harte Urteil (57/64).
- check_gfx6_art Rost [[20,18]] = §5(3) zweite Beruehrung erledigt (Negativkontrolle 16 breit -> ROT 3).
## V-TESTS r2 (12.09. ~22:45 UTC) — GRUEN nein: M3 skeleton_0 K3 3,11 (< 6,0) + Fern -2,12
- Ursache: eigene Halbseiten-Neigung -4,99 (rechte Rumpfkante '/', Gesicht '/') laeuft mit dem Szenenlicht (rechts). Alles andere gruen (Bilanzen 57/64 + 64/64, Paar-Gates, Tafel B 91,27, Decals 6/6 Pruefungen, Sperrlisten 0 rot, Konserve byte-gleich, M1/M4/M5 gruen).
- ENTSCHEID: Kanten bleiben (Knaeuel-Trennung; '$'/'/' trennt auch ueber dE00 21,5), Haelften INNEN ausgleichen auf |dL| <= 2,0 (skeleton_0); optional rosa Arm + getrennte Augenhoehlen (Cast-Juror). A per SendMessage. Danach V-TESTS r2b: M3 + Halbseiten + Suiten + Tafel B, dann COMMIT.
- Restpunkte akzeptiert: duenne Reserven (Rost G8 85,21; G12-Bodenkanten exakt 4) dokumentieren; Anker-Kontrolle mit Nachher-Tabelle ist stumpf (nur mit IST-Tabelle aussagekraeftig); V-SPEC-KS 66,3 nicht reproduzierbar (52,56 in beiden Formeln) -> V-SPEC-Zahl verworfen.
## V-TESTS r2b (~23:25 UTC): nur M3 K3 skeleton_0 4,64 rot (Helligkeit, nicht Asymmetrie). ENTSCHEID: DEKLARIERT P1-D11 (dWarm 51 / Fern gruen / Held 17,4; Abdunkeln = Khaki-Kritik verstaerken). COMMIT JETZT. CH-3-Notiz: M3-Messfigur ghoul_0 (Sanktion).
