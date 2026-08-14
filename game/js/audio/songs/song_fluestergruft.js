// SONG "fluestergruft" (SPEC_SLICE_5 §2.3) — REINES Datenmodul.
//
// CHARAKTER: dunkel und SPARSAM. Die Fluestergruft ist die dunkelste Ebene
// (ambient 0,52, Tint #04100c) — Musik, die hier viel tut, macht den Ort
// kleiner. Also: eine Dreiecks-Drohne, die kaum je den Grundton verlaesst,
// darueber eine Flaeche, die sich um einen HALBTON reibt (D gegen D# — die
// beiden Toene schweben gegeneinander, das ist das "Fluestern"), und vom
// Motiv M nur noch der Anfang: A faellt nach F, als Slide, ohne Ankunft.
//
// Der einzige harmonische Ausreisser ist Takt 'E': der Bass rutscht von D auf
// G#, einen TRITONUS daneben — die klassische "hier stimmt etwas nicht"-
// Stelle. Danach sinkt in 'F' die Drohne eine Oktave ab (Slide ueber 4,8 s),
// und der Loop beginnt von vorn.
//
// 50 bpm, 16 Reihen = 1 Takt = 4,8 s. 12 Takte = 57,6 s, loopFrom 0.
// Gesamtpegel bewusst der leiseste aller Karten-Songs.
//
// REGISTER: kein Basston unter 70 Hz — Handy- und Laptop-Lautsprecher geben
// darunter nichts mehr her (auch die Gruft-Drohne muss HOERBAR dunkel sein,
// nicht nur rechnerisch tief).

export const SONG_FLUESTERGRUFT = {
  name: 'fluestergruft',
  bpm: 50,
  rowsPerBeat: 4,
  loopFrom: 0,
  instruments: {
    lead:  { art: 'pulse', duty: 0.125, vol: 0.13,  attack: 0.180, decay: 1.20, sustain: 0.45, release: 0.50 },
    harm:  { art: 'pulse', duty: 0.5,   vol: 0.07,  attack: 0.350, decay: 1.80, sustain: 0.60, release: 0.70 },
    bass:  { art: 'tri',                vol: 0.22,  attack: 0.060, decay: 2.50, sustain: 0.90, release: 0.60 },
    tropf: { art: 'noise',              vol: 0.05,  attack: 0.001, decay: 0.10, sustain: 0.00, release: 0.05 },
    hauch: { art: 'noise',              vol: 0.045, attack: 0.700, decay: 1.50, sustain: 0.00, release: 0.80 },
  },
  patterns: {
    // --- A: nur Drohne und Hauch. -------------------------------------------
    A: [
      ['...', '...', '...', '...', '...', '...', '...', '...',
       '...', '...', '...', '...', '...', '...', '...', '...'],
      ['...', '...', '...', '...', '...', '...', '...', '...',
       '...', '...', '...', '...', '...', '...', '...', '...'],
      ['D-2:bass:16', '...', '...', '...', '...', '...', '...', '...',
       '...', '...', '...', '...', '...', '...', '...', '...'],
      ['D-4:hauch:16', '...', '...', '...', '...', '...', '...', '...',
       '...', '...', '...', '...', '...', '...', '...', '...'],
    ],
    // --- B: die Halbton-Reibung D -> D#. Das Fluestern. ---------------------
    B: [
      ['...', '...', '...', '...', '...', '...', '...', '...',
       '...', '...', '...', '...', '...', '...', '...', '...'],
      ['D-3:harm:8', '...', '...', '...', '...', '...', '...', '...',
       'D#3:harm:8', '...', '...', '...', '...', '...', '...', '...'],
      ['D-2:bass:16', '...', '...', '...', '...', '...', '...', '...',
       '...', '...', '...', '...', '...', '...', '...', '...'],
      ['...', '...', '...', '...', '...', '...', 'D-7:tropf:1', '...',
       '...', '...', '...', '...', '...', '...', '...', '...'],
    ],
    // --- C: Fragment von M — A faellt nach F und kommt nie an. --------------
    C: [
      ['A-4:lead:8:sF-4', '...', '...', '...', '...', '...', '...', '...',
       '...', '...', '...', '...', '...', '...', '...', '...'],
      ['F-3:harm:16', '...', '...', '...', '...', '...', '...', '...',
       '...', '...', '...', '...', '...', '...', '...', '...'],
      ['D-2:bass:16', '...', '...', '...', '...', '...', '...', '...',
       '...', '...', '...', '...', '...', '...', '...', '...'],
      ['...', '...', '...', '...', '...', '...', '...', '...',
       '...', '...', '...', '...', 'A-8:tropf:1', '...', '...', '...'],
    ],
    // --- D: der zweite Teil von M, ueber bVI. -------------------------------
    D: [
      ['F-4:lead:4:v', '...', '...', '...', 'E-4:lead:4', '...', '...', '...',
       'D-4:lead:8:v', '...', '...', '...', '...', '...', '...', '...'],
      ['D-3:harm:16', '...', '...', '...', '...', '...', '...', '...',
       '...', '...', '...', '...', '...', '...', '...', '...'],
      ['A#2:bass:16', '...', '...', '...', '...', '...', '...', '...',
       '...', '...', '...', '...', '...', '...', '...', '...'],
      ['...', '...', '...', '...', '...', '...', '...', '...',
       '...', '...', '...', '...', '...', '...', '...', '...'],
    ],
    // --- E: Tritonus. Hier stimmt etwas nicht. ------------------------------
    E: [
      ['G#4:lead:8:sA-4', '...', '...', '...', '...', '...', '...', '...',
       '...', '...', '...', '...', '...', '...', '...', '...'],
      ['D#3:harm:16', '...', '...', '...', '...', '...', '...', '...',
       '...', '...', '...', '...', '...', '...', '...', '...'],
      ['D-2:bass:8', '...', '...', '...', '...', '...', '...', '...',
       'G#2:bass:8', '...', '...', '...', '...', '...', '...', '...'],
      ['...', '...', '...', '...', 'D-7:tropf:1', '...', '...', '...',
       '...', '...', '...', '...', 'D-7:tropf:1', '...', '...', '...'],
    ],
    // --- F: die Drohne sinkt eine Oktave ab. -------------------------------
    F: [
      ['...', '...', '...', '...', '...', '...', '...', '...',
       '...', '...', '...', '...', '...', '...', '...', '...'],
      ['...', '...', '...', '...', '...', '...', '...', '...',
       '...', '...', '...', '...', '...', '...', '...', '...'],
      ['D-3:bass:16:sD-2', '...', '...', '...', '...', '...', '...', '...',
       '...', '...', '...', '...', '...', '...', '...', '...'],
      ['D-4:hauch:16', '...', '...', '...', '...', '...', '...', '...',
       '...', '...', '...', '...', '...', '...', '...', '...'],
    ],
  },
  // 12 Takte a 4,8 s = 57,6 s Loop.
  order: ['A', 'B', 'C', 'B', 'D', 'E', 'A', 'C', 'D', 'E', 'B', 'F'],
};
