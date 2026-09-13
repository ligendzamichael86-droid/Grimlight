// Baut in beiden Sonden-Zonen einen Messlauf, der die KONSERVE abspielt und
// dabei je Frame protokolliert:
//   - Weltzustand (aus der __SPUR-Zeile: hurtTimer/invulnTimer/state je Entity)
//   - gezeichnete ORIGINAL-Sprites (Spieler / Gegner / *_decal)
// Daraus fallen: Silhouetten-Verlust-Frames (E-A5), Leichen-Blitz-Sonde,
// Decal-Positivkontrolle.
import fs from 'node:fs';
import path from 'node:path';

const HIER = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const RIG = 'check_main_slice1';

const MESS = `
// ===== SIGNAL-CANVASES (Flash + kalte Unverwundbarkeit) IDENTIFIZIEREN =====
// Boot-Reihenfolge: SPRITES -> 37 Flips -> TILE_ART -> (neu) Signal-Canvases.
// Alles JENSEITS dieser Grenze im BOOT-Stand ist eine Signal-Maske; in der
// VORHER-Zone ist die Menge leer (Negativkontrolle).
const SIGNAL_GRENZE = Object.keys(SPRITES).length + 37 + Object.keys(TILE_ART).length;
const signalSet = new Set(createdCanvases.slice(SIGNAL_GRENZE));
console.error('SIGNAL-CANVASES im Boot: ' + signalSet.size + ' (Grenze ' + SIGNAL_GRENZE + ', Boot ' + createdCanvases.length + ')');

// ===== MESSLAUF (E-A5 Silhouetten-Verlust + Leichen-Sonde) =====
globalThis.__SPUR = [];
const plan = JSON.parse(require_fs.readFileSync(process.env.KONSERVE_IN, 'utf8'));
const proFrame = new Map();
for (const [f, typ, code] of plan.events) {
  if (!proFrame.has(f)) proFrame.set(f, []);
  proFrame.get(f).push([typ, code]);
}
const GEGNER_RE = /^(skeleton|ghoul|hound|rust|warden)_(?!decal)/;
const DECAL_RE = /_decal$/;
const zeilen = [];
let spurVor = 0;
for (let i = 1; i <= plan.frames; i++) {
  for (const [typ, code] of proFrame.get(i - 1) || []) key(typ, code);
  frame();
  const neue = globalThis.__SPUR.slice(spurVor);
  spurVor = globalThis.__SPUR.length;
  const d = ops.filter((o) => o.op === 'drawImage' && o.canvas === mainCanvas);
  const namen = d.map((o) => String(nameOf.get(o.img) || ''));
  zeilen.push(JSON.stringify({
    f: i,
    tick: neue[neue.length - 1] || null,
    spieler: namen.filter((nm) => nm.startsWith('player_')).length,
    gegner: namen.filter((nm) => GEGNER_RE.test(nm)).length,
    gegnerNamen: namen.filter((nm) => GEGNER_RE.test(nm)),
    decal: namen.filter((nm) => DECAL_RE.test(nm)),
    signal: d.filter((o) => signalSet.has(o.img)).map((o) => Number(o.alpha.toFixed(4))),
    // Voller Zeichen-Stapel EINES Frames mit Signal (Reihenfolge-Beweis E-A2).
    stapel: d.filter((o) => signalSet.has(o.img)).length ? d.map((o) => {
      const idx = createdCanvases.indexOf(o.img);
      const art = signalSet.has(o.img) ? 'SIGNAL' : (idx >= SIGNAL_GRENZE ? 'TINTMASKE' : 'ORIGINAL');
      return art + ':' + (art === 'ORIGINAL' ? String(nameOf.get(o.img) || ('idx' + idx)) : (o.img.width + 'x' + o.img.height))
        + '@' + Number(o.alpha.toFixed(4)) + '[' + o.args.join(',') + ']';
    }) : undefined,
    // Zuordnung Signal-Draw -> Traeger: der letzte Draw davor, der ein
    // BENANNTES Boot-Canvas ist (das Original der Fassade, Waechter B).
    signalUeber: d.map((o, i) => (signalSet.has(o.img) ? (() => {
      for (let j = i - 1; j >= 0; j--) {
        const idx = createdCanvases.indexOf(d[j].img);
        if (idx >= 0 && idx < SIGNAL_GRENZE) return String(nameOf.get(d[j].img) || ('idx' + idx));
      }
      return '?';
    })() : null)).filter(Boolean),
  }));
}
require_fs.writeFileSync(process.env.MESS_OUT, zeilen.join('\\n'));
console.error('MESSLAUF fertig: ' + zeilen.length + ' Frames -> ' + process.env.MESS_OUT);
`;

for (const zone of ['spur_vorher', 'spur_nachher']) {
  const p = path.join(HIER, zone, '.tmp', `${RIG}.mjs`);
  let s = fs.readFileSync(p, 'utf8');
  // Sonden-Stub: drawImage protokolliert zusaetzlich globalAlpha.
  s = s.replace("drawImage(img, ...a) { ops.push({ canvas, op: 'drawImage', img, args: a }); },",
    "drawImage(img, ...a) { ops.push({ canvas, op: 'drawImage', img, args: a, alpha: this.globalAlpha }); },");
  const ende = s.indexOf('function hold(code, n)');
  fs.writeFileSync(
    path.join(HIER, zone, '.tmp', `mess_${RIG}.mjs`),
    `import require_fs from 'node:fs';\n${s.slice(0, ende)}${MESS}`
  );
}
console.log('Messlauf-Fassungen gebaut.');
