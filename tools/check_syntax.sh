#!/usr/bin/env bash
# node --check über alle JS-Dateien in game/js/. Läuft aus jedem
# Arbeitsverzeichnis, ohne Argumente. Exit 0 = grün.
set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
JS_DIR="$ROOT/game/js"

if [ ! -d "$JS_DIR" ]; then
  echo "FEHLER: $JS_DIR existiert nicht" >&2
  exit 1
fi

fail=0
count=0
while IFS= read -r f; do
  count=$((count + 1))
  if ! out=$(node --check "$f" 2>&1); then
    fail=1
    echo "SYNTAXFEHLER: $f"
    echo "$out"
  fi
done < <(find "$JS_DIR" -name '*.js' -type f | sort)

if [ "$fail" -eq 0 ]; then
  echo "OK: $count JS-Dateien syntaktisch sauber."
else
  exit 1
fi
