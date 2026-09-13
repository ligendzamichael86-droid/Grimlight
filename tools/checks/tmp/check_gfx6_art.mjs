// GP6 Art-/Verdrahtungs-Selbstcheck (Wegwerf, .tmp). node .tmp/check_gfx6_art.mjs
// =============================================================================
// ERSETZT .tmp/check_gfx5_art.mjs (SPEC_GRAFIKPASS_6.md §7.G; Muster
// SPEC_GRAFIKPASS_5.md:52) und PORTIERT dessen Waechter VOLLSTAENDIG:
//   Palette 61 alnum + 17 Symbole (GP7CH: 3 + 14, siehe [9]), Grid-Masse,
//   Ghul-Rim, '='-Zaehlung im Teich,
//   Back-Kronen-Rampe + Stahlblau-Sperre, PRIO2-Basis-Grids, i/x-Verdrahtung,
//   Gras-Pool-Gates (47 Kacheln), n-UNGERADE-Waechter, §3-Interface-Waechter,
//   GP5-R3-Gates (water_mid, Depth-Varianten, shore_diag, Ufer-Zaehne,
//   Ziegel-Luminanz, Kontaktschatten, Zaun, Kratzer, Flammenbreite).
//
// GEAENDERT / NEU in dieser Fassung (§7.G):
//   [1] NEW_TONES = die ZEHN Offset-Toene aus .tmp/gp6_offset_tabelle.json
//       (§3.1 Gras- UND Wasser-Rampe), plus die zwei unveraenderten
//       Symbol-Toene '+'/'*'. Palettenumfang: 61 alnum (§0.11: KEINE neuen
//       alnum-Schluessel) + 17 Symbole (GP7CH: 3 alt + 14 neu, siehe [9]).
//   [2] MASSTABELLE {16x16, 32x32, 48x32, 64x48, 64x32} ueber KEY-MUSTER
//       (§5.1/§5.3, identisch zur smoke-Tabelle GP6-§7G).
//   [3] FLAMMEN-GATE DOCHT-KERN (§6.6): Bodenfackeln fuehren '1' AUSSCHLIESSLICH
//       in den Grid-Zeilen 5..7, Wandfackeln in 3..5; Silhouette <= 5 px breit
//       (Bestandsgate portiert); Flammenflaeche der drei Frames einer Familie
//       innerhalb +-20 %.
//   [4] KRATZER-GATE (§6.2): 'T'/'m'-frei, Dither-Toene kalt (R-B <= -6), und
//       zusaetzlich der Spec-Abstand Delta(R-B) Kratzer-gegen-Boden <= +8.
//   [5] KRONEN-BBOX-GATE (M4): >= 3 Kronen-Keys mit Tinten-Bbox >= 40x28,
//       >= 1 mit >= 56x40.
//   [6] SPECULAR-CLUSTER-GATE (§6.4a) NUR ueber water_shallow/_v1/_v2 —
//       NICHT ueber water_shallow_vert*, die tragen ihren EIGENEN Kammglanz.
//       Das alte '='-Bestands-Gate (>= 20 ueber water/water_1/_2/_3) BLEIBT
//       daneben aktiv und laeuft GETRENNT (Review P1-M6).
//   [7] mix75-DICHTEWAECHTER ERSETZT (Begruendung unten am Block) durch das
//       Wiesenlicht-Mittel-Gate aus §3.1.
//   [8] u/j-Pools jetzt n = 5 (§6.5) — vom generischen Ungerade-n-Waechter
//       ueber ALLE vier Legenden mitgetragen.
//
// GP7CH (SPEC_GP7CH1.md Rev 2 §E8, Sanktions-Katalog — genau zwei Eingriffe
// in DIESE Datei, sonst nichts):
//   [9]  E8(1) Symbol-Deckel 3 -> 17: die 14 neuen Zeichen der GP7-CH-1-
//        Paletten-Erweiterung (! % & ( ) : ; ? @ [ ] ^ _ |, Quelle
//        .tmp/gp7ch_p0/toene.json). alnum bleibt UNVERAENDERT 61.
//   [10] E8(3) ADDITIVE Massprobe (Review M18): alle SPRITES-Keys
//        /^(player|npc)_/ ausser npc_blase sind exakt 16 breit / 24 hoch.
//        Reine Ergaenzung am Dateiende, kein Bestands-Gate wird veraendert.
// =============================================================================
import { PALETTE } from '../game/js/art/palette.js';
import { SPRITES, TILE_ART } from '../game/js/art/sprites.js';
import { MAPS, GRAVEYARD } from '../game/js/world/maps.js';

let fail = 0;
const bad = (m) => { console.log('  FEHLER: ' + m); fail++; };

// Rec.601-Luminanz und Warm-Kalt-Achse (R-B) — dieselbe Metrik wie
// .tmp/gp6_offset_tabelle.json und shot_gfx6.
const rgbOf = (hex) => {
  const v = parseInt(String(hex).slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
};
const lumOf = (hex) => { const [r, g, b] = rgbOf(hex); return 0.299 * r + 0.587 * g + 0.114 * b; };
const rbOf = (hex) => { const [r, , b] = rgbOf(hex); return r - b; };

// ---------------------------------------------------------------------------
// PORTIERT 1) 'l' verboten als Palette-Key; genau 3 Symbol-Toene, 61 alnum.
// [1] NEW_TONES: die ZEHN Offset-Toene aus der P0b-Tabelle (§3.1, bindend fuer
//     Art UND diesen Check, Review P3-m1). Gras-Rampe e/E/a/m/K/A, Wasser-Rampe
//     w/W/9/'='. Der Offset ist ADDITIV je Kanal (+15 fuer Gras, je Wasserton
//     ein eigener ganzzahliger Kanal-Offset) — der Farbort bleibt exakt.
// ---------------------------------------------------------------------------
if ('l' in PALETTE) bad("'l' in PALETTE verboten");
const NEW_TONES = {
  // Gras-Rampe (§3.1, dL = +15,1 -> +15 real)
  e: '#28332c', E: '#344431', a: '#485c3f', m: '#5f7250', K: '#677b47', A: '#758f59',
  // Wasser-Rampe VOLLSTAENDIG (§3.1, gleichmaessige Schritte ~20,3 L)
  w: '#263335', W: '#36494c', 9: '#465f63', '=': '#56757a',
};
// Die zwei Symbol-Toene, die der Offset NICHT anfasst (Back-Kronen-Rampe).
const ALT_SYMBOLE = { '+': '#1a2a1b', '*': '#141f15' };
for (const [k, v] of Object.entries(NEW_TONES)) {
  if (PALETTE[k] !== v) bad(`Offset-Ton '${k}' = ${PALETTE[k]}, erwartet ${v} (P0b-Tabelle)`);
}
for (const [k, v] of Object.entries(ALT_SYMBOLE)) {
  if (PALETTE[k] !== v) bad(`Symbol-Ton '${k}' = ${PALETTE[k]}, erwartet ${v} (unveraendert)`);
}
{
  const alnum = Object.keys(PALETTE).filter((k) => /^[A-Za-z0-9]$/.test(k));
  const sym = Object.keys(PALETTE).filter((k) => !/^[A-Za-z0-9]$/.test(k));
  if (alnum.length !== 61) bad(`alnum-Toene = ${alnum.length}, erwartet 61 (§0.11: keine neuen Schluessel)`);
  // GP7CH [9] (E8(1)): Symbol-Deckel 3 -> 17. Die 14 neuen Zeichen sind die
  // GP7-CH-1-Erweiterung aus .tmp/gp7ch_p0/toene.json (Spec Rev 2 §E3, feste
  // Zuteilung G-Rampe 2 / Corm 3 / Bran 3 / Mile 3 / Held 1 / Rim 2).
  // alnum bleibt 61 — es kommt KEIN alnum-Schluessel dazu.
  // GP7CH2 §5(2) (R-A8/R-A9): Symbol-Deckel 17 -> 25. Die 8 zusaetzlichen
  // Zeichen sind die GP7-CH-2-Gegner-Toene aus .tmp/gp7ch2_p0/toene_ch2.json
  // (Zuteilung Skelett-Knochen 3 / Ghul-Lumpen 2 / Hund-Petrol 3), Reihenfolge
  // wie in game/js/art/palette.js. alnum bleibt 61, Palette 86.
  const SYM_GP7CH = ['!', '%', '&', '(', ')', ':', ';', '?', '@', '[', ']', '^', '_', '|'];
  const SYM_GP7CH2 = ['"', '$', '/', '<', '>', '{', '}', '`'];
  const SYM_SOLL = ['=', '+', '*', ...SYM_GP7CH, ...SYM_GP7CH2];
  if (sym.length !== SYM_SOLL.length || !SYM_SOLL.every((k) => sym.includes(k))) {
    bad(`Symbol-Toene falsch: '${sym.join('')}', erwartet '${SYM_SOLL.join('')}' (3 Bestand + 14 GP7CH + 8 GP7CH2)`);
  }
  for (const [k, hex] of Object.entries(PALETTE)) if (!/^#[0-9a-f]{6}$/i.test(hex)) bad(`Farbe ${k}=${hex} ungueltig`);
}
// §3.1 ORDNUNGS-AUFLAGE k < w = e < W < 9 < '=' < A < D (8-Bit-Toleranz 1 L
// beim Gleichstand w = e). Die Auflage steht in der Spec, nicht nur in P0b.
{
  const L = (k) => lumOf(PALETTE[k]);
  if (!(L('k') < L('w'))) bad(`Ordnung verletzt: k ${L('k').toFixed(1)} !< w ${L('w').toFixed(1)}`);
  if (Math.abs(L('w') - L('e')) >= 1) bad(`Ordnung verletzt: w = e gefordert, Delta ${Math.abs(L('w') - L('e')).toFixed(2)} L`);
  for (const [lo, hi] of [['e', 'W'], ['W', '9'], ['9', '='], ['=', 'A'], ['A', 'D']]) {
    if (!(L(lo) < L(hi))) bad(`Ordnung verletzt: ${lo} ${L(lo).toFixed(1)} !< ${hi} ${L(hi).toFixed(1)}`);
  }
  // 'w' behaelt den kuehleren Farbort (B > G).
  const [, wg, wb] = rgbOf(PALETTE.w);
  if (!(wb > wg)) bad(`'w' ist nicht mehr kuehler als gruen (G ${wg} >= B ${wb})`);
  // Gras-Rampe streng monoton.
  const gras = ['e', 'E', 'a', 'm', 'K', 'A'];
  for (let i = 1; i < gras.length; i++) {
    if (!(L(gras[i - 1]) < L(gras[i]))) bad(`Gras-Rampe nicht monoton bei ${gras[i - 1]}->${gras[i]}`);
  }
}

// ---------------------------------------------------------------------------
// PORTIERT 2) Alle Grids: Zeilen gleich breit, jedes Zeichen '.' oder in PALETTE.
// ---------------------------------------------------------------------------
const checkGrid = (label, grid) => {
  const w = grid[0].length;
  grid.forEach((row, i) => {
    if (row.length !== w) bad(`${label}: Zeile ${i} Breite ${row.length} != ${w}`);
    for (const c of row) if (c !== '.' && !(c in PALETTE)) bad(`${label}: Zeichen '${c}' nicht in PALETTE (Zeile ${i})`);
  });
};
for (const [n, g] of Object.entries(SPRITES)) checkGrid('S:' + n, g);
for (const [n, g] of Object.entries(TILE_ART)) checkGrid('T:' + n, g);

// ---------------------------------------------------------------------------
// [2] §7.G MASSTABELLE {16x16, 32x32, 48x32, 64x48, 64x32} ueber KEY-MUSTER.
// Identisch zur smoke-Tabelle (GP6-§7G). Der Schatten-Bake ist bewusst NICHT
// so hoch wie seine Krone: §5.3 legt 32 px fest (er liegt flach auf dem Boden),
// nur die BREITE folgt sw. Genau das trennt 64x32 von 64x48.
// GP6 RUNDE 2 (P0-B): die Bake-Muster tragen jetzt das optionale MATERIAL-
// Suffix (_g Gras/Erdflecken, _d Weg) — reine Ton-Substitutionen desselben
// Grids, also DIESELBE Masse. Das Gate wird nicht schwaecher, es gilt fuer
// sechs Keys mehr (ohne die Ergaenzung fielen sie in den 16x16-Default).
// ---------------------------------------------------------------------------
// S6-§7B(8) SANKTION (SPEC Slice 6 §7.B(8), Wortlaut fix aus SLICE6_PHASE0
// §5 E8): dieselben sechs DORF-Musterzeilen wie in tools/smoke_test.mjs — die
// beiden Tabellen bleiben identisch. Ohne sie fielen die 15 Grossgrids des
// Dorfs in den 16x16-Default. Keine neue Masse-Klasse, kein Bestands-Key
// umgeleitet; dorf_glocke_kopf/_fuss bleiben als 16x16 im Default.
const MASSTABELLE = [
  [/^tree_canopy_xl_b(_m)?(_[rl][12])?$/, 64, 48],
  [/^canopy_shadow_xl_b(_[gd])?$/, 64, 32],
  [/^tree_canopy_xl_[ac](_m)?(_[rl][12])?$/, 48, 32],
  [/^canopy_shadow_xl_[ac](_[gd])?$/, 48, 32],
  [/^tree_canopy_2x2_[abc]m?$/, 32, 32],
  [/^tree_canopy_back_[abc]$/, 32, 32],
  [/^dorf_dach_(a|b)(_m)?$/, 64, 48],
  [/^dorf_dach_(c|d|tor)(_m)?$/, 48, 32],
  [/^dorf_bake_gross$/, 64, 32],
  [/^dorf_bake_klein$/, 48, 32],
  [/^dorf_segel(_[rl][12])?$/, 48, 32],
  [/^dorf_glocke$/, 48, 32],
];
const massOf = (name) => {
  for (const [re, w, h] of MASSTABELLE) if (re.test(name)) return [w, h];
  return [16, 16];
};
const BACK = ['tree_canopy_back_a', 'tree_canopy_back_b', 'tree_canopy_back_c'];
const GFX4_16 = [
  'shore_ine', 'shore_inw', 'shore_ise', 'shore_isw',
  'licht_dither_1', 'licht_dither_2', 'floor_decal_crack', 'floor_decal_bones',
  'grass_lumahi', 'grass_lumalo', 'grass_tuft_r1', 'grass_blade_r1', 'grass_speck_r1',
  'grass_tuft_f1', 'grass_blade_f1', 'gravestone_4', 'gravestone_5',
  'path_v4', 'path_v5', 'torch_2', 'torch_wall_2',
];
for (const k of GFX4_16) {
  const g = TILE_ART[k];
  if (!g) { bad(`Pflicht-Tile fehlt: ${k}`); continue; }
  if (g.length !== 16 || g[0].length !== 16) bad(`${k}: ${g[0].length}x${g.length}, erwartet 16x16`);
}
for (const k of BACK) {
  const g = TILE_ART[k];
  if (!g) { bad(`Pflicht-Back-Krone fehlt: ${k}`); continue; }
  if (g.length !== 32 || g[0].length !== 32) bad(`${k}: ${g[0].length}x${g.length}, erwartet 32x32`);
}
for (const [n, g] of Object.entries(TILE_ART)) {
  const [wantW, wantH] = massOf(n);
  if (g.length !== wantH || g[0].length !== wantW) bad(`Masse ${n}: ${g[0].length}x${g.length}, erwartet ${wantW}x${wantH}`);
}
{
  const klassen = new Set(Object.keys(TILE_ART).map((n) => massOf(n).join('x')));
  for (const k of ['16x16', '32x32', '48x32', '64x48', '64x32']) {
    if (!klassen.has(k)) bad(`§7.G Masstabelle: Klasse ${k} ist LEER (Muster trifft nichts)`);
  }
}

// ---------------------------------------------------------------------------
// PORTIERT 5) Ghul-Masse 16x20; kuehler Rim 'C' vorhanden.
// ---------------------------------------------------------------------------
for (const k of ['ghoul_0', 'ghoul_1', 'ghoul_die']) {
  const g = SPRITES[k];
  if (!g) { bad(`${k} fehlt`); continue; }
  if (g.length !== 20 || g[0].length !== 16) bad(`${k}: muss 16x20 sein`);
}
if (SPRITES.ghoul_0 && !SPRITES.ghoul_0.some((r) => r.includes('C'))) bad('ghoul_0: kuehler Rim C fehlt');

// ---------------------------------------------------------------------------
// PORTIERT 6) water 4-Frame vorhanden; '='-Glanz im Teich >= 20.
// BLEIBT UNVERAENDERT AKTIV (Review P1-M6): dieses Bestands-Gate zaehlt die
// '='-Tupfer der vier ANIMIERTEN Teich-Frames. Das NEUE Specular-Gate [6]
// laeuft GETRENNT auf water_shallow* — die beiden duerfen nicht vermengt
// werden, sonst deckt der eine Zaehler den Ausfall des anderen zu.
// ---------------------------------------------------------------------------
{
  let eqCount = 0;
  for (const k of ['water', 'water_1', 'water_2', 'water_3']) {
    if (!TILE_ART[k]) bad(`${k} fehlt`);
    else for (const r of TILE_ART[k]) for (const c of r) if (c === '=') eqCount++;
  }
  if (eqCount < 20) bad(`Teich-Glanz '=' Gesamtzahl ${eqCount} < 20 (Bestands-Gate)`);
}

// ---------------------------------------------------------------------------
// PORTIERT 7) Back-Kronen nutzen die '+'/'*'-Rampe; STAHLBLAU-SPERRE ('C').
// §3.1b Variante C hat die Rim-Zeile auf '*' gesetzt und 'e' eine Zeile nach
// innen gezogen — die Rampe muss danach immer noch beide Toene fuehren.
// ---------------------------------------------------------------------------
for (const k of BACK) {
  const g = TILE_ART[k];
  if (!g) continue;
  const flat = g.join('');
  if (!flat.includes('+') || !flat.includes('*')) bad(`${k}: Rampe +/* unvollstaendig`);
  if (flat.includes('C')) bad(`${k}: Stahlblau-Regression — Palettenton 'C' wieder in der Back-Krone`);
}

// ---------------------------------------------------------------------------
// PORTIERT 8) PRIO2-Basis-Grids + i/x-Verdrahtung.
// (Das Innenfeld-Gebot "obere Kante rein 'e'" ist seit GP5 entfallen.)
// ---------------------------------------------------------------------------
const density = (grid, chars) => grid.join('').split('').filter((c) => chars.includes(c)).length;
const PRIO2_BASE = ['grass_dark_v4', 'grass_dark_v5', 'grass_dark_v6', 'grass_dark_earth'];
for (const k of PRIO2_BASE) {
  const g = TILE_ART[k];
  if (!g) { bad(`PRIO2 Basis-Grid fehlt: ${k}`); continue; }
  if (g.length !== 16 || g[0].length !== 16) bad(`${k}: nicht 16x16`);
}
{
  const nz = TILE_ART.grass_dark_v6.join('').split('').filter((c) => c !== 'e').length;
  if (nz >= 6) bad(`grass_dark_v6 nicht "fast leer": ${nz} Nicht-e-Pixel (>=6)`);
}
for (const k of ['grass_dark_v4', 'grass_dark_v5']) {
  if (density(TILE_ART[k], 'aKA') < 2) bad(`${k}: < 2 Halm-Pixel (a/K/A)`);
}
if (TILE_ART.grass_dark_v4.join('') === TILE_ART.grass_dark_v5.join('')) bad('v4 und v5 identisch (kein Phasenversatz)');
{
  const g = TILE_ART.grass_dark_earth;
  let has2x2 = false;
  const isE = (x, y) => y >= 0 && y < 16 && x >= 0 && x < 16 && 'pzv'.includes(g[y][x]);
  for (let y = 0; y < 15 && !has2x2; y++) for (let x = 0; x < 15; x++) {
    if (isE(x, y) && isE(x + 1, y) && isE(x, y + 1) && isE(x + 1, y + 1)) { has2x2 = true; break; }
  }
  if (!has2x2) bad('grass_dark_earth: kein 2x2-Erdbraun-Fleck (p/z/v)');
  if (density(g, 'E') < 4) bad('grass_dark_earth: Diagonal-Hatch (E) zu duenn');
}
if (GRAVEYARD.legend['i']?.art !== 'grass_lumahi_mix75') bad("'i'-Legende != grass_lumahi_mix75");
if (GRAVEYARD.legend['x']?.art !== 'grass_lumalo_mix75') bad("'x'-Legende != grass_lumalo_mix75");
{
  const flat = GRAVEYARD.rows.join('');
  if (!flat.includes('i')) bad("kein 'i' (75%-hi-Ring) in GRAVEYARD_ROWS");
  if (!flat.includes('x')) bad("kein 'x' (75%-lo-Ring) in GRAVEYARD_ROWS");
}

// ===========================================================================
// A) §2.A1 GRAS-POOL-GATES (portiert, unveraendert)
// ===========================================================================
const POOL = [];
for (let i = 0; i < 47; i++) POOL.push(`grass_g5_${String(i).padStart(2, '0')}`);
const BASE_TONE = 'e';
const SEAM_TONE = 'E';
const GLYPH_TONES = 'KAamzp';

{
  const missing = POOL.filter((k) => !TILE_ART[k]);
  if (missing.length) bad(`Gras-Pool unvollstaendig: ${missing.join(',')}`);
  const present = POOL.filter((k) => TILE_ART[k]);
  const prefixCount = Object.keys(TILE_ART).filter((k) => k.startsWith('grass_g5_')).length;
  if (prefixCount < 47) bad(`grass_g5_*-Praefix zaehlt ${prefixCount}, erwartet >= 47`);

  const seen = new Map();
  for (const k of present) {
    const flat = TILE_ART[k].join('|');
    if (seen.has(flat)) bad(`Gras-Pool: ${k} ist identisch zu ${seen.get(flat)}`);
    seen.set(flat, k);
  }

  const allowed = BASE_TONE + SEAM_TONE + GLYPH_TONES;
  for (const k of present) {
    for (const row of TILE_ART[k]) {
      for (const c of row) if (!allowed.includes(c)) bad(`${k}: Ton '${c}' ausserhalb des Gras-Vorrats (${allowed})`);
    }
  }

  for (const k of present) {
    const g = TILE_ART[k];
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        if (y !== 0 && y !== 15 && x !== 0 && x !== 15) continue;
        if (GLYPH_TONES.includes(g[y][x])) bad(`${k}: Glyph-Ton '${g[y][x]}' auf der Kante (${x},${y}) — Randregel verletzt`);
      }
    }
    const edges = [g[0], g[15], g.map((r) => r[0]).join(''), g.map((r) => r[15]).join('')];
    edges.forEach((e, j) => {
      if (![...e].some((c) => c !== BASE_TONE)) bad(`${k}: Kante ${j} traegt keinen Rausch-Saum (leerer Rahmen)`);
    });
  }

  const covOf = (g) => g.join('').split('').filter((c) => c !== BASE_TONE).length / 256;
  const glyphCount = (g) => {
    const seenPx = Array.from({ length: 16 }, () => new Array(16).fill(false));
    let comp = 0;
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      if (!GLYPH_TONES.includes(g[y][x]) || seenPx[y][x]) continue;
      comp += 1;
      const st = [[x, y]];
      seenPx[y][x] = true;
      while (st.length) {
        const [cx, cy] = st.pop();
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const nx = cx + dx, ny = cy + dy;
          if (nx < 0 || ny < 0 || nx > 15 || ny > 15 || seenPx[ny][nx] || !GLYPH_TONES.includes(g[ny][nx])) continue;
          seenPx[ny][nx] = true;
          st.push([nx, ny]);
        }
      }
    }
    return comp;
  };
  let sumCov = 0;
  const klass = { sparse: 0, mittel: 0, dicht: 0 };
  for (const k of present) {
    const g = TILE_ART[k];
    const cov = covOf(g);
    const gl = glyphCount(g);
    sumCov += cov;
    if (cov > 0.18 + 1e-9) bad(`${k}: Deckung ${(cov * 100).toFixed(2)} % > 18 % (Obergrenze §2.A1)`);
    if (gl > 8) bad(`${k}: ${gl} Glyphen > 8 (Obergrenze §2.A1)`);
    if (gl <= 2) klass.sparse += 1;
    else if (gl <= 5) klass.mittel += 1;
    else klass.dicht += 1;
  }
  const mean = sumCov / Math.max(1, present.length);
  if (mean < 0.08 || mean > 0.14) bad(`Gras-Pool: Kachel-Mittel ${(mean * 100).toFixed(2)} % ausserhalb 8-14 %`);
  for (const [name, n, want] of [['SPARSE', klass.sparse, 16], ['MITTEL', klass.mittel, 16], ['DICHT', klass.dicht, 15]]) {
    if (n === 0) bad(`Gras-Pool: Dichteklasse ${name} ist leer`);
    else if (Math.abs(n - want) > 4) bad(`Gras-Pool: Dichteklasse ${name} = ${n}, erwartet ~${want} (+-4)`);
  }
  console.log(`  INFO Gras-Pool: Deckung Mittel ${(mean * 100).toFixed(2)} %, `
    + `Klassen SPARSE ${klass.sparse} / MITTEL ${klass.mittel} / DICHT ${klass.dicht}`);
}

// ===========================================================================
// [7] WIESENLICHT-MITTEL-GATE — ERSETZT den mix75-DICHTEWAECHTER.
//
// WARUM DER ALTE WAECHTER FALLEN MUSS (Phase-1-Art-Beleg, arithmetisch):
// Der GP4/GP5-Waechter zaehlte PATCH-TON-TEXEL ("Luma-Dichte 160..224 von 256,
// und mix75 muss dichter sein als mix50"). Er setzte damit voraus, dass die
// Wiesenlicht-Kacheln ihre Helligkeit ueber die ANZAHL eingestreuter
// Patch-Texel eines FREMDEN Tons ('a' bzw. 'E') herstellen. §3.1 stellt genau
// das um: die Helligkeit kommt jetzt aus dem PALETTEN-OFFSET der ganzen
// Gras-Rampe, die Kacheln liegen als geschlossene Flaechen um das neue
// Pool-Mittel (~50 L) herum. Ein 75-%-Patch-Ton-Anteil waere nach dem Offset
// keine Aufhellung mehr, sondern ein sichtbarer Fremdfleck — der alte Zaehler
// und §3.1 sind arithmetisch unvereinbar (gemessen: 20 bzw. 1 statt 160-224).
//
// DER NEUE WAECHTER misst GENAU DAS, was §3.1 fordert
// ("Wiesenlicht-Klassen (6 Grids) auf +-2..4 L um das neue Pool-Mittel ~50"):
//   (a) |Kachelmittel - Poolmittel| liegt je Klasse in [2, 4] L, und
//   (b) die 75-%-Stufe liegt WEITER vom Pool-Mittel entfernt als die 50-%-Stufe
//       (die Rampe zeigt also noch in die richtige Richtung — das ist die
//       Ordnungs-Aussage, die der alte "d75 > d50"-Vergleich transportiert hat,
//       nur auf der Groesse gemessen, die jetzt die Helligkeit traegt).
// Kachelmittel = Rec.601-Mittel ueber die NICHT-transparenten Texel.
// ===========================================================================
{
  const kachelMittel = (g) => {
    let s = 0, n = 0;
    for (const row of g) for (const c of row) { if (c === '.') continue; s += lumOf(PALETTE[c]); n++; }
    return n ? s / n : 0;
  };
  const poolKeys = POOL.filter((k) => TILE_ART[k]);
  const poolMittel = poolKeys.reduce((a, k) => a + kachelMittel(TILE_ART[k]), 0) / Math.max(1, poolKeys.length);
  const WIESE = ['grass_lumahi', 'grass_lumalo', 'grass_lumahi_mix', 'grass_lumalo_mix',
    'grass_lumahi_mix75', 'grass_lumalo_mix75'];
  const abw = {};
  for (const k of WIESE) {
    const g = TILE_ART[k];
    if (!g) { bad(`Wiesenlicht-Grid fehlt: ${k}`); continue; }
    if (g.length !== 16 || g[0].length !== 16) bad(`${k}: nicht 16x16`);
    abw[k] = Math.abs(kachelMittel(g) - poolMittel);
    if (abw[k] < 2 || abw[k] > 4) {
      bad(`${k}: |Kachelmittel - Poolmittel| = ${abw[k].toFixed(2)} L ausserhalb [2,4] (§3.1)`);
    }
  }
  for (const [mix50, mix75] of [['grass_lumahi_mix', 'grass_lumahi_mix75'], ['grass_lumalo_mix', 'grass_lumalo_mix75']]) {
    if (abw[mix50] === undefined || abw[mix75] === undefined) continue;
    if (!(abw[mix75] > abw[mix50])) {
      bad(`${mix75}: Abweichung ${abw[mix75].toFixed(2)} L nicht > ${mix50} ${abw[mix50].toFixed(2)} L (Rampe verkehrt)`);
    }
  }
  console.log(`  INFO Wiesenlicht: Pool-Mittel ${poolMittel.toFixed(2)} L | `
    + WIESE.map((k) => `${k.replace('grass_lum', '')} ${abw[k] !== undefined ? abw[k].toFixed(2) : '?'}`).join(' / '));
}

// ===========================================================================
// B) VERDRAHTUNGS-GATES + [8] n-UNGERADE-WAECHTER (portiert)
// ===========================================================================
{
  const dot = GRAVEYARD.legend['.'];
  if (!dot.variants) bad("'.'-Legende hat keine variants");
  else {
    if (dot.art !== 'grass_g5_00') bad(`'.'-art = ${dot.art}, erwartet grass_g5_00`);
    if (dot.variants[0] !== dot.art) bad("'.'-variants[0] !== art");
    if (dot.variants.length !== 47) bad(`'.'-variants n = ${dot.variants.length}, erwartet 47`);
    if (new Set(dot.variants).size !== dot.variants.length) bad("'.'-variants enthaelt Dubletten");
    for (const k of POOL) if (!dot.variants.includes(k)) bad(`'.'-variants fehlt Pool-Kachel ${k}`);
  }
  for (const ch of [',', 'e']) {
    const cell = GRAVEYARD.legend[ch];
    if (!cell.variants) { bad(`'${ch}'-Legende hat keinen Teil-Pool`); continue; }
    if (cell.variants.length % 2 === 0) bad(`'${ch}'-Teil-Pool n = ${cell.variants.length} ist GERADE`);
    if (cell.variants.length % 5 === 0) bad(`'${ch}'-Teil-Pool n = ${cell.variants.length} hat Faktor 5 (Kollision mit dem Jitter-Hash)`);
    if (!cell.variants.some((k) => POOL.includes(k))) bad(`'${ch}'-Teil-Pool enthaelt keine einzige Pool-Kachel`);
    if (cell.variants[0] !== cell.art) bad(`'${ch}'-variants[0] !== art`);
  }
  // [8] UNGERADE-n ueber ALLE vier Legenden. §6.5 hat 'u'/'j' von n=3 auf n=5
  // gehoben (zwei neue Groessenstufen) — der generische Waechter traegt das
  // ohne Sonderfall, prueft es aber unten zusaetzlich namentlich nach.
  for (const [name, def] of Object.entries(MAPS)) {
    for (const [ch, cell] of Object.entries(def.legend)) {
      if (!cell.variants) continue;
      if (cell.variants.length % 2 === 0) bad(`${name} '${ch}': variants-n = ${cell.variants.length} ist GERADE (§0.6)`);
      if (cell.variants[0] !== cell.art) bad(`${name} '${ch}': variants[0] !== art`);
      for (const k of cell.variants) if (!TILE_ART[k]) bad(`${name} '${ch}': variants-Key ${k} fehlt in TILE_ART`);
    }
    for (const cell of Object.values(def.legend)) {
      if (!TILE_ART[cell.art]) bad(`${name}: art-Key ${cell.art} fehlt in TILE_ART`);
      for (const a of cell.anim || []) if (!TILE_ART[a]) bad(`${name}: anim-Key ${a} fehlt in TILE_ART`);
      for (const p of cell.swayPoses || []) if (!TILE_ART[p]) bad(`${name}: swayPoses-Key ${p} fehlt in TILE_ART`);
      if (cell.shadowArt && !TILE_ART[cell.shadowArt]) bad(`${name}: shadowArt-Key ${cell.shadowArt} fehlt in TILE_ART`);
    }
  }
  // §6.5 namentlich: 'u'/'j' fuehren jetzt FUENF Grids (zwei neue Groessenstufen).
  for (const ch of ['u', 'j']) {
    const cell = GRAVEYARD.legend[ch];
    if (!cell || !cell.variants) { bad(`'${ch}'-Legende ohne variants (§6.5 verlangt n = 5)`); continue; }
    if (cell.variants.length !== 5) bad(`'${ch}': n = ${cell.variants.length}, §6.5 verlangt 5`);
    if (new Set(cell.variants).size !== cell.variants.length) bad(`'${ch}': Dubletten im 5er-Pool`);
    const grids = cell.variants.filter((k) => TILE_ART[k]).map((k) => TILE_ART[k].join('|'));
    if (new Set(grids).size !== grids.length) bad(`'${ch}': zwei Varianten tragen dasselbe Grid`);
  }
  const wired = new Set();
  for (const def of Object.values(MAPS)) {
    for (const cell of Object.values(def.legend)) for (const k of cell.variants || []) wired.add(k);
  }
  for (const k of ['brick_wall_v4', 'brick_wall_v5', 'brick_wall_v6',
    'stone_floor_v4', 'stone_floor_v5', 'stone_floor_v6', 'stone_floor_v7', 'stone_floor_v8',
    'path_v6', 'grass_tuft_v1']) {
    if (!TILE_ART[k]) bad(`Zusatzvariante fehlt in TILE_ART: ${k}`);
    else if (!wired.has(k)) bad(`Zusatzvariante nicht verdrahtet: ${k}`);
  }
}

// ===========================================================================
// C) §3 INTERFACE-WAECHTER (bank_*, shore_cap_*, water_reflect_*) — portiert
// ===========================================================================
{
  const iface = [];
  for (const side of ['n', 'e', 's', 'w', 'ne', 'nw', 'se', 'sw']) {
    for (const set of ['g', 's']) iface.push(`bank_${side}_${set}`);
  }
  iface.push('shore_cap_nw', 'shore_cap_ne', 'shore_cap_sw', 'shore_cap_se',
    'shore_cap_wn', 'shore_cap_en', 'shore_cap_ws', 'shore_cap_es',
    'water_reflect_0', 'water_reflect_1');
  for (const k of iface) {
    const g = TILE_ART[k];
    if (!g) { bad(`§3-Interface-Kachel fehlt: ${k}`); continue; }
    if (g.length !== 16 || g[0].length !== 16) bad(`${k}: nicht 16x16`);
    if (!g.join('').includes('.')) bad(`${k}: kein transparenter Anteil (additives Overlay wuerde die Kachel zudecken)`);
  }
  for (const side of ['n', 'e', 's', 'w', 'ne', 'nw', 'se', 'sw']) {
    const g = TILE_ART[`bank_${side}_s`];
    if (!g) continue;
    for (const row of g) for (const c of row) {
      if ('zpvM'.includes(c)) bad(`bank_${side}_s: Schlamm-Ton '${c}' auf der Steinkante (§3.B2)`);
    }
  }
}

// ===========================================================================
// D) GP5-R3-GATES (portiert)
// ===========================================================================
{
  const mid = TILE_ART.water_mid;
  if (!mid) bad('water_mid fehlt');
  else {
    if (mid.join('').includes('k')) bad("water_mid: Schwarz-Ton 'k' — der Juror verlangt den Wasser-Grundton");
    for (let y = 0; y < 16; y++) {
      let run = 0;
      for (let x = 0; x < 32; x++) {
        if (mid[y][x % 16] !== '.') { run++; if (run > 2) bad(`water_mid: waagerechter Lauf ${run} in Zeile ${y} (Haken-/T-Verdacht)`); } else run = 0;
      }
    }
    for (let x = 0; x < 16; x++) {
      let best = 0, run = 0;
      for (let y = 0; y < 32; y++) { if (mid[y % 16][x] !== '.') { run++; best = Math.max(best, run); } else run = 0; }
      if (best > 9) bad(`water_mid Spalte ${x}: senkrechter Lauf ${best} > 9`);
      if (best > 0 && best < 3) bad(`water_mid Spalte ${x}: senkrechter Lauf ${best} < 3`);
      if (best === 0) bad(`water_mid Spalte ${x}: keine Glyphe (eine je 16px-Spalte gefordert)`);
    }
    let lang = 0;
    for (let x = 0; x < 16; x++) {
      let best = 0, run = 0;
      for (let y = 0; y < 32; y++) { if (mid[y % 16][x] !== '.') { run++; best = Math.max(best, run); } else run = 0; }
      if (best >= 4) lang++;
    }
    if (lang < 12) bad(`water_mid: nur ${lang}/16 Spalten mit einem Lauf >= 4px`);
  }
  // §3.1(a) FOLGE-ANPASSUNG: water_mid_calm fuehrt 'k' NICHT mehr, sondern '+'
  // als Tiefen-Schleier (sonst verdoppelt der Offset den Zonensprung).
  {
    const calm = TILE_ART.water_mid_calm;
    if (!calm) bad('water_mid_calm fehlt');
    else {
      if (calm.join('').includes('k')) bad("water_mid_calm: 'k' noch vorhanden (§3.1a verlangt '+')");
      if (!calm.join('').includes('+')) bad("water_mid_calm: Tiefen-Schleier '+' fehlt (§3.1a)");
    }
  }
  for (const base of ['water_shallow', 'water_mid_calm']) {
    for (const v of ['_v1', '_v2']) {
      const g = TILE_ART[base + v];
      if (!g) { bad(`Depth-Variante fehlt: ${base}${v}`); continue; }
      if (g.length !== 16 || g[0].length !== 16) bad(`${base}${v}: nicht 16x16`);
      if (g.join('') === TILE_ART[base].join('')) bad(`${base}${v}: identisch zum Original`);
    }
    if (TILE_ART[base + '_v1'] && TILE_ART[base + '_v2']
      && TILE_ART[base + '_v1'].join('') === TILE_ART[base + '_v2'].join('')) bad(`${base}: _v1 == _v2`);
  }
  for (const d of ['ne', 'nw', 'se', 'sw']) {
    const g = TILE_ART['shore_diag_' + d];
    if (!g) { bad(`shore_diag_${d} fehlt`); continue; }
    if (g.length !== 16 || g[0].length !== 16) bad(`shore_diag_${d}: nicht 16x16`);
    if (!g.join('').includes('.')) bad(`shore_diag_${d}: kein transparenter Anteil`);
    if (!g.join('').split('').some((c) => 'eEa'.includes(c))) bad(`shore_diag_${d}: keine Landzunge`);
    const seenN = Array.from({ length: 16 }, () => new Array(16).fill(false));
    const stack = [];
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if ('eEa'.includes(g[y][x])) stack.push([x, y]);
    while (stack.length) {
      const [cx, cy] = stack.pop();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx > 15 || ny > 15) continue;
        if (g[ny][nx] !== 'n' || seenN[ny][nx]) continue;
        seenN[ny][nx] = true; stack.push([nx, ny]);
      }
    }
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      if (g[y][x] === 'n' && !seenN[y][x]) bad(`shore_diag_${d}: 'n' bei (${x},${y}) haengt nicht an der Landzunge (Ton-Waise im Wasser)`);
    }
  }
  const uniq = (keys, label) => {
    const seen = new Map();
    for (const k of keys) {
      const g = TILE_ART[k];
      if (!g) { bad(`${label}: ${k} fehlt`); continue; }
      const flat = g.join('|');
      if (seen.has(flat)) bad(`${label}: ${k} identisch zu ${seen.get(flat)}`);
      seen.set(flat, k);
    }
  };
  uniq(['bank_n_g_v1', 'bank_n_g_v2', 'bank_n_g_v3'], 'Ufer-Zahn-Varianten');
  uniq(['brick_wall_l1', 'brick_wall_l2', 'brick_wall_l3', 'brick_wall_l4'], 'Ziegel-Luminanz-Varianten');
  for (const k of ['brick_wall_l1', 'brick_wall_l2', 'brick_wall_l3', 'brick_wall_l4']) {
    const g = TILE_ART[k];
    if (!g) continue;
    for (const row of g) for (const c of row) if (!'kTtLD'.includes(c)) bad(`${k}: Fremdton '${c}' (nur die kalte Steinrampe erlaubt)`);
  }
  for (const k of ['gravestone', 'gravestone_2', 'gravestone_3', 'gravestone_4', 'gravestone_5',
    'skull', 'skull_v1', 'skull_v2', 'fence']) {
    const g = TILE_ART[k];
    if (!g) { bad(`Prop fehlt: ${k}`); continue; }
    if (g.join('').includes('0')) bad(`${k}: alter unsichtbarer '0'-Kontaktschatten noch vorhanden`);
    if (!g.join('').includes('k')) bad(`${k}: kein 'k'-Kontaktschatten`);
  }
  if (TILE_ART.fence && TILE_ART.fence.join('').includes('F')) bad("fence: Spitzlicht 'F' noch vorhanden");
}

// ===========================================================================
// [3] §6.6 FLAMMEN-GATE — DOCHT-KERN, BREITE, FLAECHE
//
// §2.6/§6.6/Review P3-B3: der Flammenkern '1' gehoert AN DEN DOCHT. Bei
// BODENfackeln sind das die Grid-Zeilen 5..7, bei WANDfackeln 3..5 — deren
// Flamme endet eine Zeile hoeher; ein '1' in Zeile 6/7 laege dort im
// Metallgehaeuse. Das ist zugleich die Verortung, auf die lighting.js seine
// HOT_RINGS setzt (hotY = cy-2 bzw. cy-4): stimmen Art und Licht nicht
// ueberein, sitzt der Hotspot auf dem Pfosten.
// ===========================================================================
{
  const FAMILIEN = [
    ['BODEN', ['torch_0', 'torch_1', 'torch_2'], [5, 6, 7]],
    ['WAND', ['torch_wall_0', 'torch_wall_1', 'torch_wall_2'], [3, 4, 5]],
  ];
  for (const [label, keys, erlaubt] of FAMILIEN) {
    const flaechen = [];
    for (const k of keys) {
      const g = TILE_ART[k];
      if (!g) { bad(`Fackel fehlt: ${k}`); continue; }
      // (a) DOCHT-KERN: '1' NUR in den erlaubten Zeilen, und dort auch wirklich.
      const zeilen = [];
      g.forEach((row, y) => { if (row.includes('1')) zeilen.push(y); });
      const fremd = zeilen.filter((y) => !erlaubt.includes(y));
      if (fremd.length) bad(`${k} (${label}): Kern-Ton '1' in Zeile(n) ${fremd.join(',')} — erlaubt sind nur ${erlaubt.join('/')} (§6.6)`);
      if (zeilen.length === 0) bad(`${k} (${label}): gar kein Kern-Ton '1' im Docht-Bereich`);
      // (b) SILHOUETTE <= 5 px breit (Bestandsgate GP5, portiert): gemessen
      //     ueber die warmen Toene o/y/1 — keine Kreuz-Arme.
      let wide = 0, area = 0;
      for (const row of g) {
        let run = 0;
        for (const c of row) { if ('oy1'.includes(c)) { run++; area++; if (run > wide) wide = run; } else run = 0; }
      }
      if (wide > 5) bad(`${k}: Flammenzeile ${wide} px breit (max 5, Kreuz-Arme)`);
      flaechen.push([k, area]);
    }
    // (c) FLAECHE +-20 % INNERHALB der Familie: die drei Frames sind Flacker-
    //     Phasen derselben Flamme, keine drei verschiedenen Flammen.
    if (flaechen.length === 3) {
      const werte = flaechen.map(([, a]) => a);
      const mn = Math.min(...werte), mx = Math.max(...werte);
      const mittel = werte.reduce((a, b) => a + b, 0) / 3;
      if (mn < mittel * 0.8 || mx > mittel * 1.2) {
        bad(`${label}-Fackeln: Flammenflaeche ${werte.join('/')} weicht > +-20 % vom Mittel ${mittel.toFixed(1)} ab (§6.6)`);
      }
      console.log(`  INFO Flammen ${label}: Kern-Zeilen ${erlaubt.join('/')}, Flaechen ${werte.join('/')} (Mittel ${mittel.toFixed(1)})`);
    }
  }
}

// ===========================================================================
// [4] §6.2 KRATZER-GATE — KALT STATT WARM
//
// §6.2: "'T' und 'm' raus, 'L'+'k'-Dither". Gate der Spec: Delta(R-B)
// Kratzer-gegen-Boden <= +8. Zusaetzlich (Auftrag Phase 3): die DITHER-Toene
// selbst sind kalt, R-B <= -6.
// ===========================================================================
{
  const g = TILE_ART.floor_decal_crack;
  if (!g) bad('floor_decal_crack fehlt');
  else {
    const flat = g.join('');
    for (const verboten of ['T', 'm', 'O']) {
      if (flat.includes(verboten)) bad(`floor_decal_crack: warmer Ton '${verboten}' noch vorhanden (§6.2)`);
    }
    // (a) DITHER-TOENE (§6.2 nennt sie namentlich: 'L' und 'k') sind KALT.
    for (const t of ['L', 'k']) {
      if (!flat.includes(t)) bad(`floor_decal_crack: Dither-Ton '${t}' fehlt (§6.2 verlangt L+k-Dither)`);
      else if (rbOf(PALETTE[t]) > -6) bad(`floor_decal_crack: Dither-Ton '${t}' ist nicht kalt genug (R-B ${rbOf(PALETTE[t])} > -6)`);
    }
    // (b) SPEC-GATE: KEIN verwendeter Ton liegt mehr als +8 (R-B) ueber dem
    //     Bodenton 't' — auch nicht die Riss-Linie. Das ist die Formulierung
    //     aus §6.2 ("Delta(R-B) Kratzer-gegen-Boden <= +8") und faengt einen
    //     warmen Ausreisser, den die Namensliste (a) nicht kennt.
    const bodenRB = rbOf(PALETTE.t);
    const toene = [...new Set(flat.replace(/\./g, ''))];
    for (const c of toene) {
      const d = rbOf(PALETTE[c]) - bodenRB;
      if (d > 8) bad(`floor_decal_crack: Ton '${c}' ist ${d} R-B waermer als der Boden 't' (Grenze +8, §6.2)`);
    }
    console.log(`  INFO Kratzer: Toene ${toene.join('')} | R-B ${toene.map((c) => `${c}:${rbOf(PALETTE[c])}`).join(' ')} | Boden t:${bodenRB}`);
  }
}

// ===========================================================================
// [5] M4 KRONEN-BBOX-GATE + XL-VOLLSTAENDIGKEIT (§5.1/§5.3)
// ===========================================================================
{
  const XL_BASIS = ['tree_canopy_xl_a', 'tree_canopy_xl_a_m', 'tree_canopy_xl_b',
    'tree_canopy_xl_b_m', 'tree_canopy_xl_c', 'tree_canopy_xl_c_m'];
  const POSEN = ['', '_r1', '_r2', '_l1', '_l2'];
  for (const b of XL_BASIS) for (const s of POSEN) if (!TILE_ART[b + s]) bad(`XL-Posen-Grid fehlt: ${b}${s}`);
  const bbox = (g) => {
    let x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1;
    g.forEach((row, y) => [...row].forEach((c, x) => {
      if (c === '.') return;
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (y < y0) y0 = y; if (y > y1) y1 = y;
    }));
    return x1 < 0 ? [0, 0] : [x1 - x0 + 1, y1 - y0 + 1];
  };
  const masse = XL_BASIS.filter((k) => TILE_ART[k]).map((k) => [k, ...bbox(TILE_ART[k])]);
  const ab40 = masse.filter(([, w, h]) => w >= 40 && h >= 28);
  const ab56 = masse.filter(([, w, h]) => w >= 56 && h >= 40);
  if (ab40.length < 3) bad(`M4: nur ${ab40.length} Kronen-Keys mit Tinten-Bbox >= 40x28 (gefordert >= 3)`);
  if (ab56.length < 1) bad('M4: kein Kronen-Key mit Tinten-Bbox >= 56x40');
  console.log('  INFO Kronen-Bbox: ' + masse.map(([k, w, h]) => `${k.replace('tree_canopy_', '')} ${w}x${h}`).join(' | '));
  // §5.3: Bake-Toene 'n'/'0' (NICHT 'k' — L<16-Budget, Review P3-m7).
  for (const k of ['canopy_shadow_xl_a', 'canopy_shadow_xl_b', 'canopy_shadow_xl_c']) {
    const g = TILE_ART[k];
    if (!g) { bad(`Schatten-Bake fehlt: ${k}`); continue; }
    const t = [...new Set(g.join('').replace(/\./g, ''))];
    if (t.some((c) => c !== 'n' && c !== '0')) bad(`${k}: Fremdton '${t.join('')}' (§5.3 erlaubt nur n/0)`);
    if (!g.join('').includes('.')) bad(`${k}: kein transparenter Anteil (der Bake ist eine Silhouette, keine Vollflaeche)`);
  }
  // §5.3: canopy_shadow selbst traegt jetzt Bayer-25 % ueber 'n'/'0' statt Schachbrett.
  {
    const g = TILE_ART.canopy_shadow;
    if (!g) bad('canopy_shadow fehlt');
    else {
      const t = [...new Set(g.join('').replace(/\./g, ''))];
      if (t.some((c) => c !== 'n' && c !== '0')) bad(`canopy_shadow: Fremdton '${t.join('')}' (§5.3 erlaubt nur n/0)`);
    }
  }
}

// ===========================================================================
// [6] §6.4a SPECULAR-CLUSTER-GATE — NUR water_shallow / _v1 / _v2
//
// GELTUNGSBEREICH (bindend): AUSSCHLIESSLICH die drei HORIZONTALEN Ufer-Ring-
// Grids des Teichs. Die drei VERTIKALEN Kanal-Grids (water_shallow_vert*)
// sind AUSGENOMMEN — sie tragen ihren EIGENEN Kammglanz ('=' als Einzeltexel
// laengs der Stroemung, §6.1) und wuerden vom Teich-Gate falsch gemessen.
//
// TRENNUNG BAND / SPECULAR: das bestehende Ufer-Band besteht aus den
// WAAGERECHTEN Wellen-Laeufen; §6.4a legt die Specular-Tupfer ZUSAETZLICH
// darueber. Der Zaehler trennt deshalb so:
//   BAND     = jeder '='-Texel in einem waagerechten Lauf der Laenge >= 3,
//              plus alles, was daran 4-verbunden haengt (die Wellenkante
//              laeuft ueber zwei Zeilen versetzt weiter);
//   SPECULAR = der Rest, 4-verbunden gruppiert.
// Diese Trennung reproduziert auf dem Basis-Grid EXAKT das in §6.4a genannte
// "bestehende 26-Texel-Uferband" — das ist der Beleg, dass sie die vom
// Generator gemeinte Zerlegung trifft.
//
// GATE je Kachel: 4..6 Specular-Texel, jeder Cluster 1..4 Texel gross, kein
// Cluster in den obersten 4 Kachelzeilen. Bezugsflaeche TEICH_RECT = 4
// Ring-0-Kacheln -> 16..24 Cluster-Texel (§6.4a).
// ===========================================================================
{
  const SHALLOW = ['water_shallow', 'water_shallow_v1', 'water_shallow_v2'];
  const VERT = ['water_shallow_vert', 'water_shallow_vert_v1', 'water_shallow_vert_v2'];
  const specularVon = (g) => {
    const H = g.length, W = g[0].length;
    const istBand = Array.from({ length: H }, () => new Array(W).fill(false));
    // (1) waagerechte Laeufe >= 3 markieren
    for (let y = 0; y < H; y++) {
      let x = 0;
      while (x < W) {
        if (g[y][x] !== '=') { x++; continue; }
        let e = x;
        while (e < W && g[y][e] === '=') e++;
        if (e - x >= 3) for (let i = x; i < e; i++) istBand[y][i] = true;
        x = e;
      }
    }
    // (2) alles 4-verbundene an das Band anschliessen (Wellenkante ueber 2 Zeilen)
    let geaendert = true;
    while (geaendert) {
      geaendert = false;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        if (g[y][x] !== '=' || istBand[y][x]) continue;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          if (istBand[ny][nx]) { istBand[y][x] = true; geaendert = true; break; }
        }
      }
    }
    // (3) Rest 4-verbunden gruppieren
    const seen = Array.from({ length: H }, () => new Array(W).fill(false));
    const cluster = [];
    let bandTexel = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (g[y][x] !== '=') continue;
      if (istBand[y][x]) { bandTexel++; continue; }
      if (seen[y][x]) continue;
      const st = [[x, y]]; seen[y][x] = true; const cells = [];
      while (st.length) {
        const [cx, cy] = st.pop(); cells.push([cx, cy]);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = cx + dx, ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen[ny][nx] || g[ny][nx] !== '=' || istBand[ny][nx]) continue;
          seen[ny][nx] = true; st.push([nx, ny]);
        }
      }
      cluster.push(cells);
    }
    return { cluster, bandTexel };
  };
  let summe = 0;
  for (const k of SHALLOW) {
    const g = TILE_ART[k];
    if (!g) { bad(`Ufer-Ring-Grid fehlt: ${k}`); continue; }
    const { cluster, bandTexel } = specularVon(g);
    const texel = cluster.reduce((a, c) => a + c.length, 0);
    summe += texel;
    if (texel < 4 || texel > 6) bad(`${k}: ${texel} Specular-Texel, gefordert 4..6 (§6.4a)`);
    for (const c of cluster) {
      if (c.length > 4) bad(`${k}: Specular-Cluster mit ${c.length} Texeln (Obergrenze 4, §6.4a)`);
      const minY = Math.min(...c.map((p) => p[1]));
      if (minY < 4) bad(`${k}: Specular-Cluster beginnt in Zeile ${minY} (verboten: oberste 4 Kachelzeilen, §6.4a)`);
    }
    if (bandTexel < 20) bad(`${k}: Ufer-Band nur ${bandTexel} Texel (das bestehende ~26er-Band muss stehen bleiben)`);
    console.log(`  INFO Specular ${k}: ${cluster.length} Cluster / ${texel} Texel (Groessen ${cluster.map((c) => c.length).join(',') || '-'}), Band ${bandTexel}`);
  }
  // Bezugsflaeche TEICH_RECT: 4 Ring-0-Kacheln. Die drei Grids decken den Ring
  // ueber die _v1/_v2-Streuung ab; das Fenster-Gate rechnet mit 4 x [4..6].
  const proKachel = summe / Math.max(1, SHALLOW.filter((k) => TILE_ART[k]).length);
  const fenster = proKachel * 4;
  if (fenster < 16 || fenster > 24) bad(`TEICH_RECT-Hochrechnung ${fenster.toFixed(1)} Cluster-Texel ausserhalb 16..24 (§6.4a)`);
  // GEGEN-GATE: die vertikalen Kanal-Grids sind AUSGENOMMEN und tragen
  // trotzdem ihren eigenen Kammglanz — sonst waere die Ausnahme ein Freibrief.
  for (const k of VERT) {
    const g = TILE_ART[k];
    if (!g) { bad(`Kanal-Ufer-Grid fehlt: ${k}`); continue; }
    const n = g.join('').split('').filter((c) => c === '=').length;
    if (n === 0) bad(`${k}: kein eigener Kammglanz '=' (die Ausnahme vom Teich-Gate setzt ihn voraus)`);
    if (SHALLOW.includes(k)) bad(`${k}: darf NICHT im Teich-Gate stehen`);
  }
  console.log(`  INFO Specular: TEICH_RECT-Hochrechnung ${fenster.toFixed(1)} Texel (Fenster 16..24); `
    + `Kanal-Grids ausgenommen (${VERT.map((k) => (TILE_ART[k] || []).join('').split('').filter((c) => c === '=').length).join('/')} eigene '='-Texel)`);
}

// ===========================================================================
// E) §6.3 WEGSPORN path_pebbles (Art-Seite)
// ===========================================================================
{
  const g = TILE_ART.path_pebbles;
  if (!g) bad('path_pebbles fehlt (§6.3)');
  else {
    if (g.length !== 16 || g[0].length !== 16) bad('path_pebbles: nicht 16x16');
    if (TILE_ART.pebble_small && g.join('') === TILE_ART.pebble_small.join('')) {
      bad('path_pebbles ist identisch zu pebble_small (der Sporn soll als WEG lesen)');
    }
    const dichte = g.join('').split('').filter((c) => c !== 'e' && c !== '.').length;
    const dichteAlt = (TILE_ART.pebble_small || []).join('').split('').filter((c) => c !== 'e' && c !== '.').length;
    if (dichte <= dichteAlt) bad(`path_pebbles: Kiesel-Dichte ${dichte} nicht > pebble_small ${dichteAlt}`);
  }
}

// ===========================================================================
// GP7CH [10] (E8(3), Review M18) ADDITIV: Charakter-Grid-Masse.
// Alle SPRITES-Keys /^(player|npc)_/ sind exakt 16 breit und 24 hoch.
// AUSNAHME npc_blase (Questblase, 8x8, haengt an der Rahmen-Oberkante,
// npcs.js:222-225). Reine Ergaenzung — kein Bestands-Gate wird veraendert.
// ===========================================================================
{
  const KEYS = Object.keys(SPRITES).filter((k) => /^(player|npc)_/.test(k) && k !== 'npc_blase');
  if (KEYS.length < 32) bad(`GP7CH-Massprobe: nur ${KEYS.length} player_/npc_-Keys gefunden (erwartet >= 32)`);
  let ok = 0;
  for (const k of KEYS) {
    const g = SPRITES[k];
    if (!Array.isArray(g) || g.length === 0) { bad(`GP7CH-Massprobe: ${k} ist kein Grid`); continue; }
    const h = g.length;
    const breiten = [...new Set(g.map((r) => r.length))];
    const w = breiten.length === 1 ? breiten[0] : null;
    if (w !== 16 || h !== 24) {
      bad(`GP7CH-Massprobe: ${k} ist ${w === null ? 'ungleich breit (' + breiten.join('/') + ')' : w}x${h}, gefordert 16x24 (Masse FEST)`);
    } else ok++;
  }
  if (!('npc_blase' in SPRITES)) bad('GP7CH-Massprobe: npc_blase fehlt (die deklarierte Ausnahme muss existieren)');
  console.log(`  INFO GP7CH-Massprobe: ${ok}/${KEYS.length} Charakter-Grids exakt 16x24 (npc_blase ausgenommen: `
    + `${((SPRITES.npc_blase || [])[0] || '').length}x${(SPRITES.npc_blase || []).length})`);
}


// --- GP7CH2-BLOCK-START ---
// ===========================================================================
// GP7CH2 [11] (SPEC_GP7CH2.md Rev 1 §2 P0.e + §5(3); Rev 2 E-A7, E-B9, E-C1)
// ADDITIVE GEGNER-MASSTABELLE. Reine Ergaenzung am Dateiende — kein Bestands-
// Gate wird angefasst. Der Ghul-Block (PORTIERT 5, oben) bleibt woertlich
// stehen; die Ghul-Zeile hier fuehrt ihn nur MIT, damit die Groessenleiter an
// EINER Stelle vollstaendig lesbar ist (doppelt gruen ist kein Schaden).
//
// GROESSENLEITER V8 / §0.3 (eingefroren):
//   skeleton_*  16x16   AUFRECHT-SCHMAL
//   hound_*     16x12   VIERBEINER
//   ghoul_*     16x20   AUFRECHT-MASSIG  (Bestand, mitgefuehrt)
//   rust_*      UEBERGANG, siehe unten
//   warden_*    24x32   GROSS            (Bestand, mitgefuehrt, 9 Grids)
//
// UEBERGANGS-REGEL ROST (Review m11, Rev 2 E-A7): eine einzige additive
// Gate-Zeile kann nicht gleichzeitig 16x18 dulden und 20x18 erzwingen, ohne
// sich selbst zu erfuellen. Darum fordert DIESER Commit nur:
//   rust_0/_1/_die sind ALLE GLEICH GROSS und ihr Mass liegt in {16x18, 20x18}.
// DER ROST-COMMIT (Phase 1, Zeichner B) VERSCHAERFT GENAU DIESE ZEILE AUF
// 20x18 — das ist die zweite und letzte sanktionierte Beruehrung dieser Datei
// im CH-2-Rahmen (§5(3) i.d.F. Rev 2 E-A7: "ZWEI Beruehrungen").
//
// DECALS (Rev 2 E-A4/E-B9): *_decal-Keys gibt es heute noch nicht (Phase 1
// liefert sie). Die Regel steht trotzdem schon hier und greift, sobald der
// erste Key existiert: Breite = Breite des Basisgrids (das Decal liegt
// deckungsgleich unter der Figur), Hoehe <= 6 Zeilen UND <= 40 % der
// Basisgrid-Hoehe; Grufthund <= 4 Zeilen (E-B9, Band 8-11). Warden traegt
// laut §8 KEIN Decal — falls doch eines auftaucht, wird es hier mitgemessen
// statt stillschweigend durchgelassen.
//
// AUSDRUECKLICH NICHT IN DER TABELLE:
//   - shield_side/_up/_down (6x12 bzw. 12x6): Overlays, keine Koerper-Grids.
//     Ihre Landezone regelt E-B9/M7 am Rost-Grid, nicht ein Mass-Gate.
//   - fussvolk_*: aus CH-2 GESTRICHEN (Rev 2 E-C1, Backlog Kampf-Slice).
//     Rev 1 §2 P0.e nannte noch "fussvolk 16x14" — Rev 2 sticht Rev 1.
//
// Die Zeilenbreiten-Gleichheit ALLER SPRITES prueft bereits checkGrid
// (PORTIERT 2, oben); hier wird sie je Grid nur noch einmal explizit gelesen,
// damit die Fehlermeldung das Mass nennt.
// ===========================================================================
{
  const massGrid = (g) => {
    if (!Array.isArray(g) || g.length === 0) return null;
    const breiten = [...new Set(g.map((r) => r.length))];
    return { w: breiten.length === 1 ? breiten[0] : null, h: g.length, breiten };
  };
  const massText = (m) => (m === null ? 'kein Grid'
    : `${m.w === null ? 'ungleich breit (' + m.breiten.join('/') + ')' : m.w}x${m.h}`);
  // Koerper-Keys einer Familie: alles mit dem Praefix, OHNE die *_decal-Keys
  // (die haben ihre eigene Regel weiter unten).
  const koerperKeys = (praefix) => Object.keys(SPRITES)
    .filter((k) => (k === praefix || k.startsWith(praefix + '_')) && !/_decal$/.test(k));

  // --- (a) FESTE MASSE ------------------------------------------------------
  const FEST = [
    { praefix: 'skeleton', w: 16, h: 16, min: 3, quelle: '§0.3 Groessenleiter V8' },
    { praefix: 'hound', w: 16, h: 12, min: 6, quelle: '§0.3 Groessenleiter V8' },
    { praefix: 'ghoul', w: 16, h: 20, min: 3, quelle: '§0.3 FEST (Bestand, mitgefuehrt)' },
    { praefix: 'warden', w: 24, h: 32, min: 9, quelle: '§0.3 FEST (Bestand, mitgefuehrt)' },
  ];
  const infoZeilen = [];
  for (const f of FEST) {
    const keys = koerperKeys(f.praefix);
    if (keys.length < f.min) {
      bad(`GP7CH2-Masstabelle: nur ${keys.length} ${f.praefix}_-Koerper-Keys (erwartet >= ${f.min})`);
    }
    let ok = 0;
    for (const k of keys) {
      const m = massGrid(SPRITES[k]);
      if (m === null || m.w !== f.w || m.h !== f.h) {
        bad(`GP7CH2-Masstabelle: ${k} ist ${massText(m)}, gefordert ${f.w}x${f.h} (${f.quelle})`);
      } else ok++;
    }
    infoZeilen.push(`${f.praefix} ${ok}/${keys.length} @ ${f.w}x${f.h}`);
  }

  // --- (b) ROST: MASS FEST (Uebergangsregel BEENDET) -----------------------
  // RUNDE 2 DES WERKZEUG-NACHZUGS (12.09.2026, §5(3) ZWEITE BERUEHRUNG =
  // "der Rost-Commit"): Zeichner B hat rust_0/_1/_die UND rust_decal auf die
  // neue Breite 20 gezogen, der Kunststand ist final. Damit ist die
  // Uebergangsregel {16x18, 20x18} erledigt und ERLAUBT wird auf [[20, 18]]
  // verschaerft — genau die eine Zeile, die GP7CH2_PHASE0.md fuer diesen
  // Commit vorgesehen hat ("der Rost-Commit ersetzt ERLAUBT durch [[20,18]]").
  // 16x18 ist ab jetzt ROT; die Groessenleiter V8/§0.3 fuehrt rust_* als 20x18.
  {
    const ERLAUBT = [[20, 18]];
    const keys = koerperKeys('rust');
    if (keys.length < 3) {
      bad(`GP7CH2-Masstabelle: nur ${keys.length} rust_-Koerper-Keys (erwartet >= 3: _0/_1/_die)`);
    }
    for (const k of ['rust_0', 'rust_1', 'rust_die']) {
      if (!keys.includes(k)) bad(`GP7CH2-Masstabelle: ${k} fehlt (Rost-Trias ist Pflicht)`);
    }
    const masse = keys.map((k) => ({ k, m: massGrid(SPRITES[k]) }));
    const gestalt = [...new Set(masse.map((e) => massText(e.m)))];
    if (gestalt.length > 1) {
      bad('GP7CH2-Masstabelle: rust_* sind NICHT alle gleich gross ('
        + masse.map((e) => `${e.k} ${massText(e.m)}`).join(', ') + ')');
    }
    for (const e of masse) {
      const passt = e.m !== null && ERLAUBT.some(([w, h]) => e.m.w === w && e.m.h === h);
      if (!passt) {
        bad(`GP7CH2-Masstabelle: ${e.k} ist ${massText(e.m)}, erlaubt sind nur `
          + `${ERLAUBT.map(([w, h]) => `${w}x${h}`).join(' oder ')} `
          + '(Groessenleiter V8/§0.3; die Uebergangsregel {16x18,20x18} ist mit dem Rost-Commit beendet)');
      }
    }
    infoZeilen.push(`rust ${gestalt.join('|')}`);
  }

  // --- (c) DECAL-MASSE ------------------------------------------------------
  {
    const BASIS = {
      skeleton: 'skeleton_0', hound: 'hound_0', ghoul: 'ghoul_0',
      rust: 'rust_0', warden: 'warden_idle',
    };
    const ZEILEN_HART = { hound: 4 }; // E-B9: Hund-Decal <= 4 Zeilen, Band 8-11
    const decals = Object.keys(SPRITES).filter((k) => /_decal$/.test(k));
    for (const k of decals) {
      const fam = k.slice(0, -'_decal'.length);
      const basisKey = BASIS[fam];
      if (!basisKey) {
        bad(`GP7CH2-Decalmasse: ${k} gehoert zu keiner bekannten Gegner-Familie `
          + `(bekannt: ${Object.keys(BASIS).join('/')})`);
        continue;
      }
      const b = massGrid(SPRITES[basisKey]);
      const d = massGrid(SPRITES[k]);
      if (b === null || b.w === null) { bad(`GP7CH2-Decalmasse: Basisgrid ${basisKey} unbrauchbar (${massText(b)})`); continue; }
      if (d === null || d.w === null) { bad(`GP7CH2-Decalmasse: ${k} ist ${massText(d)} (kein sauberes Grid)`); continue; }
      if (d.w !== b.w) {
        bad(`GP7CH2-Decalmasse: ${k} ist ${d.w} breit, gefordert ${b.w} (Breite = Basisgrid ${basisKey})`);
      }
      const deckel40 = Math.floor(0.4 * b.h);
      const deckel = Math.min(6, deckel40, ZEILEN_HART[fam] === undefined ? 99 : ZEILEN_HART[fam]);
      if (d.h > deckel) {
        bad(`GP7CH2-Decalmasse: ${k} ist ${d.h} Zeilen hoch, erlaubt <= ${deckel} `
          + `(<= 6 UND <= 40 % von ${basisKey} = ${deckel40}`
          + (ZEILEN_HART[fam] === undefined ? '' : `; ${fam}-Sonderdeckel ${ZEILEN_HART[fam]}, E-B9`) + ')');
      }
    }
    infoZeilen.push(`decals ${decals.length}${decals.length === 0 ? ' (noch keine — Phase 1 liefert sie)' : ': ' + decals.join(',')}`);
  }

  console.log('  INFO GP7CH2-Masstabelle: ' + infoZeilen.join(' | '));
}
// --- GP7CH2-BLOCK-ENDE ---
console.log(fail === 0 ? 'GP6-ART-CHECK GRUEN' : `GP6-ART-CHECK ROT (${fail})`);
process.exit(fail === 0 ? 0 : 1);
