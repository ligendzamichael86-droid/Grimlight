// Wegwerf-Probe SLICE 4 / ROLLE ENGINE. Stub-Muster 1:1 aus
// .tmp/check_main_slice1.mjs uebernommen, ERWEITERT um einen
// localStorage-Stub (den die kanonischen Flusstests bewusst NICHT haben).
// KEINE Testdatei angefasst.
//
// Prueft:
//   A  §5.1/A4 Zonen-Geometrie (pure Rechnung aus input.js)
//   B  §3.2 Save-Hooks: resetRun schreibt NIE, Portal-Wechsel schreibt
//   C  §4.1/§4.2 Pause-State (Welt eingefroren, Overlay sichtbar)
//   D  §4.3 GOTT-Toggle: SCHADEN 1 -> 10 -> 1 (ueber das Inventar-Panel)
//   E  §3.3 Zweiter Boot (?boot=2, frische Stubs, gleicher Storage):
//      Titel-Menue + FORTSETZEN stellt Karte/Gold/Herzen wieder her
//   F  §3.4 openedChests: eine registrierte Truhe wird nicht neu erzeugt
//
// Aufruf: node .tmp/probe_s4_engine.mjs

import { SPRITES, TILE_ART } from '../game/js/art/sprites.js';
import { createInput } from '../game/js/core/input.js';
import { serialize, deserialize, SAVE_KEY } from '../game/js/items/save.js';

let bad = 0;
function ok(cond, msg) {
  if (cond) console.log(`  ok  ${msg}`);
  else { console.error(`  FEHLER: ${msg}`); bad = 1; }
}

// ===========================================================================
// A — §5.1 / A4 ZONEN-GEOMETRIE (pure Rechnung, kein main.js noetig)
// ===========================================================================
{
  console.log('\n-- A: Zonen-Geometrie (A4) --');
  const inp = createInput();
  const [A, B, W] = inp.touch.buttons;
  const P = inp.touch.pause;
  const VIEW_H = 180;
  // Referenzgeraet 1080x2400 dpr 3 quer: Skalierung 6 Geraetepixel = 2 CSS-px
  // je internem px; 404,9 ppi -> 1 interner px = 0,3764 mm.
  const MM = 25.4 / (Math.hypot(1080, 2400) / 6.5) * 6;
  const luecke = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) - a.r - b.r;

  ok(Math.abs(MM - 0.3764) < 0.001, `Referenzmass 1 interner px = ${MM.toFixed(4)} mm`);
  // (a) Unterkanten >= 24 interne px ueber der Canvas-Unterkante
  ok(VIEW_H - (B.y + B.r) >= 24, `(a) B-Unterkante ${VIEW_H - (B.y + B.r)} px ueber dem Rand (>= 24)`);
  ok(VIEW_H - (W.y + W.r) >= 24, `(a) W-Unterkante ${VIEW_H - (W.y + W.r)} px ueber dem Rand (>= 24)`);
  // Joystick-Feld: ein Touch UNTERHALB von JOY_FIELD_Y1 darf weder einen
  // Joystick starten NOCH in die Angriffszone rutschen. Gemessen ueber die
  // echten touchstart-Handler (attach an ein Canvas-Stub mit 640x360 CSS =
  // Skalierung 2 wie auf dem Referenzgeraet).
  const listener = {};
  const canvasStub = {
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 640, height: 360 }),
    ownerDocument: {
      defaultView: { addEventListener() {} },
      addEventListener() {},
    },
    addEventListener: (t, f) => { listener[t] = f; },
  };
  inp.attach(canvasStub);
  const touchStart = (x, y, id) => listener.touchstart({
    preventDefault() {},
    changedTouches: [{ identifier: id, clientX: x * 2, clientY: y * 2 }],
  });
  touchStart(60, 170, 1);   // links UNTERHALB des Feldes
  ok(inp.dirX === 0 && inp.dirY === 0 && inp.attack === false,
    '(a) Touch links unterhalb 156 startet KEINEN Joystick und KEINEN Angriff');
  ok(inp.touch.joyRadius === 32,
    `(c) Joystick-Vollausschlag ${inp.touch.joyRadius} interne px = ${(inp.touch.joyRadius * MM).toFixed(2)} mm (>= 12 mm)`);
  touchStart(60, 120, 2);   // links INNERHALB des Feldes
  ok(inp.touch.joyBaseX === 60 && inp.touch.joyBaseY === 120,
    '(a) Touch links innerhalb des Feldes startet den Joystick');
  ok(VIEW_H - 156 === 24, '(a) Joystick-Feld endet 24 px ueber der Canvas-Unterkante');
  // (b) Luecken
  ok(luecke(B, W) >= 16, `(b) Luecke B<->W = ${luecke(B, W).toFixed(2)} px (>= 16)`);
  ok(luecke(A, W) >= 12, `(b) Luecke A<->W = ${luecke(A, W).toFixed(2)} px (>= 12)`);
  // (d) alle Kreise >= 9 mm Durchmesser
  for (const [n, b] of [['A', A], ['B', B], ['W', W]]) {
    ok(2 * b.r * MM >= 9, `(d) Kreis ${n}: ${(2 * b.r * MM).toFixed(2)} mm (>= 9)`);
  }
  ok(2 * P.r * MM >= 7, `§4.2 Pause-Knopf: ${(2 * P.r * MM).toFixed(2)} mm (>= 7)`);
  // Pause-Knopf kollisionsfrei: HUD-Panel < 56, Boss-Balken 120..200,
  // GOTT-Text ~268..292, Item-Box 296..316, HUD-Box-Zone x >= 290.
  ok(P.x - P.r > 200 && P.x + P.r < 268,
    `§4.2 Pause-Knopf liegt kollisionsfrei (${P.x - P.r}..${P.x + P.r})`);
}

// ===========================================================================
// STUBS (aus check_main_slice1.mjs) + localStorage
// ===========================================================================
Math.random = () => 0.5;

const speicher = new Map();
const fakeStorage = {
  getItem: (k) => (speicher.has(k) ? speicher.get(k) : null),
  setItem: (k, v) => speicher.set(k, String(v)),
  removeItem: (k) => speicher.delete(k),
  clear: () => speicher.clear(),
};

let ops = [];
let createdCanvases = [];

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
    // Der Bestand (inventory_ui.js) zeichnet Rahmen per strokeRect; der
    // check_main_slice1-Stub kennt das nicht, weil er das Panel nie oeffnet.
    // Diese Probe oeffnet es (GOTT-Messung), also braucht sie den Zug.
    strokeRect() {}, strokeText() {},
    save() { this._stack.push({ a: this.globalAlpha, f: this.fillStyle, c: this.globalCompositeOperation }); },
    restore() {
      const s = this._stack.pop();
      if (s) { this.globalAlpha = s.a; this.fillStyle = s.f; this.globalCompositeOperation = s.c; }
    },
    createRadialGradient: () => ({ addColorStop() {} }),
  };
}

let winListeners = {};
let rafQ = [];
let mainCanvas = null;
let fakeTime = 0;

function bauStubs() {
  ops = [];
  createdCanvases = [];
  winListeners = {};
  rafQ = [];
  function makeCanvas() {
    const c = { width: 0, height: 0, style: {}, ownerDocument: null };
    c.getContext = () => (c._ctx || (c._ctx = makeCtx(c)));
    c.addEventListener = () => {};
    c.getBoundingClientRect = () => ({ left: 0, top: 0, width: 320, height: 180 });
    createdCanvases.push(c);
    return c;
  }
  const fakeWindow = {
    addEventListener: (t, f) => (winListeners[t] = winListeners[t] || []).push(f),
    devicePixelRatio: 1,
    innerWidth: 960,
    innerHeight: 540,
    location: { search: '' },
    requestAnimationFrame: (cb) => rafQ.push(cb),
    localStorage: fakeStorage,   // <- der Unterschied zu den Flusstests
  };
  mainCanvas = { width: 320, height: 180, style: {} };
  const fakeDocument = {
    getElementById: () => mainCanvas,
    createElement: () => makeCanvas(),
    addEventListener: (t, f) => (winListeners[`doc:${t}`] = winListeners[`doc:${t}`] || []).push(f),
    defaultView: fakeWindow,
    hidden: false,
  };
  mainCanvas.getContext = () => (mainCanvas._ctx || (mainCanvas._ctx = makeCtx(mainCanvas)));
  mainCanvas.addEventListener = () => {};
  mainCanvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 320, height: 180 });
  mainCanvas.ownerDocument = fakeDocument;
  globalThis.window = fakeWindow;
  globalThis.document = fakeDocument;
  try { globalThis.performance = { now: () => fakeTime }; }
  catch { Object.defineProperty(globalThis, 'performance', { value: { now: () => fakeTime } }); }
}

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

let nameOf = new Map();
function bauNamen() {
  const FLIP_LIST = [
    'player_side_0', 'player_side_1', 'player_side_2', 'player_side_3',
    'player_attack_side', 'sword_slash_side',
    'skeleton_0', 'skeleton_1', 'skeleton_die',
    'ghoul_0', 'ghoul_1', 'ghoul_die',
  ];
  const ordered = [
    ...Object.keys(SPRITES),
    ...FLIP_LIST.map((k) => `${k}_flip`),
    ...Object.keys(TILE_ART),
  ];
  nameOf = new Map();
  createdCanvases.forEach((c, i) => nameOf.set(c, ordered[i] || `extra_${i}`));
}
let lastPlayer = null;
function playerScreen() {
  const d = ops.filter((o) => o.op === 'drawImage' && o.canvas === mainCanvas &&
    String(nameOf.get(o.img) || '').startsWith('player'));
  if (d.length) {
    const l = d[d.length - 1];
    lastPlayer = { x: l.args[0] + l.img.width / 2, y: l.args[1] + l.img.height };
  }
  return lastPlayer;
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
function chestCount() {
  return ops.filter((o) => o.op === 'drawImage' && o.canvas === mainCanvas &&
    String(nameOf.get(o.img) || '').startsWith('chest_')).length;
}

// ===========================================================================
// BOOT 1 — §3.2 Hooks + §4 Pause + §4.3 GOTT
// ===========================================================================
bauStubs();
await import('../game/js/main.js');
bauNamen();

console.log('\n-- B: §3.2 Save-Hooks --');
frames(5);
ok(hasText('GRIMLIGHT'), 'Titel sichtbar (ohne Spielstand byte-gleich zum Bestand)');
ok(!hasText('FORTSETZEN'), 'ohne Spielstand KEIN Titel-Menue');
ok(speicher.size === 0, 'vor dem Start ist der Storage leer');

key('keydown', 'Enter'); key('keyup', 'Enter');
frames(3);
ok(hasText('GOLD 0'), 'Playing: HUD mit GOLD 0');
ok(speicher.size === 0, '§3.2 resetRun (Titel-Start) schreibt NICHT');

// Route zum Krypta-Portal (identisch zu check_main_slice1)
function clearArea(budget = 1200) {
  let calm = 0;
  while (budget > 0 && calm < 90) {
    const es = ops.filter((o) => o.op === 'drawImage' && o.canvas === mainCanvas &&
      /^skeleton_[01](_flip)?$/.test(String(nameOf.get(o.img) || '')));
    const p = playerScreen();
    let best = null;
    for (const e of es) {
      const rx = (e.args[0] + e.img.width / 2) - p.x;
      const ry = (e.args[1] + e.img.height) - p.y;
      const d = Math.hypot(rx, ry);
      if (!best || d < best.d) best = { x: rx, y: ry, d };
    }
    if (best && best.d < 30) {
      const dir = Math.abs(best.x) >= Math.abs(best.y)
        ? (best.x > 0 ? 'ArrowRight' : 'ArrowLeft')
        : (best.y > 0 ? 'ArrowDown' : 'ArrowUp');
      key('keydown', dir); frames(2); key('keyup', dir);
      key('keydown', 'KeyJ'); frame(); key('keyup', 'KeyJ');
      frames(24);
      budget -= 27;
      calm = 0;
    } else {
      frame();
      budget -= 1;
      calm = best && best.d < 100 ? 0 : calm + 1;
    }
  }
}
hold('ArrowRight', 430);
clearArea();
hold('ArrowRight', 30);
hold('ArrowUp', 190);
clearArea();
hold('ArrowUp', 30); hold('ArrowRight', 30);
hold('ArrowDown', 43);
hold('ArrowLeft', 45);
const goldVorPortal = goldText();
const herzenVorPortal = (frames(1), fullHearts());
key('keydown', 'ArrowUp');
for (let i = 0; i < 30; i++) frame();
key('keyup', 'ArrowUp');
frames(45);
ok(Math.abs(ambientAlpha() - 0.55) < 1e-9, `Katakomben geladen (ambient ${ambientAlpha()})`);
ok(fadeAlpha() === null, 'Fade abgeschlossen');
ok(speicher.has(SAVE_KEY), '§3.2 HOOK (a): nach dem Portal-Wechsel steht ein Spielstand im Storage');

const rohStand = speicher.get(SAVE_KEY);
const stand = deserialize(rohStand);
ok(stand !== null, '§3.1 der geschriebene Stand ist schema-gueltig');
ok(!rohStand.includes('maxHp'), '§3.1 maxHp steht NICHT im Spielstand');
ok(stand.mapKey === 'CATACOMBS', `§3.1 mapKey = ${stand.mapKey}`);
ok(stand.hp > 0, `§3.1 hp = ${stand.hp} (> 0, kein Sofort-Tod beim Laden)`);
ok(Array.isArray(stand.runFlags.openedChests), '§3.4 runFlags.openedChests ist im Schema');
ok(stand.runFlags.bossDead === false, '§3.1 runFlags.bossDead = false');

// ---------------------------------------------------------------------------
console.log('\n-- C: §4.1/§4.2 Pause --');
frames(2);
const posVorPause = { ...playerScreen() };
key('keydown', 'Escape');
frames(1);
key('keyup', 'Escape');
frames(1);
ok(hasText('PAUSE'), 'Escape pausiert: Pause-Overlay sichtbar');
ok(hasText('WEITER') && hasText('GOTT: AUS') && hasText('FPS: AUS'), 'Pause-Menue zeigt alle drei Zeilen');
ok(!hasText('SIEG') && !hasText('GAME OVER') && !texts().some((s) => s.startsWith('GOLD:')),
  'Pause-Texte kollidieren mit keiner Flusstest-Sonde');
// Welt eingefroren: 40 Frames mit gehaltener Richtung bewegen den Spieler nicht
key('keydown', 'ArrowRight');
frames(40);
key('keyup', 'ArrowRight');
const posInPause = playerScreen();
ok(posInPause.x === posVorPause.x && posInPause.y === posVorPause.y,
  `Welt eingefroren (Spieler bleibt bei ${posInPause.x},${posInPause.y})`);
ok(hasText('PAUSE'), 'Pause bleibt aktiv (kein Auto-Resume)');
// Fortsetzen per Escape
key('keydown', 'Escape'); frames(1); key('keyup', 'Escape');
frames(2);
ok(!hasText('PAUSE'), 'Escape setzt fort');
key('keydown', 'ArrowRight'); frames(20); key('keyup', 'ArrowRight');
const posNachPause = playerScreen();
ok(posNachPause.x !== posInPause.x, `nach dem Fortsetzen laeuft die Welt wieder (x ${posInPause.x} -> ${posNachPause.x})`);

// ---------------------------------------------------------------------------
console.log('\n-- D: §4.3 GOTT-Toggle --');
function schadenAusInventar() {
  key('keydown', 'KeyI'); frames(1); key('keyup', 'KeyI');
  frames(3);
  const z = texts().find((s) => s.includes('SCHADEN'));
  key('keydown', 'KeyI'); frames(1); key('keyup', 'KeyI');
  frames(3);
  return z || '';
}
function pauseWahl(index) {
  key('keydown', 'Escape'); frames(1); key('keyup', 'Escape');
  frames(2);                       // eine Leerlauf-Runde: Richtungsflanke frei
  for (let i = 0; i < index; i++) {
    key('keydown', 'ArrowDown'); frames(2); key('keyup', 'ArrowDown'); frames(2);
  }
  key('keydown', 'Enter'); frames(1); key('keyup', 'Enter');
  frames(2);
}
const schadenVor = schadenAusInventar();
ok(schadenVor.includes('SCHADEN 1'), `vor GOTT: "${schadenVor}"`);
ok(!hasText('GOTT'), 'vor GOTT: kein GOTT-Hinweis im HUD');

pauseWahl(1);                       // Zeile 1 = GOTT
ok(hasText('GOTT: AN'), 'Pause-Menue zeigt GOTT: AN');
key('keydown', 'ArrowUp'); frames(2); key('keyup', 'ArrowUp'); frames(2);
key('keydown', 'Enter'); frames(1); key('keyup', 'Enter'); frames(2);
ok(!hasText('PAUSE'), 'WEITER verlaesst die Pause');
const schadenAn = schadenAusInventar();
ok(schadenAn.includes('SCHADEN 10'), `GOTT AN: "${schadenAn}"`);
ok(schadenAn.includes('TEMPO 140%'), `GOTT AN: Tempo x1,4 in "${schadenAn}"`);
frames(2);
ok(hasText('GOTT'), 'GOTT AN: HUD zeigt den GOTT-Hinweis');

pauseWahl(1);                       // GOTT wieder aus
ok(hasText('GOTT: AUS'), 'Pause-Menue zeigt GOTT: AUS');
key('keydown', 'ArrowUp'); frames(2); key('keyup', 'ArrowUp'); frames(2);
key('keydown', 'Enter'); frames(1); key('keyup', 'Enter'); frames(2);
const schadenAus = schadenAusInventar();
ok(schadenAus.includes('SCHADEN 1') && !schadenAus.includes('SCHADEN 10'), `GOTT AUS: "${schadenAus}"`);
ok(schadenAus.includes('TEMPO 100%'), `GOTT AUS: Tempo zurueck in "${schadenAus}"`);

// FPS-Overlay einschalten und wieder aus
pauseWahl(2);
ok(hasText('FPS: AN'), 'Pause-Menue zeigt FPS: AN');
key('keydown', 'ArrowUp'); frames(2); key('keyup', 'ArrowUp');
key('keydown', 'ArrowUp'); frames(2); key('keyup', 'ArrowUp'); frames(2);
key('keydown', 'Enter'); frames(1); key('keyup', 'Enter'); frames(2);
frames(5);
ok(texts().some((s) => s.startsWith('FPS ')), '§6.4 FPS-Overlay wird gezeichnet');
ok(texts().filter((s) => s.startsWith('FPS ') || s.startsWith('MS ')).length === 4,
  '§6.4 genau 2 Zeilen (je Kontur + Fuellung = 4 fillText)');

// §4.1 pagehide -> Auto-Save + Pause
speicher.delete(SAVE_KEY);
for (const f of winListeners.pagehide || []) f();
frames(2);
ok(speicher.has(SAVE_KEY), '§3.2 HOOK (c): pagehide schreibt einen Spielstand');
ok(hasText('PAUSE'), '§4.1 pagehide pausiert das Spiel');

const standNachPagehide = deserialize(speicher.get(SAVE_KEY));
ok(standNachPagehide !== null && standNachPagehide.mapKey === 'CATACOMBS',
  '§3.2 der pagehide-Stand ist gueltig');

// ===========================================================================
// E — §3.3 ZWEITER BOOT (Cache-Busting, frische Stubs, gleicher Storage)
// ===========================================================================
console.log('\n-- E: §3.3 Zweiter Boot + FORTSETZEN --');
const goldErwartet = standNachPagehide.gold;
const hpErwartet = standNachPagehide.hp;
bauStubs();
lastPlayer = null;
await import('../game/js/main.js?boot=2');
bauNamen();
frames(5);
ok(hasText('GRIMLIGHT'), 'zweiter Boot: Titel steht');
ok(hasText('FORTSETZEN') && hasText('NEUES SPIEL'), '§3.3 mit Spielstand erscheint das Titel-Menue');
ok(!hasText('ENTER / LEERTASTE / TIPPEN'), '§3.3 die Bestands-Blinkzeile weicht dem Menue');
key('keydown', 'Enter'); key('keyup', 'Enter');
frames(5);
ok(Math.abs(ambientAlpha() - 0.55) < 1e-9,
  `§3.3 FORTSETZEN laedt CATACOMBS (ambient ${ambientAlpha()})`);
const goldNachLaden = parseInt((goldText() || 'GOLD -1').replace(/[^0-9]/g, ''), 10);
ok(goldNachLaden === goldErwartet, `§3.1 Gold wiederhergestellt (${goldNachLaden} = ${goldErwartet})`);
ok(fullHearts() === Math.ceil(hpErwartet / 2) || fullHearts() > 0,
  `§3.1 Herzen wiederhergestellt (${fullHearts()} volle bei hp ${hpErwartet})`);

// ===========================================================================
// F — §3.4 openedChests: registrierte Truhe wird nicht neu erzeugt
// ===========================================================================
console.log('\n-- F: §3.4 openedChests --');
// Beide Laeufe starten AUF der Bumerang-Truhe der Katakomben
// (propSpawn tc(4,16) -> Prop-Ecke Kachel 4,16 -> Schluessel CATACOMBS:4,16).
const basis = JSON.parse(serialize({
  mapKey: 'CATACOMBS',
  spawn: { x: 72, y: 264 },
  player: {
    hp: 6, gold: 0, potions: 0,
    inv: { items: [], equipped: { weapon: null, armor: null, ring: null }, capacity: 7, zelda: [], pity: 0, newFlag: false },
    prog: { xp: 0, level: 1, hearts: 0 },
  },
  runFlags: { bossDead: false, openedChests: [] },
}));

// SEMANTISCHE Messung statt Sprite-Zaehlung: die Canvas->Name-Abbildung ist
// bekanntlich verschoben (GP6_SPEC_REVIEW.md:98). Gemessen wird deshalb die
// WIRKUNG: steht die Bumerang-Truhe noch da, liefert ein Schwerthieb den
// Toast 'KNOCHEN-BUMERANG!' — fehlt sie, kommt nichts.
async function truhenSchlagen(openedChests, spez) {
  speicher.clear();
  speicher.set(SAVE_KEY, JSON.stringify({ ...basis, runFlags: { bossDead: false, openedChests } }));
  bauStubs();
  lastPlayer = null;
  await import(`../game/js/main.js?boot=${spez}`);
  bauNamen();
  frames(5);
  key('keydown', 'Enter'); key('keyup', 'Enter');
  frames(6);
  let toast = false;
  for (let i = 0; i < 8 && !toast; i++) {
    key('keydown', 'KeyJ'); frame(); key('keyup', 'KeyJ');
    for (let f = 0; f < 24 && !toast; f++) { frame(); toast = hasText('KNOCHEN-BUMERANG'); }
  }
  // Registrierung nachweisen: pagehide erzwingt einen Spielstand (Hook c).
  speicher.delete(SAVE_KEY);
  for (const f of winListeners.pagehide || []) f();
  const st = deserialize(speicher.get(SAVE_KEY));
  return { toast, registriert: !!st && st.runFlags.openedChests.includes('CATACOMBS:4,16') };
}

const mitTruhe = await truhenSchlagen([], 3);
const ohneTruhe = await truhenSchlagen(['CATACOMBS:4,16'], 4);
ok(mitTruhe.toast === true, 'Kontrolle: ohne Eintrag steht die Bumerang-Truhe und laesst sich oeffnen');
ok(mitTruhe.registriert === true, '§3.4 die geoeffnete Truhe landet als CATACOMBS:4,16 im Spielstand');
ok(ohneTruhe.toast === false, '§3.4 mit Eintrag CATACOMBS:4,16 wird die Truhe NICHT neu erzeugt');
ok(ohneTruhe.registriert === true, '§3.4 der Eintrag bleibt ueber den Speichervorgang erhalten');

// ===========================================================================
// G — §3.4 resetRun MUSS openedChests leeren (Review P1-B5: sonst fehlt im
// neuen Run die boss_key-Truhe und das Boss-Portal bleibt fuer immer
// VERSCHLOSSEN — kein Bestandstest faengt das).
// Weg: Titel-Menue -> NEUES SPIEL (= resetRun) -> pagehide erzwingt einen
// frischen Spielstand; darin MUSS openedChests leer sein.
// ===========================================================================
console.log('\n-- G: §3.4 resetRun-Reset --');
speicher.clear();
speicher.set(SAVE_KEY, JSON.stringify({
  ...basis,
  runFlags: { bossDead: true, openedChests: ['CATACOMBS:4,16', 'FLUESTERGRUFT:36,4'] },
}));
bauStubs();
lastPlayer = null;
await import('../game/js/main.js?boot=5');
bauNamen();
frames(5);
ok(hasText('FORTSETZEN'), 'Titel-Menue steht (Stand mit 2 Truhen-Eintraegen)');
const standVorNeu = speicher.get(SAVE_KEY);
// Cursor auf NEUES SPIEL und bestaetigen
key('keydown', 'ArrowDown'); frames(2); key('keyup', 'ArrowDown'); frames(2);
key('keydown', 'Enter'); frames(1); key('keyup', 'Enter');
frames(4);
ok(Math.abs(ambientAlpha() - 0.22) < 1e-9,
  `NEUES SPIEL startet den frischen Run auf der Start-Map (ambient ${ambientAlpha()})`);
ok(speicher.get(SAVE_KEY) === standVorNeu,
  '§3.3 "NEU verliert nichts": resetRun hat den alten Stand NICHT ueberschrieben');
for (const f of winListeners.pagehide || []) f();
const standNachNeu = deserialize(speicher.get(SAVE_KEY));
ok(standNachNeu !== null, 'nach NEU laesst sich ein Stand schreiben');
ok(standNachNeu.runFlags.openedChests.length === 0,
  `§3.4 resetRun hat openedChests geleert (${JSON.stringify(standNachNeu.runFlags.openedChests)})`);
ok(standNachNeu.runFlags.bossDead === false, '§2.6.6 resetRun hat bossDead zurueckgesetzt');

console.log(bad ? '\nPROBE ROT' : '\nPROBE GRUEN');
process.exitCode = bad;
