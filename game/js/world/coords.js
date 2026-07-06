// Tile-Koordinaten-Helfer (Slice 3 §3). Winziges Modul OHNE Imports.
//
// Grund fuer die Auslagerung aus maps.js: die neuen Map-Dateien
// (map_fluestergruft.js, map_bosskammer.js) brauchen tc()/tileRect() fuer
// ihre Spawn-/Portal-Anker. Wuerden sie tc aus maps.js importieren, waehrend
// maps.js die Map-Dateien importiert, entstuende ein Zirkelimport mit
// TDZ-Falle. Beide Seiten importieren stattdessen aus dieser blattlosen
// Datei; maps.js re-exportiert tc/tileRect fuer Alt-Nutzer.

// Tile-Zentrum in Weltpixeln (Konvention: Spawn-Anker = ZENTRUM der AABB).
export function tc(tx, ty) {
  return { x: tx * 16 + 8, y: ty * 16 + 8 };
}

// Welt-AABB eines Tile-Rechtecks (fuer Portal-Felder).
export function tileRect(tx, ty, wTiles = 1, hTiles = 1) {
  return { x: tx * 16, y: ty * 16, w: wTiles * 16, h: hTiles * 16 };
}
