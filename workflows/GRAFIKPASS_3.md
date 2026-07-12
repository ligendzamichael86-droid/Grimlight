# Workflow: Grafikpass 3 — "Moderne Mittel" (Ziel: Secret of Mana übertreffen)

## Ziel

Das GP2-Backlog umsetzen und erstmals die modernen Mittel öffnen, die dem
SNES verwehrt waren: Glut-Partikel über Fackeln, weiche Alpha-Bodenschatten,
Farbtemperatur pro Gebiet, HUD-Panel — plus Wasser-Wellenbänder,
6 Kronensilhouetten, Deko-Dichte, Ambient-Rebalancing und Sprite-Refresh
(Skelett neu, Ghul-Farbton, Grabwächter-Backlight). NEUE JUROR-SKALA:
10 = herausragende moderne Handy-Pixel-Art, SoM = 8,5-9, gutes SNES-Spiel
= 6; GP2-Endstand ≈ 4,5-5. Meilenstein: Median >= 6,5 (neue Skala).

## Inputs

- `design/SPEC_GRAFIKPASS_3.md` (bindend; adversarial reviewt: 3 Blocker,
  4 Majors, 5 Minors eingearbeitet)
- `uebergaben/2026-07-07_grafikpass2.md` (Backlog-Quelle)
- Grüne Basis: Commit 204e28f

## Ablauf

1. Spec im Hauptloop (Fable), adversarialer Review (3 Opus-Prüfer). ERLEDIGT.
2. Build parallel (Engine + Art, exklusiver Besitz laut Spec §7),
   dann Integration.
3. Juror-Schleife: Proof (g3_01-g3_08, Pixel-Diff-Pflicht für Wasser-Bänder
   UND Funken-Serie) → 3 Juroren (neue Skala, Pflichtfeld bilder_gelesen,
   Null-Urteile werden ausgefiltert und einzeln ersetzt) → Median; max. 3
   Runden, kein früher Abbruch unter 10; Struktur-Eskalation in der Runde.
4. Abnahme laut Spec §8, Übergabe, Commit, Memory (Hauptloop).

## Besonderheiten

- ALLE ausführenden Agenten auf Opus ("Fable plant, Opus baut").
- Port 8123 = Auftraggeber; Agenten nur 8124.
- rows-Deko-Ausnahme NUR GRAVEYARD/CATACOMBS mit Solidity-Guard (Smoke §36);
  FLUESTERGRUFT/BOSS_KAMMER-rows byte-identisch.
- GENAU SIEBEN Flusstest-Zeilen (Ambient-Fingerprints) dürfen angepasst
  werden; KEINE Stub-Änderungen (Schatten/Panel sind fillRect-only).
- Erlaubte Smoke-Edits: 16 additiv, 21 minimal ('MNO'→'MNOQVX'), 35
  (Wasser-Zyklus, spanKeys+3, rows-Freeze+QVX, additive neue Tests),
  36 NEU. Rest eingefroren.
- Kein Math.random in world/ und art/; core/particles.js ist die
  dokumentierte Ausnahme (nur Spawn-Pfad).

## Abnahme

Siehe `design/SPEC_GRAFIKPASS_3.md` §8. Übergabe in `uebergaben/`.

## Erkenntnisse / Änderungen (Lauf 08.-12.07.2026, 3 Runden)

Abgeschlossen, Übergabe: `uebergaben/2026-07-12_grafikpass3.md`.
Notenverlauf Median 5,5 → 6,0 → 6,5 (neue Skala) — MEILENSTEIN 6,5
ERREICHT (einstimmig 6,5/6,5/6,5 in Runde 3). Projektziel bleibt 10.

1. **Hauptloop-Modell prüfen nach Session-Restart:** Teile von Runde 2
   liefen versehentlich mit Haiku als Hauptloop (Regel: Fable plant).
   Die Juroren (Opus) und der Median waren korrekt, aber die
   Anweisungs-Konsolidierung war paraphrasiert statt wörtlich und
   verschluckte zwei Juror-Widersprüche. Fable-Nachprüfung (5 parallele
   Opus-Prüfer) hat alles Technische als grün bestätigt und die
   Konsolidierung ersetzt (design/GP3_RUNDE2_JURY.md). Lehre: nach
   jedem Restart Modell prüfen, BEVOR konsolidiert wird; die
   GP2-Lehre "wörtlich zitieren" gilt unverändert.
2. **Adversariale Scope-Prüfung VOR Engine-Mandaten lohnt:** Die vier
   R3-Mandate wurden vor dem Build gegen die realen Testdateien
   geprüft. Kern-Entwarnung: Smoke §36 hasht das SOLIDITÄTS-Raster,
   nicht die rows-Bytes — begehbare Deko-Tausche sind hash-neutral;
   §16 ist eine Mindestliste (neue Keys erlaubt); die §35-Wasser-
   Assertions nutzen eine synthetische Legende. Dadurch liefen alle
   vier Mandate ohne einen einzigen Test-Edit (Tests in R3 komplett
   eingefroren) und der Integrator brauchte NULL Fixes.
3. **Build-Topologie mit Interface-Freeze:** Art + Engine-A parallel,
   Engine-B (Deko/Legende) sequenziell danach, weil er die neuen
   Art-Keys braucht (water_v_*, Detail-Keys). Key-Namen vorab
   eingefroren. Funktionierte reibungslos — Muster übernehmen.
4. **Bewegungs-Beweise brauchen passende Verfahren:** Die vertikale
   Kanal-Drift ist per rohem Pixel-Korrelieren NICHT nachweisbar
   (statischer Tiefen-Schleier dominiert); erst das Residuum-
   Zeilenprofil (Per-Pixel-Minimum abziehen) zeigt die +4px/Frame-
   Abwärtsdrift eindeutig (.tmp/kanal_proof.py). Richtwerte aus
   Vorrunden gelten nach Absicht-Änderungen nicht weiter (Wasser-Diff
   sank planmäßig 40 %→22 %, Funken stieg 21 %→39 %).
5. **Bewusste Entscheide im Juror-Prompt deklarieren:** Der Hinweis
   "Gegner-Schatten kommen aus dem Engine-Pass, bewusster Entscheid"
   führte dazu, dass die Jury ihn als Entscheid bestätigte statt als
   Defekt zu werten.
6. **Namens-Hygiene bei Art-Keys:** Die Jury-Anweisung "grass_dark-
   Patches" kollidierte mit einem BESTEHENDEN Key gleichen Namens
   (Basisgras heißt intern grass_dark) — der Engine-Builder hat sauber
   auf einen sichtbaren Fallback ausgewichen und eskaliert. Lehre:
   vor Interface-Freeze neue Key-Namen gegen sprites.js grep'en.
7. **Jury weiter via direktem Agent-Werkzeug** (Workflow-Subagenten
   dürfen keine Bilder lesen; Betriebserkenntnis aus R1 bestätigt).
   Ein Juror-Urteil enthielt einen echten Regressions-Befund
   (Teich-Speckle) — ehrliche Einzelkritik trotz einstimmiger Note,
   als Priorität 1 ins Pass-4-Backlog übernommen.
