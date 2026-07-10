// Licht-System: Dunkelheits-Overlay mit ausgestanzten, posterisierten
// Lichtkreisen (3 Stufen statt weichem Gradient — Retro-Look).
//
// Node-importierbar: kein window/document auf Modulebene. Das interne
// Offscreen-Canvas wird beim ERSTEN draw()-Aufruf genau einmal lazy aus
// ctx.canvas.ownerDocument erzeugt und danach gecacht (kein createElement
// pro Frame).
//
// Rundungskonvention wie alle Zeichner (Festlegung 6, Slice 0):
// screen = Math.round(weltX - camera.x) — sonst jittern die Lichtkreise
// um 1 px gegen die Tiles.

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

  // Eine posterisierte Stufe stanzen: destination-out entfernt Deckung.
  function punch(cx, cy, r, alpha) {
    octx.globalAlpha = alpha;
    octx.beginPath();
    octx.arc(cx, cy, r, 0, Math.PI * 2);
    octx.fill();
  }

  // lights: [{x, y, radius, flicker}] in WELTpixeln; flicker 0..1 (0 = statisch)
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

    octx.globalCompositeOperation = 'destination-out';
    for (const light of lights) {
      // Deterministisches Flackern (KEIN Math.random im Renderpfad):
      // zwei entkoppelte Sinus-Wellen, Phase aus der Weltposition,
      // Radius-Jitter maximal ±10 % bei flicker = 1.
      const flicker = light.flicker || 0;
      const wob =
        Math.sin(timeSec * 13 + light.x * 7) * 0.6 +
        Math.sin(timeSec * 8.3 + light.y * 5 + light.x * 3) * 0.4;
      const r = light.radius * (1 + flicker * 0.1 * wob);

      // Viewport-Culling: Lichter außerhalb Kamera-Rect + Radius überspringen
      // (Katakomben haben viele Fackeln, die meisten sind off-screen).
      if (
        light.x + r < camera.x || light.x - r > camera.x + viewW ||
        light.y + r < camera.y || light.y - r > camera.y + viewH
      ) continue;

      const cx = Math.round(light.x - camera.x);
      const cy = Math.round(light.y - camera.y);
      // 3 konzentrische Stufen: außen schwach, Mitte mittel, innen voll.
      punch(cx, cy, r, 0.35);
      punch(cx, cy, r * 0.75, 0.55);
      punch(cx, cy, r * 0.45, 1);
    }
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
      const gr = r * 0.6; // §2.3: Glow-Radius kappen (kein breiter Teppich mehr)
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, gr);
      grad.addColorStop(0, 'rgba(216,114,42,0.13)');
      grad.addColorStop(0.4, 'rgba(216,114,42,0.04)');
      grad.addColorStop(1, 'rgba(216,114,42,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, gr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  return { draw };
}
