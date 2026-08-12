# GP6 Phase 0 — Ergebnisse (12.08.2026, wf_cdc1e843-aa8)


---

# P0a — Performance + E2

Alle Messungen abgeschlossen, Server gestoppt, keine Spieldatei berührt. Hier der Bericht.

---

# P0a — Performance-Gate §2.4 + E2-Vormessung

**Stand:** HEAD 73de948, keine Datei in `game/**` angefasst (`git status --porcelain game/ design/ tools/` leer). Server ausschließlich 8124, nach dem Lauf gestoppt (`ss` zeigt 8123/8124 frei).

## 0. Messumgebung und Disziplin

| Punkt | Wert / Herkunft |
|---|---|
| Rig | Route-Interception der Modul-Wrapper + `add_init_script` wie `.tmp/shot_gfx5.py:73-250`; `performance.now`-Override gesichert als `window.__origNow`, alle Zeitnahmen laufen über den ORIGINALZEIGER |
| Renderer | ANGLE/Vulkan **SwiftShader** (Software-Rasterizer), identisch mit und ohne `--disable-gpu` (selbst geprüft). Absolutwerte sind VM-Softwarewerte, keine Handy-GPU-Werte. Genau deshalb ist das Gate relativ (Review P2-B1) |
| Zeitauflösung | Chromium liefert 0,1 ms Raster. Bei ~2 ms Messwerten sind das 5 % Quantisierung |
| Wiederholungen | Je Messung 3 Läufe à 300 Frames, berichtet werden alle drei plus Median |

## 1. Bestands-Baseline am Worst-View (Auftrag 1)

Skript `.tmp/gp6_p0a_perf.py`, Teil A. Aufbau: CATACOMBS, Spieler per Intervall auf (256,162) festgenagelt, Gegner geräumt (sonst wandern Elite-Lichter durchs Bild), Kamera hart geprüft auf **(96,72)**, `__timeScale = 1` (Simulation läuft), `lighting.draw` mit `__origNow` umschlossen (Muster WRAP_LIGHTING, messend statt unterdrückend).

**Lichtzahl selbst nachgezählt** (Introspektion mit der echten Culling-Regel aus `lighting.js:150-160`, r hängt vom Flicker-wob ab, 300 Frames):

| Größe | min | max | Modus |
|---|---|---|---|
| Lichter im Culling-Rechteck gesamt | 18 | 20 | **20** |
| davon Fackeln (flicker ≥ 0,8) | 17 | 19 | **19** |

`lighting.draw` bekommt **26** Lichter übergeben (25 Fackeln + Spielerlicht), `ambient = 0.78`, `tint = #06080f`.

**Befund gegen §2.4:** Die Spec sagt „20 Fackeln + Spielerlicht" (= 21). Gemessen sind es **19 Fackeln + Spielerlicht = 20 Lichter** (Modus), Spannweite 18 bis 20. Die Zahl 25 Fackeln gesamt stimmt. Gegenprobe über einen 8-px-Rasterlauf (`.tmp/gp6_p0a_karte.mjs`): die teuerste Kamera ist nicht (96,72), sondern **(112,80) mit 21 Lichtern** bei t=0.

**Baseline `lighting.draw` je Frame:**

| Lauf | Mittel | Median | P95 | Max |
|---|---|---|---|---|
| 1 | 2,067 ms | 2,000 | 2,700 | 6,000 |
| 2 | 2,063 ms | 2,000 | 2,500 | 4,400 |
| 3 | 2,103 ms | 2,000 | 2,800 | 5,500 |
| **Modus/Median der 3** | **2,067 ms** | | **2,700 ms** | |

Vorlauf desselben Skripts (vor der Korrektur der Negativ-Kontrolle) lieferte 1,964 / 1,971 / 2,020 ms. Über 6 Läufe liegt die Baseline bei 1,96 bis 2,10 ms, Streuung unter 7 %.

**Gate-Schwellen daraus:** Mittel ≤ 1,35 × 2,067 = **2,79 ms**, P95 ≤ 1,5 × 2,700 = **4,05 ms**, Läufe ≤ 1200.

## 2. Prototyp lightRuns (Auftrag 2)

`.tmp/gp6_p0a_lightruns.mjs`, umgesetzt nach §2.1/§2.2: relative Quantisierung `quantizeLight(rest)=round(rest·12)/12` genau einmal auf das fertige Produkt, `a = ambient·q`, Stanz-Alpha `X = 1−k/12`, Ringband-Scanline-Läufe je 2-px-Zeile als disjunkte Partition der Bbox-Vereinigung, Bayer-4x4 nur als ±1-Block-Saum (4er-Nachbarschaft, rollender 3-Zeilen-Puffer), Flicker-Radius auf 2-px-Schritte gerundet, rWob-Jitter in der Lookup-Distanz (per Licht als 256-Eintrag-LUT über (d/r)², spart die Wurzel), kein Cache.

**ANNAHME A1 (Spec-Lücke, muss in Rev 2.1 entschieden werden):** Die Spec legt das Rest-PROFIL `rest_l(u)` nicht fest. Der Bestand ist eine 6-stufige Treppe (kumulativ 1 / 0,82 / 0,64 / 0,461 / 0,299 / 0,15 / 0 bei u = 1,00 / 0,85 / 0,70 / 0,55 / 0,40 / 0,25). Normiert auf t = (u−0,25)/0,75 liegen diese Stützstellen bei 0 / 0,183 / 0,365 / 0,562 / 0,780 / 1,0, also praktisch exakt linear. Prototyp-Profil deshalb `rest(u) = clamp((u−0,25)/0,75, 0, 1)`. Sensitivität mit Profil „voll" (Rampe über den ganzen Radius): 5049 statt 5083 Läufe, also unkritisch.

**(a) reine JS-Zeit, (b) Lauf-Anzahl** (Node v20, 300 Frames, Kamera (96,72), 26 Lichter):

| Modus | JS Mittel | JS P95 | Läufe Mittel | Läufe Max | Saumblöcke/Frame |
|---|---|---|---|---|---|
| saum (Spec) | 0,749 ms | 1,100 | **5083** | 5318 | 8705 von 14400 |
| saum inkl. k=12 | 0,701 ms | 0,874 | 5217 | 5474 | 8705 |
| hart (Stufe 1) | 0,531 ms | 0,615 | **3245** | 3459 | 0 |
| wertsaum (Variante) | 0,614 ms | 0,730 | 3409 | 3604 | 2795 |
| voll-Bayer (Gegenprobe Rev 1) | 0,650 ms | 0,818 | 6222 | 6438 | 14400 |

Im Browser (gleiche Funktion, injiziert): saum 0,868 ms Mittel / 1,100 P95, hart 0,691 / 0,800.

**(c) echte Canvas-Kosten** (Harness auf leerer Seite, rAF-getaktet, echte Lichter aus Teil A, Ambient-Fill + destination-out-fillRects mit rgba bei globalAlpha=1 + 3-arg-drawImage + unveränderter Warm-Pass):

| Bench | Mittel | P95 | Läufe |
|---|---|---|---|
| bestand (Nachbau von HEAD) | 2,064 ms | 2,600 | 0 |
| leer: Ambient-Fill + drawImage | 0,112 ms | 0,200 | 0 |
| leer + Warm-Pass (Boden ohne jeden Stanz) | 0,399 ms | 0,500 | 0 |
| NEU saum (JS + Canvas + Warm) | **6,225 ms** | **8,100** | 5083 |
| NEU hart (JS + Canvas + Warm) | **4,495 ms** | **5,800** | 3245 |
| NEU wertsaum | 4,986 ms | 6,500 | 3409 |

**§2.7-Selbstprüfungen alle grün:** quantizeLight liefert genau 13 Werte; Determinismus byte-gleich; k ⊆ 0..12, h=2, x/y/w auf 2-px-Raster; Disjunktheit 0 doppelt gestanzte Blöcke; Läufe ⊆ Bbox-Vereinigung; Radius-Rundung; Fernfeld (Licht außerhalb) liefert 0 Läufe, a bleibt exakt ambient.

## 3. Gate-Auswertung (Auftrag 3)

Verbindlich ist das Harness-Verhältnis, weil dort Bestand und Umbau im selben Rahmen laufen. **Treue-Prüfung: Harness-Bestand / im Spiel gemessene Baseline = 0,999x Mittel, 0,963x P95.** Das Harness bildet den Bestand also praktisch exakt ab.

| Stufe | Mittel | Faktor (Limit 1,35) | P95 | Faktor (Limit 1,50) | Läufe (Limit 1200) | **Verdikt** |
|---|---|---|---|---|---|---|
| **Stufe 0 (Spec, Bayer-Saum)** | 6,225 ms | **3,02x** rot | 8,100 | **3,12x** rot | **5083** rot | **ROT** |
| **Stufe 1 (Bayer-Saum weg)** | 4,495 ms | **2,18x** rot | 5,800 | **2,23x** rot | **3245** rot | **ROT** |

Gegen die im Spiel gemessene Baseline gerechnet: 3,01x / 3,00x (Stufe 0) und 2,17x / 2,15x (Stufe 1). Beide Stufen reißen alle drei Kriterien. **Stufe 2 habe ich auftragsgemäß NICHT gezogen.**

### Warum: der Deckel ≤ 1200 Läufe ist geometrisch unerreichbar

- **Eine einzige, voll sichtbare Fackel** (r=72, Bildmitte, sonst nichts) erzeugt bereits **1206 Läufe** ohne Bayer und **1770** mit Saum (`.tmp/gp6_p0a_lightruns.mjs`, Zerlegungsblock). Der Deckel fällt also schon bei EINEM Licht, unabhängig vom Worst-View.
- Rechnung dahinter: 12 Stufen auf einer radialen Spanne von 0,75·72 = 54 px ergeben eine Bandbreite von 4,5 px = **2,25 Blöcke**. Eine Scanline durch den Kegel kreuzt bis zu 24 Bandgrenzen, das sind bis zu 25 Läufe je 2-px-Zeile, bei 72 Zeilen Kegelhöhe.
- Derselbe Grund entwertet die Saum-Idee: ein ±1-Block-Saum um jede Grenze deckt bei 2,25 Blöcken Bandbreite fast das ganze Band ab. Gemessen: **8705 von 14400 Blöcken (60 %) sind Saum**, das ist faktisch Voll-Bayer (Voll-Bayer 6222 Läufe gegen Saum 5083, nur 18 % Unterschied). Die Spec-Annahme „Saum-Bayer ist Ziel ≤ 1200 Läufe" (§2.2) hält der Geometrie nicht stand.
- Der Zeit-Deckel und der Lauf-Deckel passen außerdem nicht zusammen: bei ~0,95 µs je fillRect erlaubt das 1,35x-Zeitbudget rund **2000 Läufe**. Der Lauf-Deckel 1200 ist also der schärfere von beiden.

### Entscheidungsmaterial für den Hauptloop (keine eigenmächtige Änderung, nur gemessen)

Zwei Hebel, beide spec-konform oder klar als Spec-Änderung markiert. `.tmp/gp6_p0a_perf_menu.py`, Baseline in diesem Lauf 2,224 ms / 2,900 ms P95, Limits 3,003 ms / 4,350 ms / 1200.

**Hebel A, reine Zeichen-Optimierung (KEINE Spec-Änderung nötig):** §2.3 schreibt nur „je Lauf ein destination-out-fillRect rgba(0,0,0,X) bei globalAlpha=1", weder eine Reihenfolge noch das Neubauen des Farbstrings je Lauf. Weil die Laufmenge eine DISJUNKTE Partition ist, ist die Zeichenreihenfolge frei: 13 vorberechnete rgba-Strings, Läufe nach Stufe k gebündelt, 13 fillStyle-Zuweisungen je Frame statt einer je Lauf.

| Variante | Mittel | Faktor | P95 | Faktor | Läufe | Verdikt |
|---|---|---|---|---|---|---|
| OPT-eimer Stufe 0 (Saum) | 5,04 ms | 2,27x | 6,90 | 2,38x | 5083 | ROT |
| OPT-eimer Stufe 1 (hart) | 3,46 ms | **1,55x** | 4,50 | **1,55x** | 3245 | ROT |

Ersparnis 24 bis 29 % gegenüber der naiven Schleife, reicht allein aber nicht.

**Hebel B, Lauf-Geometrie (das wäre eine Spec-Änderung an §2.2):**

| Lauf-Höhe | LIGHT_STEPS | Bayer | Mittel | Faktor | P95 | Faktor | Läufe | Verdikt |
|---|---|---|---|---|---|---|---|---|
| 2 px | 12 | Saum | 6,67 | 3,00x | 8,50 | 2,93x | 5083 | ROT (Spec-Stand) |
| 2 px | 12 | hart | 4,84 | 2,18x | 7,20 | 2,48x | 3245 | ROT (Stufe 1) |
| 2 px | 9 | hart | 3,46 | 1,56x | 4,40 | 1,52x | 2386 | ROT |
| 4 px | 12 | Saum | 4,37 | 1,96x | 5,40 | 1,86x | 2781 | ROT |
| 4 px | 12 | hart | 2,70 | 1,21x | 3,50 | 1,21x | 1605 | ROT (nur Lauf-Deckel) |
| 4 px | 12 | hart + OPT-eimer | 2,23 | **1,00x** | 2,90 | **1,00x** | 1605 | ROT (nur Lauf-Deckel) |
| 4 px | 9 | hart | 2,13 | 0,96x | 2,80 | 0,97x | **1194** | **GRÜN** |
| 8 px | 12 | Saum | 2,62 | 1,18x | 3,30 | 1,14x | 1521 | ROT (nur Lauf-Deckel) |
| 8 px | 12 | hart | 1,76 | 0,79x | 2,20 | 0,76x | **825** | **GRÜN** |

Die beiden grünen Zeilen kosten Bildqualität: 4-px- bzw. 8-px-Läufe quantisieren die Lichtkante senkrecht auf 4 bzw. 8 px, und 9 Stufen liegen zwar noch im M2-Fenster (9 bis 13 distinkte a-Werte, Gradient-Schnitt 9 Sprünge à 0,55/9 = 0,061 ≥ 0,04), aber ohne Reserve nach unten. Das ist eine Abwägung für den Hauptloop, keine Messfrage.

**Zusatzbefund, positiv:** ambient beeinflusst die Lauf-Anzahl NICHT (relative Quantisierung nach §2.1 arbeitet auf rest, nicht auf a). Die §3.2-Absenkung 0,78 auf 0,55 ist damit kostenneutral. §2.1 ist an dieser Stelle bestätigt.

## 4. E2-Vormessung (Auftrag 4)

**Freistehende Fackeln, selbst geprüft** (`.tmp/gp6_p0a_e2_suche.mjs`, Kriterium „kein zweiter Kegel in d < 2r = 144 px"):

| Karte | Fackeln | freistehend |
|---|---|---|
| GRAVEYARD | 3 | **3** (15,5), (9,14), (28,18) |
| CATACOMBS | 25 | **0** |
| FLUESTERGRUFT | 9 | **0** |
| BOSS_KAMMER | 6 | **0** |

**Gewählter Messaufbau (Fackel (28,18), welt (456,296)):** nächster zweiter Kegel 294,2 px. Spieler auf (606,318), die Kamera KLEMMT dadurch auf (320,204), Fackel im Bild bei (136,92). Damit gleichzeitig erfüllt: Spielerlicht 151,6 px entfernt (≥ 2r), Ring d ≤ 0,48r = 34,56 px vollständig im Bild, Ringrand 58,6 px von der Bildmitte (also komplett außerhalb der Vignetten-Zone d > 90 px), keine Überschneidung mit Panel/BossBar/ItemBox je +1 px. Zeit und Pulse eingefroren (`__timeScale = 0`): timeSec 2,4167, wob 0,1709, r_ist 73,23 px, pulse 0,7927, ambient 0,45, 4 Lichter im Frame. Messung auf dem 320x180-Backing-Store per `toDataURL` (keine Screenshot-Skalierung), Rec.601, 2x2-Block-MITTEL, gezählt werden distinkte (A−B)-Werte, A = mit Licht, B = `__noLight`. 936 Blöcke im Ring.

| Störquellen-Stufe | distinkt (Raster 1 L) | distinkt (Raster 0,01) | (A−B) Spanne | Kontrolle A gegen A |
|---|---|---|---|---|
| roh (Nebel+Vignette+Partikel an) | **35** | 294 | −9,10 bis +33,68 L | 1 |
| ohne Nebel | 35 | 285 | −9,10 bis +33,68 | 1 |
| ohne Nebel+Vignette | 35 | 285 | −9,10 bis +33,68 | 1 |
| ohne Nebel+Vignette+Partikel | 36 | 279 | −9,10 bis +33,68 | 1 |

Gegenprobe an der zweiten freistehenden Fackel (9,14), Spieler (16,280), Kamera (0,190), Fackel im Bild (152,42): 45 (Raster 1 L) bzw. 259 (Raster 0,01). Dieser Aufbau ist der schwächere: Spielerabstand nur 144,2 px (gerade eben über 2r) und der Ring überlappt das BossBar-Rechteck (auf GRAVEYARD wird dort nichts gezeichnet, verletzt aber die HUD-Maskendisziplin).

**IST und E2:**

| Raster | IST (Fackel 28,18) | E2 = max(24, round(0,6·IST)) |
|---|---|---|
| **1 L (Empfehlung)** | **35** | **E2 = max(24, 21) = 24** |
| 0,01 | 294 | E2 = 176 |

Empfehlung Raster 1 L: die Spec nennt „Raster 0,01" nur für die a-Werte (Wertebereich 0..1, dort sind 100 Stufen sinnvoll). Auf einer Luminanz 0..255 ist 0,01 feiner als die Quantisierung der Blockmittel selbst, die Zahl misst dann Rauschen statt Stufen (294 verschiedene Werte auf 936 Blöcke). Bei Raster 1 L ist E2 = 24 zudem robust gegen die gesamte Störquellen-Leiter (35, 35, 35, 36) und gegen die Fackelwahl greift der Boden 24 ohnehin. **Die Raster-Festlegung gehört in Rev 2.1**, sonst ist E2 nicht eindeutig.

## 5. Validierung der eigenen Messung (Auftrag 5)

| Kontrolle | Erwartung | Messwert | Ergebnis |
|---|---|---|---|
| Positiv, im Spiel: Lichtliste verdoppelt (doppelte Ringzahl) | messbar teurer | 3,743 / 3,585 / 3,678 ms gegen Baseline 2,067 ms = **1,78x** | bestanden |
| Positiv, Harness: PUNCH_RINGS doppelt gezeichnet | messbar teurer | 3,530 ms gegen 2,064 ms = **1,71x** | bestanden |
| Negativ, im Spiel: `__noLight` | ~0 ms | Mittel 0,000 / 0,000 / 0,001 ms, Max 0,1 ms (eine Timer-Stufe) | bestanden |
| Negativ, Harness: nur Ambient-Fill + drawImage | Bodenwert | 0,112 ms | bestanden |
| Treue Harness gegen echtes Spiel | ~1,00x | 0,999x Mittel, 0,963x P95 | bestanden |
| E2: A gegen A | 1 Wert | 1 (in allen 8 Messungen) | bestanden |

**Methodenfehler, den ich unterwegs gefunden und behoben habe:** der erste Wrapper trug bei `__noLight` eine harte 0 in die Messreihe ein statt zu messen, die Negativ-Kontrolle wäre eine Tautologie gewesen. Korrigiert (jetzt wird der übersprungene Aufruf gemessen), das ganze Skript wurde danach neu gefahren, die Baseline bestätigte sich.

## 6. Punkte für Rev 2.1

1. **§2.4 Worst-View:** „20 Fackeln + Spielerlicht" ist falsch, gemessen sind 19 Fackeln + Spielerlicht (Modus 20 Lichter, Spannweite 18 bis 20). Zusätzlich: die teuerste Kamera ist (112,80) mit 21 Lichtern, nicht (96,72).
2. **§2.2 Lauf-Deckel ≤ 1200 ist geometrisch unerreichbar**, eine einzelne voll sichtbare Fackel liefert schon 1206 (hart) bzw. 1770 (Saum) Läufe.
3. **§2.2 Bayer-Saum:** ±1 Block um jede Stufengrenze deckt bei 2,25 Blöcken Bandbreite 60 % des Fensters ab, das ist faktisch Voll-Bayer. Die Saum-Idee spart nur 18 % gegenüber Voll-Bayer.
4. **Zeit-Gate und Lauf-Gate sind nicht konsistent:** das 1,35x-Zeitbudget erlaubt rund 2000 Läufe, der Deckel 1200 ist schärfer.
5. **§2.3 sollte die Zeichenreihenfolge freigeben und die 13 rgba-Strings vorberechnen lassen** (erlaubt, weil die Partition disjunkt ist), das spart 24 bis 29 % ohne jede Qualitätseinbuße.
6. **§2.2 Rest-Profil fehlt** (Annahme A1 im Prototyp), ENGINE-A braucht die Festlegung.
7. **k=12-Läufe (X = 0)**: Unterdrückung sollte ausdrücklich erlaubt werden (5083 statt 5217 Läufe), sonst zeichnet der Umbau 134 No-Op-fillRects je Frame.
8. **§1 M2 / E2:** nur GRAVEYARD hat freistehende Fackeln, CATACOMBS hat keine einzige. Die E2-Zahl kann nicht auf der M2-Szene CATACOMBS (40,190) gemessen werden, die Spec muss Karte und Szene für E2 getrennt benennen.
9. **E2-Raster fehlt** (1 L gegen 0,01 unterscheidet E2 = 24 von E2 = 176).
10. **Gut bestätigt:** die relative Quantisierung §2.1 macht die Kosten ambient-unabhängig, die §3.2-Absenkung ist kostenneutral. 25 Fackeln auf CATACOMBS stimmt.

## 7. Skriptpfade

- `/home/coder/Grimlight/.tmp/gp6_p0a_karte.mjs` — Karten-Introspektion, Lichtzahl im Culling-Rect, Gegenprobe Worst-View
- `/home/coder/Grimlight/.tmp/gp6_p0a_lightruns.mjs` — Prototyp §2.1/§2.2 plus Node-Messung, Zerlegung, Sensitivitätsmenü, §2.7-Selbstprüfungen
- `/home/coder/Grimlight/.tmp/gp6_p0a_perf.py` — Teil A Bestands-Baseline im Spiel, Teil B Harness, Kontrollen. Ergebnis `/home/coder/Grimlight/.tmp/gp6_p0a_perf.json`
- `/home/coder/Grimlight/.tmp/gp6_p0a_perf_menu.py` — Kosten der Sensitivitäts- und Optimierungsvarianten. Ergebnis `/home/coder/Grimlight/.tmp/gp6_p0a_perf_menu.json`
- `/home/coder/Grimlight/.tmp/gp6_p0a_e2_suche.mjs` — Messaufbau-Suche E2 (6 Bedingungen gleichzeitig)
- `/home/coder/Grimlight/.tmp/gp6_p0a_e2.py` — E2-Vormessung. Ergebnis `/home/coder/Grimlight/.tmp/gp6_p0a_e2.json`, Belegbilder `.tmp/gp6_p0a_e2_GRAVEYARD_Fackel_28_18_A.png` und `_B.png` (dazu die Gegenprobe `_9_14_A/B.png`)

---

# P0b — Offset-Tabelle, E1, Generatoren

## GP6 P0b — Ergebnisbericht (BUILD, Phase 0)

**Kein Byte in `game/**` verändert** (`git status --porcelain` leer, HEAD 73de948). Kein Server gestartet — alle Messungen laufen offline auf vorhandenen PNGs und per Node-Import der Datenmodule. Port 8123 und 8124 unberührt.

---

## 1. OFFSET-TABELLE (bindend)

**Skript** `/home/coder/Grimlight/.tmp/gp6_p0b_offset.mjs` → `/home/coder/Grimlight/.tmp/gp6_offset_tabelle.json` + `.md`
**Messaufbau:** Hex aus `game/js/art/palette.js` per Regex gelesen (64 Schlüssel geprüft = 61 alnum + 3 Symbole, §0.11). L = 0,299R+0,587G+0,114B. Rec.601-Gewichte summieren zu exakt 1 → bei kanalgleicher Addition ist **ΔL = c exakt**. 8-Bit erzwingt ganzzahliges c.

| Ton | Rampe | Hex alt | **Hex NEU** | RGB neu | Offset | L alt | **L neu** | Spec-Ziel | Abw. |
|---|---|---|---|---|---|---|---|---|---|
| `e` | Gras | #19241d | **#28332c** | 40,51,44 | +15 | 31,9 | **46,9** | 47,0 | −0,1 |
| `E` | Gras | #253522 | **#344431** | 52,68,49 | +15 | 46,0 | **61,1** | 61,1 | −0,1 |
| `a` | Gras | #394d30 | **#485c3f** | 72,92,63 | +15 | 67,7 | **82,7** | 82,8 | −0,1 |
| `m` | Gras | #506341 | **#5f7250** | 95,114,80 | +15 | 89,4 | **104,4** | 104,5 | −0,1 |
| `K` | Gras | #586c38 | **#677b47** | 103,123,71 | +15 | 96,1 | **111,1** | 111,2 | −0,1 |
| `A` | Gras | #66804a | **#758f59** | 117,143,89 | +15 | 114,1 | **129,1** | 129,2 | −0,1 |
| `w` | Wasser | #162325 | **#263335** | 38,51,53 | +16 | 31,3 | **47,3** | 47,0 | +0,3 |
| `W` | Wasser | #203336 | **#36494c** | 54,73,76 | +22 | 45,7 | **67,7** | 67,3 | +0,4 |
| `9` | Wasser | #2a4347 | **#465f63** | 70,95,99 | +28 | 60,0 | **88,0** | 87,7 | +0,3 |
| `=` | Wasser | #345358 | **#56757a** | 86,117,122 | +34 | 74,3 | **108,3** | 108,0 | +0,3 |

**c_ideal = 15,087 → c = +15** (ein c für alle sechs Gras-Töne). Wasser: je Ton EIN ganzzahliger Kanal-Offset ⇒ Kanaldifferenzen und damit der Farbort exakt erhalten.

**Auflagen — alle 17 rechnerisch ERFÜLLT:**
- Ordnung: k 18,3 < w 47,3 ≈ e 46,9 (|Δ| = 0,43 L < 1 = kleinste 8-Bit-Stufe) < W 67,7 < 9 88,0 < `=` 108,3 < A 129,1 < D 156,8
- Wasser-Schritte exakt gleichmäßig: **20,32 / 20,32 / 20,32 L**
- Sättigung S=(max−min)/max: w 0,283 · W 0,289 · 9 0,293 · `=` 0,295 — alle < S(A) 0,378
- `w` bleibt kühler als `e`: w (38,51,53) B 53 > G 51; e (40,51,44) G 51 > B 44 ✓
- kein Kanal > 255 (max 143), 64 Schlüssel unverändert (§0.11)

---

## 2a. Folge-Analyse `water_mid_calm` `k` → `+`

Zonensprung gegen das neue `w` (47,3):
- Bestand vor Offset (`k` gegen altes `w`): **13,0 L**
- mit `k` NACH Offset: **29,0 L** (mehr als verdoppelt — bestätigt Review P3-M14)
- mit `+` (L 35,5): **11,8 L** — Soll ~11,5, Abweichung +0,3 L ✓

---

## 2b. BACK-KRONEN-RIM — Empfehlung mit Beleg

**Skripte** `/home/coder/Grimlight/.tmp/gp6_p0b_nutzer.mjs` und `/home/coder/Grimlight/.tmp/gp6_p0b_rim.mjs` → `/home/coder/Grimlight/.tmp/gp6_rim_analyse.json`
**Messaufbau:** Alle 179 `E`-Rim-Texel der drei `tree_canopy_back_*` an jeder Setzung in `GRAVEYARD_OVER_ROWS`; zu jedem Texel der EXAKTE Ground-Texel dahinter (Legende → `variants[0]` → Pixel (gx·16+x%16, ty·16+y)). Caveat: Fringe-/Bank-Overlays und die `variantIndex`-Streuung sind nicht simuliert.

**Befundlage (Zahlen, keine Meinung):**

| | rim vs `+` | rim vs `*` | unsichtbar (<3 L geg. Hintergrund) |
|---|---|---|---|
| `E` VOR Offset (GP5-R2-Entscheid) | **10,5** | 19,5 | 6,1 % |
| `E` NACH Offset (ohne Maßnahme) | **25,5** | 34,5 | 0,6 % |
| `a` (GP5-R2 als "zu hell" verworfen) | 47,2 | 56,1 | 17,9 % |
| `e` NACH Offset | **11,4** | 20,3 | **59,8 %** |
| `t` (kalt/blau, 45,7) | 10,2 | 19,1 | 60,3 % |

Der einzige Bestandsschlüssel mit grünem Farbort bei ~45 L ist **`e` (46,9; +11,4 über `+`)** — er reproduziert die GP5-R2-abgenommene Beziehung (10,5) auf 0,9 L genau. `t`/`c` sind kaltblau (= genau der GP4-R2-Stahlband-Defekt), `q`/`z` warmbraun.

**Aber:** 52 % der Rim-Texel liegen über Gras-`e`, 68,2 % über gras-dominanten Kacheln. Ein reiner Tontausch `E`→`e` macht **59,8 % des Rims unsichtbar** (Referenz: 6,1 %).

**EMPFEHLUNG — Variante C: Tontausch PLUS Ein-Zeilen-Grid-Umbau.**
1. Die `E`-Zeile (back_a Zeile 9 / back_b 8 / back_c 10) wird zu `*` — Silhouettenhöhe bleibt, die Oberkante wird dunkle Kontur.
2. Der Rim-Ton `e` wandert an denselben Spalten EINE Zeile nach innen (heute `*`/`+`).

Ergebnis rechnerisch: Rim **+11,4 L über `+`**, **+20,3 L über `*`**, **0 % unsichtbar** (jeder Rim-Texel liegt per Konstruktion auf Kronenkörper). §0.11-konform (kein neuer Schlüssel), Aufwand 3 Grids.

**Warum das trägt (Kernbeleg):** Der Offset dreht das Figur-Grund-Verhältnis um. Kronenkörper `+` gegen Gras `e` war **+3,6 L** (Körper praktisch unsichtbar, der Rim musste die Trennung allein leisten) und ist nach dem Offset **−11,4 L**, `*` sogar **−20,3 L**. Gegen den gemessenen mittleren Rim-Hintergrund: `+` von −13,0 auf **−23,1 L**, `*` von −22,0 auf **−32,0 L**. Die Silhouetten-Trennung erledigt ab GP6 der Offset; der Rim darf auf "Volumenhinweis" zurückgestuft werden — genau das verlangt die ~10-L-Vorgabe.

---

## 2c. Nutzer-Listen je verschobenem Ton (§3.1-Deklaration)

**Quelle** `/home/coder/Grimlight/.tmp/gp6_nutzer_tabelle.json` (Zensus über alle `TILE_ART`+`SPRITES`-Grids, Kartenzuordnung über die vier Legenden + Namenspräfixe für Fringe/Shore/Bank/Depth/Pool)

| Ton | Grids gesamt | davon INNEN | Innen-Grids namentlich |
|---|---|---|---|
| `e` | 98 | 0 | — |
| `E` | 104 | 0 | — |
| `a` | 108 | 3 | `brick_wall_v2` (13tx), `brick_moss_tl` (7), `brick_moss_br` (5) |
| `m` | 77 | **22** | `brick_moss_tl` 13, `brick_wall_v2` 11, `brick_moss_br` 11, `brick_wall` 4, `brick_wall_v5` 4, `brick_wall_v6` 4, `brick_wall_v1` 3, `brick_wall_v4` 3, `brick_wall_v3` 2, je 1 Texel: `stone_floor`, `stone_floor_v1/_v2/_v3`, `stone_floor_cracked`, `stone_floor_cracked_v2`, `pillar`, `sarcophagus`, `sarcophagus_v1/_v2`, `torch_wall_0`, `floor_decal_crack`, `floor_decal_bones` |
| `K` | 75 | 3 | `brick_wall_v2` (4), `brick_moss_tl` (2), `brick_moss_br` (2) |
| `A` | 61 | 0 | — |
| `w` / `W` / `9` / `=` | 31 / 35 / 36 / 27 | je 1 | **`water_v` (FLUESTERGRUFT)** — 158 / 49 / 33 / 16 Texel |

**Flächenanteil verschobener Töne je Karte** (Legendenzeichen-Häufigkeit × Grid-Zensus):
CATACOMBS **1,1 %** (nur `m`) · BOSS_KAMMER **0,7 %** (nur `m`) · **FLUESTERGRUFT 7,1 %** (`w` 3,7 / `W` 1,2 / `m` 1,0 / `9` 0,8 / `=` 0,4) · GRAVEYARD 72,2 %.

⚠️ **Spec-Korrektur für Rev 2.1:** §3.1 sagt "Moos-Anteile < 3 % Fläche" — das stimmt für CATACOMBS (1,1 %) und BOSS_KAMMER (0,7 %), **nicht für FLUESTERGRUFT (7,1 %)**, weil der Kanal die volle Wasser-Rampe trägt (`w` +16 … `=` +34). Das ist auch die Ursache der Median-Abweichung unten.

---

## 3. E1-VORMESSUNG

**Skript** `/home/coder/Grimlight/.tmp/gp6_p0b_e1_sim.py` → `/home/coder/Grimlight/.tmp/gp6_e1_vormessung.json`, Simulationsbilder `.tmp/screenshots/gp6_sim_*.png` (+ `_4x`)

**Messaufbau / Rechenweg** (pro Szene, 320×180-Backing-Store, HUD-Maske Panel/BossBar/ItemBox je +1 px → n = 53 888, Rec.601):
1. `av_alt(x,y)` aus `hud.js:466-511` deterministisch nachgebaut (Radius-Profil + Bayer-4×4) und aus `gp6_ist_<tag>.png` herausgerechnet.
2. `a_alt` je Pixel per Kleinste-Quadrate über 3 Kanäle gegen `gp6_ist_<tag>_palette_pur.png` als Basis; `rest = a_alt/ambient_alt`. Grundlage: `destination-out` entfernt Deckung multiplikativ, also ist `a` zu `ambient` proportional.
3. Basis → nächster Palettenton → Offset-Tabelle.
4. `a_neu = ambient_neu · quantizeLight(rest)`, `quantizeLight(r) = round(r·12)/12` (§2.1).
5. Neue Vignette: `VIG_STEP` 0,06 und Profil ×2/3 — die Stufenkarte ist identisch, jede Stufe trägt 2/3 Deckung, a_max 0,30.
6. 8-Bit-Rundung, HUD-Maske, Kennzahlen.

**Modell-Validierung:** dieselbe Kette mit ALTER Palette + ALTEM ambient reproduziert das IST-Bild mit mittlerem Fehler **0,368 / 0,634 / 1,028 / 1,038 / 1,703 L**. Ton-Klassifikation exakt 92,4–95,3 %. Kontrolle `palette_pur` gegen entvignettiertes `amb000` (anderer Lauf): 99,3–99,9 % der Pixel ≤ 2 Kanalstufen Abweichung. Zusatz-Validierung: das Modell liefert für `A` außen genau den Spec-Wert (129,1 → **103,2** Render, §3.4 nennt 103).

| Szene | IST Median | **SIM Median** | IST Highlight | **SIM Highlight** |
|---|---|---|---|---|
| graveyard_teich (L>96) | 24,88 | 39,97 | 0,343 % | **1,679 %** |
| graveyard_wald (L>96) | 22,70 | 39,08 | 0,262 % | **1,678 %** |
| catacombs (L>128) | 38,90 | 41,72 | 1,555 % | **1,618 %** |
| fluestergruft (L>128) | 27,84 | 38,02 | 0,737 % | **0,811 %** |
| boss_kammer (L>128) | 37,68 | 40,20 | 1,058 % | **1,115 %** |

### E1 = max(1,25 × IST, 0,6 × Sim), je Karte, 2 Nachkommastellen
GRAVEYARD wird auf die **ungünstigere** der zwei Szenen geeicht (sonst wäre eine der beiden per Konstruktion rot).

| | Karte | Schwelle | IST | 1,25×IST | Sim | 0,6×Sim | **E1** |
|---|---|---|---|---|---|---|---|
| **E1a** | GRAVEYARD | L>96 | 0,262 | 0,328 | 1,678 | **1,007** | **1,01** |
| **E1b** | CATACOMBS | L>128 | 1,555 | **1,944** | 1,618 | 0,971 | **1,94** |
| **E1c** | FLUESTERGRUFT | L>128 | 0,737 | **0,921** | 0,811 | 0,487 | **0,92** |
| **E1d** | BOSS_KAMMER | L>128 | 1,058 | **1,323** | 1,115 | 0,669 | **1,32** |

### Median-Gegenprobe §3.2 (derselbe Simulator)

| Karte | SIM-Median | Prognose | Abw. | M1-Band |
|---|---|---|---|---|
| GRAVEYARD | 39,52 (39,97/39,08) | 39,2 | +0,32 ✓ | 38..46 |
| CATACOMBS | 41,72 | 41,2 | +0,52 ✓ | 40..50 |
| FLUESTERGRUFT | **38,02** | 34,6 | **+3,42 ✗** | 33..44 |
| BOSS_KAMMER | 40,20 | 39,8 | +0,40 ✓ | 38..48 |

FLUESTERGRUFT liegt über der Prognose, weil der Kanal 7,1 % Fläche in der voll angehobenen Wasser-Rampe trägt (s. 2c). Das M1-Band 33..44 ist trotzdem eingehalten, und die §3.3-Reserve für ambientTint ist **größer** als in der Spec angenommen (5,0 L nach unten / 6,0 L nach oben statt "klein").

### Drei Warnungen für Rev 2.1 (Zahlen, keine Empfehlung)

1. **Innen erreicht der reine Offset E1 nicht.** E1b/c/d werden von `1,25 × IST` bestimmt, der Offset-Simulator liefert nur 1,618 / 0,811 / 1,115 % gegen 1,94 / 0,92 / 1,32. Lücke **0,33 / 0,11 / 0,21 Prozentpunkte**, die aus §2.1-Kegelkernen, §2.6-HOT_RINGS am Docht und §4.2-Tint-Masken kommen muss.
2. **Goodhart-Gegen-Gate (§1, "kein Einzelton > 60 %") reißt innen** — Highlight-Töne der Simulation: catacombs `D` **69,2 %**, boss_kammer `D` **67,1 %**, fluestergruft `D` **62,5 %**. Draußen unkritisch (teich `A` 35,0 %, wald `A` 51,2 %); Ton-Klassenzahl 12–20 ≥ 3 ist überall erfüllt.
3. **Die M1-Spalte "Anteil L<16" reißt innen.** SIM: catacombs **9,56 %** (Grenze 6,0), fluestergruft **8,27 %** (Grenze 8,0), boss_kammer **4,64 %** (Grenze 4,0). Draußen grün (0,17 / 1,11 gegen 3,0). Ursache: `t` (45,7) und `k` (18,3) bleiben unverschoben; `k` rendert bei ambient 0,55 auf L 12,7.

---

## 4. GENERATOR-ENTWÜRFE (nur `.tmp`, NICHT verdrahtet)

### 4a. `/home/coder/Grimlight/.tmp/gen_crowns_gp6.mjs` → `gen_crowns_gp6_out.json`, `gen_crowns_gp6_grids.js`

33 Grids, **alle 98 Selbstprüfungen grün**. Deterministisch über eine Kopie von `variantIndex` (tilemap.js:34), kein `Math.random`/`Date.now`.

| Key | Maß | Tinten-Bbox | Soll | Deckung | Töne |
|---|---|---|---|---|---|
| `tree_canopy_xl_a` (+`_m`) | 48×32 | **47×29** | 40×28 ✓ | 64,0 % | a312 m214 E181 K105 0:71 n56 A44 |
| `tree_canopy_xl_b` (+`_m`) | 64×48 | **60×42** | 56×40 ✓ | 62,9 % | a578 E435 m405 K190 0:133 n111 A79 |
| `tree_canopy_xl_c` (+`_m`) | 48×32 | **45×29** | 40×28 ✓ | 67,1 % | a289 E216 m214 K114 0:72 n72 A54 |
| `canopy_shadow_xl_a` | **48×32** | — | sw·16×32 ✓ | 13,7 % | 0:103 n108 |
| `canopy_shadow_xl_b` | **64×32** | — | sw·16×32 ✓ | 13,8 % | 0:144 n139 |
| `canopy_shadow_xl_c` | **48×32** | — | sw·16×32 ✓ | 14,6 % | 0:107 n114 |

M4-Art-Gate vorab: 6 Keys ≥ 40×28 (gefordert ≥3), 2 Keys ≥ 56×40 (gefordert ≥1). Nur Bestandstöne `0/E/a/m/K/A` + `n`-Nähte, **kein `k`**. Ton-Verteilung an `tree_canopy_2x2_a` angelehnt (Gamma-1,75-Dunkelbias) — die Aufhellung kommt aus dem Offset, nicht aus mehr hellen Texeln. 5 Scher-Posen je Key (Basis/`_r1`/`_r2`/`_l1`/`_l2`, dx = round(amp·(1−y/(h−1)))), **Unterkante byte-identisch zur Basis** geprüft, `poses[0]` ist der Basis-Key selbst. `swayPoses`-Belegung im JSON.

Sichtprüfung `/home/coder/Grimlight/.tmp/screenshots/gp6_p0b_xl_kronen_4x.png`. **Entwurfsschwächen für ART/Phase 1:** das Spitzlicht oben links liest die Lichtrichtung noch schwach; die Silhouettenkante ist verrauscht statt fest; es fehlt der `0`-Konturensaum, den die Bestandskronen haben.

### 4b. `/home/coder/Grimlight/.tmp/gen_over_gp6.mjs` → `gen_over_gp6_out.json`, `gen_over_gp6_rows.txt`

**Alle 15 Selbstprüfungen grün.** Rasterung 1:1 nach `tilemap.js:905-965` inklusive `anchorOffset` (ANCHOR_CLAMP W=4 für die 6 XL-Keys), `timeSec = 0`.

- Freie Legendenzeichen automatisch bestimmt: `1`=xl_a, `2`=xl_a_m, `3`=xl_b, `4`=xl_b_m, `5`=xl_c, `6`=xl_c_m (kollisionsfrei gegen Legende, Ground-rows und Over-rows).
- Nord-Dach Zeilen 6/8/10, **Spalten-Pitch 2** (16 px Überlappung — bei Pitch 3 rissen die ±4-px-Anker-Jitter Löcher, in der ersten Fassung nachgewiesen). `xl_b` bei **(30,8)** deckt Tiles 30..33 / Zeilen 8..10 → **Beweiszelle (31,9)** mittig darunter. Süd-West-Dach Zeilen 20/21/22, `xl_b_m` bei (10,21) → Zentrum (12,22).
- Anker alt → neu: 2×2 22→21, Back 18→**7**, `B` 10→**0**, `C` 6→6, plus 30 XL-Anker; Gesamt 56→64 Anker bei 10 Tile-Zeilen geschlossenem Dach.

**M4-Kennzahlen:**
- **Bestes 48×32-Fenster: (170,325), Deckung 100,0 %** — und es erfüllt das Gegen-Gate: **4 XL-Keys**, größter Anteil `xl_b_m` **54,7 %** (< 60 %). Bestes Fenster ohne und mit Gate sind identisch.
- **Beweiszelle (31,9):** Sprite-Ort nach `player.js:236-240` (x = tx·16, y = ty·16−9 bei mittigem Stand, Hitbox 12×14, Sprite 16×24). `KRONEN_HEAD_ROWS_GP6 = 16`. **silhouette_kopf 191, verdeckt_kopf 191, Quotient 1,000** (gefordert ≥100 und ≥0,75). Deckende Krone: `tree_canopy_xl_b` ✓.
- Kontrollen: kronenfreie Kachel (3,2) → verdeckt 0 bei silhouette 191; silhouette_kopf > 0.

**Guards bewiesen:** Spalte 21 in allen Zeilen 0..12 leer; Zeile 12 in allen Spalten 0..21 leer; keine span-Zeichen in `GRAVEYARD_ROWS`; **Stammdeckung span-generisch 44/44** (die Prüfung zählt `B` plus JEDE Span-Fläche, nicht die harte `'MNOQVX'`-Liste aus `smoke:658-666`); keine Fackelzeichen im Over-Layer; Maß 24×40 unverändert. sol/geo bleiben unberührt, weil `solHash` nur Ground-rows durch `legend[ch].solid` schickt und `geoHash` nur Spawns/Portale/`findTiles('F')` hasht.

Sichtprüfung: `/home/coder/Grimlight/.tmp/screenshots/gp6_p0b_over_neu.png`, `gp6_p0b_over_norddach_4x.png`, `gp6_p0b_over_swdach_4x.png`.

⚠️ **Spec-Hinweis M4:** Der 100-%-Treffer ist ein Ergebnis DIESES Layouts. Sobald ein einzelner XL-Key ein 48×32-Fenster allein füllen kann (`xl_b` ist 64×48), wäre "bestes Fenster" und "kein Key > 60 %" gegeneinander unerfüllbar — in der ersten Layout-Fassung war das bestes-Fenster 99,6 % bei 81,9 % Einzelkey. Rev 2.1 sollte "bestes Fenster, **das das Gegen-Gate erfüllt**" formulieren; das Skript misst beides getrennt.

---

## 5. Skriptpfade

| Zweck | Skript | Ausgabe |
|---|---|---|
| Offset-Rechner + Auflagenbeweis | `/home/coder/Grimlight/.tmp/gp6_p0b_offset.mjs` | `/home/coder/Grimlight/.tmp/gp6_offset_tabelle.json`, `.md` |
| Nutzer-Listen + Innen-Flächenanteil | `/home/coder/Grimlight/.tmp/gp6_p0b_nutzer.mjs` | `/home/coder/Grimlight/.tmp/gp6_nutzer_tabelle.json` |
| Rim-Analyse (Texel-exakt) | `/home/coder/Grimlight/.tmp/gp6_p0b_rim.mjs` | `/home/coder/Grimlight/.tmp/gp6_rim_analyse.json` |
| E1-Vormessung + Simulator | `/home/coder/Grimlight/.tmp/gp6_p0b_e1_sim.py` | `/home/coder/Grimlight/.tmp/gp6_e1_vormessung.json`, `.tmp/screenshots/gp6_sim_*.png` |
| XL-Kronen-Generator | `/home/coder/Grimlight/.tmp/gen_crowns_gp6.mjs` | `/home/coder/Grimlight/.tmp/gen_crowns_gp6_out.json`, `gen_crowns_gp6_grids.js` |
| OVER_ROWS-Generator + M4 | `/home/coder/Grimlight/.tmp/gen_over_gp6.mjs` | `/home/coder/Grimlight/.tmp/gen_over_gp6_out.json`, `gen_over_gp6_rows.txt` |
| Vorschau-Rasterung | `/home/coder/Grimlight/.tmp/gp6_p0b_preview.py` | `.tmp/screenshots/gp6_p0b_*_4x.png` |

**Für Rev 2.1 einzutragen:** E1a **1,01** · E1b **1,94** · E1c **0,92** · E1d **1,32** — plus die drei Warnungen aus §3 und die M4-Formulierungskorrektur aus §4b.