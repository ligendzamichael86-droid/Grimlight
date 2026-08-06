# SPEC Grafikpass 5 — "Wurzeln & Raster" (Ziel: Median 8 = Block-Ende)

Stand 14.07.2026, Hauptloop (Fable). **REVISION 2** nach adversarialem
Review (3 Opus-Prüfer: 7 Blocker, ~25 Majors — alle eingearbeitet;
Protokoll wf_2f1743d2). Bindend. Grundlage: design/GP4_RUNDE3_JURY.md,
Landkarte wf_3c834f60, grüne Basis 335b269.

GESTRICHEN gegenüber Rev. 1 (Review-Entscheide, der Jury deklarieren):
- Fackelscheiben-Bake (D2 alt): Detektor-Kollision, Bayer im
  Whitelist-Rahmen nicht legal, hätte den Anti-Kornkreis-Jitter
  gekillt. Kegel bleibt arc-basiert (bereits 6 Stufen) — die
  Raster-Sprache zeigen Vignette + Lit-Dither.
- Zweiphasen-Over-Zeichnung: hätte die GP4-Back-Kronenreihe in den
  dichten Spalten ausgelöscht. Der sichtbare Schaden war der
  Stahlblau-Defekt — der wird in Art gefixt (§1.1).
- fringeSource für Steinboden: hätte Gras-Fransen über die ganze
  Gruft gelegt. Rohkanten schließt allein shoreEdges (§3.B1).
- Teich-rows-Umformung: bleibt gesperrt (GP4-Sanktion verbraucht;
  §3.B1-B3 beseitigen die sichtbaren Treppen ohne Hash-Zyklus).

MEILENSTEIN-LOGIK: Median >= 8 in irgendeiner Runde → Block-Ende.
Nach Runde 3 < 8 → Eskalation an Michael (kein Auto-GP6). Max. 3
Runden. Hauptloop committet nach jedem grünen Stand (GP4-Lehre 4).

## 0. Eiserne Regeln

1. Kanonische Flusstests (check_main/check_inventory/check_boss):
   NULL Änderungen. Ambient 0.45/0.78/0.85/0.66 eingefroren.
   ambientAlpha-Detektor: lighting.js:66 bleibt der EINZIGE
   Teilalpha-fillRect auf einem Nicht-Main-Canvas. Overlays/Bakes
   auf Offscreens nutzen rgba-fillStyle bei globalAlpha=1.
2. tools/smoke_test.mjs: NUR Katalog §6. fringeOverlays ist
   byte-eingefroren (smoke ~1905-1950) — ALLE Neuerungen leben in
   NEUEN Funktionen; shoreEdges/bankOverlays emittieren NUR für
   Kanten, die fringeOverlays NICHT bedient (Komplement-Regel §3).
3. Canvas-Whitelist wie GP4; drawImage bei Licht/Overlays nur
   3-Argument; Composite-Hygiene (expliziter Reset) nach jedem
   lighter/destination-out-Block.
4. HASH-DISZIPLIN: kein Math.random/Date.now in world/+art/ (auch
   Kommentare). Neue Hashes = variantIndex mit VERSETZTEN Koordinaten,
   UNGERADE n, TEILERFREMD zu allen anderen n am selben Ort (Jitter
   nutzt n=5 → nie n mit Faktor 5!). Gras-Pool n=47 (prim).
5. map_fluestergruft.js-Tabu AUFGEHOBEN, eng: erlaubt sind
   '~'↔'.'-Silhouetten-Tausche (beide solid:false — sol/geo-neutral,
   Integrator beweist), torch-anim auf 3 Frames, bankSet-Flag und
   UNGERADE-n-Umbau der variants-Listen. VERBOTEN: Spawns/Portale/
   Fackel-Zellen/solid/fringeSource-Änderungen.
6. NULL Golden-Hash-Änderungen im ganzen Pass.
7. Palette: 61 Alnum + '='/'+'/'*', fix. Gilt für art/-Grids;
   hud.js arbeitet mit freien Hex-Werten (Bestandspraxis).
   Namespace-Warnung: 'C' = Legenden-Zeichen UND Palettenton.
8. .tmp/check_gfx5_art.mjs ERSETZT check_gfx4_art.mjs und
   PORTIERT dessen Wächter (Palette 61+3, Maße, Ghul-Rim,
   '='-Zählung, mix75, Back-Rampe) — NUR das Innenfeld-Gebot
   (gfx4:92) entfällt; NEU: Gras-Pool-Gates (§2), n-UNGERADE-Wächter.
9. Port 8123 tabu; Agenten 8124. Kein Agenten-Commit.
10. Tabu: entities/, items/, ui/ außer hud.js, core/ außer
    lighting.js+particles.js. Idle-/Hit-Animation + Kanal-Affordanz
    VERTAGT auf Pass 6 (entities-/Gameplay-Tabu — Jury-Deklaration).

## 1. Prio-0-Defekte (Runde-1-Pflicht)

1. STAHLBLAU: sprites.js:4060/4093/4129 ('C'-Zeilen) + 4073/4106/4142
   (abgelöste '*'-Balken). FIX: 'C' → **NUR 'E'** (#253522 — 'a' wäre
   zu hell und erzeugte den Defekt neu, Review), BEIDE Liniengruppen
   in konturgebundene 2-5px-Läufe mit Lücken brechen.
2. FUNKEN: particles.js:157-158 → fillRect(sx, sy-1, rs, 1) /
   fillRect(sx, sy+rs, rs, 1) (Ecken frei); Ring NUR bei size===1;
   Nachzieher (170-174) entlang Geschwindigkeitsvektor.
3. DOPPELPFEIL: floor_decal_bones (sprites.js:3814-3831) NUR IM GRID
   neu (Knochen-Häufchen, asymmetrisch). map_bosskammer.js-rows tabu.
4. HUD: hud.js:34 Grundfläche auf **1.0** Deckkraft (0.9 ließe die
   Klage bestehen — Review); Außen- UND Innenbevel unten/rechts von
   #14101a auf #3a3542 (beide Vorkommen: hud.js:216-218 + ~:57/:67).
5. BOSS-BALKEN (hud.js:172-220, einziger Pfad): bh 8→12 (Kollisions-
   frei belegt: Panel endet x=56, Balken (120,7)), Rahmen auf
   lesbaren Mittelton (~#575061), Ticks STREICHEN, 3-Band-Gradient
   behalten, Eckpixel frei. Pflicht-Crop §7 nutzt (116,3,206,21).
6. TON-WAISEN: shore-'n'-Tupfer IM WASSER → 'w'/'k' (auf LAND-Seite
   in §3.B2-Bändern bleibt 'n' erlaubt — dort ist er Schatten);
   Hund-Auge 'r'-Höhle + 'R'-Pupille; Trank-Glanz → warme Rampe;
   heart_full-Ton-Symmetrie herstellen.
7. LIT-DITHER-WASSERFILTER: litDitherCells bekommt OPTIONALEN
   6. Parameter `isLit(tx,ty)` (fehlt er → Verhalten wie heute; die
   Smoke-Direktaufrufe 1954-1962 mit 5 Argumenten bleiben grün).
   createTilemap exportiert dafür zusätzlich `defAt(tx,ty)` (additive
   API). main.js übergibt einen Filter, der Wasser-/anim-Kacheln
   ausschließt.
8. FLUESTERGRUFT-Fackeln auf torch_wall_0/1/2 (3 Frames).

## 2. Paket A — Flächen-Pipeline

A1. GRAS-POOL: .tmp/gen_grass_gp5.mjs (Engine-B) erzeugt **47**
    einzigartige 16×16-Kacheln (prim; teilerfremd zu 5), Ausgabe als
    TEXTBLOCK nach .tmp/grass_g5_grids.txt — der ART-Agent fügt sie
    in sprites.js ein (Besitz-Regel; Build-Reihenfolge §8: Generator
    läuft in PHASE 0 vor dem parallelen Build). Keys
    grass_g5_00..grass_g5_46.
    DICHTE-VERTEILUNG statt Uniform (Review: uniform wäre selbst ein
    Rastersignal und widerspräche der Juror-Leer-Regel): ~16 Kacheln
    SPARSE (0-2 Glyphen, Deckung 1-6 %), ~16 MITTEL (3-5 Glyphen),
    ~15 DICHT (6-8 Glyphen, bis 18 %); Kachel-Mittel 8-14 %.
    Glyphen-Alphabet >= 6 Formen (Halm 3-4px mit hellem Kopf-/dunklem
    Fußpixel, Büschel, Speck, Nest-Motiv über 2-4 Glyphen — Nester
    innerhalb der Kachel, Grenz-Nester sind mit variants nicht
    machbar: Jury-Deklaration), Positionen per dekorreliertem Hash,
    PARITÄTS-REGEL NUR AUF GLYPH-PIXEL (nicht Gesamtfläche — Review:
    sonst arithmetisch unerfüllbar). RANDREGEL statt Kantenschnitt:
    Glyphen enden >= 1px vor der Kante, ABER ein 1-2px-e/E-Rausch-
    Saum füllt den Rand (kein leerer Rahmen, keine geschnittenen
    Halme — Review: Schnittkanten hätten das 16px-Gitter verstärkt).
    Verdrahtung: '.'-Legende art auf grass_g5_00 + variants = alle 47
    (variants[0]===art!). ZUSÄTZLICH werden ',' und 'e' (65 Kacheln)
    auf UNGERADE Teil-Pools verdrahtet (Dichte-Naht vermeiden);
    die Wiesenlicht-Familie H/L/I/J/i/x behält ihre Misch-Grids.
A2. UNGERADE-n-SWEEP (Wurzel-Fix ÜBERALL — Review fand 1.757 weitere
    Kacheln auf geradem n): JEDE variants-Liste mit geradem n in
    ALLEN vier Map-Legenden bekommt UNGERADE n durch je EINE
    zusätzliche Variante (Art liefert): CATACOMBS '#' 10→11,
    CATACOMBS '.' 4→7 (Kiesel-/Kratzer-Programm aus Rev. 1),
    FLUESTERGRUFT '#' 4→5 und '.' 4→5, BOSS_KAMMER '#' 4→5 und
    '.' 4→5, GRAVEYARD '=' 4→5, 'u' 2→3. check_gfx5_art wacht:
    KEINE variants-Liste mit geradem n.
A3. PATCH-RÄNDER: Erosions-Varianten der MIX-Kacheln (ungerades n);
    Per-Pixel-Maske bleibt abgelehnt (Jury-Deklaration).

## 3. Paket B — Wasser: Ufer statt Bitmask

B1. shoreEdges(getDef, tx, ty) — NEUE reine Funktion (tilemap.js):
    emittiert für shorePrefix-Wasserkacheln zusätzliche Ufer-Keys
    NUR für orthogonale Nachbarn, die WEDER Wasser sind NOCH
    fringeSource tragen (= exakt die 24 rohen Kanten: Steinboden,
    Weg, Stamm, Fackelfuß — KOMPLEMENT zu fringeOverlays, nie
    Doppel-Emission, GP4-Konkav-Fix unberührt). Emissions-Familie ist
    IMMER 'shore_*' (unabhängig vom shorePrefix — die shore-Kacheln
    sind material-agnostisch/rein wasserseitig, und smoke:1809
    [wet_-Regex] bleibt unberührt). Aufruf im Ground-Pass NACH
    fringeOverlays, additiv.
B2. bankOverlays(getDef, tx, ty) — NEUE reine Funktion + Zeichenpfad
    für LAND-Kacheln mit Wasser-Orthonachbar. Material via NEUEM
    Legenden-Flag `bankSet: 'g' | 's'` auf der LANDKACHEL (Engine-B
    setzt: GRAVEYARD Gras/Weg = 'g'; FLUESTERGRUFT Steinboden = 's';
    Ziegel-WÄNDE bekommen KEIN Flag → kein Band auf Wänden — Review).
    Kein Flag/kein Key → still nichts zeichnen. Keys bank_n/e/s/w +
    4 Ecken je Satz: bank_*_g (Schlamm z/p/v/M + Schatten n/k),
    bank_*_s (nasse Steinkante t/T dunkel + n/k — KEIN Schlamm auf
    Stein). Inhalt: 3px Uferschatten + 2px Material-Rampe, gedithert.
B3. DIAGONAL-KAPPEN: 8 ADDITIVE Cap-Keys shore_cap_nw/ne/sw/se +
    shore_cap_wn/en/ws/es (16×16, nur die diagonale Verlängerungs-
    Ecke gezeichnet, Rest transparent) — von shoreEdges ZUSÄTZLICH
    über die (weiterhin von fringeOverlays kommende) gerade Kante
    gelegt, wenn die Diagonal-Nachbarschaft es verlangt (die 5
    Teich-Treppen-Zellen + Kanal-Fälle). Kein Ersetzen, kein
    Doppel-Draw desselben Keys, keine Freeze-Berührung.
B4. REFLEXION NUR IM KANAL (Review: am Teich geometrisch unmöglich —
    einzige Teich-Fackel liegt nur diagonal am Wasser; Jury-
    Deklaration): waterReflections(lights, defAt, cam, timeSec) →
    Zellen orthogonal fackelbenachbarter WASSER-Kacheln; main.js
    zeichnet water_reflect_0/_1 (2 Intensitäten, 16×16, warme
    geditherte 2-3px-Säule) per 3-Arg-drawImage + 'lighter',
    ganzzahliges ±1px-Wackeln, Composite-Reset. KONSISTENZ-Regel zu
    §1.7: warme Texel auf Wasser sind GENAU die waterReflections-
    Zellen (Gate §7).
B5. KANAL: Silhouette hash-frei entrechteckigen (2-3 '~'↔'.'-Tausche
    je Komponente); R3-Glanzstriche auf VERTIKAL drehen (Fließachse,
    Drift-Signal erhalten); Sparkle-Partner-Regel.
B6. TIEFEN-KONTRAST (3 Bänder geometrisch unmöglich — Deklaration):
    water_shallow +1 Stufe heller, water_mid/_calm −1 Stufe dunkler;
    Kopplungs-Check beide Maps (geteilter Key!).
B7. KLEINTEILE (Jury-Reste): Eck-Schaumlinie auf den 8 Bestands-
    Ecken-/Konkav-Kacheln (aus GP4 vertagt); Zaun 'f' bekommt
    Pfosten + Kontaktschatten; Heckenkanten-1px-Kontur an
    Gegner-berührenden Kanten war R2-K4 — Heckenkacheln erhalten
    unten eine 1px-Schattenkante.

## 4. Paket C — Kronen

C1. ART (6 Front-Grids): 4-Wert-Rampen-UMVERTEILUNG (2px-Lichtband +
    Cluster-Highlights NUR oben-links, 3px Kernschatten + Tiefstton-
    Kontur unten-rechts, 3-4 Klüfte), Sichtfenster als versetzte
    Läufe statt Rechtecke; Back-Kronen §1.1.
C2. ENGINE (tilemap.js) — EXAKTE FORMELN (beide Agenten spiegeln sie
    wörtlich; Engine-A implementiert, Engine-B testet):
    dxRaw = variantIndex(tx + 1013, ty + 571, 29)   // prim, ≠5er
    dx0   = dxRaw - 14                              // -14..+14
    dx    = clamp(dx0, -W, +W)  mit W je ANKER-KLASSE:
            Back (Y/Z/A): W=14; Front ohne Stammdeckung: W=14;
            Front _b/_bm: W=6; Front _a/_am/_c/_cm: W=2.
            (Klassen-Zuordnung über das Anker-Zeichen — Tabelle in
            der Legende/Konstante, Engine-A dokumentiert sie.)
    dyRaw = variantIndex(tx + 421, ty + 907, 17); dy = dyRaw%9 - 4
            // -4..+4 (Review: ±8 riss die Krone vom Schatten)
    Der canopy_shadow-Zeichenpfad (tilemap.js ~:290-309/:423-426)
    wendet DENSELBEN dx/dy an (Schatten bleibt unter der Krone).
    CULLING (NUR Over-Zweig, korrekte Zeilen): die ENDEN liegen in
    tilemap.js:382-383 (tx1/ty1, bereits geklammert); nötig ist
    txStart um 1 WEITER LINKS (dx>0 zieht Anker von links herein —
    Review-Rechnung) und tyEnd um +1 (dy<0), BEIDE weiterhin auf
    0..wTiles-1/hTiles-1 geklammert, NUR wenn over (der Ground-Zweig
    teilt die Schleife — ungeklammert wäre cells[hTiles] ein Crash).
    Sanktion: §6#1.
C3. OVER_ROWS-GENERATOR (.tmp/gen_crowns_gp5.mjs, Engine-B):
    Spaltenraster brechen (tx/tx±1 alternierend), Zeilenschritt
    {2,3} gemischt, nie zwei schmale Silhouetten benachbart,
    DRITTES Cluster in der Kartenmitte — GUARDS (Review): Zeile 12 /
    Spalte 21 des Test-Fensters bleiben LEER (smoke:651-656 bildet
    das Fenster hart ab — Cluster liegt bei ty>=13), Mittel-Füller
    ('C'/'K') über begehbaren Wegen so, dass Kronenpixel den
    KOPFBEREICH des Spielers überlappen (Overlay auf der Kachel ÜBER
    der Standkachel).
C4. SWAY-PHASE (Engine-A, tilemap.js artFor-Stagger ~:359): für
    NICHT-synchrone anim-Kacheln Phase aus
    variantIndex(floor(tx/2)+331, floor(ty/2)+733, 7) statt
    (tx*13+ty*7) — 2×2-Cluster schwingen GLEICHSINNIG, Cluster
    untereinander versetzt (Review: die alte Formel erzeugte in den
    2×2-Sway-Clustern perfekte Antiphase — deshalb war im Strip
    nichts zu sehen). Wasser (animSync) unberührt.
C5. BEWEIS-SZENE g5_10_unter_kronen.

## 5. Paket D — Licht & UI

D1. VIGNETTE quantisieren (hud.js:341-363): 6 Stufen + Bayer-4x4 an
    den Bandgrenzen, gebacken per rgba-fillStyle bei globalAlpha=1
    (Detektor-sicher; Bake läuft ohnehin lazy im Titel-Frame und im
    Spiel NACH lighting.draw — verifiziert).
D2. STUFEN-VEREINHEITLICHUNG: litDitherCells 0.45/0.75 → 0.40/0.70
    (Sanktion §6#2).
D3. MOTES-LICHTFAKTOR: particles.draw(ctx, camera, frameLights,
    ambient) — Signatur-Erweiterung testneutral (§36 ruft draw nie);
    Mote-Alpha × Lichtfaktor, FLOOR 0.25; Funken bewusst
    lichtunabhängig (Glut — Deklaration).
D4. BOSS-ARENA-LICHT (Jury STRUKTUR-6a, Review-Mahnung): NEUES
    mapDef-Feld `extraLights` (BOSS_KAMMER: 1 Füll-Licht im Zentrum,
    flicker 0.5 — unter der 0.8-Schwelle: KEIN Warm-Glow, KEIN
    Lit-Dither, kein Schmier); main.js hängt extraLights an
    frameLights an. geoHash-frei (hasht nur torchChars-findTiles).
D5. LICHTRICHTUNG oben-links: Abweichler-Liste; WARDEN nur
    idle/walk_0/walk_1 (Rest vertagt — Deklaration).
D6. XP-1px-Anfangs-Schimmer; GOLD-Doppel-Draw (verifiziert sicher:
    Flusstests nutzen find/startsWith).

## 6. Tests — EXAKTER Katalog

1. #1 smoke ~1832-1840: Anker-Formel/-Bereiche auf das §4.C2-Schema
   (WÖRTLICH die Formeln oben; Determinismus bleibt; Culling-Test
   1840 auf die neuen Fenster angepasst).
2. #2 smoke ~1954-1981: Radien 0.40/0.70; Direktaufrufe mit 5 Args
   MÜSSEN grün bleiben (Filter-Param optional!); ADDITIV:
   Filter-Assertion (mit Filter keine Wasser-Zellen).
3. #3 smoke §16 additiv: grass_g5-Zählung >= 47 (Präfix), bank_*_g/s,
   shore_cap_*, water_reflect_0/_1, neue A2-Varianten.
4. #4 additive NEUE Tests: (a) shoreEdges-Komplement (synthetisch:
   fringeSource-Nachbar → KEINE Emission; Steinboden-Nachbar →
   shore_key; Diagonal-Fall → Cap-Key); (b) bankOverlays (bankSet-
   Logik, Wand ohne Flag → leer); (c) waterReflections-Determinismus
   + nur-Wasser; (d) Sway-Cluster-Gleichphase (2×2 → identische
   Phase); (e) n-UNGERADE-Wächter über alle Legenden-variants;
   (f) defAt-Export.
5. Varianten-Integritäts-Regel beachten: '.'-art wird grass_g5_00
   (variants[0]===art — Review).
6. check_gfx5_art.mjs laut §0.8 (portierte Wächter + neue Gates).
7. Kanonische Flusstests NULL; Golden-Hashes NULL (Integrator beweist
   die Kanal-Neutralität explizit).

## 7. Proof .tmp/shot_gfx5.py

0. ARCHIV ZUERST: g4_* + strips nach gp4_final/ KOPIEREN, dann erst
   rendern (Review: stand nur in §9).
1. settle_camera + Ganzzahl-Assertion in ALLEN Szenen (teleport
   snappt auf ganzzahlige Kamera; bei Verletzung FEHLER).
2. crop_zoom + PFLICHT-CROPS (6x, Welt-Rects): (a) Ost-Baumspalte
   (592,110,624,190); (b) Teich-Wasserkachel (480,256,512,288);
   (c) HUD Screen (0,0,60,46); (d) Boss-Balken Screen (116,3,206,21);
   (e) Boss-Dekal Tile (14,5) → (216,72,264,104); (f) Katakomben-
   Ziegel (Szene g5_03, Rect um eine '#'-Wandfläche, Proof-Agent
   dokumentiert das gewählte Rect in der JSON); (g) Teich-Ufer-Band
   Südrand (an der bank_*-Kante, Rect dokumentiert); (h) FUNKEN-
   Nahaufnahme (GP4-Lehre 6 — Partikel-Änderung braucht Crop-Beweis);
   (i) KANAL-Reflexion (Fackel-Wasser-Zelle, Rect dokumentiert).
3. STRIPS 6-8 Panels via Zeit-Sampling (Wasser 8 Zeitpunkte über 2
   Zyklen, Flamme 6, Sway 8). SWAY-GATE: pro SICHTBARER w/y-Kachel im
   Strip-Fenster ändert sich das 16×16-Texel-Fenster zwischen
   Panels UND die Cluster-Kacheln bewegen GLEICHSINNIG (Vorzeichen
   der Verschiebung identisch).
4. Gates: Teich-Fenster 1,5-15 % über 9-LAUF-MODUS; Kanal-Residuum
   abwärts; Funken >= 10 %; Lit-Texel; REFLEXIONS-Gate: warme Texel
   auf Wasser ⊆ waterReflections-Zellen ∪ Kanal-Fackelnähe (und > 15
   Texel im Reflexions-Crop); 0 Konsolen-Fehler.

## 8. Build-Ablauf & Jury

PHASE 0 (Engine-B, nur .tmp): gen_grass_gp5.mjs erzeugt
grass_g5-Textblock (+ gen_crowns_gp5-Probelauf). PHASE 1 parallel:
ART (fügt Pool ein; §1-Defekte, §2-Zusatzvarianten, §3-Kacheln
bank/caps/reflect, §4.C1, §5.D5) + ENGINE-A (tilemap: shoreEdges,
bankOverlays, waterReflections, defAt, Lit-Filter, Anker-Offset+
Culling+Schatten-Kopplung, Sway-Phase; lighting: nichts außer
Bestand; particles §1.2+D3; hud §1.4/1.5/D1/D6; main.js: Reflex-
Block, draw-Signatur, extraLights, Lit-Filter-Callback). PHASE 2:
ENGINE-B (Legenden/bankSet/A2-Verdrahtung, OVER_ROWS-Generator,
map_fluestergruft-Änderungen, extraLights-Felder, smoke-Katalog §6,
check_gfx5_art). PHASE 3 Integrator (Kopplungen: Pool↔variants,
bank↔bankSet, caps↔shoreEdges, reflect↔waterReflections,
Formel-Spiegelung C2↔#1; Golden-Hash-Neutralitätsbeweis). PHASE 4
Proof. Jury: 3 direkte Opus-Agenten, Anker 6,5/7,0/7,5-Verlauf,
GP4-final-Archiv als Vergleich, ALLE Crops+Strips.
ZU DEKLARIERENDE ENTSCHEIDE (vollständige Liste): keine Bitmask
(0-Kacheln-Beweis), kein Per-Pixel-Patch, keine Teich-rows-Umformung
(Treppen via Ufer/Caps), keine 3-Band-Tiefenrampe (Geometrie),
Reflexion nur Kanal (Geometrie), Kegel bleibt arc-basiert, Funken
lichtunabhängig, WARDEN-Lichtkante nur 3 Posen, Nester nur
kachelintern, Kanal behält Strömung, Idle/Hit+Kanal-Affordanz Pass 6.

## 9. Datei-Besitz & Interface

| Agent | Dateien |
|---|---|
| Engine-A | world/tilemap.js, core/particles.js, ui/hud.js, main.js (Blöcke: Reflex, extraLights, Lit-Filter, particles-Aufruf) |
| Engine-B | world/maps.js, world/map_fluestergruft.js, world/map_bosskammer.js (NUR mapDef.extraLights), world/map_catacombs-Legenden falls separat, .tmp/gen_*.mjs, tools/smoke_test.mjs (§6), .tmp/check_gfx5_art.mjs |
| Art | art/sprites.js, art/palette.js (Kommentare) |
| Proof | .tmp/shot_gfx5.py, Screenshots, Archiv gp4_final/ |

Interface eingefroren: grass_g5_00..46; bank_n/e/s/w/ne/nw/se/sw
je _g/_s (16 Keys); shore_cap_nw/ne/sw/se/wn/en/ws/es (8);
water_reflect_0/_1; A2-Zusatzvarianten (Namen wählt Art, Engine-B
liest sie aus sprites.js); Signaturen: shoreEdges(getDef,tx,ty),
bankOverlays(getDef,tx,ty), waterReflections(lights,defAt,cam,
timeSec), litDitherCells(...,isLit?), particles.draw(ctx,camera,
frameLights,ambient), defAt(tx,ty). C2-Formeln WÖRTLICH aus §4.

## 10. Abnahme

Wie GP4 §8 plus: NULL Golden-Hash-Änderungen bewiesen; alle 9
Pflicht-Crops; Sway-Gleichphasen-Gate; Reflexions-Gate; Notenverlauf;
bei >= 8 Block-Ende-Vermerk; nach R3 < 8 Eskalations-Dossier an
Michael (Verlauf, verbleibende Deckel, Zuschnitt-Optionen).
