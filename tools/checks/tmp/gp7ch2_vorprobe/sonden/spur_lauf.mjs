// Faehrt EIN Flusstest-Drehbuch in der aktuellen Zone und schreibt die
// Weltkoordinaten-Spur (je Tick eine Zeile) nach ../out/.
// Aufruf:  node ../sonden/spur_lauf.mjs <rig-name> <ausgabedatei>
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

globalThis.__SPUR = [];
const rig = process.argv[2];   // ABSOLUTER Pfad des Drehbuchs
const ziel = process.argv[3];
let fehler = '';
try {
  await import(pathToFileURL(rig).href);
} catch (e) {
  fehler = `ABBRUCH: ${e && e.message}`;
}
fs.writeFileSync(ziel, `${globalThis.__SPUR.join('\n')}\n${fehler}`);
console.error(`SPUR ${rig}: ${globalThis.__SPUR.length} Ticks -> ${ziel} ${fehler}`);
