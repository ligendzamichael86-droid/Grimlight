# Slice-5 Spec-Review (13.08.2026, wf_2478a9c1-61d)


---

# PRÜFER 1: Tests & Bestand

All probes done, no game file touched, ports free. Here is the review.

---

# ADVERSARIALE SPEC-PRÜFUNG — design/SPEC_SLICE_5.md (Rev 1), HEAD 731c9be
**Linse 1 — Tests & Bestand.** Alle Proben in `/home/coder/Grimlight/.tmp/slice5_probe/{hs,sh,ul,fl}/` (Sandkopien von `game/`, Originale unberührt: `git status --short` leer). Kein Server gestartet.

## BLOCKER

**B1 — §0.2 + §8: Der WebAudio-Adapter in main.js zerschießt den Quelltext-Wächter `S4-§7F(f)`.**
Beleg: `tools/smoke_test.mjs:4854-4858` liest main.js kommentarfrei und prüft
`!/\.stop\(\)/.test(mainCode) && (mainCode.match(/\.start\(\)/g)||[]).length === 1`.
Gemessen (`node -e`): `osc.start(); osc.stop();` ⇒ `stop() vorhanden: true`, `start()-Treffer: 2`. Heute: `.start()` = 1, `.stop()` = 0. §0.2 zwingt den Adapter **ausschließlich** nach main.js, §7.D verbietet die Änderung des Wächters — der Slice läuft in eine unauflösbare Klemme, sobald irgendwo `node.start()` oder `ctx.suspend()`-Nachbarn wie `osc.stop()` klammerlos stehen.
Fix: §0.2 um eine bindende Schreibregel ergänzen: **jeder WebAudio-Node wird ausschließlich mit explizitem Zeitargument gestartet/gestoppt** (`osc.start(t0)`, `osc.stop(t1)`, `src.start(when)`), nie `.start()`/`.stop()` mit leeren Klammern; dazu einen additiven §7.A-Wächter, der genau das in `game/js/**` prüft, damit der Fehler nicht erst am Ende auffällt.

**B2 — §5.1: „4 bei Boss-Treffer" ist zweideutig; die eine Lesart ist messbar tödlich.**
`check_boss_slice3.mjs:253-255` hat **null Frames Spielraum**:
```js
playerRef.hp = 0; playerRef.invulnTimer = 0;
frame();                                   // GENAU EIN Frame
ok(hasText('GAME OVER'), 'Tod in der BOSS_KAMMER → GAME OVER');
```
Ist dieser eine Frame ein Freeze-Frame, läuft `player.update` nicht, `player_died` fällt aus.
Gemessen (`.tmp/slice5_probe/sh`, `S5_PLAYERHIT=1`): **1 Frame Hitstop auf `invulnTimer`-Flanke ⇒ check_boss 2 Assertions ROT** (`Tod in der BOSS_KAMMER → GAME OVER`, `Game-Over-Screen zeigt die Gold-Zoll-Zeile`). Bei 2 Frames identisch rot.
„Boss-Treffer" liest sich als *Spieler trifft Boss* (harmlos, s. B7-Marge) **oder** *Boss trifft Spieler* (= Spieler-Schaden = rot). §5.3 verdrahtet den Flash ausdrücklich auf „Spieler-Schaden/Boss-Aufschlag" — die Vereinheitlichung liegt nahe.
Fix: §5.1 umformulieren auf „**4 Frames, wenn der Spieler den Boss trifft**" und einen expliziten Verbotssatz aufnehmen: **Spieler-Schaden löst NIEMALS Hitstop aus** (nur Flash/Shake). Dazu §7.A-Gate: „ein erzwungener `hp=0` wird im NÄCHSTEN Update-Frame zu `gameover`".

## MAJOR

**M1 — §A3/§5.1: Die Verträglichkeit ist JA — aber die Marge beträgt 1 Frame, und der bindende Test ist nicht check_main.**
Gemessen (`.tmp/slice5_probe/hs`, dritter Freeze-Zweig neben dem Fade, Auslöser = `e.hurtTimer`-Flanke + `enemy_died`, max-Komposition):

| Schwert-Treffer / Kill / Boss | check_main | check_boss | check_inventory |
|---|---|---|---|
| 0/0/0 (Baseline) | grün 25 | grün 33 | grün 25 |
| **2/3/4 (Spec)** | **grün 25** | **grün 33** | **grün 25** |
| 3/4/6 | grün | grün | grün |
| **4/6/8** | grün | grün | **ROT (12 Assertions)** |
| 6/9/12 | grün | ROT (1) | ROT (12) |

Isoliert: Kill K bis 6 grün, Boss B bis 10 grün — **allein der Schwert-Treffer-Wert H kippt: H=3 grün, H=4 rot.** Die 5 Positions-Assertionen von check_main (`:211/:216/:232/:248/:293`) sind bei **keiner** getesteten Konfiguration rot. Der wirklich enge Test ist `check_inventory_slice2.mjs:280` (`for (let f = 0; f < 22 && !dead; f++)`) — 22 Frames Fenster gegen `ATTACK_TOTAL = 0,35 s` = 21 Frames.
Mechanismus (belegt): im Freeze läuft `player.update` nicht, `input.attack` ist aber ein Pegel (`input.js:154`), der von `input.postUpdate()` (`main.js:1048`) trotzdem jeden Frame weiterläuft — ein Ein-Frame-Impuls `keydown/frame/keyup` (Tests: `check_main:180`, `check_inventory:279`) wird im Freeze **verschluckt**. Das trifft auch Michael am Gerät (schneller Doppelhieb).
Fix: §A3 muss **check_inventory_slice2 namentlich** neben check_main nennen; §5.1 den Schwert-Treffer-Wert auf **2 Frames als Obergrenze** festschreiben (nicht „mindestens"); §7.A ein Gate „Angriffs-Pegel überlebt den Freeze" (Eingaben werden im Freeze gepuffert statt verworfen) — sonst schluckt jeder Hitstop den Folgehieb.

**M2 — §5.2: Der Shake stirbt nicht bei Zustandswechsel und schlägt nach dem Respawn zurück. MESSBAR ROT.**
`camera.follow` (`camera.js:14-15`) setzt `this.x/y` **absolut** — ein vor `followPlayer()` addierter Offset ist wirkungslos, nach `followPlayer()` (`main.js:843`) addiert ist er korrekt und wird jeden Tick neu aufgebaut. Aber: `followPlayer()` läuft **nur** im Nicht-Freeze-Zweig `playing`. Verlässt der Zustand `playing`, während der Shake noch läuft (Tod → `gameover`), friert der Restzähler ein und läuft nach dem Respawn weiter.
Gemessen (`.tmp/slice5_probe/sh`, Spec-Rahmen: 2 px, ≤12 Frames, exponentiell, ganzzahlig, Ruhe = 0): **`check_main_slice1:293` ROT — `Zentrum-screen 217` statt 216**, Abstand zum Auslöser 57 Frames. Ein `S5_shakeT = 0; camOff = 0` in `enterState` (`main.js:533`) macht es wieder grün.
Fix: §5.2 ergänzen: Shake-Zustand wird in `enterState` **und** in `buildWorld` hart genullt; die 12-Frame-Grenze zählt Update-Ticks, die im Freeze nicht laufen — deshalb zusätzlich eine Wanduhr-Kappe. §7.A-Gate: „nach `enterState` ist der Offset exakt 0".

**M3 — §A1: Das Gate „JEDES §3-Ereignis hat eine SFX-Zuordnung" ist mit der §2.2-Liste nicht erfüllbar.**
§3.3 fordert u. a. Schritte, Portal blockiert, Pause auf/zu, Boss-Dash/Sweep, Grufthund-Sprung; §3.1/3.2 zusätzlich `inventory_full` (`enemies.js:581`), `potion_full_gold` (`enemies.js:593`), `key_found`/`heart_found`/`weapon_found` (`props.js:77/84/90`). Keiner dieser Klänge steht in der §2.2-Liste — dort fehlt insbesondere ein `step`. „Builder darf sinnvoll bündeln" macht das Gate unfalsifizierbar.
Fix: §2.2 um `step`, `portal_blocked`, `pause_toggle`, `boss_dash`, `hound_jump`, `pickup_generic` ergänzen **oder** §A1 umschreiben auf „die Zuordnungstabelle aus §3 ist vollständig und jede Zeile zeigt auf einen existierenden SFX-Schlüssel; Bündelung ist zulässig, Leerstellen nicht".

**M4 — §4.5: `ctx.suspend()` in `systemPause` feuert im Titel, Inventar, Game-Over und Sieg NICHT.**
`main.js:658-662`: `function systemPause() { if (!player) return; saveNow(); pausiere(); }` und `pausiere()` (`main.js:647-653`): `if (state !== 'playing') return;`. Wird die App im Titel weggewischt (dort läuft nach §9 bereits Musik, sobald einmal getippt wurde), passiert **nichts**. Damit fällt Michaels A4-Checkliste „Ton pausiert beim App-Wechsel" durch — genau der Punkt, den die Landkarte als PFLICHT markiert (Landkarte B 2.4).
Fix: §4.5 präzisieren: `ctx.suspend()` gehört **in die Listener selbst** (`main.js:666-668` visibilitychange, `:674` pagehide), **vor** dem `if (!player) return;`; Gegenstück `resume()` an jeden Gesten-Unlock (§0.3), nicht nur an `wahl === 0`. Außerdem: §4.3 (Ducking, Musik läuft weiter) und §4.5 (suspend) laufen beide über `state === 'paused'` — die Spec muss sagen, dass die Handpause **duckt** und nur der Lifecycle-Pfad **suspendiert**.

**M5 — §7.C: Der sanktionierte Umfang ist undefiniert und trifft die falschen Zeilen.**
Die vom §6.3-Fix berührbaren Bestands-Assertionen, vollständig gelistet:
* `tools/smoke_test.mjs:4531-4533` — Tap (100,30) trifft Zeile 0 (Anker **LIST_Y**)
* `:4535-4537` — Zeile 0 reicht bis y 45 (**ROW_H 20**)
* `:4538-4540` — y 50 liegt in Zeile 1 (**ROW_H**)
* `:4541-4542` — Tap (290,12) schließt (Anker **BTN_CLOSE**)
* `:4543-4544` — X reicht bis (311,33)
* `:4545-4546` — (313,36) schließt nicht
**Nicht** in §7.C, aber genauso betroffen: `tools/smoke_test.mjs:1249-1252` (Tap (100,30) → Cursor 0) und `:1253-1256` (Tap (290,12) → 'close') — Slice-2-Block **ohne** `S4-§7F`-Marker. `inventory_ui.js:23-24` sagt es wörtlich: „LIST_Y und der X-Anker sind TABU (die harten Koordinaten stehen im BESTANDS-Smoke)".
Gegenprobe: `check_inventory_slice2.mjs` fährt das Panel **ausschließlich** über `KeyI` (`:315/:324/:335`) und liest nur fillText-Sonden — **ein LIST_Y-Umbau bricht den Flusstest NICHT.**
Sachlage: `BTN_EQUIP {232,142,72,22}` ist von **keiner** Assertion gedeckt; die Überlappung entsteht aus Zeilen 5 (126..146) und 6 (146..166) gegen 142..164, und `inventory_ui.js:103` gibt ANLEGEN im Tap-Hittest **Vorrang vor der Zeilenauswahl** — das ist der eigentliche Defekt.
Fix: §6.3 auf „**nur BTN_EQUIP wird verschoben, LIST_Y/ROW_H/BTN_CLOSE bleiben**" festnageln (dann ist §7.C **leer** und §7.B die einzige Sanktion) — oder §7.C explizit um `smoke:1249-1256` erweitern. So wie es dasteht, ist der Builder gezwungen, eine unsanktionierte Zeile rot zu machen (§7.D-Verstoß).

**M6 — §5.4: Der „eigene 40er-Budget"-Satz ist gegen `smoke:2186` nicht haltbar.**
`tools/smoke_test.mjs:2185-2186` ruft 300× `spawnEmbers` und prüft `parts.list.length === 60` **exakt**. `particles.js:27` `MAX_PARTICLES = 60` ist ein **globaler** Deckel auf `list` (`particles.js:155` `if (list.length >= MAX_PARTICLES) return;`). Wird der Deckel für die Bursts auf 100 angehoben, geht die Assertion rot; bleibt er bei 60 und teilen sich Bursts und Glut dieselbe Liste, verhungern die GP6-Glutfunken bei jedem Treffer-Burst.
Fix: §5.4 auf „**zweite, getrennte Liste `burstList` mit eigenem Deckel 40; `MAX_PARTICLES = 60` und `spawnEmbers` bleiben unverändert**" präzisieren; `draw`/`update` bearbeiten beide Listen.

**M7 — §3.3: Der props-Scan-Beobachter sprengt einen Regex-Wächter.**
`tools/smoke_test.mjs:4772-4773` prüft
`/for \(let i = 0; i < props\.length; i\+\+\)[\s\S]{0,400}?runFlags\.openedChests\.push\(k\)/` gegen main.js **ohne Kommentare**. Gemessen: das Fenster ist heute **279 Zeichen lang, Reserve 121 Zeichen**. §3.3 verlangt Vase/Truhe „über den props-Scan" (`main.js:835-840`) — jeder Ton-Code **innerhalb** dieser Schleife frisst die Reserve auf.
Fix: §3.3 ergänzen: der Vasen-/Truhen-Beobachter läuft in einer **eigenen, zweiten** Schleife über `props`, direkt nach dem Bestandsblock — die Bestandsschleife bleibt zeichenidentisch.

**M8 — §2/§8: `mixer.js` fehlt, damit hat §A1 „Settings-Roundtrip" keinen prüfbaren Ort.**
§2 listet nur `chiptune.js`, `sfx.js`, `songs/*.js`; §8 Phase 1 wiederholt das („audio/** komplett: chiptune.js, sfx.js, songs/*.js"). §6.2 legt die Persistenz über `storeLesen`/`storeSchreiben` in **main.js** — und main.js ist nicht Node-importierbar (`smoke_test.mjs:3301`). Die Landkarte hatte `mixer.js` als reinen Reducer ausdrücklich vorgesehen (Landkarte A §4).
Fix: `game/js/audio/mixer.js` (reiner Reducer: `defaultSettings()`, `parseSettings(rohString)`, `serializeSettings(s)`, `toggle(s, key)`) in §2 und §8 aufnehmen; main.js reicht nur den String durch. Vorbild: `save.js:1-5`.

**M9 — §A1: Die Clipping-Schranke misst den falschen Wert.**
„renderPCM-Peak ≤ 0,9 über alle Songs+SFX" bindet jeden Klang **einzeln**. Michael hört die **Summe**: 4 Musikkanäle plus bis zu 12 gleichzeitige SFX-Stimmen (A1-Stimmenobergrenze). Bei je 0,9 clippt die Summe garantiert — genau der A4-Punkt „nichts nervt/übersteuert". Zudem: `renderPCM` ist in §2.1 als `renderPCM(song)` definiert; für SFX existiert kein Rendering-Pfad, das Gate ist für die Hälfte seines Geltungsbereichs unausführbar.
Fix: §A1 auf zwei Gates aufteilen: (a) Einzel-Peak je Song ≤ 0,7 und je SFX ≤ 0,5, gemessen über eine gemeinsame `renderPCM({instruments, events})`-Signatur, die Songs UND SFX rendert; (b) **Summen-Gate**: Musik-Bus + 12 gleichzeitige Worst-Case-SFX über einen Master-Gain ≤ 0,9. §5.5/§4 um einen expliziten Master-Gain-Knoten ergänzen.

## MINOR

**m1 — §0.3: Die exakte, gemessene Guardform.** `input.attach` wird an genau **einer** Produktivstelle gerufen (`main.js:242`) und sonst nur mit **einem** Argument (`tools/smoke_test.mjs:4333`, `.tmp/probe_s4_engine.mjs:58`, `.tmp/dev_a_input.mjs:51`; `.tmp/check_lighting_input_slice1.mjs:84` ist bereits vor Slice 5 tot — `MODULE_NOT_FOUND` am Bestand). Ein zweiter Parameter bricht nichts. Der Satz „alte Aufrufe byte-gleich" stimmt für alle **außer** `main.js:242`, das sich zwangsläufig ändert — Formulierung anpassen.
Gemessen grün (`.tmp/slice5_probe/ul`: check_main 25, check_boss 33, check_inventory 25, check_save_slice4 48, Smoke GRÜN) mit exakt dieser Form:
```js
// input.js
function attach(canvasElement, onFirstTouch) {
  ...
  if (typeof onFirstTouch === 'function') {
    canvas.addEventListener('touchstart', () => { try { onFirstTouch(); } catch { /* inert */ } }, opts);
  }
  canvas.addEventListener('touchstart', onTouchStart, opts);   // Bestand unverändert
```
```js
// main.js — window-keydown-Unlock, wirft in check_main:117-119 nicht und ändert nichts
let audioCtx = null;
function audioUnlock() {
  try {
    const AC = (typeof window !== 'undefined' && window)
      ? (window.AudioContext || window.webkitAudioContext) : null;
    if (typeof AC !== 'function') return;        // Node/Stubs: vollständig inert
    if (!audioCtx) audioCtx = new AC();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch { /* inert */ }
}
try {
  if (typeof window !== 'undefined' && window
    && typeof window.addEventListener === 'function') {
    window.addEventListener('keydown', () => { try { audioUnlock(); } catch { /* inert */ } });
  }
} catch { /* inert */ }
```
Bindend daran: `typeof AC !== 'function'` **vor** jedem `new`, kein Zugriff auf `event.*`, Rückgabe `undefined`, äußeres try um `addEventListener`.

**m2 — §5.2: Wo genau, mit welcher Rundung.** Offset **unmittelbar nach `followPlayer()` in `main.js:843`**, `camera.x += offX; camera.y += offY;` mit `offX/offY ∈ ℤ`. Exaktheit ist beweisbar: `playerScreen()` (`check_main:127-139`) misst `Math.round(worldX − cam.x)`; für ganzzahliges k gilt `Math.round(a − (b+k)) = Math.round(a − b) − k`, die Messung ist also um **genau** k versetzt und bei k = 0 bitgleich zum Bestand. Nicht-ganzzahlige Offsets verletzen das. Zusätzlich: der Offset wird **nach** der Weltrand-Klemmung (`camera.js:12-15`) addiert und kann die Kamera über den Kartenrand schieben — §5.2 sollte eine Nach-Klemmung auf `[0, worldW−viewW]` vorschreiben.

**m3 — §5.2: Die „24 Frames" der Landkarte sind zu pessimistisch, die echten Abstände sind viel größer.** Gemessen (`.tmp/slice5_probe/sh/t/probe_abstand.mjs`, Frame-Zähler global): in check_main feuern über den ganzen Lauf **2** Schwert-Treffer-Shakes; die Abstände zu den fünf Positions-Assertionen betragen **136 / 476 / 640 / 670 / 757 / 1021 Frames**. Kontrollprobe (Offset dauerhaft, nie abklingend): **5 Assertionen ROT** — die Sonde ist also scharf. Ein Shake ≤ 12 Frames hat damit ~11× Reserve; die Gefahr liegt **allein** im Einfrier-Loch aus M2, nicht in der Abklinglänge.

**m4 — §5.3 ist bewiesen unkritisch.** Probe `.tmp/slice5_probe/fl`: Vollbild-`fillRect(0,0,320,180)` mit `fillStyle = 'rgba(255,244,220,0.18)'` bei `globalAlpha = 1`, gezeichnet **nach** `lighting.draw` (`main.js:1395`) und vor `particles.draw`, **jeden Frame dauerhaft an** ⇒ check_main 25 / check_boss 33 / check_inventory 25 grün. `fadeAlpha()` (`check_main:158-163`) verlangt `fillStyle === '#000'`, `ambientAlpha()` (`:154-157`) nur Nicht-Haupt-Canvas — beide bleiben stumm. `istFadeZug` im Smoke (`:4083-4084`) ebenso.

**m5 — §6.1: Die Pause-Geometrie ist verträglich, aber „Unterkante ≤ 172" erzeugt eine neue Kollision.** `MM_PRO_PX = 0,3764` (`smoke:4047`) ⇒ `h ≥ 6 mm` bedeutet `h ≥ 16 px`. Fünf Zonen à 16 px passen **ohne Panelwachstum** in den Bestand: y 66/82/98/114/130, Unterkante 146 < Panel-Unterkante 150 (`hud.js:789`). Mit der heutigen Rasterung (h 18, Lücke 4) braucht man 106 px und landet bei Unterkante 172 — dort zeichnet `drawFps` (`hud.js:822-826`) seine zwei Zeilen bei y 158/168, und zwar **zuletzt und über der Pause** (`main.js:1442-1448`), festgenagelt durch `smoke:4618-4619` (`o.y >= 150 && o.y <= 175`). Empfehlung: Unterkante ≤ **150** statt 172, Panel bleibt wie es ist.

**m6 — §6.1/§7.B: Der sanktionierte Diff ist zu eng gefasst.** In `smoke:4564-4570` steckt mehr als die Drei: `:4566` prüft `z.y+z.h <= 180` (nicht 172), `:4567` die 6 mm, **`:4568-4569` prüfen Nicht-Überlappung nur für die Zonen 0/1/2** — mit 5 Zonen blieben 3 und 4 ungeprüft, obwohl §6.1 „keine Überlappung" für alle fordert; und der Prüftext `:4564` („3 getrennte Zonen") würde lügen. Fix: §7.B auf „`:4564-4570` vollständig: Anzahl 3→5, Text angepasst, Nicht-Überlappung als Schleife über alle Zonen".
Nicht betroffen (geprüft): `:4584-4588` (WEITER/GOTT/FPS-Texte), `:4590-4601` (Auswahlbalken mit `cursor: 2` → `PAUSE_MENU_ZONES[2]`, `w/h` aus Zone 0) bleiben mit 5 Zonen grün, solange alle Zonen dieselbe `w`/`h` tragen und die Reihenfolge **angehängt** statt eingeschoben wird.

**m7 — §6.1: Cursor/Tap tragen 5 Einträge ohne Änderung; check_save_slice4 ist unbetroffen.** `main.js:993` iteriert `PAUSE_MENU_ZONES.length`, `:1004` klemmt auf `length - 1` — beides automatisch. GOTT bleibt Index 1, FPS Index 2, MUSIK/TON werden 3/4 angehängt, also verschiebt sich nichts. `tools/check_save_slice4.mjs` benutzt die Pause nur über `Escape` (`:253`) und drei Text-Sonden (`:228`, `:229`, `:261`, `:362`) — kein Index, keine Zone. Gemessen: 48 Assertionen grün in allen Proben. Bindend in die Spec schreiben: **neue Einträge werden angehängt, 0/1/2 sind eingefroren**; `wahl === 3/4` brauchen wie `:1011/:1018` ein `input.consumeConfirm()`.

**m8 — §3: Alle Beobachter-Felder existieren mit den genannten Namen.** `player.attackId` (`player.js:75`, erhöht `:143`), `player.invulnTimer` (`:72`, gesetzt `:192`), `player.animTimer` (`:73`), `e.hurtTimer` (`enemies.js:43`, gesetzt `:467`), `inventoryUI.cursor` (`inventory_ui.js:62`) — alle öffentlich auf dem Objektliteral, main.js liest `player.animTimer` bereits (`main.js:1021`). Zwei Feinheiten: (a) die Schritt-Formel `Math.floor(animTimer*10)%4` steht in `player.js:221` **innerhalb** von `spriteFor` und ist nicht exportiert — main.js müsste sie duplizieren; §3.3 sollte einen Export `player.walkFrame()` oder ein Feld `player.animFrame` fordern, sonst driftet der Schritt-Ton bei jeder Sprite-Änderung. (b) `e.hurtTimer` unterscheidet **nicht** zwischen Schwert und Bumerang — der `sword_hit`-Ton spielt auch beim Bumerang-Treffer; §3.3 braucht die Zusatzbedingung `e.hitAttackId === player.attackId`.

**m9 — §7.A/§0.4: Marker-Bezeichner sind in sich widersprüchlich.** §0.4 und §7.A schreiben `S5-§7F(a)…`, §7.B/§7.C aber `S5-§7B`/`S5-§7C`. Ein „F" gibt es in §7 nicht (der Bestand hatte `S4-§7F`, weil dort §7 F hieß). Vereinheitlichen auf `S5-§7A(a)…`. — Zu den Importen: doppelte `await import`-Aufrufe desselben Moduls sind im Smoke **Bestand und unkritisch** (`save.js` 2×, `lighting.js` 2×, `tilemap.js` 2×) — der Modul-Cache liefert dieselbe Instanz, und alle drei sind rein bzw. Fabriken. Das gilt **nur**, solange die neuen Audio-Module keinen Modul-Zustand halten: die A1-Stimmenobergrenze („≤ 12, älteste fliegt") ist Zustand. Fix: §2.2 auf **Fabrikform** verpflichten (`createSfxBus()` wie `createParticles`/`createLighting`), nie ein Modul-Singleton — sonst lecken Stimmenzähler zwischen Smoke-Blöcken.

**m10 — §A3: Die Rig-Schalter greifen an keinem existierenden Messlauf.** `.tmp/shot_gfx6.py:553-555` setzt seine Schalter explizit zurück (`__noLight`, `__noTint`, `__noFog`, `__noVignette`, `__noOver`, `__noCanopyShadow`) — `__noShake/__noFlash/__noAudio` kommen dort nicht vor, sie stehen also im GP7-Messlauf auf **aus = Effekt aktiv**. Muster für den Zugriff ist korrekt und ungeguardet zulässig (`main.js:1307` `const noTint = !!window.__noTint;`). Fix: §A3 muss die Rig-Ergänzung in `.tmp/shot_gfx6.py:553-555` als Liefergegenstand nennen (die Datei fällt nicht unter §7.D).

**m11 — §2.2: „~16 SFX" gegen 23 aufgezählte Namen** — die Zahl im Fließtext widerspricht der eigenen Liste; A1 zählt gegen die Liste. Zahl streichen oder angleichen.

**m12 — Faktenbasis stimmt nicht.** Die Landkarte nennt „558 + 48 Assertionen" (`SLICE5_LANDKARTE.md:25`, `:136`) und in der Tabelle §5 „26 / 26 / 34" für check_main/check_inventory/check_boss. Gemessen am Bestand: **Smoke 647**, check_main **25**, check_inventory **25**, check_boss **33**, check_save_slice4 48. Da §A2 die Landkarte für bindend erklärt, sollten die Zahlen korrigiert werden, bevor jemand daran eine Abnahme aufhängt. Nebenbefund: der Smoke ist **nicht lauf-deterministisch** (`Simulierte Ticks gesamt` 7615 vs. 7654 in zwei Läufen desselben Bestands) — Tick-Zahlen taugen nicht als „byte-gleich"-Beleg.

**m13 — §8 Phasenschnitt:** Der ENGINE-Agent ändert `hud.js` (PAUSE_MENU_ZONES) und `ui/inventory_ui.js`, die zugehörigen Sanktionen §7.B/§7.C macht aber erst der INTEGRATOR in Phase 2. Zwischen den Phasen ist die Suite konstruktionsbedingt rot und ENGINE kann sich nicht selbst verifizieren. Entweder §7.B/§7.C dem ENGINE-Agenten mitgeben oder in §8 ausdrücklich „Phase 1 endet rot" deklarieren. Ebenso fehlt in §8 der eingefrorene Schnittstellenvertrag zwischen AUDIO-KERN (`game/js/audio/**`) und ENGINE (`main.js`) — beide laufen parallel, main.js importiert Module, die es noch nicht gibt.

---

**Bilanz:** Die zwei riskantesten Zutaten sind gemessen unbedenklich — Hitstop 2/3/4 und Shake 12 F/2 px und Flash lassen alle drei kanonischen Flusstests (25/33/25) und `check_save_slice4` (48) grün —, aber die Spec sichert die falschen Ränder ab: sie nennt check_main statt des tatsächlich engen `check_inventory_slice2:280` (1 Frame Marge), lässt den Shake bei Zustandswechsel stehen (`check_main:293` messbar rot), erlaubt per zweideutigem „Boss-Treffer" einen Spieler-Schaden-Hitstop, der `check_boss:255` mit **null** Frames Spielraum killt, und schickt den WebAudio-Adapter mit `.start()/.stop()` gegen den main.js-Quelltext-Wächter `smoke:4854-4858` — dazu ein leerer §7.C-Sanktionsumfang, ein fehlendes `mixer.js` und ein Event-Abdeckungs-Gate, das die eigene SFX-Liste nicht erfüllt.


---

# PRÜFER 2: Audio/WebView/Game-Feel

**LINSE 2 — AUDIO/WEBVIEW/GAME-FEEL-MACHBARKEIT. Prüfling: design/SPEC_SLICE_5.md Rev 1, HEAD 731c9be.**
Proben in `/tmp/claude-1000/-home-coder/2135f5db-b185-41ca-95a9-9bd4f9302d40/scratchpad/` (`mess_peak.mjs`, `actx.html`+`run_actx.py`, `actx2.html`+`run_actx2.py`). Keine Spieldatei berührt (`git status --short` leer), kein Port belegt (Messungen über `file://`), Playwright aus `/home/coder/Grimlight/.tmp/venv`.

---

## BLOCKER

**B1 — §1 A1 Peak-Gate misst das Gegenteil dessen, was es soll (Prototyp-`tanh` verdeckt genau das Clipping).**
Beleg: `.tmp/slice5_probe/chiptune.js:99` `for (let i=0;i<n;i++) out[i]=Math.tanh(out[i]);`. Gemessen (`mess_peak.mjs`, SONG_KATAKOMBEN): linearer Roh-Peak **0,7961**, nach tanh **0,6619**. Ein Gate „renderPCM-Peak ≤ 0,9" auf der tanh-Ausgabe entspricht einem Roh-Peak von **atanh(0,9) = 1,4722**, also **+47 % Übersteuerung** — und die WebAudio-Laufzeit (§0.5 Option a) hat kein tanh, dort ist das hartes Clipping (Knacken). Zusätzlich: `tanh(x) < 1` für alle x, das Gate ist gegen den Fall, für den es existiert, **prinzipiell unverletzbar**.
Fix: renderPCM gibt den **Roh-Peak vor** der Sättigung zurück (`{pcm, peakRoh}`); A1 gated auf `peakRoh ≤ 0,9` und rechnet die Laufzeit-Busgewinne (musicBus × master, s. B3) mit hinein. tanh bleibt nur für die Prüfsumme.

**B2 — §4.5 „systemPause → suspend()" greift auf dem Titelbild nicht: `if (!player) return`.**
Beleg: `main.js:658-662` `function systemPause(){ if (!player) return; saveNow(); pausiere(); }`; `player` ist `main.js:322` `null` und wird **nur** in `buildWorld` gesetzt, das ausschliesslich aus `main.js:514/529/814/1030` gerufen wird — **nie im Boot-Pfad**. Auf dem Titel ist `player === null` ⇒ `visibilitychange`/`pagehide` (`main.js:666/674`) laufen ins Leere ⇒ **kein `ctx.suspend()`**. Titelmusik ist per §2.3/§4.3 vorgesehen und per §9 nach der ersten Geste hörbar (Tap auf die Menü-Navigation reicht, `main.js:781-788`). Michael tippt im Titel, wechselt die App — die Musik läuft weiter. Das ist wörtlich sein A4-Prüfpunkt „Ton pausiert beim App-Wechsel". Verschärfend: `currentTime` läuft dabei weiter (gemessen, B5) ⇒ beim Zurückkommen zusätzlich der Nachhol-Knall.
Fix: Audio-Lifecycle **vor** den `!player`-Guard hängen — eigener Hook in den bestehenden `visibilitychange`/`pagehide`-Listenern (`audioSuspend()` unabhängig von `systemPause()`), Gegenstück an `document.hidden === false` **und** an `main.js:772`/`:1008`.

**B3 — §4.3 „SFX stumm" in paused/inventory macht die neuen §6.1-Schalter unhörbar (Spec-interner Widerspruch).**
Beleg: §4.3 „paused+inventory = DUCKING (Musik −10 dB, **SFX stumm**)" gegen §2.2 (`menu_move`, `menu_confirm`) und §3.3 „Menü-Navigation (Titel/**Pause**/Inventar), Pause auf/zu". Das Pause-Menü ist der einzige Ort der §6.1-Schalter; mit `MUSIK: AUS` gibt es dann **null** akustische Rückmeldung. A4-Prüfpunkt „Schalter im Pause-Menü wirken" ist per Ohr nicht abnehmbar.
Fix: Drei-Bus-Architektur festschreiben (s. M3): `musicBus` / `sfxBus` (Welt) / `uiBus`. „SFX stumm" gilt **nur für `sfxBus`**; `uiBus` wird nie geduckt und nie vom Pause-Zustand gemutet. Regel für `TON: AN→AUS`: Bestätigungston **auf dem alten Pegel** spielen, Mute **danach** setzen (sonst ist das Ausschalten selbst rückmeldungsfrei).

**B4 — §4/§0.6 „Sequencer auf der AudioContext-Uhr mit Lookahead" ohne eine einzige Zahl und ohne Resync-Regel; `currentTime` läuft bei Main-Thread-Stall weiter.**
Gemessen (`actx.html`): `suspend()` **friert `currentTime` ein** (`suspendDelta = 0` über 600 ms Wartezeit; `stateNachSuspend = "suspended"`, danach `nachResumeDelta = 0,3019`). Aber bei **blockiertem Main-Thread** läuft sie voll weiter: `blockDelta = 0,4992` bei 500 ms Busy-Loop. rAF steht dabei ⇒ `update()` steht ⇒ das Lookahead-Fenster wird nicht nachgefüllt. Die Spec nennt weder Fenstergrösse noch Nachfüll-Intervall noch das Verhalten bei `loop.js:37` `if (n === MAX_UPDATES) acc = 0` (Rest wird **verworfen**, `MAX_UPDATES = 5`, `MAX_DELTA = 0,25`) noch beim Rücksprung. Folge ohne Regel: erst Stille (Fenster leer), dann schedult die übliche `while (nextNoteTime < currentTime + lookahead)`-Schleife alle verpassten Noten mit Startzeiten **in der Vergangenheit** → WebAudio startet sie alle sofort → Cluster-Knall. Bei 6,7 Noten/s (gemessen) sind das nach 3 s Stall 20 Noten gleichzeitig, nach dem B2-Fall (Titel, App im Hintergrund) beliebig viele.
Fix, bindend in die Spec: (1) Lookahead **0,10 s**, Nachfüllung **jeden `update()`-Tick** (60 Hz = 16,7 ms ≪ 100 ms, überlebt 5 verworfene Ticks); (2) Scheduler hält `nextNoteTime` in **AudioContext-Sekunden**, nie in `timeSec`; (3) **Resync-Regel**: `if (nextNoteTime < ctx.currentTime - 0.05) { nextNoteTime = ctx.currentTime; rowIndex = Reihe, die zu (currentTime − songStart) mod loopLen gehört; }` — nachholen ist verboten, es wird auf die nächste Reihengrenze **gesprungen**; (4) `songStart` bei jedem `resume()` um die Suspend-Dauer nachziehen.

**B5 — §2.3 „Loop-fähig (loopFrom)" hat keine Implementierungsfläche: `compileSong` liefert `loopFrom` nicht aus.**
Gemessen: `Object.keys(compileSong(S))` = `events,dauer`, `'loopFrom' in compileSong(S)` = **false** (`.tmp/slice5_probe/chiptune.js:51` `return { events: ev, dauer: ... }`). `loopFrom: 0` im Datenmodul wird nirgends gelesen. Ausserdem ist `dauer = reiheGlobal * sekProReihe` — eine Note, die über das letzte Raster hinausragt, wird in renderPCM abgeschnitten (`:76 if (p >= n) break`) und am Loop-Punkt hart gekappt (Klick). Semantik von `loopFrom` (Reihenindex? Order-Index? Sekunden?) ist weder in Landkarte noch Spec definiert. Alle 6 Songs loopen ⇒ die Naht ist das Erste, was Michael hört.
Fix: `compileSong` gibt `{events, dauer, loopStart, loopLen}` zurück; `loopFrom` **als globaler Reihenindex** definieren, `loopStart = loopFrom * sekProReihe`, `loopLen = dauer − loopStart`; Noten, die über `dauer` hinausragen, werden auf `dauer` gekürzt (Tracker-Semantik) und der Scheduler plant nahtlos `t + k*loopLen`. Node-Gate: „letztes Ereignis endet ≤ dauer" + „loopStart < dauer".

---

## MAJOR

**M1 — §2 lässt `mixer.js` weg; drei der sechs A1-Gates haben damit keinen reinen Prüfling.**
Beleg: Landkarte §4 (`SLICE5_LANDKARTE.md:120-121`) listet `mixer.js REINER Reducer für Lautstärke/Stumm (Muster save.js:244 titleMenuStep)`; §2 der Spec nennt nur `chiptune.js`, `sfx.js`, `songs/*.js`. A1 fordert aber „Stimmen-Obergrenze eingehalten (≤ 12, älteste fliegt)" und „Settings-Roundtrip (auch ohne Storage)" als **Node-Gates**. Sitzt der Stimmen-Allokator bzw. der Settings-Reducer im main.js-Adapter, ist beides headless nicht prüfbar (smoke importiert main.js nicht; `check_save_slice4` fährt es nur über `?boot=N`).
Fix: `game/js/audio/mixer.js` wieder aufnehmen — reiner Reducer für {musicOn, soundOn} inkl. `parse`/`serialize` für §6.2 **und** die Stimmenverwaltung als reine Datenstruktur (`allocVoice(state, id, t) → {state, evicted}`). Der Adapter führt nur aus.

**M2 — §2.1 FX `s` (Slide) ist neu und semantisch undefiniert: das Zellformat hat kein Ziel-Feld.**
Beleg: Zellformat `"NOTE:INSTR:LÄNGE:FX"` (§2.1, Landkarte:93); der Prototyp implementiert nur `v` und `a` (`chiptune.js:83` Vibrato, `:85-88` Arpeggio) — `s` existiert nicht. Ein Slide braucht ein Ziel (Portamento von der Vornote? absolute Zielnote? Halbtöne?). Ohne Definition liefern WebAudio-Backend (`frequency.linearRampToValueAtTime`) und renderPCM (Per-Sample-`f`) garantiert unterschiedliche Ergebnisse, und das A1-Determinismus-Gate vergleicht nichts Aussagekräftiges.
Fix: `s` als **Portamento von der vorhergehenden Note desselben Kanals** definieren (kein Ziel-Feld nötig, keine Formatänderung); `compileSong` schreibt `fromFreq` in das Ereignis; Aufwand: ~15 Zeilen in `compileSong` + je 5 in beiden Backends. Ausserdem festlegen, ob FX kombinierbar sind (der Prototyp benutzt `.includes()`, `"va"` funktioniert also unbeabsichtigt).

**M3 — §4 hat keine Graph-/Bus-Architektur; Crossfade §4.2 und Ducking §4.3 sind ohne sie nicht baubar.**
Beleg: Spec nennt nirgends GainNodes. §4.2 verlangt Crossfade 0,3 s (Portal) und ~0,25 s Blende auf `resetRun`/`ladeSpielstand`/Respawn; mit **einem** musicBus ist ein Crossfade physisch unmöglich. Entwarnung zur Knotenfrage: mit 0,10 s Lookahead hat der abgehende Song beim Umschalten nur **~0,7 Noten** in der Warteschlange (6,7 Noten/s gemessen) — „alle Noten beider Songs parallel" ist **falsch**, der Crossfade kostet praktisch nur einen zweiten Bus.
Fix in die Spec: `master → {musicBus → {songA, songB}, sfxBus, uiBus}`; Crossfade = `songA.gain` linear auf 0 / `songB.gain` linear auf Ziel über 0,3 s, danach `osc.stop()` + `disconnect()` auf allen Restknoten von A; Ducking wirkt auf `musicBus`, Pause-Mute auf `sfxBus`, `uiBus` bleibt frei; `master` trägt den Pegel, der in das B1-Peak-Gate eingeht. Pflicht: `osc.onended = () => {gain.disconnect(); ref=null}` — bei 15,4 Knoten/s (gemessen) sammeln sich sonst in 20 Minuten ~18 500 gehaltene Knoten.

**M4 — §4.3 „−10 dB" ohne Rampenform: die naive WebAudio-Rampe kehrt sich nachweislich ins Gegenteil um.**
Gemessen (`actx2.html`, OfflineAudioContext, echte Samples): Duck `setValueAtTime(1,0)` + `linearRampToValueAtTime(0.3162, 2.0)`, danach — ohne Neu-Anker — Unduck `linearRampToValueAtTime(1.0, 0.7)`. Ergebnis: **t=0,01→1,0 · t=0,5→1,0 · t=0,69→1,0 · t=0,71→0,9947 · t=1,0→0,8422 · t=1,99→0,3215**. Das Ducking findet 0,7 s lang **gar nicht statt** und läuft **danach trotzdem** auf −10 dB durch und bleibt dort. Mit korrektem Anker (`cancelScheduledValues(t)` + `setValueAtTime(momentanwert, t)`): **0,5→0,8291 · 0,6→0,9145 · 0,71→1,0** (richtig). Realfall: Pause auf, nach 0,2 s wieder zu — Musik duckt danach weg und bleibt leise. Zusätzlich gemessen: `exponentialRampToValueAtTime(0, …)` wirft **RangeError** (Mute-Pfad!); `−10 dB = linearer Gain 0,3162` (die Spec sagt „−10 dB", ein Bauer schreibt leicht 0,9).
Fix, wörtlich in die Spec: jede Pegeländerung als `p.cancelScheduledValues(t); p.setValueAtTime(p.value, t); p.linearRampToValueAtTime(ziel, t + d);` — **nie** exponentiell auf 0; Duck-Ziel `0.3162`, Rampe 0,08 s rein / 0,15 s raus.

**M5 — §0.3/§4.5: `resume()` liefert ohne Nutzeraktivierung ein Promise, das nie erfüllt wird.**
Gemessen (`actx2.html`, `--autoplay-policy=document-user-activation-required` = Desktop-Chrome = Michaels 8123-Test): `state0_strict = "suspended"`, `resumePromiseErfuellt_nach800ms = **false**`, `state_nach_800ms = "suspended"`. Ein `await ctx.resume()` blockiert den umgebenden async-Pfad dauerhaft (mein erster Messlauf lief genau deswegen in den Timeout). Ein „unlocked"-Flag, das im `.then()` gesetzt wird, wird **nie** gesetzt — auch nicht nach einer späteren echten Geste.
Fix: `resume()` **nie awaiten**, kein `.then()`-Flag; `resume()` bei **jeder** Geste erneut rufen, solange `ctx.state !== 'running'`; der „freigeschaltet"-Zustand wird ausschliesslich aus `ctx.state` gelesen.

**M6 — Puls-Duty: `createPeriodicWave` kostet ~1 ms pro Aufruf — pro Note gebaut ist das Spiel tot.**
Gemessen (`actx2.html`): `createPeriodicWave` **8 Harm. 1,004 ms · 16 Harm. 0,886 ms · 32 Harm. 0,977-1,068 ms · 64 Harm. 4,1-10,0 ms**; dagegen `setPeriodicWave` mit **gecachter** Welle **0,0134-0,0694 ms**, `osc.type='square'` 0,0168-0,0702 ms. Faktor **15-75**. Die Landkarte-Zahl „Oszillator + PeriodicWave 0,031 ms" gilt für eine wiederverwendete Welle; die Spec sagt zum Caching nichts, und §2.1 fordert `duty` pro Instrument. Bei 6,7 Noten/s wären das ~6,7 ms/s ungedrosselt, bei 6x-Drossel ~40 ms/s = 2,4 ms je Frame nur für Wellentabellen.
Fix: pro **distinktem duty-Wert** genau eine `PeriodicWave` beim Adapter-Init bauen und in einer Map halten (`duty → wave`); duty-Werte in `songs/*.js` auf eine kleine feste Menge {0,125 / 0,25 / 0,5} beschränken; 32 Harmonische als Obergrenze (64 kostet das Vier- bis Zehnfache).

**M7 — §5.2 „camera.x/y-Offset nach follow()" trifft die Freeze-Zweige nicht — Shake driftet und kippt die A3-Assertions.**
Beleg: `followPlayer()` steht in `main.js:843`, also **im `else`-Zweig** von `main.js:809` (`if (fadePhase !== 'none') {…} else {…}`). Im Fade läuft es nicht — und der §5.1-Hitstop soll als **dritter Freeze-Zweig** genau dorthin. Shake und Hitstop feuern per §5.1/§5.2 aus **demselben** Ereignis (Schwert-Treffer: 2 Frames Freeze + Shake). Wird der Shake als `camera.x += s` nach follow() gebaut, akkumuliert er in jedem Freeze-Frame ⇒ dauerhafter Kamera-Versatz ⇒ `.tmp/check_main_slice1.mjs:211/216/232/248/293` (`playerScreen()` misst `worldX − cam.x`, `:127-139`) werden rot. `camera.js:11-16` `follow()` überschreibt x/y absolut, ist also die einzige Rücksetzquelle.
Fix: Shake als **absoluter Nachschlag auf einen gemerkten Basiswert** — `camBaseX/Y` beim letzten `follow()` speichern, jeden Frame (auch im Freeze) `camera.x = camBaseX + Math.round(shakeX)` setzen; `shakeX = 0` bei `shakeT <= 0`, harte Grenze 12 Frames; §5.2 muss zusätzlich sagen, dass der Shake **auch während Fade und Hitstop** aktualisiert wird.

**M8 — §3/§0.6 legen den Ort des Audio-Ticks nicht fest; ausserhalb des `else`-Zweigs feuert jedes Event 2-5 mal.**
Beleg: `events.length = 0` steht **innerhalb** des Nicht-Fade-Zweigs (`main.js:822`), der Toast-Block ebenfalls (`main.js:858-877`, 6er-Einrückung). §0.6 sagt nur „Der Audio-Tick läuft in `update()`" — das lädt dazu ein, den Beobachter-Block **hinter** das `if/else` zu legen. Dann behält `events` während Fade **und** Hitstop den Inhalt des letzten aktiven Frames und wird 2-4 mal (Hitstop) bzw. 36 mal (Fade 0,3 s) erneut ausgewertet. Umgekehrt bedeutet die Platzierung im `else`-Zweig, dass der Treffer-SFX erst **nach** dem Hitstop klingt (2-4 Frames = 33-66 ms) — oben auf die Ausgabelatenz der Android-WebView.
Fix: Beobachter-Block **innerhalb** des `else`-Zweigs, unmittelbar nach `updateDrops` (`main.js:841`) und **vor** dem Setzen des Hitstop-Timers; §5.1 ergänzen: „der Hitstop wirkt ab dem **nächsten** Tick, der auslösende Frame spielt SFX und Partikel noch zu Ende".

**M9 — §5.4 `spawnBurst` mit „eigenem Budget (40)" auf derselben Liste hungert `spawnEmbers` aus.**
Beleg: `particles.js:155` `if (list.length >= MAX_PARTICLES) return;` — der Deckel sitzt auf der **gemeinsamen** `list`, `MAX_PARTICLES = 60` (`particles.js:27`). Das Gate `smoke_test.mjs:2185-2186` ruft nur `spawnEmbers` 300×, bleibt also grün, egal was Bursts tun. Im Kampf füllen 40 Burst-Partikel die Liste, die Fackel-Funken (GP3-GP5-Arbeit, `particles.js:1-40`) verschwinden ersatzlos; die Zeichenlast steigt auf 100 Partikel × Halo-Ring.
Fix: **getrennte Liste** `burstList` mit eigenem Deckel 40 und eigenem update/draw, oder `spawnBurst` prüft `burstCount >= 40` **und** `list.length >= 100`, `spawnEmbers` prüft `emberCount >= 60` statt `list.length`. Additiver Smoke-Block: „300× spawnBurst + 300× spawnEmbers ⇒ Embers ≥ 55".

**M10 — §6.3/§7.C: die Layout-Freiheit für `LIST_Y` kollidiert mit einer nicht sanktionierten Bestands-Assertion und mit einem Quelltext-TABU.**
Beleg: `inventory_ui.js:23-24` — „**LIST_Y und der X-Anker sind TABU** (die harten Koordinaten stehen im BESTANDS-Smoke, nicht in den Flusstests)". §7.C sanktioniert korrekt den Block `S4-§7F(c) §5.5` (`smoke_test.mjs:4529-4545`, Taps (100,30)/(100,45)/(100,50)/(290,12)/(311,33)/(313,36)). **Nicht** sanktioniert und ebenfalls `LIST_Y`-abhängig: `smoke_test.mjs:1250-1252` (Slice-2-Block, `inp.tap = {x:100,y:30}` ⇒ `ui.cursor === 0`). §7.D erklärt „alles andere Bestehende" für verboten ⇒ Sackgasse. Geometrie zur Sache: Zeile 6 liegt bei y 146..166 (`LIST_Y=26`, `ROW_H=20`, `ROWS=7`), `BTN_EQUIP = {x:232,y:142,w:72,h:22}` = 142..164 bei x 232..304, Liste x 48..304 ⇒ echte Überlappung; Panel 8..172.
Fix: §7.C um `smoke_test.mjs:1250-1252` erweitern (oder `LIST_Y` **fixieren** und nur `BTN_EQUIP` nach y 168 verschieben — dann bleibt beides grün und §6.3 kommt ohne zweite Sanktion aus, das ist der billigere Weg); in jedem Fall den TABU-Kommentar `inventory_ui.js:23-24` im selben Commit korrigieren.

**M11 — §8 Phase 1 parallel ohne eingefrorene Schnittstelle.**
Beleg: „AUDIO-KERN (game/js/audio/** komplett …) · ENGINE (main.js: Adapter/…/Musik-Logik …)" — die ENGINE ruft Funktionen und SFX-/Song-IDs auf, die der AUDIO-KERN im selben Zeitraum erst erfindet. Phase 2 (INTEGRATOR) ist kein Ort, um Signaturen zu verhandeln.
Fix: Vor dem Phase-1-Split in §8 den Vertrag wörtlich festschreiben: Exportnamen (`compileSong`, `notenFreq`, `renderPCM`, `pcmSumme`, `SFX`, `SONGS`, `sfxFuerEreignis(name)`, `allocVoice`), die vollständige SFX-ID-Liste aus §2.2 und die Song-Schlüssel aus §2.3.

**M12 — §5.5/§5.2/§5.3: die Rig-Schalter sind deklariert, aber niemand setzt sie; `.tmp/shot_gfx6.py` kennt sie nicht.**
Beleg: `.tmp/shot_gfx6.py` misst pixelgenaue Fenster bei eingefrorenen Phasen und kennt nur `window.__noTint` (`main.js:1307` als Muster). Antwort auf die gestellte Frage: **`__noFlash` reicht für M1**, weil der Flash rein transient (2 Frames) und nur an Spieler-Schaden/Boss-Aufschlag gebunden ist — in einer eingefrorenen Belichtungsmessung findet kein Kampf statt. **Der Shake reicht nicht**: er klingt über bis zu 12 Frames ab und verschiebt jedes Messfenster um 1-3 px, wenn eine Messung innerhalb dieser 12 Frames fällt.
Fix: §5.5 verpflichtend erweitern — „`.tmp/shot_gfx6.py` setzt in derselben Slice `window.__noShake = __noFlash = __noAudio = true` vor jeder Messung", alle drei Schalter in §0.2-Guardform gelesen (`typeof window !== 'undefined' && window.__noShake === true`), Default = Effekte AN.

---

## MINOR

**m1 — §1 A1 Determinismus: `renderPCM` benutzt `Math.sin`/`Math.pow`/`Math.tanh` im Sample-Pfad** (`chiptune.js:83, 87, 94, 99, :16`). ECMAScript lässt diese Funktionen implementierungsabhängig; hier stand nur Node v20.19.2 zur Verfügung, ein echter Cross-Version-Beweis war nicht möglich. Praktisch ist V8 stabil (eigener fdlibm-Port), und `pcmSumme` quantisiert auf 16 Bit (`:107`), was ~1,5e-5 relativen Fehler schluckt. Risiko liegt **nicht** bei „stabil über 3 Läufe" (so formuliert ist A1 richtig), sondern bei einer eingefrorenen Gold-Konstante à la S4-GOLD. Fix: keine Gold-Prüfsumme über PCM einfrieren; wenn doch, dann über die **Ereigniszeiten** aus `compileSong` — deren Pfad (`60/bpm/rowsPerBeat`, Multiplikation) ist reine IEEE754-Arithmetik und bit-exakt auf jeder Engine.

**m2 — `notenFreq` scheitert still** (`chiptune.js:8-17`): gemessen `notenFreq('H-4') = null` (deutsches H — der ganze Code ist deutsch, das passiert), die Note verschwindet lautlos; `notenFreq('C-10') = 32,70` (`name[2]` ist `'1'` ⇒ C-1 statt C-10). Ebenso hat `compileSong` keine Validierung gegen ungleich lange Kanal-Zeilen (`:30 pat[0].length`) — eine zu kurze Zeile ergibt `undefined`-Zellen, die stumm übersprungen werden (`:34`). Bei 6 handgeschriebenen Songs (§2.3, der A4-Iterationsblock) kostet jeder stille Fehler eine Michael-Runde. Fix: `pruefeSong(song)` als Node-Gate — wirft bei unbekanntem Notennamen, bei `okt`-Parse über 1 Zeichen hinaus, bei ragged patterns, bei unbekanntem Instrument, bei `order`-Einträgen ohne Pattern.

**m3 — Keine Monophonie-Regel je Kanal.** In SONG_KATAKOMBEN gemessen: **0 Überlappungen** — aber nur, weil die Probe sauber geschrieben ist. `compileSong` schneidet nichts ab; eine zu lange Note stapelt sich in renderPCM (`out[p] +=`) und erzeugt in WebAudio einen zweiten Oszillator auf demselben „Kanal" ⇒ doppelter Pegel ⇒ hebelt das B1-Peak-Gate aus. Fix: `compileSong` kürzt jede Note auf den Beginn der nächsten Note desselben Kanals (Tracker-Standard) und legt damit die Obergrenze „gleichzeitige Musikstimmen = Kanalzahl" fest.

**m4 — §6.1 Pause-Menü: die bindende Zahl ist nicht „Unterkante ≤ 172", sondern `h ≥ 16 px`.** `smoke_test.mjs:4047` `MM_PRO_PX = 0,3764`, `:4567` `z.h * MM_PRO_PX >= 6` ⇒ **h ≥ 15,94 ⇒ 16**. Mit h=16 und Abstand 4 passen 5 Zonen ab y 60 in 60/80/100/120/140 (Unterkante 156) — das heutige Panel (80,40,160,110, Unterkante 150) muss also nur um ~10 px wachsen, nicht dramatisch. Ausserdem: §7.B beschreibt nur „`length === 3` → `=== 5`"; die Nicht-Überlappungs-Kette ist **indexweise ausgeschrieben** (`:4568-4569` prüft nur [1] vs [0] und [2] vs [1]) und braucht zwei weitere Klauseln. Entwarnung geprüft: `SONDEN` (`:4086`) enthält `'AUSRUESTUNG'`, die Prüfung ist `!t.includes(s)` — `'TON: AUS'` ist unbedenklich; `pTexte.includes('GOTT: AUS')` (`:4589`) bleibt unberührt.

**m5 — §4.2 Respawn: gleiche Karte ⇒ gleicher Song, die Spec sagt nicht, dass er weiterlaufen soll.** `main.js:1030` `buildWorld(currentMapKey, lastSpawn, true)` — dieselbe Karte. „Kurze Audio-Blende ~0,25 s" liest sich als Neustart; dann fängt die Musik bei jedem Tod von vorn an. Fix: Regel „gleicher Song-Schlüssel ⇒ keine Blende, kein Neustart, Sequencer läuft durch" für alle vier `buildWorld`-Pfade. Zusätzlich: `resetRun`/`ladeSpielstand` bauen die Welt **synchron in einem Frame**, es gibt dort kein 0,25-s-Fenster in der Welt — die Blende ist rein audioseitig (alter Bus rampt runter, neuer Song startet sofort), das gehört so in §4.2.

**m6 — §3.3 Schritte: 5 Schritte/s sind Sprint-Kadenz.** `player.js:221` `Math.floor(animTimer*10)%4` ⇒ 10 Wechsel/s; bei 2 Schritten je 4er-Zyklus 5/s (Landkarte 1.3, Spam-Kandidat 2). §9 sagt „dezent", nennt aber keine Grenze. Fix: Auslösung auf genau die Frames 1 und 3 **plus** Mindestabstand 0,22 s, Pegel ≤ 0,25 des Schwert-SFX, `uiBus`-frei (gehört auf `sfxBus`).

**m7 — AudioContext-Singleton ist nicht festgeschrieben.** Gemessen: das Chromium hier erlaubt **> 32** gleichzeitige `AudioContext` (kein Wurf bis 33) — es gibt also keine Fehlermeldung, die einen Mehrfach-Bau auffliegen lässt; jeder Kontext ist ein eigener Audio-Thread. Fix: §0.2 ergänzen — „genau **ein** AudioContext für die Lebensdauer des Dokuments, nie `close()`, nie neu bauen; Zustandswechsel ausschliesslich über suspend/resume".

**m8 — Ausgabelatenz am Gerät ist ein A4-Risiko, kein Code-Fehler.** Gemessen headless: `baseLatency = 0,01` @44,1 kHz, `outputLatency = 0` (headless hat kein echtes Gerät). Android-WebView liegt real bei 100-200 ms, Bluetooth-Kopfhörer legen 100-300 ms drauf. „Schwert fühlt sich zu spät an" ist dann kein Bug. Fix: §A4-Checkliste ergänzt um „Hörtest **zuerst über Gerätelautsprecher/Kabel**, Bluetooth nur als Zweitlauf"; SFX immer auf `ctx.currentTime` planen (nie mit Vorlauf), Attack ≤ 5 ms; und in §9 deklarieren, dass Hitstop/Shake/Flash **visuell und sofort** sind und die Wucht auch dann tragen, wenn der Ton 150 ms nachhinkt.

**m9 — Capacitor: kein Bildschirm-Wachhalten.** Michaels Hörtest ist ein Zuhör-Test; ohne Berührung greift der Android-Bildschirm-Timeout, die WebView pausiert, `visibilitychange` feuert, die Musik stoppt. Kein Plugin und kein `FLAG_KEEP_SCREEN_ON` im Projekt. Fix: entweder in §A4 als erwartetes Verhalten deklarieren („Bildschirm anlassen") oder ausdrücklich als Nicht-Ziel notieren — sonst kommt es als Fehlermeldung zurück.

---

## Geprüft und GRÜN (keine Massnahme nötig)

- **§6.2 `grimlight.audio.v1` gegen `check_save_slice4` BOOT 5:** unbedenklich. Der Speicher-Stub ist eine offene `Map` (`:58-63`), es gibt **keine** Schlüssel-Zähl- oder Iterations-Assertion; ausgewertet wird nur `standRoh()` = `SPEICHER.get(SAVE_KEY)` (`:65`). BOOT 5 setzt `storage: null` (`:347`) ⇒ `main.js:284` `store === null` ⇒ `storeLesen` liefert `null` (`:286-288`) ⇒ Defaults an/an. Die BOOT-5-Assertions sind ohnehin **text-** und **wert**basiert (`hatText('GRIMLIGHT')`/`hatText('ENTER')`, `ambient() ≈ 0,22`, `goldText() === 'GOLD 0'`, `hatText('PAUSE')`, `:350-368`), nicht op-Strom-byte-gleich. Ein zusätzlicher `storeLesen`-Aufruf im Boot ist dort unsichtbar. Einzige Auflage: der Schreibvorgang darf **nicht** in `saveNow()` einhängen, sonst wandert er in die BOOT-1/2/3-Vergleiche.
- **§5.3 Flash gegen alle vier Detektoren:** `fadeAlpha()` verlangt `fillStyle === '#000'` **und** `0 < alpha < 1` **und** 320×180 (`.tmp/check_main_slice1.mjs:158-163`); `istFadeZug` im Smoke ist wortgleich (`tools/smoke_test.mjs:4083-4084`). `rgba(255,244,220,0.18)` bei `globalAlpha = 1` trifft keine der beiden Bedingungen. `ambientAlpha()` sieht nur `o.canvas !== mainCanvas` (`:154-157`) — ein Haupt-ctx-Zug ist unsichtbar. S4-GOLD hasht ausschliesslich den `fillRect`-Strom von `createLighting().draw` **auf dem Offscreen** (`smoke_test.mjs:3890-3893`). **Bestätigt, nicht verschärfungsbedürftig** — bis auf M12 (Rig).
- **Stimmen-/Rechenbudget Mittelklasse-Handy:** Gemessen 6,7 Noten/s = **15,4 Knoten/s** (`mess_peak.mjs`), Knotenbau **0,046 ms** (headless) bzw. 0,031 ms @1x / 0,241 ms @6x (Landkarte). Musik kostet bei 6x-Drossel **~1,6 ms pro Sekunde** = 0,027 ms/Frame. 12 SFX-Stimmen in einem Frame @6x = **2,9 ms** von 16,6 ms. Zur gestellten Frage: 700-1400 Oszillator-Starts **am Stück** wären 64,7 ms gemessen (≈390 ms bei 6x = 23 verlorene Frames) — mit 0,10 s Lookahead sind es **0,67 Noten je Nachfüllung**. Der Lookahead ist damit nicht Optimierung, sondern Existenzbedingung; er gehört als Zahl in die Spec (B4). Gesamtbudget-Formulierung für §1 A1: „≤ 12 SFX-Stimmen **und** ≤ 2 gleichzeitige Song-Instanzen à Kanalzahl (Crossfade/Boss-Ebene)".
- **APK-Grösse:** gemessen 2152 B für 11,43 s = **188 B/s**; 4 Karten-Songs à 75 s + 2 Stinger à 5 s ≈ **57 KB Text**, unkomprimiert. Gegen eine Debug-APK vernachlässigbar, kein Thema.
- **FPS-Overlay-Interferenz:** `drawFps` ist auf genau zwei `fillText`-Zeilen festgeschrieben (`hud.js:810 ff.`) und läuft in `render()`, nicht in `update()` — keine Berührung mit dem Audio-Tick.

---

**Bilanz:** 5 BLOCKER (Peak-Gate misst durch `tanh` das Gegenteil; `systemPause`-`!player`-Guard lässt Titelmusik im Hintergrund weiterlaufen; „SFX stumm" macht die neuen Pause-Schalter unhörbar; Sequencer ohne Lookahead-Zahlen und ohne Resync gegen die weiterlaufende `currentTime`; `loopFrom` ohne Implementierungsfläche), 12 MAJOR und 9 MINOR — die Architektur ist tragfähig, aber §2/§4 müssen vor dem Phase-1-Split um Bus-Graph, Rampenform, Lookahead-Zahlen, `mixer.js` und Slide-/Loop-Semantik ergänzt werden, sonst scheitert Rev 1 an genau den Punkten von Michaels A4-Checkliste.