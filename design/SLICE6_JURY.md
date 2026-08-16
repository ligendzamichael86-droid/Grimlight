# Slice 6 — Sichtjury Dorf-Biom Gramfeld (15.08.2026)

Zwei Juroren (direkte Agenten, Screenshots s6_01-08 + 4x-Crops),
geeichte Skala (10 = herausragende moderne Handy-Pixel-Art,
SoM 8,5-9; Bestandskarten nach GP6: Median 7,5).

## Noten

- Juror A (Komposition/Lesbarkeit/Weltgefuehl): **6,0**
- Juror B (Pixel-Handwerk/Material/Licht): **6,5**
- **Median NEUES BIOM: 6,25** (unter Bestand 7,5 — Polierpass +
  GP7-Arbeit noetig; die Abnahme des SLICE bleibt Michaels
  Geraetetest, die Note misst die Grafik-Messlatte).

## VOR-ABNAHME-BEFUNDE (Polierpass 15.08., Auftraege A-D)

Beide Juroren deckungsgleich:
1. **Schatten-Bakes = Fliegengitter** (GP6-R2-REGRESSION; k/n im
   2-px-Raster, dL 60-68 je Punkt) -> umgetoent z/p + verdichtet.
2. **Stroh/Segel tragen die KNOCHEN-Rampe** (O/B/b/N, 1-px-Checker
   L152-233; hellste+grauste Flaechen, erschlagen die Glocke
   p90 84) -> warme Bestands-Rampe M/P/V, max L ~140-150.
3. **Boden: harte gruene 16-px-Rechtecke** ('-'-Liste fuehrt reine
   grass_g5_*) -> Listen-Tausch.
4. Billig-Extras: Y-Saum an 6 Feuer-Grids (84,5-L-Kante),
   npc_blase von L203 auf Pergament.
FABLE-OVERRIDES gegen Juroren-Fixwege: KEINE neuen Palettentoene
(§0.5), KEINE neuen Art-Keys (Masstabellen eingefroren — keine
_d-Bake-Varianten; stattdessen in place).

## BACKLOG NAECHSTER GRAFIKPASS (GP7 / Dorf-Vertiefung)

Prio nach Juroren-Konsens:
1. **Boden-Sprache**: eigene Dorf-Kacheln fuer ','/'-' (+-3 L zum
   Nachbarpool), ECHTE Uebergangskacheln Lehm<->Weg (im Dorf
   existiert keine einzige — Friedhof fuehrt die Technik vor),
   zweiter kuehler Materialakzent 5-8 % (nasser Lehm/Asche/
   Steinplatten), Kachelkanten-Energie 1,43 -> <1,0.
2. **Landmarke Glocke**: Muendung ausstellen, Lippe+Schlagschatten,
   Bronze-Glanz L110-130, Riss 2 px; **Brunnen**: 3x2-Over-Span
   mit Haspel/Kurbel/Eimer (Muster Glockenjoch) statt "Gully".
3. **Feuer als GLUT**: max()-Blend auf der Fackelkachel (Kern
   bleibt #ffe9b0), Saettigungs-Schub +0,10-0,15 im Nahfeld,
   1-2 Glutfunken/s (Partikel vorhanden) — "Sicherheit liest als
   Licht", aktuell +23 L ohne Hue-Verschiebung.
4. **Fachwerk-Gefach**: 14 Zeilen Standardabweichung 0; c-Ton als
   Balken-Lichtkante einsetzen (wofuer er eingefuehrt wurde),
   Lehmputz-Schlieren ~15 % M / 5 % P; Traufband 2 px n statt
   1 px k. dorf_wand_bretter ('Z') braucht Varianten.
5. **Lehm-Pool entklumpen**: 7/9 Kacheln tragen dieselbe
   M/P/V-Rosette; P->V-Sprung 30,8 L (V funkelt) — Rosetten
   diversifizieren, V-Einzeltexel daempfen. Schindel-Ton-Jitter
   +-1 Stufe auf ~15 %.
6. NPC-Feinschliff: G-Stoff ohne Rampe (Falten dL46-Nadelstreifen),
   Bran/Mile stecken in der Holzrampe ihrer Gebaeude (Traufe!),
   Rimlight-Frage. Palisade liest als Leiter (Pfostenbreiten
   mischen, Riegel brechen; evtl. West/Sued 1 Kachel nach innen).
7. **Materialgrenzen-Nachstempel** (Fund des shadowArt-Fixes
   16.08.): tilemap.js:1030-1038 stempelt bei GEMISCHTEM
   Bake-Fussabdruck (z. B. Glockenfuss '6' zwischen Weg-Zellen)
   je abweichender Zelle ein kaltes canopy_shadow (0/n-Toene) —
   Rest: 59 kalte Texel am Joch, 2 Zellen am Segel. Fix braucht
   tilemap.js (Materialklassifikation) ODER Boden-Umbau unter der
   Glocke. Nachpruefung B: Ziel-dL 27 mit 28,6 getroffen, Form
   jetzt organisch — Rest ist Feinschliff.
8. Platzdichte (Tristram-Geruempel als solide Deko 'x'-Muster:
   Karren/Holzstoss/Troege — Prop-Verbot betrifft nur
   Pluenderbares), Dialogkasten-Verankerung unten + Umlaute im
   Font, Ladenpanel-Materialsprache + fehlende Icons.

## STARK — NICHT ANFASSEN (Konsens)

Grundriss-Dramaturgie (Osttor->Glocke->Platz->Kapelle); Holzrampe
q/j/Q/c/J (Kursschritte 15/16/17 L — "tragende Leistung");
12-Stufen-Quantisierung (9 Plateaus, ringfrei); Traufe-Mechanik;
Kapelle als Nordanker; NPC-Silhouetten + Krapp-Akzent;
vernagelte Fenster/Dachloecher als stumme Erzaehlung;
Marktsegel-Webung; Zwielicht-Sockel; Pixelraster-Disziplin;
Palettendisziplin (Null-Texel-Zensus-Arbeitsweise beibehalten).
