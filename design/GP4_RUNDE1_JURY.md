# Grafikpass 4 — Jury-Ergebnis Runde 1 (13.07.2026)

Skala: 10 = moderne Handy-Pixel-Art, SoM = 8,5-9, gutes SNES = 6.
Anker: GP2 ≈ 4,5-5; GP3-final = 6,5.

**Noten: 7,0 / 7,0 / 7,0 → MEDIAN 7,0** (einstimmig; alle
bilder_gelesen=true; 16 Bilder je Juror inkl. gp3_final-Vergleich).
Block-Ziel 8 nicht erreicht → Runde 2. Verlauf: 6,5 → 7,0.

## Kriterien-Matrix (Handwerk / Komposition / Moderne)

| Kriterium | H | K | M |
|---|---|---|---|
| K1 Flächen | 6,5 | 6,5 | 6,5 |
| K2 Wald/Kronen | 6,5 | 7,0 | 6,5 |
| K3 Wasser | 5,5 | 6,5 | 6,5 |
| K4 Sprites/Props | 6,0 | 7,0 | 7,0 |
| K5 Kohärenz | 7,0 | 7,0 | 6,5 |
| K6 Moderne | 6,5 | 7,5 | 7,0 |

Einhelliges Lob: organische Teichkante ("Fortschritt real"), zweite
Kronenreihe + Carving ("erstmals echte Tiefe"), Ghul ("Gewinn der
Runde", "beste Gegner-Silhouette"), Licht-trifft-Textur ("genau
richtig gemacht"), vereinheitlichte Weichschatten ("wie eine Familie").
Einhellige TOP-3-Deckelung (alle drei Juroren, fast wortgleich):
1. WIESENLICHT-PATCHES lesen als scharfkantige achsparallele RECHTECKE
2. WASSER-Innenfläche zu NOISIG (Kritzel/Gräten-Hatch ohne Ruhezonen)
3. BOSS-DECALS = "volle dunkle Quadrate", "größter Einzelfehler des
   Passes" (lesen als Löcher/Fehltiles)

## Juror-Anweisungen WÖRTLICH

### Wiesenlicht-Patches (K1, alle drei)

- K: "Jede Patch-Kante über 4-6 px mit 2×2-Schachbrett-Dithering in
  den Grundton überblenden UND die Patch-Silhouette tile-quantisiert
  unregelmäßig machen — keine Kante darf länger als 3 Tiles gerade
  laufen (pro Patch mindestens 2 Konkav-Einbuchtungen)."
- H: "je Rand-Tile einen 4-6 px tiefen unregelmäßigen Übergang aus
  2-3 Clustern (2×2/3×2 px) der Nachbarhelligkeit einstreuen."
- M: "Pro Patch-Farbe 4 Rand- und 4 Ecken-Übergangstiles [...]
  2px-Dither-Schachbrett (50 %) [...] jede Patch-Kante um 1 Tile
  versetzt ausfransen (kein Patch-Rand länger als 3 Tiles gerade)."
- ENTSCHEID Hauptloop: EIN orientierungs-agnostisches 50 %-Dither-
  MIX-Tile je Patch-Farbe (grass_lumahi_mix / grass_lumalo_mix,
  Schachbrett hi↔Basis bzw. lo↔Basis) statt 8-16 gerichteter
  Kanten-Tiles; der Generator belegt ALLE Patch-Randzellen damit und
  formt die Silhouette unregelmäßig (max. 3 Tiles gerade, >= 2
  Konkav-Einbuchtungen je Patch). Erfüllt alle drei Intentionen mit
  2 statt 16 neuen Keys.

### Wasser (K3; H 5,5 = Tiefstnote der Runde)

- H: "Rauschdichte um ~60 % senken; Ripples als definierte 3-7 px
  lange Horizontal-Paare (1 px hell über 1 px dunkel) an festen
  Ankern, dazwischen ruhige 2-Wert-Flächen von mindestens 3×3 Tiles.
  Glanzstreifen-Pixel ausschließlich auf die Hell-Zeile eines
  Ripple-Kamms koppeln, nie frei ins Rauschen."
- K: "Schraffur-Dichte im Basis-Wassertile um ~40 % reduzieren (jeden
  zweiten Kurzstrich löschen), verbleibende Striche eine Rampenstufe
  näher an den Grundton; Sparkle-Highlights unverändert lassen."
- M: "2-3 'Ruhe'-Wassertiles anlegen (nur Grundfarbe + max. 2-3
  dunklere Pixel) und den Teich so belegen, dass die Hatch-Dichte vom
  Ufer (dicht) zur Mitte (fast leer) abfällt; im Gruft-Kanal
  Sparkle-Dichte halbieren, verbleibende in 2-3-px-Clustern in
  Fackelnähe."
- K (Schaum): "durchgehende 1 px Linie in der zweithellsten
  Wasser-Rampenfarbe an JEDER Gras-Wasser-Kante, mit 2-3 px
  Unterbrechungen alle 8-12 px."
- H (Kanal-Kante): "direkt unter der Boden-Abschlusskante eine 2 px
  dunkle Wasserlinie (Bodenschatten auf dem Wasser) plus 1 px helle
  Benetzungskante auf dem Stein."
- ENTSCHEID Hauptloop (Dichte-Widerspruch 40/60 %): ~50 % im
  Basis-Frame + Ufer-zu-Mitte-Gefälle ÜBER DAS BESTEHENDE
  depthOverlay-System (water_mid-Overlay wird zur "Beruhigungs-
  Decke": deckt in der Tiefzone einen Großteil der Rest-Schraffur mit
  Grundton ab — positionsabhängig ohne Engine-Änderung, denn
  variants+anim ist verboten). Ripple-Paar-Form (H) übernehmen,
  Sparkles nur an Kämmen (H) bzw. fackelnah im Kanal (M).

### Boss-Decals (K4/K5, alle drei — Priorität wegen "Fehltile"-Wirkung)

- K: "Decal-Grundfarbe exakt auf den umgebenden Boden-Basiston setzen
  (Kachelkante darf nicht sichtbar sein); Risse als 1 px Linien in
  der Boden-Highlightfarbe mit 1 px dunklem Versatz darunter; Knochen
  in der Bone-White-Rampe der Skelette."
- H: "Decal-Hintergrund transparent machen bzw. exakt auf die
  Arena-Bodenfarbe; Riss-/Knochen-Pixel nur 1-2 Rampenstufen vom
  Boden abweichen."
- M: "nur die Riss-/Knochenpixel plus ein ~30 % dunkler Halo von max.
  3px um die Risslinien, der Bodentile bleibt darunter sichtbar."
- ENTSCHEID: floor_decal_* werden auf der KOPIE des Boss-Boden-Grids
  neu aufgebaut (Basis = stone_floor-Töne byte-nah), Decal-Pixel
  oben drauf. Ursache des Fehlers: die R1-Grids hatten eigenen
  dunklen Grund.

### Kronen (K2)

- H: "Rampe von 3 auf 4 Werte erweitern (Zwischenton) und Highlights
  als 3-5 px Blattbüschel entlang der oberen linken Kante, nicht
  mittig. Der 50-%-Hatch-Fleck [...] liest sich als Fliegengitter:
  durch unregelmäßige 2×1/1×2-Cluster ersetzen. 1 px Rim auf max.
  30 % der oberen linken Silhouettenkante, unterbrochen."
- K: "Pro Bildschirmhöhe mindestens 3 Sichtfenster von 4-8 px Breite
  zwischen den Front-Kronen öffnen, in denen die zweite Reihe
  durchscheint; die zweite Reihe eine Rampenstufe über reinem
  Silhouettenschwarz [...] Radien zwischen 5 und 12 px mischen."
- M: "Hintere Kronenreihe [...] 1px kühles Rim-Light (entsättigtes
  Blaugrau ca. #3a4a4d) an der Oberkante; 2-3 Front-Kronen um 8-16px
  ins Gras ausbeulen [...] Bucht-Rhythmik."
- ENTSCHEID: Sichtfenster + Radien + Rampe + Rim = Art (Front- und
  Back-Grids); "Ausbeulen ins Gras" = 2-3 zusätzliche/versetzte
  Front-Anker in GRAVEYARD_OVER_ROWS (Engine-Mandat, Y/Z/A-Muster);
  kühler Back-Rim als neuer Symbol-Ton NICHT nötig (vorhandene kühle
  Töne prüfen, sonst '#' laut §3.6-Verfahren freigeben — max 1).

### Sprites/Props (K4)

- H: "GHUL: Tuch/Körper 2 Rampenstufen abdunkeln (Richtung sehr
  dunkles Blaugrau), damit der Schädel das einzige Hell-Cluster
  bleibt. Zombie und Schild-Skelett: je 1 px Kernschatten unter
  Kinn/Armen plus 1 px Rim auf der lichtzugewandten Schulter.
  Ratte/Hund: Rückenlinie 1 Stufe aufhellen."
- M: "Ratte erhält 1px helleren Rückenkamm von Schnauze bis
  Schwanzansatz plus 2px helle Schwanzspitze; Laterne bekommt 1px
  dunkle Außenkontur und erkennbaren Metallrahmen (2px dunkles Grau
  oben/unten), Glaskern warm." (Laterne = das Wand-Fackel-Objekt in
  g4_05/07 — Art-Builder identifiziert den Key.)

### Flächen-Rest (K1)

- H: "Streusel/Blätter in 3er/4er-Nester clustern, 30-40 % der Wiese
  bewusst leer. Katakomben-Mauer: 3 Moos-Varianten des Brick-Tiles
  (oben-links/unten-rechts/ohne) im 40/30/30-Mix."
- K/M: "Katakomben-Plaketten in fluchtenden Reihen: 2-3 Varianten
  (1px versetzte Gravur, angebrochene Ecke) so verteilen, dass nie
  zwei identische horizontal benachbart; g4_09 unterste Ziegelreihen:
  weiße Sprenkel-Dichte halbieren."

### Licht/Partikel/HUD (K5/K6 — Engine)

- K/M (Banding/"Rosetten"): "An jeder Bandgrenze der Radial-Gradienten
  einen 2 px Ordered-Dither-Übergang einziehen oder die Stufenzahl
  verdoppeln"; "Wirbel-Kontrast auf max. 1 Palettenstufe deckeln,
  Bogenradien pro Instanz variieren."
- K (Glow-Farbe): "die äußeren ~30 % des Glow-Radius Richtung
  Orange-Rot verschieben (2-Stufen-Farbverlauf statt reiner
  Alpha-Abnahme)." H: "Kern warmorange, Rand entsättigt rosabraun."
- M (Lit-Texel): "Dither-Texel im Fackelkegel um genau eine
  Palettenstufe aufhellen [...] Warmton statt Neutralton."
- M (Funken): "pro Fackel 2-3 Glut-Funken mit 1px weiß-gelbem Kern
  und 2px warmem Nachzieher, sodass mindestens einer pro Screenshot
  sichtbar ist." K: "Staub-Motes auf 2 px vergrößern, 2-Frame-Twinkle."
- H (HUD): "1 px Innen-Bevel plus 2×2-Nieten in den Ecken in der
  Boss-Balken-Sprache."

## Prozess-Pflicht ab Runde 2 (alle drei Juroren)

FRAME-STRIPS für alle Bewegungs-Features: der Proof-Agent baut je
Animation (Teich-Schimmer, Gras-Sway, 3-Frame-Flamme, Funken) ein
Montage-PNG mit 3-4 Frames nebeneinander — Pflichtmaterial der Jury.

## Hauptloop-Entscheidungen Runde 2

1. ART-RUNDE: Wasser-Beruhigung (50 % + Ruhe-Decke via water_mid +
   Ripple-Paare + Kamm-Sparkles), floor_decal-Neubau auf Boden-Basis,
   Kronen (Rampe 4 Werte, Sichtfenster, Radien 5-12, Back-Kontur +
   kühler Rim, Blattbüschel-Speculars, Hatch-Fleck), Ghul-Tuch dunkler,
   Zombie/Schild-Skelett Kernschatten+Rim, Hund-Rückenkamm, Laterne,
   Schaumlinie sichtbar, Kanal-Wasserlinie/Benetzung, Moos-Brick- und
   Plaketten-Varianten, Streusel-Nester, MIX-Tiles (2 neue Keys),
   licht_dither wärmer/heller.
2. ENGINE-MANDATE: (a) lighting.js Punch-Stufen 3→5-6 + Glow-Farb-
   verlauf warm→orange-rot (createRadialGradient-Stops, stub-sicher);
   (b) particles.js Glut-Funken-Kern 1px weiß-gelb + warmer
   Nachzieher, Motes 2px+Twinkle, Deckel 60 bleibt; (c) hud.js Panel-
   Bevel+Nieten; (d) gen_gfx4: Patch-Silhouetten unregelmäßig + MIX-
   Rand, Plaketten-/Moos-Varianten-Streuung (nie 2 identisch
   benachbart), Streusel-Nester + Leer-Quote 30-40 %, 2-3 Front-
   Kronen-Anker versetzt (Bucht-Rhythmik). KEINE Test-Edits (der
   generische §16-Fänger deckt neue Legenden-Keys automatisch).
3. VERTAGT/STRUKTURELL: Spieler-im-Kanal (Steg/Wat-Feedback —
   map_fluestergruft tabu, Gameplay; Pass-5), globale Gamma-/
   Helligkeitsoption (Slice-4/Mobile), Patch-Autotiling als echtes
   Engine-Feature (MIX-Tile-Ansatz ersetzt es diese Runde).

## Betriebsnotizen

- Jury-Blockade durch Bild-Berechtigung ENDGÜLTIG gelöst:
  "Read(//home/coder/Grimlight/.tmp/screenshots/**)" dauerhaft in
  ~/.claude/settings.json (Michael 13.07.: "immer freigeben");
  blockierte Juroren wurden per SendMessage fortgesetzt (Kontext
  blieb erhalten — Muster für künftige Blocks).
