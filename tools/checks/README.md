# tools/checks/ — der versionierte Suiten-Kanon

**Zweck:** Grimlight soll auf einem ANDEREN Rechner aus einem `git clone`
heraus vollständig prüfbar sein. Die kanonischen Flusstests, der
Art-Selbstcheck, die Proben und die Messwerkzeuge lagen bisher
ausschließlich in `.tmp/` — und `.tmp/` steht in `.gitignore`
(CLAUDE.md: „Alles in `.tmp/` ist wegwerfbar"). Ein Clone hätte sie nicht.

Hier liegen sie jetzt **als Kopie**, in derselben relativen Struktur wie
unter `.tmp/`:

```
tools/checks/tmp/<pfad>     ==  .tmp/<pfad>
```

`bash tools/checks/restore_tmp.sh` legt sie an ihren alten Platz zurück.

## Warum zurückspielen und nicht direkt aufrufen?

Weil die **Sanktions-Kataloge der Specs die `.tmp/`-Pfade und sogar
Zeilennummern zitieren** — z. B. `SPEC_GP7CH2.md` §5(2)/(3) („check_gfx6_art
SYM-Deckel", „check_gfx6_art:122-135"), §5(4) („gp6_art_self erwartete Rot
6 -> 7"), `SPEC_SLICE_6.md` §7 („check_builderA_slice3:55 MAPS 4 -> 5",
„check_save:235", „smoke:1732-1747"), E-A7 („.tmp/shot_gfx6.py:309").
Würde man die Pfade umschreiben, wären diese Kataloge nicht mehr
nachprüfbar. Deshalb: versionieren ja, **umbenennen nein**.

Die Kopien in `tools/checks/tmp/` sind **byte-gleich** zu den Originalen
unter `.tmp/` (51 Dateien, mit `cmp` verifiziert). `restore_tmp.sh`
überschreibt nichts Vorhandenes (dafür `--force`).

---

## Aufruf-Kanon mit den erwarteten Ergebniszahlen

Reihenfolge und Soll-Zahlen aus `uebergaben/2026-09-12_gp7ch2_gegner.md`
(„Wie testen") und `design/GP7CH2_PHASE1.md` (smoke-Kanon 862).
**Exit-Codes nie glauben — auf die Schlusszeile schauen** (SPEC_GP7CH1 §5).

### Reine Node-Suiten (kein Server, kein Python, kein Browser)

| Aufruf | Erwartetes Ergebnis |
|---|---|
| `node tools/smoke_test.mjs` | `862` ok-Zeilen, `SMOKE-TEST GRÜN` (Tick-Zähler schwankt, s. u.) |
| `node .tmp/check_main_slice1.mjs` | `CHECK GRÜN (25 Assertions)` |
| `node .tmp/check_inventory_slice2.mjs` | `CHECK GRÜN (25 Assertions)` |
| `node .tmp/check_boss_slice3.mjs` | `CHECK GRÜN (33 Assertions)` |
| `node tools/check_save_slice4.mjs` | `CHECK GRÜN (63 Assertions)` |
| `node .tmp/check_builderA_slice3.mjs` | `106 Pruefungen bestanden. ALLE GRUEN` |
| `node .tmp/check_gfx6_art.mjs` | `GP6-ART-CHECK GRUEN` |
| `node .tmp/check_engineB_gp6.mjs` | `SELBSTPRUEFUNG GRUEN` |
| `node .tmp/check_gp6_art_self.mjs` | **`6 ROT von 428 Pruefungen`** = SOLL |
| `node .tmp/art_slice3_selfcheck.mjs` | `SELBSTCHECK GRUEN`, 95/344/86 Keys |
| `node .tmp/probe_god.mjs "?god=1"` | `PROBE GRUEN` |
| `node .tmp/probe_s4_engine.mjs` | `PROBE GRUEN` |

**Die 6 Rot in `check_gp6_art_self` sind kanonisch**, kein Defekt: die
Symbolzeile ist seit GP7-CH-1 rot (SPEC_GP7CH2 E-A7: „gp6_art_self bleibt
bei 6 Rot"). Wer sie „reparieren" will, bricht den Bestandsschutz.
Ebenso deklariert: `.tmp/check_world_slice1.mjs` ist am HEAD **bereits rot**
(toter Wächter, SPEC_SLICE_6 §7 C: „nicht reparieren!") — er ist hier
absichtlich NICHT mitkopiert.

Das Zählen bei smoke ist gewollt streng: 825 (Slice 6) + 37 additive
GP7-CH-2-Gates = 862. `smoke x2 identisch` heißt: zwei Läufe, gleiche Zahl
**ok-Zeilen** (und gleiche Ausgabe Zeile für Zeile).

**Achtung, eine Zeile ist NICHT deterministisch:** `Simulierte Ticks gesamt`
schwankt von Lauf zu Lauf (am 13.09. auf derselben Maschine gemessen: 7603,
7624, 7630, 7647, 7654 — die 862 ok-Zeilen waren dabei jedes Mal byte-gleich).
Die Kanon-Zahl ist **862**, nicht der Tick-Zähler. Wer zwei Läufe mit `diff`
vergleicht, sieht genau diese eine Zeile abweichen; das ist kein Regress.

### Messwerkzeuge Figuren (Node, langsam, schreiben Ergebnisse)

```sh
node .tmp/gp7ch_p0/figuren_messung.mjs --beides \
     --material-gegner .tmp/gp7ch2_p1/material_gesamt.json
```
64 Gates; Abschnitt 14 = Deklarationen + zweite Bilanz. Stand 12.09.:
erste Bilanz **57/64 grün**, zweite Bilanz „grün oder deklariert"
**64/64**, offen rot: keine. Braucht **`git`** (liest den vorher-Stand per
`git show HEAD:game/js/art/sprites_figuren.js`, Cache in
`gp7ch_p0/vorher_cache/`) und schreibt seine JSON/Logs nach
`.tmp/gp7ch_p0/` (bzw. `--out <dir>`). `--schnell` lässt den
dE00-Würfelscan weg. `--vorher-zeiger 75106c7` = CH-1-Menschen-Anker.

```sh
node tools/horden_bogen.mjs  --etikett nachher --out <dir> [--squintblind]
node tools/figuren_bogen.mjs --modus   nachher --out <dir>
```
Beide liegen schon im Repo, brauchen kein `.tmp/`. Soll-Zahlen Horden-Bogen
(Gruft, schalterlos): Trenn-Rate Knäuel (Tafel B) **86,5 %** (Gate >= 80),
Feld 84,0 %, Schlachtfeld 100 %, Decal-Boden 1,4 %.

### Realmessung (Python + Playwright + Server auf 8124)

```sh
.tmp/venv/bin/python .tmp/shot_gfx6.py m3,m4,m5     # bzw. all / liste
.tmp/venv/bin/python .tmp/slice6_p4/messung_p4.py   # M1 DORF d1-d6
```
`shot_gfx6.py` startet **keinen** Server, sondern misst gegen
`http://127.0.0.1:8124`. Vorher also `python3 .tmp/serve8124.py` starten
(**nie 8123** — das ist Michaels Port). Soll m3 `skeleton_0`:
dWarm **51,2** (>= 18), Fern **-1,62**, ausgebrannt **0**;
K3 **4,64** statt >= 6,0 ist **deklariert** (GP7CH2_PHASE1 P1-D11).
Bild-M5 = 10, DORF-M1 d1-d6 unverändert, g6_01-05 im Band.

---

## Inventur: was hängt an was

Alles unter „Weitere `.tmp`-Dateien" liegt hier mit; `game/js/**` kommt aus
dem Repo.

| Kanon-Datei | Weitere `.tmp`-Dateien | Weitere Anforderungen |
|---|---|---|
| `tools/smoke_test.mjs` (Repo) | keine | Node >= 20 |
| `tools/check_save_slice4.mjs` (Repo) | keine | Node >= 20 |
| `tmp/check_main_slice1.mjs` | keine | — |
| `tmp/check_inventory_slice2.mjs` | keine | — |
| `tmp/check_boss_slice3.mjs` | keine | — |
| `tmp/check_gfx6_art.mjs` | keine (die JSON-Erwähnungen im Kopf sind Kommentare) | — |
| `tmp/check_gp6_art_self.mjs` | `sprites_gp6_backup.js` (import :6), `gp6_art_anhang.json` (:63, **absolut**) | — |
| `tmp/check_engineB_gp6.mjs` | keine | — |
| `tmp/check_builderA_slice3.mjs` | keine | — |
| `tmp/probe_god.mjs` | keine | — |
| `tmp/probe_s4_engine.mjs` | keine | — |
| `tmp/art_slice3_selfcheck.mjs` | keine | — |
| `tmp/shot_gfx6.py` | `gp6_offset_tabelle.json` (:300, Modulebene), `serve8124.py` (Server), optional `g6_proof_results.json`/`g6_cams.json` (nur Teillauf-Merge, sonst AUSGABE), `g6_r1_archiv/` (40 MB PNG, nur m2-Archivvergleich) | Python 3, playwright+Chromium, pillow, numpy, Server auf 8124 |
| `tmp/slice6_p4/messung_p4.py` | `shot_gfx6.py` (per `sys.path`, **absolut**), optional `slice6_p4/messung_polish.json` (sonst AUSGABE) | wie shot_gfx6 |
| `tmp/gp7ch_p0/figuren_messung.mjs` | `gp7ch_p0/gegner_material_IST.json` + `figuren_material_IST.json` (Anker-Eichung; eingebaute Handtabelle als Vorgabe), optional `gp7ch2_p1/material_gesamt.json` via `--material-gegner`; schreibt `gp7ch_p0/vorher_cache/` | Node >= 20 **und `git`** im PATH |
| `tmp/gp7ch_p0/lib_farbe.mjs` | — (wird von `gp7ch_p0/01..05_*.mjs` und `gp7ch2_p0/1x_*.mjs` importiert, NICHT von `figuren_messung.mjs`) | — |
| `tmp/gp7ch_p0/toene.json`, `tmp/gp7ch2_p0/toene_ch2.json` | reine Daten (Paletten-Zuteilung CH-1/CH-2) | — |
| `tmp/gp7ch2_p1/material_gesamt.json` | reine Daten (Material-Tabelle Gegner) | — |
| `tmp/gp7ch2_p1/AUFTRAG_*.md`, `FIX1_*.md`, `tmp/gp7ch2_p0/FABLE_ENTSCHEIDE.md` | Prosa (Aufträge der Zeichner/Juroren, Fable-Entscheide) | — |
| `tmp/gp7ch2_vorprobe/sonden/mk_spur.mjs` | braucht die **Zonen-Klone** `gp7ch2_vorprobe/vorher/` + `nachher/` (je 2 MB, NICHT mitkopiert) | — |
| `tmp/gp7ch2_vorprobe/sonden/mk_konserve.mjs` | braucht `spur_vorher/.tmp/check_main_slice1.mjs` + `spur_nachher/…` (von `mk_spur.mjs` erzeugt) | — |
| `tmp/gp7ch2_vorprobe/sonden/spur_lauf.mjs` | nimmt das Drehbuch als absoluten Pfad im Argument | — |
| `tmp/gp7ch2_vorprobe/out/konserve_main.json` | Ergebnis-Konserve (2,2 KB), Beweisstück E-A5 | — |
| `tmp/gp7ch_ch2_sonde/horde.mjs`, `knaeuel.mjs` | keine — aber **absolute** `game/js`-Importe und ein Scratchpad-`OUT` | gehärteter Nachfolger: `tools/horden_bogen.mjs` |

**Node hier: v20.19.2.** `npm`/`npx` existieren in dieser Umgebung nicht
(siehe `design/BETRIEB_NEUER_RECHNER.md`); die Suiten brauchen sie auch
nicht — alles läuft mit dem nackten `node`, ohne `node_modules`.

**Python hier: 3.13.5** in `.tmp/venv` mit `playwright 1.61.0`,
`pillow 12.3.0`, `numpy 2.5.1` (siehe `requirements.txt`).
Browser-Binaries: `chromium-1228` unter `~/.cache/ms-playwright`.

---

## Was hier absichtlich NICHT liegt

| Nicht mitkopiert | Warum | Wiederherstellung |
|---|---|---|
| `.tmp/venv/` | Binär, plattformabhängig | `restore_tmp.sh --venv` bzw. die drei Befehle in `requirements.txt` |
| `.tmp/screenshots/`, `.tmp/g6r1*`, `.tmp/g6_r1_archiv/` (40 MB), `slice6_p4/frame_*.png`, `gp7ch2_p1/{A,B,E}/` (25 MB Renders) | Bild-Artefakte, neu erzeugbar | `shot_gfx6.py`, `messung_p4.py`, `tools/figuren_bogen.mjs`, `tools/horden_bogen.mjs` |
| `.tmp/gp7ch2_vorprobe/{vorher,nachher,spur_*}/` (je 2 MB Repo-Klone) | Zonen der Engine-Vorprobe; der Patch ist längst auf `main` (`5eb42d5`/`c2d713b`) | `vorher/` = `game/js` + die vier Flusstests + `tools/smoke_test.mjs` aus dem Vor-Engine-Commit kopieren, `nachher/` = `node patch.mjs` (liegt mit) |
| `.tmp/gp7ch2_p0/vollscan.json` (3,4 MB) | Zwischenergebnis des Paletten-Vollscans | `node .tmp/gp7ch2_p0/11_vollscan.mjs` (nicht mitkopiert, Phase 0 abgeschlossen) |
| `.tmp/*_proof_results.json`, `*_cams.json`, `messung_*.json`, `*.log` | **Ausgaben** der Werkzeuge, keine Eingaben | den jeweiligen Lauf wiederholen |
| `.tmp/sprites_VORHER.js`, `map_dorf_VORHER.js` (Slice-6-Vorher-Stände) | aus der Git-Historie greifbar | `git show <commit>:game/js/art/sprites.js` |
| `.tmp/check_world_slice1.mjs` | am HEAD deklariert rot, toter Wächter (SPEC_SLICE_6 §7 C) | bewusst nicht |

Die **Referenz-Bögen** (`design/referenz/`, 3,3 MB) sind dagegen
**committet** und kommen mit dem Clone — sie sind der Vorher-Anker der
Bild-Juroren und dürfen nicht neu erzeugt werden (die Blind-Auflösung
in `design/referenz/gp7ch2/README.md` nie einem Juror zeigen).

---

## Absolute Pfade (die einzige echte Portabilitätsbremse)

Fünf Werkzeuge tragen `/home/coder/Grimlight` hart im Quelltext:

```
tmp/shot_gfx6.py:108                 ROOT = "/home/coder/Grimlight"
tmp/slice6_p4/messung_p4.py:34,38    sys.path.insert / ROOT
tmp/check_gp6_art_self.mjs:63        readFileSync('/home/coder/Grimlight/.tmp/gp6_art_anhang.json')
tmp/gp7ch_ch2_sonde/horde.mjs:4-6    import … from '/home/coder/Grimlight/game/js/art/…'
tmp/gp7ch_ch2_sonde/knaeuel.mjs:3-5  dito
```

`restore_tmp.sh` tauscht dieses Präfix **nur in der zurückgespielten Kopie
unter `.tmp/`** gegen den echten Repo-Pfad, und nur wenn er abweicht
(auf dieser Maschine also nie). Die versionierte Quelle hier bleibt
byte-gleich zum Original, Zeilennummern verschieben sich nicht.
Abschaltbar mit `--keine-pfadheilung`.

`horde.mjs` schreibt zusätzlich in ein **Scratchpad-Verzeichnis einer
vergangenen Agenten-Sitzung** (`OUT` in Zeile 62). Das ist auf keinem
anderen Rechner gültig. Beide Prototypen sind aber ersetzt:
`tools/horden_bogen.mjs` ist der gehärtete, portable Nachfolger
(„Herkunft: gehaertet aus .tmp/gp7ch_ch2_sonde/horde.mjs + knaeuel.mjs",
`horden_bogen.mjs:930`).

---

Vollständige Anleitung für einen frischen Rechner:
**`design/BETRIEB_NEUER_RECHNER.md`**.
