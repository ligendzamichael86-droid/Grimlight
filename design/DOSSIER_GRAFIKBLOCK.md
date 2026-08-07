# Eskalations-Dossier Grafik-Block (07.08.2026, für Michael)

## Lage in einem Absatz

Der Grafik-Block (GP3→GP4→GP5, 9 Jury-Runden, ~30 Build-Agenten)
endet bei Median 7,0 statt der Ziel-8. Das Spiel ist dabei nachweislich
in jeder Runde besser geworden — aber die Jury-Messlatte hat sich
parallel verschärft (6x-Crops + Pixel-Messungen ab GP5; dieselben
Juroren taxieren GP4-final rückwirkend auf 6,0-6,5 statt 7,5). Unter
KONSISTENTER Linse steht der Block bei ~+2,5 gegenüber GP2 und ~+1
allein in GP5. Was zur 8 fehlt, ist präzise bekannt, konvergent von
allen Juroren benannt — und liegt fast vollständig außerhalb dessen,
was ein reiner Kachel-/Licht-Pass mit eingefrorenen Tests erreichen
kann.

## Die fünf verbleibenden Hebel (alle MACHBAR, geprüft)

| # | Hebel | Warum er die Note deckelt | Machbarkeit | Aufwand |
|---|---|---|---|---|
| 1 | **Licht-Quantisierung** (Lichtfaktor auf 10-12 Stufen + Bayer VOR der Multiplikation) | H: "blockiert jede Note über ~7,5"; das weiche Licht zieht dem Pixel-Look Qualität AB (bewiesen: die Ohne-Licht-Hilfsbilder lesen schärfer) | Renderer-Feature; unser Pure-Function+Test-Muster trägt das (litDitherCells als Präzedenz) | mittel |
| 2 | **Belichtungs-Sockel außen** (Median L 22→~40) | "Auf dem Handy bei Tageslicht unsichtbarer Matsch" | Ambient-Werte sind test-gebunden → braucht EINE neue sanktionierte Test-Runde (GP3-Muster, 7-13 Zeilen — erprobt) | klein |
| 3 | **Sprite-Beleuchtung + Kontaktschatten als Engine-Feature** (Lichtwert am Fußpixel aufs Sprite; automatischer Schatten-Quad pro Entity) | K: "größter verbleibender Einzelhebel" — Figuren bleiben neben Fackeln farblich tot; Schatten-Abdeckung lückenhaft (Vasen ja, Spieler/Boss nein) | Renderer, klar umrissen | mittel |
| 4 | **Kronen-Maßstab** (40×28-64×48-Kronen, Layering-Beweis, Boden-Schattenwurf) | "Busch statt Blätterdach", Layering-Versprechen im Bild nicht eingelöst | Span-Mechanik trägt beliebige Größen; Testkatalog-Erweiterung nötig | mittel |
| 5 | **Karten-Autorenschaft + Feinliste** (Orte, Prop-Gruppen, Perspektiv-Vereinheitlichung 60°, Spieler-Sprite-Neuzeichnung, Idle/Hit) | "Drei Kameras auf einem Bild"; Teich-Anbindung "behauptet statt eingelöst"; Figuren statisch | Generator-Pipeline vorhanden; Spieler-Sprite = eigener Zeichenblock; Idle/Hit braucht entities/-Öffnung (Slice-Muster) | mittel-groß |

Dazu die kleine R3-Restliste (Übergabe §Restliste) — u. a. der
Ein-Zeilen-Fix für den Kanal-Uferring, den Juror H exakt lokalisiert
hat.

## Deine drei Optionen

**A. GP6 "Licht & Maßstab"** — Hebel 1+2+3+4 plus R3-Restliste, mit
sanktionierter Test-Runde und NEUEM Abnahme-Kriterium: die konkreten
Messziele der Juroren (Belichtungs-Perzentile, Autokorrelation,
Anisotropie, Kronen-Überlappung, Sprite-Licht) statt offener
10er-Skala — "fertig" ist dann definiert und kann nicht mehr wandern.
Realistisches Ergebnis: 7,5-8+ auch unter der strengen Linse.
Geschätzt: 1 Pass à 2-3 Runden.

**B. Erst Slice 4 (Handy-Build), Grafik danach** — Capacitor-Wrap,
APK aufs echte Gerät. Argument: Die Belichtungsfrage und die
1x-Lesbarkeit beurteilen sich auf einem realen Display anders als in
Crops; danach GP6 mit Geräte-Erkenntnissen. Risiko: die bekannten
Grafik-Hebel kühlen ab.

**C. Ziel-Eichung** — Feststellen: Unter der Messlatte, mit der das
8er-Ziel gesetzt wurde, ist der Block über der 8 (GP4-final maß dort
7,5; GP5 liegt konsistent darüber). Den Block als erfüllt abnehmen,
die fünf Hebel als priorisiertes Backlog in die Slices mitnehmen.

Meine Empfehlung: **A, danach B** — die fünf Hebel sind reif, präzise
spezifizierbar und messbar abnehmbar; das Dossier-Backlog verfällt
sonst. B zuerst ist aber ebenso vertretbar, wenn dir das Spiel auf dem
Handy wichtiger ist als die Zahl. C steht dir ehrlich offen.

## Referenzen

Übergaben: 2026-07-12_grafikpass3, 2026-07-14_grafikpass4,
2026-08-07_grafikpass5. Jury-Dokumente: design/GP*_RUNDE*_JURY.md.
Juror-Rezepte im Wortlaut: R3-Task-Ausgaben (Session-Archiv).
