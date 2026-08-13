# Workflow: Grafikpass 6 — "Licht & Maßstab" (Option A, Entscheid Michael 07.08.2026)

## Ziel

Die vier Dossier-Hebel (design/DOSSIER_GRAFIKBLOCK.md) plus
R3-Restliste: (1) Licht-Quantisierung auf 12 Stufen + Bayer VOR der
Anwendung, (2) Belichtungs-Sockel (Paletten-Offset außen + EINE
sanktionierte Ambient-Test-Runde), (3) Sprite-Beleuchtung +
Kontaktschatten für alle Entity-Klassen (Fassaden-ctx, entities/
bleibt tabu), (4) Kronen-Maßstab 48×32/64×48 mit Scher-Posen und
geschlossenem Blätterdach.

**ABNAHME NEU: Messziele M1-M5 (Spec §1) statt 10er-Skala.** Die
Jury validiert Messungen und liefert Sichtbefunde; die Note ist
informativ. Max. 3 Runden, danach Ergebnis an Michael.

## Inputs

- `design/SPEC_GRAFIKPASS_6.md` (bindend; Rev-Stand beachten)
- `design/GP6_LANDKARTE.md` (Faktenbasis, wf_69e483d4-2fd)
- Grüne Basis: Commit 7e1d86d (inkl. God-Mode ?god=1)

## Ablauf

1. Landkarte (6 Leser) ERLEDIGT → Spec (Fable) → adversarialer
   Review (3 Prüfer) → Rev 2.
2. Build: PHASE 0 Perf-Probe (§2.4-Budget BINDEND, vor allem
   anderen!) + Generatoren → PHASE 1 Art + Engine-A parallel →
   PHASE 2 Engine-B → PHASE 3 Integrator (§7-Katalog) → PHASE 4
   Proof (.tmp/shot_gfx6.py, M1-M5 mit Kontrollen).
3. Jury: 3 DIREKTE Opus-Agenten; Deklarationsliste Spec §9
   vollständig in die Prompts; Material Szenen + 9 Crops + Strips +
   Gradient-Schnitt + Messreport.
4. Nach jeder Phase/Runde: Hauptloop committet grünen Stand.

## Besonderheiten

- "Fable plant, Opus baut"; nach Session-Restart Hauptloop-Modell
  prüfen. Resume: resumeFromRunId + Schadensbild-Erstauftrag;
  blockierte Agenten per SendMessage fortsetzen.
- Die 13 Flusstest-Ambient-Zeilen (§7.A) sind die EINZIGE
  Flusstest-Änderung des Passes — git-diff-Beweis Pflicht, danach
  Kontingent erneut verbraucht.
- ambientAlpha-Detektor: Ambient-Fill bleibt ERSTER Teilalpha-
  fillRect auf Nicht-Main-Canvas; ALLE neuen Offscreen-Zeichnungen
  rgba bei globalAlpha=1 (auch destination-out-Stanzen).
- Wächter B: neue Keys/Canvases NUR ans Ende bzw. nach main.js:71;
  erster drawImage je Entity bleibt das Original-Canvas.
- check_lighting_input_slice1.mjs ist BEKANNT ROT, nicht kanonisch.
- Messziel-Disziplin: Schwellen stehen in der Spec und werden NIE
  angepasst; jede Methoden-Änderung braucht Positiv- UND
  Negativ-Kontrolle.

## Abnahme

Spec §10. Übergabe in `uebergaben/`.

## Erkenntnisse / Änderungen (Lauf 12.-13.08.2026, ABGENOMMEN)

Abgeschlossen: ALLE 15 Messziel-Gates grün, Jury-Noten 7,5/7,8/7,5
(Median 7,5; GP5: 7,0). Übergabe: uebergaben/2026-08-13_grafikpass6.md
(dort die 5 bindenden Erkenntnisse: Gates brauchen Ober- UND
Untergrenzen; Eich-Formeln VOR der Messung und Einfrier-Commits
ohne Beifang; Mess-Korrekturen brauchen Review wie Specs — 3
Fable-Rechenfehler von Agenten/Juroren gefunden; Töne material-
relativ statt absolut; bewegte Messgrößen einfrieren/mitteln).
Jury-Prozess neu: Mess-Validierung + Sichtprüfung bindend, Note
informativ; Juror-M-Skeptiker-Rolle (dem grünen Tableau NICHT
glauben) hat sich doppelt bezahlt gemacht. Spec-Historie Rev 1→2.5
mit dokumentierten Methoden-Korrekturen. P0-D-Deklaration (Michael,
Option a) ist Teil der Abnahme. GP7-Backlog priorisiert in der
Übergabe + design/GP6_JURY_R1.md.
