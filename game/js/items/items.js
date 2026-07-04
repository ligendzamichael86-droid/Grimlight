// Item-System Slice 2: 3 Ausruestungs-Slots, 8 Affixe mit FESTEN Werten
// (gewuerfelt wird nur WELCHES Affix), 2 Seltenheiten (Normal 1 Affix,
// Selten 2 verschiedene). Reines Daten/Funktions-Modul, Node-importierbar.
//
// Das Inventar ist plain JSON: keine Funktionen, keine Klassen am Objekt
// (S4-Save via JSON.stringify muss verlustfrei sein). Alle Operationen
// laufen ueber die Modul-Funktionen, Inventar-Zugriff ueber Array-Indizes
// (Items tragen bewusst KEIN id-Feld).
//
// Zentrale Regel (Spec Slice 2): Kampfcode liest NIE Affixe, immer nur
// player.stats (computeStats leitet sie ab).

export const BASE_STATS = {
  dmg: 1,
  maxHp: 6,
  speed: 90,
  reach: 12,
  knockMult: 1,
  knockTakenMult: 1,
  potionHeal: 2,
  pickupRadius: 12,
};

// Affix-Pool laut Spec 2.1. slot bindet an den Item-Slot, value ist fest,
// label ist die Anzeige im Inventar. speedMult wirkt multiplikativ auf
// speed (computeStats), alle anderen Werte addieren flach auf BASE_STATS.
export const AFFIXES = {
  dmg: { slot: 'weapon', value: 1, label: '+1 SCHADEN' },
  knockMult: { slot: 'weapon', value: 0.5, label: '+50% RUECKSTOSS' },
  reach: { slot: 'weapon', value: 4, label: '+4 REICHWEITE' },
  maxHp: { slot: 'armor', value: 2, label: '+1 HERZ' },
  knockTakenMult: { slot: 'armor', value: -0.5, label: 'STANDFEST' },
  speedMult: { slot: 'ring', value: 0.1, label: '+10% TEMPO' },
  potionHeal: { slot: 'ring', value: 2, label: '+1 HERZ JE TRANK' },
  pickupRadius: { slot: 'ring', value: 6, label: 'MAGNET' },
};

const SLOTS = ['weapon', 'armor', 'ring'];

// Feste Item-Namen je Slot und Seltenheit (Spec 2.1, max 16 Zeichen).
const NAMES = {
  weapon: { normal: 'Rostklinge', rare: 'Gräberklinge' },
  armor: { normal: 'Knochenharnisch', rare: 'Grabwachtpanzer' },
  ring: { normal: 'Siegelring', rare: 'Seelenring' },
};

// Affix-Schluessel eines Slot-Pools in AFFIXES-Reihenfolge.
function poolFor(slot) {
  return Object.keys(AFFIXES).filter((stat) => AFFIXES[stat].slot === slot);
}

// Wuerfelt ein Item. rng liefert [0,1); opts.slot erzwingt den Slot
// (sonst uniform), opts.rare erzwingt Selten (sonst Normal).
// Rueckgabe: { slot, name, rare, affixes: [{ stat, value }] }.
export function rollItem(rng = Math.random, opts = {}) {
  const slot = opts.slot || SLOTS[Math.floor(rng() * SLOTS.length)];
  const rare = opts.rare === true;
  const pool = poolFor(slot);
  const first = Math.floor(rng() * pool.length);
  const picks = [pool[first]];
  if (rare) {
    // Zweites Affix VERSCHIEDEN vom ersten (nie doppelt auf einem Item)
    const rest = pool.filter((stat, i) => i !== first);
    picks.push(rest[Math.floor(rng() * rest.length)]);
  }
  return {
    slot,
    name: rare ? NAMES[slot].rare : NAMES[slot].normal,
    rare,
    affixes: picks.map((stat) => ({ stat, value: AFFIXES[stat].value })),
  };
}

// Frisches Inventar (plain JSON, siehe Kopf-Kommentar).
export function createInventory() {
  return {
    items: [],
    equipped: { weapon: null, armor: null, ring: null },
    capacity: 7,
    zelda: [],
    pity: 0,
    newFlag: false,
  };
}

// Item in die Tasche legen. false wenn voll (Drop bleibt dann liegen).
export function addItem(inv, item) {
  if (inv.items.length >= inv.capacity) return false;
  inv.items.push(item);
  inv.newFlag = true;
  return true;
}

// Legt items[index] an: Tausch mit equipped[item.slot], das alte Item
// landet am SELBEN Index. Leerer Ziel-Slot: Eintrag per splice entfernen
// (Liste rueckt auf). Ungueltiger Index oder unbekannter Slot: false,
// keine Aenderung.
export function equipItem(inv, index) {
  const item = inv.items[index];
  if (!item || !(item.slot in inv.equipped)) return false;
  const old = inv.equipped[item.slot];
  inv.equipped[item.slot] = item;
  if (old) {
    inv.items[index] = old;
  } else {
    inv.items.splice(index, 1);
  }
  return true;
}

// Leitet die Spieler-Stats aus base + angelegten Items ab. Flache Affixe
// addieren; speedMult multiplikativ: speed = base.speed * (1 + Summe),
// auf 2 Nachkommastellen gerundet (90 * 1.1 ist in Doubles nicht exakt 99).
// knockTakenMult minimal 0.5.
export function computeStats(inv, base = BASE_STATS) {
  const stats = { ...base };
  let speedMultSum = 0;
  for (const slot of SLOTS) {
    const item = inv.equipped[slot];
    if (!item) continue;
    for (const a of item.affixes) {
      if (a.stat === 'speedMult') speedMultSum += a.value;
      else stats[a.stat] += a.value;
    }
  }
  stats.speed = Math.round(base.speed * (1 + speedMultSum) * 100) / 100;
  if (stats.knockTakenMult < 0.5) stats.knockTakenMult = 0.5;
  return stats;
}
