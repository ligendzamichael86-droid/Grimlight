// BOSS_KAMMER (Slice 3 §2.5), 20x12 Tiles = 320x192 px. Ein-Bildschirm-Arena.
// Reines Daten-Modul im Bestandsformat, Node-importierbar. Erzeugt/verifiziert
// via .tmp/gen_slice3_maps.mjs.
//
// Struktur (§2.5): runde Halle ueber 2x2-abgeschraegte Wand-Ecken, 1 Tile
// Randmauer, Innenflaeche 18x10 (Reihen 1..10), KEINE Props/Saeulen in der
// Innenflaeche (null Ausweich-Fallen), 6 Wandfackeln. Kamera klemmt bei
// worldW==viewW sauber auf 0 (kein Sondercode noetig, §2.5).
//
// Spawns (§2.5): Spieler-Eintritt tc(10,9) (Sued), Rueck-Portal
// tileRect(9,10,2,1) eine Reihe suedlich (disjunkt von der Spieler-AABB),
// Boss tc(10,4) (Siegtruhen-Anker nach Boss-Tod, main.js), Add-Anker
// tc(4,3)/tc(15,3)/tc(4,8)/tc(15,8) (alle begehbar, Assert Smoke §4.34).

import { tc, tileRect } from './coords.js';

const BOSS_KAMMER_ROWS = [
  '#####W########W#####',
  '###..............###',
  '##................##',
  '#..................#',
  'W..................W',
  '#..................#',
  '#..................#',
  '#..................#',
  '#..................#',
  '##................##',
  '###......UU......###',
  '#####W########W#####',
];

const BOSS_KAMMER_LEGEND = {
  '#': { art: 'brick_wall', solid: true, fringeSource: true, fringeSet: 'moss' },
  '.': { art: 'stone_floor', solid: false, fringeTarget: true },
  'W': { art: 'torch_wall_0', solid: true, anim: ['torch_wall_0', 'torch_wall_1'] },
  'U': { art: 'stairs_up', solid: false }, // Rueck-Portal FLUESTERGRUFT
};

export const BOSS_KAMMER = {
  rows: BOSS_KAMMER_ROWS,
  legend: BOSS_KAMMER_LEGEND,
  playerSpawn: tc(10, 9), // Dev-Start (?map=BOSS_KAMMER) UND regulaerer Eintritt
  skeletonSpawns: [],
  ghoulSpawns: [],
  // Der Grabwaechter (kind 'graveward', registriert in boss.js). main.js
  // filtert ihn bei runFlags.bossDead nur BEIM ERZEUGEN (§3), MAPS bleibt
  // unmutiert. Add-Anker liegen als Datenfelder NICHT hier (Boss beschwoert
  // sie zur Laufzeit, §2.2).
  enemySpawns: [
    { ...tc(10, 4), kind: 'graveward' },
  ],
  // KEINE Props in der Innenflaeche (§2.5).
  propSpawns: [],
  // Rueck-Portal (2 Tiles) -> FLUESTERGRUFT, boss-verriegelt (nur wenn ein
  // lebender Grabwaechter nicht 'idle' ist, Fluchtklausel §2.6.4). Ziel-Spawn
  // auf dem Boss-Vorplatz neben dem Abstiegs-Portal (nicht im Gegenportal).
  portals: [
    { ...tileRect(9, 10, 2, 1), target: 'FLUESTERGRUFT', spawn: tc(20, 20), bossLocked: true },
  ],
  ambient: 0.7,           // Telegraphen muessen lesbar sein (§2.5)
  playerLightRadius: 52,
  fog: false,
  torchChars: ['W'],
};
