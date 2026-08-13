# Slice-4 Spec-Review (13.08.2026, wf_ca455c58-9f7)


---

# PRÜFER 1: Tests & Bestand

## SPEC-PRÜFUNG SLICE 4 (Rev 1) — LINSE 1: TESTS & BESTAND

Baseline vor der Prüfung verifiziert: `check_main_slice1` 25 / `check_inventory_slice2` 25 / `check_boss_slice3` 33 Assertions **grün**; `check_lighting_input_slice1.mjs` ist bereits heute rot (bekannt, nicht kanonisch). Keine Spieldatei geändert (`git status --porcelain` leer), kein Port belegt. Alle Proben in `/tmp/.../scratchpad/probe/` (Kopie von `game/`).

---

### BLOCKER

**B1 — §0.2 ist zu eng: der Storage-Guard rettet nur den Storage, §4/§5 fassen vier weitere APIs an, die die Stubs NICHT haben.**
Stub-Inventar (identisch in allen drei Flusstests, `check_main_slice1.mjs:62-83`): `window` = **nur** `addEventListener, devicePixelRatio, innerWidth, innerHeight, location.search, requestAnimationFrame`. `document` = **nur** `getElementById, createElement, addEventListener, defaultView, hidden`. Canvas = `width, height, style{}, getContext, addEventListener, getBoundingClientRect, ownerDocument`. Global fehlen in Node 20.19 zusätzlich `navigator`, `screen`, `localStorage`, `matchMedia` (gemessen).
Gemessene Ergebnisse an der Probe (jeweils gegen `check_main_slice1`):

| Variante in main.js | Ergebnis |
|---|---|
| `window.localStorage.getItem(...)` ungeguardet | `TypeError … reading 'getItem'` → alle 3 rot |
| **Pflichtform §0.2** + `store ? store.getItem() : null` | **CHECK GRÜN (25)** |
| `window.matchMedia('(orientation: portrait)')` (§4.4-Hochformat) | `TypeError: window.matchMedia is not a function` → Boot-Crash |
| `canvas.requestFullscreen()` / `screen.orientation.lock()` im Titel-Confirm (§4.4) | `TypeError: canvas.requestFullscreen is not a function` (der Titel-Confirm wird von ALLEN drei Tests gefahren) |
| `document.body.style…` in `resize()` (§5.2/§5.3) | `TypeError … reading 'style'` → Boot-Crash |

Zusatzfalle: `getElementById: () => mainCanvas` liefert für **jede** ID das Canvas — ein `document.getElementById('rotate').classList.add(...)` (Hochformat-Overlay) wirft `classList undefined` → alle drei rot.
*Fix:* §0.2 zu einer allgemeinen Regel machen: JEDER neue Browser-Zugriff in main.js läuft durch dieselbe `try{…}catch{return null}`-Form plus `typeof`-Prüfung; Hochformat-Hinweis und Safe-Area **rein in CSS** (Media-Query auf ein statisches `<div>`, kein JS-Zugriff darauf); §5.3 ausschließlich über `canvas.style` + `window.innerWidth/devicePixelRatio`.

**B2 — §6.2 „runs als Zahlen-Puffer" bricht Bestands-Smoke-Assertions und kollidiert damit mit §0.4.**
`lightRuns` ist exportiert und wird vom BESTANDS-Block §7F(b) objektweise gelesen: `voll.every(r => r.h === RUN_H)`, `r.x % 2 === 0 && r.w % 2 === 0`, `Number.isInteger(r.k)`, `JSON.stringify(ohne) === JSON.stringify(voll.filter(...))` (`tools/smoke_test.mjs:3011-3056`, Aufrufer `lighting.js:509`). Ein flacher Zahlenpuffer macht `r.h` zu `undefined` → mindestens 8 Bestandsprüfungen rot; §0.4 verbietet, sie anzufassen.
*Fix:* Nur den INTERNEN Zeichenpfad umbauen (`lightRunsInto(buf, …)`, von `draw()` benutzt), `lightRuns()` als dünner Wrapper, der die Objektliste weiterhin materialisiert — Allokations-Gewinn im Frame, Vertrag für die Tests unverändert. Sonst §6.2 streichen.

**B3 — §6.1 LUT-Cache als `Map<seed,LUT>` ist ein unbegrenztes Leck, weil bewegte Lichter jeden Frame einen neuen Seed erzeugen.**
Seed = `l.x*0.7 + l.y*1.3` (`lighting.js:323`) — konstant nur für Fackeln. Spielerlaterne (`main.js:353/460 syncPlayerLight`), Elite-Lichter (`main.js:851`) und Selten-Drop-Lichter wandern. Gemessen (CATACOMBS, Spieler 90 px/s = 1,5 px/Frame): **25 statische Fackel-Seeds, aber 625 verschiedene Seeds nach 600 Frames = 10 s**, ~60 KB/s reine Float32Array-Nutzlast pro bewegtem Licht → ~3,6 MB/min, auf dem Handy genau der GC-Druck, den §6 beseitigen soll.
*Fix:* Nur cachen, wenn `(l.flicker||0) >= 0.8` (ortsfeste Fackeln = die gemessenen 56 % JS-Zeit), plus harte Deckelung (`if (cache.size > 128) cache.clear()`). Bewegte Lichter bauen ihre LUT weiter pro Frame (1-3 statt 26 Allokationen).

**B4 — §3.2 Save-Hook „am Ende von buildWorld (nach :374)" speichert auf dem Respawn-Pfad hp = 0 und überschreibt bei JEDEM Titel-Start den Spielstand.**
Gemessen (Log an genau dieser Stelle, Lauf `check_main_slice1`):
```
[SAVE-HOOK nach :374] mapKey=GRAVEYARD hp=6 gold=0 carry=false   <- resetRun beim Titel-Confirm
[SAVE-HOOK nach :374] mapKey=CATACOMBS  hp=4 gold=2 carry=true
[SAVE-HOOK nach :374] mapKey=GRAVEYARD  hp=4 gold=2 carry=true
[SAVE-HOOK nach :374] mapKey=GRAVEYARD  hp=0 gold=1 carry=true    <- Respawn (main.js:609)
```
`main.js:608-612` setzt `player.hp = player.maxHp` erst NACH `buildWorld`; der Hook sieht `prev.hp = 0` (carry, `main.js:317`). Ein so geladener Stand stirbt im ersten Frame erneut (`player.js:103-107`) und halbiert das Gold ein zweites Mal. Zeile 1 zeigt außerdem: der Hook feuert im Titel-Confirm über `resetRun()` — „NEU löscht den Save erst beim ersten neuen Checkpoint" (§3.3) ist damit unerfüllbar.
*Fix:* Schreiben NICHT in `buildWorld`, sondern an den beiden Aufrufstellen NACH der vollständigen Zustandsherstellung: nach `main.js:449` (Portal-Fade fertig) und nach `main.js:611` (`hp/deathToll` gesetzt) — und im `resetRun`-Pfad bewusst NICHT.

**B5 — §3.4 openedChests: (a) die Events tragen keine Position, eine Truhensorte pusht gar kein Event; (b) `resetRun` löscht die Liste nicht → neuer Run ohne Boss-Schlüssel = unlösbar.**
`props.js:64-100` pusht `{type:'weapon_found'}` / `'key_found'` / `'heart_found'` / `'chest_opened'` — **ohne x/y**, und der Inhalt `'gold'` pusht **überhaupt kein Event** (`props.js:91-96`). Über den Event-Strom ist „welche Truhe" nicht rekonstruierbar. Zweitens: `resetRun` setzt nur `runFlags.bossDead = false` (`main.js:391`). Bleibt `openedChests` stehen, fehlt im neuen Run die `boss_key`-Truhe (FLUESTERGRUFT `{x:584,y:72}`) und die `heart`-Truhe → das Boss-Portal bleibt für immer VERSCHLOSSEN. Kein Test fängt das (check_boss injiziert den Schlüssel von Hand, `check_boss_slice3.mjs:169`).
*Fix:* Registrierung NICHT aus Events, sondern nach `updateProps` direkt aus der props-Liste (`p.kind==='chest' && p.opened` → Schlüssel `${currentMapKey}:${p.x+p.w/2},${p.y+p.h/2}`, identisch zur `propSpawns`-Koordinate, props.js bleibt unangetastet); `resetRun` muss `runFlags.openedChests = []` mitsetzen und der additive Test genau das prüfen.

**B6 — §4.3 ist sachlich falsch: `player.god = true` zur Laufzeit boostet die Stats NICHT.**
Gemessen (`createPlayer`-Probe): normal `dmg 1 / speed 90`; `{god:true}` `dmg 10 / speed 126`; **nach `player.god = true; player.recalcStats()` weiterhin `dmg 1 / speed 90`**. Grund: `godBoost` schließt über `const god = opts.god === true` (`player.js:36,41-46,93`) — ein nachträgliches Feld erreicht sie nie (und `player` ist bei `player.js:51` noch in der TDZ, ein Lesen von `player.god` dort wirft). Korrekt ist nur die Unverwundbarkeit: `hurt()` liest `player.god` zur Laufzeit (`player.js:189`, gemessen: hp bleibt).
Zweitens frieren `const godMode` (`main.js:237`) und `createPlayer(spawn, {god: godMode})` (`main.js:309`) den Zustand ein — nach dem nächsten Kartenwechsel/Respawn wäre GOTT wieder aus.
*Fix:* Entweder 2 Zeilen in player.js sanktionieren (`let god` + in `recalcStats` `god = player.god === true;` — ?god=1-Verhalten bleibt bitgleich) und in main.js `let godMode`, oder §4.3 auf „GOTT = Unverwundbarkeit, kein Schadens-/Tempo-Boost" zurückschneiden und so deklarieren.

**B7 — §6.4 (Titel/Game-Over nur jeden 2. Frame rendern) macht die Flusstests rot; nur die Parität entscheidet.**
Bewiesen an der Probe: Drossel mit `__f%2===0` → grün; identische Drossel mit `__f%2===1` → `FEHLER: Titelbildschirm sichtbar`. Ursache: `ops.length = 0` je Frame (`check_main_slice1.mjs:110`), `frames(5); ok(hasText('GRIMLIGHT'))` liest NUR den letzten Frame — fällt der Render aus, ist das Protokoll leer. Gleiche Konstruktion in `check_inventory_slice2.mjs:222` und `check_boss_slice3.mjs:139`.
*Fix:* §6.4 streichen (P1, Nutzen gering, Risiko bewiesen) oder auf „rAF läuft, render() IMMER, nur `update` bei `state==='title'` verbilligen" begrenzen.

---

### MAJOR

**M1 — §5.7 schickt den Fixer an die falsche Datei: die harten Koordinaten-Assertions stehen im BESTANDS-Smoke, nicht in den Flusstests.**
`tools/smoke_test.mjs:1249-1256`: `inp.tap = {x:100, y:30}` → `ui.cursor === 0`; `inp.tap = {x:290, y:12}` → `'close'`. Die Flusstests prüfen im Inventar tatsächlich nur Text (`AUSRUESTUNG`, `berklinge`, exakt `'HERZ 3  SCHADEN 2  TEMPO 100%'`, `check_inventory_slice2.mjs:317-332`) und bedienen ANLEGEN per Taste.
*Fix:* Freigabe präzisieren: `ROW_H` 16→20 ist frei (Zeile 0 bleibt 26..46, Tap y=30 trifft), `BTN_CLOSE` 20→24 bei **unverändertem Anker (288,10)** ist frei (Tap 290,12 bleibt drin). Verschiebungen von `LIST_Y` oder des X-Ankers sind TABU; der Fixer greppt `smoke_test.mjs`, nicht die Flusstests.

**M2 — A4/§5.1 messen das falsche Objekt: Button A ist nur Deko, die reale Trefferzone ist die ganze rechte Hälfte; in der Gestenleiste liegt B.**
`input.js:183-193`: alles rechts von x=160, was nicht HUD-Box/W/B ist, ist Angriff — der gezeichnete A-Kreis (`hud.js:523-536` zeichnet AUS `input.touch.buttons`, es gibt also gar keine zweite Quelle) hat keine eigene Zone. A 24 px hochzuziehen ändert am Gestenleisten-Konflikt nichts; die einzige echte Zone dort unten ist B (`{x:252,y:156,r:12}` → Unterkante 168 = 12 interne px = 4,6 mm). Ungenannt bleibt außerdem die Kollision A↔W (`{x:284,y:106,r:14}`): heute 12,2 px Lücke, bei A auf y=140 nur noch 4,2 px.
*Fix:* Gates auf ZONEN umschreiben (B- und W-Kreis + Joystickfeld ≥ 24 px über der Canvas-Unterkante, Lücken B↔W und A-Kreis↔W ≥ 16 px), und den Gestenleisten-Schutz an §5.2 (Safe-Area-Letterbox) hängen, nicht an die A-Position.

**M3 — §6.1/6.2 „vorher aufzeichnen, nachher byte-gleich" ist im Ein-Phasen-Workflow nicht beweiskräftig.**
Wenn ENGINE in derselben Phase `lighting.js` ändert UND den Snapshot schreibt, beweist der Snapshot nichts (er kann aus dem geänderten Code stammen).
*Fix, konkreter Ablauf:* (1) Vor jeder lighting-Änderung erzeugt der **Integrator** `.tmp/snap_lightops.mjs` (Canvas-Stub-Muster wie `smoke_test.mjs:3100 ff.`), das für 3 fixe Setups den kompletten `fillRect`-Strom des Offscreens serialisiert und je einen sha256 druckt. (2) Diese 3 Konstanten kommen als `S4-GOLD`-Block ins Smoke — Muster `smoke_test.mjs:2145-2152` — und werden in einem EIGENEN Commit VOR der lighting-Änderung committet (Nachweis über `git log`). (3) ENGINE ändert danach; der Block muss ohne Anfassen grün bleiben.

**M4 — §7/`check_save_slice4.mjs`: „Reload → FORTSETZEN" ist im selben Prozess technisch unmöglich.**
`await import('../game/js/main.js')` liefert beim zweiten Mal das gecachte Modul — main.js läuft NICHT erneut, es gibt keinen zweiten Boot und damit keinen Ladepfad zu testen.
*Fix:* Zweiter Boot per Cache-Busting-Spezifizierer (`await import('../game/js/main.js?boot=2')`) und VORHER frische Stubs setzen (neues `window`/`rafQ`/`createdCanvases`, localStorage-Stub bleibt bestehen = simulierter Reload); die Untermodule (MAPS, Registry) bleiben dabei geteilt, das ist gewollt. Alternative: zweiter Node-Prozess mit datei-gestütztem Storage-Stub.

**M5 — §3.4 schließt die Gold-Farm nur halb und kollidiert mit der Sieg-Garantie.**
Die Siegtruhe entsteht NICHT aus `propSpawns`, sondern per `props.push(...createProps([{...tc(10,4)…}]))` (`main.js:342-344` beim Betreten mit `bossDead`, `main.js:511` beim Kill). Ein Filter „über die propSpawns-Liste" lässt sie unberührt → 8-12 Münzen + SIEG-Banner pro Wiedereintritt bleiben farmbar. Filtert man sie mit, stirbt die ausdrückliche Zusage „der Sieg bleibt nach Verlassen/Rueckkehr erreichbar" (`main.js:341`) und `check_boss_slice3.mjs:224-232` wäre bei einem zweiten Durchlauf betroffen.
*Fix:* Siegtruhe ausdrücklich von Registrierung und Filter ausnehmen und in §9 deklarieren (Bestandsverhalten, keine Regression durch Save).

**M6 — §4.1 „loop-Neustart-Schutz": `stop()/start()` erzeugt zwei rAF-Ketten.**
`loop.js:44-46` setzt nur `running=false`; ein bereits eingereihter Callback stirbt erst beim nächsten Aufruf. Wird `start()` vorher gerufen (`running=true`), läuft die alte Kette weiter UND `start()` reiht eine neue ein → doppelte Update-Rate. In den Flusstests wäre das sofort sichtbar (`frames()` erwartet genau einen Callback je Frame, `check_main_slice1.mjs:111`).
*Fix:* Loop gar nicht anhalten. Pause rein über `state === 'paused'` im Zustandsautomaten (rAF drosselt im Hintergrund ohnehin selbst, Landkarte B §2 belegt den geklammerten Akkumulator). Falls doch `stop/start`: Generationszähler in loop.js, und loop.js aus §8 „nur falls nötig" herausnehmen.

**M7 — Android-Zurück-Taste fehlt komplett (weder §2 noch §4).**
Capacitor 6 beendet die Activity, wenn die WebView nicht zurückgehen kann — ein Fehlgriff schließt Michaels App. Ob `pagehide`/`visibilitychange` dabei noch feuert, ist gerätespezifisch (kein Emulator hier, Landkarte A.2).
*Fix:* Entweder Back → Pause-Menü (`@capacitor/app` `backButton`-Listener, guarded) oder ausdrücklich deklarieren und in Michaels Anleitung als „Zurück beendet die App, Spielstand steht auf dem letzten Kartenwechsel" schreiben.

**M8 — A2 „Headless verifiziert: HTTP 200" ist über den Proxy nicht erreichbar.**
Landkarte A.2(c): ohne Cookie liefert der Proxy für Assets **401**, für Navigation **302**. Ein Agent kann nur `127.0.0.1:8125` prüfen. Zusätzlich: das Passwort in `~/.config/code-server/config.yaml` ist **tot** (Landkarte A.2), Michael braucht das Passwort aus der PID-1-Umgebungsvariable.
*Fix:* A2 aufteilen — headless verifiziert wird lokal (`curl -sI http://127.0.0.1:8125/app-debug.apk` → 200, Content-Length, octet-stream); der Proxy-Pfad ist Teil von Michaels Anleitung und wird erst durch A7 bestätigt. Anleitung muss den Passwort-Hinweis enthalten.

**M9 — §0.7/§8 „Icon-Grid in art/ ANS ENDE" darf NICHT in `SPRITES` landen.**
`check_gfx6_art.mjs:109` validiert jedes `SPRITES`-Grid (Zeilenbreiten, jedes Zeichen in PALETTE) — §0.9 verlangt diese Suite grün. Zusätzlich baut `buildAll(SPRITES)` (`main.js:50`) für jeden Key ein Canvas: ein 192er-Launcher-Icon würde beim Boot des Spiels sinnlos gerastert und wandert in die `MASK_REG`.
*Fix:* Eigenes Datenmodul `game/js/art/icon_app.js` (nicht in SPRITES/TILE_ART exportiert), 32×32 in PALETTE-Zeichen; `tools/render_icon.mjs` skaliert nearest-neighbour auf die mipmap-Größen (PNG per `node:zlib`, keine Abhängigkeit).

**M10 — §7/A3: der neue Flusstest liegt in `.tmp/` und ist damit gitignored und laut CLAUDE.md „wegwerfbar", obwohl er Abnahmekriterium ist.**
`.gitignore` enthält genau `.tmp/`; §0.9 („Hauptloop committet jeden grünen Stand") würde ihn nie erfassen.
*Fix:* `tools/check_save_slice4.mjs` statt `.tmp/` (kein Konflikt mit §0.1, er ist nicht kanonisch), oder in §9 deklarieren, dass die Abnahme an einer nicht versionierten Datei hängt.

**M11 — §7F-Neubauten: Importe sind der einzige echte Kollisionspunkt, Zähler/Marker nicht.**
Es gibt keinen Assertion-Zähler-Gate (nur `totalTicks >= 600`, `smoke_test.mjs:3886`), additive Blöcke sind unkritisch. Aber `import`-Zeilen stehen im Kopf (Zeilen 5-33) — sie zu erweitern ist eine BESTANDS-Änderung und widerspricht §0.4.
*Fix:* Neue Blöcke ausschließlich mit `await import(...)` INNERHALB des Blocks (etablierte Praxis: `smoke_test.mjs:2970, 3583, 3631`), Marker durchgängig `S4-§7F(a)`… — GP6 belegt bereits `§7F(a)`-`(n)`, eine Wiederverwendung macht die Protokolle mehrdeutig.

---

### MINOR

**m1 — Neue `fillText`-Züge dürfen bestimmte Teilstrings nie enthalten.** `check_inventory_slice2.mjs:161` setzt `sawSieg` bei JEDEM Frame (inkl. Titel), wenn irgendein Text `'SIEG'` enthält, und `:373` verlangt `!sawSieg` für den ganzen Fluss. Ebenso Sonden: `startsWith('GOLD')` (`check_main_slice1.mjs:124`), `'GAME OVER'`, `'GRIMLIGHT'`, `'x 0'`, `'AUSRUESTUNG'`, `'STUFE'`. Titel-Menü, Pause-Menü und FPS-Overlay müssen diese Präfixe meiden (kein „GOLD 240" in der FORTSETZEN-Zeile).

**m2 — Touch-Pause-Button und `confirm`.** Jeder `touchstart` setzt `input.confirm = true` (`input.js:165`), unabhängig von der Zone. Der Eintritt in `paused` muss über `enterState()` laufen (ruft `consumeConfirm()`, `main.js:395-399`), sonst schaltet WEITER im selben Frame wieder frei. Die neue Zone braucht außerdem ein Sichtbarkeits-Flag wie `hudBoxVisible` (`main.js:419`), sonst frisst sie im Titel/Game-Over Taps.

**m3 — A4-Joystickmaß ist geräteabhängig.** `joyRadius` entsteht aus `JOY_RADIUS_SCREEN / scale` (`input.js:150-154`), die Konstante ist BILDSCHIRM-px. „≥ 32 interne px" gilt nur bei Skalierung 2 (Referenzgerät). Gate in CSS-px/mm formulieren (40 → 64 CSS-px ≈ 12,2 mm) und im additiven Test die Referenz-Skalierung fest verdrahten.

**m4 — Vertragstext in `lighting.js:275` („PURE Funktion … KEIN Cache") muss mit §6.1 mitgeändert werden**, sonst widerspricht der Kopfkommentar dem Code; der Bestandstest „drei Aufrufe byte-gleich" bleibt vom Cache unberührt (deterministische LUT), also nur Kommentarpflege.

**m5 — `check_lighting_input_slice1.mjs` verdrahtet 252,156 / 288,148 hart** (`:91,:105`) und ist bereits rot (`workflows/GRAFIKPASS_6.md:49`). §0/§5.1 sollten das ausdrücklich nennen, damit der Fixer den Roteintrag nicht für seine eigene Regression hält.

**m6 — `tools/check_syntax.sh:23` prüft nur `game/js/**.js`.** Neue `tools/*.mjs`, `mobile/*.json` und die Build-Skripte laufen ungeprüft. Ein `node --check` für `tools/*.mjs` und ein `python3 -m py_compile` für `tools/serve_apk.py` in die Phase-2-Checkliste.

**m7 — §0.5 Toolchain:** die 2,1 GB liegen heute in `.tmp/slice4_probe/` (laut CLAUDE.md „wegwerfbar"). `setup_android_toolchain.sh` sollte vorhandene Bestände von dort übernehmen statt neu zu laden, und A1 („< 20 min kalt") sollte den Netz-Fall explizit nennen (gemessen: SDK 458 MB in 10 s, JDK 185 MB in 2 s — hält locker).

**m8 — §0.8:** `serve_apk.py` blockiert im Vordergrund; Spec sollte „nach Michaels Download stoppen" und eine Port-frei-Prüfung (`ss -ltn`) vor dem Start verlangen — 8123 läuft dauerhaft und darf nicht kollidieren.

---

### Was geprüft und in Ordnung ist (keine Befunde)

- **§0.2-Pflichtform reicht für den Storage selbst** — Variante B der Probe: `CHECK GRÜN (25 Assertions)`, Startpfad byte-gleich.
- **§3.3 Ein-Tap-Pfad:** ohne Storage kein Save → `main.js:433-437` bleibt unverändert; die Titel-Assertions prüfen nur `hasText('GRIMLIGHT')`, keine Auswahlgeometrie.
- **§3.4 vs. Golden-Hashes:** `geoHash` liest `def.propSpawns` direkt aus `MAPS` (`smoke_test.mjs:2164-2172`), nicht die gefilterte Liste — ein Filter VOR `createProps` (`main.js:339`) ist hash-neutral. **Bedingung:** `mapDef.propSpawns` darf nicht in-place mutiert werden (kein `splice`, keine Zuweisung).
- **Truhen in den Flusstests:** `check_inventory_slice2` öffnet die Bumerang-Truhe (`:234-240`), `check_boss_slice3` die Siegtruhe (`:224-232`) — beide betreten die Karte danach nicht erneut, ein Refill wird nirgends erwartet. `Math.random` ist in allen drei Tests konstant gestubbt, es gibt also auch keine RNG-Sequenz-Kopplung.
- **§5.1 „zwei Besitzer":** `hud.js:523-536` zeichnet aus `input.touch.buttons` — es gibt faktisch nur eine Quelle; die Sorge aus Landkarte-Risiko 5 trifft nur die (ungezeichnete) rechte-Hälfte-Angriffszone.
- **§3.1 save.js:** `items/save.js` → `world/maps.js` ist zyklusfrei und Node-importierbar; die `MAPS.TESTMAP`-Injektion der Flusstests (`check_inventory_slice2.mjs:109`) passiert vor dem main.js-Import, eine `mapKey ∈ MAPS`-Prüfung bleibt dort gültig.

---

**Bilanz:** 7 Blocker (Guard-Regel zu eng, §6.2 bricht Bestands-Smoke, LUT-Cache leckt, Save-Hook speichert hp 0 und überschreibt bei NEU, openedChests ohne Positionsquelle und ohne resetRun-Reset, GOTT-Boost wirkt zur Laufzeit nachweislich nicht, §6.4 macht die Flusstests rot), 11 Major und 8 Minor — die Spec ist in Struktur und Scope tragfähig, aber vor Baubeginn an §0.2, §3.2, §3.4, §4.3, §6.1, §6.2 und §6.4 nachzuschärfen.


---

# PRÜFER 2: Build/Mobile/Michael

LINSE 2 (BUILD/MOBILE/MICHAEL), Prüfling design/SPEC_SLICE_4.md Rev 1. Repo unberührt (`git status --short` leer), Port 8123 durchgehend HTTP 200, 8124 nicht benutzt, die Sandbox `.tmp/slice4_probe/` habe ich nach den Proben in den Ausgangszustand zurückgesetzt (AndroidManifest.xml diff-gleich zum Original, assets/public wieder aus `../../game`).

## BLOCKER

**B1 — §6.1 LUT-Cache wächst unbegrenzt und frisst genau das Handy, das er retten soll.**
`buildLut(l.x * 0.7 + l.y * 1.3)` (lighting.js:323) läuft für JEDES Licht im Culling-Fenster, und `lights` enthält die Spieler-Laterne (main.js:370 `lights.push(playerLight)`, Position aus main.js:293-295 = Spielermitte, float, ändert sich jeden Frame). Ein `Map<seed, Float32Array>` bekommt also mindestens einen neuen Eintrag pro Frame à 1028 Byte: ca. 62 KB/s, 3,7 MB/min, 220 MB/h.
Fix: LUT am Licht-Objekt memoisieren (`l._lut`, `l._lutX/_lutY`, Neubau nur bei Positionsänderung). Deckel ist damit die Zahl der Lichter (21), gespart werden 20 von 21 Neubauten. Alternativ Map mit Größendeckel plus explizitem Ausschluss der Laterne per Flag.

**B2 — §6.2 „runs als Zahlen-Puffer" bricht KANONISCHE Smoke-Assertions (Konflikt mit §0.4 „nur additiv").**
tools/smoke_test.mjs:3011-3070 prüft die Rückgabe von `lightRuns` als Objekt-Array (`run.h === 4`, x/w-Raster, `k ⊆ 0..12`, JSON.stringify-Vergleiche) und hält bei :3008-3009 ZWEI Ergebnisse (`voll`, `ohne`) gleichzeitig am Leben, ein Pool/Reuse verfälscht das erste.
Fix: öffentlichen Rückgabevertrag von `lightRuns` unverändert lassen, den Zahlen-Puffer als Opt-Pfad ergänzen (`{sink}`-Callback oder interne Zwillingsfunktion), den ausschließlich `createLighting().draw` (lighting.js:510) benutzt.

**B3 — §4.3 GOTT-Toggle ist mit „player.js bleibt unangetastet" nicht implementierbar; die Spec-Begründung ist sachlich falsch.**
player.js:36 `const god = opts.god === true;` ist eine Closure-Konstante. `godBoost` (player.js:41-42) und damit `recalcStats` (player.js:93) lesen NICHT `player.god`. Ein Laufzeit-`player.god = true` schaltet nur `hurt()` (player.js:189), Schaden x10 und Tempo x1,4 bleiben aus, Abschalten wirkt auf Stats nie. Ein Umbau in player.js scheitert zusätzlich an der TDZ (godBoost läuft in :51, `player` existiert erst ab :57).
Fix: beim Umschalten den Spieler in main.js neu bauen: `createPlayer({x,y},{god:neu})` plus die als FEST kommentierte carry-Reihenfolge (main.js:314-319, inv/prog → recalcStats → hp/gold/potions), Welt bleibt stehen. `godMode` muss dafür von `const` (main.js:237) auf `let`. Transientes (Timer/Invuln/attackId) wird zurückgesetzt, das deklarieren.

**B4 — §4.4 Fullscreen/orientation.lock ohne Pflicht-Guardform macht alle drei Flusstests rot (§0.1).**
Die Stubs haben kein `document.documentElement`, kein globales `screen`, kein `matchMedia` (check_main_slice1.mjs:64-83, gleichlautend check_inventory_slice2.mjs:76-95, check_boss_slice3.mjs:76-92), und der Titel-Confirm-Pfad (main.js:433-437) wird in allen drei Tests durchlaufen. `screen?.orientation` hilft nicht, ein undeklarierter Bezeichner wirft trotzdem ReferenceError.
Fix: Guard als Pflichtform wie §0.2 in die Spec schreiben: `typeof screen !== 'undefined' && screen.orientation && typeof screen.orientation.lock === 'function'` sowie `document.documentElement && document.documentElement.requestFullscreen`, Rückgabe nur dann als Promise behandeln, wenn `typeof p.then === 'function'`, alles zusätzlich in try/catch.

## MAJOR

**M1 — §3.4 Der Truhen-Fix hat keine Datenquelle; „(Event existiert, props.js:64-100)" stimmt nicht.**
Die Events tragen keine Identität: props.js:77 `{type:'weapon_found'}`, :84 `'key_found'`, :90 `'heart_found'`, :100 `'chest_opened'`, kein mapKey, keine Kachel. Die Gold-Truhe, also genau der Farm-Fall, pusht bei props.js:91-95 überhaupt kein Event.
Fix: in main.js nach dem Prop-Update die eigene `props`-Liste scannen (`p.kind === 'chest' && p.opened`) und `${currentMapKey}:${(p.x/16)|0},${(p.y/16)|0}` in runFlags registrieren. props.js bleibt damit wirklich unangetastet.

**M2 — §3.4 Filter darf `mapDef.propSpawns` nicht mutieren.**
main.js:332-334 warnt exakt davor („MAPS/mapDef werden NIE mutiert, sonst fehlt der Boss nach resetRun dauerhaft"). Ein In-place-Filter löscht die Truhen für den ganzen Prozess, auch nach NEU.
Fix: `createProps(mapDef.propSpawns.filter(...))` auf einer Kopie; den nach dem Filter gepushten Siegtruhen-Block (main.js:342-344) ausdrücklich ausnehmen.

**M3 — §3.2 und §3.3 widersprechen sich: „NEU löscht den Save erst beim ersten neuen Checkpoint" ist wirkungslos.**
`resetRun()` ruft sofort `buildWorld` (main.js:385-393), und §3.2 speichert am Ende von buildWorld. Der alte Stand ist mit dem NEU-Tap sofort weg, die Schutzzusage an Michael ist leer.
Fix: Save-Hook in buildWorld unterdrücken, wenn `carry === false`, und den ersten echten Checkpoint auf den ersten Kartenwechsel/Respawn legen. Sonst die Deklaration streichen.

**M4 — §6.4 Frame-Drosselung kollidiert frontal mit §0.1.**
Die Flusstests treiben genau einen rAF-Callback je `frame()` (check_main_slice1.mjs:109-115) und lesen die Ops EINES Frames: `frames(5); ok(hasText('GRIMLIGHT'))` in allen dreien (check_main:194-195, check_inventory:222-223, check_boss:139-140) und `frame(); ok(hasText('GAME OVER'))` (check_boss:254-255). Bei „nur jeder 2. Frame" ist `ops` auf dem gelesenen Frame leer, grün oder rot je nach Parität der Implementierung.
Fix: §6.4 streichen (Titel-Render ist billig) oder bindend auf „`render()` IMMER, nur `update()` überspringen" einschränken und das in die Spec schreiben.

**M5 — §5.2 Safe-Area ist auf Android wirkungslos, die Spec verkauft sie als Lösung des Gestenleisten-Problems.**
Das erzeugte Projekt läuft mit targetSdk 34 (android/variables.gradle) und Theme `Theme.AppCompat.DayNight.NoActionBar` (res/values/styles.xml), ohne edge-to-edge (`grep DecorFitsSystemWindows|fitsSystemWindows app/src/main` → null Treffer, MainActivity.java ist ein leerer BridgeActivity-Erbe). Die WebView liegt innerhalb der System-Insets, `env(safe-area-inset-*)` liefert 0.
Fix: env() als reine iOS-Versicherung deklarieren (iOS ist ohnehin out of scope), bindende Verteidigung ist §5.1 mit 24 internen px. JS darf env() nicht auslesen, `getComputedStyle` fehlt im Stub.

**M6 — §2.2 `cap add` beendet das Skript mit Exit 1, Patch-Mechanismus fehlt.**
Probe in der Sandbox: bei vorhandenem android/ liefert `cap add android` Exit-Code 1 („android platform already exists"), unter `set -e` ist der Build tot. Positiv belegt: der Patch ÜBERLEBT, ich habe `android:screenOrientation="sensorLandscape"` in `android/app/src/main/AndroidManifest.xml` eingespielt, danach `cap copy` und `cap sync` laufen lassen, die Zeile stand beide Male noch drin.
Fix: `[ -d android ] || npx cap add android`; Patch als Python-Idempotenz (`if 'android:screenOrientation' not in s:` und `s.replace('android:name=".MainActivity"', ..., 1)`) auf `mobile/android/app/src/main/AndroidManifest.xml`, nach `cap add`, vor `gradlew`. sed ist hier schlechter, weil das Attribut mehrzeilig eingefügt wird.

**M7 — cap MUSS mit cwd = mobile/ laufen, die Spec sagt kein Wort dazu.**
Probe: `cap copy android` aus dem Repo-Root und aus `android/` heraus scheitert beide Male mit „android platform has not been added yet", Capacitor löst Plattform UND webDir gegen das aktuelle Verzeichnis auf. webDir-Auflösung real verifiziert: mit `webDir: "../game"` und cwd `.tmp/slice4_probe` landete `.tmp/game/marker.txt` in `assets/public/`. Für `mobile/` am Repo-Top-Level ist `../game` also korrekt (der Sandbox-Beleg `../../game` gehört zur Sandbox-Tiefe, kein Widerspruch).
Fix: in build_apk.sh explizit `cd "$ROOT/mobile"` vor jedem cap-Aufruf, in mobile/README.md festhalten.

**M8 — §0.7 Launcher-Icon: nur `mipmap-*/ic_launcher.png` zu schreiben ändert auf Android 8+ NICHTS.**
`res/mipmap-anydpi-v26/ic_launcher.xml` ist ein adaptive-icon und zeigt auf `@mipmap/ic_launcher_foreground` plus `@color/ic_launcher_background` (res/values/ic_launcher_background.xml, heute #FFFFFF).
Fix: render_icon.mjs schreibt `ic_launcher.png`, `ic_launcher_round.png` UND `ic_launcher_foreground.png` in allen fünf Dichten (48/72/96/144/192, Foreground als 108dp-Äquivalent mit 66-Prozent-Sicherheitszone) und der Patch setzt `ic_launcher_background` auf eine Grimlight-Farbe. PNG ohne Abhängigkeit über `node:zlib.deflateSync` plus eigene CRC32-Chunks, das gehört als Mechanismus in §0.7.

**M9 — §2.2 Toolchain ist nicht reproduzierbar gepinnt.**
Die Sandbox hat `jdk-17.0.20+8` (`java -version`), gezogen über den Adoptium-„latest"-Pfad. In wenigen Wochen ist das 17.0.21, und ein fest verdrahtetes `JAVA_HOME=toolchain/jdk-17.0.20+8` (so in .tmp/slice4_probe/README.md) zeigt ins Leere: A1 „reproduzierbar" ist dann verletzt.
Fix: Adoptium-Release exakt pinnen (`/v3/binary/version/jdk-17.0.20%2B8/linux/x64/jdk/hotspot/normal/eclipse`) plus sha256-Prüfung, oder JAVA_HOME per Glob `toolchain/jdk-17*/` auflösen. cmdline-tools über die versionierte Zip (Sandbox: Pkg.Revision 12.0) mit sha256, platform-tools ist immer latest (Sandbox: 37.0.1), das deklarieren.

**M10 — Android-Zurück-Taste beendet die App sofort, in der Spec kommt sie nicht vor.**
In @capacitor/android 6.2.1 gibt es kein `onBackPressed`/`OnBackPressedCallback`/`backButton` (grep über `capacitor/src/main/java/com/getcapacitor/*.java`: null Treffer). BridgeActivity erbt das Default-Verhalten: Back beendet die Activity, WebView weg, `pagehide` (§4.1) ist dabei nicht verlässlich. Michael verliert alles seit dem letzten Kartenwechsel, mitten im Bosskampf.
Fix: entweder `@capacitor/app` 6.x pinnen und `App.addListener('backButton', ...)` auf Pause plus Save legen, oder in §9 hart deklarieren „Zurück beendet die App, Fortschritt bis zum letzten Checkpoint".

**M11 — Zwei getrennte Spielstände sind garantiert, und §2.3 nennt das falsche Schema.**
Capacitor-Default ist `androidScheme = "https"` (Bridge.java:91 `CAPACITOR_HTTPS_SCHEME = "https"`, CapConfig.java:39), der App-Origin ist also `https://localhost`, nicht `http://localhost`. Michaels Browsertest läuft unter `https://code.srv1457801.hstgr.cloud/proxy/8123/`.
Fix: §2.3 korrigieren und in der Anleitung ausdrücklich schreiben, dass App-Spielstand und Browser-Spielstand zwei verschiedene Stände sind. Sonst meldet er „mein Fortschritt ist weg" als Bug.

**M12 — A4 Einheitenfalle beim Joystick, der Builder baut sonst einen dreifach zu großen Stick.**
„Skalierung 6" ist die GERÄTEpixel-Skalierung (main.js:38-44). input.js:150 rechnet aber `scale = r.width / VIEW_W` in CSS-px, auf dem Referenzgerät also 2. Daher `joyRadius = 40/2 = 20` interne px = 7,6 mm (touch_probe.mjs Abschnitt F).
Fix: A4 auf „CSS-px je internem px = 2 auf dem Referenzgerät" umstellen und den Zielwert direkt nennen: `JOY_RADIUS_SCREEN = 64` (CSS-px) ergibt 32 interne px = 12,1 mm.

## MINOR

**m1 — §5.1 A hoch schieben drückt A gegen W.** A(288,148) r16 und W(284,106) r14 (input.js:75-79) haben heute 12,2 px Luft, mit A-Unterkante auf 156 nur noch 4,2 px. A4 kennt kein A↔W-Gate, W ist ab Bumerang sichtbar. Viertes Gate „A↔W ≥ 12 px" aufnehmen und W versetzen.

**m2 — §5.3 Zielimplementierung fehlt.** Konkret: Flex-Zentrierung raus (style.css:18-22), `#game { position: absolute }`, und in resize() (main.js:37-45) zusätzlich `left = Math.round((innerWidth*dpr - scale*VIEW_W)/2)/dpr` und `top` analog, mit mindestens 4 Nachkommastellen ausgeben (Blink rastert auf 1/64 CSS-px). Beseitigt die 49,5 Geräte-Pixel Rand (touch_probe.mjs Abschnitt G).

**m3 — §4.4 Fullscreen bricht Michaels Desktop-Flow auf 8123.** requestFullscreen am Titel-Confirm schaltet auch seinen PC-Browser ins Vollbild (ESC nötig), `screen.orientation.lock` wirft dort zusätzlich NotSupportedError. Zudem läuft der Confirm nicht im Event-Handler, sondern in update() im rAF (main.js:434, loop.js:33), die transiente Nutzeraktivierung hält nur wenige Sekunden. Fix: Fullscreen und Lock nur versuchen, wenn `input.touch.active === true`.

**m4 — §5.4 Hochformat-Hinweis braucht denselben Guard:** `window.matchMedia` fehlt in allen drei Stubs. Rein per CSS-Media-Query lösen (Overlay-Div über dem Canvas), kein JS-Zugriff.

**m5 — §2.2 Lockfile-Herkunft fehlt.** `ci` verlangt eine zu package.json passende Lockdatei, die Sandbox-Datei stammt aus `npm install`, heißt `slice4_probe` und benutzt `^6.2.1`-Ranges statt Pins. Fix: einmalig `cd mobile && corepack npm@10.9.2 install` mit exakten Versionen ohne Caret, Lock committen, danach nur noch `ci`. Gemessen: `corepack npm@10.9.2 ci` läuft in 1,5 s (Probe im Scratchpad, Exit 0), braucht aber jedes Mal Registry oder ~/.npm. Im Skript besser `[ -d node_modules ] || corepack npm@10.9.2 ci`.

**m6 — COREPACK_HOME ist NICHT nötig, geprüft:** `COREPACK_HOME=<leeres Verzeichnis> corepack npm@10.9.2 --version </dev/null` → 10.9.2, kein Prompt, kein TTY nötig (corepack 0.24.0). Aber die Landkarte empfiehlt am Ende `rm -rf ~/.cache/node/corepack`, danach ist der erste Build netzabhängig. Eine Zeile „Kaltstart braucht Netz (registry.npmjs.org, dl.google.com, api.adoptium.net, services.gradle.org)" plus vorsorglich `COREPACK_ENABLE_DOWNLOAD_PROMPT=0` in build_apk.sh.

**m7 — .gitignore-Reihenfolge.** Heute steht dort nur `.tmp/` (eine Zeile). `toolchain/`, `mobile/android/`, `mobile/node_modules/` müssen VOR dem ersten Build eingetragen sein, sonst zieht ein `git add -A` 2,1 GB ins Repo. In §8 Phase 1 als erste Aufgabe festnageln.

**m8 — Statusleiste bleibt in der App sichtbar.** Theme `Theme.AppCompat.DayNight.NoActionBar` ohne `windowFullscreen` (res/values/styles.xml), Capacitor blendet nichts aus. Michael sieht Uhr und Akku über dem Spiel, und die nutzbare Höhe sinkt (kann Skalierung 5 statt 6 bedeuten). Fix: im selben Patch-Schritt `<item name="android:windowFullscreen">true</item>` ergänzen. §2.1 „die EINZIGE dauerhafte Anpassung" stimmt dann nicht mehr, es sind drei (Manifest, styles.xml, Icons).

**m9 — §5.6 manifest.json ohne Icons ist nicht installierbar** und §0.7 verbietet Binärdateien im Repo. Entweder data:-URI-Icon im Manifest oder render_icon.mjs erzeugt zusätzlich ein gitignoriertes `game/icon-512.png`; §0.5 („game/ ist die Quelle") muss das dann ausdrücklich erlauben.

**m10 — §6.3/§4.1 Detektor-Randbedingung fehlt.** fillText ist unkritisch (die Tests lesen nur `.includes`), aber ein Panel-Hintergrund darf nicht 320×180 groß, `#000` und 0<alpha<1 sein, das IST der Fade-Detektor (check_main_slice1.mjs:158-162). main.js:991-993 macht für das Inventar exakt so einen Vollbild-Dimmer, das Muster liegt also nahe. Als harte Regel in §4.1 und §6.3 aufnehmen.

**m11 — Mindest-WebView statt minSdk.** `minSdkVersion = 22` (android/variables.gradle) verspricht Android 5.1, das Spiel braucht `?.`/`??` (enemies.js:225-226, 466) also WebView 80+ und ES-Module also 61+. Auf einem alten Gerät gibt es einen schwarzen Bildschirm statt einer Fehlermeldung. Fix: minSdk auf 24 heben oder „WebView 80+" in §9 deklarieren, Michaels Gerätemodell vorab abfragen.

**m12 — A2 Anleitung, was Michael wirklich braucht (aus seiner Sicht durchgespielt):**
- URL exakt: `https://code.srv1457801.hstgr.cloud/proxy/8125/app-debug.apk` (aus `VSCODE_PROXY_URI`, das Präfix wird vom Proxy gestrippt, Landkarte A.2).
- Login: DIE GLEICHE Adresse und DAS GLEICHE Passwort, mit dem er code-server am PC öffnet. Die Anleitung darf ihn NICHT auf `~/.config/code-server/config.yaml` schicken, das Passwort dort ist tot (Landkarte A.2, lebendig ist die PASSWORD-Env auf PID 1). Wir kennen es nicht, brauchen es nicht und dürfen es nicht ausgeben.
- Tipparbeit: QR-Code der URL im Terminal ausgeben, sonst tippt er 60 Zeichen auf dem Handy ab.
- Die Chrome-Zwischenschritte, die A2 verschweigt: „Dieser Dateityp kann dein Gerät schädigen, trotzdem laden", danach Play Protect „Unsichere App blockiert, trotzdem installieren", erst dann die Freigabe „Unbekannte Quellen" für Chrome bzw. die Dateien-App.
- Ablageort: `/storage/emulated/0/Download/app-debug.apk`, in der Dateien-App unter „Downloads".
- Der 8125-Server muss laufen, WÄHREND er tippt: serve_apk.sh detached starten (nohup plus PID-Datei) und den Stopp-Befehl mitliefern, sonst ist der Kanal zu, sobald die Agenten-Shell endet.

## Bilanz

Der Weg zum APK ist tragfähig und in der Sandbox nachgemessen, aber vier Punkte kippen den Slice, wenn sie so gebaut werden wie geschrieben (LUT-Cache-Leck, runs-Puffer gegen die kanonische Smoke-Suite, GOTT-Toggle gegen „player.js unangetastet", ungenaue Fullscreen-Guards), und zwölf weitere Lücken kosten entweder einen roten Testlauf oder Michael den erfolgreichen Gerätetest.