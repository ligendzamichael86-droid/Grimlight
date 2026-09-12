#!/usr/bin/env node
// =============================================================================
// tools/figuren_bogen.mjs — GP7-CH-1 PHASE 0, Schritt P0.c (Werkzeug)
//                           und P0.e (Referenz-Lauf).   WERKZEUG-REV 2
// =============================================================================
// Spec: design/SPEC_GP7CH1.md E9 (Umfang) + E10 (P0.c/P0.e),
//       Review-Fixes M15/M16/m8 und Nachfix-Befund R5 (BINDEND).
//
// REV 2 (Nachfix R5): die Held-Zeile fuehrt jetzt zusaetzlich die drei
// Attack-Frames (je Richtung direkt hinter deren Lauf-Frames) und die zwei
// Die-Frames; sword_slash_down/up/side stehen in einer eigenen Mini-Zeile
// darunter. Damit deckt der Bogen alle 35 Grids ab, die Spec E9 fuer
// Phase 1a/1b in den Umfang nimmt (20 Held+Klinge, 15 NPC) — Rev 1 hatte
// nur 27. Der Referenz-Lauf in design/referenz/ wurde mit Rev 2 neu erzeugt.
//
// WAS DAS IST: ein REINER Node-PNG-Dump der Figuren-Grids auf ECHTEM,
// gekacheltem Boden. KEIN Server, KEIN Browser, KEIN Canvas, KEIN Playwright
// (Review m8). Das Werkzeug LIEST ausschliesslich game/js/art/* und SCHREIBT
// ausschliesslich in das per --out gewaehlte Verzeichnis.
//
// DETERMINISTISCH: keine Zeit, kein Zufall, keine Iteration ueber ungeordnete
// Mengen, keine Pfade im Dateiinhalt. Zwei Laeufe auf demselben Art-Stand
// liefern byte-gleiche PNGs (Beweis: sha256-Vergleich zweier Laeufe).
//
// AUFRUF
//   node tools/figuren_bogen.mjs --modus vorher  --out .tmp/gp7ch_p0/lauf1
//   node tools/figuren_bogen.mjs --modus nachher --out .tmp/gp7ch_p0/nachher
//   (P0.e:) node tools/figuren_bogen.mjs --modus vorher --out design/referenz
//
//   --modus vorher|nachher   NUR das Dateinamens-Etikett des Laufs. Das Werkzeug
//                            rendert IMMER den aktuellen Art-Stand; welcher Stand
//                            das ist, entscheidet der Zeitpunkt des Aufrufs.
//   --out <dir>              Zielverzeichnis (relativ = zur REPO-Wurzel, nicht
//                            zum cwd). Wird angelegt, falls es fehlt.
//
// AUSGABE (Schema M16: figuren_bogen_<vorher|nachher>_<boden>_<1x|6x|squint>.png)
//   12 PNG = 4 Boeden x 3 Darstellungen                       (MENSCHEN-Bogen)
//   12 PNG = figuren_bogen_<modus>_gegner_<boden>_<1x|6x|squint>.png (GEGNER-Bogen)
//    1 TXT = figuren_bogen_<modus>_legende.txt  (Spaltenlegende + Provenienz)
//
// WERKZEUG-REV 3 (GP7-CH-2 P0.c, ADDITIV — Spec SPEC_GP7CH2.md Sec.2 P0.c
// "figuren_bogen um Gruft-Stein-Boden + Gegner-Zeilen"):
//   (a) VIERTER BODEN 'gruft' = stone_floor (L 52,45), die Leitklasse von
//       CATACOMBS / FLUESTERGRUFT / BOSS_KAMMER (Spec E-B1). Die drei
//       DORF-/GRAVEYARD-Boeden bleiben unveraendert.
//   (b) ZWEITER BOGEN mit den GEGNER-Zeilen (alle 27 Gegner-Grids, Schild
//       inbegriffen) als EIGENE Dateien.
//   BEIDES IST ADDITIV: die 9 Menschen-PNG aus Rev 2 (gras/lehm/weg) bleiben
//   BYTE-GLEICH, weil weder das Zeilenraster ZEILEN noch BREITE/HOEHE noch die
//   Zeichenfolge angefasst wurden. Nur die Legenden-TXT waechst (sie ist das
//   Dateimanifest und muss die neuen Dateien fuehren).
//
// ERFOLGS-STRING (Exit-Codes nicht glauben, diesen String greppen):
//   "FIGUREN-BOGEN FERTIG"
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
// 1. ANORDNUNG (eingefroren — VORHER und NACHHER muessen identisch sein)
// ---------------------------------------------------------------------------
// Reihenfolge woertlich nach Spec E10 P0.c:
//   "Held down/up/side dann Bran/Hedda/Corm/Mile/Torwaechter je 0/1/talk"
// ERWEITERT in Werkzeug-Rev 2 (Befund R5, BINDEND): Rev 1 fuehrte nur die
// 12 Lauf-Frames des Helden und deckte damit bloss 27 der 35 Grids ab, die
// Spec E9 fuer Phase 1a/1b in den Umfang nimmt ("1a HELD (17 player_-Grids
// + 3 sword_slash_-Grids — die Klinge gehoert zum Helden; m6)"). Es fehlten
// player_attack_down/up/side, player_die_0/1 und sword_slash_down/up/side.
// Sie stehen jetzt drin:
//   - Attack JE RICHTUNG unmittelbar NACH den vier Lauf-Frames derselben
//     Richtung (down, up, side) — der Hieb liest sich als Fortsetzung des
//     Laufzyklus, nicht als Fremdkoerper am Zeilenende.
//   - Die beiden richtungslosen Sterbe-Frames am Ende der Held-Zeile.
//   - sword_slash als EIGENE MINI-ZEILE (Tag S, 3 Zellen) direkt unter dem
//     Helden: die Klinge gehoert zu ihm (E9/m6), ist aber ein Effekt-Overlay
//     und keine Figur — eigene Zeile haelt beides sichtbar getrennt.
// Die Kontext-Zeile traegt die Gegner (Landkarte C:134 stellt klar: es gibt
// FUENF Gegnertypen, und der Warden/Graveward ist einer davon).
const ZEILEN = [
  {
    tag: 'H', name: 'HELD',
    hinweis: 'je Richtung 4 Lauf-Frames + 1 Attack-Frame (down, up, side), danach die 2 Sterbe-Frames',
    keys: [
      'player_down_0', 'player_down_1', 'player_down_2', 'player_down_3',
      'player_attack_down',
      'player_up_0', 'player_up_1', 'player_up_2', 'player_up_3',
      'player_attack_up',
      'player_side_0', 'player_side_1', 'player_side_2', 'player_side_3',
      'player_attack_side',
      'player_die_0', 'player_die_1',
    ],
  },
  {
    tag: 'S', name: 'SCHWERTHIEB (Mini-Zeile, Effekt-Overlay)',
    hinweis: 'gehoert dem Helden (E9/m6), ist aber Overlay: im Spiel auf der Schwert-Hitbox gezeichnet, nicht fussgebunden — hier liegt es wie alles andere auf der gemeinsamen Fusskante (Chrom)',
    keys: ['sword_slash_down', 'sword_slash_up', 'sword_slash_side'],
  },
  {
    tag: 'N', name: 'NPC',
    keys: [
      'npc_bran_0', 'npc_bran_1', 'npc_bran_talk',
      'npc_hedda_0', 'npc_hedda_1', 'npc_hedda_talk',
      'npc_corm_0', 'npc_corm_1', 'npc_corm_talk',
      'npc_mile_0', 'npc_mile_1', 'npc_mile_talk',
      'npc_torwaechter_0', 'npc_torwaechter_1', 'npc_torwaechter_talk',
    ],
  },
  {
    tag: 'K', name: 'KONTEXT (Gegner)',
    keys: ['skeleton_0', 'ghoul_0', 'hound_0', 'rust_0', 'warden_idle'],
  },
];

// ---------------------------------------------------------------------------
// 1b. GEGNER-ZEILEN (Werkzeug-Rev 3, GP7-CH-2 P0.c) — EIGENER Bogen, eigene
//     Dateien. Reihenfolge = Roster-Reihenfolge der CH-2-Spec (Skelett, Ghul,
//     Grufthund, Rostpanzer, Grabwaechter); je Zeile ALLE Grids der Figur in
//     Animationsreihenfolge, das Sterbe-Grid zuletzt. Die drei shield_*-Grids
//     stehen in der Rost-Zeile, weil das Schild ihm gehoert (Spec E9/Teil C 6.1).
//     Der Grabwaechter fuehrt seine 9 Grids vollstaendig (Eichkoerper, E-C5).
// ---------------------------------------------------------------------------
const ZEILEN_GEGNER = [
  { tag: 'A', name: 'SKELETT (16x16)', keys: ['skeleton_0', 'skeleton_1', 'skeleton_die'] },
  { tag: 'B', name: 'GHUL (16x20)', keys: ['ghoul_0', 'ghoul_1', 'ghoul_die'] },
  { tag: 'C', name: 'GRUFTHUND (16x12)',
    hinweis: 'Lauf 0/1, dann Telegraph, Sprung, Liegen, Sterben',
    keys: ['hound_0', 'hound_1', 'hound_telegraph', 'hound_leap', 'hound_down', 'hound_die'] },
  { tag: 'D', name: 'ROSTPANZER (16x18) + SCHILD',
    hinweis: 'Lauf 0/1, Sterben, danach die drei Schild-Overlays (gehoeren ihm, E9)',
    keys: ['rust_0', 'rust_1', 'rust_die', 'shield_side', 'shield_up', 'shield_down'] },
  { tag: 'W', name: 'GRABWAECHTER (24x32)',
    hinweis: 'Eichkoerper (E-C5): idle, Lauf 0/1, Windup a/b, Dash, Stuck, Summon, Sterben',
    keys: ['warden_idle', 'warden_walk_0', 'warden_walk_1', 'warden_windup_a', 'warden_windup_b',
      'warden_dash', 'warden_stuck', 'warden_summon', 'warden_die'] },
];

// Die ECHTEN Boeden (Spec E10 P0.c / Review M16; 'gruft' additiv in Rev 3).
// L = Rec.601-Luma des
// Kachel-Grids ueber die Palette, exakt die Konvention der Palettentabelle
// (palette.js Kopf) — die Sollwerte stehen in der Spec.
const BOEDEN = [
  { name: 'gras', key: 'grass_g5_00', sollL: 49.9, ort: 'GRAVEYARD-Gras' },
  { name: 'lehm', key: 'dorf_lehm_00', sollL: 72.8, ort: 'DORF-Lehm' },
  { name: 'weg', key: 'path', sollL: 90.9, ort: 'DORF-Weg' },
  // ADDITIV (Rev 3): Gruft-Stein, die Leitklasse der drei Kampfkarten
  // CATACOMBS / FLUESTERGRUFT / BOSS_KAMMER (Spec GP7CH2 E-B1, L 52,5).
  { name: 'gruft', key: 'stone_floor', sollL: 52.45, ort: 'CATACOMBS/FLUESTERGRUFT/BOSS_KAMMER Gruft-Stein' },
];

const ZELL_W = 32;        // 2 Kacheln breit
const ZELL_H = 48;        // 3 Kacheln hoch
const FUSS_RAND = 8;      // Abstand Fusskante -> Zellunterkante (halbe Kachel)
const BAND_H = 8;         // Marken-Band unter jeder Figurenzeile
const SPALTEN = Math.max(...ZEILEN.map((z) => z.keys.length));
const BREITE = SPALTEN * ZELL_W;                       // 544
const HOEHE = ZEILEN.length * (ZELL_H + BAND_H);       // 224
// Eigene Masse fuer den Gegner-Bogen (Rev 3) — sie duerfen BREITE/HOEHE des
// Menschen-Bogens NICHT beruehren, sonst waeren dessen PNG nicht mehr byte-gleich.
const SPALTEN_G = Math.max(...ZEILEN_GEGNER.map((z) => z.keys.length));
const BREITE_G = SPALTEN_G * ZELL_W;                   // 288
const HOEHE_G = ZEILEN_GEGNER.length * (ZELL_H + BAND_H); // 280
const ZOOM = 6;
const BAND_BG = [0, 0, 0];
const BAND_FG = [180, 180, 180];

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
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // RGBA
  const stride = w * 4;
  const raw = Buffer.alloc(h * (stride + 1));
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0; // Filter 0 (None) — deterministisch
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
// 3. Mini-Leinwand
// ---------------------------------------------------------------------------
const hexRgb = (s) => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];

function leinwand(w, h) {
  return { w, h, buf: Buffer.alloc(w * h * 4) };
}
function setPx(cv, x, y, rgb) {
  if (x < 0 || y < 0 || x >= cv.w || y >= cv.h) return;
  const o = (y * cv.w + x) * 4;
  cv.buf[o] = rgb[0]; cv.buf[o + 1] = rgb[1]; cv.buf[o + 2] = rgb[2]; cv.buf[o + 3] = 255;
}
function rechteck(cv, x0, y0, w, h, rgb) {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) setPx(cv, x, y, rgb);
}
// Gekachelter Hintergrund: das ECHTE Kachel-Grid wird wiederholt (keine
// Flachfarbe — Review m8: "Der Bogen sollte die echten Kacheln kacheln").
function kachle(cv, x0, y0, w, h, grid) {
  const gh = grid.length, gw = grid[0].length;
  for (let y = 0; y < h; y++) {
    const row = grid[y % gh];
    for (let x = 0; x < w; x++) {
      const ch = row[x % gw];
      if (ch === '.') continue;
      setPx(cv, x0 + x, y0 + y, hexRgb(PALETTE[ch]));
    }
  }
}
function zeichneGrid(cv, ox, oy, grid) {
  for (let y = 0; y < grid.length; y++) {
    const row = grid[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.') continue;
      setPx(cv, ox + x, oy + y, hexRgb(PALETTE[ch]));
    }
  }
}

// 3x5-Pixelschrift, nur die im Bogen benutzten Zeichen (H S N K 0-9).
const FONT = {
  '0': ['111', '101', '101', '101', '111'],
  '1': ['010', '110', '010', '010', '111'],
  '2': ['111', '001', '111', '100', '111'],
  '3': ['111', '001', '111', '001', '111'],
  '4': ['101', '101', '111', '001', '001'],
  '5': ['111', '100', '111', '001', '111'],
  '6': ['111', '100', '111', '101', '111'],
  '7': ['111', '001', '001', '010', '010'],
  '8': ['111', '101', '111', '101', '111'],
  '9': ['111', '101', '111', '001', '111'],
  A: ['010', '101', '111', '101', '101'],
  B: ['110', '101', '110', '101', '110'],
  C: ['011', '100', '100', '100', '011'],
  D: ['110', '101', '101', '101', '110'],
  W: ['101', '101', '101', '111', '101'],
  H: ['101', '101', '111', '101', '101'],
  S: ['011', '100', '010', '001', '110'],
  N: ['101', '111', '111', '101', '101'],
  K: ['101', '110', '100', '110', '101'],
};
function schreibe(cv, x0, y0, text, rgb) {
  let x = x0;
  for (const c of text) {
    const g = FONT[c];
    if (!g) { x += 4; continue; }
    for (let y = 0; y < 5; y++) for (let i = 0; i < 3; i++) if (g[y][i] === '1') setPx(cv, x + i, y0 + y, rgb);
    x += 4;
  }
}

// ---------------------------------------------------------------------------
// 4. Skalierung — ausschliesslich NEAREST NEIGHBOUR
// ---------------------------------------------------------------------------
function nnHoch(cv, f) {
  const out = leinwand(cv.w * f, cv.h * f);
  for (let y = 0; y < out.h; y++) {
    const sy = (y / f) | 0;
    for (let x = 0; x < out.w; x++) {
      const sx = (x / f) | 0;
      cv.buf.copy(out.buf, (y * out.w + x) * 4, (sy * cv.w + sx) * 4, (sy * cv.w + sx) * 4 + 4);
    }
  }
  return out;
}
// 50 % runter, Nearest Neighbour: uebernimmt Quelltexel (2x, 2y) — ungerade
// Spalten/Zeilen fallen weg. Genau das ist der Zusammenkniff-Test: was auf einer
// 1-px-Kante lebt (Rim!), ueberlebt hier nicht.
function nnHalb(cv) {
  const out = leinwand(cv.w >> 1, cv.h >> 1);
  for (let y = 0; y < out.h; y++) {
    for (let x = 0; x < out.w; x++) {
      const s = ((y * 2) * cv.w + x * 2) * 4;
      cv.buf.copy(out.buf, (y * out.w + x) * 4, s, s + 4);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// 5. Bogen bauen
// ---------------------------------------------------------------------------
function bogen(bodenGrid, zeilen = ZEILEN, breite = BREITE, hoehe = HOEHE) {
  const cv = leinwand(breite, hoehe);
  zeilen.forEach((zeile, zi) => {
    const top = zi * (ZELL_H + BAND_H);
    // Boden: pro Zeile bei (0, top) neu angesetzt -> jede Zeile zeigt exakt
    // 3 Kachelreihen, das Kachelraster faellt mit dem Zellraster zusammen.
    kachle(cv, 0, top, breite, ZELL_H, bodenGrid);
    zeile.keys.forEach((key, ci) => {
      const g = SPRITES[key];
      const gw = Math.max(...g.map((r) => r.length));
      const ox = ci * ZELL_W + ((ZELL_W - gw) >> 1);
      const oy = top + ZELL_H - FUSS_RAND - g.length;   // gemeinsame Fusskante
      zeichneGrid(cv, ox, oy, g);
    });
  });
  zeichneBaender(cv, zeilen, breite);
  return cv;
}
// Markenband = CHROM, nicht Kunst. Deshalb wird es im Squint-Bogen nach dem
// Halbieren NEU gestempelt: der Zusammenkniff-Test soll die FIGUREN kollabieren
// lassen, nicht die Beschriftung (deklarierte Abweichung, siehe Legende).
function zeichneBaender(cv, zeilen = ZEILEN, breite = BREITE) {
  zeilen.forEach((zeile, zi) => {
    const top = zi * (ZELL_H + BAND_H);
    rechteck(cv, 0, top + ZELL_H, breite, BAND_H, BAND_BG);
    zeile.keys.forEach((_key, ci) => {
      schreibe(cv, ci * ZELL_W + 2, top + ZELL_H + 2, marke(zeile.tag, ci), BAND_FG);
    });
  });
}
const marke = (tag, i) => tag + String(i + 1).padStart(2, '0');

// ---------------------------------------------------------------------------
// 6. Hauptlauf
// ---------------------------------------------------------------------------
function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const sha = (b) => createHash('sha256').update(b).digest('hex');
const rec601 = (rgb) => 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2];

function main() {
  const modus = arg('modus', 'vorher');
  if (modus !== 'vorher' && modus !== 'nachher') {
    console.log(`FEHLER: --modus muss 'vorher' oder 'nachher' sein (bekommen: ${modus})`);
    process.exitCode = 1; return;
  }
  const outArg = arg('out', '.tmp/gp7ch_p0/bogen');
  const outDir = isAbsolute(outArg) ? outArg : resolve(REPO, outArg);
  mkdirSync(outDir, { recursive: true });

  // --- Vollstaendigkeit + Wohlgeformtheit der Figuren-Keys ------------------
  let fehler = 0;
  for (const z of [...ZEILEN, ...ZEILEN_GEGNER]) {
    for (const k of z.keys) {
      if (!SPRITES[k]) { console.log(`FEHLER: Figuren-Key fehlt: ${k}`); fehler++; continue; }
      for (const row of SPRITES[k]) {
        for (const ch of row) {
          if (ch !== '.' && !PALETTE[ch]) { console.log(`FEHLER: Grid ${k} nutzt Nicht-Paletten-Zeichen '${ch}'`); fehler++; }
        }
      }
    }
  }
  // --- Boden-Kontrolle: echte Kachel, voll deckend, Soll-L ------------------
  const bodenInfo = [];
  for (const b of BOEDEN) {
    const g = TILE_ART[b.key];
    if (!g) { console.log(`FEHLER: Kachel-Key fehlt: ${b.key}`); fehler++; continue; }
    let opak = 0, trans = 0, sum = 0;
    for (const row of g) for (const ch of row) {
      if (ch === '.') { trans++; continue; }
      opak++; sum += rec601(hexRgb(PALETTE[ch]));
    }
    const L = sum / opak;
    const ok = trans === 0 && Math.abs(L - b.sollL) < 0.05;
    bodenInfo.push({ ...b, w: g[0].length, h: g.length, opak, trans, L });
    console.log(`BODEN-CHECK ${ok ? 'OK' : 'ABWEICHUNG'}  ${b.name.padEnd(4)} ${b.key.padEnd(13)} ${g[0].length}x${g.length}  opak ${opak}  transparent ${trans}  L(Rec601) ${L.toFixed(1)}  soll ${b.sollL.toFixed(1)}`);
    if (!ok) fehler++;
  }
  if (fehler > 0) { console.log(`FEHLER: ${fehler} Vorpruefung(en) gescheitert — kein Bogen geschrieben.`); process.exitCode = 1; return; }

  // --- Rendern ---------------------------------------------------------------
  const dateien = [];
  // Zwei Boegen mit identischem Raster und identischem Squint-Verfahren:
  // 'menschen' (Rev 2, unveraendert) und 'gegner' (Rev 3, additiv).
  const BOEGEN = [
    { schluessel: 'menschen', infix: '', zeilen: ZEILEN, breite: BREITE, hoehe: HOEHE },
    { schluessel: 'gegner', infix: 'gegner_', zeilen: ZEILEN_GEGNER, breite: BREITE_G, hoehe: HOEHE_G },
  ];
  for (const bg of BOEGEN) {
    for (const b of BOEDEN) {
      const eins = bogen(TILE_ART[b.key], bg.zeilen, bg.breite, bg.hoehe);
      const sechs = nnHoch(eins, ZOOM);
      // Squint: 1x -> NN 50 % runter -> NN x2 wieder auf 1x-Mass -> Bänder neu
      // stempeln -> NN x6 zum Ansehen. Ergebnis hat exakt die Masse des
      // 6x-Bogens (pixelgenaues Uebereinanderlegen der beiden Dateien).
      const halb = nnHoch(nnHalb(eins), 2);
      zeichneBaender(halb, bg.zeilen, bg.breite);
      const squint = nnHoch(halb, ZOOM);
      for (const [tag, cv] of [['1x', eins], ['6x', sechs], ['squint', squint]]) {
        const name = `figuren_bogen_${modus}_${bg.infix}${b.name}_${tag}.png`;
        const bytes = pngBytes(cv.w, cv.h, cv.buf);
        writeFileSync(join(outDir, name), bytes);
        dateien.push({ name, w: cv.w, h: cv.h, bytes: bytes.length, sha: sha(bytes) });
      }
    }
  }

  // --- Legende (Spaltenlegende + Provenienz) --------------------------------
  const quellen = ['game/js/art/sprites_figuren.js', 'game/js/art/sprites_tiles.js', 'game/js/art/sprites.js', 'game/js/art/palette.js']
    .map((p) => ({ p, sha: sha(readFileSync(resolve(REPO, p))) }));
  const zeilen = [];
  zeilen.push(`FIGUREN-BOGEN ${modus.toUpperCase()} — Legende (erzeugt von tools/figuren_bogen.mjs)`);
  zeilen.push(`Spec: design/SPEC_GP7CH1.md E9 (Umfang) + E10 P0.c/P0.e, Review M15/M16/m8,`);
  zeilen.push(`Nachfix-Befund R5. WERKZEUG-REV 2.`);
  zeilen.push('');
  zeilen.push('UMFANG  Rev 2 fuehrt alle Grids, die Spec E9 fuer Phase 1a/1b in den Umfang');
  zeilen.push('        nimmt: 17 player_-Grids + 3 sword_slash_-Grids (1a) und 15 npc_-Grids');
  zeilen.push('        (1b). Rev 1 hatte nur 12 Lauf-Frames des Helden und deckte damit bloss');
  zeilen.push('        27 der 35 Grids ab (Befund R5). NEU in Rev 2: player_attack_down/up/side,');
  zeilen.push('        player_die_0/1, sword_slash_down/up/side.');
  zeilen.push('        Die Gegner-Zeile K ist KONTEXT, nicht Umfang (shield_* ist CH-2).');
  zeilen.push('        Rev 3 (GP7-CH-2 P0.c) legt einen ZWEITEN, eigenstaendigen Bogen mit den');
  zeilen.push('        27 Gegner-Grids daneben und einen VIERTEN Boden (Gruft-Stein) darunter.');
  zeilen.push('');
  zeilen.push(`RASTER  Zelle ${ZELL_W}x${ZELL_H} px (2x3 Kacheln), Markenband ${BAND_H} px unter jeder Zeile,`);
  zeilen.push(`        Bogen ${BREITE}x${HOEHE} px bei 1x, ${BREITE * ZOOM}x${HOEHE * ZOOM} px bei 6x und squint.`);
  zeilen.push('        Figur horizontal in der Zelle zentriert, Fusskante gemeinsam auf');
  zeilen.push(`        Zellunterkante minus ${FUSS_RAND} px. Freie Zellen rechts = Boden pur (Referenzflaeche).`);
  zeilen.push('        squint = 1x, per Nearest Neighbour 50 % runter (Quelltexel 2x/2y), dann');
  zeilen.push('        wieder hoch — deckungsgleich mit dem 6x-Bogen. Das Markenband wird nach');
  zeilen.push('        dem Halbieren NEU gestempelt (Chrom, nicht Kunst): kollabieren sollen die');
  zeilen.push('        Figuren, nicht die Beschriftung.');
  zeilen.push('');
  zeilen.push('BOEDEN (echte Kacheln, gekachelt — keine Flachfarbe)');
  for (const b of bodenInfo) zeilen.push(`  ${b.name.padEnd(5)} ${b.key.padEnd(13)} ${b.w}x${b.h}  L(Rec601) ${b.L.toFixed(1)}  ${b.ort}`);
  zeilen.push('');
  zeilen.push('SPALTENLEGENDE MENSCHEN-BOGEN (Marke im Band -> Grid-Key -> Grid-Mass)');
  zeilen.push(`  Dateien: figuren_bogen_${modus}_<boden>_<1x|6x|squint>.png, ${BREITE}x${HOEHE} px bei 1x`);
  for (const z of ZEILEN) {
    zeilen.push(`  Zeile ${z.tag} = ${z.name} (${z.keys.length} Zellen)`);
    if (z.hinweis) zeilen.push(`    Hinweis: ${z.hinweis}`);
    z.keys.forEach((k, i) => {
      const g = SPRITES[k];
      const gw = Math.max(...g.map((r) => r.length));
      zeilen.push(`    ${marke(z.tag, i)}  ${k.padEnd(22)} ${gw}x${g.length}  Zelle x=${i * ZELL_W}..${i * ZELL_W + ZELL_W - 1}`);
    });
  }
  zeilen.push('');
  zeilen.push('SPALTENLEGENDE GEGNER-BOGEN (Werkzeug-Rev 3, GP7-CH-2 P0.c — ADDITIV)');
  zeilen.push(`  Dateien: figuren_bogen_${modus}_gegner_<boden>_<1x|6x|squint>.png, ${BREITE_G}x${HOEHE_G} px bei 1x`);
  zeilen.push('  Gleiches Raster, gleiche Fusskante, gleiches Squint-Verfahren wie der');
  zeilen.push('  Menschen-Bogen — die beiden Boegen sind Zelle fuer Zelle vergleichbar');
  zeilen.push('  ("eine Hand", Spec GP7CH2 Sec.6 V-SPEC).');
  for (const z of ZEILEN_GEGNER) {
    zeilen.push(`  Zeile ${z.tag} = ${z.name} (${z.keys.length} Zellen)`);
    if (z.hinweis) zeilen.push(`    Hinweis: ${z.hinweis}`);
    z.keys.forEach((k, i) => {
      const g = SPRITES[k];
      const gw = Math.max(...g.map((r) => r.length));
      zeilen.push(`    ${marke(z.tag, i)}  ${k.padEnd(22)} ${gw}x${g.length}  Zelle x=${i * ZELL_W}..${i * ZELL_W + ZELL_W - 1}`);
    });
  }
  zeilen.push('');
  zeilen.push('ADDITIVITAETS-ZUSAGE (Rev 3): die 9 Menschen-PNG auf gras/lehm/weg sind');
  zeilen.push('  byte-gleich mit Rev 2. Neu sind 3 Menschen-PNG auf dem Gruft-Stein und die');
  zeilen.push('  12 Gegner-PNG. Diese Legende ist das Dateimanifest und waechst deshalb mit.');
  zeilen.push('');
  zeilen.push('DATEIEN (Mass, Bytes, sha256)');
  for (const d of dateien) zeilen.push(`  ${d.name.padEnd(40)} ${String(d.w).padStart(5)}x${String(d.h).padStart(4)}  ${String(d.bytes).padStart(8)} B  ${d.sha}`);
  zeilen.push('');
  zeilen.push('PROVENIENZ (sha256 der Art-Quellen, aus denen dieser Bogen gerendert wurde)');
  for (const q of quellen) zeilen.push(`  ${q.p.padEnd(34)} ${q.sha}`);
  const legName = `figuren_bogen_${modus}_legende.txt`;
  writeFileSync(join(outDir, legName), zeilen.join('\n') + '\n');

  for (const d of dateien) console.log(`GESCHRIEBEN ${d.name.padEnd(40)} ${d.w}x${d.h}  ${d.bytes} B  sha256 ${d.sha}`);
  console.log(`GESCHRIEBEN ${legName}`);
  console.log(`FIGUREN-BOGEN FERTIG (modus=${modus}, ${dateien.length} PNG + 1 Legende, Ziel ${outDir})`);
}

main();
