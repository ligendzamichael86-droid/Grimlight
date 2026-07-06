// FLUESTERGRUFT (Slice 3 §2.5), 40x24 Tiles = 640x384 px. Dunkelste Ebene.
// Reines Daten-Modul im Bestandsformat (ROWS/LEGEND), Node-importierbar.
// Erzeugt/verifiziert via .tmp/gen_slice3_maps.mjs (Raender solide, Legende
// vollstaendig, alle Spawns/Portale/Truhen begehbar UND per Flood-Fill vom
// Eingang erreichbar, Fackeln > 0).
//
// Dramaturgie (§2.5, bindend):
// - Kritischer Pfad Eingang(NW) -> Zentralhalle -> gefluteter Sued-Korridor
//   -> Boss-Vorplatz(Sued): Fackel alle 6-8 Tiles.
// - Nebenkammern/Sackgassen UNBEFEUERT (Elite-Augen gluehen im Dunkeln):
//   Schluesselkammer(NE, hinterste) und Herz-Nische(SW, geflutet).
// - Boss-Vorplatz: 4 Fackeln, hellster Ort der Map.
// - Geflutete Abschnitte = Wasser-Tiles, hier BEGEHBAR (rein visuell, keine
//   neue Mechanik, §2.5 "normal begehbar oder solide").
//
// Nur enemySpawns (Legacy-Arrays leer, §2.5): 5 Skelette, 3 Ghule, 2 Hunde
// (beide in der grossen Zentralhalle, Orbit braucht Radius 56 plus Luft),
// 1 Rostpanzer (bewacht das Boss-Portal frontal an der Engstelle); Eliten
// (nur hier, §2.4): 2 Elite-Skelette + 1 Elite-Ghul in der Schluesselkammer,
// 1 Elite-Grufthund in der Herz-Zugangshalle (nie in der Nische selbst).
// Summe 64 XP, 15 Gegner.

import { tc, tileRect } from './coords.js';

const FLUESTERGRUFT_ROWS = [
  '########################################',
  '####W#############W#####################',
  '##.U.....##W##.S.........S.####........#',
  '##..............P...............P......#',
  '##.....................................#',
  '##.......#####.............####........#',
  '####.#########.............####........#',
  '####.#########.............####........#',
  '####.#########..........P..#############',
  '####.#########.....~~~~....#############',
  '####.#############W~~~~#################',
  '####...........####~~~~#################',
  '##~~~~.........####~~~~#################',
  '##~~~~.........####~~~~#################',
  '##~~~~.........####~~~~#################',
  '##~~~~.........####~~~~W################',
  '##~~~~.............~~~~.....############',
  '##~~~~......................############',
  '##~~~~......W...............W###########',
  '#####.......................############',
  '#############...............############',
  '#############....R..D..R....############',
  '################W#######W###############',
  '########################################',
];

// Legende: bestehende TILE_ART-Schluessel (Katakomben-Aesthetik). Wasser hier
// BEGEHBAR (solid:false) fuer die gefluteten Gaenge/Nischen.
const FLUESTERGRUFT_LEGEND = {
  '#': { art: 'brick_wall', solid: true, fringeSource: true, fringeSet: 'moss' },
  '.': { art: 'stone_floor', solid: false, fringeTarget: true },
  ',': { art: 'stone_floor_cracked', solid: false, fringeTarget: true },
  '~': { art: 'water', solid: false, fringeTarget: true },
  'P': { art: 'pillar', solid: true },
  'R': { art: 'rubble', solid: true },
  'S': { art: 'sarcophagus', solid: true },
  'W': { art: 'torch_wall_0', solid: true, anim: ['torch_wall_0', 'torch_wall_1'] },
  'U': { art: 'stairs_up', solid: false },      // Portal zurueck CATACOMBS
  'D': { art: 'crypt_stairs_down', solid: false }, // Portal hinab BOSS_KAMMER
};

export const FLUESTERGRUFT = {
  rows: FLUESTERGRUFT_ROWS,
  legend: FLUESTERGRUFT_LEGEND,
  playerSpawn: tc(4, 4), // Dev-Start (?map=FLUESTERGRUFT); regulaer via Portal
  // Migration der Legacy-Arrays erst in S5 (Entscheidung 10): hier leer.
  skeletonSpawns: [],
  ghoulSpawns: [],
  enemySpawns: [
    // Normale Besatzung (§2.5)
    { ...tc(6, 3), kind: 'skeleton' },   // Eingangskammer
    { ...tc(16, 6), kind: 'skeleton' },  // Zentralhalle
    { ...tc(22, 7), kind: 'skeleton' },  // Zentralhalle
    { ...tc(20, 12), kind: 'skeleton' }, // gefluteter Korridor
    { ...tc(17, 19), kind: 'skeleton' }, // Boss-Vorplatz
    { ...tc(20, 11), kind: 'ghoul' },    // gefluteter Korridor
    { ...tc(21, 14), kind: 'ghoul' },    // gefluteter Korridor
    { ...tc(7, 16), kind: 'ghoul' },     // Nischen-Zugang (geflutet)
    { ...tc(18, 4), kind: 'hound' },     // Zentralhalle (Orbit-Luft)
    { ...tc(24, 5), kind: 'hound' },     // Zentralhalle (Orbit-Luft)
    { ...tc(20, 18), kind: 'rust' },     // Engstelle vor dem Boss-Portal
    // Eliten (§2.4, nur hier)
    { ...tc(33, 3), kind: 'skeleton', elite: true }, // Schluesselkammer
    { ...tc(36, 6), kind: 'skeleton', elite: true }, // Schluesselkammer
    { ...tc(34, 5), kind: 'ghoul', elite: true },    // Schluesselkammer
    { ...tc(9, 15), kind: 'hound', elite: true },    // Herz-Zugangshalle
  ],
  propSpawns: [
    { ...tc(5, 4), kind: 'vase' },    // Eingang
    { ...tc(22, 3), kind: 'urn' },    // Zentralhalle
    { ...tc(15, 8), kind: 'vase' },   // Zentralhalle
    { ...tc(18, 8), kind: 'vase' },   // Zentralhalle
    { ...tc(32, 6), kind: 'vase' },   // Schluesselkammer (Loot)
    { ...tc(20, 13), kind: 'urn' },   // gefluteter Korridor
    { ...tc(11, 17), kind: 'vase' },  // Herz-Zugangshalle
    { ...tc(4, 14), kind: 'vase' },   // Herz-Nische
    { ...tc(15, 17), kind: 'vase' },  // Boss-Vorplatz (1/3)
    { ...tc(25, 17), kind: 'urn' },   // Boss-Vorplatz (2/3)
    { ...tc(20, 17), kind: 'vase' },  // Boss-Vorplatz (3/3)
    // Schluessel-Truhe in der hintersten Kammer (hinter der Eliten-Wache)
    { ...tc(36, 4), kind: 'chest', content: 'boss_key' },
    // Herz-Truhe in der gefluteten Seitennische
    { ...tc(3, 16), kind: 'chest', content: 'heart' },
  ],
  // U-Tile (3,2) -> Katakomben; Ziel-Spawn neben dem Katakomben-Abgang.
  // D-Tile (20,21) -> Bosskammer, per Boss-Schluessel verriegelt (§3).
  portals: [
    { ...tileRect(3, 2), target: 'CATACOMBS', spawn: tc(34, 12) },
    { ...tileRect(20, 21), target: 'BOSS_KAMMER', spawn: tc(10, 9), requires: 'boss_key' },
  ],
  ambient: 0.85,          // dunkelste Ebene
  playerLightRadius: 52,
  fog: false,             // Mobile-Overdraw (§2.5)
  torchChars: ['W'],
};
