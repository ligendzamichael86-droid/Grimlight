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
//
// Grafikpass 2: optionale Legenden-Felder (alle rein deterministisch, ohne
// Zufall und ohne Zeitstempel — Auswahl ist reine Funktion von tx, ty, timeSec):
// - span: [w, h]   NUR Over-Layer, 1<=w,h<=4 ganzzahlig. Die overRows-Zelle ist
//                  der ANKER (obere linke Ecke); das Art-Canvas ist w*16 x h*16.
// - variants: [...]  Array von TILE_ART-Keys, variants[0] === def.art (Pflicht).
//                  Deterministische Wahl pro Tile-Koordinate (variantIndex).
// - animRate: n    Frames/Sekunde für def.anim (Default 6).
// - animSync: true Kein Positions-Offset im Frame-Index (synchrone Wellen).
// - depthOverlays: [flach, mittel]  NUR Wasser-Legenden (§8b.1). createTilemap
//                  bestimmt einmalig je Tile mit diesem Feld die Chebyshev-Distanz
//                  zum naechsten Tile OHNE depthOverlays; der Ground-Pass legt
//                  NACH Tile+Shore/Fringe den passenden statischen Overlay drueber
//                  (Ufer-Ring flach, naechster Ring mittel, tiefer nichts).
// createTilemap validiert die Kombinationen laut Spec §2.1 (throw bei Datenfehler).

const TILE = 16;
const EPS = 0.0001;

// Deterministische Variantenwahl (reine Funktion, Smoke-Test prüft sie direkt).
// Gleichverteilt über 0..n-1, stabil pro (tx, ty) — kein RNG, kein Zeitbezug.
export function variantIndex(tx, ty, n) {
  let h = (tx * 374761393 + ty * 668265263) >>> 0;
  h = (h ^ (h >>> 13)) >>> 0;
  h = Math.imul(h, 1274126177) >>> 0;
  return h % n;
}

// Grafikpass 4 §2.2a Lit-Dither-Pass — REINE, Node-importierbare Funktion.
// Liefert fuer jedes sichtbare Boden-Tile, dessen ZENTRUM im Fackelkegel liegt,
// einen Eintrag {tx, ty, stufe, key}: Stufe 2 bei Distanz < r*0.45, Stufe 1 bei
// < r*0.75. r enthaelt den deterministischen Doppel-Sinus-Flicker — die Formel
// aus lighting.js:57-60 ist hierher DUPLIZIERT (Spec §2.2a erlaubt Duplikat),
// damit der Kegel deckungsgleich mit dem gestanzten Lichtkreis pulst und die
// Funktion headless (ohne core/lighting.js) baubar bleibt. key via
// variantIndex(tx,ty,2) -> licht_dither_1/_2. Kein Zufall/Zeitstempel (world/).
// lights: [{x,y,radius,flicker}] in Weltpixeln; camera {x,y}; timeSec Sekunden.
// Deterministisch: gleiche Argumente -> identische Liste (Smoke §5#5b).
export function litDitherCells(lights, camera, timeSec, viewW, viewH) {
  const out = [];
  const tx0 = Math.max(0, Math.floor(camera.x / TILE));
  const ty0 = Math.max(0, Math.floor(camera.y / TILE));
  const tx1 = Math.floor((camera.x + viewW) / TILE);
  const ty1 = Math.floor((camera.y + viewH) / TILE);
  for (let ty = ty0; ty <= ty1; ty++) {
    for (let tx = tx0; tx <= tx1; tx++) {
      const cx = tx * TILE + TILE / 2;
      const cy = ty * TILE + TILE / 2;
      let stufe = 0;
      for (const light of lights) {
        const flicker = light.flicker || 0;
        const wob =
          Math.sin(timeSec * 13 + light.x * 7) * 0.6 +
          Math.sin(timeSec * 8.3 + light.y * 5 + light.x * 3) * 0.4;
        const r = light.radius * (1 + flicker * 0.1 * wob);
        const dx = cx - light.x;
        const dy = cy - light.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < r * 0.45) { stufe = 2; break; } // hoechste Stufe -> fertig
        if (dist < r * 0.75 && stufe < 1) stufe = 1;
      }
      if (stufe > 0) {
        const key = variantIndex(tx, ty, 2) === 0 ? 'licht_dither_1' : 'licht_dither_2';
        out.push({ tx, ty, stufe, key });
      }
    }
  }
  return out;
}

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
  // Grafikpass 2 §8a.3: Trägt das TARGET-Tile shorePrefix UND stammt der
  // Source-Nachbar aus dem 'grass'-Set, werden shore_*-Ufer-Keys statt fringe_*
  // emittiert (Schaumsaum/dunkle Wasserlinie am Teich). Nur GRAVEYARD-'~' trägt
  // shorePrefix; Moos-Ufer (set 'moss') bleiben unverändert moss_fringe_*.
  const prefix = (set) => {
    if (def.shorePrefix && set === 'grass') return def.shorePrefix;
    return set === 'moss' ? 'moss_fringe' : 'fringe';
  };
  const out = [];
  const n = srcSet(0, -1);
  const e = srcSet(1, 0);
  const s = srcSet(0, 1);
  const w = srcSet(-1, 0);
  // Grafikpass 4 §2.1 Konkav-Ufer (Wahrheitstabelle): Genau 2 ADJAZENTE
  // grass-Shore-Orthoseiten an einem shorePrefix-Tile ERSETZEN die beiden
  // Ortho-Shore-Keys durch EINEN organischen Innenecken-Bogen
  // (shore_ine/inw/ise/isw). Betroffen ist AUSSCHLIESSLICH der grass->shore-
  // Namespace: moss/fringe-Orthos, die Diagonal-Ecken und die GP3-Nassrand-
  // Emission bleiben byte-gleich. 1 Seite / 2 opponierte Seiten / nur diagonal
  // = Bestand. Deterministisch aus (tx,ty). Reihenfolge im out-Array bleibt fuer
  // alle Bestandsfaelle identisch (inneKey wird null -> nichts eingeschoben).
  const sp = def.shorePrefix;
  const isShore = (side) => !!sp && side === 'grass';
  const shN = isShore(n), shE = isShore(e), shS = isShore(s), shW = isShore(w);
  const shoreCount = shN + shE + shS + shW;
  let inneKey = null;
  const skip = { n: false, e: false, s: false, w: false };
  if (shoreCount === 2) {
    if (shN && shE) { inneKey = `${sp}_ine`; skip.n = skip.e = true; }
    else if (shN && shW) { inneKey = `${sp}_inw`; skip.n = skip.w = true; }
    else if (shS && shE) { inneKey = `${sp}_ise`; skip.s = skip.e = true; }
    else if (shS && shW) { inneKey = `${sp}_isw`; skip.s = skip.w = true; }
    // opponiert (N+S / E+W): inneKey bleibt null -> Bestand (beide Ortho-Keys).
  }
  if (n && !skip.n) out.push(`${prefix(n)}_n`);
  if (e && !skip.e) out.push(`${prefix(e)}_e`);
  if (s && !skip.s) out.push(`${prefix(s)}_s`);
  if (w && !skip.w) out.push(`${prefix(w)}_w`);
  if (inneKey) out.push(inneKey);
  const corner = (dx, dy, name, ortho1, ortho2) => {
    const d = srcSet(dx, dy);
    if (d && d !== 'moss' && !ortho1 && !ortho2) out.push(`${prefix(d)}_${name}`);
  };
  corner(1, -1, 'ne', n, e);
  corner(-1, -1, 'nw', n, w);
  corner(1, 1, 'se', s, e);
  corner(-1, 1, 'sw', s, w);
  // Grafikpass 3 §2.1 Nassrand (additiv): Traegt das TARGET-Tile shorePrefix UND
  // stammt der orthogonale Source-Nachbar aus dem 'moss'-Set, werden die
  // moss_fringe_*-Keys (oben) WEITERHIN emittiert und ZUSAETZLICH danach
  // shorePrefix_n/e/s/w (nur Orthogonale) — die dunkle Nasskante am Gruft-Kanal
  // ueber den Moos-Ufern. Das grass-Quell-Verhalten (shore_*-Umlenkung via
  // prefix()) bleibt exakt wie in GP2. FLUESTERGRUFT-'~' traegt shorePrefix 'wet'.
  if (def.shorePrefix) {
    if (n === 'moss') out.push(`${def.shorePrefix}_n`);
    if (e === 'moss') out.push(`${def.shorePrefix}_e`);
    if (s === 'moss') out.push(`${def.shorePrefix}_s`);
    if (w === 'moss') out.push(`${def.shorePrefix}_w`);
  }
  return out;
}

export function createTilemap(rows, legend, overRows = null) {
  const hTiles = rows.length;
  const wTiles = rows[0].length;

  // Grafikpass 2 §2.1: Legenden-Kombinationen validieren (Datenfehler laut
  // sichtbar machen, wie der bisherige Stil).
  for (const [ch, def] of Object.entries(legend)) {
    if (def.variants) {
      if (def.anim) throw new Error(`createTilemap: Zeichen '${ch}' hat variants UND anim`);
      if (def.variants[0] !== def.art) throw new Error(`createTilemap: variants[0] von '${ch}' (${def.variants[0]}) != def.art (${def.art})`);
    }
    if (def.span) {
      const [sw, sh] = def.span;
      if (!Number.isInteger(sw) || !Number.isInteger(sh) || sw < 1 || sw > 4 || sh < 1 || sh > 4) {
        throw new Error(`createTilemap: span von '${ch}' = [${sw},${sh}] ausserhalb 1..4 oder nicht ganzzahlig`);
      }
      if (sw > 1 || sh > 1) {
        if (def.variants || def.anim) throw new Error(`createTilemap: span (>1) mit variants/anim an '${ch}' kombiniert`);
        for (let ty = 0; ty < hTiles; ty++) {
          if (rows[ty].indexOf(ch) !== -1) throw new Error(`createTilemap: span-Zeichen '${ch}' (w>1/h>1) kommt in den GROUND-rows vor (Ground bleibt 1x1)`);
        }
      }
    }
  }

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

  // Grafikpass 2 §8b.1: Wasser-Tiefen-Autotiling. Fuer jedes Tile mit
  // depthOverlays wird EINMALIG (deterministisch, kein Zufall/Zeitbezug) die
  // Chebyshev-Distanz zum naechsten Tile OHNE depthOverlays bestimmt — via
  // Multi-Source-BFS von allen Nicht-Overlay-Tiles aus (8er-Nachbarschaft, die
  // Wellen-Distanz IST die Chebyshev-Distanz). Ring = Distanz - 1: der Ufer-Ring
  // (Distanz 1) -> depthOverlays[0] (flach), der naechste Ring -> depthOverlays[1]
  // (mittel), tiefer -> nichts. depthArt[ty][tx] haelt den fertigen Art-Key oder
  // null; der Ground-Pass zeichnet ihn NACH Tile+Shore/Fringe statisch drueber.
  const depthArt = Array.from({ length: hTiles }, () => new Array(wTiles).fill(null));
  {
    const dist = Array.from({ length: hTiles }, () => new Array(wTiles).fill(Infinity));
    let frontier = [];
    for (let ty = 0; ty < hTiles; ty++) {
      for (let tx = 0; tx < wTiles; tx++) {
        if (!cells[ty][tx].depthOverlays) { dist[ty][tx] = 0; frontier.push([tx, ty]); }
      }
    }
    let d = 0;
    while (frontier.length) {
      const next = [];
      for (const [tx, ty] of frontier) {
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = tx + dx;
            const ny = ty + dy;
            if (nx < 0 || ny < 0 || nx >= wTiles || ny >= hTiles) continue;
            if (dist[ny][nx] !== Infinity) continue;
            dist[ny][nx] = d + 1;
            next.push([nx, ny]);
          }
        }
      }
      frontier = next;
      d++;
    }
    for (let ty = 0; ty < hTiles; ty++) {
      for (let tx = 0; tx < wTiles; tx++) {
        const def = cells[ty][tx];
        if (!def.depthOverlays) continue;
        const ring = dist[ty][tx] - 1; // Ufer-Ring (Distanz 1) = Index 0
        if (ring >= 0 && ring < def.depthOverlays.length) depthArt[ty][tx] = def.depthOverlays[ring];
      }
    }
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

  // Grafikpass 2 §2.3: Culling-Fenster für Span-Anker. maxSpanW/maxSpanH über
  // alle TATSÄCHLICH in overCells vorkommenden Defs — Anker knapp links/oberhalb
  // des Viewports müssen ihre hineinragenden Kronenteile trotzdem zeichnen.
  let maxSpanW = 1;
  let maxSpanH = 1;
  for (const row of overCells) {
    for (const def of row) {
      if (def && def.span) {
        if (def.span[0] > maxSpanW) maxSpanW = def.span[0];
        if (def.span[1] > maxSpanH) maxSpanH = def.span[1];
      }
    }
  }

  // Grafikpass 2 §8a.4: Kronen-Schlagschatten. Deterministisch aus overCells
  // abgeleitet: die Zellen direkt UNTER jeder Span-Anker-Fläche (Spalten
  // ax..ax+sw-1, Zeile ay+sh; bei 2×2-Kronen also ax/ax+1 in ay+2). Außerhalb
  // der Map: überspringen. Gezeichnet wird der Key 'canopy_shadow' im GROUND-
  // Pass (unter den Entities), NACH Tile+Fringes.
  const shadowCells = Array.from({ length: hTiles }, () => new Array(wTiles).fill(false));
  for (let ty = 0; ty < overCells.length; ty++) {
    for (let tx = 0; tx < wTiles; tx++) {
      const def = overCells[ty][tx];
      if (!def || !def.span) continue;
      const [sw, sh] = def.span;
      const shy = ty + sh;
      if (shy < 0 || shy >= hTiles) continue;
      for (let dx = 0; dx < sw; dx++) {
        const shx = tx + dx;
        if (shx < 0 || shx >= wTiles) continue;
        shadowCells[shy][shx] = true;
      }
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
      // animRate Frames/s (Default 6). Positions-Offset entsynchronisiert
      // Fackeln (lebendigeres Flackern); animSync schaltet ihn ab (Wasserwellen
      // laufen synchron).
      const rate = def.animRate || 6;
      const offset = def.animSync ? 0 : tx * 13 + ty * 7;
      const frame = (Math.floor(timeSec * rate) + offset) % def.anim.length;
      return def.anim[frame];
    }
    if (def.variants) {
      // Deterministische Variante aus der Tile-Koordinate (gleichverteilt).
      return def.variants[variantIndex(tx, ty, def.variants.length)];
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
    // Über-Layer: Startfenster nach links/oben um (maxSpan-1) erweitern, damit
    // Anker knapp außerhalb ihre in den Viewport ragenden Kronen zeichnen
    // (§2.3). Der Ground-Layer bleibt strikt 1x1.
    // Grafikpass 3 §2.1: das obere Kronen-Culling um 1 Tile ZUSAETZLICH weiten —
    // der Anker-Jitter (bis +2 px nach unten) kann einen Anker eine Zeile ueber
    // dem Viewport knapp in ihn hineinschieben.
    const tyStart = over ? Math.max(0, ty0 - (maxSpanH - 1) - 1) : ty0;
    const txStart = over ? Math.max(0, tx0 - (maxSpanW - 1)) : tx0;
    for (let ty = tyStart; ty <= ty1; ty++) {
      for (let tx = txStart; tx <= tx1; tx++) {
        const def = over ? overCells[ty][tx] : cells[ty][tx];
        if (!def) continue;
        const sx = Math.round(tx * TILE - camX);
        let sy = Math.round(ty * TILE - camY);
        // Grafikpass 3 §2.1 Anker-Jitter: Span-Anker (Kronen) im Over-Layer
        // bekommen einen deterministischen vertikalen Pixel-Versatz -2..+2, damit
        // Baumreihen als Einzelbaeume lesen und nicht auf einer Linie sitzen.
        // Rein deterministisch (variantIndex), Ground-Layer unberuehrt.
        if (over && def.span) sy += variantIndex(tx, ty, 5) - 2;
        const img = tileCanvases[artFor(def, tx, ty, timeSec)];
        if (img) ctx.drawImage(img, sx, sy);
        if (!over && def.fringeTarget) {
          for (const key of fringeOverlays(defAt, tx, ty)) {
            const fimg = tileCanvases[key];
            if (fimg) ctx.drawImage(fimg, sx, sy);
          }
        }
        // Grafikpass 2 §8b.1: Wasser-Tiefen-Overlay im GROUND-Pass NACH
        // Tile+Shore/Fringe (statisch ueber dem animierten Wasser). Fehlt der
        // Art-Key noch, wird still nichts gezeichnet.
        if (!over && depthArt[ty][tx]) {
          const dimg = tileCanvases[depthArt[ty][tx]];
          if (dimg) ctx.drawImage(dimg, sx, sy);
        }
        // Grafikpass 2 §8a.4: Kronen-Schlagschatten im GROUND-Pass NACH
        // Tile+Fringes (unter den Entities), auf den aus overCells abgeleiteten
        // Zellen. Fehlt der Art-Key noch, wird still nichts gezeichnet.
        if (!over && shadowCells[ty][tx]) {
          const shimg = tileCanvases['canopy_shadow'];
          if (shimg) ctx.drawImage(shimg, sx, sy);
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
