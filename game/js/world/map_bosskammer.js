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
  '#.....c............#',
  'W..................W',
  '#.............x....#',
  '#..................#',
  '#.....x............#',
  '#............c.....#',
  '##................##',
  '###......UU......###',
  '#####W########W#####',
];

const BOSS_KAMMER_LEGEND = {
  // Grafikpass 2: Ziegel-/Steinboden-Varianten (der Arena-Boden ist die grösste
  // gleichzeitig sichtbare Wiederholungsfläche im Spiel).
  // Grafikpass 2 R3 (§8b.3): brick_wall_v3/stone_floor_v3 als vierte Varianten
  // (der Arena-Boden ist die groesste gleichzeitig sichtbare Wiederholungsflaeche).
  // Grafikpass 5 §2.A2 UNGERADE-n-SWEEP: n war 4 (gerade) -> brick_wall_v6
  // (Art: Russfleck) haengt an, n=5. Kein bankSet-Flag (kein Wasser in der Arena).
  // GP5 RUNDE 3 VERDRAHTUNGS-NACHZUG (Jury R2, Auftrag 5): brick_wall_l1..l4
  // (vier Luminanz-Stufen der Ziegelgesichter) lagen fertig in art/sprites.js
  // und hingen an KEINER Legende -> wirkungslos. Sie haengen hier an, n = 9
  // (UNGERADE, teilerfremd zu 5/7/17/29/47). NUR die variants-Liste ist
  // angefasst; die map_bosskammer-ROWS bleiben tabu (SPEC §1.3).
  '#': { art: 'brick_wall', solid: true, fringeSource: true, fringeSet: 'moss', variants: ['brick_wall', 'brick_wall_v1', 'brick_wall_v2', 'brick_wall_v3', 'brick_wall_v6', 'brick_wall_l1', 'brick_wall_l2', 'brick_wall_l3', 'brick_wall_l4'] },
  // §2.A2: n war 4 -> stone_floor_v8 (Art: Brandfleck) haengt an, n=5. Der
  // Arena-Boden ist die groesste gleichzeitig sichtbare Wiederholungsflaeche.
  '.': { art: 'stone_floor', solid: false, fringeTarget: true, variants: ['stone_floor', 'stone_floor_v1', 'stone_floor_v2', 'stone_floor_v3', 'stone_floor_v8'] },
  // Grafikpass 4 §3.8a/§4: Wandfackel jetzt 3-Frame-Zyklus (torch_wall_2).
  'W': { art: 'torch_wall_0', solid: true, anim: ['torch_wall_0', 'torch_wall_1', 'torch_wall_2'] },
  'U': { art: 'stairs_up', solid: false }, // Rueck-Portal FLUESTERGRUFT
  // Grafikpass 4 §2.7c: begehbare Boden-Decals (verifyNeutral, sol/geo bleiben
  // gruen). 'c' = floor_decal_crack (dunkler), 'x' = floor_decal_bones (heller
  // via Knochen-Toene). WIE '.'-Boden: solid:false, fringeTarget:true, damit die
  // Moos-Fringes der Wand weiter ueber die Decal-Kanten wachsen.
  'c': { art: 'floor_decal_crack', solid: false, fringeTarget: true },
  'x': { art: 'floor_decal_bones', solid: false, fringeTarget: true },
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
  // GRAFIKPASS 6 §3.2 (GP6-§7A): 0.66 -> 0.48. Median-Prognose 39,8
  // (M1-Band 38..48). Die fuenf sanktionierten Zeilen 143/172/185/244/264 in
  // .tmp/check_boss_slice3.mjs sind mitgezogen.
  ambient: 0.48,          // Grafikpass 3 §4.2: 0.70 -> 0.66 (GP6 §3.2: -> 0.48; die sanktionierten check_boss_slice3.mjs-Zeilen sind laut §7.A mitgezogen)
  // Grafikpass 3 §2.3/§4.2: rotbraune Drohung (Boss-Arena).
  ambientTint: '#120608',
  playerLightRadius: 52,
  fog: false,
  torchChars: ['W'],
  // SLICE 5 §4.4 (additiv, geoHash-frei): Grundmusik der Kammer. Die zweite
  // Ebene 'boss_aggro' schaltet main.js, sobald der Grabwaechter aus 'idle'
  // heraus ist — nach dem Sieg existiert er nicht mehr, die ruhige Fassung
  // kommt also von selbst zurueck.
  music: 'boss_idle',
  // Grafikpass 5 §5.D4 BOSS-ARENA-LICHT (Jury STRUKTUR-6a): die sechs Wand-
  // fackeln sitzen ausschliesslich am Rand — die Arena-MITTE, in der der Kampf
  // stattfindet, war der dunkelste Punkt des Raums. EIN statisches Fuell-Licht
  // im Zentrum der 20x12-Arena (Weltmitte 320/2 = 160, 192/2 = 96) hebt den
  // Boden dort an.
  // flicker BEWUSST 0.5, also UNTER der 0.8-Schwelle: main.js/lighting.js
  // behandeln nur >= 0.8 als Fackel — dieses Licht erzeugt deshalb KEINEN
  // Warm-Glow, KEIN Lit-Dither, KEINE Funken und KEINE Wasser-Reflexion, es
  // stanzt nur weicher in das Dunkel-Overlay. Radius 88 (zwischen Fackel 72 und
  // halber Arena-Diagonale) laesst die Ecken bewusst dunkel.
  // main.js haengt mapDef.extraLights rein additiv an frameLights an (§5.D4);
  // fehlt das Feld, passiert nichts. geoHash-frei: der §36-Fingerprint hasht
  // playerSpawn/Spawns/Portale/torchChars-findTiles, NICHT extraLights.
  extraLights: [
    { x: 160, y: 96, radius: 88, flicker: 0.5 },
  ],
};
