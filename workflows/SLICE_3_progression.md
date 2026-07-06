# Workflow: Slice 3, Progression

## Ziel

XP/Level als schmale dritte Progressionsschiene (Level = Zähigkeit, Items =
Macht), zwei neue Maps (Flüstergruft, Bosskammer), der erste Boss (Der
Grabwächter) als Prüfung der gelernten Verben, Eliten, Boss-Schlüssel,
Herzcontainer und eine mobile-faire Todesregel (Respawn + Gold-Zoll statt
Run-Neustart). Am Ende im Browser spielbar: kompletter Run Friedhof >
Katakomben > Flüstergruft > Bosskammer > Sieg.

## Inputs

- `design/SPEC_SLICE_3.md` (bindend; Synthese des 3er-Design-Panels,
  nachgeschärft durch einen 3-Blickwinkel-Review mit 31 eingearbeiteten
  Befunden)
- Übergaben Slice 0/1/1.5/2 (alle Festlegungen bleiben gültig)

## Ablauf

1. **Design-Panel (erledigt):** 3 Perspektiven parallel (Systemdesign/
   Balance, Engine/Architektur, Spielgefühl/Mobile-UX), Synthese im
   Hauptloop, Schiedsentscheide dokumentiert in der Spec-Präambel.
2. **Adversarialer Spec-Review (erledigt):** 3 Prüfer parallel gegen den
   echten Code (Code-Kollisionen, Test-Kollisionen, Balance/Konsistenz);
   2 Blocker, 8 Majors, 21 weitere Befunde in die Spec eingearbeitet.
3. **Build Phase 1 (parallel, exklusiver Datei-Besitz):**
   - Builder A: `world/coords.js` (neu), `world/map_fluestergruft.js`
     (neu), `world/map_bosskammer.js` (neu), `world/maps.js`,
     `items/progression.js` (neu)
   - Builder B: `entities/boss.js` (neu), `entities/enemies.js`,
     `entities/player.js`, `entities/props.js`, `entities/projectiles.js`
   - Art: `art/palette.js` + `art/sprites.js` (Grabwächter-Set, elite_glow,
     levelup-Ring, icon_key, Gruft-/Wasser-Tiles)
   Interfaces eingefroren in Spec §3; Dev-Checks in `.tmp/`.
4. **Build Phase 2 (sequenziell, Integrator bewusst klein):** Builder C:
   `ui/hud.js`, `ui/inventory_ui.js`, `main.js`, Smoke-Abschnitte 30-34,
   Flusstest `.tmp/check_boss_slice3.mjs`, die GENAU DREI erlaubten
   Alt-Test-Änderungen aus Spec §4.
5. **Verify:** Syntax, Smoke komplett, alle Flusstests, Touch-Fairness-
   Checkliste Spec §2.3; Fix-Zyklen bei Rot (max. 2, dann eskalieren).
6. **Screenshot-Proof:** s3_01 bis s3_08 laut Spec §5; Werkzeug
   `.tmp/shot_slice2.py` wiederverwenden (Kamera-Rig-Tricks im Skript-Kopf),
   eigener Server auf 8124 (NIE 8123), Konsolen-Fehler = rot.
7. **Übergabe** in `uebergaben/`, Git-Commit, Memory aktualisieren.

## Besonderheiten

- Port 8123 gehört dem Auftraggeber; Agenten nutzen ausschließlich 8124.
- `items/items.js` ist für ALLE Builder tabu (stärkste
  Regressionsversicherung des Slices).
- Alt-Test-Änderungen: NUR die drei in Spec §4 aufgezählten; alles andere
  ist Spec-Verstoß und eskaliert.
- Flip-Liste in main.js: neue Keys nur ans Ende anhängen (Alt-Flusstests
  mappen Canvases über die Erzeugungsreihenfolge).
- Session-Abbrüche sind der Hauptrisikofaktor (Slice-2-Lehre): Integrator
  klein schneiden, bei Agent-Tod Schadensbild dokumentieren und dem
  Nachfolger als Erstauftrag mitgeben; Git ist das Rollback-Netz
  (grüner Slice-2-Stand = Commit f620c2a).

## Abnahme

Siehe `design/SPEC_SLICE_3.md` §5. Übergabe in `uebergaben/`.

## Erkenntnisse / Änderungen

(wird nach dem Build gefüllt)
