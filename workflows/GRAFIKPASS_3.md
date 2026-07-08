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

## Erkenntnisse / Änderungen

(wird nach dem Lauf ergänzt)
