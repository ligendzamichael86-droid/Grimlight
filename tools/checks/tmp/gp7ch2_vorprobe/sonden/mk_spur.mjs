// E-A5 WELTKOORDINATEN-SONDE: baut aus vorher/ und nachher/ je eine
// spur_*-Zone mit EINER zusaetzlichen, in beiden Zonen IDENTISCHEN Zeile am
// Ende von update(dt). Sie liest nur (player/enemies x,y,hp,state) und
// schreibt in ein globales Array — kein Zustand des Spiels wird beruehrt.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const HIER = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

const ANKER = `  inventoryHeld = input.inventory; // Pegel für die Öffnen-Flanke merken
  input.postUpdate(); // IMMER als Letztes im Tick
}`;
const SONDE = `  inventoryHeld = input.inventory; // Pegel für die Öffnen-Flanke merken
  input.postUpdate(); // IMMER als Letztes im Tick
  // ===== E-A5 SPUR-SONDE (nur in der Sonden-Zone, NICHT im Patch) =====
  if (globalThis.__SPUR && player) {
    globalThis.__SPUR.push(
      currentMapKey + ' ' + state + ' P ' + player.x.toFixed(6) + ',' + player.y.toFixed(6)
      + ',' + player.hp + ',' + player.state + ',' + (player.invulnTimer || 0).toFixed(6)
      + ' | ' + enemies.map((e) => e.kind + ':' + e.x.toFixed(6) + ',' + e.y.toFixed(6)
        + ',' + e.hp + ',' + e.state + ',' + (e.hurtTimer || 0).toFixed(6)).join(' ')
      + ' | D ' + drops.map((d) => d.kind + ':' + d.x.toFixed(6) + ',' + d.y.toFixed(6)).join(' ')
    );
  }
}`;

for (const zone of ['vorher', 'nachher']) {
  const ziel = path.join(HIER, `spur_${zone}`);
  fs.rmSync(ziel, { recursive: true, force: true });
  execSync(`cp -r ${JSON.stringify(path.join(HIER, zone))} ${JSON.stringify(ziel)}`);
  const p = path.join(ziel, 'game', 'js', 'main.js');
  const s = fs.readFileSync(p, 'utf8');
  if (s.indexOf(ANKER) < 0) throw new Error('Sonden-Anker fehlt in ' + p);
  fs.writeFileSync(p, s.replace(ANKER, SONDE));
  console.log('Sonden-Zone gebaut:', ziel);
}
