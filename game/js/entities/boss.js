// Der Grabwaechter (kind 'graveward') — Boss aus SPEC_SLICE_3 §2.2.
// Node-importierbar (keine Browser-Globals auf Modulebene). Reine
// Zustandsmaschine; der Sterbepfad laeuft NICHT hier, sondern generisch in
// enemies.js (dieTime/deathEvent/noDrops).
//
// Reiner Nahkaempfer, 0 Projektile: genau 2 Angriffsmuster (A Rundumschlag,
// B Sturmschlag) plus Beschwoerungs-Phasen. Eskalation nur ueber Tempo
// (Cooldowns/Telegraphen), nie ueber neue Muster (Panel-Entscheidung 3).
//
// Zustaende: idle | stalk | windupA | sweep | windupB | dash | stuck |
// recover | summon | die (die generisch in enemies.js).

import { aabbOverlap, moveWithCollision } from './entity.js';
import { registerEnemyKind, createSkeleton } from './enemies.js';

// --- Bindende Zahlenwerte (§2.2) --------------------------------------------
const HP = 26;
const AGGRO_DIST = 64;      // Distanz-Aggro (und Sichtweite danach unbegrenzt)
const STALK_SPEED = 30;     // px/s Annaeherung zwischen Angriffen
const ATK_RANGE_B = 88;     // <=88: Angriffswahl; darueber weiter stalk
const ATK_RANGE_A = 32;     // <=32 -> Muster A, sonst (bis 88) Muster B
// Muster A Rundumschlag
const SWEEP_RADIUS = 30;    // Trefferkreis um das Boss-Zentrum
const SWEEP_ACTIVE = 0.25;  // aktive Trefferphase
const RECOVER_A = 0.9;      // Recovery stehend, verwundbar
// Muster B Sturmschlag
const CORRIDOR_FOLLOW = 0.3; // Marker folgt so lange dem Spieler, dann Lock
const DASH_SPEED = 150;
const DASH_TIME = 0.4;
const DASH_HIT_ACTIVE = 0.2; // Aufschlag-Hitbox 24x24 vor dem Boss
const STUCK_TIME = 1.2;      // Bestrafungsfenster (verwundbar, kein Kontakt)
// Beschwoerung
const SUMMON_TIME = 1.2;
const ADD_MIN_DIST = 64;     // Adds nie naeher als 64 px am Spieler (§2.3.4)
const MAX_ADDS = 2;          // nie mehr als 2 lebende Adds gleichzeitig
// Add-Anker (Tile-Zentren, §2.2). tc(tx,ty) = tx*16+8 / ty*16+8.
const ADD_ANCHORS = [[4, 3], [15, 3], [4, 8], [15, 8]].map(
  ([tx, ty]) => ({ x: tx * 16 + 8, y: ty * 16 + 8 })
);

// Phasenabhaengige Tempi. Phase 1: HP 26..17, Phase 2: <17..9, Phase 3: <9.
export function gravewardCooldown(phase) {
  return phase >= 3 ? 0.7 : phase === 2 ? 0.9 : 1.2;
}
function windupA(phase) { return phase >= 3 ? 0.65 : 0.8; }
function windupB(phase) { return phase >= 3 ? 0.8 : 1.0; }

// spawn = Weltpixel, ZENTRUM der 20x24-AABB (Konvention aus maps.js).
export function createGraveward(spawn) {
  return {
    x: spawn.x - 10,
    y: spawn.y - 12,
    w: 20,
    h: 24,
    kind: 'graveward',
    hp: HP,
    maxHp: HP,
    contactDamage: 1,       // idle/stalk/Angriffe: 1; summon/stuck: 0
    knockFactor: 0,         // immun gegen Knockback (§2.2, enemies.js-Regel)
    facingLeft: false,
    // Sterbepfad-Datenfelder (tr.gt der generische die-Zweig in enemies.js):
    xp: 0,
    dieTime: 1.0,
    deathEvent: 'boss_died',
    noDrops: true,          // kein Gear, keine Muenzen, KEIN Pity-Einfluss
    // KEIN dropTable
    // Treffer-Bookkeeping (wie Bestandsgegner)
    hitAttackId: -1,
    hurtTimer: 0,
    knockTimer: 0,          // bleibt 0 (knockFactor 0), Felder fuer Symmetrie
    knockX: 0,
    knockY: 0,
    stunTimer: 0,           // Boss ist nicht stunbar; Feld fuer den Loop
    dieTimer: 0,
    animTimer: 0,
    // Boss-Zustandsmaschine
    state: 'idle',
    phase: 1,
    phased17: false,
    phased9: false,
    cooldown: 0,            // stalk-Angriffs-Cooldown
    stateTimer: 0,          // Timer des aktuellen Zustands
    windupDur: 0,           // Dauer des laufenden Telegraphs (fuer den Marker)
    marker: null,           // { kind:'ring'|'rect', ... } waehrend Telegraphs
    hitApplied: false,      // ein Spieler-Treffer je aktiver Trefferphase
    dashDirX: 0,
    dashDirY: 1,
    dirLocked: false,
    stuckExtended: false,   // Bumerang-Verlaengerung einmal je stuck
    summonAborted: false,   // Bumerang-Abbruch waehrend summon
    summoned: false,        // der Boss selbst ist kein Add
  };
}

function enterStalk(e) {
  e.state = 'stalk';
  e.cooldown = gravewardCooldown(e.phase);
  e.marker = null;
}

function enterSummon(e) {
  e.state = 'summon';
  e.stateTimer = SUMMON_TIME;
  e.summonAborted = false;
  e.contactDamage = 0;
  e.marker = null;
}

// Phasenwechsel bei Unterschreiten von 17 bzw. 9 HP (je einmal). Loest die
// Beschwoerung aus. Gibt true, wenn ein Wechsel greift.
function checkPhase(e) {
  if (!e.phased17 && e.hp < 17) { e.phased17 = true; e.phase = 2; return true; }
  if (!e.phased9 && e.hp < 9) { e.phased9 = true; e.phase = 3; return true; }
  return false;
}

// Beschwoerung: bis zu (MAX_ADDS - lebende Adds) Skelette an den zwei
// SPIELERFERNSTEN Ankern (>= 64 px). Ans ENDE des enemies-Arrays gepusht
// (sicher in der Rueckwaertsiteration: neue Adds ticken erst im Folgeframe).
function spawnAdds(e, player, enemies) {
  const living = enemies.reduce(
    (n, a) => n + (a.summoned && a.state !== 'die' ? 1 : 0), 0
  );
  const need = MAX_ADDS - living;
  if (need <= 0) return;
  const pcx = player.x + player.w / 2;
  const pcy = player.y + player.h / 2;
  const ranked = ADD_ANCHORS
    .map((a) => ({ a, d: Math.hypot(a.x - pcx, a.y - pcy) }))
    .filter((o) => o.d >= ADD_MIN_DIST)
    .sort((p, q) => q.d - p.d);
  for (let i = 0; i < need && i < ranked.length; i++) {
    const add = createSkeleton(ranked[i].a);
    add.summoned = true;
    enemies.push(add);
  }
}

export function updateGraveward(dt, e, player, map, enemies, events) {
  e.animTimer += dt;
  if (e.hurtTimer > 0) e.hurtTimer -= dt;

  const cx = e.x + e.w / 2;
  const cy = e.y + e.h / 2;
  const pcx = player.x + player.w / 2;
  const pcy = player.y + player.h / 2;
  const dx = pcx - cx;
  const dy = pcy - cy;
  const dist = Math.hypot(dx, dy);
  const nx = dx / (dist || 1);
  const ny = dy / (dist || 1);

  switch (e.state) {
    case 'idle':
      // Steht, kein Angriff, Kontaktschaden 1. Aggro bei Distanz <= 64 px
      // ODER erstem Treffer (Schwert senkt hp unter maxHp; Bumerang aggrot
      // direkt in projectiles.js).
      e.contactDamage = 1;
      e.marker = null;
      if (dist <= AGGRO_DIST || e.hp < e.maxHp) enterStalk(e);
      return;

    case 'stalk':
      e.contactDamage = 1;
      e.marker = null;
      if (checkPhase(e)) { enterSummon(e); return; }
      if (nx !== 0) e.facingLeft = nx < 0;
      moveWithCollision(e, map, nx * STALK_SPEED * dt, ny * STALK_SPEED * dt);
      e.cooldown -= dt;
      if (e.cooldown <= 0 && dist <= ATK_RANGE_B) {
        if (dist > ATK_RANGE_A) {
          // Muster B (Sturmschlag)
          e.state = 'windupB';
          e.windupDur = windupB(e.phase);
          e.stateTimer = e.windupDur;
          e.dirLocked = false;
          e.dashDirX = nx;
          e.dashDirY = ny;
        } else {
          // Muster A (Rundumschlag)
          e.state = 'windupA';
          e.windupDur = windupA(e.phase);
          e.stateTimer = e.windupDur;
          e.hitApplied = false;
        }
      }
      return;

    case 'windupA':
      // Telegraph: Boss stoppt (Schwert hoch), Boden-Ring-Marker.
      e.contactDamage = 1;
      e.stateTimer -= dt;
      e.marker = {
        kind: 'ring', x: cx, y: cy, r: SWEEP_RADIUS,
        remaining: e.stateTimer, duration: e.windupDur,
      };
      if (checkPhase(e)) { enterSummon(e); return; }
      if (e.stateTimer <= 0) {
        e.state = 'sweep';
        e.stateTimer = SWEEP_ACTIVE;
        e.hitApplied = false;
      }
      return;

    case 'sweep':
      // Aktive Trefferphase: Kreis Radius 30, Schaden 2, Knockback x1,5.
      e.contactDamage = 1;
      e.marker = null;
      e.stateTimer -= dt;
      if (!e.hitApplied && dist <= SWEEP_RADIUS) {
        if (player.hurt(2, cx, cy, 1.5)) e.hitApplied = true;
      }
      if (e.stateTimer <= 0) { e.state = 'recover'; e.stateTimer = RECOVER_A; }
      return;

    case 'recover':
      // 0,9 s stehend, verwundbar, Kontaktschaden bleibt 1.
      e.contactDamage = 1;
      e.marker = null;
      e.stateTimer -= dt;
      if (checkPhase(e)) { enterSummon(e); return; }
      if (e.stateTimer <= 0) enterStalk(e);
      return;

    case 'windupB': {
      // Telegraph: Korridor-Marker folgt 0,3 s dem Spieler, dann eingeloggt
      // (Muster Grufthund, kein Homing danach).
      e.contactDamage = 1;
      e.stateTimer -= dt;
      const elapsed = e.windupDur - e.stateTimer;
      if (!e.dirLocked) {
        e.dashDirX = nx;
        e.dashDirY = ny;
        if (nx !== 0) e.facingLeft = nx < 0;
        if (elapsed >= CORRIDOR_FOLLOW) e.dirLocked = true;
      }
      e.marker = {
        kind: 'rect', x: cx, y: cy,
        dirX: e.dashDirX, dirY: e.dashDirY, length: 78, width: 24,
        remaining: e.stateTimer, duration: e.windupDur,
      };
      if (checkPhase(e)) { enterSummon(e); return; }
      if (e.stateTimer <= 0) {
        e.state = 'dash';
        e.stateTimer = DASH_TIME;
        e.hitApplied = false;
      }
      return;
    }

    case 'dash': {
      // Sturm: 150 px/s fuer 0,4 s durch die Kollision. Aufschlag-Hitbox
      // 24x24 vor dem Boss, aktiv die ersten 0,2 s.
      e.contactDamage = 1;
      e.marker = null;
      e.stateTimer -= dt;
      moveWithCollision(e, map, e.dashDirX * DASH_SPEED * dt, e.dashDirY * DASH_SPEED * dt);
      const el = DASH_TIME - e.stateTimer;
      if (el <= DASH_HIT_ACTIVE && !e.hitApplied) {
        const bx = e.x + e.w / 2;
        const by = e.y + e.h / 2;
        const hb = {
          x: bx + e.dashDirX * 22 - 12,
          y: by + e.dashDirY * 22 - 12,
          w: 24, h: 24,
        };
        if (aabbOverlap(hb, player)) {
          if (player.hurt(2, bx + e.dashDirX * 22, by + e.dashDirY * 22, 1)) e.hitApplied = true;
        }
      }
      if (e.stateTimer <= 0) {
        e.state = 'stuck';
        e.stateTimer = STUCK_TIME;
        e.stuckExtended = false;
      }
      return;
    }

    case 'stuck':
      // Schwert steckt im Boden: keine Bewegung, KEIN Kontaktschaden,
      // normal verwundbar. Bumerang verlaengert einmal je stuck (projectiles).
      e.contactDamage = 0;
      e.marker = null;
      e.stateTimer -= dt;
      if (checkPhase(e)) { enterSummon(e); return; }
      if (e.stateTimer <= 0) enterStalk(e);
      return;

    case 'summon':
      // Ruf-Pose, verwundbar, kein Kontaktschaden. Nach 1,2 s spawnen die
      // Adds (falls der Bumerang den Ruf nicht abgebrochen hat).
      e.contactDamage = 0;
      e.marker = null;
      e.stateTimer -= dt;
      if (e.stateTimer <= 0) {
        if (!e.summonAborted) spawnAdds(e, player, enemies);
        e.summonAborted = false;
        enterStalk(e);
      }
      return;

    default:
      return;
  }
}

// Zeichner (komplett zustaendig, kein Rueckgriff auf den generischen Pfad).
// Sprite 24x32, horizontal auf die AABB zentriert, Fuesse = AABB-Unterkante.
export function drawGraveward(ctx, cam, e, gfx, timeSec) {
  let base;
  switch (e.state) {
    case 'die': base = 'warden_die'; break;
    case 'stalk': base = `warden_walk_${Math.floor(e.animTimer * 4) % 2}`; break;
    case 'windupA':
    case 'sweep': base = 'warden_windup_a'; break;
    case 'windupB': base = 'warden_windup_b'; break;
    case 'dash': base = 'warden_dash'; break;
    case 'stuck': base = 'warden_stuck'; break;
    case 'summon': base = 'warden_summon'; break;
    case 'recover': base = 'warden_idle'; break;
    default: base = 'warden_idle';
  }
  // Hurt-Blitzen wie im generischen Pfad (nicht im Sterben).
  if (e.state !== 'die' && e.hurtTimer > 0 && Math.floor(timeSec * 20) % 2 === 0) return true;
  const key = (e.facingLeft && gfx[`${base}_flip`]) ? `${base}_flip` : base;
  const img = gfx[key];
  if (!img) return true;
  ctx.drawImage(
    img,
    Math.round(e.x + e.w / 2 - img.width / 2 - cam.x),
    Math.round(e.y + e.h - img.height - cam.y)
  );
  return true;
}

registerEnemyKind('graveward', createGraveward, updateGraveward, drawGraveward);
