// E-A6 / E-A4 — PHANTOM-DECAL- UND DORF-SONDE.
// Reise: Kampfkarte GRAVEYARD MIT KILL -> Westtor tileRect(1,12) -> DORF.
// Gate: in DORF wird NULL Decal gezeichnet (das S6-Gate smoke:6612 ist
// praefixgebunden, 'skeleton_decal' wuerde es treffen).
// Zusaetzlich: Kartenwechsel und Respawn duerfen KEIN neues Decal erzeugen.
// Gesteuert wird ueber WELTKOORDINATEN aus der __SPUR-Sonde, nicht ueber das
// gezeichnete Bild (sonst steuerte der Umbau die Sonde mit).
import fs from 'node:fs';
import path from 'node:path';

const HIER = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const RIG = 'check_main_slice1';

const PROBE = `
globalThis.__SPUR = [];
const SIGNAL_GRENZE = Object.keys(SPRITES).length + 37 + Object.keys(TILE_ART).length;
const signalSet = new Set(createdCanvases.slice(SIGNAL_GRENZE));
const DECAL_RE = /_decal$/;
const log = [];
let spurVor = 0;
function zustand() {
  const z = globalThis.__SPUR[globalThis.__SPUR.length - 1];
  if (!z) return null;
  const kopf = z.split(' | ')[0].split(' ');
  const gt = z.split(' | ')[1] || '';
  const pf = kopf[3].split(',');
  return {
    map: kopf[0], state: kopf[1],
    px: parseFloat(pf[0]), py: parseFloat(pf[1]), php: parseInt(pf[2], 10), pstate: pf[3],
    gegner: gt.trim() ? gt.trim().split(' ').map((g) => {
      const [kind, r] = g.split(':'); const f = r.split(',');
      return { kind, x: parseFloat(f[0]), y: parseFloat(f[1]), hp: parseInt(f[2], 10), state: f[3] };
    }) : [],
  };
}
function decalsJetzt() {
  return ops.filter((o) => o.op === 'drawImage' && o.canvas === mainCanvas
    && DECAL_RE.test(String(nameOf.get(o.img) || ''))).length;
}
function schritt() {
  frame();
  const z = zustand();
  log.push({ f: log.length + 1, map: z ? z.map : '-', state: z ? z.state : '-',
    decals: decalsJetzt(), gegner: z ? z.gegner.length : -1,
    signal: ops.filter((o) => o.op === 'drawImage' && signalSet.has(o.img)).length });
  return z;
}
function gehZu(tx, ty, budget) {
  let z = zustand();
  for (let i = 0; i < budget; i++) {
    z = zustand();
    if (!z) { schritt(); continue; }
    const cx = z.px + 6; const cy = z.py + 6;
    const dx = tx - cx; const dy = ty - cy;
    if (Math.abs(dx) < 3 && Math.abs(dy) < 3) return true;
    const code = Math.abs(dx) >= Math.abs(dy)
      ? (dx > 0 ? 'ArrowRight' : 'ArrowLeft')
      : (dy > 0 ? 'ArrowDown' : 'ArrowUp');
    key('keydown', code); schritt(); key('keyup', code);
  }
  return false;
}
// --- 1) Titel -> Spiel ------------------------------------------------------
schritt(); schritt();
key('keydown', 'Enter'); key('keyup', 'Enter');
for (let i = 0; i < 4; i++) schritt();

// --- 2) EINEN Gegner toeten (Weltkoordinaten-Steuerung) --------------------
let z = zustand();
const start = z.gegner.length;
let getoetet = false;
for (let runde = 0; runde < 60 && !getoetet; runde++) {
  z = zustand();
  const lebende = z.gegner.filter((g) => g.state !== 'die');
  if (!lebende.length) break;
  let best = lebende[0]; let bd = Infinity;
  for (const g of lebende) {
    const d = Math.hypot(g.x - z.px, g.y - z.py);
    if (d < bd) { bd = d; best = g; }
  }
  gehZu(best.x + 8, best.y + 8, 400);
  key('keydown', 'KeyJ'); schritt(); key('keyup', 'KeyJ');
  for (let i = 0; i < 14; i++) schritt();
  const z2 = zustand();
  if (z2.gegner.length < start || z2.gegner.some((g) => g.state === 'die')) getoetet = true;
}
for (let i = 0; i < 40; i++) schritt();   // Sterbephase abwarten -> Decal entsteht
const nachKill = log[log.length - 1].decals;

// --- 3) Westtor tileRect(1,12) -> DORF -------------------------------------
const vorReise = log.length;
gehZu(24, 200, 1500);
for (let i = 0; i < 120; i++) schritt();  // Fade + Aufbau
const inDorf = log.slice(vorReise).filter((r) => r.map === 'DORF');
const dorfDecals = inDorf.reduce((a, r) => a + r.decals, 0);

require_fs.writeFileSync(process.env.PROBE_OUT, JSON.stringify({
  gegnerStart: start, getoetet, decalsNachKill: nachKill,
  frames: log.length, dorfFrames: inDorf.length, dorfDecals,
  karten: [...new Set(log.map((r) => r.map))],
  decalsProKarte: log.reduce((acc, r) => { acc[r.map] = Math.max(acc[r.map] || 0, r.decals); return acc; }, {}),
  verlauf: log,
}, null, 1));
console.error('DORF-SONDE: Kill=' + getoetet + ' Decals nach Kill=' + nachKill
  + ' | DORF-Frames=' + inDorf.length + ' DORF-Decal-Draws=' + dorfDecals
  + ' | Karten=' + [...new Set(log.map((r) => r.map))].join(','));
`;

for (const zone of ['spur_nachher']) {
  const p = path.join(HIER, zone, '.tmp', `${RIG}.mjs`);
  let s = fs.readFileSync(p, 'utf8');
  s = s.replace("drawImage(img, ...a) { ops.push({ canvas, op: 'drawImage', img, args: a }); },",
    "drawImage(img, ...a) { ops.push({ canvas, op: 'drawImage', img, args: a, alpha: this.globalAlpha }); },");
  // ?god=1: die Sonde soll die Reise ueberleben; der Decal-Pfad ist davon
  // unberuehrt (godBoost wirkt nur auf Spieler-Stats und Schadensnahme).
  s = s.replace("  location: { search: '' },", "  location: { search: '?god=1' },");
  // Der GOTT-Hinweis im HUD zeichnet ein strokeRect; der Bestands-Stub kennt
  // es nicht (er faehrt ohne ?god=1). Rein additive Sonden-Ergaenzung.
  s = s.replace("    beginPath() {}, arc() {}, fill() {}, stroke() {},",
    "    beginPath() {}, arc() {}, fill() {}, stroke() {}, strokeRect() {}, closePath() {}, moveTo() {}, lineTo() {}, rect() {}, translate() {}, scale() {}, rotate() {}, setTransform() {}, measureText: () => ({ width: 0 }),");
  const ende = s.indexOf('function hold(code, n)');
  fs.writeFileSync(path.join(HIER, zone, '.tmp', `dorf_${RIG}.mjs`),
    `import require_fs from 'node:fs';\n${s.slice(0, ende)}${PROBE}`);
}
console.log('DORF-Sonde gebaut.');
