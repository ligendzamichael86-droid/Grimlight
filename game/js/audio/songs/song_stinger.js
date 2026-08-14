// SONGS "victory" / "gameover" (SPEC_SLICE_5 §2.3) — REINE Daten.
//
// Zwei kurze Stinger, KEINE Loops: beide tragen `einmalig: true` (main.js
// spielt sie einmal und laesst danach Stille bzw. den Bildschirm-Sound
// stehen). compileSong liefert trotzdem loopFrom/loopTime, damit der Vertrag
// aus §2.1 fuer alle Songs derselbe bleibt.
//
// Beide sind aus DEMSELBEN Motiv gebaut wie alles andere — nur die Richtung
// entscheidet:
//   victory  = M umgekehrt, also AUFWAERTS (D F A D), und am Ende ein F#
//              statt F: die pikardische Terz, d-Moll kippt im letzten Moment
//              nach D-Dur. Das ist der ganze Trick an einem Siegklang.
//   gameover = M' abwaerts (D A# A), und der letzte Ton wird nicht gespielt,
//              sondern GEZOGEN (Slide A-3 -> D-3) — die Melodie sackt weg,
//              statt zu schliessen. Bass faellt bis D-1.
//
// Beide Bildschirme haben >= 0,7 s Mindestanzeigezeit (main.js:36), die
// Stinger passen mit 2,5 s bzw. 3,5 s darueber.

export const SONG_VICTORY = {
  name: 'victory',
  bpm: 120,
  rowsPerBeat: 4,
  loopFrom: 0,
  einmalig: true,
  instruments: {
    lead:  { art: 'pulse', duty: 0.25, vol: 0.18, attack: 0.004, decay: 0.30, sustain: 0.65, release: 0.10 },
    harm:  { art: 'pulse', duty: 0.5,  vol: 0.11, attack: 0.010, decay: 0.40, sustain: 0.60, release: 0.12 },
    bass:  { art: 'tri',               vol: 0.20, attack: 0.004, decay: 0.50, sustain: 0.65, release: 0.10 },
    snare: { art: 'noise',             vol: 0.12, attack: 0.001, decay: 0.09, sustain: 0.00, release: 0.03 },
    hat:   { art: 'noise',             vol: 0.06, attack: 0.001, decay: 0.06, sustain: 0.00, release: 0.02 },
  },
  patterns: {
    V: [
      ['D-5:lead:2', '...', 'F-5:lead:2', '...', 'A-5:lead:2', '...', 'D-6:lead:8:v', '...',
       '...', '...', '...', '...', '...', '...', 'A-5:lead:2', '...',
       'D-6:lead:4:v', '...', '...', '...'],
      ['A-4:harm:6', '...', '...', '...', '...', '...', 'A-4:harm:8', '...',
       '...', '...', '...', '...', '...', '...', 'F#5:harm:6', '...',
       '...', '...', '...', '...'],
      ['D-3:bass:6', '...', '...', '...', '...', '...', 'D-2:bass:8', '...',
       '...', '...', '...', '...', '...', '...', 'D-2:bass:6', '...',
       '...', '...', '...', '...'],
      ['D-7:snare:1', 'D-7:snare:1', 'D-7:snare:1', 'D-7:snare:1', 'D-7:snare:1', 'D-7:snare:1', 'A-8:hat:2', '...',
       '...', '...', '...', '...', '...', '...', 'D-7:snare:2', '...',
       'A-8:hat:4', '...', '...', '...'],
    ],
  },
  order: ['V'],
};

export const SONG_GAMEOVER = {
  name: 'gameover',
  bpm: 60,
  rowsPerBeat: 4,
  loopFrom: 0,
  einmalig: true,
  instruments: {
    lead: { art: 'pulse', duty: 0.125, vol: 0.16, attack: 0.030, decay: 1.00, sustain: 0.50, release: 0.30 },
    harm: { art: 'pulse', duty: 0.5,   vol: 0.09, attack: 0.060, decay: 1.20, sustain: 0.55, release: 0.35 },
    bass: { art: 'tri',                vol: 0.20, attack: 0.010, decay: 1.50, sustain: 0.80, release: 0.40 },
    thud: { art: 'tri',                vol: 0.15, attack: 0.002, decay: 0.35, sustain: 0.00, release: 0.10 },
  },
  patterns: {
    G: [
      ['D-4:lead:4:v', '...', '...', '...', 'A#3:lead:4', '...', '...', '...',
       'A-3:lead:6:sD-3', '...', '...', '...', '...', '...'],
      ['F-3:harm:8', '...', '...', '...', '...', '...', '...', '...',
       'D-3:harm:6', '...', '...', '...', '...', '...'],
      ['D-3:bass:4', '...', '...', '...', 'A#2:bass:4', '...', '...', '...',
       'D-2:bass:6', '...', '...', '...', '...', '...'],
      ['...', '...', '...', '...', '...', '...', '...', '...',
       'D-3:thud:2:sD-2', '...', '...', '...', '...', '...'],
    ],
  },
  order: ['G'],
};
