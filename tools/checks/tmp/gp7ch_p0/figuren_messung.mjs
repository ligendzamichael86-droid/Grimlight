// ============================================================================
// GP7-CH-1 / PHASE 0 / P0.d  —  MESSWERKZEUG "FIGUREN"
// ----------------------------------------------------------------------------
// Besitz: P0.d. Diese Datei + die figuren_*.json/.log-Ausgaben daneben.
// Nichts anderes wird geschrieben. Keine Spieldatei, kein Test, kein Server.
//
// Grundlage (bindend):
//   design/SPEC_GP7CH1.md              (Rev 2, E1 + E5 + E6 woertlich)
//   design/GP7CH1_SPEC_REVIEW.md       (Fix-Formulierungen M5/M6/M7/M8/B1)
//   design/GP7CH_LANDKARTE.md + A/B/C
//
// REV 2.2 M3 (22.08.2026) — MESSWERKZEUG-FIX nach den V-TESTS-Befunden aus
// Versuch 1. Vier Aenderungen, sonst NICHTS:
//   (a) RIM-TOENE kommen aus der MATERIAL-TABELLE (Feld "rim" je Figur ODER
//       Materialflaeche mit art:"rim"). Schweigt die Tabelle, greift ein
//       FALLBACK auf die Rim-Kandidaten Z / _ / | — und genau das steht dann
//       im Log und in der JSON (Feld "rim_quelle"). Frueher war die Liste
//       hartcodiert ({Held:['Z'], Bran:[], ...}) und machte den Rim aller
//       NPCs faelschlich zu 0,0 %, egal was die Kunst lieferte.
//   (b) ALLE Prozentwerte werden mit DREI Nachkommastellen ausgegeben, und
//       JEDES Gate rechnet auf dem UNGERUNDETEN Wert. Frueher verdeckte die
//       eine Nachkommastelle Faelle wie 8,0026 % > 8 %.
//   (c) NEUE LEITPLANKEN-GATES nach Spec Rev 2.2 M2: Held-Koerper-L im Band
//       78,8 +- 8, Frame-Diff-UNTERGRENZEN je Figur (Vorher-Stand = Grenze),
//       alle Frame-Paare ungleich, Solitaer <= 8 % (ungerundet).
//   (d) STAND-MODI --vorher / --nachher / --beides. "vorher" misst den
//       HEAD-Stand (git show HEAD:game/js/art/sprites_figuren.js, gecacht
//       unter vorher_cache/), "nachher" den Working Tree. Die ANKER-KONTROLLE
//       (Review-IST-Werte aus Versuch 0) laeuft NUR im vorher-Modus — auf
//       neuer Kunst ist sie blind, weil die Anker die ALTE Kunst beschreiben.
//
// REV 2.3 G-L + G-C (10.09.2026) — DREI ERGAENZUNGEN, sonst NICHTS:
//   (e) RAMPEN-TABELLE KENNT DIE 14 NEUEN SYMBOL-TOENE (G-L). Bis hierher
//       kannte rampeVon() nur den Bestand; die vier neuen Stofframpen und die
//       zwei Rim-Toene liefen als 'unbekannt:<zeichen>' durch und machten die
//       "dominante Rampe" falsch (Mile las als Holz statt Kittel, Corm als
//       'unbekannt:('). Die Rollen sind WOERTLICH aus game/js/art/palette.js
//       §E3 uebernommen: Krapp ! < G < %, Corm-Wolle & < ( < ), Bran-Leder
//       : < ; < ?, Mile-Kittel @ < [ < ], Held-Stoff u < U < X < ^ < Z
//       (Einschub), Rim _ / |. Ein Selbsttest (rampenSelbsttest) belegt bei
//       JEDEM Lauf, dass kein Ton in zwei Rampen steht, dass alle 14 neuen
//       Toene eine Rampe haben und welche Palettentoene noch ohne sind.
//   (f) SOLITAER-GATE MIT ABZUG (G-C / ANKER-Regel 4). Requisit-, Merkmal-
//       und Rim-Texel sind GEWOLLTE Einzeltexel (Augen, Glanzpunkt, Schnalle,
//       Rimkante) und kein Rauschen. Abgezogen wird, was die MATERIAL-TABELLE
//       als art:"requisit" / art:"merkmal" / art:"rim" deklariert — zusaetzlich
//       das Figur-Feld "merkmal" mit posten[].ton, weil die Phase-1b-Tabellen
//       die Merkmale so liefern. DECKEL: hoechstens 12 Merkmal-Texel je Grid;
//       reisst ein Grid den Deckel, gibt es fuer dieses Grid GAR KEINEN
//       Merkmal-Abzug (volle Zaehlung) plus eine Warnung im Log und in der
//       JSON. Ausgegeben werden BEIDE Werte; das Gate rechnet auf dem
//       BEREINIGTEN, der ROHE steht unveraendert daneben.
//   (g) SEITENLICHT-MESSWERT (ANKER-Regel 1). Je Figur mit Seitenframes
//       (heute nur der Held) die Links/Rechts-dL der Koerpertexel je
//       Seitenframe, Gate |dL| <= 5 L. Lesart siehe Sektion 9 (9); sie
//       reproduziert die Anker-Zahlen "Held 2,6-5,2 gegen 21,4 frontal"
//       EXAKT auf dem Stand d95f3fe, aus dem sie stammen.
//
// REV 2.3 G-N (10.09.2026) — EINE ERGAENZUNG, sonst NICHTS:
//   (h) dE00-ERSATZPFAD RECHNET AUF DER DOMINANTEN MATERIALFLAECHE.
//       Bis hierher lief die E1-Ersatzklausel (dL < 25 gilt als bestanden bei
//       dE00 >= 25) auf der GANZKOERPER-Mittelfarbe. Bei mehrmaterialigen
//       Figuren ist das keine wahrnehmbare Groesse: Corms Kutte steht mit
//       dE00 26,3 gegen den Weg, die Ganzkoerper-Mischung aus Kutte + Haut +
//       Stola + Buch nur mit 22,9 — der Betrachter sieht aber die Kutte.
//       AB JETZT (Spec Rev 2.3 G-N):
//         * BEZUGSFLAECHE = die groesste Flaeche der MATERIAL-TABELLE mit
//           >= 40 Texel; Flaechen mit art "umriss"/"rim"/"requisit"/"merkmal"
//           kommen als Bezugsflaeche NICHT in Frage (sie sind Kante, Licht,
//           Gegenstand oder Einzeltexel-Merkmal, nicht Material).
//         * MITTELFARBE der Flaeche = Mittel der RGB-Werte ueber ALLE opaken
//           Texel ihrer Toene ueber ALLE Grids der Figur — dieselbe Texel-
//           menge, aus der die Material-Tabelle die Dominanz rechnet, damit
//           die im Log genannte Texelzahl und der Messwert dieselbe Groesse
//           beschreiben.
//         * DAS GATE (dE00_ersatz_ok) rechnet auf DIESEM Wert. Der
//           Ganzkoerper-dE00 bleibt unveraendert stehen und wird als
//           dE00_ganzkoerper mitausgegeben (Feld "dE00" ebenfalls, damit die
//           bestehenden Auswertungen weiterlesen).
//         * DAS L-FENSTER BLEIBT AUF KOERPER-L (E5). G-N aendert NUR den
//           dE00-Ersatzpfad, nicht das dL-Fenster, nicht die Leitplanken.
//         * SCHWEIGT die Tabelle oder bleibt keine Flaeche >= 40 Texel uebrig,
//           faellt der Ersatzpfad auf die Ganzkoerper-Mittelfarbe zurueck —
//           ausgewiesen als flaeche_quelle "FALLBACK Ganzkoerper (...)".
//
// GP7-CH-2 P0.a (12.09.2026) — GEGNER-ERWEITERUNG (Spec V10 + Rev 2 E-B1..E-B8).
//   Alles Neue steht in EINEM additiven Block am Dateiende (Marker
//   "GP7-CH-2  P0.a"). Oben wurden genau ZWEI Stellen beruehrt, beide ohne
//   Wirkung auf eine bestehende Ausgabe:
//     * ein zusaetzlicher Import (variantIndex, nur fuer die Zweitlesart der
//       Boden-Leitklassen),
//     * ein OPTIONALER vierter Parameter an rimtoeneAusTabelle() mit der
//       Vorgabe RIM_FALLBACK_KANDIDATEN (= bisheriges Verhalten woertlich).
//   Die Gegner schreiben EIGENE Dateien (gegner_*.json,
//   gegner_messung_<modus>.log); figuren_*.json und
//   figuren_messung_<modus>.log bleiben byte-gleich zum Stand vor der
//   Erweiterung (Beweis liegt im P0.a-Report).
//
// AUFRUF
//   node .tmp/gp7ch_p0/figuren_messung.mjs                 (= --beides)
//   node .tmp/gp7ch_p0/figuren_messung.mjs --vorher        (nur HEAD-Stand)
//   node .tmp/gp7ch_p0/figuren_messung.mjs --nachher       (nur Working Tree)
//   node .tmp/gp7ch_p0/figuren_messung.mjs --beides        (Tabelle + Delta)
//   node .tmp/gp7ch_p0/figuren_messung.mjs --material <pfad.json>
//   node .tmp/gp7ch_p0/figuren_messung.mjs --out <verzeichnis>
//   node .tmp/gp7ch_p0/figuren_messung.mjs --schnell     (ohne dE00-Wuerfelscan)
//   node .tmp/gp7ch_p0/figuren_messung.mjs --vorher-zeiger <git-ref>
//        (Rev 2.3: welcher Stand "vorher" ist. Vorgabe HEAD = unveraendert.
//         Noetig, seit HEAD ueber die Kunst hinausgewachsen ist, die die
//         Review-ANKER beschreiben — die Anker-Kontrolle braucht den Stand
//         75106c7, sonst kontrolliert sie nicht das Werkzeug, sondern misst
//         nur, dass die Kunst inzwischen eine andere ist.)
//
// DETERMINISMUS
//   Keine Zufallsquelle ausser einem festen LCG (Seed 20260816) fuer die
//   Breitenband-Suche; kein Date.now, keine Uhrzeit in den Ausgaben; alle
//   Objektschluessel werden beim Serialisieren sortiert; alle Gleitkommazahlen
//   werden vor der Ausgabe auf feste Stellen gerundet. Zwei Laeufe liefern
//   byte-gleiche Dateien.
//
// NACHZUG RUNDE 2 (12.09.2026, Fable) — ANKER-HINWEIS (V-TESTS R4):
//   Die VORHER-ANKER-KONTROLLE (Teil A 1.1/1.2/7.2/7.3, Teil C 0.3) ist gegen
//   die IST-MATERIAL-TABELLE geeicht (.tmp/gp7ch_p0/gegner_material_IST.json,
//   im Werkzeug MATERIAL_GEGNER_IST). Wird der Lauf mit einer NACHHER-Tabelle
//   gefahren (--material-gegner <pfad>), aendern sich die aufgeloesten
//   RIM-TOENE der Figuren; weil Koerper-L (E5) die Rim-Texel abzieht, sind
//   Abweichungen von rund 1 L bei Koerper-L und bei den Rim-Prozenten im
//   VORHER-Stand ERWARTET und KEIN Werkzeugfehler. Fuer eine saubere
//   Positivkontrolle den Vorher-Stand OHNE --material-gegner messen.
// ============================================================================

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { PALETTE } from '../../game/js/art/palette.js';
import { SPRITES as SPRITES_NACHHER, TILE_ART } from '../../game/js/art/sprites.js';
import { MAPS } from '../../game/js/world/maps.js';
import { DORF } from '../../game/js/world/map_dorf.js';
// GP7-CH-2 P0.a: die Variantenwahl der Bodenkacheln, fuer die ZWEITLESART
// der Leitklassen (Gate-Lesart ist der Legenden-Kunstschluessel, s. u.).
import { variantIndex } from '../../game/js/world/tilemap.js';

const HIER = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HIER, '..', '..');

// ============================================================================
// 0  ARGUMENTE
// ============================================================================
const ARGV = process.argv.slice(2);
function arg(name, fallback) {
  const i = ARGV.indexOf(name);
  return i >= 0 && i + 1 < ARGV.length ? ARGV[i + 1] : fallback;
}
const OUT_DIR = resolve(arg('--out', HIER));
const MATERIAL_PFAD = arg('--material', null);
const SCHNELL = ARGV.includes('--schnell');
// STAND-MODUS (Rev 2.2 M3d). Ohne Flag: --beides.
const MODUS = ARGV.includes('--vorher') ? 'vorher'
  : ARGV.includes('--nachher') ? 'nachher'
    : 'beides';
const STAENDE = MODUS === 'beides' ? ['vorher', 'nachher'] : [MODUS];

// ============================================================================
// 0b  DIE ZWEI STAENDE
//     vorher  = git show HEAD:game/js/art/sprites_figuren.js  (gecachte Kopie
//               unter vorher_cache/, damit der Lauf ohne git-Netzzugriff
//               reproduzierbar bleibt und die Provenienz per sha256 haengt)
//     nachher = der Working Tree (der ganz normale Import oben)
//     PALETTE, TILE_ART, MAPS und DORF kommen fuer BEIDE Staende aus dem
//     Working Tree. Das ist Absicht: die Farbdefinitionen muessen identisch
//     sein, sonst vergleicht man Aepfel mit Birnen. Ob das zulaessig ist,
//     prueft pruefePalette() unten (additiv-only-Regel aus ART_DIRECTION).
// ============================================================================
// Rev 2.3: der vorher-Stand ist waehlbar (Vorgabe HEAD = Verhalten wie bisher).
const VORHER_REF = arg('--vorher-zeiger', 'HEAD');
const VORHER_ZEIGER = VORHER_REF + ':game/js/art/sprites_figuren.js';
const NACHHER_PFAD = 'game/js/art/sprites_figuren.js';
const sha256 = (s) => createHash('sha256').update(s, 'utf8').digest('hex');
function gitZeige(zeiger) {
  return execFileSync('git', ['show', zeiger], { cwd: REPO, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
}
function gitKopf() {
  return execFileSync('git', ['rev-parse', VORHER_REF], { cwd: REPO, encoding: 'utf8' }).trim();
}
async function ladeVorherSprites() {
  const quelltext = gitZeige(VORHER_ZEIGER);
  const cacheDir = resolve(HIER, 'vorher_cache');
  mkdirSync(cacheDir, { recursive: true });
  // Cache-Name haengt am Zeiger: ein Lauf mit --vorher-zeiger darf den
  // HEAD-Cache nicht ueberschreiben (Rev 2.3).
  const p = resolve(cacheDir, 'sprites_figuren_' + VORHER_REF.replace(/[^A-Za-z0-9_.-]/g, '_') + '.js');
  let alt = null;
  try { alt = readFileSync(p, 'utf8'); } catch { alt = null; }
  if (alt !== quelltext) writeFileSync(p, quelltext, 'utf8');   // Cache nur bei Aenderung anfassen
  const mod = await import(pathToFileURL(p).href + '?sha=' + sha256(quelltext).slice(0, 16));
  return { sprites: mod.SPRITES, quelltext, zeiger: VORHER_ZEIGER, commit: gitKopf() };
}
function ladeNachherSprites() {
  const quelltext = readFileSync(resolve(REPO, NACHHER_PFAD), 'utf8');
  return { sprites: SPRITES_NACHHER, quelltext, zeiger: NACHHER_PFAD + ' (Working Tree)', commit: null };
}
// PALETTE-PROVENIENZ: beide Staende rechnen mit der Working-Tree-Palette. Das
// ist nur dann sauber, wenn die Palette gegenueber HEAD REIN ADDITIV ist.
function pruefePalette() {
  let text;
  try { text = gitZeige('HEAD:game/js/art/palette.js'); } catch (e) { return { pruefbar: false, grund: String(e && e.message).split('\n')[0] }; }
  // palette.js schreibt die meisten Schluessel UNQUOTIERT (k: '#14101a') und
  // nur Sonderzeichen quotiert ('_': '#e0c3c3'). Beides muss der Parser sehen;
  // Kommentarzeilen (//) duerfen nicht mitzaehlen.
  const head = {};
  const re = /^[ \t]*(?:'(.)'|([^\s':\/]))[ \t]*:[ \t]*'(#[0-9a-fA-F]{6})'/gm;
  let m;
  while ((m = re.exec(text)) !== null) head[m[1] !== undefined ? m[1] : m[2]] = m[3].toLowerCase();
  const geaendert = [], nurHead = [], neu = [];
  for (const k of Object.keys(head).sort()) {
    if (!(k in PALETTE)) nurHead.push(k);
    else if (String(PALETTE[k]).toLowerCase() !== head[k]) geaendert.push({ ton: k, head: head[k], working_tree: String(PALETTE[k]).toLowerCase() });
  }
  for (const k of Object.keys(PALETTE).sort()) if (!(k in head)) neu.push({ ton: k, hex: PALETTE[k] });
  return {
    pruefbar: true,
    toene_head: Object.keys(head).length,
    toene_working_tree: Object.keys(PALETTE).length,
    geaenderte_hexwerte: geaendert,
    nur_in_head: nurHead,
    neu_im_working_tree: neu,
    additiv_only: geaendert.length === 0 && nurHead.length === 0,
    // Gegenprobe: der Parser muss im Working-Tree-Text GENAU so viele Toene
    // finden wie das importierte PALETTE-Objekt hat. Stimmt das nicht, ist der
    // Parser und nicht die Palette das Problem — und das muss auffallen.
    parser_gegenprobe: (() => {
      const t = readFileSync(resolve(REPO, 'game/js/art/palette.js'), 'utf8');
      const r2 = /^[ \t]*(?:'(.)'|([^\s':\/]))[ \t]*:[ \t]*'(#[0-9a-fA-F]{6})'/gm;
      const gef = new Set();
      let x;
      while ((x = r2.exec(t)) !== null) gef.add(x[1] !== undefined ? x[1] : x[2]);
      const fehlt = Object.keys(PALETTE).filter((k) => !gef.has(k)).sort();
      const zuviel = [...gef].filter((k) => !(k in PALETTE)).sort();
      return { geparst: gef.size, importiert: Object.keys(PALETTE).length, nicht_geparst: fehlt, ueberzaehlig: zuviel, ok: fehlt.length === 0 && zuviel.length === 0 };
    })(),
    lesart: 'Beide Staende rechnen mit der Working-Tree-PALETTE. Gueltig, solange additiv_only=true.',
  };
}

// Der gerade gemessene Stand. setzeStand() schaltet um; ALLE Messfunktionen
// unten lesen diese beiden Bindungen (frueher waren es feste Importe).
let SPRITES = SPRITES_NACHHER;

// ============================================================================
// 1  FARB-BIBLIOTHEK  (identisch zu .tmp/gp7ch_review/color.mjs, damit die
//    Anker des Reviews 1:1 reproduzierbar sind)
// ============================================================================
const hexRGB = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
// L601 = die Helligkeit, in der Teil A/C und das Review rechnen (0..255).
const L601 = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;
const L601hex = (h) => L601(...hexRGB(h));

const _f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
function labRGB(R, G, B) {
  const inv = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const r = inv(R), g = inv(G), b = inv(B);
  const X = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  const Y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const Z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  const fx = _f(X), fy = _f(Y), fz = _f(Z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}
const labHex = (h) => labRGB(...hexRGB(h));
const CabLab = (l) => Math.hypot(l[1], l[2]);
const hueLab = (l) => (Math.atan2(l[2], l[1]) * 180 / Math.PI + 360) % 360;

function dE00(l1, l2) {
  const [L1, a1, b1] = l1, [L2, a2, b2] = l2;
  const C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2), Cb = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Cb ** 7 / (Cb ** 7 + 25 ** 7)));
  const ap1 = (1 + G) * a1, ap2 = (1 + G) * a2;
  const Cp1 = Math.hypot(ap1, b1), Cp2 = Math.hypot(ap2, b2);
  const hp = (b, a) => { if (b === 0 && a === 0) return 0; const h = Math.atan2(b, a) * 180 / Math.PI; return h < 0 ? h + 360 : h; };
  const hp1 = hp(b1, ap1), hp2 = hp(b2, ap2);
  const dL = L2 - L1, dC = Cp2 - Cp1;
  let dh = 0;
  if (Cp1 * Cp2 !== 0) { dh = hp2 - hp1; if (dh > 180) dh -= 360; else if (dh < -180) dh += 360; }
  const dH = 2 * Math.sqrt(Cp1 * Cp2) * Math.sin(dh * Math.PI / 360);
  const Lb = (L1 + L2) / 2, Cpb = (Cp1 + Cp2) / 2;
  let hb;
  if (Cp1 * Cp2 === 0) hb = hp1 + hp2;
  else hb = Math.abs(hp1 - hp2) <= 180 ? (hp1 + hp2) / 2 : (hp1 + hp2 < 360 ? (hp1 + hp2 + 360) / 2 : (hp1 + hp2 - 360) / 2);
  const T = 1 - 0.17 * Math.cos((hb - 30) * Math.PI / 180) + 0.24 * Math.cos(2 * hb * Math.PI / 180)
    + 0.32 * Math.cos((3 * hb + 6) * Math.PI / 180) - 0.20 * Math.cos((4 * hb - 63) * Math.PI / 180);
  const Sl = 1 + 0.015 * (Lb - 50) ** 2 / Math.sqrt(20 + (Lb - 50) ** 2);
  const Sc = 1 + 0.045 * Cpb, Sh = 1 + 0.015 * Cpb * T;
  const dTh = 30 * Math.exp(-(((hb - 275) / 25) ** 2));
  const Rc = 2 * Math.sqrt(Cpb ** 7 / (Cpb ** 7 + 25 ** 7));
  const Rt = -Rc * Math.sin(2 * dTh * Math.PI / 180);
  return Math.sqrt((dL / Sl) ** 2 + (dC / Sc) ** 2 + (dH / Sh) ** 2 + Rt * (dC / Sc) * (dH / Sh));
}

// ============================================================================
// 2  DATENTEIL A  —  FIGUREN UND IHRE GRIDS
//    E5/m21: KOERPER-L mittelt "ueber ALLE Grids der Figur".
//    Held  = alle 17 /^player_/-Keys (E9: 17 Grids).
//    NPC   = _0 / _1 / _talk (3 Grids je Figur).
//    sword_slash_* gehoert nach E9 zum Helden, ist aber KEIN Koerpergrid
//    (Effekt-Sprite ohne Figur) -> als eigene Gruppe mitgemessen, NICHT in der
//    Koerpermittelung. Beide Lesarten stehen in der Ausgabe.
// ============================================================================
// Die Held-Gridliste wird aus den SCHLUESSELN des jeweiligen Standes gebaut —
// ein Stand mit zusaetzlichen player_*-Grids wird dadurch vollstaendig erfasst.
function figurenVon(sprites) {
  const HELD_GRIDS = Object.keys(sprites).filter((k) => /^player_/.test(k)).sort();
  const HELD_KLINGE = Object.keys(sprites).filter((k) => /^sword_slash_/.test(k)).sort();
  return {
    Held:        { grids: HELD_GRIDS, basis: 'player_down_0', talk: null, zusatz: HELD_KLINGE },
    Bran:        { grids: ['npc_bran_0', 'npc_bran_1', 'npc_bran_talk'], basis: 'npc_bran_0', talk: ['npc_bran_0', 'npc_bran_talk'], zusatz: [] },
    Hedda:       { grids: ['npc_hedda_0', 'npc_hedda_1', 'npc_hedda_talk'], basis: 'npc_hedda_0', talk: ['npc_hedda_0', 'npc_hedda_talk'], zusatz: [] },
    Corm:        { grids: ['npc_corm_0', 'npc_corm_1', 'npc_corm_talk'], basis: 'npc_corm_0', talk: ['npc_corm_0', 'npc_corm_talk'], zusatz: [] },
    Mile:        { grids: ['npc_mile_0', 'npc_mile_1', 'npc_mile_talk'], basis: 'npc_mile_0', talk: ['npc_mile_0', 'npc_mile_talk'], zusatz: [] },
    Torwaechter: { grids: ['npc_torwaechter_0', 'npc_torwaechter_1', 'npc_torwaechter_talk'], basis: 'npc_torwaechter_0', talk: ['npc_torwaechter_0', 'npc_torwaechter_talk'], zusatz: [] },
  };
}
let FIGUREN = figurenVon(SPRITES_NACHHER);
const FIGURNAMEN = Object.keys(FIGUREN);   // feste Reihenfolge = Ausgabereihenfolge
function setzeStand(sprites) { SPRITES = sprites; FIGUREN = figurenVon(sprites); }

// ============================================================================
// 3  DATENTEIL B  —  REQUISITENTOENE (E5: Umrisstoene OHNE Requisitentoene)
//    Regel der Liste: nur Toene, die im Grid AUSSCHLIESSLICH am Requisit
//    (Klinge / Speer / Stock) vorkommen. Toene, die zugleich Koerper sind,
//    stehen NICHT drin und werden unten als "strittig" ausgewiesen.
// ============================================================================
const REQUISITEN = {
  // Klinge + Knauf; y/Y/i/I/C treten beim Helden nur am Schwert auf.
  Held:        { streng: ['y', 'Y', 'i', 'I', 'C'], strittig: [] },
  // Bran fuehrt kein Requisit (Amboss ist Kachel, nicht Sprite).
  Bran:        { streng: [], strittig: [] },
  // Heddas Gehstock: 'j' kommt nur in der Stockspalte vor.
  Hedda:       { streng: ['j'], strittig: [] },
  // Corms Stab: 'J' und 'q' liegen ausschliesslich in der Stabspalte x=13.
  Corm:        { streng: ['J', 'q'], strittig: [] },
  // Mile traegt Tasche + Guertel, kein Klinge/Speer/Stock -> nichts auszuschliessen.
  Mile:        { streng: [], strittig: [] },
  // Speerspitze 'i' ist eindeutig. Der Schaft 'j' ist ZUGLEICH die Hose und
  // 'S' zugleich die Haube -> beide bleiben drin, werden aber als strittig
  // gefuehrt und in einer Zweitlesart zusaetzlich abgezogen.
  Torwaechter: { streng: ['i'], strittig: ['j', 'S'] },
};

// ============================================================================
// 4  DATENTEIL C  —  RIM-TOENE JE FIGUR (E5: Rim >= 12 % der Kontur;
//    Rim-Texel liegen AUF oder 1 innerhalb der Kontur und zaehlen mit)
//
//    REV 2.2 M3a — DIE LISTE IST NICHT MEHR HARTCODIERT.
//    Sie kommt in dieser Reihenfolge:
//      (1) MATERIAL-TABELLE, Feld "rim" der Figur:
//            "Held": { "rim": ["Z"], "flaechen": [ ... ] }
//          Das Feld ist ORTHOGONAL zu "flaechen": es sagt, WELCHE der Toene
//          der Figur als Rim WIRKEN, nicht, in welcher Flaeche sie stehen.
//          Ein leeres Array ist eine gueltige Aussage ("diese Figur hat
//          keinen Rim") und loest KEINEN Fallback aus.
//      (2) sonst: alle Toene aus Materialflaechen mit art:"rim".
//      (3) sonst (die Tabelle SCHWEIGT): FALLBACK auf die Rim-Kandidaten
//          Z (Kapuzen-Rim des Bestands) sowie _ und | (die zwei in
//          Commit a0ee742 additiv ergaenzten Rim-Toene, warm/kalt) —
//          und zwar nur die davon, die in den Grids der Figur wirklich
//          vorkommen. Der Fallback wird im Log und in der JSON als solcher
//          AUSGEWIESEN (Feld rim_quelle / Spalte "Rim-Quelle").
// ============================================================================
const RIM_FALLBACK_KANDIDATEN = ['Z', '_', '|'];   // Z = Bestand, _ = Rim WARM, | = Rim KALT

// Ton-Histogramm ueber alle Grids einer Figur (auch vom Rim-Resolver gebraucht).
function tonHistogramm(keys) {
  const hist = {};
  for (const key of keys) {
    const g = SPRITES[key];
    if (!g) continue;
    for (const r of g) for (const c of r) { if (c === '.') continue; hist[c] = (hist[c] || 0) + 1; }
  }
  return hist;
}

// GP7-CH-2 P0.a: vierter Parameter = Fallback-Kandidatenliste. Vorgabe ist
// RIM_FALLBACK_KANDIDATEN, also EXAKT das bisherige Verhalten; die Gegner
// reichen ihre eigene Liste durch (sie enthaelt zusaetzlich 'C').
function rimtoeneAusTabelle(figur, tabelle, hist, kandidaten = RIM_FALLBACK_KANDIDATEN) {
  const eintrag = tabelle && tabelle.figuren ? tabelle.figuren[figur] : null;
  const imGrid = (t) => (hist[t] || 0) > 0;
  // (1) ausdrueckliches Feld "rim"
  if (eintrag && Array.isArray(eintrag.rim)) {
    const toene = [...new Set(eintrag.rim)].sort();
    return {
      toene,
      quelle: 'TABELLE feld "rim"',
      tabelle_spricht: true,
      fallback_aktiv: false,
      toene_nicht_im_grid: toene.filter((t) => !imGrid(t)),
    };
  }
  // (2) Materialflaeche mit art:"rim"
  if (eintrag && Array.isArray(eintrag.flaechen)) {
    const ausFlaeche = [];
    for (const fl of eintrag.flaechen) {
      if (fl && fl.art === 'rim' && Array.isArray(fl.toene)) ausFlaeche.push(...fl.toene);
    }
    if (ausFlaeche.length) {
      const toene = [...new Set(ausFlaeche)].sort();
      return {
        toene,
        quelle: 'TABELLE flaeche art="rim"',
        tabelle_spricht: true,
        fallback_aktiv: false,
        toene_nicht_im_grid: toene.filter((t) => !imGrid(t)),
      };
    }
  }
  // (3) FALLBACK
  const toene = kandidaten.filter(imGrid).sort();
  return {
    toene,
    quelle: 'FALLBACK ' + kandidaten.join('') + ' (Tabelle schweigt)',
    tabelle_spricht: false,
    fallback_aktiv: true,
    kandidaten,
    kandidaten_im_grid: toene,
    kandidaten_nicht_im_grid: kandidaten.filter((t) => !imGrid(t)),
    toene_nicht_im_grid: [],
  };
}

// SELBSTTEST des Resolvers (deterministisch, ohne Nebenwirkung): belegt alle
// drei Pfade an synthetischen Tabellen. Laeuft bei JEDEM Aufruf und steht im
// Log — damit ist die Rim-Lesung aus der Tabelle nachgewiesen, ohne dass die
// IST-Tabelle unten verfaelscht werden muesste.
function rimResolverSelbsttest() {
  const hist = { Z: 8, _: 3, u: 100 };            // '|' kommt absichtlich NICHT vor
  const faelle = [
    { name: 'Pfad 1: Feld "rim"', tabelle: { figuren: { X: { rim: ['|', 'Z'], flaechen: [] } } }, erwartet: ['Z', '|'], erwartet_quelle: 'TABELLE feld "rim"' },
    { name: 'Pfad 1: Feld "rim" LEER (= gueltige Aussage)', tabelle: { figuren: { X: { rim: [], flaechen: [{ name: 'a', art: 'stoff', toene: ['u'] }] } } }, erwartet: [], erwartet_quelle: 'TABELLE feld "rim"' },
    { name: 'Pfad 2: Flaeche art="rim"', tabelle: { figuren: { X: { flaechen: [{ name: 'Rimkante', art: 'rim', toene: ['_', 'Z'] }] } } }, erwartet: ['Z', '_'], erwartet_quelle: 'TABELLE flaeche art="rim"' },
    { name: 'Pfad 3: Tabelle schweigt -> Fallback', tabelle: { figuren: { X: { flaechen: [{ name: 'a', art: 'stoff', toene: ['u'] }] } } }, erwartet: ['Z', '_'], erwartet_quelle: 'FALLBACK Z_| (Tabelle schweigt)' },
    { name: 'Pfad 3: Figur fehlt in der Tabelle -> Fallback', tabelle: { figuren: {} }, erwartet: ['Z', '_'], erwartet_quelle: 'FALLBACK Z_| (Tabelle schweigt)' },
  ];
  return faelle.map((f) => {
    const r = rimtoeneAusTabelle('X', f.tabelle, hist);
    return {
      fall: f.name,
      erwartet_toene: f.erwartet, ist_toene: r.toene,
      erwartet_quelle: f.erwartet_quelle, ist_quelle: r.quelle,
      ok: r.toene.join('') === f.erwartet.join('') && r.quelle === f.erwartet_quelle,
    };
  });
}

// ============================================================================
// 5  DATENTEIL D  —  RAMPEN (fuer E6-Sperrliste / Dominanz)
//    Uebernommen aus .tmp/gp7ch_review/metriken.mjs, damit die Dominanz-
//    Befunde des Reviews reproduzierbar bleiben.
//
//    REV 2.3 G-L — DIE 14 NEUEN SYMBOL-TOENE SIND EINGETRAGEN.
//    Quelle der Rollen: game/js/art/palette.js, Block "GP7-CH-1 §E3 — DIE 14
//    NEUEN SYMBOL-TOENE", woertlich (Spalte "Rampe" + Spalte "Rolle"):
//      Krapp   ! (Schatten) < G (Bestand, Mitte) < % (Licht)   — Hedda
//      Wolle   & (dunkel)   < ( (Leitton)        < ) (hell)    — Corm, Petrol
//      Leder   : (dunkel)   < ; (Leitton)        < ? (hell)    — Bran, versengt
//      Kittel  @ (dunkel)   < [ (Leitton)        < ] (hell)    — Mile, Stahlblau
//      Held    u < U < X < ^ < Z   ('^' ist der EINSCHUB, palette.js: "Rampe
//                                   HELD Stufe 4/5", nicht eine eigene Rampe)
//      Rim     _ (warm) / | (kalt) — laut palette.js ausdruecklich KEINE
//                                   Materialrampe, sondern eine Kante; hier
//                                   trotzdem als eigene Rampe gefuehrt, damit
//                                   Rim-Texel die Material-Dominanz nicht als
//                                   'unbekannt:_' verfaelschen.
//    WIRKUNG: die "dominante Rampe" wird wieder eine Materialaussage. Vorher
//    zaehlte z. B. Miles Kittel (@ [ ]) als drei getrennte 'unbekannt:'-Posten
//    und die dominante Rampe fiel auf 'Holz' (Kappe/Schuhe) zurueck.
// ============================================================================
const RAMPEN = {
  Holz: 'qjQcJ', Stein: 'gsSF', Rost: '456', Erde: 'zpvMPV', Knochen: 'OBbN',
  Gras: 'eEamKA', Held: 'uUX^Z', Haut: 'h2', Stahl: 'CiI', Umriss: 'kn',
  Krapp: '!G%', Blut: 'rR', Katakomben: 'tTLD', Ghul: 'dH3',
  Wolle: '&()', Leder: ':;?', Kittel: '@[]', Rim: '_|',
};
const rampeVon = (c) => { for (const n of Object.keys(RAMPEN)) if (RAMPEN[n].includes(c)) return n; return 'unbekannt:' + c; };

// Die 14 Zeichen aus palette.js §E3, in der Reihenfolge der dortigen Tabelle.
const NEUE_14_TOENE = ['!', '%', '&', '(', ')', ':', ';', '?', '@', '[', ']', '^', '_', '|'];

// SELBSTTEST der Rampen-Tabelle (deterministisch, ohne Nebenwirkung). Er belegt
// bei JEDEM Lauf: kein Ton steht in zwei Rampen, jede Rampe besteht nur aus
// echten Palettentoenen, alle 14 neuen Toene haben eine Rampe — und er listet
// die Palettentoene, die (bewusst) noch ohne Rampe sind.
function rampenSelbsttest() {
  const gesehen = {};
  const doppelt = [];
  for (const n of Object.keys(RAMPEN)) for (const c of RAMPEN[n]) {
    if (gesehen[c]) doppelt.push({ ton: c, rampen: [gesehen[c], n] });
    else gesehen[c] = n;
  }
  const zuordnung = {};
  for (const c of NEUE_14_TOENE) zuordnung[c] = rampeVon(c);
  const ohneRampe = NEUE_14_TOENE.filter((c) => zuordnung[c].startsWith('unbekannt:'));
  const nichtInPalette = Object.keys(gesehen).filter((c) => !(c in PALETTE)).sort();
  const palettentoeneOhneRampe = Object.keys(PALETTE).filter((c) => rampeVon(c).startsWith('unbekannt:')).sort();
  return {
    rampen_anzahl: Object.keys(RAMPEN).length,
    toene_in_rampen: Object.keys(gesehen).length,
    doppelt_zugeordnet: doppelt,
    neue_14_zuordnung: zuordnung,
    neue_14_ohne_rampe: ohneRampe,
    rampentoene_nicht_in_palette: nichtInPalette,
    palettentoene_ohne_rampe: palettentoeneOhneRampe,
    ok: doppelt.length === 0 && nichtInPalette.length === 0 && ohneRampe.length === 0,
  };
}

// ============================================================================
// 6  DATENTEIL E  —  WIRKORTE
//    Die Standkacheln kommen LIVE aus map_dorf.js (npcSpawns, Zeilen 266-270);
//    der Wanderradius (npcs.js: 24 px) wird fuer die beiden Wanderer
//    (mile, torwaechter) als Kachelumkreis aufgeloest.
//    Die BODEN-KLASSEN werden aus allen 5 Karten in MAPS abgeleitet, nicht
//    von Hand gelistet (Regel unten), damit keine Kachel unterschlagen wird.
// ============================================================================
const KACHEL = 16;
const WANDER_RADIUS_PX = 24;                       // npcs.js "Wander an der Leine mit Radius 24"
const WANDERER = ['mile', 'torwaechter'];          // npcs.js NPC_WANDERER

function klasseVonArt(mapName, artKey) {
  if (/^path/.test(artKey)) return 'Weg';
  if (/^dorf_lehm/.test(artKey) || artKey === 'dorf_stufe' || artKey === 'dorf_schwelle') return 'DORF-Lehm';
  if (/^(stone_floor|crypt_stairs_down|stairs_up|water_v|floor_decal)/.test(artKey)) return 'Gruft-Stein';
  if (/^(grass|bones|skull)/.test(artKey)) return 'GY-Gras';
  if (/^(dirt_patch|pebble_small)/.test(artKey)) return mapName === 'DORF' ? 'DORF-Erdfleck' : 'GY-Gras';
  return 'UNKLASSIFIZIERT';
}
// Kacheln, die der B1-Fix des Reviews NICHT gesehen hat (dl_band.mjs las nur
// GRAVEYARD/DORF/FLUESTERGRUFT). Werden separat ausgewiesen.
const NUR_IN_BOSS_ODER_KATAKOMBEN = new Set();

function kachelMittel(artKey) {
  const g = TILE_ART[artKey];
  if (!g) return null;
  let r = 0, gg = 0, b = 0, n = 0;
  for (const row of g) for (const c of row) {
    if (c === '.') continue;
    const [R, G, B] = hexRGB(PALETTE[c]); r += R; gg += G; b += B; n++;
  }
  if (!n) return null;
  const rgb = [r / n, gg / n, b / n];
  return { art: artKey, rgb, L: L601(...rgb), lab: labRGB(...rgb), texel: n };
}

function bodenklassenAusKarten() {
  const klassen = {};       // klasse -> { art -> {..., karten:[...]} }
  const unklassifiziert = [];
  for (const mapName of Object.keys(MAPS).sort()) {
    const m = MAPS[mapName];
    const rows = m.rows || m.ROWS, legend = m.legend || m.LEGEND;
    if (!rows || !legend) continue;
    const benutzt = new Set();
    for (const row of rows) for (const ch of row) benutzt.add(ch);
    for (const ch of [...benutzt].sort()) {
      const def = legend[ch];
      if (!def || def.solid) continue;                       // nur BEGEHBAR
      const keys = def.variants ? def.variants : (def.anim ? def.anim : [def.art]);
      for (const k of [...new Set(keys)].sort()) {
        const km = kachelMittel(k);
        if (!km) continue;
        const kl = klasseVonArt(mapName, k);
        if (kl === 'UNKLASSIFIZIERT') { unklassifiziert.push(mapName + ':' + k); continue; }
        klassen[kl] = klassen[kl] || {};
        if (!klassen[kl][k]) klassen[kl][k] = { ...km, karten: [] };
        if (!klassen[kl][k].karten.includes(mapName)) klassen[kl][k].karten.push(mapName);
        if (mapName === 'BOSS_KAMMER' || mapName === 'CATACOMBS') NUR_IN_BOSS_ODER_KATAKOMBEN.add(k);
      }
    }
  }
  // Kacheln, die NUR in BOSS_KAMMER/CATACOMBS vorkommen, markieren
  for (const kl of Object.keys(klassen)) for (const k of Object.keys(klassen[kl])) {
    const kt = klassen[kl][k].karten;
    klassen[kl][k].nurBossKatakomben = kt.every((m) => m === 'BOSS_KAMMER' || m === 'CATACOMBS');
  }
  return { klassen, unklassifiziert };
}

const { klassen: BODENKLASSEN, unklassifiziert: BODEN_UNKLAR } = bodenklassenAusKarten();

// Standkacheln der 5 NPCs LIVE aus map_dorf.js
function standkacheln() {
  const rows = DORF.rows || DORF.ROWS, legend = DORF.legend || DORF.LEGEND;
  const out = {};
  for (const sp of DORF.npcSpawns) {
    const tx = Math.floor(sp.x / KACHEL), ty = Math.floor(sp.y / KACHEL);
    const radiusKacheln = Math.ceil(WANDER_RADIUS_PX / KACHEL);
    const felder = [];
    const spanne = WANDERER.includes(sp.id) ? radiusKacheln : 0;
    for (let dy = -spanne; dy <= spanne; dy++) for (let dx = -spanne; dx <= spanne; dx++) {
      const x = tx + dx, y = ty + dy;
      if (y < 0 || y >= rows.length || x < 0 || x >= rows[0].length) continue;
      // Wanderleine ist ein Kreis um den Anker (Kachelzentrum gegen Kachelzentrum)
      if (Math.hypot(dx * KACHEL, dy * KACHEL) > WANDER_RADIUS_PX + KACHEL / 2) continue;
      const ch = rows[y][x];
      const def = legend[ch];
      if (!def || def.solid) continue;
      const keys = def.variants ? def.variants : (def.anim ? def.anim : [def.art]);
      for (const k of [...new Set(keys)].sort()) felder.push({ x, y, zeichen: ch, art: k, klasse: klasseVonArt('DORF', k) });
    }
    out[sp.id] = { ankerKachel: [tx, ty], ankerZeichen: rows[ty][tx], wanderer: WANDERER.includes(sp.id), felder };
  }
  return out;
}
const STANDKACHELN = standkacheln();

// Zuordnung Figur -> Wirkort-Klassen.
// E1: WEG-PFLICHTPRUEFUNG FUER ALLE (M17). Der Held laeuft ueber ALLE Karten.
const NPC_ID = { Bran: 'bran', Hedda: 'hedda', Corm: 'corm', Mile: 'mile', Torwaechter: 'torwaechter' };
function wirkortKlassen(fig) {
  if (fig === 'Held') return ['GY-Gras', 'DORF-Lehm', 'Weg', 'Gruft-Stein'];
  const id = NPC_ID[fig];
  const set = new Set(STANDKACHELN[id].felder.map((f) => f.klasse));
  set.add('DORF-Lehm');   // Review-B1-Fix: "NPCs: DORF-Lehm ... und WEG"
  set.add('Weg');         // E1: Weg-Pflichtpruefung fuer ALLE
  set.delete('DORF-Erdfleck'); // im B1-Fix nicht als Klasse gefuehrt; separat berichtet
  return [...set].sort();
}

// ============================================================================
// 7  DATENTEIL F  —  MATERIAL-TABELLE
//    FORMAT (das ist die Deliverable-Pflicht aus E5/M8 an Phase 1):
//    {
//      "$format": "GP7CH1/MATERIAL-TABELLE/1",
//      "stand": "<frei>",
//      "quelle": "<wer hat sie bestimmt>",
//      "figuren": {
//        "<Figur>": { "rim": ["Z"],            <- REV 2.2 M3a, siehe Sektion 4
//                     "flaechen": [ { "name": "...", "art": "stoff|leder|haut|
//                     metall|holz|stein|knochen|umriss|rim|requisit",
//                     "toene": ["u","U"] } ] }
//      }
//    "rim" ist OPTIONAL und ORTHOGONAL zu "flaechen": es nennt die Toene, die
//    als Rimlight WIRKEN (sie stehen zusaetzlich in genau einer Flaeche).
//    Fehlt "rim" UND gibt es keine Flaeche mit art:"rim", greift der Fallback
//    Z/_/| und wird als solcher ausgewiesen.
//    }
//    REGEL: jeder Ton, der in den Grids der Figur vorkommt, muss in GENAU
//    einer Flaeche stehen. Das Werkzeug prueft das und meldet Luecken/Doppel.
//    Fuer HEUTE liegt eine handbestimmte IST-Tabelle bei (unten), die beim
//    Lauf zusaetzlich als figuren_material_IST.json geschrieben wird.
// ============================================================================
const MATERIAL_IST = {
  $format: 'GP7CH1/MATERIAL-TABELLE/1',
  stand: 'IST vor GP7-CH-1 (Grids im Stand sprites_figuren.js nach P0.a-Split)',
  quelle: 'P0.d, handbestimmt aus der Zeilen-/Spaltenlesung der heutigen Grids. '
    + 'KEINE Lieferung des Art-Agenten — Phase 1 ersetzt diese Datei durch die '
    + 'eigene MATERIAL-TABELLE im selben Format (--material <pfad>).',
  figuren: {
    // "rim" NUR beim Helden: er ist die einzige Figur, die im HEUTIGEN Stand
    // einen Rim traegt (Ton Z, "Kapuzen-Rimlight", sprites_figuren.js Kopf).
    // Die fuenf NPCs bekommen ABSICHTLICH kein rim-Feld — dadurch laeuft bei
    // ihnen der Fallback und ist im Log als solcher zu sehen. Phase 1 liefert
    // eine Tabelle MIT rim-Feld je Figur (--material <pfad>).
    Held: { rim: ['Z'], flaechen: [
      { name: 'Umhang/Stoff', art: 'stoff', toene: ['u', 'U', 'X', 'Z'] },
      { name: 'Haut/Gesicht', art: 'haut', toene: ['h', '2'] },
      { name: 'Stiefel/Guertel', art: 'leder', toene: ['j', 'q'] },
      { name: 'Klinge/Stahl', art: 'requisit', toene: ['i', 'I', 'C'] },
      { name: 'Klingenreflex/Gold', art: 'requisit', toene: ['y', 'Y'] },
      { name: 'Silhouettenkante', art: 'umriss', toene: ['k', 'n'] },
    ] },
    Bran: { flaechen: [
      { name: 'Schmiedeschurz (Leder)', art: 'leder', toene: ['J', 'c'] },
      { name: 'Haar/Kappe + Hose', art: 'holz', toene: ['q', 'j'] },
      { name: 'Haut/Arme', art: 'haut', toene: ['h', '2'] },
      { name: 'Bart', art: 'knochen', toene: ['B'] },
      { name: 'Schnalle', art: 'metall', toene: ['5'] },
      { name: 'Silhouettenkante', art: 'umriss', toene: ['k'] },
    ] },
    Hedda: { flaechen: [
      { name: 'Kleid (Krapp)', art: 'stoff', toene: ['G', 'r'] },
      { name: 'Kopftuch/Leinen', art: 'stoff', toene: ['O', 'B'] },
      { name: 'Haut/Gesicht', art: 'haut', toene: ['h', '2'] },
      { name: 'Schuhe', art: 'holz', toene: ['q'] },
      { name: 'Gehstock', art: 'requisit', toene: ['j'] },
      { name: 'Silhouettenkante', art: 'umriss', toene: ['k'] },
    ] },
    Corm: { flaechen: [
      { name: 'Kutte (Stein-Rampe)', art: 'stein', toene: ['s', 'g'] },
      { name: 'Stola', art: 'stoff', toene: ['G'] },
      { name: 'Haut/Gesicht', art: 'haut', toene: ['h', '2'] },
      { name: 'Haar/Tonsur', art: 'knochen', toene: ['B', 'b'] },
      { name: 'Stab', art: 'requisit', toene: ['J', 'q'] },
      { name: 'Silhouettenkante', art: 'umriss', toene: ['k'] },
    ] },
    Mile: { flaechen: [
      { name: 'Kittel (Leinen/Knochen-Nachbarschaft)', art: 'stoff', toene: ['O', 'B'] },
      { name: 'Haut/Gesicht', art: 'haut', toene: ['h', '2'] },
      { name: 'Kappe/Haar', art: 'holz', toene: ['c', 'Q'] },
      { name: 'Guertel + Tasche', art: 'leder', toene: ['j'] },
      { name: 'Schuhe', art: 'holz', toene: ['q'] },
      { name: 'Silhouettenkante', art: 'umriss', toene: ['k'] },
    ] },
    Torwaechter: { flaechen: [
      { name: 'Rostpanzer', art: 'metall', toene: ['4', '5', '6'] },
      { name: 'Haube (Stein-Rampe)', art: 'stein', toene: ['s', 'S'] },
      { name: 'Haut/Gesicht', art: 'haut', toene: ['h', '2'] },
      { name: 'Hose + Speerschaft', art: 'holz', toene: ['j'] },
      { name: 'Stiefel', art: 'holz', toene: ['q'] },
      { name: 'Speerspitze', art: 'requisit', toene: ['i'] },
      { name: 'Silhouettenkante', art: 'umriss', toene: ['k'] },
    ] },
  },
};

function materialTabelleLaden() {
  if (!MATERIAL_PFAD) return { tabelle: MATERIAL_IST, herkunft: 'eingebaute IST-Handtabelle' };
  const roh = JSON.parse(readFileSync(resolve(MATERIAL_PFAD), 'utf8'));
  if (roh.$format !== 'GP7CH1/MATERIAL-TABELLE/1') {
    throw new Error(`MATERIAL-TABELLE: $format erwartet "GP7CH1/MATERIAL-TABELLE/1", gelesen "${roh.$format}"`);
  }
  return { tabelle: roh, herkunft: resolve(MATERIAL_PFAD) };
}

// ============================================================================
// 8  DATENTEIL G  —  ANKER AUS DEM REVIEW (Kontrollpflicht E5)
//    Quelle jeweils in der Klammer. "lesart" nennt die Formel, die den Wert
//    erzeugt haben muss.
// ============================================================================
const ANKER = [
  { id: 'sym-Corm',        figur: 'Corm',        groesse: 'spiegelgleichheit_bbox', soll: 47.9, toleranz: 0.1, quelle: 'REVIEW M5-Tabelle / SPEC E5' },
  { id: 'sym-Bran',        figur: 'Bran',        groesse: 'spiegelgleichheit_bbox', soll: 84.2, toleranz: 0.1, quelle: 'REVIEW M5 / SPEC E5' },
  { id: 'sym-Held-down',   figur: 'Held',        groesse: 'spiegelgleichheit_bbox', soll: 26.0, toleranz: 0.1, quelle: 'REVIEW M5-Tabelle / SPEC E5' },
  { id: 'sym-Hedda',       figur: 'Hedda',       groesse: 'spiegelgleichheit_bbox', soll: 45.1, toleranz: 0.1, quelle: 'REVIEW M5-Tabelle' },
  { id: 'sym-Mile',        figur: 'Mile',        groesse: 'spiegelgleichheit_bbox', soll: 84.8, toleranz: 0.1, quelle: 'REVIEW M5 (Verschiebungssatz)' },
  { id: 'sym-Torw',        figur: 'Torwaechter', groesse: 'spiegelgleichheit_bbox', soll: 62,   toleranz: 0.5, quelle: 'Teil C "Torwaechter 52/62 % Symmetrie" (bbox=grid, Achse deckungsgleich)' },
  { id: 'umriss-ton-Held', figur: 'Held',        groesse: 'umriss_ton_pct',         soll: 35,   toleranz: 0.5, quelle: 'REVIEW M5 "Held 35/29" + Landkarte "35 % Schwarz-Umriss"' },
  { id: 'umriss-kon-Held', figur: 'Held',        groesse: 'umriss_kontur_pct',      soll: 29,   toleranz: 0.5, quelle: 'REVIEW M5 "Held 35/29"' },
  { id: 'umriss-ton-Bran', figur: 'Bran',        groesse: 'umriss_ton_pct',         soll: 34,   toleranz: 0.5, quelle: 'REVIEW M5' },
  { id: 'umriss-kon-Bran', figur: 'Bran',        groesse: 'umriss_kontur_pct',      soll: 28,   toleranz: 0.5, quelle: 'REVIEW M5' },
  { id: 'umriss-ton-Hedda', figur: 'Hedda',      groesse: 'umriss_ton_pct',         soll: 27,   toleranz: 0.5, quelle: 'REVIEW M5' },
  { id: 'umriss-kon-Hedda', figur: 'Hedda',      groesse: 'umriss_kontur_pct',      soll: 29,   toleranz: 0.5, quelle: 'REVIEW M5' },
  { id: 'umriss-ton-Corm', figur: 'Corm',        groesse: 'umriss_ton_pct',         soll: 27,   toleranz: 0.5, quelle: 'REVIEW M5' },
  { id: 'umriss-kon-Corm', figur: 'Corm',        groesse: 'umriss_kontur_pct',      soll: 23,   toleranz: 0.5, quelle: 'REVIEW M5' },
  { id: 'umriss-ton-Mile', figur: 'Mile',        groesse: 'umriss_ton_pct',         soll: 35,   toleranz: 0.5, quelle: 'REVIEW M5' },
  { id: 'umriss-kon-Mile', figur: 'Mile',        groesse: 'umriss_kontur_pct',      soll: 32,   toleranz: 0.5, quelle: 'REVIEW M5' },
  { id: 'umriss-ton-Torw', figur: 'Torwaechter', groesse: 'umriss_ton_pct',         soll: 28,   toleranz: 0.5, quelle: 'REVIEW M5' },
  { id: 'umriss-kon-Torw', figur: 'Torwaechter', groesse: 'umriss_kontur_pct',      soll: 27,   toleranz: 0.5, quelle: 'REVIEW M5' },
  { id: 'randtoene-Held',  figur: 'Held',        groesse: 'konturtoene_anzahl',     soll: 5,    toleranz: 0,   quelle: 'REVIEW M5 "Randton-Anzahl geometrisch 5/1/3/1/1/4"' },
  { id: 'randtoene-Bran',  figur: 'Bran',        groesse: 'konturtoene_anzahl',     soll: 1,    toleranz: 0,   quelle: 'REVIEW M5' },
  { id: 'randtoene-Hedda', figur: 'Hedda',       groesse: 'konturtoene_anzahl',     soll: 3,    toleranz: 0,   quelle: 'REVIEW M5' },
  { id: 'randtoene-Corm',  figur: 'Corm',        groesse: 'konturtoene_anzahl',     soll: 1,    toleranz: 0,   quelle: 'REVIEW M5' },
  { id: 'randtoene-Mile',  figur: 'Mile',        groesse: 'konturtoene_anzahl',     soll: 1,    toleranz: 0,   quelle: 'REVIEW M5' },
  { id: 'randtoene-Torw',  figur: 'Torwaechter', groesse: 'konturtoene_anzahl',     soll: 4,    toleranz: 0,   quelle: 'REVIEW M5' },
  { id: 'rim-Held-auf',    figur: 'Held',        groesse: 'rim_auf_kontur_pct',     soll: 4.1,  toleranz: 0.1, quelle: 'REVIEW B4 "Held_down kommt heute auf 4,1 %"' },
  { id: 'rim-Held-nah',    figur: 'Held',        groesse: 'rim_e5_pct',             soll: 11.0, toleranz: 0.2, quelle: 'REVIEW M6 "8 Texel = 11 % der geometrischen Kontur (73)"' },
  { id: 'kontur-Held-n',   figur: 'Held',        groesse: 'kontur_texel',           soll: 73,   toleranz: 0,   quelle: 'REVIEW M6' },
];
const ANKER_PROFIL = [
  { paar: ['Bran', 'Corm'],        soll: 90, toleranz: 0.5, quelle: 'REVIEW M7 "IST-Maximum 90 (Bran/Corm, Bran/Torwaechter)"' },
  { paar: ['Bran', 'Torwaechter'], soll: 90, toleranz: 0.5, quelle: 'REVIEW M7' },
  { paar: ['Held', 'Bran'],        soll: 89, toleranz: 0.5, quelle: 'REVIEW M7 "Held/Bran 89"' },
  { paar: ['Held', 'Torwaechter'], soll: 88, toleranz: 0.5, quelle: 'REVIEW M7 "Held/Torwaechter 88"' },
  { paar: ['Hedda', 'Corm'],       soll: 86, toleranz: 0.5, quelle: 'REVIEW M6 "Hedda/Corm 86"' },
];
const ANKER_TALK = { texelDiffPct: 1.0, silhouettenDiffPct: 0.0, toleranz: 0.1, quelle: 'REVIEW m24 "alle fuenf bei 1,0 % Texel-Diff und 0,0 % Silhouetten-Diff"' };
// Baender aus dem B1-Fix, die das Werkzeug reproduzieren MUSS (E1 nennt sie woertlich).
const ANKER_BAENDER = {
  'GY-Gras': [88, 137], 'DORF-Lehm': [100, 159], 'Weg': [117, 181], 'Gruft-Stein': [85, 127],
};

// ============================================================================
// 9  MESSUNG  —  die acht Bloecke aus E5
// ============================================================================
function gridInfo(g) {
  const h = g.length, w = g[0].length;
  const at = (x, y) => (y < 0 || y >= h || x < 0 || x >= w ? '.' : g[y][x]);
  return { h, w, at };
}

// (1) KONTUR — E5: opake Texel mit >=1 transparentem 4er-Nachbarn ODER Rahmenkante.
function konturVon(g) {
  const { h, w, at } = gridInfo(g);
  const set = new Set(); const toene = {};
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const c = at(x, y);
    if (c === '.') continue;
    const randkante = x === 0 || x === w - 1 || y === 0 || y === h - 1;
    const nachbarTransparent = at(x - 1, y) === '.' || at(x + 1, y) === '.' || at(x, y - 1) === '.' || at(x, y + 1) === '.';
    if (randkante || nachbarTransparent) { set.add(x + ',' + y); toene[c] = (toene[c] || 0) + 1; }
  }
  return { set, toene };
}
function opakVon(g) { let n = 0; for (const r of g) for (const c of r) if (c !== '.') n++; return n; }

function messUmriss(figur) {
  const F = FIGUREN[figur];
  const req = REQUISITEN[figur];
  const proGrid = {};
  let opakSum = 0, konturSum = 0, tonSum = 0;
  const toeneGesamt = {};
  for (const key of F.grids) {
    const g = SPRITES[key]; if (!g) continue;
    const { set, toene } = konturVon(g);
    const opak = opakVon(g);
    let kn = 0; for (const r of g) for (const c of r) if (c === 'k' || c === 'n') kn++;
    opakSum += opak; konturSum += set.size; tonSum += kn;
    for (const c of Object.keys(toene)) toeneGesamt[c] = (toeneGesamt[c] || 0) + toene[c];
    proGrid[key] = {
      opak, kontur_texel: set.size,
      umriss_kontur_pct: 100 * set.size / opak,
      umriss_ton_pct: 100 * kn / opak,
      konturtoene: Object.keys(toene).sort(),
    };
  }
  // Umrisstoene nach E5: auf der Kontur, >= 8 Texel, OHNE Requisitentoene.
  const basisKontur = konturVon(SPRITES[F.basis]);
  const zaehleUmrisstoene = (ausschluss) => Object.entries(basisKontur.toene)
    .filter(([c, n]) => n >= 8 && !ausschluss.includes(c)).map(([c]) => c).sort();
  const umrisstoene_streng = zaehleUmrisstoene(req.streng);
  const umrisstoene_strittigRaus = zaehleUmrisstoene([...req.streng, ...req.strittig]);
  return {
    basisgrid: F.basis,
    opak: opakVon(SPRITES[F.basis]),
    kontur_texel: basisKontur.set.size,
    umriss_kontur_pct: 100 * basisKontur.set.size / opakVon(SPRITES[F.basis]),
    umriss_ton_pct: proGrid[F.basis].umriss_ton_pct,
    konturtoene: Object.keys(basisKontur.toene).sort(),
    konturtoene_anzahl: Object.keys(basisKontur.toene).length,
    konturton_histogramm: basisKontur.toene,
    umrisstoene_e5: umrisstoene_streng,
    umrisstoene_e5_anzahl: umrisstoene_streng.length,
    umrisstoene_ohne_strittige: umrisstoene_strittigRaus,
    umrisstoene_ohne_strittige_anzahl: umrisstoene_strittigRaus.length,
    requisitentoene: req,
    ueber_alle_grids: {
      opak: opakSum, kontur_texel: konturSum,
      umriss_kontur_pct: 100 * konturSum / opakSum,
      umriss_ton_pct: 100 * tonSum / opakSum,
      konturton_histogramm: toeneGesamt,
    },
    pro_grid: proGrid,
  };
}

// (2) SPIEGELGLEICHHEIT — E5: um die BBOX-Mittelachse der opaken Texel.
function spiegel(g, achse) {
  const { h, w, at } = gridInfo(g);
  let minX = w, maxX = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (at(x, y) !== '.') { if (x < minX) minX = x; if (x > maxX) maxX = x; }
  let gleich = 0, ges = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const mx = achse === 'grid' ? w - 1 - x : (x < minX || x > maxX ? -1 : minX + maxX - x);
    const a = at(x, y), b = mx < 0 ? '.' : at(mx, y);
    if (a === '.' && b === '.') continue;
    ges++; if (a === b) gleich++;
  }
  return { pct: 100 * gleich / ges, minX, maxX, achseBei: (minX + maxX) / 2 };
}
function messSpiegel(figur) {
  const F = FIGUREN[figur];
  const b = spiegel(SPRITES[F.basis], 'bbox');
  const gr = spiegel(SPRITES[F.basis], 'grid');
  const proGrid = {};
  for (const k of F.grids) if (SPRITES[k]) proGrid[k] = spiegel(SPRITES[k], 'bbox').pct;
  return {
    basisgrid: F.basis,
    spiegelgleichheit_bbox: b.pct,
    spiegelgleichheit_grid: gr.pct,
    bbox: [b.minX, b.maxX], bbox_achse: b.achseBei, grid_achse: 7.5,
    achsen_identisch: Math.abs(b.achseBei - 7.5) < 1e-9,
    pro_grid_bbox: proGrid,
  };
}

// (3) PROFILAEHNLICHKEIT — E5 woertlich:
//     100*(1 - Sum|a_i-b_i| / Sum max(a_i,b_i)) ueber zeilenindizierte Breitenprofile.
function breitenprofil(key) {
  const g = SPRITES[key]; const p = [];
  for (const r of g) { let n = 0; for (const c of r) if (c !== '.') n++; p.push(n); }
  return p;
}
function profilAehnlichkeit(p, q) {
  const n = Math.max(p.length, q.length);
  let diff = 0, sum = 0;
  for (let i = 0; i < n; i++) {
    const a = p[i + p.length - n] ?? 0, b = q[i + q.length - n] ?? 0;
    diff += Math.abs(a - b); sum += Math.max(a, b);
  }
  return 100 * (1 - diff / (sum || 1));
}

// (4) MATERIALFLAECHEN — Hue-Spanne, Stufen, Schrittverhaeltnis, Dominanz.
function hueSpanne(hues) {
  if (hues.length < 2) return 0;
  const s = [...hues].sort((a, b) => a - b);
  let groessteLuecke = (s[0] + 360) - s[s.length - 1];
  for (let i = 1; i < s.length; i++) groessteLuecke = Math.max(groessteLuecke, s[i] - s[i - 1]);
  return 360 - groessteLuecke;
}
function messMaterial(figur, tabelle) {
  const F = FIGUREN[figur];
  const hist = tonHistogramm(F.grids);
  const gesamtTexel = Object.values(hist).reduce((a, b) => a + b, 0);
  const eintrag = tabelle.figuren[figur];
  const befund = { fehler: [], flaechen: [], ton_histogramm: hist, texel_gesamt: gesamtTexel };
  if (!eintrag) { befund.fehler.push(`MATERIAL-TABELLE hat keinen Eintrag fuer ${figur}`); return befund; }
  const zugeordnet = {};
  for (const fl of eintrag.flaechen) for (const t of fl.toene) {
    if (zugeordnet[t]) befund.fehler.push(`Ton '${t}' doppelt zugeordnet (${zugeordnet[t]} und ${fl.name})`);
    zugeordnet[t] = fl.name;
  }
  for (const t of Object.keys(hist).sort()) if (!zugeordnet[t]) befund.fehler.push(`Ton '${t}' (${hist[t]} Texel) in KEINER Flaeche`);
  for (const t of Object.keys(zugeordnet).sort()) if (!hist[t]) befund.fehler.push(`Ton '${t}' (${zugeordnet[t]}) kommt in den Grids gar nicht vor`);

  for (const fl of eintrag.flaechen) {
    const toene = fl.toene.filter((t) => hist[t]);
    const texel = toene.reduce((a, t) => a + hist[t], 0);
    const daten = toene.map((t) => {
      const hexv = PALETTE[t]; const l = labHex(hexv);
      return { ton: t, hex: hexv, L601: L601hex(hexv), hue: hueLab(l), Cab: CabLab(l), texel: hist[t] };
    }).sort((a, b) => a.L601 - b.L601);
    const schritte = [];
    for (let i = 1; i < daten.length; i++) schritte.push(daten[i].L601 - daten[i - 1].L601);
    const schrittverhaeltnis = schritte.length >= 2
      ? Math.max(...schritte) / Math.min(...schritte.map((s) => Math.abs(s) || 1e-9)) : null;
    befund.flaechen.push({
      name: fl.name, art: fl.art,
      toene: daten.map((d) => d.ton),
      texel,
      dominanz_pct: 100 * texel / gesamtTexel,
      stufen: daten.length,
      stufen_ab8texel: daten.filter((d) => d.texel >= 8).length,
      hue_spanne_grad: hueSpanne(daten.map((d) => d.hue)),
      L_spanne: daten.length ? [daten[0].L601, daten[daten.length - 1].L601] : null,
      L_schritte: schritte,
      schrittverhaeltnis,
      toendetails: daten,
    });
  }
  befund.flaechen.sort((a, b) => b.texel - a.texel || a.name.localeCompare(b.name));
  // dominante RAMPE (fuer E6-Sperrliste), Umriss ausgenommen
  const rampHist = {};
  for (const t of Object.keys(hist)) { const r = rampeVon(t); if (r === 'Umriss') continue; rampHist[r] = (rampHist[r] || 0) + hist[t]; }
  befund.rampen = Object.entries(rampHist).sort((a, b) => b[1] - a[1]).map(([r, n]) => ({ rampe: r, texel: n }));
  befund.dominante_rampe = befund.rampen.length ? befund.rampen[0].rampe : null;
  return befund;
}

// (5) KOERPER-L — E5: Mittel der opaken Nicht-Kontur-Nicht-Rim-Texel ueber ALLE Grids.
function koerperMittel(keys, rimToene) {
  let r = 0, g2 = 0, b = 0, n = 0, Ls = 0;
  const hist = {};
  for (const key of keys) {
    const g = SPRITES[key]; if (!g) continue;
    const { set } = konturVon(g);
    const { h, w, at } = gridInfo(g);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const c = at(x, y);
      if (c === '.') continue;
      if (set.has(x + ',' + y)) continue;                 // Kontur raus
      if (rimToene.includes(c)) continue;                 // Rim raus
      const [R, G, B] = hexRGB(PALETTE[c]);
      r += R; g2 += G; b += B; n++; Ls += L601(R, G, B);
      hist[c] = (hist[c] || 0) + 1;
    }
  }
  if (!n) return null;
  const rgb = [r / n, g2 / n, b / n];
  return { L: Ls / n, L_ausMittelfarbe: L601(...rgb), rgb, lab: labRGB(...rgb), texel: n, hist };
}
// Zweitlesart des Reviews (dl_band.mjs): nur die Toene k/n raus, nur die Basisgrids.
function koerperReviewLesart(keys) {
  let r = 0, g2 = 0, b = 0, n = 0, Ls = 0;
  for (const key of keys) {
    const g = SPRITES[key]; if (!g) continue;
    for (const row of g) for (const c of row) {
      if (c === '.' || c === 'k' || c === 'n') continue;
      const [R, G, B] = hexRGB(PALETTE[c]);
      r += R; g2 += G; b += B; n++; Ls += L601(R, G, B);
    }
  }
  if (!n) return null;
  const rgb = [r / n, g2 / n, b / n];
  return { L: Ls / n, rgb, lab: labRGB(...rgb), texel: n };
}
// (5b) DOMINANTE MATERIALFLAECHE — Rev 2.3 G-N.
//      Bezugsflaeche des dE00-Ersatzpfads: die groesste Flaeche der MATERIAL-
//      TABELLE mit >= MATERIALFLAECHE_MIN_TEXEL Texeln. Kante (umriss), Licht
//      (rim), Gegenstand (requisit) und Einzeltexel-Merkmal (merkmal) sind
//      KEIN Material und scheiden als Bezugsflaeche aus.
//      Die Texelzahl ist DIESELBE, die messMaterial() als "texel"/"dominanz_pct"
//      fuehrt (Ton-Histogramm ueber alle Grids) — Log-Zahl und Messgroesse
//      beschreiben damit exakt dieselbe Texelmenge.
const MATERIALFLAECHE_MIN_TEXEL = 40;
const MATERIALFLAECHE_KEIN_MATERIAL = ['umriss', 'rim', 'requisit', 'merkmal'];

function flaechenMittel(keys, toene) {
  const set = new Set(toene);
  let r = 0, g2 = 0, b = 0, n = 0, Ls = 0;
  const hist = {};
  for (const key of keys) {
    const g = SPRITES[key]; if (!g) continue;
    for (const row of g) for (const c of row) {
      if (c === '.' || !set.has(c)) continue;
      const [R, G, B] = hexRGB(PALETTE[c]);
      r += R; g2 += G; b += B; n++; Ls += L601(R, G, B);
      hist[c] = (hist[c] || 0) + 1;
    }
  }
  if (!n) return null;
  const rgb = [r / n, g2 / n, b / n];
  return { L: Ls / n, L_ausMittelfarbe: L601(...rgb), rgb, lab: labRGB(...rgb), texel: n, hist };
}

function dominanteMaterialflaeche(figur, tabelle, ganzkoerper) {
  const F = FIGUREN[figur];
  const hist = tonHistogramm(F.grids);
  const eintrag = tabelle && tabelle.figuren ? tabelle.figuren[figur] : null;
  const zurueck = (grund) => ({
    gefunden: false,
    flaeche_quelle: 'FALLBACK Ganzkoerper (' + grund + ')',
    name: null, art: null, toene: [], texel: 0,
    min_texel: MATERIALFLAECHE_MIN_TEXEL,
    lab: ganzkoerper ? ganzkoerper.lab : null,
    rgb: ganzkoerper ? ganzkoerper.rgb : null,
    L: ganzkoerper ? ganzkoerper.L : null,
    Cab: ganzkoerper ? CabLab(ganzkoerper.lab) : null,
    hue: ganzkoerper ? hueLab(ganzkoerper.lab) : null,
    kandidaten: [], verworfen_zu_klein: [],
  });
  if (!eintrag || !Array.isArray(eintrag.flaechen)) return zurueck('MATERIAL-TABELLE schweigt zu ' + figur);
  const alle = eintrag.flaechen
    .filter((fl) => fl && Array.isArray(fl.toene) && !MATERIALFLAECHE_KEIN_MATERIAL.includes(fl.art))
    .map((fl) => {
      const toene = fl.toene.filter((t) => hist[t]).sort();
      return { name: fl.name, art: fl.art, toene, texel: toene.reduce((a, t) => a + hist[t], 0) };
    })
    .sort((a, b) => b.texel - a.texel || a.name.localeCompare(b.name));
  const gross = alle.filter((k) => k.texel >= MATERIALFLAECHE_MIN_TEXEL);
  if (!gross.length) return zurueck('keine Materialflaeche >= ' + MATERIALFLAECHE_MIN_TEXEL + ' Texel');
  const w = gross[0];
  const m = flaechenMittel(F.grids, w.toene);
  if (!m) return zurueck('Bezugsflaeche ohne Texel im Grid');
  return {
    gefunden: true,
    flaeche_quelle: 'TABELLE groesste Materialflaeche >= ' + MATERIALFLAECHE_MIN_TEXEL + ' Texel',
    name: w.name, art: w.art, toene: w.toene, texel: m.texel,
    min_texel: MATERIALFLAECHE_MIN_TEXEL,
    texel_laut_tabelle: w.texel,
    ton_histogramm: m.hist,
    rgb: m.rgb, lab: m.lab, L: m.L, L_ausMittelfarbe: m.L_ausMittelfarbe,
    Cab: CabLab(m.lab), hue: hueLab(m.lab),
    kandidaten: alle.map((k) => ({ name: k.name, art: k.art, texel: k.texel, zu_klein: k.texel < MATERIALFLAECHE_MIN_TEXEL })),
    verworfen_zu_klein: alle.filter((k) => k.texel < MATERIALFLAECHE_MIN_TEXEL).map((k) => k.name + ' (' + k.texel + ')'),
  };
}

const REVIEW_GRIDS = {
  Held: ['player_down_0', 'player_up_0', 'player_side_0'],
  Bran: ['npc_bran_0'], Hedda: ['npc_hedda_0'], Corm: ['npc_corm_0'],
  Mile: ['npc_mile_0'], Torwaechter: ['npc_torwaechter_0'],
};

// (6) SOLITAER-TEXEL — Texel ohne gleichfarbigen 4er-Nachbarn (Rauschmass).
//     REV 2.3 G-C / ANKER-REGEL 4: "Requisiten sind als Material-Tabellen-
//     Flaeche art:'requisit' deklariert und aus dem Solitaer-Gate ausgenommen;
//     Augen/Glanz als art:'merkmal' (max 12/Grid)." Rim kommt dazu, weil eine
//     1-Texel-Rimkante per Bauart keinen gleichfarbigen Nachbarn hat.
//
//     ABZUGSQUELLEN (in dieser Rangfolge je Ton, damit eine Doppelnennung den
//     Deckel nicht aushebelt):  requisit > rim > merkmal.
//       (1) Materialflaeche mit art:"requisit" / art:"merkmal" / art:"rim".
//       (2) Figur-Feld "merkmal": entweder das Objekt {max_texel_je_grid,
//           posten:[{was,ton,orte}]} — so liefern es die Phase-1b-Tabellen —
//           oder schlicht eine Tonliste. Posten wie "y/Y" oder "i/I/C" werden
//           an '/' zerlegt.
//     DECKEL: hoechstens MERKMAL_DECKEL_JE_GRID (12) Merkmal-Solitaertexel je
//     Grid duerfen abgezogen werden. Reisst ein Grid den Deckel, gibt es fuer
//     dieses Grid GAR KEINEN Merkmal-Abzug (volle Zaehlung) und eine Warnung.
//     Nennt die Tabelle einen eigenen, KLEINEREN max_texel_je_grid, gilt der.
//     Requisit und Rim haben KEINEN Deckel (so steht Regel 4).
//     NENNER unveraendert: alle Nicht-Umriss-Texel. Abgezogen wird nur im
//     ZAEHLER — sonst wuerde jeder Abzug die Quote zweimal schoenen.
const ABZUG_ARTEN = ['requisit', 'merkmal', 'rim'];
const ABZUG_RANG = { requisit: 3, rim: 2, merkmal: 1 };
const MERKMAL_DECKEL_JE_GRID = 12;

function abzugstoeneAusTabelle(figur, tabelle) {
  const eintrag = tabelle && tabelle.figuren ? tabelle.figuren[figur] : null;
  const kategorie = {};        // ton -> 'requisit' | 'rim' | 'merkmal'
  const herkunft = [];
  const wege = [];
  const setze = (roh, kat, quelle) => {
    if (typeof roh !== 'string') return;
    for (const stueck of roh.split('/')) {
      const c = stueck.trim();
      if (c.length !== 1) continue;
      if (!kategorie[c] || ABZUG_RANG[kat] > ABZUG_RANG[kategorie[c]]) kategorie[c] = kat;
      herkunft.push({ ton: c, art: kat, quelle });
    }
  };
  if (eintrag && Array.isArray(eintrag.flaechen)) {
    for (const fl of eintrag.flaechen) {
      if (!fl || !ABZUG_ARTEN.includes(fl.art) || !Array.isArray(fl.toene)) continue;
      wege.push('flaeche art="' + fl.art + '"');
      for (const t of fl.toene) setze(t, fl.art, 'flaeche "' + (fl.name || '') + '"');
    }
  }
  let deckel = MERKMAL_DECKEL_JE_GRID;
  const mk = eintrag ? eintrag.merkmal : null;
  if (mk && typeof mk === 'object' && !Array.isArray(mk) && Array.isArray(mk.posten)) {
    wege.push('feld "merkmal".posten');
    for (const po of mk.posten) if (po) setze(po.ton, 'merkmal', 'merkmal-Posten "' + (po.was || '') + '"');
    if (typeof mk.max_texel_je_grid === 'number' && Number.isFinite(mk.max_texel_je_grid)) {
      deckel = Math.min(MERKMAL_DECKEL_JE_GRID, mk.max_texel_je_grid);
    }
  } else if (Array.isArray(mk)) {
    wege.push('feld "merkmal" (Tonliste)');
    for (const t of mk) setze(t, 'merkmal', 'feld "merkmal"');
  }
  herkunft.sort((a, b) => a.ton.localeCompare(b.ton) || a.art.localeCompare(b.art) || a.quelle.localeCompare(b.quelle));
  return {
    kategorie,
    toene_je_art: Object.fromEntries(ABZUG_ARTEN.map((a) => [a, Object.keys(kategorie).filter((c) => kategorie[c] === a).sort()])),
    herkunft,
    wege: [...new Set(wege)].sort(),
    tabelle_spricht: wege.length > 0,
    merkmal_deckel_je_grid: deckel,
    deckel_regel: 'merkmal <= ' + MERKMAL_DECKEL_JE_GRID + ' Texel je Grid; bei Ueberschreitung KEIN Merkmal-Abzug fuer dieses Grid + Warnung',
  };
}

function messSolitaer(figur, tabelle) {
  const F = FIGUREN[figur];
  const abz = abzugstoeneAusTabelle(figur, tabelle);
  let solitaer = 0, koerper = 0, solitaerMitUmriss = 0, opak = 0;
  let aReqS = 0, aRimS = 0, aMkRohS = 0, aMkWirkS = 0;
  const warnungen = [];
  const proGrid = {};
  for (const key of F.grids) {
    const g = SPRITES[key]; if (!g) continue;
    const { h, w, at } = gridInfo(g);
    let s = 0, kk = 0, aReq = 0, aRim = 0, aMkRoh = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const c = at(x, y);
      if (c === '.') continue;
      opak++;
      const allein = at(x - 1, y) !== c && at(x + 1, y) !== c && at(x, y - 1) !== c && at(x, y + 1) !== c;
      if (allein) solitaerMitUmriss++;
      if (c === 'k' || c === 'n') continue;
      kk++; koerper++;
      if (allein) {
        s++; solitaer++;
        const kat = abz.kategorie[c];
        if (kat === 'requisit') aReq++;
        else if (kat === 'rim') aRim++;
        else if (kat === 'merkmal') aMkRoh++;
      }
    }
    const gerissen = aMkRoh > abz.merkmal_deckel_je_grid;
    const aMk = gerissen ? 0 : aMkRoh;
    if (gerissen) {
      warnungen.push({
        grid: key, merkmal_solitaer_texel: aMkRoh, deckel: abz.merkmal_deckel_je_grid,
        wirkung: 'DECKEL GERISSEN — kein Merkmal-Abzug in diesem Grid, volle Zaehlung',
      });
    }
    const ber = s - aReq - aRim - aMk;
    aReqS += aReq; aRimS += aRim; aMkRohS += aMkRoh; aMkWirkS += aMk;
    proGrid[key] = {
      koerper_texel: kk, solitaer: s, solitaer_pct: kk ? 100 * s / kk : 0,
      abzug_requisit: aReq, abzug_rim: aRim,
      abzug_merkmal_roh: aMkRoh, abzug_merkmal_wirksam: aMk, merkmal_deckel_gerissen: gerissen,
      solitaer_bereinigt: ber, solitaer_bereinigt_pct: kk ? 100 * ber / kk : 0,
    };
  }
  const abzugGesamt = aReqS + aRimS + aMkWirkS;
  const bereinigt = solitaer - abzugGesamt;
  return {
    solitaer_texel: solitaer, koerper_texel: koerper,
    solitaer_pct: koerper ? 100 * solitaer / koerper : 0,
    solitaer_inkl_umriss: solitaerMitUmriss, opak_texel: opak,
    solitaer_inkl_umriss_pct: opak ? 100 * solitaerMitUmriss / opak : 0,
    // ---- Rev 2.3 G-C: Abzug nach ANKER-Regel 4 -----------------------------
    abzug_requisit: aReqS, abzug_rim: aRimS,
    abzug_merkmal_roh: aMkRohS, abzug_merkmal_wirksam: aMkWirkS,
    abzug_gesamt: abzugGesamt,
    solitaer_bereinigt_texel: bereinigt,
    solitaer_bereinigt_pct: koerper ? 100 * bereinigt / koerper : 0,
    merkmal_deckel_warnungen: warnungen,
    merkmal_deckel_gerissen: warnungen.length > 0,
    abzugstoene: abz,
    pro_grid: proGrid,
  };
}

// SELBSTTEST des Solitaer-Abzugs (Rev 2.3 G-C, deterministisch). Er belegt an
// synthetischen Grids alle Pfade UND den Deckel — auch dann, wenn keine echte
// Figur den Deckel reisst. Die Grids sind Schachbrettmuster: dort ist JEDER
// Texel solitaer, die Erwartungswerte sind also von Hand nachzaehlbar.
function abzugSelbsttest() {
  const merkSprites = SPRITES, merkFiguren = FIGUREN;
  const G1 = ['ABAB', 'BABA'];                                    // 8 Koerpertexel, davon 4 'A'
  const G2 = ['ABABABAB', 'BABABABA', 'ABABABAB', 'BABABABA'];    // 32 Koerpertexel, davon 16 'A'
  const G3 = ['kAkB', 'AkBk'];                                    // 4 Umriss-'k' + 4 Koerpertexel, davon 2 'A'
  const F = (tab) => ({ figuren: { T: tab } });
  const faelle = [
    { name: 'Flaeche art="requisit" — kein Deckel', grid: G1,
      tabelle: F({ flaechen: [{ name: 'r', art: 'requisit', toene: ['A'] }] }),
      erwartet: { roh: 8, req: 4, rim: 0, mk_roh: 0, mk_wirksam: 0, bereinigt: 4, warnungen: 0 } },
    { name: 'Flaeche art="rim" — kein Deckel', grid: G1,
      tabelle: F({ flaechen: [{ name: 'r', art: 'rim', toene: ['A'] }] }),
      erwartet: { roh: 8, req: 0, rim: 4, mk_roh: 0, mk_wirksam: 0, bereinigt: 4, warnungen: 0 } },
    { name: 'Flaeche art="merkmal" unter dem Deckel', grid: G1,
      tabelle: F({ flaechen: [{ name: 'm', art: 'merkmal', toene: ['A'] }] }),
      erwartet: { roh: 8, req: 0, rim: 0, mk_roh: 4, mk_wirksam: 4, bereinigt: 4, warnungen: 0 } },
    { name: 'Feld "merkmal".posten (Phase-1b-Form), Posten "A/B"', grid: G3,
      tabelle: F({ merkmal: { max_texel_je_grid: 12, posten: [{ was: 'Auge', ton: 'A' }] } }),
      erwartet: { roh: 4, req: 0, rim: 0, mk_roh: 2, mk_wirksam: 2, bereinigt: 2, warnungen: 0 } },
    { name: 'DECKEL 12 gerissen (16 > 12) -> volle Zaehlung + Warnung', grid: G2,
      tabelle: F({ flaechen: [{ name: 'm', art: 'merkmal', toene: ['A'] }] }),
      erwartet: { roh: 32, req: 0, rim: 0, mk_roh: 16, mk_wirksam: 0, bereinigt: 32, warnungen: 1 } },
    { name: 'eigener, KLEINERER Deckel der Tabelle (3 < 4) greift', grid: G1,
      tabelle: F({ merkmal: { max_texel_je_grid: 3, posten: [{ was: 'x', ton: 'A' }] } }),
      erwartet: { roh: 8, req: 0, rim: 0, mk_roh: 4, mk_wirksam: 0, bereinigt: 8, warnungen: 1 } },
    { name: 'Rangfolge requisit > merkmal: Doppelnennung umgeht den Deckel NICHT als merkmal', grid: G2,
      tabelle: F({ flaechen: [{ name: 'r', art: 'requisit', toene: ['A'] }], merkmal: { max_texel_je_grid: 12, posten: [{ was: 'x', ton: 'A' }] } }),
      erwartet: { roh: 32, req: 16, rim: 0, mk_roh: 0, mk_wirksam: 0, bereinigt: 16, warnungen: 0 } },
    { name: 'Tabelle schweigt -> gar kein Abzug', grid: G1,
      tabelle: F({ flaechen: [{ name: 's', art: 'stoff', toene: ['A', 'B'] }] }),
      erwartet: { roh: 8, req: 0, rim: 0, mk_roh: 0, mk_wirksam: 0, bereinigt: 8, warnungen: 0 } },
  ];
  const ergebnis = faelle.map((f) => {
    SPRITES = { t_selbsttest: f.grid };
    FIGUREN = { T: { grids: ['t_selbsttest'], basis: 't_selbsttest', talk: null, zusatz: [] } };
    const m = messSolitaer('T', f.tabelle);
    const ist = {
      roh: m.solitaer_texel, req: m.abzug_requisit, rim: m.abzug_rim,
      mk_roh: m.abzug_merkmal_roh, mk_wirksam: m.abzug_merkmal_wirksam,
      bereinigt: m.solitaer_bereinigt_texel, warnungen: m.merkmal_deckel_warnungen.length,
    };
    const ok = Object.keys(f.erwartet).every((k) => f.erwartet[k] === ist[k]);
    return { fall: f.name, erwartet: f.erwartet, ist, ok };
  });
  SPRITES = merkSprites; FIGUREN = merkFiguren;
  return ergebnis;
}

// (9) SEITENLICHT — ANKER-REGEL 1 (design/GP7CH1_ANKER_HELD.md, Punkt 1):
//     "SEITENFRAMES FLIP-NEUTRAL: Licht von OBEN ..., keine senkrechte
//      Lichtkante. Abnahmeregel: gemessene Links/Rechts-dL der Koerpertexel in
//      Seitenframes <= 5 L (Held: 2,6-5,2 gegen 21,4 frontal)."
//
//     LESART (so und nur so reproduzieren sich die drei Ankerzahlen):
//       dL = Mittel L601 der Texel LINKS der Grid-Mittelachse (x < (w-1)/2)
//            minus Mittel L601 der Texel RECHTS davon (x > (w-1)/2).
//       Gezaehlt wird JEDER opake Texel, auch Umriss (k/n) und Rim; Texel
//       genau AUF der Achse (nur bei ungerader Breite) zaehlen nicht mit.
//     GEGENPROBE (Stand d95f3fe, aus dem die Ankerzahlen stammen):
//       player_down_0 21,4 | side_0 3,84 | side_1 4,21 | side_2 3,87 |
//       side_3 5,17 | attack_side 2,62  ->  "2,6-5,2 gegen 21,4" exakt.
//     Die Lesart OHNE k/n steht als Zweitlesart daneben, ohne Gate-Wirkung.
//     Seitenframes = Grids der Figur, deren Schluessel "side" enthaelt.
const SEITENLICHT_MAX_dL = 6.5; // Anker-Regel 1 (c0a4739): Viertel-Rampenstufe, vorher 5
const SEITENLICHT_ANKER_HELD = '2,6..5,2 (ANKER-Regel 1; gemessen am Held-Stand d95f3fe, VOR der Profil-Politur aus 2ea79d5)';

function seitenDL(g, ohneUmriss) {
  const { h, w, at } = gridInfo(g);
  const achse = (w - 1) / 2;
  let ls = 0, ln = 0, rs = 0, rn = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const c = at(x, y);
    if (c === '.') continue;
    if (ohneUmriss && (c === 'k' || c === 'n')) continue;
    const L = L601hex(PALETTE[c]);
    if (x < achse) { ls += L; ln++; } else if (x > achse) { rs += L; rn++; }
  }
  if (!ln || !rn) return null;
  return { achse, links_L: ls / ln, rechts_L: rs / rn, dL: ls / ln - rs / rn, links_texel: ln, rechts_texel: rn };
}

function messSeitenlicht(figur) {
  const F = FIGUREN[figur];
  const bau = (key) => {
    const g = SPRITES[key]; if (!g) return null;
    const a = seitenDL(g, false), b = seitenDL(g, true);
    return {
      grid: key,
      dL: a ? a.dL : null,
      dL_betrag: a ? Math.abs(a.dL) : null,
      links_L: a ? a.links_L : null, rechts_L: a ? a.rechts_L : null,
      links_texel: a ? a.links_texel : null, rechts_texel: a ? a.rechts_texel : null,
      hellere_seite: a ? (a.dL > 0 ? 'links' : a.dL < 0 ? 'rechts' : 'gleich') : null,
      zweitlesart_ohne_kn_dL: b ? b.dL : null,
      zweitlesart_ohne_kn_betrag: b ? Math.abs(b.dL) : null,
      ok: a ? Math.abs(a.dL) <= SEITENLICHT_MAX_dL : null,
    };
  };
  const frames = F.grids.filter((k) => /side/.test(k)).map(bau).filter(Boolean);
  const referenz = F.grids.filter((k) => k === F.basis || /_up_0$/.test(k)).map(bau).filter(Boolean);
  const betraege = frames.map((f) => f.dL_betrag);
  return {
    lesart: 'Mittel L601 links der Grid-Mittelachse minus Mittel rechts, ueber ALLE opaken Texel (Umriss und Rim eingeschlossen); Achsentexel zaehlen nicht',
    grenze_dL: SEITENLICHT_MAX_dL,
    anker_referenz_held: SEITENLICHT_ANKER_HELD,
    hat_seitenframes: frames.length > 0,
    seitenframes_anzahl: frames.length,
    frames,
    min_betrag: betraege.length ? Math.min(...betraege) : null,
    max_betrag: betraege.length ? Math.max(...betraege) : null,
    frames_rot: frames.filter((f) => !f.ok).map((f) => f.grid),
    ok: frames.length ? frames.every((f) => f.ok) : null,
    referenz_ohne_gate: referenz,
  };
}

// (7) RIM-ANTEIL DER KONTUR — E5: Rim-Texel liegen AUF oder 1 innerhalb der Kontur.
function messRim(figur, rimBefund) {
  const F = FIGUREN[figur];
  const rim = rimBefund.toene;
  const proGrid = {};
  let konturSum = 0, aufSum = 0, nahSum = 0, gesamtSum = 0;
  for (const key of F.grids) {
    const g = SPRITES[key]; if (!g) continue;
    const { set } = konturVon(g);
    const { h, w, at } = gridInfo(g);
    let auf = 0, nah = 0, ges = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const c = at(x, y);
      if (!rim.includes(c)) continue;
      ges++;
      const aufKontur = set.has(x + ',' + y);
      const einsInnen = set.has((x - 1) + ',' + y) || set.has((x + 1) + ',' + y) || set.has(x + ',' + (y - 1)) || set.has(x + ',' + (y + 1));
      if (aufKontur) { auf++; nah++; } else if (einsInnen) nah++;
    }
    konturSum += set.size; aufSum += auf; nahSum += nah; gesamtSum += ges;
    proGrid[key] = {
      kontur_texel: set.size, rim_texel: ges,
      rim_auf_kontur: auf, rim_e5: nah,
      rim_auf_kontur_pct: set.size ? 100 * auf / set.size : 0,
      rim_e5_pct: set.size ? 100 * nah / set.size : 0,
    };
  }
  const b = proGrid[F.basis] || { rim_auf_kontur_pct: 0, rim_e5_pct: 0, kontur_texel: 0, rim_texel: 0 };
  return {
    rimtoene: rim,
    rim_quelle: rimBefund.quelle,
    rim_tabelle_spricht: rimBefund.tabelle_spricht,
    rim_fallback_aktiv: rimBefund.fallback_aktiv,
    rim_befund: rimBefund,
    basisgrid: F.basis,
    kontur_texel: b.kontur_texel, rim_texel: b.rim_texel,
    rim_auf_kontur_pct: b.rim_auf_kontur_pct,
    rim_e5_pct: b.rim_e5_pct,
    ueber_alle_grids: {
      kontur_texel: konturSum, rim_texel: gesamtSum,
      rim_auf_kontur_pct: konturSum ? 100 * aufSum / konturSum : 0,
      rim_e5_pct: konturSum ? 100 * nahSum / konturSum : 0,
    },
    pro_grid: proGrid,
  };
}

// (8) TALK-DIFF — Texel-% und Silhouetten-%.
function messTalk(figur) {
  const F = FIGUREN[figur];
  if (!F.talk) return null;
  const [ka, kb] = F.talk;
  const a = SPRITES[ka], b = SPRITES[kb];
  if (!a || !b) return { fehler: `Grid fehlt: ${ka}/${kb}` };
  const h = a.length, w = a[0].length;
  let diff = 0, silh = 0, rahmen = 0, opakA = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    rahmen++;
    if (a[y][x] !== b[y][x]) diff++;
    if ((a[y][x] === '.') !== (b[y][x] === '.')) silh++;
    if (a[y][x] !== '.') opakA++;
  }
  return {
    paar: [ka, kb], rahmen_texel: rahmen, opak_vorher: opakA,
    texel_diff: diff, silhouetten_diff: silh,
    texel_diff_pct_rahmen: 100 * diff / rahmen,
    texel_diff_pct_opak: 100 * diff / opakA,
    silhouetten_diff_pct_rahmen: 100 * silh / rahmen,
    silhouetten_diff_pct_opak: 100 * silh / opakA,
    gate_e5_erfuellt: (100 * diff / rahmen) >= 6 && silh > 0,
  };
}

// ============================================================================
// 10  E1 — BAENDER, FENSTER, dE00-ERSATZKLAUSEL
// ============================================================================
function bandVonKlasse(klasseName, kacheln) {
  const Ls = kacheln.map((k) => k.L);
  const lo = Math.min(...Ls), hi = Math.max(...Ls);
  return {
    klasse: klasseName, kacheln: kacheln.length,
    boden_L: [lo, hi],
    band_hell: [hi + 25, lo + 90],          // Figur HELLER als Boden (signed dL 25..90)
    band_dunkel: [hi - 90, lo - 25],        // Figur DUNKLER (nur bei |dL|-Lesart gueltig)
  };
}
function schnitt(intervalle) {
  let lo = -Infinity, hi = Infinity;
  for (const [a, b] of intervalle) { lo = Math.max(lo, a); hi = Math.min(hi, b); }
  return hi >= lo ? [lo, hi] : null;
}

// dE00-Ersatzklausel-Reichweite: welches maximale min-dE00 (ueber ALLE Kacheln
// einer Klasse) ist bei gegebenem Koerper-L, Buntheitsdeckel und Farbsektor
// ueberhaupt erreichbar? Vollstaendiger Rasterscan des sRGB-Wuerfels.
const SEKTOREN = {
  alle:  () => true,
  warm:  (h) => h >= 330 || h <= 110,        // E3: der kuehle Sektor gehoert dem Helden
  kuehl: (h) => h > 180 && h < 330,
};
const CAPS = [15, 20, 25, 30.5];
const L_STUETZEN = [50, 60, 70, 80, 90, 100, 110, 116, 120, 130, 140, 150, 160, 170];
function de00Reichweite(kacheln, schritt) {
  const labs = kacheln.map((k) => k.lab);
  const res = {};      // "L|cap|sektor" -> max min-dE00
  for (let R = 0; R < 256; R += schritt) for (let G = 0; G < 256; G += schritt) for (let B = 0; B < 256; B += schritt) {
    const L = L601(R, G, B);
    const bu = Math.round(L / 2) * 2;
    if (bu < 40 || bu > 180) continue;
    const l = labRGB(R, G, B);
    let mn = Infinity;
    for (const t of labs) { const d = dE00(l, t); if (d < mn) mn = d; }
    const C = CabLab(l), H = hueLab(l);
    for (const cap of CAPS) {
      if (C > cap) continue;
      for (const sn of Object.keys(SEKTOREN)) {
        if (!SEKTOREN[sn](H)) continue;
        const key = bu + '|' + cap + '|' + sn;
        if (!(key in res) || mn > res[key]) res[key] = mn;
      }
    }
  }
  const tabelle = {};
  for (const sn of Object.keys(SEKTOREN)) {
    tabelle[sn] = {};
    for (const cap of CAPS) {
      const zeile = {};
      for (const Lst of L_STUETZEN) {
        const bu = Math.round(Lst / 2) * 2;
        zeile[Lst] = res[bu + '|' + cap + '|' + sn] ?? null;
      }
      // Reichweite = der L-Bereich, in dem >= 25 erreichbar ist
      const ok = [];
      for (let bu = 40; bu <= 180; bu += 2) { const v = res[bu + '|' + cap + '|' + sn]; if (v !== undefined && v >= 25) ok.push(bu); }
      const voll = {};
      for (let bu = 40; bu <= 180; bu += 2) if (res[bu + '|' + cap + '|' + sn] !== undefined) voll[bu] = res[bu + '|' + cap + '|' + sn];
      // Reichweite als LISTE zusammenhaengender Intervalle (nicht min..max —
      // die Kurve hat Loecher, z. B. Weg/warm/C<=25 zwischen L 78 und L 112).
      const intervalle = [];
      for (const bu of ok) {
        const letztes = intervalle[intervalle.length - 1];
        if (letztes && bu === letztes[1] + 2) letztes[1] = bu; else intervalle.push([bu, bu]);
      }
      tabelle[sn]['C<=' + cap] = {
        max_dE00_je_L: zeile,
        max_dE00_je_L_voll: voll,
        reichweite_L: intervalle,
        reichweite_L_huelle: ok.length ? [Math.min(...ok), Math.max(...ok)] : null,
      };
    }
  }
  return tabelle;
}

// ============================================================================
// 11  ZIEL-BREITENBAENDER (E5: "P0.d rechnet Ziel-Breitenbaender je Figur VOR
//     und friert sie ein"; m23: machbar, verlangt Massenspreizung 151..242)
//     Deterministische Suche mit festem LCG-Seed.
// ============================================================================
const SEED = 20260816;
function lcg(seed) { let s = seed >>> 0; return () => { s = (Math.imul(s, 1103515245) + 12345) & 0x7fffffff; return s / 0x7fffffff; }; }
function zielBreitenbaender(schwelle, istMassen) {
  const rnd = lcg(SEED);
  const pool = [];
  for (let i = 0; i < 300000; i++) {
    const kopfTop = Math.floor(rnd() * 5);
    const kopfH = 3 + Math.floor(rnd() * 4);
    const kopfW = 4 + Math.floor(rnd() * 7);
    const rumpfH = 6 + Math.floor(rnd() * 6);
    const schulterW = Math.max(kopfW + 1, 8 + Math.floor(rnd() * 7));
    const beinW = 4 + Math.floor(rnd() * 7);
    // Plausibilitaet ueber das Review-Modell hinaus: Beine schmaler als die
    // Schulter, Kopf schmaler als die Schulter (sonst entstehen Profile, die
    // als Mensch nicht lesen und als Zielvorgabe unbrauchbar sind).
    if (beinW > schulterW - 2) continue;
    if (kopfW > schulterW - 1) continue;
    const p = new Array(24).fill(0);
    let y = kopfTop;
    for (let i2 = 0; i2 < kopfH && y < 24; i2++, y++) p[y] = kopfW;
    const beinTop = y + rumpfH;
    for (; y < Math.min(beinTop, 24); y++) p[y] = schulterW - Math.floor(rnd() * 3);
    for (; y < 24; y++) p[y] = beinW;
    const tot = p.reduce((a, b) => a + b, 0);
    if (tot < 150 || tot > 290) continue;
    pool.push({ p, tot, kopfW, schulterW, beinW, kopfTop, kopfH });
  }
  // Alle gefundenen 6er-Familien sammeln und die nehmen, die dem HEUTIGEN Cast
  // am naechsten liegt (Summe der Massenaenderungen nach Massen-Reihenfolge).
  const istSort = [...istMassen].sort((a, b) => a - b);
  const familien = [];
  for (let t = 0; t < 300000 && familien.length < 200; t++) {
    const satz = [pool[Math.floor(rnd() * pool.length)]];
    for (let k = 0; k < 400 && satz.length < 6; k++) {
      const c = pool[Math.floor(rnd() * pool.length)];
      if (satz.every((s) => profilAehnlichkeit(s.p, c.p) <= schwelle)) satz.push(c);
    }
    if (satz.length !== 6) continue;
    satz.sort((a, b) => a.tot - b.tot || a.p.join(',').localeCompare(b.p.join(',')));
    const kosten = satz.reduce((s, f, i) => s + Math.abs(f.tot - istSort[i]), 0);
    familien.push({ satz, kosten, schluessel: satz.map((f) => f.p.join('')).join('|') });
  }
  if (!familien.length) return { gefunden: false, schwelle };
  familien.sort((a, b) => a.kosten - b.kosten || a.schluessel.localeCompare(b.schluessel));
  const beste = familien[0];
  const tots = beste.satz.map((b) => b.tot);
  return {
    gefunden: true, schwelle,
    kandidatenfamilien: familien.length,
    massenkosten: beste.kosten,
    massenspreizung: Math.max(...tots) / Math.min(...tots),
    hinweis: 'Machbarkeitsbeleg + Zielband, KEINE Zeichenvorschrift. Die Familie erfuellt '
      + 'paarweise <= ' + schwelle + ' bei plausiblen Menschenprofilen (Bein <= Schulter-2, Kopf <= Schulter-1).',
    familie: beste.satz.map((b) => ({ texelsumme: b.tot, kopfbreite: b.kopfW, schulterbreite: b.schulterW, beinbreite: b.beinW, kopf_oberkante_zeile: b.kopfTop, profil: b.p })),
  };
}

// ============================================================================
// 12  LEITPLANKEN NACH SPEC REV 2.2 M2  —  UNTERGRENZEN AUS DEM VORHER-STAND
//     "Held Koerper-L bleibt 78,8 +- 8 (dE00-Pfad NUR ueber Hue/Saettigung,
//      nie Helligkeit); Frame-Diffs >= VORHER (Walk-Paar >= 43 Texel, Attack
//      vs Stand >= 135, side/down >= 161); Frame-Paare ungleich (Bestandsgate)"
//
//     DIE ZAHLEN UNTEN SIND KEINE WUNSCHWERTE, sondern die am HEAD-Stand
//     GEMESSENEN Vorher-Werte. Der Lauf im Modus --vorher rechnet sie nach und
//     meldet jede Abweichung als ANKER-FEHLER (Selbstkontrolle des Werkzeugs).
//     Die drei in der Spec woertlich genannten Werte 43 / 135 / 161 sind unten
//     mit spec:true markiert.
// ============================================================================
const HELD_L_MITTE = 78.8;        // Spec Rev 2.2 M2 (= Review-Lesart ueber die
const HELD_L_TOLERANZ = 8;        //   drei Grids down_0/up_0/side_0, GP7CH1_
                                  //   SPEC_REVIEW B1/m21 "meine Messung ... 78,8")
const HELD_L_BAND = [HELD_L_MITTE - HELD_L_TOLERANZ, HELD_L_MITTE + HELD_L_TOLERANZ];
const SOLITAER_MAX_PCT = 8;       // Landkarte C Zielbild "Solitaer-Texel <= 8 Prozent"

const FRAMEDIFF_ANKER = {
  Held: [
    { id: 'walk_down_01',         a: 'player_down_0',      b: 'player_down_1', rolle: 'Walk-Paar',            untergrenze: 43,  spec: true },
    { id: 'walk_down_12',         a: 'player_down_1',      b: 'player_down_2', rolle: 'Walk-Paar',            untergrenze: 43,  spec: false },
    { id: 'walk_down_23',         a: 'player_down_2',      b: 'player_down_3', rolle: 'Walk-Paar',            untergrenze: 46,  spec: false },
    { id: 'walk_down_30',         a: 'player_down_3',      b: 'player_down_0', rolle: 'Walk-Paar',            untergrenze: 38,  spec: false },
    { id: 'walk_up_01',           a: 'player_up_0',        b: 'player_up_1',   rolle: 'Walk-Paar',            untergrenze: 43,  spec: false },
    { id: 'walk_up_12',           a: 'player_up_1',        b: 'player_up_2',   rolle: 'Walk-Paar',            untergrenze: 43,  spec: false },
    { id: 'walk_up_23',           a: 'player_up_2',        b: 'player_up_3',   rolle: 'Walk-Paar',            untergrenze: 46,  spec: false },
    { id: 'walk_up_30',           a: 'player_up_3',        b: 'player_up_0',   rolle: 'Walk-Paar',            untergrenze: 38,  spec: false },
    { id: 'walk_side_01',         a: 'player_side_0',      b: 'player_side_1', rolle: 'Walk-Paar',            untergrenze: 65,  spec: false },
    { id: 'walk_side_12',         a: 'player_side_1',      b: 'player_side_2', rolle: 'Walk-Paar',            untergrenze: 60,  spec: false },
    { id: 'walk_side_23',         a: 'player_side_2',      b: 'player_side_3', rolle: 'Walk-Paar',            untergrenze: 60,  spec: false },
    { id: 'walk_side_30',         a: 'player_side_3',      b: 'player_side_0', rolle: 'Walk-Paar',            untergrenze: 58,  spec: false },
    { id: 'attack_down_vs_stand', a: 'player_attack_down', b: 'player_down_0', rolle: 'Attack-vs-Stand',      untergrenze: 135, spec: true },
    { id: 'attack_up_vs_stand',   a: 'player_attack_up',   b: 'player_up_0',   rolle: 'Attack-vs-Stand',      untergrenze: 113, spec: false },
    { id: 'attack_side_vs_stand', a: 'player_attack_side', b: 'player_side_0', rolle: 'Attack-vs-Stand',      untergrenze: 103, spec: false },
    { id: 'side_vs_down',         a: 'player_side_0',      b: 'player_down_0', rolle: 'Ansicht-side-vs-down', untergrenze: 161, spec: true },
    { id: 'up_vs_down',           a: 'player_up_0',        b: 'player_down_0', rolle: 'Ansicht-up-vs-down',   untergrenze: 55,  spec: false },
    { id: 'side_vs_up',           a: 'player_side_0',      b: 'player_up_0',   rolle: 'Ansicht-side-vs-up',   untergrenze: 164, spec: false },
    { id: 'die_0_1',              a: 'player_die_0',       b: 'player_die_1',  rolle: 'Sterbe-Paar',          untergrenze: 166, spec: false },
  ],
  Bran: [
    { id: 'idle_0_1',    a: 'npc_bran_0', b: 'npc_bran_1',    rolle: 'Idle-Paar', untergrenze: 146, spec: false },
    { id: 'talk_0_talk', a: 'npc_bran_0', b: 'npc_bran_talk', rolle: 'Talk-Paar', untergrenze: 4,   spec: false },
    { id: 'talk_1_talk', a: 'npc_bran_1', b: 'npc_bran_talk', rolle: 'Talk-Paar', untergrenze: 148, spec: false },
  ],
  Hedda: [
    { id: 'idle_0_1',    a: 'npc_hedda_0', b: 'npc_hedda_1',    rolle: 'Idle-Paar', untergrenze: 116, spec: false },
    { id: 'talk_0_talk', a: 'npc_hedda_0', b: 'npc_hedda_talk', rolle: 'Talk-Paar', untergrenze: 4,   spec: false },
    { id: 'talk_1_talk', a: 'npc_hedda_1', b: 'npc_hedda_talk', rolle: 'Talk-Paar', untergrenze: 116, spec: false },
  ],
  Corm: [
    { id: 'idle_0_1',    a: 'npc_corm_0', b: 'npc_corm_1',    rolle: 'Idle-Paar', untergrenze: 146, spec: false },
    { id: 'talk_0_talk', a: 'npc_corm_0', b: 'npc_corm_talk', rolle: 'Talk-Paar', untergrenze: 4,   spec: false },
    { id: 'talk_1_talk', a: 'npc_corm_1', b: 'npc_corm_talk', rolle: 'Talk-Paar', untergrenze: 148, spec: false },
  ],
  Mile: [
    { id: 'idle_0_1',    a: 'npc_mile_0', b: 'npc_mile_1',    rolle: 'Idle-Paar', untergrenze: 128, spec: false },
    { id: 'talk_0_talk', a: 'npc_mile_0', b: 'npc_mile_talk', rolle: 'Talk-Paar', untergrenze: 4,   spec: false },
    { id: 'talk_1_talk', a: 'npc_mile_1', b: 'npc_mile_talk', rolle: 'Talk-Paar', untergrenze: 128, spec: false },
  ],
  Torwaechter: [
    { id: 'idle_0_1',    a: 'npc_torwaechter_0', b: 'npc_torwaechter_1',    rolle: 'Idle-Paar', untergrenze: 145, spec: false },
    { id: 'talk_0_talk', a: 'npc_torwaechter_0', b: 'npc_torwaechter_talk', rolle: 'Talk-Paar', untergrenze: 4,   spec: false },
    { id: 'talk_1_talk', a: 'npc_torwaechter_1', b: 'npc_torwaechter_talk', rolle: 'Talk-Paar', untergrenze: 143, spec: false },
  ],
};

// Texel-Differenz zweier Grids. Unterschiedliche Masse werden mit '.' aufgefuellt
// (ein groesser gewordenes Grid darf die Differenz nicht kuenstlich senken).
function framediff(ka, kb) {
  const A = SPRITES[ka], B = SPRITES[kb];
  if (!A || !B) return { fehlt: [!A ? ka : null, !B ? kb : null].filter(Boolean), diff: null };
  const h = Math.max(A.length, B.length);
  let diff = 0, silh = 0, rahmen = 0;
  for (let y = 0; y < h; y++) {
    const ra = A[y] || '', rb = B[y] || '';
    const w = Math.max(ra.length, rb.length);
    for (let x = 0; x < w; x++) {
      const ca = ra[x] || '.', cb = rb[x] || '.';
      rahmen++;
      if (ca !== cb) diff++;
      if ((ca === '.') !== (cb === '.')) silh++;
    }
  }
  return { diff, silhouetten_diff: silh, rahmen_texel: rahmen };
}

// ============================================================================
// 13  STAND-UNABHAENGIGE VORARBEIT
//     Karten, Boden-Klassen, Baender und der dE00-Wuerfelscan haengen NICHT an
//     den Figuren-Grids. Sie werden EINMAL gerechnet und von beiden Staenden
//     benutzt (in --beides waere die doppelte Rechnung nur teurer, nie anders).
// ============================================================================
const { tabelle: MATERIAL, herkunft: MATERIAL_HERKUNFT } = materialTabelleLaden();
const PALETTE_PROVENIENZ = pruefePalette();
const RIM_SELBSTTEST = rimResolverSelbsttest();
const RAMPEN_SELBSTTEST = rampenSelbsttest();
const ABZUG_SELBSTTEST = abzugSelbsttest();

function runde(v, n) { const f = Math.pow(10, n); return Math.round(v * f) / f; }

const KLASSENBAND = {};
for (const kl of Object.keys(BODENKLASSEN).sort()) {
  const kacheln = Object.keys(BODENKLASSEN[kl]).sort().map((k) => BODENKLASSEN[kl][k]);
  KLASSENBAND[kl] = { ...bandVonKlasse(kl, kacheln), kachelliste: kacheln.map((k) => ({ art: k.art, L: k.L, karten: k.karten, nurBossKatakomben: k.nurBossKatakomben })) };
  const ohne = kacheln.filter((k) => !k.nurBossKatakomben);
  KLASSENBAND[kl].band_hell_review_kachelsatz = ohne.length ? bandVonKlasse(kl, ohne).band_hell : null;
  KLASSENBAND[kl].boden_L_review_kachelsatz = ohne.length ? bandVonKlasse(kl, ohne).boden_L : null;
}

const DE00_REICHWEITE = { hinweis: 'max erreichbares min-dE00 ueber ALLE Kacheln der Klasse, Rasterscan des sRGB-Wuerfels', schritt: SCHNELL ? null : 3, klassen: {} };
if (!SCHNELL) {
  for (const kl of ['GY-Gras', 'DORF-Lehm', 'Weg', 'Gruft-Stein']) {
    const kacheln = Object.keys(BODENKLASSEN[kl]).sort().map((k) => BODENKLASSEN[kl][k]);
    DE00_REICHWEITE.klassen[kl] = de00Reichweite(kacheln, 3);
  }
}
function capFuer(cab) { for (const c of CAPS) if (cab <= c) return c; return CAPS[CAPS.length - 1]; }
function reichweiteBei(kl, sektor, cap, L) {
  const e = DE00_REICHWEITE.klassen[kl];
  if (!e) return null;
  const voll = e[sektor]['C<=' + cap].max_dE00_je_L_voll;
  const bu = Math.min(180, Math.max(40, Math.round(L / 2) * 2));
  return voll[bu] ?? null;
}

// BAENDER-KONTROLLE: haengt an den KARTEN, nicht an der Kunst -> laeuft in
// jedem Modus (anders als die Figuren-Anker, die die ALTE Kunst beschreiben).
const BAENDER_KONTROLLE = [];
for (const kl of Object.keys(ANKER_BAENDER)) {
  const soll = ANKER_BAENDER[kl];
  const istVoll = KLASSENBAND[kl].band_hell;
  const istReview = KLASSENBAND[kl].band_hell_review_kachelsatz;
  BAENDER_KONTROLLE.push({
    klasse: kl, soll_review: soll,
    ist_alle_5_karten: istVoll,
    ist_review_kachelsatz: istReview,
    kriterium: '|ist - soll| <= 0,5 L',
    ok_gerundet: istReview ? Math.abs(istReview[0] - soll[0]) <= 0.5 && Math.abs(istReview[1] - soll[1]) <= 0.5 : false,
    ok_gerundet_alle_karten: Math.abs(istVoll[0] - soll[0]) <= 0.5 && Math.abs(istVoll[1] - soll[1]) <= 0.5,
  });
}

// ============================================================================
// 14  EIN STAND MESSEN
// ============================================================================
function laufStand(stand, quelle) {
  setzeStand(quelle.sprites);

  // ---- Rim-Toene je Figur AUS DER TABELLE (Rev 2.2 M3a) -------------------
  const TONHIST = {}, RIM = {};
  for (const fig of FIGURNAMEN) {
    TONHIST[fig] = tonHistogramm(FIGUREN[fig].grids);
    RIM[fig] = rimtoeneAusTabelle(fig, MATERIAL, TONHIST[fig]);
  }

  const MESSUNG = { figuren: {} };
  for (const fig of FIGURNAMEN) {
    MESSUNG.figuren[fig] = {
      grids: FIGUREN[fig].grids,
      zusatzgrids: FIGUREN[fig].zusatz,
      m1_umriss: messUmriss(fig),
      m2_spiegel: messSpiegel(fig),
      m4_material: messMaterial(fig, MATERIAL),
      m6_solitaer: messSolitaer(fig, MATERIAL),
      m7_rim: messRim(fig, RIM[fig]),
      m8_talk: messTalk(fig),
      m9_seitenlicht: messSeitenlicht(fig),
    };
  }

  // ---- (3) Profilmatrix ---------------------------------------------------
  const PROFILE = {};
  for (const fig of FIGURNAMEN) PROFILE[fig] = breitenprofil(FIGUREN[fig].basis);
  const PROFILMATRIX = [];
  for (let i = 0; i < FIGURNAMEN.length; i++) for (let j = i + 1; j < FIGURNAMEN.length; j++) {
    const a = FIGURNAMEN[i], b = FIGURNAMEN[j];
    PROFILMATRIX.push({ paar: [a, b], aehnlichkeit: profilAehnlichkeit(PROFILE[a], PROFILE[b]) });
  }
  MESSUNG.m3_profil = {
    formel: '100*(1 - Sum|a_i-b_i| / Sum max(a_i,b_i)) ueber zeilenindizierte Breitenprofile (E5)',
    held_referenz: FIGUREN.Held.basis,
    ziel: '<= 70 paarweise',
    profile: PROFILE,
    texelsummen: Object.fromEntries(FIGURNAMEN.map((f) => [f, PROFILE[f].reduce((a, b) => a + b, 0)])),
    matrix: PROFILMATRIX.slice().sort((x, y) => y.aehnlichkeit - x.aehnlichkeit || x.paar.join('/').localeCompare(y.paar.join('/'))),
    paare_ueber_ziel: PROFILMATRIX.filter((p) => p.aehnlichkeit > 70).length,
  };

  // ---- (5) Koerper-L + dL/dE00 -------------------------------------------
  const KOERPER = {};
  for (const fig of FIGURNAMEN) {
    const F = FIGUREN[fig];
    const e5 = koerperMittel(F.grids, RIM[fig].toene);
    const e5Basis = koerperMittel([F.basis], RIM[fig].toene);
    const e5ReviewGrids = koerperMittel(REVIEW_GRIDS[fig], RIM[fig].toene);
    const rev = koerperReviewLesart(REVIEW_GRIDS[fig]);
    // Rev 2.3 G-N: Bezugsflaeche des dE00-Ersatzpfads.
    const mflaeche = dominanteMaterialflaeche(fig, MATERIAL, e5);
    const klassen = wirkortKlassen(fig);
    const kontrast = {};
    for (const kl of klassen) {
      const kacheln = Object.keys(BODENKLASSEN[kl]).sort().map((k) => BODENKLASSEN[kl][k]);
      kontrast[kl] = kacheln.map((k) => {
        const dGanz = dE00(e5.lab, k.lab);
        const dFl = mflaeche.lab ? dE00(mflaeche.lab, k.lab) : dGanz;
        return {
          art: k.art, boden_L: k.L,
          dL: e5.L - k.L,
          // "dE00" bleibt der GANZKOERPER-Wert (Rueckwaertskompatibilitaet der
          // bestehenden Auswertungen); das GATE rechnet auf dE00_flaeche (G-N).
          dE00: dGanz,
          dE00_ganzkoerper: dGanz,
          dE00_flaeche: dFl,
          dE00_flaeche_name: mflaeche.name,
          dE00_flaeche_texel: mflaeche.texel,
          dL_ok: Math.abs(e5.L - k.L) >= 25 && Math.abs(e5.L - k.L) <= 90,
          dE00_ersatz_ok: dFl >= 25,
          dE00_ersatz_ok_ganzkoerper_lesart: dGanz >= 25,
        };
      }).sort((a, b) => a.boden_L - b.boden_L);
    }
    KOERPER[fig] = {
      wirkort_klassen: klassen,
      standkacheln: fig === 'Held' ? 'alle 5 Karten (MAPS)' : STANDKACHELN[NPC_ID[fig]],
      rim_quelle: RIM[fig].quelle,
      rimtoene: RIM[fig].toene,
      koerper_L_e5: e5.L,
      koerper_L_e5_texel: e5.texel,
      koerper_mittelfarbe_rgb: e5.rgb,
      koerper_mittel_Cab: CabLab(e5.lab),
      koerper_mittel_hue: hueLab(e5.lab),
      koerper_L_e5_nur_basisgrid: e5Basis.L,
      koerper_L_e5_nur_reviewgrids: e5ReviewGrids.L,
      koerper_L_review_lesart: rev.L,
      koerper_L_review_lesart_texel: rev.texel,
      abweichung_e5_gegen_review: e5.L - rev.L,
      // Rev 2.3 G-N — Bezugsflaeche des dE00-Ersatzpfads + BEIDE Mittelfarben.
      de00_bezugsflaeche: mflaeche,
      de00_lesart: 'GATE auf dE00_flaeche (dominante Materialflaeche, Rev 2.3 G-N); dE00_ganzkoerper steht daneben und hat KEINE Gate-Wirkung. Das dL-Fenster bleibt auf Koerper-L (E5).',
      kontrast_je_klasse: kontrast,
    };
  }

  // ---- E1-Fenster + Pfadentscheid ----------------------------------------
  const E1 = { klassenband: KLASSENBAND, figuren: {}, de00_reichweite: DE00_REICHWEITE };
  for (const fig of FIGURNAMEN) {
    const klassen = KOERPER[fig].wirkort_klassen;
    const hell = klassen.map((kl) => KLASSENBAND[kl].band_hell);
    const dunkel = klassen.map((kl) => KLASSENBAND[kl].band_dunkel);
    const fensterHell = schnitt(hell);
    const fensterDunkel = schnitt(dunkel);
    const ohneWeg = klassen.filter((k) => k !== 'Weg').map((kl) => KLASSENBAND[kl].band_hell);
    const fensterOhneWeg = ohneWeg.length ? schnitt(ohneWeg) : null;
    const ohneWegLehm = klassen.filter((k) => k !== 'Weg' && k !== 'DORF-Lehm').map((kl) => KLASSENBAND[kl].band_hell);
    const fensterOhneWegLehm = ohneWegLehm.length ? schnitt(ohneWegLehm) : null;
    const ist = KOERPER[fig].koerper_L_e5;
    E1.figuren[fig] = {
      wirkort_klassen: klassen,
      ist_koerper_L_e5: ist,
      fenster_hell: fensterHell,
      fenster_hell_breite: fensterHell ? fensterHell[1] - fensterHell[0] : null,
      ist_im_fenster_hell: fensterHell ? ist >= fensterHell[0] && ist <= fensterHell[1] : false,
      delta_bis_fenster_hell: fensterHell ? (ist < fensterHell[0] ? fensterHell[0] - ist : (ist > fensterHell[1] ? fensterHell[1] - ist : 0)) : null,
      fenster_dunkel: fensterDunkel,
      fenster_dunkel_breite: fensterDunkel ? fensterDunkel[1] - fensterDunkel[0] : null,
      fenster_dunkel_palettentauglich: fensterDunkel ? fensterDunkel[1] >= L601hex(PALETTE.k) : false,
      fenster_wenn_weg_ueber_dE00: fensterOhneWeg,
      fenster_wenn_weg_und_lehm_ueber_dE00: fensterOhneWegLehm,
      bindende_untergrenze: fensterHell ? klassen.find((kl) => Math.abs(KLASSENBAND[kl].band_hell[0] - fensterHell[0]) < 1e-9) : null,
      bindende_obergrenze: fensterHell ? klassen.find((kl) => Math.abs(KLASSENBAND[kl].band_hell[1] - fensterHell[1]) < 1e-9) : null,
    };
  }
  E1.pfadentscheid = {};
  for (const fig of FIGURNAMEN) {
    const e = E1.figuren[fig];
    const sektor = fig === 'Held' ? 'kuehl' : 'warm';
    const cab = KOERPER[fig].koerper_mittel_Cab;
    const cap = capFuer(cab);
    const ist = e.ist_koerper_L_e5;
    const bindend = e.fenster_hell ? e.wirkort_klassen.filter((kl) => Math.abs(KLASSENBAND[kl].band_hell[0] - e.fenster_hell[0]) < 1e-9) : [];
    const dE00Pfad = {};
    for (const kl of e.wirkort_klassen) {
      if (SCHNELL) { dE00Pfad[kl] = null; continue; }
      const r = DE00_REICHWEITE.klassen[kl];
      if (!r) { dE00Pfad[kl] = null; continue; }
      const eintrag = r[sektor]['C<=' + cap];
      let oeffnetAbCap = null;
      for (const c of CAPS) if ((reichweiteBei(kl, sektor, c, ist) ?? 0) >= 25) { oeffnetAbCap = c; break; }
      dE00Pfad[kl] = {
        sektor, buntheitsdeckel: cap,
        max_dE00_bei_IST_L: reichweiteBei(kl, sektor, cap, ist),
        offen_bei_IST_L: (reichweiteBei(kl, sektor, cap, ist) ?? 0) >= 25,
        reichweite_L_bei_IST_deckel: eintrag.reichweite_L,
        reichweite_L_huelle_bei_IST_deckel: eintrag.reichweite_L_huelle,
        oeffnet_ab_buntheitsdeckel_bei_IST_L: oeffnetAbCap,
        ist_dE00_heute: Math.min(...KOERPER[fig].kontrast_je_klasse[kl].map((k) => k.dE00)),
        // Rev 2.3 G-N: der Gate-Wert (Materialflaeche) steht daneben. Die
        // Reichweiten-Rechnung (max_dE00_bei_IST_L) haengt an Koerper-L und
        // Koerper-C*ab und bleibt deshalb die GANZKOERPER-Groesse.
        ist_dE00_flaeche_heute: Math.min(...KOERPER[fig].kontrast_je_klasse[kl].map((k) => k.dE00_flaeche)),
        bezugsflaeche: KOERPER[fig].de00_bezugsflaeche.name,
        bezugsflaeche_texel: KOERPER[fig].de00_bezugsflaeche.texel,
      };
    }
    const alleBindendOffen = bindend.length > 0 && bindend.every((kl) => dE00Pfad[kl] && dE00Pfad[kl].offen_bei_IST_L);
    let empfehlung;
    if (e.ist_im_fenster_hell) empfehlung = 'dL-Fenster (heute schon erfuellt)';
    else if (Math.abs(e.delta_bis_fenster_hell) <= 15) empfehlung = `dL-Fenster (${runde(e.delta_bis_fenster_hell, 1)} L Weg)`;
    else if (alleBindendOffen) empfehlung = `dE00-Pfad fuer ${bindend.join('+')} (bei IST-Buntheit rechnerisch offen)`;
    else empfehlung = `dL-Fenster PFLICHT (${runde(e.delta_bis_fenster_hell, 1)} L) — dE00-Pfad fuer ${bindend.join('+')} bei IST-Buntheit C*ab ${runde(cab, 1)} NICHT offen`;
    E1.pfadentscheid[fig] = {
      ist_koerper_L: ist, ist_Cab: cab, sektor, buntheitsdeckel: cap,
      ziel_fenster: e.fenster_hell, fenster_breite: e.fenster_hell_breite,
      delta: e.delta_bis_fenster_hell,
      bindende_klassen: bindend,
      de00_pfad: dE00Pfad,
      empfehlung,
    };
  }

  // ---- LEITPLANKEN (Rev 2.2 M2), ALLE Gates auf UNGERUNDETEN Werten -------
  const LEIT = { stand, figuren: {}, bilanz: {} };
  for (const fig of FIGURNAMEN) {
    const F = FIGUREN[fig];

    // (L1) Held-Koerper-L-Band. Die Spec-Zahl 78,8 ist die REVIEW-LESART
    //      (nur k/n raus, Grids down_0/up_0/side_0) — GP7CH1_SPEC_REVIEW m21.
    const lRev = KOERPER[fig].koerper_L_review_lesart;
    const l1 = fig !== 'Held' ? null : {
      groesse: 'koerper_L_review_lesart (down_0/up_0/side_0, nur k/n raus)',
      band: HELD_L_BAND, ist: lRev,
      ist_text: lRev.toFixed(6),
      delta_zur_mitte: lRev - HELD_L_MITTE,
      ok: lRev >= HELD_L_BAND[0] && lRev <= HELD_L_BAND[1],
      zusatz_e5_lesart: KOERPER[fig].koerper_L_e5,
      hinweis: 'E5-Lesart (Kontur+Rim raus, ALLE Grids) steht als zusatz_e5_lesart daneben und hat KEINE Gate-Wirkung.',
    };

    // (L2) Frame-Diff-Untergrenzen
    const anker = FRAMEDIFF_ANKER[fig] || [];
    const l2 = anker.map((a) => {
      const d = framediff(a.a, a.b);
      return {
        id: a.id, paar: [a.a, a.b], rolle: a.rolle, spec_woertlich: a.spec,
        untergrenze: a.untergrenze,
        ist: d.diff, reserve: d.diff === null ? null : d.diff - a.untergrenze,
        silhouetten_diff: d.silhouetten_diff ?? null,
        fehlende_grids: d.fehlt || [],
        ok: d.diff !== null && d.diff >= a.untergrenze,
      };
    });

    // (L3) ALLE Frame-Paare ungleich (Bestandsgate). Vollstaendige Paarmenge
    //      der Grids der Figur, nicht nur die Anker.
    const keys = F.grids.filter((k) => SPRITES[k]);
    const paare = [];
    for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++) {
      const d = framediff(keys[i], keys[j]);
      paare.push({ paar: [keys[i], keys[j]], diff: d.diff });
    }
    const gleiche = paare.filter((p) => p.diff === 0);
    const l3 = {
      paare_geprueft: paare.length,
      minimale_diff: paare.length ? Math.min(...paare.map((p) => p.diff)) : null,
      minimales_paar: paare.length ? paare.slice().sort((a, b) => a.diff - b.diff || a.paar.join('|').localeCompare(b.paar.join('|')))[0].paar : null,
      identische_paare: gleiche.map((p) => p.paar),
      ok: gleiche.length === 0,
    };

    // (L4) Solitaer <= 8 %, UNGERUNDET geprueft (V-TESTS-Befund b).
    //      Rev 2.3 G-C: das GATE rechnet auf dem BEREINIGTEN Wert (Requisit-,
    //      Merkmal-, Rim-Texel abgezogen, ANKER-Regel 4); der ROHE Wert steht
    //      unveraendert daneben und wird mitgemeldet.
    const s = MESSUNG.figuren[fig].m6_solitaer;
    const l4 = {
      groesse: 'solitaer_bereinigt_pct (Umriss ausgenommen; Requisit/Merkmal/Rim abgezogen, ANKER-Regel 4)',
      grenze: SOLITAER_MAX_PCT,
      ist: s.solitaer_bereinigt_pct,
      ist_text: s.solitaer_bereinigt_pct.toFixed(6),
      ist_gerundet_1: Number(s.solitaer_bereinigt_pct.toFixed(1)),
      rundung_haette_getaeuscht: s.solitaer_bereinigt_pct > SOLITAER_MAX_PCT && Number(s.solitaer_bereinigt_pct.toFixed(1)) <= SOLITAER_MAX_PCT,
      zusatz_inkl_umriss_pct: s.solitaer_inkl_umriss_pct,
      roh_pct: s.solitaer_pct,
      roh_text: s.solitaer_pct.toFixed(6),
      roh_ok: s.solitaer_pct <= SOLITAER_MAX_PCT,
      abzug_texel: s.abzug_gesamt,
      abzug_requisit: s.abzug_requisit, abzug_rim: s.abzug_rim,
      abzug_merkmal_roh: s.abzug_merkmal_roh, abzug_merkmal_wirksam: s.abzug_merkmal_wirksam,
      merkmal_deckel_gerissen: s.merkmal_deckel_gerissen,
      merkmal_deckel_warnungen: s.merkmal_deckel_warnungen,
      abzug_tabelle_spricht: s.abzugstoene.tabelle_spricht,
      abzugstoene_je_art: s.abzugstoene.toene_je_art,
      nur_durch_abzug_gruen: s.solitaer_pct > SOLITAER_MAX_PCT && s.solitaer_bereinigt_pct <= SOLITAER_MAX_PCT,
      ok: s.solitaer_bereinigt_pct <= SOLITAER_MAX_PCT,
    };

    // (L5) SEITENLICHT — ANKER-Regel 1, nur fuer Figuren MIT Seitenframes.
    const sl = MESSUNG.figuren[fig].m9_seitenlicht;
    const l5 = sl.hat_seitenframes ? {
      groesse: 'seitenlicht_dL_betrag (groesster Betrag ueber alle Seitenframes)',
      grenze: SEITENLICHT_MAX_dL,
      ist: sl.max_betrag,
      ist_text: sl.max_betrag.toFixed(6),
      spanne: [sl.min_betrag, sl.max_betrag],
      spanne_text: sl.min_betrag.toFixed(2) + '..' + sl.max_betrag.toFixed(2),
      seitenframes: sl.seitenframes_anzahl,
      frames_rot: sl.frames_rot,
      anker_referenz: sl.anker_referenz_held,
      ok: sl.ok,
    } : null;

    // (H) HILFSMASSE OHNE GATE-WIRKUNG — "erkennbare Arme, Schultern, Requisit"
    //     ist nach M1 Sache des BILD-Jurors. Hier stehen nur die Zahlen, die
    //     der Juror danebenlegen kann.
    const req = REQUISITEN[fig];
    const reqTexel = {};
    for (const t of [...req.streng, ...req.strittig]) reqTexel[t] = TONHIST[fig][t] || 0;
    const prof = PROFILE[fig];
    const hilf = {
      requisitentoene_texel: reqTexel,
      requisit_vorhanden: req.streng.length === 0 ? null : req.streng.some((t) => (TONHIST[fig][t] || 0) > 0),
      breitenprofil_basisgrid: prof,
      max_breite: Math.max(...prof),
      max_breite_zeile: prof.indexOf(Math.max(...prof)),
      opake_texel_basisgrid: prof.reduce((a, b) => a + b, 0),
    };

    const gates = [l1, ...l2, l3, l4, l5].filter(Boolean);
    LEIT.figuren[fig] = {
      L1_koerper_L_band: l1,
      L2_framediff_untergrenzen: l2,
      L3_frame_paare_ungleich: l3,
      L4_solitaer: l4,
      L5_seitenlicht: l5,
      H_hilfsmasse_ohne_gate: hilf,
      gates_gesamt: gates.length,
      gates_gruen: gates.filter((g) => g.ok).length,
      gates_rot: [
        ...(l1 && !l1.ok ? ['L1_koerper_L_band'] : []),
        ...l2.filter((g) => !g.ok).map((g) => 'L2:' + g.id),
        ...(l3.ok ? [] : ['L3_frame_paare_ungleich']),
        ...(l4.ok ? [] : ['L4_solitaer']),
        ...(l5 && !l5.ok ? ['L5_seitenlicht'] : []),
      ],
      status: gates.every((g) => g.ok) ? 'gruen' : 'ROT',
    };
  }
  LEIT.bilanz = {
    figuren_gruen: FIGURNAMEN.filter((f) => LEIT.figuren[f].status === 'gruen').length,
    figuren_gesamt: FIGURNAMEN.length,
    gates_gruen: FIGURNAMEN.reduce((a, f) => a + LEIT.figuren[f].gates_gruen, 0),
    gates_gesamt: FIGURNAMEN.reduce((a, f) => a + LEIT.figuren[f].gates_gesamt, 0),
    rot: FIGURNAMEN.flatMap((f) => LEIT.figuren[f].gates_rot.map((g) => f + '/' + g)),
  };

  // ---- KONTROLLE: die Review-ANKER NUR im vorher-Modus --------------------
  //      Begruendung (V-TESTS-Befund c): die Anker beschreiben die ALTE Kunst.
  //      Auf neuer Kunst sind sie per Konstruktion rot und sagen NICHTS ueber
  //      deren Qualitaet — sie kontrollieren das WERKZEUG, nicht das Werk.
  const KONTROLLE = {
    modus: stand,
    anker_geprueft: stand === 'vorher',
    hinweis: stand === 'vorher'
      ? 'Anker-Kontrolle AKTIV: der vorher-Stand MUSS die Review-IST-Werte reproduzieren, sonst misst das Werkzeug falsch.'
      : 'Anker-Kontrolle UEBERSPRUNGEN: die Review-Anker beschreiben die ALTE Kunst (V-TESTS-Befund c). Auf dem nachher-Stand waeren sie per Konstruktion rot. Die Werkzeug-Kontrolle steht im vorher-Lauf.',
    anker: [], profil: [], talk: [],
    framediff_anker: [],
    baender: BAENDER_KONTROLLE,
    bilanz: {},
  };
  function holeGroesse(fig, groesse) {
    const m = MESSUNG.figuren[fig];
    switch (groesse) {
      case 'spiegelgleichheit_bbox': return m.m2_spiegel.spiegelgleichheit_bbox;
      case 'umriss_ton_pct': return m.m1_umriss.umriss_ton_pct;
      case 'umriss_kontur_pct': return m.m1_umriss.umriss_kontur_pct;
      case 'konturtoene_anzahl': return m.m1_umriss.konturtoene_anzahl;
      case 'rim_auf_kontur_pct': return m.m7_rim.rim_auf_kontur_pct;
      case 'rim_e5_pct': return m.m7_rim.rim_e5_pct;
      case 'kontur_texel': return m.m1_umriss.kontur_texel;
      default: throw new Error('unbekannte Groesse ' + groesse);
    }
  }
  if (stand === 'vorher') {
    for (const a of ANKER) {
      const ist = holeGroesse(a.figur, a.groesse);
      KONTROLLE.anker.push({ ...a, ist, abweichung: ist - a.soll, ok: Math.abs(ist - a.soll) <= a.toleranz });
    }
    for (const pz of ANKER_PROFIL) {
      const ist = profilAehnlichkeit(PROFILE[pz.paar[0]], PROFILE[pz.paar[1]]);
      KONTROLLE.profil.push({ ...pz, ist, abweichung: ist - pz.soll, ok: Math.abs(ist - pz.soll) <= pz.toleranz });
    }
    for (const fig of FIGURNAMEN) {
      const t = MESSUNG.figuren[fig].m8_talk;
      if (!t) continue;
      KONTROLLE.talk.push({
        figur: fig, ist_texel_pct: t.texel_diff_pct_rahmen, ist_silhouette_pct: t.silhouetten_diff_pct_rahmen,
        soll_texel_pct: ANKER_TALK.texelDiffPct, soll_silhouette_pct: ANKER_TALK.silhouettenDiffPct,
        ok: Math.abs(t.texel_diff_pct_rahmen - ANKER_TALK.texelDiffPct) <= ANKER_TALK.toleranz
          && Math.abs(t.silhouetten_diff_pct_rahmen - ANKER_TALK.silhouettenDiffPct) <= ANKER_TALK.toleranz,
        quelle: ANKER_TALK.quelle,
      });
    }
    // SELBSTKONTROLLE der neuen Untergrenzen: im vorher-Stand MUSS jede
    // gemessene Frame-Diff EXAKT auf ihrer eingetragenen Untergrenze liegen.
    for (const fig of FIGURNAMEN) for (const g of LEIT.figuren[fig].L2_framediff_untergrenzen) {
      KONTROLLE.framediff_anker.push({
        figur: fig, id: g.id, soll: g.untergrenze, ist: g.ist,
        abweichung: g.ist === null ? null : g.ist - g.untergrenze,
        ok: g.ist === g.untergrenze,
        quelle: 'Rev 2.2 M2 — Untergrenze = Vorher-Wert (HEAD)',
      });
    }
  }
  KONTROLLE.bilanz = {
    anker_gesamt: KONTROLLE.anker.length,
    anker_gruen: KONTROLLE.anker.filter((a) => a.ok).length,
    anker_rot: KONTROLLE.anker.filter((a) => !a.ok).map((a) => a.id),
    profil_gesamt: KONTROLLE.profil.length,
    profil_gruen: KONTROLLE.profil.filter((a) => a.ok).length,
    profil_rot: KONTROLLE.profil.filter((a) => !a.ok).map((a) => a.paar.join('/')),
    talk_gruen: KONTROLLE.talk.filter((a) => a.ok).length,
    talk_gesamt: KONTROLLE.talk.length,
    framediff_anker_gesamt: KONTROLLE.framediff_anker.length,
    framediff_anker_gruen: KONTROLLE.framediff_anker.filter((a) => a.ok).length,
    framediff_anker_rot: KONTROLLE.framediff_anker.filter((a) => !a.ok).map((a) => a.figur + '/' + a.id),
    baender_gruen_review_kachelsatz: KONTROLLE.baender.filter((b) => b.ok_gerundet).length,
    baender_gesamt: KONTROLLE.baender.length,
  };

  const BREITEN = zielBreitenbaender(70, FIGURNAMEN.map((f) => PROFILE[f].reduce((a, b) => a + b, 0)));
  if (BREITEN.gefunden) {
    const nachMasse = FIGURNAMEN.map((f) => ({ figur: f, ist_texel: PROFILE[f].reduce((a, b) => a + b, 0) }))
      .sort((a, b) => a.ist_texel - b.ist_texel);
    BREITEN.zuordnung = nachMasse.map((z, i) => ({
      figur: z.figur, ist_texelsumme: z.ist_texel,
      ziel_texelsumme: BREITEN.familie[i].texelsumme,
      ziel_kopfbreite: BREITEN.familie[i].kopfbreite,
      ziel_schulterbreite: BREITEN.familie[i].schulterbreite,
      ziel_beinbreite: BREITEN.familie[i].beinbreite,
      ziel_kopf_oberkante_zeile: BREITEN.familie[i].kopf_oberkante_zeile,
      delta_texel: BREITEN.familie[i].texelsumme - z.ist_texel,
    }));
    BREITEN.zuordnung.sort((a, b) => FIGURNAMEN.indexOf(a.figur) - FIGURNAMEN.indexOf(b.figur));
  }

  return {
    stand,
    quelle: {
      zeiger: quelle.zeiger,
      commit: quelle.commit,
      sprites_sha256: sha256(quelle.quelltext),
      sprites_bytes: Buffer.byteLength(quelle.quelltext, 'utf8'),
      grids_gesamt: Object.keys(quelle.sprites).length,
    },
    RIM, TONHIST, MESSUNG, PROFILE, KOERPER, E1, LEIT, KONTROLLE, BREITEN,
  };
}

// ============================================================================
// 15  AUSGABE
// ============================================================================
function normalisiere(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? runde(v, 4) : String(v);
  if (Array.isArray(v)) return v.map(normalisiere);
  if (v && typeof v === 'object') {
    const out = {};
    for (const k of Object.keys(v).sort()) out[k] = normalisiere(v[k]);
    return out;
  }
  return v;
}
function schreibe(name, obj) {
  mkdirSync(OUT_DIR, { recursive: true });
  const p = resolve(OUT_DIR, name);
  writeFileSync(p, JSON.stringify(normalisiere(obj), null, 2) + '\n', 'utf8');
  return name;
}

const VORHER_QUELLE = STAENDE.includes('vorher') ? await ladeVorherSprites() : null;
const NACHHER_QUELLE = STAENDE.includes('nachher') ? ladeNachherSprites() : null;
const ERG = {};
for (const st of STAENDE) ERG[st] = laufStand(st, st === 'vorher' ? VORHER_QUELLE : NACHHER_QUELLE);

const KOPF = {
  werkzeug: 'GP7CH1 P0.d figuren_messung.mjs (Rev 2.3 G-L + G-C — Rampen, Solitaer-Abzug, Seitenlicht)',
  spec: 'design/SPEC_GP7CH1.md Rev 2 (E1/E5/E6) + Rev 2.2 M2/M3',
  review: 'design/GP7CH1_SPEC_REVIEW.md, Fix-Formulierungen M5/M6/M7/M8/B1',
  modus: MODUS,
  staende: STAENDE,
  material_tabelle_herkunft: MATERIAL_HERKUNFT,
  material_tabelle_stand: MATERIAL.stand,
  palette_provenienz: PALETTE_PROVENIENZ,
  rim_resolver_selbsttest: RIM_SELBSTTEST,
  rampen_selbsttest: RAMPEN_SELBSTTEST,
  solitaer_abzug_selbsttest: ABZUG_SELBSTTEST,
  rampen_tabelle: RAMPEN,
  determinismus: 'ohne Zeitstempel, Schluessel sortiert, Zahlen auf 4 Stellen gerundet, LCG-Seed ' + SEED,
  formeln: {
    KONTUR: 'opake Texel mit >=1 transparentem 4er-Nachbarn ODER auf der Rahmenkante (E5)',
    UMRISS_ANTEIL: '|Kontur| / |opak|, Ziel <= 25 % (E5)',
    UMRISS_TON_LESART: '|{k,n}| / |opak| — die aeltere Lesart aus Teil A/C, nur zur Kontrolle',
    UMRISSTOENE: 'Toene auf der Kontur mit >= 8 Texeln, ohne Requisitentoene, Ziel >= 3 (E5)',
    SPIEGELGLEICHHEIT: 'Tonvergleich x -> minX+maxX-x um die BBOX-Mittelachse der opaken Texel; ausserhalb der BBOX gilt der Partner als transparent; Paare (transparent,transparent) zaehlen nicht. Ziel <= 65 (E5)',
    PROFILAEHNLICHKEIT: '100*(1 - Sum|a_i-b_i| / Sum max(a_i,b_i)) ueber zeilenindizierte Breitenprofile, Held-Referenz player_down_0, Ziel paarweise <= 70 (E5)',
    HUE_SPANNE: '360 minus groesste Luecke im Kreis der Lab-Hue-Winkel der Toene einer Materialflaeche, Ziel >= 20 Grad',
    STUFEN: 'Anzahl verschiedener Toene der Materialflaeche mit >= 1 Texel (zusaetzlich: >= 8 Texel), Ziel >= 3',
    SCHRITTVERHAELTNIS: 'max(dL601 zwischen L-sortierten Nachbarstufen) / min(dL601), Ziel <= 1,6',
    DOMINANZ: 'Texel der Materialflaeche / alle opaken Texel der Figur ueber ALLE Grids',
    KOERPER_L: 'Mittel von L601 ueber opake Texel, die WEDER Kontur NOCH Rim-Ton sind, ueber ALLE Grids der Figur (E5/m21)',
    KOERPER_L_REVIEW_LESART: 'Mittel von L601 ueber alle opaken Texel ausser k/n, ueber down_0/up_0/side_0 — das ist die Lesart, aus der die Spec-Zahl 78,8 stammt (REVIEW B1/m21)',
    RIM_QUELLE: 'Rev 2.2 M3a: Tabelle Feld "rim" > Tabelle Flaeche art="rim" > FALLBACK Z/_/| (nur die im Grid vorkommenden), Fallback wird ausgewiesen',
    dL: 'Koerper-L minus Kachel-L601 (vorzeichenbehaftet), Ziel 25..90 gegen die Leitkacheln der Boden-Klasse des Wirkorts (E1)',
    dE00: 'CIEDE2000 zwischen Koerper-Mittelfarbe (Ganzkoerper, E5) und Kachel-Mittelfarbe. OHNE Gate-Wirkung seit Rev 2.3 G-N; steht als dE00_ganzkoerper daneben.',
    dE00_FLAECHE: 'Rev 2.3 G-N: CIEDE2000 zwischen der Mittelfarbe der DOMINANTEN MATERIALFLAECHE (groesste Flaeche der Material-Tabelle mit >= ' + MATERIALFLAECHE_MIN_TEXEL + ' Texeln; art umriss/rim/requisit/merkmal scheiden aus) und der Kachel-Mittelfarbe. HIERAUF rechnet die E1-Ersatzklausel: dL<25 gilt als bestanden bei dE00_flaeche >= 25. Schweigt die Tabelle, faellt der Wert auf den Ganzkoerper zurueck (ausgewiesen).',
    dE00_BEZUGSFLAECHE: 'Rev 2.3 G-N: Name/Art/Toene/Texelzahl der Flaeche, auf der der dE00-Ersatzpfad rechnet. Texelzahl = Ton-Histogramm ueber ALLE Grids der Figur, dieselbe Groesse wie DOMINANZ in der Material-Tabelle.',
    SOLITAER: 'opake Nicht-Umriss-Texel ohne gleichfarbigen 4er-Nachbarn, in Prozent der Nicht-Umriss-Texel; Gate <= 8 % UNGERUNDET (Rev 2.2 M3b)',
    SOLITAER_BEREINIGT: 'Rev 2.3 G-C / ANKER-Regel 4: derselbe Zaehler, minus die Solitaertexel, deren Ton die MATERIAL-TABELLE als art:"requisit", art:"merkmal" oder art:"rim" fuehrt (Merkmal zusaetzlich aus dem Figur-Feld "merkmal"). Deckel: <= ' + MERKMAL_DECKEL_JE_GRID + ' Merkmal-Texel je Grid, sonst KEIN Merkmal-Abzug fuer dieses Grid + Warnung. Nenner unveraendert. Das Gate rechnet hierauf, der Rohwert steht daneben.',
    SEITENLICHT: 'Rev 2.3 / ANKER-Regel 1: Mittel L601 der opaken Texel links der Grid-Mittelachse minus Mittel rechts, je Seitenframe; Gate |dL| <= ' + SEITENLICHT_MAX_dL + ' L. Umriss und Rim zaehlen mit (nur so reproduzieren sich die Ankerzahlen 21,4 frontal / 2,6-5,2 Seite am Stand d95f3fe); die Lesart ohne k/n steht als Zweitlesart daneben.',
    RAMPEN: 'Rev 2.3 G-L: RAMPEN kennt die 14 neuen Symboltoene aus palette.js §E3 (Krapp !G%, Wolle &(), Leder :;?, Kittel @[], Held uUX^Z, Rim _|). Die dominante Rampe ist die Rampe mit den meisten Texeln der Figur, Umriss ausgenommen.',
    RIM: 'Rim-Ton-Texel, die AUF der Kontur oder 1 Texel innerhalb liegen, in Prozent von |Kontur|, Ziel >= 12 % (E5)',
    TALK: 'Texel-Diff und Silhouetten-Diff zwischen _0 und _talk, in Prozent der 384 Rahmentexel; Gate E5/§3: >= 6 % Texel MIT Silhouettenaenderung',
    FRAMEDIFF: 'Anzahl Texel, in denen sich zwei Grids unterscheiden (unterschiedliche Masse werden mit "." aufgefuellt); Gate Rev 2.2 M2: >= Vorher-Wert',
  },
};

const DATEIEN = [];
for (const st of STAENDE) {
  const E = ERG[st];
  DATEIEN.push(schreibe(`figuren_messung_${st}.json`, { kopf: { ...KOPF, stand: st, quelle: E.quelle }, bodenklassen_unklassifiziert: BODEN_UNKLAR, messung: E.MESSUNG, koerper: E.KOERPER, ziel_breitenbaender: E.BREITEN }));
  DATEIEN.push(schreibe(`figuren_kontrolle_${st}.json`, { kopf: { ...KOPF, stand: st, quelle: E.quelle }, kontrolle: E.KONTROLLE }));
  DATEIEN.push(schreibe(`figuren_e1fenster_${st}.json`, { kopf: { ...KOPF, stand: st, quelle: E.quelle }, e1: E.E1 }));
  DATEIEN.push(schreibe(`figuren_leitplanken_${st}.json`, { kopf: { ...KOPF, stand: st, quelle: E.quelle }, leitplanken: E.LEIT }));
}
DATEIEN.push(schreibe('figuren_material_IST.json', MATERIAL_IST));

// ---- VERGLEICH (nur --beides) ---------------------------------------------
let VERGLEICH = null;
if (MODUS === 'beides') {
  const V = ERG.vorher, N = ERG.nachher;
  const zeilen = [];
  const push = (figur, gate, soll, v, n, ok_v, ok_n, einheit) => zeilen.push({
    figur, gate, soll,
    vorher: v, nachher: n,
    delta: (typeof v === 'number' && typeof n === 'number') ? n - v : null,
    einheit,
    vorher_ok: ok_v, nachher_ok: ok_n,
    verschlechtert: ok_v === true && ok_n === false,
  });
  for (const f of FIGURNAMEN) {
    const lv = V.LEIT.figuren[f], ln = N.LEIT.figuren[f];
    if (lv.L1_koerper_L_band) push(f, 'L1 Koerper-L (Review-Lesart)', `${HELD_L_BAND[0]} .. ${HELD_L_BAND[1]}`, lv.L1_koerper_L_band.ist, ln.L1_koerper_L_band.ist, lv.L1_koerper_L_band.ok, ln.L1_koerper_L_band.ok, 'L601');
    for (let i = 0; i < lv.L2_framediff_untergrenzen.length; i++) {
      const gv = lv.L2_framediff_untergrenzen[i], gn = ln.L2_framediff_untergrenzen[i];
      push(f, 'L2 ' + gv.id + ' (' + gv.rolle + ')', '>= ' + gv.untergrenze, gv.ist, gn.ist, gv.ok, gn.ok, 'Texel');
    }
    push(f, 'L3 kleinste Frame-Diff', '> 0', lv.L3_frame_paare_ungleich.minimale_diff, ln.L3_frame_paare_ungleich.minimale_diff, lv.L3_frame_paare_ungleich.ok, ln.L3_frame_paare_ungleich.ok, 'Texel');
    push(f, 'L4 Solitaer BEREINIGT', '<= ' + SOLITAER_MAX_PCT + ' %', lv.L4_solitaer.ist, ln.L4_solitaer.ist, lv.L4_solitaer.ok, ln.L4_solitaer.ok, '%');
    push(f, 'L4r Solitaer ROH (ohne Gate)', '<= ' + SOLITAER_MAX_PCT + ' %', lv.L4_solitaer.roh_pct, ln.L4_solitaer.roh_pct, null, null, '%');
    if (lv.L5_seitenlicht || ln.L5_seitenlicht) {
      push(f, 'L5 Seitenlicht |dL| max', '<= ' + SEITENLICHT_MAX_dL + ' L',
        lv.L5_seitenlicht ? lv.L5_seitenlicht.ist : null, ln.L5_seitenlicht ? ln.L5_seitenlicht.ist : null,
        lv.L5_seitenlicht ? lv.L5_seitenlicht.ok : null, ln.L5_seitenlicht ? ln.L5_seitenlicht.ok : null, 'L601');
    }
    // Zusatzgroessen ohne Gate-Wirkung, aber mit Aussagekraft fuer den Juror
    push(f, 'Z Umriss-Anteil', '<= 25 %', V.MESSUNG.figuren[f].m1_umriss.umriss_kontur_pct, N.MESSUNG.figuren[f].m1_umriss.umriss_kontur_pct, null, null, '%');
    push(f, 'Z Spiegelgleichheit', '<= 65 %', V.MESSUNG.figuren[f].m2_spiegel.spiegelgleichheit_bbox, N.MESSUNG.figuren[f].m2_spiegel.spiegelgleichheit_bbox, null, null, '%');
    push(f, 'Z Rim E5', '>= 12 %', V.MESSUNG.figuren[f].m7_rim.rim_e5_pct, N.MESSUNG.figuren[f].m7_rim.rim_e5_pct, null, null, '%');
    push(f, 'Z Koerper-L E5', 'E1-Fenster', V.KOERPER[f].koerper_L_e5, N.KOERPER[f].koerper_L_e5, null, null, 'L601');
  }
  VERGLEICH = {
    kopf: KOPF,
    quelle_vorher: V.quelle, quelle_nachher: N.quelle,
    kunst_unveraendert: V.quelle.sprites_sha256 === N.quelle.sprites_sha256,
    zeilen,
    verschlechterungen: zeilen.filter((z) => z.verschlechtert).map((z) => z.figur + ' / ' + z.gate),
    bilanz: {
      vorher_gates_gruen: V.LEIT.bilanz.gates_gruen, vorher_gates_gesamt: V.LEIT.bilanz.gates_gesamt,
      nachher_gates_gruen: N.LEIT.bilanz.gates_gruen, nachher_gates_gesamt: N.LEIT.bilanz.gates_gesamt,
    },
  };
  DATEIEN.push(schreibe('figuren_vergleich.json', VERGLEICH));
}

// ---- Textbericht ----------------------------------------------------------
const Z = [];
const p = (s = '') => Z.push(s);
const n1 = (v) => (v === null || v === undefined ? '--' : v.toFixed(1));
const n2 = (v) => (v === null || v === undefined ? '--' : v.toFixed(2));
const n3 = (v) => (v === null || v === undefined ? '--' : v.toFixed(3));   // Rev 2.2 M3b: ALLE Prozentwerte 3 Nachkommastellen
const ampel = (ok) => (ok === null || ok === undefined ? '  --  ' : ok ? ' gruen' : ' ROT  ');

p('================================================================================');
p('GP7-CH-1  P0.d  MESSWERKZEUG FIGUREN  —  ROHDATEN   (Rev 2.3 G-L + G-C)');
p('Modus: --' + MODUS + '   Staende: ' + STAENDE.join(' + '));
p('Material-Tabelle: ' + MATERIAL_HERKUNFT);
p('ALLE Prozentwerte mit 3 Nachkommastellen; ALLE Gates rechnen ungerundet.');
p('================================================================================');
p('');
p('--- (0) PALETTE-PROVENIENZ (beide Staende rechnen mit der Working-Tree-Palette)');
if (!PALETTE_PROVENIENZ.pruefbar) {
  p('  NICHT PRUEFBAR: ' + PALETTE_PROVENIENZ.grund);
} else {
  const pg = PALETTE_PROVENIENZ.parser_gegenprobe;
  p('  Parser-Gegenprobe Working Tree: geparst ' + pg.geparst + ' / importiert ' + pg.importiert
    + (pg.ok ? '  -> gruen' : '  -> ROT  nicht geparst: ' + pg.nicht_geparst.join('') + '  ueberzaehlig: ' + pg.ueberzaehlig.join('')));
  p('  Toene HEAD ' + PALETTE_PROVENIENZ.toene_head + '   Working Tree ' + PALETTE_PROVENIENZ.toene_working_tree
    + '   geaenderte Hexwerte ' + PALETTE_PROVENIENZ.geaenderte_hexwerte.length
    + '   nur in HEAD ' + PALETTE_PROVENIENZ.nur_in_head.length
    + '   neu im Working Tree ' + PALETTE_PROVENIENZ.neu_im_working_tree.length);
  p('  additiv-only: ' + (PALETTE_PROVENIENZ.additiv_only ? 'JA — der Vergleich vorher/nachher ist farbseitig sauber' : 'NEIN — ACHTUNG, Hexwerte wurden geaendert:'));
  for (const g of PALETTE_PROVENIENZ.geaenderte_hexwerte) p('     Ton ' + g.ton + ': HEAD ' + g.head + ' -> Working Tree ' + g.working_tree);
  if (PALETTE_PROVENIENZ.neu_im_working_tree.length) p('  neu: ' + PALETTE_PROVENIENZ.neu_im_working_tree.map((x) => x.ton + '=' + x.hex).join('  '));
}
p('');
p('--- (0b) RIM-RESOLVER SELBSTTEST (Rev 2.2 M3a — Nachweis der Tabellen-Lesung)');
p('  FALL                                            ERWARTET       IST            QUELLE');
for (const t of RIM_SELBSTTEST) {
  p('  ' + t.fall.padEnd(48) + ("'" + t.erwartet_toene.join('') + "'").padEnd(15)
    + ("'" + t.ist_toene.join('') + "'").padEnd(15) + t.ist_quelle + (t.ok ? '   gruen' : '   ROT'));
}
p('  Selbsttest: ' + RIM_SELBSTTEST.filter((t) => t.ok).length + '/' + RIM_SELBSTTEST.length + ' gruen');
p('');
p('--- (0c) RAMPEN-SELBSTTEST (Rev 2.3 G-L — die 14 neuen Symboltoene aus palette.js)');
p('  Rampen ' + RAMPEN_SELBSTTEST.rampen_anzahl + '   Toene in Rampen ' + RAMPEN_SELBSTTEST.toene_in_rampen
  + '   doppelt zugeordnet ' + RAMPEN_SELBSTTEST.doppelt_zugeordnet.length
  + '   Rampentoene ohne Paletteneintrag ' + RAMPEN_SELBSTTEST.rampentoene_nicht_in_palette.length
  + '   -> ' + (RAMPEN_SELBSTTEST.ok ? 'gruen' : 'ROT'));
for (const d of RAMPEN_SELBSTTEST.doppelt_zugeordnet) p('  DOPPELT: Ton ' + d.ton + ' in ' + d.rampen.join(' und '));
p('  TABELLE: ' + Object.keys(RAMPEN).map((r) => r + " '" + RAMPEN[r] + "'").join('  '));
p('  Die 14 neuen Toene: ' + NEUE_14_TOENE.map((c) => c + '->' + RAMPEN_SELBSTTEST.neue_14_zuordnung[c]).join('  '));
if (RAMPEN_SELBSTTEST.neue_14_ohne_rampe.length) p('  OHNE RAMPE: ' + RAMPEN_SELBSTTEST.neue_14_ohne_rampe.join(''));
p('  Palettentoene noch ohne Rampe (bewusst, kein Figurenmaterial): '
  + (RAMPEN_SELBSTTEST.palettentoene_ohne_rampe.join('') || 'keine'));
p('');
p('--- (0d) SOLITAER-ABZUG SELBSTTEST (Rev 2.3 G-C — Pfade und Merkmal-Deckel)');
p('  FALL                                                                    ERWARTET (roh/req/rim/mrkRoh/mrkWirk/ber/Warn)   IST');
for (const t of ABZUG_SELBSTTEST) {
  const f = (o) => [o.roh, o.req, o.rim, o.mk_roh, o.mk_wirksam, o.bereinigt, o.warnungen].join('/');
  p('  ' + t.fall.padEnd(72) + f(t.erwartet).padEnd(24) + f(t.ist).padEnd(22) + (t.ok ? 'gruen' : 'ROT'));
}
p('  Selbsttest: ' + ABZUG_SELBSTTEST.filter((t) => t.ok).length + '/' + ABZUG_SELBSTTEST.length + ' gruen');
p('');

for (const st of STAENDE) {
  const E = ERG[st];
  const MESSUNG = E.MESSUNG, KOERPER = E.KOERPER, E1 = E.E1, KONTROLLE = E.KONTROLLE, BREITEN = E.BREITEN, LEIT = E.LEIT;
  p('################################################################################');
  p('# STAND: ' + st.toUpperCase() + '   Quelle: ' + E.quelle.zeiger);
  p('#   sha256(sprites_figuren.js) = ' + E.quelle.sprites_sha256);
  if (E.quelle.commit) p('#   HEAD-Commit = ' + E.quelle.commit);
  p('#   Grids im Modul: ' + E.quelle.grids_gesamt);
  p('################################################################################');
  p('');
  p('--- (R) RIM-TOENE JE FIGUR — WOHER SIE KOMMEN ---------------------------------');
  p('FIGUR         Rimtoene  Quelle                              Tabelle spricht  Fallback');
  for (const f of FIGURNAMEN) {
    const r = E.RIM[f];
    p(f.padEnd(13) + ("'" + r.toene.join('') + "'").padStart(9) + '  ' + r.quelle.padEnd(36)
      + (r.tabelle_spricht ? 'JA' : 'nein').padEnd(17) + (r.fallback_aktiv ? 'AKTIV' : '-'));
  }
  p('');
  p('--- (1) KONTUR / UMRISS-ANTEIL / UMRISSTOENE  (Basisgrid) ----------------------');
  p('FIGUR         opak  Kontur    Kontur%    Ton%(k+n)  Konturtoene  UmrissToene(E5,>=8,ohne Requisit)');
  for (const f of FIGURNAMEN) {
    const m = MESSUNG.figuren[f].m1_umriss;
    p(f.padEnd(13) + String(m.opak).padStart(5) + String(m.kontur_texel).padStart(8)
      + n3(m.umriss_kontur_pct).padStart(11) + n3(m.umriss_ton_pct).padStart(13)
      + '  ' + m.konturtoene.join('').padEnd(12) + ' ' + m.umrisstoene_e5.join('') + ' (' + m.umrisstoene_e5_anzahl + ')');
  }
  p('');
  p('--- (2) SPIEGELGLEICHHEIT (BBOX-Mittelachse) ----------------------------------');
  p('FIGUR             bbox%     grid%   bbox[minX,maxX]  Achse  Achsen identisch');
  for (const f of FIGURNAMEN) {
    const m = MESSUNG.figuren[f].m2_spiegel;
    p(f.padEnd(13) + n3(m.spiegelgleichheit_bbox).padStart(9) + n3(m.spiegelgleichheit_grid).padStart(10)
      + ('  [' + m.bbox.join(',') + ']').padEnd(19) + String(m.bbox_achse).padStart(5) + '  ' + (m.achsen_identisch ? 'ja' : 'nein'));
  }
  p('');
  p('--- (3) PROFILAEHNLICHKEIT (15 Paare, Ziel <= 70) -----------------------------');
  for (const e of MESSUNG.m3_profil.matrix) p('  ' + (e.paar[0] + '/' + e.paar[1]).padEnd(26) + n3(e.aehnlichkeit).padStart(8) + (e.aehnlichkeit > 70 ? '   ROT' : '   gruen'));
  p('  Texelsummen: ' + FIGURNAMEN.map((f) => f + ':' + MESSUNG.m3_profil.texelsummen[f]).join('  '));
  p('  Paare ueber Ziel: ' + MESSUNG.m3_profil.paare_ueber_ziel + ' von 15');
  p('');
  p('--- (4) MATERIALFLAECHEN ------------------------------------------------------');
  for (const f of FIGURNAMEN) {
    const m = MESSUNG.figuren[f].m4_material;
    p('  ' + f + '   dominante Rampe: ' + m.dominante_rampe + '   Texel gesamt ' + m.texel_gesamt + (m.fehler.length ? '   TABELLENFEHLER: ' + m.fehler.join(' | ') : ''));
    p('     Rampen (Umriss ausgenommen): ' + m.rampen.map((r) => r.rampe + ' ' + r.texel).join('  |  '));
    p('     FLAECHE                              Texel     Dom%  Stufen  Hue-Spanne  L-Spanne         Schrittverh.');
    for (const fl of m.flaechen) {
      p('     ' + fl.name.padEnd(36) + String(fl.texel).padStart(5) + n3(fl.dominanz_pct).padStart(9)
        + String(fl.stufen).padStart(8) + n1(fl.hue_spanne_grad).padStart(12)
        + ('  ' + (fl.L_spanne ? n1(fl.L_spanne[0]) + '..' + n1(fl.L_spanne[1]) : '--')).padEnd(17)
        + (fl.schrittverhaeltnis === null ? '--' : fl.schrittverhaeltnis.toFixed(2)).padStart(12));
    }
  }
  p('');
  p('--- (5) KOERPER-L + dL/dE00 GEGEN DIE WIRKORT-LEITKACHELN ---------------------');
  p('FIGUR         KoerperL(E5)  Review-Lesart  Diff   MittelC*ab  Rimtoene  Wirkort-Klassen');
  for (const f of FIGURNAMEN) {
    const k = KOERPER[f];
    p(f.padEnd(13) + n1(k.koerper_L_e5).padStart(12) + n1(k.koerper_L_review_lesart).padStart(15)
      + n1(k.abweichung_e5_gegen_review).padStart(7) + n1(k.koerper_mittel_Cab).padStart(12)
      + ("'" + k.rimtoene.join('') + "'").padStart(10) + '  ' + k.wirkort_klassen.join(', '));
  }
  p('');
  p('  BEZUGSFLAECHE des dE00-ERSATZPFADS (Rev 2.3 G-N: groesste Materialflaeche mit >= ' + MATERIALFLAECHE_MIN_TEXEL + ' Texeln;');
  p('  Flaechen der art umriss/rim/requisit/merkmal scheiden aus. Das dL-Fenster bleibt auf Koerper-L/E5.)');
  p('FIGUR         BEZUGSFLAECHE (art)                                   Toene    Texel  Flaechen-L   C*ab  Quelle');
  for (const f of FIGURNAMEN) {
    const b = KOERPER[f].de00_bezugsflaeche;
    const nm = (b.name === null ? '--' : b.name) + (b.art ? ' (' + b.art + ')' : '');
    p(f.padEnd(13) + (nm.length > 52 ? nm.slice(0, 49) + '...' : nm).padEnd(54)
      + ("'" + b.toene.join('') + "'").padEnd(9) + String(b.texel).padStart(6)
      + n1(b.L).padStart(12) + n1(b.Cab).padStart(7) + '  ' + b.flaeche_quelle);
    if (b.verworfen_zu_klein.length) p('              verworfen (< ' + MATERIALFLAECHE_MIN_TEXEL + ' Texel): ' + b.verworfen_zu_klein.join(', '));
  }
  p('');
  p('  dL / dE00 gegen die HELLSTE und DUNKELSTE Kachel je Klasse.');
  p('  GATE (Rev 2.3 G-N) = dL-Fenster ODER dE00 der BEZUGSFLAECHE >= 25. "GK" = Ganzkoerper-Mittelfarbe, OHNE Gate-Wirkung.');
  for (const f of FIGURNAMEN) {
    const b = KOERPER[f].de00_bezugsflaeche;
    p('  ' + f + '   [Bezugsflaeche ' + (b.name === null ? '--' : b.name) + ' — ' + b.texel + ' Texel]');
    const zeile = (klasse, rolle, k) => '     ' + klasse.padEnd(14) + ' ' + rolle.padEnd(10) + k.art.padEnd(22)
      + ' dL ' + n1(k.dL).padStart(7)
      + ' dE00(Flaeche) ' + n1(k.dE00_flaeche).padStart(5)
      + ' dE00(GK) ' + n1(k.dE00_ganzkoerper).padStart(5)
      + (k.dL_ok ? '  dL-ok' : (k.dE00_ersatz_ok ? '  dE00-ok' : '  ROT'));
    for (const kl of KOERPER[f].wirkort_klassen) {
      const arr = KOERPER[f].kontrast_je_klasse[kl];
      const lo = arr[0], hi = arr[arr.length - 1];
      p(zeile(kl, 'dunkelste', lo));
      p(zeile('', 'hellste', hi));
    }
  }
  p('');
  p('--- (6) SOLITAER-TEXEL (Gate <= 8 %, UNGERUNDET, auf dem BEREINIGTEN Wert) ----');
  p('    Abzug nach ANKER-Regel 4: Solitaertexel, deren Ton die MATERIAL-TABELLE als');
  p('    art:"requisit" / art:"merkmal" / art:"rim" fuehrt. Merkmal-Deckel ' + MERKMAL_DECKEL_JE_GRID + ' Texel je Grid,');
  p('    sonst KEIN Merkmal-Abzug fuer dieses Grid (volle Zaehlung) + Warnung. Nenner unveraendert.');
  p('FIGUR          roh  Koerper      roh%   Abzug (req/rim/mrk)   bereinigt  bereinigt%  Gate   Tabelle');
  for (const f of FIGURNAMEN) {
    const m = MESSUNG.figuren[f].m6_solitaer;
    const g = LEIT.figuren[f].L4_solitaer;
    p(f.padEnd(13) + String(m.solitaer_texel).padStart(5) + String(m.koerper_texel).padStart(9)
      + n3(m.solitaer_pct).padStart(10)
      + ('   ' + m.abzug_gesamt + ' (' + m.abzug_requisit + '/' + m.abzug_rim + '/' + m.abzug_merkmal_wirksam
         + (m.abzug_merkmal_roh !== m.abzug_merkmal_wirksam ? ' von ' + m.abzug_merkmal_roh : '') + ')').padEnd(22)
      + String(m.solitaer_bereinigt_texel).padStart(10) + n3(m.solitaer_bereinigt_pct).padStart(12)
      + ampel(g.ok) + '  ' + (m.abzugstoene.tabelle_spricht ? m.abzugstoene.wege.join(' + ') : 'SCHWEIGT (kein Abzug moeglich)'));
  }
  for (const f of FIGURNAMEN) {
    const m = MESSUNG.figuren[f].m6_solitaer;
    const g = LEIT.figuren[f].L4_solitaer;
    const at = m.abzugstoene.toene_je_art;
    if (m.abzugstoene.tabelle_spricht) {
      p('    ' + f.padEnd(13) + 'Abzugstoene  requisit:' + (at.requisit.join('') || '-')
        + '  rim:' + (at.rim.join('') || '-') + '  merkmal:' + (at.merkmal.join('') || '-')
        + '   Deckel ' + m.abzugstoene.merkmal_deckel_je_grid + '/Grid');
    }
    for (const w of m.merkmal_deckel_warnungen) {
      p('    WARNUNG ' + f + ' / ' + w.grid + ': ' + w.merkmal_solitaer_texel + ' Merkmal-Solitaertexel > Deckel ' + w.deckel + ' -> ' + w.wirkung);
    }
    if (g.nur_durch_abzug_gruen) p('    HINWEIS ' + f + ': roh ' + n3(g.roh_pct) + ' % > 8 %, erst der Abzug macht das Gate gruen.');
    if (g.rundung_haette_getaeuscht) p('    HINWEIS ' + f + ': 1-Stellen-Rundung haette ' + n1(g.ist) + ' <= 8 vorgetaeuscht.');
  }
  p('    (inkl. Umriss, ohne Gate: ' + FIGURNAMEN.map((f) => f + ' ' + n3(MESSUNG.figuren[f].m6_solitaer.solitaer_inkl_umriss_pct)).join('  ') + ')');
  p('');
  p('--- (7) RIM-ANTEIL DER KONTUR (Ziel >= 12 %) ----------------------------------');
  p('FIGUR         Rimtoene  Kontur  RimTexel   auf-Kontur%  E5(auf+1innen)%   Rim-Quelle');
  for (const f of FIGURNAMEN) {
    const m = MESSUNG.figuren[f].m7_rim;
    p(f.padEnd(13) + (m.rimtoene.join('') || '-').padStart(8) + String(m.kontur_texel).padStart(8)
      + String(m.rim_texel).padStart(10) + n3(m.rim_auf_kontur_pct).padStart(14) + n3(m.rim_e5_pct).padStart(17)
      + '   ' + m.rim_quelle);
  }
  p('');
  p('--- (8) TALK-DIFF (Gate E5: >= 6 % Texel MIT Silhouettenaenderung) ------------');
  p('FIGUR         Texel-Diff   %Rahmen     %opak   Silh-Diff   %Rahmen  Gate');
  for (const f of FIGURNAMEN) {
    const t = MESSUNG.figuren[f].m8_talk;
    if (!t) { p(f.padEnd(13) + '  (kein Talk-Grid — Held)'); continue; }
    p(f.padEnd(13) + String(t.texel_diff).padStart(10) + n3(t.texel_diff_pct_rahmen).padStart(10)
      + n3(t.texel_diff_pct_opak).padStart(10) + String(t.silhouetten_diff).padStart(12)
      + n3(t.silhouetten_diff_pct_rahmen).padStart(10) + (t.gate_e5_erfuellt ? '  gruen' : '  ROT'));
  }
  p('');
  p('--- (9) SEITENLICHT — ANKER-REGEL 1 (Gate |dL| <= ' + SEITENLICHT_MAX_dL + ' L je Seitenframe) --------------');
  p('    Lesart: Mittel L601 links der Grid-Mittelachse minus Mittel rechts, ALLE opaken');
  p('    Texel (Umriss und Rim eingeschlossen). Referenz laut ANKER-Dokument: ' + SEITENLICHT_ANKER_HELD);
  p('FIGUR         GRID                  dL     |dL|  heller  linksTexel  rechtsTexel   ohne k/n    Gate');
  for (const f of FIGURNAMEN) {
    const m = MESSUNG.figuren[f].m9_seitenlicht;
    if (!m.hat_seitenframes) { p(f.padEnd(13) + '(keine Seitenframes)'); continue; }
    for (const fr of m.frames) {
      p(f.padEnd(13) + fr.grid.padEnd(22) + n2(fr.dL).padStart(6) + n2(fr.dL_betrag).padStart(9)
        + '  ' + fr.hellere_seite.padEnd(8) + String(fr.links_texel).padStart(10) + String(fr.rechts_texel).padStart(13)
        + n2(fr.zweitlesart_ohne_kn_dL).padStart(11) + ampel(fr.ok));
    }
    p('    ' + f + '  Spanne |dL| ' + n2(m.min_betrag) + '..' + n2(m.max_betrag)
      + '   rot: ' + (m.frames_rot.length ? m.frames_rot.join(', ') : 'keiner'));
    for (const r of m.referenz_ohne_gate) {
      p('    Referenz ohne Gate  ' + r.grid.padEnd(22) + ' dL ' + n2(r.dL) + '   (frontal/rueck: eine senkrechte Lichtkante ist hier ERWUENSCHT)');
    }
  }
  p('');
  p('================================================================================');
  p('LEITPLANKEN NACH SPEC REV 2.2 M2  —  STAND ' + st.toUpperCase());
  p('================================================================================');
  p('L1  HELD-KOERPER-L im Band ' + n3(HELD_L_BAND[0]) + ' .. ' + n3(HELD_L_BAND[1]) + '  (78,8 +- 8, Review-Lesart)');
  const l1 = LEIT.figuren.Held.L1_koerper_L_band;
  p('    IST ' + l1.ist_text + '   Delta zur Mitte ' + (l1.delta_zur_mitte >= 0 ? '+' : '') + l1.delta_zur_mitte.toFixed(6) + '  ->' + ampel(l1.ok));
  p('    (E5-Lesart daneben, OHNE Gate-Wirkung: ' + l1.zusatz_e5_lesart.toFixed(6) + ')');
  p('');
  p('L2  FRAME-DIFF-UNTERGRENZEN (Untergrenze = Vorher-Wert aus HEAD; * = in der Spec woertlich)');
  p('FIGUR         GATE                          ROLLE                   SOLL >=     IST  RESERVE  STATUS');
  for (const f of FIGURNAMEN) {
    for (const g of LEIT.figuren[f].L2_framediff_untergrenzen) {
      p(f.padEnd(13) + (g.id + (g.spec_woertlich ? ' *' : '')).padEnd(30) + g.rolle.padEnd(24)
        + String(g.untergrenze).padStart(7) + String(g.ist === null ? '--' : g.ist).padStart(8)
        + String(g.reserve === null ? '--' : (g.reserve >= 0 ? '+' + g.reserve : g.reserve)).padStart(9) + ampel(g.ok)
        + (g.fehlende_grids.length ? '   GRID FEHLT: ' + g.fehlende_grids.join(',') : ''));
    }
  }
  p('');
  p('L3  ALLE FRAME-PAARE UNGLEICH (vollstaendige Paarmenge der Grids je Figur)');
  p('FIGUR         Paare  kleinste Diff  kleinstes Paar                             identisch  STATUS');
  for (const f of FIGURNAMEN) {
    const g = LEIT.figuren[f].L3_frame_paare_ungleich;
    p(f.padEnd(13) + String(g.paare_geprueft).padStart(6) + String(g.minimale_diff).padStart(15)
      + '  ' + (g.minimales_paar ? g.minimales_paar.join(' / ') : '--').padEnd(42)
      + String(g.identische_paare.length).padStart(9) + ampel(g.ok));
    for (const ip of g.identische_paare) p('              IDENTISCH: ' + ip.join(' / '));
  }
  p('');
  p('L4  SOLITAER <= 8 % (ungerundet, BEREINIGT nach ANKER-Regel 4) — Tabelle (6) oben');
  for (const f of FIGURNAMEN) {
    const g = LEIT.figuren[f].L4_solitaer;
    p('    ' + f.padEnd(13) + 'roh ' + g.roh_text.padStart(10) + ' %  (' + (g.roh_ok ? 'gruen' : 'ROT') + ')   bereinigt '
      + g.ist_text.padStart(10) + ' %  ->' + ampel(g.ok));
  }
  p('');
  p('L5  SEITENLICHT |dL| <= ' + SEITENLICHT_MAX_dL + ' L je Seitenframe (ANKER-Regel 1) — Tabelle (9) oben');
  for (const f of FIGURNAMEN) {
    const g = LEIT.figuren[f].L5_seitenlicht;
    if (!g) { p('    ' + f.padEnd(13) + 'kein Seitenframe — Gate entfaellt'); continue; }
    p('    ' + f.padEnd(13) + 'Seitenframes ' + g.seitenframes + '   |dL| ' + g.spanne_text
      + '   max ' + g.ist_text + '  ->' + ampel(g.ok) + (g.frames_rot.length ? '   ROT: ' + g.frames_rot.join(', ') : ''));
  }
  p('');
  p('BILANZ LEITPLANKEN ' + st.toUpperCase() + ': Gates ' + LEIT.bilanz.gates_gruen + '/' + LEIT.bilanz.gates_gesamt
    + '   Figuren gruen ' + LEIT.bilanz.figuren_gruen + '/' + LEIT.bilanz.figuren_gesamt);
  if (LEIT.bilanz.rot.length) p('ROT: ' + LEIT.bilanz.rot.join(', '));
  p('');
  p('HILFSMASSE OHNE GATE-WIRKUNG (fuer den BILD-Juror: Arme/Schultern/Requisit)');
  p('FIGUR         Requisit vorhanden  Requisitentoene (Texel)          max. Breite  in Zeile  opak(Basisgrid)');
  for (const f of FIGURNAMEN) {
    const h = LEIT.figuren[f].H_hilfsmasse_ohne_gate;
    const rt = Object.keys(h.requisitentoene_texel).sort().map((t) => t + ':' + h.requisitentoene_texel[t]).join(' ') || '(kein Requisit)';
    p(f.padEnd(13) + (h.requisit_vorhanden === null ? 'n/a' : h.requisit_vorhanden ? 'JA' : 'NEIN').padEnd(20)
      + rt.padEnd(33) + String(h.max_breite).padStart(11) + String(h.max_breite_zeile).padStart(10) + String(h.opake_texel_basisgrid).padStart(17));
  }
  p('');
  p('================================================================================');
  p('RECHNUNG (a) KONTROLLE — reproduziert das Werkzeug die IST-Anker des Reviews?');
  p('================================================================================');
  p(KONTROLLE.hinweis);
  p('');
  if (KONTROLLE.anker_geprueft) {
    p('ANKER                     SOLL        IST     ABWEICHUNG   ');
    for (const a of KONTROLLE.anker) {
      p(a.id.padEnd(24) + String(a.soll).padStart(7) + n3(a.ist).padStart(11) + n3(a.abweichung).padStart(14) + (a.ok ? '   gruen' : '   ROT') + '   ' + a.quelle);
    }
    for (const a of KONTROLLE.profil) {
      p(('profil-' + a.paar.join('/')).padEnd(24) + String(a.soll).padStart(7) + n3(a.ist).padStart(11) + n3(a.abweichung).padStart(14) + (a.ok ? '   gruen' : '   ROT'));
    }
    for (const a of KONTROLLE.talk) {
      p(('talk-' + a.figur).padEnd(24) + (a.soll_texel_pct + '/' + a.soll_silhouette_pct).padStart(7) + (n3(a.ist_texel_pct) + '/' + n3(a.ist_silhouette_pct)).padStart(19) + (a.ok ? '   gruen' : '   ROT'));
    }
    p('');
    p('FRAME-DIFF-ANKER (Selbstkontrolle: der vorher-Stand MUSS die eingetragenen Untergrenzen EXAKT treffen)');
    const fdr = KONTROLLE.framediff_anker.filter((a) => !a.ok);
    p('  geprueft ' + KONTROLLE.bilanz.framediff_anker_gesamt + '   getroffen ' + KONTROLLE.bilanz.framediff_anker_gruen
      + (fdr.length ? '   ABWEICHUNGEN: ' + fdr.map((a) => a.figur + '/' + a.id + ' soll ' + a.soll + ' ist ' + a.ist).join(', ') : '   — alle exakt'));
  } else {
    p('(uebersprungen)');
  }
  p('');
  p('BAENDER (E1 nennt sie woertlich; Werkzeug rechnet sie aus den Karten nach — kartenseitig, nicht kunstseitig):');
  p('KLASSE          SOLL(Review)   IST(Review-Kachelsatz)   IST(alle 5 Karten)');
  for (const b of KONTROLLE.baender) {
    p(b.klasse.padEnd(15) + (b.soll_review[0] + '..' + b.soll_review[1]).padStart(12)
      + (b.ist_review_kachelsatz ? (n1(b.ist_review_kachelsatz[0]) + '..' + n1(b.ist_review_kachelsatz[1])) : '--').padStart(24)
      + (n1(b.ist_alle_5_karten[0]) + '..' + n1(b.ist_alle_5_karten[1])).padStart(21) + (b.ok_gerundet ? '   gruen' : '   ROT'));
  }
  p('  Kriterium: |ist - soll| <= 0,5 L. Gruft-Stein bleibt bis zur Spec-Korrektur bewusst ROT:');
  p('  (a) UNTERGRENZE: der Review-Kachelsatz las nur GRAVEYARD/DORF/FLUESTERGRUFT und endete bei');
  p('      water_v L 60,2791 -> 85,2791. Ueber ALLE 5 Karten gehoert floor_decal_bones (BOSS_KAMMER,');
  p('      L 70,0320) dazu -> max+25 = 95,0320. Die Spec-Zahl 85 ist um 9,75 L zu niedrig.');
  p('  (b) OBERGRENZE: crypt_stairs_down L 37,5129 -> min+90 = 127,5129; die Spec schreibt 127.');
  p('  EMPFEHLUNG (Fable): Gruft-Stein auf 95,0..127,5 setzen (ganzzahlig streng: 96..127).');
  p('  WIRKUNG AUF DIE FIGUREN: KEINE — das Held-Fenster bleibt 116,7..127,5.');
  p('');
  p('BILANZ: Anker ' + KONTROLLE.bilanz.anker_gruen + '/' + KONTROLLE.bilanz.anker_gesamt
    + '   Profil ' + KONTROLLE.bilanz.profil_gruen + '/' + KONTROLLE.bilanz.profil_gesamt
    + '   Talk ' + KONTROLLE.bilanz.talk_gruen + '/' + KONTROLLE.bilanz.talk_gesamt
    + '   Framediff-Anker ' + KONTROLLE.bilanz.framediff_anker_gruen + '/' + KONTROLLE.bilanz.framediff_anker_gesamt
    + '   Baender ' + KONTROLLE.bilanz.baender_gruen_review_kachelsatz + '/' + KONTROLLE.bilanz.baender_gesamt);
  if (KONTROLLE.bilanz.anker_rot.length) p('ROT: ' + KONTROLLE.bilanz.anker_rot.join(', '));
  p('');
  p('================================================================================');
  p('RECHNUNG (b) E1-FENSTER  —  Ziel-Koerper-L je Figur ODER dE00-Pfad');
  p('================================================================================');
  p('BODEN-KLASSEN (aus allen 5 Karten in MAPS abgeleitet):');
  p('KLASSE                Kacheln   Boden-L        Band hell (dL 25..90)   Band dunkel');
  for (const kl of Object.keys(KLASSENBAND).sort()) {
    const b = KLASSENBAND[kl];
    p('  ' + kl.padEnd(20) + String(b.kacheln).padStart(5) + '   ' + (n1(b.boden_L[0]) + '..' + n1(b.boden_L[1])).padEnd(14)
      + (n1(b.band_hell[0]) + '..' + n1(b.band_hell[1])).padEnd(24) + n1(b.band_dunkel[0]) + '..' + n1(b.band_dunkel[1]));
  }
  p('');
  p('E1-FENSTER JE FIGUR:');
  p('FIGUR         IST-L   ZIEL-FENSTER (hell)  Breite  Delta   bindet unten/oben        ohne Weg (dE00-Pfad)');
  for (const f of FIGURNAMEN) {
    const e = E1.figuren[f];
    p(f.padEnd(13) + n1(e.ist_koerper_L_e5).padStart(6)
      + ('   ' + (e.fenster_hell ? n1(e.fenster_hell[0]) + '..' + n1(e.fenster_hell[1]) : 'LEER')).padEnd(22)
      + n1(e.fenster_hell_breite).padStart(6)
      + n1(e.delta_bis_fenster_hell).padStart(8)
      + ('   ' + e.bindende_untergrenze + ' / ' + e.bindende_obergrenze).padEnd(25)
      + (e.fenster_wenn_weg_ueber_dE00 ? n1(e.fenster_wenn_weg_ueber_dE00[0]) + '..' + n1(e.fenster_wenn_weg_ueber_dE00[1]) : '--'));
  }
  p('');
  p('DIE TABELLE NACH AUFTRAG  —  Figur -> Ziel-Koerper-L-Fenster ODER dE00-Pfad');
  p('FIGUR         IST-L  IST-C*ab  Sektor  Deckel   ZIEL-FENSTER    Delta   bindet   dE00 heute -> max erreichbar   ENTSCHEID');
  for (const f of FIGURNAMEN) {
    const e = E1.pfadentscheid[f];
    const kl = e.bindende_klassen[0];
    const d = kl ? e.de00_pfad[kl] : null;
    p(f.padEnd(13) + n1(e.ist_koerper_L).padStart(6) + n1(e.ist_Cab).padStart(10)
      + e.sektor.padStart(8) + String(e.buntheitsdeckel).padStart(8)
      + ('   ' + (e.ziel_fenster ? n1(e.ziel_fenster[0]) + '..' + n1(e.ziel_fenster[1]) : 'LEER')).padEnd(16)
      + n1(e.delta).padStart(7) + '   ' + (kl || '-').padEnd(9)
      + (d ? (n1(d.ist_dE00_heute) + ' -> ' + n1(d.max_dE00_bei_IST_L) + (d.offen_bei_IST_L ? ' OFFEN' : ' ZU')) : '--').padEnd(30)
      + e.empfehlung);
  }
  p('');
  p('ZIEL-BREITENBAENDER (E5: von P0.d vorgerechnet und eingefroren; Schwelle <= 70):');
  if (BREITEN.gefunden) {
    p('FIGUR         IST-Texel  ZIEL-Texel  Delta   Kopf  Schulter  Bein  Kopf-Oberkante');
    for (const z of BREITEN.zuordnung) {
      p(z.figur.padEnd(13) + String(z.ist_texelsumme).padStart(9) + String(z.ziel_texelsumme).padStart(12)
        + String(z.delta_texel).padStart(7) + String(z.ziel_kopfbreite).padStart(6)
        + String(z.ziel_schulterbreite).padStart(10) + String(z.ziel_beinbreite).padStart(6)
        + String(z.ziel_kopf_oberkante_zeile).padStart(16));
    }
    p('  Kandidatenfamilien geprueft: ' + BREITEN.kandidatenfamilien + '   Massenspreizung ' + BREITEN.massenspreizung.toFixed(2)
      + '   Summe |Massenaenderung| ' + BREITEN.massenkosten + ' Texel');
  } else p('  KEINE 6er-Familie mit Schwelle <= 70 gefunden.');
  p('');
}

// ---- VERGLEICHSTABELLE ----------------------------------------------------
if (VERGLEICH) {
  p('################################################################################');
  p('# VERGLEICH  VORHER (HEAD) <-> NACHHER (Working Tree)');
  p('################################################################################');
  p('sha256 vorher : ' + VERGLEICH.quelle_vorher.sprites_sha256);
  p('sha256 nachher: ' + VERGLEICH.quelle_nachher.sprites_sha256);
  p('Kunst unveraendert: ' + (VERGLEICH.kunst_unveraendert ? 'JA — beide Staende sind byte-gleich, alle Deltas MUESSEN 0 sein' : 'NEIN'));
  p('');
  p('FIGUR         GATE                                     SOLL         VORHER      NACHHER        DELTA   V    N');
  for (const z of VERGLEICH.zeilen) {
    p(z.figur.padEnd(13) + z.gate.padEnd(41) + String(z.soll).padEnd(12)
      + (typeof z.vorher === 'number' ? (z.einheit === 'Texel' ? String(z.vorher) : n3(z.vorher)) : String(z.vorher)).padStart(11)
      + (typeof z.nachher === 'number' ? (z.einheit === 'Texel' ? String(z.nachher) : n3(z.nachher)) : String(z.nachher)).padStart(13)
      + (z.delta === null ? '--' : (z.einheit === 'Texel' ? (z.delta >= 0 ? '+' + z.delta : String(z.delta)) : (z.delta >= 0 ? '+' : '') + n3(z.delta))).padStart(13)
      + ampel(z.vorher_ok) + ampel(z.nachher_ok));
  }
  p('');
  p('Gates gruen  vorher ' + VERGLEICH.bilanz.vorher_gates_gruen + '/' + VERGLEICH.bilanz.vorher_gates_gesamt
    + '   nachher ' + VERGLEICH.bilanz.nachher_gates_gruen + '/' + VERGLEICH.bilanz.nachher_gates_gesamt);
  p('VERSCHLECHTERUNGEN (vorher gruen -> nachher rot): '
    + (VERGLEICH.verschlechterungen.length ? VERGLEICH.verschlechterungen.join(', ') : 'KEINE'));
  p('');
}

p('Dateien (im Ausgabeverzeichnis): ' + DATEIEN.join(', ') + ', figuren_messung_' + MODUS + '.log');
p('');

const LOG = Z.join('\n');
writeFileSync(resolve(OUT_DIR, 'figuren_messung_' + MODUS + '.log'), LOG, 'utf8');
process.stdout.write(LOG);
process.stdout.write('\nP0D-MESSWERKZEUG-FERTIG\n');

// ############################################################################
// ############################################################################
// ##  GP7-CH-2  P0.a  —  GEGNER-ERWEITERUNG (Spec V10 + Rev 2 E-B1..E-B8)
// ############################################################################
// Alles ab hier ist ADDITIV. Kein Codepfad oberhalb dieser Linie wurde in
// seinem Verhalten geaendert; die EINZIGE Beruehrung des Bestands ist der
// optionale vierte Parameter von rimtoeneAusTabelle() (Vorgabe = das alte
// Verhalten). Beweis: ein Lauf VOR dieser Erweiterung und ein Lauf DANACH
// liefern fuer figuren_*.json und figuren_messung_<modus>.log byte-gleiche
// Dateien (siehe Report P0.a). Die Gegner schreiben eigene Dateien
// (gegner_*.json, gegner_messung_<modus>.log).
//
// BINDENDE GRUNDLAGE
//   design/SPEC_GP7CH2.md Rev 1 + REV 2 (E-A..E-D; Rev 2 schlaegt Rev 1)
//   design/GP7CH2_SPEC_REVIEW.md (Fix-Formulierungen beider Linsen)
//   design/GP7CH2_LANDKARTE.md V1-V13 + Teil A (Engine/Bestand) + Teil C
//
// WAS HIER GEMESSEN WIRD (Auftrag P0.a woertlich)
//   (1) figurenVon fuer 5 Gegner + Schild, Grids aus den SPRITES-Schluesseln
//       des jeweiligen STANDES (neue *_decal-Grids werden automatisch erfasst)
//   (2) REQUISITEN je Gegner (Rost-Schild 4/5/6+y, Warden-Waffe i/I/C,
//       Hund-Auge r/R)
//   (3) Rim-Kandidaten + 'C' (der einzige erzwungene Gegner-Rim,
//       check_gfx6_art:200)
//   (4) WIRKORT-Tabellen aller 4 Kampfkarten aus skeletonSpawns /
//       ghoulSpawns / enemySpawns + Skelett-Adds der BOSS_KAMMER
//   (5) LEITKLASSEN nach E-B1 (>= 80 % der BEGEHBAREN Zellen), Minderheits-
//       ausgabe nach E-B2 (dL/dE00 gegen Weg UND Wasser je Gegner getrennt)
//   (6) Koerper-L (E5) UND Innenraum-Rampenmittel ohne k/n (E-B1/M2:
//       die Zahl, auf die der ZEICHNER zielt) + die Zielzahl je Wertstufe
//   (7) Profil FUSSBUENDIG (E5-Formel, Rohzeilen) ganze Figur + Kopf-Schulter
//       (oberste 6 BELEGTE Zeilen, Grufthund 3 — E-B3/M8) als Matrizen
//   (8) Frame-Diff fuer JEDES Posenpaar (Texel + Silhouette + Zeilenbaender)
//   (9) Halbseiten-dL fuer JEDES Grid (E-B5: jedes Gegner-Grid wird gespiegelt)
//  (10) Schwarz k+n, Konturtoene, Solitaer (Sehnen-Regel E-B8)
//  (11) Gegner-Material-Tabelle im Format GP7CH2/MATERIAL-TABELLE/1
//  (12) ZUSATZ: Ziel-Kopf-Schulter-Profile je Gegner (Suche) + Innenraum-
//       Zielzahlen, als JSON und als Steckbriefzeile
//
// ANKER-LAGE (wichtig, weil zwei bindende Dokumente verschiedene Lesarten
// benutzen — dieselbe Falle wie M2/M17 des Reviews):
//   * Koerper-L, Schwarz k+n, Umriss-Anteil, Rahmen-Anteil, Rim-Anteil,
//     SPIEGEL und Frame-Diff kommen aus Teil A 1.1/1.2/7.2 und werden hier
//     REPRODUZIERT — inklusive der Tatsache, dass Teil As "Spiegel %" eine
//     SILHOUETTEN-Groesse ist (Anteil der opaken Texel, deren bbox-
//     gespiegelter Platz ebenfalls opak ist) und NICHT die E5-Ton-Lesart des
//     Menschen-Werkzeugs. Beide Lesarten stehen nebeneinander.
//   * Das PROFIL kommt aus Teil C 0.3 (fussbuendig) — Teil A 5.1 ist
//     kopfbuendig gerechnet und ausdruecklich KEIN Anker (Review M2/M17).
//   * Teil A 1.2 "Solitaer %" ist mit KEINER Lesart reproduzierbar; Landkarte
//     C H7 dagegen exakt. Solitaer steht deshalb NICHT in der Ankerliste des
//     Auftrags; die C-Werte laufen als Kontroll-Referenz mit.
// ############################################################################

// ---------------------------------------------------------------------------
// G1  FIGUREN + GRIDS
// ---------------------------------------------------------------------------
const GEGNER_NAMEN = ['Skelett', 'Ghul', 'Grufthund', 'Rostpanzer', 'Warden', 'Schild'];

// Familien (E-B4, eingefroren) + Wertstufen (E-B1). Das Fussvolk ist nach
// E-C1 aus CH-2 GESTRICHEN und taucht hier nicht auf.
const GEGNER_FAMILIE = {
  Skelett: 'AUFRECHT-SCHMAL', Ghul: 'AUFRECHT-MASSIG', Rostpanzer: 'AUFRECHT-BREIT',
  Grufthund: 'VIERBEINER', Warden: 'GROSS', Schild: '(Requisit des Rostpanzers)',
};
const WERTLEITER = {
  DUNKEL: { band: [85, 100], figuren: ['Grufthund', 'Rostpanzer'] },
  MITTEL: { band: [105, 113], figuren: ['Ghul'] },
  HELL:   { band: [120, 126], figuren: ['Skelett'] },
  GROSS:  { band: [131, 134], figuren: ['Warden'] },
};
const WERTSTUFE_VON = {};
for (const st of Object.keys(WERTLEITER)) for (const f of WERTLEITER[st].figuren) WERTSTUFE_VON[f] = st;

// Kopf-Schulter-Zonenhoehe (E-B3 / Review M8: "oberste 6 BELEGTE Zeilen;
// der Grufthund (16x12, 6 Zeilen = halbe Figur) mit seinen obersten 3").
const KS_ZEILEN = { Skelett: 6, Ghul: 6, Grufthund: 3, Rostpanzer: 6, Warden: 6, Schild: 6 };
const KS_ZEILEN_ANKER = 6;   // Teil C 0.3 misst ALLE Figuren mit 6 Zeilen

// Grids aus den SCHLUESSELN des Standes (wie HELD_GRIDS oben) — ein Stand mit
// zusaetzlichen *_decal-Grids wird dadurch vollstaendig erfasst.
function gegnerFigurenVon(sprites) {
  const nach = (re) => Object.keys(sprites).filter((k) => re.test(k)).sort();
  return {
    Skelett:    { grids: nach(/^skeleton_/), basis: 'skeleton_0',  talk: null, zusatz: [] },
    Ghul:       { grids: nach(/^ghoul_/),    basis: 'ghoul_0',     talk: null, zusatz: [] },
    Grufthund:  { grids: nach(/^hound_/),    basis: 'hound_0',     talk: null, zusatz: [] },
    // Das Schild ist eine Overlay-Ebene des Rostpanzers (enemies.js:642-656),
    // aber KEIN Koerpergrid — dieselbe Lesart wie sword_slash_* beim Helden
    // (Sektion 2): als zusatz gefuehrt, NICHT in der Koerpermittelung.
    Rostpanzer: { grids: nach(/^rust_/),     basis: 'rust_0',      talk: null, zusatz: nach(/^shield_/) },
    Warden:     { grids: nach(/^warden_/),   basis: 'warden_idle', talk: null, zusatz: [] },
    // ... und zusaetzlich als eigene Gruppe, weil Teil A 1.1/1.2 eigene
    // Ankerzahlen fuer shield_side/up/down fuehrt.
    Schild:     { grids: nach(/^shield_/),   basis: 'shield_side', talk: null, zusatz: [] },
  };
}

// Vollfiguren nach E-C5: Skelett/Ghul/Rost/Hund. Der Warden ist Eichkoerper
// mit Ausnahmeliste (Spiegelgleichheit, Solitaer, Konturtoene-Zahl ausgesetzt);
// das Schild ist ein Requisit und traegt gar keine Figurengates.
const GEGNER_VOLLFIGUR = { Skelett: true, Ghul: true, Grufthund: true, Rostpanzer: true, Warden: false, Schild: false };
const WARDEN_AUSGESETZT = ['spiegelgleichheit', 'solitaer', 'konturtoene_anzahl'];

// ---------------------------------------------------------------------------
// G2  REQUISITENTOENE JE GEGNER  (Teil A 1.5 Punkt 2)
//     streng   = Ton kommt NUR am Requisit vor
//     strittig = Ton ist zugleich Koerperflaeche -> zweite Lesart daneben
// ---------------------------------------------------------------------------
const REQUISITEN_GEGNER = {
  Skelett:    { streng: [], strittig: [] },
  Ghul:       { streng: [], strittig: [] },
  // Seelenglut-Auge: r/R liegen im Bestand ausschliesslich im Schaedel
  // (hound_0 Zeile 3, rechte Kante). In der Material-Tabelle art:"merkmal".
  Grufthund:  { streng: ['r', 'R'], strittig: [] },
  // ROST-SCHILD 4/5/6 + y (Auftrag woertlich): 'y' (Niete/Glanz) kommt NUR
  // am Schild vor -> streng. 4/5/6 sind ZUGLEICH die Panzerrampe des
  // Rostpanzers -> strittig, beide Lesarten werden ausgegeben.
  Rostpanzer: { streng: ['y'], strittig: ['4', '5', '6'] },
  // WARDEN-WAFFE: die Klinge steht als senkrechte Saeule in den Spalten
  // 11-13, Zeilen 15-31 (warden_idle). i/I kommen nur dort vor -> streng.
  // 'C' ist der KLINGENKERN und zugleich der einzige Rim-Kandidat im
  // Gegner-Bestand -> strittig (siehe G3 und die Abweichungsliste).
  Warden:     { streng: ['i', 'I'], strittig: ['C'] },
  Schild:     { streng: ['y'], strittig: ['4', '5', '6'] },
};

// ---------------------------------------------------------------------------
// G3  RIM-KANDIDATEN DER GEGNER  (Teil A 1.5 Punkt 3)
//     'C' (#3c5a70) ist der EINZIGE heute existierende Gegner-Rim und per
//     Gate erzwungen (.tmp/check_gfx6_art.mjs:200 "ghoul_0: kuehler Rim C
//     fehlt"). Ohne 'C' im Fallback misst das Werkzeug Ghul-Rim = 0.
//     Z/_/| bleiben wie beim Menschen-Cast.
// ---------------------------------------------------------------------------
const RIM_FALLBACK_KANDIDATEN_GEGNER = ['C', 'Z', '_', '|'];

// ---------------------------------------------------------------------------
// G4  MATERIAL-TABELLE DER GEGNER  (Teil A 1.5 Punkt 6: es gibt KEINE)
//     FORMAT "GP7CH2/MATERIAL-TABELLE/1" — identisch zur CH-1-Form, nur mit
//     eigener Formatkennung, damit eine Menschen-Tabelle nicht versehentlich
//     als Gegner-Tabelle geladen wird. Pflichtfelder je Figur:
//       "rim":     Toene, die als RIMLIGHT wirken (orthogonal zu "flaechen").
//                  Fehlt das Feld UND gibt es keine Flaeche art:"rim", greift
//                  der Fallback C/Z/_/| und wird ausgewiesen.
//       "flaechen": [{name, art, toene}], art aus
//                  stoff|leder|haut|metall|holz|stein|knochen|umriss|rim|
//                  requisit|merkmal
//     REGEL: jeder Ton der Grids steht in GENAU einer Flaeche (das Werkzeug
//     meldet Luecken und Doppelnennungen).
//
//     DIESE TABELLE IST DIE IST-AUFNAHME VON P0.a, KEINE LIEFERUNG DES
//     ZEICHNERS. Phase 1 ersetzt sie figurweise ueber --material-gegner.
// ---------------------------------------------------------------------------
const MATERIAL_GEGNER_IST = {
  $format: 'GP7CH2/MATERIAL-TABELLE/1',
  stand: 'IST vor GP7-CH-2 (Gegner-Grids im Stand game/js/art/sprites_figuren.js)',
  quelle: 'P0.a, handbestimmt aus der Zeilen-/Spaltenlesung der heutigen Grids '
    + '(Tonzensus gegengeprueft). KEINE Lieferung des Art-Agenten — Phase 1 '
    + 'liefert je Gegner die eigene Tabelle im selben Format (--material-gegner <pfad>).',
  figuren: {
    // b/B/N = Knochenrampe O/B/b/N ohne O (kommt im Skelett nicht vor).
    // 'b' traegt 148 von 192 Nicht-Schwarz-Texeln = 77,1 % (Teil A 1.3).
    Skelett: { rim: [], flaechen: [
      { name: 'Knochen', art: 'knochen', toene: ['B', 'b', 'N'] },
      { name: 'Silhouettenkante', art: 'umriss', toene: ['k'] },
    ] },
    // g (#3a3542, Steinrampe) + d (#585a2c, oliv) sind zwei unverwandte
    // Materialien in EINER Flaeche (Landkarte C H8) — als solche gefuehrt,
    // damit der Befund messbar bleibt.
    Ghul: { flaechen: [
      { name: 'Lumpen (Stein g + Oliv d, Materialbruch)', art: 'stoff', toene: ['d', 'g'] },
      { name: 'Schaedel', art: 'knochen', toene: ['3', 'H'] },
      { name: 'Rimkante (kuehl, senkrecht links = Flip-Fehler G-F)', art: 'rim', toene: ['C'] },
      { name: 'Silhouettenkante', art: 'umriss', toene: ['k'] },
    ] },
    // z/p/v/P/V = ERDRAMPE des Weges inkl. dessen Spitzlicht V (Sperrliste!).
    Grufthund: { rim: [], flaechen: [
      { name: 'Fell/Haut (ERDRAMPE — Sperrliste E6/V3)', art: 'leder', toene: ['P', 'V', 'p', 'v', 'z'] },
      { name: 'Zaehne/Knochen', art: 'knochen', toene: ['b'] },
      { name: 'Auge', art: 'merkmal', toene: ['R', 'r'] },
      { name: 'Silhouettenkante', art: 'umriss', toene: ['k'] },
    ] },
    // 4/5/6 = Rostrampe (E6: EXKLUSIV beim Torwaechter; V5 loest das
    // ortsgetrennt auf). O/B/b/N = geteilte Knochenrampe mit dem Skelett.
    Rostpanzer: { rim: [], flaechen: [
      { name: 'Rostpanzer (Rampe 4/5/6, ortsgetrennt exklusiv V5)', art: 'metall', toene: ['4', '5', '6'] },
      { name: 'Knochen (geteilter Leitton mit Skelett/Warden)', art: 'knochen', toene: ['B', 'N', 'O', 'b'] },
      { name: 'Silhouettenkante', art: 'umriss', toene: ['k', 'n'] },
    ] },
    // 19 Toene, reichste Figur des Spiels. u/U/X = HELDEN-Umhangrampe
    // (Bestand, CH-4-Notiz). i/I/C = Klingensaeule (Requisit!), 7/8 = Glut.
    Warden: { flaechen: [
      { name: 'Knochen/Panzerplatten', art: 'knochen', toene: ['B', 'N', 'O', 'b'] },
      { name: 'Umhang/Stoff (HELDEN-Rampe u/U/X, Bestand)', art: 'stoff', toene: ['U', 'X', 'u'] },
      { name: 'Rostschienen', art: 'metall', toene: ['4', '5', '6'] },
      { name: 'Guertel/Gold', art: 'metall', toene: ['Y', 'y'] },
      { name: 'Glut/Seelenfeuer (Augen + Brustrunen)', art: 'merkmal', toene: ['7', '8'] },
      { name: 'Waffe/Klingensaeule (Spalten 11-13, Zeilen 15-31)', art: 'requisit', toene: ['C', 'I', 'i'] },
      { name: 'Silhouettenkante', art: 'umriss', toene: ['k', 'n'] },
    ] },
    Schild: { rim: [], flaechen: [
      { name: 'Rostplatte (Rampe 4/5/6)', art: 'metall', toene: ['4', '5', '6'] },
      { name: 'Niete/Glanz', art: 'merkmal', toene: ['y'] },
      { name: 'Silhouettenkante', art: 'umriss', toene: ['k'] },
    ] },
  },
};
const MATERIAL_GEGNER_PFAD = arg('--material-gegner', null);
function materialGegnerLaden() {
  if (!MATERIAL_GEGNER_PFAD) return { tabelle: MATERIAL_GEGNER_IST, herkunft: 'eingebaute IST-Handtabelle (P0.a)' };
  const roh = JSON.parse(readFileSync(resolve(MATERIAL_GEGNER_PFAD), 'utf8'));
  if (roh.$format !== 'GP7CH2/MATERIAL-TABELLE/1' && roh.$format !== 'GP7CH1/MATERIAL-TABELLE/1') {
    throw new Error(`MATERIAL-TABELLE GEGNER: $format erwartet "GP7CH2/MATERIAL-TABELLE/1", gelesen "${roh.$format}"`);
  }
  return { tabelle: roh, herkunft: resolve(MATERIAL_GEGNER_PFAD) };
}
const { tabelle: MATERIAL_GEGNER, herkunft: MATERIAL_GEGNER_HERKUNFT } = materialGegnerLaden();

// ---------------------------------------------------------------------------
// G5  ANKER  (Kontrollpflicht: "Positivkontrolle muss ALLE reproduzieren")
// ---------------------------------------------------------------------------
// (a) Teil A 1.1 — Koerper-L (E5, Kontur UND Rim raus, ueber ALLE Grids)
const GEGNER_ANKER_KOERPER_L = [
  { figur: 'Skelett',    soll: 162.5, toleranz: 0.4, quelle: 'Teil A 1.1 (Review koerperL.mjs: 162,6)' },
  { figur: 'Ghul',       soll: 96.0,  toleranz: 0.4, quelle: 'Teil A 1.1 (Review: 96,2)' },
  { figur: 'Grufthund',  soll: 75.4,  toleranz: 0.4, quelle: 'Teil A 1.1 (Review: 75,6)' },
  { figur: 'Rostpanzer', soll: 112.7, toleranz: 0.4, quelle: 'Teil A 1.1 (Review: 112,8)' },
  { figur: 'Warden',     soll: 139.5, toleranz: 0.4, quelle: 'Teil A 1.1 (Review: 139,2)' },
  { figur: 'Schild',     soll: 89.3,  toleranz: 0.4, quelle: 'Teil A 1.1' },
];
// (b) Teil A 1.2 — je GRID: Umriss (geom.), Schwarz k+n, Rim, Spiegel, Rahmen.
//     "spiegel" ist die SILHOUETTEN-Lesart (siehe Kopfkommentar), "rim" ist
//     |Rimtexel| / |Kontur| (nicht die E5-Naehelesart des Menschen-Werkzeugs).
const GEGNER_ANKER_GRID = [
  { grid: 'skeleton_0',      umriss: 49.3, schwarz: 37.3, rim: 0,    spiegel: 95.5, rahmen: 52.3 },
  { grid: 'skeleton_1',      umriss: 49.3, schwarz: 37.3, rim: 0,    spiegel: 95.5, rahmen: 52.3 },
  { grid: 'skeleton_die',    umriss: 51.0, schwarz: 52.9, rim: 0,    spiegel: 96.1, rahmen: 19.9 },
  { grid: 'ghoul_0',         umriss: 34.5, schwarz: 37.9, rim: 12.9, spiegel: 86.7, rahmen: 63.4 },
  { grid: 'ghoul_1',         umriss: 35.5, schwarz: 37.9, rim: 12.5, spiegel: 87.7, rahmen: 63.4 },
  { grid: 'hound_0',         umriss: 42.3, schwarz: 40.5, rim: 0,    spiegel: 92.8, rahmen: 57.8 },
  // Teil A 1.2 fuehrt hound_0/_1 in EINER Zeile und nennt fuer Schwarz und
  // Rahmen nur EINEN Wert — den von hound_0. hound_1 hat 107 statt 111 opake
  // Texel; Schwarz 40,2 und Rahmen 55,7 sind die ECHTEN Werte des zweiten
  // Grids. Beide stehen hier als null (= "Teil A macht dazu keine Aussage"),
  // sonst kontrollierte das Werkzeug eine Sammelzeile statt einer Messung.
  { grid: 'hound_1',         umriss: 43.9, schwarz: null, rim: 0,    spiegel: 92.5, rahmen: null },
  { grid: 'hound_telegraph', umriss: 37.7, schwarz: 41.5, rim: 0,    spiegel: 81.1, rahmen: null },
  { grid: 'hound_leap',      umriss: 40.4, schwarz: 46.2, rim: 0,    spiegel: 73.1, rahmen: null },
  { grid: 'hound_down',      umriss: 44.0, schwarz: 49.3, rim: 0,    spiegel: 90.7, rahmen: null },
  { grid: 'hound_die',       umriss: 43.0, schwarz: 44.3, rim: 0,    spiegel: 86.1, rahmen: null },
  { grid: 'rust_0',          umriss: 34.8, schwarz: 44.9, rim: 0,    spiegel: 92.1, rahmen: 61.8 },
  { grid: 'rust_1',          umriss: 36.5, schwarz: 44.9, rim: 0,    spiegel: 92.1, rahmen: 61.8 },
  { grid: 'warden_idle',     umriss: 19.7, schwarz: 24.2, rim: 12.5, spiegel: 94.7, rahmen: 68.8 },
  { grid: 'warden_dash',     umriss: 24.1, schwarz: 21.1, rim: 4.8,  spiegel: 63.1, rahmen: null },
  { grid: 'shield_side',     umriss: 40.6, schwarz: 40.6, rim: 0,    spiegel: 100,  rahmen: 88.9 },
  // Dasselbe fuer shield_side/up/down: Teil A nennt Umriss, Schwarz und
  // Rahmen einmal fuer alle drei (= die Werte von shield_side). shield_up ist
  // 12x6 statt 6x12 und liegt bei Umriss 40,7 / Rahmen 81,9.
  { grid: 'shield_up',       umriss: null, schwarz: null, rim: 0,    spiegel: 98.3, rahmen: null },
  { grid: 'shield_down',     umriss: 40.6, schwarz: 40.6, rim: 0,    spiegel: 100,  rahmen: 88.9 },
];
const GEGNER_ANKER_GRID_TOLERANZ = 0.06;   // Teil A rundet auf 1 Nachkommastelle
// (c) Teil A 7.2 — Frame-Diffs (Texel + Silhouette) der fuenf Lauf-Paare
const GEGNER_ANKER_FRAMEDIFF = [
  { id: 'skeleton_0/_1',   a: 'skeleton_0',    b: 'skeleton_1',    texel: 12, silhouette: 8,  texel_pct: 9.0,  silhouette_pct: 6.0 },
  { id: 'ghoul_0/_1',      a: 'ghoul_0',       b: 'ghoul_1',       texel: 25, silhouette: 14, texel_pct: 12.3, silhouette_pct: 6.9 },
  { id: 'hound_0/_1',      a: 'hound_0',       b: 'hound_1',       texel: 32, silhouette: 20, texel_pct: 28.8, silhouette_pct: 18.0 },
  { id: 'rust_0/_1',       a: 'rust_0',        b: 'rust_1',        texel: 32, silhouette: 16, texel_pct: 18.0, silhouette_pct: 9.0 },
  { id: 'warden_walk_0/_1', a: 'warden_walk_0', b: 'warden_walk_1', texel: 66, silhouette: 66, texel_pct: 15.0, silhouette_pct: 15.0 },
];
// (d) Teil C 0.3 — PROFIL, fussbuendig (die sechs Zahlen des Auftrags)
const GEGNER_ANKER_PROFIL = [
  { zone: 'ganze_figur',  paar: ['Skelett', 'Ghul'],       soll: 59.7, quelle: 'Teil C 0.3' },
  { zone: 'ganze_figur',  paar: ['Ghul', 'Rostpanzer'],    soll: 78.9, quelle: 'Teil C 0.3 (IST-Worst-Case)' },
  { zone: 'kopf_schulter', paar: ['Skelett', 'Ghul'],      soll: 86.9, quelle: 'Teil C 0.3 (IST-Worst-Case)' },
  { zone: 'kopf_schulter', paar: ['Skelett', 'Rostpanzer'], soll: 80.4, quelle: 'Teil C 0.3' },
  { zone: 'kopf_schulter', paar: ['Ghul', 'Grufthund'],    soll: 80.0, quelle: 'Teil C 0.3' },
  { zone: 'kopf_schulter', paar: ['Ghul', 'Rostpanzer'],   soll: 77.6, quelle: 'Teil C 0.3' },
];
// Zusatzkontrollen (nicht im Auftrags-Ankersatz, aber in den Dokumenten
// genannt und reproduzierbar — sie belegen dieselbe Formel).
const GEGNER_ANKER_PROFIL_ZUSATZ = [
  { zone: 'ganze_figur', paar: ['Skelett', 'Rostpanzer'], soll: 67.7, quelle: 'Teil C 0.3' },
  { zone: 'ganze_figur', paar: ['Grufthund', 'Rostpanzer'], soll: 57.9, quelle: 'Teil C 0.3' },
  { zone: 'ganze_figur', paar: ['Ghul', 'Grufthund'], soll: 45.4, quelle: 'Teil C 0.3' },
  { zone: 'ganze_figur', paar: ['Skelett', 'Grufthund'], soll: 60.1, quelle: 'Review Linse 1 M2 (E5 woertlich)' },
];
// (e) Teil A 7.3 — Halbseiten-L der Kunst (M3-Marge). Lesart: Mittel L601
//     links der Grid-Mittelachse minus rechts, ueber ALLE opaken Texel
//     (Umriss und Rim eingeschlossen) — dieselbe Funktion, die beim Helden
//     die Ankerzahl 21,4 liefert.
const GEGNER_ANKER_HALBSEITE = [
  { grid: 'skeleton_0', texel: 134, dL: 0.37,  quelle: 'Teil A 7.3' },
  { grid: 'skeleton_1', texel: 134, dL: 0.37,  quelle: 'Teil A 7.3' },
  { grid: 'ghoul_0',    texel: 203, dL: 3.71,  quelle: 'Teil A 7.3' },
  { grid: 'hound_0',    texel: 111, dL: -1.75, quelle: 'Teil A 7.3' },
  { grid: 'rust_0',     texel: 178, dL: 5.29,  quelle: 'Teil A 7.3' },
];
const GEGNER_ANKER_HALBSEITE_TOLERANZ = 0.05;
// (f) Landkarte C H7 — Solitaer (Kontroll-Referenz, KEIN Auftrags-Anker;
//     Teil A 1.2 ist an dieser Stelle mit keiner Lesart reproduzierbar).
const GEGNER_REFERENZ_SOLITAER_C = [
  { grid: 'ghoul_0', soll: 7.1 }, { grid: 'skeleton_0', soll: 14.3 }, { grid: 'skeleton_1', soll: 19.0 },
  { grid: 'warden_idle', soll: 16.3 }, { grid: 'hound_0', soll: 22.7 }, { grid: 'hound_1', soll: 26.6 },
  { grid: 'rust_0', soll: 32.7 }, { grid: 'rust_1', soll: 33.7 },
];

// Die Gegner-Requisiten in die Bestandstabelle einhaengen. Das ist additiv:
// die sechs Menschen-Eintraege bleiben unangetastet, und REQUISITEN wird
// ausschliesslich ueber den Figurnamen gelesen (messUmriss) — kein bestehender
// Ausgabewert kann sich dadurch aendern.
Object.assign(REQUISITEN, REQUISITEN_GEGNER);

function setzeGegnerStand(sprites) {
  SPRITES = sprites;
  FIGUREN = { ...figurenVon(sprites), ...gegnerFigurenVon(sprites) };
}

// ---------------------------------------------------------------------------
// G6  MESSFUNKTIONEN (neu; die E5-Funktionen oben werden unveraendert benutzt)
// ---------------------------------------------------------------------------

// (G6-1) SPIEGELGLEICHHEIT IN DER TEIL-A-LESART.
//   Teil A 1.2 nennt seine Spalte "Spiegel %" und "E5-Formel", misst aber eine
//   SILHOUETTEN-Groesse: Anteil der opaken Texel, deren an der BBOX-Mittel-
//   achse gespiegelter Platz EBENFALLS opak ist. Nur so entstehen 95,5 /
//   86,7 / 92,8 / 92,1 / 94,7. Die E5-TON-Lesart des Menschen-Werkzeugs
//   (spiegel(g,'bbox')) liefert 80,0 / 40,0 / 54,6 / 64,6 / 51,8 und die
//   Landkarte-C-Lesart ("Ton-Spiegelgleichheit", Anteil der opaken Texel mit
//   GLEICHEM TON am Spiegelplatz) 83,6 / 45,3 / 58,6 / 69,7 / 54,5.
//   ALLE DREI werden ausgegeben; das Gate <= 65 rechnet auf der Teil-A-Lesart,
//   weil Review M6 den Warden-IST mit 94,7 beziffert.
function spiegelTeilA(g) {
  const { h, w, at } = gridInfo(g);
  let minX = w, maxX = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (at(x, y) !== '.') { if (x < minX) minX = x; if (x > maxX) maxX = x; }
  let opak = 0, silGleich = 0, tonGleich = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const a = at(x, y); if (a === '.') continue;
    opak++;
    const b = at(minX + maxX - x, y);
    if (b !== '.') silGleich++;
    if (b === a) tonGleich++;
  }
  return {
    silhouette_pct: opak ? 100 * silGleich / opak : 0,   // Teil A 1.2
    ton_pct: opak ? 100 * tonGleich / opak : 0,          // Landkarte C 0.1
    opak, bbox: [minX, maxX],
  };
}

// (G6-2) RIM IN DER TEIL-A-LESART: |Rimtexel| / |Kontur| ueber das Grid.
//   Das Menschen-Werkzeug rechnet zusaetzlich "auf der Kontur" und "auf oder
//   1 innerhalb" (E5). Teil A 1.2 zaehlt schlicht alle Rimtexel — nur so
//   entstehen Ghul 12,9 (9 C-Texel / 70 Kontur) und Warden 12,5 (13/104).
function rimTeilA(key, rimToene) {
  const g = SPRITES[key]; if (!g) return null;
  const { set } = konturVon(g);
  const { h, w, at } = gridInfo(g);
  let ges = 0, auf = 0, nah = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const c = at(x, y); if (c === '.' || !rimToene.includes(c)) continue;
    ges++;
    const aufK = set.has(x + ',' + y);
    const ein = set.has((x - 1) + ',' + y) || set.has((x + 1) + ',' + y) || set.has(x + ',' + (y - 1)) || set.has(x + ',' + (y + 1));
    if (aufK) { auf++; nah++; } else if (ein) nah++;
  }
  return {
    kontur_texel: set.size, rim_texel: ges,
    rim_teilA_pct: set.size ? 100 * ges / set.size : 0,
    rim_auf_kontur_pct: set.size ? 100 * auf / set.size : 0,
    rim_e5_pct: set.size ? 100 * nah / set.size : 0,
  };
}

// (G6-3) SCHWARZ / UMRISS / RAHMEN je Grid (Teil A 1.2).
function grundmasseJeGrid(key) {
  const g = SPRITES[key]; if (!g) return null;
  const { h, w } = gridInfo(g);
  const { set, toene } = konturVon(g);
  let opak = 0, kn = 0;
  for (const r of g) for (const c of r) { if (c === '.') continue; opak++; if (c === 'k' || c === 'n') kn++; }
  return {
    breite: w, hoehe: h, rahmen_texel: w * h, opak,
    rahmen_pct: 100 * opak / (w * h),
    kontur_texel: set.size,
    umriss_geom_pct: opak ? 100 * set.size / opak : 0,
    schwarz_kn_pct: opak ? 100 * kn / opak : 0,
    schwarz_kn_texel: kn,
    konturton_histogramm: toene,
  };
}

// (G6-4) KONTURTOENE >= 8 TEXEL, ohne Requisitentoene (E5/§1: ">= 3").
function konturtoeneAb8(key, req) {
  const g = SPRITES[key]; if (!g) return null;
  const { toene } = konturVon(g);
  const streng = (req && req.streng) || [];
  const strittig = (req && req.strittig) || [];
  const liste = (aus) => Object.entries(toene).filter(([c, n]) => n >= 8 && !aus.includes(c)).map(([c]) => c).sort();
  const mit = liste(streng), ohne = liste([...streng, ...strittig]);
  return {
    konturtoene_alle: Object.keys(toene).sort(),
    konturtoene_ab8: mit, konturtoene_ab8_anzahl: mit.length,
    konturtoene_ab8_ohne_strittige: ohne, konturtoene_ab8_ohne_strittige_anzahl: ohne.length,
    histogramm: toene,
  };
}

// (G6-4b) SEHNEN-REGEL E-B8 — BELEG, DASS 1-px-DIAGONALEN ZAEHLEN.
//   "Sekundaerstrukturen (Sehnen, Rippen, Nieten) >= 2 Texel in EINER
//    Richtung; 1-px-Diagonalen zaehlen als Solitaer."
//   Das Solitaer-Mass rechnet mit der 4-NACHBARSCHAFT: ein Texel, dessen
//   einzige gleichfarbige Nachbarn diagonal liegen, hat KEINEN 4er-Nachbarn
//   und zaehlt damit bereits als Solitaer. Die Regel ist also nicht neu zu
//   bauen, sondern NACHZUWEISEN. Diese Funktion trennt die Solitaertexel in
//   (a) diagonale Ketten (mindestens ein gleichfarbiger DIAGONAL-Nachbar)
//   und (b) echte Einzeltexel (auch in der 8-Nachbarschaft allein).
function diagonalBefund(keys) {
  const proGrid = {};
  let sol = 0, diag = 0, einzel = 0, koerper = 0;
  for (const key of keys) {
    const g = SPRITES[key]; if (!g) continue;
    const { h, w, at } = gridInfo(g);
    let s = 0, d = 0, e = 0, kk = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const c = at(x, y);
      if (c === '.' || c === 'k' || c === 'n') continue;
      kk++;
      const vier = at(x - 1, y) === c || at(x + 1, y) === c || at(x, y - 1) === c || at(x, y + 1) === c;
      if (vier) continue;
      s++;
      const schraeg = at(x - 1, y - 1) === c || at(x + 1, y - 1) === c || at(x - 1, y + 1) === c || at(x + 1, y + 1) === c;
      if (schraeg) d++; else e++;
    }
    sol += s; diag += d; einzel += e; koerper += kk;
    proGrid[key] = { koerper_texel: kk, solitaer: s, davon_diagonalkette: d, davon_einzeltexel: e };
  }
  return {
    regel: 'E-B8: eine 1-px-Diagonale hat keinen gleichfarbigen 4er-Nachbarn und zaehlt damit im Solitaer-Mass. Hier aufgeteilt in diagonale Ketten und echte Einzeltexel.',
    koerper_texel: koerper, solitaer: sol,
    davon_diagonalkette: diag, davon_einzeltexel: einzel,
    diagonalkette_pct: koerper ? 100 * diag / koerper : 0,
    einzeltexel_pct: koerper ? 100 * einzel / koerper : 0,
    pro_grid: proGrid,
  };
}
// SELBSTTEST der Sehnen-Regel (deterministisch, ohne Nebenwirkung): eine
// 1-px-Diagonale MUSS vollstaendig als Solitaer zaehlen, eine 2-Texel-
// Waagerechte NICHT.
function sehnenSelbsttest() {
  const merkS = SPRITES;
  const faelle = [
    { name: '1-px-Diagonale (4 Texel) — ALLE solitaer, alle als Diagonalkette',
      grid: ['A...', '.A..', '..A.', '...A'], erwartet: { solitaer: 4, diag: 4, einzel: 0 } },
    { name: '2-Texel-Waagerechte — KEIN Solitaer',
      grid: ['AA..', '....'], erwartet: { solitaer: 0, diag: 0, einzel: 0 } },
    { name: '2-Texel-Senkrechte — KEIN Solitaer',
      grid: ['A...', 'A...'], erwartet: { solitaer: 0, diag: 0, einzel: 0 } },
    { name: 'freistehendes Einzeltexel — Solitaer OHNE Diagonalnachbar',
      grid: ['....', '.A..', '....'], erwartet: { solitaer: 1, diag: 0, einzel: 1 } },
    { name: 'Umriss k/n zaehlt nicht mit',
      grid: ['kAk.', 'AkA.'], erwartet: { solitaer: 3, diag: 3, einzel: 0 } },
  ];
  const erg = faelle.map((f) => {
    SPRITES = { t_sehne: f.grid };
    const r = diagonalBefund(['t_sehne']);
    const ist = { solitaer: r.solitaer, diag: r.davon_diagonalkette, einzel: r.davon_einzeltexel };
    return { fall: f.name, erwartet: f.erwartet, ist, ok: Object.keys(f.erwartet).every((k) => f.erwartet[k] === ist[k]) };
  });
  SPRITES = merkS;
  return erg;
}
const SEHNEN_SELBSTTEST = sehnenSelbsttest();

// (G6-5) INNENRAUM-RAMPENMITTEL OHNE k/n  —  E-B1 / Review M2.
//   "Koerper-L ist eine INNENRAUM-Groesse. P0.a gibt je Figur zusaetzlich
//    'Rampen-Mittel der Innenflaeche ohne k/n' aus; der Zeichner zielt auf
//    diese Zahl, nicht auf die Gate-Zahl."
//   Innenraum = opake Texel, die WEDER Kontur NOCH Rim sind (identische
//   Texelmenge wie koerperMittel) — hier zusaetzlich ohne k/n.
function innenraumMittel(keys, rimToene) {
  let n = 0, Ls = 0, nKN = 0, LsKN = 0;
  const hist = {};
  for (const key of keys) {
    const g = SPRITES[key]; if (!g) continue;
    const { set } = konturVon(g);
    const { h, w, at } = gridInfo(g);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const c = at(x, y);
      if (c === '.') continue;
      if (set.has(x + ',' + y)) continue;
      if (rimToene.includes(c)) continue;
      const L = L601hex(PALETTE[c]);
      if (c === 'k' || c === 'n') { nKN++; LsKN += L; continue; }
      n++; Ls += L; hist[c] = (hist[c] || 0) + 1;
    }
  }
  return {
    innen_texel_gesamt: n + nKN,
    innen_kn_texel: nKN,
    innen_kn_L_summe: LsKN,
    innen_ohne_kn_texel: n,
    innen_ohne_kn_L: n ? Ls / n : null,
    ton_histogramm: hist,
  };
}
// Umkehrrechnung: welches Innenraum-Rampenmittel braucht es, damit das
// GATE (Koerper-L E5) den Zielwert trifft?  Koerper-L = (S_kn + M*n_rest) /
// (n_kn + n_rest)  ->  M = (L_ziel*(n_kn+n_rest) - S_kn) / n_rest.
function innenraumZielzahl(inn, L_ziel) {
  if (!inn || !inn.innen_ohne_kn_texel) return null;
  return (L_ziel * inn.innen_texel_gesamt - inn.innen_kn_L_summe) / inn.innen_ohne_kn_texel;
}

// (G6-6) HALBSEITEN-dL JE GRID  —  E-B5: gilt fuer JEDES Gegner-Grid, weil
//   jedes gespiegelt gezeichnet wird (enemies.js:634-641, boss.js:331).
//   Lesart = seitenDL() des Menschen-Werkzeugs (Umriss und Rim zaehlen mit);
//   genau die reproduziert Teil A 7.3.
const HALBSEITE_MAX_dL = 6.5;          // E-B5 / ANKER-Regel 1
const HALBSEITE_MAX_dL_SKELETT = 8.2;  // M3-harte Grenze (Teil A 7.3)
function halbseitenJeGrid(figur, keys, ausnahme) {
  // Das Gate ist fuer JEDE Figur 6,5 L (E-B5). Fuer das Skelett laeuft
  // zusaetzlich die M3-harte Grenze 8,2 L mit (Teil A 7.3) — sie ist WEITER
  // als das Gate, also nie die bindende Schranke, aber sie gehoert in die
  // Ausgabe, weil shot_gfx6 M3 an skeleton_0 misst.
  const grenze = HALBSEITE_MAX_dL;
  const m3 = figur === 'Skelett' ? HALBSEITE_MAX_dL_SKELETT : null;
  const frames = [];
  for (const key of keys) {
    const g = SPRITES[key]; if (!g) continue;
    const a = seitenDL(g, false), b = seitenDL(g, true);
    // NACHZUG 12.09.: ausgenommene Grids (*_decal, shield_*) werden GEMESSEN und
    // ausgegeben, aber NICHT gewertet (ok = null). Die Grenze bleibt 6,5 L.
    const aus = typeof ausnahme === 'function' ? ausnahme(key) : null;
    frames.push({
      grid: key, ausnahme: aus,
      dL: a ? a.dL : null, dL_betrag: a ? Math.abs(a.dL) : null,
      links_L: a ? a.links_L : null, rechts_L: a ? a.rechts_L : null,
      links_texel: a ? a.links_texel : null, rechts_texel: a ? a.rechts_texel : null,
      opak_texel: opakVon(g),
      hellere_seite: a ? (a.dL > 0 ? 'links' : a.dL < 0 ? 'rechts' : 'gleich') : null,
      zweitlesart_ohne_kn_dL: b ? b.dL : null,
      ok: aus ? null : (a ? Math.abs(a.dL) <= grenze : null),
      ok_m3: m3 !== null && a ? Math.abs(a.dL) <= m3 : null,
    });
  }
  const betraege = frames.filter((f) => f.dL_betrag !== null).map((f) => f.dL_betrag);
  const gewertet = frames.filter((f) => f.ok !== null);
  const betraegeG = gewertet.filter((f) => f.dL_betrag !== null).map((f) => f.dL_betrag);
  return {
    lesart: 'Mittel L601 links der Grid-Mittelachse minus Mittel rechts, ueber ALLE opaken Texel (Umriss und Rim eingeschlossen); Achsentexel zaehlen nicht. Reproduziert Teil A 7.3.',
    grenze_dL: grenze, grenze_m3_skelett: m3,
    frames,
    ausnahmen: frames.filter((f) => f.ausnahme).map((f) => f.grid + ' (' + f.ausnahme + ')'),
    max_betrag: betraegeG.length ? Math.max(...betraegeG) : null,
    max_betrag_alle_grids: betraege.length ? Math.max(...betraege) : null,
    min_betrag: betraegeG.length ? Math.min(...betraegeG) : null,
    grids_rot: frames.filter((f) => f.ok === false).map((f) => f.grid),
    gewertete_grids: gewertet.map((f) => f.grid),
    ok: gewertet.length ? gewertet.every((f) => f.ok) : null,
  };
}

// (G6-7) FRAME-DIFF FUER JEDES POSENPAAR  —  E-B7 + Review m3.
//   Zusaetzlich zur Texel- und Silhouettendifferenz die Zahl der GETRENNTEN
//   ZEILENBAENDER, in denen sich die Silhouette aendert (E-B7: ">= 2 getrennte
//   Zeilenbaender", heute Fuss-only). Band = maximaler Lauf benachbarter
//   Zeilen mit mindestens einer Silhouettenaenderung.
function zeilenbaender(ka, kb) {
  const A = SPRITES[ka], B = SPRITES[kb];
  if (!A || !B) return null;
  const h = Math.max(A.length, B.length);
  const zeilenSil = [], zeilenTex = [];
  for (let y = 0; y < h; y++) {
    const ra = A[y] || '', rb = B[y] || '';
    const w = Math.max(ra.length, rb.length);
    let s = 0, t = 0;
    for (let x = 0; x < w; x++) {
      const ca = ra[x] || '.', cb = rb[x] || '.';
      if (ca !== cb) t++;
      if ((ca === '.') !== (cb === '.')) s++;
    }
    if (s > 0) zeilenSil.push(y);
    if (t > 0) zeilenTex.push(y);
  }
  const baenderVon = (zeilen) => {
    const b = [];
    for (const y of zeilen) {
      const letztes = b[b.length - 1];
      if (letztes && y === letztes[1] + 1) letztes[1] = y; else b.push([y, y]);
    }
    return b;
  };
  const bs = baenderVon(zeilenSil), bt = baenderVon(zeilenTex);
  return {
    silhouette_zeilen: zeilenSil, silhouette_baender: bs, silhouette_baender_anzahl: bs.length,
    texel_zeilen: zeilenTex, texel_baender: bt, texel_baender_anzahl: bt.length,
  };
}
function posenpaare(keys) {
  const out = [];
  for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++) out.push([keys[i], keys[j]]);
  return out;
}

// (G6-8) PROFIL — fussbuendig, Rohzeilen (E5-Formel breitenprofil/
//   profilAehnlichkeit, unveraendert benutzt: profilAehnlichkeit richtet die
//   Vektoren an ihrem ENDE aus, ist also per Konstruktion fussbuendig).
//   Kopf-Schulter = die obersten N BELEGTEN Zeilen (E-B3: 6, Grufthund 3).
function kopfSchulterProfil(key, zeilen) {
  const p = breitenprofil(key);
  const start = p.findIndex((v) => v > 0);
  if (start < 0) return [];
  return p.slice(start, start + zeilen);
}
function profilMatrix(namen, profile) {
  const zeilen = [];
  for (let i = 0; i < namen.length; i++) for (let j = i + 1; j < namen.length; j++) {
    zeilen.push({ paar: [namen[i], namen[j]], aehnlichkeit: profilAehnlichkeit(profile[namen[i]], profile[namen[j]]) });
  }
  return zeilen;
}

// ---------------------------------------------------------------------------
// G7  WIRKORTE + LEITKLASSEN DER VIER KAMPFKARTEN  (E-B1 / E-B2)
// ---------------------------------------------------------------------------
// LESART (so und nur so reproduzieren sich die BINDENDEN Fenster aus E-B1):
//   * gezaehlt werden die BEGEHBAREN Zellen (legend[ch] vorhanden, !solid)
//     je Karte;
//   * der Bodenton einer Zelle ist der LEGENDEN-Kunstschluessel (def.art bzw.
//     def.anim[0]) — NICHT die pro Zelle ausgewuerfelte variants-Kachel.
//     Beleg: nur so ergeben sich GRAVEYARD-Gras 85,4 % / L 47,0..56,3,
//     CATACOMBS stone_floor 98,6 % / L 52,5..53,0, FLUESTERGRUFT 85,5 % und
//     BOSS_KAMMER 96,4 % aus dem Spec-Review (B3-Tabelle) und damit die
//     Fenster 81,3..137,0 / 78,0..142,5 / 77,5..142,5.
//     Die Variantenlesart steht als ZWEITLESART ohne Gate-Wirkung daneben
//     (sie liefert fuer CATACOMBS L 48,0..52,5 und damit 77,5..138,0).
//   * FENSTER = [max(L der Leitklasse) + 25, min(L) + 90]  (dL 25..90, E1).
const KAMPFKARTEN = ['GRAVEYARD', 'CATACOMBS', 'FLUESTERGRUFT', 'BOSS_KAMMER'];
const LEITKLASSE_MIN_ANTEIL = 80;      // E-B1 "> = 80 % der BEGEHBAREN Zellen"
const dL_MIN = 25, dL_MAX = 90;        // E1

function gegnerBodenklasse(artKey) {
  if (/^path/.test(artKey)) return 'Weg';
  if (/^water/.test(artKey)) return 'Wasser';
  if (/^(grass|dirt_patch)/.test(artKey)) return 'GY-Gras';
  if (/^stone_floor/.test(artKey)) return 'Gruft-Stein';
  if (/^(bones|skull)/.test(artKey)) return 'Knochenboden';
  if (/^(crypt_stairs_down|stairs_up|dorf_stufe|dorf_schwelle)/.test(artKey)) return 'Treppe';
  if (/^floor_decal/.test(artKey)) return 'Boden-Dekal';
  if (/^pebble/.test(artKey)) return 'Kies';
  if (/^dorf_lehm/.test(artKey)) return 'DORF-Lehm';
  return 'UNKLASSIFIZIERT';
}

function kampfkartenZensus() {
  const out = {};
  for (const name of KAMPFKARTEN) {
    const m = MAPS[name];
    const rows = m.rows || m.ROWS, legend = m.legend || m.LEGEND;
    const proArt = {}, proArtVariante = {};
    let begehbar = 0;
    for (let ty = 0; ty < rows.length; ty++) for (let tx = 0; tx < rows[ty].length; tx++) {
      const ch = rows[ty][tx]; const def = legend[ch];
      if (!def || def.solid) continue;
      begehbar++;
      const legendenArt = def.anim ? def.anim[0] : def.art;
      proArt[legendenArt] = (proArt[legendenArt] || 0) + 1;
      const variante = def.anim ? def.anim[0]
        : (def.variants ? def.variants[variantIndex(tx, ty, def.variants.length)] : def.art);
      proArtVariante[variante] = (proArtVariante[variante] || 0) + 1;
    }
    // Klassen aufbauen (Legendenlesart = Gate-Lesart)
    const klassen = {};
    for (const art of Object.keys(proArt).sort()) {
      const kl = gegnerBodenklasse(art);
      const km = kachelMittel(art);
      klassen[kl] = klassen[kl] || { klasse: kl, zellen: 0, kacheln: [] };
      klassen[kl].zellen += proArt[art];
      klassen[kl].kacheln.push({ art, zellen: proArt[art], L: km ? km.L : null, lab: km ? km.lab : null, rgb: km ? km.rgb : null });
    }
    const klassenVariante = {};
    for (const art of Object.keys(proArtVariante).sort()) {
      const kl = gegnerBodenklasse(art);
      const km = kachelMittel(art);
      klassenVariante[kl] = klassenVariante[kl] || { klasse: kl, zellen: 0, L: [] };
      klassenVariante[kl].zellen += proArtVariante[art];
      if (km) klassenVariante[kl].L.push(km.L);
    }
    for (const kl of Object.keys(klassen)) {
      const k = klassen[kl];
      k.anteil_pct = 100 * k.zellen / begehbar;
      const Ls = k.kacheln.filter((c) => c.L !== null).map((c) => c.L);
      k.L_min = Ls.length ? Math.min(...Ls) : null;
      k.L_max = Ls.length ? Math.max(...Ls) : null;
      k.fenster = (k.L_min !== null) ? [k.L_max + dL_MIN, k.L_min + dL_MAX] : null;
      k.kacheln.sort((a, b) => b.zellen - a.zellen || a.art.localeCompare(b.art));
    }
    for (const kl of Object.keys(klassenVariante)) {
      const k = klassenVariante[kl];
      k.anteil_pct = 100 * k.zellen / begehbar;
      k.L_min = k.L.length ? Math.min(...k.L) : null;
      k.L_max = k.L.length ? Math.max(...k.L) : null;
      k.fenster = (k.L_min !== null) ? [k.L_max + dL_MIN, k.L_min + dL_MAX] : null;
      delete k.L;
    }
    const sortiert = Object.keys(klassen).sort((a, b) => klassen[b].anteil_pct - klassen[a].anteil_pct || a.localeCompare(b));
    const leit = sortiert.find((kl) => klassen[kl].anteil_pct >= LEITKLASSE_MIN_ANTEIL) || null;
    out[name] = {
      begehbare_zellen: begehbar,
      leitklasse: leit,
      leitklasse_anteil_pct: leit ? klassen[leit].anteil_pct : null,
      // Der Spec-Review nennt fuer CATACOMBS 98,6 % und fuer GRAVEYARD
      // "grass_g5_00 allein nur 49,2 %" — das ist der groesste EINZEL-
      // Kunstschluessel der Klasse, nicht die Klassensumme. Beide Zahlen
      // stehen hier, damit die Herkunft der Fenster nachvollziehbar bleibt.
      leitklasse_groesster_einzelschluessel: leit ? klassen[leit].kacheln[0].art : null,
      leitklasse_groesster_einzelschluessel_pct: leit ? 100 * klassen[leit].kacheln[0].zellen / begehbar : null,
      leitklasse_L: leit ? [klassen[leit].L_min, klassen[leit].L_max] : null,
      leitklasse_fenster: leit ? klassen[leit].fenster : null,
      leitklasse_fenster_variantenlesart: leit && klassenVariante[leit] ? klassenVariante[leit].fenster : null,
      leitklasse_L_variantenlesart: leit && klassenVariante[leit] ? [klassenVariante[leit].L_min, klassenVariante[leit].L_max] : null,
      minderheitsklassen: sortiert.filter((kl) => kl !== leit).map((kl) => ({
        klasse: kl, zellen: klassen[kl].zellen, anteil_pct: klassen[kl].anteil_pct,
        L_min: klassen[kl].L_min, L_max: klassen[kl].L_max, kacheln: klassen[kl].kacheln,
      })),
      klassen,
      klassen_variantenlesart: klassenVariante,
    };
  }
  return out;
}

// WIRKORTE aus skeletonSpawns / ghoulSpawns / enemySpawns aller vier
// Kampfkarten. Deklariert (Teil A 1.4 + §8): die BOSS_KAMMER fuehrt KEINEN
// Skelett-Spawn im Datenfeld, der Grabwaechter beschwoert sie zur Laufzeit
// (boss.js:37 ADD_ANCHORS, :133 createSkeleton) — der Wirkort-Satz des
// Skeletts umfasst deshalb ALLE VIER Kampfkarten.
const BOSS_ADD_ANKER_KACHELN = [[4, 3], [15, 3], [4, 8], [15, 8]];
const KIND_ZU_FIGUR = { skeleton: 'Skelett', ghoul: 'Ghul', hound: 'Grufthund', rust: 'Rostpanzer', graveward: 'Warden' };
function gegnerWirkorte() {
  const je = {};
  for (const f of GEGNER_NAMEN) je[f] = { karten: {}, gesamt: 0, elite: 0, quelle: [] };
  for (const name of KAMPFKARTEN) {
    const m = MAPS[name];
    const zaehle = (fig, n, woher, elite) => {
      if (!je[fig]) return;
      je[fig].karten[name] = je[fig].karten[name] || { spawns: 0, elite: 0, quellen: [] };
      je[fig].karten[name].spawns += n;
      je[fig].karten[name].elite += elite || 0;
      if (!je[fig].karten[name].quellen.includes(woher)) je[fig].karten[name].quellen.push(woher);
      je[fig].gesamt += n; je[fig].elite += elite || 0;
    };
    if (Array.isArray(m.skeletonSpawns) && m.skeletonSpawns.length) zaehle('Skelett', m.skeletonSpawns.length, 'skeletonSpawns', 0);
    if (Array.isArray(m.ghoulSpawns) && m.ghoulSpawns.length) zaehle('Ghul', m.ghoulSpawns.length, 'ghoulSpawns', 0);
    for (const sp of (m.enemySpawns || [])) {
      const fig = KIND_ZU_FIGUR[sp.kind];
      if (!fig) continue;
      zaehle(fig, 1, 'enemySpawns(' + sp.kind + ')', sp.elite ? 1 : 0);
    }
  }
  // Boss-Adds
  je.Skelett.karten.BOSS_KAMMER = je.Skelett.karten.BOSS_KAMMER || { spawns: 0, elite: 0, quellen: [] };
  je.Skelett.karten.BOSS_KAMMER.adds_anker = BOSS_ADD_ANKER_KACHELN.length;
  je.Skelett.karten.BOSS_KAMMER.quellen.push('boss.js ADD_ANCHORS (Laufzeit-Beschwoerung, createSkeleton)');
  // Schild = Overlay des Rostpanzers (enemies.js:642-656) -> dieselben Karten
  je.Schild.karten = JSON.parse(JSON.stringify(je.Rostpanzer.karten));
  je.Schild.gesamt = je.Rostpanzer.gesamt;
  for (const k of Object.keys(je.Schild.karten)) je.Schild.karten[k].quellen = ['Overlay des Rostpanzers (enemies.js:642-656)'];
  for (const f of GEGNER_NAMEN) je[f].karten_liste = Object.keys(je[f].karten).sort();
  return je;
}

// ---------------------------------------------------------------------------
// G8  ZIEL-KOPF-SCHULTER-PROFILE  (ZUSATZ-DELIVERABLE, Review M8 + E-B3)
// ---------------------------------------------------------------------------
// "P0.a rechnet die Zielprofile VOR und friert sie als Steckbriefzeile ein —
//  sonst iteriert der Zeichner blind gegen ein Gate, dessen Loesungsraum eine
//  Handvoll Vektoren gross ist."  (Review Linse 1 M8)
//
// GATE (E-B3): Kopf-Schulter <= 65 fuer JEDES Paar, <= 55 INNERHALB einer
//   Familie, Warden-Paare ausgenommen (Eichkoerper, Profil eingefroren).
//   Nach E-B4 ist JEDER der vier uebrigen Gegner seine eigene Familie und
//   das Fussvolk ist gestrichen (E-C1) -> die 55er-Regel hat in CH-2 KEIN
//   Paar; sie wird trotzdem mitgeprueft, damit sie nicht still verschwindet.
// ZIELWERT der Suche: 60 (5 L Marge unter dem Gate, weil ein Zeichner ein
//   Zeilenprofil nicht texelgenau trifft: EIN Texel Abweichung je Zeile
//   verschiebt die Aehnlichkeit je nach Masse um 2..5 Punkte).
// PLAUSIBILITAETSMODELL (aus den Steckbriefen Teil C §2 / Spec §3, dieselben
//   Auflagen, mit denen Review Linse 2 B1 gerechnet hat):
//   * nicht fallend von oben nach unten (Scheitel -> Schulter),
//   * Scheitel 2..8 Texel, Stufensprung <= 5 Texel je Zeile,
//   * Breite <= Gridbreite (Skelett/Ghul/Hund 16, Rostpanzer 20),
//   * Skelett: Schulterzeile >= 10 UND "Schaedel schmaler als die Schultern"
//     (max der drei obersten Zeilen < Schulterzeile),
//   * Ghul: Schulterzeile >= 13 ("breiteste, gebeugteste Form, hochgezogene
//     Schultern"),
//   * Rostpanzer: Schulterzeile >= 16 ("Schulterplatten-Ausladung" — die
//     EINZIGE Begruendung fuer den 20-px-Rahmen, Review Linse 2 M7),
//   * Grufthund: 3 Zeilen (E-B3), Scheitel 2..6.
// ZIELFUNKTION (lexikographisch, deterministisch):
//   1. Verletzung des Zielwerts 60 ueber die Nicht-Warden-Paare,
//   2. Verletzung von 65 gegen den (festen) Warden — freiwillig, nicht Gate,
//   3. SUMME der Texelaenderungen gegen das IST-Profil (der Zeichner soll so
//      wenig wie noetig umbauen; das IST ist der Ausgangspunkt, nicht der
//      Feind),
//   4. kleineres Maximum, 5. lexikographischer Schluessel.
// SUCHVERFAHREN: vollstaendige Aufzaehlung des Plausibilitaetsraums je Figur
//   (Pools, nach IST-Abstand sortiert) + lokale Suche (alle Ein-Texel-
//   Nachbarn, steilster Abstieg) von 1 + ZIEL_RESTARTS Startpunkten
//   (Startpunkt 0 = die IST-Projektion, danach LCG-Ziehungen aus den Pools,
//   fester Seed). Das ist ein MACHBARKEITSBELEG mit Gueteangabe, kein Beweis
//   der Optimalitaet — dieselbe Lesart wie zielBreitenbaender() in CH-1.
const ZIEL_KS_ZIELWERT = 60;
const ZIEL_KS_GATE = 65;
const ZIEL_KS_FAMILIENGATE = 55;
const ZIEL_RESTARTS = 1500;
const ZIEL_SEED = 20260912;
const ZIEL_SPRUNG_MAX = 5;
const ZIEL_SCHEITEL_MIN = 2;
const ZIEL_REGELN = {
  Skelett:    { zeilen: 6, breite: 16, schulter_min: 10, scheitel_max: 8, extra: (p) => Math.max(p[0], p[1], p[2]) < p[5], extra_text: 'Schaedel schmaler als die Schultern (max Zeile 1-3 < Schulterzeile)' },
  Ghul:       { zeilen: 6, breite: 16, schulter_min: 13, scheitel_max: 8, extra: null, extra_text: 'breiteste Form, hochgezogene Schultern' },
  Rostpanzer: { zeilen: 6, breite: 20, schulter_min: 16, scheitel_max: 8, extra: null, extra_text: 'Schulterplatten-Ausladung im 20-px-Rahmen' },
  Grufthund:  { zeilen: 3, breite: 16, schulter_min: 1,  scheitel_max: 6, extra: null, extra_text: 'Vierbeiner, 3 belegte Zeilen (E-B3)' },
};
const ZIEL_FIGUREN = ['Skelett', 'Ghul', 'Rostpanzer', 'Grufthund'];

function zielPool(name) {
  const r = ZIEL_REGELN[name];
  const out = [];
  const rec = (pre) => {
    if (pre.length === r.zeilen) {
      if (pre[r.zeilen - 1] >= r.schulter_min && (!r.extra || r.extra(pre))) out.push(pre.slice());
      return;
    }
    const lo = pre.length ? pre[pre.length - 1] : ZIEL_SCHEITEL_MIN;
    const hi = pre.length ? Math.min(r.breite, pre[pre.length - 1] + ZIEL_SPRUNG_MAX) : r.scheitel_max;
    for (let v = lo; v <= hi; v++) { pre.push(v); rec(pre); pre.pop(); }
  };
  rec([]);
  return out;
}
function zielGueltig(name, p) {
  const r = ZIEL_REGELN[name];
  if (p.length !== r.zeilen) return false;
  if (p[0] < ZIEL_SCHEITEL_MIN || p[0] > r.scheitel_max) return false;
  if (p[r.zeilen - 1] < r.schulter_min) return false;
  for (let i = 0; i < r.zeilen; i++) {
    if (p[i] < 1 || p[i] > r.breite) return false;
    if (i && (p[i] < p[i - 1] || p[i] - p[i - 1] > ZIEL_SPRUNG_MAX)) return false;
  }
  return !r.extra || r.extra(p);
}
const l1Abstand = (a, b) => a.reduce((s, v, i) => s + Math.abs(v - (b[i] ?? 0)), 0);

// EIN schwarzes Innentexel in einen Rampenton umgefaerbt: n_innen bleibt,
// n_kn faellt um 1, n_rest steigt um 1, die L-Summe der Innen-Schwarzflaeche
// faellt um deren Mittel.
function umgefaerbtesInnen(inn) {
  if (!inn || !inn.innen_kn_texel) return inn;
  const mittel = inn.innen_kn_L_summe / inn.innen_kn_texel;
  return {
    innen_texel_gesamt: inn.innen_texel_gesamt,
    innen_kn_texel: inn.innen_kn_texel - 1,
    innen_kn_L_summe: inn.innen_kn_L_summe - mittel,
    innen_ohne_kn_texel: inn.innen_ohne_kn_texel + 1,
    innen_ohne_kn_L: inn.innen_ohne_kn_L,
  };
}

function zielKopfSchulter(istKS, wardenKS) {
  const POOL = {};
  for (const n of ZIEL_FIGUREN) {
    POOL[n] = zielPool(n)
      .map((p) => ({ p, d: l1Abstand(p, istKS[n]) }))
      .sort((a, b) => a.d - b.d || a.p.join(',').localeCompare(b.p.join(',')));
  }
  const bewerte = (M) => {
    const paare = [];
    let mx = 0;
    for (let i = 0; i < ZIEL_FIGUREN.length; i++) for (let j = i + 1; j < ZIEL_FIGUREN.length; j++) {
      const a = ZIEL_FIGUREN[i], b = ZIEL_FIGUREN[j];
      const v = profilAehnlichkeit(M[a], M[b]);
      paare.push({ paar: [a, b], aehnlichkeit: v, familie_gleich: GEGNER_FAMILIE[a] === GEGNER_FAMILIE[b] });
      if (v > mx) mx = v;
    }
    const wPaare = ZIEL_FIGUREN.map((n) => ({ paar: [n, 'Warden'], aehnlichkeit: profilAehnlichkeit(M[n], wardenKS) }));
    const wmax = Math.max(...wPaare.map((w) => w.aehnlichkeit));
    const d = ZIEL_FIGUREN.reduce((s, n) => s + l1Abstand(M[n], istKS[n]), 0);
    return { mx, wmax, d, paare, warden_paare: wPaare };
  };
  const schluessel = (M) => ZIEL_FIGUREN.map((n) => M[n].join('.')).join('|');
  const besser = (a, b) => {
    const va = Math.max(0, a.sc.mx - ZIEL_KS_ZIELWERT), vb = Math.max(0, b.sc.mx - ZIEL_KS_ZIELWERT);
    if (Math.abs(va - vb) > 1e-9) return va < vb;
    const wa = Math.max(0, a.sc.wmax - ZIEL_KS_GATE), wb = Math.max(0, b.sc.wmax - ZIEL_KS_GATE);
    if (Math.abs(wa - wb) > 1e-9) return wa < wb;
    if (a.sc.d !== b.sc.d) return a.sc.d < b.sc.d;
    if (Math.abs(a.sc.mx - b.sc.mx) > 1e-9) return a.sc.mx < b.sc.mx;
    return a.k < b.k;
  };
  const lokal = (start) => {
    let M = {}; for (const n of ZIEL_FIGUREN) M[n] = start[n].slice();
    let cur = { M, sc: bewerte(M), k: schluessel(M) };
    for (let it = 0; it < 3000; it++) {
      let beste = null;
      for (const n of ZIEL_FIGUREN) for (let i = 0; i < M[n].length; i++) for (const dv of [-1, 1]) {
        const c = {}; for (const m of ZIEL_FIGUREN) c[m] = M[m].slice();
        c[n][i] += dv;
        if (!zielGueltig(n, c[n])) continue;
        const kand = { M: c, sc: bewerte(c), k: schluessel(c) };
        if (besser(kand, cur) && (!beste || besser(kand, beste))) beste = kand;
      }
      if (!beste) break;
      cur = beste; M = beste.M;
    }
    return cur;
  };
  const start0 = {}; for (const n of ZIEL_FIGUREN) start0[n] = POOL[n][0].p;
  let global = lokal(start0); global.quelle = 'Start 0 = IST-Projektion (naechstes gueltiges Profil)';
  const rnd = lcg(ZIEL_SEED);
  for (let k = 0; k < ZIEL_RESTARTS; k++) {
    const st = {};
    for (const n of ZIEL_FIGUREN) st[n] = POOL[n][Math.floor(rnd() * POOL[n].length)].p;
    const r = lokal(st);
    if (besser(r, global)) { r.quelle = 'Zufallsstart #' + k + ' (LCG-Seed ' + ZIEL_SEED + ')'; global = r; }
  }
  const profile = { ...global.M, Warden: wardenKS.slice() };
  const alle = [...ZIEL_FIGUREN, 'Warden'];
  const matrix = [];
  for (let i = 0; i < alle.length; i++) for (let j = i + 1; j < alle.length; j++) {
    const a = alle[i], b = alle[j];
    const v = profilAehnlichkeit(profile[a], profile[b]);
    const wardenPaar = a === 'Warden' || b === 'Warden';
    const familie = GEGNER_FAMILIE[a] === GEGNER_FAMILIE[b];
    matrix.push({
      paar: [a, b], aehnlichkeit: v,
      warden_ausgenommen: wardenPaar,
      familie_gleich: familie,
      grenze: wardenPaar ? null : (familie ? ZIEL_KS_FAMILIENGATE : ZIEL_KS_GATE),
      ok: wardenPaar ? null : v <= (familie ? ZIEL_KS_FAMILIENGATE : ZIEL_KS_GATE),
    });
  }
  matrix.sort((x, y) => y.aehnlichkeit - x.aehnlichkeit || x.paar.join('/').localeCompare(y.paar.join('/')));
  return {
    verfahren: 'vollstaendige Pool-Aufzaehlung + lokale Suche (steilster Abstieg ueber alle Ein-Texel-Nachbarn) von 1 + ' + ZIEL_RESTARTS + ' Startpunkten, LCG-Seed ' + ZIEL_SEED,
    lesart: 'Kopf-Schulter = oberste ' + KS_ZEILEN.Skelett + ' BELEGTE Zeilen (Grufthund ' + KS_ZEILEN.Grufthund + '), Aehnlichkeit = E5-Profilformel fussbuendig',
    zielwert: ZIEL_KS_ZIELWERT, gate: ZIEL_KS_GATE, familiengate: ZIEL_KS_FAMILIENGATE,
    warden_fest: wardenKS.slice(),
    poolgroessen: Object.fromEntries(ZIEL_FIGUREN.map((n) => [n, POOL[n].length])),
    regeln: Object.fromEntries(ZIEL_FIGUREN.map((n) => [n, {
      zeilen: ZIEL_REGELN[n].zeilen, gridbreite: ZIEL_REGELN[n].breite,
      schulterzeile_min: ZIEL_REGELN[n].schulter_min, scheitel: [ZIEL_SCHEITEL_MIN, ZIEL_REGELN[n].scheitel_max],
      stufensprung_max: ZIEL_SPRUNG_MAX, auflage: ZIEL_REGELN[n].extra_text,
    }])),
    gefunden_von: global.quelle,
    max_paar: global.sc.mx,
    max_paar_gegen_warden: global.sc.wmax,
    texelaenderung_gesamt: global.sc.d,
    ziel_erreicht: global.sc.mx <= ZIEL_KS_ZIELWERT,
    gate_erreicht: global.sc.mx <= ZIEL_KS_GATE,
    profile,
    ist_profile: istKS,
    je_figur: Object.fromEntries(alle.map((n) => [n, {
      ist: istKS[n] || (n === 'Warden' ? wardenKS.slice() : null),
      ziel: profile[n],
      texelaenderung: istKS[n] ? l1Abstand(profile[n], istKS[n]) : 0,
      fest: n === 'Warden',
    }])),
    matrix,
    matrix_rot: matrix.filter((m) => m.ok === false).map((m) => m.paar.join('/')),
  };
}

// ---------------------------------------------------------------------------
// G9  SPERRLISTEN  (§1 E6-Aequivalent + E-C3 + E-C4)
// ---------------------------------------------------------------------------
const SPERRLISTE_GEGNER = {
  Skelett: [
    { id: 'menschenrampe', toene: '!%G&()' + ':;?@[]', max_pct: 0, text: 'keine CH-1-Menschenrampe (E-C4)' },
    { id: 'gesperrte_toene', toene: 'xf', max_pct: 0, text: 'x (Trank/Herz) und f (fog_blob) gesperrt (E-C3)' },
  ],
  Ghul: [
    { id: 'stein_g', toene: 'g', max_pct: 0, text: 'Ghul verlaesst die Steinrampe g (§1)' },
    { id: 'menschenrampe', toene: '!%G&()' + ':;?@[]', max_pct: 0, text: 'keine CH-1-Menschenrampe (E-C4)' },
    { id: 'gesperrte_toene', toene: 'xf', max_pct: 0, text: 'x/f gesperrt (E-C3)' },
  ],
  Grufthund: [
    { id: 'erdrampe', toene: 'zpvPV', max_pct: 0, text: 'Hund verlaesst die Erdrampe z/p/v/P/V VOLLSTAENDIG, inkl. Spitzlicht V (§1/V3)' },
    { id: 'katakombenstein', toene: 'tTLD', max_pct: 0, text: 'Hund != Katakomben-Stein t/T/L/D (E-C4)' },
    { id: 'corm_wolle', toene: '&()', max_pct: 0, text: 'Hund != Corm-Wolle &/(/) (E-C4)' },
    { id: 'menschenrampe', toene: '!%G:;?@[]', max_pct: 0, text: 'keine CH-1-Menschenrampe (E-C4)' },
    { id: 'gesperrte_toene', toene: 'xf', max_pct: 0, text: 'x/f gesperrt (E-C3, f = fog_blob der GRAVEYARD-Karte)' },
  ],
  Rostpanzer: [
    { id: 'knochen_b', toene: 'b', max_pct: 10, text: 'Knochen b nur <= 10 % (Rippenlinie, §1)' },
    { id: 'menschenrampe', toene: '!%G&()' + ':;?@[]', max_pct: 0, text: 'keine CH-1-Menschenrampe (E-C4)' },
    { id: 'gesperrte_toene', toene: 'xf', max_pct: 0, text: 'x/f gesperrt (E-C3)' },
  ],
  Warden: [
    { id: 'knochen_b', toene: 'b', max_pct: 10, text: 'Knochen b nur <= 10 % (Rippenlinie, §1)' },
    { id: 'gesperrte_toene', toene: 'xf', max_pct: 0, text: 'x/f gesperrt (E-C3)' },
  ],
  Schild: [
    { id: 'gesperrte_toene', toene: 'xf', max_pct: 0, text: 'x/f gesperrt (E-C3)' },
  ],
};
function sperrlistePruefen(figur, hist) {
  const gesamt = Object.values(hist).reduce((a, b) => a + b, 0) || 1;
  return (SPERRLISTE_GEGNER[figur] || []).map((r) => {
    const toene = [...r.toene];
    const texel = toene.reduce((a, t) => a + (hist[t] || 0), 0);
    const pct = 100 * texel / gesamt;
    return {
      id: r.id, regel: r.text, toene: toene.join(''), max_pct: r.max_pct,
      texel, anteil_pct: pct,
      je_ton: Object.fromEntries(toene.filter((t) => hist[t]).map((t) => [t, hist[t]])),
      ok: pct <= r.max_pct,
    };
  });
}

// ---------------------------------------------------------------------------
// G9b  WERKZEUG-NACHZUG 12.09.2026  (.tmp/gp7ch2_p1/AUFTRAG_NACHZUG_WERKZEUG.md)
//      LESARTEN UND AUSNAHMEN.  KEINE SCHWELLE WIRD VERAENDERT: geaendert wird
//      nur, WELCHE Grids ein Gate bewertet und in WELCHER LESART G5 urteilt.
//
//  (1) *_decal  (Entscheid B3 Zeichner B + A3 Zeichner A):  flache Bodenspur,
//      NIE geflippt (main.js fuehrt keine Decal-Flips, E-A4), und der Rahmen-
//      Deckel 25 % gilt auf dem EIGENEN Grid. Damit sind 3 Konturtoene mit je
//      >= 8 Texeln UND >= 12 % Rim arithmetisch unmoeglich (Beweis Zeichner B:
//      ein 16x6-Decal hat maximal 24 Randtexel). AUSGENOMMEN von G2 (Kontur-
//      toene), G3 (Rim), G4 (Halbseiten) und G5 (Spiegel). IN KRAFT bleiben
//      G1 (Schwarz k+n), G6 (Solitaer) und die eigenen DECAL-GATES (G12 unten,
//      ADDITIV ergaenzt — im Werkzeug standen sie bisher nicht).
//  (2) shield_side/_up/_down  (R-B4 + Entscheid B5 Zeichner B): Requisit mit
//      GEWOLLTEM Seitenlicht (23,5 L) und ebener Platte. AUSGENOMMEN von G4
//      und G5. G7 laeuft dort ueber art:"requisit" (keine Materialflaeche) —
//      unveraendert.
//  (3) G5 urteilt ab jetzt auf der TON-Lesart (Landkarte C 0.1 "Ton-Spiegel-
//      gleichheit": Anteil der OPAKEN Texel mit GLEICHEM Ton am bbox-Spiegel-
//      platz) <= 65 %. Die Teil-A-SILHOUETTEN-Lesart laeuft INFORMATIV mit
//      (kein Gate). Grund (Entscheid A2, gemessen): auf der Silhouetten-Lesart
//      liegen ALLE CH-1-abgenommenen Menschen bei 82,9..89,7 (player_side_0
//      83,8 / npc_bran_0 88,9 / npc_corm_0 83,3 / npc_hedda_0 86,6) — ein
//      Zweibeiner erreicht 35 % unbesetzte Spiegelplaetze nicht. Landkarte C
//      0.1 (Menschen 12,0..43,1 gegen Gegner 45..84) meinte die TON-Lesart;
//      Anker-Nachweis: Zeichner-A-Report "Hund 30,6" ist exakt SPIEG-C von
//      hound_0 (die E5-Ton-Lesart des Menschen-Werkzeugs liefert dort 22,1).
const IST_DECAL_KEY = (key) => /_decal$/.test(key);
const IST_SHIELD_KEY = (key) => /^shield_/.test(key);
const AUSNAHME_DECAL = 'ausgenommen: *_decal (R-B3/B3)';
const AUSNAHME_SHIELD = 'ausgenommen: shield_* (R-B4)';
function gateGrids(keys, opt) {
  const o = opt || {};
  return keys.filter((k) => !(o.ohneDecal && IST_DECAL_KEY(k)) && !(o.ohneShield && IST_SHIELD_KEY(k)));
}
function ausnahmeVermerk(keys, opt) {
  const o = opt || {};
  const v = [];
  const d = keys.filter(IST_DECAL_KEY), s = keys.filter(IST_SHIELD_KEY);
  if (o.ohneDecal && d.length) v.push(AUSNAHME_DECAL + ': ' + d.join(','));
  if (o.ohneShield && s.length) v.push(AUSNAHME_SHIELD + ': ' + s.join(','));
  return v;
}
// G4/G5 nehmen BEIDE Ausnahmen; als Funktion, weil halbseitenJeGrid je Grid urteilt.
function ausnahmeG4G5(key) {
  if (IST_DECAL_KEY(key)) return AUSNAHME_DECAL;
  if (IST_SHIELD_KEY(key)) return AUSNAHME_SHIELD;
  return null;
}

// --- DECAL-GATES (G12, ADDITIV) --------------------------------------------
//   Quelle: SPEC Rev 2 E-A4 / E-B9 + GP7CH2_PHASE0.md R-A4 + die Masstabelle
//   in .tmp/check_gfx6_art.mjs (Breite/Hoehe stehen dort schon, Rahmen-% und
//   der Kontrast gegen *_die standen in KEINEM Werkzeug).
//     Breite  = Breite des Basisgrids (Decal liegt deckungsgleich darunter)
//     Hoehe  <= min(6, floor(0,4 * Basishoehe), Hund 4)
//     Rahmen <= 25 % auf dem EIGENEN Grid
//     messbar verschieden von *_die (ODER-Verknuepfung, R-A4 woertlich):
//       Texel-Diff >= 30 % ODER >= 2 Zeilen flacher ODER Wert-L um >= 20 tiefer
const DECAL_RAHMEN_MAX_PCT = 25;
const DECAL_ZEILEN_HART = { hound: 4 };
const DECAL_BASIS = { skeleton: 'skeleton_0', hound: 'hound_0', ghoul: 'ghoul_0', rust: 'rust_0', warden: 'warden_idle' };
const DECAL_TEXELDIFF_MIN_PCT = 30;
const DECAL_ZEILEN_FLACHER_MIN = 2;
const DECAL_L_ABSTAND_MIN = 20;
// NACHZUG RUNDE 2 (V-SPEC B1/M4 + Fable-Regel): zwei Unterpruefungen mehr.
//   (a) RIM-DECKEL: <= 15 % der opaken Decal-Texel tragen einen deklarierten
//       Rim-Ton der Figur (Rim-Toene kommen aus der MATERIAL-TABELLE, gleiche
//       Aufloesung wie G3). Eine Bodenspur liegt flach — sie darf kein
//       Glanzlicht wie ein aufrechter Koerper tragen.
//   (b) BODENKANTE: mindestens EIN Ton mit >= 4 Texeln, der k/n ODER der
//       DUNKELSTE Materialton der Figur ist, und der in der UNTERSTEN
//       BELEGTEN ZEILE des Decals ODER auf der KONTUR-UNTERSEITE liegt
//       (Texel, dessen unterer 4er-Nachbar transparent ist oder das die
//       untere Rahmenkante beruehrt). Ohne diese Kante liest die Spur als
//       schwebender Fleck statt als Abdruck auf dem Boden.
const DECAL_RIM_MAX_PCT = 15;
const DECAL_BODENKANTE_MIN_TEXEL = 4;
// Dunkelster MATERIALton der Figur (Kante/Licht/Requisit/Merkmal zaehlen
// nicht als Material — dieselbe Liste wie bei G7), nur Toene mit Texeln.
function dunkelsterMaterialton(fig, tabelle, hist) {
  const e = tabelle && tabelle.figuren ? tabelle.figuren[fig] : null;
  if (!e || !Array.isArray(e.flaechen)) return null;
  const kand = [];
  for (const fl of e.flaechen) {
    if (!fl || MATERIALFLAECHE_KEIN_MATERIAL.includes(fl.art) || !Array.isArray(fl.toene)) continue;
    for (const t of fl.toene) if (hist[t] && PALETTE[t]) kand.push({ ton: t, L: L601hex(PALETTE[t]), flaeche: fl.name });
  }
  if (!kand.length) return null;
  kand.sort((a, b) => a.L - b.L || a.ton.localeCompare(b.ton));
  return kand[0];
}
// Wert-L eines Grids = Mittel L601 ueber ALLE opaken Texel. Bei einem 6-zeiligen
// Decal ist fast jedes Texel Kontur, deshalb ist die E5-Koerper-L-Formel dort
// oft leer; sie laeuft als Zweitlesart mit.
function opakMittelL(key) {
  const g = SPRITES[key]; if (!g) return null;
  let s = 0, n = 0;
  for (const r of g) for (const c of r) { if (c === '.') continue; s += L601hex(PALETTE[c]); n++; }
  return n ? s / n : null;
}
function decalBefund(fig, grids, rimToene, hist) {
  const dunkel = dunkelsterMaterialton(fig, MATERIAL_GEGNER, hist || {});
  const kandidaten = ['k', 'n'].concat(dunkel ? [dunkel.ton] : []);
  const zeilen = [];
  for (const key of grids.filter(IST_DECAL_KEY)) {
    const fam = key.slice(0, -'_decal'.length);
    const basisKey = DECAL_BASIS[fam] || null;
    const dieKey = SPRITES[fam + '_die'] ? fam + '_die' : null;
    const d = grundmasseJeGrid(key);
    const b = basisKey && SPRITES[basisKey] ? grundmasseJeGrid(basisKey) : null;
    const deckel40 = b ? Math.floor(0.4 * b.hoehe) : null;
    const hart = DECAL_ZEILEN_HART[fam] === undefined ? null : DECAL_ZEILEN_HART[fam];
    const deckel = b ? Math.min(6, deckel40, hart === null ? 99 : hart) : null;
    const fd = dieKey ? framediff(key, dieKey) : null;
    const opakDie = dieKey ? opakVon(SPRITES[dieKey]) : null;
    const hDie = dieKey ? SPRITES[dieKey].length : null;
    const texelPct = (fd && opakDie) ? 100 * fd.diff / opakDie : null;
    const zeilenFlacher = hDie === null ? null : hDie - d.hoehe;
    const lDecal = opakMittelL(key), lDie = dieKey ? opakMittelL(dieKey) : null;
    const lAbstand = (lDecal !== null && lDie !== null) ? lDie - lDecal : null;
    const e5Decal = koerperMittel([key], rimToene), e5Die = dieKey ? koerperMittel([dieKey], rimToene) : null;
    const pfadTexel = texelPct !== null && texelPct >= DECAL_TEXELDIFF_MIN_PCT;
    const pfadZeilen = zeilenFlacher !== null && zeilenFlacher >= DECAL_ZEILEN_FLACHER_MIN;
    const pfadWert = lAbstand !== null && lAbstand >= DECAL_L_ABSTAND_MIN;
    const breiteOk = b ? d.breite === b.breite : null;
    const hoeheOk = deckel === null ? null : d.hoehe <= deckel;
    const rahmenOk = d.rahmen_pct <= DECAL_RAHMEN_MAX_PCT;
    const verschiedenOk = dieKey === null ? null : (pfadTexel || pfadZeilen || pfadWert);
    // (a) RIM-DECKEL + (b) BODENKANTE — Runde 2
    const { h: dh, w: dw, at: dat } = gridInfo(SPRITES[key]);
    let opakD = 0, rimD = 0, letzteZeile = -1;
    for (let y = 0; y < dh; y++) for (let x = 0; x < dw; x++) {
      const c = dat(x, y); if (c === '.') continue;
      opakD++; if (rimToene.includes(c)) rimD++;
      if (y > letzteZeile) letzteZeile = y;
    }
    const rimPct = opakD ? 100 * rimD / opakD : 0;
    const kanteHist = {};
    for (let y = 0; y < dh; y++) for (let x = 0; x < dw; x++) {
      const c = dat(x, y); if (c === '.' || !kandidaten.includes(c)) continue;
      const unten = (y === dh - 1) || dat(x, y + 1) === '.';
      if (y === letzteZeile || unten) kanteHist[c] = (kanteHist[c] || 0) + 1;
    }
    const kanteToene = Object.keys(kanteHist).filter((c) => kanteHist[c] >= DECAL_BODENKANTE_MIN_TEXEL).sort();
    const rimOk = rimPct <= DECAL_RIM_MAX_PCT;
    const kanteOk = kanteToene.length > 0;
    zeilen.push({
      decal: key, familie: fam, basisgrid: basisKey, die_grid: dieKey,
      breite: d.breite, hoehe: d.hoehe,
      basis_breite: b ? b.breite : null, basis_hoehe: b ? b.hoehe : null,
      breite_ok: breiteOk,
      hoehe_deckel: deckel, hoehe_deckel_teile: { sechs: 6, vierzig_pct_von_basis: deckel40, familie_hart: hart },
      hoehe_ok: hoeheOk,
      rahmen_pct: d.rahmen_pct, rahmen_max: DECAL_RAHMEN_MAX_PCT, rahmen_ok: rahmenOk,
      texel_diff_gegen_die: fd ? fd.diff : null, opak_die: opakDie, texel_diff_pct: texelPct,
      zeilen_flacher_als_die: zeilenFlacher,
      wert_L_decal: lDecal, wert_L_die: lDie, wert_L_abstand: lAbstand,
      koerper_L_e5_decal: e5Decal ? e5Decal.L : null, koerper_L_e5_die: e5Die ? e5Die.L : null,
      pfad_texeldiff_30pct: pfadTexel, pfad_zwei_zeilen_flacher: pfadZeilen, pfad_wert_minus_20L: pfadWert,
      verschieden_ok: verschiedenOk,
      // Runde 2 (a) RIM-DECKEL
      rimtoene: rimToene.slice(), rim_texel: rimD, opak_decal: opakD,
      rim_pct: rimPct, rim_max_pct: DECAL_RIM_MAX_PCT, rim_ok: rimOk,
      // Runde 2 (b) BODENKANTE
      bodenkante_kandidaten: kandidaten.slice(),
      dunkelster_materialton: dunkel ? dunkel.ton : null,
      dunkelster_materialton_L: dunkel ? dunkel.L : null,
      dunkelster_materialton_flaeche: dunkel ? dunkel.flaeche : null,
      unterste_belegte_zeile: letzteZeile,
      bodenkante_histogramm: kanteHist,
      bodenkante_toene: kanteToene,
      bodenkante_min_texel: DECAL_BODENKANTE_MIN_TEXEL,
      bodenkante_ok: kanteOk,
      ok: breiteOk === true && hoeheOk === true && rahmenOk === true && verschiedenOk !== false
        && rimOk === true && kanteOk === true,
    });
  }
  zeilen.sort((a, b) => a.decal.localeCompare(b.decal));
  return {
    lesart: 'Breite = Basisgrid; Hoehe <= min(6, floor(0,4*Basishoehe), Hund 4); Rahmen-% <= '
      + DECAL_RAHMEN_MAX_PCT + ' auf dem EIGENEN Grid; messbar verschieden von *_die: Texel-Diff >= '
      + DECAL_TEXELDIFF_MIN_PCT + ' % von |opak(*_die)| ODER >= ' + DECAL_ZEILEN_FLACHER_MIN
      + ' Zeilen flacher ODER Wert-L (Mittel L601 ALLER opaken Texel) um >= ' + DECAL_L_ABSTAND_MIN
      + ' niedriger. RUNDE 2 zusaetzlich: Rim-Anteil <= ' + DECAL_RIM_MAX_PCT
      + ' % der opaken Decal-Texel (Rim-Toene der Figur aus der Material-Tabelle) UND >= 1 Ton mit >= '
      + DECAL_BODENKANTE_MIN_TEXEL + ' Texeln als BODENKANTE (k/n oder der dunkelste Materialton der Figur, in der'
      + ' untersten belegten Zeile ODER auf der Kontur-Unterseite). Quelle E-A4 / R-A4 / E-B9 + V-SPEC B1/M4'
      + ' + check_gfx6_art.mjs Masstabelle.',
    zeilen, anzahl: zeilen.length,
    rot: zeilen.filter((z) => !z.ok).map((z) => z.decal),
    ok: zeilen.length ? zeilen.every((z) => z.ok) : null,
  };
}

// --- TABELLEN-TOENE OHNE TEXEL (Nachzug Punkt 6) ---------------------------
//   Toene, die die MATERIAL-TABELLE der Figur nennt, die aber in KEINEM Grid
//   der Figur vorkommen. Sie werden AUSGEWIESEN, nicht stillschweigend
//   geloescht (Entscheid A9: 'n' im Ghul-/Schild-Umriss). Die Gegenrichtung
//   (Grid-Ton ohne Tabellen-Eintrag) laeuft daneben mit.
function tabellenToeneOhneTexel(fig, tabelle, hist) {
  const eintrag = tabelle && tabelle.figuren ? tabelle.figuren[fig] : null;
  const zeilen = [];
  if (!eintrag) return { figur: fig, eintrag_vorhanden: false, zeilen, anzahl: 0, toene: [], grid_toene_ohne_tabellen_eintrag: [] };
  const genannt = new Set();
  if (Array.isArray(eintrag.rim)) for (const t of eintrag.rim) {
    genannt.add(t);
    if (!hist[t]) zeilen.push({ ton: t, herkunft: 'Feld "rim"', flaeche: null, art: 'rim' });
  }
  for (const fl of (Array.isArray(eintrag.flaechen) ? eintrag.flaechen : [])) {
    for (const t of (Array.isArray(fl.toene) ? fl.toene : [])) {
      genannt.add(t);
      if (!hist[t]) zeilen.push({ ton: t, herkunft: 'Flaeche', flaeche: fl.name, art: fl.art });
    }
  }
  zeilen.sort((a, b) => a.ton.localeCompare(b.ton) || String(a.flaeche).localeCompare(String(b.flaeche)));
  const ohneEintrag = Object.keys(hist).sort().filter((t) => !genannt.has(t)).map((t) => ({ ton: t, texel: hist[t] }));
  return {
    figur: fig, eintrag_vorhanden: true,
    lesart: 'Ton steht in der MATERIAL-TABELLE (Feld "rim" oder einer Flaeche), kommt aber in KEINEM Grid der Figur vor. NICHT loeschen — Liste an Fable (Nachzug Punkt 6).',
    zeilen, anzahl: zeilen.length,
    toene: [...new Set(zeilen.map((z) => z.ton))].sort(),
    grid_toene_ohne_tabellen_eintrag: ohneEintrag,
  };
}

// ---------------------------------------------------------------------------
// G9c  DEKLARATIONSLISTE  (NACHZUG RUNDE 2, Fable 12.09.2026)
// ---------------------------------------------------------------------------
// Eine DEKLARATION ist KEINE Schwellenaenderung: das Gate-Urteil bleibt ROT
// und steht so in der ersten Bilanz. Die Deklaration macht nur sichtbar, dass
// Fable diesen EINEN Befund mit Begruendung und Quelle abgenommen hat, und
// zaehlt ihn in einer ZWEITEN Bilanz ("gruen ODER deklariert") mit.
//
// JEDE Deklaration ist an eine BEDINGUNG geknuepft. Deckt der gemessene Befund
// mehr ab als die Deklaration hergibt (z. B. ein ZWEITES rotes Warden-Grid
// neben warden_dash, oder eine dritte rote Materialflaeche beim Ghul), dann
// GREIFT DIE DEKLARATION NICHT und der Befund bleibt auch in der zweiten
// Bilanz rot — mit einer Warnzeile. So kann eine Deklaration nicht stillschwei-
// gend zum Blankoschein werden.
const DEKLARATIONEN = [
  {
    figur: 'Skelett', gate: 'G7_materialflaechen',
    grund: "MAXTON '/' bis 70 % zugelassen: die Knochenrampe hat nur ZWEI brauchbare Stufen — '\"' (#4b5686) liest neben hellem Knochen als gesaettigtes Blau, '$' liest als Fleisch (Entscheid A8). Notiz CH-3: warm-neutraler dritter Knochenton.",
    quelle: 'Fable-Deklaration Runde 2; Praezedenz SPEC_GP7CH1 Rev 2.3 G-C',
    flaechen_erlaubt: ['Knochen'], kriterien_erlaubt: ['tonanteil'], maxton_deckel: 70,
  },
  {
    figur: 'Ghul', gate: 'G7_materialflaechen',
    grund: "Schaedel H/3 ist eine 2-Stufen-AKZENTFLAECHE ueber 40 Texel (gross und bleich = Identitaet, FIX 1) und Lumpen 'd' liegt ueber 55 %, weil das Koerper-L-Band mit dem grossen Schaedel sonst nicht zu halten ist.",
    quelle: 'Fable-Deklaration Runde 2 (Steckbrief Ghul, Landkarte C §2)',
    flaechen_erlaubt: ['Lumpen', 'Schaedel'], kriterien_erlaubt: ['tonanteil', 'stufen', 'schritt', 'hue'], maxton_deckel: 90, // Fable: der Deckel gilt fuer die roten Flaechen ZUSAMMEN — Schaedel H/3 ist 2-Stufen-Akzent (H 86,7 %), Lumpen 'd' liegt bei 66,5 % (dokumentiert in GP7CH2_PHASE1.md P1-D5, Erwartung <= 70)
  },
  {
    figur: 'Grufthund', gate: 'G7_materialflaechen',
    grund: 'Hue-Spanne 19,2 statt >= 20: das Rev-2-Fenster war exakt 20 Grad breit (Spec-Fehler) — kein Rim nur um die Zahl zu retten.',
    quelle: 'GP7CH2_PHASE0.md R-B5 (deklariert), von Fable in Runde 2 bestaetigt',
    flaechen_erlaubt: ['Fell/Haut'], kriterien_erlaubt: ['hue'], hue_untergrenze: 19,
  },
  {
    figur: 'Rostpanzer', gate: 'G7_materialflaechen',
    grund: 'Hue-Spanne 12,0: die Rostrampe 4/5/6 ist EINGEFROREN (Bestandston, auch in den Warden-Schienen) — eine breitere Hue-Spanne waere eine Palettenaenderung.',
    quelle: 'Entscheid B2 Zeichner B, von Fable in Runde 2 deklariert',
    flaechen_erlaubt: ['Rostpanzer'], kriterien_erlaubt: ['hue'], hue_untergrenze: 10,
  },
  {
    figur: 'Warden', gate: 'G4_halbseiten_dL',
    grund: 'warden_dash ist die AUSFALLSCHRITT-Pose des Eichkoerpers; E-C5 verbietet eine Posenaenderung. ALLE anderen Warden-Grids muessen <= 6,5 L bleiben — das ist weiter Gate.',
    quelle: 'Entscheid A5 Zeichner A + SPEC Rev 2 E-C5, von Fable in Runde 2 deklariert',
    grids_erlaubt: ['warden_dash'],
  },
  {
    figur: 'Warden', gate: 'G7_materialflaechen',
    grund: 'Bestandsrampe O/B/b/N (Knochen/Panzerplatten, Umhang u/U/X, Rostschienen 4/5/6, Guertel Y/y): der Warden ist Eichkoerper, seine Rampen sind Bestand und werden in CH-2 nicht umgefaerbt.',
    quelle: 'Entscheid A5 Zeichner A + SPEC Rev 2 E-C5, von Fable in Runde 2 deklariert',
    flaechen_erlaubt: ['Knochen/Panzerplatten', 'Umhang/Stoff', 'Rostschienen', 'Guertel/Gold'],
    kriterien_erlaubt: ['stufen', 'schritt', 'tonanteil', 'hue'], maxton_deckel: 75, // Fable: Guertel/Gold 70,2 % — Bestand, Deckel 75
  },
  {
    figur: 'Warden', gate: 'G11_sperrliste',
    grund: "E-C5 verlangt 'b senken' fuer das Koerper-L, aber KEINEN 10-%-Deckel (die 10 % waren die Rost-Regel). Alle Warden-Grids sind gegenueber dem Vorher-Stand gesunken; die 10-%-Fassung war als Bild eine graue Masse und wurde verworfen.",
    quelle: 'Entscheid A5 Zeichner A + SPEC Rev 2 E-C5, von Fable in Runde 2 deklariert',
    regeln_erlaubt: ['knochen_b'],
  },
  {
    figur: 'Schild', gate: 'G7_materialflaechen',
    grund: 'Die Schildplatte ist ein REQUISIT des Rostpanzers (art:"requisit"), keine Materialflaeche. Seit Runde 2 ist shield_* aus G7 AUSGENOMMEN — die Deklaration laeuft nur noch als Beleg mit.',
    quelle: 'Entscheid B5 Zeichner B + R-B4, von Fable in Runde 2 deklariert',
    flaechen_erlaubt: [], kriterien_erlaubt: [], keine_flaeche_ok: true,
  },
];

// Prueft eine Deklaration gegen den gemessenen Gate-Befund.
// Rueckgabe: { deckt, ist, warnung }
function deklarationPruefen(dek, L) {
  const G = L[Object.keys(L).find((k) => L[k] && typeof L[k] === 'object' && L[k].id === dek.gate)];
  if (!G) return { deckt: false, ist: '(Gate nicht gefunden)', warnung: 'Gate ' + dek.gate + ' im Befund nicht gefunden' };
  if (G.ok === true) return { deckt: false, ist: 'gruen', warnung: null, unnoetig: true };
  if (G.ok === null) return { deckt: false, ist: 'nicht gewertet (ausgesetzt/ausgenommen)', warnung: null, unnoetig: true };
  if (dek.gate === 'G7_materialflaechen') {
    const rot = G.flaechen.filter((f) => !f.ok);
    if (!rot.length) {
      if (dek.keine_flaeche_ok && G.flaechen.length === 0) return { deckt: true, ist: '0 Materialflaechen >= 40 Texel (Requisit)', warnung: null };
      return { deckt: false, ist: 'keine rote Flaeche, Gate dennoch rot', warnung: 'unerwartet' };
    }
    const fremd = rot.filter((f) => !dek.flaechen_erlaubt.some((n) => f.name.startsWith(n)));
    const fremdKrit = rot.flatMap((f) => f.kriterien_rot.filter((k) => !dek.kriterien_erlaubt.includes(k)).map((k) => f.name + '/' + k));
    const maxTon = Math.max(...rot.map((f) => f.groesster_tonanteil_pct));
    const minHue = Math.min(...rot.map((f) => f.hue_spanne_grad));
    const verletzt = [];
    if (fremd.length) verletzt.push('NICHT deklarierte Flaeche(n): ' + fremd.map((f) => f.name).join(' | '));
    if (fremdKrit.length) verletzt.push('NICHT deklariertes Kriterium: ' + fremdKrit.join(', '));
    if (dek.maxton_deckel !== undefined && maxTon > dek.maxton_deckel) verletzt.push('MAXTON ' + runde(maxTon, 2) + ' % > Deklarationsdeckel ' + dek.maxton_deckel + ' %');
    if (dek.hue_untergrenze !== undefined && minHue < dek.hue_untergrenze) verletzt.push('HUE ' + runde(minHue, 2) + ' < Deklarationsuntergrenze ' + dek.hue_untergrenze);
    const ist = rot.map((f) => f.name.slice(0, 28) + ' [' + f.kriterien_rot.join('+') + '] MAXTON ' + runde(f.groesster_tonanteil_pct, 2)
      + ' % / HUE ' + runde(f.hue_spanne_grad, 2) + ' / Stufen ' + f.stufen
      + ' / Schritt ' + (f.schrittverhaeltnis === null ? '--' : runde(f.schrittverhaeltnis, 2))).join('   ||   ');
    return { deckt: verletzt.length === 0, ist, warnung: verletzt.length ? verletzt.join('; ') : null };
  }
  if (dek.gate === 'G4_halbseiten_dL') {
    const fremd = G.grids_rot.filter((g) => !dek.grids_erlaubt.includes(g));
    return {
      deckt: fremd.length === 0,
      ist: 'rot: ' + G.grids_rot.join(',') + '   max |dL| ' + runde(G.max, 2) + ' L (Grenze ' + G.grenze + ')',
      warnung: fremd.length ? 'NICHT deklarierte Grids rot: ' + fremd.join(',') + ' — Deklaration deckt nur ' + dek.grids_erlaubt.join(',') : null,
    };
  }
  if (dek.gate === 'G11_sperrliste') {
    const fremd = G.rot.filter((r) => !dek.regeln_erlaubt.includes(r));
    const zeilen = G.regeln.filter((r) => !r.ok).map((r) => r.id + " '" + r.toene + "' " + runde(r.anteil_pct, 2) + ' % (max ' + r.max_pct + ' %)');
    return {
      deckt: fremd.length === 0,
      ist: zeilen.join('   ||   '),
      warnung: fremd.length ? 'NICHT deklarierte Regel(n) rot: ' + fremd.join(',') : null,
    };
  }
  return { deckt: false, ist: '(kein Prueflogik-Pfad fuer ' + dek.gate + ')', warnung: 'Prueflogik fehlt' };
}

// ---------------------------------------------------------------------------
// G10  EIN STAND MESSEN (GEGNER)
// ---------------------------------------------------------------------------
const SCHWARZ_MAX_PCT = { Skelett: 25, Ghul: 25, Grufthund: 30, Rostpanzer: 25, Warden: 25, Schild: 25 };
const KONTURTOENE_MIN = 3;
const RIM_MIN_PCT = 12;
const SPIEGEL_MAX_PCT = 65;
const SOLITAER_MAX_PCT_GEGNER = 8;
const PROFIL_GANZ_MAX = 60;
const MATERIAL_MIN_STUFEN = 3, MATERIAL_MAX_SCHRITT = 1.6, MATERIAL_MAX_TONANTEIL = 55, MATERIAL_MIN_HUE = 20;
const WALK_SILHOUETTE_MIN_PCT = 8, WALK_BAENDER_MIN = 2;
const MINDERHEIT_dL_MIN = 10, MINDERHEIT_dE00_MIN = 20, MINDERHEIT_RIM_MIN = 12, MINDERHEIT_dL_ZUWACHS = 15;

function laufStandGegner(stand, quelle, minderheitVorher) {
  setzeGegnerStand(quelle.sprites);
  const KARTEN = kampfkartenZensus();
  const WIRKORT = gegnerWirkorte();

  const TONHIST = {}, RIM = {};
  for (const fig of GEGNER_NAMEN) {
    TONHIST[fig] = tonHistogramm(FIGUREN[fig].grids);
    RIM[fig] = rimtoeneAusTabelle(fig, MATERIAL_GEGNER, TONHIST[fig], RIM_FALLBACK_KANDIDATEN_GEGNER);
  }

  // ---- Messung je Figur --------------------------------------------------
  const FIG = {};
  for (const fig of GEGNER_NAMEN) {
    const F = FIGUREN[fig];
    const rim = RIM[fig].toene;
    const sol = messSolitaer(fig, MATERIAL_GEGNER);
    const mat = messMaterial(fig, MATERIAL_GEGNER);
    const e5 = koerperMittel(F.grids, rim);
    const e5OhneRimAbzug = koerperMittel(F.grids, []);
    const inn = innenraumMittel(F.grids, rim);
    const mflaeche = dominanteMaterialflaeche(fig, MATERIAL_GEGNER, e5);

    const jeGrid = {};
    for (const key of F.grids) {
      const g = SPRITES[key]; if (!g) continue;
      const sp = spiegelTeilA(g);
      jeGrid[key] = {
        ...grundmasseJeGrid(key),
        spiegel_teilA_silhouette_pct: sp.silhouette_pct,
        spiegel_landkarteC_ton_pct: sp.ton_pct,
        spiegel_e5_ton_bbox_pct: spiegel(g, 'bbox').pct,
        rim: rimTeilA(key, rim),
        konturtoene: konturtoeneAb8(key, REQUISITEN[fig]),
        solitaer: sol.pro_grid[key] || null,
      };
    }
    const jeZusatz = {};
    for (const key of F.zusatz) {
      const g = SPRITES[key]; if (!g) continue;
      const sp = spiegelTeilA(g);
      jeZusatz[key] = { ...grundmasseJeGrid(key), spiegel_teilA_silhouette_pct: sp.silhouette_pct, spiegel_landkarteC_ton_pct: sp.ton_pct };
    }

    // Frame-Diff fuer JEDES Posenpaar
    const paare = posenpaare(F.grids).map(([a, b]) => {
      const d = framediff(a, b);
      const zb = zeilenbaender(a, b);
      const opakA = opakVon(SPRITES[a]);
      const anker = GEGNER_ANKER_FRAMEDIFF.find((x) => x.a === a && x.b === b) || null;
      return {
        paar: [a, b], rolle: anker ? 'Lauf-Paar (Teil A 7.2)' : 'Posenpaar',
        texel_diff: d.diff, silhouetten_diff: d.silhouetten_diff,
        opak_erstes_grid: opakA,
        texel_diff_pct: opakA ? 100 * d.diff / opakA : null,
        silhouetten_diff_pct: opakA ? 100 * d.silhouetten_diff / opakA : null,
        silhouette_baender: zb ? zb.silhouette_baender : null,
        silhouette_baender_anzahl: zb ? zb.silhouette_baender_anzahl : null,
        texel_baender_anzahl: zb ? zb.texel_baender_anzahl : null,
        anker_teilA: anker ? { texel: anker.texel, silhouette: anker.silhouette } : null,
        untergrenze_texel: d.diff,           // Rev 2.2 M2 / m3: Vorher-Wert = Untergrenze
        untergrenze_silhouette: d.silhouetten_diff,
      };
    });

    FIG[fig] = {
      familie: GEGNER_FAMILIE[fig],
      wertstufe: WERTSTUFE_VON[fig] || null,
      wertstufe_band: WERTSTUFE_VON[fig] ? WERTLEITER[WERTSTUFE_VON[fig]].band : null,
      vollfigur: GEGNER_VOLLFIGUR[fig],
      warden_ausgesetzt: fig === 'Warden' ? WARDEN_AUSGESETZT : [],
      basisgrid: F.basis,
      grids: F.grids, zusatzgrids: F.zusatz,
      grids_anzahl: F.grids.length,
      ton_histogramm: TONHIST[fig],
      toene_anzahl: Object.keys(TONHIST[fig]).length,
      rimtoene: rim, rim_quelle: RIM[fig].quelle, rim_fallback_aktiv: RIM[fig].fallback_aktiv,
      requisitentoene: REQUISITEN[fig],
      je_grid: jeGrid,
      je_zusatzgrid: jeZusatz,
      m1_umriss: messUmriss(fig),
      m4_material: mat,
      m6_solitaer: sol,
      m6b_sehnen_diagonalen: diagonalBefund(F.grids),
      m7_rim: messRim(fig, RIM[fig]),
      koerper: {
        koerper_L_e5: e5 ? e5.L : null,
        koerper_L_e5_texel: e5 ? e5.texel : null,
        koerper_L_e5_ohne_rimabzug: e5OhneRimAbzug ? e5OhneRimAbzug.L : null,
        koerper_mittelfarbe_rgb: e5 ? e5.rgb : null,
        koerper_mittel_Cab: e5 ? CabLab(e5.lab) : null,
        koerper_mittel_hue: e5 ? hueLab(e5.lab) : null,
        koerper_L_e5_nur_basisgrid: koerperMittel([F.basis], rim) ? koerperMittel([F.basis], rim).L : null,
        innenraum: inn,
        innenraum_lesart: 'E-B1/Review M2: Rampen-Mittel der INNENFLAECHE ohne k/n — die Zahl, auf die der Zeichner zielt. Innenraum = opake Texel, die weder Kontur noch Rim sind (identische Texelmenge wie Koerper-L E5), hier zusaetzlich ohne k/n.',
        de00_bezugsflaeche: mflaeche,
      },
      halbseiten: halbseitenJeGrid(fig, F.grids, ausnahmeG4G5),
      frame_diffs: paare,
      sperrliste: sperrlistePruefen(fig, TONHIST[fig]),
      // NACHZUG 12.09.: Decal-Gates (additiv) + Tabellen-Toene ohne Texel
      decal_befund: decalBefund(fig, F.grids, rim, TONHIST[fig]),
      tabellen_toene_ohne_texel: tabellenToeneOhneTexel(fig, MATERIAL_GEGNER, TONHIST[fig]),
    };
  }

  // ---- PROFILE (fussbuendig) ---------------------------------------------
  const PROF_GANZ = {}, PROF_KS_GATE = {}, PROF_KS_ANKER = {};
  for (const fig of GEGNER_NAMEN) {
    const F = FIGUREN[fig];
    if (!SPRITES[F.basis]) continue;
    PROF_GANZ[fig] = breitenprofil(F.basis);
    PROF_KS_GATE[fig] = kopfSchulterProfil(F.basis, KS_ZEILEN[fig]);
    PROF_KS_ANKER[fig] = kopfSchulterProfil(F.basis, KS_ZEILEN_ANKER);
  }
  const FIGUREN_OHNE_SCHILD = GEGNER_NAMEN.filter((f) => f !== 'Schild');
  const PROFIL = {
    lesart_ganze_figur: 'E5-Formel 100*(1 - Sum|a-b| / Sum max(a,b)) ueber zeilenindizierte Breitenprofile, FUSSBUENDIG (die Formel richtet die Vektoren an ihrem Ende aus) und mit ROHZEILEN inkl. leerer — genau die Lesart aus Teil C 0.3 (Review M2/M17). Teil A 5.1 (kopfbuendig) ist KEIN Anker.',
    lesart_kopf_schulter: 'dieselbe Formel auf die obersten ' + KS_ZEILEN_ANKER + ' BELEGTEN Zeilen; GATE-Lesart nimmt fuer den Grufthund ' + KS_ZEILEN.Grufthund + ' Zeilen (E-B3/M8), ANKER-Lesart (Teil C 0.3) nimmt fuer ALLE Figuren ' + KS_ZEILEN_ANKER + '.',
    ziel_ganze_figur: '<= ' + PROFIL_GANZ_MAX + ' fuer JEDES Paar (E-B3)',
    ziel_kopf_schulter: '<= ' + ZIEL_KS_GATE + ' jedes Paar, <= ' + ZIEL_KS_FAMILIENGATE + ' innerhalb einer Familie, Warden-Paare ausgenommen (E-B3)',
    profile_ganze_figur: PROF_GANZ,
    profile_kopf_schulter_gate: PROF_KS_GATE,
    profile_kopf_schulter_anker6: PROF_KS_ANKER,
    matrix_ganze_figur: profilMatrix(FIGUREN_OHNE_SCHILD, PROF_GANZ).sort((a, b) => b.aehnlichkeit - a.aehnlichkeit || a.paar.join('/').localeCompare(b.paar.join('/'))),
    matrix_kopf_schulter_gate: profilMatrix(FIGUREN_OHNE_SCHILD, PROF_KS_GATE).sort((a, b) => b.aehnlichkeit - a.aehnlichkeit || a.paar.join('/').localeCompare(b.paar.join('/'))),
    matrix_kopf_schulter_anker6: profilMatrix(FIGUREN_OHNE_SCHILD, PROF_KS_ANKER).sort((a, b) => b.aehnlichkeit - a.aehnlichkeit || a.paar.join('/').localeCompare(b.paar.join('/'))),
  };
  for (const m of PROFIL.matrix_ganze_figur) { m.grenze = PROFIL_GANZ_MAX; m.ok = m.aehnlichkeit <= PROFIL_GANZ_MAX; }
  for (const m of PROFIL.matrix_kopf_schulter_gate) {
    const wardenPaar = m.paar.includes('Warden');
    const familie = GEGNER_FAMILIE[m.paar[0]] === GEGNER_FAMILIE[m.paar[1]];
    m.warden_ausgenommen = wardenPaar; m.familie_gleich = familie;
    m.grenze = wardenPaar ? null : (familie ? ZIEL_KS_FAMILIENGATE : ZIEL_KS_GATE);
    m.ok = wardenPaar ? null : m.aehnlichkeit <= m.grenze;
  }
  PROFIL.paare_ueber_ziel_ganze_figur = PROFIL.matrix_ganze_figur.filter((m) => !m.ok).map((m) => m.paar.join('/') + ' ' + runde(m.aehnlichkeit, 1));
  PROFIL.paare_ueber_ziel_kopf_schulter = PROFIL.matrix_kopf_schulter_gate.filter((m) => m.ok === false).map((m) => m.paar.join('/') + ' ' + runde(m.aehnlichkeit, 1));

  // ---- E1 / LEITKLASSEN / MINDERHEITEN je Figur --------------------------
  const E1G = { karten: KARTEN, wirkorte: WIRKORT, figuren: {} };
  for (const fig of GEGNER_NAMEN) {
    const karten = WIRKORT[fig].karten_liste;
    const e5 = FIG[fig].koerper.koerper_L_e5;
    const lab = FIG[fig].koerper.koerper_mittelfarbe_rgb ? labRGB(...FIG[fig].koerper.koerper_mittelfarbe_rgb) : null;
    const flLab = FIG[fig].koerper.de00_bezugsflaeche && FIG[fig].koerper.de00_bezugsflaeche.lab
      ? FIG[fig].koerper.de00_bezugsflaeche.lab : lab;
    const rimPctTeilA = FIG[fig].je_grid[FIGUREN[fig].basis] && FIG[fig].je_grid[FIGUREN[fig].basis].rim
      ? FIG[fig].je_grid[FIGUREN[fig].basis].rim.rim_teilA_pct : 0;

    const jeKarte = {}, fenster = [];
    const minderheit = [];
    for (const karte of karten) {
      const kz = KARTEN[karte];
      if (!kz) continue;
      const kl = kz.leitklasse;
      if (kz.leitklasse_fenster) fenster.push(kz.leitklasse_fenster);
      const leitKacheln = kl ? kz.klassen[kl].kacheln : [];
      jeKarte[karte] = {
        leitklasse: kl,
        leitklasse_anteil_pct: kz.leitklasse_anteil_pct,
        leitklasse_L: kz.leitklasse_L,
        fenster: kz.leitklasse_fenster,
        dL_je_leitkachel: leitKacheln.map((c) => ({ art: c.art, boden_L: c.L, dL: e5 - c.L, dL_ok: Math.abs(e5 - c.L) >= dL_MIN && Math.abs(e5 - c.L) <= dL_MAX })),
        dL_min: leitKacheln.length ? Math.min(...leitKacheln.map((c) => e5 - c.L)) : null,
        dL_max: leitKacheln.length ? Math.max(...leitKacheln.map((c) => e5 - c.L)) : null,
      };
      // E-B2: Minderheitsklassen, Weg und Wasser SEPARAT
      for (const mk of kz.minderheitsklassen) {
        for (const c of mk.kacheln) {
          if (c.L === null) continue;
          const dL = e5 - c.L;
          const dE = flLab && c.lab ? dE00(flLab, c.lab) : null;
          const dEganz = lab && c.lab ? dE00(lab, c.lab) : null;
          const vorherDL = minderheitVorher && minderheitVorher[fig] ? minderheitVorher[fig][karte + '|' + c.art] : null;
          const pfadRim = rimPctTeilA >= MINDERHEIT_RIM_MIN && vorherDL !== null && vorherDL !== undefined
            ? dL >= vorherDL + MINDERHEIT_dL_ZUWACHS : false;
          minderheit.push({
            karte, klasse: mk.klasse, art: c.art,
            klasse_anteil_pct: mk.anteil_pct,
            boden_L: c.L, dL, dE00_flaeche: dE, dE00_ganzkoerper: dEganz,
            rim_pct: rimPctTeilA,
            // dL ist VORZEICHENBEHAFTET zu lesen: E1 fordert die Figur
            // HELLER als den Boden (band_hell), und beide bindenden Dokumente
            // urteilen so — Teil A 1.4 fuehrt den Grufthund auf dem Weg mit
            // -16,1 als ROT, Landkarte C H4 nennt ihn mit dL -10,4 "den
            // einzigen Fall, der beide Pfade gleichzeitig reisst". Mit einer
            // Betragslesart waere er gruen und das Kriterium ein No-op —
            // genau der Defekt, den Review Linse 2 M6 abstellt. Die
            // Betragslesart laeuft ohne Gate-Wirkung mit.
            pfad_dL: dL >= MINDERHEIT_dL_MIN,
            pfad_dL_betragslesart: Math.abs(dL) >= MINDERHEIT_dL_MIN,
            pfad_dE00: dE !== null && dE >= MINDERHEIT_dE00_MIN,
            pfad_rim_plus_zuwachs: pfadRim,
            vorher_dL: vorherDL === undefined ? null : vorherDL,
            ok: (dL >= MINDERHEIT_dL_MIN) || (dE !== null && dE >= MINDERHEIT_dE00_MIN) || pfadRim,
          });
        }
      }
    }
    minderheit.sort((a, b) => a.karte.localeCompare(b.karte) || a.klasse.localeCompare(b.klasse) || a.art.localeCompare(b.art));
    const schnittF = fenster.length ? schnitt(fenster) : null;
    const wertband = FIG[fig].wertstufe_band;
    E1G.figuren[fig] = {
      wirkort_karten: karten,
      spawns: WIRKORT[fig],
      je_karte: jeKarte,
      fenster_je_karte: fenster,
      fenster: schnittF,
      fenster_breite: schnittF ? schnittF[1] - schnittF[0] : null,
      ist_koerper_L_e5: e5,
      ist_im_fenster: schnittF ? (e5 >= schnittF[0] && e5 <= schnittF[1]) : null,
      delta_bis_fenster: schnittF ? (e5 < schnittF[0] ? schnittF[0] - e5 : (e5 > schnittF[1] ? schnittF[1] - e5 : 0)) : null,
      wertstufe: FIG[fig].wertstufe, wertstufe_band: wertband,
      ist_in_wertstufe: wertband ? (e5 >= wertband[0] && e5 <= wertband[1]) : null,
      delta_bis_wertstufe: wertband ? (e5 < wertband[0] ? wertband[0] - e5 : (e5 > wertband[1] ? wertband[1] - e5 : 0)) : null,
      minderheitsklassen: minderheit,
      minderheit_rot: minderheit.filter((m) => !m.ok).map((m) => m.karte + '/' + m.art),
      // Innenraum-Zielzahlen: was muss die RAMPE im Inneren mitteln, damit das
      // Gate (Koerper-L) die Wertstufe trifft?  (E-B1 / Review M2)
      innenraum_zielzahl: wertband ? {
        lesart: 'M = (L_ziel * n_innen - Summe L der Innen-k/n) / n_innen_ohne_kn  — Umkehrung der E5-Koerper-L-Formel bei UNVERAENDERTER Innen-Schwarzflaeche',
        wertstufe_band: wertband,
        ziel_unten: innenraumZielzahl(FIG[fig].koerper.innenraum, wertband[0]),
        ziel_oben: innenraumZielzahl(FIG[fig].koerper.innenraum, wertband[1]),
        ist: FIG[fig].koerper.innenraum.innen_ohne_kn_L,
        innen_texel: FIG[fig].koerper.innenraum.innen_texel_gesamt,
        innen_kn_texel: FIG[fig].koerper.innenraum.innen_kn_texel,
        innen_ohne_kn_texel: FIG[fig].koerper.innenraum.innen_ohne_kn_texel,
        // Empfindlichkeit: EIN schwarzes Innentexel in einen Rampenton
        // umgefaerbt (n_innen bleibt, n_kn -1, n_rest +1) — das ist die
        // Kopplung, die Review M2 beschreibt ("Schwarz <= 25 % und Koerper-L
        // ziehen gegeneinander").
        empfindlichkeit_je_umgefaerbtem_innen_schwarztexel:
          innenraumZielzahl(umgefaerbtesInnen(FIG[fig].koerper.innenraum), wertband[0]) === null ? null
            : innenraumZielzahl(umgefaerbtesInnen(FIG[fig].koerper.innenraum), wertband[0]) - innenraumZielzahl(FIG[fig].koerper.innenraum, wertband[0]),
      } : null,
    };
  }

  // Wertleiter-Abstandspruefung (E-B1: benachbarte Stufen >= 5 L, gemessen
  // an den IST-Werten, nicht an den Bandraendern — Review Linse 2 M1)
  const leiter = Object.keys(WERTLEITER)
    .map((st) => ({ stufe: st, band: WERTLEITER[st].band, figuren: WERTLEITER[st].figuren.map((f) => ({ figur: f, ist_L: FIG[f] ? FIG[f].koerper.koerper_L_e5 : null })) }))
    .sort((a, b) => a.band[0] - b.band[0]);
  const leiterIst = GEGNER_NAMEN.filter((f) => WERTSTUFE_VON[f]).map((f) => ({ figur: f, stufe: WERTSTUFE_VON[f], ist_L: FIG[f].koerper.koerper_L_e5 }))
    .sort((a, b) => a.ist_L - b.ist_L);
  const leiterAbstaende = [];
  for (let i = 1; i < leiterIst.length; i++) {
    leiterAbstaende.push({
      unten: leiterIst[i - 1].figur, oben: leiterIst[i].figur,
      stufen: [leiterIst[i - 1].stufe, leiterIst[i].stufe],
      abstand_L: leiterIst[i].ist_L - leiterIst[i - 1].ist_L,
      gleiche_stufe: leiterIst[i - 1].stufe === leiterIst[i].stufe,
      gleiche_familie: GEGNER_FAMILIE[leiterIst[i - 1].figur] === GEGNER_FAMILIE[leiterIst[i].figur],
      ok: leiterIst[i - 1].stufe === leiterIst[i].stufe ? null : (leiterIst[i].ist_L - leiterIst[i - 1].ist_L) >= 5,
    });
  }
  E1G.wertleiter = { baender: leiter, ist_reihenfolge: leiterIst, abstaende: leiterAbstaende, regel: 'benachbarte Stufen >= 5 L (E-B1); Familie+Stufe nie beide gleich (E-B4)' };

  // ---- ZIEL-KOPF-SCHULTER-PROFILE ----------------------------------------
  const istKS = {};
  for (const n of ZIEL_FIGUREN) istKS[n] = PROF_KS_GATE[n] || [];
  const ZIELE = zielKopfSchulter(istKS, PROF_KS_GATE.Warden || []);
  // Steckbriefzeilen (das eingefrorene Deliverable)
  ZIELE.steckbriefzeilen = [...ZIEL_FIGUREN, 'Warden'].map((n) => {
    const z = E1G.figuren[n] ? E1G.figuren[n].innenraum_zielzahl : null;
    const teile = [];
    teile.push(n.toUpperCase() + ' (' + GEGNER_FAMILIE[n] + ', Wertstufe ' + (WERTSTUFE_VON[n] || '--') + ')');
    teile.push('Kopf-Schulter-Zielprofil [' + (ZIELE.profile[n] || []).join(',') + ']'
      + ' (IST [' + (istKS[n] || PROF_KS_GATE[n] || []).join(',') + ']'
      + (n === 'Warden' ? ', EINGEFROREN — Eichkoerper' : ', ' + l1Abstand(ZIELE.profile[n], istKS[n]) + ' Texel Aenderung') + ')');
    if (z) teile.push('Koerper-L E5 ' + runde(z.wertstufe_band[0], 1) + '..' + runde(z.wertstufe_band[1], 1)
      + ' (IST ' + runde(FIG[n].koerper.koerper_L_e5, 1) + ')');
    if (z) teile.push('Innenraum-Rampenmittel ohne k/n ' + runde(z.ziel_unten, 1) + '..' + runde(z.ziel_oben, 1)
      + ' (IST ' + runde(z.ist, 1) + ')');
    return teile.join('; ');
  });

  // ---- LEITPLANKEN / GATES je Figur --------------------------------------
  const LEITG = { stand, figuren: {}, paargates: {}, bilanz: {} };
  for (const fig of GEGNER_NAMEN) {
    const F = FIGUREN[fig];
    const aus = fig === 'Warden' ? WARDEN_AUSGESETZT : [];
    const gates = [];
    const nimm = (g) => { gates.push(g); return g; };

    // (G1) Schwarz k+n je Grid
    const schwarzGrenze = SCHWARZ_MAX_PCT[fig];
    const schwarzGrids = F.grids.filter((k) => FIG[fig].je_grid[k]).map((k) => ({
      grid: k, ist: FIG[fig].je_grid[k].schwarz_kn_pct, grenze: schwarzGrenze,
      ok: FIG[fig].je_grid[k].schwarz_kn_pct <= schwarzGrenze,
    }));
    const G1 = nimm({
      id: 'G1_schwarz_kn', groesse: 'Schwarz k+n je Grid', grenze: schwarzGrenze,
      hinweis: fig === 'Grufthund' ? 'deklarierte Ausnahme 30 % (§1/§8, vier Laeufe)' : null,
      max: schwarzGrids.length ? Math.max(...schwarzGrids.map((g) => g.ist)) : null,
      grids_rot: schwarzGrids.filter((g) => !g.ok).map((g) => g.grid),
      je_grid: schwarzGrids, ok: schwarzGrids.every((g) => g.ok),
    });

    // (G2) >= 3 Konturtoene >= 8 Texel (ohne Requisit)
    //      NACHZUG 12.09.: *_decal ausgenommen (B3/A3) — der 25-%-Rahmendeckel
    //      macht 3 Konturtoene x 8 Texel arithmetisch unmoeglich.
    const G2_AUS = { ohneDecal: true };
    const kt = gateGrids(F.grids, G2_AUS).filter((k) => FIG[fig].je_grid[k]).map((k) => ({
      grid: k, ist: FIG[fig].je_grid[k].konturtoene.konturtoene_ab8_anzahl,
      toene: FIG[fig].je_grid[k].konturtoene.konturtoene_ab8,
      ok: FIG[fig].je_grid[k].konturtoene.konturtoene_ab8_anzahl >= KONTURTOENE_MIN,
    }));
    const G2 = nimm({
      id: 'G2_konturtoene', groesse: '>= 3 Konturtoene mit je >= 8 Texeln (ohne Requisit)', grenze: KONTURTOENE_MIN,
      ausgesetzt: aus.includes('konturtoene_anzahl'),
      ausnahmen: ausnahmeVermerk(F.grids, G2_AUS), gewertete_grids: kt.map((g) => g.grid),
      min: kt.length ? Math.min(...kt.map((g) => g.ist)) : null,
      je_grid: kt, grids_rot: kt.filter((g) => !g.ok).map((g) => g.grid),
      ok: aus.includes('konturtoene_anzahl') ? null : kt.every((g) => g.ok),
    });

    // (G3) Rim >= 12 % der Kontur (Teil-A-Lesart)
    //      NACHZUG 12.09.: *_decal ausgenommen (B3) — 25-%-Rahmendeckel + nie
    //      geflippt; P11: die Anzeige nennt jetzt das MINIMUM samt Grid-Namen
    //      (geurteilt wurde immer schon auf dem Minimum).
    const G3_AUS = { ohneDecal: true };
    const rimG = gateGrids(F.grids, G3_AUS).filter((k) => FIG[fig].je_grid[k] && FIG[fig].je_grid[k].rim).map((k) => ({
      grid: k, ist: FIG[fig].je_grid[k].rim.rim_teilA_pct,
      rim_texel: FIG[fig].je_grid[k].rim.rim_texel, kontur: FIG[fig].je_grid[k].rim.kontur_texel,
      ok: FIG[fig].je_grid[k].rim.rim_teilA_pct >= RIM_MIN_PCT,
    }));
    const G3 = nimm({
      id: 'G3_rim', groesse: 'Rim >= 12 % der Kontur (|Rimtexel|/|Kontur|, Teil-A-Lesart)', grenze: RIM_MIN_PCT,
      rimtoene: FIG[fig].rimtoene, rim_quelle: FIG[fig].rim_quelle,
      min: rimG.length ? Math.min(...rimG.map((g) => g.ist)) : null,
      min_grid: rimG.length ? rimG.reduce((a, b) => (b.ist < a.ist ? b : a)).grid : null,
      ausnahmen: ausnahmeVermerk(F.grids, G3_AUS), gewertete_grids: rimG.map((g) => g.grid),
      basisgrid_ist: FIG[fig].je_grid[F.basis] ? FIG[fig].je_grid[F.basis].rim.rim_teilA_pct : null,
      je_grid: rimG, grids_rot: rimG.filter((g) => !g.ok).map((g) => g.grid),
      ok: rimG.length ? rimG.every((g) => g.ok) : false,
    });

    // (G4) Halbseiten-dL je Grid (Flip-Neutralitaet E-B5)
    // NACHZUG 12.09.: *_decal (B3) und shield_* (R-B4) ausgenommen; die Grenze
    // bleibt 6,5 L, die ausgenommenen Grids werden weiter GEMESSEN und in
    // Abschnitt (5) mit dem Vermerk AUSGENOMMEN ausgegeben.
    const G4 = nimm({
      id: 'G4_halbseiten_dL', groesse: 'Halbseiten-|dL| je Grid (jedes Gegner-Grid wird gespiegelt)',
      grenze: HALBSEITE_MAX_dL, grenze_m3_skelett: fig === 'Skelett' ? HALBSEITE_MAX_dL_SKELETT : null,
      max: FIG[fig].halbseiten.max_betrag,
      max_alle_grids_informativ: FIG[fig].halbseiten.max_betrag_alle_grids,
      ausnahmen: FIG[fig].halbseiten.ausnahmen,
      gewertete_grids: FIG[fig].halbseiten.gewertete_grids,
      grids_rot: FIG[fig].halbseiten.grids_rot,
      ok: FIG[fig].halbseiten.ok,
    });

    // (G5) Spiegelgleichheit <= 65 % — NACHZUG 12.09. (Punkt 5, Entscheid A2):
    //      GATE-LESART ist jetzt die TON-Lesart (Landkarte C 0.1, Anteil der
    //      OPAKEN Texel mit GLEICHEM Ton am bbox-Spiegelplatz). Die Teil-A-
    //      SILHOUETTEN-Lesart und die E5-Ton-Lesart des Menschen-Werkzeugs
    //      laufen INFORMATIV mit (kein Gate). Die SCHWELLE bleibt 65 %.
    //      Ausgenommen: *_decal (B3) und shield_* (R-B4, Platte).
    const G5_AUS = { ohneDecal: true, ohneShield: true };
    const spG = gateGrids(F.grids, G5_AUS).filter((k) => FIG[fig].je_grid[k]).map((k) => ({
      grid: k, ist: FIG[fig].je_grid[k].spiegel_landkarteC_ton_pct,
      informativ_silhouette_teilA: FIG[fig].je_grid[k].spiegel_teilA_silhouette_pct,
      informativ_e5_ton_bbox: FIG[fig].je_grid[k].spiegel_e5_ton_bbox_pct,
      ok: FIG[fig].je_grid[k].spiegel_landkarteC_ton_pct <= SPIEGEL_MAX_PCT,
    }));
    const spAlle = F.grids.filter((k) => FIG[fig].je_grid[k]).map((k) => ({
      grid: k, ton: FIG[fig].je_grid[k].spiegel_landkarteC_ton_pct,
      silhouette: FIG[fig].je_grid[k].spiegel_teilA_silhouette_pct,
      e5_ton: FIG[fig].je_grid[k].spiegel_e5_ton_bbox_pct,
      ausnahme: ausnahmeG4G5(k),
    }));
    const G5 = nimm({
      id: 'G5_spiegelgleichheit',
      groesse: 'bbox-Spiegelgleichheit <= 65 % — GATE auf der TON-Lesart (Landkarte C 0.1: Anteil der opaken Texel mit GLEICHEM Ton am Spiegelplatz)',
      lesart_gate: 'TON (Landkarte C 0.1)',
      lesart_informativ: 'SILHOUETTE (Teil A 1.2, opaker Spiegelplatz) + E5-TON-bbox (Menschen-Werkzeug) — beide OHNE Gate-Wirkung',
      lesart_wechsel_grund: 'Entscheid A2 12.09.: auf der Silhouetten-Lesart liegen ALLE CH-1-abgenommenen Menschen bei 82,9..89,7 — unerreichbar fuer einen Zweibeiner. Landkarte C 0.1 (Menschen 12,0..43,1 / Gegner 45..84) meinte die Ton-Lesart. Schwelle unveraendert 65 %.',
      grenze: SPIEGEL_MAX_PCT, ausgesetzt: aus.includes('spiegelgleichheit'),
      ausnahmen: ausnahmeVermerk(F.grids, G5_AUS), gewertete_grids: spG.map((g) => g.grid),
      basisgrid_ist: FIG[fig].je_grid[F.basis] ? FIG[fig].je_grid[F.basis].spiegel_landkarteC_ton_pct : null,
      basisgrid_silhouette_informativ: FIG[fig].je_grid[F.basis] ? FIG[fig].je_grid[F.basis].spiegel_teilA_silhouette_pct : null,
      max: spG.length ? Math.max(...spG.map((g) => g.ist)) : null,
      max_silhouette_informativ: spG.length ? Math.max(...spG.map((g) => g.informativ_silhouette_teilA)) : null,
      max_e5_ton_informativ: spG.length ? Math.max(...spG.map((g) => g.informativ_e5_ton_bbox)) : null,
      je_grid: spG, je_grid_alle_lesarten: spAlle,
      grids_rot: spG.filter((g) => !g.ok).map((g) => g.grid),
      ok: aus.includes('spiegelgleichheit') ? null : (spG.length ? spG.every((g) => g.ok) : null),
    });

    // (G6) Solitaer <= 8 % (bereinigt, G-C/E-B8)
    const s = FIG[fig].m6_solitaer;
    const G6 = nimm({
      id: 'G6_solitaer', groesse: 'solitaer_bereinigt_pct (Requisit/Merkmal/Rim abgezogen, Deckel 12/Grid)',
      grenze: SOLITAER_MAX_PCT_GEGNER, ausgesetzt: aus.includes('solitaer'),
      ist: s.solitaer_bereinigt_pct, roh_pct: s.solitaer_pct,
      abzug_gesamt: s.abzug_gesamt, merkmal_deckel_gerissen: s.merkmal_deckel_gerissen,
      je_grid: Object.keys(s.pro_grid).sort().map((k) => ({ grid: k, ist: s.pro_grid[k].solitaer_bereinigt_pct, roh: s.pro_grid[k].solitaer_pct })),
      ok: aus.includes('solitaer') ? null : s.solitaer_bereinigt_pct <= SOLITAER_MAX_PCT_GEGNER,
    });

    // (G7) Materialflaechen >= 40 Texel: >= 3 Stufen, Schritt <= 1,6, kein Ton
    //      > 55 %, Hue-Spanne >= 20 Grad
    // NACHZUG RUNDE 2: shield_side/_up/_down sind auch aus G7 AUSGENOMMEN
    // (Deklaration B5: die Platte ist ein Requisit, keine Materialflaeche).
    // G7 rechnet figurweit ueber das Ton-Histogramm ALLER Grids — beim Schild
    // sind das ausschliesslich shield_*, die Figur faellt damit ganz aus dem
    // Gate. Der Rostpanzer fuehrt shield_* nur als zusatz (nie in m4_material),
    // dort aendert sich nichts.
    const G7_AUS = { ohneShield: true };
    const g7Grids = gateGrids(F.grids, G7_AUS);
    const g7Ausgenommen = g7Grids.length === 0;
    const flaechen = FIG[fig].m4_material.flaechen.filter((fl) => fl.texel >= MATERIALFLAECHE_MIN_TEXEL && !MATERIALFLAECHE_KEIN_MATERIAL.includes(fl.art));
    const flBefund = flaechen.map((fl) => {
      const maxTon = fl.toendetails.length ? Math.max(...fl.toendetails.map((t) => 100 * t.texel / fl.texel)) : 0;
      return {
        name: fl.name, art: fl.art, texel: fl.texel,
        stufen: fl.stufen, stufen_ok: fl.stufen >= MATERIAL_MIN_STUFEN,
        schrittverhaeltnis: fl.schrittverhaeltnis, schritt_ok: fl.schrittverhaeltnis === null ? false : fl.schrittverhaeltnis <= MATERIAL_MAX_SCHRITT,
        groesster_tonanteil_pct: maxTon, tonanteil_ok: maxTon <= MATERIAL_MAX_TONANTEIL,
        hue_spanne_grad: fl.hue_spanne_grad, hue_ok: fl.hue_spanne_grad >= MATERIAL_MIN_HUE,
        // Runde 2: welche der vier Teilpruefungen reissen (fuer die Deklarationsliste)
        kriterien_rot: [
          fl.stufen >= MATERIAL_MIN_STUFEN ? null : 'stufen',
          (fl.schrittverhaeltnis !== null && fl.schrittverhaeltnis <= MATERIAL_MAX_SCHRITT) ? null : 'schritt',
          maxTon <= MATERIAL_MAX_TONANTEIL ? null : 'tonanteil',
          fl.hue_spanne_grad >= MATERIAL_MIN_HUE ? null : 'hue',
        ].filter(Boolean),
        ok: fl.stufen >= MATERIAL_MIN_STUFEN && fl.schrittverhaeltnis !== null && fl.schrittverhaeltnis <= MATERIAL_MAX_SCHRITT
          && maxTon <= MATERIAL_MAX_TONANTEIL && fl.hue_spanne_grad >= MATERIAL_MIN_HUE,
      };
    });
    const G7 = nimm({
      id: 'G7_materialflaechen',
      groesse: 'je Materialflaeche >= ' + MATERIALFLAECHE_MIN_TEXEL + ' Texel: >= 3 Stufen, Schritt <= 1,6, kein Ton > 55 %, Hue-Spanne >= 20 Grad',
      ausnahmen: ausnahmeVermerk(F.grids, G7_AUS),
      ausgenommen_komplett: g7Ausgenommen,
      gewertete_grids: g7Grids,
      flaechen: flBefund, flaechen_rot: flBefund.filter((f) => !f.ok).map((f) => f.name),
      ok: g7Ausgenommen ? null : (flBefund.length ? flBefund.every((f) => f.ok) : false),
    });

    // (G8) Koerper-L im E-B1-Fenster UND in der Wertstufe
    const e = E1G.figuren[fig];
    const G8 = nimm({
      id: 'G8_koerper_L', groesse: 'Koerper-L (E5) im Leitklassen-Fenster UND in der Wertstufe',
      fenster: e.fenster, wertstufe: e.wertstufe, wertstufe_band: e.wertstufe_band,
      ist: e.ist_koerper_L_e5,
      im_fenster: e.ist_im_fenster, delta_fenster: e.delta_bis_fenster,
      in_wertstufe: e.ist_in_wertstufe, delta_wertstufe: e.delta_bis_wertstufe,
      ok: e.wertstufe_band ? (e.ist_im_fenster === true && e.ist_in_wertstufe === true) : e.ist_im_fenster,
    });

    // (G9) Minderheitskriterium E-B2 (Weg / Wasser separat)
    const weg = e.minderheitsklassen.filter((m) => m.klasse === 'Weg');
    const wasser = e.minderheitsklassen.filter((m) => m.klasse === 'Wasser');
    const G9 = nimm({
      id: 'G9_minderheitsklassen',
      groesse: 'E-B2: dL >= 10 ODER dE00 >= 20 ODER (Rim >= 12 % UND dL >= VORHER+15) — Weg und Wasser SEPARAT',
      weg: weg.map((m) => ({ karte: m.karte, art: m.art, dL: m.dL, dE00_flaeche: m.dE00_flaeche, dE00_ganzkoerper: m.dE00_ganzkoerper, rim_pct: m.rim_pct, ok: m.ok })),
      wasser: wasser.map((m) => ({ karte: m.karte, art: m.art, dL: m.dL, dE00_flaeche: m.dE00_flaeche, dE00_ganzkoerper: m.dE00_ganzkoerper, rim_pct: m.rim_pct, ok: m.ok })),
      uebrige_rot: e.minderheitsklassen.filter((m) => !m.ok && m.klasse !== 'Weg' && m.klasse !== 'Wasser').map((m) => m.karte + '/' + m.art),
      rot: e.minderheit_rot,
      deklarationspflichtig: e.minderheit_rot.length > 0,
      ok: e.minderheitsklassen.every((m) => m.ok),
    });

    // (G10) Frame-Diffs: >= IST (Untergrenze) + E-B7 fuer die Lauf-Paare
    const walkPaar = FIG[fig].frame_diffs.find((p) => p.anker_teilA) || null;
    const G10 = nimm({
      id: 'G10_framediff', groesse: 'E-B7: Walk-Paar Silhouetten-Diff >= 8 % UND >= 2 getrennte Zeilenbaender; alle Posenpaare ungleich; Untergrenzen = IST',
      walk_paar: walkPaar ? walkPaar.paar : null,
      walk_silhouette_pct: walkPaar ? walkPaar.silhouetten_diff_pct : null,
      walk_baender: walkPaar ? walkPaar.silhouette_baender_anzahl : null,
      walk_silhouette_ok: walkPaar ? walkPaar.silhouetten_diff_pct >= WALK_SILHOUETTE_MIN_PCT : null,
      walk_baender_ok: walkPaar ? walkPaar.silhouette_baender_anzahl >= WALK_BAENDER_MIN : null,
      paare_gleich: FIG[fig].frame_diffs.filter((p) => p.texel_diff === 0).map((p) => p.paar.join('|')),
      ok: walkPaar
        ? (walkPaar.silhouetten_diff_pct >= WALK_SILHOUETTE_MIN_PCT && walkPaar.silhouette_baender_anzahl >= WALK_BAENDER_MIN
          && FIG[fig].frame_diffs.every((p) => p.texel_diff > 0))
        : FIG[fig].frame_diffs.every((p) => p.texel_diff > 0),
    });

    // (G11) Sperrliste
    const sp = FIG[fig].sperrliste;
    const G11 = nimm({
      id: 'G11_sperrliste', groesse: 'E6-Aequivalent (§1) + E-C3 (x/f) + E-C4 (Menschenrampen, Hund-Zusatz)',
      regeln: sp, rot: sp.filter((r) => !r.ok).map((r) => r.id), ok: sp.every((r) => r.ok),
    });

    // (G12) DECAL-GATES — NACHZUG 12.09., ADDITIV (Punkt 1). Sie ersetzen bei
    //       den *_decal-Grids die vier dort ausgenommenen Figurengates.
    const dc = FIG[fig].decal_befund;
    const G12 = nimm({
      id: 'G12_decal',
      groesse: 'Decal-Gates: Breite = Basisgrid, Hoehe <= min(6, 40 % Basis, Hund 4), Rahmen <= '
        + DECAL_RAHMEN_MAX_PCT + ' % auf dem eigenen Grid, messbar verschieden von *_die',
      lesart: dc.lesart, anzahl: dc.anzahl, decals: dc.zeilen, rot: dc.rot,
      hinweis: dc.anzahl === 0 ? 'kein *_decal-Grid bei dieser Figur (Warden: §8 verbietet eines)' : null,
      ok: dc.ok,
    });

    const gewertet = gates.filter((g) => g.ok !== null);
    LEITG.figuren[fig] = {
      vollfigur: GEGNER_VOLLFIGUR[fig], ausgesetzt: aus,
      gate_ausnahmen_nachzug: {
        G2: G2.ausnahmen, G3: G3.ausnahmen, G4: G4.ausnahmen, G5: G5.ausnahmen,
        hinweis: 'KEINE Schwelle veraendert — nur die Grid-Auswahl (Nachzug 12.09.)',
      },
      G1_schwarz: G1, G2_konturtoene: G2, G3_rim: G3, G4_halbseiten: G4, G5_spiegel: G5,
      G6_solitaer: G6, G7_material: G7, G8_koerper_L: G8, G9_minderheit: G9,
      G10_framediff: G10, G11_sperrliste: G11, G12_decal: G12,
      gates_gesamt: gewertet.length,
      gates_gruen: gewertet.filter((g) => g.ok).length,
      gates_rot: gewertet.filter((g) => !g.ok).map((g) => g.id),
      status: gewertet.every((g) => g.ok) ? 'gruen' : 'ROT',
    };
  }
  // Paar-Gates (Profil) — gelten fuer den Cast, nicht fuer eine Einzelfigur
  LEITG.paargates = {
    P1_profil_ganze_figur: {
      grenze: PROFIL_GANZ_MAX, matrix: PROFIL.matrix_ganze_figur,
      rot: PROFIL.paare_ueber_ziel_ganze_figur,
      ok: PROFIL.matrix_ganze_figur.every((m) => m.ok),
    },
    P2_profil_kopf_schulter: {
      grenze: ZIEL_KS_GATE, familiengrenze: ZIEL_KS_FAMILIENGATE, matrix: PROFIL.matrix_kopf_schulter_gate,
      rot: PROFIL.paare_ueber_ziel_kopf_schulter,
      ok: PROFIL.matrix_kopf_schulter_gate.every((m) => m.ok !== false),
    },
    P3_wertleiter: {
      regel: E1G.wertleiter.regel, abstaende: E1G.wertleiter.abstaende,
      rot: E1G.wertleiter.abstaende.filter((a) => a.ok === false).map((a) => a.unten + '->' + a.oben),
      ok: E1G.wertleiter.abstaende.every((a) => a.ok !== false),
    },
  };
  // ---- DEKLARATIONEN + ZWEITE BILANZ (Runde 2) ---------------------------
  LEITG.deklarationen = [];
  for (const dek of DEKLARATIONEN) {
    const L = LEITG.figuren[dek.figur];
    if (!L) continue;
    const p = deklarationPruefen(dek, L);
    LEITG.deklarationen.push({
      figur: dek.figur, gate: dek.gate,
      ist: p.ist, greift: p.deckt, unnoetig: !!p.unnoetig,
      warnung: p.warnung || null,
      grund: dek.grund, quelle: dek.quelle,
      deklarationsrahmen: {
        flaechen_erlaubt: dek.flaechen_erlaubt || null, kriterien_erlaubt: dek.kriterien_erlaubt || null,
        grids_erlaubt: dek.grids_erlaubt || null, regeln_erlaubt: dek.regeln_erlaubt || null,
        maxton_deckel: dek.maxton_deckel === undefined ? null : dek.maxton_deckel,
        hue_untergrenze: dek.hue_untergrenze === undefined ? null : dek.hue_untergrenze,
      },
    });
  }
  const greift = new Set(LEITG.deklarationen.filter((d) => d.greift).map((d) => d.figur + '/' + d.gate));
  for (const fig of GEGNER_NAMEN) {
    const L = LEITG.figuren[fig];
    const rotOffen = L.gates_rot.filter((g) => !greift.has(fig + '/' + g));
    L.gates_deklariert = L.gates_rot.filter((g) => greift.has(fig + '/' + g));
    L.gates_rot_offen = rotOffen;
    L.gates_gruen_oder_deklariert = L.gates_gruen + L.gates_deklariert.length;
    L.status_mit_deklaration = rotOffen.length === 0 ? 'gruen oder deklariert' : 'ROT';
  }
  LEITG.bilanz2_mit_deklarationen = {
    lesart: 'ZWEITE BILANZ: ein rotes Gate zaehlt mit, wenn Fable es in DEKLARATIONEN mit Grund und Quelle abgenommen hat UND der gemessene Befund den Deklarationsrahmen nicht ueberschreitet. Die Schwellen sind unveraendert; die ERSTE Bilanz bleibt das harte Urteil.',
    figuren_gruen_oder_deklariert: GEGNER_NAMEN.filter((f) => LEITG.figuren[f].status_mit_deklaration === 'gruen oder deklariert').length,
    figuren_gesamt: GEGNER_NAMEN.length,
    gates_gruen_oder_deklariert: GEGNER_NAMEN.reduce((a, f) => a + LEITG.figuren[f].gates_gruen_oder_deklariert, 0),
    gates_gesamt: GEGNER_NAMEN.reduce((a, f) => a + LEITG.figuren[f].gates_gesamt, 0),
    deklarationen_greifen: LEITG.deklarationen.filter((d) => d.greift).map((d) => d.figur + '/' + d.gate),
    deklarationen_ohne_wirkung: LEITG.deklarationen.filter((d) => d.unnoetig).map((d) => d.figur + '/' + d.gate),
    deklarationen_mit_warnung: LEITG.deklarationen.filter((d) => d.warnung).map((d) => d.figur + '/' + d.gate + ': ' + d.warnung),
    offen_rot: GEGNER_NAMEN.flatMap((f) => LEITG.figuren[f].gates_rot_offen.map((g) => f + '/' + g)),
  };
  LEITG.bilanz = {
    figuren_gruen: GEGNER_NAMEN.filter((f) => LEITG.figuren[f].status === 'gruen').length,
    figuren_gesamt: GEGNER_NAMEN.length,
    gates_gruen: GEGNER_NAMEN.reduce((a, f) => a + LEITG.figuren[f].gates_gruen, 0),
    gates_gesamt: GEGNER_NAMEN.reduce((a, f) => a + LEITG.figuren[f].gates_gesamt, 0),
    rot: GEGNER_NAMEN.flatMap((f) => LEITG.figuren[f].gates_rot.map((g) => f + '/' + g)),
    paargates_rot: Object.keys(LEITG.paargates).filter((k) => !LEITG.paargates[k].ok),
  };

  // ---- ANKER-KONTROLLE (Positivkontrolle) --------------------------------
  //      Die Gegner-Anker beschreiben den BESTAND (HEAD 3853dda war der Stand
  //      der Landkarte; die Gegner-Grids sind seither unveraendert). Sie
  //      laufen deshalb — anders als die Menschen-Anker — in JEDEM Modus mit;
  //      im nachher-Stand sind sie nach dem Umbau per Konstruktion rot und
  //      werden dann als "erwartet rot" ausgewiesen.
  const KONTR = {
    modus: stand,
    hinweis: 'Positivkontrolle: der Stand OHNE neue Kunst MUSS die Anker aus Teil A 1.1/1.2/7.2/7.3 und Teil C 0.3 reproduzieren. Ist hier etwas rot, misst das WERKZEUG falsch (nicht die Kunst).',
    koerper_L: [], grid: [], framediff: [], profil: [], profil_zusatz: [], halbseite: [],
    referenz_solitaer_landkarteC: [], bilanz: {},
  };
  for (const a of GEGNER_ANKER_KOERPER_L) {
    const ist = FIG[a.figur] ? FIG[a.figur].koerper.koerper_L_e5 : null;
    KONTR.koerper_L.push({ ...a, ist, abweichung: ist === null ? null : ist - a.soll, ok: ist !== null && Math.abs(ist - a.soll) <= a.toleranz });
  }
  const gridVon = (key) => {
    for (const f of GEGNER_NAMEN) if (FIG[f].je_grid[key]) return FIG[f].je_grid[key];
    return null;
  };
  for (const a of GEGNER_ANKER_GRID) {
    const g = gridVon(a.grid);
    const pruef = (name, soll, ist) => (soll === null || soll === undefined) ? null : {
      groesse: name, soll, ist, abweichung: ist === null ? null : ist - soll,
      ok: ist !== null && Math.abs(ist - soll) <= GEGNER_ANKER_GRID_TOLERANZ,
    };
    const zeilen = [
      pruef('umriss_geom_pct', a.umriss, g ? g.umriss_geom_pct : null),
      pruef('schwarz_kn_pct', a.schwarz, g ? g.schwarz_kn_pct : null),
      pruef('rim_teilA_pct', a.rim, g && g.rim ? g.rim.rim_teilA_pct : null),
      pruef('spiegel_teilA_silhouette_pct', a.spiegel, g ? g.spiegel_teilA_silhouette_pct : null),
      pruef('rahmen_pct', a.rahmen, g ? g.rahmen_pct : null),
    ].filter(Boolean);
    KONTR.grid.push({ grid: a.grid, quelle: 'Teil A 1.2', gefunden: !!g, zeilen, ok: zeilen.every((z) => z.ok) });
  }
  for (const a of GEGNER_ANKER_FRAMEDIFF) {
    const d = framediff(a.a, a.b);
    const opakA = SPRITES[a.a] ? opakVon(SPRITES[a.a]) : null;
    KONTR.framediff.push({
      id: a.id, quelle: 'Teil A 7.2',
      soll_texel: a.texel, ist_texel: d.diff,
      soll_silhouette: a.silhouette, ist_silhouette: d.silhouetten_diff ?? null,
      soll_texel_pct: a.texel_pct, ist_texel_pct: opakA ? 100 * d.diff / opakA : null,
      soll_silhouette_pct: a.silhouette_pct, ist_silhouette_pct: opakA ? 100 * (d.silhouetten_diff ?? 0) / opakA : null,
      ok: d.diff === a.texel && (d.silhouetten_diff ?? null) === a.silhouette,
    });
  }
  const profilAnkerPruefen = (liste, ziel) => {
    for (const a of liste) {
      const p = a.zone === 'ganze_figur' ? PROF_GANZ : PROF_KS_ANKER;
      const ist = (p[a.paar[0]] && p[a.paar[1]]) ? profilAehnlichkeit(p[a.paar[0]], p[a.paar[1]]) : null;
      ziel.push({ ...a, ist, abweichung: ist === null ? null : ist - a.soll, ok: ist !== null && Math.abs(ist - a.soll) <= 0.06 });
    }
  };
  profilAnkerPruefen(GEGNER_ANKER_PROFIL, KONTR.profil);
  profilAnkerPruefen(GEGNER_ANKER_PROFIL_ZUSATZ, KONTR.profil_zusatz);
  for (const a of GEGNER_ANKER_HALBSEITE) {
    const g = SPRITES[a.grid] ? seitenDL(SPRITES[a.grid], false) : null;
    KONTR.halbseite.push({
      grid: a.grid, quelle: a.quelle, soll_dL: a.dL, ist_dL: g ? g.dL : null,
      soll_texel: a.texel, ist_texel: SPRITES[a.grid] ? opakVon(SPRITES[a.grid]) : null,
      abweichung: g ? g.dL - a.dL : null,
      ok: g !== null && Math.abs(g.dL - a.dL) <= GEGNER_ANKER_HALBSEITE_TOLERANZ && opakVon(SPRITES[a.grid]) === a.texel,
    });
  }
  for (const r of GEGNER_REFERENZ_SOLITAER_C) {
    const g = gridVon(r.grid);
    const ist = g && g.solitaer ? g.solitaer.solitaer_pct : null;
    KONTR.referenz_solitaer_landkarteC.push({
      grid: r.grid, quelle: 'Landkarte C H7 (Kontroll-Referenz, KEIN Auftrags-Anker)',
      soll: r.soll, ist, abweichung: ist === null ? null : ist - r.soll,
      ok: ist !== null && Math.abs(ist - r.soll) <= 0.06,
    });
  }
  const zaehl = (l) => ({ gesamt: l.length, gruen: l.filter((x) => x.ok).length, rot: l.filter((x) => !x.ok) });
  KONTR.bilanz = {
    koerper_L: zaehl(KONTR.koerper_L).gesamt + ' / gruen ' + zaehl(KONTR.koerper_L).gruen,
    koerper_L_rot: KONTR.koerper_L.filter((x) => !x.ok).map((x) => x.figur),
    grid_gesamt: KONTR.grid.length, grid_gruen: KONTR.grid.filter((x) => x.ok).length,
    grid_rot: KONTR.grid.filter((x) => !x.ok).map((x) => x.grid),
    framediff_gesamt: KONTR.framediff.length, framediff_gruen: KONTR.framediff.filter((x) => x.ok).length,
    framediff_rot: KONTR.framediff.filter((x) => !x.ok).map((x) => x.id),
    profil_gesamt: KONTR.profil.length, profil_gruen: KONTR.profil.filter((x) => x.ok).length,
    profil_rot: KONTR.profil.filter((x) => !x.ok).map((x) => x.zone + ' ' + x.paar.join('/')),
    profil_zusatz_gruen: KONTR.profil_zusatz.filter((x) => x.ok).length, profil_zusatz_gesamt: KONTR.profil_zusatz.length,
    halbseite_gesamt: KONTR.halbseite.length, halbseite_gruen: KONTR.halbseite.filter((x) => x.ok).length,
    halbseite_rot: KONTR.halbseite.filter((x) => !x.ok).map((x) => x.grid),
    referenz_solitaer_gruen: KONTR.referenz_solitaer_landkarteC.filter((x) => x.ok).length,
    referenz_solitaer_gesamt: KONTR.referenz_solitaer_landkarteC.length,
    ALLE_ANKER_GRUEN: KONTR.koerper_L.every((x) => x.ok) && KONTR.grid.every((x) => x.ok)
      && KONTR.framediff.every((x) => x.ok) && KONTR.profil.every((x) => x.ok) && KONTR.halbseite.every((x) => x.ok),
  };

  // Minderheits-dL dieses Standes als Referenz fuer den naechsten Stand
  // (E-B2 dritter Pfad: "dL >= VORHER + 15").
  const minderheitKarte = {};
  for (const fig of GEGNER_NAMEN) {
    minderheitKarte[fig] = {};
    for (const m of E1G.figuren[fig].minderheitsklassen) minderheitKarte[fig][m.karte + '|' + m.art] = m.dL;
  }

  return {
    stand,
    quelle: {
      zeiger: quelle.zeiger, commit: quelle.commit,
      sprites_sha256: sha256(quelle.quelltext),
      sprites_bytes: Buffer.byteLength(quelle.quelltext, 'utf8'),
      grids_gesamt: Object.keys(quelle.sprites).length,
      gegner_grids: GEGNER_NAMEN.reduce((a, f) => a + FIGUREN[f].grids.length, 0),
    },
    FIG, PROFIL, E1G, LEITG, KONTR, ZIELE, TONHIST, RIM,
    minderheit_dL: minderheitKarte,
  };
}

// ---------------------------------------------------------------------------
// G11  AUSGABE GEGNER
// ---------------------------------------------------------------------------
const ERG_G = {};
let minderheitRef = null;
for (const st of STAENDE) {
  ERG_G[st] = laufStandGegner(st, st === 'vorher' ? VORHER_QUELLE : NACHHER_QUELLE, minderheitRef);
  if (st === 'vorher') minderheitRef = ERG_G[st].minderheit_dL;
}

const KOPF_G = {
  werkzeug: 'GP7CH2 P0.a — Gegner-Erweiterung von figuren_messung.mjs (V10)',
  spec: 'design/SPEC_GP7CH2.md Rev 1 + REV 2 (E-A..E-D)',
  review: 'design/GP7CH2_SPEC_REVIEW.md (Fix-Formulierungen beider Linsen)',
  landkarte: 'GP7CH2_LANDKARTE.md V1-V13 + Teil A (Bestand/Engine) + Teil C (Zielbild)',
  modus: MODUS, staende: STAENDE,
  material_tabelle_herkunft: MATERIAL_GEGNER_HERKUNFT,
  material_tabelle_stand: MATERIAL_GEGNER.stand,
  familien: GEGNER_FAMILIE,
  wertleiter: WERTLEITER,
  rim_kandidaten_gegner: RIM_FALLBACK_KANDIDATEN_GEGNER,
  requisiten: REQUISITEN_GEGNER,
  kopf_schulter_zeilen: KS_ZEILEN,
  sehnen_selbsttest: SEHNEN_SELBSTTEST,
  deklarationen_rahmen: DEKLARATIONEN.map((d) => ({
    figur: d.figur, gate: d.gate, grund: d.grund, quelle: d.quelle,
    flaechen_erlaubt: d.flaechen_erlaubt || null, kriterien_erlaubt: d.kriterien_erlaubt || null,
    grids_erlaubt: d.grids_erlaubt || null, regeln_erlaubt: d.regeln_erlaubt || null,
    maxton_deckel: d.maxton_deckel === undefined ? null : d.maxton_deckel,
    hue_untergrenze: d.hue_untergrenze === undefined ? null : d.hue_untergrenze,
  })),
  determinismus: 'ohne Zeitstempel, Schluessel sortiert, Zahlen auf 4 Stellen gerundet, LCG-Seed ' + ZIEL_SEED + ' fuer die Zielprofil-Suche',
  formeln: {
    KONTUR: 'opake Texel mit >= 1 transparentem 4er-Nachbarn ODER auf der Rahmenkante (E5)',
    UMRISS_GEOM: '|Kontur| / |opak| je Grid (Teil A 1.2 Spalte "Umriss % (geom.)")',
    SCHWARZ: '|{k,n}| / |opak| je Grid; Gate <= 25 % (Grufthund <= 30, deklariert)',
    RAHMEN: '|opak| / (Breite*Hoehe) je Grid (Teil A 1.2 Spalte "Rahmen %")',
    KONTURTOENE: 'Toene AUF der Kontur mit >= 8 Texeln, ohne Requisitentoene; Gate >= 3',
    SPIEGEL_TEILA: 'Anteil der opaken Texel, deren an der BBOX-Mittelachse gespiegelter Platz EBENFALLS OPAK ist. DAS ist die Lesart von Teil A 1.2 (95,5 / 86,7 / 92,8 / 92,1 / 94,7). SEIT DEM NACHZUG 12.09. NUR NOCH INFORMATIV (Entscheid A2: alle CH-1-abgenommenen Menschen liegen hier bei 82,9..89,7, ein Zweibeiner erreicht 65 % nicht).',
    SPIEGEL_LANDKARTE_C: 'Anteil der opaken Texel mit GLEICHEM TON am Spiegelplatz. Das ist Landkarte C 0.1 "Ton-Spiegelgleichheit" (83,6 / 45,3 / 58,6 / 69,7 / 54,5) und SEIT DEM NACHZUG 12.09. die G5-GATE-LESART (<= 65 %, Schwelle unveraendert). Anker: Zeichner-A-Report "Hund 30,6" = SPIEG-C von hound_0.',
    SPIEGEL_E5_TON: 'E5-Ton-Lesart des Menschen-Werkzeugs (spiegel(g,"bbox")): Paare, bei denen mindestens einer opak ist, Tonvergleich. OHNE Gate-Wirkung, hier nur zum Vergleich mit dem CH-1-Cast.',
    RIM_TEILA: '|Rimtexel| / |Kontur| je Grid. DAS ist die Lesart von Teil A 1.2 (Ghul 12,9 = 9/70, Warden 12,5 = 13/104) und die Gate-Lesart (>= 12 %).',
    RIM_E5: 'Rimtexel AUF der Kontur oder 1 Texel innerhalb, / |Kontur| (E5-Lesart des Menschen-Werkzeugs). OHNE Gate-Wirkung.',
    KOERPER_L: 'Mittel von L601 ueber opake Texel, die WEDER Kontur NOCH Rim-Ton sind, ueber ALLE Grids der Figur (E5). Das ist die GATE-Zahl.',
    INNENRAUM_OHNE_KN: 'dieselbe Texelmenge, zusaetzlich ohne k/n. Das ist die ZEICHNER-Zahl (E-B1 / Review M2: "der Zeichner zielt auf diese Zahl, nicht auf die Gate-Zahl").',
    INNENRAUM_ZIELZAHL: 'M = (L_ziel * n_innen - Summe L der Innen-k/n) / n_innen_ohne_kn — Umkehrung der Koerper-L-Formel bei unveraenderter Innen-Schwarzflaeche.',
    HALBSEITE: 'Mittel L601 links der Grid-Mittelachse minus rechts, ueber ALLE opaken Texel (Umriss und Rim eingeschlossen); Achsentexel zaehlen nicht. Gate |dL| <= 6,5 L je GRID (E-B5), Skelett zusaetzlich M3-hart <= 8,2 L (Teil A 7.3).',
    PROFIL: '100*(1 - Sum|a_i-b_i| / Sum max(a_i,b_i)) ueber zeilenindizierte Breitenprofile, FUSSBUENDIG und mit ROHZEILEN (Teil C 0.3). Ganze Figur <= 60 je Paar.',
    KOPF_SCHULTER: 'dieselbe Formel auf die obersten 6 BELEGTEN Zeilen (Grufthund 3, E-B3/M8). Gate <= 65 je Paar, <= 55 in einer Familie, Warden-Paare ausgenommen.',
    FRAMEDIFF: 'Texel-Diff und Silhouetten-Diff zweier Grids (unterschiedliche Masse mit "." aufgefuellt); Prozent auf |opak| des ERSTEN Grids (so entstehen Teil A 7.2s 9,0 / 12,3 / 28,8 / 18,0 / 15,0 %).',
    ZEILENBAENDER: 'maximale Laeufe benachbarter Zeilen mit mindestens einer Silhouettenaenderung (E-B7: >= 2 getrennte Baender; heute Fuss-only).',
    SOLITAER: 'opake Nicht-Umriss-Texel ohne gleichfarbigen 4er-Nachbarn, in Prozent der Nicht-Umriss-Texel. E-B8: eine 1-px-DIAGONALE hat keinen 4er-Nachbarn und zaehlt damit als Solitaer — die Sehnen-Regel ist in dieser Formel bereits scharf.',
    GATE_AUSNAHMEN: 'NACHZUG 12.09.: *_decal ist ausgenommen von G2/G3/G4/G5 (ausgenommen: *_decal (R-B3/B3)), shield_side/_up/_down von G4/G5 (ausgenommen: shield_* (R-B4)). KEINE Schwelle wurde veraendert; G1 Schwarz und G6 Solitaer gelten fuer Decals weiter.',
    DECAL_GATES: 'G12 (ADDITIV): Breite = Basisgrid; Hoehe <= min(6, floor(0,4*Basishoehe), Hund 4); Rahmen-% <= 25 auf dem EIGENEN Grid; messbar verschieden von *_die (Texel-Diff >= 30 % von |opak(*_die)| ODER >= 2 Zeilen flacher ODER Wert-L um >= 20 tiefer). RUNDE 2: zusaetzlich Rim-Anteil <= 15 % der opaken Decal-Texel UND >= 1 Ton mit >= 4 Texeln als BODENKANTE (k/n oder dunkelster Materialton der Figur, in der untersten belegten Zeile ODER auf der Kontur-Unterseite). Quelle E-A4 / R-A4 / E-B9 + V-SPEC B1/M4.',
    DEKLARATIONEN: 'RUNDE 2: eine Deklaration ist KEINE Schwellenaenderung. Das Gate-Urteil bleibt rot (erste Bilanz); die ZWEITE Bilanz zaehlt ein rotes Gate als "gruen ODER deklariert", wenn Fable es mit Grund und Quelle abgenommen hat UND der gemessene Befund den Deklarationsrahmen (erlaubte Flaechen / Kriterien / Grids / Regeln, MAXTON-Deckel, HUE-Untergrenze) nicht ueberschreitet. Sonst Warnzeile und weiter rot. Abschnitt (14).',
    G7_AUSNAHME_SHIELD: 'RUNDE 2: shield_side/_up/_down sind auch aus G7 ausgenommen (Deklaration B5: die Platte ist ein Requisit). G7 rechnet figurweit — beim Schild bestehen ALLE Grids aus shield_*, die Figur faellt damit ganz aus dem Gate (ok = null). Der Rostpanzer fuehrt shield_* nur als zusatz und ist nicht betroffen.',
    ANKER_MATERIALTABELLE: 'RUNDE 2 (V-TESTS R4): die Vorher-Anker sind gegen gegner_material_IST.json geeicht. Mit einer NACHHER-Tabelle sind Abweichungen von rund 1 L bei Koerper-L und bei den Rim-Prozenten ERWARTET (andere Rim-Toene -> andere Rim-Abzuege), kein Werkzeugfehler.',
    dL: 'Koerper-L minus Kachel-L601 (vorzeichenbehaftet); Fenster = [max(L der Leitklasse)+25, min(L)+90].',
    dE00: 'CIEDE2000 zwischen der Mittelfarbe der dominanten Materialflaeche (G-N) und der Kachel-Mittelfarbe; der Ganzkoerperwert steht daneben.',
    LEITKLASSE: 'Bodenklasse mit >= 80 % der BEGEHBAREN Zellen einer Karte, gezaehlt auf dem LEGENDEN-Kunstschluessel (def.art / def.anim[0]). Variantenlesart als Zweitlesart ohne Gate-Wirkung.',
  },
};

const DATEIEN_G = [];
function schreibeG(name, obj) { DATEIEN_G.push(schreibe(name, obj)); }
for (const st of STAENDE) {
  const E = ERG_G[st];
  schreibeG(`gegner_messung_${st}.json`, { kopf: { ...KOPF_G, stand: st, quelle: E.quelle }, figuren: E.FIG, profil: E.PROFIL, ton_histogramme: E.TONHIST, rim: E.RIM });
  schreibeG(`gegner_e1fenster_${st}.json`, { kopf: { ...KOPF_G, stand: st, quelle: E.quelle }, e1: E.E1G });
  schreibeG(`gegner_leitplanken_${st}.json`, { kopf: { ...KOPF_G, stand: st, quelle: E.quelle }, leitplanken: E.LEITG });
  schreibeG(`gegner_kontrolle_${st}.json`, { kopf: { ...KOPF_G, stand: st, quelle: E.quelle }, kontrolle: E.KONTR });
  schreibeG(`gegner_ziele_${st}.json`, { kopf: { ...KOPF_G, stand: st, quelle: E.quelle }, ziel_kopf_schulter: E.ZIELE, innenraum_zielzahlen: Object.fromEntries(GEGNER_NAMEN.map((f) => [f, E.E1G.figuren[f].innenraum_zielzahl])) });
}
schreibeG('gegner_material_IST.json', MATERIAL_GEGNER_IST);

let VERGLEICH_G = null;
if (MODUS === 'beides') {
  const V = ERG_G.vorher, N = ERG_G.nachher;
  const zeilen = [];
  const push = (figur, gate, soll, v, n, okv, okn, einheit) => zeilen.push({
    figur, gate, soll, vorher: v, nachher: n,
    delta: (typeof v === 'number' && typeof n === 'number') ? n - v : null,
    einheit, vorher_ok: okv, nachher_ok: okn,
    verschlechtert: okv === true && okn === false,
  });
  for (const f of GEGNER_NAMEN) {
    const lv = V.LEITG.figuren[f], ln = N.LEITG.figuren[f];
    push(f, 'G1 Schwarz k+n max', '<= ' + SCHWARZ_MAX_PCT[f] + ' %', lv.G1_schwarz.max, ln.G1_schwarz.max, lv.G1_schwarz.ok, ln.G1_schwarz.ok, '%');
    push(f, 'G2 Konturtoene min', '>= ' + KONTURTOENE_MIN, lv.G2_konturtoene.min, ln.G2_konturtoene.min, lv.G2_konturtoene.ok, ln.G2_konturtoene.ok, 'Toene');
    // P11: Anzeige auf das MINIMUM (das Urteil lief immer schon darauf) + Grid-Name
    push(f, 'G3 Rim min je Grid', '>= ' + RIM_MIN_PCT + ' %', lv.G3_rim.min, ln.G3_rim.min, lv.G3_rim.ok, ln.G3_rim.ok, '%');
    push(f, 'G3 min-Grid (P11)', 'Name des Minimums', lv.G3_rim.min_grid, ln.G3_rim.min_grid, null, null, '--');
    push(f, 'G4 Halbseiten |dL| max', '<= ' + HALBSEITE_MAX_dL + ' L', lv.G4_halbseiten.max, ln.G4_halbseiten.max, lv.G4_halbseiten.ok, ln.G4_halbseiten.ok, 'L601');
    push(f, 'G5 Spiegel TON max', '<= ' + SPIEGEL_MAX_PCT + ' %', lv.G5_spiegel.max, ln.G5_spiegel.max, lv.G5_spiegel.ok, ln.G5_spiegel.ok, '%');
    push(f, 'G5 Silhouette (informativ)', 'kein Gate', lv.G5_spiegel.max_silhouette_informativ, ln.G5_spiegel.max_silhouette_informativ, null, null, '%');
    push(f, 'G6 Solitaer bereinigt', '<= ' + SOLITAER_MAX_PCT_GEGNER + ' %', lv.G6_solitaer.ist, ln.G6_solitaer.ist, lv.G6_solitaer.ok, ln.G6_solitaer.ok, '%');
    push(f, 'G8 Koerper-L (E5)', 'Fenster + Wertstufe', lv.G8_koerper_L.ist, ln.G8_koerper_L.ist, lv.G8_koerper_L.ok, ln.G8_koerper_L.ok, 'L601');
    push(f, 'G12 Decal-Gates rot', 'Masse + Kontrast', lv.G12_decal.rot.length, ln.G12_decal.rot.length, lv.G12_decal.ok, ln.G12_decal.ok, 'Decals');
    push(f, 'Z Innenraum ohne k/n', 'Zeichner-Zielzahl', V.FIG[f].koerper.innenraum.innen_ohne_kn_L, N.FIG[f].koerper.innenraum.innen_ohne_kn_L, null, null, 'L601');
  }
  VERGLEICH_G = {
    kopf: KOPF_G, quelle_vorher: V.quelle, quelle_nachher: N.quelle,
    kunst_unveraendert: V.quelle.sprites_sha256 === N.quelle.sprites_sha256,
    zeilen, verschlechterungen: zeilen.filter((z) => z.verschlechtert).map((z) => z.figur + ' / ' + z.gate),
    bilanz: { vorher: V.LEITG.bilanz, nachher: N.LEITG.bilanz },
  };
  schreibeG('gegner_vergleich.json', VERGLEICH_G);
}

// ---------------------------------------------------------------------------
// G12  TEXTBERICHT GEGNER  (eigene Datei, damit figuren_messung_<modus>.log
//      byte-gleich bleibt)
// ---------------------------------------------------------------------------
const ZG = [];
const pg = (s = '') => ZG.push(s);

pg('================================================================================');
pg('GP7-CH-2  P0.a  MESSWERKZEUG GEGNER  —  ROHDATEN');
pg('Modus: --' + MODUS + '   Staende: ' + STAENDE.join(' + '));
pg('Spec: design/SPEC_GP7CH2.md Rev 1 + REV 2 (E-A..E-D)   Review: design/GP7CH2_SPEC_REVIEW.md');
pg('================================================================================');
pg('');
pg('--- (0) FORMELN UND LESARTEN (jede Gate-Zahl haengt an genau einer Formel)');
for (const k of Object.keys(KOPF_G.formeln)) {
  const t = KOPF_G.formeln[k];
  pg('  ' + k.padEnd(22) + t.replace(/\s+/g, ' ').slice(0, 150));
  if (t.length > 150) pg(' '.repeat(24) + t.replace(/\s+/g, ' ').slice(150, 310));
  if (t.length > 310) pg(' '.repeat(24) + t.replace(/\s+/g, ' ').slice(310));
}
pg('');
pg('--- (0a) SELBSTTEST SEHNEN-REGEL E-B8 (1-px-Diagonalen zaehlen als Solitaer)');
pg('    FALL                                                              ERWARTET (sol/diag/einzel)   IST          URTEIL');
for (const t of SEHNEN_SELBSTTEST) {
  pg('    ' + t.fall.slice(0, 62).padEnd(64)
    + (t.erwartet.solitaer + '/' + t.erwartet.diag + '/' + t.erwartet.einzel).padStart(18)
    + (t.ist.solitaer + '/' + t.ist.diag + '/' + t.ist.einzel).padStart(13)
    + (t.ok ? '      gruen' : '      ROT'));
}
pg('    Selbsttest: ' + SEHNEN_SELBSTTEST.filter((t) => t.ok).length + '/' + SEHNEN_SELBSTTEST.length + ' gruen');
pg('');
pg('--- (0b) FIGUREN, FAMILIEN, WERTSTUFEN, GRIDS');
pg('FIGUR        FAMILIE            STUFE   BAND        GRIDS  BASIS         VOLLFIGUR  RIMTOENE  RIM-QUELLE');
for (const f of GEGNER_NAMEN) {
  const E = ERG_G[STAENDE[0]];
  const x = E.FIG[f];
  pg(f.padEnd(13) + String(x.familie).padEnd(19) + String(x.wertstufe || '--').padEnd(8)
    + (x.wertstufe_band ? (x.wertstufe_band[0] + '..' + x.wertstufe_band[1]) : '--').padEnd(12)
    + String(x.grids_anzahl).padStart(5) + '  ' + x.basisgrid.padEnd(14)
    + (x.vollfigur ? 'ja       ' : 'nein     ') + ("'" + x.rimtoene.join('') + "'").padEnd(10) + x.rim_quelle);
}
pg('');
pg('    Zusatzgrids Rostpanzer (Schild-Overlay, KEIN Koerpergrid): '
  + (ERG_G[STAENDE[0]].FIG.Rostpanzer.zusatzgrids.join(', ') || '--'));
pg('    Warden-Ausnahmeliste (E-C5, ausgesetzt): ' + WARDEN_AUSGESETZT.join(', '));

for (const st of STAENDE) {
  const E = ERG_G[st];
  pg('');
  pg('################################################################################');
  pg('# STAND: ' + st.toUpperCase() + '   (' + E.quelle.zeiger + ')');
  pg('#   sha256 sprites_figuren.js: ' + E.quelle.sprites_sha256);
  pg('#   SPRITES-Schluessel gesamt ' + E.quelle.grids_gesamt + ', davon Gegner ' + E.quelle.gegner_grids);
  pg('################################################################################');

  // ---------------- (1) GRID-TABELLE ----------------
  pg('');
  pg('--- (1) GRUNDMASSE JE GRID  (Teil A 1.1/1.2 reproduziert)');
  pg('    SPIEGEL-LESARTEN: SPIEG-C = G5-GATE (Ton, Landkarte C 0.1, <= ' + SPIEGEL_MAX_PCT + ' %)   |   SPIEG-A (Silhouette Teil A 1.2) und SPIEG-E5 (Ton-bbox Menschen-Werkzeug) INFORMATIV, kein Gate   [Nachzug 12.09., Entscheid A2]');
  pg('GRID              W x H   OPAK  RAHMEN%  KONTUR  UMRISS%  SCHWARZ%   SPIEG-A  SPIEG-C  SPIEG-E5   RIM-A%  RIM-E5%  KONT>=8  SOLIT%');
  for (const f of GEGNER_NAMEN) {
    for (const key of ERG_G[st].FIG[f].grids) {
      const g = E.FIG[f].je_grid[key]; if (!g) continue;
      pg(key.padEnd(18) + (g.breite + 'x' + g.hoehe).padEnd(7) + String(g.opak).padStart(5)
        + n1(g.rahmen_pct).padStart(8) + String(g.kontur_texel).padStart(7) + n1(g.umriss_geom_pct).padStart(8)
        + n1(g.schwarz_kn_pct).padStart(10) + n1(g.spiegel_teilA_silhouette_pct).padStart(10)
        + n1(g.spiegel_landkarteC_ton_pct).padStart(9) + n1(g.spiegel_e5_ton_bbox_pct).padStart(9)
        + n1(g.rim ? g.rim.rim_teilA_pct : null).padStart(9) + n1(g.rim ? g.rim.rim_e5_pct : null).padStart(9)
        + String(g.konturtoene.konturtoene_ab8_anzahl).padStart(8)
        + n1(g.solitaer ? g.solitaer.solitaer_pct : null).padStart(8));
    }
  }

  // ---------------- (2) KOERPER-L + INNENRAUM ----------------
  pg('');
  pg('--- (2) KOERPER-L (E5, GATE) UND INNENRAUM-RAMPENMITTEL OHNE k/n (ZEICHNER-ZAHL)');
  pg('FIGUR         KOERPER-L   TEXEL   INNEN  INNEN-kn  OHNE-kn  INNEN-L   C*ab    HUE   BEZUGSFLAECHE (dE00)');
  for (const f of GEGNER_NAMEN) {
    const k = E.FIG[f].koerper, i = k.innenraum;
    pg(f.padEnd(13) + n2(k.koerper_L_e5).padStart(10) + String(k.koerper_L_e5_texel).padStart(8)
      + String(i.innen_texel_gesamt).padStart(8) + String(i.innen_kn_texel).padStart(10)
      + String(i.innen_ohne_kn_texel).padStart(9) + n2(i.innen_ohne_kn_L).padStart(9)
      + n1(k.koerper_mittel_Cab).padStart(7) + n1(k.koerper_mittel_hue).padStart(7)
      + '   ' + (k.de00_bezugsflaeche.name || k.de00_bezugsflaeche.flaeche_quelle));
  }

  // ---------------- (3) WIRKORTE + LEITKLASSEN ----------------
  pg('');
  pg('--- (3) LEITKLASSEN DER VIER KAMPFKARTEN (E-B1, Legendenlesart = Gate-Lesart)');
  pg('KARTE            BEGEHBAR  LEITKLASSE     ANTEIL%   GROESSTER EINZELSCHLUESSEL   L-SPANNE        FENSTER          FENSTER (Variantenlesart)');
  for (const karte of KAMPFKARTEN) {
    const kz = E.E1G.karten[karte];
    pg(karte.padEnd(16) + String(kz.begehbare_zellen).padStart(9) + '  ' + String(kz.leitklasse).padEnd(15)
      + n2(kz.leitklasse_anteil_pct).padStart(8) + '   '
      + (kz.leitklasse_groesster_einzelschluessel + ' ' + n2(kz.leitklasse_groesster_einzelschluessel_pct) + ' %').padEnd(28)
      + (n1(kz.leitklasse_L[0]) + '..' + n1(kz.leitklasse_L[1])).padEnd(15)
      + (n1(kz.leitklasse_fenster[0]) + '..' + n1(kz.leitklasse_fenster[1])).padEnd(17)
      + (kz.leitklasse_fenster_variantenlesart ? n1(kz.leitklasse_fenster_variantenlesart[0]) + '..' + n1(kz.leitklasse_fenster_variantenlesart[1]) : '--'));
  }
  pg('');
  pg('    MINDERHEITSKLASSEN je Karte (alles unter 80 %):');
  for (const karte of KAMPFKARTEN) {
    const kz = E.E1G.karten[karte];
    for (const mk of kz.minderheitsklassen) {
      pg('      ' + karte.padEnd(16) + mk.klasse.padEnd(16) + String(mk.zellen).padStart(5) + ' Zellen  '
        + n2(mk.anteil_pct).padStart(6) + ' %   L ' + n1(mk.L_min) + '..' + n1(mk.L_max)
        + '   [' + mk.kacheln.map((c) => c.art).join(', ') + ']');
    }
  }
  pg('');
  pg('--- (3b) WIRKORTE JE GEGNER (skeletonSpawns / ghoulSpawns / enemySpawns + Boss-Adds)');
  pg('FIGUR         SPAWNS  ELITE  KARTEN');
  for (const f of GEGNER_NAMEN) {
    const w = E.E1G.figuren[f].spawns;
    const det = w.karten_liste.map((k) => k + ' ' + w.karten[k].spawns + (w.karten[k].elite ? '(' + w.karten[k].elite + 'E)' : '') + (w.karten[k].adds_anker ? '+' + w.karten[k].adds_anker + ' Adds' : '')).join('  |  ');
    pg(f.padEnd(13) + String(w.gesamt).padStart(6) + String(w.elite).padStart(7) + '  ' + det);
  }
  pg('');
  pg('--- (3c) E1-FENSTER + WERTSTUFE JE GEGNER');
  pg('FIGUR         FENSTER          BREITE   IST-L    IM FENSTER  DELTA   WERTSTUFE  BAND        IN STUFE  DELTA');
  for (const f of GEGNER_NAMEN) {
    const e = E.E1G.figuren[f];
    pg(f.padEnd(13) + (e.fenster ? n1(e.fenster[0]) + '..' + n1(e.fenster[1]) : '--').padEnd(17)
      + n1(e.fenster_breite).padStart(6) + n2(e.ist_koerper_L_e5).padStart(9)
      + (e.ist_im_fenster ? '   ja     ' : '   NEIN   ').padStart(12) + n1(e.delta_bis_fenster).padStart(7)
      + '   ' + String(e.wertstufe || '--').padEnd(11)
      + (e.wertstufe_band ? e.wertstufe_band[0] + '..' + e.wertstufe_band[1] : '--').padEnd(12)
      + (e.ist_in_wertstufe === null ? '  --  ' : e.ist_in_wertstufe ? '  ja  ' : ' NEIN ')
      + n1(e.delta_bis_wertstufe).padStart(8));
  }
  pg('');
  pg('--- (3d) E-B2 MINDERHEITSKRITERIUM: dL / dE00 GEGEN WEG UND WASSER, SEPARAT');
  pg('    (dL ist VORZEICHENBEHAFTET: die Figur muss HELLER sein als die Kachel — so urteilen Teil A 1.4 und Landkarte C H4.');
  pg('     Spalte |dL|>=10 zeigt die Betragslesart OHNE Gate-Wirkung.)');
  pg('FIGUR         KLASSE   KARTE           KACHEL            BODEN-L      dL   dE00-FL  dE00-GK   RIM%   dL>=10  |dL|>=10  dE>=20  RIM+15   URTEIL');
  for (const f of GEGNER_NAMEN) {
    const ms = E.E1G.figuren[f].minderheitsklassen.filter((m) => m.klasse === 'Weg' || m.klasse === 'Wasser');
    if (!ms.length) { pg(f.padEnd(13) + '(kein Weg / kein Wasser im Wirkort)'); continue; }
    for (const m of ms) {
      pg(f.padEnd(13) + m.klasse.padEnd(9) + m.karte.padEnd(16) + m.art.padEnd(18)
        + n1(m.boden_L).padStart(7) + n1(m.dL).padStart(8) + n1(m.dE00_flaeche).padStart(9)
        + n1(m.dE00_ganzkoerper).padStart(9) + n1(m.rim_pct).padStart(7)
        + (m.pfad_dL ? '   ja  ' : '  nein ') + (m.pfad_dL_betragslesart ? '     ja  ' : '    nein ') + (m.pfad_dE00 ? '   ja  ' : '  nein ')
        + (m.pfad_rim_plus_zuwachs ? '    ja ' : '   nein') + (m.ok ? '   gruen' : '   ROT'));
    }
  }
  pg('');
  pg('    UEBRIGE MINDERHEITSKLASSEN (Knochenboden / Treppe / Boden-Dekal / Kies), nur die ROTEN:');
  for (const f of GEGNER_NAMEN) {
    const ms = E.E1G.figuren[f].minderheitsklassen.filter((m) => m.klasse !== 'Weg' && m.klasse !== 'Wasser' && !m.ok);
    if (ms.length) pg('      ' + f.padEnd(13) + ms.map((m) => m.karte + '/' + m.art + ' dL ' + n1(m.dL) + ' dE00 ' + n1(m.dE00_flaeche)).join('  |  '));
  }

  // ---------------- (4) PROFILE ----------------
  pg('');
  pg('--- (4) PROFILE, FUSSBUENDIG (E5-Formel, Rohzeilen)');
  pg('    BREITENPROFILE (Basisgrid, Zeile 0 oben):');
  for (const f of GEGNER_NAMEN) pg('      ' + f.padEnd(13) + '[' + (E.PROFIL.profile_ganze_figur[f] || []).join(',') + ']');
  pg('    KOPF-SCHULTER-PROFILE (oberste BELEGTE Zeilen; GATE-Lesart: Grufthund ' + KS_ZEILEN.Grufthund + ', sonst ' + KS_ZEILEN_ANKER + '):');
  for (const f of GEGNER_NAMEN) pg('      ' + f.padEnd(13) + 'GATE [' + (E.PROFIL.profile_kopf_schulter_gate[f] || []).join(',') + ']'
    + '   ANKER6 [' + (E.PROFIL.profile_kopf_schulter_anker6[f] || []).join(',') + ']');
  const matrixDruck = (titel, liste, spalten) => {
    pg('');
    pg('    ' + titel);
    const namen = spalten;
    pg('                ' + namen.map((n) => n.slice(0, 9).padStart(11)).join(''));
    for (const a of namen) {
      let z = '      ' + a.padEnd(10);
      for (const b of namen) {
        if (a === b) { z += '      100.0'; continue; }
        const m = liste.find((x) => (x.paar[0] === a && x.paar[1] === b) || (x.paar[0] === b && x.paar[1] === a));
        z += n1(m ? m.aehnlichkeit : null).padStart(11);
      }
      pg(z);
    }
  };
  const SPALTEN = GEGNER_NAMEN.filter((f) => f !== 'Schild');
  matrixDruck('MATRIX GANZE FIGUR (Gate <= ' + PROFIL_GANZ_MAX + ')', E.PROFIL.matrix_ganze_figur, SPALTEN);
  matrixDruck('MATRIX KOPF-SCHULTER, GATE-LESART (<= ' + ZIEL_KS_GATE + ', Warden-Paare ausgenommen)', E.PROFIL.matrix_kopf_schulter_gate, SPALTEN);
  matrixDruck('MATRIX KOPF-SCHULTER, ANKER-LESART 6 Zeilen fuer ALLE (Teil C 0.3)', E.PROFIL.matrix_kopf_schulter_anker6, SPALTEN);
  pg('');
  pg('    ueber Gate GANZE FIGUR: ' + (E.PROFIL.paare_ueber_ziel_ganze_figur.join(', ') || 'KEINE'));
  pg('    ueber Gate KOPF-SCHULTER: ' + (E.PROFIL.paare_ueber_ziel_kopf_schulter.join(', ') || 'KEINE'));

  // ---------------- (5) HALBSEITEN ----------------
  pg('');
  pg('--- (5) HALBSEITEN-dL JE GRID (E-B5: jedes Gegner-Grid wird gespiegelt; Gate |dL| <= ' + HALBSEITE_MAX_dL + ' L)');
  pg('    NACHZUG 12.09.: ' + AUSNAHME_DECAL + ' und ' + AUSNAHME_SHIELD + ' — diese Grids werden GEMESSEN, aber NICHT gewertet (Urteil "--"). Grenze unveraendert.');
  pg('GRID                 OPAK   L-LINKS  L-RECHTS      dL   |dL|   HELLER   OHNE-kn-dL   URTEIL');
  for (const f of GEGNER_NAMEN) for (const fr of E.FIG[f].halbseiten.frames) {
    pg(fr.grid.padEnd(20) + String(fr.opak_texel).padStart(5) + n2(fr.links_L).padStart(10) + n2(fr.rechts_L).padStart(10)
      + n2(fr.dL).padStart(8) + n2(fr.dL_betrag).padStart(7) + '   ' + String(fr.hellere_seite).padEnd(8)
      + n2(fr.zweitlesart_ohne_kn_dL).padStart(12) + (fr.ok === null ? '   --   ' : fr.ok ? '   gruen' : '   ROT')
      + (fr.ausnahme ? '  ' + fr.ausnahme : '')
      + (fr.ok_m3 === false ? '  (auch M3-hart 8,2 gerissen)' : ''));
  }

  // ---------------- (6) FRAME-DIFFS ----------------
  pg('');
  pg('--- (6) FRAME-DIFF FUER JEDES POSENPAAR (E-B7 + Review m3)');
  pg('PAAR                                   TEXEL   TEX%   SILH  SILH%  SILH-BAENDER          #B  TEX-#B  ROLLE');
  for (const f of GEGNER_NAMEN) for (const p of E.FIG[f].frame_diffs) {
    pg((p.paar[0] + ' / ' + p.paar[1]).padEnd(38) + String(p.texel_diff).padStart(5) + n1(p.texel_diff_pct).padStart(7)
      + String(p.silhouetten_diff).padStart(7) + n1(p.silhouetten_diff_pct).padStart(7)
      + '  ' + (p.silhouette_baender || []).map((b) => b[0] === b[1] ? String(b[0]) : b[0] + '-' + b[1]).join(',').padEnd(20)
      + String(p.silhouette_baender_anzahl).padStart(3) + String(p.texel_baender_anzahl).padStart(8)
      + '  ' + p.rolle);
  }

  pg('');
  pg('--- (6b) SEHNEN-REGEL E-B8: SOLITAERTEXEL AUFGETEILT (Diagonalketten vs echte Einzeltexel)');
  pg('FIGUR         KOERPER-TX  SOLITAER  DIAGONALKETTE  EINZELTEXEL   DIAG%   EINZ%');
  for (const f of GEGNER_NAMEN) {
    const d = E.FIG[f].m6b_sehnen_diagonalen;
    pg(f.padEnd(13) + String(d.koerper_texel).padStart(10) + String(d.solitaer).padStart(10)
      + String(d.davon_diagonalkette).padStart(15) + String(d.davon_einzeltexel).padStart(13)
      + n2(d.diagonalkette_pct).padStart(8) + n2(d.einzeltexel_pct).padStart(8));
  }

  // ---------------- (7) MATERIAL ----------------
  pg('');
  pg('--- (7) GEGNER-MATERIAL-TABELLE (Format GP7CH2/MATERIAL-TABELLE/1) + FLAECHEN-KENNZAHLEN');
  pg('FIGUR         FLAECHE                                      ART        TOENE     TEXEL   DOM%  STUFEN  SCHRITT  MAXTON%   HUE-SPANNE');
  for (const f of GEGNER_NAMEN) {
    for (const fl of E.FIG[f].m4_material.flaechen) {
      const maxTon = fl.toendetails.length ? Math.max(...fl.toendetails.map((t) => 100 * t.texel / fl.texel)) : 0;
      pg(f.padEnd(13) + fl.name.slice(0, 44).padEnd(45) + fl.art.padEnd(11) + ("'" + fl.toene.join('') + "'").padEnd(10)
        + String(fl.texel).padStart(6) + n1(fl.dominanz_pct).padStart(7) + String(fl.stufen).padStart(7)
        + (fl.schrittverhaeltnis === null ? '     --' : n2(fl.schrittverhaeltnis).padStart(9))
        + n1(maxTon).padStart(9) + n1(fl.hue_spanne_grad).padStart(13));
    }
    if (E.FIG[f].m4_material.fehler.length) pg('              FEHLER: ' + E.FIG[f].m4_material.fehler.join(' | '));
    pg('              dominante Rampe: ' + E.FIG[f].m4_material.dominante_rampe
      + '   [' + E.FIG[f].m4_material.rampen.map((r) => r.rampe + ':' + r.texel).join(' ') + ']');
  }

  // ---------------- (7b) TABELLEN-TOENE OHNE TEXEL (Nachzug Punkt 6) ----------
  pg('');
  pg('--- (7b) VALIDIERUNG DER MATERIAL-TABELLE GEGEN DIE GRIDS (Nachzug Punkt 6)');
  pg('    Quelle der Tabelle: ' + MATERIAL_GEGNER_HERKUNFT);
  pg('    (I) TOENE IN DER TABELLE, DIE IN KEINEM GRID DER FIGUR VORKOMMEN — NICHT geloescht, Liste an Fable:');
  pg('    FIGUR         TON   HERKUNFT        ART        FLAECHE');
  {
    let n = 0;
    for (const f of GEGNER_NAMEN) {
      const t = E.FIG[f].tabellen_toene_ohne_texel;
      for (const z of t.zeilen) {
        n++;
        pg('    ' + f.padEnd(13) + ("'" + z.ton + "'").padEnd(6) + z.herkunft.padEnd(16)
          + String(z.art).padEnd(11) + (z.flaeche === null ? '(Feld "rim")' : z.flaeche));
      }
    }
    pg('    ' + (n === 0 ? 'KEINE — jeder Tabellen-Ton hat mindestens ein Texel.' : 'SUMME ' + n + ' Tabellen-Toene ohne Texel.'));
    pg('    (II) GEGENRICHTUNG (Grid-Ton ohne Tabellen-Eintrag, zur Vollstaendigkeit):');
    for (const f of GEGNER_NAMEN) {
      const l = E.FIG[f].tabellen_toene_ohne_texel.grid_toene_ohne_tabellen_eintrag;
      pg('    ' + f.padEnd(13) + (l.length ? l.map((x) => "'" + x.ton + "' " + x.texel + ' Tx').join('  ') : 'keine'));
    }
  }

  // ---------------- (8) SPERRLISTE ----------------
  pg('');
  pg('--- (8) SPERRLISTEN (E6-Aequivalent §1 + E-C3 + E-C4)');
  pg('FIGUR         REGEL             TOENE        TEXEL   ANTEIL%  MAX%   URTEIL  REGELTEXT');
  for (const f of GEGNER_NAMEN) for (const r of E.FIG[f].sperrliste) {
    pg(f.padEnd(13) + r.id.padEnd(18) + ("'" + r.toene + "'").slice(0, 13).padEnd(13) + String(r.texel).padStart(5)
      + n2(r.anteil_pct).padStart(10) + String(r.max_pct).padStart(6) + (r.ok ? '   gruen  ' : '   ROT    ') + r.regel);
  }

  // ---------------- (9) GATES ----------------
  pg('');
  pg('--- (9) LEITPLANKEN / GATES JE GEGNER');
  for (const f of GEGNER_NAMEN) {
    const L = E.LEITG.figuren[f];
    pg('');
    pg('  ' + f.toUpperCase() + '   Status ' + L.status + '   (' + L.gates_gruen + '/' + L.gates_gesamt + ' gruen'
      + (L.ausgesetzt.length ? ', ausgesetzt: ' + L.ausgesetzt.join('/') : '') + ')');
    const zeile = (id, soll, ist, ok, zusatz) => pg('     ' + id.padEnd(22) + String(soll).padEnd(26)
      + String(ist).padStart(12) + '  ' + (ok === null ? ' --  ' : ok ? 'gruen' : 'ROT  ') + (zusatz ? '   ' + zusatz : ''));
    zeile('G1 Schwarz k+n', '<= ' + L.G1_schwarz.grenze + ' % je Grid', n2(L.G1_schwarz.max) + ' max', L.G1_schwarz.ok, L.G1_schwarz.grids_rot.length ? 'rot: ' + L.G1_schwarz.grids_rot.join(',') : '');
    zeile('G2 Konturtoene >= 8 Tx', '>= ' + KONTURTOENE_MIN + ' je Grid', String(L.G2_konturtoene.min) + ' min', L.G2_konturtoene.ok, (L.G2_konturtoene.grids_rot.length ? 'rot: ' + L.G2_konturtoene.grids_rot.slice(0, 4).join(',') + '   ' : '') + L.G2_konturtoene.ausnahmen.join('; '));
    zeile('G3 Rim/Kontur', '>= ' + RIM_MIN_PCT + ' % je Grid', n2(L.G3_rim.min) + ' min', L.G3_rim.ok, 'min auf ' + (L.G3_rim.min_grid || '--') + "   Rimtoene '" + L.G3_rim.rimtoene.join('') + "'" + (L.G3_rim.ausnahmen.length ? '   ' + L.G3_rim.ausnahmen.join('; ') : ''));
    zeile('G4 Halbseiten |dL|', '<= ' + HALBSEITE_MAX_dL + ' L je Grid', n2(L.G4_halbseiten.max) + ' max', L.G4_halbseiten.ok, (L.G4_halbseiten.grids_rot.length ? 'rot: ' + L.G4_halbseiten.grids_rot.join(',') + '   ' : '') + L.G4_halbseiten.ausnahmen.join('; '));
    zeile('G5 Spiegel TON (Gate)', '<= ' + SPIEGEL_MAX_PCT + ' % je Grid', n2(L.G5_spiegel.max) + ' max', L.G5_spiegel.ok, (L.G5_spiegel.ausgesetzt ? 'AUSGESETZT (Eichkoerper)   ' : '') + 'Silhouette informativ ' + n2(L.G5_spiegel.max_silhouette_informativ) + ' max, E5-Ton ' + n2(L.G5_spiegel.max_e5_ton_informativ) + ' max' + (L.G5_spiegel.ausnahmen.length ? '   ' + L.G5_spiegel.ausnahmen.join('; ') : ''));
    zeile('G6 Solitaer bereinigt', '<= ' + SOLITAER_MAX_PCT_GEGNER + ' %', n2(L.G6_solitaer.ist), L.G6_solitaer.ok, (L.G6_solitaer.ausgesetzt ? 'AUSGESETZT   ' : '') + 'roh ' + n2(L.G6_solitaer.roh_pct) + ' %, Abzug ' + L.G6_solitaer.abzug_gesamt + ' Tx');
    zeile('G7 Materialflaechen', '3 Stufen/1,6/55 %/20 Grad', L.G7_material.flaechen.length + ' Flaechen', L.G7_material.ok, (L.G7_material.flaechen_rot.length ? 'rot: ' + L.G7_material.flaechen_rot.join(' | ') + '   ' : '') + (L.G7_material.ausnahmen || []).join('; ') + (L.G7_material.ausgenommen_komplett ? '   AUSGENOMMEN (Figur besteht nur aus shield_*)' : ''));
    zeile('G8 Koerper-L', (L.G8_koerper_L.fenster ? n1(L.G8_koerper_L.fenster[0]) + '..' + n1(L.G8_koerper_L.fenster[1]) : '--') + (L.G8_koerper_L.wertstufe_band ? ' + ' + L.G8_koerper_L.wertstufe_band.join('..') : ''), n2(L.G8_koerper_L.ist), L.G8_koerper_L.ok, 'Fenster ' + (L.G8_koerper_L.im_fenster ? 'ja' : 'NEIN') + ', Stufe ' + (L.G8_koerper_L.in_wertstufe === null ? '--' : L.G8_koerper_L.in_wertstufe ? 'ja' : 'NEIN') + ', Delta ' + n1(L.G8_koerper_L.delta_wertstufe));
    zeile('G9 Minderheiten', 'dL>=10 / dE00>=20 / Rim+15', (L.G9_minderheit.rot.length ? L.G9_minderheit.rot.length + ' rot' : 'alle gruen'), L.G9_minderheit.ok, L.G9_minderheit.rot.slice(0, 4).join(','));
    zeile('G10 Frame-Diff', 'Silh >= 8 % UND >= 2 Baender', (L.G10_framediff.walk_silhouette_pct === null ? '--' : n1(L.G10_framediff.walk_silhouette_pct) + ' % / ' + L.G10_framediff.walk_baender + 'B'), L.G10_framediff.ok, L.G10_framediff.walk_paar ? L.G10_framediff.walk_paar.join('/') : 'kein Lauf-Paar');
    zeile('G11 Sperrliste', 'alle Regeln', (L.G11_sperrliste.rot.length ? L.G11_sperrliste.rot.join(',') : 'sauber'), L.G11_sperrliste.ok, '');
    zeile('G12 Decal-Gates', 'Masse/Kontrast/Rim/Kante', (L.G12_decal.anzahl === 0 ? 'kein Decal' : L.G12_decal.anzahl + ' Decal(s)'), L.G12_decal.ok, L.G12_decal.rot.length ? 'rot: ' + L.G12_decal.rot.join(',') : (L.G12_decal.hinweis || L.G12_decal.decals.map((z) => z.decal + ' Rim ' + n1(z.rim_pct) + ' % / Kante ' + (z.bodenkante_toene.map((c) => "'" + c + "'").join('') || 'KEINE')).join('  ')));
  }
  pg('');
  pg('  PAAR-GATES (gelten fuer den Cast, nicht die Einzelfigur)');
  pg('     P1 Profil ganze Figur  <= ' + PROFIL_GANZ_MAX + ':   ' + (E.LEITG.paargates.P1_profil_ganze_figur.ok ? 'gruen' : 'ROT — ' + E.LEITG.paargates.P1_profil_ganze_figur.rot.join(', ')));
  pg('     P2 Profil Kopf-Schulter <= ' + ZIEL_KS_GATE + ': ' + (E.LEITG.paargates.P2_profil_kopf_schulter.ok ? 'gruen' : 'ROT — ' + E.LEITG.paargates.P2_profil_kopf_schulter.rot.join(', ')));
  pg('     P3 Wertleiter (>= 5 L):      ' + (E.LEITG.paargates.P3_wertleiter.ok ? 'gruen' : 'ROT — ' + E.LEITG.paargates.P3_wertleiter.rot.join(', ')));
  pg('        IST-Reihenfolge: ' + E.E1G.wertleiter.ist_reihenfolge.map((x) => x.figur + ' ' + n1(x.ist_L) + ' (' + x.stufe + ')').join('  <  '));
  pg('        Abstaende: ' + E.E1G.wertleiter.abstaende.map((a) => a.unten + '->' + a.oben + ' ' + n1(a.abstand_L) + ' L').join('  |  '));
  pg('');
  pg('  BILANZ STAND ' + st + ': Figuren gruen ' + E.LEITG.bilanz.figuren_gruen + '/' + E.LEITG.bilanz.figuren_gesamt
    + ', Gates gruen ' + E.LEITG.bilanz.gates_gruen + '/' + E.LEITG.bilanz.gates_gesamt);
  pg('  ROT: ' + (E.LEITG.bilanz.rot.join(', ') || 'keine'));

  // ---------------- (10) ANKER ----------------
  pg('');
  pg('--- (10) ANKER-KONTROLLE (Positivkontrolle: das WERKZEUG wird geprueft, nicht die Kunst)');
  pg('    HINWEIS (Runde 2, V-TESTS R4): die Anker sind gegen die IST-MATERIAL-TABELLE geeicht (gegner_material_IST.json).');
  pg('    Dieser Lauf rechnet mit: ' + MATERIAL_GEGNER_HERKUNFT);
  pg('    Mit einer NACHHER-Tabelle aendern sich die aufgeloesten Rim-Toene; weil Koerper-L (E5) die Rim-Texel abzieht,');
  pg('    sind Abweichungen von rund 1 L bei Koerper-L und bei den Rim-Prozenten ERWARTET und KEIN Werkzeugfehler.');
  pg('    Fuer eine saubere Positivkontrolle den Vorher-Stand OHNE --material-gegner messen.');
  pg('    (a) KOERPER-L (Teil A 1.1)');
  pg('        FIGUR         SOLL      IST     ABW    URTEIL   QUELLE');
  for (const a of E.KONTR.koerper_L) pg('        ' + a.figur.padEnd(13) + n1(a.soll).padStart(6) + n2(a.ist).padStart(9)
    + n2(a.abweichung).padStart(8) + (a.ok ? '   gruen ' : '   ROT   ') + a.quelle);
  pg('    (b) GRID-KENNZAHLEN (Teil A 1.2; Toleranz ' + GEGNER_ANKER_GRID_TOLERANZ + ')');
  pg('        GRID              GROESSE                          SOLL      IST     ABW   URTEIL');
  for (const a of E.KONTR.grid) for (const z of a.zeilen) {
    pg('        ' + a.grid.padEnd(18) + z.groesse.padEnd(32) + n1(z.soll).padStart(6) + n2(z.ist).padStart(9)
      + n2(z.abweichung).padStart(8) + (z.ok ? '   gruen' : '   ROT'));
  }
  pg('    (c) FRAME-DIFF (Teil A 7.2)');
  pg('        PAAR                 SOLL-TX  IST-TX  SOLL-SIL  IST-SIL   SOLL-TX%   IST-TX%  SOLL-SIL%  IST-SIL%  URTEIL');
  for (const a of E.KONTR.framediff) pg('        ' + a.id.padEnd(20) + String(a.soll_texel).padStart(7) + String(a.ist_texel).padStart(8)
    + String(a.soll_silhouette).padStart(10) + String(a.ist_silhouette).padStart(9)
    + n1(a.soll_texel_pct).padStart(11) + n2(a.ist_texel_pct).padStart(10)
    + n1(a.soll_silhouette_pct).padStart(11) + n2(a.ist_silhouette_pct).padStart(10)
    + (a.ok ? '   gruen' : '   ROT'));
  pg('    (d) PROFIL, FUSSBUENDIG (Teil C 0.3 — die sechs Anker des Auftrags)');
  pg('        ZONE            PAAR                        SOLL      IST     ABW   URTEIL');
  for (const a of E.KONTR.profil) pg('        ' + a.zone.padEnd(16) + a.paar.join('/').padEnd(28) + n1(a.soll).padStart(6)
    + n2(a.ist).padStart(9) + n2(a.abweichung).padStart(8) + (a.ok ? '   gruen' : '   ROT'));
  pg('        -- Zusatzkontrollen (dieselbe Formel, nicht im Auftrags-Ankersatz) --');
  for (const a of E.KONTR.profil_zusatz) pg('        ' + a.zone.padEnd(16) + a.paar.join('/').padEnd(28) + n1(a.soll).padStart(6)
    + n2(a.ist).padStart(9) + n2(a.abweichung).padStart(8) + (a.ok ? '   gruen' : '   ROT') + '   ' + a.quelle);
  pg('    (e) HALBSEITEN-dL (Teil A 7.3)');
  pg('        GRID              SOLL-dL   IST-dL     ABW   SOLL-TX  IST-TX  URTEIL');
  for (const a of E.KONTR.halbseite) pg('        ' + a.grid.padEnd(18) + n2(a.soll_dL).padStart(8) + n2(a.ist_dL).padStart(9)
    + n2(a.abweichung).padStart(8) + String(a.soll_texel).padStart(9) + String(a.ist_texel).padStart(8) + (a.ok ? '   gruen' : '   ROT'));
  pg('    (f) KONTROLL-REFERENZ SOLITAER (Landkarte C H7 — KEIN Auftrags-Anker)');
  pg('        GRID              SOLL      IST     ABW   URTEIL');
  for (const a of E.KONTR.referenz_solitaer_landkarteC) pg('        ' + a.grid.padEnd(18) + n1(a.soll).padStart(6)
    + n2(a.ist).padStart(9) + n2(a.abweichung).padStart(8) + (a.ok ? '   gruen' : '   ROT'));
  pg('');
  pg('    ANKER-BILANZ: Koerper-L ' + E.KONTR.bilanz.koerper_L
    + ' | Grid ' + E.KONTR.bilanz.grid_gruen + '/' + E.KONTR.bilanz.grid_gesamt
    + ' | Frame-Diff ' + E.KONTR.bilanz.framediff_gruen + '/' + E.KONTR.bilanz.framediff_gesamt
    + ' | Profil ' + E.KONTR.bilanz.profil_gruen + '/' + E.KONTR.bilanz.profil_gesamt
    + ' (+Zusatz ' + E.KONTR.bilanz.profil_zusatz_gruen + '/' + E.KONTR.bilanz.profil_zusatz_gesamt + ')'
    + ' | Halbseite ' + E.KONTR.bilanz.halbseite_gruen + '/' + E.KONTR.bilanz.halbseite_gesamt
    + ' | Solitaer-Referenz C ' + E.KONTR.bilanz.referenz_solitaer_gruen + '/' + E.KONTR.bilanz.referenz_solitaer_gesamt);
  pg('    ALLE AUFTRAGS-ANKER GRUEN: ' + (E.KONTR.bilanz.ALLE_ANKER_GRUEN ? 'JA' : 'NEIN — ' + JSON.stringify({
    koerper_L: E.KONTR.bilanz.koerper_L_rot, grid: E.KONTR.bilanz.grid_rot,
    framediff: E.KONTR.bilanz.framediff_rot, profil: E.KONTR.bilanz.profil_rot, halbseite: E.KONTR.bilanz.halbseite_rot,
  })));

  // ---------------- (11) ZIELE ----------------
  const Z2 = E.ZIELE;
  pg('');
  pg('--- (11) ZIEL-KOPF-SCHULTER-PROFILE (ZUSATZ-DELIVERABLE, E-B3 + Review M8)');
  pg('    Verfahren: ' + Z2.verfahren);
  pg('    Zielwert der Suche ' + Z2.zielwert + ' (Gate ' + Z2.gate + ', Familiengate ' + Z2.familiengate + '); Warden fest auf [' + Z2.warden_fest.join(',') + ']');
  pg('    Poolgroessen: ' + Object.keys(Z2.poolgroessen).sort().map((k) => k + ' ' + Z2.poolgroessen[k]).join(', '));
  pg('    Gefunden von: ' + Z2.gefunden_von + '   max Paar ' + n2(Z2.max_paar) + '   max gegen Warden ' + n2(Z2.max_paar_gegen_warden)
    + '   Texelaenderung gesamt ' + Z2.texelaenderung_gesamt);
  pg('    Ziel erreicht (<= ' + Z2.zielwert + '): ' + (Z2.ziel_erreicht ? 'JA' : 'NEIN') + '   Gate erreicht (<= ' + Z2.gate + '): ' + (Z2.gate_erreicht ? 'JA' : 'NEIN'));
  pg('');
  pg('    FIGUR         IST-PROFIL              ZIEL-PROFIL             AENDERUNG  AUFLAGE');
  for (const f of [...ZIEL_FIGUREN, 'Warden']) {
    const j = Z2.je_figur[f];
    pg('    ' + f.padEnd(13) + ('[' + (j.ist || []).join(',') + ']').padEnd(24) + ('[' + j.ziel.join(',') + ']').padEnd(24)
      + String(j.texelaenderung).padStart(7) + '    ' + (j.fest ? 'EINGEFROREN (Eichkoerper)' : (Z2.regeln[f] ? Z2.regeln[f].auflage : '')));
  }
  pg('');
  pg('    PAARMATRIX DER ZIELPROFILE:');
  for (const m of Z2.matrix) pg('      ' + m.paar.join(' / ').padEnd(28) + n2(m.aehnlichkeit).padStart(7)
    + '   Grenze ' + String(m.grenze === null ? '(ausgenommen)' : m.grenze).padEnd(14) + (m.ok === null ? '--' : m.ok ? 'gruen' : 'ROT'));
  pg('');
  pg('    STECKBRIEFZEILEN (einzufrieren):');
  for (const z of Z2.steckbriefzeilen) pg('      ' + z);
  pg('');
  pg('--- (12) INNENRAUM-ZIELZAHLEN JE FIGUR (E-B1: die ZEICHNER-Zahl)');
  pg('FIGUR         WERTSTUFE-BAND   IST-INNEN-L   ZIEL-INNEN-L      INNEN  INNEN-kn  OHNE-kn   dM je umgefaerbtem Schwarztexel');
  for (const f of GEGNER_NAMEN) {
    const z = E.E1G.figuren[f].innenraum_zielzahl;
    if (!z) { pg(f.padEnd(13) + '(keine Wertstufe zugewiesen — ' + (f === 'Schild' ? 'Requisit' : '--') + ')'); continue; }
    pg(f.padEnd(13) + (z.wertstufe_band[0] + '..' + z.wertstufe_band[1]).padEnd(17) + n2(z.ist).padStart(11)
      + '   ' + (n1(z.ziel_unten) + '..' + n1(z.ziel_oben)).padEnd(15)
      + String(z.innen_texel).padStart(6) + String(z.innen_kn_texel).padStart(10) + String(z.innen_ohne_kn_texel).padStart(9)
      + n2(z.empfindlichkeit_je_umgefaerbtem_innen_schwarztexel).padStart(12));
  }

  // ---------------- (13) DECAL-GATES (Nachzug Punkt 1, ADDITIV) ---------------
  pg('');
  pg('--- (13) DECAL-GATES JE *_decal-GRID (ADDITIV; E-A4 / R-A4 / E-B9)');
  pg('    LESART: Breite = Basisgrid | Hoehe <= min(6, floor(0,4*Basishoehe), Hund ' + DECAL_ZEILEN_HART.hound
    + ') | Rahmen <= ' + DECAL_RAHMEN_MAX_PCT + ' % auf dem EIGENEN Grid | verschieden von *_die:'
    + ' Texel-Diff >= ' + DECAL_TEXELDIFF_MIN_PCT + ' % ODER >= ' + DECAL_ZEILEN_FLACHER_MIN
    + ' Zeilen flacher ODER Wert-L >= ' + DECAL_L_ABSTAND_MIN + ' tiefer (ODER-Verknuepfung)');
  pg('    RUNDE 2 zusaetzlich: RIM-% <= ' + DECAL_RIM_MAX_PCT + ' % der opaken Decal-Texel (Rim-Toene der Figur aus der Material-Tabelle)'
    + '  |  BODENKANTE: >= 1 Ton mit >= ' + DECAL_BODENKANTE_MIN_TEXEL
    + ' Texeln aus {k, n, dunkelster Materialton der Figur} in der UNTERSTEN belegten Zeile ODER auf der Kontur-Unterseite');
  pg('DECAL             BASIS         W x H   SOLL-W  DECKEL-H  RAHMEN%  MAX%   TX-DIFF   TX%   ZEILEN-FL   WERT-L-DECAL  WERT-L-DIE   dL   RIM%  MAX  KANTE      B  H  R  V  M  K   URTEIL');
  for (const f of GEGNER_NAMEN) for (const z of E.FIG[f].decal_befund.zeilen) {
    const j = (v) => (v === null ? '-' : v ? 'g' : 'R');
    pg(z.decal.padEnd(18) + String(z.basisgrid).padEnd(14) + (z.breite + 'x' + z.hoehe).padEnd(8)
      + String(z.basis_breite).padStart(6) + String(z.hoehe_deckel).padStart(10)
      + n1(z.rahmen_pct).padStart(9) + String(z.rahmen_max).padStart(6)
      + String(z.texel_diff_gegen_die).padStart(10) + n1(z.texel_diff_pct).padStart(7)
      + String(z.zeilen_flacher_als_die).padStart(12)
      + n2(z.wert_L_decal).padStart(15) + n2(z.wert_L_die).padStart(12) + n1(z.wert_L_abstand).padStart(7)
      + n1(z.rim_pct).padStart(7) + String(z.rim_max_pct).padStart(5)
      + ('  ' + (z.bodenkante_toene.map((c) => "'" + c + "'").join('') || 'KEINE')).padEnd(11)
      + '  ' + j(z.breite_ok) + '  ' + j(z.hoehe_ok) + '  ' + j(z.rahmen_ok) + '  ' + j(z.verschieden_ok)
      + '  ' + j(z.rim_ok) + '  ' + j(z.bodenkante_ok)
      + (z.ok ? '   gruen' : '   ROT'));
  }
  for (const f of GEGNER_NAMEN) {
    const dd = E.FIG[f].decal_befund;
    if (dd.anzahl === 0) continue;
    for (const z of dd.zeilen) {
      pg('    ' + z.decal + ': Pfade — Texel-Diff >= ' + DECAL_TEXELDIFF_MIN_PCT + ' % ' + (z.pfad_texeldiff_30pct ? 'JA' : 'nein')
        + ' | >= ' + DECAL_ZEILEN_FLACHER_MIN + ' Zeilen flacher ' + (z.pfad_zwei_zeilen_flacher ? 'JA' : 'nein')
        + ' | Wert-L -' + DECAL_L_ABSTAND_MIN + ' L ' + (z.pfad_wert_minus_20L ? 'JA' : 'nein')
        + '   (Koerper-L E5 Decal ' + n2(z.koerper_L_e5_decal) + ' / *_die ' + n2(z.koerper_L_e5_die) + ')');
      pg('    ' + ' '.repeat(z.decal.length) + '  Rim-Toene ' + z.rimtoene.map((c) => "'" + c + "'").join('') + ' = ' + z.rim_texel + '/' + z.opak_decal + ' Texel = '
        + n2(z.rim_pct) + ' % (<= ' + z.rim_max_pct + ' %)   |   Bodenkante-Kandidaten '
        + z.bodenkante_kandidaten.map((c) => "'" + c + "'").join('') + ' (dunkelster Materialton '
        + (z.dunkelster_materialton === null ? '--' : "'" + z.dunkelster_materialton + "' L601 " + n1(z.dunkelster_materialton_L) + ' aus ' + z.dunkelster_materialton_flaeche)
        + '), unterste belegte Zeile ' + z.unterste_belegte_zeile + ', Treffer '
        + (Object.keys(z.bodenkante_histogramm).sort().map((c) => "'" + c + "' " + z.bodenkante_histogramm[c]).join(' ') || 'keine')
        + ' (>= ' + z.bodenkante_min_texel + ' gefordert)');
    }
  }
  pg('    Decals ohne Figur-Gate G2/G3/G4/G5: ' + AUSNAHME_DECAL + '. G1 Schwarz und G6 Solitaer gelten weiter.');

  // ---------------- (14) DEKLARATIONEN + ZWEITE BILANZ (Runde 2) --------------
  pg('');
  pg('--- (14) DEKLARATIONSLISTE (Fable, Runde 2) — KEINE SCHWELLENAENDERUNG');
  pg('    Das Gate-Urteil bleibt ROT und steht so in der ERSTEN Bilanz. Eine Deklaration macht nur sichtbar, dass Fable');
  pg('    diesen EINEN Befund mit Grund und Quelle abgenommen hat, und zaehlt ihn in der ZWEITEN Bilanz mit. Ueberschreitet');
  pg('    der gemessene Befund den Deklarationsrahmen, GREIFT die Deklaration NICHT (Warnzeile) und bleibt auch dort rot.');
  for (const d of E.LEITG.deklarationen) {
    pg('');
    pg('    ' + (d.figur + ' / ' + d.gate).padEnd(34) + (d.greift ? 'DEKLARATION GREIFT' : d.unnoetig ? 'nicht noetig (Gate nicht rot)' : 'GREIFT NICHT'));
    pg('      IST:     ' + d.ist);
    pg('      RAHMEN:  ' + JSON.stringify(d.deklarationsrahmen));
    pg('      GRUND:   ' + d.grund);
    pg('      QUELLE:  ' + d.quelle);
    if (d.warnung) pg('      WARNUNG: ' + d.warnung);
  }
  pg('');
  pg('  ZWEITE BILANZ ("gruen ODER deklariert") STAND ' + st + ':');
  pg('    FIGUR         ERSTE BILANZ    ZWEITE BILANZ                    DEKLARIERT                                              OFFEN ROT');
  for (const f of GEGNER_NAMEN) {
    const L = E.LEITG.figuren[f];
    pg('    ' + f.padEnd(13) + (L.status + ' ' + L.gates_gruen + '/' + L.gates_gesamt).padEnd(16)
      + (L.status_mit_deklaration + ' ' + L.gates_gruen_oder_deklariert + '/' + L.gates_gesamt).padEnd(33)
      + (L.gates_deklariert.join(',') || '-').padEnd(56) + (L.gates_rot_offen.join(',') || '-'));
  }
  const b2 = E.LEITG.bilanz2_mit_deklarationen;
  pg('    GESAMT: Figuren "gruen oder deklariert" ' + b2.figuren_gruen_oder_deklariert + '/' + b2.figuren_gesamt
    + ', Gates ' + b2.gates_gruen_oder_deklariert + '/' + b2.gates_gesamt
    + '   (erste Bilanz: Figuren ' + E.LEITG.bilanz.figuren_gruen + '/' + E.LEITG.bilanz.figuren_gesamt
    + ', Gates ' + E.LEITG.bilanz.gates_gruen + '/' + E.LEITG.bilanz.gates_gesamt + ')');
  pg('    OFFEN ROT (von keiner Deklaration gedeckt): ' + (b2.offen_rot.join(', ') || 'KEINE'));
  pg('    Deklarationen ohne Wirkung (Gate ist gruen/nicht gewertet): ' + (b2.deklarationen_ohne_wirkung.join(', ') || 'keine'));
  pg('    Deklarationen MIT WARNUNG: ' + (b2.deklarationen_mit_warnung.join(' | ') || 'keine'));
}

if (VERGLEICH_G) {
  pg('');
  pg('################################################################################');
  pg('# VERGLEICH GEGNER  VORHER <-> NACHHER');
  pg('################################################################################');
  pg('Kunst unveraendert: ' + (VERGLEICH_G.kunst_unveraendert ? 'JA — alle Deltas MUESSEN 0 sein' : 'NEIN'));
  pg('FIGUR         GATE                         SOLL                     VORHER      NACHHER       DELTA   V     N');
  for (const z of VERGLEICH_G.zeilen) {
    pg(z.figur.padEnd(13) + z.gate.padEnd(29) + String(z.soll).padEnd(22)
      + (typeof z.vorher === 'number' ? n3(z.vorher) : String(z.vorher)).padStart(11)
      + (typeof z.nachher === 'number' ? n3(z.nachher) : String(z.nachher)).padStart(13)
      + (z.delta === null ? '--' : (z.delta >= 0 ? '+' : '') + n3(z.delta)).padStart(12)
      + ampel(z.vorher_ok) + ampel(z.nachher_ok));
  }
  pg('');
  pg('VERSCHLECHTERUNGEN: ' + (VERGLEICH_G.verschlechterungen.join(', ') || 'KEINE'));
}

pg('');
pg('--- AUFRUFE');
pg('  node .tmp/gp7ch_p0/figuren_messung.mjs --beides');
pg('  node .tmp/gp7ch_p0/figuren_messung.mjs --vorher');
pg('  node .tmp/gp7ch_p0/figuren_messung.mjs --nachher');
pg('  node .tmp/gp7ch_p0/figuren_messung.mjs --vorher --vorher-zeiger 75106c7   (CH-1-Menschen-Anker)');
pg('  node .tmp/gp7ch_p0/figuren_messung.mjs --material-gegner <pfad.json>      (Zeichner-Tabelle Phase 1)');
pg('  node .tmp/gp7ch_p0/figuren_messung.mjs --schnell                          (ohne dE00-Wuerfelscan)');
pg('  node .tmp/gp7ch_p0/figuren_messung.mjs --out <verzeichnis>');
pg('Dateien GEGNER: ' + DATEIEN_G.join(', ') + ', gegner_messung_' + MODUS + '.log');
pg('');

const LOG_G = ZG.join('\n');
writeFileSync(resolve(OUT_DIR, 'gegner_messung_' + MODUS + '.log'), LOG_G, 'utf8');
process.stdout.write(LOG_G);
process.stdout.write('\nP0A-GEGNER-MESSWERKZEUG-FERTIG\n');
