#!/usr/bin/env node
// =============================================================================
// render_icon.mjs — Launcher-Icon-PNGs aus dem Pixel-Grid. Slice 4, Spec §0.7.
// =============================================================================
// Liest game/js/art/icon_app.js (32x32, PALETTE-Zeichen) und schreibt die
// Android-mipmap-PNGs. KEINE Abhaengigkeit: PNG entsteht ueber
// node:zlib.deflateSync plus selbst gerechnete CRC32-Chunks, Skalierung ist
// nearest-neighbour (Pixel-Look bleibt hart).
//
// WARUM DREI DATEIEN JE DICHTE (Review P2-M8): ab Android 8 zeigt
// res/mipmap-anydpi-v26/ic_launcher.xml auf ein <adaptive-icon> mit
//   <background android:drawable="@color/ic_launcher_background"/>
//   <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
// Nur ic_launcher.png zu ersetzen aendert dort NICHTS. Deshalb werden
// ic_launcher.png, ic_launcher_round.png UND ic_launcher_foreground.png
// geschrieben; die Hintergrundfarbe setzt tools/build_apk.sh in
// res/values/ic_launcher_background.xml auf ICON_APP_BG.
//
// GROESSEN (die fuenf Dichten mdpi/hdpi/xhdpi/xxhdpi/xxxhdpi):
//   ic_launcher(.round).png    48 /  72 /  96 / 144 / 192  (48dp-Kachel)
//   ic_launcher_foreground.png 108 / 162 / 216 / 324 / 432  (108dp-Ebene)
// Die Vordergrund-Ebene eines adaptiven Icons ist per Android-Definition
// 108dp gross, davon sind nur die INNEREN 72dp garantiert sichtbar (= 66,7 %,
// der Rest wird von der Launcher-Maske und der Parallaxe gefressen). Das
// Motiv wird deshalb in ein zentriertes 66-%-Quadrat gerendert. Die
// Capacitor-Vorlagen liefern exakt dieselben Kantenlaengen (nachgemessen:
// mdpi 108, hdpi 162, xxxhdpi 432) — die Dateien werden also masshaltig
// ersetzt, nicht umskaliert.
//
// Aufruf:
//   node tools/render_icon.mjs                # Ziel: mobile/android/.../res
//   node tools/render_icon.mjs --out <dir>    # Ziel frei waehlbar (Pruefung)
//   node tools/render_icon.mjs --check        # nur validieren, nichts schreiben
// Exit 0 = gruen.
// =============================================================================

import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PALETTE } from '../game/js/art/palette.js';
import { ICON_APP, ICON_APP_BG, ICON_APP_SIZE } from '../game/js/art/icon_app.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// --- Dichten: Ordner, Kachelgroesse (48dp), Vordergrundgroesse (108dp) ------
const DICHTEN = [
  { dir: 'mipmap-mdpi', tile: 48, fg: 108 },
  { dir: 'mipmap-hdpi', tile: 72, fg: 162 },
  { dir: 'mipmap-xhdpi', tile: 96, fg: 216 },
  { dir: 'mipmap-xxhdpi', tile: 144, fg: 324 },
  { dir: 'mipmap-xxxhdpi', tile: 192, fg: 432 },
];

// Anteil der Vordergrund-Ebene, den das Motiv belegen darf (Sicherheitszone).
const SAFE = 2 / 3;

// --- Argumente --------------------------------------------------------------
const argv = process.argv.slice(2);
const nurPruefen = argv.includes('--check');
const outIdx = argv.indexOf('--out');
const OUT = outIdx >= 0 && argv[outIdx + 1]
  ? resolve(argv[outIdx + 1])
  : join(ROOT, 'mobile', 'android', 'app', 'src', 'main', 'res');

// --- Grid pruefen und in RGBA-Tabelle uebersetzen ---------------------------
function hexRgb(hex) {
  const h = String(hex).trim().replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) throw new Error(`Farbe nicht lesbar: ${hex}`);
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function gridPruefen() {
  const N = ICON_APP_SIZE;
  if (!Array.isArray(ICON_APP)) throw new Error('ICON_APP ist kein Array');
  if (ICON_APP.length !== N) throw new Error(`ICON_APP hat ${ICON_APP.length} Zeilen, erwartet ${N}`);
  let tinte = 0;
  for (let y = 0; y < N; y++) {
    const row = ICON_APP[y];
    if (typeof row !== 'string' || row.length !== N) {
      throw new Error(`ICON_APP Zeile ${y} hat ${row && row.length} Zeichen, erwartet ${N}`);
    }
    for (let x = 0; x < N; x++) {
      const ch = row[x];
      if (ch === '.') continue;
      if (!Object.prototype.hasOwnProperty.call(PALETTE, ch)) {
        throw new Error(`ICON_APP Zeile ${y} Spalte ${x}: '${ch}' ist kein PALETTE-Schluessel`);
      }
      tinte++;
    }
  }
  hexRgb(ICON_APP_BG);
  return tinte;
}

// Quelle als flaches RGBA-Feld (32x32).
function quelleBauen() {
  const N = ICON_APP_SIZE;
  const px = new Uint8Array(N * N * 4);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const ch = ICON_APP[y][x];
      const i = (y * N + x) * 4;
      if (ch === '.') continue;
      const [r, g, b] = hexRgb(PALETTE[ch]);
      px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = 255;
    }
  }
  return px;
}

// --- Leinwand ---------------------------------------------------------------
function leinwand(w, h) {
  return { w, h, px: new Uint8Array(w * h * 4) };
}

function fuellen(c, [r, g, b], alphaTest) {
  for (let y = 0; y < c.h; y++) {
    for (let x = 0; x < c.w; x++) {
      if (alphaTest && !alphaTest(x, y)) continue;
      const i = (y * c.w + x) * 4;
      c.px[i] = r; c.px[i + 1] = g; c.px[i + 2] = b; c.px[i + 3] = 255;
    }
  }
}

// Nearest-Neighbour: Motiv (32x32) in das Quadrat (ox,oy,size) der Leinwand.
// Ueber der Zielflaeche wird pro Zielpixel EIN Quellpixel gezogen — keine
// Interpolation, keine weichen Kanten.
function motivZeichnen(c, quelle, ox, oy, size) {
  const N = ICON_APP_SIZE;
  for (let dy = 0; dy < size; dy++) {
    const sy = Math.min(N - 1, Math.floor((dy * N) / size));
    const ty = oy + dy;
    if (ty < 0 || ty >= c.h) continue;
    for (let dx = 0; dx < size; dx++) {
      const sx = Math.min(N - 1, Math.floor((dx * N) / size));
      const tx = ox + dx;
      if (tx < 0 || tx >= c.w) continue;
      const s = (sy * N + sx) * 4;
      if (quelle[s + 3] === 0) continue; // transparent bleibt transparent
      const t = (ty * c.w + tx) * 4;
      c.px[t] = quelle[s]; c.px[t + 1] = quelle[s + 1];
      c.px[t + 2] = quelle[s + 2]; c.px[t + 3] = 255;
    }
  }
}

// --- PNG (RGBA8, ohne Fremdcode) -------------------------------------------
const CRC_TAB = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TAB[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(typ, daten) {
  const laenge = Buffer.alloc(4);
  laenge.writeUInt32BE(daten.length, 0);
  const koerper = Buffer.concat([Buffer.from(typ, 'ascii'), daten]);
  const pruef = Buffer.alloc(4);
  pruef.writeUInt32BE(crc32(koerper), 0);
  return Buffer.concat([laenge, koerper, pruef]);
}

function pngBytes(c) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(c.w, 0);
  ihdr.writeUInt32BE(c.h, 4);
  ihdr[8] = 8;   // Bittiefe
  ihdr[9] = 6;   // Farbtyp RGBA
  ihdr[10] = 0;  // Deflate
  ihdr[11] = 0;  // Adaptives Filtern
  ihdr[12] = 0;  // kein Interlace
  // Scanlines mit Filtertyp 0 (None) — bei Pixelkunst der kleinste Aufwand.
  const roh = Buffer.alloc(c.h * (1 + c.w * 4));
  for (let y = 0; y < c.h; y++) {
    const ziel = y * (1 + c.w * 4);
    roh[ziel] = 0;
    Buffer.from(c.px.buffer, c.px.byteOffset + y * c.w * 4, c.w * 4).copy(roh, ziel + 1);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(roh, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// --- Hauptlauf --------------------------------------------------------------
const tinte = gridPruefen();
const quelle = quelleBauen();
const bg = hexRgb(ICON_APP_BG);

console.log(`Icon-Grid geprueft: ${ICON_APP_SIZE}x${ICON_APP_SIZE}, ${tinte} gesetzte Pixel, Hintergrund ${ICON_APP_BG}`);

if (nurPruefen) {
  console.log('RENDER-ICON GRUEN (nur geprueft, nichts geschrieben)');
  process.exit(0);
}

let geschrieben = 0;
for (const d of DICHTEN) {
  const ziel = join(OUT, d.dir);
  mkdirSync(ziel, { recursive: true });

  // (1) Klassisches Launcher-Icon: volle Kachel, deckender Hintergrund.
  const eckig = leinwand(d.tile, d.tile);
  fuellen(eckig, bg, null);
  motivZeichnen(eckig, quelle, 0, 0, d.tile);
  writeFileSync(join(ziel, 'ic_launcher.png'), pngBytes(eckig));

  // (2) Runde Variante: gleicher Inhalt, Hintergrund als Kreis, aussen leer.
  const r = d.tile / 2;
  const rund = leinwand(d.tile, d.tile);
  const imKreis = (x, y) => {
    const dx = x + 0.5 - r;
    const dy = y + 0.5 - r;
    return dx * dx + dy * dy <= r * r;
  };
  fuellen(rund, bg, imKreis);
  motivZeichnen(rund, quelle, 0, 0, d.tile);
  // Motiv ausserhalb des Kreises wieder wegnehmen (harte Kante, kein Anti-Alias).
  for (let y = 0; y < d.tile; y++) {
    for (let x = 0; x < d.tile; x++) {
      if (imKreis(x, y)) continue;
      const i = (y * d.tile + x) * 4;
      rund.px[i] = 0; rund.px[i + 1] = 0; rund.px[i + 2] = 0; rund.px[i + 3] = 0;
    }
  }
  writeFileSync(join(ziel, 'ic_launcher_round.png'), pngBytes(rund));

  // (3) Vordergrund des adaptiven Icons: transparent, Motiv in der
  //     66-%-Sicherheitszone, zentriert.
  const vorne = leinwand(d.fg, d.fg);
  const box = Math.round(d.fg * SAFE);
  const off = Math.round((d.fg - box) / 2);
  motivZeichnen(vorne, quelle, off, off, box);
  writeFileSync(join(ziel, 'ic_launcher_foreground.png'), pngBytes(vorne));

  geschrieben += 3;
  console.log(`  ${d.dir}: ic_launcher ${d.tile}x${d.tile}, ic_launcher_round ${d.tile}x${d.tile}, ic_launcher_foreground ${d.fg}x${d.fg} (Motiv ${box}px)`);
}

console.log(`RENDER-ICON GRUEN: ${geschrieben} PNGs nach ${OUT}`);
