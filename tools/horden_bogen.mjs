#!/usr/bin/env node
// =============================================================================
// tools/horden_bogen.mjs — GP7-CH-2 PHASE 0, Schritt P0.c (Werkzeug)
// =============================================================================
// Spec: design/SPEC_GP7CH2.md Rev 2 E-C6 (eingefrorene Anordnung), E-B10
//       (Messgroessen + Squint blind), E-A2 (geometrische Flash-Maske),
//       E-B9 (Rim-Ton '|'), design/GP7CH2_LANDKARTE_C_ZIELBILD.md Sec. 5
//       (Tafeln A-D), design/GP7CH2_SPEC_REVIEW.md B5/M11/M15/m7 (BINDEND).
// Herkunft: gehaertet aus den Prototypen .tmp/gp7ch_ch2_sonde/horde.mjs und
//       .tmp/gp7ch_ch2_sonde/knaeuel.mjs; PNG-/Kachel-/Squint-Bausteine nach
//       dem Muster von tools/figuren_bogen.mjs (WERKZEUG-REV 2).
//
// WAS DAS IST: ein REINER Node-PNG-Dump von vier Horden-Tafeln auf ECHTEM,
// gekacheltem Boden. KEIN Server, KEIN Browser, KEIN Canvas, KEIN Playwright.
// Das Werkzeug LIEST ausschliesslich game/js/art/* und SCHREIBT ausschliesslich
// in das per --out gewaehlte Verzeichnis.
//
// DETERMINISTISCH: keine Zeit, kein Math.random, keine Iteration ueber
// ungeordnete Mengen, keine Pfade im Dateiinhalt. Zwei Laeufe auf demselben
// Art-Stand liefern byte-gleiche PNGs und ein byte-gleiches JSON.
//
// ---------------------------------------------------------------------------
// AUFRUF
//   node tools/horden_bogen.mjs --etikett vorher --out .tmp/gp7ch2_p0c/bogen
//
//   --etikett vorher|nachher  NUR das Dateinamens-Etikett des Laufs. Das
//                             Werkzeug rendert IMMER den aktuellen Art-Stand.
//                             (Default: vorher)
//   --out <dir>               Zielverzeichnis (relativ = zur REPO-Wurzel, nicht
//                             zum cwd). Wird angelegt, falls es fehlt.
//                             (Default: .tmp/gp7ch2_p0c/bogen)
//   --tafel A|B|C|D|alle      Welche Tafel(n). (Default: alle)
//   --boden gruft|gras|beide  Welcher Boden. (Default: beide)
//   --rim                     RIM-SIMULATION an (siehe Abschnitt 4b).
//   --flash                   FLASH-SIMULATION an (siehe Abschnitt 4c).
//   --grau                    Ausgabe in Graustufen (Rec.601) statt Farbe.
//   --squintblind             zusaetzlich die 5 BLIND-Kacheln je Boden
//                             (Squint, seed-Zufallsreihenfolge, OHNE Legende)
//                             plus die separate Aufloesungsdatei fuer den Juror.
//   --nurmessen               keine PNG schreiben, nur Messung + Legende.
//
// AUSGABE
//   PNG   horden_bogen_<etikett>_<tafel>_<boden><VAR>_<1x|6x|squint>.png
//         VAR = '' | _rim | _flash | _rim_flash , danach optional _grau
//   JSON  horden_bogen_<etikett>_messung<VAR>.json   (alle E-B10-Groessen)
//   TXT   horden_bogen_<etikett>_legende<VAR>.txt    (Anordnung + sha256)
//   (--squintblind zusaetzlich:)
//   PNG   horden_blind_<etikett>_<boden>_<farbe|grau>_<1x|6x>_<01..05>.png
//   TXT   horden_blind_<etikett>_aufloesung.txt      (NUR fuer den Juror)
//
// ERFOLGS-STRING (Exit-Codes nicht glauben, diesen String greppen):
//   "HORDEN-BOGEN FERTIG"
// Fehler melden sich als "FEHLER:" am Zeilenanfang.
// =============================================================================

import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join, isAbsolute } from 'node:path';
import { SPRITES, TILE_ART } from '../game/js/art/sprites.js';
import { PALETTE } from '../game/js/art/palette.js';

const HIER = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HIER, '..');

// ---------------------------------------------------------------------------
// 1. EINGEFRORENE ANORDNUNG (Spec Rev 2 E-C6 — woertlich)
// ---------------------------------------------------------------------------
// "seed 12345, Roster 12 Skelett/8 Ghul/5 Hund/4 Rost/1 Warden, Kachelsatz
//  stone_floor+_v1/_v2/_v3+_cracked Formel (tx*7+ty*11)%n, 320x180,
//  Y-Sort y+aabb.h, Frame 0, Schatten wie Prototyp."
// Jede Aenderung an Roster, Typ-Reihenfolge oder Anzahl verschiebt ALLE
// Positionen (Review M11) — deshalb steht das hier als Konstante und hat
// KEINEN Schalter.
const SEED = 12345;

// AABB-Masse aus tools/smoke_test.mjs:3336-3341 (M5-Schattengate). Sie sind
// unantastbar (Spec Sec.0.3) und bestimmen Fusspunkt, Y-Sort und Schattenbreite.
const TYPEN = [
  { k: 'skeleton', frame0: 'skeleton_0',  sterbe: 'skeleton_die', aabb: [12, 14], n: 12, rim: [] },
  { k: 'ghoul',    frame0: 'ghoul_0',     sterbe: 'ghoul_die',    aabb: [14, 14], n: 8,  rim: ['C'] },
  { k: 'hound',    frame0: 'hound_0',     sterbe: 'hound_die',    aabb: [14, 12], n: 5,  rim: [] },
  { k: 'rust',     frame0: 'rust_0',      sterbe: 'rust_die',     aabb: [14, 16], n: 4,  rim: [] },
  { k: 'warden',   frame0: 'warden_idle', sterbe: 'warden_die',   aabb: [20, 24], n: 1,  rim: ['C'] },
];
// Roster der 10 LEBENDEN in Tafel D (Rest der 30 liegt dort als Decal).
const ROSTER_D_LEBEND = [
  { k: 'skeleton', n: 4 }, { k: 'ghoul', n: 3 }, { k: 'hound', n: 1 },
  { k: 'rust', n: 1 }, { k: 'warden', n: 1 },
];
// Tafel B "Knaeuel" (Prototyp knaeuel.mjs, gehaertet): 4 Reihen x 5 Figuren,
// X-Abstand 9 px, Reihenversatz 3 px, Y-Abstand 14 px, Leinwand 120x90.
const KNAEUEL_REIHEN = ['skeleton', 'ghoul', 'rust', 'skeleton'];
const KNAEUEL_JE_REIHE = 5;
const KNAEUEL_DX = 9, KNAEUEL_DY = 14, KNAEUEL_VERSATZ = 3, KNAEUEL_X0 = 10, KNAEUEL_Y0 = 14;
// Tafel C "Leiter": EINGEFRORENE Reihenfolge = Roster-Reihenfolge (NICHT nach
// gemessenem Koerper-L sortiert — sonst waeren vorher und nachher nicht
// deckungsgleich uebereinanderlegbar). 5 Gegner-Spalten (Spec E-C6: "vorher/
// nachher 5-spaltig"; Fussvolk ist gestrichen, E-C1) plus eine sechste Zelle
// mit dem HELDEN als Massstab (kein Gegner, deshalb keine sechste Spalte).
const LEITER_HELD = 'player_down_0';
const ZELL_W = 32, ZELL_H = 48, FUSS_RAND = 8;   // Raster wie tools/figuren_bogen.mjs

const BOEDEN = [
  { name: 'gruft', ort: 'CATACOMBS / FLUESTERGRUFT / BOSS_KAMMER (Leitklasse Gruft-Stein)',
    keys: ['stone_floor', 'stone_floor_v1', 'stone_floor_v2', 'stone_floor_v3', 'stone_floor_cracked'],
    sollL: 50.38 },
  { name: 'gras',  ort: 'GRAVEYARD (Leitklasse GY-Gras)',
    keys: ['grass_g5_00'], sollL: 49.89 },
];

const LEINWAND_A = [320, 180];      // Spielaufloesung (CLAUDE.md Punkt 2)
const LEINWAND_B = [120, 90];
const LEINWAND_D = [320, 180];
const ZOOM = 6;

// Flash-Ton (Spec E-A2): #fff8ea, Alpha 0,8. Die Maske ist GEOMETRISCH:
// Kontur-Texel bleiben stehen (der Umriss bleibt schwarz, Zielbild Sec.4.1),
// geflasht wird der Innenraum.
const FLASH_HEX = '#fff8ea';
const FLASH_ALPHA = 0.8;
const FLASH_FIGUREN = 3;            // "auf 3 zufaellige Figuren, seed"
const FLASH_SEED = 12345;
// Rim-Simulation (Spec E-B9): '|' ist der kalte Rim-Ton (L 205,1), der als
// einziger im Graustufen-Squint gegen 'b' (L 203,3) sichtbar bleibt (Review m4).
const RIM_SIM_TON = '|';
// Toene, die in der Trenn-Raten-Formel als RIM zaehlen, wenn sie im Grid stehen:
// 'C' ist der Bestands-Rim von Ghul und Warden (Teil A 1.1), '_' warm und '|'
// kalt sind die in CH-1/CH-2 sanktionierten Rim-Toene.
const RIM_TOENE_ALLGEMEIN = ['C', '_', '|'];
const SCHWARZ = ['k', 'n'];         // Umriss-Toene (Spec Sec.1: "Schwarz k+n")

// Schwellen der Trenn-Raten-Formel (Spec E-B10, woertlich):
// "getrennt bei Rim ODER |dL| >= 25 ODER dE00 >= 20"
const TRENN_DL = 25, TRENN_DE00 = 20;

// ---------------------------------------------------------------------------
// 2. PNG-Schreiber (inline — tools/ darf nicht von .tmp/ abhaengen)
// ---------------------------------------------------------------------------
const CRC_TAB = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let crc = 0xffffffff;
  for (const b of buf) crc = CRC_TAB[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function pngBytes(w, h, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6;                 // 8 bit, RGBA
  const stride = w * 4;
  const raw = Buffer.alloc(h * (stride + 1));
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0;              // Filter 0 (None) — deterministisch
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------------------
// 3. Farbe, Leinwand, Skalierung
// ---------------------------------------------------------------------------
const hexRgb = (s) => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
const L601 = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;
const _f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
// CIE-Lab (D65, sRGB) + CIEDE2000 — Formeln 1:1 aus .tmp/gp7ch_p0/figuren_messung.mjs
// (P0.d, dieselbe Rechnung, die alle CH-1-Gates benutzt haben).
function labRGB(R, G, B) {
  const inv = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const r = inv(R), g = inv(G), b = inv(B);
  const X = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  const Y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const Z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  const fx = _f(X), fy = _f(Y), fz = _f(Z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}
function dE00(l1, l2) {
  const [L1, a1, b1] = l1, [L2, a2, b2] = l2;
  const C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2), Cb = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Cb ** 7 / (Cb ** 7 + 25 ** 7)));
  const ap1 = (1 + G) * a1, ap2 = (1 + G) * a2;
  const Cp1 = Math.hypot(ap1, b1), Cp2 = Math.hypot(ap2, b2);
  const hp = (b, a) => { if (b === 0 && a === 0) return 0; const h = Math.atan2(b, a) * 180 / Math.PI; return h < 0 ? h + 360 : h; };
  const hp1 = hp(b1, ap1), hp2 = hp(b2, ap2);
  const dL = L2 - L1, dC = Cp2 - Cp1;
  let dh = 0;
  if (Cp1 * Cp2 !== 0) { dh = hp2 - hp1; if (dh > 180) dh -= 360; else if (dh < -180) dh += 360; }
  const dH = 2 * Math.sqrt(Cp1 * Cp2) * Math.sin(dh * Math.PI / 360);
  const Lb = (L1 + L2) / 2, Cpb = (Cp1 + Cp2) / 2;
  let hb;
  if (Cp1 * Cp2 === 0) hb = hp1 + hp2;
  else hb = Math.abs(hp1 - hp2) <= 180 ? (hp1 + hp2) / 2 : (hp1 + hp2 < 360 ? (hp1 + hp2 + 360) / 2 : (hp1 + hp2 - 360) / 2);
  const T = 1 - 0.17 * Math.cos((hb - 30) * Math.PI / 180) + 0.24 * Math.cos(2 * hb * Math.PI / 180)
    + 0.32 * Math.cos((3 * hb + 6) * Math.PI / 180) - 0.20 * Math.cos((4 * hb - 63) * Math.PI / 180);
  const Sl = 1 + 0.015 * (Lb - 50) ** 2 / Math.sqrt(20 + (Lb - 50) ** 2);
  const Sc = 1 + 0.045 * Cpb, Sh = 1 + 0.015 * Cpb * T;
  const dTh = 30 * Math.exp(-(((hb - 275) / 25) ** 2));
  const Rc = 2 * Math.sqrt(Cpb ** 7 / (Cpb ** 7 + 25 ** 7));
  const Rt = -Rc * Math.sin(2 * dTh * Math.PI / 180);
  return Math.sqrt((dL / Sl) ** 2 + (dC / Sc) ** 2 + (dH / Sh) ** 2 + Rt * (dC / Sc) * (dH / Sh));
}

function leinwand(w, h) {
  return {
    w, h,
    buf: Buffer.alloc(w * h * 4),
    // Messkanaele (kein Bildinhalt): wem gehoert der sichtbare Texel, welches
    // Palettenzeichen steht dort, ist es ein Rim-, Flash- oder Decal-Texel?
    owner: new Int32Array(w * h).fill(-1),
    zeichen: new Array(w * h).fill('.'),
    rim: new Uint8Array(w * h),
    flash: new Uint8Array(w * h),
    decal: new Uint8Array(w * h),
  };
}
function setPx(cv, x, y, rgb, a = 255) {
  if (x < 0 || y < 0 || x >= cv.w || y >= cv.h) return;
  const o = (y * cv.w + x) * 4;
  if (a >= 255) {
    cv.buf[o] = rgb[0]; cv.buf[o + 1] = rgb[1]; cv.buf[o + 2] = rgb[2];
  } else {
    const f = a / 255;
    cv.buf[o] = Math.round(cv.buf[o] * (1 - f) + rgb[0] * f);
    cv.buf[o + 1] = Math.round(cv.buf[o + 1] * (1 - f) + rgb[1] * f);
    cv.buf[o + 2] = Math.round(cv.buf[o + 2] * (1 - f) + rgb[2] * f);
  }
  cv.buf[o + 3] = 255;
}
const getPx = (cv, i) => [cv.buf[i * 4], cv.buf[i * 4 + 1], cv.buf[i * 4 + 2]];

// Kachelformel EINGEFROREN (Spec E-C6): (tx*7 + ty*11) % n
function kachle(cv, keys) {
  for (let y = 0; y < cv.h; y++) {
    const ty = Math.floor(y / 16);
    for (let x = 0; x < cv.w; x++) {
      const tx = Math.floor(x / 16);
      const g = TILE_ART[keys[(tx * 7 + ty * 11) % keys.length]];
      const ch = g[y % 16][x % 16];
      if (ch === '.') continue;
      setPx(cv, x, y, hexRgb(PALETTE[ch]));
    }
  }
}
// Weichschatten, Profile WIE IM PROTOTYP (Spec E-C6 "Schatten wie Prototyp").
function schatten(cv, cx, baseY, w, big) {
  const ws = big ? [0.90, 0.95, 0.85, 0.65, 0.40] : [0.90, 0.95, 0.70, 0.40];
  const as = big ? [0.34, 0.44, 0.36, 0.24, 0.12] : [0.34, 0.40, 0.20, 0.10];
  const dys = big ? [-1, 0, 1, 2, 3] : [-1, 0, 1, 2];
  for (let i = 0; i < ws.length; i++) {
    const ww = Math.max(1, Math.round(w * ws[i]));
    const x0 = Math.round(cx - ww / 2);
    for (let x = x0; x < x0 + ww; x++) setPx(cv, x, baseY - dys[i], [0, 0, 0], Math.round(as[i] * 255));
  }
}
function nnHoch(cv, f) {
  const out = { w: cv.w * f, h: cv.h * f, buf: Buffer.alloc(cv.w * f * cv.h * f * 4) };
  for (let y = 0; y < out.h; y++) {
    const sy = (y / f) | 0;
    for (let x = 0; x < out.w; x++) {
      const sx = (x / f) | 0;
      cv.buf.copy(out.buf, (y * out.w + x) * 4, (sy * cv.w + sx) * 4, (sy * cv.w + sx) * 4 + 4);
    }
  }
  return out;
}
// 50 % runter, Nearest Neighbour: uebernimmt Quelltexel (2x, 2y). Genau das ist
// der Zusammenkniff-Test — was auf einer 1-px-Kante lebt (Rim!), stirbt hier.
function nnHalb(cv) {
  const out = { w: cv.w >> 1, h: cv.h >> 1, buf: Buffer.alloc((cv.w >> 1) * (cv.h >> 1) * 4) };
  for (let y = 0; y < out.h; y++) {
    for (let x = 0; x < out.w; x++) {
      const s = ((y * 2) * cv.w + x * 2) * 4;
      cv.buf.copy(out.buf, (y * out.w + x) * 4, s, s + 4);
    }
  }
  return out;
}
function graustufen(cv) {
  const out = { w: cv.w, h: cv.h, buf: Buffer.from(cv.buf) };
  for (let i = 0; i < out.w * out.h; i++) {
    const L = Math.round(L601(out.buf[i * 4], out.buf[i * 4 + 1], out.buf[i * 4 + 2]));
    out.buf[i * 4] = L; out.buf[i * 4 + 1] = L; out.buf[i * 4 + 2] = L;
  }
  return out;
}

// ---------------------------------------------------------------------------
// 4. Grid-Werkzeug: Kontur, Zeichnen, Rim-/Flash-Simulation
// ---------------------------------------------------------------------------
const gridInfo = (g) => {
  const h = g.length, w = Math.max(...g.map((r) => r.length));
  const at = (x, y) => (y < 0 || y >= h || x < 0 || x >= w || x >= g[y].length ? '.' : g[y][x]);
  return { h, w, at };
};
// KONTUR nach E5 / Spec E-A2: opaker Texel mit >=1 transparentem 4er-Nachbarn
// ODER an der Rahmenkante.
function konturVon(g) {
  const { h, w, at } = gridInfo(g);
  const set = new Set();
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const c = at(x, y);
    if (c === '.') continue;
    const randkante = x === 0 || x === w - 1 || y === 0 || y === h - 1;
    const nachbarTransparent = at(x - 1, y) === '.' || at(x + 1, y) === '.' || at(x, y - 1) === '.' || at(x, y + 1) === '.';
    if (randkante || nachbarTransparent) set.add(x + ',' + y);
  }
  return set;
}
// Koerper-L nach E5 (figuren_messung.mjs:922 koerperMittel): Mittel der
// Rec.601-Luma ueber die opaken Texel OHNE Kontur und OHNE Rim-Toene.
function koerperL(keys, rimToene) {
  let n = 0, s = 0;
  for (const key of keys) {
    const g = SPRITES[key]; if (!g) continue;
    const set = konturVon(g);
    const { h, w, at } = gridInfo(g);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const c = at(x, y);
      if (c === '.' || set.has(x + ',' + y) || rimToene.includes(c)) continue;
      s += L601(...hexRgb(PALETTE[c])); n++;
    }
  }
  return n ? { L: s / n, texel: n } : { L: null, texel: 0 };
}

// 4b RIM-SIMULATION (--rim). Deklarierte SIMULATION, keine Kunst: Licht von
// oben links, also der oberste opake Texel jeder Spalte und der linkeste opake
// Texel jeder Zeile des DARGESTELLTEN (ggf. gespiegelten) Grids bekommen den
// kalten Rim-Ton '|'. Muster aus dem Prototyp knaeuel.mjs, dort mit '1'; hier
// '|', weil nur der im Graustufen-Squint gegen 'b' bestehen bleibt (Review m4).
function rimMaske(g, flip) {
  const { h, w, at } = gridInfo(g);
  const A = (x, y) => at(flip ? w - 1 - x : x, y);
  const set = new Set();
  for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) if (A(x, y) !== '.') { set.add(x + ',' + y); break; }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (A(x, y) !== '.') { set.add(x + ',' + y); break; }
  return set;
}
// 4c FLASH-SIMULATION (--flash). Spec E-A2: die Maske ist GEOMETRISCH. Die
// Kontur-Texel fallen aus der Maske ('.'), geflasht wird der Innenraum mit
// #fff8ea bei Alpha 0,8. Der Umriss bleibt schwarz (Zielbild Sec.4.1) — genau
// der Unterschied zum Prototyp-Flash, der die Figuren verschmelzen liess.
function flashMaske(g, flip) {
  const { h, w, at } = gridInfo(g);
  const kontur = konturVon(g);
  const set = new Set();
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const qx = flip ? w - 1 - x : x;
    if (at(qx, y) === '.') continue;
    if (kontur.has(qx + ',' + y)) continue;
    set.add(x + ',' + y);
  }
  return set;
}

// Zeichnet ein Grid und fuehrt die Messkanaele nach.
function zeichneGrid(cv, ox, oy, g, opt) {
  const { flip = false, owner = -1, rim = null, flash = null, istDecal = false } = opt || {};
  const { h, w, at } = gridInfo(g);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const ch = at(flip ? w - 1 - x : x, y);
    if (ch === '.') continue;
    const px = ox + x, py = oy + y;
    if (px < 0 || py < 0 || px >= cv.w || py >= cv.h) continue;
    const istRim = rim ? rim.has(x + ',' + y) : false;
    const zeichen = istRim ? RIM_SIM_TON : ch;
    setPx(cv, px, py, hexRgb(PALETTE[zeichen]));
    const istFlash = flash ? flash.has(x + ',' + y) : false;
    if (istFlash) setPx(cv, px, py, hexRgb(FLASH_HEX), Math.round(FLASH_ALPHA * 255));
    const i = py * cv.w + px;
    cv.owner[i] = owner; cv.zeichen[i] = zeichen;
    cv.rim[i] = istRim || RIM_TOENE_ALLGEMEIN.includes(zeichen) ? 1 : 0;
    cv.flash[i] = istFlash ? 1 : 0;
    cv.decal[i] = istDecal ? 1 : 0;
  }
}

// ---------------------------------------------------------------------------
// 5. Deterministischer Zufall (Prototyp horde.mjs, WOERTLICH uebernommen)
// ---------------------------------------------------------------------------
// Achtung, bewusst unveraendert: seed*1103515245 ueberschreitet 2^53, die
// niederwertigen Bits gehen also in der Gleitkomma-Multiplikation verloren.
// Das ist kein sauberer LCG — aber es ist VOLLSTAENDIG determiniert (IEEE-754
// Multiplikation und ToInt32 sind in ECMA-262 exakt festgelegt) und es ist die
// Folge, aus der die in E-C6 eingefrorenen 30 Positionen entstanden sind. Wer
// sie "repariert", verschiebt alle Positionen (Review M11).
function macheRnd(start) {
  let seed = start;
  return () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
}
const typVon = (k) => TYPEN.find((t) => t.k === k);

// 30er-Aufstellung (Tafel A und die Decal-Lage von Tafel D).
function aufstellung30() {
  const rnd = macheRnd(SEED);
  const ents = [];
  for (const t of TYPEN) for (let i = 0; i < t.n; i++) {
    const x = 20 + rnd() * (320 - 60);
    const y = 24 + rnd() * (180 - 60);
    ents.push({ typ: t.k, x, y, flip: rnd() < 0.5 });
  }
  ents.sort((a, b) => (a.y + typVon(a.typ).aabb[1]) - (b.y + typVon(b.typ).aabb[1]));
  return ents;
}
// Die 10 LEBENDEN in Tafel D setzen den SELBEN Strom fort (90 Zieher fuer die
// 30 Toten sind verbraucht), damit sie nicht auf den Decals kleben.
function aufstellung10() {
  const rnd = macheRnd(SEED);
  for (let i = 0; i < 90; i++) rnd();
  const ents = [];
  for (const r of ROSTER_D_LEBEND) for (let i = 0; i < r.n; i++) {
    const x = 20 + rnd() * (320 - 60);
    const y = 24 + rnd() * (180 - 60);
    ents.push({ typ: r.k, x, y, flip: rnd() < 0.5 });
  }
  ents.sort((a, b) => (a.y + typVon(a.typ).aabb[1]) - (b.y + typVon(b.typ).aabb[1]));
  return ents;
}
// Welche 3 Figuren flashen? Eigener Strom, eigener Startwert, damit der
// Flash-Schalter die Aufstellung nicht anfasst.
function flashAuswahl(anzahl) {
  const rnd = macheRnd(FLASH_SEED);
  const treffer = new Set();
  let schutz = 0;
  while (treffer.size < Math.min(FLASH_FIGUREN, anzahl) && schutz++ < 1000) {
    treffer.add(Math.floor(rnd() * anzahl) % anzahl);
  }
  return treffer;
}

// ---------------------------------------------------------------------------
// 6. Die vier Tafeln
// ---------------------------------------------------------------------------
const decalKey = (t) => (SPRITES[t.k + '_decal'] ? t.k + '_decal' : t.sterbe);
const decalIstPlatzhalter = () => TYPEN.every((t) => !SPRITES[t.k + '_decal']);

function setzeFigur(cv, e, key, idx, opt) {
  const t = typVon(e.typ);
  const g = SPRITES[key];
  const { h: gh, w: gw } = gridInfo(g);
  const ox = Math.round(e.x + t.aabb[0] / 2 - gw / 2);
  const oy = Math.round(e.y + t.aabb[1] - gh);
  zeichneGrid(cv, ox, oy, g, {
    flip: e.flip, owner: idx,
    rim: opt.rim ? rimMaske(g, e.flip) : null,
    flash: opt.flash && opt.flashSet.has(idx) ? flashMaske(g, e.flip) : null,
    istDecal: !!opt.istDecal,
  });
  return { key, ox, oy, gw, gh };
}

function tafelA(boden, opt) {
  const [W, H] = LEINWAND_A;
  const cv = leinwand(W, H); kachle(cv, boden.keys);
  const ents = aufstellung30();
  const flashSet = opt.flash ? flashAuswahl(ents.length) : new Set();
  for (const e of ents) {
    const t = typVon(e.typ);
    schatten(cv, e.x + t.aabb[0] / 2, Math.round(e.y + t.aabb[1] - 1), t.aabb[0], t.aabb[0] >= 18 && t.aabb[1] >= 20);
  }
  const gelegt = ents.map((e, i) => ({ ...e, ...setzeFigur(cv, e, typVon(e.typ).frame0, i, { ...opt, flashSet }) }));
  return { cv, lebend: gelegt, tote: [], flashSet: [...flashSet].sort((a, b) => a - b) };
}

function tafelB(boden, opt) {
  const [W, H] = LEINWAND_B;
  const cv = leinwand(W, H); kachle(cv, boden.keys);
  const ents = [];
  KNAEUEL_REIHEN.forEach((typ, ri) => {
    for (let i = 0; i < KNAEUEL_JE_REIHE; i++) {
      ents.push({ typ, x: KNAEUEL_X0 + i * KNAEUEL_DX + ri * KNAEUEL_VERSATZ, y: KNAEUEL_Y0 + ri * KNAEUEL_DY, flip: false, reihe: ri });
    }
  });
  ents.sort((a, b) => (a.y + typVon(a.typ).aabb[1]) - (b.y + typVon(b.typ).aabb[1]));
  const flashSet = opt.flash ? flashAuswahl(ents.length) : new Set();
  for (const e of ents) {
    const t = typVon(e.typ);
    schatten(cv, e.x + t.aabb[0] / 2, Math.round(e.y + t.aabb[1] - 1), t.aabb[0], t.aabb[0] >= 18 && t.aabb[1] >= 20);
  }
  const gelegt = ents.map((e, i) => ({ ...e, ...setzeFigur(cv, e, typVon(e.typ).frame0, i, { ...opt, flashSet }) }));
  return { cv, lebend: gelegt, tote: [], flashSet: [...flashSet].sort((a, b) => a - b) };
}

// Eine Leiter-Zelle: Boden gekachelt, Figur horizontal zentriert, Fusskante
// gemeinsam auf Zellunterkante minus FUSS_RAND.
function leiterZellen() {
  return [...TYPEN.map((t) => ({ typ: t.k, key: t.frame0, rolle: 'gegner' })),
    { typ: null, key: LEITER_HELD, rolle: 'held' }];
}
function tafelC(boden, opt) {
  const zellen = leiterZellen();
  const cv = leinwand(zellen.length * ZELL_W, ZELL_H);
  kachle(cv, boden.keys);
  const flashSet = opt.flash ? flashAuswahl(zellen.length) : new Set();
  const gelegt = [];
  zellen.forEach((z, i) => {
    const g = SPRITES[z.key];
    const { h: gh, w: gw } = gridInfo(g);
    const ox = i * ZELL_W + ((ZELL_W - gw) >> 1);
    const oy = ZELL_H - FUSS_RAND - gh;
    const t = z.typ ? typVon(z.typ) : null;
    const schattenB = t ? t.aabb[0] : 10;
    schatten(cv, ox + gw / 2, oy + gh - 1, schattenB, t ? (t.aabb[0] >= 18 && t.aabb[1] >= 20) : false);
    zeichneGrid(cv, ox, oy, g, {
      flip: false, owner: i,
      rim: opt.rim ? rimMaske(g, false) : null,
      flash: opt.flash && flashSet.has(i) ? flashMaske(g, false) : null,
    });
    gelegt.push({ typ: z.typ, rolle: z.rolle, key: z.key, x: ox, y: oy, flip: false, ox, oy, gw, gh, zelle: i });
  });
  return { cv, lebend: gelegt, tote: [], flashSet: [...flashSet].sort((a, b) => a - b) };
}

function tafelD(boden, opt) {
  const [W, H] = LEINWAND_D;
  const cv = leinwand(W, H); kachle(cv, boden.keys);
  const tote = aufstellung30();
  const lebend = aufstellung10();
  // Decals liegen flach: kein Schatten, gezeichnet VOR den Lebenden
  // (Spec E-A4: "Decal-Draw ... wird vor den Renderables gezeichnet").
  const gelegtTot = tote.map((e, i) => ({ ...e, ...setzeFigur(cv, e, decalKey(typVon(e.typ)), -1000 - i, { rim: false, flash: false, flashSet: new Set(), istDecal: true }) }));
  const flashSet = opt.flash ? flashAuswahl(lebend.length) : new Set();
  for (const e of lebend) {
    const t = typVon(e.typ);
    schatten(cv, e.x + t.aabb[0] / 2, Math.round(e.y + t.aabb[1] - 1), t.aabb[0], t.aabb[0] >= 18 && t.aabb[1] >= 20);
  }
  const gelegtLeb = lebend.map((e, i) => ({ ...e, ...setzeFigur(cv, e, typVon(e.typ).frame0, i, { ...opt, flashSet }) }));
  return { cv, lebend: gelegtLeb, tote: gelegtTot, flashSet: [...flashSet].sort((a, b) => a - b) };
}

const TAFELN = {
  A: { id: 'A_feld', name: 'Tafel A "Feld"', bau: tafelA,
    was: '30 Gegner deterministisch gestreut (seed 12345), Y-sortiert, mit Weichschatten — die Spielsituation.' },
  B: { id: 'B_knaeuel', name: 'Tafel B "Knaeuel"', bau: tafelB,
    was: '20 Gegner in 4 Reihen mit 9 px X-Abstand — erzwungener Ueberlapp, der Haertefall.' },
  C: { id: 'C_leiter', name: 'Tafel C "Leiter"', bau: tafelC,
    was: '5 Gegner-Spalten (Roster-Reihenfolge, eingefroren) + Held als Massstab, fussbuendig.' },
  D: { id: 'D_schlachtfeld', name: 'Tafel D "Schlachtfeld"', bau: tafelD,
    was: '30 Decals (Bodenbedeckung) + 10 lebende Gegner.' },
};

// ---------------------------------------------------------------------------
// 7. MESSUNG (Spec E-B10)
// ---------------------------------------------------------------------------
const istSchwarz = (ch) => SCHWARZ.includes(ch);

function messe(tafelId, boden, ergebnis, opt) {
  const cv = ergebnis.cv;
  const flaeche = cv.w * cv.h;

  // (1) Schwarz-Sprenkel-Anteil + (2) Ueberlapp-Rate + (6) Flaechenanteil.
  // Gezaehlt wird wie im Prototyp: JEDER opake Texel JEDER lebenden Figur,
  // auch der verdeckte (sonst haengt der Anteil an der Zeichenreihenfolge).
  const belegt = new Map();
  let gegnerTexel = 0, schwarz = 0;
  const jeTyp = {};
  ergebnis.lebend.forEach((e, idx) => {
    const g = SPRITES[e.key];
    const { h, w, at } = gridInfo(g);
    const typ = e.typ || 'held';
    if (!jeTyp[typ]) jeTyp[typ] = { texel: 0, schwarz: 0, figuren: 0 };
    jeTyp[typ].figuren++;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const ch = at(e.flip ? w - 1 - x : x, y);
      if (ch === '.') continue;
      gegnerTexel++; jeTyp[typ].texel++;
      if (istSchwarz(ch)) { schwarz++; jeTyp[typ].schwarz++; }
      const kx = (e.oy + y) * 4096 + (e.ox + x);
      if (!belegt.has(kx)) belegt.set(kx, []);
      belegt.get(kx).push(idx);
    }
  });
  let verdeckt = 0; const beruehrt = new Set();
  for (const v of belegt.values()) if (v.length > 1) { verdeckt += v.length - 1; for (const i of v) beruehrt.add(i); }

  // (3) TRENN-RATE NEU (Spec E-B10). Grenzkante = 4er-Nachbarpaar, dessen
  // beide sichtbare Texel ZWEI VERSCHIEDENEN Figuren gehoeren und BEIDE
  // Material sind (k/n raus). Getrennt bei Rim ODER |dL| >= 25 ODER dE00 >= 20.
  let kanten = 0, getrennt = 0, durchRim = 0, durchDL = 0, durchDE = 0;
  let summeDLKanten = 0;
  const lab = new Map();
  const labVon = (i) => {
    const rgb = getPx(cv, i); const k = (rgb[0] << 16) | (rgb[1] << 8) | rgb[2];
    if (!lab.has(k)) lab.set(k, labRGB(rgb[0], rgb[1], rgb[2]));
    return lab.get(k);
  };
  for (let y = 0; y < cv.h; y++) for (let x = 0; x < cv.w; x++) {
    const i = y * cv.w + x;
    if (cv.owner[i] < 0 || cv.decal[i]) continue;
    for (const [dx, dy] of [[1, 0], [0, 1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx >= cv.w || ny >= cv.h) continue;
      const j = ny * cv.w + nx;
      if (cv.owner[j] < 0 || cv.decal[j]) continue;
      if (cv.owner[i] === cv.owner[j]) continue;
      if (istSchwarz(cv.zeichen[i]) || istSchwarz(cv.zeichen[j])) continue;
      kanten++;
      const a = getPx(cv, i), b = getPx(cv, j);
      const dL = Math.abs(L601(...a) - L601(...b));
      summeDLKanten += dL;
      const rim = cv.rim[i] === 1 || cv.rim[j] === 1;
      const de = dE00(labVon(i), labVon(j));
      const sep = rim || dL >= TRENN_DL || de >= TRENN_DE00;
      if (sep) {
        getrennt++;
        if (rim) durchRim++; else if (dL >= TRENN_DL) durchDL++; else durchDE++;
      }
    }
  }

  // (4) ZWEITGATE: mittlere |dL| benachbarter Koerper-L der in dieser Tafel
  // tatsaechlich stehenden Gegner-TYPEN (Koerper-L = E5, Kontur + Rim raus).
  const typenHier = TYPEN.filter((t) => ergebnis.lebend.some((e) => e.typ === t.k));
  const koerper = typenHier.map((t) => ({ typ: t.k, key: t.frame0, ...koerperL([t.frame0], t.rim) }));
  const sortiert = koerper.slice().sort((p, q) => p.L - q.L);
  const stufen = [];
  for (let i = 1; i < sortiert.length; i++) {
    stufen.push({ von: sortiert[i - 1].typ, nach: sortiert[i].typ, dL: Math.abs(sortiert[i].L - sortiert[i - 1].L) });
  }
  const mittlereDL = stufen.length ? stufen.reduce((s, p) => s + p.dL, 0) / stufen.length : null;
  // ZWEITE LESART desselben Zweitgates, weil E-B10 "benachbarte Typen" nicht
  // definiert: hier BILDNACHBARN statt Leiternachbarn — alle Paare LEBENDER
  // Figuren VERSCHIEDENEN Typs, deren Texelmengen sich ueberschneiden oder
  // 4er-beruehren, gemittelt ueber |dL| ihrer Typ-Koerper-L. P0.d/Fable
  // entscheidet, welche Lesart das Gate traegt; beide stehen im JSON.
  const kl = {}; for (const k of koerper) kl[k.typ] = k.L;
  const paare = new Set();
  const besetzer = new Map();
  ergebnis.lebend.forEach((e, idx) => {
    const g = SPRITES[e.key]; const { h, w, at } = gridInfo(g);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (at(e.flip ? w - 1 - x : x, y) === '.') continue;
      const key = (e.oy + y) * 4096 + (e.ox + x);
      if (!besetzer.has(key)) besetzer.set(key, []);
      besetzer.get(key).push(idx);
    }
  });
  for (const [key, liste] of besetzer) {
    const umfeld = new Set(liste);
    for (const d of [1, -1, 4096, -4096]) { const nb = besetzer.get(key + d); if (nb) for (const i of nb) umfeld.add(i); }
    const arr = [...umfeld].sort((a, b) => a - b);
    for (let a = 0; a < arr.length; a++) for (let b = a + 1; b < arr.length; b++) paare.add(arr[a] + ':' + arr[b]);
  }
  let paarSum = 0, paarN = 0;
  for (const pk of [...paare].sort()) {
    const [a, b] = pk.split(':').map(Number);
    const ta = ergebnis.lebend[a].typ, tb = ergebnis.lebend[b].typ;
    if (!ta || !tb || ta === tb || kl[ta] === undefined || kl[tb] === undefined) continue;
    paarSum += Math.abs(kl[ta] - kl[tb]); paarN++;
  }
  const mittlereDLBild = paarN ? paarSum / paarN : null;

  // (5) DECAL-BODENBEDECKUNG (Kennzahl, Gate gestrichen — Review M15).
  let decalTexelGezeichnet = 0, decalTexelSichtbar = 0;
  for (const d of ergebnis.tote) {
    const g = SPRITES[d.key]; const { h, w, at } = gridInfo(g);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (at(d.flip ? w - 1 - x : x, y) !== '.') decalTexelGezeichnet++;
  }
  for (let i = 0; i < flaeche; i++) if (cv.decal[i]) decalTexelSichtbar++;

  const r = (v, n = 2) => (v === null || v === undefined ? null : Math.round(v * 10 ** n) / 10 ** n);
  return {
    tafel: tafelId, boden: boden.name, leinwand: [cv.w, cv.h],
    varianten: { rim: !!opt.rim, flash: !!opt.flash, grau: !!opt.grau },
    figuren: ergebnis.lebend.length,
    // --- E-B10 Messgroessen ---
    schwarz_sprenkel_anteil_pct: r(100 * schwarz / gegnerTexel),
    schwarz_texel: schwarz, gegner_texel: gegnerTexel,
    ueberlapp_rate_pct: r(100 * beruehrt.size / ergebnis.lebend.length),
    ueberlapp_texel: verdeckt,
    trennrate_pct: kanten ? r(100 * getrennt / kanten) : null,
    trennrate_grenzkanten: kanten, trennrate_getrennt: getrennt,
    trennrate_ursache: { rim: durchRim, dL: durchDL, dE00: durchDE },
    trennrate_mittlere_dL_je_grenzkante: kanten ? r(summeDLKanten / kanten) : null,
    mittlere_dL_benachbarter_koerperL: r(mittlereDL),
    mittlere_dL_benachbarter_koerperL_lesart: 'Leiternachbarn (nach Koerper-L sortierte Typen)',
    mittlere_dL_bildnachbarn: r(mittlereDLBild),
    mittlere_dL_bildnachbarn_paare: paarN,
    koerper_L_je_typ: koerper.map((k) => ({ typ: k.typ, key: k.key, koerper_L_e5: r(k.L), texel: k.texel })),
    wertleiter_stufen: stufen.map((s) => ({ von: s.von, nach: s.nach, dL: r(s.dL) })),
    decal_bodenbedeckung_pct: r(100 * decalTexelSichtbar / flaeche),
    decal_texel_gezeichnet: decalTexelGezeichnet, decal_texel_sichtbar: decalTexelSichtbar,
    decal_anzahl: ergebnis.tote.length,
    flaechenanteil_pct: r(100 * belegt.size / flaeche),
    je_typ: Object.keys(jeTyp).sort().map((t) => ({
      typ: t, figuren: jeTyp[t].figuren, texel: jeTyp[t].texel, schwarz: jeTyp[t].schwarz,
      schwarz_pct: r(100 * jeTyp[t].schwarz / jeTyp[t].texel),
    })),
    flash_figuren_index: ergebnis.flashSet,
  };
}

// ---------------------------------------------------------------------------
// 8. SQUINT-BLIND (Spec E-B10 / Review m7)
// ---------------------------------------------------------------------------
// Der Juror bekommt die Squint-Kacheln der 5 Gegner-Typen in seed-gewuerfelter
// Reihenfolge, OHNE Legende, in Farbe UND Graustufe, bei 1x und 6x. Die
// Aufloesung steht in einer SEPARATEN Datei, die der Juror erst nach dem
// Benennen oeffnet.
function blindReihenfolge(n, start) {
  const rnd = macheRnd(start);
  const idx = [...Array(n).keys()];
  for (let i = n - 1; i > 0; i--) {           // Fisher-Yates, deterministisch
    const j = Math.floor(rnd() * (i + 1)) % (i + 1);
    const t = idx[i]; idx[i] = idx[j]; idx[j] = t;
  }
  return idx;
}
function blindKachel(boden, typ, opt) {
  const cv = leinwand(ZELL_W, ZELL_H);
  kachle(cv, boden.keys);
  const g = SPRITES[typ.frame0];
  const { h: gh, w: gw } = gridInfo(g);
  const ox = (ZELL_W - gw) >> 1, oy = ZELL_H - FUSS_RAND - gh;
  schatten(cv, ox + gw / 2, oy + gh - 1, typ.aabb[0], typ.aabb[0] >= 18 && typ.aabb[1] >= 20);
  zeichneGrid(cv, ox, oy, g, { flip: false, owner: 0, rim: opt.rim ? rimMaske(g, false) : null, flash: null });
  return cv;
}

// ---------------------------------------------------------------------------
// 9. Hauptlauf
// ---------------------------------------------------------------------------
function arg(name, fallback) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : fallback;
}
const flag = (name) => process.argv.includes('--' + name);
const sha = (b) => createHash('sha256').update(b).digest('hex');
const n1 = (v) => (v === null || v === undefined ? '   -  ' : v.toFixed(1).padStart(6));

function main() {
  const etikett = arg('etikett', 'vorher');
  if (etikett !== 'vorher' && etikett !== 'nachher') {
    console.log(`FEHLER: --etikett muss 'vorher' oder 'nachher' sein (bekommen: ${etikett})`);
    process.exitCode = 1; return;
  }
  const tafelWahl = arg('tafel', 'alle').toUpperCase();
  if (!['A', 'B', 'C', 'D', 'ALLE'].includes(tafelWahl)) {
    console.log(`FEHLER: --tafel muss A|B|C|D|alle sein (bekommen: ${tafelWahl})`);
    process.exitCode = 1; return;
  }
  const bodenWahl = arg('boden', 'beide').toLowerCase();
  if (!['gruft', 'gras', 'beide'].includes(bodenWahl)) {
    console.log(`FEHLER: --boden muss gruft|gras|beide sein (bekommen: ${bodenWahl})`);
    process.exitCode = 1; return;
  }
  const opt = { rim: flag('rim'), flash: flag('flash'), grau: flag('grau') };
  const blind = flag('squintblind');
  const nurmessen = flag('nurmessen');
  const outArg = arg('out', '.tmp/gp7ch2_p0c/bogen');
  const outDir = isAbsolute(outArg) ? outArg : resolve(REPO, outArg);
  mkdirSync(outDir, { recursive: true });

  const varSuffix = (opt.rim ? '_rim' : '') + (opt.flash ? '_flash' : '') + (opt.grau ? '_grau' : '');
  const tafeln = tafelWahl === 'ALLE' ? ['A', 'B', 'C', 'D'] : [tafelWahl];
  const boeden = bodenWahl === 'beide' ? BOEDEN : BOEDEN.filter((b) => b.name === bodenWahl);

  // --- Vorpruefung: Figuren-Keys, Kachel-Keys, Palettenzeichen --------------
  let fehler = 0;
  const alleKeys = [...TYPEN.map((t) => t.frame0), ...TYPEN.map((t) => decalKey(t)), LEITER_HELD];
  for (const k of alleKeys) {
    if (!SPRITES[k]) { console.log(`FEHLER: Figuren-Key fehlt: ${k}`); fehler++; continue; }
    for (const row of SPRITES[k]) for (const ch of row) {
      if (ch !== '.' && !PALETTE[ch]) { console.log(`FEHLER: Grid ${k} nutzt Nicht-Paletten-Zeichen '${ch}'`); fehler++; }
    }
  }
  if (!PALETTE[RIM_SIM_TON]) { console.log(`FEHLER: Rim-Simulationston '${RIM_SIM_TON}' fehlt in der Palette`); fehler++; }
  const bodenInfo = [];
  for (const b of BOEDEN) {
    let opak = 0, trans = 0, sum = 0;
    for (const key of b.keys) {
      const g = TILE_ART[key];
      if (!g) { console.log(`FEHLER: Kachel-Key fehlt: ${key}`); fehler++; continue; }
      for (const row of g) for (const ch of row) {
        if (ch === '.') { trans++; continue; }
        opak++; sum += L601(...hexRgb(PALETTE[ch]));
      }
    }
    const L = opak ? sum / opak : 0;
    const ok = trans === 0 && Math.abs(L - b.sollL) < 0.05;
    bodenInfo.push({ ...b, opak, trans, L });
    console.log(`BODEN-CHECK ${ok ? 'OK' : 'ABWEICHUNG'}  ${b.name.padEnd(5)} ${b.keys.length} Kachel(n)  opak ${opak}  transparent ${trans}  L(Rec601) ${L.toFixed(2)}  soll ${b.sollL.toFixed(2)}`);
    if (!ok) fehler++;
  }
  // Positivkontrolle: reproduziert das Werkzeug die Teil-A-Anker (Koerper-L E5)?
  const ANKER_TEIL_A = { skeleton: 162.5, ghoul: 96.0, hound: 75.4, rust: 112.7, warden: 139.5 };
  const ALLE_GRIDS = {
    skeleton: ['skeleton_0', 'skeleton_1', 'skeleton_die'],
    ghoul: ['ghoul_0', 'ghoul_1', 'ghoul_die'],
    hound: ['hound_0', 'hound_1', 'hound_telegraph', 'hound_leap', 'hound_down', 'hound_die'],
    rust: ['rust_0', 'rust_1', 'rust_die'],
    warden: ['warden_idle', 'warden_walk_0', 'warden_walk_1', 'warden_windup_a', 'warden_windup_b',
      'warden_dash', 'warden_stuck', 'warden_summon', 'warden_die'],
  };
  const kontrolle = TYPEN.map((t) => {
    const m = koerperL(ALLE_GRIDS[t.k], t.rim);
    return { typ: t.k, gemessen: Math.round(m.L * 10) / 10, anker_teilA: ANKER_TEIL_A[t.k], abweichung: Math.round((m.L - ANKER_TEIL_A[t.k]) * 100) / 100, texel: m.texel };
  });
  for (const k of kontrolle) {
    console.log(`ANKER-KONTROLLE ${Math.abs(k.abweichung) <= 0.5 ? 'OK' : 'ABWEICHUNG'}  ${k.typ.padEnd(9)} Koerper-L(E5) ${k.gemessen.toFixed(1)}  Teil-A-Anker ${k.anker_teilA.toFixed(1)}  d ${k.abweichung.toFixed(2)}`);
  }
  if (fehler > 0) { console.log(`FEHLER: ${fehler} Vorpruefung(en) gescheitert — nichts geschrieben.`); process.exitCode = 1; return; }

  // --- Rendern + Messen -----------------------------------------------------
  const dateien = [];
  const messungen = [];
  const anordnung = [];
  for (const tk of tafeln) {
    const T = TAFELN[tk];
    for (const b of boeden) {
      const erg = T.bau(b, opt);
      messungen.push(messe(T.id, b, erg, opt));
      if (b === boeden[0]) {
        anordnung.push({
          tafel: T.id, leinwand: [erg.cv.w, erg.cv.h], was: T.was,
          figuren: erg.lebend.map((e, i) => ({
            nr: i + 1, typ: e.typ || 'held', key: e.key, ox: e.ox, oy: e.oy,
            grid: e.gw + 'x' + e.gh, flip: e.flip, fuss_y: e.oy + e.gh,
          })),
          decals: erg.tote.map((d, i) => ({ nr: i + 1, typ: d.typ, key: d.key, ox: d.ox, oy: d.oy, flip: d.flip })),
        });
      }
      if (nurmessen) continue;
      const eins = opt.grau ? graustufen(erg.cv) : erg.cv;
      const sechs = nnHoch(eins, ZOOM);
      const squint = nnHoch(nnHoch(nnHalb(eins), 2), ZOOM);
      for (const [tag, cv] of [['1x', eins], ['6x', sechs], ['squint', squint]]) {
        const name = `horden_bogen_${etikett}_${T.id}_${b.name}${varSuffix}_${tag}.png`;
        const bytes = pngBytes(cv.w, cv.h, cv.buf);
        writeFileSync(join(outDir, name), bytes);
        dateien.push({ name, w: cv.w, h: cv.h, bytes: bytes.length, sha: sha(bytes) });
      }
    }
  }

  // --- Squint-blind ---------------------------------------------------------
  let blindPlan = null;
  if (blind && !nurmessen) {
    blindPlan = [];
    for (let bIdx = 0; bIdx < boeden.length; bIdx++) {
      const b = boeden[bIdx];
      // je Boden EIGENE Reihenfolge (deterministisch aus dem Bodenindex), damit
      // der Juror die zweite Serie nicht aus der ersten ableiten kann.
      const ordnung = blindReihenfolge(TYPEN.length, SEED + BOEDEN.findIndex((x) => x.name === b.name) * 7919);
      ordnung.forEach((tIdx, pos) => {
        const typ = TYPEN[tIdx];
        const roh = blindKachel(b, typ, opt);
        const sq = nnHoch(nnHalb(roh), 2);
        for (const [farbTag, cv0] of [['farbe', sq], ['grau', graustufen(sq)]]) {
          for (const [zTag, cv] of [['1x', cv0], ['6x', nnHoch(cv0, ZOOM)]]) {
            const name = `horden_blind_${etikett}_${b.name}_${farbTag}_${zTag}_${String(pos + 1).padStart(2, '0')}.png`;
            const bytes = pngBytes(cv.w, cv.h, cv.buf);
            writeFileSync(join(outDir, name), bytes);
            dateien.push({ name, w: cv.w, h: cv.h, bytes: bytes.length, sha: sha(bytes) });
          }
        }
        blindPlan.push({ boden: b.name, position: pos + 1, typ: typ.k, key: typ.frame0 });
      });
    }
    const al = [];
    al.push(`SQUINT-BLIND AUFLOESUNG (${etikett}) — NUR FUER DEN JUROR, NACH dem Benennen oeffnen.`);
    al.push('Spec: design/SPEC_GP7CH2.md Rev 2 E-B10 ("SQUINT BLIND"), Review m7.');
    al.push('Verfahren: der Juror sieht horden_blind_*_<01..05>.png OHNE Legende, in FARBE und in');
    al.push('GRAUSTUFE, bei 1x und 6x, und benennt je Kachel die Gegner-Sorte. Ein Typ gilt als');
    al.push('benannt, wenn er in Farbe UND Graustufe getroffen wird. Ziel: 1x >= 4/5, 6x 5/5.');
    al.push('Der Juror ist NICHT der Zeichner.');
    al.push('');
    for (const p of blindPlan) al.push(`  ${p.boden.padEnd(6)} Kachel ${String(p.position).padStart(2, '0')}  =  ${p.typ.padEnd(9)} (${p.key})`);
    writeFileSync(join(outDir, `horden_blind_${etikett}_aufloesung.txt`), al.join('\n') + '\n');
  }

  // --- Messung als JSON -----------------------------------------------------
  const quellen = ['game/js/art/sprites_figuren.js', 'game/js/art/sprites_tiles.js', 'game/js/art/sprites.js', 'game/js/art/palette.js']
    .map((p) => ({ p, sha: sha(readFileSync(resolve(REPO, p))) }));
  const jsonName = `horden_bogen_${etikett}_messung${varSuffix}.json`;
  const json = {
    werkzeug: 'tools/horden_bogen.mjs', werkzeug_rev: 1, etikett,
    eingefroren: {
      seed: SEED, roster: TYPEN.map((t) => ({ typ: t.k, n: t.n, frame0: t.frame0, aabb: t.aabb })),
      kachelformel: '(tx*7 + ty*11) % n', leinwand_A: LEINWAND_A, leinwand_B: LEINWAND_B, leinwand_D: LEINWAND_D,
      y_sort: 'y + aabb.h', schattenprofile: 'wie Prototyp horde.mjs',
      decal_platzhalter: decalIstPlatzhalter(),
      decal_keys: TYPEN.map((t) => ({ typ: t.k, key: decalKey(t) })),
    },
    formeln: {
      schwarz_sprenkel_anteil: 'k/n-Texel / alle opaken Texel aller LEBENDEN Figuren der Szene (auch verdeckte), in Prozent. Das IST zugleich die in E-B10 geforderte Szenen-Schwarz-KENNZAHL (gewichtetes Mittel ueber die Typen; die Hund-Ausnahme <= 30 ist mitgerechnet, siehe je_typ).',
      ueberlapp_rate: 'Anteil lebender Figuren, die mindestens 1 Texelposition mit einer anderen teilen (Kennzahl, kein Gate)',
      trennrate: `Grenzkante = 4er-Nachbarpaar sichtbarer Texel ZWEIER VERSCHIEDENER Figuren, BEIDE Material (k/n raus). Getrennt bei Rim ODER |dL| >= ${TRENN_DL} ODER dE00 >= ${TRENN_DE00}. Decal-Texel zaehlen nicht mit.`,
      mittlere_dL_benachbarter_koerperL: 'LESART 1 (Leiternachbarn): Koerper-L (E5: Kontur + Rim-Toene raus) je Typ des Frame-0-Grids, aufsteigend sortiert, Mittel der |dL| benachbarter Stufen (Zweitgate E-B10, Ziel >= 15)',
      mittlere_dL_bildnachbarn: 'LESART 2 (Bildnachbarn, weil E-B10 "benachbarte Typen" nicht definiert): Mittel der |dL| ueber alle Paare lebender Figuren VERSCHIEDENEN Typs, die sich im Bild ueberschneiden oder 4er-beruehren',
      decal_bodenbedeckung: 'sichtbare Decal-Texel / Bildflaeche in Prozent (Kennzahl; Gate gestrichen, Review M15)',
      flaechenanteil: 'belegte Texelpositionen aller lebenden Figuren / Bildflaeche in Prozent (Kennzahl fuer die Perf-Abschaetzung)',
      koerper_L_e5: 'Mittel der Rec.601-Luma ueber opake Texel OHNE Kontur (E5) und OHNE Rim-Toene — Formel aus .tmp/gp7ch_p0/figuren_messung.mjs:922',
    },
    positivkontrolle_koerperL_teilA: kontrolle,
    boeden: bodenInfo.map((b) => ({ name: b.name, keys: b.keys, L: Math.round(b.L * 100) / 100, ort: b.ort })),
    varianten: { rim: opt.rim, flash: opt.flash, grau: opt.grau, blind },
    tafeln: messungen,
    anordnung,
    blind_plan: blindPlan,
    dateien: dateien.map((d) => ({ name: d.name, w: d.w, h: d.h, bytes: d.bytes, sha256: d.sha })),
    provenienz: quellen.map((q) => ({ datei: q.p, sha256: q.sha })),
  };
  writeFileSync(join(outDir, jsonName), JSON.stringify(json, null, 1) + '\n');

  // --- Legende --------------------------------------------------------------
  const z = [];
  z.push(`HORDEN-BOGEN ${etikett.toUpperCase()} — Legende (erzeugt von tools/horden_bogen.mjs, Rev 1)`);
  z.push('Spec: design/SPEC_GP7CH2.md Rev 2 E-C6 / E-B10 / E-A2 / E-B9,');
  z.push('      design/GP7CH2_LANDKARTE_C_ZIELBILD.md Sec. 5, Review B5/M11/M15/m4/m7.');
  z.push('Herkunft: gehaertet aus .tmp/gp7ch_ch2_sonde/horde.mjs + knaeuel.mjs.');
  z.push('');
  z.push('SCHALTER DIESES LAUFS');
  z.push(`  --etikett ${etikett}   --tafel ${tafelWahl}   --boden ${bodenWahl}`);
  z.push(`  --rim ${opt.rim ? 'AN' : 'aus'}   --flash ${opt.flash ? 'AN' : 'aus'}   --grau ${opt.grau ? 'AN' : 'aus'}   --squintblind ${blind ? 'AN' : 'aus'}   --nurmessen ${nurmessen ? 'AN' : 'aus'}`);
  z.push('');
  z.push('EINGEFRORENE ANORDNUNG (Spec E-C6 — kein Schalter, Aenderung verschiebt ALLE Positionen)');
  z.push(`  seed ${SEED}; Roster ${TYPEN.map((t) => t.n + ' ' + t.k).join(' / ')}; Frame 0 je Figur;`);
  z.push('  Kachelsatz Gruft = stone_floor + _v1/_v2/_v3 + _cracked, Formel (tx*7 + ty*11) % n;');
  z.push(`  Leinwand Tafel A/D ${LEINWAND_A.join('x')}, Tafel B ${LEINWAND_B.join('x')}, Tafel C ${leiterZellen().length * ZELL_W}x${ZELL_H};`);
  z.push('  Y-Sort nach y + aabb.h; Schattenprofile wie im Prototyp; kein Fussvolk (Spec E-C1).');
  z.push('  Streuung: x = 20 + rnd()*(320-60), y = 24 + rnd()*(180-60), flip = rnd() < 0.5,');
  z.push('  je Figur 3 Zieher, Typ-Reihenfolge wie im Roster (Review M11).');
  z.push('');
  z.push('TAFELN');
  for (const tk of tafeln) z.push(`  ${TAFELN[tk].id.padEnd(16)} ${TAFELN[tk].was}`);
  z.push('');
  z.push('BOEDEN (echte Kacheln, gekachelt — keine Flachfarbe)');
  for (const b of bodenInfo) z.push(`  ${b.name.padEnd(6)} L(Rec601) ${b.L.toFixed(2)}  ${b.keys.join(', ')}  — ${b.ort}`);
  z.push('');
  z.push('DARSTELLUNGEN  1x = Spielaufloesung; 6x = Nearest Neighbour x6;');
  z.push('  squint = 1x per NN 50 % runter (Quelltexel 2x/2y), dann zurueck auf 1x-Mass und x6 —');
  z.push('  deckungsgleich mit der 6x-Datei, zum pixelgenauen Uebereinanderlegen.');
  z.push('  KEINE Beschriftung im Bild (kein Chrom, das die Messung verunreinigt oder den');
  z.push('  Blindtest verraet) — die Anordnung steht unten und vollstaendig im Mess-JSON.');
  z.push('');
  z.push('SIMULATIONEN (deklariert — das ist KEINE Kunst und KEIN Engine-Code)');
  z.push(`  --rim   : oberster opaker Texel je Spalte + linkester je Zeile des dargestellten`);
  z.push(`            Grids bekommt den kalten Rim-Ton '${RIM_SIM_TON}' (L 205,1). Muster aus knaeuel.mjs`);
  z.push('            (dort Ton 1); Ton nach E-B9/Review m4, weil nur er im Graustufen-Squint');
  z.push("            gegen 'b' (L 203,3) bestehen bleibt.");
  z.push(`  --flash : GEOMETRISCHE Kontur-Maske nach E-A2 — Kontur-Texel fallen aus der Maske,`);
  z.push(`            geflasht wird der Innenraum mit ${FLASH_HEX} bei Alpha ${FLASH_ALPHA}. Der Umriss`);
  z.push(`            bleibt schwarz. Getroffen werden ${FLASH_FIGUREN} Figuren, gezogen aus einem`);
  z.push(`            EIGENEN Strom (seed ${FLASH_SEED}), damit der Schalter die Aufstellung nicht`);
  z.push('            verschiebt. Der Prototyp-Flash (Vollflaeche inkl. Umriss) ist NICHT gebaut.');
  z.push('  --grau  : Rec.601-Graustufen, NUR auf das fertige Bild. Die Messzahlen aendern sich');
  z.push('            dadurch NICHT (sie rechnen auf den Farbtexeln).');
  z.push('');
  z.push('MESSGROESSEN (Spec E-B10) — vollstaendig mit Rohzaehlern im Mess-JSON');
  z.push('  Tafel            Boden   Schwarz%  Ueberl%  Trenn%  Kanten  mdL(KL)  mdL(Bild)  Decal%  Flaeche%');
  for (const m of messungen) {
    z.push('  ' + m.tafel.padEnd(16) + m.boden.padEnd(8) + n1(m.schwarz_sprenkel_anteil_pct) + '  '
      + n1(m.ueberlapp_rate_pct) + '  ' + n1(m.trennrate_pct) + '  ' + String(m.trennrate_grenzkanten).padStart(6)
      + '  ' + n1(m.mittlere_dL_benachbarter_koerperL) + '  ' + n1(m.mittlere_dL_bildnachbarn) + '  ' + n1(m.decal_bodenbedeckung_pct) + '  ' + n1(m.flaechenanteil_pct));
  }
  z.push('');
  z.push('POSITIVKONTROLLE  Koerper-L (E5) ueber ALLE Grids gegen die Anker aus Teil A 1.1');
  for (const k of kontrolle) z.push(`  ${k.typ.padEnd(9)} gemessen ${k.gemessen.toFixed(1)}  Anker ${k.anker_teilA.toFixed(1)}  Abweichung ${k.abweichung.toFixed(2)}  (${k.texel} Texel)`);
  z.push('');
  z.push('ANORDNUNG JE TAFEL (Zeichenreihenfolge = Y-Sort; spaetere Figur liegt vorn)');
  for (const a of anordnung) {
    z.push(`  ${a.tafel}  ${a.leinwand.join('x')}  ${a.figuren.length} lebend, ${a.decals.length} Decal(s)`);
    for (const f of a.figuren) z.push(`    ${String(f.nr).padStart(2)}  ${f.typ.padEnd(9)} ${f.key.padEnd(14)} ox=${String(f.ox).padStart(3)} oy=${String(f.oy).padStart(3)} ${f.grid.padEnd(6)} flip=${f.flip ? 'j' : 'n'} fuss_y=${f.fuss_y}`);
    if (a.decals.length) {
      z.push('    Decals (flach, ohne Schatten, vor den Lebenden gezeichnet):');
      for (const d of a.decals) z.push(`    D${String(d.nr).padStart(2)}  ${d.typ.padEnd(9)} ${d.key.padEnd(14)} ox=${String(d.ox).padStart(3)} oy=${String(d.oy).padStart(3)} flip=${d.flip ? 'j' : 'n'}`);
    }
  }
  z.push('');
  if (decalIstPlatzhalter()) {
    z.push('DEKLARATION DECALS: es gibt heute KEIN einziges *_decal-Grid. Tafel D zeichnet');
    z.push('  ersatzweise die *_die-Grids als PLATZHALTER. Die Bodenbedeckung ist damit eine');
    z.push('  OBERGRENZE (ein echtes Decal ist flacher, <= 6 Zeilen, E-B9). Der Warden bekommt');
    z.push('  laut Spec Sec.8 gar kein Decal — im Nachher-Lauf faellt seine Leiche ersatzlos weg,');
    z.push('  aus 30 Platzhaltern werden 29 Decals.');
    z.push('');
  }
  z.push('DATEIEN (Mass, Bytes, sha256)');
  for (const d of dateien) z.push(`  ${d.name.padEnd(56)} ${String(d.w).padStart(5)}x${String(d.h).padStart(4)}  ${String(d.bytes).padStart(8)} B  ${d.sha}`);
  z.push(`  ${jsonName.padEnd(56)} (Mess-JSON)`);
  z.push('');
  z.push('PROVENIENZ (sha256 der Art-Quellen, aus denen dieser Bogen gerendert wurde)');
  for (const q of quellen) z.push(`  ${q.p.padEnd(34)} ${q.sha}`);
  const legName = `horden_bogen_${etikett}_legende${varSuffix}.txt`;
  writeFileSync(join(outDir, legName), z.join('\n') + '\n');

  for (const d of dateien) console.log(`GESCHRIEBEN ${d.name.padEnd(56)} ${d.w}x${d.h}  ${d.bytes} B  sha256 ${d.sha}`);
  console.log(`GESCHRIEBEN ${jsonName}`);
  console.log(`GESCHRIEBEN ${legName}`);
  if (blind && !nurmessen) console.log(`GESCHRIEBEN horden_blind_${etikett}_aufloesung.txt`);
  for (const m of messungen) {
    console.log(`MESSUNG ${m.tafel.padEnd(16)} ${m.boden.padEnd(6)} schwarz ${n1(m.schwarz_sprenkel_anteil_pct)} %  ueberlapp ${n1(m.ueberlapp_rate_pct)} %  trenn ${n1(m.trennrate_pct)} % (${m.trennrate_getrennt}/${m.trennrate_grenzkanten})  mdL ${n1(m.mittlere_dL_benachbarter_koerperL)}/${n1(m.mittlere_dL_bildnachbarn)}  decal ${n1(m.decal_bodenbedeckung_pct)} %  flaeche ${n1(m.flaechenanteil_pct)} %`);
  }
  console.log(`HORDEN-BOGEN FERTIG (etikett=${etikett}, ${dateien.length} PNG + 1 JSON + 1 Legende, Ziel ${outDir})`);
}

main();
