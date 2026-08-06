# Workflow: Grafikpass 5 — "Wurzeln & Raster" (Ziel: Median 8 = Block-Ende)

## Ziel

Die drei bewiesenen Grundursachen der 8er-Deckel beheben statt
Symptome zu polieren: (1) variantIndex-Diagonalgitter bei geradem n
(Gras-Pool n=47 prim + UNGERADE-n-Sweep über ALLE Legenden),
(2) einseitige/lückenhafte Ufer-Emission (shoreEdges-Komplement,
landseitige bank-Bänder, Diagonal-Caps, Kanal-Entrechteckung
hash-frei, Reflexion im Kanal), (3) Kronen-Perlenkette (per-Anker-
Pixel-Offset mit exakten Formeln, Generator-Grobstruktur, drittes
Cluster, Spieler-unter-Laub-Beweis). Plus 8 lokalisierte
Prio-0-Defekte und Licht/UI-Politur (Vignette-Quantisierung).

MEILENSTEIN (Michael): Median >= 8 → Grafik-Block endet, erneute
Entscheidung. Nach Runde 3 < 8 → Eskalations-Dossier an Michael
(kein Auto-GP6). Max. 3 Runden.

## Inputs

- `design/SPEC_GRAFIKPASS_5.md` (bindend; Rev. 2 nach adversarialem
  Review: 7 Blocker + ~25 Majors eingearbeitet, u. a. Fackelscheiben
  und Zweiphasen-Over GESTRICHEN)
- `design/GP4_RUNDE3_JURY.md` (Backlog), Landkarte wf_3c834f60
- Grüne Basis: Commit 335b269

## Ablauf

1. Landkarte (5 Leser) + Spec (Fable) + Review (3 Prüfer). ERLEDIGT.
2. Build: PHASE 0 Generator-Vorlauf (.tmp) → PHASE 1 Art + Engine-A
   parallel → PHASE 2 Engine-B → PHASE 3 Integrator → PHASE 4 Proof.
   Alle Ausführenden Opus.
3. Jury: 3 DIREKTE Opus-Agenten; Deklarations-Liste aus Spec §8
   VOLLSTÄNDIG in die Prompts; Material = Szenen + 9 Crops + Strips.
4. Nach jeder Runde: Hauptloop committet grünen Stand.
5. Abnahme laut Spec §10.

## Besonderheiten

- "Fable plant, Opus baut"; nach Session-Restart Hauptloop-Modell
  prüfen. Resume-Muster: resumeFromRunId + Schadensbild-Erstauftrag;
  blockierte Agenten per SendMessage fortsetzen.
- Tests: kanonische Flusstests NULL; smoke NUR Katalog §6;
  fringeOverlays byte-eingefroren → alles Neue in NEUEN Funktionen;
  NULL Golden-Hash-Änderungen (Kanal-Umformung ist bewiesen neutral).
- Hash-Disziplin: UNGERADE n, teilerfremd, versetzte Koordinaten.
- Detektor: lighting.js:66 einziger Teilalpha-fillRect auf Offscreen;
  Bakes mit rgba-fillStyle bei globalAlpha=1.
- Prüf-Disziplin: 4-6x-Crops PFLICHT (9 Stück), Partikel-Änderungen
  immer mit Nahaufnahme, Bewegungs-Gates über 9-Lauf-MODUS.

## Abnahme

Siehe `design/SPEC_GRAFIKPASS_5.md` §10. Übergabe in `uebergaben/`.

## Erkenntnisse / Änderungen

(wird nach dem Lauf ergänzt)
