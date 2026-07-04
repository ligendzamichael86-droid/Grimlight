// Fixed-Timestep-Loop: Update konstant mit 60 Hz über Akkumulator,
// Render pro Animationsframe. raf/now sind injizierbar (Tests in Node).

const STEP = 1 / 60;
const MAX_UPDATES = 5;   // gegen Spiral of Death
const MAX_DELTA = 0.25;  // Frame-Delta-Clamp (Tab-Wechsel, Debugger)

export function createLoop({ update, render, raf, now }) {
  let running = false;
  let last = null;
  let acc = 0;

  function start() {
    if (running) return;
    running = true;
    last = null;
    acc = 0;
    // Defaults lazy auflösen und an window binden (Node-Importierbarkeit,
    // 'Illegal invocation' bei unbound requestAnimationFrame).
    const rafFn = raf || ((cb) => window.requestAnimationFrame(cb));
    const nowFn = now || (() => performance.now());

    const frame = () => {
      if (!running) return;
      const t = nowFn();
      if (last === null) last = t; // erster Frame: Delta 0
      let delta = (t - last) / 1000;
      last = t;
      if (delta > MAX_DELTA) delta = MAX_DELTA;
      acc += delta;
      let n = 0;
      while (acc >= STEP && n < MAX_UPDATES) {
        update(STEP);
        acc -= STEP;
        n++;
      }
      if (n === MAX_UPDATES) acc = 0; // Rest verwerfen, kein Nachspulen
      render();
      rafFn(frame);
    };
    rafFn(frame);
  }

  function stop() {
    running = false;
  }

  return { start, stop };
}
