// Headless-Smoke-Test Slice 0 + 1 + 2: importiert NUR Module ohne Browser-
// Bezug auf Modulebene (world/entities/art/core/ui/items). Aufrufbar aus
// jedem CWD via node tools/smoke_test.mjs, Exit 0 = grün.

import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { PALETTE } from '../game/js/art/palette.js';
import { SPRITES, TILE_ART } from '../game/js/art/sprites.js';
// (erlaubte Alt-Test-Aenderung #5, GP4-§5): fringeOverlays + litDitherCells fuer
// die neuen Konkav-Shore-/Lit-Dither-/Back-Kronen-Tests importiert.
// (erlaubte Alt-Test-Aenderung #4, GP5-§6): shoreEdges/bankOverlays/
// waterReflections fuer die additiven Paket-B-Tests (a)-(c) importiert.
// anchorOffset wird BEWUSST NICHT importiert — Test #1 spiegelt die
// §4.C2-Formeln woertlich, damit eine Formel-Aenderung in tilemap.js auffliegt.
// (erlaubte Alt-Test-Aenderung, GP5-R3-Verdrahtungs-Nachzug): bankVariantFor
// zusaetzlich importiert — NUR fuer die neuen Bloecke (i)-(l) am Dateiende.
import { createTilemap, variantIndex, fringeOverlays, litDitherCells, shoreEdges, bankOverlays, bankVariantFor, waterReflections } from '../game/js/world/tilemap.js';
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
  // (erlaubte Alt-Test-Aenderung #4, GP4-§5): additive Existenz-Pruefung der
  // kompletten GP4-Interface-Liste (§3.7/§3.8/§2.8). Werden von Art-/Engine-
  // Buildern parallel geliefert; der generische Faenger (unten) verlangt jede
  // Legenden-art ohnehin — diese Liste deckt zusaetzlich die NICHT verlegten
  // Rotations-/Sway-/Decal-Keys ab.
  const gfx4Tiles = [
    'shore_ine', 'shore_inw', 'shore_ise', 'shore_isw',
    'licht_dither_1', 'licht_dither_2',
    'tree_canopy_back_a', 'tree_canopy_back_b', 'tree_canopy_back_c',
    'gravestone_4', 'gravestone_5',
    'grass_lumahi', 'grass_lumalo',
    'floor_decal_crack', 'floor_decal_bones',
    'torch_2', 'torch_wall_2',
    'grass_tuft_f1', 'grass_blade_f1',
    'grass_tuft_r1', 'grass_blade_r1', 'grass_speck_r1',
    'path_v4', 'path_v5',
  ];
  const missingG4 = gfx4Tiles.filter((k) => !TILE_ART[k]);
  check('Alle Grafikpass-4-TILE_ART-Schlüssel existieren', missingG4.length === 0, missingG4.join(','));
  // (erlaubte Alt-Test-Aenderung #3, GP5-§6): ADDITIVE Existenz-Pruefung des in
  // §9 EINGEFRORENEN GP5-Interfaces. Werden von Art parallel geliefert.
  {
    // §2.A1 GRAS-POOL: 47 Kacheln grass_g5_00..46 (Praefix-Zaehlung >= 47).
    const pool = Object.keys(TILE_ART).filter((k) => k.startsWith('grass_g5_'));
    check('GP5 §2.A1: Gras-Pool grass_g5_* hat >= 47 Kacheln',
      pool.length >= 47, `gefunden ${pool.length}`);
    const poolMissing = [];
    for (let i = 0; i < 47; i++) {
      const k = `grass_g5_${String(i).padStart(2, '0')}`;
      if (!TILE_ART[k]) poolMissing.push(k);
    }
    check('GP5 §2.A1: grass_g5_00..grass_g5_46 lueckenlos vorhanden',
      poolMissing.length === 0, poolMissing.join(','));
    // §3.B2/B3/B4: Uferband, Diagonal-Kappen, Kanal-Reflexion.
    const bankKeys = [];
    for (const side of ['n', 'e', 's', 'w', 'ne', 'nw', 'se', 'sw']) {
      for (const set of ['g', 's']) bankKeys.push(`bank_${side}_${set}`);
    }
    const capKeys = ['shore_cap_nw', 'shore_cap_ne', 'shore_cap_sw', 'shore_cap_se',
      'shore_cap_wn', 'shore_cap_en', 'shore_cap_ws', 'shore_cap_es'];
    const gfx5Tiles = [...bankKeys, ...capKeys, 'water_reflect_0', 'water_reflect_1'];
    const missingG5 = gfx5Tiles.filter((k) => !TILE_ART[k]);
    check('GP5 §3.B2/B3/B4: bank_*_g|s (16), shore_cap_* (8), water_reflect_0/_1 existieren',
      missingG5.length === 0, missingG5.join(','));
    // §2.A2 ZUSATZVARIANTEN (die neuen Grids der UNGERADE-n-Sweeps).
    const a2Tiles = [
      'brick_wall_v4', 'brick_wall_v5', 'brick_wall_v6',
      'stone_floor_v4', 'stone_floor_v5', 'stone_floor_v6', 'stone_floor_v7', 'stone_floor_v8',
      'path_v6', 'grass_tuft_v1',
    ];
    const missingA2 = a2Tiles.filter((k) => !TILE_ART[k]);
    check('GP5 §2.A2: alle Zusatzvarianten (brick_wall_v4-v6, stone_floor_v4-v8, path_v6, grass_tuft_v1) existieren',
      missingA2.length === 0, missingA2.join(','));
  }
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
      // (erlaubte Alt-Test-Aenderung #3, GP4-§5): + Back-Kronen (32x32, §2.8/§3.3a).
      'tree_canopy_back_a', 'tree_canopy_back_b', 'tree_canopy_back_c',
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
      // (erlaubte Alt-Test-Aenderung #2, GP4-§5): + 'Y','Z','A' (Back-Kronen-Anker,
      // nur GRAVEYARD_OVER_ROWS — duerfen wie die Front-Anker nie in Ground-rows).
      for (const row of def.rows) for (const ch of ['M', 'N', 'O', 'Q', 'V', 'X', 'Y', 'Z', 'A']) if (row.includes(ch)) freezeBad = ch;
    }
    check('Ground-rows-Freeze: keine M/N/O/Q/V/X/Y/Z/A-Zeichen in den vier ROWS-Arrays', freezeBad === null, freezeBad || '');
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
      drawImage: (img, sx, sy) => { if (img === 'canopy_shadow') shadowAt.push([sx, sy]); },
    };
    tmS.draw(ctxS, { x: 0, y: 0 }, anyTiles, 0, 'ground');
    // (erlaubte Alt-Test-Aenderung #1, GP5-§6 — SCHATTEN-HAELFTE der Anker-Formel):
    // §4.C2 verlangt, dass der canopy_shadow-Zeichenpfad DENSELBEN dx/dy anwendet
    // wie die Krone (sonst risse der Schatten bei bis zu ±14/±4 px sichtbar ab).
    // Der Test rechnete bisher sx/16 auf ganze Tiles zurueck und kann das
    // Pixel-Offset deshalb nicht mehr abbilden. Die Zell-Zuordnung (ax..ax+sw-1,
    // Zeile ay+sh) bleibt unveraendert geprueft — nur in PIXELN statt in Tiles,
    // und mit dem WOERTLICH aus §4.C2 gespiegelten Versatz des Ankers (2,2).
    const AS_X = 2, AS_Y = 2;
    const dxRawS = variantIndex(AS_X + 1013, AS_Y + 571, 29);
    const dx0S = dxRawS - 14;
    const W_S = 2; // 'M' = tree_canopy_2x2_a -> Anker-Klasse "Front _a/_am/_c/_cm"
    const dxS = Math.max(-W_S, Math.min(W_S, dx0S));
    const dyRawS = variantIndex(AS_X + 421, AS_Y + 907, 17);
    const dyS = (dyRawS % 9) - 4;
    const hit = (x, y) => shadowAt.some(([sx, sy]) => sx === x * 16 + dxS && sy === y * 16 + dyS);
    check('Kronen-Schatten: canopy_shadow im GROUND-Pass unter der 2×2-Anker-Fläche (ay+2), mit dem Anker-Offset §4.C2',
      shadowAt.length === 2 && hit(2, 4) && hit(3, 4),
      `zellen=${JSON.stringify(shadowAt)} erwartet dx=${dxS} dy=${dyS}`);
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

  // --- (erlaubte Alt-Test-Aenderung #1, GP5-§6) Grafikpass 5 §4.C2 ANKER-OFFSET.
  //     Der GP3-Jitter (vertikal, variantIndex(tx,ty,5)-2, -2..+2) ist ERSETZT
  //     durch einen ZWEIDIMENSIONALEN, pro Anker-KLASSE geklammerten Versatz.
  //     Die Formeln stehen hier WOERTLICH wie in Spec §4.C2 — sie werden NICHT
  //     aus tilemap.js importiert, damit jede Formel-Aenderung dort auffliegt:
  //       dxRaw = variantIndex(tx + 1013, ty + 571, 29)
  //       dx0   = dxRaw - 14                              // -14..+14
  //       dx    = clamp(dx0, -W, +W)                      // W je ANKER-KLASSE
  //       dyRaw = variantIndex(tx + 421, ty + 907, 17); dy = dyRaw % 9 - 4
  //     ANKER-KLASSEN: Back (Y/Z/A) W=14 | Front ohne Stammdeckung W=14 |
  //     Front _b/_bm W=6 | Front _a/_am/_c/_cm W=2. ---
  {
    const N = 12;
    const gRows = Array.from({ length: N }, () => '.'.repeat(N));
    const AX = 4, AY = 5;
    const mkOver = (ch) => {
      const g = Array.from({ length: N }, () => Array(N).fill('.'));
      g[AY][AX] = ch;
      return g.map((r) => r.join(''));
    };
    const legend = {
      '.': { art: 'grass' },
      M: { art: 'tree_canopy_2x2_a', span: [2, 2], solid: false },  // Klasse W=2
      N: { art: 'tree_canopy_2x2_b', span: [2, 2], solid: false },  // Klasse W=6
      Y: { art: 'tree_canopy_back_a', span: [2, 2], solid: false }, // Klasse W=14
      P: { art: 'crown_no_trunk', span: [2, 2], solid: false },     // Default W=14
    };
    // Formeln WOERTLICH aus §4.C2 (Klammerbreite W als Parameter):
    const dxOf = (tx, ty, W) => {
      const dxRaw = variantIndex(tx + 1013, ty + 571, 29);
      const dx0 = dxRaw - 14;
      return Math.max(-W, Math.min(W, dx0));
    };
    const dyOf = (tx, ty) => {
      const dyRaw = variantIndex(tx + 421, ty + 907, 17);
      return (dyRaw % 9) - 4;
    };
    const capXY = (tm, art) => {
      const store = {};
      tm.draw({ canvas: { width: N * 16, height: N * 16 }, drawImage: (img, sx, sy) => { if (img === art) { store.x = sx; store.y = sy; } } },
        { x: 0, y: 0 }, anyTiles, 0, 'over');
      return store;
    };
    const tmM = createTilemap(gRows, legend, mkOver('M'));
    const s1 = capXY(tmM, 'tree_canopy_2x2_a');
    const dxM = dxOf(AX, AY, 2);
    const dyA = dyOf(AX, AY);
    check('Anker-Offset §4.C2: sx = tx*16 + clamp(variantIndex(tx+1013,ty+571,29)-14, -W, +W)',
      s1.x === AX * 16 + dxM, `sx=${s1.x} erwartet=${AX * 16 + dxM} (W=2)`);
    check('Anker-Offset §4.C2: sy = ty*16 + (variantIndex(tx+421,ty+907,17) % 9 - 4)',
      s1.y === AY * 16 + dyA, `sy=${s1.y} erwartet=${AY * 16 + dyA}`);
    check('Anker-Offset §4.C2: dy-Bereich -4..+4', dyA >= -4 && dyA <= 4, `dy=${dyA}`);
    check('Anker-Offset §4.C2: dx-Bereich der Klasse Front _a (W=2)', dxM >= -2 && dxM <= 2, `dx=${dxM}`);
    const s2 = capXY(tmM, 'tree_canopy_2x2_a');
    check('Anker-Offset: deterministisch (zwei Draws identisch)', s2.x === s1.x && s2.y === s1.y);
    // ANKER-KLASSEN-TABELLE: derselbe Anker-Ort, andere Klasse -> andere Klammer.
    const sN = capXY(createTilemap(gRows, legend, mkOver('N')), 'tree_canopy_2x2_b');
    const sY = capXY(createTilemap(gRows, legend, mkOver('Y')), 'tree_canopy_back_a');
    const sP = capXY(createTilemap(gRows, legend, mkOver('P')), 'crown_no_trunk');
    check('Anker-Offset §4.C2: Klasse Front _b/_bm -> W=6',
      sN.x === AX * 16 + dxOf(AX, AY, 6), `sx=${sN.x} erwartet=${AX * 16 + dxOf(AX, AY, 6)}`);
    check('Anker-Offset §4.C2: Klasse Back (Y/Z/A) -> W=14',
      sY.x === AX * 16 + dxOf(AX, AY, 14), `sx=${sY.x} erwartet=${AX * 16 + dxOf(AX, AY, 14)}`);
    check('Anker-Offset §4.C2: unbekannter Anker (Front ohne Stammdeckung) -> Default W=14',
      sP.x === AX * 16 + dxOf(AX, AY, 14), `sx=${sP.x} erwartet=${AX * 16 + dxOf(AX, AY, 14)}`);
    check('Anker-Offset §4.C2: dy ist klassen-UNABHAENGIG (identisch fuer alle vier)',
      sN.y === s1.y && sY.y === s1.y && sP.y === s1.y);
    // CULLING (§4.C2, NUR der Over-Zweig): txStart 1 Spalte weiter links (dx>0
    // zieht Anker von links herein), tyEnd +1 (dy<0 zieht Anker von unten herein),
    // beide weiterhin auf 0..wTiles-1 / 0..hTiles-1 geklammert.
    const drawnJ = drawKeys(tmM, { x: 48, y: (AY + 2) * 16 }, 0, 'over', 32, 32);
    check('Anker-Offset: Kamera-Fenster erfasst versetzte Anker (Culling oben, Bestand GP3)',
      drawnJ.includes('tree_canopy_2x2_a'));
    {
      // txStart: Kamera bei tx0=6; Anker bei tx=4 = tx0-(maxSpanW-1)-1 -> nur mit
      // der GP5-Erweiterung im Fenster.
      const drawnL = drawKeys(tmM, { x: 6 * 16, y: AY * 16 }, 0, 'over', 32, 32);
      check('Anker-Offset §4.C2 Culling: txStart eine Spalte weiter links (dx>0 zieht von links herein)',
        drawnL.includes('tree_canopy_2x2_a'));
      // tyEnd: Kamera so, dass ty1 = AY-1 ist; nur mit tyEnd+1 wird der Anker erfasst.
      const drawnD = drawKeys(tmM, { x: AX * 16, y: (AY - 2) * 16 + 8 }, 0, 'over', 32, 24);
      check('Anker-Offset §4.C2 Culling: tyEnd +1 (dy<0 zieht von unten herein)',
        drawnD.includes('tree_canopy_2x2_a'));
      // Klammerung: Kamera am rechten/unteren Rand darf NICHT ueber cells[hTiles]
      // laufen (der Ground-Zweig teilt die Schleife) — ungeklammert = Absturz.
      let crashed = null;
      try {
        drawKeys(tmM, { x: (N - 2) * 16, y: (N - 2) * 16 }, 0, 'over', 320, 180);
        drawKeys(tmM, { x: (N - 2) * 16, y: (N - 2) * 16 }, 0, 'ground', 320, 180);
      } catch (e) { crashed = e.message; }
      check('Anker-Offset §4.C2 Culling: Grenzen bleiben geklammert (kein Zugriff ausserhalb der Map)',
        crashed === null, crashed || '');
    }
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
    // (erlaubte Alt-Test-Aenderung #1, GP4-§5): GRAVEYARD.sol neu erzeugt aus der
    // sanktionierten Teich-Umformung (§2.7a, .tmp/gen_gfx4.mjs). geo BLEIBT
    // byte-identisch (Spawns/Portale/torch-findTiles unberuehrt) — ein geo-Drift
    // waere ein STOPP-Signal.
    GRAVEYARD: { sol: '432b1c3217d1e70a560f98392f54fc29b021e3f86042283ee7fb5c4ec917b4a9', geo: '4c9372d0645b0743b6e80ed69dece913e3e62b156339bad96b6286d7a55b7f2e' },
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

// ===========================================================================
// (erlaubte Alt-Test-Aenderung #5, GP4-§5): drei additive NEUE Smoke-Tests.
// ===========================================================================
{
  // (a) Konkav-Shore-Emission gegen die §2.1-Wahrheitstabelle. fringeOverlays
  // ist rein: getDef(tx,ty) liefert je Nachbarschaft synthetisch das gewuenschte
  // Legenden-Verhalten. Das Ziel-Tile (0,0) traegt shorePrefix 'shore'; ein
  // Gras-Source-Nachbar ist { fringeSource:true, fringeSet:'grass' }.
  const WATER = { fringeTarget: true, shorePrefix: 'shore' };
  const GRASS = { fringeSource: true, fringeSet: 'grass' };
  // sides: Menge der Gras-Orthoseiten (n/e/s/w). Alle anderen Zellen = null.
  const emit = (sides) => {
    const getDef = (tx, ty) => {
      if (tx === 0 && ty === 0) return WATER;
      if (tx === 0 && ty === -1 && sides.includes('n')) return GRASS;
      if (tx === 1 && ty === 0 && sides.includes('e')) return GRASS;
      if (tx === 0 && ty === 1 && sides.includes('s')) return GRASS;
      if (tx === -1 && ty === 0 && sides.includes('w')) return GRASS;
      return null;
    };
    return fringeOverlays(getDef, 0, 0);
  };
  // 1 Seite -> Bestands-Ortho-Key (byte-gleich), KEIN i-Key.
  check('§5#5a Shore: genau 1 Seite (N) -> shore_n, kein Konkav-Key',
    JSON.stringify(emit(['n'])) === JSON.stringify(['shore_n']));
  check('§5#5a Shore: genau 1 Seite (W) -> shore_w, kein Konkav-Key',
    JSON.stringify(emit(['w'])) === JSON.stringify(['shore_w']));
  // 2 ADJAZENTE Seiten -> NUR der Konkav-Key (ERSETZUNGS-Fall, keine Ortho-Keys).
  const adjCases = [
    [['n', 'e'], 'shore_ine'], [['n', 'w'], 'shore_inw'],
    [['s', 'e'], 'shore_ise'], [['s', 'w'], 'shore_isw'],
  ];
  for (const [sides, key] of adjCases) {
    const out = emit(sides);
    check(`§5#5a Shore: 2 adjazente Seiten ${sides.join('+')} -> NUR ${key} (Ersetzung)`,
      out.length === 1 && out[0] === key && !out.some((k) => /^shore_[nesw]$/.test(k)),
      JSON.stringify(out));
  }
  // 2 OPPONIERTE Seiten -> Bestand (beide Ortho-Keys, KEIN i-Key).
  const ns = emit(['n', 's']);
  check('§5#5a Shore: 2 opponierte Seiten N+S -> beide Ortho-Keys, kein Konkav-Key',
    ns.includes('shore_n') && ns.includes('shore_s') && !ns.some((k) => /_in[ew]$|_is[ew]$/.test(k)),
    JSON.stringify(ns));
  const ew = emit(['e', 'w']);
  check('§5#5a Shore: 2 opponierte Seiten E+W -> beide Ortho-Keys, kein Konkav-Key',
    ew.includes('shore_e') && ew.includes('shore_w') && !ew.some((k) => /_in[ew]$|_is[ew]$/.test(k)),
    JSON.stringify(ew));

  // (b) litDitherCells-Determinismus (Import aus tilemap.js) + Stufen-Radien.
  const lights = [{ x: 40, y: 40, radius: 40, flicker: 0.5 }, { x: 120, y: 88, radius: 52, flicker: 0.8 }];
  const camera = { x: 0, y: 0 };
  const a = litDitherCells(lights, camera, 1.234, 320, 180);
  const b = litDitherCells(lights, camera, 1.234, 320, 180);
  check('§5#5b litDither: gleiche Args -> identische Liste (deterministisch)',
    JSON.stringify(a) === JSON.stringify(b) && a.length > 0);
  // (erlaubte Alt-Test-Aenderung #2, GP5-§6): Stufen-Radien 0.45/0.75 -> 0.40/0.70
  // (§5.D2 Stufen-Vereinheitlichung). Eine Zelle im Kern (dist < r*0.40) ist
  // Stufe 2, eine im Aussenring (r*0.40 <= dist < r*0.70) ist Stufe 1. Einzelne
  // ruhige Fackel (flicker 0) fuer exakte Radien. Die DIREKTAUFRUFE bleiben
  // FUENFARGUMENTIG — der isLit-Filter aus §1.7 ist optional (Regression).
  const one = [{ x: 40, y: 40, radius: 40, flicker: 0 }];
  const cells = litDitherCells(one, { x: 0, y: 0 }, 0, 320, 180);
  const at = (tx, ty) => cells.find((c) => c.tx === tx && c.ty === ty);
  // Tile (2,2) Zentrum (40,40) == Fackel -> dist 0 < 16 -> Stufe 2.
  check('§5#5b litDither: Zellzentrum auf der Fackel -> Stufe 2 (dist < r*0.40)',
    !!at(2, 2) && at(2, 2).stufe === 2);
  // r*0.40 = 16, r*0.70 = 28. Tile (1,2): Zentrum (24,40), dist=16 -> NICHT < 16
  // -> Stufe 1. Tile (0,2): Zentrum (8,40), dist=32 >= 28 -> keine Zelle.
  const stufe1 = cells.find((c) => c.stufe === 1);
  check('§5#5b litDither: Aussenring liefert Stufe-1-Zellen (r*0.40 <= dist < r*0.70)',
    !!stufe1);
  // keine Zelle ausserhalb r*0.70.
  const anyBadRadius = cells.some((c) => {
    const cx = c.tx * 16 + 8, cy = c.ty * 16 + 8;
    const d = Math.hypot(cx - 40, cy - 40);
    return d >= 40 * 0.70 + 1e-9;
  });
  check('§5#5b litDither: keine Zelle jenseits r*0.70', !anyBadRadius);
  check('§5#5b litDither: key via variantIndex(tx,ty,2) -> licht_dither_1/_2',
    cells.every((c) => c.key === (variantIndex(c.tx, c.ty, 2) === 0 ? 'licht_dither_1' : 'licht_dither_2')));
  // ADDITIV (erlaubte Alt-Test-Aenderung #2, GP5-§6): §1.7 WASSER-FILTER. Der
  // OPTIONALE 6. Parameter isLit(tx,ty) schliesst Zellen aus; fehlt er, ist das
  // Verhalten byte-gleich zu oben. Geprueft am echten Gruft-Kanal (Wasser =
  // shorePrefix/depthOverlays — dieselbe Wahrheit wie main.js litFilter).
  {
    const tmW = createTilemap(FLUESTERGRUFT.rows, FLUESTERGRUFT.legend);
    const isWaterCell = (tx, ty) => {
      const d = tmW.defAt(tx, ty);
      return !!d && !!(d.shorePrefix || d.depthOverlays);
    };
    const camW = { x: 14 * 16, y: 6 * 16 };
    const lightsW = [{ x: 20 * 16 + 8, y: 12 * 16 + 8, radius: 72, flicker: 1 }];
    const unfiltered = litDitherCells(lightsW, camW, 0.4, 320, 180);
    const filtered = litDitherCells(lightsW, camW, 0.4, 320, 180, (tx, ty) => !isWaterCell(tx, ty));
    check('§1.7 litDither-Filter: OHNE Filter liegen Wasser-Zellen im Kegel (Ausgangslage)',
      unfiltered.some((c) => isWaterCell(c.tx, c.ty)), `zellen=${unfiltered.length}`);
    check('§1.7 litDither-Filter: MIT Filter keine einzige Wasser-Zelle',
      filtered.length > 0 && !filtered.some((c) => isWaterCell(c.tx, c.ty)),
      `zellen=${filtered.length}`);
    check('§1.7 litDither-Filter: entfernt nur, fuegt nie hinzu (Teilmenge, Stufen unveraendert)',
      filtered.every((c) => unfiltered.some((u) => u.tx === c.tx && u.ty === c.ty && u.stufe === c.stufe && u.key === c.key)));
    check('§1.7 litDither-Filter: Direktaufruf mit 5 Argumenten unveraendert (Parameter optional)',
      JSON.stringify(litDitherCells(lightsW, camW, 0.4, 320, 180)) === JSON.stringify(unfiltered));
  }

  // (c) Back-Kronen-Z-Ordnung: Back-Anker (Y) EINE Zeile ueber dem Front-Anker (M)
  // muss VOR ihm gezeichnet werden (frueheres ty -> frueher im Draw-Loop -> Front
  // uebermalt Back). Reine Render-Reihenfolge ueber den Over-Pass.
  {
    const N = 10;
    const gRows = Array.from({ length: N }, () => '.'.repeat(N));
    const oGrid = Array.from({ length: N }, () => Array(N).fill('.'));
    oGrid[4][4] = 'Y'; // Back-Anker eine Zeile ueber ...
    oGrid[5][4] = 'M'; // ... dem Front-Anker
    const legend = {
      '.': { art: 'grass' },
      Y: { art: 'tree_canopy_back_a', span: [2, 2], solid: false },
      M: { art: 'tree_canopy_2x2_a', span: [2, 2], solid: false },
    };
    const tmZ = createTilemap(gRows, legend, oGrid.map((r) => r.join('')));
    const order = [];
    const ctxZ = { canvas: { width: N * 16, height: N * 16 }, drawImage: (img) => order.push(img) };
    tmZ.draw(ctxZ, { x: 0, y: 0 }, { tree_canopy_back_a: 'B', tree_canopy_2x2_a: 'F' }, 0, 'over');
    const iBack = order.indexOf('B');
    const iFront = order.indexOf('F');
    check('§5#5c Back-Kronen: Back-Anker zeichnet VOR dem Front-Anker (Z-Ordnung)',
      iBack >= 0 && iFront >= 0 && iBack < iFront, `back=${iBack} front=${iFront}`);
  }
}

// ===========================================================================
// (erlaubte Alt-Test-Aenderung #4, GP5-§6): sechs ADDITIVE NEUE Smoke-Tests
// (a)-(f) laut Spec §6.4. Kein Bestandstest wird dabei angefasst.
// ===========================================================================
{
  // Lokale Helfer (die gleichnamigen aus Abschnitt 35 sind dort block-scoped).
  const anyTiles5 = new Proxy({}, { get: (_, k) => k });
  const drawKeys5 = (tm, cam, timeSec, layer, cw = 320, ch = 180) => {
    const out = [];
    tm.draw({ canvas: { width: cw, height: ch }, drawImage: (img) => out.push(img) }, cam, anyTiles5, timeSec, layer);
    return out;
  };
  // --- (a) shoreEdges-KOMPLEMENT (§3.B1) + Diagonal-Kappen (§3.B3) ----------
  // shoreEdges emittiert NUR fuer Kanten, die fringeOverlays NICHT bedient:
  // orthogonale Nachbarn, die WEDER Wasser sind NOCH fringeSource tragen.
  {
    const WATER = { art: 'water', solid: false, fringeTarget: true, shorePrefix: 'shore' };
    const GRASS = { art: 'grass', solid: false, fringeSource: true, fringeSet: 'grass' };
    const STONE = { art: 'stone_floor', solid: false, fringeTarget: true }; // rohe Kante
    // Nachbarschaft synthetisch: cells = { 'dx,dy': def }, Ziel-Tile (0,0) = Wasser.
    const emitS = (cells) => {
      const getDef = (tx, ty) => (tx === 0 && ty === 0 ? WATER : (cells[`${tx},${ty}`] || null));
      return shoreEdges(getDef, 0, 0);
    };
    check('§6#4a shoreEdges: fringeSource-Nachbar (Gras) -> KEINE Emission (Komplement-Regel)',
      JSON.stringify(emitS({ '0,-1': GRASS })) === '[]', JSON.stringify(emitS({ '0,-1': GRASS })));
    check('§6#4a shoreEdges: Steinboden-Nachbar (rohe Kante) -> shore_n',
      JSON.stringify(emitS({ '0,-1': STONE })) === '["shore_n"]', JSON.stringify(emitS({ '0,-1': STONE })));
    check('§6#4a shoreEdges: Wasser-Nachbar -> keine Kante',
      JSON.stringify(emitS({ '0,-1': WATER })) === '[]');
    check('§6#4a shoreEdges: ausserhalb der Map (null) -> keine Kante',
      JSON.stringify(emitS({})) === '[]');
    check('§6#4a shoreEdges: Nicht-Wasser-Kachel liefert nie etwas',
      JSON.stringify(shoreEdges(() => STONE, 0, 0)) === '[]');
    // DIAGONAL-FALL (§3.B3): Nordkante liegt an Land, Westen UND Nordwesten sind
    // Wasser -> die gerade Nordkante laeuft diagonal weiter: shore_cap_nw.
    const capOut = emitS({ '0,-1': STONE, '-1,0': WATER, '-1,-1': WATER });
    check('§6#4a shoreEdges: Diagonal-Fall liefert ZUSAETZLICH den Cap-Key shore_cap_nw',
      capOut.includes('shore_n') && capOut.includes('shore_cap_nw'), JSON.stringify(capOut));
    // Ohne Wasser-Diagonale KEIN Cap (nur die gerade Kante).
    const noCap = emitS({ '0,-1': STONE, '-1,0': WATER, '-1,-1': STONE });
    check('§6#4a shoreEdges: ohne Wasser-Diagonale KEIN Cap-Key',
      !noCap.some((k) => k.startsWith('shore_cap_')), JSON.stringify(noCap));
    // Der Cap kommt auch, wenn die gerade Kante von fringeOverlays gezeichnet wird
    // (Gras-Nachbar): additiv, kein Ersetzen.
    const capG = emitS({ '0,-1': GRASS, '-1,0': WATER, '-1,-1': WATER });
    check('§6#4a shoreEdges: Cap ist additiv auch ueber einer fringeOverlays-Kante',
      JSON.stringify(capG) === '["shore_cap_nw"]', JSON.stringify(capG));
    // Realbezug: der Friedhofsteich hat an der Weg-Kante eine rohe Kante.
    const tmG = createTilemap(GRAVEYARD.rows, GRAVEYARD.legend);
    let rawEdges = 0;
    for (let ty = 0; ty < GRAVEYARD.rows.length; ty++) {
      for (let tx = 0; tx < GRAVEYARD.rows[0].length; tx++) {
        rawEdges += shoreEdges(tmG.defAt, tx, ty).filter((k) => /^shore_[nesw]$/.test(k)).length;
      }
    }
    check('§6#4a shoreEdges: der Friedhofsteich hat rohe Kanten (> 0 Emissionen auf der echten Map)',
      rawEdges > 0, `rohe Kanten=${rawEdges}`);
  }

  // --- (b) bankOverlays (§3.B2): bankSet-Logik, Wand ohne Flag -> leer -------
  {
    const WATER = { art: 'water', solid: false, shorePrefix: 'shore' };
    const GRASS = { art: 'grass', solid: false, bankSet: 'g' };
    const STONE = { art: 'stone_floor', solid: false, bankSet: 's' };
    const WALL = { art: 'brick_wall', solid: true, fringeSource: true, fringeSet: 'moss' }; // KEIN bankSet
    const emitB = (self, cells) => {
      const getDef = (tx, ty) => (tx === 0 && ty === 0 ? self : (cells[`${tx},${ty}`] || null));
      return bankOverlays(getDef, 0, 0);
    };
    check('§6#4b bankOverlays: Gras-Land mit Wasser im Osten -> bank_e_g',
      JSON.stringify(emitB(GRASS, { '1,0': WATER })) === '["bank_e_g"]',
      JSON.stringify(emitB(GRASS, { '1,0': WATER })));
    check('§6#4b bankOverlays: Steinboden-Land -> _s-Satz (kein Schlamm auf Stein)',
      JSON.stringify(emitB(STONE, { '0,1': WATER })) === '["bank_s_s"]',
      JSON.stringify(emitB(STONE, { '0,1': WATER })));
    check('§6#4b bankOverlays: ZIEGELWAND ohne bankSet-Flag -> LEER (kein Band auf Waenden)',
      JSON.stringify(emitB(WALL, { '1,0': WATER, '0,1': WATER })) === '[]',
      JSON.stringify(emitB(WALL, { '1,0': WATER, '0,1': WATER })));
    check('§6#4b bankOverlays: Wasser-Kachel selbst -> LEER (nur LAND-Kacheln)',
      JSON.stringify(emitB(WATER, { '1,0': WATER })) === '[]');
    check('§6#4b bankOverlays: Land ohne Wasser-Nachbarn -> LEER',
      JSON.stringify(emitB(GRASS, {})) === '[]');
    // Ecke nur, wenn KEINE der beiden angrenzenden Orthogonalen Wasser ist.
    check('§6#4b bankOverlays: reine Diagonal-Nachbarschaft -> Eckstueck bank_ne_g',
      JSON.stringify(emitB(GRASS, { '1,-1': WATER })) === '["bank_ne_g"]',
      JSON.stringify(emitB(GRASS, { '1,-1': WATER })));
    check('§6#4b bankOverlays: Ecke entfaellt, wenn eine Orthogonale das Band schon traegt',
      JSON.stringify(emitB(GRASS, { '1,0': WATER, '1,-1': WATER })) === '["bank_e_g"]',
      JSON.stringify(emitB(GRASS, { '1,0': WATER, '1,-1': WATER })));
    // Realbezug beider Maps: Gras am Teich traegt 'g', Steinboden am Kanal 's',
    // die Gruft-ZIEGELWAND am Kanal traegt nichts.
    const tmG = createTilemap(GRAVEYARD.rows, GRAVEYARD.legend);
    const tmF = createTilemap(FLUESTERGRUFT.rows, FLUESTERGRUFT.legend);
    const collect = (tm, def) => {
      const out = [];
      for (let ty = 0; ty < def.rows.length; ty++) {
        for (let tx = 0; tx < def.rows[0].length; tx++) out.push(...bankOverlays(tm.defAt, tx, ty));
      }
      return out;
    };
    const bg = collect(tmG, GRAVEYARD);
    const bf = collect(tmF, FLUESTERGRUFT);
    check('§6#4b bankOverlays: GRAVEYARD liefert NUR _g-Keys (> 0)',
      bg.length > 0 && bg.every((k) => k.endsWith('_g')), `n=${bg.length}`);
    check('§6#4b bankOverlays: FLUESTERGRUFT liefert NUR _s-Keys (> 0)',
      bf.length > 0 && bf.every((k) => k.endsWith('_s')), `n=${bf.length}`);
    check('§6#4b bankOverlays: alle emittierten Keys existieren in TILE_ART',
      [...new Set([...bg, ...bf])].every((k) => !!TILE_ART[k]),
      [...new Set([...bg, ...bf])].filter((k) => !TILE_ART[k]).join(','));
    // Ziegelwaende der Gruft grenzen an den Kanal — duerfen aber nie emittieren.
    let wallEmits = 0;
    for (let ty = 0; ty < FLUESTERGRUFT.rows.length; ty++) {
      for (let tx = 0; tx < FLUESTERGRUFT.rows[0].length; tx++) {
        if (FLUESTERGRUFT.rows[ty][tx] !== '#') continue;
        wallEmits += bankOverlays(tmF.defAt, tx, ty).length;
      }
    }
    check('§6#4b bankOverlays: keine einzige Emission auf einer Ziegelwand', wallEmits === 0, `n=${wallEmits}`);
  }

  // --- (c) waterReflections (§3.B4): Determinismus + NUR Wasser -------------
  {
    const tmF = createTilemap(FLUESTERGRUFT.rows, FLUESTERGRUFT.legend);
    const torches = tmF.findTiles('W').map((t) => ({ x: t.x, y: t.y, radius: 72, flicker: 1 }));
    const cam = { x: 0, y: 0 };
    const r1 = waterReflections(torches, tmF.defAt, cam, 1.25);
    const r2 = waterReflections(torches, tmF.defAt, cam, 1.25);
    check('§6#4c waterReflections: gleiche Argumente -> identische Liste (deterministisch)',
      JSON.stringify(r1) === JSON.stringify(r2) && r1.length > 0, `n=${r1.length}`);
    const isWaterD = (d) => !!d && !!(d.shorePrefix || d.depthOverlays);
    check('§6#4c waterReflections: jede Zelle ist eine WASSER-Kachel',
      r1.every((c) => isWaterD(tmF.defAt(c.tx, c.ty))));
    check('§6#4c waterReflections: jede Zelle nur EINMAL (kein Doppel-Draw)',
      new Set(r1.map((c) => `${c.tx},${c.ty}`)).size === r1.length);
    check('§6#4c waterReflections: Keys sind water_reflect_0/_1',
      r1.every((c) => c.key === 'water_reflect_0' || c.key === 'water_reflect_1'));
    check('§6#4c waterReflections: Wackeln ganzzahlig -1..+1, Screen-Koordinaten ganzzahlig',
      r1.every((c) => Number.isInteger(c.wob) && c.wob >= -1 && c.wob <= 1
        && Number.isInteger(c.sx) && Number.isInteger(c.sy)));
    // Fuell-Lichter (§5.D4, flicker 0.5) liegen UNTER der 0.8-Schwelle -> keine
    // Reflexion. Ebenso Spieler-/Drop-Lichter (0.3).
    const soft = torches.map((l) => ({ ...l, flicker: 0.5 }));
    check('§6#4c waterReflections: Lichter mit flicker < 0.8 werfen KEINE Reflexion',
      waterReflections(soft, tmF.defAt, cam, 1.25).length === 0);
    check('§6#4c waterReflections: ohne Lichter/ohne defAt -> leere Liste',
      waterReflections([], tmF.defAt, cam, 1.25).length === 0
      && waterReflections(torches, null, cam, 1.25).length === 0);
    // Der Friedhofsteich hat geometrisch KEINE orthogonal benachbarte Fackel
    // (Jury-Deklaration "Reflexion nur im Kanal") — Gegenprobe auf der echten Map.
    const tmG = createTilemap(GRAVEYARD.rows, GRAVEYARD.legend);
    const gTorch = tmG.findTiles('F').map((t) => ({ x: t.x, y: t.y, radius: 72, flicker: 1 }));
    check('§6#4c waterReflections: GRAVEYARD-Teich liefert 0 Zellen (Geometrie-Deklaration)',
      waterReflections(gTorch, tmG.defAt, cam, 1.25).length === 0);
  }

  // --- (d) SWAY-CLUSTER-GLEICHPHASE (§4.C4) ---------------------------------
  // Der Positions-Offset nicht-synchroner anim-Kacheln kommt aus dem 2x2-Block-
  // Hash variantIndex(floor(tx/2)+331, floor(ty/2)+733, 7): ein 2x2-Cluster
  // schwingt GLEICHSINNIG, benachbarte Cluster stehen gegeneinander versetzt.
  //
  // (erlaubte Alt-Test-Aenderung, GP5 RUNDE 2 — Engine-A, gemeldet):
  // Der R1-Test bildete den DEFEKT ab, den die Jury gemessen hat. Er verlangte
  // "mehr als ein Frame im Bild" AUSGERECHNET bei t = 0 — bei anim.length = 2
  // ist jeder ungerade Cluster-Versatz aber exakt eine ANTIPHASE (Juror M:
  // "+7 px oben, -7 px unten", "exakt 2 Zustaende"). Der R2-Fix (tilemap.js,
  // swayPhase) ersetzt den Frame-Umlauf durch eine 4-Phasen-Welle
  // SWAY_DX = [0,+1,0,-1], deren Cluster-Versatz ein BRUCHTEIL EINES SCHRITTES
  // ist (shift/7 < 1) — dadurch liegen zwei Cluster nie mehr als einen Schritt
  // auseinander und +1 kann NIE gegen -1 stehen. Bei t = 0 ruht das ganze Feld
  // (Schritt 0) — die Versatz-Pruefung wandert deshalb auf t = 0.4 (dort stehen
  // im 8x8-Fenster beide Frames), die Gleichphasen-Pruefung bleibt bei t = 0 und
  // wird bei t = 0.4 WIEDERHOLT. NEU dazu: die harte Vorzeichen-Pruefung, die
  // dem R1-Gate gefehlt hat.
  {
    const N = 8;
    const rowsSw = Array.from({ length: N }, () => 'w'.repeat(N));
    const legSw = { w: { art: 'sway_0', solid: false, anim: ['sway_0', 'sway_1'], animRate: 0.8 } };
    const tmSw = createTilemap(rowsSw, legSw);
    const keysAt = (t) => {
      const grid = [];
      const ctxSw = {
        canvas: { width: N * 16, height: N * 16 },
        drawImage: (img, sx, sy) => { grid.push({ tx: sx / 16, ty: sy / 16, img }); },
      };
      tmSw.draw(ctxSw, { x: 0, y: 0 }, anyTiles5, t, 'ground');
      const map = new Map();
      for (const g of grid) map.set(`${g.tx},${g.ty}`, g.img);
      return map;
    };
    // Gleichphase je 2x2-Cluster — bei t = 0 (Ruhelage) UND bei t = 0.4 (Boe).
    const clusterFrames = (g) => {
      let ok = true;
      const seen = new Set();
      for (let cy = 0; cy < N; cy += 2) {
        for (let cx = 0; cx < N; cx += 2) {
          const v = g.get(`${cx},${cy}`);
          seen.add(v);
          for (const [dx, dy] of [[1, 0], [0, 1], [1, 1]]) {
            if (g.get(`${cx + dx},${cy + dy}`) !== v) ok = false;
          }
        }
      }
      return { ok, seen };
    };
    const g0 = keysAt(0);
    const g4 = keysAt(0.4);
    const c0 = clusterFrames(g0);
    const c4 = clusterFrames(g4);
    check('§6#4d Sway: jedes 2x2-Cluster zeigt denselben Frame (GLEICHSINNIG)', c0.ok && c4.ok);
    check('§6#4d Sway: benachbarte Cluster stehen versetzt (mehr als ein Frame im Bild, t=0.4)',
      c4.seen.size > 1, `frames=${[...c4.seen].join(',')}`);
    check('§6#4d Sway: bei t=0 ruht das ganze Feld auf anim[0] (definierte Ruhelage)',
      c0.seen.size === 1 && c0.seen.has('sway_0'), `frames=${[...c0.seen].join(',')}`);
    // Formel woertlich gespiegelt (§4.C4 R2): 4-Phasen-Welle SWAY_DX=[0,1,0,-1],
    // Schrittrate = animRate*2, Cluster-Versatz = BRUCHTEIL eines Schrittes.
    const SWAY_DX_T = [0, 1, 0, -1];
    const stepAt = (tx, ty, t) => {
      const shift = variantIndex(Math.floor(tx / 2) + 331, Math.floor(ty / 2) + 733, 7);
      return ((Math.floor(t * (0.8 * 2) + shift / 7) % 4) + 4) % 4;
    };
    let formulaOk = true;
    for (const [t, g] of [[0, g0], [0.4, g4]]) {
      for (let ty = 0; ty < N; ty++) {
        for (let tx = 0; tx < N; tx++) {
          const dx = SWAY_DX_T[stepAt(tx, ty, t)];
          const want = legSw.w.anim[dx > 0 ? 1 : 0]; // n=2: kein Links-Frame vorhanden
          if (g.get(`${tx},${ty}`) !== want) formulaOk = false;
        }
      }
    }
    check('§6#4d Sway: Frame folgt SWAY_DX[(floor(t*rate*2 + variantIndex(floor(tx/2)+331, floor(ty/2)+733, 7)/7)) % 4]',
      formulaOk);
    // HARTE VORZEICHEN-PRUEFUNG (das fehlende R1-Gate): ueber einen ganzen
    // Zyklus darf NIE ein Cluster nach links auslenken, waehrend ein anderer
    // nach rechts auslenkt.
    let signClash = 0;
    for (let i = 0; i < 40; i++) {
      const t = i * 0.0625;
      const signs = new Set();
      for (let ty = 0; ty < N; ty++) {
        for (let tx = 0; tx < N; tx++) signs.add(Math.sign(SWAY_DX_T[stepAt(tx, ty, t)]));
      }
      if (signs.has(1) && signs.has(-1)) signClash++;
    }
    check('§6#4d Sway: NIE Gegenphase im Bild (+1 und -1 nie gleichzeitig, 40 Ticks)',
      signClash === 0, `ticks mit Gegenphase=${signClash}`);
    // Wasser (animSync) bleibt unberuehrt: alle Zellen im selben Frame.
    const legSync = { '~': { art: 'w0', solid: false, anim: ['w0', 'w1', 'w2', 'w3'], animRate: 3, animSync: true } };
    const tmSync = createTilemap(Array.from({ length: 4 }, () => '~~~~'), legSync);
    const syncKeys = new Set(drawKeys5(tmSync, { x: 0, y: 0 }, 0.4, 'ground'));
    check('§6#4d Sway: animSync-Kacheln (Wasser) bleiben synchron (ein Frame)', syncKeys.size === 1);
  }

  // --- (e) n-UNGERADE-WAECHTER ueber ALLE Legenden-variants (§2.A2) ---------
  {
    const evenN = [];
    const headBad = [];
    const missing = [];
    for (const [name, def] of Object.entries(MAPS)) {
      for (const [ch, cell] of Object.entries(def.legend)) {
        if (!cell.variants) continue;
        if (cell.variants.length % 2 === 0) evenN.push(`${name}:'${ch}'=${cell.variants.length}`);
        if (cell.variants[0] !== cell.art) headBad.push(`${name}:'${ch}'`);
        for (const k of cell.variants) if (!TILE_ART[k]) missing.push(`${name}:'${ch}':${k}`);
      }
    }
    check('§6#4e n-UNGERADE-Waechter: KEINE Legenden-variants-Liste mit geradem n',
      evenN.length === 0, evenN.join(' '));
    check('§6#4e Varianten-Integritaet: variants[0] === art in allen vier Legenden',
      headBad.length === 0, headBad.join(' '));
    check('§6#4e Varianten-Keys existieren alle in TILE_ART', missing.length === 0, missing.join(' '));
    // §6.5 Varianten-Integritaets-Regel: die '.'-Legende zieht den vollen Pool.
    const dot = GRAVEYARD.legend['.'];
    check("§6#4e Gras-Pool: '.'-art === grass_g5_00 === variants[0]",
      dot.art === 'grass_g5_00' && dot.variants[0] === 'grass_g5_00', `art=${dot.art}`);
    check("§6#4e Gras-Pool: '.'-variants sind genau die 47 Pool-Kacheln (keine Dublette)",
      dot.variants.length === 47 && new Set(dot.variants).size === 47
      && dot.variants.every((k) => /^grass_g5_\d\d$/.test(k)), `n=${dot.variants.length}`);
    // ',' und 'e' ziehen UNGERADE TEIL-Pools (Dichte-Naht, §2.A1).
    for (const ch of [',', 'e']) {
      const cell = GRAVEYARD.legend[ch];
      check(`§6#4e Teil-Pool '${ch}': ungerades n und mindestens eine Pool-Kachel`,
        !!cell.variants && cell.variants.length % 2 === 1
        && cell.variants.some((k) => /^grass_g5_\d\d$/.test(k)),
        `n=${cell.variants ? cell.variants.length : 0}`);
    }
    // §3.B2 bankSet-Verdrahtung: Gras/Weg 'g', Gruft-Steinboden 's', Waende nichts.
    check("§6#4e bankSet: GRAVEYARD '.'/'=' tragen 'g'",
      GRAVEYARD.legend['.'].bankSet === 'g' && GRAVEYARD.legend['='].bankSet === 'g');
    check("§6#4e bankSet: FLUESTERGRUFT '.' traegt 's'", FLUESTERGRUFT.legend['.'].bankSet === 's');
    const flaggedWalls = [];
    for (const [name, def] of Object.entries(MAPS)) {
      for (const [ch, cell] of Object.entries(def.legend)) {
        if (cell.solid && cell.bankSet) flaggedWalls.push(`${name}:'${ch}'`);
        if (cell.bankSet && cell.bankSet !== 'g' && cell.bankSet !== 's') flaggedWalls.push(`${name}:'${ch}'=${cell.bankSet}`);
      }
    }
    check('§6#4e bankSet: KEINE solide Kachel (Wand/Baum/Grabstein) traegt ein Flag',
      flaggedWalls.length === 0, flaggedWalls.join(' '));
    // §5.D4 extraLights: nur BOSS_KAMMER, flicker unter der 0.8-Fackel-Schwelle.
    check('§6#4e extraLights: BOSS_KAMMER hat genau 1 Fuell-Licht mit flicker 0.5',
      Array.isArray(BOSS_KAMMER.extraLights) && BOSS_KAMMER.extraLights.length === 1
      && BOSS_KAMMER.extraLights[0].flicker === 0.5
      && BOSS_KAMMER.extraLights[0].radius > 0,
      JSON.stringify(BOSS_KAMMER.extraLights));
    check('§6#4e extraLights: alle Fuell-Lichter liegen UNTER der 0.8-Schwelle (kein Warm-Glow/Lit-Dither)',
      Object.values(MAPS).every((d) => (d.extraLights || []).every((l) => (l.flicker || 0) < 0.8)));
    // §1.8: alle vier Maps fahren jetzt 3-Frame-Fackeln.
    const torch2 = [];
    for (const [name, def] of Object.entries(MAPS)) {
      for (const ch of def.torchChars) {
        const cell = def.legend[ch];
        if (!cell.anim || cell.anim.length !== 3) torch2.push(`${name}:'${ch}'=${cell.anim ? cell.anim.length : 0}`);
      }
    }
    check('§6#4e §1.8: alle Fackel-Legenden laufen auf 3 Frames', torch2.length === 0, torch2.join(' '));
  }

  // --- (f) defAt-EXPORT (§1.7 additive API) ---------------------------------
  {
    const tmD = createTilemap(GRAVEYARD.rows, GRAVEYARD.legend, GRAVEYARD.overRows);
    check('§6#4f createTilemap exportiert defAt', typeof tmD.defAt === 'function');
    check('§6#4f defAt liefert den GROUND-Legendeneintrag der Zelle',
      tmD.defAt(0, 0) === GRAVEYARD.legend['#'] && tmD.defAt(3, 12) === GRAVEYARD.legend['=']);
    check('§6#4f defAt liefert ausserhalb der Map null',
      tmD.defAt(-1, 0) === null && tmD.defAt(0, -1) === null
      && tmD.defAt(GRAVEYARD.rows[0].length, 0) === null
      && tmD.defAt(0, GRAVEYARD.rows.length) === null);
    check('§6#4f defAt ist GROUND-only (kein Over-Layer-Eintrag)',
      tmD.defAt(37, 0) === GRAVEYARD.legend[GRAVEYARD.rows[0][37]]);
  }

  // =========================================================================
  // GRAFIKPASS 5 RUNDE 3 — ADDITIVE Tests (Engine-A). NUR NEUE Bloecke, kein
  // Bestandstest angefasst; fringeOverlays (~1905-1950) bleibt byte-identisch.
  // Beide Mechaniken sind neu und ohne Test nicht abgesichert (R3-Liste 1+2e).
  // =========================================================================

  // --- (g) bankOverlays-UNTERDRUECKUNG (R3-Liste 2a, Teich-Balken-Bug) ------
  // Landkacheln, die gegenueberliegende Wasser-Orthonachbarn haben (N+S oder
  // E+W) oder >= 3 Wasser-Orthonachbarn, sind Einbuchtungs-/Zungen-/Land-
  // brueckenzellen: sie bekommen GAR KEIN Uferband mehr (auch keine Ecken),
  // sonst treffen sich zwei Baender in der Kachelmitte und lesen als Balken
  // quer durch das Wasser.
  {
    const LAND_G = { art: 'grass', solid: false, bankSet: 'g' };
    const WATER = { art: 'water', solid: false, shorePrefix: 'shore' };
    // getDef fuer eine 3x3-Nachbarschaft um (0,0): Wasser genau an den in
    // `set` genannten Richtungen, sonst Land mit bankSet 'g'.
    const nb = (dirs) => (x, y) => {
      if (x === 0 && y === 0) return LAND_G;
      const name = `${x},${y}`;
      return dirs.includes(name) ? WATER : LAND_G;
    };
    const N = '0,-1', S = '0,1', E = '1,0', W = '-1,0';
    check('§6#4g bankOverlays R3: Wasser N+S (Landbruecke) -> KEIN Band',
      bankOverlays(nb([N, S]), 0, 0).length === 0,
      JSON.stringify(bankOverlays(nb([N, S]), 0, 0)));
    check('§6#4g bankOverlays R3: Wasser E+W (Landbruecke) -> KEIN Band',
      bankOverlays(nb([E, W]), 0, 0).length === 0,
      JSON.stringify(bankOverlays(nb([E, W]), 0, 0)));
    check('§6#4g bankOverlays R3: 3 Wasser-Orthonachbarn (Zunge) -> KEIN Band',
      bankOverlays(nb([N, E, S]), 0, 0).length === 0,
      JSON.stringify(bankOverlays(nb([N, E, S]), 0, 0)));
    check('§6#4g bankOverlays R3: 4 Wasser-Orthonachbarn (Insel) -> KEIN Band',
      bankOverlays(nb([N, E, S, W]), 0, 0).length === 0);
    // Gegenprobe: die echten Ufer-Faelle bleiben unveraendert bedient.
    check('§6#4g bankOverlays R3: EINE Wasserseite -> Band wie bisher',
      JSON.stringify(bankOverlays(nb([N]), 0, 0)) === '["bank_n_g"]',
      JSON.stringify(bankOverlays(nb([N]), 0, 0)));
    check('§6#4g bankOverlays R3: zwei BENACHBARTE Seiten (Innenecke) -> beide Baender',
      JSON.stringify(bankOverlays(nb([N, E]), 0, 0)) === '["bank_n_g","bank_e_g"]',
      JSON.stringify(bankOverlays(nb([N, E]), 0, 0)));
    // Auf den echten Karten darf die Regel nie eine Kachel treffen, die sie
    // NICHT treffen soll: jede verbleibende Emission hat <= 2 Wasserseiten und
    // nie zwei gegenueberliegende.
    {
      const isW = (d) => !!(d && (d.shorePrefix || d.depthOverlays));
      let bad = 0;
      for (const def of [GRAVEYARD, CATACOMBS, FLUESTERGRUFT, BOSS_KAMMER]) {
        const tm = createTilemap(def.rows, def.legend, def.overRows || null);
        for (let ty = 0; ty < def.rows.length; ty++) {
          for (let tx = 0; tx < def.rows[0].length; tx++) {
            if (bankOverlays(tm.defAt, tx, ty).length === 0) continue;
            const n = isW(tm.defAt(tx, ty - 1));
            const s = isW(tm.defAt(tx, ty + 1));
            const e = isW(tm.defAt(tx + 1, ty));
            const w = isW(tm.defAt(tx - 1, ty));
            const c = [n, e, s, w].filter(Boolean).length;
            if ((n && s) || (e && w) || c >= 3) bad++;
          }
        }
      }
      check('§6#4g bankOverlays R3: auf allen vier Karten emittiert KEINE Einbuchtungs-/Bruecken-Zelle mehr',
        bad === 0, `verbleibende=${bad}`);
    }
  }

  // --- (h) DEPTH-OVERLAY-VARIANTEN (R3-Liste 2e) ----------------------------
  // Der depthArt-Pass waehlt je Zelle deterministisch zwischen Basis-Key,
  // `${Basis}_v1` und `${Basis}_v2` (variantIndex(tx+617, ty+293, 3)). Die
  // Variante wird NUR gezeichnet, wenn die Kachelquelle sie wirklich fuehrt —
  // fehlt sie, bleibt es bei der Basis (Bestandsverhalten).
  {
    const dRows5 = ['#######', '#~~~~~#', '#~~~~~#', '#~~~~~#', '#~~~~~#', '#~~~~~#', '#######'];
    const dLeg5 = {
      '#': { art: 'land', solid: true },
      '~': { art: 'water', solid: false, depthOverlays: ['water_shallow', 'water_mid_calm'] },
    };
    const dm5 = createTilemap(dRows5, dLeg5);
    // Kachelquelle als PLAIN OBJECT (kein Proxy): nur diese Keys existieren.
    const srcFull = {};
    for (const k of ['water', 'land', 'water_shallow', 'water_shallow_v1', 'water_shallow_v2',
      'water_mid_calm', 'water_mid_calm_v1', 'water_mid_calm_v2']) srcFull[k] = k;
    const srcBase = {};
    for (const k of ['water', 'land', 'water_shallow', 'water_mid_calm']) srcBase[k] = k;
    const depthKeys = (src, t) => {
      const out = [];
      dm5.draw({
        canvas: { width: 7 * 16, height: 7 * 16 },
        drawImage: (img, sx, sy) => {
          if (String(img).startsWith('water_shallow') || String(img).startsWith('water_mid_calm')) {
            out.push(`${sx / 16},${sy / 16}:${img}`);
          }
        },
      }, { x: 0, y: 0 }, src, t, 'ground');
      return out;
    };
    const full0 = depthKeys(srcFull, 0);
    const full1 = depthKeys(srcFull, 1.75);
    const base0 = depthKeys(srcBase, 0);
    check('§6#4h Depth-Varianten: die 24 Tiefenzellen bleiben vollzaehlig',
      full0.length === 24 && base0.length === 24, `voll=${full0.length} basis=${base0.length}`);
    check('§6#4h Depth-Varianten: liefert die Kachelquelle _v1/_v2 NICHT, wird still die Basis gezeichnet',
      base0.every((s) => /:(water_shallow|water_mid_calm)$/.test(s)));
    const variantsUsed = new Set(full0.map((s) => s.split(':')[1]));
    check('§6#4h Depth-Varianten: mit vollstaendiger Kachelquelle stehen mehrere Auspraegungen im Bild',
      variantsUsed.size >= 4, [...variantsUsed].join(','));
    check('§6#4h Depth-Varianten: jede Auspraegung gehoert zu ihrem Ring-Basis-Key',
      [...variantsUsed].every((k) => /^(water_shallow|water_mid_calm)(_v[12])?$/.test(k)),
      [...variantsUsed].join(','));
    check('§6#4h Depth-Varianten: RENDER-DETERMINISMUS (zwei Zeitpunkte, identische Zuordnung)',
      full0.join('|') === full1.join('|'));
    // Formel woertlich gespiegelt: variantIndex(tx+617, ty+293, 3), 0 = Basis.
    let formulaOk5 = true;
    for (const entry of full0) {
      const [cell, key] = entry.split(':');
      const [cx5, cy5] = cell.split(',').map(Number);
      const vi = variantIndex(cx5 + 617, cy5 + 293, 3);
      const base = key.replace(/_v[12]$/, '');
      if (key !== (vi === 0 ? base : `${base}_v${vi}`)) formulaOk5 = false;
    }
    check('§6#4h Depth-Varianten: Key folgt variantIndex(tx+617, ty+293, 3) (0 = Basis, 1/2 = _v1/_v2)',
      formulaOk5);
    check('§6#4h Depth-Varianten: n = 3 ist UNGERADE und teilerfremd zu 5/7/17/29/47',
      3 % 2 === 1 && [5, 7, 17, 29, 47].every((m) => m % 3 !== 0));
  }

  // =========================================================================
  // GP5 RUNDE 3 — VERDRAHTUNGS-NACHZUG. Wieder NUR NEUE Bloecke; kein
  // Bestandstest angefasst, fringeOverlays (~1905-1950) byte-identisch.
  // Alle drei Mechaniken waren als ART fertig und ohne Emission wirkungslos.
  // =========================================================================

  // --- (i) shore_diag-EMISSION an den Teich-AUSSENECKEN (§2b) ---------------
  // Eine WASSER-Kachel, deren senkrechter UND waagerechter Nachbar Land ist und
  // deren Diagonale dazwischen ebenfalls Land ist, ist eine Aussenecke des
  // Beckens: dort ersetzt eine 45-Grad-Treppe die 90-Grad-Kontur.
  {
    const POND = { art: 'water', solid: false, fringeTarget: true, shorePrefix: 'shore' };
    const CANAL = { art: 'water_v', solid: false, fringeTarget: true, shorePrefix: 'wet' };
    const GRASS6 = { art: 'grass', solid: false, fringeSource: true, fringeSet: 'grass' };
    // Ziel-Tile (0,0) = Wasser, Nachbarn aus `cells`, Rest Wasser (= keine Ecke).
    const emitD = (self, cells) => shoreEdges(
      (tx, ty) => (tx === 0 && ty === 0 ? self : (cells[`${tx},${ty}`] || POND)), 0, 0,
    ).filter((k) => k.startsWith('shore_diag_'));
    const N6 = '0,-1', S6 = '0,1', E6 = '1,0', W6 = '-1,0';
    check('§6#4i shore_diag: Land N + Land E + Land NE -> shore_diag_ne',
      JSON.stringify(emitD(POND, { [N6]: GRASS6, [E6]: GRASS6, '1,-1': GRASS6 })) === '["shore_diag_ne"]',
      JSON.stringify(emitD(POND, { [N6]: GRASS6, [E6]: GRASS6, '1,-1': GRASS6 })));
    check('§6#4i shore_diag: Land S + Land W + Land SW -> shore_diag_sw',
      JSON.stringify(emitD(POND, { [S6]: GRASS6, [W6]: GRASS6, '-1,1': GRASS6 })) === '["shore_diag_sw"]',
      JSON.stringify(emitD(POND, { [S6]: GRASS6, [W6]: GRASS6, '-1,1': GRASS6 })));
    check('§6#4i shore_diag: Diagonale WASSER (Innenecke) -> KEINE Treppe',
      emitD(POND, { [N6]: GRASS6, [E6]: GRASS6 }).length === 0,
      JSON.stringify(emitD(POND, { [N6]: GRASS6, [E6]: GRASS6 })));
    check('§6#4i shore_diag: nur EINE Landseite (gerade Kante) -> KEINE Treppe',
      emitD(POND, { [N6]: GRASS6 }).length === 0);
    check('§6#4i shore_diag: Kartenrand (null-Nachbar) -> KEINE Treppe',
      shoreEdges((tx, ty) => (tx === 0 && ty === 0 ? POND
        : (`${tx},${ty}` === E6 ? GRASS6 : null)), 0, 0).filter((k) => k.startsWith('shore_diag_')).length === 0);
    // MATERIAL-GATE: die vier Kacheln backen eine GRAS-Landzunge ein. Am
    // Gruft-KANAL (shorePrefix 'wet', Stein/Ziegel ringsum) waere das ein
    // Material-Fehler -> dort bewusst KEINE Emission.
    check('§6#4i shore_diag: shorePrefix wet (Gruft-Kanal) emittiert NIE eine Gras-Treppe',
      emitD(CANAL, { [N6]: GRASS6, [E6]: GRASS6, '1,-1': GRASS6 }).length === 0);
    // Realbezug + Regression: der Friedhofsteich hat genau die zehn
    // Treppen-Aussenecken seiner Kontur, die Gruft keine einzige.
    const tmG6 = createTilemap(GRAVEYARD.rows, GRAVEYARD.legend);
    const tmF6 = createTilemap(FLUESTERGRUFT.rows, FLUESTERGRUFT.legend);
    const countDiag = (tm, def) => {
      let n = 0;
      for (let ty = 0; ty < def.rows.length; ty++) {
        for (let tx = 0; tx < def.rows[0].length; tx++) {
          n += shoreEdges(tm.defAt, tx, ty).filter((k) => k.startsWith('shore_diag_')).length;
        }
      }
      return n;
    };
    check('§6#4i shore_diag: GRAVEYARD-Teich emittiert die Treppen-Aussenecken (10)',
      countDiag(tmG6, GRAVEYARD) === 10, `n=${countDiag(tmG6, GRAVEYARD)}`);
    check('§6#4i shore_diag: FLUESTERGRUFT emittiert KEINE (Material-Gate)',
      countDiag(tmF6, FLUESTERGRUFT) === 0, `n=${countDiag(tmF6, FLUESTERGRUFT)}`);
    check('§6#4i shore_diag: alle vier Art-Keys existieren',
      ['ne', 'nw', 'se', 'sw'].every((d) => !!TILE_ART[`shore_diag_${d}`]));
  }

  // --- (j) TEICH-BALKEN-ECHTFIX: Treppen-Innenecken tragen kein Band --------
  // Die R2-Regel (gegenueberliegende Wasserseiten / >= 3 Wasser-Orthonachbarn)
  // traf auf den echten Karten KEINE Zelle. Der Balken kam aus der
  // TREPPEN-INNENECKE: zwei benachbarte Wasserseiten UND Wasser-Diagonale
  // dazwischen. Genau dort liegt jetzt die 45-Grad-Treppe von der Wasserseite.
  {
    const LAND6 = { art: 'grass', solid: false, bankSet: 'g' };
    const WAT6 = { art: 'water', solid: false, shorePrefix: 'shore' };
    const nb6 = (dirs) => (x, y) => {
      if (x === 0 && y === 0) return LAND6;
      return dirs.includes(`${x},${y}`) ? WAT6 : LAND6;
    };
    check('§6#4j bankOverlays: Wasser N+E UND Wasser NE (Treppen-Innenecke) -> KEIN Band',
      bankOverlays(nb6(['0,-1', '1,0', '1,-1']), 0, 0).length === 0,
      JSON.stringify(bankOverlays(nb6(['0,-1', '1,0', '1,-1']), 0, 0)));
    check('§6#4j bankOverlays: Wasser S+W UND Wasser SW -> KEIN Band',
      bankOverlays(nb6(['0,1', '-1,0', '-1,1']), 0, 0).length === 0);
    // Gegenprobe: zwei benachbarte Wasserseiten mit LAND-Diagonale sind KEINE
    // Treppe (zwei getrennte Wasserarme) — das Band bleibt wie im Bestand.
    check('§6#4j bankOverlays: zwei benachbarte Wasserseiten mit LAND-Diagonale -> Baender bleiben',
      JSON.stringify(bankOverlays(nb6(['0,-1', '1,0']), 0, 0)) === '["bank_n_g","bank_e_g"]',
      JSON.stringify(bankOverlays(nb6(['0,-1', '1,0']), 0, 0)));
    // Realbezug: keine verbleibende Bandkachel ragt noch als Zacken ins Becken.
    {
      const isW6 = (d) => !!(d && (d.shorePrefix || d.depthOverlays));
      let zacken = 0;
      for (const def of [GRAVEYARD, CATACOMBS, FLUESTERGRUFT, BOSS_KAMMER]) {
        const tm = createTilemap(def.rows, def.legend, def.overRows || null);
        for (let ty = 0; ty < def.rows.length; ty++) {
          for (let tx = 0; tx < def.rows[0].length; tx++) {
            if (bankOverlays(tm.defAt, tx, ty).length === 0) continue;
            for (const [ax, ay, bx, by] of [[0, -1, 1, 0], [0, -1, -1, 0], [0, 1, 1, 0], [0, 1, -1, 0]]) {
              if (isW6(tm.defAt(tx + ax, ty + ay)) && isW6(tm.defAt(tx + bx, ty + by))
                && isW6(tm.defAt(tx + ax + bx, ty + ay + by))) zacken++;
            }
          }
        }
      }
      check('§6#4j bankOverlays: auf allen vier Karten traegt KEINE Treppen-Innenecke mehr ein Band',
        zacken === 0, `verbleibende=${zacken}`);
    }
  }

  // --- (k) UFER-ZAHN-VARIANTEN: bankVariantFor (§5) -------------------------
  // bankOverlays beantwortet weiter "WELCHE Baender" (kanonische Key-Familie,
  // alle Bestandstests unberuehrt), bankVariantFor "welches Pixel-Grid".
  {
    check('§6#4k bankVariantFor: Keys OHNE Variantentabelle bleiben unveraendert',
      ['bank_e_g', 'bank_s_g', 'bank_w_g', 'bank_ne_g', 'bank_n_s', 'bank_s_s']
        .every((k) => bankVariantFor(k, 7, 11) === k));
    const keys6 = new Set();
    for (let ty = 0; ty < 40; ty++) for (let tx = 0; tx < 40; tx++) keys6.add(bankVariantFor('bank_n_g', tx, ty));
    check('§6#4k bankVariantFor: bank_n_g zieht Basis + alle drei Zahn-Varianten',
      keys6.size === 4 && [...keys6].every((k) => /^bank_n_g(_v[123])?$/.test(k)),
      [...keys6].join(','));
    check('§6#4k bankVariantFor: alle gezogenen Keys existieren in TILE_ART',
      [...keys6].every((k) => !!TILE_ART[k]));
    check('§6#4k bankVariantFor: deterministisch (zwei Aufrufe, gleiches Ergebnis)',
      bankVariantFor('bank_n_g', 34, 18) === bankVariantFor('bank_n_g', 34, 18));
    // n = 7: UNGERADE und teilerfremd zu allen anderen n am selben Ort
    // (3 Tiefen-Overlay, 5 Anker-Jitter/Weg-Legende, 17/29 Anker, 47 Gras-Pool).
    check('§6#4k bankVariantFor: n = 7 ist UNGERADE und teilerfremd zu 3/5/17/29/47',
      7 % 2 === 1 && [3, 5, 17, 29, 47].every((m) => m % 7 !== 0 && 7 % m !== 0));
    // Realbezug: die vier zusammenhaengenden Suedufer-Kacheln des Teichs
    // (34..37, 18) ziehen VERSCHIEDENE Grids — genau der Defekt "das Band endet
    // in jeder Kachel auf derselben Zeile" ist damit gebrochen.
    const sued = [34, 35, 36, 37].map((tx) => bankVariantFor('bank_n_g', tx, 18));
    check('§6#4k bankVariantFor: die vier Suedufer-Kacheln (34..37,18) ziehen 4 verschiedene Grids',
      new Set(sued).size === 4, sued.join(','));
  }

  // --- (l) water_mid_v1/_v2: der Gruft-Kanal zieht echte Tiefen-Varianten ---
  // Der depthArt-Pass war schon in R3 verdrahtet, aber water_mid_v1/_v2 gab es
  // nicht — der Kanal fiel auf die Basis zurueck (graceful degradation) und war
  // der einzige Wasserkoerper mit ungebrochener 16px-Wiederholung.
  {
    check('§6#4l water_mid-Varianten: beide Art-Keys existieren und sind 16x16',
      ['water_mid_v1', 'water_mid_v2'].every((k) => TILE_ART[k] && TILE_ART[k].length === 16
        && TILE_ART[k].every((r) => r.length === 16)));
    check('§6#4l water_mid-Varianten: paarweise verschieden von der Basis und voneinander',
      TILE_ART.water_mid_v1.join('') !== TILE_ART.water_mid.join('')
      && TILE_ART.water_mid_v2.join('') !== TILE_ART.water_mid.join('')
      && TILE_ART.water_mid_v1.join('') !== TILE_ART.water_mid_v2.join(''));
    // Die harten Kanal-Regeln (Jury R2) gelten auch fuer die Varianten.
    for (const k of ['water_mid_v1', 'water_mid_v2']) {
      const g = TILE_ART[k];
      let hMax = 0, vMin = 99, vMax = 0, leer = 0;
      for (let y = 0; y < 16; y++) {
        let run = 0;
        for (let x = 0; x < 32; x++) { if (g[y][x % 16] !== '.') { run++; if (run > hMax) hMax = run; } else run = 0; }
      }
      for (let x = 0; x < 16; x++) {
        let best = 0, run = 0;
        for (let y = 0; y < 32; y++) { if (g[y % 16][x] !== '.') { run++; if (run > best) best = run; } else run = 0; }
        if (best === 0) leer++; else { if (best < vMin) vMin = best; if (best > vMax) vMax = best; }
      }
      check(`§6#4l ${k}: kein waagerechter Lauf > 2 (Anti-Haken/T)`, hMax <= 2, `max=${hMax}`);
      check(`§6#4l ${k}: senkrechte Laeufe 3-9 px, jede Spalte traegt eine Glyphe`,
        leer === 0 && vMin >= 3 && vMax <= 9, `leer=${leer} min=${vMin} max=${vMax}`);
      check(`§6#4l ${k}: kein Schwarz-Ton 'k' (Wasser-Grundton statt Schwarz)`, !g.join('').includes('k'));
    }
    // Realbezug: die FLUESTERGRUFT zieht sie im Ground-Pass wirklich.
    {
      const tmF6 = createTilemap(FLUESTERGRUFT.rows, FLUESTERGRUFT.legend, FLUESTERGRUFT.overRows || null);
      const srcReal = {};
      for (const kk of Object.keys(TILE_ART)) srcReal[kk] = kk;
      const seen6 = new Set();
      tmF6.draw({
        canvas: { width: tmF6.wPx, height: tmF6.hPx },
        drawImage: (img) => { if (String(img).startsWith('water_mid')) seen6.add(String(img)); },
      }, { x: 0, y: 0 }, srcReal, 0, 'ground');
      check('§6#4l water_mid-Varianten: der Gruft-Kanal zeichnet Basis UND _v1 UND _v2',
        seen6.has('water_mid') && seen6.has('water_mid_v1') && seen6.has('water_mid_v2'),
        [...seen6].join(','));
    }
  }
}

console.log(`\nSimulierte Ticks gesamt: ${totalTicks}`);
if (totalTicks < 600) failures.push(`Zu wenige Ticks simuliert: ${totalTicks} < 600`);

if (failures.length > 0) {
  console.error(`\nSMOKE-TEST ROT — ${failures.length} Fehler:`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log('SMOKE-TEST GRÜN');
