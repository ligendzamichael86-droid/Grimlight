// HAENDLER-UI (SPEC_SLICE_6 §3 + SLICE6_PHASE0 §1/§2). Bauform WOERTLICH wie
// inventory_ui.js: reine Logik OHNE ctx (createShopUI) + getrennter Zeichner
// (drawShopUI). Node-importierbar, kein window/document auf Modulebene.
//
// EIGENES PANEL, EIGENER STATE (SPEC §3.2, Landkarte §3.3): das Inventar-Panel
// ist TABU — LIST_Y (26) und der X-Anker (288,10) sind eingefroren und stehen
// mit harten Koordinaten im Bestands-Smoke (smoke:1249-1256, :4529-4545).
// Hier steht deshalb NICHTS aus inventory_ui.js; der Zustandsname ist 'shop'.
//
// TAP-ZONEN >= 6 mm (A1-Geometrie-Gate). Bestands-Umrechnung nachgerechnet
// (smoke:4040-4052): Referenzgeraet 2400x1080 auf 6,5 Zoll, DPR 3 ->
// PPI = hypot(1080,2400)/6,5 = 404,93; mm je Geraetepixel = 25,4/404,93 =
// 0,06273; Skalierung 6 -> MM_PRO_PX = 0,3764. 6 mm sind also 15,94 px:
// jede Zone hier ist >= 18 px (6,78 mm), die Knoepfe 24 px (9,03 mm).
//
// GOLD DARF NIE FOLGENLOS VERSCHWINDEN (Review m3-Tests): JEDER verweigerte
// Kauf laesst den Beutel unangetastet und meldet einen Hinweis. Abgezogen wird
// immer erst NACH der letzten Verweigerungspruefung.

import { rollItem, addItem } from '../items/items.js';

// --- GEOMETRIE (eigene Namen, eigene Werte) --------------------------------
export const SHOP_PANEL = { x: 8, y: 8, w: 304, h: 164 };
export const SHOP_LIST_X0 = 16;
export const SHOP_LIST_X1 = 304;
export const SHOP_LIST_Y = 38;
export const SHOP_ROW_H = 18;          // 6,78 mm
export const SHOP_ROWS = 5;            // sichtbare Zeilen (laengere Listen scrollen)
export const SHOP_HINWEIS_Y = 133;
export const SHOP_BTN_CLOSE = { x: 288, y: 10, w: 24, h: 24 };
export const SHOP_BTN_SEITE = { x: 16, y: 144, w: 88, h: 24 };
// LAGE DES HANDELN-KNOPFS — KORRIGIERTE BEGRUENDUNG (Phase 2, ENGINE).
// Der frueher hier stehende Satz "KEINE UEBERDECKUNG DER SPIEL-TOUCHZONEN"
// war IRREFUEHREND: er las sich, als schuetze die Knopf-Lage vor den A/B-
// Zonen. Das tut sie nicht und muss sie nicht. Den Schutz leistet
// AUSSCHLIESSLICH main.js, das im State 'shop' (wie im State 'dialog') A, B
// und W auf visible:false setzt (SPEC_SLICE_6 §2.2, Muster pause.visible) —
// waehrend eines Ladenbesuchs laeuft ausserdem KEIN Welt-Update, ein Tap in
// die A/B-Kreise kann also gar keinen Hieb und keinen Trank ausloesen
// (main.js haelt dafuer zusaetzlich attackSwallow und trankSwallow).
// Zur Einordnung: input.js:108-112 setzt A = Kreis (288,148) r16 -> Huelle
// x 272..304, B = (252,144) r12 -> x 240..264 (beide y 132..164). Die Lage
// x 112..208 bleibt trotzdem so stehen — sie ist die aufgeraeumtere (die
// Liste braucht y 38..128 in voller Hoehe) und kostet nichts. Masse
// unveraendert (96 x 24 px = 36,1 x 9,03 mm, weit ueber dem 6-mm-Gate).
export const SHOP_BTN_HANDEL = { x: 112, y: 144, w: 96, h: 24 };
// Alle Tap-Rechtecke der UI in EINER Liste (Gate liest daraus).
export const SHOP_ZONEN = [SHOP_BTN_CLOSE, SHOP_BTN_SEITE, SHOP_BTN_HANDEL];

// --- PREISE (SPEC §3.1, Oekonomie SLICE6_PHASE0 §2) ------------------------
// Basispreis je Slot; rare kostet +50 %.
export const BASIS_PREIS = { weapon: 60, armor: 90, ring: 120 };
export const RARE_FAKTOR = 1.5;
export const PREIS_TRANK = 15;
export const PREIS_HERZ = 250;         // EINMALIG (runFlags.gekauft)
export const PREIS_HEILUNG = 10;       // Hedda: Dauer-Senke statt gratis (Review M8)
export const ANKAUF_BASIS = 12;
export const ANKAUF_RARE = 28;
export const MILE_FAKTOR = 2.5;        // Wucher auf den Bran-Basispreis
// Selten-Chance der Haendler-Angebote. Greift NUR, wenn Q2 belohnt ist
// (SLICE6_PHASE0 §1: "Brans Slot-Angebote wuerfeln ab jetzt MIT Selten-
// Chance, vorher nie"). Wert an der Rostpanzer-Tabelle orientiert
// (enemies.js:152 rareChance 0.25).
export const SELTEN_CHANCE = 0.25;
export const HERZ_MARKE = 'herz';      // Schluessel in runFlags.gekauft
export const SLOT_FOLGE = ['weapon', 'armor', 'ring'];

// --- FARBEN (eigene Konstanten, nichts aus inventory_ui importiert) --------
const FARBE_TEXT = '#d6cbb1';
const FARBE_RARE = '#92aec0';
const FARBE_MARK = '#f0bf4e';
const FARBE_BAD = '#ae2f2a';
const FARBE_DIM = '#7d7588';

function inRect(p, r) {
  return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
}

// ---------------------------------------------------------------------------
// DETERMINISTISCHER WUERFEL
// ---------------------------------------------------------------------------
//
// Die Angebote sind je Dorfbesuch FEST (SPEC §3.1). Gesaet wird aus
// (dorfBesuche, slotIndex) — zweimal derselbe Besuch liefert zeichengleich
// dasselbe Angebot, auch nach Speichern/Laden. KEIN Math.random.
export function saatRng(a, b) {
  let s = (Math.imul((a | 0) + 1, 0x9e3779b1) ^ Math.imul((b | 0) + 1, 0x85ebca6b)) >>> 0;
  return function rng() {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function preisFuer(item) {
  const basis = BASIS_PREIS[item.slot] || BASIS_PREIS.weapon;
  return Math.round(basis * (item.rare ? RARE_FAKTOR : 1));
}

export function ankaufPreis(item) {
  return item && item.rare === true ? ANKAUF_RARE : ANKAUF_BASIS;
}

// ---------------------------------------------------------------------------
// ANGEBOTE (PUR — gleiche Eingabe, gleiche Ausgabe)
// ---------------------------------------------------------------------------
//
// kontext = { dorfBesuche:int, gekauft:string[], seltenFrei:boolean }
// seltenFrei kommt aus quest.js (Q2 belohnt) und wird vom Aufrufer gesetzt —
// shop_ui haengt NICHT an quest.js.
export function baueAngebote(haendler, kontext = {}) {
  const besuch = Number.isFinite(kontext.dorfBesuche) ? kontext.dorfBesuche : 0;
  const gekauft = Array.isArray(kontext.gekauft) ? kontext.gekauft : [];
  const selten = kontext.seltenFrei === true;
  const zeilen = [];

  if (haendler === 'bran') {
    for (let i = 0; i < SLOT_FOLGE.length; i++) {
      const rng = saatRng(besuch, i);
      // REIHENFOLGE BINDEND: erst der Selten-Wurf, dann rollItem — sonst
      // veraendert das Freischalten von Q2 auch die Affixe der NORMALEN
      // Angebote (derselbe rng-Strom).
      // Der Wurf wird IMMER GEZOGEN (Fixer R1, V-SPEC MINOR): `selten && rng()`
      // haette wegen der &&-Kurzschlussauswertung bei selten=false gar nicht
      // gezogen — der Strom stuende dann bei Q2-Freischaltung um genau einen
      // Zug versetzt und die Zusage im Absatz darueber waere nicht eingeloest.
      const wurf = rng();
      const rare = selten && wurf < SELTEN_CHANCE;
      const item = rollItem(rng, { slot: SLOT_FOLGE[i], rare });
      zeilen.push({ art: 'gear', schluessel: `gear_${i}`, item, preis: preisFuer(item), text: item.name });
    }
    zeilen.push({ art: 'trank', schluessel: 'trank', preis: PREIS_TRANK, text: 'TRANK' });
    if (!gekauft.includes(HERZ_MARKE)) {
      zeilen.push({ art: 'herz', schluessel: HERZ_MARKE, preis: PREIS_HERZ, text: 'HERZSTUECK' });
    }
    return zeilen;
  }

  if (haendler === 'hedda') {
    zeilen.push({ art: 'heilung', schluessel: 'heilung', preis: PREIS_HEILUNG, text: 'VERBAND' });
    zeilen.push({ art: 'trank', schluessel: 'trank', preis: PREIS_TRANK, text: 'TRANK' });
    return zeilen;
  }

  if (haendler === 'mile') {
    // EIN Zufalls-Item je Besuch, 2,5x auf den Bran-Basispreis des
    // gewuerfelten Slots (SPEC §3.1). Eigener Saat-Index (9), damit Miles
    // Fund nicht an Brans Waffenangebot klebt.
    //
    // MILES FUND IST NIE SELTEN (SLICE6_PHASE0 §1, woertlich): Q2 schaltet
    // "BRANS Slot-Angebote" frei — Mile steht dort nicht. Zwei Gruende, das
    // buchstaeblich zu nehmen: (1) 2,5x auf den BASISPREIS ist nur dann
    // buchstaeblich, wenn kein rare-Aufschlag dazwischenliegt (sonst 120 x
    // 1,5 x 2,5 = 450 fuer einen Ring — mehr als der Herzcontainer und
    // ausserhalb der in §2 gerechneten Kaufkraft ~212..262 nach dem Boss);
    // (2) die Oekonomie-Simulation kennt diesen Strom nicht.
    const rng = saatRng(besuch, 9);
    const item = rollItem(rng, { rare: false });
    zeilen.push({
      art: 'gear',
      schluessel: 'mile_0',
      item,
      preis: Math.round(preisFuer(item) * MILE_FAKTOR),
      text: item.name,
    });
    return zeilen;
  }
  return zeilen;
}

/** Ankauf-Liste = die Tasche des Spielers (Angelegtes bleibt aussen vor). */
export function baueAnkauf(player) {
  const items = (player && player.inv && Array.isArray(player.inv.items)) ? player.inv.items : [];
  return items.map((it, i) => ({
    art: 'ankauf', schluessel: `ankauf_${i}`, item: it, index: i, preis: ankaufPreis(it), text: it.name,
  }));
}

// ---------------------------------------------------------------------------
// HANDELN (mutiert den Spieler; jede Verweigerung laesst den Beutel stehen)
// ---------------------------------------------------------------------------
//
// @returns {{ok:boolean, hinweis:string, ausgabe:number, einnahme:number}}
export function handle(zeile, player, kontext = {}) {
  const nein = (hinweis) => ({ ok: false, hinweis, ausgabe: 0, einnahme: 0 });
  if (!zeile || !player) return nein('NICHTS ZU HANDELN');
  const gekauft = Array.isArray(kontext.gekauft) ? kontext.gekauft : null;

  if (zeile.art === 'ankauf') {
    const inv = player.inv;
    if (!inv || inv.items[zeile.index] !== zeile.item) return nein('NICHTS ZU HANDELN');
    inv.items.splice(zeile.index, 1);
    player.gold += zeile.preis;
    return { ok: true, hinweis: 'GEGEN KLINGENDES', ausgabe: 0, einnahme: zeile.preis };
  }

  if (player.gold < zeile.preis) return nein('DAS REICHT NICHT');

  if (zeile.art === 'gear') {
    if (!player.inv) return nein('NICHTS ZU HANDELN');
    // ERST einlegen, DANN zahlen: addItem meldet die volle Tasche
    // (items.js:87-92) und der Beutel bleibt unberuehrt.
    if (!addItem(player.inv, zeile.item)) return nein('DIE TASCHE IST VOLL');
    player.gold -= zeile.preis;
    return { ok: true, hinweis: 'GEKAUFT', ausgabe: zeile.preis, einnahme: 0 };
  }

  if (zeile.art === 'trank') {
    const max = Number.isFinite(player.maxPotions) ? player.maxPotions : 3;
    if ((player.potions || 0) >= max) return nein('DER GUERTEL IST VOLL');
    player.potions += 1;
    player.gold -= zeile.preis;
    return { ok: true, hinweis: 'GEKAUFT', ausgabe: zeile.preis, einnahme: 0 };
  }

  if (zeile.art === 'heilung') {
    if (player.hp >= player.maxHp) return nein('DU BIST HEIL');
    player.gold -= zeile.preis;
    player.hp = player.maxHp;
    return { ok: true, hinweis: 'GEFLICKT', ausgabe: zeile.preis, einnahme: 0 };
  }

  if (zeile.art === 'herz') {
    // EINMALIG (SPEC §3.1). Die Marke liegt in runFlags.gekauft und ueberlebt
    // damit Speichern/Laden; ohne sie waechst maxHp unbegrenzt.
    if (!gekauft) return nein('NICHTS ZU HANDELN');
    if (gekauft.includes(HERZ_MARKE)) return nein('SCHON GEHOLT');
    if (!player.prog || !player.recalcStats) return nein('NICHTS ZU HANDELN');
    player.gold -= zeile.preis;
    // Muster props.js:85-90 (Herzcontainer-Truhe), damit beide Wege identisch
    // wirken: +1 hearts, Stats neu ableiten, +2 hp bis zum neuen Maximum.
    player.prog.hearts += 1;
    player.recalcStats();
    player.hp = Math.min(player.hp + 2, player.maxHp);
    gekauft.push(HERZ_MARKE);
    return { ok: true, hinweis: 'ES SCHLAEGT STAERKER', ausgabe: zeile.preis, einnahme: 0 };
  }
  return nein('NICHTS ZU HANDELN');
}

// ---------------------------------------------------------------------------
// LOGIK-OBJEKT (ohne ctx) — Muster createInventoryUI
// ---------------------------------------------------------------------------

export const HAENDLER_NAME = {
  bran: 'BRAN DER SCHMIED',
  hedda: 'ALTE HEDDA',
  mile: 'MILE',
};

export function createShopUI() {
  // Held-Flags wie inventory_ui.js:79-84: open() primt sie auf true, sie
  // loesen erst nach einem gesehenen Loslassen aus.
  let heldConfirm = true;
  let heldUp = true;
  let heldDown = true;
  let heldInv = true;

  const ui = {
    haendler: 'bran',
    seite: 'kauf',        // 'kauf' | 'ankauf'
    cursor: 0,
    oben: 0,              // erster sichtbarer Listenindex
    hinweis: '',
    zeilen: [],
    besuch: -1,
    verkauft: [],         // Schluessel der in DIESEM Dorfbesuch geleerten Angebote
    ankaufMoeglich: false,
    open,
    update,
    liste,
  };

  function open(haendler, kontext = {}) {
    heldConfirm = true;
    heldUp = true;
    heldDown = true;
    heldInv = true;
    ui.haendler = haendler || 'bran';
    ui.seite = 'kauf';
    ui.cursor = 0;
    ui.oben = 0;
    ui.hinweis = '';
    // Jeder NEUE Dorfbesuch stellt die Auslage wieder her (SPEC §3.1: EIN
    // Fest-Angebot je Slot JE DORFBESUCH).
    const besuch = Number.isFinite(kontext.dorfBesuche) ? kontext.dorfBesuche : 0;
    if (besuch !== ui.besuch) {
      ui.besuch = besuch;
      ui.verkauft = [];
    }
    ui.ankaufMoeglich = ui.haendler === 'bran';
  }

  // Sichtbare Liste der aktuellen Seite (ohne die bereits geleerten Angebote).
  function liste(player, kontext) {
    if (ui.seite === 'ankauf') return baueAnkauf(player);
    return baueAngebote(ui.haendler, kontext).filter((z) => !ui.verkauft.includes(z.schluessel));
  }

  /**
   * @param {Object} input  core/input.js
   * @param {Object} player
   * @param {Object} kontext { dorfBesuche, gekauft, seltenFrei }
   * @returns {null|'close'}
   */
  function update(input, player, kontext = {}) {
    ui.zeilen = liste(player, kontext);
    const maxIdx = Math.max(0, ui.zeilen.length - 1);
    if (ui.cursor > maxIdx) ui.cursor = maxIdx;

    const upLevel = input.dirY < -0.5;
    const downLevel = input.dirY > 0.5;
    const confirmLevel = !!input.confirm || !!input.attack;
    const invLevel = !!input.inventory;
    const upEdge = upLevel && !heldUp;
    const downEdge = downLevel && !heldDown;
    const confirmEdge = confirmLevel && !heldConfirm;
    const invEdge = invLevel && !heldInv;
    heldUp = upLevel;
    heldDown = downLevel;
    heldConfirm = confirmLevel;
    heldInv = invLevel;

    if (invEdge) return 'close';

    if (input.tap) {
      // TAP-VORRANG (Muster titleMenuStep/inventory_ui): ein Tap neben den
      // Zonen darf NICHTS ausloesen, sonst kauft jeder Fehlgriff.
      if (inRect(input.tap, SHOP_BTN_CLOSE)) return 'close';
      if (ui.ankaufMoeglich && inRect(input.tap, SHOP_BTN_SEITE)) {
        ui.seite = ui.seite === 'kauf' ? 'ankauf' : 'kauf';
        ui.cursor = 0;
        ui.oben = 0;
        ui.hinweis = '';
        return null;
      }
      if (inRect(input.tap, SHOP_BTN_HANDEL)) {
        handleCursor(player, kontext);
        return null;
      }
      if (
        input.tap.x >= SHOP_LIST_X0 && input.tap.x <= SHOP_LIST_X1
        && input.tap.y >= SHOP_LIST_Y && input.tap.y < SHOP_LIST_Y + SHOP_ROWS * SHOP_ROW_H
      ) {
        const row = ui.oben + Math.floor((input.tap.y - SHOP_LIST_Y) / SHOP_ROW_H);
        if (row < ui.zeilen.length) ui.cursor = row;
      }
      return null;
    }

    if (upEdge && ui.cursor > 0) ui.cursor -= 1;
    if (downEdge && ui.cursor < maxIdx) ui.cursor += 1;
    if (confirmEdge) handleCursor(player, kontext);

    // Sichtfenster dem Cursor nachfuehren
    if (ui.cursor < ui.oben) ui.oben = ui.cursor;
    if (ui.cursor >= ui.oben + SHOP_ROWS) ui.oben = ui.cursor - SHOP_ROWS + 1;
    if (ui.oben < 0) ui.oben = 0;
    return null;
  }

  function handleCursor(player, kontext) {
    const zeile = ui.zeilen[ui.cursor];
    if (!zeile) {
      ui.hinweis = 'NICHTS ZU HANDELN';
      return;
    }
    const erg = handle(zeile, player, kontext);
    ui.hinweis = erg.hinweis;
    if (erg.ok && zeile.art !== 'ankauf' && zeile.art !== 'trank' && zeile.art !== 'heilung') {
      // Einzelstuecke (Slot-Angebot, Miles Fund, Herzstueck) verschwinden aus
      // der Auslage; Traenke und Heilung bleiben kaufbar.
      ui.verkauft.push(zeile.schluessel);
    }
    ui.zeilen = liste(player, kontext);
    if (ui.cursor > ui.zeilen.length - 1) ui.cursor = Math.max(0, ui.zeilen.length - 1);
    if (ui.cursor < ui.oben) ui.oben = ui.cursor;
  }

  return ui;
}

// ---------------------------------------------------------------------------
// LAUFZEIT-ZUSTAND ZURUECKSETZEN (ADDITIV, Phase-2-Nachfix)
// ---------------------------------------------------------------------------
//
// WOZU: main.js haelt EIN shopUI fuer die ganze Sitzung (`const shopUI =
// createShopUI()`), waehrend resetRun einen frischen RUN aufsetzt und dabei
// runFlags.dorfBesuche auf 0 zuruecksetzt. Ohne diese Funktion ueberlebten
// ui.besuch und ui.verkauft den Neustart: der neue Run betritt das Dorf als
// Besuch 1, trifft in `open` auf denselben Zaehlerstand wie im alten Run
// (`besuch !== ui.besuch` ist dann FALSCH) und laesst die im ALTEN Run
// gekauften Einzelstuecke aus der Auslage verschwinden.
//
// PUR bis auf das uebergebene Objekt: nur die Felder aus dem ui-Literal in
// createShopUI, exakt auf deren Startwerte. Der Wuerfel bleibt unberuehrt —
// die Auslage haengt allein an der Saat (dorfBesuche, slotIndex), NICHT an
// diesem Objekt (saatRng oben).
//
// DIE HELD-FLAGGEN (heldConfirm/heldUp/heldDown/heldInv) sind Closure-Zustand
// und werden hier bewusst NICHT angefasst: sie sind reine Eingabe-Flanken und
// werden von `open` bei JEDEM Ladenbesuch neu auf true geprimt.
export function resetShopUI(ui) {
  if (!ui) return ui;
  ui.haendler = 'bran';
  ui.seite = 'kauf';
  ui.cursor = 0;
  ui.oben = 0;
  ui.hinweis = '';
  ui.zeilen = [];
  ui.besuch = -1;
  ui.verkauft = [];
  ui.ankaufMoeglich = false;
  return ui;
}

// ---------------------------------------------------------------------------
// ZEICHNER (der EINZIGE Teil mit ctx)
// ---------------------------------------------------------------------------

export function drawShopUI(ctx, ui, player, gfx) {
  // Grund + Doppelrahmen (eigene Werte, nicht aus inventory_ui uebernommen)
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = '#14101a';
  ctx.fillRect(SHOP_PANEL.x, SHOP_PANEL.y, SHOP_PANEL.w, SHOP_PANEL.h);
  ctx.globalAlpha = 1;
  rahmen(ctx, SHOP_PANEL.x, SHOP_PANEL.y, SHOP_PANEL.w, SHOP_PANEL.h, '#575061');
  rahmen(ctx, SHOP_PANEL.x + 2, SHOP_PANEL.y + 2, SHOP_PANEL.w - 4, SHOP_PANEL.h - 4, '#3a3542');

  ctx.font = '8px monospace';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';

  // Kopfzeile: Haendlername links, Beutelstand rechts vor dem X-Knopf.
  ctx.fillStyle = FARBE_MARK;
  ctx.fillText(HAENDLER_NAME[ui.haendler] || '', 16, 14);
  ctx.textAlign = 'right';
  ctx.fillStyle = FARBE_TEXT;
  ctx.fillText(`BEUTEL ${player ? player.gold : 0}`, 282, 14);
  ctx.textAlign = 'left';

  // X-Knopf (fillRect-Rahmen, kein strokeRect)
  rahmen(ctx, SHOP_BTN_CLOSE.x, SHOP_BTN_CLOSE.y, SHOP_BTN_CLOSE.w, SHOP_BTN_CLOSE.h, '#575061');
  ctx.textAlign = 'center';
  ctx.fillStyle = FARBE_TEXT;
  ctx.fillText('X', SHOP_BTN_CLOSE.x + SHOP_BTN_CLOSE.w / 2, SHOP_BTN_CLOSE.y + 8);
  ctx.textAlign = 'left';

  // Liste
  const zeilen = ui.zeilen || [];
  for (let i = 0; i < SHOP_ROWS; i++) {
    const idx = (ui.oben || 0) + i;
    const y = SHOP_LIST_Y + i * SHOP_ROW_H;
    if (idx === ui.cursor && zeilen.length > 0) {
      ctx.fillStyle = '#3a3542';
      ctx.fillRect(SHOP_LIST_X0, y, SHOP_LIST_X1 - SHOP_LIST_X0, SHOP_ROW_H);
    }
    const z = zeilen[idx];
    if (!z) continue;
    if (z.item && gfx) {
      const icon = gfx[`icon_${z.item.slot}`];
      if (icon) ctx.drawImage(icon, SHOP_LIST_X0 + 2, y + 1);
    }
    ctx.textAlign = 'left';
    ctx.fillStyle = z.item && z.item.rare ? FARBE_RARE : FARBE_TEXT;
    ctx.fillText(z.text, SHOP_LIST_X0 + 20, y + 5);
    ctx.textAlign = 'right';
    const bezahlbar = z.art === 'ankauf' || !player || player.gold >= z.preis;
    ctx.fillStyle = bezahlbar ? FARBE_MARK : FARBE_BAD;
    ctx.fillText(String(z.preis), SHOP_LIST_X1 - 4, y + 5);
    ctx.textAlign = 'left';
  }

  // Hinweiszeile (die Verweigerungen stehen hier, nicht im Toast)
  if (ui.hinweis) {
    ctx.fillStyle = FARBE_DIM;
    ctx.fillText(ui.hinweis, 16, SHOP_HINWEIS_Y);
  }

  // Knoepfe
  if (ui.ankaufMoeglich) {
    knopf(ctx, SHOP_BTN_SEITE, ui.seite === 'kauf' ? 'ANKAUF' : 'AUSLAGE', true);
  }
  knopf(ctx, SHOP_BTN_HANDEL, 'HANDELN', zeilen.length > 0);
  ctx.textAlign = 'left';
}

// fillRect-Rahmen (SPEC §0.4: KEIN strokeRect — die Flusstest-Stubs kennen es
// nicht, und jeder neue Zug waere eine Sonde).
function rahmen(ctx, x, y, w, h, farbe) {
  ctx.fillStyle = farbe;
  ctx.fillRect(x, y, w, 1);
  ctx.fillRect(x, y + h - 1, w, 1);
  ctx.fillRect(x, y, 1, h);
  ctx.fillRect(x + w - 1, y, 1, h);
}

function knopf(ctx, r, text, aktiv) {
  ctx.fillStyle = '#0a0810';
  ctx.fillRect(r.x, r.y, r.w, r.h);
  rahmen(ctx, r.x, r.y, r.w, r.h, aktiv ? FARBE_MARK : '#3a3542');
  ctx.textAlign = 'center';
  ctx.fillStyle = aktiv ? FARBE_TEXT : FARBE_DIM;
  ctx.fillText(text, r.x + r.w / 2, r.y + 8);
  ctx.textAlign = 'left';
}
