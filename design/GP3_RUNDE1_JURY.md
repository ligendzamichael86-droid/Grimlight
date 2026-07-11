# Grafikpass 3 — Jury-Ergebnis Runde 1 (11.07.2026, NEUE Skala)

Skala: 10 = herausragende moderne Handy-Pixel-Art, SoM = 8,5-9,
gutes SNES-Spiel = 6, GP2-Endstand (Baseline) = 4,5-5.

**Noten: 6 / 5,5 / 5,5 → MEDIAN 5,5** (alle drei Urteile gültig,
bilder_gelesen bestätigt; Juroren liefen über das direkte Agent-Werkzeug,
weil Workflow-Subagenten keine Bilder lesen durften — Betriebserkenntnis).

Einordnung: gegenüber der GP2-Baseline (~4,5-5) ein Sprung von +0,5 bis +1.
Meilenstein 6,5 noch NICHT erreicht. Einhelliges Lob: Wasser (Wellenbänder
mit belegtem Scroll-Loop = "größter Einzelfortschritt"), Fackel-Glut +
Alpha-Schatten ("aus einem Guss"), Farbtemperatur, hellere Katakomben.
Einhellige Deckelung: Flächen-Wiederholung (Gras-Raster, Riss-Motiv),
Kronen-Gleichförmigkeit, der neue gestrichelte Teichrand ("wirkt wie
Debug-/Auswahl-Rahmen"), globale Dunkelheit in den Ecken.

## Konsolidierte Anweisungen für Runde 2 (nach Konvergenz priorisiert)

ART (alle 3 Juroren nennen es):
1. Teich-Uferkante NEU: der gestrichelte Punkt-Rand wirkt als Marquee/
   Debug-Box. Ersetzen durch organische Kante: 2-3 px dunkleres Teal als
   Wasserkante + 1 px Schaum-Highlight, Kantenverlauf mit ±2 px Jitter;
   Tiefen-Gradient hell (Ufer) → dunkel (Mitte) verstärken.
2. Riss-Dekals: mindestens 4 gespiegelte/rotierte Varianten des
   "7"-Motivs; WICHTIG Diagnose Hauptloop: die sichtbare Wiederholung in
   g3_03/g3_06 kommt v. a. aus den stone_floor-VARIANTEN (v1/v2 via
   variantIndex auf '.'-Zellen), nicht aus den rows-','-Zellen — die
   Varianten-Grids selbst brauchen mehr Unterschied und das Riss-Motiv
   darf nicht in JEDER Variante stecken.
3. Gras: Büschel per Koordinaten-Hash ±1 px in x/y versetzen (Raster
   brechen), 4. Grund-Variante (kahler Erdfleck 8×8 gedithert), dunkelsten
   Gras-Ton 8-12 % anheben (Ecken clippen auf Schwarz).
4. Kronen: Größe ±3-4 px UND Grünton je Krone variieren (Oliv/Kühlgrün/
   Blauschatten), 2 px Schattenband wo Kronen sich berühren, 1-px-Rim
   oben-links, Highlight-Fleck horizontal versetzen.
5. Skelett: 1-px-Bodenkante, Negativraum zwischen Rippen und Armen,
   Highlight auf Schädelkuppe; Grabwächter-Backlight zu durchgehender
   1-px-Hellkante verstärken; ALLE Zweite-Reihe-Sprites 1-px-Outline.
6. Spieler: Gesicht (2 px Augenlinie, 1 px Wangenschatten) + kühle
   1-px-Rim-Kante an den Schultern (Lesbarkeit außerhalb des
   Fackellichts). ACHTUNG: player_* ist bisher TABU — Freigabe nur durch
   Hauptloop-Entscheid (Maße fix, nur Pixel).
7. HUD-Panel: 2-Ton-Bevel (hell oben-links, dunkel unten-rechts),
   Pixel-Ecken abschrägen, 1 px Schlagschatten unters Panel.
8. Embers: Größenmix 1-2 px, Ausfaden über 3 Alpha-Stufen im oberen
   Drittel (zerfallen statt poppen).

ENGINE/STRUKTUR (Hauptloop entscheidet):
9. Vignette/Schatten-Blob: die zentrale Radial-Vignette in den Katakomben
   liest weiter als unmotivierter Dunkel-Fleck (2 Juroren) — an
   Lichtquellen koppeln oder deutlich abschwächen (hud.js:drawVignette,
   braucht Scope-Öffnung).
10. Boss-Arena: dunkelsten Bodenwert +1 Stufe (Boss-Lesbarkeit).
11. g3_04-Befund "Spieler steht optisch AUF dem Wasser": Tiefen-Anmutung
    im gefluteten Kanal prüfen (ggf. Wasser-Überlappungs-Zeile über
    Entity-Füßen — Struktur, Pass-4-Kandidat).

## Betriebsnotizen

- Workflow-Subagenten: Bild-Reads verweigert → Jury künftig via direktem
  Agent-Werkzeug (bilder_gelesen-Pflichtfeld + Null-Filter griffen exakt
  wie designt; 6 ungültige Workflow-Urteile korrekt verworfen).
- Build/Integration/Proof von R1: grün committet als 77a060e
  (Bewegungs-Beweise Wasser 50 % / Funken 21 % Pixel-Diff).
- PAUSIERT auf Wunsch von Michael nach Runde 1. Runde 2 startet erst auf
  sein "weiter".
