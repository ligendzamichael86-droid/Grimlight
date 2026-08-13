#!/usr/bin/env bash
# =============================================================================
# setup_android_toolchain.sh — JDK + Android-SDK nach toolchain/. Slice 4 §2.2.
# =============================================================================
# IDEMPOTENT: ein zweiter Lauf laedt nichts nach und aendert nichts.
# ALLES landet unter <repo>/toolchain/ — das Verzeichnis steht in .gitignore
# (Spec §0.5), damit ein `git add -A` nicht 2,1 GB einzieht.
#
# EXAKTE PINS (Spec §0.6, Review P2-M9 — "latest" waere in vier Wochen eine
# andere Version und A1 "reproduzierbar" damit verletzt):
#   JDK             Temurin 17.0.20+8, versionierte Adoptium-URL + sha256
#   cmdline-tools   Revision 12.0 (Zip 11076708) + sha256
#   Plattform       platforms;android-34, build-tools;34.0.0
#   platform-tools  "latest" — Google bietet KEINE versionierte URL an.
#                   DEKLARIERT (Spec §9): dieses eine Paket ist nicht gepinnt.
# JAVA_HOME wird NIE fest verdrahtet, sondern ueber den Glob toolchain/jdk-17*
# aufgeloest (siehe tools/build_apk.sh).
#
# UEBERNAHME STATT NEULADEN: liegt die erprobte Sandbox
# .tmp/slice4_probe/toolchain/ noch da (Landkarte Teil A), wird sie kopiert
# statt neu geladen — inklusive gradle-home/, das die Gradle-Distribution und
# alle Maven-Abhaengigkeiten enthaelt und den ersten Build von ~2 min auf
# ~15 s drueckt. Mit --frisch wird die Sandbox ignoriert und alles geladen.
#
# KALTSTART BRAUCHT NETZ (deklariert, Spec §0.6): api.adoptium.net,
# github.com (Adoptium-Umleitung), dl.google.com, services.gradle.org.
#
# Aufruf:
#   bash tools/setup_android_toolchain.sh            # uebernehmen oder laden
#   bash tools/setup_android_toolchain.sh --frisch   # immer frisch laden
# Exit 0 = Toolchain steht.
# =============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TC="$ROOT/toolchain"
DL="$TC/downloads"
SANDBOX="$ROOT/.tmp/slice4_probe"

FRISCH=0
[ "${1:-}" = "--frisch" ] && FRISCH=1

# --- Pins --------------------------------------------------------------------
JDK_VER="17.0.20+8"
JDK_DIR="jdk-17.0.20+8"
JDK_URL="https://api.adoptium.net/v3/binary/version/jdk-17.0.20%2B8/linux/x64/jdk/hotspot/normal/eclipse"
JDK_SHA="be7668bc030d578b83d6d5ef9221d6d6729bbbca8cf94a7d52e16ac68b5a5a35"

CMDLINE_URL="https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip"
CMDLINE_SHA="2d2d50857e4eb553af5a6dc3ad507a17adf43d115264b1afc116f95c92e5e258"
CMDLINE_REV="12.0"

SDK_PAKETE=("platform-tools" "platforms;android-34" "build-tools;34.0.0")

SDK="$TC/android-sdk"

sagen() { printf '%s\n' "== $*"; }

pruefe_sha() {  # $1 Datei, $2 erwarteter sha256
  local ist
  ist="$(sha256sum "$1" | cut -d' ' -f1)"
  if [ "$ist" != "$2" ]; then
    echo "FEHLER: sha256 von $1 ist $ist, erwartet $2" >&2
    return 1
  fi
  printf '   sha256 ok  %s\n' "$(basename "$1")"
}

lade() {  # $1 URL, $2 Zieldatei, $3 sha256
  if [ -f "$2" ] && pruefe_sha "$2" "$3" >/dev/null 2>&1; then
    printf '   schon da: %s\n' "$(basename "$2")"
    return 0
  fi
  printf '   lade %s\n' "$(basename "$2")"
  curl -fL --retry 3 --connect-timeout 30 -o "$2.teil" "$1"
  mv "$2.teil" "$2"
  pruefe_sha "$2" "$3"
}

mkdir -p "$TC" "$DL"

# --- 0. Schon fertig? --------------------------------------------------------
javahome_finden() {
  local d
  for d in "$TC"/jdk-17*; do [ -x "$d/bin/javac" ] && { printf '%s' "$d"; return 0; }; done
  return 1
}

if JH="$(javahome_finden 2>/dev/null)" \
   && [ -d "$SDK/platforms/android-34" ] \
   && [ -d "$SDK/build-tools/34.0.0" ] \
   && [ -x "$SDK/platform-tools/adb" ]; then
  sagen "Toolchain steht bereits — nichts zu tun."
  sagen "JAVA_HOME=$JH"
  "$JH/bin/java" -version 2>&1 | sed 's/^/   /'
  exit 0
fi

# --- 1. Sandbox uebernehmen (falls vorhanden und nicht --frisch) -------------
if [ "$FRISCH" -eq 0 ] && [ -d "$SANDBOX/toolchain" ]; then
  sagen "Erprobte Sandbox gefunden: $SANDBOX/toolchain — wird uebernommen (kein Download)."
  for d in "$SANDBOX"/toolchain/jdk-17*; do
    [ -d "$d" ] || continue
    if [ ! -d "$TC/$(basename "$d")" ]; then
      printf '   kopiere %s\n' "$(basename "$d")"
      cp -a "$d" "$TC/"
    fi
  done
  if [ -d "$SANDBOX/toolchain/android-sdk" ] && [ ! -d "$SDK" ]; then
    printf '   kopiere android-sdk\n'
    cp -a "$SANDBOX/toolchain/android-sdk" "$SDK"
  fi
  if [ -d "$SANDBOX/gradle-home" ] && [ ! -d "$TC/gradle-home" ]; then
    printf '   kopiere gradle-home (spart den Gradle-Download beim ersten Build)\n'
    cp -a "$SANDBOX/gradle-home" "$TC/gradle-home"
  fi
fi

# --- 2. JDK ------------------------------------------------------------------
if ! javahome_finden >/dev/null 2>&1; then
  sagen "JDK $JDK_VER (Temurin, Adoptium — versioniert gepinnt)"
  lade "$JDK_URL" "$DL/OpenJDK17U-jdk_x64_linux_hotspot_17.0.20_8.tar.gz" "$JDK_SHA"
  printf '   entpacke nach toolchain/%s\n' "$JDK_DIR"
  tar -xzf "$DL/OpenJDK17U-jdk_x64_linux_hotspot_17.0.20_8.tar.gz" -C "$TC"
fi
JAVA_HOME="$(javahome_finden)"
export JAVA_HOME
export PATH="$JAVA_HOME/bin:$PATH"
sagen "JAVA_HOME=$JAVA_HOME"
java -version 2>&1 | sed 's/^/   /'

# --- 3. cmdline-tools --------------------------------------------------------
if [ ! -x "$SDK/cmdline-tools/latest/bin/sdkmanager" ]; then
  sagen "Android cmdline-tools Revision $CMDLINE_REV (versionierte Zip, gepinnt)"
  lade "$CMDLINE_URL" "$DL/commandlinetools-linux.zip" "$CMDLINE_SHA"
  # unzip fehlt in dieser Umgebung (Landkarte A.1) -> python3 -m zipfile.
  rm -rf "$TC/.cmdline_tmp"
  mkdir -p "$TC/.cmdline_tmp"
  printf '   entpacke (python3 -m zipfile, unzip fehlt hier)\n'
  python3 -m zipfile -e "$DL/commandlinetools-linux.zip" "$TC/.cmdline_tmp"
  mkdir -p "$SDK/cmdline-tools"
  rm -rf "$SDK/cmdline-tools/latest"
  mv "$TC/.cmdline_tmp/cmdline-tools" "$SDK/cmdline-tools/latest"
  rm -rf "$TC/.cmdline_tmp"
  chmod +x "$SDK/cmdline-tools/latest/bin/"*
fi

export ANDROID_HOME="$SDK"
export ANDROID_SDK_ROOT="$SDK"
SDKMANAGER="$SDK/cmdline-tools/latest/bin/sdkmanager"

# --- 4. Lizenzen (headless) --------------------------------------------------
if [ ! -d "$SDK/licenses" ] || [ -z "$(ls -A "$SDK/licenses" 2>/dev/null)" ]; then
  sagen "SDK-Lizenzen headless annehmen"
  # `yes` bekommt SIGPIPE, sobald sdkmanager fertig ist — unter pipefail waere
  # das ein Fehlschlag, deshalb der eigene Subshell-Schutz.
  { yes 2>/dev/null || true; } | "$SDKMANAGER" --sdk_root="$SDK" --licenses >/dev/null
fi

# --- 5. SDK-Pakete -----------------------------------------------------------
FEHLT=0
[ -d "$SDK/platforms/android-34" ] || FEHLT=1
[ -d "$SDK/build-tools/34.0.0" ] || FEHLT=1
[ -x "$SDK/platform-tools/adb" ] || FEHLT=1
if [ "$FEHLT" -eq 1 ]; then
  sagen "SDK-Pakete: ${SDK_PAKETE[*]}"
  "$SDKMANAGER" --sdk_root="$SDK" "${SDK_PAKETE[@]}" >/dev/null
fi

# --- 6. Env-Datei fuer Menschen ---------------------------------------------
mkdir -p "$TC/gradle-home"
cat > "$TC/env.sh" <<EOF
# Von tools/setup_android_toolchain.sh erzeugt. Nur zum Nachschlagen /
# manuellen Nachbauen — tools/build_apk.sh loest die Pfade selbst auf.
export JAVA_HOME="$JAVA_HOME"
export ANDROID_HOME="$SDK"
export ANDROID_SDK_ROOT="$SDK"
export GRADLE_USER_HOME="$TC/gradle-home"
export PATH="\$JAVA_HOME/bin:\$ANDROID_HOME/platform-tools:\$ANDROID_HOME/cmdline-tools/latest/bin:\$PATH"
EOF

# --- 7. Bilanz ---------------------------------------------------------------
sagen "Fertig."
printf '   JAVA_HOME        %s\n' "$JAVA_HOME"
printf '   ANDROID_HOME     %s\n' "$SDK"
printf '   GRADLE_USER_HOME %s\n' "$TC/gradle-home"
printf '   platform-tools   %s (nicht gepinnt, deklariert)\n' \
  "$(sed -n 's/^Pkg.Revision=//p' "$SDK/platform-tools/source.properties" 2>/dev/null || echo '?')"
printf '   cmdline-tools    %s\n' \
  "$(sed -n 's/^Pkg.Revision=//p' "$SDK/cmdline-tools/latest/source.properties" 2>/dev/null || echo '?')"
printf '   Groesse          %s\n' "$(du -sh "$TC" | cut -f1)"
echo "TOOLCHAIN GRUEN"
