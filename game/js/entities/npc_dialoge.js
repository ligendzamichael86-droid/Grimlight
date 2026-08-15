// DIALOGTEXTE GRAMFELD (SPEC_SLICE_6 §2.2 + SLICE6_PHASE0 §1). REINES
// DATENMODUL: keine Importe, kein ctx, kein window/document — Node-importierbar.
// dialogFuer() waehlt nur AUS; gerechnet wird nichts, gespeichert wird nichts.
//
// TON (GDD.md:17,38-40; Landkarte B §5.2): Tristram, nicht Kakariko. Verfallen
// statt gemuetlich, zwei drei Bewohner, kein Marktgewimmel, kein Humor. Jeder
// sagt wenig und meint es ernst.
//
// SPERRLISTE (§0.4, BINDEND): kein Text hier enthaelt einen Teilstring der
// Flusstest-Sonden, und keiner beginnt mit der Waehrungs-Sonde. Deshalb heisst
// Waehrung im Dorf durchgehend "Muenzen" und die Bestaetigungszeile der
// Dialogbox ist ein RECHTECK statt eines Wortes (dialog.js). Geprueft wird das
// programmatisch gegen die Sondenliste aus tools/smoke_test.mjs, nicht per
// Augenmass.
//
// EFFEKTE sind reine Datensaetze fuer main.js (Phase 2). dialog.js reicht sie
// nur durch, dieses Modul fuehrt sie NICHT aus. Sie werden in ARRAY-REIHENFOLGE
// angewandt:
//   { typ: 'npc_gesprochen', npc }      -> quest.js questDialogEvent (Q4-Kette)
//   { typ: 'quest_anbieten',  id }      -> quest.js questAnbieten
//   { typ: 'quest_annehmen',  id }      -> quest.js questAnnehmen
//   { typ: 'quest_abgeben',   id }      -> quest.js questAbgeben + Auszahlung
//   { typ: 'shop', haendler }           -> main.js oeffnet den State 'shop'

export const NPC_NAMEN = {
  bran: 'BRAN DER SCHMIED',
  hedda: 'ALTE HEDDA',
  corm: 'VATER CORM',
  mile: 'MILE',
  torwaechter: 'DER TORWAECHTER',
};

// Q4-Kette (SLICE6_PHASE0 §1): beliebige Reihenfolge, der DRITTE verraet die
// Truhe. Die Marken heissen wie in quest.js: `q4_<npcId>`.
export const WIND_KETTE = ['bran', 'hedda', 'torwaechter'];

function status(kontext, id) {
  const q = kontext && kontext.quests ? kontext.quests[id] : null;
  return q && typeof q.status === 'string' ? q.status : 'unbekannt';
}

function rest(kontext, id, ziel) {
  const q = kontext && kontext.quests ? kontext.quests[id] : null;
  const z = q && Number.isFinite(q.zaehler) ? q.zaehler : 0;
  return Math.max(0, ziel - z);
}

function windMarke(npcId) {
  return `q4_${npcId}`;
}

function windGesprochen(kontext, npcId) {
  const f = kontext && kontext.npcFlags ? kontext.npcFlags : {};
  return f[windMarke(npcId)] === true;
}

function windZahl(kontext) {
  const f = kontext && kontext.npcFlags ? kontext.npcFlags : {};
  return WIND_KETTE.filter((n) => f[windMarke(n)] === true).length;
}

// Was dieser NPC beim JETZIGEN Gespraech zur Wind-Kette beitraegt.
// 'nichts' | 'neu' (erster/zweiter Partner) | 'dritter' (verraet die Truhe)
function windRolle(kontext, npcId) {
  if (!WIND_KETTE.includes(npcId)) return 'nichts';
  if (status(kontext, 'q4') === 'belohnt') return 'nichts';
  if (windGesprochen(kontext, npcId)) return 'nichts';
  return windZahl(kontext) >= WIND_KETTE.length - 1 ? 'dritter' : 'neu';
}

// Die zwei Wind-Absaetze. Der DRITTE nennt die Truhe in der SCHATZKAMMER DER
// KATAKOMBEN (bestehende Truhe, maps.js:711) — NICHT auf dem Friedhof: der hat
// nachweislich NULL Truhen (Pruefer-Befund 3, SLICE6_PHASE0 §1).
const WIND_NEU = {
  bran: 'Noch etwas. Seit drei Naechten wirft der Wind Russ gegen meine Tuer, und der Russ kommt von unten. Frag die anderen. Ich rede zu wenig.',
  hedda: 'Und hoer zu. Der Wind hat in der Nacht etwas gesagt, ich habe die Haelfte verstanden. Frag noch jemanden, dann passt es vielleicht zusammen.',
  torwaechter: 'Eins noch. Der Wind kommt hier nicht vom Feld, er kommt aus dem Boden. Frag im Dorf, wer nachts wach liegt.',
};
// BEKANNTE SCHWAECHE, DEKLARIERT (Fixer R1 nach V-SPEC MINOR — KEIN Codefehler):
// wer die Katakomben schon durch hat, hat die Truhe tc(36,15) meist geoeffnet,
// und main.js:1134-1137 filtert sie ueber runFlags.openedChests DAUERHAFT weg
// (SLICE6_PHASE0 §2 Befund 1). Der Absatz zeigt dann auf eine Truhe, die es
// nicht mehr gibt. Das ist spec-konform: SLICE6_PHASE0 §1 nennt Q4 ausdruecklich
// "reiner Hinweistext", die 10 Gold Questlohn fliessen unabhaengig davon. Eine
// Bedingung auf openedChests braeuchte einen NEUEN Kontextwert und waere eine
// Scope-Erweiterung — sie gehoert nicht in Slice 6 Phase 1.
const WIND_DRITTER = 'Jetzt passt es zusammen. Tief in den Katakomben liegt eine Schatzkammer, und in ihrer Ecke steht eine Truhe, die seit dem Sterben niemand mehr angeruehrt hat. Die Wachen davor stehen noch. Nimm zehn Muenzen fuer den Weg und geh vorsichtig.';

// Haengt den Wind-Absatz an einen Begruessungstext und liefert die passenden
// Effekte. Der Absatz wird eine eigene SEITE (dialog.js bricht an '\n' um und
// schneidet nach 3 Zeilen).
function mitWind(kontext, npcId, text, effekte) {
  const rolle = windRolle(kontext, npcId);
  if (rolle === 'nichts') {
    return {
      text,
      effekte: WIND_KETTE.includes(npcId)
        ? [{ typ: 'npc_gesprochen', npc: npcId }].concat(effekte)
        : effekte.slice(),
    };
  }
  const absatz = rolle === 'dritter' ? WIND_DRITTER : WIND_NEU[npcId];
  const eff = [{ typ: 'npc_gesprochen', npc: npcId }];
  if (rolle === 'dritter') eff.push({ typ: 'quest_abgeben', id: 'q4' });
  return { text: `${text}\n${absatz}`, effekte: eff.concat(effekte) };
}

// ---------------------------------------------------------------------------
// BRAN — Schmiede. Q2 "Glut fuer die Esse" + Auslage.
// ---------------------------------------------------------------------------
function baumBran(kontext) {
  const s = status(kontext, 'q2');
  const knoten = {};
  let esseOption = null;

  if (s === 'unbekannt' || s === 'angeboten') {
    esseOption = { text: 'DIE ESSE', ziel: 'q2_angebot' };
    knoten.q2_angebot = {
      name: NPC_NAMEN.bran,
      text: 'Meine Esse frisst mehr, als das Dorf noch hergibt. Unten in den Katakomben stehen drei rostige Panzer und starren Waende an. In ihren Rippen sitzt Glut, die nie ausgegangen ist. Hol sie mir.',
      effekte: [{ typ: 'quest_anbieten', id: 'q2' }],
      optionen: [
        { text: 'ICH GEHE', ziel: 'q2_ja', effekte: [{ typ: 'quest_annehmen', id: 'q2' }] },
        { text: 'SPAETER', ziel: 'q2_nein' },
      ],
    };
    knoten.q2_ja = {
      name: NPC_NAMEN.bran,
      text: 'Drei. Nicht zwei. Und komm zurueck, bevor die Esse kalt ist.',
    };
    knoten.q2_nein = {
      name: NPC_NAMEN.bran,
      text: 'Dann friert das Feuer eben noch eine Nacht.',
    };
  } else if (s === 'aktiv') {
    const r = rest(kontext, 'q2', 3);
    esseOption = { text: 'DIE ESSE', ziel: 'q2_stand' };
    knoten.q2_stand = {
      name: NPC_NAMEN.bran,
      text: `Noch ${r} von den drei stehen da unten und rosten weiter. Die Glut wartet nicht ewig auf dich.`,
    };
  } else if (s === 'erfuellt') {
    esseOption = { text: 'DIE GLUT', ziel: 'q2_abgabe' };
    knoten.q2_abgabe = {
      name: NPC_NAMEN.bran,
      text: 'Du riechst nach kaltem Rost. Gut. Die Esse hat wieder Farbe, und meine Auslage auch. Nimm zehn Muenzen und sieh nach, was ich seither aus dem Feuer hole.',
      effekte: [{ typ: 'quest_abgeben', id: 'q2' }],
    };
  }

  const optionen = [];
  if (esseOption) optionen.push(esseOption);
  optionen.push({ text: 'DIE AUSLAGE', ziel: 'laden' });
  optionen.push({ text: 'GENUG', ziel: 'schluss' });

  const gruss = s === 'belohnt'
    ? 'Das Feuer haelt. Solange es haelt, halte ich auch.'
    : 'Der Hammer liegt seit dem Sterben oefter still als in der Hand. Was willst du?';
  const kopf = mitWind(kontext, 'bran', gruss, []);

  knoten.start = {
    name: NPC_NAMEN.bran,
    text: kopf.text,
    effekte: kopf.effekte,
    optionen,
  };
  knoten.laden = {
    name: NPC_NAMEN.bran,
    text: 'Sieh es dir an. Ich handle auch in die andere Richtung, wenn dir etwas zu schwer geworden ist.',
    effekte: [{ typ: 'shop', haendler: 'bran' }],
  };
  knoten.schluss = {
    name: NPC_NAMEN.bran,
    text: 'Halt dich vom Westtor fern, wenn es dunkler wird.',
  };
  return { start: 'start', knoten };
}

// ---------------------------------------------------------------------------
// HEDDA — Kate am Herdfeuer. Q1 "Der letzte Docht" (Tutorial) + Vorrat.
// ---------------------------------------------------------------------------
function baumHedda(kontext) {
  const s = status(kontext, 'q1');
  const knoten = {};
  let dochtOption = null;

  if (s === 'unbekannt' || s === 'angeboten') {
    dochtOption = { text: 'DER DOCHT', ziel: 'q1_angebot' };
    knoten.q1_angebot = {
      name: NPC_NAMEN.hedda,
      text: 'Mein letzter Docht brennt seit drei Naechten. Draussen zwischen den Graebern klappern fuenf Knochenmaenner, und in ihren Rippen sitzt Talg. Bring ihn mir, dann brennt hier noch eine Woche Licht.',
      effekte: [{ typ: 'quest_anbieten', id: 'q1' }],
      optionen: [
        { text: 'ICH TUE ES', ziel: 'q1_ja', effekte: [{ typ: 'quest_annehmen', id: 'q1' }] },
        { text: 'NICHT HEUTE', ziel: 'q1_nein' },
      ],
    };
    knoten.q1_ja = {
      name: NPC_NAMEN.hedda,
      text: 'Fuenf. Zaehl mit, das Dunkel zaehlt auch mit.',
    };
    knoten.q1_nein = {
      name: NPC_NAMEN.hedda,
      text: 'Dann sitze ich eben im Dunkeln. Das kann ich inzwischen.',
    };
  } else if (s === 'aktiv') {
    const r = rest(kontext, 'q1', 5);
    dochtOption = { text: 'DER DOCHT', ziel: 'q1_stand' };
    knoten.q1_stand = {
      name: NPC_NAMEN.hedda,
      text: `Noch ${r} von fuenf. Der Docht sinkt schneller, als du gehst.`,
    };
  } else if (s === 'erfuellt') {
    dochtOption = { text: 'DER TALG', ziel: 'q1_abgabe' };
    knoten.q1_abgabe = {
      name: NPC_NAMEN.hedda,
      text: 'Da. Das reicht fuer viele Naechte. Nimm den Trank und fuenfzehn Muenzen; ist dein Guertel voll, nimm zehn Muenzen mehr statt des Glases.',
      effekte: [{ typ: 'quest_abgeben', id: 'q1' }],
    };
  }

  const optionen = [];
  if (dochtOption) optionen.push(dochtOption);
  optionen.push({ text: 'DEIN VORRAT', ziel: 'laden' });
  optionen.push({ text: 'GEH SCHLAFEN', ziel: 'schluss' });

  const gruss = s === 'belohnt'
    ? 'Das Licht steht wieder gerade. Setz dich, wenn du blutest.'
    : 'Komm naeher ans Feuer. Weiter weg friert es dich sowieso.';
  const kopf = mitWind(kontext, 'hedda', gruss, []);

  knoten.start = {
    name: NPC_NAMEN.hedda,
    text: kopf.text,
    effekte: kopf.effekte,
    optionen,
  };
  knoten.laden = {
    name: NPC_NAMEN.hedda,
    text: 'Ich habe Kraeuter und Nadel. Beides kostet, seit das Dorf nichts mehr traegt.',
    effekte: [{ typ: 'shop', haendler: 'hedda' }],
  };
  knoten.schluss = {
    name: NPC_NAMEN.hedda,
    text: 'Ich schlafe nicht mehr. Das haben mir die Naechte abgewoehnt.',
  };
  return { start: 'start', knoten };
}

// ---------------------------------------------------------------------------
// CORM — Kuester der Kapelle. Q3, der Hauptfaden (Boss).
// Er benennt den Wachenden unter dem Chor, ohne seinen Namen zu sagen: der
// steht auf der Sonden-Sperrliste (§0.4) und gehoert dem Toast in main.js.
// ---------------------------------------------------------------------------
function baumCorm(kontext) {
  const s = status(kontext, 'q3');
  const knoten = {};

  if (s === 'unbekannt' || s === 'angeboten') {
    knoten.start = {
      name: NPC_NAMEN.corm,
      text: 'Unter dem Chor liegt ein Sarg, den vier Naegel halten. Was darin wach geworden ist, hat uns zwei Totengraeber genommen und den dritten das Reden.',
      effekte: [{ typ: 'quest_anbieten', id: 'q3' }],
      optionen: [
        { text: 'ICH GEHE HIN', ziel: 'ja', effekte: [{ typ: 'quest_annehmen', id: 'q3' }] },
        { text: 'NOCH NICHT', ziel: 'nein' },
      ],
    };
    knoten.ja = {
      name: NPC_NAMEN.corm,
      text: 'Dann nimm das Licht mit hinunter. Hier oben braucht es niemand mehr.',
    };
    knoten.nein = {
      name: NPC_NAMEN.corm,
      text: 'Es hat Zeit. Es hat sehr viel Zeit. Das ist ja das Schlimme.',
    };
    return { start: 'start', knoten };
  }
  if (s === 'aktiv') {
    knoten.start = {
      name: NPC_NAMEN.corm,
      text: 'Es liegt noch da unten. Ich hoere es durch den Boden, wenn die Glocke schweigt.',
    };
    return { start: 'start', knoten };
  }
  if (s === 'erfuellt') {
    knoten.start = {
      name: NPC_NAMEN.corm,
      text: 'Der Boden schweigt. Zum ersten Mal seit vier Jahren schweigt der Boden. Nimm, was die Kapelle noch hat: vierzig Muenzen. Mehr ist uns nicht geblieben.',
      effekte: [{ typ: 'quest_abgeben', id: 'q3' }],
    };
    return { start: 'start', knoten };
  }
  knoten.start = {
    name: NPC_NAMEN.corm,
    text: 'Das Dorf schlaeft ruhiger. Es weiss nur nicht, warum, und ich sage es ihm nicht.',
  };
  return { start: 'start', knoten };
}

// ---------------------------------------------------------------------------
// MILE — Botenkind am Marktstand. Ein Fundstueck je Besuch, zum Wucherpreis.
// ---------------------------------------------------------------------------
function baumMile() {
  return {
    start: 'start',
    knoten: {
      start: {
        name: NPC_NAMEN.mile,
        text: 'Ich verkaufe, was die Leute liegen lassen. Frag nicht, wo sie es liegen gelassen haben.',
        optionen: [
          { text: 'ZEIG HER', ziel: 'laden' },
          { text: 'LASS DAS', ziel: 'schluss' },
        ],
      },
      laden: {
        name: NPC_NAMEN.mile,
        text: 'Ein Stueck. Mehr habe ich heute nicht. Und der Preis steht fest.',
        effekte: [{ typ: 'shop', haendler: 'mile' }],
      },
      schluss: {
        name: NPC_NAMEN.mile,
        text: 'Dann eben morgen. Ich bin immer hier, ich darf ja nicht raus.',
      },
    },
  };
}

// ---------------------------------------------------------------------------
// TORWAECHTER — Osttor. DREI SAETZE (SPEC-Vorgabe), sonst nur die Wind-Kette.
// ---------------------------------------------------------------------------
function baumTor(kontext) {
  const drei = 'Das Tor bleibt offen; zuhalten wuerde nichts mehr nuetzen. Hinter der Mauer faengt der Friedhof an, und der Friedhof hat kein Ende. Kommst du zurueck, klopf zweimal, damit ich weiss, dass du noch du bist.';
  const kopf = mitWind(kontext, 'torwaechter', drei, []);
  return {
    start: 'start',
    knoten: {
      start: { name: NPC_NAMEN.torwaechter, text: kopf.text, effekte: kopf.effekte },
    },
  };
}

const BAEUME = {
  bran: baumBran,
  hedda: baumHedda,
  corm: baumCorm,
  mile: baumMile,
  torwaechter: baumTor,
};

/**
 * Dialogbaum fuer einen NPC im aktuellen Spielstand.
 * @param {string} npcId
 * @param {Object} kontext { quests, npcFlags }  (beides aus runFlags, v2)
 * @returns {Object|null} { start, knoten } fuer dialog.js
 */
export function dialogFuer(npcId, kontext = {}) {
  const bauer = BAEUME[npcId];
  return bauer ? bauer(kontext) : null;
}

/**
 * Traegt dieser NPC gerade eine Quest, die zu holen oder abzugeben ist?
 * main.js zeichnet daraus die '!'-Blase (npcs.js drawNpc, n.blase).
 */
export function questGeber(npcId, kontext = {}) {
  const offen = (id) => {
    const s = status(kontext, id);
    return s === 'unbekannt' || s === 'angeboten' || s === 'erfuellt';
  };
  if (npcId === 'hedda') return offen('q1');
  if (npcId === 'bran') return offen('q2');
  if (npcId === 'corm') return offen('q3');
  return false;
}
