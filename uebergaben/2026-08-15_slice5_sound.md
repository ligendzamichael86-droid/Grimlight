# Uebergabe Slice 5 — Sound & Game-Feel (ABGENOMMEN)

Datum: 15.08.2026. **MICHAEL-ABNAHME AM GERAET: 15.08.2026 —
"klingt gut", keine Maengel genannt.** Die budgetierten
Musik-Iterationsrunden (A4, >= 2) entfallen ersatzlos.
Commits: 98a546e (Phase 1 Audio-Fabrik), e3bce1a (Integrator +
76 S5-Gates + Sound-APK 4,0 MB). Spec: design/SPEC_SLICE_5.md
(Rev 2, 80d5571), Review: design/SLICE5_SPEC_REVIEW.md.

## Was geliefert ist

- **"Musik als Code":** Tracker-Format (Zellen "NOTE:INSTR:LEN:FX",
  FX v/a/s<NOTE>) in audio/chiptune.js (pur; compileSong ->
  {events, loopFrom, loopTime}, Monophonie-Clip, H=B, wirft bei
  Unbekanntem); renderPCM als Test-Orakel (kein tanh im Messpfad).
- **6 Songs** in d-Moll um das Motiv A-F-E-D (title, graveyard,
  catacombs, fluestergruft, boss, stinger) + WAV-Beweise in
  .tmp/slice5_audio_wav/. (Seit Slice 6 Phase 1 zusaetzlich:
  song_dorf-Stub, f48833e.)
- **Mixer:** audio/mixer.js als Reducer; Busse master 0,8 /
  music 0,62 / sfx 0,75 / ui 0,5 / Duck 0,32; sfxBusGain(n) =
  0,75/sqrt(n); Ducking linearRamp 0,15 s; uiBus bleibt in der
  Pause hoerbar. 26 SFX-Keys (audio/sfx.js).
- **Sequencer:** Lookahead 0,10 s auf eigener Musik-Uhr;
  PeriodicWave je Duty gecacht; resume() nie awaited; WebAudio-
  Nodes IMMER mit explizitem start(t)/stop(t).
- **Karten-Musik datengetrieben:** mapDef.music -> songFuer;
  Boss-Aggro-Wechsel; suspend() in visibility/pagehide VOR dem
  player-Guard (Ton stoppt beim App-Wechsel — am Geraet bestaetigt).
- **Game-Feel:** Hitstop 2/3/4 Frames NUR Spieler-trifft-Gegner/
  Kill/Boss (NIE bei Spieler-Schaden — Todes-Frame tabu,
  check_boss:253); Shake nur ganzzahliger Kamera-Offset mit
  Wanduhr-Abkling, hart genullt in enterState+buildWorld; Flash
  rgba(255,244,220,0.18) NACH lighting.draw; eigene burstList
  (Deckel 40) neben MAX_PARTICLES 60; Pause-Menue 5 Zonen
  y66..130 h16, GOTT/FPS Indizes 1/2; Lautstaerke/Stumm im
  Pause-Menue; GOTT-Toggle baut Spieler via createPlayer neu.
- **Tests:** S5-§7A(a)-(h), 76 additive Gates inkl. Recording-
  AudioContext-Stub (Verhaltensmessung: suspend im Titel,
  Hitstop-Uhr, Shake-Zwilling); sanktionierte §7.B/C-Zeilen mit
  git-Beleg. Smoke damals 723 ok (heute 738 nach S6-Phase-1).

## Wie man testet

- Browser: python3 tools/serve.py -> http://localhost:8123 (Ton
  nach erster Geste). App: bash tools/build_apk.sh (~15 s warm),
  Auslieferung python3 tools/serve_apk.py -> IMMER ueber die
  Startseite /proxy/8125/ (Datei-Direktlinks geben 401; seit
  c4e0f9d repariert die Seite ihren Download-Link selbst, wenn
  der Schlussstrich in der Adresse fehlt).

## Bindende Erkenntnisse (neu aus diesem Slice)

1. Leere .start()/.stop()-Aufrufe brechen den S4-Quell-Waechter
   (smoke .start/.stop-Zaehlung) — immer explizite Zeit uebergeben.
2. suspend() muss VOR `if (!player) return` in den Sichtbarkeits-
   Listenern stehen, sonst laeuft der Titel-Ton im Hintergrund.
3. Hitstop niemals auf Spieler-Schaden legen: der Todes-Frame hat
   Null-Toleranz (check_boss:253 friert sonst).
4. Musik-Aenderungen beruehren NUR audio/songs/* + Mixer-
   Konstanten, nie main.js (deklariert in SPEC_SLICE_6-Kopf) —
   Rezepte von Michael koennen jederzeit ohne Kollision mit dem
   laufenden Slice-6-Bau umgesetzt werden.

## Offen / Folgearbeiten

- Keine Maengel aus der Abnahme. Kuenftige Musik-Wuensche laufen
  als eigenstaendige kleine Auftraege (nur songs/ + Mixer).
- song_dorf ist bewusst ein STUB — Komposition reift in Slice 6
  Phase 3/4 mit der Dorf-Abnahme.
