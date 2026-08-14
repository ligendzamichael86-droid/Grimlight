// SONG "title" (SPEC_SLICE_5 §2.3) — REINES Datenmodul wie game/js/art/*.js.
//
// CHARAKTER: ruhig, weit, kalt. Der Titelbildschirm soll nicht anschieben,
// sondern EINLADEN — und dabei das Motiv setzen, das die ganze Welt traegt.
//
// DAS GRIMLIGHT-MOTIV (Wiedererkennung Titel <-> Karten):
//   M  = A F E D   (5 - b3 - 2 - 1 in d-Moll) — der "Seufzer", absteigend.
//   M' = D A# A    (1 - b6 - 5)               — die Antwort, resigniert.
// M kommt im Friedhof getragen wieder, in den Katakomben im doppelten Tempo,
// in der Gruft nur noch als Fragment, beim Boss chromatisch verbogen. Wer den
// Titel gehoert hat, erkennt jede Karte als denselben Ort.
//
// TONART d-Moll durchgehend (b-Stufen konsequent als A# geschrieben — so kann
// die deutsche H/B-Falle in den Daten gar nicht erst auftreten).
// 16 Reihen = 1 Takt 4/4 im 16tel-Raster; bei 66 bpm = 3,64 s je Takt.
// Kein Schlagzeug: der 4. Kanal traegt eine Wind-Flaeche (Rauschen mit langem
// Anschwellen), damit die Stille nicht tot klingt.

export const SONG_TITLE = {
  name: 'title',
  bpm: 66,
  rowsPerBeat: 4,
  loopFrom: 16,            // der Intro-Takt 'I' laeuft nur EINMAL
  instruments: {
    lead: { art: 'pulse', duty: 0.125, vol: 0.18, attack: 0.020, decay: 0.70, sustain: 0.70, release: 0.12 },
    harm: { art: 'pulse', duty: 0.5,   vol: 0.10, attack: 0.050, decay: 0.50, sustain: 0.70, release: 0.15 },
    bass: { art: 'tri',                vol: 0.20, attack: 0.010, decay: 1.00, sustain: 0.85, release: 0.20 },
    wind: { art: 'noise',              vol: 0.055, attack: 0.50, decay: 1.20, sustain: 0.00, release: 0.60 },
  },
  patterns: {
    // --- I: Atem. Nur Grundton und Wind. -----------------------------------
    I: [
      ['...', '...', '...', '...', '...', '...', '...', '...',
       '...', '...', '...', '...', '...', '...', '...', '...'],
      ['...', '...', '...', '...', '...', '...', '...', '...',
       '...', '...', '...', '...', '...', '...', '...', '...'],
      ['D-2:bass:16', '...', '...', '...', '...', '...', '...', '...',
       '...', '...', '...', '...', '...', '...', '...', '...'],
      ['D-4:wind:16', '...', '...', '...', '...', '...', '...', '...',
       '...', '...', '...', '...', '...', '...', '...', '...'],
    ],
    // --- A: das Motiv M nackt. ---------------------------------------------
    A: [
      ['A-4:lead:6:v', '...', '...', '...', '...', '...', 'F-4:lead:2', '...',
       'E-4:lead:2', '...', 'D-4:lead:6:v', '...', '...', '...', '...', '...'],
      ['...', '...', '...', '...', '...', '...', '...', '...',
       '...', '...', '...', '...', '...', '...', '...', '...'],
      ['D-2:bass:8', '...', '...', '...', '...', '...', '...', '...',
       'A-2:bass:8', '...', '...', '...', '...', '...', '...', '...'],
      ['...', '...', '...', '...', '...', '...', '...', '...',
       '...', '...', '...', '...', '...', '...', '...', '...'],
    ],
    // --- B: dasselbe Motiv, jetzt mit Flaeche darunter. ---------------------
    B: [
      ['A-4:lead:6:v', '...', '...', '...', '...', '...', 'F-4:lead:2', '...',
       'E-4:lead:2', '...', 'D-4:lead:6:v', '...', '...', '...', '...', '...'],
      ['A-3:harm:8', '...', '...', '...', '...', '...', '...', '...',
       'C-4:harm:8', '...', '...', '...', '...', '...', '...', '...'],
      ['D-2:bass:8', '...', '...', '...', '...', '...', '...', '...',
       'A-2:bass:8', '...', '...', '...', '...', '...', '...', '...'],
      ['D-4:wind:16', '...', '...', '...', '...', '...', '...', '...',
       '...', '...', '...', '...', '...', '...', '...', '...'],
    ],
    // --- C: die Antwort M' — D fällt über A# nach A. ------------------------
    C: [
      ['D-5:lead:4:v', '...', '...', '...', 'A#4:lead:4', '...', '...', '...',
       'A-4:lead:8:v', '...', '...', '...', '...', '...', '...', '...'],
      ['F-3:harm:4', '...', '...', '...', 'D-3:harm:4', '...', '...', '...',
       'C-4:harm:8', '...', '...', '...', '...', '...', '...', '...'],
      ['D-2:bass:4', '...', '...', '...', 'A#2:bass:4', '...', '...', '...',
       'C-3:bass:8', '...', '...', '...', '...', '...', '...', '...'],
      ['...', '...', '...', '...', '...', '...', '...', '...',
       '...', '...', '...', '...', '...', '...', '...', '...'],
    ],
    // --- D: der Aufschwung — Motiv von oben, das einzige Mal hell. ----------
    D: [
      ['F-5:lead:2', '...', 'E-5:lead:2', '...', 'D-5:lead:4:v', '...', '...', '...',
       'A-4:lead:2', '...', 'A#4:lead:2', '...', 'A-4:lead:4:v', '...', '...', '...'],
      ['A-3:harm:8', '...', '...', '...', '...', '...', '...', '...',
       'F-3:harm:8', '...', '...', '...', '...', '...', '...', '...'],
      ['D-2:bass:8', '...', '...', '...', '...', '...', '...', '...',
       'A#2:bass:8', '...', '...', '...', '...', '...', '...', '...'],
      ['D-4:wind:16', '...', '...', '...', '...', '...', '...', '...',
       '...', '...', '...', '...', '...', '...', '...', '...'],
    ],
    // --- E: Ausatmen. Ein Ton, dann Raum. ----------------------------------
    E: [
      ['A-4:lead:8:v', '...', '...', '...', '...', '...', '...', '...',
       '...', '...', '...', '...', '...', '...', '...', '...'],
      ['D-3:harm:16', '...', '...', '...', '...', '...', '...', '...',
       '...', '...', '...', '...', '...', '...', '...', '...'],
      ['D-2:bass:16', '...', '...', '...', '...', '...', '...', '...',
       '...', '...', '...', '...', '...', '...', '...', '...'],
      ['D-4:wind:16', '...', '...', '...', '...', '...', '...', '...',
       '...', '...', '...', '...', '...', '...', '...', '...'],
    ],
  },
  // 16 Takte a 3,64 s = 58,2 s; Loop ab Takt 2 = 54,5 s.
  order: ['I', 'A', 'B', 'C', 'A', 'B', 'D', 'C', 'A', 'B', 'D', 'E', 'I', 'A', 'B', 'E'],
};
