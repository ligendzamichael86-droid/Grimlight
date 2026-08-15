// NPCs (SPEC_SLICE_6 §2.1, Rev 1 §0.2). Friedliche Bewohner von Gramfeld.
// Reines Modul, Node-importierbar (kein window/document auf Modulebene).
//
// WARUM EIN EIGENES ARRAY UND NICHT registerEnemyKind (Landkarte A §1.1,
// enemies.js:172-176): alles, was im enemies-Array liegt, laeuft zwangsweise
// durch updateEnemies — Schwert-Hitbox (enemies.js:457), Kontaktschaden
// (:525-533), XP (:489), spawnDeathDrops (:447), Bumerang (projectiles.js:125).
// Ein NPC dort waere schlagbar, toetbar und lootbar. Deshalb: eigenes Array,
// eigener update, eigener Zeichner.
//
// DIESES MODUL PUSHT KEINE EVENTS (SPEC §0.2, Waechter smoke:5189-5197: jeder
// Ereignistyp aus game/js/entities/** braucht eine hasEvent-Zeile in main.js).
// updateNpcs liefert stattdessen RUECKGABEWERTE ({ nahe, index, abstand }).
//
// SPAWN-KONVENTION (SPEC §2.1 explizit, Beleg maps.js:4-5, enemies.js:30-34):
// npcSpawns tragen das ZENTRUM der AABB in WELTPIXELN. x = spawn.x - w/2.
//
// KOLLISION (Rev 1 §2.1, Weg (a) der Landkarte A §1.3): die Soliditaet der
// STEH-NPCs kommt aus der KARTE (solide Legenden-Kachel unter dem NPC), NICHT
// aus einem Eingriff in player.js:153. Dieses Modul bewegt seine Wanderer
// ausschliesslich ueber moveWithCollision — kein NPC laeuft je in eine solide
// Kachel. Durchdringung Spieler/NPC ist deklariert akzeptiert (SPEC §2.1).

import { moveWithCollision } from './entity.js';

// AABB wie der Spieler (player.js:56-57). Der Sprite ist 16x24 (§0.6) und wird
// groessenagnostisch ueber die Fusskante gesetzt — exakt enemies.js:636-641.
export const NPC_W = 12;
export const NPC_H = 14;

// §0.3 INTERAKTIONS-GEOMETRIE (KONKRET, Review B5): Mitten-Abstand <= 22 px
// UND Blickrichtungs-Skalarprodukt > 0. reach 12 (player.stats) scheitert am
// 15-px-Mindest-Mittenabstand zweier 12x14-AABBs, die sich beruehren.
export const NPC_REDE_ABSTAND = 22;

// §2.1 LEINE: der Wanderer bleibt <= 24 px um seinen Anker (A1-Gate).
export const NPC_LEINE_RADIUS = 24;
// Weicher Umkehrpunkt: ab hier steuert der Wanderer zum Anker zurueck. Die
// harte Leine darunter ist ein zusaetzliches Netz, kein Normalfall.
const NPC_LEINE_WEICH = 18;

const WANDER_SPEED = 14;      // langsamer als jeder Gegner (wanderSpeed 12..30)
const WANDER_MIN = 1.4;       // Sekunden je Richtung
const WANDER_SPANNE = 1.6;
const IDLE_RATE = 1.6;        // Frames/s des 2-Frame-Idle (ruhig, kein Zappeln)

// §2.1 "Wander fuer 2 NPCs, Rest ortsfest". Mile (Botenkind) tritt vor dem
// Marktstand von einem Fuss auf den anderen, der Torwaechter geht sein
// kurzes Stueck am Tor ab. Bran/Hedda/Corm stehen an ihrem Requisit
// (Landkarte B §5.4: "man erkennt den Schmied am Amboss").
export const NPC_WANDERER = ['mile', 'torwaechter'];

// Blickrichtung des Spielers als Einheitsvektor (player.facing, player.js:151).
const BLICK = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

/**
 * @param {Object} spawn { x, y, id } — x/y = AABB-ZENTRUM in Weltpixeln
 * @returns {Object} NPC (plain data, keine Funktionen: wandert nie in ein Save)
 */
export function createNpc(spawn) {
  const id = spawn.id || 'npc';
  const cx = spawn.x;
  const cy = spawn.y;
  return {
    id,
    x: cx - NPC_W / 2,
    y: cy - NPC_H / 2,
    w: NPC_W,
    h: NPC_H,
    // Anker = Spawn-Zentrum. Die Leine misst gegen dieses Zentrum.
    ankerX: cx,
    ankerY: cy,
    wander: NPC_WANDERER.includes(id),
    dirX: 0,
    dirY: 0,
    facingLeft: false,
    wanderTimer: 0,
    // Math.random ist hier ERLAUBT (SPEC A1: wie bei enemies, von den
    // Determinismus-Gates ausgenommen und deklariert). Der Startversatz
    // verhindert, dass alle NPCs im Gleichtakt blinzeln.
    animTimer: Math.random(),
    redet: false,   // main.js setzt true, solange der Dialog laeuft (Sprech-Frame)
    blase: false,   // main.js setzt true bei Quest-Gebern ('!'-Blase)
  };
}

export function createNpcs(spawns) {
  return (spawns || []).map(createNpc);
}

function mitteX(e) { return e.x + e.w / 2; }
function mitteY(e) { return e.y + e.h / 2; }

/**
 * §0.3-Geometrie, PUR und einzeln pruefbar.
 * @returns {boolean} steht der NPC in Rede-Reichweite UND in Blickrichtung?
 */
export function npcAnsprechbar(npc, player) {
  const dx = mitteX(npc) - mitteX(player);
  const dy = mitteY(npc) - mitteY(player);
  const dist = Math.hypot(dx, dy);
  if (dist > NPC_REDE_ABSTAND) return false;
  const b = BLICK[player.facing] || BLICK.down;
  if (dist < 0.001) return true; // exakt uebereinander: Blickrichtung sinnlos
  return (dx / dist) * b.x + (dy / dist) * b.y > 0;
}

export function npcAbstand(npc, player) {
  return Math.hypot(mitteX(npc) - mitteX(player), mitteY(npc) - mitteY(player));
}

/**
 * Bewegt die Wanderer und meldet, welcher NPC ansprechbar ist.
 * PUSHT KEINE EVENTS (§0.2) — der Aufrufer liest die Rueckgabe.
 *
 * @param {number} dt
 * @param {Array}  npcs
 * @param {Object} player
 * @param {Object} map    Tilemap (rectCollides)
 * @param {boolean} eingefroren true = nur Animation, keine Bewegung (Dialog)
 * @returns {{nahe: Object|null, index: number, abstand: number}}
 */
export function updateNpcs(dt, npcs, player, map, eingefroren = false) {
  let nahe = null;
  let index = -1;
  let bester = Infinity;
  for (let i = 0; i < npcs.length; i++) {
    const n = npcs[i];
    n.animTimer += dt;

    if (n.wander && !eingefroren) {
      n.wanderTimer -= dt;
      const ax = mitteX(n) - n.ankerX;
      const ay = mitteY(n) - n.ankerY;
      const weit = Math.hypot(ax, ay);
      if (weit > NPC_LEINE_WEICH) {
        // Weicher Umkehrpunkt: zurueck zum Anker steuern.
        n.dirX = -ax / (weit || 1);
        n.dirY = -ay / (weit || 1);
        n.wanderTimer = WANDER_MIN;
      } else if (n.wanderTimer <= 0) {
        n.wanderTimer = WANDER_MIN + Math.random() * WANDER_SPANNE;
        const a = Math.random() * Math.PI * 2;
        n.dirX = Math.cos(a);
        n.dirY = Math.sin(a);
      }
      if (n.dirX !== 0) n.facingLeft = n.dirX < 0;
      const vorherX = n.x;
      const vorherY = n.y;
      moveWithCollision(n, map, n.dirX * WANDER_SPEED * dt, n.dirY * WANDER_SPEED * dt);
      // HARTE LEINE: der Schritt wird verworfen, wenn er den 24-px-Radius
      // reissen wuerde. Die vorige Position war gueltig (nie solide), das
      // Zuruecksetzen kann also nichts kaputt machen. Damit ist
      // "<= 24 px um den Anker" eine ZUSICHERUNG, keine Tendenz.
      if (Math.hypot(mitteX(n) - n.ankerX, mitteY(n) - n.ankerY) > NPC_LEINE_RADIUS) {
        n.x = vorherX;
        n.y = vorherY;
        n.wanderTimer = 0;
      }
    }

    if (npcAnsprechbar(n, player)) {
      const d = npcAbstand(n, player);
      if (d < bester) {
        bester = d;
        nahe = n;
        index = i;
      }
    }
  }
  return { nahe, index, abstand: nahe ? bester : Infinity };
}

// Sprite-Schluessel: npc_<id>_0 / npc_<id>_1 (2-Frame-Idle) und npc_<id>_talk
// (Sprech-Frame). Flip-Varianten werden genutzt, WENN es sie gibt — die
// Art-Planung (Landkarte §1.2 F) sieht 2 Idle + 1 Sprech je NPC vor, ohne
// Flips; das Modul kommt mit beidem zurecht.
export function npcSpriteKey(n, timeSec) {
  void timeSec;
  if (n.redet) return `npc_${n.id}_talk`;
  const frame = Math.floor(n.animTimer * IDLE_RATE) % 2;
  return `npc_${n.id}_${frame}`;
}

/**
 * Einzelner NPC. Wird von main.js ueber die pushTinted-FASSADE gezeichnet
 * (main.js:2361-2366) — genau wie drawEnemy: Y-Sortierung, Kontaktschatten
 * und Warm/Kalt-Toenung kommen dadurch gratis.
 *
 * KEIN ctx.translate, KEIN measureText, KEIN strokeRect (§0.4) — nur
 * drawImage auf ganzzahlige Positionen, exakt enemies.js:636-641.
 *
 * @returns {boolean} false, wenn kein Sprite vorliegt (Art noch nicht da)
 */
export function drawNpc(ctx, cam, n, gfx, timeSec) {
  const key = npcSpriteKey(n, timeSec);
  let img = gfx[key];
  if (!img && n.facingLeft) img = gfx[`${key}_flip`];
  if (!img) img = gfx[`npc_${n.id}_0`];
  // Fehlt die Art noch, wird NICHT gezeichnet (drawImage(undefined) wuerde
  // werfen und den ganzen Frame reissen).
  if (!img) return false;
  if (n.facingLeft && gfx[`${key}_flip`]) img = gfx[`${key}_flip`];
  ctx.drawImage(
    img,
    Math.round(n.x + n.w / 2 - img.width / 2 - cam.x),
    Math.round(n.y + n.h - img.height - cam.y)
  );
  // '!'-Blase ueber Quest-Gebern (Rev 1 §2.2). Zeichen-Sprite, kein fillText:
  // '8px monospace' ist plattformabhaengig und jeder fillText-Zug ist eine
  // potenzielle Test-Sonde (Muster hud.js:537-543 Pause-Knopf).
  if (n.blase) {
    const b = gfx.npc_blase;
    if (b) {
      const hebung = Math.floor(timeSec * 3) % 2; // 1 px Atmen
      ctx.drawImage(
        b,
        Math.round(n.x + n.w / 2 - b.width / 2 - cam.x),
        Math.round(n.y + n.h - img.height - b.height - 1 - cam.y) - hebung
      );
    }
  }
  return true;
}

export function drawNpcs(ctx, cam, npcs, gfx, timeSec) {
  for (const n of npcs) drawNpc(ctx, cam, n, gfx, timeSec);
}
