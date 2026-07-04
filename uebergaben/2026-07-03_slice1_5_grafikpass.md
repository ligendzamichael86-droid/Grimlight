# Übergabe: Slice 1.5, Grafik-Qualitätspass (Messlatte Secret of Mana)

Datum: 2026-07-03. Spec: `design/SPEC_SLICE_1_5.md`. Workflow: `workflows/SLICE_1_5_grafikpass.md`.

## Was fertig ist

**Integration (war beim Sessionabbruch am 02.07. nur halb da, jetzt komplett):**

1. **Fringe-System aktiv:** Friedhof: Gras (`.` und `,`, fringeSource/Set `grass`)
   franst über Weg (`=`) und Wasser (`~`) (beide fringeTarget). Katakomben:
   Ziegelwand (`#`, fringeSet `moss`) wächst als Moossaum über Steinboden
   (`.` und `,`). Logik in `tilemap.js` (`fringeOverlays`, reine Funktion).
2. **Baumkronen-Layer:** `GRAVEYARD.overRows` mit Zweiteiler-Kronen:
   `B` (tree_canopy_bottom) liegt AUF der Stamm-Zelle, `K` (tree_canopy_top)
   ein Tile darüber, `C` (tree_canopy) als Cluster-Füller in der Legende
   verfügbar. Man läuft unter Kronen durch (10 begehbare Zellen verdeckt).
   Generator: `.tmp/gen_overrows.mjs`. Katakomben haben KEIN overRows
   (kein Bogen-Sprite vorhanden, Moos-Fringe liefert dort den Sprung).
3. **Y-Sortierung:** `main.js drawWorld()` sortiert Drops, Props, Gegner und
   Spieler gemeinsam nach Fußkante (y+h) und zeichnet danach den Over-Layer.
   Dafür Einzel-Zeichner exportiert: `drawEnemy`, `drawDrop` (enemies.js),
   `drawProp` (props.js). Die Sammel-Funktionen bleiben erhalten.
4. **Zwei Draw-Bugs behoben:** `player.js` und `enemies.js` zeichneten
   16 px fest verdrahtet, der 24er-Held stand 8 px, der 20er-Ghul 4 px zu
   tief. Jetzt größenagnostisch: horizontal auf die Hitbox zentriert,
   Füße = Hitbox-Unterkante, Maße aus dem Canvas gelesen.

**Iterative Qualitätsschleife (Multi-Agent-Workflow, 3 Runden dokumentiert):**

| Runde | Jury (3 Blickwinkel) | Median | Art-Fix danach |
|---|---|---|---|
| 1 | 6 / 6 / 6 | 6 | 35 Grid-Schlüssel (Steinplatten-Fugen, Weg-Schatten entzerrt, Gras-Töne, Kronen verdichtet, Held-Torso) |
| 2 | 6 / 6 / 6 | 6 | 32 Grid-Schlüssel (Wasser neu, Gras-Tuft-Varianten, Platten geschlossen, Kronen-Silhouette, Kontaktschatten Held) |
| 3 | 6 / 6,5 / 6,5 | **6,5** | keiner (Rundenlimit erreicht) |

Abnahmekriterium der Spec erfüllt über den zweiten Pfad: 3 dokumentierte
Runden mit sichtbarem Fortschritt (Farbrampen 5-6 auf 6-7, Kanten 5-6 auf
6-7, Gesamteindruck 6 auf 6,5-7; Held konstant 7).

**Alle Tests grün (finaler Stand):** Syntax (15 Dateien), Smoke-Test
(inkl. 9 neuer Over-Layer/Fringe-Checks, Abschnitt 21), beide Flusstests
(24 + 13 Assertions), Fringe-Logik-Test, Art-Check (38 Sprites, 41 Tiles,
52 Farben). Finaler Browser-Proof ohne Konsolen-Fehler.
Vorher/Nachher: `.tmp/screenshots/s1_*` (Baseline) vs `s15_*` (final).

## Bindende Festlegungen (neu in diesem Slice)

1. **Test-Anker-Konvention:** Headless-Flusstests lesen die Spielerposition
   sprite-größen-agnostisch: x = horizontales Sprite-Zentrum, y = Sprite-
   Unterkante (= Fußkante). Nie wieder Zeichen-Ecken-Koordinaten in
   Assertions verwenden, die brechen bei jeder Sprite-Größenänderung.
2. **Over-Layer-Konvention:** `'.'` in overRows = leer (vor dem Legend-
   Lookup), Over-Tiles nie solid (createTilemap wirft sonst), Fackel-Zeichen
   dürfen nie in overRows (findTiles bleibt ground-only).
3. **Kronen-Zeichen:** `B` = canopy_bottom auf Stammzelle, `K` = canopy_top
   darüber, `C` = Einzel-/Cluster-Krone. Erzeugung deterministisch über
   `.tmp/gen_overrows.mjs`, nicht von Hand pflegen.

## Was offen ist (für spätere Grafik-Pässe)

1. **Baumkronen sind der schwächste Punkt (Jury konstant 5):** Silhouette
   trennt sich zu wenig vom dunklen Gras, Blattballen-Plastizität fehlt
   trotz zweier Nachbesserungen. Kandidat für einen dedizierten Baum-Pass
   (evtl. 2x2-Tile-Großkronen statt 1x1-Kacheln).
2. **Wasser** ist auf keinem Screenshot-Pfad sichtbar (liegt im Osten der
   Map), Bewertung dazu war nie belegbar. Screenshot-Route erweitern.
3. **Weg-Fringe-Periodizität:** Zacken wiederholen sich pro 16-px-Tile
   sichtbar; Juroren schlagen 2-3 Tile-Varianten vor (bräuchte Varianten-
   Support im Tilemap-Renderer, Engine-Thema, nicht nur Art).
4. Jury-Zielnote 8 nicht erreicht (6,5). Realistisch braucht das eher
   größere Struktur-Maßnahmen (Großkronen, Tile-Varianten, Boden-Dekor-
   Streuung) als weitere Pixel-Politur derselben Kacheln.

## Wie testen

```
python3 tools/serve.py          # Port 8123, im Browser öffnen
node tools/smoke_test.mjs       # Headless-Suite (inkl. Over-Layer-Checks)
node .tmp/check_main_slice1.mjs # Fluss Friedhof/Portale/Game-Over
node .tmp/check_victory_slice1.mjs # Sieg-Pfad Katakomben
```

Im Spiel sichtbar: Friedhof-Westrand und Südrand haben Kronen über dem
Spieler (drunter durchlaufen), Gras franst über die Wegkanten, in den
Katakomben Steinplatten-Boden und Moosranken an allen Wandfüßen, Held ist
16x24 mit Schwertgriff über der Schulter.

## Stand Ende Session 03.07.2026 (für nahtlose Fortsetzung)

1. **Slice 1.5 ist KOMPLETT abgenommen**, nichts ist mehr in Arbeit, kein
   Workflow läuft, keine halbfertigen Edits. Alle Tests grün (Stand des
   finalen Proofs oben).
2. **Nächster Schritt: Slice 2, Loot & Inventar** (Item-Drops mit Affixen,
   Ausrüstung, Zelda-Zweitwaffe, siehe Fahrplan in CLAUDE.md und
   design/GDD.md). Noch NICHT begonnen; es existiert weder
   design/SPEC_SLICE_2.md noch workflows/SLICE_2_*.md. Einstieg wie bei
   den Vorgängern: Design-Panel -> bindende Spec -> Builder mit
   Interface-Handover -> Verify -> Screenshot-Proof.
3. **Wiederverwendbare Werkzeuge:** .tmp/venv (Playwright installiert,
   Chromium-Cache persistent), .tmp/shot_slice15.py (Screenshot-Treiber,
   für Slice 2 kopieren/anpassen), .tmp/check_main_slice1.mjs und
   check_victory_slice1.mjs (Flusstests, bleiben als Regression gültig),
   .tmp/render_sheet.mjs (Sprite-Kontaktbögen), .tmp/gen_overrows.mjs
   (Kronen-Generator). Agenten-Server ggf. neu starten: eigener
   HTTP-Server auf 127.0.0.1:8124 mit Wurzel game/ (nie Port 8123).
4. **Alle bindenden Festlegungen** stehen in den Übergaben (dieses
   Dokument + Slice 0 + Slice 1) und in CLAUDE.md; Projekt-Gedächtnis in
   der Auto-Memory (project_grimlight.md) ist auf diesem Stand.

## Betriebsnotizen

1. Agenten-Server läuft auf Port 8124 (`.tmp/serve8124.log`), Port 8123
   gehört dem Auftraggeber und wird nie angefasst.
2. Workflow-Resume nach Session-Limit-Abbruch funktioniert zuverlässig:
   gleiche scriptPath + resumeFromRunId, fertige Agenten kommen aus dem
   Cache. Vor dem Resume Dateizustand prüfen (der abgestürzte Agent kann
   halbfertige Edits hinterlassen haben; hier war palette.js schon
   geändert, Checks blieben grün, Resume-Artist hat das erkannt).
