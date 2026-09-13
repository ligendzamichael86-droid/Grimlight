// GP7-CH-2 P0.f ENGINE-VORPROBE — Patch-Generator.
// Liest den UNVERAENDERTEN Klon ./vorher/game/js und schreibt den gepatchten
// Klon ./nachher/game/js. Das Original /home/coder/Grimlight/game/js wird
// weder gelesen noch geschrieben (nur ueber den Klon vorher/).
import fs from 'node:fs';
import path from 'node:path';

const HIER = path.dirname(new URL(import.meta.url).pathname);
const VOR = path.join(HIER, 'vorher', 'game', 'js');
const NACH = path.join(HIER, 'nachher', 'game', 'js');

const lies = (rel) => fs.readFileSync(path.join(VOR, rel), 'utf8');
const schreib = (rel, s) => fs.writeFileSync(path.join(NACH, rel), s);
let n = 0;
function ersetze(src, alt, neu, wo) {
  const i = src.indexOf(alt);
  if (i < 0) throw new Error(`ANKER FEHLT (${wo}): ${alt.slice(0, 70)}`);
  if (src.indexOf(alt, i + 1) >= 0) throw new Error(`ANKER MEHRDEUTIG (${wo}): ${alt.slice(0, 70)}`);
  n += 1;
  return src.slice(0, i) + neu + src.slice(i + alt.length);
}

// ===========================================================================
// 1) art/sprites_figuren.js — vier *_decal-Keys ANS ENDE (E-A4, §0.2).
//    VORPROBE-PROVISORIUM: Inhalt = das jeweilige *_die-Grid. Phase 1 ersetzt
//    die Daten durch echte flache Boden-Grids (Messziel <= 6 Zeilen,
//    <= 25 % Rahmen, Texel-Diff >= 30 % gegen *_die).
//    KEINE Flip-Keys (E-A4: Leichen haben keine Blickrichtung).
//    Warden: KEIN Decal (§8).
// ===========================================================================
{
  const src = lies('art/sprites_figuren.js');
  const blockVon = (key) => {
    const a = src.indexOf(`\n  ${key}: [\n`);
    if (a < 0) throw new Error(`Grid ${key} nicht gefunden`);
    const b = src.indexOf('\n  ],\n', a);
    if (b < 0) throw new Error(`Grid ${key} ohne Ende`);
    return src.slice(a + 1, b + 6); // "  key: [\n ... \n  ],\n"
  };
  let anhang = '';
  for (const kind of ['skeleton', 'ghoul', 'hound', 'rust']) {
    anhang += blockVon(`${kind}_die`).replace(`  ${kind}_die: [`, `  ${kind}_decal: [`);
  }
  const kopf = `
  // =========================================================================
  // GP7-CH-2 §4/V7/E-A4 — BODEN-DECALS (Stufe 2 des zweistufigen Sterbens).
  // EIGENE KEYS, ANS ENDE (§0.2: die Bestandsreihenfolge ist eingefroren;
  // Object.keys ist in allen Rigs live gelesen -> anhaengen ist folgenlos).
  // KEINE *_decal_flip-Keys: eine Leiche traegt keine Blickrichtung
  // (E-A4; damit bleibt die 37er-Flip-Liste main.js:106-128 und smoke:6396
  // unangetastet).
  // KEIN warden_decal (§8: der Boss bekommt keines).
  // VORPROBE-STAND (P0.f): die Grids sind noch die *_die-Grids. Phase 1
  // ersetzt sie durch flache Boden-Zeichen (E-B9: <= 6 Zeilen UND <= 40 %
  // der Basisgrid-Hoehe, Hund <= 4 Zeilen im Band 8-11; E-A4: messbarer
  // Unterschied zu *_die).
  // =========================================================================
`;
  const neu = ersetze(src, '\n};\n', `\n${kopf}${anhang}};\n`, 'sprites_figuren Ende');
  schreib('art/sprites_figuren.js', neu);
}

// ===========================================================================
// 2) entities/*.js — die DREI sanktionierten Blink-Zeilen (§5(1), E-A1).
// ===========================================================================
{
  const e = lies('entities/enemies.js');
  schreib('entities/enemies.js', ersetze(e,
    "    if (e.hurtTimer > 0 && Math.floor(timeSec * 20) % 2 === 0) return false; // Blitzen\n",
    '', 'enemies.js:620'));
}
{
  const b = lies('entities/boss.js');
  schreib('entities/boss.js', ersetze(b,
    "  // Hurt-Blitzen wie im generischen Pfad (nicht im Sterben).\n"
    + "  if (e.state !== 'die' && e.hurtTimer > 0 && Math.floor(timeSec * 20) % 2 === 0) return true;\n",
    '', 'boss.js:323-324'));
}
{
  const p = lies('entities/player.js');
  schreib('entities/player.js', ersetze(p,
    "    // Unverwundbar: Blinken (jeden zweiten Intervall unsichtbar)\n"
    + "    if (player.state !== 'dead' && player.invulnTimer > 0 && Math.floor(timeSec * 12) % 2 === 0) {\n"
    + '      return;\n'
    + '    }\n',
    '', 'player.js:228-231'));
}

// ===========================================================================
// 3) main.js
// ===========================================================================
let m = lies('main.js');

// --- 3a) EAGER SIGNAL-CANVASES, NACH dem TILE_ART-Bau (main.js:131) --------
m = ersetze(m,
  'const tiles = buildAll(TILE_ART, PALETTE);\n',
  `const tiles = buildAll(TILE_ART, PALETTE);

// ===========================================================================
// GP7-CH-2 §4 / E-A2 / E-A3 — SIGNAL-CANVASES (FLASH + KALTE UNVERWUNDBARKEIT)
//
// WARUM HIER UND NICHT LAZY: .tmp/check_engineB_gp6.mjs:114 haelt JEDES nach
// dem Boot erzeugte kleine Canvas fuer eine Tint-Maske und prueft es gegen die
// Alpha-Whitelist (:145-148) und die __noTint-Kontrolle (:238-240). Ein Flash
// mit Alpha 0,8 waere dort rot. Alles, was VOR dem ersten rAF-Callback
// entsteht, liegt unter boot (check_engineB_gp6:79) und ist gate-frei. Und
// weil der Block NACH dem tiles-Bau steht, landen die neuen Canvases in sechs
// Reihenfolge-Rigs HINTER TILE_ART und bekommen dort den Namen extra_N
// (check_main_slice1:106, check_inventory_slice2:151, check_save_slice4:194,
// smoke:5563, smoke:6453, check_engineB_gp6:82) — kein Name verschiebt sich.
//
// E-A2 MASKE IST GEOMETRISCH: Kontur-Texel (E5: opaker Texel mit >= 1
// transparentem 4er-Nachbarn ODER an der Rahmenkante) werden auf '.' gesetzt.
// Der Tonfilter k/n taugt nicht: er liesse den Held-Umriss zu 47 % weiss
// ausbrennen und riss 19-33 Loecher ins Innere (Review Linse 1 M1, gemessen).
// Der Flash fuellt also den INNENRAUM, der Umriss bleibt stehen.
const FLASH_TON = '#fff8ea';   // E-A2: L 248,5 -> >= 12 L ueber jedem Koerperton
const KALT_TON = '#abdcda';    // E-A3: die |-Familie (kalt = geschuetzt)
const FLASH_ALPHA = 0.8;       // E-A2
// E-A3: der Unverwundbarkeits-Puls nimmt NUR diese Werte an (6 Hz = ein
// voller Durchlauf je 1/6 s, also Schrittfrequenz 24 Hz).
const KALT_PULS = [0.16, 0.12, 0.08, 0];
// Wer ueberhaupt blitzen darf. sword_slash_*, npc_* (inkl. npc_blase), Drops,
// Projektile und Requisiten stehen NICHT drin (§4: "blitzen nie"); die
// *_decal-Grids ebenfalls nicht (eine Leiche blitzt nicht).
const SIGNAL_RE = /^(player|skeleton|ghoul|hound|rust|warden|shield)_(?!.*_decal$)/;

// E5-KONTUR -> '.': liefert das Grid OHNE seine Kontur.
function innenGrid(grid) {
  const h = grid.length;
  const w = grid[0].length;
  const out = [];
  for (let y = 0; y < h; y++) {
    let zeile = '';
    for (let x = 0; x < w; x++) {
      const c = grid[y][x];
      if (c === '.') { zeile += '.'; continue; }
      const kontur = x === 0 || y === 0 || x === w - 1 || y === h - 1
        || grid[y - 1][x] === '.' || grid[y + 1][x] === '.'
        || grid[y][x - 1] === '.' || grid[y][x + 1] === '.';
      zeile += kontur ? '.' : c;
    }
    out.push(zeile);
  }
  return out;
}

// Registry Canvas -> { flash, kalt }. Schluessel ist das gfx-ORIGINAL-Canvas
// (auch das _flip-Canvas), damit die Fassade beim drawImage direkt trifft.
const SIGNAL_REG = new Map();
for (const name of Object.keys(gfx)) {
  const flip = name.endsWith('_flip');
  const basis = flip ? name.slice(0, -5) : name;
  if (!SIGNAL_RE.test(basis)) continue;
  const roh = SPRITES[basis];
  if (!roh) continue;
  const innen = innenGrid(flip ? roh.map((r) => [...r].reverse().join('')) : roh);
  SIGNAL_REG.set(gfx[name], {
    flash: buildTintMask(innen, PALETTE, FLASH_TON, FLASH_TON, 'L'),
    kalt: buildTintMask(innen, PALETTE, KALT_TON, KALT_TON, 'L'),
  });
}
`, 'main.js tiles-Anker');

// buildTintMask muss importiert sein (heute nur buildSprite/buildAll?)
if (!/buildTintMask/.test(m.slice(0, 4000))) {
  m = ersetze(m,
    "import { buildAll, buildSprite, buildTintMask } from './core/sprite_factory.js';",
    "import { buildAll, buildSprite, buildTintMask } from './core/sprite_factory.js';",
    'Import-Kontrolle');
}

// --- 3b) FLANKEN-ZAEHLER (E-A1) neben TINT_PREV ----------------------------
m = ersetze(m,
  'const TINT_PREV = new WeakMap();\n',
  `const TINT_PREV = new WeakMap();

// ===========================================================================
// GP7-CH-2 E-A1 — FLANKEN-ZAEHLER DES TREFFER-FLASHS.
//
// NICHT \`hurtTimer > 0\`: der die-Zweig enemies.js:441-451 macht \`continue\`
// VOR der Dekrementzeile :453, der dead-Zweig player.js:98-101 kehrt vor :110
// zurueck — beide Timer FRIEREN also ein (gemessen: 0,200 ueber alle 25
// Sterbeframes; invulnTimer 1,000 dauerhaft nach dem Game Over). Eine
// timergekoppelte Flash-Bedingung wuerde jede Leiche dauerblitzen lassen.
//
// Stattdessen: die FLANKE 0 -> >0 setzt einen Frame-Zaehler (Muster
// AUDIO_HURT/audioInvuln, main.js:1008/1653). Er wird im ZEICHENPFAD
// dekrementiert (pushTinted, einmal je Entity und Frame) und NICHT im
// Update-Zweig — der Hitstop-Zweig main.js:2021-2028 ueberspringt das Update
// komplett, ein dort gefuehrter Zaehler froehre mit ein.
// Dauer = Hitstop + 1: 3 Frames beim Treffer (HITSTOP_H 2), 4 beim Kill
// (HITSTOP_K 3).
const FLASH_REST = new WeakMap();   // Entity -> verbleibende Flash-Frames
const FLASH_VOR = new WeakMap();    // Entity -> Timerwert des Vorframes
const FLASH_TREFFER = 3;
const FLASH_KILL = 4;
`, 'TINT_PREV');

// --- 3c) DECAL-ZUSTAND (E-A4) ---------------------------------------------
m = ersetze(m,
  "let lights = [];       // Fackeln + Spieler-Laterne (letzter Eintrag)\n",
  `let lights = [];       // Fackeln + Spieler-Laterne (letzter Eintrag)
// GP7-CH-2 §4/V7/E-A4 — BODEN-DECALS (Stufe 2 des Sterbens).
// FLACHE LISTE OHNE UPDATE: der einzige Schreiber ist der Frame-Diff hinter
// updateEnemies, der einzige Leser der Zeichner. Kein Event, keine Mutation
// an enemies/drops/player, kein Timer — DIE_TIME, dieTimer, spawnDeathDrops,
// events und enemies.splice bleiben byte-gleich (§0.6).
let decals = [];
// Diff-Menge des Vorframes. enemies.js:448 ist der EINZIGE splice im Projekt,
// das Verschwinden einer Entity ist also exakt der Todeszeitpunkt.
let lebendeVorFrame = new Set();
const DECAL_MAX = 24;                // §5(5) Deckel; aeltestes faellt
// Nur diese vier Sorten bekommen ein Decal (§8: Warden ohne).
const DECAL_KEY = { skeleton: 'skeleton_decal', ghoul: 'ghoul_decal', hound: 'hound_decal', rust: 'rust_decal' };
// Tint des TODESMOMENTS, einmal eingefroren (E-A4: Leichen behalten das Licht
// ihres Todesmoments — deklariert, CH-4-Revision).
const DECAL_TINT = new WeakMap();
`, 'decal-Zustand');

// --- 3d) buildWorld raeumt BEIDE Listen in derselben Zeile (E-A4) ----------
m = ersetze(m,
  '      .map(createEnemy),\n  ];\n',
  `      .map(createEnemy),
  ];
  // GP7-CH-2 E-A4 (Review Linse 1 B2, gemessen): buildWorld raeumt \`decals\`
  // UND \`lebendeVorFrame\`. Ohne das zweite liefe der Frame-Diff im ersten
  // freien Frame gegen das Gegner-Set der ALTEN Karte und erzeugte 7-17
  // Phantom-Decals je Kartenwechsel (und 8 je Respawn) — das DORF-Gate
  // smoke:6612 ist praefixgebunden und wuerde davon rot.
  decals.length = 0; lebendeVorFrame = new Set();
`, 'buildWorld raeumt');

// --- 3e) FRAME-DIFF direkt hinter updateEnemies (E-A4) ---------------------
m = ersetze(m,
  '      updateEnemies(dt, enemies, player, map, drops, events);\n',
  `      updateEnemies(dt, enemies, player, map, drops, events);
      // GP7-CH-2 §4/V7/E-A4 — DECAL-UEBERGABE. Steht im else-Zweig DIREKT
      // hinter updateEnemies und damit nie ueber einer buildWorld-Grenze:
      // wer im Vorframe lebte und jetzt nicht mehr in \`enemies\` steht, wurde
      // in enemies.js:448 gesplict, also nach Ablauf von dieTimer. Drops, XP,
      // 'enemy_died', 'boss_died', Kill-Zaehler und HITSTOP_K feuern am
      // identischen Tick wie vorher — hier wird NUR gelesen.
      for (const e of lebendeVorFrame) {
        if (enemies.includes(e)) continue;
        const dkey = DECAL_KEY[e.kind];
        if (!dkey || !gfx[dkey]) continue;   // Warden (§8) und Unbekanntes: keins
        const dt0 = DECAL_TINT.get(e) || { warmA: 0, kaltA: 0, seite: 'WL' };
        decals.push({ key: dkey, x: e.x, y: e.y, w: e.w, h: e.h, warmA: dt0.warmA, kaltA: dt0.kaltA, seite: dt0.seite });
      }
      if (decals.length > DECAL_MAX) decals.splice(0, decals.length - DECAL_MAX);
      lebendeVorFrame = new Set(enemies);
`, 'frame-diff');

// --- 3f) tintCfg um die beiden Signalfelder ---------------------------------
m = ersetze(m,
  "const tintCfg = { on: false, warmA: 0, kaltA: 0, seite: 'WL' };",
  "const tintCfg = { on: false, warmA: 0, kaltA: 0, seite: 'WL', flash: 0, invuln: 0 };",
  'tintCfg');

// --- 3g) tintDrawImage: Signalstufe GANZ ZULETZT ---------------------------
m = ersetze(m,
  `  const wA = tintCfg.warmA;
  const kA = tintCfg.kaltA;
  if (wA <= 0 && kA <= 0) return;`,
  `  const wA = tintCfg.warmA;
  const kA = tintCfg.kaltA;
  // GP7-CH-2: der fruehe Ausstieg darf die SIGNAL-Stufe nicht verschlucken —
  // eine voll ausgeleuchtete Figur hat warmA = kaltA = 0 und blitzt trotzdem.
  if (wA <= 0 && kA <= 0) { signalDrawImage(img, a); return; }`,
  'tintDrawImage frueh-return');

m = ersetze(m,
  `  ctx.globalCompositeOperation = vorG;
  if (vorA !== 1) ctx.globalAlpha = vorA;
}
`,
  `  ctx.globalCompositeOperation = vorG;
  if (vorA !== 1) ctx.globalAlpha = vorA;
  signalDrawImage(img, a);
}

// GP7-CH-2 §4 / E-A2 / E-A3 — SIGNAL-STUFE.
// ZEICHENREIHENFOLGE (E-A2, bindend): Original -> Kalt -> Warm -> Flash.
// Der Flash ist deshalb der LETZTE Draw. Zoege man ihn vor die Tint-Masken,
// liefe der Rueckwaerts-Scan check_engineB_gp6:132-139 auf ihn als "Original"
// und pruefte dessen Alpha -> rot (Negativkontrolle des Reviews, gemessen).
// Die kalte Unverwundbarkeits-Maske liegt zwischen Warm und Flash: eigene
// Vokabel (E-A3 "warm = getroffen, kalt = geschuetzt"), nie beides zugleich.
function signalDrawImage(img, a) {
  if (tintCfg.flash <= 0 && tintCfg.invuln <= 0) return;
  const sig = SIGNAL_REG.get(img);
  if (!sig) return;    // sword_slash, npc_*, Drops, Projektile, Kacheln, Decals
  const vorA = ctx.globalAlpha;
  const vorG = ctx.globalCompositeOperation;
  ctx.globalCompositeOperation = 'source-over';  // §4.2: NIE 'lighter'
  if (tintCfg.invuln > 0) {
    ctx.globalAlpha = tintCfg.invuln * vorA;
    ctx.drawImage(sig.kalt, ...a);
    ctx.globalAlpha = 1;
  }
  if (tintCfg.flash > 0) {
    ctx.globalAlpha = tintCfg.flash * vorA;
    ctx.drawImage(sig.flash, ...a);
    ctx.globalAlpha = 1;
  }
  ctx.globalCompositeOperation = vorG;
  if (vorA !== 1) ctx.globalAlpha = vorA;
}
`, 'tintDrawImage Ende');

// --- 3h) pushTinted: Flanke lesen, Tint fuers Decal einfrieren -------------
m = ersetze(m,
  `  const pushTinted = (ent, drawFn) => {
    const ax = ent.x + ent.w / 2;
    const ay = ent.y + ent.h - 1;
    const t = tintFor(ent, ax, ay);
    renderables.push({ fy: ent.y + ent.h, ax, ay, tint: true, warmA: t.warmA, kaltA: t.kaltA, seite: t.seite, draw: drawFn });
  };`,
  `  // GP7-CH-2 E-A1 — der Zaehler wird GENAU HIER dekrementiert: pushTinted
  // laeuft einmal je Entity und Frame, im Zeichenpfad, auch waehrend Hitstop
  // und Fade (drawWorld kennt keinen Freeze-Zweig).
  // AUSSCHLUESSE WOERTLICH: Gegner state !== 'die', Spieler state !== 'dead'.
  function signalFor(ent) {
    // Nur Koerper mit einem der beiden Timer koennen ueberhaupt blitzen —
    // NPCs, Requisiten, Drops und Projektile haben keinen.
    if (ent.hurtTimer === undefined && ent.invulnTimer === undefined) return { flash: 0, invuln: 0 };
    const t = Math.max(ent.hurtTimer || 0, ent.invulnTimer || 0);
    const vor = FLASH_VOR.get(ent) || 0;
    if (t > vor + 1e-9) FLASH_REST.set(ent, (ent.hp ?? 1) <= 0 ? FLASH_KILL : FLASH_TREFFER);
    FLASH_VOR.set(ent, t);
    const tot = ent.state === 'die' || ent.state === 'dead';
    let flash = 0;
    const rest = FLASH_REST.get(ent) || 0;
    if (rest > 0) {
      FLASH_REST.set(ent, rest - 1);   // laeuft auch im die/dead-Zustand LEER,
      if (!tot) flash = FLASH_ALPHA;   // gezeichnet wird er dort aber nie
    }
    // E-A3: Unverwundbarkeit ist die KALTE Vokabel, 6 Hz, diskrete Alphas.
    // Sie tritt zurueck, solange der warme Treffer-Flash laeuft.
    let invuln = 0;
    if (!tot && flash === 0 && (ent.invulnTimer || 0) > 0) {
      invuln = KALT_PULS[Math.floor(timeSec * 24) % KALT_PULS.length];
    }
    return { flash, invuln };
  }
  const pushTinted = (ent, drawFn) => {
    const ax = ent.x + ent.w / 2;
    const ay = ent.y + ent.h - 1;
    const t = tintFor(ent, ax, ay);
    DECAL_TINT.set(ent, t);   // E-A4: Tint des Todesmoments einfrieren
    const s = signalFor(ent);
    renderables.push({ fy: ent.y + ent.h, ax, ay, tint: true, warmA: t.warmA, kaltA: t.kaltA, seite: t.seite, flash: s.flash, invuln: s.invuln, draw: drawFn });
  };`,
  'pushTinted');

// --- 3i) DECAL-ZEICHNER vor den Renderables --------------------------------
m = ersetze(m,
  '  const tintTorches = frameLights.filter((l) => (l.flicker || 0) >= 0.8);\n',
  `  const tintTorches = frameLights.filter((l) => (l.flicker || 0) >= 0.8);

  // GP7-CH-2 §4/V7/E-A4 — DECAL-ZEICHNER. VOR den Renderables (die Leiche
  // liegt unter allem, was noch lebt), durch DIESELBE Fassade wie die
  // Entities, mit dem EINGEFRORENEN Tint des Todesmoments.
  // tintCfg.flash/invuln werden explizit auf 0 gesetzt (eine Leiche blitzt
  // nicht), window.__noTint wird genauso respektiert wie in der
  // renderables-Schleife — sonst schluege bei einem Tod in einer Messszene
  // check_engineB_gp6:238-240 zu.
  for (const d of decals) {
    const dimg = gfx[d.key];
    if (!dimg) continue;
    tintCfg.on = !noTint;
    tintCfg.warmA = d.warmA;
    tintCfg.kaltA = d.kaltA;
    tintCfg.seite = d.seite;
    tintCfg.flash = 0;
    tintCfg.invuln = 0;
    tintDrawImage(
      dimg,
      Math.round(d.x + d.w / 2 - dimg.width / 2 - camera.x),
      Math.round(d.y + d.h - dimg.height - camera.y)
    );
  }
  tintCfg.on = false;
`, 'decal-Zeichner');

// --- 3j) renderables-Schleife: Signalfelder setzen + Hygiene ---------------
m = ersetze(m,
  `    tintCfg.seite = r.seite;
    r.draw();`,
  `    tintCfg.seite = r.seite;
    tintCfg.flash = r.flash || 0;
    tintCfg.invuln = r.invuln || 0;
    r.draw();`,
  'renderables-Schleife');

m = ersetze(m,
  '  tintCfg.on = false; // Fassade nach der Schleife neutral (Hygiene wie gco/Alpha)',
  `  tintCfg.on = false; // Fassade nach der Schleife neutral (Hygiene wie gco/Alpha)
  tintCfg.flash = 0;
  tintCfg.invuln = 0;`,
  'Fassaden-Hygiene');

schreib('main.js', m);
console.log(`PATCH OK — ${n} Anker ersetzt.`);
