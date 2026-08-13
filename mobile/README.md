# mobile/ — Capacitor-Wrap für Grimlight (Slice 4)

Hier liegt der Android-Wrap. Das Spiel selbst bleibt unverändert in `game/`;
`webDir` zeigt direkt dorthin. **Es gibt kein `www/`-Spiegelverzeichnis und
keine Kopie des Spiels im Repo.**

---

## Was hier committet ist (Spec §0.5)

| Datei | Inhalt |
|---|---|
| `capacitor.config.json` | appId `de.grimlight.app`, appName `Grimlight`, `webDir: "../game"` |
| `package.json` | Abhängigkeiten mit **exakten** Versionen, ohne Caret |
| `package-lock.json` | einmalig aus `corepack npm@10.9.2 install` erzeugt, danach nur noch `ci` |
| `README.md` | diese Datei |

**Nicht** im Repo (steht in `.gitignore`, zusammen rund 1,9 GB):
`mobile/android/`, `mobile/node_modules/`, `toolchain/`.
Beides entsteht reproduzierbar aus den beiden Skripten unten.

## Versions-Pins

```
@capacitor/core     6.2.1     @capacitor/cli      6.2.1
@capacitor/android  6.2.1     @capacitor/app      6.0.3   (Zurück-Taste, §4.5)
AGP 8.2.1 · Gradle-Wrapper 8.2.1 · Kotlin 1.9.10
compileSdk/targetSdk 34 · minSdk 22 (Android 5.1)
JDK Temurin 17.0.20+8 · cmdline-tools 12.0 · build-tools 34.0.0
```

`platform-tools` ist als einziges Paket **nicht** gepinnt: Google bietet dafür
keine versionierte URL an (deklariert, Spec §9). Im aktuellen Stand: 37.0.1.

---

## Bauen

```sh
bash tools/setup_android_toolchain.sh   # einmalig, legt toolchain/ an
bash tools/build_apk.sh                 # baut das APK
python3 tools/serve_apk.py              # liefert es auf Port 8125 aus
```

Ergebnis: `mobile/android/app/build/outputs/apk/debug/app-debug.apk` (~3,8 MB).
Gemessen: kalt (mit vorhandener Toolchain) 42 s, inkrementell 14 s.
Ein echter Kaltstart ohne Toolchain braucht Netz zu vier Hosts:
`api.adoptium.net`, `github.com`, `dl.google.com`, `services.gradle.org`.

Beide Skripte sind **idempotent**: ein zweiter Lauf lädt nichts nach, patcht
nichts doppelt und liefert dasselbe Ergebnis.

### npm gibt es hier nur über corepack

`npm` und `npx` existieren in dieser Umgebung nicht, `corepack enable`
scheitert an fehlenden Schreibrechten in `/usr/bin`. Deshalb **immer gepinnt**:

```sh
COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack npm@10.9.2 ci
```

Ein blankes `corepack npm` zieht npm 12, das Node 20 ablehnt.
Die Capacitor-CLI wird direkt über `mobile/node_modules/.bin/cap` aufgerufen,
nicht über `npx`.

### cwd muss `mobile/` sein

Capacitor löst **Plattform und webDir gegen das aktuelle Verzeichnis** auf.
Aus dem Repo-Root oder aus `android/` heraus scheitert jeder `cap`-Aufruf mit
`android platform has not been added yet`. `tools/build_apk.sh` wechselt
deshalb vor jedem `cap`-Aufruf nach `mobile/`.

`cap add android` liefert bei bereits vorhandenem `android/` Exit-Code 1. Das
Skript ruft ihn nur bei fehlendem Verzeichnis auf (`[ -d android ] || …`).

---

## Die drei dauerhaften Anpassungen am erzeugten Projekt

`mobile/android/` wird von `cap add android` aus Vorlagen erzeugt und ist
nicht versioniert. Drei Dinge muss der Build jedes Mal nachziehen. Alle drei
sind **idempotente Python-Patches** in `tools/build_apk.sh` (kein `sed`, weil
das Manifest-Attribut mehrzeilig eingefügt wird), und alle drei überleben
`cap copy` und `cap sync` (in der Sandbox nachgemessen).

**1. Querformat** in `android/app/src/main/AndroidManifest.xml`

```xml
android:screenOrientation="sensorLandscape"
```

am `MainActivity`-Eintrag. `sensorLandscape` erlaubt beide Querformat-Lagen,
sperrt aber Hochformat. Im Hochformat wäre Button A nur 6,0 mm groß und das
Spiel praktisch unbedienbar.
Nachweis im APK: `aapt dump xmltree app-debug.apk AndroidManifest.xml` zeigt
`android:screenOrientation(0x0101001e)=(type 0x10)0x6` (6 = sensorLandscape).

**2. Vollbild** in `android/app/src/main/res/values/styles.xml`

```xml
<item name="android:windowFullscreen">true</item>
```

in **beiden** Themes: `AppTheme.NoActionBar` (das setzt `BridgeActivity` zur
Laufzeit, `BridgeActivity.java:25-26`) und `AppTheme.NoActionBarLaunch` (das
Start-Theme). Ohne das stehen Uhr und Akku über dem Spiel und die nutzbare
Höhe sinkt, was auf dem Referenzgerät Skalierung 5 statt 6 bedeuten kann.

**3. Icon** — `android/app/src/main/res/values/ic_launcher_background.xml`
bekommt das Grimlight-Dunkelgrün `#1a2a1b`, und `tools/render_icon.mjs`
schreibt fünfzehn PNGs (drei Dateien mal fünf Dichten).

Die Vorlage liefert einen weißen Hintergrund; ab Android 8 zeigt
`res/mipmap-anydpi-v26/ic_launcher.xml` auf `@color/ic_launcher_background`
plus `@mipmap/ic_launcher_foreground`. Nur `ic_launcher.png` zu ersetzen
ändert dort nichts, deshalb schreibt der Renderer alle drei Namen:

```
ic_launcher.png / ic_launcher_round.png    48 /  72 /  96 / 144 / 192  (48dp)
ic_launcher_foreground.png                108 / 162 / 216 / 324 / 432  (108dp)
```

Die Vordergrund-Ebene eines adaptiven Icons ist per Android-Definition 108dp
groß, davon sind nur die inneren 72dp garantiert sichtbar. Das Motiv wird
deshalb in ein zentriertes 66-Prozent-Quadrat gerendert. Die Kantenlängen sind
identisch zu denen der Capacitor-Vorlagen, die Dateien werden also maßhaltig
ersetzt.

Quelle des Icons ist **Text, kein Binärasset**: `game/js/art/icon_app.js` ist
ein 32×32-Pixel-Grid in PALETTE-Zeichen (Fackel), genau wie `art/sprites.js`.
Es ist bewusst **nicht** Teil von `SPRITES`/`TILE_ART` (dort würden die
Grid-Maß-Prüfungen anschlagen und `buildAll` würde es bei jedem Spielstart
sinnlos rastern) und wird von keinem Spielmodul importiert. Einziger Leser ist
`tools/render_icon.mjs`, das PNG ohne jede Abhängigkeit über
`node:zlib.deflateSync` und selbst gerechnete CRC32-Chunks schreibt.

---

## Zwei getrennte Spielstände (Spec §2.3)

Capacitor benutzt als Standard `androidScheme = "https"`, der App-Origin ist
also **`https://localhost`**. Michaels Browsertest läuft unter
`https://code.srv1457801.hstgr.cloud/proxy/8123/`. Das sind zwei verschiedene
Origins, und `localStorage` hängt immer am Origin:

> **App-Spielstand und Browser-Spielstand sind zwei getrennte Stände.**

Das steht so auch in `tools/ANLEITUNG_APK.md`, sonst meldet Michael
"mein Fortschritt ist weg" als Fehler.

---

## Ausliefern aufs Gerät

Ein Emulator existiert hier nicht (`/dev/kvm` fehlt, keine Virtualisierung),
ADB scheidet aus (das Handy hängt nicht am USB dieses Servers). Der Weg ist
ein Download über die HTTPS-Weiterleitung:

```sh
nohup python3 tools/serve_apk.py > .tmp/serve_apk_8125.log 2>&1 &
echo $! > .tmp/serve_apk_8125.pid
curl -sI http://127.0.0.1:8125/app-debug.apk    # 200 + octet-stream + Länge
kill "$(cat .tmp/serve_apk_8125.pid)"           # nach Michaels Download
```

Port 8125 ist der Auslieferungs-Port, **8123 wird nie angefasst**. Der Server
liefert `application/octet-stream` statt des geratenen APK-Mimetyps, weil das
in Chrome der zuverlässige Download-Auslöser ist. Michaels Anleitung:
`tools/ANLEITUNG_APK.md`.

---

## Was NICHT geht (deklariert)

* **iOS ist außer Reichweite**: braucht macOS und Xcode.
* **Kein Emulator, kein Headless-Chrome**: das APK lässt sich hier bauen, aber
  nicht ausprobieren. Die Abnahme läuft über Michaels Gerät.
* **Debug-Zertifikat**: die App ist mit dem Android-Standard-Testzertifikat
  signiert, nicht Play-Store-tauglich. Für einen Release-Build bräuchte es
  einen eigenen Keystore (`keytool`/`apksigner` liegen in der Toolchain bereit).
