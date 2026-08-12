// Licht-System: Dunkelheits-Overlay mit ausgestanzten Lichtkegeln.
//
// Node-importierbar: kein window/document auf Modulebene. Das interne
// Offscreen-Canvas wird beim ERSTEN draw()-Aufruf genau einmal lazy aus
// ctx.canvas.ownerDocument erzeugt und danach gecacht (kein createElement
// pro Frame).
//
// Rundungskonvention wie alle Zeichner (Festlegung 6, Slice 0):
// screen = Math.round(weltX - camera.x) — sonst jittern die Lichtkreise
// um 1 px gegen die Tiles.
//
// ===========================================================================
// GRAFIKPASS 6 PAKET L (§2) — LICHT-QUANTISIERUNG. Loest die arc-basierten
// PUNCH_RINGS (GP4 R2: 6 konzentrische Boegen) durch eine gerasterte
// SCANLINE-STANZUNG ab. Warum:
//
// (1) §2.1 RELATIVE Quantisierung. Der Kegel traegt jetzt 13 Stufen
//     UNABHAENGIG vom Karten-Ambient: quantizeLight(rest) = round(rest*12)/12
//     laeuft auf der REST-Deckung rest ∈ [0,1] (Produkt der Licht-Profile,
//     OHNE ambient), die Overlay-Deckung ist a = ambient * quantizeLight(rest),
//     das Stanz-Alpha X = 1 - quantizeLight(rest) (nie negativ). Daraus folgen
//     zwei Eigenschaften, die die alten Ringe nicht hatten: das FERNFELD liegt
//     exakt auf a == ambient (rest = 1), und der Gradient traegt auf jeder
//     Karte dieselbe Stufenzahl.
// (2) §2.2 GEOMETRIE (Phase-0-Messentscheid, design/GP6_PHASE0.md P0a):
//     Scanline-Segmente je 4-px-Zeile, x auf 2-px-Bloecke gerastert, HARTE
//     Bandgrenzen OHNE Bayer. Der in Rev 1/2 vorgesehene +-1-Block-Bayer-Saum
//     wurde VERWORFEN: bei 2,25 Bloecken Bandbreite deckt er 60 % des
//     Fensters ab (= faktisch Voll-Bayer) und kostet Faktor 3. Die
//     Bayer-Rastersprache tragen weiterhin Vignette und Lit-Dither.
// (3) §2.2 REST-PROFIL: rest(u) = clamp((u - 0,25) / 0,75, 0, 1) mit u = d/r.
//     Das ist die stetige Interpolation der GP4-Treppe (deren kumulative
//     Restwerte 1 / 0,82 / 0,64 / 0,461 / 0,299 / 0,15 / 0 bei
//     u = 1,00 / 0,85 / 0,70 / 0,55 / 0,40 / 0,25 auf t = (u-0,25)/0,75
//     normiert praktisch exakt linear liegen) — der Look des Bestands bleibt,
//     nur die Stufung wird feiner und gleichmaessig.
// (4) §2.2 Der Flicker-Radius rastet auf ganze 2-px-Schritte (sonst wandern
//     die Bandgrenzen subpixelweise und die harten Kanten kribbeln); der
//     deterministische rWob-Jitter der alten Ringe (Sinus aus der
//     Weltposition, KEIN Math.random) lebt weiter — er sitzt jetzt in der
//     LOOKUP-DISTANZ, damit die konzentrischen Kanten mehrerer Fackeln nicht
//     auf identische Radien einrasten ('Kornkreise', GP4-Lehre).
// (5) §2.2 KEIN Frame-Cache: jeder Frame rechnet neu. §2.4 Lauf-Deckel
//     <= 2000/Frame am Worst-View (CATACOMBS Kamera (112,80), 21 Lichter);
//     gemessen 1605 bei 1,00x der Bestands-Zeit.
// (6) §2.3 EIMER-BUENDELUNG: die Laufmenge ist eine paarweise DISJUNKTE
//     Partition, also ist die Zeichenreihenfolge frei. Gezeichnet wird nach
//     Stufe k gebuendelt mit 13 VORBERECHNETEN rgba-Strings — 13
//     fillStyle-Zuweisungen je Frame statt einer je Lauf (gemessen -24..29 %).
//
// DETEKTOR-SICHERHEIT (§0.2): der Ambient-fillRect unten bleibt der ERSTE und
// EINZIGE fillRect mit 0 < globalAlpha < 1 auf einem Nicht-Main-Canvas. Die
// Stanz-fillRects fuehren ihre Deckung in rgba(0,0,0,X) bei globalAlpha === 1.
// ===========================================================================
// ---------------------------------------------------------------------------
// Grafikpass 5 RUNDE 2 — BAENDERUNG DER WARMEN GLOWS (Juror H mass 30
// Einzelschritte in den Fackel-Bodenpfuetzen: "der letzte Airbrush im Bild").
//
// BEFUND: der stufenlose Verlauf entsteht NICHT im Kegel-Punch (der laeuft seit
// GP4 R2 ueber 6 diskrete Ringe auf dem Offscreen), sondern in den DREI
// createRadialGradient-Fuellungen des additiven Warm-Pass auf dem HAUPT-ctx:
// Warm-Glow, Boden-Glow, Flammen-Hotspot. Ein Canvas-Radialgradient
// interpoliert per Pixel — auf 320x180 sind das die gemessenen ~30 Stufen.
//
// FIX: jeder der drei Glows wird als 4-6 KONZENTRISCHE Ringe mit FESTEN Alphas
// gezeichnet (aussen nach innen, additiv 'lighter' — die Deckungen summieren
// sich zum bisherigen Spitzenwert). Das Intensitaets-PROFIL bleibt damit
// erhalten, nur die Zwischenwerte rasten auf wenige Stufen ein.
// DETEKTOR-SICHERHEIT: alles laeuft wie bisher ueber arc/fill auf dem HAUPT-ctx
// mit rgba-fillStyle bei globalAlpha = 1 — der ambientAlpha-Detektor der
// Boss-Flusstests sucht TEILALPHA-fillRects auf NICHT-Main-Canvas (lighting.js
// Zeile ~66 bleibt der einzige) und wird nicht beruehrt. Die Flusstest-Stubs
// brauchen createRadialGradient/addColorStop jetzt gar nicht mehr.
// NICHT umgesetzt (deklariert): der optionale Bayer-Rand per drawImage-Sprite —
// dafuer braeuchte es eine Dither-Kachel in art/sprites.js (Art-Besitz).
//
// Format je Eintrag: { rf: Radius-Faktor, a: additive Deckung DIESES Rings,
// c: 'r,g,b' }. Kumulierte Deckung = Summe aller Ringe ab dem aeussersten.
const GLOW_RINGS = [        // Warm-Glow (Radius r*0.48), Spitze ~0.13 wie GP4
  { rf: 1.00, a: 0.010, c: '150,82,70' },   // aussen: entsaettigt rosabraun
  { rf: 0.82, a: 0.010, c: '150,82,70' },
  { rf: 0.66, a: 0.012, c: '198,96,54' },   // Uebergang
  { rf: 0.50, a: 0.016, c: '216,114,42' },  // Kern: warmorange
  { rf: 0.34, a: 0.030, c: '216,114,42' },
  { rf: 0.18, a: 0.052, c: '216,114,42' },
];
const FLOOR_RINGS = [       // Boden-Glow (Radius 8 px), Spitze 0.15 * pulse
  { rf: 1.00, a: 0.03, c: '158,88,72' },
  { rf: 0.72, a: 0.04, c: '178,104,74' },
  { rf: 0.46, a: 0.04, c: '216,150,70' },
  { rf: 0.22, a: 0.04, c: '216,150,70' },
];
// ---------------------------------------------------------------------------
// GRAFIKPASS 5 RUNDE 3 — HOTSPOT-WEISS (Jury: "12 px reines 255,255,255 im
// Flammenkern durch additives Saettigen").
//
// RECHNUNG (der Grund, warum der Kern ausbrannte): die drei Hotspot-Ringe sind
// KONZENTRISCH — im Zentrum summieren sich ihre Deckungen. Bisher lag die
// Summe bei 0,15 + 0,17 + 0,18 = 0,50 auf dem Ton (255,240,200), also ein
// additiver Zuschlag von (+128, +120, +100). Darunter liegt der hellste
// Flammen-Pixel der Fackel-Sprites, Palettenton '1' = #ffe9b0 =
// (255, 233, 176), und der Kegel-Punch hat an der Fackel die volle Dunkelheit
// entfernt. Ergebnis pro Kanal: R 255+128, G 233+120, B 176+100 — ALLE DREI
// klemmen bei 255. Genau das ist der weisse 12-px-Fleck.
//
// FIX (konservativ, ohne Render-Nachmessung — die Zahlen sind die Rechnung):
//   (1) SPITZEN-ALPHA GESENKT: Summe 0,50 -> 0,18 (-64 %).
//   (2) FARBE WAERMER: (255,238,190)/(255,236,180)/(255,234,170) statt des
//       fast neutralen (255,240,200) — der Blau-Anteil steigt am langsamsten.
// Neue Kernrechnung bei pulse = 1 (Summe der drei Ringe im Zentrum):
//   R += 0,06*255*3            = 45,9   -> 255 + 45,9      -> klemmt (255)
//   G += 0,06*(238+236+234)    = 42,5   -> 233 + 42,5      -> klemmt (255)
//   B += 0,06*(190+180+170)    = 32,4   -> 176 + 32,4      = 208,4
//   dazu der Warm-Glow (B +6,2) und der Bodenglow-Aussenring (B +2,2)
//   -> B ~ 217 im Kern.
// DAMIT: R - B ~ 255 - 217 = +38 > 0. Der Kern liest als warmes Creme
// (~255,255,217 — die geforderte Anmutung 255,252,232), nie mehr als reines
// Weiss; die Sattigung von G ist bei einem Flammen-KERN erwuenscht und
// unvermeidbar (der Untergrund steht dort schon bei G = 233, jede sichtbare
// additive Spitze klemmt ihn — nur B haelt den Farbstich, und den haelt er).
const HOT_RINGS = [         // Flammen-Hotspot (Radius 2.25 px), Spitze 0.18 * pulse
  { rf: 1.00, a: 0.06, c: '255,238,190' },
  { rf: 0.66, a: 0.06, c: '255,236,180' },
  { rf: 0.33, a: 0.06, c: '255,234,170' },
];

// ===========================================================================
// §2.5 WARM-PASS: der Puls der Boden-/Hotspot-Glows rastet auf FUENF feste
// Werte ein. Bisher lief pulse = 0.75 + 0.25*wob stetig durch [0.5 .. 1.0] und
// war damit die letzte stufenlose Groesse im Fackelbild. Die fuenf Werte sind
// genau das 0,125er-Raster dieses Intervalls.
const PULSE_STEPS = [0.5, 0.625, 0.75, 0.875, 1.0];

function quantizePulse(p) {
  let i = Math.round((p - 0.5) / 0.125);
  if (i < 0) i = 0; else if (i > 4) i = 4;
  return PULSE_STEPS[i];
}

// ===========================================================================
// §2.1 RELATIVE QUANTISIERUNG — die eine Wahrheit fuer Boden UND Sprites.
// quantizeLight wird GENAU EINMAL auf das fertige PRODUKT aller Licht-Profile
// angewandt (nie je Licht), sonst summieren sich 21 Rundungsfehler.
// ===========================================================================
export const LIGHT_STEPS = 12;

export function quantizeLight(rest) {
  return Math.round(rest * LIGHT_STEPS) / LIGHT_STEPS;
}

// 13 vorberechnete Stanz-Deckungen X = 1 - k/12 (§2.3 Eimer-Buendelung).
// rgba-Strings bei globalAlpha === 1 — NIE globalAlpha (§0.2 Detektor).
const STANZ_RGBA = [];
for (let k = 0; k <= LIGHT_STEPS; k++) {
  STANZ_RGBA.push(`rgba(0,0,0,${(1 - k / LIGHT_STEPS).toFixed(4)})`);
}

// §2.2 Rest-Profil (Phase-0-Entscheid, siehe Kopf-Kommentar (3)).
// u = d/r; 0 im Kernbereich (voll gestanzt), 1 ab dem Radius (Fernfeld).
function restProfile(u) {
  const t = (u - 0.25) / 0.75;
  return t <= 0 ? 0 : (t >= 1 ? 1 : t);
}

// §2.2 Lauf-Geometrie. RUN_H = 4 px Zeilenhoehe, x-Raster 2 px.
const RUN_H = 4;
// Nachschlagetabelle ueber u^2 in [0,1] — spart die Wurzel im heissen Kern.
const LUT_N = 256;

// Der rWob-Jitter des Bestands (lighting.js GP4: sin(seed + k*2.399) * 0.02 je
// Ring k) wandert nach §2.2 in die LOOKUP-DISTANZ: die Bandgrenze der Stufe k
// liegt bei r*(1+rWob_k) statt bei r. Umgesetzt als LUT je Licht und Frame
// (257 Eintraege), danach nur noch Array-Lesezugriffe. Kein Math.random.
function buildLut(seed) {
  const lut = new Float32Array(LUT_N + 1);
  for (let i = 0; i <= LUT_N; i++) {
    const u0 = Math.sqrt(i / LUT_N);
    // Stufe aus dem UNGEJITTERTEN Profil bestimmen (nur zur Jitter-Auswahl)
    const k0 = Math.round(restProfile(u0) * LIGHT_STEPS);
    const rw = Math.sin(seed + k0 * 2.399) * 0.02;
    lut[i] = restProfile(u0 / (1 + rw));
  }
  return lut;
}

/**
 * §2.2 lightRuns — PURE Funktion, keine Seiteneffekte, KEIN Cache.
 *
 * Liefert eine paarweise DISJUNKTE Partition der Vereinigung aller
 * Licht-Bounding-Boxen als Scanline-Segmente `{x, y, w, h: 4, k}` je
 * 4-px-Zeile (x/w auf 2-px-Bloecke gerastert, harte Bandgrenzen).
 * k ∈ 0..12 ist die Lichtstufe; die Stanz-Deckung ist X = 1 - k/12.
 *
 * k = 12 bedeutet X = 0 (No-Op-Stanz) und wird UNTERDRUECKT (§2.2) — das
 * spart je Frame gut hundert wirkungslose fillRects. Die vollstaendige
 * Partition (fuer Disjunktheits-/Deckungsbeweise) liefert opt.emitK12.
 *
 * @param {Array}  lights   [{x, y, radius, flicker}] in WELTpixeln
 * @param {Object} camera   {x, y}
 * @param {number} ambient  BEWUSST UNBENUTZT: die Quantisierung ist relativ
 *                          (§2.1), die Laufmenge haengt nicht vom Ambient ab
 *                          (P0a-Zusatzbefund — die §3.2-Absenkung ist
 *                          kostenneutral). Der Parameter steht in der von §2.2
 *                          festgelegten Signatur und bleibt darin.
 * @param {number} timeSec  Sekunden (Flicker)
 * @param {number} viewW, viewH  Sichtfenster in px
 * @param {Object} [opt]    { emitK12: true } nur fuer Selbstpruefungen
 * @returns {Array} runs
 */
export function lightRuns(lights, camera, ambient, timeSec, viewW, viewH, opt) {
  const emitK12 = !!(opt && opt.emitK12);
  const BW = viewW >> 1;                       // Bloecke in x (je 2 px)
  const BH = Math.ceil(viewH / RUN_H);         // Zeilen in y (je RUN_H px)
  const runs = [];

  // ---- 1. Lichter aufbereiten: 2-px-Radiusrundung, Culling, LUT ----------
  const L = [];
  for (let i = 0; i < lights.length; i++) {
    const l = lights[i];
    // Deterministisches Flackern wie im Bestand (KEIN Math.random):
    // zwei entkoppelte Sinus-Wellen, Phase aus der Weltposition.
    const flicker = l.flicker || 0;
    const wob =
      Math.sin(timeSec * 13 + l.x * 7) * 0.6 +
      Math.sin(timeSec * 8.3 + l.y * 5 + l.x * 3) * 0.4;
    // §2.2: Flicker-Radius auf ganze 2-px-Schritte gerundet.
    const r = Math.round(l.radius * (1 + flicker * 0.1 * wob) / 2) * 2;
    if (r <= 0) continue;
    const cx = Math.round(l.x - camera.x);
    const cy = Math.round(l.y - camera.y);
    // Viewport-Culling wie im Bestand (Katakomben haben viele Fackeln).
    if (cx + r < 0 || cx - r > viewW || cy + r < 0 || cy - r > viewH) continue;
    L.push({
      cx, cy, inv: 1 / (r * r), lut: buildLut(l.x * 0.7 + l.y * 1.3),
      x0: Math.max(0, (cx - r) >> 1), x1: Math.min(BW - 1, (cx + r) >> 1),
      y0: Math.max(0, Math.floor((cy - r) / RUN_H)),
      y1: Math.min(BH - 1, Math.floor((cy + r) / RUN_H)),
    });
  }
  if (!L.length) return runs;

  // ---- 2. Vereinigungs-Fenster der Bounding-Boxen (Block-Raster) ---------
  let bx0 = BW, bx1 = -1, by0 = BH, by1 = -1;
  for (const b of L) {
    if (b.x0 < bx0) bx0 = b.x0;
    if (b.x1 > bx1) bx1 = b.x1;
    if (b.y0 < by0) by0 = b.y0;
    if (b.y1 > by1) by1 = b.y1;
  }
  const rowW = bx1 - bx0 + 1;
  if (rowW <= 0 || by1 < by0) return runs;

  // ---- 3. Zeilenweise: rest = Produkt der Profile, dann Laeufe schneiden --
  const v = new Float32Array(rowW);
  for (let by = by0; by <= by1; by++) {
    const py = by * RUN_H + RUN_H / 2;         // Abtastzeile in der Laufmitte
    v.fill(1);                                  // ausserhalb aller Kegel: rest = 1
    for (let li = 0; li < L.length; li++) {
      const b = L[li];
      if (by < b.y0 || by > b.y1) continue;
      const dy = py - b.cy, dy2 = dy * dy;
      const lut = b.lut, inv = b.inv, cx = b.cx;
      for (let bx = b.x0; bx <= b.x1; bx++) {
        const dx = bx * 2 + 1 - cx;             // Blockmitte
        const q = (dx * dx + dy2) * inv;        // (d/r)^2
        if (q >= 1) continue;
        v[bx - bx0] *= lut[(q * LUT_N) | 0];    // §2.1: PRODUKT der Rest-Profile
      }
    }
    let runK = -1, runStart = 0;
    for (let i = 0; i <= rowW; i++) {
      let k = -1;
      if (i < rowW) {
        // = LIGHT_STEPS * quantizeLight(rest): §2.1 GENAU EINMAL auf das
        // fertige Produkt, nie je Licht.
        k = Math.round(v[i] * LIGHT_STEPS);
        if (k < 0) k = 0; else if (k > LIGHT_STEPS) k = LIGHT_STEPS;
      }
      if (k !== runK) {
        if (runK >= 0 && (emitK12 || runK !== LIGHT_STEPS)) {
          runs.push({
            x: (bx0 + runStart) * 2,
            y: by * RUN_H,
            w: (i - runStart) * 2,
            h: RUN_H,
            k: runK,
          });
        }
        runK = k;
        runStart = i;
      }
    }
  }
  return runs;
}

// ===========================================================================
// §4.1 lightAt — PURE Punktabfrage fuer die Sprite-Beleuchtung (Paket S).
//
// Dieselbe Lookup und dieselbe quantizeLight wie §2 (sonst driften Boden- und
// Figurenbeleuchtung auseinander), aber mit zwei bewussten Unterschieden:
//   (a) UNGEJITTERTER Radius — ohne Flacker-wob und ohne rWob. Der Abtastpunkt
//       einer stehenden Figur laege sonst 4x je Sekunde in einer anderen
//       Stufe (Stroboskop, Review P2-M-5).
//   (b) 1-STUFEN-HYSTERESE: die Stufe wechselt erst, wenn der Rohwert die
//       Rundungsgrenze um >= 0,5 Stufenbreiten ueberschreitet (also |roh -
//       vorige Stufe| > 1). Die Funktion bleibt PURE — den Zustand haelt der
//       AUFRUFER und reicht ihn als `prev` wieder herein.
//
// Rueckgabe: { f, warm, a }
//   f     0..1 BELEUCHTUNGSFAKTOR auf dem 12er-Raster; 0 = Fernfeld (volle
//         Ambient-Dunkelheit), 1 = Kegelkern. f ist exakt das Stanz-Alpha
//         X = 1 - quantizeLight(rest) aus §2.1 — dieselbe Zahl, die der
//         Boden an diesem Punkt aus dem Overlay entfernt.
//   warm  0..1 WAERME auf demselben Raster, aus der Ringlogik des Warm-Passes
//         (GLOW_RINGS, Radius r*0.48, nur Fackeln mit flicker >= 0.8, additiv
//         ueberlagert wie 'lighter'). Damit kann das Sprite-Tinting die
//         Fackelfarbe einmischen statt nur zu dimmen.
//   a     ambient * (1 - f) — die Overlay-Deckung, die §2 an diesem Punkt
//         stanzen wuerde (M5 braucht 'Messort im Fackelkegel, a <= 0,15').
//
// @param {Object} [prev]  das VORHERIGE Rueckgabeobjekt desselben Abtastpunkts
//                         ({f, warm}); die Stufen werden daraus exakt per
//                         round(f*12) rekonstruiert, weil f/warm immer auf dem
//                         12er-Raster liegen. Fehlt prev, wird ohne Hysterese
//                         gerundet.
// @param {number} timeSec BEWUSST UNBENUTZT (siehe (a)); steht in der von §4.1
//                         festgelegten Signatur.
// ===========================================================================
const GLOW_TOTAL = 0.010 + 0.010 + 0.012 + 0.016 + 0.030 + 0.052; // Summe GLOW_RINGS

function glowProfile(u) {
  if (u >= 1) return 0;
  let acc = 0;
  for (let i = 0; i < GLOW_RINGS.length; i++) {
    if (u <= GLOW_RINGS[i].rf) acc += GLOW_RINGS[i].a;
  }
  return acc / GLOW_TOTAL;
}

// 1-Stufen-Hysterese auf dem 0..LIGHT_STEPS-Raster (siehe (b) oben).
function hystereseStufe(rohStufe, vorStufe) {
  let s;
  if (vorStufe !== null && Math.abs(rohStufe - vorStufe) <= 1) s = vorStufe;
  else s = Math.round(rohStufe);
  if (s < 0) s = 0; else if (s > LIGHT_STEPS) s = LIGHT_STEPS;
  return s;
}

export function lightAt(lights, wx, wy, ambient, timeSec, prev) {
  let rest = 1;
  let warmRoh = 0;
  for (let i = 0; i < lights.length; i++) {
    const l = lights[i];
    // (a) UNGEJITTERT: derselbe Ausdruck wie §2.2 mit wob = 0.
    const r = Math.round(l.radius / 2) * 2;
    if (r <= 0) continue;
    const dx = wx - l.x, dy = wy - l.y;
    const d2 = dx * dx + dy * dy;
    if (d2 < r * r) {
      const d = Math.sqrt(d2);
      rest *= restProfile(d / r);               // §2.1: PRODUKT, eine Quantisierung
      if ((l.flicker || 0) >= 0.8) {            // Warm-Pass nur fuer Fackeln
        const gr = r * 0.48;                    // Glow-Radius wie im Warm-Pass
        if (d < gr) warmRoh += glowProfile(d / gr);
      }
    }
  }
  if (warmRoh > 1) warmRoh = 1;
  const vorF = prev && typeof prev.f === 'number' ? Math.round(prev.f * LIGHT_STEPS) : null;
  const vorW = prev && typeof prev.warm === 'number' ? Math.round(prev.warm * LIGHT_STEPS) : null;
  // f = 1 - quantizeLight(rest) = Stanz-Alpha X (§2.1), hier ueber die Stufe.
  const fS = hystereseStufe((1 - rest) * LIGHT_STEPS, vorF);
  const wS = hystereseStufe(warmRoh * LIGHT_STEPS, vorW);
  const f = fS / LIGHT_STEPS;
  return { f, warm: wS / LIGHT_STEPS, a: ambient * (1 - f) };
}

export function createLighting(viewW, viewH) {
  let off = null;  // Offscreen-Canvas, lazy + gecacht
  let octx = null;

  function ensureOffscreen(ctx) {
    if (off) return;
    off = ctx.canvas.ownerDocument.createElement('canvas');
    off.width = viewW;
    off.height = viewH;
    octx = off.getContext('2d');
  }

  // lights: [{x, y, radius, flicker}] in WELTpixeln; flicker 0..1 (0 = statisch)
  //   optionales Feld `wall: true` — WANDfackel (§2.6, Vertrag unten am
  //   HOT_RINGS-Block).
  // ambient: 0..1 Dunkelheitsgrad der Map (0 = Tag → kein Overlay, 1 = schwarz)
  // tint (Grafikpass 3 §2.3, optional): Füllfarbe des Dunkel-Overlays statt fix
  // '#050510' — main.js reicht mapDef.ambientTint durch (Farbtemperatur je Map).
  // Fehlt tint, bleibt der bisherige leicht-blaue Default.
  function draw(ctx, camera, lights, ambient, timeSec, tint) {
    if (!(ambient > 0)) return;
    ensureOffscreen(ctx);

    // WICHTIG: erst clearen, dann füllen. Ohne clearRect würde der
    // halbtransparente fillRect über die Frames auf dem persistenten
    // Offscreen gegen Alpha 1 akkumulieren (nach Sekunden alles schwarz).
    octx.globalCompositeOperation = 'source-over';
    octx.clearRect(0, 0, viewW, viewH);
    octx.globalAlpha = ambient;
    octx.fillStyle = tint || '#050510'; // Farbtemperatur der Map (§2.3), Default fast schwarz/blau
    octx.fillRect(0, 0, viewW, viewH);

    // GP6 §2.3: die Lichtkegel werden als Scanline-LAEUFE gestanzt, nicht mehr
    // als Boegen. globalAlpha steht ab hier auf 1 — die Deckung steckt
    // ausschliesslich im rgba-String (§0.2 Detektor, siehe Kopf-Kommentar).
    octx.globalAlpha = 1;
    octx.globalCompositeOperation = 'destination-out';
    const runs = lightRuns(lights, camera, ambient, timeSec, viewW, viewH);
    // EIMER-BUENDELUNG (§2.3): nach Stufe k gruppiert zeichnen. Erlaubt, weil
    // die Partition disjunkt ist (Reihenfolge frei) — 13 fillStyle-Zuweisungen
    // je Frame statt einer je Lauf.
    const eimer = new Array(LIGHT_STEPS + 1).fill(null);
    for (let i = 0; i < runs.length; i++) {
      const run = runs[i];
      if (eimer[run.k] === null) eimer[run.k] = [run];
      else eimer[run.k].push(run);
    }
    for (let k = 0; k <= LIGHT_STEPS; k++) {
      const b = eimer[k];
      if (b === null) continue;
      octx.fillStyle = STANZ_RGBA[k];
      for (let i = 0; i < b.length; i++) {
        const run = b[i];
        octx.fillRect(run.x, run.y, run.w, run.h);
      }
    }
    // §0.3 Composite-Hygiene: nach dem destination-out-Block explizit zurueck.
    octx.globalAlpha = 1;
    octx.globalCompositeOperation = 'source-over';

    ctx.drawImage(off, 0, 0);

    // Grafikpass 2 §8a.1: additiver Warm-Glow-Pass, AUSSCHLIESSLICH für stark
    // flackernde Lichter (flicker >= 0.8 = nur Fackeln; Spieler/Drops/Eliten
    // liegen bei 0.3). Radialer Gradient in Fackel-Orange (#d8722a), composite
    // 'lighter'. Rein additiv auf den Haupt-ctx — die Dunkelheits-Logik oben
    // (Offscreen-Stanzen) bleibt unangetastet. save/restore, damit weder
    // Composite-Modus noch fillStyle nach außen lecken.
    //
    // Grafikpass 3 §2.3 Schmier-Diagnose (Juror-Befund R3): Der weiche
    // "Schatten-Blob" in den Katakomben-Shots war NICHT der Vignette, sondern
    // DIESER Warm-Glow: Radius == voller Fackel-Radius (72 px → 144 px Durchmesser)
    // mit Mittel-Stop erst bei 0.5 ergab einen breiten, diffusen Orange-Teppich,
    // der auf dem near-black Boden als verwaschener Fleck las (mehrere Fackeln
    // ueberlagert = smeariger Blob). FIX: (1) Glow-Radius auf 0.6× kappen (gr),
    // (2) Gradient-Stops straffen (Abfall schon bei 0.4), (3) Alpha-Spitze 0.15→0.13.
    // Der harte, posterisierte Stanz-Lichtkegel oben bleibt unveraendert scharf.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const light of lights) {
      if ((light.flicker || 0) < 0.8) continue;
      const flicker = light.flicker || 0;
      const wob =
        Math.sin(timeSec * 13 + light.x * 7) * 0.6 +
        Math.sin(timeSec * 8.3 + light.y * 5 + light.x * 3) * 0.4;
      const r = light.radius * (1 + flicker * 0.1 * wob);
      if (
        light.x + r < camera.x || light.x - r > camera.x + viewW ||
        light.y + r < camera.y || light.y - r > camera.y + viewH
      ) continue;
      const cx = Math.round(light.x - camera.x);
      const cy = Math.round(light.y - camera.y);
      // §2.3: Glow-Radius kappen (kein breiter Teppich mehr). Grafikpass 4 R3
      // §(a): zusaetzlich um ~20 % gekuerzt (0.6 -> 0.48) — die warmen Pools
      // liefen ueber die Tile-Kanten aus (Juror H-K5). NUR der Radius, der
      // Farbverlauf (addColorStop) und der Kegel-Punch bleiben unangetastet.
      const gr = r * 0.48;
      // Grafikpass 4 R2 §(a) GLOW-FARBVERLAUF: 2-Stufen-FARB-Verlauf statt reiner
      // Alpha-Abnahme — Kern warmorange (#d8722a = 216,114,42), die aeusseren
      // ~30 % (ab Stop 0.7) Richtung entsaettigt rosabraun/orange-rot (150,82,70).
      // Das Intensitaets-Profil (0.13 -> 0.04 -> ~0 zum Rand) bleibt wie im R3-
      // Anti-Schmier-Fix, nur der Farbton wandert. Stub-sicher (addColorStop no-op).
      // Grafikpass 5 R2: 6 gestufte Ringe statt des Radialgradienten (siehe
      // Kommentarblock oben). Die Ringradien tragen denselben deterministischen
      // Sinus-Jitter wie die Punch-Ringe — sonst rasten die konzentrischen
      // Kanten mehrerer Fackeln aufeinander ein ("Kornkreise", GP4-Lehre).
      const glowSeed = light.x * 0.9 + light.y * 1.7;
      ctx.globalAlpha = 1;
      for (let k = 0; k < GLOW_RINGS.length; k++) {
        const ring = GLOW_RINGS[k];
        const rWob = k === GLOW_RINGS.length - 1 ? 0 : Math.sin(glowSeed + k * 2.399) * 0.03;
        ctx.fillStyle = `rgba(${ring.c},${ring.a})`;
        ctx.beginPath();
        ctx.arc(cx, cy, gr * (ring.rf + rWob), 0, Math.PI * 2);
        ctx.fill();
      }

      // Grafikpass 4 §2.3: (a) flacher Boden-Glow an der Fackelbasis (EIN kleiner
      // ~10 px Kreis leicht unter dem Fackelzentrum — die Draufsicht liest ihn
      // ausreichend oval, keine Zwei-Kreis-"Erdnuss"), Spitzen-Stop max 0.15->0,
      // pulsierend ueber den vorhandenen Doppel-Sinus (wob in ~[-1..1]).
      // GP6 §2.5: pulse rastet auf die fuenf festen Werte 0,5 / 0,625 / 0,75 /
      // 0,875 / 1,0 (0,75 + 0,25*wob lief bisher stetig durch [0,5 .. 1,0] und
      // war die letzte stufenlose Groesse im Fackelbild).
      const pulse = quantizePulse(0.75 + 0.25 * wob);
      const baseY = cy + 5;                          // Fackelbasis liegt unter der Flamme
      // Grafikpass 4 R3 §(a): Boden-Glow-Radius um ~20 % gekuerzt (10 -> 8 px) —
      // der Pool lief ueber die Tile-Kanten aus (Juror H-K5). NUR der Radius.
      const bgR = 8;
      // Grafikpass 4 R2 §(a) GLOW-FARBVERLAUF: auch der Boden-Glow bekommt den
      // 2-Stufen-Farb-Verlauf — Kern warm-amber, aeusserer Rand Richtung
      // entsaettigt rosabraun (158,88,72). Spitzen-Alpha wie bisher (0.15*pulse).
      // Grafikpass 5 R2: 4 gestufte Ringe statt des Radialgradienten. DAS hier
      // war die von Juror H vermessene Stelle (30 Einzelschritte in der
      // Bodenpfuetze); der Pool liest jetzt als 4 klare Lichtstufen.
      for (let k = 0; k < FLOOR_RINGS.length; k++) {
        const ring = FLOOR_RINGS[k];
        ctx.fillStyle = `rgba(${ring.c},${(ring.a * pulse).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(cx, baseY, bgR * ring.rf, 0, Math.PI * 2);
        ctx.fill();
      }

      // (b) 2-3 px warm-cremiger Flammenkern-Hotspot (Radial, Stops ~0.5->0),
      // pulsierend wie der Boden-Glow. Sitzt knapp ueber dem Zentrum (Flammenkern).
      // Grafikpass 4 R3 §(b): Hotspot-Radius leicht reduziert (~25 %: 3 -> 2.25 px),
      // damit der weiss-gelbe Kern straffer sitzt (begleitet die Funken-Straffung).
      // GRAFIKPASS 6 §2.6 — HOT_RINGS AN DEN DOCHT, KORREKT VERORTET.
      // Der Hotspot sass bei cy-3 zwischen den Stuehlen: die Bodenfackel hat
      // ihren Flammenkern ('1', §6.6) in den Grid-Zeilen 5..7, die WANDfackel
      // in 3..5 — deren Flamme endet eine Zeile hoeher, ein Hotspot auf
      // Bodenfackel-Hoehe laege bei ihr im Metallgehaeuse. NIE cy+2 (das waere
      // der Pfosten bzw. die Ziegelwand).
      //
      // VERTRAG (§8 Phase 2, main.js): die Licht-Objekte tragen keine Art-Info
      // — main.js entscheidet beim Fackel-Sammeln, ob eine Fackel an der WAND
      // haengt, und setzt dann `wall: true` am Licht. DEFAULT (Feld fehlt oder
      // ist falsy) = BODENfackel; damit bleibt jeder Bestands-Aufrufer, der das
      // Feld nicht kennt, auf dem Bodenfackel-Wert.
      const hotY = cy - (light.wall ? 4 : 2);
      const hsR = 2.25;
      // Grafikpass 5 R2: 3 gestufte Ringe statt des Radialgradienten.
      for (let k = 0; k < HOT_RINGS.length; k++) {
        const ring = HOT_RINGS[k];
        ctx.fillStyle = `rgba(${ring.c},${(ring.a * pulse).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(cx, hotY, hsR * ring.rf, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
    // §0.5 Composite-Hygiene PFLICHT: gco/globalAlpha explizit zuruecksetzen
    // (save/restore reicht nicht — der Boss-Flusstest-Stub restauriert gco NICHT;
    // ein Leak braeche im Browser Portal-Fade und HUD).
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  return { draw };
}
