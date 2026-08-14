// MISCHER (SPEC_SLICE_5 Rev 2 §2.4, P1-M8/P2-M1). REINER REDUCER —
// KEIN window, KEIN localStorage, KEIN AudioContext, kein Modul-Zustand.
// main.js reicht nur STRINGS ueber storeLesen/storeSchreiben durch (§6.2,
// Schluessel grimlight.audio.v1); alles Rechnende steht hier und ist damit
// in Node pruefbar. Vorbild: game/js/items/save.js.
//
// Pflichtvertrag (§2.4):
//   defaultSettings()            -> {music, sfx}
//   parseSettings(rohString)     -> settings   (NIE ein Wurf, NIE null)
//   serializeSettings(settings)  -> string
//   toggle(settings, 'music'|'sfx') -> NEUES settings-Objekt
// Additiv (die Zahlen, mit denen das Summen-Gate A1(b) gerechnet ist):
//   BUS, sfxBusGain(n), leereStimmen(), allocVoice(), freeVoice(), aktiveStimmen()

const SCHEMA = 1;

/** Werkseinstellung: alles an (Spec §6.2 "Defaults an/an"). */
export function defaultSettings() {
  return { music: true, sfx: true };
}

/**
 * Liest den gespeicherten String. HART ablehnend wie save.js: kaputtes JSON,
 * fremde Schema-Version, falsche Typen -> Werkseinstellung. Nie ein Wurf,
 * damit ein zerschossener Eintrag das Spiel nicht am Boot hindert.
 */
export function parseSettings(roh) {
  const d = defaultSettings();
  if (typeof roh !== 'string' || roh.length === 0) return d;
  let o = null;
  try {
    o = JSON.parse(roh);
  } catch {
    return d;
  }
  if (!o || typeof o !== 'object' || Array.isArray(o)) return d;
  if (o.v !== SCHEMA) return d;
  // Fehlende Felder gelten als AN (§6.2 "Defaults an/an") — nur ein
  // ausdrueckliches false/0 schaltet ab. Ein halb geschriebener Eintrag darf
  // Michael nicht stumm machen.
  const an = (x) => !(x === false || x === 0);
  return { music: an(o.music), sfx: an(o.sfx) };
}

/** settings -> String fuer storeSchreiben. Roundtrip-stabil. */
export function serializeSettings(s) {
  const q = s && typeof s === 'object' ? s : defaultSettings();
  return JSON.stringify({ v: SCHEMA, music: q.music !== false, sfx: q.sfx !== false });
}

/** Schaltet EINEN Schluessel um und liefert ein NEUES Objekt (reiner Reducer). */
export function toggle(s, key) {
  const q = s && typeof s === 'object' ? s : defaultSettings();
  const neu = { music: q.music !== false, sfx: q.sfx !== false };
  if (key === 'music' || key === 'sfx') neu[key] = !neu[key];
  return neu;
}

// --------------------------------------------------------------- BUS-PEGEL
// Die Zahlen des Bus-Graphen aus §4.1 an EINER Stelle — main.js baut den
// Graphen, holt die Pegel aber hier, damit das Node-Gate A1(b) exakt das
// rechnet, was spaeter klingt.
//   master <- musicBusA + musicBusB   (Crossfade-Paar)
//   master <- sfxBus                  (Weltklaenge)
//   master <- uiBus                   (Menue; wird NIE geduckt, P2-B3)
export const BUS = {
  master: 0.8,          // Spec §4.1: Startwert
  music: 0.62,
  sfx: 0.75,            // BASISwert; der wirksame Pegel kommt aus sfxBusGain()
  ui: 0.5,
  duck: 0.32,           // Spec §4.3: Handpause/Inventar, -10 dB
  duckRampe: 0.15,      // Sekunden, linearRampToValueAtTime, hin wie zurueck
  maxStimmen: 12,       // Spec A1(c)
};

/**
 * Pegel des sfxBus in Abhaengigkeit von der Zahl gleichzeitiger Stimmen.
 * Grund (gemessen, Selbstbeleg A1(b)): WebAudio summiert LINEAR. Zwoelf
 * gleichzeitige Worst-Case-SFX auf festem Busgewinn sprengen jeden
 * Master-Gain, der die Effekte auch einzeln hoerbar laesst. 1/sqrt(n) haelt
 * die wahrgenommene Lautheit konstant und die Summe unter dem Gate.
 * main.js setzt den Wert bei jeder Aenderung der Stimmenzahl in der
 * Anker-Form (cancelScheduledValues + setValueAtTime + linearRamp 0,02 s).
 */
export function sfxBusGain(aktiveStimmenZahl) {
  const n = Math.min(BUS.maxStimmen, Math.max(1, Math.floor(aktiveStimmenZahl) || 1));
  return BUS.sfx / Math.sqrt(n);
}

// ------------------------------------------------------- STIMMENVERWALTUNG
// Reine Datenstruktur (P2-M1): "<= 12 SFX-Stimmen, aelteste fliegt".
// main.js haelt den Zustand und stoppt den zurueckgegebenen Knoten.

/** Leerer Stimmenzustand. */
export function leereStimmen(max = BUS.maxStimmen) {
  return { max: Math.max(1, max | 0), voices: [] };
}

/**
 * Belegt eine Stimme. Liefert IMMER ein neues Zustandsobjekt.
 * @returns {{state: Object, evicted: Object|null}} evicted = die aelteste
 *          Stimme, die main.js jetzt stoppen und trennen muss.
 */
export function allocVoice(state, id, t) {
  const s = state && Array.isArray(state.voices) ? state : leereStimmen();
  const voices = s.voices.slice();
  let evicted = null;
  while (voices.length >= s.max) evicted = voices.shift() || evicted;
  voices.push({ id, t });
  return { state: { max: s.max, voices }, evicted };
}

/** Gibt eine Stimme wieder frei (osc.onended). Liefert ein neues Objekt. */
export function freeVoice(state, id) {
  const s = state && Array.isArray(state.voices) ? state : leereStimmen();
  return { max: s.max, voices: s.voices.filter((v) => v.id !== id) };
}

/** Zahl der belegten Stimmen. */
export function aktiveStimmen(state) {
  return state && Array.isArray(state.voices) ? state.voices.length : 0;
}
