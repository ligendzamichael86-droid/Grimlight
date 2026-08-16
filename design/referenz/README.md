# design/referenz — REFERENZ-BOGEN (GP7-CH-1, P0.e)

**ABGEBILDETER STAND: Commit `63fa2a4` ("GP7-CH-1 Spec Rev 2 ...", 2026-08-16
07:55 +0000) — das ist der Art-Stand VOR Phase 1, also der VORHER-Zustand aller
Menschen- und Gegner-Grids.**

Erzeugt am 16.08.2026 mit `tools/figuren_bogen.mjs` (Spec `design/SPEC_GP7CH1.md`
E10 P0.c/P0.e, Review-Fixes M15/M16/m8). Diese Dateien sind **nicht wegwerfbar**:
`.tmp/` ist laut CLAUDE.md disposable, dieser Ordner ist es ausdruecklich nicht.
Ohne die Dateien hier startet Phase 1 nicht (Review M15).

## Warum der Stand exakt `63fa2a4` ist, obwohl der Arbeitsbaum P0.a bereits enthaelt

Zum Zeitpunkt des Laufs war P0.a (Split `sprites.js` -> `sprites_figuren.js` +
`sprites_tiles.js`, Fassade) im Arbeitsbaum, aber noch nicht committet. Der Split
ist **inhaltsneutral**, nachgerechnet gegen `git show 63fa2a4:game/js/art/sprites.js`:

| Groesse | sha256 | HEAD == Arbeitsbaum |
|---|---|---|
| `JSON(SPRITES)` | `3a11481861e434ffaa9c699eb5afc571c305cd964fee393cd0b841af7fbcdcdc` | ja |
| `Object.keys(SPRITES).join(',')` | `7b33fab8a2738539c6cadd2603a5419cb5752671c5254bafcee4433f34e7f702` | ja |
| `JSON(TILE_ART)` | `a8e7f380d6d44837fa564e15f07e28684ea275eabfdbee8721de07a7e0f1c532` | ja |
| `Object.keys(TILE_ART).join(',')` | `3ac4357d5f161d642de75fd0d6d18fac7607b4552e624f0db56d01e6cb810442` | ja |

`palette.js` ist gegenueber `63fa2a4` unveraendert (`git status`: nur
`sprites.js` modifiziert). Der Bogen zeigt also Pixel fuer Pixel den Art-Stand
des Commits `63fa2a4`.

## Inhalt (10 Dateien)

| Datei | Mass | Bytes | sha256 |
|---|---|---|---|
| `figuren_bogen_vorher_gras_1x.png` | 480x168 | 5.683 | `db365c4ff59d9a0e25c8a65d51582862e4457e03be86300d7bf0ac0680b2a9af` |
| `figuren_bogen_vorher_gras_6x.png` | 2880x1008 | 52.363 | `979853e34868bf4be0ed4dbcb30e78aae2199f124049945d49a39e46a39b3883` |
| `figuren_bogen_vorher_gras_squint.png` | 2880x1008 | 44.931 | `1061e37009793a12147a0bd5f9b41d512274760f07dc61e6f1ba4cc46a53ab62` |
| `figuren_bogen_vorher_lehm_1x.png` | 480x168 | 5.948 | `03ea500ea0fea8e976343d1ac189a4e4a46a7fc5878eb69a00b6b4c6c8094aad` |
| `figuren_bogen_vorher_lehm_6x.png` | 2880x1008 | 58.711 | `1900071e528cf4a00fd45187a924ecf4237923c8224002d18da5d95eade6c512` |
| `figuren_bogen_vorher_lehm_squint.png` | 2880x1008 | 50.891 | `0cdf42557cd5a41f74c418a8968d645e0f6da5fcabf39d98da50cb570f8608e2` |
| `figuren_bogen_vorher_weg_1x.png` | 480x168 | 5.538 | `533396f2c533cd63033983d5fe6d8290dfe0f24c7d40ee5bbe004e8e6b17d41e` |
| `figuren_bogen_vorher_weg_6x.png` | 2880x1008 | 47.335 | `d318db4ef6c8193b9d7e2cf85aba7c326e1c07f02112d468a6354dd0541cc70b` |
| `figuren_bogen_vorher_weg_squint.png` | 2880x1008 | 45.930 | `402037536137c95a65738ca8ab46102dbfccd4ec4e3250a07f8cb6cb5b29b355` |
| `figuren_bogen_vorher_legende.txt` | — | 4.532 | `498dc82987a77ca31a5ead70e2d645c7560afd11e0ffe6a2946f789fbb681ff1` |

Dieselben Hashes stehen in `figuren_bogen_vorher_legende.txt` (Abschnitt
DATEIEN), zusammen mit den sha256 der vier Art-Quelldateien (Abschnitt
PROVENIENZ). Achtung: der dort gelistete Hash der Legende selbst fehlt
naturgemaess — er steht nur hier.

## Anordnung (eingefroren — der NACHHER-Bogen muss sie exakt wiederholen)

- Zeile **H** = Held, 12 Zellen: `player_down_0..3`, `player_up_0..3`,
  `player_side_0..3`.
- Zeile **N** = NPCs, 15 Zellen: Bran / Hedda / Corm / Mile / Torwaechter,
  je `_0`, `_1`, `_talk`.
- Zeile **K** = Kontext, 5 Zellen: `skeleton_0`, `ghoul_0`, `hound_0`, `rust_0`,
  `warden_idle` (das sind alle fuenf Gegnertypen des Spiels, Landkarte C §3
  Vorab-Korrektur; der Warden/Graveward ist einer davon, kein sechster).
- Zelle 32x48 px (2x3 Kacheln), Figur horizontal zentriert, **gemeinsame
  Fusskante** 8 px ueber der Zellunterkante. Unter jeder Zeile ein 8 px hohes
  schwarzes Markenband mit der Zellmarke (H01.., N01.., K01..); die Zuordnung
  Marke -> Grid-Key steht in der Legende.
- Boeden (echte Kacheln, **gekachelt**, keine Flachfarbe):
  `gras` = `grass_g5_00` (Rec.601-L 49,9), `lehm` = `dorf_lehm_00` (72,8),
  `weg` = `path` (90,9) — die drei Sollwerte aus Spec E10 P0.c, vom Werkzeug bei
  jedem Lauf nachgerechnet und als `BODEN-CHECK OK` gemeldet.
- `1x` = native Aufloesung, `6x` = Nearest Neighbour x6, `squint` = 1x per
  Nearest Neighbour 50 % runter (Quelltexel 2x/2y) und wieder hoch, deckungs-
  gleich mit dem 6x-Bogen. Das Markenband wird im Squint-Bogen nachtraeglich neu
  gestempelt (Chrom, nicht Kunst).

## Reproduktion / NACHHER-Bogen

```
node tools/figuren_bogen.mjs --modus vorher  --out design/referenz     # dieser Lauf
node tools/figuren_bogen.mjs --modus nachher --out design/referenz     # nach Phase 1
```

Das Werkzeug ist deterministisch (kein Zufall, keine Zeit, keine Pfade im
Dateiinhalt): vier Laeufe, davon einer aus fremdem Arbeitsverzeichnis, ergaben
byte-gleiche Dateien (Node v20.19.2). Erfolgs-String im Log:
`FIGUREN-BOGEN FERTIG`.
