// DIALOG (SPEC_SLICE_6 §2.2). PURER REDUCER — kein Zustand im Modul, kein ctx,
// Node-importierbar. Muster: titleMenuStep (items/save.js:244-262), inklusive
// der Regel TAP HAT VORRANG vor confirm (jeder touchstart setzt input.confirm,
// input.js:165 — ein Tap neben der Auswahl darf nichts ausloesen).
//
// UMBRUCH IST ZEICHENBASIERT (§0.4, bindend): 48 Zeichen je Zeile bei 4,8 px
// je Zeichen. KEIN measureText — '8px monospace' ist plattformabhaengig, und
// die Flusstest-Stubs kennen measureText gar nicht.
//
// BOX-LAGE (Rev 2 §2.2, Review M2 beider Linsen): x 16..304, y 76..128 —
// UNTER dem HUD und UEBER allen Touch-Zonen (A bei y 148 r 16, B bei 144 r 12,
// W bei 102 r 14). Die Rev-1-Lage y 120..172 lag deckungsgleich auf A und B.
// Im State 'dialog' bekommen A/B/W zusaetzlich visible:false (main.js).
//
// ZEICHNEN IST NICHT SACHE DIESES MODULS. dialogAnsicht() liefert das fertige
// Render-Modell (Zeilen, Optionen samt Zonen, Marken) als reine Daten; main.js
// malt daraus mit fillRect + fillText auf den HAUPT-ctx (§0.4: kein
// strokeRect, keine Zweit-Canvas).

// --- GEOMETRIE (exportierte Konstanten, A1-Gate Shop/Dialog) ----------------
export const DIALOG_BOX = { x: 16, y: 76, w: 288, h: 52, x1: 304, y1: 128 };
export const DIALOG_ZEICHEN_PX = 4.8;
export const DIALOG_ZEILE_MAX = 48;
export const DIALOG_ZEILEN_JE_SEITE = 3;

// Options-Zonen im OBEREN BOXDRITTEL (SPEC §2.2: nie im System-Gestenbereich
// unten). Oberes Drittel = y 76 .. 93,33; die Zonen liegen bei 77..93.
// Hoehe 16 px = 6,02 mm auf dem Referenzgeraet (MM_PRO_PX 0,3764) — ueber dem
// 6-mm-Gate; Breite 88 px = 33,1 mm.
export const DIALOG_OPTION_ZONEN = [
  { x: 20, y: 77, w: 88, h: 16 },
  { x: 116, y: 77, w: 88, h: 16 },
  { x: 212, y: 77, w: 88, h: 16 },
];
export const DIALOG_OPTIONEN_MAX = 3;

// Text-Grundlinien. Ohne Optionen traegt die erste Zeile den Sprechernamen.
export const DIALOG_NAME_Y = 80;
export const DIALOG_TEXT_Y = [92, 102, 112];
export const DIALOG_TEXT_Y_OPTIONEN = [96, 106, 116];
// Die "es geht weiter"-Marke ist ein RECHTECK, kein Text: jeder neue
// fillText-Zug ist eine Sonde, und 'WEITER' steht ausdruecklich auf der
// Sperrliste (§0.4).
export const DIALOG_WEITER_MARKE = { x: 294, y: 120, w: 6, h: 4 };

function inZone(p, z) {
  return p.x >= z.x && p.x <= z.x + z.w && p.y >= z.y && p.y <= z.y + z.h;
}

// ---------------------------------------------------------------------------
// UMBRUCH + SEITEN
// ---------------------------------------------------------------------------

/**
 * Wortweiser Umbruch auf max Zeichen je Zeile (Default 48). Woerter, die
 * laenger als eine Zeile sind, werden hart getrennt (sonst liefe der Text
 * aus der Box).
 * @returns {string[]}
 */
export function umbrechen(text, max = DIALOG_ZEILE_MAX) {
  const zeilen = [];
  const roh = String(text == null ? '' : text);
  for (const absatz of roh.split('\n')) {
    let zeile = '';
    for (let wort of absatz.split(' ')) {
      if (wort === '') continue;
      while (wort.length > max) {
        if (zeile !== '') { zeilen.push(zeile); zeile = ''; }
        zeilen.push(wort.slice(0, max));
        wort = wort.slice(max);
      }
      if (zeile === '') zeile = wort;
      else if (zeile.length + 1 + wort.length <= max) zeile += ` ${wort}`;
      else { zeilen.push(zeile); zeile = wort; }
    }
    zeilen.push(zeile);
  }
  return zeilen;
}

/** Zeilen in Seiten a DIALOG_ZEILEN_JE_SEITE schneiden. Nie leer. */
export function seitenAus(text, proSeite = DIALOG_ZEILEN_JE_SEITE) {
  const zeilen = umbrechen(text);
  const seiten = [];
  for (let i = 0; i < zeilen.length; i += proSeite) seiten.push(zeilen.slice(i, i + proSeite));
  return seiten.length > 0 ? seiten : [['']];
}

/** Breite einer Zeile in px, zeichenbasiert (KEIN measureText, §0.4). */
export function textBreite(zeile) {
  return String(zeile == null ? '' : zeile).length * DIALOG_ZEICHEN_PX;
}

// ---------------------------------------------------------------------------
// ZUSTAND
// ---------------------------------------------------------------------------
//
// Baum: { start: <id>, knoten: { <id>: KNOTEN } }
// KNOTEN: { name, text, optionen?: [{ text, ziel, effekte? }], ziel?, effekte? }
//   - optionen: max 3 (DIALOG_OPTIONEN_MAX); mehr werden abgeschnitten
//   - ziel fehlt und keine optionen -> der Knoten BEENDET den Dialog
//   - effekte: freie Datensaetze fuer den Aufrufer (main.js/quest.js), dieses
//     Modul interpretiert sie NIE

function knotenVon(baum, id) {
  return (baum && baum.knoten && baum.knoten[id]) || null;
}

function optionenVon(knoten) {
  const o = knoten && Array.isArray(knoten.optionen) ? knoten.optionen : [];
  return o.slice(0, DIALOG_OPTIONEN_MAX);
}

/**
 * Neuer Dialogzustand am Startknoten.
 * @param {Object} baum
 * @param {string} [startId]
 * @returns {Object} zustand (plain data)
 */
export function dialogStart(baum, startId) {
  const id = startId || (baum && baum.start) || 'start';
  return zustandFuer(baum, id, []);
}

function zustandFuer(baum, id, gesammelt) {
  const k = knotenVon(baum, id);
  if (!k) {
    return { baum, knotenId: id, name: '', seiten: [['']], seite: 0, optionen: [], cursor: 0, fertig: true, effekte: gesammelt };
  }
  return {
    baum,
    knotenId: id,
    name: k.name || '',
    seiten: seitenAus(k.text || ''),
    seite: 0,
    optionen: optionenVon(k).map((o) => ({ text: o.text, ziel: o.ziel || null, effekte: o.effekte || [] })),
    cursor: 0,
    fertig: false,
    effekte: gesammelt,
  };
}

function kopie(z, aenderungen) {
  return { ...z, ...aenderungen };
}

/**
 * PURER Reducer. Gibt IMMER ein neues Zustandsobjekt zurueck.
 *
 * @param {Object} zustand aus dialogStart / vorherigem Schritt
 * @param {Object} ev { confirm, tap, links, rechts, hoch, runter }
 *                 confirm/links/rechts/hoch/runter sind FLANKEN,
 *                 tap ist {x,y} des letzten touchstart oder null.
 * @returns {{zustand:Object, aktion:(null|'seite'|'wahl'|'ende'),
 *            effekte:Array, schluckAngriff:boolean, schluckTrank:boolean}}
 *
 * SCHLUCK-RUECKGABE (§0.3 "TRANK-Schlucker im Dialog", Muster attackSwallow
 * main.js:1688-1691): jeder verbrauchte Eingabe-Impuls meldet schluckAngriff;
 * das Dialog-ENDE meldet zusaetzlich schluckTrank, damit der noch gehaltene
 * B-Pegel nach dem Schliessen keinen Trank leert.
 */
export function dialogSchritt(zustand, ev) {
  const z = zustand;
  const e = ev || {};
  const leer = { zustand: z, aktion: null, effekte: [], schluckAngriff: false, schluckTrank: false };
  if (!z || z.fertig) return leer;

  const hatOptionen = z.optionen.length > 0;
  const letzteSeite = z.seite >= z.seiten.length - 1;

  // --- OPTIONEN: Tap-Vorrang, dann Cursor, dann confirm --------------------
  if (hatOptionen && letzteSeite) {
    if (e.tap) {
      for (let i = 0; i < z.optionen.length; i++) {
        if (inZone(e.tap, DIALOG_OPTION_ZONEN[i])) return waehle(z, i);
      }
      // Tap ausserhalb jeder Options-Zone: NICHTS passiert (Review P1-m2).
      return { ...leer, zustand: z, schluckAngriff: true };
    }
    let c = z.cursor;
    if (e.links || e.hoch) c = Math.max(0, c - 1);
    if (e.rechts || e.runter) c = Math.min(z.optionen.length - 1, c + 1);
    if (c !== z.cursor) {
      return { zustand: kopie(z, { cursor: c }), aktion: null, effekte: [], schluckAngriff: false, schluckTrank: false };
    }
    if (e.confirm) return waehle(z, c);
    return leer;
  }

  // --- FORTSETZEN: confirm ODER Tap-Flanke --------------------------------
  if (!e.confirm && !e.tap) return leer;
  if (!letzteSeite) {
    return {
      zustand: kopie(z, { seite: z.seite + 1 }),
      aktion: 'seite',
      effekte: [],
      schluckAngriff: true,
      schluckTrank: false,
    };
  }
  // Letzte Seite eines Knotens ohne Optionen: Kette folgen oder beenden.
  const k = knotenVon(z.baum, z.knotenId);
  const eigene = (k && k.effekte) || [];
  const gesammelt = z.effekte.concat(eigene);
  const ziel = k && k.ziel;
  if (ziel && knotenVon(z.baum, ziel)) {
    const n = zustandFuer(z.baum, ziel, gesammelt);
    return { zustand: n, aktion: 'seite', effekte: [], schluckAngriff: true, schluckTrank: false };
  }
  return {
    zustand: kopie(z, { fertig: true, effekte: gesammelt }),
    aktion: 'ende',
    effekte: gesammelt,
    schluckAngriff: true,
    schluckTrank: true,
  };
}

function waehle(z, i) {
  const opt = z.optionen[i];
  const k = knotenVon(z.baum, z.knotenId);
  const eigene = (k && k.effekte) || [];
  const gesammelt = z.effekte.concat(eigene, opt.effekte || []);
  if (opt.ziel && knotenVon(z.baum, opt.ziel)) {
    const n = zustandFuer(z.baum, opt.ziel, gesammelt);
    return {
      zustand: kopie(n, { cursor: 0 }),
      aktion: 'wahl',
      effekte: opt.effekte || [],
      schluckAngriff: true,
      schluckTrank: false,
    };
  }
  return {
    zustand: kopie(z, { cursor: i, fertig: true, effekte: gesammelt }),
    aktion: 'ende',
    effekte: gesammelt,
    schluckAngriff: true,
    schluckTrank: true,
  };
}

/**
 * RENDER-MODELL (reine Daten, kein ctx). main.js malt daraus.
 * @returns {{box, name, zeilen:[{text,y}], optionen:[{text,zone,gewaehlt}],
 *            weiter:(null|Object)}}
 */
export function dialogAnsicht(zustand) {
  const z = zustand;
  if (!z) return { box: DIALOG_BOX, name: '', zeilen: [], optionen: [], weiter: null };
  const letzteSeite = z.seite >= z.seiten.length - 1;
  const zeigtOptionen = z.optionen.length > 0 && letzteSeite;
  const yListe = zeigtOptionen ? DIALOG_TEXT_Y_OPTIONEN : DIALOG_TEXT_Y;
  const zeilen = (z.seiten[z.seite] || []).map((t, i) => ({ text: t, y: yListe[i] }));
  return {
    box: DIALOG_BOX,
    name: zeigtOptionen ? '' : z.name,
    nameY: DIALOG_NAME_Y,
    zeilen,
    optionen: zeigtOptionen
      ? z.optionen.map((o, i) => ({ text: o.text, zone: DIALOG_OPTION_ZONEN[i], gewaehlt: i === z.cursor }))
      : [],
    weiter: !zeigtOptionen && !z.fertig ? DIALOG_WEITER_MARKE : null,
  };
}
