# Workflow: Slice 2 — Loot & Inventar

## Ziel

Der erste Loot-Loop: Gegner droppen Ausrüstung mit Affixen, ein Inventar zum
Anlegen mit sofort messbarer Wirkung, der Knochen-Bumerang als feste
Zelda-Zweitwaffe, dazu Grufthund und Rostpanzer-Skelett als Gegner, die den
Bumerang bzw. das Positionsspiel belohnen. Am Ende im Browser spielbar.

## Inputs

- `design/SPEC_SLICE_2.md` (bindend, Synthese des 3er-Design-Panels)
- Übergaben Slice 0/1/1.5 (alle Festlegungen bleiben gültig)

## Ablauf

1. **Review:** Adversarialer Spec-Review gegen den echten Code (Interfaces,
   Kollisionsstellen, vergessene Verbraucher), Spec ggf. nachschärfen.
2. **Build Phase 1 (parallel, exklusiver Datei-Besitz):**
   - Builder A: `items/items.js` (neu), `core/input.js`, `world/maps.js`
   - Builder B: `entities/` (enemies, player, props, entity, projectiles neu)
   - Art: `art/palette.js` + `art/sprites.js`
   Die Interface-Handovers stehen eingefroren in der Spec §3; A und B testen
   gegeneinander nur über diese Formen (Dev-Checks in `.tmp/`).
3. **Build Phase 2 (sequenziell, Integrator):** Builder C: `ui/inventory_ui.js`
   (neu), `ui/hud.js`, `main.js`, Smoke-Test-Abschnitte 22-29, neuer
   Flusstest `.tmp/check_inventory_slice2.mjs`. main.js berührt jedes System,
   also zuletzt und exklusiv; alles davor ist headless beweisbar.
4. **Verify:** Syntax, Smoke (inkl. Regression 0-21), alle Flusstests,
   Fix-Zyklen bei Rot (max. 2, dann eskalieren).
5. **Screenshot-Proof:** eigener Server auf 8124 (NIE 8123), Playwright aus
   `.tmp/venv`, Motive s2_01 bis s2_07 laut Spec §5, Konsolen-Fehler = rot.

## Besonderheiten

- Port 8123 gehört dem Auftraggeber — Agenten nutzen ausschließlich 8124.
- Fußkanten-Anker-Konvention für alle Positions-Asserts (Slice 1.5).
- Der generische wander/chase-Pfad in enemies.js bleibt wörtlich stehen
  (Skelett/Ghul-Regression); neue Gegner nur über den Verhaltens-Dispatch.
- Kampfcode liest nie Affixe, nur `player.stats` (Fallbacks `?? Basiswert`,
  damit bestehende Tests ohne Inventar weiterlaufen).
- Neue Side-Sprites in die Flip-Liste in main.js eintragen (bekannte Falle).

## Abnahme

Siehe `design/SPEC_SLICE_2.md` §5. Übergabe in `uebergaben/`.

## Erkenntnisse / Änderungen

1. **Session-Abbrüche sind der Hauptrisikofaktor, nicht die Agenten.** Zwei
   Läufe starben mit der geschlossenen Session (Builder verlieren alles,
   was nicht auf Platte ist), einer am Session-Limit MITTEN im Schreiben:
   der Integrator hinterließ eine halbfertige main.js mit kaputtem Siegpfad.
   Gegenmittel, das funktioniert hat: Zustand prüfen (Zeitstempel, Tests),
   Schadensbild exakt dokumentieren und dem Nachfolge-Agenten als
   Erstauftrag mitgeben ("prüfe die Hinterlassenschaft, repariere zuerst").
2. **Spec-Konflikte erst im Build sichtbar:** Paragraph 3 (Pflicht-Spawns)
   und Paragraph 4 (Alt-Tests unverändert) waren unvereinbar; der alte
   Victory-Test leert jetzt dokumentiert die neuen Spawns. Lehre für
   künftige Specs: bei neuen Gegnern immer prüfen, ob Alt-Tests
   HP-Budgets haben, die kippen können.
3. **Unabhängiger Verify lohnt:** fand nach grünen Tests noch einen echten
   Touch-Schnitzer (Schließen-Tap aufs X löste einen Schwerthieb aus,
   behoben via attackSwallow in main.js).
4. **Screenshot-Inszenierung:** performance.now-Wrapper (Zeitlupe/Freeze),
   Math.random-Würfelschlange nur im spawnDeathDrops-Stack und
   Telemetrie-Wrapper per Route-Interception erlauben exakte Frame-Beweise
   ohne jede Spieldatei-Änderung. Werkzeug: .tmp/shot_slice2.py,
   wiederverwendbar für kommende Slices.
5. **Kein Git im Projekt** wurde als Lücke sichtbar (halbfertige Edits
   lassen sich nur aus der Spec rekonstruieren). Empfehlung: git init
   vor Slice 3.
