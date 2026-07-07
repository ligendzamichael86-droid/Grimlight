// Boot + State-Maschine. Einziges Modul, das Browser-Globals beim Import anfasst.

import { PALETTE } from './art/palette.js';
import { SPRITES, TILE_ART } from './art/sprites.js';
import { buildSprite, buildAll } from './core/sprite_factory.js';
import { createLoop } from './core/loop.js';
import { createInput } from './core/input.js';
import { createCamera } from './core/camera.js';
import { createLighting } from './core/lighting.js';
import { createTilemap } from './world/tilemap.js';
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
      const boss = enemies.find((e) => e.kind === 'graveward' && e.state !== 'die');
      player.bossBar = boss ? { hp: boss.hp, maxHp: boss.maxHp } : null;

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

function drawWorld() {
  map.draw(ctx, camera, tiles, timeSec, 'ground');
  drawMarkers();

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
  lighting.draw(ctx, camera, frameLights, mapDef.ambient, timeSec);
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
