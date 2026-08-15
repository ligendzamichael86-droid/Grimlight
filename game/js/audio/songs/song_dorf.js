// SONG "dorf" — Gramfeld (SPEC_SLICE_6 §0.9). REINES Datenmodul.
//
// STATUS: STUB. §0.9 verlangt, dass der Schluessel im SELBEN Commit wie
// world/map_dorf.js registriert ist — mapDef.music 'dorf' laeuft ueber
// songFuer(), und das WIRFT bei unbekanntem Schluessel: ohne diese Datei
// stuerzt das Betreten des Dorfs ab. Die Peak-/Determinismus-/Monophonie-
// Gates aus S5-§7A gelten ab sofort und werden hier bereits eingehalten;
// die eigentliche KOMPOSITION iteriert danach unabhaengig (Michaels
// Hoertest-Vokabular), und zwar OHNE main.js zu beruehren.
//
// CHARAKTER (Zwielicht-Dorf, Tristram): sparsam und leise. Der Friedhof
// (song_graveyard) ist traurig, das Dorf ist LEER — hier spielt fast nichts,
// und was spielt, spielt weit auseinander. Drei Stimmen statt vier: eine
// gezupfte Begleitfigur (Pulswelle 12,5 % Duty, sehr kurzes Decay), ein
// getragener Bass (Dreieck) und eine Melodie, die nur das Motiv sagt.
// Bewusst KEIN Noise-Kanal: es weht kein Wind zwischen den Haeusern, es ist
// einfach still. Alle drei Lautstaerken liegen unter denen des Friedhofs.
//
// HARMONIK: d-Moll um das Grimlight-Motiv M (A - F - E - D). Es steht in
// ganzen Takten wie auf dem Friedhof, wird hier aber nur JEDEN ZWEITEN Takt
// gesagt; dazwischen steht der Ort allein. Stufen: i (Dm) - bVI (A#) -
// iv (Gm) - i. Keine Dur-Dominante, kein Leitton.
//
// 66 bpm, rowsPerBeat 4 -> 16 Reihen = 1 Takt = 3,636 s. 8 Takte = 29,09 s
// Loop, loopFrom 0 (das Dorf braucht kein Intro, es ist immer schon da).
// Die Loop-Naht ist sauber: jeder Takt endet mit Reihe 15, keine Note ragt
// darueber hinaus (compileSong kappt sonst — hier gibt es nichts zu kappen).

export const SONG_DORF = {
  name: 'dorf',
  bpm: 66,
  rowsPerBeat: 4,
  loopFrom: 0,
  instruments: {
    lead: { art: 'pulse', duty: 0.25, vol: 0.14, attack: 0.040, decay: 0.95, sustain: 0.55, release: 0.30 },
    zupf: { art: 'pulse', duty: 0.125, vol: 0.07, attack: 0.004, decay: 0.30, sustain: 0.00, release: 0.06 },
    bass: { art: 'tri', vol: 0.16, attack: 0.014, decay: 1.50, sustain: 0.80, release: 0.35 },
  },
  patterns: {
    // --- A: Dm, NUR die Zupffigur und der Bass. Der leere Platz. -----------
    A: [
      ['...', '...', '...', '...', '...', '...', '...', '...',
       '...', '...', '...', '...', '...', '...', '...', '...'],
      ['D-3:zupf:2', '...', 'A-3:zupf:2', '...', 'D-4:zupf:2', '...', 'A-3:zupf:2', '...',
       'D-3:zupf:2', '...', 'A-3:zupf:2', '...', 'F-4:zupf:2', '...', 'A-3:zupf:2', '...'],
      ['D-2:bass:16', '...', '...', '...', '...', '...', '...', '...',
       '...', '...', '...', '...', '...', '...', '...', '...'],
    ],
    // --- B: Dm + Motiv M, erste Haelfte (A ... F E). ------------------------
    B: [
      ['A-4:lead:8:v', '...', '...', '...', '...', '...', '...', '...',
       'F-4:lead:4', '...', '...', '...', 'E-4:lead:4', '...', '...', '...'],
      ['D-3:zupf:2', '...', 'A-3:zupf:2', '...', 'D-4:zupf:2', '...', 'A-3:zupf:2', '...',
       'D-3:zupf:2', '...', 'A-3:zupf:2', '...', 'F-4:zupf:2', '...', 'A-3:zupf:2', '...'],
      ['D-2:bass:16', '...', '...', '...', '...', '...', '...', '...',
       '...', '...', '...', '...', '...', '...', '...', '...'],
    ],
    // --- C: bVI (A#) + der Zielton D. Das Motiv kommt an. -------------------
    C: [
      ['D-4:lead:16:v', '...', '...', '...', '...', '...', '...', '...',
       '...', '...', '...', '...', '...', '...', '...', '...'],
      ['A#2:zupf:2', '...', 'F-3:zupf:2', '...', 'A#3:zupf:2', '...', 'F-3:zupf:2', '...',
       'A#2:zupf:2', '...', 'F-3:zupf:2', '...', 'D-4:zupf:2', '...', 'F-3:zupf:2', '...'],
      ['A#2:bass:16', '...', '...', '...', '...', '...', '...', '...',
       '...', '...', '...', '...', '...', '...', '...', '...'],
    ],
    // --- D: iv (Gm) — die Antwort, und zurueck nach Dm. ---------------------
    D: [
      ['F-4:lead:6', '...', '...', '...', '...', '...', 'E-4:lead:2', '...',
       'D-4:lead:8:v', '...', '...', '...', '...', '...', '...', '...'],
      ['G-2:zupf:2', '...', 'D-3:zupf:2', '...', 'G-3:zupf:2', '...', 'A#3:zupf:2', '...',
       'D-4:zupf:2', '...', 'A#3:zupf:2', '...', 'G-3:zupf:2', '...', 'D-3:zupf:2', '...'],
      ['G-2:bass:16', '...', '...', '...', '...', '...', '...', '...',
       '...', '...', '...', '...', '...', '...', '...', '...'],
    ],
  },
  // 8 Takte a 3,636 s = 29,09 s Loop. Das Motiv steht in Takt 2 und 6, die
  // Antwort in Takt 4 und 7 — dazwischen immer ein leerer Takt.
  order: ['A', 'B', 'A', 'C', 'A', 'B', 'D', 'A'],
};
