// Selbstcheck Slice-3-Art gegen die ECHTEN Module. Wegwerf (.tmp).
// node .tmp/art_slice3_selfcheck.mjs
import { PALETTE } from '../game/js/art/palette.js';
import { SPRITES, TILE_ART } from '../game/js/art/sprites.js';

let fail = 0;
const bad = (m) => { console.log('  FEHLER: ' + m); fail++; };

// 1) Jeder Sprite: Zeilen gleich breit, jedes Zeichen in PALETTE oder '.'.
const checkGrid = (label, grid) => {
  const w = grid[0].length;
  grid.forEach((row, i) => {
    if (row.length !== w) bad(`${label}: Zeile ${i} Breite ${row.length} != ${w}`);
    for (const c of row) {
      if (c !== '.' && !(c in PALETTE)) bad(`${label}: Zeichen '${c}' nicht in PALETTE (Zeile ${i})`);
    }
  });
};
for (const [name, grid] of Object.entries(SPRITES)) checkGrid('SPRITE ' + name, grid);
for (const [name, grid] of Object.entries(TILE_ART)) checkGrid('TILE ' + name, grid);

// 2) Neue Pflicht-Keys vorhanden + korrekte Masse.
const REQUIRED = {
  warden_idle: [24, 32], warden_walk_0: [24, 32], warden_walk_1: [24, 32],
  warden_windup_a: [24, 32], warden_windup_b: [24, 32], warden_dash: [24, 32],
  warden_stuck: [24, 32], warden_summon: [24, 32], warden_die: [24, 32],
  elite_glow: [8, 8], levelup_0: [16, 16], levelup_1: [16, 16], icon_key: [8, 8],
};
for (const [name, [w, h]] of Object.entries(REQUIRED)) {
  const g = SPRITES[name];
  if (!g) { bad(`Pflicht-Sprite fehlt: ${name}`); continue; }
  if (g[0].length !== w || g.length !== h) bad(`${name}: ${g[0].length}x${g.length}, erwartet ${w}x${h}`);
}

// 3) Neue Palettenzeichen vorhanden, kein Altzeichen entfernt/veraendert.
const NEW_PAL = { 7: '#2f7d5c', 8: '#7ff0b8' };
for (const [k, v] of Object.entries(NEW_PAL)) {
  if (PALETTE[k] !== v) bad(`Palette '${k}' = ${PALETTE[k]}, erwartet ${v}`);
}
const OLD_PAL = 'kngsSFeEamAzpvPVOBbNrRoyY1cCiIuUXZh2wWtTLDdGH3qjQJxf456'.split('');
for (const k of OLD_PAL) if (!(k in PALETTE)) bad(`Alt-Palettenzeichen entfernt: '${k}'`);

// 4) Alle ALTEN Sprite-/Tile-Keys weiter vorhanden (Regressionsschutz).
const OLD_SPRITES = [
  'player_down_0','player_down_1','player_down_2','player_down_3',
  'player_up_0','player_up_1','player_up_2','player_up_3',
  'player_side_0','player_side_1','player_side_2','player_side_3',
  'player_attack_down','player_attack_up','player_attack_side',
  'player_die_0','player_die_1','skeleton_0','skeleton_1','skeleton_die',
  'ghoul_0','ghoul_1','ghoul_die','sword_slash_down','sword_slash_up',
  'sword_slash_side','coin_0','coin_1','vase','urn','prop_break_0','prop_break_1',
  'chest_closed','chest_open','potion','fog_blob','heart_full','heart_empty',
  'hound_0','hound_1','hound_telegraph','hound_leap','hound_down','hound_die',
  'rust_0','rust_1','rust_die','shield_side','shield_up','shield_down','block_spark',
  'boomerang_0','boomerang_1','item_weapon','item_armor','item_ring',
  'sparkle_0','sparkle_1','icon_weapon','icon_armor','icon_ring','icon_boomerang',
];
for (const k of OLD_SPRITES) if (!(k in SPRITES)) bad(`Alt-Sprite entfernt: '${k}'`);
const OLD_TILES = [
  'grass_dark','grass_detail','path','tree','gravestone','wall','water',
  'gravestone_2','gravestone_3','bush_dead','bones','skull','fence',
  'crypt_stairs_down','stairs_up','stone_floor','stone_floor_cracked','brick_wall',
  'pillar','rubble','sarcophagus','torch_0','torch_1','torch_wall_0','torch_wall_1',
  'fringe_n','fringe_s','fringe_w','fringe_e','fringe_ne','fringe_nw','fringe_se','fringe_sw',
  'moss_fringe_n','moss_fringe_s','moss_fringe_w','moss_fringe_e',
  'tree_trunk','tree_canopy','tree_canopy_top','tree_canopy_bottom',
];
for (const k of OLD_TILES) if (!(k in TILE_ART)) bad(`Alt-Tile entfernt: '${k}'`);

// 5) Die von den neuen Maps referenzierten Tile-Keys existieren (Gruft-Tiles).
const MAP_TILES = ['brick_wall','stone_floor','stone_floor_cracked','water','pillar',
  'rubble','sarcophagus','torch_wall_0','torch_wall_1','stairs_up','crypt_stairs_down'];
for (const k of MAP_TILES) if (!(k in TILE_ART)) bad(`Von Slice-3-Map referenziertes Tile fehlt: '${k}'`);

console.log(`\nSPRITES: ${Object.keys(SPRITES).length} Keys, TILE_ART: ${Object.keys(TILE_ART).length} Keys, PALETTE: ${Object.keys(PALETTE).length} Zeichen.`);
console.log(fail ? `\n${fail} FEHLER.` : '\nSELBSTCHECK GRUEN: Breiten konsistent, alle Zeichen in PALETTE, alle Alt- und neuen Pflicht-Keys vorhanden.');
process.exit(fail ? 1 : 0);
