// Basis-Kollision für Entities. Node-importierbar.
// Konvention (bindend): JEDE Positionsänderung (Bewegung, Knockback,
// Münz-Streuung) läuft durch moveWithCollision — nichts landet in soliden Tiles.

const TILE = 16;
const EPS = 0.0001;    // wie tilemap.rectCollides: Kanten halb-offen [x, x+w)
const MAX_STEP = 8;    // Sub-Step < Tilegröße: kein Tunneln, Snap immer exakt

export function aabbOverlap(a, b) {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

// Events sind String ODER Objekt { type, ...payload } (Slice 2).
// Alle Alt-Events bleiben Strings; die Objektform haben nur item_pickup
// und weapon_found. Verbraucher lesen ueber diese beiden Helfer.
export function getEvent(events, type) {
  for (const ev of events) {
    if (ev === type) return ev;
    if (ev && typeof ev === 'object' && ev.type === type) return ev;
  }
  return null;
}

export function hasEvent(events, type) {
  return getEvent(events, type) !== null;
}

// Achsen getrennt: erst X, bei Kollision Snap an die Tile-Kante, dann Y.
// Größere Deltas werden in Sub-Steps < 16 px zerlegt, damit pro Schritt
// höchstens eine neue Tile-Reihe/-Spalte betreten wird und der Snap stimmt.
export function moveWithCollision(ent, map, dx, dy) {
  return {
    x: sweepAxis(ent, map, 'x', dx),
    y: sweepAxis(ent, map, 'y', dy),
  };
}

function sweepAxis(ent, map, axis, delta) {
  if (delta === 0) return false;
  const size = axis === 'x' ? ent.w : ent.h;
  let remaining = delta;
  while (remaining !== 0) {
    const d = Math.max(-MAX_STEP, Math.min(MAX_STEP, remaining));
    remaining -= d;
    const next = ent[axis] + d;
    const box = axis === 'x'
      ? { x: next, y: ent.y, w: ent.w, h: ent.h }
      : { x: ent.x, y: next, w: ent.w, h: ent.h };
    if (!map.rectCollides(box)) {
      ent[axis] = next;
      continue;
    }
    if (d > 0) ent[axis] = Math.floor((next + size - EPS) / TILE) * TILE - size;
    else ent[axis] = (Math.floor(next / TILE) + 1) * TILE;
    return true;
  }
  return false;
}
