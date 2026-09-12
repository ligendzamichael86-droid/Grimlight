// Spieler: Movement, Schwertangriff, Schaden/Unverwundbarkeit. Node-importierbar.
//
// Slice 2: Tempo, Reichweite, Trankheilung, maxHp und Knockback-Faktor
// kommen aus player.stats (computeStats aus dem Inventar). Kampfcode liest
// NIE Affixe, immer nur die abgeleiteten Stats.

import { moveWithCollision } from './entity.js';
import { createInventory, computeStats } from '../items/items.js';
import { createProgress, applyProgress } from '../items/progression.js';

const ATTACK_WINDUP = 0.12;
const ATTACK_ACTIVE = 0.15;
const ATTACK_TOTAL = 0.35; // Gesamt-Cooldown ab Angriffsstart
const ATTACK_BUSY = ATTACK_WINDUP + ATTACK_ACTIVE; // solange keine Bewegung
const SWORD_SIZE = 16;
const KNOCK_SPEED = 140;
const KNOCK_DURATION = 0.15;
const INVULN_TIME = 1;
const MAX_POTIONS = 3;
const POTION_COOLDOWN = 0.3;

// GOD-MODE (Testwerkzeug fuer den Auftraggeber, NUR via ?god=1 in main.js):
// Schaden x10, Tempo x1,4. Die Werte liegen hier, weil der Kampfcode
// ausschliesslich player.stats liest (Spec Slice 2) — so braucht weder
// enemies.js noch sonst ein Modul einen Sonderpfad.
const GOD_DMG_MULT = 10;
const GOD_SPEED_MULT = 1.4;

// spawn = Weltpixel, ZENTRUM der 12×14-AABB (Konvention aus maps.js)
// opts.god === true schaltet den GOD-MODE (default aus; alle Alt-Aufrufer
// createPlayer(spawn) bleiben unveraendert).
export function createPlayer(spawn, opts = {}) {
  // Flankenerkennung fürs Trinken: input.potion ist ein PEGEL (input.js),
  // getrunken wird nur beim Übergang unten→oben.
  let potionHeld = false;
  const god = opts.god === true;

  // GOD-MODE: Schaden/Tempo auf dem FERTIGEN Stats-Objekt skalieren (das ist
  // immer eine frische Kopie: computeStats klont base, applyProgress liefert
  // ein neues Objekt). Ohne Flag unveraendert durchgereicht.
  function godBoost(s) {
    if (!god) return s;
    s.dmg *= GOD_DMG_MULT;
    s.speed = Math.round(s.speed * GOD_SPEED_MULT * 100) / 100;
    return s;
  }

  const inv = createInventory();
  // XP/Level (§2.1): Level = Zaehigkeit. applyProgress addiert nur maxHp.
  const prog = createProgress();
  const stats = godBoost(applyProgress(computeStats(inv), prog));

  const player = {
    x: spawn.x - 6,
    y: spawn.y - 7,
    w: 12,
    h: 14,
    hp: stats.maxHp,
    maxHp: stats.maxHp,
    inv,
    prog,
    stats,
    god,                // GOD-MODE aktiv (hud.js zeichnet daraus den GOTT-Hinweis)
    zeldaState: 'none', // 'none' | 'ready' | 'air', pro Frame von main.js gespiegelt
    deathToll: null,    // Gold-Zoll bei Tod (§2.6.3); main.js berechnet/liest ihn
    gold: 0,
    potions: 0,
    maxPotions: MAX_POTIONS,
    potionCooldown: 0,
    facing: 'down',
    state: 'idle',
    invulnTimer: 0,
    animTimer: 0,
    attackTimer: 0, // zählt von ATTACK_TOTAL herunter
    attackId: 0,    // eindeutig je Schwung (Einmal-Treffer pro Gegner)
    knockTimer: 0,
    knockX: 0,
    knockY: 0,
    knockSpeed: KNOCK_SPEED, // hurt() skaliert mit stats.knockTakenMult
    update,
    getSwordHitbox,
    hurt,
    heal,
    recalcStats,
    draw,
  };

  // Stats nach Inventar-Aenderung neu ableiten. Anlegen heilt NICHT,
  // Ablegen kappt hp auf das neue Maximum.
  function recalcStats() {
    // §3: applyProgress spiegeln (maxHp aus Level + Herzcontainern). Anlegen
    // heilt NICHT, Ablegen kappt hp auf das neue Maximum.
    player.stats = godBoost(applyProgress(computeStats(player.inv), player.prog));
    player.maxHp = player.stats.maxHp;
    player.hp = Math.min(player.hp, player.maxHp);
  }

  function update(dt, input, map, enemies, events) {
    if (player.state === 'dead') {
      player.animTimer += dt; // Sterbe-Animation weiterzählen
      return;
    }
    if (player.hp <= 0) {
      player.state = 'dead';
      player.animTimer = 0;
      events.push('player_died');
      return;
    }

    if (player.invulnTimer > 0) player.invulnTimer -= dt;
    if (player.attackTimer > 0) player.attackTimer -= dt;
    if (player.potionCooldown > 0) player.potionCooldown -= dt;

    // Trank trinken: Flanke auf input.potion, nur wenn Vorrat da und
    // Herzen fehlen (SPEC_SLICE_1 §2 player.js).
    const potionEdge = !!input.potion && !potionHeld;
    potionHeld = !!input.potion;
    if (potionEdge && player.potionCooldown <= 0 && player.potions > 0 && player.hp < player.maxHp) {
      player.potions -= 1;
      heal(player.stats.potionHeal);
      player.potionCooldown = POTION_COOLDOWN;
      events.push('potion_drunk');
    }

    // Knockback: läuft linear aus, immer durch die Kollision
    if (player.knockTimer > 0) {
      player.knockTimer -= dt;
      const v = player.knockSpeed * Math.max(player.knockTimer, 0) / KNOCK_DURATION;
      moveWithCollision(player, map, player.knockX * v * dt, player.knockY * v * dt);
      player.state = 'hurt';
      return;
    }
    if (player.state === 'hurt') player.state = 'idle';

    const busy = player.attackTimer > ATTACK_TOTAL - ATTACK_BUSY;
    if (busy) {
      player.state = 'attack';
      return;
    }

    if (input.attack && player.attackTimer <= 0) {
      player.attackTimer = ATTACK_TOTAL;
      player.attackId++;
      player.state = 'attack';
      return;
    }

    const dirX = input.dirX;
    const dirY = input.dirY;
    if (dirX !== 0 || dirY !== 0) {
      if (Math.abs(dirX) > Math.abs(dirY)) player.facing = dirX > 0 ? 'right' : 'left';
      else player.facing = dirY > 0 ? 'down' : 'up';
      moveWithCollision(player, map, dirX * player.stats.speed * dt, dirY * player.stats.speed * dt);
      player.state = 'walk';
      player.animTimer += dt;
    } else {
      player.state = 'idle';
      player.animTimer = 0;
    }
  }

  function getSwordHitbox() {
    if (player.attackTimer <= 0) return null;
    const elapsed = ATTACK_TOTAL - player.attackTimer;
    if (elapsed < ATTACK_WINDUP || elapsed >= ATTACK_WINDUP + ATTACK_ACTIVE) return null;
    const reach = player.stats.reach;
    const cx = player.x + player.w / 2;
    const cy = player.y + player.h / 2;
    let hx = cx;
    let hy = cy;
    if (player.facing === 'up') hy -= reach;
    else if (player.facing === 'down') hy += reach;
    else if (player.facing === 'left') hx -= reach;
    else hx += reach;
    return { x: hx - SWORD_SIZE / 2, y: hy - SWORD_SIZE / 2, w: SWORD_SIZE, h: SWORD_SIZE };
  }

  function heal(n) {
    player.hp = Math.min(player.maxHp, player.hp + n);
  }

  // §3: optionaler vierter Parameter knockMult (rueckwaertskompatibel, alle
  // Alt-Aufrufe bleiben unveraendert). Der Boss-Rundumschlag braucht x1,5.
  function hurt(dmg, fromX, fromY, knockMult = 1) {
    // GOD-MODE: EINZIGER Eintrittspunkt fuer Spielerschaden (enemies.js,
    // boss.js Rundumschlag + Sturm rufen alle hierher). false = "nicht
    // getroffen": kein hp-Abzug, kein Knockback, kein hurt-State — damit kann
    // hp nie <= 0 werden und der Tod-/Respawn-/Game-Over-Pfad nie starten.
    if (player.god) return false;
    if (player.invulnTimer > 0 || player.state === 'dead') return false;
    player.hp -= dmg;
    player.invulnTimer = INVULN_TIME;
    player.attackTimer = 0; // Angriff abbrechen
    // STANDFEST daempft (knockTakenMult), der treffende Angriff verstaerkt
    // (knockMult).
    player.knockSpeed = KNOCK_SPEED * player.stats.knockTakenMult * knockMult;
    const cx = player.x + player.w / 2;
    const cy = player.y + player.h / 2;
    let dx = cx - fromX;
    let dy = cy - fromY;
    const len = Math.hypot(dx, dy);
    if (len < 0.001) { dx = 0; dy = 1; } else { dx /= len; dy /= len; }
    player.knockX = dx;
    player.knockY = dy;
    player.knockTimer = KNOCK_DURATION;
    player.state = 'hurt';
    return true;
  }

  function spriteKey() {
    if (player.state === 'dead') {
      return player.animTimer < 0.3 ? 'player_die_0' : 'player_die_1';
    }
    const busy = player.attackTimer > ATTACK_TOTAL - ATTACK_BUSY;
    if (busy || player.state === 'attack') {
      if (player.facing === 'up') return 'player_attack_up';
      if (player.facing === 'down') return 'player_attack_down';
      return player.facing === 'left' ? 'player_attack_side_flip' : 'player_attack_side';
    }
    // 4-Frame-Laufzyklus (Slice 1): _0.._3
    const frame = player.state === 'walk' ? Math.floor(player.animTimer * 10) % 4 : 0;
    if (player.facing === 'up') return `player_up_${frame}`;
    if (player.facing === 'down') return `player_down_${frame}`;
    return player.facing === 'left' ? `player_side_${frame}_flip` : `player_side_${frame}`;
  }

  function draw(ctx, cam, gfx, timeSec) {
    const img = gfx[spriteKey()];
    // Größenagnostisch: horizontal auf die Hitbox zentriert, Füße = Hitbox-
    // Unterkante. Maße aus dem Canvas gelesen (Held jetzt 16×24), kein 16²-
    // Hardcoding — sonst stünde der 24er-Sprite 8 px zu tief.
    ctx.drawImage(
      img,
      Math.round(player.x + (player.w - img.width) / 2 - cam.x),
      Math.round(player.y + player.h - img.height - cam.y)
    );
    const hb = getSwordHitbox();
    if (hb) {
      let key = 'sword_slash_side';
      if (player.facing === 'up') key = 'sword_slash_up';
      else if (player.facing === 'down') key = 'sword_slash_down';
      else if (player.facing === 'left') key = 'sword_slash_side_flip';
      ctx.drawImage(gfx[key], Math.round(hb.x - cam.x), Math.round(hb.y - cam.y));
    }
  }

  return player;
}
