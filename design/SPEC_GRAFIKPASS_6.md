# SPEC Grafikpass 6 — "Licht & Maßstab" (Rev 2.4, 13.08.2026, Fable)

REV 2.4 = Rev 2.3 + Jury-Runde-1-Auflösungen (design/GP6_JURY_R1.md):
(J1) P0-C: Die Rev-2.3-Begründung "arithmetisch unerfüllbar (19 bei
18)" war FALSCH (Mindestbedarf 17; Juror-M-Gegenbeleg existiert) —
korrekt ist: empirisch nur auf 4-11 % der zulässigen Strahlen
erfüllbar, damit maß die Regel die Strahlwahl. ERSATZREGEL (bindend,
am Zensus geeicht — 55 % aller Strahlen erreichen sie): der
Gradient-Schnitt braucht ≥ 5 Plateaus ≥ 2 Blöcke. Der §1/M2-Körper
gilt ab jetzt in DIESER Fassung (der dortige Rev-2.1-Satz "kein
Plateau < 2 Blöcke" ist tot).
(J2) M4 wird VERSCHÄRFT (Jury-Mandat, P0-A): zusätzlich Quotient
verdeckt/silhouette ≤ 0,85 UND ≥ 25 % der Voll-Silhouette (275
Texel) in der Beweiszelle lesbar — Totalverdeckung ist ein Defekt,
kein Optimum. Bau-Vorgabe: Over-Kronen, deren Span-Fußabdruck die
Spieler-Standkachel enthält, zeichnen mit globalAlpha 0,55
(danach Reset; Ruhelage t=0-Determinismus und smoke:695-697-Zählung
bleiben unberührt).
(J3) P0-B: canopy_shadow(+_xl_*) werden MATERIAL-getönt (Schatten-
stufen der jeweiligen Bodenrampe statt n/0; pro Material eigener
Key canopy_shadow_g/_d + XL-Fassungen, additiv ans Ende; der
Schatten-Zweitpass wählt je Zelle nach Bodenmaterial und stempelt
je Zelle GENAU EINMAL — Überlapp-Dedupe). NEUES GATE: Schachbrett-
Blockanteil (8×8-Energie-Metrik Juror K) in g6_01/g6_02 < 2 %.
(J4) P0-D (L<16-Bänder) ist an Michael eskaliert; bis zu seinem
Entscheid gilt die Rev-2.1-Fassung MIT der offenen Deklaration
"GP6 verbessert die Dunkelanteile innen nicht, es verschlechtert
sie nicht".

REV 2.3 = Rev 2.2 + zwei Methoden-Entscheide nach Proof-Lauf 2:
(K2-FINAL) Das Pro-Strahl-Plateau-Minimum des Gradient-Schnitts
ENTFÄLLT ersatzlos — es war arithmetisch unerfüllbar (2·8+3 = 19
geforderte bei 18 messbaren Blöcken im glow-freien Fenster;
Erfüllbarkeits-Zensus über 972 Strahlen: 4,4 %). Die Lesbarkeit
der Licht-Treppe sichern weiterhin BINDEND: Sprungzahl 8..13
(gemessen 9), globaler Plateau-Anteil ≥ 95 % (gemessen 96,6 %),
und die Jury am Gradient-Schnitt-BILD (Pflichtmaterial;
rWob-Kompression einzelner Bänder ist deklariert).
(M1-PHASEN) M1 friert auf die 8 FESTEN Phasen 6,05..13,05 s
(1-s-Raster, arm_freeze wie M2/E2); je Kennzahl zählt der MEDIAN
über die 8 Phasen (die 9-Lauf-Modus-Disziplin, auf M1 übertragen;
Einzelphasen stehen im Report). Grund: der Fackel-Flicker bewegt
die Mediane um bis zu ±0,8 L um die Bandgrenzen — ein einzelner,
nicht festgenagelter Einfrier-Augenblick wäre Lotterie in beide
Richtungen. Schwellen unverändert.

REV 2.2 = Rev 2.1 + drei MESS-Korrekturen nach dem ersten Proof-Lauf
(design/GP6_PHASE4-Diagnose; Schwellen unverändert, nur Methoden):
(K1) M2-Stufenzählung rastet auf die deklarierte Leiter
{ambient·k/12} mit Toleranz ±0,015 (der 3-Kanal-Schätzer streut
durch 8-Bit-Rundung ±0,014 und zerlegte jede echte Stufe in zwei
0,01-Bins — Engine-Gegenprobe: exakt 13 Stufen; Kontrollen: A/A =
1 Stufe, Engine-k-Folge = Positiv-Referenz). (K2) Gradient-Schnitt:
"kein Plateau < 2 Blöcke" kollidierte mit dem in §2.2 PFLICHT-
erhaltenen rWob-Jitter (Nominalbreite 2,25 Blöcke ± 1,44 px) —
neue Regel: ≥ 8 Sprünge ≥ 0,04 UND ≥ 8 Plateaus ≥ 2 Blöcke,
höchstens 3 Plateaus < 2 Blöcke. (K3) M3-Halbseiten-Metrik =
Halbseiten(Tint) − Halbseiten(__noTint) am SELBEN Frame/Ort
(NAH ≥ +6 L, FERN < 2 L — die wörtliche Rev-2.1-Kontrolle maß den
Lichtfeld-Gradienten mit); Fern-Paar-Kontrolle auf zwei KEGELFREIE
Orte (CATACOMBS hat beweisbar nur EIN kegelfreies Gebiet — zwei
≥ 48 px entfernte sind dort nicht konstruierbar).

REV 2.1 = Rev 2 + Phase-0-Ergebnisse (design/GP6_PHASE0.md):
E1/E2 eingetragen, §2-Geometrie nach Messung entschieden (4-px-Läufe,
harte Bänder OHNE Bayer im Lichtfeld, Lauf-Deckel 2000 statt des zum
Zeitbudget inkonsistenten 1200), Worst-View korrigiert, Rim-Variante C,
M1-Dunkel-Bänder und Goodhart-Gate an die Simulation geeicht.
Ab hier sind ALLE Schwellen eingefroren.

Grundlage: Michaels Entscheid OPTION A (design/DOSSIER_GRAFIKBLOCK.md),
Landkarte design/GP6_LANDKARTE.md, adversarialer Review
design/GP6_SPEC_REVIEW.md (3 Prüfer, 16 BLOCKER / 35 MAJOR /
20 MINOR — ALLE eingearbeitet; die "Geprüft OK"-Listen der Prüfer
gelten als bestätigt und werden nicht erneut debattiert).
Umfang: Dossier-Hebel 1-4 plus R3-Restliste. Hebel 5 ist NICHT Teil
dieses Passes.

**Abnahme über MESSZIELE (§1), nicht über die 10er-Skala.** Zwei
Schwellen (§1-Eichung) werden in Phase 0 nach festgelegter FORMEL
aus Vormessungen abgeleitet, VOR Baubeginn als Rev 2.1 eingetragen
und sind danach unveränderlich. Alle anderen Schwellen stehen hier.

---

## §0 Eiserne Regeln

0.1 **Kanonische Flusstests**: NULL Änderungen außer den
sanktionierten Ambient-Zeilen §7.A. Keine Stub-Erweiterungen.
`.tmp/check_lighting_input_slice1.mjs` ist BEKANNT ROT, nicht
kanonisch; `.tmp/debug_victory_*.mjs` tot — beide nicht anfassen.

0.2 **ambientAlpha-Detektor**: Der Ambient-Fill in lighting.js
(heute :138) bleibt der ERSTE und EINZIGE fillRect mit
0 < globalAlpha < 1 auf einem Nicht-Main-Canvas. Jede weitere
Offscreen-Zeichnung (auch destination-out-Stanzen per fillRect)
führt die Deckung in rgba(...) bei globalAlpha === 1. Kein
Offscreen aus dem Offscreen-Kontext; neue Canvases nur aus dem
Haupt-ctx und erst NACH main.js:71.

0.3 **Canvas-Whitelist** wie GP4/GP5; drawImage bei
Licht/Overlays/Tiles NUR 3-Argument (dokumentierte Einzelausnahme
§2.4-Stufe 2, falls gezogen). Nach jedem lighter-/destination-out-
Block expliziter Reset gco='source-over', globalAlpha=1.

0.4 **Golden-Hashes sol/geo: NULL Änderungen** (geo-Drift =
STOPP-Signal). Die AMBIENT-Konstante smoke:1996 ist §7.B.

0.5 **Reihenfolge-Wächter**: Neue SPRITES-/TILE_ART-Keys nur ans
ENDE; neue Flips ans Ende von main.js:55-68; neue Canvases erst
nach main.js:71. Namensbasierte Test-Assertions existieren NUR auf
SPRITES-Indizes 0..74 — die TILE_ART-Namen der Flusstests sind
bereits heute verschoben und dürfen von keiner neuen Assertion
benutzt werden (Review P1-m7). Der ERSTE drawImage je
Entity-Sprite bleibt IMMER das Original-Canvas aus gfx.

0.6 **Hash-Disziplin**: variantIndex nur mit UNGERADEM n,
teilerfremd zu 3/5/7/17/29/47 am selben Ort, versetzte
Koordinaten. `swayPose8` ist rein ZEITBASIERT nach dem
swayPhase-Muster (tilemap.js:576-587, Cluster-Versatz
SWAY_CLUSTER_N=7, Modulo 8) — KEIN variantIndex mit n=8.
Kein Math.random/Date.now in world/ und art/.

0.7 **fringeOverlays byte-eingefroren**; neue Emission nur in
NEUEN Funktionen.

0.8 **Die 0.8-Flicker-Schwelle wandert nicht.**

0.9 **Tabu-Aufhebungen** (abschließend): core/lighting.js;
core/sprite_factory.js (additiv buildTintMask); main.js
(Zeichenblöcke, Schatten, renderables-Bau §4.2); ui/hud.js;
world/tilemap.js — additiv PLUS GENAU DREI Bestandsstellen:
(a) Over-Zeichenpfad wählt swayPoses-Pose (§5.2, Marker GP6-§7C2),
(b) canopy_shadow-Zeichenort wandert in den Zweitpass (§5.3,
GP6-§7C3), (c) Culling-Grenze (§5.4, GP6-§7C4); world/maps.js +
map_fluestergruft.js + map_bosskammer.js; art/*. entities/ TABU.
God-Mode-Verhalten (7e1d86d) bleibt; `.tmp/probe_god.mjs` steht
in der Grün-Liste §10.

0.10 Port 8123 NIE; Agenten-Server 8124. Hauptloop committet
jeden grünen Stand.

0.11 **KEINE neuen Palettenschlüssel** — 61 alnum + 3 Symbole
bleiben exakt; alle Ton-Änderungen sind Wert-Änderungen
bestehender Schlüssel (Review P1-m5).

---

## §1 MESSZIEL-ABNAHME

Werkzeug `.tmp/shot_gfx6.py` (Port von shot_gfx5.py). Bindende
**Nachzugsliste beim Port** (Review P3-M8, P1-M7): GLANZ_RGB auf
den neuen '='-Hex; wegsporn-Sollwerte auf das neue Zeichen +
`path_pebbles`; alle Ton-Tripel aus der P0b-Offset-Tabelle;
WRAP_PLAYER auf `(...a)`-Durchreichung korrigieren (God-Mode-Arg);
neuer Rig-Schalter `window.__noTint` (von der §4.2-Fassade in
main.js gelesen — main.js darf window lesen); neuer Schalter
`__noCanopyShadow` im tilemap-Wrapper. Mess-Disziplin wie GP5
(Juror-/Spec-eigene Metrik, validierte Fenster, Positiv- UND
Negativ-Kontrolle, 9-Lauf-Modus bei Bewegtem, Schwellen nach
Eintrag NIE anpassen). Messung auf dem 320×180-Backing-Store,
Rec.601, HUD-Maske Panel+BossBar+ItemBox je +1 px.

**Abnahme: alle Messziele M1-M5 grün UND Jury (§9) ohne neuen
Prio-0.** 10er-Note informativ.

**Phase-0-Eichung (Formel fix, danach eingefroren):** Zwei
Schwellen werden in P0 gemessen und als Rev 2.1 eingetragen:
(E1) M1-Highlight-Spalte, (E2) M2-Glow-Vielfalt. Formeln unten.

### M1 Belichtung (feste Kameras aus Landkarte T2 §3)

| Karte | Median-L | Highlight (E1, GEEICHT) | Anteil L<16 |
|---|---|---|---|
| GRAVEYARD (beide Szenen) | 38..46 | Anteil L>96 ≥ **1,01 %** | ≤ 3,0 % |
| CATACOMBS | 40..50 | Anteil L>128 ≥ **1,94 %** | ≤ **10,0 %** |
| FLUESTERGRUFT | 33..44 | Anteil L>128 ≥ **0,92 %** | ≤ **9,0 %** |
| BOSS_KAMMER | 38..48 | Anteil L>128 ≥ **1,32 %** | ≤ **5,0 %** |

Highlight außen auf L>96 (Review P2-B4/P3-B7). E1 nach der
Rev-2-Formel aus der P0b-Vormessung eingetragen (GRAVEYARD auf die
ungünstigere Szene geeicht). HINWEIS an die Builder: Innen liefert
der Paletten-Offset allein nur 1,62/0,81/1,12 % — die Lücke von
0,33/0,11/0,21 pp MUSS aus Kegelkernen (§2.1), HOT_RINGS am Docht
(§2.6) und Tint-Masken (§4.2) kommen (P0b-Warnung 1). Die
L<16-Bänder innen sind auf die Simulation geeicht (P0b-Warnung 3:
'k'/'t' bleiben bewusst unverschoben — Silhouetten-Entscheid §3.1;
alle drei Bänder liegen unter dem IST und sind damit weiterhin
Verbesserungs-Gates).
**Goodhart-Gegen-Gate:** Highlight-Texel verteilen sich auf ≥ 3
Palettenton-Klassen und ≥ 12 zusammenhängende Cluster; kein
Einzelton stellt AUSSEN > 60 %, INNEN > 75 % (P0b-Warnung 2: der
Stein-Spitzlicht-Ton 'D' stellt innen naturgemäß 62-69 % — die
60er-Grenze wäre dort unabhängig von der Bildqualität rot). Positiv-Kontrolle:
GP5-Archivbild reproduziert Median 24,9 ±0,5. Negativ-Kontrolle:
Schwarzbild (Median < 5, Highlight 0).

### M2 Licht-Quantisierung (3-Kanal-Schätzer, validiert T6 §4b)

A/B-Aufnahme (Licht / `__noLight`), CATACOMBS-Kamera (40,190),
Zeit eingefroren, fester Pulse.
- **Mess-Zone (bindend, Review P3-M3):** Vereinigung der Ringe
  `0,48·r < d ≤ r` über alle Fackeln im Bild (Warm-Glow-frei);
  Fenster-Validierung im Report.
- **Abtastung:** 2×2-Block-MITTELWERT (Review P1-m5/m5-Def).
- `lichtstufen_anzahl`: distinkte a-Werte (Raster 0,01) **≥ 9 und
  ≤ 13** (Untergrenze = Goodhart-Sperre gegen Vergröbern, Review
  P3-M6; 13 = LIGHT_STEPS+1, Review P1-B2).
- `lichtstufen_plateau_anteil` **≥ 95 %** (±0,01) gegen die
  DEKLARIERTE Liste `{ambient·k/12, k=0..12}` (folgt aus der
  relativen Quantisierung §2.1 — das Fernfeld liegt exakt auf
  k=12 = ambient; Review P3-B1/M4).
- **Gradient-Schnitt** (Jury-Bild, NUR CATACOMBS): a entlang
  72 px vom Fackelzentrum, ausgewertet auf Block-Mittelwerten;
  **≥ 8 und ≤ 13 Sprünge**, jeder ≥ 0,04 (0,55/12 = 0,0458 ✓),
  kein Plateau < 2 Blöcke (Review P2-B5: 2-px-Blöcke können keine
  3-px-Plateaus garantieren).
- **Glow-Zone getrennt (E2, GEEICHT): ≤ 24 distinkte
  (A−B)-Luminanzwerte auf RASTER 1 L** (Raster-Festlegung P0a:
  0,01-Raster misst Rauschen, IST wäre 294), Block-Mittel, Ring
  d ≤ 0,48·r, fester Pulse. **Mess-Szene FEST:** GRAVEYARD-Fackel
  tc(28,18) — CATACOMBS hat KEINE freistehende Fackel (P0a) —
  Spieler auf (606,318), Kamera klemmt auf (320,204); Aufbau
  erfüllt nachgewiesen Spielerlicht-Abstand ≥ 2r, Ring im Bild,
  außerhalb Vignetten-Zone, HUD-frei. IST 35 → E2 = max(24, 21)
  = **24**.
Kontrollen: A-gegen-A → 1 Stufe; Fernzone → a == ambient ±0,01
(exakt erfüllbar dank §2.1).

### M3 Sprite-Beleuchtung

Silhouetten-Vergleich NAH/FERN, CATACOMBS; Frames FESTGENAGELT:
`player_down_0` und `skeleton_0`, UNGESPIEGELT, Blickrichtung per
Rig gesetzt (Review P2-M-4). `dE` := euklidischer RGB-Abstand der
Silhouetten-Mittelfarben (Review P3-m6).
- `ΔWarm = (R−B)_nah − (R−B)_fern` **≥ +18** (Prüfer-Modell:
  ≈ +68 erreichbar).
- Halbseiten-Modellierung: L-Differenz fackelzugewandte gegen
  -abgewandte Hälfte NAH **≥ +6 L** (per Zweiton-Rampe §4.2);
  Kontrolle: dieselbe Differenz mit `__noTint` < 2 L (Differenz
  zur ungetönten Referenz DESSELBEN Frames — die Kunst selbst darf
  asymmetrisch sein, Review P2-M-4).
- Ausbrennen: 0 Silhouetten-Texel L > 240.
Positiv-Kontrolle: `__noTint` UND `__noLight` → dE == 0 gegen
Referenz. Negativ-Kontrolle: zwei ferne Standorte, gleicher Frame:
dE < 4.

### M4 Kronen-Maßstab & Verdeckung

- Art (check_gfx6_art): ≥ 3 Kronen-Keys Tinten-Bbox ≥ 40×28,
  ≥ 1 mit ≥ 56×40.
- Dach: bestes 48×32-Fenster GRAVEYARD, **das das Gegen-Gate
  erfüllt** (≥ 2 XL-Keys, kein Key > 60 %), hat ≥ 85 %
  Kronen-Pixel-Deckung (Formulierung nach P0b-§4b: sonst wären
  Bestwert und Gegen-Gate gegeneinander unerfüllbar; der
  P0b-Layout-Entwurf erreicht 100 % bei 4 Keys / max 54,7 %).
- Spieler-unter-Laub, Beweiszelle UNTER EINER xl_b-KRONE
  (span [4,3], §5.5): Kopf-Fenster = oberste 16 Sprite-Zeilen
  (KRONEN_HEAD_ROWS_GP6 = 16, span-generisch hergeleitet, Review
  P3-B5/P1-M8); `verdeckt_kopf ≥ 100` UND
  `verdeckt_kopf / silhouette_kopf ≥ 0,75`.
  Kontrollen: silhouette_kopf > 0; kronenfreie Kachel → 0;
  A-gegen-A → 0.
- Kein Rechtsrand-Ploppen (§5.4, Smoke-Beleg).

### M5 Kontaktschatten-Abdeckung

- Geometrie (Smoke additiv): jede Klasse ≥ 8 sichtbare
  Schatten-Texel UNTER der Fußkante (Prüfer bestätigt: 11..18
  erreichbar).
- Bild: ΔL ≥ 6 auf ≥ 8 Texeln unter der Fußkante, außen + innen;
  **Innen-Messort in einem Fackelkegel (a ≤ 0,15), Vignetten-Zone
  d > 90 px vom Bildzentrum ausgeschlossen** (Review P2-M-9: ohne
  Kegel ist ΔL 6 innen arithmetisch unerreichbar).
Positiv-Kontrolle: Boss grün. Negativ: Projektil → 0;
Frame-gegen-sich-selbst → 0.

---

## §2 PAKET L — Licht-Quantisierung

2.1 **RELATIVE Quantisierung (Kern-Korrektur, Review P3-B1):**
`LIGHT_STEPS = 12`; `quantizeLight(rest) = round(rest·12)/12` auf
der REST-Helligkeit rest ∈ [0,1] (Produkt der Licht-Profile,
OHNE ambient). `a = ambient · quantizeLight(rest)`. Damit:
Stanz-Alpha `X = 1 − quantizeLight(rest) ∈ [0,1]` (nie negativ),
Fernfeld exakt a = ambient, jeder Kegel trägt 13 Stufen unabhängig
vom Karten-Ambient, Gradient-Schnitt 8+ Sprünge möglich.
quantizeLight wird GENAU EINMAL auf das fertige PRODUKT
`rest = Π rest_l` angewandt (nie je Licht; Review P2-M-2).

2.2 **Pure Funktion** `lightRuns(lights, camera, ambient, timeSec,
viewW, viewH)` in lighting.js: liefert eine **paarweise DISJUNKTE
Partition** der Vereinigung aller Licht-Bounding-Boxen (jeder
Texel GENAU EINMAL gestanzt, Review P3-M2) als Scanline-Segmente
`{x, y, w, h:4, k}` je **4-px-Zeile** mit **HARTEN Bandgrenzen —
KEIN Bayer im Lichtfeld** (Phase-0-Entscheid nach Messung, GP6_
PHASE0 P0a: der ±1-Block-Saum deckt 60 % des Fensters = faktisch
Voll-Bayer bei Faktor-3-Kosten; die 4-px/12-Stufen/hart-Variante
mit gebündeltem Zeichnen misst 1,00× Bestand bei 1605 Läufen.
Die Bayer-Rastersprache tragen Vignette + Lit-Dither;
Jury-Deklaration §9). **Rest-Profil FEST (P0a-Annahme A1
bestätigt):** `rest(u) = clamp((u − 0,25)/0,75, 0, 1)` mit
u = d/r — die lineare Interpolation der Bestands-Treppe.
**k=12-Läufe (X=0) werden UNTERDRÜCKT** (No-Op-fillRects).
Flicker-Radius auf ganze 2-px-Schritte gerundet; rWob-Jitter in
der Lookup-Distanz bleibt. **KEIN Frame-Cache** (Review P2-B3) —
jeden Frame rechnen; **Lauf-Deckel ≤ 2000/Frame** (konsistent zum
1,35×-Zeitbudget bei ~0,95 µs je fillRect, P0a; der Rev-2-Deckel
1200 war geometrisch unerreichbar — eine einzelne Fackel erzeugt
1206 Läufe bei 2-px-Höhe).

2.3 **draw()**: Ambient-Fill unverändert zuerst (Detektor-Sonde).
Danach die Läufe als destination-out-fillRect `rgba(0,0,0,X)` bei
globalAlpha=1, X = 1 − k/12 — **gebündelt nach Stufe ("Eimer",
P0a-Hebel A): 13 VORBERECHNETE rgba-Strings, Läufe nach k
gruppiert gezeichnet, 13 fillStyle-Zuweisungen je Frame** (erlaubt,
weil die Partition disjunkt ist → Reihenfolge frei; spart gemessen
24-29 %). `ctx.drawImage(off,0,0)` 3-arg. (Alpha-Mathematik vom
Prüfer bestätigt: dst_a = a, Rundung ±0,002.)

2.4 **Performance-Gate (GEMESSEN und ENTSCHIEDEN, GP6_PHASE0
P0a):** Worst-View ist CATACOMBS Kamera **(112,80) mit 21
Lichtern** (P0a-Gegenprobe; die Rev-2-Angabe (96,72)/„20 Fackeln"
war ungenau: dort sind es 19 Fackeln + Spielerlicht). Baseline
gemessen: 2,067 ms Mittel / 2,700 ms P95 → Limits **≤ 2,79 ms
Mittel, ≤ 4,05 ms P95, ≤ 2000 Läufe**. Die beschlossene Geometrie
(§2.2/§2.3: 4-px, 12 Stufen, hart, Eimer) misst im Harness
**1,00× Mittel / 1,00× P95 / 1605 Läufe = GRÜN mit Reserve**.
Phase 3/4 verifizieren das Gate am ECHTEN Umbau im Spiel.
Rest-Entschärfungskette, falls der echte Umbau abweicht:
(1) 8-px-Laufhöhe (gemessen 0,79×/825), (2) sanktionierte
Einzelausnahme 160×90-Offscreen + EIN 5-arg-drawImage,
(3) STOPP + Eskalation Hauptloop.

2.5 **Warm-Pass bleibt arc-basiert**, `pulse` auf 5 feste Werte
quantisiert (0,5/0,625/0,75/0,875/1,0).

2.6 **HOT_RINGS an den Docht, korrekt verortet (Review P1-B4/
P3-B3):** Bodenfackeln `hotY = cy − 2` (Grid-Zeile 6, im neuen
Kernbereich); Wandfackeln `hotY = cy − 4` (Zeile 4 — die
Wandflamme endet eine Zeile höher). NIE cy+2 (das wäre der
Pfosten/die Ziegelwand). Weiß-Stresstest danach wiederholen.

2.7 Smoke additiv (GP6-§7F): quantizeLight-Wertemenge (13 Werte),
lightRuns-Determinismus, Disjunktheit ("keine zwei Läufe
überlappen"), Läufe ⊆ Bounding-Box-Union, k ⊆ 0..12,
Radius-Rundung, Lauf-Zählung ≤ 2000 am Testlicht-Setup,
k=12-Unterdrückung, Eimer-Bündelung (≤ 13 fillStyle-Wechsel),
drawImage-Argumentzahl-Protokoll.

---

## §3 PAKET B — Belichtungs-Sockel

3.1 **Paletten-Offset:** ADDITIV je Kanal (+c für ΔL = +15,1;
eine Operation, Soll-Hex-Tabelle aus P0b ist bindend für Art UND
check_gfx6_art; Review P3-m1). Gras-Rampe: e 47,0 / E 61,1 /
a 82,8 / m 104,5 / K 111,2 / A 129,2; 'D' 156,8 Deckel; k/n/0/*/+
bleiben unten. **Wasser-Rampe VOLLSTÄNDIG (Review P3-M9):**
w 47,0 / W 67,3 / 9 87,7 / '=' 108,0 (gleichmäßige Schritte);
Ordnungs-Auflage `k < w = e < W < 9 < '=' < A < D`; 'w' behält
den kühleren Farbort (B > G). **Folge-Anpassungen (Pflicht):**
(a) `water_mid_calm`: 'k' → '+' (35,5) als Tiefen-Schleier, sonst
verdoppelt sich der Zonensprung (Review P3-M14); (b) Back-Kronen-Rim: **Variante C aus der P0b-Rim-Analyse** —
in den drei tree_canopy_back_*-Grids wird die 'E'-Rim-Zeile zu
'*' (dunkle Oberkontur) und der Rim-Ton 'e' wandert an denselben
Spalten EINE Zeile nach innen; Ergebnis +11,4 L über '+', 0 %
unsichtbare Rim-Texel, GP5-R2-Beziehung (10,5 L) auf 0,9 L genau
reproduziert; Jury-Deklaration (Review P3-M11);
(c) shore_*-Dämpfung wird RELATIV formuliert: Kachelmittel
shore_s/e/w ≥ 8 L UNTER shore_n nach Offset (Review P3-B4).
**Globalität deklariert (Review P3-M10, P0b-präzisiert):** Die
Rampen-Töne stecken auch in Innen-Grids (Nutzer-Listen in
.tmp/gp6_nutzer_tabelle.json) — Mit-Aufhellen GEWOLLT. Anteile:
CATACOMBS 1,1 %, BOSS_KAMMER 0,7 %, **FLUESTERGRUFT 7,1 %** (der
Kanal trägt die volle Wasser-Rampe — deshalb liegt deren
SIM-Median bei 38,0 statt 34,6; das M1-Band hält, die
ambientTint-Reserve ist dort 5-6 L, GRÖSSER als in Rev 2
angenommen); Jury-Deklaration. Wiesenlicht-Klassen (6 Grids) auf ±2..4 L um
das neue Pool-Mittel ~50. Der 47er-Pool nur per Offset.

3.2 **Ambient (einzige Flusstest-Änderung §7.A):** GRAVEYARD
0,45→**0,22** · CATACOMBS 0,78→**0,55** · FLUESTERGRUFT
0,85→**0,52** · BOSS_KAMMER 0,66→**0,48** (paarweise
verschieden). Median-Prognosen (Prüfer-modellbestätigt): 39,2 /
41,2 / 34,6 / 39,8.

3.3 **Testfreie Begleit-Hebel:** Vignette VIG_STEP 0,09→0,06,
VIG_MAX_LEVEL bleibt 5, Profil auf a_max = 0,30 reskaliert
(Review P1-m2). **ambientTint-Feinjustierung NUR zu helleren/
wärmeren Tönen und nur solange die betroffene M1-Zeile mit
≥ 1,5 L Median-Reserve grün bleibt** (Review P2-M-7; die
FLUESTERGRUFT-Reserve ist klein). FLUESTERGRUFT: 2 extraLights im
Kanalraum (flicker 0,5, r ≤ 88).

3.4 **Highlight-Quellen (Render-Ebene, Review P2-B4):** außen
zählt L>96 (Träger: 'A' 129→103 Render, 'D'-Wegtexel, Kronen-
Spitzlichter, Fackelkegel-Kerne); innen L>128 (Träger: Kegel-Kerne
mit vollem Palettenwert). Die E1-Eichung in P0b macht die Ziele
erreichbar UND fix.

---

## §4 PAKET S — Sprite-Beleuchtung + Kontaktschatten

4.1 **`lightAt(lights, wx, wy, ambient, timeSec)`** pure in
lighting.js, Rückgabe `{f, warm}`; f über DIESELBE Lookup +
quantizeLight wie §2. **Abtastung mit UNGEJITTERTEM Radius (ohne
Flacker-wob) + 1-Stufen-Hysterese** (Stufenwechsel erst, wenn der
Rohwert die Grenze um ≥ 0,5 Stufenbreiten überschreitet) — sonst
stroboskopiert die stehende Figur mit 4 Wechseln/s (Review
P2-M-5). Abtastpunkt = Schatten-Anker (cx, Fußkante−1).

4.2 **Tint-Masken + Fassade (korrigierter Bauort, Review
P2-M-10/P1-M9):** Die Fassade wird beim BAU der renderables
(main.js:665-670) als ctx-Argument in die Zeichen-Closures
injiziert (eine Fassade "um die Schleife" erreicht die lexikalisch
gebundenen ctx nicht). renderables tragen `{fy, ax, ay, tint}`;
`tint:false` für Drops und Projektile; Props (Vase/Urne/Truhe)
werden GETÖNT; Level-Up-Ring läuft nach der Schleife am echten
ctx (tint-frei, deklariert). **Masken-Registry** `Map<canvas,
{name, grid}>` wird beim gfx-Bau mitgeführt (additiv, die Fassade
sieht nur Canvases). `buildTintMask(grid, palette, toneDunkel,
toneHell, richtung)` in sprite_factory.js: identische Alpha-Form,
je SPALTE einer von ZWEI Tönen (Rampe für die
Halbseiten-Modellierung — ein einzelner Ton kann keine Rampe,
Review P2-M-3), globalAlpha=1, lazy nach main.js:71. Je Sprite:
WARM-L, WARM-R (Töne 216,114,42 hell / 176,88,34 dunkel), KALT
(ambientTint-Paar). Draw: Original zuerst (Wächter B), dann Maske
source-over, warm-Alpha ∈ {0, 0,12, 0,24, 0,36} (Stufe aus
quantisiertem warm mit Hysterese), kalt-Alpha ∈ {0, 0,08, 0,16}.
KEIN 'lighter' auf Sprites. `window.__noTint` schaltet die
Masken-Draws ab (Rig-Kontrolle M3). Nach jedem Masken-Draw
globalAlpha=1.

4.3 **Kontaktschatten-Standardprofil:** SHADOW_DY [−1,0,1,2],
SHADOW_W [0,90, 0,95, 0,7, 0,4], SHADOW_A [0,30, 0,40, 0,20,
0,10]. BIG unverändert. Blink-Verhalten deklariert.

4.4 Smoke additiv: Schatten-Geometrie je Klasse, lightAt-
Determinismus + Wertemenge + Hysterese, Masken-Erzeugungsindex.

---

## §5 PAKET K — Kronen-Maßstab

5.1 **XL-Klassen:** tree_canopy_xl_a [3,2] 48×32, xl_b [4,3]
64×48, xl_c [3,2] 48×32, je + `_m`. Tinten-Bbox-Ziele M4.
Blattcluster-Trennlinien mit 'n'-Nähten (nicht 'k' — L<16-Budget,
Review P2-M-8), Spitzlicht oben links. Generator
.tmp/gen_crowns_gp6.mjs.

5.2 **Sway = gebackene Scher-Posen, EIN Draw pro Zelle:**
Legendenfeld `swayPoses` (Länge 8, Folge [0,+1,+2,+1,0,−1,−2,−1],
5 echte Posen, poses[0]===art, alle Keys existent, nur auf
span>1). Auswahl über neue pure Funktion `swayPose8` (§0.6).
**Bei gesetztem swayPoses entfällt die ax-Translation des
Span-Zweigs (tilemap.js:931) ersatzlos** (sonst schert UND
wackelt die Krone; Review P2-m-1); Hänge-Kronen (:955) unberührt.
Ruhelage t=0 byte-gleich (Prüfer bestätigt: swayPhase-Index ist
bei t=0 für alle Cluster 0, sofern swayPose8 %8 rechnet).
ANCHOR_CLAMP: alle 6 XL-Keys W=4.

5.3 **Kronen-Schatten:** `canopy_shadow_xl_[a|b|c]` als
EIN-Draw-Bake, Maß EXAKT sw·16 × 32 (xl_b: 64×32 — steht in der
§7.G-Maßtabelle, Review P1-B3), Silhouetten-Projektion mit
Randerosion, Töne 'n'/'0' in Bayer-25 % (nicht 'k'; Review
P3-m7). `_m`-Kronen ziehen denselben (ungespiegelten) Schatten-
Key — deklariert. **Versatz = anchorOffset der Krone PLUS
(+2,+2)** (Lichtrichtung; ein fixer Versatz ohne anchorOffset
risse ab, Review P1-M5). **ALLE Kronen-Schatten (canopy_shadow
UND canopy_shadow_xl_*) zeichnet ein ZWEITER Durchgang NACH allen
Bodenkacheln, Fringes, Shore-, Bank- und Depth-Overlays des
Fensters** (sonst übermalen Nachbarkacheln bis zu 87 % des
XL-Bakes; Review P2-M-6). canopy_shadow selbst: Schachbrett →
Bayer-25 % über 'n'/'0'.

5.4 **Culling-Fix rechts**, exakt: `const txEnd = over ?
Math.min(wTiles-1, tx1+1) : tx1;` (Ground bleibt unverändert,
Review P3-m2).

5.5 **GRAVEYARD_OVER_ROWS neu** (Generator gen_over_gp6.mjs):
zwei geschlossene XL-Dächer (Nord um (31,9) MIT xl_b — die
M4-Beweiszelle liegt UNTER einer xl_b-Krone —, Süd-West um
(12,22)), 2×2/Back ausgedünnt, B/C ≤ 6. **Guards zeilenexplizit:
Spalte 21 leer in ALLEN Zeilen 0..12; Zeile 12 leer in ALLEN
Spalten 0..21** (Review P1-m8); keine span-Zeichen in Ground-rows;
Stammdeckung span-generisch. sol/geo unberührt (Prüfer bestätigt).

---

## §6 PAKET R — Restliste-Politur

6.1 **Kanal-Uferring:** `water_shallow_vert`, `_vert_v1`,
`_vert_v2` (kollisionsfreies Präfix, Ableitung geprüft) + EINE
Legendenzeile map_fluestergruft.js:97. Gate: Ufer-Anisotropie
längs ≥ 2,0 (Positiv-Kontrolle: Mitte 3,97).

6.2 **Boss-Kratzer kalt:** 'T' und 'm' raus, 'L'+'k'-Dither.
Gate: Δ(R−B) Kratzer-gegen-Boden ≤ +8 (9-Lauf-Modus;
Lit-Dither-Blinken wird im Jury-Material erklärt).

6.3 **Wegsporn:** neue Legendenzeile (unbenutztes Zeichen,
`path_pebbles`, EXAKT die 'p'-Flags: solid false, fringeSource,
fringeSet 'grass', bankSet 'g'); ROWS-Tausch NUR (28,15)+(29,15)
'p'→neu. Belegstellen für den Integrator: GRAVEYARD_ROWS
maps.js (Zeile 82 der ROWS-Liste, ty=15), Hash-Definitionen
smoke:1998-2008; Prüfer hat sol/geo-Neutralität verifiziert
(keine Fackel/Spawn/Portal-Zelle betroffen). Emissions-
Byte-Beweis der 6 Nachbarzellen im Integrator-Auftrag.
shot_gfx6-Wegsporn-Gate zieht Soll-Legende + Arts nach (§1).

6.4 **Teich:** (a) Specular: 4..6 '='-Texel je Ring-0-Kachel als
ISOLIERTE Cluster (Größe 1..4, nicht in den obersten 4
Kachelzeilen) ZUSÄTZLICH zum bestehenden 26-Texel-Uferband —
Bezugsfläche fürs Gate ist TEICH_RECT (4 Ring-0-Kacheln → 16..24
Cluster-Texel), Zählweise: Zielton-Toleranz 6 + Clustergröße,
getrennt vom Ufer-Band (Review P3-M7 — die Rev-1-Zahl 96..144
gehörte zur 24-Kachel-Fläche, nicht zum Fenster); die 4
water_*-Frames BEHALTEN ihre '='-Tupfer, das alte
check_gfx-'='-Gate (≥20 über water_*) bleibt und das neue
Specular-Gate läuft GETRENNT auf water_shallow* (Review P1-M6).
(b) Ufer-Entregelung shore_n/s/e/w + shore_diag: höchstens EINE
durchgehende Konturlinie je Kachel; Lückenraster je Richtung
verschieden; shore_diag ohne 4-Zeilen-Wiederholung, keine 2
vollen Spalten; Helligkeits-Ordnung RELATIV: shore_s/e/w ≥ 8 L
unter shore_n (§3.1c). Emissions-LOGIK byte-unberührt.

6.5 **Gras:** Wiesenlicht über §3.1; 'u'/'j'-Pools n 3→5 (zwei
neue Größenstufen, ungerade, teilerfremd, variants[0]===art).

6.6 **Flammen:** Kern '1' an den Docht — Bodenfackeln Zeilen
5..7, WANDFACKELN Zeilen 3..5 (deren Flamme endet früher; ein
'1' in Zeile 6/7 läge im Metallgehäuse, Review P3-B3); Spitze
'o'/'r'-dominant, Silhouette ≤ 5 breit, Fläche ±20 %. HOT_RINGS
gemäß §2.6.

6.7 **HUD:** (a) XP-Leiste: Maße UNVERÄNDERT (xh=5, Innenhöhe
3 px — eine 8-Zeilen-Rampe ist dort unmöglich, Review P1-B1/
P3-B6): **3-Zeilen-Rampe** hell/mittel/dunkel in EIGENEM Farbort
Moosgrün, Rinne dunkles Moosgrün ~L 25, hellste Rampenzeile
≥ L 125 → Kontrast ≥ 100 L. (b) GOLD-/Trank-Ziffern: 3×5-
Pixelziffern per fillRect über der WERT-Spalte; BEIDE
fillText-Züge (hud.js:155 UND :157, Kontur+Fill) bleiben
unverändert als Test-Sonde und werden von ZWEI Deckrechtecken
überdeckt (eines je Panel-Farbband, Grenze y 15; Geometrie als
feste Konstanten im Code hergeleitet, kein measureText;
Sichtprüfung im Jury-Material; Review P2-m-3/P3-m3). GOLD-Θ auf
Game-Over/Sieg-Schirmen bleibt (bewusste Auslassung,
Deklarationsliste; Review P3-m4). (c) Boss-Lag-Streifen: 8-Zeilen-
Rampe (der Boss-Balken hat Innenhöhe 8 — dort passt sie).
Alles fillRect-only, GOTT-Anzeige unangetastet.

---

## §7 TEST-ÄNDERUNGS-KATALOG (abschließend)

**A. Flusstests — GENAU 13 Wert-Anpassungen** (zeilengenau von
zwei Prüfern verifiziert): check_main ~202/246/283 `0.45`→`0.22`,
~229/236 `0.78`→`0.55`; check_boss ~143/172/185/244/264
`0.66`→`0.48`, ~157/165/277 `0.85`→`0.52`. PRO ZEILE beide
Wert-Vorkommen (Literal + Meldungs-String); Folgezeilen 158/278
interpoliert → NICHT anfassen. check_inventory NULL. git-diff-
Beweis. Kontingent danach VERBRAUCHT.

**B. smoke:1996** AMBIENT 0.22/0.55/0.52/0.48 + Kommentare
:1975/:1994-1995 (`GP6-§7B`).

**C. smoke-Bestand (Marker):** C1 `smoke:658-666` Stammdeckung
span-generisch. C2/C3/C4: die drei tilemap-Bestandsstellen aus
§0.9 spiegeln sich in `smoke:1762-1799` (Schattenzeile ay+sh über
sw Spalten, XL-Ein-Draw; die Koordinaten-Assertions sind
reihenfolge-unabhängig — der Zweitpass allein bräuchte KEINE
Test-Änderung, Review P1-m1) und `smoke:1875-1968` (ANCHOR_CLAMP-
Klassen W=4, Culling-Rand tx1+1).

**F. ADDITIVE NEUE Blöcke** (`GP6-§7F`): §2.7-Liste, swayPose8 +
swayPoses-Validierung (+ Translation-Entfall-Beweis), Schatten-
Geometrie je Klasse, XL-Existenz + Bbox, canopy_shadow_xl-
Emission + Zweitpass-Beleg, water_shallow_vert-Verdrahtung,
Wegsporn-Legende + Emissions-Byte-Gleichheit, Tint-Masken-Index,
lightAt-Hysterese.

**G. check_gfx6_art.mjs ersetzt check_gfx5_art.mjs** (Muster
SPEC_GRAFIKPASS_5.md:52 — Rev-1-Verweis "§0.8" war falsch,
Review P2-m-4): portierte Wächter; Maßtabelle **{16×16, 32×32,
48×32, 64×48, 64×32}**; NEW_TONES = P0b-Offset-Tabelle;
Palettenumfang exakt 61+3 (§0.11); Flammen-Gate Docht-Kern
(Boden 5..7 / Wand 3..5); Kratzer-Gate ('T'/'m'-frei + kalt);
Kronen-Bbox; Specular-Cluster-Zählung §6.4a; '='-Bestands-Gate
auf water_* bleibt.

**H. Verboten:** fringeOverlays-Bytes, sol/geo, Stub-
Erweiterungen, jede nicht gelistete Bestandszeile.

---

## §8 BUILD-TOPOLOGIE (alle Ausführenden Opus, exklusiver Besitz)

**Phase 0 (parallel, Ergebnisse BINDEND vor Phase 1):**
P0a: Perf — Bestands-Baseline am Worst-View (Kamera (96,72),
20+1 Lichter), dann lightRuns-Prototyp (Ringband + Bayer-Saum),
Gate §2.4; PLUS E2-Vormessung (Glow-IST, freistehende Fackel).
P0b: Offset-Rechner → Soll-Hex-Tabelle (bindend); E1-Vormessung
(Simulation auf palette_pur-Bildern); Generator-Entwürfe
gen_crowns_gp6 + gen_over_gp6 (inkl. Beweiszellen-Rechnung).
→ Hauptloop trägt E1/E2 als Rev 2.1 ein, committet, DANN Phase 1.

**Phase 1 (parallel):** ART (sprites.js + palette.js: §3.1
komplett inkl. Folge-Anpassungen a/b/c, §5.1, §6.1, §6.4, §6.5,
§6.6, §6.2, path_pebbles) · ENGINE-A (lighting.js §2 + §4.1;
tilemap.js §5.2/§5.3/§5.4).

**Phase 2:** ENGINE-B (main.js §4.2-Fassade + Registry + §4.3;
sprite_factory buildTintMask; hud.js §6.7 + §3.3-Vignette;
maps.js + map_*.js §3.2/§3.3/§5.5/§6.1/§6.3).

**Phase 3:** INTEGRATOR (§7 komplett, Emissions-Byte-Beweis,
alles grün: syntax, smoke 3×, 3 Flusstests, check_gfx6_art,
probe_god).

**Phase 4:** PROOF (.tmp/shot_gfx6.py mit §1-Nachzugsliste,
M1-M5 + Kontrollen, Szenen/Crops/Strips/Gradient-Schnitt).

Nach jeder Phase: Hauptloop prüft + committet.

---

## §9 JURY (3 direkte Opus-Agenten)

Prüfen die MESSUNGEN, liefern Sichtbefunde, Note informativ.
Deklarationsliste: **Lichtfeld hart gestuft OHNE Bayer, Kanten
vertikal auf 4 px gerastert** (Phase-0-Messentscheid §2.2; die
Bayer-Rastersprache tragen Vignette + Lit-Dither — falls die Jury
die 4-px-Kante als Prio-0 liest, ist der Tausch auf 2 px eine
bewusste 1,55×-Kosten-Entscheidung für Michael), 'D'-Dominanz der
Innen-Highlights bis 75 % (§1/M1), fillText-Überdeckung + GOLD-Θ
auf Game-Over/Sieg (§6.7b), Schatten-Blinken (§4.3), Hänge-
Kronen-Rest + ungespiegelte _m-Schatten (§5.3/5.5), Lit-Dither-
Blinken (§6.2), ambientTint-Regel (§3.3), Innen-Grids erben den
Offset inkl. Kanal 7,1 % (§3.1), Back-Kronen-Rim Variante C
(§3.1b), Level-Up-Ring/Drops/Projektile tint-frei — Props getönt
(§4.2), 5-arg-Einzelausnahme falls §2.4-2 zog. Material: Vollszenen, 9 Crops 4-6×, Strips,
Gradient-Schnitt, Messreport. Max 3 Runden; danach Ergebnis an
Michael.

## §10 ABNAHME

M1-M5 grün + Jury ohne neuen Prio-0 + Suiten grün (syntax, smoke
3×, 3 Flusstests mit GENAU §7.A per git-diff, check_gfx6_art,
**.tmp/probe_god.mjs**) + Übergabe + Commit. Note informativ.
