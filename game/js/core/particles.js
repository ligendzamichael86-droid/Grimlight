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
const EMBER_TONES = ['o', 'y', '1']; // Fackel-Orange, Fackel-Gelb, Flammen-Kern
// Fallback-Hex, falls ein Ton fehlt (defensiv; die Töne existieren in PALETTE).
const EMBER_HEX = EMBER_TONES.map((t) => PALETTE[t] || '#f0bf4e');
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
// Grafikpass 4 R2 §(b): heisser weiss-gelber Funkenkern (1 px), sitzt obenauf dem
// warmen Nachzieher, damit in Standbildern mindestens ein Funke klar heraussticht.
const EMBER_CORE_HEX = '#ffe9b0';
// Grafikpass 4 R2 §(b): Staub-Motes (2 px, driftend, twinkelnd) sind ein ZWEITER
// Partikel-Typ im selben Stream (main.js ruft nur spawnEmbers). ~1/3 der Spawns
// sind Motes; der harte Deckel 60 (Smoke §36) zaehlt beide Typen gemeinsam.
const MOTE_SHARE = 0.35;
// Warm-neutraler Staubton (Bestandston, kein Palette-Symbol) fuer die Motes.
const MOTE_HEX = '#d6cbb1';

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
    const cluster = CLUSTER_DX[Math.floor(Math.random() * CLUSTER_DX.length)];
    const baseX = x + cluster + (Math.random() * 2 - 1);
    // Grafikpass 4 R2 §(b): ein Teil der Spawns sind driftende Staub-Motes statt
    // aufsteigender Glut-Funken — 2 px, langsamer, warm-neutral, mit Twinkle in
    // draw(). Sie altern und zaehlen zum Deckel 60 exakt wie die Funken.
    if (Math.random() < MOTE_SHARE) {
      list.push({
        kind: 'mote',
        baseX,
        x: baseX,
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
    const tone = Math.floor(Math.random() * EMBER_TONES.length);
    list.push({
      kind: 'ember',
      baseX,
      x: baseX,
      y: y + (Math.random() * 2 - 1),
      vy: -(6 + Math.random() * 6),         // steigt 6-12 px/s
      age: 0,
      life: 1.2 + Math.random() * 1.3,       // 1,2-2,5 s
      phase: Math.random() * Math.PI * 2,
      amp: 2 + Math.random() * 3,            // Sinus-Drift-Amplitude (px)
      freq: 2 + Math.random() * 2,           // Sinus-Drift-Frequenz
      size: Math.random() < 0.6 ? 1 : 2,     // Groessenmix ~60 % 1 px / 40 % 2 px (Runde 2, Anweisung 8)
      hex: EMBER_HEX[tone],
    });
  }

  function update(dt) {
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      p.age += dt;
      if (p.age >= p.life) { list.splice(i, 1); continue; }
      p.y += p.vy * dt;
      p.x = p.baseX + Math.sin(p.age * p.freq + p.phase) * p.amp;
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
    ctx.save();
    for (const p of list) {
      const t = p.age / p.life;
      // Runde 2 (GP3_RUNDE1_JURY.md Anweisung 8): die ersten 60 % volle Deckung,
      // dann ueber die letzten ~40 % der Lebenszeit in 3 DISKRETEN Alpha-Stufen
      // ausfaden (0.66 -> 0.4 -> 0.18). Der Funke ZERFAELLT stufig, statt weich
      // oder abrupt zu poppen; das Ausfaden faellt bei steigenden Funken raeumlich
      // ins obere Drittel des Aufstiegs. globalAlpha (kein Dither) = der moderne Teil.
      let alpha = 1;
      if (t >= 0.6) {
        const f = (t - 0.6) / 0.4;                 // 0..1 ueber die letzten 40 %
        alpha = f < 1 / 3 ? 0.66 : f < 2 / 3 ? 0.4 : 0.18;
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

      // --- Glut-Funke ---
      // Grafikpass 4 R3 §(b): der fruehere 2-px-Glow-KASTEN wird zu einem 1-px-RING
      // gestrafft (Juror H: 'harte Kerne + max. 1px-Glow-Ring'). Der Ring ist die
      // hohle 1-px-Kontur um den Kern (4 fillRects: oben/unten/links/rechts),
      // additiv ('lighter', warmes Orange, Alpha ~0,35 * der bestehenden 3-Stufen-
      // Blende — faedet mit dem Kern aus). fillRect-only (strokeRect ist §0.3-verboten);
      // kein gefuellter Kasten mehr -> der Funke gluehht, ohne zur weichen Wolke zu
      // werden.
      // Grafikpass 5 §1.2 (Jury: 'Funken lesen als Quadrate'): die Ring-Ecken
      // bleiben FREI — oben/unten laufen nur noch ueber die Kernbreite (rs statt
      // rs+2, ohne den -1-Vorlauf), links/rechts unveraendert ueber die Kernhoehe.
      // Aus dem geschlossenen 3x3-Kasten wird ein Plus-Umriss. ZUSAETZLICH traegt
      // NUR der 1-px-Funke ueberhaupt einen Ring: bei size===2 ist der Kern
      // gross genug, der Ring machte daraus den fetten 4x4-Block.
      const rs = p.size;                          // Kerngroesse (1 o. 2 px)
      if (rs === 1) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = alpha * 0.35;
        ctx.fillStyle = HALO_HEX;
        ctx.fillRect(sx, sy - 1, rs, 1);          // Ring oben (Ecken frei)
        ctx.fillRect(sx, sy + rs, rs, 1);         // Ring unten (Ecken frei)
        ctx.fillRect(sx - 1, sy, 1, rs);          // Ring links
        ctx.fillRect(sx + rs, sy, 1, rs);         // Ring rechts
      }
      // Grafikpass 4 R3 §(b): warmer KOPF + NACHZIEHER als 3 diskrete Pixel
      // abnehmender Helligkeit (100/60/30 % der Blende) statt des frueheren weichen
      // 2-px-Schweifs (Juror H: 'Nachzieher als 3 Pixel 100/60/30 %'). Der Funke
      // steigt (vy < 0, sy sinkt), der glimmende Schweif bleibt darunter zurueck.
      // Warmer Funken-Ton, normal geblendet (scharfe Kante gegen den Halo-Ring).
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.hex;
      ctx.fillRect(sx, sy, rs, rs);               // Kopf (100 %)
      // Grafikpass 5 §1.2: der Nachzieher liegt jetzt entlang des GESCHWINDIG-
      // KEITSVEKTORS hinter dem Kopf (bisher stur senkrecht darunter — bei
      // seitlich driftenden Funken sah das aus wie ein abgerissener Tropfen).
      // vx ist die Ableitung der Sinus-Drift (x = baseX + sin(age*freq+phase)*amp),
      // vy die Steiggeschwindigkeit. Der Schweif laeuft GEGEN diese Richtung;
      // bei rein senkrechtem Aufstieg (ux=0, uy=-1) ergibt das exakt die alten
      // Positionen sy+rs+ti. Ganzzahlig gerundet -> pixelrein.
      const vx = Math.cos(p.age * p.freq + p.phase) * p.amp * p.freq;
      const vlen = Math.hypot(vx, p.vy) || 1;
      const ux = vx / vlen;
      const uy = p.vy / vlen;
      const TRAIL = [1, 0.6, 0.3];                // 3-Pixel-Schweif, abnehmend
      for (let ti = 0; ti < TRAIL.length; ti++) {
        const d = rs + ti;                        // Abstand hinter dem Kopf
        ctx.globalAlpha = alpha * TRAIL[ti];
        ctx.fillRect(sx - Math.round(ux * d), sy - Math.round(uy * d), rs, 1);
      }
      // Grafikpass 4 R2 §(b): 1-px weiss-gelber KERN (#ffe9b0) obenauf — der heisse
      // Funkenkopf, der in Standbildern klar aus dem warmen Schweif heraussticht.
      ctx.globalAlpha = alpha;
      ctx.fillStyle = EMBER_CORE_HEX;
      ctx.fillRect(sx, sy, 1, 1);
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
