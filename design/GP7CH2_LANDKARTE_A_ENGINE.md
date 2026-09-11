# GP7-CH-2 Landkarte Teil A: Gegner-Bestand + Engine-Bindungen (11.09.2026, Opus-Analyst)

## GP7-CH-2 BESTANDS-/ENGINE-ANALYSE — Rohdaten-Report (HEAD 3853dda, 11.09.2026)

Sonden liegen in `/home/coder/Grimlight/.tmp/gp7ch2_probe/` (`gegner_messung.mjs`, `gegner_teil2.mjs`, `m5_marge.mjs`, `palette_zensus.mjs`). Kein Server, keine Spieldatei, kein Testlauf berührt. Alle Zahlen nachgerechnet.

---

# 1. GEGNER-ART-INVENTAR (IST)

## 1.1 Maße, Grids, Massen, Töne

| Figur | Basis (Maß) | Grids | opak ges. | Töne | Körper-L (E5) | Körper-L (Lesart Landkarte C, ohne k/n) | Rimtöne |
|---|---|---|---|---|---|---|---|
| Skelett | `skeleton_0` 16×16 | 3 | 319 | **4** | **162,5** | **194,4** | – |
| Ghul | `ghoul_0` 16×20 | 3 | 458 | 6 | 96,0 | 101,4 | C |
| Grufthund | `hound_0` 16×12 | 6 | 582 | 9 | 75,4 | 78,6 | – |
| Rostpanzer | `rust_0` 16×18 | 3 | 422 | 9 | 112,7 | 135,9 | – |
| Warden | `warden_idle` 24×32 | 9 | 4064 | **19** | 139,5 | 148,0 | C |
| Schild (gehört Rost, E9: CH-2) | `shield_side` 6×12 | 3 | 187 | 5 | 89,3 | 89,3 | – |

27 Gegner-Keys von 91 SPRITES-Keys. TILE_ART 344.

**Körper-L hat zwei Lesarten und sie liegen beim Skelett 32 L auseinander** (E5 zieht die Kontur ab; das Skelett ist zu 49 % Kontur). SPEC E5 ist bindend → 162,5. Landkarte C (193,7) ist die *ohne-k*-Lesart. Das muss die Spec von CH-2 explizit festnageln, sonst zielt der Zeichner auf die falsche Zahl (Beleg: `.tmp/gp7ch_p0/figuren_messung.mjs` Sektion 5 rechnet E5).

## 1.2 Gate-Kennzahlen je Grid (E5-Formeln)

| Key | Umriss % (geom.) | Schwarz k+n % | Rim % d. Kontur | Spiegel % | Solitär % | Rahmen % |
|---|---|---|---|---|---|---|
| skeleton_0 / _1 | **49,3** | 37,3 | 0 | **95,5** | 19,1 / 23,5 | 52,3 |
| skeleton_die | 51,0 | 52,9 | 0 | 96,1 | 32,0 | 19,9 |
| ghoul_0 / _1 | 34,5 / 35,5 | 37,9 | 12,9 / 12,5 | 86,7 / 87,7 | 6,8 / 6,1 | 63,4 |
| hound_0 / _1 | 42,3 / 43,9 | 40,5 | 0 | 92,8 / 92,5 | 23,4 / 28,3 | 57,8 |
| hound_telegraph/leap/down/die | 37,7 / 40,4 / 44,0 / 43,0 | 41,5 / 46,2 / 49,3 / 44,3 | 0 | 81,1 / **73,1** / 90,7 / 86,1 | 24,2 / 19,4 / 33,3 / 17,8 | – |
| rust_0 / _1 | 34,8 / 36,5 | 44,9 | 0 | 92,1 | **30,2 / 31,0** | 61,8 |
| warden_idle | **19,7** | 24,2 | 12,5 | 94,7 | 17,0 | 68,8 |
| warden_dash | 24,1 | 21,1 | 4,8 | **63,1** | 15,9 | – |
| shield_side/up/down | 40,6 | 40,6 | 0 | **100 / 98,3 / 100** | 5,3 / 0 | 88,9 |

**Korrekturen zu Landkarte C §1:** die dort genannten Spiegelgleichheits-Werte (Ghul 40 %, Warden 52 %, Skelett 80 %) sind mit der E5-Formel (BBox-Mittelachse der opaken Texel) **nicht reproduzierbar** — gemessen: Ghul 86,7, Warden 94,7 (idle), Skelett 95,5. Die Rangfolge dreht sich damit um. **Das Skelett ist die symmetrischste Figur des ganzen Spiels, nicht die drittsymmetrischste.** Wer die C-Zahlen als Vorher-Anker einfriert, friert falsche Anker ein (dieselbe Falle wie G-H in CH-1).

Solitär-Werte: Landkarte C nannte „Rostpanzer 35,3 %". E5-Lesart ohne Merkmal-Abzug: **30,2 %** (rust_0). Bleibt der klare Ausreißer, aber die Zahl stimmt nicht wörtlich.

## 1.3 Rampen und Tonstufen

```
Skelett    k(18,3) < B(139,3) < b(203,3) < N(232,9)   Schritte 121,0 / 64,0 / 29,6
           b traegt 148 von 192 Nicht-Schwarz-Texeln = 77,1 %   Hue 91-95 durchgehend
Ghul       k < g(56,0) < C(83,5) < d(84,2) < H(172,0) < 3(199,2)  Luecke d->H = 87,8
Grufthund  k < z(43,9) < r(51,8) < p(60,6) < v(76,5) < R(84,4) < P(102,8) < V(133,8) < b(203,3)
           p+v+V+z+P = ERDRAMPE, 94 % der Farbmasse; V ist das Spitzlicht des Weges
Rostpanzer k < n < 4(57,1) < 5(90,3) < O(102,5) < 6(125,4) < B(139,3) < b(203,3) < N(232,9)
           Rost 4/5/6 (EXKLUSIV beim Torwaechter laut E6/M9!) + Knochen b/B/N/O gemischt
Warden     19 Toene, groesste Luecke 28,4 — reichste Figur; traegt u/U/X = HELDEN-Umhangrampe
```

**Zwei neue Rampen-Kollisionen, die E6 (Sperrliste) für die Gegner noch nicht kennt:**
1. **Rostpanzer führt 4/5/6** — genau die Rampe, die E3/M9 in CH-1 als **EXKLUSIV für den Torwächter** deklariert hat (Bran musste sie deshalb verlassen). Mensch und Gegner teilen sie heute.
2. **Warden führt u/U/X (158/142/113 Texel)** — die Umhangrampe des Helden.
3. Grufthund führt p/v/V/z/P = die Erdrampe des Weges inkl. dessen Spitzlicht V (Bestandsbefund, bestätigt).

## 1.4 Kontrast / E1-Fenster je Gegner je Karte

Wirkorte aus `maps.js:626-637` (GRAVEYARD 6 Skelette, 2 Hunde), `maps.js:686-707` (CATACOMBS 8 Skelette, 4 Ghule, 2 Hunde, 3 Rost), `map_fluestergruft.js:128-150` (5 Skelett + 3 Ghul + 2 Hund + 1 Rost + **4 Eliten**), `map_bosskammer.js:69-71` (Warden; **plus beschworene Skelett-Adds**, boss.js:135).

> **Korrektur zur Aufgabenstellung:** Skelette treten nicht nur in GRAVEYARD/CATACOMBS auf, sondern auch in der FLUESTERGRUFT **und in der BOSS_KAMMER** (Adds). Der Wirkort-Satz des Skeletts umfasst damit **alle vier Kampfkarten**.

Boden-Leitkacheln (Mittel-L über deckende Texel, wie P0.d):

| Karte | Klasse | n | L min..max |
|---|---|---|---|
| GRAVEYARD | GY-Gras | 113 | 46,9 .. 63,1 |
| GRAVEYARD | Weg | 6 | 90,6 .. 91,5 |
| CATACOMBS | Gruft-Stein | 12 | 37,3 .. 53,1 |
| FLUESTERGRUFT | Gruft-Stein | 11 | 37,3 .. 60,3 (water_v 60,3) |
| BOSS_KAMMER | Gruft-Stein | 8 | 44,9 .. 70,2 (floor_decal_bones 70,2) |

**E1-Fenster je Gegner je Karte (dL 25..90, Körper-L E5):**

| Gegner | Karte | Klasse | zulässiges Körper-L | IST | dL min..max | E1 |
|---|---|---|---|---|---|---|
| Skelett | GRAVEYARD | GY-Gras | 88,1..136,9 | 162,5 | 99,5..115,6 | **ROT** |
| Skelett | GRAVEYARD | Weg | 116,5..180,6 | 162,5 | 71,1..72,0 | OK |
| Skelett | CATACOMBS | Gruft-Stein | 78,1..127,3 | 162,5 | 109,4..125,2 | **ROT** |
| Skelett | FLUESTERGRUFT | Gruft-Stein | 85,3..127,3 | 162,5 | 102,3..125,2 | **ROT** |
| Skelett | BOSS_KAMMER | Gruft-Stein | 95,2..134,9 | 162,5 | 92,4..117,6 | **ROT** |
| Ghul | CATACOMBS | Gruft-Stein | 78,1..127,3 | 96,0 | 42,9..58,7 | OK |
| Ghul | FLUESTERGRUFT | Gruft-Stein | 85,3..127,3 | 96,0 | 35,8..58,7 | OK |
| Grufthund | GRAVEYARD | GY-Gras | 88,1..136,9 | 75,4 | 12,4..28,5 | **ROT** |
| Grufthund | GRAVEYARD | Weg | 116,5..180,6 | 75,4 | **−16,1..−15,2** | **ROT** |
| Grufthund | CATACOMBS | Gruft-Stein | 78,1..127,3 | 75,4 | 22,2..38,1 | **ROT** |
| Grufthund | FLUESTERGRUFT | Gruft-Stein | 85,3..127,3 | 75,4 | 15,2..38,1 | **ROT** |
| Rostpanzer | CATACOMBS/FLUESTERGRUFT | Gruft-Stein | 85,3..127,3 | 112,7 | 52,4..75,4 | OK |
| Warden | BOSS_KAMMER | Gruft-Stein | 95,2..134,9 | 139,5 | 69,3..94,5 | **ROT (Decke um 4,5)** |

**Schnittmenge über alle Karten eines Gegners (das eine Zielfenster):**

| Gegner | hellste Leitkachel | dunkelste | **FENSTER** | IST (E5) | Δ nötig |
|---|---|---|---|---|---|
| **Skelett** | path_v3 91,5 | crypt_stairs_down 37,3 | **116,5 .. 127,3** (nur 10,9 L breit) | 162,5 | **−35,2** |
| Ghul | water_v 60,3 | 37,3 | 85,3 .. 127,3 | 96,0 | im Fenster |
| **Grufthund** | path_v3 91,5 | 37,3 | **116,5 .. 127,3** | 75,4 | **+41,1** |
| Rostpanzer | water_v 60,3 | 37,3 | 85,3 .. 127,3 | 112,7 | im Fenster |
| Warden | floor_decal_bones 70,2 | stairs_up 44,9 | 95,2 .. 134,9 | 139,5 | **−4,5** |

**Die drei Sprengsätze, die daraus folgen:**

- **Das Skelett-Fenster ist 10,9 L breit.** Es wird unten vom **Weg** (91,5) und oben von der **Kryptatreppe** (37,3) eingeklemmt. Dass es überhaupt existiert, ist Zufall. Zielwert für die Kunst: ~120-124. Erreichbar mit der Knochenrampe O(102,5)/B(139,3) etwa hälftig, b(203,3) nur noch als Spitzlicht — exakt das Zielbild aus Landkarte C §2. **Rechnerisch bestätigt.**
- **Der Grufthund-Zielsatz ist in sich widersprüchlich.** Landkarte C fordert „Erdrampe verlassen, schwarz und kalt (n/u + kalter Rim)" — das macht ihn **dunkler** und treibt ihn **weiter aus dem Fenster** (er braucht +41). Nur die Alternative aus demselben Absatz („Knochen und Sehne") landet im Fenster. **Entscheidung muss vor CH-2 fallen**, sonst wiederholt sich G-A/G-J (Held/Torwächter: Gate unerreichbar → Ersatzpfad deklariert). Ohne Weg-Klasse schrumpft der Bedarf auf +12,7 — die Weg-Pflichtprüfung (E1/M17) ist also der Kostentreiber.
- **Der Warden reißt die Obergrenze um 4,5 L** — „nur nachziehen" bedeutet hier trotzdem eine Abdunklung oder eine Deklaration. Verursacher der Decke ist `stairs_up` (44,9), eine Randkachel.

`dE00`-Ersatzpfad (Ganzkörper, Minimum über die Kacheln der Klasse): Skelett 27,8 (Weg) bis 49,2 (Treppe); Grufthund **6,6 gegen den Weg** und 11,8 gegen Gras — der Hund fällt auch im Ersatzpfad durch. Ghul 19,2-23,5 (unter 25!), Rost 27,2, Warden 28,6. **Für den Ghul greift der Ersatzpfad nicht, er besteht nur über dL.**

## 1.5 Werkzeug-Lage: misst `figuren_messung.mjs` schon Gegner?

**Nein.** `.tmp/gp7ch_p0/figuren_messung.mjs:286-297` (`figurenVon`) kennt genau sechs Figuren: Held + 5 NPCs. Was fehlt:

1. **`figurenVon`**: Gruppen Skelett/Ghul/Grufthund/Rostpanzer/Warden (+Schild) mit `basis`, ohne `talk`.
2. **`REQUISITEN`** (`:308-323`): je Gegner die Requisitentöne (Rost-Schild `4/5/6`+`y`; Warden-Waffe; Hund-Auge `r/R`) — sonst fällt der Umrisston-Zähler falsch aus.
3. **`RIM_FALLBACK_KANDIDATEN`** (`:345`) enthält `Z/_/|` — **`C` fehlt**, und `C` ist der einzige heute existierende Gegner-Rim (Ghul, per Gate erzwungen). Ohne Nachzug misst das Werkzeug Ghul-Rim = 0.
4. **`WIRKORT`/`wirkortKlassen`** (`:587-601`): hängt an `DORF.npcSpawns` + `NPC_ID`. Gegner brauchen eine Wirkort-Tabelle aus `skeletonSpawns`/`ghoulSpawns`/`enemySpawns` **aller vier Kampfkarten** (Skelett = 4 Karten, s. o.).
5. **`rampeVon`** kennt die Gegner-Rampen (Knochen O/B/b/N, Erde z/p/v/P/V, Ghul-Grün d/H/3, Rost 4/5/6) teils schon aus dem Bestand — Selbsttest `rampenSelbsttest` muss neu laufen.
6. **Material-Tabelle**: es gibt **keine** für Gegner (`material_phase1b_merge.json` deckt nur Menschen). Ohne sie greifen G-C (Merkmal-Abzug) und G-N (dE00 auf der dominanten Materialfläche) nicht. Deliverable-Pflicht des Zeichners.
7. **Anker-Kontrolle**: die Vorher-Anker im `--vorher`-Modus sind Menschen-Anker. Für Gegner neu setzen — **und vorher die Landkarte-C-Zahlen gegenrechnen** (s. 1.2, sie stimmen nicht).
8. **`tools/figuren_bogen.mjs`**: rendert heute die sechs Menschen auf Gras/Lehm/Weg. Gegner brauchen **Gruft-Stein** als Boden (P0.c-Kachelsatz `grass_g5_00`/`dorf_lehm_00`/`path` erweitern um `stone_floor`).

---

# 2. FLASH STATT BLINK — ENGINE-BINDUNG

## 2.1 Die drei Blink-Stellen (exakt)

| Datei:Zeile | Code | Wirkung |
|---|---|---|
| `game/js/entities/enemies.js:620` | `if (e.hurtTimer > 0 && Math.floor(timeSec * 20) % 2 === 0) return false; // Blitzen` | 10-Hz-Blink über `HURT_FLASH = 0,2 s` (`:19`) → **6 von 12 Frames unsichtbar** |
| `game/js/entities/boss.js:323-324` | `if (e.state !== 'die' && e.hurtTimer > 0 && Math.floor(timeSec * 20) % 2 === 0) return true;` | identisch, Boss |
| `game/js/entities/player.js:228-231` | `if (player.state !== 'dead' && player.invulnTimer > 0 && Math.floor(timeSec * 12) % 2 === 0) return;` | 6-Hz-Blink über `INVULN_TIME = 1` (`:18`) → **30 von 60 Frames unsichtbar** |
| `enemies.js:621-624` | Grufthund-„Aufsteh-Blinken" letzte 0,3 s im `down` | 5 Hz → ~9 von 18 Frames. **Kein Treffer-Signal, sondern ein Verwundbarkeits-Telegraph.** Getrennt entscheiden — Vorschlag: bleibt. |

Messziel „0 Silhouetten-Verlust-Frames je Treffer" = heute 6 (Gegner) / 30 (Spieler).

## 2.2 `buildTintMask` als Weiß-Flash

`game/js/core/sprite_factory.js:68-97`. Mit `toneDunkel = toneHell = '#ffffff'` liefert sie ein Canvas mit **identischer Alpha-Form** des Grids in reinem Weiß. Kosten: **1 `drawImage`** je blitzende Entity und Frame, plus 1 Canvas je Sprite-Key. Der Präzedenzfall für die Dauer steht schon im Haus: `main.js:1659` / `:1618` setzen den Vollbild-Flash auf **2 Frames** (`flashFrames`), gezeichnet als `rgba(255,244,220,0.18)` in `main.js:2803-2806`, abschaltbar über `rigAus('__noFlash')`.

## 2.3 DER ENGINE-STOLPERSTEIN (neu gefunden, blockierend)

`.tmp/check_engineB_gp6.mjs` ist **GRÜN** und bewacht die Tint-Fassade scharf:

- `:114` `const istMaske = (img) => createdCanvases.indexOf(img) >= boot && img.width > 0 && img.width < 320;` — **jedes nach dem Boot erzeugte kleine Canvas gilt als „Maske"**.
- `:130-141` `'§0.5 Waechter B: JEDEM Masken-Draw geht das ORIGINAL-gfx-Canvas mit identischer Geometrie voraus'` — verlangt `org.alpha === 1` und identische `args`.
- `:145-148` `const ERL = new Set([0.12, 0.24, 0.36, 0.08, 0.16]); … masken.every(o => ERL.has(alpha))` — **ein Weiß-Flash mit Alpha 0,7 oder 1,0 macht diese Zeile ROT.**
- `:238-240` `'M3-Kontrolle: __noTint = true -> keine Masken-Draws mehr'` — bei `__noTint` darf **kein** Post-Boot-Canvas mehr gezeichnet werden; ein Flash würde auch das kippen.

**Konsequenz für den Bauweg:** die Flash-Canvases dürfen **nicht lazy** entstehen. Sie müssen **eager im Modulrumpf von `main.js`, NACH `const tiles = buildAll(TILE_ART, PALETTE)` (`main.js:130`)** gebaut werden. Dann gilt:
- sie liegen unterhalb von `boot` → `istMaske` false → Alpha-Whitelist, Paarungsregel und `__noTint`-Kontrolle greifen nicht;
- in allen sechs Canvas-Reihenfolge-Rigs landen sie **hinter** `TILE_ART` und bekommen den Namen `extra_N` (`check_main_slice1.mjs:106`, `check_inventory_slice2.mjs:151`, `check_save_slice4.mjs:194`, `smoke:5563`, `smoke:6453`, `check_engineB_gp6.mjs:82`) → **keine Namensverschiebung, kein Rig kippt**;
- das `GEGNER`-Gate `smoke:6612-6615` (`/^(skeleton|ghoul|hound|rust|warden|shield)/`) sieht `extra_N` und bleibt still.
- `smoke:3630-3646` (`§7F(j)` Maskenindex) ist ein **synthetischer Lokallauf**, kein echter Boot — unberührt.

Zeichenreihenfolge: **Original → Kalt-Maske → Warm-Maske → Flash.** Wird der Flash *vor* die Tint-Masken gezogen, läuft der Rückwärts-Scan in `check_engineB_gp6.mjs:132-139` auf den Flash als „Original" und prüft dessen Alpha → rot.

## 2.4 Bauweg + Sanktions-Bedarf

**Bauweg A (empfohlen, minimaler `entities/`-Eingriff):**
1. `main.js` nach Zeile 130: `const flash = {}` — für jeden Key aus `SPRITES`, der zu einer Figur gehört (`/^(player|skeleton|ghoul|hound|rust|warden|shield|npc)_/`), ein Weiß-Canvas via `buildTintMask(grid, PALETTE, '#fff', '#fff', 'L')`; für die 37 Flip-Keys die spiegelverkehrten Grids (Muster `MASK_REG`, `main.js:154-167`).
2. `main.js` `tintCfg` (`:265`) um `flash: 0` erweitern; `pushTinted` (`main.js:2710-2715`) setzt `flash = (ent.hurtTimer > 0 || ent.invulnTimer > 0) ? 1 : 0` — beide Felder sind an der Stelle sichtbar (`enemies.js:43`, `player.js:72`).
3. `tintDrawImage` (`main.js:216-248`): **ganz am Schluss**, nach dem Warm-Draw, `if (tintCfg.flash) { ctx.globalAlpha = 0.8 * vorA; ctx.drawImage(flashOf(img), ...a); ctx.globalAlpha = 1; }`. Blitzdauer über `Math.floor(timeSec*30)%2` oder besser über einen festen 2-Frame-Deckel.
4. **Ausnahme-Guard**: `sword_slash_*` und `npc_blase` dürfen nicht mitblitzen (sie laufen durch dieselbe Fassade).

**Sanktions-Bedarf (exakt):**

| Datei:Zeile | Eingriff | Warum unvermeidbar |
|---|---|---|
| `game/js/entities/enemies.js:620` | Blink-Zweig entfernen | §0.2 TABU (`design/SPEC_SLICE_6.md:44`: „player/enemies/boss/props/projectiles TABU") — **erste sanktionierte Öffnung von `entities/enemies.js` seit Slice 3** |
| `game/js/entities/boss.js:323-324` | dito | §0.2 TABU |
| `game/js/entities/player.js:228-231` | dito | §0.2 TABU |
| `game/js/main.js:130ff / 216-248 / 265 / 2710-2715` | Flash-Canvases + Fassade | main.js ist frei |
| `.tmp/check_engineB_gp6.mjs` | **nur falls lazy gebaut** — dann `:145-148` und `:238-240` namentlich sanktionieren | bei eager-nach-Tiles: **keine Sanktion nötig** |

Der `entities/`-Eingriff ist **dreimal genau eine Zeile mit einem `return`** — das ist die kleinstmögliche Öffnung und sollte in der Spec wörtlich so umrissen sein („NUR die drei `return`-Zeilen des Sichtbarkeits-Blinks; kein Timer, kein Zustand, keine Signatur").

## 2.5 „Spieldynamik bleibt" — Beweisplan

**Statischer Beweis (Quelltext):**
1. Alle drei Zeilen stehen ausschließlich im **Zeichner**. Rückgabewerte werden nirgends gelesen: `main.js:2748` `pushTinted(e, () => drawEnemy(...))` und `:2753` `pushTinted(player, () => player.draw(...))` verwerfen den Wert; `enemies.js:693` `drawEnemies` ebenso.
2. Kein Zeichner schreibt einen Zustand. `hurtTimer` wird nur in `enemies.js:453` dekrementiert und `:467` gesetzt; `invulnTimer` nur in `player.js:110/192`.
3. Die **Flanken-Beobachter** hängen an den Timern, nicht an der Sichtbarkeit: `main.js:1592-1608` (`AUDIO_HURT`, löst `sword_hit` + `HITSTOP_H/B` + Shake aus), `main.js:1655-1660` (`audioInvuln` → `player_hurt` + Shake + `flashFrames`). Beide unverändert.
4. **Kein Test zählt Unsichtbarkeitsframes.** Voll-Grep über `tools/smoke_test.mjs`, `tools/check_save_slice4.mjs`, `.tmp/check_main_slice1.mjs`, `.tmp/check_inventory_slice2.mjs`, `.tmp/check_boss_slice3.mjs`, `.tmp/check_engineB_gp6.mjs`: die einzigen Blink-Bezüge sind **zwei Kommentare** (`check_main_slice1.mjs:126`, `check_inventory_slice2.mjs:175`: „Spieler blinkt bei Unverwundbarkeit → letzten Wert cachen"). Der Cache wird durch den Flash nur **überflüssig**, nie falsch.

**Dynamischer Beweis (zu fahren):** `smoke_test`-Assertionszahl (825), `check_main 25`, `check_inventory 25`, `check_boss 33` unverändert; zusätzlich ein Positionsvergleich vor/nach über die drei Flusstests (`playerScreen()`/`skeletonsScreen()` liefern jetzt in *jedem* Frame Werte — die Positionsfolge muss auf den gemeinsamen Frames byte-gleich sein).

**Achtung `check_boss_slice3.mjs:253-255`:** zwischen `playerRef.hp = 0` und `ok(hasText('GAME OVER'))` liegt **genau ein Frame**. `main.js:2801` hält das wörtlich fest: „check_boss_slice3:255 hat null Frames Spielraum". Ein Flash darf deshalb **niemals** einen Hitstop anfassen — `smoke:5294-5300` prüft den Spieler-Schaden-Zweig per Quelltext-Regex gegen genau das (`!/hitstop/i.test(schadenBlock)`).

---

# 3. ZWEISTUFIGES STERBEN — ENGINE-BINDUNG

## 3.1 Was heute wann feuert

```
TICK T (Todes-Tick), enemies.js:481-497
  484  e.state = 'die'
  485  e.dieTimer = e.dieTime ?? DIE_TIME            (DIE_TIME = 0.4, enemies.js:20; Boss 1.0, boss.js:63)
  487  events.push('enemy_died')                     -> main.js:1703-1707 SFX 'enemy_die' + HITSTOP_K(3) + Shake(2)
  489-496 grantXp / recalcStats / 'level_up'
  [main.js:1611-1630] AUDIO_STATE-Flanke 'die'       -> main.js:1629 questKillBeobachter(e.kind) -> Quest-Zaehler
TICK T + 0,4 s (Boss 1,0 s), enemies.js:441-451
  446  if (e.deathEvent) events.push(e.deathEvent)   -> 'boss_died' -> main.js:2139-2155 Adds zerbroeseln,
                                                         6-10 Muenzen, Siegtruhe, runFlags.bossDead, Quest-Flanke
  447  spawnDeathDrops(...)                          -> enemies.js:219-245 Muenzen/Trank/Gear/Pity
  448  enemies.splice(i, 1)
```

**Alles Spielrelevante außer Drops und `boss_died` feuert bereits im Todes-Tick.** Die Sterbephase trägt nur zwei Dinge: Drops und das Boss-Nachspiel.

## 3.2 Warum „Stufe 1 = 0,2 s" die Dynamik ändert — und was stattdessen geht

Ein Vorziehen des `splice` auf 0,2 s zieht **Drops und `boss_died` um 0,2 s nach vorn**. Das kippt vier konkrete grüne Stellen:

| Anker | Was er festnagelt |
|---|---|
| `smoke:1417` | `'Boss-Sterbephase dauert ~1,0 s, dann boss_died'`, `diedAt >= 55 && diedAt <= 62` — **Fenster von 7 Frames** |
| `smoke:892-894`, `:938-939`, `:948-949` | `rust/sk.state='die'; dieTimer = 0.01;` → **ein** `tick(w)` muss den Drop erzeugen (Item-Drop, Pity 12, Pity-Inkrement) |
| `smoke:1429-1432` | zerbröselte Adds: `dieTimer = 0.4`, 30 Ticks → `w.enemies.length === 0` |
| `check_inventory_slice2.mjs:283-285` | Kommentar + Warteschleife „Drops spawnen erst nach der Sterbe-Animation (0,4 s)" |
| `smoke:206` | `'Skelett stirbt durch Schwert'` — `w.enemies.length === 0` nach dem Lauf |

**EMPFEHLUNG: `DIE_TIME` und den Splice-Zeitpunkt NICHT anfassen.**
- **Stufe 1** = die bestehenden 0,4 s (Boss 1,0 s), aber statt **einem** `*_die`-Bild ein **2-Frame-Zusammensacken** (`*_die_0` / `*_die_1`, Umschaltpunkt bei `dieTimer < DIE_TIME/2`). Rein im Zeichner → nur `enemies.js:618` + `boss.js:294`.
- **Stufe 2** = Decal, übergeben **exakt beim Splice**. Drops, XP, Events, Kill-Zähler, Hitstop: **byte-gleich zu heute**.

## 3.3 Bauweg Decal — vollständig in `main.js`, kein `entities/`-Eingriff

`enemies.js:448` ist der einzige `splice` im ganzen Projekt (Voll-Grep: `main.js`, `entities/*` — `enemies.push` nur in `boss.js:135`, `enemies = [...]` nur in `main.js:1158`). `main.js` kann das Verschwinden also **exakt** durch einen Frame-Diff erkennen, ohne `DIE_TIME` zu duplizieren:

```
main.js:905ff   let decals = [];   const lebendeVorFrame = new Set();
main.js:1158ff  (buildWorld)  decals.length = 0;          // Kartenwechsel raeumt auf — PFLICHT
main.js:2080ff  nach updateEnemies(...):
                for (const e of lebendeVorFrame) if (!enemies.includes(e))
                    decals.push({ key: keyFuer(e), x, y, warmA, kaltA, seite });   // Tint EINMAL eingefroren
                if (decals.length > DECAL_MAX) decals.splice(0, decals.length - DECAL_MAX);
                lebendeVorFrame = new Set(enemies);
main.js:2662ff  vor `drawSoftShadow(player)`:  for (const d of decals) tintDrawImage(gfx[d.key], d.x, d.y);
```

Damit ist die Liste flach, ohne Update, vor den Renderables, mit Deckel N und „ältestes fällt".

**Die eine Design-Entscheidung, die zwei Wächter rettet:**

> **Das Decal bekommt EIGENE SPRITES-Keys (`skeleton_decal`, `ghoul_decal`, …), nicht die `*_die`-Keys.**

Begründung, gemessen:

1. `.tmp/check_inventory_slice2.mjs:370` `for (let f=0; f<30 && !oneHit; f++) { frame(); oneHit = hasSprite('skeleton_die'); }` → Assertion `'Final-Skelett stirbt mit der +1-Waffe in GENAU 1 Hieb'`. Mit einem persistenten `skeleton_die`-Decal aus dem Kill von `:280` ist `oneHit` **im ersten Frame wahr** — die Assertion wird **still bedeutungslos (falsch-grün)**. Dasselbe gilt für `:280` selbst, sobald mehrere Kills stattfinden.
2. `tools/smoke_test.mjs:5669` `const tot = b.zaehle(/skeleton_die|ghoul_die/);` zählt **pro Frame** (`smoke:5578-5580`) und erkennt einen neuen Tod über `tot > vorTod`. Persistente Decals mit denselben Keys machen den Zähler monoton — **jede Deckel-Verdrängung (`N` überschritten) verschluckt genau einen Kill** und verfälscht die Hitstop-K-Messung.

Mit eigenen Keys bleibt `*_die` == „eine Entity ist gerade im Sterben", und beide Wächter behalten ihre Bedeutung. Kosten: 5 neue SPRITES-Keys **ans Ende** (Reihenfolge live gelesen → folgenlos, Landkarte B §1a) und, falls gespiegelt, 5 Flip-Keys **ans Ende der Liste `main.js:106-128` hinter Index 36**.

**Boss/Adds-Sonderfall:** `main.js:2141-2146` setzt bei den beschworenen Adds `e.state='die'; e.dieTimer=0.4; e.noDrops=true` **direkt**, ohne `events.push('enemy_died')`. Der Frame-Diff erfasst sie trotzdem korrekt (sie verschwinden 0,4 s später per Splice). Nebenbefund: diese Adds durchlaufen die `AUDIO_STATE`-Flanke (`main.js:1613-1630`) und feuern **`questKillBeobachter('skeleton')` in der BOSS_KAMMER** — heute folgenlos (Q1 ist GRAVEYARD-gebunden), aber ein latenter Fehler.
`warden_die` ist mit **39,8 % Rahmenfüllung und 19 belegten Zeilen** kein Decal — der Boss bekommt keines (oder ein eigenes, flaches Grid).

**Decal-Tauglichkeit der Bestandsgrids (Messziel ≤ 25 % Rahmen, ≤ 6 Zeilen):**

| Grid | Maß | opak | Rahmen % | Zeilen | Zeilenband |
|---|---|---|---|---|---|
| skeleton_die | 16×16 | 51 | 19,9 | 5 | 9..13 |
| ghoul_die | 16×20 | 52 | 16,3 | 5 | 15..19 |
| rust_die | 16×18 | 66 | 22,9 | 6 | 12..17 |
| **hound_die** | 16×12 | 79 | **41,2** | **7** | 4..10 |
| warden_die | 24×32 | 306 | 39,8 | 19 | 11..29 |

Drei von fünf sind sofort decal-tauglich. **Der Grufthund reißt beide Ziele** (41,2 % / 7 Zeilen) — sein `_die` liegt zu hoch im Rahmen (Zeile 4) und ist zu dicht.

**Wächter, die neu gebraucht werden** (Muster `smoke:5189`/§0.2 „npcs pushen keine Events"):
- „`decals` pusht NIE ein Event und mutiert NIE `enemies`/`drops`/`player`" (Quelltext- oder Verhaltensgate).
- „nach `buildWorld(<andere Karte>)` wird **null** Decal gezeichnet" — Spiegelbild von `smoke:6612-6615`; ohne diese Räumung würde ein Friedhofs-Decal im DORF das `GEGNER`-Gate treffen, sobald die Keys das Präfix tragen.
- „`decals.length <= N` nach 200 Kills".
- Positivkontrolle: „nach einem Kill wird `skeleton_decal` in **jedem** Folgeframe gezeichnet, `skeleton_die` in **keinem**."

**„Spieldynamik bleibt" — Beweisplan:** `DIE_TIME`, `dieTimer`, `spawnDeathDrops`, `events` und der Splice bleiben **byte-identisch**; der einzige neue Code liest `enemies` und schreibt eine Liste, die ausschließlich der Zeichner liest. Nachweis: `smoke:206`, `:892-894`, `:938-949`, `:1410-1432` und `check_inventory:283-286` unverändert grün + Assertionszahlen 825/25/25/33.

---

# 4. PALETTEN-VARIANTEN (Zielbild 3.2)

`buildSprite(grid, palette, {flipX})` (`sprite_factory.js:4-25`) nimmt die Palette als Parameter — ein modifiziertes Objekt erzeugt aus demselben Grid einen umgefärbten Sprite. **Kosten: 0 Grids, 1 Canvas je Variante und Key.**

**Registrierung ohne Reihenfolgen-Bruch — die einzig sichere Form:**
- **NICHT** neue Keys in `SPRITES` anlegen (das wäre sauber für die Reihenfolge, kostet aber Grid-Duplikate).
- **Sondern:** eine **separate Map** in `main.js`, gebaut **nach** `const tiles = buildAll(TILE_ART, PALETTE)` (`main.js:130`) — genau wie die Flash-Canvases (2.3). Dann liegen alle Varianten-Canvases hinter dem TILE_ART-Block, bekommen `extra_N` und **kein einziges der sechs Rigs verschiebt sich** (`check_main_slice1:100-106`, `check_inventory_slice2:145-151`, `check_save_slice4:194`, `smoke:5563`, `smoke:6453`, `check_engineB_gp6:80`).
- Werden die Varianten dagegen **vor** `tiles` gebaut, verschiebt sich der gesamte TILE_ART-Namensblock → `smoke:6612-6621` und die Flusstests kippen falsch-rot.
- `gfx[...]`-Erweiterung nach dem Tiles-Bau ist ebenfalls unkritisch, weil `MASK_REG` (`main.js:154-167`) über `Object.keys(gfx)` läuft — Varianten würden dort automatisch Tint-Masken bekommen (gewollt).

**Tauschschlüssel je Typ (gemessene Identitätsmasse, Nicht-Schwarz-Texel über alle Grids):**

| Typ | Masse | Top-Töne | Top-2 trägt | Vorschlag Tauschschlüssel |
|---|---|---|---|---|
| **Skelett** | 192 | b 148 (77,1 %), B 32 (16,7 %), N 12 | **93,8 %** | **b + B** (wie Landkarte C vermutet — bestätigt) |
| Ghul | 281 | d 93 (33,1 %), g 92 (32,7 %), H 49, 3 28, C 19 | 65,8 % | **d + H** (Grünfamilie); `g` ist die **Steinrampe** und muss ohnehin weg |
| Grufthund | 330 | p 122 (37,0 %), v 113 (34,2 %), V 46, z 27 | 71,2 % | **p + v** — identisch mit der **Erdrampe des Weges**, also erst nach dem Rampenwechsel brauchbar |
| Rostpanzer | 226 | b 74 (32,7 %), 5 58 (25,7 %), 4 38, 6 16, B 16 | 58,4 % | **5 + 4** (Rost) — aber 4/5/6 ist laut E6/M9 **Torwächter-exklusiv** |
| Warden | 3106 | b 1204 (38,8 %), B 488, O 200, u 158, U 142 | 54,5 % | b + B |

**Kosten je Variante:** 3 Varianten × 5 Typen × (2 Walk + 1 Die + Flip) ≈ **60-90 zusätzliche Canvases** à ≤ 16×20 px. Speichertechnisch irrelevant; Bootzeit ebenfalls (heute 91 + 37 + 344 = 472 Canvases beim Boot).

**Palettenbudget — es ist WIEDER null:** 78 Töne (61 alnum + 17 Symbole `=+*!%&():;?@[]^_|`), **kein einziger Ton mit 0 Texeln**, freier alnum-Schlüssel nur `l` (verboten), **der E3-Zeichensatz `! % & ( ) : ; ? @ [ ] ^ _ |` ist zu 14/14 verbraucht.** Jede neue Gegner-Rampe braucht erneut einen Symbol-Namespace und damit eine Sanktion von `.tmp/check_gfx6_art.mjs:87-94` (`SYM_SOLL`).

**Die Reserve, die ohne Palettenerweiterung existiert:** 14 Töne tragen heute **keinen** Figurentexel — `0, 9, e, E, a, m, K, A, M, w, W, =, +, *` (Gras, Wasser, Laub, Erde M, Glanz). Semantisch belegt, technisch frei. Zusätzlich: **`_` (warm, #e0c3c3, L 203,7) und `|` (kalt, #abdcda, L 205,1, Hue 195) tragen 0 Gegner-Texel** — die Gegner können die CH-1-Rimtöne zum Nulltarif erben.

---

# 5. SILHOUETTEN-FAMILIEN + GRÖSSENLEITER

## 5.1 Profilähnlichkeits-Matrix (E5-Formel, Basisgrids), IST

```
             Skelett   Ghul   Hund   Rost  Warden
Skelett          100   65,2   56,1   67,7    24,9
Ghul            65,2    100   45,4   72,4    36,6
Grufthund       56,1   45,4    100   43,1    19,7
Rostpanzer      67,7   72,4   43,1    100    32,7
Warden          24,9   36,6   19,7   32,7     100
```

**Korrektur zu Landkarte C §3.3:** dort stehen Skelett/Ghul 76 und Ghul/Rostpanzer 78. Mit der in SPEC E5 festgeschriebenen Formel messe ich **65,2 bzw. 72,4**. Nur **ein** Paar reißt das Ziel ≤ 60: **Ghul/Rostpanzer 72,4**; Skelett/Rostpanzer 67,7 und Skelett/Ghul 65,2 liegen knapp darüber. Der Schaden ist kleiner als behauptet, das Ziel aber weiter verfehlt.

Größenleiter IST: 16×12 (Hund) / 16×16 (Skelett) / 16×18 (Rost) / 16×20 (Ghul) / 24×32 (Warden).

## 5.2 Was die AABB-Tabelle festlegt und was ein Maßwechsel kostet

`tools/smoke_test.mjs:3336-3341` (GRÜN):
```js
['Spieler',12,14,'player_down_0'], ['Skelett',12,14,'skeleton_0'],
['Ghul',14,14,'ghoul_0'], ['Grufthund',14,12,'hound_0'],
['Rostpanzer',14,16,'rust_0'], ['Boss Grabwaechter',20,24,'warden_idle'], …
```
Die **AABB-Zahlen sind Literale**, die **Sprite-Maße kommen live** aus `SPRITES[key]` (`:3346-3347`).

**Nachgerechnet (`.tmp/gp7ch2_probe/m5_marge.mjs`, Gate-Logik 1:1):**

| Klasse | AABB | Grid | M5 mit dy −1 | ohne dy −1 |
|---|---|---|---|---|
| Spieler | 12×14 | 16×24 | 11 | 0 |
| Skelett | 12×14 | 16×16 | 11 | 0 |
| Ghul | 14×14 | 16×20 | 13 | 0 |
| Grufthund | 14×12 | 16×12 | 13 | 0 |
| Rostpanzer | 14×16 | 16×18 | 13 | 0 |
| Warden | 20×24 | 24×32 | 18 | 0 |

Was-wäre-wenn mit **volldeckenden** Ersatzgrids: Skelett 16×18 / 16×20 / 20×24 → **immer 11**; Grufthund 16×14 / 20×14 → **13**; Rost 20×20 → **13**; Ghul 16×22 → **13**.

> **Das Node-M5-Gate ist gegen jede Grid-Maßänderung und jede Kunst immun, solange die AABB steht** — die `dy = −1`-Zeile liegt per Konstruktion immer unter der letzten Spritezeile (`sy + ih − 1 = h − 1 < h`). Die Negativkontrolle `smoke:3375-3392` ist ebenfalls robust: **ohne** die −1-Zeile fallen **alle neun** Klassen auf 0.

**Kosten eines Grid-Maßwechsels je Typ:**

| Typ | Maß-Gate in einer GRÜNEN Suite | Kosten |
|---|---|---|
| **Skelett 16×16** | **keines** | **0** — frei änderbar |
| **Grufthund 16×12** | **keines** | **0** |
| **Rostpanzer 16×18** | **keines** | **0** |
| **Ghul 16×20** | `.tmp/check_gfx6_art.mjs:195-199` `if (g.length !== 20 \|\| g[0].length !== 16) bad('…muss 16x20 sein')` | **1 Sanktion** (drei Keys) |
| **Warden 24×32** | `.tmp/art_slice3_selfcheck.mjs:23-32` Tabelle + `:31` Prüfung | **1 Sanktion** (9 Keys) |

Zusätzlich für alle: `.tmp/check_gfx6_art.mjs:101-109` und `.tmp/art_slice3_selfcheck.mjs:10-20` verlangen gleich lange Zeilen und nur Palettenzeichen (mitwachsend, kein Hindernis). `.tmp/check_gfx6_art.mjs:844-864` (GP7CH-Maßprobe 16×24) greift nur `/^(player|npc)_/` — **Gegner sind ausgenommen**.

**AABB anfassen = teuer:** `smoke:3336-3341` + `main.js:2559` (`ent.w >= 18 && ent.h >= 20` → BIG-Schattenprofil) + Kollision/Balance im ganzen Kampfcode. **In CH-2 tabu.**

## 5.3 Ghul-Sondergate

`.tmp/check_gfx6_art.mjs:200`: `if (SPRITES.ghoul_0 && !SPRITES.ghoul_0.some(r => r.includes('C'))) bad('ghoul_0: kuehler Rim C fehlt');` — der Ghul **muss** `C` (#3c5a70, L 83,5, Hue 254) behalten. `C` ist gleichzeitig für Back-Kronen verboten (`check_gfx5_art.mjs:118-122` Kommentar). Das ist der einzige Präzedenzfall eines **erzwungenen** Rimtons und der einzige Gegner-Rim im Bestand.

---

# 6. PERFORMANCE-BUDGET (Analyse, KEIN Umbau in CH-2)

`drawSoftShadow` (`main.js:2563-2573`): `ctx.save()`, `fillStyle='#000'`, dann **4 `fillRect`** (Standard, `SHADOW_W/A/DY` `main.js:2523-2525`) bzw. **5** (BIG ab AABB 18×20, `main.js:2557-2559`), `ctx.restore()`.
`tintDrawImage` (`main.js:216-248`): **1 `drawImage` Original + bis 2 Masken-`drawImage`** (Kalt bei `kaltA>0`, Warm bei `warmA>0`), jeweils mit `globalAlpha`-Setzung und -Rücksetzung.

| Gegner | Schattenprofil | fillRect | drawImage (Original) | + Tintmasken | Zusatz |
|---|---|---|---|---|---|
| Skelett / Ghul / Hund | STD | 4 | 1 | ≤ 2 | – |
| Rostpanzer | STD | 4 | **2** (Sprite + `shield_*`, `enemies.js:642-659`) | ≤ **4** | + `block_spark` bei `blockFlash` |
| Warden | BIG | **5** | 1 | ≤ 2 | – |
| Elite (nur FLUESTERGRUFT) | – | – | +1 `elite_glow` (`enemies.js:663-672`) | – | + 1 Eintrag in `frameLights` (`main.js:2650`) |

**40 Gegner (Standard, Warm+Kalt aktiv): 160 `fillRect` + 40 + bis 80 `drawImage` = 280 Züge/Frame** — plus 1 `save`/`restore`-Paar je Entity. Ein Flash addiert +1 `drawImage` je getroffene Entity (also im Horden-Fall selten mehr als 5-10 gleichzeitig).

**Vorschlag für den KAMPF-Slice (nicht CH-2):** Schatten je **Größenklasse** einmal in ein Canvas backen (STD-12, STD-14, BIG-20) → 1 `drawImage` statt 4-5 `fillRect` + `save`/`restore`. Spart im 40er-Fall ~160 `fillRect`. **Bedingung:** `main.js:2523-2525`/`2557-2559` werden von `smoke:3336-3372` **wörtlich nachgebaut** — jede Profiländerung muss dort mitgezogen werden, und die Negativkontrolle `:3375-3392` verlangt weiterhin, dass mindestens eine Klasse ohne die −1-Zeile durchfällt. Und das **Bild-M5** (`shot_gfx6.py:2805-3052`) misst die **tatsächliche Bodenabdunklung**: innen `dL 6,64` gegen Schwelle `6,0` — **Marge 0,64 L**. Ein Bake mit anderer Alpha-Rundung kippt das.

---

# 7. TEST-BINDUNGEN GEGNER-ART

## 7.1 GRÜNE Gates, die Gegner-Grids anfassen

| Datei:Zeile | Gate | Auslösbar durch CH-2 |
|---|---|---|
| `tools/smoke_test.mjs:81-93` | jedes Zeichen aller SPRITES in `PALETTE` | ja (neuer Ton ohne Palette) |
| `tools/smoke_test.mjs:472` | neue SPRITES-Schlüssel existieren (`ghoul_0/1/die` gelistet) | nein (nur Existenz) |
| `tools/smoke_test.mjs:569-578` | Flip-Quellgrids der 12er-Liste existieren (`skeleton_*`, `ghoul_*`) | nur bei Umbenennung |
| `tools/smoke_test.mjs:3336-3392` | **M5 Kontaktschatten + Negativkontrolle** | nein, solange AABB steht (nachgerechnet 5.2) |
| `tools/smoke_test.mjs:6612-6615` | `/^(skeleton\|ghoul\|hound\|rust\|warden\|shield)/` — **null Gegner-Sprites nach `buildWorld(DORF)`** | **ja, durch Decals ohne Kartenräumung** |
| `tools/smoke_test.mjs:5669` | `zaehle(/skeleton_die\|ghoul_die/)` pro Frame, Hitstop-K-Messung | **ja, durch Decals mit `*_die`-Keys** |
| `.tmp/check_gfx6_art.mjs:101-109` | Zeilenbreite + Palettenzeichen über alle SPRITES | ja |
| `.tmp/check_gfx6_art.mjs:195-199` | **ghoul 16×20** | ja bei Maßwechsel |
| `.tmp/check_gfx6_art.mjs:200` | **`ghoul_0` muss `'C'` enthalten** | **ja bei Umfärbung des Ghul-Rims** |
| `.tmp/check_gfx6_art.mjs:87-94` | Symbol-Deckel `=+*` + 14 GP7CH-Zeichen | ja bei Palettenerweiterung |
| `.tmp/art_slice3_selfcheck.mjs:10-20` | Zeilenbreite + Palettenzeichen | ja |
| `.tmp/art_slice3_selfcheck.mjs:23-32` | **warden_* 24×32 (9 Keys)** | ja bei Maßwechsel |
| `.tmp/check_inventory_slice2.mjs:186-190, 280, 370` | `skeleton_[01](_flip)?` als „lebend", `hasSprite('skeleton_die')` als Todesbeleg | **ja, durch Decals mit `*_die`-Keys** |
| `.tmp/check_boss_slice3.mjs:43, 216-221` | `livingAdds()` über `state !== 'die'`; Boss-Tod | nein |
| `.tmp/check_engineB_gp6.mjs:130-152, 238-240` | Tint-Fassade (Paarung, Alpha-Whitelist, `__noTint`) | **ja, durch einen lazy gebauten Flash** |
| `.tmp/shot_gfx6.py` **M3** | `player_down_0` **und `skeleton_0`** | **ja** — s. 7.3 |
| `.tmp/shot_gfx6.py` **Bild-M5** | `spieler_0` + **`skeleton_1..4`** | nein (misst den Boden, nicht die Figur) |

## 7.2 Tote / abgelöste Wächter mit Gegner-Bezug (bleiben tot)

- `.tmp/check_art_gfx2.mjs:91-101` Byte-Freeze `TABU_PREFIX` inkl. `warden_|shield_|sword_` — 211 ROT.
- `.tmp/check_art_gfx3.mjs:105` dieselbe Regex ohne `player_|warden_`; `:138-148` verbotene Schattentöne `0/n/z` in den Fußzeilen von `skeleton/ghoul/hound/rust` — 79 ROT.
- `.tmp/dev_art_slice2.mjs:13-38` SHA-256-Hashes je Grid (`skeleton_0`, `ghoul_0` …); `:183-205` Maße + Mindestdeckung `hound_*/rust_*/shield_*` — tot.
- `.tmp/check_art_gp5_self.mjs:155-163` Hund-Auge `r`+`R` Pflicht; `:226-237` Warden-Rostschienen-Zensus mit **an 24 px genagelten Spaltenindizes 0..6 / 17..23** — 58 ROT.
- `.tmp/check_gp6_art_self.mjs:57-58` SPRITES byte-unverändert / 75 Keys — erwartete Rot-Zahl steht nach E8(5) auf **6**; CH-2 erzeugt dort **keine neuen** Roten.
- `.tmp/check_art_slice1.mjs:76-83`, `.tmp/check_art.mjs:57-64` Frame-Ungleichheit — tot. **Es gibt für Gegner kein Frame-Ungleichheits-Gate in einer grünen Suite.**

**Gemessene Frame-Diffs (als M2-artige Untergrenzen für CH-2 einzufrieren):**

| Paar | Texel-Diff | Silhouetten-Diff |
|---|---|---|
| skeleton_0/_1 | 12 (9,0 %) | 8 (6,0 %) |
| ghoul_0/_1 | 25 (12,3 %) | 14 (6,9 %) |
| hound_0/_1 | 32 (28,8 %) | 20 (18,0 %) |
| rust_0/_1 | 32 (18,0 %) | 16 (9,0 %) |
| warden_walk_0/_1 | 66 (15,0 %) | 66 (15,0 %) |

## 7.3 M3-Marge: was eine Abdunklung des Skeletts wirklich kostet

`skeleton_0` ist Messfigur in `.tmp/shot_gfx6.py:1918-1921, 2205-2266`. Schwellen fix: `M3_DWARM_MIN = 18.0`, `M3_HALB_MIN = 6.0`, `M3_HALB_NOTINT_MAX = 2.0`, `M3_AUSBRENNEN_L = 240` (`:206-209`).

**Letzter Realstand (`.tmp/g6_proof_results.json`, Lauf `.tmp/gp7ch_m34/run_m3m4m5.log:23-24`):**

| Frame | dWarm (≥18) | K3 Tint-Anteil NAH (≥6,0) | FERN (<2,0) | ausgebrannt (=0) | Silhouette |
|---|---|---|---|---|---|
| player_down_0 | 66,6 → **Marge 48,6** | 17,44 → Marge 11,44 | 0,0 | 0 | 258 |
| **skeleton_0** | **51,4 → Marge 33,4** | **6,85 → Marge 0,85** | −1,62 | 0 | 134 |

**Die Marge sitzt nicht beim dWarm, sondern beim K3-Tint-Anteil: 0,85 L.** Rechnerisch gilt

```
Tint-Anteil_NAH  ≈  m · wA · [ (L_WARM_HELL − L_WARM_DUNKEL) − Halbdiff_Kunst ]
                     L(#d8722a)=136,3   L(#b05822)=108,2   →  Δ = 28,1
                     wA = WARM_ALPHA[3] = 0,36 (main.js:172)
```

Der Term hängt **nicht vom mittleren Körper-L ab**, sondern nur von der **Halbseiten-L-Differenz der Kunst** (Kalibrierung an den zwei Messframes: m ≈ 0,84 am Skelett-Ort, ≈ 1,08 am Spieler-Ort).

**Gemessene Halbseiten-Werte der Kunst (`.tmp/gp7ch2_probe/gegner_messung.mjs` §7a):**

| Grid | Texel | R−B | L links | L rechts | **Halbdiff** | max L |
|---|---|---|---|---|---|---|
| skeleton_0 / _1 | 134 | 19,9 | 128,4 | 128,1 | **+0,37** | 232,9 |
| player_down_0 | 258 | 2,5 | 76,7 | 55,4 | **+21,4** | 203,7 |
| ghoul_0 | 203 | 13,0 | 72,2 | 68,5 | +3,71 | 199,2 |
| hound_0 | 111 | 16,2 | 54,5 | 56,2 | −1,75 | 133,8 |
| rust_0 | 178 | 34,0 | 85,5 | 80,2 | +5,29 | 232,9 |

**Damit ist die Marge exakt bezifferbar:**
1. **Eine reine Abdunklung (dL 133 → Band) berührt den K3-Gate NICHT.** Der Term ist helligkeitsunabhängig — sowohl die Tint- als auch die noTint-Messung skalieren identisch mit dem Dunkel-Overlay.
2. **Was den Gate bewegt, ist die Halbseiten-Asymmetrie.** Heute +0,37 L. Erlaubt ist bis zur Schwelle: `6,0 = 0,84 · 0,36 · (28,1 − x)` → **x ≤ 8,2 L**. **Das Skelett darf seine linke Hälfte um höchstens ~8 L heller zeichnen als seine rechte**, sonst ist M3 rot. Zum Vergleich: der Held steht bei 21,4 und besteht nur, weil er weiter im Kegel steht (m ≈ 1,08) und das Vorzeichen ihm hilft.
   → Das kollidiert direkt mit ANKER-Regel 1 („Licht von oben, flip-neutral, |dL| ≤ 6,5") — **die Anker-Regel und der M3-Gate zeigen hier in dieselbe Richtung**: 6,5 < 8,2. Wer die Anker-Regel einhält, hält M3.
3. **dWarm 51,4 (Marge 33,4):** Modellrechnung `dWarm ≈ m_n·(0,64·(R−B) + 56,9) − m_f·(0,84·(R−B) − 2,2)`. Ein Absenken von R−B (19,9) auf 0 — also ein neutralgrauer statt warmknochiger Körper — kostet rund 10-12 L. **Marge reicht.** Ein Umkippen ins Kalte (R−B ≈ −20, „schwarz und kalt") kostet weitere ~12 L → dWarm ≈ 28-30, immer noch über 18, aber die Reserve halbiert sich.
4. **`ausgebrannt` (L > 240) = 0, IST-Maximum `N` L 232,9.** Jede Abdunklung verbessert das. **Kein Risiko.**
5. **Bild-M5 am Skelett:** 10 Texel über der Schwelle gegen Soll 8 (Marge 2), dL 12,87 außen / 6,64 innen. Misst den **Boden** unter der Fußkante → art-invariant. **Aber:** ein Decal, das in der Messzeile landet, verändert `delta_L`. In den M3/M4/M5-Szenen stirbt niemand — trotzdem als Messhygiene-Regel festhalten (analog `clear_particles`, `shot_gfx6.py:2048`).

---

# DIE 5 GRÖSSTEN RISIKEN

1. **Der Flash kippt `check_engineB_gp6` (GRÜN), wenn er lazy gebaut wird.** `:145-148` lässt als Masken-Alpha nur `{0,08 0,12 0,16 0,24 0,36}` zu, `:238-240` verlangt bei `__noTint` **null** Post-Boot-Draws. Nur ein **eager nach `main.js:130` (nach dem TILE_ART-Bau)** erzeugtes Flash-Canvas ist immun — wird es **vor** den Tiles gebaut, verschieben sich in allen sechs Rigs die TILE_ART-Namen und `smoke:6612-6621` wird falsch-rot.
2. **Decals mit `*_die`-Keys entwerten zwei grüne Wächter still.** `check_inventory_slice2:370` wird falsch-grün („1 Hieb" ist dann immer wahr), `smoke:5669` verschluckt bei Deckel-Verdrängung Kills in der Hitstop-K-Messung. Eigene Decal-Keys lösen beides.
3. **Das Skelett-E1-Fenster ist 10,9 L breit (116,5..127,3)** und wird von der Weg-Kachel (91,5) gegen die Kryptatreppe (37,3) eingeklemmt. Zielwert ~120-124. Wer auf die Landkarte-C-Zahl (193,7 statt E5 162,5) zielt, zielt 32 L daneben. **Lesart vor dem Zeichnen festnageln.**
4. **Der Grufthund-Steckbrief ist mit E1 unvereinbar.** „Schwarz und kalt" treibt ihn von +41 nötig auf +55; nur „Knochen und Sehne" landet im Fenster. dE00-Ersatzpfad **rettet ihn nicht** (6,6 gegen den Weg). Ohne Vorentscheid läuft CH-2 in denselben Gate-Konflikt wie G-A/G-J — nur diesmal bei zwei Figuren gleichzeitig (Hund und Skelett von entgegengesetzten Seiten).
5. **Palettenbudget wieder exakt null.** 78 Töne, kein Ton mit 0 Texeln, E3-Zeichensatz 14/14 verbraucht, freier alnum nur `l` (verboten). Gleichzeitig kollidieren **Rostpanzer mit der Torwächter-exklusiven Rampe 4/5/6** und der **Warden mit der Helden-Rampe u/U/X**. Eine Sperrliste für Gegner (E6-Äquivalent) plus Palettenentscheid gehören **vor** CH-2, nicht hinein.

---

# DIE 5 BILLIGSTEN GROSSEN HEBEL

1. **Rim auf alle fünf Gegner — Kosten null.** `_` (#e0c3c3, warm) und `|` (#abdcda, kalt, Hue 195) existieren seit CH-1 und tragen **0 Gegner-Texel**. Heute hat nur der Ghul (C, 12,9 % der Kontur) und der Warden (12,5 %) einen Rim; Skelett, Hund und Rost haben **0 %**. Der Rim löst gleichzeitig den Hund-Kontrastausfall (dL −16 auf dem Weg), die Horden-Trennung bei Überlappung (Zielbild T6/3.7) und das E1-Problem auf dem Ersatzpfad. Kein Ton, kein Key, kein Gate.
2. **Skelett: `b` vom Grundton zum Spitzlicht.** `b` trägt heute **148 von 192** Nicht-Schwarz-Texeln (77,1 %). Umverteilen auf `O`(102,5)/`B`(139,3) etwa hälftig landet rechnerisch bei Körper-L ≈ 120 — **mitten im 10,9-L-Fenster** — und hebt gleichzeitig die Stufenzahl von 2 auf 3. Rein Zeichentausch, kein neuer Ton, M3 unberührt (7.3).
3. **Schwarzanteil als Horden-Budget.** Gegner liegen bei 37-49 % Umriss (geometrisch) bzw. 37-55 % Schwarz — der Warden bei **19,7 / 24,2 %** und ist die einzige nie bemängelte Figur. Der Weg von 45 auf 25 % beim Rostpanzer setzt ~35 Texel frei und halbiert gleichzeitig sein Solitär-Rauschen (30,2 %). Kostet nichts außer Zeichenzeit, keine Gate-Berührung.
4. **Zweistufiges Sterben ohne Zeitverschiebung.** `DIE_TIME` bleibt 0,4 (Boss 1,0), Stufe 1 wird ein 2-Frame-Zusammensacken innerhalb der bestehenden Phase, Stufe 2 hängt am bestehenden Splice. Damit feuern Drops, XP, `enemy_died`, `boss_died`, Kill-Zähler und HITSTOP_K **am identischen Tick wie heute** — vier grüne Anker (`smoke:206/892/1417/1429`) bleiben unberührt, und der gesamte Decal-Code lebt in `main.js` (**null `entities/`-Sanktion für Stufe 2**).
5. **Grid-Maße sind für Skelett, Hund und Rostpanzer gratis.** Kein einziges Maß-Gate in einer grünen Suite; das Node-M5 ist nachgerechnet grid-invariant (11/13 Texel in jeder geprüften Variante); die Zeichner sind durchweg größenagnostisch (`enemies.js:637-641`, `boss.js:328-331`). Die Größenleiter aus Zielbild 3.5 (KLEIN/MITTEL/GROSS) lässt sich für drei von fünf Typen **ohne eine einzige Sanktion** einfrieren — nur Ghul (`check_gfx6_art:195-199`) und Warden (`art_slice3_selfcheck:23-32`) kosten je eine Zeile.
