// SAVE-SYSTEM (SPEC_SLICE_4 §3). REINES Daten-Modul, Node-importierbar:
// KEIN window, KEIN document, KEIN localStorage, KEIN Canvas (§0.3).
// Den Storage fasst AUSSCHLIESSLICH main.js an, und dort nur in der
// §0.2-Guardform — genauso, wie main.js schon heute als einziges Modul
// location.search liest.
//
// SCHEMA v1 (vollstaendig; die Feldliste ist die carry-Liste aus
// main.js:314-319 plus Kartenposition und Run-Flags):
//   { v, mapKey, spawn:{x,y}, hp, gold, potions,
//     inv:{items,equipped,capacity,zelda,pity,newFlag},
//     prog:{xp,level,hearts},
//     runFlags:{bossDead, openedChests:[ "MAP:tx,ty", ... ]} }
//
// maxHp wird NIEMALS gespeichert (§3.1): es ist ABGELEITET
// (player.js recalcStats -> applyProgress: Level und Herzcontainer). Ein
// gespeichertes maxHp waere beim naechsten Balancing-Schritt sofort falsch.
//
// Ebenfalls NICHT gespeichert (und warum das kein Verlust ist, Landkarte B
// §3): Truhen/Vasen/Gegner werden bei jedem buildWorld frisch gebaut
// (dokumentierter Slice-1-Kompromiss) — bis auf die geoeffneten Truhen, die
// runFlags.openedChests traegt; portalsArmed startet bewusst auf false
// (der Spieler steht nach dem Laden oft auf einem Portal-Spawn); alles
// Transiente (fadePhase, victoryTimer, toast, Timer) ist zuruecksetzbar.
// Das player-OBJEKT selbst wird nie serialisiert — es traegt Funktionen.
//
// deserialize() lehnt HART ab und liefert null (nie eine Exception, nie ein
// halb gefuelltes Objekt): kaputtes JSON, fremde/fehlende Schema-Version,
// unbekannte Karte, falsche Typen. Ein abgelehnter Stand fuehrt in main.js
// dazu, dass der Titel byte-gleich zum Bestand aussieht.

// ---------------------------------------------------------------------------
// SCHEMA v2 (SPEC_SLICE_6 §5). VIER neue Felder unter runFlags:
//   runFlags.quests      : { <id>: { status, zaehler } }   (quest.js)
//   runFlags.npcFlags    : { <marke>: true|false|<int> }    (Dialog-Gedaechtnis)
//   runFlags.gekauft     : [ 'herz', ... ]                  (Einmalwaren, shop_ui)
//   runFlags.dorfBesuche : int                              (Angebots-Saat)
//
// AUF BEIDEN PFADEN OPTIONAL MIT DEFAULT (SPEC §5, Review M1): ein v2-Stand
// OHNE diese Felder laedt fehlerfrei — sonst waeren alle Bestandsboots rot,
// die einen Stand von Hand zusammensetzen (probe_s4_engine bleibt gruen).
// Vorhanden, aber falsch getypt = HARTE ABLEHNUNG wie bisher.
//
// SAVE_KEY BLEIBT 'grimlight.save.v1' (Landkarte §5.3): ein neuer Schluessel
// wuerde Michaels Bestandsstand stillschweigend verwaisen lassen. Stattdessen
// nimmt deserialize BEIDE Versionen an und liefert IMMER v2-Form; v1 laeuft
// dabei durch migrateV1 (verlustfrei, NIE null fuer einen gueltigen v1-Stand).
// SAVE_VERSION 2 kippt vier Bestandszeilen in den Suiten — die stehen
// abschliessend in SPEC §7.B (Sanktions-Katalog) und werden NICHT hier
// mitgeaendert.
//
// UNANGETASTET (bindend): maxHp wird weiterhin NIE gespeichert und ein Stand
// MIT maxHp weiterhin abgelehnt; der storage-Guard liegt weiterhin allein in
// main.js; applyToPlayer behaelt die carry-Reihenfolge inv/prog ->
// recalcStats -> hp -> gold -> potions.

import { MAPS } from '../world/maps.js';
import { AFFIXES } from './items.js';
import { QUEST_STATUS, neueRunFelder } from './quest.js';

export const SAVE_VERSION = 2;
export const SAVE_KEY = 'grimlight.save.v1';
// Versionen, die deserialize annimmt. v1 kommt NUR ueber migrateV1 herein.
export const SAVE_VERSIONEN = [1, 2];

const SLOTS = ['weapon', 'armor', 'ring'];
// Zelda-Schiene (props.js: 'boomerang' | 'boss_key'). Fremde Eintraege
// koennen den Zustand nicht rekonstruieren -> Ablehnung.
const ZELDA_KEYS = ['boomerang', 'boss_key'];

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const isInt = (v) => isNum(v) && Number.isInteger(v);
const isBool = (v) => typeof v === 'boolean';
const isObj = (v) => !!v && typeof v === 'object' && !Array.isArray(v);

// ---------------------------------------------------------------------------
// GRENZEN DER VIER v2-FELDER — EINE QUELLE FUER BEIDE SEITEN (S6-Phase 3)
// ---------------------------------------------------------------------------
//
// WOZU: die Lese-Validierung (questsOk/npcFlagsOk/gekauftOk/dorfBesucheOk)
// und die Schreib-Filter (quests2Kopie/npcFlags2Kopie/gekauft2Kopie) muessen
// dieselben Zahlen benutzen. Standen sie zweimal als Literal da, driftete das
// Paar beim naechsten Balancing auseinander — und genau diese Drift ist die
// Asymmetrie, die hier gerade geschlossen wird. Die WERTE sind unveraendert
// die des bisherigen Lesers (32/32/64/32/999/99999): die Validierung wird
// NICHT aufgeweicht, sie bekommt nur einen Namen.
const MAX_ID_LAENGE = 32;       // KURZ(...) fuer Quest-IDs, npcFlags-Marken, gekauft
const MAX_QUESTS = 32;          // questsOk: hoechstens so viele Quest-Eintraege
const MAX_NPCFLAGS = 64;        // npcFlagsOk: hoechstens so viele Gespraechsmarken
const MAX_GEKAUFT = 32;         // gekauftOk: hoechstens so viele Einmalwaren
const MAX_ZAEHLER = 999;        // questsOk (zaehler) / npcFlagsOk (int-Wert)
const MAX_DORFBESUCHE = 99999;  // dorfBesucheOk

// ---------------------------------------------------------------------------
// SCHREIB-FILTER DER v1-KERNFELDER (S6-Phase 3, Fix-Runde 1)
// ---------------------------------------------------------------------------
//
// DERSELBE LEITSATZ wie bei den vier v2-Feldern weiter unten: was deserialize
// ABLEHNT, darf serialize gar nicht erst schreiben. Bis hierher galt er NUR
// fuer die vier neuen v2-Felder; die v1-Kernfelder gingen ungefiltert durch —
// und genau daran blieb der Adversarial-Lauf haengen:
//   * gold = NaN: JSON.stringify(NaN) schreibt `null`, isNum(null) faellt,
//     deserialize verwirft den GANZEN Stand (Faelle B2/C1; Infinity C2 wird
//     ebenfalls zu `null`, gold = -5 faellt an `gold < 0`, C3),
//   * hp = NaN (C4), potions = NaN (C5), spawn.x = NaN (C10) genauso,
//   * inv.items ueber inv.capacity (C6): invOk faellt an
//     `items.length > capacity` -> ebenfalls Totalverlust. Das war der
//     EINZIGE Grund fuer den roten Sammelfall B3 ("riesige Arrays"): 8 von 8
//     Eintraegen bei capacity 7 kippen den Stand, 7 laden; gekauft/
//     openedChests/quests/npcFlags/zelda mit tausenden Eintraegen laden alle.
//
// IDENTITAET AUF DEM GUELTIGEN BEREICH (Verlustfreiheit): jeder Wert, den
// deserialize annehmen wuerde, geht BYTE-GLEICH durch. Die Filter pruefen
// EXAKT die Bedingung des Lesers und ersetzen nur, was er ohnehin verwerfen
// wuerde. Ein gebrochenes hp aus einer Affix-Rechnung (maxHp-Affix mit
// Nachkommastelle) bleibt deshalb gebrochen; geklemmt wird nichts Gueltiges.
//
// ERSATZWERTE, und warum sie ehrlich sind:
//   hp      -> 1   (der Leser fordert hp > 0; 1 erfindet keine Gesundheit,
//                   und applyToPlayer kappt ohnehin gegen das abgeleitete
//                   maxHp)
//   gold    -> 0   (Untergrenze des Lesers; aus einem NaN laesst sich kein
//   potions -> 0    ehrlicher Betrag rekonstruieren)
//   spawn   -> playerSpawn DERSELBEN Karte (maps.js) statt (0,0): eine
//                   begehbare Kachel ist der einzige sinnvolle Nachbar
//   items   -> auf capacity GEKUERZT (der Ueberlauf faellt, die Tasche
//                   bleibt samt Reihenfolge erhalten)
// Lieber EIN Feld verlieren als den KOMPLETTEN Spielstand.
//
// REICHWEITE (deklariert): ueber die bekannten Laufzeitpfade ist keiner der
// Faelle erreichbar — alle gold-Mutationen (main.js:1147/1155/1437/1767/2402,
// shop_ui.js:195-231) rechnen mit endlichen Zahlen, items.js:88 blockt addItem
// bei voller Tasche, und die vier §3.2-Save-Hooks sitzen bewusst so, dass sie
// nie ein hp = 0 sehen (main.js:881-890). Der Filter ist die Versicherung fuer
// den Fall, dass doch einmal ein NaN durchrutscht: dann kostet er ein Feld
// statt den Stand.
const hpGefiltert = (v) => (isNum(v) && v > 0 ? v : 1);
const abNullGefiltert = (v) => (isNum(v) && v >= 0 ? v : 0);
const koordGefiltert = (v, heim) => (isNum(v) ? v : (isNum(heim) ? heim : 0));

/**
 * items auf capacity KUERZEN (invOk: `items.length > capacity` = Ablehnung).
 * NUR diese eine Grenze (Auftrag Fix-Runde 1): ein items, das gar kein Array
 * ist, und eine capacity ausserhalb 1..64 gehen UNVERAENDERT durch — das sind
 * andere Faelle, die der Leser weiterhin genauso hart ablehnt wie bisher.
 * Passt die Tasche, wird DASSELBE Array durchgereicht (kein neues Objekt,
 * kein veraenderter Text).
 */
function itemsGefiltert(items, capacity) {
  if (!Array.isArray(items)) return items;
  if (!isInt(capacity) || capacity < 1 || capacity > 64) return items;
  return items.length > capacity ? items.slice(0, capacity) : items;
}

const klemme = (n, min, max) => (n < min ? min : (n > max ? max : n));
// Kurzer, nicht leerer Text (Quest-ID, Gespraechsmarke, Warenschluessel).
// Stand bis zur Haertung erst weiter unten bei den Lese-Pruefern; er wird jetzt
// von BEIDEN Seiten gebraucht und ist deshalb hierher gewandert.
const KURZ = (s, max) => typeof s === 'string' && s.length > 0 && s.length <= max;

// ---------------------------------------------------------------------------
// SERIALISIEREN
// ---------------------------------------------------------------------------

/**
 * @param {Object} zustand { mapKey, spawn:{x,y}, player, runFlags }
 * @returns {string} JSON-Text (Schema v1)
 */
export function serialize(zustand) {
  const { mapKey, spawn, player, runFlags } = zustand;
  const inv = player.inv;
  const prog = player.prog;
  const rf = runFlags || {};
  // Heim-Koordinate der Karte als Ersatz fuer eine kaputte Spawn-Zahl (C10).
  // Unbekannte mapKey -> {}: der Leser lehnt so einen Stand ohnehin ab, der
  // Filter darf daran nichts beschoenigen.
  const heim = (MAPS[mapKey] && MAPS[mapKey].playerSpawn) || {};
  return JSON.stringify({
    v: SAVE_VERSION,
    mapKey,
    // GEHAERTET (Fix-Runde 1): jedes v1-Kernfeld laeuft durch den Filter mit
    // der Bedingung DES LESERS — gueltige Werte unveraendert, ein Auswuchs
    // kostet genau dieses eine Feld statt den ganzen Stand.
    spawn: { x: koordGefiltert(spawn.x, heim.x), y: koordGefiltert(spawn.y, heim.y) },
    // maxHp fehlt hier ABSICHTLICH (§3.1) — es wird beim Laden abgeleitet.
    hp: hpGefiltert(player.hp),
    gold: abNullGefiltert(player.gold),
    potions: abNullGefiltert(player.potions),
    inv: {
      items: itemsGefiltert(inv.items, inv.capacity),
      equipped: {
        weapon: inv.equipped.weapon,
        armor: inv.equipped.armor,
        ring: inv.equipped.ring,
      },
      capacity: inv.capacity,
      zelda: inv.zelda,
      pity: inv.pity,
      newFlag: inv.newFlag,
    },
    prog: { xp: prog.xp, level: prog.level, hearts: prog.hearts },
    runFlags: {
      bossDead: rf.bossDead === true,
      openedChests: Array.isArray(rf.openedChests) ? rf.openedChests.slice() : [],
      // §5 v2: die vier neuen Felder. Fehlen sie am uebergebenen runFlags
      // (frischer Run vor dem ersten Dorfbesuch, Alt-Aufrufer in Tests),
      // schreibt serialize die DEFAULTS — nie undefined, nie null.
      // GEHAERTET (S6-Phase 3): jedes der vier Felder laeuft durch einen
      // Filter mit den GRENZEN DES LESERS (MAX_*), damit kein Auswuchs einen
      // Stand erzeugt, den deserialize spaeter komplett verwirft. (H9) ist die
      // fehlende OBERGRENZE von dorfBesuche: `>= 0` stand da, `<= 99999`
      // (dorfBesucheOk) fehlte.
      quests: quests2Kopie(rf.quests),
      npcFlags: npcFlags2Kopie(rf.npcFlags),
      gekauft: gekauft2Kopie(rf.gekauft),
      dorfBesuche: isInt(rf.dorfBesuche) ? klemme(rf.dorfBesuche, 0, MAX_DORFBESUCHE) : 0,
    },
  });
}

// ---------------------------------------------------------------------------
// SCHREIB-FILTER DER VIER v2-FELDER (S6-Phase 3, Haertung)
// ---------------------------------------------------------------------------
//
// LEITSATZ: **Was deserialize ablehnt, darf serialize gar nicht erst
// schreiben.** Die umgekehrte Reihenfolge ist die teuerste Variante: ein
// einzelner korrupter Laufzeit-Auswuchs (eine ueberlange Marke, ein
// durchgelaufener Zaehler) landet ungefiltert im Storage, und beim naechsten
// Start faellt deshalb der GANZE Stand durch runFlagsOk — kein FORTSETZEN,
// alles weg. Gehaertet wird darum IMMER die SCHREIBSEITE; die
// Lese-Validierung bleibt Zeichen fuer Zeichen so hart wie bisher.
//
// VERLUSTFREIHEIT (Roundtrip-Beweis smoke S6-§7F(i)): die Filtergrenzen sind
// EXAKT die des Lesers, und ein gueltiger Laufzeitzustand liegt in jeder
// Dimension weit darunter — 4 Quests mit zweizeichigen IDs, Zaehler <= 5,
// Marken der Form 'q4_torwaechter', gekauft ['herz'], dorfBesuche einstellig.
// Ein solcher Zustand wandert byte-gleich durch die Filter wie vor der
// Haertung. Bereinigt wird ausschliesslich, was der Leser ohnehin verwerfen
// wuerde — und zwar feldgenau statt als Totalverlust.
//
// KLEMMEN STATT WERFEN, wo es einen sinnvollen Nachbarwert gibt (Zaehler,
// dorfBesuche); WEGLASSEN nur, wo kein ehrlicher Ersatz existiert (fremder
// Status, fremde ID, Ueberlauf ueber den Deckel).

// Tiefe Kopien der zwei Objekt-Felder (JSON-rein: keine Referenzen ins Spiel).
function quests2Kopie(q) {
  const out = {};
  if (!isObj(q)) return out;
  let n = 0;
  for (const id of Object.keys(q)) {
    // (H2) DECKEL wie questsOk (> MAX_QUESTS => Ablehnung des ganzen Standes).
    if (n >= MAX_QUESTS) break;
    // (H1) ID-LAENGE wie questsOk (KURZ): leere oder ueberlange Schluessel
    // haetten den Stand beim Laden gekippt.
    if (!KURZ(id, MAX_ID_LAENGE)) continue;
    const e = q[id];
    if (!isObj(e)) continue;
    // STATUS WIRD BEIM SCHREIBEN GEPRUEFT (Fixer R1, V-SPEC MINOR), genau wie
    // npcFlags2Kopie seine Werte typprueft. Vorher nahm serialize e.status
    // ungeprueft, waehrend deserialize->questsOk ihn gegen QUEST_STATUS haelt:
    // ein Fremd-Status waere geschrieben und beim naechsten Start haette der
    // GANZE Stand abgelehnt (deserialize -> null, kein FORTSETZEN). Lieber
    // EINEN Quest-Eintrag verlieren als den kompletten Spielstand.
    if (!QUEST_STATUS.includes(e.status)) continue;
    // (H3) ZAEHLER-BEREICH wie questsOk (0..MAX_ZAEHLER). Geklemmt statt
    // verworfen: der Quest-Eintrag bleibt erhalten, nur der Auswuchs faellt.
    out[id] = {
      status: e.status,
      zaehler: isInt(e.zaehler) ? klemme(e.zaehler, 0, MAX_ZAEHLER) : 0,
    };
    n += 1;
  }
  return out;
}

function npcFlags2Kopie(f) {
  const out = {};
  if (!isObj(f)) return out;
  let n = 0;
  for (const k of Object.keys(f)) {
    // (H5) DECKEL wie npcFlagsOk.
    if (n >= MAX_NPCFLAGS) break;
    // (H4) MARKEN-LAENGE wie npcFlagsOk (KURZ).
    if (!KURZ(k, MAX_ID_LAENGE)) continue;
    const v = f[k];
    // (H6) ZAHL-BEREICH wie npcFlagsOk: bool bleibt bool, int wird geklemmt.
    if (isBool(v)) out[k] = v;
    else if (isInt(v)) out[k] = klemme(v, 0, MAX_ZAEHLER);
    else continue;
    n += 1;
  }
  return out;
}

// (H7) EINTRAGS-PRUEFUNG + (H8) DECKEL wie gekauftOk. Vorher stand hier ein
// blankes `.slice()` in serialize: eine Zahl, ein leerer Text oder ein
// 33. Eintrag in runFlags.gekauft haette den Stand unladbar gemacht.
function gekauft2Kopie(g) {
  if (!Array.isArray(g)) return [];
  const out = [];
  for (const k of g) {
    if (out.length >= MAX_GEKAUFT) break;
    if (!KURZ(k, MAX_ID_LAENGE)) continue;
    out.push(k);
  }
  return out;
}

// ---------------------------------------------------------------------------
// PRUEFEN + DESERIALISIEREN
// ---------------------------------------------------------------------------

function itemOk(it) {
  if (!isObj(it)) return false;
  if (!SLOTS.includes(it.slot)) return false;
  if (typeof it.name !== 'string' || it.name.length === 0 || it.name.length > 32) return false;
  if (!isBool(it.rare)) return false;
  if (!Array.isArray(it.affixes) || it.affixes.length === 0 || it.affixes.length > 2) return false;
  for (const a of it.affixes) {
    if (!isObj(a)) return false;
    if (typeof a.stat !== 'string' || !Object.hasOwn(AFFIXES, a.stat)) return false;
    if (!isNum(a.value)) return false;
  }
  return true;
}

function invOk(inv) {
  if (!isObj(inv)) return false;
  if (!isInt(inv.capacity) || inv.capacity < 1 || inv.capacity > 64) return false;
  if (!Array.isArray(inv.items) || inv.items.length > inv.capacity) return false;
  if (!inv.items.every(itemOk)) return false;
  if (!isObj(inv.equipped)) return false;
  for (const slot of SLOTS) {
    const e = inv.equipped[slot];
    if (e === null || e === undefined) continue;
    if (!itemOk(e) || e.slot !== slot) return false;
  }
  if (!Array.isArray(inv.zelda)) return false;
  if (!inv.zelda.every((z) => ZELDA_KEYS.includes(z))) return false;
  if (!isInt(inv.pity) || inv.pity < 0) return false;
  if (!isBool(inv.newFlag)) return false;
  return true;
}

function progOk(prog) {
  return isObj(prog)
    && isInt(prog.xp) && prog.xp >= 0
    && isInt(prog.level) && prog.level >= 1
    && isInt(prog.hearts) && prog.hearts >= 0;
}

// §5 v2-FELDER: FEHLEN ist erlaubt (Default), VORHANDEN-und-falsch nicht.
// Die Zahlen stehen als MAX_*-Konstanten oben (eine Quelle fuer Leser und
// Schreiber) — die Bedingungen selbst sind unveraendert.

function questsOk(q) {
  if (q === undefined) return true;              // Default {}
  if (!isObj(q)) return false;
  const ids = Object.keys(q);
  if (ids.length > MAX_QUESTS) return false;
  return ids.every((id) => {
    if (!KURZ(id, MAX_ID_LAENGE)) return false;
    const e = q[id];
    return isObj(e)
      && QUEST_STATUS.includes(e.status)
      && isInt(e.zaehler) && e.zaehler >= 0 && e.zaehler <= MAX_ZAEHLER;
  });
}

function npcFlagsOk(f) {
  if (f === undefined) return true;              // Default {}
  if (!isObj(f)) return false;
  const ks = Object.keys(f);
  if (ks.length > MAX_NPCFLAGS) return false;
  return ks.every((k) => KURZ(k, MAX_ID_LAENGE)
    && (isBool(f[k]) || (isInt(f[k]) && f[k] >= 0 && f[k] <= MAX_ZAEHLER)));
}

function gekauftOk(g) {
  if (g === undefined) return true;              // Default []
  return Array.isArray(g) && g.length <= MAX_GEKAUFT && g.every((k) => KURZ(k, MAX_ID_LAENGE));
}

function dorfBesucheOk(n) {
  if (n === undefined) return true;              // Default 0
  return isInt(n) && n >= 0 && n <= MAX_DORFBESUCHE;
}

function runFlagsOk(rf) {
  return isObj(rf)
    && isBool(rf.bossDead)
    && Array.isArray(rf.openedChests)
    && rf.openedChests.every((k) => typeof k === 'string' && k.length > 0 && k.length <= 64)
    && questsOk(rf.quests)
    && npcFlagsOk(rf.npcFlags)
    && gekauftOk(rf.gekauft)
    && dorfBesucheOk(rf.dorfBesuche);
}

/**
 * §5 MIGRATION v1 -> v2. Bekommt ein GEPRUEFTES v1-Objekt (die Form, die
 * deserialize ohnehin baut) und liefert ein VOLLSTAENDIGES v2-Objekt.
 *
 * ZUSICHERUNG: fuer JEDEN gueltigen v1-Stand kommt ein Objekt zurueck, NIE
 * null — jedes v1-Feld wandert unveraendert durch, die vier neuen Felder
 * bekommen ihre Defaults (quest.js/neueRunFelder). Nur echter Muell (kein
 * Objekt) liefert null.
 */
export function migrateV1(v1) {
  if (!isObj(v1)) return null;
  if (!isObj(v1.runFlags)) return null;
  const neu = neueRunFelder();
  return {
    ...v1,
    v: SAVE_VERSION,
    runFlags: {
      ...v1.runFlags,
      quests: neu.quests,
      npcFlags: neu.npcFlags,
      gekauft: neu.gekauft,
      dorfBesuche: neu.dorfBesuche,
    },
  };
}

/**
 * @param {*} text JSON-Text (alles andere -> null)
 * @returns {Object|null} geprueftes Schema-v1-Objekt oder null
 */
export function deserialize(text) {
  if (typeof text !== 'string' || text.length === 0) return null;
  let d;
  try {
    d = JSON.parse(text);
  } catch {
    return null; // kaputtes JSON: HART ablehnen, nie werfen
  }
  if (!isObj(d)) return null;
  // §5 v2: BEIDE Schema-Versionen sind gueltig; alles andere (auch eine
  // fehlende Version) fliegt raus wie bisher.
  if (!SAVE_VERSIONEN.includes(d.v)) return null;
  if (typeof d.mapKey !== 'string' || !Object.hasOwn(MAPS, d.mapKey)) return null;
  if (!isObj(d.spawn) || !isNum(d.spawn.x) || !isNum(d.spawn.y)) return null;
  if (!isNum(d.hp) || d.hp <= 0) return null;       // hp 0 waere Sofort-Tod
  if (!isNum(d.gold) || d.gold < 0) return null;
  if (!isNum(d.potions) || d.potions < 0) return null;
  if (!invOk(d.inv)) return null;
  if (!progOk(d.prog)) return null;
  if (!runFlagsOk(d.runFlags)) return null;
  // maxHp darf nicht vorkommen — ein Stand mit maxHp stammt aus einem
  // fremden/aelteren Schema und wird abgelehnt (§3.1 "maxHp nie").
  if (Object.hasOwn(d, 'maxHp')) return null;
  // Die RUECKGABE IST IMMER v2-FOERMIG (Landkarte §5.3): ein v1-Stand laeuft
  // durch migrateV1, ein v2-Stand bekommt fehlende Felder als Default. Der
  // Aufrufer (main.js/ladeSpielstand) sieht deshalb nur EINE Form.
  const v2 = {
    v: SAVE_VERSION,
    mapKey: d.mapKey,
    spawn: { x: d.spawn.x, y: d.spawn.y },
    hp: d.hp,
    gold: d.gold,
    potions: d.potions,
    inv: {
      items: d.inv.items,
      equipped: {
        weapon: d.inv.equipped.weapon ?? null,
        armor: d.inv.equipped.armor ?? null,
        ring: d.inv.equipped.ring ?? null,
      },
      capacity: d.inv.capacity,
      zelda: d.inv.zelda,
      pity: d.inv.pity,
      newFlag: d.inv.newFlag,
    },
    prog: { xp: d.prog.xp, level: d.prog.level, hearts: d.prog.hearts },
    runFlags: {
      bossDead: d.runFlags.bossDead,
      openedChests: d.runFlags.openedChests.slice(),
    },
  };
  if (d.v === 1) {
    // v1 kommt NUR ueber die Migration herein (SPEC §5). migrateV1 kann fuer
    // ein hier gebautes Objekt nicht null liefern (runFlags steht), die
    // Pruefung bleibt trotzdem stehen: null waere ein stiller Datenverlust.
    const m = migrateV1(v2);
    return m || null;
  }
  // v2: die vier Felder feldweise uebernehmen, fehlende auf Default. Objekte
  // und Arrays werden KOPIERT (kein geteilter Zustand mit dem Storage-Text-
  // Parse; Muster openedChests.slice()).
  const std = neueRunFelder();
  v2.runFlags.quests = quests2Kopie(d.runFlags.quests ?? std.quests);
  v2.runFlags.npcFlags = npcFlags2Kopie(d.runFlags.npcFlags ?? std.npcFlags);
  v2.runFlags.gekauft = Array.isArray(d.runFlags.gekauft) ? d.runFlags.gekauft.slice() : std.gekauft;
  v2.runFlags.dorfBesuche = isInt(d.runFlags.dorfBesuche) ? d.runFlags.dorfBesuche : std.dorfBesuche;
  return v2;
}

/**
 * §3.1 LADEN = die FESTE carry-Reihenfolge aus main.js:314-319, nur mit dem
 * Snapshot statt mit dem vorigen Spieler. Die Reihenfolge ist BINDEND:
 * erst inv/prog (Referenzen), dann recalcStats (leitet maxHp aus Level und
 * Herzcontainern ab), dann hp (gegen das NEUE maxHp gekappt), gold, potions.
 * Wer hp vor recalcStats setzt, bekommt ein falsches Maximum.
 *
 * @param {Object} player frisch gebauter Spieler (buildWorld, carry = false)
 * @param {Object} snap   Rueckgabe von deserialize()
 */
export function applyToPlayer(player, snap) {
  player.inv = snap.inv;
  player.prog = snap.prog;
  player.recalcStats();
  player.hp = Math.min(snap.hp, player.maxHp);
  player.gold = snap.gold;
  player.potions = snap.potions;
  return player;
}

// ---------------------------------------------------------------------------
// §3.3 TITEL-MENUE — PURER REDUCER
// ---------------------------------------------------------------------------
//
// Das Menue existiert NUR, wenn ein gueltiger Spielstand vorliegt. Ohne
// Storage (Flusstests!) gibt es kein Menue, und der Titel bleibt byte-gleich
// zum Bestand: ein Tap/Enter startet wie bisher sofort einen frischen Run.
//
// "NEUES SPIEL verliert nichts" ist mit den §3.2-Hooks automatisch echt: vor
// dem ersten Kartenwechsel bzw. Respawn des neuen Runs feuert kein Hook, der
// alte Stand steht also noch im Storage (Review P2-M3).
//
// TEXTE: bewusst OHNE die Teilstrings, auf die die Flusstests sondieren
// ('GOLD', 'SIEG', 'GAME OVER', 'GRIMLIGHT', 'STUFE', 'AUSRUESTUNG').
export const TITLE_MENU_ITEMS = ['FORTSETZEN', 'NEUES SPIEL'];
// Trefferzonen in 320x180. Hoehe 18 px = 6,8 mm auf dem Referenzgeraet
// (1 interner px = 0,376 mm), Breite 128 px = 48 mm — bequem mit dem Daumen.
export const TITLE_MENU_ZONES = [
  { x: 96, y: 116, w: 128, h: 18 },
  { x: 96, y: 138, w: 128, h: 18 },
];

function inZone(p, z) {
  return p.x >= z.x && p.x <= z.x + z.w && p.y >= z.y && p.y <= z.y + z.h;
}

/**
 * PURER Reducer (kein Zustand im Modul).
 *
 * @param {number} cursor 0 = FORTSETZEN, 1 = NEUES SPIEL
 * @param {Object} ev { up, down, confirm, tap }  — up/down sind FLANKEN,
 *                    tap ist {x,y} des letzten touchstart oder null.
 * @returns {{cursor:number, action:(null|'continue'|'new')}}
 */
export function titleMenuStep(cursor, ev) {
  let c = cursor === 1 ? 1 : 0;
  const e = ev || {};
  // TAP HAT VORRANG vor confirm: jeder touchstart setzt input.confirm
  // (input.js:165), ein Tap neben dem Menue darf deshalb NICHT starten —
  // sonst waere die Auswahl wirkungslos (Review P1-m2-Muster).
  if (e.tap) {
    for (let i = 0; i < TITLE_MENU_ZONES.length; i++) {
      if (inZone(e.tap, TITLE_MENU_ZONES[i])) {
        return { cursor: i, action: i === 0 ? 'continue' : 'new' };
      }
    }
    return { cursor: c, action: null };
  }
  if (e.up) c = 0;
  if (e.down) c = 1;
  if (e.confirm) return { cursor: c, action: c === 0 ? 'continue' : 'new' };
  return { cursor: c, action: null };
}
