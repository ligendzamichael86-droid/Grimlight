// Headless-Smoke-Test Slice 0 + 1 + 2: importiert NUR Module ohne Browser-
// Bezug auf Modulebene (world/entities/art/core/ui/items). Aufrufbar aus
// jedem CWD via node tools/smoke_test.mjs, Exit 0 = grün.

import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { PALETTE } from '../game/js/art/palette.js';
import { SPRITES, TILE_ART } from '../game/js/art/sprites.js';
import { createTilemap, variantIndex } from '../game/js/world/tilemap.js';
// Slice 3: boss.js EINMAL zentral importieren — registriert kind 'graveward'
// im Verhaltens-Dispatch (import-reihenfolgeabhaengig, §4).
import { createGraveward } from '../game/js/entities/boss.js';
import { GRAVEYARD, CATACOMBS, MAPS, portalBlocked } from '../game/js/world/maps.js';
const { FLUESTERGRUFT, BOSS_KAMMER } = MAPS;
import { aabbOverlap, moveWithCollision, getEvent } from '../game/js/entities/entity.js';
import { createPlayer } from '../game/js/entities/player.js';
import { createSkeleton, createGhoul, createHound, createRust, createEnemy, updateEnemies, updateDrops } from '../game/js/entities/enemies.js';
import { createProps, updateProps } from '../game/js/entities/props.js';
import { createProjectiles } from '../game/js/entities/projectiles.js';
import { rollItem, createInventory, addItem, equipItem, computeStats, AFFIXES } from '../game/js/items/items.js';
import { createProgress, grantXp, applyProgress, XP_THRESHOLDS, LEVEL_CAP } from '../game/js/items/progression.js';
import { createInventoryUI } from '../game/js/ui/inventory_ui.js';
import { createLighting } from '../game/js/core/lighting.js';
import { createParticles } from '../game/js/core/particles.js';
import { drawFog } from '../game/js/ui/hud.js';

const DT = 1 / 60;
const failures = [];
let totalTicks = 0;

function check(name, cond, detail = '') {
  if (cond) {
    console.log(`  ok  ${name}`);
  } else {
    failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
    console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function makeInput() {
  return { dirX: 0, dirY: 0, attack: false, potion: false, confirm: false };
}

function makeWorld({ mapDef = GRAVEYARD, skeletonSpawns = [], ghoulSpawns = [], propSpawns = [] } = {}) {
  const map = createTilemap(mapDef.rows, mapDef.legend);
  const player = createPlayer(mapDef.playerSpawn);
  const enemies = [...skeletonSpawns.map(createSkeleton), ...ghoulSpawns.map(createGhoul)];
  const props = createProps(propSpawns);
  return { map, player, enemies, props, drops: [], events: [], input: makeInput() };
}

// Ein Tick (Update-Reihenfolge wie main.js) + Invarianten: keine Entity und
// kein Drop endet in einem soliden Tile.
function tick(w) {
  w.player.update(DT, w.input, w.map, w.enemies, w.events);
  updateEnemies(DT, w.enemies, w.player, w.map, w.drops, w.events);
  updateProps(DT, w.props, w.player, w.map, w.drops, w.events);
  updateDrops(DT, w.drops, w.player, w.events);
  totalTicks++;
  if (w.map.rectCollides(w.player)) failures.push(`Invariante: Spieler in solidem Tile bei (${w.player.x},${w.player.y})`);
  for (const e of w.enemies) {
    if (w.map.rectCollides(e)) failures.push(`Invariante: Gegner (${e.kind}) in solidem Tile bei (${e.x},${e.y})`);
  }
  for (const d of w.drops) {
    if (w.map.rectCollides(d)) failures.push(`Invariante: Drop in solidem Tile bei (${d.x},${d.y})`);
  }
}

function ticks(w, n) {
  for (let i = 0; i < n; i++) tick(w);
}

// --- 1. Art: alle Sprites referenzieren nur existierende Palettenfarben ---
{
  let bad = null;
  for (const [setName, set] of [['SPRITES', SPRITES], ['TILE_ART', TILE_ART]]) {
    for (const [name, grid] of Object.entries(set)) {
      for (const row of grid) {
        for (const ch of row) {
          if (ch !== '.' && !PALETTE[ch]) bad = `${setName}.${name}: '${ch}'`;
        }
      }
    }
  }
  check('Sprites nutzen nur existierende Palettenfarben', bad === null, bad || '');
}

// --- 2. Beide Maps: Legende, Ränder, Spawns, Portale (Slice 1) ---
for (const [name, def] of Object.entries(MAPS)) {
  let badCh = null;
  for (const row of def.rows) {
    for (const ch of row) if (!def.legend[ch]) badCh = ch;
  }
  check(`${name}: Legende deckt alle Zeichen ab`, badCh === null, badCh ? `'${badCh}'` : '');

  let m = null;
  let threw = null;
  try { m = createTilemap(def.rows, def.legend); } catch (e) { threw = e.message; }
  check(`${name}: createTilemap baut ohne Fehler`, threw === null, threw || '');
  if (!m) continue;

  let openBorder = null;
  for (let tx = 0; tx < m.wTiles; tx++) {
    if (!m.isSolidAt(tx * 16 + 8, 8)) openBorder = `(${tx},0)`;
    if (!m.isSolidAt(tx * 16 + 8, m.hPx - 8)) openBorder = `(${tx},${m.hTiles - 1})`;
  }
  for (let ty = 0; ty < m.hTiles; ty++) {
    if (!m.isSolidAt(8, ty * 16 + 8)) openBorder = `(0,${ty})`;
    if (!m.isSolidAt(m.wPx - 8, ty * 16 + 8)) openBorder = `(${m.wTiles - 1},${ty})`;
  }
  check(`${name}: Rand komplett solide`, openBorder === null, openBorder || '');

  const box = (s, w, h) => ({ x: s.x - w / 2, y: s.y - h / 2, w, h });
  check(`${name}: Spieler-Spawn frei`, !m.rectCollides(box(def.playerSpawn, 12, 14)));
  const badSkel = def.skeletonSpawns.findIndex((s) => m.rectCollides(box(s, 12, 14)));
  check(`${name}: alle ${def.skeletonSpawns.length} Skelett-Spawns frei`, badSkel === -1,
    badSkel >= 0 ? `Spawn ${badSkel} solide` : '');
  const badGhoul = def.ghoulSpawns.findIndex((s) => m.rectCollides(box(s, 14, 14)));
  check(`${name}: alle ${def.ghoulSpawns.length} Ghul-Spawns frei`, badGhoul === -1,
    badGhoul >= 0 ? `Spawn ${badGhoul} solide` : '');
  const badProp = def.propSpawns.findIndex((s) =>
    m.rectCollides(box(s, s.kind === 'chest' ? 16 : 12, s.kind === 'chest' ? 14 : 12)));
  check(`${name}: alle ${def.propSpawns.length} Prop-Spawns frei`, badProp === -1,
    badProp >= 0 ? `Spawn ${badProp} solide` : '');
  // Slice 2: enemySpawns begehbar und kind gültig (createEnemy wirft bei
  // unbekanntem kind, die echte AABB kommt aus dem Erzeuger).
  const badEnemy = (() => {
    const spawns = def.enemySpawns || [];
    for (let i = 0; i < spawns.length; i++) {
      try {
        const e = createEnemy(spawns[i]);
        if (m.rectCollides(e)) return `Spawn ${i} solide`;
      } catch { return `Spawn ${i}: kind '${spawns[i].kind}' ungültig`; }
    }
    return null;
  })();
  check(`${name}: alle ${(def.enemySpawns || []).length} enemySpawns begehbar mit gültigem kind`,
    badEnemy === null, badEnemy || '');

  for (const portal of def.portals) {
    check(`${name}: Portal-target '${portal.target}' existiert in MAPS`, !!MAPS[portal.target]);
    if (!MAPS[portal.target]) continue;
    const targetDef = MAPS[portal.target];
    const tm = createTilemap(targetDef.rows, targetDef.legend);
    const sb = box(portal.spawn, 12, 14);
    check(`${name}→${portal.target}: Portal-Ziel-Spawn begehbar`, !tm.rectCollides(sb));
    const inPortal = targetDef.portals.some((p2) => aabbOverlap(sb, p2));
    check(`${name}→${portal.target}: Ziel-Spawn liegt NICHT im Gegenportal`, !inPortal);
  }
}

// GRAVEYARD-Erwartungen aus der Spec bleiben fixiert (Slice-0-Regression)
check('GRAVEYARD hat weiterhin 6 Skelette', GRAVEYARD.skeletonSpawns.length === 6);
// Slice 3 (erlaubte Alt-Test-Aenderung #1): die Katakomben-Siegtruhe wurde zur
// Gold-Truhe umgewidmet (der Sieg zieht hinter den Boss). Jetzt genau 1 'gold'
// + 1 'boomerang', KEINE 'treasure' mehr (die existiert nur noch dynamisch/
// bossDead-statisch in der BOSS_KAMMER).
check("CATACOMBS: genau 1 'gold' + 1 'boomerang', KEINE 'treasure'",
  CATACOMBS.propSpawns.filter((p) => p.kind === 'chest' && p.content === 'gold').length === 1
  && CATACOMBS.propSpawns.filter((p) => p.kind === 'chest' && p.content === 'boomerang').length === 1
  && CATACOMBS.propSpawns.filter((p) => p.kind === 'chest' && (p.content ?? 'treasure') === 'treasure').length === 0);

// --- 3. Spieler bewegt sich ---
{
  const w = makeWorld();
  const x0 = w.player.x;
  w.input.dirX = 1;
  ticks(w, 60);
  check('Spieler bewegt sich (1 s nach rechts ≈ 90 px)', w.player.x > x0 + 80,
    `x0=${x0} x=${w.player.x}`);
}

// --- 4. Wand stoppt Spieler (Snap exakt an Tile-Kante) ---
{
  const w = makeWorld();
  w.input.dirX = -1;
  ticks(w, 150);
  check('Wand stoppt Spieler, Position exakt an Wandkante (x=16)', w.player.x === 16,
    `x=${w.player.x}`);
}

// --- 5. Schwert tötet Skelett in genau 2 Treffern ---
let fightWorld = null;
{
  const s = GRAVEYARD.playerSpawn;
  const w = makeWorld({ skeletonSpawns: [{ x: s.x + 20, y: s.y }] });
  w.input.dirX = 1;
  tick(w); // Blickrichtung rechts setzen
  w.input.dirX = 0;
  w.input.attack = true;
  const skel = w.enemies[0];
  const hits = [];
  let prevHp = skel.hp;
  for (let i = 0; i < 600 && w.enemies.length > 0; i++) {
    tick(w);
    if (skel.hp < prevHp) { hits.push(i); prevHp = skel.hp; }
  }
  check('Skelett stirbt durch Schwert', w.events.includes('enemy_died') && w.enemies.length === 0);
  check('Genau 2 Treffer nötig (kein Mehrfachschaden pro Schwung)', hits.length === 2,
    `Treffer bei Ticks [${hits}]`);
  check('Treffer stammen aus getrennten Schwüngen (Abstand ≥ 0,2 s)',
    hits.length === 2 && hits[1] - hits[0] >= 12, `Abstand ${hits[1] - hits[0]} Ticks`);
  w.input.attack = false;
  ticks(w, 30); // Streu-Impuls der Münzen auslaufen lassen
  // Münzen können schon während des Kampfs eingesammelt worden sein (Radius 12)
  const totalCoins = w.drops.length + w.player.gold;
  check('Toter Gegner hinterlässt 1-3 Münzen', totalCoins >= 1 && totalCoins <= 3,
    `münzen=${totalCoins}`);
  const badDrop = w.drops.findIndex((d) => w.map.rectCollides(d));
  check('Münzen liegen auf begehbaren Tiles (Streuung kollidiert)', badDrop === -1);
  const badKind = w.drops.find((d) => d.kind !== 'coin');
  check("Skelett-Drops haben kind 'coin'", badKind === undefined, badKind ? `${badKind.kind}` : '');
  fightWorld = w;
  fightWorld.totalCoins = totalCoins;
}

// --- 6. Münz-Drop wird eingesammelt, Gold steigt ---
{
  const w = fightWorld;
  check('Spieler hat den Kampf überlebt', w.player.hp > 0, `hp=${w.player.hp}`);
  for (let i = 0; i < 600 && w.drops.length > 0; i++) {
    const d = w.drops[0];
    const dx = d.x + d.w / 2 - (w.player.x + w.player.w / 2);
    const dy = d.y + d.h / 2 - (w.player.y + w.player.h / 2);
    const len = Math.hypot(dx, dy) || 1;
    w.input.dirX = dx / len;
    w.input.dirY = dy / len;
    tick(w);
  }
  check('Alle Münzen eingesammelt, Gold steigt entsprechend',
    w.drops.length === 0 && w.player.gold === w.totalCoins && w.events.includes('gold_pickup'),
    `drops=${w.drops.length} gold=${w.player.gold} erwartet=${w.totalCoins}`);
}

// --- 7. Skelett verfolgt und verletzt Spieler (1 Schaden!); Game Over ---
{
  const s = GRAVEYARD.playerSpawn;
  const w = makeWorld({ skeletonSpawns: [{ x: s.x + 60, y: s.y }] });
  const skel = w.enemies[0];
  const dist0 = Math.abs(skel.x - w.player.x);
  ticks(w, 30);
  check('Skelett verfolgt Spieler (Distanz sinkt)', Math.abs(skel.x - w.player.x) < dist0,
    `vorher=${dist0} nachher=${Math.abs(skel.x - w.player.x)}`);
  let firstHit = -1;
  for (let i = 0; i < 300 && firstHit < 0; i++) {
    tick(w);
    if (w.player.hp < w.player.maxHp) firstHit = i;
  }
  check('Skelett-Kontakt macht weiterhin GENAU 1 Schaden (Regression)',
    firstHit >= 0 && w.player.hp === 5, `hp=${w.player.hp}`);
  check('Spieler ist nach Treffer unverwundbar', w.player.invulnTimer > 0);
  const hpAfterHit = w.player.hp;
  ticks(w, 50); // < 1 s Unverwundbarkeit bei Dauerkontakt
  check('Unverwundbarkeit verhindert Doppelschaden (0,83 s Dauerkontakt)',
    w.player.hp === hpAfterHit, `hp=${w.player.hp}`);
  let died = false;
  for (let i = 0; i < 900 && !died; i++) {
    tick(w);
    died = w.events.includes('player_died');
  }
  check("Spieler stirbt an Dauerkontakt, Event 'player_died'", died && w.player.state === 'dead',
    `hp=${w.player.hp} state=${w.player.state}`);
}

// --- 8. Basisfunktionen entity.js ---
{
  check('aabbOverlap: Überlappung erkannt',
    aabbOverlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 5, y: 5, w: 10, h: 10 }));
  check('aabbOverlap: reine Kantenberührung zählt nicht',
    !aabbOverlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 10, y: 0, w: 10, h: 10 }));
  const map = createTilemap(GRAVEYARD.rows, GRAVEYARD.legend);
  const ent = { x: 20, y: 194, w: 12, h: 14 };
  const hit = moveWithCollision(ent, map, -100, 0);
  check('moveWithCollision meldet Wandtreffer und snappt', hit.x === true && ent.x === 16,
    `x=${ent.x}`);
}

// --- 9. Vase zerbricht durch Schwert-Treffer (Slice 1) ---
{
  const s = GRAVEYARD.playerSpawn;
  const w = makeWorld({ propSpawns: [{ x: s.x + 20, y: s.y, kind: 'vase' }] });
  w.input.dirX = 1;
  tick(w); // Blickrichtung rechts
  w.input.dirX = 0;
  w.input.attack = true;
  let broke = -1;
  for (let i = 0; i < 120 && broke < 0; i++) {
    tick(w);
    if (w.props.length === 0 || w.props[0].state === 'break') broke = i;
  }
  w.input.attack = false;
  check('Vase zerbricht durch Schwert-Treffer', broke >= 0);
  ticks(w, 20); // Scherben-Animation (0,25 s) auslaufen lassen
  check('Vase nach Scherben-Animation entfernt', w.props.length === 0, `props=${w.props.length}`);
  const badKind = w.drops.find((d) => d.kind !== 'coin' && d.kind !== 'potion');
  check("Vasen-Drop-Kinds nur 'coin'/'potion'", badKind === undefined, badKind ? `${badKind.kind}` : '');
  const noMap = w.drops.find((d) => !d.map || typeof d.map.rectCollides !== 'function');
  check('Vasen-Drops tragen map-Referenz (Festlegung 4)', noMap === undefined);
}

// --- 10. Urne zerbricht durch Berührung ---
{
  const s = GRAVEYARD.playerSpawn;
  const w = makeWorld({ propSpawns: [{ x: s.x + 30, y: s.y, kind: 'urn' }] });
  const urn = w.props[0];
  w.input.dirX = 1;
  let broke = -1;
  for (let i = 0; i < 60 && broke < 0; i++) {
    tick(w);
    if (urn.state === 'break') broke = i;
  }
  check('Urne zerbricht durch Spieler-Berührung (ohne Schwert)', broke >= 0);
}

// --- 11. Truhe: nur Schwert öffnet, genau einmal, 8-12 Münzen ---
{
  const s = GRAVEYARD.playerSpawn;
  const w = makeWorld({ propSpawns: [{ x: s.x + 22, y: s.y, kind: 'chest' }] });
  const chest = w.props[0];
  w.input.dirX = 1;
  ticks(w, 10); // in die Truhe hineinlaufen (Props nicht solide)
  w.input.dirX = 0;
  check('Truhe öffnet NICHT durch Berührung', !chest.opened && w.props.includes(chest));
  const gold0 = w.player.gold;
  w.input.attack = true;
  let opened = -1;
  for (let i = 0; i < 180 && opened < 0; i++) {
    tick(w);
    if (chest.opened) opened = i;
  }
  check('Truhe öffnet durch Schwert-Treffer', opened >= 0);
  ticks(w, 240); // weiter draufschlagen: mehrere weitere Schwünge
  w.input.attack = false;
  const openEvents = w.events.filter((e) => e === 'chest_opened').length;
  check("'chest_opened' wird genau EINMAL gepusht", openEvents === 1, `${openEvents}×`);
  check('Truhe bleibt offen bestehen (kein Despawn)', w.props.includes(chest) && chest.opened);
  ticks(w, 30);
  const coins = w.drops.filter((d) => d.kind === 'coin').length + (w.player.gold - gold0);
  check('Truhe wirft 8-12 Münzen mit Streu-Impuls', coins >= 8 && coins <= 12, `münzen=${coins}`);
  const noMap = w.drops.find((d) => !d.map || typeof d.map.rectCollides !== 'function');
  check('Truhen-Drops tragen map-Referenz (Festlegung 4)', noMap === undefined);
  const badDrop = w.drops.findIndex((d) => w.map.rectCollides(d));
  check('Truhen-Münzen liegen auf begehbaren Tiles', badDrop === -1);
}

// --- 12. Tränke: Pickup (max 3, Überlauf +2 Gold), Trinken ---
{
  const w = makeWorld();
  const p = w.player;
  const dropPotion = () => w.drops.push({
    x: p.x, y: p.y, w: 8, h: 8, vx: 0, vy: 0, age: 1, kind: 'potion', map: w.map,
  });
  check('Start: 0 Tränke, max 3', p.potions === 0 && p.maxPotions === 3);
  for (let i = 0; i < 3; i++) { dropPotion(); tick(w); }
  check("Pickup erhöht potions bis max 3 (Event 'potion_pickup')",
    p.potions === 3 && w.events.filter((e) => e === 'potion_pickup').length === 3,
    `potions=${p.potions}`);
  const gold0 = p.gold;
  dropPotion();
  tick(w);
  check("Überlauf bei vollen Taschen: +2 Gold, Event 'potion_full_gold'",
    p.potions === 3 && p.gold === gold0 + 2 && w.events.includes('potion_full_gold'),
    `potions=${p.potions} gold=${p.gold}`);
  p.hp = 3;
  w.input.potion = true;
  tick(w);
  check("Trinken heilt 2 HP, verbraucht 1 Trank, Event 'potion_drunk'",
    p.hp === 5 && p.potions === 2 && w.events.includes('potion_drunk'),
    `hp=${p.hp} potions=${p.potions}`);
  ticks(w, 30); // Taste gehalten (Pegel): darf NICHT erneut trinken
  check('Gehaltene Taste trinkt nicht erneut (Flankenerkennung)',
    p.hp === 5 && p.potions === 2, `hp=${p.hp} potions=${p.potions}`);
  w.input.potion = false;
  ticks(w, 5);
  w.input.potion = true;
  tick(w);
  check('Heilung überschreitet maxHp nicht (5+2 → 6)', p.hp === 6 && p.potions === 1,
    `hp=${p.hp} potions=${p.potions}`);
  w.input.potion = false;
  ticks(w, 30);
  w.input.potion = true;
  tick(w);
  check('Volle Herzen: Trank wird nicht verbraucht', p.hp === 6 && p.potions === 1,
    `hp=${p.hp} potions=${p.potions}`);
  w.input.potion = false;
  ticks(w, 5);
  p.potions = 0;
  p.hp = 2;
  w.input.potion = true;
  tick(w);
  check('0 Tränke: Trinken ohne Vorrat unmöglich', p.hp === 2 && p.potions === 0,
    `hp=${p.hp} potions=${p.potions}`);
  w.input.potion = false;
}

// --- 13. Ghul: 4 Treffer aus 4 getrennten Schwüngen, Drops ---
{
  const s = GRAVEYARD.playerSpawn;
  const w = makeWorld({ ghoulSpawns: [{ x: s.x + 20, y: s.y }] });
  w.input.dirX = 1;
  tick(w);
  w.input.dirX = 0;
  w.input.attack = true;
  const gh = w.enemies[0];
  const hits = [];
  let prevHp = gh.hp;
  for (let i = 0; i < 900 && w.enemies.length > 0; i++) {
    w.player.invulnTimer = 5; // Testfokus: Ghul-HP, nicht Spieler-Schaden
    tick(w);
    if (w.enemies.length > 0 && gh.hp < prevHp) { hits.push(i); prevHp = gh.hp; }
  }
  w.input.attack = false;
  check('Ghul stirbt nach genau 4 Treffern', w.enemies.length === 0 && hits.length === 4,
    `Treffer bei Ticks [${hits}]`);
  let separated = hits.length === 4;
  for (let i = 1; i < hits.length; i++) if (hits[i] - hits[i - 1] < 12) separated = false;
  check('Ghul-Treffer stammen aus getrennten Schwüngen', separated, `[${hits}]`);
  ticks(w, 30);
  const badKind = w.drops.find((d) => d.kind !== 'coin' && d.kind !== 'potion');
  check("Ghul-Drop-Kinds nur 'coin'/'potion'", badKind === undefined, badKind ? `${badKind.kind}` : '');
  const noMap = w.drops.find((d) => !d.map || typeof d.map.rectCollides !== 'function');
  check('Ghul-Drops tragen map-Referenz (Festlegung 4)', noMap === undefined);
}

// --- 14. Ghul: Kontaktschaden 2 ---
{
  const s = GRAVEYARD.playerSpawn;
  const w = makeWorld({ ghoulSpawns: [{ x: s.x + 40, y: s.y }] });
  let firstHit = -1;
  for (let i = 0; i < 300 && firstHit < 0; i++) {
    tick(w);
    if (w.player.hp < w.player.maxHp) firstHit = i;
  }
  check('Ghul-Kontakt macht 2 Schaden', firstHit >= 0 && w.player.hp === 4, `hp=${w.player.hp}`);
}

// --- 15. Ghul-Knockback = 50 % des Skelett-Knockbacks ---
{
  const w = makeWorld();
  const skel = createSkeleton({ x: 320, y: 200 });
  const gh = createGhoul({ x: 352, y: 200 });
  w.enemies.push(skel, gh);
  for (const e of [skel, gh]) { e.knockTimer = 0.15; e.knockX = 1; e.knockY = 0; }
  const sx0 = skel.x;
  const gx0 = gh.x;
  ticks(w, 8); // Knockback läuft noch (9 Ticks = 0,15 s) → keine AI-Bewegung dabei
  const sd = skel.x - sx0;
  const gd = gh.x - gx0;
  check('Skelett-Knockback unverändert in voller Stärke (Regression)', sd > 8,
    `distanz=${sd.toFixed(2)}`);
  check('Ghul-Knockback wirkt nur 50 %', sd > 0 && Math.abs(gd - sd / 2) < 0.5,
    `skelett=${sd.toFixed(2)} ghul=${gd.toFixed(2)}`);
}

// --- 16. Neue Sprite-/Tile-Schlüssel, 4-Frame-Zyklen, Flip-Quellen ---
{
  const newSprites = [
    'player_down_2', 'player_down_3', 'player_up_2', 'player_up_3',
    'player_side_2', 'player_side_3', 'player_die_0', 'player_die_1',
    'ghoul_0', 'ghoul_1', 'ghoul_die', 'vase', 'urn',
    'prop_break_0', 'prop_break_1', 'chest_closed', 'chest_open',
    'potion', 'fog_blob',
  ];
  const missing = newSprites.filter((k) => !SPRITES[k]);
  check('Alle neuen SPRITES-Schlüssel existieren', missing.length === 0, missing.join(','));
  const newTiles = [
    'gravestone_2', 'gravestone_3', 'bush_dead', 'bones', 'skull', 'fence',
    'crypt_stairs_down', 'stairs_up', 'stone_floor', 'stone_floor_cracked',
    'brick_wall', 'pillar', 'rubble', 'sarcophagus', 'torch_wall_0', 'torch_wall_1',
  ];
  const missingT = newTiles.filter((k) => !TILE_ART[k]);
  check('Alle neuen TILE_ART-Schlüssel existieren', missingT.length === 0, missingT.join(','));
  // Grafikpass 2 (§3.1): neue Pflicht-Keys (2x2-Kronen, Boden-/Wand-Varianten,
  // Wasser-Frames). Werden vom Art-Builder parallel geliefert.
  const gfx2Tiles = [
    'tree_canopy_2x2_a', 'tree_canopy_2x2_b', 'tree_canopy_2x2_c',
    'grass_dark_v1', 'grass_dark_v2', 'path_v1', 'wall_v1',
    'stone_floor_v1', 'stone_floor_v2', 'brick_wall_v1', 'brick_wall_v2',
    'water_1', 'water_2',
    // Grafikpass 2 Runde 2 (§8a.3/4/6): Ufer-Kacheln, Kronen-Schlagschatten,
    // zwei weitere Weg-Varianten, vierte Gras-Variante.
    'shore_n', 'shore_e', 'shore_s', 'shore_w',
    'shore_ne', 'shore_nw', 'shore_se', 'shore_sw',
    'canopy_shadow', 'path_v2', 'path_v3', 'grass_dark_v3',
    // Grafikpass 2 Runde 3 (§8b.1/3/7): Wasser-Tiefen-Overlays + vierte
    // Katakomben-Varianten. Werden vom Art-Fixer parallel geliefert.
    'water_shallow', 'water_mid', 'brick_wall_v3', 'stone_floor_v3',
  ];
  const missingG2 = gfx2Tiles.filter((k) => !TILE_ART[k]);
  check('Alle Grafikpass-2-TILE_ART-Schlüssel existieren', missingG2.length === 0, missingG2.join(','));
  // Grafikpass 3 §5.2.1 (additiv): neue Pflicht-Keys. Werden vom Art-Builder
  // parallel geliefert; bis dahin dürfen diese Existenz-Checks ROT sein.
  const gfx3Tiles = [
    'water_3',                                         // 4. Wasser-Frame (§2.2)
    'wet_n', 'wet_e', 'wet_s', 'wet_w',                // Nassrand am Gruft-Kanal (§2.1/§3.1)
    'tree_canopy_2x2_am', 'tree_canopy_2x2_bm', 'tree_canopy_2x2_cm', // gespiegelte Kronen (§3.2)
    'grass_tuft', 'pebble_small', 'dirt_patch',        // Gras-Deko (§3.3)
    'stone_floor_cracked_v1', 'stone_floor_cracked_v2', // Riss-Varianten (§3.3)
  ];
  const missingG3 = gfx3Tiles.filter((k) => !TILE_ART[k]);
  check('Alle Grafikpass-3-TILE_ART-Schlüssel existieren', missingG3.length === 0, missingG3.join(','));
  let cyc = null;
  for (const dir of ['down', 'up', 'side']) {
    for (let f = 0; f < 4; f++) if (!SPRITES[`player_${dir}_${f}`]) cyc = `player_${dir}_${f}`;
  }
  check('4-Frame-Laufzyklen vollständig (_0.._3 je Richtung)', cyc === null, cyc || '');
  // Flip-Liste aus main.js: für jeden Key muss das Quell-Grid existieren,
  // sonst drawImage(undefined) im Browser.
  const flipBases = [
    'player_side_0', 'player_side_1', 'player_side_2', 'player_side_3',
    'player_attack_side', 'sword_slash_side',
    'skeleton_0', 'skeleton_1', 'skeleton_die',
    'ghoul_0', 'ghoul_1', 'ghoul_die',
  ];
  const missingF = flipBases.filter((k) => !SPRITES[k]);
  check('Alle Flip-Quell-Grids der main.js-Liste existieren', missingF.length === 0, missingF.join(','));
  // Alle über Legenden erreichbaren Tile-Arts (inkl. anim-Frames) existieren
  let missingArt = null;
  for (const def of Object.values(MAPS)) {
    for (const cell of Object.values(def.legend)) {
      if (!TILE_ART[cell.art]) missingArt = cell.art;
      for (const a of cell.anim || []) if (!TILE_ART[a]) missingArt = a;
    }
  }
  check('Alle Legenden-Tile-Arts (inkl. anim) existieren', missingArt === null, missingArt || '');
}

// --- 17. createLighting/drawFog in Node importierbar ---
{
  const l = createLighting(320, 180);
  check('createLighting liefert draw-Funktion (ohne Browser-Zugriff)',
    !!l && typeof l.draw === 'function');
  check('drawFog ist ohne Browser importierbar', typeof drawFog === 'function');
}

// --- 18. findTiles: Fackel-Extraktion für beide Maps ---
{
  for (const [name, def] of Object.entries(MAPS)) {
    const m = createTilemap(def.rows, def.legend);
    const torches = def.torchChars.flatMap((ch) => m.findTiles(ch));
    const bad = torches.find((t) => t.x !== t.tx * 16 + 8 || t.y !== t.ty * 16 + 8);
    check(`${name}: findTiles liefert Fackeln (${torches.length}) mit Tile-Zentren`,
      torches.length > 0 && bad === undefined);
  }
}

// --- 19. Integrations-Soak Friedhof (Slice-0-Regression) ---
{
  const w = makeWorld({
    skeletonSpawns: GRAVEYARD.skeletonSpawns,
    propSpawns: GRAVEYARD.propSpawns,
  });
  w.input.dirX = 0.7;
  w.input.dirY = -0.7;
  w.input.attack = true;
  const before = failures.length;
  ticks(w, 600);
  check('600-Tick-Soak Friedhof ohne Invarianten-Verletzung', failures.length === before);
}

// --- 20. Integrations-Soak Katakomben (Skelette+Ghule+Props) ---
{
  const w = makeWorld({
    mapDef: CATACOMBS,
    skeletonSpawns: CATACOMBS.skeletonSpawns,
    ghoulSpawns: CATACOMBS.ghoulSpawns,
    propSpawns: CATACOMBS.propSpawns,
  });
  w.input.dirX = 0.7;
  w.input.dirY = 0.7;
  w.input.attack = true;
  const before = failures.length;
  ticks(w, 600);
  check('600-Tick-Soak Katakomben ohne Invarianten-Verletzung', failures.length === before);
}

// --- 21. Over-Layer + Fringe (Slice 1.5): Datenintegrität, Zeichnung, Wächter ---
{
  const over = GRAVEYARD.overRows;
  check('GRAVEYARD hat overRows in Map-Dimension',
    Array.isArray(over) && over.length === GRAVEYARD.rows.length &&
    over.every((r) => r.length === GRAVEYARD.rows[0].length));

  const overChars = [...new Set(over.join('').replace(/\./g, ''))];
  check('Alle Over-Zeichen in Legende und NIE solid',
    overChars.length > 0 &&
    overChars.every((ch) => GRAVEYARD.legend[ch] && !GRAVEYARD.legend[ch].solid),
    `Zeichen: ${overChars.join(',')}`);

  check('Keine Fackel-Zeichen im Over-Layer (findTiles bleibt ground-only)',
    overChars.every((ch) => !GRAVEYARD.torchChars.includes(ch)));

  // Jeder Stamm trägt eine Krone: 'B' (canopy_bottom) auf der Stamm-Zelle ODER
  // die Zelle liegt in der 2x2-Span-Fläche eines Anker-Zeichens. Grafikpass 3
  // §5.2.2b: die gespiegelten Kronen Q/V/X decken Stämme gleichwertig.
  const trunkCovered = (x, y) => {
    if (over[y][x] === 'B') return true;
    for (let ay = Math.max(0, y - 1); ay <= y; ay++) {
      for (let ax = Math.max(0, x - 1); ax <= x; ax++) {
        if ('MNOQVX'.includes(over[ay][ax])) return true; // Anker deckt 2x2
      }
    }
    return false;
  };
  let trunksCovered = true;
  GRAVEYARD.rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch === 'T' && !trunkCovered(x, y)) trunksCovered = false;
  }));
  check('Jeder Baumstamm trägt eine Krone im Over-Layer', trunksCovered);

  check('Friedhof-Fringe-Flags: Gras Source, Weg+Wasser Target',
    !!(GRAVEYARD.legend['.'].fringeSource && GRAVEYARD.legend[','].fringeSource &&
       GRAVEYARD.legend['='].fringeTarget && GRAVEYARD.legend['~'].fringeTarget));
  check('Katakomben-Fringe-Flags: brick_wall moss-Source, Steinboden Target',
    !!(CATACOMBS.legend['#'].fringeSource && CATACOMBS.legend['#'].fringeSet === 'moss' &&
       CATACOMBS.legend['.'].fringeTarget && CATACOMBS.legend[','].fringeTarget));

  // Zeichnung headless: Dummy-Tiles (Key als "Bild"), Stub-Kontext zählt Aufrufe
  const dummyTiles = {};
  for (const key of Object.keys(TILE_ART)) dummyTiles[key] = key;
  const drawn = [];
  const stubCtx = { canvas: { width: 320, height: 180 }, drawImage: (img) => drawn.push(img) };
  const cam = { x: 0, y: 0 };
  const tm = createTilemap(GRAVEYARD.rows, GRAVEYARD.legend, over);

  drawn.length = 0;
  tm.draw(stubCtx, cam, dummyTiles, 0, 'over');
  // Sichtfenster (320×180 bei cam 0,0): Tiles x 0..20, y 0..11
  let expectedOver = 0;
  for (let ty = 0; ty <= 11; ty++) for (let tx = 0; tx <= 20; tx++) {
    if (over[ty][tx] !== '.') expectedOver++;
  }
  check('Over-Layer zeichnet genau die Kronen-Zellen im Sichtfenster',
    drawn.length === expectedOver && drawn.every((k) => String(k).startsWith('tree_canopy')),
    `gezeichnet ${drawn.length}, erwartet ${expectedOver}`);

  drawn.length = 0;
  tm.draw(stubCtx, cam, dummyTiles, 0, 'ground');
  const fringes = drawn.filter((k) => String(k).startsWith('fringe_'));
  check('Ground-Layer zeichnet Gras-Fringes über Weg-Kanten (> 0 im Sichtfenster)',
    fringes.length > 0, `Fringe-Zeichnungen: ${fringes.length}`);

  // Wächter: solides Zeichen in overRows muss werfen
  let threw = false;
  try {
    createTilemap(GRAVEYARD.rows, GRAVEYARD.legend, ['#' + over[0].slice(1), ...over.slice(1)]);
  } catch { threw = true; }
  check('Solides Zeichen in overRows wirft (Datenwächter)', threw);

  // Katakomben: kein Over-Layer, draw('over') ist ein stiller No-Op
  const tmCat = createTilemap(CATACOMBS.rows, CATACOMBS.legend, null);
  drawn.length = 0;
  tmCat.draw(stubCtx, cam, dummyTiles, 0, 'over');
  check('Ohne overRows ist draw(over) ein No-Op', drawn.length === 0);
}

// ===========================================================================
// Slice 2 (Abschnitte 22-29): Items, Inventar, Bumerang, neue Gegner, Drops
// ===========================================================================

// Leere Test-Arena: großer freier Raum (GRAVEYARD-Legende, Rand solide) für
// deterministische Kampf-Checks ohne Grabstein-Störgeometrie.
const ARENA = {
  rows: (() => {
    const wide = 22;
    const rows = ['#'.repeat(wide)];
    for (let i = 0; i < 20; i++) rows.push(`#${'.'.repeat(wide - 2)}#`);
    rows.push('#'.repeat(wide));
    return rows;
  })(),
  legend: GRAVEYARD.legend,
  playerSpawn: { x: 176, y: 176 },
};

// Deterministische rng-Sequenz für rollItem (nach Ende immer 0)
const seq = (vals) => {
  let i = 0;
  return () => vals[i++] ?? 0;
};

// Rekursiver Vergleich: entlarvt Funktions-/undefined-Felder, die
// JSON.stringify verschlucken würde (Plain-JSON-Wächter für S4).
function deepEq(a, b) {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  const ka = Object.keys(a);
  if (ka.length !== Object.keys(b).length) return false;
  return ka.every((k) => deepEq(a[k], b[k]));
}

// Test-Item mit genau einem festen Affix (Werte aus AFFIXES)
const testItem = (slot, stat) => ({
  slot, name: 'Testitem', rare: false,
  affixes: [{ stat, value: AFFIXES[stat].value }],
});

// Tick-Reihenfolge wie main.js inklusive Projektile (Bumerang-Abschnitte)
function tickProj(w, proj) {
  w.player.update(DT, w.input, w.map, w.enemies, w.events);
  proj.update(DT, w.input, w.player, w.enemies, w.props, w.map, w.drops, w.events);
  updateEnemies(DT, w.enemies, w.player, w.map, w.drops, w.events);
  updateProps(DT, w.props, w.player, w.map, w.drops, w.events);
  updateDrops(DT, w.drops, w.player, w.events);
  totalTicks++;
}

// --- 22. Items: rollItem mit Fest-rng, createInventory plain JSON ---
{
  // rng 0,0: Slot weapon (Index 0), Affix 0 = dmg (AFFIXES-Reihenfolge)
  const normal = rollItem(seq([0, 0]));
  check('rollItem normal: 1 Pool-Affix mit festem Wert (weapon/dmg/+1)',
    normal.slot === 'weapon' && normal.rare === false && normal.name === 'Rostklinge'
    && normal.affixes.length === 1 && normal.affixes[0].stat === 'dmg' && normal.affixes[0].value === 1);
  // Selten mit erzwungenem Slot: rng 0,0 → speedMult, dann potionHeal
  const rare = rollItem(seq([0, 0]), { slot: 'ring', rare: true });
  check('rollItem selten: 2 VERSCHIEDENE Ring-Affixe mit festen Werten',
    rare.slot === 'ring' && rare.rare === true && rare.name === 'Seelenring'
    && rare.affixes.length === 2
    && rare.affixes[0].stat === 'speedMult' && rare.affixes[0].value === 0.1
    && rare.affixes[1].stat === 'potionHeal' && rare.affixes[1].value === 2);
  // rng am oberen Rand: Affixe bleiben poolkonform und verschieden
  const rare2 = rollItem(seq([0.99, 0.99, 0.99]), { rare: true });
  check('rollItem selten (rng 0,99): poolkonform, keine Doppel-Affixe',
    rare2.affixes.length === 2 && rare2.affixes[0].stat !== rare2.affixes[1].stat
    && rare2.affixes.every((a) => AFFIXES[a.stat] && AFFIXES[a.stat].slot === rare2.slot));
  const inv = createInventory();
  check('createInventory: Startzustand laut Spec',
    inv.items.length === 0 && inv.capacity === 7 && inv.zelda.length === 0
    && inv.pity === 0 && inv.newFlag === false
    && inv.equipped.weapon === null && inv.equipped.armor === null && inv.equipped.ring === null);
  check('createInventory ist plain JSON (stringify/parse deep-equal)',
    deepEq(inv, JSON.parse(JSON.stringify(inv))));
}

// --- 23. Inventar-Operationen + Stats numerisch ---
{
  const inv = createInventory();
  let allAdded = true;
  for (let i = 0; i < 7; i++) allAdded = addItem(inv, testItem('weapon', 'dmg')) && allAdded;
  check('addItem: 7 Items passen, das 8. wird abgelehnt',
    allAdded && addItem(inv, testItem('weapon', 'dmg')) === false && inv.items.length === 7);
  check('addItem setzt newFlag', inv.newFlag === true);
  const first = inv.items[0];
  const second = inv.items[1];
  check('equipItem in leeren Slot: splice, Liste rückt auf',
    equipItem(inv, 0) === true && inv.equipped.weapon === first
    && inv.items.length === 6 && inv.items[0] === second);
  check('equipItem Tausch: altes Item landet am SELBEN Index',
    equipItem(inv, 0) === true && inv.equipped.weapon === second
    && inv.items[0] === first && inv.items.length === 6);
  check('equipItem mit ungültigem Index: false, keine Änderung',
    equipItem(inv, 99) === false && inv.items.length === 6 && inv.equipped.weapon === second);

  const inv2 = createInventory();
  addItem(inv2, testItem('weapon', 'dmg'));
  addItem(inv2, testItem('ring', 'speedMult'));
  equipItem(inv2, 0);
  equipItem(inv2, 0);
  const st = computeStats(inv2);
  check('computeStats: +1-Waffe und +10%-Ring ergeben EXAKT dmg 2, speed 99',
    st.dmg === 2 && st.speed === 99, `dmg=${st.dmg} speed=${st.speed}`);

  // Rüstung +2 anlegen heilt nicht; Ersatz ohne maxHp-Affix kappt hp
  const p = createPlayer(ARENA.playerSpawn);
  addItem(p.inv, testItem('armor', 'maxHp'));
  addItem(p.inv, testItem('armor', 'knockTakenMult'));
  equipItem(p.inv, 0);
  p.recalcStats();
  check('Rüstung +2 anlegen: maxHp 8, hp bleibt 6 (Anlegen heilt nicht)',
    p.maxHp === 8 && p.hp === 6, `maxHp=${p.maxHp} hp=${p.hp}`);
  p.hp = 8;
  equipItem(p.inv, 0); // Tausch gegen Rüstung OHNE maxHp-Affix
  p.recalcStats();
  check('Rüstung ohne maxHp-Affix ersetzt: hp auf maxHp gekappt (8 → 6)',
    p.maxHp === 6 && p.hp === 6, `maxHp=${p.maxHp} hp=${p.hp}`);
}

// --- 24. Statswirkung im Kampf: dmg 2 halbiert die Trefferzahl ---
{
  const hitsToKill = (spawner, withWeapon) => {
    const w = makeWorld({ mapDef: ARENA });
    const e = spawner({ x: ARENA.playerSpawn.x + 20, y: ARENA.playerSpawn.y });
    w.enemies.push(e);
    if (withWeapon) {
      addItem(w.player.inv, testItem('weapon', 'dmg'));
      equipItem(w.player.inv, 0);
      w.player.recalcStats();
    }
    w.input.dirX = 1;
    tick(w); // Blickrichtung rechts
    w.input.dirX = 0;
    w.input.attack = true;
    const hits = [];
    let prevHp = e.hp;
    for (let i = 0; i < 900 && w.enemies.length > 0; i++) {
      w.player.invulnTimer = 5; // Testfokus Gegner-HP, nicht Spieler-Schaden
      tick(w);
      if (e.hp < prevHp) { hits.push(i); prevHp = e.hp; }
    }
    return hits.length;
  };
  check('dmg-2-Stats: Skelett stirbt in genau 1 Treffer', hitsToKill(createSkeleton, true) === 1);
  check('dmg-2-Stats: Ghul stirbt in genau 2 Treffern', hitsToKill(createGhoul, true) === 2);
  check('Gegenprobe ohne Items: Skelett 2 Treffer (S1-Regression)', hitsToKill(createSkeleton, false) === 2);
  check('Gegenprobe ohne Items: Ghul 4 Treffer (S1-Regression)', hitsToKill(createGhoul, false) === 4);
}

// --- 25. Item-Drop-Fluss: erzwungener Drop, Pickup, volle Tasche, Pity ---
{
  const w = makeWorld({ mapDef: ARENA });
  const rust = createRust({ x: ARENA.playerSpawn.x + 24, y: ARENA.playerSpawn.y });
  rust.dropTable.itemChance = 1; // erzwungener Gear-Drop
  rust.state = 'die';
  rust.dieTimer = 0.01;
  w.enemies.push(rust);
  tick(w);
  const itemDrop = w.drops.find((d) => d.kind === 'item');
  check("Rostpanzer-Tod mit itemChance 1: Drop kind 'item' mit Item und map-Referenz",
    !!itemDrop && !!itemDrop.item && !!itemDrop.item.slot && itemDrop.map === w.map);

  // Hinlaufen: Berührung mit Platz → Objekt-Event item_pickup, Item in Tasche
  let picked = null;
  for (let i = 0; i < 300 && !picked; i++) {
    const d = w.drops.find((dd) => dd.kind === 'item');
    if (!d) break;
    const dx = d.x + d.w / 2 - (w.player.x + w.player.w / 2);
    const dy = d.y + d.h / 2 - (w.player.y + w.player.h / 2);
    const len = Math.hypot(dx, dy) || 1;
    w.input.dirX = dx / len;
    w.input.dirY = dy / len;
    tick(w);
    picked = getEvent(w.events, 'item_pickup');
  }
  w.input.dirX = 0;
  w.input.dirY = 0;
  check("Berührung mit Platz: Objekt-Event 'item_pickup', Item im Inventar",
    !!picked && !!picked.item && w.player.inv.items.includes(picked.item));

  // Volle Tasche: Drop bleibt liegen, Event einmal je retryTimer-Fenster
  while (w.player.inv.items.length < w.player.inv.capacity) addItem(w.player.inv, rollItem(seq([0.5, 0.5])));
  w.drops.length = 0;
  w.drops.push({
    x: w.player.x, y: w.player.y, w: 8, h: 8, vx: 0, vy: 0, age: 1,
    kind: 'item', item: rollItem(seq([0.5, 0.5])), map: w.map,
  });
  const fullBefore = w.events.filter((e) => e === 'inventory_full').length;
  ticks(w, 30); // 0,5 s: mitten im 1-s-Fenster
  const full1 = w.events.filter((e) => e === 'inventory_full').length - fullBefore;
  check("Volle Tasche: Drop bleibt liegen, 'inventory_full' einmal im Fenster",
    w.drops.some((d) => d.kind === 'item') && full1 === 1, `events=${full1}`);
  ticks(w, 45); // Fenster (1 s) läuft ab → genau ein weiterer Versuch
  const full2 = w.events.filter((e) => e === 'inventory_full').length - fullBefore;
  check('inventory_full höchstens einmal je retryTimer-Fenster', full2 === 2, `events=${full2}`);

  // Pity: 12 Kills ohne Gear → garantierter Normal-Drop trotz itemChance 0
  const w2 = makeWorld({ mapDef: ARENA });
  const sk = createSkeleton({ x: ARENA.playerSpawn.x + 60, y: ARENA.playerSpawn.y });
  sk.dropTable.itemChance = 0;
  sk.state = 'die';
  sk.dieTimer = 0.01;
  w2.enemies.push(sk);
  w2.player.inv.pity = 12;
  tick(w2);
  check('Pity 12 + itemChance 0: garantierter Normal-Drop, pity zurück auf 0',
    w2.drops.some((d) => d.kind === 'item' && d.item && d.item.rare === false)
    && w2.player.inv.pity === 0);
  const sk2 = createSkeleton({ x: ARENA.playerSpawn.x + 60, y: ARENA.playerSpawn.y });
  sk2.dropTable.itemChance = 0;
  sk2.state = 'die';
  sk2.dieTimer = 0.01;
  w2.enemies.push(sk2);
  tick(w2);
  check('Kill ohne Gear-Drop erhöht pity', w2.player.inv.pity === 1);
}

// --- 26. Bumerang: Wurfregeln, Reichweite, Stun, Props, Magnet ---
{
  const w = makeWorld({ mapDef: ARENA });
  const proj = createProjectiles();
  w.input.dirX = 1;
  tickProj(w, proj); // Blickrichtung rechts
  w.input.dirX = 0;
  w.input.secondary = true;
  tickProj(w, proj);
  check('Bumerang: ohne zelda-Eintrag wirft die Flanke nicht', proj.list.length === 0);
  w.input.secondary = false;
  tickProj(w, proj);
  w.player.inv.zelda = ['boomerang'];
  w.input.secondary = true;
  tickProj(w, proj);
  check('Bumerang: Flanke mit zelda-Eintrag wirft genau einen', proj.list.length === 1);
  w.input.secondary = false;
  tickProj(w, proj);
  w.input.secondary = true;
  tickProj(w, proj);
  check('Bumerang: nur einer gleichzeitig in der Luft', proj.list.length === 1);
  w.input.secondary = false;
  let maxD = 0;
  let caught = false;
  for (let i = 0; i < 300 && !caught; i++) {
    tickProj(w, proj);
    if (proj.list.length === 0) {
      caught = true;
    } else {
      const p = proj.list[0];
      maxD = Math.max(maxD, Math.hypot(
        p.x + p.w / 2 - (w.player.x + w.player.w / 2),
        p.y + p.h / 2 - (w.player.y + w.player.h / 2)));
    }
  }
  check('Bumerang: fliegt maximal 64 px, kehrt zurück, wird gefangen',
    caught && maxD <= 64 + 1e-6 && maxD >= 56, `maxD=${maxD.toFixed(2)}`);

  // Skelett-Treffer: 0 Schaden, Stun 1,5 s; gestunnt keine Bewegung/Kontakt
  const sk = createSkeleton({ x: ARENA.playerSpawn.x + 50, y: ARENA.playerSpawn.y });
  w.enemies.push(sk);
  for (let i = 0; i < 15; i++) tickProj(w, proj); // Nachwurfsperre abwarten
  w.input.secondary = true;
  let stunned = false;
  for (let i = 0; i < 90 && !stunned; i++) {
    tickProj(w, proj);
    stunned = sk.stunTimer > 0;
  }
  w.input.secondary = false;
  check('Bumerang-Treffer: Skelett-hp UNVERÄNDERT, stunTimer 1,5',
    stunned && sk.hp === 2 && sk.stunTimer > 1.4, `hp=${sk.hp} stun=${sk.stunTimer.toFixed(2)}`);
  sk.x = w.player.x;
  sk.y = w.player.y;
  const sx = sk.x;
  const sy = sk.y;
  const php = w.player.hp;
  for (let i = 0; i < 30; i++) tickProj(w, proj);
  check('Gestunnter Gegner: keine Bewegung, kein Kontaktschaden',
    sk.x === sx && sk.y === sy && w.player.hp === php && sk.stunTimer > 0);

  // Vase zerbricht per boomerangHit, Truhe reagiert nicht
  const w2 = makeWorld({
    mapDef: ARENA,
    propSpawns: [
      { x: ARENA.playerSpawn.x + 40, y: ARENA.playerSpawn.y, kind: 'vase' },
      { x: ARENA.playerSpawn.x - 40, y: ARENA.playerSpawn.y, kind: 'chest' },
    ],
  });
  const proj2 = createProjectiles();
  w2.player.inv.zelda = ['boomerang'];
  const vase = w2.props.find((p) => p.kind === 'vase');
  const chest = w2.props.find((p) => p.kind === 'chest');
  w2.input.dirX = 1;
  tickProj(w2, proj2);
  w2.input.dirX = 0;
  w2.input.secondary = true;
  let broke = false;
  for (let i = 0; i < 90 && !broke; i++) {
    tickProj(w2, proj2);
    broke = !w2.props.includes(vase) || vase.state === 'break';
  }
  w2.input.secondary = false;
  check('Vase mit boomerangHit zerbricht (wie Schwert-Treffer)', broke);
  for (let i = 0; i < 90 && proj2.list.length > 0; i++) tickProj(w2, proj2);
  for (let i = 0; i < 15; i++) tickProj(w2, proj2); // Nachwurfsperre
  w2.input.dirX = -1;
  tickProj(w2, proj2);
  w2.input.dirX = 0;
  w2.input.secondary = true;
  for (let i = 0; i < 90; i++) tickProj(w2, proj2);
  w2.input.secondary = false;
  check('Truhe reagiert NICHT auf den Bumerang (öffnet nur per Schwert)',
    !chest.opened && chest.boomerangHit === false && !w2.events.includes('chest_opened'));

  // Magnet: berührter Münz-Drop fliegt zum Spieler
  const w3 = makeWorld({ mapDef: ARENA });
  const proj3 = createProjectiles();
  w3.player.inv.zelda = ['boomerang'];
  w3.drops.push({
    x: ARENA.playerSpawn.x + 40 - 4, y: ARENA.playerSpawn.y - 4,
    w: 8, h: 8, vx: 0, vy: 0, age: 1, kind: 'coin', map: w3.map,
  });
  w3.input.dirX = 1;
  tickProj(w3, proj3);
  w3.input.dirX = 0;
  const gold0 = w3.player.gold;
  w3.input.secondary = true;
  let magnetGot = false;
  for (let i = 0; i < 180 && !magnetGot; i++) {
    tickProj(w3, proj3);
    magnetGot = w3.player.gold === gold0 + 1;
  }
  w3.input.secondary = false;
  check('Magnetisierter Münz-Drop erreicht den Spieler', magnetGot);
}

// --- 27. Grufthund: Orbit-Median, Telegraph→Leap→Down, Bumerang-Fenster ---
{
  const w = makeWorld({ mapDef: ARENA });
  const hound = createHound({ x: ARENA.playerSpawn.x + 70, y: ARENA.playerSpawn.y });
  w.enemies.push(hound);
  const dists = [];
  let leaps = 0;
  let downs = 0;
  let badLeap = false;
  let badDown = false;
  let downContactOk = true;
  let prevState = hound.state;
  for (let i = 0; i < 1800 && (dists.length < 120 || downs < 1); i++) {
    w.player.invulnTimer = 5;
    tick(w);
    if (hound.state === 'circle') {
      dists.push(Math.hypot(
        hound.x + hound.w / 2 - (w.player.x + w.player.w / 2),
        hound.y + hound.h / 2 - (w.player.y + w.player.h / 2)));
    }
    if (hound.state !== prevState) {
      if (hound.state === 'leap') { leaps++; if (prevState !== 'telegraph') badLeap = true; }
      if (hound.state === 'down') { downs++; if (prevState !== 'leap') badDown = true; }
      prevState = hound.state;
    }
    if (hound.state === 'down' && hound.contactDamage !== 0) downContactOk = false;
  }
  dists.sort((a, b) => a - b);
  const median = dists.length ? dists[Math.floor(dists.length / 2)] : 0;
  check('Grufthund: Median des Orbit-Abstands über 2 s im Band 40-75 px',
    dists.length >= 120 && median >= 40 && median <= 75,
    `median=${median.toFixed(1)} n=${dists.length}`);
  check('Grufthund: vor JEDEM Sprung ein Telegraph', leaps >= 1 && !badLeap, `leaps=${leaps}`);
  check('Grufthund: nach dem Sprung down, Kontaktschaden 0 am Boden',
    downs >= 1 && !badDown && downContactOk, `downs=${downs}`);

  // Schwert-Treffer zählt im down-Zustand
  const w2 = makeWorld({ mapDef: ARENA });
  const h2 = createHound({ x: ARENA.playerSpawn.x + 20, y: ARENA.playerSpawn.y });
  h2.state = 'down';
  h2.downTimer = 1.2;
  h2.contactDamage = 0;
  w2.enemies.push(h2);
  w2.input.dirX = 1;
  tick(w2);
  w2.input.dirX = 0;
  w2.input.attack = true;
  const hp0 = h2.hp;
  for (let i = 0; i < 30; i++) { w2.player.invulnTimer = 5; tick(w2); }
  w2.input.attack = false;
  check('Grufthund: Schwert-Treffer zählt im down-Zustand', h2.hp < hp0, `hp ${hp0} → ${h2.hp}`);

  // Bumerang im Telegraph: sofort down (1,5 s)
  const w3 = makeWorld({ mapDef: ARENA });
  const h3 = createHound({ x: ARENA.playerSpawn.x + 40, y: ARENA.playerSpawn.y });
  h3.state = 'telegraph';
  h3.telegraphTimer = 0.5;
  w3.enemies.push(h3);
  const proj3 = createProjectiles();
  w3.player.inv.zelda = ['boomerang'];
  w3.input.dirX = 1;
  tickProj(w3, proj3);
  w3.input.dirX = 0;
  w3.input.secondary = true;
  let downHit = false;
  for (let i = 0; i < 60 && !downHit; i++) {
    tickProj(w3, proj3);
    downHit = h3.state === 'down';
  }
  w3.input.secondary = false;
  check('Bumerang im Telegraph: Grufthund kippt sofort in down (1,5 s)',
    downHit && h3.downTimer > 1.4, `state=${h3.state} downTimer=${h3.downTimer.toFixed(2)}`);
}

// --- 28. Rostpanzer: Frontblock, Seiten-Kill, Blickrichtungs-Rasterung ---
{
  const w = makeWorld({ mapDef: ARENA });
  // Rostpanzer nördlich, Blick nach Süden (Init faceY 1); Stun friert das
  // Verhalten ein, damit die Blickrichtung für den Test stehen bleibt
  // (Schwert-Treffer wirken im Stun laut Spec normal weiter).
  const rust = createRust({ x: ARENA.playerSpawn.x, y: ARENA.playerSpawn.y - 24 });
  rust.stunTimer = 999;
  w.enemies.push(rust);
  w.input.dirY = -1;
  tick(w); // Blick nach oben (frontal in den Schild)
  w.input.dirY = 0;
  w.input.attack = true;
  const hpFront = rust.hp;
  const blocked0 = w.events.filter((e) => e === 'attack_blocked').length;
  for (let i = 0; i < 30; i++) { w.player.invulnTimer = 5; tick(w); }
  w.input.attack = false;
  check("Rostpanzer: Schwert frontal → hp unverändert + 'attack_blocked'",
    rust.hp === hpFront && w.events.filter((e) => e === 'attack_blocked').length > blocked0,
    `hp=${rust.hp}`);

  // Von der Seite: verwundbar, 5 Seitentreffer töten (hp 5, dmg 1).
  // Spieler wird pro Tick exakt östlich auf Schwertreichweite geankert,
  // weil der Treffer-Knockback den Rostpanzer sonst aus der Reichweite
  // schiebt (Blick bleibt nach Westen, Treffer bleiben seitlich).
  ticks(w, 25); // letzten Frontal-Schwung austrudeln lassen (0,35 s busy)
  w.player.x = rust.x + rust.w / 2 + 22 - w.player.w / 2;
  w.player.y = rust.y + rust.h / 2 - w.player.h / 2;
  w.input.dirX = -1;
  tick(w); // Blick nach Westen
  w.input.dirX = 0;
  w.input.attack = true;
  const hits = [];
  let prevHp = rust.hp;
  for (let i = 0; i < 900 && w.enemies.length > 0; i++) {
    w.player.invulnTimer = 5;
    w.player.x = rust.x + rust.w / 2 + 22 - w.player.w / 2;
    w.player.y = rust.y + rust.h / 2 - w.player.h / 2;
    tick(w);
    if (rust.hp < prevHp) { hits.push(i); prevHp = rust.hp; }
  }
  w.input.attack = false;
  check('Rostpanzer: seitlich verwundbar, 5 Seitentreffer töten',
    w.enemies.length === 0 && hits.length === 5, `hits=${hits.length}`);

  // Blickrichtung rastet auf 4 Himmelsrichtungen, Wechsel frühestens 0,4 s
  const w2 = makeWorld({ mapDef: ARENA });
  const r2 = createRust({ x: ARENA.playerSpawn.x + 50, y: ARENA.playerSpawn.y });
  w2.enemies.push(r2);
  let lastFace = `${r2.faceX},${r2.faceY}`;
  let lastChange = -1;
  let minGap = Infinity;
  let changes = 0;
  let badFace = false;
  for (let i = 0; i < 600; i++) {
    w2.player.invulnTimer = 5;
    // Spieler kreist um den Rostpanzer (Position direkt gesetzt), damit die
    // Verfolgungsrichtung mehrfach wechselt
    const ang = (i / 600) * Math.PI * 2;
    w2.player.x = r2.x + r2.w / 2 + Math.cos(ang) * 50 - w2.player.w / 2;
    w2.player.y = r2.y + r2.h / 2 + Math.sin(ang) * 50 - w2.player.h / 2;
    tick(w2);
    if (!((Math.abs(r2.faceX) === 1 && r2.faceY === 0) || (r2.faceX === 0 && Math.abs(r2.faceY) === 1))) {
      badFace = true;
    }
    const f = `${r2.faceX},${r2.faceY}`;
    if (f !== lastFace) {
      if (lastChange >= 0) minGap = Math.min(minGap, i - lastChange);
      changes++;
      lastFace = f;
      lastChange = i;
    }
  }
  check('Rostpanzer: faceDir immer auf Himmelsrichtung gerastet', !badFace);
  check('Rostpanzer: Blickwechsel frühestens alle 0,4 s (24 Ticks)',
    changes >= 2 && minGap >= 24, `changes=${changes} minGap=${minGap}`);
}

// --- 29. Inventar-UI headless: Cursor, ANLEGEN, close ---
{
  const ui = createInventoryUI();
  const p = createPlayer(ARENA.playerSpawn);
  addItem(p.inv, testItem('armor', 'maxHp'));
  addItem(p.inv, testItem('weapon', 'dmg'));
  const inp = { dirX: 0, dirY: 0, attack: false, confirm: false, inventory: true, tap: null };
  ui.open();
  check('Inventar-UI: gehaltene Taste schließt das Panel im Öffnungs-Frame NICHT',
    ui.update(inp, p) === null);
  inp.inventory = false;
  ui.update(inp, p); // Loslassen gesehen
  inp.dirY = 1;
  ui.update(inp, p);
  check('Cursor-Flanke runter bewegt die Auswahl (0 → 1)', ui.cursor === 1);
  ui.update(inp, p);
  check('Gehaltener Richtungs-Pegel bewegt den Cursor nicht weiter', ui.cursor === 1);
  inp.dirY = 0;
  ui.update(inp, p);
  const dmg0 = p.stats.dmg;
  inp.confirm = true;
  ui.update(inp, p);
  inp.confirm = false;
  ui.update(inp, p);
  check('Confirm-Flanke legt das markierte Item an, dmg steigt messbar',
    !!p.inv.equipped.weapon && p.stats.dmg === dmg0 + 1, `dmg=${p.stats.dmg}`);
  inp.tap = { x: 100, y: 30 };
  ui.update(inp, p);
  inp.tap = null;
  check('Tap auf Listenzeile setzt den Cursor', ui.cursor === 0);
  inp.tap = { x: 290, y: 12 };
  const closedByTap = ui.update(inp, p);
  inp.tap = null;
  check("Tap auf den X-Button liefert 'close'", closedByTap === 'close');
  inp.inventory = true;
  check("inventory-Flanke liefert 'close'", ui.update(inp, p) === 'close');
}

// ===========================================================================
// Slice 3 (Abschnitte 30-34): Boss-Maschine, Progression, Eliten, Portal-
// Guards, Truhen-Inhalte + Map-Geometrie.
// ===========================================================================

const tcc = (tx, ty) => ({ x: tx * 16 + 8, y: ty * 16 + 8 });

// --- 30. Boss-Maschine (Grabwaechter) -----------------------------------------
{
  const bmap = createTilemap(BOSS_KAMMER.rows, BOSS_KAMMER.legend);
  const bossW = (px, py) => {
    const player = createPlayer({ x: px, y: py });
    const boss = createGraveward({ x: 168, y: 72 }); // tc(10,4)
    return { map: bmap, player, enemies: [boss], boss, drops: [], events: [], input: makeInput() };
  };
  const bstep = (w) => {
    w.events.length = 0;
    w.player.update(DT, w.input, w.map, w.enemies, w.events);
    updateEnemies(DT, w.enemies, w.player, w.map, w.drops, w.events);
    totalTicks++;
  };

  // Idle vs. Aggro
  {
    const w = bossW(168, 152); // dist 80 zum Boss (168,72)
    bstep(w);
    check('Boss startet idle (Spieler 80 px entfernt)', w.boss.state === 'idle');
  }
  {
    const w = bossW(168, 120); // dist 48 <= 64
    bstep(w);
    check('Boss aggro bei Distanz <= 64 px (idle → stalk)', w.boss.state === 'stalk');
  }
  {
    const w = bossW(168, 152);
    w.boss.hp = 25; // erster Treffer (hp < maxHp), auch aus der Ferne
    bstep(w);
    check('Boss aggro bei erstem Treffer (hp<maxHp → stalk)', w.boss.state === 'stalk');
  }

  // Telegraph-Pflicht: kein sweep ohne windupA (Muster A, Nahdistanz),
  // kein dash ohne windupB (Muster B, mittlere Distanz).
  {
    // Muster A: Spieler nah (dist ~20) → nur Rundumschlaege.
    const wa = bossW(168, 92);
    let prev = wa.boss.state; let sweeps = 0; let badSweep = false;
    for (let i = 0; i < 1500; i++) {
      wa.player.invulnTimer = 5; wa.player.hp = wa.player.maxHp;
      wa.player.x = 168 - 6; wa.player.y = 92 - 7; // an Nahdistanz festhalten (dist 20)
      bstep(wa);
      if (wa.boss.state !== prev) {
        if (wa.boss.state === 'sweep') { sweeps++; if (prev !== 'windupA') badSweep = true; }
        prev = wa.boss.state;
      }
    }
    check('Boss: vor JEDEM Rundumschlag ein windupA-Telegraph', sweeps >= 1 && !badSweep, `sweeps=${sweeps}`);

    // Muster B: Spieler auf mittlerer Distanz halten (dist 60, >32 und <=88) →
    // nur Sturmschlaege. Spieler jeden Frame relativ zum Boss neu ankern.
    const wb = bossW(168, 132);
    prev = wb.boss.state; let dashes = 0; let badDash = false;
    for (let i = 0; i < 1500; i++) {
      wb.player.invulnTimer = 5; wb.player.hp = wb.player.maxHp;
      const bcx = wb.boss.x + wb.boss.w / 2; const bcy = wb.boss.y + wb.boss.h / 2;
      wb.player.x = bcx - wb.player.w / 2; wb.player.y = bcy + 60 - wb.player.h / 2; // dist 60
      bstep(wb);
      if (wb.boss.state !== prev) {
        if (wb.boss.state === 'dash') { dashes++; if (prev !== 'windupB') badDash = true; }
        prev = wb.boss.state;
      }
    }
    check('Boss: vor JEDEM Sturmschlag ein windupB-Telegraph', dashes >= 1 && !badDash, `dashes=${dashes}`);
  }

  // Aktive Trefferphase trifft fuer EXAKT 2 (ein Treffer je Phase).
  {
    const w = bossW(168, 72); // Spieler im Boss-Zentrum (im Sweep-Radius)
    w.boss.state = 'sweep';
    w.boss.stateTimer = 0.25;
    w.boss.hitApplied = false;
    w.player.hp = 10; w.player.invulnTimer = 0;
    for (let i = 0; i < 20; i++) { updateEnemies(DT, w.enemies, w.player, w.map, w.drops, w.events); totalTicks++; }
    check('Boss-Sweep trifft fuer EXAKT 2 (ein Treffer je aktiver Phase)', w.player.hp === 8, `hp=${w.player.hp}`);
  }

  // stuck: kein Kontaktschaden; Schwert-Treffer zaehlt, setzt KEINEN knockTimer,
  // Position bleibt unveraendert (knockFactor-0-Regel §3).
  {
    const w = bossW(168, 92); // Spieler direkt unter dem Boss
    w.boss.state = 'stuck';
    w.boss.stateTimer = 5;
    w.player.x = 162; w.player.y = 65; // ueberlappt den Boss (Zentrum 168,72)
    w.player.hp = 6; w.player.invulnTimer = 0;
    const bx0 = w.boss.x; const by0 = w.boss.y; const bhp0 = w.boss.hp;
    // 3 Schwuenge
    let contactDmg = false;
    for (let s = 0; s < 3; s++) {
      w.input.attack = true; w.input.dirX = 0; w.input.dirY = -1;
      for (let i = 0; i < 22; i++) {
        const hpBefore = w.player.hp;
        w.player.update(DT, w.input, w.map, w.enemies, w.events);
        updateEnemies(DT, w.enemies, w.player, w.map, w.drops, w.events);
        totalTicks++;
        w.player.x = 162; w.player.y = 65; // festhalten
        w.player.invulnTimer = 0;
        if (w.player.hp < hpBefore) contactDmg = true;
      }
    }
    w.input.attack = false;
    check('Boss-stuck: KEIN Kontaktschaden am Spieler', !contactDmg, `hp=${w.player.hp}`);
    check('Boss-stuck: Schwert-Treffer zaehlen (hp sinkt)', w.boss.hp < bhp0, `hp ${bhp0}→${w.boss.hp}`);
    check('Boss: Schwert-Treffer setzt KEINEN knockTimer (knockFactor 0)', w.boss.knockTimer === 0);
    check('Boss: Position nach Schwert-Treffer unveraendert (kein Knockback)',
      w.boss.x === bx0 && w.boss.y === by0, `(${w.boss.x},${w.boss.y}) vs (${bx0},${by0})`);
  }

  // Phasenwechsel + Beschwoerung: hp auf 16 → summon, +2 Adds (summoned).
  {
    const w = bossW(168, 152);
    w.boss.hp = 25; bstep(w); // Aggro → stalk
    w.boss.hp = 16;           // < 17 → Phase 2
    // bis Ende summon simulieren (1,2 s) + Folgeframe
    let sawSummon = false;
    for (let i = 0; i < 90; i++) {
      w.player.invulnTimer = 5; w.player.hp = w.player.maxHp;
      bstep(w);
      if (w.boss.state === 'summon') sawSummon = true;
    }
    const adds = w.enemies.filter((e) => e.summoned === true);
    check('Boss: hp<17 → Phase 2, Zustand summon', sawSummon);
    check('Boss: Beschwoerung spawnt genau 2 Adds (summoned, ans Array-Ende)',
      adds.length === 2 && adds.every((a) => a.kind === 'skeleton'), `adds=${adds.length}`);
    check('Boss: nie mehr als 2 Adds gleichzeitig', w.enemies.filter((e) => e.summoned).length <= 2);
  }

  // Bumerang-Abbruch (summonAborted) → Welle entfaellt.
  {
    const w = bossW(168, 152);
    w.boss.hp = 25; bstep(w);
    w.boss.hp = 16; bstep(w); // → summon
    w.boss.summonAborted = true; // simuliert Bumerang-Treffer im summon
    for (let i = 0; i < 90; i++) { w.player.invulnTimer = 5; w.player.hp = w.player.maxHp; bstep(w); }
    check('Boss: Bumerang im summon → Welle entfaellt (keine Adds)',
      w.enemies.filter((e) => e.summoned).length === 0);
  }

  // Sterbepfad: dieTime 1,0 s, danach 'boss_died'; keine Drops, xp 0, kein Gear.
  {
    const w = bossW(168, 152);
    w.boss.state = 'die';
    w.boss.dieTimer = w.boss.dieTime; // 1,0 s
    let diedAt = -1;
    for (let i = 0; i < 90 && diedAt < 0; i++) {
      bstep(w);
      if (w.events.includes('boss_died')) diedAt = i;
    }
    check('Boss-Sterbephase dauert ~1,0 s, dann boss_died', diedAt >= 55 && diedAt <= 62, `tick=${diedAt}`);
    check('Boss hinterlaesst keine Drops (noDrops)', w.drops.length === 0);
    check('Boss: xp 0, kein dropTable (kein Gear/Muenzen/Pity)',
      createGraveward({ x: 0, y: 0 }).xp === 0 && createGraveward({ x: 0, y: 0 }).dropTable === undefined);
  }

  // Zerbroeselte Adds (state die + noDrops) hinterlassen nichts, aendern Pity nicht.
  {
    const map2 = createTilemap(BOSS_KAMMER.rows, BOSS_KAMMER.legend);
    const player = createPlayer({ x: 168, y: 152 });
    player.inv.pity = 5;
    const add = createSkeleton({ x: 200, y: 100 });
    add.summoned = true; add.state = 'die'; add.dieTimer = 0.4; add.noDrops = true;
    const w = { map: map2, player, enemies: [add], drops: [], events: [], input: makeInput() };
    for (let i = 0; i < 30; i++) { updateEnemies(DT, w.enemies, w.player, w.map, w.drops, w.events); totalTicks++; }
    check('Zerbroeselte Adds: keine Drops, Pity unveraendert',
      w.drops.length === 0 && player.inv.pity === 5 && w.enemies.length === 0);
  }
}

// --- 31. Progression ----------------------------------------------------------
{
  const p19 = createProgress(); grantXp(p19, 19);
  const p20 = createProgress(); grantXp(p20, 20);
  const p140 = createProgress(); grantXp(p140, 140);
  check('grantXp: 19 XP → Level 1 (Schwelle 20 nicht erreicht)', p19.level === 1, `level=${p19.level}`);
  check('grantXp: 20 XP → Level 2', p20.level === 2, `level=${p20.level}`);
  check('grantXp: 140 XP → Level 5 (Cap)', p140.level === 5, `level=${p140.level}`);
  const upsAtCap = grantXp(p140, 1000);
  check('grantXp am Cap: keine weiteren Level-Ups, xp sammelt weiter',
    upsAtCap === 0 && p140.level === 5 && p140.xp === 1140, `xp=${p140.xp}`);
  const ups = grantXp(createProgress(), 20);
  check('grantXp Rueckgabe = Anzahl Level-Ups (0→2 = 1)', ups === 1, `ups=${ups}`);

  const prog = { xp: 0, level: 4, hearts: 1 };
  const base = { maxHp: 6, dmg: 1, speed: 90 };
  const out = applyProgress(base, prog);
  check('applyProgress: L4 + 1 Herz → maxHp 14 (Basis 6)', out.maxHp === 14, `maxHp=${out.maxHp}`);
  check('applyProgress fasst NUR maxHp an, Eingabe unveraendert',
    out.dmg === 1 && out.speed === 90 && base.maxHp === 6);

  const cp = createProgress();
  check('createProgress ist Plain-JSON (stringify/parse deep-equal)',
    deepEq(cp, JSON.parse(JSON.stringify(cp))) && cp.xp === 0 && cp.level === 1 && cp.hearts === 0);

  // computeStats OHNE prog bleibt Slice-2-Stand (items.js-Regression)
  check('computeStats ohne prog: maxHp 6 (items.js unveraendert)',
    computeStats(createInventory()).maxHp === 6);
}

// --- 32. Eliten ---------------------------------------------------------------
{
  const norm = createSkeleton(tcc(5, 5));
  const elite = createSkeleton({ ...tcc(5, 5), elite: true });
  check('Normales Skelett: hp 2, xp 2, contactDamage 1 (Slice-2-Werte + neues xp-Feld)',
    norm.hp === 2 && norm.xp === 2 && norm.contactDamage === 1
    && norm.wanderSpeed === 25 && norm.chaseSpeed === 55 && norm.knockFactor === 1
    && norm.elite === undefined);
  check('Elite-Skelett: hp 4 (x2), xp 4 (x2), Tempo x1,25',
    elite.hp === 4 && elite.xp === 4
    && Math.abs(elite.wanderSpeed - 25 * 1.25) < 1e-9
    && Math.abs(elite.chaseSpeed - 55 * 1.25) < 1e-9 && elite.elite === true);
  check('Elite: Kontaktschaden/AABB unveraendert',
    elite.contactDamage === norm.contactDamage && elite.w === norm.w && elite.h === norm.h);
  // hp 4 bei dmg 2 → 2 Median-Hiebe statt 1
  check('Elite stirbt in 2 Median-Hieben (hp 4 / dmg 2), normal in 1',
    elite.hp / 2 === 2 && norm.hp / 2 === 1);
  const eliteGhoul = createGhoul({ ...tcc(5, 5), elite: true });
  check('Elite-Ghul: hp 8 (4 x2 aufgerundet), xp 8', eliteGhoul.hp === 8 && eliteGhoul.xp === 8);
}

// --- 33. Portal-Guards (pure Funktion portalBlocked) --------------------------
{
  const lockP = { requires: 'boss_key', target: 'BOSS_KAMMER' };
  const sealP = { bossLocked: true, target: 'FLUESTERGRUFT' };
  const noKey = { inv: { zelda: [] } };
  const withKey = { inv: { zelda: ['boss_key'] } };
  check("portalBlocked: requires ohne Schluessel → 'locked'",
    portalBlocked(lockP, noKey, []) === 'locked');
  check('portalBlocked: requires mit Schluessel → null',
    portalBlocked(lockP, withKey, []) === null);
  check("portalBlocked: bossLocked + lebender graveward (stalk) → 'sealed'",
    portalBlocked(sealP, withKey, [{ kind: 'graveward', state: 'stalk' }]) === 'sealed');
  check('portalBlocked: bossLocked + graveward idle → null (Fluchtklausel)',
    portalBlocked(sealP, withKey, [{ kind: 'graveward', state: 'idle' }]) === null);
  check('portalBlocked: bossLocked + graveward die → null (Boss besiegt)',
    portalBlocked(sealP, withKey, [{ kind: 'graveward', state: 'die' }]) === null);
  check('portalBlocked: bossLocked ohne graveward → null',
    portalBlocked(sealP, withKey, []) === null);
}

// --- 34. Truhen-Inhalte + Map-Geometrie ---------------------------------------
{
  // Schwert-Truhe oeffnen: Helfer, der einen Schwung ausfuehrt bis opened.
  const openChest = (content, extraProps = []) => {
    const s = ARENA.playerSpawn;
    const w = makeWorld({
      mapDef: ARENA,
      propSpawns: [{ x: s.x + 22, y: s.y, kind: 'chest', content }, ...extraProps],
    });
    w.input.dirX = 1; tick(w); w.input.dirX = 0;
    w.input.attack = true;
    for (let i = 0; i < 200 && !w.props.find((p) => p.content === content && p.opened); i++) tick(w);
    w.input.attack = false;
    ticks(w, 30);
    return w;
  };

  // boss_key
  {
    const w = openChest('boss_key');
    check("Truhe 'boss_key': pusht in inv.zelda + Event 'key_found', KEIN chest_opened",
      w.player.inv.zelda.includes('boss_key') && w.events.includes('key_found')
      && !w.events.includes('chest_opened'));
  }

  // Softlock-Reihenfolge: boss_key ZUERST (im zelda-Slot), dann Bumerang-Truhe
  // → der Bumerang-Zweig PUSHT (statt hart zu ueberschreiben), beide bleiben.
  {
    const s = ARENA.playerSpawn;
    const w = makeWorld({
      mapDef: ARENA,
      propSpawns: [{ x: s.x + 22, y: s.y, kind: 'chest', content: 'boomerang' }],
    });
    w.player.inv.zelda = ['boss_key']; // Schluessel bereits geholt
    w.input.dirX = 1; tick(w); w.input.dirX = 0;
    w.input.attack = true; ticks(w, 60); w.input.attack = false;
    check('Softlock-Fix: Bumerang-Truhe nach boss_key → zelda enthaelt BEIDE',
      w.player.inv.zelda.includes('boss_key') && w.player.inv.zelda.includes('boomerang'),
      `zelda=[${w.player.inv.zelda}]`);
  }

  // heart
  {
    const w = openChest('heart');
    check("Truhe 'heart': hearts +1, maxHp +2, heilt +2, kein chest_opened",
      w.player.prog.hearts === 1 && w.player.maxHp === 8 && w.player.hp === 8
      && !w.events.includes('chest_opened'));
  }

  // gold
  {
    const w = openChest('gold');
    const coins = w.drops.filter((d) => d.kind === 'coin').length + w.player.gold;
    check("Truhe 'gold': 8-12 Muenzen, KEIN chest_opened",
      coins >= 8 && coins <= 12 && !w.events.includes('chest_opened'), `muenzen=${coins}`);
  }

  // Neue Maps: elite-Flags nur FLUESTERGRUFT; Portal-Ketten-Ziele existieren.
  {
    const fluEl = (FLUESTERGRUFT.enemySpawns || []).filter((e) => e.elite).length;
    const otherEl = ['GRAVEYARD', 'CATACOMBS', 'BOSS_KAMMER']
      .reduce((n, k) => n + (MAPS[k].enemySpawns || []).filter((e) => e.elite).length, 0);
    check('elite-Flags NUR in der FLUESTERGRUFT', fluEl === 4 && otherEl === 0, `flu=${fluEl} andere=${otherEl}`);
    check('Portal-Kette FLUESTERGRUFT→BOSS_KAMMER (requires boss_key) existiert',
      FLUESTERGRUFT.portals.some((p) => p.target === 'BOSS_KAMMER' && p.requires === 'boss_key'));
    check('Portal BOSS_KAMMER→FLUESTERGRUFT (bossLocked) existiert',
      BOSS_KAMMER.portals.some((p) => p.target === 'FLUESTERGRUFT' && p.bossLocked));
    check('BOSS_KAMMER traegt genau einen graveward-Spawn',
      (BOSS_KAMMER.enemySpawns || []).filter((e) => e.kind === 'graveward').length === 1);
  }

  // Die vier Add-Anker der BOSS_KAMMER sind begehbar (Skelett-AABB 12x14).
  {
    const bm = createTilemap(BOSS_KAMMER.rows, BOSS_KAMMER.legend);
    const anchors = [tcc(4, 3), tcc(15, 3), tcc(4, 8), tcc(15, 8)];
    const bad = anchors.findIndex((a) => bm.rectCollides({ x: a.x - 6, y: a.y - 7, w: 12, h: 14 }));
    check('BOSS_KAMMER: alle 4 Add-Anker begehbar (Skelett-AABB kollisionsfrei)', bad === -1,
      bad >= 0 ? `Anker ${bad} solide` : '');
  }
}

// ===========================================================================
// Abschnitt 35 "Grafikpass 2" (additiv): Varianten, Span-Anker, Wasser-Anim,
// Grid-Maße, Quelltext-Wächter, Ground-Freeze. Die neuen TILE_ART-Keys liefert
// der Art-Builder parallel; die Existenz-Checks (variants-/anim-Frame-Keys)
// dürfen bis dahin ROT sein. Die MECHANIK ist hier art-unabhängig geprüft:
// eine Proxy-Kachelquelle liefert jeden angefragten Key als "Bild" zurück, so
// zeichnet der Stub jede von artFor gewählte Kachel unabhängig von TILE_ART.
// ===========================================================================
{
  const anyTiles = new Proxy({}, { get: (_, k) => k });
  const drawKeys = (tm, cam, timeSec, layer, cw = 320, ch = 180) => {
    const out = [];
    const ctx = { canvas: { width: cw, height: ch }, drawImage: (img) => out.push(img) };
    tm.draw(ctx, cam, anyTiles, timeSec, layer);
    return out;
  };

  // --- variantIndex: deterministisch, Wertebereich, synthetische Streuung ---
  let detOk = true;
  for (const [x, y, n] of [[3, 7, 3], [40, 12, 2], [0, 0, 3], [31, 31, 2]]) {
    const a = variantIndex(x, y, n);
    for (let r = 0; r < 5; r++) if (variantIndex(x, y, n) !== a) detOk = false;
    if (!(a >= 0 && a < n)) detOk = false;
  }
  check('variantIndex: deterministisch + Wertebereich 0..n-1', detOk);
  for (const n of [2, 3]) {
    const seen = new Set();
    for (let x = 0; x < 32; x++) for (let y = 0; y < 32; y++) seen.add(variantIndex(x, y, n));
    check(`variantIndex: Streuung über 0..31×0..31 zeigt alle ${n} Indizes`, seen.size === n,
      `gesehen ${[...seen].sort().join(',')}`);
  }

  // --- Render-Determinismus: dieselbe Kamera zweimal → identische Key-Folge ---
  {
    const tm = createTilemap(GRAVEYARD.rows, GRAVEYARD.legend, GRAVEYARD.overRows);
    const cam = { x: 512, y: 128 }; // erfasst Gras-Varianten + die Ost-Baumreihe (Anker)
    const g1 = drawKeys(tm, cam, 0.5, 'ground');
    const g2 = drawKeys(tm, cam, 0.5, 'ground');
    const o1 = drawKeys(tm, cam, 0.5, 'over');
    const o2 = drawKeys(tm, cam, 0.5, 'over');
    check('Render-Determinismus: gleiche Kamera → gleiche Key-Folge (ground+over)',
      g1.length > 0 && o1.length > 0 && g1.join('|') === g2.join('|') && o1.join('|') === o2.join('|'));
  }

  // --- Varianten-Integrität: variants[0] === art (mechanisch); Existenz der
  //     variants-Keys separat (art-abhängig, darf ROT sein) ---
  {
    let headOk = true;
    let missKey = null;
    for (const def of Object.values(MAPS)) {
      for (const cell of Object.values(def.legend)) {
        if (!cell.variants) continue;
        if (cell.variants[0] !== cell.art) headOk = false;
        for (const k of cell.variants) if (!TILE_ART[k]) missKey = missKey || k;
      }
    }
    check('Varianten-Integrität: variants[0] === art in allen Map-Legenden', headOk);
    check('Varianten-Keys existieren in TILE_ART (Art-Builder parallel)', missKey === null, missKey || '');
  }

  // --- createTilemap wirft bei ungültigen Legenden-Kombinationen (§2.1) ---
  {
    const mkThrows = (rows, legend, over = null) => {
      try { createTilemap(rows, legend, over); return false; } catch { return true; }
    };
    check('createTilemap wirft: variants + anim am selben Eintrag',
      mkThrows(['##', '##'], { '#': { art: 'w', variants: ['w', 'x'], anim: ['w', 'x'] } }));
    check('createTilemap wirft: span (>1) + variants kombiniert',
      mkThrows(['..', '..'], { '.': { art: 'dot' }, x: { art: 'x', span: [2, 2], variants: ['x', 'y'] } }));
    check('createTilemap wirft: span-Zeichen (>1) in den GROUND-rows',
      mkThrows(['xx', 'xx'], { x: { art: 'x', span: [2, 2] } }));
    check('createTilemap wirft: variants[0] !== art',
      mkThrows(['..', '..'], { '.': { art: 'dot', variants: ['other', 'dot'] } }));
    check('createTilemap wirft: span [0,2] (ausserhalb 1..4)',
      mkThrows(['..', '..'], { '.': { art: 'dot' }, z: { art: 'z', span: [0, 2] } }));
  }

  // --- Span-Culling: Anker links-oberhalb des Viewports ragt hinein ---
  {
    const N = 10;
    const gRows = Array.from({ length: N }, () => '.'.repeat(N));
    const oGrid = Array.from({ length: N }, () => Array(N).fill('.'));
    oGrid[2][2] = 'M'; // ragt in den Viewport (Tiles 3..5)
    oGrid[0][0] = 'N'; // vollständig ausserhalb → gecullt
    const oRows = oGrid.map((r) => r.join(''));
    const legend = {
      '.': { art: 'grass' },
      M: { art: 'tree_canopy_2x2_a', span: [2, 2], solid: false },
      N: { art: 'tree_canopy_2x2_b', span: [2, 2], solid: false },
    };
    const tmC = createTilemap(gRows, legend, oRows);
    // Kamera (48,48), Viewport 32×32 → Tiles x3..5,y3..5; Culling erweitert auf 2..5.
    const drawnC = drawKeys(tmC, { x: 48, y: 48 }, 0, 'over', 32, 32);
    check('Span-Culling: Anker knapp links-oberhalb ragt in den Viewport (wird gezeichnet)',
      drawnC.includes('tree_canopy_2x2_a'));
    check('Span-Culling: Anker vollständig ausserhalb bleibt gecullt',
      !drawnC.includes('tree_canopy_2x2_b'));
  }

  // --- Wasser-Anim (Grafikpass 3 §2.2: 4-Frame-ZYKLUS statt Ping-Pong):
  //     FRAME-MITTEN + animSync ---
  {
    const wRows = ['####', '#~~#', '#~~#', '####'];
    const wLeg = {
      '#': { art: 'brick', solid: true },
      '~': { art: 'water', solid: false, anim: ['water', 'water_1', 'water_2', 'water_3'], animRate: 2, animSync: true },
    };
    const wm = createTilemap(wRows, wLeg);
    const frames = [0.25, 0.75, 1.25, 1.75].map((t) => {
      const ks = drawKeys(wm, { x: 0, y: 0 }, t, 'ground').filter((k) => String(k).startsWith('water'));
      return { key: ks[0], uniform: ks.length === 4 && ks.every((k) => k === ks[0]) };
    });
    check('Wasser-Anim 4-Frame-Zyklus: water→water_1→water_2→water_3 an den Frame-Mitten',
      frames.map((f) => f.key).join(',') === 'water,water_1,water_2,water_3');
    check('Wasser animSync: alle Wasser-Zellen zeigen zum selben t denselben Frame',
      frames.every((f) => f.uniform));
  }

  // --- Grid-Maße: 16×16 (Span-Kronen 32×32), alle Zeilen gleich lang ---
  {
    // Grafikpass 3 §5.2.2: um die drei gespiegelten Kronen (ebenfalls 32×32) auf
    // 6 Einträge erweitert — sonst schlägt die 16×16-Annahme auf ihnen fehl.
    const spanKeys = [
      'tree_canopy_2x2_a', 'tree_canopy_2x2_b', 'tree_canopy_2x2_c',
      'tree_canopy_2x2_am', 'tree_canopy_2x2_bm', 'tree_canopy_2x2_cm',
    ];
    let dimBad = null;
    for (const [name, grid] of Object.entries(TILE_ART)) {
      const size = spanKeys.includes(name) ? 32 : 16;
      if (grid.length !== size) { dimBad = `${name}: ${grid.length} Zeilen (erwartet ${size})`; break; }
      for (const row of grid) if (row.length !== size) { dimBad = `${name}: Zeilenbreite ${row.length} (erwartet ${size})`; break; }
      if (dimBad) break;
    }
    check('TILE_ART-Grids 16×16 (Span-Kronen 32×32), Zeilen gleich lang', dimBad === null, dimBad || '');
  }

  // --- Quelltext-Wächter: kein Zufall/Zeitstempel in world/*.js und art/*.js ---
  {
    let guardBad = null;
    for (const dir of ['../game/js/world/', '../game/js/art/']) {
      const dirUrl = new URL(dir, import.meta.url);
      for (const f of readdirSync(dirUrl)) {
        if (!f.endsWith('.js')) continue;
        const src = readFileSync(new URL(f, dirUrl), 'utf8');
        if (src.includes('Math.random') || src.includes('Date.now')) guardBad = `${dir}${f}`;
      }
    }
    check("Quelltext-Wächter: kein 'Math.random'/'Date.now' in world/*.js + art/*.js", guardBad === null, guardBad || '');
  }

  // --- Ground-rows-Freeze: keine Span-Anker-Zeichen in den vier ROWS-Arrays.
  //     Grafikpass 3 §5.2.2: additiv um die gespiegelten Anker Q/V/X erweitert. ---
  {
    let freezeBad = null;
    for (const def of [GRAVEYARD, CATACOMBS, FLUESTERGRUFT, BOSS_KAMMER]) {
      for (const row of def.rows) for (const ch of ['M', 'N', 'O', 'Q', 'V', 'X']) if (row.includes(ch)) freezeBad = ch;
    }
    check('Ground-rows-Freeze: keine M/N/O/Q/V/X-Zeichen in den vier ROWS-Arrays', freezeBad === null, freezeBad || '');
  }

  // --- Ufer-Umlenkung (§8a.3): Wasser-Target mit shorePrefix + Gras-Nachbar
  //     emittiert shore_*-Keys statt fringe_*; Moos-Ufer bleiben moss_fringe_*.
  //     Rein über den Render-Pfad (Proxy-Kachelquelle liefert jeden Key). ---
  {
    // Gras-Ufer: '~' trägt shorePrefix, ringsum '.' (Gras-Source, Set 'grass').
    const shoreLeg = {
      '.': { art: 'grass_dark', solid: false, fringeSource: true, fringeSet: 'grass' },
      '~': { art: 'water', solid: false, fringeTarget: true, shorePrefix: 'shore' },
    };
    const sm = createTilemap(['....', '.~~.', '.~~.', '....'], shoreLeg);
    const sk = drawKeys(sm, { x: 0, y: 0 }, 0, 'ground');
    check('Ufer-Umlenkung: Wasser-Target (shorePrefix) mit Gras-Nachbar liefert shore_*-Keys',
      sk.some((k) => String(k).startsWith('shore_')));
    check('Ufer-Umlenkung: am Gras-Ufer KEINE fringe_*-Keys mehr (Umlenkung greift)',
      !sk.some((k) => String(k).startsWith('fringe_')));
    // Moos-Ufer: Wasser-Target OHNE shorePrefix, '#' als Moos-Source ringsum.
    const mossLeg = {
      '#': { art: 'brick_wall', solid: true, fringeSource: true, fringeSet: 'moss' },
      '~': { art: 'water', solid: false, fringeTarget: true },
    };
    const mm = createTilemap(['####', '#~~#', '#~~#', '####'], mossLeg);
    const mk = drawKeys(mm, { x: 0, y: 0 }, 0, 'ground');
    check('Ufer-Umlenkung: Moos-Ufer bleibt moss_fringe_* (keine Umlenkung, kein shore_*)',
      mk.some((k) => String(k).startsWith('moss_fringe_')) && !mk.some((k) => String(k).startsWith('shore_')));
  }

  // --- Kronen-Schlagschatten (§8a.4): 2×2-Anker bei (ax,ay) → canopy_shadow im
  //     GROUND-Pass auf ax..ax+1 / Zeile ay+2; der Over-Pass zeichnet keinen. ---
  {
    const N = 8;
    const gRows = Array.from({ length: N }, () => '.'.repeat(N));
    const oGrid = Array.from({ length: N }, () => Array(N).fill('.'));
    oGrid[2][2] = 'M'; // Anker (2,2) → Schatten auf (2,4) und (3,4)
    const legend = {
      '.': { art: 'grass' },
      M: { art: 'tree_canopy_2x2_a', span: [2, 2], solid: false },
    };
    const tmS = createTilemap(gRows, legend, oGrid.map((r) => r.join('')));
    const shadowAt = [];
    const ctxS = {
      canvas: { width: N * 16, height: N * 16 },
      drawImage: (img, sx, sy) => { if (img === 'canopy_shadow') shadowAt.push([sx / 16, sy / 16]); },
    };
    tmS.draw(ctxS, { x: 0, y: 0 }, anyTiles, 0, 'ground');
    const hit = (x, y) => shadowAt.some(([sx, sy]) => sx === x && sy === y);
    check('Kronen-Schatten: canopy_shadow im GROUND-Pass unter der 2×2-Anker-Fläche (ay+2)',
      shadowAt.length === 2 && hit(2, 4) && hit(3, 4), `zellen=${JSON.stringify(shadowAt)}`);
    const overShadow = drawKeys(tmS, { x: 0, y: 0 }, 0, 'over').filter((k) => k === 'canopy_shadow');
    check('Kronen-Schatten: der Over-Pass zeichnet keinen canopy_shadow', overShadow.length === 0);
  }

  // --- Wasser-Tiefen-Overlay (§8b.1): synthetisches Wasserbecken. createTilemap
  //     leitet je Wasser-Tile die Chebyshev-Distanz zum naechsten Nicht-Wasser-
  //     Tile ab; der Ground-Pass legt water_shallow (Ufer-Ring, Distanz 1) und
  //     water_mid (naechster Ring, Distanz 2) drueber, tiefer (Distanz >=3) nichts.
  //     Rein ueber den Render-Pfad (Proxy-Kachelquelle) — art-unabhaengig. ---
  {
    // 7×7: Rand '#' (Land), inneres 5×5 '~' (Wasser). Ergibt einen Ufer-Ring
    // (16 Tiles, shallow), einen Mittel-Ring (8 Tiles, mid) und GENAU ein
    // Kern-Tile (Distanz 3, kein Overlay).
    const dRows = ['#######', '#~~~~~#', '#~~~~~#', '#~~~~~#', '#~~~~~#', '#~~~~~#', '#######'];
    const dLeg = {
      '#': { art: 'land', solid: true },
      '~': { art: 'water', solid: false, depthOverlays: ['water_shallow', 'water_mid'] },
    };
    const dm = createTilemap(dRows, dLeg);
    // Stub-Kontext, der NUR die beiden Tiefen-Overlay-Keys mit ihrer Ziel-Zelle
    // (sx/16, sy/16) protokolliert (das animierte Basis-Wasser wird ignoriert).
    const overlayCtx = (store) => ({
      canvas: { width: 7 * 16, height: 7 * 16 },
      drawImage: (img, sx, sy) => {
        if (img === 'water_shallow' || img === 'water_mid') store.set(`${sx / 16},${sy / 16}`, img);
      },
    });
    const at1 = new Map();
    dm.draw(overlayCtx(at1), { x: 0, y: 0 }, anyTiles, 0, 'ground');
    const ov = (x, y) => at1.get(`${x},${y}`);
    let nShallow = 0;
    let nMid = 0;
    for (const v of at1.values()) { if (v === 'water_shallow') nShallow++; else if (v === 'water_mid') nMid++; }
    check('Wasser-Tiefe: Ufer-Ring (Distanz 1) → water_shallow (16 Zellen)',
      ov(1, 1) === 'water_shallow' && ov(1, 3) === 'water_shallow' && ov(3, 5) === 'water_shallow' && nShallow === 16,
      `shallow=${nShallow}`);
    check('Wasser-Tiefe: naechster Ring (Distanz 2) → water_mid (8 Zellen)',
      ov(2, 2) === 'water_mid' && ov(2, 3) === 'water_mid' && ov(3, 2) === 'water_mid' && nMid === 8,
      `mid=${nMid}`);
    check('Wasser-Tiefe: Kern (Distanz >=3) → kein Tiefen-Overlay',
      ov(3, 3) === undefined && nShallow + nMid === 24, `mitte=${ov(3, 3)}`);
    check('Wasser-Tiefe: Land-Tiles tragen nie ein depthOverlay',
      ov(0, 0) === undefined && ov(6, 6) === undefined);
    // Determinismus: zweiter Draw zu ANDEREM timeSec → identische Overlay-Platzierung
    // (die Overlays sind statisch, keine Anim-Interaktion).
    const at2 = new Map();
    dm.draw(overlayCtx(at2), { x: 0, y: 0 }, anyTiles, 1.0, 'ground');
    const ser = (m) => [...m.entries()].sort().map(([k, v]) => `${k}:${v}`).join('|');
    check('Wasser-Tiefe: statisch + deterministisch (zwei Draws, verschiedene Zeit, identisch)',
      at2.size === 24 && ser(at1) === ser(at2));
  }

  // --- Grafikpass 3 §2.1 Nassrand (additiv): Wasser-Target mit shorePrefix +
  //     Moos-Quelle emittiert die moss_fringe_* WEITERHIN UND ZUSAETZLICH wet_*
  //     (nur Orthogonale). Ohne shorePrefix keine wet_*. Rein über den Render-
  //     Pfad (Proxy-Kachelquelle liefert jeden Key). ---
  {
    const wetLeg = {
      '#': { art: 'brick_wall', solid: true, fringeSource: true, fringeSet: 'moss' },
      '~': { art: 'water', solid: false, fringeTarget: true, shorePrefix: 'wet' },
    };
    const wetm = createTilemap(['####', '#~~#', '#~~#', '####'], wetLeg);
    const wk = drawKeys(wetm, { x: 0, y: 0 }, 0, 'ground');
    check('Nassrand: Moos-Ufer liefert weiterhin moss_fringe_*',
      wk.some((k) => String(k).startsWith('moss_fringe_')));
    check('Nassrand: shorePrefix=wet + Moos-Quelle liefert ZUSAETZLICH wet_* (nur Orthogonale)',
      ['wet_n', 'wet_e', 'wet_s', 'wet_w'].some((k) => wk.includes(k)) &&
      !wk.some((k) => /^wet_/.test(String(k)) && !/^wet_[nesw]$/.test(String(k))));
    const dryLeg = {
      '#': { art: 'brick_wall', solid: true, fringeSource: true, fringeSet: 'moss' },
      '~': { art: 'water', solid: false, fringeTarget: true },
    };
    const drym = createTilemap(['####', '#~~#', '#~~#', '####'], dryLeg);
    const dk = drawKeys(drym, { x: 0, y: 0 }, 0, 'ground');
    check('Nassrand: OHNE shorePrefix keine wet_*-Keys', !dk.some((k) => /^wet_/.test(String(k))));
  }

  // --- Grafikpass 3 §2.1 Anker-Jitter: deterministischer vertikaler Versatz
  //     variantIndex(tx,ty,5)-2 (-2..+2) auf Span-Anker; Culling +1 Tile oben. ---
  {
    const N = 12;
    const gRows = Array.from({ length: N }, () => '.'.repeat(N));
    const oGrid = Array.from({ length: N }, () => Array(N).fill('.'));
    const AX = 4, AY = 5;
    oGrid[AY][AX] = 'M';
    const legend = { '.': { art: 'grass' }, M: { art: 'tree_canopy_2x2_a', span: [2, 2], solid: false } };
    const tmJ = createTilemap(gRows, legend, oGrid.map((r) => r.join('')));
    const capSy = (store) => ({ canvas: { width: N * 16, height: N * 16 }, drawImage: (img, sx, sy) => { if (img === 'tree_canopy_2x2_a') store.v = sy; } });
    const s1 = {}; tmJ.draw(capSy(s1), { x: 0, y: 0 }, anyTiles, 0, 'over');
    const jy = variantIndex(AX, AY, 5) - 2;
    check('Anker-Jitter: sy = ty*16 + (variantIndex(tx,ty,5)-2)', s1.v === AY * 16 + jy, `sy=${s1.v} erwartet=${AY * 16 + jy}`);
    check('Anker-Jitter: Versatz deterministisch im Bereich -2..+2', jy >= -2 && jy <= 2);
    const s2 = {}; tmJ.draw(capSy(s2), { x: 0, y: 0 }, anyTiles, 0, 'over');
    check('Anker-Jitter: deterministisch (zwei Draws identisch)', s2.v === s1.v);
    // Culling +1 Tile oben: Kamera so, dass der Anker EINE Zeile oberhalb des
    // alten Kronen-Startfensters liegt — nur mit der GP3-Erweiterung wird er
    // noch erfasst (Jitter kann ihn in den Viewport schieben).
    const drawnJ = drawKeys(tmJ, { x: 48, y: (AY + 2) * 16 }, 0, 'over', 32, 32);
    check('Anker-Jitter: Kamera-Fenster erfasst gejitterte Anker (Culling +1 Tile oben)',
      drawnJ.includes('tree_canopy_2x2_a'));
  }
}

// ===========================================================================
// Abschnitt 36 "Gameplay-Neutralität GP3" (NEU, §5.2.3): Soliditaets-Raster +
// Geometrie (playerSpawn/alle Gegner-/Prop-Spawns/Portale/torch-findTiles-
// Positionen) aller 4 Maps gegen eingebettete Golden-Fingerprints von 204e28f
// (per git archive 204e28f generiert). Ambient-Werte exakt 0.45/0.78/0.85/0.66
// (die EINZIGEN erlaubten Zahlaenderungen, §4.2). particles.js: Node-Import,
// harte Obergrenze 60, update ohne Browser lauffaehig.
// ===========================================================================
{
  // Golden-Fingerprints aus 204e28f (sha256): sol = Soliditaets-Raster,
  // geo = JSON aus playerSpawn + skeleton/ghoul/enemy/prop-Spawns + Portalen +
  // torch-findTiles-Positionen. Beides ist gameplay-relevant und muss trotz der
  // Deko-/Riss-/Anim-/Tint-Aenderungen byte-identisch bleiben.
  const GOLD = {
    GRAVEYARD: { sol: '14cdbe36ad7ea26c9db037c826b6ba8b74475e529261129d41950e7cfb466b04', geo: '4c9372d0645b0743b6e80ed69dece913e3e62b156339bad96b6286d7a55b7f2e' },
    CATACOMBS: { sol: '82c22c6d845065371389f5e0ecb9ee498543740c06391b85719ada8568c4394c', geo: 'ce78746ee9e243c44d6a6bb3779c5ca535c7cee764096f8a5d29fa992269b9cb' },
    FLUESTERGRUFT: { sol: '0cca3204f83878b54c5390aa1bc9c4159424f5424b1a749d6dad4e47fc273489', geo: '2ac0a890e545869220fec7fa8256da51192c2bc4a07bc8d8d68fb7a669f6fa7c' },
    BOSS_KAMMER: { sol: 'ebe999cf1e6023c6d169fa24a205e224c1dc36e4424938063cdedf045c7d611c', geo: 'a7d72c33f00b83c8d974e5d3161ca2315b7d0a24aa77f24204f386bb558885eb' },
  };
  // Neue Ambient-Zielwerte (§4.2): GRAVEYARD unveraendert, CATACOMBS 0.82->0.78,
  // FLUESTERGRUFT unveraendert, BOSS_KAMMER 0.70->0.66.
  const AMBIENT = { GRAVEYARD: 0.45, CATACOMBS: 0.78, FLUESTERGRUFT: 0.85, BOSS_KAMMER: 0.66 };
  const sha = (s) => createHash('sha256').update(s).digest('hex');
  const solHash = (def) =>
    sha(def.rows.map((row) => [...row].map((ch) => (def.legend[ch] && def.legend[ch].solid ? '1' : '0')).join('')).join('\n'));
  const geoHash = (def) => {
    const tm = createTilemap(def.rows, def.legend, def.overRows || null);
    const torch = def.torchChars.map((ch) => [ch, tm.findTiles(ch)]);
    return sha(JSON.stringify({
      p: def.playerSpawn, sk: def.skeletonSpawns, gh: def.ghoulSpawns,
      en: def.enemySpawns || [], pr: def.propSpawns, po: def.portals, torch,
    }));
  };
  for (const name of Object.keys(GOLD)) {
    const def = MAPS[name];
    check(`§36 ${name}: Soliditaets-Raster byte-identisch zu 204e28f`, solHash(def) === GOLD[name].sol, solHash(def));
    check(`§36 ${name}: Spawns/Portale/torch-findTiles identisch zu 204e28f`, geoHash(def) === GOLD[name].geo, geoHash(def));
    check(`§36 ${name}: Ambient == ${AMBIENT[name]}`, Math.abs(def.ambient - AMBIENT[name]) < 1e-9, `ist ${def.ambient}`);
  }

  // particles.js (§2.4): Node-Import, harte Obergrenze 60, update ohne Browser.
  const parts = createParticles();
  check('§36 particles: createParticles liefert list/spawnEmbers/update/draw',
    !!parts && Array.isArray(parts.list) && typeof parts.spawnEmbers === 'function'
    && typeof parts.update === 'function' && typeof parts.draw === 'function');
  // dt=1 => SPAWN_RATE*dt >= 1 > Math.random() => jeder Aufruf spawnt, bis der Deckel greift.
  for (let i = 0; i < 300; i++) parts.spawnEmbers(100, 100, 1);
  check('§36 particles: harte Obergrenze 60 erzwungen', parts.list.length === 60, `list=${parts.list.length}`);
  let partThrew = null;
  try { for (let i = 0; i < 200; i++) parts.update(1 / 60); } catch (e) { partThrew = e.message; }
  check('§36 particles: update ohne Browser lauffaehig (kein Wurf)', partThrew === null, partThrew || '');
  check('§36 particles: Partikel altern und verlassen die Liste (< Obergrenze)', parts.list.length < 60, `list=${parts.list.length}`);
}

console.log(`\nSimulierte Ticks gesamt: ${totalTicks}`);
if (totalTicks < 600) failures.push(`Zu wenige Ticks simuliert: ${totalTicks} < 600`);

if (failures.length > 0) {
  console.error(`\nSMOKE-TEST ROT — ${failures.length} Fehler:`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log('SMOKE-TEST GRÜN');
