// Inventar-UI (SPEC_SLICE_2, Paragraph 3): vollpausierendes Panel mit
// 7-Zeilen-Liste, Slot-Spalte, Alt/Neu-Vergleich und ANLEGEN.
// Logik (createInventoryUI) laeuft OHNE ctx und ist Node-importierbar;
// nur drawInventoryUI zeichnet. main.js besitzt den Zustandsautomaten.

import { equipItem, computeStats, AFFIXES, BASE_STATS } from '../items/items.js';

// Layout (bindend, UX-Panel): Panel (8,8) bis (312,172), Liste x 48..304
// mit 7 Zeilen a 16 px ab y 26, ANLEGEN 72x22 bei (232,142), X 20x20 bei
// (288,10). Slot-Spalte links x 16..36.
const PANEL = { x: 8, y: 8, w: 304, h: 164 };
const LIST_X0 = 48;
const LIST_X1 = 304;
const LIST_Y = 26;
const ROW_H = 16;
const ROWS = 7;
const BTN_EQUIP = { x: 232, y: 142, w: 72, h: 22 };
const BTN_CLOSE = { x: 288, y: 10, w: 20, h: 20 };

const COLOR_NORMAL = '#d6cbb1';
const COLOR_RARE = '#92aec0';
const COLOR_GOLD = '#f0bf4e';
const COLOR_BAD = '#ae2f2a';
const COLOR_DIM = '#7d7588';

// Anzeige-Reihenfolge des Vergleichs. fmt rechnet Stat in Anzeigeeinheit
// um (HERZ = maxHp/2, TEMPO in Prozent), lowerBetter kehrt die Bewertung.
const STAT_VIEW = [
  { stat: 'maxHp', label: 'HERZ', fmt: (v) => v / 2 },
  { stat: 'dmg', label: 'SCHADEN', fmt: (v) => v },
  { stat: 'speed', label: 'TEMPO', fmt: (v) => `${Math.round((v / BASE_STATS.speed) * 100)}%` },
  { stat: 'reach', label: 'WEITE', fmt: (v) => v },
  { stat: 'knockMult', label: 'STOSS', fmt: (v) => `${Math.round(v * 100)}%` },
  { stat: 'knockTakenMult', label: 'STAND', fmt: (v) => `${Math.round(v * 100)}%`, lowerBetter: true },
  { stat: 'potionHeal', label: 'TRANK', fmt: (v) => v },
  { stat: 'pickupRadius', label: 'MAGNET', fmt: (v) => v },
];

function inRect(p, r) {
  return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
}

export function createInventoryUI() {
  // Held-Flags: open() primt ALLE auf true, sie loesen erst nach einem
  // gesehenen Loslassen aus. Sonst schliesst die noch gedrueckte I-Taste
  // das Panel im Oeffnungs-Frame wieder (Flanken-Doppelzaehlung).
  let heldInv = true;
  let heldConfirm = true;
  let heldUp = true;
  let heldDown = true;

  const ui = { cursor: 0, open, update };

  function open() {
    heldInv = true;
    heldConfirm = true;
    heldUp = true;
    heldDown = true;
    ui.cursor = 0;
  }

  function equip(player) {
    if (equipItem(player.inv, ui.cursor) && player.recalcStats) player.recalcStats();
  }

  // Eigene Flankenerkennung auf den Eingabe-Pegeln. Rueckgabe 'close'
  // beendet den inventory-Zustand (main.js), sonst null.
  function update(input, player) {
    const inv = player.inv;
    const maxIdx = Math.max(0, inv.items.length - 1);
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
      // Tap-Hittest: X schliesst, ANLEGEN legt an, Listenzeile waehlt aus.
      // Der Tap schluckt die confirm-Flanke desselben touchstart, sonst
      // wuerde jede Zeilen-Auswahl sofort ANLEGEN ausloesen.
      if (inRect(input.tap, BTN_CLOSE)) return 'close';
      if (inRect(input.tap, BTN_EQUIP)) {
        equip(player);
      } else if (
        input.tap.x >= LIST_X0 && input.tap.x <= LIST_X1
        && input.tap.y >= LIST_Y && input.tap.y < LIST_Y + ROWS * ROW_H
      ) {
        const row = Math.floor((input.tap.y - LIST_Y) / ROW_H);
        if (row < inv.items.length) ui.cursor = row;
      }
      return null;
    }

    if (upEdge && ui.cursor > 0) ui.cursor -= 1;
    if (downEdge && ui.cursor < maxIdx) ui.cursor += 1;
    if (confirmEdge) equip(player);
    return null;
  }

  return ui;
}

// Affix-Zeile eines Items (Labels aus AFFIXES, rechtsbuendig gezeichnet)
function affixText(item) {
  return item.affixes.map((a) => (AFFIXES[a.stat] ? AFFIXES[a.stat].label : a.stat)).join('  ');
}

// Vergleich aktuelle Stats gegen "Auswahl angelegt" (hypothetisch).
// Liefert [{ text, better }] fuer alle Stats, die sich aendern wuerden.
function statDiffs(cur, next) {
  const diffs = [];
  for (const v of STAT_VIEW) {
    if (cur[v.stat] === next[v.stat]) continue;
    const better = v.lowerBetter ? next[v.stat] < cur[v.stat] : next[v.stat] > cur[v.stat];
    diffs.push({ text: `${v.label} ${v.fmt(cur[v.stat])} > ${v.fmt(next[v.stat])}`, better });
  }
  return diffs;
}

// 20x20-Slot der linken Spalte: Rahmen + Icon (voll wenn belegt, sonst
// dunkles Geister-Icon).
function drawSlot(ctx, gfx, x, y, iconKey, filled, frameColor) {
  ctx.fillStyle = '#0a0810';
  ctx.fillRect(x, y, 20, 20);
  ctx.strokeStyle = frameColor;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, 19, 19);
  const img = gfx[iconKey];
  if (!img) return;
  if (!filled) ctx.globalAlpha = 0.28;
  ctx.drawImage(img, Math.round(x + 10 - img.width / 2), Math.round(y + 10 - img.height / 2));
  ctx.globalAlpha = 1;
}

export function drawInventoryUI(ctx, ui, player, gfx) {
  const inv = player.inv;
  const selected = inv.items[ui.cursor] || null;

  // Grund + Doppelrahmen
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = '#14101a';
  ctx.fillRect(PANEL.x, PANEL.y, PANEL.w, PANEL.h);
  ctx.globalAlpha = 1;
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#575061';
  ctx.strokeRect(PANEL.x + 0.5, PANEL.y + 0.5, PANEL.w - 1, PANEL.h - 1);
  ctx.strokeStyle = '#3a3542';
  ctx.strokeRect(PANEL.x + 2.5, PANEL.y + 2.5, PANEL.w - 5, PANEL.h - 5);

  ctx.font = '8px monospace';
  ctx.textBaseline = 'top';

  // Kopfzeile + X-Button
  ctx.textAlign = 'left';
  ctx.fillStyle = COLOR_GOLD;
  ctx.fillText('AUSRUESTUNG', 16, 14);
  ctx.strokeStyle = '#575061';
  ctx.strokeRect(BTN_CLOSE.x + 0.5, BTN_CLOSE.y + 0.5, BTN_CLOSE.w - 1, BTN_CLOSE.h - 1);
  ctx.textAlign = 'center';
  ctx.fillStyle = COLOR_NORMAL;
  ctx.fillText('X', BTN_CLOSE.x + BTN_CLOSE.w / 2, BTN_CLOSE.y + 7);

  // Slot-Spalte links: Waffe/Ruestung/Ring + Zweitwaffe (fest, Goldrahmen)
  drawSlot(ctx, gfx, 16, 26, 'icon_weapon', !!inv.equipped.weapon, '#575061');
  drawSlot(ctx, gfx, 16, 50, 'icon_armor', !!inv.equipped.armor, '#575061');
  drawSlot(ctx, gfx, 16, 74, 'icon_ring', !!inv.equipped.ring, '#575061');
  drawSlot(ctx, gfx, 16, 98, 'icon_boomerang', inv.zelda.length > 0, COLOR_GOLD);

  // Liste rechts: 7 Zeilen, Cursor-Zeile hinterlegt
  for (let i = 0; i < ROWS; i++) {
    const y = LIST_Y + i * ROW_H;
    if (i === ui.cursor && inv.items.length > 0) {
      ctx.fillStyle = '#3a3542';
      ctx.fillRect(LIST_X0, y, LIST_X1 - LIST_X0, ROW_H);
    }
    const item = inv.items[i];
    if (!item) continue;
    const icon = gfx[`icon_${item.slot}`];
    if (icon) ctx.drawImage(icon, LIST_X0 + 2, y + 2);
    ctx.textAlign = 'left';
    ctx.fillStyle = item.rare ? COLOR_RARE : COLOR_NORMAL;
    ctx.fillText(item.name, LIST_X0 + 18, y + 4);
    ctx.textAlign = 'right';
    ctx.fillStyle = COLOR_DIM;
    ctx.fillText(affixText(item), LIST_X1 - 2, y + 4);
  }

  // Fusszeile: Vergleich + angelegtes Item, ohne Auswahl die Gesamtwerte
  ctx.textAlign = 'left';
  if (selected) {
    const next = computeStats({ equipped: { ...inv.equipped, [selected.slot]: selected } });
    const diffs = statDiffs(player.stats, next);
    if (diffs.length === 0) {
      ctx.fillStyle = COLOR_DIM;
      ctx.fillText('KEIN UNTERSCHIED', 16, 144);
    } else {
      let x = 16;
      for (const d of diffs.slice(0, 2)) {
        ctx.fillStyle = d.better ? COLOR_GOLD : COLOR_BAD;
        ctx.fillText(d.text, x, 144);
        x += (d.text.length + 2) * 5;
      }
    }
    const old = inv.equipped[selected.slot];
    ctx.fillStyle = COLOR_DIM;
    ctx.fillText(`angelegt: ${old ? old.name : 'nichts'}`, 16, 156);
  } else {
    const s = player.stats;
    ctx.fillStyle = COLOR_NORMAL;
    ctx.fillText(
      `HERZ ${s.maxHp / 2}  SCHADEN ${s.dmg}  TEMPO ${Math.round((s.speed / BASE_STATS.speed) * 100)}%`,
      16, 148
    );
  }

  // ANLEGEN-Button (gedimmt ohne Auswahl; Panel bleibt nach ANLEGEN offen)
  ctx.fillStyle = '#0a0810';
  ctx.fillRect(BTN_EQUIP.x, BTN_EQUIP.y, BTN_EQUIP.w, BTN_EQUIP.h);
  ctx.strokeStyle = selected ? COLOR_GOLD : '#3a3542';
  ctx.strokeRect(BTN_EQUIP.x + 0.5, BTN_EQUIP.y + 0.5, BTN_EQUIP.w - 1, BTN_EQUIP.h - 1);
  ctx.textAlign = 'center';
  ctx.fillStyle = selected ? COLOR_NORMAL : COLOR_DIM;
  ctx.fillText('ANLEGEN', BTN_EQUIP.x + BTN_EQUIP.w / 2, BTN_EQUIP.y + 8);
  ctx.textAlign = 'left';
}
