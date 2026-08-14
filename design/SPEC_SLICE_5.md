# SPEC Slice 5 — "Sound & Game-Feel" (Rev 2, 13.08.2026, Fable)

Rev 1 + adversarialer Review design/SLICE5_SPEC_REVIEW.md
(7 BLOCKER / 21 MAJOR / ~15 MINOR — ALLE eingearbeitet; die
gemessenen Guard-/Probe-Formen der Prüfer sind BINDEND und werden
wörtlich übernommen). Deliverable unverändert: Grimlight klingt +
Game-Feel + Schalter, abgenommen von Michael am Gerät (≥ 2
Musik-Iterationsrunden eingeplant).

---

## §0 Eiserne Regeln

0.1 Flusstests NULL; sol/geo NULL; S4-GOLD grün (lighting.js
unberührt); entities/ TABU; probe_god + check_save_slice4 grün.

0.2 Audio-Reinheit wie Rev 1. **NEU (P1-B1): JEDER WebAudio-Node
wird ausschließlich MIT explizitem Zeitargument gestartet/gestoppt
(`osc.start(t0)`, `osc.stop(t1)`) — NIE `.start()`/`.stop()` mit
leeren Klammern** (der S4-Quelltext-Wächter smoke:4854-4858 zählt
genau diese Muster in main.js). Additiver §7.A-Wächter prüft das
über game/js/**.

0.3 Unlock EXAKT in den vom Prüfer GEMESSEN-GRÜNEN Formen
(SLICE5_SPEC_REVIEW P1-m1, wörtlich übernehmen): input.js attach
bekommt onFirstTouch als 2. Parameter (eigener Listener VOR dem
Bestands-Listener, try/catch); main.js audioUnlock() mit
`typeof AC !== 'function'`-Prüfung VOR jedem new, webkitAudio-
Fallback, äußeres try um window.addEventListener, kein event.*-
Zugriff. resume() IMMER fire-and-forget mit state-Check, NIE
await (P2-M5: das Promise erfüllt sich ohne Aktivierung nie).
**AudioContext ist ein Singleton in main.js** (P2-m7).
resume() hängt an: onFirstTouch, window-keydown-Unlock, den drei
Titel-Übergängen, jedem Pause-WEITER und dem Lifecycle-Fortsetzen.

0.4 Smoke additiv (S5-§7F(a)…, await-import im Block) + die in §7
ABSCHLIESSEND sanktionierten Stellen. Detektor-/Stub-Regeln
unverändert. 0.5 Keine Binär-Assets; Option (b) nur Test-Orakel.
0.6 Ports/Commits wie gehabt.

---

## §1 ABNAHME

A1 **Objektive Gates (Node, additiv):**
(a) compileSong deterministisch (Prüfsumme 3 Läufe) und liefert
`{events, loopFrom, loopTime}` (P2-B5);
(b) Peak ZWEISTUFIG (P1-M9/P2-B1): Einzel-Peak je Song ≤ 0,7 und
je SFX ≤ 0,5 über die GEMEINSAME Signatur
`renderPCM({instruments, events})` (rendert Songs UND SFX), Peak
gemessen VOR jedem Limiter (tanh raus aus dem Orakel-Messpfad);
PLUS Summen-Gate: Musik-Bus + 12 Worst-Case-SFX über den
Master-Gain ≤ 0,9;
(c) Stimmen: ≤ 12 SFX-Stimmen (älteste fliegt) UND ≤ 2
Song-Instanzen (Crossfade/Boss-Ebene);
(d) Zuordnungstabelle §3 vollständig — jede Zeile zeigt auf einen
EXISTIERENDEN SFX-Schlüssel, Bündelung erlaubt, Leerstellen nicht
(P1-M3);
(e) Audio ohne AudioContext inert; mixer-Reducer-Roundtrip (auch
ohne Storage); notenFreq wirft bei unbekannter Note (und kennt
deutsches H = B; P2-m2); Monophonie je Kanal: compileSong schneidet
überlappende Noten ab (Note-off bei Neuanschlag; P2-m3);
Zeitargument-Wächter (§0.2).

A2 Alle Suiten grün (sanktionierte Stellen §7.B/C per git-diff
belegt) + APK baut + GP6-/S4-Wächter grün.

A3 **Game-Feel bewiesen — die BINDENDEN Zahlen aus den Messungen:**
Hitstop H/K/B = **2/3/4** Frames (H ist OBERGRENZE — H=4 kippt
check_inventory; P1-M1) und NUR für: Schwert trifft Gegner (H),
Kill (K), SPIELER TRIFFT BOSS (B). **Spieler-Schaden löst NIEMALS
Hitstop aus** (P1-B2 — der Todes-Frame hat null Toleranz), nur
Flash+Shake. Eingaben überleben den Freeze (Angriffs-Pegel wird
gepuffert, nicht verschluckt — sonst frisst jeder Hitstop den
Folgehieb; Gate). check_main UND check_inventory UND check_boss
namentlich grün. Shake: NUR ganzzahliger Offset NACH followPlayer
auf gespeicherter Kamera-Basis, in JEDEM Zweig (auch Freeze) neu
angewandt (P2-M7), Nach-Klemmung auf den Weltrand (P1-m2),
Abklingen auf WANDUHR (Freeze zählt nicht), harte Nullung in
enterState UND buildWorld (P1-M2, gemessen rot ohne!), Gate
"Offset nach enterState exakt 0". Flash wie Rev 1 (vom Prüfer
dauerhaft-an gemessen grün, P1-m4). Rig-Schalter __noShake/
__noFlash/__noAudio werden in Phase 2 in .tmp/shot_gfx6.py
DURCHGEREICHT (P2-M12).

A4 Michaels Hörtest = finale Abnahme, ≥ 2 Iterationsrunden.
Anleitung enthält: Bildschirm-Timeout fürs Zuhören hochstellen
(kein Keep-Awake-Plugin in diesem Slice; P2-m9).

---

## §2 PAKET A — Audio-Kern (rein; API EINGEFROREN als
Phase-1-Schnittstelle, P2-M11)

2.1 chiptune.js: `notenFreq(note)` (wirft bei unbekannt, H→B),
`compileSong(song) → {events, loopFrom, loopTime}` (monophon je
Kanal, deterministisch), `renderPCM({instruments, events},
sampleRate) → Float32Array` (Test-Orakel, LFSR-Keim fest, KEIN
tanh im Messpfad), `pcmPeak(pcm)`, `pcmSumme(pcm)`.
FX: `v` Vibrato, `a` Arpeggio, `s<NOTE>` Slide MIT Zielnote im
FX-Feld (z. B. "C-4:lead:4:sE-4"; P2-M2).

2.2 sfx.js: Rezepte als Daten. PFLICHT-Schlüssel: sword_swing,
sword_hit, sword_blocked, enemy_die, gold (Pitch-Treppe),
potion_drink, potion_pickup, pickup_generic, chest_open,
vase_break, boomerang_throw, boomerang_catch, portal,
portal_blocked, step, pause_toggle, menu_move, menu_confirm,
level_up, player_hurt, boss_telegraph, boss_dash, hound_jump,
boss_die, game_over_stinger, victory_stinger (P1-M3-Liste).

2.3 songs/*.js: 6 Songs wie Rev 1, loopFrom/loopTime über
compileSong ausgeliefert (P2-B5).

2.4 **mixer.js (NEU, P1-M8/P2-M1):** reiner Reducer —
`defaultSettings()`, `parseSettings(str) → settings|default`,
`serializeSettings(s)`, `toggle(s, 'music'|'sfx')`. main.js reicht
nur Strings über storeLesen/storeSchreiben durch.

## §3 PAKET E — Ereignis-Verdrahtung (nur main.js)

Wie Rev 1, PLUS bindend: **Der gesamte Audio-Beobachter läuft an
GENAU EINER Stelle im playing-Update-Zweig** (nach den
Welt-Updates, gebündelt beim Toast-Block; Screen-Wechsel via
enterState — P2-M8: außerhalb feuert jedes Event mehrfach).
Vasen/Truhen-Beobachter als EIGENE ZWEITE props-Schleife NACH dem
Bestandsblock — die Bestandsschleife bleibt ZEICHENIDENTISCH (der
Regex-Wächter smoke:4772 hat nur 121 Zeichen Reserve; P1-M7).
Schritt-Rate: jeder ZWEITE Frame-Wechsel (≈2,5/s; P2-m6).
Flanken-Zustände in WeakMap.

## §4 PAKET M — Musik-Logik (KONKRETISIERT)

4.1 **Bus-Graph (P2-M3, bindend):** masterGain ← musicBusA +
musicBusB (Crossfade-Paar) ← je Song-Instanz (Kanal-Gains);
masterGain ← sfxBus; masterGain ← **uiBus** (Menü-Sounds).
Master-Startwert 0,8.

4.2 **Sequencer-Zahlen (P2-B4, bindend):** Lookahead **0,10 s**,
nachgefüllt im 60-Hz-update (max 1 Nachfüllung/Tick); nach
resume()/Sichtbarkeits-Rückkehr RESYNC: nächste Events ab
`currentTime + 0,05`, Pattern-Position aus der Musik-Uhr
(eigener Zähler, NICHT currentTime-Differenzen — currentTime
läuft bei Main-Thread-Stall weiter, bei suspend() steht sie).
PeriodicWave je Instrument-Duty EINMAL gecacht (P2-M6 — ~1 ms
je Aufruf, pro Note wäre das Spiel tot).

4.3 **Ducking (P2-M4/B3):** Handpause/Inventar ducken musicBus
per `linearRampToValueAtTime` über 0,15 s auf 0,32 (−10 dB);
sfxBus stumm; **uiBus bleibt HÖRBAR** (sonst sind die neuen
Pause-Schalter unhörbar). Rückweg identische Rampe.

4.4 Karten/Boss wie Rev 1 (mapDef.music; Crossfade 0,3 s über das
A/B-Bus-Paar; die 3 fade-losen Pfade 0,25-s-Audio-Blende;
**Respawn auf DERSELBEN Karte: Song läuft WEITER**, kein Neustart
— P2-m5). Boss-Aggro-Ebene wie Rev 1.

4.5 **Lifecycle (P1-M4/P2-B2, bindend):** `ctx.suspend()` wird
DIREKT in den visibilitychange/pagehide-LISTENERN gerufen, VOR
jedem `if (!player) return` — es muss auch im Titel/Game-Over/
Inventar greifen. resume() an jedem Unlock-/Fortsetz-Punkt (§0.3).
Handpause DUCKT nur; NUR der Lifecycle-Pfad suspendiert.

## §5 PAKET F — Game-Feel

5.1 Hitstop nach A3 (2/3/4, Auslöser-Whitelist, Eingabe-Puffer,
dritter Freeze-Zweig). 5.2 Shake nach A3 (Basis-Speicher +
Re-Anwendung in jedem Zweig + Wanduhr-Abklingen + doppelte
Nullung + Klemmung; Amplitude 1-2 px, Boss-Dash 3, ≤ 12
Update-Ticks Wirkzeit). 5.3 Flash wie Rev 1 (bewiesen grün).
5.4 **Partikel: EIGENE burstList mit Deckel 40** — MAX_PARTICLES
= 60, list und spawnEmbers bleiben UNVERÄNDERT (smoke:2185-2186
prüft exakt 60; P1-M6/P2-M9); update/draw bearbeiten beide Listen.

## §6 PAKET U — UI & Persistenz

6.1 **Pause-Menü 5 Zonen OHNE Panel-Wachstum** (P1-m5, gemessen):
h = 16 px (≥ 6-mm-Gate), y 66/82/98/114/130, Unterkante 146 <
Panel 150 — drawFps-Fenster (y 158-175) bleibt frei. Reihenfolge:
WEITER / GOTT / FPS / MUSIK / TON (GOTT/FPS behalten ihre Indizes
1/2 — check_save_slice4 nutzt die Pause; Prüfer-Hinweis).
Texte 'MUSIK'/'TON' (Sonden-frei). 6.2 grimlight.audio.v1 via
mixer.js-Reducer + storeLesen/storeSchreiben; BOOT-5-Pfad (kein
Storage) bleibt byte-gleich. 6.3 Inventar-Fix mit dem KOMPLETTEN
sanktionierten Umfang aus §7.C.

## §7 TEST-KATALOG (abschließend)

**A. ADDITIV** S5-§7F(a)…: alle A1-Gates; Zeitargument-Wächter
(kein `.start()`/`.stop()` leer in game/js/**); Hitstop-Gates
(hp=0 → gameover im NÄCHSTEN Frame; Angriffs-Pegel überlebt
Freeze; timeSec läuft); Shake-Gates (Offset 0 nach enterState,
Ganzzahligkeit, Wanduhr-Abklingen); Flash-Verträglichkeit;
burstList-Budget + spawnEmbers-Deckel unverändert;
Pause-Geometrie 5 Zonen (Überlappungs-Prüfung über ALLE Paare —
der Bestand prüfte nur 0/1/2); Schritt-Kopplung; props-
Bestandsschleifen-Byte-Identität.
**B. SANKTIONIERT #1** (S5-§7B): smoke:4564-4570 KOMPLETT
(length 3→5, Überlappungs-Schleife generalisiert, h-Gate bleibt).
**C. SANKTIONIERT #2** (S5-§7C, EXAKTE Liste — P1-M5/P2-M10):
smoke:4531-4546 (die sechs S4-§7F(c)-Inventar-Assertions) UND
smoke:1249-1256 (Slice-2-Block Tap→Cursor/Close) UND der
TABU-Kommentar inventory_ui.js:23-24 wird im selben Zug
aktualisiert. NICHTS darüber hinaus.
**D. Verboten:** alles andere Bestehende.

## §8 BUILD-TOPOLOGIE (Opus, exklusiver Besitz)

**Phase 1 parallel** (Schnittstelle = §2-API, eingefroren):
AUDIO-KERN (game/js/audio/**: chiptune.js, mixer.js, sfx.js,
songs/*.js + Node-Selbstbelege) · ENGINE (main.js, camera.js,
input.js, hud.js, particles.js, world/maps.js+map_*.js NUR
mapDef.music, ui/inventory_ui.js §6.3 — gegen die §2-API,
Adapter mit Stub-Attrappe testbar).
**Phase 2 INTEGRATOR:** Smoke §7.A + §7.B/C, shot_gfx6-Rig-
Schalter-Nachzug, alle Suiten, APK-Build + 8125 lokal, kurzer
8124-Browser-Rundlauf (Konsole 0).
**Phase 3:** MICHAEL-HÖRTEST (≥ 2 Runden) → Übergabe.

## §9 DEKLARATIONEN

Wie Rev 1, plus: uiBus in Pause hörbar; Respawn ohne Musik-
Neustart; Schritt-Rate 2,5/s; kein Keep-Awake (Anleitung:
Timeout hochstellen); H-Obergrenze 2 Frames ist eine
TEST-GRENZE, nicht Geschmack (check_inventory:280); Titel-Musik
erst nach erster Geste; Latenz am Gerät ist A4-Beobachtungspunkt.
