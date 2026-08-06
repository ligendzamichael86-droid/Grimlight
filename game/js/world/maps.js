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

import { tc, tileRect } from './coords.js';
import { FLUESTERGRUFT } from './map_fluestergruft.js';
import { BOSS_KAMMER } from './map_bosskammer.js';

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
const GRAVEYARD_ROWS = [
  '########################################',
  '#TT.,.ebeT.....,......,..s.o..######..T#',
  '#T.wyyo.e.,...,...b.eee...,...#.DD.#..T#',
  '#..Gwg.he.,......G.geh.G...ww.#....#,.T#',
  '#...o...............e.s....yb.##..##..T#',
  '#..g.G.h..u....F.....G.h.g......o.....T#',
  '#.,....bkIII...==....ffJJJff.........pT#',
  '#..G.g.GIIpI,..==....gJhJGx.....G.gr..T#',
  '#....o..III....==.....JxrxLx.........,T#',
  '#T...,..I.i....==.....xLx,x.eee.T..b.kT#',
  '#T.,..s..iH....==..,..,x.JJ.ee.T......T#',
  '#T........iI...==....u.JJJ.oee,......kT#',
  '#=================================,...T#',
  '#=================================,...T#',
  '#.,..b...F..f..f........,..s..d.~~....T#',
  '#ee..Gkg.....Gjh.........I....~~~~~~..T#',
  '#e.o....JxLxr.....e.....,i...~~~~~~~~~T#',
  '#re,.G.h..uLxg.G..e...i.iHi..~~~~~~~~~T#',
  '#e.e......LLx.b..,eeeiHiIi..F..~~...u.T#',
  '#Te.ee,...Lx.....owy..iGpg.......d....T#',
  '#Te.,..sJJx.g.G...wy...I.........,..bTT#',
  '#TTeee..b.wy.........,....o...p.,....TT#',
  '#TTTe..,..wy.T..s...d.....T........uTTT#',
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
  'B': { art: 'tree_canopy_bottom', solid: false },
  'K': { art: 'tree_canopy_top', solid: false },
  'C': { art: 'tree_canopy', solid: false },
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
  'u': { art: 'grass_tuft', solid: false, fringeSource: true, fringeSet: 'grass', bankSet: 'g', variants: ['grass_tuft', 'grass_tuft_r1', 'grass_tuft_v1'] },
  'j': { art: 'grass_blade', solid: false, fringeSource: true, fringeSet: 'grass', bankSet: 'g', variants: ['grass_blade', 'grass_blade_v1', 'grass_blade_r1'] },
  'k': { art: 'grass_speck', solid: false, fringeSource: true, fringeSet: 'grass', bankSet: 'g', variants: ['grass_speck', 'grass_speck_v1', 'grass_speck_r1'] },
  // Grafikpass 4 §3.8b/§4 Gras-Sway: zwei animierte Deko-Glyphen (Halme wiegen
  // sich, zweiter Frame _f1). Eigene Zeichen, weil variants UND anim an EINEM
  // Legendeneintrag verboten sind (createTilemap wirft). animRate langsam (0.8),
  // KEIN animSync -> die Positions-Offset-Mechanik staffelt die Halme (Bestand).
  'w': { art: 'grass_tuft', solid: false, fringeSource: true, fringeSet: 'grass', bankSet: 'g', anim: ['grass_tuft', 'grass_tuft_f1'], animRate: 0.8 },
  'y': { art: 'grass_blade', solid: false, fringeSource: true, fringeSet: 'grass', bankSet: 'g', anim: ['grass_blade', 'grass_blade_f1'], animRate: 0.8 },
  // Grafikpass 4 §2.7b Wiesenlicht-Makro: hellere/dunklere nahtlose Gras-Basis
  // in unregelmaessigen Patches (48-64px). Begehbar, WIE '.'-Gras (fringeSource/
  // fringeSet 'grass'), sonst entstuenden 1-Tile-Fringe-Loecher an den Patch-Raendern.
  'H': { art: 'grass_lumahi', solid: false, fringeSource: true, fringeSet: 'grass', bankSet: 'g' },
  'L': { art: 'grass_lumalo', solid: false, fringeSource: true, fringeSet: 'grass', bankSet: 'g' },
  // Grafikpass 4 RUNDE 2 (§2.7b, Jury-Mandat d.1): MIX-Rand-Tiles der Wiesenlicht-
  // Patches. Orientierungs-agnostisches 2x2-Schachbrett Luma<->Grundgras, das die
  // Patch-Silhouette 4-6px in den Grundton ueberblendet (statt scharfe Rechteck-
  // kante). 'I' = grass_lumahi_mix (hell<->Gras), 'J' = grass_lumalo_mix
  // (dunkel<->Gras). Legende-Namespace, getrennt von den Palette-Tonen. WIE
  // '.'-Gras: begehbar (solid:false) UND fringeSource/fringeSet 'grass' — sonst
  // 1-Tile-Fringe-Loecher an den Patch-Raendern. Der Generator (.tmp/gen_gfx4.mjs)
  // setzt sie deterministisch auf alle Blob-Randzellen.
  'I': { art: 'grass_lumahi_mix', solid: false, fringeSource: true, fringeSet: 'grass', bankSet: 'g' },
  'J': { art: 'grass_lumalo_mix', solid: false, fringeSource: true, fringeSet: 'grass', bankSet: 'g' },
  // §PRIO2 [GP4 R3] (Jury K1 "Patch-Kante Rampe"): ZWEITES Mix-Tile je Patchfarbe =
  // 75%-Dither ('i' = grass_lumahi_mix75, 'x' = grass_lumalo_mix75) fuer den INNEREN
  // Rand-Ring. Zusammen mit dem bestehenden 50%-_mix (I/J, aeusserer Ring) ergibt
  // sich die zweistufige Rampe Grund 0% -> aussen 50% -> innen 75% -> Kern 100%
  // (H/L). Legende-Namespace, getrennt von Palette-Tonen. WIE '.'-Gras: begehbar
  // (solid:false) UND fringeSource/fringeSet 'grass'. Der Ring wird deterministisch
  // per Distanz-Band gesetzt (.tmp/gen_grass_r3.mjs, laeuft NACH gen_gfx4).
  'i': { art: 'grass_lumahi_mix75', solid: false, fringeSource: true, fringeSet: 'grass', bankSet: 'g' },
  'x': { art: 'grass_lumalo_mix75', solid: false, fringeSource: true, fringeSet: 'grass', bankSet: 'g' },
  'p': { art: 'pebble_small', solid: false, fringeSource: true, fringeSet: 'grass', bankSet: 'g' },
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
  's': { art: 'skull', solid: false },
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
const GRAVEYARD_OVER_ROWS = [
  'MO......X............................V..',
  '......................................Y.',
  '.B....................................N.',
  '........................................',
  '.....................................AB.',
  '.....................................O..',
  '.....................................A..',
  'Z..............................Y......Q.',
  'M............................Y.M........',
  '..............................O......YB.',
  '.B...................................V..',
  '.B....................................Z.',
  '......................................N.',
  '......................................Y.',
  '.....................................X..',
  '........................................',
  '..................C...C..............AB.',
  'Y...................C.................N.',
  'V....................................Z..',
  '..Y.................C.C..............Q..',
  '.QYY........Y..........CY.........A.....',
  '.MX.........V............X.........N.BB.',
  '.....................................BB.',
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
  '#': { art: 'brick_wall', solid: true, fringeSource: true, fringeSet: 'moss', variants: ['brick_wall', 'brick_wall_v1', 'brick_wall_v2', 'brick_wall_v3', 'brick_moss_tl', 'brick_moss_tl', 'brick_moss_tl', 'brick_moss_br', 'brick_moss_br', 'brick_moss_br', 'brick_wall_v4'] },
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
  portals: [
    { ...tileRect(32, 2, 2, 1), target: 'CATACOMBS', spawn: tc(6, 4) },
  ],
  ambient: 0.45,
  // Grafikpass 3 §2.3/§4.2: Farbtemperatur des Dunkel-Overlays (blauviolette Nacht).
  ambientTint: '#0a0a18',
  playerLightRadius: 40,
  fog: true,
  torchChars: ['F'],
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
  ambient: 0.78,
  // Grafikpass 3 §2.3/§4.2: kaltes Blau (Katakomben-Steinkaelte).
  ambientTint: '#06080f',
  playerLightRadius: 52,
  fog: false,
  torchChars: ['W'],
};

export const MAPS = { GRAVEYARD, CATACOMBS, FLUESTERGRUFT, BOSS_KAMMER };

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
