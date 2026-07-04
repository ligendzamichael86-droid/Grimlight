# Agent-Anweisungen — Grimlight (Arbeitstitel)

Du arbeitest im **WAT-Framework** (Workflows, Agents, Tools). Diese Architektur trennt
Verantwortlichkeiten: probabilistische KI übernimmt das Denken und Orchestrieren,
deterministischer Code die Ausführung. Diese Trennung macht das System verlässlich.

## Projektziel

Ein 2D-Action-Adventure für **Android- und iOS-Handys** im **SNES-Pixel-Look**.
Spielgefühl-Formel: **Zelda liefert die Spieldynamik** (Top-Down-Movement,
Schwertkampf, Herzen, Räume, Items), **Diablo liefert Welt und Atmosphäre**
(düsteres Dorf, Katakomben, Loot-Drops, Gold, grimmige Farbwelt).

Der Auftraggeber ist Programmier-Neuling. Alles muss **früh sichtbar und spielbar**
sein. Deshalb wird nicht in Schichten gearbeitet (erst Engine, dann irgendwann
Gameplay), sondern in **vertikalen Slices**: Jeder Slice endet mit etwas, das man
im Browser sofort spielen kann.

## Technische Grundentscheidungen (nicht ohne Absprache ändern)

1. **HTML5 / Canvas 2D, Vanilla-JavaScript (ES-Module), KEIN Build-Toolchain.**
   In dieser Umgebung gibt es Node 20, aber kein npm. Das Spiel läuft als statische
   Website direkt im Browser. Für die Handy-Apps wird das Web-Spiel in einem
   späteren Slice per Capacitor verpackt (npm dann via corepack beschaffen).
2. **SNES-Look:** interne Auflösung **320×180**, ganzzahlig hochskaliert,
   `image-rendering: pixelated`, 16×16-Pixel-Tiles.
   **Qualitäts-Messlatte (Vorgabe des Auftraggebers): Secret of Mana.**
   Das heißt konkret: weiche Farbrampen statt 3-Ton-Flächen, Übergangs-Tiles
   zwischen Bodenarten (keine harten Kanten), Layering (Baumkronen/Überhänge
   über dem Spieler), Charaktersprites bis 16×24 mit reichen Animationen.
   Grafik wird iterativ entwickelt: zeichnen → Screenshot rendern → gegen die
   Messlatte vergleichen → nachbessern. Jeder Slice enthält Grafikarbeit;
   zusätzlich gibt es dedizierte Grafik-Qualitätspässe.
3. **Grafik als Code:** Sprites und Tiles werden als Text-Pixel-Grids in
   `game/js/art/` gepflegt (jedes Zeichen = Palettenfarbe, `.` = transparent) und
   zur Laufzeit in Canvas-Sprites umgewandelt. Keine Binär-Assets im Repo nötig,
   jeder Agent kann Grafik als Text lesen und ändern.
4. **Node-Importierbarkeit:** Jedes JS-Modul außer `game/js/main.js` muss sich in
   Node ohne Browser importieren lassen (kein `window`/`document` auf Modulebene).
   Nur so funktionieren die Headless-Smoke-Tests in `tools/`.
5. **Feste Zeitschritte:** Logik-Update mit 60 Hz (Akkumulator), Rendering per
   `requestAnimationFrame`.

## Die WAT-Architektur

**Ebene 1: Workflows (die Anleitungen)**
- Markdown-SOPs in `workflows/` — pro Slice ein Workflow mit Ziel, Umfang,
  beteiligten Tools, Testkriterien und Abnahme.

**Ebene 2: Agents (die Entscheider)**
- Deine Rolle. Lies den Slice-Workflow und die Spezifikation in `design/`,
  koordiniere Subagenten mit **exklusivem Datei-Besitz** (kein paralleles
  Schreiben an derselben Datei), behandle Fehler, stelle Rückfragen nur wenn
  wirklich nötig.

**Ebene 3: Tools (die Ausführung)**
- Skripte in `tools/`: Dev-Server, Syntax-Checks, Headless-Smoke-Tests,
  Screenshot-Werkzeuge. Deterministisch, testbar, schnell.

## Arbeitsweise

1. **Erst vorhandene Tools suchen**, dann neue bauen.
2. **Slices, keine Schichten.** Ein Slice ist erst fertig, wenn er im Browser
   läuft, die Smoke-Tests grün sind und eine Übergabe geschrieben wurde.
3. **Übergaben:** Nach jedem Slice/Arbeitsblock eine Datei in `uebergaben/`
   (Datum + Slice, was fertig ist, was offen ist, wie man testet).
4. **Selbstverbesserungs-Loop:** Was kaputtging → Tool fixen → Fix verifizieren →
   Workflow aktualisieren → weiter.
5. Workflows nicht ungefragt überschreiben; Erkenntnisse ergänzen ja.
6. Gedankenstriche (--) in Ausgaben und Mails nicht verwenden.

## Slice-Fahrplan

| Slice | Inhalt | Testbar als |
|---|---|---|
| 0 | Spielbarer Kern: Map, Movement, Schwert, Skelette, Herzen, Gold, Touch+Tastatur | Browser-Spiel |
| 1 | Diablo-Atmosphäre: Dungeon-Ebene, Licht/Fackeln, zerschlagbare Vasen, Tränke | Browser-Spiel |
| 2 | Loot & Inventar: Item-Drops mit Affixen, Ausrüstung, Zelda-Zweitwaffe | Browser-Spiel |
| 3 | Progression: XP/Level, Boss, mehrere Räume/Übergänge | Browser-Spiel |
| 4 | Mobile: Capacitor-Wrap, Android-APK/iOS, Save-System, Performance | APK / TestFlight |
| 5 | Sound (WebAudio-Chiptune), Musik, Polish, Game-Feel | Browser + App |

## Dateistruktur

```
game/               # Das Spiel (statische Website = späterer App-Inhalt)
  index.html
  css/
  js/main.js        # Einziges Modul, das Browser-Globals beim Import anfassen darf
  js/core/          # Loop, Renderer, Input (Tastatur+Touch), Kamera, Sprite-Factory
  js/world/         # Tilemap-System, Map-Daten
  js/entities/      # Spieler, Gegner, Basis-Kollision
  js/ui/            # HUD (Herzen, Gold, Touch-Overlay)
  js/art/           # Palette + Pixel-Grids (reine Daten-Module)
design/             # GDD, Art-Direction, technische Slice-Spezifikationen
workflows/          # Markdown-SOPs pro Slice
tools/              # Dev-Server, Checks, Smoke-Tests, Screenshots
uebergaben/         # Übergabedokumente pro Slice/Arbeitsblock
.tmp/               # Wegwerf-Dateien (Screenshots, Zwischenstände). Disposable.
```

**Kernprinzip:** Lokale Dateien sind Arbeitsmaterial. Das Deliverable ist das
lauffähige Spiel in `game/` (später die App-Pakete). Alles in `.tmp/` ist wegwerfbar.

## Testen (für den Auftraggeber)

```
python3 tools/serve.py        # startet Dev-Server auf Port 8123
```
Dann im Browser (Port-Weiterleitung von code-server nutzen): `http://localhost:8123`

## Unterm Strich

Du sitzt zwischen dem, was gewollt ist (Workflows/Specs) und dem, was passiert
(Tools/Code). Lies die Spezifikation, triff kluge Entscheidungen, halte die
Interfaces ein, erhole dich von Fehlern und mach das System mit jedem Slice besser.

Pragmatisch bleiben. Verlässlich bleiben. Weiterlernen.
