// Wegwerf-Probe GOD-MODE (headless durch main.js). Stub-Muster 1:1 aus
// check_main_slice1.mjs uebernommen, aber KEINE Testdatei angefasst.
// Aufruf:  node .tmp/probe_god.mjs "?god=1"   /   node .tmp/probe_god.mjs ""
// Szenario: Titel -> Enter -> 900 Frames stur nach Osten laufen (mitten in die
// Skelette), OHNE zu kaempfen. Mit ?god=1 muessen 3 volle Herzen stehen bleiben
// und kein GAME OVER kommen; ohne Parameter muss Schaden ankommen.

import { createPlayer } from '../game/js/entities/player.js';

const SEARCH = process.argv[2] ?? '';

let bad = 0;
function ok(cond, msg) {
  if (cond) console.log(`  ok  ${msg}`);
  else { console.error(`  FEHLER: ${msg}`); bad = 1; }
}

// --- Unit-Ebene: player.js direkt ------------------------------------------
{
  const normal = createPlayer({ x: 100, y: 100 });
  const god = createPlayer({ x: 100, y: 100 }, { god: true });
  ok(normal.stats.dmg === 1 && normal.stats.speed === 90 && normal.god === false,
    `ohne Flag unveraendert (dmg ${normal.stats.dmg}, speed ${normal.stats.speed}, god ${normal.god})`);
  ok(god.stats.dmg === 10, `GOD dmg x10 (ist ${god.stats.dmg})`);
  ok(god.stats.speed === 126, `GOD speed x1,4 (ist ${god.stats.speed})`);
  ok(god.hurt(2, 0, 0) === false && god.hp === god.maxHp,
    `GOD hurt() ignoriert Schaden (hp ${god.hp}/${god.maxHp})`);
  ok(normal.hurt(2, 0, 0) === true && normal.hp === normal.maxHp - 2,
    `ohne Flag trifft hurt() normal (hp ${normal.hp}/${normal.maxHp})`);
  god.recalcStats();
  ok(god.stats.dmg === 10 && god.stats.speed === 126, 'GOD-Boost ueberlebt recalcStats');
}

// --- Stubs (aus check_main_slice1.mjs) --------------------------------------
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
    drawImage(img, ...a) { ops.push({ canvas, op: 'drawImage', img, args: a }); },
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
  devicePixelRatio: 1,
  innerWidth: 960,
  innerHeight: 540,
  location: { search: SEARCH },
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

function frame() {
  ops.length = 0;
  const cb = rafQ.shift();
  if (!cb) throw new Error('kein rAF-Callback');
  fakeTime += 1000 / 60;
  cb();
}
function frames(n) { for (let i = 0; i < n; i++) frame(); }
function key(type, code) {
  for (const f of winListeners[type] || []) f({ code, repeat: false, preventDefault() {} });
}
const texts = () => ops.filter((o) => o.op === 'fillText').map((o) => String(o.text));
const hasText = (t) => texts().some((s) => s.includes(t));
const goldText = () => texts().find((s) => s.startsWith('GOLD'));
// GOTT wird wie der GOLD-Text ZWEIMAL gezogen (1-px-Kontur + Goldton).
const gottText = () => texts().filter((s) => s === 'GOTT').length;

// Herzen zaehlen: Sprite-Namen ueber die Erzeugungsreihenfolge (Muster
// check_main_slice1). heart_full/heart_empty werden ohne Zuschnitt gezeichnet.
const { SPRITES, TILE_ART } = await import('../game/js/art/sprites.js');
const FLIP_LIST = [
  'player_side_0', 'player_side_1', 'player_side_2', 'player_side_3',
  'player_attack_side', 'sword_slash_side',
  'skeleton_0', 'skeleton_1', 'skeleton_die',
  'ghoul_0', 'ghoul_1', 'ghoul_die',
  'hound_0', 'hound_1', 'hound_telegraph', 'hound_leap', 'hound_down', 'hound_die',
  'rust_0', 'rust_1', 'rust_die', 'shield_side',
  'warden_idle', 'warden_walk_0', 'warden_walk_1', 'warden_windup_a',
  'warden_windup_b', 'warden_dash', 'warden_stuck', 'warden_summon', 'warden_die',
];
const orderedNames = [
  ...Object.keys(SPRITES),
  ...FLIP_LIST.map((k) => `${k}_flip`),
  ...Object.keys(TILE_ART),
];
const nameOf = new Map();
createdCanvases.forEach((c, i) => nameOf.set(c, orderedNames[i] || `extra_${i}`));
const fullHearts = () => ops.filter((o) => o.op === 'drawImage' && o.canvas === mainCanvas &&
  nameOf.get(o.img) === 'heart_full' && o.args.length === 2).length;
const emptyHearts = () => ops.filter((o) => o.op === 'drawImage' && o.canvas === mainCanvas &&
  nameOf.get(o.img) === 'heart_empty' && o.args.length === 2).length;

// --- Szenario ---------------------------------------------------------------
frames(5);
ok(hasText('GRIMLIGHT'), 'Titelbildschirm sichtbar');
ok(gottText() === 0, 'im Titel kein GOTT (player ist null)');

key('keydown', 'Enter'); key('keyup', 'Enter');
frames(3);
const god = SEARCH.includes('god=1');
ok(gottText() === (god ? 2 : 0), `GOTT-Hinweis ${god ? 'sichtbar (Kontur+Gold)' : 'NICHT vorhanden'} (fillText-Treffer ${gottText()})`);
ok(goldText() === (god ? 'GOLD 500' : 'GOLD 0'), `Start-Gold: ${goldText()}`);

// 900 Frames (15 s) stur nach Osten, mitten in die Skelette, ohne Angriff.
key('keydown', 'ArrowRight');
let minFull = 99;
let maxEmpty = 0;
let sawGameOver = false;
for (let i = 0; i < 900; i++) {
  frame();
  if (hasText('GAME OVER')) sawGameOver = true;
  const f = fullHearts();
  if (f < minFull) minFull = f;
  if (emptyHearts() > maxEmpty) maxEmpty = emptyHearts();
}
key('keyup', 'ArrowRight');

if (god) {
  ok(minFull === 3 && maxEmpty === 0, `15 s Skelett-Kontakt ohne Schaden (min. volle Herzen ${minFull}, max. leere ${maxEmpty})`);
  ok(!sawGameOver, 'kein GAME OVER im GOD-MODE');
  ok(gottText() === 2, 'GOTT-Hinweis steht dauerhaft');
} else {
  ok(maxEmpty > 0 || sawGameOver, `ohne Flag kommt Schaden an (leere Herzen ${maxEmpty}, GameOver ${sawGameOver})`);
  ok(gottText() === 0, 'ohne Flag kein GOTT');
}

console.log(bad ? 'PROBE ROT' : 'PROBE GRUEN');
process.exitCode = bad;
