# SPEC Slice 4 — "Mobile" (Rev 2, 13.08.2026, Fable)

Grundlage: design/SLICE4_LANDKARTE.md + adversarialer Review
design/SLICE4_SPEC_REVIEW.md (2 Prüfer, 11 BLOCKER / ~23 MAJOR —
ALLE eingearbeitet; Proben-Belege der Prüfer sind bindend).
Deliverable: **installierbares Android-APK mit Save-System, Pause,
Touch-Ergonomie und Geräte-Performance-Messung.**
AUS SCOPE: iOS/TestFlight (unerreichbar hier); PWA nur als
Manifest-Nebenprodukt OHNE Service Worker und OHNE Icons
(Manifest-Icons bräuchten Binärdateien im Repo — deklariert:
Browser-Variante ist damit nicht "installierbar", nur hübscher).

---

## §0 Eiserne Regeln

0.1 **Kanonische Flusstests: NULL Änderungen, keine Ausnahme.**

0.2 **ALLGEMEINE Guard-Pflicht (Review P1-B1 — der Storage-Guard
allein reicht nicht):** JEDER neue Browser-API-Zugriff in main.js
läuft geguardet: `typeof`-Prüfung + try/catch + Null-Fallback.
Die Stubs haben NUR: window {addEventListener, devicePixelRatio,
innerWidth/Height, location.search, requestAnimationFrame},
document {getElementById→IMMER das Canvas!, createElement,
addEventListener, defaultView, hidden}, canvas {width/height/
style/getContext/addEventListener/getBoundingClientRect/
ownerDocument}. Es gibt KEIN localStorage, matchMedia, screen,
navigator, document.body, documentElement, getComputedStyle.
Konsequenzen (bindend): Storage-Guard exakt in der §0.2-Form der
Landkarte; Hochformat-Hinweis + Safe-Area REIN in CSS/HTML
(statisches div in index.html + Media-Query — KEIN JS); §5.3 nur
über canvas.style + window.innerWidth/devicePixelRatio; §4.4-Guard
exakt: `typeof screen !== 'undefined' && screen.orientation &&
typeof screen.orientation.lock === 'function'` bzw.
`document.documentElement && document.documentElement.
requestFullscreen`, Promise nur bei `typeof p.then==='function'`,
alles in try/catch, und NUR wenn `input.touch.active === true`
(schützt Michaels Desktop-8123-Flow, Review P2-m3).

0.3 Node-Importierbarkeit; save.js rein; KEIN neues Canvas
(icon_app ist ein reines Datenmodul, §0.7). 0.4 sol/geo NULL;
Smoke NUR additiv, **Importe neuer Blöcke via `await import(...)`
IM Block** (Kopf-Importe sind Bestand; Review P1-M11), Marker
`S4-§7F(a)…`. entities/ TABU. probe_god bleibt grün.

0.5 **Repo:** ERSTE Aufgabe von Phase 1 ist .gitignore
(`toolchain/`, `mobile/android/`, `mobile/node_modules/` — sonst
zieht ein git add -A 2,1 GB; Review P2-m7). Committet in mobile/:
capacitor.config.json, package.json (EXAKTE Versionen ohne
Caret), package-lock.json (einmalig aus `corepack npm@10.9.2
install`, danach nur `ci`; Review P2-m5), README.md.
`webDir: "../game"` (für cwd mobile/ verifiziert, Review P2-M7).

0.6 npm nur als `corepack npm@10.9.2`, nie `corepack enable`,
`COREPACK_ENABLE_DOWNLOAD_PROMPT=0` im Skript. Pins: Capacitor
6.2.1 (+ **@capacitor/app 6.x** für die Zurück-Taste, §4.5), AGP
8.2.1, Gradle 8.2.1, SDK 34, minSdk 22. **Toolchain exakt
gepinnt** (Review P2-M9): JDK über die versionierte Adoptium-URL
(jdk-17.0.20+8) MIT sha256; JAVA_HOME per Glob `toolchain/jdk-17*`
auflösen; cmdline-tools als versionierte Zip mit sha256;
platform-tools ist "latest" (deklariert). Kaltstart braucht Netz
(4 Hosts, deklariert).

0.7 **Icon:** Datenmodul `game/js/art/icon_app.js` — NICHT in
SPRITES/TILE_ART (check_gfx6_art validiert SPRITES; buildAll
würde es rastern; Review P1-M9), 32×32 in PALETTE-Zeichen.
`tools/render_icon.mjs` (Node, PNG über node:zlib.deflateSync +
eigene CRC32-Chunks, keine Abhängigkeit) rendert nearest-neighbour
**ic_launcher.png, ic_launcher_round.png UND
ic_launcher_foreground.png in allen 5 Dichten** (48/72/96/144/192;
Foreground mit 66-%-Sicherheitszone) — nur PNGs zu schreiben
reicht auf Android 8+ nicht, das adaptive-icon-XML zeigt auf
foreground+background (Review P2-M8); der Patch-Schritt setzt
`ic_launcher_background` auf Grimlight-Dunkelgrün.

0.8 Ports: 8123 NIE; Prüfserver 8124; APK-Auslieferung 8125.
0.9 GP6-Suiten bleiben grün; Perf-Hebel §6 pixel-beweispflichtig.
0.10 Hauptloop committet jeden grünen Stand.

---

## §1 ABNAHME

A1 `bash tools/build_apk.sh` reproduzierbar (< 20 min kalt).
A2 **zweigeteilt** (Review P1-M8): headless lokal verifiziert
(`curl -sI http://127.0.0.1:8125/app-debug.apk` → 200 +
Content-Length + octet-stream); der Proxy-Weg gehört zu Michaels
Anleitung und wird durch A7 bestätigt.
A3 Save: additive Tests grün (Rundlauf, Schema-Ablehnung → null,
maxHp nie gespeichert, kaputtes JSON → null); Flusstests
unverändert grün; **tools/check_save_slice4.mjs** (committet,
nicht .tmp — Review P1-M10; localStorage-Stub; zweiter Boot per
Cache-Busting `import('../game/js/main.js?boot=2')` mit frischen
Stubs — Review P1-M4) grün.
A4 **Ergonomie-Gates auf ZONEN, Einheiten fix** (Review P1-M2 +
P2-M12: der gezeichnete A-Kreis ist Deko, die Trefferzone ist die
rechte Hälfte; auf dem Referenzgerät 1080×2400 dpr 3 quer gilt
1 interner px = 2 CSS-px = 0,38 mm… KORREKT: Skalierung 6
Gerätepixel = 2 CSS-px je internem px): (a) B-Kreis-, W-Kreis-
und Joystick-Feld-Unterkanten ≥ 24 interne px über der
Canvas-Unterkante; (b) Lücken B↔W ≥ 16 px und A-Kreis↔W ≥ 12 px
(W wird versetzt); (c) `JOY_RADIUS_SCREEN = 64` CSS-px
(= 32 interne px = 12,1 mm Vollausschlag); (d) Kreise ≥ 9 mm.
Additiv getestet (pure Rechnung input.js+hud.js).
A5 Pause: visibilitychange/pagehide → Pause + Auto-Save; Rückkehr
zeigt Overlay; headless additiv getestet. **Android-Zurück-Taste
→ Pause-Menü** via @capacitor/app-Listener (guarded; im Browser
inert) — sonst beendet Back die App (Review P2-M10).
A6 Perf: LUT-Memoisierung + interner Lauf-Puffer PIXEL-GLEICH
(S4-GOLD-Op-Stream-Verfahren §6.3) + FPS-Overlay; Geräte-Zahlen
von Michael (Ziel ≥ 55 fps CATACOMBS, kein hartes Gate).
A7 **Michaels Gerätetest = finale Abnahme** (installiert, spielt,
Save überlebt App-Kill, Pause + Zurück-Taste ok, Steuerung gut).

---

## §2 PAKET M — Mobile-Wrap

2.1 mobile/ wie §0.5. **Build-Skript-Ablauf (Review P2-M6/M7,
in der Sandbox verifiziert):** `cd "$ROOT/mobile"` vor JEDEM
cap-Aufruf; `[ -d android ] || npx cap add android`; danach
idempotenter **Python-Patch** (nicht sed) auf
`mobile/android/app/src/main/AndroidManifest.xml`
(`android:screenOrientation="sensorLandscape"` an der
MainActivity, nur wenn nicht vorhanden), auf
`res/values/styles.xml` (`android:windowFullscreen=true` —
sonst bleibt die Statusleiste sichtbar, Review P2-m8) und auf
`ic_launcher_background`; Patches überleben cap copy/sync
(verifiziert). Dann `npx cap copy android` →
`./gradlew assembleDebug --no-daemon`. **Drei dauerhafte
Anpassungen** (Manifest, styles, Icons) — in README dokumentiert.

2.2 tools/setup_android_toolchain.sh (Pins+sha256 §0.6,
idempotent, `python3 -m zipfile`); tools/build_apk.sh (Env aus
toolchain/, `[ -d node_modules ] || corepack npm@10.9.2 ci`);
tools/serve_apk.py (8125, octet-stream, Log).

2.3 **Origin-Wahrheit (Review P2-M11):** Capacitor-Default-Scheme
ist HTTPS → App-Origin `https://localhost`. **App-Spielstand und
Browser-Spielstand sind ZWEI getrennte Stände** — steht so in
Michaels Anleitung, sonst meldet er "Fortschritt weg" als Bug.

2.4 **Michaels Anleitung** (tools/ANLEITUNG_APK.md, von A7
benutzt): Handy-Browser → `https://code.srv1457801.hstgr.cloud/
proxy/8125/app-debug.apk` → Login mit DEMSELBEN Passwort, mit dem
er sich an dieser Code-Oberfläche anmeldet (NICHT das aus
config.yaml — das ist tot, Landkarte A.2; wir kennen sein
Passwort nicht und fragen nie danach) → Download → Antippen →
einmalig "unbekannte Quellen" erlauben → spielen. Hinweise:
Android ≥ 5.1; Zurück-Taste = Pause; App- und Browser-Spielstand
getrennt.

---

## §3 PAKET S — Save-System

3.1 save.js wie Rev 1 (Schema v1 inkl.
runFlags:{bossDead, openedChests:[]}; deserialize lehnt hart ab
→ null; maxHp nie; Lade-Reihenfolge = FESTE carry-Reihenfolge).

3.2 **Hooks (Review P1-B4 — NICHT in buildWorld! Dort sieht der
Respawn-Pfad hp=0 und der Titel-Start überschreibt):** Speichern
(a) nach vollzogenem Portal-Wechsel (nach main.js:449, Fade
fertig, Zustand komplett), (b) nach Respawn-Abschluss (nach :611,
hp=maxHp/deathToll gesetzt), (c) im pagehide/visibility-Pfad
(§4.1), (d) beim Zurück-Taste-Pausieren. Im resetRun-Pfad wird
NIE gespeichert.

3.3 Titel-Menü FORTSETZEN/NEU wie Rev 1; **Korrektur (Review
P2-M3):** die "NEU verliert nichts"-Zusage ist mit den 3.2-Hooks
automatisch echt (kein Hook feuert vor dem ersten
Kartenwechsel/Respawn des neuen Runs) — Deklaration bleibt.
Menü-Reducer pure + additiv getestet; ohne Storage ist der Titel
byte-gleich zum Bestand (Flusstests!).

3.4 **openedChests (Review P1-B5 + P2-M1/M2/M5):** Datenquelle
sind NICHT die Events (tragen keine Position; Gold-Truhe pusht
gar keins) — main.js scannt nach updateProps die props-Liste
(`p.kind==='chest' && p.opened` → `${mapKey}:${(p.x/16)|0},${(p.y/16)|0}`).
Filter über eine KOPIE von propSpawns (mapDef NIE mutieren —
Kommentar main.js:332-334). **Die Siegtruhe (main.js:342-344/:511
per push, nicht aus propSpawns) ist AUSGENOMMEN und ihr
Wiederauffüllen bleibt** (Bestandszusage "Sieg bleibt erreichbar";
deklariert). `resetRun` setzt openedChests = [] (sonst fehlt im
neuen Run die Boss-Schlüssel-Truhe → unlösbar). Additiver Test
prüft genau diese drei Punkte.

---

## §4 PAKET L — Lifecycle & Pause

4.1 Pause REIN über den Zustandsautomaten (`state 'paused'`) —
**loop.stop()/start() wird NICHT benutzt** (Doppel-rAF-Kette,
Review P1-M6); loop.js verlässt den Besitz-Umfang. Auto-Save nach
§3.2. Overlay mit HUD-Sprache.

4.2 Touch-Pause-Button ❚❚ (oben, ≥ 7 mm, input+hud ein Besitzer).

4.3 **GOTT-Toggle (Review P1-B6/P2-B3 — Laufzeit-Flag boostet
NICHT, godBoost ist Closure):** Umschalten baut den Spieler in
main.js NEU: `createPlayer({x,y},{god:neu})` + FESTE
carry-Reihenfolge (inv/prog → recalcStats → hp/gold/potions),
Welt bleibt stehen; `godMode` wird `let`; Transientes
(invulnTimer/attackTimer) startet frisch (deklariert). player.js
bleibt unangetastet. FPS-Toggle im selben Menü (§6.4).

4.4 Querformat: Manifest-Lock (§2.1); Browser-Fallback nur mit
der EXAKTEN §0.2-Guardform und nur bei input.touch.active;
Hochformat-Hinweis rein CSS (§0.2).

4.5 Zurück-Taste: @capacitor/app `App.addListener('backButton',…)`
→ Pause+Save; Import dynamisch/guarded, im Browser inert.

---

## §5 PAKET T — Touch & Darstellung

5.1 **Zonen-Geometrie nach A4** (Werte als Konstanten mit
mm-Kommentar; W versetzen für A↔W ≥ 12 px; input.js:75-79 UND
hud.js:523-536 ein Besitzer). Gestenleisten-Schutz = DIESE
Abstände; env(safe-area-*) ist reine iOS-Versicherung im CSS und
wird NIE aus JS gelesen (in der Android-WebView liefert env() 0 —
Review P2-M5).
5.2 CSS: statisches Rotate-Hinweis-div + Media-Query; Safe-Area
nur CSS. 5.3 **Halbpixel-Fix konkret (Review P2-m2):**
Flex-Zentrierung raus, `#game` absolut, resize() rechnet
left/top = `Math.round((innerWidth*dpr − scale*VIEW_W)/2)/dpr`
(≥ 4 Nachkommastellen) — nur canvas.style + window-Größen (§0.2).
5.4 `input.touch.active` bei Tastatur zurücksetzen.
5.5 **Inventar (Review P1-M1 — enge Grenzen!):** NUR
`BTN_ROW_H 16→20` (Anker fest) und `BTN_CLOSE 20→24` (Anker
(288,10) fest) sind test-frei; LIST_Y/X-Anker TABU; Fixer greppt
smoke, nicht nur Flusstests. 5.6 manifest.json OHNE Icons
(deklariert) + theme-color.

---

## §6 PAKET P — Performance (pixel-beweispflichtig)

6.1 **LUT-Memoisierung AM LICHT-Objekt** (`l._lut/_lutX/_lutY`,
Neubau nur bei Positionsänderung) — NICHT als wachsende Map
(Spielerlaterne/Drops erzeugen je Frame neue Seeds → 3,7 MB/min
Leck; Review P1-B3/P2-B1 identisch). Deckel = Lichtanzahl.
6.2 **Öffentlicher lightRuns-Vertrag UNVERÄNDERT** (Objekt-Array
— Bestands-Smoke liest r.h/r.x/JSON-Vergleiche; Review P1-B2/
P2-B2): interner Zwilling `lightRunsInto(buf,…)` nur für draw();
lightRuns() bleibt Wrapper.
6.3 **S4-GOLD-Verfahren (Review P1-M3):** VOR jeder
lighting-Änderung erzeugt der Integrator in Phase 0 die
Op-Stream-sha256 (3 fixe Setups) und committet sie als
S4-GOLD-Smoke-Block in einem EIGENEN Commit; ENGINE ändert
danach; der Block bleibt unangetastet grün.
6.4 FPS-Overlay (Pause-Menü, 2 fillText-Zeilen, 120-Frame-
Fenster). **Die Rev-1-Frame-Drosselung §6.4 ist GESTRICHEN**
(bricht Flusstest-Paritäten; Review P1-B7/P2-M4).

## §7 TESTS

Flusstests NULL. Smoke additiv `S4-§7F(a)…` (await-import im
Block): save-Rundlauf/Schema; titleMenu-Reducer; Zonen-Geometrie
A4; Pause headless; S4-GOLD; openedChests (inkl. resetRun-Reset +
Siegtruhen-Ausnahme); loop-60s-Sprung. tools/check_save_slice4.mjs
(committet) mit ?boot=2-Zweitboot.

## §8 BUILD-TOPOLOGIE (Opus, exklusiver Besitz)

**Phase 0 (Integrator, EIGENER Commit):** .gitignore + S4-GOLD-
Snapshot-Block (§6.3).
**Phase 1 parallel:** MOBILE (mobile/, tools/setup…+build_apk+
serve_apk+render_icon+ANLEITUNG_APK.md, art/icon_app.js) ·
ENGINE (items/save.js, main.js, ui/hud.js, core/input.js,
core/lighting.js §6.1/6.2, ui/inventory_ui.js §5.5, index.html,
css/style.css, manifest.json).
**Phase 2 (Integrator):** additive Tests + check_save_slice4 +
alle Suiten + APK-Build + 8125-Verifikation lokal.
**Phase 3:** Michael-Gerätetest (A7) → ggf. Fix-Runde → Übergabe.

## §9 DEKLARATIONEN

iOS aus Scope; PWA ohne SW/Icons; Siegtruhen-Refill bleibt;
Vasen/Gegner respawnen; GOTT nicht im Save, Toggle resettet
Transientes; App/Browser = zwei Spielstände; Debug-Zertifikat;
Zurück-Taste = Pause (mit @capacitor/app); platform-tools
"latest"; Kaltstart netzabhängig; 8px-monospace-Risiko;
CLAUDE.md-npm-Korrektur bei Übergabe.
