// Wandelt Text-Pixel-Grids in Canvas-Sprites um. Nur im Browser aufrufen
// (benutzt document erst innerhalb der Funktionen, Import ist Node-sicher).

export function buildSprite(grid, palette, { flipX = false } = {}) {
  const h = grid.length;
  const w = grid[0].length;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  for (let y = 0; y < h; y++) {
    const row = grid[y];
    for (let x = 0; x < w; x++) {
      const ch = row[x];
      if (ch === '.') continue;
      const color = palette[ch];
      if (!color) {
        throw new Error(`buildSprite: unbekannter Palettenschlüssel '${ch}' bei (${x},${y})`);
      }
      ctx.fillStyle = color;
      ctx.fillRect(flipX ? w - 1 - x : x, y, 1, 1);
    }
  }
  return canvas;
}

export function buildAll(sprites, palette) {
  const out = {};
  for (const name of Object.keys(sprites)) {
    out[name] = buildSprite(sprites[name], palette);
  }
  return out;
}

// ===========================================================================
// GRAFIKPASS 6 §4.2 — TINT-MASKE (ADDITIV; buildSprite/buildAll unveraendert).
//
// Eine Tint-Maske ist ein Canvas mit der IDENTISCHEN ALPHA-FORM des Sprites
// (deckend genau dort, wo das Grid nicht '.' ist), aber nur ZWEI Farbtoenen.
// main.js legt sie mit source-over und kleinem globalAlpha ueber das ZUERST
// gezeichnete Original (Waechter B, §0.5) — daraus entsteht die
// Sprite-Beleuchtung, ohne dass irgendwo ein 'lighter' auf Figuren laeuft.
//
// WARUM ZWEI TOENE (Review P2-M-3): ein einzelner Ton kann keine RAMPE. M3
// verlangt aber "L-Differenz fackelzugewandte gegen -abgewandte Haelfte >= +6
// L" — also muss die Maske selbst eine Halbseiten-Modellierung tragen. Sie
// bekommt sie SPALTENWEISE: jede Spalte traegt genau EINEN der beiden Toene,
// die Trennung liegt in der Mitte der Sprite-Breite. `richtung` sagt, auf
// welcher Seite der HELLE Ton liegt:
//   'L' -> Spalten x < w/2 hell, Rest dunkel  (Lichtquelle links)
//   'R' -> Spalten x >= w/2 hell, Rest dunkel (Lichtquelle rechts)
// Die Mittentrennung ist zugleich der Messschnitt von M3 (halbseitig), die
// Ton-Differenz schlaegt also voll auf die Messgroesse durch.
//
// DETEKTOR-PFLICHT (§0.2): der Bake laeuft auf einem NICHT-Main-Canvas. Die
// Deckung steckt deshalb AUSSCHLIESSLICH im fillStyle, globalAlpha bleibt
// exakt 1 — sonst waere dieser fillRect der erste Teilalpha-fillRect auf einem
// Offscreen und der ambientAlpha-Detektor der Flusstests laese ihn statt
// lighting.js. Die Deckung setzt der AUFRUFER beim drawImage.
//
// @param {string[]} grid     Text-Pixel-Grid wie bei buildSprite
// @param {Object}   palette  nur zur Schluessel-VALIDIERUNG (der Ton der Maske
//                            kommt aus toneDunkel/toneHell, nicht aus dem Grid)
// @param {string}   toneDunkel  CSS-Farbe der lichtabgewandten Haelfte
// @param {string}   toneHell    CSS-Farbe der lichtzugewandten Haelfte
// @param {'L'|'R'}  richtung    Seite, auf der toneHell liegt
// ===========================================================================
export function buildTintMask(grid, palette, toneDunkel, toneHell, richtung) {
  const h = grid.length;
  const w = grid[0].length;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.globalAlpha = 1; // §0.2: NIE Teilalpha auf einem Offscreen
  const mitte = w / 2;
  // Ton je SPALTE vorberechnen (eine fillStyle-Zuweisung je Spalte statt je
  // Texel, und die Rampe steht als Datenzeile sichtbar da).
  const spalte = new Array(w);
  for (let x = 0; x < w; x++) {
    const hell = richtung === 'R' ? x >= mitte : x < mitte;
    spalte[x] = hell ? toneHell : toneDunkel;
  }
  for (let y = 0; y < h; y++) {
    const row = grid[y];
    for (let x = 0; x < w; x++) {
      const ch = row[x];
      if (ch === '.') continue;
      if (!palette[ch]) {
        throw new Error(`buildTintMask: unbekannter Palettenschlüssel '${ch}' bei (${x},${y})`);
      }
      ctx.fillStyle = spalte[x];
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return canvas;
}
