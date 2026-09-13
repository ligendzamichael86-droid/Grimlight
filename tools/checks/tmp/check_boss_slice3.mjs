// Wegwerf-Flusstest (Integrator C, Slice 3): Boss-/Progression-/Respawn-Fluss
// headless durch main.js. Ersetzt check_victory_slice1.mjs (erlaubte Alt-Test-
// Aenderung #2, §4) — der Sieg findet nicht mehr in den Katakomben, sondern
// hinter dem Grabwaechter statt.
//
// DOM-Stub wie die bestehenden Flusstests. Zusaetzlich INSTRUMENTIERUNG ueber
// registerEnemyKind: der graveward-Creator/-Update wird umhuellt, damit der
// Test Referenzen auf Boss, Spieler und die enemies-Liste bekommt (main.js hat
// keine Exporte). So lassen sich Boss-HP fuer Phasen/Tod deterministisch
// stellen und der Spieler waehrend der erzwungenen Treffer am Leben halten —
// dieselbe Legitimation wie invulnTimer im smoke_test. Ein idle Decoy-Boss in
// der FLUESTERGRUFT liefert die Spieler-Referenz auch dort (fuer den carry-
// Waechter und die Schluessel-Injektion). Positions-Asserts entfallen zugunsten
// direkter Referenz-Lesungen.

import { registerEnemyKind, createSkeleton } from '../game/js/entities/enemies.js';
import { createGraveward, updateGraveward, drawGraveward } from '../game/js/entities/boss.js';

let checks = 0;
function ok(cond, msg) {
  checks++;
  if (cond) console.log(`  ok  ${msg}`);
  else {
    console.error(`FEHLER: ${msg}`);
    process.exitCode = 1;
  }
}

// --- Instrumentierung: graveward umhuellen (VOR dem main.js-Import) ----------
let playerRef = null;
let enemiesRef = null;
registerEnemyKind(
  'graveward',
  (spawn) => createGraveward(spawn),
  (dt, e, player, map, enemies, events) => {
    playerRef = player;
    enemiesRef = enemies;
    return updateGraveward(dt, e, player, map, enemies, events);
  },
  drawGraveward
);
const curBoss = () => (enemiesRef ? enemiesRef.find((e) => e.kind === 'graveward') : null);
const livingAdds = () => (enemiesRef ? enemiesRef.filter((e) => e.summoned && e.state !== 'die').length : 0);

// --- Stubs -------------------------------------------------------------------
Math.random = () => 0.5;

const ops = [];
function makeCtx(canvas) {
  return {
    canvas,
    imageSmoothingEnabled: false,
    globalAlpha: 1, globalCompositeOperation: 'source-over',
    fillStyle: '', strokeStyle: '', lineWidth: 1,
    font: '', textAlign: '', textBaseline: '',
    _stack: [],
    fillRect(...a) { ops.push({ canvas, op: 'fillRect', alpha: this.globalAlpha, fillStyle: this.fillStyle, args: a }); },
    strokeRect() {}, clearRect() {},
    drawImage(img, ...a) { ops.push({ canvas, op: 'drawImage', img, args: a }); },
    fillText(text, x, y) { ops.push({ canvas, op: 'fillText', text, x, y }); },
    beginPath() {}, arc() {}, fill() {}, stroke() {}, translate() {}, rotate() {},
    save() { this._stack.push({ a: this.globalAlpha, f: this.fillStyle }); },
    restore() { const s = this._stack.pop(); if (s) { this.globalAlpha = s.a; this.fillStyle = s.f; } },
    createRadialGradient: () => ({ addColorStop() {} }),
  };
}
function makeCanvas() {
  const c = { width: 0, height: 0, style: {}, ownerDocument: null };
  c.getContext = () => (c._ctx || (c._ctx = makeCtx(c)));
  c.addEventListener = () => {};
  c.getBoundingClientRect = () => ({ left: 0, top: 0, width: 320, height: 180 });
  return c;
}
const winListeners = {};
const rafQ = [];
const fakeWindow = {
  addEventListener: (t, f) => (winListeners[t] = winListeners[t] || []).push(f),
  devicePixelRatio: 1, innerWidth: 960, innerHeight: 540,
  location: { search: '?map=BOSS_KAMMER' },
  requestAnimationFrame: (cb) => rafQ.push(cb),
};
const mainCanvas = { width: 320, height: 180, style: {} };
const fakeDocument = {
  getElementById: () => mainCanvas,
  createElement: () => makeCanvas(),
  addEventListener: () => {},
  defaultView: fakeWindow, hidden: false,
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

// Decoy-Boss (idle) in die FLUESTERGRUFT injizieren, um dort playerRef zu
// bekommen (weit weg vom Ankunfts-Spawn tc(20,20), bleibt idle).
const { MAPS } = await import('../game/js/world/maps.js');
MAPS.FLUESTERGRUFT.enemySpawns = [...MAPS.FLUESTERGRUFT.enemySpawns, { x: 72, y: 72, kind: 'graveward' }];

await import('../game/js/main.js');

// --- Frame-Treiber + Leser ---------------------------------------------------
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
function ambientAlpha() {
  const f = ops.find((o) => o.op === 'fillRect' && o.canvas !== mainCanvas && o.alpha > 0 && o.alpha < 1);
  return f ? f.alpha : null;
}
function tp(cx, cy) { if (playerRef) { playerRef.x = cx - playerRef.w / 2; playerRef.y = cy - playerRef.h / 2; } }
function keep() { if (playerRef) { playerRef.invulnTimer = 999; playerRef.hp = playerRef.maxHp; } }
// Ein Frame, Spieler an (cx,cy) fixiert und am Leben gehalten.
function pin(cx, cy) { tp(cx, cy); keep(); frame(); }
// Nach dem Portal-Trigger ausklingen lassen: waehrend des Fades (2x0,3 s)
// laufen KEINE Welt-Updates, danach frischt der erste Spiel-Frame die Refs auf.
// So werden Boss/Spieler-Referenzen erst nach dem vollstaendigen Map-Wechsel
// gelesen (sonst zeigen sie noch auf die alte Map).
function settle(n = 48) { for (let i = 0; i < n; i++) { keep(); frame(); } }

// ===========================================================================
// TEIL A: Portal-Gate, carry, Bosskampf, Sieg
// ===========================================================================

// 1. Titel → Enter → BOSS_KAMMER (Dev-Parameter)
frames(5);
ok(hasText('GRIMLIGHT'), 'Titelbildschirm sichtbar');
key('keydown', 'Enter'); key('keyup', 'Enter');
frames(4);
ok(Math.abs(ambientAlpha() - 0.48) < 1e-9, `?map=BOSS_KAMMER: ambient 0.48 (ist ${ambientAlpha()})`);
ok(curBoss() && curBoss().state === 'idle', 'Boss startet idle');
ok(hasText('GRABWAECHTER'), "Namens-Toast 'GRABWAECHTER' beim Betreten");

// 2. Progression setzen (fuer den carry-Waechter), noch KEIN Schluessel
playerRef.prog.xp = 37; playerRef.prog.level = 3; playerRef.prog.hearts = 1;
playerRef.recalcStats(); playerRef.hp = playerRef.maxHp;
const maxHpBefore = playerRef.maxHp; // 6 + (3-1)*2 + 1*2 = 12
ok(maxHpBefore === 12, `maxHp aus Level 3 + 1 Herz = 12 (ist ${maxHpBefore})`);

// 3. Rueck-Portal passierbar solange der Boss idle ist → FLUESTERGRUFT
frame(); // ein Frame off-portal → Portal wird scharf
tp(160, 168); keep(); frame(); // auf das Rueck-Portal (Zentrum 160,168) → Fade
settle(); // Fade + erster Spiel-Frame der FLUESTERGRUFT (Refs frischen auf)
ok(Math.abs(ambientAlpha() - 0.52) < 1e-9,
  `Rueck-Portal passierbar solange der Boss idle ist (→ FLUESTERGRUFT, ambient ${ambientAlpha()})`);
ok(playerRef && playerRef.prog.xp === 37 && playerRef.prog.level === 3 && playerRef.prog.hearts === 1,
  `carry-Waechter: xp/Level/Herzen ueberleben den Map-Wechsel (${playerRef.prog.xp}/${playerRef.prog.level}/${playerRef.prog.hearts})`);
ok(playerRef.maxHp === maxHpBefore, `maxHp identisch nach Wechsel (${playerRef.maxHp})`);

// 4. Boss-Portal OHNE Schluessel: VERSCHLOSSEN, kein Uebergang
tp(328, 344); keep(); frame(); // auf das D-Portal tileRect(20,21), Zentrum 328,344
ok(Math.abs(ambientAlpha() - 0.52) < 1e-9, 'ohne Schluessel bleibt der Spieler in der FLUESTERGRUFT');
ok(hasText('VERSCHLOSSEN'), "Boss-Portal ohne Schluessel: Toast 'VERSCHLOSSEN'");

// 5. Schluessel geben → Uebergang zurueck in die BOSS_KAMMER
playerRef.inv.zelda.push('boss_key');
tp(328, 344); keep(); frame(); // erneut ins Boss-Portal → Fade
settle();
ok(Math.abs(ambientAlpha() - 0.48) < 1e-9, `mit Schluessel: Uebergang in die BOSS_KAMMER (ambient ${ambientAlpha()})`);
ok(curBoss() && curBoss().state === 'idle' && curBoss().hp === curBoss().maxHp,
  'Boss frisch und idle nach dem Betreten');
const xpAtFight = playerRef.prog.xp;
ok(xpAtFight === 37, `xp/Level identisch VOR dem Kampf (carry: ${xpAtFight})`);

// 6. Aggro (erster Treffer) → Boss stalk; Rueck-Portal VERSIEGELT
tp(168, 152); keep(); frame(); // off-portal → scharf
curBoss().hp = 25;
keep(); frame();
ok(curBoss().state !== 'idle', 'Annaeherung/Treffer weckt den Boss (idle → aktiv)');
for (let i = 0; i < 60; i++) pin(168, 152); // GRABWAECHTER-Toast ausklingen lassen
tp(160, 168); keep(); frame(); // Rueck-Portal antesten
ok(Math.abs(ambientAlpha() - 0.48) < 1e-9 && hasText('VERSIEGELT'),
  "Rueck-Portal VERSIEGELT solange der Kampf laeuft (Toast 'VERSIEGELT')");

// 7. Phasenwechsel + Beschwoerung bei 17/9, Adds gedeckelt
tp(168, 152);
let maxAdds = 0;
let sawSummon2 = false;
curBoss().hp = 16; // < 17 → Phase 2
for (let i = 0; i < 100; i++) { pin(168, 152); if (curBoss() && curBoss().state === 'summon') sawSummon2 = true; maxAdds = Math.max(maxAdds, livingAdds()); }
ok(sawSummon2 && livingAdds() === 2, `Phase 2 bei hp<17: 2 Adds beschworen (adds=${livingAdds()})`);
let sawSummon3 = false;
curBoss().hp = 8; // < 9 → Phase 3
for (let i = 0; i < 100; i++) { pin(168, 152); if (curBoss() && curBoss().state === 'summon') sawSummon3 = true; maxAdds = Math.max(maxAdds, livingAdds()); }
ok(sawSummon3, 'Phase 3 bei hp<9: erneute Ruf-Pose');
ok(maxAdds <= 2, `Adds nie mehr als 2 gleichzeitig (max=${maxAdds})`);
const addsBeforeKill = livingAdds();
ok(addsBeforeKill >= 1, `vor dem Boss-Tod leben Adds (${addsBeforeKill})`);

// 8. Boss toeten (erzwungener Schwert-Treffer im stuck) → boss_died. Den Boss
// auf eine feste Position setzen (er ist waehrend der Phasen gewandert), damit
// der Schwert-Treffer sicher landet.
{
  const b = curBoss();
  b.x = 158; b.y = 60;   // Zentrum (168,72)
  b.state = 'stuck'; b.stateTimer = 20; b.hp = 1; b.contactDamage = 0;
}
key('keydown', 'KeyJ');
let bossDying = false;
for (let i = 0; i < 90 && !bossDying; i++) {
  if (playerRef) playerRef.facing = 'up';
  pin(168, 92); // unter dem Boss, Schwert nach oben in die AABB
  bossDying = curBoss() ? curBoss().state === 'die' : true;
}
key('keyup', 'KeyJ');
ok(bossDying, 'Boss stirbt durch erzwungenen Schwert-Treffer (hp 0 → die)');
frames(70); // 1,0 s Sterbephase → boss_died (Adds zerbroeseln, Muenzen + Siegtruhe)
ok(livingAdds() === 0, 'Boss-Tod zerbroeselt alle Adds (keine lebenden Adds mehr)');

// 9. Siegtruhe hinter dem toten Boss oeffnen → chest_opened → 1,2 s → Sieg
key('keydown', 'KeyJ');
let won = false;
for (let i = 0; i < 200 && !won; i++) {
  if (playerRef) playerRef.facing = 'up';
  pin(168, 92); // unter der Siegtruhe bei tc(10,4)
  won = hasText('SIEG');
}
key('keyup', 'KeyJ');
ok(won, 'Siegtruhe geoeffnet → SIEG-Banner');
ok(hasText('bezwungen'), "Victory-Text 'Der Grabwaechter ist bezwungen.'");
ok(hasText('STUFE 3'), 'Victory-Screen zeigt die STUFE-Zeile (STUFE 3)');

// ===========================================================================
// TEIL B: Tod in der BOSS_KAMMER → Zoll → Respawn
// ===========================================================================

// 10. Victory-Enter → resetRun → frischer Run in der BOSS_KAMMER
frames(50); // Mindest-Anzeigezeit
key('keydown', 'Enter'); key('keyup', 'Enter');
frames(5);
ok(Math.abs(ambientAlpha() - 0.48) < 1e-9 && curBoss() && curBoss().state === 'idle',
  'Neustart nach Sieg: frischer Boss idle in der BOSS_KAMMER');

// Progression + Gold setzen, Boss aggro, dann Spieler toeten
playerRef.gold = 40;
playerRef.prog.xp = 25; playerRef.prog.level = 2; playerRef.recalcStats();
const maxHpB = playerRef.maxHp; // 6 + (2-1)*2 = 8
frame();
curBoss().hp = 25; keep(); frame(); // Aggro
playerRef.hp = 0; playerRef.invulnTimer = 0;
frame();
ok(hasText('GAME OVER'), 'Tod in der BOSS_KAMMER → GAME OVER');
ok(hasText('DER TOD FORDERT SEINEN ZOLL') && hasText('-20 GOLD'),
  'Game-Over-Screen zeigt die Gold-Zoll-Zeile (-20 GOLD bei 40)');

// 11. Respawn: Enter → am Kammer-Eingang, Boss frisch idle, Gold halbiert,
// Level/XP erhalten, hp = maxHp
frames(50);
key('keydown', 'Enter'); key('keyup', 'Enter');
frames(5);
ok(Math.abs(ambientAlpha() - 0.48) < 1e-9, 'Respawn in der BOSS_KAMMER (kein Titel/Reset)');
ok(curBoss() && curBoss().state === 'idle' && curBoss().hp === curBoss().maxHp,
  'Respawn: Boss frisch (volle HP, wieder idle)');
ok(playerRef.gold === 20, `Respawn: Gold halbiert (40 → ${playerRef.gold})`);
ok(playerRef.prog.level === 2 && playerRef.prog.xp === 25,
  `Respawn: Level/XP erhalten (L${playerRef.prog.level}, ${playerRef.prog.xp} XP)`);
ok(playerRef.hp === playerRef.maxHp && playerRef.maxHp === maxHpB,
  `Respawn: hp = maxHp (${playerRef.hp}/${playerRef.maxHp})`);

// 12. Rueck-Portal wieder passierbar solange der Boss idle bleibt
tp(168, 152); keep(); frame(); // off-portal → scharf
tp(160, 168); keep(); frame(); // ins Rueck-Portal → Fade
settle();
ok(Math.abs(ambientAlpha() - 0.52) < 1e-9,
  `Respawn: Rueck-Portal passierbar solange der Boss idle ist (ambient ${ambientAlpha()})`);

if (process.exitCode) console.error('CHECK ROT');
else console.log(`CHECK GRÜN (${checks} Assertions)`);
