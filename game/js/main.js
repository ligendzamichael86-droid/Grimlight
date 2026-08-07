// Boot + State-Maschine. Einziges Modul, das Browser-Globals beim Import anfasst.

import { PALETTE } from './art/palette.js';
import { SPRITES, TILE_ART } from './art/sprites.js';
import { buildSprite, buildAll } from './core/sprite_factory.js';
import { createLoop } from './core/loop.js';
import { createInput } from './core/input.js';
import { createCamera } from './core/camera.js';
import { createLighting } from './core/lighting.js';
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
  player = createPlayer(spawn);
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
  lights = mapDef.torchChars
    .flatMap((ch) => map.findTiles(ch))
    .map((t) => ({ x: t.x, y: t.y, radius: TORCH_RADIUS, flicker: 1 }));
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
const SHADOW_W = [0.95, 0.7, 0.4];
const SHADOW_A = [0.40, 0.20, 0.10];
const SHADOW_DY = [0, 1, 2];          // Zeilen OBERHALB der Fusskante
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

  // §2.4: Weichschatten VOR der renderables-Schleife (unter allen Entities, über
  // dem Boden) für Spieler, jeden Gegner UND jeden echten Prop.
  drawSoftShadow(player);
  for (const e of enemies) drawSoftShadow(e);
  for (const p of props) drawSoftShadow(p);

  // Gemeinsame Y-Sortierung aller Welt-Entities nach Fußkante (y + h).
  // Array.sort ist stabil → bei Gleichstand bleibt Einfügereihenfolge
  // (Spieler zuletzt = bei Gleichstand oben).
  const renderables = [];
  drops.forEach((d, i) => renderables.push({ fy: d.y + d.h, draw: () => drawDrop(ctx, camera, d, i, gfx, timeSec) }));
  for (const p of props) renderables.push({ fy: p.y + p.h, draw: () => drawProp(ctx, camera, p, gfx, timeSec) });
  for (const e of enemies) renderables.push({ fy: e.y + e.h, draw: () => drawEnemy(ctx, camera, e, gfx, timeSec) });
  for (const p of projectiles.list) renderables.push({ fy: p.y + p.h, draw: () => drawProjectile(ctx, camera, p, gfx, timeSec) });
  renderables.push({ fy: player.y + player.h, draw: () => player.draw(ctx, camera, gfx, timeSec) });
  renderables.sort((a, b) => a.fy - b.fy);
  for (const r of renderables) r.draw();

  // §3: Level-Up-Ring (levelup_0/1, 0,5 s) UEBER der Spieler-Fußkante.
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
  // Lights pro Frame: Fackeln + Spieler-Laterne (lights) plus je ein Licht
  // pro liegendem SELTENEN Item-Drop (der Diablo-Moment: guter Loot
  // leuchtet im Dunkeln).
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
  // setzt das Feld; BOSS_KAMMER bekommt ein Zentrums-Licht mit flicker 0.5).
  // Sie liegen bewusst UNTER der 0.8-Schwelle: kein Warm-Glow, kein Lit-Dither,
  // keine Funken, keine Wasser-Reflexion — nur Grundaufhellung der Arena.
  // Fehlt das Feld, passiert nichts (additiv).
  if (mapDef.extraLights) {
    for (const l of mapDef.extraLights) frameLights.push(l);
  }
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
