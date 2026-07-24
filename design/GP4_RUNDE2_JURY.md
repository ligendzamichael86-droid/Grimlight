# Grafikpass 4 — Jury-Ergebnis Runde 2 (13.07.2026)

**Noten: 7,5 / 7,5 / 7,5 → MEDIAN 7,5** (einstimmig; alle
bilder_gelesen=true; erstmals mit Frame-Strips bewertet).
Verlauf: GP3-final 6,5 → R1 7,0 → R2 7,5. Block-Ziel 8 nicht
erreicht → RUNDE 3 (letzte des Passes; danach greift die
Meilenstein-Logik: >= 8 Block-Ende, 7,5-7,9 Abnahme + GP5-Planung).

## Kriterien-Matrix (Handwerk / Komposition / Moderne)

| Kriterium | H | K | M |
|---|---|---|---|
| K1 Flächen | 7,5 | 7,0 | 7,0 |
| K2 Wald/Kronen | 6,0 | 6,0 | 6,5 |
| K3 Wasser | 7,5 | 7,0 | 7,5 |
| K4 Sprites/Props | 7,0 | 7,5 | **8,0** |
| K5 Kohärenz | 7,5 | 7,5 | 7,5 |
| K6 Moderne | 7,5 | 7,5 | 7,5 |

Alle drei R1-Hauptfehler bestätigt behoben (Boss-Decals "größter
Einzel-Fix", Rechteck-Patches weg, Teich "größter sichtbarer
Gewinn"). ERSTE 8,0 in einem Einzelkriterium (M-K4). EINSTIMMIGER
FLASCHENHALS: die Kronen (K2, 6,0/6,0/6,5) — die in R2 bewusst
zurückgestellten Punkte sind jetzt "der größte Einzelhebel für R3"
(H) und "müssen vorgezogen werden" (M). Zweiter Konsens-Deckel: das
uniforme Gras-GRUNDraster ("Tapete", "Haupt-Wiederhol-Verräter").

## Juror-Anweisungen WÖRTLICH — Prioritäten für Runde 3

### PRIO 1: KRONEN (K2 — alle drei, konvergent)

- H: "(a) 2px-Highlight-Kante oben-links je Krone in hellstem Grün
  (+2 Palettenstufen), 3-4px Kernschatten unten-rechts (-2).
  (b) Cluster-Radien von ~8px auf gemischt 5/8/12px. (c) 2-3
  'Sichtfenster'-Lücken (3×3px Hintergrundfarbe) in die Blattmasse."
- K: "Blob-Radius über 5-12px variieren, 1-2 konkave Kerben je
  Silhouette (2×2-Biss), 1px-Rim oben-links 30 % heller, 1-2 dunkle
  'Himmels-Fenster' (2×3px) im Kronen-Inneren."
- M: "Rim-Light 1px obere-linke Kante (+1 Stufe, nur gegen dunklen
  Grund), Radien im Wechsel 5/8/11px, in 1 von 3 Kronen ein 2-3px
  Sichtfenster am Silhouettenrand."
- ENTSCHEID: alles ART auf den 6 Front-Grids (+Back-Grids
  unverändert); Sichtfenster als dunkle Löcher (Hintergrund = Back-
  Krone/Gras variiert — transparente Pixel nutzen, dann scheint
  automatisch durch was dahinter liegt).

### PRIO 2: GRAS-GRUNDTEXTUR (K1)

- M: "3-4 Gras-Grundvarianten statt einer — Dither-Pixel um 1-2px
  verschieben, je Variante 2-4 Einzelhalme (3px, grass_hi) an
  wechselnden Positionen; nie dieselbe Variante in 2×2-Nachbarschaft;
  alle 3-4 Tiles die Diagonal-Hatch mit 2×2-Erdbraun-Fleck
  unterbrechen."
- H: "Büschel-Streusel pro Tile aus {0,1,2} per Hash, ~1/3 der Tiles
  LEER; Patch-Kante von hartem 50%-Karo auf 2px-Rampe mit
  25/50/75%-Dither."
- K: "3./4. Variante mit phasenverschobenem Dither (Gegendiagonale);
  pro 8×8-Block 2-3 'abgenutzte Erd'-Tiles."
- ENTSCHEID: 3 neue Basis-Gras-Varianten (Phase versetzt, 1 fast
  leer, Halm-Positionen variiert) + 1 Erd-Fleck-Variante, verdrahtet
  über das BESTEHENDE variants[]-System der '.'-Legende (variantIndex
  streut; perfekte 2×2-Garantie ist hash-bedingt nicht möglich —
  dokumentierte Grenze aus R2-Moos); Mix-Tile-Rampe 25/50/75 als
  ZWEITES Mix-Tile je Patchfarbe (innerer Rand 75 %, äußerer 25 %).

### PRIO 3: WASSER-FEINSCHLIFF (K3)

- H: "Helles Highlight NUR wenn das Pixel direkt darunter der dunkle
  Ripple-Partner ist (killt Salt-and-Pepper); Kanal auf 60 % der
  Rausch-Dichte."
- M: "Kanal: max. 1 heller Pixel je 4×4-Block; 2-3 definierte
  6-9px-Glanzstriche auf festen Kamm-Zeilen, je Frame 1px abwärts
  wandernd."
- K: "3-4px-Ufer-Dither-Band auf gerade Teich-Kanten, 4 Außenecken
  mit diagonalem 4px-Schnitt kappen, Innen-Speckle −30 %."
- M (K5): "1px-Übergangskante (Mittelwert Gras/Wasser) um jedes
  Wasserfeld."
- ENTSCHEID: alles ART (water/water_v-Frames + shore-Tiles);
  KEINE rows-Änderung (kein erneuter Golden-Hash-Zyklus in der
  letzten Runde — Ecken-Schnitt in die shore-Ecktiles backen).

### PRIO 4: SPRITE-ERDUNG + PARTIKEL-PIXEL-LOOK

- H/K ("Sprites schweben"): Kontaktschatten verstärken. ENTSCHEID:
  Engine — drawSoftShadow-Basiszeile 0.32→0.40, Breite 0.9→0.95
  (kleiner Eingriff, wirkt auf alle); dazu ART: 1px-Fast-Schwarz-
  Kontur an Sprite-Kanten, die gegen die dunkle Hecke anliegen.
- H (Partikel): "Funken auf harte 1×1/2×2-Kerne + max. 1px-Glow-Ring
  (50 %); Nachzieher als 3 Pixel 100/60/30 % statt gebluerter Wolke;
  Flammenränder auf 3-Stufen-Rampe mit HARTEN Kanten quantisieren."
  WIDERSPRUCH: M lobte dieselben Funken ("schöne Funken-Fontäne").
  ENTSCHEID: Kompromiss — Halo von 2px auf 1px-Ring straffen (Alpha
  ~0,35), Kern + Nachzieher-Stufung 100/60/30 übernehmen, Flammen-
  Hotspot-Radius leicht reduzieren; NICHT alles hart quantisieren.
- H (K5): "Fackel-Glow-Radius ~20 % kürzen." ENTSCHEID: übernehmen
  (Engine, lighting.js — Pools laufen über Tile-Kanten aus).
- K/H (Sway zu schwach): Amplitude auf 2px + mehr bewegte Zeilen in
  grass_tuft_f1/blade_f1 (ART); Flammenspitzen-Silhouette je Frame
  1-2px variieren (ART, torch-Frames).

### PRIO 5: HUD-FEINSCHLIFF (M)

"HUD-Panel echten eingelassenen Bevel — 1px Highlight oben/links,
1px Schatten unten/rechts; Nieten 2×2 mit 1px Glanzpunkt oben-links;
Herz-Icons 1px weißer Specular-Dot." (Engine hud.js + ART Herzen.)

### VERTAGT auf GP5 (strukturell/zu groß für die letzte Runde)

Ambient-Occlusion-Pools an Szenenrändern (K-K5), Kanal-Strömung-vs-
Ruhe-Grundsatzfrage (H strukturell), Schaumlinie auf Eck-Tiles,
Bloom-Render-Parameter, Gras-Blue-Noise-Platzierungsgarantie
(2×2-Nachbarschaft — variantIndex-Grenze), Teich-Silhouette weiter
umformen (rows/Hash-Zyklus).

## Hauptloop-Entscheidungen Runde 3 (letzte Runde)

1. ART-RUNDE (Schwerpunkt: Kronen + Gras + Wasser + Sprite-Kontur +
   Sway/Flamme + Herz-Specular) — Details oben.
2. ENGINE-MANDATE (klein): (a) lighting.js Glow-Radius −20 %;
   (b) particles.js Halo→1px-Ring + Nachzieher-Stufung;
   (c) main.js drawSoftShadow 0.40/0.95 (NUR die zwei Konstanten —
   main.js dafür eng geöffnet); (d) hud.js Bevel/Nieten-Glanzpunkt;
   (e) maps.js '.'-variants um die neuen Gras-Varianten + Erd-Fleck
   erweitern, zweites Mix-Tile je Patchfarbe in den Patch-Rand-Ring
   (gen_gfx4, innerer 75 %-Ring).
3. Tests bleiben KOMPLETT eingefroren (generischer §16-Fänger deckt
   neue variants-Keys).
4. Proof wie R2 inkl. Frame-Strips; Kanal-Gate mit dem Residuum-
   Verfahren; Teich-Fenster 1,5-15 %.
