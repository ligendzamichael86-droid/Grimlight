# Workflow: Slice 1.5 — Grafik-Qualitätspass (Messlatte: Secret of Mana)

## Ziel

Sichtbarer Qualitätssprung der Grafik ohne Gameplay-Änderungen: Held 16×24 mit
SoM-Proportionen, 4-5-Ton-Farbrampen, Gras-Fransen über Weg-/Wasserkanten
(Fringe-System), Baumkronen-Layer über dem Spieler, Y-sortierte Entities.
Vorgabe des Auftraggebers vom 02.07.2026, verankert im CLAUDE.md.

## Inputs

- `design/SPEC_SLICE_1_5.md` (bindend)
- Übergaben Slice 0 + 1 (Festlegungen bleiben gültig)

## Ablauf

1. **Review:** Adversarialer Spec-Review gegen den echten Code
2. **Build (parallel + Integration):**
   - Meister-Pixel-Artist: Palette-Rampen, Held-Neufassung 16×24, Ghul 16×20,
     Tile-Politur, Fringe-/Kronen-Sprites (nur `art/`)
   - Engine-Builder: tilemap (overRows, layer, Fringe-Nachbarlogik), maps
     (Kronen, Fringe-Flags, Begehbarkeit UNVERÄNDERT), größenagnostische
     draw-Offsets, Y-Sort in main.js, Smoke-Test-Anpassung
   - Integrations-Agent führt zusammen und macht alle Tests grün
3. **Iterative Qualitätsschleife (Kern, max. 3 Runden):**
   Screenshot-Agent (eigener Server auf 8124, nie 8123!) → strenger Juror
   bewertet PNGs gegen 5 Kriterien (Note 1-10 + pixelgenaue Anweisungen) →
   Art-Agent bessert nach. Abbruch bei Note ≥ 8.
4. **Abnahme:** Syntax, Smoke (3×), Flusstests, Konsolen-Check; max. 2 Fix-Zyklen

## Besonderheiten

- Port 8123 gehört dem Auftraggeber (läuft in dessen Terminal) — Agenten nutzen
  ausschließlich Port 8124 mit eigenem Serverprozess
- Juror vergleicht immer gegen die Slice-1-Screenshots (s1_*) als Baseline

## Abnahme

Siehe `design/SPEC_SLICE_1_5.md` Abschnitt 4. Übergabe in `uebergaben/`.

## Erkenntnisse / Änderungen

Lauf abgeschlossen 2026-07-03, Übergabe: `uebergaben/2026-07-03_slice1_5_grafikpass.md`.

1. **Sessionabbruch mitten im Build:** Die erste Session starb nach
   tilemap.js/Sprites, VOR maps.js/main.js. Lehre: Bei Wiederaufnahme
   zuerst Screenshots rendern und gegen die Spec prüfen, der grüne
   Smoke-Test allein beweist keine vollständige Integration (er prüfte
   die Maschinerie, nicht deren Verwendung in den Maps).
2. **Draw-Hardcoding als Folgefehler:** Held 16x24 und Ghul 16x20 wurden
   mit festen 16-px-Offsets gezeichnet (8 bzw. 4 px zu tief). Die
   Flusstests kodierten die falschen Zeichenpositionen als Erwartung.
   Fix: Tests ankern jetzt auf Fußkante/Zentrum (sprite-größen-agnostisch,
   bindende Festlegung in der Übergabe).
3. **Qualitätsschleife lief als Workflow** (13 Agenten): 3 Juroren mit
   verschiedenen Blickwinkeln parallel, Median als Rundennote, Art-Agent
   mit exklusivem art/-Besitz, Screenshot-Agent auf Port 8124. Noten
   6 / 6 / 6,5, Abnahme über den 3-Runden-Pfad. Juror-Anweisungen waren
   durchweg pixelgenau umsetzbar, das Schema (total/criteria/instructions)
   hat sich bewährt.
4. **Workflow-Resume über Session-Limits:** zweimal abgebrochen (Limit,
   Prozess-Exit), beide Male sauber via resumeFromRunId fortgesetzt,
   fertige Agenten aus dem Cache. Vor Resume Dateizustand verifizieren
   (halbfertige Edits des gestorbenen Agenten möglich).
5. **Grenze der Kachel-Politur erreicht:** Note 8 braucht Struktur-Arbeit
   (2x2-Großkronen, Tile-Varianten gegen Wiederholung, Wasser in die
   Screenshot-Route), nicht mehr Politur derselben 16x16-Grids. Als
   Kandidat für einen späteren Pass notiert.
