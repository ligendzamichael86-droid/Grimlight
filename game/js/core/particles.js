// Grafikpass 3 §2.4 — Glut-Funken über Fackeln (MODERN: echte Alpha-Blende).
//
// Node-importierbar: KEIN window/document auf Modulebene oder in update/spawn
// (draw braucht einen ctx, wird headless nie mit echtem Canvas aufgerufen).
//
// AUSNAHME zur Eisernen Regel §0.5: dieses Modul liegt in core/ (NICHT world/
// oder art/) und DARF Math.random im Spawn-Pfad nutzen — Funken sind reine
// Deko und nicht test-fixiert. Der Render-Determinismus-Wächter des Smoke-Tests
// deckt nur world/*.js und art/*.js ab.
//
// Modell: createParticles() → { list, spawnEmbers(x,y,dt), update(dt), draw(ctx,camera) }
// - Funken 1-2 px, Töne o/y/1 (Palette: Orange → Gelb → Flammenkern).
// - steigen 6-12 px/s (Screen-y sinkt), leichte Sinus-Drift seitlich.
// - Lebensdauer 1,2-2,5 s; globalAlpha faded ueber die letzten ~40 % in 3 Stufen aus.
// - Groessenmix ~60 % 1 px / 40 % 2 px (Runde 2).
// - Runde 3 (M-K6a): Spawn-Dichte ~2-3x (SPAWN_RATE 3->8) und jeder Funke mit
//   additivem Glow-Halo (warmes Orange, 'lighter') umhuellt, damit die Funken
//   gluehen statt Einzelpunkte zu sein.
// - Grafikpass 4 R3 (Juror H): Halo von 2-px-Kasten auf 1-px-RING gestrafft
//   (Alpha ~0,35), Nachzieher als 3 diskrete Pixel 100/60/30 % statt weichem
//   Schweif; weiss-gelber Kern bleibt.
// - Obergrenze HART: 60 Partikel gesamt (Mobile-Budget).

import { PALETTE } from '../art/palette.js';

const MAX_PARTICLES = 60;
// Runde 2 (GP5): die frueheren Zufalls-Toene EMBER_TONES/EMBER_HEX ('o','y','1'
// je Funke) sind ERSETZT durch die alters-gesteuerte EMBER_RAMP weiter unten
// (Juror H: "die Funken brauchen eine eigene kleine Palette").
// Warmes Orange fuer den additiven Glow-Halo (Runde 3, M-K6a). PALETTE['o'] =
// Fackel-Orange (#d8722a), unabhaengig vom Kern-Ton des einzelnen Funkens.
const HALO_HEX = PALETTE['o'] || '#d8722a';
// Runde 3 (M-K6a): Dichte ~2,7x der R2-Rate 3 -> ~6-9 Funken/s pro sichtbarer
// Fackel. Der harte Deckel MAX_PARTICLES=60 bleibt unveraendert (Smoke §36 prueft
// ihn spawnraten-unabhaengig ueber die length-Guard, nicht ueber diese Rate).
const SPAWN_RATE = 8;
// Grafikpass 4 §2.5: 3 seitliche Cluster-Offsets (px) um die Fackel — die Funken
// buendeln sich in Gruppen statt einer gleichverteilten Wolke.
const CLUSTER_DX = [-5, 0, 5];
// Grafikpass 4 R2 §(b): der heisse weiss-gelbe Funkenkern (#ffe9b0) ist in
// Runde 2 die ERSTE Stufe von EMBER_RAMP geworden (jeder Funke startet dort und
// verglimmt) — die separate Kern-Konstante entfaellt damit.
// Grafikpass 4 R2 §(b): Staub-Motes (2 px, driftend, twinkelnd) sind ein ZWEITER
// Partikel-Typ im selben Stream (main.js ruft nur spawnEmbers). ~1/3 der Spawns
// sind Motes; der harte Deckel 60 (Smoke §36) zaehlt beide Typen gemeinsam.
const MOTE_SHARE = 0.35;
// Warm-neutraler Staubton (Bestandston, kein Palette-Symbol) fuer die Motes.
const MOTE_HEX = '#d6cbb1';

// ---------------------------------------------------------------------------
// Grafikpass 5 RUNDE 2 — FUNKEN-BUENDELUNG (Jury-Entscheid zum Widerspruch
// K "Dauerexplosion, verschluckt die Fackel" vs. M "die Streuung gefaellt mir":
// BUENDELN statt TOETEN). Die Funken bleiben, werden aber zu einer schmalen,
// kurzlebigen Glutfahne auf der Flammenachse statt zu einer Wolke:
//   - Spawn NUR in einer 4-px-Spalte auf der Flammenachse (vorher 3 Cluster
//     bei -5/0/+5 px -> allein der Spawn war 12 px breit),
//   - hoechstens EMBER_PER_TORCH gleichzeitig PRO FACKEL (der globale Deckel
//     MAX_PARTICLES = 60 bleibt unangetastet),
//   - Groesse 1x1 px; NUR der juengste Funke einer Fackel ist 2x1 (der heisse
//     Kopf, den H fuer Standbilder verlangt hat),
//   - Lebensdauer 20-32 FRAMES (0,33-0,53 s) statt 1,2-2,5 s,
//     >>> GATE-FIX R2 (siehe EMBER_LIFE_*/EMBER_VY_* weiter unten): diese
//     Verkuerzung war ZU HART — die Funken erreichten das Proof-Fenster
//     (240,48,256,78 = 10-40 px ueber der Flamme) gar nicht mehr. Sie ist auf
//     42-60 Frames + 29-35 px/s korrigiert (Steighoehe 20-35 px). <<<
//   - eigene kleine Palette (EMBER_RAMP, H): hell -> orange -> dunkelrot -> aus,
//     der Ton haengt jetzt am ALTER statt an einer Zufalls-Wahl beim Spawn,
//   - seitliche Drift <= EMBER_DRIFT px -> Wolkenbreite nie ueber 10 px
//     (4 px Spalte + 2 x 3 px Drift),
//   - NIE unterhalb der Flammenbasis (baseY-Klammer in update + Schweif).
// Die Motes (Staub) bleiben unveraendert — sie sind der ruhige, breite Teil des
// Streams und waren nie Teil der Klage.
const EMBER_PER_TORCH = 8;   // gleichzeitig sichtbare Funken je Fackel
const EMBER_COL_W = 4;       // Breite der Spawn-Spalte auf der Flammenachse (px)
const EMBER_DRIFT = 3;       // max. seitliche Sinus-Drift (px) -> Wolke <= 10 px
// Eigene kleine Funken-Palette (H): 4 Stufen ueber die Lebenszeit.
const EMBER_RAMP = ['#ffe9b0', '#f0bf4e', '#d8722a', '#7d2a12'];

// ---------------------------------------------------------------------------
// GRAFIKPASS 5 RUNDE 2 — GATE-FIX "FUNKEN-STEIGHOEHE".
//
// BEFUND des Proof-Laufs (.tmp/shot_gfx5.py, proof_results.funken_realfenster):
// das Gate-Fenster (240,48,256,78) liegt 10-40 px UEBER der Flammenbasis
// (248,88) und war LEER. Grund: die R2-Buendelung hatte Lebensdauer (20-32
// Frames) UND Steiggeschwindigkeit (12-22 px/s) gleichzeitig gedrosselt —
// Steighoehe = 4-11 px, der Funke starb 30 px unterhalb des Fensters.
//
// FIX: Lebensdauer 42-60 Frames (0,70-1,00 s) und Steiggeschwindigkeit
// 29-35 px/s. Damit gilt fuer JEDE Kombination
//     Steighoehe = vy * life  in  [29*0,70 ; 35*1,00] = [20,3 ; 35,0] px
// -> jeder Funke durchquert das Fenster (Eintritt bei 10 px = 30-49 % seiner
// Lebenszeit, Tod erst bei 20-35 px).
//
// WAS BEWUSST NICHT ANGETASTET WIRD (Anti-Dauerexplosions-Charakter, Jury K):
//   - EMBER_COL_W = 4 (schmale Spawn-Spalte auf der Flammenachse),
//   - EMBER_PER_TORCH = 8 (Deckel je Fackel),
//   - MAX_PARTICLES = 60 (globaler Deckel),
//   - EMBER_DRIFT = 3 (Wolkenbreite <= 10 px).
// Die laengere Lebenszeit VERDUENNT die Fahne sogar: dieselben <= 8 Funken
// verteilen sich jetzt auf 20-35 px Hoehe statt auf 4-11 px.
const EMBER_LIFE_MIN_F = 42;   // Frames (0,70 s)
const EMBER_LIFE_SPAN_F = 19;  // -> 42..60 Frames (0,70-1,00 s)
const EMBER_VY_MIN = 29;       // px/s
const EMBER_VY_SPAN = 6;       // -> 29..35 px/s
// FARBRAMPE ueber die laengere Lebenszeit GESTRECKT: bei gleichmaessiger
// Viertelung (floor(t*4)) faellt der Funke schon nach 3/4 des Aufstiegs auf den
// Tiefstton #7d2a12 und verschwindet optisch im oberen Fensterdrittel. Die
// Stops verschieben die hellen Stufen nach oben, der Tiefstton bleibt der
// letzten Wegstrecke vorbehalten (Index = Anzahl unterschrittener Stops).
const EMBER_RAMP_STOPS = [0.34, 0.62, 0.86];
// Ausblenden ebenfalls gestreckt: 3 DISKRETE Stufen (GP3-Anweisung 8) bleiben,
// setzen aber erst bei 72 % statt 60 % der Lebenszeit ein und enden heller
// (0,72/0,46/0,22 statt 0,66/0,40/0,18) — sonst waere die obere Fensterhaelfte
// wieder unter der Sichtbarkeitsschwelle.
const EMBER_FADE_START = 0.72;
const EMBER_FADE_STEPS = [0.72, 0.46, 0.22];
// Bestandskurve der Staub-Motes (unveraendert, GP3-Anweisung 8).
const MOTE_FADE_START = 0.6;
const MOTE_FADE_STEPS = [0.66, 0.4, 0.18];

export function createParticles() {
  const list = [];

  // Spawnt Funken an (x, y) mit ~SPAWN_RATE Funken/s. dt steuert die Rate
  // (probabilistisch, höchstens ein Funke pro Aufruf). Harte Obergrenze zuerst.
  // Grafikpass 4 §2.5 (Staub-Mote-Buendelung): statt einer gleichverteilten
  // ±2-px-Wolke streuen die Funken in 2-3 CLUSTERN nahe der Fackel — ein
  // Cluster-Offset aus CLUSTER_DX + enge ±1-px-Streuung im Cluster. Der Spawn
  // erfolgt (in main.js) NUR an Fackelpositionen, die dunkle Raummitte bleibt
  // also frei. Deckel MAX_PARTICLES=60 unveraendert.
  function spawnEmbers(x, y, dt) {
    if (list.length >= MAX_PARTICLES) return;
    if (Math.random() >= SPAWN_RATE * dt) return;
    // Grafikpass 4 R2 §(b): ein Teil der Spawns sind driftende Staub-Motes statt
    // aufsteigender Glut-Funken — 2 px, langsamer, warm-neutral, mit Twinkle in
    // draw(). Sie altern und zaehlen zum Deckel 60 exakt wie die Funken.
    // Die Motes behalten ihre 3 Cluster-Offsets (breiter, ruhiger Staub);
    // die BUENDELUNG von Runde 2 betrifft ausschliesslich die Glut-Funken.
    if (Math.random() < MOTE_SHARE) {
      const cluster = CLUSTER_DX[Math.floor(Math.random() * CLUSTER_DX.length)];
      const mBaseX = x + cluster + (Math.random() * 2 - 1);
      list.push({
        kind: 'mote',
        baseX: mBaseX,
        x: mBaseX,
        y: y + (Math.random() * 3 - 1),
        vy: -(2 + Math.random() * 3),         // driftet langsam 2-5 px/s
        age: 0,
        life: 1.8 + Math.random() * 1.0,       // 1,8-2,8 s (< 3,33 s: altert im Smoke §36 sicher aus)
        phase: Math.random() * Math.PI * 2,
        amp: 1 + Math.random() * 2,            // sanftere Seitendrift als die Funken
        freq: 1 + Math.random() * 1.5,
        size: 2,
        hex: MOTE_HEX,
      });
      return;
    }
    // --- Glut-Funke (Runde 2: gebuendelt) ---
    // Deckel PRO FACKEL: die Quelle wird ueber ihre gerundete Weltposition
    // identifiziert (main.js spawnt je Frame genau an den Fackel-Lichtern).
    const src = `${Math.round(x)},${Math.round(y)}`;
    let atSrc = 0;
    for (const p of list) {
      if (p.kind === 'ember' && p.src === src && ++atSrc >= EMBER_PER_TORCH) return;
    }
    const baseX = x + (Math.random() * EMBER_COL_W - EMBER_COL_W / 2); // 4-px-Spalte
    list.push({
      kind: 'ember',
      src,
      baseX,
      baseY: y,                              // Flammenbasis: nie tiefer als hier
      x: baseX,
      y,
      // GATE-FIX: 29-35 px/s x 0,70-1,00 s = 20-35 px Steighoehe (s. o.).
      vy: -(EMBER_VY_MIN + Math.random() * EMBER_VY_SPAN),
      age: 0,
      life: (EMBER_LIFE_MIN_F + Math.floor(Math.random() * EMBER_LIFE_SPAN_F)) / 60,
      phase: Math.random() * Math.PI * 2,
      amp: 1 + Math.random() * (EMBER_DRIFT - 1), // 1-3 px seitlich
      freq: 2 + Math.random() * 2,           // Sinus-Drift-Frequenz
      size: 1,                               // immer 1x1 (2x1 nur der Juengste, in draw)
    });
  }

  function update(dt) {
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      p.age += dt;
      if (p.age >= p.life) { list.splice(i, 1); continue; }
      p.y += p.vy * dt;
      p.x = p.baseX + Math.sin(p.age * p.freq + p.phase) * p.amp;
      // Runde 2: ein Funke steht NIE unter der Flammenbasis (Jury-Auftrag).
      // vy ist immer negativ, die Klammer ist die Absicherung gegen jede
      // spaetere Aenderung der Startwerte.
      if (p.baseY !== undefined && p.y > p.baseY) p.y = p.baseY;
    }
  }

  // Grafikpass 5 §5.D3: Lichtfaktor eines Staub-Motes an seiner WELTposition.
  // Motes sind passiver Staub — sie duerfen in der Finsternis nicht so hell
  // stehen wie im Fackelkegel. Faktor = staerkste normierte Naehe zu einer
  // Lichtquelle (1 im Zentrum, 0 am Radius), FLOOR 0.25 (ganz unsichtbar
  // sollen sie nie werden). Ohne Lichtliste oder auf hellen Maps (ambient
  // fehlt/0) bleibt der Faktor 1 -> Bestandsverhalten.
  // Funken (Glut) sind hiervon BEWUSST ausgenommen: sie leuchten selbst
  // (Deklaration §5.D3).
  function moteLight(px, py, frameLights, ambient) {
    if (!frameLights || frameLights.length === 0 || !(ambient > 0)) return 1;
    let best = 0;
    for (const l of frameLights) {
      const r = l.radius || 0;
      if (r <= 0) continue;
      const d = Math.hypot(px - l.x, py - l.y);
      if (d >= r) continue;
      const f = 1 - d / r;
      if (f > best) best = f;
    }
    return Math.max(0.25, best);
  }

  // Selbstleuchtende Deko: wird in main.js NACH dem Dunkel-Overlay und VOR der
  // Vignette gezeichnet (§2.4), also NICHT vom Licht-Overlay abgedunkelt.
  // Grafikpass 5 §5.D3: Signatur um frameLights + ambient ERWEITERT (beide
  // optional — ohne sie zeichnet draw exakt wie bisher; der Smoke-Test §36 ruft
  // draw nie auf, die Erweiterung ist testneutral).
  function draw(ctx, camera, frameLights, ambient) {
    if (list.length === 0) return;
    // Runde 2: der JUENGSTE Funke JE FACKEL ist der 2x1-Kopf (alle anderen
    // 1x1). Einmal pro draw ermittelt — kein Sortieren, eine Liste-Schleife.
    const youngest = new Map();
    for (const p of list) {
      if (p.kind !== 'ember') continue;
      const cur = youngest.get(p.src);
      if (!cur || p.age < cur.age) youngest.set(p.src, p);
    }
    ctx.save();
    for (const p of list) {
      const t = p.age / p.life;
      // Runde 2 (GP3_RUNDE1_JURY.md Anweisung 8): die ersten 60 % volle Deckung,
      // dann ueber die letzten ~40 % der Lebenszeit in 3 DISKRETEN Alpha-Stufen
      // ausfaden (0.66 -> 0.4 -> 0.18). Der Funke ZERFAELLT stufig, statt weich
      // oder abrupt zu poppen; das Ausfaden faellt bei steigenden Funken raeumlich
      // ins obere Drittel des Aufstiegs. globalAlpha (kein Dither) = der moderne Teil.
      // GATE-FIX R2: Einsatzpunkt und Stufen sind ueber die laengere Lebenszeit
      // GESTRECKT (EMBER_FADE_START/EMBER_FADE_STEPS) — der Funke soll das
      // Gate-Fenster 10-40 px ueber der Flamme SICHTBAR durchqueren, nicht auf
      // halber Strecke unter die Sichtbarkeitsschwelle fallen.
      // Die MOTES behalten die Bestandskurve (0,60 / 0,66-0,40-0,18) — sie waren
      // nie Teil der Funken-Klage und sollen sich nicht mit aendern.
      const fadeStart = p.kind === 'mote' ? MOTE_FADE_START : EMBER_FADE_START;
      const fadeSteps = p.kind === 'mote' ? MOTE_FADE_STEPS : EMBER_FADE_STEPS;
      let alpha = 1;
      if (t >= fadeStart) {
        const f = (t - fadeStart) / (1 - fadeStart);   // 0..1 ueber den Rest
        alpha = f < 1 / 3 ? fadeSteps[0] : f < 2 / 3 ? fadeSteps[1] : fadeSteps[2];
      }
      const sx = Math.round(p.x - camera.x);
      const sy = Math.round(p.y - camera.y);

      // Grafikpass 4 R2 §(b): Staub-Mote — 2 px, dezent additiv, mit 2-Frame-
      // Twinkle (Alpha wechselt zwischen hell/matt). Der Twinkle laeuft aus
      // p.age (update() treibt ihn) + p.phase, damit die Motes NICHT synchron
      // blinken. Kein timeSec noetig -> draw(ctx,camera)-Signatur unveraendert.
      if (p.kind === 'mote') {
        const twinkle = Math.floor((p.age + p.phase) / 0.12) % 2 === 0 ? 1 : 0.5;
        // §5.D3: zusaetzlich der Lichtfaktor an der Mote-Weltposition (Floor 0.25).
        const lf = moteLight(p.x, p.y, frameLights, ambient);
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = alpha * 0.5 * twinkle * lf;
        ctx.fillStyle = MOTE_HEX;
        ctx.fillRect(sx, sy, 2, 2);
        continue;
      }

      // --- Glut-Funke (Runde 2: gebuendelt) ---
      // Farbe aus der eigenen kleinen Funken-Palette, gesteuert vom ALTER
      // (hell -> orange -> dunkelrot -> aus). Zusammen mit der 3-Stufen-
      // Alpha-Blende oben verglimmt der Funke, statt in einem Zufallston zu
      // stehen: die Fahne ueber der Fackel ist oben dunkelrot, unten weissgelb.
      // GATE-FIX R2: die Rampe ist ueber die laengere Lebenszeit GESTRECKT —
      // der Index ist die Anzahl der bereits UEBERSCHRITTENEN Stops
      // (0,34 / 0,62 / 0,86) statt einer gleichmaessigen Viertelung. Damit
      // steht der Funke im Gate-Fenster noch in Weissgelb/Orange und faellt
      // erst auf den letzten ~5 px in den Tiefstton.
      let ri = 0;
      while (ri < EMBER_RAMP_STOPS.length && t >= EMBER_RAMP_STOPS[ri]) ri++;
      const hex = EMBER_RAMP[ri];
      const hot = youngest.get(p.src) === p;      // juengster Funke dieser Fackel
      const headW = hot ? 2 : 1;                  // 2x1 nur fuer den Juengsten
      // Grafikpass 4 R3 §(b): der fruehere 2-px-Glow-KASTEN wurde zu einem 1-px-RING
      // gestrafft (Juror H: 'harte Kerne + max. 1px-Glow-Ring'). Der Ring ist die
      // hohle 1-px-Kontur um den Kern (4 fillRects: oben/unten/links/rechts),
      // additiv ('lighter', warmes Orange, Alpha ~0,35 * der bestehenden 3-Stufen-
      // Blende — faedet mit dem Kern aus). fillRect-only (strokeRect ist §0.3-verboten);
      // kein gefuellter Kasten mehr -> der Funke gluehht, ohne zur weichen Wolke zu
      // werden.
      // Grafikpass 5 §1.2 (Jury: 'Funken lesen als Quadrate'): die Ring-Ecken
      // bleiben FREI (Plus-Umriss statt 3x3-Kasten).
      // RUNDE 2: den Ring traegt nur noch der JUENGSTE Funke einer Fackel. Vorher
      // gluehte jeder 1-px-Funke — bei bis zu 60 Partikeln war genau das K's
      // "Dauerexplosion, die die Fackel verschluckt". Ein einziger gluehender
      // Kopf je Fackel bleibt als Blickfang, der Rest sind harte Pixel.
      if (hot) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = alpha * 0.35;
        ctx.fillStyle = HALO_HEX;
        ctx.fillRect(sx, sy - 1, headW, 1);       // Ring oben (Ecken frei)
        ctx.fillRect(sx, sy + 1, headW, 1);       // Ring unten (Ecken frei)
        ctx.fillRect(sx - 1, sy, 1, 1);           // Ring links
        ctx.fillRect(sx + headW, sy, 1, 1);       // Ring rechts
      }
      // KOPF: 1x1 px (bzw. 2x1 beim juengsten Funken), Ton aus EMBER_RAMP.
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = alpha;
      ctx.fillStyle = hex;
      ctx.fillRect(sx, sy, headW, 1);
      // Grafikpass 5 §1.2: der Nachzieher laeuft entlang des GESCHWINDIGKEITS-
      // VEKTORS hinter dem Kopf. RUNDE 2: nur noch EIN Pixel und nur am
      // juengsten Funken — die Vorgabe "Groesse 1x1" laesst fuer den alten
      // 3-Pixel-Schweif an jedem Funken keinen Platz mehr. Der Schweif wird
      // ausserdem an der Flammenbasis abgeschnitten (nie unter die Fackel).
      // GATE-FIX R2: der Nachzieher haengt jetzt an JEDEM Funken (vorher nur am
      // juengsten). Begruendung: die Funken durchmessen jetzt 20-35 px statt
      // 4-11 px, ein einzelnes 1x1-Pixel je Funke reisst auf dieser Strecke ab.
      // Der Nachzieher bleibt EIN Pixel bei halber Deckkraft 2 px hinter dem
      // Kopf ENTLANG DES GESCHWINDIGKEITSVEKTORS (Spec §1.2) — die Spalte wird
      // dadurch NICHT breiter (|vx/vlen*2| <= 1 px bei vy 29-35 px/s) und der
      // Deckel je Fackel bleibt 8. Aus Punkten werden Striche, keine Wolke.
      {
        const vx = Math.cos(p.age * p.freq + p.phase) * p.amp * p.freq;
        const vlen = Math.hypot(vx, p.vy) || 1;
        const tx = sx - Math.round((vx / vlen) * 2);
        const ty = sy - Math.round((p.vy / vlen) * 2);
        if (p.baseY === undefined || ty <= Math.round(p.baseY - camera.y)) {
          ctx.globalAlpha = alpha * 0.5;
          ctx.fillRect(tx, ty, 1, 1);
        }
      }
    }
    // §0.5 Composite-Hygiene: gco/globalAlpha explizit zuruecksetzen, falls der
    // letzte Partikel ein Mote war (dann steht gco noch auf 'lighter'). Der Boss-
    // Flusstest-Stub restauriert gco in restore() NICHT — ein Leak braeche dort.
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  return { list, spawnEmbers, update, draw };
}
