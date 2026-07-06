// XP/Level-Progression (SPEC_SLICE_3 §2.1, §3). Reines Daten-Modul,
// Node-importierbar. Plain-JSON-Zustand (S4-Save-tauglich).
//
// HINWEIS OWNERSHIP: Laut Spec §3 ist dieses Modul formal Besitz von
// Builder A. Builder B hat es SPEC-GENAU angelegt, damit player.js und
// enemies.js importierbar und headless testbar sind (ohne diese Datei
// laesst sich keine der Builder-B-Dateien in Node laden). Inhalt ist
// byte-genau die Spec §3 — bei Doppelanlage durch Builder A gewinnt dessen
// Version, sie sollte identisch sein.
//
// Panel-Entscheidung 1: Level = Zaehigkeit. Level geben AUSSCHLIESSLICH
// +2 maxHp je Stufe (plus Herzcontainer +2 je Herz). Die sechs Kampf-Stats
// bleiben item-exklusiv — applyProgress fasst NUR maxHp an.

export const XP_THRESHOLDS = [0, 20, 50, 90, 140];
export const LEVEL_CAP = 5;

// Plain-JSON (kein Verhalten, kein Prototyp) — S4-Save kann es direkt
// serialisieren.
export function createProgress() {
  return { xp: 0, level: 1, hearts: 0 };
}

// xp aufaddieren, danach so oft leveln wie moeglich (bis LEVEL_CAP).
// Rueckgabe: Anzahl der Level-Ups in diesem Aufruf. Am Cap sammelt xp
// weiter (die HUD-Leiste zeigt dann dauerhaft voll).
export function grantXp(prog, amount) {
  prog.xp += amount;
  let ups = 0;
  while (prog.level < LEVEL_CAP && prog.xp >= XP_THRESHOLDS[prog.level]) {
    prog.level += 1;
    ups += 1;
  }
  return ups;
}

// Liefert ein NEUES Stats-Objekt (Eingabe bleibt unveraendert): maxHp
// waechst um (level-1)*2 + hearts*2. Sonst nichts (Entscheidung 1).
export function applyProgress(stats, prog) {
  return {
    ...stats,
    maxHp: stats.maxHp + (prog.level - 1) * 2 + prog.hearts * 2,
  };
}
