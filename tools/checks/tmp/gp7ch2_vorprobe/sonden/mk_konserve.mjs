// E-A5, SCHAERFERE FASSUNG DES WELTKOORDINATEN-BEWEISES.
//
// PROBLEM: .tmp/check_main_slice1.mjs STEUERT sich selbst aus dem GEZEICHNETEN
// Bild (nearestSkeletonRel() liest die drawImage-Namen, clearArea() und der
// Todeslauf waehlen daraus ihre Tastendruecke). Faellt der Blink weg, sieht das
// Drehbuch in genau den Frames ein Skelett, in denen es vorher keins sah — und
// druckt andere Tasten. Ein direkter Vor-/Nachher-Vergleich misst dann die
// STEUERUNG mit, nicht die Engine (Review Linse 1 B4, dieselbe Ursache).
//
// LOESUNG: KONSERVE. Lauf 1 zeichnet in der VORHER-Zone die Tastenfolge je
// Frame auf. Lauf 2 spielt GENAU DIESE Folge in beiden Zonen ab — identische
// Eingabe per Konstruktion. Jede verbleibende Differenz der Weltkoordinaten
// waere dann eine echte Dynamik-Aenderung.
import fs from 'node:fs';
import path from 'node:path';

const HIER = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const RIG = 'check_main_slice1';

// --- 1) Aufnahme-Fassung des Drehbuchs (nur in spur_vorher) ---------------
for (const zone of ['spur_vorher', 'spur_nachher']) {
  const p = path.join(HIER, zone, '.tmp', `${RIG}.mjs`);
  let s = fs.readFileSync(p, 'utf8');
  s = s.replace(`function frame() {\n  ops.length = 0;`, `globalThis.__KEYREC = [];\nlet __fnr = 0;
function frame() {
  __fnr += 1;
  ops.length = 0;`);
  s = s.replace(`function key(type, code) {
  for (const f of winListeners[type] || []) f({ code, repeat: false, preventDefault() {} });
}`, `function key(type, code) {
  globalThis.__KEYREC.push([__fnr, type, code]);
  for (const f of winListeners[type] || []) f({ code, repeat: false, preventDefault() {} });
}`);
  s += `
import { writeFileSync as __w } from 'node:fs';
__w(process.env.KONSERVE_OUT, JSON.stringify({ frames: __fnr, events: globalThis.__KEYREC }));
`;
  fs.writeFileSync(path.join(HIER, zone, '.tmp', `rec_${RIG}.mjs`), s);
}

// --- 2) Abspiel-Fassung: Stub + main.js-Import WOERTLICH aus dem Drehbuch --
for (const zone of ['spur_vorher', 'spur_nachher']) {
  const p = path.join(HIER, zone, '.tmp', `${RIG}.mjs`);
  const s = fs.readFileSync(p, 'utf8');
  const ende = s.indexOf('function hold(code, n)');
  if (ende < 0) throw new Error('Kopf-Ende nicht gefunden');
  const kopf = s.slice(0, ende); // Stub + main.js-Import + frame/frames/key
  const abspiel = `
// ===== KONSERVEN-ABSPIELER (E-A5) =====
const plan = JSON.parse(require_fs.readFileSync(process.env.KONSERVE_IN, 'utf8'));
const proFrame = new Map();
for (const [f, typ, code] of plan.events) {
  if (!proFrame.has(f)) proFrame.set(f, []);
  proFrame.get(f).push([typ, code]);
}
// Die Aufnahme zaehlt den Frame, in dem der Druck SPAETER faellt, als __fnr
// zum Zeitpunkt des Drucks: die Ereignisse eines Eintrags f werden also
// NACH Frame f-1 und VOR Frame f ausgeloest — exakt wie im Original, wo
// key() zwischen zwei frame()-Aufrufen steht.
for (let i = 1; i <= plan.frames; i++) {
  for (const [typ, code] of proFrame.get(i - 1) || []) key(typ, code);
  frame();
}
for (const [typ, code] of proFrame.get(plan.frames) || []) key(typ, code);
console.error('KONSERVE abgespielt: ' + plan.frames + ' Frames, ' + plan.events.length + ' Tastenereignisse');
`;
  fs.writeFileSync(
    path.join(HIER, zone, '.tmp', `play_${RIG}.mjs`),
    `import require_fs from 'node:fs';\n${kopf}${abspiel}`
  );
}
console.log('Konserven-Fassungen gebaut.');
