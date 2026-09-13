# Grimlight auf einem NEUEN Rechner in Betrieb nehmen

> GitHub (seit 13.09.2026): https://github.com/ligendzamichael86-droid/Grimlight (privat).
> Clone: `git clone https://github.com/ligendzamichael86-droid/Grimlight.git` (mit eigenem GitHub-Login)
> oder per SSH `git@github.com:ligendzamichael86-droid/Grimlight.git`. KEIN `--depth 1`
> (figuren_messung braucht die Historie). Der Server srv1457801 pusht ueber einen
> Deploy-Key (~/.ssh/grimlight_deploy, core.sshCommand gesetzt); Regel dort: jeder
> Commit wird sofort gepusht.

Stand 13.09.2026, HEAD `c7458d3` (GP7-CH-2 Phase 1). Diese Datei beschreibt
den Weg von `git clone` bis „alle Suiten grün, APK gebaut, Michael kann
testen" auf einer frischen Maschine (Ziel: mehr Kerne als die heutigen zwei).

Alles hier ist aus dem Repo abgeleitet, nicht geraten — die Belegstellen
stehen jeweils dabei.

---

## 0 Kurzfassung

```sh
git clone <quelle> Grimlight && cd Grimlight
node --version                              # muss >= 20 sein (hier: v20.19.2)
bash tools/checks/restore_tmp.sh            # Pruef-Suiten nach .tmp/ zurueck
node tools/smoke_test.mjs                   # 862 ok -> SMOKE-TEST GRÜN
node .tmp/check_main_slice1.mjs             # 25 Assertions
node .tmp/check_inventory_slice2.mjs        # 25
node .tmp/check_boss_slice3.mjs             # 33
node tools/check_save_slice4.mjs            # 63
node .tmp/check_builderA_slice3.mjs         # 106
node .tmp/check_gfx6_art.mjs                # GP6-ART-CHECK GRUEN
node .tmp/check_engineB_gp6.mjs             # SELBSTPRUEFUNG GRUEN
node .tmp/check_gp6_art_self.mjs            # 6 ROT von 428 = SOLL
python3 tools/serve.py                      # Spiel auf 8123 (Michaels Port)
```

Für Realmessung, Bild-Bögen und APK: Abschnitte 3, 5 und 6.

---

## 1 Was der Clone mitbringt und was nicht

| Kommt mit (committet) | Größe |
|---|---|
| `game/` — das Spiel selbst (statische Website, kein Build) | 1,3 MB |
| `design/` — GDD, Specs, Landkarten, Jury-Protokolle, `design/referenz/` (Bild-Anker der Juroren) | 4,6 MB |
| `tools/` — Server, Smoke-Test, `check_save_slice4`, `figuren_bogen`, `horden_bogen`, APK-Skripte, **`tools/checks/`** | 1,8 MB |
| `workflows/`, `uebergaben/`, `CLAUDE.md` | 160 KB |
| `mobile/` — nur `capacitor.config.json`, `package.json`, `package-lock.json`, `README.md` (Spec Slice 4 §0.5) | 50 KB |

| Kommt NICHT mit | Größe | Wiederherstellung |
|---|---|---|
| `toolchain/` (JDK + Android-SDK + Gradle-Home) | 1,7 GB | `bash tools/setup_android_toolchain.sh` (Abschnitt 6) |
| `mobile/node_modules/` | 22 MB | `cd mobile && COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack npm@10.9.2 ci` — macht `build_apk.sh` selbst |
| `mobile/android/` (generiertes Gradle-Projekt) | 30 MB | `cap add android` — macht `build_apk.sh` selbst |
| `.tmp/` insgesamt | 2,6 GB | **Pruef-Suiten: `bash tools/checks/restore_tmp.sh`.** Renders/Screenshots/Logs/Zonen-Klone: neu erzeugen, siehe `tools/checks/README.md` |
| `.tmp/venv` (Python-Mess-Venv) | 241 MB | `restore_tmp.sh --venv` oder die drei Befehle in `tools/checks/requirements.txt` |
| Playwright-Browser (`~/.cache/ms-playwright`) | 641 MB (chromium 379 + headless_shell 262) | `.tmp/venv/bin/playwright install chromium` |
| Claude-/Agenten-Gedächtnis (`~/.claude/projects/**/memory/*.md`) | klein | **nicht wiederherstellbar** — liegt außerhalb des Repos. Der Projektstand steht in `uebergaben/` (neuestes zuerst) und in `design/GP7CH2_PHASE1.md`; wer die Historie braucht, liest `uebergaben/2026-09-12_gp7ch2_gegner.md` und `design/SPEC_GP7CH2.md` |

Ein Clone ohne `.tmp/` ist **spielbar und smoke-testbar**, aber nicht
vollständig prüfbar — deshalb `tools/checks/`.

---

## 2 Node, npm, Python: die Fallen

### Node >= 20

Hier läuft **v20.19.2** (`/usr/bin/node`). Alle Suiten sind reine
ES-Module ohne Abhängigkeiten; `game/js/**` ist so geschrieben, dass jedes
Modul außer `main.js` sich in Node ohne Browser importieren lässt
(CLAUDE.md, Grundentscheidung 4). Es gibt **kein `package.json` im
Repo-Root und keine `node_modules` für das Spiel** — das ist Absicht
(CLAUDE.md, Grundentscheidung 1: „KEIN Build-Toolchain für das SPIEL").

### npm gibt es nur gepinnt über corepack — NIE `corepack enable`

Belegt in `design/SLICE4_LANDKARTE.md` Zeilen 27-37:

* `npm` und `npx` existieren in dieser Umgebung **nicht**.
* `corepack enable` scheitert mit
  `EACCES: permission denied, symlink … '/usr/bin/pnpm'` — kein
  Schreibrecht in `/usr/bin`. Wird **bewusst nicht** benutzt
  (`tools/build_apk.sh`, Kopfkommentar).
* **Blankes `corepack npm` zieht npm 12.0.2**, und das lehnt Node 20 ab:
  `npm warn cli npm v12.0.2 does not support Node.js v20.19.2`.
* Deshalb zwingend: `corepack npm@10.9.2` (verifiziert `--version` → `10.9.2`).
  `corepack` hier: 0.24.0.
* Die Capacitor-CLI wird direkt über `mobile/node_modules/.bin/cap`
  aufgerufen, nicht über `npx`.

Auf einem neuen Rechner mit echtem, schreibbarem `npm` dürfte man das
lockern — **aber nicht stillschweigend**: `tools/build_apk.sh` und
`mobile/README.md` schreiben den gepinnten Aufruf fest. Wer davon abweicht,
ändert die Reproduzierbarkeit der APK und muss es in beiden Dateien
dokumentieren.

### Python 3 + venv + Playwright

Nur für die **Realmessung** und die Bild-Rigs nötig, nicht für die
Node-Suiten.

```sh
python3 -m venv .tmp/venv
.tmp/venv/bin/pip install -r tools/checks/requirements.txt
.tmp/venv/bin/playwright install chromium
```

Hier: Python **3.13.5**, `playwright 1.61.0`, `pillow 12.3.0`,
`numpy 2.5.1`. Browser-Binaries `chromium-1228` +
`chromium_headless_shell-1228` unter `~/.cache/ms-playwright`
(auch `webkit-2311` liegt dort, wird von Grimlight nicht gebraucht).
`git` muss im PATH sein (hier 2.47.3) — `figuren_messung.mjs` liest den
Vorher-Stand per `git show`.

---

## 3 Prüf-Suiten zurückspielen und fahren

```sh
bash tools/checks/restore_tmp.sh          # kopiert tools/checks/tmp/** -> .tmp/**
bash tools/checks/restore_tmp.sh --trocken   # erst nur anschauen
bash tools/checks/restore_tmp.sh --force     # vorhandene Dateien ersetzen
```

Warum der Umweg über `.tmp/`: die **Sanktions-Kataloge der Specs zitieren
die `.tmp/`-Pfade samt Zeilennummern** (`SPEC_GP7CH2.md` §5, `SPEC_SLICE_6.md`
§7, `SPEC_GP7CH1.md`). Pfade umschreiben würde die Kataloge unprüfbar
machen. Deshalb: versioniert in `tools/checks/tmp/`, gefahren aus `.tmp/`.

`restore_tmp.sh` heilt dabei ein Detail: fünf Werkzeuge tragen
`/home/coder/Grimlight` **hart** im Quelltext (`shot_gfx6.py:108`,
`slice6_p4/messung_p4.py:34+38`, `check_gp6_art_self.mjs:63`,
`gp7ch_ch2_sonde/horde.mjs:4-6`, `knaeuel.mjs:3-5`). Liegt das Repo
woanders, tauscht das Skript das Präfix **nur in der Kopie unter `.tmp/`**;
die versionierte Quelle bleibt byte-gleich zum Original.

**Der Aufruf-Kanon mit allen Soll-Zahlen steht in
`tools/checks/README.md`.** Kurz: smoke 862 · Flusstests 25/25/33 ·
save 63 · builderA 106 · gfx6 GRUEN · engineB GRUEN · gp6_art_self
**6 Rot = SOLL** · probe_god/probe_s4 GRUEN · art_slice3_selfcheck GRUEN.

Zwei deklarierte Rot-Stände, die niemand „reparieren" darf:
`check_gp6_art_self` = 6 Rot (Symbolzeile, SPEC_GP7CH2 E-A7) und
`.tmp/check_world_slice1.mjs` = toter Wächter (SPEC_SLICE_6 §7 C, deshalb
gar nicht mitkopiert).

**Exit-Codes nie glauben** — auf die Schlusszeile schauen
(SPEC_GP7CH1 §5 „Exit-Codes nie glauben").

---

## 4 Wie Referenz-Bögen und Messwerkzeuge zusammenspielen

Der Grafik-Qualitätsprozess hat drei Instanzen, und sie brauchen
verschiedene Dinge:

**(a) Zahlen-Gates — `figuren_messung.mjs`.** Liest die Pixel-Grids direkt
aus `game/js/art/sprites*.js`, rechnet Körper-Luma, dE00, Profil, Rim,
Flip-Neutralität und vergleicht gegen die eingefrorenen Fenster aus
`SPEC_GP7CH2.md` E-B1..E-B10. Den **vorher**-Stand holt es sich per
`git show HEAD:game/js/art/sprites_figuren.js` (Cache in
`.tmp/gp7ch_p0/vorher_cache/`) — also braucht ein Clone die **Git-Historie**,
kein `--depth 1`. Geeicht ist es gegen die IST-Material-Tabellen
(`gp7ch_p0/gegner_material_IST.json`, `figuren_material_IST.json`); die
Zeichner-Tabelle der Phase 1 kommt per `--material-gegner
.tmp/gp7ch2_p1/material_gesamt.json`. Ausgabe: 64 Gates, zwei Bilanzen
(12.09.: 57/64 grün, 64/64 „grün oder deklariert").

**(b) Bild-Bögen — `tools/figuren_bogen.mjs` + `tools/horden_bogen.mjs`.**
Rendern die Figuren als PNG-Tafeln (1x / 4x / 6x / Squint) ohne Browser,
direkt aus den Grids über `node:zlib`. Sie liegen im Repo und brauchen
weder `.tmp/` noch Python. Sie sind die **gehärteten Nachfolger** der
Prototypen `.tmp/gp7ch_ch2_sonde/horde.mjs` + `knaeuel.mjs`
(`horden_bogen.mjs:930`: „Herkunft: gehaertet aus …").

**(c) Der Vorher-Anker — `design/referenz/`.** 3,3 MB committete PNGs plus
`README.md` mit sha256. Das ist der **eingefrorene Vorher-Stand**, gegen den
die Bild-Juroren urteilen; er darf nicht neu erzeugt werden, sonst verliert
jedes „vorher/nachher" seinen Sinn. `design/referenz/gp7ch2/` (94 Dateien)
enthält die Auflösung des Squint-Blind-Tests — **nie einem Juror zeigen**.

**(d) Realmessung im echten Renderer — `.tmp/shot_gfx6.py` /
`.tmp/slice6_p4/messung_p4.py`.** Nur hier läuft das Spiel wirklich: ein
Headless-Chromium fährt es auf `http://127.0.0.1:8124`, friert Zeitphasen
ein und misst pixelgenaue Fenster (Licht auf Figuren, Warm-Tint, DORF-Bild).
Das ist der einzige Teil, der Python, Playwright und einen Server braucht.
`shot_gfx6.py` **startet den Server nicht selbst** — vorher
`python3 .tmp/serve8124.py`.

Kurz: (a) misst Grids, (b) zeigt Grids, (c) hält das Gestern fest,
(d) misst das fertige Bild. Eine Abnahme braucht (a)+(b) gegen (c);
(d) kommt dazu, wo Licht oder Szene im Spiel eine Rolle spielt.

---

## 5 Ports und die Proxy-Regel

| Port | Wer | Start |
|---|---|---|
| **8123** | **Michaels Dev-Server. Für Agenten TABU** (SPEC_GP7CH1 §5 „Port 8123 tabu", SPEC_GRAFIKPASS_4 §54) | `python3 tools/serve.py` |
| **8124** | Agenten- und Mess-Server, der einzige erlaubte Zweitport (SLICE5_LANDKARTE Z. 393) | `python3 .tmp/serve8124.py` |
| **8125** | APK-Auslieferung | `python3 tools/serve_apk.py` |
| **8129** | Vorschau für Michael auf dem Arbeitsbaum | `python3 .tmp/serve_game_8129.py` |

Alle vier Server servieren ohne Cache (`Cache-Control: no-store`).
8123/8129 binden auf `0.0.0.0`, 8124 nur auf `127.0.0.1`.

**Proxy-Regel — der Schlussstrich.** Der Zugriff von außen läuft über die
code-server-Weiterleitung, z. B.
`https://code.srv1457801.hstgr.cloud/proxy/8129/`.

* **Immer mit Schlussstrich**: `/proxy/8129/`, nicht `/proxy/8129`.
* **Datei-Direktlinks geben 401.** Immer über die Startseite gehen
  (`uebergaben/2026-09-12_gp7ch2_gegner.md`, „Wie testen";
  `uebergaben/2026-08-15_slice5_sound.md` Z. 48-50 — die APK-Seite repariert
  ihren Download-Link seit `c4e0f9d` selbst, wenn der Strich fehlt).
* Das Proxy-Präfix wird zum Backend hin **gestrippt**, Query-Parameter
  kommen an (`/proxy/8124/?god=1` → Backend sieht `/?god=1`,
  `SLICE4_LANDKARTE.md` Z. 78-80). Deshalb müssen alle Pfade im Spiel
  **relativ** bleiben.
* Auf einem anderen Rechner ohne code-server entfällt das alles — dann
  direkt `http://<host>:8129/`. Die Schlussstrich-Regel gilt nur für den
  Proxy.

Zwei getrennte Spielstände: `localStorage` hängt am Origin. Die App läuft
unter `https://localhost` (Capacitor `androidScheme=https`), der Browsertest
unter der Proxy-URL. **App-Stand und Browser-Stand sind verschieden** —
sonst meldet Michael „mein Fortschritt ist weg" als Fehler
(`mobile/README.md`, `tools/ANLEITUNG_APK.md`).

---

## 6 Android-Toolchain (1,7 GB) — was genau wohin

Nicht raten: das Rezept ist vollständig in `tools/setup_android_toolchain.sh`
verdrahtet, ein Aufruf genügt.

```sh
bash tools/setup_android_toolchain.sh            # übernehmen oder laden
bash tools/setup_android_toolchain.sh --frisch   # immer frisch laden
```

Beide Skripte (`setup_…` und `build_apk.sh`) sind **idempotent**.
Danach liegt unter `<repo>/toolchain/` (in `.gitignore`, Spec Slice 4 §0.5,
damit `git add -A` nicht 2,1 GB einzieht):

```
toolchain/
  jdk-17.0.20+8/                 Temurin JDK, per Glob jdk-17* gefunden
  android-sdk/
    cmdline-tools/latest/bin/sdkmanager
    platforms/android-34/
    build-tools/34.0.0/
    platform-tools/adb
    licenses/                    headless angenommen
  gradle-home/                   GRADLE_USER_HOME (Gradle-Distribution + Maven-Cache)
  downloads/                     die geprüften Archive
  env.sh                         nur zum Nachschlagen
```

`build_apk.sh` prüft genau zwei Dinge und bricht sonst ab:
ein `toolchain/jdk-17*/bin/javac` **und** `toolchain/android-sdk/platforms/android-34`.
`JAVA_HOME` ist **nie fest verdrahtet**, sondern der Glob `toolchain/jdk-17*`.
Gesetzt werden `JAVA_HOME`, `ANDROID_HOME`, `ANDROID_SDK_ROOT`,
`GRADLE_USER_HOME=toolchain/gradle-home` (bewusst NICHT `~/.gradle`).

**Die Pins** (Spec §0.6 — „latest" wäre in vier Wochen etwas anderes):

```
JDK            Temurin 17.0.20+8   versionierte Adoptium-URL + sha256
cmdline-tools  Revision 12.0       Zip 11076708 + sha256
Plattform      platforms;android-34, build-tools;34.0.0
platform-tools "latest"            NICHT gepinnt (Google bietet keine
                                   versionierte URL) — deklariert, Spec §9
@capacitor/*   6.2.1 (app 6.0.3) · AGP 8.2.1 · Gradle-Wrapper 8.2.1
               Kotlin 1.9.10 · compileSdk/targetSdk 34 · minSdk 22
```

**Kaltstart braucht Netz** zu vier Hosts: `api.adoptium.net`, `github.com`
(Adoptium-Umleitung), `dl.google.com`, `services.gradle.org`.
`unzip` fehlt hier — entpackt wird mit `python3 -m zipfile`.

Dann bauen und ausliefern:

```sh
bash tools/build_apk.sh          # -> mobile/android/app/build/outputs/apk/debug/app-debug.apk
python3 tools/serve_apk.py       # Port 8125, Startseite /proxy/8125/
```

`build_apk.sh` erledigt der Reihe nach: Toolchain-Env, `cd mobile/`
(**Pflicht vor jedem `cap`-Aufruf** — aus dem Root scheitert es mit
„android platform has not been added yet"), `corepack npm@10.9.2 ci` falls
`node_modules` fehlt, `cap add android` falls `android/` fehlt,
Launcher-Icons aus `game/js/art/icon_app.js` rendern
(`tools/render_icon.mjs`, 15 PNGs), **drei idempotente Python-Patches**
(Querformat `sensorLandscape` im Manifest, `windowFullscreen` in beiden
Themes, Icon-Hintergrund `#1a2a1b`), `cap copy android`,
`./gradlew assembleDebug --no-daemon`. Details und Begründungen:
`mobile/README.md`.

Gemessen: APK ~3,8 MB, kalt mit vorhandener Toolchain 42 s, inkrementell 14 s.
Nicht möglich in dieser Umgebung (deklariert): iOS (braucht macOS/Xcode),
Emulator (`/dev/kvm` fehlt), ADB übers USB. Abnahme läuft über Michaels
Gerät. Das Debug-Zertifikat ist nicht Play-Store-tauglich.

---

## 7 Reihenfolge für den ersten Tag auf dem neuen Rechner

1. `git clone` **mit Historie** (kein `--depth 1` — `figuren_messung.mjs`
   braucht `git show HEAD:…`).
2. `node --version` >= 20 prüfen, `git` und `python3` prüfen.
3. `bash tools/checks/restore_tmp.sh` — Suiten zurückspielen.
4. Node-Suiten fahren (Abschnitt 3). **Erst wenn die alle ihre Soll-Zahl
   zeigen, ist der Clone gesund.**
5. `python3 tools/serve.py` → Spiel im Browser ansehen (`?god=1` für den
   Rundgang).
6. Optional venv + Playwright (Abschnitt 2) für die Realmessung.
7. Optional `bash tools/setup_android_toolchain.sh` + `bash tools/build_apk.sh`
   für das APK (Abschnitt 6).
8. Neueste Übergabe lesen: `uebergaben/2026-09-12_gp7ch2_gegner.md` —
   dort steht, was offen ist (Michaels Gerätetest zu GP7-CH-2, die
   Cast-Juror-Kritik, Politur-Runde CH-2b).

## 8 Was auf dem neuen Rechner besser wird

Die heutige Maschine hat **2 Kerne / 7 GB** (`reference_server_umgebung`).
Davon profitieren mit mehr Kernen direkt:

* die Bild-Rigs `figuren_bogen.mjs` / `horden_bogen.mjs` (viele Tafeln),
* der dE00-Würfelscan in `figuren_messung.mjs` (heute mit `--schnell`
  umgangen),
* `gradlew assembleDebug` (82 Tasks),
* parallele Agenten-Läufe (Zeichner A/B unter Mutex, V-TESTS + V-SPEC).

Nicht schneller wird der Smoke-Test (ein Prozess, 7603 Ticks, wenige
Sekunden) und nicht die Realmessung (sie friert Zeitphasen bewusst ein).
