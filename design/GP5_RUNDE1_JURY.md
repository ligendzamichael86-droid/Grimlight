# Grafikpass 5 — Jury-Ergebnis Runde 1 (15.07.2026)

**Noten: 7,0 (H) / 7,0 (K) / 6,5 (M) → MEDIAN 7,0.**

**SKALEN-REKALIBRIERUNG (wichtigster Meta-Befund):** Alle drei
Juroren erklären unabhängig, dass GP4-final unter der neuen
Beweislage (6x-Crops, eigene Pixel-Messungen) bei ihnen 6,0-6,5
läge, nicht 7,5. Die 7,0 ist unter der strengeren Linse ein echter
Fortschritt (+0,5..+1,0), aber der nominale 8er-Anker stammt aus
der alten 1x-Linse. → An Michael kommuniziert (15.07.).

## Matrix (H / K / M)

| Kriterium | H | K | M |
|---|---|---|---|
| K1 Flächen | 7,0 | 6,5 | 7,0 |
| K2 Kronen | 6,5 | 6,5 | 6,5 |
| K3 Wasser | 6,0 | 5,5 | 5,5 |
| K4 Sprites | 6,5 | 7,0 | 7,0 |
| K5 Kohärenz | 7,0 | 7,0 | 7,0 |
| K6 Moderne | 7,0 | 6,5 | 6,5 |

WIRKUNG DER WURZEL-FIXES (einstimmig, teils nachgemessen):
Diagonalgitter TOT (H: keine 16px-Autokorrelationsspitze mehr),
Ost-Perlenkette GEBROCHEN ("dafür allein 7,5-8" — K), Uferbänder an
allen Kanten, Layering-Beweis ok, Vignette-Quantisierung "sauber
gelöst", Katakomben "stärkstes Bild des Builds".

## NEUE Deckel (durch die Crops erst sichtbar)

1. WASSER-OBERFLÄCHE (5,5/5,5/6,0 — schwächste Fläche): richtungs-
   loses Per-Pixel-Rauschen (M maß Anisotropie 1,03), Kanal würfelt
   pro Frame neu (Flimmern statt Fließen), Teich fast statisch,
   SCHWARZE RECHTECKE durch den per-Kachel-Tiefenkontrast, Reflexion
   liest als "Blitz-Glyphe" (diagonal statt waagerecht).
2. GRAS-FLICKENTEPPICH: die Wiesenlicht-Klassen liegen in
   achsparallelen RECHTECKEN mit kerzengeraden Kanten — gegen die
   ruhigere neue Basis auffälliger als je; 4px-Schachbrett-Variante
   liest als "Füllung".
3. HÄNGE-KRONEN des dritten Clusters: flache Ellipsen ohne Kontur/
   Innenleben/Stamm/Schatten — "Seerosenblätter auf Rasen".
4. SWAY-DEFEKT PERSISTIERT: M maß ZWEI Zustände in GEGENPHASE
   (+7px oben vs. −7px unten) — der C4-Fix griff nicht, und das
   Proof-Gate war zu schwach (hat Gleichsinnigkeit nicht wirklich
   gemessen). Wurzel unklar (Verdacht: gespiegelte Varianten-Grids
   drehen das visuelle Vorzeichen) → R2-DIAGNOSE-PFLICHT.
5. BOSS-BALKEN weiterhin "flach" (93 % ein Rotton; Glanz auf Zeile 2
   statt 1) — H liefert ein zeilengenaues Rezept.
6. FUNKEN-WIDERSPRUCH: K "Dauerexplosion, verschluckt die Fackel"
   vs. M lobt die Streuung; H: Flammensilhouette strobt (Frame 5/6
   zerfällt), Funken brauchen eigene kleine Palette. ENTSCHEID:
   Dichte/Streubreite deutlich runter (Spawn-Spalte 4px auf
   Flammenachse, gleichzeitig ~8, Größe 1x1 + jüngster 2x1,
   Wolkenbreite max 10px), Flammen-Frames stabilisieren
   (zusammenhängend, Fläche ±20 %), Lichtunabhängigkeit bleibt.

## Runde-2-Aufträge (konsolidiert; wörtliche Rezepte in den
Original-Urteilen — Task-Ausgaben der drei Juroren)

ART: (1) Wasser-Formensprache: 2px-Zeilenaufbau, 1-3 waagerechte
Striche 3-6px hell-Teal + 1px dunkles Wellental darunter, Versatz je
Zeile per Hash, Anisotropie-Ziel >= 2,5; Frames als VERSCHIEBUNG
(nie neu würfeln; Teich Schimmer-Phase, Kanal Scroll); Tiefen-
Zwischenband per Bayer (50/25 %) + Innenecken 4px anfasen;
Diagonalkappen auch am Teich wirksam machen; Wasser-Palette −25 %
Sättigung/−10 % Helligkeit (kein Wasserpixel gesättigter als das
hellste Gras). (2) Hänge-Kronen: 1px-Silhouettenkontur (12,18,16),
4-6 Kerben + 2-3 überstehende Blattklumpen, 3px-Lichtbogen oben
links + Sichel unten rechts, 3x4-Stammstumpf + Schattenlinie,
3 Größenklassen + Spiegel-Flag, Nachbarn < 20px verschmelzen.
(3) 4px-Schachbrett-Stempel durch Klumpen-Stempel ersetzen (keine
Periode <= 8px); Weg-Mandel: 3 Formen x Spiegelungen + Jitter +
Leervariante. (4) Flammen-Frames stabilisieren; Funken-Sprite
1x1/2x1. (5) Props-Miniprogramm: einheitlicher Kontaktschatten +
Licht-Schlüssel (Grabsteine/Kreuze/Zaun), Zaun-Neubau (2px-Pfosten,
Querlatte davor), Schädel-Varianten, Boss-Kratzer umfärben+Schatten,
Bruchplatten-/Kiesel-Varianten. (6) Katakomben-Wandschatten wie
Vignette quantisieren (falls gebacken — sonst Engine).
ENGINE-A: Boss-Balken nach H-Rezept (zeilengenau) + Damage-Lag-
Schicht (Anzeige-Breite in main.js nachgeführt, rein visuell) +
16px-Teilstriche + Links-Glanz; Funken-Parameter (Spalte, Cap,
Größen); SWAY-DIAGNOSE + Fix (Vorzeichen-Konsistenz je Cluster —
Verdacht Spiegel-Varianten; 4 Phasen 0/+1/0/−1, Kronen mit halber
Amplitude einbinden); Licht-Multiply-Bänderung auf 6 Stufen + Bayer
(H maß 30 Einzelschritte — die Fackel-Bodenpfützen sind der letzte
Airbrush; NUR falls ohne Detektor-Risiko, sonst dokumentiert
vertagen).
ENGINE-B: Wiesenlicht-Klassenzuweisung von Rechteck-Regionen auf
Value-Noise-Feld (2 Oktaven, Feature 5+11 Kacheln) + Bayer-Misch-
kacheln an Klassengrenzen + Regel "keine gerade Klassenkante > 3
Kacheln"; Teich-Verankerung (Wegsporn 3 Kacheln + Trittsteine +
Schilf-Deko — begehbar↔begehbar, hash-neutral); Prop-Versatz vom
Kachelmittelpunkt (falls ohne rows-Bruch machbar, sonst vertagen).
PROOF: Sway-Gate NEU (1-Tick-Sampling, Vorzeichen-Konsistenz je
Cluster hart gemessen), Wasser-Anisotropie-Gate (>= 2,5), Klassen-
kanten-Gate (keine gerade Grenze > 3 Kacheln im Crop messbar).

STRUKTURELL/VERTAGT (deklarieren): Sub-Kachel-Wassermasken
(Polygon-Teich), Landmark-Assets (32x48 Mausoleum o. ä.), Parallaxe,
Idle/Hit/Waten (Pass 6), Sprite-Groessenhierarchie.
