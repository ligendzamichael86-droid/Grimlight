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
