# Grafikpass 5 — Jury-Ergebnis Runde 2 (16.07.2026)

**Noten: 7,0 (H) / 6,0 (K) / 7,0 (M) → MEDIAN 7,0** (wie R1).
Verlauf GP5: 7,0 → 7,0. Block-Ziel 8 nicht erreicht → RUNDE 3
(letzte; danach Eskalations-Dossier an Michael, kein Auto-GP6).

## Matrix (H/K/M)

K1: 7,5/7,0/7,5 · K2: 7,0/5,0/6,5 · K3: 6,0/4,5/6,0 ·
K4: 7,0/6,5/7,5 · K5: 7,0/6,0/7,0 · K6: 7,5/6,0/7,0

GELANDET (messbar bestätigt): Gras-Makro "Durchbruch der Runde"
(Autokorrelation dx4 0,14→0,00 = "moderne Werte"), Sway 4 echte
Phasen inkl. Kronen (verifiziert), Teich-Formensprache + schwarze
Rechtecke weg, Kronen als Objekte (Kontur/Stamm/Klassen),
Boss-Balken-Segmente, Kontaktschatten-Vereinheitlichung (teilweise).

## KONVERGENTE R3-LISTE (alle drei Juroren, wörtliche Rezepte in
den Task-Ausgaben)

1. **KANAL water_mid KOMPLETT NEU** — der deklarierte
   Unverändert-Entscheid wurde einstimmig verworfen ("türkises
   Labyrinth", "Platinen-Leiterbahnen", "schlechtestes Einzelbild"):
   Teich-Sprache 90° gedreht, NUR gerade Läufe 4-9px entlang der
   Fließachse, max. EIN Seitenversatz je Glyphe (Haken verboten),
   Spaltenbänder mit Hash-Vertikalphase, Schwarz → neuer Grundton.
2. **TEICH-BECKEN-RASTER:** (a) BUG: braune Ufer-Bänder laufen QUER
   DURCH die Wasserfläche (Land-Zellen der Einbuchtung/Treppen
   bekommen allseitig Bänder) → bankOverlays UNTERDRÜCKEN, wenn die
   Landkachel gegenüberliegende Wasser-Nachbarn hat (N+S oder E+W)
   oder >= 3 Wasser-Orthonachbarn; (b) 4 diagonale Ecken-Ufer-Tiles
   (45°-Treppe) gegen die reine 90°-Kontur; (c) Wellental HELLER
   (13,18,21)→~(20,30,34), Kamm gedämpft →~(48,74,72), Ziel
   Kamm:Tal ≈ 2,3:1 ("Wasser ist die dunkelste Großfläche" beheben);
   (d) Kammzeilen-Abstände 2/4/3/5/3 statt konstant 3;
   (e) Wasser-WIEDERHOLUNG (dx16 0,71): water ist anim →
   variants[] VERBOTEN; stattdessen DEPTH-OVERLAY-VARIANTEN
   (water_shallow/_calm je 3 Varianten, Engine wählt per
   variantIndex im depthArt-Pass — kleine Engine-Erweiterung +
   additiver Test).
3. **FLAMME/FUNKEN:** 12px reines Weiß im Kern (additives
   Hotspot-Sättigen) → Hotspot warm (255,252,232)-Ziel + Alpha
   runter; Kreuz-Arme der Silhouette weg (Ziel ~10 breit × 16 hoch,
   je Frame EINE leckende Zunge); Glut-Lebensrampe auf
   LUMINANZ-Verlust statt Sättigungs-Verlust (graues Konfetti):
   (255,240,180)→(240,150,60)→(170,70,25)→(90,35,15)→aus; weiße
   Geburtswolke durch Feuerrampe färben.
4. **PROPS LIGA 2:** Grabsteine/Schädel/Zaun/BOSS haben keinen
   (sichtbaren) Kontaktschatten — der '0'-Ton ist gegen Gras fast
   unsichtbar → 'k' (#14101a) verwenden, Größen an Standfläche;
   Boss in den Engine-Weichschatten-Pass (prüfen warum ausgenommen);
   Zaun abdunkeln (~L 130 → ~76) + rechte Flanken.
5. **ZIEGEL-/UFER-VARIANTEN:** Ziegel 4 Luminanz-Stufen (−8/−4/+4/
   +8 %) + jeder 12. mit Diagonalkerbe (Ziel dy-Autokorr < 0,20);
   Ufer-Band 3 Zahn-Varianten; Mörtel entgittern.
6. **BOSS-BALKEN-FEINSCHLIFF:** Zeilenrampe statt 7 identischer
   Zeilen; die weiße 2px-Säule → 1px-Oberkanten-Glanz.
7. **PROOF-LÜCKEN:** Wegsporn in keinem Frame sichtbar (Szene
   ergänzen!), Damage-Lag nie bei <100 % HP aufgenommen
   (Telemetrie-Szene bei ~60 %), Kronen-Sway-Strip croppte falsch.

## AN MICHAEL ESKALIEREN (nach R3, strukturell — nicht mehr in
diesem Pass lösbar)

- **BELICHTUNG:** Außen-Median L 22-27, <0,5 % Pixel über L 128 —
  "auf dem Handy bei Tageslicht unsichtbarer Matsch" (H). Der
  Ambient-Sockel ist flusstest-gebunden (Kontingent verbraucht) —
  braucht eine neue sanktionierte Test-Runde ODER Palette-Anhebung
  (großflächig). Zentrale GP6-/Slice-4-Frage.
- **KRONEN-MASSSTAB:** echtes Blätterdach braucht 48×32-Kronen
  (3×2-Span, neue Testkatalog-Klasse) + Laubebene mit
  Schattendurchgang; 16px-Kronen bleiben "Hüte".
- Sub-Kachel-Blending, Wasser-Polygon-Silhouette, Spieler-Kontrast-
  Pass, Idle/Hit/Waten: bekannte Struktur-Themen (Pass 6).
- K-Juror-Grundsatzkritik: Karten-AUTORENSCHAFT (Prop-Gruppierung,
  Wege, Orte) gehört in künftige Pässe integriert.
