// CHIPTUNE-KERN (SPEC_SLICE_5 Rev 2 §2.1). REINES Rechenmodul, Node-importierbar:
// KEIN window, KEIN document, KEIN AudioContext, KEIN Math.random, KEIN Date.now.
// Vorbild: game/js/items/save.js ("Den Storage fasst AUSSCHLIESSLICH main.js an") —
// hier gilt dasselbe fuer WebAudio: dieses Modul RECHNET nur, main.js SPIELT ab.
//
// Die API ist als Phase-1-Schnittstelle EINGEFROREN (Spec §2/§8, P2-M11):
//   notenFreq(name)                      -> Hz            (WIRFT bei Unfug)
//   compileSong(song)                    -> {events, loopFrom, loopTime}
//   renderPCM({instruments, events}, hz) -> Float32Array  (Test-Orakel, ROH)
//   pcmPeak(pcm) / pcmSumme(pcm)         -> Zahl / Hexstring
// Additiv (kostenlos fuer die ENGINE, nicht Teil des Pflichtvertrags):
//   songBundle(song), maxGleichzeitig(events), pruefeSong(song), MAX_KANAELE.
//
// ------------------------------------------------------------------ EREIGNIS
// Ein Ereignis ist das, was BEIDE Backends verstehen muessen (WebAudio in
// main.js und renderPCM hier):
//   { t, dauer, ch, freq, instr, vol, fx, slideTo }
//   t       Startzeit in Sekunden ab Songanfang (bzw. ab SFX-Anfang)
//   dauer   Laenge in Sekunden, Huellkurve INKLUSIVE (Release liegt drin)
//   ch      Kanalindex; je Kanal klingt IMMER hoechstens EIN Ton (Monophonie)
//   freq    Hz zu Beginn des Tons
//   instr   Schluessel in `instruments`
//   vol     lineare Amplitude 0..1 (aus instruments[instr].vol)
//   fx      Effektbuchstaben, Reihenfolge wie in der Zelle: 'v' | 'a' | 's'
//   slideTo Zielfrequenz in Hz oder null (nur wenn fx 's' enthaelt)
//
// -------------------------------------------------------------- FX-SEMANTIK
// (bindend fuer beide Backends, sonst klingen Orakel und Spiel verschieden)
//   v  Vibrato: f *= 1 + 0,006 * sin(2*pi*6*tRel)            (6 Hz, +-0,6 %)
//   a  Arpeggio: alle 1/32 s eine Stufe aus instrument.arp    (Standard 0-3-7,
//      also MOLL — Grimlight steht in d-Moll; Stufe = Halbtoene)
//   s  Slide: LINEAR in Hz von freq nach slideTo ueber die volle Notendauer
//      (WebAudio: frequency.linearRampToValueAtTime(slideTo, t0 + dauer))
//      Ziel steht IM FX-Feld der Zelle: "C-4:lead:4:sE-4" (Spec §2.1, P2-M2).
//   Kombination erlaubt: "va", "vsE-4" usw.
//
// --------------------------------------------------------------- SONGFORMAT
// (Landkarte A §3, "Musik als Code" — gepflegt wie game/js/art/*.js)
//   { name, bpm, rowsPerBeat, loopFrom, einmalig?, instruments, patterns, order }
//   loopFrom  GLOBALER REIHENINDEX (Reihen ueber die ganze order gezaehlt),
//             auf den der Sequencer zurueckspringt. 0 = Loop von vorn.
//   einmalig  true bei Stingern: NICHT loopen (compileSong liefert trotzdem
//             loopFrom/loopTime, damit der Vertrag einheitlich bleibt).
//   Zelle     "NOTE:INSTRUMENT:LAENGE_IN_REIHEN:FX", '...' = leer.
//   Instrument { art:'pulse'|'tri'|'noise'|'sine', duty, vol,
//                attack, decay, sustain, release, arp }
//
// ACHTUNG, EINZIGE STOLPERSTELLE DER API: song.loopFrom ist eine REIHE,
// compileSong(...).loopFrom ist eine SEKUNDE. Es gilt immer
//   loopFrom + loopTime === Gesamtdauer des Songs.
// Der Sequencer laeuft also: Musikuhr >= loopFrom + loopTime  =>  -= loopTime.

// --- Notennamen -------------------------------------------------------------
// Englische Buchstaben; deutsches H wird als Alias fuer B akzeptiert (P2-m2).
// In den Songdaten steht b-Moll-Material konsequent als A# — dadurch kann die
// H/B-Falle in den Noten gar nicht erst auftreten.
const HALBTON = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2, H: 2 };
const NOTE_RE = /^([A-H])([#b-])([0-8])$/;

/** Notenname -> Frequenz in Hz. WIRFT bei unbekannter Note (Spec A1(e)). */
export function notenFreq(name) {
  if (typeof name !== 'string') {
    throw new Error(`notenFreq: Notenname muss ein String sein (war ${typeof name})`);
  }
  const m = NOTE_RE.exec(name);
  if (!m) {
    throw new Error(
      `notenFreq: unbekannte Note "${name}" — erlaubt ist genau 3 Zeichen: `
      + 'Buchstabe A-H, dann # (Kreuz), b (Be) oder - (nichts), dann Oktave 0-8');
  }
  const n = HALBTON[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (Number(m[3]) - 4) * 12;
  return 440 * Math.pow(2, n / 12);
}

export const MAX_KANAELE = 4;          // SNES/NES-Disziplin, Spec A1(c)
const LEER = '...';
const ARTEN = ['pulse', 'tri', 'noise', 'sine'];

// --- Song-Pruefung (wirft frueh und laut; 6 handgeschriebene Songs) ---------
/** Wirft bei jedem Datenfehler im Song. Reine Pruefung, kein Rueckgabewert. */
export function pruefeSong(song) {
  const w = (t) => { throw new Error(`pruefeSong(${song && song.name ? song.name : '?'}): ${t}`); };
  if (!song || typeof song !== 'object') w('song ist kein Objekt');
  if (!Number.isFinite(song.bpm) || song.bpm <= 0) w(`bpm ungueltig (${song.bpm})`);
  if (!Number.isInteger(song.rowsPerBeat) || song.rowsPerBeat <= 0) w(`rowsPerBeat ungueltig (${song.rowsPerBeat})`);
  if (!song.instruments || typeof song.instruments !== 'object') w('instruments fehlt');
  if (!song.patterns || typeof song.patterns !== 'object') w('patterns fehlt');
  if (!Array.isArray(song.order) || song.order.length === 0) w('order fehlt oder ist leer');

  for (const [k, inst] of Object.entries(song.instruments)) {
    if (!inst || typeof inst !== 'object') w(`Instrument "${k}" ist kein Objekt`);
    if (inst.art !== undefined && !ARTEN.includes(inst.art)) w(`Instrument "${k}": unbekannte art "${inst.art}"`);
    if (!Number.isFinite(inst.vol ?? 0.2)) w(`Instrument "${k}": vol ungueltig`);
  }

  let kanaele = null;
  let reihenGesamt = 0;
  for (const patName of song.order) {
    const pat = song.patterns[patName];
    if (!Array.isArray(pat)) w(`order nennt Pattern "${patName}", das es nicht gibt`);
    if (pat.length === 0) w(`Pattern "${patName}" hat keine Kanaele`);
    if (pat.length > MAX_KANAELE) w(`Pattern "${patName}" hat ${pat.length} Kanaele (erlaubt: ${MAX_KANAELE})`);
    if (kanaele === null) kanaele = pat.length;
    else if (pat.length !== kanaele) w(`Pattern "${patName}" hat ${pat.length} Kanaele, der Song ${kanaele}`);
    const laenge = pat[0].length;
    if (!Number.isInteger(laenge) || laenge <= 0) w(`Pattern "${patName}" hat keine Reihen`);
    for (let ch = 0; ch < pat.length; ch++) {
      if (!Array.isArray(pat[ch])) w(`Pattern "${patName}" Kanal ${ch} ist kein Array`);
      if (pat[ch].length !== laenge) {
        w(`Pattern "${patName}" Kanal ${ch}: ${pat[ch].length} Reihen statt ${laenge} (ragged pattern)`);
      }
    }
    reihenGesamt += laenge;
  }
  const lf = song.loopFrom ?? 0;
  if (!Number.isInteger(lf) || lf < 0 || lf >= reihenGesamt) {
    w(`loopFrom ${lf} liegt nicht in 0..${reihenGesamt - 1}`);
  }
}

// --- FX-Feld -> {fx, slideTo} ----------------------------------------------
function parseFx(roh, zelle) {
  let fx = '';
  let slideTo = null;
  const s = roh || '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === 'v' || c === 'a') {
      if (!fx.includes(c)) fx += c;
      continue;
    }
    if (c === 's') {
      slideTo = notenFreq(s.slice(i + 1, i + 4));   // wirft bei fehlendem/kaputtem Ziel
      if (!fx.includes('s')) fx += 's';
      i += 3;
      continue;
    }
    throw new Error(`compileSong: unbekannter FX "${c}" in Zelle "${zelle}" (erlaubt: v, a, s<NOTE>)`);
  }
  return { fx, slideTo };
}

// --- Song -> flache Ereignisliste (REIN, deterministisch) -------------------
/**
 * @returns {{events: Array, loopFrom: number, loopTime: number}}
 *   loopFrom = Sekunde des Rueckspruchpunkts, loopTime = Laenge EINES Durchlaufs.
 *   loopFrom + loopTime === Gesamtdauer.
 */
export function compileSong(song) {
  pruefeSong(song);
  const sekProReihe = 60 / song.bpm / song.rowsPerBeat;
  const ev = [];
  let reiheGlobal = 0;

  for (const patName of song.order) {
    const pat = song.patterns[patName];
    const laenge = pat[0].length;
    for (let r = 0; r < laenge; r++) {
      for (let ch = 0; ch < pat.length; ch++) {
        const zelle = pat[ch][r];
        if (!zelle || zelle === LEER) continue;
        const teile = String(zelle).split(':');
        if (teile.length < 3 || teile.length > 4) {
          throw new Error(`compileSong: Zelle "${zelle}" hat ${teile.length} Felder (erwartet 3 oder 4)`);
        }
        const [note, instr, len, fxRoh] = teile;
        const inst = song.instruments[instr];
        if (!inst) throw new Error(`compileSong: Zelle "${zelle}" nennt unbekanntes Instrument "${instr}"`);
        const reihen = Number(len);
        if (!Number.isInteger(reihen) || reihen < 1) {
          throw new Error(`compileSong: Zelle "${zelle}" hat ungueltige Laenge "${len}"`);
        }
        const { fx, slideTo } = parseFx(fxRoh, zelle);
        ev.push({
          t: (reiheGlobal + r) * sekProReihe,
          dauer: reihen * sekProReihe,
          ch,
          freq: notenFreq(note),
          instr,
          vol: inst.vol ?? 0.2,
          fx,
          slideTo,
        });
      }
    }
    reiheGlobal += laenge;
  }

  const gesamt = reiheGlobal * sekProReihe;

  // Monophonie je Kanal (P2-m3): eine zu lange Note wird beim naechsten
  // Anschlag desselben Kanals abgeschnitten (Tracker-Standard). Damit ist die
  // Obergrenze "gleichzeitige Musikstimmen = Kanalzahl" strukturell garantiert
  // und kein Doppelpegel kann das Peak-Gate aushebeln.
  const proKanal = new Map();
  for (const e of ev) {
    if (!proKanal.has(e.ch)) proKanal.set(e.ch, []);
    proKanal.get(e.ch).push(e);
  }
  for (const liste of proKanal.values()) {
    liste.sort((a, b) => a.t - b.t);
    for (let i = 0; i < liste.length - 1; i++) {
      const platz = liste[i + 1].t - liste[i].t;
      if (liste[i].dauer > platz) liste[i].dauer = platz;
    }
  }
  // Ueberhang ueber das Songende kappen — sonst klickt die Loop-Naht (P2-B5).
  for (const e of ev) if (e.t + e.dauer > gesamt) e.dauer = gesamt - e.t;

  const events = ev.filter((e) => e.dauer > 0);
  events.sort((a, b) => a.t - b.t || a.ch - b.ch);

  const loopFrom = (song.loopFrom ?? 0) * sekProReihe;
  return { events, loopFrom, loopTime: gesamt - loopFrom };
}

/** Bequemlichkeit fuer Adapter und Tests: Song -> alles, was renderPCM braucht. */
export function songBundle(song) {
  const { events, loopFrom, loopTime } = compileSong(song);
  return { instruments: song.instruments, events, loopFrom, loopTime };
}

/** Groesste Zahl gleichzeitig klingender Ereignisse (Spec A1(c)-Vorarbeit). */
export function maxGleichzeitig(events) {
  const kanten = [];
  for (const e of events) {
    kanten.push({ t: e.t, d: 1 });
    kanten.push({ t: e.t + e.dauer, d: -1 });
  }
  // Enden vor Anfaengen bei gleicher Zeit: nahtlose Nachbarn zaehlen nicht doppelt.
  kanten.sort((a, b) => a.t - b.t || a.d - b.d);
  let n = 0;
  let max = 0;
  for (const k of kanten) {
    n += k.d;
    if (n > max) max = n;
  }
  return max;
}

// --- Reiner PCM-Renderer (Test-Orakel, Option b) ----------------------------
// Deterministisch: fester LFSR-Keim, keine Zeit-/Zufallsquelle, Phase wird
// aufsummiert (nicht aus dem absoluten Sampleindex gerechnet) — nur so bleiben
// Vibrato/Arpeggio/Slide phasenrichtig und decken sich mit einem WebAudio-
// Oszillator.
const LFSR_KEIM = 0xC0FFEE;
const ARP_STANDARD = [0, 3, 7];        // Moll — Grimlight steht in d-Moll
const ARP_RATE = 32;                   // Stufen je Sekunde
const VIB_HZ = 6;
const VIB_TIEFE = 0.006;

function lfsr(seed) {
  let s = seed >>> 0 || 0xACE1;
  return () => {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
    return (s / 0xFFFFFFFF) * 2 - 1;
  };
}

/**
 * Rendert Songs UND SFX ueber dieselbe Signatur (P1-M9/P2-B1).
 * KEIN tanh, KEIN Limiter, KEINE Normalisierung: der Messpfad muss das
 * Clipping ZEIGEN, gegen das das Gate existiert.
 * @returns {Float32Array} rohes Mono-PCM
 */
export function renderPCM(bundle, sampleRate = 22050) {
  if (!bundle || typeof bundle !== 'object') throw new Error('renderPCM: bundle fehlt');
  const { instruments, events } = bundle;
  if (!instruments || typeof instruments !== 'object') throw new Error('renderPCM: instruments fehlt');
  if (!Array.isArray(events)) throw new Error('renderPCM: events ist kein Array');
  if (!Number.isFinite(sampleRate) || sampleRate <= 0) throw new Error(`renderPCM: sampleRate ungueltig (${sampleRate})`);

  let ende = 0;
  for (const e of events) ende = Math.max(ende, e.t + e.dauer);
  const n = Math.max(0, Math.ceil(ende * sampleRate));
  const out = new Float32Array(n);
  const rnd = lfsr(LFSR_KEIM);

  for (const e of events) {
    const inst = instruments[e.instr];
    if (!inst) throw new Error(`renderPCM: unbekanntes Instrument "${e.instr}"`);
    const art = inst.art || 'pulse';
    const duty = inst.duty ?? 0.5;
    const arp = inst.arp || ARP_STANDARD;
    const start = Math.round(e.t * sampleRate);
    const laenge = Math.round(e.dauer * sampleRate);
    if (laenge <= 0) continue;

    const nA = Math.max(1, Math.round((inst.attack ?? 0.005) * sampleRate));
    const nD = Math.max(0, Math.round((inst.decay ?? 0) * sampleRate));
    const nR = Math.max(1, Math.round((inst.release ?? 0.05) * sampleRate));
    const sus = inst.sustain ?? 1;
    const fx = e.fx || '';
    const hatSlide = e.slideTo !== null && e.slideTo !== undefined;
    const hatVib = fx.includes('v');
    const hatArp = fx.includes('a');

    let phase = 0;
    let halt = 0;
    let haltWert = 0;

    for (let i = 0; i < laenge; i++) {
      const p = start + i;
      if (p >= n) break;
      const tRel = i / sampleRate;

      // Huellkurve: Attack -> Decay auf Sustain -> Release (multiplikativ)
      let env;
      if (i < nA) env = i / nA;
      else if (nD > 0) env = 1 + (sus - 1) * Math.min(1, (i - nA) / nD);
      else env = 1;
      const rest = laenge - i;
      if (rest < nR) env *= rest / nR;

      // Frequenz: Slide (linear in Hz) -> Vibrato -> Arpeggio
      let f = hatSlide ? e.freq + (e.slideTo - e.freq) * (i / laenge) : e.freq;
      if (hatVib) f *= 1 + VIB_TIEFE * Math.sin(2 * Math.PI * VIB_HZ * tRel);
      if (hatArp) f *= Math.pow(2, arp[Math.floor(tRel * ARP_RATE) % arp.length] / 12);

      let s;
      if (art === 'noise') {
        // Rauschen mit Tonhoehe: Sample-and-Hold, Haltelaenge = rate/f.
        // (WebAudio-Gegenstueck: Rauschpuffer mit playbackRate f/f0.)
        if (halt <= 0) {
          haltWert = rnd();
          halt = Math.max(1, Math.round(sampleRate / Math.max(1, f)));
        }
        halt--;
        s = haltWert;
      } else {
        phase += f / sampleRate;
        if (phase >= 1) phase -= Math.floor(phase);
        if (art === 'pulse') s = phase < duty ? 1 : -1;
        else if (art === 'tri') s = 4 * Math.abs(phase - 0.5) - 1;
        else s = Math.sin(2 * Math.PI * phase);
      }
      out[p] += s * env * e.vol;
    }
  }
  return out;
}

/** Groesster Absolutwert — DAS ist der Wert der Peak-Gates (vor jedem Limiter). */
export function pcmPeak(pcm) {
  let m = 0;
  for (let i = 0; i < pcm.length; i++) {
    const a = pcm[i] < 0 ? -pcm[i] : pcm[i];
    if (a > m) m = a;
  }
  return m;
}

/** FNV-1a ueber 16-Bit-quantisiertes PCM — Pruefsumme fuer Determinismus-Gates. */
export function pcmSumme(pcm) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < pcm.length; i++) {
    const v = Math.round(pcm[i] * 32767) & 0xFFFF;
    h ^= v; h = Math.imul(h, 16777619) >>> 0;
  }
  return h.toString(16);
}
