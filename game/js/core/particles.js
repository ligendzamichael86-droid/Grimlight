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
//   2-px additivem Glow-Halo (warmes Orange, Alpha 40 %, 'lighter') umhuellt,
//   damit die Funken gluehen statt Einzelpunkte zu sein.
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

export function createParticles() {
  const list = [];

  // Spawnt Funken an (x, y) mit ~SPAWN_RATE Funken/s. dt steuert die Rate
  // (probabilistisch, höchstens ein Funke pro Aufruf). Harte Obergrenze zuerst.
  function spawnEmbers(x, y, dt) {
    if (list.length >= MAX_PARTICLES) return;
    if (Math.random() >= SPAWN_RATE * dt) return;
    const tone = Math.floor(Math.random() * EMBER_TONES.length);
    const baseX = x + (Math.random() * 4 - 2);
    list.push({
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

  // Selbstleuchtende Deko: wird in main.js NACH dem Dunkel-Overlay und VOR der
  // Vignette gezeichnet (§2.4), also NICHT vom Licht-Overlay abgedunkelt.
  function draw(ctx, camera) {
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
      // Runde 3 (M-K6a): 2-px additiver Glow-Halo (warmes Orange) um jeden Funken,
      // damit sie gluehen statt Einzelpunkte zu sein. 'lighter'-Composite = echtes
      // additives Aufhellen ueberlappender Halos; Alpha = 0,4 * der bestehenden
      // 3-Stufen-Blende, der Halo faedet also mit dem Kern aus. fillRect-only; der
      // Halo-Kasten ist um 1 px pro Seite groesser als der Kern (1-px-Kern -> 3x3).
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = alpha * 0.4;
      ctx.fillStyle = HALO_HEX;
      ctx.fillRect(sx - 1, sy - 1, p.size + 2, p.size + 2);
      // 1-px-Kern (Groessenmix 1-2 px aus R2 unveraendert) ueber dem Halo, normal
      // geblendet, damit der Funke einen scharfen Kern behaelt.
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.hex;
      ctx.fillRect(sx, sy, p.size, p.size);
    }
    ctx.restore();
  }

  return { list, spawnEmbers, update, draw };
}
