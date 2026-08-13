# Slice-4-Landkarte (13.08.2026, wf_e353bc6b-387)


---

# TEIL A: Umgebungs-Machbarkeit

Alle Messungen liegen vor. Hier das Ergebnis.

---

# Slice-4-Landkarte, Auftrag A — Umgebungs-Machbarkeit

**Kernbefund vorab: Das APK ist HIER baubar.** Ein vollständiges, signiertes, installierbares Debug-APK (3,9 MB) mit dem echten Spiel darin wurde in dieser Umgebung erzeugt — kalt in 2m02s, inkrementell in 15s. Die Annahme in `CLAUDE.md` ("kein npm", Verpackung erst später) ist überholt: es geht alles, und zwar schnell.

Belege: `BUILD SUCCESSFUL in 2m 2s` / `-rw-r--r-- 3.9M app-debug.apk` / `package: name='de.grimlight.app' … application-label:'Grimlight'` / `Signer #1 certificate DN: C=US, O=Android, CN=Android Debug`

`git status --short` ist leer — `game/**`, `tools/**` und alle Tests unangetastet. Port 8123 lief durchgehend weiter (`8123 http=200`), Probe-Server lief auf 8124 und ist gestoppt.

---

## A.1 Werkzeuge — Ist-Zustand

| Werkzeug | Vorher | Beleg | Nachher (in `.tmp/`) |
|---|---|---|---|
| node | **v20.19.2** | `node --version` | unverändert |
| npm | **fehlt** | `which npm` → `npm not found` | via corepack, gepinnt |
| corepack | 0.24.0 | `corepack --version` | nutzbar |
| java/javac | **fehlt** | `java -version` → `command not found` | **JDK 17.0.20 Temurin** |
| gradle | **fehlt** | `gradle --version` → `command not found` | Wrapper 8.2.1 lädt sich selbst |
| sdkmanager/adb | **fehlt**, `ANDROID_HOME=` leer | `which sdkmanager adb` → not found | **SDK 34 komplett + adb 1.0.41** |
| unzip | **fehlt** | `unzip` → `command not found` | umgangen via `python3 -m zipfile` |

**Die npm-Falle (spec-relevant):** `corepack enable` scheitert — `EACCES: permission denied, symlink … '/usr/bin/pnpm'`. Kein Schreibrecht in `/usr/bin`, also **kein globales npm**. Der Shim funktioniert trotzdem, aber **bloßes `corepack npm` zieht npm 12.0.2**, das Node 20 verweigert: `npm warn cli npm v12.0.2 does not support Node.js v20.19.2`. Deshalb **zwingend pinnen**:

- `corepack npm@10.9.2 --version` → `10.9.2` ✓
- `corepack pnpm@9 --version` → `9.15.9` ✓ (bloßes `corepack pnpm` crasht)

**Ressourcen:** 96 G Platte / 75 G frei nach allen Downloads (`df -h /`), RAM 7,8 G gesamt / 3,5 G verfügbar (`free -h`), **nur 2 Kerne** (`nproc`), Debian 13 trixie, x86_64.

**Netz: vollständig offen und sehr schnell.** Alle fünf geprüften Hosts HTTP 200 (`registry.npmjs.org`, `dl.google.com`, `services.gradle.org`, `api.adoptium.net`, `github.com`), kein Proxy-Zwang. Durchsatz gemessen: **JDK 185 MB in 2s, cmdline-tools 147 MB in 5s**. npm-Install von Capacitor: **99 Pakete, 19 MB, 10s**.

---

## A.2 APK-Pfad-Optionen

### (a) Voll-lokal — **funktioniert, End-to-End verifiziert**

Kein Schritt ist hart gescheitert. Der komplette Weg wurde real durchlaufen:

1. JDK 17 von Adoptium → `javac 17.0.20` ✓
2. cmdline-tools entpackt (mit `python3 -m zipfile`, da `unzip` fehlt) ✓
3. **Lizenzen headless**: `yes | sdkmanager --licenses` → `All SDK package licenses accepted` ✓
4. `sdkmanager platform-tools "platforms;android-34" "build-tools;34.0.0"` → **458 MB in 10s** ✓
5. `cap init` + `cap add android` ✓
6. `./gradlew assembleDebug --no-daemon` → **BUILD SUCCESSFUL, 82 Tasks** ✓

Gesamt-Fußabdruck 2,1 GB, nicht die befürchteten 2-4 GB Extra-Last. Der Gradle-Wrapper zieht sich selbst (8.2.1-all), `GRADLE_USER_HOME` wurde bewusst in die Sandbox gelegt, damit `~/.gradle` leer bleibt (verifiziert: `nicht da: /home/coder/.gradle`).

**Zwei harte Grenzen dieser Umgebung:**
- **Kein Emulator**: `/dev/kvm` existiert nicht, `grep -c "vmx\|svm" /proc/cpuinfo` → `0`. Keine Virtualisierung. Ein APK lässt sich hier bauen, aber **nicht ausprobieren**.
- **Kein Headless-Chrome**: `which chromium google-chrome` → nichts, kein `~/.cache/puppeteer`. Performance-Messungen am laufenden Spiel gehen hier nicht automatisiert.
- **iOS ist ausgeschlossen** — braucht macOS + Xcode. Der iOS-Teil von Slice 4 ist in dieser Umgebung grundsätzlich unerreichbar, egal wie viel gebaut wird.

### (b) Extern bauen (GitHub Actions / Michaels Rechner)

Technisch möglich, aber **nach Befund (a) unnötiger Umweg**. Für einen Neuling wäre der Weg: GitHub-Repo anlegen, Actions-Workflow verstehen, Secrets für den Keystore setzen, Build-Logs lesen, Artefakt herunterladen. Das sind fünf neue Konzepte für ein Ergebnis, das hier in 15 Sekunden entsteht.

**Empfehlung: nur als Reserve** — relevant erst für den signierten Release-Build für Google Play, wo ein Keystore sicher verwahrt werden muss. Für "aufs Handy und spielen" nicht nötig.

### (c) PWA als Sofort-Stufe — **möglich, aber mit einem echten Haken**

Hier habe ich die Proxy-Situation vermessen, statt sie zu vermuten. `VSCODE_PROXY_URI=https://code.srv1457801.hstgr.cloud/proxy/{{port}}/`

| Frage | Messung | Ergebnis |
|---|---|---|
| HTTPS gültig? | `curl -sI https://code.srv1457801.hstgr.cloud/` → `HTTP/2 302`, `ssl_verify=0` | ✓ Service-Worker erlaubt |
| Pfad-Präfix-Problem? | Echo-Server auf 8124: `/proxy/8124/js/main.js` → Backend sieht `/js/main.js` | ✓ **Präfix wird gestrippt** |
| Scope-Problem? | Präfix gestrippt → SW unter `/proxy/8123/sw.js`, Scope `/proxy/8123/` deckt alle Assets | ✓ **wenn alle Pfade relativ** |
| Query-Parameter? | `/proxy/8124/?god=1` → Backend sieht `/?god=1` | ✓ **kommen an** |
| Auth? | ohne Cookie: Navigation `302`, Assets `401` | ✗ **Login-Pflicht** |

**Zwei Korrekturen an bestehenden Annahmen:**

1. **`MEMORY.md` sagt "Port-Weiterleitung frisst Query-Parameter!" — das stimmt auf HTTP-Ebene nicht.** Der Proxy reicht `?god=1` sauber durch, im Root-Pfad wie im Datei-Pfad. Was auch immer `?god=1` damals verschluckt hat, war nicht der Proxy (vermutlich der "Open in Browser"-Knopf der VS-Code-Oberfläche). Das ist wichtig, weil ein PWA-`start_url` mit Query-Parameter dadurch doch möglich ist.
2. **Das Passwort in `~/.config/code-server/config.yaml` ist tot.** Login damit → `Incorrect password`. Es gibt eine `PASSWORD`-Umgebungsvariable auf PID 1, die die Datei überschreibt (nur der Variablenname geprüft, Wert nicht ausgegeben).

**Der Haken:** Damit die PWA aufs Handy kommt, muss Michael sich **auf dem Handy bei code-server einloggen**. Danach ist es robust — ein Service Worker, der die 796 KB komplett vorlädt, macht das Spiel offline-fähig und unabhängig von ablaufenden Sessions. Aber der erste Schritt ist eine Passwort-Eingabe auf dem Handy, und die Installierbarkeit hängt an einem Server, der weiterlaufen muss. **Als "Sofort-Stufe" gut, als Endzustand schwach** — verglichen mit einem APK, das einfach auf dem Gerät liegt.

Einschränkungen im installierten Modus, soweit strukturell beurteilbar: `display: fullscreen` im Manifest liefert Vollbild ohne Browser-Leiste; `orientation: landscape` ist im Manifest deklarierbar und wird von Android-Chrome respektiert (auf iOS nicht); `localStorage` überlebt in der installierten PWA, ist aber unter Speicherdruck räumbar, solange kein `navigator.storage.persist()` angefordert wird. Audio existiert im Spiel noch gar nicht, spielt für Slice 4 also keine Rolle.

---

## A.3 Capacitor-Probe — was entsteht

`cap init "Grimlight" "de.grimlight.app"` erzeugt eine einzige Datei, `capacitor.config.json`. `cap add android` erzeugt `android/` (1,5 MB vor dem Build, 29 MB danach) mit `gradlew`, `settings.gradle`, `app/build.gradle`, `variables.gradle` und `capacitor-cordova-android-plugins/`.

**Versionen:** Capacitor 6.2.1 (core/cli/android), AGP 8.2.1, Kotlin 1.9.10, Gradle-Wrapper 8.2.1, `minSdkVersion = 22`, `compileSdkVersion = 34`, `targetSdkVersion = 34`. Die installierten SDK-Pakete passen exakt.

**webDir: Kopie, kein Symlink.** `cap copy` meldet `Copying web assets from game to android/app/src/main/assets/public`. Wichtig für die Spec: **`webDir` kann direkt auf das echte Spiel zeigen** — ich habe `"webDir": "../../game"` gesetzt und `cap copy android` lief sauber durch (34 ms). **Es braucht kein `www/`-Spiegelverzeichnis**, keine Kopie im Repo, keine Synchronisationspflicht. Der Ablauf ist: an `game/` arbeiten → `cap copy` → `gradlew assembleDebug`.

Verifiziert, dass das echte Spiel im APK landet: 29 Einträge unter `assets/public/`, darunter `index.html`, `js/main.js`, `js/art/sprites.js`.

**Ohne SDK bricht nichts an `cap add android`** — der Befehl kopiert nur Templates (52 ms) und meldet `Syncing Gradle in 193.60μs` ohne echten Gradle-Lauf. Erst `gradlew` braucht JDK und SDK.

---

## A.4 Empfehlung — Stufenplan

**Der Umweg über PWA lohnt sich nicht als Hauptweg.** Die Machbarkeitsfrage, die Slice 4 riskant machte, ist beantwortet: das APK entsteht hier in 15 Sekunden. Ich empfehle **direkt Option (a)**, mit PWA nur als optionalem Nebenprodukt.

| Stufe | Inhalt | Aufwand | Risiko |
|---|---|---|---|
| **1. Toolchain fest** | JDK+SDK aus der Sandbox an einen dauerhaften Ort, ein `tools/build_apk.sh`, das alle Env-Variablen setzt | klein, Weg ist erprobt | **sehr gering** — komplett vermessen |
| **2. Capacitor ins Repo** | `mobile/` als neues Top-Level (nicht in `game/`, nicht in `tools/`), `webDir: "../game"`, `android/` + `node_modules/` in `.gitignore` | klein | gering |
| **3. Save-System** | **komplett grün** — `grep localStorage\|sessionStorage\|indexedDB game/js` findet **null Treffer**. Es gibt noch keinerlei Persistenz | mittel, echte Design-Arbeit | mittel — der eigentliche inhaltliche Brocken von Slice 4 |
| **4. Mobile-Feinschliff** | Vollbild, Orientierungs-Sperre, Safe-Area (`viewport-fit=cover` ist schon gesetzt), Zurück-Taste | klein | gering |
| **5. Performance** | **hier nicht automatisiert messbar** (kein Chrome, kein KVM). Nur auf Michaels Gerät | mittel | **erhöht** — Messung nur manuell |
| **6. Release/Play Store** | Keystore via `keytool` (vorhanden), signierter Build via `apksigner` (vorhanden) | mittel | gering, aber später |

**Was schon erledigt ist und nicht neu gebaut werden muss:** Touch-Eingabe existiert (`input.js` mit `touchstart/move/end/cancel`). Das CSS ist bereits mobil gehärtet — `touch-action: none`, `overscroll-behavior: none`, `user-select: none`, `-webkit-tap-highlight-color: transparent`, Letterbox, und `main.js` skaliert ganzzahlig in Geräte-Pixeln inklusive `devicePixelRatio` und `orientationchange`. Das Spiel ist erstaunlich weit für einen Handy-Wrap.

**Was Michael-seitig passieren muss — der Weg aufs Gerät:**

ADB scheidet aus. Michael sitzt remote am code-server im Browser; sein Handy hängt nicht am USB dieses Servers. Der realistische Weg ist ein **Datei-Download über die HTTPS-Weiterleitung**:

1. Ein Server liefert das APK auf einem Port (nicht 8123).
2. Michael öffnet **auf dem Handy** `https://code.srv1457801.hstgr.cloud/proxy/<port>/app-debug.apk`, loggt sich einmal bei code-server ein.
3. Chrome lädt die Datei. Python kennt den Typ korrekt (`mimetypes.guess_type('x.apk')` → `application/vnd.android.package-archive`) — für Chrome ist `application/octet-stream` allerdings der zuverlässigere Download-Auslöser, das gehört in die Spec.
4. Antippen → Android fragt nach "Installation aus unbekannter Quelle erlauben" → einmal bestätigen → fertig.

Das Debug-APK ist mit dem Android-Debug-Zertifikat signiert und damit ohne Weiteres installierbar. **Voraussetzung am Gerät: Android 5.1 oder neuer** (`sdkVersion:'22'`).

Für einen Neuling sind das genau zwei ungewohnte Handgriffe: der code-server-Login auf dem Handy und die Freigabe für unbekannte Quellen. Beide einmalig.

---

## Sandbox-Inventar

Alles unter `/home/coder/Grimlight/.tmp/slice4_probe/` (2,1 GB), dokumentiert in `/home/coder/Grimlight/.tmp/slice4_probe/README.md` samt Nachbau-Kommandos. Das gebaute APK liegt unter `/home/coder/Grimlight/.tmp/slice4_probe/android/app/build/outputs/apk/debug/app-debug.apk`.

**Außerhalb von `.tmp` angelegt** — drei Standard-Caches, alle löschbar: `~/.cache/node/corepack` (96 MB), `~/.npm` (43 MB), `~/.android` (3,5 MB).

**Nichts in Systempfaden.** `/usr/bin/npm` und `/usr/bin/pnpm` existieren weiterhin nicht (`corepack enable` ist an EACCES gescheitert — hier ein Glücksfall), `~/.gradle` wurde nie erzeugt. Vollständiges Aufräumen: `rm -rf /home/coder/Grimlight/.tmp/slice4_probe ~/.cache/node/corepack ~/.npm ~/.android`


---

# TEIL B: Spiel-Bereitschaft

## KURZFAZIT

Das Spiel ist technisch näher an "Handy-tauglich", als der Slice-Titel vermuten lässt: Viewport-Meta, `touch-action: none`, Multi-Touch, DPR-bewusste Ganzzahl-Skalierung und ein Delta-geklammerter Loop sind schon da. Die echten Lücken sind: **kein Save (null Zeilen Persistenz)**, **keine Pause bei App-Wechsel**, **kein Querformat-Zwang** (Hochformat macht das Spiel unbedienbar, gemessen 6,0 mm Button-Durchmesser), **fehlende App-Metadaten/Icons** und **eine JS-Last von ~1600 Objekt-Allokationen plus ~1600 fillRect je Frame** im Lichtsystem. Auftrag A hat parallel bereits bewiesen, dass ein APK aus `game/` baut (`.tmp/slice4_probe/README.md`), der webDir-Pfad zeigt direkt auf `../../game`.

---

## 1. TOUCH

**Was existiert** (alles in `game/js/core/input.js`, Overlay in `game/js/ui/hud.js:506-540`):

| Sache | Beleg | Stand |
|---|---|---|
| Dynamischer Joystick links, Angriff rechte Hälfte | `input.js:183-193` | vorhanden |
| Button A (Angriff) r=16, B (Trank) r=12, W (Zweitwaffe) r=14 | `input.js:75-79` | vorhanden, W nur mit Bumerang (`main.js:416`) |
| HUD-Box-Zone (Inventar öffnen) 30x30 px | `input.js:44`, scharfgeschaltet `main.js:419-421` | vorhanden |
| Zonen-Prüfreihenfolge HUD-Box > W > B > Joystick/Angriff | `input.js:169-193` | vorhanden |
| `passive: false` gegen iOS-Zoom/Rubberband | `input.js:257-261` | vorhanden |
| touchcancel behandelt wie touchend | `input.js:261` | vorhanden |
| viewport-Meta inkl. `viewport-fit=cover`, `user-scalable=no` | `game/index.html:5` | vorhanden |
| `touch-action: none`, `overscroll-behavior: none`, `-webkit-tap-highlight-color: transparent` | `game/css/style.css:11-15,27` | vorhanden |

**Multi-Touch ist echt** (verifiziert, `node .tmp/slice4_probe/touch_probe.mjs`, Abschnitt B): `attackIds`/`potionIds`/`secondaryIds` sind Sets (`input.js:50-53`), Joystick + Angriff gleichzeitig liefern `dirX 1` und `attack true`.

**Dead-Zone/Radius skalieren korrekt mit dem Bildschirm**: `toGame()` leitet sie pro Touch aus `getBoundingClientRect()` ab (`input.js:148-160`), Spec-Werte 40/8 Bildschirm-px (`input.js:30-31`). Gemessen bei 2 CSS-px je internem px: `joyRadius = 20` intern, unter 4 intern px bleibt `dirX = 0` (Probe A).

**Was für ein echtes Handy fehlt** (Rechnungen aus Probe F/G, Handy 1080x2400, dpr 3, 6,5 Zoll):

1. **Hochformat ist unbedienbar, es gibt keinen Lock.** Querformat: Skalierung 6, Canvas 640 CSS-px, Button A = **12,2 mm**, B = **9,1 mm** (beides über der 9-mm-Faustregel). Hochformat: Skalierung 3, Canvas 320 CSS-px von 360, Button A = **6,0 mm**, B = **4,5 mm**. Ursache ist `main.js:39-42` (`Math.floor` auf beide Achsen), nicht Touch-Code.
2. **Button A kollidiert mit der System-Gestenleiste.** Unterkante A liegt bei y=164 von 180 (Probe D), also **16 interne px = 6,1 mm** über der Bildschirmkante. In Querformat füllt das Canvas die Höhe exakt (`main.js:44`), darunter sitzt Androids Wischbalken bzw. der iOS-Home-Indicator. `viewport-fit=cover` ist gesetzt (`index.html:5`), aber **nirgends wird `env(safe-area-inset-*)` ausgewertet** (`style.css` komplett, 33 Zeilen).
3. **Lücke A zu B nur 8,9 interne px = 3,4 mm** (Probe D). Fehlgriffe zwischen Angriff und Trank sind wahrscheinlich.
4. **Joystick-Vollausschlag 40 CSS-px = 7,6 mm Radius** (Probe F). Analoge Feinsteuerung mit dem Daumen ist auf dieser Strecke kaum möglich; typische virtuelle Sticks liegen bei 15 bis 20 mm.
5. **Zweiter Finger in der linken Hälfte wird verworfen**: `input.js:183-190` nimmt einen Links-Touch nur an, wenn `joyId === null`, sonst fällt er in keine Zone (Probe C: `attack` bleibt unverändert). Kein Fehler, aber Linkshänder und "Angriff links" sind ausgeschlossen; es gibt keine Belegungs-Option.
6. **`input.touch.active` wird nie zurückgesetzt** (gesetzt `input.js:164`, gelesen `hud.js:506`). Nach dem ersten Tap bleibt das Overlay dauerhaft an. Für ein reines Touch-Gerät richtig, für Tastatur-Nutzer nach einem einzigen Tap störend.
7. **devicePixelRatio wird nur bei `resize`/`orientationchange` neu gelesen** (`main.js:46-48`). Kein `matchMedia('(resolution: …)')`-Listener; bei Faltgeräten/Zoom bleibt die Skalierung stehen. Geringes Risiko in Capacitor.
8. **Halbpixel-Versatz beim Zentrieren.** `body` zentriert per Flexbox (`style.css:18-22`), die CSS-Größe kommt aus `main.js:43-44`. Bei ungerader Geräte-Auflösung entsteht ein halber Gerätepixel Versatz: iPhone 14 Pro (1179x2556, dpr 3) ergibt Rand oben/unten **49,5 Gerätepixel** (Probe G). Folge bei `image-rendering: pixelated`: ungleich breite Pixelreihen (Scherung) im ganzen Bild.
9. **Inventar-Trefferflächen sind klein**: Listenzeilen 16 px = 6,1 mm (`inventory_ui.js:16`), X-Button 20x20 px = 7,6 mm (`inventory_ui.js:19`). Nur "ANLEGEN" 72x22 (`inventory_ui.js:18`) ist bequem.

---

## 2. LEBENSZYKLUS

**Der Akkumulator läuft NICHT weg.** `loop.js:29` klammert jedes Delta auf `MAX_DELTA = 0.25` (`loop.js:6`), `loop.js:32` begrenzt auf `MAX_UPDATES = 5`, und `loop.js:37` (`if (n === MAX_UPDATES) acc = 0`) verwirft den Rest. Nach einer Stunde im Hintergrund kostet die Rückkehr also höchstens 5 Nachhol-Ticks, nie einen Spiral-of-Death. Das ist der Bestpfad und muss in Slice 4 nicht angefasst werden.

**Was fehlt:**

1. **Kein Spiel-Pause bei App-Wechsel.** `visibilitychange` wird nur in `input.js:254-256` behandelt und ruft `onFocusLost()` (`input.js:234-245`), das lediglich gehaltene Eingaben verwirft. Der Zustandsautomat in `main.js` kennt keinen `paused`-State (`main.js:239`, States: title/playing/inventory/gameover/victory). Wer den Anruf annimmt, kommt mitten in den Kampf zurück. Der rAF ruht zwar (Browser/WebView drosselt), aber es gibt keine Wiedereinstiegs-Sperre.
2. **`loop.stop()` wird nie aufgerufen.** `createLoop({update, render}).start()` steht in `main.js:1010`, `stop` (`loop.js:44-46`) hat keinen Aufrufer. Für Pause/Batterie gibt es also keinen Hebel, obwohl die API vorhanden ist.
3. **Kein `pagehide`/`freeze`-Handler.** Für ein Auto-Save beim Wegschalten (Android kann die App ohne weiteren Callback killen) ist genau das der richtige Aufhänger und existiert nicht.
4. **Fullscreen/Orientierung: null Code.** Kein `requestFullscreen`, kein `screen.orientation.lock`, im ganzen `game/` kein Treffer. Für Querformat-Lock in der App ist der günstigste Weg **nicht JS**, sondern die Capacitor-Plattformkonfiguration (`android:screenOrientation="sensorLandscape"` im AndroidManifest; iOS `UISupportedInterfaceOrientations`). Für den Browser-Fallback braucht `screen.orientation.lock('landscape')` auf Android Chrome zwingend vorher Fullscreen, was wiederum eine Nutzergeste braucht: der Titelbild-Tap (`main.js:433-437`) ist der einzige natürliche Ort dafür.
5. **Audio ist tatsächlich noch nicht da** (Slice 5), also entfällt das übliche Suspend/Resume-Problem des AudioContext komplett. Das ist ein echter Vorteil des Zeitpunkts.

---

## 3. SAVE-SYSTEM

**Heute ist NICHTS persistent.** `grep -rn "localStorage\|sessionStorage\|indexedDB" game/ tools/` liefert null Treffer. Jeder Reload startet am Titel (`main.js:239`).

**Die Save-Schnittstelle ist schon gebaut, sie heißt `carry`.** `buildWorld(mapKey, spawn, carry)` (`main.js:303`) enthält in `main.js:313-320` exakt die Liste dessen, was einen Kartenwechsel überlebt, samt der bindenden Reihenfolge:

```
player.inv = prev.inv;        // main.js:314
player.prog = prev.prog;      // main.js:315  Referenz, traegt XP/Level/Herzcontainer
player.recalcStats();         // main.js:316  leitet maxHp ab
player.hp = Math.min(prev.hp, player.maxHp);  // main.js:317
player.gold = prev.gold;      // main.js:318
player.potions = prev.potions; // main.js:319
```

Ein Load ist genau dieser Block mit dem geladenen Objekt statt `prev`. **maxHp darf NICHT gespeichert werden**, es ist abgeleitet (`player.js:90-96`, `progression.js:39-44`).

**Minimaler Spielstand (vollständig, alles bereits Plain-JSON):**

| Feld | Quelle | Beleg |
|---|---|---|
| `mapKey` | `currentMapKey` | `main.js:274`, gesetzt `main.js:304` |
| `spawn {x,y}` | `lastSpawn` | `main.js:273`, gesetzt `main.js:305`; Format `tc()` aus `maps.js:645` |
| `hp`, `gold`, `potions` | Spieler | `player.js:58,66,67` |
| `inv` | `createInventory()`: items/equipped/capacity/zelda/pity/newFlag | `items.js:75-83`, ausdrücklich "plain JSON, S4-Save via JSON.stringify muss verlustfrei sein" `items.js:5-8` |
| `prog` | `{xp, level, hearts}` | `progression.js:20-22`, ausdrücklich "S4-Save kann es direkt serialisieren" `progression.js:18-19` |
| `runFlags.bossDead` | Boss-Zustand | `main.js:272`; steuert Boss-Filter `main.js:336` und Siegtruhe `main.js:342-344` |

**Was NICHT gespeichert werden muss (und warum das kein Verlust ist):**

- **Truhen/Vasen/Gegner**: werden bei jedem `buildWorld` frisch gebaut (`main.js:329-339`), dokumentierter Slice-1-Kompromiss (`main.js:298-299`). Ein Save erzeugt hier also keine neue Inkonsistenz, das Verhalten ist schon heute so. Die Beute aus Truhen (Bumerang/Schlüssel/Herzcontainer) hängt am Spieler, nicht an der Truhe (`props.js:64-100` pusht Events, Inhalt landet in `inv`/`prog`).
- **`portalsArmed`**: wird in `buildWorld` auf lauter `false` gesetzt (`main.js:371`). Genau das ist nach einem Load die sichere Voreinstellung, weil der Spieler oft auf einem Portal-Spawn steht: das Portal wird erst scharf, wenn er es einmal verlassen hat (`main.js:572-574`).
- Transient und immer zurücksetzbar: `fadePhase`/`fadeT`/`pendingPortal` (`main.js:251-253`), `victoryTimer` (`main.js:256`), `toast` (`main.js:268`), `levelupTimer` (`main.js:275`), `bossLagW`/`bossLagFrames` (`main.js:281-282`), `portalToastTimer` (`main.js:283`), `zeldaWasAir`/`zeldaBlink` (`main.js:269-270`).
- **Niemals das `player`-Objekt selbst serialisieren**: es trägt Funktionen (`player.js:80-85`: `update`, `getSwordHitbox`, `hurt`, `heal`, `recalcStats`, `draw`).

**Wo die Hooks minimal-invasiv sitzen (God-Mode-Muster, `main.js:232-237`):**

- **Schreiben**: am Ende von `buildWorld` (nach `main.js:374`) ist der natürliche Checkpoint ("bei jedem Kartenwechsel und jedem Respawn"), zusätzlich nach dem Respawn-Block `main.js:608-612`. Ein zweiter, billiger Trigger: der `pagehide`-Handler aus Punkt 2.
- **Lesen**: im Titel-Zweig `main.js:433-437`. Achtung, dort startet **jeder** Confirm sofort einen frischen Run über `resetRun()` (`main.js:385-393`), und jeder Touch setzt `confirm` (`input.js:165`). Eine Auswahl "FORTSETZEN / NEUES SPIEL" braucht damit echte Menü-Logik, `drawTitle` (`hud.js:701-711`) hat heute keine Selektion. Billigste Variante: automatisch fortsetzen, wenn ein Save existiert, plus ein kleiner "NEU"-Button im Titel.
- **Alles bleibt in `main.js`**, wenn die Serialisierung in ein neues, Node-importierbares Modul geht (Vorschlag `game/js/items/save.js`, reine Funktionen `serialize(state)` / `deserialize(json)` ohne jeden Browser-Zugriff). Nur `main.js` fasst dann `window.localStorage` an, genau wie es `main.js:223-237` mit `location.search` tut. CLAUDE.md-Regel 4 (Node-Importierbarkeit) bleibt gewahrt.

**Flusstest-Verträglichkeit, gemessen:** Die drei kanonischen Flusstests stubben `window` ohne Storage. Mein Probelauf gibt aus:

```
STUB-BEFUND  window.localStorage = undefined
STUB-BEFUND  globalThis.localStorage = undefined
```

(Stub-Definition `.tmp/check_main_slice1.mjs:60-67`, gleichlautend `check_inventory_slice2.mjs:76-81`, `check_boss_slice3.mjs:76-79`.) Ein ungeguardetes `window.localStorage.getItem(...)` beim Boot macht **alle drei Flusstests rot**. Pflichtform:

```js
const store = (() => { try { return window.localStorage || null; } catch { return null; } })();
```

Das `try` ist nicht optional: WebViews mit blockierten Cookies werfen bei reinem Property-Zugriff eine `SecurityError`. Zweite Auflage: **ohne Storage muss der Startpfad byte-gleich zum Bestand bleiben** (Titel, dann `resetRun`), sonst kippen die szenario-basierten Assertions.

**Capacitor-Hinweis:** `localStorage` überlebt in Capacitor App-Updates (fester Origin `http://localhost` bzw. `capacitor://localhost`) und braucht kein Plugin. `@capacitor/preferences` (SharedPreferences/UserDefaults) ist robuster gegen "Cache leeren", aber async und eine Extra-Abhängigkeit. Empfehlung für Slice 4: `localStorage` zuerst, weil es im Browser UND in der App identisch funktioniert und den Flusstest-Guard ohnehin braucht.

**Wichtig für die Spec:** Der `?god=1`-Trick (`main.js:237`) ist in der App **nicht erreichbar**, weil Capacitor `index.html` ohne Query-String lädt. Alles, was Michael in der App bedienen soll (Save löschen, God-Mode), braucht eine In-Game-Oberfläche.

---

## 4. PERFORMANCE

**Was GP6 schon gemessen hat:** Nur `lighting.draw`. Baseline am Worst-View CATACOMBS Kamera (112,80) mit 21 Lichtern: 2,067 ms Mittel / 2,700 ms P95 (`design/GP6_PHASE0.md`, Abschnitt 1), Gate 2,79 / 4,05 ms, Endstand nach Umbau 2,10 ms bei max 1679 Läufen (`uebergaben/2026-08-13_grafikpass6.md`). **Gemessen wurde auf einem Software-Rasterizer in der VM** (SwiftShader, ausdrücklich vermerkt in `GP6_PHASE0.md` Abschnitt 0: "Absolutwerte sind VM-Softwarewerte, keine Handy-GPU-Werte"). Es gibt **keine Messung des Gesamtframes** und keine für die anderen Karten.

**Gesamtzahl der Zeichen-Operationen je Frame** (neu gemessen, `node .tmp/slice4_probe/count_ops.mjs <MAP>`, 240 Frames im echten `main.js`-Fluss, Spieler am Spawn):

| Karte | drawImage (Haupt-Canvas) | fillRect (Haupt) | fillRect (Licht-Offscreen) | Ops gesamt Median / Max |
|---|---|---|---|---|
| GRAVEYARD | 386 | 205 | 983 | 1579 / 1712 |
| **CATACOMBS** | **570** | **703** | **1310** | **2588 / 2978** |
| FLUESTERGRUFT | 493 | 433 | 1335 | 2262 / 2523 |
| BOSS_KAMMER | 407 | 358 | 1567 | 2334 / 2391 |

Das Touch-Overlay kommt auf dem Handy noch dazu, ist aber vernachlässigbar: 2 arcs plus je 4 Ops pro sichtbarem Button (`hud.js:506-540`), also rund 14 Ops.

**Die drei kritischen Punkte für ein Mittelklasse-Handy:**

1. **~1600 kleine `fillRect` je Frame auf dem Licht-Offscreen** (`lighting.js:520-528`). Gemessen `node .tmp/slice4_probe/light_cost.mjs`: 1584 Läufe im Mittel, 1694 max bei 21 Lichtern im Culling-Fenster. Auf dem Desktop ist das billig, auf mobilen GPU-Treibern ist die Kosten pro Zeichenbefehl (JS-Bridge + Statuswechsel) der dominierende Anteil, nicht die Fläche. Die Eimer-Bündelung (`lighting.js:511-528`) hat schon 13 statt 1600 `fillStyle`-Wechsel erreicht, die Aufruf-Anzahl selbst ist unangetastet.
2. **1584 Objekt-Allokationen je Frame** aus `runs.push({x,y,w,h,k})` (`lighting.js:370-376`) plus **26 Float32Array à 1028 Byte** aus `buildLut` (`lighting.js:263-273`, aufgerufen `lighting.js:323`). Bei 60 fps sind das ~95.000 Objekte/s. Das ist GC-Druck, und GC-Pausen sind auf Handys genau die Ruckler, die man sieht.
3. **`buildLut` ist zu 100 % cachebar und kostet trotzdem die Hälfte.** Gemessen: `lightRuns` gesamt 0,351 ms reine JS-Zeit je Frame, davon `buildLut` **0,195 ms (56 %)**. Der Seed ist `l.x * 0.7 + l.y * 1.3` (`lighting.js:323`), hängt also **nur von der Weltposition ab, nicht von `timeSec`**. Für ortsfeste Fackeln ist die LUT über die gesamte Laufzeit konstant. Ein `Map<seed, Float32Array>` spart rund die Hälfte der JS-Zeit und 26 Allokationen je Frame, ohne ein einziges Pixel zu verändern (leicht mit einem Byte-Gleichheits-Test zu belegen).

**Canvas-Größe und Upscaling** (`index.html:11` Backing fest 320x180, `main.js:36-45`): Die Strategie ist korrekt (Backing klein, CSS-Größe groß, `imageSmoothingEnabled = false` in `main.js:34`, `image-rendering: pixelated` in `style.css:25`). Das Hochskalieren macht der Compositor auf der GPU und ist praktisch gratis. **Konsequenz für Slice 4: Auflösung ist kein Performance-Thema, die Zeichenbefehl-Anzahl ist es.** Einziger Haken ist der Halbpixel-Versatz aus Punkt 1.8.

**Batterie:** `rAF` läuft dauerhaft, auch im Titel und im Game-Over (`main.js:1010`, keine Ausnahme in `render()` `main.js:981-1008`). Bei Unsichtbarkeit drosselt der WebView `rAF` selbst, das ist also gedeckt. Ungedeckt ist der Vordergrund: statische Bildschirme (Titel, Game-Over, Inventar-Pause) zeichnen das volle Bild mit 60 fps, obwohl sich fast nichts ändert. Ein `loop.stop()` im Titel oder ein 30-Hz-Modus für statische States wäre eine billige Laufzeitverlängerung, `stop()` existiert bereits ungenutzt (`loop.js:44-46`).

---

## 5. INDEX / ASSETS

`game/index.html` (14 Zeilen) und `game/css/style.css` (33 Zeilen) sind vollständig gelesen.

**Gut und unverändert übernehmbar:**
- **Alle Pfade sind relativ**: `css/style.css` (`index.html:8`), `js/main.js` (`index.html:12`). `grep -rn "src=\"/\|href=\"/\|from '/\|http://\|https://\|file://" game/` liefert **null Treffer**. Nichts bricht in einem App-Container.
- **Kein einziges Binär-Asset**, Grafik ist Code (`game/js/art/`). `du -sh game/` = **796 KB**, davon 332 KB Art. Der webDir ist winzig, das APK von Auftrag A wiegt 3,9 MB.
- Viewport-Meta bereits mobil-korrekt inkl. `viewport-fit=cover` und `user-scalable=no` (`index.html:5`), `apple-mobile-web-app-capable` (`index.html:6`).
- `touch-action: none` und `overscroll-behavior: none` auf html/body und Canvas (`style.css:11-12,27`), also kein Pull-to-Refresh, kein Doppeltipp-Zoom.

**Was fehlt:**
1. **Keine Icons.** Kein Favicon, kein `apple-touch-icon`, kein Android-Launcher-Icon. Capacitor braucht die Launcher-Icons als PNG unter `android/app/src/main/res/mipmap-*`. Das ist die **erste Stelle im Projekt, die echte Binärdateien verlangt** und damit gegen die "Grafik als Code"-Regel aus CLAUDE.md Punkt 3 verstößt. Ausweg im Sinne des Projekts: das Icon als Pixel-Grid in `art/` pflegen und per Node-Skript in `tools/` zu PNG rendern.
2. **Kein `manifest.json`, kein `theme-color`, kein `mobile-web-app-capable`** (die nicht-Apple-Variante), kein `apple-mobile-web-app-status-bar-style`. Für Capacitor ist ein Manifest optional, für die Browser-Variante (Michael testet ja über Port 8123) macht es den Unterschied zwischen "Website" und "Vollbild-App".
3. **Kein `env(safe-area-inset-*)`** in `style.css`, obwohl `viewport-fit=cover` gesetzt ist. Siehe Punkt 1.2.
4. **`type="module"` ist Capacitor-tauglich, aber file-Protokoll-untauglich.** `index.html:12` lädt ES-Module; Capacitor serviert über `http://localhost` (Android) bzw. `capacitor://localhost` (iOS), damit funktionieren die relativen Modul-Specifier. Über `file://` würden sie an CORS scheitern. Das ist kein Problem, muss aber in der Spec als Randbedingung stehen (kein "APK einfach mit file:// testen").
5. **`8px monospace` ist plattformabhängig** (`hud.js:284,548,572`, `inventory_ui.js:162`, Titel `hud.js:704-708`). Auf Android ist das Droid Sans Mono, auf iOS Courier, im Container wieder etwas anderes. HUD-Texte (GOLD, GAME OVER, Toasts) können in der App anders brechen als im Browser. Es gibt keine eingebettete Schrift und kein `measureText` (GP6 hat das ausdrücklich vermieden, `GP6_SPEC_REVIEW.md:406`). Risiko: Textüberlauf, kein Absturz.
6. `style.css:31` nutzt `min(100vw, 177.78vh)` nur als Fallback, bis `main.js` die Inline-Größe setzt. In einem WebView ohne URL-Leiste ist `100vh` stabil, das ist unkritisch.

---

## 6. TESTS

**`tools/smoke_test.mjs` (3893 Zeilen) importiert `main.js` NICHT** (`smoke_test.mjs:1-3`: "importiert NUR Module ohne Browser-Bezug auf Modulebene"). Save-/Lifecycle-Änderungen in `main.js` sind für die Smoke-Suite unsichtbar. Das ist gleichzeitig die Chance: ein reines `save.js` mit `serialize`/`deserialize` ist dort **rein additiv** testbar, im Muster GP6-§7F ("ADDITIVE NEUE Blöcke", `SPEC_GRAFIKPASS_6.md:598-604`), das GP6 mit +111 Assertions ohne eine einzige Bestandsänderung gefahren hat.

**Berührt würden:**

| Suite | Berührung durch Save/Lifecycle | Beleg |
|---|---|---|
| `tools/check_syntax.sh` | keine, nur `node --check` | `check_syntax.sh:16-23` |
| `tools/smoke_test.mjs` | keine (kein main.js-Import), nur additiv erweitern | `smoke_test.mjs:1-33` |
| `.tmp/check_main_slice1.mjs` | **ja**: lädt `main.js` mit `window`-Stub ohne `localStorage` | `check_main_slice1.mjs:60-80,86` |
| `.tmp/check_inventory_slice2.mjs` | **ja**, gleicher Stub | `check_inventory_slice2.mjs:76-98` |
| `.tmp/check_boss_slice3.mjs` | **ja**, gleicher Stub | `check_boss_slice3.mjs:76-94` |
| `.tmp/check_gfx6_art.mjs` | keine (reine Art-Prüfung) | Dateiname/Rolle laut `SPEC_GRAFIKPASS_6.md:605` |

**Zwei Fallen in den Flusstests, die eine Save-Implementierung reißen kann:**

1. **Storage-Guard** (siehe Abschnitt 3): ohne `try/catch`-Guard sind alle drei sofort rot.
2. **Canvas-Erzeugungsreihenfolge.** `check_main_slice1.mjs:88-99` bildet Canvas auf Sprite-Namen über die Reihenfolge der `createElement`-Aufrufe ab (`orderedNames = SPRITES + FLIP_LIST + TILE_ART`). Ein Save-Modul darf **kein Canvas erzeugen**, schon gar nicht vor oder zwischen dem Sprite-Bau (`main.js:50-71`). Neue Canvases nach dem Boot landen harmlos in `extra_N`; die Abbildung ist ohnehin schon verschoben (dokumentiert in `GP6_SPEC_REVIEW.md:98`).

**Additiver Raum, konkret:** Save-Rundlauf (`deserialize(serialize(x))` byte-gleich), Vollständigkeit gegen die carry-Liste (`main.js:313-320`), `maxHp` wird NICHT gespeichert sondern abgeleitet, Schema-Version wird abgelehnt bei Unbekanntem, kaputtes JSON führt zu `null` statt zu einer Exception, Loop-Verhalten nach einem 60-Sekunden-Sprung (`loop.js` ist über `raf`/`now` injizierbar, `loop.js:8` — direkt testbar in Node ohne Browser).

---

## PRIORISIERTE ARBEITSLISTE FÜR DIE SPEC

### P0, ohne das ist es kein Handy-Spiel

| # | Arbeit | Datei:Zeile | Aufwand |
|---|---|---|---|
| 1 | **Querformat erzwingen**: Manifest `android:screenOrientation="sensorLandscape"`, iOS `UISupportedInterfaceOrientations`; im Browser Fullscreen + `orientation.lock` am Titel-Tap | Plattformkonfig; Aufhänger `main.js:433-437` | klein |
| 2 | **Save-System**, neues Modul `game/js/items/save.js` (rein, Node-importierbar) + Storage-Guard und Hooks **nur** in `main.js` | Schema aus `main.js:313-320,272-274`; Hooks nach `main.js:374`, `main.js:608-612`, Laden bei `main.js:433-437` | mittel |
| 3 | **Storage-Guard mit `try/catch`**, Startpfad ohne Storage byte-gleich zum Bestand | Beleg `check_main_slice1.mjs:60-67` (kein localStorage im Stub) | klein, aber Pflicht |
| 4 | **Pause-State** bei `visibilitychange`/`pagehide`, mit Auto-Save und Wiedereinstiegs-Bestätigung; `loop.stop()`/`start()` nutzen | `main.js:239` (States), `loop.js:44-46`, heute nur `input.js:254-256` | mittel |
| 5 | **Safe-Area und Button-Ergonomie**: `env(safe-area-inset-bottom)` auswerten, Button A von der Bildschirmkante weg (heute 16 px = 6,1 mm), Lücke A/B von 8,9 px vergrößern | `style.css` (kein env-Treffer), `input.js:75-79` + `hud.js:523-536` müssen zusammen bewegt werden | klein |
| 6 | **Launcher-Icons**: Pixel-Grid in `art/` plus PNG-Renderer in `tools/`, damit CLAUDE.md-Regel 3 gewahrt bleibt | heute null Icons in `game/` | klein |

### P1, spürbar besser auf echter Hardware

| # | Arbeit | Datei:Zeile | Gewinn |
|---|---|---|---|
| 7 | **`buildLut` cachen** (Seed hängt nur an `l.x`/`l.y`) | `lighting.js:263-273`, Aufruf `:323` | gemessen 0,195 von 0,351 ms JS je Frame, minus 26 Allokationen/Frame, pixelgleich |
| 8 | **`runs` als Zahlen-Puffer statt Objekt-Array** (Muster `warmEimer`, das es schon gibt) | `lighting.js:370-376` vs. Vorbild `lighting.js:475,693` | minus ~1600 Objekte/Frame |
| 9 | **Echte Messung auf Michaels Gerät**: Gesamtframe-Zeit, nicht nur `lighting.draw`; Gate relativ wie GP6 | Bestandszahlen aus meiner Probe als Basis; `GP6_PHASE0.md` als Methoden-Vorbild | Grundlage für jede Optimierung |
| 10 | **Halbpixel-Versatz beseitigen**: CSS-Größe UND Position auf das Gerätepixel-Raster runden | `main.js:37-45` + `style.css:18-22` | beseitigt Pixel-Scherung, iPhone 14 Pro: 49,5 Gerätepixel Rand |
| 11 | **Statische States drosseln** (Titel/Game-Over/Inventar auf 30 Hz oder `stop()`) | `main.js:981-1008`, `loop.js:44-46` | Akku |
| 12 | **In-Game-Ersatz für `?god=1`** und "Spielstand löschen", weil Query-Parameter in der App nicht existieren | `main.js:237` | Testbarkeit für Michael |

### P2, Komfort und Absicherung

| # | Arbeit | Datei:Zeile |
|---|---|---|
| 13 | Joystick-Ausschlag konfigurierbar (heute 7,6 mm), optional Linkshänder-Belegung | `input.js:30-31,183-193` |
| 14 | Inventar-Trefferflächen vergrößern (Zeilen 6,1 mm, X-Button 7,6 mm) | `inventory_ui.js:12-19` |
| 15 | `input.touch.active` bei Tastatureingabe zurücksetzen | `input.js:164`, `hud.js:506` |
| 16 | `manifest.json` + `theme-color` für die Browser-Variante | `index.html:3-9` |
| 17 | Eigene Pixel-Schrift statt `8px monospace` (plattformabhängige Breiten) | `hud.js:284,548,572,704-708`, `inventory_ui.js:162` |
| 18 | dpr-Wechsel per `matchMedia` abfangen | `main.js:46-48` |

---

## RISIKEN FÜR DIE SPEC

1. **Höchstes Risiko: ungeguardeter Storage-Zugriff macht drei Flusstests rot.** Die Guards sind Pflichtteil der Spec, nicht Kür. Gemessen belegt: `window.localStorage = undefined` in allen drei Stubs.
2. **Der Titel-Bildschirm hat keine Auswahl-Mechanik** (`hud.js:701-711`, `main.js:433-437`: jeder Tap startet sofort neu). "FORTSETZEN vs NEU" ist echte UI-Arbeit, kein Einzeiler. Wenn die Spec das unterschätzt, wird das Save-System aus Versehen von jedem Tap überschrieben.
3. **Icons brechen die "Grafik als Code"-Regel** (CLAUDE.md Punkt 3). Braucht einen expliziten Entscheid von Michael oder den Renderer-Umweg (P0-6).
4. **Alle GP6-Perf-Zahlen stammen von einem Software-Rasterizer in der VM** (`GP6_PHASE0.md`, Abschnitt 0). Sie sagen über ein Handy nichts aus. Die Spec darf sie nicht als Handy-Budget übernehmen, sondern muss eine Geräte-Messung als eigenes Gate verlangen. GP6 hat die Wackelkandidaten selbst benannt (`uebergaben/2026-08-13_grafikpass6.md`: "bei JEDER Folgeänderung neu messen").
5. **Touch-Geometrie steckt an zwei Orten** (`input.js:75-79` Trefferzonen, `hud.js:523-536` Zeichnung). Wer nur eins der beiden ändert, erzeugt unsichtbare oder untreffbare Buttons. Die Spec muss beide Dateien demselben Besitzer geben.
6. **Truhen füllen sich beim erneuten Betreten neu** (`main.js:298-299,329-339`). Mit einem Save wird dieser Bestandskompromiss von "unauffällig" zu "Gold-Farm durch Speichern/Laden". Es ist keine Regression, aber Michael wird es bemerken. Bewusst deklarieren oder in Slice 4 mit erledigen.
7. **`prog` und `inv` sind geteilte Referenzen** (`main.js:314-315`). Beim Laden muss die Reihenfolge inv/prog, dann `recalcStats()`, dann `hp` exakt eingehalten werden, sonst steht `maxHp` falsch. Die Reihenfolge ist in `main.js:310-312` als "FEST" kommentiert.
8. **Kein Save-Schema-Versionsfeld heute.** Slice 5 (Sound/Polish) und jede Affix-Änderung (`items.js:27-36`) machen alte Stände ungültig. Version von Anfang an, sonst gibt es Abstürze beim ersten Update.

---

## ANGELEGT / BENUTZT (alles wegwerfbar, `game/`, `tools/`, `design/`, `workflows/` unberührt, `git status --porcelain` für diese Pfade leer)

- `/home/coder/Grimlight/.tmp/slice4_probe/count_ops.mjs` — zählt Zeichen-Ops je Frame im echten `main.js`-Fluss, Stub-Muster aus `check_main_slice1.mjs`. Aufruf: `node .tmp/slice4_probe/count_ops.mjs CATACOMBS`
- `/home/coder/Grimlight/.tmp/slice4_probe/touch_probe.mjs` — Touch-Semantik und physische Größenrechnung. Aufruf: `node .tmp/slice4_probe/touch_probe.mjs`
- `/home/coder/Grimlight/.tmp/slice4_probe/light_cost.mjs` — Kostenaufteilung in `lightRuns`/`buildLut`. Aufruf: `node .tmp/slice4_probe/light_cost.mjs`
- Scratchpad `…/scratchpad/corepack_home` (17 MB) — Einmal-Test, ob `corepack npm@10.8.2 --version` ohne Root funktioniert. Ergebnis: ja. Keine globale Installation, `corepack enable` wurde **nicht** ausgeführt.
- **Ports 8123 und 8124 nicht angefasst**, beide bei Abschluss frei (`ss -ltn`).
- Im selben Ordner liegt bereits die Sandbox von Auftrag A (JDK/Android-SDK/Gradle/Capacitor, 2,1 GB, `.tmp/slice4_probe/README.md`). Ich habe daran nichts verändert, nur die README gelesen. Deren Befund ist für die Spec relevant: das APK baut aus `webDir: ../../game`, kalt 2m02s, inkrementell 15s.