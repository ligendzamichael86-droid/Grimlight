# Slice-6-Landkarte (14.08.2026, wf_3392dc4c-609)


---

# TEIL A: Engine-Systeme

## AUFTRAG A — Engine-Fähigkeiten & System-Lücken für Slice 6

Basis: HEAD `e3bce1a`, `node tools/smoke_test.mjs` = **GRÜN** (7654 Ticks) als Ausgangsmessung. Sonden liegen in `/home/coder/Grimlight/.tmp/slice6_probe/` (4 Stück, `git status` sauber, `game/`/`tools/`/Tests unberührt, kein Port belegt).

---

# 1. NPC-GRUNDLAGE

## 1.1 Was das Entity-System hergibt — und was nicht

**Nicht wiederverwendbar: `registerEnemyKind`.** `enemies.js:172-176` registriert nur in `CREATORS`/`BEHAVIORS` (`:426`)/`DRAWERS` (`:433`). Alles, was danach im `enemies`-Array liegt, läuft zwangsweise durch `updateEnemies` (`enemies.js:435-534`): Schwert-Hitbox-Test (`:457`), Kontaktschaden (`:525-533`), XP-Vergabe (`:489`), `spawnDeathDrops` (`:447`), plus Bumerang-Treffer (`projectiles.js:125`). Ein friedliches Wesen dort wäre schlagbar, tötbar und lootbar. **Ein eigenes `npcs.js` mit eigenem Array ist zwingend.**

**Wiederverwendbar (wörtlich übernehmbar):**

| Baustein | Beleg | Nutzung für NPCs |
|---|---|---|
| Spawn-Konvention (Weltpixel = AABB-**Zentrum**) | `maps.js:4-5`, `enemies.js:30-34` | `npcSpawns: [{x,y,kind}]` identisch |
| `moveWithCollision` (Achsen getrennt, Sub-Steps < 16 px) | `entity.js:31-57` | Schlender-NPCs |
| `aabbOverlap` | `entity.js:9-11` | Reichweiten-/Berührungstest |
| wander-Muster (Timer 1-2 s, Zufallswinkel) | `enemies.js:276-288` | „Dorfbewohner geht auf und ab" |
| Fußkanten-Anker beim Zeichnen (größenagnostisch) | `enemies.js:636-641`, `props.js:134-138` | 16×24-NPC über 12×14-AABB |
| 2-Frame-Zyklus mit `ANIM_RATE` | `enemies.js:605, 628-630` | Idle-Atmung |
| Pro-Frame-Listen statt statischer Arrays (Elite-Lichter) | `enemies.js:682-690`, `main.js:2299-2301` | Laternen-Licht am Händler |

## 1.2 Kollision: die eine echte Lücke

**Es gibt im ganzen Projekt keine Entity-gegen-Entity-Kollision.** `moveWithCollision` prüft ausschließlich `map.rectCollides` (`entity.js:49`), Gegner laufen durcheinander hindurch, Props sind bewusst nicht solide (`props.js:9`).

Zwei Wege:
- **(a) Solide Legenden-Kachel unter dem NPC** — null Engine-Änderung. Der Spieler bleibt an der Kachel hängen, der Sprite wird darüber gezeichnet. Für eine **neue** Karte kostenlos, weil deren Soliditäts-Raster noch keinen Golden-Hash hat.
- **(b) `npcCollides(npcs, box)` in `npcs.js`** — braucht dann einen Eingriff in `player.js:153` (der einzige Bewegungsaufruf des Spielers). Das öffnet `entities/player.js`, die am strengsten geschützte Datei. **Nicht empfohlen für Slice 6.**

## 1.3 Y-Sort, Schatten, Licht — alles additiv

- `renderables`-Bau `main.js:2360-2378`; `pushTinted(ent, drawFn)` (`:2361-2366`) setzt Fußkante, Abtastpunkt, Warm/Kalt-Tönung. Eine Zeile `for (const n of npcs) pushTinted(n, () => drawNpc(tintCtx, camera, n, gfx, timeSec));` reicht.
- Weichschatten: `main.js:2314-2316` — eine analoge Zeile. Profil-Umschaltung hängt an `w >= 18 && h >= 20` (`:2210`), NICHT am `kind` (`:2202-2205`) → ein 12×14-NPC erbt automatisch das Standardprofil.
- `TINT_PREV` ist eine `WeakMap` über Objektidentität (`main.js:249, 2337`) → Map-Wechsel leakt nicht.

## 1.4 Interaktions-Reichweite und „Benutzen"-Input

**Es gibt keine Interaktions-Mechanik.** Nächstliegende Präzedenzfälle: `PICKUP_RADIUS = 12` bzw. `player.stats.pickupRadius` (`enemies.js:24, 540`) und die Schwert-Reichweite `stats.reach = 12` (`items.js:17`, `player.js:166-175`).

**Belegte Tasten** (`input.js:51-62`): W/A/S/D + Pfeile, `KeyJ`/`Space` (Angriff), `KeyK`/`KeyE` (Trank), `Enter`/`Space` (Confirm), `KeyL` (Zweitwaffe), `KeyI`/`Tab` (Inventar), `Escape`/`KeyP` (Pause).
**Falle:** `KeyQ` ist nicht frei nutzbar — `smoke_test.mjs:5564` benutzt genau diese Taste als „neutrale Taste" für den Audio-Unlock.

**Touch-Zonen** (`input.js:107-119`): A r16 (288,148), B r12 (252,144), W r14 (284,102), Pause r12 (232,14). Prüfreihenfolge `input.js:227-250`. Die Ergonomie-Gates (`input.js:97-113`, gemessen in `smoke_test.mjs:4047`): jeder Kreis ≥ 9 mm Durchmesser (r ≥ 12), Lücken B↔W ≥ 16 px, A↔W ≥ 12 px, Unterkante ≥ 24 px über dem Canvas-Rand.

**Empfehlung: kein neuer Knopf.** „Reden" auf den **Angriffs-Pegel** legen, solange ein NPC in Reichweite und in Blickrichtung steht (Zelda-Muster). Vorteile: `input.js` bleibt unangetastet, keine neue Touch-Zone, kein neues Ergonomie-Gate, keine tote Angriffsfläche. Der Angriff selbst wird in diesem Frame unterdrückt — technisch exakt das bestehende Muster `attackSwallow` (`main.js:1688-1691`).

## 1.5 Was eine `entities/`-Öffnung kostet

Das Tabu ist **keine Dauerregel, sondern Grafikpass-Disziplin**: `SPEC_GRAFIKPASS_2.md:29`, `_3.md:43`, `_4.md:61`, `_5.md:57`, `_6.md:157`, dazu `SPEC_SLICE_4.md:44` und `SPEC_SLICE_5.md:15`. In den **Gameplay-Slices war `entities/` immer offen** — `entities/boss.js` (336 Zeilen) ist in Slice 3 komplett neu entstanden, `hound`/`rust` in Slice 2.

Was `entities/` heute wirklich bindet — nur **eine** Stelle, aber eine scharfe:

> `smoke_test.mjs:5189-5197` liest den **Quelltext von `game/js/entities/**`**, extrahiert per Regex jedes `events.push('x')`, `events.push({ type: 'x'` und `deathEvent: 'x'` und verlangt für **jeden** Typ eine wörtliche Zeile `hasEvent(events, 'x')` in `main.js`. Fehlt eine → ROT.

Dazu: Kopf-Importe `smoke_test.mjs:20-27` und `tools/check_syntax.sh` (node --check über `game/js/**`). Sonst nichts.

**Konsequenz:** `npcs.js` sollte **gar keine Events pushen**, sondern Rückgabewerte liefern (`updateNpcs(...) → {nahe: npc|null}`). Damit ist der Wächter irrelevant und die Kopplung an `main.js` minimal.

## 1.6 Sprite-Konventionen und die Reihenfolge-Falle

`sprites.js:1-11`: `player_*` 16×24, `ghoul_*` 16×20, Rest 16×16; Licht von oben-links, `Z`=Rimlight, `X`=beleuchteter Stoff, `u`=Stoffschatten. Für NPCs ist **16×24 richtig** (gleiche SoM-Proportion wie der Held).

**Bindende Disziplin:** Neue Sprites **nur ans Ende** von `SPRITES` anhängen, neue Flips **nur ans Ende** der Flip-Liste `main.js:93-106` (der Kommentar `main.js:100-103` erklärt warum: die Flusstests mappen Canvas→Sprite über die **Erzeugungsreihenfolge**, `.tmp/check_main_slice1.mjs:100-106`, `.tmp/check_inventory_slice2.mjs:145-151`, `tools/check_save_slice4.mjs:112-116`). Ein Einschub in der Mitte macht alle drei rot.

---

# 2. DIALOG-SYSTEM

## 2.1 Was da ist

`hud.js` kann Text: `centerText` (`:712-718`), `drawPickupToast` (`:585-599`, einzeilig, mit Schattenzug), Pixelziffern `drawPixelNumber` (`:117-135`, nur 0-9). Rahmen ausschließlich per `fillRect` (`rahmen()`, `hud.js:792-798`) — begründet in `:786-791`: die Flusstest-Stubs kennen **kein `strokeRect`**.

## 2.2 Was fehlt

1. **Mehrzeilen-Umbruch.** `measureText` existiert **nirgends** und darf nicht (`hud.js:137` „KEIN measureText"). Der Bestand rechnet stattdessen mit der belegten Konstante: `'8px monospace'` = **0,6 em Vorschub = 4,8 px je Zeichen** (`hud.js:147-152`). → Umbruch **zeichenbasiert** als reine Funktion, Node-testbar. Bei einer Box x 16..304 mit 8 px Innenrand bleiben 272 px → 56 Zeichen; konservativ **48 Zeichen/Zeile**.
2. **Fortsetzungs-Tap.** Jeder `touchstart` setzt `input.confirm` (`input.js:213`), `postUpdate()` löscht ihn (`:337-340`) → Flanke gratis. `enterState` ruft `input.consumeConfirm()` (`main.js:1241`) → der Eintritts-Tap blättert nicht sofort weiter.
3. **Auswahl-Optionen.** Präzedenzfall ist `titleMenuStep` (`save.js:244-261`): **purer Reducer**, „Tap hat Vorrang vor confirm" (`save.js:247-257`), Zonen als exportierte Konstanten (`save.js:227-230`), Hittest in `main.js` (`:1987-1998`). Genau diese Bauform übernehmen.
4. **Pause-Verhalten.** Neuer State `'dialog'` in `main.js`. Berührte Stellen: Zustandskette `:1750/1956/1978`, `render()` `:2445-2470`, `enterState` `:1235-1251`, `input.touch.pause.visible` `:1663`, HUD-Spiegel-Block `:1668`. `musikFuerZustand` (`:843-851`) braucht **keine** Änderung — `'dialog'` fällt in den `else if (mapDef)`-Zweig, die Kartenmusik läuft weiter. Zu entscheiden: `audioGeduckt` (`:1244`) — Vorschlag: **nicht** ducken (Dialog ist Teil der Welt, nicht ein Menü).

## 2.3 Zeichen-Regeln (Detektor-Pflicht)

- **Fade-Detektor** (`.tmp/check_main_slice1.mjs:158-161`): kein `fillRect` 320×180 in `'#000'` mit `0 < alpha < 1`. Deckung stattdessen in der **rgba-Füllfarbe** bei `globalAlpha 1` (Muster `hud.js:801, 853, 867`).
- **Ambient-Detektor** (`.tmp/check_main_slice1.mjs:154-156`, `check_boss_slice3.mjs:120`, `check_save_slice4.mjs:181`): `ops.find(...)` = **erster** Teilalpha-`fillRect` auf einem **Nicht-Haupt-Canvas`. `lighting.js` muss der einzige bleiben → Dialogbox **nur auf dem Haupt-ctx**.
- Erlaubter Stub-Vorrat (`.tmp/check_main_slice1.mjs:39-49`): `fillRect, clearRect, drawImage, fillText, beginPath/arc/fill/stroke, save/restore, createRadialGradient`. Nichts anderes.

## 2.4 VOLLSTÄNDIGE hasText-Sondenliste (neue Texte müssen diese meiden)

| Datei:Zeile | Sonde | Art |
|---|---|---|
| `check_main_slice1.mjs:195` | `GRIMLIGHT` | positiv |
| `:200` / `:201` | `GOLD 0` / `x 0` | positiv |
| `:258, :264` / `:282` | `GAME OVER` | positiv / **negativ** |
| `:275` | `DER TOD FORDERT SEINEN ZOLL` | positiv |
| `:124` / `:273` | `texts().find(s => s.startsWith('GOLD'))` / `'GOLD:'` | **erster Treffer zählt** |
| `check_boss_slice3.mjs:140/145/166/185` | `GRIMLIGHT` / `GRABWAECHTER` / `VERSCHLOSSEN` / `VERSIEGELT` | positiv |
| `:229/233/234/255/256` | `SIEG` / `bezwungen` / `STUFE 3` / `GAME OVER` / `-20 GOLD` | positiv |
| `check_inventory_slice2.mjs:161, :373` | `SIEG` | **negativ (ganzer Fluss)** |
| `:223/238/294/302/318` | `GRIMLIGHT` / `KNOCHEN-BUMERANG!` / `berklinge` | positiv |
| `:317, :326` / `:336` | `AUSRUESTUNG` | positiv / **negativ** |
| `:331` | `HERZ 3  SCHADEN 2  TEMPO 100%` (ein einzelner fillText!) | positiv |
| `:214` | `startsWith('GOLD')` | erster Treffer |
| `check_save_slice4.mjs:206/207/217/228/229` | `GRIMLIGHT`/`ENTER`/`GOTT`/`PAUSE`/`WEITER`,`GOTT: AN`,`FPS: AUS` | positiv |
| `:208, :288, :292, :328, :340` | `FORTSETZEN`, `NEUES SPIEL`, `GOTT`, `GAME OVER` | **negativ** |
| `:255` | `goldText() === 'GOLD 500'` | **Gleichheit** |
| `:309, :331, :357` | `goldText() === 'GOLD 0'` | **Gleichheit** |
| `smoke_test.mjs:5560/5594/5779` | `GRIMLIGHT` / `GOLD` / `GAME OVER` | positiv |
| `smoke_test.mjs:5376` | Sonden-Sperrliste für alle Pausen-Texte | **bindend** |

**Bindende Regel für alle Slice-6-Texte:** kein Teilstring aus
`GOLD · SIEG · GAME OVER · GRIMLIGHT · STUFE · AUSRUESTUNG · x 0 · ENTER · FORTSETZEN · NEUES SPIEL · GOTT · PAUSE · WEITER · VERSCHLOSSEN · VERSIEGELT · GRABWAECHTER · KNOCHEN-BUMERANG · berklinge · bezwungen · DER TOD FORDERT`.
Zusätzlich: **kein Text, der mit `GOLD` beginnt, darf vor `drawHUD` gezeichnet werden** (`main.js:2438`) — `goldText()` nimmt den ersten Treffer. Overlays in `render()` (`:2454-2470`) liegen ohnehin danach; nur nichts in `drawWorld` **vor** Zeile 2438 einbauen.

---

# 3. HÄNDLER

## 3.1 Gold-Bilanz — gemessen

Sonde `.tmp/slice6_probe/gold.mjs` (rechnet Erwartungswerte aus den echten Spawn-Listen und Drop-Tabellen):

```
GRAVEYARD      8 Gegner  → Münzen-E 16,0 | 5 Vasen  →  4,5 | Truhen –            = 20,5
CATACOMBS     17 Gegner  → Münzen-E 37,0 | 12 Vasen → 10,8 | Gold-Truhe → 10     = 57,8
FLUESTERGRUFT 15 Gegner  → Münzen-E 31,0 | 11 Vasen →  9,9 | boss_key/heart → 0  = 40,9
BOSS_KAMMER    1 Gegner (noDrops)                                                 =  0,0
Boss-Tod 6-10 (E 8) + Siegtruhe 8-12 (E 10)                                      = 18,0
------------------------------------------------------------------ Erstdurchlauf ≈ 137 Gold
```
Quellen: `enemies.js:219-244` (coinMin/Max, Rost 2-4 `:148-149`), `props.js:110-117` (Vase: 60 % → 1-2 Münzen, 25 % Trank), `props.js:94-99` (Truhe 8-12), `main.js:1864-1867` (Boss 6-10), `enemies.js:590-597` (+1 Gold je Münze, +2 bei vollem Trank-Beutel).

**Entscheidend: Gold ist heute unbegrenzt farmbar.** `buildWorld` baut Gegner **und** Vasen bei **jedem** Betreten frisch aus `mapDef` (`main.js:1113-1133`); nur Truhen bleiben über `runFlags.openedChests` weg (`:1134-1137`). Ein Katakomben-Rundlauf bringt reproduzierbar ≈ 58 Gold in 2-3 Minuten. Die **einzige** Gold-Senke heute ist der Tod (Halbierung, `main.js:2053`, `hud.js:858-860`).

**Preis-Anker daraus:** Erstkauf nach einer Karte bezahlbar (**20-60**), Standard-Ausrüstung **80-150**, Einmal-Güter (Herzcontainer, Taschenfach) **250-400**. Alles darunter macht die Senke wirkungslos, alles darüber macht Farming zur Pflicht.

## 3.2 Was er sinnvoll verkauft

| Ware | Anbindung | Aufwand | Haken |
|---|---|---|---|
| **Trank** (repeatable) | `player.potions` / `maxPotions = 3` (`player.js:19, 68`) | S | die natürliche Dauer-Senke |
| **Ausrüstung mit Affixen** | `rollItem(rng, {slot, rare})` (`items.js:55-72`) — **rng ist Parameter** → gesäter Festbestand, deterministisch testbar | M | `addItem` liefert `false` bei voller Tasche (`items.js:87-92`) → Kauf muss das prüfen, Muster `'TASCHE VOLL'` (`main.js:1839`) |
| **Taschen-Erweiterung** | `inv.capacity` (`items.js:80`) — `save.js:108` erlaubt bereits **1..64** | S | **braucht keine Schema-Änderung**, beste Preis/Leistung |
| **Herzcontainer** | Muster `props.js:85-90` (`prog.hearts += 1; recalcStats(); hp += 2`) | S | **muss einmalig sein** (`runFlags`-Flag), sonst wächst maxHp unbegrenzt |
| Bumerang/Schlüssel | – | – | **nein**: GDD trennt Zelda-Items (fest platziert) von Diablo-Drops (`GDD.md:61-63`) |

## 3.3 Kauf-UI

Vorbild `inventory_ui.js` (295 Zeilen): **reine Logik ohne ctx** (`createInventoryUI`, `:78-150`) + getrennter Zeichner (`drawInventoryUI`, `:184-295`), Tap-Hittest über Rechtecke (`:123-141`), Cursor-Flanken auf Pegeln (`:108-119`).

**Warnung: das Inventar-Panel NICHT erweitern.** `LIST_Y` (26) und der X-Anker (288,10) sind ausdrücklich TABU (`inventory_ui.js:41-43`, begründet in `SLICE5_SPEC_REVIEW.md:230-232`); die harten Koordinaten stehen im **Bestands**-Smoke (`smoke_test.mjs:1249-1256`, `:4529-4545`). Der Händler bekommt ein **eigenes Modul + eigenes Panel + eigenen State**.

---

# 4. QUEST-GERÜST

## 4.1 Zustandsträger: `runFlags`

Das Muster ist fertig und save-fähig:
- Deklaration `main.js:912` `let runFlags = { bossDead: false, openedChests: [] }`
- Reset `main.js:1205-1211` — mit dem ausdrücklichen Warnkommentar (`:1206-1210`), dass ein vergessener Reset den Run unlösbar macht (Review P1-B5)
- Laden `main.js:1220-1221`, Speichern `save.js:81-84`, Validierung `save.js:131-136`
- Gelesen in `buildWorld` `:1120, :1134-1137, :1140`

**Vorgeschlagene v2-Erweiterung:**
```
runFlags.quests    : { <id>: 'offen'|'aktiv'|'erfuellt'|'belohnt' }
runFlags.npcFlags  : { <id>: <dialogKnoten:int> }
runFlags.gekauft   : [ 'herz_1', 'tasche_1', ... ]   // Einmalwaren
runFlags.dorfBesuche : int
```

## 4.2 Trigger-Punkte, die es schon gibt

| Trigger | Beleg | Eignung |
|---|---|---|
| Truhen-Inhalt-Dispatch | `props.js:64-101` | „Bring mir X" |
| Event-Strom (String **oder** `{type,...}`) | `entity.js:13-26`, Auswertung `main.js:1834-1844` | Bestehende Events mitlesen (`chest_opened`, `heart_found`, `key_found`, `level_up`) |
| `portalBlocked` als Tor | `maps.js:749-765` + Toast `main.js:1915-1922` | Quest-Gates 1:1 wie `requires`/`bossLocked` |
| `deathEvent` je Gegner | `enemies.js:446`, `boss.js:64` | Boss-Quests |
| Prop-Öffnungs-Flanke per WeakMap | `main.js:966, 1485-1498` | **Zähl-Quests ohne `entities/`-Änderung** |

**Wichtig für Zähl-Quests („töte 5 Ghule"):** `'enemy_died'` (`enemies.js:486`) trägt **keinen kind**. Statt das Event zu erweitern (was nach `smoke_test.mjs:5194` eine neue `hasEvent`-Zeile in `main.js` erzwingt) besser den bestehenden Beobachter nutzen: `AUDIO_STATE`-WeakMap (`main.js:964`, Auswertung ab `:1500`) sieht pro Gegner den Übergang nach `'die'` **inklusive `e.kind`**. Null Änderung in `entities/`.

## 4.3 Quest-Log-UI

Empfehlung: **eigener State `'quests'` mit eigenem Panel-Modul**, nicht als zweite Seite im Inventar. Begründung: das Inventar-Panel steht unter harten Geometrie-Sonden (s. 3.3), der Zustandsautomat verträgt einen weiteren Zweig dagegen problemlos (Muster `'paused'`, `main.js:1978-2043`, komplett additiv gebaut). Öffner: Zeile im Pause-Menü — `PAUSE_MENU_ZONES` (`hud.js:778-784`) hat allerdings **keinen Platz mehr**: 5 Zonen enden bei y 146, Panel bei y 150, das FPS-Fenster beginnt bei y 158 (`hud.js:764-776`, gemessen `smoke_test.mjs:5352-5361`). Eine 6. Zone erzwingt Panelwachstum + Neuvermessung. **Billiger: eigener Öffner im Dialog-/Dorf-Kontext oder eine freie Taste.**

---

# 5. SAVE v2

## 5.1 Ist-Zustand

`save.js:34-35` `SAVE_VERSION = 1`, `SAVE_KEY = 'grimlight.save.v1'`. `deserialize` (`:142-188`) lehnt **hart** ab bei: kaputtem JSON, `d.v !== SAVE_VERSION` (`:151`), unbekannter Karte (`:152`, via `Object.hasOwn(MAPS, ...)` → **DORF ist automatisch gültig**), falschen Typen, und wenn `maxHp` überhaupt vorkommt (`:160-162`). Anwendung: `applyToPlayer` (`:200-208`) in fester Reihenfolge; `ladeSpielstand` `main.js:1219-1229`.

## 5.2 Die drei Testzeilen, die v2 blockieren

| Beleg | Assertion | Wirkung bei v2 |
|---|---|---|
| `smoke_test.mjs:4130-4131` | `SAVE_KEY === 'grimlight.save.v1' && SAVE_VERSION === 1` | **ROT** |
| `smoke_test.mjs:4191` | `kaputt('fremde Schema-Version', d => d.v = 2)` erwartet **null** | **ROT** (v2 wäre gültig) |
| `tools/check_save_slice4.mjs:335-341` | ein `v:2`-Stand darf **kein** FORTSETZEN zeigen | **ROT** |

Alle drei müssen in der Spec **abschließend sanktioniert** werden. Die übrigen 47 Assertions in `check_save_slice4` sind versionsagnostisch (sie messen über `hatText`/`goldText`/`sprite`).

## 5.3 Migrations-Strategie (Empfehlung)

**Schlüssel behalten, Version anheben, beide Versionen annehmen.** Der Kommentar `smoke_test.mjs:4130` („ein v2-Schema kollidiert nicht") legt einen neuen Schlüssel nahe — das würde Michaels Bestandsstand aber stillschweigend verwaisen lassen (App und Browser haben ohnehin **zwei getrennte Stände**, `uebergaben/2026-08-13_slice4_mobile.md`, Deklaration 1). Konkret:

```
SAVE_VERSION = 2;  SAVE_KEY bleibt 'grimlight.save.v1'   // ein Speicherort, kein Waisenstand
deserialize(): akzeptiert d.v ∈ {1,2}
               v1 → migriere(): quests {}, npcFlags {}, gekauft [], dorfBesuche 0
               Rückgabe IMMER v2-förmig
               maxHp-Ablehnung (:162) bleibt unverändert
```
Nachziehen: `runFlagsOk` (`save.js:131-136`) um die neuen Felder, `serialize` (`:81-84`), `main.js:1220-1221` (Laden) und **zwingend** `main.js:1205-1211` (`resetRun`). Als Beweis ein additiver **Boot 6** in `check_save_slice4`: „v1-Stand im Storage → FORTSETZEN erscheint → Quest-Felder stehen auf Default".

Nicht nötig: `inv.capacity` ist bereits v1-Feld und mit 1..64 validiert (`save.js:108`) → Taschen-Erweiterung braucht **keine** Schema-Änderung.

---

# 6. KARTEN-INFRASTRUKTUR

## 6.1 Was für eine 5. Karte automatisch trägt

- `MAPS`-Registry `maps.js:737` — eigene Datei `world/map_dorf.js` nach dem Muster `map_fluestergruft.js`/`map_bosskammer.js` (`maps.js:26-27`), `tc`/`tileRect` aus `world/coords.js` importieren (der Zirkelimport-Grund steht in `maps.js:19-23`).
- `?map=DORF` funktioniert sofort (`main.js:266-270`).
- `save.js:152` akzeptiert DORF als `mapKey` ohne Änderung.
- `smoke_test.mjs:97-158` prüft die neue Karte **automatisch** mit: Legende vollständig, Rand komplett solide, alle Spawns begehbar, Portal-Ziele existent, Ziel-Spawn begehbar und nicht im Gegenportal.

## 6.2 Was hart auf 4 Karten verdrahtet ist

| Stelle | Beleg | Wirkung |
|---|---|---|
| §36 Golden `GOLD` (4 Einträge) | `smoke_test.mjs:2145-2153`, Schleife `:2172` über `Object.keys(GOLD)` | DORF **nicht abgedeckt** → Lücke, nach dem Einfrieren nachziehen |
| §36 `AMBIENT` (4 Werte) | `smoke_test.mjs:2160` | dito |
| Zweiter Golden-Ort für GRAVEYARD | `smoke_test.mjs:3571-3572` | **jede** Portal-Änderung an GRAVEYARD trifft **zwei** Zeilen |
| `Object.keys(MAPS).length === 4` | `.tmp/check_builderA_slice3.mjs:55` | **ROT bei 5 Karten** — bewusst entscheiden |
| „jede Karte 24 Zeilen × 40 Zeichen" | `.tmp/check_world_slice1.mjs:40-42` | DORF muss **40×24** sein |
| **Fackel-Pflicht:** `torches.length > 0` je Karte | `smoke_test.mjs:598-606` | **DORF braucht mindestens eine Fackel-Kachel in `torchChars`** (passt zum GDD-„zögernden Herdfeuer", `GDD.md:40`) |
| Fackel-Legende genau 3 Anim-Frames | `smoke_test.mjs:2631-2639` | bindend |
| variants ungerade, `variants[0] === art`, Keys in `TILE_ART`; kein solides Tile mit `bankSet`; `bankSet` nur `'g'`/`'s'` | `smoke_test.mjs:2582-2622` | bindend für die Dorf-Legende |
| alle `art`/`anim`/`swayPoses`/`shadowArt`-Keys in `TILE_ART` | `.tmp/check_gfx6_art.mjs:404-416` | bindend |
| `extraLights` alle `flicker < 0.8` | `smoke_test.mjs:2629-2630` | bindend |
| `LIT_FLOOR_MAPS` | `main.js:2127` | Dorf hat Gras/Erde → **nicht** eintragen |
| `mapDef.music` | `maps.js:662, 734`; `map_fluestergruft.js:180`; `map_bosskammer.js:93` | fehlt das Feld → `main.js:849` liefert `null` = **Stille**. Neuer Song-Schlüssel in `songs/index.js:20-29` + eigene Datei |
| Song-Peak-Gates | `smoke_test.mjs:5058-5064` (Schleife über **alle** `SONGS`), Summen-Gate `:5087` | neuer Dorf-Song: Einzel-Peak ≤ 0,70 |
| SFX-Pflichtliste | `smoke_test.mjs:5169-5171` prüft nur die **26 Pflicht**-Keys mit `every` | neue SFX (Dialog-Blip, Kauf, Quest) sind **additiv erlaubt**, Einzel-Peak ≤ 0,50 (`:5079`) |

## 6.3 Anschluss ans Netz — und das gemessene Risiko

Ein Portal in `GRAVEYARD.portals` (`maps.js:644-646`) ändert **nur den geo-Hash**: `solHash` ist ein reines Soliditäts-Raster (`smoke_test.mjs:2162-2163`) — ein begehbar→begehbar-Kacheltausch für ein sichtbares Dorftor lässt ihn **byte-identisch**. `geoHash` enthält `po: def.portals` (`:2169`) → **zwei** zu sanktionierende Golden-Zeilen (`:2150` und `:3571-3572`).

**Das eigentliche Risiko war: läuft ein Flusstest versehentlich ins neue Portal?** Gemessen mit einem Gitter aus Sonden-Portalen über ganz GRAVEYARD, deren `requires` ein protokollierender Getter ist (`portalBlocked` liest ihn als erstes, `maps.js:750`, liefert `'locked'` → **kein** Kartenwechsel, Bestandsfluss unverändert):

| Sonde | Suite | berührte Kacheln (von 699 begehbaren) | Ergebnis |
|---|---|---|---|
| `.tmp/slice6_probe/route_sonde.mjs` | `check_main_slice1` | **79** | CHECK GRÜN (25) |
| `.tmp/slice6_probe/save_sonde.mjs` | `tools/check_save_slice4` | **0** | CHECK GRÜN (48) |
| `.tmp/slice6_probe/smoke_sonde.mjs` | smoke-Boot S5-§7A(h) | **59** | nur die 4 sondenbedingten Fehler |
| `.tmp/slice6_probe/god_sonde.mjs` | `.tmp/probe_god` | **59** | PROBE GRÜN |

Vereinigung der berührten Zone (`X` = berührt, `#` = solide):

```
   0123456789012345678901234567890123456789
01 ###....#.#....................######.X##
03 #..#.#.#.........#.#.#.#......#..X.#.X##
05 #..#.#.#.......#.....#.#.#.......XXXXX##
08 #................................X...X##
11 ##.............XXXXXXXXXXXXXXXXXXXXXXX##
12 #...XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX##
14 #....#...#..#..#................##...X##
```
Berührt werden ausschließlich der Ost-West-Korridor (Reihen 11/12), die Ost-Spalten 32-37 (Reihen 1-14) und Reihe 5 im Osten. **Der komplette Westen, Norden bis Spalte 31 und der gesamte Süden sind frei.**

**Konkrete sichere Torpositionen:** Nordtor `(4,1)`/`(5,1)` (begehbar, von keiner Suite berührt, thematisch richtig: „oben das Dorf" — `GDD.md:38`), alternativ der Südwest-Quadrant.

**Was NICHT geht:** DORF als Startkarte. `startMapKey` bleibt `'GRAVEYARD'` (`main.js:264`), sonst brechen `check_main_slice1:202`, `check_save_slice4:307/331/357` und `smoke:5594`.

---

# 7. PRIORISIERTE ARBEITSLISTE

**Aufwand:** S ≈ ½ Tag · M ≈ 1-2 Tage · L ≈ 3+ Tage (Agenten-Maßstab)

| # | System | Aufwand | Risiko | Kern-Belege / Fallen |
|---|---|---|---|---|
| **P0-1** | **Save v2 + v1-Migration** | M | **HOCH** | Michaels v1-Stand ist unwiederbringlich, wenn der Schlüssel wechselt. 3 Sanktionen: `smoke:4131`, `smoke:4191`, `check_save_slice4:335-341`. `resetRun` (`main.js:1205-1211`) mitziehen — die dokumentierte P1-B5-Falle. **Muss vor Quests/Händler stehen**, sonst wird die Persistenz zweimal gebaut. |
| **P0-2** | **DORF-Karte 40×24 + Portal + Golden-Neuanlage** | L | MITTEL | Fackel-Pflicht `smoke:598-606`; Legenden-Gates `smoke:2582-2639` + `check_gfx6_art:404-416`; `mapDef.music` sonst Stille (`main.js:849`); 2 Golden-Zeilen (`smoke:2150`, `:3571-3572`); Tor auf `(4,1)/(5,1)` **sondenbelegt frei**; `check_builderA_slice3:55` und `check_world_slice1:40-42` explizit entscheiden. |
| **P0-3** | **`npcs.js` + Renderables/Schatten/Kollision** | M | NIEDRIG | Rein additiv (`main.js:2314-2316`, `:2360-2378`). `entities/`-Tabu ist Grafikpass-Regel, kein Dauerrecht (`SPEC_GRAFIKPASS_6.md:157` vs. `boss.js` aus Slice 3). **`npcs.js` darf keine Events pushen** (`smoke:5189-5197`). Solidität über Legenden-Kachel, nicht über `player.js`. Sprites/Flips **nur anhängen** (`main.js:100-103`). |
| **P1-4** | **Dialog-State + Box + Umbruch + Auswahl** | M | MITTEL | Umbruch zeichenbasiert @ 4,8 px (`hud.js:147-152`), **nie** `measureText`. Reducer-Bauform `save.js:244-261`. Rahmen nur `fillRect` (`hud.js:786-798`). Detektoren §2.3. Sondentext-Sperrliste §2.4. Neuer State an 5 Stellen (`main.js:1663, 1668, 1750ff, 2445ff`). |
| **P1-5** | **Händler-UI + Preislogik** | M | NIEDRIG-MITTEL | **Eigenes Panel**, `inventory_ui.js` nur als Bauform kopieren (LIST_Y/X-Anker TABU, `inventory_ui.js:41-43`). Preisanker aus §3.1 (Erstkauf 20-60, Standard 80-150, Einmalware 250-400). `addItem`-`false`-Pfad (`items.js:87-92`). `rollItem(rng, …)` gesät → deterministisch testbar. `inv.capacity` ist schon save-fähig (`save.js:108`). Herzcontainer **einmalig flaggen**. |
| **P1-6** | **Quest-Gerüst (3-5) + Log** | M | MITTEL | Träger `runFlags` (§4.1); Zähl-Quests über die `AUDIO_STATE`-WeakMap (`main.js:964, 1500ff`) statt über neue Events; Gate-Muster `portalBlocked` (`maps.js:749-765`); Log als **eigener State**, nicht als 6. Pause-Zone (`hud.js:764-776` — kein Platz ohne Panelwachstum). |
| **P2-7** | **Dorf-Song + neue SFX** | S | NIEDRIG | Song-Peak ≤ 0,70 (`smoke:5058-5064`), SFX-Peak ≤ 0,50 (`:5079`), Summen-Gate (`:5087`). Neue SFX-Keys sind additiv erlaubt (`:5169-5171` prüft nur die 26 Pflicht-Keys). **Achtung:** läuft parallel zu Michaels ausstehendem Hörtest — Song-Datei getrennt halten, Bestands-Songs nicht anfassen. |
| **P2-8** | **Art: NPC-Sprites 16×24 + Dorf-Tiles** | L | NIEDRIG | Palette-Gate `smoke:81-93`; Reihenfolge-Disziplin (P0-3); alle Legenden-Keys müssen in `TILE_ART` stehen. |
| **P2-9** | **§36-Golden für DORF nachziehen** | S | NIEDRIG | Erst **nach** dem Einfrieren der Dorf-Geometrie: `GOLD`/`AMBIENT` in `smoke:2145-2160` um DORF erweitern — sonst schützt kein Regressionsnetz das neue Biom in GP7. |

## Querschnitts-Fallen für ALLE Arbeitspakete

1. **`main.js` darf kein `.stop()` enthalten und genau ein `.start()`** — `smoke_test.mjs:4870-4872` (kommentarbereinigter Quelltext).
2. **Die Truhen-Registrierungsschleife `main.js:1808-1813` ist byte-eingefroren** — `smoke_test.mjs:5290-5301`; das 400-Zeichen-Fenster braucht ≥ 100 Zeichen Reserve (`:5304-5307`). Nichts hineinschreiben.
3. **Jeder `spieleSfx('x')`-Aufruf in `main.js` muss auf einen existierenden Key zeigen** — `smoke_test.mjs:5204-5207`.
4. **Jeder Event-Typ aus `entities/**` braucht eine `hasEvent(events, 'x')`-Zeile in `main.js`** — `smoke_test.mjs:5189-5197`.
5. **Datengetriebenes Muster verwenden** („fehlt das Feld, passiert nichts"): `mapDef.npcSpawns`, `mapDef.music`, `mapDef.extraLights` (`main.js:2308-2310`) — nicht die `LIT_FLOOR_MAPS`-Konstante nachbauen, die existiert nur wegen des damaligen Datei-Tabus (`main.js:2124-2126`, bestätigt in `SLICE5_LANDKARTE.md:249`).
6. **Port 8123 bleibt Michaels** (`tools/serve.py:7`); Agenten 8124, danach stoppen.


---

# TEIL B: Dorf-Biom & Content

# SLICE-6-LANDKARTE, AUFTRAG B — DORF-BIOM & CONTENT-DESIGN-GRUNDLAGEN

**Stand:** HEAD `e3bce1a`, Arbeitsbaum sauber (`git status --short` leer). Baseline nachgemessen grün: `tools/check_syntax.sh` → „OK: 36 JS-Dateien", `tools/smoke_test.mjs` → „SMOKE-TEST GRÜN", `.tmp/check_gfx6_art.mjs` → „GP6-ART-CHECK GRUEN", `tools/check_save_slice4.mjs` → „CHECK GRÜN (48 Assertions)". Port 8123 nie berührt, 8124 nicht gebraucht (kein Server nötig, alles headless). Sonden ausschließlich in `/home/coder/Grimlight/.tmp/slice6_probe/` (4 Skripte + 1 JSON, wegwerfbar).

---

## 0. DER WICHTIGSTE FUND ZUERST: das Dorf ist schon spezifiziert

`design/GDD.md:40` beschreibt das Dorf namentlich und vollständig:

> **Gramfeld (Dorf-Hub) [S1]:** Verfallenes Dorf im **Dauerzwielicht**. **Vernagelte Fenster**, ein **zögerndes Herdfeuer**, zwei drei verängstigte Bewohner. Stimmung: **Tristram** — leise, wartend, letzter sicherer Ort. Funktion: Start, Heilung, ab S2 Ausrüstungs-Check, ab S4 Speicherpunkt.

Dazu `GDD.md:38` „Ein Ort, vertikal erzählt: oben das sterbende Dorf, darunter die Toten", `GDD.md:31` „Im Dorf starten [S1]", `GDD.md:34` „Rückkehr ins Dorf = sicherer Speicherpunkt [S4]" und die Abgrenzung `GDD.md:17`: „Explizit NICHT: Hyrule-Buntheit, **freundliche NPC-Dörfer**, Humor-Ton."

Das ist bindend und beantwortet drei Fragen des Auftrags vorab: der Ton ist **Zwielicht, nicht Tageslicht**; die Landmarke ist **kein fröhliches Marktdorf**; und — der praktisch wertvollste Satz — **das Herdfeuer existiert schon in der Spec**. Es rettet, wie unter §2 gezeigt, das einzige Testgate, das sonst rot würde.

---

## 1. ART-BESTAND FÜRS DORF

### 1.1 Was da ist (Zensus, `.tmp/slice6_probe/s6b_ton_zensus.mjs`)

284 `TILE_ART`-Keys / 75 `SPRITES`-Keys, zusammen 6818 Grid-Zeilen in `game/js/art/sprites.js` (8651 Zeilen gesamt, also 27 % Kommentar-/Strukturoverhead — die Kalibrierzahl für alle Aufwandsschätzungen unten).

**Nutzbar ohne einen Strich neuer Arbeit:**

| Bestandsteil | Keys | Beleg | Dorf-Rolle |
|---|---|---|---|
| Gras-Pool `grass_g5_00..46` | 47 | `maps.js:226-238` | Dorfwiese, Ränder, Gärten — trägt das Umland komplett |
| Weg `path` + 7 Varianten | 8 | `maps.js:408` (`variants` n=5), `sprites.js` `path_v4/v5/path_pebbles` | Dorfstraße; `path` ist zu 233/256 Texeln Ton `M` (#6a5942, L 91,5, warm R−B 40) |
| Fringe-/Shore-Apparat | 12+ | `tilemap.js:104-172` | Gras franst automatisch über den Dorfplatz — **null neue Grids**, wenn der Platz `fringeTarget` + `fringeSet:'grass'` bekommt |
| XL-Kronen + Schattenbakes | 33 | `maps.js:175-210`, `sprites.js` | Bäume am Dorfrand, Obstgarten — inkl. Sway und Kontaktschatten |
| Gras-Deko `u/j/k/w/y` | 13 | `maps.js:273-287` | begehbare Streudeko |
| Props `vase`, `urn`, `chest_closed/open` | 4 | `sprites.js:684-796` | Fässer/Krüge/Truhen im Dorf; `props.js:20-38` nimmt sie ohne Änderung |
| Fackel-Familie `torch_0/1/2` | 3 | `sprites.js`, `maps.js` | Grundlage für das Herdfeuer |

**Nicht nutzbar, obwohl der Name es verspricht** (das ist der eigentliche Befund):

* **`fence` ist ein STEINZAUN, kein Holzzaun.** Zensus des Grids: `e100 n56 s45 g32 k15 S8` — ausschließlich Gras- und Friedhof-Steintöne, keine einzige Holzfarbe. Das Grid ist oben in der Antwort abgedruckt; es zeigt Pfosten in `s/S/g` = die violette Friedhof-Steinrampe.
* **`brick_wall` ist KALTER Katakomben-Stein.** Zensus `k80 T54 t54 L48 n8 F4 D4 m4` — die `t/T/L/D`-Rampe (R−B −12/+5/−24/−26, also durchweg kalt). `design/ART_DIRECTION.md:51` schreibt das sogar wörtlich fest: „Katakomben sind KALT: t/T/L-Grau statt des violetten Friedhof-Steins".
* **`wall` ist die violette Friedhofsmauer** (`k88 s54 g54 S48 F8 n4`).

⇒ **Es gibt im gesamten Bestand keine einzige Kachel, die als warmes Dorf-Holz liest.** Die Holzrampe `q/j/Q/J` existiert in der Palette, kommt in `TILE_ART` aber nur in `tree_trunk` (87 Texel) und fünf Kronen (je 12 Texel Stammstumpf) vor — sonst ausschließlich in Sprites (Truhe, Vase, Spielerstiefel).

### 1.2 Fehlliste (das, was gezeichnet werden muss)

| Gruppe | Was fehlt | Grids | Maß |
|---|---|---|---|
| **A Hauswände** | Bretter-/Fachwerkwand + 2 Varianten, Giebelseite, 2 Eckkacheln, Steinsockel | 7 | 16×16 |
| **B Dächer** | 2 Größenklassen als Over-Span je + Spiegel `_m`, 2 Kontaktschatten-Bakes | 6 | 48×32 / 64×48 / 64×32 |
| **C Öffnungen** | Tür zu/offen, vernageltes Fenster + Variante (`GDD.md:40`), erleuchtetes Fenster 3 Frames | 7 | 16×16 |
| **D Möblierung** | Brunnen 2×2 (**solide ⇒ 4 Ground-Kacheln, kein Span**), Marktstand (2 Theke + Segel 48×32 + `_m`), Holzzaun h/v/Ecke/Tor, Fass, Kiste, Karren, Holzstapel, Wäscheleine, **Herdfeuer 3 Frames**, Wegweiser, geborstene Dorfglocke | 22 | 16×16 (+2× 48×32) |
| **E Boden** | Dorfplatz-Pool „gestampfte Erde" n=9, 2 Trittpfad-Kacheln vor Türen | 11 | 16×16 |
| **F NPCs** | 5 Typen × (2 Idle-Frames + 1 Sprech-Frame) | 15 | **16×24** (= Spielermaß, `sprites.js` führt 17 Grids in 16×24) |
| **G Dialog-Marker** | „!"-Blase, „…"-Blase | 2 | 8×8 |

**Summe ≈ 70 neue Grids ≈ 1400 Grid-Zeilen ≈ 1800 Zeilen in `sprites.js`** (bei den gemessenen 27 % Overhead).

**Realismus-Kalibrierung an der Projekt-Historie** (`git show <commit>:game/js/art/sprites.js | grep -c "^  \w*: \["`):

| Pass | Grids danach | Zuwachs |
|---|---|---|
| Slice 3 (Flüstergruft + Grabwächter) | 116 | +13 |
| Grafikpass 2 | 145 | +29 |
| Grafikpass 4 (3 Runden) | 204 | +37 |
| **Grafikpass 5** (47er-Gras-Pool) | **310** | **+106** |
| Grafikpass 6 (30 XL-Posen + Bakes) | 359 | +41 |

⇒ 70 Grids liegen **zwischen GP6 und GP5** — groß, aber zweimal präzedenzlos bewältigt. Mit Generatoren (§4) fallen davon der 9er-Bodenpool, die Spiegelvarianten und die Schattenbakes automatisch an; **handgezeichnet bleiben realistisch ~40 Grids.**

### 1.3 Paletten-Kapazität — reicht es? **Ja, ohne GP7-artigen Palettenschritt.**

`.tmp/check_gfx6_art.mjs:58,73-79` erzwingt hart: kein `'l'`, **exakt 61 alnum + exakt 3 Symbole** (`=`, `+`, `*`). Gezählt: 64 Schlüssel, **genau ein alnum-Zeichen frei — `l`, und das ist verboten.** Neue Schlüssel sind also unmöglich; `SPEC_GRAFIKPASS_6.md:164-166` (§0.11) erlaubt aber ausdrücklich **Wert-Änderungen bestehender Schlüssel**.

**Der Fund:** zwei Palettentöne haben im gesamten Bestand **null Texel**:

| Ton | Hex | L | dokumentierte Rolle | Ist-Nutzung |
|---|---|---|---|---|
| `c` | `#1d2f3d` | 43,2 | „Kaltblau dunkel" (`palette.js:98`) | **0 Texel, 0 Grids** |
| `G` | `#82854c` | 125,6 | „Ghul-Fleisch mittel" (`palette.js:174`) | **0 Texel, 0 Grids** — der Ghul nutzt nur `d/H/3` |

Beide sind in `check_gfx6_art.mjs` **nicht** wertgebunden (`NEW_TONES` :59-64 listet nur die zehn Offset-Töne; `grep PALETTE.c|PALETTE.G` über `game/`, `tools/`, `.tmp/*.mjs` → leer). Sie sind damit **zwei frei umwidmbare Slots** — genug für eine mittlere Dach-Stufe und einen NPC-Stoffton.

*Ehrliche Nebenbedingung:* zwei **alte, abgelöste** Wächter binden die Hexwerte: `.tmp/check_art_gfx3.mjs:57` (`G:'#82854c'`) und `.tmp/dev_art_slice2.mjs:124` (`"c":"#1d2f3d"`). Beide stehen **nicht** auf der aktuellen Grün-Liste (`uebergaben/2026-08-13_grafikpass6.md:44` „check_gfx6_art ersetzt check_gfx5_art"; `SPEC_SLICE_5.md:65` „GP6-/S4-Wächter grün"). Der Spec muss das dennoch namentlich erklären, sonst stolpert ein späterer Agent darüber.

**Vorhandene warme Rampen (gemessen, Luminanz / Schritte / Wärme R−B):**

| Rampe | L-Werte | Schritte | R−B | Dorf-Eignung |
|---|---|---|---|---|
| **Holz `q>j>Q>J`** | 44,7 / 64,4 / 83,7 / 117,8 | 19,7 / 19,3 / **34,1** | 29/47/64/85 | **Bretterwand, Zaun, Karren.** Nur die Oberstufe reißt — `G` (125,6) füllt sie NICHT (zu grün), aber `V` (133,8, R−B 54) oder ein umgewidmetes `c` schließen die Lücke. |
| **Erde `z>p>v>M>P>V`** | 43,9…133,8 | 16,7/15,9/15,0/11,3/**31** | 16…54 | **6 Stufen, fast gleichmäßig** — der beste Bestandskandidat für Lehmputz und Dorfplatz. Braucht keinen einzigen neuen Ton. |
| **Rost `4>5>6`** | 57,1 / 90,3 / 125,4 | 33,2 / 35,1 | 66/107/**141** | **Ziegeldach/Terrakotta.** Grobe Stufen und hohe Sättigung (0,70/0,75/0,73) — ein Zwischenton aus `c` würde die Rampe auf 4 Stufen glätten. |
| **Knochen `O>B>b>N`** | 102,5 / 139,3 / 203,3 / 232,9 | 36,8 / **64** / 29,6 | 25/30/37/30 | Strohdach / Kalkputz — `b` (203) ist für Flächen zu hell, `O/B` tragen aber gut. |
| Haut `2>h` | 110,7 / 155,5 | 44,8 | 72/91 | **Nur 2 Stufen für alle NPC-Gesichter** — das ist die engste Stelle. |

**Ergebnis der Kapazitätsfrage:** Ein warmes Dorf ist mit dem Bestand **darstellbar**. Kein GP7-artiger Palettenschritt ist nötig — wohl aber **zwei sanktionierte Wert-Umwidmungen** (`c`, `G`) und eine ausdrückliche Deklaration.

**Der eigentliche Konflikt ist nicht die Kapazität, sondern die Art-Direction:** `ART_DIRECTION.md:26-27`, Stilregel 4, lautet „Warm gegen kalt: **Fackel-Orange/Gelb sind die einzigen warmen Lichtquellen**, der Rest der Welt ist kalt-grün/grau/blau." Ein Dorf aus warmem Holz bricht diese Regel flächig. Das ist kein Testproblem, sondern eine **Spec-Entscheidung, die Fable treffen und Michael abnehmen muss.** Empfehlung: die Regel biom-lokal aufweichen — *„warm ist im Dorf das MATERIAL, warm-LEUCHTEND bleibt nur das Feuer"* — und die Sättigung der Dorftöne unter die des Fackelkerns deckeln (Präzedenz: die Wasserauflage `palette.js:119-121`, „kein Wasserpixel gesättigter als das hellste Gras `A`").

---

## 2. BIOM-REGELN AUS GP6 — was eine neue Karte bindet

Ich habe eine synthetische `DORF`-Map (48×32, 7 Hausgrundrisse, Brunnen, Zäune, keine Gegner, keine Fackeln) gebaut und **genau die Wächter darüber laufen lassen, die heute über `Object.entries(MAPS)` iterieren** (`.tmp/slice6_probe/s6b_gates_dorf.mjs`). Ergebnis: **19 grün, 1 ROT.**

### 2.1 Was automatisch bindet (alles grün, kein Zutun nötig)

| Gate | Beleg | Auflage für DORF |
|---|---|---|
| Legende deckt alle Zeichen; `createTilemap` wirft nicht | `smoke_test.mjs:97-107` | trivial |
| **Rand komplett solide** | `smoke_test.mjs:110-119` | Das Dorf braucht eine geschlossene Umrandung. Kein Tor darf ein Loch in den Rand schlagen. |
| Alle Spawns begehbar, Portal-Ziele existieren, Ziel-Spawn nicht im Gegenportal | `smoke_test.mjs:121-157` | |
| **Ungerade-n über ALLE Legenden** | `smoke_test.mjs:2582-2591`, `check_gfx6_art.mjs:404-410` | Jede `variants`-Liste im Dorf muss ungerade Länge haben, `variants[0] === art`. |
| Alle Art-/anim-/swayPoses-/shadowArt-Keys existieren | `smoke_test.mjs:581-586`, `check_gfx6_art.mjs:411-416` | |
| `bankSet` nur `'g'`/`'s'`, **nie an einer soliden Kachel** | `smoke_test.mjs:2615-2622` | Hauswände dürfen kein `bankSet` tragen. |
| Over-Zeichen nie solid; span nur im Over-Layer, 1≤w,h≤4; `span>1` verboten in den Ground-rows | `tilemap.js:725-730, 878` | **Die Kollisions-Konsequenz, siehe §4.** |
| `extraLights` mit `flicker < 0.8` erlaubt | `smoke_test.mjs:2629-2630` | Warmlicht im Dorf ist **testfrei** möglich. |
| `?map=DORF` funktioniert sofort | `main.js:270` `Object.hasOwn(MAPS, q)` | Dev-Einstieg gratis. |

### 2.2 sol-/geo-Hash-NEUANLAGE: **entwarnt**

`smoke_test.mjs:2172` iteriert `Object.keys(GOLD)` — **nicht** `MAPS`. `GOLD` (`:2145-2154`) listet nur die vier Bestandskarten; die `AMBIENT`-Tabelle (`:2160`) ebenso. **Eine neue Karte DORF wird von §36 gar nicht gehasht und braucht keine Golden-Neuanlage, keinen Ambient-Eintrag.** Nachgemessen (Sonde F). Ein `sol`/`geo`-Eintrag fürs Dorf wäre *sinnvolle* Zusatzhärtung — aber additive Spec-Arbeit, kein Zwang.

### 2.3 `check_gfx6_art` Maßtabelle: die schweigende Falle

`check_gfx6_art.mjs:122-133` und `smoke_test.mjs:1732-1743` führen **dieselbe** Maßtabelle über Key-**Muster** mit `return [16, 16]` als Default. Ein neuer Key `dorf_dach_a` fällt still in die 16×16-Klasse und macht **beide** Suiten rot, sobald das Grid 48×32 ist (Sonde G).

⇒ **Jede Nicht-16×16-Dachkachel verlangt eine neue Zeile in ZWEI Wächtern.** Es gibt fünf belegte Klassen `{16×16, 32×32, 48×32, 64×48, 64×32}`, und `smoke_test.mjs:1756-1759` prüft zusätzlich, dass **keine Klasse leer läuft**.

**Empfehlung: Dächer strikt in den vorhandenen Klassen 48×32 und 64×48 halten.** Ein 4×4-Dach (64×64) wäre eine sechste Klasse und damit zwei zusätzliche Teständerungen für einen Effekt, den ein 64×48-Dach ebenso liefert. `span` ist ohnehin auf 4 gedeckelt (`tilemap.js:725`).

### 2.4 AMBIENT §36 / M1-Belichtungsband für ein NEUES Biom

Die GP6-Methodik zur Eichung neuer Karten steht in `SPEC_GRAFIKPASS_6.md:188-217`: **Formel zuerst, Schwelle in Phase 0 messen, dann einfrieren** („Schwellen nach Eintrag NIE anpassen", `:182`). Dazu Positiv- **und** Negativ-Kontrolle (`:215-217`) und das Goodhart-Gegen-Gate (`:211-215`).

Ich habe die Rechenkette nachgebaut (`.tmp/slice6_probe/s6b_belichtung_dorf.mjs`, Formel aus `.tmp/gp6_p0b_e1_sim.py:14-21`: `C = B·(1−a) + tint·a`, Median über die flächengewichtete Ton-Verteilung wie `.tmp/gp6_p0b_nutzer.mjs:100-137`).

**Validierung der Methode:**

| Karte | mein Median | Spec-Prognose (`SPEC_GRAFIKPASS_6.md:407`) |
|---|---|---|
| GRAVEYARD | **39,1** | **39,2** ✅ |
| CATACOMBS | 25,1 | 41,2 ❌ |
| FLUESTERGRUFT | 28,2 | 34,6 ❌ |
| BOSS_KAMMER | 28,5 | 39,8 ❌ |

Die Methode trifft die **Außenkarte auf 0,1 L genau** und unterschätzt die Innenkarten systematisch — weil dort die Fackelkegel den Ambient herausstanzen und mein Modell nur den unbeleuchteten Blend rechnet. **Fürs Dorf (Außenkarte, wenige Lichter) ist sie damit belastbar und liefert eine Untergrenze**; echte Lichter heben den Wert nur.

**Dorf-Median je Bodenmischung und Ambient (Tint `#1a1410`, warm-dämmrig):**

| Bodenmischung | a=0,00 | a=0,10 | a=0,15 | **a=0,22** | a=0,30 |
|---|---|---|---|---|---|
| A: 70 % Gras / 25 % Weg | 46,9 | 44,4 | 43,1 | **41,3** | 39,2 |
| **B: 45 % Gras / 50 % Platz** | 76,5 | 71,0 | 68,2 | **64,3** | 59,9 |
| C: 30 % Gras / 65 % Platz | 91,5 | 84,4 | 80,9 | **76,0** | 70,4 |

Highlight-Spalte (M1 „Anteil L>96", außen) bei Mischung B: 3,0 % bei a=0, **1,2 % bei a=0,22** — die GRAVEYARD-Schwelle E1 liegt bei **1,01 %** (`SPEC_GRAFIKPASS_6.md:196`). Sie wird also **schon vom Bodenmaterial allein** gehalten, ohne einen einzigen Lichtkegel.

**Empfehlung — kein Tageslicht-Dorf, sondern Zwielicht:**

```
DORF.ambient      = 0.28      (paarweise verschieden zu 0.22/0.55/0.52/0.48)
DORF.ambientTint  = '#1a1410' (warm-dämmrig; ambientTint ist NIRGENDS testgebunden,
                               Beleg design/GP6_LANDKARTE.md:458)
```

Begründung, dreifach:
1. **`GDD.md:40` sagt „Dauerzwielicht"** — 0,10 wäre Mittag und widerspricht der Spec.
2. **`design/GP6_LANDKARTE.md:399` warnt:** „`ambient === 0` beendet `draw()` sofort (`lighting.js:128`). Ein GP6-Pass, der Quantisierung in `draw()` einbaut, darf für Tag-Maps nicht plötzlich zeichnen. Aktuell hat keine Map `ambient === 0`." Ein Dorf bei 0,00 wäre die erste — und eine tickende Bombe für jeden Renderer-Umbau. Sonde H prüft das mit.
3. Bei **0,28 + Mischung B liegt der Median bei ~60**, und mit dem Herdfeuer/Fensterlicht darüber. Das ist ein **eigenes, neues M1-Band** — kein bestehendes Band reicht so hoch (33..50).

**Vorschlag für die neue M1-Zeile (Phase 0 nachmessen, dann einfrieren):**

| Karte | Median-L | Highlight (Anteil L>96) | Anteil L<16 |
|---|---|---|---|
| **DORF** | **54..66** | ≥ 1,5 % (E1-Neueichung in P0) | ≤ 2,0 % |

Dazu die GP6-Disziplin unverändert übernehmen: feste Kameras aus der Landkarte, 8 eingefrorene Phasen bei Bewegtem (`GP6_LANDKARTE.md:60-64`), Positiv-Kontrolle (ein Archivbild reproduziert seinen Median ±0,5) und Negativ-Kontrolle (Schwarzbild → Median < 5), sowie das Goodhart-Gate „Highlight-Texel auf ≥ 3 Tonklassen, ≥ 12 Cluster, kein Einzelton > 60 % außen".

### 2.5 Das EINE rote Gate — und warum es die Spec schon gelöst hat

```
smoke_test.mjs:600-607
  const torches = def.torchChars.flatMap((ch) => m.findTiles(ch));
  check(`${name}: findTiles liefert Fackeln (${torches.length}) ...`,
        torches.length > 0 && bad === undefined);
```

Diese Schleife läuft über **alle** `MAPS`. Eine fackellose Karte macht sie rot — Sonde B, gemessen: `ROT findTiles liefert Fackeln (0)`.

Zweitens: `smoke_test.mjs:2633-2639` verlangt für **jedes** `torchChar`, dass sein Legendeneintrag `anim` mit **exakt 3 Frames** führt.

**Lösung ohne eine einzige Teständerung:** `GDD.md:40` nennt „ein zögerndes **Herdfeuer**". Das Dorf bekommt eine Herdstelle als `torchChar` mit 3-Frame-`anim`. Damit sind beide Gates grün **und** die Karte hat ihre einzige warme Lichtquelle genau dort, wo die Art-Direction sie erlaubt.

Zwei Anschlussdetails:
* `main.js:1160-1167` setzt `l.wall = true` nur, wenn der Art-Key mit `torch_wall` beginnt. Ein Herdfeuer heißt nicht so ⇒ Bodenfackel-Hotspot `cy−2`. Damit der Hotspot nicht im Sockel sitzt, gehört der Flammenkern-Ton `1` in die **Grid-Zeilen 5..7** — genau die Zone, die `check_gfx6_art.mjs:575` für Bodenfackeln erzwingt. Das Gate ist zwar **namensgebunden** (`FAMILIEN` listet nur `torch_0/1/2` bzw. `torch_wall_*`), das Herdfeuer wird also nicht geprüft — die Konvention einzuhalten ist trotzdem richtig, sonst leuchtet das Licht am Feuer vorbei.
* `main.js:2127` `LIT_FLOOR_MAPS = new Set(['CATACOMBS','FLUESTERGRUFT','BOSS_KAMMER'])` — das Dorf gehört **nicht** hinein (Lit-Dither ist eine Steinboden-Sprache).

### 2.6 Musik: harte Interface-Pflicht

`main.js:843-851 musikFuerZustand` → `musikStarten(mapDef.music)` → `holeMusik` → `songs/index.js:33-37 songFuer` **wirft** bei unbekanntem Schlüssel („kein stilles Schweigen"). ⇒ **`DORF.music = 'dorf'` ohne registrierten Song lässt `buildWorld` hart abstürzen.** Der Song muss mit der Karte zusammen kommen. (Und Michaels Hörtest steht noch aus — Slice 6 muss Audio-Iterationen abwarten können, ohne dass die Karte blockiert: der Dorf-Song ist die einzige Kopplung.)

---

## 3. WELT-STRUKTUR

### 3.1 Wo das Dorf hängt

`GDD.md:38` gibt die Topologie vor: „oben das sterbende Dorf, darunter die Toten." Die Portalkette ist heute `GRAVEYARD → CATACOMBS → FLUESTERGRUFT → BOSS_KAMMER` (`maps.js:737`). Das Dorf gehört **davor**, nicht hinter den Friedhofs-Süden.

Der natürliche Anschluss steht bereits im Bestand: **`GRAVEYARD.playerSpawn = tc(3,12)`** (`maps.js:621`) — der Spieler startet heute schon am **Westende des Hauptwegs**. Zeilen 12 und 13 sind über die ganze Breite Weg (`maps.js:79-80`). „Du kommst aus dem Dorf" ist also die Erzählung, die die Karte längst behauptet.

### 3.2 Was der Anschluss kostet (gemessen, `.tmp/slice6_probe/s6b_welt_anschluss.mjs`)

Ausgangslage bestätigt: `GRAVEYARD` sol **und** geo sind heute byte-identisch zu den Goldenen von `204e28f`.

| Variante | sol (`smoke:2174`) | geo (`smoke:2175`) | Rand-Gate (`smoke:119`) |
|---|---|---|---|
| **V1 — Portal-AABB auf die Wegkachel (1,12), `rows` unangetastet** | **unverändert ✅** | **GEÄNDERT ⚠️** | grün |
| V2 — Tor in den Westrand schlagen + Portal | GEÄNDERT ❌ | GEÄNDERT ❌ | **ROT (0,13)** ❌ |
| V3 — Dorf eigenständig, Rückkehr per Item („Stadtportal") | unverändert ✅ | unverändert ✅ | grün |

**V2 ist raus** — sie bricht eine echte Designregel, nicht nur einen Hash.

**V1 ist der Weg**, kostet aber etwas Besonderes: `smoke_test.mjs:2146-2149` deklariert wörtlich, dass bisher nur `sol` je neu erzeugt wurde und **„geo BLEIBT byte-identisch … ein geo-Drift wäre ein STOPP-Signal."** Slice 6 wäre die **erste geo-Änderung der Projektgeschichte**. Das ist machbar (Präzedenz: „erlaubte Alt-Test-Änderung #1, GP4-§5"), muss aber in der Spec **namentlich, zeilengenau und mit git-diff-Beleg** sanktioniert werden — genau die Disziplin aus `SPEC_SLICE_5.md:65` („sanktionierte Stellen §7.B/C per git-diff belegt").

**Gratis-Zugabe:** `solHash` liest nur `rows`+`legend.solid`, `geoHash` ruft zwar `createTilemap(..., overRows)`, nutzt aber nur `findTiles` — und das ist **ground-only** (`tilemap.js:11`). ⇒ **Ein Torbogen als Over-Layer-Kachel über dem Friedhofs-Westweg ist sol- UND geo-neutral.** Das Dorf-Tor kann also sichtbar gebaut werden, ohne einen zweiten Hash anzufassen.

**V3 (Diablo-Stadtportal) bleibt als Zusatzsystem attraktiv**, nicht als Ersatz: es macht die Rückkehr aus der Tiefe zum Händler erst spielbar (heute müsste man drei Karten zurücklaufen) und ist Diablo-kanonisch. Kosten: ein Warp-Pfad in `main.js` neben `buildWorld` — kein Portal-AABB, kein Hash.

### 3.3 Startkarte — bewusst offen lassen

`GDD.md:31` will den Start im Dorf. `main.js:264` `let startMapKey = 'GRAVEYARD'`. Eine Umstellung bricht die Flusstests: `.tmp/check_main_slice1.mjs:3` beschreibt den kanonischen Ablauf „Titel → Friedhof → …", `:197-202` prüft `ambientAlpha() == 0.22` direkt nach Enter, `:246` und `:283` nochmal. Das sind ~4 sanktionierte Zeilen **plus** eine umgeschriebene Testerzählung — deutlich teurer als der Portal-Anschluss.

**Empfehlung: Startkarte in Slice 6 auf `GRAVEYARD` lassen**, das Dorf per Portal erreichbar machen, und die Umstellung als eigene, kleine Etappe („Slice 6b: Dorf wird Startpunkt und Speicheranker") führen — dann ist die Flusstest-Änderung eine isolierte, belegbare Runde statt Kollateralschaden.

### 3.4 Sichere Zone — was Gegnerlosigkeit *sauber* erzwingt

Gemessen: Gegner entstehen an **genau zwei** Stellen.
1. `main.js:1113-1122` — ausschließlich aus `mapDef.skeletonSpawns` / `ghoulSpawns` / `enemySpawns`.
2. `boss.js:133-135 spawnAdds` — nur der Grabwächter, und der lebt nur in `BOSS_KAMMER`.

⇒ **Leere Spawn-Listen genügen mechanisch.** Sonde A bestätigt: alle Spawn-Gates laufen mit leeren Listen sauber grün (`findIndex` auf `[]` liefert −1).

**Aber:** nichts *hält* sie leer. Es gibt keinen Wächter, der ein versehentlich eingefügtes `enemySpawns`-Objekt im Dorf bemerkt — im Gegensatz zum Elite-Gate, das genau so eine Regel schon durchsetzt (`smoke_test.mjs:1567-1570` „elite-Flags NUR in der FLUESTERGRUFT"). Nach dem Prinzip „Fabrik vor Fleiß" (`MASTERPLAN_TIEFE.md:20-22`) gehört das gehärtet:

```js
// additiv, Muster smoke_test.mjs:1567-1570
check('DORF ist gegnerfrei (sichere Zone)',
  DORF.skeletonSpawns.length === 0 && DORF.ghoulSpawns.length === 0
  && (DORF.enemySpawns || []).length === 0);
```

Zweitens: der **Respawn** zielt auf `currentMapKey` + `lastSpawn` (`main.js:2054 buildWorld(currentMapKey, lastSpawn, true)`) und halbiert das Gold davor (`:2053`). Das Dorf als „sicherer Speicherpunkt" (`GDD.md:34`) will die andere Regel: **Tod → Respawn im Dorf, ohne Goldstrafe** wäre eine Balance-Entscheidung für Michael, nicht für uns. `save.js` speichert `mapKey`+`spawn` bereits (`save.js:9-12`) — ein „Heimatanker" im Save-Schema v2 ist ein Zwei-Feld-Eingriff.

---

## 4. GENERATOREN-WIEDERVERWENDUNG

### 4.1 Das Muster, das direkt trägt

`.tmp/gen_over_gp6.mjs` ist die Blaupause. Sein Aufbau (`:6-21`) ist 1:1 auf ein Dorf-Layout übertragbar:

1. Bestand als Grundlage nehmen, nur Zonen ersetzen.
2. Anker deterministisch setzen (`variantIndex`-Kopie `:33-38`, **kein RNG, kein Zeitstempel** — erzwungen durch den Quelltext-Wächter `smoke_test.mjs:1762-1765` über `game/js/world/` und `game/js/art/`).
3. **Freie Legendenzeichen automatisch bestimmen** (`:57-64`: `belegt`-Set aus Legende + rows + overRows, Kandidatenliste, Kollisionsprüfung) — genau der Mechanismus, der GP6 die Zeichen `1..6` und `P` verschafft hat.
4. **Den Over-Layer in eine Pixel-Tintenmaske rastern** (`:243-270`) und darüber messbare Gates fahren: Integralbild (`:274-281`), Fenstersummen, Key-Vielfalt, Maximalanteil (`:295-315`).
5. **Deckungs-Reparatur mit Budget** (`:213-233`): fehlt Deckung, wird zuerst ein günstiger Anker gesetzt, erst als Rückfall die teure Einzelkachel.

Für ein Dorf heißt Schritt 4 wörtlich: *„jede Hauswand-Zelle muss von genau einem Dach-Anker überdeckt sein"* statt *„jeder Stamm trägt eine Krone"*. Die Datenstruktur (`deckungsRaster`) ist identisch.

`.tmp/gen_crowns_gp6.mjs` liefert das zweite Muster: Grids aus **fest verdrahteten Formprimitiven** (`KLASSEN.lappen`, Ellipsen, `:48-60`) plus Hash-Rauschen (`noise` `:39`) plus **Spiegel- und Scher-Posen automatisch**. Für Häuser wird aus „überlappenden Blattlappen" schlicht „Dachfläche + Firstlinie + Traufe" — die Erzeugungsmaschinerie bleibt.

### 4.2 Häuser als span-Objekte: die harte Grenze

`tilemap.js:725-730` erzwingt:
* `span` ist **1..4** ⇒ maximal 64×64 px, ein Haus ist also höchstens 4×4 Kacheln.
* `span (>1)` verbietet `variants`/`anim` am selben Eintrag.
* **span-Zeichen dürfen NIE in den GROUND-rows stehen** — „Ground bleibt 1×1".
* `tilemap.js:878`: **Over-Zeichen sind NIE solide.**

⇒ **Ein Haus kann nicht als ein einziges span-Objekt gebaut werden.** Es muss zweiteilig sein, und das ist zugleich die richtige Lösung:

```
GROUND-rows  = der KOLLISIONSGRUNDRISS: solide Wandkacheln 16×16
               + eine begehbare Türschwellenkachel (Portal-AABB o. Innenraum)
OVER-rows    = das DACH als span-Anker [3,2] / [4,3], nie solid
```

Der Spieler läuft also **hinter** dem Haus am oberen Rand entlang und **unter** dem überhängenden Dach durch — exakt das Layering, das `CLAUDE.md:34` als Pflicht nennt („Layering (Kronen über dem Spieler)").

### 4.3 Dach-über-Spieler: die GP6-Kronen-Mechanik ist fertig und wartet

`tilemap.js:1147, 1252-1266` — GP6 Runde 2, Juror-Rezept K:

```js
const unterKrone = pTile && def.span
  && pTile.tx >= tx && pTile.tx < tx + def.span[0]
  && pTile.ty >= ty && pTile.ty < ty + def.span[1];
if (unterKrone) { ctx.globalAlpha = CROWN_PLAYER_ALPHA; ctx.drawImage(img, ax, ay); ctx.globalAlpha = 1; }
```

Steht der Spieler im Span-Fußabdruck, wird **genau dieses** Over-Objekt halbtransparent (α 0,55) gezeichnet — „Layering statt Auslöschung", genau ein Draw, Alpha danach zurückgesetzt. **Ohne `opts.playerTile` ist das Verhalten byte-gleich zum Bestand** (`:1144-1146`), also rückwärtskompatibel.

⇒ **Ein Dach über dem Spieler kostet in der Engine null Zeilen.** Es braucht nur ein `span`-Legendenzeichen im Over-Layer. Das ist der stärkste Wiederverwendungshebel im ganzen Auftrag.

Zusatz gratis mitgeliefert: `shadowArt` (`tilemap.js:760-763`, Ein-Draw-Bake `sw*16 × 32`) gibt jedem Dach seinen Schlagschatten auf den Dorfplatz. `swayPoses` (`:742-752`) ist für Dächer sinnlos, aber für **Wäscheleinen, Fahnen und Marktsegel** exakt die richtige Mechanik — 8er-Folge über 5 gebackene Posen, `poses[0] === art`.

### 4.4 Konkrete Generator-Liste für Slice 6

| Generator | Vorbild | Erzeugt | Gates, die er selbst nachrechnet |
|---|---|---|---|
| `gen_dorf_layout.mjs` | `gen_over_gp6.mjs` | `DORF_ROWS` + `DORF_OVER_ROWS` | Rand solide; jede Wandzelle gedeckt; **jedes Haus hat genau 1 begehbare Tür**; Platz zusammenhängend (Flood-Fill von `playerSpawn`); keine Sackgasse; freie Legendenzeichen kollisionsfrei |
| `gen_dorf_dach.mjs` | `gen_crowns_gp6.mjs` | 2 Dachklassen × 2 Spiegel + 2 Bakes | Bbox-Gate; Maßklassen 48×32/64×48 exakt; Firstlinie durchgehend; Traufschatten-Deckung |
| `gen_dorf_boden.mjs` | `gen_grass_gp5.mjs` (47er-Pool) | 9er-Platz-Pool | keine gerade Klassenkante > 3 Kacheln (das GP5-R2-Gate, `maps.js:56-60`); Wiederholungsabstand |
| `gen_dorf_deko.mjs` | `gen_deco3.mjs` | Streuung von Fass/Kiste/Halm | Dichte < 1 pro 3×3; nie an Portale/Spawns/Türen angrenzend; nie zwei orthogonal benachbart |

---

## 5. SoM/DIABLO-REFERENZ → konkrete Dorf-Spezifikations-Skizze

### 5.1 Was ein 16-Bit-Dorf lesbar macht

Tristram (Diablo 1) und Potos (Secret of Mana) teilen dieselbe Anatomie, und sie ist erstaunlich klein:

1. **Ein zentraler Platz**, den der erste Blick ganz erfasst — er ist der Kompass. Alles andere wird von ihm aus gefunden.
2. **5-8 Gebäude**, aber nur **2-3 betretbar/benutzbar**. Der Rest ist Silhouette. (Tristram: acht Häuser, davon Ogdens Taverne, Griswolds Schmiede und Pepins Haus tatsächlich relevant.)
3. **Eine vertikale Landmarke**, die von überall zu sehen ist. In Tristram ist es der Kirchturm im Norden; er zeigt zugleich, wo es weitergeht.
4. **Ein einziger warmer Lichtpunkt**, der „bewohnt" signalisiert. Alles andere ist kalt.
5. **NPCs stehen fest und sichtbar**, jeder an *seinem* Ort mit *seinem* Requisit. Man erkennt den Schmied am Amboss, bevor man den Namen liest.
6. **Wege erzählen die Benutzung**: ausgetreten dort, wo man geht; überwuchert dort, wo niemand mehr hingeht. Das ist bei Grimlight schon vorhanden — Weg-Varianten `path_v1..v6` und die Fringe-Mechanik machen das kostenlos.

Grimlights Zusatzauflage (`GDD.md:17,40`): **„verfallen", nicht „gemütlich".** Vernagelte Fenster, zwei drei Bewohner, kein Marktgewimmel. Weniger NPCs, mehr leere Häuser — das ist billiger UND richtiger.

### 5.2 Kartengröße

**44 × 28 Tiles = 704 × 448 px.**

Herleitung: Der Friedhof ist 40 × 24 (`maps.js:66-94`), das Sichtfenster 320×180 = 20 × 11,25 Tiles. 44×28 sind **2,2 × 2,5 Bildschirme** — groß genug, dass das Dorf ein Ort ist und kein Korridor, klein genug, dass man es in zwei Bildschirmschwenks überblickt. Fläche 1232 Kacheln = **+28 % gegenüber dem Friedhof**, also im gemessenen Art-Budget (§1.2). 48×32 (was ich in der Gate-Sonde durchgerechnet habe) läuft technisch ebenso, kostet aber 25 % mehr Bodenfläche ohne Erzählgewinn.

### 5.3 Gebäudeliste (7 Gebäude, 3 relevant)

| # | Gebäude | Grundriss | Rolle |
|---|---|---|---|
| 1 | **Die Schmiede** (Nordwest am Platz) | 4×3, Dach `[4,3]` | Händler. Amboss + Esse davor, das **zweite** Warmlicht. |
| 2 | **Heddas Kate** (Nordost am Platz) | 3×2, Dach `[3,2]` | Heilerin/Tränke. **Das Herdfeuer** — die Lichtquelle, die `smoke:604` grün hält. |
| 3 | **Die Kapelle** (Nord, hinter dem Platz) | 4×3, Dach `[4,3]` | Quest-Geber. Höchster Baukörper, zeigt nach Norden = Richtung Friedhofstor. |
| 4-6 | **Drei verlassene Katen** | 3×2 | Silhouette, vernagelte Fenster, keine Tür-Interaktion. Erzählen den Verfall. |
| 7 | **Der Speicher / die Scheune** (Süd) | 4×3 | Kulisse; dahinter der Weg zum Friedhofstor. |
| — | **Der Brunnen** (Platzmitte-West) | 2×2 solide, Ground | Orientierungspunkt, kein Dach. |
| — | **Die geborstene Dorfglocke** (Platzmitte-Ost) | 1×2 solide + Over-Joch | **Die Landmarke.** Vertikal, silhouettenstark, und sie erklärt beiläufig, warum niemand mehr läutet. |
| — | **Marktstand** (am Platz) | 2×1 Theke solide + Segel `[3,2]` Over | Mile, das Botenkind. Segel mit `swayPoses`. |
| — | **Das Tor nach Osten** | Over-Bogen, nicht solide | Ausgang zum Friedhof. |

### 5.4 NPC-Liste (5, je ein Satz Rolle)

| NPC | Ort | Rolle in einem Satz |
|---|---|---|
| **Bran der Schmied** | Amboss vor Gebäude 1 | Kauft Loot gegen Gold und verkauft je Slot ein festes Angebot — die **Gold-Senke** (`items.js:27-36` hält bereits 8 Affixe, 3 Slots, 2 Seltenheiten bereit). |
| **Alte Hedda** | Herdfeuer vor Gebäude 2 | Verkauft Tränke und heilt einmal je Rückkehr — sie ist der Grund, warum man ins Dorf zurückkommt. |
| **Vater Corm, der Küster** | Kapellenstufe (3) | **Quest-Geber**: er weiß, was unter dem Friedhof liegt, und benennt die Ziele, die das Spiel bisher nur wortlos hatte. |
| **Mile, das Botenkind** | Marktstand | Verkauft **genau ein** zufälliges Item pro Dorfbesuch zu Wucherpreis — Diablos Wirt, zweite Gold-Senke, nutzt den bestehenden Item-Würfel. |
| **Der Torwächter** | Osttor | Sagt drei Sätze und sonst nichts; er ist der Respawn-Anker und die menschliche Form der Karte. |

Alle fünf im Spielermaß **16×24** (`sprites.js` führt 17 Grids in dieser Klasse). Die Kleiderfarben müssen sich vom violetten Heldenumhang `u/U/X/Z` absetzen — verfügbar sind Leder `q/j/Q/J`, Rost `4/5/6`, Leinen `O/B`, plus die zwei freien Slots `c`/`G`.

### 5.5 Quest-Skizzen (5, alle mit vorhandenen + Slice-6-Systemen erzählbar)

Für jede Quest steht dahinter, welches **bestehende** System sie trägt — es wird nichts erfunden, was nicht schon läuft.

**Q1 — „Der letzte Docht" (Hedda, Tutorial).**
Bring Hedda Talg von fünf Skeletten. *Trägt:* der Kill-Event-Strom, den `main.js` ohnehin führt, plus ein Zähler im Save v2. *Belohnung:* 2 Tränke + Gold. *Lehrt:* dass Dorf-NPCs Ziele geben und dass man zurückkommt.

**Q2 — „Brans Werkzeug" (Schmied, Gold-Senke öffnen).**
Brans Hammer liegt in den Katakomben. *Trägt:* `propSpawns` mit `content` — der Mechanismus existiert bereits für `'boomerang'`, `'gold'`, `'boss_key'`, `'heart'` (`props.js:19`), und `runFlags.openedChests` ist **schon pro Karte geschlüsselt** (`main.js:1069-1071` `chestKey`). Es braucht genau einen neuen `content`-Wert. *Belohnung:* Brans Angebot steigt auf die Seltenheitsstufe „Selten" — die Gold-Senke bekommt erst dadurch Tiefe.

**Q3 — „Der versiegelte Sarg" (Küster, Hauptfaden).**
Corm erzählt vom Grabwächter und schickt den Spieler nach dem `boss_key`. *Trägt:* **null neue Mechanik.** Das Tor existiert (`map_fluestergruft.js:168` `requires: 'boss_key'`), die Schlüsselprüfung existiert (`maps.js:749-753 portalBlocked`), die Truhe existiert. Die Quest gibt dem Bestand nur eine Stimme — maximaler Erzählgewinn pro Zeile Code.

**Q4 — „Die Nachtwache" (Torwächter, Abkürzung kaufen).**
Zahle dem Wächter Gold, damit er den Pfad zur Flüstergruft freihält. *Trägt:* Gold + eine Erweiterung von `portal.requires` von „Zelda-Schlüssel" auf „Quest-Flag" — ein Zweig in `portalBlocked` (`maps.js:750-753`), sonst nichts. *Wirkung:* die zweite echte Gold-Senke, und sie löst das Rücklaufproblem aus §3.2.

**Q5 — „Was der Wind mitbringt" (Kettengespräch).**
Sprich mit drei NPCs in beliebiger Reihenfolge; danach nennt der dritte den Ort einer vergessenen Truhe auf dem Friedhof. *Trägt:* **nur Dialogzustand** — drei Booleans im Save v2 und eine bestehende Truhe. Zeigt, dass Reden allein etwas verändert; die billigste Quest der Liste und die, die das Dorf am meisten belebt.

Keine dieser fünf braucht eine Kampfmechanik, eine neue Entity oder eine neue Karte. Zusammen brauchen sie: **Dialog, einen Quest-Flag-Block im Save v2, einen Zähler, einen neuen `chest.content`-Wert, einen Zweig in `portalBlocked`.**

---

## 6. PRIORISIERTE ARBEITSLISTE

**P0 — Entscheidungen, die vor der Spec fallen müssen (Fable + Michael)**

| # | Entscheidung | Warum jetzt |
|---|---|---|
| 0.1 | **Art-Direction-Regel 4 biom-lokal aufweichen** („warm ist im Dorf Material, warm-leuchtend bleibt nur Feuer") | `ART_DIRECTION.md:26-27` verbietet sonst das ganze Biom. Ohne diesen Satz ist jede Dorf-Art regelwidrig. |
| 0.2 | **`c` und `G` umwidmen** (Wert-Änderung, §0.11-konform) + Deklaration der zwei abgelösten Alt-Wächter | Zwei Slots sind die gesamte Reserve. `check_art_gfx3.mjs:57` / `dev_art_slice2.mjs:124` namentlich erledigen. |
| 0.3 | **Startkarte bleibt `GRAVEYARD`** in Slice 6 | Spart ~4 sanktionierte Flusstest-Zeilen + die Testerzählung. Umstellung als eigene Etappe. |
| 0.4 | **Eine geo-Hash-Änderung wird sanktioniert** (`smoke_test.mjs:2150`) | Erste geo-Änderung der Projektgeschichte; heute als „STOPP-Signal" deklariert (`:2149`). Braucht ausdrückliche Freigabe. |
| 0.5 | **Zwielicht, nicht Tageslicht**: `ambient 0.28`, Tint `#1a1410` | Folgt `GDD.md:40`; hält `lighting.js:128` von der `ambient===0`-Falle fern. |

**P1 — Phase 0 des Slice (messen, bevor gebaut wird; GP6-Disziplin)**

| # | Aufgabe | Ergebnis, das bindend wird |
|---|---|---|
| 1.1 | **M1-Band DORF eichen** — Simulation wie `.tmp/gp6_p0b_e1_sim.py`, Positiv- und Negativkontrolle | Median-Band (Vorschlag 54..66), E1-Highlight-Schwelle, L<16-Deckel → als Rev-Zahl einfrieren |
| 1.2 | **Umwidmungs-Rechner für `c`/`G`** nach dem Muster `gp6_p0b_offset.mjs` | Soll-Hex-Tabelle, Rampen-Monotonie und Sättigungsdeckel nachgerechnet |
| 1.3 | **Generator-Entwürfe** `gen_dorf_layout` + `gen_dorf_dach` (nur `.tmp/`, keine Spieldatei) | Layout, freie Legendenzeichen, Deckungsbeweis, Beweiszelle „Spieler unter Dach" |
| 1.4 | **Ton-Zensus-Wiederholung nach Umwidmung** (`s6b_ton_zensus.mjs` liegt bereit) | Nachweis, dass kein Bestandsgrid durch `c`/`G` kippt |

**P2 — Bau (parallel, exklusiver Besitz, alle Opus)**

| # | Agent | Besitz | Umfang |
|---|---|---|---|
| 2.1 | **ART** | `art/sprites.js`, `art/palette.js` | ~70 Grids (§1.2). Reihenfolge: Herdfeuer + Wände + Dächer zuerst (sie entsperren die Gates), dann Möblierung, dann NPCs. |
| 2.2 | **WORLD** | neue Datei `world/map_dorf.js` + `maps.js` (Registrierung + **ein** Portal) | ~300 Zeilen. Muster: `map_fluestergruft.js` (209 Zeilen für 40×24). |
| 2.3 | **AUDIO** | `audio/songs/song_dorf.js` + `songs/index.js` | Pflicht, sonst wirft `songFuer` (`index.js:33-37`). Muss Michaels Hörtest-Ergebnis abwarten können. |
| 2.4 | **ENGINE** | `main.js` (Warp-Pfad V3, optional), `portalBlocked`-Zweig für Q4 | klein und additiv |

**P3 — Integration & Härtung**

| # | Aufgabe |
|---|---|
| 3.1 | **Maßtabelle in ZWEI Wächtern** ergänzen, falls Dächer außerhalb 48×32/64×48 fallen (`check_gfx6_art.mjs:122-129`, `smoke_test.mjs:1732-1739`) — besser: gar nicht nötig machen |
| 3.2 | **Additives Gate „DORF ist gegnerfrei"** (Muster `smoke_test.mjs:1567-1570`) |
| 3.3 | **Additive DORF-Zeile in §36** (`sol`/`geo`/`ambient`) — Härtung, kein Zwang |
| 3.4 | **geo-Golden neu erzeugen** mit git-diff-Beleg der EINEN Zeile (`smoke_test.mjs:2150`) |
| 3.5 | Suiten grün: `check_syntax`, `smoke ×3`, 3 Flusstests, `check_gfx6_art`, `check_save_slice4`, `probe_god`, APK-Build |

**P4 — Messziel-Abnahme & Jury** — M1 (neues DORF-Band) + Sicht-Jury nach GP6-Muster (`SPEC_GRAFIKPASS_6.md:643-668`), dann Michael am Gerät.

---

## 7. RISIKEN, EHRLICH BENANNT

1. **Die Art-Direction, nicht die Technik, ist der Engpass.** Technisch ist ein Dorf fast gratis (1 rotes Gate, 1 Hash). Ästhetisch bricht es die zentrale Ton-Regel des Projekts. Wenn Michael die Regel nicht aufweicht, wird das Dorf entweder kalt-grau (= liest nicht als Dorf) oder regelwidrig.
2. **Die Palette ist auf Kante.** Ein alnum-Zeichen frei, und das ist verboten. Nach `c`/`G` ist **null Reserve** übrig. Slice 7 (neuer Dungeon) und Slice 8 haben dann keine Tonluft mehr — spätestens dort kommt ein echter GP7-Palettenschritt (Symbol-Namespace erweitern) unausweichlich, und der Zeitpunkt sollte bewusst gewählt werden, nicht erzwungen.
3. **Meine M1-Vorrechnung ist eine Untergrenze, kein Messwert.** Sie trifft GRAVEYARD auf 0,1 L (39,1 vs. 39,2), unterschätzt aber jede lichtreiche Karte um 10-13 L. Für die eigentliche Bandsetzung braucht es die echte Playwright-Messung auf dem 320×180-Backing-Store (`gp6_belichtung_messung.py`), nicht meine Palettensimulation.
4. **Der Hörtest hängt.** `DORF.music` koppelt die Karte an Slice 5. Empfehlung: `map_dorf.js` mit `music: 'dorf'` bauen, den Song-Stub **sofort** registrieren (sonst wirft `songFuer` hart) und die Komposition unabhängig iterieren.
5. **Der Umfang ist kein GP-Pass, sondern ein Slice.** ~70 Art-Grids **plus** Dialog **plus** Händler **plus** Quest-Gerüst **plus** Save v2 in einem Slice ist mehr als GP5 (+106 Grids, aber ohne neue Systeme). Ich empfehle die Aufteilung **6a = Biom + Karte + NPC-Standbilder + Dialog** (spielbar: man kann durchs Dorf laufen und reden) und **6b = Händler + Quests + Save v2** — das hält `MASTERPLAN_TIEFE.md:10-11` ein („Jeder Slice endet auf Michaels Handy").

---

## ANHANG — Sonden

Alle in `/home/coder/Grimlight/.tmp/slice6_probe/`, read-only gegenüber `game/`, `tools/`, Tests:

| Datei | Was sie beweist |
|---|---|
| `s6b_ton_zensus.mjs` → `s6b_ton_zensus.json` | Ton-für-Ton-Zensus (L, S, R−B, Texel, Grids, Tiles/Sprites) + Flächenanteile je Karte; findet `c`/`G` mit 0 Texeln |
| `s6b_gates_dorf.mjs` | 20 Gate-Simulationen gegen eine synthetische DORF-Map: **19 grün, 1 ROT** (`smoke:604`) |
| `s6b_belichtung_dorf.mjs` | M1-Vorrechnung; validiert gegen GRAVEYARD 39,1 vs. Spec 39,2; Dorf-Mediane und Highlight-Anteile je Ambient/Tint; Rampen-Analyse |
| `s6b_welt_anschluss.mjs` | sol/geo-Kosten der drei Anschlussvarianten; belegt V1 als einzigen gangbaren Portalweg |