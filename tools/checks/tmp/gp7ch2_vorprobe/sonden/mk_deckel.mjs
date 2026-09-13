// §5(5) DECKEL-SONDE: nacheinander mehrere Gegner toeten und pruefen, dass die
// Decal-Liste nie ueber DECAL_MAX waechst (Deckel in der Sonden-Zone auf 2
// gesetzt, damit vier Kills reichen; im Patch steht 24).
import fs from 'node:fs';
import path from 'node:path';
const HIER = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const PROBE = `
globalThis.__SPUR = [];
const DECAL_RE = /_decal$/;
function zustand() {
  const z = globalThis.__SPUR[globalThis.__SPUR.length - 1];
  if (!z) return null;
  const kopf = z.split(' | ')[0].split(' ');
  const gt = z.split(' | ')[1] || '';
  const pf = kopf[3].split(',');
  return { map: kopf[0], px: parseFloat(pf[0]), py: parseFloat(pf[1]),
    gegner: gt.trim() ? gt.trim().split(' ').map((g) => {
      const [kind, r] = g.split(':'); const f = r.split(',');
      return { kind, x: parseFloat(f[0]), y: parseFloat(f[1]), hp: parseInt(f[2], 10), state: f[3] };
    }) : [] };
}
const decalsJetzt = () => ops.filter((o) => o.op === 'drawImage' && o.canvas === mainCanvas
  && DECAL_RE.test(String(nameOf.get(o.img) || ''))).length;
function gehZu(tx, ty, budget) {
  for (let i = 0; i < budget; i++) {
    const z = zustand();
    if (!z) { frame(); continue; }
    const dx = tx - (z.px + 6); const dy = ty - (z.py + 6);
    if (Math.abs(dx) < 3 && Math.abs(dy) < 3) return true;
    const code = Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'ArrowRight' : 'ArrowLeft') : (dy > 0 ? 'ArrowDown' : 'ArrowUp');
    key('keydown', code); frame(); key('keyup', code);
  }
  return false;
}
frame(); frame();
key('keydown', 'Enter'); key('keyup', 'Enter');
for (let i = 0; i < 4; i++) frame();
const verlauf = [];
for (let kill = 0; kill < 5; kill++) {
  const z = zustand();
  const lebende = z.gegner.filter((g) => g.state !== 'die');
  if (!lebende.length) break;
  let best = lebende[0]; let bd = Infinity;
  for (const g of lebende) { const d = Math.hypot(g.x - z.px, g.y - z.py); if (d < bd) { bd = d; best = g; } }
  let tot = false;
  for (let v = 0; v < 25 && !tot; v++) {
    gehZu(best.x + 8, best.y + 8, 250);
    key('keydown', 'KeyJ'); frame(); key('keyup', 'KeyJ');
    for (let i = 0; i < 12; i++) frame();
    const z2 = zustand();
    tot = !z2.gegner.some((g) => g.kind === best.kind && Math.abs(g.x - best.x) < 40 && g.state !== 'die' && g.hp > 0)
      || z2.gegner.length < z.gegner.length;
    const nb = z2.gegner.filter((g) => g.state !== 'die');
    if (nb.length) { let b2 = nb[0]; let d2 = Infinity; for (const g of nb) { const d = Math.hypot(g.x - z2.px, g.y - z2.py); if (d < d2) { d2 = d; b2 = g; } } best = b2; }
  }
  for (let i = 0; i < 40; i++) frame();
  verlauf.push({ kill: kill + 1, decals: decalsJetzt(), gegnerUebrig: zustand().gegner.length });
}
console.error('DECKEL-SONDE (DECAL_MAX=' + globalThis.__DECAL_MAX + '): '
  + verlauf.map((v) => 'nach Kill ' + v.kill + ': ' + v.decals + ' Decals').join(' | '));
require_fs.writeFileSync(process.env.PROBE_OUT, JSON.stringify(verlauf));
`;
const p = path.join(HIER, 'spur_deckel', '.tmp', 'check_main_slice1.mjs');
let s = fs.readFileSync(p, 'utf8');
s = s.replace("drawImage(img, ...a) { ops.push({ canvas, op: 'drawImage', img, args: a }); },",
  "drawImage(img, ...a) { ops.push({ canvas, op: 'drawImage', img, args: a, alpha: this.globalAlpha }); },");
s = s.replace("  location: { search: '' },", "  location: { search: '?god=1' },");
s = s.replace("    beginPath() {}, arc() {}, fill() {}, stroke() {},",
  "    beginPath() {}, arc() {}, fill() {}, stroke() {}, strokeRect() {}, closePath() {}, moveTo() {}, lineTo() {}, rect() {}, translate() {}, scale() {}, rotate() {}, setTransform() {}, measureText: () => ({ width: 0 }),");
const ende = s.indexOf('function hold(code, n)');
fs.writeFileSync(path.join(HIER, 'spur_deckel', '.tmp', 'deckel.mjs'),
  `import require_fs from 'node:fs';\nglobalThis.__DECAL_MAX = Number(process.env.DECAL_MAX || 2);\n${s.slice(0, ende)}${PROBE}`);
console.log('Deckel-Sonde gebaut.');
