// Knochen-Bumerang (SPEC_SLICE_2 §2.4). Node-importierbar.
//
// 0 Schaden, nur Stun: Skelett/Ghul 1,5 s; Grufthund kippt sofort in down
// (1,5 s); Rostpanzer blockt frontal (attack_blocked), seitlich/hinten
// 1,0 s Stun. Markiert Vasen/Urnen (boomerangHit) und coin/potion-Drops
// (magnet). Jeder Treffer (Gegner, Prop, Wand) startet den Rückflug; der
// Rückflug ignoriert Wände (LttP-Stil) und fängt den Spieler immer.

import { aabbOverlap, moveWithCollision } from './entity.js';
import { isBlocked } from './enemies.js';
import { gravewardCooldown } from './boss.js';

const SIZE = 8;
const SPEED_OUT = 150;
const SPEED_RETURN_MIN = 150;
const SPEED_RETURN_MAX = 220;
const RETURN_ACCEL = 280;    // 150 → 220 px/s nach 0,25 s (ca. 46 px), so
                             // wird die Endgeschwindigkeit auch auf der
                             // maximalen 64-px-Distanz erreicht
const MAX_RANGE = 64;        // 4 Tiles
const CATCH_RADIUS = 10;
const RETHROW_LOCK = 0.2;    // Nachwurfsperre nach der Rückkehr
const STUN_BASIC = 1.5;      // Skelett/Ghul
const STUN_RUST_SIDE = 1.0;  // Rostpanzer seitlich/hinten
const HOUND_DOWN_TIME = 1.5; // Grufthund: sofort down
const BLOCK_FLASH = 0.15;

const DIRS = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

export function createProjectiles() {
  // Eigene Flankenerkennung auf input.secondary (Muster potionHeld,
  // player.js): geworfen wird nur beim Übergang unten→oben.
  let secondaryHeld = false;
  // Nachwurfsperre lebt als Modulzustand: das Projektil verlässt beim
  // Fang die Liste, sein lockTimer-Feld liefert die Sperrdauer.
  let relockTimer = 0;

  const projectiles = {
    list: [],
    update,
  };

  function update(dt, input, player, enemies, props, map, drops, events) {
    if (relockTimer > 0) relockTimer -= dt;
    const edge = !!input.secondary && !secondaryHeld;
    secondaryHeld = !!input.secondary;

    // Wurf: nur mit Bumerang im zelda-Slot, keiner in der Luft, keine
    // Nachwurfsperre, Spieler weder dead noch hurt (attack ist erlaubt).
    if (
      edge && projectiles.list.length === 0 && relockTimer <= 0
      && player.inv && player.inv.zelda && player.inv.zelda.includes('boomerang')
      && player.state !== 'dead' && player.state !== 'hurt'
    ) {
      const dir = DIRS[player.facing] || DIRS.down;
      projectiles.list.push({
        x: player.x + player.w / 2 - SIZE / 2,
        y: player.y + player.h / 2 - SIZE / 2,
        w: SIZE,
        h: SIZE,
        phase: 'out',
        dirX: dir[0],
        dirY: dir[1],
        traveled: 0,
        hitIds: new Set(), // Einmal-Treffer je Flug (Objekt-Referenzen)
        lockTimer: RETHROW_LOCK,
        returnSpeed: SPEED_RETURN_MIN,
      });
    }

    const pcx = player.x + player.w / 2;
    const pcy = player.y + player.h / 2;

    for (let i = projectiles.list.length - 1; i >= 0; i--) {
      const p = projectiles.list[i];

      if (p.phase === 'out') {
        // Hinflug: 150 px/s, maximal EXAKT 64 px (letzter Schritt gekappt)
        // oder bis Wand (moveWithCollision)
        const step = Math.min(SPEED_OUT * dt, MAX_RANGE - p.traveled);
        const wallHit = moveWithCollision(p, map, p.dirX * step, p.dirY * step);
        p.traveled += step;
        if (wallHit.x || wallHit.y || p.traveled >= MAX_RANGE - 1e-9) p.phase = 'return';
      } else {
        // Rückflug: zum Spielerzentrum, beschleunigend, OHNE Wand-
        // Kollision (fliegt "über" Wände zurück wie in LttP).
        p.returnSpeed = Math.min(SPEED_RETURN_MAX, p.returnSpeed + RETURN_ACCEL * dt);
        const dx = pcx - (p.x + p.w / 2);
        const dy = pcy - (p.y + p.h / 2);
        const len = Math.hypot(dx, dy);
        const step = p.returnSpeed * dt;
        if (len <= step) {
          p.x = pcx - p.w / 2;
          p.y = pcy - p.h / 2;
        } else {
          p.x += (dx / len) * step;
          p.y += (dy / len) * step;
        }
      }

      applyHits(p, enemies, props, drops, events);

      if (p.phase === 'return') {
        const dist = Math.hypot(pcx - (p.x + p.w / 2), pcy - (p.y + p.h / 2));
        if (dist < CATCH_RADIUS) {
          // Gefangen: raus aus der Liste, Nachwurfsperre starten
          relockTimer = p.lockTimer;
          projectiles.list.splice(i, 1);
        }
      }
    }
  }

  // Treffer-Wirkung (§2.4): Stun/Down/Block je Kind, Props markieren,
  // coin/potion-Drops magnetisieren. Jeder Gegner/Prop-Treffer startet
  // den Rückflug; hitIds verhindert Doppel-Treffer im selben Flug.
  function applyHits(p, enemies, props, drops, events) {
    let hit = false;

    for (const e of enemies) {
      if (e.state === 'die' || p.hitIds.has(e) || !aabbOverlap(p, e)) continue;
      p.hitIds.add(e);
      hit = true;
      if (e.kind === 'graveward') {
        // Bumerang bleibt Utility, nie Toetungsverb (§2.2/§3):
        if (e.state === 'idle') {
          // Erster Treffer weckt den Boss (Aggro, §2.2).
          e.state = 'stalk';
          e.cooldown = gravewardCooldown(e.phase);
        } else if (e.state === 'summon') {
          // Cast-Abbruch: Welle entfaellt, Boss zurueck in stalk mit vollem
          // Cooldown.
          e.summonAborted = true;
          e.state = 'stalk';
          e.cooldown = gravewardCooldown(e.phase);
          e.marker = null;
        } else if (e.state === 'stuck') {
          // stuck-Fenster einmalig je stuck +1,0 s verlaengern.
          if (!e.stuckExtended) { e.stateTimer += 1.0; e.stuckExtended = true; }
        }
        // sonst: nur Rueckflug (hit=true), kein Stun/Schaden/Event.
        continue;
      }
      if (e.kind === 'hound') {
        // circle/telegraph/leap (und wander) → sofort down, 1,5 s
        e.state = 'down';
        e.downTimer = HOUND_DOWN_TIME;
        e.contactDamage = 0;
      } else if (e.kind === 'rust') {
        if (isBlocked(e, p.x + p.w / 2, p.y + p.h / 2)) {
          e.blockFlash = BLOCK_FLASH;
          events.push('attack_blocked');
        } else {
          e.stunTimer = STUN_RUST_SIDE;
        }
      } else {
        e.stunTimer = STUN_BASIC;
      }
    }

    for (const pr of props) {
      if (pr.state === 'break' || p.hitIds.has(pr) || !aabbOverlap(p, pr)) continue;
      p.hitIds.add(pr);
      hit = true;
      // updateProps: Vase/Urne wie Schwert-Treffer, Truhen ignorieren das
      // Flag (öffnen nur per Schwert) und löschen es nur.
      pr.boomerangHit = true;
    }

    for (const d of drops) {
      // item-Drops werden NICHT magnetisiert (§2.4)
      if ((d.kind === 'coin' || d.kind === 'potion') && !d.magnet && aabbOverlap(p, d)) {
        d.magnet = true;
      }
    }

    if (hit) p.phase = 'return';
  }

  return projectiles;
}

// Rotations-Frames boomerang_0/1 im Wechsel, größenagnostisch aufs
// Projektil-Zentrum gesetzt.
export function drawProjectile(ctx, cam, p, gfx, timeSec) {
  const img = gfx[Math.floor(timeSec * 12) % 2 === 0 ? 'boomerang_0' : 'boomerang_1'];
  ctx.drawImage(
    img,
    Math.round(p.x + p.w / 2 - img.width / 2 - cam.x),
    Math.round(p.y + p.h / 2 - img.height / 2 - cam.y)
  );
}
