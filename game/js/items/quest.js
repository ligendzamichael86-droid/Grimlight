// QUESTS (SPEC_SLICE_6 §4 + SLICE6_PHASE0 §1, BINDEND). PURE Zustandsmaschine,
// Node-importierbar, KEIN ctx, KEIN Import aus props.js, KEINE Beruehrung von
// portalBlocked (Review B4: genau daran fielen zwei Landkarte-Skizzen).
//
// EIGENTUEMER-SAUBER (SPEC §4): dieses Modul hat KEINE Trigger. Alle Ausloeser
// sind main.js-BEOBACHTER und rufen hier eine Funktion:
//   (a) Kill je Karte + Sorte -> questKillEvent(quests, mapKey, kind)
//       (main.js kennt currentMapKey; die AUDIO_STATE-WeakMap sieht den
//        die-Uebergang INKLUSIVE e.kind — Landkarte A §4.2)
//   (b) runFlags (bossDead)   -> questRunFlagEvent(quests, runFlags)
//   (c) Dialog-Abschluss      -> questDialogEvent(quests, npcFlags, npcId)
//                                bzw. questAnbieten/questAnnehmen/questAbgeben
//
// ZUSTAENDE (SPEC §4): 'angeboten' -> 'aktiv' -> 'erfuellt' -> 'belohnt'.
// Traeger: runFlags.quests = { <id>: { status, zaehler } } (v2-Feld, §5).
// Fehlt ein Eintrag, ist die Quest 'unbekannt' (noch nie angesprochen).
//
// TOD MACHT NICHTS UNLOESBAR (SPEC §4, deklariert): der Respawn laesst runFlags
// stehen, Zaehler ueberleben also. Beide Zaehl-Quests haben respawnende Ziele
// (GRAVEYARD fuehrt 6 skeleton fuer ein Ziel von 5; CATACOMBS fuehrt genau 3
// rust und baut sie bei jedem Betreten neu auf).

export const QUEST_STATUS = ['angeboten', 'aktiv', 'erfuellt', 'belohnt'];

// Die VIER Quests des Finalschnitts (SLICE6_PHASE0 §1). kinds und Kartenkeys
// sind gegen maps.js:622-699 geprueft: GRAVEYARD fuehrt 6 'skeleton',
// CATACOMBS genau 3 'rust'.
export const QUESTS = {
  // Q1 "Der letzte Docht" (Hedda, Tutorial): 5 Skelette auf dem FRIEDHOF.
  // Der Zaehler zaehlt NUR nach Annahme (deklariert).
  q1: { id: 'q1', geber: 'hedda', karte: 'GRAVEYARD', kind: 'skeleton', ziel: 5, gold: 15, trank: 1, goldStattTrank: 10 },
  // Q2 "Glut fuer die Esse" (Bran): die 3 Rostpanzer der KATAKOMBEN.
  // Belohnung schaltet Brans Selten-Chance frei (shop_ui liest das Flag).
  q2: { id: 'q2', geber: 'bran', karte: 'CATACOMBS', kind: 'rust', ziel: 3, gold: 10, trank: 0 },
  // Q3 (Corm, Hauptfaden): aktiv -> erfuellt via runFlags.bossDead -> belohnt.
  // NULL neue Mechanik.
  q3: { id: 'q3', geber: 'corm', flagge: 'bossDead', ziel: 1, gold: 40, trank: 0 },
  // Q4 "Was der Wind mitbringt" (Kette): mit Bran, Hedda und dem Torwaechter
  // sprechen (beliebige Reihenfolge). Der DRITTE nennt die vergessene Truhe in
  // der SCHATZKAMMER DER KATAKOMBEN (bestehende Truhe tc(36,15), maps.js:711)
  // — NICHT auf dem Friedhof: der hat NULL Truhen (Pruefer-Befund 3).
  q4: { id: 'q4', kette: ['bran', 'hedda', 'torwaechter'], ziel: 3, gold: 10, trank: 0 },
};

export const QUEST_IDS = Object.keys(QUESTS);

// Quest-Gold gesamt: 15 + 10 + 40 + 10 = 75 (SLICE6_PHASE0 §1).
export const QUEST_GOLD_GESAMT = QUEST_IDS.reduce((s, id) => s + QUESTS[id].gold, 0);

const istObj = (v) => !!v && typeof v === 'object' && !Array.isArray(v);

/** Frischer Quest-Traeger (v2-Default). */
export function createQuests() {
  return {};
}

/** Status einer Quest; 'unbekannt', solange nie angesprochen. */
export function questStatus(quests, id) {
  const q = istObj(quests) ? quests[id] : null;
  return istObj(q) && QUEST_STATUS.includes(q.status) ? q.status : 'unbekannt';
}

/** Zaehlerstand (0, solange es keinen Eintrag gibt). */
export function questZaehler(quests, id) {
  const q = istObj(quests) ? quests[id] : null;
  return istObj(q) && Number.isFinite(q.zaehler) ? q.zaehler : 0;
}

/** Restliche Ziele bis 'erfuellt' (fuer die Fortschritts-Saetze im Dialog). */
export function questRest(quests, id) {
  const def = QUESTS[id];
  if (!def) return 0;
  return Math.max(0, def.ziel - questZaehler(quests, id));
}

function setze(quests, id, status, zaehler) {
  const alt = quests[id];
  const neu = {
    status,
    zaehler: zaehler === undefined ? (istObj(alt) && Number.isFinite(alt.zaehler) ? alt.zaehler : 0) : zaehler,
  };
  quests[id] = neu;
  return neu;
}

/**
 * Die Quest wurde im Dialog ERWAEHNT (Angebot steht, aber nicht angenommen).
 * Ein bereits weiter fortgeschrittener Zustand wird NIE zurueckgedreht.
 */
export function questAnbieten(quests, id) {
  if (!QUESTS[id] || !istObj(quests)) return false;
  if (questStatus(quests, id) !== 'unbekannt') return false;
  setze(quests, id, 'angeboten', 0);
  return true;
}

/**
 * ANNAHME. Ab hier (und NUR ab hier) zaehlt questKillEvent (PHASE0 §1).
 * Q3 hat keine Zaehl-Bedingung, wird aber ueber denselben Weg 'aktiv'.
 *
 * runFlags ist OPTIONAL und schliesst ein Loch, in das die Verdrahtung sonst
 * sicher faellt: wer den Grabwaechter erschlaegt, BEVOR er mit Corm gesprochen
 * hat, nimmt Q3 danach an — und der bossDead-Beobachter feuert nie wieder.
 * Q3 haenge dann fuer immer auf 'aktiv'. Wird runFlags mitgegeben, prueft die
 * Annahme die Flaggen SOFORT nach und springt direkt auf 'erfuellt'.
 * (Dasselbe gilt nach dem Laden eines Standes mit bossDead:true — deshalb
 * ruft main.js questRunFlagEvent zusaetzlich einmal nach ladeSpielstand.)
 */
export function questAnnehmen(quests, id, runFlags) {
  if (!QUESTS[id] || !istObj(quests)) return false;
  const s = questStatus(quests, id);
  if (s !== 'unbekannt' && s !== 'angeboten') return false;
  setze(quests, id, 'aktiv', 0);
  if (istObj(runFlags)) questRunFlagEvent(quests, runFlags);
  return true;
}

/**
 * TRIGGER (a): ein Gegner der Sorte `kind` ist auf Karte `mapKey` gestorben.
 * Zaehlt NUR fuer Quests im Zustand 'aktiv'.
 * @returns {{geaendert:boolean, ids:string[], erfuellt:string[]}}
 */
export function questKillEvent(quests, mapKey, kind) {
  const ids = [];
  const erfuellt = [];
  if (!istObj(quests)) return { geaendert: false, ids, erfuellt };
  for (const id of QUEST_IDS) {
    const def = QUESTS[id];
    if (!def.kind || def.karte !== mapKey || def.kind !== kind) continue;
    if (questStatus(quests, id) !== 'aktiv') continue;
    const z = Math.min(def.ziel, questZaehler(quests, id) + 1);
    setze(quests, id, z >= def.ziel ? 'erfuellt' : 'aktiv', z);
    ids.push(id);
    if (z >= def.ziel) erfuellt.push(id);
  }
  return { geaendert: ids.length > 0, ids, erfuellt };
}

/**
 * TRIGGER (b): runFlags-Beobachter (heute nur Q3 ueber bossDead).
 * @returns {{geaendert:boolean, ids:string[], erfuellt:string[]}}
 */
export function questRunFlagEvent(quests, runFlags) {
  const ids = [];
  const erfuellt = [];
  if (!istObj(quests) || !istObj(runFlags)) return { geaendert: false, ids, erfuellt };
  for (const id of QUEST_IDS) {
    const def = QUESTS[id];
    if (!def.flagge) continue;
    if (runFlags[def.flagge] !== true) continue;
    if (questStatus(quests, id) !== 'aktiv') continue;
    setze(quests, id, 'erfuellt', def.ziel);
    ids.push(id);
    erfuellt.push(id);
  }
  return { geaendert: ids.length > 0, ids, erfuellt };
}

/**
 * TRIGGER (c): mit `npcId` wurde gesprochen (Dialog-Abschluss). Traegt die
 * Kette Q4 — die Reihenfolge ist frei, gezaehlt werden die DREI verschiedenen
 * Gespraechspartner ueber runFlags.npcFlags.
 * @returns {{geaendert:boolean, ids:string[], zaehler:number, letzter:boolean}}
 */
export function questDialogEvent(quests, npcFlags, npcId) {
  const ids = [];
  let zaehler = 0;
  let letzter = false;
  if (!istObj(quests) || !istObj(npcFlags)) return { geaendert: false, ids, zaehler, letzter };
  for (const id of QUEST_IDS) {
    const def = QUESTS[id];
    if (!Array.isArray(def.kette) || !def.kette.includes(npcId)) continue;
    const s = questStatus(quests, id);
    if (s === 'belohnt') continue;
    const marke = `${id}_${npcId}`;
    const neuerPartner = npcFlags[marke] !== true;
    if (neuerPartner) npcFlags[marke] = true;
    zaehler = def.kette.filter((n) => npcFlags[`${id}_${n}`] === true).length;
    const status = zaehler >= def.ziel ? 'erfuellt' : 'aktiv';
    if (neuerPartner || questStatus(quests, id) !== status) {
      setze(quests, id, status, zaehler);
      ids.push(id);
    }
    letzter = zaehler >= def.ziel;
  }
  return { geaendert: ids.length > 0, ids, zaehler, letzter };
}

/**
 * BELOHNUNG berechnen (PUR, aendert nichts).
 * Q1-Klausel PRAEZISE (SLICE6_PHASE0 §1, Pruefer-Befund 6): 1 Trank + 15;
 * ist der Beutel voll, ersetzen 10 den Trank -> 25 gesamt, nie weniger.
 * @param {Object} kontext { trankVoll:boolean }
 * @returns {{gold:number, trank:number}}
 */
export function questBelohnung(id, kontext = {}) {
  const def = QUESTS[id];
  if (!def) return { gold: 0, trank: 0 };
  if (def.trank > 0 && kontext.trankVoll === true) {
    return { gold: def.gold + (def.goldStattTrank || 0), trank: 0 };
  }
  return { gold: def.gold, trank: def.trank || 0 };
}

/**
 * ABGABE beim Quest-Geber. Setzt 'belohnt' und meldet, was auszuzahlen ist —
 * ZAHLT ABER NICHT SELBST (main.js besitzt den Spieler).
 * @returns {{ok:boolean, gold:number, trank:number}}
 */
export function questAbgeben(quests, id, kontext = {}) {
  if (!QUESTS[id] || !istObj(quests)) return { ok: false, gold: 0, trank: 0 };
  if (questStatus(quests, id) !== 'erfuellt') return { ok: false, gold: 0, trank: 0 };
  const b = questBelohnung(id, kontext);
  setze(quests, id, 'belohnt', QUESTS[id].ziel);
  return { ok: true, gold: b.gold, trank: b.trank };
}

/** true, sobald Q2 ausgezahlt ist: Brans Angebote wuerfeln ab jetzt selten. */
export function seltenFrei(quests) {
  return questStatus(quests, 'q2') === 'belohnt';
}

// ---------------------------------------------------------------------------
// v2-FELDER (SPEC §5) — DEFAULTS UND RESET
// ---------------------------------------------------------------------------

/** Die vier neuen v2-Felder auf ihren Default-Werten. */
export function neueRunFelder() {
  return { quests: {}, npcFlags: {}, gekauft: [], dorfBesuche: 0 };
}

/**
 * Fehlende v2-Felder ergaenzen (idempotent). Vorhandene bleiben unberuehrt.
 * Damit laedt ein v2-Stand OHNE die Felder fehlerfrei (A1, Review M1).
 */
export function sichereRunFelder(runFlags) {
  if (!istObj(runFlags)) return runFlags;
  if (!istObj(runFlags.quests)) runFlags.quests = {};
  if (!istObj(runFlags.npcFlags)) runFlags.npcFlags = {};
  if (!Array.isArray(runFlags.gekauft)) runFlags.gekauft = [];
  if (!Number.isFinite(runFlags.dorfBesuche)) runFlags.dorfBesuche = 0;
  return runFlags;
}

/**
 * resetRun-SEMANTIK (SPEC §5, deklariert): ALLE VIER neuen Felder sind
 * RUN-GEBUNDEN und werden geleert — Quests, NPC-Gespraechsmarken, Einmalwaren
 * und der Dorfbesuchs-Zaehler. Ein neuer Run beginnt mit einem leeren Dorf.
 * main.js ruft das in resetRun (main.js:1205-1212) auf.
 */
export function leereRunFelder(runFlags) {
  if (!istObj(runFlags)) return runFlags;
  runFlags.quests = {};
  runFlags.npcFlags = {};
  runFlags.gekauft = [];
  runFlags.dorfBesuche = 0;
  return runFlags;
}
