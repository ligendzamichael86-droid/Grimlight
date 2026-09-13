// Wegwerf-Check (Builder C, Slice 2): Loot/Inventar-Fluss headless durch
// main.js. DOM-Stub wie check_main_slice1/check_victory_slice1.
//
// Fluss: Titel → TESTMAP (Dev-Parameter ?map=) → Bumerang-Truhe öffnen
// (Popup, HUD-Box) → heranlaufendes Skelett per Bumerang stunnen (steht,
// kein Schaden) → Schwert-Kill → erzwungener Gear-Drop → hinlaufen →
// item_pickup (Popup 'Gräberklinge') → Inventar öffnen (Welt eingefroren:
// Gegnerposition vor/nach IDENTISCH) → ANLEGEN (Gesamtwerte-Zeile zeigt
// SCHADEN 2) → schließen (Welt läuft weiter) → zweites Skelett stirbt mit
// der +1-Waffe in GENAU 1 Hieb.
//
// Determinismus: Math.random = () => 0.02. Damit würfelt JEDER Gegner-Kill
// Gear (Skelett itemChance 0,04 > 0,02) und zwar selten (rareChance 0,1):
// die 'Gräberklinge' mit dmg +1 und knockMult +0,5, also der erzwungene
// Item-Drop aus Spec Paragraph 4. Wander-Winkel 0,02*2π zeigt nach Osten.
//
// TESTMAP wird VOR dem main.js-Import in MAPS injiziert (eigener Raum ohne
// Störgeometrie): Nordkorridor (1 Tile hoch) mit Wander-Skelett als
// Einfrier-Zeuge (nie in Sichtweite), Hauptraum mit Bumerang-Truhe und
// zwei Skeletten. Positions-Asserts AUSSCHLIESSLICH in Fußkanten-Anker-
// Konvention (x = Sprite-Zentrum, y = Sprite-Unterkante, Slice 1.5).

import { SPRITES, TILE_ART } from '../game/js/art/sprites.js';

let checks = 0;
function ok(cond, msg) {
  checks++;
  if (cond) console.log(`  ok  ${msg}`);
  else {
    console.error(`FEHLER: ${msg}`);
    process.exitCode = 1;
  }
}

// --- Stubs (identisch zu check_victory_slice1.mjs) ---------------------------
Math.random = () => 0.02;

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
    strokeRect() {},
    clearRect() {},
    drawImage(img, ...a) { ops.push({ canvas, op: 'drawImage', img, args: a }); },
    fillText(text, x, y) { ops.push({ canvas, op: 'fillText', text, x, y }); },
    beginPath() {}, arc() {}, fill() {}, stroke() {},
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
  location: { search: '?map=TESTMAP' },
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

// --- TESTMAP vor dem main.js-Import injizieren --------------------------------
// 30×16 Tiles (480×256 px), CATACOMBS-Legende. Reihe 1 = abgeriegelter
// Nordkorridor (Einfrier-Zeuge wandert nach Osten und ist NIE in Sicht-
// weite 96 der Spielerzone ab Reihe 8). Hauptraum Reihen 3-14.
const { MAPS } = await import('../game/js/world/maps.js');
const tcc = (tx, ty) => ({ x: tx * 16 + 8, y: ty * 16 + 8 });
MAPS.TESTMAP = {
  rows: (() => {
    const solid = '#'.repeat(30);
    const open = `#${'.'.repeat(28)}#`;
    const rows = [solid, open, solid];
    for (let i = 0; i < 12; i++) rows.push(open);
    rows.push(solid);
    return rows;
  })(),
  legend: MAPS.CATACOMBS.legend,
  playerSpawn: tcc(3, 10),
  skeletonSpawns: [
    tcc(12, 10), // Kampf-Skelett (Stun + erster Kill)
    tcc(3, 1),   // Einfrier-Zeuge im Nordkorridor
    tcc(26, 10), // Final-Skelett (1-Hieb-Beweis)
  ],
  ghoulSpawns: [],
  enemySpawns: [],
  propSpawns: [{ ...tcc(5, 10), kind: 'chest', content: 'boomerang' }],
  portals: [],
  torchChars: [],
  ambient: 0.6,
  playerLightRadius: 48,
  fog: false,
};

await import('../game/js/main.js');

const FLIP_LIST = [
  'player_side_0', 'player_side_1', 'player_side_2', 'player_side_3',
  'player_attack_side', 'sword_slash_side',
  'skeleton_0', 'skeleton_1', 'skeleton_die',
  'ghoul_0', 'ghoul_1', 'ghoul_die',
  'hound_0', 'hound_1', 'hound_telegraph', 'hound_leap', 'hound_down', 'hound_die',
  'rust_0', 'rust_1', 'rust_die', 'shield_side',
];
const orderedNames = [
  ...Object.keys(SPRITES),
  ...FLIP_LIST.map((k) => `${k}_flip`),
  ...Object.keys(TILE_ART),
];
const nameOf = new Map();
createdCanvases.forEach((c, i) => nameOf.set(c, orderedNames[i] || `extra_${i}`));

// --- Frame-Treiber + Leser ----------------------------------------------------
let sawSieg = false;
function frame() {
  ops.length = 0;
  const cb = rafQ.shift();
  if (!cb) throw new Error('kein rAF-Callback');
  fakeTime += 1000 / 60;
  cb();
  if (!sawSieg && ops.some((o) => o.op === 'fillText' && String(o.text).includes('SIEG'))) sawSieg = true;
}
function frames(n) { for (let i = 0; i < n; i++) frame(); }
function key(type, code) {
  for (const f of winListeners[type] || []) f({ code, repeat: false, preventDefault() {} });
}
function hold(code, n) { key('keydown', code); frames(n); key('keyup', code); }

const texts = () => ops.filter((o) => o.op === 'fillText').map((o) => String(o.text));
const hasText = (t) => texts().some((s) => s.includes(t));
const drawnNames = () => ops.filter((o) => o.op === 'drawImage' && o.canvas === mainCanvas)
  .map((o) => ({ name: String(nameOf.get(o.img) || ''), o }));
const hasSprite = (n) => drawnNames().some((d) => d.name === n || d.name === `${n}_flip`);

let lastPlayer = null; // Spieler blinkt bei Unverwundbarkeit → letzten Wert cachen
function playerScreen() {
  const d = drawnNames().filter((x) => x.name.startsWith('player'));
  if (d.length) {
    const l = d[d.length - 1].o;
    // Fußkanten-Anker (Slice 1.5): x = Sprite-Zentrum, y = Sprite-Unterkante
    lastPlayer = { x: l.args[0] + l.img.width / 2, y: l.args[1] + l.img.height };
  }
  return lastPlayer;
}
// Alle LEBENDEN Skelette (Fußkanten-Anker)
function skeletonsScreen() {
  return drawnNames()
    .filter((x) => /^skeleton_[01](_flip)?$/.test(x.name))
    .map((x) => ({ x: x.o.args[0] + x.o.img.width / 2, y: x.o.args[1] + x.o.img.height }));
}
// Nächstes lebendes Skelett relativ zum Spieler
function nearestSkeleton() {
  const p = playerScreen();
  if (!p) return null;
  let best = null;
  for (const s of skeletonsScreen()) {
    const rx = s.x - p.x;
    const ry = s.y - p.y;
    const d = Math.hypot(rx, ry);
    if (!best || d < best.d) best = { x: rx, y: ry, d };
  }
  return best;
}
// Einfrier-Zeuge = das Skelett mit der kleinsten y-Koordinate (Nordkorridor)
function witnessScreen() {
  const s = skeletonsScreen();
  if (s.length === 0) return null;
  return s.reduce((a, b) => (b.y < a.y ? b : a));
}
function ambientAlpha() {
  const f = ops.find((o) => o.op === 'fillRect' && o.canvas !== mainCanvas && o.alpha > 0 && o.alpha < 1);
  return f ? f.alpha : null;
}
const goldText = () => texts().find((s) => s.startsWith('GOLD'));
function dirTowards(n) {
  return Math.abs(n.x) >= Math.abs(n.y)
    ? (n.x > 0 ? 'ArrowRight' : 'ArrowLeft')
    : (n.y > 0 ? 'ArrowDown' : 'ArrowUp');
}

// --- 1. Titel → TESTMAP, Spawn in Fußkanten-Anker-Konvention ------------------
frames(5);
ok(hasText('GRIMLIGHT'), 'Titelbildschirm sichtbar');
key('keydown', 'Enter'); key('keyup', 'Enter');
frames(3);
ok(Math.abs(ambientAlpha() - 0.6) < 1e-9,
  `?map=TESTMAP lädt die injizierte Map: ambient 0.6 (ist ${ambientAlpha()})`);
let p = playerScreen();
// Spawn-Zentrum (56,168), AABB 12×14 → Fußkante Welt-y 175; Kamera (0,76)
ok(p && p.x === 56 && p.y === 99, `Spawn korrekt (Zentrum/Fuß-screen ${p && p.x},${p && p.y})`);
ok(!hasSprite('icon_boomerang'), 'HUD-Item-Box existiert vor dem Bumerang noch nicht');

// --- 2. Bumerang-Truhe öffnen (Schwert), Popup + HUD-Box ----------------------
hold('ArrowRight', 6); // an die Truhe bei tc(5,10) heranrücken
let found = false;
for (let i = 0; i < 12 && !found; i++) {
  key('keydown', 'KeyJ'); frame(); key('keyup', 'KeyJ');
  for (let f = 0; f < 21 && !found; f++) { frame(); found = hasText('KNOCHEN-BUMERANG!'); }
}
ok(found, "Bumerang-Truhe: Popup 'KNOCHEN-BUMERANG!' erscheint");
frames(5);
ok(hasSprite('icon_boomerang'), 'HUD-Item-Box mit Bumerang-Icon erscheint');
frames(60);
ok(!sawSieg, "Bumerang-Truhe löst KEIN 'SIEG' aus (chest_opened bleibt der Siegtruhe)");

// --- 3. Kampf-Skelett per Bumerang stunnen -------------------------------------
// Nach Osten vorrücken, bis das heranlaufende Skelett auf Wurfweite ist
let n = nearestSkeleton();
let guard = 400;
while ((!n || n.d > 56) && guard-- > 0) {
  key('keydown', 'ArrowRight'); frames(2); key('keyup', 'ArrowRight');
  n = nearestSkeleton();
}
ok(n && n.d <= 56, `Kampf-Skelett auf Wurfweite (d=${n && n.d.toFixed(1)})`);
key('keydown', 'KeyL'); frame(); key('keyup', 'KeyL');
let sawBoomerang = false;
for (let i = 0; i < 12; i++) { frame(); sawBoomerang = sawBoomerang || hasSprite('boomerang_0') || hasSprite('boomerang_1'); }
ok(sawBoomerang, 'Bumerang fliegt (Rotations-Sprite sichtbar)');
// Stun-Nachweis: Skelett steht (±2 px Stun-Wackeln), obwohl es eben noch lief
const s1 = nearestSkeleton();
frames(12);
const s2 = nearestSkeleton();
const p1 = playerScreen();
ok(s1 && s2 && Math.abs(s1.x - s2.x) <= 2 && Math.abs(s1.y - s2.y) <= 2,
  `Gestunntes Skelett bewegt sich nicht (Δ=${s1 && s2 && Math.hypot(s1.x - s2.x, s1.y - s2.y).toFixed(1)})`);

// --- 4. Gestunntes Skelett töten → erzwungener Gear-Drop -----------------------
let dead = false;
guard = 200;
while (!dead && guard-- > 0) {
  const e = nearestSkeleton();
  if (!e || e.d > 60) break;
  if (e.d > 24) {
    const dir = dirTowards(e);
    key('keydown', dir); frames(2); key('keyup', dir);
  } else {
    const dir = dirTowards(e);
    key('keydown', dir); frames(1); key('keyup', dir); // Blick setzen
    key('keydown', 'KeyJ'); frame(); key('keyup', 'KeyJ');
    for (let f = 0; f < 22 && !dead; f++) { frame(); dead = hasSprite('skeleton_die'); }
  }
}
ok(dead, 'Kampf-Skelett stirbt durch das Schwert');
// Drops spawnen erst nach der Sterbe-Animation (0,4 s) → auf das Boden-Item warten
let itemOnGround = false;
for (let i = 0; i < 60 && !itemOnGround; i++) { frame(); itemOnGround = hasSprite('item_weapon'); }
ok(itemOnGround, "Gear-Drop liegt am Boden (kind 'item', Slot weapon)");

// --- 5. Hinlaufen → item_pickup mit Popup --------------------------------------
let picked = false;
guard = 300;
while (!picked && guard-- > 0) {
  const it = drawnNames().find((x) => x.name === 'item_weapon');
  if (!it) { frame(); picked = hasText('berklinge'); continue; }
  const pp = playerScreen();
  const rel = {
    x: it.o.args[0] + it.o.img.width / 2 - pp.x,
    y: it.o.args[1] + it.o.img.height - pp.y,
  };
  const dir = dirTowards(rel);
  key('keydown', dir); frames(2); key('keyup', dir);
  picked = hasText('berklinge');
}
ok(picked, "item_pickup: Popup 'Gräberklinge' (Seltenheits-Toast) erscheint");
frames(40); // Toast auslaufen lassen, Ruhe vor dem Einfrier-Test
ok((goldText() || '').startsWith('GOLD ') && goldText() !== 'GOLD 0',
  `Münz-Drop des Kills eingesammelt (${goldText()})`);

// --- 6. Inventar öffnen: Welt friert hart ein ----------------------------------
const w1 = witnessScreen();
frames(12);
const w2 = witnessScreen();
ok(w1 && w2 && (w1.x !== w2.x || w1.y !== w2.y),
  `Einfrier-Zeuge bewegt sich VOR dem Öffnen (Δx=${w1 && w2 && (w2.x - w1.x)})`);
key('keydown', 'KeyI');
frames(2);
ok(hasText('AUSRUESTUNG'), 'Inventar-Panel öffnet per Taste I');
ok(hasText('berklinge'), 'Item-Liste zeigt die Gräberklinge');
const f1 = witnessScreen();
frames(30);
const f2 = witnessScreen();
ok(f1 && f2 && f1.x === f2.x && f1.y === f2.y,
  'Welt eingefroren: Gegnerposition vor/nach IDENTISCH');
key('keyup', 'KeyI');
frames(3);
ok(hasText('AUSRUESTUNG'), 'Panel bleibt nach dem Loslassen offen');

// --- 7. ANLEGEN: Stats numerisch belegt ----------------------------------------
key('keydown', 'KeyJ'); frames(2); key('keyup', 'KeyJ');
frames(2);
ok(hasText('HERZ 3  SCHADEN 2  TEMPO 100%'),
  'Nach ANLEGEN zeigt die Gesamtwerte-Zeile EXAKT HERZ 3 SCHADEN 2 TEMPO 100%');

// --- 8. Schließen: Welt läuft weiter --------------------------------------------
key('keydown', 'KeyI'); frames(2); key('keyup', 'KeyI');
ok(!hasText('AUSRUESTUNG'), 'Panel schließt per I-Flanke');
const r1 = witnessScreen();
frames(12);
const r2 = witnessScreen();
ok(r1 && r2 && (r1.x !== r2.x || r1.y !== r2.y), 'Welt läuft nach dem Schließen weiter');

// --- 9. Final-Skelett stirbt mit der +1-Waffe in GENAU 1 Hieb -------------------
guard = 600;
n = nearestSkeleton();
// Zeuge ignorieren: nur Skelette im Hauptraum zählen (Fuß-y > 60)
const nearestFighter = () => {
  const pp = playerScreen();
  if (!pp) return null;
  let best = null;
  for (const s of skeletonsScreen()) {
    if (s.y <= 60 && pp.y > 60) continue; // Nordkorridor-Zeuge
    const rx = s.x - pp.x;
    const ry = s.y - pp.y;
    const d = Math.hypot(rx, ry);
    if (!best || d < best.d) best = { x: rx, y: ry, d };
  }
  return best;
};
n = nearestFighter();
while ((!n || n.d > 26) && guard-- > 0) {
  const dir = n ? dirTowards(n) : 'ArrowRight';
  key('keydown', dir); frames(2); key('keyup', dir);
  n = nearestFighter();
}
ok(n && n.d <= 26, `Final-Skelett auf Schwertreichweite (d=${n && n.d.toFixed(1)})`);
const dirFinal = dirTowards(n);
key('keydown', dirFinal); frames(1); key('keyup', dirFinal); // Blick setzen
key('keydown', 'KeyJ'); frame(); key('keyup', 'KeyJ');       // EIN einziger Hieb
let oneHit = false;
for (let f = 0; f < 30 && !oneHit; f++) { frame(); oneHit = hasSprite('skeleton_die'); }
ok(oneHit, 'Final-Skelett stirbt mit der +1-Waffe in GENAU 1 Hieb');
frames(10);
ok(!hasText('GAME OVER') && !sawSieg, 'Kein Game Over und kein Sieg im gesamten Fluss');

if (process.exitCode) console.error('CHECK ROT');
else console.log(`CHECK GRÜN (${checks} Assertions)`);
