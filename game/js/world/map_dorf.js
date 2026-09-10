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
//   GP7-CH-1 E2 (deklariert): das EINE 'v' an Heddas Kate (31,8) ist der zweiten
//   Tuerhaelfte gewichen — es war ohnehin das einzige vernagelte Fenster an einem
//   BEWOHNTEN Haus (Herdfeuer davor, Strohdach intakt) und stand damit gegen den
//   Satz oben. Die vier uebrigen 'v' (Kapelle 23,4 / Schmiede 14,9 /
//   Speicher 27,23) bleiben unangetastet.
// - ZWEI Warmlichter, beide Pflicht-torchChars (Entscheid E5): 'F' Herdfeuer vor
//   Heddas Kate (SPEC A3, das eine rote Licht-Gate) und 'E' die Esse der Schmiede.
// - Haeuser sind NICHT betretbar (SPEC §6.1): 'T'/'t' (+ 'J'/'j', die rechten
//   Tuerhaelften aus GP7-CH-1 E2) sind Zustands-Deko (zu/offen) und solide.
//   Die Dach-Transparenz (tilemap.js CROWN_PLAYER_ALPHA)
//   greift deshalb nur beim Vorbeilaufen an der begehbaren TRAUFE — dem obersten
//   Streifen jedes Dach-Spans (Entscheid E2, Beweiszelle (12,7) hinter der
//   Schmiede).
// - KEINE Gegner, KEINE Props: das Dorf wird nicht gepluendert (§6.1).
//
// LEGENDEN-NAMENSRAUM (Entscheide E7/F5, deklariert): Legenden sind JE KARTE
// eigene Namensraeume. Hier gilt Mnemonik vor GRAVEYARD-Konvention —
// 'T'/'t' = Tuer zu/offen LINKE Haelfte (GY: T = tree_trunk), 'J'/'j' = dieselbe
// Tuer RECHTE Haelfte (GP7-CH-1 E2; Palette 'J'/'j' sind Holztoene, anderer
// Namensraum), 'Y' = toter Stamm (GY: Y = Over-Span Back-Krone), 'G' =
// Glocken-Joch (Palette 'G' = NPC-Stoff, anderer Namensraum). Das ist KEIN
// Widerspruch und darf von spaeteren Agenten nicht als solcher gewertet werden.
//
// ANKER-VERSATZ (Entscheid E1): die neun dorf_*-Over-Keys stehen mit W = 0 in
// der ANCHOR_CLAMP-Tabelle (world/tilemap.js) — Gebaeude sind keine Kronen, ihr
// Dach darf nicht von der Wand rutschen. Das dy (±4 px) bleibt ungeklammert;
// ART zeichnet jedes Dachgrid mit >= 4 px senkrechter Transparenz-Reserve.

import { tc, tileRect } from './coords.js';

// 44x28. Zeichenweise identisch zu .tmp/slice6_p0/dorf_rows.txt ("GRAMFELD rows").
// GP7-CH-1 E2: SIEBEN Ein-Zeichen-Aenderungen gegenueber dorf_rows.txt, jede
// ersetzt ein SOLIDES Wandzeichen durch die rechte Tuerhaelfte (Soliditaets-
// Raster damit byte-gleich, S6-§7F(c)-Golden gruen): (22,4) C->j, (31,8) v->J,
// (6,9) V->J, (13,9) W->j, (6,18) V->J, (12,22) V->J, (26,23) Z->J.
// Merkpunkte: Kapelle (Nord, C/t+j), Schmiede (West-Mitte, W/E/A), Heddas Kate
// (Ost-Mitte, W/T+J/F), drei verlassene Katen (V/T+J), Speicher (Sued, Z), Brunnen
// 2x2 (1/2/3/4), geborstene Dorfglocke (5/6), Marktstand-Theke (7/8), Osttor-
// Schwelle (D, Portal) am rechten Kartenrand.
const DORF_ROWS = [
  '############################################',
  '#.,..,.....................................#',
  '#...........,.................,....,.......#',
  '#..Y....,.......,..,CCCC...................#',
  '#.,.................Ctjv...............Y...#',
  '#....................SS............,.......#',
  '#.Y...,...,......,...==...............,....#',
  '#....................==,..,................#',
  '#,.....-...WWWW......==......WTJ...b.......#',
  '#...VTJ-...Wtjv....,.==......===.,....,..Y.#',
  '#....------E==A=.....==......F=............#',
  '#.........======x=...==..,....=x..........,#',
  '#..b...,.b.,....,==============............#',
  '#..............x================x.,........#',
  '#..,............===12=======5=============D#',
  '#.....,.........===34=======6=============D#',
  '#......---------================...........#',
  '#......-........=======78=======...,.....,.#',
  '#.,.VTJ....,....================...........#',
  '#................-..,....=x................#',
  '#..........-------.......=,........fff.....#',
  '#...,........-.......................f.....#',
  '#.Y.......VTJ...........ZZZZ.........fb....#',
  '#.......................ZTJv.............,.#',
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
// GRAVEYARD). 40 Zeichen, alle in Gebrauch: 38 aus dorf_layout.json + 'J'/'j'
// (GP7-CH-1 E2, die rechten Tuerhaelften).
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
  // GP7-CH-1 E2: jede Tuer ist ZWEI Kacheln breit (Massstabsbruch gegen die
  // 16x24-Figur wird in der BREITE geloest, nicht in der Hoehe — der 16x32-
  // Hoch-Span ist in dieser Engine nicht baubar, siehe SPEC_GP7CH1.md E2 und
  // GP7CH1_SPEC_REVIEW.md B2). 'T'/'t' zeigen jetzt auf die LINKE Haelfte,
  // 'J'/'j' sind die neuen rechten Haelften. Die alten Ein-Kachel-Grids
  // dorf_tuer_zu / dorf_tuer_offen bleiben in TILE_ART stehen, sind aber ab
  // hier UNBENUTZT (deklariert; kein Loeschen — smoke prueft Legenden-Arts,
  // nicht ihre Verwendung, und ein Bestandsgrid zu entfernen waere ein
  // Nicht-Art-Edit ohne Sanktion).
  //
  // ENTSCHEID LINKS/RECHTS (Layout, nicht Geschmack): die zweite Haelfte ist
  // bei ALLEN SIEBEN Tueren die Zelle RECHTS der heutigen Tuer. Das ist der
  // einzige Zuschnitt, der (a) die Tuer der drei GROSSEN Haeuser mittig unter
  // die 4-Kachel-Fassade legt (Kapelle 20-23 -> Tuer 21/22, Schmiede 11-14 ->
  // 12/13, Speicher 24-27 -> 25/26), (b) die Kapellentuer exakt auf ihre zwei
  // Stufenkacheln (21,5)/(22,5) setzt und (c) die Schmiedetuer NICHT auf die
  // Esse (11,10) schiebt — der Weg nach links waere bei der Schmiede zur
  // Haelfte von der soliden Esse verstellt.
  // 'J'/'j' sind im Legenden-NAMENSRAUM dieser Karte frei (Konvention E7/F5,
  // Kopf dieser Datei: Palette 'J'/'j' sind Holztoene, anderer Namensraum).
  'T': { art: 'dorf_tuer_zu_l', solid: true },
  't': { art: 'dorf_tuer_offen_l', solid: true },
  'J': { art: 'dorf_tuer_zu_r', solid: true },
  'j': { art: 'dorf_tuer_offen_r', solid: true },
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
    // GP7-CH-1 POLITUR (Osttor-Eintritt). ALT: tc(39, 16) = (632,264) — exakt
    // 16 px UNTER dem Eintritts-Spawn tc(39,15) = (632,248). Beide Sprites sind
    // 16x24 und stehen mittig ueber ihrer 12x14-AABB (player.js:236-240 ==
    // npcs.js:206-210, Kasten = [cx-8,cx+8) x [cy-17,cy+7)); bei 16 px
    // Mittenabstand ueberlappten sie sich um 16x8 = 128 Kasten-Texel (30 opake).
    // Der Torwaechter wird zudem SPAETER gezeichnet (Y-Sortierung nach Fusskante,
    // main.js:2754: 271 > 255) und stand damit VOR dem Helden — das erste Bild,
    // das Michael vom Dorf sieht, zeigte einen halb verdeckten Helden.
    //
    // NEU: (650, 260) = tc(40,16) + (2,-4). BEWUSST KEINE Kachelmitte — die
    // Konvention dieses Feldes ist "Weltpixel = ZENTRUM der AABB" (SPEC §2.1,
    // maps.js:4-5), nicht "Kachelmitte". Eine Kachelmitte ist hier arithmetisch
    // ausgeschlossen, siehe die Decke unten: tc(40,16) traegt 22,63 px.
    //
    // DECKE (nicht verhandelbar, MESSUNG statt Meinung): npcs.js:33
    // NPC_REDE_ABSTAND = 22 px, und tools/smoke_test.mjs:6535-6547
    // (S6-§7F(f) §2.3) tippt den Angriffs-Pegel im ERSTEN Frame nach dem
    // Betreten und erwartet, dass sich der Dialog des Torwaechters oeffnet.
    // Der Anker muss also <= 22 px vom Eintritts-Spawn stehen UND unter dem
    // Spawn (Blick 'down' = (0,1), Skalarprodukt > 0 -> dy > 0). Gemessen:
    // ein Anker jenseits der 22 px (geprueft mit tc(41,16), 35,78 px) faerbt
    // SIEBEN Pruefungen rot (der ganze (f)-Strang Dialog/Laden haengt daran),
    // 825 ok -> 818 ok. Ein Mitten-Abstand >= 24 px ist damit erst nach einer
    // SANKTIONIERTEN Aenderung an smoke_test.mjs:6535 zu haben.
    //
    // WAS STATTDESSEN GELOEST IST — die Ueberlappung, nicht der Abstand: bei
    // |dx| >= 16 (Sprite-Breite) beruehren sich die Kaesten hoechstens.
    // dx = +18 / dy = +12 -> Abstand 21,63 px (ansprechbar bleibt), Kasten-
    // Ueberlappung 0 Texel, 2 px Luft zwischen den Sprites, Held vollstaendig
    // sichtbar (258/258 opake Texel).
    // OSTTOR-LAGE: der Anker steht unter dem Torbogen-Span 'O' (40,14)/[3,2]
    // (Welt 640..688 x 225..257 nach anchorOffset dy=+1), 22 px westlich der
    // Schwelle — der Torbogen verdeckt 6 der 249 opaken Wach-Texel (2,4 %,
    // nur die Haubenkante; weiter oestlich/hoeher schneidet die Bogenlaibung
    // den Kopf ab, gemessen bis 43 Texel bei (653,252)).
    // BEGEHBARKEIT: die 12x14-AABB (644..656 x 253..267) liegt ueber (40,15)
    // = '=' und (40,16) = '.', beide solid:false; keine solide Kachel darunter.
    // PORTAL: die Portal-AABB tileRect(42,14,1,2) ist 672..688 x 224..256 —
    // 16 px oestlich der AABB-Kante, kein Kontakt, und der Weg-Korridor
    // (Zeilen 14/15) bleibt frei (die AABB steht zu 11 von 14 px in Zeile 16).
    { x: 650, y: 260, id: 'torwaechter' }, // Der Torwaechter — Osttor (42,14)/(42,15)
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
