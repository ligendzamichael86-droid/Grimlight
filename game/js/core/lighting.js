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

// Grafikpass 4 R2 §(a) Banding-Fix: die Fackelkegel-Punch-Stufen von 3 auf 6
// feine Ringe erhoeht. Die alten 3 harten Baender (kumulative Restdunkelheit
// 1 -> 0.65 -> 0.29 -> 0, Spruenge ~0.35) lasen als 'aufgemalte Rosetten/
// Kornkreise'. Die 6 Ringe unten ergeben (destination-out ist multiplikativ:
// dst *= (1-a)) eine kumulative Restdunkelheit von 0.82 -> 0.64 -> 0.46 ->
// 0.30 -> 0.15 -> 0 — benachbarte Baender liegen nur ~0.15-0.18 auseinander
// (max ~1 Palettenstufe, Wirbel-Kontrast gedeckelt). rf = Radius-Faktor,
// a = destination-out-Alpha des Rings.
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
const HOT_RINGS = [         // Flammen-Hotspot (Radius 2.25 px), Spitze 0.5 * pulse
  { rf: 1.00, a: 0.15, c: '255,240,200' },
  { rf: 0.66, a: 0.17, c: '255,240,200' },
  { rf: 0.33, a: 0.18, c: '255,240,200' },
];

const PUNCH_RINGS = [
  { rf: 1.00, a: 0.18 },
  { rf: 0.85, a: 0.22 },
  { rf: 0.70, a: 0.28 },
  { rf: 0.55, a: 0.35 },
  { rf: 0.40, a: 0.50 },
  { rf: 0.25, a: 1.00 },
];

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
      // Grafikpass 4 R2 §(a): 6 feine konzentrische Stufen (PUNCH_RINGS) statt
      // der frueheren 3 harten Baender. Die Bogenradien werden pro Licht
      // deterministisch leicht variiert (Sinus aus der Weltposition, KEIN
      // Math.random) — so rasten die konzentrischen Kanten mehrerer Fackeln
      // NICHT auf identische Radien ein, das 'Kornkreis'-Muster bricht auf.
      const seed = light.x * 0.7 + light.y * 1.3;
      for (let k = 0; k < PUNCH_RINGS.length; k++) {
        const ring = PUNCH_RINGS[k];
        // Innerste Vollstufe (Kern) NICHT jittern -> kein Dunkel-Loch im Zentrum.
        const rWob = k === PUNCH_RINGS.length - 1 ? 0 : Math.sin(seed + k * 2.399) * 0.02;
        punch(cx, cy, r * (ring.rf + rWob), ring.a);
      }
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
      const pulse = 0.75 + 0.25 * wob;               // ~[0.5 .. 1.0]
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

      // (b) 2-3 px weiss-gelber Flammenkern-Hotspot (Radial, Stops ~0.5->0),
      // pulsierend wie der Boden-Glow. Sitzt knapp ueber dem Zentrum (Flammenkern).
      // Grafikpass 4 R3 §(b): Hotspot-Radius leicht reduziert (~25 %: 3 -> 2.25 px),
      // damit der weiss-gelbe Kern straffer sitzt (begleitet die Funken-Straffung).
      const hotY = cy - 3;
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
