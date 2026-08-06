# Grafikpass 4 — Jury-Ergebnis Runde 3 (FINAL)

**Noten: 7,5 / 7,5 / 7,0 → MEDIAN 7,5.** Verlauf des Passes:
7,0 → 7,5 → 7,5 (GP3-final war 6,5 — der Pass bringt +1,0).
Meilenstein-Logik (Michael: "Grafik bis 8/10"): 7,5-7,9 nach Runde 3
→ PASS-ABNAHME + Grafikpass 5 wird geplant; der Block läuft weiter.

## Kriterien-Matrix (Handwerk / Komposition / Moderne)

| Kriterium | H | K | M |
|---|---|---|---|
| K1 Flächen | 6,5 | 7,0 | 7,0 |
| K2 Wald/Kronen | 6,0 | 7,0 | 6,5 |
| K3 Wasser | 7,0 | 6,5 | 6,5 |
| K4 Sprites/Props | 6,5 | 7,5 | 7,0 |
| K5 Kohärenz | 7,0 | 7,5 | 7,5 |
| K6 Moderne | 7,5 | 7,5 | 7,0 |

Lob: Wasser = "größter Gewinn der Runde" (wandernder Glanz = "bestes
Einzelelement des Satzes"), Kontaktschatten kräftiger, Kronen-KONTUR
sichtbar besser. Kernbotschaft aller drei: Die verbliebenen Deckel zur
8 sind STRUKTURELL — mehr Varianten/Pixel-Politur allein hebt sie
nicht mehr.

## GEMELDETE DEFEKTE (Prio 0 für GP5-Start)

1. **Stahlblaue 1px-Querbalken im Kronenband** (g4_02 rechts, ~#3a5f8a,
   8-12px lang, periodisch): von ALLEN drei Juroren gemeldet; H nennt
   es "den schwersten Handwerksfehler im ganzen Satz" und belegt:
   EXISTIERT SEIT R2. Diagnose Hauptloop: mit hoher Wahrscheinlichkeit
   der kühle 'C'-Rim an der Back-Kronen-OBERKANTE (R2, Ton #3c5a70),
   der in den Lücken/Sichtfenstern der Front-Reihe als abgelöste
   gerade Linie sichtbar wird. Fix laut H: Rim nur AUF der Silhouette
   (Läufe 2-5px, Lücken, nie >4px gerade, nie abgelöst) — oder Balken
   entfernen.
2. **Funken-Halo-REGRESSION:** der 1px-"Ring" wird als geschlossenes
   Rechteck INKL. der 4 Eckpixel gezeichnet → liest als braune Klötze
   (H+M+K unabhängig). Fix: Eckpixel des Rings nicht zeichnen, Größe
   max 3x3, Nachzieher entlang Flugrichtung.
3. Verwaiste Einzeltöne: Magenta-Pixel im Teich, Reinrot am Hund,
   Stahlblau im Wald, Cyanweiß am Trank (H: je nur 1 Vorkommen pro
   Szene → entfernen oder Rampe).
4. HUD: Panel halbtransparent (Welt scheint durch massives Panel),
   Rahmen rechts/unten ohne Fase; Herz asymmetrisch (liest als V);
   Boss-HP-Balken oben = "primitivstes Element des Satzes".
5. Boss-Arena: zwei "Doppelpfeil"-Boden-Dekale lesen als Debug-Marker
   (K+M) — vermutlich floor_decal_bones-Fehlinterpretation; prüfen,
   neu zeichnen oder entfernen.

## STRUKTUR-BEFUND (einstimmig): Was die 8 wirklich braucht

1. **Flächen-Pipeline:** Die Gras-/Bodenfüllung stammt sichtbar aus
   einer periodischen Musterfunktion; 8 Varianten ändern den
   1x-Eindruck kaum. Nötig: Halm-GLYPHEN-Stempler mit Blue-Noise-
   Platzierung oder handgezeichnete Kacheln (H strukturell:
   "Pipeline-Entscheidung, keine Zeichenaufgabe").
2. **Wasser-Autotiling:** Wasserkörper sind achsparallele Tile-Blöcke;
   kein Tile-Art-Pass repariert die Silhouette. Nötig: 16-Fall-
   Bitmask-Autotiling + Ufer-Band (3-Band-Rampe) + Tiefenrampe +
   Licht-Reflexion (K: "der eigentliche Grund, warum der Pass nicht
   bei 8 landet").
3. **Wald als Tiefe:** Kronen-Perlenkette brechen (Anker ±x-Versatz,
   variable Abstände, Überlappung), echtes Innen-Volumen (4-Wert-
   Rampe, Kern-Klüfte), Sichtfenster organisch statt Rechteck, und
   KRONEN ÜBER DEM SPIELER sichtbar machen (M: in keinem Screenshot
   nachweisbar, obwohl CLAUDE.md-Pflicht — Route/Layer prüfen!).
4. **Licht ins Pixelraster:** weiche Licht-/Schatten-Verläufe auf
   ~6 Stufen quantisieren + Bayer-Dithering an den Bandgrenzen
   (H: "damit das Licht Teil des Pixelrasters wird").
5. **Lichtrichtungs-Disziplin:** eine Hauptlichtrichtung oben-links
   für ALLE Objekte (Kronen/Boss/Vasen folgen ihr bisher nicht).
6. Beleuchtungs-/Encounter-Fragen: Boss dunkler als sein Boden
   (Licht-Platzierung), Spieler-im-Kanal-Affordanz, Idle-/Hit-
   Animationen (aus Stills nicht benotbar).

## PROZESS-LEHREN (Pflicht ab GP5)

- **4-6x-CROPS in jedes Beweispaket** (Baumspalte + Wasserkachel):
  der Stahlblau-Defekt überlebte ZWEI Runden, weil nur bei 1x geprüft
  wurde (H).
- **Frame-Strips mit 6-8 Frames** statt 2-3 (alle drei Juroren).
- Dedizierter HUD-Crop fehlt im R3-Paket (g4_08 ist ein Weitschuss).
- Sway-Wirksamkeit im Strip programmatisch NACHWEISEN (M sah <=1px
  trotz 2px-Art — Glyphen-Platzierung/Strip-Crop verifizieren).

## Abnahme-Stand

Syntax grün (24 Dateien), Smoke 3x grün, Flusstests 25/25/33 grün,
alle Effekt-Gates bestanden (Teich-Fenster nach Mikrofix robust:
schwächster Messwert ~2,5% statt 1,43%), 0 Konsolen-Fehler. Commits:
R1 555ea86, R2 74b8928, R3 3975f56 + Mikrofix 133c81e.
