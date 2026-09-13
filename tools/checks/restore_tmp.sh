#!/usr/bin/env bash
# =============================================================================
# restore_tmp.sh — spielt die versionierten Pruef-Suiten aus tools/checks/tmp/
#                  zurueck nach <repo>/.tmp/, damit der Suiten-Kanon in einem
#                  frischen `git clone` laufen kann.
# =============================================================================
# WARUM UEBERHAUPT: .tmp/ steht in .gitignore (CLAUDE.md: "Alles in .tmp/ ist
# wegwerfbar"). Die kanonischen Flusstests, der Art-Selbstcheck und die
# Messwerkzeuge liegen aber dort und werden von den Sanktions-Katalogen der
# Specs unter ihren .tmp/-Pfaden ZITIERT (z. B. SPEC_GP7CH2 §5(2) "check_gfx6_
# art SYM-Deckel", SPEC_SLICE_6 §7 "check_builderA_slice3:55"). Deshalb:
# die Dateien werden versioniert, aber an ihren ALTEN Platz zurueckgelegt —
# kein Pfad in Spec oder Test wird umgeschrieben.
#
# IDEMPOTENT: vorhandene Dateien werden NICHT ueberschrieben (nur --force).
#
# Aufruf:
#   bash tools/checks/restore_tmp.sh                 # zurueckspielen, nichts ueberschreiben
#   bash tools/checks/restore_tmp.sh --force         # vorhandene Dateien ersetzen
#   bash tools/checks/restore_tmp.sh --trocken       # nur zeigen, was passieren wuerde
#   bash tools/checks/restore_tmp.sh --venv          # zusaetzlich .tmp/venv anlegen (NETZ!)
#   bash tools/checks/restore_tmp.sh --keine-pfadheilung
#
# Die venv wird standardmaessig NUR DOKUMENTIERT, nicht angelegt (drei
# Befehle am Ende der Ausgabe). --venv fuehrt sie aus; das braucht Netz.
# =============================================================================
set -euo pipefail

HIER="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$HIER/../.." && pwd)"
QUELLE="$HIER/tmp"
ZIEL="$REPO/.tmp"

# Der Pfad, auf den die fuenf Werkzeuge mit HARTEM Praefix verdrahtet sind.
# Auf dieser Maschine ist REPO identisch, die Heilung unten ist dann ein No-Op.
ALT_PRAEFIX="/home/coder/Grimlight"

FORCE=0; TROCKEN=0; VENV=0; HEILEN=1
for a in "$@"; do
  case "$a" in
    --force)              FORCE=1 ;;
    --trocken|--dry-run)  TROCKEN=1 ;;
    --venv)               VENV=1 ;;
    --keine-pfadheilung)  HEILEN=0 ;;
    -h|--help)            sed -n '2,27p' "${BASH_SOURCE[0]}"; exit 0 ;;
    *) echo "Unbekanntes Argument: $a (siehe --help)" >&2; exit 2 ;;
  esac
done

sagen() { printf '== %s\n' "$*"; }

[ -d "$QUELLE" ] || { echo "FEHLER: $QUELLE fehlt — falscher Checkout?" >&2; exit 1; }

sagen "Repo   $REPO"
sagen "Quelle $QUELLE"
sagen "Ziel   $ZIEL"
[ "$TROCKEN" -eq 1 ] && sagen "TROCKENLAUF — es wird nichts geschrieben."

# --- 1. Kopieren --------------------------------------------------------------
neu=0; behalten=0; ersetzt=0
GEHEILT=()
while IFS= read -r -d '' q; do
  rel="${q#"$QUELLE"/}"
  z="$ZIEL/$rel"
  if [ -e "$z" ]; then
    if [ "$FORCE" -eq 1 ]; then
      [ "$TROCKEN" -eq 1 ] || { mkdir -p "$(dirname "$z")"; cp -p "$q" "$z"; }
      ersetzt=$((ersetzt + 1)); printf '   ersetzt   .tmp/%s\n' "$rel"
    else
      behalten=$((behalten + 1))
    fi
  else
    [ "$TROCKEN" -eq 1 ] || { mkdir -p "$(dirname "$z")"; cp -p "$q" "$z"; }
    neu=$((neu + 1)); printf '   neu       .tmp/%s\n' "$rel"
  fi
  # Heilen nur fuer Dateien, die jetzt (oder schon) am Ziel liegen und das
  # falsche Maschinen-Praefix tragen.
  if [ "$HEILEN" -eq 1 ] && [ "$REPO" != "$ALT_PRAEFIX" ] \
     && grep -q "$ALT_PRAEFIX" "$q" 2>/dev/null; then
    GEHEILT+=("$rel")
  fi
done < <(find "$QUELLE" -type f -print0 | sort -z)

sagen "Bilanz: $neu neu, $ersetzt ersetzt, $behalten unberuehrt (schon vorhanden)"
[ "$behalten" -gt 0 ] && [ "$FORCE" -eq 0 ] \
  && echo "   ($behalten Datei(en) waren schon da — mit --force ersetzen)"

# --- 2. Maschinen-Praefix heilen ---------------------------------------------
# Fuenf Werkzeuge tragen /home/coder/Grimlight HART im Quelltext (Inventur:
# shot_gfx6.py:108, slice6_p4/messung_p4.py:34+38, check_gp6_art_self.mjs:63,
# gp7ch_ch2_sonde/horde.mjs:4-6, gp7ch_ch2_sonde/knaeuel.mjs:3-5). Auf einem
# Rechner mit anderem Repo-Pfad wuerden sie ins Leere greifen bzw. still die
# Dateien eines FREMDEN Checkouts lesen. Geheilt wird ausschliesslich die
# ZURUECKGESPIELTE Kopie unter .tmp/ — die versionierte Quelle in
# tools/checks/tmp/ bleibt byte-gleich zum Original.
if [ "${#GEHEILT[@]}" -gt 0 ]; then
  sagen "Maschinen-Praefix heilen: $ALT_PRAEFIX -> $REPO"
  for rel in "${GEHEILT[@]}"; do
    printf '   heile     .tmp/%s\n' "$rel"
    [ "$TROCKEN" -eq 1 ] && continue
    python3 - "$ZIEL/$rel" "$ALT_PRAEFIX" "$REPO" <<'PY'
import sys
p, alt, neu = sys.argv[1], sys.argv[2], sys.argv[3]
with open(p, encoding='utf-8') as fh:
    s = fh.read()
with open(p, 'w', encoding='utf-8') as fh:
    fh.write(s.replace(alt, neu))
PY
  done
  echo "   HINWEIS: Die Sanktions-Kataloge zitieren Zeilennummern. Die Heilung"
  echo "   tauscht nur das Praefix INNERHALB einer Zeile — Zeilennummern bleiben."
elif [ "$REPO" = "$ALT_PRAEFIX" ]; then
  sagen "Kein Pfad-Heilen noetig (Repo liegt unter $ALT_PRAEFIX)."
else
  sagen "Pfad-Heilen uebersprungen (--keine-pfadheilung)."
fi

# --- 3. venv: nur dokumentieren (oder mit --venv ausfuehren) ------------------
VENV_BEFEHLE=(
  "python3 -m venv $ZIEL/venv"
  "$ZIEL/venv/bin/pip install -r $HIER/requirements.txt"
  "$ZIEL/venv/bin/playwright install chromium"
)
if [ "$VENV" -eq 1 ]; then
  sagen "venv anlegen (braucht Netz)"
  if [ "$TROCKEN" -eq 1 ]; then
    printf '   (trocken) %s\n' "${VENV_BEFEHLE[@]}"
  else
    for b in "${VENV_BEFEHLE[@]}"; do printf '   %s\n' "$b"; eval "$b"; done
  fi
else
  sagen "venv NICHT angelegt (Vorgabe). Fuer die Realmessung (shot_gfx6.py,"
  echo "   slice6_p4/messung_p4.py) diese drei Befehle ausfuehren — brauchen Netz:"
  printf '     %s\n' "${VENV_BEFEHLE[@]}"
  echo "   Oder: bash tools/checks/restore_tmp.sh --venv"
fi

# --- 4. Aufruf-Kanon in Erinnerung rufen -------------------------------------
cat <<'EOF'

== Suiten-Kanon (Soll-Zahlen in tools/checks/README.md)
  node tools/smoke_test.mjs                  -> 862 ok, "SMOKE-TEST GRÜN"
  node .tmp/check_main_slice1.mjs            -> CHECK GRÜN (25 Assertions)
  node .tmp/check_inventory_slice2.mjs       -> CHECK GRÜN (25 Assertions)
  node .tmp/check_boss_slice3.mjs            -> CHECK GRÜN (33 Assertions)
  node tools/check_save_slice4.mjs           -> CHECK GRÜN (63 Assertions)
  node .tmp/check_builderA_slice3.mjs        -> 106 Pruefungen / ALLE GRUEN
  node .tmp/check_gfx6_art.mjs               -> GP6-ART-CHECK GRUEN
  node .tmp/check_engineB_gp6.mjs            -> SELBSTPRUEFUNG GRUEN
  node .tmp/check_gp6_art_self.mjs           -> 6 ROT von 428 (SOLL, deklariert)
  node .tmp/art_slice3_selfcheck.mjs         -> SELBSTCHECK GRUEN
  node .tmp/probe_god.mjs "?god=1"           -> PROBE GRUEN
  node .tmp/probe_s4_engine.mjs              -> PROBE GRUEN
EOF
echo "RESTORE FERTIG"
