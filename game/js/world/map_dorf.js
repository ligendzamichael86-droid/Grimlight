// GRAMFELD — das Dorf (SPEC_SLICE_6 §6, Rev 2.1), 44x28 Tiles = 704x448 px.
// Reines Daten-Modul im Bestandsformat (ROWS/LEGEND/OVER-ROWS), Node-importierbar
// (kein window/document auf Modulebene). Bauform woertlich nach dem Muster
// world/map_fluestergruft.js.
//
// HERKUNFT DER DATEN (bindend, nichts hier ist geschaetzt): rows, overRows,
// Legende, playerSpawn, Portal, NPC-Anker und torchChars stammen ZEICHEN FUER
// ZEICHEN aus dem eingefrorenen Phase-0-Ergebnis
//   .tmp/slice6_p0/dorf_rows.txt  +  .tmp/slice6_p0/dorf_layout.json
// (Generator .tmp/slice6_p0/gen_dorf_layout.mjs, Deckungsmodell TRAUFE, 0 Fehler,
// Erreichbarkeit 1022/1022 begehbare Kacheln, 0 Inseln). Die Boden-Mischung ist
// als Eingabe der M1-Eichung GEBUNDEN (SLICE6_PHASE0 §4): 78,18 % Lehm-Pool n=9 /
// 14,78 % Weg ausgetreten n=5 / 4,01 % Lehm-Detail n=5 / 2,64 % Weg ueberwuchert
// n=7 — wer die Legende umhaengt, macht die Eichung ungueltig.
//
// DRAMATURGIE (GDD.md:38-40 "Gramfeld", Tristram-Stimmung):
// - Dauerzwielicht: ambient 0,28 / Tint #1a1410 (Phase-0-Eichung, M1-Band 56..69).
// - Vernagelte Fenster ('V'/'v') an den drei verlassenen Katen im Westen.
// - ZWEI Warmlichter, beide Pflicht-torchChars (Entscheid E5): 'F' Herdfeuer vor
//   Heddas Kate (SPEC A3, das eine rote Licht-Gate) und 'E' die Esse der Schmiede.
// - Haeuser sind NICHT betretbar (SPEC §6.1): 'T'/'t' sind Zustands-Deko
//   (zu/offen) und solide. Die Dach-Transparenz (tilemap.js CROWN_PLAYER_ALPHA)
//   greift deshalb nur beim Vorbeilaufen an der begehbaren TRAUFE — dem obersten
//   Streifen jedes Dach-Spans (Entscheid E2, Beweiszelle (12,7) hinter der
//   Schmiede).
// - KEINE Gegner, KEINE Props: das Dorf wird nicht gepluendert (§6.1).
//
// LEGENDEN-NAMENSRAUM (Entscheide E7/F5, deklariert): Legenden sind JE KARTE
// eigene Namensraeume. Hier gilt Mnemonik vor GRAVEYARD-Konvention —
// 'T'/'t' = Tuer zu/offen (GY: T = tree_trunk), 'Y' = toter Stamm (GY: Y =
// Over-Span Back-Krone), 'G' = Glocken-Joch (Palette 'G' = NPC-Stoff, anderer
// Namensraum). Das ist KEIN Widerspruch und darf von spaeteren Agenten nicht als
// solcher gewertet werden.
//
// ANKER-VERSATZ (Entscheid E1): die neun dorf_*-Over-Keys stehen mit W = 0 in
// der ANCHOR_CLAMP-Tabelle (world/tilemap.js) — Gebaeude sind keine Kronen, ihr
// Dach darf nicht von der Wand rutschen. Das dy (±4 px) bleibt ungeklammert;
// ART zeichnet jedes Dachgrid mit >= 4 px senkrechter Transparenz-Reserve.

import { tc, tileRect } from './coords.js';

// 44x28. Zeichenweise identisch zu .tmp/slice6_p0/dorf_rows.txt ("GRAMFELD rows").
// Merkpunkte: Kapelle (Nord, C/t), Schmiede (West-Mitte, W/E/A), Heddas Kate
// (Ost-Mitte, W/T/F), drei verlassene Katen (V/T/v), Speicher (Sued, Z), Brunnen
// 2x2 (1/2/3/4), geborstene Dorfglocke (5/6), Marktstand-Theke (7/8), Osttor-
// Schwelle (D, Portal) am rechten Kartenrand.
const DORF_ROWS = [
  '############################################',
  '#.,..,.....................................#',
  '#...........,.................,....,.......#',
  '#..Y....,.......,..,CCCC...................#',
  '#.,.................CtCv...............Y...#',
  '#....................SS............,.......#',
  '#.Y...,...,......,...==...............,....#',
  '#....................==,..,................#',
  '#,.....-...WWWW......==......WTv...b.......#',
  '#...VTV-...WtWv....,.==......===.,....,..Y.#',
  '#....------E==A=.....==......F=............#',
  '#.........======x=...==..,....=x..........,#',
  '#..b...,.b.,....,==============............#',
  '#..............x================x.,........#',
  '#..,............===12=======5=============D#',
  '#.....,.........===34=======6=============D#',
  '#......---------================...........#',
  '#......-........=======78=======...,.....,.#',
  '#.,.VTV....,....================...........#',
  '#................-..,....=x................#',
  '#..........-------.......=,........fff.....#',
  '#...,........-.......................f.....#',
  '#.Y.......VTV...........ZZZZ.........fb....#',
  '#.......................ZTZv.............,.#',
  '#.......b....,....,b..........,..,....,....#',
  '#...................................Y......#',
  '#......Y...................................#',
  '############################################',
];

// Over-Layer: NUR Span-Anker (Daecher, Glocken-Joch, Marktsegel, Torbogen).
// Zeichenweise identisch zu .tmp/slice6_p0/dorf_rows.txt ("GRAMFELD overRows").
// Der Anker steht in der linken OBEREN Zelle des Spans (GP6-Konvention); der
// Wandblock darunter ist span_w x (span_h - 1), die oberste Span-Zeile ist die
// begehbare Traufe (Modell TRAUFE, Entscheid E2).
const DORF_OVER_ROWS = [
  '............................................',
  '............................................',
  '....................K.......................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '...........R.................H..............',
  '....L.......................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '...........................G................',
  '........................................O...',
  '............................................',
  '.......................M....................',
  '....N.......................................',
  '............................................',
  '............................................',
  '............................................',
  '..........L.............r...................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
];

// EINE Legende fuer Ground UND Over (createTilemap nimmt genau eine, Muster
// GRAVEYARD). 38 Zeichen, alle in Gebrauch, alle aus dorf_layout.json.
// Alle variants-Listen tragen UNGERADES n (n-Waechter §2.A2/§0.6):
// '.' 9, ',' 5, '=' 5, '-' 7, '#' 3, 'W' 3, 'x' 3.
const DORF_LEGEND = {
  // --- begehbarer Grund ----------------------------------------------------
  // Lehm-Grund: der Boden-Pool n=9 aus der Erde-Rampe (dorf_boden_pool.json,
  // Palette-L-Mittel der Bodenflaeche 75,46 — Eingabe der M1-Eichung).
  '.': {
    art: 'dorf_lehm_00',
    solid: false,
    variants: ['dorf_lehm_00', 'dorf_lehm_01', 'dorf_lehm_02', 'dorf_lehm_03',
      'dorf_lehm_04', 'dorf_lehm_05', 'dorf_lehm_06', 'dorf_lehm_07', 'dorf_lehm_08'],
  },
  // Lehm-Detail (Kiesel/Scherben) — BESTANDS-Arts plus zwei Pool-Kacheln.
  // PHASE 4a NICHT GEAENDERT (gemeldet statt eigenmaechtig): die Streuung 23,9 L
  // dieser Liste haengt am DUNKELSTEN Eintrag 'dirt_patch' (Palette-L-Mittel
  // 51,3) — und der steht auf Index 0. Die Waechter smoke §6#4e und
  // check_gfx6_art [8] verlangen variants[0] === art; ihn zu tauschen hiesse
  // also, auch das art-Feld zu drehen. Eine REINE Listen-Aenderung kann die
  // Streuung nicht senken (dirt_patch bleibt Untergrenze).
  ',': {
    art: 'dirt_patch',
    solid: false,
    variants: ['dirt_patch', 'dirt_patch_v1', 'pebble_small', 'dorf_lehm_08', 'dorf_lehm_04'],
  },
  // Weg AUSGETRETEN: Dorfplatz + Hauptwege (BESTANDS-Arts, kein neues Grid).
  '=': {
    art: 'path',
    solid: false,
    variants: ['path', 'path_v1', 'path_v2', 'path_v3', 'path_v6'],
  },
  // Weg UEBERWUCHERT: die Pfade zu den drei verlassenen Katen.
  // SLICE 6 PHASE 4a (Juroren-Befund): die drei REINEN Gras-Kacheln
  // grass_g5_20/_34/_09 lasen als harte gruene Rechtecke im Lehmfeld (interne
  // Streuung der Liste 42,4 L). Sie sind durch dorf_lehm_08 / path_v5 ersetzt;
  // n bleibt UNGERADE (7, Wiederholung erlaubt — §2.A2/§0.6), variants[0]
  // bleibt gleich 'art'. Der Ueberwuchs wird jetzt allein von dirt_patch
  // getragen (die einzige verbliebene Gras-Kachel des Dorfs).
  '-': {
    art: 'path_v6',
    solid: false,
    variants: ['path_v6', 'dorf_lehm_08', 'path_v5', 'dirt_patch', 'path_v5',
      'path_v6', 'dorf_lehm_08'],
  },
  'S': { art: 'dorf_stufe', solid: false },      // Kapellenstufe (Corm steht darauf)
  // Osttor-Schwelle = die zwei Portal-Kacheln nach GRAVEYARD (GY-Konvention 'D').
  'D': { art: 'dorf_schwelle', solid: false },
  // --- solider Grund: Baukoerper -------------------------------------------
  '#': {
    art: 'dorf_palisade',
    solid: true,
    variants: ['dorf_palisade', 'dorf_palisade_v1', 'dorf_palisade_v2'],
  },
  'W': {
    art: 'dorf_wand',
    solid: true,
    variants: ['dorf_wand', 'dorf_wand_v1', 'dorf_wand_v2'],
  },
  'C': { art: 'dorf_wand_stein', solid: true },      // Kapellen-Steinwand
  'Z': { art: 'dorf_wand_bretter', solid: true },    // Speicher/Scheune
  'V': { art: 'dorf_wand_vernagelt', solid: true },  // GDD.md:38-40
  'v': { art: 'dorf_fenster_vernagelt', solid: true }, // Paar zu 'V'
  // Tueren sind DEKO und solide — die Haeuser sind nicht betretbar (§6.1).
  'T': { art: 'dorf_tuer_zu', solid: true },
  't': { art: 'dorf_tuer_offen', solid: true },
  // --- solider Grund: Feuer (die beiden torchChars, 3-Frame-Zyklus) ---------
  'F': {
    art: 'dorf_herdfeuer_0',
    solid: true,
    anim: ['dorf_herdfeuer_0', 'dorf_herdfeuer_1', 'dorf_herdfeuer_2'],
  },
  'E': {
    art: 'dorf_esse_0',
    solid: true,
    anim: ['dorf_esse_0', 'dorf_esse_1', 'dorf_esse_2'],
  },
  // --- solider Grund: Objekte ----------------------------------------------
  'A': { art: 'dorf_amboss', solid: true },
  '1': { art: 'dorf_brunnen_nw', solid: true },
  '2': { art: 'dorf_brunnen_no', solid: true },
  '3': { art: 'dorf_brunnen_sw', solid: true },
  '4': { art: 'dorf_brunnen_so', solid: true },
  '5': { art: 'dorf_glocke_kopf', solid: true },
  '6': { art: 'dorf_glocke_fuss', solid: true },
  '7': { art: 'dorf_theke_l', solid: true },      // Miles Platz
  '8': { art: 'dorf_theke_r', solid: true },
  'x': {
    art: 'dorf_fass',
    solid: true,
    variants: ['dorf_fass', 'dorf_kiste', 'dorf_fass_v1'],
  },
  // BESTANDS-Arts, kein neues Grid:
  'f': { art: 'fence', solid: true },
  'b': { art: 'bush_dead', solid: true },
  'Y': { art: 'tree_trunk', solid: true },
  // --- Over-Layer: Span-Anker, NIE solid -----------------------------------
  // 64x48-Daecher (span [4,3], Wandblock 4x2, oberste Zeile Traufe):
  'R': { art: 'dorf_dach_a', span: [4, 3], solid: false, shadowArt: 'dorf_bake_gross' },   // Schmiede
  'r': { art: 'dorf_dach_a_m', span: [4, 3], solid: false, shadowArt: 'dorf_bake_gross' }, // Speicher (gespiegelt)
  'K': { art: 'dorf_dach_b', span: [4, 3], solid: false, shadowArt: 'dorf_bake_gross' },   // Kapelle (steil)
  // 48x32-Daecher (span [3,2], Wandblock 3x1, oberste Zeile Traufe):
  'H': { art: 'dorf_dach_c', span: [3, 2], solid: false, shadowArt: 'dorf_bake_klein' },   // Heddas Kate, Stroh intakt
  'L': { art: 'dorf_dach_d', span: [3, 2], solid: false, shadowArt: 'dorf_bake_klein' },   // verlassene Kate, Stroh loechrig
  'N': { art: 'dorf_dach_d_m', span: [3, 2], solid: false, shadowArt: 'dorf_bake_klein' }, // dito, gespiegelt
  // Joch der geborstenen Dorfglocke — Landmarke. SLICE 6 PHASE 4b (Juror-B):
  // ohne shadowArt fiel der Schatten auf das kalte canopy_shadow-Stipple
  // zurueck (gemessen DeltaL 43,6 je Punkt, gruenschwarzer 0-Ton im warmen
  // Dorf). Der 48x32-Bake ist maszgleich zum span [3,2].
  'G': { art: 'dorf_glocke', span: [3, 2], solid: false, shadowArt: 'dorf_bake_klein' },
  // Marktsegel mit gebackenen Scher-Posen (GP6 §5.2): 8er-Folge ueber 5 distinkte
  // Posen; swayPoses[0] MUSS gleich art sein (tilemap.js-Waechter).
  // PHASE 4b (Juror-B): shadowArt wie bei den Dach-Spans — sonst kaltes
  // canopy_shadow-Stipple unter dem Segel.
  'M': {
    art: 'dorf_segel',
    span: [3, 2],
    solid: false,
    shadowArt: 'dorf_bake_klein',
    swayPoses: ['dorf_segel', 'dorf_segel_r1', 'dorf_segel_r2', 'dorf_segel_r1',
      'dorf_segel', 'dorf_segel_l1', 'dorf_segel_l2', 'dorf_segel_l1'],
  },
  // Osttor-Bogen ueber der Portal-Schwelle — NICHT solide, man laeuft hindurch.
  // PHASE 4b (Juror-B): shadowArt wie bei den Dach-Spans, maszgleich [3,2].
  'O': { art: 'dorf_dach_tor', span: [3, 2], solid: false, shadowArt: 'dorf_bake_klein' },
};

export const DORF = {
  rows: DORF_ROWS,
  legend: DORF_LEGEND,
  overRows: DORF_OVER_ROWS,
  // Eintritts-Spawn am Osttor, zwei Kacheln vor der Schwelle (der Blick faellt
  // beim Betreten nach Westen ueber den Platz auf die Glocke). Respawn im DORF
  // = dieser Eintritts-Spawn (SPEC §6.2).
  playerSpawn: tc(39, 15),
  // GEGNERFREI (SPEC §6.1). Die drei Arrays bleiben als LEERE Arrays gefuehrt —
  // main.js:1113-1120 mappt skeletonSpawns/ghoulSpawns UNGEGUARDET.
  skeletonSpawns: [],
  ghoulSpawns: [],
  enemySpawns: [],
  // Das Dorf wird nicht gepluendert: KEINE Vasen, KEINE Urnen, KEINE Truhen.
  // Das Feld bleibt als LEERES Array stehen, weil main.js:1131 createProps
  // (props.js:21 `propSpawns.map`) ebenfalls ungeguardet zugreift — und die
  // Karten-Suiten `def.propSpawns.findIndex/.every` direkt aufrufen
  // (smoke_test.mjs, .tmp/check_builderA_slice3.mjs). Fehlt das Feld, wirft der
  // erste Betreten-Frame.
  propSpawns: [],
  // NPC-ANKER (SPEC §2.1): Weltpixel = ZENTRUM der Entity-AABB, exakt die
  // enemies-Konvention (maps.js:4-5). Reines DATENFELD — die Verdrahtung
  // (entities/npcs.js, Wander an der Leine mit Radius 24) kommt in Phase 2.
  // Quelle: .tmp/slice6_p0/dorf_layout.json .npcSpawns.
  npcSpawns: [
    { ...tc(14, 11), id: 'bran' },        // Bran der Schmied — Amboss (14,10), Esse (11,10)
    { ...tc(30, 10), id: 'hedda' },       // Alte Hedda — Herdfeuer (29,10)
    { ...tc(21, 6), id: 'corm' },         // Vater Corm, der Kuester — Kapellenstufe (21,5)/(22,5)
    { ...tc(24, 18), id: 'mile' },        // Mile, das Botenkind — Theke (23,17)/(24,17)
    { ...tc(39, 16), id: 'torwaechter' }, // Der Torwaechter — Osttor (42,14)/(42,15)
  ],
  // Osttor: die zwei 'D'-Schwellenkacheln -> GRAVEYARD-Westtor. Der Ziel-Spawn
  // tc(3,12) steht OESTLICH der Friedhofs-Wegkachel (1,12) und liegt damit nicht
  // im Gegenportal (Pruefung smoke_test.mjs "Ziel-Spawn NICHT im Gegenportal").
  portals: [
    { ...tileRect(42, 14, 1, 2), target: 'GRAVEYARD', spawn: tc(3, 12) },
  ],
  // BELICHTUNG — eingefroren von der Phase-0-Eichung (SLICE6_PHASE0 §4/§7,
  // Software-Render der echten Module, Bias +1,90 L abgezogen): M1-DORF-Band
  // 56..69, E1-Highlight >= 0,64 %, L<16 <= 2,0 %. Diese vier Zahlen sind
  // BINDEND — wer sie dreht, macht die Eichung ungueltig (G1/G7).
  ambient: 0.28,          // Dauerzwielicht (GDD.md:38-40), heller als der Friedhof
  ambientTint: '#1a1410', // warmes Braunschwarz statt der blauvioletten Nacht
  playerLightRadius: 40,
  fog: true,
  // ZWEI Warmlichter (Entscheid E5): Herdfeuer PFLICHT (SPEC A3), Esse als
  // zweites. main.js zieht die Lichtquellen ueber tilemap.findTiles(ch).
  torchChars: ['F', 'E'],
  // SLICE 5 §4.4 — Kartenmusik datengetrieben; der Schluessel zeigt in
  // game/js/audio/songs/index.js. §36-geoHash-frei.
  music: 'dorf',
};
