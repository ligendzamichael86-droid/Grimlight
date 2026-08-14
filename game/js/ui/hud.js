// HUD, Vignette und Screens. Browser-Objekte nur innerhalb der Funktionen.

import { XP_THRESHOLDS, LEVEL_CAP } from '../items/progression.js';

const VIEW_W = 320;
const VIEW_H = 180;

// Grafikpass 5 RUNDE 2 (Jury K6.3, H-Rezept): Fuellrampe des Boss-Balkens —
// EIN Ton je Innenzeile ueber die 8 Zeilen der Innenflaeche, von der hellen
// Lichtkante oben zur tiefen Kante unten. Der R1-Balken bestand zu 93 % aus
// einem einzigen Rotton; keine Zeile dieser Rampe stellt mehr als ~13 % der
// Flaeche. Reihenfolge = Zeile 0 (oben) .. Zeile 7 (unten).
// ---------------------------------------------------------------------------
// GRAFIKPASS 5 RUNDE 3 (konvergente Jury-Liste #6, "Boss-Balken-Feinschliff"):
// die R2-Rampe hatte zwar 8 Toene, aber acht MINIMAL verschiedene — sie las
// weiterhin als ein Rotverlauf ohne Bandstruktur. Die R3-Rampe fasst die
// Fuellung in DREI klar getrennte Baender mit den vorgegebenen Ton-Werten:
//   Zeile 1-2  (245,150,130) = #f59682   helles Band
//   Zeile 3-5  (232,122,102) = #e87a66   Grundton
//   Zeile 6-7  (185, 80, 66) = #b95042   Tiefband
// Zeile 0 traegt den 1-px-GLANZ ENTLANG DER FUELLUNGS-OBERKANTE, der die
// frueher 2 px breite weisse Saeule am linken Fuellrand ERSETZT (Jury: die
// Saeule stand quer zur Balkenrichtung und las als Artefakt). Der Glanzton
// #f6c9bc ist derselbe wie bei der abgeloesten Saeule — nur Lage und Breite
// aendern sich, es kommt kein neuer Ton dazu.
const BOSS_FILL_RAMP = [
  '#f6c9bc', // 0 1-px-Glanz auf der Fuellungs-OBERKANTE
  '#f59682', // 1 (245,150,130)
  '#f59682', // 2
  '#e87a66', // 3 (232,122,102) Grundton
  '#e87a66', // 4
  '#e87a66', // 5
  '#b95042', // 6 (185,80,66) Tiefband
  '#b95042', // 7
];

// ---------------------------------------------------------------------------
// GRAFIKPASS 6 §6.7c — DAMAGE-LAG-STREIFEN ALS 8-ZEILEN-RAMPE.
// Der Lag-Streifen (das Stueck, das der Boss gerade verloren hat) war bis GP5
// eine FLAECHE aus einem Ton (#b8a09c) plus einer Unterkantenzeile — genau der
// Fehler, den die Jury an der Fuellung selbst schon abgestellt hatte. Er ist
// jetzt die ENTSAETTIGTE SCHWESTER von BOSS_FILL_RAMP: gleiche Bandstruktur
// (Glanz / hell / Grund / Tief), gleiche Zeilenzahl, aber jeder Ton um 65 %
// auf seine eigene Rec.601-Luma zusammengezogen und danach um +8 je Kanal
// angehoben. Rechenweg je Ton c -> c' = round(c + 0.65*(L(c) - c)) + 8:
//   #f6c9bc L 213,0 -> (225,209,204)+8 = (233,217,212) = #e9d9d4
//   #f59682 L 176,1 -> (200,167,160)+8 = (208,175,168) = #d0afa8
//   #e87a66 L 152,6 -> (180,142,135)+8 = (188,150,143) = #bc968f
//   #b95042 L 109,8 -> (136, 99, 95)+8 = (144,107,103) = #906b67
// Wirkung: der Streifen liest weiter als "eben verloren" (heller/blasser als
// die Fuellung), traegt aber dieselbe Lichtkante-oben/Tiefe-unten-Plastik und
// keine Zeile stellt mehr als ~13 % seiner Flaeche. Keine neue Zeichenlogik —
// dieselbe Zeilenschleife wie die Fuellung, weiterhin fillRect-only.
const BOSS_LAG_RAMP = [
  '#e9d9d4', // 0 Glanz-Schwester
  '#d0afa8', // 1
  '#d0afa8', // 2
  '#bc968f', // 3 Grundton-Schwester
  '#bc968f', // 4
  '#bc968f', // 5
  '#906b67', // 6 Tiefband-Schwester
  '#906b67', // 7
];

// ---------------------------------------------------------------------------
// GRAFIKPASS 6 §6.7a — XP-LEISTE: EIGENER FARBORT + 3-ZEILEN-RAMPE.
// Bis GP5 lief die XP-Fuellung im GRAUVIOLETT des Panel-Bevels (#9a90a6 /
// #7d7588) und die Rinne im Bevel-Mittelton #3a3542 — Leiste und Rahmen hatten
// denselben Farbort, der Fuellstand war auf 320x180 kaum ablesbar.
// MASSE BLEIBEN UNVERAENDERT (xh = 5, Innenhoehe 3 px; eine 8-Zeilen-Rampe wie
// beim Boss-Balken ist dort geometrisch unmoeglich, Review P1-B1/P3-B6):
// stattdessen genau DREI Zeilen hell/mittel/dunkel in MOOSGRUEN.
// Rec.601-Luma (L = 0,299R + 0,587G + 0,114B), nachgerechnet:
//   hell   #8fb85c = (143,184, 92) -> 42,8 + 108,0 + 10,5 = 161,2
//   mittel #6d9645 = (109,150, 69) -> 32,6 +  88,1 +  7,9 = 128,5
//   dunkel #4e7030 = ( 78,112, 48) -> 23,3 +  65,7 +  5,5 =  94,5
//   Rinne  #131e0d = ( 19, 30, 13) ->  5,7 +  17,6 +  1,5 =  24,8
// KONTRAST-BELEG (§6.7a fordert hellste Rampenzeile >= L 125 und Kontrast
// >= 100 L gegen die Rinne): hellste Zeile 161,2 >= 125 OK;
// 161,2 - 24,8 = 136,4 >= 100 OK. Auch die DUNKELSTE Rampenzeile liegt mit
// 94,5 - 24,8 = 69,7 L noch klar ueber der Rinne, der Fuellstand ist also auf
// jeder der drei Zeilen ablesbar. Rinne ~L 25 wie gefordert (24,8).
// Alles weiterhin fillRect-only; Blink (#f1e9d3) und Anfangs-Schimmer bleiben.
const XP_RAMP = ['#8fb85c', '#6d9645', '#4e7030']; // Zeile 0 (oben) .. 2 (unten)
const XP_RINNE = '#131e0d';

// ---------------------------------------------------------------------------
// GRAFIKPASS 6 §6.7b — 3x5-PIXELZIFFERN FUER GOLD- UND TRANK-WERT.
// Die zwei Zahlen waren die letzten VEKTOR-Glyphen im Spielfeld-HUD: '8px
// monospace' rastert je nach Systemschrift mit Antialiasing und Subpixel-
// Vorschueben, im 320x180-Backing-Store liest das als weiche Grauflecken neben
// harten Pixel-Icons. Ersatz ist eine 3x5-Bitmap-Ziffer, gezeichnet
// AUSSCHLIESSLICH mit fillRect (die Flusstest-Stubs kennen nichts anderes).
//
// DIE fillText-ZUEGE BLEIBEN UNVERAENDERT STEHEN (bindend, §6.7b): sie sind die
// TEST-SONDE, ueber die check_main_slice1/check_inventory_slice2/probe_god den
// Goldstand lesen ('GOLD <n>' per startsWith). Sie werden nur VERDECKT.
// Zeilen-Muster von oben nach unten, '1' = Texel.
const PIXEL_DIGITS = [
  ['111', '101', '101', '101', '111'], // 0
  ['010', '110', '010', '010', '111'], // 1
  ['111', '001', '111', '100', '111'], // 2
  ['111', '001', '111', '001', '111'], // 3
  ['101', '101', '111', '001', '001'], // 4
  ['111', '100', '111', '001', '111'], // 5
  ['111', '100', '111', '101', '111'], // 6
  ['111', '001', '001', '001', '001'], // 7
  ['111', '101', '111', '101', '111'], // 8
  ['111', '101', '111', '001', '111'], // 9
];
const PIXEL_DIGIT_PITCH = 4; // 3 px Glyphe + 1 px Luecke
const PIXEL_DIGIT_MAX = 6;   // s. HUD_VAL_W-Herleitung unten

// Zeichnet eine ganze Zahl als Pixelziffern; erst der 1-px nach unten-rechts
// versetzte Kontur-Zug, dann der Fuellzug (dieselbe Doppel-Draw-Logik wie der
// GOLD-fillText, §5.D6 GP5) — die Zahl steht damit auch auf hellem Panel.
function drawPixelNumber(ctx, value, x, y, color, kontur) {
  let s = String(Math.max(0, Math.floor(Number(value) || 0)));
  if (s.length > PIXEL_DIGIT_MAX) s = '9'.repeat(PIXEL_DIGIT_MAX);
  for (const pass of [1, 0]) {
    ctx.fillStyle = pass ? kontur : color;
    const o = pass ? 1 : 0;
    for (let i = 0; i < s.length; i++) {
      const g = PIXEL_DIGITS[s.charCodeAt(i) - 48];
      if (!g) continue;
      const gx = x + i * PIXEL_DIGIT_PITCH + o;
      for (let ry = 0; ry < 5; ry++) {
        const row = g[ry];
        for (let rx = 0; rx < 3; rx++) {
          if (row[rx] === '1') ctx.fillRect(gx + rx, y + ry + o, 1, 1);
        }
      }
    }
  }
}

// --- GEOMETRIE DER ZWEI DECKRECHTECKE (feste Konstanten, KEIN measureText) ---
// Panel-Bandtoene (woertlich aus dem Panel-Block in drawHUD, px=2 py=2 pw=54
// ph=40): das helle Band ist fillRect(px+1, py+1, pw-2, round((ph-2)/3)) =
// (3, 3, 52, 13) und belegt damit die Zeilen y3..y15; ab y16 liegt das dunkle
// Mittelband '#0a0a12'. DIE BANDGRENZE IST ALSO y15/y16 — und genau darum
// braucht es ZWEI Deckrechtecke: der GOLD-Zug beginnt bei y15 und laeuft bis
// y23, kreuzt die Grenze also.
const HUD_BAND_HELL = '#10101c';    // Zeilen y3..y15
const HUD_BAND_DUNKEL = '#0a0a12';  // ab y16
const HUD_BAND_GRENZE = 16;         // erste Zeile des dunklen Bandes
// x-Herleitung: '8px monospace' hat 0,6 em Vorschub = 4,8 px je Zeichen.
//   GOLD  fillText('GOLD <n>', 4, 15): Label 'GOLD' belegt x 4,0..23,2, der
//         Kontur-Zug bei (5,16) verschiebt es auf 5,0..24,2 -> letzte
//         beschriebene Spalte x = 24. Der WERT beginnt bei 4 + 5*4,8 = 28,0.
//   TRANK fillText('x <n>', 16, 27): Label 'x ' belegt 16,0..25,6, der WERT
//         beginnt bei 16 + 2*4,8 = 25,6.
// Die linkeste Spalte, die NUR Wert-Tinte traegt, ist damit x = 25.
const HUD_VAL_X = 25;
// Rechte Grenze: der dunkle Innenbevel des Panels liegt auf x = px+pw-2 = 54,
// die letzte frei ueberschreibbare Spalte ist 53 -> Breite 53-25+1 = 29.
// Daraus auch PIXEL_DIGIT_MAX: 6 Ziffern * 4 px + 1 px Kontur = 25 px ab
// HUD_DIGIT_X = 26 -> letzte Spalte 50 < 54.
const HUD_VAL_W = 29;
// y-Herleitung: GOLD-Zug top y15 (Kontur y16) -> Tinte bis y23/y24;
// Trank-Zug top y27 (kein Kontur-Zug) -> Tinte bis y35. Die XP-Leiste beginnt
// bei y36 und bleibt damit unberuehrt.
// NACHGEMESSEN am 320x180-Backing-Store (Chromium, DejaVu Sans Mono): die
// Ziffern-Glyphe ragt EINE Zeile ueber die textBaseline-'top'-Kante hinaus —
// bei y15 gesetzt liegt ihre oberste Antialiasing-Zeile auf y14. Der Deckel
// beginnt deshalb bei y14; y14 liegt noch im HELLEN Panelband (y3..y15), das
// erste Deckrechteck ist also 2 Zeilen hoch.
const HUD_DECK_Y0 = 14;
const HUD_DECK_Y1 = 35;
// Pixelziffern-Anker (Mitte der jeweiligen Textzeile, 5 px hoch).
const HUD_DIGIT_X = 26;
const HUD_GOLD_DIGIT_Y = 17;
const HUD_POT_DIGIT_Y = 29;

export function drawHUD(ctx, player, input, gfx) {
  // Grafikpass 3 §2.6: dezentes Panel HINTER dem bestehenden HUD-Block oben links
  // (Herzen, GOLD, Trank, XP-Balken). AUSSCHLIESSLICH aus fillRect (kein
  // roundRect/strokeRect/Pfad — die Flusstest-Stubs kennen sie nicht). "Rundung"
  // per Eckabzug: die Grundflaeche aus 3 fillRects (die vier 1-px-Eckpixel bleiben
  // frei). Panel-Fuellung bewusst NICHT '#000' (der fadeAlpha-Detektor filtert nur
  // '#000'-VOLLBILD-Rects 320x180 — dieses Panel ist klein). KEINE Layout-/Logik-
  // Aenderung: alle folgenden Zeichnungen bleiben identisch platziert.
  //
  // Runde 2 (GP3_RUNDE1_JURY.md Anweisung 7): der flache 1-Ton-Rand wird zu einem
  // 2-Ton-Bevel — hell '#575061' Alpha 0.5 oben+links (Lichtkante oben-links),
  // dunkel '#14101a' Alpha 0.6 unten+rechts (Eigenschatten); die vier Eckpixel
  // bleiben abgeschraegt (frei). Zusaetzlich ein 1-px-Schlagschatten ('#000'
  // Alpha 0.3) als L-Form unten+rechts HINTER dem Panel. Die Schatten-Rects sind
  // klein (54x1 bzw. 1x40), also KEIN Vollbild -> der fadeAlpha-Detektor der
  // Flusstests (verlangt args[2]===320 && args[3]===180) greift NICHT. Alles
  // weiterhin fillRect-only.
  {
    const px = 2, py = 2, pw = 54, ph = 40;
    ctx.save();
    // 1-px-Schlagschatten unten+rechts, hinter dem Panel (nicht vollbild)
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#000';
    ctx.fillRect(px + 1, py + ph, pw, 1);         // Schatten unter der Unterkante (1 px nach rechts versetzt)
    ctx.fillRect(px + pw, py + 1, 1, ph);         // Schatten rechts der rechten Kante (1 px nach unten versetzt)
    // Grundflaeche (3 fillRects, vier Eckpixel frei = abgeschraegt)
    // Grafikpass 5 §1.4 (Jury-Dauerklage 'HUD schwimmt auf der Welt'): die
    // Grundflaeche ist jetzt VOLL DECKEND (1.0 statt 0.55). 0.9 haette die Klage
    // bestehen lassen (Review) — durch ein halbtransparentes Panel las die
    // Gras-/Ziegeltextur weiter durch und fraß die Lesbarkeit der Herzen.
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(px, py + 1, pw, ph - 2);         // Mittelband (volle Breite)
    ctx.fillRect(px + 1, py, pw - 2, 1);          // obere Zeile (Ecken frei)
    ctx.fillRect(px + 1, py + ph - 1, pw - 2, 1); // untere Zeile (Ecken frei)
    // §2.6 [GP4] leichter Vertikal-Gradient: oberes Drittel +6 Luma (ein
    // helleres fillRect-Band ueber der Grundflaeche, kein Gradient-Objekt).
    ctx.fillStyle = '#10101c';
    ctx.fillRect(px + 1, py + 1, pw - 2, Math.round((ph - 2) / 3));
    // §(c) [GP4 R2] 1-px-Innen-Bevel in Boss-Balken-Sprache, 1 px INNEN vom
    // erhabenen Aussenrahmen: oben/links +1 Stufe (hell #575061), unten/rechts
    // -1 Stufe (dunkel #14101a) — dieselben Toene wie der XP-/Boss-Bar-Innenbevel.
    // Ersetzt den frueheren dunklen Innen-Schlagschatten oben/links (der als
    // Vertiefung las und der Bevel-Lichtkante widersprach). fillRect-only.
    // §(d) [GP4 R3] Bevel NACHGESCHAERFT (Juror-M: 'echten eingelassenen Bevel'):
    // Highlight-Alpha 0.4 -> 0.6, Schatten-Alpha 0.5 -> 0.7 — der eingelassene
    // Bevel liest jetzt klar (Highlight oben/links, Schatten unten/rechts).
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = '#575061';
    ctx.fillRect(px + 2, py + 1, pw - 4, 1);      // Innenbevel oben (hell)
    ctx.fillRect(px + 1, py + 2, 1, ph - 4);      // Innenbevel links (hell)
    // Grafikpass 5 §1.4: Schatten-Ton des Bevels von #14101a auf den MITTELTON
    // #3a3542 (beide Vorkommen, innen wie aussen). Auf der jetzt voll deckenden,
    // sehr dunklen Grundflaeche verschwand #14101a komplett — der Bevel las nur
    // noch einseitig (Lichtkante ohne Gegenkante).
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = '#3a3542';
    ctx.fillRect(px + 2, py + ph - 2, pw - 4, 1); // Innenbevel unten (dunkel)
    ctx.fillRect(px + pw - 2, py + 2, 1, ph - 4); // Innenbevel rechts (dunkel)
    // 2-Ton-Bevel: hell oben+links (Lichtkante)
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#575061';
    ctx.fillRect(px + 1, py, pw - 2, 1);          // Bevel oben (hell)
    ctx.fillRect(px, py + 1, 1, ph - 2);          // Bevel links (hell)
    // 2-Ton-Bevel: dunkel unten+rechts (Eigenschatten) — §1.4: Mittelton #3a3542.
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = '#3a3542';
    ctx.fillRect(px + 1, py + ph - 1, pw - 2, 1); // Bevel unten (dunkel)
    ctx.fillRect(px + pw - 1, py + 1, 1, ph - 2); // Bevel rechts (dunkel)
    // §(c) [GP4 R2] 2x2-Nieten in den vier Ecken in Boss-Balken-Sprache: heller
    // Metallkopf (#575061) mit 1-px dunklem Schattenpunkt (#14101a) unten-rechts.
    // §(d) [GP4 R3] zusaetzlich 1-px Glanzpunkt oben-links (#9a90a6, heller als der
    // Kopf) — die Niete bekommt so ihre Specular-Spitze (Juror-M). fillRect-only.
    const rivets = [
      [px + 1, py + 1],           // oben-links
      [px + pw - 3, py + 1],      // oben-rechts
      [px + 1, py + ph - 3],      // unten-links
      [px + pw - 3, py + ph - 3], // unten-rechts
    ];
    for (const [rx, ry] of rivets) {
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = '#575061';
      ctx.fillRect(rx, ry, 2, 2);
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = '#14101a';
      ctx.fillRect(rx + 1, ry + 1, 1, 1);      // Schattenpunkt unten-rechts
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = '#9a90a6';
      ctx.fillRect(rx, ry, 1, 1);              // §(d) Glanzpunkt oben-links
    }
    ctx.restore();
  }

  // Pro Herz 2 HP: 2 = voll, 1 = halb (linke Hälfte von heart_full über
  // heart_empty geclippt), 0 = leer. So ist jeder einzelne Treffer sichtbar.
  const hearts = player.maxHp / 2;
  for (let i = 0; i < hearts; i++) {
    const heartHp = Math.max(0, Math.min(2, player.hp - i * 2));
    const x = 4 + i * 10;
    if (heartHp === 2) {
      ctx.drawImage(gfx.heart_full, x, 4);
    } else {
      ctx.drawImage(gfx.heart_empty, x, 4);
      if (heartHp === 1) {
        const half = Math.floor(gfx.heart_full.width / 2);
        ctx.drawImage(gfx.heart_full, 0, 0, half, gfx.heart_full.height, x, 4, half, gfx.heart_full.height);
      }
    }
  }
  ctx.font = '8px monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  // Grafikpass 5 §5.D6 GOLD-DOPPEL-DRAW: erst ein 1-px versetzter Dunkel-Zug
  // (#14101a), dann der goldene Text darueber — die Zahl bekommt eine harte
  // Kontur und steht auch auf hellem Panel-Bevel. Testneutral: die Flusstests
  // lesen den GOLD-Text ueber find/startsWith, beide Zuege tragen denselben
  // String (der erste Treffer ist unveraendert 'GOLD <n>').
  ctx.fillStyle = '#14101a';
  ctx.fillText(`GOLD ${player.gold}`, 5, 16);
  ctx.fillStyle = '#f0bf4e';
  ctx.fillText(`GOLD ${player.gold}`, 4, 15);

  // Trank-Anzeige: Flaschen-Icon + Zähler unter den Herzen/Gold
  ctx.drawImage(gfx.potion, 4, 25);
  ctx.fillStyle = '#d6cbb1';
  ctx.fillText(`x ${player.potions ?? 0}`, 16, 27);

  // GRAFIKPASS 6 §6.7b: die beiden fillText-WERTE oben werden jetzt von ZWEI
  // Deckrechtecken (eines je Panel-Farbband, Grenze y15/y16) ueberdeckt und
  // durch 3x5-Pixelziffern ersetzt. Herleitung aller Konstanten am Dateikopf.
  // Reihenfolge zwingend HIER: nach beiden fillText-Zuegen (sonst deckt nichts)
  // und VOR dem Boss-Schluessel-Icon (das bei (30,25) im Deckbereich liegt und
  // sichtbar bleiben muss). GOLD-Theta auf den Game-Over-/Sieg-Schirmen bleibt
  // bewusst fillText (Deklarationsliste §9) — dort gibt es kein Panel-Band, das
  // man deckungsgleich nachziehen koennte.
  {
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.fillStyle = HUD_BAND_HELL;
    ctx.fillRect(HUD_VAL_X, HUD_DECK_Y0, HUD_VAL_W, HUD_BAND_GRENZE - HUD_DECK_Y0);
    ctx.fillStyle = HUD_BAND_DUNKEL;
    ctx.fillRect(HUD_VAL_X, HUD_BAND_GRENZE, HUD_VAL_W, HUD_DECK_Y1 - HUD_BAND_GRENZE + 1);
    drawPixelNumber(ctx, player.gold, HUD_DIGIT_X, HUD_GOLD_DIGIT_Y, '#f0bf4e', '#14101a');
    drawPixelNumber(ctx, player.potions ?? 0, HUD_DIGIT_X, HUD_POT_DIGIT_Y, '#d6cbb1', '#14101a');
    ctx.restore();
  }

  // Boss-Schluessel-Icon (§3): 8x8 bei (30,25) neben dem Trank-Zaehler,
  // sichtbar sobald der Boss-Schluessel im zelda-Slot liegt.
  if (player.inv && player.inv.zelda && player.inv.zelda.includes('boss_key') && gfx.icon_key) {
    ctx.drawImage(gfx.icon_key, 30, 25);
  }

  // XP-Leiste (§2.6 GP4): 26x5 bei (4,36), unter der Trank-Zeile, in Boss-Bar-
  // Sprache: 1-px-Dunkelrahmen, entsaettigte Rinne, 2-Band-Gradient-Fuellung
  // (oberes Band heller), 1-px-Innenbevel (hell oben-links, dunkel unten-rechts),
  // KEINE Ticks. Fuellstand = Fortschritt zwischen den zwei umgebenden Schwellen
  // (Update sofort); bei LEVEL_CAP dauerhaft voll; beim Level-Up Weissblink
  // #f1e9d3. AUSSCHLIESSLICH fillRect. Kollisionsfrei (Panel y2..42, Boss-Bar
  // 120,7). KEINE Levelzahl im HUD (die kommt in die Inventar-Fusszeile).
  const prog = player.prog;
  if (prog) {
    const xx = 4, xy = 36, xw = 26, xh = 5;
    const ix = xx + 1, iy = xy + 1, iw = xw - 2, ih = xh - 2; // Innenflaeche 5,37,24,3
    ctx.save();
    // 1-px-Dunkelrahmen (Vollflaeche, Innen wird ueberfuellt)
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#14101a';
    ctx.fillRect(xx, xy, xw, xh);
    // GP6 §6.7a: Rinne im EIGENEN Farbort (dunkles Moosgruen, L 24,8) statt im
    // Bevel-Grauviolett — sonst liegen Rinne und Rahmen auf derselben Farbe.
    ctx.fillStyle = XP_RINNE;
    ctx.fillRect(ix, iy, iw, ih);
    let frac = 1;
    if (prog.level < LEVEL_CAP) {
      const lo = XP_THRESHOLDS[prog.level - 1];
      const hi = XP_THRESHOLDS[prog.level];
      frac = hi > lo ? Math.max(0, Math.min(1, (prog.xp - lo) / (hi - lo))) : 1;
    }
    const fw = Math.round(iw * frac);
    if (fw > 0) {
      const blink = (player.xpBlink ?? 0) > 0;
      // GP6 §6.7a: 3-ZEILEN-RAMPE statt 2-Band-Gradient — je Innenzeile ein
      // eigener Moosgruen-Ton (hell oben = Lichtkante, dunkel unten = Tiefe).
      // ih ist konstant 3 (Masse unveraendert); die Schleife bleibt trotzdem
      // ih-generisch und klammert auf die Rampenlaenge, damit eine spaetere
      // Masse-Aenderung nicht still ins Leere greift.
      for (let r = 0; r < ih; r++) {
        ctx.fillStyle = blink ? '#f1e9d3' : XP_RAMP[Math.min(r, XP_RAMP.length - 1)];
        ctx.fillRect(ix, iy + r, fw, 1);
      }
      // Grafikpass 5 §5.D6: 1-px-ANFANGS-SCHIMMER — die erste Spalte der
      // Fuellung traegt den hellsten Ton. Der Balken bekommt damit einen
      // Lichtanschlag und liest schon bei minimalem Fortschritt als GEFUELLT
      // (vorher war der erste Fortschritt vom Rinnen-Ton kaum zu trennen).
      ctx.fillStyle = '#f1e9d3';
      ctx.fillRect(ix, iy, 1, ih);
    }
    // 1-px-Innenbevel: hell oben+links (Lichtkante)
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = '#575061';
    ctx.fillRect(ix, iy, iw, 1);
    ctx.fillRect(ix, iy, 1, ih);
    // 1-px-Innenbevel: dunkel unten+rechts (Eigenschatten)
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#14101a';
    ctx.fillRect(ix, iy + ih - 1, iw, 1);
    ctx.fillRect(ix + iw - 1, iy, 1, ih);
    ctx.restore();
  }

  // Boss-HP-Balken (§3, aus player.bossBar gespiegelt): 80x12 bei (120,7)
  // (Grafikpass 5 §1.5, vorher 80x8).
  // RUNDE 2 (Jury K6.3: "weiterhin flach, 93 % ein Rotton, Glanz auf Zeile 2
  // statt 1"): 12-px-Rahmen mit ZEILENGENAUER Rollenverteilung — aeussere
  // Kontur / Rahmenlicht / 8 Zeilen Fuellrampe / Rahmenschatten / Kontur —,
  // 16-px-Teilstriche, 1-px-Glanz auf der Fuellungs-OBERKANTE (Runde 3; die
  // 2-px-Saeule am linken Fuellrand ist entfallen) und eine Damage-Lag-Schicht
  // (main.js fuehrt die Anzeige-Breite rein visuell nach). AUSSCHLIESSLICH fillRect
  // (keine strokeRect/arc/Gradient-Objekte). Bar bleibt in drawHUD NACH
  // lighting.draw, damit der ambientAlpha-Detektor der Boss-Flusstests (erstes
  // Teilalpha-fillRect auf dem Lighting-Offscreen, NICHT auf dem Haupt-Canvas)
  // unberuehrt bleibt. Keine Gameplay-Werte (bb.hp/bb.maxHp nur gelesen).
  // Kein Namenstext (der Name kommt als Toast).
  const bb = player.bossBar;
  if (bb) {
    // Grafikpass 5 §1.5: bh 8 -> 12 (der Balken war auf 320x180 schlicht zu
    // duenn, um als Boss-Leiste zu lesen). Kollisionsfrei belegt: das HUD-Panel
    // endet bei x=56, der Balken beginnt bei (120,7) und endet bei y=19.
    const bx = 120, by = 7, bw = 80, bh = 12;             // Aussenmasse
    const ix = bx + 2, iy = by + 2, iw = bw - 4, ih = bh - 4; // Innenflaeche 122,9,76,8
    ctx.save();
    ctx.globalAlpha = 1;
    // --- RAHMEN: Kontur / Rahmenlicht / Rahmenschatten (Runde 2, H-Rezept) ---
    // Der R1-Balken las flach, weil sein 2-px-Rahmen EIN einziger Mittelton war
    // (#575061 rundum) — ohne Lichtrichtung ist er eine Umrandung, kein Metall.
    // Jetzt tragen die 12 Zeilen eine Rolle je Zeile:
    //   by+0    aeussere KONTUR (dunkelster Ton, Ecken frei)
    //   by+1    RAHMENLICHT oben (und Spalte bx+1 links) — Licht von oben-links
    //   by+2..9 FUELLRAMPE (8 Zeilen, siehe unten)
    //   by+10   RAHMENSCHATTEN unten (und Spalte bx+bw-2 rechts)
    //   by+11   aeussere KONTUR
    ctx.fillStyle = '#0d0a12';                   // Kontur (Ecken bleiben frei)
    ctx.fillRect(bx, by + 1, bw, bh - 2);
    ctx.fillRect(bx + 1, by, bw - 2, 1);
    ctx.fillRect(bx + 1, by + bh - 1, bw - 2, 1);
    ctx.fillStyle = '#6f6879';                   // Rahmenlicht oben + links
    ctx.fillRect(bx + 1, by + 1, bw - 2, 1);
    ctx.fillRect(bx + 1, by + 1, 1, bh - 2);
    ctx.fillStyle = '#2a2632';                   // Rahmenschatten unten + rechts
    ctx.fillRect(bx + 1, by + bh - 2, bw - 2, 1);
    ctx.fillRect(bx + bw - 2, by + 1, 1, bh - 2);
    // --- RINNE: leerer Teil der Leiste (dunkel, entsaettigt) ---
    ctx.fillStyle = '#3a2320';
    ctx.fillRect(ix, iy, iw, ih);
    const fw = Math.max(0, Math.round((iw * bb.hp) / bb.maxHp));
    // --- DAMAGE-LAG-SCHICHT (Runde 2): die Anzeige-Breite laeuft der echten
    // Fuellung NACH (main.js fuehrt sie rein visuell nach, ~1 px je 2 Frames).
    // Sie liegt HINTER der aktuellen Fuellung — sichtbar bleibt genau das
    // Stueck, das der Boss gerade verloren hat: ein entsaettigt HELLER Streifen,
    // der binnen Sekundenbruchteilen einlaeuft. Fehlt bb.lagW (Alt-Aufrufer),
    // faellt die Schicht still weg.
    const lagW = Math.max(fw, Math.min(iw, Math.round(bb.lagW ?? fw)));
    if (lagW > fw) {
      // GP6 §6.7c: 8-ZEILEN-RAMPE (entsaettigte Schwester von BOSS_FILL_RAMP,
      // Herleitung im Kopf der Datei) statt Flaeche + Unterkantenzeile.
      for (let r = 0; r < ih; r++) {
        ctx.fillStyle = BOSS_LAG_RAMP[Math.min(r, BOSS_LAG_RAMP.length - 1)];
        ctx.fillRect(ix, iy + r, lagW, 1);
      }
    }
    // --- FUELLRAMPE ueber 8 ZEILEN (Runde 2): der R1-Balken war zu 93 % EIN
    // Rotton (3 Baender, davon eines 6 px hoch). Jetzt traegt JEDE der 8
    // Innenzeilen ihren eigenen Ton — hell oben (Lichtkante), Grundton in der
    // Mitte, tief unten. Keine Zeile stellt mehr als ~13 % der Flaeche.
    // RUNDE 3: Zeile 0 der Rampe IST der 1-px-Glanz auf der Fuellungs-Oberkante
    // (er laeuft ueber die ganze Fuellbreite mit, statt als 2-px-Saeule am
    // linken Fuellrand zu stehen). Die frueheren zwei Glanzspalten sind damit
    // ersatzlos entfallen — ein Zeichenblock weniger, kein Sonderfall fuer
    // fw = 1 / fw >= 2 mehr.
    if (fw > 0) {
      for (let r = 0; r < ih; r++) {
        ctx.fillStyle = BOSS_FILL_RAMP[r];
        ctx.fillRect(ix, iy + r, fw, 1);
      }
    }
    // --- 16-px-TEILSTRICHE (Runde 2, H): alle 16 px eine 1-px-Marke ueber die
    // Innenhoehe MINUS je 1 px oben/unten (die Licht- und die Tiefzeile der
    // Rampe bleiben durchgehend — sonst zerhacken die Striche den Balken zu
    // Kaestchen, die R1-Klage "liest als Ladebalken"). Gedaempft ueber
    // globalAlpha, damit sie Skala geben statt Segmente zu bauen.
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = '#14101a';
    for (let t = 16; t < iw; t += 16) {
      ctx.fillRect(ix + t, iy + 1, 1, ih - 2);
    }
    ctx.restore();
  }

  // Item-Box oben rechts (Slice 2): erscheint erst, wenn das Inventar etwas
  // enthält (Zweitwaffe, Tasche oder angelegte Slots). Zustand kommt aus
  // player.zeldaState/zeldaBlink (von main.js gespiegelt, HUD kennt keine
  // Projektile). Roter Neu-Punkt solange inv.newFlag.
  const inv = player.inv;
  if (inv && (inv.zelda.length > 0 || inv.items.length > 0
    || inv.equipped.weapon || inv.equipped.armor || inv.equipped.ring)) {
    ctx.save();
    ctx.globalAlpha = 0.75;
    ctx.fillStyle = '#14101a';
    ctx.fillRect(296, 4, 20, 20);
    ctx.strokeStyle = '#575061';
    ctx.lineWidth = 1;
    ctx.strokeRect(296.5, 4.5, 19, 19);
    if (inv.zelda.includes('boomerang')) {
      if (player.zeldaState === 'air') ctx.globalAlpha = 0.3; // fliegt gerade
      ctx.drawImage(gfx.icon_boomerang, 298, 6);
      ctx.globalAlpha = 0.75;
    }
    if ((player.zeldaBlink ?? 0) > 0) {
      // 3-Frame-Weissblink beim Fang
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(296, 4, 20, 20);
    }
    ctx.restore();
    if (inv.newFlag) {
      ctx.fillStyle = '#ae2f2a';
      ctx.fillRect(312, 5, 3, 3);
    }
  }

  if (input.touch.active) {
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = '#d6cbb1';
    ctx.lineWidth = 1;
    if (input.touch.joyBaseX || input.touch.joyBaseY) {
      ctx.beginPath();
      ctx.arc(input.touch.joyBaseX, input.touch.joyBaseY, input.touch.joyRadius || 20, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#d6cbb1';
      ctx.beginPath();
      ctx.arc(input.touch.joyX, input.touch.joyY, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    // Buttons A (Angriff), B (Trank), W (Zweitwaffe); gedrückt = rot
    // gefüllt. Nur sichtbare Buttons zeichnen (W erst mit Bumerang,
    // main.js setzt visible).
    for (const b of input.touch.buttons) {
      if (b.visible === false) continue;
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = b.pressed ? '#ae2f2a' : '#3a3542';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = '#d6cbb1';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.label, b.x, b.y + 1);
    }
    // SLICE 4 §4.2: PAUSE-KNOPF. EIN BESITZER — Geometrie und Sichtbarkeit
    // stehen in input.touch.pause (core/input.js), hier wird nur daraus
    // gezeichnet. Das Symbol sind ZWEI fillRect-Balken statt eines
    // fillText-Sonderzeichens: '8px monospace' ist plattformabhaengig
    // (Landkarte B §5.5), und jeder neue fillText-Zug ist eine potenzielle
    // Test-Sonde (Review P1-m1). Kein Text, kein Risiko.
    const pz = input.touch.pause;
    if (pz && pz.visible) {
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = pz.pressed ? '#ae2f2a' : '#3a3542';
      ctx.beginPath();
      ctx.arc(pz.x, pz.y, pz.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = '#d6cbb1';
      ctx.fillRect(pz.x - 4, pz.y - 4, 2, 8);
      ctx.fillRect(pz.x + 2, pz.y - 4, 2, 8);
    }
    ctx.restore();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
  }

  // GOD-MODE-Hinweis (Testwerkzeug): kleines gelbes GOTT oben rechts, links
  // NEBEN der Item-Box (die belegt 296..316) und rechts vom Boss-Balken (endet
  // bei 200) — kollisionsfrei. Nur sichtbar, wenn main.js ?god=1 gelesen und
  // an createPlayer durchgereicht hat; ohne das Flag wird hier nichts gezeichnet.
  if (player.god) {
    ctx.save();
    ctx.font = '8px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#14101a';   // 1-px-Kontur wie beim GOLD-Text
    ctx.fillText('GOTT', 293, 6);
    ctx.fillStyle = '#f0bf4e';
    ctx.fillText('GOTT', 292, 5);
    ctx.restore();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
  }
}

// Pickup-Popup (Slice 2): schwebt in 0,9 s um 8 px über dem Spielerkopf
// nach oben, danach setzt main.js den Toast auf null. Ein Toast gleichzeitig;
// Slice 3: ein neuer ersetzt den alten NUR bei >= Prioritaet (level_up >
// key/heart/weapon_found > item_pickup > Rest; main.js/pushToast).
// toast = { text, color, prio, t }.
export function drawPickupToast(ctx, camera, player, toast) {
  if (!toast) return;
  const progress = Math.min(toast.t / 0.9, 1);
  const x = Math.round(player.x + player.w / 2 - camera.x);
  // Kopf = Fußkante minus Sprite-Höhe (Held 16x24), plus Aufwärts-Drift
  const y = Math.round(player.y + player.h - 24 - 10 - progress * 8 - camera.y);
  ctx.font = '8px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#14101a';
  ctx.fillText(toast.text, x + 1, y + 1); // Schatten für Lesbarkeit
  ctx.fillStyle = toast.color;
  ctx.fillText(toast.text, x, y);
  ctx.textAlign = 'left';
}

// Nebelschwaden (nur bei map.fog === true): 8 driftende fog_blob-Sprites,
// deterministisch aus timeSec (kein Math.random im Renderpfad).
// Dokumentierte Präzisierung (Spec-Review): die Blobs wrappen über den
// VIEWPORT (kamera-relativ mit halber Parallaxe), nicht über die Map —
// optisch gleichwertig, ohne Map-Dimensionen in der Signatur. Zusätzlich
// braucht die Funktion gfx für das fog_blob-Sprite:
// drawFog(ctx, camera, gfx, timeSec).
const FOG_BLOBS = 8;

export function drawFog(ctx, camera, gfx, timeSec) {
  const img = gfx.fog_blob;
  const spanW = VIEW_W + 96; // Wrap-Bereich mit Rand (Blob 32×16)
  const spanH = VIEW_H + 48;
  ctx.save();
  ctx.globalAlpha = 0.1;
  for (let i = 0; i < FOG_BLOBS; i++) {
    const speed = 4 + (i % 5); // 4-8 px/s
    let x = ((i * 47 + 13) + timeSec * speed - camera.x * 0.5) % spanW;
    if (x < 0) x += spanW;
    let y = ((i * 71 + 29) + Math.sin(timeSec * 0.35 + i * 1.7) * 5 - camera.y * 0.5) % spanH;
    if (y < 0) y += spanH;
    ctx.drawImage(img, Math.round(x - 64), Math.round(y - 24));
  }
  ctx.restore();
}

let vignetteCanvas = null;

// Grafikpass 5 §5.D1: die Vignette wird QUANTISIERT gebacken — 6 Alpha-Stufen
// (0 .. 0.45 in Schritten von 0.09) plus geordnetes Bayer-4x4-Dither an den
// Bandgrenzen. Der weiche Gradient war der letzte "moderne Weichzeichner" im
// Bild; als Stufen+Dither spricht der Rand dieselbe Raster-Sprache wie
// Lit-Dither und Wasser-Tiefen.
// DETEKTOR-PFLICHT (§0.1): der Bake laeuft auf einem NICHT-Main-Canvas — die
// Deckung steckt deshalb in der rgba-FUELLFARBE, globalAlpha bleibt exakt 1.
// Sonst waere dieser fillRect der erste Teilalpha-fillRect auf einem
// Offscreen und der ambientAlpha-Detektor der Boss-Flusstests laese ihn statt
// lighting.js:66.
const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];
// GRAFIKPASS 6 §3.3 — VIGNETTE ENTSCHAERFT (testfreier Begleit-Hebel des
// Belichtungs-Sockels). Die GP5-Vignette zog die Bildraender um bis zu 0,45
// Deckung ins Schwarze; zusammen mit dem abgesenkten Ambient (§3.2) haette sie
// die M1-Baender "Anteil L<16" allein am Rand gerissen. Jetzt:
//   VIG_STEP 0,09 -> 0,06  UND  Profil auf 2/3 reskaliert -> a_max = 0,30.
// VIG_MAX_LEVEL bleibt 5 (die STUFENKARTE ist damit identisch, jede Stufe
// traegt nur noch 2/3 Deckung) — 5 * 0,06 = 0,30 = Profil-Maximum, die
// Bayer-Dither-Sprache des Randes bleibt unveraendert erhalten.
const VIG_STEP = 0.06;               // Stufenhoehe; 5 * 0.06 = 0.30 = neues Max (§3.3)
const VIG_MAX_LEVEL = 5;             // Stufen 0..5 = 6 Stufen (unveraendert)
// Reskalierungsfaktor des Radialprofils (0,45 -> 0,30).
const VIG_SCALE = 2 / 3;
// Vorgerechnete Fuellfarben je Stufe (Ton wie bisher: fast schwarzes Blau).
const VIG_STYLES = [];
for (let i = 0; i <= VIG_MAX_LEVEL; i++) VIG_STYLES.push(`rgba(5,3,9,${(i * VIG_STEP).toFixed(2)})`);

export function drawVignette(ctx) {
  if (!vignetteCanvas) {
    vignetteCanvas = document.createElement('canvas');
    vignetteCanvas.width = VIEW_W;
    vignetteCanvas.height = VIEW_H;
    const vctx = vignetteCanvas.getContext('2d');
    // Radiales Profil wie GP3 (Innenradius 90 klar, Mittel-Stop 0.55 -> 0.14,
    // Aussenradius 190 -> 0.45), aber in 6 Stufen gerastert statt interpoliert.
    // GP6 §3.3: dasselbe Profil mit VIG_SCALE = 2/3 multipliziert
    // (0,14 -> 0,0933 und 0,45 -> 0,30) — Form identisch, Amplitude gesenkt.
    const cx = VIEW_W / 2;
    const cy = VIEW_H / 2;
    const R_IN = 90;
    const R_OUT = 190;
    vctx.globalAlpha = 1;
    for (let y = 0; y < VIEW_H; y++) {
      let runStart = 0;
      let runStyle = null;
      for (let x = 0; x <= VIEW_W; x++) {
        let style = null;
        if (x < VIEW_W) {
          const dx = x + 0.5 - cx;
          const dy = y + 0.5 - cy;
          const d = Math.sqrt(dx * dx + dy * dy);
          const t = Math.max(0, Math.min(1, (d - R_IN) / (R_OUT - R_IN)));
          // stueckweise lineares Profil (dieselben zwei Abschnitte wie der
          // fruehere Gradient), danach Stufe + Bayer-Schwelle.
          const a = (t <= 0.55 ? (t / 0.55) * 0.14 : 0.14 + ((t - 0.55) / 0.45) * 0.31) * VIG_SCALE;
          const lvl = Math.min(
            VIG_MAX_LEVEL,
            Math.floor(a / VIG_STEP + BAYER4[y & 3][x & 3] / 16)
          );
          if (lvl > 0) style = VIG_STYLES[lvl];
        }
        if (style !== runStyle) {
          // Lauf abschliessen (zusammenhaengende Pixel gleicher Stufe = EIN
          // fillRect; die Dither-Kanten brechen die Laeufe von selbst auf).
          if (runStyle) {
            vctx.fillStyle = runStyle;
            vctx.fillRect(runStart, y, x - runStart, 1);
          }
          runStyle = style;
          runStart = x;
        }
      }
    }
  }
  ctx.drawImage(vignetteCanvas, 0, 0);
}


function centerText(ctx, text, y, color, font) {
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = color;
  ctx.fillText(text, VIEW_W / 2, y);
}

// SLICE 4 §3.3: optionales viertes Argument `menu`. OHNE menu (= ohne
// gueltigen Spielstand, und damit in allen drei Flusstests) ist diese
// Funktion BYTE-GLEICH zum Bestand — dieselben fillText-Zuege, dieselbe
// Blinkzeile. menu = { cursor, items, zones }; die Geometrie kommt aus
// items/save.js (EIN Besitzer, keine zweite Koordinatenquelle).
// Der Auswahlbalken ist ein fillRect in '#3a3542' bei globalAlpha 1 und
// 128x18 px — er kann den Fade-Detektor der Flusstests (Vollbild 320x180,
// '#000', 0 < alpha < 1) nicht ausloesen.
export function drawTitle(ctx, timeSec, menu) {
  ctx.fillStyle = '#0a0810';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  centerText(ctx, 'GRIMLIGHT', 57, '#14101a', 'bold 32px monospace'); // Schatten
  centerText(ctx, 'GRIMLIGHT', 54, '#ae2f2a', 'bold 32px monospace');
  centerText(ctx, 'Ein Friedhof. Eine Krypta. Ein Schatz.', 96, '#7d7588', '8px monospace');
  if (menu) {
    for (let i = 0; i < menu.items.length; i++) {
      const z = menu.zones[i];
      const gewaehlt = menu.cursor === i;
      if (gewaehlt) {
        ctx.fillStyle = '#3a3542';
        ctx.fillRect(z.x, z.y, z.w, z.h);
      }
      centerText(ctx, menu.items[i], z.y + 5, gewaehlt ? '#f0bf4e' : '#7d7588', '8px monospace');
    }
  } else if (Math.floor(timeSec * 2) % 2 === 0) {
    centerText(ctx, 'ENTER / LEERTASTE / TIPPEN', 130, '#d6cbb1', '8px monospace');
  }
  drawVignette(ctx);
}

// ===========================================================================
// SLICE 4 §4.1 — PAUSE-OVERLAY (HUD-Sprache: Panel-Toene #14101a/#575061/
// #3a3542, Gold #f0bf4e, Creme #d6cbb1).
//
// DETEKTOR-PFLICHT (Review P1-m10): der Hintergrund ist KEIN 320x180-fillRect
// in '#000' mit 0 < globalAlpha < 1 — das IST der Fade-Detektor der
// Flusstests. Die Deckung steckt wie bei drawGameOver in der rgba-FUELLFARBE,
// globalAlpha bleibt 1.
// TEXTE meiden die Sonden-Praefixe der Flusstests ('GOLD', 'SIEG',
// 'GAME OVER', 'GRIMLIGHT', 'STUFE', 'AUSRUESTUNG', 'x 0').
//
// PAUSE_MENU_ZONES ist die EINE Geometriequelle: hud.js zeichnet daraus,
// main.js macht daraus den Tap-Hittest.
//
// SLICE 5 §6.1 — FUENF ZONEN OHNE PANELWACHSTUM (Review P1-m5, GEMESSEN).
// Bindend ist nicht "Unterkante <= 172", sondern h >= 16 px: smoke_test.mjs
// :4047 MM_PRO_PX = 0,3764 und :4567 h * MM_PRO_PX >= 6 ergeben h >= 15,94.
// Fuenf Zonen a 16 px passen LUECKENLOS in den Bestand:
//   y 66 / 82 / 98 / 114 / 130, Unterkante 146 < Panel-Unterkante 150
//   (fillRect(80,40,160,110) unten). Damit bleibt das drawFps-Fenster
//   (y 158-175, smoke:4618-4619) frei — mit dem alten 18er-Raster + 4 px
//   Luecke braeuchte man 106 px und landete bei 172, mitten im FPS-Overlay.
// REIHENFOLGE EINGEFROREN: WEITER 0 / GOTT 1 / FPS 2 — MUSIK 3 und TON 4
// werden ANGEHAENGT (check_save_slice4 faehrt die Pause, main.js:993/1004
// iterieren/klemmen ueber length, es verschiebt sich nichts, Review P1-m7).
// Alle Zonen tragen dieselbe w/h — der Auswahlbalken-Test (smoke:4590-4601)
// misst w/h aus Zone 0.
// ===========================================================================
export const PAUSE_MENU_ZONES = [
  { x: 96, y: 66, w: 128, h: 16 },
  { x: 96, y: 82, w: 128, h: 16 },
  { x: 96, y: 98, w: 128, h: 16 },
  { x: 96, y: 114, w: 128, h: 16 },
  { x: 96, y: 130, w: 128, h: 16 },
];

// 1-px-Rahmen AUSSCHLIESSLICH aus fillRect. Bewusst KEIN strokeRect: die
// Stubs von check_main_slice1 und check_boss_slice3 kennen nur fillRect,
// clearRect, drawImage, fillText, beginPath/arc/fill/stroke, save/restore —
// ein strokeRect im Pause-Pfad waere ein TypeError, sobald ein Test je
// pausiert (in der Probe .tmp/probe_s4_engine.mjs gemessen). fillRect ist im
// Projekt ohnehin die etablierte sichere Grundoperation (Boss-Balken, HUD).
function rahmen(ctx, x, y, w, h, farbe) {
  ctx.fillStyle = farbe;
  ctx.fillRect(x, y, w, 1);
  ctx.fillRect(x, y + h - 1, w, 1);
  ctx.fillRect(x, y + 1, 1, h - 2);
  ctx.fillRect(x + w - 1, y + 1, 1, h - 2);
}

export function drawPause(ctx, menu) {
  ctx.fillStyle = 'rgba(6,5,12,0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // Panel mit Doppelrahmen wie das Inventar
  ctx.fillStyle = '#14101a';
  ctx.fillRect(80, 40, 160, 110);
  rahmen(ctx, 80, 40, 160, 110, '#575061');
  rahmen(ctx, 82, 42, 156, 106, '#3a3542');
  centerText(ctx, 'PAUSE', 50, '#f0bf4e', 'bold 16px monospace');
  // §6.1: MUSIK/TON ANGEHAENGT. Die Texte meiden weiter jede Flusstest-Sonde
  // ('GOLD','SIEG','GAME OVER','GRIMLIGHT','STUFE','AUSRUESTUNG','x 0').
  const zeilen = [
    'WEITER',
    `GOTT: ${menu.god ? 'AN' : 'AUS'}`,
    `FPS: ${menu.fps ? 'AN' : 'AUS'}`,
    `MUSIK: ${menu.musik ? 'AN' : 'AUS'}`,
    `TON: ${menu.ton ? 'AN' : 'AUS'}`,
  ];
  for (let i = 0; i < zeilen.length; i++) {
    const z = PAUSE_MENU_ZONES[i];
    const gewaehlt = menu.cursor === i;
    if (gewaehlt) {
      ctx.fillStyle = '#3a3542';
      ctx.fillRect(z.x, z.y, z.w, z.h);
    }
    centerText(ctx, zeilen[i], z.y + 4, gewaehlt ? '#f0bf4e' : '#d6cbb1', '8px monospace');
  }
  ctx.textAlign = 'left';
}

// SLICE 4 §6.4 — FPS-OVERLAY. GENAU ZWEI fillText-Zeilen (plus je ein
// 1-px-Konturzug wie beim GOLD-Text), unten links, nur wenn im Pause-Menue
// eingeschaltet. Werte kommen fertig gerechnet aus main.js (120-Frame-
// Fenster) — das HUD misst nichts und kennt keine Uhr.
export function drawFps(ctx, w) {
  const z1 = `FPS ${w.fps}`;
  const z2 = `MS ${w.ms.toFixed(1)} SPITZE ${w.max.toFixed(1)}`;
  ctx.save();
  ctx.font = '8px monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#14101a';
  ctx.fillText(z1, 7, 159);
  ctx.fillText(z2, 7, 169);
  ctx.fillStyle = '#8fb85c';
  ctx.fillText(z1, 6, 158);
  ctx.fillText(z2, 6, 168);
  ctx.restore();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
}

export function drawGameOver(ctx, player, timeSec) {
  ctx.fillStyle = 'rgba(10,4,6,0.78)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  centerText(ctx, 'GAME OVER', 60, '#ae2f2a', 'bold 24px monospace');
  centerText(ctx, `GOLD: ${player.gold}`, 94, '#f0bf4e', '8px monospace');
  // §2.6.3: Gold-Zoll-Zeile (deathToll wird beim Eintritt in gameover gesetzt).
  if (player.deathToll) {
    centerText(ctx, `DER TOD FORDERT SEINEN ZOLL: -${player.deathToll} GOLD`, 108, '#ae2f2a', '8px monospace');
  }
  if (Math.floor(timeSec * 2) % 2 === 0) {
    centerText(ctx, 'WEITER MIT ENTER / TIPPEN', 126, '#d6cbb1', '8px monospace');
  }
}

export function drawVictory(ctx, player, timeSec) {
  ctx.fillStyle = 'rgba(6,8,4,0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  centerText(ctx, 'SIEG!', 56, '#f0bf4e', 'bold 24px monospace');
  // §3: der Sieg findet nicht mehr in den Katakomben statt, sondern hinter dem
  // Boss — Text und STUFE-Zeile angepasst.
  centerText(ctx, 'Der Grabwaechter ist bezwungen.', 84, '#d6cbb1', '8px monospace');
  centerText(ctx, `STUFE ${player.prog ? player.prog.level : 1}`, 98, '#f0bf4e', '8px monospace');
  centerText(ctx, `GOLD: ${player.gold}`, 110, '#f0bf4e', '8px monospace');
  if (Math.floor(timeSec * 2) % 2 === 0) {
    centerText(ctx, 'NOCHMAL MIT ENTER / TIPPEN', 130, '#d6cbb1', '8px monospace');
  }
}
