// ===========================================================================
// SLICE 4 — SAVE-FLUSSTEST (Spec A3, §7). KOMMITTET, nicht .tmp:
// dieser Test ist Abnahmekriterium und darf nicht "wegwerfbar" sein
// (Review P1-M10).
//
// AUFRUF:  node tools/check_save_slice4.mjs      (Exit 0 = gruen)
//
// WAS ER FAEHRT — fuenf Boots von game/js/main.js gegen EINEN gemeinsamen
// localStorage-Stub. main.js hat keine Exporte; beobachtet wird deshalb wie
// in den drei kanonischen Flusstests ueber das Zeichenprotokoll
// (fillText-Texte, drawImage-Sprites, ambient-fillRect auf dem Lighting-
// Offscreen) plus den Inhalt des Storage-Stubs.
//
//   BOOT 1  ?god=1&map=CATACOMBS — leerer Storage
//           Titel ohne Menue (byte-gleich zum Bestand) -> ENTER -> Spiel.
//           Belegt: resetRun schreibt NICHT; visibilitychange und pagehide
//           schreiben und pausieren (§3.2 c, §4.1).
//   BOOT 2  ?boot=2, FRISCHE Stubs, kein ?god — derselbe Storage
//           = simulierter Neustart der App. Titel zeigt jetzt das Menue,
//           FORTSETZEN stellt Karte, Gold, Inventar und hp wieder her,
//           GOTT ist NICHT im Stand (§9).
//   BOOT 3  ?boot=3 — NEUES SPIEL startet frisch UND laesst den alten Stand
//           unangetastet ("NEU verliert nichts", §3.3 / Review P2-M3).
//   BOOT 4  ?boot=4 — kaputter Stand im Storage: harte Ablehnung, der Titel
//           ist wieder byte-gleich zum Bestand (§3.1).
//   BOOT 5  ?boot=5 — GAR KEIN localStorage (wie in den drei kanonischen
//           Flusstests): der §0.2-Guard traegt, das Spiel startet normal.
//
// WARUM MEHRERE BOOTS PER CACHE-BUSTING: "Neu laden und FORTSETZEN" ist im
// selben Prozess sonst unmoeglich — main.js liest den Stand einmal beim
// Modul-Start. `import('../game/js/main.js?boot=N')` erzeugt eine NEUE
// Modul-Instanz; die Untermodule (MAPS, sprite_factory, Registry) bleiben
// geteilt, das ist gewollt (Review P1-M4). Vor jedem Boot werden window,
// document, Canvas, rAF-Warteschlange und die Canvas-Liste frisch gesetzt —
// nur der localStorage-Stub ueberlebt, genau wie auf dem Geraet.
// ===========================================================================

import { SPRITES, TILE_ART } from '../game/js/art/sprites.js';
import { SAVE_KEY } from '../game/js/items/save.js';
import { MAPS } from '../game/js/world/maps.js';

let checks = 0;
function ok(cond, msg, detail = '') {
  checks++;
  if (cond) {
    console.log(`  ok  ${msg}`);
  } else {
    console.error(`FEHLER: ${msg}${detail ? ` — ${detail}` : ''}`);
    process.exitCode = 1;
  }
}

// --- Storage-Stub -----------------------------------------------------------
// EIN Speicher fuer alle Boots (das ist der Punkt: er ueberlebt den Neustart).
// Jeder Boot bekommt ein FRISCHES Stub-Objekt darauf — main.js cacht
// window.localStorage einmal pro Modul-Instanz, ein wiederverwendetes Objekt
// wuerde diesen Cache-Effekt verstecken.
const SPEICHER = new Map();
const mkStorage = () => ({
  getItem: (k) => (SPEICHER.has(String(k)) ? SPEICHER.get(String(k)) : null),
  setItem: (k, v) => { SPEICHER.set(String(k), String(v)); },
  removeItem: (k) => { SPEICHER.delete(String(k)); },
  clear: () => SPEICHER.clear(),
});
const standRoh = () => (SPEICHER.has(SAVE_KEY) ? SPEICHER.get(SAVE_KEY) : null);
const stand = () => { try { return JSON.parse(standRoh()); } catch { return null; } };

// --- Zeichen-Stubs ----------------------------------------------------------
// ops ist EIN Puffer ueber alle Boots (pro Frame geleert) — er wird nie neu
// zugewiesen, sonst zeigten die ctx-Closures ins Leere.
const ops = [];
let fakeTime = 0;
try { globalThis.performance = { now: () => fakeTime }; }
catch { Object.defineProperty(globalThis, 'performance', { value: { now: () => fakeTime } }); }

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
    fillText(text, x, y) { ops.push({ canvas, op: 'fillText', text: String(text), x, y }); },
    // strokeRect gehoert BEWUSST dazu, obwohl die drei kanonischen Flusstests
    // es nicht kennen: dieser Test faehrt mit ?god=1 und damit mit gefuellter
    // HUD-Item-Box, die seit Slice 2 strokeRect benutzt (hud.js:487). Der
    // Vorrat ist hier also groesser als dort — er darf es sein, weil dieser
    // Test NICHT kanonisch ist (§0.1 betrifft ihn nicht).
    strokeRect() {},
    beginPath() {}, arc() {}, fill() {}, stroke() {},
    closePath() {}, moveTo() {}, lineTo() {}, rect() {},
    save() { this._stack.push({ a: this.globalAlpha, f: this.fillStyle, c: this.globalCompositeOperation }); },
    restore() {
      const s = this._stack.pop();
      if (s) { this.globalAlpha = s.a; this.fillStyle = s.f; this.globalCompositeOperation = s.c; }
    },
    createRadialGradient: () => ({ addColorStop() {} }),
  };
}

const FLIP_LIST = [
  'player_side_0', 'player_side_1', 'player_side_2', 'player_side_3',
  'player_attack_side', 'sword_slash_side',
  'skeleton_0', 'skeleton_1', 'skeleton_die',
  'ghoul_0', 'ghoul_1', 'ghoul_die',
];
const ORDERED = [
  ...Object.keys(SPRITES),
  ...FLIP_LIST.map((k) => `${k}_flip`),
  ...Object.keys(TILE_ART),
];

// Ein kompletter Satz frischer Browser-Stubs. Nach dem Aufruf zeigen
// globalThis.window/document auf diesen Satz; alle vorher importierten
// main.js-Instanzen halten ihre ALTEN Referenzen (sie sind ab dann tot, weil
// ihre rAF-Warteschlange nicht mehr bedient wird).
function mkStubs({ search = '', storage = mkStorage() } = {}) {
  const createdCanvases = [];
  function makeCanvas() {
    const c = { width: 0, height: 0, style: {}, ownerDocument: null };
    c.getContext = () => (c._ctx || (c._ctx = makeCtx(c)));
    c.addEventListener = () => {};
    c.getBoundingClientRect = () => ({ left: 0, top: 0, width: 320, height: 180 });
    createdCanvases.push(c);
    return c;
  }
  const winListeners = {};
  const docListeners = {};
  const rafQ = [];
  const win = {
    addEventListener: (t, f) => (winListeners[t] = winListeners[t] || []).push(f),
    devicePixelRatio: 1,
    innerWidth: 960,
    innerHeight: 540,
    location: { search },
    requestAnimationFrame: (cb) => rafQ.push(cb),
  };
  if (storage) win.localStorage = storage;
  const mainCanvas = { width: 320, height: 180, style: {} };
  const doc = {
    getElementById: () => mainCanvas,
    createElement: () => makeCanvas(),
    addEventListener: (t, f) => (docListeners[t] = docListeners[t] || []).push(f),
    defaultView: win,
    hidden: false,
  };
  mainCanvas.getContext = () => (mainCanvas._ctx || (mainCanvas._ctx = makeCtx(mainCanvas)));
  mainCanvas.addEventListener = () => {};
  mainCanvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 320, height: 180 });
  mainCanvas.ownerDocument = doc;
  globalThis.window = win;
  globalThis.document = doc;

  const b = {
    win, doc, mainCanvas, rafQ, createdCanvases, winListeners, docListeners,
    nameOf: new Map(),
    frame() {
      ops.length = 0;
      const cb = rafQ.shift();
      if (!cb) throw new Error('kein rAF-Callback (Boot tot?)');
      fakeTime += 1000 / 60;
      cb();
    },
    frames(n) { for (let i = 0; i < n; i++) b.frame(); },
    key(type, code) {
      for (const f of winListeners[type] || []) f({ code, repeat: false, preventDefault() {} });
    },
    tippe(code) { b.key('keydown', code); b.frame(); b.key('keyup', code); b.frame(); },
    feuereWin(type, ev = {}) { for (const f of winListeners[type] || []) f(ev); },
    feuereDoc(type, ev = {}) { for (const f of docListeners[type] || []) f(ev); },
    // --- Leser ---
    texte: () => ops.filter((o) => o.op === 'fillText').map((o) => o.text),
    hatText: (t) => b.texte().some((s) => s.includes(t)),
    goldText: () => b.texte().find((s) => s.startsWith('GOLD')),
    ambient: () => {
      const f = ops.find((o) => o.op === 'fillRect' && o.canvas !== mainCanvas && o.alpha > 0 && o.alpha < 1);
      return f ? f.alpha : null;
    },
    sprite: (name) => ops.filter((o) => o.op === 'drawImage' && o.canvas === mainCanvas
      && b.nameOf.get(o.img) === name).length,
  };
  return b;
}

// main.js baut seine Sprites bei JEDEM Modul-Start neu (main.js:78-99) — die
// Zuordnung Canvas -> Sprite-Name entsteht deshalb pro Boot aus der
// Erzeugungsreihenfolge, wie in check_main_slice1.
function benenne(b) {
  b.createdCanvases.forEach((c, i) => b.nameOf.set(c, ORDERED[i] || `extra_${i}`));
}

// ===========================================================================
// BOOT 1 — leerer Storage, ?god=1&map=CATACOMBS
// ===========================================================================
console.log('--- BOOT 1: frischer Start, leerer Spielstand ---');
const b1 = mkStubs({ search: '?god=1&map=CATACOMBS' });
await import('../game/js/main.js');
benenne(b1);

b1.frames(5);
ok(b1.hatText('GRIMLIGHT'), 'Boot 1: Titelbildschirm sichtbar');
ok(b1.hatText('ENTER'), 'Boot 1: OHNE Spielstand steht der Bestands-Blinktext da (kein Menue)');
ok(!b1.hatText('FORTSETZEN') && !b1.hatText('NEUES SPIEL'),
  'Boot 1: OHNE Spielstand gibt es KEIN Titel-Menue (Titel byte-gleich zum Bestand)');
ok(standRoh() === null, 'Boot 1: der Storage ist leer — der Titel liest nur, er schreibt nie');

b1.key('keydown', 'Enter'); b1.key('keyup', 'Enter');
b1.frames(3);
ok(Math.abs(b1.ambient() - 0.55) < 1e-9,
  `Boot 1: ?map=CATACOMBS geladen (ambient 0.55, ist ${b1.ambient()})`);
ok(b1.goldText() === 'GOLD 500', `Boot 1: GOD-Ausstattung steht (${b1.goldText()})`);
ok(b1.hatText('GOTT'), 'Boot 1: der GOTT-Hinweis ist sichtbar');
ok(b1.sprite('heart_full') === 3, `Boot 1: 3 volle Herzen (ist ${b1.sprite('heart_full')})`);
ok(b1.sprite('icon_boomerang') > 0, 'Boot 1: der GOD-Bumerang liegt in der HUD-Item-Box');
b1.frames(30);
ok(standRoh() === null,
  '§3.2 Boot 1: im resetRun-Pfad wird NIE gespeichert (Storage nach 33 Spielframes weiter leer)');

// --- §4.1 (c): visibilitychange -> Auto-Save + Pause -----------------------
b1.doc.hidden = true;
b1.feuereDoc('visibilitychange', {});
b1.frames(2);
ok(b1.hatText('PAUSE'), '§4.1 Boot 1: visibilitychange zeigt das Pause-Overlay');
ok(b1.hatText('WEITER') && b1.hatText('GOTT: AN') && b1.hatText('FPS: AUS'),
  '§4.1/§4.3/§6.4 Boot 1: das Pause-Menue traegt WEITER, GOTT- und FPS-Schalter');
const gespeichert = standRoh();
ok(gespeichert !== null, '§3.2 Boot 1: visibilitychange hat den Stand geschrieben');

const s1 = stand();
ok(!!s1 && s1.v === 1, `§3.1 Boot 1: Stand traegt Schema v1 (ist ${s1 && s1.v})`);
ok(!!s1 && s1.mapKey === 'CATACOMBS' && s1.spawn.x === MAPS.CATACOMBS.playerSpawn.x
  && s1.spawn.y === MAPS.CATACOMBS.playerSpawn.y,
  `§3.1 Boot 1: Karte + Eintritts-Spawn im Stand (${s1 && s1.mapKey} ${JSON.stringify(s1 && s1.spawn)})`);
ok(!!s1 && s1.gold === 500 && s1.hp > 0 && s1.potions === 0,
  `§3.1 Boot 1: Gold/hp/Traenke im Stand (${s1 && s1.gold}/${s1 && s1.hp}/${s1 && s1.potions})`);
ok(!!s1 && Array.isArray(s1.inv.zelda) && s1.inv.zelda.includes('boomerang'),
  '§3.1 Boot 1: die Zelda-Schiene (Bumerang) steht im Stand');
ok(!!s1 && !Object.hasOwn(s1, 'maxHp') && !gespeichert.includes('maxHp'),
  '§3.1 Boot 1: maxHp wurde NICHT gespeichert (es wird beim Laden abgeleitet)');
ok(!!s1 && !Object.hasOwn(s1, 'god') && !gespeichert.includes('god'),
  '§9 Boot 1: GOTT steht NICHT im Stand');
ok(!!s1 && s1.runFlags && s1.runFlags.bossDead === false
  && Array.isArray(s1.runFlags.openedChests) && s1.runFlags.openedChests.length === 0,
  `§3.4 Boot 1: runFlags im Stand (${JSON.stringify(s1 && s1.runFlags)})`);

// --- §4.2: Escape verlaesst die Pause, §4.1 (c): pagehide schreibt auch ----
b1.doc.hidden = false;
b1.tippe('Escape');
b1.frames(2);
ok(!b1.hatText('PAUSE') && b1.goldText() === 'GOLD 500',
  '§4.2 Boot 1: Escape setzt das Spiel fort (Overlay weg, Welt steht)');
SPEICHER.delete(SAVE_KEY);
b1.feuereWin('pagehide', {});
b1.frames(2);
ok(standRoh() !== null, '§4.1 Boot 1: auch pagehide schreibt den Stand (Android-Kill ohne zweiten Callback)');
ok(b1.hatText('PAUSE'), '§4.1 Boot 1: pagehide pausiert ebenfalls');
const standNachBoot1 = standRoh();

// ===========================================================================
// BOOT 2 — simulierter App-Neustart: FRISCHE Stubs, derselbe Storage
// ===========================================================================
console.log('--- BOOT 2: Neustart mit vorhandenem Spielstand (FORTSETZEN) ---');
const b2 = mkStubs({ search: '' });   // kein ?god, kein ?map — wie in der App
await import('../game/js/main.js?boot=2');
benenne(b2);

b2.frames(5);
ok(b2.hatText('GRIMLIGHT'), 'Boot 2: Titel steht');
ok(b2.hatText('FORTSETZEN') && b2.hatText('NEUES SPIEL'),
  '§3.3 Boot 2: MIT Spielstand zeigt der Titel das Menue');
ok(!b2.hatText('ENTER'), '§3.3 Boot 2: der Blinktext weicht dem Menue (kein Doppel-Hinweis)');
ok(standRoh() === standNachBoot1, '§3.3 Boot 2: der Titel selbst laesst den Stand unberuehrt');

b2.key('keydown', 'Enter'); b2.key('keyup', 'Enter');
b2.frames(3);
ok(Math.abs(b2.ambient() - 0.55) < 1e-9,
  `§3.1 Boot 2: FORTSETZEN laedt die gespeicherte Karte CATACOMBS (ambient ist ${b2.ambient()})`);
ok(b2.goldText() === 'GOLD 500', `§3.1 Boot 2: Gold ueberlebt den Neustart (${b2.goldText()})`);
ok(b2.sprite('icon_boomerang') > 0,
  '§3.1 Boot 2: der Bumerang ist wieder im Inventar (Zelda-Schiene wiederhergestellt)');
ok(b2.sprite('heart_full') === 3 && b2.sprite('heart_empty') === 0,
  `§3.1 Boot 2: hp voll wiederhergestellt (${b2.sprite('heart_full')} voll / ${b2.sprite('heart_empty')} leer)`);
ok(!b2.hatText('GOTT'),
  '§9 Boot 2: GOTT ist NICHT wiedergekehrt (kein Query-Parameter, nicht im Stand)');
ok(standRoh() === standNachBoot1, '§3.2 Boot 2: das reine Laden schreibt nicht zurueck');
b2.frames(30);
ok(!b2.hatText('GAME OVER'), '§3.1 Boot 2: der geladene Spieler ueberlebt (hp > 0 im Stand erzwungen)');

// ===========================================================================
// BOOT 3 — NEUES SPIEL
// ===========================================================================
console.log('--- BOOT 3: NEUES SPIEL laesst den alten Stand stehen ---');
const b3 = mkStubs({ search: '' });
await import('../game/js/main.js?boot=3');
benenne(b3);

b3.frames(5);
ok(b3.hatText('FORTSETZEN') && b3.hatText('NEUES SPIEL'), 'Boot 3: Menue steht');
b3.key('keydown', 'ArrowDown'); b3.frame(); b3.key('keyup', 'ArrowDown'); b3.frame();
b3.key('keydown', 'Enter'); b3.key('keyup', 'Enter');
b3.frames(3);
ok(Math.abs(b3.ambient() - 0.22) < 1e-9,
  `§3.3 Boot 3: NEUES SPIEL startet auf dem Friedhof (ambient 0.22, ist ${b3.ambient()})`);
ok(b3.goldText() === 'GOLD 0', `§3.3 Boot 3: frischer Run ohne Gold (${b3.goldText()})`);
ok(b3.sprite('icon_boomerang') === 0, '§3.3 Boot 3: frischer Run ohne Bumerang');
ok(standRoh() === standNachBoot1,
  '§3.3 Boot 3: "NEU verliert nichts" — der alte Stand steht unveraendert im Storage');
b3.frames(60);
ok(standRoh() === standNachBoot1,
  '§3.2 Boot 3: auch nach 60 Frames im neuen Run ist der alte Stand unangetastet (kein Hook feuert)');

// ===========================================================================
// BOOT 4 — kaputter Stand
// ===========================================================================
console.log('--- BOOT 4: kaputter Spielstand wird hart abgelehnt ---');
SPEICHER.set(SAVE_KEY, '{"v":1,"mapKey":"CATA');
const b4 = mkStubs({ search: '' });
await import('../game/js/main.js?boot=4');
benenne(b4);
b4.frames(5);
ok(b4.hatText('GRIMLIGHT') && b4.hatText('ENTER'),
  '§3.1 Boot 4: kaputter Stand -> Titel byte-gleich zum Bestand (Blinktext statt Menue)');
ok(!b4.hatText('FORTSETZEN'), '§3.1 Boot 4: kein FORTSETZEN aus einem kaputten Stand');
b4.key('keydown', 'Enter'); b4.key('keyup', 'Enter');
b4.frames(3);
ok(Math.abs(b4.ambient() - 0.22) < 1e-9 && b4.goldText() === 'GOLD 0',
  '§3.1 Boot 4: ENTER startet trotzdem sofort einen frischen Run');

// Auch ein SCHEMA-fremder (aber syntaktisch gueltiger) Stand fliegt raus.
SPEICHER.set(SAVE_KEY, JSON.stringify({ ...JSON.parse(standNachBoot1), v: 2 }));
const b4b = mkStubs({ search: '' });
await import('../game/js/main.js?boot=4b');
benenne(b4b);
b4b.frames(5);
ok(!b4b.hatText('FORTSETZEN') && b4b.hatText('ENTER'),
  '§3.1 Boot 4b: fremde Schema-Version -> kein Menue (ein v2-Stand kann nichts kaputt machen)');

// ===========================================================================
// BOOT 5 — GAR KEIN localStorage (Zustand der drei kanonischen Flusstests)
// ===========================================================================
console.log('--- BOOT 5: ohne localStorage (Guard-Pflicht §0.2) ---');
const b5 = mkStubs({ search: '', storage: null });
ok(globalThis.window.localStorage === undefined,
  '§0.2 Boot 5: Vorbedingung — das window des Stubs hat KEIN localStorage');
await import('../game/js/main.js?boot=5');
benenne(b5);
b5.frames(5);
ok(b5.hatText('GRIMLIGHT') && b5.hatText('ENTER'),
  '§0.2 Boot 5: ohne Storage startet das Spiel und der Titel bleibt byte-gleich zum Bestand');
b5.key('keydown', 'Enter'); b5.key('keyup', 'Enter');
b5.frames(3);
ok(Math.abs(b5.ambient() - 0.22) < 1e-9 && b5.goldText() === 'GOLD 0',
  '§0.2 Boot 5: ohne Storage laeuft der Run normal (kein Wurf im Boot-Pfad)');
b5.doc.hidden = true;
b5.feuereDoc('visibilitychange', {});
b5.frames(2);
ok(b5.hatText('PAUSE'),
  '§4.1 Boot 5: die Pause funktioniert auch ohne Storage (Auto-Save laeuft still ins Leere)');

if (process.exitCode) console.error('CHECK ROT');
else console.log(`CHECK GRÜN (${checks} Assertions)`);
