// GP6 PHASE 1 ART — SELBSTPRUEFUNG (Wegwerf, .tmp).
// node .tmp/check_gp6_art_self.mjs
import fs from 'node:fs';
import { PALETTE } from '../game/js/art/palette.js';
import { SPRITES, TILE_ART } from '../game/js/art/sprites.js';
import { SPRITES as S_ALT, TILE_ART as T_ALT } from './sprites_gp6_backup.js';

let fail = 0, ok = 0;
const bad = (m) => { console.log('  ROT   ' + m); fail++; };
const gut = (m) => { ok++; if (process.env.V) console.log('  gruen ' + m); };
const pruef = (b, m) => (b ? gut(m) : bad(m));

const L = (h) => 0.299 * parseInt(h.slice(1, 3), 16) + 0.587 * parseInt(h.slice(3, 5), 16) + 0.114 * parseInt(h.slice(5, 7), 16);
const LT = (c) => L(PALETTE[c]);
const RmB = (c) => parseInt(PALETTE[c].slice(1, 3), 16) - parseInt(PALETTE[c].slice(5, 7), 16);
const mittel = (g) => { let s = 0, n = 0; for (const r of g) for (const c of r) { if (c === '.') continue; s += LT(c); n++; } return n ? s / n : 0; };
const zensus = (g) => { const c = {}; for (const r of g) for (const ch of r) c[ch] = (c[ch] || 0) + 1; return c; };

console.log('=== A) PALETTE ===========================================');
const SOLL = { e: '#28332c', E: '#344431', a: '#485c3f', m: '#5f7250', K: '#677b47', A: '#758f59',
  w: '#263335', W: '#36494c', 9: '#465f63', '=': '#56757a' };
for (const [k, v] of Object.entries(SOLL)) pruef(PALETTE[k] === v, `Offset-Ton '${k}' = ${PALETTE[k]} (Soll ${v})`);
const alnum = Object.keys(PALETTE).filter((k) => /^[A-Za-z0-9]$/.test(k));
const sym = Object.keys(PALETTE).filter((k) => !/^[A-Za-z0-9]$/.test(k));
pruef(alnum.length === 61, `61 alnum-Toene (ist ${alnum.length})`);
pruef(sym.length === 3 && sym.join('') === '=+*', `genau 3 Symboltoene (ist ${sym.join('')})`);
pruef(!('l' in PALETTE), "'l' nicht in PALETTE");
for (const [k, h] of Object.entries(PALETTE)) if (!/^#[0-9a-f]{6}$/i.test(h)) bad(`Farbe ${k}=${h} ungueltig`);
const ORD = ['k', 'w', 'W', '9', '=', 'A', 'D'];
for (let i = 0; i < ORD.length - 1; i++) pruef(LT(ORD[i]) < LT(ORD[i + 1]), `Ordnung ${ORD[i]} < ${ORD[i + 1]}`);
pruef(Math.abs(LT('w') - LT('e')) < 1, `w ~ e (|Delta| ${Math.abs(LT('w') - LT('e')).toFixed(2)} < 1)`);
{
  const wr = parseInt(PALETTE.w.slice(1, 3), 16), wg = parseInt(PALETTE.w.slice(3, 5), 16), wb = parseInt(PALETTE.w.slice(5, 7), 16);
  const er = parseInt(PALETTE.e.slice(1, 3), 16), eg = parseInt(PALETTE.e.slice(3, 5), 16), eb = parseInt(PALETTE.e.slice(5, 7), 16);
  pruef(wb > wg && eg > eb, `'w' kuehler als 'e' (w B${wb}>G${wg}, e G${eg}>B${eb}) [${er}]`);
}
{
  const S = (c) => { const r = parseInt(PALETTE[c].slice(1, 3), 16), g = parseInt(PALETTE[c].slice(3, 5), 16), b = parseInt(PALETTE[c].slice(5, 7), 16); const mx = Math.max(r, g, b); return (mx - Math.min(r, g, b)) / mx; };
  for (const c of ['w', 'W', '9', '=']) pruef(S(c) < S('A'), `S('${c}') ${S(c).toFixed(3)} < S('A') ${S('A').toFixed(3)}`);
}

console.log('=== B) GRIDS: Zeichenvorrat + Maße (§7.G) =================');
const MASSE = new Set(['16x16', '32x32', '48x32', '64x48', '64x32']);
for (const [n, g] of Object.entries(TILE_ART)) {
  const w = g[0].length;
  if (!g.every((r) => r.length === w)) bad(`T:${n}: Zeilen unterschiedlich breit`);
  for (const [i, r] of g.entries()) for (const c of r) if (c !== '.' && !(c in PALETTE)) bad(`T:${n} Zeile ${i}: Zeichen '${c}' nicht in PALETTE`);
  if (!MASSE.has(`${w}x${g.length}`)) bad(`T:${n}: Maß ${w}x${g.length} nicht in {16x16,32x32,48x32,64x48,64x32}`);
}
gut('alle TILE_ART-Grids: Zeichenvorrat + Maßtabelle');
for (const [n, g] of Object.entries(SPRITES)) {
  const w = g[0].length;
  if (!g.every((r) => r.length === w)) bad(`S:${n}: Zeilen unterschiedlich breit`);
  for (const r of g) for (const c of r) if (c !== '.' && !(c in PALETTE)) bad(`S:${n}: Zeichen '${c}' nicht in PALETTE`);
}
gut('alle SPRITES-Grids: Zeichenvorrat');
pruef(JSON.stringify(SPRITES) === JSON.stringify(S_ALT), 'SPRITES byte-unveraendert (kein neuer/veraenderter Sprite-Key)');
pruef(Object.keys(SPRITES).length === 75, `SPRITES-Indizes 0..74 unveraendert (${Object.keys(SPRITES).length})`);

console.log('=== C) REIHENFOLGE-WAECHTER (§0.5) ========================');
const altKeys = Object.keys(T_ALT), neuKeys = Object.keys(TILE_ART);
pruef(neuKeys.slice(0, altKeys.length).join(',') === altKeys.join(','), 'alle Bestands-TILE_ART-Keys in unveraenderter Reihenfolge vorn');
const ANHANG = JSON.parse(fs.readFileSync('/home/coder/Grimlight/.tmp/gp6_art_anhang.json', 'utf8'));
pruef(neuKeys.slice(altKeys.length).join(',') === ANHANG.join(','), `${ANHANG.length} neue Keys ausschliesslich am ENDE`);

console.log('=== D) WIESENLICHT (§3.1): Kachelmittel +-2..4 L ===========');
const POOL = []; for (let i = 0; i < 47; i++) POOL.push(`grass_g5_${String(i).padStart(2, '0')}`);
const PM = POOL.reduce((s, k) => s + mittel(TILE_ART[k]), 0) / POOL.length;
pruef(Math.abs(PM - 50) < 1.5, `Pool-Mittel ${PM.toFixed(2)} (~50)`);
for (const k of ['grass_lumahi', 'grass_lumahi_mix75', 'grass_lumahi_mix', 'grass_lumalo', 'grass_lumalo_mix75', 'grass_lumalo_mix']) {
  const d = mittel(TILE_ART[k]) - PM;
  pruef(Math.abs(d) >= 2 && Math.abs(d) <= 4, `${k}: Mittel ${mittel(TILE_ART[k]).toFixed(2)}, Abw ${d.toFixed(2)} L (Band 2..4)`);
  const z = zensus(TILE_ART[k]);
  pruef(Object.keys(z).every((c) => '+eEamKA'.includes(c)), `${k}: nur Rampentoene ${Object.keys(z).join('')}`);
  pruef(256 - (z.e || 0) >= 12, `${k}: nicht flach (${256 - (z.e || 0)} Nicht-e-Texel; Gras-Pool selbst 6..45)`);
}
// hi > Pool > lo, und mix-Stufen liegen zwischen Patch und Pool
pruef(mittel(TILE_ART.grass_lumahi) > mittel(TILE_ART.grass_lumahi_mix75)
  && mittel(TILE_ART.grass_lumahi_mix75) > mittel(TILE_ART.grass_lumahi_mix)
  && mittel(TILE_ART.grass_lumahi_mix) > PM, 'hi-Familie monoton Patch > 75 % > 50 % > Pool');
pruef(mittel(TILE_ART.grass_lumalo) < mittel(TILE_ART.grass_lumalo_mix75)
  && mittel(TILE_ART.grass_lumalo_mix75) < mittel(TILE_ART.grass_lumalo_mix)
  && mittel(TILE_ART.grass_lumalo_mix) < PM, 'lo-Familie monoton Patch < 75 % < 50 % < Pool');
// Keine Periode <= 8 in x oder y (GP5-R2-Auflage, muss erhalten bleiben)
for (const k of ['grass_lumahi', 'grass_lumahi_mix75', 'grass_lumahi_mix', 'grass_lumalo', 'grass_lumalo_mix75', 'grass_lumalo_mix']) {
  const g = TILE_ART[k];
  let schlecht = '';
  for (const p of [1, 2, 4, 8]) {
    let px = true, py = true;
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      if (g[y][(x + p) % 16] !== g[y][x]) px = false;
      if (g[(y + p) % 16][x] !== g[y][x]) py = false;
    }
    if (px) schlecht += ` x=${p}`; if (py) schlecht += ` y=${p}`;
  }
  pruef(!schlecht, `${k}: keine Periode <= 8${schlecht}`);
}

console.log('=== E) BACK-KRONEN-RIM Variante C (§3.1b) =================');
for (const [k, z] of [['tree_canopy_back_a', 9], ['tree_canopy_back_b', 8], ['tree_canopy_back_c', 10]]) {
  const alt = T_ALT[k], neu = TILE_ART[k];
  const spalten = []; for (let x = 0; x < 32; x++) if (alt[z][x] === 'E') spalten.push(x);
  pruef(spalten.length > 0, `${k}: Rim-Zeile ${z} hatte ${spalten.length} 'E'`);
  pruef(spalten.every((x) => neu[z][x] === '*'), `${k}: E-Zeile ${z} jetzt durchgehend '*'`);
  pruef(spalten.every((x) => neu[z + 1][x] === 'e'), `${k}: Rim 'e' eine Zeile nach innen (Zeile ${z + 1})`);
  pruef(!neu.join('').includes('E'), `${k}: kein 'E' mehr im Grid`);
  pruef(!neu.join('').includes('C'), `${k}: kein Stahlblau 'C'`);
  pruef(neu.join('').includes('+') && neu.join('').includes('*'), `${k}: Rampe +/* vollstaendig`);
  // Rim-Kontrast zur Umgebung
  pruef(LT('e') - LT('+') > 10 && LT('e') - LT('*') > 18,
    `Rim 'e' +${(LT('e') - LT('+')).toFixed(1)} L ueber '+', +${(LT('e') - LT('*')).toFixed(1)} L ueber '*'`);
  // jeder Rim-Texel liegt auf Kronenkoerper (0 % unsichtbar)
  pruef(spalten.every((x) => neu[z + 2] && neu[z + 2][x] !== '.'), `${k}: jeder Rim-Texel sitzt auf Kronenkoerper`);
}

console.log('=== F) WASSER (§3.1a / §6.4a / §6.1) ======================');
for (const k of ['water_mid_calm', 'water_mid_calm_v1', 'water_mid_calm_v2']) {
  pruef(!TILE_ART[k].join('').includes('k'), `${k}: kein 'k' mehr`);
  pruef(TILE_ART[k].join('').includes('+'), `${k}: Tiefen-Schleier '+' vorhanden`);
  pruef(TILE_ART[k].map((r) => r.split('+').join('k')).join('') === T_ALT[k].join(''), `${k}: Strichlagen byte-gleich (nur Tontausch)`);
}
pruef(LT('w') - LT('+') > 10 && LT('w') - LT('+') < 14, `Zonensprung w gegen '+' = ${(LT('w') - LT('+')).toFixed(1)} L (Soll ~11,5)`);
// Specular §6.4a
let clusterTexelGesamt = 0;
for (const k of ['water_shallow', 'water_shallow_v1', 'water_shallow_v2']) {
  const g = TILE_ART[k], alt = T_ALT[k];
  const neu = [];
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (g[y][x] === '=' && alt[y][x] !== '=') neu.push([x, y]);
  pruef(neu.length >= 4 && neu.length <= 6, `${k}: ${neu.length} neue '='-Specular-Texel (4..6)`);
  pruef(neu.every(([, y]) => y >= 4), `${k}: kein Specular in den obersten 4 Zeilen`);
  clusterTexelGesamt += neu.length;
  // Cluster bilden (8-Nachbarschaft) und Groesse 1..4 pruefen
  const menge = new Set(neu.map(([x, y]) => x + ',' + y));
  const gesehen = new Set(); const groessen = [];
  for (const p of menge) {
    if (gesehen.has(p)) continue;
    const stack = [p]; let n = 0; gesehen.add(p);
    while (stack.length) {
      const [cx, cy] = stack.pop().split(',').map(Number); n++;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const q = (cx + dx) + ',' + (cy + dy);
        if (menge.has(q) && !gesehen.has(q)) { gesehen.add(q); stack.push(q); }
      }
    }
    groessen.push(n);
  }
  pruef(groessen.every((n) => n >= 1 && n <= 4), `${k}: Clustergroessen ${groessen.join('/')} (1..4)`);
  // Isolation gegen das Bestands-Uferband (8-Nachbarschaft)
  let beruehrt = 0;
  for (const [x, y] of neu) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    const nx = x + dx, ny = y + dy;
    if (nx < 0 || ny < 0 || nx > 15 || ny > 15) continue;
    if (alt[ny][nx] === '=') beruehrt++;
  }
  pruef(beruehrt === 0, `${k}: Specular 8-getrennt vom Uferband`);
  // Uferband unveraendert
  let bandOk = true;
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (alt[y][x] === '=' && g[y][x] !== '=') bandOk = false;
  pruef(bandOk, `${k}: 26-Texel-Uferband unveraendert`);
}
pruef(clusterTexelGesamt / 3 * 4 >= 16 && clusterTexelGesamt / 3 * 4 <= 24,
  `TEICH_RECT-Hochrechnung: ${(clusterTexelGesamt / 3 * 4).toFixed(0)} Cluster-Texel auf 4 Ring-0-Kacheln (16..24)`);
// '='-Bestandsgate bleibt
let eq = 0; for (const k of ['water', 'water_1', 'water_2', 'water_3']) for (const r of TILE_ART[k]) for (const c of r) if (c === '=') eq++;
pruef(eq >= 20, `'='-Bestands-Gate ueber water/water_1..3: ${eq} >= 20`);

console.log('=== G) KANAL-UFERRING (§6.1) ==============================');
for (const k of ['water_shallow_vert', 'water_shallow_vert_v1', 'water_shallow_vert_v2']) {
  const g = TILE_ART[k];
  pruef(g.length === 16 && g[0].length === 16, `${k}: 16x16`);
  pruef(g.join('').includes('.'), `${k}: transparente Anteile (additives Overlay)`);
  pruef([...g.join('')].every((c) => '.9='.includes(c)), `${k}: nur '9'/'=' (Kamm-Toene)`);
  // waagerechte Laeufe <= 2 (zyklisch ueber die Naht)
  let maxH = 0;
  for (let y = 0; y < 16; y++) { let run = 0; for (let x = 0; x < 32; x++) { if (g[y][x % 16] !== '.') { run++; maxH = Math.max(maxH, run); } else run = 0; } }
  pruef(maxH <= 2, `${k}: laengster waagerechter Lauf ${maxH} <= 2 (keine Haken/T-Formen)`);
  // senkrechte Laeufe 3..9, mindestens 8 Spalten mit Glyphe
  let spalten = 0, maxV = 0, minV = 99;
  for (let x = 0; x < 16; x++) {
    let best = 0, run = 0;
    for (let y = 0; y < 32; y++) { if (g[y % 16][x] !== '.') { run++; best = Math.max(best, run); } else run = 0; }
    if (best > 0) { spalten++; maxV = Math.max(maxV, best); minV = Math.min(minV, best); }
  }
  pruef(maxV <= 9 && minV >= 3, `${k}: senkrechte Laeufe ${minV}..${maxV} (3..9)`);
  pruef(spalten >= 8, `${k}: ${spalten} Spalten mit Glyphe`);
  const deck = 256 - zensus(g)['.'];
  pruef(deck >= 30 && deck <= 70, `${k}: Deckung ${deck} Texel (${(deck / 2.56).toFixed(1)} %)`);
  // Anisotropie laengs (senkrecht / waagerecht) >= 2,0
  let sv = 0, sh = 0;
  for (let x = 0; x < 16; x++) { let run = 0; for (let y = 0; y < 16; y++) { if (g[y][x] !== '.') run++; else { if (run) { sv += run * run; } run = 0; } } if (run) sv += run * run; }
  for (let y = 0; y < 16; y++) { let run = 0; for (let x = 0; x < 16; x++) { if (g[y][x] !== '.') run++; else { if (run) { sh += run * run; } run = 0; } } if (run) sh += run * run; }
  pruef(sv / sh >= 2.0, `${k}: Anisotropie laengs ${(sv / sh).toFixed(2)} >= 2,0`);
  const glanz = [...g.join('')].filter((c) => c === '=').length;
  pruef(glanz >= 3 && glanz <= 6, `${k}: ${glanz} Kammglanz-Texel`);
  let obersteVier = 0; for (let y = 0; y < 4; y++) for (let x = 0; x < 16; x++) if (g[y][x] === '=') obersteVier++;
  pruef(obersteVier === 0, `${k}: kein '=' in den obersten 4 Zeilen`);
}
pruef(TILE_ART.water_shallow_vert.join('') !== TILE_ART.water_shallow_vert_v1.join('')
  && TILE_ART.water_shallow_vert.join('') !== TILE_ART.water_shallow_vert_v2.join('')
  && TILE_ART.water_shallow_vert_v1.join('') !== TILE_ART.water_shallow_vert_v2.join(''), 'vert-Varianten paarweise verschieden');
{
  // keine Variante ist eine blosse zyklische Verschiebung einer anderen
  const V = ['water_shallow_vert', 'water_shallow_vert_v1', 'water_shallow_vert_v2'].map((k) => TILE_ART[k]);
  let schieb = false;
  for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) for (let dx = 0; dx < 16; dx++) for (let dy = 0; dy < 16; dy++) {
    let gl = true;
    for (let y = 0; y < 16 && gl; y++) for (let x = 0; x < 16; x++) if (V[i][y][x] !== V[j][(y + dy) % 16][(x + dx) % 16]) { gl = false; break; }
    if (gl) schieb = true;
  }
  pruef(!schieb, 'keine vert-Variante ist eine blosse Verschiebung einer anderen');
}

console.log('=== H) UFER (§6.4b) =======================================');
const WT = 'wW9=';
const konturLinien = (g) => {
  let z = 0;
  for (let y = 0; y < 16; y++) if ([...g[y]].every((c) => WT.includes(c))) z++;
  for (let x = 0; x < 16; x++) { let f = true; for (let y = 0; y < 16; y++) if (!WT.includes(g[y][x])) f = false; if (f) z++; }
  return z;
};
for (const k of ['shore_n', 'shore_s', 'shore_e', 'shore_w', 'shore_diag_ne', 'shore_diag_nw', 'shore_diag_se', 'shore_diag_sw']) {
  pruef(konturLinien(TILE_ART[k]) <= 1, `${k}: ${konturLinien(TILE_ART[k])} durchgehende Wasser-Konturlinie(n) <= 1 (vorher ${konturLinien(T_ALT[k])})`);
}
const mN = mittel(TILE_ART.shore_n);
for (const k of ['shore_s', 'shore_e', 'shore_w']) {
  const d = mN - mittel(TILE_ART[k]);
  pruef(d >= 8, `${k}: Kachelmittel ${mittel(TILE_ART[k]).toFixed(2)} = ${d.toFixed(2)} L unter shore_n (${mN.toFixed(2)}), Soll >= 8`);
}
{ // Lueckenraster je Richtung verschieden: Lueckenpositionen vergleichen
  const luecken = {};
  for (const [k, dir] of [['shore_n', 'n'], ['shore_s', 's'], ['shore_e', 'e'], ['shore_w', 'w']]) {
    const g = TILE_ART[k], a = T_ALT[k]; const s = [];
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (g[y][x] === '.' && a[y][x] !== '.') s.push(dir === 'n' || dir === 's' ? x : y);
    luecken[k] = [...new Set(s)].sort((p, q) => p - q).join(',');
  }
  const werte = Object.values(luecken);
  pruef(new Set(werte).size === 4, `Lueckenraster je Richtung verschieden: ${JSON.stringify(luecken)}`);
}
for (const k of ['shore_diag_ne', 'shore_diag_nw', 'shore_diag_se', 'shore_diag_sw']) {
  const g = TILE_ART[k];
  let voll = 0; for (let x = 0; x < 16; x++) { let f = true; for (let y = 0; y < 16; y++) if (g[y][x] === '.') f = false; if (f) voll++; }
  pruef(voll <= 1, `${k}: ${voll} voll deckende Spalte(n) <= 1 (vorher 2)`);
  let a = 0, b = 0, t = 0;
  for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) { t++; if (g[y + 4][x + 4] === g[y][x]) a++; if (g[y + 4][x + 4 - 8] !== undefined && g[y][x + 4] !== undefined && g[y + 4][x] === g[y][x + 4]) b++; }
  const rep = Math.max(a, b) / t;
  pruef(rep < 0.75, `${k}: 4-Zeilen-Wiederholung ${(100 * rep).toFixed(1)} % < 75 % (vorher 88,9 %)`);
  pruef(g.join('').includes('.'), `${k}: transparente Anteile`);
  pruef([...g.join('')].some((c) => 'eEa'.includes(c)), `${k}: Landzunge vorhanden`);
  // 'n' haengt an der Landzunge (Ton-Waisen-Regel §1.6)
  const seen = Array.from({ length: 16 }, () => new Array(16).fill(false)); const st = [];
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if ('eEa'.includes(g[y][x])) st.push([x, y]);
  while (st.length) { const [cx, cy] = st.pop();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || ny < 0 || nx > 15 || ny > 15) continue;
      if (g[ny][nx] !== 'n' || seen[ny][nx]) continue; seen[ny][nx] = true; st.push([nx, ny]); } }
  let waise = 0; for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (g[y][x] === 'n' && !seen[y][x]) waise++;
  pruef(waise === 0, `${k}: keine 'n'-Waise im offenen Wasser`);
}
{
  const sx = (r) => r.map((s) => s.split('').reverse().join(''));
  pruef(TILE_ART.shore_diag_nw.join('') === sx(TILE_ART.shore_diag_ne).join(''), 'shore_diag_nw = Spiegelung von ne');
  pruef(TILE_ART.shore_diag_se.join('') === TILE_ART.shore_diag_ne.slice().reverse().join(''), 'shore_diag_se = Spiegelung von ne');
  pruef(TILE_ART.shore_diag_sw.join('') === sx(TILE_ART.shore_diag_ne.slice().reverse()).join(''), 'shore_diag_sw = Spiegelung von ne');
}

console.log('=== I) GRAS-GROESSENSTUFEN (§6.5) =========================');
for (const k of ['grass_tuft_sm', 'grass_tuft_lg', 'grass_blade_sm', 'grass_blade_lg']) {
  const g = TILE_ART[k];
  pruef(g.length === 16 && g[0].length === 16, `${k}: 16x16`);
  pruef([...g.join('')].every((c) => 'eEaKAmzp'.includes(c)), `${k}: nur Gras-/Wurzeltoene`);
  // Randregel: Glyphen enden vor der Kachelkante
  let rand = 0;
  for (let x = 0; x < 16; x++) { if (g[0][x] !== 'e') rand++; if (g[15][x] !== 'e') rand++; }
  for (let y = 0; y < 16; y++) { if (g[y][0] !== 'e') rand++; if (g[y][15] !== 'e') rand++; }
  pruef(rand === 0, `${k}: aeusserster Ring rein 'e' (${rand} Verstoesse)`);
}
const bbH = (g) => { let y0 = 99, y1 = -1, x0 = 99, x1 = -1;
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (g[y][x] !== 'e') { y0 = Math.min(y0, y); y1 = Math.max(y1, y); x0 = Math.min(x0, x); x1 = Math.max(x1, x); }
  return [x1 - x0 + 1, y1 - y0 + 1]; };
for (const [basis, sm, lg] of [['grass_tuft', 'grass_tuft_sm', 'grass_tuft_lg'], ['grass_blade', 'grass_blade_sm', 'grass_blade_lg']]) {
  const B = bbH(TILE_ART[basis]), S = bbH(TILE_ART[sm]), G = bbH(TILE_ART[lg]);
  pruef(S[0] * S[1] < B[0] * B[1] * 0.75, `${sm}: Motivflaeche ${S[0]}x${S[1]} deutlich unter Basis ${B[0]}x${B[1]}`);
  pruef(G[0] * G[1] > B[0] * B[1] * 1.25, `${lg}: Motivflaeche ${G[0]}x${G[1]} deutlich ueber Basis ${B[0]}x${B[1]}`);
}
{
  const alle = ['grass_tuft', 'grass_tuft_r1', 'grass_tuft_v1', 'grass_tuft_sm', 'grass_tuft_lg',
    'grass_blade', 'grass_blade_v1', 'grass_blade_r1', 'grass_blade_sm', 'grass_blade_lg'];
  pruef(new Set(alle.map((k) => TILE_ART[k].join(''))).size === alle.length, 'u/j-Pool: 5 + 5 paarweise verschiedene Grids');
}

console.log('=== J) FLAMMEN (§6.6) =====================================');
for (const [gruppe, keys, kernVon, kernBis, flammeBis] of [
  ['Boden', ['torch_0', 'torch_1', 'torch_2'], 5, 7, 7],
  ['Wand', ['torch_wall_0', 'torch_wall_1', 'torch_wall_2'], 3, 5, 5]]) {
  const flaechen = [];
  for (const k of keys) {
    const g = TILE_ART[k];
    // '1' ausschliesslich in den Docht-Zeilen
    let falsch = 0, kern = 0;
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (g[y][x] === '1') { if (y < kernVon || y > kernBis) falsch++; else kern++; }
    pruef(falsch === 0 && kern > 0, `${k}: Kern '1' nur in Zeilen ${kernVon}..${kernBis} (${kern} Texel, ${falsch} ausserhalb)`);
    // Silhouette <= 5 breit + Flaeche
    let flaeche = 0, maxBreit = 0;
    for (let y = 0; y <= flammeBis; y++) {
      let x0 = 99, x1 = -1;
      for (let x = 0; x < 16; x++) if ('1yor'.includes(g[y][x])) { flaeche++; x0 = Math.min(x0, x); x1 = Math.max(x1, x); }
      if (x1 >= 0) maxBreit = Math.max(maxBreit, x1 - x0 + 1);
    }
    pruef(maxBreit <= 5, `${k}: Silhouette ${maxBreit} px breit <= 5`);
    flaechen.push(flaeche);
    // Spitze (oberste 3 Flammenzeilen) o/r-dominant
    let sp = 0, spOR = 0;
    for (let y = 0; y <= 2; y++) for (let x = 0; x < 16; x++) if ('1yor'.includes(g[y][x])) { sp++; if ('or'.includes(g[y][x])) spOR++; }
    pruef(sp > 0 && spOR / sp > 0.5, `${k}: Spitze o/r-dominant (${spOR}/${sp})`);
  }
  const m = flaechen.reduce((a, b) => a + b, 0) / flaechen.length;
  const abw = Math.max(...flaechen.map((f) => Math.abs(f - m) / m));
  pruef(abw <= 0.20, `${gruppe}fackel: Flaechen ${flaechen.join('/')}, Mittel ${m.toFixed(1)}, max. Abweichung ${(100 * abw).toFixed(1)} % <= 20 %`);
  // Traeger fuer §2.6 HOT_RINGS: Bodenfackel Zeile 6, Wandfackel Zeile 4
  const hotY = gruppe === 'Boden' ? 6 : 4;
  for (const k of keys) pruef(TILE_ART[k][hotY].includes('1'), `${k}: HOT_RING-Zeile ${hotY} traegt '1'`);
  // Pfosten / Gehaeuse byte-unveraendert
  for (const k of keys) {
    const von = gruppe === 'Boden' ? 8 : 6;
    pruef(TILE_ART[k].slice(von).join('') === T_ALT[k].slice(von).join(''), `${k}: Zeilen ${von}..15 byte-unveraendert`);
  }
}

console.log('=== K) BOSS-KRATZER (§6.2) ================================');
{
  const g = TILE_ART.floor_decal_crack;
  pruef(!g.join('').includes('T'), "floor_decal_crack: kein 'T'");
  pruef(!g.join('').includes('m'), "floor_decal_crack: kein 'm'");
  const alt = T_ALT.floor_decal_crack, sf = TILE_ART.stone_floor;
  const dek = [];
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (sf[y][x] !== alt[y][x]) dek.push(g[y][x]);
  const d = dek.reduce((s, c) => s + RmB(c), 0) / dek.length;
  const boden = RmB('t');
  pruef(d - boden <= 8, `Kratzer (R-B) ${d.toFixed(1)} gegen Boden 't' ${boden} = Delta ${(d - boden).toFixed(1)} <= +8`);
  pruef(dek.every((c) => 'Lk'.includes(c)), `Kratzerpixel ausschliesslich L/k-Dither (${[...new Set(dek)].join('')})`);
  pruef(new Set(dek).size === 2, 'Kratzer ist ein echter Dither (beide Toene vorhanden)');
}

console.log('=== L) WEGSPORN (§6.3) ====================================');
{
  const g = TILE_ART.path_pebbles, p = TILE_ART.path, ps = TILE_ART.pebble_small;
  pruef(g.length === 16 && g[0].length === 16, 'path_pebbles: 16x16');
  const kies = [...g.join('')].filter((c) => 'gsSF'.includes(c)).length;
  const kiesSoll = [...ps.join('')].filter((c) => 'gsSF'.includes(c)).length;
  pruef(Math.abs(kies - kiesSoll) <= 4, `path_pebbles: ${kies} Kiesel-Texel (pebble_small ${kiesSoll})`);
  const wegTon = [...g.join('')].filter((c) => 'MVPvz'.includes(c)).length;
  pruef(wegTon > 200, `path_pebbles: ${wegTon} Weg-Texel (Grundton wie 'path')`);
  pruef([...g.join('')].every((c) => 'MVPvzgsSF'.includes(c)), 'path_pebbles: nur Weg- und Stein-Toene');
  pruef(!g.join('').includes('.'), 'path_pebbles: vollflaechig opak wie path');
  pruef(g.join('') !== p.join(''), 'path_pebbles != path');
}

console.log('=== M) KRONEN-SCHATTEN (§5.3) =============================');
{
  const BAY = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  const g = TILE_ART.canopy_shadow;
  pruef([...g.join('')].every((c) => '.n0'.includes(c)), "canopy_shadow: nur 'n'/'0'");
  let ausserhalb = 0, texel = 0;
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (g[y][x] !== '.') { texel++; if (BAY[y & 3][x & 3] >= 4) ausserhalb++; }
  pruef(ausserhalb === 0, `canopy_shadow: alle ${texel} Texel im Bayer-25-%-Raster`);
  pruef(texel >= 40 && texel <= 64, `canopy_shadow: ${texel} Texel (Bestand 214 = 50-%-Schachbrett)`);
  pruef(g[15] === '................', 'canopy_shadow: Zeile 15 frei');
}
for (const [k, w] of [['canopy_shadow_xl_a', 48], ['canopy_shadow_xl_b', 64], ['canopy_shadow_xl_c', 48]]) {
  const g = TILE_ART[k];
  pruef(g.length === 32 && g[0].length === w, `${k}: Maß EXAKT ${w}x32`);
  pruef([...g.join('')].every((c) => '.n0'.includes(c)), `${k}: nur 'n'/'0' (kein 'k')`);
}

console.log('=== N) XL-KRONEN (§5.1/§5.2, M4) ==========================');
const XLK = ['xl_a', 'xl_b', 'xl_c'];
const MASS = { xl_a: [48, 32], xl_b: [64, 48], xl_c: [48, 32] };
const SOLLBBOX = { xl_a: [40, 28], xl_b: [56, 40], xl_c: [40, 28] };
const bbox = (g) => { let x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1;
  for (let y = 0; y < g.length; y++) for (let x = 0; x < g[y].length; x++) if (g[y][x] !== '.') { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  return [x1 - x0 + 1, y1 - y0 + 1]; };
let gross = 0, sehrGross = 0;
for (const n of XLK) {
  for (const sp of ['', '_m']) {
    const basis = `tree_canopy_${n}${sp}`, g = TILE_ART[basis];
    pruef(!!g, `${basis} existiert`);
    pruef(g.length === MASS[n][1] && g.every((r) => r.length === MASS[n][0]), `${basis}: Maß ${MASS[n][0]}x${MASS[n][1]}`);
    const bb = bbox(g);
    pruef(bb[0] >= SOLLBBOX[n][0] && bb[1] >= SOLLBBOX[n][1], `${basis}: Tinten-Bbox ${bb[0]}x${bb[1]} >= ${SOLLBBOX[n].join('x')}`);
    if (bb[0] >= 40 && bb[1] >= 28) gross++;
    if (bb[0] >= 56 && bb[1] >= 40) sehrGross++;
    const z = zensus(g);
    pruef(Object.keys(z).every((c) => '.0EamKAn'.includes(c)), `${basis}: nur Bestandstoene ${Object.keys(z).join('')}`);
    pruef(!z.k, `${basis}: kein 'k' (L<16-Budget)`);
    pruef((z.n || 0) > 0, `${basis}: 'n'-Naehte vorhanden`);
    pruef((z.A || 0) >= 8, `${basis}: Spitzlicht 'A' ${z.A}`);
    pruef((z['0'] || 0) >= 30, `${basis}: '0'-Konturensaum ${z['0']}`);
    // POSEN-INVARIANTEN
    for (const s of ['_r1', '_r2', '_l1', '_l2']) {
      const p = TILE_ART[basis + s];
      pruef(!!p, `${basis}${s} existiert`);
      pruef(p.length === g.length && p.every((r) => r.length === g[0].length), `${basis}${s}: Maß gleich`);
      pruef(p[p.length - 1] === g[g.length - 1], `${basis}${s}: UNTERKANTE byte-identisch zur Basis`);
      pruef(p.join('') !== g.join(''), `${basis}${s}: echte Scherung (!= Basis)`);
      pruef([...p.join('')].every((c) => '.0EamKAn'.includes(c)), `${basis}${s}: nur Bestandstoene`);
    }
  }
  const a = TILE_ART[`tree_canopy_${n}`], b = TILE_ART[`tree_canopy_${n}_m`];
  pruef(b.join('') === a.map((r) => r.split('').reverse().join('')).join(''), `tree_canopy_${n}_m ist exakte Spiegelung`);
  // Silhouette fest: keine Sporen
  const voll = (g, x, y) => x >= 0 && y >= 0 && y < g.length && x < g[0].length && g[y][x] !== '.';
  let z = 0;
  for (let y = 0; y < a.length; y++) for (let x = 0; x < a[0].length; x++) {
    if (!voll(a, x, y)) continue;
    if ([[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => voll(a, x + dx, y + dy)).length <= 1) z++;
  }
  pruef(z <= 2, `tree_canopy_${n}: Silhouette spornfrei (${z} Einzel-Zacken)`);
  let alauf = 0; for (const r of a) { let run = 0; for (const c of r) { if (c === 'A') { run++; alauf = Math.max(alauf, run); } else run = 0; } }
  pruef(alauf >= 4, `tree_canopy_${n}: Spitzlicht-Kappe ${alauf} px zusammenhaengend >= 4`);
  pruef(Math.abs(mittel(a) - mittel(TILE_ART.tree_canopy_2x2_a)) < 6,
    `tree_canopy_${n}: Kachelmittel ${mittel(a).toFixed(1)} ~ Bestandskrone ${mittel(TILE_ART.tree_canopy_2x2_a).toFixed(1)}`);
}
pruef(gross >= 3, `M4-Art: ${gross} Kronen-Keys mit Bbox >= 40x28 (>= 3)`);
pruef(sehrGross >= 1, `M4-Art: ${sehrGross} Key(s) mit Bbox >= 56x40 (>= 1)`);

console.log('\n=========================================================');
console.log(fail ? `${fail} ROT von ${fail + ok} Pruefungen` : `ALLE ${ok} PRUEFUNGEN GRUEN`);
process.exit(fail ? 1 : 0);
