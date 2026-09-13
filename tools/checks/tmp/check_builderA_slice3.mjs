// Wegwerf-Selbsttest Builder A (Slice 3): progression.js, coords.js,
// map_fluestergruft.js, map_bosskammer.js, maps.js (+ portalBlocked).
// boss.js wird oben importiert, damit createEnemy('graveward') registriert ist
// (Import-Reihenfolge-Abhaengigkeit, wie im echten Smoke-Test).
import '../game/js/entities/boss.js';
import { createTilemap } from '../game/js/world/tilemap.js';
import { createEnemy } from '../game/js/entities/enemies.js';
import {
  MAPS, GRAVEYARD, CATACOMBS, portalBlocked, tc, tileRect,
} from '../game/js/world/maps.js';
const { FLUESTERGRUFT, BOSS_KAMMER } = MAPS;
import {
  XP_THRESHOLDS, LEVEL_CAP, createProgress, grantXp, applyProgress,
} from '../game/js/items/progression.js';

let pass = 0; const FAIL = [];
const ok = (name, cond, info = '') => { if (cond) pass++; else FAIL.push(`${name} ${info}`); };
const box = (c, w, h) => ({ x: c.x - w / 2, y: c.y - h / 2, w, h });
const aabbOverlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

// --- coords.js ---
ok('tc Zentrum', tc(3, 5).x === 56 && tc(3, 5).y === 88);
ok('tileRect', JSON.stringify(tileRect(2, 1, 2, 1)) === JSON.stringify({ x: 32, y: 16, w: 32, h: 16 }));

// --- progression.js (§4.31) ---
ok('XP_THRESHOLDS', JSON.stringify(XP_THRESHOLDS) === JSON.stringify([0, 20, 50, 90, 140]));
ok('LEVEL_CAP 5', LEVEL_CAP === 5);
{
  const p = createProgress();
  ok('createProgress Plain-JSON', JSON.stringify(p) === '{"xp":0,"level":1,"hearts":0}'
    && Object.getPrototypeOf(p) === Object.prototype);
  ok('JSON-Roundtrip', JSON.stringify(JSON.parse(JSON.stringify(createProgress()))) === '{"xp":0,"level":1,"hearts":0}');
}
{ const p = createProgress(); const u = grantXp(p, 19); ok('19 XP -> Level 1', p.level === 1 && u === 0); }
{ const p = createProgress(); const u = grantXp(p, 20); ok('20 XP -> Level 2', p.level === 2 && u === 1); }
{ const p = createProgress(); const u = grantXp(p, 140); ok('140 XP -> Level 5', p.level === 5 && u === 4); }
{ const p = createProgress(); grantXp(p, 500); ok('Cap 5, xp sammelt weiter', p.level === 5 && p.xp === 500); }
{ // schrittweise
  const p = createProgress(); let t = 0;
  t += grantXp(p, 20); t += grantXp(p, 30); t += grantXp(p, 40); t += grantXp(p, 50);
  ok('kumulativ 20/50/90/140 -> Level 5 in 4 Ups', p.level === 5 && t === 4);
}
{ // applyProgress: L4 + 1 Herz, Basis 6 -> 14; Eingabe unveraendert
  const base = { maxHp: 6, dmg: 2, reach: 20 };
  const prog = { xp: 0, level: 4, hearts: 1 };
  const out = applyProgress(base, prog);
  ok('applyProgress L4+1Herz -> maxHp 14', out.maxHp === 14);
  ok('applyProgress fasst nur maxHp an', out.dmg === 2 && out.reach === 20);
  ok('applyProgress Eingabe unveraendert', base.maxHp === 6);
}
{ const out = applyProgress({ maxHp: 6 }, { level: 1, hearts: 0 }); ok('L1/0 Herz -> maxHp 6', out.maxHp === 6); }
{ const out = applyProgress({ maxHp: 6 }, { level: 5, hearts: 1 }); ok('L5+1Herz -> maxHp 16 (max via Affix 18)', out.maxHp === 16); }

// --- Maps: 5 Stueck, Portal-Kette ---
// S6-§7B(7) SANKTION (SPEC Slice 6 §7.B(7)): Slice 6 haengt die FUENFTE Karte
// DORF (Gramfeld, world/map_dorf.js) ans Ende von MAPS. Die vier Bestandskarten
// werden weiter EINZELN geprueft — nur der Zaehler wandert 4 -> 5.
ok('MAPS hat 5 Eintraege', Object.keys(MAPS).length === 5
  && MAPS.GRAVEYARD && MAPS.CATACOMBS && MAPS.FLUESTERGRUFT && MAPS.BOSS_KAMMER && MAPS.DORF);

// AABB je kind (aus enemies.js)
function enemyBox(s) { const e = createEnemy(s); return { x: e.x, y: e.y, w: e.w, h: e.h }; }

for (const [name, def] of Object.entries(MAPS)) {
  // Legende
  let bad = null;
  for (const row of def.rows) for (const ch of row) if (!def.legend[ch]) bad = ch;
  ok(`${name}: Legende deckt Zeichen`, bad === null, bad ? `'${bad}'` : '');
  const m = createTilemap(def.rows, def.legend);
  // Rand solide
  let openB = null;
  for (let tx = 0; tx < m.wTiles; tx++) {
    if (!m.isSolidAt(tx * 16 + 8, 8)) openB = `(${tx},0)`;
    if (!m.isSolidAt(tx * 16 + 8, m.hPx - 8)) openB = `(${tx},${m.hTiles - 1})`;
  }
  for (let ty = 0; ty < m.hTiles; ty++) {
    if (!m.isSolidAt(8, ty * 16 + 8)) openB = `(0,${ty})`;
    if (!m.isSolidAt(m.wPx - 8, ty * 16 + 8)) openB = `(${m.wTiles - 1},${ty})`;
  }
  ok(`${name}: Rand solide`, openB === null, openB || '');
  // Fackeln > 0
  const torches = def.torchChars.flatMap((ch) => m.findTiles(ch));
  ok(`${name}: Fackeln > 0`, torches.length > 0, `n=${torches.length}`);
  // Spieler-Spawn frei
  ok(`${name}: Spieler-Spawn frei`, !m.rectCollides(box(def.playerSpawn, 12, 14)));
  // Legacy-Arrays begehbar
  ok(`${name}: Skelett-Spawns frei`, def.skeletonSpawns.every((s) => !m.rectCollides(box(s, 12, 14))));
  ok(`${name}: Ghul-Spawns frei`, def.ghoulSpawns.every((s) => !m.rectCollides(box(s, 14, 14))));
  // Prop-Spawns begehbar
  ok(`${name}: Prop-Spawns frei`, def.propSpawns.every((s) =>
    !m.rectCollides(box(s, s.kind === 'chest' ? 16 : 12, s.kind === 'chest' ? 14 : 12))));
  // enemySpawns begehbar mit gueltigem kind (inkl. graveward via boss.js)
  let badE = null;
  for (let i = 0; i < (def.enemySpawns || []).length; i++) {
    try { if (m.rectCollides(enemyBox(def.enemySpawns[i]))) badE = `Spawn ${i} solide`; }
    catch (e) { badE = `Spawn ${i} kind '${def.enemySpawns[i].kind}' ungueltig: ${e.message}`; }
  }
  ok(`${name}: enemySpawns begehbar+gueltig`, badE === null, badE || '');
  // Portale
  for (const p of def.portals) {
    ok(`${name}: Portal-target '${p.target}' existiert`, !!MAPS[p.target]);
    if (!MAPS[p.target]) continue;
    const tm = createTilemap(MAPS[p.target].rows, MAPS[p.target].legend);
    const sb = box(p.spawn, 12, 14);
    ok(`${name}->${p.target}: Ziel-Spawn begehbar`, !tm.rectCollides(sb));
    ok(`${name}->${p.target}: Ziel-Spawn NICHT im Gegenportal`,
      !MAPS[p.target].portals.some((p2) => aabbOverlap(sb, p2)));
  }
}

// Elite-Flags nur FLUESTERGRUFT
for (const [name, def] of Object.entries(MAPS)) {
  const elites = (def.enemySpawns || []).filter((s) => s.elite);
  if (name === 'FLUESTERGRUFT') ok('FLUESTERGRUFT hat Elite-Spawns', elites.length === 4);
  else ok(`${name}: keine Elite-Spawns`, elites.length === 0);
}

// FLUESTERGRUFT: 15 Gegner, 64 XP (Basiswerte skel2/ghoul4/hound5/rust6, Elite x2)
{
  const XPB = { skeleton: 2, ghoul: 4, hound: 5, rust: 6 };
  const es = FLUESTERGRUFT.enemySpawns;
  ok('FLUESTERGRUFT 15 Gegner', es.length === 15);
  const total = es.reduce((a, s) => a + XPB[s.kind] * (s.elite ? 2 : 1), 0);
  ok('FLUESTERGRUFT Summe 64 XP', total === 64, `=${total}`);
  const counts = es.reduce((a, s) => (a[s.kind + (s.elite ? '*' : '')] = (a[s.kind + (s.elite ? '*' : '')] || 0) + 1, a), {});
  ok('FLUESTERGRUFT Besatzung 5skel/3ghoul/2hound/1rust + 2skel*/1ghoul*/1hound*',
    counts.skeleton === 5 && counts.ghoul === 3 && counts.hound === 2 && counts.rust === 1
    && counts['skeleton*'] === 2 && counts['ghoul*'] === 1 && counts['hound*'] === 1, JSON.stringify(counts));
}

// FLUESTERGRUFT Truhen-Inhalte
{
  const chests = FLUESTERGRUFT.propSpawns.filter((p) => p.kind === 'chest');
  ok('FLUESTERGRUFT: 1 boss_key + 1 heart Truhe',
    chests.filter((c) => c.content === 'boss_key').length === 1
    && chests.filter((c) => c.content === 'heart').length === 1);
  const vasesUrns = FLUESTERGRUFT.propSpawns.filter((p) => p.kind === 'vase' || p.kind === 'urn');
  ok('FLUESTERGRUFT: 10-12 Vasen/Urnen', vasesUrns.length >= 10 && vasesUrns.length <= 12, `=${vasesUrns.length}`);
}

// BOSS_KAMMER: 4 Add-Anker begehbar (Skelett-AABB 12x14), Boss-Spawn, Innenflaeche propfrei
{
  const m = createTilemap(BOSS_KAMMER.rows, BOSS_KAMMER.legend);
  const anchors = [tc(4, 3), tc(15, 3), tc(4, 8), tc(15, 8)];
  ok('BOSS_KAMMER: 4 Add-Anker begehbar', anchors.every((a) => !m.rectCollides(box(a, 12, 14))));
  ok('BOSS_KAMMER: Innenflaeche propfrei', BOSS_KAMMER.propSpawns.length === 0);
  ok('BOSS_KAMMER: genau 1 graveward-Spawn', BOSS_KAMMER.enemySpawns.filter((s) => s.kind === 'graveward').length === 1);
  ok('BOSS_KAMMER: Siegtruhen-Anker tc(10,4) begehbar', !m.rectCollides(box(tc(10, 4), 16, 14)));
}

// --- CATACOMBS/GRAVEYARD Regression + Umwidmung ---
ok('GRAVEYARD weiterhin 6 Skelette', GRAVEYARD.skeletonSpawns.length === 6);
{
  const chests = CATACOMBS.propSpawns.filter((p) => p.kind === 'chest');
  ok('CATACOMBS: genau 1 gold + 1 boomerang, KEINE treasure',
    chests.filter((c) => c.content === 'gold').length === 1
    && chests.filter((c) => c.content === 'boomerang').length === 1
    && chests.filter((c) => (c.content ?? 'treasure') === 'treasure').length === 0);
  ok('CATACOMBS: Portal zur FLUESTERGRUFT existiert',
    CATACOMBS.portals.some((p) => p.target === 'FLUESTERGRUFT'));
}

// --- portalBlocked (§4.33) ---
{
  const key = { requires: 'boss_key' };
  const boss = { bossLocked: true };
  const noKeyPlayer = { inv: { zelda: [] } };
  const keyPlayer = { inv: { zelda: ['boomerang', 'boss_key'] } };
  ok('requires ohne Schluessel -> locked', portalBlocked(key, noKeyPlayer, []) === 'locked');
  ok('requires mit Schluessel -> null', portalBlocked(key, keyPlayer, []) === null);
  ok('bossLocked + graveward stalk -> sealed',
    portalBlocked(boss, keyPlayer, [{ kind: 'graveward', state: 'stalk' }]) === 'sealed');
  ok('bossLocked + graveward idle -> null (Fluchtklausel)',
    portalBlocked(boss, keyPlayer, [{ kind: 'graveward', state: 'idle' }]) === null);
  ok('bossLocked + graveward die -> null',
    portalBlocked(boss, keyPlayer, [{ kind: 'graveward', state: 'die' }]) === null);
  ok('bossLocked ohne graveward -> null', portalBlocked(boss, keyPlayer, []) === null);
  ok('kein requires/bossLocked -> null', portalBlocked({}, noKeyPlayer, []) === null);
}

// ?map=FLUESTERGRUFT / ?map=BOSS_KAMMER Schluessel korrekt (URL-Param nutzt MAPS-Key)
ok('MAPS-Keys = URL-Param-Ziele', 'FLUESTERGRUFT' in MAPS && 'BOSS_KAMMER' in MAPS);

console.log(`\n${pass} Pruefungen bestanden.`);
if (FAIL.length) { console.log('FEHLER:'); for (const f of FAIL) console.log('  X', f); process.exit(1); }
console.log('ALLE GRUEN');
