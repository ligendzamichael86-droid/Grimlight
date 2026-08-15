// SONG-REGISTER (SPEC_SLICE_5 §2.3) — REINES Datenmodul, nur Weiterreichung.
// Ein Ort, an dem der Song-Schluessel steht, den mapDef.music nennt (§4.1).
//
// Karten-Zuordnung, wie die Landkarte sie vorgibt (world/*.js setzt sie
// additiv als mapDef.music — DORT liegt die Wahrheit, hier steht nur, welche
// Schluessel es ueberhaupt gibt):
//   GRAVEYARD     -> 'graveyard'
//   CATACOMBS     -> 'catacombs'
//   FLUESTERGRUFT -> 'fluestergruft'
//   BOSS_KAMMER   -> 'boss_idle'  (+ 'boss_aggro' als zweite Ebene, §4.4)
//   DORF          -> 'dorf'       (SLICE 6 §0.9)
//   Bildschirme   -> 'title', 'victory', 'gameover'

import { SONG_TITLE } from './song_title.js';
import { SONG_GRAVEYARD } from './song_graveyard.js';
import { SONG_CATACOMBS } from './song_catacombs.js';
import { SONG_FLUESTERGRUFT } from './song_fluestergruft.js';
import { SONG_DORF } from './song_dorf.js';
import { SONG_BOSS_IDLE, SONG_BOSS_AGGRO } from './song_boss.js';
import { SONG_VICTORY, SONG_GAMEOVER } from './song_stinger.js';

export const SONGS = {
  title: SONG_TITLE,
  graveyard: SONG_GRAVEYARD,
  catacombs: SONG_CATACOMBS,
  fluestergruft: SONG_FLUESTERGRUFT,
  dorf: SONG_DORF,          // SLICE 6 §0.9 (STUB, Komposition iteriert danach)
  boss_idle: SONG_BOSS_IDLE,
  boss_aggro: SONG_BOSS_AGGRO,
  victory: SONG_VICTORY,
  gameover: SONG_GAMEOVER,
};

/** Song holen. WIRFT bei unbekanntem Schluessel (kein stilles Schweigen). */
export function songFuer(key) {
  const s = SONGS[key];
  if (!s) throw new Error(`songs: unbekannter Song-Schluessel "${key}"`);
  return s;
}

export {
  SONG_TITLE, SONG_GRAVEYARD, SONG_CATACOMBS, SONG_FLUESTERGRUFT, SONG_DORF,
  SONG_BOSS_IDLE, SONG_BOSS_AGGRO, SONG_VICTORY, SONG_GAMEOVER,
};
