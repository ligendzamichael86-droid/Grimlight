# SPEC Slice 4 — "Mobile" (Rev 1, 13.08.2026, Fable)

Grundlage: design/SLICE4_LANDKARTE.md (beide Teile; Zahlen und
Datei:Zeile-Belege von dort sind bindend). Kernbefund: Das APK ist
IN DIESER UMGEBUNG baubar (End-to-End bewiesen, 3,9 MB, kalt 2m02s,
inkrementell 15s). Deliverable: **installierbares Android-APK mit
Save-System, Pause, Touch-Ergonomie und Geräte-Performance-Messung.**

**AUS SCOPE (deklariert):** iOS/TestFlight — braucht macOS+Xcode,
in dieser Umgebung unerreichbar; bleibt Fahrplan-Fernziel.
PWA — nur als Nebenprodukt (Manifest+theme-color, §5.6), KEIN
Service Worker in diesem Slice.

---

## §0 Eiserne Regeln

0.1 **Kanonische Flusstests: NULL Änderungen — diesmal ohne jede
Ausnahme.** Kein sanktioniertes Kontingent. Die Stubs haben KEIN
localStorage (check_main:60-67 u. a.) — daraus folgt 0.2.

0.2 **Storage-Guard (Pflichtform, Landkarte B §3):** Storage wird
AUSSCHLIESSLICH in main.js angefasst, exakt so:
`const store = (() => { try { return window.localStorage || null; }
catch { return null; } })();` — und OHNE Storage ist der Startpfad
byte-gleich zum Bestand (Titel → resetRun). Das try ist Pflicht
(WebView-SecurityError bei blockierten Cookies).

0.3 **Node-Importierbarkeit** bleibt: das neue Save-Modul ist rein
(kein window/document/Storage), nur main.js verdrahtet. **Kein
Canvas-Erzeugen** in neuen Modulen vor/zwischen dem Sprite-Bau
(Canvas→Name-Mapping der Flusstests; neue Canvases nur nach
main.js:71, besser: gar keine).

0.4 Golden-Hashes sol/geo NULL. Smoke NUR additiv (GP6-§7F-Muster,
Marker `S4-§7F`). entities/ TABU. God-Mode-?god=1-Verhalten im
Browser unverändert (probe_god bleibt grün).

0.5 **Repo-Disziplin:** Neues Top-Level `mobile/` (Capacitor) —
COMMITTET werden nur `mobile/capacitor.config.json`,
`mobile/package.json`, `mobile/package-lock.json` und
`mobile/README.md`; `mobile/node_modules/` und `mobile/android/`
kommen in .gitignore (Build-Produkte). Neues Top-Level
`toolchain/` (JDK+SDK, ~2,1 GB) komplett in .gitignore; Aufbau aus
.tmp/slice4_probe/README.md reproduzierbar via
`tools/setup_android_toolchain.sh`. game/ bleibt die Quelle:
`webDir: "../game"` — KEIN Spiegelverzeichnis (Landkarte A §3).

0.6 **npm NUR gepinnt** (Landkarte A: bloßes `corepack npm` zieht
ein inkompatibles npm 12): alle Aufrufe als `corepack npm@10.9.2`.
`corepack enable` NIE ausführen (EACCES; und wir wollen nichts
Globales). Versionen gepinnt: Capacitor 6.2.1 (core/cli/android),
AGP 8.2.1, Gradle-Wrapper 8.2.1, SDK 34, minSdk 22.

0.7 **Icons ohne Regelbruch:** Das Launcher-Icon wird als
Pixel-Grid in game/js/art/ gepflegt (CLAUDE.md Regel 3) und beim
Build von `tools/render_icon.mjs` (Node, ohne Browser) zu PNGs in
die NICHT-committeten mipmap-Ordner gerendert. Keine Binärdatei im
Repo.

0.8 Port 8123 NIE; Agenten-Prüfserver 8124; **APK-Auslieferung an
Michael über Port 8125** (tools/serve_apk.py, Content-Type
application/octet-stream — Landkarte A: zuverlässigster
Chrome-Download-Auslöser).

0.9 Hauptloop committet jeden grünen Stand. KEINE GP6-Regression:
alle GP6-Suiten (inkl. check_gfx6_art) bleiben grün; die
GP6-Wackelkandidaten (Übergabe 13.08.) werden von diesem Slice
nicht berührt (keine Palette-/Licht-Wert-Änderungen — die
Perf-Hebel §6 sind pixel-beweispflichtig).

---

## §1 ABNAHME

A1 **Build reproduzierbar:** `bash tools/build_apk.sh` erzeugt aus
sauberem Stand ein installierbares Debug-APK (< 20 min kalt,
< 2 min inkrementell); Skript setzt alle Env-Variablen selbst
(JAVA_HOME/ANDROID_HOME/GRADLE_USER_HOME → toolchain/).

A2 **Auslieferung:** `bash tools/serve_apk.sh` (Wrapper um
serve_apk.py, baut vorher) + gedruckte Schritt-für-Schritt-
Anleitung für Michael (Handy-Login bei code-server, Download,
"unbekannte Quellen", Installation). Headless verifiziert: HTTP
200, korrekte Länge, octet-stream.

A3 **Save-System:** additive Tests grün (Rundlauf byte-gleich,
Schema-Validierung lehnt Fremdes ab → null, maxHp NIE
gespeichert, kaputtes JSON → null ohne Exception); Flusstests
unverändert grün (= Startpfad ohne Storage byte-gleich); neuer
additiver Flow-Test .tmp/check_save_slice4.mjs (Stub MIT
localStorage: Speichern beim Kartenwechsel, Laden am Titel,
FORTSETZEN/NEU-Menü, Respawn-Save) grün.

A4 **Ergonomie-Gates (rechnerisch, Referenzgerät 1080×2400 dpr 3
quer, Skalierung 6 — Formeln Landkarte B §1):** Button-A-Unterkante
≥ 24 interne px über Canvas-Unterkante (≥ 9 mm Abstand zur
Gestenleiste); Lücke A↔B ≥ 16 interne px (≥ 6 mm); Joystick-
Vollausschlag ≥ 32 interne px (≥ 12 mm); Buttons ≥ 9 mm bleiben.
Hochformat zeigt den Dreh-Hinweis (§5.4). Additiv getestet
(Geometrie ist pure Rechnung über input.js+hud.js-Konstanten).

A5 **Pause/Lifecycle:** visibilitychange/pagehide → Pause-State +
Auto-Save; Rückkehr zeigt Pause-Overlay (kein Kampf-Weiterlauf);
additiv getestet (headless: Event feuern, State prüfen).

A6 **Performance:** (a) LUT-Cache + Lauf-Puffer nachweislich
PIXEL-GLEICH (Op-Stream-Snapshot vor/nach an fixen Eingaben,
additiver Test) und Allokations-Rückgang gemessen; (b) FPS-Overlay
in der App (Pause-Menü-Toggle) zeigt Frame-Mittel/P95; (c) DIE
eigentliche Messung macht MICHAEL auf dem Gerät — Zielband:
stabil ≥ 55 fps auf seinem Handy in CATACOMBS; Zahlen kommen als
Rückmeldung, KEIN hartes Gate hier (VM-Zahlen sagen über Handys
nichts — Landkarte-Risiko 4).

A7 **Michaels Gerätetest ist die finale Abnahme:** installiert,
spielt alle 4 Karten, Save überlebt App-Kill, Pause funktioniert,
Steuerung bedienbar. Erst nach seinem Okay wird der Slice
abgenommen und übergeben.

---

## §2 PAKET M — Mobile-Wrap

2.1 mobile/: package.json (gepinnte deps), capacitor.config.json
(appId `de.grimlight.app`, appName `Grimlight`, webDir `../game`),
README (Build/Struktur). `cap add android` läuft im Build-Skript
(android/ ist Build-Produkt; die EINZIGE dauerhafte Anpassung
daran — `android:screenOrientation="sensorLandscape"` in
AndroidManifest.xml + Launcher-Icons — wird vom Build-Skript nach
`cap add`/`cap copy` per Patch-Schritt idempotent eingespielt und
in mobile/README.md dokumentiert).

2.2 tools/setup_android_toolchain.sh: JDK 17 (Adoptium) +
cmdline-tools + `yes | sdkmanager --licenses` + platform-tools +
android-34 + build-tools;34.0.0 nach toolchain/; idempotent;
Entpacken via `python3 -m zipfile` (kein unzip im System).
tools/build_apk.sh: Env setzen → `corepack npm@10.9.2 ci` →
`npx cap add android` (falls fehlt) → Manifest-/Icon-Patch →
`cap copy` → `./gradlew assembleDebug --no-daemon` → APK-Pfad
ausgeben. tools/serve_apk.py: Port 8125, octet-stream, loggt
Zugriffe.

2.3 **Capacitor-Rahmen:** ES-Module funktionieren über
http://localhost (Landkarte A §3); KEIN file://-Test. Query-
Parameter existieren in der App nicht → §4.3-Menü ersetzt
?god=1-Bedienung.

---

## §3 PAKET S — Save-System

3.1 **Neues Modul game/js/items/save.js** (rein, Node-importierbar):
`serialize(state) → string` und `deserialize(json) → obj|null`.
Schema v1: `{v:1, mapKey, spawn:{x,y}, hp, gold, potions, inv,
prog, runFlags:{bossDead, openedChests:[]}}`. deserialize prüft
HART (v===1, mapKey ∈ MAPS, Zahlenfelder endlich+Bereich, inv/prog
strukturell gegen items.js:75-83/progression.js:20-22) und liefert
bei JEDEM Verstoß null — nie werfen. **maxHp wird NIE gespeichert**
(abgeleitet; Lade-Reihenfolge = die als FEST kommentierte
carry-Reihenfolge main.js:310-320: inv/prog → recalcStats → hp).

3.2 **Hooks (nur main.js, God-Mode-Muster):** Speichern am Ende
von buildWorld (nach :374), nach Respawn-Bestätigung (:608-612)
und im pagehide-Handler (§4). Laden: einmal beim Boot in den
Titel-Zweig.

3.3 **Titel-Menü FORTSETZEN/NEU** (Landkarte-Risiko 2 — das ist
echte UI-Arbeit, kein Einzeiler): Existiert ein gültiger Save,
zeigt der Titel zwei Zeilen (FORTSETZEN vorausgewählt); Auswahl
per Hoch/Runter+Confirm (Tastatur) bzw. zwei großen Tap-Zonen
(≥ 9 mm); ohne Save exakt der heutige Ein-Tap-Start. NEU löscht
den Save erst beim ersten neuen Checkpoint (versehentliches
NEU-Tippen verliert nichts, solange man sofort zurückkehrt —
Deklaration). Menü-Logik als pure Funktion (titleMenu-Reducer) in
ui/ oder items/, additiv testbar; Zeichnung in hud.js.

3.4 **Truhen-Farm-Fix (runFlags.openedChests):** geöffnete Truhen
werden als "mapKey:tx,ty" registriert (Event existiert,
props.js:64-100) und bei buildWorld herausgefiltert — Vasen/Gegner
respawnen weiterhin (Bestandsverhalten, deklariert). Das schließt
die Save/Load-Gold-Farm (Landkarte-Risiko 6). Betroffen: main.js
(Filter + Registrierung); props.js bleibt UNANGETASTET (Filter
über propSpawns-Liste VOR der Erzeugung in main.js:329-339).

---

## §4 PAKET L — Lifecycle & Pause

4.1 Neuer State 'paused' (main.js-Zustandsautomat :239):
visibilitychange(hidden)/pagehide → wenn state 'playing':
Auto-Save + state 'paused'; rAF ruht ohnehin, zusätzlich
loop-Neustart-Schutz. Rückkehr: Pause-Overlay (dunkles Panel,
HUD-Sprache) — WEITER erst nach explizitem Tap/Taste.

4.2 Pause auch manuell: ESC/Tab-Nachbar? NEIN — Bestand: I/Tab ist
Inventar (Vollpause) und bleibt es; NEU ist nur der automatische
Pause-State + ein Touch-Pause-Button (kleines ❚❚ oben rechts neben
der Item-Box, ≥ 7 mm, input.js+hud.js im selben Besitz).

4.3 **Pause-Menü** (Touch-groß, 4 Zeilen): WEITER · NEUSTART
(zurück zum Titel, Save bleibt) · GOTT AN/AUS (ersetzt ?god=1 in
der App; wirkt sofort, wird NICHT gespeichert) · FPS AN/AUS
(Overlay §6.3). GOTT nutzt exakt die bestehende godBoost/
player.god-Mechanik (player.js bleibt unangetastet: main.js
setzt player.god + recalcStats-Pfad wie createPlayer-Option — 
prüfen: hurt() liest player.god zur Laufzeit ✓, Stats-Boost über
recalcStats mit gesetztem Flag — der Fixer verifiziert die
Wirkung headless).

4.4 Querformat: Manifest-Lock (sensorLandscape, §2.1); Browser-
Fallback: Fullscreen+orientation.lock im Titel-Confirm (guarded,
Fehler still); Hochformat-Fallback-Hinweis "Bitte Gerät drehen"
(CSS/Canvas-Overlay bei portrait, media query).

---

## §5 PAKET T — Touch & Darstellung

5.1 **Button-Geometrie** (input.js:75-79 UND hud.js:523-536 —
EIN Besitzer, Landkarte-Risiko 5): A-Unterkante 24 px über
Canvas-Unterkante, Lücke A↔B ≥ 16 px, B leicht versetzt
(Daumen-Bogen); Joystick-Vollausschlag 32 interne px, Basis
entsprechend; Werte als benannte Konstanten mit mm-Kommentar.

5.2 Safe-Area: style.css wertet env(safe-area-inset-*) aus
(Canvas-Zentrierung berücksichtigt bottom-Inset in Querformat);
viewport-fit=cover bleibt.

5.3 **Halbpixel-Fix** (Landkarte B 1.8): CSS-Größe UND Position
auf Gerätepixel runden (main.js:37-45 + Flex-Zentrierung durch
explizite Ränder ersetzen, die auf dpr-Raster liegen).

5.4 Hochformat-Hinweis §4.4. — 5.5 `input.touch.active` wird bei
Tastatur-Eingabe zurückgesetzt (input.js:164/hud.js:506).
5.6 index.html: manifest.json (name/icons/display fullscreen/
orientation landscape/theme_color) + theme-color-Meta —
Browser-Nebenprodukt, kein SW. 5.7 Inventar-Flächen: Zeilen ≥ 20
interne px, X-Button ≥ 24 px (inventory_ui.js:12-19; Layout-
Verschiebungen im Inventar sind erlaubt, Flusstests prüfen dort
Text-Ops, der Fixer verifiziert vorher per grep, WELCHE
Koordinaten die Tests lesen — falls harte Koordinaten-Assertions
bestehen: NICHT anfassen und als P2-Rest deklarieren).

---

## §6 PAKET P — Performance (pixel-beweispflichtig)

6.1 **buildLut-Cache** (lighting.js:263-273/:323): Map<seed,LUT>,
Seed hängt nur an x/y (gemessen 56 % der JS-Zeit, 26 Allokationen/
Frame). 6.2 **runs als Zahlen-Puffer** (lighting.js:370-376,
Muster warmEimer): minus ~1600 Objekte/Frame.
**Beweis für beide:** Op-Stream-Snapshot (Stub-Protokoll aller
draw-Aufrufe an 3 fixen Setups) VOR der Änderung aufzeichnen, als
additiver Smoke-Test einfrieren, NACH der Änderung byte-gleich —
plus die bestehenden §7F-Licht-Tests bleiben grün.
6.3 **FPS-Overlay** (Pause-Menü-Toggle): Frame-Zeit Mittel/P95
über rollierendes 120-Frame-Fenster, 2 Textzeilen oben links
unterm Panel, fillText (Detektor-unkritisch: Haupt-Canvas).
6.4 Statische States drosseln (Titel/GameOver: rAF weiter, aber
Update/Render nur jeden 2. Frame) — P1, nur wenn ohne Risiko.

---

## §7 TESTS

Kanonische Flusstests NULL (§0.1). Smoke ADDITIV (`S4-§7F`):
save-Rundlauf/Schema/Null-Pfade; titleMenu-Reducer; Geometrie-
Gates (A4-Rechnung); Pause-State headless; LUT-/Puffer-
Pixelgleichheit (Op-Stream-Snapshots); openedChests-Filter;
loop-60s-Sprung (loop.js ist injizierbar). NEU (additiv, nicht
kanonisch): .tmp/check_save_slice4.mjs — Flusstest-Stil MIT
localStorage-Stub (Szenario: Start→Katakomben→Save geschrieben→
Reload→FORTSETZEN→gleiche Karte/HP/Gold; NEU→frisch; Respawn-
Save; Truhe bleibt offen). check_gfx6_art unberührt.

## §8 BUILD-TOPOLOGIE (Opus, exklusiver Besitz)

Phase 1 parallel: **MOBILE** (mobile/, tools/setup_android_
toolchain.sh + build_apk.sh + serve_apk.py + render_icon.mjs,
.gitignore, Icon-Grid in art/ ANS ENDE) · **ENGINE** (game/js/
items/save.js, main.js, ui/hud.js, core/input.js, core/loop.js
[nur falls nötig], core/lighting.js §6, ui/inventory_ui.js §5.7,
index.html + css/style.css, manifest.json).
Phase 2: **INTEGRATOR** (Smoke-additiv, check_save_slice4, alle
Suiten grün, APK bauen, serve_apk verifizieren, Michael-Anleitung
schreiben). Phase 3: **MICHAEL-GERÄTETEST** (A7) → ggf. eine
Fix-Runde → Übergabe.

## §9 DEKLARATIONEN

iOS aus Scope; PWA ohne SW; NEU löscht Save erst am ersten neuen
Checkpoint; Vasen/Gegner respawnen weiter (nur Truhen persistent);
GOTT nicht im Save; Debug-Zertifikat (kein Play-Store-Release in
diesem Slice — Keystore/Release = Folgearbeit); 8px-monospace-
Plattformrisiko (P2-17, beobachten am Gerät); CLAUDE.md-Korrektur
"kein npm" erfolgt bei der Übergabe mit Verweis auf die Landkarte.
