// GP6 Phase 2 — SELBSTPRUEFUNG ENGINE-B (headless durch main.js).
// Kein Test der kanonischen Suiten, reines Arbeitswerkzeug in .tmp/.
// Muster: .tmp/check_main_slice1.mjs (Stub-DOM + Frame-Treiber).

import { SPRITES, TILE_ART } from '../game/js/art/sprites.js';
import { PALETTE } from '../game/js/art/palette.js';
import { buildTintMask } from '../game/js/core/sprite_factory.js';

let fails = 0;
const check = (name, ok, info = '') => {
  if (!ok) fails++;
  console.log(`  ${ok ? 'ok ' : 'ROT'}  ${name}${info ? ' — ' + info : ''}`);
};

Math.random = () => 0.5;

const ops = [];
const createdCanvases = [];

function makeCtx(canvas) {
  return {
    canvas,
    imageSmoothingEnabled: false,
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    fillStyle: '', strokeStyle: '', lineWidth: 1,
    font: '', textAlign: '', textBaseline: '',
    _stack: [],
    fillRect(...a) { ops.push({ canvas, op: 'fillRect', alpha: this.globalAlpha, fillStyle: this.fillStyle, args: a }); },
    clearRect() {},
    drawImage(img, ...a) { ops.push({ canvas, op: 'drawImage', img, alpha: this.globalAlpha, gco: this.globalCompositeOperation, args: a }); },
    fillText(text, x, y) { ops.push({ canvas, op: 'fillText', text, x, y }); },
    beginPath() {}, arc() {}, fill() {}, stroke() {}, strokeRect() {},
    translate() {}, rotate() {},
    save() { this._stack.push({ a: this.globalAlpha, f: this.fillStyle, c: this.globalCompositeOperation }); },
    restore() {
      const s = this._stack.pop();
      if (s) { this.globalAlpha = s.a; this.fillStyle = s.f; this.globalCompositeOperation = s.c; }
    },
    createRadialGradient: () => ({ addColorStop() {} }),
  };
}
function makeCanvas() {
  const c = { width: 0, height: 0, style: {}, ownerDocument: null };
  c.getContext = () => (c._ctx || (c._ctx = makeCtx(c)));
  c.addEventListener = () => {};
  c.getBoundingClientRect = () => ({ left: 0, top: 0, width: 320, height: 180 });
  createdCanvases.push(c);
  return c;
}
const winListeners = {};
const rafQ = [];
const fakeWindow = {
  addEventListener: (t, f) => (winListeners[t] = winListeners[t] || []).push(f),
  devicePixelRatio: 1, innerWidth: 960, innerHeight: 540,
  location: { search: process.env.GP6_MAP ? `?map=${process.env.GP6_MAP}` : '' },
  requestAnimationFrame: (cb) => rafQ.push(cb),
};
const mainCanvas = { width: 320, height: 180, style: {} };
const fakeDocument = {
  getElementById: () => mainCanvas,
  createElement: () => makeCanvas(),
  addEventListener: () => {},
  defaultView: fakeWindow,
  hidden: false,
};
mainCanvas.getContext = () => (mainCanvas._ctx || (mainCanvas._ctx = makeCtx(mainCanvas)));
mainCanvas.addEventListener = () => {};
mainCanvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 320, height: 180 });
mainCanvas.ownerDocument = fakeDocument;
globalThis.window = fakeWindow;
globalThis.document = fakeDocument;
let fakeTime = 0;
try { globalThis.performance = { now: () => fakeTime }; }
catch { Object.defineProperty(globalThis, 'performance', { value: { now: () => fakeTime } }); }

await import('../game/js/main.js');

const boot = createdCanvases.length;
const orderedNames = [...Object.keys(SPRITES)];
const nameOf = new Map();
createdCanvases.forEach((c, i) => nameOf.set(c, orderedNames[i]));

function frame() {
  ops.length = 0;
  const cb = rafQ.shift();
  if (!cb) throw new Error('kein rAF-Callback');
  fakeTime += 1000 / 60;
  cb();
}
function frames(n) { for (let i = 0; i < n; i++) frame(); }
function key(type, code) { for (const f of winListeners[type] || []) f({ code, repeat: false, preventDefault() {} }); }

console.log('== GP6 Phase 2 Selbstpruefung ENGINE-B ==');

// Titel verlassen
frame();
key('keydown', 'Enter'); frame(); key('keyup', 'Enter');
frames(6);

const mainOps = () => ops.filter((o) => o.canvas === mainCanvas);

// --- 1. §4.2 Fassade: Original zuerst, dann Masken -------------------------
{
  const d = mainOps().filter((o) => o.op === 'drawImage');
  const playerIdx = d.findIndex((o) => String(nameOf.get(o.img) || '').startsWith('player_'));
  check('§4.2 Spieler-Sprite wird gezeichnet', playerIdx >= 0);
  const orig = d[playerIdx];
  check('§0.5 Waechter B: erster Draw des Spielers ist das ORIGINAL-gfx-Canvas',
    !!orig && orig.alpha === 1 && orig.gco === 'source-over', orig ? nameOf.get(orig.img) : '-');
  // Masken direkt danach: unbenannte Canvases mit identischem Maß + gleichen Args
  // Nach dem Boot entstehen ausser den Masken noch das Lighting-Offscreen und
  // die Vignette (beide 320x180) — die schliesst die Breitengrenze aus.
  const istMaske = (img) => createdCanvases.indexOf(img) >= boot && img.width > 0 && img.width < 320;
  // Der SPIELER traegt seine eigene Laterne (playerLight r=40): am Abtastpunkt
  // ist rest = 0 -> f = 1 -> Dunkelstufe 0 -> KEINE Kalt-Tinte. Physikalisch
  // richtig (er steht immer im eigenen Licht) und deshalb KEIN Fehler. Geprueft
  // wird die Fassade daher an ALLEN Masken-Draws des Frames.
  const masken = d.filter((o) => istMaske(o.img));
  // BOSS_KAMMER ist der dokumentierte Sonderfall: das §5.D4-Fuell-Licht (r 88,
  // Arena-Mitte) plus die Spieler-Laterne setzen an JEDEM Abtastpunkt rest = 0,
  // also f = 1 -> Dunkelstufe 0 -> keine Kalt-Tinte; und keine der sechs
  // Wandfackeln erreicht die Arena-Mitte -> warm = 0. Dort ist 0 korrekt.
  const bossArena = process.env.GP6_MAP === 'BOSS_KAMMER';
  check('§4.2 es gibt Masken-Draws im Frame (BOSS_KAMMER: 0 ist korrekt, s. Kommentar)',
    masken.length > 0 || bossArena, `${masken.length} Draws`);
  let paarOk = masken.length > 0 || bossArena;
  for (const mk of masken) {
    const i = d.indexOf(mk);
    // rueckwaerts bis zum ersten NICHT-Masken-Draw = das Original
    let j = i - 1;
    while (j >= 0 && istMaske(d[j].img)) j--;
    const org = d[j];
    // org muss ein BOOT-Canvas sein (gfx-Original oder _flip; die _flip-Namen
    // liegen ausserhalb von orderedNames, deshalb Index statt Name pruefen).
    if (!org || createdCanvases.indexOf(org.img) >= boot ||
      JSON.stringify(org.args) !== JSON.stringify(mk.args) ||
      org.img.width !== mk.img.width || org.img.height !== mk.img.height ||
      org.alpha !== 1) paarOk = false;
  }
  check('§0.5 Waechter B: JEDEM Masken-Draw geht das ORIGINAL-gfx-Canvas mit identischer Geometrie voraus',
    paarOk);
  check('§4.2 Masken laufen source-over (KEIN lighter)', masken.every((o) => o.gco === 'source-over'));
  const ERL = new Set([0.12, 0.24, 0.36, 0.08, 0.16]);
  check('§4.2 Masken-Alpha liegt auf den Spec-Stufen {0,12/0,24/0,36} bzw. {0,08/0,16}',
    masken.every((o) => ERL.has(Number(o.alpha.toFixed(4)))),
    [...new Set(masken.map((o) => o.alpha))].join(','));
  check('§4.2 nach dem letzten Masken-Draw steht globalAlpha wieder auf 1',
    mainCanvas._ctx.globalAlpha === 1 && mainCanvas._ctx.globalCompositeOperation === 'source-over');
  // Masken sind erst NACH dem Boot entstanden (§0.2 "neue Canvases nach main.js:71")
  check('§0.2 Masken-Canvases entstehen lazy NACH dem gfx/tiles-Bau',
    createdCanvases.length > boot, `boot ${boot} -> jetzt ${createdCanvases.length}`);
}

// --- 2. §0.2 Detektor: kein Teilalpha-fillRect auf einem Offscreen VOR lighting
{
  const offAlpha = ops.filter((o) => o.op === 'fillRect' && o.canvas !== mainCanvas && o.alpha > 0 && o.alpha < 1);
  check('§0.2 genau EIN Teilalpha-fillRect auf Nicht-Main-Canvas (der Ambient-Fill)',
    offAlpha.length === 1, `gefunden ${offAlpha.length}`);
}

// --- 3. §4.3 Kontaktschatten: 4 Zeilen, unterste UNTER der Fusskante --------
{
  const rects = mainOps().filter((o) => o.op === 'fillRect' && o.fillStyle === '#000' && o.args[3] === 1);
  const alphas = [...new Set(rects.map((o) => Number(o.alpha.toFixed(2))))].sort((a, b) => a - b);
  check('§4.3 Schatten-Alphas enthalten das neue Standardprofil 0,30/0,40/0,20/0,10',
    [0.3, 0.4, 0.2, 0.1].every((a) => alphas.includes(a)), alphas.join(','));
  // Spieler: w = 12 -> Breiten round(12*0.90/0.95/0.7/0.4) = 11/11/8/5
  const breiten = rects.filter((o) => [11, 8, 5].includes(o.args[2])).map((o) => o.args[2]);
  check('§4.3 Spieler-Schatten traegt die Breiten 11/11/8/5', breiten.length >= 4, breiten.join(','));
}

// --- 4. §6.7b HUD: zwei Deckrechtecke + Pixelziffern -----------------------
{
  const hell = mainOps().find((o) => o.op === 'fillRect' && o.fillStyle === '#10101c' && o.args[0] === 25);
  // y14 statt y15: die Ziffern-Glyphe ragt eine AA-Zeile ueber textBaseline 'top'
  const dunkel = mainOps().find((o) => o.op === 'fillRect' && o.fillStyle === '#0a0a12' && o.args[0] === 25);
  check('§6.7b Deckrechteck 1 (helles Panelband) x25 y14 29x2',
    !!hell && JSON.stringify(hell.args) === JSON.stringify([25, 14, 29, 2]), hell ? hell.args.join(',') : '-');
  check('§6.7b Deckrechteck 2 (dunkles Panelband) x25 y16 29x20',
    !!dunkel && JSON.stringify(dunkel.args) === JSON.stringify([25, 16, 29, 20]), dunkel ? dunkel.args.join(',') : '-');
  const gold = mainOps().filter((o) => o.op === 'fillRect' && o.fillStyle === '#f0bf4e' && o.args[2] === 1 && o.args[3] === 1);
  check('§6.7b GOLD-Pixelziffern als 1x1-fillRects vorhanden', gold.length > 0, `${gold.length} Texel`);
  const goldText = ops.filter((o) => o.op === 'fillText' && String(o.text).startsWith('GOLD'));
  check('§6.7b BEIDE GOLD-fillText-Zuege bleiben unveraendert (Test-Sonde)', goldText.length === 2,
    `${goldText.length} Zuege`);
  const potText = ops.filter((o) => o.op === 'fillText' && String(o.text).startsWith('x '));
  check('§6.7b Trank-fillText-Zug bleibt unveraendert', potText.length === 1);
  const xp = mainOps().filter((o) => o.op === 'fillRect' && ['#8fb85c', '#6d9645', '#4e7030', '#131e0d'].includes(o.fillStyle));
  check('§6.7a XP-Leiste zeichnet Moosgruen-Rinne + Rampe', xp.length >= 1, `${xp.length} Zuege`);
}

// --- 5. §2.6 Fackel-Wand-Flag ---------------------------------------------
{
  const { MAPS } = await import('../game/js/world/maps.js');
  const { createTilemap } = await import('../game/js/world/tilemap.js');
  const wallInfo = {};
  for (const k of Object.keys(MAPS)) {
    const m = MAPS[k];
    const tm = createTilemap(m.rows, m.legend, m.overRows || null);
    const arts = m.torchChars.map((ch) => (m.legend[ch] && m.legend[ch].art) || '');
    wallInfo[k] = { arts, n: m.torchChars.flatMap((ch) => tm.findTiles(ch)).length };
  }
  check('§2.6 GRAVEYARD-Fackeln sind BODENfackeln (torch_0, kein wall-Flag)',
    wallInfo.GRAVEYARD.arts.every((a) => !a.startsWith('torch_wall')), wallInfo.GRAVEYARD.arts.join(','));
  check('§2.6 CATACOMBS/FLUESTERGRUFT/BOSS_KAMMER sind WANDfackeln (torch_wall_*)',
    ['CATACOMBS', 'FLUESTERGRUFT', 'BOSS_KAMMER'].every((k) => wallInfo[k].arts.every((a) => a.startsWith('torch_wall'))));
}

// --- 6. buildTintMask: Alpha-Form + Spalten-Rampe --------------------------
{
  const grid = SPRITES.player_down_0;
  const m = buildTintMask(grid, PALETTE, '#b05822', '#d8722a', 'L');
  const texel = ops.filter((o) => o.canvas === m && o.op === 'fillRect');
  const soll = grid.join('').split('').filter((c) => c !== '.').length;
  check('§4.2 buildTintMask: identische Alpha-Form (Texelzahl == Nicht-Punkt-Zeichen)',
    texel.length === soll, `${texel.length} vs ${soll}`);
  check('§4.2 buildTintMask: alle fillRects bei globalAlpha === 1 (§0.2)',
    texel.every((o) => o.alpha === 1));
  const w = grid[0].length;
  const links = texel.filter((o) => o.args[0] < w / 2);
  const rechts = texel.filter((o) => o.args[0] >= w / 2);
  check("§4.2 buildTintMask 'L': linke Haelfte hell, rechte dunkel",
    links.every((o) => o.fillStyle === '#d8722a') && rechts.every((o) => o.fillStyle === '#b05822'));
  ops.length = 0;
  const mR = buildTintMask(grid, PALETTE, '#b05822', '#d8722a', 'R');
  const tR = ops.filter((o) => o.canvas === mR && o.op === 'fillRect');
  check("§4.2 buildTintMask 'R': Rampe gespiegelt",
    tR.filter((o) => o.args[0] >= w / 2).every((o) => o.fillStyle === '#d8722a'));
  check('§4.2 buildTintMask: Maszgleichheit mit dem Sprite', m.width === w && m.height === grid.length);
}

// --- 7. window.__noTint schaltet die Masken ab -----------------------------
{
  fakeWindow.__noTint = true;
  frames(2);
  const d = mainOps().filter((o) => o.op === 'drawImage');
  const unbenannt = d.filter((o) => createdCanvases.indexOf(o.img) >= boot && o.img.width > 0 && o.img.width < 320);
  check('M3-Kontrolle: __noTint = true -> keine Masken-Draws mehr', unbenannt.length === 0,
    `${unbenannt.length} Rest-Draws`);
  fakeWindow.__noTint = false;
  frames(2);
}

console.log(fails === 0 ? '\nSELBSTPRUEFUNG GRUEN' : `\nSELBSTPRUEFUNG ROT — ${fails} Fehler`);
process.exit(fails === 0 ? 0 : 1);
