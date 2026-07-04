# Technische Spezifikation — Slice 1.5 "Grafik-Qualitätspass (Messlatte: Secret of Mana)"

Ziel: Sichtbarer Qualitätssprung der Grafik Richtung Secret-of-Mana-Niveau, ohne
Gameplay-Änderungen. Bindend bleiben SPEC_SLICE_0/1 und die Übergabe-Festlegungen;
NUR die hier genannten Erweiterungen sind erlaubt. Alle Tests müssen am Ende grün sein.

## 1. Was "Secret-of-Mana-Niveau" hier konkret heißt

1. **Farbrampen:** 4-5 Töne pro Material (statt 2-3), weiche Verläufe, bewusste
   Licht-von-oben-Schattierung. Palette darf wachsen (1 Zeichen pro Farbe,
   Vorrat a-z A-Z 0-9 reicht).
2. **Übergangskanten (Fringe):** Gras franst über Weg-/Wasserränder, keine harten
   Tile-Kanten mehr zwischen Bodenarten.
3. **Größerer Held:** 16 breit × 24 hoch (SoM-Proportion), Hitbox bleibt 12×14.
4. **Layering:** Baumkronen/Überhänge werden ÜBER dem Spieler gezeichnet
   (man läuft darunter durch).
5. **Y-Sortierung:** Entities (Spieler, Gegner, Props, Drops) werden nach
   Fußkante sortiert gezeichnet — wer weiter unten steht, ist "davor".

## 2. Interfaces / Änderungen (bindend)

### Sprites (Besitz: Art)
- ALLE bestehenden Schlüssel bleiben. `player_*`-Grids werden 24 Zeilen × 16
  Zeichen. `ghoul_*` darf auf 16×20 wachsen, `skeleton_*` bleibt 16×16 (Politur
  erlaubt). Alle übrigen Sprites: Politur erlaubt, Maße unverändert.
- NEUE TILE_ART-Schlüssel:
  - `fringe_n, fringe_e, fringe_s, fringe_w` — Gras-Fransenkante, die auf einem
    Nicht-Gras-Tile an der jeweiligen Seite liegt (Rest transparent). Benennung
    = Seite des Tiles, an der der Gras-Nachbar liegt.
  - `fringe_ne, fringe_nw, fringe_se, fringe_sw` — Außenecken (nur diagonaler
    Gras-Nachbar).
  - `tree_canopy` — dichte knorrige Baumkrone (16×16, Ränder transparent),
    `tree_trunk` — Stamm/Wurzeln passend darunter.
  - Katakomben-Pendant: `moss_fringe_n/e/s/w` (4 Stück reichen, keine Ecken) für
    Moosränder auf stone_floor neben brick_wall.
- Der bestehende Tile-Selbstcheck gilt weiter; Grids dürfen jetzt
  unterschiedliche Höhen haben (Breite pro Grid konsistent, Höhe 8/16/20/24).

### js/core/sprite_factory.js — KEINE Änderung nötig (arbeitet größenagnostisch).

### js/world/tilemap.js (Besitz: Engine-Builder)
```js
// createTilemap(rows, legend, overRows = null)
// NEU 3. Parameter: overRows — Array gleicher Dimension, '.' = leer,
//   Zeichen aus derselben legend; Tiles im Over-Layer sind NIE solide.
// draw(ctx, camera, tileCanvases, timeSec, layer = 'ground')
//   'ground' zeichnet rows inkl. Fringe-Logik, 'over' zeichnet overRows.
// Fringe-Logik (nur im ground-Layer): legend-Einträge können
//   fringeSource: true (Gras-Arten) bzw. fringeTarget: true (Weg, Wasser,
//   stone_floor …) tragen. Beim Zeichnen eines Target-Tiles: für jede
//   orthogonale Seite mit Source-Nachbar das passende fringe_* darüber;
//   für jede Diagonale mit Source-Nachbar, deren beide Orthogonalen KEINE
//   Sources sind, die Ecke fringe_ne/… . Katakomben nutzen mossFringe: true
//   an brick_wall (Source) + stone_floor (Target) mit moss_fringe_*.
//   Welche Fringe-Sets es gibt, bestimmt legend-Feld fringeSet: 'grass'|'moss'.
```

### js/world/maps.js (Besitz: Engine-Builder)
- Beide Maps bekommen `overRows`: Baumkronen über/um die T-Stämme (Friedhof —
  Kronen ragen 1 Tile über den Stamm bzw. bilden kleine Kronen-Cluster an den
  Rändern), in den Katakomben Bogen-/Überhang-Akzente sparsam.
- Legenden: fringeSource/fringeTarget/fringeSet-Flags setzen; neue Zeichen für
  tree_trunk/tree_canopy.
- Baum-Tiles: Stamm solid im ground-Layer, Krone im over-Layer nicht solid.
- Begehbarkeit/Spawns/Portale dürfen sich NICHT ändern (Flusstests!).

### js/entities/player.js, enemies.js (Besitz: Engine-Builder, NUR draw-Methoden)
- Sprite-Zeichnung generisch: `dx = x - (spriteW - w)/2`, `dy = y - (spriteH - h)`
  (Füße = Hitbox-Unterkante), spriteW/H aus dem Canvas gelesen. Kein Hardcoding
  von 16×16.

### js/main.js (Besitz: Engine-Builder)
- Render-Reihenfolge NEU: ground-Layer → Entities **y-sortiert nach Fußkante**
  (Drops, Props, Gegner, Spieler gemeinsam sortiert) → over-Layer → Fog →
  Lighting → Vignette → HUD.

### tools/smoke_test.mjs (Besitz: Engine-Builder)
- Art-Checks anpassen (variable Grid-Höhen, neue Pflicht-Schlüssel, player = 24
  Zeilen), overRows-Checks (Legende deckt Zeichen, Over-Tiles nie solid,
  Dimensionen passen), alle bestehenden Gameplay-Checks bleiben grün.

## 3. Iterative Qualitätsschleife (Kern dieses Slices)

Nach der Erstumsetzung läuft eine Schleife (max. 3 Runden):
1. **Screenshot-Agent** rendert das echte Spiel headless (eigener Server auf
   Port **8124** — Port 8123 gehört dem Auftraggeber und wird NIE angefasst):
   Friedhof-Totale, Friedhof-Nahbereich beim Spieler, Katakomben-Szene.
2. **Juror** (sieht die PNGs) bewertet gegen die 5 Kriterien aus Abschnitt 1
   (Note 1-10 gesamt + pro Kriterium konkrete, pixelgenaue Anweisungen — z.B.
   "Weg-Rampe braucht einen 4. Ton zwischen X und Y", "Heldenkopf 1 px breiter,
   Kapuzenschatten dunkler").
3. **Art-Agent** setzt die Anweisungen um (nur art/-Dateien), Selbstcheck grün.
Abbruch, wenn Gesamtnote ≥ 8 oder 3 Runden erreicht.

## 4. Abnahme

1. `bash tools/check_syntax.sh` und `node tools/smoke_test.mjs` grün.
2. Headless-Flusstests (`.tmp/check_main_slice1.mjs`, `check_victory_slice1.mjs`)
   laufen weiter grün (Begehbarkeit unverändert!) — falls sie wegen bewusster
   Map-Deko-Änderungen brechen, reparieren und dokumentieren.
3. Null Konsolen-Fehler im finalen Proof.
4. Juror-Gesamtnote ≥ 8 oder 3 dokumentierte Runden mit sichtbarem Fortschritt.
5. Vorher/Nachher-Screenshots in `.tmp/screenshots/` (s15_*).
