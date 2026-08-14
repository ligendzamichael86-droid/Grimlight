# SPEC Slice 5 — "Sound & Game-Feel" (Rev 1, 13.08.2026, Fable)

Grundlage: design/SLICE5_LANDKARTE.md (Teil A Audio-Machbarkeit mit
laufendem Prototyp, Teil B Sound-Haken + Game-Feel — Datei:Zeile-
Belege von dort sind bindend). Programm-Rahmen: MASTERPLAN_TIEFE.md.
Deliverable: **Grimlight KLINGT — Chiptune-Musik je Karte + Boss-
Ebene, ~16 SFX, Hitstop/Shake/Flash/Partikel-Feel, Ton-Schalter im
Pause-Menü — im Browser UND in der APK, abgenommen von Michael am
Gerät.**

---

## §0 Eiserne Regeln

0.1 Kanonische Flusstests NULL. Golden sol/geo NULL. S4-GOLD-Hashes
bleiben grün (lighting.js wird NICHT berührt). entities/ TABU
(Landkarte B belegt: alle 24 Lücken sind aus main.js über
vorhandene Felder beobachtbar).

0.2 **Audio-Modul-Reinheit:** game/js/audio/* ist Node-importierbar
und fasst beim Import KEIN Browser-Global an; AudioContext existiert
in keinem Stub — der WebAudio-Adapter lebt AUSSCHLIESSLICH in
main.js, lazy, in der etablierten §0.2-Guardform (main.js:270-291
als Vorlage). Ohne AudioContext ist ALLES vollständig inert
(Flusstests/Smoke laufen byte-gleich).

0.3 **Gesten-Regel (bewusste Browser/App-Gleichheit, Landkarte A
1b):** Ton startet in Browser UND App erst nach der ersten
Nutzergeste — obwohl die Capacitor-WebView Autoplay erlaubt
(Bridge.java:567, hart aus). Unlock: (a) Canvas-touchstart-Callback
(input.js attach bekommt einen OPTIONALEN onFirstTouch-Parameter —
Signatur-Erweiterung nach litDitherCells-Muster, alte Aufrufe
byte-gleich; Canvas-Listener sind Stub-No-Ops); (b) guarded
window-keydown (⚠ Flusstests RUFEN window-Listener wirklich auf —
exakte Guardform!); (c) resume() zusätzlich an den drei
Titel-Übergängen (main.js:789-807, dort sitzt schon
starteQuerformat). iOS-Vorbau dokumentiert (Callback in echtem
Event-Handler), iOS bleibt aus Scope.

0.4 Smoke NUR additiv (Marker `S5-§7F(a)…`, await-import im Block)
PLUS die in §7 ABSCHLIESSEND sanktionierten Bestandsstellen.
Detektor-Regeln gelten unverändert: kein neuer Teilalpha-fillRect
auf Offscreens; kein Vollbild-#000-Teilalpha auf dem Haupt-Canvas;
kein translate/strokeRect/Pfad im kanonischen Zeichenpfad; neue
Canvases nur nach dem Boot (KEINE nötig — der Flash zeichnet auf
den Haupt-ctx). probe_god + check_save_slice4 bleiben grün.

0.5 **Keine Binär-Audio-Assets:** Musik/SFX sind Text-Datenmodule
("Musik als Code", Format aus Landkarte A §3 — bewiesen: 11,4 s =
2,1 KB) + Laufzeit-Synthese über Oszillatoren/Rauschen (Option a);
renderPCM dient NUR als Node-Test-Orakel (Option b wird NICHT im
Spiel benutzt: Speicher + Fade-Ruckler, Landkarte A §2).

0.6 Ports wie gehabt (8123 NIE, 8124 Prüfung, 8125 APK).
Hauptloop committet jeden grünen Stand. Der Audio-Tick läuft in
update(), der Sequencer auf der AudioContext-Uhr mit Lookahead
(Landkarte B 4.1).

---

## §1 ABNAHME

A1 **Objektive Gates (Node, additiv):** Song-Compiler
deterministisch (PCM-Prüfsumme stabil über 3 Läufe); kein Clipping
(renderPCM-Peak ≤ 0,9 über alle Songs+SFX); Stimmen-Obergrenze
eingehalten (≤ 12 gleichzeitige SFX-Stimmen, älteste fliegt);
Event-Abdeckung: JEDES §3-Ereignis hat eine SFX-Zuordnung; Audio
ohne AudioContext inert; Settings-Roundtrip (auch ohne Storage).

A2 **Alle Suiten grün** (inkl. der zwei sanktionierten
Bestandsstellen §7.B/§7.C mit git-diff-Beweis) + APK baut + alle
GP6-/S4-Wächter unberührt grün.

A3 **Game-Feel-Verträglichkeit bewiesen:** Hitstop/Shake vorab in
.tmp/slice5_probe gegen check_main_slice1 gemessen (die 5
Positions-Assertions!); Shake nur über camera.x/y (ganzzahlig,
≤ 12 Frames, Ruhe = exakt 0); Flash nach lighting.draw in
rgba-Füllfarbe; Rig-Schalter __noShake/__noFlash/__noAudio für
shot_gfx6/GP7-Messläufe.

A4 **MICHAELS HÖRTEST AM GERÄT = finale Abnahme, mit
EINGEPLANTEN ITERATIONEN:** mindestens 2 Feedback-Runden für
Musik/Mix sind Teil des Slices (Programm-Direktive "perfekt" —
Musik ist der kreative Block und wird wie ein Grafikpass
behandelt: bauen → Michael hört → Rezepte → nachziehen).
Checkliste für Michael: Musik passt zur Karte + Boss-Wechsel
zündet, SFX fühlen sich richtig an (Schwert! Treffer! Gold!),
nichts nervt/übersteuert, Schalter im Pause-Menü wirken, Ton
pausiert beim App-Wechsel, Game-Feel (Hitstop/Shake) macht Treffer
"dick" ohne zu stören.

---

## §2 PAKET A — Audio-Kern (rein)

2.1 game/js/audio/chiptune.js: notenFreq, compileSong(song) →
Ereignisliste (Zeitplan, deterministisch), renderPCM (Test-Orakel,
LFSR-Rauschen mit festem Keim), pcmSumme. Format wie Landkarte A
§3 (bpm, rowsPerBeat, loopFrom, instruments {pulse/tri/noise,
duty, vol, attack, release}, patterns als Zellen
"NOTE:INSTR:LÄNGE:FX", order; FX: v Vibrato, a Arpeggio, + s Slide
als dritter Effekt). Prototyp .tmp/slice5_probe/chiptune.js ist
Referenz-Implementierung.

2.2 game/js/audio/sfx.js: ~16 SFX als Daten (Kurz-Synthese-Rezepte:
sword_swing, sword_hit, sword_blocked, player_hurt, enemy_die,
gold(mit Tonhöhen-Treppe bei Ketten), potion_drink, potion_pickup,
item_pickup, chest_open, vase_break, boomerang_throw/catch,
portal, menu_move, menu_confirm, level_up, boss_telegraph_a/b,
boss_hit, boss_die, game_over, victory — Builder darf sinnvoll
bündeln, Zuordnungstabelle in §3 ist Pflicht).

2.3 game/js/audio/songs/*.js: **6 Songs** — title (ruhig,
Erkennungsmotiv), graveyard (getragen, Diablo-Tristram-Geist),
catacombs (treibender), fluestergruft (dunkel, wenig), boss
(2 Intensitäten: idle-Grundbett + Aggro-Ebene; Phasen optional),
victory+gameover als Stinger (kurz). Loop-fähig (loopFrom).
Länge je 45-90 s Loop. DAS ist der kreative Block (A4-Iterationen).

## §3 PAKET E — Ereignis-Verdrahtung (nur main.js)

3.1 Die 8 TOTEN Events verdrahten (Landkarte B 1.2) — gold_pickup
MIT Frame-Entprellung (max 1 Ton/Frame, Pitch-Treppe). 3.2 Die 5
gelesenen Events im Toast-Block mitnehmen. 3.3 Beobachter-Block
(Landkarte B 1.3/4.2, Muster props-Scan/WeakMap): Schwert-Schwung
(attackId-Flanke), Schwert-Treffer (hurtTimer-Flanke),
Spieler-Schaden (invulnTimer-Flanke), Vase/Truhe (props-Scan),
Bumerang Wurf/Fang (bestehende Spiegel), Portal-Fade + blockiert,
Menü-Navigation (Titel/Pause/Inventar), Pause auf/zu, Titel-Start,
Game-Over/Sieg, Boss-Telegraph A/B + Dash/Sweep (marker/state-
Flanken), Boss-Aggro, Grufthund-Sprung, Schritte (an Sprite-Frame
gekoppelt, NIE Timer — Spam-Kandidat 2). Flanken-Zustände in
WeakMap (Objekt-Neubau bei buildWorld!).

## §4 PAKET M — Musik-Logik

4.1 Zuordnung DATENGETRIEBEN: mapDef.music (neues additives Feld in
den vier Karten-Defs; world/*.js ist dafür freigegeben — sol/geo-
frei, additiv; Muster mapDef.extraLights). 4.2 Wechsel: Portal =
Crossfade im vorhandenen Fade-Fenster (0,3 s je Richtung); die 3
fade-losen Pfade (resetRun/FORTSETZEN/Respawn) bekommen eine kurze
Audio-Blende (~0,25 s), KEINEN Welt-Fade. 4.3 enterState = Screen-
Musik (title/gameover/victory-Stinger); paused+inventory = DUCKING
(Musik −10 dB, SFX stumm), timeSec läuft weiter — Sequencer auf
AudioContext-Uhr stört das nicht. 4.4 Boss: Grundbett auf der
Karte, Aggro-Ebene über den vorhandenen Boss-Fund (state!=='idle'),
zurück zu ruhig wenn tot (Filter existiert). 4.5 systemPause →
ctx.suspend(); Fortsetzen → resume() (Landkarte B 2.4 PFLICHT).

## §5 PAKET F — Game-Feel (jede Zutat mit Vorab-Probe)

5.1 **Hitstop:** dritter Freeze-Zweig neben dem Fade (main.js:809-
825-Muster): 2 Frames bei Schwert-Treffer, 3 bei Kill, 4 bei
Boss-Treffer; timeSec/stateTime laufen weiter; Vorab-Probe gegen
check_main (A3). 5.2 **Screen-Shake:** NUR camera.x/y-Offset nach
follow() (nie ctx-Transform — Stub-TypeError!), ganzzahlig,
Amplitude 1-2 px (Boss-Dash 3), Dauer ≤ 12 Frames, exponentieller
Abfall, Ruhe = exakt 0; __noShake-Schalter. 5.3 **Treffer-Flash:**
Haupt-ctx NACH lighting.draw, rgba-Füllfarbe bei globalAlpha=1
(Muster drawPause), NIE #000, Vollbild-Weiß max rgba(255,244,220,
0.18) für 2 Frames nur bei Spieler-Schaden/Boss-Aufschlag;
__noFlash-Schalter. 5.4 **Partikel-Bursts:** additive spawnBurst
in particles.js mit EIGENEM Budget (40; der 60er-Deckel-Wächter
prüft nur spawnEmbers): Treffer-Funken, Todes-Puff, Boss-Dash-
Staub, Vasen-Splitter. 5.5 Rig: window.__noAudio (Adapter
komplett aus) für Messläufe.

## §6 PAKET U — UI & Persistenz

6.1 **Pause-Menü 3→5 Zeilen** (WEITER / GOTT / FPS / MUSIK AN-AUS /
TON AN-AUS): Panel wächst (Geometrie neu, alle Zonen ≥ 6 mm,
keine Überlappung, Unterkante ≤ 172); Texte meiden die Flusstest-
Sonden ('MUSIK'/'TON' sind frei, Landkarte); drawPause bleibt im
Stub-Vorrat. Die Smoke-Assertion PAUSE_MENU_ZONES.length === 3
(smoke:4564-4570) wird per §7.B sanktioniert auf === 5.
6.2 Persistenz: EIGENER Key grimlight.audio.v1 über
storeLesen/storeSchreiben (NIE save.js — Schema-v1-Härte!),
Defaults an/an. 6.3 **Slice-4-Nachzug (sanktioniert §7.C):**
Inventar-Layout-Fix — die 20-px-Zeilen dürfen bei vollem Beutel
(7 Items) nichts mehr überlappen; Builder bekommt Layout-Freiheit
(LIST_Y/ANLEGEN-Position), Flusstest-TEXT-Sonden bleiben
unberührt, die betroffenen Smoke-Konstanten werden im selben Zug
nachgezogen (Marker S5-§7C).

## §7 TEST-KATALOG (abschließend)

**A. ADDITIV** (S5-§7F(a)…): A1-Gates komplett; Hitstop-Freeze
(timeSec läuft, Welt steht); Shake (Ruhe exakt 0, Ganzzahligkeit,
Abklingzeit); Flash-Detektor-Verträglichkeit (fadeAlpha/
ambientAlpha bleiben sauber — im Stub bewiesen); spawnBurst-Budget;
Pause-Menü-Geometrie 5 Zonen; Schritt-Kopplung an Sprite-Frame;
Audio-Settings-Roundtrip. **B. SANKTIONIERT #1:** smoke:4564-4570
PAUSE_MENU_ZONES 3→5 (Marker S5-§7B). **C. SANKTIONIERT #2:** die
Inventar-Layout-Konstanten-Assertions aus S4-§7F(c) für den
§6.3-Fix (Marker S5-§7C, minimaler Umfang, im Bericht einzeln
gelistet). **D. Verboten:** alles andere Bestehende.

## §8 BUILD-TOPOLOGIE (Opus, exklusiver Besitz)

**Phase 1 parallel:** AUDIO-KERN (game/js/audio/** komplett:
chiptune.js, sfx.js, songs/*.js — mit Node-Selbsttests und
renderPCM-Belegen; .tmp/slice5_probe als Startpunkt) · ENGINE
(main.js: Adapter/Guards/Unlock/Beobachter/Musik-Logik/Hitstop/
Flash + camera.js Shake + input.js onFirstTouch + hud.js
Pause-Menü/Ducking-Anzeige + particles.js spawnBurst +
world/maps.js+map_*.js NUR mapDef.music + ui/inventory_ui.js
§6.3). **Phase 2:** INTEGRATOR (Smoke §7.A additiv + §7.B/C
sanktioniert, alle Suiten, APK-Build, kurzer 8124-Browser-Rundlauf
mit Konsolen-Log). **Phase 3:** MICHAEL-HÖRTEST (A4) → Musik-
Iterationsrunden (mind. 2 budgetiert) → Übergabe.

## §9 DEKLARATIONEN

Gesten-Regel vereinheitlicht Browser/App (bewusst strenger als
nötig in der App); Ducking statt Stopp in Pause/Inventar; Musik
läuft im Titel erst NACH der ersten Geste (Autoplay); Schritte nur
bei Bewegung hörbar gemacht, dezent; kein Volume-Slider in diesem
Slice (binäre Schalter — Iteration falls Michael ihn will);
Hitstop pausiert Partikel mit (Welt-Freeze); iOS-Eigenheiten
dokumentiert, aus Scope; Song-Qualität wird über A4-Iterationen
mit Michael getrieben, nicht selbst abgenommen.
