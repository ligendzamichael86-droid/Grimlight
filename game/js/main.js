// Boot + State-Maschine. Einziges Modul, das Browser-Globals beim Import anfasst.

import { PALETTE } from './art/palette.js';
import { SPRITES, TILE_ART } from './art/sprites.js';
import { buildSprite, buildAll, buildTintMask } from './core/sprite_factory.js';
import { createLoop } from './core/loop.js';
import { createInput } from './core/input.js';
import { createCamera } from './core/camera.js';
import { createLighting, lightAt } from './core/lighting.js';
import { createParticles } from './core/particles.js';
import { createTilemap, litDitherCells, waterReflections } from './world/tilemap.js';
// Slice 3: boss.js EINMAL explizit importieren — das Modulende registriert
// kind 'graveward' im Verhaltens-Dispatch (registrierungs-/importreihenfolge-
// abhaengig, dokumentiertes Risiko §3).
import './entities/boss.js';
import { MAPS, portalBlocked, tc } from './world/maps.js';
import { aabbOverlap, hasEvent, getEvent } from './entities/entity.js';
import { createPlayer } from './entities/player.js';
import { createSkeleton, createGhoul, createEnemy, updateEnemies, updateDrops, drawEnemy, drawDrop, scatterDrop, eliteLights } from './entities/enemies.js';
import { createProps, updateProps, drawProp } from './entities/props.js';
import { createProjectiles, drawProjectile } from './entities/projectiles.js';
import { drawHUD, drawVignette, drawFog, drawTitle, drawGameOver, drawVictory, drawPickupToast } from './ui/hud.js';
import { createInventoryUI, drawInventoryUI } from './ui/inventory_ui.js';

const VIEW_W = 320;
const VIEW_H = 180;
const END_SCREEN_MIN_TIME = 0.7; // Mindest-Anzeigezeit Game-Over/Victory
const FADE_TIME = 0.3;           // je Richtung (zu / auf)
const VICTORY_DELAY = 1.2;       // Truhe offen → Sieg-Banner
const TORCH_RADIUS = 72;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// Ganzzahlige Skalierung in GERÄTEpixeln; Backing bleibt fest 320×180.
function resize() {
  const dpr = window.devicePixelRatio || 1;
  const scale = Math.max(
    1,
    Math.floor(Math.min((window.innerWidth * dpr) / VIEW_W, (window.innerHeight * dpr) / VIEW_H))
  );
  canvas.style.width = `${(scale * VIEW_W) / dpr}px`;
  canvas.style.height = `${(scale * VIEW_H) / dpr}px`;
}
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', resize);
resize();

const gfx = buildAll(SPRITES, PALETTE);
// Flip-Liste: ALLE Keys, die player.draw/drawEnemies links-gespiegelt
// anfordern — inkl. der neuen 4-Frame- und Ghul-Sprites (Slice 1) sowie
// Grufthund/Rostpanzer/Schild (Slice 2; hound_* und shield_side blicken
// in der Quelle nach RECHTS), sonst drawImage(undefined) → Konsolen-Fehler.
for (const key of [
  'player_side_0', 'player_side_1', 'player_side_2', 'player_side_3',
  'player_attack_side', 'sword_slash_side',
  'skeleton_0', 'skeleton_1', 'skeleton_die',
  'ghoul_0', 'ghoul_1', 'ghoul_die',
  'hound_0', 'hound_1', 'hound_telegraph', 'hound_leap', 'hound_down', 'hound_die',
  'rust_0', 'rust_1', 'rust_die', 'shield_side',
  // Slice 3: Grabwaechter-Flips AUSSCHLIESSLICH ans ENDE angehaengt (nach
  // shield_side). Die Bestandsreihenfolge ist EINGEFROREN — check_main_slice1
  // und check_inventory_slice2 mappen Canvas→Sprite ueber die
  // Erzeugungsreihenfolge; ein Einschub davor macht beide Alt-Tests rot.
  'warden_idle', 'warden_walk_0', 'warden_walk_1', 'warden_windup_a',
  'warden_windup_b', 'warden_dash', 'warden_stuck', 'warden_summon', 'warden_die',
]) {
  gfx[`${key}_flip`] = buildSprite(SPRITES[key], PALETTE, { flipX: true });
}
const tiles = buildAll(TILE_ART, PALETTE);

// ===========================================================================
// GRAFIKPASS 6 §4.2 — SPRITE-LICHT: MASKEN-REGISTRY + FASSADE.
//
// PROBLEM: Figuren und Props wurden bisher als flache Sprites gezeichnet und
// erst vom Dunkel-Overlay global gedimmt. Eine Figur NEBEN einer Fackel sah
// deshalb exakt so aus wie dieselbe Figur 200 px weiter im Dunkeln — nur
// heller. Es fehlten Lichtfarbe und Halbseiten-Modellierung (M3).
//
// LOESUNG: je Sprite-Canvas gibt es bis zu drei TINT-MASKEN (sprite_factory.
// buildTintMask) mit identischer Alpha-Form und zwei Toenen; sie werden mit
// kleinem globalAlpha per source-over UEBER das zuerst gezeichnete Original
// gelegt. Damit der Aufrufer nichts davon wissen muss, laeuft das Zeichnen der
// Welt-Entities durch eine FASSADE, die nur drawImage abfaengt.
//
// REGISTRY: Map<canvas, {name, grid}>. Sie wird HIER gebaut (nach dem
// gfx/tiles-Bau, §0.5 "neue Canvases erst nach main.js:71") und traegt fuer
// jeden gfx-Canvas das Quell-Grid. Fuer die _flip-Canvases wird das Grid
// SPALTENWEISE gespiegelt — sonst laege die Maske seitenverkehrt auf dem
// gespiegelten Sprite. Die Masken selbst entstehen LAZY beim ersten Bedarf
// (kein Canvas-Sturm beim Start, und alle Masken-Canvases liegen zeitlich
// hinter dem Boot).
const MASK_REG = new Map();
for (const name of Object.keys(gfx)) {
  const flip = name.endsWith('_flip');
  const grid = SPRITES[flip ? name.slice(0, -5) : name];
  if (!grid) continue;
  MASK_REG.set(gfx[name], {
    name,
    grid: flip ? grid.map((row) => [...row].reverse().join('')) : grid,
    masken: null, // lazy: { 'WL': canvas, 'WR': canvas, 'K:<tint>': canvas }
  });
}

// §4.2 Alphastufen. WARM: vier Stufen aus round(warm*3) — warm liegt auf dem
// 12er-Raster von lightAt, die Vergroeberung auf 4 Stufen haelt die Figur beim
// Gehen ruhig (mit 13 Stufen flackerte die Tinte texelweise mit).
// KALT: drei Stufen aus der DUNKELSTUFE (1 - f); f = 1 ist der Kegelkern
// (keine Kaelte), f = 0 das Fernfeld (volle Kaelte).
const WARM_ALPHA = [0, 0.12, 0.24, 0.36];
const KALT_ALPHA = [0, 0.08, 0.16];
// §4.2 Warm-Toene: der Kern-Ton des Warm-Passes (216,114,42 = #d8722a, siehe
// GLOW_RINGS in lighting.js) als HELLE Seite, eine um ~20 % abgedunkelte
// Variante (176,88,34 = #b05822) als lichtabgewandte Seite.
const WARM_HELL = '#d8722a';
const WARM_DUNKEL = '#b05822';

// KALT-PAAR je Karte: der ambientTint der Map ist der dunkle Ton, eine um 22
// Stufen je Kanal angehobene Fassung der helle. Damit traegt die Schattenseite
// EXAKT die Farbtemperatur, die das Dunkel-Overlay derselben Karte auf den
// Boden legt (Friedhof blauviolett, Katakomben kaltblau, Gruft gruenschwarz,
// Bosskammer rotbraun) — Figur und Grund stehen im selben Licht.
function kaltPaar(tint) {
  const hex = /^#([0-9a-f]{6})$/i.exec(String(tint || '#050510'));
  const v = hex ? parseInt(hex[1], 16) : 0x050510;
  const r = (v >> 16) & 255, g = (v >> 8) & 255, b = v & 255;
  const lift = (c) => Math.min(255, c + 22);
  const hx = (c) => c.toString(16).padStart(2, '0');
  return { dunkel: `#${hx(r)}${hx(g)}${hx(b)}`, hell: `#${hx(lift(r))}${hx(lift(g))}${hx(lift(b))}` };
}

// Maske holen/bauen. art: 'WL' | 'WR' (warm, helle Seite links/rechts) oder
// 'K' (kalt, Ton-Paar der AKTUELLEN Karte -> Cache-Schluessel traegt den Tint).
function tintMaske(eintrag, art) {
  if (!eintrag.masken) eintrag.masken = {};
  const tint = art === 'K' ? (mapDef && mapDef.ambientTint) || '#050510' : '';
  const key = art === 'K' ? `K:${tint}` : art;
  let m = eintrag.masken[key];
  if (m === undefined) {
    if (art === 'K') {
      const paar = kaltPaar(tint);
      // Richtung 'L' FEST (Deklaration §9): der Kalt-Pass hat keine
      // Lichtquelle, aus der sich eine Seite ableiten liesse. 'L' folgt der
      // Art-Direction-Konvention "Licht von oben-links" und gibt der Figur im
      // Dunkeln einen Volumenhinweis statt einer flachen Faerbung.
      m = buildTintMask(eintrag.grid, PALETTE, paar.dunkel, paar.hell, 'L');
    } else {
      m = buildTintMask(eintrag.grid, PALETTE, WARM_DUNKEL, WARM_HELL, art === 'WL' ? 'L' : 'R');
    }
    eintrag.masken[key] = m;
  }
  return m;
}

// Aktive Toenung des gerade gezeichneten Renderables. Wird VOR jedem r.draw()
// gesetzt; r.draw() ist synchron, ein zweiter Zustand kann also nie entstehen.
const tintCfg = { on: false, warmA: 0, kaltA: 0, seite: 'WL' };

// Der abgefangene drawImage-Zug der Fassade.
function tintDrawImage(img, ...a) {
  ctx.drawImage(img, ...a); // §0.5 WAECHTER B: der ERSTE Draw ist IMMER das Original
  if (!tintCfg.on) return;
  const eintrag = MASK_REG.get(img);
  if (!eintrag) return; // Tiles, Fringes, HUD-Icons: nicht registriert -> nichts
  const wA = tintCfg.warmA;
  const kA = tintCfg.kaltA;
  if (wA <= 0 && kA <= 0) return;
  // Zustand des Aufrufers sichern: manche Zeichner blinken ueber globalAlpha.
  // Die Masken skalieren mit (eine halb transparente Figur bekommt auch nur
  // halbe Tinte); bei globalAlpha 1 — dem Normalfall und dem Messfall M3 —
  // stehen die Stufen exakt auf den Spec-Werten.
  const vorA = ctx.globalAlpha;
  const vorG = ctx.globalCompositeOperation;
  ctx.globalCompositeOperation = 'source-over'; // §4.2: NIE 'lighter' auf Sprites
  if (kA > 0) {
    ctx.globalAlpha = kA * vorA;
    ctx.drawImage(tintMaske(eintrag, 'K'), ...a);
    ctx.globalAlpha = 1; // §4.2: nach JEDEM Masken-Draw
  }
  if (wA > 0) {
    ctx.globalAlpha = wA * vorA;
    ctx.drawImage(tintMaske(eintrag, tintCfg.seite), ...a);
    ctx.globalAlpha = 1; // §4.2: nach JEDEM Masken-Draw
  }
  ctx.globalCompositeOperation = vorG;
  if (vorA !== 1) ctx.globalAlpha = vorA;
}

// DIE FASSADE. Ein Proxy auf den echten ctx: alle Eigenschaften und Methoden
// gehen unveraendert durch (Methoden an den echten ctx gebunden, damit `this`
// stimmt), NUR drawImage wird ersetzt. Der Proxy entsteht EINMAL; die
// Zeichen-Closures bekommen ihn beim renderables-Bau als ctx-Argument
// (§4.2 korrigierter Bauort — eine Fassade "um die Schleife" erreicht die
// lexikalisch gebundenen ctx der Closures nicht).
const tintCtx = new Proxy(ctx, {
  get(t, p) {
    if (p === 'drawImage') return tintDrawImage;
    const v = t[p];
    return typeof v === 'function' ? v.bind(t) : v;
  },
  set(t, p, v) { t[p] = v; return true; },
});

// §4.1 HYSTERESE-SPEICHER. lightAt ist PURE — den Zustand haelt der Aufrufer.
// Je ENTITY (Spieler/Gegner/Prop, Objektidentitaet) merken wir das letzte
// Rueckgabeobjekt und reichen es beim naechsten Frame als 6. Argument herein.
// Ohne das stroboskopiert eine STEHENDE Figur mit 4 Stufenwechseln je Sekunde
// (Review P2-M-5). WeakMap, damit Map-Wechsel (buildWorld erzeugt neue
// Entities) nichts leaken.
const TINT_PREV = new WeakMap();

const input = createInput();
input.attach(canvas);
const camera = createCamera(VIEW_W, VIEW_H);
const lighting = createLighting(VIEW_W, VIEW_H);
// Grafikpass 3 §2.4: Glut-Funken über Fackeln (moderne Alpha-Deko). Einmal
// erzeugt, überlebt Map-Wechsel (Liste wird in buildWorld geleert).
const particles = createParticles();

// Dev-Parameter ?map=CATACOMBS: Start-Map nach dem Titel. Nur hier wird
// location.search geparst, kein Einfluss auf andere Module.
let startMapKey = 'GRAVEYARD';
{
  const q = new URLSearchParams(window.location.search).get('map');
  // Object.hasOwn statt truthy-Lookup: sonst treffen geerbte
  // Object.prototype-Keys (?map=constructor, ?map=toString, …) und
  // buildWorld crasht mit mapDef.rows === undefined.
  if (q && Object.hasOwn(MAPS, q)) startMapKey = q;
}

// Dev-Parameter ?god=1: GOD-MODE (Testwerkzeug fuer den Auftraggeber).
// Unverwundbar + Schaden x10 + Tempo x1,4 + 500 Gold + Bumerang, sichtbar
// als gelbes GOTT oben rechts. Gelesen wie ?map= — location.search wird
// AUSSCHLIESSLICH hier angefasst, alle anderen Module bleiben Node-importierbar.
// Ohne den Parameter ist godMode false und jede Abzweigung tot.
const godMode = new URLSearchParams(window.location.search).get('god') === '1';

let state = 'title';
let stateTime = 0;
let timeSec = 0;
let mapDef = null;
let map = null;
let player = null;
let enemies = [];
let props = [];
let drops = [];
let lights = [];       // Fackeln + Spieler-Laterne (letzter Eintrag)
let playerLight = null;
let portalsArmed = []; // Portal erst scharf, wenn Spieler es einmal verlassen hat
let fadePhase = 'none'; // 'none' | 'out' | 'in'
let fadeT = 0;
let pendingPortal = null;
// Victory-Countdown lebt als main.js-State: er überlebt Map-Wechsel
// (buildWorld leert events) und wird bei Tod verworfen (Spec-Review-Klärung).
let victoryTimer = 0;
const events = [];
// Slice 2: Projektile (Bumerang), Inventar-Panel, Pickup-Toast und der
// HUD-Spiegel für den Bumerang-Zustand (Fang-Blink 3 Frames).
let projectiles = null;
const inventoryUI = createInventoryUI();
let inventoryHeld = false; // Flanke fürs Öffnen (Muster potionHeld)
let attackSwallow = false; // schluckt den Angriffs-Pegel nach dem Inventar-Schliessen
// Slice 3: Toast traegt jetzt eine Prioritaet (level_up > key/heart/weapon_found
// > item_pickup > Rest). Ein Slot; ein neuer ersetzt den alten NUR bei >=
// Prioritaet (dokumentierte Abweichung von Slice 2 "ein neuer ersetzt den
// alten"; betrifft nur gleichzeitige Events im selben Frame, kein Alt-Test).
let toast = null;
let zeldaWasAir = false;
let zeldaBlink = 0;
// Slice 3: Progression/Boss-Run-Zustand.
let runFlags = { bossDead: false };   // Reset in resetRun
let lastSpawn = null;                 // fuer den Respawn (§2.6): letzter Eintritts-Spawn
let currentMapKey = null;             // aktuelle Map (Respawn zielt hierauf)
let levelupTimer = 0;                 // Ring-Effekt levelup_0/1, 0,5 s ueber dem Spieler
// Grafikpass 5 RUNDE 2: Damage-Lag des Boss-Balkens (rein visuell).
// BOSS_BAR_IW spiegelt die Innenbreite des Balkens aus ui/hud.js (bw 80 - 4).
// hud.js klammert den Wert zusaetzlich auf 0..iw, ein Auseinanderlaufen der
// beiden Konstanten kann also nichts kaputt machen.
const BOSS_BAR_IW = 76;
let bossLagW = null;                  // nachlaufende ANZEIGE-Breite in px
let bossLagFrames = 0;                // Frame-Zaehler (1 px je 2 Frames)
let portalToastTimer = 0;             // Drossel fuer den VERSCHLOSSEN/VERSIEGELT-Toast (1x/s)

function pushToast(text, color, prio) {
  if (!toast || prio >= toast.prio) toast = { text, color, prio, t: 0 };
}

function followPlayer() {
  camera.follow(player.x + player.w / 2, player.y + player.h / 2, map.wPx, map.hPx);
}

function syncPlayerLight() {
  playerLight.x = player.x + player.w / 2;
  playerLight.y = player.y + player.h / 2;
}

// Welt einer Map aufbauen. Gegner-/Prop-Zustand wird beim erneuten Betreten
// zurückgesetzt (dokumentierter Slice-1-Kompromiss laut Spec).
// Spieler-Identität beim Map-Wechsel (Spec-Review-Klärung): NEUES Objekt via
// createPlayer(spawn); bei carry=true werden hp/gold/potions übernommen,
// alle Timer/attackId/Knockback/State starten frisch.
function buildWorld(mapKey, spawn, carry) {
  currentMapKey = mapKey;
  lastSpawn = spawn;         // §2.6: fuer den Respawn merken
  mapDef = MAPS[mapKey];
  map = createTilemap(mapDef.rows, mapDef.legend, mapDef.overRows || null);
  const prev = player;
  player = createPlayer(spawn, { god: godMode });
  if (carry && prev) {
    // carry-Reihenfolge FEST (Spec Slice 2/3): erst Inventar- UND Progression-
    // Referenz, dann Stats ableiten (maxHp aus Level/Herzen), dann hp/gold/
    // potions (hp gegen neues maxHp gekappt).
    player.inv = prev.inv;
    player.prog = prev.prog; // §3: Referenz — XP/Level/Herzcontainer tragen
    player.recalcStats();
    player.hp = Math.min(prev.hp, player.maxHp);
    player.gold = prev.gold;
    player.potions = prev.potions;
  }
  // GOD-MODE-Startausstattung: 500 Gold NUR beim frischen Spieler (bei carry
  // traegt der Uebergang das Gold ohnehin mit) und der Bumerang im zelda-Slot,
  // aber nie doppelt (bei carry ist player.inv die REFERENZ auf das alte
  // Inventar). Ohne ?god=1 passiert hier nichts.
  if (godMode) {
    if (!carry) player.gold = 500;
    if (!player.inv.zelda.includes('boomerang')) player.inv.zelda.push('boomerang');
  }
  enemies = [
    ...mapDef.skeletonSpawns.map(createSkeleton),
    ...mapDef.ghoulSpawns.map(createGhoul),
    // §3: in der BOSS_KAMMER den Grabwaechter NUR BEIM ERZEUGEN filtern, wenn
    // er schon besiegt ist (MAPS/mapDef werden NIE mutiert, sonst fehlt der
    // Boss nach resetRun dauerhaft).
    ...(mapDef.enemySpawns || [])
      .filter((s) => !(runFlags.bossDead && s.kind === 'graveward'))
      .map(createEnemy),
  ];
  props = createProps(mapDef.propSpawns);
  // §3: nach besiegtem Boss die Siegtruhe statisch bei tc(10,4) hinlegen —
  // der Sieg bleibt nach Verlassen/Rueckkehr erreichbar.
  if (mapKey === 'BOSS_KAMMER' && runFlags.bossDead) {
    props.push(...createProps([{ ...tc(10, 4), kind: 'chest', content: 'treasure' }]));
  }
  projectiles = createProjectiles();
  // §2.4: Funken der alten Map verwerfen (kein Ember-Bleed über den Map-Wechsel).
  particles.list.length = 0;
  drops = [];
  events.length = 0;
  toast = null;
  zeldaWasAir = false;
  zeldaBlink = 0;
  playerLight = { x: 0, y: 0, radius: mapDef.playerLightRadius, flicker: 0.3 };
  // GRAFIKPASS 6 §2.6 — FACKEL-WAND-FLAG. Die Licht-Objekte tragen keine
  // Art-Info; lighting.js verortet den Flammen-Hotspot (HOT_RINGS) aber
  // unterschiedlich: BODENfackel cy-2 (Flammenkern in den Grid-Zeilen 5..7),
  // WANDfackel cy-4 (deren Flamme endet eine Zeile hoeher — auf Bodenfackel-
  // Hoehe laege der Hotspot im Metallgehaeuse). Die Unterscheidung faellt
  // deshalb HIER, beim Sammeln: alles, dessen Legenden-Art-Key mit
  // 'torch_wall' beginnt, ist eine Wandfackel. Fehlt das Flag, bleibt
  // lighting.js beim Bodenfackel-Wert (Default, Vertrag Engine-A).
  lights = mapDef.torchChars
    .flatMap((ch) => map.findTiles(ch).map((t) => ({ t, ch })))
    .map(({ t, ch }) => {
      const l = { x: t.x, y: t.y, radius: TORCH_RADIUS, flicker: 1 };
      const art = (mapDef.legend[ch] && mapDef.legend[ch].art) || '';
      if (art.startsWith('torch_wall')) l.wall = true;
      return l;
    });
  lights.push(playerLight);
  portalsArmed = mapDef.portals.map(() => false);
  levelupTimer = 0;
  portalToastTimer = 0;
  syncPlayerLight();
  followPlayer(); // Kamera VOR dem ersten Frame der neuen Map setzen
  // §3: beim (Wieder-)Betreten der BOSS_KAMMER mit lebendem Boss einmalig der
  // Namens-Toast GRABWAECHTER in Rot (der Name kommt nur als Toast, nicht ins HUD).
  if (mapKey === 'BOSS_KAMMER' && enemies.some((e) => e.kind === 'graveward')) {
    toast = { text: 'GRABWAECHTER', color: '#ae2f2a', prio: 3, t: 0 };
  }
}

// Kompletter Neustart (Titel / nach Game Over / nach Sieg): frischer Spieler
// (hp/gold/potions zurückgesetzt), zurück auf die Start-Map.
function resetRun() {
  player = null;
  victoryTimer = 0;
  fadePhase = 'none';
  fadeT = 0;
  pendingPortal = null;
  runFlags.bossDead = false; // §2.6.6: frischer Run, der Boss lebt wieder
  buildWorld(startMapKey, MAPS[startMapKey].playerSpawn, false);
}

function enterState(next) {
  state = next;
  stateTime = 0;
  input.consumeConfirm();
}

function update(dt) {
  timeSec += dt;
  stateTime += dt;

  // HUD-Spiegel + Touch-Sichtbarkeiten NUR in playing/inventory
  // aktualisieren (im Titel ist player null). drawHUD behält seine
  // Signatur und kennt weder Projektile noch den Zustandsautomaten.
  if (state === 'playing' || state === 'inventory') {
    const inv = player.inv;
    const air = projectiles.list.length > 0;
    if (zeldaWasAir && !air) zeldaBlink = 3 / 60; // Fang: 3-Frame-Weissblink
    else if (zeldaBlink > 0) zeldaBlink -= dt;
    zeldaWasAir = air;
    player.zeldaState = inv.zelda.length === 0 ? 'none' : (air ? 'air' : 'ready');
    player.zeldaBlink = zeldaBlink;
    input.touch.buttons[2].visible = inv.zelda.includes('boomerang');
    // HUD-Box-Zone nur im Spielzustand scharf; im Panel übernimmt der
    // Tap-Hittest des Inventar-UI (X-Button liegt in derselben Ecke).
    input.hudBoxVisible = state === 'playing'
      && (inv.zelda.length > 0 || inv.items.length > 0
        || !!(inv.equipped.weapon || inv.equipped.armor || inv.equipped.ring));
  }

  // Der Schliess-Tap aufs X liegt in der Angriffszone; der noch gehaltene
  // Pegel darf beim Zurückwechseln keinen Schwerthieb auslösen. Geschluckt
  // wird, bis der Pegel einmal losgelassen wurde (input.attack wird von
  // input.update() jeden Frame neu berechnet, das Überschreiben heilt sich).
  if (attackSwallow) {
    if (input.attack) input.attack = false;
    else attackSwallow = false;
  }

  if (state === 'title') {
    if (input.confirm) {
      resetRun();
      enterState('playing');
    }
  } else if (state === 'playing') {
    if (fadePhase !== 'none') {
      // Fade: KEINE Welt-Updates (player/enemies/props/drops); Fade-Timer,
      // timeSec/stateTime und input.postUpdate laufen weiter.
      fadeT += dt;
      if (fadePhase === 'out' && fadeT >= FADE_TIME) {
        buildWorld(pendingPortal.target, pendingPortal.spawn, true);
        pendingPortal = null;
        fadePhase = 'in';
        fadeT = 0;
      } else if (fadePhase === 'in' && fadeT >= FADE_TIME) {
        fadePhase = 'none';
        fadeT = 0;
      }
    } else {
      events.length = 0;
      player.update(dt, input, map, enemies, events);
      // Bumerang NACH dem Spieler, VOR den Gegnern: Stun wirkt im selben Tick
      projectiles.update(dt, input, player, enemies, props, map, drops, events);
      updateEnemies(dt, enemies, player, map, drops, events);
      updateProps(dt, props, player, map, drops, events);
      updateDrops(dt, drops, player, events);
      syncPlayerLight();
      followPlayer();

      // §2.4: Glut-Funken an jeder SICHTBAREN Fackel-Lichtquelle spawnen
      // (flicker >= 0.8 = nur Fackeln; Spieler/Drops/Eliten liegen bei 0.3) und
      // die Partikel im Fixed-Step updaten. Nur hier (playing, kein Fade) — im
      // Titel/Inventar/Game-Over/Fade pausieren die Funken (kein Update im Freeze).
      for (const l of lights) {
        if ((l.flicker || 0) < 0.8) continue;
        if (l.x + 32 < camera.x || l.x - 32 > camera.x + VIEW_W ||
            l.y + 32 < camera.y || l.y - 32 > camera.y + VIEW_H) continue;
        particles.spawnEmbers(l.x, l.y, dt);
      }
      particles.update(dt);

      // Toasts nach Prioritaet (§3): level_up (4) > weapon/key/heart_found (3)
      // > item_pickup (2) > Rest (1). Ein Slot, pushToast ersetzt nur bei >=
      // Prioritaet.
      const picked = getEvent(events, 'item_pickup');
      if (picked) pushToast(picked.item.name, picked.item.rare ? '#92aec0' : '#d6cbb1', 2);
      if (hasEvent(events, 'weapon_found')) pushToast('KNOCHEN-BUMERANG!', '#f0bf4e', 3);
      if (hasEvent(events, 'key_found')) pushToast('BOSS-SCHLUESSEL!', '#f0bf4e', 3);
      if (hasEvent(events, 'heart_found')) pushToast('HERZCONTAINER!', '#f0bf4e', 3);
      if (hasEvent(events, 'inventory_full')) pushToast('TASCHE VOLL', '#ae2f2a', 1);
      if (hasEvent(events, 'level_up')) {
        pushToast(`STUFE ${player.prog.level}!`, '#f0bf4e', 4);
        levelupTimer = 0.5;      // Ring-Effekt ueber dem Spieler
        player.xpBlink = 2;      // 2-Frame-Weissblink der XP-Leiste (hud.js)
      }
      if (toast) {
        toast.t += dt;
        if (toast.t >= 0.9) toast = null;
      }
      if (levelupTimer > 0) levelupTimer -= dt;
      if (portalToastTimer > 0) portalToastTimer -= dt;
      if (player.xpBlink > 0) player.xpBlink -= 1;

      // §2.2/§3: Boss-Tod. Der generische die-Zweig pusht 'boss_died' nach der
      // 1,0-s-Sterbephase. main.js zerbroeselt dann alle Adds (KEIN XP/Geld/
      // Gear/Pity), streut 6-10 Muenzen und legt die Siegtruhe bei tc(10,4).
      if (hasEvent(events, 'boss_died')) {
        for (const e of enemies) {
          if (e.summoned === true && e.state !== 'die') {
            e.state = 'die';
            e.dieTimer = 0.4;
            e.noDrops = true;
          }
        }
        const anchor = tc(10, 4);
        const coins = 6 + Math.floor(Math.random() * 5); // 6-10
        for (let k = 0; k < coins; k++) scatterDrop(drops, map, anchor.x, anchor.y, 'coin');
        props.push(...createProps([{ ...anchor, kind: 'chest', content: 'treasure' }]));
        runFlags.bossDead = true;
      }

      // Boss-HP-Balken pro Frame spiegeln (Muster zeldaState): lebt ein
      // Grabwaechter, traegt player.bossBar seine HP, sonst null.
      // Grafikpass 5 RUNDE 2 — DAMAGE-LAG (rein VISUELL, kein Gameplay-Wert):
      // bossLagW ist die ANZEIGE-Breite der Fuellung in Balken-Pixeln. Sie
      // springt bei Treffern NICHT sofort auf den neuen Wert, sondern laeuft
      // ihm mit ~1 px je 2 Frames nach (~30 px/s). hud.js zeichnet die Strecke
      // zwischen echter und nachlaufender Breite als entsaettigt hellen
      // Streifen HINTER der Fuellung — der Spieler SIEHT, wie viel ein Treffer
      // gekostet hat. Steigt die HP (Heilung/neuer Kampf), rastet die Anzeige
      // sofort ein. Kein Einfluss auf boss.hp oder irgendeine Logik.
      const boss = enemies.find((e) => e.kind === 'graveward' && e.state !== 'die');
      if (boss) {
        const bossFw = Math.max(0, Math.round((BOSS_BAR_IW * boss.hp) / boss.maxHp));
        if (bossLagW === null || bossFw >= bossLagW) {
          bossLagW = bossFw;                 // Heilung/erster Frame: sofort
          bossLagFrames = 0;
        } else if (++bossLagFrames >= 2) {   // ~1 px je 2 Frames
          bossLagFrames = 0;
          bossLagW -= 1;
        }
        player.bossBar = { hp: boss.hp, maxHp: boss.maxHp, lagW: bossLagW };
      } else {
        bossLagW = null;
        bossLagFrames = 0;
        player.bossBar = null;
      }

      // Prüfreihenfolge (Spec-Review-Klärung): 1. Tod hat IMMER Vorrang
      // (verwirft laufenden Victory-Countdown) → 2. Portal → 3. Truhe/Sieg
      // → 4. Inventar-Öffnen (nur ohne Fade, NACH der Event-Auswertung).
      if (hasEvent(events, 'player_died')) {
        victoryTimer = 0;
        // §2.6.3: beim EINTRITT in gameover den Gold-Zoll berechnen und
        // spiegeln (drawGameOver liest player.deathToll). Abgezogen wird erst
        // bei der Bestaetigung VOR buildWorld.
        player.deathToll = player.gold - Math.floor(player.gold / 2);
        enterState('gameover');
      } else {
        for (let i = 0; i < mapDef.portals.length; i++) {
          const portal = mapDef.portals[i];
          if (aabbOverlap(player, portal)) {
            if (portalsArmed[i]) {
              // §3: Portal-Gate. 'locked' (Schluessel fehlt) / 'sealed' (Boss
              // aktiv) blocken den Uebergang mit gedrosseltem Toast (1x/s).
              const block = portalBlocked(portal, player, enemies);
              if (block) {
                if (portalToastTimer <= 0) {
                  pushToast(block === 'locked' ? 'VERSCHLOSSEN' : 'VERSIEGELT', '#d6cbb1', 1);
                  portalToastTimer = 1.0;
                }
              } else {
                pendingPortal = portal;
                fadePhase = 'out';
                fadeT = 0;
                break;
              }
            }
          } else {
            portalsArmed[i] = true; // einmal verlassen → scharf
          }
        }
        if (fadePhase === 'none') {
          if (hasEvent(events, 'chest_opened')) victoryTimer = VICTORY_DELAY;
          if (victoryTimer > 0) {
            victoryTimer -= dt;
            if (victoryTimer <= 0) enterState('victory');
          }
          // Inventar öffnen: Flanke auf input.inventory; Tod/Sieg oben
          // haben Vorrang (state wäre dann nicht mehr 'playing').
          if (state === 'playing' && input.inventory && !inventoryHeld) {
            enterState('inventory');
            inventoryUI.open();
            player.inv.newFlag = false;
          }
        }
      }
    }
  } else if (state === 'inventory') {
    // HARTE PAUSE: keine Welt-Updates, victoryTimer pausiert mit; timeSec
    // läuft oben weiter (Fackel-Flackern). Zurück per 'close' aus dem UI.
    if (inventoryUI.update(input, player) === 'close') {
      attackSwallow = true; // Schliess-Tap nicht als Hieb werten
      enterState('playing'); // consumeConfirm an beiden Übergängen (enterState)
    }
  } else if (state === 'gameover') {
    if (player.state === 'dead') player.animTimer += dt; // Sterbe-Frames
    if (stateTime >= END_SCREEN_MIN_TIME && input.confirm) {
      // §2.6: KEIN resetRun mehr. Respawn am letzten Eintritts-Spawn der
      // AKTUELLEN Map; Gold halbieren VOR buildWorld (carry kopiert es),
      // hp = maxHp EXPLIZIT NACH dem carry-Block (der kopiert prev.hp = 0),
      // deathToll zuruecksetzen. Level/XP/Inventar/Ausruestung/Traenke/
      // Schluessel/Herzcontainer bleiben. Boss frisch (buildWorld), Tor
      // bleibt entriegelt (Schluessel bleibt im Inventar).
      player.gold = Math.floor(player.gold / 2);
      buildWorld(currentMapKey, lastSpawn, true);
      player.hp = player.maxHp;
      player.deathToll = null;
      enterState('playing');
    }
  } else if (state === 'victory') {
    if (stateTime >= END_SCREEN_MIN_TIME && input.confirm) {
      resetRun(); // Victory-Neustart bleibt ein frischer Run (§2.6.6)
      enterState('playing');
    }
  }

  inventoryHeld = input.inventory; // Pegel für die Öffnen-Flanke merken
  input.postUpdate(); // IMMER als Letztes im Tick
}

// Render-Reihenfolge (bindend, Slice 1.5): Boden-Layer → Entities Y-SORTIERT
// nach Fußkante (Drops/Props/Gegner/Spieler gemeinsam; wer weiter unten steht,
// ist davor) → Over-Layer (Baumkronen ÜBER den Entities) → Fog → Lighting →
// Vignette → HUD (HUD wird NICHT abgedunkelt).
// §3: prozedurale Boden-Telegraph-Marker (KEINE Sprites). Umriss #ae2f2a
// Alpha 0,6; in den letzten 0,25 s des Telegraphs Flaeche Alpha 0,35 + Umriss-
// Blitz #f1e9d3. Max. 1 Marker (eine Boss-Maschine). Gezeichnet NACH dem
// Ground-Layer, VOR den y-sortierten Entities (Render-Reihenfolge aus 1.5
// sonst unangetastet).
function drawMarkers() {
  for (const e of enemies) {
    const m = e.marker;
    if (!m) continue;
    const danger = m.remaining <= 0.25;
    ctx.save();
    ctx.lineWidth = 1;
    if (m.kind === 'ring') {
      const mx = Math.round(m.x - camera.x);
      const my = Math.round(m.y - camera.y);
      if (danger) {
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = '#ae2f2a';
        ctx.beginPath();
        ctx.arc(mx, my, m.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = danger ? '#f1e9d3' : '#ae2f2a';
      ctx.beginPath();
      ctx.arc(mx, my, m.r, 0, Math.PI * 2);
      ctx.stroke();
    } else if (m.kind === 'rect') {
      // Korridor entlang der Sturm-Richtung: Rechteck length x width vor dem Boss.
      ctx.translate(m.x - camera.x, m.y - camera.y);
      ctx.rotate(Math.atan2(m.dirY, m.dirX));
      if (danger) {
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = '#ae2f2a';
        ctx.fillRect(0, -m.width / 2, m.length, m.width);
      }
      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = danger ? '#f1e9d3' : '#ae2f2a';
      ctx.strokeRect(0, -m.width / 2, m.length, m.width);
    }
    ctx.restore();
    break; // Max. 1 Marker
  }
}

// Grafikpass 4 §2.2b: Lit-Dither-Pass NUR auf Stein-Boden-Maps. Bewusster
// Hauptloop-Entscheid: Konstante in main.js STATT mapDef.litFloor-Flag, weil
// map_fluestergruft.js tabu ist (dort koennte das Flag nicht gesetzt werden).
const LIT_FLOOR_MAPS = new Set(['CATACOMBS', 'FLUESTERGRUFT', 'BOSS_KAMMER']);

// §1.7 [GP5]: Zellfilter fuer den Lit-Dither-Pass. Ausgeschlossen sind Wasser-
// Kacheln (shorePrefix/depthOverlays) und ALLE animierten Kacheln (Wellen,
// Fackelfuesse, Sway-Gras) — dort stuende das statische Dither-Raster auf einer
// laufenden Textur. Ausserhalb der Map (defAt -> null) ebenfalls nichts.
function litFilter(tx, ty) {
  const d = map.defAt(tx, ty);
  return !!d && !d.anim && !d.shorePrefix && !d.depthOverlays;
}

// §2.4 [GP4]: weicher Alpha-Bodenschatten (moderner Bodenkontakt) unter einer
// Entity — AUSSCHLIESSLICH aus fillRect (die Flusstest-Stubs kennen kein
// ctx.ellipse/roundRect): drei gestapelte, zentrierte 1-px-Zeilen mit Breiten
// 0.9/0.7/0.4 × Hitbox-Breite. GP4-Korrektur (Review-Befund): die drei Zeilen
// liegen auf VERSCHIEDENEN y (baseY-i) und ueberlappen NICHT — mit einheitlichem
// Alpha 0.14 lag die reale Kontaktdeckung bei 0.14 statt der von der Jury
// gewuenschten ~35 %. FIX: Zeilen-Alphas als Gradient [0.32 Basiszeile (breiteste,
// unten), 0.20, 0.10] — unten satt, oben auslaufend. Gilt fuer Spieler, Gegner
// UND (neu) echte Props (vase/urn/chest verlieren ihre gebackenen Schatten,
// Art-Builder §3.5b). '#000', Unterkante y + h - 1.
// GRAFIKPASS 6 §4.3 — STANDARDPROFIL AUF VIER ZEILEN. Das GP4-Profil begann
// AUF der Fusskante (dy 0) und lief nach OBEN aus — jede seiner drei Zeilen lag
// damit hinter dem Sprite, das mit den Fuessen buendig auf derselben Kante
// steht. Sichtbar blieben nur Restpixel neben dem Fuss-Cluster; M5 verlangt
// aber >= 8 sichtbare Schatten-Texel UNTER der Fusskante. Deshalb bekommt das
// Standardprofil dieselbe Bauart wie das laengst bewaehrte BIG-Profil des
// Bosses: eine ZUSAETZLICHE, breite Zeile bei dy -1 (also eine Zeile UNTER der
// Fusskante), die kein Sprite verdeckt, und die satteste Deckung eine Zeile
// darueber. BIG bleibt UNVERAENDERT (SHADOW_*_BIG unten).
//   dy -1  0,90 x Breite, Alpha 0,30  <- der sichtbare Bodenkontakt (M5)
//   dy  0  0,95 x Breite, Alpha 0,40  <- Kern wie GP4
//   dy  1  0,70 x Breite, Alpha 0,20
//   dy  2  0,40 x Breite, Alpha 0,10
// Beispiel Spieler (w = 12): 11 / 11 / 8 / 5 Texel — die -1-Zeile allein
// liefert 11 sichtbare Texel unter der Fusskante.
// BLINK-VERHALTEN (Deklaration §9): der Schatten haengt an der Hitbox, nicht am
// Sprite — eine unverwundbar blinkende Figur behaelt ihren Schatten.
const SHADOW_W = [0.90, 0.95, 0.7, 0.4];
const SHADOW_A = [0.30, 0.40, 0.20, 0.10];
const SHADOW_DY = [-1, 0, 1, 2];      // Zeilen OBERHALB der Fusskante (-1 = darunter)
// ---------------------------------------------------------------------------
// GRAFIKPASS 5 RUNDE 3 — BOSS-KONTAKTSCHATTEN (Jury: "der BOSS hat keinen
// sichtbaren Kontaktschatten; pruefen, warum er aus dem Weichschatten-Pass
// ausgenommen ist").
//
// BEFUND (nachgemessen mit .tmp/probe_gp5r3_bossshadow.mjs, headless durch
// main.js): Der Boss ist NICHT ausgenommen. Er steckt im enemies-Array (der
// graveward wird ueber mapDef.enemySpawns erzeugt), und die Schleife
// `for (const e of enemies) drawSoftShadow(e)` zeichnet ihm jeden Frame
// ordnungsgemaess drei Zeilen: 19x1 / 14x1 / 8x1 bei Alpha 0,40 / 0,20 / 0,10.
// Es gibt also keinen Boss-Sonderpfad, den man "anschliessen" muesste.
//
// Der Schatten ist UNSICHTBAR, und zwar aus Geometriegruenden: der Warden-
// Sprite ist 24x32 px und wird mit den Fuessen auf der AABB-Unterkante
// gezeichnet, die AABB selbst ist nur 20x24. Alle drei Schattenzeilen liegen
// damit auf den Sprite-Zeilen 29-31 — also HINTER dem Sprite (der Schatten
// wird vor den Entities gezeichnet), und schmaler als er. Uebrig bleiben ein
// paar Restpixel neben dem Fuss-Cluster, auf dem ohnehin dunklen Boden der
// Bosskammer (ambient 0,66) unter der Wahrnehmungsschwelle.
//
// FIX: GROSSE Entities bekommen ein eigenes Schattenprofil mit FUENF Zeilen
// (max. 19 px breit = das geforderte "18x5-Aequivalent"), dessen unterste
// Zeile EINE Zeile UNTER der Fusskante liegt — sie ist die einzige, die der
// 24x32-Sprite nicht verdeckt, und sie gibt dem Boss den Bodenkontakt. Nach
// oben laeuft das Profil wie gehabt aus.
// Die Klassifizierung haengt an der Standflaeche, NICHT am kind: entities/
// ist Tabu, und ein spaeterer zweiter Grossgegner soll den Schatten ohne
// weitere Codeaenderung erben. Heute trifft die Schwelle genau den Boss
// (20x24); Spieler (12x14), Skelett/Ghul/Hund und Props liegen darunter.
const SHADOW_W_BIG = [0.90, 0.95, 0.85, 0.65, 0.40];  // x 20 px -> 18/19/17/13/8
const SHADOW_A_BIG = [0.34, 0.44, 0.36, 0.24, 0.12];
const SHADOW_DY_BIG = [-1, 0, 1, 2, 3];               // -1 = UNTER der Fusskante
function drawSoftShadow(ent) {
  const big = ent.w >= 18 && ent.h >= 20;
  const ws = big ? SHADOW_W_BIG : SHADOW_W;
  const as = big ? SHADOW_A_BIG : SHADOW_A;
  const dys = big ? SHADOW_DY_BIG : SHADOW_DY;
  const cx = ent.x + ent.w / 2;
  const baseY = ent.y + ent.h - 1;
  ctx.save();
  ctx.fillStyle = '#000';
  for (let i = 0; i < ws.length; i++) {
    ctx.globalAlpha = as[i];
    const w = Math.max(1, Math.round(ent.w * ws[i]));
    ctx.fillRect(Math.round(cx - w / 2 - camera.x), Math.round(baseY - camera.y) - dys[i], w, 1);
  }
  ctx.restore();
}

function drawWorld() {
  map.draw(ctx, camera, tiles, timeSec, 'ground');

  // §2.2b [GP4]: Lit-Dither NACH map.draw('ground'), VOR den Entities. Nur auf
  // Stein-Boden-Maps (LIT_FLOOR_MAPS) und NUR mit statischen Fackellichtern
  // (flicker >= 0.8 = mapDef-Fackeln; Spieler/Elite/Drop-Lichter liegen bei 0.3
  // und werden ausgeschlossen). drawImage je Zelle mit 'lighter', Alpha 0.18
  // (Stufe 1) / 0.30 (Stufe 2) auf dem HAUPT-ctx. TILE = 16 px.
  if (LIT_FLOOR_MAPS.has(currentMapKey)) {
    const torchLights = lights.filter((l) => (l.flicker || 0) >= 0.8);
    // §1.7 [GP5]: 6. Parameter = Zellfilter. Wasser- und anim-Kacheln bekommen
    // KEIN Lit-Dither — auf laufenden Wellen/Flammen schmiert das statische
    // Raster (die Dither-Punkte stehen, die Kachel darunter laeuft). map.defAt
    // ist die additive API aus tilemap.js.
    const ditherCells = litDitherCells(torchLights, camera, timeSec, VIEW_W, VIEW_H, litFilter);
    if (ditherCells.length) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const c of ditherCells) {
        const dimg = tiles[c.key];
        if (!dimg) continue;
        ctx.globalAlpha = c.stufe === 2 ? 0.30 : 0.18;
        ctx.drawImage(dimg, Math.round(c.tx * 16 - camera.x), Math.round(c.ty * 16 - camera.y));
      }
      ctx.restore();
      // §0.5 PFLICHT: gco/globalAlpha explizit zuruecksetzen (save/restore reicht
      // nicht — Composite-Leak braeche im Browser Portal-Fade und HUD).
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }
  }

  // §3.B4 [GP5] KANAL-REFLEXION: warme, geditherte Lichtsaeulen auf den
  // WASSER-Kacheln, die orthogonal an einer Fackel liegen (geometrisch nur im
  // Gruft-Kanal, Jury-Deklaration). Die Zellen kommen aus der reinen Funktion
  // waterReflections (tilemap.js) — inkl. ganzzahligem ±1-px-Wackeln und der
  // Intensitaets-Wahl water_reflect_0/_1. Gezeichnet direkt nach dem Boden
  // (unter Markern/Entities) per 3-Argument-drawImage mit 'lighter'; fehlt der
  // Art-Key noch, wird still nichts gezeichnet.
  {
    const reflectCells = waterReflections(lights, map.defAt, camera, timeSec);
    if (reflectCells.length) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const c of reflectCells) {
        const rimg = tiles[c.key];
        if (!rimg) continue;
        ctx.drawImage(rimg, c.sx, c.sy);
      }
      ctx.restore();
      // §0.3 PFLICHT: Composite-Reset explizit (save/restore reicht nicht —
      // ein Leak braeche im Browser Portal-Fade und HUD).
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }
  }

  drawMarkers();

  // Lights pro Frame: Fackeln + Spieler-Laterne (lights) plus je ein Licht
  // pro liegendem SELTENEN Item-Drop (der Diablo-Moment: guter Loot
  // leuchtet im Dunkeln).
  // GRAFIKPASS 6 §4.1: dieser Aufbau ist VORGEZOGEN — er stand bis GP5 direkt
  // vor lighting.draw, aber der renderables-Bau unten fragt fuer JEDE Entity
  // lightAt(frameLights, ...) ab und braucht die vollstaendige Liste deshalb
  // schon hier. Zwischen diesem Block und lighting.draw wird frameLights NICHT
  // mehr veraendert, das gezeichnete Licht ist also bitgleich zum Bestand.
  const frameLights = lights.slice();
  for (const d of drops) {
    if (d.kind === 'item' && d.item && d.item.rare) {
      frameLights.push({ x: d.x + d.w / 2, y: d.y + d.h / 2, radius: 18, flicker: 0.3 });
    }
  }
  // §2.4: Mini-Lichter der LEBENDEN Eliten PRO FRAME (Muster Selten-Drop-
  // Lichter; NICHT ins statische lights-Array, das klebt am Spawn).
  for (const l of eliteLights(enemies)) frameLights.push(l);
  // §5.D4 [GP5]: statische Fuell-Lichter der Map (mapDef.extraLights, Engine-B
  // setzt das Feld; BOSS_KAMMER bekommt ein Zentrums-Licht mit flicker 0.5,
  // FLUESTERGRUFT seit GP6 §3.3 zwei im Kanalraum).
  // Sie liegen bewusst UNTER der 0.8-Schwelle: kein Warm-Glow, kein Lit-Dither,
  // keine Funken, keine Wasser-Reflexion — nur Grundaufhellung der Arena.
  // Fehlt das Feld, passiert nichts (additiv).
  if (mapDef.extraLights) {
    for (const l of mapDef.extraLights) frameLights.push(l);
  }

  // §2.4: Weichschatten VOR der renderables-Schleife (unter allen Entities, über
  // dem Boden) für Spieler, jeden Gegner UND jeden echten Prop.
  drawSoftShadow(player);
  for (const e of enemies) drawSoftShadow(e);
  for (const p of props) drawSoftShadow(p);

  // -------------------------------------------------------------------------
  // GRAFIKPASS 6 §4.2 — SPRITE-LICHT AM RENDERABLES-BAU (korrigierter Bauort,
  // Review P2-M-10/P1-M9). Jede Zeichen-Closure bekommt HIER `tintCtx` statt
  // `ctx` gereicht; eine Fassade, die erst "um die Schleife" gelegt wird,
  // erreicht die lexikalisch gebundenen ctx dieser Closures nicht.
  // Je Renderable stehen fest:
  //   fy      Fusskante (Y-Sortierung, Bestand)
  //   ax, ay  ABTASTPUNKT der Lichtabfrage = Schatten-Anker (cx, Fusskante-1),
  //           also exakt der Punkt, an dem auch drawSoftShadow ansetzt
  //   tint    false NUR fuer Drops und Projektile (Deklaration §9: Loot und
  //           Wurfgeschosse sind SIGNALE, keine beleuchteten Koerper — sie
  //           muessen im Dunkeln lesbar bleiben). Props (Vase/Urne/Truhe),
  //           Gegner und Spieler werden GETOENT.
  const noTint = !!window.__noTint; // Rig-Schalter M3; NUR main.js liest window
  // Fackeln (flicker >= 0.8) fuer die Seitenwahl der Warm-Rampe.
  const tintTorches = frameLights.filter((l) => (l.flicker || 0) >= 0.8);

  function tintFor(ent, ax, ay) {
    const lit = lightAt(frameLights, ax, ay, mapDef.ambient, timeSec, TINT_PREV.get(ent));
    TINT_PREV.set(ent, lit); // §4.1: Hysterese-Zustand beim Aufrufer
    const wS = Math.max(0, Math.min(3, Math.round(lit.warm * 3)));
    const kS = Math.max(0, Math.min(2, Math.round((1 - lit.f) * 2)));
    // §4.2 SEITE der Warm-Rampe = Vorzeichen (Fackel-x - Entity-x) der
    // NAECHSTEN Fackel, die den Abtastpunkt ueberhaupt erreicht. Ohne solche
    // Fackel ist warm = 0 und die Seite belanglos (Default 'WL').
    let seite = 'WL';
    let best = Infinity;
    for (const l of tintTorches) {
      const dx = l.x - ax;
      const dy = l.y - ay;
      const d2 = dx * dx + dy * dy;
      if (d2 < best && d2 < l.radius * l.radius) {
        best = d2;
        seite = dx >= 0 ? 'WR' : 'WL';
      }
    }
    return { warmA: WARM_ALPHA[wS], kaltA: KALT_ALPHA[kS], seite };
  }

  // Gemeinsame Y-Sortierung aller Welt-Entities nach Fußkante (y + h).
  // Array.sort ist stabil → bei Gleichstand bleibt Einfügereihenfolge
  // (Spieler zuletzt = bei Gleichstand oben).
  const renderables = [];
  const pushTinted = (ent, drawFn) => {
    const ax = ent.x + ent.w / 2;
    const ay = ent.y + ent.h - 1;
    const t = tintFor(ent, ax, ay);
    renderables.push({ fy: ent.y + ent.h, ax, ay, tint: true, warmA: t.warmA, kaltA: t.kaltA, seite: t.seite, draw: drawFn });
  };
  drops.forEach((d, i) => renderables.push({
    fy: d.y + d.h, ax: d.x + d.w / 2, ay: d.y + d.h - 1, tint: false, warmA: 0, kaltA: 0, seite: 'WL',
    draw: () => drawDrop(tintCtx, camera, d, i, gfx, timeSec),
  }));
  for (const p of props) pushTinted(p, () => drawProp(tintCtx, camera, p, gfx, timeSec));
  for (const e of enemies) pushTinted(e, () => drawEnemy(tintCtx, camera, e, gfx, timeSec));
  for (const p of projectiles.list) renderables.push({
    fy: p.y + p.h, ax: p.x + p.w / 2, ay: p.y + p.h - 1, tint: false, warmA: 0, kaltA: 0, seite: 'WL',
    draw: () => drawProjectile(tintCtx, camera, p, gfx, timeSec),
  });
  pushTinted(player, () => player.draw(tintCtx, camera, gfx, timeSec));
  renderables.sort((a, b) => a.fy - b.fy);
  for (const r of renderables) {
    // Die Fassade liest ihre Toenung aus tintCfg; r.draw() ist synchron, ein
    // zweiter Zustand kann also nie gleichzeitig aktiv sein.
    tintCfg.on = r.tint && !noTint;
    tintCfg.warmA = r.warmA;
    tintCfg.kaltA = r.kaltA;
    tintCfg.seite = r.seite;
    r.draw();
  }
  tintCfg.on = false; // Fassade nach der Schleife neutral (Hygiene wie gco/Alpha)

  // §3: Level-Up-Ring (levelup_0/1, 0,5 s) UEBER der Spieler-Fußkante.
  // §4.2-Deklaration: laeuft NACH der Schleife am ECHTEN ctx und bleibt damit
  // TINT-FREI — er ist ein Effekt-Overlay, kein beleuchteter Koerper.
  if (levelupTimer > 0) {
    const rimg = gfx[levelupTimer > 0.25 ? 'levelup_0' : 'levelup_1'];
    if (rimg) {
      ctx.drawImage(
        rimg,
        Math.round(player.x + player.w / 2 - rimg.width / 2 - camera.x),
        Math.round(player.y + player.h - rimg.height / 2 - 8 - camera.y)
      );
    }
  }

  map.draw(ctx, camera, tiles, timeSec, 'over');
  if (mapDef.fog) drawFog(ctx, camera, gfx, timeSec);
  // frameLights ist oben (vor dem renderables-Bau) fertig aufgebaut worden
  // (GP6 §4.1) und seither unveraendert.
  // §2.3: mapDef.ambientTint als 6. Argument durchreichen (Farbtemperatur je Map).
  lighting.draw(ctx, camera, frameLights, mapDef.ambient, timeSec, mapDef.ambientTint);
  // §2.4: Funken NACH dem Dunkel-Overlay und VOR der Vignette — sie sind
  // selbstleuchtende Deko und werden vom Overlay NICHT abgedunkelt.
  // §5.D3 [GP5]: frameLights + ambient durchreichen — die Staub-Motes werden
  // damit lichtabhaengig gedimmt (Floor 0.25); die Glut-Funken bleiben bewusst
  // lichtunabhaengig (Deklaration).
  particles.draw(ctx, camera, frameLights, mapDef.ambient);
  drawVignette(ctx);
  drawHUD(ctx, player, input, gfx);
  drawPickupToast(ctx, camera, player, toast);
}

function render() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  if (state === 'title') {
    drawTitle(ctx, timeSec);
    return;
  }
  drawWorld();
  if (state === 'inventory') {
    // Eingefrorene Welt abdunkeln, Panel obenauf (Spec Slice 2)
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.globalAlpha = 1;
    drawInventoryUI(ctx, inventoryUI, player, gfx);
  }
  if (state === 'gameover') drawGameOver(ctx, player, timeSec);
  else if (state === 'victory') drawVictory(ctx, player, timeSec);
  if (state === 'playing' && fadePhase !== 'none') {
    const a = fadePhase === 'out'
      ? Math.min(fadeT / FADE_TIME, 1)
      : 1 - Math.min(fadeT / FADE_TIME, 1);
    ctx.globalAlpha = a;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.globalAlpha = 1;
  }
}

createLoop({ update, render }).start();
