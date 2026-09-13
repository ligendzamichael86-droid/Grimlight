// E-A5 STATISCHES GATE (Muster smoke:5294-5300).
// (1) Zuweisungszahl an die Dynamik-Felder je Datei, VORHER gegen NACHHER.
// (2) Der neue Flash-/Decal-Code enthaelt KEINE solche Zuweisung.
import fs from 'node:fs';
import path from 'node:path';

const HIER = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const FELDER = ['hurtTimer', 'invulnTimer', 'dieTimer', 'hitstop', 'dieTime', 'DIE_TIME',
  'stunTimer', 'attackCooldown', 'knockTimer', 'downTimer', 'blockFlash'];
const ohneKommentar = (s) => s.replace(/^[ \t]*\/\/.*$/gm, '').replace(/[ \t]+\/\/.*$/gm, '');
// Zuweisung = Feldname, danach optional Leerzeichen, dann = / += / -= / *= (aber kein ==, ===, <=, >=, !=)
const zaehle = (src, feld) => {
  const re = new RegExp(`\\b${feld}\\s*(?:\\+=|-=|\\*=|/=|=(?!=))`, 'g');
  return (src.match(re) || []).length;
};

const DATEIEN = ['entities/enemies.js', 'entities/boss.js', 'entities/player.js',
  'entities/projectiles.js', 'entities/props.js', 'main.js'];

console.log('== (1) ZUWEISUNGEN AN DYNAMIK-FELDER: VORHER vs NACHHER ==');
let abweichung = 0;
for (const f of DATEIEN) {
  const v = ohneKommentar(fs.readFileSync(path.join(HIER, 'vorher/game/js', f), 'utf8'));
  const n = ohneKommentar(fs.readFileSync(path.join(HIER, 'nachher/game/js', f), 'utf8'));
  const teile = [];
  for (const feld of FELDER) {
    const a = zaehle(v, feld);
    const b = zaehle(n, feld);
    if (a || b) teile.push(`${feld} ${a}->${b}${a === b ? '' : '  ABWEICHUNG'}`);
    if (a !== b) abweichung += 1;
  }
  console.log(`  ${f.padEnd(26)} ${teile.join(' | ') || '(keine)'}`);
}
console.log(`  ERGEBNIS: ${abweichung === 0 ? 'ALLE ZAHLEN GLEICH' : abweichung + ' ABWEICHUNGEN'}`);

console.log('\n== (2) DER NEUE CODE SCHREIBT KEINEN DYNAMIK-TIMER ==');
const vM = ohneKommentar(fs.readFileSync(path.join(HIER, 'vorher/game/js/main.js'), 'utf8'));
const nM = ohneKommentar(fs.readFileSync(path.join(HIER, 'nachher/game/js/main.js'), 'utf8'));
// Alle Zeilen, die NACHHER neu sind (grobe, aber vollstaendige Naeherung:
// Zeilen des Nachher-Standes, die im Vorher-Stand nicht vorkommen).
const vorZeilen = new Set(vM.split('\n').map((z) => z.trim()));
const neu = nM.split('\n').filter((z) => z.trim() && !vorZeilen.has(z.trim()));
console.log(`  neue/geaenderte Quelltextzeilen in main.js: ${neu.length}`);
const block = neu.join('\n');
let treffer = [];
for (const feld of FELDER) {
  const c = zaehle(block, feld);
  if (c > 0) treffer.push(`${feld} x${c}`);
}
console.log(`  Zuweisungen darin: ${treffer.length ? treffer.join(', ') + '  <-- ROT' : 'KEINE  <-- GRUEN'}`);
// Gegenprobe des Zaehlers (Positivkontrolle): eine kuenstliche Zeile MUSS zaehlen.
console.log(`  Positivkontrolle des Zaehlers (kuenstliche Zeile "e.hurtTimer = 0;"): `
  + `${zaehle('e.hurtTimer = 0;', 'hurtTimer')} Treffer (muss 1 sein)`);
console.log(`  Negativkontrolle (Vergleich "if (e.hurtTimer === 0)"): `
  + `${zaehle('if (e.hurtTimer === 0)', 'hurtTimer')} Treffer (muss 0 sein)`);

console.log('\n== (3) LESEZUGRIFFE DES NEUEN CODES (zur Einordnung) ==');
for (const feld of ['hurtTimer', 'invulnTimer', 'hp', 'state']) {
  console.log(`  ${feld}: ${(block.match(new RegExp(`\\b${feld}\\b`, 'g')) || []).length} Vorkommen (nur lesend, s. (2))`);
}

console.log('\n== (4) BYTE-DIFF DER ENTITIES-DATEIEN ==');
for (const f of ['entities/enemies.js', 'entities/boss.js', 'entities/player.js']) {
  const v = fs.readFileSync(path.join(HIER, 'vorher/game/js', f), 'utf8').split('\n');
  const n = fs.readFileSync(path.join(HIER, 'nachher/game/js', f), 'utf8').split('\n');
  const weg = v.filter((z) => !n.includes(z) || v.filter((y) => y === z).length > n.filter((y) => y === z).length);
  console.log(`  ${f}: ${v.length} -> ${n.length} Zeilen (${v.length - n.length} entfernt, 0 hinzugefuegt)`);
}
