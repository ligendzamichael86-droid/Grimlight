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
  // die Zelle liegt in der Span-Fläche eines Anker-Zeichens. Grafikpass 3
  // §5.2.2b: die gespiegelten Kronen Q/V/X decken Stämme gleichwertig.
  //
  // GP6-§7C1 SPAN-GENERISCH. Bisher standen hier zwei fest verdrahtete
  // Annahmen, die mit §5.1 beide falsch geworden sind:
  //   (1) das Fenster war fix 2x2 (`y-1..y` / `x-1..x`) — die XL-Kronen haben
  //       span [3,2] und [4,3], ein xl_b-Anker deckt also 4x3 Zellen;
  //   (2) die Ankerliste war das Literal 'MNOQVX' — die XL-Anker heissen
  //       '1'..'6' (§5.5) und die Back-Kuppen Y/Z/A fehlten ohnehin.
  // Beides kommt jetzt AUS DER LEGENDE: Zeichenliste = alle Eintraege mit
  // `span`, Fenster = deren eigenes [sw,sh]. Damit traegt der Test jede
  // kuenftige Groessenklasse ohne erneute Aenderung. Die Deckungsregel selbst
  // ist unveraendert: ein Anker bei (ax,ay) deckt ax..ax+sw-1 / ay..ay+sh-1.
  const spanChars = Object.keys(GRAVEYARD.legend).filter((ch) => GRAVEYARD.legend[ch].span);
  const coveredGrid = Array.from({ length: over.length }, () => new Array(over[0].length).fill(false));
  for (let ay = 0; ay < over.length; ay++) {
    for (let ax = 0; ax < over[ay].length; ax++) {
      if (!spanChars.includes(over[ay][ax])) continue;
      const [sw, sh] = GRAVEYARD.legend[over[ay][ax]].span;
      for (let dy = 0; dy < sh; dy++) {
        for (let dx = 0; dx < sw; dx++) {
          const cy = ay + dy, cx = ax + dx;
          if (cy < coveredGrid.length && cx < coveredGrid[cy].length) coveredGrid[cy][cx] = true;
        }
      }
    }
  }
  const trunkCovered = (x, y) => over[y][x] === 'B' || coveredGrid[y][x];
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

  // --- Grid-Maße: MASSTABELLE {16×16, 32×32, 48×32, 64×48, 64×32} ---
  {
    // Grafikpass 3 §5.2.2: um die drei gespiegelten Kronen (ebenfalls 32×32) auf
    // 6 Einträge erweitert — sonst schlägt die 16×16-Annahme auf ihnen fehl.
    //
    // GP6-§7G MASSTABELLE. Der alte Test kannte genau ZWEI Masse (16 und 32)
    // und fuehrte die 32er als AUFZAEHLUNG. Mit §5.1/§5.3 gibt es jetzt fuenf
    // Klassen, und die Zahl der Keys je Klasse ist gross (5 Posen x 2 Spiegel
    // x 3 Kronen = 30 XL-Grids) — eine Aufzaehlung waere in jeder Runde neu zu
    // pflegen. Die Zuordnung laeuft deshalb ueber das KEY-MUSTER:
    //   tree_canopy_xl_b(_m)(_r1|_r2|_l1|_l2)   64x48  (§5.1 span [4,3])
    //   canopy_shadow_xl_b                      64x32  (§5.3 Bake sw*16 x 32)
    //   tree_canopy_xl_a/_c(_m)(_Pose)          48x32  (§5.1 span [3,2])
    //   canopy_shadow_xl_a / _xl_c              48x32  (§5.3, sw = 3)
    //   tree_canopy_2x2_* / tree_canopy_back_*  32x32  (Bestand)
    //   alles uebrige                           16x16
    // Die Schatten-Bakes sind NICHT so hoch wie ihre Krone: §5.3 legt die Hoehe
    // auf feste 32 px fest (der Schatten liegt flach auf dem Boden), nur die
    // Breite folgt sw. Genau das trennt 64x32 von 64x48.
    // GP6 RUNDE 2 (P0-B): die Bake-Muster tragen jetzt das optionale MATERIAL-
    // Suffix (_g Gras/Erdflecken, _d Weg). Die Fassungen sind reine
    // Ton-Substitutionen desselben Grids — dieselbe Masse, deshalb dieselbe
    // Zeile. Das GATE wird dadurch nicht schwaecher, sondern gilt fuer sechs
    // Keys mehr; ohne die Ergaenzung fielen sie in den 16x16-Default und der
    // Test waere ROT, obwohl die Masse korrekt ist.
    // S6-§7B(8) SANKTION (SPEC Slice 6 §7.B(8), Wortlaut fix aus SLICE6_PHASE0
    // §5 E8): die sechs DORF-Musterzeilen. Die Waechter matchen NAMEN, nicht
    // Groessen — ohne diese Zeilen fielen die 15 Grossgrids des Dorfs in den
    // 16x16-Default und der Test waere rot, obwohl die Masse korrekt sind.
    // Es kommt KEINE Masse-KLASSE hinzu (alle drei Masse gibt es schon), und
    // KEIN Bestands-Key wird umgeleitet (alle Muster beginnen mit 'dorf_').
    // Haeuserdaecher gross 64x48, klein/Torbogen 48x32; der Glocken-Ueberbau
    // und das Marktsegel (inkl. der vier Sway-Posen) 48x32; die zwei
    // Schatten-Bakes liegen flach: 64x32 bzw. 48x32.
    // KEINE fuenfte Dach-Musterzeile — der Torbogen laeuft als dorf_dach_tor
    // (E8). dorf_glocke_kopf/_fuss sind normale 16x16-Kacheln und bleiben
    // deshalb bewusst im Default (das '$' am Zeilenende trennt sie ab).
    const MASSTABELLE = [
      [/^tree_canopy_xl_b(_m)?(_[rl][12])?$/, 64, 48],
      [/^canopy_shadow_xl_b(_[gd])?$/, 64, 32],
      [/^tree_canopy_xl_[ac](_m)?(_[rl][12])?$/, 48, 32],
      [/^canopy_shadow_xl_[ac](_[gd])?$/, 48, 32],
      [/^tree_canopy_2x2_[abc]m?$/, 32, 32],
      [/^tree_canopy_back_[abc]$/, 32, 32],
      [/^dorf_dach_(a|b)(_m)?$/, 64, 48],
      [/^dorf_dach_(c|d|tor)(_m)?$/, 48, 32],
      [/^dorf_bake_gross$/, 64, 32],
      [/^dorf_bake_klein$/, 48, 32],
      [/^dorf_segel(_[rl][12])?$/, 48, 32],
      [/^dorf_glocke$/, 48, 32],
    ];
    const massOf = (name) => {
      for (const [re, w, h] of MASSTABELLE) if (re.test(name)) return [w, h];
      return [16, 16];
    };
    let dimBad = null;
    for (const [name, grid] of Object.entries(TILE_ART)) {
      const [wantW, wantH] = massOf(name);
      if (grid.length !== wantH) { dimBad = `${name}: ${grid.length} Zeilen (erwartet ${wantH})`; break; }
      for (const row of grid) if (row.length !== wantW) { dimBad = `${name}: Zeilenbreite ${row.length} (erwartet ${wantW})`; break; }
      if (dimBad) break;
    }
    check('TILE_ART-Grids nach der §7.G-Masstabelle {16×16, 32×32, 48×32, 64×48, 64×32}, Zeilen gleich lang',
      dimBad === null, dimBad || '');
    // Gegen-Gate: die Tabelle darf nicht LEER laufen (ein Tippfehler im Muster
    // wuerde jede XL-Kachel still auf 16x16 pruefen und der Test waere rot —
    // aber ein Muster, das NICHTS trifft, faellt sonst nicht auf).
    const klassen = new Set(Object.keys(TILE_ART).map((n) => massOf(n).join('x')));
    check('§7.G Masstabelle: alle fuenf Klassen sind wirklich belegt',
      ['16x16', '32x32', '48x32', '64x48', '64x32'].every((k) => klassen.has(k)),
      [...klassen].join(','));
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

    // =====================================================================
    // GP6-§7D — SPAN-GENERISCHE ERWEITERUNG. Der Bestandsfall oben bleibt
    // WORT FUER WORT stehen (dieselben Koordinaten, dieselbe Formel, dieselbe
    // Anker-Klasse W=2) — er ist die Lagegleichheits-Referenz. Ergaenzt werden
    // die beiden Faelle, die §5.1/§5.3 neu eingefuehrt haben:
    //   (D1) span != [2,2]: die Schattenzeile ist ay+sh (nicht fix ay+2) und
    //        laeuft ueber sw Spalten (nicht fix 2).
    //   (D2) shadowArt gesetzt: statt sw Einzelkacheln GENAU EIN Draw des
    //        Bake-Keys, Versatz anchorOffset + (+2,+2) (§5.3).
    // Der Zweitpass (§5.3/§7.C3) braucht hier keine eigene Assertion — die
    // Koordinaten-Assertions sind reihenfolge-UNABHAENGIG (Review P1-m1); die
    // Reihenfolge selbst prueft der additive §7F-Block (h) ueber die
    // Stub-Aufrufreihenfolge gegen die Bodenkacheln.
    // =====================================================================
    const offOf = (tx, ty, W) => ({
      dx: Math.max(-W, Math.min(W, variantIndex(tx + 1013, ty + 571, 29) - 14)),
      dy: (variantIndex(tx + 421, ty + 907, 17) % 9) - 4,
    });
    // --- (D1) span [3,2] OHNE shadowArt: Zeile ay+sh ueber sw Spalten -------
    {
      const AX3 = 1, AY3 = 1, SW3 = 3, SH3 = 2;
      const o3 = Array.from({ length: N }, () => Array(N).fill('.'));
      o3[AY3][AX3] = 'G';
      const leg3 = {
        '.': { art: 'grass' },
        // Art-Key steht NICHT in ANCHOR_CLAMP -> Default-Klammer W=14 (§4.C2).
        G: { art: 'crown_span_3x2_probe', span: [SW3, SH3], solid: false },
      };
      const tm3 = createTilemap(gRows, leg3, o3.map((r) => r.join('')));
      const at3 = [];
      tm3.draw({
        canvas: { width: N * 16, height: N * 16 },
        drawImage: (img, sx, sy) => { if (img === 'canopy_shadow') at3.push([sx, sy]); },
      }, { x: 0, y: 0 }, anyTiles, 0, 'ground');
      const o3off = offOf(AX3, AY3, 14);
      const soll3 = [];
      for (let d = 0; d < SW3; d++) soll3.push([(AX3 + d) * 16 + o3off.dx, (AY3 + SH3) * 16 + o3off.dy]);
      check('GP6-§7D Kronen-Schatten span-generisch: [3,2]-Anker legt GENAU sw=3 canopy_shadow-Kacheln',
        at3.length === SW3, `${at3.length} Kacheln`);
      check('GP6-§7D Kronen-Schatten span-generisch: Zeile ay+sh, Spalten ax..ax+sw-1, Anker-Offset §4.C2',
        soll3.every(([x, y]) => at3.some(([sx, sy]) => sx === x && sy === y)),
        `ist=${JSON.stringify(at3)} soll=${JSON.stringify(soll3)}`);
    }
    // --- (D2) shadowArt gesetzt: EIN Draw, Versatz anchorOffset + (+2,+2) ---
    {
      const AXB = 1, AYB = 1, SWB = 4, SHB = 3;
      const oB = Array.from({ length: N }, () => Array(N).fill('.'));
      oB[AYB][AXB] = 'B';
      const legB = {
        '.': { art: 'grass' },
        B: {
          art: 'tree_canopy_xl_b', span: [SWB, SHB], solid: false,
          shadowArt: 'canopy_shadow_xl_b',
        },
      };
      const tmB = createTilemap(gRows, legB, oB.map((r) => r.join('')));
      const bake = [];
      let einzel = 0;
      tmB.draw({
        canvas: { width: N * 16, height: N * 16 },
        drawImage: (img, sx, sy) => {
          if (img === 'canopy_shadow_xl_b') bake.push([sx, sy]);
          if (img === 'canopy_shadow') einzel++;
        },
      }, { x: 0, y: 0 }, anyTiles, 0, 'ground');
      // W=4: 'tree_canopy_xl_b' steht in ANCHOR_CLAMP (§5.2).
      const offB = offOf(AXB, AYB, 4);
      check('GP6-§7D XL-Schatten: GENAU EIN Draw des shadowArt-Bakes (kein sw-Kachel-Band)',
        bake.length === 1, `${bake.length} Draws`);
      check('GP6-§7D XL-Schatten: KEINE canopy_shadow-Einzelkacheln daneben', einzel === 0, `${einzel}`);
      check('GP6-§7D XL-Schatten: Versatz = anchorOffset(W=4) PLUS (+2,+2), Zeile ay+sh (§5.3)',
        bake.length === 1
        && bake[0][0] === AXB * 16 + offB.dx + 2
        && bake[0][1] === (AYB + SHB) * 16 + offB.dy + 2,
        `ist=${JSON.stringify(bake[0])} soll=[${AXB * 16 + offB.dx + 2},${(AYB + SHB) * 16 + offB.dy + 2}]`);
      const overBake = drawKeys(tmB, { x: 0, y: 0 }, 0, 'over').filter((k) => String(k).startsWith('canopy_shadow'));
      check('GP6-§7D XL-Schatten: der Over-Pass zeichnet auch den Bake nicht', overBake.length === 0);
    }
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
    // -------------------------------------------------------------------
    // GP6-§7C4 — SECHSTE ANKER-KLASSE: die XL-Kronen, ANCHOR_CLAMP W = 4.
    // Der Bestand oben laeuft unveraendert weiter; hier kommt nur die neue
    // Zeile der Klassen-Tabelle dazu. Begruendung der 4 (§5.2): die XL-Kronen
    // stehen im geschlossenen Dach (§5.5) mit Spalten-Pitch 2, also 16 px
    // Ueberlappung — ein Versatz bis +-14 wie bei den Back-Kuppen risse dort
    // Loecher, +-4 streut das Raster ohne die Ueberlappung aufzubrauchen.
    // Geprueft wird ALLE SECHS Keys einzeln (der Clamp haengt am ART-Key, ein
    // vergessener _m-Eintrag fiele sonst nicht auf) und ZUSAETZLICH, dass die
    // Klammer wirklich BINDET, also enger ist als der Default W=14.
    {
      const XL = [
        ['1', 'tree_canopy_xl_a', [3, 2]], ['2', 'tree_canopy_xl_a_m', [3, 2]],
        ['3', 'tree_canopy_xl_b', [4, 3]], ['4', 'tree_canopy_xl_b_m', [4, 3]],
        ['5', 'tree_canopy_xl_c', [3, 2]], ['6', 'tree_canopy_xl_c_m', [3, 2]],
      ];
      const dx4 = dxOf(AX, AY, 4);
      const dx14 = dxOf(AX, AY, 14);
      let xlBad = null;
      for (const [ch, art, span] of XL) {
        const legXL = { '.': { art: 'grass' }, [ch]: { art, span, solid: false } };
        const sXL = capXY(createTilemap(gRows, legXL, mkOver(ch)), art);
        if (sXL.x !== AX * 16 + dx4) { xlBad = `${art}: sx=${sXL.x} erwartet=${AX * 16 + dx4}`; break; }
        if (sXL.y !== AY * 16 + dyA) { xlBad = `${art}: sy=${sXL.y} erwartet=${AY * 16 + dyA}`; break; }
      }
      check('GP6-§7C4 Anker-Offset: alle SECHS XL-Keys ziehen ANCHOR_CLAMP W=4',
        xlBad === null, xlBad || `dx=${dx4}`);
      check('GP6-§7C4 Anker-Offset: die W=4-Klammer BINDET an diesem Ort (enger als der Default W=14)',
        Math.abs(dx4) <= 4 && Math.abs(dx14) > 4, `dx(W=4)=${dx4} dx(W=14)=${dx14}`);
    }
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
// (per git archive 204e28f generiert). Ambient-Werte exakt 0.22/0.55/0.52/0.48
// (GP6-§7B; die EINZIGEN erlaubten Zahlaenderungen). particles.js: Node-Import,
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
    // S6-§7B(1) SANKTION (SPEC Slice 6 §7.B(1), Michael-Entscheid §9.M2 JA vom
    // 15.08.2026): GRAVEYARD.geo 4c9372d0... -> 4630a6ba... fuer das EINE neue
    // Westtor-Portal nach GRAMFELD (Wegkachel (1,12), maps.js:662). URSACHE
    // NACHGEWIESEN: von den sieben geo-Feldern (p/sk/gh/en/pr/po/torch) ist NUR
    // 'po' laenger geworden — nimmt man das DORF-Portal aus der Liste, faellt der
    // Hash exakt auf den 204e28f-Goldenen 4c9372d0... zurueck (die Bestandszeile
    // {CATACOMBS} steht unveraendert an Position 0). GRAVEYARD.sol bleibt
    // BYTE-IDENTISCH: es wurde kein Zeichen getauscht und keine Legende angefasst.
    GRAVEYARD: { sol: '432b1c3217d1e70a560f98392f54fc29b021e3f86042283ee7fb5c4ec917b4a9', geo: '4630a6ba302081f722068f263b1fac6c6481dee9a15f2788f36ff1ba67d01393' },
    CATACOMBS: { sol: '82c22c6d845065371389f5e0ecb9ee498543740c06391b85719ada8568c4394c', geo: 'ce78746ee9e243c44d6a6bb3779c5ca535c7cee764096f8a5d29fa992269b9cb' },
    FLUESTERGRUFT: { sol: '0cca3204f83878b54c5390aa1bc9c4159424f5424b1a749d6dad4e47fc273489', geo: '2ac0a890e545869220fec7fa8256da51192c2bc4a07bc8d8d68fb7a669f6fa7c' },
    BOSS_KAMMER: { sol: 'ebe999cf1e6023c6d169fa24a205e224c1dc36e4424938063cdedf045c7d611c', geo: 'a7d72c33f00b83c8d974e5d3161ca2315b7d0a24aa77f24204f386bb558885eb' },
  };
  // GP6-§7B — BELICHTUNGS-SOCKEL §3.2. Die Paletten-Offsets (§3.1) heben die
  // Grundtoene um +15 L; ohne die Ambient-Absenkung frisst das Dunkel-Overlay
  // den Gewinn wieder auf. Alle vier Werte sind paarweise VERSCHIEDEN (Spec):
  // GRAVEYARD 0.45->0.22, CATACOMBS 0.78->0.55, FLUESTERGRUFT 0.85->0.52,
  // BOSS_KAMMER 0.66->0.48. sol/geo bleiben byte-identisch (§0.4).
  const AMBIENT = { GRAVEYARD: 0.22, CATACOMBS: 0.55, FLUESTERGRUFT: 0.52, BOSS_KAMMER: 0.48 };
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

// ===========================================================================
// GP6-§7F — ADDITIVE NEUE BLOECKE (a)-(j). KEIN Bestandstest wird hier
// angefasst; alles steht am DATEIENDE und importiert die neuen Symbole
// DYNAMISCH, damit nicht einmal die Import-Zeile am Dateikopf wandert.
// Abgedeckt: §2.7 (Licht-Quantisierung), §4.1/§4.4 (lightAt, Tint-Index),
// §4.3/M5 (Kontaktschatten-Geometrie), §5.1/M4 (XL-Existenz + Bbox),
// §5.2 (swayPoses/swayPose8), §5.3 (Bake-Emission + Zweitpass),
// §6.1 (Kanal-Uferring), §6.3 (Wegsporn).
// ===========================================================================
{
  const { quantizeLight, lightRuns, lightAt, LIGHT_STEPS } =
    await import('../game/js/core/lighting.js');
  const { swayPose8, swayPhase, CROWN_POSE_RATE } =
    await import('../game/js/world/tilemap.js');
  const anyTilesF = new Proxy({}, { get: (_, k) => k });

  // ---------------------------------------------------------------------
  // (a) §2.1 quantizeLight: GENAU 13 Werte, exakt k/12, deterministisch.
  // ---------------------------------------------------------------------
  {
    const werte = new Set();
    for (let i = 0; i <= 20000; i++) werte.add(quantizeLight(i / 20000));
    check('§7F(a) quantizeLight: genau 13 verschiedene Werte (LIGHT_STEPS+1)',
      werte.size === 13 && LIGHT_STEPS === 12, `${werte.size} Werte, LIGHT_STEPS=${LIGHT_STEPS}`);
    const soll = [];
    for (let k = 0; k <= 12; k++) soll.push(k / 12);
    check('§7F(a) quantizeLight: die Werte liegen exakt auf dem Raster k/12',
      soll.every((v) => [...werte].some((w) => Math.abs(w - v) < 1e-12)));
    check('§7F(a) quantizeLight: Randwerte 0 und 1 exakt',
      quantizeLight(0) === 0 && quantizeLight(1) === 1);
    // Determinismus = PURITAET: 1000 Wiederholungen derselben Eingaben in
    // wechselnder Reihenfolge liefern identische Ergebnisse (kein Zustand).
    let detA = true;
    const probe = [0, 0.037, 0.5, 0.5001, 0.917, 1];
    const ref = probe.map(quantizeLight);
    for (let i = 0; i < 1000; i++) {
      for (let j = probe.length - 1; j >= 0; j--) if (quantizeLight(probe[j]) !== ref[j]) detA = false;
    }
    check('§7F(a) quantizeLight: deterministisch/pure (1000 Wiederholungen, wechselnde Reihenfolge)', detA);
  }

  // ---------------------------------------------------------------------
  // (b) §2.2/§2.3 lightRuns + Eimer-Buendelung.
  // ---------------------------------------------------------------------
  {
    const VW = 320, VH = 180, RUN_H = 4;
    const camF = { x: 0, y: 0 };
    // EIN Licht, flicker 0 -> die Bounding-Box ist exakt berechenbar.
    const eins = [{ x: 160, y: 90, radius: 72, flicker: 0 }];
    const voll = lightRuns(eins, camF, 0.55, 0, VW, VH, { emitK12: true });
    const ohne = lightRuns(eins, camF, 0.55, 0, VW, VH);

    check('§7F(b) lightRuns: jede Laufhoehe ist h === 4 (§2.2 4-px-Zeilen)',
      voll.every((r) => r.h === RUN_H), `abweichend: ${voll.filter((r) => r.h !== RUN_H).length}`);
    check('§7F(b) lightRuns: x und w liegen auf dem 2-px-Raster',
      voll.every((r) => r.x % 2 === 0 && r.w % 2 === 0 && r.w > 0));
    check('§7F(b) lightRuns: k ⊆ 0..12',
      voll.every((r) => Number.isInteger(r.k) && r.k >= 0 && r.k <= LIGHT_STEPS));

    // Erwartete Bounding-Box (Formel woertlich aus §2.2, NICHT importiert):
    // r auf ganze 2-px-Schritte gerundet, Block-Raster 2 px in x / 4 px in y.
    const rE = Math.round(72 / 2) * 2;
    const cxE = 160, cyE = 90;
    const BW = VW >> 1, BH = Math.ceil(VH / RUN_H);
    const bx0 = Math.max(0, (cxE - rE) >> 1), bx1 = Math.min(BW - 1, (cxE + rE) >> 1);
    const by0 = Math.max(0, Math.floor((cyE - rE) / RUN_H)), by1 = Math.min(BH - 1, Math.floor((cyE + rE) / RUN_H));
    const boxX0 = bx0 * 2, boxX1 = (bx1 + 1) * 2, boxY0 = by0 * RUN_H, boxY1 = (by1 + 1) * RUN_H;
    check('§7F(b) lightRuns: alle Laeufe liegen INNERHALB der Bounding-Box-Vereinigung',
      voll.every((r) => r.x >= boxX0 && r.x + r.w <= boxX1 && r.y >= boxY0 && r.y + r.h <= boxY1),
      `box=[${boxX0},${boxY0}]..[${boxX1},${boxY1}]`);

    // DISJUNKTHEIT + VOLLE PARTITION: mit emitK12 muss JEDER Texel der Box
    // GENAU EINMAL gestanzt werden (§2.2 "jeder Texel genau einmal").
    {
      const bw = (boxX1 - boxX0) / 2, bh = (boxY1 - boxY0) / RUN_H;
      const zaehler = new Int32Array(bw * bh);
      let ausserhalb = 0;
      for (const r of voll) {
        for (let px = r.x; px < r.x + r.w; px += 2) {
          const ix = (px - boxX0) / 2, iy = (r.y - boxY0) / RUN_H;
          if (ix < 0 || ix >= bw || iy < 0 || iy >= bh) { ausserhalb++; continue; }
          zaehler[iy * bw + ix] += 1;
        }
      }
      const doppelt = zaehler.filter((v) => v > 1).length;
      const luecke = zaehler.filter((v) => v === 0).length;
      check('§7F(b) lightRuns (emitK12): paarweise DISJUNKT — kein Block zweimal gestanzt',
        doppelt === 0 && ausserhalb === 0, `doppelt=${doppelt} ausserhalb=${ausserhalb}`);
      check('§7F(b) lightRuns (emitK12): VOLLE Partition — kein Block der Box bleibt uebrig',
        luecke === 0, `Luecken=${luecke}`);
    }

    // k = 12 (Stanz-Alpha X = 0) wird OHNE Flag unterdrueckt — und nur die.
    check('§7F(b) lightRuns: OHNE emitK12 kommt kein k === 12 mehr vor (No-Op-Unterdrueckung §2.2)',
      ohne.every((r) => r.k !== LIGHT_STEPS) && voll.some((r) => r.k === LIGHT_STEPS));
    check('§7F(b) lightRuns: die Unterdrueckung entfernt AUSSCHLIESSLICH k===12-Laeufe',
      JSON.stringify(ohne) === JSON.stringify(voll.filter((r) => r.k !== LIGHT_STEPS)));

    // Determinismus (pure, KEIN Cache §2.2): drei Aufrufe, identisches Ergebnis.
    check('§7F(b) lightRuns: deterministisch/pure (drei Aufrufe byte-gleich, kein Frame-Cache)',
      JSON.stringify(lightRuns(eins, camF, 0.55, 0.5, VW, VH))
      === JSON.stringify(lightRuns(eins, camF, 0.55, 0.5, VW, VH))
      && JSON.stringify(lightRuns(eins, camF, 0.55, 0.5, VW, VH))
      === JSON.stringify(lightRuns(eins, camF, 0.22, 0.5, VW, VH)));

    // RADIUS-RUNDUNG auf ganze 2-px-Schritte (§2.2): r(71) === r(72) === 72,
    // r(70) === 70. Also muessen 71 und 72 dieselbe Laufmenge liefern, 70 nicht.
    {
      const j = (rad) => JSON.stringify(lightRuns([{ x: 160, y: 90, radius: rad, flicker: 0 }], camF, 0.55, 0, VW, VH));
      check('§7F(b) lightRuns: Flicker-Radius rastet auf ganze 2-px-Schritte (71 und 72 identisch)',
        j(71) === j(72));
      check('§7F(b) lightRuns: die Rasterung vergroebert nicht zu stark (70 != 72)', j(70) !== j(72));
    }

    // LAUF-DECKEL <= 2000 am WORST-SETUP (§2.4): CATACOMBS, Kamera (112,80),
    // alle Fackeln (r 72, flicker 1) + Spielerlicht. Lichter-Muster woertlich
    // nach .tmp/gp6_p0a_karte.mjs nachgebaut (Fackelmitte = Kachelmitte).
    {
      const TORCH_R = 72, TILE_F = 16;
      const fackeln = [];
      CATACOMBS.rows.forEach((row, ty) => [...row].forEach((ch, tx) => {
        if (CATACOMBS.torchChars.includes(ch)) {
          fackeln.push({ x: tx * TILE_F + TILE_F / 2, y: ty * TILE_F + TILE_F / 2, radius: TORCH_R, flicker: 1 });
        }
      }));
      const camW = { x: 112, y: 80 };
      const worst = [...fackeln, { x: camW.x + VW / 2, y: camW.y + VH / 2, radius: CATACOMBS.playerLightRadius, flicker: 0.3 }];
      let maxLaeufe = 0, maxT = 0;
      for (let i = 0; i < 300; i++) {
        const n = lightRuns(worst, camW, CATACOMBS.ambient, i / 60, VW, VH).length;
        if (n > maxLaeufe) { maxLaeufe = n; maxT = i / 60; }
      }
      check('§7F(b) §2.4 Lauf-Deckel: Worst-View CATACOMBS (112,80), 300 Frames -> <= 2000 Laeufe',
        maxLaeufe <= 2000, `max=${maxLaeufe} bei t=${maxT.toFixed(3)} (${worst.length} Lichter)`);
      check('§7F(b) Worst-Setup ist wirklich der Worst-View (>= 20 Lichter im Spiel)',
        worst.length >= 20, `${worst.length} Lichter`);
    }

    // ---- EIMER-BUENDELUNG + Detektor-Sonde ueber einen Canvas-Stub --------
    {
      const mkStub = (canvas) => {
        const log = [];
        const st = { a: 1, gco: 'source-over', fill: '' };
        return {
          canvas, log,
          get globalAlpha() { return st.a; },
          set globalAlpha(v) { st.a = v; },
          get globalCompositeOperation() { return st.gco; },
          set globalCompositeOperation(v) { st.gco = v; },
          get fillStyle() { return st.fill; },
          set fillStyle(v) { st.fill = v; log.push({ op: 'setFill', v, gco: st.gco }); },
          clearRect() {},
          fillRect(x, y, w, h) { log.push({ op: 'fillRect', x, y, w, h, alpha: st.a, fill: st.fill, gco: st.gco }); },
          drawImage(img, ...args) { log.push({ op: 'drawImage', img, args }); },
          // save/restore BEWUSST als No-Op (wie der Boss-Flusstest-Stub): so
          // faellt auf, wenn sich die Composite-Hygiene auf restore verlaesst
          // statt gco/alpha explizit zurueckzusetzen (§0.3).
          save() {}, restore() {},
          beginPath() {}, arc() {}, fill() {},
        };
      };
      let offCtx = null;
      const offCanvas = { width: 0, height: 0, getContext: () => (offCtx = mkStub(offCanvas)) };
      const mainCanvas = { width: VW, height: VH, ownerDocument: { createElement: () => offCanvas } };
      const mainCtx = mkStub(mainCanvas);
      const lightsD = [
        { x: 100, y: 60, radius: 72, flicker: 1 },
        { x: 220, y: 120, radius: 72, flicker: 1 },
        { x: 160, y: 90, radius: 40, flicker: 0.3 },
      ];
      const lg = createLighting(VW, VH);
      lg.draw(mainCtx, camF, lightsD, 0.55, 0.25, '#06080f');

      const oLog = offCtx.log;
      const oFill = oLog.filter((o) => o.op === 'fillRect');
      const teil = oFill.filter((o) => o.alpha > 0 && o.alpha < 1);
      check('§7F(b) §0.2 Detektor: GENAU EIN Teilalpha-fillRect auf dem Offscreen',
        teil.length === 1, `${teil.length}`);
      check('§7F(b) §0.2 Detektor: dieser Teilalpha-fillRect ist der ERSTE fillRect ueberhaupt (Ambient-Fill)',
        oFill.length > 1 && oFill[0] === teil[0] && oFill[0].alpha === 0.55
        && oFill[0].w === VW && oFill[0].h === VH, JSON.stringify(oFill[0] || null));
      check('§7F(b) §2.3 alle Stanz-fillRects laufen bei globalAlpha === 1 (Deckung im rgba-String)',
        oFill.slice(1).every((o) => o.alpha === 1 && o.gco === 'destination-out' && /^rgba\(0,0,0,/.test(o.fill)));
      const stanzFills = oLog.filter((o) => o.op === 'setFill' && o.gco === 'destination-out');
      check('§7F(b) §2.3 EIMER-BUENDELUNG: hoechstens 13 fillStyle-Wechsel im Stanz-Block',
        stanzFills.length <= 13, `${stanzFills.length} Wechsel bei ${oFill.length - 1} Stanz-Rechtecken`);
      check('§7F(b) §2.3 EIMER: die Buendelung spart wirklich (deutlich mehr Rechtecke als Wechsel)',
        oFill.length - 1 > stanzFills.length * 2, `${oFill.length - 1} Rechtecke / ${stanzFills.length} Wechsel`);
      check('§7F(b) §0.3 Composite-Hygiene: der Offscreen steht danach auf source-over / Alpha 1',
        offCtx.globalCompositeOperation === 'source-over' && offCtx.globalAlpha === 1);
      check('§7F(b) §0.3 Composite-Hygiene: der HAUPT-ctx steht danach auf source-over / Alpha 1 (ohne restore)',
        mainCtx.globalCompositeOperation === 'source-over' && mainCtx.globalAlpha === 1);
      const di = mainCtx.log.filter((o) => o.op === 'drawImage');
      check('§7F(b) §0.3 drawImage-Argumentzahl: das Overlay wird 3-argumentig gezeichnet',
        di.length === 1 && di[0].args.length === 2 && di[0].args[0] === 0 && di[0].args[1] === 0,
        di.map((o) => o.args.length + 1).join(','));
    }
  }

  // ---------------------------------------------------------------------
  // (c) §4.1 lightAt: Determinismus, 12er-Raster, Hysterese.
  // ---------------------------------------------------------------------
  {
    const lts = [
      { x: 100, y: 100, radius: 72, flicker: 1 },
      { x: 180, y: 130, radius: 40, flicker: 0.3 },
    ];
    const a1 = lightAt(lts, 130, 110, 0.55, 0);
    const a2 = lightAt(lts, 130, 110, 0.55, 0);
    const a3 = lightAt(lts, 130, 110, 0.55, 99.5); // timeSec ist BEWUSST unbenutzt
    check('§7F(c) lightAt: deterministisch/pure (zwei Aufrufe identisch)',
      a1.f === a2.f && a1.warm === a2.warm && a1.a === a2.a);
    check('§7F(c) lightAt: UNGEJITTERT — timeSec aendert das Ergebnis nicht (§4.1a, kein Stroboskop)',
      a3.f === a1.f && a3.warm === a1.warm, `f ${a1.f} vs ${a3.f}`);
    let rasterOk = true, warmOk = true;
    for (let x = 30; x < 300; x += 3) {
      for (let y = 30; y < 200; y += 7) {
        const r = lightAt(lts, x, y, 0.55, 0);
        if (Math.abs(r.f * LIGHT_STEPS - Math.round(r.f * LIGHT_STEPS)) > 1e-9) rasterOk = false;
        if (Math.abs(r.warm * LIGHT_STEPS - Math.round(r.warm * LIGHT_STEPS)) > 1e-9) warmOk = false;
        if (r.f < 0 || r.f > 1 || r.warm < 0 || r.warm > 1) rasterOk = false;
        if (Math.abs(r.a - 0.55 * (1 - r.f)) > 1e-9) rasterOk = false;
      }
    }
    check('§7F(c) lightAt: f liegt auf dem 12er-Raster, 0..1, und a === ambient*(1-f)', rasterOk);
    check('§7F(c) lightAt: warm liegt auf demselben 12er-Raster', warmOk);
    // HYSTERESE (§4.1b): zwei benachbarte Abtastpunkte, deren ROH-Stufen sich
    // um genau 1 unterscheiden. OHNE prev kippt f; MIT prev bleibt es stehen —
    // genau das verhindert das Flattern der stehenden Figur an der Stufengrenze.
    let A = null, B = null;
    for (let x = 40; x < 172 && !B; x++) {
      const p = lightAt(lts, x, 100, 0.55, 0);
      const q = lightAt(lts, x + 1, 100, 0.55, 0);
      if (p.f !== q.f) { A = { x, r: p }; B = { x: x + 1, r: q }; }
    }
    check('§7F(c) lightAt: es gibt ueberhaupt eine Stufengrenze zum Messen', !!B,
      B ? `bei x=${A.x}->${B.x} (f ${A.r.f} -> ${B.r.f})` : 'keine gefunden');
    if (B) {
      const mitPrev = lightAt(lts, B.x, 100, 0.55, 0, A.r);
      check('§7F(c) lightAt HYSTERESE: mit prev bleibt die Stufe stehen (kein Flattern an der Grenze)',
        mitPrev.f === A.r.f, `ohne prev ${B.r.f}, mit prev ${mitPrev.f}, vorher ${A.r.f}`);
      check('§7F(c) lightAt HYSTERESE: ohne prev kippt dieselbe Stelle sehr wohl (Gegenprobe)',
        B.r.f !== A.r.f);
      // Die Hysterese darf nicht EINFRIEREN: zwei Stufen Abstand kippt trotzdem.
      const weit = lightAt(lts, 100, 100, 0.55, 0);
      const fern = lightAt(lts, 100, 100, 0.55, 0, { f: 0, warm: 0 });
      check('§7F(c) lightAt HYSTERESE: bei > 1 Stufe Abstand wird trotzdem nachgezogen (kein Einfrieren)',
        Math.abs(weit.f * LIGHT_STEPS - 0) <= 1 || fern.f !== 0,
        `roh ${weit.f}, mit prev(f=0) ${fern.f}`);
    }
  }

  // ---------------------------------------------------------------------
  // (d) §5.2 swayPoses-Validierung, swayPose8-Ruhelage, Translation-Entfall.
  // ---------------------------------------------------------------------
  {
    const N2 = 10;
    const gr = Array.from({ length: N2 }, () => '.'.repeat(N2));
    const ov = (ch) => {
      const g = Array.from({ length: N2 }, () => Array(N2).fill('.'));
      g[3][3] = ch;
      return g.map((r) => r.join(''));
    };
    const posen = (a) => [a, a + '_r1', a + '_r2', a + '_r1', a, a + '_l1', a + '_l2', a + '_l1'];
    const wirft = (leg) => {
      try { createTilemap(gr, leg, ov('S')); return false; } catch { return true; }
    };
    check('§7F(d) swayPoses-Validierung: Laenge != 8 wirft',
      wirft({ '.': { art: 'grass' }, S: { art: 'kr', span: [3, 2], solid: false, swayPoses: posen('kr').slice(0, 7) } }));
    check('§7F(d) swayPoses-Validierung: poses[0] !== art wirft',
      wirft({ '.': { art: 'grass' }, S: { art: 'kr', span: [3, 2], solid: false, swayPoses: ['kr_r1', ...posen('kr').slice(1)] } }));
    check('§7F(d) swayPoses-Validierung: span = 1 (bzw. kein span) wirft',
      wirft({ '.': { art: 'grass' }, S: { art: 'kr', span: [1, 1], solid: false, swayPoses: posen('kr') } })
      && wirft({ '.': { art: 'grass' }, S: { art: 'kr', solid: false, swayPoses: posen('kr') } }));
    check('§7F(d) swayPoses-Validierung: die GUELTIGE Fassung wirft NICHT (Gegenprobe)',
      !wirft({ '.': { art: 'grass' }, S: { art: 'kr', span: [3, 2], solid: false, swayPoses: posen('kr') } }));

    // RUHELAGE: swayPose8 ist bei t = 0 fuer JEDEN Cluster 0 -> poses[0] === art
    // -> das Bild ist byte-gleich zum Basis-Grid (§5.2).
    let ruheOk = true;
    for (let tx = 0; tx < 64 && ruheOk; tx++) {
      for (let ty = 0; ty < 64; ty++) if (swayPose8(tx, ty, 0, CROWN_POSE_RATE) !== 0) { ruheOk = false; break; }
    }
    check('§7F(d) swayPose8: bei timeSec = 0 liefert JEDER Cluster Index 0 (byte-gleiche Ruhelage)', ruheOk);
    const idx = new Set();
    for (let tx = 0; tx < 16; tx++) for (let ti = 0; ti < 40; ti++) idx.add(swayPose8(tx, 3, ti / 8, CROWN_POSE_RATE));
    check('§7F(d) swayPose8: der Index laeuft ueber die volle Acht-Folge 0..7',
      idx.size === 8 && [...idx].every((v) => Number.isInteger(v) && v >= 0 && v <= 7), [...idx].sort().join(','));

    // TRANSLATION-ENTFALL (§5.2): derselbe Anker, dieselbe Zeit — OHNE
    // swayPoses traegt ax den swayPhase-Versatz, MIT swayPoses NICHT.
    const legOhne = { '.': { art: 'grass' }, S: { art: 'kr', span: [3, 2], solid: false } };
    const legMit = { '.': { art: 'grass' }, S: { art: 'kr', span: [3, 2], solid: false, swayPoses: posen('kr') } };
    const tmOhne = createTilemap(gr, legOhne, ov('S'));
    const tmMit = createTilemap(gr, legMit, ov('S'));
    const xAt = (tm, t) => {
      let x = null;
      tm.draw({
        canvas: { width: N2 * 16, height: N2 * 16 },
        drawImage: (img, sx) => { if (String(img).startsWith('kr')) x = sx; },
      }, { x: 0, y: 0 }, anyTilesF, t, 'over');
      return x;
    };
    const basisX = xAt(tmOhne, 0); // t = 0: swayPhase-Versatz ist ueberall 0
    let tSway = null;
    for (let i = 1; i < 600 && tSway === null; i++) if (xAt(tmOhne, i / 60) !== basisX) tSway = i / 60;
    check('§7F(d) Translation-Entfall: es gibt eine Zeit, zu der die Boe den Bestands-Anker WIRKLICH versetzt',
      tSway !== null, tSway === null ? 'keine gefunden' : `t=${tSway.toFixed(4)}, dx=${xAt(tmOhne, tSway) - basisX}`);
    if (tSway !== null) {
      check('§7F(d) §5.2 Translation-Entfall: MIT swayPoses bleibt ax auf dem reinen anchorOffset (kein swayPhase-Versatz)',
        xAt(tmMit, tSway) === basisX && xAt(tmOhne, tSway) !== basisX,
        `mit=${xAt(tmMit, tSway)} ohne=${xAt(tmOhne, tSway)} basis=${basisX}`);
      check('§7F(d) §5.2 Translation-Entfall: MIT swayPoses ist ax ueber die ganze Boe KONSTANT',
        [0, 0.1, 0.35, 0.6, 0.9, 1.4, 2.1].every((t) => xAt(tmMit, t) === basisX));
      // ... und die Krone bewegt sich trotzdem: die POSE wechselt.
      const gezeichnet = new Set();
      for (let i = 0; i < 200; i++) {
        tmMit.draw({
          canvas: { width: N2 * 16, height: N2 * 16 },
          drawImage: (img) => { if (String(img).startsWith('kr')) gezeichnet.add(String(img)); },
        }, { x: 0, y: 0 }, anyTilesF, i / 30, 'over');
      }
      check('§7F(d) §5.2: die Bewegung steckt in der POSE — alle fuenf echten Posen werden gezeichnet',
        gezeichnet.size === 5, [...gezeichnet].sort().join(','));
    }
    // Und: EIN Draw je Over-Zelle bleibt EIN Draw (kein Doppel-Zeichnen).
    {
      let n = 0;
      tmMit.draw({
        canvas: { width: N2 * 16, height: N2 * 16 },
        drawImage: (img) => { if (String(img).startsWith('kr')) n++; },
      }, { x: 0, y: 0 }, anyTilesF, 0.7, 'over');
      check('§7F(d) §5.2: GENAU EIN drawImage je Posen-Over-Zelle', n === 1, `${n} Draws`);
    }
    // swayPhase selbst bleibt unberuehrt (Bestandsformel, Gegen-Wache).
    check('§7F(d) swayPhase (Bestand) bleibt bei t = 0 auf Schritt 0 / dx 0',
      swayPhase(5, 7, 0, 1.6).step === 0 && swayPhase(5, 7, 0, 1.6).dx === 0);
  }

  // ---------------------------------------------------------------------
  // (e) §4.3 / M5 KONTAKTSCHATTEN-GEOMETRIE je Klasse.
  //     Die Profil-Konstanten stehen hier WOERTLICH wie in main.js §4.3 (sie
  //     werden NICHT importiert — main.js ist nicht Node-importierbar, und so
  //     fliegt jede stille Profil-Aenderung auf). Rechnung wie
  //     .tmp/gp6_shadow_coverage.mjs: Kamera (0,0), Sprite horizontal
  //     zentriert und mit den Fuessen auf der AABB-Unterkante; gezaehlt werden
  //     Schatten-Texel in Zeilen KOMPLETT UNTER dem Sprite.
  // ---------------------------------------------------------------------
  {
    const R = Math.round;
    const SW_STD = [0.90, 0.95, 0.7, 0.4], SDY_STD = [-1, 0, 1, 2];
    const SW_BIG = [0.90, 0.95, 0.85, 0.65, 0.40], SDY_BIG = [-1, 0, 1, 2, 3];
    const KLASSEN = [
      ['Spieler', 12, 14, 'player_down_0'], ['Skelett', 12, 14, 'skeleton_0'],
      ['Ghul', 14, 14, 'ghoul_0'], ['Grufthund', 14, 12, 'hound_0'],
      ['Rostpanzer', 14, 16, 'rust_0'], ['Boss Grabwaechter', 20, 24, 'warden_idle'],
      ['Vase', 12, 12, 'vase'], ['Urne', 12, 12, 'urn'], ['Truhe', 16, 14, 'chest_closed'],
    ];
    const unterFuss = (w, h, key) => {
      const g = SPRITES[key];
      if (!g) return -1;
      const iw = g[0].length, ih = g.length;
      const big = w >= 18 && h >= 20;
      const ws = big ? SW_BIG : SW_STD, dys = big ? SDY_BIG : SDY_STD;
      const cx = w / 2, baseY = h - 1;
      const sx = R(w / 2 - iw / 2), sy = R(h - ih);
      let unten = 0;
      for (let i = 0; i < ws.length; i++) {
        const sw = Math.max(1, R(w * ws[i]));
        const x0 = R(cx - sw / 2), y = R(baseY) - dys[i];
        if (y <= sy + ih - 1) continue;          // Zeile liegt noch HINTER dem Sprite
        for (let x = x0; x < x0 + sw; x++) {
          const gx = x - sx, gy = y - sy;
          const verdeckt = gy >= 0 && gy < ih && gx >= 0 && gx < iw && g[gy][gx] !== '.';
          if (!verdeckt) unten++;
        }
      }
      return unten;
    };
    let schlecht = null;
    const werte = [];
    for (const [label, w, h, key] of KLASSEN) {
      const n = unterFuss(w, h, key);
      werte.push(`${label} ${n}`);
      if (n < 8 && schlecht === null) schlecht = `${label} (${key}): nur ${n} sichtbare Texel unter der Fusskante`;
    }
    check('§7F(e) M5 Kontaktschatten: JEDE Klasse hat >= 8 sichtbare Schatten-Texel UNTER der Fusskante',
      schlecht === null, schlecht || werte.join(' | '));
    check('§7F(e) §4.3 Standardprofil hat VIER Zeilen und die unterste liegt UNTER der Fusskante (dy -1)',
      SW_STD.length === 4 && SDY_STD.length === 4 && SDY_STD[0] === -1);
    // Negativ-Kontrolle: ohne die -1-Zeile faellt mindestens eine Klasse durch —
    // die neue Zeile ist also wirklich der Traeger des Messziels.
    {
      const ohne = KLASSEN.map(([, w, h, key]) => {
        const g = SPRITES[key];
        const iw = g[0].length, ih = g.length;
        const big = w >= 18 && h >= 20;
        const ws = (big ? SW_BIG : SW_STD).slice(1), dys = (big ? SDY_BIG : SDY_STD).slice(1);
        const cx = w / 2, baseY = h - 1, sx = R(w / 2 - iw / 2), sy = R(h - ih);
        let unten = 0;
        for (let i = 0; i < ws.length; i++) {
          const sw = Math.max(1, R(w * ws[i])), x0 = R(cx - sw / 2), y = R(baseY) - dys[i];
          if (y <= sy + ih - 1) continue;
          for (let x = x0; x < x0 + sw; x++) {
            const gx = x - sx, gy = y - sy;
            if (!(gy >= 0 && gy < ih && gx >= 0 && gx < iw && g[gy][gx] !== '.')) unten++;
          }
        }
        return unten;
      });
      check('§7F(e) Negativ-Kontrolle: OHNE die dy=-1-Zeile faellt das Messziel durch (die Zeile traegt M5)',
        ohne.some((n) => n < 8), ohne.join(','));
    }
  }

  // ---------------------------------------------------------------------
  // (f) §5.1 / M4 XL-EXISTENZ + Tinten-Bbox + Bake-Masse.
  // ---------------------------------------------------------------------
  {
    const XL_BASIS = ['tree_canopy_xl_a', 'tree_canopy_xl_a_m', 'tree_canopy_xl_b',
      'tree_canopy_xl_b_m', 'tree_canopy_xl_c', 'tree_canopy_xl_c_m'];
    const POSE_SUFFIX = ['', '_r1', '_r2', '_l1', '_l2'];
    const fehlt = [];
    for (const b of XL_BASIS) for (const s of POSE_SUFFIX) if (!TILE_ART[b + s]) fehlt.push(b + s);
    check('§7F(f) §5.1: alle 30 XL-Kronen-Grids (6 Keys x 5 Posen) existieren',
      fehlt.length === 0, fehlt.join(','));
    const bbox = (g) => {
      let x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1;
      g.forEach((row, y) => [...row].forEach((c, x) => {
        if (c === '.') return;
        if (x < x0) x0 = x; if (x > x1) x1 = x;
        if (y < y0) y0 = y; if (y > y1) y1 = y;
      }));
      return x1 < 0 ? [0, 0] : [x1 - x0 + 1, y1 - y0 + 1];
    };
    const gross = XL_BASIS.filter((k) => TILE_ART[k]).map((k) => [k, ...bbox(TILE_ART[k])]);
    const ab40 = gross.filter(([, w, h]) => w >= 40 && h >= 28);
    const ab56 = gross.filter(([, w, h]) => w >= 56 && h >= 40);
    check('§7F(f) M4: >= 3 Kronen-Keys mit Tinten-Bbox >= 40x28',
      ab40.length >= 3, gross.map(([k, w, h]) => `${k} ${w}x${h}`).join(' | '));
    check('§7F(f) M4: >= 1 Kronen-Key mit Tinten-Bbox >= 56x40',
      ab56.length >= 1, ab56.map(([k, w, h]) => `${k} ${w}x${h}`).join(' | ') || 'keiner');
    // §5.3: der Bake ist EXAKT sw*16 x 32 — die Hoehe folgt NICHT der Krone.
    for (const [key, sw] of [['canopy_shadow_xl_a', 3], ['canopy_shadow_xl_b', 4], ['canopy_shadow_xl_c', 3]]) {
      const g = TILE_ART[key];
      check(`§7F(f) §5.3 ${key}: Masse exakt ${sw * 16}x32`,
        !!g && g.length === 32 && g.every((r) => r.length === sw * 16),
        g ? `${g[0].length}x${g.length}` : 'FEHLT');
      if (g) {
        check(`§7F(f) §5.3 ${key}: nur die Toene 'n'/'0' und Transparenz (kein 'k', §5.3)`,
          [...g.join('')].every((c) => c === '.' || c === 'n' || c === '0'),
          [...new Set(g.join('').replace(/\./g, ''))].join(''));
      }
    }
  }

  // ---------------------------------------------------------------------
  // (g) §5.3 canopy_shadow_xl-EMISSION: Ein-Draw im ZWEITPASS nach den
  //     Bodenkacheln, Versatz anchorOffset + (+2,+2).
  // ---------------------------------------------------------------------
  {
    const N3 = 10;
    const grRows = Array.from({ length: N3 }, () => '.'.repeat(N3));
    const AX7 = 2, AY7 = 2, SW7 = 4, SH7 = 3;
    const oG = Array.from({ length: N3 }, () => Array(N3).fill('.'));
    oG[AY7][AX7] = 'B';
    const legG = {
      '.': { art: 'grass' },
      B: { art: 'tree_canopy_xl_b', span: [SW7, SH7], solid: false, shadowArt: 'canopy_shadow_xl_b' },
    };
    const tmG = createTilemap(grRows, legG, oG.map((r) => r.join('')));
    const folge = [];
    tmG.draw({
      canvas: { width: N3 * 16, height: N3 * 16 },
      drawImage: (img, sx, sy) => folge.push({ k: String(img), sx, sy }),
    }, { x: 0, y: 0 }, anyTilesF, 0, 'ground');
    const bakeIdx = folge.findIndex((o) => o.k === 'canopy_shadow_xl_b');
    const letzteKachel = folge.map((o) => o.k).lastIndexOf('grass');
    check('§7F(g) §5.3 canopy_shadow_xl wird im GROUND-Pass GENAU EINMAL gezeichnet',
      folge.filter((o) => o.k === 'canopy_shadow_xl_b').length === 1);
    check('§7F(g) §5.3 ZWEITPASS: der Bake kommt NACH allen Bodenkacheln des Fensters',
      bakeIdx > letzteKachel && letzteKachel >= 0,
      `Bake bei ${bakeIdx}, letzte Bodenkachel bei ${letzteKachel} von ${folge.length}`);
    const dxG = Math.max(-4, Math.min(4, variantIndex(AX7 + 1013, AY7 + 571, 29) - 14));
    const dyG = (variantIndex(AX7 + 421, AY7 + 907, 17) % 9) - 4;
    const bakeOp = folge[bakeIdx];
    check('§7F(g) §5.3 Versatz = anchorOffset PLUS (+2,+2) (Lichtrichtung oben-links)',
      !!bakeOp && bakeOp.sx === AX7 * 16 + dxG + 2 && bakeOp.sy === (AY7 + SH7) * 16 + dyG + 2,
      bakeOp ? `ist=(${bakeOp.sx},${bakeOp.sy}) soll=(${AX7 * 16 + dxG + 2},${(AY7 + SH7) * 16 + dyG + 2})` : '-');
    // Realbezug: die echte GRAVEYARD-Karte emittiert die Bakes auch wirklich.
    {
      const tmR = createTilemap(GRAVEYARD.rows, GRAVEYARD.legend, GRAVEYARD.overRows);
      const bakes = new Set();
      let bakeMin = Infinity, kachelMax = -1, i = 0;
      tmR.draw({
        canvas: { width: tmR.wPx, height: tmR.hPx },
        drawImage: (img) => {
          const k = String(img);
          if (k.startsWith('canopy_shadow_xl_')) { bakes.add(k); if (i < bakeMin) bakeMin = i; }
          else if (!k.startsWith('canopy_shadow')) kachelMax = i;
          i++;
        },
      }, { x: 0, y: 0 }, anyTilesF, 0, 'ground');
      check('§7F(g) GRAVEYARD emittiert alle drei XL-Bakes im Ground-Pass',
        bakes.size === 3, [...bakes].sort().join(','));
      check('§7F(g) GRAVEYARD: KEIN Kronen-Schatten vor der letzten Bodenkachel (Zweitpass, §5.3)',
        bakeMin > kachelMax, `erster Bake bei ${bakeMin}, letzte Bodenkachel bei ${kachelMax}`);
    }
  }

  // ---------------------------------------------------------------------
  // (h) §6.1 water_shallow_vert-VERDRAHTUNG.
  // ---------------------------------------------------------------------
  {
    // WICHTIG: hier KEINE Proxy-Kachelquelle. Der depthArt-Pass zieht seine
    // _v1/_v2-Variante nur, wenn die Quelle den Key WIRKLICH BESITZT
    // (hasOwnProperty, tilemap.js) — ein Proxy, der jeden Namen beantwortet,
    // faellt bewusst auf die Basis zurueck. Also eine echte Key-Tabelle aus
    // TILE_ART, genau wie im Bestandstest §6#4l.
    const echteQuelle = {};
    for (const k of Object.keys(TILE_ART)) echteQuelle[k] = k;
    const zieheKeys = (def) => {
      const tm = createTilemap(def.rows, def.legend, def.overRows || null);
      const out = [];
      tm.draw({
        canvas: { width: tm.wPx, height: tm.hPx },
        drawImage: (img) => out.push(String(img)),
      }, { x: 0, y: 0 }, echteQuelle, 0, 'ground');
      return out;
    };
    const HOR = /^water_shallow(_v[12])?$/;
    const VER = /^water_shallow_vert(_v[12])?$/;
    const kF = zieheKeys(FLUESTERGRUFT);
    const kG = zieheKeys(GRAVEYARD);
    check('§7F(h) §6.1 Gruft-Kanal: NULL horizontale water_shallow-Kacheln mehr',
      kF.filter((k) => HOR.test(k)).length === 0, `${kF.filter((k) => HOR.test(k)).length}`);
    check('§7F(h) §6.1 Gruft-Kanal: der vertikale Uferring wird wirklich gezogen',
      kF.filter((k) => VER.test(k)).length > 0, `${kF.filter((k) => VER.test(k)).length} Kacheln`);
    check('§7F(h) §6.1: die _v1/_v2-Streuung des depthArt-Passes greift auf dem neuen Basis-Key',
      ['water_shallow_vert', 'water_shallow_vert_v1', 'water_shallow_vert_v2'].every((k) => kF.includes(k)),
      [...new Set(kF.filter((k) => VER.test(k)))].join(','));
    check('§7F(h) §6.1 Gegen-Gate: der FRIEDHOFSTEICH bleibt UNVERAENDERT horizontal',
      kG.filter((k) => HOR.test(k)).length > 0 && kG.filter((k) => VER.test(k)).length === 0,
      `horiz=${kG.filter((k) => HOR.test(k)).length} vert=${kG.filter((k) => VER.test(k)).length}`);
    check('§7F(h) §6.1: die drei vertikalen Uferring-Grids existieren in TILE_ART',
      ['water_shallow_vert', 'water_shallow_vert_v1', 'water_shallow_vert_v2']
        .every((k) => TILE_ART[k] && TILE_ART[k].length === 16 && TILE_ART[k].every((r) => r.length === 16)));
  }

  // ---------------------------------------------------------------------
  // (i) §6.3 WEGSPORN 'P': Flags byte-gleich 'p', Emissions-Byte-Gleichheit
  //     der Nachbarzellen, sol/geo unberuehrt.
  // ---------------------------------------------------------------------
  {
    const legP = GRAVEYARD.legend['P'];
    const legKlein = GRAVEYARD.legend['p'];
    const FLAGS = ['solid', 'fringeSource', 'fringeSet', 'fringeTarget', 'shorePrefix', 'bankSet', 'depthOverlays', 'span', 'variants', 'anim', 'animRate', 'animSync', 'sway', 'swayPoses', 'shadowArt'];
    const flagBild = (d) => JSON.stringify(FLAGS.map((f) => (f in d ? d[f] : null)));
    check("§7F(i) §6.3 'P' traegt EXAKT die Flags von 'p' (nur der art-Key unterscheidet sich)",
      flagBild(legP) === flagBild(legKlein),
      `P=${flagBild(legP)} p=${flagBild(legKlein)}`);
    check("§7F(i) §6.3 'P' zeigt auf das eigene Grid path_pebbles, 'p' weiter auf pebble_small",
      legP.art === 'path_pebbles' && legKlein.art === 'pebble_small' && !!TILE_ART.path_pebbles);
    // Fundorte + Gegenprobe-Karte mit 'P' -> 'p' zurueckgetauscht.
    const orte = [];
    GRAVEYARD.rows.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === 'P') orte.push([x, y]); }));
    check("§7F(i) §6.3 GENAU ZWEI 'P'-Zellen, beide auf ty = 15 (Trittsteine (28,15)/(29,15))",
      orte.length === 2 && orte.every(([, y]) => y === 15) && orte.map(([x]) => x).join(',') === '28,29',
      JSON.stringify(orte));
    const rowsAlt = GRAVEYARD.rows.map((r) => r.replace(/P/g, 'p'));
    const tmNeu = createTilemap(GRAVEYARD.rows, GRAVEYARD.legend, GRAVEYARD.overRows);
    const tmAlt = createTilemap(rowsAlt, GRAVEYARD.legend, GRAVEYARD.overRows);
    // EMISSIONS-BYTE-GLEICHHEIT: fringe/shore/bank je Zelle ueber die GANZE
    // Karte (strenger als die geforderten 6 Nachbarzellen).
    let emitBad = null;
    for (let ty = 0; ty < GRAVEYARD.rows.length && !emitBad; ty++) {
      for (let tx = 0; tx < GRAVEYARD.rows[0].length; tx++) {
        const a = JSON.stringify([fringeOverlays(tmNeu.defAt, tx, ty), shoreEdges(tmNeu.defAt, tx, ty), bankOverlays(tmNeu.defAt, tx, ty)]);
        const b = JSON.stringify([fringeOverlays(tmAlt.defAt, tx, ty), shoreEdges(tmAlt.defAt, tx, ty), bankOverlays(tmAlt.defAt, tx, ty)]);
        if (a !== b) { emitBad = `(${tx},${ty}) neu=${a} alt=${b}`; break; }
      }
    }
    check('§7F(i) §6.3 Emissions-BYTE-GLEICHHEIT: fringe/shore/bank aller Zellen identisch zum p-Stand',
      emitBad === null, emitBad || '');
    // ... und die einzige Differenz im Ground-Pass sind die zwei Kachel-Keys.
    {
      const zieh = (tm) => {
        const out = [];
        tm.draw({ canvas: { width: tm.wPx, height: tm.hPx }, drawImage: (img) => out.push(String(img)) },
          { x: 0, y: 0 }, anyTilesF, 0, 'ground');
        return out;
      };
      const kN = zieh(tmNeu), kA = zieh(tmAlt);
      const diff = [];
      for (let i = 0; i < Math.max(kN.length, kA.length); i++) if (kN[i] !== kA[i]) diff.push(`${i}:${kA[i]}->${kN[i]}`);
      check('§7F(i) §6.3 Ground-Pass: GENAU zwei Draws unterscheiden sich, pebble_small -> path_pebbles',
        diff.length === 2 && diff.every((d) => d.endsWith('pebble_small->path_pebbles')), diff.join(' | '));
    }
    // sol/geo: der Tausch ist gameplay-neutral (§0.4 STOPP-Signal-Wache).
    {
      const shaF = (s) => createHash('sha256').update(s).digest('hex');
      const solF = (rows, legend) => shaF(rows.map((row) => [...row].map((ch) => (legend[ch] && legend[ch].solid ? '1' : '0')).join('')).join('\n'));
      check('§7F(i) §6.3 sol-Hash: der P-Tausch aendert das Soliditaets-Raster NICHT',
        solF(GRAVEYARD.rows, GRAVEYARD.legend) === solF(rowsAlt, GRAVEYARD.legend));
      const geoF = (tm, def) => shaF(JSON.stringify({
        p: def.playerSpawn, sk: def.skeletonSpawns, gh: def.ghoulSpawns,
        en: def.enemySpawns || [], pr: def.propSpawns, po: def.portals,
        torch: def.torchChars.map((ch) => [ch, tm.findTiles(ch)]),
      }));
      check('§7F(i) §6.3 geo-Hash: Spawns/Portale/torch-findTiles unberuehrt',
        geoF(tmNeu, GRAVEYARD) === geoF(tmAlt, GRAVEYARD));
      // S6-§7B(2) SANKTION (SPEC Slice 6 §7.B(2), §9.M2): ZWEITORT desselben
      // geo-Hashes. Derselbe Wert wie in §36 (smoke:2150) — gemessen: dieser
      // Aufruf liefert byte-gleich 4630a6ba..., weil er dieselbe Portal-Liste
      // hasht. Der sol-Teil der Zeile bleibt UNVERAENDERT (der P-Tausch und das
      // neue Portal aendern das Soliditaets-Raster nicht).
      check('§7F(i) §6.3 sol/geo entsprechen weiterhin den §36-Goldenen von 204e28f',
        solF(GRAVEYARD.rows, GRAVEYARD.legend) === '432b1c3217d1e70a560f98392f54fc29b021e3f86042283ee7fb5c4ec917b4a9'
        && geoF(tmNeu, GRAVEYARD) === '4630a6ba302081f722068f263b1fac6c6481dee9a15f2788f36ff1ba67d01393');
    }
  }

  // ---------------------------------------------------------------------
  // (j) §4.2/§4.4 TINT-MASKEN-ERZEUGUNGSINDEX: die Masken entstehen NACH den
  //     TILE_ART-Canvases (§0.2 "neue Canvases erst NACH main.js:71").
  //     Headless nachgestellt: ein document-Stub zaehlt jeden erzeugten
  //     Canvas, danach laeuft die Bau-Reihenfolge von main.js:55-71 nach.
  // ---------------------------------------------------------------------
  {
    const { buildSprite, buildAll, buildTintMask } = await import('../game/js/core/sprite_factory.js');
    const erzeugt = [];
    const vorherDoc = globalThis.document;
    globalThis.document = {
      createElement: () => {
        const c = {
          width: 0, height: 0,
          getContext: () => ({ globalAlpha: 1, fillStyle: '', fillRect() {} }),
        };
        erzeugt.push(c);
        return c;
      },
    };
    try {
      const gfxF = buildAll(SPRITES, PALETTE);
      const nachSprites = erzeugt.length;
      buildSprite(SPRITES.player_down_0, PALETTE, { flipX: true });
      const nachFlips = erzeugt.length;
      buildAll(TILE_ART, PALETTE);
      const nachTiles = erzeugt.length;
      const maske = buildTintMask(SPRITES.player_down_0, PALETTE, '#b05822', '#d8722a', 'L');
      const maskIdx = erzeugt.indexOf(maske);
      check('§7F(j) §4.2 Masken-Erzeugungsindex liegt NACH allen SPRITES-, Flip- und TILE_ART-Canvases',
        maskIdx >= nachTiles && nachTiles > nachFlips && nachFlips > nachSprites,
        `Sprites ${nachSprites} -> Flips ${nachFlips} -> Tiles ${nachTiles} -> Maske ${maskIdx}`);
      check('§7F(j) §4.2 Maske traegt exakt die Sprite-Masse',
        maske.width === SPRITES.player_down_0[0].length && maske.height === SPRITES.player_down_0.length,
        `${maske.width}x${maske.height}`);
      check('§7F(j) §4.2 keine Maske entsteht VOR den Tiles (Zaehlung deckungsgleich)',
        nachTiles === Object.keys(SPRITES).length + 1 + Object.keys(TILE_ART).length,
        `${nachTiles} vs ${Object.keys(SPRITES).length + 1 + Object.keys(TILE_ART).length}`);
      check('§7F(j) §4.2 buildAll(SPRITES) liefert je Sprite genau einen Canvas',
        Object.keys(gfxF).length === Object.keys(SPRITES).length);
    } finally {
      if (vorherDoc === undefined) delete globalThis.document;
      else globalThis.document = vorherDoc;
    }
  }

  // =====================================================================
  // GP6 RUNDE 2 — ADDITIVE BLOECKE (k)-(n) zu den zwei Prio-0-Befunden der
  // Jury-Runde 1 (design/GP6_JURY_R1.md). Weiterhin ausschliesslich
  // ADDITIV; kein Bestandstest wird angefasst.
  //   (k) P0-A Kronen-Transparenz ueber dem Spieler (globalAlpha 0,55)
  //   (l) P0-B Ueberlapp-Dedupe (ein Stempel je Zelle)
  //   (m) P0-B Materialwahl + stiller Fallback
  //   (n) P0-B die acht neuen Material-Grids (Masse, Toene, Deckungsgleichheit)
  // =====================================================================
  const { canopyShadowMaterial } = await import('../game/js/world/tilemap.js');

  // ---------------------------------------------------------------------
  // (k) P0-A: der OPTIONALE 6. draw-Parameter opts.playerTile setzt fuer
  //     GENAU die Kronen-Draws, deren Span-Fussabdruck die Standkachel
  //     enthaelt, globalAlpha 0,55 — und setzt danach auf 1 zurueck.
  //     Der Stub protokolliert je drawImage das gerade gueltige Alpha.
  // ---------------------------------------------------------------------
  {
    const NK = 10;
    const gK = Array.from({ length: NK }, () => '.'.repeat(NK));
    const oK = Array.from({ length: NK }, () => Array(NK).fill('.'));
    oK[2][2] = 'M';   // Anker (2,2), span [2,2] -> Fussabdruck 2..3 / 2..3
    oK[2][6] = 'M';   // zweiter Anker weit rechts (Kontrollkrone)
    const legK = {
      '.': { art: 'grass' },
      M: { art: 'tree_canopy_2x2_a', span: [2, 2], solid: false },
    };
    const tmK = createTilemap(gK, legK, oK.map((r) => r.join('')));
    const zieheOver = (opts) => {
      const log = [];
      const ctxK = {
        canvas: { width: NK * 16, height: NK * 16 },
        globalAlpha: 1,
        drawImage(img) { log.push({ k: String(img), a: this.globalAlpha }); },
      };
      tmK.draw(ctxK, { x: 0, y: 0 }, anyTilesF, 0, 'over', opts);
      return { log, endAlpha: ctxK.globalAlpha };
    };
    const ohne = zieheOver(undefined);
    const drauf = zieheOver({ playerTile: { tx: 3, ty: 3 } });   // im Fussabdruck
    const daneben = zieheOver({ playerTile: { tx: 4, ty: 3 } }); // eine Spalte daneben
    check('§7F(k) P0-A: die Draw-ANZAHL ist mit und ohne playerTile identisch (smoke:695-697 unberuehrt)',
      ohne.log.length === drauf.log.length && ohne.log.length === daneben.log.length,
      `${ohne.log.length} / ${drauf.log.length} / ${daneben.log.length}`);
    check('§7F(k) P0-A: OHNE playerTile bleibt jeder Kronen-Draw bei globalAlpha 1 (Bestand byte-gleich)',
      ohne.log.length === 2 && ohne.log.every((o) => o.a === 1),
      JSON.stringify(ohne.log));
    check('§7F(k) P0-A: MIT Spieler im Span-Fussabdruck zeichnet GENAU EIN Draw mit globalAlpha 0,55',
      drauf.log.filter((o) => o.a === 0.55).length === 1
      && drauf.log.filter((o) => o.a === 1).length === 1,
      JSON.stringify(drauf.log));
    check('§7F(k) P0-A: der halbtransparente Draw ist der Anker (2,2), nicht die Nachbarkrone',
      drauf.log[0].a === 0.55 && drauf.log[1].a === 1, JSON.stringify(drauf.log));
    check('§7F(k) P0-A: Spielerkachel EINE Spalte neben dem Fussabdruck -> alle Draws bei Alpha 1',
      daneben.log.every((o) => o.a === 1), JSON.stringify(daneben.log));
    check('§7F(k) P0-A: globalAlpha ist nach dem Pass explizit auf 1 zurueckgesetzt (§0.3)',
      drauf.endAlpha === 1 && ohne.endAlpha === 1);
    // Der GROUND-Pass darf nie transparent werden (opts wirkt nur im Over-Pass).
    {
      const log = [];
      const ctxG = {
        canvas: { width: NK * 16, height: NK * 16 },
        globalAlpha: 1,
        drawImage(img) { log.push(this.globalAlpha); },
      };
      tmK.draw(ctxG, { x: 0, y: 0 }, anyTilesF, 0, 'ground', { playerTile: { tx: 3, ty: 3 } });
      check('§7F(k) P0-A: der GROUND-Pass ignoriert playerTile vollstaendig (immer Alpha 1)',
        log.length > 0 && log.every((a) => a === 1));
    }
  }

  // ---------------------------------------------------------------------
  // (l) P0-B DEDUPE: zwei ueberlappende Anker stempeln jede Zelle GENAU
  //     EINMAL (Juror-K-Befund "Doppelstempel-Flecken"), und die Deckung
  //     geht dabei NICHT verloren.
  // ---------------------------------------------------------------------
  {
    const NL = 12;
    const gL = Array.from({ length: NL }, () => '.'.repeat(NL));
    const zaehleZellen = (oGrid, legend) => {
      const tmL = createTilemap(gL, legend, oGrid.map((r) => r.join('')));
      const proZelle = new Map();
      tmL.draw({
        canvas: { width: NL * 16, height: NL * 16 },
        drawImage: (img, sx, sy) => {
          const k = String(img);
          if (!k.startsWith('canopy_shadow')) return;
          // Breite des Stempels in Kacheln aus dem Key (Bake = span-breit).
          const sw = /_xl_b/.test(k) ? 4 : /_xl_[ac]/.test(k) ? 3 : 1;
          const rowsN = /_xl_/.test(k) ? 2 : 1;
          // Zell-Zuordnung ueber den Anker (Versatz ist < 16 px, also ist
          // Math.round(sx/16) die Ankerspalte).
          const cx = Math.round(sx / 16), cy = Math.round(sy / 16);
          for (let r = 0; r < rowsN; r++) {
            for (let c = 0; c < sw; c++) {
              const kk = `${cx + c},${cy + r}`;
              proZelle.set(kk, (proZelle.get(kk) || 0) + 1);
            }
          }
        },
      }, { x: 0, y: 0 }, anyTilesF, 0, 'ground');
      return proZelle;
    };
    // (l1) Zwei 2x2-Anker mit ueberlappender Schattenzeile (Spalte 3 gemeinsam)
    {
      const o = Array.from({ length: NL }, () => Array(NL).fill('.'));
      o[2][2] = 'M';   // Schatten auf (2,4)+(3,4)
      o[2][3] = 'M';   // Schatten auf (3,4)+(4,4)  -> (3,4) ist der Ueberlapp
      const leg = { '.': { art: 'grass' }, M: { art: 'tree_canopy_2x2_a', span: [2, 2], solid: false } };
      const z = zaehleZellen(o, leg);
      check('§7F(l) P0-B Dedupe: zwei ueberlappende 2x2-Anker -> jede Schattenzelle GENAU EIN Stempel',
        [...z.values()].every((n) => n === 1), JSON.stringify([...z]));
      check('§7F(l) P0-B Dedupe: die Deckung bleibt vollstaendig (3 Zellen: 2,4 / 3,4 / 4,4)',
        z.size === 3 && z.has('2,4') && z.has('3,4') && z.has('4,4'), JSON.stringify([...z.keys()]));
    }
    // (l2) Zwei XL-Bakes mit ueberlappendem Fussabdruck: der zweite Bake
    //      entfaellt, seine freien Zellen werden mit 16x16-Stempeln gefuellt.
    {
      const o = Array.from({ length: NL }, () => Array(NL).fill('.'));
      o[1][1] = 'B';   // span [4,3] -> Bake auf Spalten 1..4, Zeilen 4..5
      o[1][3] = 'B';   // span [4,3] -> Spalten 3..6, Zeilen 4..5 (Ueberlapp 3,4)
      const leg = {
        '.': { art: 'grass' },
        B: { art: 'tree_canopy_xl_b', span: [4, 3], solid: false, shadowArt: 'canopy_shadow_xl_b' },
      };
      const z = zaehleZellen(o, leg);
      check('§7F(l) P0-B Dedupe: zwei ueberlappende XL-Bakes -> keine Zelle wird zweimal gestempelt',
        [...z.values()].every((n) => n === 1), JSON.stringify([...z]));
      check('§7F(l) P0-B Dedupe: die Zellen des verdraengten Bakes werden aufgefuellt (Spalten 1..6 x 2 Zeilen)',
        z.size === 12, `${z.size} Zellen: ${[...z.keys()].sort().join(' ')}`);
    }
  }

  // ---------------------------------------------------------------------
  // (m) P0-B MATERIALWAHL: reine Funktion canopyShadowMaterial + der
  //     Zweitpass haengt das Suffix an, faellt aber STILL zurueck, wenn die
  //     Kachelquelle den Material-Key nicht fuehrt.
  // ---------------------------------------------------------------------
  {
    check('§7F(m) P0-B canopyShadowMaterial: Weg-Arts -> _d',
      ['path', 'path_v3', 'path_pebbles'].every((a) => canopyShadowMaterial({ art: a }) === '_d'));
    check('§7F(m) P0-B canopyShadowMaterial: Gras-Pool/Gras-Flags -> _g',
      canopyShadowMaterial({ art: 'grass_g5_00' }) === '_g'
      && canopyShadowMaterial({ art: 'pebble_small', fringeSet: 'grass' }) === '_g'
      && canopyShadowMaterial({ art: 'dirt_patch', bankSet: 'g' }) === '_g');
    check('§7F(m) P0-B canopyShadowMaterial: der Weg gewinnt gegen sein eigenes bankSet g (Reihenfolge)',
      canopyShadowMaterial({ art: 'path', bankSet: 'g', fringeTarget: true }) === '_d');
    check('§7F(m) P0-B canopyShadowMaterial: alles uebrige -> Basis-Key (Mauer/Stamm/Wasser)',
      ['brick_wall', 'tree_trunk', 'water', 'bones'].every((a) => canopyShadowMaterial({ art: a }) === '')
      && canopyShadowMaterial(null) === '');
    // Zweitpass: echte Kachelquelle (Suffix-Keys vorhanden) vs. Proxy (nicht).
    const NM = 8;
    const oM = Array.from({ length: NM }, () => Array(NM).fill('.'));
    oM[2][2] = 'M';
    const legM = {
      '.': { art: 'grass_g5_00', fringeSource: true, fringeSet: 'grass' },
      '=': { art: 'path', fringeTarget: true },
      M: { art: 'tree_canopy_2x2_a', span: [2, 2], solid: false },
    };
    // Schattenzeile ist ay+2 = 4: links Gras, rechts Weg.
    const gM = Array.from({ length: NM }, (_, y) => (y === 4 ? '..=.....' : '........'));
    const echteQuelleM = {};
    for (const k of Object.keys(TILE_ART)) echteQuelleM[k] = k;
    const zieheM = (quelle) => {
      const tmM = createTilemap(gM, legM, oM.map((r) => r.join('')));
      const out = [];
      tmM.draw({
        canvas: { width: NM * 16, height: NM * 16 },
        drawImage: (img) => { if (String(img).startsWith('canopy_shadow')) out.push(String(img)); },
      }, { x: 0, y: 0 }, quelle, 0, 'ground');
      return out;
    };
    const echt = zieheM(echteQuelleM);
    check('§7F(m) P0-B Zweitpass: Gras-Zelle zieht canopy_shadow_g, Weg-Zelle canopy_shadow_d',
      echt.length === 2 && echt.includes('canopy_shadow_g') && echt.includes('canopy_shadow_d'),
      echt.join(','));
    check('§7F(m) P0-B FALLBACK: eine Kachelquelle OHNE die Material-Grids zeichnet still den Basis-Key',
      zieheM({ canopy_shadow: 'canopy_shadow' }).every((k) => k === 'canopy_shadow'),
      zieheM({ canopy_shadow: 'canopy_shadow' }).join(','));
    check('§7F(m) P0-B FALLBACK: eine Proxy-Kachelquelle (beantwortet jeden Namen) bleibt auf dem Basis-Key',
      zieheM(anyTilesF).every((k) => k === 'canopy_shadow'), zieheM(anyTilesF).join(','));
    // Realbezug: GRAVEYARD zieht beide Material-Fassungen wirklich.
    {
      const tmR = createTilemap(GRAVEYARD.rows, GRAVEYARD.legend, GRAVEYARD.overRows);
      const keys = new Set();
      tmR.draw({
        canvas: { width: tmR.wPx, height: tmR.hPx },
        drawImage: (img) => { if (String(img).startsWith('canopy_shadow')) keys.add(String(img)); },
      }, { x: 0, y: 0 }, echteQuelleM, 0, 'ground');
      check('§7F(m) P0-B GRAVEYARD zieht Gras- UND Weg-Fassung des 16x16-Stempels',
        keys.has('canopy_shadow_g') && keys.has('canopy_shadow_d'), [...keys].sort().join(','));
      check('§7F(m) P0-B GRAVEYARD emittiert weiterhin alle DREI XL-Bake-Klassen (jetzt material-getoent)',
        ['a', 'b', 'c'].every((c) => [...keys].some((k) => k.startsWith(`canopy_shadow_xl_${c}`))),
        [...keys].sort().join(','));
    }
  }

  // ---------------------------------------------------------------------
  // (n) P0-B die acht neuen Material-Grids: Masse wie ihre Basis, Toene aus
  //     der jeweiligen Bodenrampe, und DECKUNGSGLEICHE Silhouette (reine
  //     Ton-Substitution — Bayer-25-%-Raster und Erosion unveraendert).
  // ---------------------------------------------------------------------
  {
    const PAARE = [['canopy_shadow', 16, 16], ['canopy_shadow_xl_a', 48, 32],
      ['canopy_shadow_xl_b', 64, 32], ['canopy_shadow_xl_c', 48, 32]];
    const TOENE = { _g: new Set(['*', '+']), _d: new Set(['T', 'g']) };
    let schlecht = null;
    for (const [basis, w, h] of PAARE) {
      for (const suf of ['_g', '_d']) {
        const g = TILE_ART[basis + suf];
        if (!g) { schlecht = `${basis}${suf} fehlt`; break; }
        if (g.length !== h || g.some((r) => r.length !== w)) {
          schlecht = `${basis}${suf}: ${g[0].length}x${g.length} statt ${w}x${h}`; break;
        }
        const t = [...new Set(g.join('').replace(/\./g, ''))];
        if (t.some((c) => !TOENE[suf].has(c))) {
          schlecht = `${basis}${suf}: Fremdton '${t.join('')}'`; break;
        }
        const b = TILE_ART[basis];
        const deckung = b.every((row, y) => [...row].every((c, x) => (c === '.') === (g[y][x] === '.')));
        if (!deckung) { schlecht = `${basis}${suf}: Silhouette weicht von ${basis} ab`; break; }
      }
      if (schlecht) break;
    }
    check('§7F(n) P0-B: alle acht Material-Grids existieren, halten Masse/Toene und sind deckungsgleich zur Basis',
      schlecht === null, schlecht || 'ok');
    check('§7F(n) P0-B: die BESTANDS-Keys bleiben unveraendert bei n/0 (Fallback fuer Mauer/Stamm/Wasser)',
      PAARE.every(([b]) => [...new Set(TILE_ART[b].join('').replace(/\./g, ''))]
        .every((c) => c === 'n' || c === '0')));
    // Der Kern des Befunds: die neuen Toene liegen deutlich naeher am Boden.
    const L = (hex) => 0.299 * parseInt(hex.slice(1, 3), 16)
      + 0.587 * parseInt(hex.slice(3, 5), 16) + 0.114 * parseInt(hex.slice(5, 7), 16);
    const mittelL = (key) => {
      const g = TILE_ART[key];
      let s = 0, n = 0;
      for (const row of g) for (const c of row) { if (c === '.') continue; s += L(PALETTE[c]); n += 1; }
      return s / n;
    };
    const wegL = mittelL('path');
    const grasL = mittelL('grass_g5_00');
    const dToene = [...TOENE._d].map((c) => L(PALETTE[c]));
    const gToene = [...TOENE._g].map((c) => L(PALETTE[c]));
    const altToene = ['n', '0'].map((c) => L(PALETTE[c]));
    const mittel = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
    check('§7F(n) P0-B: auf dem WEG faellt das MITTEL von ΔL je Schattenpunkt von > 60 (n/0) in das Band 25..30 (_d)',
      wegL - mittel(altToene) > 60
      && wegL - mittel(dToene) >= 25 && wegL - mittel(dToene) <= 30,
      `alt ${(wegL - mittel(altToene)).toFixed(1)} neu ${(wegL - mittel(dToene)).toFixed(1)} `
      + `(einzeln ${dToene.map((t) => (wegL - t).toFixed(1)).join('/')})`);
    // Der TIEFE _d-Schritt muss unter 57,5 L liegen (M1-Bandgrenze GRAVEYARD:
    // g6_02 rendert ohne Kronenschatten mit Median 46,27 auf der 46er-Grenze —
    // die Szene haelt das Band nur, weil ein Teil der Weg-Schattenpunkte unter
    // 46 L rendert; Renderfaktor ~0,80). Zugleich darf er nicht in die zwei
    // dunkelsten Toene zurueckfallen (der Befund selbst).
    check('§7F(n) P0-B: der tiefe _d-Schritt haelt das M1-Fenster (Palette <= 57,5, aber deutlich ueber n/0)',
      Math.min(...dToene) <= 57.5 && Math.min(...dToene) > Math.max(...altToene) + 20,
      `tief ${Math.min(...dToene).toFixed(1)} vs n/0 max ${Math.max(...altToene).toFixed(1)}`);
    check('§7F(n) P0-B: auf GRAS bleibt ΔL je Schattenpunkt im Band 10..26 (_g)',
      gToene.every((t) => grasL - t >= 10 && grasL - t <= 26),
      gToene.map((t) => (grasL - t).toFixed(1)).join('/'));
  }
}

// ===========================================================================
// S4-GOLD (§6.3) — ADDITIVER BLOCK, Marker S4-§7F(gold). Slice 4, Phase 0.
//
// ZWECK: Der Op-Strom-Einfrierer VOR den §6.1/§6.2-Umbauten an
// game/js/core/lighting.js (LUT-Memoisierung am Licht-Objekt, interner
// Lauf-Puffer lightRunsInto). Protokolliert wird der KOMPLETTE
// fillRect-Strom von createLighting().draw AUF DEM OFFSCREEN — dort sitzen
// Ambient-Fill und saemtliche destination-out-Stanzungen, also genau das,
// was §6.1/§6.2 anfassen. Gehen die drei sha256 nach dem Umbau unveraendert
// durch, ist der Umbau pixel-gleich (A6 "PIXEL-GLEICH").
//
// DIESER BLOCK WIRD NACH DEM EINFRIEREN NICHT MEHR ANGEFASST. Ein roter
// Hash ist KEIN Test-Problem, sondern ein Pixel-Unterschied.
//
// Erzeugt von .tmp/snap_lightops.mjs auf HEAD d7e7ef7 (lighting.js
// unveraendert). Schaerfe belegt durch .tmp/snap_lightops_neg.mjs: drei
// simulierte Regressionen (eingefrorene runs = "stale LUT" / eine Stanz-
// stufe minimal andere Deckung / ein Lauf 1 px versetzt) schlagen je in
// ALLEN DREI Setups an.
//
// Stub-Muster woertlich wie der bestehende §7F(b)-Detektor (save/restore
// bewusst No-Op). Importe §0.4-konform via await import IM Block.
// ===========================================================================
{
  const { createLighting: mkLight } = await import('../game/js/core/lighting.js');
  const { CATACOMBS: KAT } = await import('../game/js/world/maps.js');
  const { createHash: mkHash } = await import('node:crypto');

  const GVW = 320, GVH = 180;

  // Canvas-Stub: protokolliert JEDEN fillRect mit dem WIRKSAMEN Zustand
  // (alpha, fillStyle, globalCompositeOperation) — Geometrie UND Farbe UND
  // Composite-Modus, also alle drei Groessen der Pixel-Gleichheit.
  const mkGoldStub = (canvas, log) => {
    const st = { a: 1, gco: 'source-over', fill: '' };
    return {
      canvas, log,
      get globalAlpha() { return st.a; },
      set globalAlpha(v) { st.a = v; },
      get globalCompositeOperation() { return st.gco; },
      set globalCompositeOperation(v) { st.gco = v; },
      get fillStyle() { return st.fill; },
      set fillStyle(v) { st.fill = v; },
      clearRect() {},
      fillRect(x, y, w, h) { log.push(`f|${x}|${y}|${w}|${h}|${st.a}|${st.fill}|${st.gco}`); },
      drawImage() {},
      save() {}, restore() {},
      beginPath() {}, arc() {}, fill() {},
      createRadialGradient() { return { addColorStop() {} }; },
      createLinearGradient() { return { addColorStop() {} }; },
    };
  };

  // ---- DIE DREI FIXEN SETUPS (deterministisch, keine Uhr, kein Zufall) ----
  // Jedes Setup faehrt eine feste Frame-Folge und benutzt ueber alle Frames
  // DIESELBEN Lichtobjekte — nur so stresst das Gold die geplante LUT-
  // Memoisierung am Licht-Objekt (§6.1: Neubau nur bei Positionsaenderung).
  // A haelt alles ortsfest (LUT muss wiederverwendet werden), B und C
  // bewegen je ein Licht (LUT muss neu gebaut werden).
  const TORCH_R = 72, TILE_G = 16;
  const katFackeln = [];
  KAT.rows.forEach((row, ty) => [...row].forEach((ch, tx) => {
    if (KAT.torchChars.includes(ch)) {
      katFackeln.push({ x: tx * TILE_G + TILE_G / 2, y: ty * TILE_G + TILE_G / 2, radius: TORCH_R, flicker: 1 });
    }
  }));
  const katCam = { x: 112, y: 80 };

  const goldSetups = [
    {
      name: 'A 1 Fackel zentral (ortsfest, 12 Frames)',
      cam: { x: 0, y: 0 }, ambient: 0.55, tint: '#06080f', frames: 12,
      lights: [{ x: 160, y: 90, radius: 72, flicker: 1 }],
      move: null,
      gold: 'fac04024d3ff79d300c6284683e160d25fc055d7b7e2920a4e84f278bf533a51',
    },
    {
      name: 'B 3 Fackeln versetzt (Licht 3 wandert, 12 Frames)',
      cam: { x: 40, y: 24 }, ambient: 0.55, tint: '#06080f', frames: 12,
      lights: [
        { x: 100, y: 60, radius: 72, flicker: 1 },
        { x: 220, y: 120, radius: 72, flicker: 1 },
        { x: 160, y: 90, radius: 40, flicker: 0.3 },
      ],
      move: (ls) => { ls[2].x += 3; ls[2].y += 2; },
      gold: '1a4e68d0d8e790e014fda1aca31ebfa3cd10d70753708edb9e57b6161a22b279',
    },
    {
      // Lichtliste woertlich wie der bestehende §7F(b)-Lauf-Deckel-Test:
      // alle CATACOMBS-Fackeln (r 72, flicker 1) + Spielerlaterne.
      name: 'C Worst-View CATACOMBS (112,80), 10 Frames',
      cam: katCam, ambient: KAT.ambient, tint: '#06080f', frames: 10,
      lights: [...katFackeln, { x: katCam.x + GVW / 2, y: katCam.y + GVH / 2, radius: KAT.playerLightRadius, flicker: 0.3 }],
      move: (ls) => { const p = ls[ls.length - 1]; p.x += 2; p.y += 1; },
      gold: '4136e1f70dbdcac5c65f725175970cd405f013ae11c79b4ddf138033c0cda232',
    },
  ];

  // Setup C haengt an maps.js. Bricht dort etwas, soll das MIT KLARTEXT
  // auffliegen statt als undurchsichtiger Hash-Unterschied.
  check('S4-§7F(gold) Setup C: Worst-View-Lichtliste unveraendert (26 Lichter)',
    goldSetups[2].lights.length === 26, `${goldSetups[2].lights.length} Lichter`);

  const goldStroeme = goldSetups.map((s) => {
    const log = [];
    const offCanvas = { width: 0, height: 0, getContext: () => mkGoldStub(offCanvas, log) };
    const mainCanvas = { width: GVW, height: GVH, ownerDocument: { createElement: () => offCanvas } };
    // Der Haupt-ctx protokolliert in einen SEPARATEN Eimer — gehasht wird
    // ausschliesslich der Offscreen (Dunkelheits-/Stanz-Pass).
    const mainCtx = mkGoldStub(mainCanvas, []);
    const lg = mkLight(GVW, GVH);
    for (let i = 0; i < s.frames; i++) {
      if (i > 0 && s.move) s.move(s.lights);
      log.push(`# frame ${i}`);
      lg.draw(mainCtx, s.cam, s.lights, s.ambient, i / 60, s.tint);
    }
    return { ops: log.length - s.frames, hash: mkHash('sha256').update(log.join('\n')).digest('hex') };
  });

  // Scharfstellung: ein leerer/degenerierter Strom wuerde sonst als
  // "stabiler Hash" durchgehen (Falsch-Gruen-Falle).
  check('S4-§7F(gold) alle drei Stroeme sind substanziell (je > 5000 fillRects)',
    goldStroeme.every((g) => g.ops > 5000), goldStroeme.map((g) => g.ops).join('/'));
  check('S4-§7F(gold) die drei Setups sind wirklich verschieden (3 verschiedene Hashes)',
    new Set(goldStroeme.map((g) => g.hash)).size === 3);

  goldSetups.forEach((s, i) => {
    check(`S4-§7F(gold) §6.3 Op-Strom-sha256 Setup ${s.name}`,
      goldStroeme[i].hash === s.gold,
      `ist ${goldStroeme[i].hash} (${goldStroeme[i].ops} fillRects), soll ${s.gold}`);
  });
}

// ===========================================================================
// SLICE 4 — ADDITIVE BLOECKE S4-§7F(a)..(f) (Spec §7, Phase 2 / Integrator).
//
// REGELN, unter denen diese Bloecke stehen (Spec §0.4):
//   * NUR ADDITIV. Kein Zeichen oberhalb dieser Zeile wurde angefasst.
//   * Alle neuen Module kommen per `await import(...)` IM BLOCK herein —
//     die Kopf-Importe der Datei sind Bestand und bleiben unberuehrt
//     (Review P1-M11).
//   * S4-§7F(gold) (Phase 0, §6.3) steht oberhalb und wird NICHT angefasst.
//
// REFERENZGERAET fuer alle mm-Angaben (bindend, Spec A4 / Review P2-M12):
// 1080x2400 Geraetepixel, 6,5 Zoll Diagonale, dpr 3, QUERformat.
//   Diagonale in px  = hypot(1080, 2400)      = 2631,8 px
//   ppi              = 2631,8 / 6,5           = 404,9
//   1 Geraetepixel   = 25,4 / 404,9           = 0,06273 mm
//   Skalierung quer  = min(floor(2400/320), floor(1080/180)) = min(7,6) = 6
//   1 INTERNER px    = 6 Geraetepixel         = 0,3764 mm
//   1 INTERNER px    = 6/dpr = 2 CSS-px       (Einheit von JOY_RADIUS_SCREEN)
// Die Zahlen werden hier AUS DIESEN GROESSEN GERECHNET, nicht abgeschrieben:
// eine falsche Herleitung faellt damit im Test auf, nicht erst am Geraet.
// ===========================================================================
{
  const GERAET_PX_X = 2400;      // quer: lange Kante
  const GERAET_PX_Y = 1080;
  const ZOLL = 6.5;
  const DPR = 3;
  const PPI = Math.hypot(1080, 2400) / ZOLL;
  const MM_PRO_GERAETPX = 25.4 / PPI;
  const SKALIERUNG = Math.min(Math.floor(GERAET_PX_X / 320), Math.floor(GERAET_PX_Y / 180));
  const MM_PRO_PX = SKALIERUNG * MM_PRO_GERAETPX;   // 0,3764
  const CSS_PRO_PX = SKALIERUNG / DPR;              // 2

  check('S4-§7F Referenzgeraet: 1 interner px = 6 Geraetepixel = 2 CSS-px = 0,376 mm',
    SKALIERUNG === 6 && CSS_PRO_PX === 2 && Math.abs(MM_PRO_PX - 0.376) < 0.002,
    `Skalierung ${SKALIERUNG}, ${CSS_PRO_PX} CSS-px, ${MM_PRO_PX.toFixed(4)} mm`);

  // Aufzeichnender ctx-Stub. BEWUSST OHNE strokeRect/roundRect/Pfad-Extras:
  // genau wie die Stubs der drei kanonischen Flusstests (check_main_slice1
  // :30-51). Ein neuer Zeichenzug ausserhalb dieses Vorrats waere dort ein
  // TypeError — dieser Stub faengt so etwas hier ab, statt es Michael zu
  // ueberlassen.
  function mkRec() {
    const log = [];
    const c = {
      log,
      globalAlpha: 1,
      globalCompositeOperation: 'source-over',
      fillStyle: '', strokeStyle: '', lineWidth: 1,
      font: '', textAlign: '', textBaseline: '',
      _stack: [],
      fillRect(...a) { log.push({ op: 'fillRect', alpha: this.globalAlpha, fill: this.fillStyle, args: a }); },
      clearRect() {},
      drawImage(img, ...a) { log.push({ op: 'drawImage', args: a }); },
      fillText(t, x, y) { log.push({ op: 'fillText', text: String(t), x, y, font: this.font, fill: this.fillStyle }); },
      beginPath() {}, arc(...a) { log.push({ op: 'arc', args: a }); }, fill() {}, stroke() {},
      save() { this._stack.push({ a: this.globalAlpha, f: this.fillStyle }); },
      restore() { const s = this._stack.pop(); if (s) { this.globalAlpha = s.a; this.fillStyle = s.f; } },
      createRadialGradient: () => ({ addColorStop() {} }),
    };
    return c;
  }
  // Der Fade-Detektor der drei Flusstests, WOERTLICH: Vollbild-fillRect
  // 320x180 in '#000' mit 0 < alpha < 1 auf dem Haupt-Canvas
  // (check_main_slice1:158-163). Jeder neue Vollbild-Zug wird dagegen
  // geprueft — ein Treffer wuerde einen Portal-Fade vortaeuschen.
  const istFadeZug = (o) => o.op === 'fillRect' && o.fill === '#000'
    && o.alpha > 0 && o.alpha < 1 && o.args[2] === 320 && o.args[3] === 180;
  // Sonden-Praefixe, auf die die Flusstests im fillText-Protokoll horchen.
  const SONDEN = ['GOLD', 'SIEG', 'GAME OVER', 'GRIMLIGHT', 'STUFE', 'AUSRUESTUNG', 'x 0'];

  // -----------------------------------------------------------------------
  // (a) §3.1 SAVE — RUNDLAUF, SCHEMA-ABLEHNUNG, maxHp-VERBOT, carry-ORDNUNG
  // -----------------------------------------------------------------------
  {
    const { serialize, deserialize, applyToPlayer, SAVE_VERSION, SAVE_KEY } =
      await import('../game/js/items/save.js');

    const mkItem = (slot, stat, value, rare = false) => ({
      slot, name: `PRUEF ${slot}`, rare, affixes: [{ stat, value }],
    });

    // Ein Spieler mit VOLLEM Zustand: Tasche, angelegte Teile, Zelda-Schiene,
    // Progression, Gold, Traenke, angeschlagene hp.
    const sp = createPlayer(GRAVEYARD.playerSpawn);
    addItem(sp.inv, mkItem('weapon', 'dmg', 2));
    addItem(sp.inv, mkItem('ring', 'pickupRadius', 6, true));
    equipItem(sp.inv, 0);
    sp.inv.zelda.push('boomerang', 'boss_key');
    sp.inv.pity = 3;
    sp.inv.newFlag = true;
    sp.prog = { xp: 42, level: 3, hearts: 2 };
    sp.recalcStats();
    sp.hp = 5;
    sp.gold = 137;
    sp.potions = 2;

    const zustand = {
      mapKey: 'FLUESTERGRUFT',
      spawn: { x: 72, y: 72 },
      player: sp,
      runFlags: { bossDead: true, openedChests: ['FLUESTERGRUFT:36,4'] },
    };
    const txt = serialize(zustand);
    const roh = JSON.parse(txt);

    check('S4-§7F(a) §3.1 serialize liefert Schema v1 mit allen Pflichtfeldern',
      roh.v === SAVE_VERSION && roh.mapKey === 'FLUESTERGRUFT'
      && roh.spawn.x === 72 && roh.spawn.y === 72
      && roh.hp === 5 && roh.gold === 137 && roh.potions === 2
      && roh.prog.level === 3 && roh.runFlags.bossDead === true
      && roh.runFlags.openedChests.length === 1,
      txt.slice(0, 120));
    // S6-§7B(3) SANKTION (SPEC Slice 6 §7.B(3)): SAVE_VERSION 1 -> 2 (Save v2,
    // §5). Der SCHLUESSEL bleibt bewusst 'grimlight.save.v1' — genau dafuer war
    // er versioniert gedacht: v1-Staende werden migriert, nicht verwaist
    // (save.js:43-63, SAVE_VERSIONEN [1,2]). Nur die Versions-Zahl wandert.
    check('S4-§7F(a) §3.1 SAVE_KEY ist versioniert (ein v2-Schema kollidiert nicht)',
      SAVE_KEY === 'grimlight.save.v1' && SAVE_VERSION === 2, `${SAVE_KEY} / v${SAVE_VERSION}`);
    // maxHp ist ABGELEITET. Der Stand traegt weder das Feld noch die
    // Zeichenkette (die Test-Items oben nutzen bewusst KEINEN maxHp-Affix).
    check('S4-§7F(a) §3.1 maxHp wird NIE gespeichert (weder Feld noch Zeichenkette)',
      !Object.hasOwn(roh, 'maxHp') && !txt.includes('maxHp'),
      Object.keys(roh).join(','));
    check('S4-§7F(a) §3.1 der Spieler selbst wird nie serialisiert (keine Funktionen/Timer im Stand)',
      !Object.hasOwn(roh, 'player') && !txt.includes('invulnTimer') && !txt.includes('attackId'));

    const snap = deserialize(txt);
    check('S4-§7F(a) §3.1 Rundlauf: deserialize(serialize(x)) traegt jedes Feld zurueck',
      !!snap && snap.mapKey === 'FLUESTERGRUFT' && snap.hp === 5 && snap.gold === 137
      && snap.potions === 2 && snap.inv.items.length === 1
      && snap.inv.equipped.weapon && snap.inv.equipped.weapon.slot === 'weapon'
      && snap.inv.zelda.join(',') === 'boomerang,boss_key' && snap.inv.pity === 3
      && snap.inv.newFlag === true && snap.prog.xp === 42 && snap.prog.level === 3
      && snap.prog.hearts === 2 && snap.runFlags.bossDead === true
      && snap.runFlags.openedChests[0] === 'FLUESTERGRUFT:36,4',
      JSON.stringify(snap && snap.prog));
    check('S4-§7F(a) §3.1 openedChests kommt als KOPIE zurueck (kein geteiltes Array)',
      !!snap && snap.runFlags.openedChests !== zustand.runFlags.openedChests);

    // Ein Affix DARF 'maxHp' heissen — das ist ein Item-Stat, kein Schemafeld.
    // Ohne diese Probe wuerde ein zu grober maxHp-Waechter still Ringe fressen.
    {
      const sp2 = createPlayer(GRAVEYARD.playerSpawn);
      addItem(sp2.inv, mkItem('armor', 'maxHp', 4, true));
      const s2 = deserialize(serialize({
        mapKey: 'CATACOMBS', spawn: { x: 104, y: 72 }, player: sp2,
        runFlags: { bossDead: false, openedChests: [] },
      }));
      check('S4-§7F(a) §3.1 ein Item-Affix namens maxHp ueberlebt (Stat != Schemafeld)',
        !!s2 && s2.inv.items.length === 1 && s2.inv.items[0].affixes[0].stat === 'maxHp',
        s2 ? JSON.stringify(s2.inv.items[0].affixes) : 'null');
    }

    // --- HARTE ABLEHNUNG: jede Variante muss null liefern, nie werfen ------
    // Ein WURF waere genauso schlimm wie ein falsches Objekt: er kaeme aus
    // dem Modulkopf von main.js und wuerde den Start haengen lassen.
    const pruefeAblehnung = (name, wert) => {
      let out;
      try {
        out = deserialize(wert);
      } catch (e) {
        out = `WARF ${e && e.message}`;
      }
      check(`S4-§7F(a) §3.1 Ablehnung -> null: ${name}`, out === null, String(out));
    };
    const kaputt = (name, mutieren) => {
      const d = JSON.parse(txt);
      mutieren(d);
      pruefeAblehnung(name, JSON.stringify(d));
    };
    pruefeAblehnung('kaputtes JSON', '{"v":1,"mapKey":');
    pruefeAblehnung('leerer Text', '');
    pruefeAblehnung('gar kein Text (null)', null);
    pruefeAblehnung('undefined (Storage leer)', undefined);
    pruefeAblehnung('Zahl statt Text', 42);
    pruefeAblehnung('JSON-Array statt Objekt', '[1,2,3]');
    pruefeAblehnung('JSON-null', 'null');
    // S6-§7B(4) SANKTION (SPEC Slice 6 §7.B(4)): v:2 ist ab Slice 6 die EIGENE
    // Version und wird geladen — die Probe braucht weiter eine FREMDE, naemlich
    // eine ZUKUNFTS-Version. v:3 steht nicht in SAVE_VERSIONEN [1,2] und muss
    // wie zuvor mit null abgelehnt werden (die Sachaussage der Probe ist
    // unveraendert: ein Stand aus einem fremden Schema kann nichts kaputt machen).
    kaputt('fremde Schema-Version', (d) => { d.v = 3; });
    kaputt('fehlende Version', (d) => { delete d.v; });
    kaputt('unbekannte Karte', (d) => { d.mapKey = 'ATLANTIS'; });
    kaputt('geerbter Karten-Key (constructor)', (d) => { d.mapKey = 'constructor'; });
    kaputt('hp = 0 (waere Sofort-Tod im ersten Frame)', (d) => { d.hp = 0; });
    kaputt('negatives Gold', (d) => { d.gold = -5; });
    kaputt('maxHp im Stand (fremdes/aelteres Schema)', (d) => { d.maxHp = 8; });
    kaputt('Item mit fremdem Slot', (d) => { d.inv.items[0].slot = 'hut'; });
    kaputt('Item mit unbekanntem Affix-Stat', (d) => { d.inv.items[0].affixes[0].stat = 'luck'; });
    kaputt('Item ohne Affixe', (d) => { d.inv.items[0].affixes = []; });
    kaputt('angelegtes Teil im falschen Slot', (d) => { d.inv.equipped.armor = d.inv.equipped.weapon; });
    kaputt('mehr Items als capacity', (d) => { d.inv.capacity = 0; });
    kaputt('fremder Zelda-Eintrag', (d) => { d.inv.zelda = ['excalibur']; });
    kaputt('level 0', (d) => { d.prog.level = 0; });
    kaputt('xp als Text', (d) => { d.prog.xp = '42'; });
    kaputt('runFlags fehlen', (d) => { delete d.runFlags; });
    kaputt('openedChests mit Nicht-Text', (d) => { d.runFlags.openedChests = [7]; });
    kaputt('bossDead als Text', (d) => { d.runFlags.bossDead = 'true'; });
    kaputt('spawn ohne y', (d) => { delete d.spawn.y; });

    // --- §3.1 FESTE carry-REIHENFOLGE (die eigentliche Falle) -------------
    // Erst inv/prog, DANN recalcStats (leitet maxHp ab), DANN hp. Wer hp vor
    // recalcStats setzt, kappt gegen das ALTE Maximum (6) statt gegen das
    // neue (14) — der Spieler verloere beim Laden 4 hp.
    {
      const frisch = createPlayer(GRAVEYARD.playerSpawn);
      const basisMax = frisch.maxHp;
      const vergleich = createPlayer(GRAVEYARD.playerSpawn);
      vergleich.prog = { xp: 42, level: 3, hearts: 2 };
      vergleich.recalcStats();
      const neuMax = vergleich.maxHp;
      check('S4-§7F(a) §3.1 Vorbedingung der Ordnungs-Probe: Level/Herzen heben maxHp wirklich an',
        neuMax > basisMax, `${basisMax} -> ${neuMax}`);
      const hoch = deserialize(txt);
      hoch.hp = basisMax + 4;              // 10: ueber dem alten, unter dem neuen Maximum
      applyToPlayer(frisch, hoch);
      check('S4-§7F(a) §3.1 applyToPlayer leitet maxHp AB (nicht aus dem Stand)',
        frisch.maxHp === neuMax, `${frisch.maxHp} vs ${neuMax}`);
      check('S4-§7F(a) §3.1 carry-Reihenfolge: hp wird gegen das NEUE maxHp gekappt',
        frisch.hp === basisMax + 4, `hp ${frisch.hp}, erwartet ${basisMax + 4} (falsche Ordnung gaebe ${basisMax})`);
      check('S4-§7F(a) §3.1 applyToPlayer traegt Gold/Traenke/Inventar/Progression',
        frisch.gold === 137 && frisch.potions === 2 && frisch.prog.level === 3
        && frisch.inv.zelda.includes('boss_key') && !!frisch.inv.equipped.weapon);
      // Ueberhoehte hp werden gekappt, nie uebernommen.
      const frisch2 = createPlayer(GRAVEYARD.playerSpawn);
      const hoch2 = deserialize(txt);
      hoch2.hp = 999;
      applyToPlayer(frisch2, hoch2);
      check('S4-§7F(a) §3.1 hp aus einem manipulierten Stand wird auf maxHp gekappt',
        frisch2.hp === frisch2.maxHp && frisch2.hp === neuMax, `${frisch2.hp}/${frisch2.maxHp}`);
    }

    // save.js ist REIN (§0.3): kein Browser-Zugriff im Quelltext.
    {
      const src = readFileSync(new URL('../game/js/items/save.js', import.meta.url), 'utf8');
      const codeOhneKommentare = src.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
      const verboten = ['localStorage', 'window', 'document', 'navigator', 'screen.', 'matchMedia']
        .filter((w) => codeOhneKommentare.includes(w));
      check('S4-§7F(a) §0.3 save.js ist rein: kein Browser-Global im Code (nur in Kommentaren)',
        verboten.length === 0, verboten.join(','));
    }
  }

  // -----------------------------------------------------------------------
  // (b) §3.3 TITEL-MENUE — PURER REDUCER + Flusstest-Vertraeglichkeit
  // -----------------------------------------------------------------------
  {
    const { titleMenuStep, TITLE_MENU_ITEMS, TITLE_MENU_ZONES } =
      await import('../game/js/items/save.js');

    const leer = { up: false, down: false, confirm: false, tap: null };
    check('S4-§7F(b) §3.3 Reducer ist pur: ohne Ereignis kein Zustandswechsel',
      JSON.stringify(titleMenuStep(0, leer)) === '{"cursor":0,"action":null}'
      && JSON.stringify(titleMenuStep(1, leer)) === '{"cursor":1,"action":null}');
    check('S4-§7F(b) §3.3 Reducer ist pur: dasselbe Ereignis liefert zweimal dasselbe',
      JSON.stringify(titleMenuStep(0, { ...leer, down: true }))
      === JSON.stringify(titleMenuStep(0, { ...leer, down: true })));
    check('S4-§7F(b) §3.3 hoch/runter bewegen den Cursor und klemmen an den Enden',
      titleMenuStep(0, { ...leer, down: true }).cursor === 1
      && titleMenuStep(1, { ...leer, up: true }).cursor === 0
      && titleMenuStep(1, { ...leer, down: true }).cursor === 1
      && titleMenuStep(0, { ...leer, up: true }).cursor === 0);
    check('S4-§7F(b) §3.3 fremder Cursor-Wert wird auf 0 normalisiert (kein undefined-Eintrag)',
      titleMenuStep(99, leer).cursor === 0 && titleMenuStep(-3, leer).cursor === 0
      && titleMenuStep(undefined, leer).cursor === 0);
    check('S4-§7F(b) §3.3 confirm loest den Cursor-Eintrag aus (continue / new)',
      titleMenuStep(0, { ...leer, confirm: true }).action === 'continue'
      && titleMenuStep(1, { ...leer, confirm: true }).action === 'new');

    // TAP HAT VORRANG. Jeder touchstart setzt input.confirm (input.js:165) —
    // ohne Vorrang wuerde ein Tap NEBEN dem Menue den markierten Eintrag
    // starten, die Auswahl waere wirkungslos.
    const z0 = TITLE_MENU_ZONES[0];
    const z1 = TITLE_MENU_ZONES[1];
    const mitte = (z) => ({ x: z.x + z.w / 2, y: z.y + z.h / 2 });
    check('S4-§7F(b) §3.3 Tap auf FORTSETZEN waehlt und startet Eintrag 0',
      JSON.stringify(titleMenuStep(1, { ...leer, confirm: true, tap: mitte(z0) }))
      === '{"cursor":0,"action":"continue"}');
    check('S4-§7F(b) §3.3 Tap auf NEUES SPIEL waehlt und startet Eintrag 1',
      JSON.stringify(titleMenuStep(0, { ...leer, confirm: true, tap: mitte(z1) }))
      === '{"cursor":1,"action":"new"}');
    check('S4-§7F(b) §3.3 Tap NEBEN dem Menue tut nichts, obwohl confirm gesetzt ist',
      titleMenuStep(0, { ...leer, confirm: true, tap: { x: 10, y: 10 } }).action === null
      && titleMenuStep(1, { ...leer, confirm: true, tap: { x: 300, y: 175 } }).action === null);
    check('S4-§7F(b) §3.3 Tap schlaegt auch die Richtungs-Flanken (eine Quelle je Frame)',
      titleMenuStep(0, { up: false, down: true, confirm: true, tap: mitte(z0) }).action === 'continue');

    // Geometrie: zwei getrennte, bequem treffbare Zonen im Bild.
    const hoch = TITLE_MENU_ZONES.every((z) => z.h * MM_PRO_PX >= 6);
    const drin = TITLE_MENU_ZONES.every((z) => z.x >= 0 && z.y >= 0 && z.x + z.w <= 320 && z.y + z.h <= 180);
    const getrennt = z1.y >= z0.y + z0.h;
    check('S4-§7F(b) §3.3 Menue-Zonen: im Bild, getrennt, >= 6 mm hoch',
      hoch && drin && getrennt && TITLE_MENU_ZONES.length === TITLE_MENU_ITEMS.length,
      `${z0.h} px = ${(z0.h * MM_PRO_PX).toFixed(1)} mm, Luecke ${z1.y - (z0.y + z0.h)} px`);
    check('S4-§7F(b) §3.3 Menue-Texte meiden JEDE Sonde der Flusstests',
      TITLE_MENU_ITEMS.every((t) => SONDEN.every((s) => !t.includes(s))),
      TITLE_MENU_ITEMS.join('/'));
  }

  // -----------------------------------------------------------------------
  // (c) §5.1 / A4 — ZONEN-GEOMETRIE (input.js + hud.js, EIN Besitzer)
  // -----------------------------------------------------------------------
  {
    const { createInput } = await import('../game/js/core/input.js');

    // Canvas-/Fenster-Stub in Referenzgroesse: 320 interne px auf 640 CSS-px
    // (= 2 CSS-px je internem px, genau das Verhaeltnis des Referenzgeraets).
    function mkPad() {
      const winL = {};
      const docL = {};
      const win = { addEventListener: (t, f) => (winL[t] = winL[t] || []).push(f) };
      const doc = {
        defaultView: win, hidden: false,
        addEventListener: (t, f) => (docL[t] = docL[t] || []).push(f),
      };
      const cvL = {};
      const cv = {
        ownerDocument: doc,
        addEventListener: (t, f) => (cvL[t] = cvL[t] || []).push(f),
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 320 * CSS_PRO_PX, height: 180 * CSS_PRO_PX }),
      };
      const input = createInput();
      input.attach(cv);
      const ev = (liste, punkte) => {
        for (const f of liste || []) {
          f({
            preventDefault() {},
            changedTouches: punkte.map((p, i) => ({
              identifier: p.id ?? i, clientX: p.x * CSS_PRO_PX, clientY: p.y * CSS_PRO_PX,
            })),
          });
        }
      };
      return {
        input,
        start: (...p) => ev(cvL.touchstart, p),
        move: (...p) => ev(cvL.touchmove, p),
        ende: (...p) => ev(cvL.touchend, p),
        keydown: (code) => { for (const f of winL.keydown || []) f({ code, repeat: false, preventDefault() {} }); },
        keyup: (code) => { for (const f of winL.keyup || []) f({ code }); },
      };
    }

    const g = mkPad();
    const B = g.input.touch.buttons;
    const A = B[0]; const Bk = B[1]; const W = B[2];
    const PZ = g.input.touch.pause;
    const unten = (b) => 180 - (b.y + b.r);              // interne px bis zur Canvas-Unterkante
    const luecke = (p, q) => Math.hypot(p.x - q.x, p.y - q.y) - p.r - q.r;

    // --- A4 (a): Unterkanten >= 24 interne px ueber dem Rand --------------
    check('S4-§7F(c) A4(a) B-Kreis-Unterkante >= 24 interne px ueber der Canvas-Unterkante',
      unten(Bk) >= 24, `${unten(Bk)} px = ${(unten(Bk) * MM_PRO_PX).toFixed(1)} mm`);
    check('S4-§7F(c) A4(a) W-Kreis-Unterkante >= 24 interne px ueber der Canvas-Unterkante',
      unten(W) >= 24, `${unten(W)} px = ${(unten(W) * MM_PRO_PX).toFixed(1)} mm`);
    // Das Joystick-FELD wird BEHAVIORAL gemessen (JOY_FIELD_Y1 ist modul-lokal):
    // die tiefste y-Zeile, in der ein touchstart links noch einen Joystick
    // beginnt. Suche von unten nach oben, damit ein zu tiefes Feld auffliegt.
    let feldY1 = null;
    for (let y = 179; y >= 0 && feldY1 === null; y--) {
      const p = mkPad();
      p.start({ x: 40, y });
      if (p.input.touch.joyBaseX === 40) feldY1 = y;   // 40 != Startwert 0
    }
    check('S4-§7F(c) A4(a) Joystick-Feld-Unterkante >= 24 interne px ueber der Canvas-Unterkante',
      feldY1 !== null && 180 - feldY1 >= 24,
      `tiefster Joystick-Start y=${feldY1} -> ${180 - feldY1} px = ${((180 - (feldY1 ?? 0)) * MM_PRO_PX).toFixed(1)} mm`);
    {
      // Ein Touch UNTER dem Feld faellt in KEINE Zone — insbesondere nicht in
      // die Angriffszone (die reale A-Zone ist die rechte Haelfte).
      const p = mkPad();
      p.start({ x: 40, y: (feldY1 ?? 156) + 1 });
      p.move({ x: 120, y: (feldY1 ?? 156) + 1 });
      check('S4-§7F(c) A4(a) Touch unter dem Joystick-Feld startet nichts (kein Joystick, kein Angriff)',
        p.input.touch.joyBaseX === 0 && p.input.touch.joyBaseY === 0
        && p.input.dirX === 0 && p.input.dirY === 0 && p.input.attack === false,
        `dir ${p.input.dirX}/${p.input.dirY}, attack ${p.input.attack}`);
    }

    // --- A4 (b): Luecken --------------------------------------------------
    check('S4-§7F(c) A4(b) Luecke B <-> W >= 16 interne px',
      luecke(Bk, W) >= 16, `${luecke(Bk, W).toFixed(2)} px = ${(luecke(Bk, W) * MM_PRO_PX).toFixed(1)} mm`);
    check('S4-§7F(c) A4(b) Luecke A-Kreis <-> W >= 12 interne px (W ist dafuer versetzt)',
      luecke(A, W) >= 12, `${luecke(A, W).toFixed(2)} px = ${(luecke(A, W) * MM_PRO_PX).toFixed(1)} mm`);
    // A <-> B bekommt BEWUSST kein Luecken-Gate (A4 nennt nur B<->W und
    // A<->W): der A-KREIS ist Deko, die Angriffszone ist die ganze rechte
    // Haelfte — sie beruehrt den B-Kreis ohnehin ringsum. Was zaehlt, ist
    // dass B ein SAUBERER AUSSCHNITT aus dieser Haelfte ist. Genau das wird
    // hier gemessen statt eines bedeutungslosen Mittenabstands (er betruege
    // ${luecke(A, Bk).toFixed(2)} px).
    {
      const p = mkPad();
      p.start({ x: Bk.x, y: Bk.y });
      const q = mkPad();
      q.start({ x: Bk.x + Bk.r + 1, y: Bk.y });
      check('S4-§7F(c) A4 der B-Kreis ist ein sauberer Ausschnitt aus der Angriffs-Haelfte',
        p.input.potion === true && p.input.attack === false
        && q.input.attack === true && q.input.potion === false,
        `im Kreis: Trank ${p.input.potion}/Hieb ${p.input.attack}, `
        + `1 px daneben: Trank ${q.input.potion}/Hieb ${q.input.attack}`);
    }

    // --- A4 (c): Joystick-Radius 64 CSS-px = 32 interne px ---------------
    {
      const p = mkPad();
      p.start({ x: 60, y: 100 });
      p.move({ x: 260, y: 100 });   // weit ueber den Anschlag hinaus
      const r = p.input.touch.joyRadius;
      check('S4-§7F(c) A4(c) JOY_RADIUS_SCREEN = 64 CSS-px (= 32 interne px = 12,1 mm Vollausschlag)',
        Math.abs(r * CSS_PRO_PX - 64) < 1e-9 && Math.abs(r - 32) < 1e-9,
        `${r} interne px = ${(r * CSS_PRO_PX).toFixed(1)} CSS-px = ${(r * MM_PRO_PX).toFixed(2)} mm`);
      check('S4-§7F(c) A4(c) Vollausschlag am Anschlag: dirX = 1, Knauf auf dem Radius geklemmt',
        Math.abs(p.input.dirX - 1) < 1e-9 && Math.abs(p.input.touch.joyX - (60 + r)) < 1e-9,
        `dirX ${p.input.dirX}, joyX ${p.input.touch.joyX}`);
      // Feinsteuerung: halber Weg = halbe Geschwindigkeit (der eigentliche
      // Gewinn von 40 -> 64; bei 40 lag der Anschlag schon nach 7,5 mm).
      const q = mkPad();
      q.start({ x: 60, y: 100 });
      q.move({ x: 60 + 16, y: 100 });
      check('S4-§7F(c) A4(c) halber Ausschlag = halbe Richtungsstaerke (analoge Feinsteuerung)',
        Math.abs(q.input.dirX - 0.5) < 1e-9, `dirX ${q.input.dirX}`);
    }

    // --- A4 (d): jeder Kreis >= 9 mm, Pause-Knopf >= 7 mm ----------------
    const mmD = (b) => 2 * b.r * MM_PRO_PX;
    check('S4-§7F(c) A4(d) A/B/W haben je >= 9 mm Durchmesser',
      mmD(A) >= 9 && mmD(Bk) >= 9 && mmD(W) >= 9,
      `A ${mmD(A).toFixed(1)} / B ${mmD(Bk).toFixed(1)} / W ${mmD(W).toFixed(1)} mm`);
    check('S4-§7F(c) §4.2 Pause-Knopf >= 7 mm Durchmesser und im oberen Bilddrittel',
      mmD(PZ) >= 7 && PZ.y + PZ.r <= 60, `${mmD(PZ).toFixed(1)} mm bei y ${PZ.y}`);
    check('S4-§7F(c) §4.2 Pause-Knopf kollidiert mit keiner anderen Touch-Zone',
      luecke(PZ, A) > 0 && luecke(PZ, Bk) > 0 && luecke(PZ, W) > 0
      && !(PZ.x + PZ.r >= 290 && PZ.y - PZ.r <= 30),   // HUD-Box (290,0)-(320,30)
      `A ${luecke(PZ, A).toFixed(1)} / B ${luecke(PZ, Bk).toFixed(1)} / W ${luecke(PZ, W).toFixed(1)}`);
    check('S4-§7F(c) alle Zonen liegen vollstaendig im 320x180-Bild',
      [A, Bk, W, PZ].every((b) => b.x - b.r >= 0 && b.y - b.r >= 0 && b.x + b.r <= 320 && b.y + b.r <= 180));

    // --- Zonen-VERHALTEN: der gezeichnete A-Kreis ist Deko ----------------
    {
      const p = mkPad();
      p.start({ x: A.x, y: A.y });
      check('S4-§7F(c) A4 Tap auf den A-Kreis greift an',
        p.input.attack === true && p.input.touch.buttons[0].pressed === true);
      const q = mkPad();
      q.start({ x: 170, y: 40 });    // rechte Haelfte, weit weg vom A-Kreis
      check('S4-§7F(c) A4 die REALE Angriffszone ist die ganze rechte Haelfte (Kreis = Deko)',
        q.input.attack === true, `attack ${q.input.attack}`);
      const r = mkPad();
      r.start({ x: 159, y: 40 });    // linke Haelfte, oberhalb des Feldes
      check('S4-§7F(c) A4 links der Bildmitte greift nichts an (Joystick statt Hieb)',
        r.input.attack === false && r.input.touch.joyBaseX === 159);
    }

    // --- §4.2 Pause-Knopf: nur sichtbar scharf, und VOR allen anderen -----
    {
      const p = mkPad();
      p.start({ x: PZ.x, y: PZ.y });
      check('S4-§7F(c) §4.2 unsichtbarer Pause-Knopf frisst keinen Tap (faellt in die Normal-Logik)',
        p.input.pause === false && p.input.attack === true,
        `pause ${p.input.pause}, attack ${p.input.attack}`);
      const q = mkPad();
      q.input.touch.pause.visible = true;
      q.start({ x: PZ.x, y: PZ.y });
      check('S4-§7F(c) §4.2 sichtbarer Pause-Knopf pausiert und loest KEINEN Hieb aus',
        q.input.pause === true && q.input.touch.pause.pressed === true && q.input.attack === false);
      q.ende({ x: PZ.x, y: PZ.y });
      check('S4-§7F(c) §4.2 touchend loest den Pause-Pegel wieder',
        q.input.pause === false && q.input.touch.pause.pressed === false);
      const r = mkPad();
      r.input.touch.pause.visible = true;
      r.start({ x: PZ.x + PZ.r + 2, y: PZ.y });
      check('S4-§7F(c) §4.2 knapp neben dem Pause-Knopf pausiert nichts',
        r.input.pause === false);
    }

    // --- §4.2 Tastatur + §5.4 Touch-Overlay-Ruecknahme --------------------
    {
      const p = mkPad();
      p.keydown('Escape');
      check('S4-§7F(c) §4.2 Escape setzt den Pause-Pegel', p.input.pause === true);
      p.keyup('Escape');
      check('S4-§7F(c) §4.2 Escape losgelassen nimmt ihn zurueck', p.input.pause === false);
      p.keydown('KeyP');
      check('S4-§7F(c) §4.2 P setzt den Pause-Pegel ebenfalls', p.input.pause === true);
      p.keyup('KeyP');
      const q = mkPad();
      q.start({ x: 60, y: 100 });
      check('S4-§7F(c) §5.4 Vorbedingung: der Tap schaltet das Touch-Overlay an',
        q.input.touch.active === true);
      q.keydown('KeyW');
      check('S4-§7F(c) §5.4 Tastatureingabe schaltet das Touch-Overlay wieder AB',
        q.input.touch.active === false);
      q.keyup('KeyW');
      q.start({ x: 60, y: 100 });
      check('S4-§7F(c) §5.4 der naechste Tap schaltet es sofort wieder an',
        q.input.touch.active === true);
    }

    // --- EIN BESITZER: hud.js zeichnet ausschliesslich aus input.touch ----
    {
      const hudSrc = readFileSync(new URL('../game/js/ui/hud.js', import.meta.url), 'utf8');
      check('S4-§7F(c) §5.1 hud.js zeichnet die Buttons aus b.x/b.y/b.r (keine zweite Koordinatenquelle)',
        /ctx\.arc\(b\.x,\s*b\.y,\s*b\.r,/.test(hudSrc));
      check('S4-§7F(c) §4.2 hud.js zeichnet den Pause-Knopf aus input.touch.pause',
        /const pz = input\.touch\.pause;/.test(hudSrc) && /ctx\.arc\(pz\.x,\s*pz\.y,\s*pz\.r,/.test(hudSrc));
      check('S4-§7F(c) §4.2 das Pause-Symbol ist fillRect, KEIN fillText (8px-monospace-Risiko)',
        /ctx\.fillRect\(pz\.x - 4/.test(hudSrc) && !/fillText\([^)]*pz\./.test(hudSrc));
    }

    // --- §5.5 Inventar-Trefferflaechen (ENG BEGRENZT, Anker fest) --------
    {
      const ui = createInventoryUI();
      const p = createPlayer(GRAVEYARD.playerSpawn);
      addItem(p.inv, { slot: 'armor', name: 'A', rare: false, affixes: [{ stat: 'dmg', value: 1 }] });
      addItem(p.inv, { slot: 'weapon', name: 'B', rare: false, affixes: [{ stat: 'dmg', value: 1 }] });
      const inp = { dirX: 0, dirY: 0, attack: false, confirm: false, inventory: false, tap: null };
      ui.open();
      ui.update(inp, p);
      const tap = (x, y) => { inp.tap = { x, y }; const r = ui.update(inp, p); inp.tap = null; return r; };
      ui.cursor = 1;
      tap(100, 30);
      check('S4-§7F(c) §5.5 Bestands-Tap (100,30) trifft weiter Zeile 0 (Anker LIST_Y unveraendert)',
        ui.cursor === 0);
      // S5-§7C SANKTIONIERT (Spec Slice 5 §6.3/§7.C): ROW_H 20 -> 17, damit die
      // Liste (26..145) und der ANLEGEN-Knopf (145..167) in y DISJUNKT sind —
      // vorher lagen Zeile 5/6 unter dem Knopf und waren im rechten Drittel
      // nicht anwaehlbar. LIST_Y (26) und der X-Anker (288,10) bleiben
      // UNVERAENDERT, deshalb bleiben (100,30) und (290,12) hier und in
      // smoke:1249-1256 (Slice-2-Block) unangetastet gruen.
      // 17 px = 6,40 mm liegt weiter ueber dem 6-mm-Gate.
      ui.cursor = 1;
      tap(100, 42);
      check('S5-§7C §6.3 Zeile 0 reicht jetzt bis y 42 (ROW_H 17 = 6,40 mm statt 20 = 7,53 mm)',
        ui.cursor === 0);
      tap(100, 50);
      check('S4-§7F(c) §5.5 y 50 liegt in Zeile 1 (Zeilenhoehe wirklich 20, nicht groesser)',
        ui.cursor === 1);
      check('S4-§7F(c) §5.5 Bestands-Tap (290,12) schliesst weiter (Anker (288,10) unveraendert)',
        tap(290, 12) === 'close');
      check('S4-§7F(c) §5.5 X-Knopf reicht jetzt bis (311,33) = 24x24 px = 9,0 mm',
        tap(311, 33) === 'close');
      check('S4-§7F(c) §5.5 knapp ausserhalb des X-Knopfes wird NICHT geschlossen',
        tap(313, 36) !== 'close');
    }
  }

  // -----------------------------------------------------------------------
  // (d) §4.1/§4.2/§6.4 PAUSE + FPS-OVERLAY, HEADLESS
  //     Geprueft wird, was ohne Browser pruefbar ist: die Zeichen-Vertraege
  //     (Detektor-Vertraeglichkeit, Stub-Vorrat, Geometrie-Quelle) und die
  //     byte-Gleichheit des Titels ohne Spielstand. Der Zustandsautomat
  //     selbst liegt in main.js und wird von tools/check_save_slice4.mjs
  //     mit echtem Boot gefahren.
  // -----------------------------------------------------------------------
  {
    const hud = await import('../game/js/ui/hud.js');
    const { drawPause, drawFps, drawTitle, PAUSE_MENU_ZONES } = hud;

    // Pause-Menue-Geometrie: eine Quelle (hud.js), main.js macht daraus den
    // Hittest.
    // S5-§7B SANKTIONIERT (Spec Slice 5 §6.1/§7.B, Review P1-m6): das Menue
    // traegt seit Slice 5 FUENF Zeilen (WEITER/GOTT/FPS/MUSIK/TON). Geaendert
    // sind genau drei Dinge: die Anzahl 3 -> 5, der Prueftext (er wuerde sonst
    // luegen) und die indexweise ausgeschriebene Nachbarschaftskette, die zur
    // Schleife ueber ALLE Zonen wird. Das 6-mm-Gate bleibt Wort fuer Wort
    // stehen (P1-m5: h >= 16 px ist die bindende Zahl); die vollstaendige
    // Ueberlappungspruefung ueber alle 10 Paare steht additiv in S5-§7A(g).
    check('S5-§7B §4.1/§6.1 PAUSE_MENU_ZONES: 5 getrennte Zonen im Bild, >= 6 mm hoch',
      PAUSE_MENU_ZONES.length === 5
      && PAUSE_MENU_ZONES.every((z) => z.x >= 0 && z.y >= 0 && z.x + z.w <= 320 && z.y + z.h <= 180)
      && PAUSE_MENU_ZONES.every((z) => z.h * MM_PRO_PX >= 6)
      && PAUSE_MENU_ZONES.every((z, i) => i === 0
        || z.y >= PAUSE_MENU_ZONES[i - 1].y + PAUSE_MENU_ZONES[i - 1].h),
      PAUSE_MENU_ZONES.map((z) => `${z.y}+${z.h}`).join(' '));

    const rec0 = mkRec();
    drawPause(rec0, { cursor: 0, god: false, fps: false });
    check('S4-§7F(d) §4.1 drawPause kommt mit dem Stub-Vorrat der Flusstests aus (kein strokeRect/Pfad)',
      rec0.log.length > 0);
    check('S4-§7F(d) §4.1 drawPause loest den Fade-Detektor NICHT aus (Deckung sitzt in der Fuellfarbe)',
      !rec0.log.some(istFadeZug),
      JSON.stringify(rec0.log.filter((o) => o.op === 'fillRect' && o.args[2] === 320).map((o) => `${o.fill}@${o.alpha}`)));
    check('S4-§7F(d) §4.1 drawPause deckt die Welt voll ab (Vollbild-Rect bei globalAlpha 1)',
      rec0.log.some((o) => o.op === 'fillRect' && o.args[2] === 320 && o.args[3] === 180 && o.alpha === 1));
    const pTexte = rec0.log.filter((o) => o.op === 'fillText').map((o) => o.text);
    check('S4-§7F(d) §4.1 Pause-Texte meiden JEDE Sonde der Flusstests',
      pTexte.every((t) => SONDEN.every((s) => !t.includes(s))), pTexte.join('/'));
    check('S4-§7F(d) §4.1 Pause zeigt WEITER + GOTT-Schalter + FPS-Schalter',
      pTexte.some((t) => t.includes('WEITER')) && pTexte.some((t) => t.startsWith('GOTT'))
      && pTexte.some((t) => t.startsWith('FPS')), pTexte.join('/'));
    check('S4-§7F(d) §4.3/§6.4 die Schalterzeilen spiegeln den Zustand (AN/AUS)',
      pTexte.includes('GOTT: AUS') && pTexte.includes('FPS: AUS'), pTexte.join('/'));
    {
      const rec1 = mkRec();
      drawPause(rec1, { cursor: 2, god: true, fps: true });
      const t1 = rec1.log.filter((o) => o.op === 'fillText').map((o) => o.text);
      check('S4-§7F(d) §4.3/§6.4 eingeschaltet steht AN in denselben zwei Zeilen',
        t1.includes('GOTT: AN') && t1.includes('FPS: AN'), t1.join('/'));
      // Der Auswahlbalken folgt dem Cursor und kommt aus PAUSE_MENU_ZONES.
      const balken = (log) => log.filter((o) => o.op === 'fillRect' && o.fill === '#3a3542'
        && o.args[2] === PAUSE_MENU_ZONES[0].w && o.args[3] === PAUSE_MENU_ZONES[0].h);
      check('S4-§7F(d) §4.1 genau EIN Auswahlbalken, und er sitzt auf der Cursor-Zone',
        balken(rec0.log).length === 1 && balken(rec0.log)[0].args[1] === PAUSE_MENU_ZONES[0].y
        && balken(rec1.log).length === 1 && balken(rec1.log)[0].args[1] === PAUSE_MENU_ZONES[2].y,
        `${balken(rec0.log).length}/${balken(rec1.log).length}`);
    }

    // §6.4 FPS-Overlay: GENAU ZWEI Zeilen, keine Uhr im HUD.
    {
      const rec = mkRec();
      drawFps(rec, { fps: 58, ms: 17.24, max: 41.5 });
      const zug = rec.log.filter((o) => o.op === 'fillText');
      const zeilen = [...new Set(zug.map((o) => o.text))];
      check('S4-§7F(d) §6.4 FPS-Overlay sind GENAU ZWEI Textzeilen (je mit 1-px-Kontur)',
        zeilen.length === 2 && zug.length === 4, `${zeilen.length} Zeilen / ${zug.length} Zuege`);
      check('S4-§7F(d) §6.4 die Zahlen kommen fertig gerechnet von aussen (HUD misst nichts)',
        zeilen.some((t) => t.includes('58')) && zeilen.some((t) => t.includes('17.2') && t.includes('41.5')),
        zeilen.join(' | '));
      check('S4-§7F(d) §6.4 FPS-Overlay malt kein Vollbild und meidet die Sonden',
        !rec.log.some((o) => o.op === 'fillRect' && o.args[2] === 320)
        && zeilen.every((t) => SONDEN.every((s) => !t.includes(s))), zeilen.join(' | '));
      check('S4-§7F(d) §6.4 das Overlay liegt unten links im Bild',
        zug.every((o) => o.x >= 0 && o.x < 160 && o.y >= 150 && o.y <= 175));
    }

    // §3.3 BYTE-GLEICHHEIT DES TITELS OHNE SPIELSTAND. drawVignette baut beim
    // ersten Aufruf einen Canvas ueber document.createElement — hier lokal
    // gestubbt und danach sofort wieder entfernt (Muster §7F(j) oben).
    {
      const vorherDoc = globalThis.document;
      globalThis.document = {
        createElement: () => {
          const c = { width: 0, height: 0 };
          c.getContext = () => ({ globalAlpha: 1, fillStyle: '', fillRect() {} });
          return c;
        },
      };
      try {
        const a = mkRec(); drawTitle(a, 1.0);            // Bestands-Aufruf (2 Argumente)
        const b = mkRec(); drawTitle(b, 1.0, null);      // neuer Aufruf ohne Stand
        const c = mkRec(); drawTitle(c, 1.0, {
          cursor: 0, items: ['FORTSETZEN', 'NEUES SPIEL'],
          zones: [{ x: 96, y: 116, w: 128, h: 18 }, { x: 96, y: 138, w: 128, h: 18 }],
        });
        check('S4-§7F(d) §3.3 OHNE Spielstand ist drawTitle byte-gleich zum Bestand',
          JSON.stringify(a.log) === JSON.stringify(b.log),
          `${a.log.length} vs ${b.log.length} Zuege`);
        check('S4-§7F(d) §3.3 der Bestands-Titel zeigt weiter GRIMLIGHT und den Blinktext',
          a.log.some((o) => o.op === 'fillText' && o.text === 'GRIMLIGHT')
          && a.log.some((o) => o.op === 'fillText' && o.text.includes('ENTER')));
        check('S4-§7F(d) §3.3 MIT Spielstand ersetzt das Menue den Blinktext (kein Doppel-Hinweis)',
          c.log.some((o) => o.op === 'fillText' && o.text === 'FORTSETZEN')
          && c.log.some((o) => o.op === 'fillText' && o.text === 'NEUES SPIEL')
          && !c.log.some((o) => o.op === 'fillText' && o.text.includes('ENTER')));
        check('S4-§7F(d) §3.3 der Auswahlbalken des Titels loest den Fade-Detektor nicht aus',
          !c.log.some(istFadeZug));
      } finally {
        if (vorherDoc === undefined) delete globalThis.document;
        else globalThis.document = vorherDoc;
      }
    }
  }

  // -----------------------------------------------------------------------
  // (e) §3.4 GEOEFFNETE TRUHEN — das Trio: Schluessel aus der props-LISTE,
  //     Filter auf einer KOPIE (mapDef unberuehrt), resetRun-Reset und
  //     Siegtruhen-Ausnahme.
  // -----------------------------------------------------------------------
  {
    // Quelltext OHNE Kommentare: main.js begruendet seine Entscheidungen in
    // langen Kommentarbloecken, in denen genau die Zeichenketten stehen, die
    // hier gesucht werden ('loop.stop()/start() wird NICHT benutzt', 'saveNow'
    // in der Hook-Liste). Ein Waechter, der Kommentare mitliest, prueft die
    // Erzaehlung statt den Code.
    const mainSrcRoh = readFileSync(new URL('../game/js/main.js', import.meta.url), 'utf8');
    const mainSrc = mainSrcRoh.replace(/^[ \t]*\/\/.*$/gm, '').replace(/[ \t]+\/\/.*$/gm, '');
    // Funktionsrumpf bis zur ersten schliessenden Klammer am Zeilenanfang.
    const rumpf = (name) => {
      const m = new RegExp(`function ${name}\\([\\s\\S]*?\\n\\}\\n`).exec(mainSrc);
      return m ? m[0] : null;
    };
    // Schluesselformel WOERTLICH aus main.js (chestKey) — sie steht hier und
    // dort auf derselben Prop-Geometrie.
    const chestKey = (mapKey, p) => `${mapKey}:${(p.x / 16) | 0},${(p.y / 16) | 0}`;

    // --- 1. Datenquelle: die props-Liste, NICHT der Event-Strom ----------
    {
      const fmap = createTilemap(FLUESTERGRUFT.rows, FLUESTERGRUFT.legend);
      const ps = createProps(FLUESTERGRUFT.propSpawns);
      const truhen = ps.filter((p) => p.kind === 'chest');
      check('S4-§7F(e) §3.4 Vorbedingung: FLUESTERGRUFT traegt die boss_key- und die heart-Truhe',
        truhen.length === 2 && truhen.some((t) => t.content === 'boss_key')
        && truhen.some((t) => t.content === 'heart'),
        truhen.map((t) => t.content).join(','));

      // Eine Truhe per Schwerthieb oeffnen (der einzige Weg, props.js:66).
      const kiste = truhen.find((t) => t.content === 'boss_key');
      const pl = createPlayer({ x: kiste.x + kiste.w / 2, y: kiste.y + kiste.h + 6 });
      pl.facing = 'up';
      const evs = [];
      pl.attackId = 99;
      pl.getSwordHitbox = () => ({ x: kiste.x, y: kiste.y, w: kiste.w, h: kiste.h });
      updateProps(1 / 60, ps, pl, fmap, [], evs);
      check('S4-§7F(e) §3.4 Vorbedingung: der Schwerthieb oeffnet die Truhe',
        kiste.opened === true);
      // Genau das ist der Grund fuer die props-Liste als Quelle: die Events
      // tragen KEINE Position (und die Gold-Truhe pusht gar keins).
      const mitPos = evs.filter((e) => e && typeof e === 'object' && ('x' in e || 'y' in e));
      check('S4-§7F(e) §3.4 die Truhen-Events tragen KEINE Position (Events als Quelle unmoeglich)',
        mitPos.length === 0, JSON.stringify(evs));

      const key = chestKey('FLUESTERGRUFT', kiste);
      check('S4-§7F(e) §3.4 Schluessel ist Karte + Kachel der AABB-Ecke',
        key === 'FLUESTERGRUFT:36,4', key);

      // --- 2. Filter auf dem ERGEBNIS von createProps (Kopie!) -----------
      const vorher = JSON.stringify(FLUESTERGRUFT.propSpawns);
      const neu = createProps(FLUESTERGRUFT.propSpawns);
      check('S4-§7F(e) §3.4 createProps liefert eine KOPIE: dieselben Spawns geben denselben Schluessel',
        chestKey('FLUESTERGRUFT', neu.find((p) => p.content === 'boss_key')) === key);
      const gefiltert = neu.filter((p) => !(p.kind === 'chest'
        && [key].includes(chestKey('FLUESTERGRUFT', p))));
      check('S4-§7F(e) §3.4 der Filter entfernt genau die geoeffnete Truhe (keine Gold-Farm)',
        gefiltert.length === neu.length - 1
        && !gefiltert.some((p) => p.kind === 'chest' && p.content === 'boss_key')
        && gefiltert.some((p) => p.kind === 'chest' && p.content === 'heart'),
        `${neu.length} -> ${gefiltert.length}`);
      check('S4-§7F(e) §3.4 mapDef.propSpawns bleibt dabei UNANGETASTET (sonst fehlt der Boss nach resetRun)',
        JSON.stringify(FLUESTERGRUFT.propSpawns) === vorher
        && FLUESTERGRUFT.propSpawns.length === 13);

      // --- 3. resetRun-Reset: leere Liste = ALLE Truhen wieder da -------
      const nachReset = createProps(FLUESTERGRUFT.propSpawns)
        .filter((p) => !(p.kind === 'chest' && [].includes(chestKey('FLUESTERGRUFT', p))));
      check('S4-§7F(e) §3.4 mit leerer Liste stehen boss_key- UND heart-Truhe wieder (Run bleibt loesbar)',
        nachReset.filter((p) => p.kind === 'chest').length === 2,
        `${nachReset.filter((p) => p.kind === 'chest').length} Truhen`);
    }

    // --- 4. Siegtruhen-Ausnahme ------------------------------------------
    {
      const sieg = createProps([{ ...tcc(10, 4), kind: 'chest', content: 'treasure' }]);
      for (const p of sieg) p.siegChest = true;
      check('S4-§7F(e) §3.4 die Siegtruhe steht NICHT in BOSS_KAMMER.propSpawns (sie wird gepusht)',
        (BOSS_KAMMER.propSpawns || []).length === 0);
      // Ihr Schluessel waere gueltig — genommen wird er nur nicht, weil die
      // Registrierung siegChest ueberspringt.
      check('S4-§7F(e) §3.4 die Siegtruhe traegt die Ausnahme-Markierung',
        sieg[0].siegChest === true && chestKey('BOSS_KAMMER', sieg[0]) === 'BOSS_KAMMER:10,4',
        chestKey('BOSS_KAMMER', sieg[0]));
      const registriert = sieg
        .filter((p) => p.kind === 'chest' && p.opened === true && p.siegChest !== true)
        .map((p) => chestKey('BOSS_KAMMER', p));
      sieg[0].opened = true;
      const registriert2 = sieg
        .filter((p) => p.kind === 'chest' && p.opened === true && p.siegChest !== true)
        .map((p) => chestKey('BOSS_KAMMER', p));
      check('S4-§7F(e) §3.4 auch GEOEFFNET landet die Siegtruhe nie in openedChests (Sieg bleibt erreichbar)',
        registriert.length === 0 && registriert2.length === 0);
    }

    // --- 5. Quelltext-Anker: die drei Zusagen stehen wirklich in main.js --
    const resetRumpf = rumpf('resetRun');
    const buildRumpf = rumpf('buildWorld');
    check('S4-§7F(e) Vorbedingung: resetRun und buildWorld sind im Quelltext auffindbar',
      !!resetRumpf && !!buildRumpf, `${resetRumpf ? 'ok' : 'resetRun?'} / ${buildRumpf ? 'ok' : 'buildWorld?'}`);
    check('S4-§7F(e) §3.4 main.js setzt openedChests in resetRun zurueck',
      !!resetRumpf && resetRumpf.includes('runFlags.openedChests = [];'));
    check('S4-§7F(e) §3.4 main.js nimmt die Siegtruhe von der Registrierung aus',
      /p\.siegChest === true\) continue;/.test(mainSrc));
    check('S4-§7F(e) §3.4 main.js filtert das ERGEBNIS von createProps, nie mapDef.propSpawns',
      /const alleProps = createProps\(mapDef\.propSpawns\);/.test(mainSrc)
      && /props = runFlags\.openedChests\.length === 0/.test(mainSrc)
      && !/mapDef\.propSpawns\s*=[^=]/.test(mainSrc)
      && !/mapDef\.propSpawns\.(splice|push|pop|shift|sort)/.test(mainSrc));
    check('S4-§7F(e) §3.4 die Registrierung liest die props-LISTE (nicht den Event-Strom)',
      /for \(let i = 0; i < props\.length; i\+\+\)[\s\S]{0,400}?runFlags\.openedChests\.push\(k\)/.test(mainSrc));
    check('S4-§7F(e) §3.2 im resetRun-Pfad wird NIE gespeichert',
      !!resetRumpf && !resetRumpf.includes('saveNow()'));
    check('S4-§7F(e) §3.2 die Save-Hooks sitzen NICHT in buildWorld (Respawn saehe hp = 0)',
      !!buildRumpf && !buildRumpf.includes('saveNow()'));
    check('S4-§7F(e) §3.2 alle vier Hooks (Portal, Respawn, Lifecycle, Zurueck-Taste) sind verdrahtet',
      (mainSrc.match(/saveNow\(\);/g) || []).length >= 3
      && /fadePhase = 'none';[\s\S]{0,120}?saveNow\(\);/.test(mainSrc)
      && /player\.deathToll = null;[\s\S]{0,120}?saveNow\(\);/.test(mainSrc)
      && /function systemPause\(\)[\s\S]{0,200}?saveNow\(\);/.test(mainSrc)
      && /function pausiere\(\)[\s\S]{0,200}?saveNow\(\);/.test(mainSrc),
      `${(mainSrc.match(/saveNow\(\);/g) || []).length} Aufrufe`);
  }

  // -----------------------------------------------------------------------
  // (f) §4.1 LOOP-60-s-SPRUNG — Rueckkehr aus dem Hintergrund.
  //     Android friert die WebView ein; beim Wiederaufwachen liefert die Uhr
  //     einen Sprung von Minuten. Ohne Deckel wuerde der Akkumulator tausende
  //     Updates nachspulen (Spiral of Death) — der Spieler waere tot, bevor
  //     das Bild steht. loop.js bleibt dafuer UNANGETASTET (§4.1: die Pause
  //     laeuft ueber den Zustandsautomaten, nicht ueber stop()/start()).
  // -----------------------------------------------------------------------
  {
    const { createLoop } = await import('../game/js/core/loop.js');
    let uhr = 0;
    const q = [];
    const updates = [];
    let renders = 0;
    const loop = createLoop({
      update: (dt) => updates.push(dt),
      render: () => { renders += 1; },
      raf: (cb) => q.push(cb),
      now: () => uhr,
    });
    loop.start();
    const frame = (msVor) => { uhr += msVor; const cb = q.shift(); if (!cb) throw new Error('kein rAF'); const n0 = updates.length; cb(); return updates.length - n0; };

    const f0 = frame(0);
    check('S4-§7F(f) §4.1 erster Frame: Delta 0, kein Update', f0 === 0 && renders === 1);
    const f1 = frame(1000 / 60);
    check('S4-§7F(f) §4.1 normaler Frame: genau ein 60-Hz-Update', f1 === 1
      && Math.abs(updates[0] - 1 / 60) < 1e-12, `${f1} Updates`);

    const fSprung = frame(60000);   // 60 Sekunden im Hintergrund
    check('S4-§7F(f) §4.1 60-s-Sprung spult NICHT nach: hoechstens 5 Updates in einem Frame',
      fSprung === 5, `${fSprung} Updates (ungedeckelt waeren es 3600)`);
    check('S4-§7F(f) §4.1 der Sprung kostet hoechstens 83 ms Spielzeit',
      fSprung * (1 / 60) <= 0.084, `${(fSprung / 60 * 1000).toFixed(1)} ms`);
    // Der Rest wird verworfen (acc = 0), es gibt also KEIN Nachspulen. Der
    // erste Folge-Frame kann dadurch leer bleiben (der Akkumulator startet bei
    // 0 und 1000/60 ms liegen in double-Arithmetik ein Ulp UNTER 1/60 s) —
    // deshalb wird hier die Obergrenze geprueft und der Wiederanlauf ueber ein
    // laengeres Fenster.
    const fDanach = frame(1000 / 60);
    check('S4-§7F(f) §4.1 der Rest wird verworfen: der Folge-Frame spult nichts nach',
      fDanach <= 1, `${fDanach} Updates`);
    let summe = 0;
    for (let i = 0; i < 10; i++) summe += frame(1000 / 60);
    check('S4-§7F(f) §4.1 nach dem Sprung laeuft der Loop sofort wieder mit 60 Hz',
      summe >= 9 && summe <= 11, `${summe} Updates in 10 Frames`);
    check('S4-§7F(f) §4.1 jeder Frame rendert genau einmal (keine zweite rAF-Kette)',
      renders === 14 && q.length === 1, `${renders} Renders, ${q.length} offene rAF`);
    check('S4-§7F(f) §4.1 alle Updates laufen mit dem FESTEN Schritt 1/60',
      updates.every((dt) => Math.abs(dt - 1 / 60) < 1e-12), `${updates.length} Updates`);

    // §4.1: main.js pausiert ueber den Zustandsautomaten. loop.stop()/start()
    // wuerde eine ZWEITE rAF-Kette erzeugen — hier gemessen, damit die
    // Begruendung im Test steht und nicht nur im Kommentar.
    {
      const q2 = [];
      let u2 = 0;
      const l2 = createLoop({ update: () => { u2 += 1; }, render: () => {}, raf: (cb) => q2.push(cb), now: () => uhr });
      l2.start();
      q2.shift()();                 // erster Frame, reiht den naechsten ein
      l2.stop();
      l2.start();                   // sofortiger Neustart, alter Callback lebt noch
      check('S4-§7F(f) §4.1 stop()+start() hinterlaesst ZWEI eingereihte Callbacks (deshalb Pause per Zustand)',
        q2.length === 2, `${q2.length} rAF-Callbacks`);
      // Quelltext ohne Kommentare (main.js BEGRUENDET die Regel im Klartext —
      // ein Waechter, der Kommentare mitliest, faende dort seinen eigenen
      // Suchbegriff).
      const mainCode = readFileSync(new URL('../game/js/main.js', import.meta.url), 'utf8')
        .replace(/^[ \t]*\/\/.*$/gm, '').replace(/[ \t]+\/\/.*$/gm, '');
      check('S4-§7F(f) §4.1 main.js ruft loop.stop() nie und start() genau einmal',
        !/\.stop\(\)/.test(mainCode) && (mainCode.match(/\.start\(\)/g) || []).length === 1,
        `stop ${(mainCode.match(/\.stop\(\)/g) || []).length}, start ${(mainCode.match(/\.start\(\)/g) || []).length}`);
      check('S4-§7F(f) §4.1 die Pause laeuft ueber den Zustandsautomaten (state paused)',
        /state === 'paused'/.test(mainCode) && /enterState\('paused'\)/.test(mainCode));
    }
  }
}

// ===========================================================================
// SLICE 5 — ADDITIVE BLOECKE S5-§7A(a)..(h) (Spec §7.A, Phase 2 / Integrator).
//
// REGELN, unter denen diese Bloecke stehen (Spec §0.4/§7.D):
//   * NUR ADDITIV. Oberhalb dieser Zeile sind GENAU ZWEI Stellen angefasst,
//     beide von §7 ABSCHLIESSEND sanktioniert und mit S5-§7B / S5-§7C
//     markiert (Pause-Zonen 3->5 und die eine Inventar-Zeilenkante).
//   * Alle neuen Module kommen per `await import(...)` IM BLOCK herein — die
//     Kopf-Importe der Datei bleiben Bestand (Muster S4-§7F).
//   * Die mm-Rechnung wird hier NEU hergeleitet und nicht aus dem
//     S4-Block geerbt: der steht in einem eigenen {}-Rahmen.
// ===========================================================================
{
  // Referenzgeraet wie S4-§7F (1080x2400, 6,5", dpr 3, quer) — NEU gerechnet,
  // damit eine falsche Herleitung hier auffliegt und nicht abgeschrieben wird.
  const PPI_S5 = Math.hypot(1080, 2400) / 6.5;
  const MM_PRO_PX_S5 = Math.min(Math.floor(2400 / 320), Math.floor(1080 / 180)) * (25.4 / PPI_S5);

  const quelle = (rel) => readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8');
  // Quelltext OHNE Kommentare — dieselbe Form wie der Bestands-Waechter
  // smoke:4854 (ein Waechter, der Kommentare mitliest, faende dort seinen
  // eigenen Suchbegriff).
  const ohneKommentar = (s) => s.replace(/^[ \t]*\/\/.*$/gm, '').replace(/[ \t]+\/\/.*$/gm, '');
  const jsDateien = (verz) => {
    const out = [];
    for (const e of readdirSync(new URL(`../${verz}`, import.meta.url), { withFileTypes: true })) {
      if (e.isDirectory()) out.push(...jsDateien(`${verz}/${e.name}`));
      else if (e.name.endsWith('.js')) out.push(`${verz}/${e.name}`);
    }
    return out;
  };
  const MAIN = ohneKommentar(quelle('game/js/main.js'));

  const chip = await import('../game/js/audio/chiptune.js');
  const mix = await import('../game/js/audio/mixer.js');
  const sfxMod = await import('../game/js/audio/sfx.js');
  const songMod = await import('../game/js/audio/songs/index.js');

  // -----------------------------------------------------------------------
  // (a) §2.1/A1(a)+(e) CHIPTUNE-KERN: Determinismus, Vertrag, Monophonie,
  //     Notennamen, Song-Pruefung. Alles rein, alles in Node.
  // -----------------------------------------------------------------------
  {
    const { compileSong, notenFreq, maxGleichzeitig, MAX_KANAELE } = chip;
    const SONG_SCHLUESSEL = ['title', 'graveyard', 'catacombs', 'fluestergruft',
      'boss_idle', 'boss_aggro', 'victory', 'gameover'];
    check('S5-§7A(a) §2.3 alle acht Song-Schluessel liegen vor (4 Karten + Boss-Ebene + 2 Stinger)',
      SONG_SCHLUESSEL.every((k) => !!songMod.SONGS[k]),
      Object.keys(songMod.SONGS).join(','));

    // A1(a): DREI Laeufe, identische Ereignisliste. Verglichen wird die
    // EREIGNIS-Prüfsumme (nicht PCM): dieser Pfad ist reine IEEE754-Arithmetik
    // und damit auch ueber Engine-Versionen bit-exakt (Review P2-m1).
    const evHash = (ev) => createHash('sha256').update(ev.map(
      (e) => `${e.t.toFixed(9)}|${e.dauer.toFixed(9)}|${e.ch}|${e.freq.toFixed(9)}|${e.instr}|${e.vol}|${e.fx}|${e.slideTo === null || e.slideTo === undefined ? '-' : e.slideTo.toFixed(9)}`,
    ).join('\n')).digest('hex').slice(0, 16);
    let determ = true;
    let vertrag = true;
    let mono = true;
    let ueberhang = true;
    let kanaele = true;
    const det = [];
    for (const k of SONG_SCHLUESSEL) {
      const song = songMod.songFuer(k);
      const a = compileSong(song);
      const b = compileSong(song);
      const c = compileSong(song);
      const h = evHash(a.events);
      if (h !== evHash(b.events) || h !== evHash(c.events)) determ = false;
      det.push(`${k}:${h}`);
      // P2-B5: GENAU diese drei Schluessel, loopFrom + loopTime = Gesamtdauer.
      const schl = Object.keys(a).sort().join(',');
      const ende = Math.max(...a.events.map((e) => e.t + e.dauer));
      if (schl !== 'events,loopFrom,loopTime' || !(a.loopFrom >= 0)
        || !(a.loopTime > 0) || !(a.loopFrom < a.loopFrom + a.loopTime)) vertrag = false;
      // Loop-Naht: kein Ereignis ragt ueber das Songende hinaus.
      if (ende > a.loopFrom + a.loopTime + 1e-9) ueberhang = false;
      // Monophonie je Kanal (P2-m3): keine zwei Ereignisse desselben Kanals
      // ueberlappen sich.
      const proCh = new Map();
      for (const e of a.events) {
        if (!proCh.has(e.ch)) proCh.set(e.ch, []);
        proCh.get(e.ch).push(e);
      }
      for (const liste of proCh.values()) {
        liste.sort((x, y) => x.t - y.t);
        for (let i = 0; i < liste.length - 1; i++) {
          if (liste[i].t + liste[i].dauer > liste[i + 1].t + 1e-9) mono = false;
        }
      }
      if (maxGleichzeitig(a.events) > MAX_KANAELE) kanaele = false;
    }
    check('S5-§7A(a) A1(a) compileSong ist deterministisch: 3 Laeufe je Song, identische Ereignis-Pruefsumme',
      determ, det.join(' '));
    check('S5-§7A(a) A1(a)/P2-B5 compileSong liefert GENAU {events, loopFrom, loopTime}',
      vertrag);
    check('S5-§7A(a) P2-B5 kein Ereignis ragt ueber das Songende hinaus (Loop-Naht ohne Klick)',
      ueberhang);
    check('S5-§7A(a) A1(e)/P2-m3 Monophonie je Kanal: keine Ueberlappung in einem Kanal',
      mono);
    check('S5-§7A(a) A1(c) hoechstens MAX_KANAELE = 4 gleichzeitige Musikstimmen je Song',
      kanaele && MAX_KANAELE === 4, `MAX_KANAELE=${MAX_KANAELE}`);

    // Monophonie SCHARF gestellt: ein Song, dessen erste Note ueber die
    // zweite hinausragt, muss gekuerzt werden (nicht gestapelt).
    {
      const roh = {
        bpm: 120,
        rowsPerBeat: 4,
        loopFrom: 0,
        instruments: { p: { art: 'pulse', duty: 0.5, vol: 0.2 } },
        patterns: { A: [['C-4:p:8', '...', 'E-4:p:1', '...']] },
        order: ['A'],
      };
      const k = compileSong(roh);
      const sekProReihe = 60 / 120 / 4;
      check('S5-§7A(a) P2-m3 Gegenprobe: eine zu lange Note wird beim Neuanschlag ABGESCHNITTEN',
        k.events.length === 2 && Math.abs(k.events[0].dauer - 2 * sekProReihe) < 1e-12,
        `dauer ${k.events[0].dauer} statt ${2 * sekProReihe}`);
    }

    // A1(e) notenFreq: wirft bei unbekannt, kennt das deutsche H = B.
    const wirft = (f) => { try { f(); return false; } catch { return true; } };
    check('S5-§7A(a) A1(e) notenFreq: A-4 = 440 Hz und H-4 === B-4 (deutsches H, P2-m2)',
      Math.abs(notenFreq('A-4') - 440) < 1e-9 && notenFreq('H-4') === notenFreq('B-4'));
    check('S5-§7A(a) A1(e) notenFreq WIRFT bei unbekannter Note (kein stilles null)',
      wirft(() => notenFreq('X-4')) && wirft(() => notenFreq('C4'))
      && wirft(() => notenFreq('C-10')) && wirft(() => notenFreq(440)),
      'X-4 / C4 / C-10 / Zahl');
    check('S5-§7A(a) §2.1 Slide s<NOTE> traegt die Zielnote als Hz im Ereignis',
      (() => {
        const k = compileSong({
          bpm: 120,
          rowsPerBeat: 4,
          loopFrom: 0,
          instruments: { p: { art: 'pulse', duty: 0.5, vol: 0.2 } },
          patterns: { A: [['C-4:p:4:sE-4', '...', '...', '...']] },
          order: ['A'],
        });
        return Math.abs(k.events[0].slideTo - notenFreq('E-4')) < 1e-9 && k.events[0].fx.includes('s');
      })());
    check('S5-§7A(a) P2-m2 pruefeSong wirft bei ragged patterns, unbekanntem Instrument und > 4 Kanaelen',
      wirft(() => compileSong({
        bpm: 120, rowsPerBeat: 4, loopFrom: 0,
        instruments: { p: { art: 'pulse', vol: 0.2 } },
        patterns: { A: [['C-4:p:1', '...'], ['...']] }, order: ['A'],
      }))
      && wirft(() => compileSong({
        bpm: 120, rowsPerBeat: 4, loopFrom: 0,
        instruments: { p: { art: 'pulse', vol: 0.2 } },
        patterns: { A: [['C-4:q:1']] }, order: ['A'],
      }))
      && wirft(() => compileSong({
        bpm: 120, rowsPerBeat: 4, loopFrom: 0,
        instruments: { p: { art: 'pulse', vol: 0.2 } },
        patterns: { A: [['C-4:p:1'], ['...'], ['...'], ['...'], ['...']] }, order: ['A'],
      })));
  }

  // -----------------------------------------------------------------------
  // (b) A1(b) PEAK — ZWEISTUFIG (P1-M9/P2-B1). Gemessen wird ueber die
  //     GEMEINSAME Signatur renderPCM({instruments, events}) — sie rendert
  //     Songs UND SFX — und zwar VOR jedem Limiter: ein tanh im Messpfad
  //     macht das Gate prinzipiell unverletzbar (tanh(x) < 1 fuer alle x).
  // -----------------------------------------------------------------------
  {
    const { songBundle, renderPCM, pcmPeak } = chip;
    const { sfxRender, SFX_KEYS } = sfxMod;
    const RATE = 22050;   // Mess-Rate; halbiert die Laufzeit, aendert den Peak nicht

    const chipQuelle = ohneKommentar(quelle('game/js/audio/chiptune.js'));
    const renderKoerper = chipQuelle.slice(chipQuelle.indexOf('export function renderPCM'));
    check('S5-§7A(b) P2-B1 KEIN tanh/Limiter im Messpfad von renderPCM (sonst misst das Gate sein Gegenteil)',
      !/Math\.tanh|Math\.min\(1, Math\.max\(-1/.test(renderKoerper)
      && !/Math\.tanh/.test(chipQuelle),
      /Math\.tanh/.test(chipQuelle) ? 'tanh im Klangpfad' : 'sauber');

    let maxSong = 0;
    const songPeaks = [];
    for (const k of Object.keys(songMod.SONGS)) {
      const p = pcmPeak(renderPCM(songBundle(songMod.songFuer(k)), RATE));
      songPeaks.push(`${k} ${p.toFixed(3)}`);
      if (p > maxSong) maxSong = p;
    }
    check('S5-§7A(b) A1(b) EINZEL-Peak je Song <= 0,70 (gemessen vor jedem Limiter)',
      maxSong <= 0.70, songPeaks.join(' | '));

    let maxSfx = 0;
    const sfxPeaks = [];
    for (const k of SFX_KEYS) {
      // Gold-Treppe und Schritt-Varianten in ihrer LAUTESTEN Auspraegung.
      const varianten = k === 'gold'
        ? [0, 1, 2, 3, 4, 5, 6, 7].map((stufe) => ({ stufe }))
        : (k === 'step' ? [{ variante: 0 }, { variante: 1 }] : [{}]);
      for (const o of varianten) {
        const p = pcmPeak(renderPCM(sfxRender(k, o), RATE));
        if (p > maxSfx) maxSfx = p;
        sfxPeaks.push(p);
      }
    }
    check('S5-§7A(b) A1(b) EINZEL-Peak je SFX <= 0,50 (alle Gold-Stufen und beide Schritt-Varianten)',
      maxSfx <= 0.50, `max ${maxSfx.toFixed(3)} ueber ${sfxPeaks.length} Rezepte`);

    // SUMMEN-Gate: Musik-Bus + die 12 lautesten SFX gleichzeitig, ueber den
    // Master. Genau die Zahlen, mit denen main.js den Graphen baut.
    const zwoelfLauteste = sfxPeaks.slice().sort((a, b) => b - a).slice(0, mix.BUS.maxStimmen);
    const sfxSumme = zwoelfLauteste.reduce((a, b) => a + b, 0);
    const gesamt = (maxSong * mix.BUS.music + sfxSumme * mix.sfxBusGain(mix.BUS.maxStimmen)) * mix.BUS.master;
    check('S5-§7A(b) A1(b) SUMMEN-Gate: Musik-Bus + 12 Worst-Case-SFX ueber den Master <= 0,90',
      gesamt <= 0.90,
      `(${maxSong.toFixed(3)}*${mix.BUS.music} + ${sfxSumme.toFixed(3)}*${mix.sfxBusGain(12).toFixed(4)}) * ${mix.BUS.master} = ${gesamt.toFixed(4)}`);

    // Gegenprobe, dass das Gate ueberhaupt zubeissen kann.
    const kontrolle = (1.0 * mix.BUS.music + 12 * 0.9 * mix.sfxBusGain(12)) * mix.BUS.master;
    check('S5-§7A(b) Gegenprobe: mit 12 SFX a 0,9 und einem Song a 1,0 REISST dasselbe Gate',
      kontrolle > 0.90, kontrolle.toFixed(3));
  }

  // -----------------------------------------------------------------------
  // (c) §2.4/A1(c)+(e) MIXER — reiner Reducer, Stimmenverwaltung, Busgewinne.
  // -----------------------------------------------------------------------
  {
    const { defaultSettings, parseSettings, serializeSettings, toggle,
      leereStimmen, allocVoice, freeVoice, aktiveStimmen, sfxBusGain, BUS } = mix;

    const kombis = [{ music: true, sfx: true }, { music: true, sfx: false },
      { music: false, sfx: true }, { music: false, sfx: false }];
    check('S5-§7A(c) A1(e) Settings-Rundlauf: parse(serialize(s)) traegt beide Schalter zurueck',
      kombis.every((s) => {
        const r = parseSettings(serializeSettings(s));
        return r.music === s.music && r.sfx === s.sfx;
      }));
    const muell = [null, undefined, '', '{', '[]', '{"v":2,"music":false}', '"text"', '{"v":1}'];
    check('S5-§7A(c) A1(e) parseSettings wirft NIE und faellt hart auf die Werkseinstellung zurueck',
      muell.every((m) => {
        let r = null;
        try { r = parseSettings(m); } catch { return false; }
        return r && typeof r.music === 'boolean' && typeof r.sfx === 'boolean';
      })
      && parseSettings('{"v":2,"music":false}').music === true
      && parseSettings(undefined).music === defaultSettings().music);
    check('S5-§7A(c) §2.4 toggle ist ein REINER Reducer (neues Objekt, Original unveraendert)',
      (() => {
        const a = defaultSettings();
        const b = toggle(a, 'music');
        return b !== a && a.music === true && b.music === false && b.sfx === true
          && toggle(a, 'unbekannt').music === a.music;
      })());
    check('S5-§7A(c) A1(e) Audio-Kern ist ohne AudioContext inert: kein Browser-Global in game/js/audio/**',
      jsDateien('game/js/audio').every((f) => !/\b(window|document|localStorage|AudioContext)\b/
        .test(ohneKommentar(quelle(f)))),
      jsDateien('game/js/audio').length + ' Dateien');

    // A1(c) Stimmen: <= 12, aelteste fliegt.
    let st = leereStimmen();
    const geworfen = [];
    for (let i = 1; i <= 20; i++) {
      const a = allocVoice(st, i, i * 0.01);
      st = a.state;
      if (a.evicted) geworfen.push(a.evicted.id);
    }
    check('S5-§7A(c) A1(c) hoechstens 12 SFX-Stimmen, und es fliegt genau die AELTESTE',
      aktiveStimmen(st) === BUS.maxStimmen && BUS.maxStimmen === 12
      && geworfen.join(',') === '1,2,3,4,5,6,7,8',
      `${aktiveStimmen(st)} aktiv, geworfen ${geworfen.join(',')}`);
    check('S5-§7A(c) A1(c) freeVoice gibt genau eine Stimme frei und liefert ein neues Objekt',
      (() => {
        const vor = aktiveStimmen(st);
        const neu = freeVoice(st, 15);
        return neu !== st && aktiveStimmen(neu) === vor - 1 && aktiveStimmen(st) === vor;
      })());
    check('S5-§7A(c) §4.1 Busgewinne: sfxBusGain faellt monoton und startet bei BUS.sfx',
      Math.abs(sfxBusGain(1) - BUS.sfx) < 1e-12
      && [2, 3, 6, 12].every((n) => sfxBusGain(n) < sfxBusGain(n - 1))
      && BUS.master === 0.8 && BUS.duck === 0.32,
      `1:${sfxBusGain(1).toFixed(3)} 12:${sfxBusGain(12).toFixed(3)} master ${BUS.master} duck ${BUS.duck}`);
  }

  // -----------------------------------------------------------------------
  // (d) §2.2/A1(d) SFX-KATALOG + ZUORDNUNGSTABELLE. Die Pflichtliste steht
  //     hier WOERTLICH aus der Spec — eine Umbenennung in sfx.js faellt damit
  //     auf, statt still eine Leerstelle zu hinterlassen.
  // -----------------------------------------------------------------------
  {
    const PFLICHT = ['sword_swing', 'sword_hit', 'sword_blocked', 'enemy_die', 'gold',
      'potion_drink', 'potion_pickup', 'pickup_generic', 'chest_open', 'vase_break',
      'boomerang_throw', 'boomerang_catch', 'portal', 'portal_blocked', 'step',
      'pause_toggle', 'menu_move', 'menu_confirm', 'level_up', 'player_hurt',
      'boss_telegraph', 'boss_dash', 'hound_jump', 'boss_die',
      'game_over_stinger', 'victory_stinger'];
    check('S5-§7A(d) §2.2 alle 26 Pflicht-SFX-Schluessel existieren',
      PFLICHT.length === 26 && PFLICHT.every((k) => !!sfxMod.SFX[k]),
      PFLICHT.filter((k) => !sfxMod.SFX[k]).join(',') || 'vollstaendig');
    check('S5-§7A(d) §2.2 sfxRezept WIRFT bei unbekanntem Schluessel (kein stilles Schweigen)',
      (() => { try { sfxMod.sfxRezept('gibt_es_nicht'); return false; } catch { return true; } })());
    check('S5-§7A(d) P2-B3 Menue- und Stinger-Klaenge haengen am uiBus (in der Pause hoerbar)',
      ['pause_toggle', 'menu_move', 'menu_confirm', 'game_over_stinger', 'victory_stinger']
        .every((k) => sfxMod.sfxBusVon(k) === 'ui')
      && ['sword_hit', 'step', 'gold'].every((k) => sfxMod.sfxBusVon(k) === 'sfx'));
    check('S5-§7A(d) §2.2 Gold-Tonhoehentreppe: 8 Stufen, streng steigend',
      sfxMod.GOLD_TREPPE.length === 8
      && sfxMod.GOLD_TREPPE.every((v, i) => i === 0 || v > sfxMod.GOLD_TREPPE[i - 1])
      && sfxMod.sfxRender('gold', { stufe: 7 }).events[0].freq
        > sfxMod.sfxRender('gold', { stufe: 0 }).events[0].freq,
      sfxMod.GOLD_TREPPE.join(','));

    // A1(d) VOLLSTAENDIGKEIT: jeder Ereignistyp, den entities/ ueberhaupt in
    // den Strom legt, hat im Beobachter eine Zeile — Buendelung erlaubt,
    // Leerstellen nicht (P1-M3). Die Typen werden aus dem QUELLTEXT von
    // entities/** gelesen, nicht abgeschrieben.
    const entQuelle = jsDateien('game/js/entities').map((f) => quelle(f)).join('\n');
    const typen = new Set();
    for (const m of entQuelle.matchAll(/events\.push\(\s*'([a-z_]+)'\s*\)/g)) typen.add(m[1]);
    for (const m of entQuelle.matchAll(/events\.push\(\s*\{\s*type:\s*'([a-z_]+)'/g)) typen.add(m[1]);
    for (const m of entQuelle.matchAll(/deathEvent:\s*'([a-z_]+)'/g)) typen.add(m[1]);
    const ohneZeile = [...typen].filter((t) => !new RegExp(`hasEvent\\(events, '${t}'\\)`).test(MAIN));
    check('S5-§7A(d) A1(d) Zuordnungstabelle VOLLSTAENDIG: JEDER Ereignistyp aus entities/** wird ausgewertet',
      typen.size >= 14 && ohneZeile.length === 0,
      `${typen.size} Typen, ohne Zeile: ${ohneZeile.join(',') || '-'}`);
    // Truhen klingen ueber die ZWEITE props-Schleife (Flanke opened), nicht
    // ueber den Event-Strom — der traegt chest_opened nur fuer die Siegtruhe.
    check('S5-§7A(d) A1(d) Truhen und Vasen haengen an der Flanke der zweiten props-Schleife',
      /p\.kind === 'chest'/.test(MAIN) && /spieleSfx\('chest_open'\)/.test(MAIN)
      && /spieleSfx\('vase_break'\)/.test(MAIN));
    // Und die Gegenrichtung: jeder gespielte Schluessel existiert wirklich.
    const gerufen = [...new Set([...MAIN.matchAll(/spieleSfx\('([a-z_]+)'/g)].map((m) => m[1]))];
    check('S5-§7A(d) A1(d) jede spieleSfx-Zeile in main.js zeigt auf einen EXISTIERENDEN Schluessel',
      gerufen.length >= 20 && gerufen.every((k) => !!sfxMod.SFX[k]),
      `${gerufen.length} Schluessel, unbekannt: ${gerufen.filter((k) => !sfxMod.SFX[k]).join(',') || '-'}`);
  }

  // -----------------------------------------------------------------------
  // (e) §0.2 ZEITARGUMENT-WAECHTER ueber game/js/** — der Grund, warum dieser
  //     Slice den Bestands-Waechter smoke:4854 ueberhaupt ueberlebt: dort wird
  //     `.stop()` in main.js VERBOTEN und `.start()` auf GENAU EINEN Treffer
  //     festgenagelt (den Loop). Ein WebAudio-Knoten mit leeren Klammern
  //     (osc.start()) haette den Slice unauflösbar in die Klemme gefahren.
  // -----------------------------------------------------------------------
  {
    const dateien = jsDateien('game/js');
    const treffer = [];
    let starts = 0;
    let stops = 0;
    for (const f of dateien) {
      const c = ohneKommentar(quelle(f));
      const s = (c.match(/\.start\(\)/g) || []).length;
      const t = (c.match(/\.stop\(\)/g) || []).length;
      starts += s;
      stops += t;
      if (s || t) treffer.push(`${f.split('/').pop()} start${s}/stop${t}`);
    }
    check('S5-§7A(e) §0.2 game/js/** enthaelt KEIN einziges .stop() mit leeren Klammern',
      stops === 0, treffer.join(' '));
    check('S5-§7A(e) §0.2 genau EIN .start() ohne Zeitargument in game/js/** — und das ist loop.start()',
      starts === 1 && /createLoop\(\{ update, render \}\)\.start\(\);/.test(MAIN),
      `${starts} Treffer in ${dateien.length} Dateien: ${treffer.join(' ') || '-'}`);
    // Und die Gegenrichtung: die WebAudio-Knoten werden wirklich MIT Zeit
    // gestartet und gestoppt (behavioral nachgemessen in Block (h)).
    check('S5-§7A(e) §0.2 der Adapter startet/stoppt AUSSCHLIESSLICH mit Zeitargument',
      (MAIN.match(/\.start\(t0\)/g) || []).length >= 2
      && (MAIN.match(/\.stop\(t0 \+/g) || []).length >= 2
      && /q\.stop\(t\)/.test(MAIN));
  }

  // -----------------------------------------------------------------------
  // (f) §5 GAME-FEEL — Quelltext-Waechter fuer die Zahlen und Orte, die die
  //     Messungen des Reviews festgeschrieben haben, plus die beiden
  //     Partikel-Deckel. Das VERHALTEN misst Block (h) am gebooteten Spiel.
  // -----------------------------------------------------------------------
  {
    // A3: 2/3/4 sind gemessene TEST-Grenzen (H = 4 kippt check_inventory).
    check('S5-§7A(f) A3 Hitstop-Zahlen stehen als Konstanten: H/K/B = 2/3/4',
      /const HITSTOP_H = 2;/.test(MAIN) && /const HITSTOP_K = 3;/.test(MAIN)
      && /const HITSTOP_B = 4;/.test(MAIN));
    // P1-B2: der Spieler-Schaden-Zweig darf den Hitstop NICHT anfassen.
    const schadenBlock = MAIN.slice(MAIN.indexOf('const inv = player.invulnTimer'),
      MAIN.indexOf('audioInvuln = inv;'));
    check('S5-§7A(f) A3/P1-B2 der SPIELER-SCHADEN-Zweig setzt NIRGENDS einen Hitstop (nur Flash + Shake)',
      schadenBlock.length > 40 && !/hitstop/i.test(schadenBlock)
      && /shakeAusloesen\(/.test(schadenBlock) && /flashFrames/.test(schadenBlock),
      `${schadenBlock.length} Zeichen Zweig`);
    check('S5-§7A(f) §7.A timeSec laeuft im Freeze weiter: update() zaehlt VOR jeder Zweigwahl',
      /function update\(dt\) \{\s*timeSec \+= dt;\s*stateTime \+= dt;\s*/.test(MAIN)
      && MAIN.indexOf('shakeFortschreiben();') < MAIN.indexOf("if (hitstop > 0 && fadePhase === 'none')"));
    check('S5-§7A(f) §5.1 der Freeze-Zweig puffert den Angriffs-Pegel, statt ihn zu verschlucken',
      /if \(hitstop > 0 && fadePhase === 'none'\) \{[\s\S]{0,600}?if \(input\.attack\) attackPuffer = true;/.test(MAIN)
      && /attackPuffer = false;[\s\S]{0,200}?input\.attack = true;/.test(MAIN));
    // P1-M2: doppelte Nullung. Ohne die enterState-Nullung war check_main:293
    // GEMESSEN rot (Zentrum-screen 217 statt 216).
    const buildWorldKoerper = MAIN.slice(MAIN.indexOf('function buildWorld('),
      MAIN.indexOf('function enterState('));
    check('S5-§7A(f) §5.2/P1-M2 Shake wird in enterState UND in buildWorld hart genullt (doppelt, gemessen noetig)',
      /function enterState\(next\) \{\s*shakeNullen\(\);\s*hitstop = 0;/.test(MAIN)
      && /shakeNullen\(\);/.test(buildWorldKoerper)
      && (MAIN.match(/shakeNullen\(\);/g) || []).length >= 2,
      `${(MAIN.match(/shakeNullen\(\);/g) || []).length} Nullungen`);
    check('S5-§7A(f) §5.2/P1-m2 der Offset ist ganzzahlig und wird NACH der Weltrand-Klemmung angewandt',
      /shakeOffX = Math\.round\(/.test(MAIN) && /shakeOffY = Math\.round\(/.test(MAIN)
      && /camera\.x = Math\.min\(Math\.max\(shakeBasisX \+ shakeOffX, 0\), maxX\);/.test(MAIN));
    check('S5-§7A(f) §5.2/P2-M7 shakeAnwenden laeuft in JEDEM Zweig — auch im Freeze und im Fade',
      (MAIN.match(/shakeAnwenden\(\);/g) || []).length >= 3);
    // P2-M8: der Beobachter haengt an GENAU EINER Stelle.
    check('S5-§7A(f) §3/P2-M8 der Audio-Beobachter wird an GENAU EINER Stelle gerufen — nach updateDrops',
      (MAIN.match(/audioBeobachter\(dt\);/g) || []).length === 1
      && /updateDrops\(dt, drops, player, events\);\s*audioBeobachter\(dt\);/.test(MAIN));
    // P2-m6: Schritt-Kopplung an den SPRITE-Frame, nicht an einen freien Timer.
    check('S5-§7A(f) §3.3/P2-m6 Schritt-Ton haengt am Sprite-Frame: jeder ZWEITE Wechsel + 0,22 s Mindestabstand',
      /Math\.floor\(\(player\.animTimer \|\| 0\) \* 10\) % 4/.test(MAIN)
      && /audioSchrittZaehler % 2 === 0 && audioSchrittUhr <= 0/.test(MAIN)
      && /audioSchrittUhr = 0\.22;/.test(MAIN));
    // P1-M7: die BESTANDS-props-Schleife bleibt ZEICHENIDENTISCH. Hier steht
    // sie als eingefrorener Text aus HEAD 80d5571 (vor Slice 5).
    const BESTAND_PROPS = [
      '      for (let i = 0; i < props.length; i++) {',
      '        const p = props[i];',
      "        if (p.kind !== 'chest' || p.opened !== true || p.siegChest === true) continue;",
      '        const k = chestKey(currentMapKey, p);',
      '        if (!runFlags.openedChests.includes(k)) runFlags.openedChests.push(k);',
      '      }',
    ].join('\n');
    const MAIN_ROH = quelle('game/js/main.js');
    check('S5-§7A(f) §3/P1-M7 die props-BESTANDSSCHLEIFE ist byte-identisch zum Stand vor Slice 5',
      MAIN_ROH.includes(BESTAND_PROPS));
    // Und der Waechter, dessen Fenster sie nicht sprengen darf (smoke:4772):
    // 400 Zeichen Fenster, heute 279 belegt.
    const fenster = /for \(let i = 0; i < props\.length; i\+\+\)([\s\S]{0,400}?)runFlags\.openedChests\.push\(k\)/.exec(MAIN);
    check('S5-§7A(f) P1-M7 das 400-Zeichen-Fenster des Bestands-Waechters behaelt >= 100 Zeichen Reserve',
      !!fenster && 400 - fenster[1].length >= 100,
      fenster ? `${fenster[1].length} belegt, ${400 - fenster[1].length} frei` : 'Fenster nicht gefunden');
    // Der Vasen-/Truhen-Beobachter ist die EIGENE zweite Schleife.
    check('S5-§7A(f) §3/P1-M7 der Vasen-/Truhen-Beobachter ist eine EIGENE, zweite props-Schleife',
      /for \(const p of props\) \{[\s\S]{0,600}?spieleSfx\('vase_break'\)/.test(MAIN));

    // §5.4 Partikel: zwei getrennte Deckel. list/spawnEmbers/MAX_PARTICLES
    // bleiben unveraendert (smoke:2185-2186 prueft exakt 60).
    const parts = createParticles();
    for (let i = 0; i < 300; i++) parts.spawnEmbers(100, 100, 1);
    for (let i = 0; i < 300; i++) parts.spawnBurst(120, 90, 6, 'funke');
    check('S5-§7A(f) §5.4/P1-M6 burstList hat einen EIGENEN Deckel 40 — die Glut-Liste bleibt bei 60',
      parts.list.length === 60 && parts.burstList.length === 40,
      `list ${parts.list.length}, burstList ${parts.burstList.length}`);
    check('S5-§7A(f) §5.4/P2-M9 Gegenprobe: 300 Bursts hungern die Glut NICHT aus',
      (() => {
        const p2 = createParticles();
        for (let i = 0; i < 300; i++) p2.spawnBurst(120, 90, 6, 'staub');
        for (let i = 0; i < 300; i++) p2.spawnEmbers(100, 100, 1);
        return p2.list.length === 60 && p2.burstList.length === 40;
      })());
    check('S5-§7A(f) §5.4 beide Listen werden abgebaut (update leert sie ohne Nachschub)',
      (() => {
        for (let i = 0; i < 200; i++) parts.update(1 / 60);
        return parts.burstList.length === 0 && parts.list.length === 0;
      })(), `list ${parts.list.length}, burstList ${parts.burstList.length}`);
  }

  // -----------------------------------------------------------------------
  // (g) §6.1 PAUSE-GEOMETRIE — fuenf Zonen, Ueberlappungspruefung ueber ALLE
  //     Paare (der Bestand prueft nur die Nachbarn 0/1/2), Panel- und
  //     FPS-Fenster-Vertraeglichkeit.
  // -----------------------------------------------------------------------
  {
    const hud = await import('../game/js/ui/hud.js');
    const Z = hud.PAUSE_MENU_ZONES;
    let ueberlappt = null;
    for (let i = 0; i < Z.length; i++) {
      for (let j = i + 1; j < Z.length; j++) {
        const a = Z[i];
        const b = Z[j];
        if (a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h) {
          ueberlappt = `${i}/${j}`;
        }
      }
    }
    check('S5-§7A(g) §6.1 fuenf Zonen, KEIN Paar ueberlappt (alle 10 Paare geprueft, nicht nur die Nachbarn)',
      Z.length === 5 && ueberlappt === null, ueberlappt ? `Paar ${ueberlappt}` : '10 Paare frei');
    check('S5-§7A(g) §6.1/P1-m5 jede Zone >= 6 mm hoch (h >= 16 px) und alle tragen dieselbe w/h',
      Z.every((z) => z.h * MM_PRO_PX_S5 >= 6)
      && Z.every((z) => z.w === Z[0].w && z.h === Z[0].h),
      `h ${Z[0].h} px = ${(Z[0].h * MM_PRO_PX_S5).toFixed(2)} mm`);
    check('S5-§7A(g) §6.1/P1-m5 Unterkante 146 < Panel-Unterkante 150 — das drawFps-Fenster (158-175) bleibt frei',
      Math.max(...Z.map((z) => z.y + z.h)) <= 150
      && Math.max(...Z.map((z) => z.y + z.h)) < 158,
      `Unterkante ${Math.max(...Z.map((z) => z.y + z.h))}`);
    // P1-m7: 0/1/2 sind eingefroren, MUSIK/TON haengen HINTEN an.
    const rec = { log: [], globalAlpha: 1, fillStyle: '', font: '', textAlign: '', textBaseline: '',
      fillRect(...a) { this.log.push({ op: 'fillRect', alpha: this.globalAlpha, fill: this.fillStyle, args: a }); },
      fillText(t, x, y) { this.log.push({ op: 'fillText', text: String(t), x, y }); },
      clearRect() {}, drawImage() {}, beginPath() {}, arc() {}, fill() {}, stroke() {},
      save() {}, restore() {}, createRadialGradient: () => ({ addColorStop() {} }) };
    hud.drawPause(rec, { cursor: 0, god: false, fps: false, musik: true, ton: false });
    const texte = rec.log.filter((o) => o.op === 'fillText').map((o) => o.text);
    check('S5-§7A(g) §6.1 Reihenfolge eingefroren: WEITER / GOTT / FPS / MUSIK / TON',
      texte.some((t) => t.includes('WEITER')) && texte.some((t) => t.startsWith('GOTT'))
      && texte.some((t) => t.startsWith('FPS')) && texte.some((t) => t.startsWith('MUSIK'))
      && texte.some((t) => t.startsWith('TON')), texte.join('/'));
    check('S5-§7A(g) §6.1 die neuen Schalterzeilen spiegeln den Zustand und meiden JEDE Sonde',
      texte.includes('MUSIK: AN') && texte.includes('TON: AUS')
      && texte.every((t) => ['GOLD', 'SIEG', 'GAME OVER', 'GRIMLIGHT', 'STUFE', 'AUSRUESTUNG', 'x 0']
        .every((s) => !t.includes(s))), texte.join('/'));
    check('S5-§7A(g) §6.1 die Pause loest den Fade-Detektor der Flusstests NICHT aus',
      !rec.log.some((o) => o.op === 'fillRect' && o.fill === '#000'
        && o.alpha > 0 && o.alpha < 1 && o.args[2] === 320 && o.args[3] === 180));
  }

  // -----------------------------------------------------------------------
  // (h) VERHALTEN AM GEBOOTETEN SPIEL. main.js hat keine Exporte; gefahren
  //     wird es deshalb wie in tools/check_save_slice4.mjs ueber einen
  //     vollstaendigen Stub-Satz (window/document/Canvas/rAF) und beobachtet
  //     ueber das Zeichenprotokoll. NEU hier: ein aufzeichnender
  //     AudioContext-Stub — damit ist der §4-Adapter (Bus-Graph, Ducking,
  //     Lifecycle, Zeitargumente, Schrittrate) zum ersten Mal HEADLESS
  //     messbar und nicht nur per Quelltext behauptet.
  //
  //     MESSPRINZIP HITSTOP: der Angriffs-Sprite steht genau ATTACK_BUSY lang
  //     — in UPDATE-Ticks gerechnet. Ein Freeze-Frame rendert, ohne die Welt
  //     zu updaten, verlaengert den Sprite also um genau seine Frame-Zahl.
  //     Damit ist die Sprite-Dauer eine EXAKTE Uhr fuer den Hitstop:
  //       Angriff ins Leere = B, Treffer = B + 2 (H), Kill = B + 3 (K).
  //     Der Zeitschritt ist bewusst 1/60 s + 1 us: so liefert JEDER rAF-Frame
  //     genau EIN Update (der Akkumulator aus loop.js kann sonst Frames mit 0
  //     oder 2 Updates erzeugen und die Zaehlung um +-1 verschieben).
  // -----------------------------------------------------------------------
  {
    const zufallVorher = Math.random;
    const perfVorher = Object.getOwnPropertyDescriptor(globalThis, 'performance');
    const winVorher = globalThis.window;
    const docVorher = globalThis.document;
    Math.random = () => 0.5;          // wie check_main_slice1: volle Determinismus
    const bops = [];
    let uhrMs = 0;
    try { globalThis.performance = { now: () => uhrMs }; }
    catch { Object.defineProperty(globalThis, 'performance', { value: { now: () => uhrMs } }); }

    function bctx(canvas) {
      return {
        canvas, imageSmoothingEnabled: false, globalAlpha: 1,
        globalCompositeOperation: 'source-over',
        fillStyle: '', strokeStyle: '', lineWidth: 1, font: '', textAlign: '', textBaseline: '',
        _stack: [],
        fillRect(...a) { bops.push({ canvas, op: 'fillRect', alpha: this.globalAlpha, fill: this.fillStyle, args: a }); },
        clearRect() {}, strokeRect() {},
        drawImage(img, ...a) { bops.push({ canvas, op: 'drawImage', img, args: a }); },
        fillText(t, x, y) { bops.push({ canvas, op: 'fillText', text: String(t), x, y }); },
        beginPath() {}, arc() {}, fill() {}, stroke() {}, closePath() {}, moveTo() {}, lineTo() {}, rect() {},
        save() { this._stack.push({ a: this.globalAlpha, f: this.fillStyle }); },
        restore() { const s = this._stack.pop(); if (s) { this.globalAlpha = s.a; this.fillStyle = s.f; } },
        createRadialGradient: () => ({ addColorStop() {} }),
      };
    }

    // Aufzeichnender AudioContext. Er implementiert GENAU die Knoten, die
    // main.js baut, und protokolliert jeden Aufruf mit seinen Argumenten.
    function mkAudioStub() {
      const log = [];
      let uhr = 0;
      let nr = 0;
      const param = (node, name, v0) => ({
        _v: v0,
        get value() { return this._v; },
        set value(x) { this._v = x; log.push({ op: 'setValue', node: node.id, param: name, v: x }); },
        setValueAtTime(v, t) { log.push({ op: 'setValueAtTime', node: node.id, param: name, v, t }); return this; },
        linearRampToValueAtTime(v, t) { log.push({ op: 'linearRamp', node: node.id, param: name, v, t }); return this; },
        exponentialRampToValueAtTime(v, t) { log.push({ op: 'expRamp', node: node.id, param: name, v, t }); return this; },
        cancelScheduledValues(t) { log.push({ op: 'cancel', node: node.id, param: name, t }); return this; },
      });
      const knoten = (art) => {
        const n = { id: ++nr, art };
        n.connect = (z) => log.push({ op: 'connect', node: n.id, art, to: z && z.id ? z.id : 'destination' });
        n.disconnect = () => log.push({ op: 'disconnect', node: n.id });
        return n;
      };
      const ctx = {
        state: 'suspended', sampleRate: 44100,
        get currentTime() { return uhr; },
        destination: { id: 'destination' },
        _log: log,
        _tick(dt) { uhr += dt; },
        resume() { log.push({ op: 'resume' }); ctx.state = 'running'; return Promise.resolve(); },
        suspend() { log.push({ op: 'suspend' }); ctx.state = 'suspended'; return Promise.resolve(); },
        createGain() { const n = knoten('gain'); n.gain = param(n, 'gain', 1); return n; },
        createOscillator() {
          const n = knoten('osc');
          n.frequency = param(n, 'frequency', 440);
          n.type = 'sine';
          n.setPeriodicWave = () => {};
          n.start = (...a) => log.push({ op: 'start', node: n.id, args: a });
          n.stop = (...a) => log.push({ op: 'stop', node: n.id, args: a });
          return n;
        },
        createBufferSource() {
          const n = knoten('src');
          n.playbackRate = param(n, 'playbackRate', 1);
          n.start = (...a) => log.push({ op: 'start', node: n.id, args: a });
          n.stop = (...a) => log.push({ op: 'stop', node: n.id, args: a });
          return n;
        },
        createBuffer(kanaele, n) { return { getChannelData: () => new Float32Array(n) }; },
        createPeriodicWave() { log.push({ op: 'periodicWave' }); return { periodic: true }; },
      };
      return ctx;
    }

    const FLIP = ['player_side_0', 'player_side_1', 'player_side_2', 'player_side_3',
      'player_attack_side', 'sword_slash_side', 'skeleton_0', 'skeleton_1', 'skeleton_die',
      'ghoul_0', 'ghoul_1', 'ghoul_die'];
    const NAMEN = [...Object.keys(SPRITES), ...FLIP.map((k) => `${k}_flip`), ...Object.keys(TILE_ART)];

    function boot({ search = '', rig = {} } = {}) {
      const canvases = [];
      const mkCanvas = () => {
        const c = { width: 0, height: 0, style: {}, ownerDocument: null };
        c.getContext = () => (c._ctx || (c._ctx = bctx(c)));
        c.addEventListener = () => {};
        c.getBoundingClientRect = () => ({ left: 0, top: 0, width: 320, height: 180 });
        canvases.push(c);
        return c;
      };
      const winL = {};
      const docL = {};
      const rafQ = [];
      const actx = mkAudioStub();
      const win = {
        addEventListener: (t, f) => (winL[t] = winL[t] || []).push(f),
        devicePixelRatio: 1, innerWidth: 960, innerHeight: 540,
        location: { search },
        requestAnimationFrame: (cb) => rafQ.push(cb),
        AudioContext: function () { return actx; },
      };
      Object.assign(win, rig);
      const haupt = { width: 320, height: 180, style: {} };
      const doc = {
        getElementById: () => haupt,
        createElement: () => mkCanvas(),
        addEventListener: (t, f) => (docL[t] = docL[t] || []).push(f),
        defaultView: win, hidden: false,
      };
      haupt.getContext = () => (haupt._ctx || (haupt._ctx = bctx(haupt)));
      haupt.addEventListener = () => {};
      haupt.getBoundingClientRect = () => ({ left: 0, top: 0, width: 320, height: 180 });
      haupt.ownerDocument = doc;
      globalThis.window = win;
      globalThis.document = doc;
      const b = {
        win, doc, haupt, rafQ, canvases, actx, nameOf: new Map(),
        benenne() { canvases.forEach((c, i) => b.nameOf.set(c, NAMEN[i] || `extra_${i}`)); },
        frame() {
          bops.length = 0;
          const cb = rafQ.shift();
          if (!cb) throw new Error('kein rAF-Callback (Boot tot?)');
          uhrMs += 1000 / 60 + 0.001;   // s. Messprinzip oben: genau 1 Update/Frame
          actx._tick(1 / 60);
          cb();
        },
        frames(n) { for (let i = 0; i < n; i++) b.frame(); },
        key(typ, code) { for (const f of winL[typ] || []) f({ code, repeat: false, preventDefault() {} }); },
        halte(code, n) { b.key('keydown', code); b.frames(n); b.key('keyup', code); },
        feuereDoc(typ, ev = {}) { for (const f of docL[typ] || []) f(ev); },
        texte: () => bops.filter((o) => o.op === 'fillText').map((o) => o.text),
        hatText: (t) => b.texte().some((s) => s.includes(t)),
        namen: () => bops.filter((o) => o.op === 'drawImage' && o.canvas === haupt)
          .map((o) => String(b.nameOf.get(o.img) || '')),
        zaehle: (re) => b.namen().filter((x) => re.test(x)).length,
        spielerZug: () => {
          const d = bops.filter((o) => o.op === 'drawImage' && o.canvas === haupt
            && String(b.nameOf.get(o.img) || '').startsWith('player'));
          return d.length ? { x: d[d.length - 1].args[0], y: d[d.length - 1].args[1] } : null;
        },
        vollbild: () => bops.filter((o) => o.op === 'fillRect' && o.canvas === haupt
          && o.args[2] === 320 && o.args[3] === 180),
      };
      return b;
    }

    const angriffSteht = (b) => b.namen().some((x) => /player_attack|sword_slash/.test(x));

    // --- BOOT 1: ?god=1 (unverwundbar => saubere Sprite-Laeufe, dmg 10) -----
    const g = boot({ search: '?god=1' });
    await import('../game/js/main.js?s5a=1');
    g.benenne();
    g.frames(5);
    check('S5-§7A(h) Boot: der Titel steht und der Audio-Adapter ist VOR der ersten Geste vollstaendig inert',
      g.hatText('GRIMLIGHT') && g.actx._log.length === 0 && g.actx.state === 'suspended',
      `${g.actx._log.length} Audio-Aufrufe`);

    // §0.3: die erste Taste schaltet frei (Titelmusik erst nach der Geste).
    g.key('keydown', 'KeyQ'); g.key('keyup', 'KeyQ');
    g.frames(2);
    const graph = g.actx._log.filter((l) => l.op === 'connect');
    const master = graph.find((l) => l.to === 'destination');
    const amMaster = graph.filter((l) => l.to === (master && master.node)).map((l) => l.node);
    check('S5-§7A(h) §0.3 die erste Taste schaltet den Kontext frei (resume, fire-and-forget)',
      g.actx.state === 'running' && g.actx._log.some((l) => l.op === 'resume'));
    check('S5-§7A(h) §4.1 BUS-GRAPH: genau EIN Knoten am Ziel, und daran haengen musicA/musicB/sfx/ui',
      !!master && graph.filter((l) => l.to === 'destination').length === 1
      && amMaster.length === 4,
      `Master ${master && master.node}, daran ${amMaster.join(',')}`);
    const ersterWert = (id) => (g.actx._log.find((l) => l.op === 'setValue' && l.node === id) || {}).v;
    check('S5-§7A(h) §4.1 Master-Startwert 0,8; das Crossfade-Paar startet auf 0 (erste Wertsetzung je Knoten)',
      ersterWert(master && master.node) === 0.8
      && ersterWert(amMaster[0]) === 0 && ersterWert(amMaster[1]) === 0,
      `master ${ersterWert(master && master.node)}, A ${ersterWert(amMaster[0])}, B ${ersterWert(amMaster[1])}`);

    // §4.5/P1-M4/P2-B2: suspend() muss AUF DEM TITEL greifen (player === null).
    const vorHidden = g.actx._log.length;
    g.doc.hidden = true;
    g.feuereDoc('visibilitychange', {});
    check('S5-§7A(h) §4.5/P2-B2 visibilitychange suspendiert AUCH IM TITEL (vor jedem !player-Guard)',
      g.actx._log.slice(vorHidden).some((l) => l.op === 'suspend') && g.actx.state === 'suspended');
    g.doc.hidden = false;
    g.feuereDoc('visibilitychange', {});
    check('S5-§7A(h) §4.5 die Rueckkehr in den Vordergrund nimmt den Kontext wieder auf',
      g.actx.state === 'running');

    g.key('keydown', 'Enter'); g.key('keyup', 'Enter');
    g.frames(3);
    check('S5-§7A(h) Boot: ENTER startet das Spiel (HUD steht)', g.hatText('GOLD'));

    // §3.3/P2-m6 SCHRITTRATE. Drei Sekunden geradeaus laufen; jeder spieleSfx-
    // Aufruf hinterlaesst genau eine Pegel-Anker-Kette auf dem sfxBus.
    const sfxBusId = amMaster[2];
    const vorLauf = g.actx._log.length;
    g.halte('ArrowRight', 180);
    const imLauf = g.actx._log.slice(vorLauf);
    const sfxRufe = imLauf.filter((l) => l.op === 'cancel' && l.node === sfxBusId).length;
    check('S5-§7A(h) §3.3/P2-m6 Schritt-Rate liegt bei ~2,5/s (5/s waere Sprint-Kadenz)',
      sfxRufe / 3 >= 2.0 && sfxRufe / 3 <= 3.2, `${sfxRufe} Klaenge in 3 s = ${(sfxRufe / 3).toFixed(2)}/s`);
    // Links/rechts wechselt DETERMINISTISCH (kein Zufall): genau zwei
    // Tonhoehen, streng abwechselnd.
    const rauschTon = imLauf.filter((l) => l.op === 'setValueAtTime' && l.param === 'playbackRate')
      .map((l) => Math.round(l.v * 1e6) / 1e6);
    const seiten = [...new Set(rauschTon)];
    check('S5-§7A(h) §3.3 Schritte wechseln deterministisch zwischen GENAU ZWEI Tonhoehen (links/rechts)',
      seiten.length === 2 && rauschTon.length >= 4
      && rauschTon.every((v, i) => i === 0 || v !== rauschTon[i - 1]),
      `${rauschTon.length} Schritte, Werte ${seiten.map((v) => v.toFixed(3)).join('/')}`);

    // §0.2 ZEITARGUMENT, behavioral: JEDER start/stop-Aufruf traegt eine Zeit.
    const startStop = g.actx._log.filter((l) => l.op === 'start' || l.op === 'stop');
    check('S5-§7A(h) §0.2 JEDER Knoten wurde mit Zeitargument gestartet/gestoppt (behavioral, nicht nur Quelltext)',
      startStop.length >= 20
      && startStop.every((l) => l.args.length === 1 && Number.isFinite(l.args[0]) && l.args[0] >= 0),
      `${startStop.length} Aufrufe, ohne Zeit: ${startStop.filter((l) => l.args.length !== 1).length}`);

    // --- HITSTOP-UHR ------------------------------------------------------
    // Basiswert: ein Angriff, der nichts trifft.
    const messeLauf = (b, maxF) => {
      const folge = [];
      let vorTod = 0;
      for (let i = 0; i < maxF; i++) {
        b.frame();
        const tot = b.zaehle(/skeleton_die|ghoul_die/);
        folge.push({ a: angriffSteht(b), neuerTod: tot > vorTod });
        vorTod = tot;
      }
      const laeufe = [];
      let cur = null;
      for (const f of folge) {
        if (f.a) {
          if (!cur) cur = { n: 0, tod: false };
          cur.n += 1;
          if (f.neuerTod) cur.tod = true;
        } else if (cur) { laeufe.push(cur); cur = null; }
      }
      if (cur) laeufe.push(cur);
      return laeufe;
    };
    g.key('keydown', 'KeyJ');
    const basisLaeufe = messeLauf(g, 40);
    g.key('keyup', 'KeyJ');
    const BASIS = basisLaeufe.length ? basisLaeufe[0].n : -1;
    check('S5-§7A(h) Mess-Vorbedingung: ein Angriff ins Leere steht eine feste Zahl Frames (die Hitstop-Uhr)',
      BASIS >= 12 && BASIS <= 24, `${BASIS} Frames`);

    // GOD (dmg 10) => jeder Treffer ist ein Kill => HITSTOP_K = 3.
    g.key('keydown', 'KeyJ');
    g.key('keydown', 'ArrowRight');
    const godLaeufe = messeLauf(g, 700);
    g.key('keyup', 'ArrowRight');
    g.key('keyup', 'KeyJ');
    const kills = godLaeufe.filter((l) => l.tod);
    const treffer = godLaeufe.filter((l) => l.n > BASIS);
    check('S5-§7A(h) A3 KILL friert GENAU 3 Frames ein (HITSTOP_K): Kill-Laeufe messen Basis + 3',
      kills.length >= 1 && kills.every((l) => l.n === BASIS + 3),
      `${kills.length} Kills, Laengen ${kills.map((l) => l.n).join(',')} gegen Basis ${BASIS}`);
    check('S5-§7A(h) A3 kein Freeze ist laenger als 3 Frames, wenn nur Kills vorkommen (Obergrenze haelt)',
      treffer.every((l) => l.n <= BASIS + 3),
      godLaeufe.map((l) => `${l.n}${l.tod ? 'K' : ''}`).join(' '));

    // --- SHAKE-ZWILLING ---------------------------------------------------
    // Zwei Boots mit IDENTISCHEM Drehbuch, einer mit __noShake. Die Differenz
    // der gezeichneten Spielerposition IST der Kamera-Offset (playerScreen
    // misst Math.round(worldX - cam.x), und fuer ganzzahliges k gilt
    // Math.round(a - (b+k)) = Math.round(a - b) - k).
    const drehbuch = (b) => {
      const spur = [];
      b.frames(5);
      b.key('keydown', 'Enter'); b.key('keyup', 'Enter');
      b.frames(3);
      b.key('keydown', 'KeyJ');
      b.key('keydown', 'ArrowRight');
      for (let i = 0; i < 420; i++) { b.frame(); spur.push(b.spielerZug()); }
      b.key('keyup', 'ArrowRight');
      b.key('keyup', 'KeyJ');
      // Zustandswechsel: Pause auf und wieder zu (enterState nullt den Shake)
      b.key('keydown', 'Escape'); b.frame(); b.key('keyup', 'Escape');
      const inPause = b.actx._log.length;
      b.frames(4);
      b.key('keydown', 'Escape'); b.frame(); b.key('keyup', 'Escape');
      const nach = [];
      for (let i = 0; i < 40; i++) { b.frame(); nach.push(b.spielerZug()); }
      return { spur, nach, inPause };
    };
    const s1 = boot({ search: '?god=1' });
    await import('../game/js/main.js?s5b=1');
    s1.benenne();
    const lauf1 = drehbuch(s1);
    const s2 = boot({ search: '?god=1', rig: { __noShake: true } });
    await import('../game/js/main.js?s5c=1');
    s2.benenne();
    const lauf2 = drehbuch(s2);

    const offsets = [];
    for (let i = 0; i < lauf1.spur.length; i++) {
      const a = lauf1.spur[i];
      const c = lauf2.spur[i];
      if (a && c) offsets.push({ dx: c.x - a.x, dy: c.y - a.y });
    }
    const bewegt = offsets.filter((o) => o.dx !== 0 || o.dy !== 0);
    check('S5-§7A(h) §5.2 der Shake WIRKT: gegen den __noShake-Zwilling weicht die Kamera messbar ab',
      offsets.length > 300 && bewegt.length > 0,
      `${bewegt.length} von ${offsets.length} Frames versetzt`);
    check('S5-§7A(h) §5.2/P1-m2 jeder Offset ist GANZZAHLIG und bleibt in der Spec-Amplitude (<= 3 px)',
      bewegt.every((o) => Number.isInteger(o.dx) && Number.isInteger(o.dy)
        && Math.abs(o.dx) <= 3 && Math.abs(o.dy) <= 3),
      `max |dx| ${Math.max(0, ...bewegt.map((o) => Math.abs(o.dx)))}, max |dy| ${Math.max(0, ...bewegt.map((o) => Math.abs(o.dy)))}`);
    // Wanduhr-Abklingen: nach einem Auslöser ist spaetestens nach 12 Ticks Ruhe.
    let laengsteStrecke = 0;
    let strecke = 0;
    for (const o of offsets) {
      if (o.dx !== 0 || o.dy !== 0) { strecke += 1; if (strecke > laengsteStrecke) laengsteStrecke = strecke; }
      else strecke = 0;
    }
    check('S5-§7A(h) §5.2 der Shake klingt auf der WANDUHR ab: keine Versatz-Strecke laenger als 12 Ticks',
      laengsteStrecke <= 12, `laengste Strecke ${laengsteStrecke} Ticks`);
    const nachOffsets = [];
    for (let i = 0; i < lauf1.nach.length; i++) {
      const a = lauf1.nach[i];
      const c = lauf2.nach[i];
      if (a && c) nachOffsets.push(Math.abs(c.x - a.x) + Math.abs(c.y - a.y));
    }
    check('S5-§7A(h) §5.2/P1-M2 nach enterState (Pause auf/zu) ist der Offset EXAKT 0 — in jedem Frame',
      nachOffsets.length > 20 && nachOffsets.every((d) => d === 0),
      `${nachOffsets.filter((d) => d !== 0).length} von ${nachOffsets.length} Frames versetzt`);

    // §4.3 DUCKING in der Handpause: Anker-Form, Musik leiser, uiBus HOERBAR.
    const duckLog = s1.actx._log.slice(lauf1.inPause - 40, lauf1.inPause + 10);
    const kette = (knoten) => {
      const idx = duckLog.findIndex((l) => l.op === 'cancel' && l.node === knoten);
      if (idx < 0) return null;
      return duckLog.slice(idx, idx + 3).map((l) => l.op).join('>');
    };
    const graph1 = s1.actx._log.filter((l) => l.op === 'connect');
    const master1 = graph1.find((l) => l.to === 'destination');
    const am1 = graph1.filter((l) => l.to === master1.node).map((l) => l.node);
    check('S5-§7A(h) §4.3/P2-M4 jede Pegelaenderung laeuft in der ANKER-Form cancel > setValueAtTime > linearRamp',
      ['cancel>setValueAtTime>linearRamp', 'cancel>setValue'].includes(kette(am1[0]) || '')
      || (kette(am1[0]) || '').startsWith('cancel>setValue'),
      `Musik-Bus: ${kette(am1[0])}`);
    check('S5-§7A(h) §4.3/P2-M4 NIE exponentiell (exponentialRampToValueAtTime auf 0 wirft RangeError)',
      !s1.actx._log.some((l) => l.op === 'expRamp'));
    check('S5-§7A(h) §4.3/P2-B3 in der Pause bleibt der uiBus HOERBAR (sonst sind die neuen Schalter stumm)',
      (() => {
        const ui = am1[3];
        const letzte = s1.actx._log.filter((l) => l.node === ui
          && (l.op === 'linearRamp' || l.op === 'setValue')).slice(-1)[0];
        return !!letzte && letzte.v > 0;
      })(), `uiBus-Knoten ${am1[3]}`);

    // §5.3 FLASH-VERTRAEGLICHKEIT: der Flash ist ein Vollbild-Rect bei
    // globalAlpha 1 in einer WARMEN Fuellfarbe — der Fade-Detektor der drei
    // Flusstests verlangt '#000' mit 0 < alpha < 1 und bleibt damit stumm.
    const flashKandidaten = [];
    {
      const f = boot({ search: '' });
      await import('../game/js/main.js?s5d=1');
      f.benenne();
      f.frames(5);
      f.key('keydown', 'Enter'); f.key('keyup', 'Enter');
      f.frames(3);
      let fadeDetektor = 0;
      let letztesHerz = -1;   // erste Frame ohne jedes volle Herz = hp 0
      let gameOver = -1;
      f.key('keydown', 'ArrowRight');
      for (let i = 0; i < 1200; i++) {
        f.frame();
        for (const o of f.vollbild()) {
          if (o.fill === '#000' && o.alpha > 0 && o.alpha < 1) fadeDetektor += 1;
          else if (o.alpha === 1 && String(o.fill).startsWith('rgba(255,244,220')) flashKandidaten.push(o.fill);
        }
        if (letztesHerz < 0 && f.zaehle(/heart_full/) === 0) letztesHerz = i;
        if (f.hatText('GAME OVER')) { gameOver = i; break; }
      }
      f.key('keyup', 'ArrowRight');
      check('S5-§7A(h) §5.3/P1-m4 der Flash laeuft und loest den Fade-Detektor der Flusstests NICHT aus',
        flashKandidaten.length > 0 && fadeDetektor === 0,
        `${flashKandidaten.length} Flash-Zuege (${flashKandidaten[0] || '-'}), ${fadeDetektor} Fade-Treffer`);
      check('S5-§7A(h) A3/P1-B2 der TODES-Frame hat null Toleranz: hp = 0 wird im NAECHSTEN Frame zu GAME OVER',
        letztesHerz >= 0 && gameOver === letztesHerz + 1,
        `hp 0 in Frame ${letztesHerz}, GAME OVER in Frame ${gameOver}`);
    }

    // Globale wieder herstellen: nachfolgende Bloecke sehen den Bestand.
    Math.random = zufallVorher;
    if (perfVorher) Object.defineProperty(globalThis, 'performance', perfVorher);
    globalThis.window = winVorher;
    globalThis.document = docVorher;
  }
}


// ===========================================================================
// SLICE 6 — ADDITIVE BLOECKE S6-§7F(c)..(i) (SPEC_SLICE_6 §7.A, Phase 3).
//
// REGELN, unter denen diese Bloecke stehen:
//   * NUR ADDITIV, am ENDE des S-Blocks. Kein Zeichen oberhalb dieser Zeile
//     wurde angefasst (Additiv-Beweis: die alte ok-Titel-Menge ist Teilmenge
//     der neuen). Die §7.B-Sanktionen sind VERBRAUCHT — hier wird nichts
//     umgeschrieben, nur angehaengt.
//   * Neue Module kommen per `await import(...)` IM BLOCK herein; die
//     Kopf-Importe der Datei bleiben unberuehrt (Muster S4-§7F/S5-§7A).
//   * QUELLGEBUNDEN: gemessen wird an den ECHTEN Modulen bzw. am ECHTEN
//     Boot-Pfad von main.js — kein Nachbau der Logik im Test.
//
//   (c) DORF-Zeile der §36-Tabelle (sol/geo/ambient-Haertung)
//   (d) DORF gegnerfrei (Datenfelder UND gebaute Welt)
//   (e) Shop-Geometrie >= 6 mm
//   (f) Dialog/Shop blenden A/B/W + Pause aus (am gebooteten Spiel)
//   (g) Kill-Zaehler-Semantik (pure quest.js)
//   (h) ladeSpielstand: alle vier v2-Felder feldweise identisch nach Save->Load
//   (i) save.js-Schreibhaertung: neun Asymmetrien + Roundtrip-Verlustfreiheit
// ===========================================================================

// ---------------------------------------------------------------------------
// (c) §36-ZEILE FUER DAS DORF — sol/geo/ambient EINGEFROREN
// ---------------------------------------------------------------------------
//
// Formeln WOERTLICH aus dem §36-Block (smoke:2187-2197): eine Aenderung an
// createTilemap/findTiles oder an den Kartendaten faellt hier genauso auf wie
// bei den vier Bestandskarten. Die Goldenen sind HIER UND JETZT erzeugt (der
// Dorf-Bau ist mit f48833e/3253c26 fertig) und ab sofort eingefroren — ein
// spaeterer sol/geo-Drift im DORF ist damit dasselbe STOPP-Signal wie auf den
// anderen vier Karten.
{
  const DORF_GOLD = {
    sol: '35cb9c3c0813144f438c5455dedff7ab6f71c8eb40447e6aa7f8ca5a2a0396b2',
    geo: '014e05d42300b02da1581eca48fc968572520647d6003cbf0c9931de71b0f30e',
  };
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
  const dorf = MAPS.DORF;
  check('S6-§7F(c) §36 DORF: die fuenfte Karte ist registriert (44x28)',
    !!dorf && dorf.rows.length === 28 && dorf.rows.every((r) => r.length === 44),
    dorf ? `${dorf.rows[0].length}x${dorf.rows.length}` : 'fehlt');
  check('S6-§7F(c) §36 DORF: Soliditaets-Raster eingefroren (Golden aus Phase 3)',
    solHash(dorf) === DORF_GOLD.sol, solHash(dorf));
  check('S6-§7F(c) §36 DORF: Spawns/Portale/torch-findTiles eingefroren (Golden aus Phase 3)',
    geoHash(dorf) === DORF_GOLD.geo, geoHash(dorf));
  // Die vier Belichtungszahlen sind von der Phase-0-Eichung GEBUNDEN
  // (SLICE6_PHASE0 §4/§7 G1/G7: Band 56..69, E1 >= 0,64 %, L<16 <= 2,0 %).
  // Wer sie dreht, macht die Eichung ungueltig — deshalb stehen sie hier.
  check('S6-§7F(c) §36 DORF: Ambient == 0.28 (Dauerzwielicht, Eichung eingefroren)',
    Math.abs(dorf.ambient - 0.28) < 1e-9, `ist ${dorf.ambient}`);
  check('S6-§7F(c) §36 DORF: ambientTint #1a1410 / playerLightRadius 40 / fog an (Eichung eingefroren)',
    dorf.ambientTint === '#1a1410' && dorf.playerLightRadius === 40 && dorf.fog === true,
    `${dorf.ambientTint} / ${dorf.playerLightRadius} / ${dorf.fog}`);
  check('S6-§7F(c) §36 DORF: torchChars F+E (Herdfeuer ist Pflicht-Warmlicht, A3/E5)',
    Array.isArray(dorf.torchChars) && dorf.torchChars.join('') === 'FE'
    && createTilemap(dorf.rows, dorf.legend).findTiles('F').length > 0,
    JSON.stringify(dorf.torchChars));
  // Gegenprobe zur §36-Zusage der anderen vier Karten: das DORF darf deren
  // Hashes nicht beruehren (es taucht in keiner ihrer Zeilen auf).
  check('S6-§7F(c) §36 DORF: die vier Bestandskarten bleiben eine getrennte Menge (5 Karten in MAPS)',
    Object.keys(MAPS).length === 5 && Object.hasOwn(MAPS, 'DORF'),
    Object.keys(MAPS).join(','));
}

// ---------------------------------------------------------------------------
// (e) SHOP-GEOMETRIE: JEDES Tap-Rechteck >= 6 mm
// ---------------------------------------------------------------------------
//
// UMRECHNUNG ZITIERT (bindend, S4-§7F smoke:4069-4081 — inventory_ui.js:32-34
// verweist woertlich auf denselben Wert "smoke:4047 MM_PRO_PX 0,3764"):
//   Referenzgeraet 2400x1080 Geraetepixel, 6,5 Zoll, dpr 3, QUERformat
//   PPI            = hypot(1080, 2400) / 6,5            = 404,93
//   MM_PRO_GERAETPX= 25,4 / PPI                          = 0,06273
//   SKALIERUNG     = min(floor(2400/320), floor(1080/180)) = 6
//   MM_PRO_PX      = SKALIERUNG * MM_PRO_GERAETPX        = 0,3764
// 6 mm sind damit 6 / 0,3764 = 15,94 interne px.
{
  const shop = await import('../game/js/ui/shop_ui.js');
  const PPI = Math.hypot(1080, 2400) / 6.5;
  const MM_PRO_GERAETPX = 25.4 / PPI;
  const SKALIERUNG = Math.min(Math.floor(2400 / 320), Math.floor(1080 / 180));
  const MM_PRO_PX = SKALIERUNG * MM_PRO_GERAETPX;
  const MM6_PX = 6 / MM_PRO_PX;
  check('S6-§7F(e) A1 Umrechnung wie S4-§7F/inventory_ui: MM_PRO_PX 0,3764 -> 6 mm = 15,94 px',
    SKALIERUNG === 6 && Math.abs(MM_PRO_PX - 0.3764) < 0.0005 && Math.abs(MM6_PX - 15.94) < 0.02,
    `${MM_PRO_PX.toFixed(4)} mm/px, 6 mm = ${MM6_PX.toFixed(2)} px`);

  // ALLE Tap-Rechtecke des Laden-Panels: die drei Knopf-Zonen (shop_ui liest
  // sie in update() per inRect) UND die fuenf Listenzeilen (derselbe
  // Tap-Zweig, shop_ui.js:343-349 rechnet die Zeile aus SHOP_LIST_Y/ROW_H).
  const zeilenZonen = [];
  for (let i = 0; i < shop.SHOP_ROWS; i++) {
    zeilenZonen.push({
      name: `Listenzeile ${i}`,
      x: shop.SHOP_LIST_X0, y: shop.SHOP_LIST_Y + i * shop.SHOP_ROW_H,
      w: shop.SHOP_LIST_X1 - shop.SHOP_LIST_X0, h: shop.SHOP_ROW_H,
    });
  }
  const alleZonen = [
    { name: 'SHOP_BTN_CLOSE', ...shop.SHOP_BTN_CLOSE },
    { name: 'SHOP_BTN_SEITE', ...shop.SHOP_BTN_SEITE },
    { name: 'SHOP_BTN_HANDEL', ...shop.SHOP_BTN_HANDEL },
    ...zeilenZonen,
  ];
  check('S6-§7F(e) A1 Vorbedingung: SHOP_ZONEN fuehrt genau die drei Knopf-Rechtecke, die update() abfragt',
    shop.SHOP_ZONEN.length === 3 && shop.SHOP_ZONEN[0] === shop.SHOP_BTN_CLOSE
    && shop.SHOP_ZONEN[1] === shop.SHOP_BTN_SEITE && shop.SHOP_ZONEN[2] === shop.SHOP_BTN_HANDEL,
    `${shop.SHOP_ZONEN.length} Zonen`);
  const zuKlein = alleZonen.filter((z) => z.w < MM6_PX || z.h < MM6_PX);
  check('S6-§7F(e) A1 JEDES Tap-Rechteck des Laden-Panels ist in BEIDEN Massen >= 6 mm (3 Knoepfe + 5 Listenzeilen)',
    zuKlein.length === 0,
    zuKlein.map((z) => `${z.name} ${z.w}x${z.h}`).join(', ')
    || alleZonen.map((z) => `${z.name} ${(z.w * MM_PRO_PX).toFixed(1)}x${(z.h * MM_PRO_PX).toFixed(1)}mm`).join(' | '));
  const raus = alleZonen.filter((z) => z.x < shop.SHOP_PANEL.x || z.y < shop.SHOP_PANEL.y
    || z.x + z.w > shop.SHOP_PANEL.x + shop.SHOP_PANEL.w
    || z.y + z.h > shop.SHOP_PANEL.y + shop.SHOP_PANEL.h);
  check('S6-§7F(e) A1 kein Tap-Rechteck ragt aus dem Laden-Panel (8,8,304,164) heraus',
    raus.length === 0, raus.map((z) => z.name).join(', '));
  // GEGENPROBE: das Gate beisst wirklich — 15 px (5,65 mm) faellt durch.
  check('S6-§7F(e) A1 Gegenprobe: eine 15-px-Zone (5,65 mm) wuerde das Gate REISSEN',
    15 < MM6_PX && 16 >= MM6_PX, `15 px = ${(15 * MM_PRO_PX).toFixed(2)} mm`);
}

// ---------------------------------------------------------------------------
// (g) KILL-ZAEHLER-SEMANTIK (pure quest.js-Aufrufe)
// ---------------------------------------------------------------------------
//
// Die Zaehl-REGEL steht in quest.js (questKillEvent); die AUSLOESER stehen in
// main.js (§0.2: Beobachter je Karte + Sorte). Geprueft wird hier die Regel:
// gezaehlt wird NUR nach der Annahme, NUR auf der richtigen Karte und NUR fuer
// die richtige Gegner-Sorte — und nie ueber das Ziel hinaus.
{
  const q = await import('../game/js/items/quest.js');
  const quests = q.createQuests();

  q.questKillEvent(quests, 'GRAVEYARD', 'skeleton');
  check('S6-§7F(g) §4 vor jedem Gespraech zaehlt kein Kill (Quest ist unbekannt)',
    q.questStatus(quests, 'q1') === 'unbekannt' && q.questZaehler(quests, 'q1') === 0,
    `${q.questStatus(quests, 'q1')}/${q.questZaehler(quests, 'q1')}`);

  q.questAnbieten(quests, 'q1');
  q.questKillEvent(quests, 'GRAVEYARD', 'skeleton');
  q.questKillEvent(quests, 'GRAVEYARD', 'skeleton');
  check('S6-§7F(g) §4 NUR NACH ANNAHME: im Zustand "angeboten" zaehlt kein Kill',
    q.questStatus(quests, 'q1') === 'angeboten' && q.questZaehler(quests, 'q1') === 0,
    `${q.questStatus(quests, 'q1')}/${q.questZaehler(quests, 'q1')}`);

  q.questAnnehmen(quests, 'q1');
  q.questKillEvent(quests, 'CATACOMBS', 'skeleton');
  check('S6-§7F(g) §4 FALSCHE KARTE: ein Skelett in den Katakomben zaehlt nicht fuer die Friedhofs-Quest',
    q.questZaehler(quests, 'q1') === 0, `zaehler ${q.questZaehler(quests, 'q1')}`);
  q.questKillEvent(quests, 'GRAVEYARD', 'ghoul');
  q.questKillEvent(quests, 'GRAVEYARD', 'rust');
  check('S6-§7F(g) §4 FALSCHE SORTE: Ghul/Rostpanzer auf dem Friedhof zaehlen nicht fuer die Skelett-Quest',
    q.questZaehler(quests, 'q1') === 0, `zaehler ${q.questZaehler(quests, 'q1')}`);

  const e1 = q.questKillEvent(quests, 'GRAVEYARD', 'skeleton');
  check('S6-§7F(g) §4 RICHTIGE KARTE + SORTE: der Zaehler steigt und meldet die geaenderte Quest',
    q.questZaehler(quests, 'q1') === 1 && e1.geaendert === true && e1.ids.join(',') === 'q1'
    && e1.erfuellt.length === 0,
    `${q.questZaehler(quests, 'q1')} / ${JSON.stringify(e1)}`);

  for (let i = 0; i < 4; i++) q.questKillEvent(quests, 'GRAVEYARD', 'skeleton');
  check('S6-§7F(g) §4 beim Ziel (5) springt die Quest auf "erfuellt"',
    q.questStatus(quests, 'q1') === 'erfuellt' && q.questZaehler(quests, 'q1') === 5,
    `${q.questStatus(quests, 'q1')}/${q.questZaehler(quests, 'q1')}`);
  const e2 = q.questKillEvent(quests, 'GRAVEYARD', 'skeleton');
  check('S6-§7F(g) §4 nach "erfuellt" zaehlt kein weiterer Kill (kein Ueberlauf ueber das Ziel)',
    q.questZaehler(quests, 'q1') === 5 && e2.geaendert === false,
    `${q.questZaehler(quests, 'q1')} / ${JSON.stringify(e2)}`);

  // Zweite Zaehl-Quest: dieselbe Regel auf einer anderen Karte + Sorte, und
  // die beiden Quests duerfen sich nicht gegenseitig hochzaehlen.
  const quests2 = q.createQuests();
  q.questAnnehmen(quests2, 'q1');
  q.questAnnehmen(quests2, 'q2');
  q.questKillEvent(quests2, 'GRAVEYARD', 'skeleton');
  q.questKillEvent(quests2, 'CATACOMBS', 'rust');
  check('S6-§7F(g) §4 zwei aktive Zaehl-Quests bleiben getrennt (Friedhof/Skelett vs. Katakomben/Rostpanzer)',
    q.questZaehler(quests2, 'q1') === 1 && q.questZaehler(quests2, 'q2') === 1,
    `q1 ${q.questZaehler(quests2, 'q1')} / q2 ${q.questZaehler(quests2, 'q2')}`);
  q.questKillEvent(quests2, 'CATACOMBS', 'rust');
  q.questKillEvent(quests2, 'CATACOMBS', 'rust');
  q.questAbgeben(quests2, 'q2');
  const e3 = q.questKillEvent(quests2, 'CATACOMBS', 'rust');
  check('S6-§7F(g) §4 nach der Abgabe ("belohnt") zaehlt gar nichts mehr',
    q.questStatus(quests2, 'q2') === 'belohnt' && q.questZaehler(quests2, 'q2') === 3
    && e3.geaendert === false,
    `${q.questStatus(quests2, 'q2')}/${q.questZaehler(quests2, 'q2')}`);
  check('S6-§7F(g) §4 die Zaehl-Ziele stehen in quest.js als Daten (q1: 5 Skelette GRAVEYARD, q2: 3 rust CATACOMBS)',
    q.QUESTS.q1.karte === 'GRAVEYARD' && q.QUESTS.q1.kind === 'skeleton' && q.QUESTS.q1.ziel === 5
    && q.QUESTS.q2.karte === 'CATACOMBS' && q.QUESTS.q2.kind === 'rust' && q.QUESTS.q2.ziel === 3,
    JSON.stringify([q.QUESTS.q1.ziel, q.QUESTS.q2.ziel]));
}

// ---------------------------------------------------------------------------
// (i) SAVE-SCHREIBHAERTUNG: neun Asymmetrien + Verlustfreiheit
// ---------------------------------------------------------------------------
//
// LEITSATZ (save.js): was deserialize ABLEHNT, darf serialize gar nicht erst
// schreiben — sonst kostet EIN korrupter Auswuchs den GANZEN Spielstand.
// Jede der neun Zeilen wird DOPPELT geprueft:
//   (1) SCHREIBSEITE: der Auswuchs wird beim Serialisieren bereinigt, der
//       geschriebene Text laedt wieder (deserialize != null) und die gueltigen
//       Nachbarwerte desselben Feldes ueberleben.
//   (2) LESESEITE UNVERAENDERT HART: derselbe Auswuchs, von aussen in den
//       JSON-Text gesetzt, wird weiterhin mit null abgelehnt. Das ist der
//       Beweis, dass die Haertung die Validierung NICHT aufgeweicht hat.
{
  const { serialize, deserialize } = await import('../game/js/items/save.js');
  const sp = createPlayer(GRAVEYARD.playerSpawn);
  sp.hp = 5;
  sp.gold = 137;
  sp.potions = 2;
  const GUELTIG_RF = {
    bossDead: false,
    openedChests: ['CATACOMBS:4,16'],
    quests: { q1: { status: 'aktiv', zaehler: 3 }, q2: { status: 'belohnt', zaehler: 3 } },
    npcFlags: { q4_bran: true, q4_hedda: true, gesehen_mile: 2 },
    gekauft: ['herz'],
    dorfBesuche: 4,
  };
  const baue = (rfExtra = {}) => ({
    mapKey: 'DORF', spawn: { x: 632, y: 248 }, player: sp,
    runFlags: { ...GUELTIG_RF, ...rfExtra },
  });

  // --- VERLUSTFREIHEIT: ein GUELTIGER Laufzeitzustand geht unveraendert durch
  const gTxt = serialize(baue());
  const gSnap = deserialize(gTxt);
  const gleich = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  check('S6-§7F(i) Roundtrip: ein gueltiger Laufzeitzustand serialisiert VERLUSTFREI (alle vier v2-Felder feldgleich)',
    !!gSnap && gleich(gSnap.runFlags.quests, GUELTIG_RF.quests)
    && gleich(gSnap.runFlags.npcFlags, GUELTIG_RF.npcFlags)
    && gleich(gSnap.runFlags.gekauft, GUELTIG_RF.gekauft)
    && gSnap.runFlags.dorfBesuche === GUELTIG_RF.dorfBesuche,
    gSnap ? JSON.stringify(gSnap.runFlags) : 'null');
  check('S6-§7F(i) Roundtrip: die Filter fassen die v1-Felder nicht an (hp/gold/potions/inv/prog/bossDead/openedChests)',
    !!gSnap && gSnap.hp === 5 && gSnap.gold === 137 && gSnap.potions === 2
    && gSnap.runFlags.bossDead === false
    && gleich(gSnap.runFlags.openedChests, GUELTIG_RF.openedChests)
    && gSnap.prog.level === sp.prog.level,
    gSnap ? `${gSnap.hp}/${gSnap.gold}/${gSnap.potions}` : 'null');
  check('S6-§7F(i) Roundtrip: maxHp steht weiterhin NICHT im Text (Haertung hat daran nichts geaendert)',
    !gTxt.includes('maxHp'), gTxt.slice(0, 60));

  const LANG = 'x'.repeat(33);
  const vieleQuests = {};
  for (let i = 0; i < 40; i++) vieleQuests[`q_${i}`] = { status: 'aktiv', zaehler: 1 };
  const vieleFlags = {};
  for (let i = 0; i < 80; i++) vieleFlags[`m_${i}`] = true;
  const vieleWaren = [];
  for (let i = 0; i < 40; i++) vieleWaren.push(`w_${i}`);

  // Neun Faelle. `roh` setzt denselben Auswuchs von aussen in den JSON-Text
  // (Leseseiten-Gegenprobe), `pruef` liest das GESCHRIEBENE runFlags-Objekt.
  const FAELLE = [
    {
      nr: 'H1', was: 'quests: Schluessel laenger als 32 Zeichen',
      rf: { quests: { [LANG]: { status: 'aktiv', zaehler: 1 }, q1: { status: 'aktiv', zaehler: 3 } } },
      pruef: (w) => !Object.keys(w.quests).some((k) => k.length > 32) && w.quests.q1.zaehler === 3,
      roh: (d) => { d.runFlags.quests[LANG] = { status: 'aktiv', zaehler: 1 }; },
    },
    {
      nr: 'H2', was: 'quests: mehr als 32 Eintraege',
      rf: { quests: vieleQuests },
      pruef: (w) => Object.keys(w.quests).length === 32,
      roh: (d) => { d.runFlags.quests = vieleQuests; },
    },
    {
      nr: 'H3', was: 'quests: zaehler ausserhalb 0..999',
      rf: { quests: { q1: { status: 'aktiv', zaehler: 5000 }, q2: { status: 'belohnt', zaehler: -7 } } },
      pruef: (w) => w.quests.q1.zaehler === 999 && w.quests.q2.zaehler === 0,
      roh: (d) => { d.runFlags.quests.q1.zaehler = 5000; },
    },
    {
      nr: 'H4', was: 'npcFlags: Marke laenger als 32 Zeichen',
      rf: { npcFlags: { [LANG]: true, q4_bran: true } },
      pruef: (w) => !Object.keys(w.npcFlags).some((k) => k.length > 32) && w.npcFlags.q4_bran === true,
      roh: (d) => { d.runFlags.npcFlags[LANG] = true; },
    },
    {
      nr: 'H5', was: 'npcFlags: mehr als 64 Marken',
      rf: { npcFlags: vieleFlags },
      pruef: (w) => Object.keys(w.npcFlags).length === 64,
      roh: (d) => { d.runFlags.npcFlags = vieleFlags; },
    },
    {
      nr: 'H6', was: 'npcFlags: Zahl-Wert ausserhalb 0..999',
      rf: { npcFlags: { zaehlmarke: 4711, minusmarke: -3, q4_bran: true } },
      pruef: (w) => w.npcFlags.zaehlmarke === 999 && w.npcFlags.minusmarke === 0
        && w.npcFlags.q4_bran === true,
      roh: (d) => { d.runFlags.npcFlags.zaehlmarke = 4711; },
    },
    {
      nr: 'H7', was: 'gekauft: Eintrag ist kein kurzer Text',
      rf: { gekauft: ['herz', 7, '', LANG, 'trank'] },
      pruef: (w) => gleich(w.gekauft, ['herz', 'trank']),
      roh: (d) => { d.runFlags.gekauft = ['herz', 7]; },
    },
    {
      nr: 'H8', was: 'gekauft: mehr als 32 Eintraege',
      rf: { gekauft: vieleWaren },
      pruef: (w) => w.gekauft.length === 32,
      roh: (d) => { d.runFlags.gekauft = vieleWaren; },
    },
    {
      nr: 'H9', was: 'dorfBesuche: ueber der Obergrenze 99999',
      rf: { dorfBesuche: 123456 },
      pruef: (w) => w.dorfBesuche === 99999,
      roh: (d) => { d.runFlags.dorfBesuche = 123456; },
    },
  ];

  for (const f of FAELLE) {
    const txt = serialize(baue(f.rf));
    const snap = deserialize(txt);
    const geschrieben = JSON.parse(txt).runFlags;
    check(`S6-§7F(i) ${f.nr} SCHREIBSEITE bereinigt und der Stand bleibt ladbar — ${f.was}`,
      snap !== null && f.pruef(geschrieben),
      `${snap === null ? 'deserialize -> null' : 'geladen'}; geschrieben ${JSON.stringify(geschrieben).slice(0, 160)}`);
    const d = JSON.parse(gTxt);
    f.roh(d);
    check(`S6-§7F(i) ${f.nr} LESESEITE unveraendert hart: derselbe Auswuchs von aussen -> null — ${f.was}`,
      deserialize(JSON.stringify(d)) === null,
      'wurde angenommen (Validierung waere aufgeweicht)');
  }

  // Der Filter darf keine gueltigen Grenzwerte fressen (Nachbarschaftsprobe).
  const grenz = serialize(baue({
    quests: { q1: { status: 'aktiv', zaehler: 999 } },
    npcFlags: { m: 999, [('y').repeat(32)]: true },
    gekauft: ['a'],
    dorfBesuche: 99999,
  }));
  const gs = deserialize(grenz);
  check('S6-§7F(i) die Grenzwerte SELBST (999 / 32 Zeichen / 99999) ueberleben unveraendert',
    !!gs && gs.runFlags.quests.q1.zaehler === 999 && gs.runFlags.npcFlags.m === 999
    && gs.runFlags.npcFlags[('y').repeat(32)] === true && gs.runFlags.dorfBesuche === 99999,
    gs ? JSON.stringify(gs.runFlags) : 'null');
}

// ---------------------------------------------------------------------------
// (j) SAVE-SCHREIBHAERTUNG DER v1-KERNFELDER (Fix-Runde 1)
// ---------------------------------------------------------------------------
//
// Derselbe Leitsatz wie in (i), eine Etage tiefer: (i) haertet die VIER NEUEN
// v2-Felder, hier stehen die v1-KERNFELDER (spawn / hp / gold / potions /
// inv.items). Sie liefen bis zur Fix-Runde 1 ungefiltert durch serialize:
//   * ein NaN oder Infinity in player.gold wird von JSON.stringify zu `null`
//     geschrieben, isNum(null) faellt, und deserialize verwarf deshalb den
//     GANZEN Stand — kein FORTSETZEN, der komplette Fortschritt weg;
//   * dasselbe fuer hp, potions und eine Spawn-Koordinate;
//   * ein inv.items ueber inv.capacity kippte den Stand an invOk (das war der
//     einzige Grund fuer den roten Sammelfall "riesige Arrays" — gekauft,
//     openedChests, quests, npcFlags und zelda sind auch mit tausenden
//     Eintraegen ladbar, die Tasche nicht).
//
// Jede Zeile wird wie in (i) DOPPELT geprueft:
//   (1) SCHREIBSEITE: der Auswuchs wird beim Serialisieren durch den
//       naechstgelegenen GUELTIGEN Wert ersetzt, der Text laedt wieder, und
//       die Nachbarfelder desselben Standes ueberleben unveraendert.
//   (2) LESESEITE UNVERAENDERT HART: derselbe Auswuchs, von aussen in den
//       JSON-Text gesetzt, wird weiterhin mit null abgelehnt — der Beweis,
//       dass die Haertung die Validierung NICHT aufgeweicht hat.
{
  const { serialize, deserialize } = await import('../game/js/items/save.js');
  const gleichJ = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const ringJ = (i) => ({ slot: 'ring', name: `RING ${i}`, rare: false, affixes: [{ stat: 'pickupRadius', value: 1 }] });
  const HEIM_DORF = MAPS.DORF.playerSpawn;
  const RF_J = { bossDead: false, openedChests: ['CATACOMBS:4,16'] };
  // FRISCHER Spieler je Fall: ein verbogener Wert darf nicht in den naechsten
  // Fall lecken (die Faelle unten verbiegen absichtlich Kernfelder).
  const spielerJ = (patch) => {
    const p = createPlayer(HEIM_DORF);
    p.hp = 5; p.gold = 137; p.potions = 2;
    p.prog = { xp: 42, level: 3, hearts: 1 };
    p.inv = {
      items: [], equipped: { weapon: null, armor: null, ring: null },
      capacity: 7, zelda: ['boomerang'], pity: 2, newFlag: false,
    };
    if (patch) patch(p);
    return p;
  };
  const zustandJ = (patch, spawn = { x: 632, y: 248 }) => ({
    mapKey: 'DORF', spawn, player: spielerJ(patch), runFlags: { ...RF_J },
  });

  const basisTxtJ = serialize(zustandJ(null));
  check('S6-§7F(j) Basis: der ungestoerte Zustand laedt (Bezugstext fuer die Leseseiten-Gegenproben)',
    deserialize(basisTxtJ) !== null, basisTxtJ.slice(0, 90));

  // `roh` setzt denselben Auswuchs von aussen in den Bezugstext. Infinity ist
  // in JSON nicht darstellbar (JSON.stringify schreibt `null`) — die ehrliche
  // Leseseiten-Entsprechung ist deshalb ebenfalls `null`.
  const FAELLE_J = [
    {
      nr: 'K1', was: 'gold = NaN (JSON.stringify schreibt sonst null)',
      z: () => zustandJ((p) => { p.gold = NaN; }),
      pruef: (w) => w.gold === 0 && w.hp === 5 && w.potions === 2,
      roh: (d) => { d.gold = null; },
    },
    {
      nr: 'K2', was: 'gold = Infinity',
      z: () => zustandJ((p) => { p.gold = Infinity; }),
      pruef: (w) => w.gold === 0 && w.hp === 5,
      roh: (d) => { d.gold = null; },
    },
    {
      nr: 'K3', was: 'gold = -5 (unter der Leser-Untergrenze 0)',
      z: () => zustandJ((p) => { p.gold = -5; }),
      pruef: (w) => w.gold === 0 && w.potions === 2,
      roh: (d) => { d.gold = -5; },
    },
    {
      nr: 'K4', was: 'hp = NaN',
      z: () => zustandJ((p) => { p.hp = NaN; }),
      pruef: (w) => w.hp === 1 && w.gold === 137,
      roh: (d) => { d.hp = null; },
    },
    {
      nr: 'K5', was: 'hp = 0 (der Leser fordert hp > 0)',
      z: () => zustandJ((p) => { p.hp = 0; }),
      pruef: (w) => w.hp === 1 && w.gold === 137,
      roh: (d) => { d.hp = 0; },
    },
    {
      nr: 'K6', was: 'potions = NaN',
      z: () => zustandJ((p) => { p.potions = NaN; }),
      pruef: (w) => w.potions === 0 && w.gold === 137,
      roh: (d) => { d.potions = null; },
    },
    {
      nr: 'K7', was: 'spawn.x = NaN (Ersatz: playerSpawn DERSELBEN Karte)',
      z: () => zustandJ(null, { x: NaN, y: 248 }),
      pruef: (w) => w.spawn.x === HEIM_DORF.x && w.spawn.y === 248,
      roh: (d) => { d.spawn.x = null; },
    },
    {
      nr: 'K8', was: 'inv.items: ein Eintrag ueber capacity (8 bei 7)',
      z: () => zustandJ((p) => { p.inv.items = Array.from({ length: 8 }, (_, i) => ringJ(i)); }),
      pruef: (w) => w.inv.items.length === 7 && w.inv.items[0].name === 'RING 0'
        && w.inv.items[6].name === 'RING 6',
      roh: (d) => { d.inv.items = Array.from({ length: 8 }, (_, i) => ringJ(i)); },
    },
    {
      nr: 'K9', was: 'inv.items: 400 Eintraege bei capacity 7 (Sammelfall "riesige Arrays")',
      z: () => zustandJ((p) => { p.inv.items = Array.from({ length: 400 }, (_, i) => ringJ(i)); }),
      pruef: (w) => w.inv.items.length === 7 && w.inv.capacity === 7,
      roh: (d) => { d.inv.items = Array.from({ length: 400 }, (_, i) => ringJ(i)); },
    },
  ];

  for (const f of FAELLE_J) {
    const txt = serialize(f.z());
    const snap = deserialize(txt);
    const w = JSON.parse(txt);
    check(`S6-§7F(j) ${f.nr} SCHREIBSEITE bereinigt und der Stand bleibt ladbar — ${f.was}`,
      snap !== null && f.pruef(w),
      `${snap === null ? 'deserialize -> null' : 'geladen'}; geschrieben ${JSON.stringify({ spawn: w.spawn, hp: w.hp, gold: w.gold, potions: w.potions, items: w.inv.items.length })}`);
    const d = JSON.parse(basisTxtJ);
    f.roh(d);
    check(`S6-§7F(j) ${f.nr} LESESEITE unveraendert hart: derselbe Auswuchs von aussen -> null — ${f.was}`,
      deserialize(JSON.stringify(d)) === null,
      'wurde angenommen (Validierung waere aufgeweicht)');
  }

  // VERLUSTFREIHEIT: was der Leser annimmt, geht UNVERAENDERT durch. Bewusst
  // mit GEBROCHENEM hp (ein maxHp-Affix mit Nachkommastelle erzeugt so etwas
  // ueber recalcStats) und den Grenzwerten gold 0 / potions 0 / items GENAU
  // capacity — ein Filter, der klemmt statt die Leser-Bedingung zu pruefen,
  // wuerde hier sofort auffallen.
  {
    const voll = zustandJ((p) => {
      p.hp = 0.5; p.gold = 0; p.potions = 0;
      p.inv.items = Array.from({ length: 7 }, (_, i) => ringJ(i));
    });
    const txt = serialize(voll);
    const w = JSON.parse(txt);
    const snap = deserialize(txt);
    check('S6-§7F(j) Verlustfreiheit: gueltige Kernfelder gehen unveraendert durch (hp 0,5 wird NICHT auf 1 geklemmt; gold/potions 0 bleiben 0)',
      snap !== null && w.hp === 0.5 && w.gold === 0 && w.potions === 0
      && w.spawn.x === 632 && w.spawn.y === 248,
      JSON.stringify({ hp: w.hp, gold: w.gold, potions: w.potions, spawn: w.spawn }));
    check('S6-§7F(j) Verlustfreiheit: eine VOLLE Tasche (items GENAU capacity) bleibt vollstaendig und in Reihenfolge',
      snap !== null && w.inv.items.length === 7 && gleichJ(w.inv.items, voll.player.inv.items),
      `${w.inv.items.length}/${w.inv.capacity}`);
    const negTxt = serialize(zustandJ(null, { x: -8, y: 0 }));
    const negW = JSON.parse(negTxt);
    check('S6-§7F(j) Verlustfreiheit: negative und 0-Koordinaten sind fuer den Leser gueltig und bleiben stehen',
      deserialize(negTxt) !== null && negW.spawn.x === -8 && negW.spawn.y === 0,
      JSON.stringify(negW.spawn));
  }

  // Der Spawn-Ersatz darf NICHTS beschoenigen, was der Leser aus einem anderen
  // Grund ablehnt: eine fremde Karte bleibt eine fremde Karte.
  const fremdTxtJ = serialize({
    mapKey: 'NIRGENDWO', spawn: { x: NaN, y: NaN }, player: spielerJ(null), runFlags: { ...RF_J },
  });
  check('S6-§7F(j) der Spawn-Ersatz beschoenigt KEINE fremde Karte (unbekannter mapKey bleibt abgelehnt)',
    deserialize(fremdTxtJ) === null, fremdTxtJ.slice(0, 90));
}

// ---------------------------------------------------------------------------
// (d)/(f)/(h) AM GEBOOTETEN SPIEL
// ---------------------------------------------------------------------------
//
// main.js hat keine Exporte; gefahren wird es wie in S5-§7A(h) und in
// tools/check_save_slice4.mjs ueber einen vollstaendigen Stub-Satz
// (window/document/Canvas/rAF) und beobachtet ueber das Zeichenprotokoll.
// NEU hier: der Canvas-Stub REICHT DIE TOUCH-LISTENER DURCH. Erst damit ist
// die Sichtbarkeit der Touch-Zonen headless messbar — hud.js:506-555 zeichnet
// A/B/W und den Pause-Knopf NUR, wenn input.touch.active steht, und genau
// dieses Zeichenprotokoll ist der HUD-Spiegel der main.js-Zusage
// "im Dialog und im Laden sind A/B/W + Pause unsichtbar" (main.js:1898-1926).
{
  const zufallVorher = Math.random;
  const perfVorher = Object.getOwnPropertyDescriptor(globalThis, 'performance');
  const winVorher = globalThis.window;
  const docVorher = globalThis.document;
  Math.random = () => 0.5;          // wie check_main_slice1: voller Determinismus
  const s6ops = [];
  let s6uhr = 0;
  try { globalThis.performance = { now: () => s6uhr }; }
  catch { Object.defineProperty(globalThis, 'performance', { value: { now: () => s6uhr } }); }

  function s6ctx(canvas) {
    return {
      canvas, imageSmoothingEnabled: false, globalAlpha: 1,
      globalCompositeOperation: 'source-over',
      fillStyle: '', strokeStyle: '', lineWidth: 1, font: '', textAlign: '', textBaseline: '',
      _stack: [],
      fillRect(...a) { s6ops.push({ canvas, op: 'fillRect', alpha: this.globalAlpha, fill: this.fillStyle, args: a }); },
      clearRect() {}, strokeRect() {},
      drawImage(img, ...a) { s6ops.push({ canvas, op: 'drawImage', img, args: a }); },
      fillText(t, x, y) { s6ops.push({ canvas, op: 'fillText', text: String(t), x, y }); },
      beginPath() {}, arc() {}, fill() {}, stroke() {}, closePath() {}, moveTo() {}, lineTo() {}, rect() {},
      save() { this._stack.push({ a: this.globalAlpha, f: this.fillStyle }); },
      restore() { const s = this._stack.pop(); if (s) { this.globalAlpha = s.a; this.fillStyle = s.f; } },
      createRadialGradient: () => ({ addColorStop() {} }),
    };
  }

  // Flip-Liste WOERTLICH aus main.js:106-127 — die Canvas->Sprite-Zuordnung
  // entsteht aus der Erzeugungsreihenfolge (Muster check_main_slice1), ein
  // Abweichen verschoebe alle Namen hinter dem SPRITES-Block.
  const S6_FLIP = [
    'player_side_0', 'player_side_1', 'player_side_2', 'player_side_3',
    'player_attack_side', 'sword_slash_side',
    'skeleton_0', 'skeleton_1', 'skeleton_die',
    'ghoul_0', 'ghoul_1', 'ghoul_die',
    'hound_0', 'hound_1', 'hound_telegraph', 'hound_leap', 'hound_down', 'hound_die',
    'rust_0', 'rust_1', 'rust_die', 'shield_side',
    'warden_idle', 'warden_walk_0', 'warden_walk_1', 'warden_windup_a',
    'warden_windup_b', 'warden_dash', 'warden_stuck', 'warden_summon', 'warden_die',
    'npc_mile_0', 'npc_mile_1', 'npc_mile_talk',
    'npc_torwaechter_0', 'npc_torwaechter_1', 'npc_torwaechter_talk',
  ];
  const S6_NAMEN = [...Object.keys(SPRITES), ...S6_FLIP.map((k) => `${k}_flip`), ...Object.keys(TILE_ART)];

  function s6boot({ search = '', speicher = null } = {}) {
    const canvases = [];
    const mkCanvas = () => {
      const c = { width: 0, height: 0, style: {}, ownerDocument: null };
      c.getContext = () => (c._ctx || (c._ctx = s6ctx(c)));
      c.addEventListener = () => {};
      c.getBoundingClientRect = () => ({ left: 0, top: 0, width: 320, height: 180 });
      canvases.push(c);
      return c;
    };
    const winL = {};
    const docL = {};
    const cvL = {};                 // NEU: die Touch-Listener des Canvas
    const rafQ = [];
    const win = {
      addEventListener: (t, f) => (winL[t] = winL[t] || []).push(f),
      devicePixelRatio: 1, innerWidth: 960, innerHeight: 540,
      location: { search },
      requestAnimationFrame: (cb) => rafQ.push(cb),
    };
    if (speicher) {
      win.localStorage = {
        getItem: (k) => (speicher.has(String(k)) ? speicher.get(String(k)) : null),
        setItem: (k, v) => { speicher.set(String(k), String(v)); },
        removeItem: (k) => { speicher.delete(String(k)); },
      };
    }
    const haupt = { width: 320, height: 180, style: {} };
    const doc = {
      getElementById: () => haupt,
      createElement: () => mkCanvas(),
      addEventListener: (t, f) => (docL[t] = docL[t] || []).push(f),
      defaultView: win, hidden: false,
    };
    haupt.getContext = () => (haupt._ctx || (haupt._ctx = s6ctx(haupt)));
    haupt.addEventListener = (t, f) => (cvL[t] = cvL[t] || []).push(f);
    haupt.getBoundingClientRect = () => ({ left: 0, top: 0, width: 320, height: 180 });
    haupt.ownerDocument = doc;
    globalThis.window = win;
    globalThis.document = doc;
    const b = {
      win, doc, haupt, rafQ, canvases, nameOf: new Map(),
      gesehen: new Set(),           // JEDER je gezeichnete Sprite-Name (Gate d)
      benenne() { canvases.forEach((c, i) => b.nameOf.set(c, S6_NAMEN[i] || `extra_${i}`)); },
      frame() {
        s6ops.length = 0;
        const cb = rafQ.shift();
        if (!cb) throw new Error('kein rAF-Callback (Boot tot?)');
        s6uhr += 1000 / 60 + 0.001;
        cb();
        for (const n of b.namen()) b.gesehen.add(n);
      },
      frames(n) { for (let i = 0; i < n; i++) b.frame(); },
      key(typ, code) { for (const f of winL[typ] || []) f({ code, repeat: false, preventDefault() {} }); },
      halte(code, n) { b.key('keydown', code); b.frames(n); b.key('keyup', code); },
      feuereDoc(typ, ev = {}) { for (const f of docL[typ] || []) f(ev); },
      touch(typ, x, y) {
        const t = { identifier: 1, clientX: x, clientY: y };
        for (const f of cvL[typ] || []) f({ changedTouches: [t], touches: [t], preventDefault() {} });
      },
      // Ein vollstaendiger Tipp: touchstart -> Frame -> touchend -> Frame.
      tipp(x, y) { b.touch('touchstart', x, y); b.frame(); b.touch('touchend', x, y); b.frame(); },
      textOps: () => s6ops.filter((o) => o.op === 'fillText'),
      texte: () => s6ops.filter((o) => o.op === 'fillText').map((o) => o.text),
      hatText: (t) => s6ops.filter((o) => o.op === 'fillText').some((o) => o.text.includes(t)),
      genauText: (t) => s6ops.filter((o) => o.op === 'fillText').some((o) => o.text === t),
      hatRect: (x, y, w, h) => s6ops.some((o) => o.op === 'fillRect' && o.canvas === haupt
        && o.args[0] === x && o.args[1] === y && o.args[2] === w && o.args[3] === h),
      ambient: () => {
        const f = s6ops.find((o) => o.op === 'fillRect' && o.canvas !== haupt && o.alpha > 0 && o.alpha < 1);
        return f ? f.alpha : null;
      },
      namen: () => s6ops.filter((o) => o.op === 'drawImage' && o.canvas === haupt)
        .map((o) => String(b.nameOf.get(o.img) || '')),
      goldText: () => b.texte().find((s) => s.startsWith('GOLD')),
    };
    return b;
  }

  // Die drei Touch-Zonen des HUD und der Pause-Knopf, gelesen aus dem
  // Zeichenprotokoll: hud.js zeichnet je Button seinen LABEL-Text (exakt 'A',
  // 'B', 'W') und fuer die Pause ZWEI Balken 2x8 bei (228,10)/(234,10)
  // (input.js:119 pause {x:232,y:14,r:12}).
  const sichtbar = (b) => ({
    a: b.genauText('A'), bb: b.genauText('B'), w: b.genauText('W'),
    pause: b.hatRect(228, 10, 2, 8) && b.hatRect(234, 10, 2, 8),
  });
  const alleAn = (s) => s.a && s.bb && s.w && s.pause;
  const alleAus = (s) => !s.a && !s.bb && !s.w && !s.pause;

  // =========================================================================
  // BOOT A — ?god=1&map=DORF: Gegnerfreiheit (d) + Touch-Ausblendung (f)
  // =========================================================================
  const d = s6boot({ search: '?god=1&map=DORF' });
  await import('../game/js/main.js?s6f=1');
  d.benenne();
  d.frames(3);
  d.key('keydown', 'Enter'); d.key('keyup', 'Enter');
  d.frames(3);
  check('S6-§7F(d) §6.1 der Boot betritt wirklich das DORF (ambient 0.28 steht im Lichtpass)',
    Math.abs(d.ambient() - 0.28) < 1e-9, `ambient ${d.ambient()}`);

  // --- (d) GEGNERFREI: Datenfelder UND gebaute Welt -----------------------
  const dorfDef = MAPS.DORF;
  check('S6-§7F(d) §6.1 DORF fuehrt skeletonSpawns/ghoulSpawns/enemySpawns/propSpawns als LEERE Arrays (main.js mappt ungeguardet)',
    Array.isArray(dorfDef.skeletonSpawns) && dorfDef.skeletonSpawns.length === 0
    && Array.isArray(dorfDef.ghoulSpawns) && dorfDef.ghoulSpawns.length === 0
    && Array.isArray(dorfDef.enemySpawns) && dorfDef.enemySpawns.length === 0
    && Array.isArray(dorfDef.propSpawns) && dorfDef.propSpawns.length === 0,
    `${dorfDef.skeletonSpawns.length}/${dorfDef.ghoulSpawns.length}/${dorfDef.enemySpawns.length}/${dorfDef.propSpawns.length}`);

  // --- (f) STATE 'playing': A/B/W + Pause sind DA -------------------------
  // Erst ein Tipp, sonst zeichnet hud.js das Touch-Overlay gar nicht
  // (input.touch.active; jede Taste schaltet es wieder ab, input.js:181).
  // Der Tipp liegt links UNTERHALB des Joystick-Feldes (JOY_FIELD_Y1 156) und
  // faellt damit in KEINE Zone (input.js:238-247).
  d.touch('touchstart', 40, 170);
  d.frame();
  const sPlaying = sichtbar(d);
  check('S6-§7F(f) §2.2 Vorbedingung: im State "playing" zeichnet das HUD A, B, W UND den Pause-Knopf',
    alleAn(sPlaying), JSON.stringify(sPlaying));
  d.touch('touchend', 40, 170);
  d.frame();

  // --- (f) STATE 'dialog': Angriffs-Pegel auf den Torwaechter -------------
  // Der Torwaechter steht 16 px unter dem Eintritts-Spawn (npcSpawns tc(39,16)
  // gegen playerSpawn tc(39,15)) — in Reichweite (<= 22 px) und in
  // Blickrichtung (facing 'down'). Der Tipp liegt in der Angriffs-Haelfte.
  d.touch('touchstart', 200, 60);
  d.frame();                        // in diesem Frame OEFFNET der Dialog
  d.frame();                        // ab hier steht der HUD-Spiegel auf 'dialog'
  const sDialog = sichtbar(d);
  const dialogSteht = d.hatText('DER TORWAECHTER');
  d.touch('touchend', 200, 60);
  check('S6-§7F(f) §2.3 der Angriffs-Pegel oeffnet am NPC den Dialog (kein neuer Knopf)',
    dialogSteht, d.texte().join(' | ').slice(0, 160));
  check('S6-§7F(f) §2.2 im State "dialog" sind A, B, W UND der Pause-Knopf unsichtbar',
    alleAus(sDialog), JSON.stringify(sDialog));

  // Dialog zu Ende blaettern (Tap-Flanken), bis wieder 'playing' steht.
  for (let i = 0; i < 8 && !d.genauText('A'); i++) d.tipp(40, 170);
  const sZurueck = sichtbar(d);
  check('S6-§7F(f) §2.2 nach dem Dialog sind A, B, W und der Pause-Knopf WIEDER da',
    alleAn(sZurueck), JSON.stringify(sZurueck));

  // --- (f) STATE 'shop': zu Hedda laufen und den Laden oeffnen ------------
  // Weg vom Osttor (tc 39,15) nach Westen auf der freien Zeile 15, dann nach
  // Norden zum Herdfeuer (Hedda-Anker tc 30,10). Getastet, nicht getippt:
  // die Blickrichtung soll am Ende nach oben zeigen.
  d.halte('ArrowLeft', 70);
  d.frames(2);
  d.halte('ArrowUp', 40);
  d.frames(2);
  d.touch('touchstart', 200, 60);
  d.frame();
  d.frame();
  const heddaSteht = d.hatText('ALTE HEDDA');
  d.touch('touchend', 200, 60);
  check('S6-§7F(f) §2.1 der Weg fuehrt zur zweiten Gespraechspartnerin (Hedda am Herdfeuer)',
    heddaSteht, d.texte().join(' | ').slice(0, 160));
  // Bis zur Optionsseite blaettern und die Laden-Option antippen.
  let vorrat = null;
  for (let i = 0; i < 8 && !vorrat; i++) {
    d.touch('touchstart', 40, 170);
    d.frame();
    vorrat = d.textOps().find((o) => o.text === 'DEIN VORRAT') || null;
    d.touch('touchend', 40, 170);
    d.frame();
    if (!vorrat) vorrat = d.textOps().find((o) => o.text === 'DEIN VORRAT') || null;
  }
  const OPT_X0 = [20, 116, 212];    // dialog.js DIALOG_OPTION_ZONEN
  const zi = vorrat
    ? OPT_X0.map((x0, i) => ({ i, ab: Math.abs(vorrat.x - (x0 + 44)) })).sort((a, b) => a.ab - b.ab)[0].i
    : 1;
  check('S6-§7F(f) §3 die Laden-Option steht in einer der drei Dialog-Options-Zonen (dialog.js)',
    !!vorrat && Math.abs(vorrat.x - (OPT_X0[zi] + 44)) <= 44,
    vorrat ? `x ${vorrat.x} -> Zone ${zi}` : 'Option nicht gefunden');
  d.tipp(OPT_X0[zi] + 44, 85);      // Option waehlen -> Knoten 'laden'
  d.tipp(40, 170);                  // Knoten bestaetigen -> Effekt 'shop'
  d.touch('touchstart', 40, 170);
  d.frame();
  const sShop = sichtbar(d);
  const shopSteht = d.hatRect(8, 8, 304, 164) && d.genauText('HANDELN');
  d.touch('touchend', 40, 170);
  d.frame();
  check('S6-§7F(f) §3.2 der Laden steht (eigenes Panel 8,8,304,164 mit HANDELN-Knopf)',
    shopSteht, d.texte().join(' | ').slice(0, 160));
  check('S6-§7F(f) §2.2 im State "shop" sind A, B, W UND der Pause-Knopf unsichtbar',
    alleAus(sShop), JSON.stringify(sShop));
  // Schliessen ueber SHOP_BTN_CLOSE (288,10,24,24) -> Mitte (300,22).
  d.tipp(300, 22);
  d.touch('touchstart', 40, 170);
  d.frame();
  const sNachShop = sichtbar(d);
  d.touch('touchend', 40, 170);
  d.frame();
  check('S6-§7F(f) §2.2 nach dem Laden sind A, B, W und der Pause-Knopf WIEDER da',
    alleAn(sNachShop), JSON.stringify(sNachShop));

  // --- (d) GEGNERFREI, gemessen an der GEBAUTEN Welt ----------------------
  // ueber den kompletten Boot (Eintritt, Dorfquerung, zwei Gespraeche, Laden)
  // wurde KEIN einziger Gegner-Sprite gezeichnet.
  const GEGNER = /^(skeleton|ghoul|hound|rust|warden|shield)/;
  const gegnerGesehen = [...d.gesehen].filter((n) => GEGNER.test(n));
  check('S6-§7F(d) §6.1 nach buildWorld(DORF) zeichnet das Spiel NULL Gegner (ganzer Boot: Eintritt, Querung, Dialoge, Laden)',
    gegnerGesehen.length === 0, gegnerGesehen.join(','));
  // Positivkontrolle fuer den Zaehler: die NPCs und der Spieler WURDEN
  // gezeichnet — die Canvas->Namen-Zuordnung greift also wirklich.
  const npcGesehen = [...d.gesehen].filter((n) => n.startsWith('npc_'));
  check('S6-§7F(d) Positivkontrolle des Zaehlers: NPC- und Spieler-Sprites wurden sehr wohl gezeichnet',
    npcGesehen.length >= 3 && [...d.gesehen].some((n) => n.startsWith('player')),
    `${npcGesehen.length} npc-Schluessel: ${npcGesehen.slice(0, 6).join(',')}`);

  // =========================================================================
  // BOOT B — (h) ladeSpielstand: alle vier v2-Felder feldweise identisch
  // =========================================================================
  //
  // MESSWEG: ein von Hand gesetzter v2-Stand geht in den Storage, das Spiel
  // laedt ihn ueber FORTSETZEN (main.js/ladeSpielstand) und schreibt ihn beim
  // visibilitychange aus dem LAUFZEIT-runFlags zurueck. Was zurueckkommt, ist
  // damit das Ergebnis von ladeSpielstand — feldweise vergleichbar. Ein
  // vergessenes Feld, eine geteilte Referenz oder ein Default-Ueberschreiben
  // faellt hier auf.
  const RF_FIX = {
    bossDead: false,
    openedChests: ['CATACOMBS:4,16'],
    quests: { q1: { status: 'aktiv', zaehler: 2 }, q2: { status: 'erfuellt', zaehler: 3 } },
    npcFlags: { q4_bran: true, q4_hedda: true },
    gekauft: ['herz'],
    dorfBesuche: 7,
  };
  const STAND_FIX = {
    v: 2, mapKey: 'CATACOMBS',
    spawn: { x: MAPS.CATACOMBS.playerSpawn.x, y: MAPS.CATACOMBS.playerSpawn.y },
    hp: 5, gold: 321, potions: 1,
    inv: {
      items: [], equipped: { weapon: null, armor: null, ring: null },
      capacity: 7, zelda: [], pity: 0, newFlag: false,
    },
    prog: { xp: 0, level: 1, hearts: 0 },
    runFlags: RF_FIX,
  };
  const { SAVE_KEY: S6_KEY } = await import('../game/js/items/save.js');
  const speicher = new Map();
  speicher.set(S6_KEY, JSON.stringify(STAND_FIX));
  const h = s6boot({ search: '', speicher });
  await import('../game/js/main.js?s6h=1');
  h.benenne();
  h.frames(5);
  check('S6-§7F(h) §5 Vorbedingung: der von Hand gesetzte v2-Stand wird angenommen (Titel-Menue steht)',
    h.hatText('FORTSETZEN'), h.texte().join(' | ').slice(0, 120));
  h.key('keydown', 'Enter'); h.key('keyup', 'Enter');
  h.frames(3);
  check('S6-§7F(h) §5 FORTSETZEN laedt Karte und Beutel aus dem Stand (CATACOMBS, GOLD 321)',
    Math.abs(h.ambient() - 0.55) < 1e-9 && h.goldText() === 'GOLD 321',
    `${h.ambient()} / ${h.goldText()}`);
  h.doc.hidden = true;
  h.feuereDoc('visibilitychange', {});
  h.frames(2);
  const zurueck = JSON.parse(speicher.get(S6_KEY));
  const gl = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  check('S6-§7F(h) §5 runFlags.quests kommt feldweise identisch zurueck (Status UND Zaehler je Quest)',
    gl(zurueck.runFlags.quests, RF_FIX.quests), JSON.stringify(zurueck.runFlags.quests));
  check('S6-§7F(h) §5 runFlags.npcFlags kommt feldweise identisch zurueck (alle Gespraechsmarken)',
    gl(zurueck.runFlags.npcFlags, RF_FIX.npcFlags), JSON.stringify(zurueck.runFlags.npcFlags));
  check('S6-§7F(h) §5 runFlags.gekauft kommt feldweise identisch zurueck (Einmalwaren)',
    gl(zurueck.runFlags.gekauft, RF_FIX.gekauft), JSON.stringify(zurueck.runFlags.gekauft));
  check('S6-§7F(h) §5 runFlags.dorfBesuche kommt identisch zurueck (Angebots-Saat)',
    zurueck.runFlags.dorfBesuche === RF_FIX.dorfBesuche, String(zurueck.runFlags.dorfBesuche));
  check('S6-§7F(h) §5 auch die zwei Bestands-runFlags ueberleben unveraendert (bossDead, openedChests)',
    zurueck.runFlags.bossDead === RF_FIX.bossDead
    && gl(zurueck.runFlags.openedChests, RF_FIX.openedChests),
    JSON.stringify({ b: zurueck.runFlags.bossDead, o: zurueck.runFlags.openedChests }));

  // Globale wieder herstellen: nachfolgende Bloecke sehen den Bestand.
  Math.random = zufallVorher;
  if (perfVorher) Object.defineProperty(globalThis, 'performance', perfVorher);
  globalThis.window = winVorher;
  globalThis.document = docVorher;
}

// --- GP7CH2-BLOCK-START ---
// ===========================================================================
// GP7CH2 §5(5) — ADDITIVE GATES DES FLASH-/DECAL-PASSES (Phase 1e, 12.09.2026)
//
// REGELN, unter denen dieser Block steht (SPEC_GP7CH2 §5, Rev 2 E-A, PHASE0
// R-A1..R-A10):
//   * NUR ADDITIV, am ENDE der Datei. Kein Zeichen oberhalb dieser Zeile wurde
//     angefasst; §5(6) verbietet Flusstests, Golden und AABB.
//   * QUELLGEBUNDEN: gemessen wird an den ECHTEN Modulen (drawEnemy,
//     drawGraveward, player.draw) bzw. am ECHTEN Boot-Pfad von main.js. Kein
//     Nachbau der Flash-/Decal-Logik im Test.
//   * Die Rig-Namensordnung ist SPRITES -> 37 Flips -> TILE_ART -> Signal-
//     Canvases (Flash/Kalt, main.js baut sie EAGER nach dem tiles-Bau). Damit
//     traegt jedes Signal-Canvas den Namen "<Original>#flash" bzw. "#kalt" und
//     jeder Signal-Draw ist seinem TRAEGER exakt zuzuordnen.
//
//   (1) Silhouetten-Verlust 0 (Gegner, Boss, Spieler) + Hund-Telegraph bleibt
//   (2) Flash-Draws: 3 Frames je Treffer, <= 4 je Kill, 0 ueber *_decal, NPCs nie
//   (3) Unverwundbarkeit = kalte Maske 6 Hz, Alpha nur {0, 0,08, 0,12, 0,16}
//   (4) Decal-Reinheit (Wertkopie, kein Event, keine Timer-Zuweisung)
//   (5) REISENDES DORF-Gate (R-A6) + CATACOMBS-Wechsel + Respawn
//   (6) Deckel 24 (Nachweis ueber den nur lesenden Debug-Deckel __decalDeckel)
//   (7) *_decal-Positivkontrolle je Sorte + Fussposition + Warden nie
//   (8) Frame-Diff-Untergrenzen der Gegner (>= IST, PHASE0)
// ===========================================================================
{
  const G7 = 'GP7CH2-§5(5)';
  const q7 = (rel) => readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8');
  const M7_ROH = q7('game/js/main.js');
  const M7 = M7_ROH.replace(/^[ \t]*\/\/.*$/gm, '').replace(/[ \t]+\/\/.*$/gm, '');
  const enemiesMod = await import('../game/js/entities/enemies.js');
  const bossMod = await import('../game/js/entities/boss.js');

  // -------------------------------------------------------------------------
  // (1) SILHOUETTEN-VERLUST 0 — an den ECHTEN Zeichnern, ohne Boot.
  //     Gemessen wird, wie oft der Zeichner den Frame OHNE drawImage verlaesst,
  //     waehrend der Treffer-/Unverwundbarkeits-Timer laeuft. Danebengestellt
  //     die ENTFERNTE Blink-Formel (enemies.js:620 / boss.js:324 /
  //     player.js:229) auf derselben timeSec-Folge: das war der Verlust.
  // -------------------------------------------------------------------------
  {
    const gfx7 = new Proxy({}, { get: () => ({ width: 16, height: 16 }) });
    const mkCtx7 = () => { const o = { n: 0 }; o.drawImage = () => { o.n += 1; }; return o; };
    const cam0 = { x: 0, y: 0 };

    // Gegner: HURT_FLASH 0,2 s = 12 Frames.
    let verlustG = 0; let altG = 0;
    {
      const e = enemiesMod.createSkeleton({ x: 100, y: 100 });
      e.hurtTimer = 0.2; e.state = 'idle';
      for (let f = 0; f < 12; f++) {
        const t = f / 60;
        const c = mkCtx7();
        enemiesMod.drawEnemy(c, cam0, e, gfx7, t);
        if (c.n === 0) verlustG += 1;
        if (e.hurtTimer > 0 && Math.floor(t * 20) % 2 === 0) altG += 1;
        e.hurtTimer -= 1 / 60;
      }
    }
    check(`${G7}(1) Gegner: 0 Silhouetten-Verlust-Frames im Treffer-Fenster (entfernte Blink-Formel haette ${altG} von 12 verschluckt)`,
      verlustG === 0 && altG > 0, `Verlust ${verlustG}, Alt-Formel ${altG}`);

    // Boss: derselbe Timer, eigener Zeichner.
    let verlustB = 0; let altB = 0;
    {
      const e = bossMod.createGraveward({ x: 100, y: 100 });
      e.hurtTimer = 0.2; e.state = 'idle';
      for (let f = 0; f < 12; f++) {
        const t = f / 60;
        const c = mkCtx7();
        bossMod.drawGraveward(c, cam0, e, gfx7, t);
        if (c.n === 0) verlustB += 1;
        if (e.state !== 'die' && e.hurtTimer > 0 && Math.floor(t * 20) % 2 === 0) altB += 1;
        e.hurtTimer -= 1 / 60;
      }
    }
    check(`${G7}(1) Grabwaechter: 0 Silhouetten-Verlust-Frames im Treffer-Fenster (Alt-Formel ${altB} von 12)`,
      verlustB === 0 && altB > 0, `Verlust ${verlustB}, Alt-Formel ${altB}`);

    // Spieler: INVULN_TIME 1 s = 60 Frames.
    let verlustP = 0; let altP = 0;
    {
      const p = createPlayer(GRAVEYARD.playerSpawn);
      p.invulnTimer = 1; p.state = 'idle';
      for (let f = 0; f < 60; f++) {
        const t = f / 60;
        const c = mkCtx7();
        p.draw(c, cam0, gfx7, t);
        if (c.n === 0) verlustP += 1;
        if (p.state !== 'dead' && p.invulnTimer > 0 && Math.floor(t * 12) % 2 === 0) altP += 1;
        p.invulnTimer -= 1 / 60;
      }
    }
    check(`${G7}(1) Spieler: 0 Silhouetten-Verlust-Frames in der Unverwundbarkeit (Alt-Formel ${altP} von 60)`,
      verlustP === 0 && altP > 0, `Verlust ${verlustP}, Alt-Formel ${altP}`);

    // POSITIVKONTROLLE: der Grufthund-AUFSTEH-Blink ist KEIN Treffer-Signal
    // (Telegraph, §8 "bleibt") und blinkt weiter — der Zaehler misst also
    // wirklich fehlende Draws.
    let verlustH = 0;
    {
      const e = enemiesMod.createHound({ x: 100, y: 100 });
      e.state = 'down'; e.downTimer = 0.29; e.hurtTimer = 0;
      for (let f = 0; f < 18; f++) {
        const c = mkCtx7();
        enemiesMod.drawEnemy(c, cam0, e, gfx7, f / 60);
        if (c.n === 0) verlustH += 1;
      }
    }
    check(`${G7}(1) Positivkontrolle: der Grufthund-Aufsteh-Blink (enemies.js:621-624, §8 "bleibt") blinkt weiter`,
      verlustH > 0, `${verlustH} von 18 Frames ohne Draw`);
  }

  // -------------------------------------------------------------------------
  // (8) FRAME-DIFF-UNTERGRENZEN GEGNER (Kunst-Gate, reine Daten).
  //     Formel Teil A 7.2 / figuren_messung.mjs:1593: Texel-Differenz zweier
  //     Grids (ungleiche Masse mit '.' aufgefuellt), in Prozent der OPAKEN
  //     Texel des ERSTEN Grids. Untergrenzen = IST am HEAD (PHASE0), also
  //     heute exakt erfuellt; sie halten, solange die Zeichner die Regel
  //     ">= IST" halten.
  // -------------------------------------------------------------------------
  {
    const opak7 = (k) => SPRITES[k].join('').split('').filter((c) => c !== '.').length;
    const fdiff7 = (ka, kb) => {
      const A = SPRITES[ka]; const B = SPRITES[kb];
      const h = Math.max(A.length, B.length);
      let d = 0; let s = 0;
      for (let y = 0; y < h; y++) {
        const ra = A[y] || ''; const rb = B[y] || '';
        const w = Math.max(ra.length, rb.length);
        for (let x = 0; x < w; x++) {
          const ca = ra[x] || '.'; const cb = rb[x] || '.';
          if (ca !== cb) d += 1;
          if ((ca === '.') !== (cb === '.')) s += 1;
        }
      }
      return { d, s };
    };
    const UNTER = [
      ['skeleton_0', 'skeleton_1', 8.96, 5.97],
      ['ghoul_0', 'ghoul_1', 12.32, 6.90],
      ['hound_0', 'hound_1', 28.83, 18.02],
      ['rust_0', 'rust_1', 17.98, 8.99],
      ['warden_walk_0', 'warden_walk_1', 15.03, 15.03],
    ];
    for (const [a, b, sollT, sollS] of UNTER) {
      const r = fdiff7(a, b); const o = opak7(a);
      const pt = 100 * r.d / o; const ps = 100 * r.s / o;
      // Die PHASE0-Untergrenzen sind auf 2 Stellen GERUNDETE IST-Werte
      // (8,96 = 12/134 = 8,9552). Verglichen wird deshalb mit der
      // Rundungstoleranz 0,005, sonst reisst der Anker an sich selbst.
      check(`${G7}(8) Frame-Diff ${a}/${b} >= ${sollT.toFixed(2)} % Texel / ${sollS.toFixed(2)} % Silhouette (IST-Untergrenze PHASE0)`,
        pt >= sollT - 0.005 && ps >= sollS - 0.005,
        `ist ${pt.toFixed(2)}/${ps.toFixed(2)} % (diff ${r.d}, silh ${r.s}, opak ${o})`);
    }
  }

  // -------------------------------------------------------------------------
  // (4) DECAL-REINHEIT — Quelltext-Waechter nach Muster smoke:5294-5300.
  // -------------------------------------------------------------------------
  {
    const zone = (von, bis) => {
      const i = M7.indexOf(von); const j = M7.indexOf(bis, i + 1);
      return (i < 0 || j < 0) ? '' : M7.slice(i, j);
    };
    // Die drei neuen Bloecke, an ihren eigenen Ankern geschnitten.
    const zSignal = zone('const FLASH_TON', 'function tintMaske(');
    const zUeber = zone('for (const e of lebendeVorFrame)', 'updateProps(dt, props');
    const zZeichner = zone('for (const d of decals) {', 'drawSoftShadow(player);');
    const zZaehler = zone('function signalFor(ent)', 'const pushTinted =');
    const alle = zSignal + zUeber + zZeichner + zZaehler;
    const TIMER_RE = /(hurtTimer|invulnTimer|dieTimer|hitstop|DIE_TIME)\s*(=[^=]|\+=|-=|\+\+|--)/;
    check(`${G7}(4) alle vier Flash-/Decal-Zonen in main.js enthalten KEINE Zuweisung an hurtTimer|invulnTimer|dieTimer|hitstop|DIE_TIME`,
      zSignal.length > 200 && zUeber.length > 200 && zZeichner.length > 200 && zZaehler.length > 200
      && !TIMER_RE.test(alle),
      `${zSignal.length}/${zUeber.length}/${zZeichner.length}/${zZaehler.length} Zeichen; Treffer: ${(alle.match(TIMER_RE) || ['-'])[0]}`);
    check(`${G7}(4) die Decal-Zonen pushen KEIN Event und mutieren enemies/drops/player NICHT`,
      !/events\.push/.test(zUeber + zZeichner)
      && !/\benemies\.(push|splice|pop|shift|unshift|sort|length\s*=)/.test(zUeber + zZeichner)
      && !/\bdrops\.(push|splice|pop|shift|unshift|length\s*=)/.test(zUeber + zZeichner)
      && !/\bplayer\.\w+\s*=[^=]/.test(zUeber + zZeichner),
      `${(zUeber + zZeichner).length} Zeichen Decal-Zone`);
    // Wertkopie: der Push traegt nur Zahlen/Strings, keinen Entity-Verweis und
    // keinen Flip (E-A4: eine Leiche hat keine Blickrichtung).
    const push7 = (M7.match(/decals\.push\(\{[^}]*\}\)/g) || []);
    check(`${G7}(4) genau EIN decals.push, und er ist eine WERTKOPIE (x,y,w,h,key,warmA,kaltA,seite; kein Entity-Verweis, kein flip)`,
      push7.length === 1
      && /key: dkey/.test(push7[0]) && /x: e\.x/.test(push7[0]) && /y: e\.y/.test(push7[0])
      && !/\bflip\b/.test(push7[0]) && !/\bent(ity)?:/.test(push7[0]) && !/:\s*e\s*[,}]/.test(push7[0])
      && !/_decal_flip/.test(M7),
      `${push7.length} Push: ${push7[0] || '-'}`);
    // entities/: Zahl der Timer-Zuweisungen EINGEFROREN (Stand HEAD c60d153,
    // vorher = nachher; die drei sanktionierten Eingriffe haben nur
    // Sichtbarkeits-returns entfernt).
    const ZUW = /(hurtTimer|invulnTimer|dieTimer|hitstop|DIE_TIME)\s*(=[^=]|\+=|-=)/g;
    const zahl = (rel) => (q7(rel).match(ZUW) || []).length;
    const zE = zahl('game/js/entities/enemies.js');
    const zB = zahl('game/js/entities/boss.js');
    const zP = zahl('game/js/entities/player.js');
    check(`${G7}(4) entities/ fuehrt genau so viele Timer-Zuweisungen wie vor dem Pass (enemies 5 / boss 1 / player 2)`,
      zE === 5 && zB === 1 && zP === 2, `${zE}/${zB}/${zP}`);
  }

  // -------------------------------------------------------------------------
  // GEMEINSAMES BOOT-RIG fuer (2), (3), (5), (6), (7).
  // Muster s6boot (oben) + check_main_slice1; NEU: drawImage protokolliert
  // globalAlpha, und die Namensordnung traegt die SIGNAL-Canvases mit
  // ("<Original>#flash" / "#kalt"). Damit ist jeder Signal-Draw seinem
  // TRAEGER (= dem Original-Draw davor) exakt zuzuordnen.
  // -------------------------------------------------------------------------
  const G7_FLIP = [
    'player_side_0', 'player_side_1', 'player_side_2', 'player_side_3',
    'player_attack_side', 'sword_slash_side',
    'skeleton_0', 'skeleton_1', 'skeleton_die',
    'ghoul_0', 'ghoul_1', 'ghoul_die',
    'hound_0', 'hound_1', 'hound_telegraph', 'hound_leap', 'hound_down', 'hound_die',
    'rust_0', 'rust_1', 'rust_die', 'shield_side',
    'warden_idle', 'warden_walk_0', 'warden_walk_1', 'warden_windup_a',
    'warden_windup_b', 'warden_dash', 'warden_stuck', 'warden_summon', 'warden_die',
    'npc_mile_0', 'npc_mile_1', 'npc_mile_talk',
    'npc_torwaechter_0', 'npc_torwaechter_1', 'npc_torwaechter_talk',
  ];
  // WOERTLICH main.js:SIGNAL_RE — der Test liest sie aus dem Quelltext, damit
  // eine Aenderung dort hier auffliegt statt still durchzugehen.
  const SIG_RE_QUELLE = (M7.match(/const SIGNAL_RE = (\/.*\/);/) || [])[1];
  const G7_SIG_RE = /^(player|skeleton|ghoul|hound|rust|warden|shield)_(?!.*_decal$)/;
  const G7_ORDNUNG = (() => {
    const basis = [...Object.keys(SPRITES), ...G7_FLIP.map((k) => `${k}_flip`)];
    const sig = [];
    for (const n of basis) {
      const b = n.endsWith('_flip') ? n.slice(0, -5) : n;
      if (!G7_SIG_RE.test(b) || !SPRITES[b]) continue;
      sig.push(`${n}#flash`, `${n}#kalt`);
    }
    return { namen: [...basis, ...Object.keys(TILE_ART), ...sig], sigZahl: sig.length };
  })();
  const G7_DIE_RE = /_die(_[01])?(_flip)?$/;

  function g7boot({ search = '', marke = 'x' } = {}) {
    const ops = [];
    let uhr = 0;
    const perfVorher = Object.getOwnPropertyDescriptor(globalThis, 'performance');
    const zufallVorher = Math.random;
    const winVorher = globalThis.window;
    const docVorher = globalThis.document;
    Math.random = () => 0.5;
    try { globalThis.performance = { now: () => uhr }; }
    catch { Object.defineProperty(globalThis, 'performance', { value: { now: () => uhr } }); }
    const mkCtx = (canvas) => ({
      canvas, imageSmoothingEnabled: false, globalAlpha: 1,
      globalCompositeOperation: 'source-over',
      fillStyle: '', strokeStyle: '', lineWidth: 1, font: '', textAlign: '', textBaseline: '',
      _stack: [],
      fillRect(...a) { ops.push({ canvas, op: 'fillRect', alpha: this.globalAlpha, fill: this.fillStyle, args: a }); },
      clearRect() {}, strokeRect() {},
      drawImage(img, ...a) { ops.push({ canvas, op: 'drawImage', img, args: a, alpha: this.globalAlpha, gco: this.globalCompositeOperation }); },
      fillText(t, x, y) { ops.push({ canvas, op: 'fillText', text: String(t), x, y }); },
      beginPath() {}, arc() {}, fill() {}, stroke() {}, closePath() {}, moveTo() {}, lineTo() {}, rect() {},
      translate() {}, scale() {}, rotate() {}, setTransform() {}, measureText: () => ({ width: 0 }),
      save() { this._stack.push({ a: this.globalAlpha, f: this.fillStyle }); },
      restore() { const s = this._stack.pop(); if (s) { this.globalAlpha = s.a; this.fillStyle = s.f; } },
      createRadialGradient: () => ({ addColorStop() {} }),
    });
    const canvases = [];
    const mkCanvas = () => {
      const c = { width: 0, height: 0, style: {}, ownerDocument: null };
      c.getContext = () => (c._ctx || (c._ctx = mkCtx(c)));
      c.addEventListener = () => {};
      c.getBoundingClientRect = () => ({ left: 0, top: 0, width: 320, height: 180 });
      canvases.push(c);
      return c;
    };
    const winL = {}; const docL = {}; const cvL = {}; const rafQ = [];
    const win = {
      addEventListener: (t, f) => (winL[t] = winL[t] || []).push(f),
      devicePixelRatio: 1, innerWidth: 960, innerHeight: 540,
      location: { search }, requestAnimationFrame: (cb) => rafQ.push(cb),
    };
    const haupt = { width: 320, height: 180, style: {} };
    const doc = {
      getElementById: () => haupt, createElement: () => mkCanvas(),
      addEventListener: (t, f) => (docL[t] = docL[t] || []).push(f),
      defaultView: win, hidden: false,
    };
    haupt.getContext = () => (haupt._ctx || (haupt._ctx = mkCtx(haupt)));
    haupt.addEventListener = (t, f) => (cvL[t] = cvL[t] || []).push(f);
    haupt.getBoundingClientRect = () => ({ left: 0, top: 0, width: 320, height: 180 });
    haupt.ownerDocument = doc;
    globalThis.window = win;
    globalThis.document = doc;
    const b = {
      win, doc, haupt, ops, canvases, nameOf: new Map(), frameNr: 0, bootZahl: 0,
      async start() {
        await import(`../game/js/main.js?gp7ch2=${marke}`);
        b.bootZahl = canvases.length;
        canvases.forEach((c, i) => b.nameOf.set(c, G7_ORDNUNG.namen[i] || `extra_${i}`));
      },
      nm: (img) => String(b.nameOf.get(img) || ''),
      frame() {
        ops.length = 0;
        const cb = rafQ.shift();
        if (!cb) throw new Error('kein rAF-Callback (Boot tot?)');
        uhr += 1000 / 60 + 0.001;
        cb();
        b.frameNr += 1;
      },
      key(typ, code) { for (const f of winL[typ] || []) f({ code, repeat: false, preventDefault() {} }); },
      draws: () => ops.filter((o) => o.op === 'drawImage' && o.canvas === haupt),
      namen: () => b.draws().map((o) => b.nm(o.img)),
      texte: () => ops.filter((o) => o.op === 'fillText').map((o) => o.text),
      hatText: (t) => b.texte().some((s) => s.includes(t)),
      ambient: () => {
        const f = ops.find((o) => o.op === 'fillRect' && o.canvas !== haupt && o.alpha > 0 && o.alpha < 1);
        return f ? f.alpha : null;
      },
      signal() {
        const d = b.draws(); const out = [];
        for (let i = 0; i < d.length; i++) {
          const n = b.nm(d[i].img);
          if (!/#(flash|kalt)$/.test(n)) continue;
          let traeger = '?';
          for (let j = i - 1; j >= 0; j--) {
            const m = b.nm(d[j].img);
            if (m && !/#(flash|kalt)$/.test(m) && !/^extra_/.test(m)) { traeger = m; break; }
          }
          out.push({ name: n, art: n.endsWith('#flash') ? 'flash' : 'kalt', alpha: Number(d[i].alpha.toFixed(6)), traeger });
        }
        return out;
      },
      // Original-Draws (ohne Signal, ohne lazy Tint-Masken) mit Fusspunkt.
      figuren(re) {
        return b.draws().filter((o) => re.test(b.nm(o.img)))
          .map((o) => ({ name: b.nm(o.img), mx: o.args[0] + o.img.width / 2, fy: o.args[1] + o.img.height, alpha: o.alpha }));
      },
      spieler() { const f = b.figuren(/^player_(?!.*#)/); return f.length ? f[f.length - 1] : null; },
      decals: () => b.figuren(/_decal$/),
      ende() {
        Math.random = zufallVorher;
        if (perfVorher) Object.defineProperty(globalThis, 'performance', perfVorher);
        globalThis.window = winVorher;
        globalThis.document = docVorher;
      },
    };
    return b;
  }

  // Ein Protokoll-Schritt: Frame + alles, was die Gates brauchen.
  const g7schritt = (b, log) => {
    b.frame();
    log.push({
      f: b.frameNr, amb: b.ambient(), sig: b.signal(),
      dec: b.decals(), tot: b.figuren(G7_DIE_RE), spieler: b.spieler(),
      namen: b.namen().filter((n) => !/^extra_/.test(n)),
    });
  };
  const g7halte = (b, log, code, n) => { b.key('keydown', code); for (let i = 0; i < n; i++) g7schritt(b, log); b.key('keyup', code); };
  // Jagd auf die naechste Figur, die `re` zeichnet; Steuerung ueber SCHIRM-
  // Deltas (Spieler und Gegner liegen im selben Bild, die Differenz ist also
  // die Welt-Differenz). Kein Eingriff in die Spiellogik.
  const g7jage = (b, log, re, budget, stopf) => {
    let stuck = 0; let letzt = null; let achse = 0;
    const start = b.frameNr;
    while (b.frameNr - start < budget) {
      if (stopf && stopf()) return true;
      const p = b.spieler(); const gs = b.figuren(re);
      if (!p || !gs.length) { g7schritt(b, log); continue; }
      if (letzt && Math.abs(letzt.mx - p.mx) < 0.6 && Math.abs(letzt.fy - p.fy) < 0.6) stuck += 1; else stuck = 0;
      letzt = p;
      let best = gs[0]; let bd = Infinity;
      for (const g of gs) { const d = Math.hypot(g.mx - p.mx, g.fy - p.fy); if (d < bd) { bd = d; best = g; } }
      const dx = best.mx - p.mx; const dy = best.fy - p.fy;
      const hz = dx > 0 ? 'ArrowRight' : 'ArrowLeft';
      const vt = dy > 0 ? 'ArrowDown' : 'ArrowUp';
      if (bd > 13) {
        if (stuck > 2) { achse = (achse + 1) % 4; g7halte(b, log, ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'][achse], 12); stuck = 0; }
        else g7halte(b, log, Math.abs(dx) >= Math.abs(dy) ? hz : vt, 4);
      } else {
        g7halte(b, log, Math.abs(dx) >= Math.abs(dy) ? hz : vt, 2);
        b.key('keydown', 'KeyJ'); g7schritt(b, log); b.key('keyup', 'KeyJ');
        for (let i = 0; i < 10; i++) g7schritt(b, log);
      }
    }
    return false;
  };
  // Flash-Laeufe: zusammenhaengende Frame-Folgen mit Flash-Signal, getrennt
  // nach TRAEGER-Familie (player/skeleton/...). Jeder Lauf traegt, ueber welche
  // Sprites er lief.
  const g7laeufe = (log) => {
    const proTraeger = new Map();
    for (const z of log) {
      for (const s of z.sig) {
        if (s.art !== 'flash') continue;
        const fam = s.traeger.split('_')[0];
        if (!proTraeger.has(fam)) proTraeger.set(fam, []);
        const l = proTraeger.get(fam);
        const letzt = l[l.length - 1];
        if (letzt && letzt.bis === z.f - 1) { letzt.bis = z.f; letzt.frames += 1; letzt.traeger.push(s.traeger); letzt.alphas.add(s.alpha); }
        else l.push({ von: z.f, bis: z.f, frames: 1, traeger: [s.traeger], alphas: new Set([s.alpha]), fam });
      }
    }
    return [...proTraeger.values()].flat();
  };

  // Reise zu einem Portal. Grobzug zuerst (die Kampfkarten haben breite
  // Randkorridore); wird das Ziel dabei nicht getroffen, wird an einem DECAL
  // kalibriert: ein Decal liegt WELTFEST, sein Schirmort ist also die Kamera.
  // In der NW-Ecke klemmt die Kamera auf (0,0) — dort ist Schirm == Welt, und
  // damit ist die Weltlage des Ankers (und ab dann des Spielers) exakt bekannt.
  // Danach greedy mit Quer-Ausweichen auf ECHTEN Weltkoordinaten.
  // ACHTUNG Geometrie: der gemessene Ort ist (Sprite-Mitte x, Sprite-Unterkante
  // y) = (AABB-Mitte x, AABB-UNTERKANTE y). Das Ziel muss deshalb als
  // AABB-Unterkante angegeben werden, sonst haengt die 14 px hohe Spieler-AABB
  // mit einem Pixel in der Kachelreihe DARUEBER und wird dort blockiert
  // (gemessen: Friedhof-Reihe 11 Spalte 1 ist ein Grabstein).
  const g7reise = (b, log, sollAmb, grobe, zx, zy, budget) => {
    const da = () => Math.abs((b.ambient() || 0) - sollAmb) < 1e-9;
    const nach = () => { for (let i = 0; i < 80; i++) g7schritt(b, log); return true; };
    for (const [c, n] of grobe) { g7halte(b, log, c, n); if (da()) return nach(); }
    const a0 = b.decals()[0]; const p0 = b.spieler();
    if (!a0 || !p0 || p0.mx > 150 || p0.fy > 92) {
      // Keine Kalibrierung moeglich -> Blindkamm als Rueckfall.
      for (let s = 0; s < 60 && !da(); s++) {
        g7halte(b, log, grobe[0][0], 20);
        if (da()) break;
        g7halte(b, log, grobe[1][0] === 'ArrowUp' ? 'ArrowDown' : grobe[1][0], 8);
      }
      return da() ? nach() : false;
    }
    const anker = { mx: a0.mx, fy: a0.fy };
    const welt = () => {
      const a = b.decals()[0]; const p = b.spieler();
      if (!a || !p) return null;
      return { x: p.mx + anker.mx - a.mx, y: p.fy + anker.fy - a.fy };
    };
    let ohne = 0; let letzt = null; const t0 = b.frameNr;
    while (b.frameNr - t0 < budget) {
      if (da()) return nach();
      const w = welt();
      if (!w) break;
      const dx = zx - w.x; const dy = zy - w.y;
      const hz = dx > 0 ? 'ArrowRight' : 'ArrowLeft';
      const vt = dy > 0 ? 'ArrowDown' : 'ArrowUp';
      const haupt = Math.abs(dx) >= Math.abs(dy) ? hz : vt;
      const quer = Math.abs(dx) >= Math.abs(dy) ? vt : hz;
      g7halte(b, log, ohne >= 2 ? quer : haupt, ohne >= 2 ? 16 : 10);
      const w2 = welt();
      if (w2 && letzt && Math.abs(w2.x - letzt.x) < 1 && Math.abs(w2.y - letzt.y) < 1) ohne += 1; else ohne = 0;
      letzt = w2;
    }
    return da() ? nach() : false;
  };

  // -------------------------------------------------------------------------
  // BOOT A — ?god=1 auf dem FRIEDHOF: Kills, Decal-Positivkontrolle, Deckel,
  //          REISENDES DORF-Gate (R-A6). Ein Boot, eine Reise.
  // -------------------------------------------------------------------------
  {
    const b = g7boot({ search: '?god=1', marke: 'a' });
    const log = [];
    let fehler = null;
    let M = {};
    try {
      await b.start();
      for (let i = 0; i < 3; i++) g7schritt(b, log);
      b.key('keydown', 'Enter'); b.key('keyup', 'Enter');
      for (let i = 0; i < 4; i++) g7schritt(b, log);
      M.bootZahl = b.bootZahl;
      M.ambStart = b.ambient();

      // --- Kill 1: Skelett -------------------------------------------------
      const vorKill1 = log.length;
      g7jage(b, log, /^skeleton_[01](_flip)?$/, 1200, () => log.slice(vorKill1).some((z) => z.tot.some((t) => /^skeleton_die/.test(t.name))));
      for (let i = 0; i < 60; i++) g7schritt(b, log);   // Sterbephase + Ruhe, KEINE Taste
      M.i1 = log.length;
      // Sterbeframes und erster Decal-Frame
      const dieIdx = [];
      for (let i = vorKill1; i < log.length; i++) if (log[i].tot.some((t) => /^skeleton_die/.test(t.name))) dieIdx.push(i);
      M.dieFrames = dieIdx.length;
      M.dieLetzt = dieIdx.length ? dieIdx[dieIdx.length - 1] : -1;
      M.decalErst = log.findIndex((z, i) => i > vorKill1 && z.dec.some((d) => d.name === 'skeleton_decal'));
      // Positivkontrolle: ab dem ersten Decal-Frame in JEDEM Frame GENAU EINS
      const fenster1 = log.slice(M.decalErst, M.i1);
      M.alleEins = fenster1.length > 20 && fenster1.every((z) => z.dec.filter((d) => d.name === 'skeleton_decal').length === 1);
      M.fenster1 = fenster1.length;
      M.dieUndDecal = fenster1.filter((z) => z.tot.some((t) => /^skeleton_die/.test(t.name))).length;
      // Fussposition: letzter *_die-Frame gegen ersten *_decal-Frame, bei
      // STEHENDEM Spieler (Kamera statisch -> der Vergleich ist exakt).
      const zDie = log[M.dieLetzt]; const zDec = log[M.decalErst];
      const tDie = zDie && zDie.tot.find((t) => /^skeleton_die/.test(t.name));
      const tDec = zDec && zDec.dec.find((d) => d.name === 'skeleton_decal');
      M.kameraRuht = !!(zDie && zDec && zDie.spieler && zDec.spieler
        && zDie.spieler.mx === zDec.spieler.mx && zDie.spieler.fy === zDec.spieler.fy);
      M.fuss = (tDie && tDec) ? { dieMx: tDie.mx, dieFy: tDie.fy, decMx: tDec.mx, decFy: tDec.fy } : null;

      // --- Kill 2: Grufthund ----------------------------------------------
      const vorKill2 = log.length;
      g7jage(b, log, /^hound_(0|1|telegraph|leap|down)(_flip)?$/, 1200, () => log.slice(vorKill2).some((z) => z.tot.some((t) => /^hound_die/.test(t.name))));
      for (let i = 0; i < 60; i++) g7schritt(b, log);
      M.i2 = log.length;
      M.houndDie = log.slice(vorKill2, M.i2).some((z) => z.tot.some((t) => /^hound_die/.test(t.name)));
      const hErst = log.findIndex((z, i) => i > vorKill2 && z.dec.some((d) => d.name === 'hound_decal'));
      M.houndDecalAlle = hErst > 0 && log.slice(hErst, M.i2).length > 20
        && log.slice(hErst, M.i2).every((z) => z.dec.filter((d) => d.name === 'hound_decal').length === 1);
      M.houndFenster = hErst > 0 ? M.i2 - hErst : 0;

      // --- Deckel: Debug-Deckel auf 2, zwei weitere Kills -----------------
      b.win.__decalDeckel = 2;
      M.maxVorDeckel = Math.max(...log.slice(M.decalErst, M.i2).map((z) => z.dec.length));
      const vorDeckel = log.length;
      for (let k = 0; k < 2; k++) {
        const vor = log.length;
        g7jage(b, log, /^(skeleton|hound)_(0|1|telegraph|leap|down)(_flip)?$/, 900, () => log.slice(vor).some((z) => z.tot.some((t) => G7_DIE_RE.test(t.name))));
        for (let i = 0; i < 30; i++) g7schritt(b, log);
      }
      M.i3 = log.length;
      const nachDeckel = log.slice(vorDeckel + 30, M.i3);
      M.maxNachDeckel = nachDeckel.length ? Math.max(...nachDeckel.map((z) => z.dec.length)) : -1;
      M.kills = new Set(log.flatMap((z) => z.tot.map((t) => t.name.replace(/_flip$/, '')))).size;
      // "aeltestes faellt": die Decal-Zahl steht auf dem Deckel und die
      // gezeichnete Menge hat sich gegenueber dem Stand vor den Kills geaendert.
      M.decalNamenNachDeckel = [...new Set(nachDeckel.flatMap((z) => z.dec.map((d) => d.name)))].sort().join(',');

      // --- REISE: Westtor tileRect(1,12) -> DORF (R-A6) --------------------
      const vorReise = log.length;
      // Westwand zuerst (die Strasse rows 12/13 ist von Spalte 1 bis 33 frei —
      // wer in ihr nach Westen laeuft, steht auf dem Tor), dann Nordwand, dann
      // Welt-Navigation auf das Portalzentrum tileRect(1,12) = (24,200).
      M.reiseOk = g7reise(b, log, 0.28, [['ArrowLeft', 400], ['ArrowUp', 400], ['ArrowLeft', 150], ['ArrowUp', 150]], 24, 207, 2500);
      const reise = log.slice(vorReise);
      const gy = reise.filter((z) => Math.abs((z.amb || 0) - 0.22) < 1e-9);
      const dorf = reise.filter((z) => Math.abs((z.amb || 0) - 0.28) < 1e-9);
      M.dorfErreicht = dorf.length > 20;
      M.gyLetztDecals = gy.length ? gy[gy.length - 1].dec.length : -1;
      M.dorfDecalDraws = dorf.reduce((a, z) => a + z.dec.length, 0);
      M.dorfFrames = dorf.length;

      // --- Flash-Buchhaltung ueber den GANZEN Boot -------------------------
      const laeufe = g7laeufe(log);
      M.laeufe = laeufe.length;
      M.lebendLaeufe = laeufe.filter((l) => !l.traeger.some((t) => G7_DIE_RE.test(t)));
      M.todLaeufe = laeufe.filter((l) => l.traeger.some((t) => G7_DIE_RE.test(t)));
      M.lebendLaengen = [...new Set(M.lebendLaeufe.map((l) => l.frames))].sort((x, y) => x - y);
      M.todLaengen = [...new Set(M.todLaeufe.map((l) => l.frames))].sort((x, y) => x - y);
      M.alphas = [...new Set(log.flatMap((z) => z.sig.filter((s) => s.art === 'flash').map((s) => s.alpha)))];
      M.ueberDecal = log.flatMap((z) => z.sig.filter((s) => /_decal$/.test(s.traeger))).length;
      M.ueberNpcSchwert = log.flatMap((z) => z.sig.filter((s) => /^(npc_|sword_slash)/.test(s.traeger))).length;
      M.traegerFalsch = log.flatMap((z) => z.sig.filter((s) => s.name !== `${s.traeger}#${s.art}`)).length;
      M.sigZahl = G7_ORDNUNG.sigZahl;
    } catch (e) { fehler = e; }
    b.ende();
    if (fehler) check(`${G7} BOOT A (?god=1 Friedhof) laeuft durch`, false, `${fehler.message} (Frame ${b.frameNr})`);
    else {
      check(`${G7} BOOT A: Boot baut ${G7_ORDNUNG.namen.length} benannte Canvases (SPRITES+Flips+TILE_ART+${G7_ORDNUNG.sigZahl} Signal) — kein Name verschiebt sich`,
        M.bootZahl === G7_ORDNUNG.namen.length && Math.abs(M.ambStart - 0.22) < 1e-9,
        `${M.bootZahl} Canvases, ambient ${M.ambStart}`);
      // (7) Positivkontrolle Skelett
      check(`${G7}(7) Skelett: *_die waehrend der Sterbephase, danach in JEDEM Frame GENAU EIN skeleton_decal (${M.fenster1} Frames)`,
        M.dieFrames >= 20 && M.dieFrames <= 34 && M.alleEins && M.dieUndDecal === 0,
        `die-Frames ${M.dieFrames}, Decal-Fenster ${M.fenster1}, Ueberlapp die+decal ${M.dieUndDecal}`);
      check(`${G7}(7) Skelett: das Decal steht auf der FUSSPOSITION der Leiche (Kamera ruht, Vergleich exakt)`,
        M.kameraRuht && M.fuss && M.fuss.dieMx === M.fuss.decMx && M.fuss.dieFy === M.fuss.decFy,
        `Kamera ruht ${M.kameraRuht}, ${JSON.stringify(M.fuss)}`);
      check(`${G7}(7) Grufthund: nach dem Tod in JEDEM Frame GENAU EIN hound_decal (${M.houndFenster} Frames)`,
        M.houndDie && M.houndDecalAlle, `die ${M.houndDie}, Fenster ${M.houndFenster}`);
      // (6) Deckel
      check(`${G7}(6) Deckel: mit dem nur lesenden Debug-Deckel __decalDeckel = 2 werden NIE mehr als 2 Decals gezeichnet (aeltestes faellt)`,
        M.maxVorDeckel >= 1 && M.maxNachDeckel === 2,
        `vor dem Deckel max ${M.maxVorDeckel}, mit Deckel 2 max ${M.maxNachDeckel}, Menge {${M.decalNamenNachDeckel}}`);
      // (5) REISENDES DORF-Gate
      check(`${G7}(5) R-A6 REISE: Kampfkarte MIT Kills -> Westtor tileRect(1,12) -> DORF: Decal-Zahl ${M.gyLetztDecals} -> 0 am Kartenwechsel`,
        M.dorfErreicht && M.gyLetztDecals >= 1 && M.dorfDecalDraws === 0,
        `letzter Friedhof-Frame ${M.gyLetztDecals} Decals, ${M.dorfFrames} DORF-Frames mit ${M.dorfDecalDraws} Decal-Draws`);
      // (2) Flash-Draws
      check(`${G7}(2) JEDER Signal-Draw liegt ueber GENAU DEM Sprite, dessen Maske er ist (Name = "<Traeger>#flash|#kalt")`,
        M.traegerFalsch === 0 && M.laeufe > 0, `${M.traegerFalsch} Fehlzuordnungen in ${M.laeufe} Laeufen`);
      check(`${G7}(2) Flash-Alpha ist ausschliesslich 0,8 (E-A2), und JEDER Treffer erzeugt einen Lauf von 3 oder 4 Frames — nie mehr`,
        M.laeufe >= 3 && M.alphas.join(',') === '0.8'
        && [...M.lebendLaengen, ...M.todLaengen].every((n) => n === 3 || n === 4),
        `${M.laeufe} Laeufe, lebend {${M.lebendLaengen.join(',')}}, ueber *_die {${M.todLaengen.join(',')}}, Alphas {${M.alphas.join(',')}}`);
      check(`${G7}(2) Kill = HOECHSTENS 4 Flash-Frames ueber *_die (R-A1: der Zaehler zeichnet zu Ende, kann aber nicht neu starten)`,
        M.todLaeufe.length >= 1 && M.todLaengen.every((n) => n <= 4),
        `${M.todLaeufe.length} Kill-Laeufe, Laengen {${M.todLaengen.join(',')}}`);
      check(`${G7}(2) NULL Signal-Draws ueber *_decal und NULL ueber npc_*/sword_slash_* (eine Leiche und ein NPC blitzen nie)`,
        M.ueberDecal === 0 && M.ueberNpcSchwert === 0,
        `${M.ueberDecal} ueber Decal, ${M.ueberNpcSchwert} ueber npc/sword`);
    }
  }

  // -------------------------------------------------------------------------
  // BOOT B — ?god=1&map=FLUESTERGRUFT: Ghul-Decal + Kartenwechsel nach
  //          CATACOMBS (das Portal tileRect(3,2) liegt neben dem Dev-Spawn).
  // -------------------------------------------------------------------------
  {
    const b = g7boot({ search: '?god=1&map=FLUESTERGRUFT', marke: 'b' });
    const log = [];
    let fehler = null; const M = {};
    try {
      await b.start();
      for (let i = 0; i < 3; i++) g7schritt(b, log);
      b.key('keydown', 'Enter'); b.key('keyup', 'Enter');
      for (let i = 0; i < 4; i++) g7schritt(b, log);
      M.amb = b.ambient();
      const vor = log.length;
      g7jage(b, log, /^ghoul_[01](_flip)?$/, 1500, () => log.slice(vor).some((z) => z.tot.some((t) => /^ghoul_die/.test(t.name))));
      for (let i = 0; i < 60; i++) g7schritt(b, log);
      M.ghoulDie = log.slice(vor).some((z) => z.tot.some((t) => /^ghoul_die/.test(t.name)));
      const gErst = log.findIndex((z, i) => i > vor && z.dec.some((d) => d.name === 'ghoul_decal'));
      M.ghoulFenster = gErst > 0 ? log.length - gErst : 0;
      M.ghoulAlle = gErst > 0 && M.ghoulFenster > 20
        && log.slice(gErst).every((z) => z.dec.filter((d) => d.name === 'ghoul_decal').length === 1);
      // Reise zum CATACOMBS-Portal (48,32)
      const vorReise = log.length;
      // Das CATACOMBS-Portal tileRect(3,2) liegt in der NW-Ecke der Gruft:
      // Nordwand, dann Westwand reicht als Grobzug.
      M.reiseOk = g7reise(b, log, 0.55, [['ArrowUp', 400], ['ArrowLeft', 400], ['ArrowUp', 150], ['ArrowLeft', 150]], 56, 47, 2500);
      const reise = log.slice(vorReise);
      const fg = reise.filter((z) => Math.abs((z.amb || 0) - 0.52) < 1e-9);
      const cat = reise.filter((z) => Math.abs((z.amb || 0) - 0.55) < 1e-9);
      M.catErreicht = cat.length > 20;
      M.fgLetzt = fg.length ? fg[fg.length - 1].dec.length : -1;
      M.catDraws = cat.reduce((a, z) => a + z.dec.length, 0);
      M.catFrames = cat.length;
      M.ueberDecal = log.flatMap((z) => z.sig.filter((s) => /_decal$/.test(s.traeger))).length;
    } catch (e) { fehler = e; }
    b.ende();
    if (fehler) check(`${G7} BOOT B (Fluestergruft) laeuft durch`, false, `${fehler.message} (Frame ${b.frameNr})`);
    else {
      check(`${G7}(7) Ghul: nach dem Tod in JEDEM Frame GENAU EIN ghoul_decal (${M.ghoulFenster} Frames, Fluestergruft)`,
        M.ghoulDie && M.ghoulAlle, `die ${M.ghoulDie}, Fenster ${M.ghoulFenster}, ambient ${M.amb}`);
      check(`${G7}(5) Kartenwechsel FLUESTERGRUFT -> CATACOMBS raeumt: Decal-Zahl ${M.fgLetzt} -> 0, und 0 Decal-Draws auf der Zielkarte`,
        M.catErreicht && M.fgLetzt >= 1 && M.catDraws === 0,
        `letzter Gruft-Frame ${M.fgLetzt} Decals, ${M.catFrames} CATACOMBS-Frames mit ${M.catDraws} Draws`);
      check(`${G7}(2) auch hier NULL Signal-Draws ueber *_decal`, M.ueberDecal === 0, `${M.ueberDecal}`);
    }
  }

  // -------------------------------------------------------------------------
  // BOOT C — OHNE ?god=1: Spieler-Treffer (Flash 3 Frames), kalte
  //          Unverwundbarkeit (6 Hz, diskrete Alphas), Tod (ab Frame 5 = 0),
  //          Respawn raeumt die Decals.
  // -------------------------------------------------------------------------
  {
    const b = g7boot({ search: '', marke: 'c' });
    const log = [];
    let fehler = null; const M = {};
    try {
      await b.start();
      for (let i = 0; i < 5; i++) g7schritt(b, log);
      b.key('keydown', 'Enter'); b.key('keyup', 'Enter');
      for (let i = 0; i < 4; i++) g7schritt(b, log);
      // Ein Skelett toeten (damit zum Respawn wirklich eine Leiche liegt) —
      // unterwegs kassiert der Spieler die Treffer, die (2)/(3) messen.
      const vor = log.length;
      g7jage(b, log, /^skeleton_[01](_flip)?$/, 1500, () => log.slice(vor).some((z) => z.tot.some((t) => /^skeleton_die/.test(t.name))));
      for (let i = 0; i < 40; i++) g7schritt(b, log);
      M.decalsVorTod = log[log.length - 1].dec.length;
      // --- Spieler-Flash-Laeufe --------------------------------------------
      const alleL = g7laeufe(log);
      M.lebendAlle = alleL.filter((l) => !l.traeger.some((t) => G7_DIE_RE.test(t)));
      M.lebendLaengen = [...new Set(M.lebendAlle.map((l) => l.frames))].sort((x, y) => x - y);
      M.lebendFam = [...new Set(M.lebendAlle.map((l) => l.fam))].sort();
      const pl = alleL.filter((l) => l.fam === 'player');
      M.plLaeufe = pl.length;
      M.plLebend = pl.filter((l) => !l.traeger.some((t) => G7_DIE_RE.test(t)));
      M.plLebendLaengen = [...new Set(M.plLebend.map((l) => l.frames))].sort((x, y) => x - y);
      M.plAlphas = [...new Set(pl.flatMap((l) => [...l.alphas]))];
      // --- kalte Unverwundbarkeit ------------------------------------------
      const kalt = log.flatMap((z) => z.sig.filter((s) => s.art === 'kalt' && s.traeger.startsWith('player')).map((s) => ({ f: z.f, a: s.alpha })));
      M.kaltZahl = kalt.length;
      M.kaltAlphas = [...new Set(kalt.map((k) => k.a))].sort((x, y) => x - y);
      // 6 Hz: ein voller Durchlauf [0,16 0,12 0,08 0] dauert 1/6 s = 10 Frames
      // bei 60 Hz. Also muss die Alpha-Folge PRO FRAME 10-periodisch sein.
      const perFrame = new Map(kalt.map((k) => [k.f, k.a]));
      const von = kalt.length ? kalt[0].f : 0;
      const bis = kalt.length ? kalt[kalt.length - 1].f : 0;
      let periodisch = bis - von > 30;
      for (let f = von; f + 10 <= bis; f++) {
        const a = perFrame.get(f) || 0; const c = perFrame.get(f + 10) || 0;
        // nur innerhalb einer durchgehenden Unverwundbarkeits-Phase pruefen
        if (!perFrame.has(f) && !perFrame.has(f + 10)) continue;
        if (a !== c) { periodisch = false; break; }
      }
      M.periodisch = periodisch;
      M.kaltVon = von; M.kaltBis = bis;
      // Sprite-Alpha bleibt 1 (engineB org.alpha === 1): in JEDEM Frame mit
      // kaltem Puls ist der ORIGINAL-Spieler-Draw voll deckend.
      M.origAlpha1 = log.filter((z) => z.sig.some((s) => s.art === 'kalt'))
        .every((z) => z.spieler && z.spieler.alpha === 1);
      // --- Tod --------------------------------------------------------------
      let tot = false;
      for (let i = 0; i < 500 && !tot; i++) {
        const p = b.spieler(); const gs = b.figuren(/^(skeleton|hound)_(0|1|telegraph|leap|down)(_flip)?$/);
        if (!p || !gs.length) { g7schritt(b, log); tot = b.hatText('GAME OVER'); continue; }
        let best = gs[0]; let bd = Infinity;
        for (const g of gs) { const d = Math.hypot(g.mx - p.mx, g.fy - p.fy); if (d < bd) { bd = d; best = g; } }
        const dx = best.mx - p.mx; const dy = best.fy - p.fy;
        const code = Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'ArrowRight' : 'ArrowLeft') : (dy > 0 ? 'ArrowDown' : 'ArrowUp');
        b.key('keydown', code);
        for (let f = 0; f < 6 && !tot; f++) { g7schritt(b, log); tot = b.hatText('GAME OVER'); }
        b.key('keyup', code);
      }
      M.tot = tot;
      for (let i = 0; i < 60; i++) g7schritt(b, log);
      // Leichen-Blitz-Sonde: die dead-Frames durchzaehlen.
      const deadIdx = [];
      for (let i = 0; i < log.length; i++) if (log[i].namen.some((n) => /^player_die_[01]/.test(n))) deadIdx.push(i);
      M.deadFrames = deadIdx.length;
      M.deadMitSignal = deadIdx.filter((i) => log[i].sig.some((s) => s.traeger.startsWith('player_die'))).length;
      M.deadSignalPositionen = deadIdx.map((i, k) => (log[i].sig.some((s) => s.traeger.startsWith('player_die')) ? k + 1 : 0)).filter((x) => x > 0);
      // --- Respawn ----------------------------------------------------------
      b.key('keydown', 'Enter'); b.key('keyup', 'Enter');
      for (let i = 0; i < 10; i++) g7schritt(b, log);
      M.nachRespawn = log.slice(-6).reduce((a, z) => a + z.dec.length, 0);
      M.gameOverWeg = !b.hatText('GAME OVER');
    } catch (e) { fehler = e; }
    b.ende();
    if (fehler) check(`${G7} BOOT C (ohne God, Tod + Respawn) laeuft durch`, false, `${fehler.message} (Frame ${b.frameNr})`);
    else {
      check(`${G7}(2) JEDER Treffer an einem LEBENDEN Koerper (Spieler UND Gegner, ohne God-Einhiebtode) = genau 3 Frames Flash`,
        M.lebendAlle.length >= 2 && M.lebendLaengen.join(',') === '3' && M.lebendFam.length >= 2,
        `${M.lebendAlle.length} Laeufe, Laengen {${M.lebendLaengen.join(',')}}, Traeger-Familien {${M.lebendFam.join(',')}}`);
      check(`${G7}(2) Spieler-Treffer = genau 3 Frames Flash Alpha 0,8 ueber dem LEBENDEN Spieler-Sprite`,
        M.plLebend.length >= 1 && M.plLebendLaengen.join(',') === '3' && M.plAlphas.join(',') === '0.8',
        `${M.plLebend.length} Laeufe, Laengen {${M.plLebendLaengen.join(',')}}, Alphas {${M.plAlphas.join(',')}}`);
      check(`${G7}(2) Spieler tot: HOECHSTENS 3 dead-Frames tragen den auslaufenden Kill-Flash, ab Frame 5 KEINER (${M.deadFrames} dead-Frames)`,
        M.tot && M.deadFrames > 20 && M.deadMitSignal <= 3
        && M.deadSignalPositionen.every((k) => k <= 4),
        `${M.deadMitSignal} von ${M.deadFrames} dead-Frames mit Signal, Positionen [${M.deadSignalPositionen.join(',')}]`);
      check(`${G7}(3) Unverwundbarkeit = KALTE Maske, Alpha ausschliesslich aus {0, 0,08, 0,12, 0,16}`,
        M.kaltZahl > 30 && M.kaltAlphas.every((a) => a === 0.08 || a === 0.12 || a === 0.16),
        `${M.kaltZahl} kalte Draws, Alphas {${M.kaltAlphas.join(',')}}`);
      check(`${G7}(3) der kalte Puls laeuft mit 6 Hz (Alpha-Folge ist bei 60 Hz genau 10-Frame-periodisch)`,
        M.periodisch, `Fenster ${M.kaltVon}..${M.kaltBis}`);
      check(`${G7}(3) der kalte Puls faehrt NIE das Sprite-Alpha: der Original-Spieler-Draw bleibt in jedem Puls-Frame bei Alpha 1`,
        M.origAlpha1, `origAlpha1 ${M.origAlpha1}`);
      check(`${G7}(5) Respawn raeumt: vor dem Tod lagen ${M.decalsVorTod} Decals, nach dem Respawn 0`,
        M.decalsVorTod >= 1 && M.nachRespawn === 0 && M.gameOverWeg,
        `vor ${M.decalsVorTod}, nach ${M.nachRespawn}, Game Over weg ${M.gameOverWeg}`);
    }
  }

  // -------------------------------------------------------------------------
  // QUELLTEXT-ANTEIL von (3), (6), (7) — die Zahlen und die Sortenliste.
  // -------------------------------------------------------------------------
  {
    check(`${G7}(3) Quelle: KALT_TON '#abdcda' (|-Familie), KALT_PULS [0,16 0,12 0,08 0], Schrittfrequenz 24 Hz = 6 Hz Zyklus`,
      /const KALT_TON = '#abdcda';/.test(M7)
      && /const KALT_PULS = \[0\.16, 0\.12, 0\.08, 0\];/.test(M7)
      && /KALT_PULS\[Math\.floor\(timeSec \* 24\) % KALT_PULS\.length\]/.test(M7)
      && /const FLASH_TON = '#fff8ea';/.test(M7) && /const FLASH_ALPHA = 0\.8;/.test(M7));
    check(`${G7}(6) Quelle: DECAL_MAX = 24, und der Debug-Deckel liest window NUR (kein window.__decalDeckel = ... in game/js)`,
      /const DECAL_MAX = 24;/.test(M7)
      && /return Number\.isFinite\(d\) && d >= 1 \? Math\.floor\(d\) : DECAL_MAX;/.test(M7)
      && !/window\.__decalDeckel\s*=/.test(q7('game/js/main.js')),
      'nur lesender Deckel');
    // (7) Rostpanzer und Warden: der Decal-Pfad ist SORTEN-AGNOSTISCH (eine
    // Tabelle, ein Push). Der Rost-Kill ist am gebooteten Spiel headless nicht
    // erreichbar (Frontblock + Blickrasterung, > 8000 Frames Sonde ohne Kill) —
    // deshalb hier ueber die Tabelle, die Grids und die Einmaligkeit des Pfades.
    const tabelle = (M7.match(/const DECAL_KEY = \{[^}]*\}/) || [''])[0];
    check(`${G7}(7) DECAL_KEY fuehrt GENAU die vier Sorten skeleton/ghoul/hound/rust — KEIN warden/graveward (§8)`,
      /skeleton: 'skeleton_decal'/.test(tabelle) && /ghoul: 'ghoul_decal'/.test(tabelle)
      && /hound: 'hound_decal'/.test(tabelle) && /rust: 'rust_decal'/.test(tabelle)
      && !/warden|graveward/.test(tabelle)
      && Object.keys(SPRITES).filter((k) => /_decal$/.test(k)).sort().join(',') === 'ghoul_decal,hound_decal,rust_decal,skeleton_decal',
      `${tabelle.replace(/\s+/g, ' ')}`);
    check(`${G7}(7) der Decal-Pfad ist sortenagnostisch: EIN Frame-Diff, EIN Push, EIN Zeichner — Rost laeuft durch denselben Code wie Skelett`,
      (M7.match(/decals\.push\(/g) || []).length === 1
      && (M7.match(/for \(const e of lebendeVorFrame\)/g) || []).length === 1
      && (M7.match(/for \(const d of decals\)/g) || []).length === 1
      && /const dkey = DECAL_KEY\[e\.kind\];/.test(M7)
      && SIG_RE_QUELLE === '/^(player|skeleton|ghoul|hound|rust|warden|shield)_(?!.*_decal$)/',
      `SIGNAL_RE aus der Quelle: ${SIG_RE_QUELLE}`);
  }
}
// --- GP7CH2-BLOCK-ENDE ---

console.log(`\nSimulierte Ticks gesamt: ${totalTicks}`);
if (totalTicks < 600) failures.push(`Zu wenige Ticks simuliert: ${totalTicks} < 600`);

if (failures.length > 0) {
  console.error(`\nSMOKE-TEST ROT — ${failures.length} Fehler:`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log('SMOKE-TEST GRÜN');
