# Übergabe 2026-07-07 — Grafikpass 2 "Struktur statt Politur" ABGESCHLOSSEN

## Status

Alle 3 Runden der Qualitätsschleife gefahren, Abnahme nach Spec §8 erfüllt:
- `check_syntax.sh` grün (23 Dateien), `smoke_test.mjs` 3× grün
  (jetzt 35 Abschnitte inkl. Grafikpass-2-Wächter)
- Alle drei Flusstests grün und UNVERÄNDERT (check_main 25, check_inventory
  25, check_boss 33 Assertions) — git-diff-beweisbar
- Ground-ROWS aller vier Maps byte-identisch zu bc0de5a; Tabu-Zonen
  (entities/, items/, ui/) unberührt; main.js-Diff = exakt 1 Konstante
  (TORCH_RADIUS 56→72); lighting.js-Diff = nur additiver Warm-Glow-Block
- Screenshot-Proof g2_01 bis g2_06 (8 PNGs): 0 Konsolen-Fehler; Wasser-Drift
  per Pixel-Diff BEWIESEN (~18 % der Wasserpixel wandern pro Frame)

## Notenverlauf der Juror-Schleife (Eichung: 8 = gutes SNES-Spiel, 10 = SoM)

| Runde | Noten | Median | Kern der Runde |
|---|---|---|---|
| 1 | 6 / 6 / 6,5 | 6 | Struktur gelegt: 2×2-Kronen (3 Silhouetten), Varianten-Engine, Wasser-Anim, Sprite-Politur |
| 2 | 6 / 6,5 / 6,5 | 6,5 | Juror-Anweisungen: Weg/Gras neu, Ufer-Kacheln, Kronen-Schatten+Stagger, Warm-Glow, Gegner-Umrisse |
| 3 | 6,5 / 6,5 / 6,5 | 6,5 | Wasser-Tiefen-Autotiling (BFS-Distanz), Katakomben-Varianten v3, Kronen-Lichtkappen, Sprite-Erdung |

Runde 3: ein Juror-Urteil war technisch ungültig (kein Bild-Lesezugriff,
Note 0 = "NICHT BEWERTET") und zählte nicht; der einzeln nachgefahrene
Ersatz-Juror (Lesbarkeits-Linse) bestätigte mit 6,5 — Runde 3 damit
einstimmig. Sein Kernbefund: der Wasser-Umbau trägt den Lesbarkeits-
Gewinn, aber Stipple-Rauschen und die noch zu gleichförmige Baumreihe
halten den Pass unter der 8er-Marke.

Der Pass hat sein Meilenstein-Ziel (Median 8) NICHT erreicht, aber den
Median von 6 auf 6,5 gehoben und die Struktur-Grundlagen gelegt, an denen
Pass 1 gescheitert war. WICHTIG: Das PROJEKT-Abnahmeziel wurde während des
Passes von Michael verschärft: "Abnahmeziel 10, oder besser 12 — wir haben
das Handy als Grundlage, kein SNES" (07.07.2026). Ab Grafikpass 3 gilt die
neue Skala: 10 = herausragende MODERNE Handy-Pixel-Art, SoM selbst ≈ 8,5-9;
moderne Mittel (unbegrenzte Palette, Per-Pixel-Licht, Partikel, Alpha-
Schatten, Parallaxe) sind ausdrücklich erwünscht. In CLAUDE.md verankert.

## Was jetzt sichtbar anders ist

- **Friedhofswald:** 32×32-Großkronen (3 Silhouetten, deterministisch
  gestaffelt ±16 px), Dither-Schlagschatten unter jeder Krone, Füller-Büsche
  mit Lichtkappe statt flacher Fläche
- **Wasser:** ein konsistenter Look für Teich und Gruft-Kanal — dunkle ruhige
  Basis, horizontale Kräusel mit sichtbarer Drift (Ping-Pong-Loop 2 s),
  Ufer-Distanz-Tiefenverlauf (BFS), Schaum-Ufer mit Ecken-Rundung
- **Flächen:** 4 Weg-, 4 Gras-, 3 Ziegel-, 3 Steinboden- und 2 Mauer-
  Varianten, deterministisch gestreut (variantIndex-Hash, kein Math.random)
- **Licht:** Fackelradius 72 px + additiver warmer Glow (nur flicker>=0.8)
- **Zweite Reihe:** einheitliche Umrisse + Rimlight, Kontaktschatten in den
  Grids, Ghul-Volumen, hellere Katakomben-Steintöne (t/T/L/D +≈10 %)

## Bindende Festlegungen aus dem Pass

1. Engine-Features in tilemap.js: `span` (Multi-Tile-Anker, nur Over-Layer),
   `variants` (variants[0]===art Pflicht), `animRate`/`animSync`,
   `shorePrefix` (Target-abhängige Fringe-Umlenkung, nur Quell-Set 'grass'),
   `depthOverlays` (Chebyshev-Distanz zum Ufer, Ground-Overlay), Kronen-
   Schattenzellen aus overCells. Alles deterministisch aus (tx,ty,timeSec).
2. `variantIndex` ist exportiert und im Smoke §35 auf Determinismus,
   Streuung (synthetischer 32×32-Sweep) und Wertebereich verankert.
3. Ambient-Werte sind FLUSSTEST-GEBUNDEN (check_main asserted CATACOMBS
   0.82, check_boss asserted BOSS_KAMMER 0.70). Ambient-Änderungen brauchen
   eine Spec mit sanktionierten Alt-Test-Änderungen (Muster Slice 3 §4) —
   in diesem Pass bewusst verworfen (Eiserne Regel schlägt Runden-Wunsch).
4. Palette: neue Töne 0 (Laub-Tiefe), 9 (Wasser-Zwischenblau, nachjustiert
   auf #2e5568), K (warmes Mittelgrün), M (Weg-Sandtan); a/m/V/P und t/T/L/D
   wurden sanktioniert aufgehellt. `l` bleibt verboten.
5. Alt-Dev-Checks .tmp/check_art_slice1.mjs/_slice15.mjs sind durch die
   32×32-Kronen OBSOLET (16×16-Annahme) — nicht ausführen, nicht reparieren.
   Aktueller Art-Selbstcheck: .tmp/check_art_gfx2.mjs (TABU-Byte-Vergleich
   gegen bc0de5a, Maße, Palettenzeichen).
6. Screenshot-Route: .tmp/shot_gfx2.py (Szenen g2_01-g2_06, Wasser-Serie
   bei Frame-MITTEN 0,25/0,75/1,25 s); Runden-Archive in
   .tmp/screenshots/runde1/ und runde2/.

## Backlog für Grafikpass 3 (aus den Runde-3-Jurys, priorisiert)

1. Gras bleibt der Haupt-Wiederholungsverräter (Cluster-System mit 3
   Grünstufen statt Streu-Tupfen; mittlere Skala: Deko-Dichte via
   begehbarer rows-Deko — braucht sanktionierte rows-Änderung)
2. Katakomben-Boden: der "7-förmige" Riss (stone_floor_cracked ',') liegt
   per rows-Layout zu dicht — rows-Rebalancing oder Riss-Varianten
3. Baumreihen-Silhouette: Kronen brauchen SPIEGELUNG und Breiten-/Höhen-
   Vielfalt (Flip-Support für Tiles = kleiner Engine-Punkt) + Anker-Jitter
4. Wasser: "Nassrand" (dunkle nasse Steinreihe) an der Wasser/Land-Grenze,
   Tiefen-Bänder breiter (3-4 px hellstes Band am Ufer)
5. Ambient-Rebalancing (0.78/0.66) MIT erlaubten Alt-Test-Änderungen
6. Skelett-Silhouette liest einem Juror weiter als "Gekritzel" (Frontal-
   Neuzeichnung), Ghul-Umriss schattenseitig dunkler
7. Boss-Umriss/Backlight (Warden-TABU aufheben), Fackel-Sprite-Flamme
8. Lichtsystem: weicher Schatten-Blob in g2_03/g2_06 liest als "Schmier" —
   Lichtgradienten prüfen; ggf. Partikel (Glut-Funken) als Moderne-Mittel
9. Vom Ersatz-Juror (Lesbarkeit) zusätzlich: Riss-Dekal-Dichte auf ~1/6-8
   Kacheln senken (gespiegelte/rotierte Varianten), Wasser-Stipple zu
   horizontalen Wellenbändern bündeln (Kontrast -25 %), Kronen vertikal
   2-6 px versetzen + Stamm-Lücken an der Basis, Ghul-Hautton Richtung
   kränkliches Gelbgrün (weg vom Hecken-Grün), Warm-zu-Kalt-Temperatur-
   verlauf pro Raum, 1-2 px Ambient-Occlusion an Wand-Boden-Kanten,
   Mittelgrund-Silhouetten (Säule, Wurzel) für SoM-Tiefe, HUD-Panel
10. NEUE SKALA ab Pass 3 (siehe oben) — Juror-Prompts entsprechend eichen;
    im Juror-Schema Pflichtfeld "bilder_gelesen" ergänzen und Null-Urteile
    im Skript ausfiltern

## Betriebsnotizen

- Session-Limit riss Runde 3 mitten im Fix (Art-Fixer + Verify tot);
  Resume via resumeFromRunId funktionierte, der gestorbene Art-Fixer hatte
  ~90 % seiner Arbeit bereits in sprites.js (Smoke war grün!). Lehre
  bestätigt: Vor Resume Dateizustand prüfen, Schadensbild dem Nachfolger
  als Erstauftrag geben — der Nachfolger hat dann NUR die Lücken gefüllt.
- Ein Juror lieferte ein Null-Urteil (PNG-Lesezugriff verweigert) — Urteile
  mit Gesamtnote 0 sind als "technisch ungültig" zu behandeln und zählen
  NICHT in den Median; Ersatz-Juror einzeln nachfahren.
- Konsolidierungs-Fehler des Hauptloops in Runde 2 ("Tiefen-Rampe pro
  Kachel" statt "über den Wasserkörper") erzeugte das Bilderrahmen-Gitter —
  Lehre: Juror-Anweisungen beim Konsolidieren wörtlich zitieren, nicht
  paraphrasieren; Flächen-Anweisungen immer fragen "pro Kachel oder pro
  Fläche?".

## Testen

Server läuft in Michaels Terminal (Port 8123): kompletter Run Friedhof →
Katakomben → Flüstergruft → Bosskammer. Sehenswert: Teich im Südosten des
Friedhofs (Ufer + Tiefenverlauf + Drift), Ost-Waldrand (Großkronen +
Schatten), Fackeln (warmer Glow). Dev: `?map=FLUESTERGRUFT`,
`?map=BOSS_KAMMER`.
