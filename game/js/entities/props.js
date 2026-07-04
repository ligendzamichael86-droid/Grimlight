// Zerschlagbare Props (Vase/Urne) + Schatztruhe. Node-importierbar.
//
// Dokumentierte Abweichung von SPEC_SLICE_1 §2 (Spec-Review-Klärung):
// updateProps bekommt die map-Referenz als Parameter (analog updateEnemies),
// weil jedes Drop-Objekt laut Festlegung 4 (Slice 0) eine map-Referenz
// tragen MUSS — der Streu-Impuls läuft durch moveWithCollision.
// Signatur: updateProps(dt, props, player, map, drops, events)
//
// Props sind nicht solide (bewusster Kompromiss laut Spec).

import { aabbOverlap } from './entity.js';
import { scatterDrop } from './enemies.js';

const BREAK_TIME = 0.25; // Scherben-Animation

// propSpawns: [{x, y, kind, content?}], x/y = Weltpixel, ZENTRUM der AABB
// (Konvention aus maps.js). Vase/Urne 12×12, Truhe 16×14.
// content gilt nur fuer Truhen: 'treasure' (Default, Siegtruhe) | 'boomerang'.
export function createProps(propSpawns) {
  return propSpawns.map((s) => {
    const w = s.kind === 'chest' ? 16 : 12;
    const h = s.kind === 'chest' ? 14 : 12;
    return {
      x: s.x - w / 2,
      y: s.y - h / 2,
      w,
      h,
      kind: s.kind, // 'vase' | 'urn' | 'chest'
      content: s.kind === 'chest' ? (s.content ?? 'treasure') : undefined,
      state: 'idle', // Vase/Urne: 'idle' | 'break'; Truhe nutzt opened
      opened: false,
      breakTimer: 0,
      hitAttackId: -1, // Einmal-Treffer pro Schwertschwung (wie Gegner)
      boomerangHit: false, // vom Bumerang markiert (projectiles.js)
    };
  });
}

function dropAt(p, map, drops, kind) {
  scatterDrop(drops, map, p.x + p.w / 2, p.y + p.h / 2, kind);
}

export function updateProps(dt, props, player, map, drops, events) {
  const swordHb = player.getSwordHitbox ? player.getSwordHitbox() : null;
  for (let i = props.length - 1; i >= 0; i--) {
    const p = props[i];

    if (p.state === 'break') {
      p.breakTimer -= dt;
      if (p.breakTimer <= 0) props.splice(i, 1);
      continue;
    }

    const swordHit = !!(swordHb && p.hitAttackId !== player.attackId && aabbOverlap(swordHb, p));
    if (swordHit) p.hitAttackId = player.attackId;

    // Bumerang-Markierung (Slice 2): wirkt bei Vase/Urne wie ein Schwert-
    // Treffer. Truhen IGNORIEREN das Flag (oeffnen nur per Schwert), das
    // Flag wird aber auch dort geloescht, nie behalten.
    const boomHit = p.boomerangHit === true;
    if (boomHit) p.boomerangHit = false;

    if (p.kind === 'chest') {
      // Truhe: öffnet NUR durch Schwert-Treffer; genau einmal.
      if (!p.opened && swordHit) {
        p.opened = true;
        if (p.content === 'boomerang') {
          // Bumerang-Truhe: Waffe direkt ins Inventar, KEINE Muenzen,
          // KEIN 'chest_opened' (Sieg-Event bleibt exklusiv der Siegtruhe).
          if (player.inv) {
            player.inv.zelda = ['boomerang'];
            player.inv.newFlag = true;
          }
          events.push({ type: 'weapon_found' });
        } else {
          const n = 8 + Math.floor(Math.random() * 5); // 8-12 Münzen
          for (let k = 0; k < n; k++) dropAt(p, map, drops, 'coin');
          events.push('chest_opened');
        }
      }
      continue;
    }

    // Vase/Urne: Schwert-Treffer, Bumerang-Markierung ODER Spieler-Berührung
    if (swordHit || boomHit || (player.state !== 'dead' && aabbOverlap(p, player))) {
      p.state = 'break';
      p.breakTimer = BREAK_TIME;
      const r = Math.random();
      if (r < 0.6) {
        const n = 1 + (Math.random() < 0.5 ? 1 : 0); // 1-2 Münzen
        for (let k = 0; k < n; k++) dropAt(p, map, drops, 'coin');
      } else if (r < 0.85) {
        dropAt(p, map, drops, 'potion'); // 25 %
      }
      // sonst (15 %): nichts
    }
  }
}

// Einzelner Prop (für die Y-Sortierung in main.js einzeln aufrufbar).
export function drawProp(ctx, cam, p, gfx, timeSec) {
  let key;
  if (p.state === 'break') {
    key = p.breakTimer > BREAK_TIME / 2 ? 'prop_break_0' : 'prop_break_1';
  } else if (p.kind === 'chest') {
    key = p.opened ? 'chest_open' : 'chest_closed';
  } else {
    key = p.kind; // 'vase' | 'urn'
  }
  const img = gfx[key];
  // horizontal auf die AABB zentriert, Unterkante bündig
  ctx.drawImage(
    img,
    Math.round(p.x + p.w / 2 - img.width / 2 - cam.x),
    Math.round(p.y + p.h - img.height - cam.y)
  );
}

export function drawProps(ctx, cam, props, gfx, timeSec) {
  for (const p of props) drawProp(ctx, cam, p, gfx, timeSec);
}
