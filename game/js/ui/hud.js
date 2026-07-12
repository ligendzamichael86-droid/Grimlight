// HUD, Vignette und Screens. Browser-Objekte nur innerhalb der Funktionen.

import { XP_THRESHOLDS, LEVEL_CAP } from '../items/progression.js';

const VIEW_W = 320;
const VIEW_H = 180;

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
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(px, py + 1, pw, ph - 2);         // Mittelband (volle Breite)
    ctx.fillRect(px + 1, py, pw - 2, 1);          // obere Zeile (Ecken frei)
    ctx.fillRect(px + 1, py + ph - 1, pw - 2, 1); // untere Zeile (Ecken frei)
    // §2.6 [GP4] leichter Vertikal-Gradient: oberes Drittel +6 Luma (ein
    // helleres fillRect-Band ueber der Grundflaeche, kein Gradient-Objekt).
    ctx.fillStyle = '#10101c';
    ctx.fillRect(px + 1, py + 1, pw - 2, Math.round((ph - 2) / 3));
    // §2.6 [GP4] Innen-Schlagschatten: 1-px-Dunkellinien knapp INNEN unter der
    // oberen und rechts der linken Kante — die Grundflaeche liegt in einer
    // Vertiefung hinter dem erhabenen Rahmen (Tiefe). Klein (kein Vollbild).
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = '#000';
    ctx.fillRect(px + 2, py + 1, pw - 4, 1);      // Innenschatten oben
    ctx.fillRect(px + 1, py + 2, 1, ph - 4);      // Innenschatten links
    // 2-Ton-Bevel: hell oben+links (Lichtkante)
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#575061';
    ctx.fillRect(px + 1, py, pw - 2, 1);          // Bevel oben (hell)
    ctx.fillRect(px, py + 1, 1, ph - 2);          // Bevel links (hell)
    // 2-Ton-Bevel: dunkel unten+rechts (Eigenschatten)
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = '#14101a';
    ctx.fillRect(px + 1, py + ph - 1, pw - 2, 1); // Bevel unten (dunkel)
    ctx.fillRect(px + pw - 1, py + 1, 1, ph - 2); // Bevel rechts (dunkel)
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
  ctx.fillStyle = '#f0bf4e';
  ctx.fillText(`GOLD ${player.gold}`, 4, 15);

  // Trank-Anzeige: Flaschen-Icon + Zähler unter den Herzen/Gold
  ctx.drawImage(gfx.potion, 4, 25);
  ctx.fillStyle = '#d6cbb1';
  ctx.fillText(`x ${player.potions ?? 0}`, 16, 27);

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
    // entsaettigte Rinne ueber die volle Innenbreite
    ctx.fillStyle = '#3a3542';
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
      ctx.fillStyle = blink ? '#f1e9d3' : '#9a90a6'; // oberes Band: heller
      ctx.fillRect(ix, iy, fw, 1);
      ctx.fillStyle = blink ? '#f1e9d3' : '#7d7588'; // unteres Band: Grundton
      ctx.fillRect(ix, iy + 1, fw, ih - 1);
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

  // Boss-HP-Balken (§3, aus player.bossBar gespiegelt): 80x8 bei (120,7).
  // Runde 3 (H-K6): 2-px dunkler Rahmen, 1-px Innenbevel (hell oben-links,
  // dunkel unten-rechts), Vertikal-Gradient aus 3 fillRect-Baendern (helleres
  // oberes Drittel), Segment-Ticks bei 25/50/75 % und eine entsaettigte
  // 'verlorene HP'-Rinne hinter der aktuellen Fuellung. AUSSCHLIESSLICH fillRect
  // (keine strokeRect/arc/Gradient-Objekte). Bar bleibt in drawHUD NACH
  // lighting.draw, damit der ambientAlpha-Detektor der Boss-Flusstests (erstes
  // Teilalpha-fillRect auf dem Lighting-Offscreen, NICHT auf dem Haupt-Canvas)
  // unberuehrt bleibt. Keine Gameplay-Werte (bb.hp/bb.maxHp nur gelesen).
  // Kein Namenstext (der Name kommt als Toast).
  const bb = player.bossBar;
  if (bb) {
    const bx = 120, by = 7, bw = 80, bh = 8;              // Aussenmasse
    const ix = bx + 2, iy = by + 2, iw = bw - 4, ih = bh - 4; // Innenflaeche 122,9,76,4
    ctx.save();
    // 2-px dunkler Rahmen (Vollflaeche; die Innenflaeche wird darueber neu gefuellt)
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#14101a';
    ctx.fillRect(bx, by, bw, bh);
    // entsaettigte 'verlorene HP'-Rinne ueber die volle Innenbreite (dahinter)
    ctx.fillStyle = '#5a3936';
    ctx.fillRect(ix, iy, iw, ih);
    // aktuelle HP-Fuellung als 3-Band-Vertikal-Gradient (oberes Drittel heller)
    const fw = Math.max(0, Math.round((iw * bb.hp) / bb.maxHp));
    if (fw > 0) {
      ctx.fillStyle = '#c9463b';                 // oberes Drittel: heller
      ctx.fillRect(ix, iy, fw, 1);
      ctx.fillStyle = '#ae2f2a';                 // Mitte: Grundton
      ctx.fillRect(ix, iy + 1, fw, ih - 2);
      ctx.fillStyle = '#872420';                 // unten: dunkler
      ctx.fillRect(ix, iy + ih - 1, fw, 1);
    }
    // Segment-Ticks alle 25 % (1-px dunkle Vertikalen ueber die Innenhoehe)
    ctx.fillStyle = '#14101a';
    for (let k = 1; k <= 3; k++) {
      ctx.fillRect(ix + Math.round((iw * k) / 4), iy, 1, ih);
    }
    // 1-px Innenbevel: hell oben+links (Lichtkante)
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = '#575061';
    ctx.fillRect(ix, iy, iw, 1);                 // oben (hell)
    ctx.fillRect(ix, iy, 1, ih);                 // links (hell)
    // 1-px Innenbevel: dunkel unten+rechts (Eigenschatten)
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#14101a';
    ctx.fillRect(ix, iy + ih - 1, iw, 1);        // unten (dunkel)
    ctx.fillRect(ix + iw - 1, iy, 1, ih);        // rechts (dunkel)
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

export function drawVignette(ctx) {
  if (!vignetteCanvas) {
    vignetteCanvas = document.createElement('canvas');
    vignetteCanvas.width = VIEW_W;
    vignetteCanvas.height = VIEW_H;
    const vctx = vignetteCanvas.getContext('2d');
    // Runde 2 (§8c.2, GP3_RUNDE1_JURY.md Anweisung 9): die Vignette las in den
    // Katakomben (g3_03/g3_06) als unmotivierter zentraler Dunkel-Fleck. Deutlich
    // abgeschwaecht: Innenradius 60 -> 90 (die gesamte Bildmitte bleibt jetzt klar
    // transparent, kein Fleck mehr), max-Alpha 0.75 -> 0.45, Mittel-Stop weicher
    // (0.6/0.35 -> 0.55/0.14). Aussenradius 200 -> 190 (knapp an die Bild-Ecken
    // r~184 herangezogen, damit die Ecken die max-Deckung ~0.42 wirklich erreichen
    // und ein DEZENTER Rand-Fokus bleibt, statt ihn ueber die Ecken hinaus zu
    // verschmieren). KEINE Kopplung an Lichtquellen in diesem Pass (Pass-4-Kandidat).
    const grad = vctx.createRadialGradient(
      VIEW_W / 2, VIEW_H / 2, 90,
      VIEW_W / 2, VIEW_H / 2, 190
    );
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(0.55, 'rgba(6,4,10,0.14)');
    grad.addColorStop(1, 'rgba(4,2,8,0.45)');
    vctx.fillStyle = grad;
    vctx.fillRect(0, 0, VIEW_W, VIEW_H);
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

export function drawTitle(ctx, timeSec) {
  ctx.fillStyle = '#0a0810';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  centerText(ctx, 'GRIMLIGHT', 57, '#14101a', 'bold 32px monospace'); // Schatten
  centerText(ctx, 'GRIMLIGHT', 54, '#ae2f2a', 'bold 32px monospace');
  centerText(ctx, 'Ein Friedhof. Eine Krypta. Ein Schatz.', 96, '#7d7588', '8px monospace');
  if (Math.floor(timeSec * 2) % 2 === 0) {
    centerText(ctx, 'ENTER / LEERTASTE / TIPPEN', 130, '#d6cbb1', '8px monospace');
  }
  drawVignette(ctx);
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
