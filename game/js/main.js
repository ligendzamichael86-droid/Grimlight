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
import {
  drawHUD, drawVignette, drawFog, drawTitle, drawGameOver, drawVictory, drawPickupToast,
  drawPause, drawFps, PAUSE_MENU_ZONES,
} from './ui/hud.js';
import { createInventoryUI, drawInventoryUI } from './ui/inventory_ui.js';
// Slice 4 §3: Save-System. save.js ist REIN (kein Browser-Zugriff) — den
// Storage fasst ausschliesslich main.js an, in der §0.2-Guardform.
import {
  SAVE_KEY, serialize, deserialize, applyToPlayer,
  titleMenuStep, TITLE_MENU_ITEMS, TITLE_MENU_ZONES,
} from './items/save.js';
// SLICE 5 §2/§8 — AUDIO-KERN. Alle vier Module sind REIN (kein window, kein
// AudioContext, kein Modul-Zustand) und damit von den Flusstests importierbar;
// den AudioContext fasst AUSSCHLIESSLICH main.js an (Muster save.js/Storage).
import { compileSong } from './audio/chiptune.js';
import { sfxRender } from './audio/sfx.js';
import { SONGS } from './audio/songs/index.js';
import {
  defaultSettings, parseSettings, serializeSettings, toggle as mixerToggle,
  BUS, sfxBusGain, leereStimmen, allocVoice, freeVoice, aktiveStimmen,
} from './audio/mixer.js';
// SLICE 6 §2/§3/§4 — GRAMFELD. Alle fuenf Module sind REIN (Node-importierbar,
// kein window/document, npcs.js pusht KEINE Events — Waechter smoke:5189).
// Die VERDRAHTUNG liegt ausschliesslich hier: quest.js hat per §0.2/§4 keine
// eigenen Trigger, alle Ausloeser sind main.js-Beobachter (main.js kennt
// currentMapKey und sieht den die-Uebergang inklusive e.kind).
import { createNpcs, updateNpcs, drawNpc } from './entities/npcs.js';
import { dialogFuer, questGeber } from './entities/npc_dialoge.js';
import { dialogStart, dialogSchritt, dialogAnsicht } from './ui/dialog.js';
import {
  questAnbieten, questAnnehmen, questAbgeben, questKillEvent, questRunFlagEvent,
  questDialogEvent, seltenFrei, neueRunFelder, sichereRunFelder, leereRunFelder,
} from './items/quest.js';
import { createShopUI, drawShopUI, resetShopUI } from './ui/shop_ui.js';

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
//
// SLICE 4 §5.3 — HALBPIXEL-FIX. Bis Slice 3 zentrierte die Flexbox des body
// (style.css) das Canvas; bei ungerader Geraeteaufloesung entstand dabei ein
// HALBER Geraetepixel Versatz (gemessen iPhone 14 Pro 1179x2556 dpr 3:
// 49,5 Geraetepixel Rand, Landkarte B §1.8). Folge bei image-rendering:
// pixelated: ungleich breite Pixelreihen = Scherung im ganzen Bild.
// JETZT: #game liegt absolut (style.css), und die Position wird HIER auf dem
// GERAETEpixel-Raster gerundet und danach in CSS-px zurueckgerechnet. Die
// Ausgabe traegt >= 4 Nachkommastellen, weil Blink CSS-Laengen auf 1/64 px
// rastert (Review P2-m2).
// §0.2: benutzt werden AUSSCHLIESSLICH canvas.style und die window-Groessen —
// kein document.body, kein getComputedStyle, kein matchMedia (nichts davon
// existiert in den Flusstest-Stubs).
function resize() {
  const dpr = window.devicePixelRatio || 1;
  const scale = Math.max(
    1,
    Math.floor(Math.min((window.innerWidth * dpr) / VIEW_W, (window.innerHeight * dpr) / VIEW_H))
  );
  canvas.style.width = `${(scale * VIEW_W) / dpr}px`;
  canvas.style.height = `${(scale * VIEW_H) / dpr}px`;
  try {
    const left = Math.round((window.innerWidth * dpr - scale * VIEW_W) / 2) / dpr;
    const top = Math.round((window.innerHeight * dpr - scale * VIEW_H) / 2) / dpr;
    canvas.style.left = `${left.toFixed(4)}px`;
    canvas.style.top = `${top.toFixed(4)}px`;
  } catch { /* §0.2: ohne style-Objekt bleibt die CSS-Zentrierung stehen */ }
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
  // Slice 6 (SLICE6_PHASE2_NOTIZEN 5): die NPC-Flips ebenfalls NUR ans ENDE.
  // ANGEHAENGT WERDEN NUR DIE ZWEI WANDERER. npcs.js setzt facingLeft
  // AUSSCHLIESSLICH im Wander-Zweig (npcs.js:152 `if (n.dirX !== 0)`), und
  // NPC_WANDERER ist ['mile','torwaechter'] (npcs.js:51). Bran/Hedda/Corm
  // stehen ortsfest: ihr facingLeft bleibt fuer immer false, ein Flip-Canvas
  // fuer sie waere toter Speicher (6 statt 15 Extra-Canvases beim Boot).
  // npc_blase traegt keine Blickrichtung und bekommt ebenfalls keinen Flip.
  'npc_mile_0', 'npc_mile_1', 'npc_mile_talk',
  'npc_torwaechter_0', 'npc_torwaechter_1', 'npc_torwaechter_talk',
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
// §0.3: der Gesten-Unlock haengt am ECHTEN touchstart-Handler (2. Parameter,
// input.js). audioUnlock ist eine Funktionsdeklaration weiter unten und damit
// hier bereits gebunden (Hoisting); gerufen wird sie erst aus dem Listener.
input.attach(canvas, audioUnlock);
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
// Slice 4 §4.3: aus `const` wird `let` — der GOTT-Schalter im Pause-Menue
// baut den Spieler damit zur Laufzeit neu (in der App gibt es keine
// Query-Parameter, Landkarte B §3).
let godMode = new URLSearchParams(window.location.search).get('god') === '1';

// ===========================================================================
// SLICE 4 §0.2 — BROWSER-GUARDS. JEDER neue Browser-API-Zugriff dieser Datei
// laeuft ueber eine der Hilfen hier: typeof-Pruefung + try/catch +
// Null-Fallback. Die Flusstest-Stubs kennen NUR window {addEventListener,
// devicePixelRatio, innerWidth/Height, location.search,
// requestAnimationFrame}, document {getElementById, createElement,
// addEventListener, defaultView, hidden} und das Canvas — es gibt KEIN
// localStorage, kein matchMedia, kein screen, kein navigator, kein
// document.body/documentElement. Ein ungeguardeter Zugriff macht alle drei
// kanonischen Flusstests rot (§0.1, gemessen Review P1-B1).
// ===========================================================================

// Pflichtform der Landkarte (§0.2): das try ist NICHT optional — WebViews mit
// blockierten Cookies werfen schon beim reinen Property-Zugriff SecurityError.
const store = (() => { try { return window.localStorage || null; } catch { return null; } })();

function storeLesen(key) {
  try { return store ? store.getItem(key) : null; } catch { return null; }
}
function storeSchreiben(key, wert) {
  try { if (store) store.setItem(key, wert); } catch { /* Quota/Privatmodus: still */ }
}

// ===========================================================================
// SLICE 5 §4 — WEBAUDIO-ADAPTER. Der EINZIGE Ort im Projekt, der WebAudio
// anfasst (Landkarte A §4; chiptune/sfx/mixer/songs rechnen nur).
//
// EISERNE REGELN, die hier gelten:
//   §0.2 ZEITARGUMENT: JEDER Knoten wird mit explizitem Zeitargument
//        gestartet/gestoppt — osc.start(t0), osc.stop(t1). NIE mit leeren
//        Klammern: der Quelltext-Waechter smoke_test.mjs:4854-4858 zaehlt
//        `.start()`/`.stop()` in main.js und erlaubt GENAU EIN `.start()`
//        (das des Loops am Dateiende).
//   §0.2 SINGLETON: genau EIN AudioContext fuer die Lebensdauer des
//        Dokuments, nie close(), nie neu bauen (Review P2-m7 — Chromium
//        erlaubt >32 Kontexte ohne Wurf, ein Mehrfachbau flaege nie auf).
//   §0.3 GUARDFORM: typeof-Pruefung VOR jedem new, try/catch, kein Zugriff
//        auf event.*; resume() IMMER fire-and-forget mit state-Check, NIE
//        await (P2-M5: das Promise erfuellt sich ohne Aktivierung nie).
//   Ohne AudioContext (Node, alle Flusstest-Stubs) ist ALLES hier inert:
//   jede Funktion faellt an `if (!audioCtx) return;` heraus.
// ===========================================================================

const AUDIO_KEY = 'grimlight.audio.v1';
// §4.2 (P2-B4, bindend): Lookahead-Fenster und Resync-Vorlauf in Sekunden.
const MUSIK_LOOKAHEAD = 0.10;
const MUSIK_RESYNC = 0.05;
// §4.4: Blenden. Portal bringt seinen Rahmen mit (FADE_TIME 0,3 s je
// Richtung), die drei fade-losen buildWorld-Pfade bekommen 0,25 s rein
// audioseitig (die Welt entsteht dort in EINEM Frame, Review P2-m5).
const MUSIK_CROSSFADE = 0.3;
const MUSIK_BLENDE = 0.25;
// Referenz-Tonhoehe des Rauschpuffers: chiptune.renderPCM haelt jeden
// Rauschwert rate/f Samples lang. Ein Puffer mit Haltelaenge rate/440 und
// playbackRate f/440 erzeugt exakt dieselbe Haltelaenge in der Ausgabe.
const RAUSCH_F0 = 440;

let audioCtx = null;
let masterGain = null;
let musicBusA = null;
let musicBusB = null;
let sfxBus = null;
let uiBus = null;
let rauschPuffer = null;
// §4.2 (P2-M6): createPeriodicWave kostet ~1 ms je Aufruf, gecacht 0,013 ms.
// Pro Note gebaut waere das Spiel tot — je duty EINE Welle, fuer immer.
let wellenCache = null;
// §6.2: {music, sfx}. Ohne Storage liefert storeLesen null und parseSettings
// die Werkseinstellung an/an — der BOOT-5-Pfad bleibt damit byte-gleich.
let audioSettings = defaultSettings();
let audioSettingsGeladen = false;
// §4.3: geduckt wird NUR ueber die Handpause/das Inventar; suspend() macht
// ausschliesslich der Lifecycle-Pfad (§4.5).
let audioGeduckt = false;
// A1(c): <= 12 SFX-Stimmen, aelteste fliegt (reine Datenstruktur aus mixer.js).
let sfxStimmen = leereStimmen(BUS.maxStimmen);
const sfxKnotenReg = new Map(); // id -> { quellen: [], gain }
let sfxLaufNr = 0;

// §5.5 Rig-Schalter. Gelesen wie main.js __noTint: NUR main.js liest window.
function rigAus(name) {
  try {
    return typeof window !== 'undefined' && window && window[name] === true;
  } catch { return false; }
}

// §4.3/§4.1 ANKERFORM JEDER PEGELAENDERUNG (Review P2-M4, GEMESSEN):
// ohne cancelScheduledValues + setValueAtTime(momentanwert) findet eine
// zweite Rampe 0,7 s lang GAR NICHT statt und laeuft danach trotzdem auf den
// alten Zielwert durch. Exponentiell auf 0 wirft RangeError — deshalb IMMER
// linear.
function rampe(param, ziel, dauer) {
  if (!param || !audioCtx) return;
  try {
    const t = audioCtx.currentTime;
    param.cancelScheduledValues(t);
    param.setValueAtTime(param.value, t);
    param.linearRampToValueAtTime(ziel, t + Math.max(0.005, dauer));
  } catch { /* inert */ }
}

// GEMESSEN im Browser (Chromium, .tmp/slice5_probe-Sonde): ein GainNode OHNE
// anliegende Quelle wird von Chrome NICHT mehr gerechnet — seine AudioParam-
// Automation steht dann still. Eine auf dem leeren sfxBus geplante Rampe auf 0
// bleibt bei 0,75 stehen (selbst setValueAtTime greift nicht), waehrend
// dieselbe Rampe auf einem frisch gebauten Knoten DERSELBEN Uhr sauber laeuft.
// Auf einem STUMMEN Bus ist eine Rampe ohnehin unhoerbar — dort wird der Pegel
// deshalb HART gesetzt. So steht der Bus in jedem Fall auf dem Wert, den
// §4.3/§6.2 verlangen, bevor wieder eine Quelle anliegt.
function setzeHart(param, ziel) {
  if (!param || !audioCtx) return;
  try {
    param.cancelScheduledValues(audioCtx.currentTime);
    param.value = ziel;
  } catch { /* inert */ }
}

// §4.1 BUS-GRAPH (bindend):
//   masterGain <- musicBusA + musicBusB   (Crossfade-Paar)
//   masterGain <- sfxBus                  (Weltklaenge)
//   masterGain <- uiBus                   (Menue; wird NIE geduckt, P2-B3 —
//                                          sonst sind die neuen Pause-Schalter
//                                          unhoerbar)
// Idempotent: der zweite Aufruf ist ein No-Op.
function baueGraph() {
  if (!audioCtx || masterGain) return;
  try {
    masterGain = audioCtx.createGain();
    masterGain.gain.value = BUS.master;      // §4.1 Startwert 0,8
    masterGain.connect(audioCtx.destination);
    musicBusA = audioCtx.createGain();
    musicBusB = audioCtx.createGain();
    musicBusA.gain.value = 0;
    musicBusB.gain.value = 0;
    musicBusA.connect(masterGain);
    musicBusB.connect(masterGain);
    sfxBus = audioCtx.createGain();
    sfxBus.gain.value = audioSettings.sfx ? BUS.sfx : 0;
    sfxBus.connect(masterGain);
    uiBus = audioCtx.createGain();
    uiBus.gain.value = audioSettings.sfx ? BUS.ui : 0;
    uiBus.connect(masterGain);
    wellenCache = new Map();
  } catch { /* inert */ }
}

// §0.3 UNLOCK — WOERTLICH die vom Pruefer GEMESSEN-GRUENE Form (P1-m1).
// Bindend daran: `typeof AC !== 'function'` VOR jedem new, kein Zugriff auf
// event.*, Rueckgabe undefined, aeusseres try um addEventListener.
function audioUnlock() {
  try {
    const AC = (typeof window !== 'undefined' && window)
      ? (window.AudioContext || window.webkitAudioContext) : null;
    if (typeof AC !== 'function') return;        // Node/Stubs: vollstaendig inert
    if (!audioCtx) audioCtx = new AC();
    baueGraph();                                  // idempotent
    audioEinstellungenLaden();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    musikFuerZustand(MUSIK_BLENDE);               // Titelmusik erst nach der Geste
  } catch { /* inert */ }
}
try {
  if (typeof window !== 'undefined' && window
    && typeof window.addEventListener === 'function') {
    window.addEventListener('keydown', () => { try { audioUnlock(); } catch { /* inert */ } });
  }
} catch { /* inert */ }

// §4.5 LIFECYCLE. resume() ist IMMER fire-and-forget mit state-Check.
function audioResume() {
  if (!audioCtx) return;
  try {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    musikResync();
  } catch { /* inert */ }
}
function audioSuspend() {
  if (!audioCtx) return;
  try { if (audioCtx.state === 'running') audioCtx.suspend(); } catch { /* inert */ }
}

// §6.2 Persistenz ueber storeLesen/storeSchreiben und den mixer-Reducer.
// GELESEN wird beim ersten Unlock (nicht im Boot-Pfad), GESCHRIEBEN nur beim
// Umschalten — NIE in saveNow() (sonst wandert der Zug in die BOOT-1/2/3-
// Vergleiche von check_save_slice4, Review "geprueft und gruen").
function audioEinstellungenLaden() {
  if (audioSettingsGeladen) return;
  audioSettingsGeladen = true;
  audioSettings = parseSettings(storeLesen(AUDIO_KEY));
  audioPegelSetzen(0.02);
}
function audioEinstellungenSchreiben() {
  storeSchreiben(AUDIO_KEY, serializeSettings(audioSettings));
}

// --------------------------------------------------------------- KLANGBAU

function holeRauschPuffer() {
  if (rauschPuffer || !audioCtx) return rauschPuffer;
  try {
    const rate = audioCtx.sampleRate || 44100;
    const n = Math.max(1, Math.floor(rate));
    rauschPuffer = audioCtx.createBuffer(1, n, rate);
    const d = rauschPuffer.getChannelData(0);
    // Deterministischer LFSR wie chiptune.js (kein Math.random im Klangpfad).
    let s = 0xC0FFEE;
    const halteLaenge = Math.max(1, Math.round(rate / RAUSCH_F0));
    let halt = 0;
    let wert = 0;
    for (let i = 0; i < n; i++) {
      if (halt <= 0) {
        s ^= s << 13; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
        wert = (s / 0xFFFFFFFF) * 2 - 1;
        halt = halteLaenge;
      }
      halt--;
      d[i] = wert;
    }
  } catch { rauschPuffer = null; }
  return rauschPuffer;
}

// Pulswelle mit Tastgrad. 32 Harmonische (Review P2-M6: 64 kosten das Vier-
// bis Zehnfache), je duty genau EINE Welle im Cache.
function pulsWelle(duty) {
  if (!audioCtx || !wellenCache) return null;
  const key = Math.round(duty * 1000) / 1000;
  let w = wellenCache.get(key);
  if (w === undefined) {
    try {
      const n = 32;
      const real = new Float32Array(n + 1);
      const imag = new Float32Array(n + 1);
      for (let k = 1; k <= n; k++) real[k] = (2 / (k * Math.PI)) * Math.sin(Math.PI * k * key);
      w = audioCtx.createPeriodicWave(real, imag);
    } catch { w = null; }
    wellenCache.set(key, w);
  }
  return w;
}

// Ein Ereignis {t,dauer,ch,freq,instr,vol,fx,slideTo} zu Knoten machen.
// Huellkurve wie chiptune.renderPCM: Attack -> Decay auf Sustain -> Release,
// dauer schliesst den Release EIN.
function baueTon(ziel, instrumente, e, t0, pegel) {
  if (!audioCtx || !ziel) return null;
  const inst = instrumente[e.instr];
  if (!inst) return null;
  const dauer = Math.max(0.01, e.dauer);
  const spitze = Math.max(0.0001, (e.vol ?? inst.vol ?? 0.2) * pegel);
  const a = Math.min(dauer * 0.5, Math.max(0.001, inst.attack ?? 0.005));
  const r = Math.min(dauer - a, Math.max(0.005, inst.release ?? 0.05));
  const dec = Math.max(0, inst.decay ?? 0);
  const sus = inst.sustain ?? 1;
  const g = audioCtx.createGain();
  g.connect(ziel);
  const p = g.gain;
  p.setValueAtTime(0, t0);
  p.linearRampToValueAtTime(spitze, t0 + a);
  const relStart = t0 + Math.max(a, dauer - r);
  if (dec > 0) {
    const decEnde = t0 + a + dec;
    if (decEnde < relStart) {
      p.linearRampToValueAtTime(spitze * sus, decEnde);
      p.setValueAtTime(spitze * sus, relStart);
    } else {
      const anteil = Math.min(1, (relStart - t0 - a) / dec);
      p.linearRampToValueAtTime(spitze * (1 + (sus - 1) * anteil), relStart);
    }
  } else {
    p.setValueAtTime(spitze, relStart);
  }
  p.linearRampToValueAtTime(0, t0 + dauer);

  const art = inst.art || 'pulse';
  const hatSlide = e.slideTo !== null && e.slideTo !== undefined;
  const arp = inst.arp || [0, 3, 7];
  let quelle = null;
  let tonParam = null;   // frequency (Oszillator) bzw. playbackRate (Rauschen)
  let bezug = 1;         // Umrechnung Hz -> Parameterwert
  if (art === 'noise') {
    const puf = holeRauschPuffer();
    if (!puf) { try { g.disconnect(); } catch { /* inert */ } return null; }
    quelle = audioCtx.createBufferSource();
    quelle.buffer = puf;
    quelle.loop = true;
    tonParam = quelle.playbackRate;
    bezug = 1 / RAUSCH_F0;
  } else {
    quelle = audioCtx.createOscillator();
    if (art === 'tri') quelle.type = 'triangle';
    else if (art === 'sine') quelle.type = 'sine';
    else {
      const w = pulsWelle(inst.duty ?? 0.5);
      if (w) quelle.setPeriodicWave(w); else quelle.type = 'square';
    }
    tonParam = quelle.frequency;
    bezug = 1;
  }
  try {
    tonParam.setValueAtTime(e.freq * bezug, t0);
    if (hatSlide) tonParam.linearRampToValueAtTime(e.slideTo * bezug, t0 + dauer);
    if (e.fx.includes('a')) {
      // Arpeggio: 32 Stufen je Sekunde, hoechstens ueber die Notendauer.
      const schritte = Math.min(64, Math.floor(dauer * 32));
      for (let i = 0; i < schritte; i++) {
        const halbton = arp[i % arp.length];
        const basis = hatSlide ? e.freq + (e.slideTo - e.freq) * (i / Math.max(1, schritte)) : e.freq;
        tonParam.setValueAtTime(basis * Math.pow(2, halbton / 12) * bezug, t0 + i / 32);
      }
    }
  } catch { /* inert */ }
  quelle.connect(g);
  let lfo = null;
  let lfoGain = null;
  if (e.fx.includes('v') && art !== 'noise') {
    try {
      lfo = audioCtx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(6, t0);          // §2.1: 6 Hz, +-0,6 %
      lfoGain = audioCtx.createGain();
      lfoGain.gain.setValueAtTime(e.freq * 0.006, t0);
      lfo.connect(lfoGain);
      lfoGain.connect(tonParam);
      lfo.start(t0);                                 // §0.2 ZEITARGUMENT
      lfo.stop(t0 + dauer + 0.02);                   // §0.2 ZEITARGUMENT
    } catch { lfo = null; }
  }
  quelle.start(t0);                                  // §0.2 ZEITARGUMENT
  quelle.stop(t0 + dauer + 0.02);                    // §0.2 ZEITARGUMENT
  quelle.onended = () => {
    try { quelle.disconnect(); } catch { /* inert */ }
    try { g.disconnect(); } catch { /* inert */ }
    try { if (lfoGain) lfoGain.disconnect(); } catch { /* inert */ }
  };
  return quelle;
}

// ------------------------------------------------------------------- SFX

function audioPegelSetzen(dauer) {
  if (!audioCtx || !masterGain) return;
  const stimmen = aktiveStimmen(sfxStimmen);
  const n = Math.max(1, stimmen);
  const sfxZiel = (audioGeduckt || !audioSettings.sfx) ? 0 : sfxBusGain(n);
  const uiZiel = audioSettings.sfx ? BUS.ui : 0;   // §4.3: uiBus wird NIE geduckt
  if (stimmen === 0) {          // stummer Bus -> harter Wert (s. setzeHart)
    setzeHart(sfxBus.gain, sfxZiel);
    setzeHart(uiBus.gain, uiZiel);
  } else {
    rampe(sfxBus.gain, sfxZiel, dauer);
    rampe(uiBus.gain, uiZiel, dauer);
  }
  musikPegelSetzen(dauer);
}

function stoppeStimme(id) {
  const eintrag = sfxKnotenReg.get(id);
  sfxKnotenReg.delete(id);
  if (!eintrag || !audioCtx) return;
  const t = audioCtx.currentTime;
  for (const q of eintrag.quellen) {
    try { q.stop(t); } catch { /* inert */ }     // §0.2 ZEITARGUMENT
  }
}

/**
 * §3 SFX abspielen. key ist ein Schluessel aus game/js/audio/sfx.js.
 * opts: { stufe } Gold-Tonhoehentreppe, { variante } Schritt links/rechts.
 * Ohne AudioContext, mit __noAudio oder bei TON: AUS passiert nichts.
 */
function spieleSfx(key, opts) {
  if (!audioCtx || !masterGain || rigAus('__noAudio')) return;
  if (!audioSettings.sfx) return;
  let buendel = null;
  try { buendel = sfxRender(key, opts || {}); } catch { return; }
  const ziel = buendel.bus === 'ui' ? uiBus : sfxBus;
  if (buendel.bus !== 'ui' && audioGeduckt) return; // §4.3: Weltklaenge stumm
  const t0 = audioCtx.currentTime;                  // P2-m8: nie mit Vorlauf
  const id = ++sfxLaufNr;
  const alloc = allocVoice(sfxStimmen, id, t0);
  sfxStimmen = alloc.state;
  if (alloc.evicted) stoppeStimme(alloc.evicted.id);
  const quellen = [];
  for (const e of buendel.events) {
    const q = baueTon(ziel, buendel.instruments, e, t0 + e.t, 1);
    if (q) quellen.push(q);
  }
  if (quellen.length === 0) {
    sfxStimmen = freeVoice(sfxStimmen, id);
    return;
  }
  sfxKnotenReg.set(id, { quellen });
  let offen = quellen.length;
  for (const q of quellen) {
    const vorher = q.onended;
    q.onended = () => {
      if (typeof vorher === 'function') vorher();
      offen -= 1;
      if (offen <= 0) {
        sfxKnotenReg.delete(id);
        sfxStimmen = freeVoice(sfxStimmen, id);
        audioPegelSetzen(0.02);
      }
    };
  }
  audioPegelSetzen(0.02);
}

/** Menue-/Systemklang. Laeuft ueber den uiBus und bleibt in der Pause hoerbar. */
function uiTon(key) {
  spieleSfx(key);
}

// ----------------------------------------------------------------- MUSIK
// §4.2 SEQUENCER. Zwei Slots A/B = das Crossfade-Paar aus §4.1. Jeder Slot
// haelt seine EIGENE Musik-Uhr (idx/basis), NICHT currentTime-Differenzen:
// currentTime laeuft bei blockiertem Main-Thread weiter (gemessen, P2-B4) und
// steht bei suspend() — beides wuerde die Pattern-Position zerstoeren.

const musikSlots = [
  { key: null, bundle: null, bus: null, idx: 0, basis: 0, ersterLoopIdx: 0, ziel: 0, einmalig: false, fertig: false },
  { key: null, bundle: null, bus: null, idx: 0, basis: 0, ersterLoopIdx: 0, ziel: 0, einmalig: false, fertig: false },
];
let musikAktiv = 0;          // Index des Slots, der gerade den Ton fuehrt
let musikSchluessel = null;  // laufender Song-Schluessel (Respawn-Vergleich)
const musikKompiliert = new Map(); // key -> {instruments, events, loopFrom, loopTime}

function holeMusik(key) {
  if (!key) return null;
  if (musikKompiliert.has(key)) return musikKompiliert.get(key);
  let b = null;
  try {
    const song = SONGS[key];
    if (song) {
      const k = compileSong(song);
      b = {
        instruments: song.instruments,
        events: k.events,
        loopFrom: k.loopFrom,
        loopTime: k.loopTime,
        einmalig: song.einmalig === true,
      };
    }
  } catch { b = null; }
  musikKompiliert.set(key, b);
  return b;
}

function musikPegelSetzen(dauer) {
  if (!audioCtx || !musicBusA) return;
  // §4.3: Ducking wirkt als FAKTOR auf das Crossfade-Paar — der Bus-Graph aus
  // §4.1 bleibt damit exakt so, wie die Spec ihn festschreibt (kein
  // Zusatzknoten zwischen Paar und Master).
  const faktor = (audioSettings.music ? 1 : 0) * (audioGeduckt ? BUS.duck : 1);
  const busse = [musicBusA, musicBusB];
  for (let i = 0; i < 2; i++) {
    const s = musikSlots[i];
    const ziel = s.ziel * BUS.music * faktor;
    // Nur ein Slot mit laufendem Song hat eine Quelle am Bus (s. setzeHart).
    if (!s.bundle || s.fertig) setzeHart(busse[i].gain, ziel);
    else rampe(busse[i].gain, ziel, dauer);
  }
}

function slotStoppen(s) {
  s.key = null;
  s.bundle = null;
  s.ziel = 0;
  s.fertig = true;
}

/**
 * §4.4 Song wechseln. Gleicher Schluessel => NICHTS (Respawn auf derselben
 * Karte laesst die Musik durchlaufen, P2-m5). Sonst Crossfade ueber das
 * A/B-Paar: der abgehende Slot rampt auf 0, der neue startet sofort.
 */
function musikStarten(key, blende) {
  if (!audioCtx || !masterGain || rigAus('__noAudio')) return;
  if (key === musikSchluessel) return;
  musikSchluessel = key;
  const alt = musikSlots[musikAktiv];
  const neu = musikSlots[1 - musikAktiv];
  alt.ziel = 0;
  slotStoppen(neu);
  const b = key ? holeMusik(key) : null;
  if (b && b.events.length > 0) {
    neu.key = key;
    neu.bundle = b;
    neu.bus = (1 - musikAktiv) === 0 ? musicBusA : musicBusB;
    neu.idx = 0;
    neu.basis = audioCtx.currentTime + MUSIK_RESYNC;
    neu.einmalig = b.einmalig;
    neu.fertig = false;
    neu.ziel = 1;
    neu.ersterLoopIdx = 0;
    for (let i = 0; i < b.events.length; i++) {
      if (b.events[i].t >= b.loopFrom - 1e-9) { neu.ersterLoopIdx = i; break; }
    }
  }
  musikAktiv = 1 - musikAktiv;
  musikPegelSetzen(blende || MUSIK_CROSSFADE);
}

/** §4.2 RESYNC nach resume()/Sichtbarkeits-Rueckkehr: naechste Events ab
 *  currentTime + 0,05. Es wird NIE nachgeholt — die Pattern-Position kommt
 *  aus der eigenen Uhr (idx), nur der Zeitanker wird neu gesetzt. */
function musikResync() {
  if (!audioCtx) return;
  const jetzt = audioCtx.currentTime;
  for (const s of musikSlots) {
    if (!s.bundle || s.fertig) continue;
    const ev = s.bundle.events[Math.min(s.idx, s.bundle.events.length - 1)];
    if (!ev) continue;
    if (s.basis + ev.t < jetzt - MUSIK_RESYNC) s.basis = jetzt + MUSIK_RESYNC - ev.t;
  }
}

/** §4.2 Fenster nachfuellen. GENAU EINE Nachfuellung je 60-Hz-Tick. */
function musikTick() {
  if (!audioCtx || !masterGain) return;
  if (!audioSettings.music) return;
  const horizont = audioCtx.currentTime + MUSIK_LOOKAHEAD;
  for (const s of musikSlots) {
    if (!s.bundle || s.fertig || s.ziel <= 0) continue;
    const b = s.bundle;
    let wache = 0;
    while (wache++ < 96) {
      if (s.idx >= b.events.length) {
        if (s.einmalig) { s.fertig = true; break; }
        s.basis += b.loopTime;          // loopFrom + loopTime === Gesamtdauer
        s.idx = s.ersterLoopIdx;
        continue;
      }
      const ev = b.events[s.idx];
      let t = s.basis + ev.t;
      if (t > horizont) break;
      // §4.2 RESYNC-REGEL (P2-B4, woertlich): liegt das naechste Ereignis mehr
      // als 0,05 s in der Vergangenheit (Main-Thread-Stall, Rueckkehr aus dem
      // Hintergrund), wird NICHT nachgeholt — der Zeitanker springt auf
      // currentTime + 0,05, die Pattern-Position bleibt, wo die Musik-Uhr
      // steht. Ohne das schedult die Schleife alle verpassten Noten mit
      // Startzeiten in der Vergangenheit: WebAudio startet sie sofort und
      // alle gleichzeitig (Cluster-Knall).
      if (t < audioCtx.currentTime - MUSIK_RESYNC) {
        s.basis = audioCtx.currentTime + MUSIK_RESYNC - ev.t;
        t = s.basis + ev.t;
        if (t > horizont) break;
      }
      baueTon(s.bus, b.instruments, ev, t, 1);
      s.idx += 1;
    }
  }
}

/**
 * §4.4 Welcher Song gehoert zum aktuellen Zustand? EINE Quelle fuer alle
 * Screen- und Kartenwechsel; der Boss-Aggro-Zweig ist die zweite Ebene
 * (mapDef.music traegt 'boss_idle', der Kampf schaltet auf 'boss_aggro').
 */
function musikFuerZustand(blende) {
  if (!audioCtx || !masterGain) return;
  let key = null;
  if (state === 'title') key = 'title';
  else if (state === 'gameover') key = 'gameover';
  else if (state === 'victory') key = 'victory';
  else if (mapDef) key = bossAggro ? 'boss_aggro' : (mapDef.music || null);
  musikStarten(key, blende);
}

// §3.3: der Spielstand wird beim Boot nur GELESEN, nicht angewandt. Er
// entscheidet allein, ob der Titel ein Menue zeigt. Ohne Storage ist er null
// und der komplette Startpfad bleibt byte-gleich zum Bestand.
let savedGame = deserialize(storeLesen(SAVE_KEY));
let titleCursor = 0;      // 0 = FORTSETZEN, 1 = NEUES SPIEL
let titleHeldY = false;   // Flanke fuer die Menue-Navigation

// §3.2 SCHREIBEN. Die Hooks sitzen bewusst NICHT in buildWorld (Review
// P1-B4): dort sieht der Respawn-Pfad hp = 0 (das carry kopiert prev.hp,
// hp = maxHp faellt erst danach), und der Titel-Start wuerde ueber resetRun
// bei JEDEM Confirm den alten Stand ueberschreiben. Gespeichert wird an den
// vier Stellen, an denen der Zustand VOLLSTAENDIG hergestellt ist:
//   (a) nach vollzogenem Portal-Wechsel (Fade fertig)
//   (b) nach Respawn-Abschluss (hp/deathToll gesetzt)
//   (c) im pagehide/visibilitychange-Pfad (§4.1)
//   (d) beim Pausieren ueber die Android-Zurueck-Taste (§4.5)
// Im resetRun-Pfad wird NIE gespeichert.
function saveNow() {
  if (!store || !player || !currentMapKey || !lastSpawn) return;
  storeSchreiben(SAVE_KEY, serialize({
    mapKey: currentMapKey, spawn: lastSpawn, player, runFlags,
  }));
}

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
// SLICE 6 §0.3 — TRANK-SCHLUCKER. Zwillingsbruder von attackSwallow: der
// B-Knopf liegt bei (252,144) r12 und wird von input.js OHNE visible-Pruefung
// ausgewertet (input.js:236-238 — nur W fragt `w.visible`). Ein Tap dorthin
// waehrend des Dialogs landet also trotz visible:false in potionIds; ohne den
// Schlucker leerte der noch gehaltene Pegel im ersten freien Frame ein Glas
// (player.js:116 erkennt die Flanke selbst). Gleiche Heilung wie oben: der
// Pegel wird geschluckt, bis er einmal losgelassen wurde.
let trankSwallow = false;
// SLICE 6 §2/§3 — Dorf-Zustand. npcs lebt wie enemies/props je Karte (buildWorld
// baut es neu); npcNahe ist die Rueckgabe des letzten updateNpcs (§2.3).
let npcs = [];
let npcNahe = null;
let dialogZustand = null;   // dialog.js-Reducerzustand (null = kein Dialog)
let dialogNpc = null;       // der NPC, der gerade redet (Sprech-Frame)
let dialogHeldConfirm = true;
let dialogHeldX = false;
let dialogHeldY = false;
const shopUI = createShopUI();
let shopHeldCursor = 0;     // Menue-Flanke fuer menu_move (Muster audioInvCursor)
// Slice 3: Toast traegt jetzt eine Prioritaet (level_up > key/heart/weapon_found
// > item_pickup > Rest). Ein Slot; ein neuer ersetzt den alten NUR bei >=
// Prioritaet (dokumentierte Abweichung von Slice 2 "ein neuer ersetzt den
// alten"; betrifft nur gleichzeitige Events im selben Frame, kein Alt-Test).
let toast = null;
let zeldaWasAir = false;
let zeldaBlink = 0;
// Slice 3: Progression/Boss-Run-Zustand.
// Slice 4 §3.4: openedChests kommt dazu — Schluessel `MAP:tx,ty` je bereits
// geoeffneter Truhe. Beides wird in resetRun zurueckgesetzt.
// Slice 6 §5: die VIER neuen v2-Felder haengen am selben Traeger (quests,
// npcFlags, gekauft, dorfBesuche). neueRunFelder() liefert die Defaults —
// derselbe Satz, den save.js beim Laden eines v2-Standes OHNE die Felder
// einsetzt. resetRun leert alle vier (leereRunFelder, SPEC §5 deklariert).
let runFlags = { bossDead: false, openedChests: [], ...neueRunFelder() };   // Reset in resetRun
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

// ===========================================================================
// SLICE 5 §5 — GAME-FEEL-ZUSTAND (Hitstop / Shake / Flash) und §3 — die
// Flanken-Speicher des Audio-Beobachters.
//
// §5.1 HITSTOP: 2 / 3 / 4 Frames fuer Schwert-Treffer / Kill / Spieler trifft
// Boss. Die Zahlen sind GEMESSENE TEST-GRENZEN, kein Geschmack: bei H = 4
// kippen 12 Assertions in check_inventory_slice2 (dessen Fenster :280 ist
// 22 Frames gegen ATTACK_TOTAL = 21 Frames). SPIELER-SCHADEN loest NIEMALS
// Hitstop aus — check_boss_slice3:253-255 hat GENAU EINEN Frame zwischen
// hp = 0 und der GAME-OVER-Pruefung (Review P1-B2, gemessen rot).
const HITSTOP_H = 2;   // Schwert trifft Gegner (OBERGRENZE)
const HITSTOP_K = 3;   // Kill
const HITSTOP_B = 4;   // Spieler trifft Boss
let hitstop = 0;
// §5.1 EINGABE-PUFFER: im Freeze laeuft player.update nicht, input.postUpdate
// aber schon — ein Ein-Frame-Impuls (keydown/frame/keyup, check_main:180,
// check_inventory:279) wuerde verschluckt. Das trifft auch Michael am Geraet
// (schneller Doppelhieb). Der Pegel wird deshalb gemerkt und im ersten freien
// Frame wieder gesetzt.
let attackPuffer = false;
// §5.2 SHAKE. NUR ganzzahliger Offset auf einer gemerkten Kamera-BASIS, neu
// angewandt in JEDEM Zweig (auch Freeze), Abklingen auf der WANDUHR (der
// Freeze zaehlt mit, sonst friert der Rest ein und schlaegt nach dem Respawn
// zurueck — Review P1-M2/P2-M7, gemessen check_main:293 ROT ohne).
const SHAKE_MAX_TICKS = 12;
let shakeBasisX = 0;
let shakeBasisY = 0;
let shakeTicks = 0;
let shakeAmp = 0;
let shakePhase = 0;
let shakeOffX = 0;
let shakeOffY = 0;
// §5.3 FLASH. Deckung in der rgba-FUELLFARBE bei globalAlpha 1, gezeichnet
// NACH lighting.draw — beide Detektoren (fadeAlpha verlangt '#000',
// ambientAlpha nur Nicht-Haupt-Canvas) bleiben stumm (Review P1-m4, gemessen).
let flashFrames = 0;
// §3 Flanken-Speicher. WeakMap, weil buildWorld neue Entities erzeugt
// (Muster TINT_PREV, main.js oben).
const AUDIO_HURT = new WeakMap();   // Gegner -> letzter hurtTimer
const AUDIO_STATE = new WeakMap();  // Gegner -> letzter state
const AUDIO_MARK = new WeakMap();   // Gegner -> hatte marker?
const AUDIO_PROP = new WeakMap();   // Prop -> letzter state/opened
let audioAttackId = -1;             // Flanke des Schwertschwungs
let audioInvuln = 0;                // Flanke des Spielerschadens
let audioAirVor = false;            // Bumerang in der Luft (Vorframe)
let audioFadeVor = 'none';          // Portal-Fade-Flanke
let audioSchrittFrame = -1;         // letzter Lauf-Frame-Index
let audioSchrittZaehler = 0;        // jeder ZWEITE Frame-Wechsel klingt
let audioSchrittUhr = 0;            // Mindestabstand 0,22 s (=> ~2,5 Schritte/s)
let audioSchrittSeite = 0;          // links/rechts, deterministisch
let goldKette = 0;                  // Tonhoehen-Treppe bei Muenzketten
let goldKetteUhr = 0;               // Ketten-Fenster (Entprellung)
let bossAggro = false;              // §4.4 zweite Musik-Ebene
let audioPauseCursor = 0;           // Menue-Flanken (Pause)
let audioTitleCursor = 0;           // Menue-Flanken (Titel)
let audioInvCursor = 0;             // Menue-Flanken (Inventar)

function pushToast(text, color, prio) {
  if (!toast || prio >= toast.prio) toast = { text, color, prio, t: 0 };
}

// §5.2 SHAKE — die drei Bausteine.
//
// (1) NULLUNG. Doppelt: enterState UND buildWorld. Ohne die enterState-Nullung
//     friert der Restzaehler beim Tod ein und schlaegt nach dem Respawn zurueck
//     (gemessen: check_main_slice1:293 Zentrum-screen 217 statt 216).
function shakeNullen() {
  shakeTicks = 0;
  shakeAmp = 0;
  shakePhase = 0;
  shakeOffX = 0;
  shakeOffY = 0;
}

// (2) AUSLOESEN. amp in px (1-2 normal, 3 Boss-Dash), Wirkzeit <= 12 Ticks.
function shakeAusloesen(amp) {
  if (rigAus('__noShake')) return;
  const a = Math.max(0, Math.min(3, amp));
  if (a <= 0) return;
  if (a >= shakeAmp) {
    shakeAmp = a;
    shakeTicks = SHAKE_MAX_TICKS;
  }
}

// (3) FORTSCHREIBEN auf der WANDUHR: genau einmal je update()-Tick, ganz oben,
//     also AUCH im Freeze und im Fade. Der Offset ist IMMER ganzzahlig —
//     playerScreen() misst Math.round(worldX - cam.x), und fuer ganzzahliges k
//     gilt Math.round(a - (b + k)) = Math.round(a - b) - k: bei k = 0 ist die
//     Messung BITGLEICH zum Bestand (Review P1-m2).
function shakeFortschreiben() {
  if (shakeTicks <= 0) {
    shakeOffX = 0;
    shakeOffY = 0;
    shakeAmp = 0;
    return;
  }
  shakeTicks -= 1;
  shakePhase += 1;
  const a = shakeAmp * (shakeTicks / SHAKE_MAX_TICKS);
  shakeOffX = Math.round(a * (shakePhase % 2 ? 1 : -1));
  shakeOffY = Math.round(a * (shakePhase % 4 < 2 ? 1 : -1) * 0.6);
  if (shakeTicks === 0) {          // zweite Nullung: Ruhe ist exakt 0
    shakeOffX = 0;
    shakeOffY = 0;
    shakeAmp = 0;
  }
}

// (4) ANWENDEN auf die gemerkte Basis, MIT Nach-Klemmung auf den Weltrand
//     (camera.follow klemmt, der Offset koennte sonst ueber den Kartenrand
//     schieben — Review P1-m2). Wird in JEDEM Zweig gerufen, auch im Freeze.
function shakeAnwenden() {
  if (!map) return;
  const maxX = Math.max(0, map.wPx - VIEW_W);
  const maxY = Math.max(0, map.hPx - VIEW_H);
  camera.x = Math.min(Math.max(shakeBasisX + shakeOffX, 0), maxX);
  camera.y = Math.min(Math.max(shakeBasisY + shakeOffY, 0), maxY);
}

function followPlayer() {
  camera.follow(player.x + player.w / 2, player.y + player.h / 2, map.wPx, map.hPx);
  // §5.2: die BASIS ist der geklemmte follow()-Wert; der Shake liegt als
  // ganzzahliger Nachschlag DARUEBER (camera.follow setzt x/y absolut, ein
  // davor addierter Offset waere wirkungslos).
  shakeBasisX = camera.x;
  shakeBasisY = camera.y;
  shakeAnwenden();
}

function syncPlayerLight() {
  playerLight.x = player.x + player.w / 2;
  playerLight.y = player.y + player.h / 2;
}

// ===========================================================================
// SLICE 4 §3.4 — GEOEFFNETE TRUHEN.
//
// DATENQUELLE ist die props-LISTE, nicht der Event-Strom: die Events aus
// props.js tragen weder mapKey noch Position, und die Gold-Truhe pusht
// ueberhaupt kein Event (Review P1-B5/P2-M1). Der Schluessel ist Karte +
// KACHEL der AABB-Ecke; er wird an genau zwei Stellen gebildet — hier — und
// beide Male aus einem fertigen Prop-Objekt.
// ===========================================================================
function chestKey(mapKey, p) {
  return `${mapKey}:${(p.x / 16) | 0},${(p.y / 16) | 0}`;
}

// Die SIEGTRUHE entsteht per push (nicht aus propSpawns) und ist von
// Registrierung UND Filter ausgenommen: die Bestandszusage "der Sieg bleibt
// nach Verlassen/Rueckkehr erreichbar" bleibt damit wortwoertlich gueltig
// (Review P1-M5; §9 deklariert, dass genau diese eine Truhe weiter refillt).
function markSiegtruhe(ps) {
  for (const p of ps) p.siegChest = true;
  return ps;
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
  // SLICE 4 §3.4: bereits geoeffnete Truhen werden NICHT neu erzeugt (sonst
  // wird der Bestandskompromiss "Truhen fuellen sich beim Wiederbetreten neu"
  // durch das Save zur Gold-Farm). Gefiltert wird auf dem ERGEBNIS von
  // createProps: das ist per Definition eine KOPIE (createProps mappt),
  // mapDef.propSpawns bleibt also unangetastet — Pflicht, sonst fehlt der
  // Boss/die Truhe nach resetRun dauerhaft (Kommentar oben, Review P2-M2).
  // Zweiter Grund fuer den Filter NACH createProps: der Schluessel entsteht
  // aus derselben Prop-Geometrie wie bei der Registrierung unten
  // (props.js legt die AABB-Ecke auf spawn - w/2), es gibt keine zweite
  // Rechnung, die auseinanderlaufen koennte.
  const alleProps = createProps(mapDef.propSpawns);
  props = runFlags.openedChests.length === 0
    ? alleProps
    : alleProps.filter((p) => !(p.kind === 'chest'
      && runFlags.openedChests.includes(chestKey(mapKey, p))));
  // §3: nach besiegtem Boss die Siegtruhe statisch bei tc(10,4) hinlegen —
  // der Sieg bleibt nach Verlassen/Rueckkehr erreichbar.
  if (mapKey === 'BOSS_KAMMER' && runFlags.bossDead) {
    props.push(...markSiegtruhe(createProps([{ ...tc(10, 4), kind: 'chest', content: 'treasure' }])));
  }
  // SLICE 6 §2.1: NPCs aus mapDef.npcSpawns (Weltpixel = AABB-ZENTRUM, wie
  // enemies). Das Feld ist OPTIONAL — Muster mapDef.extraLights: fehlt es
  // (alle vier Bestandskarten und die injizierte TESTMAP der Flusstests),
  // bleibt die Liste leer und jede NPC-Schleife ist ein No-Op.
  npcs = createNpcs(mapDef.npcSpawns || []);
  npcNahe = null;
  dialogZustand = null;
  dialogNpc = null;
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
  // §5.2 ZWEITE harte Nullung (neben enterState): eine neue Welt startet nie
  // mit einem Kamera-Rest.
  shakeNullen();
  hitstop = 0;
  // §4.4 KARTENMUSIK am EINEN Umschaltpunkt. Gleicher Song-Schluessel =>
  // musikStarten ist ein No-Op, der Respawn auf derselben Karte laesst die
  // Musik also durchlaufen (P2-m5). Der Portal-Pfad laeuft mitten im Fade und
  // bekommt die 0,3-s-Blende, die drei fade-losen Pfade 0,25 s.
  bossAggro = false;
  musikFuerZustand(fadePhase === 'none' ? MUSIK_BLENDE : MUSIK_CROSSFADE);
  // §4.4: die Kampf-Ebene VORWAERMEN. compileSong('boss_aggro') kostet
  // gemessen 2,19 ms (1027 Ereignisse) — auf einem 6x gedrosselten Handy
  // waeren das ~13 ms und damit ein verlorener Frame GENAU im Moment, in dem
  // der Grabwaechter erwacht. Hier laeuft es im ohnehin teuren Weltaufbau
  // hinter der Blende. holeMusik cacht, der spaetere Wechsel ist dann gratis.
  if (mapDef.music === 'boss_idle') holeMusik('boss_aggro');
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
  // §3.4 PFLICHT: die Truhen-Liste MUSS mitzurueckgesetzt werden. Bliebe sie
  // stehen, fehlten im neuen Run die boss_key- und die heart-Truhe — das
  // Boss-Portal waere fuer immer VERSCHLOSSEN und der Run unloesbar
  // (Review P1-B5; kein Bestandstest faengt das, check_boss injiziert den
  // Schluessel von Hand).
  runFlags.openedChests = [];
  // SLICE 6 §5 (deklariert): ALLE VIER neuen Felder sind RUN-gebunden und
  // werden geleert — Quests, Gespraechsmarken, Einmalwaren, Besuchszaehler.
  // leereRunFelder fasst bossDead/openedChests NICHT an (quest.js:251-258).
  leereRunFelder(runFlags);
  // SLICE 6 §3 (Phase-2-Nachfix): der LADEN haelt eigenen Laufzeitzustand, der
  // NICHT in runFlags liegt und die Sitzung ueberlebt — `const shopUI` wird
  // genau einmal beim Boot gebaut. Run-gebunden sind darin ui.besuch (der
  // Dorfbesuch, dessen Auslage gerade steht) und ui.verkauft (die in DIESEM
  // Besuch geleerten Einzelstuecke). leereRunFelder setzt dorfBesuche auf 0;
  // ohne den Reset traefe der erste Dorfbesuch des NEUEN Runs auf ui.besuch
  // aus dem ALTEN Run und die dort gekauften Stuecke fehlten in der Auslage.
  // Die Auslage selbst bleibt deterministisch: sie wird aus (dorfBesuche,
  // slotIndex) gewuerfelt (shop_ui.saatRng), nicht aus diesem Objekt.
  resetShopUI(shopUI);
  buildWorld(startMapKey, MAPS[startMapKey].playerSpawn, false);
}

// §3.3 FORTSETZEN. Der Snapshot wird erst HIER angewandt — der Titel selbst
// laesst ihn unberuehrt. Reihenfolge: Run-Flags (steuern Boss-Filter,
// Siegtruhe und Truhen-Filter in buildWorld) -> Welt bauen (carry = false,
// frischer Spieler) -> carry-Reihenfolge aus dem Snapshot (save.js).
function ladeSpielstand(snap) {
  runFlags.bossDead = snap.runFlags.bossDead;
  runFlags.openedChests = snap.runFlags.openedChests.slice();
  // SLICE 6 §5 (A1-Gate "geladene Quest-Felder feldweise identisch"): die vier
  // v2-Felder werden FELDWEISE kopiert, nie als Referenz uebernommen — sonst
  // teilten Laufzeit und Snapshot denselben Zustand. deserialize liefert
  // IMMER die v2-Form (v1 laeuft durch migrateV1), die Felder stehen also.
  const rf = snap.runFlags;
  runFlags.quests = {};
  for (const id of Object.keys(rf.quests || {})) {
    const q = rf.quests[id];
    runFlags.quests[id] = { status: q.status, zaehler: q.zaehler };
  }
  runFlags.npcFlags = {};
  for (const marke of Object.keys(rf.npcFlags || {})) runFlags.npcFlags[marke] = rf.npcFlags[marke];
  runFlags.gekauft = Array.isArray(rf.gekauft) ? rf.gekauft.slice() : [];
  runFlags.dorfBesuche = Number.isFinite(rf.dorfBesuche) ? rf.dorfBesuche : 0;
  // Netz fuer den v2-Stand OHNE die Felder (Review M1, idempotent) …
  sichereRunFelder(runFlags);
  // … und EIN Nachlauf der Flaggen-Beobachter: ein geladenes Q3 bei bereits
  // totem Boss haenge sonst fuer immer auf 'aktiv' (quest.js §4b-Loch).
  questRunFlagEvent(runFlags.quests, runFlags);
  player = null;
  victoryTimer = 0;
  fadePhase = 'none';
  fadeT = 0;
  pendingPortal = null;
  buildWorld(snap.mapKey, snap.spawn, false);
  applyToPlayer(player, snap);
}

// §3/§4.4: enterState ist der EINE Ort fuer Screen-Musik und Ducking (P2-M8:
// ausserhalb feuert jedes Ereignis mehrfach). §5.1/§5.2: Hitstop und Shake
// werden hier HART genullt — sonst laeuft ein Rest ueber den Zustandswechsel
// hinweg weiter (gemessen rot, Review P1-M2).
function enterState(next) {
  shakeNullen();
  hitstop = 0;
  flashFrames = 0;
  state = next;
  stateTime = 0;
  input.consumeConfirm();
  // §4.3: Handpause und Inventar DUCKEN nur (Musik laeuft weiter, sfxBus
  // stumm, uiBus HOERBAR). Suspendiert wird ausschliesslich im Lifecycle.
  audioGeduckt = next === 'paused' || next === 'inventory';
  audioPegelSetzen(BUS.duckRampe);
  // §4.4 Stinger/Screen-Musik. Game-Over und Sieg haben 0,7 s Mindest-
  // Anzeigezeit — genau der Platz fuer den Stinger.
  if (next === 'gameover') uiTon('game_over_stinger');
  else if (next === 'victory') uiTon('victory_stinger');
  musikFuerZustand(MUSIK_BLENDE);
}

// ===========================================================================
// SLICE 4 §4.4 — QUERFORMAT, BROWSER-FALLBACK.
//
// Der eigentliche Lock sitzt im AndroidManifest (sensorLandscape, §2.1); das
// hier ist nur die Browser-Variante fuer Michaels Handy-Chrome. Bedingungen,
// alle drei bindend:
//   * NUR bei input.touch.active === true. requestFullscreen wuerde sonst
//     auch seinen PC-Browser auf Port 8123 ins Vollbild reissen (ESC noetig)
//     und screen.orientation.lock dort NotSupportedError werfen (Review
//     P2-m3).
//   * EXAKTE §0.2-Guardform: typeof-Pruefung, Feld-Pruefung,
//     typeof-Funktions-Pruefung, alles in try/catch, Promise nur behandeln,
//     wenn sie eine ist. Die Stubs haben WEDER document.documentElement NOCH
//     ein globales screen — ein ungeguardeter Zugriff macht alle drei
//     Flusstests rot (Review P2-B4).
//   * Der Hochformat-HINWEIS laeuft rein ueber CSS (statisches div +
//     Media-Query), NIE ueber matchMedia — das fehlt im Stub ebenfalls.
// ===========================================================================
// ===========================================================================
// SLICE 4 §4.1/§4.2/§4.3 — PAUSE.
//
// Die Pause laeuft REIN ueber den Zustandsautomaten (state === 'paused').
// loop.stop()/start() wird bewusst NICHT benutzt: loop.js setzt in stop()
// nur running = false, ein bereits eingereihter rAF-Callback stirbt erst
// beim naechsten Aufruf — ein start() davor erzeugt eine ZWEITE rAF-Kette
// und damit doppelte Update-Rate (Review P1-M6). loop.js bleibt unangetastet.
// ===========================================================================
let pauseCursor = 0;
let pauseHeldY = false;   // Flanke der Menue-Navigation
let pauseHeld = false;    // Flanke des Pause-Pegels (Knopf/Escape/P)

// §6.4 FPS-Fenster. Uhr in §0.2-Guardform: performance.now, sonst Date.now
// (ein JS-Builtin, in jeder Umgebung vorhanden). GEMESSEN WIRD NUR MIT
// EINGESCHALTETEM OVERLAY — ohne den Schalter ist der Renderpfad byte-gleich
// zum Bestand.
const jetztMs = (() => {
  try {
    if (typeof performance !== 'undefined' && performance && typeof performance.now === 'function') {
      return () => performance.now();
    }
  } catch { /* faellt auf Date.now zurueck */ }
  return () => Date.now();
})();
let fpsSichtbar = false;
let fpsLetzte = 0;
let fpsFrames = 0;
let fpsSumme = 0;
let fpsSpitze = 0;
let fpsWert = { fps: 0, ms: 0, max: 0 };
const FPS_FENSTER = 120;

function fpsTick() {
  const t = jetztMs();
  if (fpsLetzte > 0) {
    const dt = t - fpsLetzte;
    // Ausreisser (Tab im Hintergrund, Pause) verfaelschen das Fenster nicht.
    if (dt > 0 && dt < 1000) {
      fpsSumme += dt;
      if (dt > fpsSpitze) fpsSpitze = dt;
      fpsFrames += 1;
      if (fpsFrames >= FPS_FENSTER) {
        const mittel = fpsSumme / fpsFrames;
        fpsWert = { fps: Math.round(1000 / mittel), ms: mittel, max: fpsSpitze };
        fpsFrames = 0;
        fpsSumme = 0;
        fpsSpitze = 0;
      }
    }
  }
  fpsLetzte = t;
}

// §4.3 GOTT-UMSCHALTUNG — SPIELER-NEUBAU.
//
// Ein Laufzeit-Flag boostet NICHT: godBoost schliesst in player.js ueber
// `const god = opts.god === true` (Closure); ein nachtraegliches
// player.god = true schaltet AUSSCHLIESSLICH die Unverwundbarkeit in hurt(),
// Schaden x10 und Tempo x1,4 bleiben aus (Review P1-B6/P2-B3, beide Pruefer
// haben es gemessen). player.js bleibt deshalb UNANGETASTET; main.js baut
// den Spieler an derselben Weltposition NEU und traegt den Zustand in der
// FESTEN carry-Reihenfolge (main.js:314-319) hinueber. Die Welt (Karte,
// Gegner, Props, Drops, Projektile, Lichter) bleibt vollstaendig stehen.
//
// DEKLARIERT (§9): Transientes startet frisch — invulnTimer, attackTimer,
// attackId, Knockback, potionCooldown, facing/state/animTimer. Der Bumerang
// der GOTT-Ausstattung wird beim EINSCHALTEN nachgereicht (Muster
// buildWorld-godMode-Block), beim Ausschalten aber NICHT eingezogen.
function toggleGott() {
  godMode = !godMode;
  const prev = player;
  player = createPlayer(
    { x: prev.x + prev.w / 2, y: prev.y + prev.h / 2 },
    { god: godMode }
  );
  player.inv = prev.inv;
  player.prog = prev.prog;
  player.recalcStats();
  player.hp = Math.min(prev.hp, player.maxHp);
  player.gold = prev.gold;
  player.potions = prev.potions;
  if (godMode && !player.inv.zelda.includes('boomerang')) player.inv.zelda.push('boomerang');
  syncPlayerLight();
  followPlayer();
}

// Eintritt in die Pause. IMMER ueber enterState (ruft consumeConfirm — sonst
// schaltet der Tap, der pausiert hat, im selben Frame WEITER wieder frei,
// Review P1-m2). Speichert nach §3.2 (c)/(d).
function pausiere() {
  if (state !== 'playing') return;
  saveNow();
  pauseCursor = 0;
  audioPauseCursor = 0;  // §3: sonst klingt beim Oeffnen ein falsches menu_move
  pauseHeldY = true; // eine gehaltene Richtung darf den Cursor nicht sofort bewegen
  enterState('paused');
}

// §4.1 LIFECYCLE. visibilitychange/pagehide -> Auto-Save + Pause. Beide
// Listener in §0.2-Guardform; die Stubs haben document.addEventListener als
// No-Op und feuern nichts, der Startpfad bleibt byte-gleich.
function systemPause() {
  if (!player) return;
  saveNow();          // §3.2 (c) — Android kann die App ohne weiteren Callback killen
  pausiere();
}
// SLICE 5 §4.5 (P1-M4/P2-B2, bindend): ctx.suspend() steht DIREKT im Listener
// und VOR jedem `if (!player) return` — systemPause() faellt auf dem Titel,
// im Inventar, im Game-Over und im Sieg an genau diesem Guard heraus
// (main.js: `function systemPause() { if (!player) return; ... }`, player ist
// im Boot-Pfad null). Ohne die Vorschaltung liefe Michaels Titelmusik im
// Hintergrund weiter — genau sein A4-Pruefpunkt "Ton pausiert beim
// App-Wechsel". Gegenstueck: resume() beim Zurueckkommen (§0.3).
try {
  if (typeof document !== 'undefined' && document
    && typeof document.addEventListener === 'function') {
    document.addEventListener('visibilitychange', () => {
      try {
        if (document.hidden) { audioSuspend(); systemPause(); } else audioResume();
      } catch { /* inert */ }
    });
  }
} catch { /* inert */ }
try {
  if (typeof window !== 'undefined' && window
    && typeof window.addEventListener === 'function') {
    window.addEventListener('pagehide', () => {
      try { audioSuspend(); systemPause(); } catch { /* inert */ }
    });
  }
} catch { /* inert */ }

// §4.5 ANDROID-ZURUECK-TASTE. Ohne Listener beendet Capacitor 6 die Activity
// (BridgeActivity erbt das Default-Verhalten, Review P2-M10) — ein Fehlgriff
// schliesst Michaels App mitten im Bosskampf. Mit Listener: Pause + Save.
//
// GUARDED UND DYNAMISCH, damit im Browser und in Node NICHTS passiert:
//   (1) ohne window.Capacitor wird gar nichts versucht (Browser/Tests);
//   (2) bevorzugt wird die Laufzeit-Bruecke window.Capacitor.Plugins.App —
//       sie braucht KEINEN Bundler, und das Projekt hat keinen (CLAUDE.md);
//   (3) nur als Reserve der bare-Specifier-Import '@capacitor/app'; er
//       scheitert im Browser ohne Import-Map, deshalb ausschliesslich als
//       abgefangene Promise.
function haengeZurueckTasteAn() {
  const anschluss = (App) => {
    try {
      if (App && typeof App.addListener === 'function') {
        App.addListener('backButton', () => {
          try { if (state === 'playing') pausiere(); } catch { /* inert */ }
        });
      }
    } catch { /* inert */ }
  };
  try {
    const cap = (typeof window !== 'undefined' && window) ? window.Capacitor : null;
    if (!cap) return; // Browser/Node: vollstaendig inert
    if (cap.Plugins && cap.Plugins.App) { anschluss(cap.Plugins.App); return; }
    import('@capacitor/app').then((m) => anschluss(m && m.App), () => {});
  } catch { /* inert */ }
}
haengeZurueckTasteAn();

function starteQuerformat() {
  if (input.touch.active !== true) return;
  try {
    const de = (typeof document !== 'undefined' && document) ? document.documentElement : null;
    if (de && typeof de.requestFullscreen === 'function') {
      const p = de.requestFullscreen();
      if (p && typeof p.then === 'function') p.then(() => {}, () => {});
    }
  } catch { /* inert */ }
  try {
    if (typeof screen !== 'undefined' && screen && screen.orientation
      && typeof screen.orientation.lock === 'function') {
      const p = screen.orientation.lock('landscape');
      if (p && typeof p.then === 'function') p.then(() => {}, () => {});
    }
  } catch { /* inert */ }
}

// ===========================================================================
// SLICE 5 §3 — DER AUDIO-BEOBACHTER.
//
// GENAU EINE Stelle im playing-Update-Zweig, unmittelbar nach den
// Welt-Updates (updateDrops) und VOR dem Setzen des Hitstop-Timers (Review
// P2-M8/M8-Fix): ausserhalb des else-Zweigs behielte `events` waehrend Fade
// und Hitstop den Inhalt des letzten aktiven Frames und wuerde 2-36 mal
// erneut ausgewertet; und der ausloesende Frame soll SFX und Partikel noch zu
// Ende spielen, bevor der Freeze greift.
//
// ZWEI QUELLEN, wie im Projekt dreifach etabliert (main.js:739 zeldaState,
// main.js props-Scan, main.js Boss-Spiegel):
//   1. der Event-Strom (hasEvent/getEvent) fuer die 13 vorhandenen Typen,
//   2. FELD-FLANKEN auf vorhandenen Objekten fuer die 24 Luecken —
//      entities/ bleibt damit unberuehrt (§0.1).
// Flanken liegen in WeakMaps: buildWorld erzeugt neue Entities, die alten
// Eintraege duerfen nicht lecken (Muster TINT_PREV).
//
// NICHT hier (und warum): Portal-Fade/Portal-blockiert haengen an ihren
// eigenen Einmal-Flanken weiter unten im selben Zweig — sie entstehen ERST
// nach diesem Block, und im Folge-Tick laeuft wegen des Fades gar kein
// Beobachter mehr. Menue-Klaenge (Titel/Pause/Inventar) liegen in ihren
// Zustandszweigen; sie lesen den Event-Strom nicht und koennen deshalb nicht
// mehrfach feuern.
// ===========================================================================
function audioBeobachter(dt) {
  let neuerHitstop = 0;

  // --- (1) VASEN / TRUHEN: EIGENE, ZWEITE props-Schleife --------------------
  // Die Bestandsschleife darueber bleibt ZEICHENIDENTISCH: der Regex-Waechter
  // smoke_test.mjs:4772 hat nur 121 Zeichen Reserve in seinem 400-Zeichen-
  // Fenster (Review P1-M7). Deshalb hier eine eigene Schleife in anderer
  // Schreibweise, NACH dem Bestandsblock.
  for (const p of props) {
    const jetzt = p.kind === 'chest' ? (p.opened === true ? 1 : 0) : (p.state === 'break' ? 1 : 0);
    const vor = AUDIO_PROP.get(p) || 0;
    if (jetzt === 1 && vor === 0) {
      if (p.kind === 'chest') {
        spieleSfx('chest_open');
      } else {
        spieleSfx('vase_break');
        shakeAusloesen(1);
        particles.spawnBurst(p.x + p.w / 2, p.y + p.h / 2, 6, 'staub');
      }
    }
    AUDIO_PROP.set(p, jetzt);
  }

  // --- (2) GEGNER-FLANKEN ---------------------------------------------------
  let aggro = false;
  for (const e of enemies) {
    // Treffer: hurtTimer-Flanke. Der Schwert-Ton haengt zusaetzlich an
    // e.hitAttackId === player.attackId — sonst klaenge er auch beim
    // Bumerang-Treffer (Review P1-m8b).
    const hurt = e.hurtTimer || 0;
    const hurtVor = AUDIO_HURT.get(e) || 0;
    if (hurt > hurtVor + 1e-9) {
      const boss = e.kind === 'graveward';
      const schwert = e.hitAttackId === player.attackId;
      spieleSfx('sword_hit');   // Buendelung: der Bumerang-Treffer teilt ihn
      particles.spawnBurst(e.x + e.w / 2, e.y + e.h / 2, boss ? 8 : 5, 'funke');
      // §5.1 WHITELIST: Schwert-Treffer H, Spieler trifft Boss B.
      if (boss) {
        neuerHitstop = Math.max(neuerHitstop, HITSTOP_B);
        shakeAusloesen(2);
      } else if (schwert) {
        neuerHitstop = Math.max(neuerHitstop, HITSTOP_H);
        shakeAusloesen(1);
      }
    }
    AUDIO_HURT.set(e, hurt);

    // Zustands-Flanken: Boss-Aufschlag und Grufthund-Sprung.
    const st = e.state;
    const stVor = AUDIO_STATE.get(e);
    if (st !== stVor) {
      if (e.kind === 'graveward') {
        if (st === 'dash' || st === 'sweep') {
          spieleSfx('boss_dash');
          shakeAusloesen(3);
          flashFrames = Math.max(flashFrames, 2);
          particles.spawnBurst(e.x + e.w / 2, e.y + e.h - 2, 10, 'staub');
        }
      } else if (e.kind === 'hound' && st === 'leap') {
        spieleSfx('hound_jump');
      }
      // SLICE 6 §4 TRIGGER (a) — KILL-ZAEHLER JE KARTE UND SORTE. Genau diese
      // Flanke ist die in SLICE6_PHASE0 §1 benannte Quelle: der Uebergang nach
      // 'die' faellt je Gegner GENAU EINMAL (WeakMap), traegt e.kind, und
      // main.js kennt currentMapKey. enemies.js bleibt unberuehrt (§0.2), der
      // Gegner lebt danach noch dieTimer lang weiter (enemies.js:441-450).
      if (st === 'die') questKillBeobachter(e.kind);
      AUDIO_STATE.set(e, st);
    }

    // Boss-Telegraph: marker null -> Objekt.
    const hatMark = !!e.marker;
    if (hatMark && !AUDIO_MARK.get(e)) spieleSfx('boss_telegraph');
    AUDIO_MARK.set(e, hatMark);

    // §4.4 zweite Musik-Ebene: der Kampf beginnt, sobald der Boss aus 'idle'
    // heraus ist (boss.js:160 ist der Aggro-Punkt; nach dem Sieg existiert er
    // gar nicht mehr, die ruhige Fassung kommt also von selbst zurueck).
    if (e.kind === 'graveward' && e.state !== 'die' && e.state !== 'idle') aggro = true;
  }
  if (aggro !== bossAggro) {
    bossAggro = aggro;
    musikFuerZustand(MUSIK_CROSSFADE);
  }

  // --- (3) SPIELER-FLANKEN --------------------------------------------------
  if (player.attackId !== audioAttackId) {
    audioAttackId = player.attackId;
    spieleSfx('sword_swing');
  }
  const inv = player.invulnTimer || 0;
  if (inv > audioInvuln + 1e-9) {
    // SPIELER-SCHADEN: Flash + Shake, aber NIEMALS Hitstop (§A3/P1-B2 —
    // check_boss_slice3:255 hat null Frames Spielraum).
    spieleSfx('player_hurt');
    shakeAusloesen(2);
    flashFrames = Math.max(flashFrames, 2);
  }
  audioInvuln = inv;

  // Schritte: an den SPRITE-Frame gekoppelt (player.js:221
  // Math.floor(animTimer*10)%4 = 10 Wechsel/s), nicht an einen freien Timer.
  // Jeder ZWEITE Wechsel klingt, Mindestabstand 0,22 s -> ~2,5 Schritte/s
  // (Review P2-m6: 5/s waere Sprint-Kadenz).
  if (audioSchrittUhr > 0) audioSchrittUhr -= dt;
  if (player.state === 'walk') {
    const f = Math.floor((player.animTimer || 0) * 10) % 4;
    if (f !== audioSchrittFrame) {
      audioSchrittFrame = f;
      audioSchrittZaehler += 1;
      if (audioSchrittZaehler % 2 === 0 && audioSchrittUhr <= 0) {
        audioSchrittUhr = 0.22;
        audioSchrittSeite = (audioSchrittSeite + 1) % 2;
        spieleSfx('step', { variante: audioSchrittSeite });
      }
    }
  } else {
    audioSchrittFrame = -1;
  }

  // --- (4) BUMERANG (die Spiegel existieren im Bestand) ---------------------
  const inLuft = projectiles.list.length > 0;
  if (inLuft && !audioAirVor) spieleSfx('boomerang_throw');
  else if (!inLuft && audioAirVor) spieleSfx('boomerang_catch');
  audioAirVor = inLuft;

  // --- (5) EVENT-STROM ------------------------------------------------------
  // §A1(d) ZUORDNUNGSTABELLE (jede Zeile zeigt auf einen existierenden
  // SFX-Schluessel aus game/js/audio/sfx.js; Buendelung ist zulaessig):
  //   player_died      -> player_hurt        potion_drunk    -> potion_drink
  //   attack_blocked   -> sword_blocked      enemy_died      -> enemy_die
  //   level_up         -> level_up           item_pickup     -> pickup_generic
  //   inventory_full   -> portal_blocked     potion_pickup   -> potion_pickup
  //   potion_full_gold -> gold               gold_pickup     -> gold
  //   weapon_found     -> pickup_generic     key_found       -> pickup_generic
  //   heart_found      -> pickup_generic     boss_died       -> boss_die
  //   chest_opened     -> chest_open (ueber den props-Scan oben, alle Truhen)
  if (hasEvent(events, 'player_died')) spieleSfx('player_hurt');
  if (hasEvent(events, 'potion_drunk')) spieleSfx('potion_drink');
  if (hasEvent(events, 'attack_blocked')) spieleSfx('sword_blocked');
  if (hasEvent(events, 'enemy_died')) {
    spieleSfx('enemy_die');
    neuerHitstop = Math.max(neuerHitstop, HITSTOP_K);   // §5.1 Kill
    shakeAusloesen(2);
  }
  if (hasEvent(events, 'level_up')) spieleSfx('level_up');
  if (hasEvent(events, 'item_pickup')) spieleSfx('pickup_generic');
  if (hasEvent(events, 'inventory_full')) spieleSfx('portal_blocked');
  if (hasEvent(events, 'potion_pickup')) spieleSfx('potion_pickup');
  if (hasEvent(events, 'potion_full_gold')) spieleSfx('gold');
  if (hasEvent(events, 'weapon_found')) spieleSfx('pickup_generic');
  if (hasEvent(events, 'key_found')) spieleSfx('pickup_generic');
  if (hasEvent(events, 'heart_found')) spieleSfx('pickup_generic');
  if (hasEvent(events, 'boss_died')) {
    spieleSfx('boss_die');
    shakeAusloesen(3);
  }
  // GOLD — Spam-Kandidat Nr. 1 (Boss-Tod streut 6-10 Muenzen, Truhen 8-12, der
  // Bumerang-Magnet zieht sie gleichzeitig ein). ENTPRELLT: hoechstens EIN Ton
  // je Frame, dafuer eine steigende Tonhoehen-Treppe bei Ketten.
  if (goldKetteUhr > 0) {
    goldKetteUhr -= dt;
    if (goldKetteUhr <= 0) goldKette = 0;
  }
  if (hasEvent(events, 'gold_pickup')) {
    spieleSfx('gold', { stufe: goldKette });
    goldKette += 1;
    goldKetteUhr = 0.5;
  }

  // --- (6) HITSTOP ZULETZT --------------------------------------------------
  // Die WHITELIST ist vollstaendig: Schwert-Treffer (H), Kill (K), Spieler
  // trifft Boss (B). SPIELER-SCHADEN taucht hier bewusst NIRGENDS auf — er
  // bekommt Flash und Shake, aber niemals einen Freeze-Frame (§A3/P1-B2).
  if (neuerHitstop > hitstop) hitstop = neuerHitstop;
}

// ===========================================================================
// SLICE 6 §2/§3/§4 — DIE VERDRAHTUNG. quest.js/dialog.js/shop_ui.js sind pure
// Rechner; ALLES, was den Spieler, den Zustandsautomaten oder die Karte
// anfasst, steht hier (SPEC §4 "alle Trigger als main.js-Beobachter").
// ===========================================================================

// §4 TRIGGER (a): ein Gegner der Sorte `kind` ist auf currentMapKey gestorben.
function questKillBeobachter(kind) {
  const erg = questKillEvent(runFlags.quests, currentMapKey, kind);
  if (erg.erfuellt.length > 0) pushToast('AUFTRAG ERFUELLT', '#f0bf4e', 3);
}

// §4 TRIGGER (b): runFlags-Beobachter (heute nur Q3 ueber bossDead). Wird an
// ZWEI Stellen gerufen: nach dem Setzen der Flagge und einmal nach dem Laden.
function questFlaggenBeobachter() {
  const erg = questRunFlagEvent(runFlags.quests, runFlags);
  if (erg.erfuellt.length > 0) pushToast('AUFTRAG ERFUELLT', '#f0bf4e', 3);
}

// Auszahlung der Abgabe. quest.js RECHNET nur (questAbgeben zahlt bewusst
// nicht selbst) — der Spieler gehoert main.js. Q1-Klausel: 1 Trank + 15
// Muenzen, bei vollem Guertel stattdessen 25 Muenzen (quest.js questBelohnung).
function questAuszahlen(id) {
  const maxTraenke = Number.isFinite(player.maxPotions) ? player.maxPotions : 3;
  const trankVoll = (player.potions || 0) >= maxTraenke;
  const erg = questAbgeben(runFlags.quests, id, { trankVoll });
  if (!erg.ok) return;
  player.gold += erg.gold;
  if (erg.trank > 0) player.potions = Math.min(maxTraenke, player.potions + erg.trank);
  pushToast('BELOHNUNG', '#f0bf4e', 3);
  spieleSfx('gold');
}

// §4 TRIGGER (c): die Effekt-Datensaetze aus dialog.js in ARRAY-REIHENFOLGE
// ausfuehren (npc_dialoge.js definiert das Vokabular; dialog.js reicht es nur
// durch und interpretiert nie).
function dialogEffekte(effekte) {
  for (const eff of effekte) {
    if (!eff || typeof eff !== 'object') continue;
    if (eff.typ === 'npc_gesprochen') {
      questDialogEvent(runFlags.quests, runFlags.npcFlags, eff.npc);
    } else if (eff.typ === 'quest_anbieten') {
      questAnbieten(runFlags.quests, eff.id);
    } else if (eff.typ === 'quest_annehmen') {
      // DRITTES ARGUMENT PFLICHT (quest.js §4b): wer den Grabwaechter VOR dem
      // Gespraech mit Corm erschlaegt, bekaeme sonst nie wieder ein
      // bossDead-Ereignis — Q3 haenge fuer immer auf 'aktiv'.
      questAnnehmen(runFlags.quests, eff.id, runFlags);
    } else if (eff.typ === 'quest_abgeben') {
      questAuszahlen(eff.id);
    } else if (eff.typ === 'shop') {
      shopOeffnen(eff.haendler);
    }
  }
}

function dialogOeffnen(npc) {
  const baum = dialogFuer(npc.id, runFlags);
  if (!baum) return false;
  dialogNpc = npc;
  npc.redet = true;                 // Sprech-Frame (npcs.js npcSpriteKey)
  dialogZustand = dialogStart(baum);
  // Held-Flags primen (Muster shop_ui.open/inventory_ui): der Pegel, der das
  // Gespraech eroeffnet hat, darf die erste Seite nicht sofort wegblaettern.
  dialogHeldConfirm = true;
  dialogHeldX = true;
  dialogHeldY = true;
  enterState('dialog');
  return true;
}

function dialogSchliessen() {
  if (dialogNpc) dialogNpc.redet = false;
  dialogNpc = null;
  dialogZustand = null;
  enterState('playing');            // consumeConfirm haengt an enterState
}

// GENAU DIESES Objekt geht an open() UND an update() — sonst laufen Auslage
// und Herz-Marke auseinander. `gekauft` ist bewusst die LEBENDE Referenz auf
// runFlags.gekauft: shop_ui legt die Einmal-Marke selbst dort ab.
function shopKontext() {
  return {
    dorfBesuche: runFlags.dorfBesuche,
    gekauft: runFlags.gekauft,
    seltenFrei: seltenFrei(runFlags.quests),
  };
}

function shopOeffnen(haendler) {
  enterState('shop');
  shopUI.open(haendler, shopKontext());
  shopHeldCursor = shopUI.cursor;
}

// DIALOGBOX. Gezeichnet wird NUR auf den HAUPT-ctx, mit fillRect-Rahmen (§0.4:
// kein strokeRect, kein measureText, kein ctx.translate). Die Geometrie kommt
// vollstaendig aus dialog.js (Box y 76..128, Options-Zonen im oberen Drittel,
// Zeilen-Grundlinien, Weiter-Marke als RECHTECK statt Wort).
function dialogRahmen(x, y, w, h, farbe) {
  ctx.fillStyle = farbe;
  ctx.fillRect(x, y, w, 1);
  ctx.fillRect(x, y + h - 1, w, 1);
  ctx.fillRect(x, y, 1, h);
  ctx.fillRect(x + w - 1, y, 1, h);
}

function zeichneDialog() {
  const a = dialogAnsicht(dialogZustand);
  const b = a.box;
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = '#14101a';
  ctx.fillRect(b.x, b.y, b.w, b.h);
  ctx.globalAlpha = 1;
  dialogRahmen(b.x, b.y, b.w, b.h, '#575061');
  dialogRahmen(b.x + 2, b.y + 2, b.w - 4, b.h - 4, '#3a3542');
  ctx.font = '8px monospace';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  if (a.name) {
    ctx.fillStyle = '#f0bf4e';
    ctx.fillText(a.name, b.x + 6, a.nameY);
  }
  ctx.fillStyle = '#d6cbb1';
  for (const z of a.zeilen) ctx.fillText(z.text, b.x + 6, z.y);
  for (const o of a.optionen) {
    const zn = o.zone;
    if (o.gewaehlt) {
      ctx.fillStyle = '#3a3542';
      ctx.fillRect(zn.x, zn.y, zn.w, zn.h);
    }
    dialogRahmen(zn.x, zn.y, zn.w, zn.h, o.gewaehlt ? '#f0bf4e' : '#3a3542');
    ctx.textAlign = 'center';
    ctx.fillStyle = o.gewaehlt ? '#f0bf4e' : '#d6cbb1';
    ctx.fillText(o.text, zn.x + zn.w / 2, zn.y + 4);
    ctx.textAlign = 'left';
  }
  if (a.weiter) {
    ctx.fillStyle = '#f0bf4e';
    ctx.fillRect(a.weiter.x, a.weiter.y, a.weiter.w, a.weiter.h);
  }
}

function update(dt) {
  timeSec += dt;
  stateTime += dt;
  // §5.2/§5.3 WANDUHR: Shake und Flash klingen in JEDEM Zustand und in JEDEM
  // Zweig ab — auch im Freeze (sonst friert der Rest ein und schlaegt nach dem
  // Respawn zurueck, Review P1-M2).
  shakeFortschreiben();
  if (flashFrames > 0) flashFrames -= 1;
  // §4.2: das Lookahead-Fenster wird im 60-Hz-Tick nachgefuellt — GENAU EINE
  // Nachfuellung je Tick, damit ein Main-Thread-Stall keinen Noten-Cluster
  // nachholt (Review P2-B4).
  musikTick();

  // §4.2: der Pause-Knopf ist NUR im Spielzustand scharf — sonst frisst seine
  // Zone Taps im Titel, im Game-Over und im Sieg (Muster hudBoxVisible).
  input.touch.pause.visible = state === 'playing';

  // SLICE 6 §2.2 (PFLICHT, nicht Kosmetik): im Dialog UND im Laden bekommen
  // A/B/W `visible:false` (Muster pause.visible, EINE Stelle). Die W-Zone
  // liegt bei (284,102) r14 -> x 270..298 / y 88..116 und ueberlappt sowohl
  // die Dialogbox (y 76..128) als auch Options-Zone 3 (x 212..300, y 77..93)
  // im Bereich x 270..298 / y 88..93; input.js:234 prueft `w.visible` und
  // laesst den Tap damit zur Option durch. Fuer A und B (beide ab y 132) ist
  // die Ausblendung die HUD-Seite derselben Zusage — ihre Touch-Zonen fragt
  // input.js NICHT ab, deshalb haengt an ihnen zusaetzlich attackSwallow und
  // der neue trankSwallow.
  const weltZonen = state !== 'dialog' && state !== 'shop';
  input.touch.buttons[0].visible = weltZonen;
  input.touch.buttons[1].visible = weltZonen;

  // HUD-Spiegel + Touch-Sichtbarkeiten NUR in playing/inventory
  // aktualisieren (im Titel ist player null). drawHUD behält seine
  // Signatur und kennt weder Projektile noch den Zustandsautomaten.
  // SLICE 6 §2.2: 'dialog' und 'shop' kommen dazu — ohne sie friert der
  // HUD-Spiegel (Bumerang-Zustand, Blink) beim Reden ein.
  if (state === 'playing' || state === 'inventory' || state === 'dialog' || state === 'shop') {
    const inv = player.inv;
    const air = projectiles.list.length > 0;
    if (zeldaWasAir && !air) zeldaBlink = 3 / 60; // Fang: 3-Frame-Weissblink
    else if (zeldaBlink > 0) zeldaBlink -= dt;
    zeldaWasAir = air;
    player.zeldaState = inv.zelda.length === 0 ? 'none' : (air ? 'air' : 'ready');
    player.zeldaBlink = zeldaBlink;
    input.touch.buttons[2].visible = weltZonen && inv.zelda.includes('boomerang');
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
  // SLICE 6 §0.3: dasselbe fuer den TRANK-Pegel nach Dialog/Laden.
  if (trankSwallow) {
    if (input.potion) input.potion = false;
    else trankSwallow = false;
  }

  // §4.2/§4.5 PAUSE-FLANKE (Knopf ❚❚, Escape/P). Sie steht VOR der
  // Zustandskette und verbraucht den ganzen Frame: so laeuft weder im
  // Pausier- noch im Fortsetz-Frame ein Welt-Update. In allen anderen
  // Zustaenden ist sie wirkungslos. In den Flusstests ist input.pause
  // dauerhaft false (kein Escape/P, kein Touch) — die Kette darunter
  // verhaelt sich byte-gleich zum Bestand.
  const pauseEdge = input.pause && !pauseHeld;
  pauseHeld = input.pause;

  if (pauseEdge && (state === 'playing' || state === 'paused')) {
    uiTon('pause_toggle');   // §3: Einmal-Flanke, verbraucht den ganzen Frame
    if (state === 'playing') pausiere();
    else {
      audioResume();         // §0.3: resume() haengt an JEDEM Pause-WEITER
      enterState('playing');
    }
  } else if (state === 'playing' && fadePhase === 'none' && input.attack
    && npcNahe && dialogFuer(npcNahe.id, runFlags)) {
    // SLICE 6 §0.3/§2.3 REDEN. Kein neuer Knopf: der ANGRIFFS-PEGEL oeffnet
    // den Dialog, wenn ein NPC in Reichweite (<= 22 px Mittenabstand) UND in
    // Blickrichtung (Skalarprodukt > 0) steht — beides rechnet npcs.js, die
    // Antwort steht in npcNahe.
    //
    // WARUM HIER, VOR DER ZUSTANDSKETTE (Muster pauseEdge darueber): dieser
    // Zweig VERBRAUCHT den Frame. Liefe die Pruefung im playing-Zweig, haette
    // player.update den Pegel laengst zu einem Schwerthieb gemacht. So kommt
    // er dort gar nicht erst an — und attackSwallow haelt den weiter
    // gehaltenen Pegel, bis er einmal losgelassen wurde (main.js-Praezedenz).
    dialogOeffnen(npcNahe);
    input.attack = false;
    attackSwallow = true;
  } else if (state === 'title') {
    // §3.3: OHNE Spielstand ist dieser Zweig byte-gleich zum Bestand — jeder
    // Confirm startet sofort einen frischen Run. Erst mit gueltigem Stand
    // schaltet das Menue davor (dann hat der Tap Vorrang vor confirm, sonst
    // wuerde jeder Tap irgendwo den Cursor-Eintrag ausloesen).
    if (savedGame) {
      const yLevel = input.dirY < -0.5 || input.dirY > 0.5;
      const res = titleMenuStep(titleCursor, {
        up: input.dirY < -0.5 && !titleHeldY,
        down: input.dirY > 0.5 && !titleHeldY,
        confirm: !!input.confirm,
        tap: input.tap,
      });
      titleHeldY = yLevel;
      titleCursor = res.cursor;
      // §3 Menue-Klaenge am Titel: reine Cursor-/Aktions-Flanken, kein
      // Event-Strom (sie koennen deshalb nicht mehrfach feuern).
      if (titleCursor !== audioTitleCursor) {
        audioTitleCursor = titleCursor;
        uiTon('menu_move');
      }
      if (res.action) uiTon('menu_confirm');
      if (res.action === 'continue') {
        ladeSpielstand(savedGame);
        savedGame = null;
        starteQuerformat();
        enterState('playing');
      } else if (res.action === 'new') {
        // "NEU verliert nichts": kein Hook feuert vor dem ersten
        // Kartenwechsel/Respawn, der alte Stand steht also noch im Storage
        // (Review P2-M3). Geloescht wird er nie aktiv.
        savedGame = null;
        resetRun();
        starteQuerformat();
        enterState('playing');
      }
    } else if (input.confirm) {
      resetRun();
      starteQuerformat(); // §4.4 — No-Op ohne Touch (schuetzt den Desktop-Flow)
      enterState('playing');
    }
  } else if (state === 'playing') {
    if (hitstop > 0 && fadePhase === 'none') {
      // §5.1 DRITTER FREEZE-ZWEIG neben dem Fade (der Praezedenzfall steht
      // direkt darunter): KEINE Welt-Updates. timeSec/stateTime (oben) und
      // input.postUpdate (unten) laufen weiter, ebenso der Shake — er klingt
      // auf der WANDUHR ab und wird auch hier neu angewandt (§5.2).
      // Der EINGABE-PUFFER rettet den Ein-Frame-Impuls ueber den Freeze.
      if (input.attack) attackPuffer = true;
      hitstop -= 1;
      shakeAnwenden();
    } else if (fadePhase !== 'none') {
      // Fade: KEINE Welt-Updates (player/enemies/props/drops); Fade-Timer,
      // timeSec/stateTime und input.postUpdate laufen weiter.
      shakeAnwenden(); // §5.2: Re-Anwendung in JEDEM Zweig
      if (input.attack) attackPuffer = true;
      fadeT += dt;
      if (fadePhase === 'out' && fadeT >= FADE_TIME) {
        // SLICE 6 §3.1 — "DORFBESUCH" IST DEFINIERT: buildWorld(DORF) VIA
        // PORTAL (carry). Der Zaehler ist die SAAT des Haendler-Wuerfels
        // (shop_ui.saatRng) — deshalb steht er genau hier und NICHT in
        // buildWorld: Respawn (gameover) und Laden rufen buildWorld ebenfalls,
        // duerfen die Auslage aber nicht grundlos durchwechseln.
        if (pendingPortal.target === 'DORF') runFlags.dorfBesuche += 1;
        buildWorld(pendingPortal.target, pendingPortal.spawn, true);
        pendingPortal = null;
        fadePhase = 'in';
        fadeT = 0;
      } else if (fadePhase === 'in' && fadeT >= FADE_TIME) {
        fadePhase = 'none';
        fadeT = 0;
        // §3.2 HOOK (a): Portal-Wechsel vollzogen. Hier — und NICHT am Ende
        // von buildWorld — ist der Zustand vollstaendig (Welt gebaut, Fade
        // durch, hp/gold/potions uebernommen).
        saveNow();
      }
    } else {
      // §5.1: der im Freeze gemerkte Angriffs-Pegel wird im ersten freien
      // Frame wieder gesetzt — sonst frisst jeder Hitstop den Folgehieb.
      //
      // ACHTUNG, GEMESSEN: input.attack ist ein PEGEL, den input.js NUR bei
      // Tastatur-/Touch-Ereignissen neu rechnet (recompute) — postUpdate()
      // loescht ihn NICHT. Ein einfaches `input.attack = true` bliebe deshalb
      // stehen, bis die naechste Taste kommt, und der Spieler haute
      // ununterbrochen weiter (Gate "Gegenprobe ohne Freeze" gemessen ROT).
      // Der Puffer gilt darum fuer GENAU EINEN player.update-Aufruf und wird
      // danach zurueckgenommen; das Bestandsmuster attackSwallow oben setzt
      // aus demselben Grund nur auf false (das heilt sich von selbst).
      let pufferAktiv = false;
      if (attackPuffer) {
        attackPuffer = false;
        if (!input.attack) {
          input.attack = true;
          pufferAktiv = true;
        }
      }
      events.length = 0;
      player.update(dt, input, map, enemies, events);
      if (pufferAktiv) input.attack = false;
      // Bumerang NACH dem Spieler, VOR den Gegnern: Stun wirkt im selben Tick
      projectiles.update(dt, input, player, enemies, props, map, drops, events);
      updateEnemies(dt, enemies, player, map, drops, events);
      updateProps(dt, props, player, map, drops, events);
      // §3.4: geoeffnete Truhen registrieren (Quelle = props-Liste, s.
      // chestKey-Kommentar). Die Siegtruhe bleibt ausgenommen.
      for (let i = 0; i < props.length; i++) {
        const p = props[i];
        if (p.kind !== 'chest' || p.opened !== true || p.siegChest === true) continue;
        const k = chestKey(currentMapKey, p);
        if (!runFlags.openedChests.includes(k)) runFlags.openedChests.push(k);
      }
      updateDrops(dt, drops, player, events);
      audioBeobachter(dt);
      // SLICE 6 §2.1/§2.3: die Wanderer gehen an ihrer Leine (<= 24 px um den
      // Anker, npcs.js), und die Rueckgabe meldet den ansprechbaren NPC. Der
      // Aufruf steht NACH dem Beobachter — die Reihenfolge
      // updateDrops -> audioBeobachter ist von smoke:5323 festgenagelt.
      // npcNahe traegt BEIDES: den Dialog-Oeffner (§0.3, oben vor der
      // Zustandskette) und den Naehe-Hinweis (§2.3). Die Blasen-FLAGGE wird
      // in drawWorld gesetzt — sie ist zustandsabhaengig und rein visuell.
      npcNahe = updateNpcs(dt, npcs, player, map, false).nahe;
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
        props.push(...markSiegtruhe(createProps([{ ...anchor, kind: 'chest', content: 'treasure' }])));
        runFlags.bossDead = true;
        // SLICE 6 §4 TRIGGER (b): unmittelbar nach dem Setzen der Flagge. Q3
        // springt damit von 'aktiv' auf 'erfuellt' (quest.js questRunFlagEvent).
        questFlaggenBeobachter();
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
                  // §3: Einmal-Flanke, schon vom Bestand auf 1x/s gedrosselt.
                  spieleSfx('portal_blocked');
                }
              } else {
                pendingPortal = portal;
                fadePhase = 'out';
                fadeT = 0;
                // §3: der Portal-Klang haengt an genau diesem Uebergang. Er
                // steht NICHT im Beobachter: die Flanke entsteht erst hier,
                // und ab dem naechsten Tick friert der Fade den Zweig ein.
                spieleSfx('portal');
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
            uiTon('pause_toggle');
            enterState('inventory');
            inventoryUI.open();
            audioInvCursor = inventoryUI.cursor;
            player.inv.newFlag = false;
          }
        }
      }
    }
  } else if (state === 'inventory') {
    // HARTE PAUSE: keine Welt-Updates, victoryTimer pausiert mit; timeSec
    // läuft oben weiter (Fackel-Flackern). Zurück per 'close' aus dem UI.
    const eq = player.inv.equipped;
    const invVorher = `${eq.weapon ? eq.weapon.name : ''}|${eq.armor ? eq.armor.name : ''}|${eq.ring ? eq.ring.name : ''}`;
    const invErg = inventoryUI.update(input, player);
    // §3 Menue-Klaenge im Inventar: Cursor-Flanke ueber den oeffentlichen
    // inventoryUI.cursor (inventory_ui.js:62), Anlegen ueber den
    // Ausruestungs-Wechsel. Beides sind Einmal-Flanken, kein Event-Strom.
    if (inventoryUI.cursor !== audioInvCursor) {
      audioInvCursor = inventoryUI.cursor;
      uiTon('menu_move');
    }
    const eqN = player.inv.equipped;
    if (`${eqN.weapon ? eqN.weapon.name : ''}|${eqN.armor ? eqN.armor.name : ''}|${eqN.ring ? eqN.ring.name : ''}` !== invVorher) {
      uiTon('menu_confirm');
    }
    if (invErg === 'close') {
      uiTon('pause_toggle');
      attackSwallow = true; // Schliess-Tap nicht als Hieb werten
      enterState('playing'); // consumeConfirm an beiden Übergängen (enterState)
    }
  } else if (state === 'dialog') {
    // SLICE 6 §2.2 — HARTE PAUSE wie 'inventory': keine Welt-Updates, keine
    // Timer, victoryTimer pausiert mit; timeSec laeuft oben weiter (Fackel-
    // Flackern im stehenden Bild). MUSIK LAEUFT, und audioGeduckt bleibt
    // FALSE — der Dialog ist Teil der Welt, kein Menue (§2.2 deklariert,
    // enterState bleibt dafuer byte-gleich).
    //
    // NPCs werden EINGEFROREN weitergereicht (npcs.js-Argument): nur
    // Animation, kein Gehen — der Gespraechspartner bleibt stehen.
    updateNpcs(dt, npcs, player, map, true);
    // Flanken fuer den PUREN Reducer. confirm ist bei input.js ohnehin eine
    // Ein-Frame-Flanke (postUpdate loescht sie); der ANGRIFFS-Pegel zaehlt
    // zusaetzlich als Bestaetigung (derselbe Knopf, der das Gespraech
    // eroeffnet hat — Muster shop_ui.js:311), deshalb ein eigener Held-Merker.
    const confirmLevel = !!input.confirm || !!input.attack;
    const confirmEdge = confirmLevel && !dialogHeldConfirm;
    dialogHeldConfirm = confirmLevel;
    const xLevel = input.dirX < -0.5 || input.dirX > 0.5;
    const yLevel = input.dirY < -0.5 || input.dirY > 0.5;
    const links = input.dirX < -0.5 && !dialogHeldX;
    const rechts = input.dirX > 0.5 && !dialogHeldX;
    const hoch = input.dirY < -0.5 && !dialogHeldY;
    const runter = input.dirY > 0.5 && !dialogHeldY;
    dialogHeldX = xLevel;
    dialogHeldY = yLevel;
    const cursorVor = dialogZustand ? dialogZustand.cursor : 0;
    const schritt = dialogSchritt(dialogZustand, {
      confirm: confirmEdge, tap: input.tap, links, rechts, hoch, runter,
    });
    dialogZustand = schritt.zustand;
    if (schritt.schluckAngriff) attackSwallow = true;
    if (schritt.schluckTrank) trankSwallow = true;
    if (dialogZustand && dialogZustand.cursor !== cursorVor) uiTon('menu_move');
    if (schritt.aktion === 'wahl' || schritt.aktion === 'ende') uiTon('menu_confirm');
    // §4 TRIGGER (c): die Effekte in ARRAY-REIHENFOLGE abarbeiten. Beim
    // Q4-Dritten steht 'npc_gesprochen' VOR 'quest_abgeben' — erst setzt
    // questDialogEvent die Kette auf 'erfuellt', dann zahlt questAbgeben.
    if (schritt.effekte && schritt.effekte.length > 0) dialogEffekte(schritt.effekte);
    // Der Dialog kann sich selbst schliessen (fertig) ODER in den Laden
    // wechseln (dann hat dialogEffekte den State schon auf 'shop' gestellt).
    if (state === 'dialog' && (!dialogZustand || dialogZustand.fertig)) dialogSchliessen();
  } else if (state === 'shop') {
    // SLICE 6 §3.2 — HARTE PAUSE wie 'dialog'. Der Laden ist der zweite Teil
    // desselben Gespraechs, deshalb duckt er ebenfalls NICHT.
    updateNpcs(dt, npcs, player, map, true);
    const kontext = shopKontext();
    const goldVor = player.gold;
    const erg = shopUI.update(input, player, kontext);
    if (shopUI.cursor !== shopHeldCursor) {
      shopHeldCursor = shopUI.cursor;
      uiTon('menu_move');
    }
    // Jede vollzogene Transaktion bewegt den Beutel (Kauf ODER Ankauf); eine
    // VERWEIGERUNG laesst ihn per shop_ui-Zusage unangetastet und bleibt
    // deshalb still — ihr Hinweis steht in der Panelzeile.
    if (player.gold !== goldVor) spieleSfx('gold');
    if (erg === 'close') {
      uiTon('pause_toggle');
      attackSwallow = true; // Schliess-Tap nicht als Hieb werten
      trankSwallow = true;  // und nicht als Trank (B-Zone liegt im Panel)
      dialogSchliessen();
    }
  } else if (state === 'paused') {
    // §4.1 HARTE PAUSE wie 'inventory': keine Welt-Updates, keine Timer.
    // timeSec laeuft oben weiter (Fackel-Flackern im eingefrorenen Bild).
    input.hudBoxVisible = false;
    const yLevel = input.dirY < -0.5 || input.dirY > 0.5;
    const up = input.dirY < -0.5 && !pauseHeldY;
    const down = input.dirY > 0.5 && !pauseHeldY;
    pauseHeldY = yLevel;
    let wahl = -1;
    if (input.tap) {
      // TAP HAT VORRANG vor confirm: jeder touchstart setzt input.confirm
      // (input.js), ein Tap neben dem Menue darf deshalb nichts ausloesen.
      for (let i = 0; i < PAUSE_MENU_ZONES.length; i++) {
        const z = PAUSE_MENU_ZONES[i];
        if (input.tap.x >= z.x && input.tap.x <= z.x + z.w
          && input.tap.y >= z.y && input.tap.y <= z.y + z.h) {
          pauseCursor = i;
          wahl = i;
          break;
        }
      }
    } else {
      if (up && pauseCursor > 0) pauseCursor -= 1;
      if (down && pauseCursor < PAUSE_MENU_ZONES.length - 1) pauseCursor += 1;
      if (input.confirm) wahl = pauseCursor;
    }
    // §3/§4.3: Menue-Klaenge laufen ueber den uiBus und bleiben in der Pause
    // HOERBAR — sonst waeren die neuen Schalter per Ohr nicht abnehmbar
    // (Review P2-B3).
    if (pauseCursor !== audioPauseCursor) {
      audioPauseCursor = pauseCursor;
      uiTon('menu_move');
    }
    if (wahl >= 0) uiTon('menu_confirm');
    if (wahl === 0) {
      audioResume();          // §0.3: resume() haengt an JEDEM Pause-WEITER
      enterState('playing');
    } else if (wahl === 1) {
      toggleGott();
      input.consumeConfirm(); // Auswahl verbraucht, kein Durchbluten
    } else if (wahl === 2) {
      fpsSichtbar = !fpsSichtbar;
      fpsLetzte = 0;          // Fenster frisch starten (die Pause ist kein Frame)
      fpsFrames = 0;
      fpsSumme = 0;
      fpsSpitze = 0;
      input.consumeConfirm();
    } else if (wahl === 3) {
      // §6.1/§6.2 MUSIK. Der Reducer rechnet, main.js reicht nur den String
      // durch (mixer.js ist Node-pruefbar, main.js nicht).
      audioSettings = mixerToggle(audioSettings, 'music');
      audioEinstellungenSchreiben();
      audioPegelSetzen(BUS.duckRampe);
      if (audioSettings.music) musikFuerZustand(MUSIK_BLENDE);
      input.consumeConfirm();
    } else if (wahl === 4) {
      // §6.1/§6.2 TON. Der Bestaetigungston oben lief NOCH auf dem alten
      // Pegel (Review P2-B3: sonst waere das Ausschalten selbst
      // rueckmeldungsfrei); stumm geschaltet wird erst jetzt. Beim
      // EINschalten kommt die Rueckmeldung entsprechend danach.
      audioSettings = mixerToggle(audioSettings, 'sfx');
      audioEinstellungenSchreiben();
      audioPegelSetzen(BUS.duckRampe);
      if (audioSettings.sfx) uiTon('menu_confirm');
      input.consumeConfirm();
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
      // §3.2 HOOK (b): Respawn abgeschlossen — erst JETZT stehen hp = maxHp
      // und deathToll = null. Ein Hook in buildWorld haette hp = 0
      // gespeichert (der carry-Block kopiert prev.hp), der geladene Stand
      // waere im ersten Frame erneut gestorben (Review P1-B4, gemessen).
      saveNow();
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
//   dy -1  0,90 x Breite, Alpha 0,34  <- der sichtbare Bodenkontakt (M5)
//   dy  0  0,95 x Breite, Alpha 0,40  <- Kern wie GP4
//   dy  1  0,70 x Breite, Alpha 0,20
//   dy  2  0,40 x Breite, Alpha 0,10
// Beispiel Spieler (w = 12): 11 / 11 / 8 / 5 Texel — die -1-Zeile allein
// liefert 11 sichtbare Texel unter der Fusskante.
// BLINK-VERHALTEN (Deklaration §9): der Schatten haengt an der Hitbox, nicht am
// Sprite — eine unverwundbar blinkende Figur behaelt ihren Schatten.
// GP6 RUNDE 1 (M5-FIX): die -1-Zeile stand auf Alpha 0,30 und war INNEN zu
// schwach. Gemessen (Proof-Lauf 1, CATACOMBS im Fackelkegel): dL = 5,94 L bei
// 0,30 — die Schwelle ist 6,0. Der Schatten ist reines '#000' mit Alpha a, die
// Zeile dunkelt den Boden also um a x L_Boden ab; der Innen-Messort trug
// 5,94/0,30 = 19,8 L. Sie uebernimmt deshalb das Alpha der BIG-Profil-
// Grundzeile (0,34): 0,34 x 19,8 = 6,73 L. §4.3 nennt BAUWERTE, keine
// Messwerte — die uebrigen drei Zeilen und BIG bleiben unangetastet.
// NEBENWIRKUNG (deklariert): aussen wird der Bodenkontakt minimal satter, der
// schwaechste gemessene Aussenwert steigt von 11,3 auf 12,8 L.
const SHADOW_W = [0.90, 0.95, 0.7, 0.4];
const SHADOW_A = [0.34, 0.40, 0.20, 0.10];
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
  // SLICE 6 §2.1: NPCs laufen durch DIESELBE Fassade wie Gegner und Spieler —
  // Y-Sortierung, Kontaktschatten und Warm/Kalt-Toenung kommen dadurch gratis.
  // Auf den vier Bestandskarten ist die Liste leer, die Schleife also ein No-Op.
  //
  // SLICE 6 §2.3 (Rev 1: "updateNpcs liefert {nahe}; main.js zeigt Hinweis-
  // Blase") — DIE BLASEN-FLAGGE STEHT HIER, nicht mehr im Update. Sie ist eine
  // reine ZEICHEN-Eigenschaft (npcs.js drawNpc ist ihr einziger Leser) und
  // muss den ZUSTAND kennen. ZWEI Quellen, EINE Grafik, EIN Zeichenpfad
  // (gfx.npc_blase in drawNpc — kein zweites Canvas, kein Text, kein
  // measureText/strokeRect/translate):
  //   (1) DAUERND: Quest-Geber mit offener oder abgebbarer Quest (questGeber).
  //   (2) NAEHE-HINWEIS: der von updateNpcs gemeldete ansprechbare NPC
  //       (npcNahe, <= 22 px Mittenabstand UND in Blickrichtung) — die
  //       sichtbare Affordanz zum Reden, die vorher fehlte. Sie trifft auch
  //       NPCs OHNE Quest (Mile, Torwaechter) und liegt bei einem Quest-Geber
  //       deckungsgleich auf der Dauer-Blase (die ODER-Verknuepfung zeichnet
  //       sie nie doppelt).
  // NUR IM STATE 'playing': npcNahe wird ausschliesslich im playing-Zweig
  // gesetzt und bleibt beim Verlassen stehen; ohne die Zustandsfrage stuende
  // die Einladung "hier kannst du reden" waehrend des Gespraechs, im Laden,
  // im Inventar, in der Pause und im Game-Over ueber demselben NPC. Die
  // Dauer-Blase der Quest-Geber ist davon UNBERUEHRT — sie haengt allein an
  // runFlags und bleibt in jedem Zustand stehen.
  for (const n of npcs) {
    n.blase = questGeber(n.id, runFlags) || (state === 'playing' && n === npcNahe);
    pushTinted(n, () => drawNpc(tintCtx, camera, n, gfx, timeSec));
  }
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

  // GRAFIKPASS 6 RUNDE 2 (P0-A, Juror K): die STANDKACHEL des Spielers wird
  // NUR beim 'over'-Aufruf durchgereicht. tilemap.js zeichnet jede Over-Krone,
  // deren Span-Fussabdruck diese Kachel enthaelt, mit globalAlpha 0,55 — der
  // Spieler bleibt unter dem Laub lesbar (CLAUDE.md "Layering (Kronen ueber dem
  // Spieler)"), statt vollstaendig zu verschwinden (gemessen: 0 von 264
  // Silhouetten-Texeln sichtbar). Der Abtastpunkt ist derselbe wie beim
  // Kontaktschatten und bei lightAt (§4.1): Sprite-Mitte / Fusskante minus 1.
  // Der 'ground'-Aufruf oben bleibt BYTE-GLEICH (kein 6. Argument).
  const pTileX = Math.floor((player.x + player.w / 2) / 16);
  const pTileY = Math.floor((player.y + player.h - 1) / 16);
  map.draw(ctx, camera, tiles, timeSec, 'over', { playerTile: { tx: pTileX, ty: pTileY } });
  if (mapDef.fog) drawFog(ctx, camera, gfx, timeSec);
  // frameLights ist oben (vor dem renderables-Bau) fertig aufgebaut worden
  // (GP6 §4.1) und seither unveraendert.
  // §2.3: mapDef.ambientTint als 6. Argument durchreichen (Farbtemperatur je Map).
  lighting.draw(ctx, camera, frameLights, mapDef.ambient, timeSec, mapDef.ambientTint);
  // SLICE 5 §5.3 — TREFFER-FLASH. NACH lighting.draw auf den HAUPT-ctx, die
  // Deckung steckt in der rgba-FUELLFARBE bei globalAlpha 1 (Muster
  // hud.js:785/833). Beide Detektoren bleiben damit stumm: fadeAlpha verlangt
  // fillStyle === '#000' UND 0 < alpha < 1, ambientAlpha sieht nur
  // Nicht-Haupt-Canvases. Vom Pruefer in genau dieser Form DAUERHAFT-AN
  // gemessen: check_main 25 / check_boss 33 / check_inventory 25 gruen
  // (Review P1-m4). __noFlash schaltet ihn fuer das Messrig ab.
  if (flashFrames > 0 && !rigAus('__noFlash')) {
    ctx.fillStyle = 'rgba(255,244,220,0.18)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
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
    // §3.3: ohne Spielstand exakt der Bestands-Aufruf (drittes Argument
    // undefined) — die Flusstests sehen keinen Unterschied.
    drawTitle(ctx, timeSec, savedGame
      ? { cursor: titleCursor, items: TITLE_MENU_ITEMS, zones: TITLE_MENU_ZONES }
      : null);
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
  // SLICE 6 §2.2: die Dialogbox liegt UEBER dem HUD (drawWorld hat es schon
  // gezeichnet) und wird NICHT abgedunkelt — der Dialog ist Teil der Welt.
  if (state === 'dialog') zeichneDialog();
  // §3.2: der Laden ist ein Panel wie das Inventar und dunkelt genauso ab.
  if (state === 'shop') {
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.globalAlpha = 1;
    drawShopUI(ctx, shopUI, player, gfx);
  }
  if (state === 'gameover') drawGameOver(ctx, player, timeSec);
  else if (state === 'victory') drawVictory(ctx, player, timeSec);
  // §4.1 Pause-Overlay ueber der eingefrorenen Welt (HUD-Sprache).
  if (state === 'paused') {
    drawPause(ctx, {
      cursor: pauseCursor, god: godMode, fps: fpsSichtbar,
      musik: audioSettings.music, ton: audioSettings.sfx,
    });
  }
  if (state === 'playing' && fadePhase !== 'none') {
    const a = fadePhase === 'out'
      ? Math.min(fadeT / FADE_TIME, 1)
      : 1 - Math.min(fadeT / FADE_TIME, 1);
    ctx.globalAlpha = a;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.globalAlpha = 1;
  }
  // §6.4 FPS-Overlay ganz zuletzt — ueber Pause UND ueber dem Portal-Fade
  // (eine Messanzeige darf nicht mit weggeblendet werden). Ohne den
  // Schalter passiert hier NICHTS: kein Uhrzugriff, kein Zeichenzug.
  if (fpsSichtbar) {
    fpsTick();
    drawFps(ctx, fpsWert);
  }
}

createLoop({ update, render }).start();
