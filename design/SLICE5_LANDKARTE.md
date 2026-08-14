# Slice-5-Landkarte (13.08.2026, wf_d8468ec9-b8a)


---

# TEIL A: WebAudio/Chiptune-Machbarkeit

Alle Messungen liegen vor, Baseline grün, nichts Geschütztes angefasst. Hier der Befund.

---

# SLICE-5-LANDKARTE, AUFTRAG A — WebAudio/Chiptune

Sonden: `/home/coder/Grimlight/.tmp/slice5_probe/` (14 Dateien, alle wegwerfbar). Port 8124 nur kurz benutzt und gestoppt (`ss -ltnp | grep -E "8123|8124"` → „beide frei"). `git status --short` → leer, `game/**`, `tools/**`, Tests unberührt. Baseline grün: `check_syntax.sh` → „OK: 26 JS-Dateien", `check_save_slice4.mjs` → „CHECK GRÜN (48 Assertions)", Exit 0.

## 1. Randbedingungen (gemessen)

**1a) Headless-Testbarkeit — das Audio-Modul muss rein sein.**

- Node v20.19.2: `AudioContext: undefined | OfflineAudioContext: undefined | webkitAudioContext: undefined`. In Node ist WebAudio **gar nicht** vorhanden, auch nicht rudimentär.
- Die drei kanonischen Flusstest-Stubs kennen kein Audio: `.tmp/check_main_slice1.mjs:65-70`, `.tmp/check_inventory_slice2.mjs:77-82`, `.tmp/check_boss_slice3.mjs:77-80` definieren `window` nur mit `addEventListener, devicePixelRatio, innerWidth/Height, location, requestAnimationFrame`. `grep -rln "AudioContext" tools/ .tmp/*.mjs` → **leer**.
- `game/js/main.js:271-280` schreibt die Konsequenz selbst fest: „es gibt KEIN localStorage, kein matchMedia, kein screen, kein navigator … Ein ungeguardeter Zugriff macht alle drei kanonischen Flusstests rot (§0.1, gemessen Review P1-B1)."
- Vorbild `loop.js:8` `createLoop({ update, render, raf, now })` mit Lazy-Default in `:20-21`; Vorbild `save.js:1-5` („REINES Daten-Modul … Den Storage fasst AUSSCHLIESSLICH main.js an").

⇒ **Ein `new AudioContext()` auf Modulebene irgendwo außer main.js macht 558 + 48 Assertionen rot.** Audio muss genauso injizierbar sein wie `raf`/`now`.

**1b) Autoplay — Browser und WebView verhalten sich NICHT gleich.**

- Natürliche Geste ist bereits vorhanden: `main.js:792, 800, 805` rufen `starteQuerformat()` an **genau den drei** Titel→Spiel-Übergängen. Das ist der Aufhänger, kostenlos.
- Capacitor 6.2.1 (`mobile/package.json`): `mobile/node_modules/@capacitor/android/capacitor/src/main/java/com/getcapacitor/Bridge.java:567` in `initWebView()`:
  ```java
  settings.setMediaPlaybackRequiresUserGesture(false);
  ```
  **Unbedingt, ohne Config-Schalter.** Gegenprobe: `grep -rn "mediaPlayback" node_modules/@capacitor/cli/dist/declarations.d.ts` → leer. Das Cordova-`mediaPlaybackRequiresUserAction` existiert in Capacitor 6 nicht; es ist hart aus. (`appendUserAgent`/`overrideUserAgent` gibt es, `declarations.d.ts:64,72` — für Audio irrelevant.)
- Gemessen (`run_autoplay2.py`, `AudioContext`-Zustand direkt nach Konstruktion, in der Seite erfasst):

| Chromium-Politik | Rolle | `state` bei Konstruktion |
|---|---|---|
| `no-user-gesture-required` | **Capacitor-WebView** (Bridge.java:567) | `running` |
| `user-gesture-required` | Android-Chrome | `running` |
| `document-user-activation-required` | Desktop-Chrome-Standard | **`suspended`** |

⇒ **Divergenz:** In der APK liefe Musik schon auf dem Titelbild ohne Tap, im Desktop-Browser nicht. Damit Michael in beiden dasselbe sieht, muss der Ton in **beiden** Fällen an der Geste hängen — nicht „weil der Browser es erzwingt", sondern als bewusste Regel.

*Messgrenze, ehrlich:* Headless-Chromium meldet `navigator.userActivation {isActive:true, hasBeenActive:true}` schon beim Laden — auch mit `ignore_default_args=True` (`flags2.py`, Läufe A und B identisch). Der **blockierte** Fall lässt sich hier deshalb nicht beweisen; nur der Konstruktions-Zustand ist belastbar. Das „resume() klappt auch ohne Geste" aus dem ersten Lauf ist **verworfen** (Artefakt). Endgültige Prüfung gehört auf Michaels Gerät.

**1c) Hintergrund.** `main.js:663-676`: `visibilitychange` → `systemPause()` (`saveNow()` + `pausiere()`), dazu `pagehide`. `input.js:313` hat einen zweiten `visibilitychange`. rAF hält im Hintergrund an, ein `AudioContext` **nicht** — ohne `ctx.suspend()` liefe Musik über einem pausierten Spiel weiter. Der Slice-4-Pausezustand (`main.js:647 pausiere()`) ist der fertige Aufhänger. (Auf dem Gerät zu bestätigen; eine Seite lässt sich headless nicht verlässlich in den Hintergrund zwingen.)

## 2. Syntheseoptionen — gemessen, nicht geschätzt

Testsong `song_katakomben.js`: 4 Kanäle, 77 Ereignisse, 11,43 s.

**Determinismus (Node, `mess_node.mjs`):** drei Läufe, PCM-Prüfsumme `70a73d67` / `70a73d67` / `70a73d67` → identisch. `notenFreq('A-4')` = exakt 440.

**Rechenkosten** (`ms` bzw. x-Echtzeit; CPU-Drossel via CDP `Emulation.setCPUThrottlingRate`):

| Verfahren | 1x (Desktop) | 4x | 6x | 10x |
|---|---|---|---|---|
| Reines JS @22050 | 153-339x | 51x | 60x | 36x |
| Reines JS @44100 | 143-149x | 45x | 38x | 23x |
| OfflineAudioContext @22050 | 157-197x | *(verrauscht: 27x/75x/48x)* | | |

OfflineAudioContext läuft am Audio-Thread und wird von der Drossel nicht sauber erfasst — die Werte sind unbrauchbar, das reine JS skaliert erwartungsgemäß.

**SFX-Kosten** (`sfx.html`, Median aus 8 Wiederholungen, aufgewärmt, Reihenfolge alternierend — der erste, naive Lauf war ein Aufwärm-Artefakt und ist verworfen):

| Drossel | Oszillator + PeriodicWave | AudioBufferSource |
|---|---|---|
| 1x | 0,031 ms/Stück | 0,032 ms/Stück |
| 4x | 0,152 ms | 0,134 ms |
| 6x | 0,241 ms | 0,196 ms |

⇒ **Beide gleich teuer.** 10 SFX in einem Frame kosten bei 6x-Drossel ~2 ms von 16,6 ms. Unkritisch, aber eine Stimmen-Obergrenze gehört in die Spec. `baseLatency` 0,01 s @44100 — für Trefferfeedback gut genug.

**Speicher — der eigentliche Killer für Option (b):**

| Loop | @22050 mono Float32 | @44100 |
|---|---|---|
| 30 s | 2,5 MB | 5,0 MB |
| 90 s | 7,6 MB | 15,1 MB |
| 4 Karten à 90 s | 30 MB | 60 MB |

**Bewertung:**

- **(a) Laufzeit-Oszillatoren:** 176 Knoten für 11,4 s Musik (~16 Knoten/s). Kein Speicherproblem, kein Renderruckler, sofortiger Start. Puls-Duty geht nur über `createPeriodicWave` (gemessen funktionsfähig); Vibrato kostet 2 Extraknoten je Note. Klangfarbe ist in Node **nicht** prüfbar — nur der Zeitplan.
- **(b) Vorgerendert:** vollständig testbar bis auf die PCM-Prüfsumme. Aber: ein 60-s-Loop braucht bei 10x-Drossel ~1,7 s Rechenzeit, der Portal-Fade dauert `main.js:37 FADE_TIME = 0.3` je Richtung = 0,6 s. **Der Ruckler passt nicht in den Fade.** Plus der Speicher oben.
- **(c) AudioWorklet:** `typeof AudioWorkletNode === 'function'` vorhanden. Aber `addModule()` lädt eine **separate Datei in einen eigenen Global-Scope** — nicht Node-importierbar, von den Stubs nicht erreichbar, und ein zweites Modulsystem neben „keine Build-Toolchain" (CLAUDE.md:21-24). **Overkill für Slice 5.**

## 3. Assets: Musik als Code

`CLAUDE.md:45-48` („Grafik als Code … Keine Binär-Assets im Repo nötig, jeder Agent kann Grafik als Text lesen und ändern") überträgt sich 1:1. Belegt an der laufenden Probe: **11,4 s Musik = 2150 B / 42 Zeilen** (`song_katakomben.js`), Engine 4219 B / 112 Zeilen (`chiptune.js`). Das ist agentenpflegbar.

Format (läuft, nicht nur skizziert) — Zelle `"NOTE:INSTRUMENT:LÄNGE:FX"`, `'...'` = leer, ein Kanal = eine Zeile:

```js
export const SONG_KATAKOMBEN = {
  bpm: 84, rowsPerBeat: 4, loopFrom: 0,
  instruments: {
    lead: { art:'pulse', duty:0.25, vol:0.22, attack:0.004, release:0.06 },
    bass: { art:'tri',   vol:0.30 },
    perc: { art:'noise', vol:0.16 },
  },
  patterns: { A: [ ['D-4:lead:4:v','...', …], … ] },   // 4 Kanäle x 16 Reihen
  order: ['A','A','B','A'],
};
```

FX bewusst knapp wie im klassischen Tracker: `v` Vibrato, `a` Arpeggio — beide im Renderer implementiert und gemessen. Rauschen über LFSR mit festem Keim (`chiptune.js:66`) hält den Determinismus.

## 4. Empfehlung

**Architektur — ein Datenmodell, zwei Backends:**

```
game/js/audio/
  chiptune.js     REIN: notenFreq, compileSong(song) -> Ereignisliste,
                  renderPCM (Test-Orakel), pcmSumme      [Node-testbar]
  songs/*.js      REINE Datenmodule, wie game/js/art/*.js
  sfx.js          REINE SFX-Definitionen + Zuordnung Spielereignis -> Klang
  mixer.js        REINER Reducer für Lautstärke/Stumm (Muster save.js:244
                  titleMenuStep)
```
Der **WebAudio-Adapter lebt ausschließlich in `main.js`**, in der §0.2-Guardform (`main.js:284` als wörtliches Vorbild), und wird wie `raf`/`now` injiziert.

**Laufzeit = Option (a)** (Lookahead-Scheduler aus `update(dt)`, ~100 ms Vorlauf — passt exakt zum Festzeitschritt in `loop.js`). **Option (b) bleibt als Test-Orakel**: dieselben Instrumentendaten rendern in Node deterministisch, Tests prüfen Wellenform-Eigenschaften per Prüfsumme, ganz ohne Browser. Damit ist genau die Lücke von (a) geschlossen, ohne den Speicher von (b) zu bezahlen.

**Aufwand je Baustein** (grob, Bauteil = ein Subagent mit exklusivem Besitz):

| Baustein | Aufwand | Bemerkung |
|---|---|---|
| `chiptune.js` reiner Kern | mittel | Compiler + Renderer stehen als Probe schon |
| Songdaten 4 Karten + Titel | **groß, iterativ** | der kreative Block, wie ein Grafikpass |
| `sfx.js` + Ereignis-Zuordnung | mittel | Stimmen-Obergrenze nicht vergessen |
| Adapter in `main.js` | klein, **risikoreich** | Geste, suspend/resume, Guards |
| Pause-Menü Ton/Musik | klein-mittel | **Panel muss wachsen**, s. u. |
| Tests (rein + Flusstest) | mittel | additiv zu 558 + 48 |

**Zwei konkrete Fallen, die die Spec vorwegnehmen sollte:**

1. **Das Pause-Panel ist voll.** `hud.js:764-768` `PAUSE_MENU_ZONES` = y 74/96/118, je h=18; Panel `fillRect(80, 40, 160, 110)` endet bei y=150. Ein vierter Eintrag bei y=140 endete bei 158 und stünde **außerhalb des Panels**. Lautstärke/Stumm erzwingen ein Panel-Relayout. Dazu: Texte müssen die Flusstest-Sonden meiden (`hud.js:758-760`: `'GOLD','SIEG','GAME OVER','GRIMLIGHT','STUFE','AUSRUESTUNG','x 0'`) — „TON"/„MUSIK" sind frei; und `drawPause` darf den Stub-Vorrat nicht verlassen (kein `strokeRect`, `hud.js:769-775`, geprüft in `smoke_test.mjs:4574`).
2. **Lautstärke gehört NICHT in den Spielstand.** `save.js:151` `if (d.v !== SAVE_VERSION) return null;` — ein neues Feld erzwingt Schema v2 und **verwirft alle bestehenden Stände**. Ein eigener Schlüssel (`grimlight.audio.v1`) über dieselben `storeLesen`/`storeSchreiben`-Guards (`main.js:286-291`) kostet nichts und vermeidet die Migration.

**Risiken:**

- **iOS (außer Scope, aber jetzt dokumentieren):** WKWebView verlangt `resume()` **im echten Gesten-Handler** (transiente Aktivierung), nicht wie hier aus `update()`/rAF heraus. Der saubere Vorbau: `input.js:306 attach(canvasElement)` nimmt optional einen Rückruf, der im echten `touchstart` (`input.js:317`) feuert. Kostet heute fast nichts, rettet später den iOS-Port. Zusätzlich: `webkitAudioContext`-Präfix und der iOS-Stummschalter (Hardware-Switch schaltet WebAudio stumm).
- **Browser/App-Divergenz** aus 1b: bewusst gleichziehen, sonst meldet Michael einen „Fehler", der keiner ist.
- **`--mute-audio`** ist ein Playwright-Standardflag — alle Messungen hier belegen Rechenlast und Graphenzustand, **nicht Hörbarkeit**. Der erste Hörtest ist Michaels Gerät.
- Der Headless-Vor-Aktivierungs-Effekt (1b) heißt: **die Autoplay-Kette ist hier nicht abnehmbar.** Sie braucht ein Messziel am Gerät.

**Sources:** [Chrome: Web Audio, Autoplay Policy and Games](https://developer.chrome.com/blog/web-audio-autoplay), [Chrome: Autoplay policy](https://developer.chrome.com/blog/autoplay), [MDN: Autoplay guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay), [chromium.org: Autoplay](https://www.chromium.org/audio-video/autoplay/) — die Doku deckt Android-WebView **nicht** ab; der WebView-Befund stammt aus `Bridge.java:567` plus eigener Messung.


---

# TEIL B: Sound-Haken & Game-Feel im Spiel

# AUFTRAG B — SOUND-HAKEN-LANDKARTE GRIMLIGHT (read-only, HEAD 8481818)

Alle Belege als `datei:zeile`. Nichts geschrieben, kein Server gestartet, kein Port belegt.

---

## 1. EVENT-INVENTUR

### 1.1 Der Mechanismus

`const events = []` lebt als Modul-State in `main.js:335`. Er wird **pro Tick geleert** (`main.js:827`, direkt vor den Updates) und zusätzlich bei jedem Map-Bau (`main.js:465`). Gefüllt wird er von den fünf Update-Aufrufen `main.js:828-841`. Gelesen wird über die zwei reinen Helfer `getEvent`/`hasEvent` (`entity.js:16-26`), die **String-Events und Objekt-Events** `{type, ...}` gleich behandeln (`entity.js:13-15`).

Wichtig: Der Event-Strom existiert **nur im Zustand `playing` und nur ohne laufenden Fade** (`main.js:808`/`main.js:826`). Im Fade, im Inventar (`main.js:974`), in der Pause (`main.js:981`), im Titel und in Game-Over/Sieg läuft **kein** Welt-Update, also kommt kein Event.

### 1.2 Vollständige Liste der 16 Push-Stellen (13 Typen)

| # | Event | Push-Ort | Form | heute gelesen? | Frequenz / Spam-Risiko | Prio Audio |
|---|---|---|---|---|---|---|
| 1 | `player_died` | `player.js:106` | String | `main.js:927` | 1x je Tod | **P0** |
| 2 | `potion_drunk` | `player.js:122` | String | **niemand** | gedrosselt: `POTION_COOLDOWN 0,3 s` (`player.js:20`, gesetzt `player.js:121`) | P1 |
| 3 | `attack_blocked` (Schwert) | `enemies.js:464` | String | **niemand** | max 1 je Schwung je Rostpanzer (`hitAttackId`, `enemies.js:457-458`) | **P0** |
| 4 | `attack_blocked` (Bumerang) | `projectiles.js:157` | String | **niemand** | max 1 je Flug je Ziel (`hitIds`, `projectiles.js:126-127`) | P1 |
| 5 | `enemy_died` | `enemies.js:486` | String | **niemand** | 1x je Kill; bei Boss-Tod zerbröseln Adds **ohne** dieses Event (`main.js:883-887` setzt `state='die'` direkt) | **P0** |
| 6 | `level_up` | `enemies.js:494` | String | `main.js:866` | selten | P1 |
| 7 | `item_pickup` | `enemies.js:578` | **Objekt** `{type,item}` | `main.js:860` | selten | P1 |
| 8 | `inventory_full` | `enemies.js:581` | String | `main.js:865` | gedrosselt `retryTimer = 1,0 s` (`enemies.js:582`) | P2 |
| 9 | `potion_pickup` | `enemies.js:590` | String | **niemand** | selten | P1 |
| 10 | `potion_full_gold` | `enemies.js:593` | String | **niemand** | selten | P2 |
| 11 | `gold_pickup` | `enemies.js:597` | String | **niemand** | **SPAM-KANDIDAT NR. 1**: Boss-Tod streut 6-10 Münzen (`main.js:891-892`), Gold-Truhe 8-12 (`props.js:94-95`), Siegtruhe 8-12 (`props.js:98-99`); der Bumerang-Magnet zieht sie gleichzeitig ein (`enemies.js:553-568`). Die Pickup-Schleife `enemies.js:541` kann in **einem** Frame mehrere Münzen einsammeln | **P0 (mit Entprellung)** |
| 12 | `weapon_found` | `props.js:77` | **Objekt** `{type}` | `main.js:862` | 1x je Run | P1 |
| 13 | `key_found` | `props.js:84` | String | `main.js:863` | 1x | P1 |
| 14 | `heart_found` | `props.js:90` | String | `main.js:864` | 1x | P1 |
| 15 | `chest_opened` | `props.js:100` | String | `main.js:959` | 1x, **nur** die Siegtruhe (Gold-Truhe pusht nichts, `props.js:91-95`) | P1 |
| 16 | `boss_died` | `enemies.js:446` via `e.deathEvent` (gesetzt `boss.js:64`) | String | `main.js:882` | 1x, **1,0 s nach** dem tödlichen Treffer (`dieTime`, `boss.js:63`, Ablauf `enemies.js:441-449`) | **P0** |

**Bilanz:** 8 von 13 Typen sind heute **tote Events** (2, 3/4, 5, 9, 10, 11) — sie liegen fertig da und kosten null Verdrahtung.

### 1.3 Kandidaten OHNE Event (die eigentliche Arbeit)

| Auslöser | Ort | aus main.js beobachtbar über | Frequenz / Spam | Prio |
|---|---|---|---|---|
| **Schwert-Schwung** | `player.js:141-146` (setzt `attackTimer`/`attackId++`) | `player.attackId`-Flanke (Feld `player.js:75`) | max 1 je `ATTACK_TOTAL = 0,35 s` (`player.js:13`) | **P0** |
| **Schwert-Treffer (nicht tödlich)** | `enemies.js:466` `e.hp -= …` | `e.hurtTimer`-Flanke (`enemies.js:467`, `HURT_FLASH 0,2 s`) oder `e.hitAttackId === player.attackId` | 1 je Gegner je Schwung | **P0** |
| **Spieler nimmt Schaden** | `player.js:184-208` (`hurt()` liefert `true`, pusht nichts). Aufrufer: `enemies.js:532`, `boss.js:211`, `boss.js:268` | `player.invulnTimer`-Flanke (`player.js:192`, `INVULN_TIME 1 s`) oder `hp`-Delta | max 1/s durch Invuln | **P0** |
| **Schritte / Laufen** | `player.js:153-155` (`state='walk'`, `animTimer += dt`) | `player.state === 'walk'` + Frame-Index `Math.floor(animTimer*10)%4` (`player.js:221`) | **SPAM-KANDIDAT NR. 2**: 10 Frame-Wechsel/s ⇒ bei 2 Schritten je Zyklus **5 Schritte/s**. MUSS an den Sprite-Frame gekoppelt werden, nicht an einen Timer | P1 |
| **Vase/Urne zerbricht** | `props.js:107-118` (`state='break'`) | Scan der `props`-Liste — **Präzedenzfall existiert**: `main.js:835-840` scannt bereits jeden Frame `props` auf `p.opened === true` | 1x je Prop | **P0** |
| **Truhe öffnet (alle Inhalte)** | `props.js:66` `p.opened = true` | derselbe Scan `main.js:837` | 1x je Truhe | P1 |
| **Bumerang-Wurf** | `projectiles.js:61-73` | `projectiles.list.length` 0→1 — **Spiegel existiert schon**: `main.js:739` `const air = projectiles.list.length > 0` | max 1 je 0,2 s Sperre (`projectiles.js:22`) | P1 |
| **Bumerang-Fang** | `projectiles.js:110-114` | **Flanke existiert wörtlich**: `main.js:740` `if (zeldaWasAir && !air)` | | P1 |
| **Bumerang-Stun** | `projectiles.js:159/162` (`stunTimer`) | `e.stunTimer`-Flanke | | P2 |
| **Portal-Fade (Tür/Treppe)** | `main.js:809-825` (`fadePhase 'out'`→`'in'`, `FADE_TIME 0,3 s` `main.js:37`) | direkt im Zustand | 1x je Wechsel | **P0** |
| **Portal blockiert** | `main.js:942-946` (`VERSCHLOSSEN`/`VERSIEGELT`) | **schon gedrosselt** auf 1x/s (`portalToastTimer`, `main.js:945`) | | P1 |
| **Menü-Navigation Titel** | `main.js:781-788` (`titleMenuStep`, Flanke `titleHeldY` `main.js:780/787`) | direkt | | P1 |
| **Menü-Navigation Pause** | `main.js:985-1006` (Flanke `pauseHeldY`), Auswahl `main.js:1007-1019` | direkt | | P1 |
| **Menü-Navigation Inventar** | `inventory_ui.js:115-117` (Cursor), `:117` equip, `:96/102` close | `inventoryUI.cursor` ist öffentlich (`inventory_ui.js:62`) ⇒ Spiegel in main.js | | P1 |
| **Inventar auf/zu** | `main.js:966-970` / `main.js:977-980` | direkt | | P1 |
| **Pause auf/zu** | `main.js:771-773`, `pausiere()` `main.js:647` | direkt | | **P0** |
| **Titel / Spielstart** | `main.js:789-807` | direkt | | **P0** (Gesten-Unlock!) |
| **Game-Over / Sieg** | `main.js:933` / `main.js:962` (`enterState`) | direkt | | **P0** |
| **Boss-Telegraphie** | `boss.js:189` (windupA, Ring), `boss.js:225` (windupB, Korridor), `boss.js:289` (summon) | `e.marker` wird in `main.js:1061-1063` bereits pro Frame gelesen; `boss`-Referenz liegt fertig in `main.js:907` | 1 je Angriff, Cooldown 0,7-1,2 s (`boss.js:42-43`) | **P0** |
| **Boss-Aufschlag Dash / Sweep** | `boss.js:257` bzw. `boss.js:210-212` | `e.state`-Flanke `windupB→dash`, `windupA→sweep` | | P1 |
| **Boss-Aggro (Musik!)** | `boss.js:160` (`dist<=64 \|\| hp<maxHp`), zusätzlich Bumerang `projectiles.js:131-134` | `boss.state !== 'idle'` — **identische Prüfung existiert** in `maps.js:770` (`portalBlocked`) | 1x | **P0** |
| **Grufthund Telegraph/Sprung** | `enemies.js:316` / `enemies.js:335` | `e.state`-Flanke | | P1 |
| **Elite-Gegner** | `enemies.js:66` (`e.elite = true`) | Feld | Dauerzustand ⇒ nur Aggro-Stinger | P2 |
| **Regen/Wetter** | **existiert nicht** — kein Wetter-System im Repo | — | — | — |
| **Ambiente-Betten** | Fackeln: `main.js:849-854` (Lichter mit `flicker >= 0.8`); Nebel: `mapDef.fog` nur GRAVEYARD (`maps.js:656`, `map_fluestergruft.js:178`, `map_bosskammer.js:87` = false); Wasser/Kanal: `main.js:1242` `waterReflections` | direkt | Dauerschleife, positionsabhängig | P2 |

**Grundsatz für die Spec:** Alle 24 Lücken sind aus `main.js` über **vorhandene Felder** beobachtbar. `entities/` muss für Slice 5 **nicht angefasst** werden.

---

## 2. MUSIK-ZUSTÄNDE

### 2.1 Die Zustandsmaschine

`state` (`main.js:317`), Werte: `title` (`main.js:774`), `playing` (`main.js:808`), `inventory` (`main.js:974`), `paused` (`main.js:981`), `gameover` (`main.js:1020`), `victory` (`main.js:1040`). Zentraler Wechsler: `enterState(next)` `main.js:533-537` — **der eine Ort für Musik-Zustandswechsel auf Screen-Ebene.**

### 2.2 Karten

4 Karten, Registry `MAPS` in `maps.js:731`: `GRAVEYARD` (`maps.js:617`, ambient 0.22, Tint `#0a0a18`, fog), `CATACOMBS` (`maps.js:660`, 0.55, `#06080f`), `FLUESTERGRUFT` (`map_fluestergruft.js:121`, 0.52, `#04100c`, dunkelste Ebene), `BOSS_KAMMER` (`map_bosskammer.js:59`, 0.48, `#120608`).

**Der Kartenwechsel sitzt in `buildWorld` (`main.js:405`)**, Zeile 407-408 setzt `currentMapKey`/`mapDef`. `buildWorld` wird aus **vier** Pfaden gerufen:

| Pfad | Ort | Fade vorhanden? |
|---|---|---|
| Portal-Wechsel | `main.js:814` (mitten im Fade) | **JA**, 0,3 s je Richtung |
| Neustart / Titel „NEUES SPIEL" | `resetRun` `main.js:514` | nein |
| FORTSETZEN aus Spielstand | `ladeSpielstand` `main.js:529` | nein |
| Respawn nach Tod | `main.js:1030` | nein |

⇒ **Crossfade-Bedarf:** Der Portal-Pfad bringt den Rahmen gratis mit: Musik-Fadeout ab `main.js:813` (`fadePhase === 'out'`), Umschalten in `main.js:814` nach `buildWorld`, Fade-in bis `main.js:818`. Die drei anderen Pfade sind **harte Schnitte** und brauchen eine eigene kurze Blende (sonst Klick/Knack beim Respawn).

**Zuordnung Karte→Musik:** Der Bestand hat zwei Muster. (a) Datengetrieben am mapDef, additiv — `main.js:1284` `if (mapDef.extraLights)` bzw. `main.js:1395` `mapDef.ambientTint`, Prinzip „fehlt das Feld, passiert nichts". (b) Konstante in main.js — `LIT_FLOOR_MAPS` `main.js:1103`, **ausdrücklich weil** `map_fluestergruft.js` tabu war (`main.js:1100-1102`). Für ein künftiges Dorf (Slice 6) ist (a) die skalierende Wahl; ob `world/*.js` in Slice 5 beschreibbar ist, muss die Spec klären.

### 2.3 Boss-Kampf

Zwei Ebenen, beide bereits berechnet:
- **Kartenebene:** BOSS_KAMMER ist eine eigene Karte ⇒ Grundmusik aus 2.2.
- **Aggro-Ebene:** `main.js:907` sucht bereits pro Frame `enemies.find(e => e.kind === 'graveward' && e.state !== 'die')` für den HP-Balken. Ein `&& boss.state !== 'idle'` ist eine Zeile und liefert exakt den Kampf-Trigger (`boss.js:160` ist der Aggro-Punkt, `projectiles.js:131-134` der Bumerang-Weckruf). Nach besiegtem Boss existiert er gar nicht mehr (Filter `main.js:437-439`) ⇒ ruhige Variante automatisch.
- **Phasen:** `checkPhase` `boss.js:111-115` (HP < 17 / < 9) ⇒ optionale Intensitäts-Stufen; `phase` liegt als Feld vor (`boss.js:78`).

### 2.4 Übrige Zustände

- **Titel:** `main.js:1410-1416`; Untermenü nur mit Spielstand (`main.js:779`).
- **Game-Over:** `enterState('gameover')` `main.js:933`; **Sieg:** `main.js:962`. Beide mit Mindest-Anzeigezeit 0,7 s (`main.js:36`, `main.js:1022/1041`) ⇒ Platz für einen Stinger.
- **Pause:** `main.js:981` ist eine **harte Pause** (keine Welt-Updates), aber `timeSec` läuft weiter (`main.js:727`, Kommentar `main.js:982-983`). ⇒ **Ducking** statt Stopp; Musik weiterlaufen lassen, Effekte stumm.
- **Inventar:** `main.js:974-980`, ebenfalls harte Pause ⇒ dasselbe Ducking-Verhalten, plus UI-Klicks.
- **PFLICHT (App):** `systemPause()` `main.js:658-662` (aus `visibilitychange` `main.js:666-668` und `pagehide` `main.js:674`) ist der Ort für ein echtes `AudioContext.suspend()`. Ohne das spielt der Ton weiter, wenn Michael die App wegwischt. Gegenstück beim Fortsetzen: `main.js:772` bzw. `main.js:1008`.

---

## 3. GAME-FEEL-INVENTUR

### 3.1 Was EXISTIERT

| Effekt | Ort |
|---|---|
| Knockback Spieler | `player.js:126-132` (`KNOCK_SPEED 140`, `KNOCK_DURATION 0,15` `player.js:16-17`), skaliert mit `knockTakenMult` `player.js:196` |
| Knockback Gegner | `enemies.js:502-509`, Regel „nur bei `knockFactor > 0`" `enemies.js:468-481` (Boss hat 0, `boss.js:59`) |
| Invuln-Blink Spieler | `player.js:229-231` (12 Hz), `INVULN_TIME 1 s` `player.js:18` |
| Hurt-Blitzen Gegner | `enemies.js:620` (20 Hz), Boss `boss.js:324` |
| Aufsteh-Blinken Grufthund | `enemies.js:621-624` |
| Stun-Wackeln ±1 px | `enemies.js:632-634` |
| Level-Up-Ring 0,5 s | `main.js:868`, gezeichnet `main.js:1369-1378` |
| XP-Leisten-Weissblink 2 Frames | `main.js:869`, `main.js:877` |
| Bumerang-Fang-Weissblink 3 Frames | `main.js:740` |
| Boss-Damage-Lag-Balken | `main.js:899-922` + Rampe `hud.js:54` |
| Boss-Boden-Telegraph-Marker (Ring/Korridor, Gefahr-Blitz letzte 0,25 s) | `main.js:1060-1098` |
| Rostpanzer-Block-Funken | `enemies.js:653-660` |
| Elite-Glut-Overlay | `enemies.js:665-674` |
| Pickup-Toast mit Priorität, 0,9 s | `main.js:365-367`, `main.js:858-874`, `hud.js:585` |
| Weichschatten (4/5 Zeilen) | `main.js:1150-1200` |
| Sprite-Licht-Tint (warm/kalt, Hysterese) | `main.js:1311-1331`, Fassade `main.js:189-231` |
| Glut-Funken + Staub-Motes | `particles.js` (nur `spawnEmbers`, `particles.js:154`) |
| Portal-Fade 0,3 s | `main.js:1433-1441` |
| Vignette / Nebel | `hud.js:661` / `hud.js:610` |

### 3.2 Was FEHLT — mit Test-Risiko

**(a) HITSTOP — fehlt vollständig. Risiko: HOCH, aber baubar.**

Loop-Verträglichkeit: `loop.js:32-37` fährt einen 60-Hz-Akkumulator mit `MAX_UPDATES 5`. Hitstop darf **nicht** in `loop.js` gebaut werden — zwei Gründe: (1) Quelltext-Wächter `smoke_test.mjs:4854-4859` fordert, dass main.js `.stop()` **nie** und `.start()` **genau einmal** ruft; (2) der Bestand hat den passenden Präzedenzfall schon: der Fade-Zweig `main.js:809-825` friert die Welt ein („Fade: KEINE Welt-Updates … Fade-Timer, timeSec/stateTime und input.postUpdate laufen weiter"). **Hitstop gehört als dritter Freeze-Zweig genau dorthin.**

Test-Risiko konkret: `.tmp/check_main_slice1.mjs` fährt **exakte Distanzen** (`:207` `hold('ArrowRight',430)`, `:212` `hold('ArrowUp',190)`, `:219` `hold('ArrowDown',43)`, `:220` `hold('ArrowLeft',45)`) und prüft danach **exakte Bildschirmkoordinaten** (`:211` `p.x === 282`, `:216`, `:232`, `:248`, `:293`). Ein Hitstop verschiebt jede Strecke, die nicht an einer Wand resynct.
Entschärfung liegt im Test selbst: nach jedem `clearArea()` (Kampf, `:171-190`) folgt ein Wand-Resync (`:209`, `:214`); die Prüfungen `:232`/`:248` liegen hinter Portal-Spawns, `:293` hinter dem Respawn. Die einzigen freien Strecken (`:219-220`) laufen in bereits geräumtem Gebiet. ⇒ **wahrscheinlich verträglich, aber vor dem Bau in `.tmp/slice5_probe/` gegen genau diesen Test zu messen.** Zweiter Effekt: Hitstop verändert `player.animTimer` nicht (der läuft im Freeze nicht weiter) ⇒ keine Sprite-Regression.

**(b) SCREEN-SHAKE — fehlt. Risiko: SEHR HOCH, drei getrennte Fallen.**

`camera.js` ist 18 Zeilen, kennt nur `follow()` mit Weltrand-Klemmung (`camera.js:11-16`); `camera.x/y` sind bewusst Float, jeder Zeichner rundet selbst (`camera.js:2-3`).

- **Falle 1 (Positions-Assertions):** `playerScreen()` `.tmp/check_main_slice1.mjs:127-139` misst `drawImage`-Argumente, also `worldX - cam.x`. **Jeder** Kamera-Offset zum Messzeitpunkt macht `:211/:216/:232/:248/:293` rot. Milderung: alle fünf Prüfungen liegen ≥ 24 Frames nach dem letzten Kampfereignis (`:209`/`:214` je 30 Frames, `:228`/`:245` je `frames(45)`, `:279` `frames(50)`) ⇒ ein Shake mit Dauer ≤ 0,2 s (12 Frames) ist dort abgeklungen. **Bindend: ganzzahlige Amplitude, harte Dauergrenze, Amplitude 0 im Ruhezustand.**
- **Falle 2 (Stub-Vorrat):** Ein Shake per `ctx.translate`/`setTransform` ist ein **TypeError** in `.tmp/check_main_slice1.mjs` — dessen `makeCtx` (`:31-49`) kennt nur `fillRect, clearRect, drawImage, fillText, beginPath, arc, fill, stroke, save, restore, createRadialGradient`. **Kein `translate`.** Ebenso `.tmp/check_inventory_slice2.mjs:40-62` (dort zusätzlich `strokeRect`). Nur `.tmp/check_boss_slice3.mjs:61` und `.tmp/check_engineB_gp6.mjs:34` haben `translate/rotate` (wegen `drawMarkers` `main.js:1084-1085`). ⇒ **Shake MUSS über `camera.x/y` bzw. einen Offset in den Zeichenaufrufen laufen, nie über die ctx-Transformation.**
- **Falle 3 (Mess-Rig):** `.tmp/shot_gfx6.py` misst per Playwright gegen `http://127.0.0.1:8124` (`:110`) **pixelgenaue Fenster** bei eingefrorenen Zeitphasen. Ein Shake während einer Messphase verschiebt alle Fenster ⇒ GP7-Messziele würden unbrauchbar.

**(c) BLITZ-FLASH bei Treffern — fehlt. Risiko: MITTEL, Muster liegt vor.**

Zwei scharfe Detektoren:
1. `fadeAlpha()` `.tmp/check_main_slice1.mjs:158-163`: Vollbild-`fillRect` 320×180 auf dem **Haupt**-Canvas mit `fillStyle === '#000'` **und** `0 < globalAlpha < 1`. Genutzt in `:204/:225/:230/:236/:244`. ⇒ Ein **weisser** Flash ist frei (fillStyle ≠ '#000'); ein **dunkler** Vollbild-Flash wäre sofort rot.
2. `ambientAlpha()` `.tmp/check_main_slice1.mjs:154-157`: der **ERSTE** `fillRect` auf einem **Nicht**-Haupt-Canvas mit `0 < alpha < 1`; sein Wert wird gegen `mapDef.ambient` geprüft — 4 Zeilen in check_main (`:202/:229/:246/:283`) und 8 in check_boss (`:143/:157/:165/:172/:185/:244/:264/:277`). ⇒ **Ein Flash mit eigenem Offscreen und Teil-Alpha, gezeichnet VOR `lighting.draw` (`main.js:1395`), kippt alle 12 Zeilen.**

**Sichere Bauform steht im Bestand:** `drawPause` (`hud.js:785`) und `drawGameOver` (`hud.js:833`) legen ihre Deckung in die **rgba-Füllfarbe bei `globalAlpha = 1`** — ausdrücklich begründet `hud.js:754-757` und sogar geprüft (`smoke_test.mjs:4576`). Auch die Vignette baut ihren Offscreen mit `globalAlpha = 1` (`hud.js:674`) und trippt daher `ambientAlpha` nicht. ⇒ **Flash auf den Haupt-ctx, nach `lighting.draw`, Deckung in der Füllfarbe.**

**(d) PARTIKEL-LÜCKEN.** `particles.js` bietet **nur** `spawnEmbers` (`particles.js:154`); der API-Vertrag `list/spawnEmbers/update/draw` ist geprüft (`smoke_test.mjs:2181-2183`), der harte Deckel `MAX_PARTICLES = 60` (`particles.js:27`) ebenfalls (`smoke_test.mjs:2185-2186`, 300 Aufrufe). Es fehlen: Treffer-Funken am Schwert, Todes-Puff, Aufprall-Staub beim Boss-Dash (`boss.js:251-277`), Wasser-Spritzer im Gruftkanal, Fußstaub. Eine additive `spawnBurst`-Funktion ist möglich; sie muss den 60er-Deckel respektieren oder ein **eigenes** Budget führen (das Gate prüft nur `spawnEmbers`). Risiko: NIEDRIG.

**(e) Weitere Lücken:** kein Treffer-Aufblitzen des getroffenen Sprites in Weiss (heute nur Aussetzer-Blinken, `enemies.js:620`); kein Squash/Stretch; kein Kamera-Vorlauf in Blickrichtung; keine Zeitlupe beim Todesstoß.

---

## 4. VERDRAHTUNGS-ARCHITEKTUR

### 4.1 Wo läuft der Audio-Tick

**In `update(dt)` (`main.js:726`), nicht in `render()` (`main.js:1407`).** Begründung mit Beleg: `update` läuft im festen 60-Hz-Akkumulator (`loop.js:32-36`), `render` einmal je rAF (`loop.js:38`). Bei Frame-Drops führt `loop.js` bis zu 5 Updates je Render aus (`loop.js:32`, `MAX_UPDATES` `loop.js:5`) und verwirft danach den Rest (`loop.js:37`) — ein Ton-Trigger im Render würde Ereignisse verschlucken oder doppeln.

Der **Sequenzer** (Musik) gehört dagegen an die eigene WebAudio-Uhr (`AudioContext.currentTime`) mit Lookahead-Fenster; nachgefüllt wird das Fenster im `update`-Tick. So bleibt die Musik takt-stabil, auch wenn rAF ruckelt oder der Tab pausiert.

Reihenfolge im Tick: der Verbrauch muss **zwischen `main.js:828` und dem nächsten `main.js:827`** liegen. Empfohlener Ort: gebündelt mit dem bestehenden Toast-Block `main.js:858-877` (dort steht die etablierte `hasEvent`/`getEvent`-Auswertung) bzw. unmittelbar nach `updateDrops` `main.js:841`. `input.postUpdate()` bleibt Letztes im Tick (`main.js:1048`).

### 4.2 Wie Events zum Audio-Modul kommen — ohne `entities/` zu berühren

**Ein Beobachter-Block in `main.js`**, der zwei Quellen mischt:
1. **Event-Strom** — die 13 vorhandenen Typen, gelesen mit `hasEvent`/`getEvent` (`entity.js:16-26`).
2. **Feld-Flanken auf vorhandenen Objekten** — für die 24 Lücken aus 1.3.

Diese Bauweise ist im Projekt **bereits dreifach etabliert und begründet**:
- `main.js:739-744`: `projectiles.list.length` → `zeldaState`/`zeldaBlink` (Flanke über Frame-Grenze).
- `main.js:835-840` mit Begründung `main.js:378-386`: **„DATENQUELLE ist die props-LISTE, nicht der Event-Strom"** — genau die Antwort für Vasenbruch und Truhenöffnung.
- `main.js:907-922`: Boss-Spiegel pro Frame (`player.bossBar`) — die Vorlage für Boss-Telegraph und Aggro.

Beobachtbare Felder für die Lücken: `player.attackId` (`player.js:75`), `player.invulnTimer` (`player.js:72`), `player.hp`, `player.state`/`animTimer` (`player.js:70-73`), `e.hurtTimer`/`e.state`/`e.stunTimer` (`enemies.js:43-51`), `e.marker` (`boss.js:84`), `p.state`/`p.opened` (`props.js:31-32`), `projectiles.list.length`, `fadePhase`, `state`, `inventoryUI.cursor` (`inventory_ui.js:62`).

Nachteil, den die Spec deklarieren muss: Flanken sterben beim Objekt-Neubau (`buildWorld` erzeugt neue Entities, `main.js:431-461`). Das Bestandsmuster dafür ist die `WeakMap` `TINT_PREV` (`main.js:239`, Begründung `main.js:233-238`).

### 4.3 Lautstärke / Mute — Persistenz

**Nicht in `save.js`.** Belege:
- `save.js` ist ein **Run-Snapshot** (`SAVE_KEY = 'grimlight.save.v1'`, `save.js:35`), der bei „NEUES SPIEL" wirkungslos wird (`main.js:794-801`) und beim Tod/Portal überschrieben wird (`main.js:310-315`).
- `deserialize` lehnt **hart ab**, sobald Pflichtfelder fehlen oder Fremdfelder auftauchen (`save.js:150-162`; `maxHp` wird explizit verboten, `save.js:162`). Ein Schema-v2-Wechsel wäre eine Slice-6-Aufgabe (MASTERPLAN: `design/MASTERPLAN_TIEFE.md:42-43` nennt Save-Schema v2 für Slice 6).
- `save.js` ist per Quelltext-Wächter browserfrei (`smoke_test.mjs:4243-4251`).

**Empfehlung: eigener localStorage-Key** (z. B. `grimlight.audio.v1`), gelesen/geschrieben **ausschließlich** über die bereits gebauten Guard-Helfer `storeLesen`/`storeSchreiben` (`main.js:284-291`, Pflichtform begründet `main.js:282-283`). Der Zustand „gar kein localStorage" ist in `tools/check_save_slice4.mjs:344-349` (BOOT 5) bereits als Prüfstein vorhanden.

### 4.4 UI-Ort: Pause-Menü — **hier liegt die härteste Bremse**

`PAUSE_MENU_ZONES` (`hud.js:764-768`) ist die **eine** Geometriequelle: `hud.js:798-806` zeichnet daraus, `main.js:993-1001` macht den Tap-Hittest, `main.js:1003-1004` den Cursor-Clamp, `main.js:1007-1019` die Aktionen (0 WEITER, 1 GOTT, 2 FPS).

> **`tools/smoke_test.mjs:4564-4570` prüft `PAUSE_MENU_ZONES.length === 3`.**

Jede zusätzliche Zeile (TON / MUSIK / LAUTSTÄRKE) macht diese Assertion **rot**. Das ist keine Umgehungssache, sondern eine „sanktionierte Bestandsstelle", die die Spec ausdrücklich benennen muss — Präzedenzfall GP6: „GENAU die 13 sanktionierten Ambient-Zeilen" (`uebergaben/2026-08-13_grafikpass6.md:40`), Slice 4: „Kanonische Flusstests NULL angefasst" (`uebergaben/2026-08-13_slice4_mobile.md:40`).

Geometrie-Zwang dazu: Panel ist 160×110 ab (80,40) (`hud.js:789`), Unterkante 150. Zonen liegen bei y 74/96/118 (+18). Eine vierte Zone bei y 140 endet bei 158 — **ausserhalb des Panels**. `smoke_test.mjs:4566` prüft `z.y + z.h <= 180` (hielte), `:4567` `h*MM_PRO_PX >= 6`, `:4568-4569` Nicht-Überlappung. ⇒ **Das Panel muss wachsen.** Alternative ohne Zeilenzuwachs: Wert auf einer bestehenden Zeile mit LINKS/RECHTS verstellen — verlangt `input.dirX` im Pause-Zweig (`main.js:985` liest heute nur `dirY`) und ist mit dem Touch-Tap-Vorrang (`main.js:990-1001`) unvereinbar. Entscheidung gehört in die Spec.

`drawPause` muss dabei im Stub-Vorrat bleiben (kein `strokeRect`, kein Pfad) — geprüft in `smoke_test.mjs:4574-4575`, begründet `hud.js:770-775`.

### 4.5 Autoplay / WebView-Freischaltung

- **App:** `settings.setMediaPlaybackRequiresUserGesture(false)` steht in `mobile/node_modules/@capacitor/android/capacitor/src/main/java/com/getcapacitor/Bridge.java:567` ⇒ die WebView-Sperre ist in der APK **aus**.
- **Browser (Michaels Port-8123-Test und das Playwright-Rig):** Chromes Autoplay-Politik gilt weiter; der AudioContext startet `suspended` und braucht `resume()` nach echter Nutzeraktivierung.
- **Gestenpunkt existiert:** Titel → Enter/Tap startet den Run (`main.js:789-807`, Tastatur `input.js:182`, Touch `input.js:210-212`). Aber `update()` läuft im rAF-Callback, nicht im Event-Handler ⇒ `resume()` gehört **zusätzlich** an einen echten Listener. `main.js` darf das (CLAUDE.md:100) und hat das Muster schon (`main.js:663-676`).
- **⚠ Test-Falle:** die Flusstests rufen registrierte `window`-keydown-Listener **wirklich auf** (`.tmp/check_main_slice1.mjs:117-119`, `key()` iteriert `winListeners`). Ein Unlock-Handler an `window` MUSS in der §0.2-Guardform stehen (typeof-Prüfung + try/catch + Null-Fallback, Vorlage `main.js:270-291`), sonst werden alle drei kanonischen Flusstests rot. Ein Listener am **Canvas** ist harmlos: `canvas.addEventListener` ist in allen Stubs ein No-Op (`.tmp/check_main_slice1.mjs:56`, `:80`).
- **Kein Stub kennt AudioContext:** `grep -rn "AudioContext|webkitAudio|new Audio" tools/ .tmp/*.mjs game/` ⇒ **0 Treffer**. Das Audio-Modul muss ohne AudioContext vollständig inert sein und beim Import **kein** Browser-Global anfassen (CLAUDE.md:49-51; smoke importiert alle Module).
- **Kein Maus-Input:** `input.js:305-317` hängt nur keydown/keyup/blur/visibilitychange und die vier Touch-Events an. Auf dem Desktop ist die Tastatur die einzige Gestenquelle — ein reiner Mausklick löst heute nichts aus.

---

## 5. TEST-LANDSCHAFT

| Suite | Umfang | Von Audio/Game-Feel berührt | Bekannte Fallen |
|---|---|---|---|
| `tools/smoke_test.mjs` | 258 KB, ~4870 Zeilen, Schranke `totalTicks >= 600` (Dateiende) | **JA**: `PAUSE_MENU_ZONES.length === 3` (`:4564-4570`); particles-API + 60er-Deckel (`:2181-2190`); hud.js-Quelltext-Wächter (`:4511-4519`); main.js-Wächter `.stop()/.start()` (`:4854-4859`) | Additive Blöcke mit eigenem Marker sind das etablierte Verfahren (Muster `S4-§7F(gold)` ab `:3886`) |
| `.tmp/check_main_slice1.mjs` (26 Assertions) | fährt main.js headless, Titel→Portal→Tod→Respawn | **HÖCHSTES RISIKO** | Exakte Screen-Positionen `:211/:216/:232/:248/:293`; ambient-Detektor `:154-157` (Zeilen 202/229/246/283); Fade-Detektor `:158-163`; **Stub ohne `translate/rotate`** `:31-49`; Canvas→Sprite über **Erzeugungsreihenfolge** `:100-106` (main.js warnt: „Bestandsreihenfolge ist EINGEFROREN", `main.js:90-95`) |
| `.tmp/check_inventory_slice2.mjs` (26) | main.js headless + Inventar | mittel | Stub ohne `translate/rotate` (`:40-62`, hat `strokeRect`); dieselbe Canvas-Reihenfolge-Abhängigkeit |
| `.tmp/check_boss_slice3.mjs` (34) | main.js headless, Bosskampf | mittel | 8 ambient-Zeilen; Stub **mit** `translate/rotate` (`:61`); prüft überwiegend Zustände, kaum Positionen ⇒ Hitstop-tolerant |
| `tools/check_save_slice4.mjs` (48) | 6 Boots über `?boot=N` | **JA**, für einen neuen Settings-Key | BOOT 5 ohne localStorage (`:344-349`) ist der Prüfstein; Stub-ctx hat mehr Vorrat als die kanonischen (`:87-94`, ausdrücklich deklariert) |
| `smoke_test.mjs:3886-4014` (S4-GOLD) | 3 sha256 über den **lighting.js-Offscreen-fillRect-Strom** | nur wenn Flash/Shake in `lighting.js` eingreifen | Kommentar `:3897-3898`: „Ein roter Hash ist KEIN Test-Problem, sondern ein Pixel-Unterschied" |
| `.tmp/check_gfx6_art.mjs` | Art-/Grid-Wächter | nur bei neuen Sprites (z. B. Lautsprecher-Icon) — Maßtabelle `{16×16,32×32,48×32,64×48,64×32}` | |
| `.tmp/shot_gfx6.py` | Playwright-Messrig gegen `127.0.0.1:8124` (`:110`), eingefrorene Zeitphasen, `window.__noTint` (`main.js:1307`) | **JA bei Shake/Flash**: pixelgenaue Messfenster | Port 8124 ist der einzige erlaubte Zweitport |
| `tools/check_syntax.sh` | `node --check` über alle `game/js/*.js` | ein neues Audio-Modul läuft automatisch mit | |

**Die vier bekannten Fallen in einem Satz:** (1) Canvas-Erzeugungsreihenfolge einfrieren — neue Offscreens nur nach dem Boot; (2) die zwei Detektoren `ambientAlpha`/`fadeAlpha` nicht anfassen — Deckung in die Füllfarbe, Flash auf den Haupt-ctx nach `lighting.draw`; (3) Stub-Vorrat einhalten — kein `translate`, kein `strokeRect`, kein Pfad im kanonischen Pfad; (4) §0.2-Guardform für **jeden** neuen Browser-Zugriff, AudioContext eingeschlossen (`uebergaben/2026-08-13_slice4_mobile.md:62-64`, bindende Erkenntnis 1).

---

## 6. PRIORISIERTE ARBEITSLISTE FÜR DIE SPEC

**Block A — Fundament (keine Testberührung, kein Risiko)**
1. **Audio-Modul `game/js/core/audio.js`**, Node-importierbar, ohne Browser-Global auf Modulebene (CLAUDE.md:49-51); AudioContext ausschließlich lazy in §0.2-Guardform (`main.js:270-291` als Vorlage). Chiptune synthetisch (Oszillatoren/Rausch + Hüllkurven), keine Binär-Assets — passt zu CLAUDE.md:45-48 „Grafik als Code".
2. **Gesten-Unlock** an Canvas-`touchstart` (Stub-No-Op, risikofrei) **und** guarded an `window`-keydown (⚠ Flusstests rufen den Handler wirklich auf, `.tmp/check_main_slice1.mjs:117-119`); `resume()` zusätzlich beim Verlassen des Titels (`main.js:789-807`).
3. **Lifecycle-Anschluss:** `suspend()` in `systemPause()` `main.js:658`, `resume()` bei `enterState('playing')` `main.js:533`/`main.js:772`.
4. **Einstellungs-Persistenz** über eigenen localStorage-Key mit `storeLesen`/`storeSchreiben` (`main.js:284-291`). Nicht in `save.js`.

**Block B — Die 8 toten Events verdrahten (null Verdrahtungskosten)**
5. `gold_pickup` (`enemies.js:597`) **mit Frame-Entprellung** (max 1 Ton/Frame, Tonhöhen-Treppe bei Ketten) — Spam-Kandidat Nr. 1.
6. `enemy_died` (`enemies.js:486`), `attack_blocked` (`enemies.js:464` + `projectiles.js:157`), `potion_drunk` (`player.js:122`), `potion_pickup` (`enemies.js:590`), `potion_full_gold` (`enemies.js:593`).
7. Die 5 bereits gelesenen: `player_died`, `level_up`, `item_pickup`, `key/heart/weapon_found`, `chest_opened`, `boss_died` — im Toast-Block `main.js:858-895` mitnehmen.

**Block C — Beobachter-Block in main.js (Kernverben)**
8. **Schwert-Schwung** (`player.attackId`-Flanke) und **Schwert-Treffer** (`e.hurtTimer`-Flanke) — die zwei wichtigsten Töne des Spiels.
9. **Spieler-Schaden** (`player.invulnTimer`-Flanke).
10. **Vase/Truhe** über den bestehenden props-Scan `main.js:835-840`.
11. **Bumerang** Wurf/Fang über die bestehenden Spiegel `main.js:739-742`.
12. **Portal-Fade** `main.js:809-825`, **Portal blockiert** `main.js:942-946` (Drossel schon da).
13. **Schritte** — an den Sprite-Frame `Math.floor(animTimer*10)%4` gekoppelt (`player.js:221`), **nicht** an einen freien Timer; Spam-Kandidat Nr. 2.

**Block D — Musik**
14. Zustandsmusik über `enterState` (`main.js:533`) für Titel / Game-Over / Sieg; Ducking in `paused` (`main.js:981`) und `inventory` (`main.js:974`).
15. Kartenmusik am Umschaltpunkt `buildWorld` (`main.js:405-408`); Crossfade im Portal-Fenster (`main.js:813-818`), kurze Blende auf den drei fade-losen Pfaden (`main.js:514`, `:529`, `:1030`).
16. Boss-Aggro als zweite Ebene über den vorhandenen Boss-Fund `main.js:907` (`state !== 'idle'`); Phasen optional über `boss.phase` (`boss.js:78`).
17. **Design-Entscheid für die Spec:** Musik-Zuordnung datengetrieben am `mapDef` (Muster `mapDef.extraLights` `main.js:1284`) oder als Konstante in main.js (Muster `LIT_FLOOR_MAPS` `main.js:1103`) — hängt davon ab, ob `world/*.js` in Slice 5 beschreibbar ist.

**Block E — Game-Feel (jeder Punkt mit Vorab-Probe in `.tmp/slice5_probe/`)**
18. **Hitstop** als dritter Freeze-Zweig neben dem Fade (`main.js:809-825`), 2-3 Frames, nur bei Treffer/Kill. **Vorab gegen `.tmp/check_main_slice1.mjs` messen** (Positionen `:211/:216/:232/:248/:293`).
19. **Screen-Shake** ausschließlich über `camera.x/y` (nie `ctx.translate` — Stub-TypeError), ganzzahlig, Dauer ≤ 12 Frames, dosiert nach Ereignisklasse (Boss-Dash > Spielerschaden > Kill > Vasenbruch). **Drei Prüfungen vorab:** check_main-Positionen, check_boss, `.tmp/shot_gfx6.py`-Messfenster.
20. **Treffer-Flash** auf dem Haupt-ctx **nach** `lighting.draw` (`main.js:1395`), Deckung in der rgba-Füllfarbe bei `globalAlpha = 1` (Muster `hud.js:785/833`, geprüft `smoke_test.mjs:4576`). Niemals eigener Offscreen mit Teil-Alpha vor `lighting.draw` (kippt 12 ambient-Zeilen).
21. **Partikel-Bursts** als additive Funktion in `particles.js` mit eigenem Budget (60er-Deckel-Gate `smoke_test.mjs:2185-2186` prüft nur `spawnEmbers`): Treffer-Funken, Todes-Puff, Boss-Dash-Staub.

**Block F — UI (die harte Bremse)**
22. **Pause-Menü erweitern** um TON/MUSIK bzw. Lautstärke. Erfordert: Panel-Wachstum (`hud.js:789`, heutige Unterkante 150 lässt keine 4. Zone zu) **und** die ausdrückliche Sanktionierung von `smoke_test.mjs:4564-4570` (`PAUSE_MENU_ZONES.length === 3`) in der Spec, samt Cursor-Clamp/Tap-Hittest in `main.js:993-1004` und Aktionsketten `main.js:1007-1019`.
23. Optional: Nebenbefund aus Slice 4 mit erledigen — Inventar-Zeilenhöhe 20 überlappt bei vollem Beutel den ANLEGEN-Knopf, ausdrücklich nach Slice 5 verschoben (`uebergaben/2026-08-13_slice4_mobile.md:50-53`).

**Block G — Absicherung**
24. Additiver Smoke-Block mit eigenem Marker (Muster `S4-§7F(gold)` ab `smoke_test.mjs:3886`): Audio-Modul ohne AudioContext inert, Node-Import wirft nicht, Settings-Roundtrip ohne localStorage, Hitstop-Freeze verändert `timeSec` nicht.
25. Vor jeder Renderer-Berührung Op-Strom-Hashes einfrieren (bindende Erkenntnis 2, `uebergaben/2026-08-13_slice4_mobile.md:65-67`).
26. Suiten-Ausgaben explizit greppen, nie nur Exit-Code (bindende Erkenntnis 3, ebd. `:68-70`).