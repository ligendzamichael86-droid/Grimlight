// SFX-REZEPTE (SPEC_SLICE_5 Rev 2 §2.2). REINE DATEN + reine Umrechnung:
// KEIN window, KEIN AudioContext, kein Modul-Zustand (P2-m9: Modul-Zustand
// wuerde zwischen Smoke-Bloecken lecken — die Stimmenzaehlung steht deshalb
// in mixer.js als Datenstruktur, nicht hier).
//
// sfxRender(key, opts) liefert GENAU dasselbe Buendel, das auch ein Song
// liefert — {instruments, events} — und geht damit durch dieselbe
// renderPCM-Signatur (P1-M9/P2-B1). Der WebAudio-Adapter in main.js baut aus
// jedem Ereignis einen Oszillator/Rauschknoten mit explizitem Zeitargument
// (§0.2: osc.start(t0)/osc.stop(t1), NIE leere Klammern).
//
// Pegel-Disziplin: jedes einzelne SFX bleibt unter Peak 0,5 (Gate A1(b)),
// die meisten weit darunter. Der wirksame Buspegel kommt aus
// mixer.js sfxBusGain(n) — zwoelf gleichzeitige Stimmen duerfen die Summe
// nicht sprengen.
//
// bus: 'sfx' = Weltklang (wird in Pause/Inventar stumm geschaltet),
//      'ui'  = Menue (bleibt HOERBAR, sonst sind die Pause-Schalter aus
//              §6.1 nicht abnehmbar — P2-B3).

import { notenFreq } from './chiptune.js';

// --- gemeinsame Klangfarben -------------------------------------------------
// vol hier ist nur der Rueckfall; jedes Rezept setzt seinen Pegel je Ton (v).
const INSTRUMENTE = {
  hiss:   { art: 'noise', vol: 0.15, attack: 0.001, decay: 0.08, sustain: 0,   release: 0.02 },
  rausch: { art: 'noise', vol: 0.12, attack: 0.004, decay: 0.30, sustain: 0,   release: 0.06 },
  thud:   { art: 'tri',   vol: 0.18, attack: 0.001, decay: 0.09, sustain: 0,   release: 0.02 },
  boom:   { art: 'tri',   vol: 0.18, attack: 0.002, decay: 0.50, sustain: 0,   release: 0.08 },
  blip:   { art: 'pulse', duty: 0.5,   vol: 0.12, attack: 0.002, decay: 0.05, sustain: 0,   release: 0.015 },
  chime:  { art: 'pulse', duty: 0.25,  vol: 0.13, attack: 0.003, decay: 0.18, sustain: 0,   release: 0.04 },
  glas:   { art: 'pulse', duty: 0.125, vol: 0.10, attack: 0.001, decay: 0.25, sustain: 0,   release: 0.05 },
  sing:   { art: 'pulse', duty: 0.25,  vol: 0.12, attack: 0.020, decay: 0.60, sustain: 0.4, release: 0.15 },
  sinus:  { art: 'sine',  vol: 0.14, attack: 0.005, decay: 0.30, sustain: 0.2, release: 0.10 },
};

// Tonhoehen-Treppe fuer Muenzketten (§2.2 "gold (Pitch-Treppe)"): pentatonisch
// aufwaerts, danach Deckel — eine Truhe mit 12 Muenzen soll steigen, nicht
// schreien.
export const GOLD_TREPPE = [0, 2, 4, 7, 9, 12, 14, 16];

// --- Rezepte ----------------------------------------------------------------
// Ton: {t, d, i, f, bis?, v, c?, fx?}
//   t   Start in Sekunden ab Ausloesung        d   Dauer in Sekunden
//   i   Instrument                             f   Hz ODER Notenname
//   bis Slide-Ziel (Hz oder Notenname)         v   lineare Amplitude
//   c   Kanal innerhalb des SFX (gleiche Nummer = nacheinander, ein Knoten)
//   fx  zusaetzliche Effektbuchstaben ('v' Vibrato, 'a' Arpeggio)
export const SFX = {
  // --- Schwert -------------------------------------------------------------
  sword_swing: { bus: 'sfx', noten: [
    { t: 0, d: 0.13, i: 'hiss', f: 5600, bis: 1500, v: 0.14 },
  ] },
  sword_hit: { bus: 'sfx', noten: [
    { t: 0,    d: 0.10, i: 'hiss', f: 3200, bis: 900, v: 0.16 },
    { t: 0,    d: 0.12, i: 'thud', f: 190,  bis: 105, v: 0.15, c: 1 },
    { t: 0,    d: 0.04, i: 'blip', f: 880,             v: 0.07, c: 2 },
  ] },
  sword_blocked: { bus: 'sfx', noten: [
    { t: 0,     d: 0.05, i: 'hiss', f: 6000, bis: 3000, v: 0.10 },
    { t: 0.005, d: 0.28, i: 'glas', f: 'C-7',           v: 0.09, c: 1 },
    { t: 0.005, d: 0.24, i: 'glas', f: 'G-7',           v: 0.06, c: 2 },
  ] },

  // --- Gegner --------------------------------------------------------------
  enemy_die: { bus: 'sfx', noten: [
    { t: 0,    d: 0.24, i: 'rausch', f: 2600, bis: 280,   v: 0.15 },
    { t: 0,    d: 0.26, i: 'thud',   f: 220,  bis: 60,    v: 0.14, c: 1 },
    { t: 0.02, d: 0.18, i: 'glas',   f: 660,  bis: 220,   v: 0.07, c: 2 },
  ] },
  hound_jump: { bus: 'sfx', noten: [
    { t: 0, d: 0.11, i: 'sing', f: 'F-4', bis: 'D-5', v: 0.13 },
    { t: 0, d: 0.05, i: 'hiss', f: 2400, bis: 1200,   v: 0.06, c: 1 },
  ] },

  // --- Beute ---------------------------------------------------------------
  gold: { bus: 'sfx', noten: [
    { t: 0,     d: 0.05, i: 'chime', f: 'E-6', v: 0.12 },
    { t: 0.045, d: 0.13, i: 'chime', f: 'B-6', v: 0.12 },
  ] },
  potion_drink: { bus: 'sfx', noten: [
    { t: 0,    d: 0.07, i: 'sinus', f: 200, bis: 320, v: 0.13 },
    { t: 0.09, d: 0.07, i: 'sinus', f: 230, bis: 370, v: 0.13 },
    { t: 0.18, d: 0.09, i: 'sinus', f: 260, bis: 430, v: 0.13 },
    { t: 0.20, d: 0.10, i: 'hiss',  f: 1200, bis: 400, v: 0.05, c: 1 },
  ] },
  potion_pickup: { bus: 'sfx', noten: [
    { t: 0,    d: 0.07, i: 'chime', f: 'A-5', v: 0.11 },
    { t: 0.06, d: 0.14, i: 'chime', f: 'E-6', v: 0.11 },
  ] },
  pickup_generic: { bus: 'sfx', noten: [
    { t: 0, d: 0.10, i: 'chime', f: 'A-5', bis: 'E-6', v: 0.11 },
  ] },
  chest_open: { bus: 'sfx', noten: [
    { t: 0,    d: 0.26, i: 'rausch', f: 420, bis: 260, v: 0.09 },
    { t: 0.10, d: 0.08, i: 'chime',  f: 'D-5',          v: 0.10, c: 1 },
    { t: 0.18, d: 0.08, i: 'chime',  f: 'F-5',          v: 0.10, c: 1 },
    { t: 0.26, d: 0.20, i: 'chime',  f: 'A-5',          v: 0.10, c: 1 },
  ] },
  vase_break: { bus: 'sfx', noten: [
    { t: 0,    d: 0.16, i: 'hiss', f: 5200, bis: 1800, v: 0.16 },
    { t: 0.01, d: 0.10, i: 'glas', f: 3520, bis: 2200, v: 0.08, c: 1 },
    { t: 0.05, d: 0.09, i: 'glas', f: 2637,            v: 0.06, c: 2 },
  ] },

  // --- Zweitwaffe / Welt ---------------------------------------------------
  boomerang_throw: { bus: 'sfx', noten: [
    { t: 0, d: 0.14, i: 'sing', f: 'D-5', bis: 'A-5', v: 0.11, fx: 'v' },
    { t: 0, d: 0.10, i: 'hiss', f: 2600, bis: 5200,   v: 0.05, c: 1 },
  ] },
  boomerang_catch: { bus: 'sfx', noten: [
    { t: 0, d: 0.11, i: 'sing', f: 'A-5', bis: 'D-5', v: 0.11, fx: 'v' },
    { t: 0, d: 0.05, i: 'blip', f: 1200,              v: 0.07, c: 1 },
  ] },
  portal: { bus: 'sfx', noten: [
    { t: 0,    d: 0.45, i: 'sinus',  f: 'D-3', bis: 'D-6', v: 0.12, fx: 'v' },
    { t: 0.05, d: 0.40, i: 'glas',   f: 'A-4', bis: 'A-6', v: 0.06, c: 1 },
    { t: 0,    d: 0.35, i: 'rausch', f: 900,  bis: 4000,   v: 0.05, c: 2 },
  ] },
  portal_blocked: { bus: 'sfx', noten: [
    { t: 0,    d: 0.18, i: 'thud', f: 160, bis: 110, v: 0.14 },
    { t: 0.02, d: 0.14, i: 'blip', f: 150,           v: 0.09, c: 1 },
  ] },
  step: { bus: 'sfx', noten: [
    { t: 0, d: 0.05, i: 'hiss', f: 850, bis: 520, v: 0.04 },
  ] },

  // --- Menue (uiBus: NIE ducken, NIE mit sfx stumm schalten) ---------------
  pause_toggle: { bus: 'ui', noten: [
    { t: 0,    d: 0.06, i: 'blip', f: 'A-4', v: 0.09 },
    { t: 0.05, d: 0.09, i: 'blip', f: 'D-4', v: 0.08 },
  ] },
  menu_move: { bus: 'ui', noten: [
    { t: 0, d: 0.035, i: 'blip', f: 'E-5', v: 0.08 },
  ] },
  menu_confirm: { bus: 'ui', noten: [
    { t: 0,     d: 0.05, i: 'chime', f: 'A-5', v: 0.10 },
    { t: 0.045, d: 0.12, i: 'chime', f: 'D-6', v: 0.10 },
  ] },

  // --- Spieler -------------------------------------------------------------
  level_up: { bus: 'sfx', noten: [
    { t: 0,     d: 0.09, i: 'chime', f: 'D-5', v: 0.12 },
    { t: 0.085, d: 0.09, i: 'chime', f: 'F-5', v: 0.12 },
    { t: 0.170, d: 0.09, i: 'chime', f: 'A-5', v: 0.12 },
    { t: 0.255, d: 0.30, i: 'chime', f: 'D-6', v: 0.13, fx: 'v' },
    { t: 0.255, d: 0.28, i: 'sing',  f: 'A-5', v: 0.07, c: 1 },
  ] },
  player_hurt: { bus: 'sfx', noten: [
    { t: 0, d: 0.16, i: 'rausch', f: 1400, bis: 380,   v: 0.16 },
    { t: 0, d: 0.18, i: 'thud',   f: 300,  bis: 110,   v: 0.15, c: 1 },
    { t: 0, d: 0.10, i: 'glas',   f: 'A-4', bis: 'D-4', v: 0.06, c: 2 },
  ] },

  // --- Boss ----------------------------------------------------------------
  boss_telegraph: { bus: 'sfx', noten: [
    { t: 0,    d: 0.42, i: 'sing',   f: 'D-2', bis: 'D-3', v: 0.15, fx: 'v' },
    { t: 0.08, d: 0.34, i: 'glas',   f: 'A-3',             v: 0.07, c: 1, fx: 'v' },
    { t: 0,    d: 0.40, i: 'rausch', f: 300,  bis: 1200,   v: 0.06, c: 2 },
  ] },
  boss_dash: { bus: 'sfx', noten: [
    { t: 0,    d: 0.26, i: 'rausch', f: 4200, bis: 600, v: 0.18 },
    { t: 0.02, d: 0.24, i: 'boom',   f: 140,  bis: 48,  v: 0.16, c: 1 },
  ] },
  boss_die: { bus: 'sfx', noten: [
    { t: 0,    d: 0.70, i: 'rausch', f: 1800, bis: 140,   v: 0.18 },
    { t: 0,    d: 0.80, i: 'boom',   f: 170,  bis: 42,    v: 0.16, c: 1 },
    { t: 0.10, d: 0.20, i: 'glas',   f: 'D-4', bis: 'A-3', v: 0.07, c: 2 },
    { t: 0.34, d: 0.22, i: 'glas',   f: 'A-3', bis: 'F-3', v: 0.07, c: 2 },
    { t: 0.58, d: 0.34, i: 'glas',   f: 'F-3', bis: 'D-3', v: 0.07, c: 2 },
  ] },

  // --- Bildschirm-Akzente (die MUSIK dazu steht in songs/song_stinger.js;
  //     main.js darf beides schichten oder nur den Song spielen) ------------
  game_over_stinger: { bus: 'ui', noten: [
    { t: 0, d: 0.55, i: 'boom',   f: 'D-3', bis: 'D-2', v: 0.15 },
    { t: 0, d: 0.50, i: 'rausch', f: 600,  bis: 120,    v: 0.07, c: 1 },
  ] },
  victory_stinger: { bus: 'ui', noten: [
    { t: 0,    d: 0.10, i: 'chime', f: 'D-5', v: 0.12 },
    { t: 0.09, d: 0.10, i: 'chime', f: 'A-5', v: 0.12 },
    { t: 0.18, d: 0.34, i: 'chime', f: 'D-6', v: 0.13, fx: 'v' },
    { t: 0.18, d: 0.30, i: 'sing',  f: 'F#5', v: 0.07, c: 1 },
  ] },
};

/** Die Pflichtliste aus §2.2 — Reihenfolge = Spec-Reihenfolge. */
export const SFX_KEYS = [
  'sword_swing', 'sword_hit', 'sword_blocked', 'enemy_die', 'gold',
  'potion_drink', 'potion_pickup', 'pickup_generic', 'chest_open', 'vase_break',
  'boomerang_throw', 'boomerang_catch', 'portal', 'portal_blocked', 'step',
  'pause_toggle', 'menu_move', 'menu_confirm', 'level_up', 'player_hurt',
  'boss_telegraph', 'boss_dash', 'hound_jump', 'boss_die',
  'game_over_stinger', 'victory_stinger',
];

/** Rezept holen. WIRFT bei unbekanntem Schluessel (kein stilles Schweigen). */
export function sfxRezept(key) {
  const r = SFX[key];
  if (!r) throw new Error(`sfx: unbekannter Schluessel "${key}"`);
  return r;
}

/** 'sfx' oder 'ui' — an welchem Bus der Klang haengt. */
export function sfxBusVon(key) {
  return sfxRezept(key).bus || 'sfx';
}

/** Zahl der gleichzeitig noetigen Knoten (Info fuer die Stimmenverwaltung). */
export function sfxKnoten(key) {
  const kan = new Set(sfxRezept(key).noten.map((no) => no.c || 0));
  return kan.size;
}

function frq(x) {
  return typeof x === 'string' ? notenFreq(x) : x;
}

/**
 * Rezept -> Ereignisbuendel, identisch geformt zu compileSong-Ereignissen.
 * @param {string} key
 * @param {{stufe?:number, variante?:number, halbton?:number}} opts
 *   stufe    Kettenzaehler fuer 'gold' (Tonhoehen-Treppe)
 *   variante 0/1 fuer 'step' (linker/rechter Fuss — deterministisch, main.js
 *            wechselt ab; NIE Zufall)
 *   halbton  freie Transposition in Halbtoenen
 * @returns {{instruments:Object, events:Array, bus:string}}
 */
export function sfxRender(key, opts = {}) {
  const rez = sfxRezept(key);
  let halbton = Number.isFinite(opts.halbton) ? opts.halbton : 0;
  let pegel = 1;
  if (key === 'gold' && Number.isFinite(opts.stufe)) {
    const i = Math.max(0, Math.min(GOLD_TREPPE.length - 1, Math.floor(opts.stufe)));
    halbton += GOLD_TREPPE[i];
  }
  if (key === 'step' && Math.floor(opts.variante || 0) % 2 === 1) {
    halbton -= 3;
    pegel = 0.85;
  }
  const faktor = Math.pow(2, halbton / 12);

  const events = rez.noten.map((no) => {
    const bis = no.bis === undefined ? null : frq(no.bis) * faktor;
    let fx = no.fx || '';
    if (bis !== null && !fx.includes('s')) fx += 's';
    return {
      t: no.t,
      dauer: no.d,
      ch: no.c || 0,
      freq: frq(no.f) * faktor,
      instr: no.i,
      vol: (no.v ?? INSTRUMENTE[no.i].vol) * pegel,
      fx,
      slideTo: bis,
    };
  });
  return { instruments: INSTRUMENTE, events, bus: rez.bus || 'sfx' };
}
