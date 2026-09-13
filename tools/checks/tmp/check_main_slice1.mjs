// Wegwerf-Check (Builder B, Slice 1): kompletter main.js-Fluss headless.
// DOM-Stub + Fake-Clock + deterministisches Math.random. Fährt:
// Titel → Friedhof → (Verfolger töten) → Krypta-Portal (Fade) → Katakomben →
// Portal zurück → Tod durch Skelette → Game Over → Neustart (Reset, Gold 0).
//
// Beobachtungskanäle (main.js hat keine Exporte):
// - fillText-Protokoll (Titel/GOLD/GAME OVER/Trank-Zähler)
// - drawImage-Protokoll mit Canvas→Sprite-Namen über Erzeugungsreihenfolge
// - fillRect auf dem Lighting-Offscreen (alpha = map.ambient → Map-Detektor)
// - Vollbild-fillRect #000 mit 0<alpha<1 auf dem Haupt-Canvas (Fade-Detektor)

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

// --- Stubs -----------------------------------------------------------------
Math.random = () => 0.5; // deterministisch: Skelette wandern nach Westen

const ops = []; // pro Frame geleert
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
  location: { search: '' },
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

// --- main.js laden (registriert ersten Frame) -------------------------------
await import('../game/js/main.js');

const FLIP_LIST = [
  'player_side_0', 'player_side_1', 'player_side_2', 'player_side_3',
  'player_attack_side', 'sword_slash_side',
  'skeleton_0', 'skeleton_1', 'skeleton_die',
  'ghoul_0', 'ghoul_1', 'ghoul_die',
];
const orderedNames = [
  ...Object.keys(SPRITES),
  ...FLIP_LIST.map((k) => `${k}_flip`),
  ...Object.keys(TILE_ART),
];
const nameOf = new Map();
createdCanvases.forEach((c, i) => nameOf.set(c, orderedNames[i] || `extra_${i}`));

// --- Frame-Treiber + Leser ----------------------------------------------------
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
function hold(code, n) { key('keydown', code); frames(n); key('keyup', code); }

const texts = () => ops.filter((o) => o.op === 'fillText').map((o) => String(o.text));
const hasText = (t) => texts().some((s) => s.includes(t));
const goldText = () => texts().find((s) => s.startsWith('GOLD'));

let lastPlayer = null; // Spieler blinkt bei Unverwundbarkeit → letzten Wert cachen
function playerScreen() {
  const d = ops.filter((o) => o.op === 'drawImage' && o.canvas === mainCanvas &&
    String(nameOf.get(o.img) || '').startsWith('player'));
  if (d.length) {
    const l = d[d.length - 1];
    // Fußkante/Zentrum statt Zeichen-Ecke (Slice 1.5, Held 16×24): x =
    // horizontales Sprite-Zentrum, y = Sprite-Unterkante (= Hitbox-Unterkante,
    // alle Zeichner setzen Füße bündig). Sprite-größen-agnostisch; identisch
    // zur alten 16²-Geometrie (damals x_alt = x−8, y_alt = y−16, konstant).
    lastPlayer = { x: l.args[0] + l.img.width / 2, y: l.args[1] + l.img.height, name: nameOf.get(l.img) };
  }
  return lastPlayer;
}
function nearestSkeletonRel() {
  const p = playerScreen();
  if (!p) return null;
  const es = ops.filter((o) => o.op === 'drawImage' && o.canvas === mainCanvas &&
    /^skeleton_[01](_flip)?$/.test(String(nameOf.get(o.img) || '')));
  let best = null;
  for (const e of es) {
    const rx = (e.args[0] + e.img.width / 2) - p.x;
    const ry = (e.args[1] + e.img.height) - p.y;
    const d = Math.hypot(rx, ry);
    if (!best || d < best.d) best = { x: rx, y: ry, d };
  }
  return best;
}
function ambientAlpha() {
  const f = ops.find((o) => o.op === 'fillRect' && o.canvas !== mainCanvas && o.alpha > 0 && o.alpha < 1);
  return f ? f.alpha : null;
}
function fadeAlpha() {
  const f = ops.filter((o) => o.op === 'fillRect' && o.canvas === mainCanvas &&
    o.fillStyle === '#000' && o.alpha > 0 && o.alpha < 1 &&
    o.args[2] === 320 && o.args[3] === 180);
  return f.length ? f[f.length - 1].alpha : null;
}
const fullHearts = () => ops.filter((o) => o.op === 'drawImage' && o.canvas === mainCanvas &&
  nameOf.get(o.img) === 'heart_full' && o.args.length === 2).length;
const emptyHearts = () => ops.filter((o) => o.op === 'drawImage' && o.canvas === mainCanvas &&
  nameOf.get(o.img) === 'heart_empty' && o.args.length === 2).length;

// Verfolger in Reichweite töten: Blickrichtung zum nächsten Skelett drehen,
// zuschlagen, warten bis 1,5 s lang kein Skelett näher als 100 px ist.
function clearArea(budget = 1200) {
  let calm = 0;
  while (budget > 0 && calm < 90) {
    const n = nearestSkeletonRel();
    if (n && n.d < 30) {
      const dir = Math.abs(n.x) >= Math.abs(n.y)
        ? (n.x > 0 ? 'ArrowRight' : 'ArrowLeft')
        : (n.y > 0 ? 'ArrowDown' : 'ArrowUp');
      key('keydown', dir); frames(2); key('keyup', dir);
      key('keydown', 'KeyJ'); frame(); key('keyup', 'KeyJ');
      frames(24);
      budget -= 27;
      calm = 0;
    } else {
      frame();
      budget -= 1;
      calm = n && n.d < 100 ? 0 : calm + 1;
    }
  }
}

// --- Szenario -----------------------------------------------------------------
// 1. Titel
frames(5);
ok(hasText('GRIMLIGHT'), 'Titelbildschirm sichtbar');

// 2. Enter → Playing (Friedhof)
key('keydown', 'Enter'); key('keyup', 'Enter');
frames(3);
ok(hasText('GOLD 0'), 'Playing: HUD mit GOLD 0');
ok(hasText('x 0'), 'Playing: Trank-Zähler x 0');
ok(Math.abs(ambientAlpha() - 0.22) < 1e-9, `Friedhof: ambient 0.22 (ist ${ambientAlpha()})`);
ok(fullHearts() === 3, `3 volle Herzen (ist ${fullHearts()})`);
ok(fadeAlpha() === null, 'kein Fade beim Start');

// 3. Route: Ost-Wand (Resync) → Verfolger töten → Spalte 37 hoch → Tasche
hold('ArrowRight', 430);
clearArea();
hold('ArrowRight', 30); // Resync an der Ost-Wand (x=596)
let p = playerScreen();
ok(p && p.x === 282, `Ost-Wand erreicht (Welt-x 596; Zentrum-screen ${p && p.x})`);
hold('ArrowUp', 190);
clearArea();
hold('ArrowUp', 30); hold('ArrowRight', 30); // Resync NE-Tasche (596,16)
p = playerScreen();
ok(p && p.x === 282 && p.y === 30, `NE-Tasche erreicht (596,16; Zentrum/Fuß-screen ${p && p.x},${p && p.y})`);

// 4. Tasche → Reihe 5 → Portal-Gasse → nach Norden ins Portal
hold('ArrowDown', 43);  // y ≈ 80,5 (Reihe 5)
hold('ArrowLeft', 45);  // x ≈ 528,5 (Gasse, Spalten 32/33)
const heartsBefore = (frames(1), fullHearts());
const goldBefore = goldText();
let sawFade = false;
key('keydown', 'ArrowUp');
for (let i = 0; i < 30; i++) { frame(); if (fadeAlpha() !== null) sawFade = true; }
key('keyup', 'ArrowUp');
ok(sawFade, 'Portal-Berührung startet Fade');
frames(45);
ok(Math.abs(ambientAlpha() - 0.55) < 1e-9, `Katakomben geladen: ambient 0.55 (ist ${ambientAlpha()})`);
ok(fadeAlpha() === null, 'Fade abgeschlossen');
p = playerScreen();
ok(p && p.x === 104 && p.y === 79, `Katakomben-Spawn (104,72) korrekt (Zentrum/Fuß-screen ${p && p.x},${p && p.y})`);
ok(goldText() === goldBefore && fullHearts() === heartsBefore,
  `hp/gold überleben den Map-Wechsel (${goldBefore}, ${heartsBefore} Herzen)`);
frames(30);
ok(Math.abs(ambientAlpha() - 0.55) < 1e-9 && fadeAlpha() === null, 'kein Portal-Ping-Pong am Spawn');

// 5. Zurück durchs U-Portal (hoch auf Portalhöhe, dann nach Westen)
hold('ArrowUp', 10);
sawFade = false;
key('keydown', 'ArrowLeft');
for (let i = 0; i < 32; i++) { frame(); if (fadeAlpha() !== null) sawFade = true; }
key('keyup', 'ArrowLeft');
ok(sawFade, 'Rück-Portal startet Fade');
frames(45);
ok(Math.abs(ambientAlpha() - 0.22) < 1e-9, `zurück auf dem Friedhof: ambient 0.22 (ist ${ambientAlpha()})`);
p = playerScreen();
ok(p && p.x === 216 && p.y === 95, `Friedhof-Rückkehr-Spawn (536,88) korrekt (Zentrum/Fuß-screen ${p && p.x},${p && p.y})`);

// 6. Tod: das nächste lebende Skelett AKTIV aufsuchen (kein Blindlauf —
// die Skelette wandern deterministisch nach Westen und bleiben an ihren
// Zeilen-Wänden hängen). Steuerung wechselt periodisch die Achse, damit
// der Spieler an Hindernissen vorbeirutscht. Kein Angriff: Dauerkontakt.
hold('ArrowDown', 80);
let died = false;
for (let i = 0; i < 600 && !died; i++) {
  const n = nearestSkeletonRel();
  if (!n) { frame(); died = hasText('GAME OVER'); continue; }
  const major = Math.abs(n.x) >= Math.abs(n.y);
  const horiz = n.x > 0 ? 'ArrowRight' : 'ArrowLeft';
  const vert = n.y > 0 ? 'ArrowDown' : 'ArrowUp';
  const dir = (i % 3 === 2) ? (major ? vert : horiz) : (major ? horiz : vert);
  key('keydown', dir);
  for (let f = 0; f < 6 && !died; f++) { frame(); died = hasText('GAME OVER'); }
  key('keyup', dir);
}
ok(died, 'Dauerkontakt führt zu GAME OVER');
ok(fullHearts() === 0, `0 Herzen im Game Over (ist ${fullHearts()})`);
// Slice 3 (erlaubte Alt-Test-Aenderung #3): Der Tod beendet den Run NICHT
// mehr. Game-Over zeigt die Gold-Zoll-Zeile; die Bestaetigung fuehrt zum
// RESPAWN am letzten Eintritts-Spawn der aktuellen Map (nicht zum Titel/Reset),
// mit halbiertem Gold und erhaltenem Level/XP/Inventar, hp = maxHp.
const goldLine = texts().find((s) => s.startsWith('GOLD:'));
const goldAtDeath = goldLine ? parseInt(goldLine.replace(/[^0-9]/g, ''), 10) : 0;
ok(hasText('DER TOD FORDERT SEINEN ZOLL') || goldAtDeath === 0,
  `Game Over zeigt die Gold-Zoll-Zeile (Gold ${goldAtDeath})`);

// 7. Respawn: Enter → zurueck ins Spiel auf der AKTUELLEN Map (GRAVEYARD)
frames(50); // Mindest-Anzeigezeit 0,7 s
key('keydown', 'Enter'); key('keyup', 'Enter');
frames(3);
ok(!hasText('GAME OVER'), 'Respawn verlässt Game Over');
ok(Math.abs(ambientAlpha() - 0.22) < 1e-9, 'Respawn: auf der aktuellen Map (GRAVEYARD, ambient 0.22)');
const goldAfter = parseInt((goldText() || 'GOLD 0').replace(/[^0-9]/g, ''), 10);
ok(goldAfter === Math.floor(goldAtDeath / 2),
  `Respawn: Gold halbiert (${goldAtDeath} → ${goldAfter})`);
ok(emptyHearts() === 0, `Respawn: hp = maxHp, keine leeren Herzen (ist ${emptyHearts()})`);
lastPlayer = null;
frames(2);
p = playerScreen();
// Respawn am zuletzt benutzten Eintritts-Spawn (Rueckkehr-Portal tc(33,5) =
// (536,88), Kamera identisch zur Rueckkehr in Abschnitt 5 → Zentrum-screen 216).
ok(p && p.x === 216, `Respawn am Eintritts-Spawn (536,88) (Zentrum-screen ${p && p.x})`);

if (process.exitCode) console.error('CHECK ROT');
else console.log(`CHECK GRÜN (${checks} Assertions)`);
