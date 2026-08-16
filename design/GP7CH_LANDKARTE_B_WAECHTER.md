# GP7-CH Landkarte Teil B: Test-Waechter-Sweep (16.08.2026, Opus-Analyst, konsolidiert)

Alle Befunde stammen aus Lese-Läufen (kein Schreibvorgang, kein Server). Ich habe die Suiten zusätzlich real ausgeführt, um Grün/Rot zu belegen.

---

## 0. Lauf-Status (gemessen, 16.08.)

| Suite | Ergebnis |
|---|---|
| `/home/coder/Grimlight/tools/smoke_test.mjs` | GRÜN |
| `/home/coder/Grimlight/tools/check_save_slice4.mjs` | GRÜN (63 Assertions) |
| `/home/coder/Grimlight/.tmp/check_main_slice1.mjs` | GRÜN (25) |
| `/home/coder/Grimlight/.tmp/check_inventory_slice2.mjs` | GRÜN (25) |
| `/home/coder/Grimlight/.tmp/check_engineB_gp6.mjs` | GRÜN |
| `/home/coder/Grimlight/.tmp/check_gfx6_art.mjs` | GRÜN |
| `/home/coder/Grimlight/.tmp/art_slice3_selfcheck.mjs` | GRÜN |
| `.tmp/check_gp6_art_self.mjs` | 5 ROT / 428 |
| `.tmp/check_art_gfx2.mjs` 211 ROT · `check_art_gfx3.mjs` 79 · `check_gfx4_art.mjs` 63 · `check_gfx5_art.mjs` 58 · `check_art_gp5_self.mjs` 58 · `check_art_gp5r2_self.mjs` 54 · `check_art.mjs`, `check_art_slice1.mjs`, `check_art_slice15.mjs`, `dev_art_slice2.mjs` | tot/abgelöst |

Charakter-Keys in `game/js/art/sprites.js`: 63 von 91 Keys. Maße: 16×24 (32 Keys: alle `player_*` + alle `npc_*` außer `npc_blase`), 16×16 (`skeleton_*`, `sword_slash_*`), 16×20 (`ghoul_*`), 16×12 (`hound_*`), 16×18 (`rust_*`), 24×32 (`warden_*`), 6×12 (`shield_side`), 12×6 (`shield_up/down`), 8×8 (`npc_blase`).

---

## 1. CANVAS-ERZEUGUNGS-REIHENFOLGE

Die Behauptung in `game/js/main.js:113-118` ist **belegt, aber unvollständig** — es sind **sechs** Rigs, nicht zwei.

**Der Anspruch selbst** — `/home/coder/Grimlight/game/js/main.js:113-116`:
> `// shield_side). Die Bestandsreihenfolge ist EINGEFROREN — check_main_slice1`
> `// und check_inventory_slice2 mappen Canvas→Sprite ueber die`
> `// Erzeugungsreihenfolge; ein Einschub davor macht beide Alt-Tests rot.`

**Das Mapping-Muster (identisch in allen Rigs):**

| Datei:Zeile | FLIP_LIST-Länge | Zitat |
|---|---|---|
| `/home/coder/Grimlight/.tmp/check_main_slice1.mjs:89-106` | **12** (endet `ghoul_die`) | `:100-104` `const orderedNames = [ ...Object.keys(SPRITES), ...FLIP_LIST.map((k) => \`${k}_flip\`), ...Object.keys(TILE_ART), ];` / `:106` `createdCanvases.forEach((c, i) => nameOf.set(c, orderedNames[i] || \`extra_${i}\`));` |
| `/home/coder/Grimlight/.tmp/check_inventory_slice2.mjs:137-151` | **22** (endet `shield_side`) | `:145-149` gleicher Wortlaut |
| `/home/coder/Grimlight/tools/check_save_slice4.mjs:106-117`, `:191-195` | **12** | `:194` `b.createdCanvases.forEach((c, i) => b.nameOf.set(c, ORDERED[i] || \`extra_${i}\`));`; Kommentar `:191-193`: „*die Zuordnung Canvas -> Sprite-Name entsteht deshalb pro Boot aus der Erzeugungsreihenfolge, wie in check_main_slice1*" |
| `/home/coder/Grimlight/tools/smoke_test.mjs:5521-5524`, `:5563` (S5-Audio-Boot) | **12** | `:5563` `benenne() { canvases.forEach((c, i) => b.nameOf.set(c, NAMEN[i] || \`extra_${i}\`)); }` |
| `/home/coder/Grimlight/tools/smoke_test.mjs:6393-6408`, `:6453` (S6-Dorf-Boot) | **38 (vollständig)** | `:6393-6395` `// Flip-Liste WOERTLICH aus main.js:106-127 — die Canvas->Sprite-Zuordnung` … `// Abweichen verschoebe alle Namen hinter dem SPRITES-Block.` |
| `/home/coder/Grimlight/.tmp/check_engineB_gp6.mjs:79-82` | **keine** (nur SPRITES) | `:79` `const boot = createdCanvases.length;` / `:80` `const orderedNames = [...Object.keys(SPRITES)];` |

Weitere Kopien desselben Musters (Sonden, keine Gates): `.tmp/probe_god.mjs:118-138` (31er-Liste), `.tmp/probe_s4_engine.mjs:190-204` (12er), `.tmp/debug_victory_trace.mjs:98-104`, `.tmp/debug_victory_nospawns.mjs:101-107`, `.tmp/debug_death.mjs:19-20`, `.tmp/debug_gold.mjs:17-18`, `.tmp/debug_main_trace.mjs:31-32`.

**Was ist hart verdrahtet?**

- **Kein einziger numerischer Index.** Der SPRITES-Block wird in *allen* Rigs **live** gelesen (`...Object.keys(SPRITES)`). Hart verdrahtet ist ausschließlich das **FLIP_LIST-Literal** (12 / 22 / 38 Einträge).
- **Ein** hart verdrahteter Zählwert existiert: `/home/coder/Grimlight/.tmp/check_gp6_art_self.mjs:58` `pruef(Object.keys(SPRITES).length === 75, ...)` — heute 91, also ROT.
- Der Zählwert in `tools/smoke_test.mjs:3643` ist *abgeleitet*, nicht fix: `nachTiles === Object.keys(SPRITES).length + 1 + Object.keys(TILE_ART).length`.

**Bruchanalyse:**

**(a) NEUER Sprite-Key in SPRITES (egal ob eingefügt oder angehängt): BRICHT NICHTS.**
`buildAll` iteriert `Object.keys(sprites)` (`game/js/core/sprite_factory.js:28-31`), und die Tests bauen `orderedNames` aus derselben Live-Liste. Canvas-Block und Namensblock wachsen synchron; der Flip-Block verschiebt sich in beiden gleichzeitig. Empirisch bestätigt: SPRITES ist seit der GP6-Landkarte („*nur die Indizes 0..74*", `design/GP6_LANDKARTE.md:975`) von 75 auf 91 Keys gewachsen, und `check_main_slice1` / `check_inventory_slice2` / `check_save_slice4` sind trotzdem grün.
*Ausnahme:* `.tmp/check_gp6_art_self.mjs:57-58` (bereits rot).

**(b) Key MITTEN in die Flip-Liste (`main.js:106-128`) statt angehängt: BRICHT.**
Ab der Einschubposition sind alle Flip-Namen um eins verschoben, und der letzte Flip-Canvas erbt den *ersten TILE_ART-Namen*. Konkret betroffen:
- `tools/smoke_test.mjs:6396-6408` (die einzige vollständige 38er-Liste) → das schärfste Gate ist `smoke_test.mjs:6612-6615`:
  `const GEGNER = /^(skeleton|ghoul|hound|rust|warden|shield)/;` … `check('S6-§7F(d) §6.1 nach buildWorld(DORF) zeichnet das Spiel NULL Gegner …', gegnerGesehen.length === 0, …)`.
  Ein NPC-Flip-Canvas, der durch Verschiebung den Namen `hound_0_flip` erbt, macht dieses Gate **falsch-rot**. Die Positivkontrolle `:6618-6621` (`npcGesehen.length >= 3`) kippt spiegelbildlich mit.
- `.tmp/check_inventory_slice2.mjs:137-144`: nur bei Einschub **vor Index 22**.
- `.tmp/check_main_slice1.mjs:89-95`, `tools/check_save_slice4.mjs:106-111`, `tools/smoke_test.mjs:5521-5523`: nur bei Einschub **vor Index 12** (danach sind ihre Namen ohnehin schon verschoben, werden aber von keiner Assertion gelesen).
- **Anhängen ans Ende ist für alle sechs Rigs folgenlos** — genau deshalb steht die Regel als Kommentar in `main.js:113-116` und `:119-125`.

**(c) Nur andere Maße bei bestehendem Grid: BRICHT DIE REIHENFOLGE NICHT.**
Die Canvas-Anzahl und -Ordnung hängen nicht von `grid.length`/`grid[0].length` ab. Die Leser sind zusätzlich maßagnostisch:
- `.tmp/check_main_slice1.mjs:136` `lastPlayer = { x: l.args[0] + l.img.width / 2, y: l.args[1] + l.img.height, … }` mit Begründung `:131-134` („*Sprite-größen-agnostisch*").
- Die Zeichner selbst ebenso: `game/js/entities/player.js:238-239`, `enemies.js:637-641` („*Größenagnostisch: horizontal auf die AABB zentriert, Füße = Unterkante*", `:635`), `npcs.js:209-212`, `boss.js:328-331`.
Reagierende Gates bei (c) siehe Punkt 6.

---

## 2. FLIP-LISTEN-REGEL (append-only)

**Testseitig ist die Regel NIRGENDS verankert.** Es gibt keinen Test, der
- die Flip-Liste aus `main.js` als Quelltext liest,
- ihre Länge prüft,
- oder ihre Reihenfolge gegen einen eingefrorenen Stand vergleicht.

Belege:
- Die einzigen Quelltext-Wächter auf `main.js` sind `tools/smoke_test.mjs:4725`, `:4908`, `:4938` — sie prüfen `resetRun`/`buildWorld`/Audio-Zusagen, nicht die Flip-Liste.
- Der einzige *flip-bezogene* Test ist eine reine **Existenzprüfung der Quell-Grids**, `tools/smoke_test.mjs:569-578`:
  > `// Flip-Liste aus main.js: für jeden Key muss das Quell-Grid existieren,`
  > `// sonst drawImage(undefined) im Browser.`
  > `const flipBases = [ 'player_side_0', … 'ghoul_die' ];`
  > `check('Alle Flip-Quell-Grids der main.js-Liste existieren', missingF.length === 0, missingF.join(','));`
  Diese Liste ist auf **12 Einträge** eingefroren und kennt weder `hound_*`, `rust_*`, `shield_side`, `warden_*` noch `npc_*`.

Die Regel existiert nur als **Kommentar/Doku**: `game/js/main.js:113-116` und `:119-125`; `tools/smoke_test.mjs:6393-6395`; `design/SPEC_SLICE_3.md:479` („*neue Flip-Keys werden AUSSCHLIESSLICH ans ENDE der*"); `design/SLICE6_PHASE2_NOTIZEN.md:27-28` („*Flip-Liste main.js:94-105: die npc_*-Keys ANS ENDE anhaengen*"); `design/SLICE6_LANDKARTE.md:73` („*Ein Einschub in der Mitte macht alle drei rot.*"); `design/GP6_LANDKARTE.md:1044-1058`; `uebergaben/2026-07-06_slice3_progression.md:43`.

Die einzige **maschinell geprüfte** Append-Only-Regel im Repo gilt für `TILE_ART`, nicht für Flips oder SPRITES — `/home/coder/Grimlight/.tmp/check_gp6_art_self.mjs:61-64`:
> `pruef(neuKeys.slice(0, altKeys.length).join(',') === altKeys.join(','), 'alle Bestands-TILE_ART-Keys in unveraenderter Reihenfolge vorn');`
> `pruef(neuKeys.slice(altKeys.length).join(',') === ANHANG.join(','), \`${ANHANG.length} neue Keys ausschliesslich am ENDE\`);`
(Diese Zeile ist eine der 5 Roten, s. Punkt 5.)

---

## 3. MASSE / AABB

### 3a. GRID-Maße (`sprites.js`) — GRÜNE Suiten

| Datei:Zeile | Keys | Zitat |
|---|---|---|
| `/home/coder/Grimlight/.tmp/check_gfx6_art.mjs:177-181` | `ghoul_0/1/die` | `if (g.length !== 20 \|\| g[0].length !== 16) bad(\`${k}: muss 16x20 sein\`);` |
| `/home/coder/Grimlight/.tmp/art_slice3_selfcheck.mjs:23-32` | 9× `warden_*` | `warden_idle: [24, 32], warden_walk_0: [24, 32], …` / `:31` `if (g[0].length !== w \|\| g.length !== h) bad(\`${name}: ${g[0].length}x${g.length}, erwartet ${w}x${h}\`);` |

Das ist **alles**. Für `player_*` (16×24), `skeleton_*` (16×16), `hound_*` (16×12), `rust_*` (16×18), `sword_slash_*`, `shield_*`, `npc_*` (16×24 / 8×8) gibt es in keiner grünen Suite ein Maß-Gate. Die `§7.G`-Maßtabellen laufen ausdrücklich nur über `TILE_ART`: `tools/smoke_test.mjs:1744-1771` (`for (const [name, grid] of Object.entries(TILE_ART))`, `:1763`) und `.tmp/check_gfx6_art.mjs:128-172`.

### 3b. GRID-Maße — TOTE Suiten (dokumentarisch)

| Datei:Zeile | Zitat |
|---|---|
| `.tmp/check_art_slice15.mjs:22-32` | `:24` `ok(grid.length === 24 && grid[0].length === 16, \`${name}: muss 16x24 sein…\`)` (player_) · `:27` `… === 20 … 16 … muss 16x20 …` (ghoul_) · `:30` `… === 16 && … === 16, \`${name}: muss 16x16 bleiben\`` (skeleton_) |
| `.tmp/check_art_slice15.mjs:9` | `const ALLOWED_H = new Set([8, 10, 16, 20, 24]);` — Höhen-Whitelist über **alle** SPRITES (24×32-Warden fällt heute durch) |
| `.tmp/dev_art_slice2.mjs:183-196` | `hound_0: [16, 12], … rust_0: [16, 18], … shield_side: [6, 12], shield_up: [12, 6], shield_down: [12, 6],` / `:194-196` `ok(g.length === hh && g[0].length === w, k + ': muss ' + w + 'x' + hh + ' sein…')` |
| `.tmp/check_gfx4_art.mjs:61-64`, `.tmp/check_gfx5_art.mjs:100-104` | ghoul 16×20 (Vorgänger von gfx6) |
| `.tmp/check_art_gfx2.mjs:104-111`, `.tmp/check_art_gfx3.mjs:118-125` | generischer Maß-Freeze **gegen einen Git-Stand**: `if (old[0].length !== src[0].length \|\| old.length !== src.length) bad(\`Maß geändert ${key}: …\`)` — trifft **jeden** Charakter-Key |
| `.tmp/check_art_slice1.mjs:58-67` | `checkSize(SPRITES[k], …, 16, 16)` für die Slice-1-Neuschlüssel inkl. `ghoul_*` |

### 3c. AABB/HITBOX-Maße

**Kein Test liest `player.js` / `enemies.js` / `npcs.js` / `boss.js` und assertiert deren `w`/`h`.** Alle Fundstellen sind **hartkodierte Literale in Begehbarkeits-Rechnungen** — eine Änderung der Quell-Hitbox macht sie nicht rot, sie messen dann nur an der falschen Box weiter:

- `/home/coder/Grimlight/tools/smoke_test.mjs:1579-1585`: `// Die vier Add-Anker der BOSS_KAMMER sind begehbar (Skelett-AABB 12x14).` … `bm.rectCollides({ x: a.x - 6, y: a.y - 7, w: 12, h: 14 })`
- `/home/coder/Grimlight/.tmp/check_builderA_slice3.mjs:141-148`: `ok('BOSS_KAMMER: 4 Add-Anker begehbar', anchors.every((a) => !m.rectCollides(box(a, 12, 14))));`
- `/home/coder/Grimlight/.tmp/check_world.mjs:39-42`: `return !map.rectCollides({ x: s.x - 6, y: s.y - 7, w: 12, h: 14 });`
- `/home/coder/Grimlight/.tmp/check_world_slice1.mjs:74-82`: `// Spawns begehbar (Spieler-/Gegnermaß 12×14; Props 12×12; Truhe 16×14)` (Datei ist am HEAD tot, `design/SPEC_SLICE_6.md:182`)
- `/home/coder/Grimlight/.tmp/shot_gfx6.py:1990`: `const px = cx - 6, py = cy - 7;` mit Kommentar `// Hitbox 12x14`

**Die einzige Stelle, die GRID- und AABB-Maß GEMEINSAM verrechnet** — `/home/coder/Grimlight/tools/smoke_test.mjs:3336-3341`:
> `const KLASSEN = [`
> `  ['Spieler', 12, 14, 'player_down_0'], ['Skelett', 12, 14, 'skeleton_0'],`
> `  ['Ghul', 14, 14, 'ghoul_0'], ['Grufthund', 14, 12, 'hound_0'],`
> `  ['Rostpanzer', 14, 16, 'rust_0'], ['Boss Grabwaechter', 20, 24, 'warden_idle'],`
> `  ['Vase', 12, 12, 'vase'], ['Urne', 12, 12, 'urn'], ['Truhe', 16, 14, 'chest_closed'],`
> `];`

Die AABB-Zahlen sind Literale (Kommentar `:3324-3325`: „*Die Profil-Konstanten stehen hier WOERTLICH wie in main.js §4.3 (sie werden NICHT importiert …)*"), die Sprite-Maße kommen live aus `SPRITES[key]` (`:3346-3347` `const iw = g[0].length, ih = g.length;`). Quelle des Musters: `/home/coder/Grimlight/.tmp/gp6_shadow_coverage.mjs:17-30` (identische Tabelle, reine Lesemessung).

Zugehörige Doku-Anker: `game/js/entities/player.js:29`, `:56-57`; `enemies.js:72` (`...baseEnemy(spawn, 12, 14)`); `npcs.js:26` („*AABB wie der Spieler (player.js:56-57). Der Sprite ist 16x24 (§0.6)*"); `boss.js:48` („*ZENTRUM der 20x24-AABB*"), `boss.js:308` („*Sprite 24x32*").

---

## 4. TON-/PALETTEN-GATES auf CHARAKTEREN

### GRÜN und aktiv

1. **Palettenzeichen-Deckung über alle SPRITES** — `/home/coder/Grimlight/tools/smoke_test.mjs:81-93`:
   `if (ch !== '.' && !PALETTE[ch]) bad = \`${setName}.${name}: '${ch}'\`;` / `check('Sprites nutzen nur existierende Palettenfarben', bad === null, …)`
2. Dasselbe in `/home/coder/Grimlight/.tmp/check_gfx6_art.mjs:101-109`:
   `for (const c of row) if (c !== '.' && !(c in PALETTE)) bad(\`${label}: Zeichen '${c}' nicht in PALETTE (Zeile ${i})\`);` … `:109` `for (const [n, g] of Object.entries(SPRITES)) checkGrid('S:' + n, g);`
3. **Erzwungener Ton am Ghul** — `/home/coder/Grimlight/.tmp/check_gfx6_art.mjs:182`:
   `if (SPRITES.ghoul_0 && !SPRITES.ghoul_0.some((r) => r.includes('C'))) bad('ghoul_0: kuehler Rim C fehlt');`
   (`'C'` ist gleichzeitig für Back-Kronen **verboten**, `:640-644` — Charakter-Ausnahme im Kommentar `check_gfx5_art.mjs:118-122` festgehalten.)
4. **Hex-Freeze der Palette** (wirkt auf Charaktere indirekt) — `.tmp/check_gfx6_art.mjs:53-79` (`NEW_TONES`, 10 Offset-Töne), `:58` `if ('l' in PALETTE) bad("'l' in PALETTE verboten");`
5. Harter Wurf zur Laufzeit statt Test: `game/js/core/sprite_factory.js:17-19` `throw new Error(\`buildSprite: unbekannter Palettenschlüssel '${ch}' bei (${x},${y})\`)`.

### ROT / abgelöst, aber inhaltlich einschlägig

6. **Ton-Waisen am Grufthund** — `/home/coder/Grimlight/.tmp/check_art_gp5_self.mjs:155-163`:
   `// 8) §1.6 Ton-Waisen.` … `for (const k of ['hound_0', 'hound_1', 'hound_telegraph', 'hound_leap', 'hound_down']) { const flat = SPRITES[k].join(''); if (!flat.includes('R') \|\| !flat.includes('r')) bad(\`${k}: Auge ohne r-Hoehle + R-Pupille\`); }`
7. **Ton-ZENSUS am Warden (Rostrampe 4/5/6, gewichtete Texelzählung, spaltenweise)** — `.tmp/check_art_gp5_self.mjs:226-237`:
   `const c = g[y][x]; if (c === '6') s += 3; else if (c === '5') s += 2; else if (c === '4') s += 1;` / `if (!(score(0, 6) > score(17, 23))) bad(\`${k}: linke Rostschiene nicht heller als rechte\`);`
   (Die Spaltengrenzen `0..6` / `17..23` sind an das 24-px-Warden-Grid genagelt.)
8. **Verbotene Töne in Gegner-Fußzeilen** — `.tmp/check_art_gfx3.mjs:138-148`:
   `const shadowChars = new Set(['0', 'n', 'z']);` / `for (const key of ['skeleton_0','skeleton_1','ghoul_0','ghoul_1','hound_0','hound_1','rust_0','rust_1'])` … `if (shadowChars.has(c)) { bad(\`${key}: Kontaktschatten '${c}' noch in Fußzeile ${li}\`); break; }`
9. **Byte-Freeze ganzer Charakter-Grids** (= implizite Ton-Anzahl-Fixierung):
   - `.tmp/check_art_gfx2.mjs:91-101`: `const TABU_PREFIX = /^(player_|warden_|sword_|shield_|boomerang_|item_|icon_|heart_|coin_|sparkle_|fog_|elite_glow|levelup_|block_spark|prop_break_|torch_|fringe_|moss_fringe_)/;` … `if (old[i] !== src[i]) bad(\`TABU ${key}: Zeile ${i} geändert\`);`
   - `.tmp/check_art_gfx3.mjs:105`: dieselbe Regex **ohne** `player_|warden_` (Kommentar `:104`: „*player_ ist seit §8c.1 GEÖFFNET (nur Pixel; Maße bleiben via §6 eingefroren).*")
   - `.tmp/dev_art_slice2.mjs:13-38`: SHA-256-Kurzhashes je Grid, u.a. `"player_down_0": "59c9224580351342"`, `"skeleton_0": "ae3f4a67f0e94da9"`, `"ghoul_0": "7f8b90fac1b70183"`, `"sword_slash_side": "7e8211c517974aa8"`
   - `.tmp/check_gp6_art_self.mjs:57`: `pruef(JSON.stringify(SPRITES) === JSON.stringify(S_ALT), 'SPRITES byte-unveraendert …')` gegen `.tmp/sprites_gp6_backup.js`
10. **Frame-Ungleichheit** (kein Ton-, aber Pixel-Gate) — `.tmp/check_art_slice1.mjs:76-83` `if (frames[a].join('\n') === frames[b].join('\n')) err(\`player_${dir}_${a} identisch mit _${b}\`)`; `.tmp/check_art.mjs:57-64`.

### GLANZ_RGB / Zensus (Python)

`GLANZ_RGB` betrifft **ausschließlich Wasser-Specular**, keine Charaktere: `.tmp/shot_gfx4.py:49` `(0x3f,0x7a,0x70)`, `.tmp/shot_gfx5.py:1107` `(0x34,0x53,0x58)`, `.tmp/shot_gfx6.py:290-304` `GLANZ_RGB = (0x56, 0x75, 0x7A)` mit `assert NEUE_TOENE.get("=") == GLANZ_RGB`. `.tmp/g6r1_art_zensus.py:1` ist ebenfalls Tile-Zensus.

**Charakter-Tonmessung findet in Python nur als Bild-Messung statt** (nicht als Grid-Zensus) — `/home/coder/Grimlight/.tmp/shot_gfx6.py:1914-2100`, `:2205-2260`:
- `:1918-1921` `for (const k of ['player_down_0', 'skeleton_0']) g[k] = S.SPRITES[k];`
- `:2052-2061` `silhouette_werte()` misst `mittel_L`, `warm_r_minus_b`, `ausgebrannt` **innerhalb der Grid-Silhouette**
- Schwellen: `:206-209` `M3_DWARM_MIN = 18.0`, `M3_HALB_MIN = 6.0`, `M3_HALB_NOTINT_MAX = 2.0`, `M3_AUSBRENNEN_L = 240`
- Nachrechnung derselben Größe rein aus Grid+PALETTE: `/home/coder/Grimlight/.tmp/gp6_pruef_sprite_licht.mjs:10-24` (`player_down_0`, `player_side_0`, `skeleton_0`, `skeleton_1`, `ghoul_0` — Eigen-L-Differenz linke/rechte Hälfte).

---

## 5. `check_gp6_art_self.mjs` — Status

**Was es prüft:** 428 Prüfungen über `PALETTE`, `SPRITES`, `TILE_ART` gegen den Backup-Stand `.tmp/sprites_gp6_backup.js`. Abschnitte A) Palette (Offset-Töne, 61 alnum, Luminanz-Ordnung), B) Grids (Zeichenvorrat + Maße), C) Reihenfolge-Wächter, D) Wiesenlicht, E) Back-Kronen-Rim, F) Wasser, G) Kanal-Uferring, H) Ufer, I) Gras-Größen, J) Flammen, K) Boss-Kratzer, L) Wegsporn, M) Kronen-Schatten, N) XL-Kronen. Charakter-Sprites berührt es nur über zwei Zeilen (`:53-58`) — Zeichenvorrat + Byte-Freeze.

**Die 5 Roten (soeben verifiziert, `5 ROT von 428 Pruefungen`):**

1. `:57` — `pruef(JSON.stringify(SPRITES) === JSON.stringify(S_ALT), 'SPRITES byte-unveraendert (kein neuer/veraenderter Sprite-Key)')`
2. `:58` — `pruef(Object.keys(SPRITES).length === 75, \`SPRITES-Indizes 0..74 unveraendert (${Object.keys(SPRITES).length})\`)` → ist **91**
3. `:64` — `pruef(neuKeys.slice(altKeys.length).join(',') === ANHANG.join(','), \`${ANHANG.length} neue Keys ausschliesslich am ENDE\`)` (TILE_ART-Anhang gegen `.tmp/gp6_art_anhang.json`)
4. `:340` — `pruef(dek.every((c) => 'Lk'.includes(c)), \`Kratzerpixel ausschliesslich L/k-Dither (…)\`)` → gemessen `LkD`
5. `:341` — `pruef(new Set(dek).size === 2, 'Kratzer ist ein echter Dither (beide Toene vorhanden)')`

(1) und (2) sind die **direkte Folge des Charakter-Sprite-Zuwachses** (NPCs in Slice 6). (4)/(5) betreffen `floor_decal_crack` (Tile), (3) den Dorf-Tile-Anhang.

**Beleg für „abgelöst":** `/home/coder/Grimlight/design/SLICE6_PHASE2_NOTIZEN.md:55-59`, wörtlich:
> `10. .tmp/check_gp6_art_self.mjs: 5 ROT von 428 (HEAD hatte 3; neu:`
> `    "SPRITES byte-unveraendert" + Folge) — GP6-Selbstpruefer, durch`
> `    legitimen Sprite-Zuwachs abgeloest; als abgeloest DEKLARIEREN,`
> `    nicht reparieren. Ebenso .tmp/check_world_slice1 weiterhin tot`
> `    (Dorf-Zeilen 44 Zeichen gegen 40er-Annahme — Alt-Sonde).`

Flankierende Belege zum Ablöse-Verfahren: `design/SLICE6_SPEC_REVIEW.md:39` („*oder die Suite als abgelöst deklarieren, mit Beleg wie bei check_gfx5_art*"), `:101` („*liegen in `.tmp` und sind abgelöst*"); `design/SLICE6_LANDKARTE.md:406`, `:719`; `design/SPEC_SLICE_6.md:182` („*Deklariert: .tmp/check_world_slice1 ist am HEAD BEREITS ROT (toter Waechter, nicht "reparieren"!)*"); `uebergaben/2026-08-13_grafikpass6.md:44` („*check_gfx6_art ersetzt check_gfx5_art*"); `design/SLICE6_PHASE0.md:223-225`.

---

## 6. Reiner PIXEL-UMBAU vs. zusätzlicher MASS-Wechsel

### A) PIXEL-UMBAU (gleiche Keys, gleiche Maße, andere Zeichen)

**GRÜNE Suiten, die kippen können:**

1. `/home/coder/Grimlight/tools/smoke_test.mjs:3336-3372` — M5-Kontaktschatten. Zählt Schatten-Texel, die **nicht** von der Sprite-Silhouette verdeckt werden; hängt Zeichen-für-Zeichen an den untersten Grid-Zeilen. Gate `:3369-3372`: `if (n < 8 …)`. Ist-Marge (soeben gerechnet): Spieler 11, Skelett 11, Ghul 13, Hund 13, Rost 13, Warden 18 — **3 bis 10 Texel Luft**. Breitere/tiefere Füße drücken den Wert.
2. `/home/coder/Grimlight/tools/smoke_test.mjs:3375-3392` — die Negativ-Kontrolle `check('… OHNE die dy=-1-Zeile faellt das Messziel durch …', ohne.some((n) => n < 8), …)`. Sie verlangt, dass **mindestens eine** Klasse ohne die -1-Zeile durchfällt — ein Umbau, der alle Silhouetten schlanker macht, macht diese Kontrolle rot.
3. `/home/coder/Grimlight/tools/smoke_test.mjs:81-93` und `.tmp/check_gfx6_art.mjs:101-109` — nur bei Verwendung eines Zeichens außerhalb `PALETTE`.
4. `/home/coder/Grimlight/.tmp/check_gfx6_art.mjs:182` — `ghoul_0` verliert `'C'` → rot.
5. `game/js/core/sprite_factory.js:17-19` — harter Wurf beim Boot; würde jedes Boot-Rig (`check_main_slice1`, `check_inventory_slice2`, `check_save_slice4`, smoke S5/S6) mit Exception töten.

**Python-Proof-Suite:**

6. `/home/coder/Grimlight/.tmp/shot_gfx6.py:2205-2266` (M3) — `dWarm >= 18.0`, `Tint-Anteil NAH >= 6.0 L`, `ausgebrannt == 0` über `player_down_0` und `skeleton_0`. Die Größen sind Mittelwerte über die Silhouette; jede Ton-Umverteilung verschiebt sie. Warnung im Repo dokumentiert: `design/GP6_SPEC_REVIEW.md:216` („*misst die Kontrolle 8,6 L Eigen-Differenz aus der Kunst und ist rot, ohne dass der Renderer etwas falsch macht*").
7. `/home/coder/Grimlight/.tmp/shot_gfx6.py:2528-2560` (M4) — Kronen-Verdeckung über die `player_down_0`-Silhouette, Kopf-Fenster `KRONEN_HEAD_ROWS_GP6 = 16` (`:213`).

**Bereits ROTE Suiten, die zusätzlich anschlagen:** `.tmp/check_art_gfx2.mjs:91-101` (TABU byte-identisch: `player_`, `warden_`, `sword_`, `shield_`), `.tmp/check_art_gfx3.mjs:105`, `:140-148`, `.tmp/dev_art_slice2.mjs:13-38`, `.tmp/check_art_gp5_self.mjs:159-161`, `:227-236`, `.tmp/check_gp6_art_self.mjs:57`, `.tmp/check_art.mjs:57-64`, `.tmp/check_art_slice1.mjs:76-83`.

**Unberührt** von reinem Pixel-Umbau: alle Canvas-Reihenfolge-Rigs (Punkt 1), `check_engineB_gp6.mjs`, `check_save_slice4.mjs`, `smoke_test.mjs:6612-6621`.

### B) ZUSÄTZLICH bei MASS-WECHSEL (16×24 → 20×28)

Alles aus (A) **plus**:

8. `/home/coder/Grimlight/tools/smoke_test.mjs:3346-3363` — `sx = R(w / 2 - iw / 2), sy = R(h - ih)` und die Abbruchbedingung `if (y <= sy + ih - 1) continue;`. Bei 20×28 gegen AABB 12×14 verschiebt sich die Sprite-Ecke auf `sx = -4, sy = -14`; drei der vier Schattenzeilen fallen aus der Zählung, nur `dy = -1` zählt noch. Das Ergebnis bleibt rechnerisch bei 11, aber die Semantik der Prüfung („*JEDE Klasse hat >= 8 sichtbare Schatten-Texel*") und die Negativ-Kontrolle `:3388-3390` kippen in einen anderen Regimebereich — beides ist konstruktionsbedingt maßsensitiv.
9. `/home/coder/Grimlight/.tmp/art_slice3_selfcheck.mjs:23-32` — GRÜN, würde bei jeder Änderung an `warden_*` (24×32) sofort rot.
10. `/home/coder/Grimlight/.tmp/check_gfx6_art.mjs:180` — GRÜN, würde bei Änderung an `ghoul_*` (16×20) sofort rot.
11. `/home/coder/Grimlight/.tmp/shot_gfx6.py:2106-2107` — `x0, x1 = cx - 8, cx + 8` / `y0, y1 = cy + 7 - 24, cy + 7`; hartkodierte 16×24-Sprite-Box für die FERN-Standortwahl (Begründung `:2100-2104`). Ein 20×28-Sprite ragt über diese Box hinaus → die „kegelfreie" Auswahl ist falsch, M3-Negativkontrolle wird unzuverlässig.
12. `/home/coder/Grimlight/.tmp/shot_gfx6.py:213` — `KRONEN_HEAD_ROWS_GP6 = 16` bleibt fix; bei 28 Zeilen Höhe misst das „Kopf-Fenster" plötzlich 57 % statt 67 % der Figur.
13. `/home/coder/Grimlight/.tmp/gp6_probe_playershadow.py:16` — `print('Sprite-Box intern: x 152..167, y 75..98   (16x24)')` (Sonde).
14. Rote Bestandswächter mit Maßbezug: `.tmp/check_art_slice15.mjs:9`, `:24`, `:27`, `:30`; `.tmp/dev_art_slice2.mjs:183-196`; `.tmp/check_art_gfx2.mjs:104-111`; `.tmp/check_art_gfx3.mjs:118-125`; `.tmp/check_art_gp5_self.mjs:229-236` (Spaltenindizes 0..6 / 17..23).

**Weiterhin NICHT betroffen:** die Canvas→Sprite-Zuordnung (Punkt 1c), die Zeichner (`player.js:238-239`, `enemies.js:637-641`, `npcs.js:209-212`, `boss.js:328-331`), die Positionsleser der Flusstests (`check_main_slice1.mjs:136`, `check_inventory_slice2.mjs:178-181`), und `smoke_test.mjs:3638-3641` (Maskenmaß wird live gegen `SPRITES.player_down_0` verglichen: `maske.width === SPRITES.player_down_0[0].length && maske.height === SPRITES.player_down_0.length`).

---

## 7. GATES AUF GRID-WOHLGEFORMTHEIT

### Zeilen gleich lang

- **GRÜN:** `/home/coder/Grimlight/.tmp/check_gfx6_art.mjs:102-109` — `if (row.length !== w) bad(\`${label}: Zeile ${i} Breite ${row.length} != ${w}\`);`, angewandt auf SPRITES **und** TILE_ART.
- **GRÜN:** `/home/coder/Grimlight/.tmp/art_slice3_selfcheck.mjs:10-20` — `if (row.length !== w) bad(\`${label}: Zeile ${i} Breite ${row.length} != ${w}\`);` / `:19` `for (const [name, grid] of Object.entries(SPRITES)) checkGrid('SPRITE ' + name, grid);`
- ROT/abgelöst: `.tmp/check_art_gfx2.mjs:15-24`, `.tmp/check_gfx5_art.mjs:60-68`, `.tmp/check_gfx4_art.mjs`, `.tmp/check_art.mjs:33-47`, `.tmp/check_art_slice1.mjs:13-30`, `.tmp/check_art_slice15.mjs:14-17`, `.tmp/check_gp6_art_self.mjs:52-55`.
- **`tools/smoke_test.mjs` hat KEINEN Zeilenlängen-Check für SPRITES** — `:1766` (`for (const row of grid) if (row.length !== wantW) …`) läuft nur über `TILE_ART`.

### Nur bekannte Palettenzeichen

- **GRÜN:** `tools/smoke_test.mjs:81-93` und `.tmp/check_gfx6_art.mjs:106`, `.tmp/art_slice3_selfcheck.mjs:14-16` (jeweils `c !== '.' && !(c in PALETTE)` → Fehler).
- **Laufzeit-Gate:** `game/js/core/sprite_factory.js:17-19` und `:88-90` (`buildTintMask`).
- Zusätzlich Palettenschlüssel-Formprüfung: `.tmp/check_art.mjs:27-31` (`/^[A-Za-z0-9]$/`, `/^#[0-9a-f]{6}$/i`), `.tmp/check_gp6_art_self.mjs:24-28` (`alnum.length === 61`, `sym.join('') === '=+*'`).

### Zeilenzahl

- **Für SPRITES gibt es KEIN generisches Zeilenzahl-Gate in einer grünen Suite.** Nur die zwei Einzelfälle aus 3a (`ghoul_*` 20 Zeilen via `check_gfx6_art.mjs:180`; `warden_*` 32 Zeilen via `art_slice3_selfcheck.mjs:31`).
- Für TILE_ART dagegen vollständig: `tools/smoke_test.mjs:1744-1771` und `.tmp/check_gfx6_art.mjs:128-172` (Maßtabelle `{16x16, 32x32, 48x32, 64x48, 64x32}` inkl. Gegen-Gate „*alle fuenf Klassen sind wirklich belegt*", `smoke_test.mjs:1775-1777`).
- Ehemals generisch für SPRITES, heute rot: `.tmp/check_art_slice15.mjs:9,13` (`ALLOWED_H = new Set([8, 10, 16, 20, 24])`), `.tmp/check_gp6_art_self.mjs:43-50` (Maßtabelle, aber nur über `TILE_ART`), `.tmp/check_art.mjs:35` (`if (grid.length !== h) errors.push(…)`).

### Sonstige Formgates auf Charaktergrids

- Mindest-Deckung: `.tmp/dev_art_slice2.mjs:198-205` — `ok(solid >= min, k + ': nur ' + solid + ' deckende Pixel …')` für `hound_*`, `rust_*`, `shield_*` (ROT).
- Frame-Ungleichheit: `tools/smoke_test.mjs:565-568` (`4-Frame-Laufzyklen vollständig (_0.._3 je Richtung)` — nur Existenz, kein Pixelvergleich), `.tmp/check_art_slice1.mjs:76-83` und `.tmp/check_art.mjs:57-64` (Pixelvergleich, beide ROT).
