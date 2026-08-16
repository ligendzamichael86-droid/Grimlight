# design/referenz — REFERENZ-BOGEN (GP7-CH-1, P0.e)

**Stand: `63fa2a4`-Grids, Werkzeug-Rev 2.**

Der abgebildete Art-Stand ist der von Commit `63fa2a4` ("GP7-CH-1 Spec Rev 2 ...",
2026-08-16 07:55 +0000) — der Art-Stand VOR Phase 1, also der VORHER-Zustand
aller Menschen- und Gegner-Grids. Erzeugt am 16.08.2026 mit
`tools/figuren_bogen.mjs` (Spec `design/SPEC_GP7CH1.md` E9 Umfang + E10 P0.c/P0.e,
Review-Fixes M15/M16/m8, Nachfix-Befund R5). Diese Dateien sind **nicht
wegwerfbar**: `.tmp/` ist laut CLAUDE.md disposable, dieser Ordner ist es
ausdruecklich nicht. Ohne die Dateien hier startet Phase 1 nicht (Review M15).

## Neu in Werkzeug-Rev 2 (Nachfix R5)

Rev 1 fuehrte in der Held-Zeile nur die zwoelf Lauf-Frames und deckte damit
**27 der 35 Grids** ab, die Spec E9 fuer Phase 1a/1b in den Umfang nimmt
("1a HELD (17 player_-Grids + 3 sword_slash_-Grids — die Klinge gehoert zum
Helden; m6) -> 1b NPCs (15 npc_-Grids ...)"). Es fehlten acht Grids:
`player_attack_down/up/side`, `player_die_0/1`, `sword_slash_down/up/side`.
Rev 2 fuehrt sie und deckt damit **35 von 35** ab. Die Bogenmasse aendern sich
dadurch von 480x168 auf 544x224 (1x) bzw. von 2880x1008 auf 3264x1344 (6x/squint);
die alten Rev-1-Dateien sind ersetzt, nicht ergaenzt (gleiche Dateinamen).

Der **Art-Stand ist derselbe geblieben** — die vier Art-Quellen haben in Rev 2
byteweise dieselben sha256 wie im Rev-1-Lauf (Abschnitt PROVENIENZ der Legende).
Es hat sich also nur das Werkzeug geaendert, kein einziger Pixel der Vorlage.

## Warum der Stand exakt `63fa2a4` ist, obwohl HEAD inzwischen weiter ist

HEAD steht bei `e9dc217`, im Arbeitsbaum ist zum Zeitpunkt des Laufs nur
`tools/figuren_bogen.mjs` geaendert — an `game/js/art/*` nichts. Seit `63fa2a4`
lief P0.a (Split `sprites.js` -> `sprites_figuren.js` + `sprites_tiles.js`,
Fassade); der Split ist **inhaltsneutral**, nachgerechnet gegen
`git show 63fa2a4:game/js/art/sprites.js` und `...:game/js/art/palette.js`:

| Groesse | sha256 | `63fa2a4` == Arbeitsbaum |
|---|---|---|
| `JSON(SPRITES)` | `3a11481861e434ffaa9c699eb5afc571c305cd964fee393cd0b841af7fbcdcdc` | ja |
| `Object.keys(SPRITES).join(',')` | `7b33fab8a2738539c6cadd2603a5419cb5752671c5254bafcee4433f34e7f702` | ja |
| `JSON(TILE_ART)` | `a8e7f380d6d44837fa564e15f07e28684ea275eabfdbee8721de07a7e0f1c532` | ja |
| `Object.keys(TILE_ART).join(',')` | `3ac4357d5f161d642de75fd0d6d18fac7607b4552e624f0db56d01e6cb810442` | ja |
| `JSON(PALETTE)` | `c26f106ad905c252bd96ed02ff6a57104b3be17e261f07842cd96c803bfa15db` | ja |

Der Bogen zeigt also Pixel fuer Pixel den Art-Stand des Commits `63fa2a4`.

## Inhalt (10 Dateien)

| Datei | Mass | Bytes | sha256 |
|---|---|---|---|
| `figuren_bogen_vorher_gras_1x.png` | 544x224 | 7.491 | `742d80d76d677b9a6e2e4d37256a8fc98af9e0dafe5661dcd676ee4061a4898c` |
| `figuren_bogen_vorher_gras_6x.png` | 3264x1344 | 73.818 | `26fb550ca77755eff6252be60d27b1d5ccaa3311fe04306ad804a725f2c8a681` |
| `figuren_bogen_vorher_gras_squint.png` | 3264x1344 | 63.296 | `d0f28a9e7a18f1044c07cb61732183796f74c6b1fbc7248285d342f13b695b1f` |
| `figuren_bogen_vorher_lehm_1x.png` | 544x224 | 7.995 | `5f4004c8339a23d757b4c9c8124362286db309805a8d962851c1a9f6b05ce8b1` |
| `figuren_bogen_vorher_lehm_6x.png` | 3264x1344 | 83.834 | `7dc8034285f82ba7c2ba5b58842fc7c982b99175c22dd20141ce4e04e77132df` |
| `figuren_bogen_vorher_lehm_squint.png` | 3264x1344 | 72.485 | `395be5554325cc9b7f1b7bfceb448fd71503969629dd157a1a43c7ab6428bf3d` |
| `figuren_bogen_vorher_weg_1x.png` | 544x224 | 7.315 | `42728bbe514aae46dbd850fa1f192d3e534901208f9aafe3cae469e5930409ec` |
| `figuren_bogen_vorher_weg_6x.png` | 3264x1344 | 66.274 | `97bc78d746fe91c86ab8dd647c42a38f1516233ad45464e131c7bff0a1823080` |
| `figuren_bogen_vorher_weg_squint.png` | 3264x1344 | 64.762 | `262130f5d469fcdc65655d5c0e06bda8736a02ca8d7657d120f2e18950d2f4e0` |
| `figuren_bogen_vorher_legende.txt` | — | 5.857 | `9c0858d78a96130fd2d804835b6b2881cbb3166d77f1d873d3dca3bc31f185df` |

Dieselben Hashes stehen in `figuren_bogen_vorher_legende.txt` (Abschnitt
DATEIEN), zusammen mit den sha256 der vier Art-Quelldateien (Abschnitt
PROVENIENZ). Achtung: der dort gelistete Hash der Legende selbst fehlt
naturgemaess — er steht nur hier.

## Anordnung (eingefroren — der NACHHER-Bogen muss sie exakt wiederholen)

- Zeile **H** = Held, **17 Zellen**: je Richtung vier Lauf-Frames und
  unmittelbar dahinter der Attack-Frame derselben Richtung, danach die beiden
  richtungslosen Sterbe-Frames:
  `player_down_0..3`, `player_attack_down`, `player_up_0..3`,
  `player_attack_up`, `player_side_0..3`, `player_attack_side`,
  `player_die_0`, `player_die_1`.
- Zeile **S** = Schwerthieb, **Mini-Zeile mit 3 Zellen**: `sword_slash_down`,
  `sword_slash_up`, `sword_slash_side`. Die Klinge gehoert dem Helden
  (E9/m6), ist aber ein Effekt-Overlay und keine Figur — im Spiel wird sie auf
  der Schwert-Hitbox gezeichnet (`game/js/entities/player.js`), nicht
  fussgebunden. Im Bogen liegt sie wie alles andere auf der gemeinsamen
  Fusskante; das ist Chrom fuer den Vergleich, keine Aussage ueber den Anker.
- Zeile **N** = NPCs, 15 Zellen: Bran / Hedda / Corm / Mile / Torwaechter,
  je `_0`, `_1`, `_talk`.
- Zeile **K** = Kontext, 5 Zellen: `skeleton_0`, `ghoul_0`, `hound_0`, `rust_0`,
  `warden_idle` (das sind alle fuenf Gegnertypen des Spiels, Landkarte C §3
  Vorab-Korrektur; der Warden/Graveward ist einer davon, kein sechster).
  Die K-Zeile ist **Kontext, nicht Umfang**; `shield_*` gehoert dem Rostpanzer
  und ist CH-2 (Spec E9, deklariert).
- Umfang-Rechnung: H 17 + S 3 + N 15 = **35 Grids** = genau der Phase-1a/1b-Umfang
  aus Spec E9. Die 5 K-Zellen kommen als Kontext obendrauf (40 Zellen gesamt).
- Zelle 32x48 px (2x3 Kacheln), Figur horizontal zentriert, **gemeinsame
  Fusskante** 8 px ueber der Zellunterkante. Unter jeder Zeile ein 8 px hohes
  schwarzes Markenband mit der Zellmarke (H01..H17, S01..S03, N01..N15,
  K01..K05); die Zuordnung Marke -> Grid-Key steht in der Legende.
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
Dateiinhalt). Fuer Rev 2 nachgewiesen mit drei Laeufen — zwei in Wegwerf-
verzeichnisse (einer davon aus fremdem Arbeitsverzeichnis, `cd /`), einer nach
`design/referenz` —: alle zehn Dateien byte-gleich, `diff -r` ohne Ausgabe,
sha256 identisch (Node v20.19.2). Erfolgs-String im Log:
`FIGUREN-BOGEN FERTIG`.
