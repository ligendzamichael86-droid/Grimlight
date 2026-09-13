# GRAFIKPASS-6-ABNAHME-PROOF (Phase 4) — misst SPEC_GRAFIKPASS_6.md Rev 2.5 §1
# (Messziele M1-M5) plus die Perf-Verifikation §2.4 am ECHTEN Spiel.
#
# REV 2.5 (Spec-Kopf F1-F3, Runde-2-Fixer-Eskalationen) — ZWEI davon treffen
# dieses Werkzeug:
#   (F2) WRAP_TILEMAP MUSS den 6. draw()-Parameter durchreichen
#        ((...rest)-Muster wie WRAP_PLAYER) — sonst zeichnet der Proof die
#        Over-Kronen wieder voll deckend und der P0-A-Fix waere im
#        Beweismaterial unsichtbar. UMGESETZT.
#   (F3) M4-METRIK-GENERALISIERUNG: Verdeckung wird GRADIERT gemessen,
#        V = 1 - mean|A-B| / mean|C-D| ueber die Silhouette. BINDEND:
#        V(Kopf) in 0,45..0,85 UND >= 25 % der Voll-Silhouette lesbar. Die
#        binaeren Rev-2.3-Zahlen (verdeckt_kopf >= 100, Quotient >= 0,75)
#        galten fuer das Exakt-Regime (opake Krone) und sind ERSETZT; sie
#        laufen als Protokoll mit und erzeugen KEINEN Fehler mehr.
#
# REV 2.4 (Spec-Kopf J1-J4, Jury-Runde 1) — VIER AENDERUNGEN AM WERKZEUG:
#   (J1) Gradient-Schnitt: das in Rev 2.3 ersatzlos gestrichene Plateau-Minimum
#        bekommt eine am Zensus geeichte ERSATZREGEL: >= 5 Plateaus >= 2 Bloecke
#        auf dem Proof-Strahl (55 % aller Strahlen erreichen sie). BINDEND.
#   (J2) M4 wird VERSCHAERFT (P0-A): zusaetzlich Kopf-Quotient <= 0,85 UND
#        >= 25 % der VOLL-Silhouette (C/D-Differenz ueber das ganze
#        Sprite-Fenster, Juror-K-Referenz 275 Texel) in der Beweiszelle LESBAR
#        (= vom Spieler veraendert, A != B). Totalverdeckung ist ein Defekt.
#        Protokoll (KEIN Gate): gradierter Verdeckungsgrad
#        1 - mean|A-B| / mean|C-D| ueber dieselbe Silhouette — die binaere
#        A==B-Zaehlung ist bei globalAlpha < 1 konstruktiv 0.
#   (J3) NEUES GATE 'schachbrett' (P0-B): 8x8-Schachbrett-Energie-Blockanteil
#        in g6_01 + g6_02 < 2 %. Positiv-Kontrolle am Runde-1-Archivbild
#        (Juror-K-Referenz 6,1 / 7,0 %), Detektor-Kontrolle an einem
#        synthetischen Vollschachbrett, Negativ-Kontrolle an einer Flaeche.
#   (J4) P0-D ist durch Michaels Entscheid (Option a) aufgeloest — die
#        Rev-2.1-Baender bleiben unveraendert; keine Werkzeug-Aenderung.
#   NACHZUG (Fixer-Befund R2): WRAP_TILEMAP reichte den 6. draw()-Parameter
#        (opts) NICHT durch — ohne den Durchreicher waere der P0-A-Fix im
#        Beweismaterial unsichtbar gewesen (Kronen wieder voll deckend).
#
# REV 2.3 (Spec-Kopf) — ZWEI METHODEN-ENTSCHEIDE, SCHWELLEN UNVERAENDERT:
#   (K2-FINAL) Das PRO-STRAHL-Plateau-Minimum des Gradient-Schnitts entfaellt
#        ERSATZLOS (arithmetisch unerfuellbar: 2*8+3 = 19 geforderte Bloecke bei
#        18 messbaren im glow-freien Fenster; Erfuellbarkeits-Zensus ueber 972
#        Strahlen 4,4 %). BINDEND bleiben Sprungzahl 8..13 und der GLOBALE
#        Plateau-Anteil >= 95 %; die Plateau-Laengen laufen als Protokoll mit,
#        das Schnitt-BILD bleibt Pflicht-Jurymaterial.
#   (M1-PHASEN) M1 friert per arm_freeze auf die 8 FESTEN Phasen 6,05..13,05 s
#        (1-s-Raster, Einfrier-Fenster 1/8 s — wie M2/E2). Je Kennzahl (Median,
#        Highlight, L<16, Goodhart-Groessen) entscheidet der MEDIAN ueber die 8
#        Phasen; die Einzelphasen stehen vollstaendig im Report. Grund: der
#        Fackel-Flicker bewegt die Mediane um bis zu +-0,8 L um die Bandgrenzen.
#
# REV 2.2 (Spec-Kopf) — DREI MESS-KORREKTUREN, SCHWELLEN UNVERAENDERT:
#   (K1) M2-Stufenzaehlung rastet auf die deklarierte Leiter {ambient*k/12}
#        mit Toleranz +-0,015; die Engine-Gegenprobe (lightRuns am selben
#        eingefrorenen Frame) wird von der Diagnose zur KONTROLLE
#        (Positiv-Referenz: der gerasterte Schaetzer muss die k-Folge der
#        Engine Block fuer Block reproduzieren).
#   (K2) Gradient-Schnitt: 'kein Plateau < 2 Bloecke' kollidierte mit dem
#        in §2.2 PFLICHT-erhaltenen rWob-Jitter. Neue Regel: >= 8 Spruenge
#        >= 0,04 UND >= 8 Plateaus >= 2 Bloecke, hoechstens 3 Plateaus < 2.
#   (K3) M3-Halbseiten-METRIK = Halbseiten(Tint) - Halbseiten(__noTint) am
#        SELBEN Frame/Ort (Tint-ANTEIL): NAH >= +6 L (Gate), FERN < 2 L
#        (Kontrolle). Die Fern-Paar-Negativkontrolle laeuft auf zwei
#        KEGELFREIEN Orten (CATACOMBS hat beweisbar nur EIN kegelfreies
#        Gebiet — zwei >= 48 px entfernte sind dort nicht konstruierbar;
#        das 48-px-Paar bleibt als NEBENBEFUND stehen, ohne Gate-Wirkung).
#
# PORT von .tmp/shot_gfx5.py. Uebernommen: Rig (performance.now-Wrapper,
# Route-Interception der Modul-Wrapper, __armFreeze), settle_camera +
# GANZZAHL-ASSERTION, Crop-/Strip-Werkzeug, 9-Lauf-Modus bei Bewegtem,
# Teillauf-Merge, PNG-Sanity. SPIELDATEIEN BLEIBEN UNANGETASTET — alle
# Eingriffe leben in den .tmp-Wrappern.
#
# NACHZUGSLISTE beim Port (Spec §1, bindend):
#   * GLANZ_RGB auf den neuen '='-Hex (#56757a) — Teich-Specular.
#   * Wegsporn-Gate auf das neue Zeichen 'P' + art `path_pebbles`
#     (soll_legende {'28,15':'P','29,15':'P'}).
#   * alle Ton-Tripel aus der P0b-Offset-Tabelle (.tmp/gp6_offset_tabelle.json),
#     KEIN hartkodierter Hex im Proof.
#   * WRAP_PLAYER auf (...a)-Durchreichung (God-Mode-Argument 7e1d86d!).
#   * neuer Rig-Schalter window.__noTint (main.js:872 liest ihn selbst).
#   * neuer Schalter window.__noCanopyShadow im tilemap-Wrapper (Proxy auf das
#     tileCanvases-Objekt: die Kronen-Schatten-Keys liefern undefined, alles
#     andere unveraendert — der Zweitpass ist sonst nicht einzeln abschaltbar).
#
# MESS-DISZIPLIN (Spec §1): Messung auf dem 320x180-BACKING-STORE (toDataURL,
# keine CSS-Skalierung), Rec.601-Luminanz, HUD-Maske Panel+BossBar+ItemBox je
# +1 px (identisch zur P0-Eichung — die E1-Schwellen stammen aus dieser Maske),
# Positiv- UND Negativ-Kontrolle je Gate, Schwellen NIE anpassen. Ein Gate mit
# gescheiterter KONTROLLE ist UNGUELTIG (weder rot noch gruen) und wird als
# solches gemeldet.
#
# Aufruf: .tmp/venv/bin/python .tmp/shot_gfx6.py [liste|all]
#   Listen-Namen: m1 m2 e2 m3 m4 m5 wegsporn perf strips

import base64
import io
import json
import math
import os
import re
import statistics
import sys

import numpy as np
from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = "/home/coder/Grimlight"
OUT = f"{ROOT}/.tmp/screenshots"
BASE = "http://127.0.0.1:8124"
VIEW_W = 320
VIEW_H = 180
TILE = 16
MAGENTA = (255, 0, 255)
ZOOM = 6                      # Pflicht-Crops 4-6x
SCENE_ZOOM = 4                # Vollszenen als 4x-NEAREST des Backing-Stores

errors = []
warnings = []
ungueltig = []                # Gates mit gescheiterter KONTROLLE
proof_results = {}
cams = {}
crops = {}
strips = {}
scenes = {}
ONLY = set(sys.argv[1].split(",")) if len(sys.argv) > 1 and sys.argv[1] != "all" else None

# ---------------------------------------------------------------------------
# SPEC §1 — SCHWELLEN (woertlich; nach Eintrag NIE anpassen)
# ---------------------------------------------------------------------------
# M1 Belichtung (feste Kameras aus Landkarte T2 §3). E1 = GEEICHTE
# Highlight-Spalte aus Rev 2.1.
M1_KARTEN = {
    "GRAVEYARD":     {"median": (38.0, 46.0), "hl_L": 96,  "hl_min": 1.01, "dunkel_max": 3.0,  "aussen": True},
    "CATACOMBS":     {"median": (40.0, 50.0), "hl_L": 128, "hl_min": 1.94, "dunkel_max": 10.0, "aussen": False},
    "FLUESTERGRUFT": {"median": (33.0, 44.0), "hl_L": 128, "hl_min": 0.92, "dunkel_max": 9.0,  "aussen": False},
    "BOSS_KAMMER":   {"median": (38.0, 48.0), "hl_L": 128, "hl_min": 1.32, "dunkel_max": 5.0,  "aussen": False},
}
# M1-PHASEN (Rev 2.3, Spec-Kopf): M1 friert NICHT mehr im Augenblick der
# Aufbau-Fertigstellung ein (der war lauf-abhaengig — Fackel-Radius-Wob und
# Lit-Dither standen bei jedem Lauf anders), sondern per arm_freeze auf ACHT
# FESTE Phasen im 1-s-Raster. Je Kennzahl (Median, Highlight, L<16 und die
# Goodhart-Groessen) zaehlt der MEDIAN ueber diese acht Phasen; die
# Einzelphasen stehen vollstaendig im Report. SCHWELLEN UNVERAENDERT.
M1_PHASEN = [6.05, 7.05, 8.05, 9.05, 10.05, 11.05, 12.05, 13.05]
M1_PHASEN_RASTER = 8             # Einfrier-Fenster: 1/8-s-Zelle um die Phase
M1_GOODHART_KLASSEN = 3          # >= 3 Palettenton-Klassen
M1_GOODHART_CLUSTER = 12         # >= 12 zusammenhaengende Cluster
M1_GOODHART_EINZEL_AUSSEN = 60.0  # kein Einzelton > 60 % (aussen)
M1_GOODHART_EINZEL_INNEN = 75.0   # kein Einzelton > 75 % (innen, 'D'-Deklaration)
M1_POSITIV_BILD = f"{OUT}/gp6_ist_graveyard_teich.png"   # GP5-Archivbild (P0-Vorlauf)
M1_POSITIV_MEDIAN = 24.9
M1_POSITIV_TOL = 0.5
M1_NEGATIV_MEDIAN_MAX = 5.0

# M2 Licht-Quantisierung (3-Kanal-Schaetzer, validiert T6 §4b)
M2_KAMERA = (40, 190)            # CATACOMBS
M2_RING_INNEN = 0.48             # Mess-Zone: Vereinigung 0,48r < d <= r
M2_STUFEN_MIN = 9
M2_STUFEN_MAX = 13
M2_RASTER = 0.01
M2_PLATEAU_MIN = 95.0            # % der Bloecke auf {ambient*k/12}
M2_PLATEAU_TOL = 0.01
M2_LEITER_TOL = 0.015            # K1 (Rev 2.2): Rastung der STUFENZAEHLUNG
# FENSTER-KORREKTUR (GP6 R1, GETRENNT DEKLARIERT — nicht Teil von K1/K2/K3,
# keine Schwelle): Spec §1/M2 verlangt BINDEND eine WARM-GLOW-FREIE Mess-Zone.
# Der GP6-R1-Engine-Fix rastert den Warm-Pass auf 2x4-Bloecke, deren MITTE
# innerhalb der Glow-Scheibe liegt — die gefuellte Flaeche reicht damit bis zu
# 1 px in x und 2 px in y ueber den frueher gezeichneten Bogen hinaus. Gemessen
# (.tmp/g6r1_m2_diagnose.py, 8 deterministisch eingefrorene Phasen): JEDER
# Block, in dem der Schaetzer von der Engine abweicht, liegt bei
# d/(0,48*r_un) = 1,017..1,053 — also in einem duennen Saum DIREKT ausserhalb
# des analytischen Glow-Radius, und nirgends sonst. Mit 2 px Zusatz-Marge
# (geometrische Obergrenze der Blockrasterung) liefert die Messung in 8 von 8
# Phasen exakt 13 Leiterstufen, 0 Fehltreffer und max |Abweichung| 0,0140 —
# den reinen 8-Bit-Rundungsboden. Ohne die Marge: 14..17 Stufen, 2..10
# Fehltreffer, max 0,0279. Ruecknahme = diese Konstante auf 0.0 setzen.
M2_GLOW_MARGE = 2.0              # px Zusatz-Ausblendung um JEDE Glow-Quelle
M2_GRAD_LEN = 72                 # px vom Fackelzentrum
M2_GRAD_SPRUENGE = (8, 13)       # >= 8 und <= 13 Spruenge
M2_GRAD_MIN_SPRUNG = 0.04
M2_GRAD_MIN_PLATEAU = 2          # Bloecke je Plateau (Laengen-Definition)
# REV 2.4 (J1, P0-C): Die Rev-2.3-Streichung war sachlich richtig, aber
# ERSATZLOS — damit ueberlebte kein einziges Kriterium fuer die raeumliche
# Ausdehnung der Lichtstufen. Ersatzregel, am Zensus geeicht (972 Strahlen,
# 55 % erreichen sie; der Rev-2.3-Proof-Strahl hatte genau 5):
M2_GRAD_PLATEAUS_MIN_N = 5       # >= 5 Plateaus >= 2 Bloecke auf dem Proof-Strahl
# K2-FINAL (Rev 2.3): das PRO-STRAHL-Plateau-Minimum des Gradient-Schnitts
# ENTFAELLT ERSATZLOS. Es war arithmetisch unerfuellbar (2*8 + 3 = 19
# geforderte Bloecke bei 18 messbaren im glow-freien Fenster;
# Erfuellbarkeits-Zensus ueber 972 Strahlen: 4,4 %, .tmp/g6r1w_grad_diagnose.json).
# BINDEND bleiben die Sprungzahl 8..13 (M2_GRAD_SPRUENGE) und der GLOBALE
# Plateau-Anteil >= 95 % (M2_PLATEAU_MIN); die Plateau-Laengen des Strahls
# laufen weiter als PROTOKOLL mit, und das Schnitt-BILD bleibt
# Pflicht-Jurymaterial. Die Konstanten M2_GRAD_PLATEAU_MIN_N/M2_GRAD_KURZ_MAX
# sind damit ersatzlos gestrichen (keine Schwelle veraendert).
M2_FERN_TOL = 0.01               # Fernzone a == ambient +- 0,01
# E2 (GEEICHT): <= 24 distinkte (A-B)-Luminanzwerte auf RASTER 1 L
E2_MAX = 24
E2_RASTER = 1.0
E2_FACKEL_TILE = (28, 18)        # GRAVEYARD, freistehend
E2_SPIELER = (606, 318)
E2_KAMERA = (320, 204)

# M3 Sprite-Beleuchtung
M3_DWARM_MIN = 18.0
M3_HALB_MIN = 6.0
M3_HALB_NOTINT_MAX = 2.0
M3_AUSBRENNEN_L = 240
M3_FERN_DE_MAX = 4.0

# M4 Kronen-Massstab & Verdeckung
KRONEN_HEAD_ROWS_GP6 = 16
M4_BEWEISZELLE = (31, 9)         # unter der xl_b-Krone bei (30,8)
M4_KRONENFREI = (3, 2)           # Kontrolle (P0b)
M4_VERDECKT_MIN = 100
M4_QUOT_MIN = 0.75
# REV 2.4 (J2, P0-A): Totalverdeckung ist ein DEFEKT, kein Optimum.
# Zusaetzlich zur Untergrenze gilt eine OBERGRENZE auf demselben Quotienten und
# eine Lesbarkeits-Untergrenze auf der VOLL-Silhouette (das ganze Sprite-Fenster,
# nicht nur der Kopf). Juror-K-Referenz: 275 Silhouetten-Texel in der
# Beweiszelle (Box x177..191, y73..97), davon muessen >= 25 % LESBAR bleiben
# (lesbar := der Spieler veraendert den Texel, A != B).
M4_QUOT_MAX = 0.85
M4_VOLL_SIL_REF = 275            # Juror-K-Referenzzahl (Protokoll, kein Gate)
M4_VOLL_SIL_TOL_PCT = 10.0       # Warnung, wenn die gemessene Zahl weiter abweicht
M4_VOLL_LESBAR_MIN_PCT = 25.0
# REV 2.5 (F3) — M4-METRIK-GENERALISIERUNG (Fable, 13.08.2026):
# Die BINAEREN Rev-2.3-Zahlen (verdeckt_kopf >= 100, Quotient >= 0,75) galten
# fuer das EXAKT-Regime (Krone opak). Der sanktionierte Alpha-0,55-Fix macht
# `A == B` konstruktiv unmoeglich — sie sind ERSETZT durch die GRADIERTE
# Verdeckung V = 1 - mean|A-B| / mean|C-D| ueber die Silhouette.
# BINDEND: V(Kopf) in 0,45..0,85 UND >= 25 % der Voll-Silhouette lesbar.
# Die binaeren Zahlen laufen nur noch als PROTOKOLL mit.
M4_V_KOPF_MIN = 0.45
M4_V_KOPF_MAX = 0.85
M4_FENSTER = (48, 32)
M4_DACH_MIN = 85.0               # % Kronen-Pixel-Deckung
M4_GEGENGATE_XL_MIN = 2          # >= 2 XL-Keys
M4_GEGENGATE_MAX_ANTEIL = 60.0   # kein Key > 60 %

# M5 Kontaktschatten-Abdeckung (Bild-Gate)
M5_DL_MIN = 6.0
M5_TEXEL_MIN = 8
M5_INNEN_A_MAX = 0.15            # Messort IM Fackelkegel
M5_VIGNETTE_R = 90               # Vignetten-Zone d > 90 px ausgeschlossen

# SCHACHBRETT (Rev 2.4 J3, P0-B — NEUES GATE, Juror-K-Metrik)
# Befund R1: canopy_shadow(+_xl_*) stempelten ein starres Punktgitter aus den
# zwei dunkelsten Palettentoenen auf den Boden ("Fliegengitter"). Juror K misst
# das als 8x8-SCHACHBRETT-ENERGIE-BLOCKANTEIL und fordert "zurueck unter
# 2 Prozent".
# METRIK (woertlich umgesetzt, Fenster-Validierung im Report): Rec.601-Luminanz
# des 320x180-Backing-Stores; nicht ueberlappende 8x8-Bloecke (40 x 22 = 880;
# die angeschnittene 23. Blockzeile faellt weg); je Block die mittlere
# Schachbrett-Amplitude |mean(L * (-1)^(x+y))| — die Projektion auf das
# Nyquist-Diagonalmuster, also genau die Energie eines 1-px-Punktgitters.
# Ein Block gilt als SCHACHBRETT-BLOCK ab SCHACH_AMP_MIN; Blockanteil = Anteil
# solcher Bloecke. HUD wird NICHT ausmaskiert (K misst das ganze Bild).
# EICHUNG DER SCHWELLE (einmalig, VOR dem Lauf, danach eingefroren): 6,0 L
# reproduziert auf den Runde-1-Archivbildern 6,14 / 6,93 % gegen die
# Juror-Werte 6,1 / 7,0 % (Abweichung <= 1 Block von 880). Der Defekt selbst
# traegt bis 23,5 L Blockamplitude, die Kunst-Dither der Bestandsflaechen
# bleiben darunter.
SCHACH_BLOCK = 8
SCHACH_AMP_MIN = 6.0             # L, mittlere Schachbrett-Amplitude je Block
SCHACH_MAX_PCT = 2.0             # Gate (Juror K): Blockanteil < 2 %
SCHACH_SZENEN = ["g6_01_friedhof_teich", "g6_02_friedhof_waldrand"]
SCHACH_ARCHIV_DIR = f"{ROOT}/.tmp/g6_r1_archiv"
SCHACH_ARCHIV_SOLL = {"g6_01_friedhof_teich": 6.1, "g6_02_friedhof_waldrand": 7.0}
SCHACH_ARCHIV_TOL = 0.3          # pp gegen die Juror-K-Werte
SCHACH_SYNTH_DL = 50.0           # Detektor-Kontrolle: Vollschachbrett dieser Tiefe

# §2.4 Performance (eingefrorene Absolut-Limits der P0a-Baseline)
PERF_KAMERA = (112, 80)          # CATACOMBS Worst-View, 21 Lichter
PERF_SPIELER = (272, 170)        # -> Kamera (112,80)
PERF_FRAMES = 300
PERF_LAEUFE = 3
PERF_MITTEL_MAX = 2.79
PERF_P95_MAX = 4.05
PERF_LAUF_MAX = 2000

# §6.3 Wegsporn (Nachzugsliste)
WEGSPORN_TILES = [(28, 14), (28, 15), (29, 15)]
WEGSPORN_SOLL = {(28, 14): "=", (28, 15): "P", (29, 15): "P"}
WEGSPORN_ARTS_SOLL = ["path_pebbles", "path_pebbles"]
WEGSPORN_STAND = (30, 19)
WEGSPORN_CROP_RECT = (432, 208, 496, 272)

# §6.4a Teich-Specular — GLANZ_RGB NACHGEZOGEN auf den neuen '='-Hex
TEICH_RECT = (464, 256, 512, 288)
GLANZ_RGB = (0x56, 0x75, 0x7A)
GLANZ_TOL = 20

TORCH_RADIUS = 72                # main.js:30

# ---------------------------------------------------------------------------
# Ton-Tripel: ALLE aus der P0b-Offset-Tabelle (kein Hex im Proof-Quelltext)
# ---------------------------------------------------------------------------
with open(f"{ROOT}/.tmp/gp6_offset_tabelle.json") as fh:
    OFFSET_TAB = json.load(fh)
NEUE_TOENE = {t["key"]: tuple(t["rgb_neu"]) for t in OFFSET_TAB["tabelle"]}
assert NEUE_TOENE.get("=") == GLANZ_RGB, (
    f"GLANZ_RGB {GLANZ_RGB} passt nicht zur Offset-Tabelle {NEUE_TOENE.get('=')}")

# Vollstaendige Palette (Spieldatei nur LESEN) fuer die Ton-Klassifikation.
_pal_src = open(f"{ROOT}/game/js/art/palette.js").read()
PALETTE = {}
for _m in re.finditer(r"^\s*'?([A-Za-z0-9=+*!%&()@:;?\[\]^_|\"$/<>{}`])'?:\s*'(#[0-9a-fA-F]{6})'", _pal_src, re.M):  # GP7CH2 §5(7): + 14 Symboltoene CH-1 §E3 + 8 Gegner-Toene CH-2 (sonst 64/78 statt 86 Klassen; zwei Beruehrungen, R-A8)
    PALETTE[_m.group(1)] = tuple(int(_m.group(2)[i:i + 2], 16) for i in (1, 3, 5))
PAL_KEYS = sorted(PALETTE)
PAL_RGB = np.array([PALETTE[k] for k in PAL_KEYS], dtype=np.float64)

# ---------------------------------------------------------------------------
# HUD-Maske (Spec §1: Panel + BossBar + ItemBox je +1 px). Koordinaten woertlich
# aus ui/hud.js: Panel :193 (px2 py2 pw54 ph40 + 1px Schlagschatten),
# BossBar :404 (bx120 by7 bw80 bh12), ItemBox :484 (296,4,20,20).
# IDENTISCH zur P0-Eichung (.tmp/gp6_belichtung_messung.py) — die E1-Schwellen
# sind auf genau diese Maske geeicht.
# ---------------------------------------------------------------------------
HUD_RECTS = [("panel", 2, 2, 58, 44), ("bossbar", 120, 7, 200, 19), ("itembox", 296, 4, 316, 24)]
MASK = np.ones((VIEW_H, VIEW_W), dtype=bool)
for _n, _x0, _y0, _x1, _y1 in HUD_RECTS:
    MASK[_y0:_y1, _x0:_x1] = False

# ---------------------------------------------------------------------------
# Rig (aus shot_gfx5.py; NEU: __origNow fuer die Perf-Messung)
# ---------------------------------------------------------------------------
INIT_JS = r"""
(() => {
  // SLICE 5 (SPEC_SLICE_5 A3/§5.5, Review P2-M12): die drei Game-Feel-Schalter
  // stehen fuer JEDE Messung dieses Rigs auf AN = Effekt AUS, und zwar VOR dem
  // ersten Frame (add_init_script laeuft vor dem Dokument-Skript). Grund:
  //   __noShake  Der Bildschirmruettler klingt ueber bis zu 12 Ticks ab und
  //              verschiebt JEDES Messfenster um 1-3 px, wenn eine Messung in
  //              diese Zeit faellt. Ohne den Schalter waeren Pixelfenster,
  //              Halbseiten-Metrik und Bbox-Gates nicht mehr reproduzierbar.
  //   __noFlash  Fuer die eingefrorenen Belichtungsmessungen unkritisch (2
  //              Frames, nur bei Spieler-Schaden), aber ein Vollbild-Rect in
  //              einer Tonmessung waere ein stiller Ausreisser.
  //   __noAudio  Kein Klang im Messlauf: der WebAudio-Graph kostet Zeit in
  //              genau den Perf-Zeitreihen, die dieses Rig misst.
  // Der DEFAULT des Spiels bleibt "Effekte AN" — main.js liest die Schalter in
  // der Guard-Form (window[name] === true) und nur main.js liest window.
  window.__noShake = true;
  window.__noFlash = true;
  window.__noAudio = true;
  const origNow = performance.now.bind(performance);
  window.__origNow = origNow;
  let lastReal = origNow();
  let lastScaled = lastReal;
  window.__timeScale = 1;
  performance.now = function () {
    const t = origNow();
    lastScaled += (t - lastReal) * window.__timeScale;
    lastReal = t;
    return lastScaled;
  };
  window.__frozen = false;
  window.__freezeTimedOut = false;
  window.__freezeGen = 0;
  window.__armFreeze = function (condSrc, timeoutMs) {
    window.__frozen = false;
    window.__freezeTimedOut = false;
    const gen = ++window.__freezeGen;
    const cond = (0, eval)('(' + condSrc + ')');
    const t0 = origNow();
    function tick() {
      if (gen !== window.__freezeGen) return;
      let hit = false;
      try { hit = !!cond(); } catch (e) { hit = false; }
      if (hit) { window.__timeScale = 0; window.__frozen = true; return; }
      if (timeoutMs && origNow() - t0 > timeoutMs) { window.__freezeTimedOut = true; return; }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  };
})();
"""

# NACHZUG (Spec §1): (...a)-DURCHREICHUNG. createPlayer bekommt seit 7e1d86d ein
# zweites Argument (God-Mode); die GP5-Fassung `createPlayer(spawn)` verschluckte
# es und haette den God-Mode im Proof stillschweigend abgeschaltet.
WRAP_PLAYER = """
export * from './player.js?real=1';
import { createPlayer as __cp } from './player.js?real=1';
export function createPlayer(...a) {
  const p = __cp(...a);
  window.__player = p;
  window.__playerArgs = a.length;
  return p;
}
"""

WRAP_ENEMIES = """
export * from './enemies.js?real=1';
import { updateEnemies as __ue, updateDrops as __ud,
         createSkeleton as __cs, createGhoul as __cg,
         createHound as __ch, createRust as __cr,
         createEnemy as __ce } from './enemies.js?real=1';
window.__mkEnemy = { skeleton: __cs, ghoul: __cg, hound: __ch, rust: __cr, enemy: __ce };
export function updateEnemies(dt, enemies, player, map, drops, events) {
  window.__enemies = enemies;
  window.__drops = drops;
  return __ue(dt, enemies, player, map, drops, events);
}
export function updateDrops(dt, drops, player, events) {
  window.__drops = drops;
  return __ud(dt, drops, player, events);
}
"""

WRAP_PROJECTILES = """
export * from './projectiles.js?real=1';
import { createProjectiles as __cpj } from './projectiles.js?real=1';
export function createProjectiles(...a) {
  const pj = __cpj(...a);
  window.__projectiles = pj;
  return pj;
}
"""

WRAP_PROPS = """
export * from './props.js?real=1';
import { updateProps as __up } from './props.js?real=1';
export function updateProps(dt, props, player, map, drops, events) {
  window.__props = props;
  return __up(dt, props, player, map, drops, events);
}
"""

# NEU (GP6): __noCanopyShadow. Der Kronen-Schatten laeuft seit §5.3 in einem
# ZWEITEN Durchgang INNERHALB von map.draw('ground') — er ist von aussen nicht
# einzeln abschaltbar. Der Wrapper legt deshalb einen Proxy um das
# tileCanvases-Objekt, der die Schatten-Keys als undefined meldet; tilemap.js
# zeichnet dann still nichts (`if (shimg)` / `if (ximg)`), alles andere bleibt
# byte-gleich. Kein Eingriff in die Spieldatei.
WRAP_TILEMAP = """
export * from './tilemap.js?real=1';
import { createTilemap as __ct, litDitherCells as __ldc } from './tilemap.js?real=1';
export function litDitherCells(...a) {
  if (window.__noLitDither) return [];
  return __ldc(...a);
}
export function createTilemap(rows, legend, overRows = null) {
  const m = __ct(rows, legend, overRows);
  window.__map = m;
  const __draw = m.draw;
  // (...rest)-DURCHREICHUNG (GP6 R2, Muster WRAP_PLAYER): draw() bekommt seit
  // dem P0-A-Fix ein SECHSTES Argument (opts mit der Spielerkachel, tilemap.js).
  // Die R1-Fassung verschluckte es — die Over-Kronen waeren im Proof wieder
  // voll deckend gezeichnet worden und der Fix im Beweismaterial unsichtbar.
  m.draw = function (ctx, camera, tiles, timeSec, layer, ...rest) {
    window.__timeSec = timeSec;
    window.__camera = { x: camera.x, y: camera.y };
    window.__tiles = tiles;
    window.__drawArgs = 5 + rest.length;
    if (window.__noOver && layer === 'over') return undefined;
    let t = tiles;
    if (window.__noCanopyShadow) {
      t = new Proxy(tiles, { get: (o, k) => (typeof k === 'string'
        && k.indexOf('canopy_shadow') === 0) ? undefined : o[k] });
    }
    return __draw(ctx, camera, t, timeSec, layer, ...rest);
  };
  return m;
}
"""

WRAP_PARTICLES = """
export * from './particles.js?real=1';
import { createParticles as __cp } from './particles.js?real=1';
export function createParticles(...a) {
  const p = __cp(...a);
  window.__particles = p;
  return p;
}
"""

WRAP_HUD = """
export * from './hud.js?real=1';
import { drawFog as __df, drawVignette as __dv } from './hud.js?real=1';
export function drawFog(...a) { if (window.__noFog) return undefined; return __df(...a); }
export function drawVignette(...a) { if (window.__noVignette) return undefined; return __dv(...a); }
"""

# __noLight (A/B), __ambientOverride (Ton-Klassifikation M1), __snap (Lichter/
# ambient/tint/timeSec des GEZEICHNETEN Frames) und die Perf-Zeitreihe __lt
# (Muster .tmp/gp6_p0a_perf.py: der uebersprungene Aufruf wird MITGEMESSEN,
# sonst waere die Negativ-Kontrolle eine Tautologie).
WRAP_LIGHTING = """
export * from './lighting.js?real=1';
import { createLighting as __cl } from './lighting.js?real=1';
export function createLighting(viewW, viewH) {
  const L = __cl(viewW, viewH);
  const __draw = L.draw;
  window.__lt = [];
  L.draw = function (ctx, camera, lights, ambient, timeSec, tint) {
    window.__snap = { camera: { x: camera.x, y: camera.y }, ambient, timeSec, tint,
      lights: lights.map((l) => ({ x: l.x, y: l.y, radius: l.radius, flicker: l.flicker || 0 })) };
    const amb = (typeof window.__ambientOverride === 'number') ? window.__ambientOverride : ambient;
    // Positiv-Kontrolle der Perf-Messung: Lichtliste verdoppelt (Muster P0a),
    // die Kopien VERSETZT — lightRuns partitioniert die VEREINIGUNG der
    // Bounding-Boxen, deckungsgleiche Kopien erzeugen also kaum Mehrarbeit und
    // waeren als Kontrolle wirkungslos.
    const ls = window.__doppelLichter
      ? lights.concat(
          lights.map((l) => ({ x: l.x + 80, y: l.y + 48, radius: l.radius, flicker: l.flicker })),
          lights.map((l) => ({ x: l.x - 80, y: l.y - 48, radius: l.radius, flicker: l.flicker })))
      : lights;
    const t0 = window.__origNow();
    let r;
    if (!window.__noLight) {
      // POSITIV-KONTROLLE der MESSUNG: derselbe Pass zweimal im Messfenster —
      // die Zeit muss ~2x steigen, sonst misst die Sonde nicht den echten Aufruf.
      if (window.__doppelPass) __draw.call(L, ctx, camera, ls, amb, timeSec, tint);
      r = __draw.call(L, ctx, camera, ls, amb, timeSec, tint);
    }
    window.__lt.push(window.__origNow() - t0);
    return r;
  };
  return L;
}
"""

WRAPPERS = {
    "player.js": WRAP_PLAYER,
    "enemies.js": WRAP_ENEMIES,
    "projectiles.js": WRAP_PROJECTILES,
    "props.js": WRAP_PROPS,
    "tilemap.js": WRAP_TILEMAP,
    "particles.js": WRAP_PARTICLES,
    "hud.js": WRAP_HUD,
    "lighting.js": WRAP_LIGHTING,
}

ROUTE_RE = re.compile(
    r".*/js/(entities/(player|enemies|projectiles|props)|world/tilemap|core/particles"
    r"|core/lighting|ui/hud)\.js$")


def route_handler(route):
    name = route.request.url.rsplit("/", 1)[-1]
    route.fulfill(status=200, content_type="text/javascript", body=WRAPPERS[name])


def make_page(ctx):
    page = ctx.new_page()
    page.on("console", lambda m: (errors if m.type == "error" else warnings).append(
        f"console.{m.type}: {m.text}") if m.type in ("error", "warning") else None)
    page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
    return page


def start(page, url):
    page.goto(url, wait_until="load")
    page.wait_for_timeout(700)
    page.keyboard.press("Enter")
    page.wait_for_function("() => !!window.__player")
    page.wait_for_timeout(400)


def open_map(pw, url, gpu_args=None):
    browser = pw.chromium.launch(args=gpu_args or [])
    ctx = browser.new_context(viewport={"width": 1280, "height": 720}, device_scale_factor=1)
    ctx.route(ROUTE_RE, route_handler)
    ctx.add_init_script(INIT_JS)
    page = make_page(ctx)
    start(page, url)
    page.evaluate("() => { window.__noLight = false; window.__noTint = false; "
                  "window.__noFog = false; window.__noVignette = false; window.__noOver = false; "
                  "window.__noCanopyShadow = false; window.__ambientOverride = null; "
                  # SLICE 5: die Game-Feel-Schalter werden hier NICHT
                  # zurueckgesetzt, sondern bekraeftigt — sie sollen in jeder
                  # Messung dieses Rigs AN bleiben (Effekt aus, s. INIT_JS).
                  "window.__noShake = true; window.__noFlash = true; "
                  "window.__noAudio = true; }")
    return browser, ctx, page


def set_scale(page, s):
    page.evaluate(f"window.__timeScale = {s}")


def frozen(page):
    return page.evaluate("window.__frozen === true")


def arm_freeze(page, cond, timeout_ms=12000):
    page.evaluate("([c, t]) => window.__armFreeze(c, t)", [cond, timeout_ms])


def wait_frozen(page, timeout=14000):
    page.wait_for_function(
        "() => window.__frozen === true || window.__freezeTimedOut === true", timeout=timeout)
    return frozen(page)


def counter_cond(rate, target):
    return ("() => { var t = window.__timeSec; if (typeof t !== 'number') return false;"
            " var ph = t*" + repr(float(rate)) + "; var f = Math.floor(ph); var fr = ph - f;"
            " return f === " + str(int(target)) + " && fr > 0.30 && fr < 0.70; }")


def phase_cond(t, raster=M1_PHASEN_RASTER):
    """Einfrier-Bedingung auf eine FESTE Zeit-Phase (Rev 2.3 / M1-PHASEN).
    Gerastert wird auf 1/raster s: die Bedingung haelt genau in der MITTE der
    Zelle, in der t liegt (fr 0,40..0,60). Das Fenster ist 0,2/raster s = 25 ms
    breit und damit bei 60 Hz (16,7 ms Frameabstand) garantiert treffbar —
    dieselbe Bedingung, mit der die Phasen-Diagnose gemessen wurde, die zu
    Rev 2.3 gefuehrt hat (.tmp/g6r1w_m1_phasen.py)."""
    n = int(round(t * raster))
    return ("() => { var t = window.__timeSec; if (typeof t !== 'number') return false;"
            " var ph = t*" + str(int(raster)) + "; var f = Math.floor(ph); var fr = ph - f;"
            " return f === " + str(n) + " && fr > 0.40 && fr < 0.60; }")


def time_now(page):
    return page.evaluate("() => window.__timeSec")


def teleport(page, cx, cy):
    page.evaluate("([x,y])=>{const p=window.__player; p.x=x-p.w/2; p.y=y-p.h/2;}", [cx, cy])


def calm(page, clear_world=True):
    page.evaluate("""(clearWorld) => {
      const p = window.__player;
      if (p) {
        p.knockTimer = 0; p.knockX = 0; p.knockY = 0;
        p.invulnTimer = 0; p.attackTimer = 0;
        if (p.state !== 'dead') p.state = 'idle';
        p.hp = p.maxHp;
      }
      if (clearWorld) {
        if (window.__enemies) window.__enemies.length = 0;
        if (window.__props) window.__props.length = 0;
        if (window.__drops) window.__drops.length = 0;
      }
      if (window.__projectiles && window.__projectiles.list) window.__projectiles.list.length = 0;
    }""", clear_world)


def place(page, cx, cy, clear_world=True):
    calm(page, clear_world)
    page.wait_for_timeout(80)
    teleport(page, cx, cy)
    page.wait_for_timeout(120)
    calm(page, clear_world)
    teleport(page, cx, cy)
    page.wait_for_timeout(120)


def pin(page, cx, cy, clear_enemies=True):
    """Haelt den Spieler (und optional die Gegnerliste) bis clear_pin() fest —
    Muster .tmp/gp6_p0a_e2.py. Noetig, wo ein Treffer die Kamera verschoebe."""
    page.evaluate("""([x, y, ce]) => {
      if (window.__pin) clearInterval(window.__pin);
      window.__pin = setInterval(() => {
        const p = window.__player; if (!p) return;
        p.x = x - p.w / 2; p.y = y - p.h / 2;
        p.knockTimer = 0; p.knockX = 0; p.knockY = 0; p.hp = p.maxHp;
        if (p.state !== 'dead') p.state = 'idle';
        if (ce && window.__enemies) window.__enemies.length = 0;
        if (window.__projectiles && window.__projectiles.list) window.__projectiles.list.length = 0;
      }, 16);
    }""", [cx, cy, clear_enemies])


def clear_pin(page):
    page.evaluate("() => { if (window.__pin) { clearInterval(window.__pin); window.__pin = null; } }")


def clear_particles(page):
    page.evaluate("() => { if (window.__particles) window.__particles.list.length = 0; }")


def pstate(page):
    return page.evaluate("""() => {
      const p = window.__player; if (!p) return null;
      return { cx: p.x + p.w/2, cy: p.y + p.h/2, hp: p.hp, state: p.state, facing: p.facing };
    }""")


def get_camera(page):
    return page.evaluate("() => window.__camera ? { x: window.__camera.x, y: window.__camera.y } : null")


def get_snap(page):
    return page.evaluate("() => window.__snap")


def tcx(tx):
    return tx * TILE + TILE // 2


# ---------------------------------------------------------------------------
# settle_camera + GANZZAHL-ASSERTION (in ALLEN Szenen, Rig-Disziplin aus GP5)
# ---------------------------------------------------------------------------
def settle_camera(page, scene, target=None, tries=8, soll=None):
    def run():
        set_scale(page, 1.0)
        prev = get_camera(page)
        cur = prev
        for _ in range(tries):
            page.wait_for_timeout(350)
            cur = get_camera(page)
            if prev and cur and abs(cur["x"] - prev["x"]) < 0.5 and abs(cur["y"] - prev["y"]) < 0.5:
                break
            prev = cur
        return cur

    cur = run()
    if target and cur and (abs(cur["x"] - round(cur["x"])) > 1e-6
                           or abs(cur["y"] - round(cur["y"])) > 1e-6):
        print(f"  [cam] {scene}: Nachsetzen (Kamera stand bei {cur})")
        place(page, *target)
        cur = run()
    assert_int_camera(cur, scene)
    if soll and cur and (abs(cur["x"] - soll[0]) > 1e-6 or abs(cur["y"] - soll[1]) > 1e-6):
        errors.append(f"{scene}: Kamera {cur} statt der Spec-Kamera {soll}")
        print(f"  [cam] {scene}: SOLL {soll} VERFEHLT")
    cams[scene] = cur
    return cur


def assert_int_camera(cam, scene):
    if not cam:
        errors.append(f"{scene}: KEINE Kamera erfasst (Ganzzahl-Assertion nicht pruefbar)")
        return False
    dx = abs(cam["x"] - round(cam["x"]))
    dy = abs(cam["y"] - round(cam["y"]))
    ok = dx < 1e-6 and dy < 1e-6
    if not ok:
        errors.append(f"{scene}: GANZZAHL-ASSERTION verletzt — Kamera "
                      f"({cam['x']}, {cam['y']}) ist nicht ganzzahlig")
    print(f"  [cam] {scene}: ({cam['x']}, {cam['y']}) ganzzahlig={ok}")
    return ok


# ---------------------------------------------------------------------------
# Bild-Werkzeug — ALLE Messungen auf dem 320x180-Backing-Store
# ---------------------------------------------------------------------------
def backing_store(page):
    url = page.evaluate("() => document.getElementById('game').toDataURL('image/png')")
    im = Image.open(io.BytesIO(base64.b64decode(url.split(",", 1)[1]))).convert("RGB")
    if im.size != (VIEW_W, VIEW_H):
        errors.append(f"Backing-Store {im.size} statt {(VIEW_W, VIEW_H)} — Messung ungueltig")
    return im


def arr(im):
    return np.asarray(im).astype(np.float64)


def lum(a):
    return 0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2]


def save_scene(tag, im, note="", cam=None):
    """Vollszene: 320x180-Backing-Store, fuer die Jury 4x NEAREST hochskaliert
    (informationsgleich). Die Messung laeuft IMMER auf dem 320x180-Original."""
    p = f"{OUT}/{tag}.png"
    im.resize((VIEW_W * SCENE_ZOOM, VIEW_H * SCENE_ZOOM), Image.NEAREST).save(p)
    raw = f"{OUT}/raw_{tag}.png"
    im.save(raw)
    scenes[tag] = {"datei": f"{tag}.png", "roh": f"raw_{tag}.png", "zoom": SCENE_ZOOM,
                   "cam": cam, "note": note}
    print(f"  [szene] {tag}.png ({SCENE_ZOOM}x) + raw_{tag}.png")
    return p


def crop_zoom(tag, im, rect, cam=None, kind="world", zoom=ZOOM, note=""):
    """Crop aus dem 320x180-Backing-Store, NEAREST vergroessert.
    kind='world' -> rect = (wl,wt,wr,wb) Weltkoordinaten (braucht cam),
    kind='screen' -> rect = (sl,st,sr,sb) interne Screen-Koordinaten."""
    if kind == "world":
        if not cam:
            errors.append(f"crop {tag}: keine Kamera")
            return None
        box = (int(round(rect[0] - cam["x"])), int(round(rect[1] - cam["y"])),
               int(round(rect[2] - cam["x"])), int(round(rect[3] - cam["y"])))
    else:
        box = tuple(int(round(v)) for v in rect)
    box = (max(0, box[0]), max(0, box[1]), min(VIEW_W, box[2]), min(VIEW_H, box[3]))
    sub = im.crop(box)
    out = sub.resize((sub.width * zoom, sub.height * zoom), Image.NEAREST)
    path = f"{OUT}/{tag}.png"
    out.save(path)
    ml = float(np.mean(lum(arr(sub)))) if sub.width and sub.height else 0.0
    crops[tag] = {"kind": kind, "rect": list(rect), "cam": cam, "screen_box": list(box),
                  "texels": [sub.width, sub.height], "zoom": zoom,
                  "mean_lum": round(ml, 1), "note": note}
    print(f"  [crop] {tag}.png {out.size} {kind}-rect={rect} texel={sub.width}x{sub.height} lum={ml:.1f}")
    return path


def join_panels(panels, sep_w=2):
    h = max(p.height for p in panels)
    total = sum(p.width for p in panels) + sep_w * (len(panels) - 1)
    out = Image.new("RGB", (total, h), MAGENTA)
    x = 0
    for i, p in enumerate(panels):
        out.paste(p, (x, 0))
        x += p.width
        if i < len(panels) - 1:
            x += sep_w
    return out


def save_strip(tag, ims, rect, zoom=ZOOM, sep_w=2, note="", meta=None):
    panels = []
    for im in ims:
        sub = im.crop(tuple(int(v) for v in rect))
        panels.append(sub.resize((sub.width * zoom, sub.height * zoom), Image.NEAREST))
    out = join_panels(panels, sep_w)
    path = f"{OUT}/{tag}.png"
    out.save(path)
    strips[tag] = {"panels": len(panels), "screen_rect": list(rect), "zoom": zoom,
                   "size": list(out.size), "note": note, "meta": meta}
    print(f"  [strip] {tag}.png {out.size} ({len(panels)} Panels)")
    return path


# ---------------------------------------------------------------------------
# Ton-Klassifikation (M1-Goodhart-Gegen-Gate)
# ---------------------------------------------------------------------------
def palette_klasse(px_arr, tol=10.0):
    """Nearest-Palette-Key je Texel; > tol Abstand -> None ('gemischt').
    px_arr: (...,3). Liefert Array mit Indizes in PAL_KEYS bzw. -1."""
    flat = px_arr.reshape(-1, 3)
    d = np.linalg.norm(flat[:, None, :] - PAL_RGB[None, :, :], axis=2)
    idx = np.argmin(d, axis=1)
    best = d[np.arange(len(idx)), idx]
    idx = np.where(best <= tol, idx, -1)
    return idx.reshape(px_arr.shape[:-1])


def cluster_count(mask):
    """Anzahl zusammenhaengender Cluster (4-Nachbarschaft) in einer bool-Maske."""
    H, W = mask.shape
    seen = np.zeros_like(mask, dtype=bool)
    n = 0
    for y in range(H):
        for x in range(W):
            if not mask[y, x] or seen[y, x]:
                continue
            n += 1
            stack = [(y, x)]
            seen[y, x] = True
            while stack:
                cy, cx = stack.pop()
                for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    ny, nx = cy + dy, cx + dx
                    if 0 <= ny < H and 0 <= nx < W and mask[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        stack.append((ny, nx))
    return n


# ---------------------------------------------------------------------------
# 3-Kanal-Schaetzer der Restdunkelheit a (Muster gp6_landkarte_lichtprobe_live)
#   out = src*(1-a) + tint*a  ->  a = ((src-out)·(src-tint)) / |src-tint|^2
#   src = B (Licht aus), out = A (Licht an), tint = mapDef.ambientTint
# ---------------------------------------------------------------------------
A_MIN_NORM2 = 3 * 40 * 40        # |B-tint|^2-Untergrenze (P0-Wert, Rauschsperre)


def a_map(A_im, B_im, tint):
    a = arr(A_im)
    b = arr(B_im)
    t = np.array(tint, dtype=np.float64)
    d = b - t
    nn = (d * d).sum(axis=2)
    num = ((b - a) * d).sum(axis=2)
    with np.errstate(divide="ignore", invalid="ignore"):
        val = np.where(nn >= A_MIN_NORM2, num / np.maximum(nn, 1e-9), np.nan)
    return val


def hex2rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def torch_geometrie(snap, nur_fackeln=True):
    """Bild-Koordinaten und WIRKSAMER Radius je Licht des eingefrorenen Frames —
    exakt nach core/lighting.js:210-232 (Flicker-Wob, 2-px-Radiusrundung,
    Round auf Bildkoordinaten)."""
    out = []
    cam = snap["camera"]
    t = snap["timeSec"]
    for l in snap["lights"]:
        fl = l.get("flicker", 0) or 0
        if nur_fackeln and fl < 0.8:
            continue
        wob = (math.sin(t * 13 + l["x"] * 7) * 0.6
               + math.sin(t * 8.3 + l["y"] * 5 + l["x"] * 3) * 0.4)
        r = round(l["radius"] * (1 + fl * 0.1 * wob) / 2) * 2
        cx = round(l["x"] - cam["x"])
        cy = round(l["y"] - cam["y"])
        if cx + r < 0 or cx - r > VIEW_W or cy + r < 0 or cy - r > VIEW_H:
            continue
        out.append({"wx": l["x"], "wy": l["y"], "sx": cx, "sy": cy, "r": r,
                    "flicker": fl, "radius_nominal": l["radius"]})
    return out


# ===========================================================================
# M1 BELICHTUNG — 5 Szenen (GP5-Kameras), HUD-Maske, Median/Highlight/L<16,
# Goodhart-Gegen-Gate, Positiv- und Negativ-Kontrolle.
# ===========================================================================
# Die Kameras sind die der GP5-Jury-Szenen (Vergleichbarkeit mit der
# Juror-Messung und mit der P0-Vormessung, die E1 geeicht hat):
#   g5_01 -> (280,190) · g5_02 -> (320,110) · g5_03 -> (120,0)
#   g5_04 (FLUESTERGRUFT) und g5_06 (BOSS_KAMMER) klemmen am Kartenrand.
M1_SZENEN = [
    ("g6_01_friedhof_teich",    "GRAVEYARD",     "/",                   (tcx(27), tcx(17)), (280, 190)),
    ("g6_02_friedhof_waldrand", "GRAVEYARD",     "/",                   (596, tcx(12)),     (320, 110)),
    ("g6_03_katakomben_halle",  "CATACOMBS",     "/?map=CATACOMBS",     (tcx(17), tcx(4)),  (120, 0)),
    ("g6_04_gruft_kanal",       "FLUESTERGRUFT", "/?map=FLUESTERGRUFT", (tcx(20), tcx(14)), None),
    ("g6_05_boss_arena",        "BOSS_KAMMER",   "/?map=BOSS_KAMMER",   (tcx(10), tcx(9)),  None),
]


def hold_boss(page):
    page.evaluate("""() => {
      if (window.__hold) clearInterval(window.__hold);
      window.__hold = setInterval(() => {
        const b = (window.__enemies || []).find(e => e.kind === 'graveward');
        if (b) { b.state = 'idle'; b.marker = null; b.stateTimer = 0;
                 b.x = 10*16 - b.w/2 + 8; b.y = 4*16 - b.h/2 + 8; }
        const p = window.__player;
        if (p) { p.knockTimer = 0; p.knockX = 0; p.knockY = 0; p.hp = p.maxHp; }
        if (window.__projectiles && window.__projectiles.list) window.__projectiles.list.length = 0;
      }, 30);
    }""")


def m1_kennzahlen(im, hl_L):
    a = arr(im)
    L = lum(a)[MASK]
    return {
        "n_texel": int(L.size),
        "median": round(float(np.median(L)), 2),
        "mittel": round(float(L.mean()), 2),
        "P25": round(float(np.percentile(L, 25)), 2),
        "P75": round(float(np.percentile(L, 75)), 2),
        "highlight_L": hl_L,
        "highlight_pct": round(float((L > hl_L).mean() * 100), 3),
        "unter16_pct": round(float((L < 16).mean() * 100), 3),
    }


def m1_goodhart(im_ist, im_pur, hl_L, aussen):
    """Highlight-Texel (L > hl_L, HUD maskiert) nach PALETTENTON klassifizieren.
    Der Ton wird am SELBEN Texel des palette-puren Frames (ambient 0, Vignette
    aus, identischer eingefrorener Augenblick) abgelesen — im belichteten Bild
    ist die Palettenfarbe durch Overlay/Tint verschoben und nicht mehr
    zuordenbar. Anteile laufen ueber die ZUORDENBAREN Texel; der nicht
    zuordenbare Rest (Tint-Masken, Nebel, Partikel) wird getrennt ausgewiesen."""
    L = lum(arr(im_ist))
    hl = (L > hl_L) & MASK
    n_hl = int(hl.sum())
    idx = palette_klasse(arr(im_pur))
    klassen = {}
    ys, xs = np.nonzero(hl)
    for y, x in zip(ys, xs):
        k = idx[y, x]
        name = PAL_KEYS[k] if k >= 0 else "(gemischt)"
        klassen[name] = klassen.get(name, 0) + 1
    zuordenbar = sum(v for k, v in klassen.items() if k != "(gemischt)")
    anteile = {k: round(100.0 * v / max(1, zuordenbar), 2)
               for k, v in klassen.items() if k != "(gemischt)"}
    top = sorted(anteile.items(), key=lambda kv: -kv[1])
    cluster = cluster_count(hl)
    grenze = M1_GOODHART_EINZEL_AUSSEN if aussen else M1_GOODHART_EINZEL_INNEN
    ok = (len(anteile) >= M1_GOODHART_KLASSEN and cluster >= M1_GOODHART_CLUSTER
          and (not top or top[0][1] <= grenze))
    return {
        "highlight_texel": n_hl, "zuordenbar": zuordenbar,
        "gemischt": klassen.get("(gemischt)", 0),
        "ton_klassen": len(anteile), "ton_klassen_soll": M1_GOODHART_KLASSEN,
        "cluster": cluster, "cluster_soll": M1_GOODHART_CLUSTER,
        "anteile_pct": dict(top[:8]),
        "groesster_einzelton": (top[0] if top else None),
        "einzelton_grenze_pct": grenze,
        "pass": bool(ok),
    }


def m1_phase(page, spec):
    """EIN Phasenpunkt: IST-Frame plus palette-purer Zwilling DESSELBEN
    eingefrorenen Augenblicks (die Zeit steht, __timeScale == 0), daraus
    Kennzahlen und Goodhart-Gegen-Gate."""
    ist = backing_store(page)
    page.evaluate("() => { window.__ambientOverride = 0; window.__noVignette = true; }")
    page.wait_for_timeout(180)
    pur = backing_store(page)
    page.evaluate("() => { window.__ambientOverride = null; window.__noVignette = false; }")
    page.wait_for_timeout(120)
    kz = m1_kennzahlen(ist, spec["hl_L"])
    gh = m1_goodhart(ist, pur, spec["hl_L"], spec["aussen"])
    return ist, pur, kz, gh


def m1(pw):
    print(f"== M1 BELICHTUNG (5 Szenen, GP5-Kameras, {len(M1_PHASEN)} FESTE PHASEN "
          f"{M1_PHASEN[0]}..{M1_PHASEN[-1]} s, Median ueber die Phasen) ==")
    ergebnis = {}
    bilder = {}
    kanal_crop = None
    for tag, karte, url, ziel, sollcam in M1_SZENEN:
        spec = M1_KARTEN[karte]
        browser, ctx, page = open_map(pw, BASE + url)
        if karte == "BOSS_KAMMER":
            page.wait_for_timeout(800)
            hold_boss(page)
            place(page, *ziel, clear_world=False)
        else:
            place(page, *ziel)
        cam = settle_camera(page, tag, ziel, soll=sollcam)
        page.wait_for_timeout(200)

        # ---- Rev 2.3 (M1-PHASEN): 8 feste Einfrier-Phasen, 1-s-Raster -----
        phasen, frames = [], {}
        for ph in M1_PHASEN:
            set_scale(page, 1.0)
            t_vor = time_now(page)
            if isinstance(t_vor, (int, float)) and t_vor > ph:
                errors.append(f"M1 {tag}: Phase {ph} s bereits verstrichen (Aufbau endete "
                              f"bei t={t_vor:.4f}) — Phase NICHT gemessen")
                print(f"  [{tag}] Phase {ph}: VERPASST (t={t_vor:.4f})")
                continue
            arm_freeze(page, phase_cond(ph), 30000)
            if not wait_frozen(page, 32000):
                errors.append(f"M1 {tag}: Einfrieren auf Phase {ph} s FEHLGESCHLAGEN")
                print(f"  [{tag}] Phase {ph}: EINFRIEREN FEHLGESCHLAGEN")
                continue
            page.wait_for_timeout(120)
            t_frz = time_now(page)
            ist_p, pur_p, kz_p, gh_p = m1_phase(page, spec)
            p_med = spec["median"][0] <= kz_p["median"] <= spec["median"][1]
            p_hl = kz_p["highlight_pct"] >= spec["hl_min"]
            p_dk = kz_p["unter16_pct"] <= spec["dunkel_max"]
            phasen.append({
                "phase_soll_s": ph, "t": round(float(t_frz), 4),
                "median": kz_p["median"], "highlight_pct": kz_p["highlight_pct"],
                "unter16_pct": kz_p["unter16_pct"],
                "ton_klassen": gh_p["ton_klassen"], "cluster": gh_p["cluster"],
                "groesster_einzelton": gh_p["groesster_einzelton"],
                "median_pass": p_med, "highlight_pass": p_hl, "unter16_pass": p_dk,
                "goodhart_pass": gh_p["pass"],
                "pass": bool(p_med and p_hl and p_dk and gh_p["pass"])})
            frames[ph] = (ist_p, pur_p, kz_p, gh_p)
            print(f"  [{tag}] Phase {ph:5.2f} s (t={float(t_frz):7.4f}): Median "
                  f"{kz_p['median']:6.2f} | HL {kz_p['highlight_pct']:6.3f} % | L<16 "
                  f"{kz_p['unter16_pct']:6.3f} % | Ton {gh_p['groesster_einzelton']} | "
                  f"{'gruen' if phasen[-1]['pass'] else 'ROT'}")
        if not phasen:
            errors.append(f"M1 {tag}: KEINE einzige Phase gemessen — Szene ungueltig")
            ctx.close(); browser.close()
            continue
        if len(phasen) < len(M1_PHASEN):
            errors.append(f"M1 {tag}: nur {len(phasen)} von {len(M1_PHASEN)} Phasen "
                          f"gemessen — der Phasen-Median steht auf unvollstaendiger Basis")

        # MEDIAN ueber die Phasen — je Kennzahl einzeln (Rev 2.3).
        med_med = round(float(statistics.median([p["median"] for p in phasen])), 3)
        hl_med = round(float(statistics.median([p["highlight_pct"] for p in phasen])), 3)
        dk_med = round(float(statistics.median([p["unter16_pct"] for p in phasen])), 3)
        kl_med = round(float(statistics.median([p["ton_klassen"] for p in phasen])), 2)
        cl_med = round(float(statistics.median([p["cluster"] for p in phasen])), 2)
        ez_med = round(float(statistics.median(
            [(p["groesster_einzelton"][1] if p["groesster_einzelton"] else 0.0)
             for p in phasen])), 2)
        # Repraesentative Phase (Bild-/Crop-Quelle): die Phase, deren Median dem
        # Phasen-Median am naechsten liegt; bei Gleichstand die FRUEHESTE.
        repr_i = min(range(len(phasen)),
                     key=lambda i: (abs(phasen[i]["median"] - med_med), i))
        repr_ph = phasen[repr_i]["phase_soll_s"]
        ist, pur, kz, gh = frames[repr_ph]
        snap = get_snap(page)
        kanal = None
        if karte == "FLUESTERGRUFT":
            # §6.1 Uferring: die Kacheln mit depthOverlays 'water_shallow_vert'
            # (map_fluestergruft.js:107) im Kamerafenster suchen — daraus wird
            # der Pflicht-Crop (c) Kanal-Ufer geschnitten.
            kanal = page.evaluate("""([cx, cy]) => {
              const m = window.__map, out = [];
              for (let ty = Math.floor(cy / 16); ty <= Math.floor((cy + 180) / 16); ty++) {
                for (let tx = Math.floor(cx / 16); tx <= Math.floor((cx + 320) / 16); tx++) {
                  const d = m.defAt(tx, ty);
                  if (d && d.depthOverlays && d.depthOverlays.indexOf('water_shallow_vert') >= 0)
                    out.push({ tx, ty, art: d.art });
                }
              }
              return out; }""", [cam["x"], cam["y"]])
        camE = get_camera(page)
        assert_int_camera(camE, tag + "_ende")
        ctx.close(); browser.close()

        save_scene(tag, ist, note=f"M1 {karte}, Kamera {cam}, repraesentative Phase "
                                  f"{repr_ph} s (Median der 8 Phasen)", cam=cam)
        pur.resize((VIEW_W * SCENE_ZOOM, VIEW_H * SCENE_ZOOM), Image.NEAREST).save(
            f"{OUT}/{tag}_palette_pur.png")
        bilder[tag] = (ist, pur, cam, snap)

        # GATE-ENTSCHEID auf den PHASEN-MEDIANEN (Rev 2.3), nicht auf einem
        # einzelnen Augenblick. Schwellen unveraendert.
        med_ok = spec["median"][0] <= med_med <= spec["median"][1]
        hl_ok = hl_med >= spec["hl_min"]
        dk_ok = dk_med <= spec["dunkel_max"]
        grenze = M1_GOODHART_EINZEL_AUSSEN if spec["aussen"] else M1_GOODHART_EINZEL_INNEN
        gh_ok = (kl_med >= M1_GOODHART_KLASSEN and cl_med >= M1_GOODHART_CLUSTER
                 and ez_med <= grenze)
        ok = med_ok and hl_ok and dk_ok and gh_ok
        if karte == "FLUESTERGRUFT":
            kanal_crop = kanal
        ergebnis[tag] = {
            "karte": karte, "kamera": cam, "ambient": snap.get("ambient") if snap else None,
            "verfahren": f"Rev 2.3 (M1-PHASEN): arm_freeze auf {len(M1_PHASEN)} FESTE "
                         f"Phasen {M1_PHASEN[0]}..{M1_PHASEN[-1]} s (1-s-Raster, "
                         f"Einfrier-Fenster 1/{M1_PHASEN_RASTER} s); je Kennzahl zaehlt "
                         f"der MEDIAN ueber die Phasen. Schwellen unveraendert.",
            "phasen_soll_s": list(M1_PHASEN), "phasen_gemessen": len(phasen),
            "phasen": phasen,
            "repraesentative_phase_s": repr_ph,
            "repraesentative_phase_t": phasen[repr_i]["t"],
            "repraesentative_phase_hinweis": "Bild-/Crop-Quelle dieser Szene: die Phase, "
                                             "deren Median dem Phasen-Median am naechsten "
                                             "liegt (kein Gate-Einfluss)",
            "n_texel": kz["n_texel"], "highlight_L": kz["highlight_L"],
            "median": med_med, "highlight_pct": hl_med, "unter16_pct": dk_med,
            "median_spanne": [min(p["median"] for p in phasen),
                              max(p["median"] for p in phasen)],
            "highlight_spanne": [min(p["highlight_pct"] for p in phasen),
                                 max(p["highlight_pct"] for p in phasen)],
            "unter16_spanne": [min(p["unter16_pct"] for p in phasen),
                               max(p["unter16_pct"] for p in phasen)],
            "phasen_alle_einzeln_gruen": all(p["pass"] for p in phasen),
            "median_band": list(spec["median"]), "median_pass": med_ok,
            "highlight_min_pct": spec["hl_min"], "highlight_pass": hl_ok,
            "unter16_max_pct": spec["dunkel_max"], "unter16_pass": dk_ok,
            "goodhart": {
                "verfahren": "Median der Phasen-Werte je Groesse (Rev 2.3)",
                "ton_klassen": kl_med, "ton_klassen_soll": M1_GOODHART_KLASSEN,
                "cluster": cl_med, "cluster_soll": M1_GOODHART_CLUSTER,
                "groesster_einzelton_pct": ez_med, "einzelton_grenze_pct": grenze,
                "einzelton_je_phase": [p["groesster_einzelton"] for p in phasen],
                "ton_klassen_je_phase": [p["ton_klassen"] for p in phasen],
                "cluster_je_phase": [p["cluster"] for p in phasen],
                "repraesentative_phase_detail": gh,
                "pass": bool(gh_ok)},
            "pass": ok,
        }
        print(f"  [{tag}] {karte} PHASEN-MEDIAN ({len(phasen)} Phasen): Median {med_med} "
              f"(Band {spec['median']}) {'OK' if med_ok else 'ROT'} | Highlight L>"
              f"{spec['hl_L']} {hl_med} % (>= {spec['hl_min']}) {'OK' if hl_ok else 'ROT'} | "
              f"L<16 {dk_med} % (<= {spec['dunkel_max']}) {'OK' if dk_ok else 'ROT'} | "
              f"Goodhart {kl_med} Klassen / {cl_med} Cluster / max Einzelton {ez_med} % "
              f"(<= {grenze}) {'OK' if gh_ok else 'ROT'}")
        if not med_ok:
            errors.append(f"M1 {tag}: Phasen-Median {med_med} ausserhalb {spec['median']}")
        if not hl_ok:
            errors.append(f"M1 {tag}: Highlight-Phasen-Median {hl_med} % < "
                          f"{spec['hl_min']} % (E1)")
        if not dk_ok:
            errors.append(f"M1 {tag}: L<16-Phasen-Median {dk_med} % > {spec['dunkel_max']} %")
        if not gh_ok:
            errors.append(f"M1 {tag}: Goodhart-Gegen-Gate verletzt (Phasen-Mediane: "
                          f"{kl_med} Klassen, {cl_med} Cluster, groesster Einzelton "
                          f"{ez_med} % > {grenze} %)")

    # ---- KONTROLLEN --------------------------------------------------------
    kontrollen = {}
    if os.path.exists(M1_POSITIV_BILD):
        pim = Image.open(M1_POSITIV_BILD).convert("RGB")
        pl = lum(arr(pim))[MASK] if pim.size == (VIEW_W, VIEW_H) else None
        pmed = round(float(np.median(pl)), 2) if pl is not None else None
        pok = pmed is not None and abs(pmed - M1_POSITIV_MEDIAN) <= M1_POSITIV_TOL
        kontrollen["positiv_gp5_archivbild"] = {
            "datei": M1_POSITIV_BILD, "median": pmed, "soll": M1_POSITIV_MEDIAN,
            "toleranz": M1_POSITIV_TOL, "pass": bool(pok),
            # PRAEZISIERUNG (Jury-R1, Juror M / M-P1): Das ist eine
            # AUSWERTUNGS-Kontrolle, keine Aufnahme-Kontrolle. Gemessen wird
            # eine DATEI-WIEDERHOLUNG (dasselbe GP5-PNG wie im P0-Vorlauf), sie
            # prueft die Kette ab dem PNG (Rec.601, HUD-Maske, Median), NICHT
            # Browser, Backing-Store oder Einfrier-Logik.
            "art": "AUSWERTUNGS-Kontrolle (Datei-Wiederholung)",
            "reichweite": "prueft die Auswertungskette ab dem PNG "
                          "(Rec.601-Luminanz, HUD-Maske, Median-Bildung); die "
                          "AUFNAHME-Kette (Browser, toDataURL, arm_freeze) ist "
                          "dadurch NICHT kontrolliert",
            "hinweis": "GP5-Stand, P0-Vorlauf, IDENTISCHE Auswertungskette "
                       "(320x180-PNG, Rec.601, HUD-Maske)"}
        print(f"  [Auswertungs-Kontrolle+] GP5-Archivbild (Datei-Wiederholung) Median "
              f"{pmed} (Soll {M1_POSITIV_MEDIAN} +-{M1_POSITIV_TOL}) -> "
              f"{'OK' if pok else 'FEHLGESCHLAGEN'}")
    else:
        kontrollen["positiv_gp5_archivbild"] = {"datei": M1_POSITIV_BILD, "pass": False,
                                                "fehler": "Archivbild fehlt"}
    schwarz = Image.new("RGB", (VIEW_W, VIEW_H), (0, 0, 0))
    kz_s = m1_kennzahlen(schwarz, 96)
    nok = kz_s["median"] < M1_NEGATIV_MEDIAN_MAX and kz_s["highlight_pct"] == 0.0
    kontrollen["negativ_schwarzbild"] = {
        "median": kz_s["median"], "highlight_pct": kz_s["highlight_pct"],
        "soll": f"Median < {M1_NEGATIV_MEDIAN_MAX}, Highlight 0", "pass": bool(nok)}
    print(f"  [Kontrolle-] Schwarzbild Median {kz_s['median']}, Highlight "
          f"{kz_s['highlight_pct']} % -> {'OK' if nok else 'FEHLGESCHLAGEN'}")

    kontrollen_ok = all(v.get("pass") for v in kontrollen.values())
    alle = all(v["pass"] for v in ergebnis.values())
    proof_results["M1_belichtung"] = {
        "verfahren": f"Rev 2.3 (M1-PHASEN): {len(M1_PHASEN)} feste Einfrier-Phasen "
                     f"{M1_PHASEN[0]}..{M1_PHASEN[-1]} s (1-s-Raster, arm_freeze wie "
                     f"M2/E2); je Kennzahl entscheidet der MEDIAN ueber die Phasen, die "
                     f"Einzelphasen stehen vollstaendig im Report.",
        "phasen_soll_s": list(M1_PHASEN),
        "szenen": ergebnis, "kontrollen": kontrollen, "kontrollen_ok": kontrollen_ok,
        "threshold": "PHASEN-MEDIAN je Kennzahl: Median-Band + Highlight-Anteil (E1) + "
                     "L<16-Band je Karte, Goodhart: >=3 Tonklassen, >=12 Cluster, "
                     "Einzelton aussen <=60 %/innen <=75 %",
        "pass": bool(alle and kontrollen_ok)}
    if not kontrollen_ok:
        ungueltig.append("M1_belichtung (Kontrolle gescheitert)")
        errors.append("M1: KONTROLLE gescheitert -> Gate UNGUELTIG")

    # ---- Jury-Crops aus den M1-Szenen -------------------------------------
    ist01, _, cam01, _ = bilder["g6_01_friedhof_teich"]
    crop_zoom("g6_crop_g_hud", ist01, (0, 0, 60, 46), kind="screen",
              note="Pflicht-Crop (g) HUD-Panel: XP-Rampe (§6.7a, 3 Zeilen Moosgruen), "
                   "Pixelziffern GOLD/Trank (§6.7b)")
    crop_zoom("g6_crop_d_teich_specular", ist01, TEICH_RECT, cam01,
              note="Pflicht-Crop (d) Teich-Specular: '='-Cluster (§6.4a) auf dem "
                   "Ring-0-Wasser, Welt-Rect wie GP4/GP5 (Vergleichbarkeit)")
    ist02, _, cam02, _ = bilder["g6_02_friedhof_waldrand"]
    crop_zoom("g6_crop_a_wiese", ist02, (560, 176, 608, 224), cam02,
              note="Pflicht-Crop (a) Wiese: Gras-Rampe nach dem Offset (§3.1), "
                   "Wiesenlicht-Klassen, 'u'/'j'-Pools n=5 (§6.5)")
    ist04, _, cam04, _ = bilder["g6_04_gruft_kanal"]
    if kanal_crop:
        txs = [k["tx"] for k in kanal_crop]
        tys = [k["ty"] for k in kanal_crop]
        mx, my = (min(txs) + max(txs)) // 2, (min(tys) + max(tys)) // 2
        rect = (mx * TILE - 24, my * TILE - 24, mx * TILE + 24, my * TILE + 24)
        crop_zoom("g6_crop_c_kanal_ufer", ist04, rect, cam04,
                  note=f"Pflicht-Crop (c) Kanal-Ufer: senkrechter Uferring "
                       f"water_shallow_vert (§6.1), {len(kanal_crop)} Ringkacheln im Bild, "
                       f"Fenster um Kachel ({mx},{my})")
    else:
        warnings.append("Kanal-Ufer-Crop: keine water_shallow_vert-Kachel im Bild")
    ist05, _, cam05, _ = bilder["g6_05_boss_arena"]
    crop_zoom("g6_crop_f_boss_kratzer", ist05, (216, 72, 264, 104), cam05,
              note="Pflicht-Crop (f) Boss-Kratzer kalt (§6.2, 'T'/'m' raus, "
                   "'L'+'k'-Dither), Welt-Rect wie GP5-Crop (e)")
    return bilder


# ===========================================================================
# M2 LICHT-QUANTISIERUNG (3-Kanal-Schaetzer, CATACOMBS-Kamera (40,190))
# ===========================================================================
# MESS-ZONE (bindend, Review P3-M3): Vereinigung der Ringe 0,48r < d <= r ueber
# ALLE Fackeln im Bild, WARM-GLOW-FREI. r ist der WIRKSAME Radius des
# eingefrorenen Frames (lighting.js:227, 2-px-Rundung); die Glow-Scheiben
# (0,48 * r_ungerundet, lighting.js:475) ALLER Fackeln werden abgezogen, dazu
# Boden-Glow (8 px um cy+5) und Hotspot (2,25 px um cy-2/-4) — sie liegen zwar
# innerhalb der Glow-Scheibe, werden aber explizit ausgeschlossen, damit die
# Zone auch bei kleinem Flicker-Radius glow-frei bleibt. HUD-Rechtecke raus.
# HYGIENE: __noFog + __noVignette wie im Spec-genannten Muster
# .tmp/gp6_landkarte_lichtprobe_live.py (die Vignette liegt NACH dem Licht und
# verzerrt den 3-Kanal-Schaetzer multiplikativ).
def mess_zone(snap, torches):
    ys, xs = np.mgrid[0:VIEW_H, 0:VIEW_W]
    ring = np.zeros((VIEW_H, VIEW_W), dtype=bool)
    glow = np.zeros((VIEW_H, VIEW_W), dtype=bool)
    for t in snap["lights"]:
        fl = t.get("flicker", 0) or 0
        if fl < 0.8:
            continue
        wob = (math.sin(snap["timeSec"] * 13 + t["x"] * 7) * 0.6
               + math.sin(snap["timeSec"] * 8.3 + t["y"] * 5 + t["x"] * 3) * 0.4)
        r_un = t["radius"] * (1 + fl * 0.1 * wob)
        r = round(r_un / 2) * 2
        cx = round(t["x"] - snap["camera"]["x"])
        cy = round(t["y"] - snap["camera"]["y"])
        d = np.hypot(xs - cx, ys - cy)
        ring |= (d > M2_RING_INNEN * r) & (d <= r)
        glow |= d <= M2_RING_INNEN * r_un + M2_GLOW_MARGE
        glow |= np.hypot(xs - cx, ys - (cy + 5)) <= 8 + M2_GLOW_MARGE
        glow |= np.hypot(xs - cx, ys - (cy - 2)) <= 3 + M2_GLOW_MARGE
        glow |= np.hypot(xs - cx, ys - (cy - 4)) <= 3 + M2_GLOW_MARGE
    return ring & (~glow) & MASK, ring, glow


def block_mean(werte, gueltig):
    """2x2-Block-MITTELWERT (Review P1-m5). Ein Block zaehlt nur, wenn ALLE
    vier Texel gueltig sind — ein Teil-Block mischte Zone und Nicht-Zone."""
    out = {}
    for by in range(VIEW_H // 2):
        for bx in range(VIEW_W // 2):
            sl = (slice(by * 2, by * 2 + 2), slice(bx * 2, bx * 2 + 2))
            if not gueltig[sl].all():
                continue
            blk = werte[sl]
            if np.isnan(blk).any():
                continue
            out[(bx, by)] = float(blk.mean())
    return out


def gradient_schnitt_bild(tag, prof, spruenge, ambient, note, glowmask=None,
                          gate_spruenge=None, gate_plateaus=None):
    """Jury-Bild des Gradient-Schnitts: Stufenprofil a(d) auf Block-Mittelwerten,
    die deklarierte Leiter {ambient*k/12} als waagerechte Hilfslinien."""
    from PIL import ImageDraw
    n = len(prof)
    bw, H, PAD = 14, 260, 40
    W = PAD + n * bw + 20
    im = Image.new("RGB", (W, H), (18, 18, 24))
    d = ImageDraw.Draw(im)
    amax = max(0.001, ambient)
    def yy(a):
        return max(2, min(H - 2, int(H - PAD - (a / amax) * (H - 2 * PAD))))
    for k in range(13):
        a = ambient * k / 12.0
        d.line([(PAD, yy(a)), (W - 10, yy(a))], fill=(56, 56, 72))
        if k % 2 == 0:
            d.text((4, yy(a) - 4), f"{a:.3f}", fill=(150, 150, 170))
    for i, (dist, a) in enumerate(prof):
        if a is None or (isinstance(a, float) and math.isnan(a)):
            continue
        x0 = PAD + i * bw
        col = (232, 176, 72) if i in spruenge else (120, 180, 232)
        if glowmask and i < len(glowmask) and glowmask[i]:
            col = (150, 82, 70)          # Warm-Glow-Zone: Schaetzer nicht definiert
        y0, y1 = sorted((yy(a), yy(0.0)))
        d.rectangle([x0, y0, x0 + bw - 2, max(y0, y1)], fill=col)
    # BILDUNTERSCHRIFT-KORREKTUR (Jury-R1, M-P1): orange markiert sind ALLE
    # Spruenge des VOLLEN Strahls; das GATE zaehlt nur die im glow-freien
    # Fenster. Beide Zahlen stehen getrennt im Bild, damit die Unterschrift
    # nicht mehr die eine Zahl mit der anderen erklaert. Drei kurze Zeilen —
    # eine lange Zeile wurde am rechten Bildrand abgeschnitten.
    n_glow = sum(1 for f in (glowmask or []) if f)
    d.text((4, 2), note[:92], fill=(220, 220, 230))
    if gate_spruenge is not None:
        d.text((4, 13), f"GATE (glow-frei, {n - n_glow} von {n} Bloecken): "
                        f"{gate_spruenge} Spruenge"
                        + (f", {gate_plateaus} Plateaus >= {M2_GRAD_MIN_PLATEAU} Bloecke"
                           if gate_plateaus is not None else ""),
               fill=(200, 200, 210))
    d.text((4, 24), f"orange = ALLE {len(spruenge)} Spruenge des VOLLEN Strahls; "
                    f"rot = Warm-Glow-Zone (Schaetzer undef.)", fill=(200, 200, 210))
    d.text((4, H - 14), "Hilfslinien = deklarierte Leiter ambient*k/12 (k = 0..12)",
           fill=(150, 150, 170))
    im.save(f"{OUT}/{tag}.png")
    print(f"  [bild] {tag}.png ({W}x{H})")
    return f"{OUT}/{tag}.png"


def m2(pw):
    print("== M2 LICHT-QUANTISIERUNG (CATACOMBS (40,190)) ==")
    ziel = (tcx(12), tcx(17))
    browser, ctx, page = open_map(pw, BASE + "/?map=CATACOMBS")
    page.evaluate("() => { window.__noFog = true; window.__noVignette = true; }")
    place(page, *ziel)
    cam = settle_camera(page, "g6_06_lichtstufen", ziel, soll=M2_KAMERA)
    page.wait_for_timeout(250)
    set_scale(page, 0)
    page.wait_for_timeout(200)
    A = backing_store(page)
    A2 = backing_store(page)
    snap = get_snap(page)
    page.evaluate("() => { window.__noLight = true; }")
    page.wait_for_timeout(200)
    B = backing_store(page)
    page.evaluate("() => { window.__noLight = false; }")
    page.wait_for_timeout(150)
    # ENGINE-GEGENPROBE (kein Gate, sondern die Trennung Messfehler/Baufehler):
    # dieselbe reine Funktion lightRuns mit dem Zustand DIESES eingefrorenen
    # Frames aufrufen und daraus die WAHRE Stufenkarte k(x,y) bauen. Sie ist die
    # Referenz, gegen die der 3-Kanal-Schaetzer geprueft wird.
    runs = page.evaluate("""async () => {
      const L = await import('/js/core/lighting.js?real=1');
      const s = window.__snap;
      return L.lightRuns(s.lights, s.camera, s.ambient, s.timeSec, 320, 180, { emitK12: true });
    }""")
    # Jury-Vollszene MIT Vignette/Nebel (so sieht die Karte wirklich aus)
    page.evaluate("() => { window.__noFog = false; window.__noVignette = false; }")
    page.wait_for_timeout(200)
    voll = backing_store(page)
    camE = get_camera(page)
    assert_int_camera(camE, "g6_06_ende")
    ctx.close(); browser.close()

    save_scene("g6_06_katakomben_lichtstufen", voll, note="M2-Szene, Kamera (40,190)", cam=cam)
    A.resize((VIEW_W * SCENE_ZOOM, VIEW_H * SCENE_ZOOM), Image.NEAREST).save(
        f"{OUT}/g6_06_hilf_A_licht.png")
    B.resize((VIEW_W * SCENE_ZOOM, VIEW_H * SCENE_ZOOM), Image.NEAREST).save(
        f"{OUT}/g6_06_hilf_B_ohne_licht.png")

    tint = hex2rgb(snap["tint"] or "#050510")
    ambient = snap["ambient"]
    kmap = np.full((VIEW_H, VIEW_W), 12, dtype=np.int16)
    for r in runs:
        kmap[r["y"]:r["y"] + r["h"], r["x"]:r["x"] + r["w"]] = r["k"]
    am = a_map(A, B, tint)
    zone, ring, glow = mess_zone(snap, None)
    gueltig = zone & ~np.isnan(am)
    bloecke = block_mean(am, gueltig)
    werte = np.array(list(bloecke.values()))
    leiter = [ambient * k / 12.0 for k in range(13)]
    # ---- K1 (Rev 2.2): STUFENZAEHLUNG RASTET AUF DIE DEKLARIERTE LEITER ----
    # Begruendung (Spec-Kopf Rev 2.2): der 3-Kanal-Schaetzer streut durch die
    # 8-Bit-Rundung des Backing-Stores um +-0,014 (Engine-Gegenprobe unten,
    # Proof-Lauf 1: max 0,014). Das alte 0,01-Raster zerlegte deshalb JEDE
    # echte Stufe in zwei Bins und meldete 23 statt der gebauten 13. Neue
    # Zaehlung: jeder Blockwert rastet auf die naechste Leiterstufe, wenn er
    # hoechstens M2_LEITER_TOL daneben liegt; jede besetzte Leiterstufe zaehlt
    # EINMAL. Werte AUSSERHALB der Toleranz sind ein Baufehler (Stufe neben
    # der Leiter) und zaehlen unveraendert einzeln im 0,01-Raster mit — die
    # Goodhart-Sperre (Untergrenze 9, Obergrenze 13) bleibt damit scharf.
    leiter_k_block, ausserhalb = {}, []
    for _b, _v in bloecke.items():
        _abst = [abs(_v - s) for s in leiter]
        _k = int(np.argmin(_abst))
        if _abst[_k] <= M2_LEITER_TOL:
            leiter_k_block[_b] = _k
        else:
            ausserhalb.append(round(float(np.round(_v / M2_RASTER) * M2_RASTER), 4))
    besetzte_k = sorted(set(leiter_k_block.values()))
    ausserhalb_bins = sorted(set(ausserhalb))
    distinkt = sorted([round(leiter[k], 4) for k in besetzte_k] + ausserhalb_bins)
    roh_raster001 = sorted(set(np.round(np.round(werte / M2_RASTER) * M2_RASTER,
                                        4).tolist()))
    auf_leiter = sum(1 for v in werte if min(abs(v - s) for s in leiter) <= M2_PLATEAU_TOL)
    plateau_pct = 100.0 * auf_leiter / max(1, len(werte))
    # DIAGNOSE (kein Gate): welche der 13 DEKLARIERTEN Stufen sind besetzt, und
    # wie weit weicht die Messung je Stufe ab? Das trennt einen Baufehler (Werte
    # NEBEN der Leiter) von einem Messartefakt (Werte AUF der Leiter, aber durch
    # die 8-Bit-Rundung um wenige Tausendstel verschoben -> das 0,01-Raster
    # zerlegt eine Stufe in zwei Bins).
    leiter_stat = []
    for k, s in enumerate(leiter):
        sel = werte[np.abs(werte - s) <= M2_PLATEAU_TOL]
        if sel.size:
            leiter_stat.append({"k": k, "soll": round(s, 4), "bloecke": int(sel.size),
                                "mittel": round(float(sel.mean()), 4),
                                "abweichung": round(float(sel.mean() - s), 4),
                                "sd": round(float(sel.std()), 4)})
    leiter_stufen = len(leiter_stat)
    # Engine-Wahrheit in derselben Zone
    kz = kmap[zone]
    engine_k = sorted(set(int(v) for v in np.unique(kz)))
    engine_a = np.array([ambient * k / 12.0 for k in range(13)])
    # Schaetzer gegen Engine, Block fuer Block
    kblock = {}
    for (bx, by), v in bloecke.items():
        kk = kmap[by * 2:by * 2 + 2, bx * 2:bx * 2 + 2]
        if kk.min() == kk.max():
            kblock[(bx, by)] = int(kk[0, 0])
    fehler_schaetzer = [abs(bloecke[b] - engine_a[k]) for b, k in kblock.items()]
    schaetzer_max = round(float(max(fehler_schaetzer)), 4) if fehler_schaetzer else None
    schaetzer_mittel = round(float(np.mean(fehler_schaetzer)), 4) if fehler_schaetzer else None
    # K1-KONTROLLE (Positiv-Referenz): die Engine-k-Folge. Verglichen wird auf
    # den Bloecken, in denen die Engine GENAU EINE Stufe fuehrt (kblock) —
    # gemischte Bloecke haben keinen eindeutigen Sollwert. Die Kontrolle
    # besteht, wenn der gerasterte Schaetzer dort JEDEN Block auf dasselbe k
    # legt wie die Engine (Trennung Messfehler / Baufehler).
    engine_k_bloecke = sorted(set(kblock.values()))
    est_k_uniform = sorted(set(leiter_k_block[b] for b in kblock if b in leiter_k_block))
    k_fehltreffer = sum(1 for b, k in kblock.items() if leiter_k_block.get(b, -1) != k)
    engine_ok = (bool(kblock) and est_k_uniform == engine_k_bloecke
                 and k_fehltreffer == 0)

    stufen_ok = M2_STUFEN_MIN <= len(distinkt) <= M2_STUFEN_MAX
    plateau_ok = plateau_pct >= M2_PLATEAU_MIN
    print(f"  Mess-Zone: {int(zone.sum())} Texel (Ring {int(ring.sum())} minus Glow "
          f"{int(glow.sum())} minus HUD) -> {len(bloecke)} 2x2-Bloecke")
    print(f"  Lichtstufen (K1: Leiter-Rastung +-{M2_LEITER_TOL}): {len(distinkt)} "
          f"= {len(besetzte_k)} besetzte Leiterstufen k={besetzte_k} + "
          f"{len(ausserhalb_bins)} Werte ausserhalb der Toleranz "
          f"(Soll {M2_STUFEN_MIN}..{M2_STUFEN_MAX}) {'OK' if stufen_ok else 'ROT'}  "
          f"[roh im {M2_RASTER}-Raster waeren es {len(roh_raster001)}]")
    print(f"  Plateau-Anteil auf {{ambient*k/12}}: {plateau_pct:.2f} % "
          f"(Soll >= {M2_PLATEAU_MIN}) {'OK' if plateau_ok else 'ROT'}")
    print(f"  [Diagnose] ENGINE-Stufen k in der Zone: {engine_k} ({len(engine_k)} Stufen); "
          f"Schaetzer gegen Engine: max {schaetzer_max}, Mittel {schaetzer_mittel} "
          f"ueber {len(kblock)} Bloecke")
    print(f"  [Diagnose] besetzte DEKLARIERTE Stufen: {leiter_stufen}/13; "
          f"max |Abweichung| je Stufe "
          f"{max((abs(z['abweichung']) for z in leiter_stat), default=0):.4f}, "
          f"max sd {max((z['sd'] for z in leiter_stat), default=0):.4f}")

    # ---- Gradient-Schnitt --------------------------------------------------
    # a entlang 72 px vom Fackelzentrum, ausgewertet auf 2x2-Block-Mittelwerten.
    # AUSWERTUNG im GLOW-FREIEN Teil des Strahls (d > 0,48*r): die Mess-Zone ist
    # laut Spec BINDEND warm-glow-frei (Review P3-M3), und der 3-Kanal-Schaetzer
    # ist unter dem additiven 'lighter'-Pass gar nicht definiert (a wird dort
    # negativ). Der VOLLE Strahl (0..72 px) wird zusaetzlich ausgewiesen und im
    # Jury-Bild vollstaendig gezeichnet; die Glow-Bloecke sind dort markiert.
    # Ein Sprung vergleicht mit dem LETZTEN GUELTIGEN Block (Loecher, in denen
    # der Untergrund zu dunkel fuer den Schaetzer ist, duerfen einen Sprung nicht
    # verschlucken).
    torches = torch_geometrie(snap)
    grad = {"pass": False}
    if torches:
        def strahl(t, ang):
            dx, dy = math.cos(math.radians(ang)), math.sin(math.radians(ang))
            seen, prof = [], []
            for sd in range(M2_GRAD_LEN + 1):
                px = int(round(t["sx"] + dx * sd))
                py = int(round(t["sy"] + dy * sd))
                if not (0 <= px < VIEW_W and 0 <= py < VIEW_H) or not MASK[py, px]:
                    return None
                key = (px // 2, py // 2)
                if seen and seen[-1] == key:
                    continue
                seen.append(key)
                if key in bloecke:
                    a = bloecke[key]
                elif gueltig[key[1] * 2:key[1] * 2 + 2, key[0] * 2:key[0] * 2 + 2].all():
                    a = float(am[key[1] * 2:key[1] * 2 + 2, key[0] * 2:key[0] * 2 + 2].mean())
                else:
                    blk = am[key[1] * 2:key[1] * 2 + 2, key[0] * 2:key[0] * 2 + 2]
                    a = float(np.nanmean(blk)) if not np.isnan(blk).all() else None
                prof.append({"d": sd, "a": a,
                             "glow": sd <= M2_RING_INNEN * t["r_un"] + M2_GLOW_MARGE})
            return prof

        def stats(prof):
            spruenge, plateaus, lauf, letzt, idx = [], [], 0, None, []
            for i, e in enumerate(prof):
                if e["a"] is None:
                    continue
                if letzt is None:
                    letzt, lauf = e["a"], 1
                    continue
                if abs(e["a"] - letzt) >= M2_GRAD_MIN_SPRUNG:
                    spruenge.append(i)
                    plateaus.append(lauf)
                    lauf = 1
                else:
                    lauf += 1
                letzt = e["a"]
            plateaus.append(lauf)
            return spruenge, plateaus

        # STRAHL-WAHL, deterministisch und begruendet: der Schnitt darf KEINEN
        # zweiten Kegel kreuzen (sonst ist a das PRODUKT zweier Profile und die
        # Treppe steht still), muss ganz im Bild und HUD-frei liegen und soll im
        # glow-freien Teil moeglichst viele auswertbare Bloecke haben.
        alle = torch_geometrie(snap, nur_fackeln=False)
        best = None
        for t in torches:
            t["r_un"] = t["r"]
            for ang in range(0, 360, 15):
                prof = strahl(t, ang)
                if not prof:
                    continue
                dx, dy = math.cos(math.radians(ang)), math.sin(math.radians(ang))
                pts = [(t["sx"] + dx * e["d"], t["sy"] + dy * e["d"]) for e in prof]
                stoer = None
                frei = 999.0
                for o in alle:
                    if abs(o["sx"] - t["sx"]) < 1 and abs(o["sy"] - t["sy"]) < 1:
                        continue
                    dmin = min(math.hypot(px - o["sx"], py - o["sy"]) for px, py in pts)
                    frei = min(frei, dmin)
                    if dmin <= o["r"] + 2:
                        stoer = o
                gf = [e for e in prof if not e["glow"]]
                n_gueltig = sum(1 for e in gf if e["a"] is not None)
                schl = (0 if stoer else 1, n_gueltig, frei)
                if not best or schl > best["schluessel"]:
                    best = {"torch": t, "ang": ang, "prof": prof, "frei": frei,
                            "gueltig_glowfrei": n_gueltig, "schluessel": schl,
                            "fremdkegel_frei": stoer is None}
        if best:
            prof = best["prof"]
            gf = [e for e in prof if not e["glow"]]
            spr_gf, plat_gf = stats(gf)
            spr_all, plat_all = stats(prof)
            # Engine-Wahrheit auf demselben Strahl (glow-frei), rein aus lightRuns
            dxg = math.cos(math.radians(best["ang"]))
            dyg = math.sin(math.radians(best["ang"]))
            ek_prof, ek_spr, ek_plat, lauf_e, letzt_e = [], [], [], 0, None
            for e in gf:
                px = int(round(best["torch"]["sx"] + dxg * e["d"]))
                py = int(round(best["torch"]["sy"] + dyg * e["d"]))
                k = int(kmap[py, px])
                ek_prof.append([e["d"], k])
                if letzt_e is None:
                    letzt_e, lauf_e = k, 1
                    continue
                if k != letzt_e:
                    ek_spr.append(e["d"])
                    ek_plat.append(lauf_e)
                    lauf_e = 1
                else:
                    lauf_e += 1
                letzt_e = k
            ek_plat.append(lauf_e)
            n_spr = len(spr_gf)
            spr_ok = M2_GRAD_SPRUENGE[0] <= n_spr <= M2_GRAD_SPRUENGE[1]
            # K2-FINAL (Rev 2.3): das PRO-STRAHL-Plateau-Minimum ENTFAELLT
            # ERSATZLOS. Die Rev-2.2-Fassung (>= 8 Plateaus >= 2 Bloecke UND
            # <= 3 kuerzere) forderte 2*8 + 3 = 19 Bloecke, wo das glow-freie
            # Fenster nur 18 messbare hergibt; der Erfuellbarkeits-Zensus ueber
            # 972 Strahlen (alle Fackeln x 24 Winkel x 13 Zeitpunkte,
            # .tmp/g6r1w_grad_diagnose.json) fand 4,4 % erfuellbare Kombis —
            # die Regel mass die Fenstergroesse, nicht die Bildqualitaet.
            # BINDEND bleiben: Sprungzahl 8..13 (hier) und der GLOBALE
            # Plateau-Anteil >= 95 % (oben, ueber die ganze Mess-Zone). Die
            # Plateau-Laengen laufen als PROTOKOLL mit — ohne Gate-Wirkung —,
            # das Schnitt-BILD bleibt Pflicht-Jurymaterial.
            plat_lang = [p for p in plat_gf if p >= M2_GRAD_MIN_PLATEAU]
            plat_kurz = [p for p in plat_gf if p < M2_GRAD_MIN_PLATEAU]
            # REV 2.4 (J1): ERSATZREGEL statt ersatzloser Streichung.
            plat_ok = len(plat_lang) >= M2_GRAD_PLATEAUS_MIN_N
            grad = {"fackel_screen": [best["torch"]["sx"], best["torch"]["sy"]],
                    "fackel_welt": [best["torch"]["wx"], best["torch"]["wy"]],
                    "fackel_radius_wirksam": best["torch"]["r"],
                    "winkel_grad": best["ang"], "fremdkegel_abstand_px": round(best["frei"], 1),
                    "kreuzt_keinen_zweiten_kegel": bool(best["fremdkegel_frei"]),
                    "laenge_px": M2_GRAD_LEN,
                    "bloecke_gesamt": len(prof), "bloecke_glowfrei": len(gf),
                    "bloecke_glowfrei_gueltig": best["gueltig_glowfrei"],
                    "profil": [[e["d"], (round(e["a"], 4) if e["a"] is not None else None),
                                e["glow"]] for e in prof],
                    "spruenge": n_spr, "spruenge_soll": list(M2_GRAD_SPRUENGE),
                    "min_sprung": M2_GRAD_MIN_SPRUNG,
                    "plateau_laengen": plat_gf, "min_plateau": M2_GRAD_MIN_PLATEAU,
                    "plateaus_ab_2_bloecke": len(plat_lang),
                    "plateaus_ab_2_bloecke_soll": M2_GRAD_PLATEAUS_MIN_N,
                    "plateaus_unter_2_bloecke": len(plat_kurz),
                    "plateau_regel": "ERSATZREGEL Rev 2.4 (J1, P0-C): Die Rev-2.3-"
                                     "Begruendung ('arithmetisch unerfuellbar') war "
                                     "FALSCH (Mindestbedarf 17 bei 18 messbaren Bloecken); "
                                     "richtig ist, dass die Rev-2.2-Regel nur auf 4-11 % "
                                     "der zulaessigen Strahlen erfuellbar war und damit die "
                                     "Strahlwahl mass. Statt der ersatzlosen Streichung "
                                     f"gilt jetzt: >= {M2_GRAD_PLATEAUS_MIN_N} Plateaus "
                                     f">= {M2_GRAD_MIN_PLATEAU} Bloecke auf dem "
                                     "Proof-Strahl (am Zensus geeicht: 55 % aller Strahlen "
                                     "erreichen sie). Bindend bleiben zusaetzlich "
                                     f"Sprungzahl {M2_GRAD_SPRUENGE[0]}.."
                                     f"{M2_GRAD_SPRUENGE[1]} und der globale "
                                     f"Plateau-Anteil >= {M2_PLATEAU_MIN} %.",
                    "plateau_gate": f">= {M2_GRAD_PLATEAUS_MIN_N} Plateaus >= "
                                    f"{M2_GRAD_MIN_PLATEAU} Bloecke (Rev 2.4 J1)",
                    "plateau_pass": bool(plat_ok),
                    "spruenge_pass": spr_ok,
                    "voller_strahl_spruenge": len(spr_all),
                    "voller_strahl_plateaus": plat_all,
                    "auswertung": "glow-frei (d > 0,48*r); voller Strahl als Zweitwert",
                    "engine_k_profil": ek_prof, "engine_plateaus": ek_plat,
                    "engine_spruenge": len(ek_spr),
                    "pass": bool(spr_ok and plat_ok)}
            gradient_schnitt_bild(
                "g6_gradient_schnitt",
                [(e["d"], e["a"]) for e in prof], set(spr_all), ambient,
                f"CATACOMBS Gradient-Schnitt: Fackel Welt {best['torch']['wx']},"
                f"{best['torch']['wy']} Winkel {best['ang']} Grad, 72 px",
                glowmask=[e["glow"] for e in prof],
                gate_spruenge=n_spr, gate_plateaus=len(plat_lang))
            print(f"  [Diagnose] ENGINE k auf demselben Strahl: "
                  f"{[k for _, k in ek_prof]} -> {len(ek_spr)} Wechsel, Plateaus {ek_plat}")
            print(f"  Gradient-Schnitt (glow-frei): {n_spr} Spruenge (Soll {M2_GRAD_SPRUENGE}) "
                  f"{'OK' if spr_ok else 'ROT'} | ERSATZREGEL Rev 2.4: "
                  f"{len(plat_lang)} Plateaus >= {M2_GRAD_MIN_PLATEAU} Bloecke "
                  f"(Soll >= {M2_GRAD_PLATEAUS_MIN_N}) {'OK' if plat_ok else 'ROT'}; "
                  f"{len(plat_kurz)} kurze, Laengen {plat_gf} | voller Strahl: "
                  f"{len(spr_all)} Spruenge, Plateaus {plat_all}")

    # ---- KONTROLLEN --------------------------------------------------------
    am_aa = a_map(A, A2, tint)
    bl_aa = block_mean(am_aa, gueltig)
    d_aa = sorted(set(np.round(np.round(np.array(list(bl_aa.values())) / M2_RASTER)
                               * M2_RASTER, 4).tolist()))
    aa_ok = len(d_aa) == 1
    # Fernzone: ausserhalb JEDES Kegels (kein Licht) -> a == ambient
    ys, xs = np.mgrid[0:VIEW_H, 0:VIEW_W]
    fern = MASK.copy()
    for t in torch_geometrie(snap, nur_fackeln=False):
        fern &= np.hypot(xs - t["sx"], ys - t["sy"]) > t["r"] + 4
    fern &= ~np.isnan(am)
    # Abtastung wie im Gate: 2x2-BLOCK-MITTEL (Spec §1 M2). Der Texelwert wird
    # als Diagnose mitgefuehrt (er traegt die volle 8-Bit-Rundung).
    fern_bloecke = block_mean(am, fern)
    fb = np.array(list(fern_bloecke.values())) if fern_bloecke else np.array([])
    fern_abw = float(np.max(np.abs(fb - ambient))) if fb.size else None
    fern_texel = am[fern]
    fern_abw_texel = float(np.max(np.abs(fern_texel - ambient))) if fern_texel.size else None
    fern_ok = fb.size > 0 and fern_abw <= M2_FERN_TOL
    print(f"  [Kontrolle-] A gegen A: {len(d_aa)} Stufe(n) {d_aa} -> {'OK' if aa_ok else 'FEHLGESCHLAGEN'}")
    print(f"  [Kontrolle+] Fernzone ({len(fern_bloecke)} Bloecke / {int(fern.sum())} Texel): "
          f"max |a-ambient| Block {fern_abw} (Texel {fern_abw_texel}) "
          f"(Soll <= {M2_FERN_TOL}) -> {'OK' if fern_ok else 'FEHLGESCHLAGEN'}")

    print(f"  [Kontrolle+] K1 Engine-Gegenprobe: Engine fuehrt k={engine_k_bloecke} auf "
          f"{len(kblock)} eindeutigen Bloecken, gerasterter Schaetzer k={est_k_uniform}, "
          f"{k_fehltreffer} Fehltreffer, max |a - ambient*k/12| {schaetzer_max} "
          f"-> {'OK' if engine_ok else 'FEHLGESCHLAGEN'}")
    kontrollen_ok = aa_ok and fern_ok and engine_ok
    proof_results["M2_lichtstufen"] = {
        "kamera": cam, "ambient": ambient, "tint": snap["tint"],
        "timeSec": snap["timeSec"], "lichter_im_frame": len(snap["lights"]),
        "fackeln_im_bild": len(torches),
        "zone_texel": int(zone.sum()), "ring_texel": int(ring.sum()),
        "glow_texel": int(glow.sum()), "bloecke": len(bloecke),
        "fenster_validierung": {
            "zone": f"Vereinigung {M2_RING_INNEN}*r < d <= r ueber alle Fackeln im "
                    f"Bild, minus Glow-Scheibe/Bodenpfuetze/Hotspot, minus HUD",
            "glow_zusatzmarge_px": M2_GLOW_MARGE,
            "glow_marge_begruendung": "GP6 R1: der gerasterte Warm-Pass fuellt 2x4-Bloecke, deren Mitte in der Glow-Scheibe liegt — bis zu 1 px (x) und 2 px (y) ueber den analytischen Radius hinaus. Ohne die Marge ist die Zone nicht mehr warm-glow-frei (Spec §1/M2 bindend); Beleg .tmp/g6r1_m2_diagnose.json",
            "deklaration": "GETRENNT von den Rev-2.2-Korrekturen K1/K2/K3; keine "
                           "Schwelle beruehrt; Ruecknahme = M2_GLOW_MARGE auf 0.0"},
        "lichtstufen_anzahl": len(distinkt), "lichtstufen_soll": [M2_STUFEN_MIN, M2_STUFEN_MAX],
        "lichtstufen_werte": [round(v, 4) for v in distinkt],
        "lichtstufen_verfahren": f"K1 (Rev 2.2): Rastung auf die deklarierte Leiter "
                                 f"ambient*k/12 mit Toleranz +-{M2_LEITER_TOL}; besetzte "
                                 f"Leiterstufen zaehlen einmal, Werte ausserhalb der "
                                 f"Toleranz einzeln im {M2_RASTER}-Raster",
        "lichtstufen_leiter_toleranz": M2_LEITER_TOL,
        "lichtstufen_besetzte_k": besetzte_k,
        "lichtstufen_ausserhalb_toleranz": ausserhalb_bins,
        "lichtstufen_roh_raster001_anzahl": len(roh_raster001),
        "lichtstufen_roh_raster001_werte": roh_raster001,
        "lichtstufen_plateau_anteil_pct": round(plateau_pct, 2),
        "plateau_soll_pct": M2_PLATEAU_MIN,
        "deklarierte_leiter": [round(v, 4) for v in leiter],
        "diagnose_besetzte_leiterstufen": leiter_stufen,
        "diagnose_leiter_statistik": leiter_stat,
        "diagnose_engine_k_in_zone": engine_k,
        "diagnose_engine_k_anzahl": len(engine_k),
        "diagnose_schaetzer_gegen_engine": {
            "bloecke": len(kblock), "max_abweichung": schaetzer_max,
            "mittlere_abweichung": schaetzer_mittel,
            "erklaerung": "|a_gemessen - ambient*k_engine/12| je Block, in dem die Engine "
                          "genau EINE Stufe fuehrt. Trennt Messfehler (Abweichung gross) "
                          "von Baufehler (Stufen selbst falsch)."},
        "diagnose_lauf_zahl": len(runs),
        "gradient_schnitt": grad,
        "kontrollen": {
            "negativ_A_gegen_A": {"stufen": len(d_aa), "werte": d_aa, "soll": 1, "pass": bool(aa_ok)},
            "positiv_fernzone": {"bloecke": len(fern_bloecke), "texel": int(fern.sum()),
                                 "max_abweichung_block": fern_abw,
                                 "max_abweichung_texel": fern_abw_texel,
                                 "soll": f"a == ambient +- {M2_FERN_TOL} (2x2-Block-Mittel)",
                                 "pass": bool(fern_ok)},
            "positiv_engine_gegenprobe": {
                "engine_k": engine_k_bloecke, "schaetzer_k": est_k_uniform,
                "eindeutige_bloecke": len(kblock), "fehltreffer": k_fehltreffer,
                "max_abweichung": schaetzer_max, "toleranz": M2_LEITER_TOL,
                "soll": "gerasterter Schaetzer == Engine-k auf JEDEM eindeutigen Block",
                "lesart": "K1 (Rev 2.2): lightRuns am SELBEN eingefrorenen Frame ist die "
                          "Positiv-Referenz der Stufenzaehlung",
                "pass": bool(engine_ok)}},
        "kontrollen_ok": bool(kontrollen_ok),
        "hygiene": "__noFog + __noVignette (Muster .tmp/gp6_landkarte_lichtprobe_live.py); "
                   "Zeit eingefroren -> fester Pulse",
        "threshold": f"{M2_STUFEN_MIN}..{M2_STUFEN_MAX} distinkte a (K1: Leiter-Rastung "
                     f"+-{M2_LEITER_TOL}), globaler Plateau-Anteil >= {M2_PLATEAU_MIN} %, "
                     f"Gradient {M2_GRAD_SPRUENGE[0]}..{M2_GRAD_SPRUENGE[1]} Spruenge >= "
                     f"{M2_GRAD_MIN_SPRUNG} UND >= {M2_GRAD_PLATEAUS_MIN_N} Plateaus >= "
                     f"{M2_GRAD_MIN_PLATEAU} Bloecke (ERSATZREGEL Rev 2.4 J1)",
        "pass": bool(stufen_ok and plateau_ok and grad.get("pass") and kontrollen_ok)}
    if not stufen_ok:
        errors.append(f"M2: {len(distinkt)} Lichtstufen (K1-Rastung) ausserhalb "
                      f"{M2_STUFEN_MIN}..{M2_STUFEN_MAX} ({len(besetzte_k)} Leiterstufen "
                      f"+ {len(ausserhalb_bins)} Werte daneben)")
    if not plateau_ok:
        errors.append(f"M2: Plateau-Anteil {plateau_pct:.2f} % < {M2_PLATEAU_MIN} %")
    if not grad.get("pass"):
        errors.append(f"M2: Gradient-Schnitt verletzt — {grad.get('spruenge')} Spruenge "
                      f"(Soll {list(M2_GRAD_SPRUENGE)}), "
                      f"{grad.get('plateaus_ab_2_bloecke')} Plateaus >= "
                      f"{M2_GRAD_MIN_PLATEAU} Bloecke (Soll >= {M2_GRAD_PLATEAUS_MIN_N}, "
                      f"ERSATZREGEL Rev 2.4 J1; Laengen {grad.get('plateau_laengen')})")
    if not kontrollen_ok:
        ungueltig.append("M2_lichtstufen (Kontrolle gescheitert)")
        errors.append("M2: KONTROLLE gescheitert -> Gate UNGUELTIG")

    # Jury-Crop Fackel + Glut aus dieser Szene
    sichtbar = [t for t in torches if 24 <= t["sx"] < VIEW_W - 24 and 24 <= t["sy"] < VIEW_H - 24]
    if sichtbar:
        t = sichtbar[0]
        crop_zoom("g6_crop_e_fackel_glut", voll,
                  (t["sx"] - 24, t["sy"] - 24, t["sx"] + 24, t["sy"] + 24),
                  kind="screen",
                  note="Pflicht-Crop (e) Fackel + Glut: Docht-Kern '1' (§6.6), HOT_RINGS am "
                       "Docht (§2.6), harte 4-px-Bandkanten des Lichtfelds (§2.2)")
    return cam


# ===========================================================================
# E2 GLOW-VIELFALT (GEEICHT: <= 24 distinkte (A-B)-Luminanzen, RASTER 1 L)
# ===========================================================================
# Mess-Szene FEST (Spec §1 M2): GRAVEYARD-Fackel tc(28,18), Spieler (606,318),
# Kamera klemmt auf (320,204); Ring d <= 0,48r um das Fackelzentrum, 2x2-Block-
# MITTEL der Rec.601-Luminanz, fester Pulse. Aufbau und Stoerquellen-Leiter
# 1:1 wie in der Eichmessung .tmp/gp6_p0a_e2.py (IST 35 -> E2 = 24).
def e2(pw):
    print("== E2 GLOW-VIELFALT (GRAVEYARD, Fackel tc(28,18)) ==")
    ring = M2_RING_INNEN * TORCH_RADIUS
    browser, ctx, page = open_map(pw, BASE + "/")
    pin(page, *E2_SPIELER)
    page.wait_for_timeout(1400)
    cam = get_camera(page)
    assert_int_camera(cam, "g6_07_e2")
    cams["g6_07_e2"] = cam
    if cam["x"] != E2_KAMERA[0] or cam["y"] != E2_KAMERA[1]:
        errors.append(f"E2: Kamera {cam} statt {E2_KAMERA}")
    set_scale(page, 0)
    page.wait_for_timeout(200)
    snap = get_snap(page)
    sx = E2_FACKEL_TILE[0] * TILE + TILE // 2 - cam["x"]
    sy = E2_FACKEL_TILE[1] * TILE + TILE // 2 - cam["y"]
    # HUD-Freiheit und Vignetten-Abstand des Rings nachweisen
    hud_treffer = [n for n, x0, y0, x1, y1 in HUD_RECTS
                   if not (sx + ring < x0 or sx - ring > x1 or sy + ring < y0 or sy - ring > y1)]
    vz = math.hypot(sx - VIEW_W / 2, sy - VIEW_H / 2) + ring
    naechste = min((math.hypot(l["x"] - E2_FACKEL_TILE[0] * TILE - 8,
                               l["y"] - E2_FACKEL_TILE[1] * TILE - 8)
                    for l in snap["lights"]
                    if math.hypot(l["x"] - E2_FACKEL_TILE[0] * TILE - 8,
                                  l["y"] - E2_FACKEL_TILE[1] * TILE - 8) > 1), default=None)
    print(f"  Fackel im Bild ({sx},{sy}), Ring {ring:.2f} px, HUD-Ueberschneidung "
          f"{hud_treffer or 'keine'}, Ringrand {vz:.1f} px von der Bildmitte "
          f"(Vignette ab {M5_VIGNETTE_R}), naechstes Licht {naechste:.1f} px")

    ys, xs = np.mgrid[0:VIEW_H, 0:VIEW_W]
    inring = np.hypot(xs - sx, ys - sy) <= ring

    def block_lum_ring(im):
        L = lum(arr(im))
        out = {}
        for by in range(VIEW_H // 2):
            for bx in range(VIEW_W // 2):
                cxb, cyb = bx * 2 + 1, by * 2 + 1
                if math.hypot(cxb - sx, cyb - sy) > ring:
                    continue
                out[(bx, by)] = float(L[by * 2:by * 2 + 2, bx * 2:bx * 2 + 2].mean())
        return out

    stufen = [("roh (Nebel+Vignette+Partikel an)", {}),
              ("ohne Nebel", {"fog": True}),
              ("ohne Nebel+Vignette", {"fog": True, "vig": True}),
              ("ohne Nebel+Vignette+Partikel", {"fog": True, "vig": True, "part": True})]
    zeilen = {}
    bilder = {}
    for name, fl in stufen:
        page.evaluate("""(f) => { window.__noFog = !!f.fog; window.__noVignette = !!f.vig;
          if (f.part && window.__particles) window.__particles.list.length = 0;
          window.__noLight = false; }""", fl)
        page.wait_for_timeout(220)
        A = backing_store(page)
        A2 = backing_store(page)
        page.evaluate("() => { window.__noLight = true; }")
        page.wait_for_timeout(220)
        B = backing_store(page)
        page.evaluate("() => { window.__noLight = false; }")
        page.wait_for_timeout(120)
        bA, bA2, bB = block_lum_ring(A), block_lum_ring(A2), block_lum_ring(B)
        diff1 = sorted(set(round((bA[k] - bB[k]) / E2_RASTER) * E2_RASTER for k in bA))
        diff01 = len(set(round((bA[k] - bB[k]) / 0.01) * 0.01 for k in bA))
        aa = len(set(round((bA[k] - bA2[k]) / E2_RASTER) * E2_RASTER for k in bA))
        zeilen[name] = {"bloecke": len(bA), "distinkt_raster1L": len(diff1),
                        "werte_raster1L": diff1, "distinkt_raster001": diff01,
                        "kontrolle_A_gegen_A_stufen": aa,
                        "diff_min": round(min(bA[k] - bB[k] for k in bA), 2),
                        "diff_max": round(max(bA[k] - bB[k] for k in bA), 2)}
        print(f"  {name:<34} Bloecke {len(bA):4d} | distinkt(1 L) {len(diff1):3d} | "
              f"distinkt(0,01) {diff01:4d} | A-A {aa}")
        bilder[name] = (A, B)
    page.evaluate("() => { window.__noFog = false; window.__noVignette = false; }")
    page.wait_for_timeout(200)
    voll = backing_store(page)
    clear_pin(page)
    ctx.close(); browser.close()

    save_scene("g6_07_e2_glowzone", voll, note="E2-Szene GRAVEYARD, Kamera (320,204), "
               "freistehende Fackel tc(28,18)", cam=cam)
    crop_zoom("g6_crop_e2_glow", voll,
              (int(sx - ring - 6), int(sy - ring - 6), int(sx + ring + 6), int(sy + ring + 6)),
              kind="screen", note="E2-Messring (d <= 0,48r) um die freistehende Fackel")
    haupt = "ohne Nebel+Vignette"        # Stufe der Eichmessung (IST 35)
    ist = zeilen[haupt]["distinkt_raster1L"]
    maxall = max(z["distinkt_raster1L"] for z in zeilen.values())
    aa_ok = all(z["kontrolle_A_gegen_A_stufen"] <= 1 for z in zeilen.values())
    ok = ist <= E2_MAX
    proof_results["E2_glowzone"] = {
        "kamera": cam, "fackel_tile": list(E2_FACKEL_TILE), "fackel_screen": [sx, sy],
        "ring_px": round(ring, 2), "hud_ueberschneidung": hud_treffer,
        "ringrand_von_bildmitte_px": round(vz, 1), "naechstes_licht_px": round(naechste, 1),
        "stufen": zeilen, "gate_stufe": haupt,
        "distinkte_werte": ist, "schwelle": E2_MAX, "maximum_aller_stufen": maxall,
        "kontrollen": {"negativ_A_gegen_A": {"alle_stufen_max": max(
            z["kontrolle_A_gegen_A_stufen"] for z in zeilen.values()), "soll": 1, "pass": aa_ok}},
        "kontrollen_ok": aa_ok,
        "threshold": f"<= {E2_MAX} distinkte (A-B)-Luminanzen auf Raster {E2_RASTER} L",
        "pass": bool(ok and aa_ok)}
    print(f"  E2: {ist} distinkte (A-B) auf Raster 1 L (Schwelle <= {E2_MAX}, "
          f"Maximum ueber alle Stoerstufen {maxall}) -> {'PASS' if ok else 'ROT'}")
    if not ok:
        errors.append(f"E2: {ist} distinkte (A-B)-Luminanzen > {E2_MAX}")
    if not aa_ok:
        ungueltig.append("E2_glowzone (Kontrolle A gegen A gescheitert)")
        errors.append("E2: KONTROLLE A gegen A gescheitert -> Gate UNGUELTIG")


# ===========================================================================
# M3 SPRITE-BELEUCHTUNG (CATACOMBS, Frames player_down_0 + skeleton_0)
# ===========================================================================
def sprite_grids(page):
    return page.evaluate("""async () => {
      const S = await import('/js/art/sprites.js');
      const g = {};
      for (const k of ['player_down_0', 'skeleton_0']) g[k] = S.SPRITES[k];
      return g;
    }""")


def ink_maske(grid, sx, sy):
    """Silhouetten-Maske des FESTGENAGELTEN Frames an der Bildposition (sx,sy)."""
    m = np.zeros((VIEW_H, VIEW_W), dtype=bool)
    for y, row in enumerate(grid):
        for x, ch in enumerate(row):
            if ch == ".":
                continue
            py, px = sy + y, sx + x
            if 0 <= py < VIEW_H and 0 <= px < VIEW_W:
                m[py, px] = True
    return m


def silhouette_werte(im, maske):
    a = arr(im)
    px = a[maske]
    if not px.size:
        return None
    return {"n": int(px.shape[0]),
            "mittel_rgb": [round(float(px[:, i].mean()), 2) for i in range(3)],
            "warm_r_minus_b": round(float((px[:, 0] - px[:, 2]).mean()), 2),
            "mittel_L": round(float(lum(px).mean()), 2),
            "max_L": round(float(lum(px).max()), 2),
            "ausgebrannt": int((lum(px) > M3_AUSBRENNEN_L).sum())}


def halbseiten(im, maske, links_zugewandt):
    """L-Differenz fackelZUGEWANDTE minus -ABGEWANDTE Silhouetten-Haelfte."""
    a = arr(im)
    ys, xs = np.nonzero(maske)
    if not len(xs):
        return None
    mitte = (xs.min() + xs.max() + 1) / 2.0
    li = maske & (np.arange(VIEW_W)[None, :] < mitte)
    re = maske & (np.arange(VIEW_W)[None, :] >= mitte)
    Ll = float(lum(a[li]).mean()) if li.sum() else 0.0
    Lr = float(lum(a[re]).mean()) if re.sum() else 0.0
    zu, ab = (Ll, Lr) if links_zugewandt else (Lr, Ll)
    return {"L_zugewandt": round(zu, 2), "L_abgewandt": round(ab, 2),
            "differenz": round(zu - ab, 2), "texel_links": int(li.sum()),
            "texel_rechts": int(re.sum()), "mitte_x": mitte,
            "zugewandte_seite": "links" if links_zugewandt else "rechts"}


def dE(a, b):
    return round(math.sqrt(sum((a["mittel_rgb"][i] - b["mittel_rgb"][i]) ** 2 for i in range(3))), 2)


# Standort-Suche in der ECHTEN Karte: NAH = maximaler warm-Wert am Abtastpunkt
# (cx, Fusskante-1) der §4.1-Fassade, FERN = maximaler Abstand zu JEDER Fackel.
# Auflagen: begehbar (rectCollides), Kamera NICHT geklemmt (die Figur steht dann
# exakt in der Bildmitte -> vignettenfrei und in beiden Szenen gleich), fuer NAH
# ein seitlicher Versatz zur Fackel (die Warm-Rampe braucht eine Seite).
SUCH_JS = """
async ([modus, minAbstand, ausschluss]) => {
  const L = await import('/js/core/lighting.js?real=1');
  const m = window.__map;
  const snap = window.__snap;
  const torches = snap.lights.filter((l) => (l.flicker || 0) >= 0.8);
  const amb = snap.ambient;
  const PW = m.wPx, PH = m.hPx;
  const out = [];
  for (let cy = 24; cy < PH - 24; cy += 4) {
    for (let cx = 24; cx < PW - 24; cx += 4) {
      if (cx < 160 || cx > PW - 160 || cy < 90 || cy > PH - 90) continue;   // Kamera frei
      const px = cx - 6, py = cy - 7;                                        // Hitbox 12x14
      if (m.rectCollides(px, py, 12, 14)) continue;
      const ax = cx, ay = py + 14 - 1;
      let dmin = 1e9, seit = 0;
      for (const t of torches) {
        const d = Math.hypot(t.x - ax, t.y - ay);
        if (d < dmin) { dmin = d; seit = Math.abs(t.x - ax); }
      }
      if (ausschluss && Math.hypot(cx - ausschluss[0], cy - ausschluss[1]) < ausschluss[2]) continue;
      const lit = L.lightAt(torches, ax, ay, amb, 0);
      if (modus === 'nah') {
        if (seit < 6) continue;
        out.push({ cx, cy, warm: lit.warm, f: lit.f, a: lit.a, dmin, seit });
      } else {
        out.push({ cx, cy, warm: lit.warm, f: lit.f, a: lit.a, dmin, seit });
      }
    }
  }
  out.sort((p, q) => modus === 'nah' ? (q.warm - p.warm || p.dmin - q.dmin)
                                     : (q.dmin - p.dmin));
  return out.slice(0, 600);
}
"""


def m3_szene(pw, tag, spieler, skelett, torch_links, grids, note):
    """Eine M3-Aufnahme: frischer Kontext (identischer Hysterese-Pfad Spawn ->
    Ziel), Spieler + Skelett auf FESTEN Frames, vier Varianten."""
    browser, ctx, page = open_map(pw, BASE + "/?map=CATACOMBS")
    place(page, *spieler)
    cam = settle_camera(page, tag, spieler)
    page.wait_for_timeout(250)
    set_scale(page, 0)
    page.wait_for_timeout(150)
    # Skelett NACH dem Einfrieren setzen: ohne Update bewegt es sich nicht.
    page.evaluate("""([x, y]) => {
      const F = window.__mkEnemy, arr = window.__enemies;
      arr.length = 0;
      const e = F.skeleton({ x, y });
      e.state = 'wander'; e.animTimer = 0; e.hurtTimer = 0; e.stunTimer = 0;
      e.facingLeft = false; e.knockTimer = 0;
      e.x = x - e.w / 2; e.y = y - e.h / 2;
      arr.push(e);
    }""", list(skelett))
    page.wait_for_timeout(200)
    zust = page.evaluate("""() => {
      const p = window.__player, e = (window.__enemies || [])[0];
      return { p: { x: p.x, y: p.y, w: p.w, h: p.h, facing: p.facing, state: p.state },
               e: e ? { x: e.x, y: e.y, w: e.w, h: e.h, kind: e.kind, state: e.state,
                        animTimer: e.animTimer, facingLeft: e.facingLeft } : null,
               n: (window.__enemies || []).length }; }""")
    page.evaluate("() => { const p = window.__player; p.facing = 'down'; p.state = 'idle'; }")
    page.wait_for_timeout(150)
    bilder = {}
    bilder["jury"] = backing_store(page)
    # MESS-HYGIENE: Glut-Funken werden NACH den Entities gezeichnet und legen
    # sich einzeln auf die Silhouette (an der Fackel nachgewiesen: dE 2,5 in der
    # Positiv-Kontrolle). Bei eingefrorener Zeit spawnen keine neuen nach.
    clear_particles(page)
    page.wait_for_timeout(120)
    for name, flags in (("normal", {}), ("noTint", {"t": True}),
                        ("noTint_noLight", {"t": True, "l": True})):
        page.evaluate("(f) => { window.__noTint = !!f.t; window.__noLight = !!f.l; }", flags)
        page.wait_for_timeout(180)
        bilder[name] = backing_store(page)
    page.evaluate("() => { window.__noTint = false; window.__noLight = false; }")
    page.wait_for_timeout(180)
    # Hintergrund: Spieler weg (Licht + Kamera bleiben stehen, update() laeuft
    # bei eingefrorener Zeit nicht) und Gegnerliste leeren.
    page.evaluate("() => { const p = window.__player; p.__sy = p.y; p.y = -9999;"
                  " window.__enemies.length = 0; }")
    page.wait_for_timeout(200)
    bilder["hintergrund"] = backing_store(page)
    page.evaluate("() => { const p = window.__player; p.y = p.__sy; }")
    camE = get_camera(page)
    assert_int_camera(camE, tag + "_ende")
    ctx.close(); browser.close()

    p, e = zust["p"], zust["e"]
    gp, ge = grids["player_down_0"], grids["skeleton_0"]
    psx = int(round(p["x"] + (p["w"] - len(gp[0])) / 2 - cam["x"]))
    psy = int(round(p["y"] + p["h"] - len(gp) - cam["y"]))
    esx = int(round(e["x"] + e["w"] / 2 - len(ge[0]) / 2 - cam["x"]))
    esy = int(round(e["y"] + e["h"] - len(ge) - cam["y"]))
    masken = {"player_down_0": ink_maske(gp, psx, psy),
              "skeleton_0": ink_maske(ge, esx, esy)}
    save_scene(tag, bilder["jury"], note=note, cam=cam)
    return {"cam": cam, "zustand": zust, "bilder": bilder, "masken": masken,
            "sprite_pos": {"player_down_0": [psx, psy], "skeleton_0": [esx, esy]},
            "torch_links": torch_links}


def m3(pw):
    print("== M3 SPRITE-BELEUCHTUNG (CATACOMBS) ==")
    browser, ctx, page = open_map(pw, BASE + "/?map=CATACOMBS")
    place(page, tcx(12), tcx(17))
    settle_camera(page, "m3_suche", (tcx(12), tcx(17)))
    set_scale(page, 0)
    page.wait_for_timeout(150)
    grids = sprite_grids(page)
    nah = page.evaluate(SUCH_JS, ["nah", 0, None])
    fern = page.evaluate(SUCH_JS, ["fern", 0, None])
    snap = get_snap(page)
    torches = [l for l in snap["lights"] if (l.get("flicker") or 0) >= 0.8]
    ctx.close(); browser.close()

    n0 = nah[0]
    # Skelett: bester warm-Wert mit >= 22 px Abstand zum Spieler (keine
    # Silhouetten-Ueberlappung), sonst identische Auflagen.
    n1 = next(c for c in nah if math.hypot(c["cx"] - n0["cx"], c["cy"] - n0["cy"]) >= 22)
    # FERN-Auswahl mit SPRITE-BOX statt Abtastpunkt: der Punch wirkt je
    # SCREEN-Texel, ein 16x24-Sprite ragt bis 17 px ueber den Abtastpunkt hinaus
    # und kann dort noch im Kegel liegen, waehrend der Abtastpunkt schon
    # draussen ist (nachgewiesen: dE 7,2 in der Negativ-Kontrolle). Fuer "FERN"
    # muss die GANZE Silhouette ausserhalb jedes Kegels stehen.
    def box_abstand(cx, cy):
        x0, x1 = cx - 8, cx + 8
        y0, y1 = cy + 7 - 24, cy + 7
        d = []
        for t in torches:
            dx = max(x0 - t["x"], 0, t["x"] - x1)
            dy = max(y0 - t["y"], 0, t["y"] - y1)
            d.append(math.hypot(dx, dy))
        return min(d)

    fern_frei = [c for c in fern if box_abstand(c["cx"], c["cy"]) >= TORCH_RADIUS + 4]
    for c in fern_frei:
        c["box_abstand"] = round(box_abstand(c["cx"], c["cy"]), 1)
    if len(fern_frei) < 4:
        warnings.append("M3: zu wenige kegelfreie FERN-Standorte, Auswahl faellt auf "
                        "den Abtastpunkt zurueck")
        fern_frei = fern
    fern = fern_frei
    f0 = fern[0]
    f1 = next(c for c in fern if math.hypot(c["cx"] - f0["cx"], c["cy"] - f0["cy"]) >= 22)
    # zweiter FERN-Standort (Negativ-Kontrolle): >= 48 px vom ersten entfernt
    f2 = next(c for c in fern if math.hypot(c["cx"] - f0["cx"], c["cy"] - f0["cy"]) >= 48)
    # NEGATIV-KONTROLLE sauber gebaut: das Skelett steht am zweiten fernen Ort
    # mit dem IDENTISCHEN Relativversatz zum Spieler. Sonst variiert der Abstand
    # zur Spieler-Laterne und damit die KALT-Stufe der Tint-Maske — die
    # Kontrolle maesse dann den Aufbau, nicht die Beleuchtung.
    off = (f1["cx"] - f0["cx"], f1["cy"] - f0["cy"])

    def fackelabstand(cx, cy):
        return box_abstand(cx, cy)

    # BEIDE Figuren muessen am zweiten fernen Ort ausserhalb JEDES Kegels stehen
    # (r = 72), sonst misst die Kontrolle einen Stufenwechsel der KALT-Rampe
    # statt "gleiche Beleuchtung". Der ABSTAND Skelett-Spieler bleibt exakt
    # gleich (nur der Winkel darf sich drehen — die Spieler-Laterne ist radial,
    # fuer f zaehlt allein der Abstand).
    rad = math.hypot(*off)
    f2, f3 = None, None
    for c in fern:
        if math.hypot(c["cx"] - f0["cx"], c["cy"] - f0["cy"]) < 48 or c["dmin"] < TORCH_RADIUS + 4:
            continue
        for grad in range(0, 360, 15):
            sk = (int(round(c["cx"] + rad * math.cos(math.radians(grad)))),
                  int(round(c["cy"] + rad * math.sin(math.radians(grad)))))
            if fackelabstand(*sk) < TORCH_RADIUS + 4:
                continue
            f2, f3 = c, {"cx": sk[0], "cy": sk[1], "abstand_zum_spieler": round(rad, 1),
                         "winkel": grad, "dmin": round(fackelabstand(*sk), 1)}
            break
        if f2:
            break
    if f2 is None:
        f2 = next(c for c in fern if math.hypot(c["cx"] - f0["cx"], c["cy"] - f0["cy"]) >= 48)
        f3 = {"cx": f2["cx"] + off[0], "cy": f2["cy"] + off[1],
              "abstand_zum_spieler": round(rad, 1), "notloesung": True,
              "dmin": round(fackelabstand(f2["cx"] + off[0], f2["cy"] + off[1]), 1)}
    f1["dmin_abtastpunkt"] = round(fackelabstand(f1["cx"], f1["cy"]), 1)
    def naechste_fackel(c):
        return min(torches, key=lambda t: math.hypot(t["x"] - c["cx"], t["y"] - c["cy"] + 6))
    tn = naechste_fackel(n0)
    links = tn["x"] < n0["cx"]
    print(f"  NAH  Spieler ({n0['cx']},{n0['cy']}) warm={n0['warm']:.3f} f={n0['f']:.3f} "
          f"a={n0['a']:.3f} dmin={n0['dmin']:.1f} px; Fackel ({tn['x']},{tn['y']}) "
          f"{'links' if links else 'rechts'}")
    print(f"  NAH  Skelett ({n1['cx']},{n1['cy']}) warm={n1['warm']:.3f} dmin={n1['dmin']:.1f}")
    print(f"  FERN Spieler ({f0['cx']},{f0['cy']}) warm={f0['warm']:.3f} dmin={f0['dmin']:.1f}; "
          f"Skelett ({f1['cx']},{f1['cy']}) dmin={f1['dmin']:.1f}")
    print(f"  FERN-2 (Negativ-Kontrolle) Spieler ({f2['cx']},{f2['cy']}) dmin={f2['dmin']:.1f}")

    S_nah = m3_szene(pw, "g6_08_sprite_nah", (n0["cx"], n0["cy"]), (n1["cx"], n1["cy"]),
                     links, grids, "M3 NAH: Spieler + Skelett im Fackelkegel")
    S_fern = m3_szene(pw, "g6_09_sprite_fern", (f0["cx"], f0["cy"]), (f1["cx"], f1["cy"]),
                      links, grids, "M3 FERN: maximal fackelfern")
    S_fern2 = m3_szene(pw, "g6_09b_sprite_fern2", (f2["cx"], f2["cy"]), (f3["cx"], f3["cy"]),
                       links, grids, "M3 FERN-2 (Negativ-Kontrolle, >= 48 px entfernt)")
    # ZWEITE Fassung der Negativ-Kontrolle. Befund der Standort-Suche: in
    # CATACOMBS steht KEIN zweites Gebiet zur Verfuegung, in dem eine 16x24-
    # Silhouette ausserhalb ALLER 25 Fackelkegel liegt (gemessen: 9 Positionen
    # mit Box-Abstand >= 72 px, alle in derselben Ecke). Die Spec-Fassung "zwei
    # ferne Standorte" ist auf dieser Karte also nur mit KLEINEM Abstand
    # konstruierbar. Diese Variante nimmt den bestmoeglichen zweiten Ort mit
    # gleicher Aufstellung; die 48-px-Fassung oben bleibt daneben stehen.
    kf = [c for c in fern
          if math.hypot(c["cx"] - f0["cx"], c["cy"] - f0["cy"]) >= 12
          and box_abstand(c["cx"], c["cy"]) >= TORCH_RADIUS
          and box_abstand(c["cx"] + off[0], c["cy"] + off[1]) >= TORCH_RADIUS - 8]
    S_fern3 = None
    if kf:
        f4 = max(kf, key=lambda c: math.hypot(c["cx"] - f0["cx"], c["cy"] - f0["cy"]))
        f5 = {"cx": f4["cx"] + off[0], "cy": f4["cy"] + off[1]}
        print(f"  FERN-2b (kegelfrei, Abstand "
              f"{math.hypot(f4['cx'] - f0['cx'], f4['cy'] - f0['cy']):.1f} px) "
              f"({f4['cx']},{f4['cy']}) Box-Abstand {box_abstand(f4['cx'], f4['cy']):.1f} / "
              f"Skelett {box_abstand(f5['cx'], f5['cy']):.1f}")
        S_fern3 = m3_szene(pw, "g6_09c_sprite_fern2b", (f4["cx"], f4["cy"]),
                           (f5["cx"], f5["cy"]), links, grids,
                           "M3 FERN-2b (Negativ-Kontrolle, beide Figuren kegelfrei)")
    else:
        warnings.append("M3: keine kegelfreie Zweitstelle fuer die Negativ-Kontrolle")

    ergebnis = {}
    alle_ok = True
    for frame in ("player_down_0", "skeleton_0"):
        mn, mf = S_nah["masken"][frame], S_fern["masken"][frame]
        vn = silhouette_werte(S_nah["bilder"]["normal"], mn)
        vf = silhouette_werte(S_fern["bilder"]["normal"], mf)
        # Gegenprobe, dass die Maske wirklich auf der Figur liegt
        diff_n = int((np.abs(arr(S_nah["bilder"]["normal"]) - arr(S_nah["bilder"]["hintergrund"])
                             ).sum(axis=2) > 0)[mn].sum())
        dwarm = round(vn["warm_r_minus_b"] - vf["warm_r_minus_b"], 2)
        hn = halbseiten(S_nah["bilder"]["normal"], mn, links)
        hn_nt = halbseiten(S_nah["bilder"]["noTint"], mn, links)
        hf = halbseiten(S_fern["bilder"]["normal"], mf, links)
        hf_nt = halbseiten(S_fern["bilder"]["noTint"], mf, links)
        tint_nah = round(hn["differenz"] - hn_nt["differenz"], 2)
        tint_fern = round(hf["differenz"] - hf_nt["differenz"], 2)
        aus = vn["ausgebrannt"] + vf["ausgebrannt"]
        dwarm_ok = dwarm >= M3_DWARM_MIN
        # K3 (Rev 2.2): GEMESSEN wird der TINT-ANTEIL an der Halbseiten-
        # Differenz — getoent MINUS ungetoent am SELBEN Frame und SELBEN Ort.
        # Die woertliche Rev-2.1-Fassung (absolute Differenz, Kontrolle mit
        # __noTint < 2 L) mass den LICHTFELD-Gradienten und die Asymmetrie
        # der Kunst mit; beides darf laut Review P2-M-4 ausdruecklich da
        # sein. Gate: Tint-Anteil NAH >= +6 L. Kontrolle: Tint-Anteil FERN
        # < 2 L (dort gibt es keinen Kegel, die Maske darf nicht modellieren).
        halb_ok = tint_nah >= M3_HALB_MIN
        halb_kontrolle = abs(tint_fern) < M3_HALB_NOTINT_MAX
        aus_ok = aus == 0
        ok = dwarm_ok and halb_ok and aus_ok
        alle_ok = alle_ok and ok
        ergebnis[frame] = {
            "nah": vn, "fern": vf, "silhouette_texel": int(mn.sum()),
            "texel_die_sich_vom_hintergrund_unterscheiden": diff_n,
            "delta_warm": dwarm, "delta_warm_min": M3_DWARM_MIN, "delta_warm_pass": dwarm_ok,
            "halbseiten_nah": hn, "halbseiten_nah_min": M3_HALB_MIN, "halbseiten_pass": halb_ok,
            "halbseiten_nah_noTint": hn_nt, "halbseiten_noTint_max": M3_HALB_NOTINT_MAX,
            "halbseiten_noTint_literal_differenz": hn_nt["differenz"],
            "halbseiten_noTint_literal_nebenbefund_pass":
                bool(abs(hn_nt["differenz"]) < M3_HALB_NOTINT_MAX),
            "halbseiten_tintanteil_kontrolle_pass": bool(halb_kontrolle),
            "halbseiten_fern": hf, "halbseiten_fern_noTint": hf_nt,
            "halbseiten_tintanteil_nah": tint_nah,
            "halbseiten_tintanteil_fern": tint_fern,
            "halbseiten_tintanteil_fern_kontrolle_pass": bool(abs(tint_fern) < M3_HALB_NOTINT_MAX),
            "lesart": f"K3 (Rev 2.2) GATE: Tint-ANTEIL an der Halbseiten-Differenz NAH "
                      f"= Halbseiten(Tint) - Halbseiten(__noTint), SELBER Frame/Ort, "
                      f">= +{M3_HALB_MIN} L. KONTROLLE: derselbe Anteil am FERNEN Ort "
                      f"< {M3_HALB_NOTINT_MAX} L. Die absolute Halbseiten-Differenz und "
                      f"die woertliche Rev-2.1-Kontrolle stehen als NEBENBEFUND daneben "
                      f"und wirken nicht aufs Gate.",
            "ausgebrannt_texel": aus, "ausgebrannt_pass": aus_ok,
            "pass": bool(ok)}
        print(f"  [{frame}] dWarm {dwarm} (>= {M3_DWARM_MIN}) {'OK' if dwarm_ok else 'ROT'} | "
              f"K3 Tint-Anteil NAH {tint_nah} L (>= {M3_HALB_MIN}) "
              f"{'OK' if halb_ok else 'ROT'} | FERN {tint_fern} L "
              f"(< {M3_HALB_NOTINT_MAX}) {'OK' if halb_kontrolle else 'KONTROLLE ROT'} | "
              f"[Nebenbefund: Halbseiten absolut NAH {hn['differenz']} L, mit __noTint "
              f"{hn_nt['differenz']} L] | ausgebrannt {aus} | Silhouette "
              f"{int(mn.sum())} Texel, davon {diff_n} gegen Hintergrund verschieden")
        if not dwarm_ok:
            errors.append(f"M3 {frame}: dWarm {dwarm} < {M3_DWARM_MIN}")
        if not halb_ok:
            errors.append(f"M3 {frame}: Tint-Anteil an der Halbseiten-Differenz NAH "
                          f"{tint_nah} < {M3_HALB_MIN} (K3)")
        if not aus_ok:
            errors.append(f"M3 {frame}: {aus} Silhouetten-Texel ueber L {M3_AUSBRENNEN_L}")

    # ---- KONTROLLEN --------------------------------------------------------
    kontrollen = {}
    for frame in ("player_down_0", "skeleton_0"):
        vn = silhouette_werte(S_nah["bilder"]["noTint_noLight"], S_nah["masken"][frame])
        vf = silhouette_werte(S_fern["bilder"]["noTint_noLight"], S_fern["masken"][frame])
        d = dE(vn, vf)
        kontrollen[f"positiv_noTint_noLight_{frame}"] = {
            "dE": d, "soll": 0.0, "pass": bool(d == 0.0),
            "nah_rgb": vn["mittel_rgb"], "fern_rgb": vf["mittel_rgb"]}
        v2 = silhouette_werte(S_fern2["bilder"]["normal"], S_fern2["masken"][frame])
        vf_n = silhouette_werte(S_fern["bilder"]["normal"], S_fern["masken"][frame])
        d2 = dE(vf_n, v2)
        # Aufschluesselung: liegt eine Restdifferenz am PUNCH (Licht) oder an der
        # TINT-Stufe? Beide Varianten desselben Standort-Paares.
        d2_nt = dE(silhouette_werte(S_fern["bilder"]["noTint"], S_fern["masken"][frame]),
                   silhouette_werte(S_fern2["bilder"]["noTint"], S_fern2["masken"][frame]))
        d2_nl = dE(silhouette_werte(S_fern["bilder"]["noTint_noLight"], S_fern["masken"][frame]),
                   silhouette_werte(S_fern2["bilder"]["noTint_noLight"], S_fern2["masken"][frame]))
        # NEBENBEFUND (K3: NICHT mehr die bindende Kontrolle). Der zweite
        # Standort liegt >= 48 px entfernt, seine Silhouette ragt dort aber
        # in einen Fackelkegel — die Zahl misst dann die Beleuchtungs-
        # DIFFERENZ zweier verschieden belichteter Orte, nicht die
        # Ortsunabhaengigkeit. CATACOMBS bietet beweisbar nur EIN kegelfreies
        # Gebiet; die bindende Fassung laeuft deshalb auf dem kegelfreien Paar.
        kontrollen[f"nebenbefund_zwei_ferne_standorte_48px_{frame}"] = {
            "bindend": False,
            "dE": d2, "soll": f"< {M3_FERN_DE_MAX}", "pass": bool(d2 < M3_FERN_DE_MAX),
            "dE_nur_ohne_tint": d2_nt, "dE_ohne_tint_ohne_licht": d2_nl,
            "fern1_rgb": vf_n["mittel_rgb"], "fern2_rgb": v2["mittel_rgb"],
            "abstand_der_standorte_px": round(math.hypot(f2["cx"] - f0["cx"],
                                                         f2["cy"] - f0["cy"]), 1),
            "box_abstand_fern1": round(box_abstand(f0["cx"], f0["cy"]), 1),
            "box_abstand_fern2": round(box_abstand(f2["cx"], f2["cy"]), 1)}
        if S_fern3:
            v3 = silhouette_werte(S_fern3["bilder"]["normal"], S_fern3["masken"][frame])
            d3 = dE(vf_n, v3)
            kontrollen[f"negativ_zwei_kegelfreie_standorte_{frame}"] = {
                "dE": d3, "soll": f"< {M3_FERN_DE_MAX}", "pass": bool(d3 < M3_FERN_DE_MAX),
                "abstand_der_standorte_px": round(math.hypot(f4["cx"] - f0["cx"],
                                                             f4["cy"] - f0["cy"]), 1),
                "hinweis": "K3 (Rev 2.2), BINDEND: beide Figuren stehen vollstaendig "
                           "ausserhalb jedes Kegels (CATACOMBS bietet beweisbar nur EIN "
                           "solches Gebiet, daher der kleine Abstand)"}
        else:
            kontrollen[f"negativ_zwei_kegelfreie_standorte_{frame}"] = {
                "dE": None, "soll": f"< {M3_FERN_DE_MAX}", "pass": False,
                "hinweis": "K3-Kontrolle nicht konstruierbar: kein kegelfreies Paar "
                           "gefunden -> Gate UNGUELTIG"}
    for k, v in kontrollen.items():
        zus = ""
        if "dE_nur_ohne_tint" in v:
            zus = f" [ohne Tint {v['dE_nur_ohne_tint']}, ohne Tint+Licht {v['dE_ohne_tint_ohne_licht']}]"
        print(f"  [Kontrolle] {k}: dE {v['dE']} (Soll {v['soll']}) "
              f"-> {'OK' if v['pass'] else 'FEHLGESCHLAGEN'}{zus}")
    # Die Halbseiten-Kontrolle (__noTint < 2 L) gehoert ebenfalls zu den Kontrollen
    for frame in ("player_down_0", "skeleton_0"):
        # NEBENBEFUND: die woertliche Rev-2.1-Kontrolle (absolute Halbseiten-
        # Differenz mit __noTint). Sie mass den Lichtfeld-Gradienten und die
        # Asymmetrie der Kunst mit und ist durch K3 ersetzt.
        kontrollen[f"nebenbefund_halbseiten_noTint_literal_{frame}"] = {
            "bindend": False,
            "differenz": ergebnis[frame]["halbseiten_nah_noTint"]["differenz"],
            "soll": f"|d| < {M3_HALB_NOTINT_MAX}",
            "lesart": "Rev 2.1 woertlich (ersetzt durch K3): Halbseiten-Differenz NAH "
                      "mit __noTint",
            "pass": ergebnis[frame]["halbseiten_noTint_literal_nebenbefund_pass"]}
        kontrollen[f"halbseiten_tintanteil_fern_{frame}"] = {
            "differenz": ergebnis[frame]["halbseiten_tintanteil_fern"],
            "soll": f"|d| < {M3_HALB_NOTINT_MAX}",
            "lesart": "K3 (Rev 2.2), BINDEND: Tint-Anteil (getoent - ungetoent, selber "
                      "Frame/Ort) am FERNEN Ort — dort darf die Maske nicht modellieren",
            "pass": ergebnis[frame]["halbseiten_tintanteil_fern_kontrolle_pass"]}
    kontrollen_ok = all(v["pass"] for v in kontrollen.values() if v.get("bindend", True))
    kontrollen_ok_inkl_nebenbefunde = all(v["pass"] for v in kontrollen.values())
    proof_results["M3_spritelicht"] = {
        "standorte": {"nah_spieler": n0, "nah_skelett": n1, "fern_spieler": f0,
                      "fern_skelett": f1, "fern2_spieler": f2, "fern2_skelett": f3,
                      "naechste_fackel_nah": tn,
                      "zugewandte_seite": "links" if links else "rechts"},
        "kameras": {"nah": S_nah["cam"], "fern": S_fern["cam"], "fern2": S_fern2["cam"]},
        "sprite_positionen": {"nah": S_nah["sprite_pos"], "fern": S_fern["sprite_pos"]},
        "frames": ergebnis, "kontrollen": kontrollen, "kontrollen_ok": kontrollen_ok,
        "kontrollen_ok_inkl_nebenbefunde": kontrollen_ok_inkl_nebenbefunde,
        "metrik": "K3 (Rev 2.2): Halbseiten-TINT-ANTEIL = Halbseiten(Tint) - "
                  "Halbseiten(__noTint) am selben Frame/Ort; Fern-Paar-Kontrolle auf "
                  "zwei KEGELFREIEN Orten",
        "threshold": f"dWarm >= +{M3_DWARM_MIN}; Halbseiten-TINT-ANTEIL NAH >= "
                     f"+{M3_HALB_MIN} L (K3); 0 Texel L > {M3_AUSBRENNEN_L}",
        "pass": bool(alle_ok and kontrollen_ok)}
    if not kontrollen_ok:
        ungueltig.append("M3_spritelicht (Kontrolle gescheitert)")
        errors.append("M3: KONTROLLE gescheitert -> Gate UNGUELTIG")

    ps = S_nah["sprite_pos"]["player_down_0"]
    crop_zoom("g6_crop_h_spieler_nah_fackel", S_nah["bilder"]["normal"],
              (max(0, ps[0] - 16), max(0, ps[1] - 12), ps[0] + 32, ps[1] + 36), kind="screen",
              note="Pflicht-Crop (h) Spieler nah an der Fackel: Warm-Tint-Maske (§4.2), "
                   "Halbseiten-Modellierung, Kontaktschatten")


# ===========================================================================
# M4 KRONEN-MASSSTAB & VERDECKUNG
# ===========================================================================
# ENGINE-RECHNUNG ueber die ECHTEN GRAVEYARD_OVER_ROWS (maps.js), mit dem
# echten anchorOffset (tilemap.js) und den echten Grids (sprites.js) — kein
# Nachbau aus dem P0b-Entwurf. timeSec = 0 = Ruhelage (poses[0] === art).
OVER_JS = """
async ([fw, fh, headRows, zellen]) => {
  const T = await import('/js/world/tilemap.js?real=1');
  const M = await import('/js/world/maps.js');
  const A = await import('/js/art/sprites.js');
  const md = M.MAPS.GRAVEYARD, lg = md.legend, over = md.overRows;
  const H = over.length, W = over[0].length, PW = W * 16, PH = H * 16;
  const ink = new Uint8Array(PW * PH);
  const keyAt = new Int16Array(PW * PH).fill(-1);
  const KEYS = [];
  const anker = [];
  for (let ty = 0; ty < H; ty++) {
    for (let tx = 0; tx < W; tx++) {
      const ch = over[ty][tx];
      if (ch === '.') continue;
      const def = lg[ch];
      if (!def) continue;
      const art = def.art;
      const g = A.TILE_ART[art];
      if (!g) continue;
      const off = def.span ? T.anchorOffset(def, tx, ty) : { dx: 0, dy: 0 };
      let id = KEYS.indexOf(art); if (id < 0) { KEYS.push(art); id = KEYS.length - 1; }
      anker.push({ tx, ty, ch, art, span: def.span || null, dx: off.dx, dy: off.dy,
                   w: g[0].length, h: g.length });
      const ox = tx * 16 + off.dx, oy = ty * 16 + off.dy;
      for (let y = 0; y < g.length; y++) {
        for (let x = 0; x < g[y].length; x++) {
          if (g[y][x] === '.') continue;
          const px = ox + x, py = oy + y;
          if (px < 0 || py < 0 || px >= PW || py >= PH) continue;
          ink[py * PW + px] = 1; keyAt[py * PW + px] = id;
        }
      }
    }
  }
  const II = new Int32Array((PW + 1) * (PH + 1));
  for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) {
    II[(y + 1) * (PW + 1) + (x + 1)] = ink[y * PW + x] + II[y * (PW + 1) + (x + 1)]
      + II[(y + 1) * (PW + 1) + x] - II[y * (PW + 1) + x];
  }
  const summe = (x0, y0, w, h) => II[(y0 + h) * (PW + 1) + x0 + w] - II[y0 * (PW + 1) + x0 + w]
    - II[(y0 + h) * (PW + 1) + x0] + II[y0 * (PW + 1) + x0];
  const fensterKeys = (x0, y0) => {
    const c = new Map();
    for (let y = y0; y < y0 + fh; y++) for (let x = x0; x < x0 + fw; x++) {
      const id = keyAt[y * PW + x]; if (id < 0) continue;
      c.set(KEYS[id], (c.get(KEYS[id]) || 0) + 1);
    }
    return c;
  };
  const istXL = (k) => k.indexOf('tree_canopy_xl_') === 0;
  let best = null, bestGate = null;
  for (let y = 0; y + fh <= PH; y++) {
    for (let x = 0; x + fw <= PW; x++) {
      const s = summe(x, y, fw, fh);
      if (!best || s > best.s) best = { x, y, s };
      if (s / (fw * fh) < 0.85) continue;
      const keys = fensterKeys(x, y);
      const xl = [...keys.keys()].filter(istXL);
      if (xl.length < 2) continue;
      const maxA = Math.max(...[...keys.values()]) / s;
      if (maxA > 0.60) continue;
      if (!bestGate || s > bestGate.s) bestGate = { x, y, s,
        keys: Object.fromEntries([...keys.entries()].map(([k, v]) => [k, Math.round(1000*v/s)/10])),
        maxAnteil: Math.round(1000 * maxA) / 10, xl_keys: xl.length };
    }
  }
  if (best) {
    const keys = fensterKeys(best.x, best.y);
    best.keys = Object.fromEntries([...keys.entries()].map(([k, v]) => [k, Math.round(1000*v/best.s)/10]));
    best.maxAnteil = Math.round(1000 * Math.max(...[...keys.values()]) / best.s) / 10;
    best.xl_keys = [...keys.keys()].filter(istXL).length;
    best.anteil = best.s / (fw * fh);
  }
  if (bestGate) bestGate.anteil = bestGate.s / (fw * fh);
  // Beweiszellen-Rechnung (Sprite-Ort wie entities/player.js: x = tx*16,
  // y = ty*16 - 9 bei mittigem Stand), Kopf-Fenster = oberste headRows Zeilen.
  const sp = A.SPRITES.player_down_0;
  const beweis = {};
  for (const [tx, ty] of zellen) {
    let sil = 0, verdeckt = 0;
    const kronen = new Set();
    for (let y = 0; y < headRows; y++) {
      for (let x = 0; x < sp[y].length; x++) {
        if (sp[y][x] === '.') continue;
        sil++;
        const px = tx * 16 + x, py = ty * 16 - 9 + y;
        if (px >= 0 && py >= 0 && px < PW && py < PH && ink[py * PW + px]) {
          verdeckt++;
          const id = keyAt[py * PW + px]; if (id >= 0) kronen.add(KEYS[id]);
        }
      }
    }
    beweis[tx + ',' + ty] = { silhouette_kopf: sil, verdeckt_kopf: verdeckt,
      quotient: Math.round(1000 * verdeckt / sil) / 1000, kronen: [...kronen] };
  }
  return { bestes_fenster: best, bestes_fenster_mit_gegengate: bestGate,
           beweis, anker_gesamt: anker.length,
           anker: anker.filter((a) => a.span), keys: KEYS };
}
"""


def m4(pw):
    print("== M4 KRONEN-MASSSTAB & VERDECKUNG (GRAVEYARD) ==")
    bz = M4_BEWEISZELLE
    cx, cy = tcx(bz[0]), tcx(bz[1])
    browser, ctx, page = open_map(pw, BASE + "/")
    page.evaluate("() => { window.__noFog = true; }")
    place(page, cx, cy)
    cam = settle_camera(page, "g6_10_unter_kronen", (cx, cy))
    page.wait_for_timeout(250)
    set_scale(page, 0)
    page.wait_for_timeout(150)
    clear_particles(page)
    page.wait_for_timeout(80)
    eng = page.evaluate(OVER_JS, [M4_FENSTER[0], M4_FENSTER[1], KRONEN_HEAD_ROWS_GP6,
                                  [list(bz), list(M4_KRONENFREI)]])
    pz = page.evaluate("() => { const p = window.__player; return {x: p.x, y: p.y, w: p.w, h: p.h}; }")
    grids = sprite_grids(page)
    jury = backing_store(page)
    page.evaluate("() => { window.__noFog = false; }")
    page.wait_for_timeout(150)
    juryF = backing_store(page)
    page.evaluate("() => { window.__noFog = true; }")
    page.wait_for_timeout(150)
    A_im = backing_store(page)
    A2_im = backing_store(page)
    page.evaluate("() => { const p = window.__player; p.__sy = p.y; p.y = -9999; }")
    page.wait_for_timeout(180)
    B_im = backing_store(page)
    page.evaluate("() => { window.__noOver = true; }")
    page.wait_for_timeout(180)
    D_im = backing_store(page)
    page.evaluate("() => { const p = window.__player; p.y = p.__sy; }")
    page.wait_for_timeout(180)
    C_im = backing_store(page)
    page.evaluate("() => { window.__noOver = false; window.__noFog = false; }")
    camE = get_camera(page)
    assert_int_camera(camE, "g6_10_ende")
    if abs(camE["x"] - cam["x"]) + abs(camE["y"] - cam["y"]) > 0.01:
        errors.append(f"M4: Kamera driftete zwischen den Aufnahmen ({cam} -> {camE})")
    ctx.close(); browser.close()

    save_scene("g6_10_unter_kronen", juryF, note="M4-Beweiszelle (31,9) unter der "
               "xl_b-Krone bei (30,8)", cam=cam)
    for t, im in (("g6_10_hilf_b_ohne_spieler", B_im), ("g6_10_hilf_c_ohne_laub", C_im),
                  ("g6_10_hilf_d_ohne_spieler_ohne_laub", D_im)):
        im.resize((VIEW_W * SCENE_ZOOM, VIEW_H * SCENE_ZOOM), Image.NEAREST).save(f"{OUT}/{t}.png")

    gp = grids["player_down_0"]
    sx = int(round(pz["x"] + (pz["w"] - len(gp[0])) / 2 - cam["x"]))
    sy = int(round(pz["y"] + pz["h"] - len(gp) - cam["y"]))
    kopf = np.zeros((VIEW_H, VIEW_W), dtype=bool)
    kopf[max(0, sy):max(0, sy) + KRONEN_HEAD_ROWS_GP6, max(0, sx):sx + len(gp[0])] = True
    # VOLL-Silhouette (Rev 2.4 J2): dasselbe C/D-Verfahren ueber das GANZE
    # Sprite-Fenster (Juror-K-Box x177..191 / y73..97 = 275 Texel), nicht nur
    # ueber die obersten 16 Zeilen.
    voll = np.zeros((VIEW_H, VIEW_W), dtype=bool)
    voll[max(0, sy):sy + len(gp), max(0, sx):sx + len(gp[0])] = True
    aA, aB, aC, aD, aA2 = (arr(x) for x in (A_im, B_im, C_im, D_im, A2_im))
    d_AB = np.abs(aA - aB).sum(axis=2)     # was der SPIELER am Bild aendert
    d_CD = np.abs(aC - aD).sum(axis=2)     # was er OHNE Laub aendert (Referenz)
    sil = (d_CD > 0) & kopf
    verdeckt = sil & (d_AB == 0)
    sil_n, verd_n = int(sil.sum()), int(verdeckt.sum())
    quot = verd_n / sil_n if sil_n else 0.0
    sil_v = (d_CD > 0) & voll
    lesbar_v = sil_v & (d_AB > 0)
    sil_v_n, les_v_n = int(sil_v.sum()), int(lesbar_v.sum())
    les_v_pct = round(100.0 * les_v_n / sil_v_n, 2) if sil_v_n else 0.0
    les_k_n = int((sil & (d_AB > 0)).sum())
    les_k_pct = round(100.0 * les_k_n / sil_n, 2) if sil_n else 0.0
    # GRADIERTE VERDECKUNG V (Rev 2.5 F3 — jetzt die GATE-GROESSE):
    # Die binaere Zaehlung `A == B` ist bei globalAlpha < 1 konstruktiv 0 —
    # ein teiltransparenter Spieler veraendert JEDEN Silhouetten-Texel ein
    # wenig. Der gradierte Wert misst, WIE STARK die Krone den Spieler
    # daempft: V = 1 - mean|A-B| / mean|C-D| ueber dieselbe Silhouette
    # (0 = Krone unsichtbar, 1 = Spieler restlos ausgeloescht).
    grad_kopf = (round(float(1.0 - d_AB[sil].mean() / d_CD[sil].mean()), 3)
                 if sil_n and d_CD[sil].mean() > 0 else None)
    grad_voll = (round(float(1.0 - d_AB[sil_v].mean() / d_CD[sil_v].mean()), 3)
                 if sil_v_n and d_CD[sil_v].mean() > 0 else None)
    aa = int((sil & (np.abs(aA - aA2).sum(axis=2) > 0)).sum())
    # PROTOKOLL (Exakt-Regime, seit Rev 2.5 KEIN Gate mehr)
    verd_ok = verd_n >= M4_VERDECKT_MIN
    quot_ok = quot >= M4_QUOT_MIN
    quot_max_ok = quot <= M4_QUOT_MAX
    # GATE (Rev 2.5 F3)
    v_ok = grad_kopf is not None and M4_V_KOPF_MIN <= grad_kopf <= M4_V_KOPF_MAX
    lesbar_ok = les_v_pct >= M4_VOLL_LESBAR_MIN_PCT
    if sil_v_n and abs(sil_v_n - M4_VOLL_SIL_REF) > M4_VOLL_SIL_REF * M4_VOLL_SIL_TOL_PCT / 100.0:
        warnings.append(f"M4: Voll-Silhouette {sil_v_n} Texel weicht > "
                        f"{M4_VOLL_SIL_TOL_PCT} % von der Juror-K-Referenz "
                        f"{M4_VOLL_SIL_REF} ab (Fenster pruefen)")
    print(f"  Beweiszelle {bz}: Sprite bei ({sx},{sy}), Kopf-Fenster {KRONEN_HEAD_ROWS_GP6} Zeilen "
          f"-> GATE (Rev 2.5 F3) V(Kopf) {grad_kopf} (Band {M4_V_KOPF_MIN}.."
          f"{M4_V_KOPF_MAX}) {'OK' if v_ok else 'ROT'}; V(Voll) {grad_voll}")
    print(f"  VOLL-Silhouette (Rev 2.4 J2): {sil_v_n} Texel (K-Referenz {M4_VOLL_SIL_REF}), "
          f"davon LESBAR {les_v_n} = {les_v_pct} % (Soll >= {M4_VOLL_LESBAR_MIN_PCT} %) "
          f"{'OK' if lesbar_ok else 'ROT'}; Kopf-Fenster lesbar {les_k_n} = {les_k_pct} %")
    print(f"  [Protokoll, Exakt-Regime, seit Rev 2.5 KEIN Gate] silhouette_kopf {sil_n}, "
          f"verdeckt_kopf {verd_n} (A==B exakt), Quotient {quot:.3f}")
    print(f"  ENGINE-Rechnung (echte OVER_ROWS, rein GEOMETRISCH — alpha-blind): "
          f"{eng['beweis'][f'{bz[0]},{bz[1]}']}")

    # Kontrolle: kronenfreie Kachel — dieselbe Rechnung, andere Zelle
    kf = eng["beweis"][f"{M4_KRONENFREI[0]},{M4_KRONENFREI[1]}"]
    kontrollen = {
        "negativ_A_gegen_A": {"abweichende_texel": aa, "soll": 0, "pass": aa == 0},
        "positiv_silhouette_kopf": {"wert": sil_n, "soll": "> 0", "pass": sil_n > 0},
        "negativ_kronenfreie_kachel": {"zelle": list(M4_KRONENFREI), **kf,
                                       "soll": "verdeckt_kopf == 0",
                                       "pass": kf["verdeckt_kopf"] == 0},
    }
    for k, v in kontrollen.items():
        print(f"  [Kontrolle] {k}: {v.get('abweichende_texel', v.get('wert', v.get('verdeckt_kopf')))} "
              f"(Soll {v['soll']}) -> {'OK' if v['pass'] else 'FEHLGESCHLAGEN'}")

    # ---- Dach-Fenster-Gate -------------------------------------------------
    bg = eng["bestes_fenster_mit_gegengate"]
    dach_pct = round(100.0 * bg["anteil"], 2) if bg else 0.0
    dach_ok = bool(bg) and dach_pct >= M4_DACH_MIN
    print(f"  Dach-Fenster {M4_FENSTER[0]}x{M4_FENSTER[1]} (Gegen-Gate-konform): "
          f"{dach_pct} % Deckung bei ({bg['x']},{bg['y']}), {bg['xl_keys']} XL-Keys, "
          f"groesster Key {bg['maxAnteil']} % -> {'OK' if dach_ok else 'ROT'}"
          if bg else "  Dach-Fenster: KEIN Gegen-Gate-konformes Fenster gefunden -> ROT")

    if not v_ok:
        errors.append(f"M4: V(Kopf) {grad_kopf} ausserhalb {M4_V_KOPF_MIN}.."
                      f"{M4_V_KOPF_MAX} (Rev 2.5 F3: gradierte Verdeckung "
                      f"1 - mean|A-B| / mean|C-D|)")
    if not lesbar_ok:
        errors.append(f"M4: nur {les_v_pct} % der Voll-Silhouette lesbar "
                      f"({les_v_n} von {sil_v_n} Texeln) < {M4_VOLL_LESBAR_MIN_PCT} % "
                      f"(Rev 2.4 J2)")
    if not dach_ok:
        errors.append(f"M4: Dach-Deckung {dach_pct} % < {M4_DACH_MIN} %")

    # ---- Jury-Bild + Crop des besten Dach-Fensters -------------------------
    if bg:
        pcx = bg["x"] + M4_FENSTER[0] // 2
        pcy = bg["y"] + M4_FENSTER[1] // 2 + 40      # Spieler UNTER das Dach setzen
        browser, ctx, page = open_map(pw, BASE + "/")
        place(page, pcx, pcy)
        cam2 = settle_camera(page, "g6_11_dach", (pcx, pcy))
        set_scale(page, 0)
        page.wait_for_timeout(200)
        dach = backing_store(page)
        ctx.close(); browser.close()
        save_scene("g6_11_dach_xl", dach, note=f"bestes Gegen-Gate-konformes "
                   f"{M4_FENSTER[0]}x{M4_FENSTER[1]}-Fenster bei ({bg['x']},{bg['y']})", cam=cam2)
        crop_zoom("g6_crop_b_dach", dach,
                  (bg["x"], bg["y"], bg["x"] + M4_FENSTER[0], bg["y"] + M4_FENSTER[1]), cam2,
                  note=f"Pflicht-Crop (b) Dach: das GEMESSENE beste 48x32-Fenster "
                       f"({bg['xl_keys']} XL-Keys, groesster Key {bg['maxAnteil']} %)")
    crop_zoom("g6_crop_j_unter_kronen", juryF,
              (max(0, sx - 24), max(0, sy - 24), sx + 40, sy + 40), kind="screen",
              note=f"M4-Beweiszelle: Spieler unter der xl_b-Krone — P0-A-Fix "
                   f"(globalAlpha 0,55): {les_v_pct} % der {sil_v_n} Voll-Silhouetten-"
                   f"Texel bleiben lesbar, gradierte Verdeckung V(Kopf) {grad_kopf} / "
                   f"V(Voll) {grad_voll}")

    ergebnis = {
        "beweiszelle": list(bz), "sprite_screen": [sx, sy],
        "kopf_zeilen": KRONEN_HEAD_ROWS_GP6,
        "bild": {"silhouette_kopf": sil_n, "verdeckt_kopf": verd_n,
                 "quotient": round(quot, 3),
                 "lesbar_kopf": les_k_n, "lesbar_kopf_pct": les_k_pct,
                 "voll_silhouette": sil_v_n, "voll_silhouette_referenz_K": M4_VOLL_SIL_REF,
                 "voll_lesbar": les_v_n, "voll_lesbar_pct": les_v_pct,
                 "sprite_fenster": [max(0, sx), max(0, sy), sx + len(gp[0]), sy + len(gp)]},
        "engine": eng["beweis"][f"{bz[0]},{bz[1]}"],
        "engine_lesart": "REIN GEOMETRISCH (Kronen-Ink ueber Sprite-Ink) und damit "
                         "ALPHA-BLIND: der Wert bleibt 1,00, auch wenn die Krone mit "
                         "globalAlpha 0,55 gezeichnet wird. Er belegt die Ueberlappung, "
                         "nicht die Ausloeschung.",
        "gradierte_verdeckung_V": {
            "kopf": grad_kopf, "voll": grad_voll,
            "band_kopf": [M4_V_KOPF_MIN, M4_V_KOPF_MAX], "pass": bool(v_ok),
            "formel": "V = 1 - mean|A-B| / mean|C-D| ueber dieselbe Silhouette "
                      "(0 = Krone unsichtbar, 1 = Spieler restlos ausgeloescht)",
            "status": "GATE-GROESSE seit Rev 2.5 (F3)"},
        "exakt_regime_protokoll": {
            "verdeckt_kopf": verd_n, "quotient": round(quot, 3),
            "alte_schwellen": [f"verdeckt_kopf >= {M4_VERDECKT_MIN}",
                               f"Quotient >= {M4_QUOT_MIN}",
                               f"Quotient <= {M4_QUOT_MAX}"],
            "alte_pass": {"verdeckt": verd_ok, "quotient_min": quot_ok,
                          "quotient_max": quot_max_ok},
            "lesart": "Die binaere A==B-Zaehlung ist bei globalAlpha < 1 KONSTRUKTIV 0 "
                      "(ein teiltransparenter Spieler veraendert jeden Silhouetten-"
                      "Texel). Rev 2.5 (F3) hat diese Schwellen deshalb durch das "
                      "V-Band ersetzt; die Zahlen laufen nur noch als Protokoll mit "
                      "und erzeugen KEINEN Fehler.",
            "gegenprobe_geometrie": "Die alpha-blinde Engine-Rechnung (rein "
                                    "geometrische Ueberlappung) steht unveraendert bei "
                                    "Quotient 1,00 — die Krone LIEGT weiterhin voll "
                                    "ueber dem Kopf, sie loescht ihn nur nicht mehr aus."},
        "voll_lesbar_min_pct": M4_VOLL_LESBAR_MIN_PCT, "voll_lesbar_pass": lesbar_ok,
        "voll_lesbar_lesart": "Binaeres Kriterium der Jury (J2): lesbar := der Spieler "
                              "veraendert den Texel. Es trennt scharf zwischen "
                              "globalAlpha == 1 (0 %) und globalAlpha < 1 (100 %); wie "
                              "STARK die Krone daempft, misst allein V.",
        "dach_fenster": {"groesse": list(M4_FENSTER), "bestes_ohne_gate": eng["bestes_fenster"],
                         "bestes_mit_gegengate": bg, "deckung_pct": dach_pct,
                         "schwelle_pct": M4_DACH_MIN, "pass": dach_ok,
                         "gegengate": f">= {M4_GEGENGATE_XL_MIN} XL-Keys, kein Key > "
                                      f"{M4_GEGENGATE_MAX_ANTEIL} %"},
        "kontrollen": kontrollen,
        "kontrollen_ok": all(v["pass"] for v in kontrollen.values()),
        "verfahren": "A Spieler+Laub / B ohne Spieler / C Spieler ohne Laub / D ohne beides; "
                     "silhouette_kopf = C!=D im Kopf-Fenster, V = 1 - mean|A-B| / "
                     "mean|C-D| darauf; Voll-Silhouette = C!=D im GANZEN Sprite-Fenster, "
                     "lesbar = davon A!=B",
        "threshold": f"V(Kopf) in {M4_V_KOPF_MIN}..{M4_V_KOPF_MAX} (Rev 2.5 F3) UND "
                     f">= {M4_VOLL_LESBAR_MIN_PCT} % der Voll-Silhouette lesbar "
                     f"(Rev 2.4 J2); Dach-Fenster >= {M4_DACH_MIN} %",
        "pass": bool(v_ok and lesbar_ok and dach_ok
                     and all(v["pass"] for v in kontrollen.values()))}
    proof_results["M4_kronen"] = ergebnis
    if not ergebnis["kontrollen_ok"]:
        ungueltig.append("M4_kronen (Kontrolle gescheitert)")
        errors.append("M4: KONTROLLE gescheitert -> Gate UNGUELTIG")
    m4_rechtsrand(pw, eng)


# --- M4: Kein Rechtsrand-Ploppen (§5.4, 2-Kamera-Vergleich) -----------------
def m4_rechtsrand(pw, eng):
    print("  -- M4 Rechtsrand-Culling (2-Kamera-Vergleich) --")
    # Ein Anker, dessen NEGATIVER anchorOffset die Krone nach LINKS in den
    # Viewport zieht, obwohl der Anker rechts davon steht: genau der Fall, den
    # §5.4 (txEnd = tx1+1) rettet. Bedingung dx <= -9, damit ueberhaupt Pixel
    # links der Fenstergrenze liegen.
    kand = [a for a in eng["anker"] if a["dx"] <= -9 and 2 <= a["ty"] <= 20]
    if not kand:
        warnings.append("M4 Rechtsrand: kein Anker mit dx <= -9 im Over-Layer")
        proof_results["M4_rechtsrand"] = {"pass": None, "grund": "kein passender Anker"}
        return
    a = sorted(kand, key=lambda z: z["dx"])[0]
    tx, ty = a["tx"], a["ty"]
    camx = (tx - 1) * TILE + 8 - VIEW_W            # Anker liegt dann auf tx1+1
    camy = max(0, min(384 - VIEW_H, ty * TILE - 40))
    if camx < 0:
        warnings.append(f"M4 Rechtsrand: Anker ({tx},{ty}) zu weit links (camx {camx})")
        proof_results["M4_rechtsrand"] = {"pass": None, "grund": "Kamera ausserhalb"}
        return
    print(f"     Anker ({tx},{ty}) '{a['ch']}' {a['art']} dx={a['dx']} dy={a['dy']}; "
          f"Kamera A ({camx},{camy}) -> Anker auf tx1+1, Kamera B ({camx+16},{camy})")

    def schuss(camx, camy, phase=0):
        browser, ctx, page = open_map(pw, BASE + "/")
        page.evaluate("() => { window.__noFog = true; window.__noVignette = true; }")
        place(page, camx + 160, camy + 90)
        cam = settle_camera(page, f"g6_12_cam{camx}", (camx + 160, camy + 90))
        set_scale(page, 0.25)
        # Beide Aufnahmen muessen auf DEMSELBEN Sway-Tick modulo 8 stehen —
        # sonst zeigen die Kronen im Ueberlapp verschiedene Scher-Posen und der
        # Vergleich misst den Wind statt das Culling.
        t0 = time_now(page)
        tick = int(t0 * 3.2) + 2
        while tick % 8 != phase:
            tick += 1
        arm_freeze(page, counter_cond(3.2, tick), timeout_ms=20000)
        if not wait_frozen(page, timeout=22000):
            warnings.append(f"M4 Rechtsrand: Pose-Tick {tick} nicht getroffen")
        clear_particles(page)
        page.wait_for_timeout(80)
        page.evaluate("() => { const p = window.__player; p.__sy = p.y; p.y = -9999; }")
        page.wait_for_timeout(150)
        pose = page.evaluate("""async ([tx, ty]) => {
          const T = await import('/js/world/tilemap.js?real=1');
          return { pose: T.swayPose8(tx, ty, window.__timeSec, T.CROWN_POSE_RATE),
                   t: window.__timeSec, tick: Math.floor(window.__timeSec * 3.2) }; }""",
                             [tx, ty])
        mit = backing_store(page)
        page.evaluate("() => { window.__noOver = true; }")
        page.wait_for_timeout(150)
        ohne = backing_store(page)
        page.evaluate("() => { window.__noOver = false; }")
        camE = get_camera(page)
        ctx.close(); browser.close()
        return cam, camE, mit, ohne, pose

    camA, camAE, A_mit, A_ohne, poseA = schuss(camx, camy, 0)
    camB, camBE, B_mit, B_ohne, poseB = schuss(camx + 16, camy, 0)
    ok_cam = (camA and camB and camA["x"] == camx and camB["x"] == camx + 16
              and camA["y"] == camy and camB["y"] == camy)
    ok_pose = poseA["pose"] == poseB["pose"]
    # Over-Pixel im UEBERLAPPENDEN Weltstreifen vergleichen (Kamera B ist 16 px
    # weiter rechts): A-Spalten 16..319 gegen B-Spalten 0..303.
    aA, aB = arr(A_mit), arr(B_mit)
    oA = (np.abs(aA - arr(A_ohne)).sum(axis=2) > 0)
    oB = (np.abs(aB - arr(B_ohne)).sum(axis=2) > 0)
    ueberlappA = slice(16, VIEW_W)
    ueberlappB = slice(0, VIEW_W - 16)
    over_diff = int((oA[:, ueberlappA] != oB[:, ueberlappB]).sum())
    bild_diff = int((np.abs(aA[:, ueberlappA] - aB[:, ueberlappB]).sum(axis=2) > 0).sum())
    # Krone im Bild? (Ihre Pixel liegen links der Fenstergrenze.)
    kx0 = tx * TILE + a["dx"] - camx
    krone_sichtbar = int(oA[:, max(0, kx0):max(0, kx0) + a["w"]].sum())
    ok = ok_cam and ok_pose and over_diff == 0 and krone_sichtbar > 0
    save_scene("g6_12_rechtsrand_a", A_mit, note=f"Kamera ({camx},{camy}): Kronen-Anker "
               f"({tx},{ty}) liegt auf tx1+1 — §5.4-Culling", cam=camA)
    save_scene("g6_12_rechtsrand_b", B_mit, note=f"Kamera ({camx+16},{camy}): derselbe Anker "
               f"innerhalb tx1", cam=camB)
    proof_results["M4_rechtsrand"] = {
        "anker": a, "kamera_a": camA, "kamera_b": camB,
        "pose_a": poseA, "pose_b": poseB, "pose_gleich": bool(ok_pose),
        "over_texel_a": int(oA[:, ueberlappA].sum()), "over_texel_b": int(oB[:, ueberlappB].sum()),
        "abweichende_over_texel_im_ueberlapp": over_diff,
        "abweichende_bild_texel_im_ueberlapp": bild_diff,
        "krone_sichtbare_over_texel": krone_sichtbar,
        "threshold": "0 abweichende Over-Texel im ueberlappenden Weltstreifen "
                     "(Krone poppt nicht) UND Krone tatsaechlich sichtbar",
        "pass": bool(ok)}
    print(f"     Pose A {poseA['pose']} / B {poseB['pose']} gleich={ok_pose}; Over-Texel im "
          f"Ueberlapp A {int(oA[:, ueberlappA].sum())} / B {int(oB[:, ueberlappB].sum())}, "
          f"abweichend {over_diff}; Krone sichtbar {krone_sichtbar} Texel -> "
          f"{'PASS' if ok else 'ROT'}")
    if not ok:
        errors.append(f"M4 RECHTSRAND: {over_diff} abweichende Over-Texel im Ueberlapp "
                      f"(Pose gleich={ok_pose}, Kamera ok={ok_cam}, "
                      f"Krone sichtbar={krone_sichtbar})")


# ===========================================================================
# M5 KONTAKTSCHATTEN-ABDECKUNG (Bild-Gate aussen + innen)
# ===========================================================================
# Geometrie woertlich aus main.js:715-717/750-765: die Schattenzeile mit
# dy = -1 ist die EINZIGE unter der Fusskante (baseY = y + h - 1, Bildzeile
# round(baseY - cam.y) + 1), Breite round(w * 0,90), Alpha 0,30.
def schattenzeile(ent, cam, faktor=0.90):
    base_y = ent["y"] + ent["h"] - 1
    cxw = ent["x"] + ent["w"] / 2
    w = max(1, int(round(ent["w"] * faktor)))
    x0 = int(round(cxw - w / 2 - cam["x"]))
    y = int(round(base_y - cam["y"])) + 1
    return x0, y, w


def schatten_messung(A_im, B_im, ent, cam, faktor=0.90):
    x0, y, w = schattenzeile(ent, cam, faktor)
    if not (0 <= y < VIEW_H):
        return {"fehler": f"Schattenzeile y={y} ausserhalb des Bildes"}
    La = lum(arr(A_im))
    Lb = lum(arr(B_im))
    xs = [x for x in range(x0, x0 + w) if 0 <= x < VIEW_W]
    d = [round(float(Lb[y, x] - La[y, x]), 2) for x in xs]
    treffer = sum(1 for v in d if v >= M5_DL_MIN)
    # Diagnose: das ganze 4-Zeilen-Profil (dy -1..2)
    profil = {}
    for dy, f in ((-1, 0.90), (0, 0.95), (1, 0.70), (2, 0.40)):
        xx0, yy, ww = schattenzeile(ent, cam, f)
        yy = int(round(ent["y"] + ent["h"] - 1 - cam["y"])) - dy
        if 0 <= yy < VIEW_H:
            profil[str(dy)] = [round(float(Lb[yy, x] - La[yy, x]), 2)
                               for x in range(xx0, xx0 + ww) if 0 <= x < VIEW_W]
    return {"zeile_y": y, "x_von": x0, "breite": w, "delta_L": d,
            "texel_ueber_schwelle": treffer, "schwelle_dL": M5_DL_MIN,
            "soll_texel": M5_TEXEL_MIN, "pass": treffer >= M5_TEXEL_MIN,
            "profil_4_zeilen": profil}


def m5_szene(pw, tag, url, spieler, skelett, note, innen=False, boss=False):
    browser, ctx, page = open_map(pw, BASE + url)
    if boss:
        page.wait_for_timeout(800)
        hold_boss(page)
        place(page, *spieler, clear_world=False)
    else:
        place(page, *spieler)
    cam = settle_camera(page, tag, spieler)
    page.wait_for_timeout(250)
    set_scale(page, 0)
    page.wait_for_timeout(150)
    if skelett:
        liste = [list(skelett)] if isinstance(skelett, tuple) else [list(s) for s in skelett]
        page.evaluate("""(liste) => {
          const F = window.__mkEnemy, arr = window.__enemies;
          for (const [x, y] of liste) {
            const e = F.skeleton({ x, y });
            e.state = 'wander'; e.animTimer = 0; e.hurtTimer = 0; e.stunTimer = 0;
            e.facingLeft = false; e.x = x - e.w / 2; e.y = y - e.h / 2;
            arr.push(e);
          }
        }""", liste)
        page.wait_for_timeout(150)
    jury = backing_store(page)
    clear_particles(page)
    page.wait_for_timeout(120)
    ents = page.evaluate("""() => {
      const p = window.__player;
      const l = [{ name: 'spieler', x: p.x, y: p.y, w: p.w, h: p.h }];
      for (const e of (window.__enemies || []))
        l.push({ name: e.kind, x: e.x, y: e.y, w: e.w, h: e.h });
      return l; }""")
    A_im = backing_store(page)
    A2_im = backing_store(page)
    page.evaluate("() => { const p = window.__player; p.__sy = p.y; p.y = -9999;"
                  " window.__enemies.__save = (window.__enemies || []).slice();"
                  " window.__enemies.length = 0; }")
    page.wait_for_timeout(200)
    B_im = backing_store(page)
    # a am Messort (Fackelkegel-Nachweis innen) + Vignetten-Abstand
    lit = page.evaluate("""async ([ax, ay]) => {
      const L = await import('/js/core/lighting.js?real=1');
      const s = window.__snap;
      return L.lightAt(s.lights, ax, ay, s.ambient, s.timeSec); }""",
                        [spieler[0], spieler[1] + 6])
    page.evaluate("() => { const p = window.__player; p.y = p.__sy;"
                  " for (const e of (window.__enemies.__save || [])) window.__enemies.push(e); }")
    camE = get_camera(page)
    assert_int_camera(camE, tag + "_ende")
    ctx.close(); browser.close()
    save_scene(tag, jury, note=note, cam=cam)
    return {"cam": cam, "A": A_im, "A2": A2_im, "B": B_im, "ents": ents, "lit": lit}


def m5(pw):
    print("== M5 KONTAKTSCHATTEN (Bild-Gate) ==")
    # --- Messorte suchen ---------------------------------------------------
    browser, ctx, page = open_map(pw, BASE + "/?map=CATACOMBS")
    place(page, tcx(12), tcx(17))
    settle_camera(page, "m5_suche", (tcx(12), tcx(17)))
    set_scale(page, 0)
    page.wait_for_timeout(150)
    nah = page.evaluate(SUCH_JS, ["nah", 0, None])
    ctx.close(); browser.close()
    innen = next(c for c in nah if c["a"] <= M5_INNEN_A_MAX)
    # MEHRERE kegelkonforme Messorte in EINER Aufnahme: die Spec laesst den Ort
    # offen ("Innen-Messort in einem Fackelkegel, a <= 0,15"), verlangt aber den
    # Nachweis. Ein Skelett je Ort, alle im selben Bild, alle mit a <= 0,15 und
    # innerhalb der vignettenfreien Zone; jeder Ort wird EINZELN ausgewiesen.
    innen_orte = []
    for c in nah:
        if c["a"] > M5_INNEN_A_MAX:
            continue
        if math.hypot(c["cx"] - innen["cx"], c["cy"] - innen["cy"]) < 20:
            continue
        if any(math.hypot(c["cx"] - o["cx"], c["cy"] - o["cy"]) < 20 for o in innen_orte):
            continue
        # im Bild der Kamera (Spieler mittig) und ausserhalb der Vignettenzone
        dx, dy = c["cx"] - innen["cx"], c["cy"] - innen["cy"]
        if abs(dx) > 120 or abs(dy) > 60 or math.hypot(dx, dy) > M5_VIGNETTE_R - 10:
            continue
        innen_orte.append(c)
        if len(innen_orte) >= 4:
            break
    innen_sk = innen_orte[0] if innen_orte else innen
    print(f"  INNEN Messort ({innen['cx']},{innen['cy']}) a={innen['a']:.3f} "
          f"(Soll <= {M5_INNEN_A_MAX}); {len(innen_orte)} weitere kegelkonforme Orte: "
          f"{[(o['cx'], o['cy'], round(o['a'], 3)) for o in innen_orte]}")

    # AUSSEN: freie Grasflaeche ohne Over-Zelle im Umkreis (der Kronenschatten
    # aus dem Zweitpass wuerde sonst in der Messzeile liegen).
    browser, ctx, page = open_map(pw, BASE + "/")
    aussen_kand = page.evaluate("""async () => {
      const M = await import('/js/world/maps.js');
      const md = M.MAPS.GRAVEYARD, rows = md.rows, over = md.overRows, lg = md.legend;
      const out = [];
      for (let ty = 6; ty < rows.length - 6; ty++) {
        for (let tx = 10; tx < rows[ty].length - 10; tx++) {
          const d = lg[rows[ty][tx]];
          if (!d || d.solid || d.shorePrefix || d.depthOverlays) continue;
          if (!/^grass/.test(d.art || '')) continue;
          let frei = true;
          for (let dy = -3; dy <= 2 && frei; dy++)
            for (let dx = -4; dx <= 2 && frei; dx++) {
              const ry = ty + dy, rx = tx + dx;
              if (ry < 0 || ry >= over.length || rx < 0 || rx >= over[0].length) continue;
              if (over[ry][rx] !== '.') frei = false;
              const dd = lg[rows[ry][rx]];
              if (dd && (dd.solid || dd.shorePrefix || dd.depthOverlays)) frei = false;
            }
          if (!frei) continue;
          const cx = tx * 16 + 8, cy = ty * 16 + 8;
          if (cx < 160 || cx > md.rows[0].length * 16 - 160) continue;
          if (cy < 90 || cy > rows.length * 16 - 90) continue;
          out.push({ tx, ty, cx, cy });
        }
      }
      return out; }""")
    ctx.close(); browser.close()
    if not aussen_kand:
        errors.append("M5: keine kronen-/wasserfreie Grasflaeche gefunden")
        return
    a0 = aussen_kand[len(aussen_kand) // 2]
    a1 = next(c for c in aussen_kand if 22 <= math.hypot(c["cx"] - a0["cx"], c["cy"] - a0["cy"]) <= 60)
    print(f"  AUSSEN Messort Kachel ({a0['tx']},{a0['ty']}) = ({a0['cx']},{a0['cy']}), "
          f"Skelett ({a1['cx']},{a1['cy']})")

    S_aus = m5_szene(pw, "g6_13_schatten_aussen", "/", (a0["cx"], a0["cy"]),
                     (a1["cx"], a1["cy"]), "M5 aussen: Kontaktschatten auf Gras")
    S_in = m5_szene(pw, "g6_14_schatten_innen", "/?map=CATACOMBS", (innen["cx"], innen["cy"]),
                    [(o["cx"], o["cy"]) for o in innen_orte],
                    "M5 innen: Kontaktschatten im Fackelkegel (a <= 0,15)", innen=True)
    S_boss = m5_szene(pw, "g6_15_schatten_boss", "/?map=BOSS_KAMMER", (tcx(10), tcx(9)),
                      None, "M5 Positiv-Kontrolle: Boss-Kontaktschatten", boss=True)

    ergebnis = {}
    alle_ok = True
    for tag, S in (("aussen", S_aus), ("innen", S_in)):
        mess = {}
        for i, ent in enumerate(S["ents"]):
            m = schatten_messung(S["A"], S["B"], ent, S["cam"])
            schluessel = f"{ent['name']}_{i}"
            mess[schluessel] = {"entity": ent, **m}
            print(f"  [{tag}/{schluessel}] Zeile y={m.get('zeile_y')} Breite {m.get('breite')}: "
                  f"{m.get('texel_ueber_schwelle')} Texel mit dL >= {M5_DL_MIN} "
                  f"(Soll >= {M5_TEXEL_MIN}) -> {'OK' if m.get('pass') else 'ROT'}")
        if tag == "innen":
            # Die Spec laesst den Innen-Messort offen; gewertet wird, ob an einem
            # kegelkonformen Ort der Nachweis gelingt. ALLE Orte stehen im Report.
            ok = any(v.get("pass") for v in mess.values())
        else:
            ok = all(v.get("pass") for v in mess.values())
        alle_ok = alle_ok and ok
        # Vignetten-/Kegel-Nachweis
        zentrumsabstand = math.hypot(S["ents"][0]["x"] + S["ents"][0]["w"] / 2 - S["cam"]["x"]
                                     - VIEW_W / 2,
                                     S["ents"][0]["y"] + S["ents"][0]["h"] - S["cam"]["y"]
                                     - VIEW_H / 2)
        ergebnis[tag] = {"kamera": S["cam"], "messungen": mess, "lightAt": S["lit"],
                         "abstand_bildmitte_px": round(zentrumsabstand, 1),
                         "vignettenzone_ausgeschlossen": zentrumsabstand <= M5_VIGNETTE_R,
                         "pass": ok}
        if tag == "innen":
            kegel_ok = S["lit"]["a"] <= M5_INNEN_A_MAX
            ergebnis[tag]["kegel_a"] = S["lit"]["a"]
            ergebnis[tag]["kegel_pass"] = kegel_ok
            if not kegel_ok:
                errors.append(f"M5 innen: Messort a={S['lit']['a']} > {M5_INNEN_A_MAX} "
                              f"(nicht im Fackelkegel)")
        if not ok:
            errors.append(f"M5 {tag}: Kontaktschatten unter der Fusskante zu schwach "
                          f"({ {k: v.get('texel_ueber_schwelle') for k, v in mess.items()} })")

    # ---- KONTROLLEN --------------------------------------------------------
    boss_ent = next((e for e in S_boss["ents"] if e["name"] == "graveward"), None)
    kontrollen = {}
    if boss_ent:
        mb = schatten_messung(S_boss["A"], S_boss["B"], boss_ent, S_boss["cam"], faktor=0.90)
        kontrollen["positiv_boss"] = {"entity": boss_ent, **mb}
        print(f"  [Kontrolle+] Boss: {mb.get('texel_ueber_schwelle')} Texel "
              f"(Soll >= {M5_TEXEL_MIN}) -> {'OK' if mb.get('pass') else 'FEHLGESCHLAGEN'}")
    else:
        kontrollen["positiv_boss"] = {"pass": False, "fehler": "kein graveward im Bild"}
    # Frame gegen sich selbst
    selbst = {}
    for tag, S in (("aussen", S_aus), ("innen", S_in)):
        m = schatten_messung(S["A"], S["A2"], S["ents"][0], S["cam"])
        selbst[tag] = m.get("texel_ueber_schwelle")
    kontrollen["negativ_frame_gegen_sich_selbst"] = {
        "treffer": selbst, "soll": 0, "pass": all(v == 0 for v in selbst.values())}
    print(f"  [Kontrolle-] Frame gegen sich selbst: {selbst} -> "
          f"{'OK' if kontrollen['negativ_frame_gegen_sich_selbst']['pass'] else 'FEHLGESCHLAGEN'}")
    # Projektil (kein Kontaktschatten laut §4.2/§4.3)
    pj = m5_projektil(pw, (a0["cx"], a0["cy"]))
    kontrollen["negativ_projektil"] = pj
    print(f"  [Kontrolle-] Projektil: {pj.get('texel_ueber_schwelle')} Texel "
          f"(Soll 0) -> {'OK' if pj.get('pass') else 'FEHLGESCHLAGEN'}")

    kontrollen_ok = all(v.get("pass") for v in kontrollen.values())
    proof_results["M5_kontaktschatten"] = {
        "szenen": ergebnis, "kontrollen": kontrollen, "kontrollen_ok": kontrollen_ok,
        "geometrie": "main.js:715-717/750-765 — Zeile dy=-1 (round(baseY-cam.y)+1), "
                     "Breite round(w*0,90), Alpha 0,30; sie ist die einzige UNTER der "
                     "Fusskante",
        "threshold": f"dL >= {M5_DL_MIN} auf >= {M5_TEXEL_MIN} Texeln unter der Fusskante, "
                     f"aussen UND innen (innen im Kegel a <= {M5_INNEN_A_MAX}, "
                     f"Vignettenzone d > {M5_VIGNETTE_R} ausgeschlossen)",
        "pass": bool(alle_ok and kontrollen_ok)}
    if not kontrollen_ok:
        ungueltig.append("M5_kontaktschatten (Kontrolle gescheitert)")
        errors.append("M5: KONTROLLE gescheitert -> Gate UNGUELTIG")

    S = S_aus
    e0 = S["ents"][0]
    x0, y, w = schattenzeile(e0, S["cam"])
    crop_zoom("g6_crop_i_schatten", S["A"],
              (max(0, x0 - 12), max(0, y - 26), x0 + w + 12, y + 8), kind="screen",
              note="Pflicht-Crop (i) Kontaktschatten: 4-Zeilen-Profil (§4.3) unter dem "
                   "Spieler, aussen auf Gras")


def m5_projektil(pw, spieler):
    """Negativ-Kontrolle: ein Projektil bekommt KEINEN Weichschatten
    (main.js zeichnet drawSoftShadow nur fuer Spieler, Gegner, Props)."""
    browser, ctx, page = open_map(pw, BASE + "/")
    place(page, *spieler)
    cam = settle_camera(page, "m5_projektil", spieler)
    set_scale(page, 0)
    page.wait_for_timeout(150)
    clear_particles(page)
    ent = page.evaluate("""async ([x, y]) => {
      const A = await import('/js/art/sprites.js');
      const g = A.SPRITES.boomerang_0;
      const L = window.__projectiles.list; L.length = 0;
      const p = { x: x - 4, y: y - 4, w: 8, h: 8, phase: 'out', dirX: 1, dirY: 0,
                  traveled: 0, hitIds: new Set(), lockTimer: 0, returnSpeed: 0 };
      L.push(p);
      // Der Bumerang wird MITTIG auf die AABB gezeichnet (projectiles.js:190) und
      // ist groesser als sie. Die Messzeile muss deshalb unter der SPRITE-
      // Unterkante liegen, sonst misst die Kontrolle das Sprite statt einen
      // (nicht vorhandenen) Schatten.
      const sh = g.length, sw = g[0].length;
      const spriteUnten = Math.round(p.y + p.h / 2 - sh / 2) + sh - 1;
      return { name: 'projektil', x: p.x, y: p.y, w: p.w, h: p.h,
               sprite: [sw, sh], sprite_unten: spriteUnten,
               h_effektiv: spriteUnten - p.y + 1 }; }""",
                        [spieler[0] + 40, spieler[1]])
    page.wait_for_timeout(200)
    A_im = backing_store(page)
    page.evaluate("() => { window.__projectiles.list.length = 0; }")
    page.wait_for_timeout(200)
    B_im = backing_store(page)
    ctx.close(); browser.close()
    mess_ent = dict(ent, h=ent["h_effektiv"])
    m = schatten_messung(A_im, B_im, mess_ent, cam)
    m["pass"] = m.get("texel_ueber_schwelle") == 0
    m["hinweis"] = ("Messzeile unter der SPRITE-Unterkante (Bumerang wird mittig auf die "
                    "AABB gezeichnet und ist groesser als sie)")
    m["soll"] = 0
    m["entity"] = ent
    return m


# ===========================================================================
# WEGSPORN (§6.3, Nachzugsliste §1: neues Zeichen 'P' + art path_pebbles)
# ===========================================================================
def wegsporn(pw):
    print("== WEGSPORN (§6.3) ==")
    browser, ctx, page = open_map(pw, BASE + "/")
    cx, cy = tcx(WEGSPORN_STAND[0]), tcx(WEGSPORN_STAND[1])
    place(page, cx, cy)
    cam0 = settle_camera(page, "g6_16_wegsporn", (cx, cy))
    set_scale(page, 0)
    page.wait_for_timeout(150)
    clear_particles(page)
    page.wait_for_timeout(80)
    tiles = page.evaluate("""async (list) => {
      const M = await import('/js/world/maps.js');
      const md = M.MAPS.GRAVEYARD;
      const m = window.__map; const out = [];
      for (const [tx, ty] of list) {
        const ch = md.rows[ty][tx];
        const d = m.defAt(tx, ty);
        out.push({ tx, ty, zeichen: ch, art: d ? d.art : null,
                   solid: d ? !!d.solid : null,
                   fringeSource: d ? !!d.fringeSource : null,
                   fringeSet: d ? d.fringeSet || null : null,
                   bankSet: d ? d.bankSet || null : null,
                   wasser: !!(d && (d.shorePrefix || d.depthOverlays)) });
      }
      return out; }""", [list(t) for t in WEGSPORN_TILES] + [[30, 15], [29, 16]])
    jury = backing_store(page)
    page.evaluate("() => { const p = window.__player; p.__sy = p.y; p.y = -9999; }")
    page.wait_for_timeout(150)
    frei = backing_store(page)
    page.evaluate("() => { const p = window.__player; p.y = p.__sy; }")
    camE = get_camera(page)
    assert_int_camera(camE, "g6_16_ende")
    ctx.close(); browser.close()
    save_scene("g6_16_wegsporn", jury, note="Wegsporn (28,14) -> (28,15) -> (29,15), "
               "Trittsteine 'P' = path_pebbles", cam=cam0)

    im_bild, ausserhalb = [], []
    for (tx, ty) in WEGSPORN_TILES:
        wl, wt, wr, wb = tx * TILE, ty * TILE, (tx + 1) * TILE, (ty + 1) * TILE
        inside = (cam0["x"] <= wl and wr <= cam0["x"] + VIEW_W
                  and cam0["y"] <= wt and wb <= cam0["y"] + VIEW_H)
        (im_bild if inside else ausserhalb).append([tx, ty])
    ist_legende = {f"{t['tx']},{t['ty']}": t["zeichen"] for t in tiles[:3]}
    soll_legende = {f"{k[0]},{k[1]}": v for k, v in WEGSPORN_SOLL.items()}
    legende_ok = ist_legende == soll_legende
    trittsteine = [t for t in tiles[:3] if (t["tx"], t["ty"]) != (28, 14)]
    arts = [t["art"] for t in trittsteine]
    arts_ok = arts == WEGSPORN_ARTS_SOLL
    # 'P' traegt EXAKT die 'p'-Flags (§6.3)
    flags_ok = all(t["solid"] is False and t["fringeSource"] is True
                   and t["fringeSet"] == "grass" and t["bankSet"] == "g" for t in trittsteine)
    ok = (not ausserhalb) and legende_ok and arts_ok and flags_ok
    proof_results["wegsporn"] = {
        "cam": cam0, "standkachel": list(WEGSPORN_STAND),
        "sporn_kacheln": [list(t) for t in WEGSPORN_TILES],
        "soll_legende": soll_legende, "ist_legende": ist_legende, "legende_pass": legende_ok,
        "trittstein_arts": arts, "trittstein_arts_soll": WEGSPORN_ARTS_SOLL,
        "arts_pass": arts_ok, "flags_pass": flags_ok,
        "kachel_defs": tiles, "vollstaendig_im_bild": im_bild, "ausserhalb": ausserhalb,
        "threshold": "Legende {'28,15':'P','29,15':'P'}, arts ['path_pebbles','path_pebbles'], "
                     "EXAKT die 'p'-Flags, alle 3 Sporn-Kacheln vollstaendig im Bild",
        "pass": bool(ok)}
    print(f"  Legende {ist_legende} (Soll {soll_legende}) {'OK' if legende_ok else 'ROT'}; "
          f"arts {arts} {'OK' if arts_ok else 'ROT'}; Flags {'OK' if flags_ok else 'ROT'}; "
          f"im Bild {im_bild}, ausserhalb {ausserhalb}")
    if not ok:
        errors.append(f"WEGSPORN: Legende {ist_legende} / arts {arts} / Flags {flags_ok} / "
                      f"ausserhalb {ausserhalb}")
    crop_zoom("g6_crop_k_wegsporn", frei, WEGSPORN_CROP_RECT, cam0,
              note="Wegsporn + Trittsteine, Welt-Rect (432,208,496,272) = Kacheln "
                   "x27-30 / y13-16; geschnitten aus der Aufnahme OHNE Spieler")


# ===========================================================================
# §2.4 PERFORMANCE-VERIFIKATION AM ECHTEN SPIEL
# ===========================================================================
# Worst-View CATACOMBS Kamera (112,80) mit 21 Lichtern (P0a-Gegenprobe).
# lighting.draw wird im Route-Wrapper mit dem ORIGINALEN performance.now
# gemessen (window.__origNow) — der Zeitskalen-Wrapper des Rigs faelschte sonst
# die Zeiten. Simulation LAEUFT (kein Freeze), 300 Frames x 3 Laeufe.
# Limits eingefroren aus der P0a-Baseline: Mittel <= 2,79 ms, P95 <= 4,05 ms.
def stat(v):
    sv = sorted(v)
    return {"n": len(v), "mittel": round(statistics.fmean(v), 4),
            "median": round(statistics.median(v), 4),
            "p95": round(sv[max(0, min(len(sv) - 1, int(round(0.95 * len(sv))) - 1))], 4),
            "max": round(sv[-1], 4)}


def perf(pw):
    print("== §2.4 PERFORMANCE (CATACOMBS Worst-View (112,80), 300 Frames x 3) ==")
    browser, ctx, page = open_map(pw, BASE + "/?map=CATACOMBS")
    pin(page, *PERF_SPIELER)
    page.wait_for_timeout(1200)
    cam = get_camera(page)
    cams["perf_worstview"] = cam
    ok_cam = cam and cam["x"] == PERF_KAMERA[0] and cam["y"] == PERF_KAMERA[1]
    if not ok_cam:
        errors.append(f"PERF: Kamera {cam} statt {PERF_KAMERA}")
    snap = get_snap(page)
    # Lichter im Culling-Rect ueber 300 Frames (Introspektion wie P0a)
    zaehl = page.evaluate("""(n) => new Promise((res) => {
      const out = []; let i = 0;
      function tick() {
        const s = window.__snap;
        let k = 0, f = 0;
        for (const l of s.lights) {
          const wob = Math.sin(s.timeSec * 13 + l.x * 7) * 0.6
                    + Math.sin(s.timeSec * 8.3 + l.y * 5 + l.x * 3) * 0.4;
          const r = l.radius * (1 + (l.flicker || 0) * 0.1 * wob);
          if (!(l.x + r < s.camera.x || l.x - r > s.camera.x + 320 ||
                l.y + r < s.camera.y || l.y - r > s.camera.y + 180)) { k++; if (l.flicker >= 0.8) f++; }
        }
        out.push([k, f]);
        if (++i < n) requestAnimationFrame(tick); else res(out);
      }
      requestAnimationFrame(tick);
    })""", PERF_FRAMES)
    ges = [a for a, b in zaehl]
    fack = [b for a, b in zaehl]
    print(f"  Kamera {cam} (Soll {PERF_KAMERA}); lighting.draw bekommt "
          f"{len(snap['lights'])} Lichter, im Culling-Rect Modus {statistics.mode(ges)} "
          f"(min {min(ges)}, max {max(ges)}), davon Fackeln {statistics.mode(fack)}")

    # Lauf-Zahl der ECHTEN Funktion am selben Zustand
    laeufe = page.evaluate("""async () => {
      const L = await import('/js/core/lighting.js?real=1');
      const s = window.__snap;
      const drei = s.lights.concat(
        s.lights.map((l) => ({ x: l.x + 80, y: l.y + 48, radius: l.radius, flicker: l.flicker })),
        s.lights.map((l) => ({ x: l.x - 80, y: l.y - 48, radius: l.radius, flicker: l.flicker })));
      let mx = 0, sum = 0, mxK = 0;
      for (let i = 0; i < 60; i++) {
        const t = s.timeSec + i * 0.0167;
        const r = L.lightRuns(s.lights, s.camera, s.ambient, t, 320, 180);
        mx = Math.max(mx, r.length); sum += r.length;
        mxK = Math.max(mxK, L.lightRuns(drei, s.camera, s.ambient, t, 320, 180).length);
      }
      return { max: mx, mittel: sum / 60, kontrolle_x3_max: mxK }; }""")
    print(f"  Laeufe je Frame (60 Zeitpunkte): Mittel {laeufe['mittel']:.0f}, "
          f"Max {laeufe['max']} (Deckel {PERF_LAUF_MAX})")

    def messe(label, vorher="", nachher=""):
        werte = []
        for lauf in range(PERF_LAEUFE):
            if vorher:
                page.evaluate(vorher)
            page.evaluate("() => { window.__lt.length = 0; }")
            page.wait_for_function(f"() => window.__lt.length >= {PERF_FRAMES}", timeout=60000)
            v = page.evaluate(f"() => window.__lt.slice(0, {PERF_FRAMES})")
            if nachher:
                page.evaluate(nachher)
            st = stat(v)
            werte.append(st)
            print(f"    {label} Lauf {lauf+1}: Mittel {st['mittel']:.3f} ms | Median "
                  f"{st['median']:.3f} | P95 {st['p95']:.3f} | Max {st['max']:.3f}")
        return werte

    base = messe("GP6 lighting.draw")
    print("  --- POSITIV-KONTROLLE: derselbe Pass ZWEIMAL im Messfenster ---")
    pos = messe("2x lighting.draw", "() => { window.__doppelPass = true; }",
                "() => { window.__doppelPass = false; }")
    print("  --- BEOBACHTUNG (kein Gate): Lichtliste verdreifacht, versetzte Kopien ---")
    x3 = messe("x3 Lichter", "() => { window.__doppelLichter = true; }",
               "() => { window.__doppelLichter = false; }")
    print("  --- NEGATIV-KONTROLLE: __noLight (Pass abgeschaltet, Aufruf wird gemessen) ---")
    neg = messe("__noLight", "() => { window.__noLight = true; }",
                "() => { window.__noLight = false; }")
    clear_pin(page)
    ctx.close(); browser.close()

    mittel = max(b["mittel"] for b in base)
    p95 = max(b["p95"] for b in base)
    mittel_ok = mittel <= PERF_MITTEL_MAX
    p95_ok = p95 <= PERF_P95_MAX
    lauf_ok = laeufe["max"] <= PERF_LAUF_MAX
    pos_ok = min(p["mittel"] for p in pos) > 1.6 * max(b["mittel"] for b in base)
    neg_ok = max(n["mittel"] for n in neg) < 0.2
    kontrollen_ok = pos_ok and neg_ok and bool(ok_cam)
    proof_results["perf_2_4"] = {
        "kamera": cam, "kamera_soll": list(PERF_KAMERA), "kamera_pass": bool(ok_cam),
        "lichter_an_draw": len(snap["lights"]),
        "lichter_im_culling_rect": {"modus": statistics.mode(ges), "min": min(ges),
                                    "max": max(ges), "fackeln_modus": statistics.mode(fack)},
        "laeufe_je_frame": laeufe, "laeufe_deckel": PERF_LAUF_MAX, "laeufe_pass": lauf_ok,
        "laeufe_pro_lauf": base, "mittel_max_ms": mittel, "mittel_limit_ms": PERF_MITTEL_MAX,
        "mittel_pass": mittel_ok, "p95_max_ms": p95, "p95_limit_ms": PERF_P95_MAX,
        "p95_pass": p95_ok,
        "kontrollen": {"positiv_doppelter_pass": {
            "werte": pos, "soll": "Mittel > 1,6 x Basis", "pass": bool(pos_ok),
            "verfahren": "derselbe lighting.draw-Aufruf zweimal im Messfenster — die "
                         "Sonde muss die Verdopplung sehen"},
            "beobachtung_x3_lichter": {
                "werte": x3, "laeufe_max": laeufe.get("kontrolle_x3_max"),
                "befund": "Mehr Lichter machen den GP6-Pass NICHT teurer (gemessen sogar "
                          "schneller): lightRuns partitioniert die Vereinigung der "
                          "Bounding-Boxen, und zusaetzliches Licht druckt den Rest-Faktor "
                          "nach unten -> laengere, gleichstufige Laeufe = WENIGER fillRects. "
                          "Deshalb taugt 'Lichtliste x N' hier nicht als Positiv-Kontrolle "
                          "(im Bestand von P0a tat es das noch, weil dort je Licht Boegen "
                          "gezeichnet wurden)."},
                       "negativ_noLight": {"werte": neg, "pass": bool(neg_ok)}},
        "kontrollen_ok": bool(kontrollen_ok),
        "messung": "lighting.draw je Frame mit window.__origNow im Route-Wrapper; "
                   f"{PERF_FRAMES} Frames x {PERF_LAEUFE} Laeufe, Simulation laeuft",
        "threshold": f"Mittel <= {PERF_MITTEL_MAX} ms UND P95 <= {PERF_P95_MAX} ms "
                     f"(P0a-Baseline-Limits), Laeufe <= {PERF_LAUF_MAX}",
        "pass": bool(mittel_ok and p95_ok and lauf_ok and kontrollen_ok)}
    print(f"  ERGEBNIS: Mittel(max ueber 3 Laeufe) {mittel:.3f} ms <= {PERF_MITTEL_MAX} "
          f"{'OK' if mittel_ok else 'ROT'} | P95 {p95:.3f} <= {PERF_P95_MAX} "
          f"{'OK' if p95_ok else 'ROT'} | Laeufe {laeufe['max']} <= {PERF_LAUF_MAX} "
          f"{'OK' if lauf_ok else 'ROT'} | Kontrollen {'OK' if kontrollen_ok else 'ROT'}")
    if not mittel_ok:
        errors.append(f"PERF: Mittel {mittel:.3f} ms > {PERF_MITTEL_MAX} ms")
    if not p95_ok:
        errors.append(f"PERF: P95 {p95:.3f} ms > {PERF_P95_MAX} ms")
    if not lauf_ok:
        errors.append(f"PERF: {laeufe['max']} Laeufe > {PERF_LAUF_MAX}")
    if not kontrollen_ok:
        ungueltig.append("perf_2_4 (Kontrolle gescheitert)")
        errors.append("PERF: KONTROLLE gescheitert -> Gate UNGUELTIG")


# ===========================================================================
# STRIPS (Jury-Material): Kronen-Sway 8 Phasen, Flamme 6 Phasen
# ===========================================================================
CROWN_POSE_RATE = 3.2
FLAMME_RATE = 6


def strips_all(pw):
    strip_sway(pw)
    strip_flamme(pw)


def strip_sway(pw):
    print("== STRIP Kronen-Sway (8 Phasen) ==")
    cx, cy = tcx(31), tcx(12)
    browser, ctx, page = open_map(pw, BASE + "/")
    page.evaluate("() => { window.__noFog = true; }")
    place(page, cx, cy)
    cam0 = settle_camera(page, "strip_sway", (cx, cy))
    info = page.evaluate("""async ([tx, ty]) => {
      const T = await import('/js/world/tilemap.js?real=1');
      const M = await import('/js/world/maps.js');
      const md = M.MAPS.GRAVEYARD, def = md.legend[md.overRows[ty][tx]];
      const off = T.anchorOffset(def, tx, ty);
      return { art: def.art, span: def.span, posen: def.swayPoses || null,
               dx: off.dx, dy: off.dy, rate: T.CROWN_POSE_RATE }; }""", [30, 8])
    print(f"  Anker (30,8): {info['art']} span {info['span']} Versatz "
          f"({info['dx']},{info['dy']}), {len(info['posen'] or [])} Posen")
    t0 = time_now(page)
    k0 = int(t0 * CROWN_POSE_RATE) + 2
    ims, ticks, posen = [], [], []
    for i in range(8):
        set_scale(page, 0.25)
        arm_freeze(page, counter_cond(CROWN_POSE_RATE, k0 + i), timeout_ms=20000)
        if not wait_frozen(page, timeout=22000):
            warnings.append(f"strip_sway: Tick {k0+i} nicht getroffen")
        clear_particles(page)
        page.wait_for_timeout(60)
        ticks.append(page.evaluate("() => Math.floor(window.__timeSec * %r)" % CROWN_POSE_RATE))
        posen.append(page.evaluate("""async ([tx, ty]) => {
          const T = await import('/js/world/tilemap.js?real=1');
          return T.swayPose8(tx, ty, window.__timeSec, T.CROWN_POSE_RATE); }""", [30, 8]))
        ims.append(backing_store(page))
    camE = get_camera(page)
    ctx.close(); browser.close()
    x0 = 30 * TILE + info["dx"] - cam0["x"] - 2
    y0 = 8 * TILE + info["dy"] - cam0["y"] - 2
    rect = (max(0, int(x0)), max(0, int(y0)), int(x0) + 68, int(y0) + 52)
    raster_ok = ticks == list(range(ticks[0], ticks[0] + 8))
    posen_ok = len(set(posen)) == 8
    save_strip("strip_kronen_sway", ims, rect, zoom=4,
               note="8 aufeinanderfolgende Sway-Ticks der xl_b-Krone (30,8); "
                    "GEBACKENE Scher-Posen (§5.2), ein Draw je Zelle",
               meta={"ticks": ticks, "posen": posen, "1_tick_raster": raster_ok,
                     "acht_verschiedene_posen": posen_ok, "anker": info, "cam": cam0})
    print(f"  Ticks {ticks} (1-Tick-Raster {raster_ok}), Posen {posen} "
          f"(8 verschiedene: {posen_ok})")
    if not raster_ok:
        warnings.append(f"strip_sway: Ticks nicht konsekutiv {ticks}")
    if not posen_ok:
        warnings.append(f"strip_sway: nicht 8 verschiedene Posen {posen}")
    proof_results["strip_kronen_sway"] = {
        "ticks": ticks, "posen": posen, "1_tick_raster": raster_ok,
        "acht_verschiedene_posen": posen_ok, "screen_rect": list(rect),
        "threshold": "8 aufeinanderfolgende Ticks, 8 verschiedene Posen-Indizes",
        "pass": bool(raster_ok and posen_ok)}


def strip_flamme(pw):
    print("== STRIP Flamme (6 Phasen) ==")
    ziel = (tcx(12), tcx(17))
    browser, ctx, page = open_map(pw, BASE + "/?map=CATACOMBS")
    place(page, *ziel)
    cam0 = settle_camera(page, "strip_flamme", ziel)
    snap = get_snap(page)
    torches = [t for t in torch_geometrie(snap)
               if 24 <= t["sx"] < VIEW_W - 24 and 24 <= t["sy"] < VIEW_H - 24]
    if not torches:
        warnings.append("strip_flamme: keine Fackel mittig im Bild")
        ctx.close(); browser.close()
        return
    t = torches[0]
    t0 = time_now(page)
    f0 = int(t0 * FLAMME_RATE) + 3
    ims, fr = [], []
    for i in range(6):
        set_scale(page, 0.25)
        arm_freeze(page, counter_cond(FLAMME_RATE, f0 + i), timeout_ms=14000)
        if not wait_frozen(page, timeout=16000):
            warnings.append(f"strip_flamme: Frame {f0+i} nicht getroffen")
        page.wait_for_timeout(50)
        fr.append(page.evaluate("() => Math.floor(window.__timeSec * %d)" % FLAMME_RATE))
        ims.append(backing_store(page))
    ctx.close(); browser.close()
    rect = (t["sx"] - 16, t["sy"] - 18, t["sx"] + 16, t["sy"] + 14)
    save_strip("strip_flamme", ims, rect, zoom=6,
               note="6 aufeinanderfolgende Flammen-Frames (Docht-Kern '1' §6.6, "
                    "HOT_RINGS am Docht §2.6, Glut-Funken)",
               meta={"frames": fr, "fackel_screen": [t["sx"], t["sy"]], "cam": cam0})
    diffs = []
    for i in range(len(ims) - 1):
        a = arr(ims[i].crop(rect))
        b = arr(ims[i + 1].crop(rect))
        diffs.append(round(100.0 * float((np.abs(a - b).sum(axis=2) > 24).mean()), 2))
    print(f"  Frames {fr}, konsekutive Aenderung im Fenster {diffs} %")
    proof_results["strip_flamme"] = {
        "frames": fr, "konsekutiv_diff_pct": diffs, "screen_rect": list(rect),
        "threshold": "Flamme bewegt sich (max konsekutive Aenderung > 1 %)",
        "pass": bool(max(diffs) > 1.0) if diffs else False}
    if not diffs or max(diffs) <= 1.0:
        errors.append(f"STRIP-FLAMME: Flamme bewegt sich nicht ({diffs})")


# ===========================================================================
# TEICH-SPECULAR (§6.4a) — GLANZ_RGB-Nachzug aus der §1-Nachzugsliste
# ===========================================================================
# Portiert aus shot_gfx5 (Gate "teich_glanz", Schwelle > 20 UNVERAENDERT); neu
# ist allein das Ziel-Tripel: '=' steht nach dem Offset auf #56757a (Tabelle
# .tmp/gp6_offset_tabelle.json). Gemessen ueber alle VIER Wasser-Frames
# (animSync, Rate 3) im Teich-Fenster.
def water_cond(f):
    return ("() => { var t = window.__timeSec; if (typeof t !== 'number') return false;"
            " var ph = (t*3)%4; var fi = Math.floor(ph); var fr = ph - fi;"
            " return fi === " + str(int(f)) + " && fr > 0.3 && fr < 0.7; }")


def teich(pw):
    print("== TEICH-SPECULAR (§6.4a, GLANZ_RGB #%02x%02x%02x) ==" % GLANZ_RGB)
    ziel = (tcx(27), tcx(17))
    browser, ctx, page = open_map(pw, BASE + "/")
    place(page, *ziel)
    cam = settle_camera(page, "teich", ziel, soll=(280, 190))
    weit, eng, frames = [], [], []
    ims = []
    for f in range(4):
        set_scale(page, 0.25)
        arm_freeze(page, water_cond(f), timeout_ms=14000)
        if not wait_frozen(page, timeout=16000):
            warnings.append(f"teich: Wasser-Frame {f} nicht getroffen")
        clear_particles(page)
        page.wait_for_timeout(60)
        frames.append(page.evaluate("() => Math.floor((window.__timeSec*3)%4)"))
        im = backing_store(page)
        ims.append(im)
        box = (TEICH_RECT[0] - cam["x"], TEICH_RECT[1] - cam["y"],
               TEICH_RECT[2] - cam["x"], TEICH_RECT[3] - cam["y"])
        sub = arr(im.crop(tuple(int(v) for v in box)))
        d = np.abs(sub - np.array(GLANZ_RGB)).max(axis=2)
        weit.append(int((d <= GLANZ_TOL).sum()))
        eng.append(int((d <= 6).sum()))
    ctx.close(); browser.close()
    save_strip("strip_teich", ims, tuple(int(v) for v in box), zoom=6,
               note="4 Wasser-Frames im Teich-Fenster (animSync, Rate 3)",
               meta={"frames": frames, "glanz_tol20": weit, "glanz_tol6": eng})
    ok = max(weit) > 20
    proof_results["teich_glanz"] = {
        "kamera": cam, "welt_rect": list(TEICH_RECT), "frames": frames,
        "ziel_rgb": list(GLANZ_RGB), "ziel_hex": "#%02x%02x%02x" % GLANZ_RGB,
        "ziel_herkunft": "P0b-Offset-Tabelle, Ton '=' (Nachzugsliste §1)",
        "toleranz": GLANZ_TOL, "glanz_je_frame_tol20": weit, "glanz_je_frame_tol6": eng,
        "glanz_max": max(weit),
        "threshold": "> 20 Texel im Teich-Fenster (GP5-Schwelle unveraendert)",
        "pass": bool(ok)}
    print(f"  Glanz-Texel je Wasser-Frame (Tol {GLANZ_TOL}): {weit} (eng, Tol 6: {eng}) "
          f"-> {'PASS' if ok else 'ROT'}")
    if not ok:
        errors.append(f"TEICH-GLANZ: max {max(weit)} Texel <= 20")


# ===========================================================================
# SCHACHBRETT-BLOCKANTEIL (Rev 2.4 J3, P0-B — Juror-K-Metrik)
# ===========================================================================
# Gemessen wird auf den NATIVEN M1-Frames (raw_g6_01/raw_g6_02, 320x180): das
# sind genau die Bilder, auf denen die Jury den Defekt gesehen hat. Kein
# eigener Browser-Lauf — die Metrik ist eine reine Bildauswertung, und ein
# zweiter Aufbau waere ein zweiter Wurf auf die Fackelphase.
def schachbrett_metrik(im):
    """8x8-Schachbrett-Energie: je Block die mittlere Amplitude der Projektion
    auf das Nyquist-Diagonalmuster |mean(L * (-1)^(x+y))|. Rueckgabe: Karte,
    Blockanteil in % und Kennzahlen."""
    L = lum(arr(im))
    H = (VIEW_H // SCHACH_BLOCK) * SCHACH_BLOCK
    W = (VIEW_W // SCHACH_BLOCK) * SCHACH_BLOCK
    ys, xs = np.mgrid[0:H, 0:W]
    vorz = np.where((xs + ys) % 2 == 0, 1.0, -1.0)
    b = (L[:H, :W] * vorz).reshape(H // SCHACH_BLOCK, SCHACH_BLOCK,
                                   W // SCHACH_BLOCK, SCHACH_BLOCK).mean(axis=(1, 3))
    amp = np.abs(b)
    flag = amp >= SCHACH_AMP_MIN
    n = int(amp.size)
    treffer = int(flag.sum())
    top = sorted(((float(round(amp[by, bx], 2)), int(bx), int(by))
                  for by in range(amp.shape[0]) for bx in range(amp.shape[1])),
                 reverse=True)[:8]
    return {
        "bloecke": n, "schachbrett_bloecke": treffer,
        "anteil_pct": round(100.0 * treffer / n, 3),
        "max_amplitude_L": round(float(amp.max()), 2),
        "mittlere_amplitude_L": round(float(amp.mean()), 3),
        "top_bloecke": [{"amplitude_L": a, "block": [bx, by],
                         "screen": [bx * SCHACH_BLOCK, by * SCHACH_BLOCK]}
                        for a, bx, by in top],
    }, flag


def schachbrett_bild(tag, im_neu, flag_neu, im_alt, flag_alt, zoom=3):
    """Jury-Bild: Runde-1-Archiv (links) gegen Runde 2 (rechts), die als
    Schachbrett gezaehlten 8x8-Bloecke rot umrandet."""
    from PIL import ImageDraw
    panels = []
    for im, flag in ((im_alt, flag_alt), (im_neu, flag_neu)):
        p = im.resize((VIEW_W * zoom, VIEW_H * zoom), Image.NEAREST)
        d = ImageDraw.Draw(p)
        for by in range(flag.shape[0]):
            for bx in range(flag.shape[1]):
                if not flag[by, bx]:
                    continue
                x0, y0 = bx * SCHACH_BLOCK * zoom, by * SCHACH_BLOCK * zoom
                d.rectangle([x0, y0, x0 + SCHACH_BLOCK * zoom - 1,
                             y0 + SCHACH_BLOCK * zoom - 1], outline=(255, 40, 40))
        panels.append(p)
    out = join_panels(panels, sep_w=4)
    out.save(f"{OUT}/{tag}.png")
    print(f"  [bild] {tag}.png {out.size} (links Runde 1, rechts Runde 2)")
    return f"{OUT}/{tag}.png"


def schachbrett(pw=None):
    print(f"== SCHACHBRETT-BLOCKANTEIL (Rev 2.4 J3, P0-B): {SCHACH_BLOCK}x{SCHACH_BLOCK}-"
          f"Bloecke, Amplitude >= {SCHACH_AMP_MIN} L, Gate < {SCHACH_MAX_PCT} % ==")
    szenen, alles_ok = {}, True
    for tag in SCHACH_SZENEN:
        pfad = f"{OUT}/raw_{tag}.png"
        arch = f"{SCHACH_ARCHIV_DIR}/schachbrett_r1_{tag}.png"
        if not os.path.exists(pfad):
            errors.append(f"SCHACHBRETT {tag}: Messbild {pfad} fehlt (M1 zuerst laufen lassen)")
            alles_ok = False
            continue
        im = Image.open(pfad).convert("RGB")
        if im.size != (VIEW_W, VIEW_H):
            errors.append(f"SCHACHBRETT {tag}: {pfad} ist {im.size}, nicht {(VIEW_W, VIEW_H)}")
            alles_ok = False
            continue
        m, flag = schachbrett_metrik(im)
        ok = m["anteil_pct"] < SCHACH_MAX_PCT
        alles_ok = alles_ok and ok
        # Positiv-Kontrolle je Szene: dieselbe Metrik auf dem Runde-1-Archivbild
        kontrolle = {"datei": arch, "vorhanden": os.path.exists(arch)}
        if kontrolle["vorhanden"]:
            im_a = Image.open(arch).convert("RGB")
            m_a, flag_a = schachbrett_metrik(im_a)
            soll = SCHACH_ARCHIV_SOLL[tag]
            kontrolle.update({
                "anteil_pct": m_a["anteil_pct"], "juror_K_soll_pct": soll,
                "toleranz_pp": SCHACH_ARCHIV_TOL,
                "max_amplitude_L": m_a["max_amplitude_L"],
                "pass": bool(abs(m_a["anteil_pct"] - soll) <= SCHACH_ARCHIV_TOL)})
            kontrolle["jury_bild"] = os.path.basename(
                schachbrett_bild(f"g6_17_schachbrett_{tag}", im, flag, im_a, flag_a))
            print(f"  [Kontrolle+] {tag} Runde-1-Archiv: {m_a['anteil_pct']} % "
                  f"(Juror K {soll} % +-{SCHACH_ARCHIV_TOL}) -> "
                  f"{'OK' if kontrolle['pass'] else 'FEHLGESCHLAGEN'}")
        else:
            kontrolle["pass"] = False
            errors.append(f"SCHACHBRETT {tag}: Runde-1-Archivbild {arch} fehlt — "
                          f"Positiv-Kontrolle nicht fahrbar")
        szenen[tag] = {"datei": f"raw_{tag}.png",
                       "bild_mtime": round(os.path.getmtime(pfad), 1),
                       **m, "schwelle_pct": SCHACH_MAX_PCT, "pass": bool(ok),
                       "positiv_kontrolle_runde1": kontrolle}
        print(f"  {tag}: {m['schachbrett_bloecke']} von {m['bloecke']} Bloecken = "
              f"{m['anteil_pct']} % (Soll < {SCHACH_MAX_PCT} %), max Amplitude "
              f"{m['max_amplitude_L']} L -> {'OK' if ok else 'ROT'}")
        if not ok:
            errors.append(f"SCHACHBRETT {tag}: Blockanteil {m['anteil_pct']} % >= "
                          f"{SCHACH_MAX_PCT} % ({m['schachbrett_bloecke']} von "
                          f"{m['bloecke']} Bloecken, max Amplitude "
                          f"{m['max_amplitude_L']} L)")

    # DETEKTOR-Kontrollen (Werkzeug, nicht Bild): synthetisches Vollschachbrett
    # muss 100 % liefern, eine glatte Flaeche 0 %.
    g = 128.0
    syn = np.zeros((VIEW_H, VIEW_W, 3), dtype=np.uint8)
    ys, xs = np.mgrid[0:VIEW_H, 0:VIEW_W]
    syn[..., :] = np.where(((xs + ys) % 2 == 0)[..., None],
                           g + SCHACH_SYNTH_DL / 2, g - SCHACH_SYNTH_DL / 2).astype(np.uint8)
    m_syn, _ = schachbrett_metrik(Image.fromarray(syn, "RGB"))
    m_flach, _ = schachbrett_metrik(Image.new("RGB", (VIEW_W, VIEW_H), (64, 64, 64)))
    det_ok = m_syn["anteil_pct"] == 100.0
    flach_ok = m_flach["anteil_pct"] == 0.0
    print(f"  [Detektor+] synthetisches Vollschachbrett (dL {SCHACH_SYNTH_DL}): "
          f"{m_syn['anteil_pct']} % / Amplitude {m_syn['max_amplitude_L']} L -> "
          f"{'OK' if det_ok else 'FEHLGESCHLAGEN'}")
    print(f"  [Detektor-] glatte Flaeche: {m_flach['anteil_pct']} % -> "
          f"{'OK' if flach_ok else 'FEHLGESCHLAGEN'}")
    kontrollen_ok = (det_ok and flach_ok
                     and all(s["positiv_kontrolle_runde1"].get("pass")
                             for s in szenen.values()))
    proof_results["schachbrett"] = {
        "verfahren": f"Juror-K-Metrik (Rev 2.4 J3): Rec.601-Luminanz des nativen "
                     f"320x180-Frames, nicht ueberlappende {SCHACH_BLOCK}x{SCHACH_BLOCK}-"
                     f"Bloecke (die angeschnittene letzte Blockzeile faellt weg), je "
                     f"Block die mittlere Schachbrett-Amplitude "
                     f"|mean(L * (-1)^(x+y))|; Block gilt ab {SCHACH_AMP_MIN} L als "
                     f"Schachbrett-Block. HUD NICHT ausmaskiert (K misst das ganze Bild).",
        "eichung": f"Die Amplitudenschwelle {SCHACH_AMP_MIN} L wurde EINMALIG an den "
                   f"Runde-1-Archivbildern geeicht (Reproduktion der Juror-K-Werte "
                   f"6,1 / 7,0 %) und ist danach eingefroren.",
        "szenen": szenen,
        "kontrollen": {
            "positiv_detektor_vollschachbrett": {
                "delta_L": SCHACH_SYNTH_DL, "anteil_pct": m_syn["anteil_pct"],
                "amplitude_L": m_syn["max_amplitude_L"], "soll": "100 %", "pass": bool(det_ok)},
            "negativ_flaeche": {"anteil_pct": m_flach["anteil_pct"], "soll": "0 %",
                                "pass": bool(flach_ok)}},
        "kontrollen_ok": bool(kontrollen_ok),
        "threshold": f"Schachbrett-Blockanteil < {SCHACH_MAX_PCT} % in g6_01 UND g6_02",
        "pass": bool(alles_ok and kontrollen_ok)}
    if not kontrollen_ok:
        ungueltig.append("schachbrett (Kontrolle gescheitert)")
        errors.append("SCHACHBRETT: KONTROLLE gescheitert -> Gate UNGUELTIG")


# ===========================================================================
# Werkzeug-Selbsttest, Teillauf-Merge, main
# ===========================================================================
SCENES = {
    "m1": m1, "schachbrett": schachbrett, "m2": m2, "e2": e2, "m3": m3, "m4": m4,
    "m5": m5, "wegsporn": wegsporn, "teich": teich, "perf": perf, "strips": strips_all,
}

GATE_ERROR_TAGS = {
    "M1_belichtung": ("M1 ", "M1:"),
    "M2_lichtstufen": ("M2:",),
    "E2_glowzone": ("E2:",),
    "M3_spritelicht": ("M3 ", "M3:"),
    "M4_kronen": ("M4:", "M4 "),
    "M4_rechtsrand": ("M4 RECHTSRAND",),
    "M5_kontaktschatten": ("M5 ", "M5:"),
    "schachbrett": ("SCHACHBRETT",),
    "wegsporn": ("WEGSPORN",),
    "teich_glanz": ("TEICH-GLANZ",),
    "perf_2_4": ("PERF:",),
    "strip_flamme": ("STRIP-FLAMME",),
    "png_sanity": ("PNG-SANITY",),
}


def png_sanity():
    """Werkzeug-Selbsttest (KEIN Spec-Schwellwert): Vollszenen muessen die
    erwartete Groesse haben, Crops/Strips duerfen nicht einfarbig sein."""
    namen = sorted(f for f in os.listdir(OUT)
                   if f.endswith(".png") and (f.startswith("g6_") or f.startswith("strip_")
                                              or f.startswith("raw_g6_")))
    flach, klein = [], []
    for f in namen:
        pfad = f"{OUT}/{f}"
        im = Image.open(pfad).convert("RGB")
        n = len(set(im.getdata()))
        if n < 8:
            flach.append((f, n))
        if os.path.getsize(pfad) < 700:
            klein.append((f, os.path.getsize(pfad)))
    ok = not flach and not klein
    proof_results["png_sanity"] = {
        "geprueft": len(namen), "unter_8_farben": flach, "unter_700_byte": klein,
        "threshold": "jedes Bild >= 8 Farben und > 700 Byte", "pass": ok}
    print(f"== Werkzeug-Selbsttest PNG: {len(namen)} Dateien, flach {len(flach)}, "
          f"winzig {len(klein)} -> {'PASS' if ok else 'FAIL'}")
    if not ok:
        errors.append(f"PNG-SANITY: flach {flach}, winzig {klein}")


def rev24_nachbewertung(gates, errs, neu):
    """Rev 2.4 (J1) aendert eine VERDIKT-REGEL, keine Messung: an die Stelle der
    in Rev 2.3 ersatzlos gestrichenen Plateau-Regel tritt die am Zensus geeichte
    ERSATZREGEL '>= 5 Plateaus >= 2 Bloecke'. Ein aus einem frueheren Lauf
    UEBERNOMMENES M2-Ergebnis wird deshalb auf der UNVERAENDERTEN Rohmessung
    (Plateau-Laengen liegen im Report) neu BEWERTET — nicht neu gemessen. Wird
    M2 im selben Lauf frisch gemessen, greift die neue Regel direkt und diese
    Funktion tut nichts.
    Rueckgabe: (bereinigte Fehlerliste, Protokollblock oder None)."""
    if "M2_lichtstufen" in neu:
        return errs, None
    g = gates.get("M2_lichtstufen") or {}
    grad = g.get("gradient_schnitt")
    if not isinstance(grad, dict) or not isinstance(grad.get("plateau_laengen"), list):
        return errs, None
    if grad.get("plateaus_ab_2_bloecke_soll") == M2_GRAD_PLATEAUS_MIN_N:
        return errs, None                      # bereits nach Rev 2.4 bewertet
    vorher = {"gradient.plateau_gate": grad.get("plateau_gate"),
              "gradient.pass": grad.get("pass"), "gate.pass": g.get("pass")}
    spr = grad.get("spruenge")
    spr_ok = bool(spr is not None and M2_GRAD_SPRUENGE[0] <= spr <= M2_GRAD_SPRUENGE[1])
    plat_gf = grad.get("plateau_laengen") or []
    plat_lang = [p for p in plat_gf if p >= M2_GRAD_MIN_PLATEAU]
    plat_ok = len(plat_lang) >= M2_GRAD_PLATEAUS_MIN_N
    stufen = g.get("lichtstufen_anzahl")
    stufen_ok = bool(stufen is not None and M2_STUFEN_MIN <= stufen <= M2_STUFEN_MAX)
    plateau_pct = g.get("lichtstufen_plateau_anteil_pct")
    plateau_ok = bool(plateau_pct is not None and plateau_pct >= M2_PLATEAU_MIN)
    kontrollen_ok = bool(g.get("kontrollen_ok"))
    grad["plateaus_ab_2_bloecke"] = len(plat_lang)
    grad["plateaus_ab_2_bloecke_soll"] = M2_GRAD_PLATEAUS_MIN_N
    grad["plateaus_unter_2_bloecke"] = len(plat_gf) - len(plat_lang)
    grad["plateau_gate"] = (f">= {M2_GRAD_PLATEAUS_MIN_N} Plateaus >= "
                            f"{M2_GRAD_MIN_PLATEAU} Bloecke (Rev 2.4 J1)")
    grad["plateau_regel"] = ("ERSATZREGEL Rev 2.4 (J1, P0-C): die Rev-2.3-Streichung "
                             "war ersatzlos und liess kein Kriterium fuer die "
                             "raeumliche Ausdehnung der Lichtstufen uebrig. Neu, am "
                             f"Zensus geeicht (55 % aller Strahlen): >= "
                             f"{M2_GRAD_PLATEAUS_MIN_N} Plateaus >= "
                             f"{M2_GRAD_MIN_PLATEAU} Bloecke.")
    grad["plateau_pass"] = bool(plat_ok)
    grad["spruenge_pass"] = spr_ok
    grad["pass"] = bool(spr_ok and plat_ok)
    g["threshold"] = (f"{M2_STUFEN_MIN}..{M2_STUFEN_MAX} distinkte a (K1: Leiter-Rastung "
                      f"+-{M2_LEITER_TOL}), globaler Plateau-Anteil >= {M2_PLATEAU_MIN} %, "
                      f"Gradient {M2_GRAD_SPRUENGE[0]}..{M2_GRAD_SPRUENGE[1]} Spruenge >= "
                      f"{M2_GRAD_MIN_SPRUNG} UND >= {M2_GRAD_PLATEAUS_MIN_N} Plateaus >= "
                      f"{M2_GRAD_MIN_PLATEAU} Bloecke (ERSATZREGEL Rev 2.4 J1)")
    g["pass"] = bool(stufen_ok and plateau_ok and grad["pass"] and kontrollen_ok)
    bereinigt = [e for e in errs if not e.startswith("M2: Gradient-Schnitt verletzt")]
    if not grad["pass"]:
        bereinigt = sorted(set(bereinigt) | {
            f"M2: Gradient-Schnitt verletzt — {spr} Spruenge (Soll "
            f"{list(M2_GRAD_SPRUENGE)}), {len(plat_lang)} Plateaus >= "
            f"{M2_GRAD_MIN_PLATEAU} Bloecke (Soll >= {M2_GRAD_PLATEAUS_MIN_N}, "
            f"ERSATZREGEL Rev 2.4 J1; Laengen {plat_gf})"})
    prot = {
        "gate": "M2_lichtstufen",
        "art": "NACHBEWERTUNG der unveraenderten Rohmessung — KEINE Neumessung",
        "grund": "Rev 2.4 (J1) ersetzt die in Rev 2.3 gestrichene Plateau-Regel "
                 "durch '>= 5 Plateaus >= 2 Bloecke'. Die Plateau-Laengen liegen "
                 "als Rohwert im uebernommenen Report; alle uebrigen Rohwerte "
                 "(Profil, Spruenge, Leiter-Statistik, Kontrollen) sind unveraendert.",
        "rohwerte_unveraendert": {
            "spruenge": spr, "spruenge_soll": list(M2_GRAD_SPRUENGE),
            "plateau_laengen": plat_gf,
            "lichtstufen_anzahl": stufen,
            "lichtstufen_plateau_anteil_pct": plateau_pct,
            "kontrollen_ok": kontrollen_ok},
        "vorher": vorher,
        "nachher_rev24": {"gradient.plateaus_ab_2_bloecke": len(plat_lang),
                          "gradient.pass": grad["pass"], "gate.pass": g["pass"]},
        "verworfener_alt_fehler": sorted(set(errs) - set(bereinigt))}
    print("== REV-2.4-NACHBEWERTUNG (keine Neumessung) ==")
    print(f"  M2_lichtstufen: {spr} Spruenge in {list(M2_GRAD_SPRUENGE)} (pass={spr_ok}), "
          f"{len(plat_lang)} Plateaus >= {M2_GRAD_MIN_PLATEAU} Bloecke "
          f"(Soll >= {M2_GRAD_PLATEAUS_MIN_N}, pass={plat_ok}); Gate "
          f"{vorher['gate.pass']} -> {g['pass']}")
    return bereinigt, prot


def spielstand_register():
    """md5-BEWEIS der Spieldateien (Teillauf-Disziplin): welcher Spielstand hat
    welchen Gate-Wert erzeugt. Zusaetzlich HEAD und der Arbeitsbaum-Status."""
    import hashlib
    import subprocess
    md5 = {}
    for basis, _dirs, files in os.walk(f"{ROOT}/game"):
        for f in sorted(files):
            p = os.path.join(basis, f)
            with open(p, "rb") as fh:
                md5[os.path.relpath(p, ROOT)] = hashlib.md5(fh.read()).hexdigest()
    def git(*a):
        try:
            return subprocess.run(["git", "-C", ROOT, *a], capture_output=True,
                                  text=True, timeout=20).stdout.strip()
        except Exception as e:                 # pragma: no cover
            return f"(git nicht lesbar: {e})"
    return {"git_head": git("rev-parse", "HEAD"),
            "git_status_kurz": [z for z in git("status", "--short").splitlines() if z],
            "dateien": dict(sorted(md5.items()))}


def merge_teillauf():
    pfad = f"{ROOT}/.tmp/g6_proof_results.json"
    if not ONLY or not os.path.exists(pfad):
        return (proof_results, crops, strips, scenes, cams,
                sorted(set(errors)), sorted(set(warnings)), sorted(set(ungueltig)), None)
    with open(pfad) as fh:
        alt = json.load(fh)
    neu = sorted(proof_results.keys())
    tags = tuple(t for k in neu for t in GATE_ERROR_TAGS.get(k, ()))
    alt_fehler = alt.get("errors", [])
    verworfen = [e for e in alt_fehler if e.startswith(tags)]
    behalten = [e for e in alt_fehler if e not in verworfen]
    gates = dict(alt.get("gates", {})); gates.update(proof_results)
    crops_m = dict(alt.get("crops", {})); crops_m.update(crops)
    strips_m = dict(alt.get("strips", {})); strips_m.update(strips)
    scenes_m = dict(alt.get("szenen", {})); scenes_m.update(scenes)
    cams_m = dict(alt.get("cams", {})); cams_m.update(cams)
    ung = [u for u in alt.get("ungueltige_gates", [])
           if not any(u.startswith(k) for k in neu)] + ungueltig
    # md5-BEWEIS (Teillauf-Disziplin): Nur was auf DEMSELBEN Spielstand gemessen
    # wurde, darf unbesehen uebernommen werden. Das Register des Vorlaufs steht
    # in der alten Ergebnisdatei; hier wird Datei fuer Datei verglichen.
    jetzt = spielstand_register()
    vor = alt.get("spielstand")
    if isinstance(vor, dict) and isinstance(vor.get("dateien"), dict):
        a_d, b_d = vor["dateien"], jetzt["dateien"]
        geaendert = sorted(k for k in set(a_d) | set(b_d) if a_d.get(k) != b_d.get(k))
        md5_info = {"vorlauf_head": vor.get("git_head"), "jetzt_head": jetzt["git_head"],
                    "geaenderte_spieldateien": geaendert,
                    "identisch": not geaendert,
                    "lesart": ("Spielstand identisch — uebernommene Gates gelten "
                               "unveraendert." if not geaendert else
                               "Spielstand NICHT identisch — die uebernommenen Gates "
                               "stammen von einem anderen Build; siehe Liste.")}
        if geaendert:
            warnings.append(f"TEILLAUF: uebernommene Gates stammen von einem Build mit "
                            f"abweichenden Spieldateien ({', '.join(geaendert)})")
    else:
        md5_info = {"vorlauf_head": None, "jetzt_head": jetzt["git_head"],
                    "geaenderte_spieldateien": None, "identisch": None,
                    "lesart": "Der Vorlauf fuehrte kein md5-Register — die Herkunft "
                              "der uebernommenen Gates ist nicht maschinell belegbar."}
        warnings.append("TEILLAUF: Vorlauf ohne md5-Register — Herkunft der "
                        "uebernommenen Gates nicht maschinell belegbar")
    info = {"modus": "TEILLAUF", "teile": sorted(ONLY), "neu_gemessene_gates": neu,
            "uebernommene_gates": sorted(set(alt.get("gates", {})) - set(neu)),
            "verworfene_alt_fehler": sorted(set(verworfen)),
            "md5_beweis": md5_info,
            "hinweis": "Nur die neu gemessenen Gates wurden ueberschrieben."}
    return (gates, crops_m, strips_m, scenes_m, cams_m,
            sorted(set(behalten) | set(errors)),
            sorted(set(alt.get("warnings", [])) | set(warnings)),
            sorted(set(ung)), info)


def main():
    print(f"GRIMLIGHT GP6 PROOF — Server {BASE}, Ausgabe {OUT}")
    os.makedirs(OUT, exist_ok=True)
    with sync_playwright() as pw:
        for name, fn in SCENES.items():
            if ONLY and name not in ONLY:
                continue
            try:
                fn(pw)
            except Exception as e:
                import traceback
                traceback.print_exc()
                print(f"  FEHLER in {name}: {e}")
                errors.append(f"teil {name}: {e}")
    png_sanity()
    gates, crops_m, strips_m, scenes_m, cams_m, errs, warns, ung, teillauf = merge_teillauf()
    errs, nachbewertung = rev24_nachbewertung(gates, errs, set(proof_results.keys()))
    konsolen = sorted(set(e for e in errs if e.startswith(("console.", "pageerror"))))
    gates["konsolenfehler"] = {"anzahl": len(konsolen), "liste": konsolen,
                              "threshold": "0", "pass": not konsolen}
    payload = {"erzeugt": "GP6 Phase 4 (PROOF), Runde 2",
               "spec": "design/SPEC_GRAFIKPASS_6.md Rev 2.5 §1 "
                       "(F2 WRAP_TILEMAP-Durchreichung; F3 M4 gradierte Verdeckung "
                       "V(Kopf) 0,45..0,85 statt der binaeren Exakt-Zahlen; J1 "
                       "Gradient-Ersatzregel >= 5 Plateaus >= 2 Bloecke; J2 >= 25 % "
                       "Voll-Silhouette lesbar; J3 neues Gate 'schachbrett' < 2 %; "
                       "J4 P0-D durch Michael aufgeloest; M1-PHASEN: Median ueber 8 "
                       "feste Einfrier-Phasen; Messmethoden K1/K2/K3)",
               "spielstand": spielstand_register(),
               "gates": gates, "szenen": scenes_m, "crops": crops_m, "strips": strips_m,
               "cams": cams_m, "ungueltige_gates": ung, "errors": errs, "warnings": warns}
    if teillauf:
        payload["teillauf"] = teillauf
    if nachbewertung:
        payload["rev24_nachbewertung"] = nachbewertung
    with open(f"{ROOT}/.tmp/g6_proof_results.json", "w") as fh:
        json.dump(payload, fh, indent=2, ensure_ascii=False)
    with open(f"{ROOT}/.tmp/g6_cams.json", "w") as fh:
        json.dump(cams_m, fh, indent=2)
    print("\n=== GATES ===")
    for k, v in gates.items():
        print(f"  {k}: pass={v.get('pass')}"
              + ("" if v.get("kontrollen_ok", True) else "  [KONTROLLE GESCHEITERT -> UNGUELTIG]"))
    if ung:
        print("=== UNGUELTIGE GATES (Kontrolle gescheitert) ===")
        for u in ung:
            print("  !", u)
    if warns:
        print("=== WARNUNGEN ===")
        for w in warns:
            print("  -", w)
    if errs:
        print("=== FEHLER / ROT ===")
        for e in errs:
            print("  -", e)
        sys.exit(1)
    print("OK: alle Gates gruen, 0 Konsolenfehler")


if __name__ == "__main__":
    main()
