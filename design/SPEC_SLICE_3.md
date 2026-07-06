# Technische Spezifikation, Slice 3 "Progression"

Baut auf Slice 0/1/1.5/2 auf. Bindend bleiben alle früheren Specs und
Übergaben (Spawn-Anker = Zentrum, attackId-Einmaltreffer, Knockback via
moveWithCollision, Fußkanten-Test-Anker, Y-Sort nach Fußkante, Event-Formen,
Kampfcode liest nur `player.stats`). Abweichungen nur wenn technisch nötig,
dann dokumentieren.

Diese Spec ist die Synthese eines 3-köpfigen Design-Panels (Systemdesign/
Balance, Engine-Architektur, Spielgefühl/Mobile-UX). Panel-Entscheidungen
(bindend):

1. **Level = Zähigkeit, Items = Macht.** Level geben ausschließlich +2 maxHp
   je Stufe plus eine Vollheilung als Belohnungsmoment. Die sechs Kampf-Stats
   (dmg, reach, speed, knockMult, potionHeal, pickupRadius) bleiben für immer
   item-exklusiv. Drop-Tabellen, Affix-Pool und Pity bleiben byte-identisch.
2. **XP-Schiene schmal:** Schwellen kumulativ `[0, 20, 50, 90, 140]`,
   LEVEL_CAP 5, kein XP-Verlust bei Tod, keine Skillpunkte, keine Auswahl.
   Kein Pausieren beim Level-Up.
3. **Der Boss (Der Grabwächter) ist die Prüfung der gelernten Verben:**
   reiner Nahkämpfer, 0 Projektile, genau 2 Angriffsmuster plus Beschwörung,
   Eskalation nur über Tempo (Cooldowns/Telegraphen), nie über neue Muster.
4. **Boss droppt KEIN Gear und gibt KEINE XP** (Slice-2-Entscheidung 5
   sinngemäß: der Run endet direkt danach, das wäre totes Design). Er
   hinterlässt 6-10 Münzen plus die Siegtruhe. Dokumentierte Gegenstimme
   Engine-Panel (garantierter Selten-Drop): abgelehnt.
5. **Der Sieg zieht hinter den Boss.** Die Katakomben-Siegtruhe wird zur
   Gold-Truhe (`content: 'gold'`). Es gibt genau DREI erlaubte Änderungen an
   Alt-Tests, abschließend aufgezählt in §4. Alles andere bleibt grün.
6. **Der Tod beendet den Run nicht mehr:** Respawn am Eingang der aktuellen
   Map, Gold wird halbiert, alles andere (Level, XP, Inventar, Ausrüstung,
   Tränke, Schlüssel, Herzcontainer) bleibt. resetRun gibt es weiterhin nur
   über Titel und Victory.
7. **Boss-Schlüssel und Herzcontainer werden GEBAUT** (2:1-Mehrheit gegen
   das Balance-Panel, das beide streichen wollte). Begründung: der Schlüssel
   erzwingt den Eliten-Kampf als Mini-Höhepunkt, der Herzcontainer belohnt
   das Abweichen vom hellen Pfad und wirkt VOR dem Boss. Beide laufen über
   die bestehende Truhen-content-Weiche, je ca. 10 Zeilen.
8. **Eliten nur als Zahlenfaktoren** (hp x2 aufgerundet, Tempo x1,25, xp x2,
   keine neuen Verhalten) **plus EIN gemeinsames Glut-Overlay** `elite_glow`
   mit Mini-Licht. Keine Palette-Swap-Spritesätze (Flip-Listen-Risiko).
   Eliten existieren nur in der Flüstergruft.
9. **Bestandsgegner werden NICHT skaliert:** alle HP-, Tempo-, Schadens- und
   Drop-Werte von Skelett, Ghul, Grufthund, Rostpanzer bleiben exakt
   Slice-2-Stand. Schwierigkeit entsteht über Komposition und den Boss.
10. **NICHT gebaut** (abschließend): Gold-Händler/Dorf-Hub, Minimap/Automap,
    Save-System (S4), Boss-Projektile, Screen-Shake/Hit-Stop/Partikel (S5),
    Wasser-Spielmechanik (Flutung ist reines Tile-Dressing), vierter
    Touch-Button, Skilltrees, XP-Zahlen über Gegnern, Boss-Cutscene/Dialog,
    Tür-Mechanik im Tilemap (Gating nur über Portal-Felder), Migration der
    Legacy-Spawn-Arrays in GRAVEYARD/CATACOMBS (erst S5).

## 1. Umfang

1. **XP/Level:** XP je Kill, 5 Level, +2 maxHp und Vollheilung je Stufe,
   XP-Leiste im HUD, STUFE-Toast mit Ring-Effekt. Neues Modul
   `items/progression.js`; `items/items.js` wird von NIEMANDEM angefasst.
2. **Zwei neue Maps:** FLUESTERGRUFT (40x24, dunkelste Ebene, geflutete
   Kammern, Licht als Wegweiser) und BOSS_KAMMER (20x12, Ein-Bildschirm-
   Arena). Kette: GRAVEYARD > CATACOMBS > FLUESTERGRUFT > BOSS_KAMMER,
   bestehende Portal/carry-Technik, je eine neue Datei pro Map.
3. **Boss: Der Grabwächter** (`kind: 'graveward'`), eigenes Modul
   `entities/boss.js`, registriert sich im Verhaltens-Dispatch. HP 26,
   2 Angriffsmuster, 2 Beschwörungs-Phasen, Bodenmarker-Telegraphie,
   Boss-HP-Balken.
4. **Eliten** in der Flüstergruft über ein `elite`-Flag im Spawn.
5. **Boss-Schlüssel** (Zelda-Schiene, Portal-Gate) und **Herzcontainer**
   (+2 maxHp permanent für den Run) als Truhen-Inhalte.
6. **Neue Todesregel:** Respawn statt Run-Neustart, Gold-Zoll 50 %.
7. **HUD:** XP-Leiste, Schlüssel-Icon, Boss-Balken, neue Toasts.
8. **Grafikarbeit:** Boss-Spriteset, elite_glow, Level-Up-Ring, Schlüssel-
   Icon, Wasser-/Gruft-Tiles nach Bedarf.

## 2. Spielwerte (bindend)

### 2.1 XP und Level

| Quelle | XP |
|---|---|
| Skelett | 2 |
| Ghul | 4 |
| Grufthund | 5 |
| Rostpanzer | 6 |
| Elite | Basiswert x2 |
| Boss | 0 (Entscheidung 4) |
| Vasen/Urnen/Truhen | 0 |
| Boss-Adds (normale Skelette) | 2, normale Drop-Tabelle |

Schwellen kumulativ `XP_THRESHOLDS = [0, 20, 50, 90, 140]` (Level 1 bis 5),
`LEVEL_CAP = 5`. Level-Up: +2 maxHp, Vollheilung (`hp = maxHp`), Toast
`STUFE n!` in Gold `#f0bf4e`, Ring-Effekt 0,5 s über dem Spieler. maxHp-Kette:
L1 6, L2 8, L3 10, L4 12, L5 14; plus Herzcontainer +2 und Rüstungs-Affix +2
ergibt das Maximum 18.

Budget-Rechnung (Richtwert, nicht asserten): Friedhof 22 XP, Katakomben
60 XP, Flüstergruft 64 XP, Boss-Adds max. 8 XP, gesamt 154. Voll-Clearer
erreicht L5 kurz vor dem Boss, Median-Spieler (ca. 65-70 % der Kills) L4.
XP-Farming über Map-Respawn ist als Schwierigkeitsventil akzeptiert
(Cap 5 deckelt es); im Playtest beobachten.

### 2.2 Der Grabwächter (Boss)

`kind: 'graveward'`, Sprite 24x32, AABB 20x24, **HP 26** (Feintuning nur im
bindenden Band 24-28), Kontaktschaden 1, alle Angriffe Schaden 2,
`knockFactor 0` (immun gegen Knockback), nicht stunbar, blockt nicht.
Creator-Datenfelder (tragen den Sterbepfad, §3 enemies.js): `xp: 0`,
`dieTime: 1.0`, `deathEvent: 'boss_died'`, `noDrops: true`, KEIN dropTable
(kein Gear, keine eigenen Münzen, kein Pity-Einfluss).

**Idle und Aggro:** Der Boss startet im Zustand `idle` an tc(10,4) (steht,
kein Angriff, Kontaktschaden bleibt 1). Aggro (Wechsel zu stalk) beim ersten
Treffer (Schwert oder Bumerang) ODER bei Spielerdistanz <= 64 px; danach
Sicht unbegrenzt, kein De-Aggro. Der Eintritt bei tc(10,9) liegt 80 px
entfernt, der Spieler kann also am Südrand noch umkehren (Frust-Falle nach
Respawn, siehe §2.6.4). Bewegung zwischen Angriffen (stalk): 30 px/s auf
den Spieler zu. Sterbe-Zustand 1,0 s über `dieTime` (statt 0,4 s), das Event
`'boss_died'` pusht der generische die-Zweig über `deathEvent` (§3).

Zustände: `idle | stalk | windupA | sweep | windupB | dash | stuck |
recover | summon | die`.

**Muster A, Rundumschlag** (bei Angriffsbereitschaft und Distanz <= 32 px):

| Wert | Zahl |
|---|---|
| Telegraph windupA | 0,8 s (Phase 3: 0,65 s); Boss stoppt, Schwert-hoch-Sprite, Boden-Ring-Marker |
| Treffer | Kreis Radius 30 px um Boss-Zentrum, aktiv 0,25 s, Schaden 2, Spieler-Knockback x1,5 |
| Recovery | 0,9 s stehend, verwundbar, Kontaktschaden bleibt 1 |

**Muster B, Sturmschlag** (Angriffswahl bei Distanz <= 88 px: B wenn
Distanz > 32 px, sonst A; darüber stalk; genau EINE Grenze, keine Lücke):

| Wert | Zahl |
|---|---|
| Telegraph windupB | 1,0 s (Phase 3: 0,8 s); Boden-Korridor-Marker folgt 0,3 s dem Spieler, dann ist die Richtung EINGELOGGT (Muster Grufthund, kein Homing) |
| Sturm (dash) | 150 px/s für 0,4 s durch moveWithCollision |
| Aufschlag | Hitbox 24x24 vor dem Boss, aktiv 0,2 s, Schaden 2 |
| stuck | Schwert steckt 1,2 s im Boden: keine Bewegung, KEIN Kontaktschaden, normal verwundbar. DAS Bestrafungsfenster (3 Hiebe à 0,35 s). Bumerang-Treffer auf den Boss während stuck verlängert einmalig je stuck auf 2,2 s. |

Globaler Angriffs-Cooldown (stalk zwischen Angriffen): Phase 1 1,2 s,
Phase 2 0,9 s, Phase 3 0,7 s.

**Phasen und Beschwörung:** Phasenwechsel beim Unterschreiten von HP 17 und
HP 9 (je einmalig, Kerben im Boss-Balken). Ablauf: Boss stoppt, Zustand
`summon` 1,2 s (Ruf-Pose, verwundbar, kein Kontaktschaden), danach spawnen
2 normale Skelette (HP 2, xp 2, normale Drop-Tabelle). Anker-Kandidaten
tc(4,3), tc(15,3), tc(4,8), tc(15,8); je Welle die zwei SPIELERFERNSTEN
(nie näher als 64 px am Spieler). Nie mehr als 2 Adds gleichzeitig am Leben
(lebende Adds reduzieren die Welle). Ein Bumerang-Treffer auf den Boss
WÄHREND summon bricht den Ruf ersatzlos ab (die Welle entfällt komplett,
je Phasenwechsel einmal möglich).

**Bumerang-Rolle** (bleibt Utility, nie Tötungsverb): 1. Cast-Abbruch der
Rufe. 2. stuck-Verlängerung +1,0 s. 3. Adds sind normal stunbar. In allen
anderen Fällen prallt der Bumerang wirkungslos ab und beginnt den Rückflug
(kein Stun, kein Schaden, kein Event).

**Boss-Tod:** hp<=0 setzt über `dieTime` den Sterbe-Zustand 1,0 s; nach
dessen Ablauf pusht der generische die-Zweig `deathEvent` = `'boss_died'`
(§3 enemies.js). main.js reagiert auf `'boss_died'`: 1. alle Adds
(`e.summoned === true`) zerbröseln: `state = 'die'`, `dieTimer = 0.4`,
`noDrops = true` (direkt gesetzt, NICHT über hp: kein XP, keine Münzen,
kein Gear, kein Pity). 2. 6-10 Münzen (scatterDrop) plus die Siegtruhe
(`content: 'treasure'`) am festen Anker tc(10,4). 3. `runFlags.bossDead =
true`. Öffnen läuft durch den WÖRTLICH unveränderten Bestandspfad
`chest_opened` > victoryTimer 1,2 s > Victory.

Fairness-Rechnung (Richtwert): Median-Build (Schwert 2) braucht 13 Treffer.
Ein B-Zyklus dauert in Phase 1 ca. 3,8 s (Cooldown 1,2 + Telegraph 1,0 +
Sturm 0,4 + stuck 1,2), ein A-Zyklus ca. 3,15 s. Der Median nutzt etwa
jedes zweite Fenster und landet 2 Treffer je genutztem stuck (der dritte
Hieb passt nur bei perfektem Anlauf: Treffer bei ca. 0,37/0,72/1,07 s bei
0,35-s-Zyklus). Ergibt ca. 10-14 Zyklen plus 2 Rufe plus Add-Kämpfe,
Kampfdauer grob 60-100 s. Mit Bumerang ca. 25-30 % schneller (verlängerte
Fenster, ersparte Adds; innerhalb der bindenden 35-%-Leitplanke).
Nachjustierung NUR über Boss-HP (24-28) und Cooldowns, nie über Drops oder
Gegner-Nerfs.

### 2.3 Touch-Fairness-Checkliste Bosskampf (bindend, prüft der Verify)

1. Jeder Boss-Angriff ist durch Bewegung in mindestens 3 der 4
   Himmelsrichtungen entschärfbar; der Kampf zwingt den Spieler nie in den
   Button-Quadranten (x > 240 und y > 100).
2. Gerichtete Angriffe loggen ihre Richtung spätestens 0,3 s nach
   Telegraph-Beginn ein (kein Homing danach).
3. Kein Telegraph unter 0,6 s, keine aktive Trefferphase über 0,3 s.
4. Adds spawnen mindestens 64 px vom Spieler entfernt.

### 2.4 Eliten

Spawn-Feld `elite: true` in enemySpawns. Wirkung im jeweiligen Creator:
hp x2 (aufgerundet), wander/chase/orbit-Tempi x1,25, xp x2,
`e.elite = true`. Kontaktschaden, Drop-Tabelle, Verhalten, AABB unverändert.
Optik: Overlay-Sprite `elite_glow` (8x8, Glut-Augen `#ae2f2a`, Kante
`#d8722a`) über der Kopfposition, blinkt 0,3 s alle 1,2 s (Sparkle-Rhythmus);
zusätzlich je LEBENDER Elite (state nicht 'die') PRO FRAME ein Licht
`{ x: Zentrum, y: Zentrum, radius: 10, flicker: 0.3 }` in der
frameLights-Liste in drawWorld (Muster Selten-Drop-Lichter; NICHT ins
statische lights-Array aus buildWorld, das klebt am Spawn und überlebt den
Tod). Eliten nur in der FLUESTERGRUFT.

### 2.5 Maps und Dramaturgie

**FLUESTERGRUFT** (`game/js/world/map_fluestergruft.js`, 40x24 Tiles):

| Eigenschaft | Wert |
|---|---|
| ambient / playerLightRadius / fog | 0,85 (dunkelste Ebene) / 52 / false (Mobile-Overdraw) |
| Struktur | 4-5 verbundene Kammern, geflutete Abschnitte als Wasser-Tiles (rein visuell, normal begehbar oder solide, KEINE neue Mechanik) |
| Licht-Regeln (bindend) | Kritischer Pfad: Fackel alle 6-8 Tiles. Nebenkammern/Sackgassen unbefeuert, enthalten Vasen oder Loot. Boss-Vorplatz: 4 Fackeln auf 6 Tiles, hellster Ort der Map. |
| Props | 10-12 Vasen/Urnen (normale Drop-Tabelle), davon 3 auf dem Boss-Vorplatz; Schlüssel-Truhe (`content: 'boss_key'`) in der hintersten Kammer; Herz-Truhe (`content: 'heart'`) in einer gefluteten Seitennische |
| Besatzung (NUR enemySpawns, Legacy-Arrays leer) | 5 Skelette, 3 Ghule, 2 Grufthunde, 1 Rostpanzer (bewacht das Boss-Portal frontal); Eliten: 2 Elite-Skelette + 1 Elite-Ghul (Schlüsselkammer), 1 Elite-Grufthund bewacht den ZUGANG zur Herz-Nische in der angrenzenden Halle (nie in der Nische selbst: der Orbit braucht Radius 56 plus Luft, sonst klemmt er an Wänden). Summe 64 XP, 15 Gegner. |
| Platzierungslogik | Hunde nur in Hallen (Orbit braucht Radius 56 plus Luft), Rostpanzer an Engstellen, Ghule in gefluteten Gängen, Skelette als Grundrauschen |

**BOSS_KAMMER** (`game/js/world/map_bosskammer.js`, 20x12 Tiles = 320x192 px):

| Eigenschaft | Wert |
|---|---|
| ambient / playerLightRadius / fog | 0,7 (Telegraphen müssen lesbar sein) / 52 / false |
| Struktur | runde Halle über abgeschrägte Wand-Ecken (Schräge max. 2x2 Tiles je Ecke, sonst werden Add-Anker solide), 1 Tile Randmauer, Innenfläche 18x10 Tiles (Reihen 1..10), KEINE Props/Säulen/Vasen in der Innenfläche (null Ausweich-Fallen), 6 Wandfackeln |
| Kamera | horizontal 0 px Scroll, vertikal max. 12 px. VERIFIZIERT: camera.follow klemmt bei worldW == viewW sauber auf 0 (Math.max(0, ...)), kein Sondercode nötig. |
| Spawns | Spieler-Eintritt tc(10,9) (Süd), Rück-Portal tileRect(9,10,2,1) eine Reihe südlich davon (disjunkt von der Spieler-AABB, nachgerechnet: AABB y 145-159 gegen Portal ab y 160). Der Eintritts-Spawn liegt NIE im Gegenportal, der bestehende Smoke-Check dazu bleibt bindend; portalsArmed schützt nur zur Laufzeit, nicht die Map-Daten. Boss tc(10,4), Siegtruhen-Anker tc(10,4) nach Boss-Tod, Add-Anker §2.2 (müssen begehbar sein, Assert in §4.34). |

**Portal-Kette** (alle rückwärts begehbar außer Boss-Sperre):
GRAVEYARD > CATACOMBS (bestehend) > FLUESTERGRUFT (NEU: Abgang in der
Katakomben-Schatzkammer, Anker-Umfeld tc(36,12)) > BOSS_KAMMER (Portal am
Südende der Flüstergruft, hinter dem Boss-Vorplatz). Builder darf Anker um
±1 verschieben (Walkability, bestehende Regel).

**Umwidmung:** die bisherige Siegtruhe in der Katakomben-Schatzkammer
tc(36,15) bekommt `content: 'gold'` (öffnet per Schwert, streut 8-12 Münzen,
pusht NIEMALS `'chest_opened'`).

### 2.6 Tod und Respawn

Game-Over-Bestätigung führt NICHT mehr zu resetRun, sondern zu
`buildWorld(aktuelleMap, letzterEintritts-Spawn, carry)`. Dabei:

1. Erhalten: Inventar, Ausrüstung, XP, Level, Tränke, `inv.zelda` (Bumerang,
   Boss-Schlüssel), Herzcontainer. KEIN XP-Verlust.
2. `player.hp = player.maxHp` EXPLIZIT NACH dem carry-Block setzen (der
   kopiert `prev.hp`, beim Toten wäre das 0: Respawn-Todesschleife).
3. Gold: beim EINTRITT in den gameover-Zustand wird der Zoll berechnet und
   gespiegelt: `player.deathToll = player.gold - Math.floor(player.gold / 2)`
   (drawGameOver liest ihn, Signatur bleibt; Screen-Zeile
   `DER TOD FORDERT SEINEN ZOLL: -N GOLD` in `#ae2f2a`). Abgezogen wird
   erst bei der Bestätigung VOR buildWorld: `player.gold = Math.floor(
   player.gold / 2)`. Nach dem Respawn `deathToll = null`.
4. Gegner der Map respawnen (macht buildWorld ohnehin); Tod in der
   BOSS_KAMMER: Respawn am Kammer-Eingang, Boss frisch (volle HP, wieder
   `idle`), Adds weg, Tor bleibt entriegelt (Schlüssel bleibt). Retry-Weg
   unter 10 Sekunden. FLUCHTKLAUSEL (gegen die Einbahn-Frust-Falle):
   solange der Boss `idle` ist, blockt bossLocked NICHT; der Spieler kann
   die Kammer nach einem Respawn also verlassen, um zu farmen oder Tränke
   zu holen (das §2.1-Schwierigkeitsventil bleibt erreichbar). Versiegelt
   wird erst mit dem Aggro (§2.2).
5. main.js merkt sich dafür je buildWorld den benutzten Spawn
   (`lastSpawn`). Ziel-Spawns liegen NIE im Gegenportal (bestehender
   Smoke-Check, §2.5); portalsArmed schützt zusätzlich zur Laufzeit.
6. resetRun bleibt unverändert für Titel-Start und Victory-Neustart und
   setzt zusätzlich `runFlags.bossDead = false`.

### 2.7 Balance-Notiz für S4 (nicht implementieren)

Median Ende S3: Level 4, maxHp 12-14, Schwert 2, Tempo 99. Maximum: 18 maxHp.
Der Grabwächter bleibt die Referenz-Prüfung; künftige Inhalte balancieren
gegen den S3-Median, nachjustiert wird am Boss nur in HP-Band und Cooldowns.

## 3. Neue/geänderte Interfaces (bindend)

### js/items/progression.js, NEU (Besitz: Builder A)

```js
export const XP_THRESHOLDS = [0, 20, 50, 90, 140];
export const LEVEL_CAP = 5;

export function createProgress()
// → { xp: 0, level: 1, hearts: 0 }   Plain JSON (S4-Save)!

export function grantXp(prog, amount)
// xp += amount; while-Schleife levelt bis LEVEL_CAP; → Anzahl Level-Ups.
// Am Cap sammelt xp weiter (Leiste zeigt dann voll).

export function applyProgress(stats, prog)
// → NEUES Stats-Objekt: maxHp += (prog.level - 1) * 2 + prog.hearts * 2.
// Sonst NICHTS (Entscheidung 1). Eingabe-Objekt bleibt unverändert.
```

`items/items.js` bleibt byte-identisch (stärkste Regressionsversicherung,
an computeStats hängen exakte Zahlen-Asserts dreier Testebenen).

### js/world/coords.js, NEU + maps.js + 2 neue Map-Dateien (Besitz: Builder A)

```js
// NEU world/coords.js: tc() und tileRect() ziehen aus maps.js hierher um
// (winziges Modul ohne Imports). maps.js UND die neuen Map-Dateien
// importieren aus coords.js; maps.js re-exportiert beide für Alt-Nutzer.
// Grund: der naive Plan (Map-Dateien importieren tc aus maps.js, maps.js
// importiert die Map-Dateien) wäre ein Zirkelimport mit TDZ-Falle.
// map_fluestergruft.js, map_bosskammer.js: exportieren je eine mapDef im
// exakten ROWS/LEGEND-Bestandsformat (§2.5). BEIDE neuen Maps tragen das
// VOLLSTÄNDIGE Bestandsformat, buildWorld und Smoke-Abschnitte 2/18
// greifen ungeprüft zu: skeletonSpawns: [], ghoulSpawns: [],
// propSpawns (BOSS_KAMMER: leer), portals, torchChars (BOSS_KAMMER: die
// 6 Wandfackeln; NIE leer, Abschnitt 18 verlangt torches > 0 je Map),
// ambient, playerLightRadius, fog, spawn.
// maps.js importiert beide und exportiert
// MAPS = { GRAVEYARD, CATACOMBS, FLUESTERGRUFT, BOSS_KAMMER };
// GRAVEYARD/CATACOMBS bleiben unangetastet bis auf:
// CATACOMBS-Portal zur FLUESTERGRUFT + Siegtruhe content: 'gold'.
// Portal-Felder NEU (optional): requires: 'boss_key' (FLUESTERGRUFT >
// BOSS_KAMMER), bossLocked: true (BOSS_KAMMER > FLUESTERGRUFT zurück).
// NEU export function portalBlocked(portal, player, enemies)
//   → 'locked' | 'sealed' | null   (pure Funktion, keine Imports:
//   'locked' wenn portal.requires nicht in player.inv.zelda;
//   'sealed' wenn portal.bossLocked und ein graveward lebt, dessen
//   state NICHT 'idle' ist (Fluchtklausel §2.6.4).
//   main.js ruft sie im Portal-Loop, Smoke 33 testet sie headless direkt.
// enemySpawns-Einträge dürfen elite: true tragen.
// FLUESTERGRUFT nutzt AUSSCHLIESSLICH enemySpawns ('skeleton'/'ghoul'
// sind in CREATORS registriert). ?map=FLUESTERGRUFT und ?map=BOSS_KAMMER
// funktionieren über den bestehenden URL-Parameter automatisch.
```

### js/entities/enemies.js, ERWEITERT (Besitz: Builder B)

```js
export function registerEnemyKind(kind, creator, behavior, drawer = null)
// ergänzt CREATORS, BEHAVIORS und NEU DRAWERS (ca. 8 Zeilen). boss.js
// nutzt das. drawEnemy dispatcht am Anfang: existiert DRAWERS[e.kind],
// übernimmt der Zeichner KOMPLETT (sonst baut der generische Pfad
// Sprite-Keys aus e.kind und fände keine graveward_*-Sprites:
// drawImage(undefined), der bekannte Konsolen-Fehler-Typ).
// Verhaltens-Dispatch bekommt zwei Extra-Argumente:
//   (BEHAVIORS[e.kind] || updateWanderChase)(dt, e, player, map, enemies, events)
// Bestehende Behaviors ignorieren sie (JS), Signaturen dort NICHT anfassen.
// Creator-Erweiterung: jedes createXxx liest spawn.elite (§2.4) und trägt
// ein Datenfeld xp (Skelett 2, Ghul 4, Hund 5, Rost 6; Elite x2).
// XP-Vergabe im bestehenden hp<=0-Block (wo 'enemy_died' gepusht wird):
//   if (player.prog) {
//     const ups = grantXp(player.prog, e.xp ?? 0);
//     if (ups > 0) { player.recalcStats(); player.hp = player.maxHp;
//                    events.push('level_up'); }
//   }
// 'enemy_died' bleibt String (Alt-Tests vergleichen mit ===).
// DREI kleine Sterbepfad-Erweiterungen (explizit erlaubt, sonst ist der
// Boss-Tod nicht baubar):
//   1. hp<=0-Block: e.dieTimer = e.dieTime ?? DIE_TIME (Boss: 1,0 s).
//   2. die-Zweig, nach Ablauf des Timers VOR dem splice:
//      if (e.deathEvent) events.push(e.deathEvent);
//   3. spawnDeathDrops bricht bei e.noDrops sofort ab (kein Geld, kein
//      Gear, KEIN Pity-Einfluss).
// KNOCKBACK-REGEL (Blocker-Fix): der Schwert-Treffer-Block setzt
// knockX/knockY/knockTimer NUR wenn (e.knockFactor ?? 1) > 0. Sonst würde
// das continue im Knockback-Zweig die Boss-Zustandsmaschine je Treffer
// 0,15 s einfrieren (de facto stunbar). Kein Bestandsgegner hat
// knockFactor 0 (Rost 0,3, Ghul 0,5), keine Regression.
// drawEnemy: bei e.elite das elite_glow-Overlay (§2.4) zeichnen.
```

### js/entities/boss.js, NEU (Besitz: Builder B)

```js
export function createGraveward(spawn)   // Werte und Datenfelder §2.2
export function updateGraveward(dt, e, player, map, enemies, events)
// Reine Zustandsmaschine nach §2.2 (inkl. idle/Aggro), Node-importierbar,
// kein Browser-Bezug. Der die-Zustand läuft NICHT hier durch (der
// generische die-Zweig in updateEnemies kommt vor dem Dispatch); Sterbe-
// dauer und boss_died laufen über dieTime/deathEvent (§3 enemies.js).
// Adds via createSkeleton ans ENDE des enemies-Arrays gepusht (sicher in
// der Rückwärtsiteration: neue Einträge ticken erst im Folgeframe; wird
// per Smoke-Assert festgeschrieben, §4). Jedes Add trägt summoned: true
// (main.js zerbröselt sie beim boss_died darüber).
// Treffer-Erkennung Spieler: player.hurt(2, fromX, fromY, knockMult) nur
// einmal je aktiver Trefferphase (Muster leap); Muster A mit knockMult 1,5.
// Boss spiegelt für die Marker: e.marker = { kind: 'ring'|'rect', ... }
// solange ein Telegraph läuft, sonst null (drawWorld zeichnet, §3 main.js).
export function drawGraveward(ctx, cam, e, gfx, timeSec)
// Am Modulende: registerEnemyKind('graveward', createGraveward,
// updateGraveward, drawGraveward). main.js UND tools/smoke_test.mjs
// importieren boss.js einmal explizit oben (Registrierung ist
// import-reihenfolgeabhängig, dokumentiertes Risiko).
```

### js/entities/player.js, ERWEITERT (Besitz: Builder B)

```js
// import { createProgress, applyProgress } from '../items/progression.js';
// createPlayer: player.prog = createProgress();
// recalcStats: player.stats = applyProgress(computeStats(player.inv),
//   player.prog); danach wie bisher maxHp übernehmen, hp kappen.
// hurt bekommt einen optionalen vierten Parameter (rückwärtskompatibel,
// alle Alt-Aufrufe unverändert): hurt(dmg, fromX, fromY, knockMult = 1)
// mit knockSpeed = KNOCK_SPEED * stats.knockTakenMult * knockMult
// (der Boss-Rundumschlag braucht x1,5; ohne den Parameter wäre §2.2
// unerfüllbar). Sonst NICHTS. Kampfcode liest weiterhin nur player.stats.
```

### js/entities/props.js, ERWEITERT (Besitz: Builder B)

```js
// Zwei neue Truhen-contents über die bestehende Weiche (Muster 'boomerang',
// beide öffnen per Schwert, KEINE Münzen, KEIN 'chest_opened'):
// 'boss_key': player.inv.zelda.push('boss_key'); inv.newFlag NICHT setzen
//   (kein Inventar-Item); Event 'key_found' (String);
//   Toast-Text macht main.js: BOSS-SCHLUESSEL! in Gold.
// 'heart': player.prog.hearts += 1; player.recalcStats();
//   player.hp = Math.min(player.hp + 2, player.maxHp);
//   Event 'heart_found' (String); Toast HERZCONTAINER! in Gold.
// 'gold': wie 'treasure' (einmal öffnen, 8-12 Münzen streuen), pusht aber
//   NIEMALS 'chest_opened'.
// SOFTLOCK-FIX (dokumentierte Slice-2-Abweichung): der bestehende
//   boomerang-Zweig überschreibt inv.zelda hart (props.js:71,
//   inv.zelda = ['boomerang']). Wer erst den Boss-Schlüssel holt und
//   DANN die Bumerang-Truhe öffnet, verlöre den Schlüssel für immer.
//   Neu: if (!inv.zelda.includes('boomerang')) inv.zelda.push('boomerang');
//   Assert in Smoke 34 (Schlüssel zuerst, dann Bumerang, beide vorhanden).
```

### js/entities/projectiles.js, ERWEITERT (Besitz: Builder B)

```js
// Bumerang-Kontakt mit kind 'graveward':
//   e.state === 'summon' → Abbruch des Rufs (Boss zurück in stalk mit
//     vollem Cooldown, Welle entfällt), danach Rückflug;
//   e.state === 'stuck'  → stuck-Timer einmalig je stuck +1,0 s, Rückflug;
//   sonst: nur Rückflug, kein Stun, kein Schaden, kein Event.
```

### js/main.js, ERWEITERT (Besitz: Builder C, Integrator)

```js
// import './entities/boss.js';  (Registrierung, ganz oben bei den Imports)
// runFlags = { bossDead: false }; Reset in resetRun.
// buildWorld:
//   1. lastSpawn = spawn merken (für Respawn).
//   2. carry unverändert; NEU direkt neben player.inv = prev.inv:
//      player.prog = prev.prog (Referenz), DANN recalcStats, dann hp/gold/
//      potions (bestehende Reihenfolge).
//   3. BOSS_KAMMER bei runFlags.bossDead: NUR BEIM ERZEUGEN filtern:
//      (mapDef.enemySpawns || []).filter(s => !(runFlags.bossDead &&
//      s.kind === 'graveward')).map(createEnemy); MAPS/mapDef werden NIE
//      mutiert (sonst fehlt der Boss nach resetRun dauerhaft). Zusätzlich
//      die Siegtruhe statisch bei tc(10,4) hinlegen (Sieg bleibt nach
//      Verlassen/Rückkehr erreichbar).
// Portal-Loop, VOR dem Auslösen: portalBlocked(portal, player, enemies)
//   aus world/maps.js aufrufen (pure Funktion, headless getestet in
//   Smoke 33): 'locked' → Toast VERSCHLOSSEN in #d6cbb1 (gedrosselt 1x je
//   Sekunde), kein Übergang; 'sealed' → Toast VERSIEGELT, kein Übergang
//   (blockt NUR wenn der lebende graveward nicht 'idle' ist, §2.6.4).
// Game Over: beim EINTRITT in gameover player.deathToll berechnen (§2.6.3);
//   bei der Bestätigung statt resetRun die Respawn-Prozedur §2.6 (Gold
//   halbieren VOR buildWorld; hp = maxHp NACH buildWorld; deathToll = null).
//   Der victory-Zweig behält resetRun (gameover/victory-Zweig aufteilen).
// Events: 'level_up' → Toast STUFE <prog.level>! Gold + Ring-Effekt-Timer;
//   'key_found' → BOSS-SCHLUESSEL!; 'heart_found' → HERZCONTAINER!;
//   'boss_died' → Adds zerbröseln (alle e.summoned: state 'die',
//   dieTimer 0,4, noDrops true) + Münzen + Siegtruhe + runFlags.bossDead
//   (§2.2).
// Toast-Priorität im selben Frame (bindend): level_up > weapon/key/
//   heart_found > item_pickup > Rest. Ein Slot, Neuer ersetzt Alten nur
//   bei >= Priorität. DOKUMENTIERTE ABWEICHUNG von Slice 2 ("ein neuer
//   ersetzt den alten", hud.js-Kommentar mit anpassen): betrifft nur
//   gleichzeitige Events im selben Frame, kein Alt-Test prüft das.
// drawWorld: NEUE Render-Kategorie Bodenmarker: NACH dem Ground-Layer,
//   VOR den y-sortierten renderables (bindende Render-Reihenfolge aus 1.5
//   bleibt unangetastet). Zeichnet e.marker aller Gegner: Umriss #ae2f2a
//   Alpha 0,6; in den letzten 0,25 s des Telegraphs Fläche Alpha 0,35 und
//   ein Umriss-Blitz in #f1e9d3. Max. 1 Marker (eine Boss-Maschine).
// Boss-Balken: pro Frame player.bossBar = { hp, maxHp } wenn ein
//   graveward lebt, sonst null (Spiegel-Muster zeldaState; drawHUD-Signatur
//   bleibt). Beim ersten Betreten der BOSS_KAMMER mit lebendem Boss
//   einmalig Toast GRABWAECHTER in #ae2f2a.
// Victory-Screen: neue Zeile STUFE <level>; Game-Over-Screen: Zoll-Zeile
//   §2.6. Ring-Effekt: levelup_0/1 0,5 s über dem Spieler (renderable über
//   Spieler-Fußkante).
// Lights: Eliten-Mini-Lichter (§2.4) PRO FRAME in frameLights (Muster
//   Selten-Drop-Lichter), nur für lebende Eliten.
// Flip-Liste: neue Flip-Keys werden AUSSCHLIESSLICH ans ENDE der
//   bestehenden Liste angehängt (nach shield_side). Die Reihenfolge der
//   Bestands-Einträge ist EINGEFROREN: check_main_slice1 und
//   check_inventory_slice2 mappen Canvas zu Sprite-Name über die
//   Erzeugungsreihenfolge; ein Einschub davor macht beide Alt-Tests rot.
```

### js/ui/hud.js, ERWEITERT (Besitz: Builder C)

```js
// XP-Leiste 26x3 px bei (4,36) (unter der Trank-Zeile): Rahmen #3a3542,
//   Grund #14101a, Füllung #7d7588 (Stein-Hell; NICHT #92aec0, das ist
//   Selten-Blau, NICHT Gold). Füllstand = Fortschritt zwischen den zwei
//   umgebenden Schwellen, Update sofort. Beim Level-Up 2 Frames Weißblink
//   #f1e9d3. Bei LEVEL_CAP dauerhaft voll. KEINE Levelzahl im HUD.
// Schlüssel-Icon icon_key 8x8 bei (30,25) neben dem Trank-Zähler, sichtbar
//   sobald inv.zelda 'boss_key' enthält.
// Boss-Balken (aus player.bossBar): 80x5 px bei (120,8), Rahmen #3a3542,
//   Grund #14101a, Füllung #ae2f2a, zwei 1-px-Kerben bei 2/3 und 1/3.
//   Kein Namenstext im HUD (der Name kommt als Toast).
// drawGameOver: liest player.deathToll und zeichnet die Zoll-Zeile §2.6.3
//   (Signatur bleibt).
// Victory-Text: 'Der Schatz der Katakomben ist dein.' wird zu
//   'Der Grabwaechter ist bezwungen.' (der Sieg findet nicht mehr in den
//   Katakomben statt; der alte Satz fiele in der s3_08-Abnahme auf).
```

### js/ui/inventory_ui.js, ERWEITERT (Besitz: Builder C)

```js
// Der Anlege-Vergleich (bisher computeStats(...) gegen player.stats) MUSS
// applyProgress spiegeln: applyProgress(computeStats(invKandidat),
// player.prog), sonst zeigt HERZ nach dem ersten Level-Up falsche Werte
// (dokumentierter Panel-Befund, inventory_ui.js:202).
// Fußzeile: STUFE <level> wird HINTER TEMPO angehängt oder als SEPARATES
// fillText gezeichnet. Der Bestands-String 'HERZ x  SCHADEN y  TEMPO z%'
// bleibt zeichenidentisch zusammenhängend: check_inventory_slice2:331
// assertet ihn per includes auf EINEM fillText; ein Einschub davor oder
// dazwischen macht den Alt-Test rot.
```

### js/art/palette.js + sprites.js, ERWEITERT (Besitz: Art)

1. Grabwächter 24x32: `warden_idle`, `warden_walk_0/1`, `warden_windup_a`
   (Schwert über Kopf), `warden_windup_b` (Anlauf-Pose), `warden_dash`,
   `warden_stuck` (Schwert im Boden, deutlich als Fenster lesbar),
   `warden_summon` (Ruf-Pose, erhobene Arme), `warden_die`. Massiver
   Knochenkoloss mit Zweihänder, Silhouetten je Zustand klar unterscheidbar
   (3-Kanal-Telegraphie: Form + Helligkeit + Bewegungsstopp).
2. `elite_glow` (8x8, §2.4), `levelup_0/1` (16x16 Ring, Gold/Knochenweiß),
   `icon_key` (8x8).
3. Wasser-/Gruft-Tiles nach Bedarf der neuen Maps (Flutung lesbar, aber
   rein dekorativ; vorhandene Rampen bevorzugen).
4. Bodenmarker sind PROZEDURAL (strokeRect/arc in drawWorld), keine Sprites.

Alle bestehenden Schlüssel bleiben kompatibel; Selbstcheck wie gehabt.

## 4. Tools / Tests (Besitz: Builder C, konsolidiert am Ende)

`tools/smoke_test.mjs`, neue Abschnitte 30-34 (boss.js oben zentral
importieren):

1. **30 Boss-Maschine:** Boss + Dummy-Spieler mit 60 Hz ticken: startet
   idle, Aggro bei Distanz <= 64 px oder erstem Treffer; vor jedem
   sweep/dash ein windup (Telegraph-Pflicht); aktive Trefferphase trifft
   für exakt 2; stuck: kein Kontaktschaden, Schwert-Treffer zählen;
   Schwert-Treffer setzt beim Boss KEINEN knockTimer (knockFactor-0-Regel
   §3, sonst friert die Maschine ein) und die Position bleibt unverändert;
   e.hp direkt auf 16 setzen → im Folgetick Zustand summon, nach weiteren
   1,2 s Simulationszeit enemies.length + 2 (Adds ticken erst im
   Folgeframe, Assert schreibt das Push-Verhalten fest; Adds tragen
   summoned: true); Bumerang im summon → Welle entfällt; HP 0 → die
   dauert 1,0 s (dieTime), DANACH 'boss_died' im Event-Array; zerbröselte
   Adds (state 'die' + noDrops) hinterlassen keine Drops und ändern weder
   XP noch Pity; kein Gear-Drop, xp 0.
2. **31 Progression:** grantXp-Schwellen EXAKT (19→1, 20→2, 140→5, Cap);
   applyProgress-Zahlen (L4 + 1 Herz = maxHp 14 bei Basis 6); JSON-Roundtrip
   createProgress (Plain-JSON-Wächter); computeStats-Aufrufe OHNE prog
   unverändert (items.js-Regression).
3. **32 Eliten:** Elite-Skelett hat hp 4, stirbt in 2 Median-Hieben statt 1;
   Tempo x1,25; xp 4; contactDamage unverändert; das normale Skelett trägt
   alle Slice-2-Felder und -Werte unverändert, einziges neues Feld ist
   xp: 2 (NICHT wörtlich byte-identisch, das xp-Feld ist neu).
4. **33 Portal-Guards:** die pure Funktion portalBlocked(portal, player,
   enemies) direkt testen (main.js ist nicht Node-importierbar, deshalb
   MUSS die Logik als Export in world/maps.js liegen): requires ohne
   Schlüssel → 'locked', mit Schlüssel → null; bossLocked mit lebendem
   graveward im Zustand stalk → 'sealed', im Zustand idle → null
   (Fluchtklausel), ohne graveward → null.
5. **34 Truhen-Inhalte + Geometrie:** 'boss_key' pusht in inv.zelda und
   pusht 'key_found', kein 'chest_opened'; Reihenfolge-Assert gegen den
   Softlock: boss_key zuerst, DANN Bumerang-Truhe → zelda enthält BEIDE;
   'heart' erhöht hearts und maxHp um 2, heilt +2; 'gold' streut 8-12
   Münzen, KEIN 'chest_opened'; Maps-Checks decken die neuen Maps ab
   (Spawns begehbar, kinds gültig, elite-Flags nur FLUESTERGRUFT,
   Portal-Ketten-Ziele existieren); die vier Add-Anker der BOSS_KAMMER
   sind begehbar (Skelett-AABB 12x14 kollisionsfrei).

**Erlaubte Änderungen an Alt-Tests (abschließend, GENAU DIESE DREI):**

1. Smoke-Truhen-Check: "CATACOMBS: genau 1 'treasure' + 1 'boomerang'" wird
   zu "genau 1 'gold' + 1 'boomerang', KEINE 'treasure'" ('treasure'
   existiert nur noch dynamisch/bossDead-statisch in der BOSS_KAMMER).
2. `.tmp/check_victory_slice1.mjs` wird ERSETZT durch
   `.tmp/check_boss_slice3.mjs` (unten).
3. `.tmp/check_main_slice1.mjs`: NUR der Game-Over-Abschnitt wird an die
   Respawn-Regel angepasst (Assertions: Respawn statt Titel, Gold halbiert,
   Level/XP/Inventar erhalten, hp = maxHp). Alle übrigen Abschnitte
   byte-identisch.

Jede weitere Alt-Test-Änderung ist ein Spec-Verstoß und eskaliert (Slice-2-
Lehre: Builder passen sonst eigenmächtig Tests an).

Flusstest NEU `.tmp/check_boss_slice3.mjs` (headless, Browser-Mock wie die
bestehenden, Positions-Asserts in Fußkanten-Konvention): Spawn in der
FLUESTERGRUFT nahe dem Boss-Portal ohne Schlüssel → Portal blockt →
Schlüssel via Truhe → Übergang (xp/level VOR und NACH dem Map-Wechsel
identisch, carry-Wächter) → Boss startet idle, Rück-Portal passierbar →
Annäherung/Treffer weckt ihn, Rück-Portal VERSIEGELT → Bosskampf mit
erzwungenen Treffern: Phasen bei 17/9, Adds gedeckelt, Boss-Tod → Münzen +
Siegtruhe erscheinen (KEIN Exakt-Assert auf die Münzzahl über die 6-10
hinaus) → öffnen → 'chest_opened' → 1,2 s → victory (Screen-Zeile STUFE n,
Text 'Der Grabwaechter ist bezwungen.'). Zweiter Abschnitt: Tod in der
BOSS_KAMMER → Game-Over-Screen mit Zoll-Zeile → Respawn am Kammer-Eingang,
Boss frisch und wieder idle, Gold halbiert, Level/XP/Inventar erhalten,
hp = maxHp, Rück-Portal passierbar solange der Boss idle bleibt.

## 5. Abnahmekriterien Slice 3

1. `bash tools/check_syntax.sh`, `node tools/smoke_test.mjs` (inkl. 30-34),
   Flusstests check_main_slice1 (angepasst), check_inventory_slice2
   (unverändert), check_boss_slice3 grün.
2. Browser: XP-Leiste füllt sich je Kill, Level-Up zeigt STUFE-Toast +
   Ring + volle Herzen, Inventar-Fußzeile zeigt STUFE.
3. `?map=FLUESTERGRUFT`: dunkelste Ebene, Fackelpfad führt, Eliten-Augen
   glühen im Dunkeln, Elite stirbt spürbar langsamer; Schlüssel-Truhe
   hinter Eliten-Wache, Icon erscheint im HUD; Herz-Truhe gibt sichtbar
   ein Herz mehr. Boss-Portal ohne Schlüssel: VERSCHLOSSEN.
4. `?map=BOSS_KAMMER`: Toast GRABWAECHTER, Boss steht idle und erwacht
   bei Annäherung (Boss-Balken mit Kerben erscheint); Rundumschlag und
   Sturmschlag je mit Bodenmarker telegraphiert; stuck-Fenster sichtbar
   bestrafbar; bei 17/9 HP Ruf-Pose + 2 Adds (Bumerang bricht ab);
   Rück-Portal VERSIEGELT sobald der Kampf läuft, offen solange der Boss
   idle ist; Boss-Tod → Münzen + Siegtruhe → Victory mit STUFE-Zeile und
   neuem Text.
5. Tod: Game-Over-Screen mit Zoll-Zeile, Respawn am Map-Eingang mit vollem
   Build und halbem Gold; Boss-Retry-Weg unter 10 Sekunden.
6. Touch-Fairness-Checkliste §2.3 vom Verify abgehakt.
7. Kein einziger Konsolen-Fehler im Playwright-Proof (alle 4 Maps,
   Bosskampf, Level-Up, Inventar).

Abnahme-Screenshots (Werkzeug `.tmp/shot_slice2.py` wiederverwenden, Port
8124, NIE 8123): s3_01 Flüstergruft-Panorama (Fackelpfad + geflutete
Kammer), s3_02 Elite mit Glut-Augen neben normalem Artgenossen, s3_03
Schlüssel-Fund (Toast + HUD-Icon), s3_04 Sturmschlag-Telegraph mit
Korridor-Marker, s3_05 stuck-Fenster: Spieler drischt auf den Boss,
Balken mit Kerben sichtbar, s3_06 Beschwörung mit 2 Adds, s3_07
Level-Up-Moment (STUFE-Toast + Ring + XP-Leiste), s3_08 Siegtruhe hinter
dem toten Boss bzw. Victory-Screen mit STUFE-Zeile.
