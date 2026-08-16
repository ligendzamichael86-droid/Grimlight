// FASSADE — GP7-CH-1 P0.a (Spec E10 / Landkarte V2 / Review m10).
// Die Pixel-Grids liegen seit dem Split in zwei reinen Daten-Modulen:
//   art/sprites_figuren.js -> SPRITES  (Figuren-Grids, 91 Keys)
//   art/sprites_tiles.js   -> TILE_ART (Kachel-Grids, 340 Keys)
// Diese Datei importiert beide und re-exportiert sie UNVERAENDERT. Damit bleibt
// jeder bestehende Import im Repo gueltig, wortwoertlich:
//   import { SPRITES, TILE_ART } from './art/sprites.js';   (main.js:4,
//   tools/smoke_test.mjs:8, tools/check_save_slice4.mjs:38 und ~20 .tmp-Checks).
// Die SCHLUESSEL-REIHENFOLGE beider Objekte ist byte-stabil: die beiden
// Objektliterale wurden zeilenweise unveraendert verschoben, sha256 ueber
// Object.keys(SPRITES).join(',') bzw. Object.keys(TILE_ART).join(',') ist vor
// und nach dem Split identisch (Beweis im P0.a-Report).
//
// Format unveraendert: jedes Zeichen = PALETTE-Key, '.' = transparent. Die
// Massangaben und Zeichenkonventionen stehen jetzt in den Koepfen der beiden
// Daten-Module.
//
// NEUE KEYS kommen in das jeweilige Daten-Modul (ans ENDE des Objekts), nicht
// hierher. Diese Fassade bleibt code- und datenfrei.

import { SPRITES } from './sprites_figuren.js';
import { TILE_ART } from './sprites_tiles.js';

export { SPRITES, TILE_ART };
