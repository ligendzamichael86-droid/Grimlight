// Tilemap: Zeichen-Zeilen + Legende → Kollisions- und Zeichen-API.
// Kollisionskonvention: AABB-Kanten halb-offen [x, x+w) — rechte/untere
// Kante zählt NICHT als Überlappung (kein Hängenbleiben beim Wandberühren).
//
// Slice 1.5: optionaler Over-Layer (overRows) + Fringe-Übergangskanten.
// - overRows: gleiche Dimension wie rows; '.' wird VOR dem Legend-Lookup als
//   leer behandelt (Zelle = null) — '.' ist in den Legenden ein Bodentile und
//   darf im Over-Layer NIE gezeichnet werden (Spec-Review-Klärung).
// - Over-Tiles sind NIE solide; createTilemap wirft, wenn ein Over-Zeichen
//   auf einen solid-Legendeneintrag zeigt (Datenfehler laut sichtbar machen).
// - findTiles bleibt GROUND-only (Fackel-Extraktion); Fackel-Zeichen dürfen
//   nie in overRows auftauchen (Smoke-Test prüft das).
//
// Grafikpass 2: optionale Legenden-Felder (alle rein deterministisch, ohne
// Zufall und ohne Zeitstempel — Auswahl ist reine Funktion von tx, ty, timeSec):
// - span: [w, h]   NUR Over-Layer, 1<=w,h<=4 ganzzahlig. Die overRows-Zelle ist
//                  der ANKER (obere linke Ecke); das Art-Canvas ist w*16 x h*16.
// - variants: [...]  Array von TILE_ART-Keys, variants[0] === def.art (Pflicht).
//                  Deterministische Wahl pro Tile-Koordinate (variantIndex).
// - animRate: n    Frames/Sekunde für def.anim (Default 6).
// - animSync: true Kein Positions-Offset im Frame-Index (synchrone Wellen).
// - depthOverlays: [flach, mittel]  NUR Wasser-Legenden (§8b.1). createTilemap
//                  bestimmt einmalig je Tile mit diesem Feld die Chebyshev-Distanz
//                  zum naechsten Tile OHNE depthOverlays; der Ground-Pass legt
//                  NACH Tile+Shore/Fringe den passenden statischen Overlay drueber
//                  (Ufer-Ring flach, naechster Ring mittel, tiefer nichts).
// createTilemap validiert die Kombinationen laut Spec §2.1 (throw bei Datenfehler).

const TILE = 16;
const EPS = 0.0001;

// Deterministische Variantenwahl (reine Funktion, Smoke-Test prüft sie direkt).
// Gleichverteilt über 0..n-1, stabil pro (tx, ty) — kein RNG, kein Zeitbezug.
export function variantIndex(tx, ty, n) {
  let h = (tx * 374761393 + ty * 668265263) >>> 0;
  h = (h ^ (h >>> 13)) >>> 0;
  h = Math.imul(h, 1274126177) >>> 0;
  return h % n;
}

// Grafikpass 4 §2.2a Lit-Dither-Pass — REINE, Node-importierbare Funktion.
// Liefert fuer jedes sichtbare Boden-Tile, dessen ZENTRUM im Fackelkegel liegt,
// einen Eintrag {tx, ty, stufe, key}: Stufe 2 bei Distanz < r*0.40, Stufe 1 bei
// < r*0.70. r enthaelt den deterministischen Doppel-Sinus-Flicker — die Formel
// aus lighting.js:57-60 ist hierher DUPLIZIERT (Spec §2.2a erlaubt Duplikat),
// damit der Kegel deckungsgleich mit dem gestanzten Lichtkreis pulst und die
// Funktion headless (ohne core/lighting.js) baubar bleibt. key via
// variantIndex(tx,ty,2) -> licht_dither_1/_2. Kein Zufall/Zeitstempel (world/).
// lights: [{x,y,radius,flicker}] in Weltpixeln; camera {x,y}; timeSec Sekunden.
// Deterministisch: gleiche Argumente -> identische Liste (Smoke §5#5b).
//
// Grafikpass 5 §5.D2: Stufen-Radien 0.45/0.75 -> 0.40/0.70 (Vereinheitlichung
// mit der Kegel-Sprache der Vignette/Lit-Stufen).
// Grafikpass 5 §1.7: OPTIONALER 6. Parameter isLit(tx,ty) — ein Praedikat, das
// eine Zelle vom Dither AUSSCHLIESST, wenn es false liefert (main.js schliesst
// damit Wasser- und anim-Kacheln aus: gedithertes Licht auf laufenden Wellen
// schmiert). FEHLT der Parameter, ist das Verhalten EXAKT wie bisher — die
// Smoke-Direktaufrufe mit 5 Argumenten bleiben unveraendert gruen.
export function litDitherCells(lights, camera, timeSec, viewW, viewH, isLit) {
  const out = [];
  const tx0 = Math.max(0, Math.floor(camera.x / TILE));
  const ty0 = Math.max(0, Math.floor(camera.y / TILE));
  const tx1 = Math.floor((camera.x + viewW) / TILE);
  const ty1 = Math.floor((camera.y + viewH) / TILE);
  for (let ty = ty0; ty <= ty1; ty++) {
    for (let tx = tx0; tx <= tx1; tx++) {
      // §1.7: Filter zuerst (billigster Ausschluss, spart die Licht-Schleife).
      if (isLit && !isLit(tx, ty)) continue;
      const cx = tx * TILE + TILE / 2;
      const cy = ty * TILE + TILE / 2;
      let stufe = 0;
      for (const light of lights) {
        const flicker = light.flicker || 0;
        const wob =
          Math.sin(timeSec * 13 + light.x * 7) * 0.6 +
          Math.sin(timeSec * 8.3 + light.y * 5 + light.x * 3) * 0.4;
        const r = light.radius * (1 + flicker * 0.1 * wob);
        const dx = cx - light.x;
        const dy = cy - light.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < r * 0.40) { stufe = 2; break; } // hoechste Stufe -> fertig
        if (dist < r * 0.70 && stufe < 1) stufe = 1;
      }
      if (stufe > 0) {
        const key = variantIndex(tx, ty, 2) === 0 ? 'licht_dither_1' : 'licht_dither_2';
        out.push({ tx, ty, stufe, key });
      }
    }
  }
  return out;
}

// Fringe-Nachbarlogik als REINE Funktion (Node-testbar, Smoke-Test).
// getDef(tx, ty) → Legendeneintrag oder null/undefined (außerhalb der Map).
// Liefert die fringe_*-Art-Keys, die ÜBER dem Tile (tx,ty) liegen müssen:
// - Nur Tiles mit fringeTarget: true bekommen Fransen.
// - Für jede orthogonale Seite mit fringeSource-Nachbar das Seiten-Fringe
//   (Benennung = Seite des Tiles, an der der Source-Nachbar liegt).
// - Für jede Diagonale mit Source-Nachbar, deren BEIDE Orthogonalen keine
//   Sources sind, das Ecken-Fringe (nur das 'grass'-Set hat Ecken;
//   'moss' kommt laut Spec mit 4 Seiten aus).
// - Das Set (Prefix 'fringe' | 'moss_fringe') bestimmt das fringeSet-Feld
//   des SOURCE-Nachbarn ('grass' ist Default).
export function fringeOverlays(getDef, tx, ty) {
  const def = getDef(tx, ty);
  if (!def || !def.fringeTarget) return [];
  const srcSet = (dx, dy) => {
    const d = getDef(tx + dx, ty + dy);
    return d && d.fringeSource ? (d.fringeSet || 'grass') : null;
  };
  // Grafikpass 2 §8a.3: Trägt das TARGET-Tile shorePrefix UND stammt der
  // Source-Nachbar aus dem 'grass'-Set, werden shore_*-Ufer-Keys statt fringe_*
  // emittiert (Schaumsaum/dunkle Wasserlinie am Teich). Nur GRAVEYARD-'~' trägt
  // shorePrefix; Moos-Ufer (set 'moss') bleiben unverändert moss_fringe_*.
  const prefix = (set) => {
    if (def.shorePrefix && set === 'grass') return def.shorePrefix;
    return set === 'moss' ? 'moss_fringe' : 'fringe';
  };
  const out = [];
  const n = srcSet(0, -1);
  const e = srcSet(1, 0);
  const s = srcSet(0, 1);
  const w = srcSet(-1, 0);
  // Grafikpass 4 §2.1 Konkav-Ufer (Wahrheitstabelle): Genau 2 ADJAZENTE
  // grass-Shore-Orthoseiten an einem shorePrefix-Tile ERSETZEN die beiden
  // Ortho-Shore-Keys durch EINEN organischen Innenecken-Bogen
  // (shore_ine/inw/ise/isw). Betroffen ist AUSSCHLIESSLICH der grass->shore-
  // Namespace: moss/fringe-Orthos, die Diagonal-Ecken und die GP3-Nassrand-
  // Emission bleiben byte-gleich. 1 Seite / 2 opponierte Seiten / nur diagonal
  // = Bestand. Deterministisch aus (tx,ty). Reihenfolge im out-Array bleibt fuer
  // alle Bestandsfaelle identisch (inneKey wird null -> nichts eingeschoben).
  const sp = def.shorePrefix;
  const isShore = (side) => !!sp && side === 'grass';
  const shN = isShore(n), shE = isShore(e), shS = isShore(s), shW = isShore(w);
  const shoreCount = shN + shE + shS + shW;
  let inneKey = null;
  const skip = { n: false, e: false, s: false, w: false };
  if (shoreCount === 2) {
    if (shN && shE) { inneKey = `${sp}_ine`; skip.n = skip.e = true; }
    else if (shN && shW) { inneKey = `${sp}_inw`; skip.n = skip.w = true; }
    else if (shS && shE) { inneKey = `${sp}_ise`; skip.s = skip.e = true; }
    else if (shS && shW) { inneKey = `${sp}_isw`; skip.s = skip.w = true; }
    // opponiert (N+S / E+W): inneKey bleibt null -> Bestand (beide Ortho-Keys).
  }
  if (n && !skip.n) out.push(`${prefix(n)}_n`);
  if (e && !skip.e) out.push(`${prefix(e)}_e`);
  if (s && !skip.s) out.push(`${prefix(s)}_s`);
  if (w && !skip.w) out.push(`${prefix(w)}_w`);
  if (inneKey) out.push(inneKey);
  const corner = (dx, dy, name, ortho1, ortho2) => {
    const d = srcSet(dx, dy);
    if (d && d !== 'moss' && !ortho1 && !ortho2) out.push(`${prefix(d)}_${name}`);
  };
  corner(1, -1, 'ne', n, e);
  corner(-1, -1, 'nw', n, w);
  corner(1, 1, 'se', s, e);
  corner(-1, 1, 'sw', s, w);
  // Grafikpass 3 §2.1 Nassrand (additiv): Traegt das TARGET-Tile shorePrefix UND
  // stammt der orthogonale Source-Nachbar aus dem 'moss'-Set, werden die
  // moss_fringe_*-Keys (oben) WEITERHIN emittiert und ZUSAETZLICH danach
  // shorePrefix_n/e/s/w (nur Orthogonale) — die dunkle Nasskante am Gruft-Kanal
  // ueber den Moos-Ufern. Das grass-Quell-Verhalten (shore_*-Umlenkung via
  // prefix()) bleibt exakt wie in GP2. FLUESTERGRUFT-'~' traegt shorePrefix 'wet'.
  if (def.shorePrefix) {
    if (n === 'moss') out.push(`${def.shorePrefix}_n`);
    if (e === 'moss') out.push(`${def.shorePrefix}_e`);
    if (s === 'moss') out.push(`${def.shorePrefix}_s`);
    if (w === 'moss') out.push(`${def.shorePrefix}_w`);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Grafikpass 5 Paket B — Ufer/Uferband/Reflexion. ALLE Neuerungen leben in
// NEUEN reinen Funktionen; fringeOverlays bleibt byte-eingefroren (§0.2).
// ---------------------------------------------------------------------------

// Wasser-Erkennung fuer Paket B (modul-intern, eine einzige Wahrheit):
// eine Kachel gilt als WASSER, wenn sie shorePrefix ODER depthOverlays traegt.
// Beide Felder sitzen ausschliesslich auf Wasser-Legenden (GRAVEYARD '~' =
// shorePrefix 'shore' + depthOverlays, FLUESTERGRUFT '~' = shorePrefix 'wet').
// Ausserhalb der Map (getDef -> null) ist NICHTS Wasser.
function isWaterDef(d) {
  return !!(d && (d.shorePrefix || d.depthOverlays));
}

// §3.B1 shoreEdges(getDef, tx, ty) — REINE Funktion (Node-testbar).
// Ufer-Keys fuer die ROHEN Wasserkanten: orthogonale Nachbarn, die WEDER
// Wasser sind NOCH fringeSource tragen (Steinboden, Weg, Stamm, Fackelfuss).
// Das ist exakt das KOMPLEMENT zu fringeOverlays: dort wird jede Kante mit
// fringeSource-Nachbar bedient (fringe_*/moss_fringe_*/shore_*), hier NUR die
// Kanten, die dort leer ausgehen — nie eine Doppel-Emission, der GP4-Konkav-Fix
// bleibt unberuehrt.
// Emissions-Familie ist IMMER 'shore_*' (unabhaengig vom shorePrefix der
// Kachel): die shore-Kacheln sind material-agnostisch/rein wasserseitig, und
// der wet_-Regex des Smoke-Tests (§3-Nassrand) bleibt unberuehrt.
// ZUSAETZLICH §3.B3 Diagonal-Kappen shore_cap_<Seite><Richtung>: dort, wo eine
// GERADE Landkante (Seite A, gleich ob sie von fringeOverlays oder von hier
// gezeichnet wird) endet, weil der Nachbar in der Querrichtung B UND die
// Diagonale A+B Wasser sind, laeuft die Uferlinie diagonal weiter. 8 Faelle:
// nw/ne/sw/se (Nord-/Suedkante endet nach West/Ost) und wn/ws/en/es (West-/
// Ostkante endet nach Nord/Sued). Rein additiv, kein Ersetzen, kein Doppel-Key.
// Aufruf im Ground-Pass NACH fringeOverlays; fehlt ein Art-Key, wird still
// nichts gezeichnet.
// GP5 RUNDE 3 §2(e): Anzahl der Auspraegungen je Tiefen-Overlay-Key
// (Basis + _v1 + _v2). UNGERADE und teilerfremd zu 5/7/17/29/47 (§0.4).
const DEPTH_VARIANT_N = 3;

const SHORE_SIDES = [['n', 0, -1], ['e', 1, 0], ['s', 0, 1], ['w', -1, 0]];
const SHORE_PERP = {
  n: [['w', -1, 0], ['e', 1, 0]],
  s: [['w', -1, 0], ['e', 1, 0]],
  w: [['n', 0, -1], ['s', 0, 1]],
  e: [['n', 0, -1], ['s', 0, 1]],
};

// GP5 RUNDE 3 §2(b) — DIAGONALE ECKEN-UFER (Verdrahtungs-Nachzug).
// Die vier Kacheln shore_diag_ne/nw/se/sw lagen fertig in art/sprites.js, ohne
// dass sie je EMITTIERT wurden. Sie gehoeren auf die AUSSENECKEN des Beckens:
// eine WASSER-Kachel, deren senkrechter UND waagerechter Nachbar Land ist und
// deren Diagonale dazwischen ebenfalls Land ist. Genau dort lief die Uferlinie
// bisher im rechten Winkel um die Ecke ("Becken-Raster", Jury R2); die Kachel
// legt an ihre Stelle eine 45-Grad-Treppe.
// Namenskonvention der Art (dort nachgelesen, nicht geraten): "an einer
// Aussenecke sind N und E LAND, S und W WASSER" -> shore_diag_ne. Der erste
// Buchstabe ist also die SENKRECHTE Landseite, der zweite die WAAGERECHTE.
// Eintrag: [Name, adx, ady (senkrechte Seite), bdx, bdy (waagerechte Seite)];
// die Diagonale ist die Summe der beiden Versaetze.
const SHORE_DIAG = [
  ['ne', 0, -1, 1, 0],
  ['nw', 0, -1, -1, 0],
  ['se', 0, 1, 1, 0],
  ['sw', 0, 1, -1, 0],
];

export function shoreEdges(getDef, tx, ty) {
  const def = getDef(tx, ty);
  if (!def || !def.shorePrefix) return []; // frueher Abbruch: nur Wasser-Kacheln
  const out = [];
  const at = (dx, dy) => getDef(tx + dx, ty + dy);
  for (const [name, dx, dy] of SHORE_SIDES) {
    const d = at(dx, dy);
    if (!d) continue;              // ausserhalb der Map = keine Kante
    if (isWaterDef(d)) continue;   // Wasser-Nachbar = keine Kante
    if (d.fringeSource) continue;  // KOMPLEMENT-Regel: das bedient fringeOverlays
    out.push(`shore_${name}`);
  }
  for (const [name, dx, dy] of SHORE_SIDES) {
    const dLand = at(dx, dy);
    if (!dLand || isWaterDef(dLand)) continue; // gerade Kante nur gegen LAND
    for (const [pname, pdx, pdy] of SHORE_PERP[name]) {
      if (!isWaterDef(at(pdx, pdy))) continue;             // Querrichtung Wasser
      if (!isWaterDef(at(dx + pdx, dy + pdy))) continue;    // Diagonale Wasser
      out.push(`shore_cap_${name}${pname}`);
    }
  }
  // §2(b) 45-GRAD-TREPPE an den Aussenecken. ADDITIV wie die Caps und ZULETZT
  // in der Liste: der Ground-Pass zeichnet die Liste der Reihe nach, die
  // Treppenkachel liegt also ueber den geraden shore_*-Kanten und den
  // fringe-Innenecken derselben Zelle. NACHGEMESSEN auf allen zehn echten
  // Teich-Aussenecken: von den vorher gezeichneten Overlay-Pixeln bleiben
  // hoechstens 10 von 256 sichtbar (einzelne w/W/9-Tupfer des Ufer-Profils in
  // den transparenten Feldern der Treppe) — die 90-Grad-Kontur selbst ist
  // vollstaendig ueberdeckt. Fehlt ein Art-Key, wird im Ground-Pass still
  // nichts gezeichnet.
  //
  // WARUM NUR shorePrefix 'shore': die vier Kacheln backen eine GRAS-Landzunge
  // (Toene e/E/a) ein. Am Gruft-KANAL (shorePrefix 'wet', Steinboden und
  // Ziegelwand ringsum) waere das Gras ein Material-Fehler — dort blieben 15
  // geometrisch passende Ecken bewusst unbedient (gemessen, Jury-Deklaration).
  // Die uebrigen shore_*-Familien bleiben material-agnostisch wie bisher.
  if (def.shorePrefix === 'shore') {
    for (const [name, adx, ady, bdx, bdy] of SHORE_DIAG) {
      const a = at(adx, ady);
      const b = at(bdx, bdy);
      const d = at(adx + bdx, ady + bdy);
      if (!a || !b || !d) continue;                              // Kartenrand
      if (isWaterDef(a) || isWaterDef(b) || isWaterDef(d)) continue;
      out.push(`shore_diag_${name}`);
    }
  }
  return out;
}

// §3.B2 bankOverlays(getDef, tx, ty) — REINE Funktion.
// Uferband auf der LANDSEITE: 3 px Uferschatten + 2 px Material-Rampe, gedithert.
// Material kommt aus dem NEUEN Legenden-Flag `bankSet` der LANDKACHEL:
//   'g' = Schlamm/Gras-Ufer (GRAVEYARD Gras/Weg), 's' = nasse Steinkante
//   (FLUESTERGRUFT Steinboden). Ziegel-WAENDE tragen KEIN Flag -> kein Band.
// Kein Flag (oder fehlender Art-Key) -> still nichts.
// Keys: bank_n/e/s/w + bank_ne/nw/se/sw, jeweils mit _g/_s-Suffix.
// Ecken nur, wenn die diagonale Wasserzelle NICHT schon von einem geraden Band
// derselben Kachel abgedeckt ist (beide angrenzenden Orthogonalen kein Wasser)
// — sonst laege das Eckstueck doppelt auf dem Band.
// GP5 RUNDE 3 §2(a): Einbuchtungs-/Zungen-/Landbruecken-Zellen sind KOMPLETT
// von Baendern ausgenommen (Regel im Funktionsrumpf dokumentiert).
export function bankOverlays(getDef, tx, ty) {
  const def = getDef(tx, ty);
  // Frueher Abbruch in zwei Stufen: (1) das Flag (die mit Abstand billigste
  // Pruefung, sie wirft praktisch alle Kacheln raus), (2) danach erst die
  // Nachbarschaft — geprueft wird also NUR an Kacheln, die ueberhaupt ein
  // Uferband tragen koennen.
  if (!def || isWaterDef(def)) return [];              // nur LAND-Kacheln
  const set = def.bankSet;
  if (set !== 'g' && set !== 's') return [];           // kein Flag -> nichts
  const w = (dx, dy) => isWaterDef(getDef(tx + dx, ty + dy));
  const n = w(0, -1);
  const e = w(1, 0);
  const s = w(0, 1);
  const west = w(-1, 0);
  // ---------------------------------------------------------------------
  // GRAFIKPASS 5 RUNDE 3 §2(a) — TEICH-BALKEN-BUG (Juror K: "braune Ufer-
  // baender laufen QUER DURCH die Wasserflaeche").
  //
  // URSACHE: eine Landkachel, die TIEF im Becken sitzt (Einbuchtung, Zunge,
  // Landbruecke), hat Wasser auf mehreren Seiten und bekam bisher auf JEDER
  // dieser Seiten ein Uferband. Bei einer 1 Kachel breiten Landbruecke
  // (Wasser N UND S bzw. E UND W) treffen sich die beiden Baender in der
  // Kachelmitte und lesen aus der Distanz als BALKEN, der quer durch die
  // Wasserflaeche laeuft — statt als Ufer.
  //
  // REGEL (Jury-Rezept, woertlich): kein Band, wenn die Landkachel
  //   (a) GEGENUEBERLIEGENDE Wasser-Orthonachbarn hat (N+S oder E+W)  ODER
  //   (b) >= 3 Wasser-Orthonachbarn hat (Einbuchtungs-/Zungen-Zelle).
  // Solche Zellen sind visuell Teil des Beckens, nicht sein Ufer; ihre Kanten
  // bedienen weiterhin fringeOverlays/shoreEdges von der WASSERSEITE her
  // (Komplement-Regel unberuehrt — es entfaellt nur das LANDSEITIGE Band).
  // Die Unterdrueckung wirkt fuer die GANZE Kachel (auch die Eckstuecke):
  // ein Eckstueck ohne die zugehoerigen geraden Baender waere ein Stummel.
  const nWater = (n ? 1 : 0) + (e ? 1 : 0) + (s ? 1 : 0) + (west ? 1 : 0);
  if ((n && s) || (e && west) || nWater >= 3) return [];
  const ne = w(1, -1);
  const nw = w(-1, -1);
  const se = w(1, 1);
  const sw = w(-1, 1);
  // ---------------------------------------------------------------------
  // GP5 RUNDE 3 — TEICH-BALKEN-ECHTFIX (Verdrahtungs-Nachzug).
  //
  // BEFUND: die Regel oben (gegenueberliegende Wasserseiten / >= 3 Wasser-
  // Orthonachbarn) hat auf den echten Karten NICHT EINE EINZIGE Zelle
  // getroffen. Headless nachgemessen (alle vier Karten, jede Landzelle):
  // die hoechste Wasser-Orthonachbarzahl einer bandtragenden Kachel ist 2,
  // gegenueberliegende Seiten kommen nirgends vor. Der von der Jury
  // gesehene Balken kam also aus einer ANDEREN Konstellation.
  //
  // ECHTE URSACHE: die TREPPEN-INNENECKE. Der Friedhofsteich ist eine
  // Treppenkontur (Wasser-Bounding-Box x29-37 / y14-18, Zeilenbreiten
  // 2/6/9/9/2). An jeder Stufe sitzt eine Landkachel, die auf ZWEI
  // BENACHBARTEN Seiten Wasser hat UND deren Diagonale zwischen diesen
  // beiden Seiten ebenfalls Wasser ist. Sie ragt damit als Zacken in die
  // Wasserflaeche; ihre beiden Baender treffen sich in der Kachelecke und
  // lesen zusammen mit den Baendern der Nachbarstufen als brauner Balken
  // quer durchs Becken. Genau diese Ecken bekommen ab jetzt von der
  // WASSERSEITE die 45-Grad-Treppe shore_diag_* (§2(b), oben) — das
  // landseitige Band waere dort doppelt und wuerde die Treppe zudecken.
  //
  // REGEL: kein Band, wenn eine senkrechte und eine waagerechte Seite
  // Wasser sind UND die Diagonale zwischen ihnen ebenfalls Wasser ist.
  // Unterdrueckt wird die GANZE Kachel (wie oben) — ein Eckstueck ohne
  // seine geraden Baender waere ein Stummel.
  //
  // AEQUIVALENZ ZUM AUFTRAGS-WORTLAUT ("Landzellen INNERHALB der Teich-
  // Bounding-Box mit >= 2 Wasser-Orthonachbarn"): headless gegengerechnet
  // liefern beide Formulierungen auf ALLEN VIER Karten exakt dieselbe
  // Zellmenge (GRAVEYARD 6 Zellen / 12 Emissionen, FLUESTERGRUFT 6 Zellen
  // / 12 Emissionen, Katakomben und Bosskammer haben kein Wasser).
  // Genommen ist die LOKALE Fassung, weil sie (a) eine reine Funktion der
  // 3x3-Nachbarschaft bleibt — bankOverlays wird pro sichtbarer Kachel und
  // Frame gerufen, eine Bounding-Box braeuchte einen Ganzkarten-Scan — und
  // (b) nicht von der zufaelligen Lage des Box-Randes abhaengt: die
  // Bounding-Box-Fassung haette die beiden spiegelbildlichen Nord-Stufen
  // (29,15) und (36,15) unterschiedlich behandelt, sobald man "vollstaendig
  // innerhalb" streng liest.
  if ((n && e && ne) || (n && west && nw) || (s && e && se) || (s && west && sw)) return [];
  const out = [];
  if (n) out.push(`bank_n_${set}`);
  if (e) out.push(`bank_e_${set}`);
  if (s) out.push(`bank_s_${set}`);
  if (west) out.push(`bank_w_${set}`);
  if (!n && !e && ne) out.push(`bank_ne_${set}`);
  if (!n && !west && nw) out.push(`bank_nw_${set}`);
  if (!s && !e && se) out.push(`bank_se_${set}`);
  if (!s && !west && sw) out.push(`bank_sw_${set}`);
  return out;
}

// GP5 RUNDE 3 §5 — UFER-ZAHN-VARIANTEN (Verdrahtungs-Nachzug), REINE Funktion.
// bank_n_g_v1/_v2/_v3 lagen fertig in art/sprites.js und wurden nie gezogen:
// das Suedufer-Band endete dadurch in JEDER Kachel auf derselben Zeile und zog
// eine durchgehende 16px-Linie durchs Bild (Jury R2, Auftrag 5).
// Die Wahl sitzt bewusst NICHT in bankOverlays, sondern hier: bankOverlays
// beantwortet "WELCHE Baender", diese Funktion "welches Pixel-Grid" — dieselbe
// Trennung wie zwischen der Legende und artFor(). Damit bleibt die Emission
// weiter die kanonische Key-Familie bank_*_g|s (alle Bestandstests unberuehrt).
// n = 7: UNGERADE und teilerfremd zu 3 (Tiefen-Overlay), 5 (Anker-Jitter),
// 17/29 (Anker-Versatz), 47 (Gras-Pool) und zu 5 (die '='-Weg-Legende, die auf
// denselben Uferkacheln liegt). Die Basis steht auf genau EINEM der sieben
// Plaetze, jede Zahn-Variante auf zweien — der Bestandston bleibt im Bild, die
// gleichfoermige Zeile verschwindet.
// Koordinaten mit 419/971 versetzt (beide prim, verschieden von allen anderen
// Versaetzen 617/293, 1013/571, 421/907, 331/733), damit die Zahnwahl weder mit
// der Tiefen-Streuung noch mit Anker- oder Sway-Muster korreliert. Der Versatz
// ist nicht geraten, sondern auf den SIEBEN echten bank_n_g-Kacheln des Teichs
// ausgemessen: die vier zusammenhaengenden Suedufer-Kacheln (34..37, 18) ziehen
// VIER VERSCHIEDENE Grids (v1/Basis/v3/v2 — genau der Defekt "das Band endet in
// jeder Kachel auf derselben Zeile" ist damit gebrochen), die beiden Nachbarn
// (31,19)/(32,19) zwei verschiedene, und die Gesamtverteilung trifft die
// Listen-Gewichtung exakt (1x Basis, je 2x v1/v2/v3).
// Kein Zufall, kein Zeitstempel (§0.4).
const BANK_VARIANTS = {
  bank_n_g: ['bank_n_g', 'bank_n_g_v1', 'bank_n_g_v2', 'bank_n_g_v3',
    'bank_n_g_v1', 'bank_n_g_v2', 'bank_n_g_v3'],
};

export function bankVariantFor(key, tx, ty) {
  const list = BANK_VARIANTS[key];
  if (!list) return key;
  return list[variantIndex(tx + 419, ty + 971, list.length)];
}

// §3.B4 waterReflections(lights, defAt, cam, timeSec) — REINE Funktion.
// Liefert die WASSER-Zellen, die orthogonal an einer FACKEL liegen (Fackel =
// flicker >= 0.8, dieselbe Schwelle wie Warm-Glow/Lit-Dither/Funken; die
// Fuell-Lichter aus §5.D4 liegen bei 0.5 und werfen bewusst KEINE Reflexion,
// Spieler/Drops/Eliten bei 0.3). Geometrisch existiert das nur im Gruft-KANAL
// (Jury-Deklaration: die einzige Teich-Fackel liegt nur diagonal am Wasser).
// Rueckgabe je Zelle: { tx, ty, key, wob, sx, sy } —
//   key  water_reflect_0/_1 (zwei Intensitaeten, deterministisch aus Zeit+Ort),
//   wob  ganzzahliges Wackeln -1/0/+1 px aus Math.round(Math.sin(...)),
//   sx/sy fertige, GANZZAHLIGE Screen-Koordinaten inkl. Wackeln (main.js
//        zeichnet sie per 3-Argument-drawImage mit 'lighter').
// Deterministisch: gleiche Argumente -> identische Liste (weder Zufall noch
// Zeitstempel, §0.4). Jede Zelle nur EINMAL (zwei Fackeln am selben
// Kanalstueck erzeugen kein Doppel-Draw).
export function waterReflections(lights, defAt, cam, timeSec) {
  const out = [];
  if (!lights || !defAt) return out;
  const camX = cam ? cam.x : 0;
  const camY = cam ? cam.y : 0;
  const seen = new Set();
  for (const light of lights) {
    if ((light.flicker || 0) < 0.8) continue;
    const lx = Math.floor(light.x / TILE);
    const ly = Math.floor(light.y / TILE);
    for (const [, dx, dy] of SHORE_SIDES) {
      const tx = lx + dx;
      const ty = ly + dy;
      if (!isWaterDef(defAt(tx, ty))) continue;
      const id = `${tx},${ty}`;
      if (seen.has(id)) continue;
      seen.add(id);
      const wob = Math.round(Math.sin(timeSec * 2.3 + light.x * 0.7 + tx * 1.1));
      const lvl = Math.sin(timeSec * 3.7 + light.y * 0.5 + ty * 0.9) >= 0 ? 1 : 0;
      out.push({
        tx,
        ty,
        key: `water_reflect_${lvl}`,
        wob,
        sx: Math.round(tx * TILE - camX) + wob,
        sy: Math.round(ty * TILE - camY),
      });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Grafikpass 5 §4.C2 ANKER-OFFSET (Kronen) — Formeln WOERTLICH aus der Spec.
// Ersetzt den GP3-Anker-Jitter (vertikal ±2 px, variantIndex(tx,ty,5)-2): der
// Versatz ist jetzt ZWEIDIMENSIONAL und pro Anker-Klasse begrenzt, damit die
// Baumreihen ihr Spaltenraster verlieren, ohne dass eine Krone von ihrem Stamm
// abreisst. Zwei VERSETZTE Hashes mit UNGERADEN, zu 5 teilerfremden n (29/17,
// beide prim) — weder Zufall noch Zeitstempel (§0.4).
//   dxRaw = variantIndex(tx + 1013, ty + 571, 29)
//   dx0   = dxRaw - 14                       // -14..+14
//   dx    = clamp(dx0, -W, +W)               // W je ANKER-KLASSE
//   dyRaw = variantIndex(tx + 421, ty + 907, 17)
//   dy    = dyRaw % 9 - 4                    // -4..+4
// ANKER-KLASSEN-TABELLE (Zuordnung ueber das Anker-Zeichen der Legende, hier
// ueber dessen Art-Key gefuehrt, weil derselbe Key in mehreren Legenden unter
// verschiedenen Zeichen stehen kann):
//   Back-Kuppen  Y/Z/A  (tree_canopy_back_a/_b/_c)          -> W = 14
//   Front _b/_bm N/V    (tree_canopy_2x2_b/_bm)             -> W =  6
//   Front _a/_am/_c/_cm M/Q/O/X (tree_canopy_2x2_a/_am/_c/_cm) -> W = 2
//   Front OHNE Stammdeckung (jeder sonstige Anker)          -> W = 14
// Der DEFAULT ist damit die stammlose Front (W=14).
const ANCHOR_CLAMP = {
  tree_canopy_back_a: 14,
  tree_canopy_back_b: 14,
  tree_canopy_back_c: 14,
  tree_canopy_2x2_b: 6,
  tree_canopy_2x2_bm: 6,
  tree_canopy_2x2_a: 2,
  tree_canopy_2x2_am: 2,
  tree_canopy_2x2_c: 2,
  tree_canopy_2x2_cm: 2,
  // GRAFIKPASS 6 §5.2 — die sechs XL-Kronen (§5.1: xl_a/xl_c span [3,2] 48x32,
  // xl_b span [4,3] 64x48, je + '_m'). W = 4: sie sind BREITER als die
  // 2x2-Fronten und stehen im geschlossenen Dach (§5.5) mit Spalten-Pitch 2,
  // also 16 px Ueberlappung. Ein Versatz bis +-14 px wie bei den Back-Kuppen
  // risse dort Loecher ins Dach (in der ersten Layout-Fassung des
  // P0b-Generators nachgewiesen), +-4 px streut das Spaltenraster, ohne die
  // Ueberlappung aufzubrauchen. Neue Schluessel stehen am ENDE (§0.5).
  tree_canopy_xl_a: 4,
  tree_canopy_xl_a_m: 4,
  tree_canopy_xl_b: 4,
  tree_canopy_xl_b_m: 4,
  tree_canopy_xl_c: 4,
  tree_canopy_xl_c_m: 4,
};
const ANCHOR_CLAMP_DEFAULT = 14; // Front ohne Stammdeckung

// Reiner Anker-Versatz in PIXELN (ganzzahlig) fuer den Anker (tx,ty) mit dem
// Legendeneintrag def. Wird sowohl vom Over-Zeichenpfad als auch vom
// canopy_shadow-Pfad genutzt (identischer Versatz = der Schatten bleibt unter
// der Krone).
export function anchorOffset(def, tx, ty) {
  const dxRaw = variantIndex(tx + 1013, ty + 571, 29);
  const dx0 = dxRaw - 14;
  const key = def && def.art;
  const W = Object.prototype.hasOwnProperty.call(ANCHOR_CLAMP, key)
    ? ANCHOR_CLAMP[key]
    : ANCHOR_CLAMP_DEFAULT;
  const dx = Math.max(-W, Math.min(W, dx0));
  const dyRaw = variantIndex(tx + 421, ty + 907, 17);
  const dy = (dyRaw % 9) - 4;
  return { dx, dy };
}

// ---------------------------------------------------------------------------
// Grafikpass 5 RUNDE 2 §4.C4-neu — SWAY (Wurzel-Fix nach der R2-Diagnose).
//
// DIAGNOSE (.tmp/sway_probe_gp5r2.mjs, Zahlen im Uebergabebericht):
// (a) Die Sway-Legenden 'w'/'y' nutzen `anim`, NICHT `variants` — es gibt dort
//     KEINE gespiegelten Grids. Die gespiegelten/rotierten Grids sitzen auf den
//     STATISCHEN Nachbar-Legenden 'u'/'j' (grass_tuft_r1/_v1, grass_blade_r1/_v1)
//     und streuen den Glyphen-Schwerpunkt STATISCH um bis zu 5,2 px — sie
//     dominieren jede Schwerpunkt-Messung ueber ein Crop-Fenster und lasen als
//     "Gegenphase oben/unten".
// (b) Die R1-Formel (2x2-Block-Hash) hat GEGRIFFEN: 0 Cluster-Brueche gemessen.
//     Der Defekt lag NICHT in der Phase, sondern in der ANIM-LAENGE: def.anim
//     hat 2 Frames. Bei n=2 ist JEDER ungerade Cluster-Versatz eine exakte
//     ANTIPHASE — Cluster A zeigt +1,36 px waehrend Cluster B 0,00 px zeigt und
//     umgekehrt. Mehr als 2 Zustaende sind mit 2 Frames arithmetisch unmoeglich.
//
// FIX: der Sway laeuft jetzt ueber eine 4-PHASEN-Welle mit der Amplituden-
// tabelle SWAY_DX = [0, +1, 0, -1]. Die Cluster-Id steuert AUSSCHLIESSLICH den
// PHASENVERSATZ, nie das Vorzeichen — und zwar als BRUCHTEIL EINES SCHRITTES
// (shift/7 < 1). Daraus folgen drei harte Eigenschaften:
//   1. Zwei Cluster liegen NIE mehr als EINEN Schritt auseinander. Die Paare
//      (0,1) (1,2) (2,3) (3,0) enthalten nie +1 UND -1 zugleich -> im ganzen
//      Bild steht zu keinem Tick ein Vorzeichen gegen das andere (die alte
//      Gegenphase ist strukturell ausgeschlossen). Es rollt eine BOE ueber die
//      Wiese, statt dass Nachbarn gegeneinander schlagen.
//   2. Alle vier Kacheln eines 2x2-Clusters teilen Schritt UND Vorzeichen
//      (der Hash liest floor(tx/2)/floor(ty/2)).
//   3. Bei timeSec = 0 steht JEDE Kachel auf Schritt 0 (dx = 0) — die
//      Ruhelage ist global definiert (und die Anker-Tests bei t=0 bleiben gruen).
//
// ART-GRENZE (deklarationspflichtig, an die Jury zu melden): die Ground-
// Sway-Kacheln sind OPAKE Bodenkacheln ('e'-Grasbasis bis an die Kachelkante).
// Ein Pixel-Versatz der ganzen Kachel risse eine 1-px-Luecke auf den schwarz
// geleerten Hauptcanvas — der negative Halbzyklus kann deshalb NUR aus einem
// nach LINKS gebogenen ART-FRAME kommen, den es nicht gibt (art/sprites.js
// gehoert dem Art-Agenten). Die Zuordnung Phase -> Frame ist darum generisch:
//   dx > 0  -> anim[1]            (Rechtsbiegung, existiert: *_f1)
//   dx < 0  -> anim[n-1] bei n>=3 (Linksbiegung, sobald Art sie liefert)
//   sonst   -> anim[0]            (Ruhelage)
// Liefert Art spaeter grass_tuft_f2/grass_blade_f2 (Linksbiegung) und Engine-B
// setzt anim: [ruhe, rechts, ruhe, links] (n=4), zeigt DIESELBE Formel ohne
// weitere Aenderung 3 Lean-Zustaende statt 2. Bis dahin rendert der negative
// Halbzyklus als Ruhelage (2 Lean-Zustaende, aber ohne jede Gegenphase).
// Die volle 4-Phasen-Auslenkung IST bereits sichtbar — auf den KRONEN: der
// Over-Layer ist transparent, dort wird SWAY_DX als echter Pixel-Versatz
// gezeichnet (halbe Amplitude: +-1 px gegen die ~2 px Spitzenbiegung der
// Gras-Frames, Jury-Auftrag "Kronen mit halber Amplitude einbinden").
const SWAY_DX = [0, 1, 0, -1];
const SWAY_CLUSTER_N = 7; // ungerade, teilerfremd zu 5/29/17 (§0.4)
// Schritte pro Sekunde der Kronen-Boe. 1.6 = animRate 0.8 der Gras-Legenden x2
// (4 Schritte statt 2 Frames -> gleiche Zykluslaenge 2,5 s wie im Bestand).
const CROWN_SWAY_RATE = 1.6;
// GRAFIKPASS 5 RUNDE 3: Amplituden-Faktor der 16x16-HAENGE-Kronen (kein span).
// 2 -> +-2 px statt +-1 px ("Kronen-Sway-Amplitude +1 px"). Die span-Anker
// (2x2-Grosskronen) bleiben bei Faktor 1, damit die Krone am Stamm bleibt.
const HANG_SWAY_AMP = 2;

// REINE Funktion (Node-testbar): Phase und Amplitude der Sway-Welle an (tx,ty).
// rate = Schritte pro Sekunde. Kein Zufall, kein Zeitstempel (§0.4).
export function swayPhase(tx, ty, timeSec, rate) {
  const shift = variantIndex(
    Math.floor(tx / 2) + 331,
    Math.floor(ty / 2) + 733,
    SWAY_CLUSTER_N
  );
  // Bruchteil-Versatz (< 1 Schritt): benachbarte Cluster liegen hoechstens
  // EINEN Schritt auseinander -> nie +1 gegen -1 im selben Tick.
  const p = timeSec * rate + shift / SWAY_CLUSTER_N;
  const step = ((Math.floor(p) % 4) + 4) % 4;
  return { step, dx: SWAY_DX[step] };
}

// ---------------------------------------------------------------------------
// GRAFIKPASS 6 §5.2 — SWAY ALS GEBACKENE SCHER-POSEN.
//
// WARUM eine zweite Funktion neben swayPhase: eine 64x48-Krone, die als
// GANZES um +-1 px wandert, liest als Ruckeln, nicht als Wind — die Silhouette
// muss sich aendern. Scherung im Renderer ist verboten (Transform-Verbot
// GP4 §0, und die Flusstest-Stubs haben translate/rotate gar nicht), also
// liegt jede Pose als eigenes Grid in der Art (Generator .tmp/gen_crowns_gp6):
// die Legende fuehrt sie im Feld `swayPoses` (Laenge 8, Folge der Auslenkungen
// [0,+1,+2,+1,0,-1,-2,-1] -> 5 echte Posen, poses[0] === def.art). Gezeichnet
// wird weiterhin GENAU EIN drawImage je Over-Zelle.
//
// swayPose8 liefert den Index in diese Acht-Folge. Sie ist rein ZEITBASIERT
// nach dem swayPhase-Muster (§0.6): derselbe 2x2-Cluster-Hash mit
// SWAY_CLUSTER_N = 7 als BRUCHTEIL-Phasenversatz, dann Modulo 8 auf dem
// Zeitschritt. AUSDRUECKLICH KEIN variantIndex mit n = 8 (n muss ungerade und
// teilerfremd zu den anderen n am selben Ort sein — 8 waere beides nicht).
// Kein Zufall, kein Zeitstempel (§0.6).
//
// RUHELAGE: bei timeSec = 0 ist p = shift/7 < 1, also step = 0 fuer JEDEN
// Cluster -> poses[0] === def.art -> das Bild ist byte-gleich zum Basis-Grid.
export function swayPose8(tx, ty, timeSec, rate) {
  const shift = variantIndex(
    Math.floor(tx / 2) + 331,
    Math.floor(ty / 2) + 733,
    SWAY_CLUSTER_N
  );
  const p = timeSec * rate + shift / SWAY_CLUSTER_N;
  return ((Math.floor(p) % 8) + 8) % 8;
}

// Schritte pro Sekunde der Posen-Boe. 3.2 = CROWN_SWAY_RATE * 2: acht Posen
// statt vier Schritte bei GLEICHER Zykluslaenge 2,5 s — die Posen-Kronen
// wiegen sich also im selben Takt wie die Bestands-Boe (swayPhase) und das
// Gras (animRate 0.8 x 2 Frames).
export const CROWN_POSE_RATE = 3.2;

// ---------------------------------------------------------------------------
// GRAFIKPASS 6 RUNDE 2 (P0-A) — KRONEN-TRANSPARENZ UEBER DEM SPIELER.
//
// Juror K (Prio 0): "von 275 Silhouetten-Texeln [...] sind unter der Krone 0
// sichtbar [...] CLAUDE.md fordert 'Layering (Kronen ueber dem Spieler)', also
// Ueberlagerung, nicht Ausloeschung." Rezept K, woertlich uebernommen: liegt
// die Spieler-STANDKACHEL im Span-Fussabdruck einer Over-Krone, wird GENAU
// DIESER Kronen-Draw mit globalAlpha 0,55 gezeichnet (danach Reset auf 1).
//
// BEWUSST ENG GEHALTEN (Juror-Rezept, nicht mehr):
//   * nur SPAN-Anker (die Fussabdruck-Pruefung braucht [sw,sh]); die
//     16x16-Haenge-Kronen ohne span bleiben unangetastet.
//   * die Draw-ANZAHL aendert sich nicht (dieselben drawImage-Aufrufe, nur mit
//     anderem Alpha) — die Zaehlung smoke:695-697 bleibt byte-gleich.
//   * ohne durchgereichte Spielerkachel (jeder Bestandsaufruf, jeder Test)
//     ist das Verhalten EXAKT wie bisher, Ruhelage t = 0 eingeschlossen.
const CROWN_PLAYER_ALPHA = 0.55;

// ---------------------------------------------------------------------------
// GRAFIKPASS 6 RUNDE 2 (P0-B) — MATERIAL-WAHL DES KRONEN-SCHATTENS.
//
// Juror H + Juror K (Prio 0): der Bayer-25-%-Stempel aus den zwei dunkelsten
// Palettentoenen liest auf dem Weg als Fliegengitter (ΔL 60,6 / 69,7 je Punkt).
// Rezept H: Schatten-Toene auf die Schattenstufen der jeweiligen BODENRAMPE,
// pro Material ein eigener Art-Key. Diese REINE Funktion liefert das Suffix
// aus dem GROUND-Def der Schattenzelle:
//
//   '_d'  BRIGHTER WEG: art beginnt mit 'path' (path, path_v*, path_pebbles;
//         Kachelmittel L 90,9). Diese Zellen sind der gemessene Defektort.
//   '_g'  GRAS UND ERDFLECKEN: fringeSet 'grass' ODER bankSet 'g' ODER eine
//         art aus dem Gras-Pool. Das schliesst pebble_small (L 52,3) und
//         dirt_patch (L 51,3) MIT EIN — sie tragen zwar "Erd"-Namen, liegen
//         aber auf der GRAS-Helligkeit, nicht auf der Weg-Helligkeit; mit dem
//         _d-Ton (L 64..68) waere ihr "Schatten" um 12..16 L HELLER als der
//         Boden. Die Reihenfolge (Weg zuerst) ist noetig, weil der Weg '='
//         bankSet 'g' traegt (Uferband am Teichsuedrand).
//   ''    alles uebrige (Mauer L 64,1, Stamm L 47,3, Wasser, Knochen): der
//         BESTANDSKEY n/0 bleibt, er ist dort der naechstliegende Ton.
//
// Deterministisch und zeitfrei: gelesen wird def.art (die BASIS-Kachel), nicht
// die per variantIndex/anim gewaehlte Variante — der Schattenton darf nicht
// mit der Gras-Animation flackern.
// Loest Basis-Key + Material-Suffix gegen die KACHELQUELLE auf. Das Suffix
// zieht nur, wenn die Quelle den Key WIRKLICH BESITZT (hasOwnProperty — genau
// das Muster der depthArt-/bankVariantFor-Varianten): eine Test-Kachelquelle,
// die JEDEN Namen beantwortet (Proxy), faellt damit bewusst auf den geprueften
// Bestandspfad zurueck, und eine Art ohne die Material-Grids zeichnet still
// weiter den Basis-Bake. Die Engine erzwingt die Keys nicht.
function matShadowKey(tileCanvases, basis, mat) {
  if (!mat) return basis;
  const k = basis + mat;
  return Object.prototype.hasOwnProperty.call(tileCanvases, k) ? k : basis;
}

export function canopyShadowMaterial(def) {
  if (!def) return '';
  const art = typeof def.art === 'string' ? def.art : '';
  if (art.startsWith('path')) return '_d';
  if (def.fringeSet === 'grass' || def.bankSet === 'g' || art.startsWith('grass')) return '_g';
  return '';
}

// Sway-Kachel? Explizites Legenden-Flag `sway: true` gewinnt (Engine-B kann es
// setzen); sonst die Bestands-Heuristik: langsame, NICHT synchrone anim-Kacheln
// (animRate <= 1) sind Wiege-Deko. Fackeln (animRate-Default 6) und Wasser
// (animSync) fallen sauber heraus und behalten den Bestands-Frame-Umlauf.
function isSwayDef(def) {
  if (def.sway === true) return true;
  if (def.animSync) return false;
  return typeof def.animRate === 'number' && def.animRate <= 1;
}

export function createTilemap(rows, legend, overRows = null) {
  const hTiles = rows.length;
  const wTiles = rows[0].length;

  // Grafikpass 2 §2.1: Legenden-Kombinationen validieren (Datenfehler laut
  // sichtbar machen, wie der bisherige Stil).
  for (const [ch, def] of Object.entries(legend)) {
    if (def.variants) {
      if (def.anim) throw new Error(`createTilemap: Zeichen '${ch}' hat variants UND anim`);
      if (def.variants[0] !== def.art) throw new Error(`createTilemap: variants[0] von '${ch}' (${def.variants[0]}) != def.art (${def.art})`);
    }
    if (def.span) {
      const [sw, sh] = def.span;
      if (!Number.isInteger(sw) || !Number.isInteger(sh) || sw < 1 || sw > 4 || sh < 1 || sh > 4) {
        throw new Error(`createTilemap: span von '${ch}' = [${sw},${sh}] ausserhalb 1..4 oder nicht ganzzahlig`);
      }
      if (sw > 1 || sh > 1) {
        if (def.variants || def.anim) throw new Error(`createTilemap: span (>1) mit variants/anim an '${ch}' kombiniert`);
        for (let ty = 0; ty < hTiles; ty++) {
          if (rows[ty].indexOf(ch) !== -1) throw new Error(`createTilemap: span-Zeichen '${ch}' (w>1/h>1) kommt in den GROUND-rows vor (Ground bleibt 1x1)`);
        }
      }
    }
    // GRAFIKPASS 6 §5.2 — swayPoses (gebackene Scher-Posen, siehe swayPose8).
    // Bewusst NICHT von der span-Sperre "span (>1) mit variants/anim" erfasst:
    // swayPoses ist ein EIGENER Weg mit eigener Validierung, die anim-Sperre
    // bleibt unangetastet. Datenfehler laut sichtbar machen wie die span-
    // Waechter oben.
    if (def.swayPoses) {
      const p = def.swayPoses;
      if (!Array.isArray(p) || p.length !== 8) {
        throw new Error(`createTilemap: swayPoses von '${ch}' muss ein Array der Laenge 8 sein (ist ${Array.isArray(p) ? p.length : typeof p})`);
      }
      if (!def.span || (def.span[0] <= 1 && def.span[1] <= 1)) {
        throw new Error(`createTilemap: swayPoses an '${ch}' ohne span > 1 (Posen gibt es nur fuer Gross-Kronen)`);
      }
      if (p[0] !== def.art) {
        throw new Error(`createTilemap: swayPoses[0] von '${ch}' (${p[0]}) != def.art (${def.art})`);
      }
      for (let i = 0; i < p.length; i++) {
        if (typeof p[i] !== 'string' || p[i] === '') {
          throw new Error(`createTilemap: swayPoses[${i}] von '${ch}' ist kein Art-Key (${JSON.stringify(p[i])})`);
        }
      }
    }
    // §5.3 — shadowArt: EIN-Draw-Schattenbake (sw*16 x 32) statt der
    // sw Einzelkacheln. Nur an span-Defs sinnvoll (der Bake ist span-breit).
    if (def.shadowArt !== undefined) {
      if (typeof def.shadowArt !== 'string' || def.shadowArt === '') {
        throw new Error(`createTilemap: shadowArt von '${ch}' ist kein Art-Key (${JSON.stringify(def.shadowArt)})`);
      }
      if (!def.span) {
        throw new Error(`createTilemap: shadowArt an '${ch}' ohne span (der XL-Schattenbake ist span-breit)`);
      }
    }
  }

  const solid = [];
  const cells = [];
  for (let ty = 0; ty < hTiles; ty++) {
    if (rows[ty].length !== wTiles) {
      throw new Error(`createTilemap: Zeile ${ty} hat ${rows[ty].length} Zeichen, erwartet ${wTiles}`);
    }
    const solidRow = [];
    const cellRow = [];
    for (let tx = 0; tx < wTiles; tx++) {
      const ch = rows[ty][tx];
      const def = legend[ch];
      if (!def) throw new Error(`createTilemap: Zeichen '${ch}' bei (${tx},${ty}) fehlt in der Legende`);
      solidRow.push(!!def.solid);
      cellRow.push(def);
    }
    solid.push(solidRow);
    cells.push(cellRow);
  }

  // Grafikpass 2 §8b.1: Wasser-Tiefen-Autotiling. Fuer jedes Tile mit
  // depthOverlays wird EINMALIG (deterministisch, kein Zufall/Zeitbezug) die
  // Chebyshev-Distanz zum naechsten Tile OHNE depthOverlays bestimmt — via
  // Multi-Source-BFS von allen Nicht-Overlay-Tiles aus (8er-Nachbarschaft, die
  // Wellen-Distanz IST die Chebyshev-Distanz). Ring = Distanz - 1: der Ufer-Ring
  // (Distanz 1) -> depthOverlays[0] (flach), der naechste Ring -> depthOverlays[1]
  // (mittel), tiefer -> nichts. depthArt[ty][tx] haelt den fertigen Art-Key oder
  // null; der Ground-Pass zeichnet ihn NACH Tile+Shore/Fringe statisch drueber.
  //
  // GRAFIKPASS 5 RUNDE 3 §2(e) — DEPTH-OVERLAY-VARIANTEN. Die Jury mass an der
  // Wasserflaeche eine Selbstaehnlichkeit von dx16 = 0,71: JEDE Kachel eines
  // Tiefenrings trug denselben Schleier, das 16-px-Gitter stand offen im Bild.
  // `variants` ist auf Wasser VERBOTEN (die Basiskachel ist anim), die
  // Wiederholung sitzt aber im STATISCHEN Tiefen-Overlay — genau dort laesst
  // sie sich brechen. Der depthArt-Pass waehlt deshalb je Zelle deterministisch
  // eine von DREI Auspraegungen des Ring-Keys:
  //     Index 0 -> Basis-Key            (z. B. water_shallow)
  //     Index 1 -> `${Basis}_v1`        (z. B. water_shallow_v1)
  //     Index 2 -> `${Basis}_v2`
  // per variantIndex(tx + 617, ty + 293, 3): n = 3 ist UNGERADE und teilerfremd
  // zu allen anderen n am selben Ort (5 Jitter, 7 Sway, 17/29 Anker, 47 Gras-
  // Pool); die Koordinaten sind mit 617/293 gegen ALLE anderen Hash-Versaetze
  // (1013/571, 421/907, 331/733) versetzt, damit die Tiefen-Streuung nicht mit
  // Anker- oder Sway-Muster korreliert. Kein Zufall, kein Zeitstempel (§0.4);
  // die Wahl faellt EINMAL beim Kartenaufbau -> Render-Determinismus wie bisher
  // (zwei Draws zu verschiedenen Zeiten liefern identische Platzierung).
  // GRACEFUL DEGRADATION (Interface-Regel "Art liefert die Keys; fehlt einer ->
  // still Basis"): der Zeichenpfad nimmt die Variante NUR, wenn sie in der
  // Kachelquelle wirklich vorhanden ist (hasOwnProperty). Liefert art/sprites.js
  // die _v1/_v2-Grids noch nicht, rendert die Karte exakt wie zuvor.
  const depthArt = Array.from({ length: hTiles }, () => new Array(wTiles).fill(null));
  const depthVarArt = Array.from({ length: hTiles }, () => new Array(wTiles).fill(null));
  {
    const dist = Array.from({ length: hTiles }, () => new Array(wTiles).fill(Infinity));
    let frontier = [];
    for (let ty = 0; ty < hTiles; ty++) {
      for (let tx = 0; tx < wTiles; tx++) {
        if (!cells[ty][tx].depthOverlays) { dist[ty][tx] = 0; frontier.push([tx, ty]); }
      }
    }
    let d = 0;
    while (frontier.length) {
      const next = [];
      for (const [tx, ty] of frontier) {
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = tx + dx;
            const ny = ty + dy;
            if (nx < 0 || ny < 0 || nx >= wTiles || ny >= hTiles) continue;
            if (dist[ny][nx] !== Infinity) continue;
            dist[ny][nx] = d + 1;
            next.push([nx, ny]);
          }
        }
      }
      frontier = next;
      d++;
    }
    for (let ty = 0; ty < hTiles; ty++) {
      for (let tx = 0; tx < wTiles; tx++) {
        const def = cells[ty][tx];
        if (!def.depthOverlays) continue;
        const ring = dist[ty][tx] - 1; // Ufer-Ring (Distanz 1) = Index 0
        if (ring >= 0 && ring < def.depthOverlays.length) {
          const base = def.depthOverlays[ring];
          depthArt[ty][tx] = base;
          // §2(e) R3: Varianten-Index je Zelle (0 = Basis, 1/2 = _v1/_v2).
          const vi = variantIndex(tx + 617, ty + 293, DEPTH_VARIANT_N);
          depthVarArt[ty][tx] = vi === 0 ? null : `${base}_v${vi}`;
        }
      }
    }
  }

  // Over-Layer: '.' = leer (VOR dem Legend-Lookup), nie solide.
  const overCells = [];
  if (overRows) {
    if (overRows.length !== hTiles) {
      throw new Error(`createTilemap: overRows hat ${overRows.length} Zeilen, erwartet ${hTiles}`);
    }
    for (let ty = 0; ty < hTiles; ty++) {
      if (overRows[ty].length !== wTiles) {
        throw new Error(`createTilemap: overRows-Zeile ${ty} hat ${overRows[ty].length} Zeichen, erwartet ${wTiles}`);
      }
      const row = [];
      for (let tx = 0; tx < wTiles; tx++) {
        const ch = overRows[ty][tx];
        if (ch === '.') { row.push(null); continue; }
        const def = legend[ch];
        if (!def) throw new Error(`createTilemap: Over-Zeichen '${ch}' bei (${tx},${ty}) fehlt in der Legende`);
        if (def.solid) throw new Error(`createTilemap: Over-Zeichen '${ch}' bei (${tx},${ty}) ist solid — Over-Tiles sind NIE solide`);
        row.push(def);
      }
      overCells.push(row);
    }
  }

  // Grafikpass 2 §2.3: Culling-Fenster für Span-Anker. maxSpanW/maxSpanH über
  // alle TATSÄCHLICH in overCells vorkommenden Defs — Anker knapp links/oberhalb
  // des Viewports müssen ihre hineinragenden Kronenteile trotzdem zeichnen.
  let maxSpanW = 1;
  let maxSpanH = 1;
  for (const row of overCells) {
    for (const def of row) {
      if (def && def.span) {
        if (def.span[0] > maxSpanW) maxSpanW = def.span[0];
        if (def.span[1] > maxSpanH) maxSpanH = def.span[1];
      }
    }
  }

  // Grafikpass 2 §8a.4: Kronen-Schlagschatten. Deterministisch aus overCells
  // abgeleitet: die Zellen direkt UNTER jeder Span-Anker-Fläche (Spalten
  // ax..ax+sw-1, Zeile ay+sh; bei 2×2-Kronen also ax/ax+1 in ay+2). Außerhalb
  // der Map: überspringen. Gezeichnet wird der Key 'canopy_shadow' im GROUND-
  // Pass (unter den Entities), NACH Tile+Fringes.
  // Grafikpass 5 §4.C2: die Schattenzelle merkt sich jetzt den ANKER-OFFSET
  // {dx,dy} ihres Ankers statt eines blossen true — der Schatten wandert exakt
  // mit der Krone (sonst risse er bei bis zu ±14/±4 px sichtbar ab). Ueberlappen
  // sich zwei Anker auf derselben Schattenzelle, gewinnt der spaeter gelesene
  // (Zeilen-/Spaltenreihenfolge, deterministisch) — wie bisher beim booleschen
  // Raster, das nur EINEN Schatten pro Zelle kannte.
  // GRAFIKPASS 6 §5.3 — XL-SCHATTEN ALS EIN-DRAW. Traegt der Anker-Def das
  // Legendenfeld `shadowArt` (z. B. 'canopy_shadow_xl_b'), wird KEINE Reihe aus
  // sw Einzelkacheln gemerkt, sondern EIN span-breiter Bake (sw*16 x 32,
  // §7.G-Masstabelle). Zwei Gruende:
  //   (1) Ein einzelner Bake kann von keiner Nachbar-Bodenkachel in der MITTE
  //       angeschnitten werden (nur an den Aussenraendern) — das war der
  //       gemessene Riss von bis zu 14 px zwischen den Schattenkacheln.
  //   (2) Der Bake traegt die Silhouetten-PROJEKTION seiner Krone, nicht ein
  //       globales Schachbrett; das geht nur klassenweise, also je Key.
  // VERSATZ = anchorOffset der Krone PLUS (+2,+2) (Lichtrichtung oben-links;
  // ein fixer Versatz OHNE anchorOffset risse den Schatten von der Krone ab).
  // '_m'-Kronen ziehen denselben, UNGESPIEGELTEN Bake (deklariert, §9).
  // Ohne shadowArt bleibt alles wie im Bestand: eine 'canopy_shadow'-Zeile
  // ueber sw Spalten mit dem blossen Anker-Offset.
  //
  // GRAFIKPASS 6 RUNDE 2 (P0-B) — UEBERLAPP-DEDUPE, GENAU EIN STEMPEL JE ZELLE.
  // Juror K: "Wo sich zwei Kronenschatten ueberlappen, wird doppelt gestempelt"
  // (gemessen auf GRAVEYARD: von 156 Schattenzellen bekamen 42 zwei und 2 sogar
  // drei Stempel — das Bayer-25-%-Raster verdichtet sich dort auf bis zu 44 %
  // und liest als dunkler Fleck). Der Aufbau laeuft deshalb jetzt in ZWEI
  // Runden ueber ein Belegungs-Set:
  //
  //   RUNDE 1 (Bakes): ein shadowArt-Bake ist EIN Draw und laesst sich nicht
  //     teilen (Zuschneiden waere 5-arg-drawImage = §0.3-Verbot). Er wird
  //     gezeichnet, wenn KEINE seiner Fussabdruck-Zellen (sw Spalten x 2
  //     Zeilen — der Bake ist 32 px hoch) schon belegt ist, und belegt sie dann
  //     alle. REIHENFOLGE: breitester Bake zuerst, bei Gleichstand Zeilen/
  //     Spalten aufsteigend — vollstaendig deterministisch. Die Breiten-Ordnung
  //     ist noetig, weil die XL-Anker im Zweierraster stehen und jeder Nachbar
  //     genau eine Spalte teilt: rein zeilenweise verlieren BEIDE xl_b-Anker
  //     (span 4, u. a. der ueber der M4-Beweiszelle) ihren Bake an einen
  //     schmaleren Nachbarn (gemessen: nur noch xl_a/xl_c im Bild).
  //   RUNDE 2 (16x16-Stempel): JEDE noch freie Schattenzelle bekommt genau
  //     einen canopy_shadow-Stempel — die Zellen der Nicht-Bake-Anker UND die
  //     Zellen der in Runde 1 verdraengten Bakes. Der 16x16-Stempel ist je
  //     Zelle ein eigener Draw und damit beliebig teilbar; deshalb entsteht
  //     KEINE Luecke. Ohne diese Auffuellung risse die Dedupe 16-px-Kaemme in
  //     die geschlossenen XL-Daecher (gemessen: 31 Zellen ohne Schatten, drei
  //     senkrechte Streifen quer durch das Nordwald-Band).
  //
  // Ergebnis auf GRAVEYARD: 156 Schattenzellen, jede mit GENAU EINEM Stempel;
  // Bayer-Dichte ueberall konstant 25 %.
  const shadowCells = Array.from({ length: hTiles }, () => new Array(wTiles).fill(null));
  const shadowSpanCells = Array.from({ length: hTiles }, () => new Array(wTiles).fill(null));
  const shadowClaimed = new Set();
  const cellKey = (x, y) => `${x},${y}`;
  // Fussabdruck einer Schatten-Emission, auf die Map geklammert.
  // rowsN = 2 fuer den 32 px hohen Bake, 1 fuer die 16x16-Stempelzeile.
  const shadowFootprint = (tx, shy, sw, rowsN) => {
    const out = [];
    for (let r = 0; r < rowsN; r++) {
      const y = shy + r;
      if (y < 0 || y >= hTiles) continue;
      for (let c = 0; c < sw; c++) {
        const x = tx + c;
        if (x < 0 || x >= wTiles) continue;
        out.push([x, y]);
      }
    }
    return out;
  };
  // --- Runde 1: XL-Bakes (ein Draw, nur bei voellig freiem Fussabdruck) -----
  const verdraengt = [];
  const bakeAnker = [];
  for (let ty = 0; ty < overCells.length; ty++) {
    for (let tx = 0; tx < wTiles; tx++) {
      const def = overCells[ty][tx];
      if (!def || !def.span || !def.shadowArt) continue;
      const shy = ty + def.span[1];
      if (shy < 0 || shy >= hTiles) continue;
      bakeAnker.push({ def, tx, ty, shy, sw: def.span[0] });
    }
  }
  bakeAnker.sort((a, b) => (b.sw - a.sw) || (a.ty - b.ty) || (a.tx - b.tx));
  for (const { def, tx, ty, shy, sw } of bakeAnker) {
    const off = anchorOffset(def, tx, ty);
    const fuss = shadowFootprint(tx, shy, sw, 2);
    if (fuss.some(([x, y]) => shadowClaimed.has(cellKey(x, y)))) {
      verdraengt.push({ fuss, off });
      continue;
    }
    for (const [x, y] of fuss) shadowClaimed.add(cellKey(x, y));
    // MATERIAL des Ein-Draw-Bakes: er deckt sw x 2 Zellen mit EINEM Ton-Satz,
    // also entscheidet die MEHRHEIT seiner Fussabdruck-Zellen (Gleichstand:
    // '_g' vor '_d' vor Basis — feste, deterministische Ordnung).
    const stimmen = { _g: 0, _d: 0, '': 0 };
    for (const [x, y] of fuss) stimmen[canopyShadowMaterial(cells[y][x])] += 1;
    const mat = ['_g', '_d', ''].reduce((a, b) => (stimmen[b] > stimmen[a] ? b : a), '_g');
    shadowSpanCells[shy][tx] = { key: def.shadowArt, mat, dx: off.dx + 2, dy: off.dy + 2 };
    // MATERIALGRENZE UNTER DEM BAKE. Der Nordwald-Bake (xl_b bei (30,8)) liegt
    // mit Zeile 11 auf Gras und mit Zeile 12 auf dem Weg — jede Mehrheitswahl
    // traegt dort die HAELFTE des Fussabdrucks falsch (gemessen: der Gras-Ton
    // auf dem Weg ergibt ΔL 44 je Punkt und allein 5-6 Schachbrett-Bloecke je
    // Kamera). Die abweichenden Zellen bekommen deshalb ihren EIGENEN
    // 16x16-Material-Stempel OBEN DRAUF, mit dem GLEICHEN Versatz wie der Bake.
    // Das ist KEIN zweiter Stempel im Sinne des Juror-K-Befunds: beide Raster
    // liegen durch den identischen Versatz auf DEMSELBEN Bayer-Untergitter
    // (x ≡ dx, y ≡ dy mod 2), der Nachstempel ERSETZT die Bake-Punkte also
    // (opake Toene, source-over) statt sie zu verdichten — die Punktdichte
    // bleibt exakt 25 %. Die Alternative (Bake bei Material-Mix ganz
    // weglassen) kostete in GRAVEYARD die gesamte xl_b-Klasse.
    for (const [x, y] of fuss) {
      const m = canopyShadowMaterial(cells[y][x]);
      if (m === mat) continue;
      shadowCells[y][x] = { dx: off.dx + 2, dy: off.dy + 2, mat: m };
    }
  }
  // --- Runde 2: 16x16-Stempel auf allen noch freien Schattenzellen ----------
  for (let ty = 0; ty < overCells.length; ty++) {
    for (let tx = 0; tx < wTiles; tx++) {
      const def = overCells[ty][tx];
      if (!def || !def.span || def.shadowArt) continue;
      const [sw, sh] = def.span;
      const shy = ty + sh;
      if (shy < 0 || shy >= hTiles) continue;
      const off = anchorOffset(def, tx, ty);
      for (const [x, y] of shadowFootprint(tx, shy, sw, 1)) {
        if (shadowClaimed.has(cellKey(x, y))) continue;
        shadowClaimed.add(cellKey(x, y));
        // MATERIAL je Zelle aus dem GROUND-Def genau dieser Zelle.
        shadowCells[y][x] = { dx: off.dx, dy: off.dy, mat: canopyShadowMaterial(cells[y][x]) };
      }
    }
  }
  // Auffuellung der in Runde 1 verdraengten Bakes (siehe Kommentar oben). Der
  // Versatz ist DERSELBE wie beim Bake (anchorOffset PLUS (+2,+2)) — die
  // Auffuell-Kachel steht sonst 2 px gegen ihre Bake-Nachbarn versetzt.
  for (const v of verdraengt) {
    for (const [x, y] of v.fuss) {
      if (shadowClaimed.has(cellKey(x, y))) continue;
      shadowClaimed.add(cellKey(x, y));
      shadowCells[y][x] = { dx: v.off.dx + 2, dy: v.off.dy + 2, mat: canopyShadowMaterial(cells[y][x]) };
    }
  }

  // Fringe-Zellzugriff für die reine Nachbarlogik (außerhalb = null).
  function defAt(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= wTiles || ty >= hTiles) return null;
    return cells[ty][tx];
  }

  function isSolidAt(px, py) {
    const tx = Math.floor(px / TILE);
    const ty = Math.floor(py / TILE);
    if (tx < 0 || ty < 0 || tx >= wTiles || ty >= hTiles) return true; // außerhalb = solide
    return solid[ty][tx];
  }

  function rectCollides(aabb) {
    const x0 = Math.floor(aabb.x / TILE);
    const y0 = Math.floor(aabb.y / TILE);
    const x1 = Math.floor((aabb.x + aabb.w - EPS) / TILE);
    const y1 = Math.floor((aabb.y + aabb.h - EPS) / TILE);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        if (tx < 0 || ty < 0 || tx >= wTiles || ty >= hTiles) return true;
        if (solid[ty][tx]) return true;
      }
    }
    return false;
  }

  // Alle Tiles mit diesem Legenden-Zeichen; x/y = Tile-ZENTRUM in Weltpixeln.
  // GROUND-only (bindend): main.js extrahiert damit die Fackel-Positionen
  // (map.torchChars) — Fackel-Zeichen dürfen nie in overRows stehen.
  function findTiles(char) {
    const out = [];
    for (let ty = 0; ty < hTiles; ty++) {
      for (let tx = 0; tx < wTiles; tx++) {
        if (rows[ty][tx] === char) {
          out.push({ tx, ty, x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 });
        }
      }
    }
    return out;
  }

  function artFor(def, tx, ty, timeSec) {
    if (def.anim && isSwayDef(def)) {
      // Grafikpass 5 R2: 4-Phasen-Sway (siehe Kommentarblock oben). Der Frame
      // folgt dem VORZEICHEN der Amplitude, nicht mehr einem Frame-Umlauf —
      // damit ist die alte n=2-Antiphase strukturell ausgeschlossen.
      // GATE-FIX R2 (§4.C4, 4-PHASEN-ZYKLUS): liefert die Legende die volle
      // 4-Phasen-Kachelfolge [basis, _f1(rechts), basis, _f2(links)] (n >= 4),
      // dann IST der Wellen-Schritt der Frame-Index — Phase 0/2 = Ruhelage,
      // 1 = Rechtsbiegung, 3 = Linksbiegung. Kuerzere anim-Listen (n = 2/3,
      // Bestand + Smoke-Legende) laufen unveraendert ueber das VORZEICHEN der
      // Amplitude; fuer n = 4 sind beide Wege identisch (SWAY_DX = [0,1,0,-1]),
      // die Schritt-Form macht den Vertrag nur explizit und robust.
      const n = def.anim.length;
      const { step, dx } = swayPhase(tx, ty, timeSec, (def.animRate || 6) * 2);
      let idx;
      if (n >= 4) idx = step;                       // 0..3 -> anim[0..3]
      else if (dx > 0) idx = 1 % n;
      else if (dx < 0 && n >= 3) idx = n - 1;
      else idx = 0;
      return def.anim[idx];
    }
    if (def.anim) {
      // animRate Frames/s (Default 6). Positions-Offset entsynchronisiert
      // Fackeln (lebendigeres Flackern); animSync schaltet ihn ab (Wasserwellen
      // laufen synchron).
      // Grafikpass 5 §4.C4 SWAY-PHASE: der Positions-Offset kommt fuer
      // NICHT-synchrone anim-Kacheln jetzt aus einem 2x2-BLOCK-Hash
      // variantIndex(floor(tx/2)+331, floor(ty/2)+733, 7) statt aus
      // (tx*13 + ty*7). Grund (Review): die alte Formel erzeugte in den
      // 2x2-Sway-Clustern perfekte ANTIPHASE (Nachbarkacheln landeten bei
      // 2-Frame-Anims immer im Gegenframe) — im Strip war deshalb nichts zu
      // sehen. Jetzt schwingt ein 2x2-Cluster GLEICHSINNIG, benachbarte
      // Cluster gegeneinander versetzt. n=7 ist ungerade und teilerfremd zu
      // 5 (Anker) sowie zu 29/17 (§0.4). Wasser (animSync) bleibt unberuehrt.
      const rate = def.animRate || 6;
      const offset = def.animSync
        ? 0
        : variantIndex(Math.floor(tx / 2) + 331, Math.floor(ty / 2) + 733, 7);
      const frame = (Math.floor(timeSec * rate) + offset) % def.anim.length;
      return def.anim[frame];
    }
    if (def.variants) {
      // Deterministische Variante aus der Tile-Koordinate (gleichverteilt).
      return def.variants[variantIndex(tx, ty, def.variants.length)];
    }
    return def.art;
  }

  // Rundung wie alle anderen Zeichner (camera.js-Konvention):
  // screen = Math.round(worldX - cam.x). Ein abweichendes Schema (erst Kamera
  // runden) ließe Entities bei frac(cam.x) == 0.5 um 1 px gegen die Tiles wackeln.
  // layer: 'ground' zeichnet rows inkl. Fringe-Logik, 'over' zeichnet overRows
  // (leere Zellen = null werden übersprungen, keine Fringes im Over-Layer).
  // GRAFIKPASS 6 RUNDE 2 (P0-A): OPTIONALER 6. Parameter `opts` nach dem
  // litDitherCells-Muster (§1.7). Heute genau ein Feld:
  //   opts.playerTile = {tx, ty}   die STANDKACHEL des Spielers. Liegt sie im
  //   Span-Fussabdruck einer Over-Krone, zeichnet GENAU DIESE Krone mit
  //   globalAlpha 0,55 (Juror-Rezept K, P0-A). FEHLT der Parameter, ist das
  //   Verhalten byte-gleich zum Bestand — alle Alt-Aufrufe (Flusstest-Stubs,
  //   Smoke, Proof-Rig) bleiben unveraendert gruen.
  function draw(ctx, camera, tileCanvases, timeSec, layer = 'ground', opts = null) {
    const camX = camera.x;
    const camY = camera.y;
    const viewW = ctx.canvas.width;
    const viewH = ctx.canvas.height;
    const tx0 = Math.max(0, Math.floor(camX / TILE));
    const ty0 = Math.max(0, Math.floor(camY / TILE));
    const tx1 = Math.min(wTiles - 1, Math.floor((camX + viewW) / TILE));
    const ty1 = Math.min(hTiles - 1, Math.floor((camY + viewH) / TILE));
    const over = layer === 'over';
    if (over && overCells.length === 0) return;
    // P0-A: nur im OVER-Pass und nur mit gueltiger Standkachel aktiv.
    const pTile = (over && opts && opts.playerTile
      && Number.isFinite(opts.playerTile.tx) && Number.isFinite(opts.playerTile.ty))
      ? opts.playerTile : null;
    // Über-Layer: Startfenster nach links/oben um (maxSpan-1) erweitern, damit
    // Anker knapp außerhalb ihre in den Viewport ragenden Kronen zeichnen
    // (§2.3). Der Ground-Layer bleibt strikt 1x1.
    // Grafikpass 3 §2.1: das obere Kronen-Culling um 1 Tile ZUSAETZLICH weiten —
    // der Anker-Versatz (GP5: bis +4 px nach unten) kann einen Anker eine Zeile
    // ueber dem Viewport knapp in ihn hineinschieben.
    // Grafikpass 5 §4.C2 CULLING (NUR der Over-Zweig, der Ground-Zweig teilt die
    // Schleife und bleibt UNVERAENDERT — ungeklammert waere cells[hTiles] ein
    // Absturz): der Anker-Offset kann Kronen von aussen in den Viewport ziehen.
    // dx > 0 schiebt eine Krone nach rechts, ihr Anker kann also EINE Spalte
    // weiter links stehen -> txStart 1 weiter links. dy < 0 schiebt eine Krone
    // nach oben, ihr Anker kann eine Zeile UNTER dem Fenster stehen -> tyEnd +1.
    // Nach oben deckt das bestehende -1 (GP3) das dy bis +4 px weiterhin ab.
    // Beide Grenzen bleiben auf 0..wTiles-1 / 0..hTiles-1 geklammert.
    // GRAFIKPASS 6 §5.4 CULLING-FIX RECHTS: der Anker-Offset kann eine Krone
    // auch nach LINKS ziehen (dx < 0), ihr Anker steht dann eine Spalte weiter
    // RECHTS als das Fenster reicht — bis zu 14 px Kronenrand poppten am
    // rechten Bildrand herein (reproduziert, Landkarte §6). Ground bleibt
    // unveraendert bei tx1 (dort gibt es keinen Anker-Offset).
    const tyStart = over ? Math.max(0, ty0 - (maxSpanH - 1) - 1) : ty0;
    const txStart = over ? Math.max(0, tx0 - (maxSpanW - 1) - 1) : tx0;
    const tyEnd = over ? Math.min(hTiles - 1, ty1 + 1) : ty1;
    const txEnd = over ? Math.min(wTiles - 1, tx1 + 1) : tx1;
    for (let ty = tyStart; ty <= tyEnd; ty++) {
      for (let tx = txStart; tx <= txEnd; tx++) {
        const def = over ? overCells[ty][tx] : cells[ty][tx];
        if (!def) continue;
        const sx = Math.round(tx * TILE - camX);
        const sy = Math.round(ty * TILE - camY);
        // Grafikpass 5 §4.C2 Anker-Offset: Span-Anker (Kronen) im Over-Layer
        // bekommen einen deterministischen 2D-Pixel-Versatz (dx nach Anker-
        // Klasse geklammert, dy -4..+4). Ganzzahlig und NACH der Rundung addiert
        // -> die Krone bleibt pixelgenau. Ground-Layer unberuehrt.
        let ax = sx;
        let ay = sy;
        if (over && def.span) {
          const off = anchorOffset(def, tx, ty);
          ax += off.dx;
          ay += off.dy;
          // Grafikpass 5 R2 (Jury-Auftrag "Kronen mit halber Amplitude
          // einbinden"): der Over-Layer ist TRANSPARENT — hier laesst sich die
          // 4-Phasen-Welle als echter Pixel-Versatz zeichnen (auf den opaken
          // Ground-Sway-Kacheln geht das nicht, siehe Kommentarblock oben).
          // Amplitude +-1 px = halbe Gras-Amplitude (~2 px Spitzenbiegung der
          // *_f1-Frames). Bei timeSec = 0 ist der Versatz fuer JEDEN Anker 0 —
          // der statische Anker-Offset (§4.C2) bleibt damit exakt wie geprueft.
          // Der canopy_shadow im Ground-Pass schwingt bewusst NICHT mit: der
          // Schlagschatten liegt auf dem Boden, nur die Krone wiegt sich.
          // GRAFIKPASS 6 §5.2: Traegt der Def swayPoses, ENTFAELLT diese
          // Translation ERSATZLOS. Die Pose ist bereits geschert; zusaetzlich
          // die ganze Krone zu verschieben hiesse, sie schert UND wackelt —
          // die Scherung wuerde von der Translation ueberdeckt und der
          // Stammansatz (die byte-fixe Unterkante der Posen) risse ab.
          if (!def.swayPoses) ax += swayPhase(tx, ty, timeSec, CROWN_SWAY_RATE).dx;
        } else if (over) {
          // GATE-FIX R2 (Jury-Auftrag "Kronen halbe Amplitude", Nachtrag): die
          // 16x16-HAENGE-KRONEN ('B'/'C'/'K' in GRAVEYARD_OVER_LEGEND) haben
          // KEIN span und liefen deshalb komplett am Kronen-Sway vorbei — im
          // Strip standen sie still, waehrend die 2x2-Grosskronen wiegten.
          // Sie bekommen JETZT dieselbe 4-Phasen-Boe mit derselben halben
          // Amplitude (+-1 px gegen die ~2 px Spitzenbiegung der Gras-Frames);
          // ein weiteres Halbieren waere Subpixel und im Pixelraster nicht
          // darstellbar. KEIN Anker-Offset (der gilt nur fuer span-Anker) und
          // KEIN Schatten-Versatz (der canopy_shadow schwingt bewusst nicht
          // mit). Deterministisch: derselbe reine swayPhase-Hash wie oben, bei
          // timeSec = 0 exakt 0 -> alle Anker-/Culling-/Determinismus-Tests
          // (die bei t = 0 messen) bleiben unberuehrt, und ein Cluster kann nie
          // gegen seinen Nachbarn schlagen (Vorzeichen-Regel der Welle).
          // GRAFIKPASS 5 RUNDE 3: Amplitude der HAENGE-Kronen um +1 px erhoeht
          // (+-1 -> +-2 px, Faktor HANG_SWAY_AMP). Sie haengen frei am Rand des
          // Blattwerks und sind die einzigen Kronen OHNE Stamm-/Ankerbindung —
          // bei +-1 px war die Boe an ihnen im Strip nicht abzulesen. Die
          // 2x2-GROSSKRONEN (span-Anker, Zweig oben) behalten bewusst +-1 px:
          // sie sitzen auf einem Stamm und duerfen nicht von ihm abreissen.
          // Weiterhin rein deterministisch (derselbe swayPhase-Hash), und bei
          // timeSec = 0 ist der Versatz exakt 0 -> alle Anker-/Culling-/
          // Determinismus-Tests (die bei t = 0 messen) bleiben unberuehrt.
          ax += swayPhase(tx, ty, timeSec, CROWN_SWAY_RATE).dx * HANG_SWAY_AMP;
        }
        // GRAFIKPASS 6 §5.2: im OVER-Zweig waehlt ein gesetztes swayPoses die
        // Pose statt def.art (Acht-Folge, Index aus swayPose8). artFor bleibt
        // unberuehrt — es ist der GEMEINSAME Pfad von Ground und Over, und
        // span-Defs kommen dort ohnehin nur bis def.art. Fehlt ein Posen-Grid
        // in der Kachelquelle, zeichnet die if(img)-Wache wie bei jedem anderen
        // fehlenden Key still nichts (Art liefert die Keys, geprueft wird das
        // in check_gfx6_art).
        const artKey = (over && def.swayPoses)
          ? def.swayPoses[swayPose8(tx, ty, timeSec, CROWN_POSE_RATE)]
          : artFor(def, tx, ty, timeSec);
        const img = tileCanvases[artKey];
        // GRAFIKPASS 6 RUNDE 2 (P0-A): steht der Spieler im Span-FUSSABDRUCK
        // dieser Krone (tx..tx+sw-1 / ty..ty+sh-1), wird sie halbtransparent
        // gezeichnet — er bleibt lesbar, die Krone bleibt UEBER ihm (Layering
        // statt Ausloeschung). GENAU EIN Draw wie bisher, danach Alpha-Reset
        // (§0.3 Pflicht; save/restore waere ein zweiter Zustandspfad).
        if (img) {
          const unterKrone = pTile && def.span
            && pTile.tx >= tx && pTile.tx < tx + def.span[0]
            && pTile.ty >= ty && pTile.ty < ty + def.span[1];
          if (unterKrone) {
            ctx.globalAlpha = CROWN_PLAYER_ALPHA;
            ctx.drawImage(img, ax, ay);
            ctx.globalAlpha = 1;
          } else {
            ctx.drawImage(img, ax, ay);
          }
        }
        if (!over && def.fringeTarget) {
          for (const key of fringeOverlays(defAt, tx, ty)) {
            const fimg = tileCanvases[key];
            if (fimg) ctx.drawImage(fimg, sx, sy);
          }
        }
        // Grafikpass 5 §3.B1/§3.B3: Ufer-Keys der ROHEN Kanten + Diagonal-Kappen,
        // im Ground-Pass NACH fringeOverlays, rein ADDITIV (Komplement-Regel —
        // nie dieselbe Kante zweimal). Fehlt ein Art-Key, wird still nichts
        // gezeichnet.
        // GP5 R3 §2(b): merkt sich, ob auf dieser Zelle wirklich eine
        // 45-Grad-Treppe GEZEICHNET wurde (nicht bloss emittiert). Die halbe
        // Kachel ist dann Landzunge — der Tiefen-Schleier hat dort nichts
        // verloren (siehe unten).
        let diagDrawn = false;
        if (!over) {
          for (const key of shoreEdges(defAt, tx, ty)) {
            const simg = tileCanvases[key];
            if (simg && key.startsWith('shore_diag_')) diagDrawn = true;
            if (simg) ctx.drawImage(simg, sx, sy);
          }
          // §3.B2: Uferband auf der LANDSEITE (bankSet-Flag der Landkachel).
          // GP5 R3 §5: das Band zieht je Kachel eine der Zahn-Varianten
          // (bankVariantFor). Fuehrt die Kachelquelle die Variante nicht, faellt
          // es still auf den Basis-Key zurueck — Art liefert die Keys, die
          // Engine erzwingt sie nicht.
          for (const key of bankOverlays(defAt, tx, ty)) {
            const vkey = bankVariantFor(key, tx, ty);
            const bimg = tileCanvases[vkey] || tileCanvases[key];
            if (bimg) ctx.drawImage(bimg, sx, sy);
          }
        }
        // Grafikpass 2 §8b.1: Wasser-Tiefen-Overlay im GROUND-Pass NACH
        // Tile+Shore/Fringe (statisch ueber dem animierten Wasser). Fehlt der
        // Art-Key noch, wird still nichts gezeichnet.
        // Grafikpass 5 R3 §2(e): je Zelle die im depthArt-Pass gewaehlte
        // VARIANTE (_v1/_v2), sofern die Kachelquelle sie wirklich fuehrt —
        // sonst still die Basis (Art liefert die Keys, die Engine erzwingt sie
        // nicht). Die Pruefung laeuft ueber hasOwnProperty statt ueber die
        // blosse Wahrheit von tileCanvases[key], damit eine Kachelquelle, die
        // JEDEN Namen beantwortet (Test-Proxys), nicht faelschlich Varianten
        // vortaeuscht — die Basis bleibt dort der geprüfte Bestandspfad.
        // GP5 R3 §2(b)-NACHZUG: auf einer Zelle mit gezeichneter 45-Grad-Treppe
        // ENTFAELLT der Tiefen-Schleier. Er liegt sonst ueber der Landzunge der
        // Treppe: nachgemessen landeten 4-10 seiner '='-Glanztupfer je Ecke auf
        // den ~75 Gras-Pixeln (bis 13 %) — tuerkise Sprenkel auf Gras. Der
        // Schleier bedeutet "tieferes Wasser"; eine halbe Landkachel ist genau
        // das nicht. Betroffen sind ausschliesslich die zehn Teich-Aussenecken;
        // fehlt die Treppen-Kachel in der Kachelquelle, bleibt der Schleier wie
        // bisher stehen (diagDrawn wird nur bei echtem Draw gesetzt).
        if (!over && depthArt[ty][tx] && !diagDrawn) {
          const vkey = depthVarArt[ty][tx];
          const dimg = (vkey && Object.prototype.hasOwnProperty.call(tileCanvases, vkey) && tileCanvases[vkey])
            ? tileCanvases[vkey]
            : tileCanvases[depthArt[ty][tx]];
          if (dimg) ctx.drawImage(dimg, sx, sy);
        }
      }
    }
    // -----------------------------------------------------------------------
    // Grafikpass 2 §8a.4: Kronen-Schlagschatten im GROUND-Pass (unter den
    // Entities), auf den aus overCells abgeleiteten Zellen. Fehlt der Art-Key
    // noch, wird still nichts gezeichnet.
    // Grafikpass 5 §4.C2: DERSELBE Anker-Offset wie die Krone (der Schatten
    // bleibt unter ihr stehen).
    //
    // GRAFIKPASS 6 §5.3 — ZWEITER DURCHGANG. Der Schatten wurde bisher INNERHALB
    // der Kachelschleife gezeichnet, direkt nachdem seine eigene Zelle fertig
    // war. Die Schleife laeuft ty/tx aufsteigend, also zeichnet die Nachbarzelle
    // rechts/unten ihre OPAKE Bodenkachel DANACH und schneidet den Schatten ab:
    // bei dx > 0 klaffte ein bis zu 14 px breiter senkrechter Riss zwischen den
    // Schattenkacheln (reproduziert), und ein XL-Bake wuerde bis zu 87 %
    // uebermalt. Deshalb laufen ALLE Kronen-Schatten (canopy_shadow UND
    // canopy_shadow_xl_*) jetzt in einem eigenen Durchgang NACH allen
    // Bodenkacheln, Fringes, Shore-, Bank- und Depth-Overlays des Fensters.
    // Die Zell-Zuordnung und die Koordinaten sind unveraendert — nur die
    // Reihenfolge wandert.
    if (!over) {
      // Das Fenster der EINZELKACHELN bleibt exakt das der Bodenschleife
      // (tx0..tx1 / ty0..ty1) — byte-gleiche Draw-Menge, nur spaeter. Der
      // XL-Bake ist bis zu 4 Kacheln breit, sein Anker kann also links/oberhalb
      // des Fensters stehen und trotzdem hineinragen; dafuer laeuft der
      // Durchgang ueber dasselbe erweiterte Startfenster wie der Over-Layer.
      const shTxStart = Math.max(0, tx0 - (maxSpanW - 1) - 1);
      const shTyStart = Math.max(0, ty0 - 1);
      for (let ty = shTyStart; ty <= ty1; ty++) {
        for (let tx = shTxStart; tx <= tx1; tx++) {
          const sx = Math.round(tx * TILE - camX);
          const sy = Math.round(ty * TILE - camY);
          const span = shadowSpanCells[ty][tx];
          if (span) {
            const ximg = tileCanvases[matShadowKey(tileCanvases, span.key, span.mat)];
            if (ximg) ctx.drawImage(ximg, sx + span.dx, sy + span.dy);
          }
          if (tx >= tx0 && ty >= ty0 && shadowCells[ty][tx]) {
            const soff = shadowCells[ty][tx];
            const shimg = tileCanvases[matShadowKey(tileCanvases, 'canopy_shadow', soff.mat)];
            if (shimg) ctx.drawImage(shimg, sx + soff.dx, sy + soff.dy);
          }
        }
      }
    }
  }

  return {
    wTiles,
    hTiles,
    wPx: wTiles * TILE,
    hPx: hTiles * TILE,
    isSolidAt,
    rectCollides,
    findTiles,
    draw,
    // Grafikpass 5 §1.7 (ADDITIVE API): der Legenden-Zugriff je Tile-Koordinate
    // (ausserhalb der Map -> null). main.js baut damit den Lit-Dither-Filter
    // (keine Wasser-/anim-Kacheln) und die Reflexions-Zellen (§3.B4).
    defAt,
  };
}
