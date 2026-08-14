// SONGS "boss_idle" / "boss_aggro" (SPEC_SLICE_5 §2.3, §4.4) — REINE Daten.
//
// ZWEI INTENSITAETEN MIT GEMEINSAMEM GRUNDRIFF. Der Trick ist nicht, zwei
// Stuecke zu schreiben, sondern EINS in zwei Dichten:
//
//   * Bass (Kanal 2) und Schlagzeug-Grundschlag sind in BEIDEN Fassungen
//     zeichengleich — das Riff selbst wechselt nie. Es ist die Signatur des
//     Grufthueters: D - D - D# - D - A, ein chromatischer Druck von unten
//     (phrygische b2), der nie aufloest.
//   * "idle" (Grundbett auf der Karte) laesst den Riff LAUERN: kein Lead,
//     nur eine liegende Flaeche und zwei Schlaege je Takt.
//   * "aggro" (boss.state !== 'idle') legt Melodie, Stabs und volles
//     Schlagzeug DARUEBER. Dieselbe Basis, dreifache Dichte.
//
// BINDEND FUER DEN CROSSFADE: gleiche bpm, gleiches rowsPerBeat, gleiche
// Patternlaenge, gleiche order-LAENGE und gleiches loopFrom in beiden
// Fassungen. Damit steht die Musikuhr in beiden an derselben Stelle und
// main.js kann jederzeit ueber das A/B-Bus-Paar blenden, ohne dass das Riff
// springt (§4.1/§4.4).
//
// 132 bpm, 16 Reihen = 1 Takt = 1,818 s. 32 Takte = 58,2 s, loopFrom 0.

const INSTRUMENTE = {
  lead:  { art: 'pulse', duty: 0.25, vol: 0.17, attack: 0.003, decay: 0.25, sustain: 0.50, release: 0.04 },
  harm:  { art: 'pulse', duty: 0.5,  vol: 0.10, attack: 0.004, decay: 0.50, sustain: 0.60, release: 0.08 },
  bass:  { art: 'tri',               vol: 0.20, attack: 0.002, decay: 0.12, sustain: 0.55, release: 0.03 },
  kick:  { art: 'tri',               vol: 0.16, attack: 0.001, decay: 0.07, sustain: 0.00, release: 0.02 },
  snare: { art: 'noise',             vol: 0.12, attack: 0.001, decay: 0.10, sustain: 0.00, release: 0.03 },
  hat:   { art: 'noise',             vol: 0.05, attack: 0.001, decay: 0.03, sustain: 0.00, release: 0.01 },
};

// Beide Fassungen laufen durch dieselbe Abfolge — Abschnitt fuer Abschnitt
// deckungsgleich, damit ein Wechsel mitten im Takt musikalisch aufgeht.
const ORDER = [
  'A', 'A', 'B', 'B', 'C', 'A', 'A', 'D',
  'A', 'A', 'B', 'B', 'C', 'C', 'A', 'D',
  'A', 'A', 'B', 'B', 'C', 'A', 'A', 'D',
  'A', 'B', 'B', 'C', 'C', 'A', 'D', 'D',
];

// --- LAUERND ---------------------------------------------------------------
export const SONG_BOSS_IDLE = {
  name: 'boss_idle',
  bpm: 132,
  rowsPerBeat: 4,
  loopFrom: 0,
  instruments: INSTRUMENTE,
  patterns: {
    A: [
      ['...', '...', '...', '...', '...', '...', '...', '...',
       '...', '...', '...', '...', '...', '...', '...', '...'],
      ['D-3:harm:16', '...', '...', '...', '...', '...', '...', '...',
       '...', '...', '...', '...', '...', '...', '...', '...'],
      ['D-2:bass:2', '...', 'D-2:bass:1', 'D#2:bass:1', 'D-2:bass:2', '...', 'A-2:bass:2', '...',
       'D-2:bass:2', '...', 'D-2:bass:1', 'D#2:bass:1', 'D-2:bass:2', '...', 'A#2:bass:2', '...'],
      ['D-3:kick:2:sD-2', '...', '...', '...', '...', '...', '...', '...',
       'D-3:kick:2:sD-2', '...', '...', '...', '...', '...', '...', '...'],
    ],
    B: [
      ['...', '...', '...', '...', '...', '...', '...', '...',
       '...', '...', '...', '...', '...', '...', '...', '...'],
      ['A#2:harm:16', '...', '...', '...', '...', '...', '...', '...',
       '...', '...', '...', '...', '...', '...', '...', '...'],
      ['D-2:bass:2', '...', 'D-2:bass:1', 'D#2:bass:1', 'D-2:bass:2', '...', 'A-2:bass:2', '...',
       'D-2:bass:2', '...', 'D-2:bass:1', 'D#2:bass:1', 'D-2:bass:2', '...', 'A#2:bass:2', '...'],
      ['D-3:kick:2:sD-2', '...', '...', '...', '...', '...', '...', '...',
       'D-3:kick:2:sD-2', '...', '...', '...', 'A-8:hat:1', '...', '...', '...'],
    ],
    C: [
      ['...', '...', '...', '...', '...', '...', '...', '...',
       '...', '...', '...', '...', '...', '...', '...', '...'],
      ['F-3:harm:16', '...', '...', '...', '...', '...', '...', '...',
       '...', '...', '...', '...', '...', '...', '...', '...'],
      ['D-2:bass:2', '...', 'D-2:bass:1', 'D#2:bass:1', 'D-2:bass:2', '...', 'A-2:bass:2', '...',
       'D-2:bass:2', '...', 'D-2:bass:1', 'D#2:bass:1', 'D-2:bass:2', '...', 'A#2:bass:2', '...'],
      ['D-3:kick:2:sD-2', '...', '...', '...', '...', '...', '...', '...',
       'D-7:snare:2', '...', '...', '...', '...', '...', '...', '...'],
    ],
    // D: das Riff haelt die Luft an.
    D: [
      ['...', '...', '...', '...', '...', '...', '...', '...',
       '...', '...', '...', '...', '...', '...', '...', '...'],
      ['D-3:harm:16', '...', '...', '...', '...', '...', '...', '...',
       '...', '...', '...', '...', '...', '...', '...', '...'],
      ['D-2:bass:16', '...', '...', '...', '...', '...', '...', '...',
       '...', '...', '...', '...', '...', '...', '...', '...'],
      ['...', '...', '...', '...', '...', '...', '...', '...',
       '...', '...', '...', '...', '...', '...', '...', '...'],
    ],
  },
  order: ORDER,
};

// --- ANGRIFF ---------------------------------------------------------------
export const SONG_BOSS_AGGRO = {
  name: 'boss_aggro',
  bpm: 132,
  rowsPerBeat: 4,
  loopFrom: 0,
  instruments: INSTRUMENTE,
  patterns: {
    A: [
      ['D-5:lead:2', '...', 'D#5:lead:2', '...', 'D-5:lead:2', '...', 'A-4:lead:2', '...',
       'A#4:lead:4:v', '...', '...', '...', 'A-4:lead:2', '...', 'G-4:lead:2', '...'],
      ['D-4:harm:1', '...', '...', '...', 'A-3:harm:1', '...', '...', '...',
       'D-4:harm:1', '...', '...', '...', 'A#3:harm:1', '...', '...', '...'],
      ['D-2:bass:2', '...', 'D-2:bass:1', 'D#2:bass:1', 'D-2:bass:2', '...', 'A-2:bass:2', '...',
       'D-2:bass:2', '...', 'D-2:bass:1', 'D#2:bass:1', 'D-2:bass:2', '...', 'A#2:bass:2', '...'],
      ['D-3:kick:2:sD-2', '...', 'A-8:hat:1', 'D-3:kick:1:sD-2', 'D-7:snare:2', '...', 'A-8:hat:1', '...',
       'D-3:kick:2:sD-2', '...', 'A-8:hat:1', 'D-3:kick:1:sD-2', 'D-7:snare:2', '...', 'A-8:hat:1', 'A-8:hat:1'],
    ],
    B: [
      ['F-5:lead:2', '...', 'E-5:lead:1', 'D#5:lead:1', 'D-5:lead:4:v', '...', '...', '...',
       'A#4:lead:2', '...', 'A-4:lead:2', '...', 'F-4:lead:4:v', '...', '...', '...'],
      ['D-4:harm:1', '...', '...', '...', 'A-3:harm:1', '...', '...', '...',
       'D-4:harm:1', '...', '...', '...', 'A#3:harm:1', '...', '...', '...'],
      ['D-2:bass:2', '...', 'D-2:bass:1', 'D#2:bass:1', 'D-2:bass:2', '...', 'A-2:bass:2', '...',
       'D-2:bass:2', '...', 'D-2:bass:1', 'D#2:bass:1', 'D-2:bass:2', '...', 'A#2:bass:2', '...'],
      ['D-3:kick:2:sD-2', '...', 'A-8:hat:1', 'D-3:kick:1:sD-2', 'D-7:snare:2', '...', 'A-8:hat:1', '...',
       'D-3:kick:2:sD-2', '...', 'A-8:hat:1', 'D-3:kick:1:sD-2', 'D-7:snare:2', '...', 'A-8:hat:1', 'A-8:hat:1'],
    ],
    // C: Akkorde aus EINEM Kanal (Arpeggio-FX) — die dichteste Stelle.
    C: [
      ['D-4:lead:8:a', '...', '...', '...', '...', '...', '...', '...',
       'A#3:lead:8:a', '...', '...', '...', '...', '...', '...', '...'],
      ['A-3:harm:8', '...', '...', '...', '...', '...', '...', '...',
       'F-3:harm:8', '...', '...', '...', '...', '...', '...', '...'],
      ['D-2:bass:2', '...', 'D-2:bass:1', 'D#2:bass:1', 'D-2:bass:2', '...', 'A-2:bass:2', '...',
       'D-2:bass:2', '...', 'D-2:bass:1', 'D#2:bass:1', 'D-2:bass:2', '...', 'A#2:bass:2', '...'],
      ['D-3:kick:2:sD-2', '...', 'A-8:hat:1', 'D-3:kick:1:sD-2', 'D-7:snare:2', '...', 'A-8:hat:1', '...',
       'D-3:kick:2:sD-2', '...', 'A-8:hat:1', 'D-3:kick:1:sD-2', 'D-7:snare:2', '...', 'A-8:hat:1', 'A-8:hat:1'],
    ],
    // D: Sturzlauf ueber eine Oktave, dann ein gehaltener Grundton.
    D: [
      ['D-5:lead:1', 'C-5:lead:1', 'A#4:lead:1', 'A-4:lead:1', 'G-4:lead:1', 'F-4:lead:1', 'E-4:lead:1', 'D-4:lead:8:v',
       '...', '...', '...', '...', '...', '...', '...', '...'],
      ['A-3:harm:2', '...', 'A-3:harm:2', '...', 'A-3:harm:2', '...', 'A-3:harm:2', '...',
       'A-3:harm:2', '...', 'A-3:harm:2', '...', 'A-3:harm:2', '...', 'A-3:harm:2', '...'],
      ['D-2:bass:2', '...', 'D-2:bass:1', 'D#2:bass:1', 'D-2:bass:2', '...', 'A-2:bass:2', '...',
       'D-2:bass:2', '...', 'D-2:bass:1', 'D#2:bass:1', 'D-2:bass:2', '...', 'A#2:bass:2', '...'],
      ['D-3:kick:2:sD-2', 'A-8:hat:1', 'A-8:hat:1', 'D-3:kick:1:sD-2', 'D-7:snare:2', '...', 'A-8:hat:1', 'A-8:hat:1',
       'D-3:kick:2:sD-2', 'A-8:hat:1', 'A-8:hat:1', 'D-3:kick:1:sD-2', 'D-7:snare:1', 'D-7:snare:1', 'D-7:snare:1', 'D-7:snare:1'],
    ],
  },
  order: ORDER,
};
