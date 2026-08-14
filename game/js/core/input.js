// Eingabe: Tastatur (WASD/Pfeile, J/Leertaste, Trank K/E) + Touch
// (dynamischer Joystick links, Angriff = rechte Hälfte, Trank = Button B).
// Ohne attach() in Node nutzbar.
//
// Slice 1: input.potion (Pegel, keine Flanke — Flankenerkennung macht der
// Spieler-Code). Dokumentierte Abweichung von "Verhalten unverändert":
// Touches, deren STARTPUNKT im Kreis von Button B liegt, werden aus der
// Angriffszone (rechte Hälfte) ausgenommen — sonst würde jeder Trank-Tap
// gleichzeitig einen Schwertschwung auslösen. Tastatur/Joystick/Button A
// verhalten sich exakt wie in Slice 0.
//
// Slice 2: input.secondary (Taste L oder Touch-Button W), input.inventory
// (Taste I/Tab oder Touch-Start in der HUD-Box-Zone), input.tap (Position
// des letzten touchstart, postUpdate() loescht). Alles Pegel, Flanken macht
// der Verbraucher. HUD-Box-Zone und Button W greifen NUR wenn sichtbar
// (input.hudBoxVisible bzw. buttons[2].visible, beides setzt main.js);
// sonst faellt der Touch in die normale Zonenlogik (keine toten
// Angriffszonen vor dem Bumerang-Erhalt). Pruefreihenfolge bei touchstart:
// HUD-Box, dann W, dann B, dann Joystick/Angriff.
//
// Alle Touch-Felder (joyBase/joy/buttons) sind 320×180-Koordinaten.
// confirm ist edge-basiert: wird von einem Neu-Druck/Tap gesetzt und von
// postUpdate() am Frame-Ende gelöscht. main.js soll beim State-Eintritt
// consumeConfirm() rufen, damit kein Input in den neuen State durchblutet.

const VIEW_W = 320;
const VIEW_H = 180;
// ===========================================================================
// SLICE 4 §5.1 / A4 — ERGONOMIE-MASSE.
//
// REFERENZGERAET (bindend fuer alle mm-Angaben hier): 1080x2400, dpr 3,
// 6,5 Zoll, QUER. main.js skaliert dann mit 6 GERAETEpixeln je internem px;
// input.js rechnet in CSS-px (getBoundingClientRect), das sind 6/3 = 2
// CSS-px je internem px. Physisch: 404,9 ppi -> 1 Geraetepixel 0,0627 mm,
// also 1 INTERNER px = 0,376 mm.
//
// (c) A4: JOY_RADIUS_SCREEN ist eine BILDSCHIRM-Groesse (CSS-px). 64 CSS-px
//     = 32 interne px = 12,05 mm Vollausschlag (vorher 40 -> 7,53 mm; eine
//     analoge Feinsteuerung war auf der Strecke kaum moeglich, Landkarte
//     B §1.4, Einheitenfalle Review P2-M12).
// ===========================================================================
const JOY_RADIUS_SCREEN = 64;
const JOY_DEADZONE_SCREEN = 8;
// (a) A4: das JOYSTICK-FELD endet 24 interne px ueber der Canvas-Unterkante
// (180 - 156 = 24 = 9,03 mm). Darunter liegt Androids Wischbalken bzw. der
// iOS-Home-Indicator — ein dort begonnener Touch gehoert dem System. Ein
// Touch unterhalb faellt bewusst in KEINE Zone; er darf insbesondere nicht in
// die Angriffszone (rechte Haelfte) rutschen.
const JOY_FIELD_Y1 = 156;

const KEY_UP = ['KeyW', 'ArrowUp'];
const KEY_DOWN = ['KeyS', 'ArrowDown'];
const KEY_LEFT = ['KeyA', 'ArrowLeft'];
const KEY_RIGHT = ['KeyD', 'ArrowRight'];
const KEY_ATTACK = ['KeyJ', 'Space'];
const KEY_POTION = ['KeyK', 'KeyE'];
const KEY_CONFIRM = ['Enter', 'Space'];
const KEY_SECONDARY = ['KeyL'];
const KEY_INVENTORY = ['KeyI', 'Tab'];
// SLICE 4 §4.2: Pause. Escape bewusst NICHT in der preventDefault-Liste —
// im Browser-Vollbild ist Escape die Ausstiegstaste des Systems.
const KEY_PAUSE = ['Escape', 'KeyP'];

// HUD-Box-Zone (Inventar-Oeffner oben rechts), Rechteck (290,0)-(320,30)
const HUD_BOX = { x0: 290, y0: 0, x1: 320, y1: 30 };

export function createInput() {
  const keys = new Set();
  let canvas = null;
  let joyId = null;    // Touch-Identifier des Joystick-Fingers
  let attackIds = new Set(); // Touch-Identifier auf der rechten Hälfte
  let potionIds = new Set(); // Touch-Identifier, die auf Button B gestartet sind
  let secondaryIds = new Set(); // Touch-Identifier, die auf Button W gestartet sind
  let hudBoxIds = new Set();    // Touch-Identifier, die in der HUD-Box gestartet sind
  let pauseIds = new Set();     // Touch-Identifier, die auf dem Pause-Knopf gestartet sind
  let joyRadius = 32;  // interne Fallback-Werte (2×-Skalierung), toGame() aktualisiert
  let joyDeadzone = 4;

  const input = {
    dirX: 0,
    dirY: 0,
    attack: false,
    potion: false,
    confirm: false,
    secondary: false,
    inventory: false,
    pause: false,         // SLICE 4 §4.2: Pegel (Escape/P oder Pause-Knopf)
    tap: null,            // { x, y } des letzten touchstart, postUpdate() loescht
    hudBoxVisible: false, // main.js setzt, wenn die HUD-Item-Box sichtbar ist
    touch: {
      active: false,
      joyBaseX: 0,
      joyBaseY: 0,
      joyX: 0,
      joyY: 0,
      joyRadius: 32, // interner Joystick-Radius (für HUD-Overlay)
      // SLICE 4 §5.1 / A4 — ZONEN-GEOMETRIE. Bindende Werte, mm auf dem
      // Referenzgeraet (1 interner px = 0,376 mm, s. Kopf):
      //   A  r 16 -> 32 px = 12,04 mm   (Deko-Kreis; die REALE Angriffszone
      //                                  ist die rechte Haelfte, Review P1-M2)
      //   B  r 12 -> 24 px =  9,03 mm   Unterkante 156 -> 24 px ueber Rand (a)
      //   W  r 14 -> 28 px = 10,54 mm   Unterkante 116, VERSETZT nach oben (b)
      // Luecken (Mittenabstand minus beide Radien):
      //   B<->W  sqrt(32²+42²) - 26 = 26,80 px  >= 16  (b)
      //   A<->W  sqrt( 4²+46²) - 30 = 16,17 px  >= 12  (b)
      // ALLE Kreise >= 9 mm Durchmesser (d).
      buttons: [
        { x: 288, y: 148, r: 16, label: 'A', pressed: false },
        { x: 252, y: 144, r: 12, label: 'B', pressed: false },
        // W erst mit Bumerang sichtbar (main.js setzt visible, hud.js
        // zeichnet nur sichtbare Buttons)
        { x: 284, y: 102, r: 14, label: 'W', pressed: false, visible: false },
      ],
      // SLICE 4 §4.2 PAUSE-KNOPF (oben). r 12 -> 24 px = 9,03 mm (>= 7 mm
      // gefordert). Lage kollisionsfrei: HUD-Panel endet bei x 56, der
      // Boss-Balken bei x 200, der GOTT-Hinweis beginnt bei ~268, die
      // Item-Box bei 296. EIN BESITZER: hud.js zeichnet ausschliesslich aus
      // diesem Objekt, main.js setzt nur `visible`.
      pause: { x: 232, y: 14, r: 12, visible: false, pressed: false },
    },
    attach,
    postUpdate,
    consumeConfirm,
  };

  function anyDown(codes) {
    return codes.some((c) => keys.has(c));
  }

  function recompute() {
    let dx = (anyDown(KEY_RIGHT) ? 1 : 0) - (anyDown(KEY_LEFT) ? 1 : 0);
    let dy = (anyDown(KEY_DOWN) ? 1 : 0) - (anyDown(KEY_UP) ? 1 : 0);
    if (dx !== 0 && dy !== 0) {
      const inv = 1 / Math.hypot(dx, dy);
      dx *= inv;
      dy *= inv;
    }
    if (joyId !== null) {
      const vx = input.touch.joyX - input.touch.joyBaseX;
      const vy = input.touch.joyY - input.touch.joyBaseY;
      const len = Math.hypot(vx, vy);
      if (len < joyDeadzone) {
        dx = 0;
        dy = 0;
      } else {
        const mag = Math.min(len / joyRadius, 1);
        dx = (vx / len) * mag;
        dy = (vy / len) * mag;
      }
    }
    input.dirX = dx;
    input.dirY = dy;
    const touchAttack = attackIds.size > 0;
    input.attack = anyDown(KEY_ATTACK) || touchAttack;
    input.touch.buttons[0].pressed = touchAttack;
    const touchPotion = potionIds.size > 0;
    input.potion = anyDown(KEY_POTION) || touchPotion;
    input.touch.buttons[1].pressed = touchPotion;
    const touchSecondary = secondaryIds.size > 0;
    input.secondary = anyDown(KEY_SECONDARY) || touchSecondary;
    input.touch.buttons[2].pressed = touchSecondary;
    input.inventory = anyDown(KEY_INVENTORY) || hudBoxIds.size > 0;
    const touchPause = pauseIds.size > 0;
    input.pause = anyDown(KEY_PAUSE) || touchPause;
    input.touch.pause.pressed = touchPause;
  }

  function onKeyDown(e) {
    // I/Tab/L in beiden preventDefault-Listen: Tab wuerde sonst den
    // Browser-Fokus wechseln (blur, Fokus-Reset).
    if (e.repeat) {
      if (KEY_UP.concat(KEY_DOWN, KEY_LEFT, KEY_RIGHT, KEY_ATTACK, KEY_POTION, KEY_SECONDARY, KEY_INVENTORY).includes(e.code)) e.preventDefault();
      return;
    }
    keys.add(e.code);
    // SLICE 4 §5.4: Tastatureingabe schaltet das Touch-Overlay wieder ab.
    // Bisher wurde touch.active beim ersten Tap gesetzt und NIE wieder
    // zurueckgenommen (Landkarte B §1.6) — auf dem Desktop blieben die
    // Kreise danach dauerhaft im Bild. Der naechste Tap setzt es sofort
    // wieder (onTouchStart).
    input.touch.active = false;
    if (KEY_CONFIRM.includes(e.code)) input.confirm = true;
    if (KEY_UP.concat(KEY_DOWN, KEY_LEFT, KEY_RIGHT, KEY_ATTACK, KEY_POTION, KEY_CONFIRM, KEY_SECONDARY, KEY_INVENTORY).includes(e.code)) {
      e.preventDefault();
    }
    recompute();
  }

  function onKeyUp(e) {
    keys.delete(e.code);
    recompute();
  }

  // Client-Koordinaten → 320×180. Stimmt, weil das Canvas-Backing fest
  // 320×180 ist und der Letterbox-Rand AUSSERHALB des Elements liegt.
  function toGame(t) {
    const r = canvas.getBoundingClientRect();
    const scale = r.width / VIEW_W; // Bildschirm-px pro internem px
    if (scale > 0) {
      joyRadius = JOY_RADIUS_SCREEN / scale;
      joyDeadzone = JOY_DEADZONE_SCREEN / scale;
      input.touch.joyRadius = joyRadius;
    }
    return {
      x: ((t.clientX - r.left) * VIEW_W) / r.width,
      y: ((t.clientY - r.top) * VIEW_H) / r.height,
    };
  }

  function onTouchStart(e) {
    e.preventDefault();
    input.touch.active = true;
    input.confirm = true; // Tap = confirm (main konsumiert bei State-Eintritt)
    for (const t of e.changedTouches) {
      const p = toGame(t);
      input.tap = { x: p.x, y: p.y };
      // Zonen-Pruefreihenfolge (Spec Slice 2): HUD-Box, dann W, dann B,
      // dann Joystick/Angriff. HUD-Box und W greifen NUR wenn sichtbar,
      // sonst faellt der Touch in die normale Zonenlogik. B folgt dem
      // Startpunkt-Ausnahme-Muster aus Slice 1 (siehe Kopf-Kommentar).
      const w = input.touch.buttons[2];
      const b = input.touch.buttons[1];
      // SLICE 4 §4.2: der Pause-Knopf steht VOR allen anderen Zonen und
      // greift NUR sichtbar (main.js schaltet ihn ausserhalb von 'playing'
      // ab — sonst frisst seine Zone Taps im Titel/Game-Over, Muster
      // hudBoxVisible, Review P1-m2).
      const pz = input.touch.pause;
      if (pz.visible && (p.x - pz.x) * (p.x - pz.x) + (p.y - pz.y) * (p.y - pz.y) <= pz.r * pz.r) {
        pauseIds.add(t.identifier);
      } else if (input.hudBoxVisible
          && p.x >= HUD_BOX.x0 && p.x <= HUD_BOX.x1
          && p.y >= HUD_BOX.y0 && p.y <= HUD_BOX.y1) {
        hudBoxIds.add(t.identifier);
      } else if (w.visible && (p.x - w.x) * (p.x - w.x) + (p.y - w.y) * (p.y - w.y) <= w.r * w.r) {
        secondaryIds.add(t.identifier);
      } else if ((p.x - b.x) * (p.x - b.x) + (p.y - b.y) * (p.y - b.y) <= b.r * b.r) {
        potionIds.add(t.identifier);
      } else if (p.x < VIEW_W / 2) {
        // §5.1/A4(a): unterhalb von JOY_FIELD_Y1 beginnt kein Joystick mehr
        // (Gestenleisten-Schutz). Der Touch faellt dann in KEINE Zone.
        if (p.y <= JOY_FIELD_Y1 && joyId === null) {
          joyId = t.identifier;
          input.touch.joyBaseX = p.x;
          input.touch.joyBaseY = p.y;
          input.touch.joyX = p.x;
          input.touch.joyY = p.y;
        }
      } else {
        attackIds.add(t.identifier);
      }
    }
    recompute();
  }

  function onTouchMove(e) {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.identifier !== joyId) continue;
      const p = toGame(t);
      let vx = p.x - input.touch.joyBaseX;
      let vy = p.y - input.touch.joyBaseY;
      const len = Math.hypot(vx, vy);
      if (len > joyRadius) {
        vx = (vx / len) * joyRadius;
        vy = (vy / len) * joyRadius;
      }
      input.touch.joyX = input.touch.joyBaseX + vx;
      input.touch.joyY = input.touch.joyBaseY + vy;
    }
    recompute();
  }

  function onTouchEnd(e) {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.identifier === joyId) {
        joyId = null;
        input.touch.joyX = input.touch.joyBaseX;
        input.touch.joyY = input.touch.joyBaseY;
      }
      attackIds.delete(t.identifier);
      potionIds.delete(t.identifier);
      secondaryIds.delete(t.identifier);
      hudBoxIds.delete(t.identifier);
      pauseIds.delete(t.identifier);
    }
    recompute();
  }

  // Fokus-Verlust (Alt-Tab, Benachrichtigung): keyup/touchend kommen dann
  // nie an, also alle gehaltenen Eingaben verwerfen.
  function onFocusLost() {
    keys.clear();
    joyId = null;
    attackIds.clear();
    potionIds.clear();
    secondaryIds.clear();
    hudBoxIds.clear();
    pauseIds.clear();
    input.tap = null;
    input.touch.joyX = input.touch.joyBaseX;
    input.touch.joyY = input.touch.joyBaseY;
    recompute();
  }

  // SLICE 5 §0.3 — GESTEN-UNLOCK (2. Parameter, optional).
  //
  // onFirstTouch ist der Rueckruf, mit dem main.js seinen AudioContext im
  // ECHTEN touchstart-Handler freischaltet (WKWebView/iOS verlangt die
  // transiente Aktivierung; aus update()/rAF heraus ist es zu spaet,
  // Landkarte A §4 Risiken). Die Form ist die vom Pruefer GEMESSEN-GRUENE
  // (SLICE5_SPEC_REVIEW P1-m1): EIGENER Listener VOR dem Bestands-Listener,
  // typeof-Pruefung, try/catch. Alle Alt-Aufrufe mit EINEM Argument bleiben
  // unveraendert gueltig (der Parameter ist dann undefined und es wird kein
  // zusaetzlicher Listener registriert) — gemessen an smoke_test.mjs:4333,
  // .tmp/probe_s4_engine.mjs:58, .tmp/dev_a_input.mjs:51.
  function attach(canvasElement, onFirstTouch) {
    canvas = canvasElement;
    const doc = canvas.ownerDocument;
    const win = doc.defaultView;
    win.addEventListener('keydown', onKeyDown);
    win.addEventListener('keyup', onKeyUp);
    win.addEventListener('blur', onFocusLost);
    doc.addEventListener('visibilitychange', () => {
      if (doc.hidden) onFocusLost();
    });
    const opts = { passive: false }; // iOS Safari: Zoom/Rubber-Banding unterbinden
    if (typeof onFirstTouch === 'function') {
      canvas.addEventListener('touchstart', () => { try { onFirstTouch(); } catch { /* inert */ } }, opts);
    }
    canvas.addEventListener('touchstart', onTouchStart, opts);
    canvas.addEventListener('touchmove', onTouchMove, opts);
    canvas.addEventListener('touchend', onTouchEnd, opts);
    canvas.addEventListener('touchcancel', onTouchEnd, opts);
  }

  function postUpdate() {
    input.confirm = false;
    input.tap = null;
  }

  function consumeConfirm() {
    input.confirm = false;
  }

  return input;
}
