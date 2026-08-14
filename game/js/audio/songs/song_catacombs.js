// SONG "catacombs" (SPEC_SLICE_5 §2.3) — REINES Datenmodul.
//
// CHARAKTER: treibend. Der Friedhof trauert, die Katakomben JAGEN. Dasselbe
// Motiv M (A F E D) wie im Titel, aber im doppelten Tempo und rhythmisch
// gegen den Beat versetzt — Wiedererkennung ohne Wiederholung.
//
// Handwerk: die Wucht kommt NICHT aus Lautstaerke, sondern aus dem Bass —
// eine Achtel-Figur mit zwei 16tel-Schuben je Takt (Reihen 2/3 und 10/11),
// dazu ein Schlagzeug, das sich EINEN Kanal mit drei Klangfarben teilt
// (kick = Dreieck mit Slide nach unten, snare/hat = Rauschen mit Tonhoehe).
// Genau so hat es die 4-Kanal-Hardware auch gemacht.
//
// 104 bpm, 16 Reihen = 1 Takt = 2,31 s. 26 Takte = 60,0 s;
// loopFrom 32 Reihen = die zwei Riff-Takte am Anfang laufen nur einmal.

export const SONG_CATACOMBS = {
  name: 'catacombs',
  bpm: 104,
  rowsPerBeat: 4,
  loopFrom: 32,
  instruments: {
    lead:  { art: 'pulse', duty: 0.25, vol: 0.17, attack: 0.004, decay: 0.30, sustain: 0.55, release: 0.05 },
    harm:  { art: 'pulse', duty: 0.5,  vol: 0.09, attack: 0.003, decay: 0.12, sustain: 0.00, release: 0.03 },
    bass:  { art: 'tri',               vol: 0.19, attack: 0.002, decay: 0.14, sustain: 0.50, release: 0.03 },
    kick:  { art: 'tri',               vol: 0.16, attack: 0.001, decay: 0.08, sustain: 0.00, release: 0.02 },
    snare: { art: 'noise',             vol: 0.11, attack: 0.001, decay: 0.10, sustain: 0.00, release: 0.03 },
    hat:   { art: 'noise',             vol: 0.05, attack: 0.001, decay: 0.03, sustain: 0.00, release: 0.01 },
  },
  patterns: {
    // --- A: das Riff pur (Intro, Breakdown, Atempause). ---------------------
    A: [
      ['...', '...', '...', '...', '...', '...', '...', '...',
       '...', '...', '...', '...', '...', '...', '...', '...'],
      ['...', '...', '...', '...', '...', '...', '...', '...',
       '...', '...', '...', '...', '...', '...', '...', '...'],
      ['D-2:bass:2', '...', 'D-2:bass:1', 'D-2:bass:1', 'D-2:bass:2', '...', 'F-2:bass:2', '...',
       'D-2:bass:2', '...', 'D-2:bass:1', 'D-2:bass:1', 'A#2:bass:2', '...', 'C-3:bass:2', '...'],
      ['D-3:kick:2:sD-2', '...', 'A-8:hat:1', '...', 'D-7:snare:2', '...', 'A-8:hat:1', '...',
       'D-3:kick:2:sD-2', '...', 'A-8:hat:1', 'A-8:hat:1', 'D-7:snare:2', '...', 'A-8:hat:1', 'A-8:hat:1'],
    ],
    // --- B: Riff + Motiv M im Lauftempo. ------------------------------------
    B: [
      ['A-4:lead:2', '...', 'F-4:lead:2', '...', 'E-4:lead:2', '...', 'D-4:lead:4:v', '...',
       '...', '...', 'F-4:lead:2', '...', 'E-4:lead:2', '...', 'D-4:lead:2', '...'],
      ['...', '...', 'F-4:harm:1', '...', '...', '...', 'A-4:harm:1', '...',
       '...', '...', 'D-4:harm:1', '...', '...', '...', 'F-4:harm:1', '...'],
      ['D-2:bass:2', '...', 'D-2:bass:1', 'D-2:bass:1', 'D-2:bass:2', '...', 'F-2:bass:2', '...',
       'D-2:bass:2', '...', 'D-2:bass:1', 'D-2:bass:1', 'A#2:bass:2', '...', 'C-3:bass:2', '...'],
      ['D-3:kick:2:sD-2', '...', 'A-8:hat:1', '...', 'D-7:snare:2', '...', 'A-8:hat:1', '...',
       'D-3:kick:2:sD-2', '...', 'A-8:hat:1', 'A-8:hat:1', 'D-7:snare:2', '...', 'A-8:hat:1', 'A-8:hat:1'],
    ],
    // --- C: dasselbe eine Etage hoeher, Gegenbewegung abwaerts. -------------
    C: [
      ['D-5:lead:2', '...', 'C-5:lead:2', '...', 'A#4:lead:2', '...', 'A-4:lead:4:v', '...',
       '...', '...', 'A#4:lead:2', '...', 'A-4:lead:2', '...', 'G-4:lead:2', '...'],
      ['...', '...', 'A-4:harm:1', '...', '...', '...', 'D-5:harm:1', '...',
       '...', '...', 'F-4:harm:1', '...', '...', '...', 'A-4:harm:1', '...'],
      ['D-2:bass:2', '...', 'D-2:bass:1', 'D-2:bass:1', 'D-2:bass:2', '...', 'F-2:bass:2', '...',
       'D-2:bass:2', '...', 'D-2:bass:1', 'D-2:bass:1', 'A#2:bass:2', '...', 'C-3:bass:2', '...'],
      ['D-3:kick:2:sD-2', '...', 'A-8:hat:1', '...', 'D-7:snare:2', '...', 'A-8:hat:1', '...',
       'D-3:kick:2:sD-2', '...', 'A-8:hat:1', 'A-8:hat:1', 'D-7:snare:2', '...', 'A-8:hat:1', 'A-8:hat:1'],
    ],
    // --- D: Bruecke — der Bass wandert (Gm - A# - F - C). -------------------
    D: [
      ['A#4:lead:6:v', '...', '...', '...', '...', '...', 'A-4:lead:2', '...',
       'G-4:lead:6:v', '...', '...', '...', '...', '...', 'A-4:lead:2', '...'],
      ['D-4:harm:1', '...', '...', '...', 'A#3:harm:1', '...', '...', '...',
       'C-4:harm:1', '...', '...', '...', 'A-3:harm:1', '...', '...', '...'],
      ['G-2:bass:2', '...', 'G-2:bass:1', 'G-2:bass:1', 'G-2:bass:2', '...', 'A#2:bass:2', '...',
       'F-2:bass:2', '...', 'F-2:bass:1', 'F-2:bass:1', 'C-3:bass:2', '...', 'C-3:bass:2', '...'],
      ['D-3:kick:2:sD-2', '...', 'A-8:hat:1', '...', 'D-7:snare:2', '...', 'A-8:hat:1', '...',
       'D-3:kick:2:sD-2', '...', 'A-8:hat:1', 'A-8:hat:1', 'D-7:snare:2', '...', 'A-8:hat:1', 'A-8:hat:1'],
    ],
    // --- E: Hoehepunkt — Arpeggio-Akkorde auf einem Kanal (Chip-Trick). -----
    E: [
      ['D-4:lead:8:a', '...', '...', '...', '...', '...', '...', '...',
       'A#3:lead:8:a', '...', '...', '...', '...', '...', '...', '...'],
      ['A-4:harm:1', '...', 'A-4:harm:1', '...', 'A-4:harm:1', '...', 'A-4:harm:1', '...',
       'F-4:harm:1', '...', 'F-4:harm:1', '...', 'F-4:harm:1', '...', 'F-4:harm:1', '...'],
      ['D-2:bass:2', '...', 'D-2:bass:1', 'D-2:bass:1', 'D-2:bass:2', '...', 'F-2:bass:2', '...',
       'D-2:bass:2', '...', 'D-2:bass:1', 'D-2:bass:1', 'A#2:bass:2', '...', 'C-3:bass:2', '...'],
      ['D-3:kick:2:sD-2', 'A-8:hat:1', 'A-8:hat:1', 'D-3:kick:1:sD-2', 'D-7:snare:2', '...', 'A-8:hat:1', 'A-8:hat:1',
       'D-3:kick:2:sD-2', '...', 'A-8:hat:1', 'A-8:hat:1', 'D-7:snare:2', 'D-7:snare:1', 'A-8:hat:1', 'A-8:hat:1'],
    ],
    // --- F: Absturz — alles faellt weg bis auf Bass und Herzschlag. --------
    F: [
      ['...', '...', '...', '...', '...', '...', '...', '...',
       '...', '...', '...', '...', '...', '...', '...', '...'],
      ['...', '...', '...', '...', '...', '...', '...', '...',
       '...', '...', '...', '...', '...', '...', '...', '...'],
      ['D-3:bass:4', '...', '...', '...', 'C-3:bass:4', '...', '...', '...',
       'A#2:bass:4', '...', '...', '...', 'A-2:bass:4', '...', '...', '...'],
      ['D-3:kick:2:sD-2', '...', '...', '...', '...', '...', '...', '...',
       'D-3:kick:2:sD-2', '...', '...', '...', '...', '...', '...', '...'],
    ],
  },
  // 26 Takte a 2,31 s = 60,0 s; Loop ab Takt 3 = 55,4 s.
  order: [
    'A', 'A', 'B', 'B', 'C', 'B', 'D', 'E',
    'A', 'B', 'B', 'C', 'C', 'D', 'E', 'F',
    'A', 'B', 'C', 'B', 'D', 'D', 'E', 'E',
    'F', 'A',
  ],
};
