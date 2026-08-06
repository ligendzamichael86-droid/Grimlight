# Übergabe 2026-07-14 — Grafikpass 4 "Struktur & Licht" ABGESCHLOSSEN

## Status

3 Runden gefahren, Abnahme nach Spec §8 erfüllt: Syntax grün (24
Dateien), Smoke 3× grün, Flusstests 25/25/33 grün OHNE jede Änderung
(Tests waren ab R2 komplett eingefroren), alle Effekt-Gates bestanden
(Teich-Fenster nach Mikrofix robust, Kanal-Drift +4/+4 via Residuum,
Funken, Lit-Texel), 0 Konsolen-Fehler. Einzige Golden-Hash-Änderung
des Passes: GOLD.GRAVEYARD.sol (sanktionierte Teich-Umformung R1).
Commits: Spec 12f2a1a, R1 555ea86, R2 74b8928, R3 3975f56 + 133c81e.

## Notenverlauf (Skala: 10 = moderne Handy-Pixel-Art, SoM = 8,5-9)

| Runde | Noten | Median | Kern der Runde |
|---|---|---|---|
| 1 | 7,0/7,0/7,0 | 7,0 | Teich-Schimmer + organische Uferlinie, 2. Kronenreihe, Lit-Dither ("Licht trifft Textur"), Ghul neu, Schatten ~35 %, XP-Balken |
| 2 | 7,5/7,5/7,5 | 7,5 | Wasser-Beruhigung, Boss-Decal-Fix, Dither-Patch-Ränder, Kegel 6 Stufen, Glow-Farbverlauf, Frame-Strips eingeführt |
| 3 | 7,5/7,5/7,0 | 7,5 | Kronen-Kontur/Sichtfenster, 8 Gras-Varianten, Wasser-Feinschliff, Teich-Mikrofix |

**Meilenstein-Ergebnis:** Block-Ziel 8 nicht erreicht; 7,5 → laut
Michaels Vorgabe ("Grafik bis 8/10, dann erneute Entscheidung") folgt
GRAFIKPASS 5. GP4 brachte +1,0 gegenüber GP3-final (6,5 → 7,5); erste
Einzelkriterium-8 des Projekts (R2, M-K4 Sprites/Props).

## Was jetzt sichtbar anders ist (gegenüber GP3 / 2914649)

- **Teich:** organische Silhouette (Umformung + Konkav-Ecken +
  Schaum), ruhige Spiegelfläche mit wanderndem Glanz-Twinkle statt
  Rausch-Teppich; Tiefen-Beruhigung via water_mid_calm
- **Licht:** "Licht trifft Textur" (Dither-Texel im Fackelkegel auf
  Stein-Böden), Fackel-Boden-Glow + Flammen-Hotspot, 6-Stufen-Kegel
  ohne Kornkreis-Banding, Glow-Farbverlauf Orange→Rosabraun
- **Wald:** zweite dunklere Kronenreihe, Kronen-Kontur mit gemischten
  Lappengrößen/Kerben/Sichtfenstern
- **Flächen:** Wiesenlicht-Patches mit Dither-Mix-Rampe (2 Ringe),
  8 Gras-Basis-Varianten, Weg-Fahrspuren, Moos-Brick- und
  Plaketten-Varianten, Boss-Decals auf Boden-Basis
- **Sprites/UI:** Ghul-Wertsprung, Kontaktschatten vereinheitlicht
  (~35-40 %, Props im Engine-Pass), HUD-Bevel + Nieten, XP-Balken in
  Boss-Bar-Sprache, 3-Frame-Fackel, Gras-Sway

## Bindende Festlegungen aus dem Pass

1. litDitherCells (tilemap.js, pure/exportiert) + LIT_FLOOR_MAPS-
   Konstante in main.js (statt mapDef-Flag — fluestergruft-Tabu).
2. water_mid_calm = Teich-Tiefenoverlay; water_mid = Kanal (texturiert).
   Geteilte Overlay-Keys vor Änderungen auf alle Nutzer-Maps prüfen!
3. Shore-Wahrheitstabelle: 2 adjazente Gras-Orthoseiten → NUR
   shore_ine/inw/ise/isw (ersetzt Doppel-Emission); Bestand sonst
   byte-gleich.
4. drawSoftShadow: Zeilen-Alphas [0.40, 0.20, 0.10], Breite 0.95 —
   die 3 Zeilen ÜBERLAPPEN NICHT (Review-Erkenntnis R2: Formel-Irrtum
   der Spec korrigiert).
5. Composite-Hygiene ist PFLICHT-Muster: expliziter source-over/
   alpha=1-Reset nach jedem lighter-Block (Stubs restaurieren gco
   nicht — grüner Test, kaputter Browser).
6. Canvas-Whitelist für Render-Code: fillRect, drawImage, arc, fill,
   beginPath, save, restore, clearRect, createRadialGradient,
   fillText (Flusstest-Stubs).
7. Palette: 64 Töne (61 Alnum + '='/'+'/'*'), Alnum VOLL, 'l'
   verboten; neue Töne nur als Symbol-Keys mit zentraler Vergabe.
8. Bild-Lese-Freigabe dauerhaft: Read(//home/coder/Grimlight/.tmp/
   screenshots/**) in ~/.claude/settings.json — Jury blockiert nicht
   mehr; blockierte Agenten per SendMessage fortsetzen.

## Backlog für Grafikpass 5 (vollständig in design/GP4_RUNDE3_JURY.md)

PRIO 0 (Defekte): Stahlblau-Balken im Kronenband (Back-Rim-Diagnose;
seit R2!), Funken-Halo-Rechteck (Eckpixel), verwaiste Einzeltöne,
HUD-Transparenz/Herz-Asymmetrie/Boss-HP-Balken, Boss-Arena-
"Doppelpfeil"-Dekale prüfen.
STRUKTUR (der Weg zur 8, einstimmig): Gras-Glyphen-Stempler mit
Blue-Noise statt Musterfunktion, Wasser-Bitmask-Autotiling mit
Ufer-Band + Tiefenrampe + Reflexion, Kronen-Anker-Layout (Versatz/
Überlappung statt Perlenkette) + Innen-Volumen + Kronen-über-Spieler
sichtbar machen (CLAUDE.md-Pflicht, in keinem Screenshot belegt!),
Licht-Quantisierung ins Pixelraster (6 Stufen + Bayer), einheitliche
Hauptlichtrichtung oben-links, Boss-Arena-Beleuchtung.
PROZESS: 4-6x-Crops im Beweispaket, 6-8-Frame-Strips, HUD-Crop,
Sway-Wirksamkeit programmatisch nachweisen.

## Betriebsnotizen

- Monatslimit + zwei Prozess-Enden mitten in R3: kein Arbeitsverlust
  (Commit-Disziplin, resumeFromRunId, SendMessage-Fortsetzung,
  Schadensbild-Erstaufträge). Nachfolger verifizierten statt neu zu
  bauen.
- Teich-Robustheit: Bewegungs-Gates künftig immer über mehrere
  Sampling-Läufe messen (Modus, nicht Einzelrender).

## Testen

Server auf Port 8123 (Michaels Terminal): Friedhof (Teich-Schimmer,
Waldrand mit zwei Kronenreihen, Wiesenlicht), Katakomben (Lit-Dither
im Fackelkegel — g4_09-Perspektive), Flüstergruft (Kanal fließt),
Boss-Kammer (Decals, HP-Balken). Dev: ?map=FLUESTERGRUFT,
?map=BOSS_KAMMER.
