// Map-Daten Slice 1. Reines Daten-Modul, Node-importierbar.
//
// Konventionen (bindend, siehe Übergabe Slice 0):
// - Spawn-Punkte sind WELTPIXEL und bezeichnen das ZENTRUM der Entity-AABB.
//   Builder B rechnet x = spawn.x - w/2, y = spawn.y - h/2.
// - Slice 2: enemySpawns = [{ x, y, kind }] fuer die neuen Gegner-Kinds
//   ('hound' | 'rust', Dispatch via createEnemy). skeletonSpawns und
//   ghoulSpawns bleiben unangetastet, Migration erst in Slice 3.
// - Slice 2: Truhen-propSpawns tragen optional content ('treasure' ist
//   Default in props.js | 'boomerang').
// - portals: Welt-AABBs; target = Schlüssel in MAPS; spawn = Zentrum der
//   Spieler-AABB in der ZIELmap (begehbar, nicht im Gegenportal).
// - torchChars: alle Legenden-Zeichen, die Fackel-Tiles sind. main.js
//   extrahiert die Lichtquellen via tilemap.findTiles(zeichen) — Fackel-
//   Lichter werden NICHT hier gepflegt.
// - ambient: 0..1 Dunkelheitsgrad (lighting.js), playerLightRadius: Radius
//   der Spieler-Laterne in px, fog: Nebelschwaden (hud.drawFog) ja/nein.

// ---------------------------------------------------------------------------
// FRIEDHOF — 40×24 Tiles.
// Legende: # Mauer, T Baum, . Gras, , Gras-Detail, = Weg, ~ Wasser,
// G/g/h Grabstein-Varianten, b toter Busch, o Knochen, s Schädel, f Zaun,
// F Fackel (animiert, solide), D Krypta-Treppe abwärts (begehbar, Portal).
// Krypta-Eingang im Nordosten (x30-35, y1-4), Zugang über die Lücke bei
// (32-33, y4).
const GRAVEYARD_ROWS = [
  '########################################',
  '#TT.,..b.T' + '.....,....' + '..,..s.o..' + '######..T#',
  '#T....o...' + ',...,...b.' + '......,...' + '#.DD.#..T#',
  '#..G.g.h..' + ',......G.g' + '.h.G......' + '#....#,.T#',
  '#...o.....' + '..........' + '..s.....b.' + '##..##..T#',
  '#..g.G.h..' + '.....F....' + '.G.h.g....' + '..o.....T#',
  '#.,....b..' + '.....==...' + '.ff...ff..' + '........T#',
  '#..G.g.G..' + '..,..==...' + '.g.h.G....' + '..G.g...T#',
  '#....o....' + '.....==...' + '..........' + '.......,T#',
  '#T...,....' + '.....==...' + '.....,....' + '..T..b..T#',
  '#T.,..s...' + '.....==..,' + '..,.......' + '.T......T#',
  '#T........' + '.....==...' + '.......o..' + ',.......T#',
  '#=========' + '==========' + '==========' + '====,...T#',
  '#=========' + '==========' + '==========' + '====,...T#',
  '#.,..b...F' + '..f..f....' + '....,..s..' + '........T#',
  '#....G.g..' + '...G.h....' + '..........' + '.~~~~~..T#',
  '#..o......' + '..........' + '....,....~' + '~~~~~~~.T#',
  '#..,.G.h..' + '...g.G....' + '.........~' + '~~~~~~~.T#',
  '#.........' + '....b..,..' + '........F.' + '.~~~~~..T#',
  '#T....,...' + '.......o..' + '...G.g....' + '........T#',
  '#T..,..s..' + '..g.G.....' + '..........' + '...,..bTT#',
  '#TT.....b.' + '..........' + '.,....o...' + '..,....TT#',
  '#TTT...,..' + '...T..s...' + '......T...' + '......TTT#',
  '########################################',
];

// Slice 1.5: Fringe — Gras (fringeSource, Set 'grass') franst über Weg- und
// Wasserränder (fringeTarget). Bäume sind jetzt Stamm (ground, solid) + Krone
// ('C', over-Layer, nie solid) — Begehbarkeit bleibt exakt wie bei 'tree'.
const GRAVEYARD_LEGEND = {
  '#': { art: 'wall', solid: true },
  'T': { art: 'tree_trunk', solid: true },
  // Kronen-Zeichen (nur Over-Layer, nie solid): 'B' = canopy_bottom liegt AUF
  // der Stamm-Zelle (Wurzeln bleiben sichtbar), 'K' = canopy_top eine Zelle
  // darüber, 'C' = runde Einzel-/Cluster-Krone (Füller für Waldränder).
  'B': { art: 'tree_canopy_bottom', solid: false },
  'K': { art: 'tree_canopy_top', solid: false },
  'C': { art: 'tree_canopy', solid: false },
  '.': { art: 'grass_dark', solid: false, fringeSource: true, fringeSet: 'grass' },
  ',': { art: 'grass_detail', solid: false, fringeSource: true, fringeSet: 'grass' },
  '=': { art: 'path', solid: false, fringeTarget: true },
  'G': { art: 'gravestone', solid: true },
  'g': { art: 'gravestone_2', solid: true },
  'h': { art: 'gravestone_3', solid: true },
  'b': { art: 'bush_dead', solid: true },
  'o': { art: 'bones', solid: false },
  's': { art: 'skull', solid: false },
  'f': { art: 'fence', solid: true },
  '~': { art: 'water', solid: true, fringeTarget: true },
  'F': { art: 'torch_0', solid: true, anim: ['torch_0', 'torch_1'] },
  'D': { art: 'crypt_stairs_down', solid: false },
};

// Over-Layer Friedhof: Zweiteiler-Kronen über jedem Stamm — 'B' (canopy_
// bottom) auf der Stamm-Zelle, 'K' (canopy_top) ein Tile darüber; man läuft
// unter den Kronen durch. Deterministisch erzeugt (.tmp/gen_overrows.mjs,
// Komposition siehe .tmp/sheet_tree.png); '.' = leere Zelle.
const GRAVEYARD_OVER_ROWS = [
  '.KK......K............................K.',
  '.BB......B............................B.',
  '.B....................................B.',
  '......................................B.',
  '......................................B.',
  '......................................B.',
  '......................................B.',
  '......................................B.',
  '.K..............................K.....B.',
  '.B.............................KB.....B.',
  '.B.............................B......B.',
  '.B....................................B.',
  '......................................B.',
  '......................................B.',
  '......................................B.',
  '......................................B.',
  '......................................B.',
  '......................................B.',
  '.K....................................B.',
  '.B...................................KB.',
  '.BK..................................BB.',
  '.BBK.........K............K.........KBB.',
  '.BBB.........B............B.........BBB.',
  '........................................',
];

// ---------------------------------------------------------------------------
// KATAKOMBEN — 40×24 Tiles, Rand komplett solide. Gänge + 4 Kammern:
// Eingang (Treppe hoch, NW) → Nordhalle → Quergang/Westkammer →
// Südgang → Schatzkammer (SO, hinterste Kammer, Truhe von Ghulen bewacht).
// Legende: # Ziegelwand, . Steinboden, , rissiger Steinboden, P Pfeiler,
// R Schutt, S Sarkophag, W Wandfackel (animiert, solide),
// U Treppe aufwärts (begehbar, Portal zurück zum Friedhof).
const CATACOMBS_ROWS = [
  '########################################',
  '#####W########W######W##################',
  '##.....,.#W##....,.....#################',
  '##.U...........P....P..##W##############',
  '#W...,.....,..................##########',
  '##.......####.,......,........##########',
  '##R......####..P....P..#####..##########',
  '####..#######R.........#####..W#########',
  '###W..##########..##########,.##########',
  '####,.#########W..#########W..##########',
  '####..#W########..W#########..#W####W###',
  '####............,.#########...........##',
  '###W,.............########W.....SS....##',
  '###.........#W#############...P....P,.##',
  '###.....,...W##############..,........W#',
  '###..SS.....###############...........##',
  '###.........##W#########W##....,......##',
  '###.................,.......,.........##',
  '###....,.....,..........,.....P....P..##',
  '###.........#######W#######.......,...W#',
  '#####W#####################R.........R##',
  '#################################W######',
  '########################################',
  '########################################',
];

// Slice 1.5: Moos-Fringe — Ziegelwand (fringeSource, Set 'moss', keine Ecken)
// wächst über die Steinboden-Ränder (fringeTarget). Weicht die harten Wand-
// Boden-Kanten auf (SoM-Look), ohne Begehbarkeit zu ändern.
const CATACOMBS_LEGEND = {
  '#': { art: 'brick_wall', solid: true, fringeSource: true, fringeSet: 'moss' },
  '.': { art: 'stone_floor', solid: false, fringeTarget: true },
  ',': { art: 'stone_floor_cracked', solid: false, fringeTarget: true },
  'P': { art: 'pillar', solid: true },
  'R': { art: 'rubble', solid: true },
  'S': { art: 'sarcophagus', solid: true },
  'W': { art: 'torch_wall_0', solid: true, anim: ['torch_wall_0', 'torch_wall_1'] },
  'U': { art: 'stairs_up', solid: false },
};

// Tile-Zentrum in Weltpixeln
function tc(tx, ty) {
  return { x: tx * 16 + 8, y: ty * 16 + 8 };
}

// Welt-AABB eines Tile-Rechtecks (für Portale)
function tileRect(tx, ty, wTiles = 1, hTiles = 1) {
  return { x: tx * 16, y: ty * 16, w: wTiles * 16, h: hTiles * 16 };
}

export const GRAVEYARD = {
  rows: GRAVEYARD_ROWS,
  legend: GRAVEYARD_LEGEND,
  overRows: GRAVEYARD_OVER_ROWS,
  playerSpawn: tc(3, 12),
  skeletonSpawns: [
    tc(10, 3),
    tc(25, 4),
    tc(33, 8),
    tc(20, 16),
    tc(8, 18),
    tc(25, 20),
  ],
  ghoulSpawns: [],
  enemySpawns: [
    { ...tc(18, 10), kind: 'hound' },
    { ...tc(15, 19), kind: 'hound' },
  ],
  propSpawns: [
    { ...tc(6, 4), kind: 'vase' },
    { ...tc(12, 9), kind: 'urn' },
    { ...tc(23, 15), kind: 'vase' },
    { ...tc(31, 19), kind: 'urn' },
    { ...tc(6, 20), kind: 'vase' },
  ],
  // Krypta-Treppe (die beiden D-Tiles) → Katakomben, Spawn in der
  // Eingangskammer NEBEN der Treppe nach oben (nicht im Gegenportal).
  portals: [
    { ...tileRect(32, 2, 2, 1), target: 'CATACOMBS', spawn: tc(6, 4) },
  ],
  ambient: 0.45,
  playerLightRadius: 40,
  fog: true,
  torchChars: ['F'],
};

export const CATACOMBS = {
  rows: CATACOMBS_ROWS,
  legend: CATACOMBS_LEGEND,
  playerSpawn: tc(6, 4), // Dev-Start (?map=CATACOMBS); regulär via Portal-Spawn
  skeletonSpawns: [
    tc(17, 3),
    tc(26, 4),
    tc(16, 10),
    tc(8, 12),
    tc(7, 17),
    tc(18, 18),
    tc(23, 17),
    tc(31, 19),
  ],
  ghoulSpawns: [
    tc(9, 15),  // Westkammer
    tc(31, 15), // Schatzkammer (Wachen)
    tc(34, 14),
    tc(34, 17),
  ],
  enemySpawns: [
    { ...tc(20, 4), kind: 'hound' },  // Nordhalle
    { ...tc(20, 17), kind: 'hound' }, // Suedgang
    { ...tc(7, 14), kind: 'rust' },   // Wache Bumerang-Truhe (Westkammer)
    { ...tc(14, 12), kind: 'rust' },  // Westgang
    { ...tc(33, 16), kind: 'rust' },  // Schatzkammer
  ],
  propSpawns: [
    { ...tc(7, 5), kind: 'vase' },
    { ...tc(13, 2), kind: 'urn' },
    { ...tc(22, 6), kind: 'vase' },
    { ...tc(29, 4), kind: 'urn' },
    { ...tc(29, 12), kind: 'vase' },
    { ...tc(5, 13), kind: 'vase' },
    // Slice 2: Vase von tc(4,16) nach tc(4,17) verschoben, das Tile gehoert
    // jetzt der Bumerang-Truhe (Westkammer, bewacht von einem Rostpanzer).
    { ...tc(4, 17), kind: 'vase' },
    { ...tc(4, 16), kind: 'chest', content: 'boomerang' },
    { ...tc(10, 19), kind: 'urn' },
    { ...tc(13, 17), kind: 'urn' },
    { ...tc(21, 18), kind: 'vase' },
    { ...tc(27, 19), kind: 'urn' },
    { ...tc(36, 19), kind: 'urn' },
    // Slice-Ziel: Schatztruhe in der hintersten Kammer, von Ghulen bewacht
    { ...tc(36, 15), kind: 'chest' },
  ],
  // Treppe nach oben (U-Tile) → Friedhof, Spawn südlich vor der Krypta-Lücke
  // (nicht im Friedhofs-Portal, das liegt auf den D-Tiles bei y=2).
  portals: [
    { ...tileRect(3, 3), target: 'GRAVEYARD', spawn: tc(33, 5) },
  ],
  ambient: 0.82,
  playerLightRadius: 52,
  fog: false,
  torchChars: ['W'],
};

export const MAPS = { GRAVEYARD, CATACOMBS };
