# Übergabe 2026-08-07 — Grafikpass 5 "Wurzeln & Raster" ABGESCHLOSSEN
# (zugleich Abschluss des Grafik-Blocks — Eskalations-Dossier: design/DOSSIER_GRAFIKBLOCK.md)

## Notenverlauf

| Runde | Noten (H/K/M) | Median |
|---|---|---|
| R1 | 7,0 / 7,0 / 6,5 | 7,0 |
| R2 | 7,0 / 6,0 / 7,0 | 7,0 |
| R3 | 7,0 / 6,5 / 7,5 | **7,0** |

Block gesamt: GP3 6,5 → GP4 7,5 (alte Linse) → GP5 7,0 (verschärfte
Linse; dieselben Juroren taxieren GP4-final rückwirkend auf 6,0-6,5 —
die 7,0 ist unter konsistenter Linse ein Plus von ~+1).
Block-Ziel 8 NICHT erreicht → Eskalation an Michael (kein Auto-GP6).

## Von der Jury MESSTECHNISCH BESTÄTIGT geliefert (R3)

- Teich: Zisternen-Balken raus, Rampe exakt nach Rezept (Kamm:Tal
  2,1-2,4:1 nachgemessen), Wasser nicht mehr dunkelste Großfläche
- Kanal-MITTE: Flechtkorb tot, Anisotropie 3,97 längs der Fließachse
- Glut/Funken: "sauberste Lieferung des Passes" — null graue Pixel,
  physikalische Abkühl-Rampe, Weiß strukturell unmöglich (Stresstest)
- Flammen ohne Kreuz-Arme (6 echte Umrisse), Boss-Balken-Zeilenrampe
  + Damage-Lag im Bild, Vasen-Kontaktschatten, Zaun im Wertband
- Gras-Diagonalgitter, Sway-Antiphase, Schachbrett-Patches: seit
  R1/R2 tot (Wurzel-Fixes variantIndex/Value-Noise/4-Phasen)

## R3-Restliste (präzise, für den Folge-Pass — Juror-Rezepte in den
Task-Ausgaben der drei R3-Juroren)

1. KANAL-UFERRING: der Fix landete auf 1 von 2 Tiefen-Ringen —
   map_fluestergruft.js:97 zieht water_shallow (waagerechte
   Teich-Kämme!) auf den senkrechten Kanal. Fix = transponierte
   Kachel water_shallow_v + EINE Legenden-Zeile. (H fand die exakte
   Ursache; Anisotropie Ufer 0,84/1,11 vs. Mitte 3,97.)
2. Boss-Kratzer messen WARM (R−B +20..27) trotz kalt deklarierter
   Umfärbung — nachprüfen (Licht-Pass wärmt? falscher Ton?).
3. Spieler-Kontaktschatten in g5_10 nicht nachweisbar (Pixel-Diff) —
   drawSoftShadow-Pfad für den Spieler in dieser Szene prüfen.
4. Teich: Specular-Tier zurückgeben (4-6 px/Kachel, nur Flachring),
   Ufer-Ziernaht entregeln (Lichtrichtung N heller als S,
   Stufenrhythmus brechen, Doppelkontur löschen, 45°-Schraffur
   kappen), Wegsporn bis ANS Wasser führen.
5. Gras: Kachelmittel-Streuung auf ±2-4 L deckeln (Steppdecke),
   Nacht-Dither vom 1px-Schachbrett auf Bayer-25 %, Halm-Größenklassen.
6. Kronen: Scherung statt Translation im Sway (0/+1/+2 nach Höhe),
   5 echte Posen, Blattcluster mit Trennlinien, Layering-Beweisbild.
7. HUD: XP-Trog-Kontrast (+Farbidentität), GOLD-Null liest als θ,
   Lag-Geist-Rampe; Flammen-Wertegefälle (Kern gehört an den Docht).

## Bindende Erkenntnisse des Passes (auch in workflows/GRAFIKPASS_5.md)

1. variantIndex ist für GERADE n ein Diagonalgitter — UNGERADE n
   überall erzwungen (Wächter in check_gfx5_art + Smoke).
2. Mess-Disziplin: Gates brauchen (a) die JUROR-eigene Metrik,
   (b) validierte Fenster (fransenfrei/spielerfrei), (c) Positiv-
   UND Negativ-Kontrollen bei jeder Methoden-Änderung, (d) Modus
   über 9 Läufe statt Einzelrender. Alle Justierungen sind im Code
   begründet; Schwellen wurden NIE angepasst.
3. Deklarierte Nicht-Umsetzungen überleben die Jury nicht, wenn das
   Objekt im Bild bleibt (water_mid R2). Entweder fixen oder aus dem
   Bild nehmen.
4. Additiv gezeichneter Staub saturiert zu Weiß — Staub ist
   source-over, nur Selbstleuchter sind 'lighter'.
5. Ausfall-Resilienz erneut bewährt (Limit/Prozess-Enden):
   Commit-Disziplin + resumeFromRunId + SendMessage + Schadensbild.

## Commits

GP5: Spec 77c962f · R1 94a6548 · R2 9d12c2d · R3 7704f53 ·
Abschluss (dieser Stand). Alle kanonischen Flusstests über den
gesamten Pass NULL verändert; Golden-Hashes NULL verändert.

## Testen (Michael)

Port 8123: Friedhof (Teich mit Wegsporn/Ufer-Halmen, Wiese ohne
Gitter), Flüstergruft (Kanal fließt sichtbar, Mitte), Fackeln
(warme Glut, keine Weiß-Wolke), Boss (Balken mit Damage-Lag —
im Kampf sichtbar).
