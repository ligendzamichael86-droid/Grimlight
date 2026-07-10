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
  // Grafikpass 2: Ziegel-/Steinboden-Varianten (der Arena-Boden ist die grösste
  // gleichzeitig sichtbare Wiederholungsfläche im Spiel).
  // Grafikpass 2 R3 (§8b.3): brick_wall_v3/stone_floor_v3 als vierte Varianten
  // (der Arena-Boden ist die groesste gleichzeitig sichtbare Wiederholungsflaeche).
  '#': { art: 'brick_wall', solid: true, fringeSource: true, fringeSet: 'moss', variants: ['brick_wall', 'brick_wall_v1', 'brick_wall_v2', 'brick_wall_v3'] },
  '.': { art: 'stone_floor', solid: false, fringeTarget: true, variants: ['stone_floor', 'stone_floor_v1', 'stone_floor_v2', 'stone_floor_v3'] },
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
  ambient: 0.66,          // Grafikpass 3 §4.2: 0.70 -> 0.66 (jetzt UMGESETZT; die fuenf sanktionierten check_boss_slice3.mjs-Zeilen sind laut §5.1 mitgezogen)
  // Grafikpass 3 §2.3/§4.2: rotbraune Drohung (Boss-Arena).
  ambientTint: '#120608',
  playerLightRadius: 52,
  fog: false,
  torchChars: ['W'],
};
