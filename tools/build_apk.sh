#!/usr/bin/env bash
# =============================================================================
# build_apk.sh — Grimlight als Android-Debug-APK. Slice 4 §2.1/§2.2.
# =============================================================================
# ABLAUF (in der Sandbox nachgemessen, Review P2-M6/M7):
#   1. Toolchain-Env aus toolchain/ (JAVA_HOME per Glob, kein fester Pfad)
#   2. cd mobile/  — Capacitor loest Plattform UND webDir gegen das AKTUELLE
#      Verzeichnis auf; aus dem Repo-Root oder aus android/ heraus scheitert
#      jeder cap-Aufruf mit "android platform has not been added yet".
#   3. [ -d node_modules ] || corepack npm@10.9.2 ci
#   4. [ -d android ]      || cap add android
#      (cap add liefert bei vorhandenem android/ Exit 1 — unter `set -e` waere
#       der Build damit tot.)
#   5. Launcher-Icons aus dem Pixel-Grid rendern (tools/render_icon.mjs)
#   6. DREI idempotente Python-Patches auf das erzeugte Projekt (nicht sed:
#      das Manifest-Attribut wird mehrzeilig eingefuegt):
#        a) AndroidManifest.xml  android:screenOrientation="sensorLandscape"
#        b) res/values/styles.xml  android:windowFullscreen=true
#        c) res/values/ic_launcher_background.xml  Grimlight-Dunkelgruen
#      Alle drei ueberleben cap copy/sync (in der Sandbox verifiziert).
#   7. cap copy android   (kopiert ../game nach app/src/main/assets/public)
#   8. ./gradlew assembleDebug --no-daemon
#
# npm gibt es hier NUR ueber corepack und NUR gepinnt: `corepack npm` allein
# zieht npm 12, das Node 20 ablehnt (Landkarte A.1). `corepack enable`
# scheitert an EACCES auf /usr/bin und wird bewusst NICHT benutzt.
# npx existiert nicht — die Capacitor-CLI wird direkt ueber
# mobile/node_modules/.bin/cap aufgerufen.
#
# Ergebnis: mobile/android/app/build/outputs/apk/debug/app-debug.apk
# Ausliefern an Michaels Handy: python3 tools/serve_apk.py (Port 8125).
# =============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TC="$ROOT/toolchain"
MOBILE="$ROOT/mobile"
APK="$MOBILE/android/app/build/outputs/apk/debug/app-debug.apk"

export COREPACK_ENABLE_DOWNLOAD_PROMPT=0
NPM="corepack npm@10.9.2"

sagen() { printf '\n== %s\n' "$*"; }

# --- 1. Toolchain-Env --------------------------------------------------------
JAVA_HOME=""
for d in "$TC"/jdk-17*; do [ -x "$d/bin/javac" ] && { JAVA_HOME="$d"; break; }; done
if [ -z "$JAVA_HOME" ] || [ ! -d "$TC/android-sdk/platforms/android-34" ]; then
  echo "FEHLER: Toolchain fehlt. Erst ausfuehren:  bash tools/setup_android_toolchain.sh" >&2
  exit 1
fi
export JAVA_HOME
export ANDROID_HOME="$TC/android-sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export GRADLE_USER_HOME="$TC/gradle-home"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"
sagen "Toolchain: JAVA_HOME=$JAVA_HOME  ANDROID_HOME=$ANDROID_HOME"

# --- 2. cwd = mobile/ (Pflicht vor JEDEM cap-Aufruf) -------------------------
cd "$MOBILE"

# --- 3. Abhaengigkeiten ------------------------------------------------------
if [ ! -d node_modules ]; then
  sagen "npm ci (gepinnt: $NPM)"
  $NPM ci --no-audit --no-fund
else
  sagen "node_modules vorhanden — kein npm-Lauf noetig"
fi
CAP="$MOBILE/node_modules/.bin/cap"
[ -x "$CAP" ] || { echo "FEHLER: $CAP fehlt" >&2; exit 1; }

# --- 4. Android-Plattform ----------------------------------------------------
if [ ! -d android ]; then
  sagen "cap add android"
  "$CAP" add android
else
  sagen "android/ vorhanden — cap add wird uebersprungen"
fi

# Plugin-Nachzug: liegt @capacitor/app noch nicht im Gradle-Projekt (weil
# android/ aus einem aelteren Stand stammt), wird die native Verdrahtung
# nachgezogen. Ohne sie ist der backButton-Listener (§4.5) wirkungslos.
if ! grep -q "capacitor-app" android/capacitor.settings.gradle 2>/dev/null; then
  sagen "cap update android (native Plugin-Verdrahtung nachziehen)"
  "$CAP" update android
fi

# --- 5. Launcher-Icons -------------------------------------------------------
sagen "Launcher-Icons aus game/js/art/icon_app.js rendern"
node "$ROOT/tools/render_icon.mjs"

# --- 6. Dauerhafte Projekt-Anpassungen (idempotent, Python statt sed) --------
sagen "Projekt-Patches (Querformat, Vollbild, Icon-Hintergrund)"
ICON_BG="$(node -e "import('$ROOT/game/js/art/icon_app.js').then(m=>process.stdout.write(m.ICON_APP_BG))")"
ANDROID_DIR="$MOBILE/android" ICON_BG="$ICON_BG" python3 - <<'PY'
import os
import re
import sys

basis = os.environ['ANDROID_DIR']
icon_bg = os.environ['ICON_BG']
geaendert = []


def lesen(pfad):
    with open(pfad, 'r', encoding='utf-8') as f:
        return f.read()


def schreiben(pfad, text):
    with open(pfad, 'w', encoding='utf-8') as f:
        f.write(text)


# (a) Querformat fest am MainActivity-Eintrag. sensorLandscape laesst beide
#     Landscape-Richtungen zu (Ladebuchse links ODER rechts), sperrt aber
#     Hochformat — dort waere Button A nur 6,0 mm gross (Landkarte B 1.1).
pfad = os.path.join(basis, 'app/src/main/AndroidManifest.xml')
s = lesen(pfad)
if 'android:screenOrientation' in s:
    print('   Manifest: screenOrientation steht schon')
else:
    marke = 'android:name=".MainActivity"'
    if marke not in s:
        sys.exit('FEHLER: MainActivity-Eintrag im Manifest nicht gefunden')
    s = s.replace(marke, marke + '\n            android:screenOrientation="sensorLandscape"', 1)
    schreiben(pfad, s)
    geaendert.append('AndroidManifest.xml (sensorLandscape)')

# (b) Vollbild. BridgeActivity setzt zur Laufzeit AppTheme.NoActionBar
#     (capacitor/BridgeActivity.java:25-26), das Start-Theme ist
#     AppTheme.NoActionBarLaunch — beide bekommen windowFullscreen, sonst
#     stehen Uhr und Akku ueber dem Spiel und die nutzbare Hoehe sinkt
#     (Review P2-m8: kann Skalierung 5 statt 6 bedeuten).
pfad = os.path.join(basis, 'app/src/main/res/values/styles.xml')
s = lesen(pfad)
neu = s
for name in ('AppTheme.NoActionBar', 'AppTheme.NoActionBarLaunch'):
    muster = re.compile(
        r'(<style\s+name="' + re.escape(name) + r'"[^>]*>)(.*?)(</style>)',
        re.DOTALL)
    treffer = muster.search(neu)
    if not treffer:
        print('   styles.xml: %s nicht gefunden — uebersprungen' % name)
        continue
    if 'android:windowFullscreen' in treffer.group(2):
        print('   styles.xml: %s hat windowFullscreen schon' % name)
        continue
    neu = (neu[:treffer.end(1)]
           + '\n        <item name="android:windowFullscreen">true</item>'
           + neu[treffer.end(1):])
if neu != s:
    schreiben(pfad, neu)
    geaendert.append('styles.xml (windowFullscreen)')

# (c) Hintergrundfarbe des adaptiven Icons. Die Vorlage liefert #FFFFFF —
#     ein weisser Rahmen um eine dunkle Fackel. ICON_APP_BG kommt aus
#     game/js/art/icon_app.js, es gibt also genau eine Quelle.
pfad = os.path.join(basis, 'app/src/main/res/values/ic_launcher_background.xml')
if os.path.exists(pfad):
    s = lesen(pfad)
    neu = re.sub(
        r'(<color\s+name="ic_launcher_background">)\s*#[0-9a-fA-F]{3,8}\s*(</color>)',
        lambda m: m.group(1) + icon_bg + m.group(2), s, count=1)
    if neu != s:
        schreiben(pfad, neu)
        geaendert.append('ic_launcher_background.xml (%s)' % icon_bg)
    else:
        print('   ic_launcher_background.xml: steht schon auf %s' % icon_bg)
else:
    print('   ic_launcher_background.xml fehlt — uebersprungen')

if geaendert:
    for g in geaendert:
        print('   gepatcht: ' + g)
else:
    print('   nichts zu patchen (alle drei Anpassungen stehen bereits)')
PY

# --- 7. Web-Inhalt kopieren --------------------------------------------------
sagen "cap copy android  (webDir ../game -> app/src/main/assets/public)"
"$CAP" copy android

# --- 8. Gradle ---------------------------------------------------------------
sagen "gradlew assembleDebug --no-daemon"
cd "$MOBILE/android"
# 2 Kerne / 3,5 GB frei (Landkarte A.1) -> Heap bewusst klein halten.
./gradlew assembleDebug --no-daemon -Dorg.gradle.jvmargs="-Xmx1536m"

# --- 9. Bilanz ---------------------------------------------------------------
cd "$ROOT"
[ -f "$APK" ] || { echo "FEHLER: $APK ist nicht entstanden" >&2; exit 1; }
sagen "APK fertig"
ls -lh "$APK" | sed 's/^/   /'
AAPT="$(ls -1d "$ANDROID_HOME"/build-tools/34.0.0/aapt2 2>/dev/null || true)"
if [ -x "$ANDROID_HOME/build-tools/34.0.0/aapt" ]; then
  "$ANDROID_HOME/build-tools/34.0.0/aapt" dump badging "$APK" \
    | grep -E "^package|application-label:|application-icon-|sdkVersion|targetSdkVersion" \
    | sed 's/^/   /' || true
fi
echo
echo "APK-BUILD GRUEN: $APK"
echo "Ausliefern:  python3 tools/serve_apk.py     (Port 8125, dann tools/ANLEITUNG_APK.md an Michael)"
