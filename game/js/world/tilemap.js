// Tilemap: Zeichen-Zeilen + Legende → Kollisions- und Zeichen-API.
// Kollisionskonvention: AABB-Kanten halb-offen [x, x+w) — rechte/untere
// Kante zählt NICHT als Überlappung (kein Hängenbleiben beim Wandberühren).
//
// Slice 1.5: optionaler Over-Layer (overRows) + Fringe-Übergangskanten.
// - overRows: gleiche Dimension wie rows; '.' wird VOR dem Legend-Lookup als
//   leer behandelt (Zelle = null) — '.' ist in den Legenden ein Bodentile und
//   darf im Over-Layer NIE gezeichnet werden (Spec-Review-Klärung).
// - Over-Tiles sind NIE solide; createTilemap wirft, wenn ein Over-Zeichen
//   auf einen solid-Legendeneintrag zeigt (Datenfehler laut sichtbar machen).
// - findTiles bleibt GROUND-only (Fackel-Extraktion); Fackel-Zeichen dürfen
//   nie in overRows auftauchen (Smoke-Test prüft das).

const TILE = 16;
const EPS = 0.0001;

// Fringe-Nachbarlogik als REINE Funktion (Node-testbar, Smoke-Test).
// getDef(tx, ty) → Legendeneintrag oder null/undefined (außerhalb der Map).
// Liefert die fringe_*-Art-Keys, die ÜBER dem Tile (tx,ty) liegen müssen:
// - Nur Tiles mit fringeTarget: true bekommen Fransen.
// - Für jede orthogonale Seite mit fringeSource-Nachbar das Seiten-Fringe
//   (Benennung = Seite des Tiles, an der der Source-Nachbar liegt).
// - Für jede Diagonale mit Source-Nachbar, deren BEIDE Orthogonalen keine
//   Sources sind, das Ecken-Fringe (nur das 'grass'-Set hat Ecken;
//   'moss' kommt laut Spec mit 4 Seiten aus).
// - Das Set (Prefix 'fringe' | 'moss_fringe') bestimmt das fringeSet-Feld
//   des SOURCE-Nachbarn ('grass' ist Default).
export function fringeOverlays(getDef, tx, ty) {
  const def = getDef(tx, ty);
  if (!def || !def.fringeTarget) return [];
  const srcSet = (dx, dy) => {
    const d = getDef(tx + dx, ty + dy);
    return d && d.fringeSource ? (d.fringeSet || 'grass') : null;
  };
  const prefix = (set) => (set === 'moss' ? 'moss_fringe' : 'fringe');
  const out = [];
  const n = srcSet(0, -1);
  const e = srcSet(1, 0);
  const s = srcSet(0, 1);
  const w = srcSet(-1, 0);
  if (n) out.push(`${prefix(n)}_n`);
  if (e) out.push(`${prefix(e)}_e`);
  if (s) out.push(`${prefix(s)}_s`);
  if (w) out.push(`${prefix(w)}_w`);
  const corner = (dx, dy, name, ortho1, ortho2) => {
    const d = srcSet(dx, dy);
    if (d && d !== 'moss' && !ortho1 && !ortho2) out.push(`${prefix(d)}_${name}`);
  };
  corner(1, -1, 'ne', n, e);
  corner(-1, -1, 'nw', n, w);
  corner(1, 1, 'se', s, e);
  corner(-1, 1, 'sw', s, w);
  return out;
}

export function createTilemap(rows, legend, overRows = null) {
  const hTiles = rows.length;
  const wTiles = rows[0].length;

  const solid = [];
  const cells = [];
  for (let ty = 0; ty < hTiles; ty++) {
    if (rows[ty].length !== wTiles) {
      throw new Error(`createTilemap: Zeile ${ty} hat ${rows[ty].length} Zeichen, erwartet ${wTiles}`);
    }
    const solidRow = [];
    const cellRow = [];
    for (let tx = 0; tx < wTiles; tx++) {
      const ch = rows[ty][tx];
      const def = legend[ch];
      if (!def) throw new Error(`createTilemap: Zeichen '${ch}' bei (${tx},${ty}) fehlt in der Legende`);
      solidRow.push(!!def.solid);
      cellRow.push(def);
    }
    solid.push(solidRow);
    cells.push(cellRow);
  }

  // Over-Layer: '.' = leer (VOR dem Legend-Lookup), nie solide.
  const overCells = [];
  if (overRows) {
    if (overRows.length !== hTiles) {
      throw new Error(`createTilemap: overRows hat ${overRows.length} Zeilen, erwartet ${hTiles}`);
    }
    for (let ty = 0; ty < hTiles; ty++) {
      if (overRows[ty].length !== wTiles) {
        throw new Error(`createTilemap: overRows-Zeile ${ty} hat ${overRows[ty].length} Zeichen, erwartet ${wTiles}`);
      }
      const row = [];
      for (let tx = 0; tx < wTiles; tx++) {
        const ch = overRows[ty][tx];
        if (ch === '.') { row.push(null); continue; }
        const def = legend[ch];
        if (!def) throw new Error(`createTilemap: Over-Zeichen '${ch}' bei (${tx},${ty}) fehlt in der Legende`);
        if (def.solid) throw new Error(`createTilemap: Over-Zeichen '${ch}' bei (${tx},${ty}) ist solid — Over-Tiles sind NIE solide`);
        row.push(def);
      }
      overCells.push(row);
    }
  }

  // Fringe-Zellzugriff für die reine Nachbarlogik (außerhalb = null).
  function defAt(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= wTiles || ty >= hTiles) return null;
    return cells[ty][tx];
  }

  function isSolidAt(px, py) {
    const tx = Math.floor(px / TILE);
    const ty = Math.floor(py / TILE);
    if (tx < 0 || ty < 0 || tx >= wTiles || ty >= hTiles) return true; // außerhalb = solide
    return solid[ty][tx];
  }

  function rectCollides(aabb) {
    const x0 = Math.floor(aabb.x / TILE);
    const y0 = Math.floor(aabb.y / TILE);
    const x1 = Math.floor((aabb.x + aabb.w - EPS) / TILE);
    const y1 = Math.floor((aabb.y + aabb.h - EPS) / TILE);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        if (tx < 0 || ty < 0 || tx >= wTiles || ty >= hTiles) return true;
        if (solid[ty][tx]) return true;
      }
    }
    return false;
  }

  // Alle Tiles mit diesem Legenden-Zeichen; x/y = Tile-ZENTRUM in Weltpixeln.
  // GROUND-only (bindend): main.js extrahiert damit die Fackel-Positionen
  // (map.torchChars) — Fackel-Zeichen dürfen nie in overRows stehen.
  function findTiles(char) {
    const out = [];
    for (let ty = 0; ty < hTiles; ty++) {
      for (let tx = 0; tx < wTiles; tx++) {
        if (rows[ty][tx] === char) {
          out.push({ tx, ty, x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 });
        }
      }
    }
    return out;
  }

  function artFor(def, tx, ty, timeSec) {
    if (def.anim) {
      // Positions-Offset entsynchronisiert Fackeln (lebendigeres Flackern)
      const frame = (Math.floor(timeSec * 6) + tx * 13 + ty * 7) % def.anim.length;
      return def.anim[frame];
    }
    return def.art;
  }

  // Rundung wie alle anderen Zeichner (camera.js-Konvention):
  // screen = Math.round(worldX - cam.x). Ein abweichendes Schema (erst Kamera
  // runden) ließe Entities bei frac(cam.x) == 0.5 um 1 px gegen die Tiles wackeln.
  // layer: 'ground' zeichnet rows inkl. Fringe-Logik, 'over' zeichnet overRows
  // (leere Zellen = null werden übersprungen, keine Fringes im Over-Layer).
  function draw(ctx, camera, tileCanvases, timeSec, layer = 'ground') {
    const camX = camera.x;
    const camY = camera.y;
    const viewW = ctx.canvas.width;
    const viewH = ctx.canvas.height;
    const tx0 = Math.max(0, Math.floor(camX / TILE));
    const ty0 = Math.max(0, Math.floor(camY / TILE));
    const tx1 = Math.min(wTiles - 1, Math.floor((camX + viewW) / TILE));
    const ty1 = Math.min(hTiles - 1, Math.floor((camY + viewH) / TILE));
    const over = layer === 'over';
    if (over && overCells.length === 0) return;
    for (let ty = ty0; ty <= ty1; ty++) {
      for (let tx = tx0; tx <= tx1; tx++) {
        const def = over ? overCells[ty][tx] : cells[ty][tx];
        if (!def) continue;
        const sx = Math.round(tx * TILE - camX);
        const sy = Math.round(ty * TILE - camY);
        const img = tileCanvases[artFor(def, tx, ty, timeSec)];
        if (img) ctx.drawImage(img, sx, sy);
        if (!over && def.fringeTarget) {
          for (const key of fringeOverlays(defAt, tx, ty)) {
            const fimg = tileCanvases[key];
            if (fimg) ctx.drawImage(fimg, sx, sy);
          }
        }
      }
    }
  }

  return {
    wTiles,
    hTiles,
    wPx: wTiles * TILE,
    hPx: hTiles * TILE,
    isSolidAt,
    rectCollides,
    findTiles,
    draw,
  };
}
