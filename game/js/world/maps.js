// Map-Daten Slice 1. Reines Daten-Modul, Node-importierbar.
//
// Konventionen (bindend, siehe Übergabe Slice 0):
// - Spawn-Punkte sind WELTPIXEL und bezeichnen das ZENTRUM der Entity-AABB.
//   Builder B rechnet x = spawn.x - w/2, y = spawn.y - h/2.
// - Slice 2: enemySpawns = [{ x, y, kind }] fuer die neuen Gegner-Kinds
//   ('hound' | 'rust', Dispatch via createEnemy). skeletonSpawns und
//   ghoulSpawns bleiben unangetastet, Migration erst in Slice 3.
// - Slice 2: Truhen-propSpawns tragen optional content ('treasure' ist
//   Default in props.js | 'boomerang').
// - portals: Welt-AABBs; target = Schlüssel in MAPS; spawn = Zentrum der
//   Spieler-AABB in der ZIELmap (begehbar, nicht im Gegenportal).
// - torchChars: alle Legenden-Zeichen, die Fackel-Tiles sind. main.js
//   extrahiert die Lichtquellen via tilemap.findTiles(zeichen) — Fackel-
//   Lichter werden NICHT hier gepflegt.
// - ambient: 0..1 Dunkelheitsgrad (lighting.js), playerLightRadius: Radius
//   der Spieler-Laterne in px, fog: Nebelschwaden (hud.drawFog) ja/nein.
//
// Slice 3: tc()/tileRect() liegen jetzt in world/coords.js (gegen den
// Zirkelimport maps.js <-> Map-Dateien, §3); maps.js importiert sie von dort
// und re-exportiert sie fuer Alt-Nutzer. Die neuen Maps FLUESTERGRUFT und
// BOSS_KAMMER kommen aus eigenen Dateien; MAPS setzt die Portal-Kette
// GRAVEYARD > CATACOMBS > FLUESTERGRUFT > BOSS_KAMMER zusammen.

// Slice 6: die FUENFTE Karte DORF (Gramfeld) kommt ebenfalls aus einer eigenen
// Datei (world/map_dorf.js); MAPS haengt sie unten ein und GRAVEYARD bekommt
// dafuer sein Westtor-Portal (§6.2, geo-Sanktion §9.M2).
import { tc, tileRect } from './coords.js';
import { FLUESTERGRUFT } from './map_fluestergruft.js';
import { BOSS_KAMMER } from './map_bosskammer.js';
import { DORF } from './map_dorf.js';

export { tc, tileRect };

// ---------------------------------------------------------------------------
// FRIEDHOF — 40×24 Tiles.
// Legende: # Mauer, T Baum, . Gras, , Gras-Detail, = Weg, ~ Wasser,
// G/g/h Grabstein-Varianten, b toter Busch, o Knochen, s Schädel, f Zaun,
// F Fackel (animiert, solide), D Krypta-Treppe abwärts (begehbar, Portal).
// Krypta-Eingang im Nordosten (x30-35, y1-4), Zugang über die Lücke bei
// (32-33, y4).
// Grafikpass 3 §4.3 + GP3-R3 (K-K1a/K-K1b/H-K1): Ground-ROWS mit deterministisch
// per Koordinaten-Hash gestreuter Gras-Deko. DREI unterscheidbare Gras-Details
// (u=grass_tuft, j=grass_blade, k=grass_speck; je +Spiegelvariante) plus
// p=pebble_small, d=dirt_patch und das seltene Grossdetail r=dirt_patch_v1
// (~1/6-8 der Detail-Zellen). Detail-Dichte < 1 pro 3x3 Kacheln; nie an Portale/
// Spawns/Truhen angrenzend, nie zwei Details orthogonal benachbart. ZUSAETZLICH
// Makro-Patches (e): unregelmaessige begehbare dunklere Gras-Cluster ueber 2x2..3x3
// (grass_dark_v3-Konzentration). Erzeugt/verifiziert via .tmp/gen_deco3.mjs
// (Gameplay-Neutralitaet bewiesen: Soliditaets-Raster, Spawns, Portale, Fackel-
// Positionen byte-identisch zu 204e28f; Span-Zeichen M/N/O/Q/V/X nur in overRows).
//
// GRAFIKPASS 5 RUNDE 2 — zwei NEUE Generatoren haben diese rows zuletzt
// geschrieben (beide begehbar<->begehbar, sol/geo byte-identisch, idempotent):
//  * .tmp/gen_wiesenlicht_gp5r2.mjs — Jury-Kernauftrag an Engine-B. Die
//    Wiesenlicht-Klassen H/L/I/J/i/x lagen bis GP5 R1 in VIER handgezeichneten,
//    achsparallelen Bloecken (.tmp/gen_gfx4.mjs PATCHES) — die Jury las das
//    einstimmig als "GRAS-FLICKENTEPPICH ... RECHTECKE mit kerzengeraden
//    Kanten". Jetzt faellt die Klasse jeder Kachel aus einem 2-Oktaven-
//    VALUE-NOISE-Feld (Feature ~11 und ~5 Kacheln, deterministischer
//    Koordinaten-Hash, bilinear/smoothstep interpoliert), die Klassengrenzen
//    sind per BAYER-4x4 gedithert, und ein hartes Generator-Gate misst nach:
//    KEINE gerade Klassenkante laenger als 3 Kacheln (gemessen 3 von 3, sowohl
//    auf dem vollen Klassenfeld als auch auf dem gezeichneten Bild).
//  * .tmp/gen_teich_gp5r2.mjs — Teich-Verankerung (Jury K5): 3-Kachel-Wegsporn
//    (28,14)->(28,15)->(29,15) vom Hauptweg an die Westufer-Kachel, die letzten
//    zwei Kacheln als Trittsteine ('p'), plus 5 sich wiegende Uferhalme (w/y)
//    an dekorrelierten Uferkacheln (Anti-Ketten-Regel). Die Wasser-Silhouette
//    ist unangetastet (SPEC §0 sperrt die Teich-rows-Umformung).
const GRAVEYARD_ROWS = [
  '########################################',
  '#TT.,xebeTxJJJ.,JxJxxJ,xJsxo..######..T#',
  '#T.wyyoxeJ,.J.,JxLbLeeeLxJ,J..#.DD.#..T#',
  '#..Gwgxhe.,....JJGLgehLGJ..ww.#....#,.T#',
  '#...oxJ.........JxLLeLsJ...yb.##..##..T#',
  '#..g.G.h..u....F.JxLLGJh.g...J..o.....T#',
  '#.,....bk......==.JxLff...ff..J......pT#',
  '#..G.g.G..p.,..==..Jxgxh.G......G.gr..T#',
  '#....o.........==..JxLxJr............,T#',
  '#T...,......I.I==...JxxJ.,..eee.T..b.kT#',
  '#T.,..s.....IIi==..,xL,xJ.J.ee.T......T#',
  '#T..........IiH==..JxuxJ...oee,......kT#',
  '#=================================,...T#',
  '#=================================,...T#',
  '#I,..b...F..fiif........,..s=.dy~~....T#',
  // GP6 §6.3 WEGSPORN: die zwei Trittstein-Kacheln (28,15) und (29,15) tragen
  // jetzt 'P' = path_pebbles statt 'p' = pebble_small (EXAKT dieselben Flags,
  // siehe Legende) — der einzige ROWS-Tausch dieses Passes.
  '#ee..Gkg....IGjhI.......III.PP~~~~~~w.T#',
  '#eIo........rIiI..e.....,I...~~~~~~~~~T#',
  '#re,IGIh..u..gIGI.e.....IIIIy~~~~~~~~~T#',
  '#eIeiIiI......b..,eee...IiIIFI.~~y..u.T#',
  '#Teiee,I.........owy...GpgiIIII.yd....T#',
  '#TeI,iIs....g.G...wy...IIiIiII.I.,..bTT#',
  '#TTeeeiIb.wy......I.I,IiiHoiIIp.,....TT#',
  '#TTTeii,..wy.T.IsIIIdIiiIiTI.I.....uTTT#',
  '########################################',
];

// Slice 1.5: Fringe — Gras (fringeSource, Set 'grass') franst über Weg- und
// Wasserränder (fringeTarget). Bäume sind jetzt Stamm (ground, solid) + Krone
// ('C', over-Layer, nie solid) — Begehbarkeit bleibt exakt wie bei 'tree'.
const GRAVEYARD_LEGEND = {
  '#': { art: 'wall', solid: true },
  'T': { art: 'tree_trunk', solid: true },
  // Kronen-Zeichen (nur Over-Layer, nie solid): 'B' = canopy_bottom liegt AUF
  // der Stamm-Zelle (Wurzeln bleiben sichtbar), 'K' = canopy_top eine Zelle
  // darüber, 'C' = runde Einzel-/Cluster-Krone (Füller für Waldränder).
  // GRAFIKPASS 5 RUNDE 2 (Jury-Deckel 3 "HAENGE-KRONEN ... flache Ellipsen ohne
  // Kontur/Innenleben/Stamm/Schatten — Seerosenblaetter auf Rasen", Auftrag ART
  // (2) "3 Groessenklassen + Spiegel-Flag"): Art hat tree_canopy, _top und
  // _bottom komplett neu gezeichnet (Kontur, Kerben, Lichtbogen, Stammstumpf,
  // Kontaktschatten) und ZWEI Groessenklassen als NEUE Keys nachgelegt —
  // tree_canopy_v1 (klein) und tree_canopy_v2 (breit). Engine-B verdrahtet sie:
  //  * 'C' (Einzel-/Cluster-Krone, u. a. das dritte Mittel-Cluster) laeuft ueber
  //    alle drei Groessen. n = 3 ist UNGERADE und teilerfremd zu den Hashes, die
  //    am SELBEN Ort ziehen (Anker-Versatz 29 und 17 aus SPEC §4.C2, Jitter 5).
  //  * 'B' (16x16-Fueller auf der Stammzelle) zieht zusaetzlich die beiden
  //    anderen neu gezeichneten Silhouetten. Das ist zulaessig, weil ALLE DREI
  //    Grids jetzt eigenstaendige Kronen MIT Stammstumpf sind (Art-Bericht) —
  //    'tree_canopy_top' war bisher totes Art, seit GP5 R1 setzt kein
  //    OVER_ROWS-Generator mehr ein 'K'.
  // variants[0] === art in beiden Faellen (Engine-Assert, smoke §6#4e).
  'B': {
    art: 'tree_canopy_bottom', solid: false,
    variants: ['tree_canopy_bottom', 'tree_canopy_top', 'tree_canopy'],
  },
  'K': { art: 'tree_canopy_top', solid: false },
  'C': {
    art: 'tree_canopy', solid: false,
    variants: ['tree_canopy', 'tree_canopy_v1', 'tree_canopy_v2'],
  },
  // Grafikpass 2: 2x2-Grosskronen im Over-Layer (Anker = obere linke Ecke,
  // Art-Canvas 32x32). Drei Silhouetten gegen sichtbare Alternation der nicht
  // spiegelbaren Ost-Baumreihe. Nie solid (Over-Layer), Setzung siehe
  // GRAVEYARD_OVER_ROWS / .tmp/gen_overrows2.mjs.
  'M': { art: 'tree_canopy_2x2_a', span: [2, 2], solid: false },
  'N': { art: 'tree_canopy_2x2_b', span: [2, 2], solid: false },
  'O': { art: 'tree_canopy_2x2_c', span: [2, 2], solid: false },
  // Grafikpass 3 §3.2/§4.1: drei GESPIEGELTE Grosskronen (6 Silhouetten gesamt).
  // Text-Spiegelung im Generator (.tmp/gen_overrows2.mjs), zur Laufzeit KEIN Flip.
  // gen_overrows2 rotiert jetzt ueber alle sechs Zeichen M/N/O/Q/V/X.
  'Q': { art: 'tree_canopy_2x2_am', span: [2, 2], solid: false },
  'V': { art: 'tree_canopy_2x2_bm', span: [2, 2], solid: false },
  'X': { art: 'tree_canopy_2x2_cm', span: [2, 2], solid: false },
  // Grafikpass 4 §2.8: zweite, dunklere Kronenreihe (Back-Kuppen). Anker-Zeichen
  // 'Y','Z','A' (Legende-Namespace, getrennt von Palette-Tonen '=','+','*') fuer
  // tree_canopy_back_a/_b/_c, span:[2,2], NON-SOLID (Over-Layer). Sitzen EINE
  // Zeile ueber passenden Front-Ankern (getrennte Zellen) -> Back-Kuppe ragt hinter
  // 60-80% der Front-Kronen hervor. Setzung deterministisch via .tmp/gen_gfx4.mjs.
  'Y': { art: 'tree_canopy_back_a', span: [2, 2], solid: false },
  'Z': { art: 'tree_canopy_back_b', span: [2, 2], solid: false },
  'A': { art: 'tree_canopy_back_c', span: [2, 2], solid: false },
  // -------------------------------------------------------------------------
  // GRAFIKPASS 6 §5.5 — XL-KRONEN (Hebel "Maszstab"). Drei neue Groessen-
  // klassen im Over-Layer, je + Spiegelvariante (_m):
  //   '1'/'2' tree_canopy_xl_a(_m)  span [3,2] = 48x32 px
  //   '3'/'4' tree_canopy_xl_b(_m)  span [4,3] = 64x48 px  (M4-Beweiszelle)
  //   '5'/'6' tree_canopy_xl_c(_m)  span [3,2] = 48x32 px
  // Die Zeichen '1'..'6' hat der Generator .tmp/gen_over_gp6.mjs automatisch als
  // kollisionsfrei bestimmt (gegen GRAVEYARD_LEGEND, GRAVEYARD_ROWS und
  // GRAVEYARD_OVER_ROWS); 'P' unten (Wegsporn) stammt aus derselben Restliste.
  // Nie solid (Over-Layer) — man laeuft unter allen Kronen durch.
  //
  // swayPoses (§5.2): GEBACKENE Scher-Posen statt Pixel-Translation. Die Folge
  // hat Laenge 8 und traegt die Auslenkungen [0,+1,+2,+1,0,-1,-2,-1] ueber die
  // FUENF echten Posen (Basis, _r1, _r2, _l1, _l2). poses[0] === art ist
  // Engine-Assert (tilemap.js createTilemap) und garantiert die byte-gleiche
  // Ruhelage bei timeSec = 0. Die Belegung ist EXAKT das Feld swayPoses aus
  // .tmp/gen_crowns_gp6_out.json (Generator-Ausgabe, nicht nachgetippt).
  // Bei gesetztem swayPoses entfaellt die ax-Translation des Span-Zweigs
  // (tilemap.js §5.2) — sonst schert UND wackelt die Krone.
  //
  // shadowArt (§5.3): EIN-Draw-Schattenbake sw*16 x 32 statt sw Einzelkacheln.
  // Die GESPIEGELTEN Kronen (_m) ziehen bewusst DENSELBEN, UNGESPIEGELTEN
  // Schatten-Key (Jury-Deklaration §9): die Bake-Silhouette ist stark erodiert
  // und in Bayer-25 % gedithert, ein zweiter Spiegel-Bake waere 3 zusaetzliche
  // Art-Grids fuer einen im Bild nicht unterscheidbaren Unterschied.
  '1': {
    art: 'tree_canopy_xl_a', span: [3, 2], solid: false,
    swayPoses: ['tree_canopy_xl_a', 'tree_canopy_xl_a_r1', 'tree_canopy_xl_a_r2', 'tree_canopy_xl_a_r1',
      'tree_canopy_xl_a', 'tree_canopy_xl_a_l1', 'tree_canopy_xl_a_l2', 'tree_canopy_xl_a_l1'],
    shadowArt: 'canopy_shadow_xl_a',
  },
  '2': {
    art: 'tree_canopy_xl_a_m', span: [3, 2], solid: false,
    swayPoses: ['tree_canopy_xl_a_m', 'tree_canopy_xl_a_m_r1', 'tree_canopy_xl_a_m_r2', 'tree_canopy_xl_a_m_r1',
      'tree_canopy_xl_a_m', 'tree_canopy_xl_a_m_l1', 'tree_canopy_xl_a_m_l2', 'tree_canopy_xl_a_m_l1'],
    shadowArt: 'canopy_shadow_xl_a',
  },
  '3': {
    art: 'tree_canopy_xl_b', span: [4, 3], solid: false,
    swayPoses: ['tree_canopy_xl_b', 'tree_canopy_xl_b_r1', 'tree_canopy_xl_b_r2', 'tree_canopy_xl_b_r1',
      'tree_canopy_xl_b', 'tree_canopy_xl_b_l1', 'tree_canopy_xl_b_l2', 'tree_canopy_xl_b_l1'],
    shadowArt: 'canopy_shadow_xl_b',
  },
  '4': {
    art: 'tree_canopy_xl_b_m', span: [4, 3], solid: false,
    swayPoses: ['tree_canopy_xl_b_m', 'tree_canopy_xl_b_m_r1', 'tree_canopy_xl_b_m_r2', 'tree_canopy_xl_b_m_r1',
      'tree_canopy_xl_b_m', 'tree_canopy_xl_b_m_l1', 'tree_canopy_xl_b_m_l2', 'tree_canopy_xl_b_m_l1'],
    shadowArt: 'canopy_shadow_xl_b',
  },
  '5': {
    art: 'tree_canopy_xl_c', span: [3, 2], solid: false,
    swayPoses: ['tree_canopy_xl_c', 'tree_canopy_xl_c_r1', 'tree_canopy_xl_c_r2', 'tree_canopy_xl_c_r1',
      'tree_canopy_xl_c', 'tree_canopy_xl_c_l1', 'tree_canopy_xl_c_l2', 'tree_canopy_xl_c_l1'],
    shadowArt: 'canopy_shadow_xl_c',
  },
  '6': {
    art: 'tree_canopy_xl_c_m', span: [3, 2], solid: false,
    swayPoses: ['tree_canopy_xl_c_m', 'tree_canopy_xl_c_m_r1', 'tree_canopy_xl_c_m_r2', 'tree_canopy_xl_c_m_r1',
      'tree_canopy_xl_c_m', 'tree_canopy_xl_c_m_l1', 'tree_canopy_xl_c_m_l2', 'tree_canopy_xl_c_m_l1'],
    shadowArt: 'canopy_shadow_xl_c',
  },
  // Grafikpass 2: Boden-/Weg-/Mauer-Varianten gegen Flächen-Wiederholung
  // (variants[0] === art, deterministische Wahl aus der Tile-Koordinate).
  // §PRIO2 [GP4 R3] (Jury K1 "Gras-Tapete"): drei zusaetzliche Basis-Gras-Varianten
  // (v4 Dither Hauptdiagonale, v5 Gegendiagonale, v6 fast leer) + 1 Erd-Fleck-
  // Variante (grass_dark_earth) ANGEHAENGT. variantIndex(tx,ty,8) streut jetzt ueber
  // 8 statt 4 Grids -> bricht das uniforme Grundraster. variants[0] === grass_dark
  // bleibt (Engine-Assert); Reihenfolge 0-3 unveraendert, nur ergaenzt.
  // Grafikpass 5 §2.A1 GRAS-POOL (Wurzel-Fix "Gras-Tapete"): die '.'-Legende
  // zieht jetzt den KOMPLETTEN 47er-Pool grass_g5_00..46 (erzeugt in PHASE 0 von
  // .tmp/gen_grass_gp5.mjs, eingesetzt von Art). 47 ist PRIM und damit teilerfremd
  // zu jedem anderen n am selben Ort (§0.4); variantIndex(tx,ty,47) streut die
  // Kacheln dekorreliert. variants[0] === art === grass_g5_00 (Engine-Assert).
  // Die alten Basis-Grids grass_dark* bleiben in TILE_ART erhalten (kein Art-
  // Besitz hier), sind aber nicht mehr verdrahtet — Ersatz ist der Pool.
  // §3.B2 bankSet 'g': Gras ist LANDkachel am Teich -> Schlamm-Uferband.
  '.': {
    art: 'grass_g5_00', solid: false, fringeSource: true, fringeSet: 'grass', bankSet: 'g',
    variants: [
      'grass_g5_00', 'grass_g5_01', 'grass_g5_02', 'grass_g5_03', 'grass_g5_04', 'grass_g5_05',
      'grass_g5_06', 'grass_g5_07', 'grass_g5_08', 'grass_g5_09', 'grass_g5_10', 'grass_g5_11',
      'grass_g5_12', 'grass_g5_13', 'grass_g5_14', 'grass_g5_15', 'grass_g5_16', 'grass_g5_17',
      'grass_g5_18', 'grass_g5_19', 'grass_g5_20', 'grass_g5_21', 'grass_g5_22', 'grass_g5_23',
      'grass_g5_24', 'grass_g5_25', 'grass_g5_26', 'grass_g5_27', 'grass_g5_28', 'grass_g5_29',
      'grass_g5_30', 'grass_g5_31', 'grass_g5_32', 'grass_g5_33', 'grass_g5_34', 'grass_g5_35',
      'grass_g5_36', 'grass_g5_37', 'grass_g5_38', 'grass_g5_39', 'grass_g5_40', 'grass_g5_41',
      'grass_g5_42', 'grass_g5_43', 'grass_g5_44', 'grass_g5_45', 'grass_g5_46',
    ],
  },
  // §2.A1 TEIL-POOL ',' (Gras-Detail, 13 = ungerade, kein Faktor 5): die
  // ','-Zellen liegen MITTEN im '.'-Feld — bliebe hier eine einzige feste Kachel,
  // entstuende genau die Dichte-Naht, die der Pool beseitigen soll. Der Teil-Pool
  // ist die MITTEL-Dichteklasse des 47er-Pools (Deckung 6,6-10,2 % Glyph-Pixel,
  // gemessen ueber die Nicht-'e'-Pixel) plus das alte grass_detail-Grid, das
  // damit noch auf 1/13 der Zellen sichtbar bleibt. variants[0] === art.
  ',': {
    art: 'grass_g5_46', solid: false, fringeSource: true, fringeSet: 'grass', bankSet: 'g',
    variants: [
      'grass_g5_46', 'grass_detail', 'grass_g5_09', 'grass_g5_34', 'grass_g5_28',
      'grass_g5_35', 'grass_g5_30', 'grass_g5_33', 'grass_g5_37', 'grass_g5_42',
      'grass_g5_20', 'grass_g5_10', 'grass_g5_44',
    ],
  },
  // Grafikpass 3 §3.3/§4.1/§4.3 + GP3-R3 K-K1a/b/H-K1: begehbare Gras-Deko,
  // deterministisch per Hash-Noise gestreut (.tmp/gen_deco3.mjs, Details <1/9,
  // Makro-Patches ueber 2x2..3x3). ALLE wie '.'-Gras behandelt: solid:false UND
  // fringeSource/fringeSet 'grass' — ohne fringeSource entstuenden 1-Tile-Fringe-
  // Loecher an Weg-/Wasserkanten neben der Deko (Review-Major).
  // Drei unterscheidbare Gras-Detail-Sprites (K-K1a) + je Spiegel-Variante:
  // Grafikpass 4 §2.7b: die drei Deko-Glyphen tragen jetzt zusaetzlich ihre
  // 90-Grad-Rotationsvariante (_r1) als weitere variants — deterministische
  // variantIndex-Wahl streut die Ausrichtung, ohne Laufzeit-Flip.
  // §2.A2 UNGERADE-n-SWEEP: 'u' hatte n=2 (gerade) — die dritte Variante
  // grass_tuft_v1 (Art, §2.A2) macht daraus n=3.
  // GRAFIKPASS 6 §6.5 GRAS-POOLS 'u'/'j': n 3 -> 5. Art (Phase 1) hat je ZWEI
  // GROESSENSTUFEN nachgelegt (grass_tuft_sm/_lg bzw. grass_blade_sm/_lg); sie
  // haengen ans ENDE der Liste, variants[0] === art bleibt (Engine-Assert,
  // smoke §6#4e). n = 5 ist UNGERADE und teilerfremd zu JEDEM anderen n, das an
  // DERSELBEN Kachel zieht (§0.6): am Ort einer Deko-Zelle rechnen sonst nur die
  // VERSETZTEN Hashes (Anker 29/17, Bank 7, Tiefe 3, Lit-Dither 2) — die
  // untranslatierte variantIndex(tx,ty,n) zieht je Kachel genau EINMAL, weil
  // eine Kachel genau ein Legendenzeichen traegt. gcd(5,29)=gcd(5,17)=gcd(5,7)=
  // gcd(5,3)=gcd(5,2)=1.
  'u': { art: 'grass_tuft', solid: false, fringeSource: true, fringeSet: 'grass', bankSet: 'g', variants: ['grass_tuft', 'grass_tuft_r1', 'grass_tuft_v1', 'grass_tuft_sm', 'grass_tuft_lg'] },
  'j': { art: 'grass_blade', solid: false, fringeSource: true, fringeSet: 'grass', bankSet: 'g', variants: ['grass_blade', 'grass_blade_v1', 'grass_blade_r1', 'grass_blade_sm', 'grass_blade_lg'] },
  'k': { art: 'grass_speck', solid: false, fringeSource: true, fringeSet: 'grass', bankSet: 'g', variants: ['grass_speck', 'grass_speck_v1', 'grass_speck_r1'] },
  // Grafikpass 4 §3.8b/§4 Gras-Sway: zwei animierte Deko-Glyphen (Halme wiegen
  // sich, zweiter Frame _f1). Eigene Zeichen, weil variants UND anim an EINEM
  // Legendeneintrag verboten sind (createTilemap wirft). animRate langsam (0.8),
  // KEIN animSync -> die Positions-Offset-Mechanik staffelt die Halme (Bestand).
  // GRAFIKPASS 5 RUNDE 2 (Sway-Gate "4 Phasen"): die anim-Listen tragen jetzt
  // den VOLLEN Zyklus [ruhe, rechts, ruhe, links] (n = 4). Die Linksbiegungen
  // grass_tuft_f2/grass_blade_f2 liefert art/sprites.js (GP5-R2-Art-Fix 3);
  // tilemap.js artFor() nimmt bei n >= 4 den Wellen-Schritt direkt als
  // Frame-Index (SWAY_DX = [0,+1,0,-1]) -> 3 statt 2 Auslenkungs-Zustaende,
  // Vorzeichen bleibt clusterweise gleichsinnig (Bruchteil-Phasenversatz).
  'w': { art: 'grass_tuft', solid: false, fringeSource: true, fringeSet: 'grass', bankSet: 'g', anim: ['grass_tuft', 'grass_tuft_f1', 'grass_tuft', 'grass_tuft_f2'], animRate: 0.8 },
  'y': { art: 'grass_blade', solid: false, fringeSource: true, fringeSet: 'grass', bankSet: 'g', anim: ['grass_blade', 'grass_blade_f1', 'grass_blade', 'grass_blade_f2'], animRate: 0.8 },
  // Grafikpass 4 §2.7b Wiesenlicht-Makro: hellere/dunklere nahtlose Gras-Basis
  // in unregelmaessigen Patches (48-64px). Begehbar, WIE '.'-Gras (fringeSource/
  // fringeSet 'grass'), sonst entstuenden 1-Tile-Fringe-Loecher an den Patch-Raendern.
  // GRAFIKPASS 5 RUNDE 2 (Jury-Deckel 2 "GRAS-FLICKENTEPPICH" + SPEC §2.A3
  // "PATCH-RAENDER: Erosions-Varianten der MIX-Kacheln, ungerades n"):
  // Die Wiesenlicht-Familie lief bis hierher auf GENAU EINEM Grid je Zeichen
  // (n = 1). Solange die Klassen in 4 kleinen Rechtecken lagen (63 Kacheln) fiel
  // das kaum auf; das neue Value-Noise-Feld (.tmp/gen_wiesenlicht_gp5r2.mjs)
  // verteilt sie ueber ~190 Kacheln — ohne Varianten waere damit genau die
  // 16px-Kachelwiederholung zurueck, die GP5 R1 als "Wurzel-Fix" beseitigt hat.
  // Deshalb bekommt JEDES der sechs Zeichen eine variants-Liste mit n = 7:
  //  * 7 ist UNGERADE und teilerfremd zu ALLEN anderen n am selben Ort
  //    (Jitter 5, Gras-Pool 47, ','-Pool 13, 'e'-Pool 9, Deko 3) — §0.4.
  //  * variants[0] === art (Engine-Assert, smoke §6#4e).
  //  * Es entstehen KEINE neuen Art-Keys: gemischt wird ausschliesslich
  //    INNERHALB der jeweiligen Luma-Rampe (100 % / 75 % / 50 %), plus je EINE
  //    Erosions-Kachel aus dem Gras-Pool im aeusseren 50 %-Ring (§2.A3: der
  //    Patch-Rand franst dadurch auf 1/7 der Randzellen ins Grundgras aus).
  //  * Wirkung NACHGEMESSEN auf dem neuen Feld (151 Wiesenlicht-Kacheln):
  //    gleiche GRID-Nachbarschaften 57 -> 40 Paare, laengster Lauf identischer
  //    Grids 5 -> 3 Kacheln. Zum Vergleich der GP4-Stand: 63 Kacheln / 23 Paare
  //    — die Flaeche waechst also um Faktor 2,4, die sichtbare Wiederholung nur
  //    um Faktor 1,7, und die Laufgrenze 3 ist dieselbe wie beim Kanten-Gate.
  // Die Rampen-Semantik bleibt: der Schwerpunkt jeder Liste ist die Stufe, fuer
  // die das Zeichen steht (H 5/7 Voll-Luma, i 3/7 75 %, I 4/7 50 %).
  'H': {
    art: 'grass_lumahi', solid: false, fringeSource: true, fringeSet: 'grass', bankSet: 'g',
    variants: ['grass_lumahi', 'grass_lumahi_mix75', 'grass_lumahi', 'grass_lumahi_mix',
      'grass_lumahi', 'grass_lumahi_mix75', 'grass_lumahi'],
  },
  'L': {
    art: 'grass_lumalo', solid: false, fringeSource: true, fringeSet: 'grass', bankSet: 'g',
    variants: ['grass_lumalo', 'grass_lumalo_mix75', 'grass_lumalo', 'grass_lumalo_mix',
      'grass_lumalo', 'grass_lumalo_mix75', 'grass_lumalo'],
  },
  // Grafikpass 4 RUNDE 2 (§2.7b, Jury-Mandat d.1): MIX-Rand-Tiles der Wiesenlicht-
  // Patches. Orientierungs-agnostisches 2x2-Schachbrett Luma<->Grundgras, das die
  // Patch-Silhouette 4-6px in den Grundton ueberblendet (statt scharfe Rechteck-
  // kante). 'I' = grass_lumahi_mix (hell<->Gras), 'J' = grass_lumalo_mix
  // (dunkel<->Gras). Legende-Namespace, getrennt von den Palette-Tonen. WIE
  // '.'-Gras: begehbar (solid:false) UND fringeSource/fringeSet 'grass' — sonst
  // 1-Tile-Fringe-Loecher an den Patch-Raendern. Der Generator (.tmp/gen_gfx4.mjs)
  // setzt sie deterministisch auf alle Blob-Randzellen.
  // GP5 R2: n = 7 laut §2.A3 (Begruendung oben bei 'H'/'L'). Der aeussere Ring
  // traegt die EROSIONS-Kachel (ein mitteldichtes Gras-Pool-Grid) — genau dort
  // gehoert sie hin: die Patch-Silhouette franst aus, statt eine geschlossene
  // Linie zu ziehen.
  'I': {
    art: 'grass_lumahi_mix', solid: false, fringeSource: true, fringeSet: 'grass', bankSet: 'g',
    variants: ['grass_lumahi_mix', 'grass_lumahi_mix75', 'grass_g5_20', 'grass_lumahi_mix',
      'grass_g5_34', 'grass_lumahi_mix75', 'grass_lumahi_mix'],
  },
  'J': {
    art: 'grass_lumalo_mix', solid: false, fringeSource: true, fringeSet: 'grass', bankSet: 'g',
    variants: ['grass_lumalo_mix', 'grass_lumalo_mix75', 'grass_g5_33', 'grass_lumalo_mix',
      'grass_g5_28', 'grass_lumalo_mix75', 'grass_lumalo_mix'],
  },
  // §PRIO2 [GP4 R3] (Jury K1 "Patch-Kante Rampe"): ZWEITES Mix-Tile je Patchfarbe =
  // 75%-Dither ('i' = grass_lumahi_mix75, 'x' = grass_lumalo_mix75) fuer den INNEREN
  // Rand-Ring. Zusammen mit dem bestehenden 50%-_mix (I/J, aeusserer Ring) ergibt
  // sich die zweistufige Rampe Grund 0% -> aussen 50% -> innen 75% -> Kern 100%
  // (H/L). Legende-Namespace, getrennt von Palette-Tonen. WIE '.'-Gras: begehbar
  // (solid:false) UND fringeSource/fringeSet 'grass'. Der Ring wird deterministisch
  // per Distanz-Band gesetzt (.tmp/gen_grass_r3.mjs, laeuft NACH gen_gfx4).
  // GP5 R2: n = 7 laut §2.A3 (Begruendung oben bei 'H'/'L'). Der INNERE Ring
  // mischt in beide Richtungen (Voll-Luma und 50 %-Mix) — er ist die Mitte der
  // Rampe und darf nach oben wie nach unten dithern.
  'i': {
    art: 'grass_lumahi_mix75', solid: false, fringeSource: true, fringeSet: 'grass', bankSet: 'g',
    variants: ['grass_lumahi_mix75', 'grass_lumahi', 'grass_lumahi_mix', 'grass_lumahi_mix75',
      'grass_lumahi', 'grass_lumahi_mix', 'grass_lumahi_mix75'],
  },
  'x': {
    art: 'grass_lumalo_mix75', solid: false, fringeSource: true, fringeSet: 'grass', bankSet: 'g',
    variants: ['grass_lumalo_mix75', 'grass_lumalo', 'grass_lumalo_mix', 'grass_lumalo_mix75',
      'grass_lumalo', 'grass_lumalo_mix', 'grass_lumalo_mix75'],
  },
  'p': { art: 'pebble_small', solid: false, fringeSource: true, fringeSet: 'grass', bankSet: 'g' },
  // GRAFIKPASS 6 §6.3 WEGSPORN. Der 3-Kachel-Sporn vom Hauptweg an das
  // Teich-Westufer ((28,14)->(28,15)->(29,15), GP5 R2 .tmp/gen_teich_gp5r2.mjs)
  // lief bisher komplett ueber 'p' = pebble_small — dieselbe Einzelkiesel-Kachel
  // wie die gestreute Wiesen-Deko. Die zwei TRITTSTEIN-Kacheln bekommen jetzt
  // ein eigenes Grid: 'P' = path_pebbles (Art, Phase 1), ein dichteres
  // Kiesel-Pflaster, das den Sporn als WEG statt als Deko liest.
  // Zeichen 'P': aus der Restliste des Generators .tmp/gen_over_gp6.mjs
  // ("freie_zeichen_uebrig"), gegen GRAVEYARD_LEGEND, GRAVEYARD_ROWS und
  // GRAVEYARD_OVER_ROWS geprueft kollisionsfrei.
  // FLAGS EXAKT WIE 'p' (bindend, §6.3): solid false, fringeSource, fringeSet
  // 'grass', bankSet 'g'. Damit ist der Tausch emissions-neutral — der Fringe-/
  // Bank-/Shore-Nachbarschaftscode liest ausschliesslich diese vier Flags, die
  // sechs Nachbarzellen emittieren byte-gleich, und weil solid unveraendert
  // false bleibt, sind solHash UND geoHash (§36) unberuehrt.
  'P': { art: 'path_pebbles', solid: false, fringeSource: true, fringeSet: 'grass', bankSet: 'g' },
  'd': { art: 'dirt_patch', solid: false, fringeSource: true, fringeSet: 'grass', bankSet: 'g' },
  // Seltenes Grossdetail (H-K1, ~1/6-8 der Detail-Zellen): kraeftigere Erdfleck-Variante.
  // §2.A2 UNGERADE-n-SWEEP: n war 2 (gerade) und stand NICHT auf der Spec-Liste —
  // der Sweep gilt aber fuer JEDE Liste (§2.A2 "KEINE variants-Liste mit geradem n").
  // Es gibt kein drittes Erdfleck-Grid (Art liefert in GP5 keins), deshalb loest der
  // Sweep hier ueber eine GEWICHTUNG: dirt_patch_v1 doppelt -> n=3, Mischung 2:1
  // zugunsten des kraeftigeren Grossdetails (Praezedenz: CATACOMBS 'S', GP4 R2).
  'r': { art: 'dirt_patch_v1', solid: false, fringeSource: true, fringeSet: 'grass', bankSet: 'g', variants: ['dirt_patch_v1', 'dirt_patch', 'dirt_patch_v1'] },
  // Makro-Patch (K-K1b): unregelmaessige dunklere Gras-Cluster. Das Asset-Set hat
  // keinen dunkler-gruenen Vollton als das Basisgras ('.' == grass_dark, #19241d,
  // bereits der dunkelste Gruenton), daher nutzt der Makro-Layer die erdig/moosige
  // grass_dark_v3-Konzentration als verfuegbare 2. Makro-Textur (keine neuen Art-
  // Grids). variants[0] === art (Engine-Assert). WIE '.'-Gras: begehbar, Gras-Fringe.
  // §2.A1 TEIL-POOL 'e' (9 = ungerade, kein Faktor 5): der Makro-Patch behaelt
  // seinen Charakter (grass_dark_v3 4x + dirt_patch 1x = 5/9), bekommt aber 4/9
  // aus der DICHTE-Klasse des 47er-Pools (Deckung 12,5-17,6 %) — die Patch-Naht
  // zum neuen '.'-Feld verschwindet, ohne dass der dunkle Cluster zerfaellt.
  // variants[0] === art (Engine-Assert), Reihenfolge bewusst verzahnt.
  'e': {
    art: 'grass_dark_v3', solid: false, fringeSource: true, fringeSet: 'grass', bankSet: 'g',
    variants: [
      'grass_dark_v3', 'dirt_patch', 'grass_dark_v3', 'grass_g5_41', 'grass_dark_v3',
      'grass_g5_01', 'grass_dark_v3', 'grass_g5_24', 'grass_g5_16',
    ],
  },
  // §2.A2: '=' hatte n=4 (gerade) -> path_v6 (Art: ausgefahrene Senke) haengt an, n=5.
  // §3.B2 bankSet 'g': der Weg ist am Teichsuedrand LANDkachel (Schlamm-Uferband).
  '=': { art: 'path', solid: false, fringeTarget: true, bankSet: 'g', variants: ['path', 'path_v1', 'path_v2', 'path_v3', 'path_v6'] },
  'G': { art: 'gravestone', solid: true },
  'g': { art: 'gravestone_2', solid: true },
  'h': { art: 'gravestone_3', solid: true },
  'b': { art: 'bush_dead', solid: true },
  'o': { art: 'bones', solid: false },
  // GP5 R2 (Auftrag ART (5) "Props-Miniprogramm ... Schaedel-Varianten"): Art
  // hat skull_v1 (gespiegelt, Kiefer offen) und skull_v2 (halb im Boden
  // versunken) geliefert. Der Friedhof traegt SECHS 's'-Zellen — ohne Varianten
  // stuende dort sechsmal exakt derselbe Schaedel. n = 7 statt 3 (beide
  // ungerade und teilerfremd zu 5/47/13/9/3), weil variantIndex auf genau
  // diesen sechs Koordinaten bei n = 3 nur die Reste 1 und 2 liefert — das
  // Basis-Grid waere nie zu sehen gewesen. Mit n = 7 stehen 2x skull,
  // 3x skull_v1, 1x skull_v2 (nachgerechnet). variants[0] === art.
  's': {
    art: 'skull', solid: false,
    variants: ['skull', 'skull_v1', 'skull_v2', 'skull', 'skull_v2', 'skull_v1', 'skull'],
  },
  'f': { art: 'fence', solid: true },
  // Grafikpass 3 §2.2: Wasser wird ein nahtloser 4-Frame-ZYKLUS (kein Ping-Pong
  // mehr): Baender wandern pro Frame 4 px nach unten, 4×4 = 16 px = Kachelhoehe →
  // Frame 3 → Frame 0 uebergangsfrei. art:'water' bleibt Frame 0/Fallback, solid +
  // fringeTarget unberuehrt. §8a.3: shorePrefix lenkt die Gras-Fringes dieses
  // TARGETs auf shore_*-Ufer-Keys um (nur hier, nur bei Quelle-Set 'grass').
  // §8b.1: depthOverlays legt statische Tiefen-Schleier ueber das animierte Wasser.
  '~': { art: 'water', solid: true, fringeTarget: true, shorePrefix: 'shore', anim: ['water', 'water_1', 'water_2', 'water_3'], animRate: 3, animSync: true, depthOverlays: ['water_shallow', 'water_mid_calm'] },
  // Grafikpass 4 §3.8a/§4: Fackel-Flamme jetzt 3-Frame-Zyklus (torch_2 = dritter
  // Frame). animRate wie Bestand (Default 6), Positions-Offset (kein animSync)
  // laesst benachbarte Fackeln versetzt flackern.
  'F': { art: 'torch_0', solid: true, anim: ['torch_0', 'torch_1', 'torch_2'] },
  'D': { art: 'crypt_stairs_down', solid: false },
};

// Over-Layer Friedhof (Grafikpass 3): 2x2-Grosskronen (Anker = obere linke Ecke,
// decken je einen Stamm in der Unterzeile — Wurzeln bleiben sichtbar) fuer die
// Baumreihen/Cluster, 16x16-Fueller ('B' canopy_bottom auf dem Stamm, 'K'
// canopy_top darueber) fuer isolierte Einzelstaemme. Man laeuft unter allen
// Kronen durch. '.' = leere Zelle. §3.2/§4.1: die Rotation nutzt SECHS
// Silhouetten — M/N/O plus die gespiegelten Q/V/X (nie gleiche Silhouette
// benachbart, nicht strikt alternierend).
//
// GRAFIKPASS 5 §4.C3 (NEU ERZEUGT, .tmp/gen_crowns_gp5.mjs --apply):
// Die GP3/GP4-Setzung war eine dichte Saeule je Baumreihe (ein Anker pro Zeile,
// feste Spalte) — im Bild las sich das als senkrechtes Raster. Das neue Raster:
//  * SPALTEN-ALTERNATION: die Ankerspalte wechselt je Schritt zwischen tx und
//    tx-1, die Saeule steht nicht mehr im Lot.
//  * ZEILENSCHRITT {2,3} GEMISCHT statt "jede Zeile ein Anker" — die Luecken
//    lassen die Back-Kuppen (Y/Z/A) und den Himmel wieder durch; die
//    Schritt-3-Luecken tragen 16x16-Fueller ('B').
//  * NIE ZWEI SCHMALE Silhouetten (O/X = _c/_cm) benachbart, nie zwei gleiche.
//  * DRITTES CLUSTER in der Kartenmitte (ty >= 13): zwei 2x2-Anker auf den
//    isolierten Mittel-Staemmen plus sechs 'C'-Mittel-Fueller ueber begehbarem
//    Grund, jeder auf der Kachel UEBER einer Standkachel — der Spieler laeuft
//    mit dem KOPF durch die Krone (Beweis-Szene g5_10_unter_kronen).
//  * GUARDS: Zeile 12 und Spalte 21 des Smoke-Fensters (smoke:651-656) bleiben
//    LEER — das §4.C2-Culling zieht tyEnd um +1 und txStart um 1 nach links.
// Anker-Offset kommt zur Laufzeit aus tilemap.js (§4.C2: dx pro Anker-Klasse
// bis ±14, dy -4..+4; der canopy_shadow wandert mit).
//
// GRAFIKPASS 6 §5.5 — NEU ERZEUGT (.tmp/gen_over_gp6.mjs, Ausgabe
// .tmp/gen_over_gp6_rows.txt, hier byte-gleich uebernommen). Der GP5-Stand war
// eine gestreute Einzelkronen-Landschaft ohne Maszstabssprung: die groeszte
// Silhouette war 32x32 px, also zwei Kacheln — auf 320x180 liest das als
// Buschwerk, nicht als Baumkrone. Das neue Raster:
//  * ZWEI GESCHLOSSENE XL-DAECHER. Nord um (31,9) MIT 'tree_canopy_xl_b'
//    (Anker (30,8), deckt Tiles 30..33 / Zeilen 8..10) — die M4-Beweiszelle
//    (31,9) liegt mittig darunter, der Spieler laeuft dort mit dem KOPF durch
//    das Laub (verdeckt_kopf 191 / silhouette_kopf 191 = Quotient 1,000).
//    Suedwest um (12,22) mit 'tree_canopy_xl_b_m' (Anker (10,21)).
//  * SPALTEN-PITCH 2 im Dach (16 px Ueberlappung): bei Pitch 3 rissen die
//    +-4-px-Anker-Jitter (ANCHOR_CLAMP W=4) Loecher ins Dach.
//  * 2x2- und Back-Kronen AUSGEDUENNT (2x2 22->21, Back 18->7, 'B' 10->0),
//    'C'-Mittelcluster unveraendert (6). Gesamt 56 -> 64 Anker.
//  * GUARDS zeilenexplizit eingehalten (Generator-Selbstpruefung, §5.5):
//    Spalte 21 leer in ALLEN Zeilen 0..12; Zeile 12 leer in ALLEN Spalten
//    0..21. Beides haelt das Culling-Fenster des Smoke-Tests (smoke:695-697)
//    stabil, obwohl der Over-Zweig jetzt bis tx1+1 laeuft (§5.4).
//  * KEINE span-Zeichen in den Ground-rows, keine Fackelzeichen im Over-Layer,
//    Maszgabe 24x40 unveraendert. sol/geo bleiben unberuehrt (solHash liest nur
//    Ground-rows, geoHash nur Spawns/Portale/findTiles('F')).
const GRAVEYARD_OVER_ROWS = [
  '.O......X...............................',
  'Q.....................................Y.',
  '........................................',
  '.....................................X..',
  '........................................',
  '.....................................O..',
  '.........................1.6.2.5.1.6.A..',
  '........................................',
  'M.......................5.2.6.3...1.5...',
  'V.......................................',
  'V........................6.1.5.2.6.1.V..',
  '......................................Z.',
  '......................................N.',
  '........................................',
  '.....................................X..',
  '.....................................Q..',
  '..................C...C.................',
  '....................C.................N.',
  'V....................................Z..',
  '..Y.................C.C.................',
  '.QY....5.2.6.1.5.2.....C..........A..Q..',
  '.MX.......4..............X..........XQ..',
  '......1.6.....5.2.......................',
  '........................................',
];

// ---------------------------------------------------------------------------
// KATAKOMBEN — 40×24 Tiles, Rand komplett solide. Gänge + 4 Kammern:
// Eingang (Treppe hoch, NW) → Nordhalle → Quergang/Westkammer →
// Südgang → Schatzkammer (SO, hinterste Kammer, Truhe von Ghulen bewacht).
// Legende: # Ziegelwand, . Steinboden, , rissiger Steinboden, P Pfeiler,
// R Schutt, S Sarkophag, W Wandfackel (animiert, solide),
// U Treppe aufwärts (begehbar, Portal zurück zum Friedhof).
// Grafikpass 3 §4.3: Riss-Kacheln (',') ausgeduennt auf den 1/7-Hash-Schnitt der
// Bodenflaeche (variantIndex(x,y,7)===0): 20 -> 3 Risse, ','->'.'-Tausch, entklumpt.
// Erzeugt/verifiziert via .tmp/gen_deco3.mjs (Soliditaet/Spawns/Portale/Fackeln
// byte-identisch zu 204e28f — '.' und ',' sind beide begehbar).
const CATACOMBS_ROWS = [
  '########################################',
  '#####W########W######W##################',
  '##.......#W##..........#################',
  '##.U...........P....P..##W##############',
  '#W............................##########',
  '##.......####.,...............##########',
  '##R......####..P....P..#####..##########',
  '####..#######R.........#####..W#########',
  '###W..##########..##########..##########',
  '####..#########W..#########W..##########',
  '####..#W########..W#########..#W####W###',
  '####..............#########...........##',
  '###W,.............########W.....SS..D.##',
  '###.........#W#############...P....P..##',
  '###.........W##############..,........W#',
  '###..SS.....###############...........##',
  '###.........##W#########W##...........##',
  '###...................................##',
  '###...........................P....P..##',
  '###.........#######W#######...........W#',
  '#####W#####################R.........R##',
  '#################################W######',
  '########################################',
  '########################################',
];

// Slice 1.5: Moos-Fringe — Ziegelwand (fringeSource, Set 'moss', keine Ecken)
// wächst über die Steinboden-Ränder (fringeTarget). Weicht die harten Wand-
// Boden-Kanten auf (SoM-Look), ohne Begehbarkeit zu ändern.
const CATACOMBS_LEGEND = {
  // Grafikpass 2: Ziegel-/Steinboden-Varianten gegen Flächen-Wiederholung.
  // Grafikpass 2 R3 (§8b.3): brick_wall_v3/stone_floor_v3 als vierte Varianten.
  // Grafikpass 4 RUNDE 2 (§ Jury-Mandat d.2, H-K1 "Katakomben-Mauer"): Moos-Brick-
  // Varianten brick_moss_tl/_br via variants[] verdrahtet. Ziel-Mix ~40/30/30
  // (kahl / Moos-oben-links / Moos-unten-rechts): 4 kahle Textur-Varianten (Indizes
  // 0-3 = ~40%), 3x brick_moss_tl (~30%), 3x brick_moss_br (~30%) -> variantIndex
  // (tx,ty,10) streut sie deterministisch. variants[0] === art (Engine-Assert).
  // Soliditaet/fringe bleiben (Varianten aendern nur das gezeichnete Grid, nicht
  // solid) -> CATACOMBS sol/geo bleiben byte-identisch (§36). Hinweis: eine
  // Positions-Hash-Streuung kann "nie zwei identische horizontal benachbart" fuer
  // durchgehende Wandreihen NICHT garantieren (das forderte die Jury nur fuer die
  // Plaketten, s.u.) — hier zaehlt der 40/30/30-Mix.
  // Grafikpass 5 §2.A2 UNGERADE-n-SWEEP: n war 10 (gerade) — brick_wall_v4
  // (Art: abgeplatzter Ziegel mit dunkler Kaverne) haengt an -> n=11 (prim).
  // Der Mix verschiebt sich von 40/30/30 auf ~45/27/27 (5 kahle Texturen,
  // 3x Moos-oben-links, 3x Moos-unten-rechts) — der Jury-Mix bleibt gewahrt.
  // GP5 RUNDE 3 VERDRAHTUNGS-NACHZUG (Jury R2, Auftrag 5 "Ziegel 4 Luminanz-
  // Stufen"): brick_wall_l1..l4 lagen fertig in art/sprites.js, waren aber an
  // KEINE Legende gehaengt und damit wirkungslos. Sie haengen hier an -> n = 15
  // (UNGERADE, teilerfremd zu 5/7/17/29/47). Der Moos-Anteil sinkt von 6/11 auf
  // 6/15, der kahle Texturanteil steigt entsprechend — genau die Streuung, die
  // die dy-Autokorrelation der Wandflaeche druecken soll (gemessen in sprites.js:
  // dy4 0,626 -> 0,452, dy8 0,967 -> 0,667).
  '#': { art: 'brick_wall', solid: true, fringeSource: true, fringeSet: 'moss', variants: ['brick_wall', 'brick_wall_v1', 'brick_wall_v2', 'brick_wall_v3', 'brick_moss_tl', 'brick_moss_tl', 'brick_moss_tl', 'brick_moss_br', 'brick_moss_br', 'brick_moss_br', 'brick_wall_v4', 'brick_wall_l1', 'brick_wall_l2', 'brick_wall_l3', 'brick_wall_l4'] },
  // §2.A2: n war 4 (gerade) -> stone_floor_v4/_v5/_v6 (Art: Kiesel-/Kratzer-
  // Programm) haengen an, n=7 (prim). Der Katakomben-Boden ist die groesste
  // zusammenhaengende Wiederholungsflaeche der Ebene.
  '.': { art: 'stone_floor', solid: false, fringeTarget: true, variants: ['stone_floor', 'stone_floor_v1', 'stone_floor_v2', 'stone_floor_v3', 'stone_floor_v4', 'stone_floor_v5', 'stone_floor_v6'] },
  // Grafikpass 3 §3.3/§4.1: drei Riss-Motive statt eines "7"-Stempels
  // (variants[0] === art). Die ','-Dichte wurde zugleich ausgeduennt (§4.3,
  // .tmp/gen_deco3.mjs) — Soliditaet/Begehbarkeit bleiben byte-identisch ('.'
  // und ',' sind beide solid:false, fringeTarget:true).
  ',': { art: 'stone_floor_cracked', solid: false, fringeTarget: true, variants: ['stone_floor_cracked', 'stone_floor_cracked_v1', 'stone_floor_cracked_v2'] },
  'P': { art: 'pillar', solid: true },
  'R': { art: 'rubble', solid: true },
  // Grafikpass 4 RUNDE 2 (§ Jury-Mandat d.2, K/M "Katakomben-Plaketten"): Sarkophag-
  // Reliefdeckel als Plaketten-Panel; 2 Gravur-Varianten (v1 versetzte Gravur, v2
  // angebrochene Ecke) via variants[]. Die 4 S-Tiles bilden 2 horizontale Paare —
  // (32,12)/(33,12) und (5,15)/(6,15). variantIndex(x,y,4) liefert fuer beide Paare
  // UNTERSCHIEDLICHE Indizes (3/2 bzw. 0/2) -> nie zwei identische Plaketten
  // horizontal benachbart. n=4 (nicht 3) ist noetig, weil bei n=3 das Paar
  // (32,12)/(33,12) kollidiert; der 4. Slot dupliziert sarcophagus_v1. variants[0]
  // === art (Engine-Assert), solid unveraendert (§36 sol/geo halten).
  // Grafikpass 5 §2.A2: n war 4 (gerade) — der Sweep gilt fuer JEDE Liste, auch
  // wenn 'S' nicht auf der Spec-Aufzaehlung stand. Neue Laenge 5 (ungerade, kein
  // Faktor... 5 ist die von §2.A2 selbst gesetzte Ziel-Laenge fuer die 4er-Listen).
  // Die Jury-Auflage "nie zwei identische Plaketten horizontal benachbart" bleibt
  // NACHGERECHNET erfuellt: variantIndex(x,y,5) liefert fuer (32,12)/(33,12) die
  // Indizes 0/4 (sarcophagus / sarcophagus_v2) und fuer (5,15)/(6,15) die Indizes
  // 1/4 (sarcophagus_v1 / sarcophagus_v2) — beide Paare zeigen verschiedene Grids.
  'S': { art: 'sarcophagus', solid: true, variants: ['sarcophagus', 'sarcophagus_v1', 'sarcophagus_v2', 'sarcophagus_v1', 'sarcophagus_v2'] },
  // Grafikpass 4 §3.8a/§4: Wandfackel jetzt 3-Frame-Zyklus (torch_wall_2).
  'W': { art: 'torch_wall_0', solid: true, anim: ['torch_wall_0', 'torch_wall_1', 'torch_wall_2'] },
  'U': { art: 'stairs_up', solid: false },
  // Slice 3: Abgang zur FLUESTERGRUFT in der Schatzkammer (begehbar, Portal).
  'D': { art: 'crypt_stairs_down', solid: false },
};

// tc()/tileRect() siehe world/coords.js (oben importiert und re-exportiert).

export const GRAVEYARD = {
  rows: GRAVEYARD_ROWS,
  legend: GRAVEYARD_LEGEND,
  overRows: GRAVEYARD_OVER_ROWS,
  playerSpawn: tc(3, 12),
  skeletonSpawns: [
    tc(10, 3),
    tc(25, 4),
    tc(33, 8),
    tc(20, 16),
    tc(8, 18),
    tc(25, 20),
  ],
  ghoulSpawns: [],
  enemySpawns: [
    { ...tc(18, 10), kind: 'hound' },
    { ...tc(15, 19), kind: 'hound' },
  ],
  propSpawns: [
    { ...tc(6, 4), kind: 'vase' },
    { ...tc(12, 9), kind: 'urn' },
    { ...tc(23, 15), kind: 'vase' },
    { ...tc(31, 19), kind: 'urn' },
    { ...tc(6, 20), kind: 'vase' },
  ],
  // Krypta-Treppe (die beiden D-Tiles) → Katakomben, Spawn in der
  // Eingangskammer NEBEN der Treppe nach oben (nicht im Gegenportal).
  //
  // SLICE 6 §6.2 — WESTTOR NACH GRAMFELD (die EINZIGE geo-Aenderung, Michael-
  // Entscheid §9.M2 JA vom 15.08.2026; sanktioniert an GENAU zwei Orten:
  // smoke_test.mjs:2150 und smoke_test.mjs:3572, nichts weiter).
  // Der Anker ist die BESTEHENDE Wegkachel (1,12): GRAVEYARD_ROWS[12][1] === '='
  // (Legende '=' -> art 'path', solid:false) — die westlichste Zelle des
  // Hauptwegs, der quer durch den Friedhof laeuft. Es wird KEIN Zeichen
  // getauscht und KEINE Legende angefasst: das Soliditaets-Raster (sol-Hash)
  // bleibt byte-identisch, nur der geo-Hash (er hasht die Portal-Liste mit)
  // aendert sich. Ziel-Spawn tc(39,15) = der DORF-Eintritt am Osttor.
  // GDDs "oben das Dorf" meint die vertikale Erzaehlung (Dorf ueber den
  // Katakomben), nicht die Himmelsrichtung — deklariert (§6.2).
  portals: [
    { ...tileRect(32, 2, 2, 1), target: 'CATACOMBS', spawn: tc(6, 4) },
    { ...tileRect(1, 12, 1, 1), target: 'DORF', spawn: tc(39, 15) },
  ],
  // GRAFIKPASS 6 §3.2 BELICHTUNGS-SOCKEL (GP6-§7A): 0.45 -> 0.22. Die
  // Paletten-Offsets (§3.1) heben die Grundtoene um +15 L an; ohne die
  // Ambient-Absenkung frisst das Dunkel-Overlay den Gewinn wieder auf.
  // Median-Prognose 39,2 (M1-Band 38..46). Die drei sanktionierten
  // .tmp/check_main_slice1.mjs-Zeilen (202/246/283) sind mitgezogen.
  ambient: 0.22,
  // Grafikpass 3 §2.3/§4.2: Farbtemperatur des Dunkel-Overlays (blauviolette Nacht).
  ambientTint: '#0a0a18',
  playerLightRadius: 40,
  fog: true,
  torchChars: ['F'],
  // SLICE 5 §4.4 — KARTENMUSIK, datengetrieben am mapDef (Muster
  // mapDef.extraLights: fehlt das Feld, passiert nichts). Der Schluessel
  // zeigt in game/js/audio/songs/index.js. §36-geoHash-frei: gehasht werden
  // playerSpawn/Spawns/Portale/torchChars-findTiles, nicht dieses Feld.
  music: 'graveyard',
};

export const CATACOMBS = {
  rows: CATACOMBS_ROWS,
  legend: CATACOMBS_LEGEND,
  playerSpawn: tc(6, 4), // Dev-Start (?map=CATACOMBS); regulär via Portal-Spawn
  skeletonSpawns: [
    tc(17, 3),
    tc(26, 4),
    tc(16, 10),
    tc(8, 12),
    tc(7, 17),
    tc(18, 18),
    tc(23, 17),
    tc(31, 19),
  ],
  ghoulSpawns: [
    tc(9, 15),  // Westkammer
    tc(31, 15), // Schatzkammer (Wachen)
    tc(34, 14),
    tc(34, 17),
  ],
  enemySpawns: [
    { ...tc(20, 4), kind: 'hound' },  // Nordhalle
    { ...tc(20, 17), kind: 'hound' }, // Suedgang
    { ...tc(7, 14), kind: 'rust' },   // Wache Bumerang-Truhe (Westkammer)
    { ...tc(14, 12), kind: 'rust' },  // Westgang
    { ...tc(33, 16), kind: 'rust' },  // Schatzkammer
  ],
  propSpawns: [
    { ...tc(7, 5), kind: 'vase' },
    { ...tc(13, 2), kind: 'urn' },
    { ...tc(22, 6), kind: 'vase' },
    { ...tc(29, 4), kind: 'urn' },
    { ...tc(29, 12), kind: 'vase' },
    { ...tc(5, 13), kind: 'vase' },
    // Slice 2: Vase von tc(4,16) nach tc(4,17) verschoben, das Tile gehoert
    // jetzt der Bumerang-Truhe (Westkammer, bewacht von einem Rostpanzer).
    { ...tc(4, 17), kind: 'vase' },
    { ...tc(4, 16), kind: 'chest', content: 'boomerang' },
    { ...tc(10, 19), kind: 'urn' },
    { ...tc(13, 17), kind: 'urn' },
    { ...tc(21, 18), kind: 'vase' },
    { ...tc(27, 19), kind: 'urn' },
    { ...tc(36, 19), kind: 'urn' },
    // Slice 3 (§2.5 Umwidmung): die fruehere Siegtruhe wird zur Gold-Truhe
    // (oeffnet per Schwert, streut 8-12 Muenzen, pusht NIEMALS 'chest_opened' —
    // der Sieg zieht hinter den Boss). Von Ghulen bewacht.
    { ...tc(36, 15), kind: 'chest', content: 'gold' },
  ],
  // Treppe nach oben (U-Tile) → Friedhof, Spawn südlich vor der Krypta-Lücke
  // (nicht im Friedhofs-Portal, das liegt auf den D-Tiles bei y=2).
  // Slice 3: D-Tile (36,12) → FLUESTERGRUFT (Abgang in der Schatzkammer),
  // Ziel-Spawn in der Eingangskammer der Gruft (nicht im Gegenportal).
  portals: [
    { ...tileRect(3, 3), target: 'GRAVEYARD', spawn: tc(33, 5) },
    { ...tileRect(36, 12), target: 'FLUESTERGRUFT', spawn: tc(4, 4) },
  ],
  // Grafikpass 3 §4.2: 0.82 -> 0.78 (jetzt UMGESETZT — die zwei sanktionierten
  // Flusstest-Zeilen in .tmp/check_main_slice1.mjs sind laut §5.1 mitgezogen,
  // sodass der Test gruen bleibt). Der GP2-"ZURUECKGENOMMEN"-Vermerk ist damit
  // erledigt.
  // GRAFIKPASS 6 §3.2 (GP6-§7A): 0.78 -> 0.55. Median-Prognose 41,2
  // (M1-Band 40..50); die zwei sanktionierten Zeilen 229/236 in
  // .tmp/check_main_slice1.mjs sind mitgezogen.
  ambient: 0.55,
  // Grafikpass 3 §2.3/§4.2: kaltes Blau (Katakomben-Steinkaelte).
  ambientTint: '#06080f',
  playerLightRadius: 52,
  fog: false,
  torchChars: ['W'],
  music: 'catacombs',   // SLICE 5 §4.4
};

// Slice 6: DORF haengt ANS ENDE (die Reihenfolge ist die Erzaehlung: Friedhof ->
// Katakomben -> Gruft -> Bosskammer, das Dorf als fuenfte, gegnerfreie Karte).
// Der Zaehler in .tmp/check_builderA_slice3.mjs:55 (MAPS hat 4 Eintraege) ist
// dafuer als §7.B(7) sanktioniert.
export const MAPS = { GRAVEYARD, CATACOMBS, FLUESTERGRUFT, BOSS_KAMMER, DORF };

// Portal-Gate (Slice 3 §3). PURE Funktion, KEINE Imports/Seiteneffekte —
// main.js ruft sie im Portal-Loop, Smoke 33 testet sie headless direkt
// (main.js ist nicht Node-importierbar, deshalb lebt die Logik hier).
//
//   'locked'  Portal verlangt einen Schluessel (portal.requires), den der
//             Spieler nicht traegt (nicht in player.inv.zelda).
//   'sealed'  Portal ist bossLocked und ein Grabwaechter lebt, dessen state
//             NICHT 'idle' ist (Fluchtklausel §2.6.4: solange der Boss idle
//             steht, blockt die Sperre NICHT — der Spieler darf farmen gehen).
//   null      frei passierbar.
export function portalBlocked(portal, player, enemies) {
  if (portal.requires) {
    const keys = (player && player.inv && player.inv.zelda) || [];
    if (!keys.includes(portal.requires)) return 'locked';
  }
  if (portal.bossLocked) {
    // "lebt" = existiert und ist nicht im Sterbe-Zustand; "state NICHT idle"
    // = bereits aggro. So entsiegelt der Boss-Tod das Portal sofort (state
    // 'die'), und die Pruefung haengt nicht an einem hp-Feld (robust gegen
    // die headless Test-Objekte in Smoke 33).
    const bossAggro = (enemies || []).some(
      (e) => e.kind === 'graveward' && e.state !== 'idle' && e.state !== 'die'
    );
    if (bossAggro) return 'sealed';
  }
  return null;
}
