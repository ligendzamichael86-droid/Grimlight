// Gegner (Skelett/Ghul: wander/chase; Grufthund: Orbit/Sprungbiss;
// Rostpanzer: Frontblock) + Drops (Münzen/Tränke/Ausrüstung). Node-importierbar.
//
// Slice 1: Gegner tragen ihre Werte als FELDER (wanderSpeed, chaseSpeed,
// sight, contactDamage, knockFactor) — updateEnemies liest nur noch e.*.
// So weicht der Ghul ab, ohne dass sich Skelett-Werte ändern können
// (Spec-Review-Klärung; Skelett-Regression im Smoke-Test abgesichert).
//
// Slice 2: Der wander/chase-Block ist WÖRTLICH nach updateWanderChase
// gewandert; neue Kinds laufen über BEHAVIORS (Dispatch), Skelett/Ghul
// verhalten sich exakt wie vorher. Schwertschaden/Knockback kommen aus
// player.stats (mit ??-Fallbacks, Alt-Tests laufen ohne Inventar weiter).

import { aabbOverlap, moveWithCollision } from './entity.js';
import { rollItem, addItem } from '../items/items.js';
import { grantXp } from '../items/progression.js';

const CONTACT_COOLDOWN = 0.5;
const HURT_FLASH = 0.2;
const DIE_TIME = 0.4;
const KNOCK_SPEED = 140;
const KNOCK_DURATION = 0.15;
const SCATTER_TIME = 0.25;
const PICKUP_RADIUS = 12;   // Fallback, falls player.stats fehlt
const MAX_POTIONS = 3;      // Fallback, falls player.maxPotions fehlt
const BLOCK_FLASH = 0.15;   // Funken-Anzeige am Rostpanzer-Schild
const MAGNET_SPEED = 180;   // Bumerang-Magnet fuer coin/potion-Drops
const PITY_LIMIT = 12;      // Kills ohne Gear → garantierter Normal-Drop

// spawn = Weltpixel, ZENTRUM der AABB (Konvention aus maps.js)
function baseEnemy(spawn, w, h) {
  return {
    x: spawn.x - w / 2,
    y: spawn.y - h / 2,
    w,
    h,
    state: 'wander',
    dirX: 0,
    dirY: 0,
    facingLeft: false,
    wanderTimer: 0,
    attackCooldown: 0,
    hurtTimer: 0,
    hitAttackId: -1, // Einmal-Treffer pro Schwertschwung
    knockTimer: 0,
    knockX: 0,
    knockY: 0,
    knockMult: 1,    // Rueckstoss-Faktor des treffenden Schlags (stats)
    stunTimer: 0,    // Bumerang-Stun (Slice 2)
    dieTimer: 0,
    animTimer: Math.random(),
  };
}

// Eliten (§2.4): NUR Zahlenfaktoren, keine neuen Verhalten. hp x2
// (aufgerundet), wander/chase/orbit-Tempi x1,25, xp x2, e.elite = true.
// Kontaktschaden, Drop-Tabelle, Verhalten, AABB bleiben unveraendert.
function elitize(e, spawn) {
  if (!spawn || !spawn.elite) return e;
  e.hp = Math.ceil(e.hp * 2);
  if (e.wanderSpeed) e.wanderSpeed *= 1.25;
  if (e.chaseSpeed) e.chaseSpeed *= 1.25;
  if (e.approachSpeed) e.approachSpeed *= 1.25;
  if (e.orbitSpeed) e.orbitSpeed *= 1.25;
  e.xp *= 2;
  e.elite = true;
  return e;
}

export function createSkeleton(spawn) {
  return elitize({
    ...baseEnemy(spawn, 12, 14),
    kind: 'skeleton',
    hp: 2,
    xp: 2,
    wanderSpeed: 25,
    chaseSpeed: 55,
    sight: 96,
    contactDamage: 1,
    knockFactor: 1,
    dropTable: { itemChance: 0.04, rareChance: 0.1 },
  }, spawn);
}

// Ghul: langsamer, zäher Brocken für die Katakomben (SPEC_SLICE_1 §2).
export function createGhoul(spawn) {
  return elitize({
    ...baseEnemy(spawn, 14, 14),
    kind: 'ghoul',
    hp: 4,
    xp: 4,
    wanderSpeed: 18,
    chaseSpeed: 30,
    sight: 80,
    contactDamage: 2,
    knockFactor: 0.5, // Knockback wirkt nur 50 %
    dropTable: { itemChance: 0.08, rareChance: 0.2 },
  }, spawn);
}

// Grufthund (SPEC_SLICE_2 §2.3): umkreist den Spieler, springt nach
// telegraphiertem Ansatz, liegt danach verwundbar am Boden.
// Zustände: wander | circle | telegraph | leap | down | die.
export function createHound(spawn) {
  return elitize({
    ...baseEnemy(spawn, 14, 12),
    kind: 'hound',
    hp: 4,
    xp: 5,
    wanderSpeed: 30,
    approachSpeed: 75,  // Annäherung bis zum Orbit
    orbitSpeed: 70,     // Tangentialtempo
    orbitRadius: 56,    // Zielradius
    sight: 110,
    contactDamage: 1,   // Behavior mutiert: 1 laufend, 2 leap, 0 down
    knockFactor: 1,
    orbitDir: Math.random() < 0.5 ? 1 : -1,
    orbitSwitchTimer: 1.5 + Math.random(), // Richtungswechsel alle 1,5-2,5 s
    orbitTimer: 2 + Math.random(),         // nach 2-3 s Orbit → telegraph
    telegraphTimer: 0,
    leapTimer: 0,
    leapDirX: 0,
    leapDirY: 0,
    leapLocked: false, // Richtung 0,2 s nach Telegraph-Beginn eingeloggt
    downTimer: 0,
    leapBlock: 0,      // Sprungsperre nach dem Aufstehen
    dropTable: { itemChance: 0.1, rareChance: 0.2 },
  }, spawn);
}

// Rostpanzer-Skelett (SPEC_SLICE_2 §2.3): langsam, blockt frontal
// (Kegel ±60° um die gerastete Blickrichtung), seitlich/hinten verwundbar.
export function createRust(spawn) {
  return elitize({
    ...baseEnemy(spawn, 14, 16),
    kind: 'rust',
    hp: 5,
    xp: 6,
    wanderSpeed: 12,
    chaseSpeed: 20,
    sight: 70,
    contactDamage: 2,
    knockFactor: 0.3,
    faceX: 0,       // Blickrichtung, auf 4 Himmelsrichtungen gerastet
    faceY: 1,
    faceTimer: 0,   // Wechsel höchstens alle 0,4 s (träge Drehung)
    blockFlash: 0,
    coinMin: 2,
    coinMax: 4,
    dropTable: {
      itemChance: 0.35,
      rareChance: 0.25,
      slotWeights: { armor: 0.5, weapon: 0.25, ring: 0.25 },
    },
  }, spawn);
}

// Registry: Creator/Behavior/Drawer je kind. Bestandskinds direkt, neue
// Kinds (Boss) via registerEnemyKind (import-reihenfolgeabhaengig, boss.js
// wird von main.js und smoke_test.mjs einmal explizit oben importiert).
const CREATORS = {
  skeleton: createSkeleton,
  ghoul: createGhoul,
  hound: createHound,
  rust: createRust,
};

// Registriert einen neuen Gegner-kind (SPEC_SLICE_3 §3). drawer optional:
// existiert DRAWERS[kind], uebernimmt dieser Zeichner KOMPLETT (sonst baut
// der generische Pfad Sprite-Keys aus e.kind und faende keine graveward_*-
// Sprites -> drawImage(undefined)).
export function registerEnemyKind(kind, creator, behavior, drawer = null) {
  CREATORS[kind] = creator;
  if (behavior) BEHAVIORS[kind] = behavior;
  if (drawer) DRAWERS[kind] = drawer;
}

// Dispatch für mapDef.enemySpawns ({x, y, kind, elite?}). Unbekannter kind
// wirft bewusst (Map-Datenfehler sollen im Smoke-Test auffallen).
export function createEnemy(spawn) {
  return CREATORS[spawn.kind](spawn);
}

// Drop mit Streu-Impuls. Trägt IMMER die map-Referenz (Festlegung 4,
// Slice 0): die Streuung läuft durch moveWithCollision, kein Drop landet
// in soliden Tiles. Wird auch von props.js (Vasen/Truhe) genutzt.
// Slice 2: kind 'item' trägt das gewürfelte Item im Feld item.
export function scatterDrop(drops, map, cx, cy, kind, item = null) {
  const a = Math.random() * Math.PI * 2;
  const speed = 40 + Math.random() * 40;
  drops.push({
    x: cx - 4,
    y: cy - 4,
    w: 8,
    h: 8,
    vx: Math.cos(a) * speed,
    vy: Math.sin(a) * speed,
    age: 0,
    kind,
    item,
    map,
  });
}

// Slot nach Gewichtung würfeln (Rostpanzer: Rüstung 50 / Waffe 25 / Ring 25).
function pickSlot(weights) {
  let r = Math.random();
  for (const slot of Object.keys(weights)) {
    r -= weights[slot];
    if (r < 0) return slot;
  }
  return 'weapon';
}

// Todes-Drops: Münzen/Trank wie bisher, zusätzlich Gear nach Drop-Tabelle
// (§2.2) inklusive Pity über player.inv: ab PITY_LIMIT Kills ohne Gear ist
// der nächste Kill ein garantierter Normal-Drop (Slot uniform); jeder
// Gear-Drop setzt pity auf 0 zurück.
function spawnDeathDrops(e, map, drops, player) {
  // Boss / zerbroeselte Adds (§2.2): noDrops bricht SOFORT ab — kein Geld,
  // kein Gear, KEIN Pity-Einfluss.
  if (e.noDrops) return;
  const cx = e.x + e.w / 2;
  const cy = e.y + e.h / 2;
  const cMin = e.coinMin ?? 1;
  const cMax = e.coinMax ?? 3;
  const n = cMin + Math.floor(Math.random() * (cMax - cMin + 1));
  for (let i = 0; i < n; i++) scatterDrop(drops, map, cx, cy, 'coin');
  // Ghul: 20 % zusätzlich 1 Trank
  if (e.kind === 'ghoul' && Math.random() < 0.2) scatterDrop(drops, map, cx, cy, 'potion');

  if (!e.dropTable) return;
  const inv = player ? player.inv : null;
  if (inv && inv.pity >= PITY_LIMIT) {
    scatterDrop(drops, map, cx, cy, 'item', rollItem(Math.random, { rare: false }));
    inv.pity = 0;
  } else if (Math.random() < e.dropTable.itemChance) {
    const rare = Math.random() < e.dropTable.rareChance;
    const slot = e.dropTable.slotWeights ? pickSlot(e.dropTable.slotWeights) : undefined;
    scatterDrop(drops, map, cx, cy, 'item', rollItem(Math.random, { slot, rare }));
    if (inv) inv.pity = 0;
  } else if (inv) {
    inv.pity += 1;
  }
}

// Frontkegel-Block des Rostpanzers (§2.3): Angriffsursprung (ox, oy) gegen
// die gerastete Blickrichtung, dot > 0,5 entspricht ±60°. Gilt für Schwert
// UND Bumerang (projectiles.js nutzt dieselbe Prüfung).
export function isBlocked(e, ox, oy) {
  if (e.kind !== 'rust' || e.state === 'die') return false;
  const vx = ox - (e.x + e.w / 2);
  const vy = oy - (e.y + e.h / 2);
  const len = Math.hypot(vx, vy);
  if (len < 0.001) return false;
  return (vx / len) * e.faceX + (vy / len) * e.faceY > 0.5;
}

// Generisches wander/chase (Skelett/Ghul), WÖRTLICH aus dem alten
// updateEnemies extrahiert, Verhalten unverändert (Regressions-Falle!).
function updateWanderChase(dt, e, player, map) {
  const ecx = e.x + e.w / 2;
  const ecy = e.y + e.h / 2;
  const pcx = player.x + player.w / 2;
  const pcy = player.y + player.h / 2;
  const dx = pcx - ecx;
  const dy = pcy - ecy;
  const dist = Math.hypot(dx, dy);

  let speed;
  if (dist < e.sight && player.state !== 'dead') {
    e.state = 'chase';
    speed = e.chaseSpeed;
    e.dirX = dx / (dist || 1);
    e.dirY = dy / (dist || 1);
  } else {
    e.state = 'wander';
    speed = e.wanderSpeed;
    e.wanderTimer -= dt;
    if (e.wanderTimer <= 0) {
      e.wanderTimer = 1 + Math.random();
      const a = Math.random() * Math.PI * 2;
      e.dirX = Math.cos(a);
      e.dirY = Math.sin(a);
    }
  }
  if (e.dirX !== 0) e.facingLeft = e.dirX < 0;
  moveWithCollision(e, map, e.dirX * speed * dt, e.dirY * speed * dt);
}

// Grufthund-Zustandsmaschine (§2.3). Mutiert e.contactDamage je Zustand.
function updateHound(dt, e, player, map) {
  const ecx = e.x + e.w / 2;
  const ecy = e.y + e.h / 2;
  const pcx = player.x + player.w / 2;
  const pcy = player.y + player.h / 2;
  const dx = pcx - ecx;
  const dy = pcy - ecy;
  const dist = Math.hypot(dx, dy);
  const nx = dx / (dist || 1);
  const ny = dy / (dist || 1);

  if (e.state === 'down') {
    // 1,2 s Bauchlage: keine Bewegung, kein Kontaktschaden, verwundbar.
    e.contactDamage = 0;
    e.downTimer -= dt;
    if (e.downTimer <= 0) {
      e.state = 'circle';
      e.contactDamage = 1;
      e.leapBlock = 1; // 1 s Sprungsperre nach dem Aufstehen
      e.orbitTimer = 2 + Math.random();
    }
    return;
  }

  if (e.state === 'telegraph') {
    // 0,5 s Ansatz: steht (Duck-Sprite). Sprungrichtung folgt dem Spieler
    // nur die ersten 0,2 s, danach eingeloggt (kein Homing).
    e.contactDamage = 1;
    e.telegraphTimer -= dt;
    if (!e.leapLocked) {
      e.leapDirX = nx;
      e.leapDirY = ny;
      if (nx !== 0) e.facingLeft = nx < 0;
      if (0.5 - e.telegraphTimer >= 0.2) e.leapLocked = true;
    }
    if (e.telegraphTimer <= 0) {
      e.state = 'leap';
      e.leapTimer = 0.35;
      e.contactDamage = 2;
    }
    return;
  }

  if (e.state === 'leap') {
    // Sprungbiss: 200 px/s für 0,35 s, durch moveWithCollision.
    e.contactDamage = 2;
    e.leapTimer -= dt;
    moveWithCollision(e, map, e.leapDirX * 200 * dt, e.leapDirY * 200 * dt);
    if (e.leapTimer <= 0) {
      e.state = 'down';
      e.downTimer = 1.2;
      e.contactDamage = 0;
    }
    return;
  }

  if (e.state === 'circle') {
    e.contactDamage = 1;
    if (dist >= e.sight || player.state === 'dead') {
      e.state = 'wander';
      e.wanderTimer = 0;
      return;
    }
    if (e.leapBlock > 0) e.leapBlock -= dt;
    e.orbitSwitchTimer -= dt;
    if (e.orbitSwitchTimer <= 0) {
      e.orbitDir = -e.orbitDir;
      e.orbitSwitchTimer = 1.5 + Math.random();
    }
    e.orbitTimer -= dt;
    if (e.orbitTimer <= 0 && e.leapBlock <= 0) {
      e.state = 'telegraph';
      e.telegraphTimer = 0.5;
      e.leapLocked = false;
      e.leapDirX = nx;
      e.leapDirY = ny;
      return;
    }
    let vx;
    let vy;
    if (dist > e.orbitRadius + 24) {
      // Annäherung bis zum Orbit
      vx = nx * e.approachSpeed;
      vy = ny * e.approachSpeed;
    } else {
      // Tangential um den Spieler, sanfte Radial-Korrektur zum Zielradius
      const corr = Math.max(-30, Math.min(30, (dist - e.orbitRadius) * 1.5));
      vx = -ny * e.orbitDir * e.orbitSpeed + nx * corr;
      vy = nx * e.orbitDir * e.orbitSpeed + ny * corr;
    }
    if (vx !== 0) e.facingLeft = vx < 0;
    const hit = moveWithCollision(e, map, vx * dt, vy * dt);
    if (hit.x || hit.y) {
      // Wandklemmen: Umlaufrichtung wechseln
      e.orbitDir = -e.orbitDir;
      e.orbitSwitchTimer = 1.5 + Math.random();
    }
    return;
  }

  // wander: Muster wie updateWanderChase, Sichtkontakt → circle
  e.contactDamage = 1;
  if (dist < e.sight && player.state !== 'dead') {
    e.state = 'circle';
    e.orbitTimer = 2 + Math.random();
    return;
  }
  e.wanderTimer -= dt;
  if (e.wanderTimer <= 0) {
    e.wanderTimer = 1 + Math.random();
    const a = Math.random() * Math.PI * 2;
    e.dirX = Math.cos(a);
    e.dirY = Math.sin(a);
  }
  if (e.dirX !== 0) e.facingLeft = e.dirX < 0;
  moveWithCollision(e, map, e.dirX * e.wanderSpeed * dt, e.dirY * e.wanderSpeed * dt);
}

// Rostpanzer: Bewegung wie wander/chase, aber die Blickrichtung rastet auf
// 4 Himmelsrichtungen und dreht höchstens alle 0,4 s (Schwachstelle).
function updateRust(dt, e, player, map) {
  if (e.faceTimer > 0) e.faceTimer -= dt;
  updateWanderChase(dt, e, player, map);
  if (e.faceTimer <= 0 && (e.dirX !== 0 || e.dirY !== 0)) {
    const fx = Math.abs(e.dirX) >= Math.abs(e.dirY) ? Math.sign(e.dirX) : 0;
    const fy = fx === 0 ? Math.sign(e.dirY) : 0;
    if (fx !== e.faceX || fy !== e.faceY) {
      e.faceX = fx;
      e.faceY = fy;
      e.faceTimer = 0.4;
    }
  }
}

const BEHAVIORS = {
  hound: updateHound,
  rust: updateRust,
};

// Zeichner-Dispatch (§3): kinds mit eigenem Zeichner (Boss) uebernehmen den
// Rendervorgang komplett. Bestandskinds haben keinen Eintrag -> generisch.
const DRAWERS = {};

export function updateEnemies(dt, enemies, player, map, drops, events) {
  const swordHb = player.getSwordHitbox ? player.getSwordHitbox() : null;
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    e.animTimer += dt;

    if (e.state === 'die') {
      e.dieTimer -= dt;
      if (e.dieTimer <= 0) {
        // §3-Erweiterung 2: Sterbe-Event (Boss: 'boss_died') nach Ablauf
        // des Timers, VOR dem splice.
        if (e.deathEvent) events.push(e.deathEvent);
        spawnDeathDrops(e, map, drops, player);
        enemies.splice(i, 1);
      }
      continue;
    }

    if (e.hurtTimer > 0) e.hurtTimer -= dt;
    if (e.attackCooldown > 0) e.attackCooldown -= dt;
    if (e.blockFlash > 0) e.blockFlash -= dt;

    if (swordHb && e.hitAttackId !== player.attackId && aabbOverlap(swordHb, e)) {
      e.hitAttackId = player.attackId;
      const pcx = player.x + player.w / 2;
      const pcy = player.y + player.h / 2;
      if (isBlocked(e, pcx, pcy)) {
        // Frontkegel: KEIN Schaden, KEIN Knockback, nur Funken + Event
        e.blockFlash = BLOCK_FLASH;
        events.push('attack_blocked');
      } else {
        e.hp -= player.stats?.dmg ?? 1;
        e.hurtTimer = HURT_FLASH;
        // KNOCKBACK-REGEL (§3): knockX/knockY/knockTimer NUR bei
        // knockFactor > 0. Sonst friert das continue im Knockback-Zweig die
        // Boss-Zustandsmaschine je Treffer 0,15 s ein (de facto stunbar).
        // Kein Bestandsgegner hat knockFactor 0 -> keine Regression.
        if ((e.knockFactor ?? 1) > 0) {
          let kx = e.x + e.w / 2 - pcx;
          let ky = e.y + e.h / 2 - pcy;
          const klen = Math.hypot(kx, ky);
          if (klen < 0.001) { kx = 0; ky = 1; } else { kx /= klen; ky /= klen; }
          e.knockX = kx;
          e.knockY = ky;
          e.knockTimer = KNOCK_DURATION;
          e.knockMult = player.stats?.knockMult ?? 1;
        }
        if (e.hp <= 0) {
          e.state = 'die';
          // §3-Erweiterung 1: Boss stirbt ueber dieTime (1,0 s), Rest DIE_TIME.
          e.dieTimer = e.dieTime ?? DIE_TIME;
          events.push('enemy_died');
          // XP-Vergabe (§3): nur wenn ein prog-Objekt haengt; Level-Up heilt
          // voll. Boss traegt xp 0 -> keine Level.
          if (player.prog) {
            const ups = grantXp(player.prog, e.xp ?? 0);
            if (ups > 0) {
              player.recalcStats();
              player.hp = player.maxHp;
              events.push('level_up');
            }
          }
          continue;
        }
      }
    }

    if (e.knockTimer > 0) {
      e.knockTimer -= dt;
      // knockFactor skaliert die Wucht (Ghul: 50 %), knockMult kommt vom
      // treffenden Schlag (stats), Dauer bleibt gleich
      const v = KNOCK_SPEED * (e.knockMult ?? 1) * (e.knockFactor ?? 1) * Math.max(e.knockTimer, 0) / KNOCK_DURATION;
      moveWithCollision(e, map, e.knockX * v * dt, e.knockY * v * dt);
      continue;
    }

    // Bumerang-Stun (§2.4): Verhalten und Kontaktschaden ruhen, Schwert-
    // Treffer und deren Knockback wirken oben weiterhin (verwundbar).
    if (e.stunTimer > 0) {
      e.stunTimer -= dt;
      continue;
    }

    // Gegner-Zentrum VOR dem Behavior: die Knockback-Richtung von
    // player.hurt bleibt exakt wie vor Slice 2.
    const ecx = e.x + e.w / 2;
    const ecy = e.y + e.h / 2;

    (BEHAVIORS[e.kind] || updateWanderChase)(dt, e, player, map, enemies, events);

    if (
      e.contactDamage !== 0 &&
      player.state !== 'dead' &&
      player.invulnTimer <= 0 &&
      e.attackCooldown <= 0 &&
      aabbOverlap(e, player)
    ) {
      if (player.hurt(e.contactDamage, ecx, ecy)) e.attackCooldown = CONTACT_COOLDOWN;
    }
  }
}

export function updateDrops(dt, drops, player, events) {
  const pcx = player.x + player.w / 2;
  const pcy = player.y + player.h / 2;
  const pickupRadius = player.stats?.pickupRadius ?? PICKUP_RADIUS;
  for (let i = drops.length - 1; i >= 0; i--) {
    const d = drops[i];
    d.age += dt;
    if (d.age < SCATTER_TIME) {
      const s = 1 - d.age / SCATTER_TIME; // linear auslaufender Streu-Impuls
      moveWithCollision(d, d.map, d.vx * s * dt, d.vy * s * dt);
    }
    if (d.retryTimer > 0) d.retryTimer -= dt;
    if (player.state === 'dead') continue;

    // Bumerang-Magnet (§2.4): coin/potion fliegen mit 180 px/s zum Spieler;
    // erlischt nach 1 s ohne Fortschritt (Schutz an Wandecken).
    if (d.magnet) {
      const mx = pcx - (d.x + d.w / 2);
      const my = pcy - (d.y + d.h / 2);
      const mlen = Math.hypot(mx, my);
      if (mlen > 0.001) {
        moveWithCollision(d, d.map, (mx / mlen) * MAGNET_SPEED * dt, (my / mlen) * MAGNET_SPEED * dt);
      }
      const after = Math.hypot(pcx - d.x - d.w / 2, pcy - d.y - d.h / 2);
      if (after < (d.magnetBest ?? Infinity) - 0.5) {
        d.magnetBest = after;
        d.magnetStall = 0;
      } else {
        d.magnetStall = (d.magnetStall ?? 0) + dt;
        if (d.magnetStall >= 1) d.magnet = false;
      }
    }

    const dcx = d.x + d.w / 2;
    const dcy = d.y + d.h / 2;
    if (Math.hypot(pcx - dcx, pcy - dcy) < pickupRadius) {
      if (d.kind === 'item') {
        // Ausrüstung: addItem-Versuch; volle Tasche lässt den Drop liegen,
        // retryTimer drosselt erneute Versuche und das Event (§3).
        if (!player.inv || d.retryTimer > 0) continue;
        if (addItem(player.inv, d.item)) {
          events.push({ type: 'item_pickup', item: d.item });
          drops.splice(i, 1);
        } else {
          events.push('inventory_full');
          d.retryTimer = 1.0;
        }
        continue;
      }
      if (d.kind === 'potion') {
        // Volle Taschen: nicht liegen lassen → +2 Gold (SPEC_SLICE_1 §2 player)
        if ((player.potions ?? 0) < (player.maxPotions ?? MAX_POTIONS)) {
          player.potions += 1;
          events.push('potion_pickup');
        } else {
          player.gold += 2;
          events.push('potion_full_gold');
        }
      } else {
        player.gold += 1;
        events.push('gold_pickup');
      }
      drops.splice(i, 1);
    }
  }
}

// Animations-Frequenz je Kind (Frames/s für den 2-Frame-Laufzyklus).
const ANIM_RATE = { skeleton: 5, ghoul: 3.5, hound: 6, rust: 2.5 };

// Einzelner Gegner (für die Y-Sortierung in main.js einzeln aufrufbar).
// Gibt false zurück, wenn dieser Frame übersprungen wird (Hurt-Blitzen,
// Aufsteh-Blinken des Grufthunds).
export function drawEnemy(ctx, cam, e, gfx, timeSec) {
  // §3: existiert ein eigener Zeichner (Boss), uebernimmt er komplett.
  const drawer = DRAWERS[e.kind];
  if (drawer) return drawer(ctx, cam, e, gfx, timeSec);

  const prefix = e.kind;
  let key;
  if (e.state === 'die') {
    key = e.facingLeft ? `${prefix}_die_flip` : `${prefix}_die`;
  } else {
    if (e.hurtTimer > 0 && Math.floor(timeSec * 20) % 2 === 0) return false; // Blitzen
    if (e.kind === 'hound' && e.state === 'down' && e.downTimer <= 0.3
      && Math.floor(timeSec * 10) % 2 === 0) {
      return false; // Aufsteh-Blinken (letzte 0,3 s am Boden)
    }
    if (e.kind === 'hound' && (e.state === 'telegraph' || e.state === 'leap' || e.state === 'down')) {
      key = e.facingLeft ? `hound_${e.state}_flip` : `hound_${e.state}`;
    } else {
      const frame = Math.floor(e.animTimer * (ANIM_RATE[e.kind] ?? 5)) % 2;
      key = e.facingLeft ? `${prefix}_${frame}_flip` : `${prefix}_${frame}`;
    }
  }
  // Bumerang-Stun: Sprite wackelt ±1 px horizontal, deterministisch aus
  // timeSec. KEIN Blinken (Blinken bedeutet Schaden).
  const wobble = e.stunTimer > 0 ? (Math.floor(timeSec * 14) % 2 === 0 ? 1 : -1) : 0;
  // Größenagnostisch: horizontal auf die AABB zentriert, Füße = Unterkante.
  const img = gfx[key];
  ctx.drawImage(
    img,
    Math.round(e.x + e.w / 2 - img.width / 2 - cam.x) + wobble,
    Math.round(e.y + e.h - img.height - cam.y)
  );
  // Rostpanzer: Schild-Overlay auf der face-Seite, Funken bei blockFlash.
  if (e.kind === 'rust' && e.state !== 'die') {
    const sKey = e.faceY < 0 ? 'shield_up'
      : e.faceY > 0 ? 'shield_down'
        : e.faceX < 0 ? 'shield_side_flip' : 'shield_side';
    const simg = gfx[sKey];
    ctx.drawImage(
      simg,
      Math.round(e.x + e.w / 2 - simg.width / 2 + e.faceX * 6 - cam.x) + wobble,
      Math.round(e.y + e.h / 2 - simg.height / 2 + e.faceY * 6 - cam.y)
    );
    if (e.blockFlash > 0) {
      const bimg = gfx.block_spark;
      ctx.drawImage(
        bimg,
        Math.round(e.x + e.w / 2 - bimg.width / 2 + e.faceX * 8 - cam.x),
        Math.round(e.y + e.h / 2 - bimg.height / 2 + e.faceY * 8 - cam.y)
      );
    }
  }
  // Elite-Glut-Overlay (§2.4): elite_glow 8x8 ueber der Kopfposition,
  // blinkt 0,3 s alle 1,2 s (Sparkle-Rhythmus). Die Mini-Lichter der Eliten
  // liefert eliteLights() fuer die frameLights-Liste in drawWorld.
  if (e.elite && e.state !== 'die' && timeSec % 1.2 < 0.3) {
    const gimg = gfx.elite_glow;
    if (gimg) {
      ctx.drawImage(
        gimg,
        Math.round(e.x + e.w / 2 - gimg.width / 2 - cam.x),
        Math.round(e.y - cam.y) - gimg.height + 2
      );
    }
  }
  return true;
}

// Mini-Lichter der LEBENDEN Eliten (§2.4) fuer die frameLights-Liste in
// drawWorld (Muster Selten-Drop-Lichter; NICHT ins statische lights-Array
// aus buildWorld — das klebt am Spawn und ueberlebt den Tod). Integrator C
// spreizt das Ergebnis pro Frame in frameLights.
export function eliteLights(enemies) {
  const out = [];
  for (const e of enemies) {
    if (e.elite && e.state !== 'die') {
      out.push({ x: e.x + e.w / 2, y: e.y + e.h / 2, radius: 10, flicker: 0.3 });
    }
  }
  return out;
}

export function drawEnemies(ctx, cam, enemies, gfx, timeSec) {
  for (const e of enemies) drawEnemy(ctx, cam, e, gfx, timeSec);
}

// Einzelner Drop (Index i steuert die Münz-Animationsphase).
// kind 'item': Boden-Sprite je Slot plus Glint alle 1,2 s; Name/Farbe
// erscheinen erst im Pickup-Toast (§3).
export function drawDrop(ctx, cam, d, i, gfx, timeSec) {
  let img;
  if (d.kind === 'item') img = gfx[`item_${d.item.slot}`];
  else if (d.kind === 'potion') img = gfx.potion;
  else img = gfx[`coin_${Math.floor(timeSec * 6 + i) % 2}`];
  ctx.drawImage(
    img,
    Math.round(d.x + d.w / 2 - img.width / 2 - cam.x),
    Math.round(d.y + d.h / 2 - img.height / 2 - cam.y)
  );
  if (d.kind === 'item') {
    const phase = (timeSec + i * 0.4) % 1.2;
    if (phase < 0.3) {
      const glint = gfx[phase < 0.15 ? 'sparkle_0' : 'sparkle_1'];
      ctx.drawImage(
        glint,
        Math.round(d.x + d.w / 2 - glint.width / 2 - cam.x) + 3,
        Math.round(d.y + d.h / 2 - glint.height / 2 - cam.y) - 3
      );
    }
  }
}

export function drawDrops(ctx, cam, drops, gfx, timeSec) {
  for (let i = 0; i < drops.length; i++) drawDrop(ctx, cam, drops[i], i, gfx, timeSec);
}
