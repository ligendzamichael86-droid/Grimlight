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

import { MAPS } from '../world/maps.js';
import { AFFIXES } from './items.js';

export const SAVE_VERSION = 1;
export const SAVE_KEY = 'grimlight.save.v1';

const SLOTS = ['weapon', 'armor', 'ring'];
// Zelda-Schiene (props.js: 'boomerang' | 'boss_key'). Fremde Eintraege
// koennen den Zustand nicht rekonstruieren -> Ablehnung.
const ZELDA_KEYS = ['boomerang', 'boss_key'];

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const isInt = (v) => isNum(v) && Number.isInteger(v);
const isBool = (v) => typeof v === 'boolean';
const isObj = (v) => !!v && typeof v === 'object' && !Array.isArray(v);

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
  return JSON.stringify({
    v: SAVE_VERSION,
    mapKey,
    spawn: { x: spawn.x, y: spawn.y },
    // maxHp fehlt hier ABSICHTLICH (§3.1) — es wird beim Laden abgeleitet.
    hp: player.hp,
    gold: player.gold,
    potions: player.potions,
    inv: {
      items: inv.items,
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
    },
  });
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

function runFlagsOk(rf) {
  return isObj(rf)
    && isBool(rf.bossDead)
    && Array.isArray(rf.openedChests)
    && rf.openedChests.every((k) => typeof k === 'string' && k.length > 0 && k.length <= 64);
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
  if (d.v !== SAVE_VERSION) return null;            // fremde/fehlende Version
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
  return {
    v: d.v,
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
