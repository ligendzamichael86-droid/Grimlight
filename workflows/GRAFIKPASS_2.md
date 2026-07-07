# Workflow: Grafikpass 2 — "Struktur statt Politur" (Messlatte: Secret of Mana)

## Ziel

Den Juror-Deckel aus Grafikpass 1 (Noten 6 / 6 / 6,5, Diagnose "Grenze der
Kachel-Politur") durch Struktur-Arbeit knacken: 2×2-Großkronen mit
Engine-Support, deterministische Tile-Varianten gegen Flächen-Wiederholung,
lebendiges Wasser inklusive neuer Screenshot-Route, Sprite-Politur der
zweiten Reihe (Skelett, Ghul, Grufthund, Rostpanzer, Props). NULL
Gameplay-Änderungen. Ziel: Juror-Median >= 8.

## Inputs

- `design/SPEC_GRAFIKPASS_2.md` (bindend; im Hauptloop geschrieben,
  nachgeschärft durch adversarialen 3-Blickwinkel-Review)
- Übergaben Slice 0 bis 3 (alle Festlegungen bleiben gültig)
- Grüne Basis: Commit 17063fa

## Ablauf

1. **Spec im Hauptloop (Fable), adversarialer Review (3 Opus-Prüfer parallel):**
   Code-Kollisionen, Test-Kollisionen, Art-Machbarkeit/Zielerreichung.
   Befunde werden im Hauptloop in die Spec eingearbeitet.
2. **Build (parallel, exklusiver Datei-Besitz, Spec §7):**
   - Engine-Builder: tilemap.js (span-Anker, variants, animRate/animSync,
     Culling, Validierungen), Map-Legenden, GRAVEYARD_OVER_ROWS neu
     (Generator .tmp/gen_overrows2.mjs), Smoke-Anpassungen laut Spec §5
   - Art-Builder: 3 Großkronen 32×32, Varianten-Tiles, Wasser-Loop
     (Ping-Pong), Sprite-Politur zweite Reihe, max. 4 neue Palettentöne
3. **Integration:** Integrator führt zusammen, macht Syntax + Smoke + alle
   drei Flusstests grün (Flusstests sind UNANTASTBAR, Spec §0.3).
4. **Juror-Schleife (Kern, max. 3 Runden):** Proof-Agent rendert die
   g2_*-Route auf Port 8124 (.tmp/shot_gfx2.py) → 3 Juroren mit
   verschiedenen Blickwinkeln parallel benoten gegen 5 Kriterien
   (1-10 + pixelgenaue Anweisungen), Median zählt → Art-Fixer bessert nach
   (nur art/). Abbruch bei Median >= 8.
5. **Abnahme:** Spec §8 (Syntax, Smoke 3×, Flusstests, git-diff-Beweis der
   Tabu-Zonen, Konsolen-Check, finale Screenshots).
6. **Übergabe** in `uebergaben/`, Git-Commit, Memory (Hauptloop).

## Besonderheiten

- ALLE ausführenden Agenten laufen auf Opus (Regel "Fable plant, Opus baut").
- Port 8123 gehört dem Auftraggeber; Agenten nutzen ausschließlich 8124
  (bei "Address already in use": prüfen, ob dort schon ein game/-Server
  läuft, dann mitbenutzen).
- Ground-rows aller vier Maps bleiben byte-identisch; nur Legenden und
  GRAVEYARD_OVER_ROWS ändern sich.
- Kein Math.random/Date.now in world/ und art/ (Smoke-Wächter).
- Sprite-Maße unverändert (einzige neue Maße: die drei 32×32-Kronen).
- Juror-Schleife hat einen Struktur-Eskalations-Pfad INNERHALB der Runde
  (Spec §6.3): strukturelle Juror-Anweisungen gehen an den Hauptloop und
  werden noch vor der nächsten Screenshot-Runde umgesetzt.
- Session-Abbrüche: Workflow-Resume via resumeFromRunId; vor Resume
  Dateizustand prüfen (halbfertige Edits gestorbener Agenten möglich).

## Abnahme

Siehe `design/SPEC_GRAFIKPASS_2.md` §8. Übergabe in `uebergaben/`.

## Erkenntnisse / Änderungen (Lauf 07.07.2026, 3 Runden, ~24 Agenten)

Abgeschlossen, Übergabe: `uebergaben/2026-07-07_grafikpass2.md`.
Notenverlauf Median 6 → 6,5 → 6,5 (Meilenstein 8 nicht erreicht; Backlog
für Pass 3 in der Übergabe; Projektziel während des Passes auf "SoM
übertreffen" verschärft, neue Juror-Skala ab Pass 3).

1. **Runden-Ergebnisse an Bildern selbst verifizieren:** Zwei
   Juror-Befunde ("Licht-Regression", "Bilderrahmen-Teich") hat der
   Hauptloop an den PNGs + Live-Screenshot nachgeprüft — einer war ein
   Alt-Balancing-Thema (keine Regression), einer ein ECHTER Fehler aus
   einer fehlerhaften Anweisungs-Konsolidierung des Hauptloops selbst
   ("pro Kachel" statt "pro Fläche"). Lehre: Juror-Anweisungen wörtlich
   weiterreichen; Flächen-Anweisungen explizit auf Kachel- vs.
   Flächen-Ebene klären.
2. **Eiserne Regeln schlagen Runden-Entscheidungen:** Die §8b.4-Ambient-
   Änderung kollidierte mit den unantastbaren Flusstests; der
   Engine-Fixer hat korrekt zurückgerollt und eskaliert. Werte, die in
   Flusstests asserted sind, sind faktisch eingefroren — Änderungen
   brauchen eine Spec mit sanktionierten Alt-Test-Änderungen (Slice-3-
   Muster).
3. **Session-Limit-Resume erneut bewährt** (Art-Fixer + Verify starben in
   Runde 3): resumeFromRunId + Schadensbild-Erstauftrag; der tote Agent
   hatte ~90 % im Baum, der Nachfolger füllte nur Lücken. Vorher
   Dateizustand prüfen bleibt Pflicht.
4. **Null-Urteile abfangen:** Ein Juror bekam keinen PNG-Lesezugriff und
   lieferte Gesamtnote 0 — solche Urteile sind ungültig, zählen nicht in
   den Median, Ersatz-Juror einzeln nachfahren. Künftig im Juror-Schema
   eine Pflicht-Selbstauskunft "bilder_gelesen: true/false" ergänzen und
   im Skript filtern.
5. **Beweis statt Behauptung für Animationen:** Die Wasser-Drift war in
   Runde 2 "umgesetzt", aber unsichtbar; ab Runde 3 musste der
   Proof-Agent sie per Pixel-Diff belegen (~18 % Wasserpixel/Frame).
   Muster übernehmen: bewegte Features immer mit messbarem Diff abnehmen.
6. **Konsistenz durch geteilte Generatoren:** Großkronen UND Füller aus
   demselben .tmp-Generator (gen_crowns) erzeugt = kein Stilbruch;
   dasselbe Muster beim Wasser (ein Look für Teich und Kanal).
