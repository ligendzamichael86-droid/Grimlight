# Technische Spezifikation — Slice 2 "Loot & Inventar"

Baut auf Slice 0/1/1.5 auf. Bindend bleiben `SPEC_SLICE_0.md`, `SPEC_SLICE_1.md`,
`SPEC_SLICE_1_5.md` und die Festlegungen aller Übergaben (Spawn-Anker = Zentrum,
attackId-Einmaltreffer, Knockback via moveWithCollision, Fußkanten-Test-Anker,
Over-Layer-Konventionen, Y-Sort nach Fußkante). Abweichungen nur wenn technisch
nötig, dann dokumentieren.

Diese Spec ist die Synthese eines 3-köpfigen Design-Panels (Systemdesign,
Engine-Architektur, Mobile-UX). Panel-Entscheidungen (bindend):

1. Bumerang macht **0 Schaden, nur Stun**. Das Schwert bleibt das einzige
   Tötungsverb (GDD Säule 1).
2. Inventar ist eine **7-Zeilen-Liste** (Name + Affix in einer Zeile), kein
   Icon-Raster. Keine Scroll-Geste im ganzen Spiel.
3. Volle Tasche: Item **bleibt liegen** (kein Auto-Vergolden wie beim Trank).
4. Bumerang liegt in einer **zweiten Truhe in der Katakomben-Westkammer**
   (keine Map-Geometrie-Änderung), bewacht von einem Rostpanzer-Skelett.
5. Die **Siegtruhe droppt KEINE Ausrüstung** (der Sieg beendet den Run 1,2 s
   später, das Item wäre totes Design; Gear-Jackpot ist die Bumerang-Truhe).
6. **Dritter Touch-Button 'W'** für die Zweitwaffe; Trank bleibt auf B.
   Dokumentierte GDD-Abweichung (GDD §7 sagt "maximal ein zweiter Button"):
   der Trank-Button existiert seit Slice 1 und Trinken unter Druck ist ein
   Kampf-Verb; Umbelegung würde gelerntes Verhalten brechen. Es bleibt bei
   diesen drei Buttons, für immer an denselben Positionen.
7. Affixe haben **feste Werte** (gewürfelt wird nur WELCHES Affix), max. 2 pro
   Item, 2 Seltenheitsstufen: Normal (1 Affix) und Selten (2 verschiedene).
8. Grabratte und Knochenwerfer aus dem GDD werden weiterhin NICHT gebaut
   (de facto in Slice 1 durch den Ghul ersetzt; eigener Posten, kein Beifang).

## 1. Umfang

1. **Item-System:** 3 Ausrüstungs-Slots (Waffe/Rüstung/Ring), 8 Affixe mit
   festen Werten, 2 Seltenheiten, abgeleitete Spieler-Stats (`computeStats`).
2. **Drop-System:** Gegner droppen Ausrüstung nach Tabelle, Pity-Zähler gegen
   Pechsträhnen, Auto-Pickup, seltene Boden-Items leuchten.
3. **Inventar-UI:** Vollpausierender `inventory`-Zustand, ein Panel mit Liste,
   Slots, Alt/Neu-Vergleich und ANLEGEN. Tastatur I/Tab, Touch über die
   HUD-Item-Box.
4. **Zelda-Zweitwaffe: Knochen-Bumerang** (fest, genau 1 Exemplar, Truhe in
   der Westkammer). Stun auf Distanz, kehrt zurück, keine Munition.
5. **Zwei neue Gegner:** Grufthund (Umkreisen, telegraphierter Sprungbiss,
   danach verwundbar am Boden) und Rostpanzer-Skelett (langsam, blockt
   frontal, seitlich/hinten verwundbar, droppt überdurchschnittlich Gear).
6. **HUD-Erweiterung:** Item-Box oben rechts (Zweitwaffen-Icon + Inventar-
   Öffner), Pickup-Popups, Touch-Button W.
7. **Grafikarbeit:** Sprites für Hund/Rostpanzer/Bumerang/Boden-Items/Icons.

## 2. Spielwerte (bindend)

### 2.1 Affix-Pool (feste Werte, keine Bereiche)

| Pool | Affix (stat) | Wirkung | Anzeige |
|---|---|---|---|
| Waffe | `dmg` +1 | Schwertschaden 1 → 2 | `+1 SCHADEN` |
| Waffe | `knockMult` +0,5 | Rückstoß auf Gegner ×1,5 | `+50% RUECKSTOSS` |
| Waffe | `reach` +4 | SWORD_REACH 12 → 16 | `+4 REICHWEITE` |
| Rüstung | `maxHp` +2 | 6 → 8 (1 Herz mehr) | `+1 HERZ` |
| Rüstung | `knockTakenMult` −0,5 | eigener Knockback ×0,5 | `STANDFEST` |
| Ring | `speedMult` +0,1 | Tempo 90 → 99 | `+10% TEMPO` |
| Ring | `potionHeal` +2 | Trank heilt 2 → 4 | `+1 HERZ JE TRANK` |
| Ring | `pickupRadius` +6 | Sammelradius 12 → 18 | `MAGNET` |

Regeln: Affixe nie doppelt auf einem Item, nie poolfremd, keine neuen Verben.
Stacking ist durch die Slots gedeckelt (je Slot genau 1 Item). Bewusst NICHT
im Pool: Angriffstempo (Säule 1), Schadensreduktion (entwertet Skelette).

Item-Namen (fest, ≤ 16 Zeichen): Waffe `Rostklinge` / selten `Gräberklinge`;
Rüstung `Knochenharnisch` / selten `Grabwachtpanzer`; Ring `Siegelring` /
selten `Seelenring`. Seltenheitsfarben: Normal `#d6cbb1`, Selten `#92aec0`
(Stahlblau; Gold `#f0bf4e` bleibt exklusiv für Gold).

### 2.2 Drop-Tabelle

| Quelle | Gear-Chance | davon Selten | Slot-Gewichtung | bestehende Drops |
|---|---|---|---|---|
| Skelett | 4 % | 10 % | je 1/3 | 1-3 Münzen (bleibt) |
| Ghul | 8 % | 20 % | je 1/3 | 1-3 Münzen, 20 % Trank (bleibt) |
| Grufthund | 10 % | 20 % | je 1/3 | 1-3 Münzen |
| Rostpanzer | 35 % | 25 % | Rüstung 50 / Waffe 25 / Ring 25 | 2-4 Münzen |
| Vasen/Urnen | 0 % | | | 60/25/15 bleibt |
| Siegtruhe | 0 % (Entscheidung 5) | | | 8-12 Münzen (bleibt) |
| Bumerang-Truhe | Bumerang (fest) | | | keine Münzen |

**Pity-Regel:** `inv.pity` zählt Gegner-Kills ohne Gear-Drop. Ab 12 ist der
nächste Kill ein garantierter Normal-Drop (Slot uniform). Jeder Gear-Drop
(auch der garantierte) setzt auf 0 zurück.

### 2.3 Gegnerwerte

**Grufthund** (`kind: 'hound'`, AABB 14×12, HP 4, knockFactor 1):
Zustände `wander | circle | telegraph | leap | down | die`.

| Wert | Zahl |
|---|---|
| sight / wander-Tempo | 110 / 30 |
| Annäherungstempo (bis Orbit) | 75 |
| Orbit: Tangentialtempo / Zielradius | 70 / 56 px (Richtungswechsel zufällig alle 1,5-2,5 s oder bei Wandklemmen) |
| Sprung-Ansatz | nach 2-3 s Orbit → telegraph 0,5 s (steht, Duck-Sprite) |
| Sprungrichtung | eingeloggt 0,2 s NACH Telegraph-Beginn (kein Homing danach) |
| Sprung (leap) | 200 px/s, 0,35 s, durch moveWithCollision |
| Liegen (down) | 1,2 s: keine Bewegung, KEIN Kontaktschaden, normal verwundbar; letzte 0,3 s Aufsteh-Blinken; danach 1 s Sprungsperre (zurück in circle) |
| Kontaktschaden | 1 laufend, 2 während leap, 0 während down |
| Spawns | Friedhof tc(18,10), tc(15,19); Katakomben tc(20,4), tc(20,17) |

**Rostpanzer-Skelett** (`kind: 'rust'`, AABB 14×16, HP 5, Kontakt 2,
knockFactor 0,3, dropTable itemChance 0,35):

| Wert | Zahl |
|---|---|
| wander / chase / sight | 12 / 20 / 70 |
| Blickrichtung `faceX/faceY` | auf 4 Himmelsrichtungen GERASTET, aus der Bewegungsrichtung, aktualisiert höchstens alle 0,4 s (träge Drehung = Schwachstelle) |
| Block | Angriffsursprung im Frontkegel: `dot(norm(Ursprung−Zentrum), face) > 0,5` (±60°) → 0 Schaden, kein Knockback, hitAttackId trotzdem gesetzt, `blockFlash = 0,15`, Event `'attack_blocked'`. Gilt für Schwert UND Bumerang. |
| Spawns | nur Katakomben: tc(7,14) (Wache Bumerang-Truhe), tc(14,12) (Westgang), tc(33,16) (Schatzkammer) |

Builder darf Spawn-Tiles um ±1 verschieben, wenn der Walkability-Check es
verlangt; der Smoke-Test prüft alle Spawns ohnehin auf begehbaren Tiles.

### 2.4 Knochen-Bumerang

1. Wurf per `input.secondary` (Flanke), nur wenn `inv.zelda` ihn enthält,
   keiner in der Luft ist und `player.state` weder `dead` noch `hurt` ist
   (während `attack` erlaubt). Nach der Rückkehr 0,2 s Nachwurfsperre.
2. Flug: 150 px/s in Blickrichtung beim Wurf, max. 64 px (4 Tiles) oder bis
   Wand/Treffer, dann Rückflug zum Spielerzentrum, beschleunigend 150 → 220
   px/s, fängt den Spieler immer (Fang-Radius 10, kein Kollisionstest im
   Rückflug gegen Wände: er fliegt „über" sie zurück wie in LttP).
3. **Schaden 0.** Wirkung pro Treffer (`hitIds`-Set je Flug, Einmal-Treffer):
   Skelett/Ghul `stunTimer = 1,5`; Grufthund in circle/telegraph/leap →
   sofort `down` (1,5 s); Rostpanzer frontal geblockt (Event
   `'attack_blocked'`, Rückflug beginnt), seitlich/hinten `stunTimer = 1,0`.
   Stun: Timer runterzählen, keine Bewegung, kein Kontaktschaden, verwundbar;
   Sprite wackelt ±1 px horizontal (deterministisch aus timeSec, KEIN Blinken,
   Blinken bedeutet Schaden).
4. Jeder Treffer (Gegner, Prop, Wand) startet den Rückflug; auf dem Rückflug
   sind weitere Stuns möglich (hitIds verhindert Doppel-Treffer).
5. Utility: markiert berührte Vasen/Urnen mit `boomerangHit = true`
   (updateProps behandelt das wie einen Schwert-Treffer; **Truhen ignorieren
   das Flag**, Truhen öffnen nur per Schwert). Markiert berührte coin/potion-
   Drops mit `magnet = true` (updateDrops zieht sie mit 180 px/s via
   moveWithCollision zum Spieler); item-Drops werden NICHT magnetisiert.
6. Erhalt: Bumerang-Truhe (`content: 'boomerang'`) in der Westkammer bei
   tc(4,16); Öffnen setzt `inv.zelda = ['boomerang']` direkt (kein Boden-
   Drop), Event `{type:'weapon_found'}`, Popup `KNOCHEN-BUMERANG!`. Diese
   Truhe pusht NIEMALS `'chest_opened'` (Sieg-Event bleibt exklusiv bei der
   Siegtruhe, `content: 'treasure'`, Default für bestehende Truhen).

### 2.5 Balance-Leitplanke (für S3 notiert, nicht implementieren)

Nackt: 6 HP + 6 Heilung, DPS ~2. Median Ende S2: 8 HP, Schwert 2, Tempo 99.
Best Case: 8 HP + 12 Heilung, Schwert 2. Der S3-Boss wird auf den Median
balanciert (Richtwert HP 24-28, Schlag 2); Best Case darf höchstens 35 %
schneller töten, nachjustiert wird über Boss-HP, nie über Drop-Nerfs.

## 3. Neue/geänderte Interfaces (bindend)

### js/items/items.js — NEU (Besitz: Builder A)

```js
export const BASE_STATS = { dmg: 1, maxHp: 6, speed: 90, reach: 12,
  knockMult: 1, knockTakenMult: 1, potionHeal: 2, pickupRadius: 12 };
export const AFFIXES = { /* 8 Einträge aus §2.1: {slot, value, label} */ };

export function rollItem(rng = Math.random, opts = {})
// opts: { slot?: 'weapon'|'armor'|'ring' (default: uniform gewürfelt),
//         rare?: boolean (default false) }
// → { slot, name, rare, affixes: [{ stat, value }] }  // 1 Affix, selten 2 verschiedene
// KEIN id-Feld: Inventar-Operationen laufen über den Array-Index.

export function createInventory()
// → { items: [], equipped: { weapon: null, armor: null, ring: null },
//     capacity: 7, zelda: [], pity: 0, newFlag: false }
// Plain JSON! Keine Funktionen, keine Klassen (S4-Save: JSON.stringify
// muss verlustfrei sein).

export function addItem(inv, item)     // → true | false (voll); bei Erfolg
                                       // inv.newFlag = true
export function equipItem(inv, index)  // tauscht mit equipped[item.slot]; das
                                       // alte Item landet am selben Index.
                                       // Leerer Slot: items[index] per splice
                                       // entfernen (Liste rückt auf).
                                       // Fehlendes items[index]: false, keine
                                       // Änderung. → bool
export function computeStats(inv, base = BASE_STATS)
// → neues Stats-Objekt: flache Affixe addiert, speedMult multiplikativ
//   (speed = base.speed * (1 + speedMult-Summe), auf 2 Nachkommastellen
//   gerundet — 90 * 1.1 ist in Doubles NICHT exakt 99), knockTakenMult
//   minimal 0,5.
```

**Zentrale Regel:** Kampfcode liest NIE Affixe, immer nur `player.stats`.

### js/core/input.js — ERWEITERT (Besitz: Builder A)

```js
// NEU (alles Pegel, Flanken macht der Verbraucher):
// input.secondary — Taste L oder Touch-Button W
// input.inventory — Taste I oder Tab, oder Touch-Start in der HUD-Box-Zone
// input.tap — { x, y } des letzten touchstart in 320×180-Koordinaten,
//             null wenn keiner; wird in postUpdate() gelöscht (fürs Inventar-UI)
// touch.buttons: NEU Button W { x: 284, y: 106, r: 14, label: 'W', visible: false }
//   — main.js setzt visible, hud.js zeichnet nur sichtbare Buttons.
// input.hudBoxVisible (bool, von main.js gesetzt): HUD-Box-Zone Rechteck
//   (290,0)-(320,30). Prüfreihenfolge bei touchstart: HUD-Box → W → B →
//   Joystick/Angriff (Startpunkt-Ausnahme-Muster aus Slice 1). WICHTIG:
//   HUD-Box-Zone und W-Kreis greifen NUR wenn sichtbar (hudBoxVisible bzw.
//   buttons[2].visible), sonst fällt der Touch in die normale Zonenlogik
//   (keine toten Angriffszonen vor dem Bumerang-Erhalt).
// Tastatur: I, Tab und L kommen in die preventDefault-Liste (Tab würde sonst
//   den Browser-Fokus wechseln → blur → Fokus-Reset).
```

Bestehende Felder und Verhalten unverändert (inkl. Fokus-Reset: neue
Id-Sets und input.tap dort mitleeren).

### js/world/maps.js — ERWEITERT (Besitz: Builder A)

```js
// NEU je Map: enemySpawns: [{ x, y, kind: 'hound' | 'rust' }]
// (skeletonSpawns/ghoulSpawns bleiben unangetastet, Migration erst S3)
// GRAVEYARD.enemySpawns: 2 Hunde (§2.3); CATACOMBS.enemySpawns: 2 Hunde + 3 Rostpanzer
// CATACOMBS.propSpawns: NEU { ...tc(4,16), kind: 'chest', content: 'boomerang' }
//   — die bestehende Vase bei tc(4,16) wandert dafür nach tc(4,17)
//   (begehbar, geprüft; sonst stapeln sich Truhe und Vase auf einem Tile).
// Die bestehende Siegtruhe bekommt content: 'treasure' (Default in props.js,
// bestehende Maps müssen NICHT alle angefasst werden).
```

### js/entities/entity.js — ERWEITERT (Besitz: Builder B)

```js
// Events dürfen jetzt String ODER Objekt { type, ...payload } sein.
export function hasEvent(events, type)
export function getEvent(events, type) // → erster passender Eintrag oder null
```

### js/entities/enemies.js — ERWEITERT (Besitz: Builder B)

```js
export function createHound(spawn)  // Werte §2.3
export function createRust(spawn)   // Werte §2.3
export function createEnemy(spawn)  // Dispatch über spawn.kind ('hound'|'rust')
// scatterDrop(drops, map, cx, cy, kind, item = null) — Drop-Objekt trägt
//   optional item; kind neu: 'item'.
// updateEnemies: Stun-Check NACH dem Schwert-Treffer-Block und NACH dem
//   Knockback-Block, VOR Verhaltens-Dispatch und Kontaktschaden:
//   if (e.stunTimer > 0) { e.stunTimer -= dt; continue; }
//   Schwert-Treffer und deren Knockback wirken im Stun also normal
//   (Gegner bleibt verwundbar), nur Verhalten und Kontaktschaden ruhen.
// Verhaltens-Dispatch statt des wander/chase-Blocks:
//   (BEHAVIORS[e.kind] || updateWanderChase)(dt, e, player, map)
//   — der generische Pfad bleibt WÖRTLICH stehen (Skelett/Ghul-Regression!).
// Hound-Kontaktschaden je Zustand: das Behavior mutiert e.contactDamage
//   (wander/circle/telegraph 1, leap 2, down 0); der generische Kontakt-
//   Block bleibt unverändert, wird aber bei e.contactDamage === 0 übersprungen.
// Schwert-Treffer-Block: Schaden = player.stats?.dmg ?? 1; Knock-Tempo
//   × (player.stats?.knockMult ?? 1); davor isBlocked(e, pcx, pcy)-Check
//   (nur kind 'rust', §2.3) — geblockt: hitAttackId setzen, blockFlash =
//   0,15, Event 'attack_blocked', KEIN Schaden, KEIN Knockback.
// spawnDeathDrops(e, map, drops, player): würfelt zusätzlich Gear nach
//   §2.2 (e.dropTable = { itemChance, rareChance, slotWeights? }) inkl.
//   Pity über player.inv; Item via rollItem und scatterDrop(..., 'item', item).
// updateDrops: Pickup-Radius = player.stats?.pickupRadius ?? 12;
//   kind 'item': addItem-Versuch → Event {type:'item_pickup', item} und Drop
//   weg; bei false bleibt der Drop liegen, Event 'inventory_full' und
//   d.retryTimer = 1,0 (erst danach erneut prüfen). magnet-Drops (§2.4)
//   fliegen mit 180 px/s zum Spieler; magnet erlischt nach 1 s ohne
//   Fortschritt (Wandecken-Schutz).
// Event-Formen: alle VOR Slice 2 existierenden Events bleiben Strings;
//   Objektform NUR für item_pickup und weapon_found. attack_blocked und
//   inventory_full sind Strings.
// drawDrop: kind 'item' zeichnet item_<slot> (aus d.item.slot) plus
//   sparkle_0/1-Glint alle 1,2 s; Name/Farbe erscheinen erst im Pickup-Toast.
// drawEnemy: neue Kinds inkl. Zustands-Sprites (§3 Art); Rostpanzer zeichnet
//   ZUSÄTZLICH das Schild-Overlay auf der face-Seite; blockFlash > 0 →
//   block_spark am Schild. Stun-Wackeln ±1 px.
```

### js/entities/player.js — ERWEITERT (Besitz: Builder B)

```js
// import { createInventory, computeStats } from '../items/items.js';
// NEU: player.inv = createInventory(); player.stats = computeStats(player.inv);
// player.recalcStats(): stats neu ableiten, maxHp = stats.maxHp,
//   hp = min(hp, maxHp)  (Anlegen heilt NICHT, Ablegen kappt).
// SPEED → player.stats.speed; SWORD_REACH → player.stats.reach;
// POTION_HEAL → player.stats.potionHeal; hurt(): KNOCK_SPEED ×
//   player.stats.knockTakenMult. Alle sonstigen Konstanten unverändert.
```

### js/entities/props.js — ERWEITERT (Besitz: Builder B)

```js
// createProps: Spawn-Feld content ('treasure' Default | 'boomerang') an
//   Truhen durchreichen.
// updateProps: Signatur unverändert; zusätzlich p.boomerangHit === true wie
//   Schwert-Treffer behandeln (Vase/Urne; Truhen ignorieren das Flag, Flag
//   danach löschen). Truhe mit content 'boomerang': öffnet per Schwert,
//   setzt player.inv.zelda = ['boomerang'] und inv.newFlag = true, Event
//   {type:'weapon_found'}, KEINE Münzen, KEIN 'chest_opened'. Truhe
//   'treasure': exakt wie bisher. boomerangHit wird auch bei Truhen gelöscht
//   (nur ignoriert, nicht behalten).
```

### js/entities/projectiles.js — NEU (Besitz: Builder B)

```js
export function createProjectiles()
// → { list: [],  // { x, y, w: 8, h: 8, phase: 'out'|'return', dirX, dirY,
//                //   traveled, hitIds: Set, lockTimer }
//     update(dt, input, player, enemies, props, map, drops, events) }
// Eigene Flankenerkennung auf input.secondary (Muster potionHeld).
// Verhalten komplett nach §2.4. Node-importierbar, kein Browser-Bezug.
export function drawProjectile(ctx, cam, p, gfx, timeSec)
// boomerang_0/1 im Wechsel (Rotation), größenagnostisch zentriert.
```

### js/ui/inventory_ui.js — NEU (Besitz: Builder C)

```js
export function createInventoryUI()
// → { cursor: 0..6, open(), update(input, player) → 'close' | null }
// main.js ruft beim Öffnen ui.open(): ALLE internen Held-Flags (inventory,
// confirm/attack, dir) starten auf true und lösen erst nach einem gesehenen
// Loslassen aus — sonst schließt die noch gedrückte I-Taste das Panel im
// selben Frame wieder (Flanken-Doppelzählung).
// update macht EIGENE Flankenerkennung (dir hoch/runter = Cursor 1D durch
// die Liste, confirm/attack = ANLEGEN via equipItem + player.recalcStats(),
// inventory-Flanke = 'close'). Touch: input.tap-Hittest auf Zeilen
// (48..304 × je 16 px ab y 26), ANLEGEN-Button (232,142 / 72×22),
// X-Button (288,10 / 20×20). Logik OHNE ctx → headless testbar.
export function drawInventoryUI(ctx, ui, player, gfx)
```

Layout (bindend, aus dem UX-Panel): Panel (8,8)-(312,172), Grund `#14101a`
Alpha 0,92, Doppelrahmen `#575061`/`#3a3542`. Links Slot-Spalte x 16..36:
vier 20×20-Slots (Waffe y26, Rüstung y50, Ring y74, Zweitwaffe y98 mit
Goldrahmen, fest, nicht tauschbar); leere Slots zeigen dunkle Geister-Icons.
Rechts Liste x 48..304, 7 Zeilen à 16 px ab y 26: Icon 12×12, Name links
(Seltenheitsfarbe), Affixe rechtsbündig. Kopfzeile: `AUSRUESTUNG`, Gold,
X-Button. Fußzeile y 142..166: links Vergleich `SCHADEN 1 > 2` (besser
`#f0bf4e`, schlechter `#ae2f2a`) + `angelegt: <Name>`; ohne Auswahl
Gesamtwerte `HERZ 3  SCHADEN 1  TEMPO 100%`; rechts ANLEGEN-Button 72×22.
Panel bleibt nach ANLEGEN offen. 8px monospace, Font wie HUD.

### js/ui/hud.js — ERWEITERT (Besitz: Builder C)

```js
// Item-Box 20×20 bei (296,4), Alpha 0,75: Icon der Zweitwaffe (oder leer),
//   Zustand aus player.zeldaState (von main.js gespiegelt): ausgegraut bei
//   'air', 3-Frame-Weißblink beim Fang; roter Neu-Punkt 3×3 solange
//   inv.newFlag. Box erscheint erst, wenn inv.zelda ODER inv.items/equipped
//   etwas enthält.
// Touch-Buttons: nur Buttons mit visible !== false zeichnen (W erst mit
//   Bumerang sichtbar).
// export function drawPickupToast(ctx, camera, player, toast)
//   toast = { text, color, t } — schwebt in 0,9 s um 8 px über dem Spieler-
//   Kopf nach oben, danach null. Ein Toast gleichzeitig, neuer ersetzt alten.
```

### js/main.js — ERWEITERT (Besitz: Builder C)

```js
// NEU Zustand 'inventory': aus 'playing' per Flanke auf input.inventory
//   (Muster potionHeld, Flanke in main.js), zurück per ui.update → 'close'.
//   HARTE PAUSE: keine Welt-Updates, timeSec läuft weiter (Fackel-Flackern);
//   victoryTimer pausiert mit. Die Öffnen-Flanke wird NUR ausgewertet, wenn
//   fadePhase === 'none', und NACH der Event-Auswertung (Tod hat Vorrang,
//   bestehende Prüfreihenfolge). render: drawWorld() (eingefrorener Zustand)
//   → Dunkel-Overlay Alpha 0,6 → drawInventoryUI. Beim Öffnen ui.open() und
//   inv.newFlag = false; consumeConfirm() an BEIDEN Übergängen. In
//   title/gameover/victory NICHT erreichbar.
// buildWorld: projectiles = createProjectiles(); enemies zusätzlich aus
//   mapDef.enemySpawns über createEnemy; carry-Reihenfolge FEST: erst
//   player.inv = prev.inv (Referenz), dann recalcStats(), dann hp/gold/
//   potions kopieren (hp = min(prev.hp, maxHp)). resetRun wie gehabt
//   (frisches Inventar).
// update (playing): projectiles.update NACH player.update, VOR updateEnemies
//   (Stun wirkt im selben Tick).
// events: main liest über hasEvent/getEvent (entity.js). Toast setzen bei
//   item_pickup (Name, Seltenheitsfarbe), weapon_found (KNOCHEN-BUMERANG!),
//   inventory_full (TASCHE VOLL, gedrosselt durch retryTimer).
// drawWorld: Projektile als renderables (fy = p.y + p.h, drawProjectile);
//   drawPickupToast NACH dem HUD.
// main.js spiegelt pro Frame player.zeldaState = 'none' | 'ready' | 'air'
//   (+ kurzer Fang-Blink-Timer) für die HUD-Item-Box — drawHUD behält seine
//   Signatur (ctx, player, input, gfx) und kennt projectiles nicht.
// Lights: pro Frame lights-Array = Fackeln + playerLight + je ein Licht
//   { radius: 18, flicker: 0.3 } pro liegendem SELTENEN item-Drop
//   (der Diablo-Moment: guter Loot leuchtet im Dunkeln).
// Flip-Liste ERGÄNZEN: hound_0/1/telegraph/leap/down/die, rust_0/1/die,
//   shield_side (fehlende Flips waren schon einmal ein Bug).
// input.touch.buttons[2].visible und input.hudBoxVisible werden nur in den
//   Zuständen playing/inventory aktualisiert (im title ist player null).
```

### js/art/palette.js + sprites.js — ERWEITERT (Besitz: Art)

Alle bestehenden Schlüssel bleiben kompatibel. Neue SPRITES:

1. `hound_0/1` (Lauf 16×12), `hound_telegraph` (geduckt: 2 px flacher,
   2 px länger), `hound_leap` (gestreckt), `hound_down` (Bauchlage),
   `hound_die` — Silhouetten je Zustand klar unterscheidbar (3-Kanal-
   Telegraphie: Form + Helligkeit + Bewegungsstopp).
2. `rust_0/1` (16×18, massig, rostige Rampe), `rust_die`; Schild-Overlays
   `shield_side` (+ Flip), `shield_up`, `shield_down` — Schild liest sich
   als eigene Fläche VOR dem Körper; Rücken zeigt helle Rippen als
   permanenten „hier rein"-Hinweis. `block_spark` (8×8 Funkenstern).
3. `boomerang_0/1` (10×10, Rotations-Frames, Knochen-Look).
4. Boden-Items `item_weapon`, `item_armor`, `item_ring` (10×10) +
   `sparkle_0/1` (8×8 Glint-Overlay, alle 1,2 s über Boden-Items).
5. UI-Icons `icon_weapon`, `icon_armor`, `icon_ring` (12×12; auch dunkel
   als Geister-Slot nutzbar), `icon_boomerang` (16×16, HUD-Box + Slot).

Palette: vorhandene Rampen bevorzugen; neue Farben nur wenn nötig (Rost).
Selbstcheck wie gehabt (Zeilenlängen, Palettendeckung, alte Schlüssel).

## 4. Tools / Tests (Besitz: Builder C, konsolidiert am Ende)

`tools/smoke_test.mjs`, neue Abschnitte 22-29:

1. **22 Items:** rollItem mit Fest-rng → 1 bzw. 2 verschiedene Pool-Affixe,
   feste Werte korrekt; createInventory über JSON.stringify/parse deep-equal
   (Plain-JSON-Wächter für S4).
2. **23 Inventar + Stats numerisch:** addItem bis capacity 7 dann false;
   equipItem tauscht (altes Item am selben Index; leerer Slot: splice;
   ungültiger Index: false); computeStats mit +1-Waffe und +10%-Ring EXAKT
   `{dmg: 2, speed: 99}` (Rundung §3 items.js); Rüstung +2 anlegen und durch
   eine Rüstung OHNE maxHp-Affix ersetzen kappt hp auf maxHp; Anlegen heilt
   nicht.
3. **24 Statswirkung im Kampf:** mit dmg-2-Stats stirbt das Skelett in genau
   1 Treffer, der Ghul in 2; Gegenprobe ohne Items: 2 und 4 (S1-Regression).
4. **25 Item-Drop-Fluss:** Rostpanzer-Tod mit itemChance 1 → Drop kind
   'item' mit map-Referenz; Berührung + Platz → item_pickup und Item im
   Inventar; volles Inventar → Drop bleibt, 'inventory_full' höchstens
   einmal je retryTimer-Fenster; Pity: inv.pity = 12 und itemChance 0 →
   trotzdem Drop, pity 0.
5. **26 Bumerang:** Flanke wirft nur mit zelda-Eintrag, nur einer in der
   Luft; fliegt max. 64 px, kehrt zurück, wird gefangen; Skelett-Treffer:
   hp UNVERÄNDERT + stunTimer 1,5; gestunnter Gegner bewegt sich nicht und
   macht keinen Kontaktschaden; Vase mit boomerangHit zerbricht; Truhe
   reagiert nicht; magnet-Drop erreicht den Spieler.
6. **27 Grufthund:** über 2 Sim-Sekunden bleibt der MEDIAN des circle-
   Abstands im Band 40-75 px (Orbit hat Zufalls-Richtungswechsel, Assert
   tolerant über den Median);
   vor jedem leap ein telegraph; nach leap down (kein Kontaktschaden, aber
   Schwert-Treffer zählt); Bumerang in telegraph → sofort down.
7. **28 Rostpanzer:** Schwert frontal → hp unverändert + 'attack_blocked';
   von der Seite → hp sinkt; 5 Seitentreffer töten; faceDir rastet auf
   Himmelsrichtungen und wechselt nicht schneller als alle 0,4 s.
8. **29 Inventar-UI headless:** createInventoryUI in Node; Cursor per
   simulierten dir-Flanken; confirm equipped das markierte Item und
   player.stats.dmg steigt messbar; inventory-Flanke liefert 'close'.

Bestehende Abschnitte MÜSSEN grün bleiben (besonders 11 Truhen-Sieg und die
Skelett/Ghul-Werte). EINZIGE erlaubte Anpassung: der bestehende Check
"CATACOMBS hat genau 1 Truhe" wird ersetzt durch "genau 1 Truhe mit content
'treasure' (Default zählt mit) und genau 1 mit content 'boomerang'".
Maps-Checks decken NEU auch enemySpawns ab (begehbar, kind-Werte gültig).

Flusstest NEU `.tmp/check_inventory_slice2.mjs` (headless, Browser-Mock wie
die bestehenden): Spawn → erzwungener Item-Drop → hinlaufen → item_pickup →
Inventar öffnen (Welt eingefroren: Gegnerpositionen vor/nach identisch) →
anlegen → Stats numerisch belegt → schließen → Skelett stirbt in 1 Hieb
(bei +1-Waffe). **Positions-Asserts ausschließlich in Fußkanten-Anker-
Konvention** (x = Sprite-Zentrum, y = Sprite-Unterkante, bindende
Festlegung Slice 1.5). Bestehende Flusstests (check_main_slice1,
check_victory_slice1) bleiben unverändert grün.

## 5. Abnahmekriterien Slice 2

1. `bash tools/check_syntax.sh`, `node tools/smoke_test.mjs` (inkl. 22-29),
   beide alten Flusstests und der neue Inventar-Flusstest grün.
2. Browser Friedhof: Grufthunde umkreisen, springen sichtbar telegraphiert,
   liegen danach; Item-Drop mit Funkeln + Popup; Auto-Pickup.
3. Browser Katakomben (`?map=CATACOMBS`): Rostpanzer blockt frontal sichtbar
   (Funken), fällt von hinten; Westkammer-Truhe gibt den Bumerang (Popup,
   HUD-Box + W-Button erscheinen); Bumerang stunnt, holt Drops, öffnet das
   Hund-Fenster; seltenes Boden-Item leuchtet.
4. Inventar: öffnet per I/Tab und HUD-Box-Tap, Welt pausiert hart, Anlegen
   wirkt sofort messbar (HUD-Herzen bei +1 Herz), Panel-Layout wie §3.
5. Sieg-Pfad unverändert: Siegtruhe → Münzregen → Sieg-Banner; Game Over
   unverändert.
6. Kein einziger Konsolen-Fehler im Playwright-Proof (Friedhof +
   `?map=CATACOMBS` + Inventar offen + Bumerang-Wurf).

Abnahme-Screenshots: s2_01 Friedhof Hund-Orbit, s2_02 Hund down + Schwert,
s2_03 Katakomben Rostpanzer-Block, s2_04 Bumerang im Flug, s2_05 Inventar
offen mit 2+ Items, s2_06 seltenes Item leuchtet am Boden, s2_07 HUD mit
Item-Box + W-Button (Touch-Overlay aktiv).
