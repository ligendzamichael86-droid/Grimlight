# GP7-CH Landkarte Teil A: Bestandsaufnahme (16.08.2026, Opus-Analyst, konsolidiert)

Complete. Compiling the report.

---

# GP7-CH BESTANDSAUFNAHME — Rohdaten-Report

Sonden liegen in `/home/coder/Grimlight/.tmp/gp7ch_probe/` (`inventar.mjs`, `messung.mjs`, `kapazitaet.mjs`, `masswechsel.mjs`, `render.mjs`, `profil.mjs` + JSON/PNG-Ausgaben). Kein Server, keine Spieldatei, kein Testlauf berührt.

## 1. CHARAKTER-INVENTAR

**1.1 Maße, Frames, Richtungen** (`game/js/art/sprites.js`, Belege je Figur)

| Figur | Sprite | AABB | Frames | Richtungen | Flip |
|---|---|---|---|---|---|
| Held `player_*` :15-466 | 16×24 | 12×14 (`player.js:56-57`) | **17** | down/up/side (3 Grids) | side→left |
| Skelett :467-525 | 16×16 | 12×14 (`enemies.js:72`) | 3 (2+die) | **1 (frontal)** | ja |
| Ghul :526-592 | 16×20 | 14×14 (`enemies.js:88`) | 3 (2+die) | **1** | ja |
| Grufthund :855-944 | 16×12 | 14×12 (`enemies.js:106`) | 6 | **1 (seitlich)** | ja |
| Rostpanzer :945-1006 | 16×18 | 14×16 (`enemies.js:135`) | 3 (2+die) | **1** | ja |
| Warden (Boss) :1199-1512 | 24×32 | 20×24 (`boss.js:51-54`) | 9 | **1** | ja |
| 5 NPCs :1590-2019 | 16×24 | 12×14 (`npcs.js:28-29`) | je 3 (2 idle + 1 talk) | **1 (frontal)** | nur Mile/Torwächter |

**Befund 1a:** Nur der Held hat mehr als eine Ansicht. Alle 5 NPCs und alle 6 Gegnertypen haben **genau eine** — die NPCs strikt frontal. Das ist der harte Kern des „npc-frontal"-Befunds der Jury.

**Befund 1b:** Der Held hat **keinen Idle-Sprite** — `player.js:221` fällt bei `state !== 'walk'` auf Frame `_0` zurück. Ebenso **kein Hurt-Sprite** (nur Blinken, `player.js:229`). Attack ist **1 Frame** für das ganze 0,27-s-Fenster (`player.js:216-218`).

**Befund 1c:** NPCs haben **keinen Laufzyklus**. `npcs.js:186` zieht immer `Math.floor(animTimer * IDLE_RATE) % 2` mit `IDLE_RATE = 1.6` (`npcs.js:45`) — ein wandernder NPC *gleitet* mit 1,6-fps-Idle-Wippen. Das liest als Puppe, nicht als Mensch.

**1.2 Farbrampen je Figur** (L = Rec.601, Körper ohne Umriss `k`)

| Figur | Körper-Stufen | Größte Lücke | Bewertung |
|---|---|---|---|
| Held | 11 | 36,7 (2→Z) | echte Rampe (u→U→X) + Streuton-Akzente |
| Bran | 8 | 25,9 (j→5) | Holzrampe q/j/c/J — **Fremdrampe** |
| Hedda | 8 | **33,6 (r→G)** | G = **Einzelton**, keine Stofframpe |
| Corm | 9 | 47,9 (h→b) | s/g Steinrampe + G-Akzent |
| Mile | 8 | 28,6 (2→B) | Holz/Knochen gemischt |
| Torwächter | 10 | 30,0 (6→h) | Rost 4/5/6 = echte Rampe |
| Skelett | **3** | 64,0 (B→b) | Zwei-Ton-Knochen, praktisch flach |
| Ghul | 5 | **87,8 (d→H)** | Loch in der Mitte (`G` wurde 15.08. umgewidmet) |
| Hund | 7 | 30,9 | brauchbar |
| Rostpanzer | 8 | 64,0 (B→b) | Sprung |
| Warden | **18** | 28,4 | reichste Figur des Spiels |

**Befund 1d — Rimlight:** `Z` (#9b8ab0, L 147,4) trägt **ausschließlich der Held** (8 Texel down, 6 side). **Alle 5 NPCs und alle 6 Gegner haben Z = 0.** Es gibt im ganzen Bestand keine zweite Rimlight-Sprache.

## 2. ANIMATIONS-SYSTEM

**2.1 Frame-Wahl** — durchweg `Math.floor(animTimer * rate) % n`, keine Zeitbasis-Abstraktion:

| Träger | Rate | Frames | Beleg |
|---|---|---|---|
| Held Walk | 10 fps | 4 | `player.js:221` |
| Held Attack | — | 1 | `player.js:216-218` |
| NPC (immer) | 1,6 fps | 2 | `npcs.js:45,186` |
| Skelett/Ghul/Hund/Rost | 5 / 3,5 / 6 / 2,5 | 2 | `enemies.js:605,628` |
| Boss stalk | 4 fps | 2 | `boss.js:313` |

**2.2 Flip-System** — `main.js:106-130`. 37 Keys, `gfx[key+'_flip'] = buildSprite(..., {flipX:true})`. Die **append-only-Regel** (`main.js:113-116`) ist echt, aber ihr wahrer Grund liegt woanders als der Kommentar sagt — siehe Befund 3.2.

**2.3 pushTinted-Fassade** — `main.js:2710-2715`. Jede Entity bekommt `fy = y+h`, Abtastpunkt `(x+w/2, y+h-1)`, Warm/Kalt-Tönung aus `tintFor`. Die Fassade `tintDrawImage` (`main.js:221`) zeichnet **immer zuerst das Original** und legt dann Tint-Masken mit `globalAlpha` darüber. Masken sind **lazy** (`main.js:151-153`).

**2.4 Y-Sort** — `main.js:2754`, `renderables.sort((a,b) => a.fy - b.fy)`, stabil; Spieler wird zuletzt gepusht (`:2753`) und gewinnt Gleichstände.

**2.5 Schatten** — `main.js:2523-2573`. 4-Zeilen-Standardprofil, 5-Zeilen-BIG ab `ent.w >= 18 && ent.h >= 20` (`:2559`). **Der Schatten hängt an der Hitbox, nie am Sprite** (`:2563-2564`) — für den Maßwechsel entscheidend.

## 3. TEST-BINDUNGEN

**3.1 Größenagnostik ist durchgängig.** Alle Zeichner lesen `img.width`/`img.height`:
`player.js:238-239`, `npcs.js:211-212`, `enemies.js:639-640`, `boss.js:330-331`. **Ein Maßwechsel erzwingt nirgends einen Offset-Umbau.**

**3.2 Canvas-Erzeugungs-Reihenfolge — der Kommentar in `main.js:113-116` ist ungenau.** Beide Tests bauen die Erwartung so:

```js
const orderedNames = [ ...Object.keys(SPRITES), ...FLIP_LIST.map(k => `${k}_flip`), ...Object.keys(TILE_ART) ];
createdCanvases.forEach((c, i) => nameOf.set(c, orderedNames[i] || `extra_${i}`));
```
(`.tmp/check_main_slice1.mjs:100-106`, `.tmp/check_inventory_slice2.mjs:145-151`)

- `Object.keys(SPRITES)` wird **live gelesen** → **neue SPRITES-Keys verschieben Test und Realität gemeinsam. Anhängen ist folgenlos.**
- `FLIP_LIST` ist eine **veraltete Hartkopie**: check_main_slice1 kennt **12** Einträge (`:93-99`), check_inventory_slice2 **22** (`:137-144`) — main.js hat **37**. Alles ab Index 22 ist für beide Tests bereits heute fehlbenannt, was **harmlos** ist, weil `nameOf` nur für `player*`, `skeleton_[01](_flip)?` und `heart_*` abgefragt wird (`:128-129,144,165-167`).
- **Die echte Regel lautet also: die ersten 22 Flip-Einträge sind eingefroren; alles danach ist unsichtbar.** Genau deshalb funktionierten Slice-3- und Slice-6-Anhänge.
- `check_main_slice1.mjs:136` ist ausdrücklich **„Sprite-größen-agnostisch"** kommentiert und rechnet über `img.width/height`.

**3.3 Der M5-Schattengate ist die einzige Stelle, die Sprite- und AABB-Maß koppelt** — `tools/smoke_test.mjs:3333-3372`, Tabelle `['Spieler',12,14,'player_down_0'] … ['Boss',20,24,'warden_idle']`, Schwelle ≥ 8 Texel unter der Fußkante. Ich habe die Gate-Logik 1:1 nachgerechnet (`masswechsel.mjs`):

```
Spieler HEUTE  12x14 / 16x24  -> 11 Texel  GRUEN
Spieler        12x14 / 20x28  -> 11 Texel  GRUEN
Spieler        14x16 / 20x28  -> 13 Texel  GRUEN
NPC            12x14 / 20x28  -> 11 Texel  GRUEN
Skelett        12x14 / 20x24  -> 11 Texel  GRUEN
```
**Jede geprüfte 20×28-Variante bleibt grün.** Die AABB-Tabelle im Test ist hartkodiert — sie muss nur angefasst werden, wenn die **AABB** sich ändert, nicht der Sprite.

**3.4 Weitere Gates — alle reine Existenzprüfungen, keine Maßprüfung auf SPRITES:**
- `smoke_test.mjs:472` neue SPRITES-Keys existieren; `:566` `player_{dir}_0..3` existieren (mehr Frames erlaubt, weniger nicht); `:577` alle Flip-Quellgrids existieren.
- `smoke_test.mjs:82-93` **einziger Zeichenvorrat-Gate**: jedes Grid-Zeichen muss in `PALETTE` stehen.
- `smoke_test.mjs:1766-1769` prüft Zeilenbreiten **nur für TILE_ART**, nicht für SPRITES. **Es gibt keinen Wohlgeformtheits-Gate auf Charakter-Grids** (ungleich lange Zeilen fielen erst zur Laufzeit auf).
- `smoke_test.mjs:3630-3640` baut Flip + Tint-Maske aus `player_down_0` und prüft Maskenmaß **gegen das Grid selbst** — mitwachsend, kein Hindernis.

**3.5 `check_gp6_art_self.mjs` ist tot und muss tot bleiben.** `:57` `JSON.stringify(SPRITES) === JSON.stringify(S_ALT)` und `:58` `Object.keys(SPRITES).length === 75` (heute 91). Status dokumentiert in `design/SLICE6_PHASE2_NOTIZEN.md:55-59`: *„5 ROT von 428 … durch legitimen Sprite-Zuwachs abgeloest; als abgeloest DEKLARIEREN, nicht reparieren."* Ebenso tot: `.tmp/check_world_slice1`.

**3.6 Einziger Hardcode der Sprite-Höhe im Spielcode:** `game/js/ui/hud.js:590`
```js
const y = Math.round(player.y + player.h - 24 - 10 - progress * 8 - camera.y);
```
Die `24` ist die Heldensprite-Höhe. Bei 28 stünde der Pickup-Toast 4 px zu tief. **Einzeiliger Fix.**

## 4. PALETTEN-LAGE

**Befund 4.1 — die Reserve ist exakt null.** Voll-Zensus über 432 Grids / 129 264 Texel (SPRITES + TILE_ART + ICON_APP): **kein einziger der 64 Töne hat 0 Texel.** Die c/G-Umwidmung vom 15.08. war der letzte Slot.

**Befund 4.2 — die 64 sind test-verriegelt, nicht technisch begrenzt.** `.tmp/check_gfx6_art.mjs:74-77` und `.tmp/check_gfx4_art.mjs:16-19` erzwingen `alnum.length === 61` und `sym.length === 3`. Alnum ist voll (62 minus verbotenes `l`). **Neue Töne brauchen neue Symbol-Keys und damit eine Sanktion beider Wächter** — CLAUDE.md:36 erlaubt „unbegrenzte Palette" ausdrücklich, die Schranke ist selbstgesetzt.

**Befund 4.3 — 23 Töne trägt heute kein Charakter**, davon 15 nur in Kacheln (Gras e/E/a/m/K/A, Wasser w/W/9/=, Laub 0/+/*, Stein F, Erde M). Sie sind semantisch belegt, aber für Kleidung *technisch* verfügbar.

**Befund 4.4 — die Jury-Befunde vom 15.08. quantifiziert** (`design/SLICE6_JURY.md:54-57`):

- *„G-Stoff ohne Rampe (Falten dL46-Nadelstreifen)"* → **bestätigt.** Hedda: `G` = 83 Texel, Nachbarn `r` (dL 46,2) und `q` (dL 53,3). **Keine Zwischenstufe.** Die Lücke r 51,8 → G 98,0 misst 46,2 L; ihr Mittelpunkt liegt bei L 74,9. Der einzige Bestandston, der dort landet und weder Held noch Stahl gehört, ist **`v` (#584a3b, L 76,5)** — damit wäre r → v → G eine Rampe mit Schritten 24,7 / 21,5.
- *„Bran/Mile stecken in der Holzrampe ihrer Gebäude"* → **bestätigt.** Bran trägt **61 %** seiner Körpertexel in q/j/c/J; Mile 23 %. Dieselben Töne führen die Gebäudekacheln mit 5 393 Texeln (`dorf_wand/dach/palisade/tuer`).
- *„kein Rimlight"* → **bestätigt**, Z = 0 bei allen NPCs.
- *„npc-frontal"* → **bestätigt**, 1 Ansicht je NPC.

## 5. VERGLEICHS-MESSUNG

Sichtproben: `.tmp/gp7ch_probe/figuren_graveyard.png` und `figuren_dorf.png` (14 Figuren, 6×, auf dem jeweiligen Boden-Leitton).

**Kontrast Figur↔Boden** (Palettenraum; Boden-Leittöne `e` L 46,9 Friedhof / `v` L 76,5 Dorf; Ambient 0,22 bzw. 0,28 wirkt auf beide gleich):

| Figur | Körper-L | Δ GRAVEYARD | Δ DORF |
|---|---|---|---|
| Held | 75,8 | +13,9 | **±0,0** |
| Bran | 105,0 | +43,2 | +29,3 |
| Hedda | 97,8 | +35,9 | +22,0 |
| Corm | 99,3 | +37,5 | +23,6 |
| Mile | 115,4 | +53,6 | +39,7 |
| Torwächter | 92,3 | +30,4 | +16,5 |
| Skelett | 193,7 | **+131,8** | +117,9 |
| Ghul | 102,4 | +40,5 | +26,6 |
| Hund | 80,6 | +18,7 | **+4,8** |
| Rostpanzer | 130,9 | +69,1 | +55,2 |
| Warden | 142,8 | +81,0 | +67,1 |

**Befund 5.1:** Der **Held** hat auf dem Dorfboden **exakt null Luminanzkontrast** — er liest dort nur über Farbton (Violett gegen Lehm). Der **Grufthund** liegt bei +4,8 L praktisch unsichtbar. Am anderen Ende erschlägt das **Skelett** mit +131,8 L alles im Bild.

**Befund 5.2 — Silhouette (Umriss-`k`-Quote der Randtexel):**
Bran/Corm/Mile **100 %**, Hund/Ghul 94 %, Rost 92 %, Warden 91 %, Held side 90 %, Hedda 86 %, Held down 84 %, **Torwächter 70 %**, **Skelett 61 %**. `design/ART_DIRECTION.md:23` fordert „geschlossene k-Kontur" für **alle** Figuren — Torwächter und Skelett verletzen das messbar.

**Befund 5.3 — Breitenprofil (`profil.mjs`) erklärt den „Sack"-Eindruck.** Der Held ist über die Zeilen 6-16 durchgehend 12-14 px breit: keine Taille, keine vom Rumpf abgesetzten Arme. Bran hat über die Zeilen 16-23 ein **konstant 8 px breites Beinblock** — die Beine sind gar nicht getrennt. Standardabweichung der Breiten: Held 2,94, Bran 2,36, Hedda 2,12 — und die stammt fast nur aus Kopf- und Fußverjüngung.

## 6. KAPAZITÄTS-BILANZ

- `sprites.js`: **369 KB, 10 454 Zeilen**, 91 SPRITES + 340 TILE_ART. Charakter-Anteil: **57 Keys**.
- Canvases beim Boot: 91 + 340 + 37 Flips = **468**, alle winzig.
- **Befund 6.1 (neu):** Der Tint-Masken-Cache wächst stärker als `main.js:162` behauptet. Der K-Masken-Schlüssel trägt den Karten-Tint (`main.js:198`, `` `K:${tint}` ``), und es gibt **5 verschiedene `ambientTint`-Werte**. Pro Sprite-Canvas sind also bis zu **7** Masken möglich (5×K + WL + WR), nicht 3. Heute Obergrenze ~900, nach einem vollen Pass ~1 950 — speichertechnisch unkritisch (~2 MB), aber die Doku ist falsch.
- **Keine harte Grenze auffindbar.** Kein Wächter deckelt SPRITES-Keys, Dateigröße oder Canvas-Zahl.

**Kostenrechnung (Quelltextzeilen = Gridzeilen + 2):**

| | Grids | Zeilen | neue Flips |
|---|---|---|---|
| **Weg A** (16×24 behalten, Frames+Rampen) | 99 | **2 454** | 51 |
| **Weg B** (Neuschnitt 20×28) | 114 | **3 356** | 65 |

`sprites.js` wüchse auf ~12 900 (A) bzw. ~12 700 Zeilen (B, da 57 Altgrids ersetzt statt ergänzt werden).

---

## DIE 5 GRÖSSTEN RISIKEN

1. **Flip-Index ≤ 22.** Ein Einschub *vor* `shield_side` in `main.js:106-127` verschiebt die Hartkopien in `check_main_slice1.mjs:93-99` (12) und `check_inventory_slice2.mjs:137-144` (22) — `nameOf` labelt dann `player_side_*_flip`/`skeleton_*_flip` falsch, und beide Suiten kippen. **Nur anhängen.**
2. **Null Paletten-Reserve.** Jeder neue Kleiderton braucht einen Symbol-Key und damit eine Sanktion von `check_gfx4_art.mjs:16-19` **und** `check_gfx6_art.mjs:74-77`. Ohne diese Vorentscheidung läuft der Pass in eine Sackgasse, sobald echte Stofframpen gefordert sind.
3. **AABB-Berührung.** Der Sprite ist frei, die **AABB nicht**: sie steht in `smoke_test.mjs:3338-3341` und regiert über `w>=18 && h>=20` (`main.js:2559`) das Schattenprofil. Eine AABB-Erhöhung auf 18×20 kippt den Spieler unbemerkt auf BIG — plus Kollisions- und Balance-Folgen im gesamten Kampfcode.
4. **Kein Wohlgeformtheits-Gate auf Charakter-Grids.** `smoke_test.mjs:1766` prüft Zeilenbreiten nur für TILE_ART. Bei ~100 neuen handgepflegten Grids ist eine um ein Zeichen zu kurze Zeile fast sicher — und fällt erst als Laufzeitfehler auf. **Vor dem Pass einen additiven Gate nachziehen.**
5. **Der Held verschwindet im Dorf** (Δ 0,0 L). Wird bei den NPCs Kontrast nachgezogen, ohne den Helden mitzuziehen, verstärkt der Pass genau den Fehler, den Michael gemeldet hat.

## DIE 5 BILLIGSTEN GROSSEN HEBEL

1. **Rimlight-Sprache auf alle Figuren ausdehnen.** `Z` existiert, kostet keinen Ton, keinen Key, keinen Flip, keinen Test. 10 Figuren × ~6-10 Texel entlang der Oberkante. Löst den Jury-Punkt „kein Rimlight" **und** den Kontrastausfall von Held (+0,0 L) und Hund (+4,8 L) im Dorf in einem Zug.
2. **G-Stofframpe schließen.** Ein Ton `v` (L 76,5) in die 46,2-L-Lücke r→G macht aus dem „Nadelstreifen" eine Dreistufenrampe (24,7 / 21,5). Reiner Zeichentausch in 6 Grids, kein neuer Palettenton.
3. **Bran und Mile aus der Holzrampe holen.** 61 % bzw. 23 % ihrer Körpertexel teilen sich die Töne ihrer eigenen Gebäude. Ein Rampentausch auf zwei bisher charakterfreie Bereiche trennt sie sofort vom Hintergrund — 4 Grids.
4. **NPC-Laufzyklus verdrahten.** Die Wanderer gleiten heute mit 1,6-fps-Idle. `npcs.js:183-188` kennt bereits `_talk`-Sonderfälle; ein `_walk_0..3`-Zweig plus 8 Grids für Mile und Torwächter gibt zwei von fünf NPCs echte Bewegung. Die Flip-Canvases dieser beiden **existieren schon** (`main.js:126-127`).
5. **Silhouetten reparieren.** Torwächter 70 % und Skelett 61 % Umriss-Quote — beides Verstöße gegen `ART_DIRECTION.md:23`. Randtexel auf `k` ziehen, ~20 Texel je Figur, null Systemwirkung.

## EMPFEHLUNG: **16×24 verbessern — der 20×28-Schnitt ist verfrüht**

Die Messung stützt das eindeutig: **kein einziger gemessener Defekt stammt aus dem Maß.** Rimlight fehlt, Rampen sind offen, NPCs sind frontal und animationslos, Silhouetten sind undicht, Kontraste stimmen nicht — alles davon ist in 16×24 vollständig behebbar. Der Warden beweist es: dieselbe Engine, 18 Tonstufen, und er ist die stärkste Figur des Spiels.

Der Maßwechsel ist **technisch bemerkenswert billig** (siehe Kostenliste), aber er zahlt erst dann ein, wenn die Handwerksfehler weg sind — sonst produziert er 114 neue Grids mit denselben Mängeln, nur größer.

**Kostenliste WEG A — 16×24 vertiefen**
- 99 neue Grids, 2 454 Quelltextzeilen, 51 Flips (alle ans Ende → testneutral)
- Code: **0 Zeilen** in player.js/npcs.js/enemies.js/boss.js
- Code-Zusatz nur für neue *Zustände*: `npcs.js:183-188` Walk-Zweig, `player.js:210-225` Idle/Hurt-Zweige
- Tests: **kein einziger bestehender Gate wird rot.** `check_gp6_art_self` ist bereits abgelöst (`SLICE6_PHASE2_NOTIZEN.md:55-59`)
- Neu nötig: additiver Wohlgeformtheits-Gate für SPRITES-Grids
- Palette: 0 neue Töne, wenn Hebel 2 und 3 aus dem Bestand bedient werden

**Kostenliste WEG B — 20×28-Schnitt**
- 114 neue Grids, 3 356 Zeilen, 65 Flips; 57 Altgrids werden ersetzt
- Code: **1 Zeile** — `hud.js:590` (`- 24` → `- 28`)
- Tests: M5-Gate bleibt grün (nachgerechnet, 11 Texel); Canvas-Order-Mapping bleibt intakt (`Object.keys(SPRITES)` live); Maß-Gates auf SPRITES existieren nicht
- **Bedingung: die AABB bleibt bei 12×14.** Sonst `smoke_test.mjs:3338-3341` anfassen und die BIG-Schwelle prüfen
- Nebenwirkung: Seitenüberhang wächst von 2 auf 4 px je Seite — die Figur überlappt Nachbarkacheln stärker, was als „ich hänge an nichts fest" gelesen werden kann
- Palette: identisch zu Weg A

**Vorschlag für die Spec:** Weg A als Runde 1 (Handwerk: Rimlight, Rampen, Silhouetten, Kontraste, NPC-Walk), Michael am Gerät. Falls er dann *„die Figuren sind zu klein"* sagt — und nur dann — ist 20×28 ein sauber isolierter Folgeschnitt, der laut dieser Messung eine Zeile Code kostet.
