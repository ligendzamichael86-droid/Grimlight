// FLUESTERGRUFT (Slice 3 §2.5), 40x24 Tiles = 640x384 px. Dunkelste Ebene.
// Reines Daten-Modul im Bestandsformat (ROWS/LEGEND), Node-importierbar.
// Erzeugt/verifiziert via .tmp/gen_slice3_maps.mjs (Raender solide, Legende
// vollstaendig, alle Spawns/Portale/Truhen begehbar UND per Flood-Fill vom
// Eingang erreichbar, Fackeln > 0).
//
// Dramaturgie (§2.5, bindend):
// - Kritischer Pfad Eingang(NW) -> Zentralhalle -> gefluteter Sued-Korridor
//   -> Boss-Vorplatz(Sued): Fackel alle 6-8 Tiles.
// - Nebenkammern/Sackgassen UNBEFEUERT (Elite-Augen gluehen im Dunkeln):
//   Schluesselkammer(NE, hinterste) und Herz-Nische(SW, geflutet).
// - Boss-Vorplatz: 4 Fackeln, hellster Ort der Map.
// - Geflutete Abschnitte = Wasser-Tiles, hier BEGEHBAR (rein visuell, keine
//   neue Mechanik, §2.5 "normal begehbar oder solide").
//
// Nur enemySpawns (Legacy-Arrays leer, §2.5): 5 Skelette, 3 Ghule, 2 Hunde
// (beide in der grossen Zentralhalle, Orbit braucht Radius 56 plus Luft),
// 1 Rostpanzer (bewacht das Boss-Portal frontal an der Engstelle); Eliten
// (nur hier, §2.4): 2 Elite-Skelette + 1 Elite-Ghul in der Schluesselkammer,
// 1 Elite-Grufthund in der Herz-Zugangshalle (nie in der Nische selbst).
// Summe 64 XP, 15 Gegner.

import { tc, tileRect } from './coords.js';

// Grafikpass 5 §3.B5 KANAL-SILHOUETTE (hash-frei entrechteckigt): beide
// Wasser-Komponenten waren perfekte Rechtecke (Kanal x19-22/y9-16, geflutete
// Herz-Nische x2-5/y12-18) — im Bild las sich das als gestempelter Block.
// Je Komponente DREI '~'<->'.'-Tausche (Spec erlaubt 2-3), erzeugt und
// nachgewiesen von .tmp/gen_canal_gp5.mjs:
//   Kanal:   (19,9) '~'->'.'   (22,16) '~'->'.'   (18,16) '.'->'~'
//   Nische:  (5,12) '~'->'.'   (2,18)  '~'->'.'   (6,17)  '.'->'~'
// BEIDE Zeichen sind solid:false -> das Soliditaets-Raster ist BYTE-IDENTISCH,
// der §36-Golden-Hash (sol UND geo) bleibt unveraendert; keine der 6 Zellen
// traegt einen Spawn, ein Prop, ein Portal oder eine Fackel (§0.5-Tabu
// eingehalten). Alle Zellen bleiben begehbar, die Erreichbarkeit aendert sich
// nicht (beide Zeichen sind Boden).
const FLUESTERGRUFT_ROWS = [
  '########################################',
  '####W#############W#####################',
  '##.U.....##W##.S.........S.####........#',
  '##..............P...............P......#',
  '##.....................................#',
  '##.......#####.............####........#',
  '####.#########.............####........#',
  '####.#########.............####........#',
  '####.#########..........P..#############',
  '####.#########......~~~....#############',
  '####.#############W~~~~#################',
  '####...........####~~~~#################',
  '##~~~..........####~~~~#################',
  '##~~~~.........####~~~~#################',
  '##~~~~.........####~~~~#################',
  '##~~~~.........####~~~~W################',
  '##~~~~............~~~~......############',
  '##~~~~~.....................############',
  '##.~~~......W...............W###########',
  '#####.......................############',
  '#############...............############',
  '#############....R..D..R....############',
  '################W#######W###############',
  '########################################',
];

// Legende: bestehende TILE_ART-Schluessel (Katakomben-Aesthetik). Wasser hier
// BEGEHBAR (solid:false) fuer die gefluteten Gaenge/Nischen.
const FLUESTERGRUFT_LEGEND = {
  // Grafikpass 2: Ziegel-/Steinboden-Varianten + Wasser-3-Frame-Ping-Pong
  // (synchron, langsam). art:'water' bleibt Frame 0/Fallback, solid:false und
  // fringeTarget unberührt (begehbares Grabwasser).
  // Grafikpass 2 R3 (§8b.3): brick_wall_v3/stone_floor_v3 als vierte Varianten.
  // Grafikpass 5 §2.A2 UNGERADE-n-SWEEP: n war 4 (gerade) -> brick_wall_v5
  // (Art: Sickerspuren) haengt an, n=5. Ziegel-WAENDE bekommen bewusst KEIN
  // bankSet-Flag (§3.B2/Review): kein Uferband an senkrechten Waenden.
  // GP5 RUNDE 3 VERDRAHTUNGS-NACHZUG (Jury R2, Auftrag 5): brick_wall_l1..l4
  // (vier Luminanz-Stufen der Ziegelgesichter) lagen fertig in art/sprites.js
  // und hingen an KEINER Legende -> wirkungslos. Sie haengen hier an, n = 9
  // (UNGERADE, teilerfremd zu 5/7/17/29/47). Erlaubt nach SPEC §0.5
  // ("UNGERADE-n-Umbau der variants-Listen"); Spawns/Portale/Fackel-Zellen/
  // solid/fringeSource dieser Datei bleiben unberuehrt.
  '#': { art: 'brick_wall', solid: true, fringeSource: true, fringeSet: 'moss', variants: ['brick_wall', 'brick_wall_v1', 'brick_wall_v2', 'brick_wall_v3', 'brick_wall_v5', 'brick_wall_l1', 'brick_wall_l2', 'brick_wall_l3', 'brick_wall_l4'] },
  // §2.A2: n war 4 -> stone_floor_v7 (Art: Sickerflecken) haengt an, n=5.
  // §3.B2 bankSet 's': der Steinboden ist die LANDkachel am Gruft-Kanal ->
  // nasse Steinkante (t/T + n/k), KEIN Schlamm auf Stein.
  '.': { art: 'stone_floor', solid: false, fringeTarget: true, bankSet: 's', variants: ['stone_floor', 'stone_floor_v1', 'stone_floor_v2', 'stone_floor_v3', 'stone_floor_v7'] },
  ',': { art: 'stone_floor_cracked', solid: false, fringeTarget: true, bankSet: 's' },
  // Grafikpass 3 §2.2 + GP3-R3 (M-K3a): der GRUFTKANAL FLIESST VERTIKAL — die
  // Legende lenkt '~' vom horizontalen water-Zyklus auf den VERTIKALEN water_v-
  // Zyklus um (art:'water_v', anim water_v_0..3; Abwaertsdrift art-gebacken als
  // vertikaler Phasenversatz ueber die 4 Frames). animRate/animSync IDENTISCH zum
  // horizontalen Zyklus (Engine/tilemap.js UNVERAENDERT). Der Friedhofsteich
  // (GRAVEYARD, eigene Map/Legende) bleibt horizontal. depthOverlays/shorePrefix
  // haengen an Legenden-Flags, NICHT am 'water'-Praefix -> unveraendert gueltig.
  // §2.1/§4.1: shorePrefix 'wet' — am Gruft-Kanal legt die Engine ZUSAETZLICH zu
  // den moss_fringe_*-Ufern eine additive wet_n/e/s/w-Nasskante ueber die
  // Moos-Uferkanten (nur Orthogonale). Wasser hier BEGEHBAR (solid:false).
  // §8b.1: depthOverlays wie im Friedhofsteich (Ufer flach, naechster Ring mittel).
  // GRAFIKPASS 6 §6.1 KANAL-UFERRING: der Ufer-Ring zieht jetzt den VERTIKALEN
  // Uferring 'water_shallow_vert' statt des horizontalen 'water_shallow'. Grund
  // (Jury-Befund GP5 R2/R3): der Gruftkanal fliesst SENKRECHT (art 'water_v',
  // vertikaler 4-Frame-Zyklus), sein Uferschleier trug aber die WAAGERECHTEN
  // Baender des Teich-Grids — Stroemungsrichtung und Uferstruktur standen quer
  // zueinander. Art (Phase 1) hat water_shallow_vert(+_v1/_v2) geliefert; die
  // _v1/_v2-Streuung des depthArt-Passes (variantIndex(tx+617,ty+293,3)) greift
  // automatisch, weil sie ueber den Basis-Key abgeleitet wird.
  // Der MITTEL-Ring bleibt 'water_mid' (richtungsneutral, GP5 R3).
  // Gate §6.1: Ufer-Anisotropie laengs >= 2,0 (Messung Phase 4).
  '~': { art: 'water_v', solid: false, fringeTarget: true, shorePrefix: 'wet', anim: ['water_v', 'water_v_1', 'water_v_2', 'water_v_3'], animRate: 3, animSync: true, depthOverlays: ['water_shallow_vert', 'water_mid'] },
  'P': { art: 'pillar', solid: true },
  'R': { art: 'rubble', solid: true },
  'S': { art: 'sarcophagus', solid: true },
  // Grafikpass 5 §1.8: die Gruft-Fackeln liefen als EINZIGE noch auf 2 Frames
  // (Katakomben/Bosskammer sind seit GP4 dreiframig) — das las sich als Blinken
  // statt als Flackern. Jetzt der gleiche 3-Frame-Zyklus wie ueberall sonst;
  // animRate bleibt Default (6), kein animSync -> Positions-Offset staffelt
  // benachbarte Fackeln weiterhin gegeneinander.
  'W': { art: 'torch_wall_0', solid: true, anim: ['torch_wall_0', 'torch_wall_1', 'torch_wall_2'] },
  'U': { art: 'stairs_up', solid: false },      // Portal zurueck CATACOMBS
  'D': { art: 'crypt_stairs_down', solid: false }, // Portal hinab BOSS_KAMMER
};

export const FLUESTERGRUFT = {
  rows: FLUESTERGRUFT_ROWS,
  legend: FLUESTERGRUFT_LEGEND,
  playerSpawn: tc(4, 4), // Dev-Start (?map=FLUESTERGRUFT); regulaer via Portal
  // Migration der Legacy-Arrays erst in S5 (Entscheidung 10): hier leer.
  skeletonSpawns: [],
  ghoulSpawns: [],
  enemySpawns: [
    // Normale Besatzung (§2.5)
    { ...tc(6, 3), kind: 'skeleton' },   // Eingangskammer
    { ...tc(16, 6), kind: 'skeleton' },  // Zentralhalle
    { ...tc(22, 7), kind: 'skeleton' },  // Zentralhalle
    { ...tc(20, 12), kind: 'skeleton' }, // gefluteter Korridor
    { ...tc(17, 19), kind: 'skeleton' }, // Boss-Vorplatz
    { ...tc(20, 11), kind: 'ghoul' },    // gefluteter Korridor
    { ...tc(21, 14), kind: 'ghoul' },    // gefluteter Korridor
    { ...tc(7, 16), kind: 'ghoul' },     // Nischen-Zugang (geflutet)
    { ...tc(18, 4), kind: 'hound' },     // Zentralhalle (Orbit-Luft)
    { ...tc(24, 5), kind: 'hound' },     // Zentralhalle (Orbit-Luft)
    { ...tc(20, 18), kind: 'rust' },     // Engstelle vor dem Boss-Portal
    // Eliten (§2.4, nur hier)
    { ...tc(33, 3), kind: 'skeleton', elite: true }, // Schluesselkammer
    { ...tc(36, 6), kind: 'skeleton', elite: true }, // Schluesselkammer
    { ...tc(34, 5), kind: 'ghoul', elite: true },    // Schluesselkammer
    { ...tc(9, 15), kind: 'hound', elite: true },    // Herz-Zugangshalle
  ],
  propSpawns: [
    { ...tc(5, 4), kind: 'vase' },    // Eingang
    { ...tc(22, 3), kind: 'urn' },    // Zentralhalle
    { ...tc(15, 8), kind: 'vase' },   // Zentralhalle
    { ...tc(18, 8), kind: 'vase' },   // Zentralhalle
    { ...tc(32, 6), kind: 'vase' },   // Schluesselkammer (Loot)
    { ...tc(20, 13), kind: 'urn' },   // gefluteter Korridor
    { ...tc(11, 17), kind: 'vase' },  // Herz-Zugangshalle
    { ...tc(4, 14), kind: 'vase' },   // Herz-Nische
    { ...tc(15, 17), kind: 'vase' },  // Boss-Vorplatz (1/3)
    { ...tc(25, 17), kind: 'urn' },   // Boss-Vorplatz (2/3)
    { ...tc(20, 17), kind: 'vase' },  // Boss-Vorplatz (3/3)
    // Schluessel-Truhe in der hintersten Kammer (hinter der Eliten-Wache)
    { ...tc(36, 4), kind: 'chest', content: 'boss_key' },
    // Herz-Truhe in der gefluteten Seitennische
    { ...tc(3, 16), kind: 'chest', content: 'heart' },
  ],
  // U-Tile (3,2) -> Katakomben; Ziel-Spawn neben dem Katakomben-Abgang.
  // D-Tile (20,21) -> Bosskammer, per Boss-Schluessel verriegelt (§3).
  portals: [
    { ...tileRect(3, 2), target: 'CATACOMBS', spawn: tc(34, 12) },
    { ...tileRect(20, 21), target: 'BOSS_KAMMER', spawn: tc(10, 9), requires: 'boss_key' },
  ],
  // GRAFIKPASS 6 §3.2 (GP6-§7A): 0.85 -> 0.52, weiterhin die dunkelste Ebene.
  // Median-Prognose 34,6 (M1-Band 33..44; der Kanal traegt 7,1 % Wasser-Rampe,
  // §3.1). Die drei sanktionierten Zeilen 157/165/277 in
  // .tmp/check_boss_slice3.mjs sind mitgezogen.
  ambient: 0.52,          // dunkelste Ebene
  // Grafikpass 3 §2.3/§4.2: gruenschwarzes Grabwasser (Farbtemperatur der Gruft).
  ambientTint: '#04100c',
  playerLightRadius: 52,
  fog: false,             // Mobile-Overdraw (§2.5)
  torchChars: ['W'],
  music: 'fluestergruft', // SLICE 5 §4.4 (additiv, geoHash-frei)
  // -------------------------------------------------------------------------
  // GRAFIKPASS 6 §3.3 — ZWEI FUELL-LICHTER IM KANALRAUM. Der Gruftkanal
  // (Wasser-Kachelblock tx 18..22 / ty 9..16) ist der dunkelste Ort der
  // dunkelsten Karte: er wird nur von ZWEI Wandfackeln flankiert, (18,10) im
  // Norden und (23,15) im Sueden, beide mit r = 72. Dazwischen bleibt ein
  // Loch — nachgemessen ueber alle 31 Kanalzellen ist die groesste Distanz zur
  // NAECHSTEN Fackel 82 px, also weit ausserhalb jedes Kegels.
  //
  // POSITIONSWAHL (nicht geschaetzt, sondern das Argmax dieser Messung):
  //   (296,264) = Kachelzentrum (18,16) — Distanz 82 px zur naechsten Fackel,
  //               der dunkelste Punkt des Kanals ueberhaupt (Knick vom
  //               Vertikalkanal in den gefluteten Sued-Korridor).
  //   (360,152) = Kachelzentrum (22,9)  — Distanz 66 px, der dunkelste Punkt
  //               der Nordhaelfte (Ostspalte, von der Fackel (18,10) am
  //               weitesten entfernt).
  // Beide liegen auf WASSER-Kacheln, also im Kanalraum selbst; ihr Abstand
  // betraegt 129 px, sodass sich die Kegel ergaenzen statt zu stapeln.
  //
  // flicker 0.5 (BEWUSST unter der 0.8-Schwelle, Muster BOSS_KAMMER §5.D4):
  // kein Warm-Glow, kein Lit-Dither, keine Funken, keine Wasser-Reflexion —
  // reine Grundaufhellung des Dunkel-Overlays. Radius 80 <= 88 (§3.3-Deckel);
  // die Kammern links und rechts des Kanals bleiben dadurch dunkel.
  // geoHash-frei: §36 hasht playerSpawn/Spawns/Portale/torchChars-findTiles,
  // NICHT extraLights.
  extraLights: [
    { x: 296, y: 264, radius: 80, flicker: 0.5 },
    { x: 360, y: 152, radius: 80, flicker: 0.5 },
  ],
};
