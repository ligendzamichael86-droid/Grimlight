// Grimlight-Palette — düstere Diablo-Stimmung, SNES-Rampen.
// Slice 1.5: 4-5-Ton-Rampen pro Material (Messlatte Secret of Mana).
// Bestehende Zeichen behalten ihre Rolle, neue Zeichen ergänzen die Rampen.
//
// =============================================================================
// GRAFIKPASS 6 §3.1 — BELICHTUNGS-SOCKEL (Paletten-Offset). GUELTIGER STAND.
// =============================================================================
// ACHTUNG BEIM LESEN: alle Luminanz-/Saettigungszahlen in den aelteren
// Kommentarbloecken weiter unten (GP3/GP4/GP5-R2/GP5-R3) sind HISTORISCH und
// beschreiben den jeweiligen Pass-Stand. Verbindlich ist AUSSCHLIESSLICH die
// Tabelle hier oben plus die Inline-Kommentare an den zehn Schluesseln.
//
// Zehn Toene sind ADDITIV je Kanal angehoben (Quelle: .tmp/gp6_offset_tabelle.json,
// erzeugt von .tmp/gp6_p0b_offset.mjs, in SPEC_GRAFIKPASS_6.md §3.1 eingefroren).
// Rec.601-Gewichte summieren zu 1 -> bei kanalgleicher Addition ist DeltaL = c
// EXAKT; die Kanaldifferenzen und damit der Farbort bleiben unveraendert.
// KEIN neuer Schluessel (§0.11): 61 alnum + 3 Symbole bleiben exakt.
//
//   Ton | Rampe  | alt      | NEU      | Offset | L alt | L NEU  | S NEU
//   ----+--------+----------+----------+--------+-------+--------+------
//    e  | Gras   | #19241d  | #28332c  |  +15   |  31,9 |  46,9  | 0,216
//    E  | Gras   | #253522  | #344431  |  +15   |  46,0 |  61,1  | 0,279
//    a  | Gras   | #394d30  | #485c3f  |  +15   |  67,7 |  82,7  | 0,315
//    m  | Gras   | #506341  | #5f7250  |  +15   |  89,4 | 104,4  | 0,298
//    K  | Gras   | #586c38  | #677b47  |  +15   |  96,1 | 111,1  | 0,423
//    A  | Gras   | #66804a  | #758f59  |  +15   | 114,1 | 129,1  | 0,378
//    w  | Wasser | #162325  | #263335  |  +16   |  31,3 |  47,3  | 0,283
//    W  | Wasser | #203336  | #36494c  |  +22   |  45,7 |  67,7  | 0,289
//    9  | Wasser | #2a4347  | #465f63  |  +28   |  60,0 |  88,0  | 0,293
//    =  | Wasser | #345358  | #56757a  |  +34   |  74,3 | 108,3  | 0,295
//
// AUFLAGEN (alle nachgerechnet, P0b):
//  * Ordnungs-Auflage §3.1 erfuellt:
//      k 18,3 < w 47,3 ~ e 46,9 (|Delta| 0,43 < 1 = kleinste 8-Bit-Stufe)
//      < W 67,7 < 9 88,0 < '=' 108,3 < A 129,1 < D 156,8
//  * Wasser-Schritte exakt gleichmaessig: 20,32 / 20,32 / 20,32 L.
//  * 'w' behaelt den KUEHLEREN Farbort als 'e': w (38,51,53) hat B 53 > G 51,
//    e (40,51,44) hat G 51 > B 44. Der Teich liest weiter nicht als Wiese.
//  * Saettigung aller Wassertoene (0,283..0,295) < S('A') 0,378 — die
//    GP3-R3-Auflage "kein Wasserpixel gesaettigter als das hellste Gras" gilt
//    weiter, mit groesserem Abstand als vorher.
//  * Kein Kanal ueber 255 (Maximum 143).
//  * k / n / 0 / '*' / '+' und die Stein-Rampe t/T/L/D bleiben BEWUSST
//    unverschoben (Silhouetten-Entscheid §3.1; das L<16-Band der Messziele
//    ist darauf geeicht).
// =============================================================================
// SLICE 6 §0.5 / PHASE0 §4+§6 — UMWIDMUNG 'c' UND 'G'. GUELTIGER STAND.
// =============================================================================
// KEIN neuer Schluessel (§0.11 bleibt gewahrt: 61 alnum + 3 Symbole). Zwei
// Toene hatten im GESAMTEN Bestand NULL Texel (Zensus ueber 360 Grids aus
// SPRITES + TILE_ART + ICON_APP, .tmp/slice6_p0/zensus_nachweis.json) und
// bekommen fuer das Dorf Gramfeld eine neue Rolle. Reine WERT-Aenderung ohne
// Pixelwirkung im Bestand.
//
//   Ton | alt      | NEU      | L alt | L NEU  | S_hsv | C*ab | neue Rolle
//   ----+----------+----------+-------+--------+-------+------+--------------
//    c  | #1d2f3d  | #805f3a  |  43,2 | 100,65 | 0,547 | 27,7 | Holz-/Dach-
//       |          |          |       |        |       |      | Zwischenstufe
//    G  | #82854c  | #8f4c5d  | 125,6 |  97,97 | 0,469 | 30,3 | NPC-Stoff
//       |          |          |       |        |       |      | (Krapp)
//
// AUFLAGEN (alle nachgerechnet, P0-FARBE):
//  * HOLZ-RAMPE streng monoton in L, Farbton UND Waerme (R-B):
//      q 44,72 < j 64,38 < Q 83,75 < c 100,65 < J 117,77
//      Schritte 19,66 / 19,37 / 16,90 / 17,12 — 'c' halbiert die einzige
//      Luecke (Q->J war 34,02 L, das 1,74-fache der uebrigen Schritte).
//      Hue 24,8 < 26,8 < 28,1 < 31,7 < 35,3; R-B 29 < 47 < 64 < 70 < 85.
//      DEKLARIERT (F1): die S_hsv-Folge ist als EINZIGE nicht monoton
//      (0,500/0,553/0,577/0,547/0,574) — der 0,55-Deckel zwingt 'c' um 0,03
//      unter die reine RGB-Interpolation #825f37. Bewusst akzeptiert.
//  * FACKELKERN-AUFLAGE (F1, Metrik gewechselt): kein Dorf-Ton bunter als der
//    Fackelkern '1' (#ffe9b0) in CIELAB-Buntheit C*ab = 30,5. c 27,7 / G 30,3
//    liegen darunter. S_hsl waere wirkungslos (S('1') = 1), S_hsv unerfuellbar
//    (35 von 64 BESTANDStoenen verletzen sie) — beide Lesarten sind untauglich.
//  * Zusaetzlicher Deckel NUR fuer diese zwei NEUEN Werte: S_hsv <= 0,55.
//  * 'G' ist mit dE00 16,1 zum naechsten Bestandston ('X') isolierter als 90 %
//    aller Bestandstoene; Farbtonabstand zum Helden-Violett 74,8-77,9 Grad.
//    Damit liest NPC-Stoff nie als Heldenumhang.
//  * ROST-Rampe 4/5/6 ungestoert (alle 6 Paare >= 5,7 dE00 Referenzabstand).
// FOLGE (F4, Doku-Nachzug, KEINE Pixelwirkung — beide Toene hatten 0 Texel):
//  * Stahl-Rampe verliert ihre dunkelste Stufe:  c > C > i > I  ->  C > i > I
//  * Ghul-Rampe verliert ihre Mittelstufe:       d > G > H > 3  ->  d > H > 3
//    (der Ghul zeichnete schon immer nur mit d/H/3 — die Umwidmung macht den
//    IST-Zustand nur sichtbar.) Nachgezogen sind: die Rampen-Kommentare hier
//    unten und design/ART_DIRECTION.md:16 + :44.
// NICHT ANFASSEN (namentlich deklariert, SPEC §0.5): die zwei ABGELOESTEN
// Alt-Waechter .tmp/check_art_gfx3.mjs:57 (G = '#82854c') und
// .tmp/dev_art_slice2.mjs:124 (c = '#1d2f3d') stehen nicht auf der Gruen-Liste.
// Die mobile/-Spiegelkopie der Palette entsteht je APK-Build neu (F5).
// FOLGE-ANPASSUNGEN in art/sprites.js (§3.1a/b, GP6): water_mid_calm 'k' -> '+'
// (sonst verdoppelt sich der Zonensprung gegen das neue 'w'), Back-Kronen-Rim
// Variante C (E-Zeile -> '*', 'e'-Rim eine Zeile nach innen).
// NACHZUG NOETIG (fremde Dateien, gemeldet): .tmp/check_gfx6_art.mjs
// NEW_TONES = diese zehn Hex-Werte (§7.G) und .tmp/shot_gfx6.py GLANZ_RGB =
// (0x56,0x75,0x7a) statt des GP5-R3-Werts (0x34,0x53,0x58).
// =============================================================================
export const PALETTE = {
  // Umriss & Schatten
  k: '#14101a', // Umriss, Fast-Schwarz
  n: '#221c26', // Nacht-Schatten, tiefste Materialschatten
  // Stein Friedhof (leicht violett): n -> g -> s -> S -> F
  g: '#3a3542', // Stein dunkel
  s: '#575061', // Stein mittel
  S: '#7d7588', // Stein hell
  F: '#a39cb2', // Stein Spitzlicht (Kanten oben, NEU 1.5)
  // Laub-Tiefe (NEU Gfx2): tiefster Kronen-Schatten, grün-schwarz. Sitzt UNTER
  // 'e' und trägt die Unterseite/Kern-Pockets der Großkronen (Volumen).
  0: '#0f1a12', // Laub sehr dunkel (Kronen-Tiefenton, Gfx2)
  // Gras (entsättigt, Friedhof): e -> E -> a -> K -> m -> A
  // GP6 §3.1: alle sechs Gras-Toene +15 je Kanal (DeltaL = +15,0 exakt).
  e: '#28332c', // Gras sehr dunkel (Basiston), L 46,9. GP6 +15 (vorher #19241d,
  //             L 31,9). GP3-R2 JURY-3 hatte ihn um 9% angehoben, damit die
  //             Gras-Ecken unterm Lichtsystem nicht auf Fast-Schwarz clippen.
  E: '#344431', // Gras dunkel, L 61,1. GP6 +15 (vorher #253522, L 46,0)
  a: '#485c3f', // Gras mittel, L 82,7. GP6 +15 (vorher #394d30, L 67,7)
  m: '#5f7250', // Moos / Grasbüschel hell, L 104,4. GP6 +15 (vorher #506341)
  K: '#677b47', // Warmes Mittelgrün, L 111,1, sitzt a<K<A. GP6 +15 (vorher #586c38)
  A: '#758f59', // Gras/Moos Spitzlicht, L 129,1 — Traeger der AUSSEN-Highlights
  //             (§3.4: rendert bei ambient 0,22 auf L 103 > 96). GP6 +15
  //             (vorher #66804a, L 114,1)
  // Erde (Wege, Fackelpfosten): z -> p -> v -> M -> P -> V
  z: '#332a23', // Erde dunkelst, Furchen (NEU 1.5)
  p: '#453a34', // Erde dunkel
  v: '#584a3b', // Erde mittel (NEU 1.5, Zwischenton p->P) — Weg-Furchen (+1 Stufe)
  M: '#6a5942', // Sandbraun/Tan (NEU Gfx2-R2 §8a.2): Weg-Mittelton, warm, v<M<P
  P: '#77644b', // Erde hell (Gfx2-R2 §8a.2: +11% aufgehellt, Farbton gehalten)
  V: '#9a8264', // Erde/Steinchen Spitzlicht (Gfx2-R2 §8a.2: +11% aufgehellt)
  // Knochen: O -> B -> b -> N
  O: '#6e6655', // Knochen dunkel (NEU 1.5, Höhlen, Beckenschatten)
  B: '#948b76', // Knochen Schatten
  b: '#d6cbb1', // Knochen-Weiß hell
  N: '#f1e9d3', // Knochen Spitzlicht (NEU 1.5, Schädelkrone)
  // Blut
  r: '#6e1a20', // Blut-Rot dunkel
  R: '#ae2f2a', // Blut-Rot hell
  // Feuer & Gold: r -> Y -> o -> y -> 1
  o: '#d8722a', // Fackel-Orange
  y: '#f0bf4e', // Fackel-Gelb / Gold hell
  Y: '#97662a', // Gold dunkel, Schwertgriff, Truhen-Beschlag
  1: '#ffe9b0', // Flammen-Kern, heißester Ton (NEU 1.5)
  // Kaltes Blau / Stahl: C -> i -> I
  // (F4: die Rampe hat seit der Slice-6-Umwidmung DREI Stufen — 'c' ist raus
  // und traegt jetzt warmes Holz. Pixelwirkung keine: 'c' hatte 0 Texel.)
  C: '#3c5a70', // Kaltblau mittel, Klingen-Schatten
  i: '#92aec0', // Stahl hell (Klinge)
  I: '#d9e6ee', // Stahl Glanzblitz (NEU 1.5, Klingenkante)
  // Held — Stoff/Kapuze: k -> u -> U -> X -> Z
  u: '#2c2434', // Kapuze/Umhang dunkel-violett
  U: '#4a3d57', // Umhang mittel
  X: '#6b5a7e', // Umhang hell (NEU 1.5, beleuchtete Falten)
  Z: '#9b8ab0', // Kapuzen-Rimlight/Saum (NEU 1.5, Lesbarkeit auf Dunkel)
  // Held — Haut: 2 -> h
  h: '#c29267', // Haut
  2: '#8f6647', // Haut-Schatten (NEU 1.5, Kapuzenschatten im Gesicht)
  // Wasser: w -> W -> 9 -> C (+ i als Glanzkante)
  // ACHTUNG: die folgenden GP3-/GP5-Bloecke sind HISTORISCH. Gueltige Werte
  // und Auflagen stehen im GP6-§3.1-Block am Dateikopf.
  // GP3-R3 (JURY Wasser, Prioritaet 1): Grundton 8-10% Richtung Gruen-Teal
  // gezogen (weg vom kalten Blaugrau-Fremdkoerper in der warmgruenen Palette,
  // M-K3c), Spitzen-Helligkeit/Saettigung um ~9% gesenkt (H-K5) -> Wasser ist
  // NICHT mehr der hellste Ton im Frame. Alle drei nur wasser-/ufer-genutzt.
  // GP5-R2 (JURY R1, ART-Auftrag 1 "Wasser-Palette"): die gesamte Wasser-Rampe
  // um 25 % ENTSAETTIGT und um 10 % ABGEDUNKELT (HSV, Farbton exakt gehalten).
  // Regel der Juroren: KEIN Wasserpixel darf gesaettigter sein als das hellste
  // Gras 'A' (#66804a, S=0,422). Nachgemessen (S = (max-min)/max):
  //   w 0,364 | W 0,400 | 9 0,395 | '=' 0,364   -> alle unter 0,422. Erfuellt.
  // Die Rampen-Ordnung nach Luminanz bleibt luecklos erhalten:
  //   k 18,3 < w 19,4 < W 42,8 < 9 64,7 < '=' 97,2 < A 114,1 < D 156,8.
  //   ALT (GP3-R3/GP4): w #0c1815, W #1a3438, 9 #284e54, '=' #3f7a70.
  // GP5-R3 (JURY R2, ART-Auftrag 2c "Wasser ist die dunkelste Grossflaeche"):
  // die GESAMTE Wasser-Rampe neu gesetzt. Juror-Auftrag woertlich: Wellental
  // (13,18,21) -> ~(20,30,34), Wellenkamm (61,95,91) -> ~(48,74,72), Ziel
  // Kamm:Tal ~ 2,3:1. Herleitung, welche PALETTENTOENE das im Render stellen
  // (die Juror-Zahlen sind Render-Messungen, keine Palettenwerte):
  //   * gemessenes TAL (13,18,21) = 'w' (Grundflaeche, ~70 % der Teichkachel)
  //     unter dem Ambient-Overlay; gemessener KAMM (61,95,91) = '=' (Kammglanz)
  //     in einer hellen Zelle. Der Render-Faktor beider Messungen liegt bei
  //     ~0,865 (Luminanz), damit: Tal-Ziel Palette-Luminanz ~31,4, Kamm-Ziel
  //     ~74,3.  ALT: w 19,4 | '=' 97,2  ->  Verhaeltnis 5,01:1 (viel zu hart).
  //   * NEU: w 31,4 | '=' 74,3 -> Kamm:Tal = 2,37:1 (Ziel ~2,3). Die beiden
  //     Zwischenstufen W/9 sind auf gleichmaessige Schritte nachgezogen:
  //     k 18,3 < w 31,4 < W 45,7 < 9 60,0 < '=' 74,3 < A 114,1 < D 156,8
  //     (Schritte 13,4 / 14,3 / 14,3 / 14,3 — lueckenlos, Ordnung erhalten).
  //   * HUE: die Rampe ist um einen Hauch KUEHLER gesetzt (Blau minimal ueber
  //     Gruen) — nicht aus Laune, sondern weil 'w' durch die Anhebung sonst
  //     fast deckungsgleich mit dem Gras-Grundton 'e' (#19241d, Luminanz 31,9)
  //     waere und der Teich als Wiese laese. Jetzt: w (22,35,37) gegen
  //     e (25,36,29) — gleiche Helligkeit, klar kuehlerer Farbort.
  //   * Auflage "kein Wasserpixel gesaettigter als das hellste Gras 'A'
  //     (S = 0,4216)" NACHGEMESSEN: w 0,405 | W 0,407 | 9 0,408 | '=' 0,409.
  //     Alle unter der Schranke. Erfuellt.
  //   * FOLGE-MELDUNG (Art darf die fremden Dateien nicht anfassen):
  //     .tmp/shot_gfx5.py:985 GLANZ_RGB = (0x3f,0x7a,0x70) ist ein GP3-Wert und
  //     zaehlt '='-Texel mit Toleranz 20 je Kanal — mit dem neuen '=' faellt
  //     das Glanz-Gate. Der Proof-Agent muss GLANZ_RGB auf #345358 ziehen.
  // GP6 §3.1: Wasser-Rampe je Ton mit EIGENEM ganzzahligen Kanal-Offset
  // (+16/+22/+28/+34) auf gleichmaessige 20,32-L-Schritte gezogen. Farbort je
  // Ton exakt erhalten (Kanaldifferenzen unveraendert).
  w: '#263335', // Wasser sehr dunkel = WELLENTAL/Grundflaeche, L 47,3.
  //             GP6 +16 (vorher #162325, L 31,3). Bleibt kuehler als 'e'.
  W: '#36494c', // Wasser mittel = Talflanke unter dem Kamm, L 67,7.
  //             GP6 +22 (vorher #203336, L 45,7)
  9: '#465f63', // Wasser-Zwischenblau = Wellenkamm, L 88,0. GP6 +28 (vorher
  //             #2a4347, L 60,0); Kraeusel UND Tiefen-Overlays
  // Katakomben-Stein (kalte Grau-Rampe): k -> t -> T -> L -> D
  // Gfx2-R3 §8b.3: t/T/L/D um ~10% aufgehellt (Farbton gehalten, Mobile-Lesbarkeit).
  t: '#2a2e36', // Katakomben-Stein dunkel (Bodenbasis). GP3-R2 §8c.4: +10%
  //             angehoben (Farbton gehalten) — Boss-Arena-Boden unter ambient
  //             0.66 säuft nicht mehr ins Fast-Schwarz. Sanktioniert (10%-Rahmen).
  T: '#4a4a45', // Katakomben-Stein mittel. GP3-R3 (M-K5b/Palette-5): blauen Kalt-
  //             Cast entzogen, Hauch waermer -> gemeinsamer warmer Mittelton mit
  //             dem Friedhof-Erdweg (M/P) = Paletten-Verwandtschaft, kein neues
  //             Tile. Luminanz gehalten (Boss-Arena-Lesbarkeit unter ambient 0.66).
  L: '#687180', // Katakomben-Stein hell (Kanten, Licht)
  D: '#949eae', // Katakomben-Stein Spitzlicht (NEU 1.5, Ziegel-Oberkanten)
  // Ghul-Fleisch (GFX3 §3.4: krankhaftes Gelbgrün statt Hecken-Grün; +Rot,
  // -Blau, Helligkeit je <=5% gehalten -> aufgedunsen, fiebrig): d -> H -> 3
  // (F4: DREI Stufen. Die alte Mittelstufe 'G' ist seit Slice 6 NPC-Stoff —
  // der Ghul hat sie ohnehin nie gezeichnet, er nutzt nur d/H/3. Der
  // dokumentierte Sprung d -> H ist damit der IST-Zustand seit GFX3.)
  d: '#585a2c', // Ghul-Fleisch dunkel (sanktionierte Hue-Verschiebung)
  G: '#8f4c5d', // NPC-STOFF, gedaempftes Krapp-Altrosa (SLICE 6, umgewidmet
  //             aus "Ghul-Fleisch mittel" #82854c, 0 Texel). Leitfarbe der
  //             Dorfkleidung: gefaerbte Wolle liest mittelalterlich, und der
  //             Sektor 330-350 Grad ist der einzige semantisch freie Platz der
  //             Palette (Teal = Seelenglut, Indigo = Held, Warm = noch ein
  //             Braun). L 97,97 | S_hsv 0,469 | C*ab 30,3 | dE00 16,1 zum
  //             naechsten Bestandston 'X' (Helden-Umhang hell).
  H: '#b0b478', // Ghul-Fleisch hell (fahle, kränkliche Haut)
  3: '#cbd090', // Ghul-Fleisch Spitzlicht (Schädel/Schultern)
  // Holz/Leder (Truhe, Vase, Stiefel, DORF): n -> q -> j -> Q -> c -> J
  q: '#3a291d', // Holz dunkel
  j: '#553b26', // Holz mittel (NEU 1.5, Zwischenton q->Q)
  Q: '#6f4d2f', // Holz hell
  c: '#805f3a', // Holz-/Dach-Zwischenstufe (SLICE 6, umgewidmet aus "Kaltblau
  //             dunkel" #1d2f3d, 0 Texel). Sitzt Q < c < J und halbiert die
  //             einzige Luecke der Holzrampe: Schindeln, Balken, Bretterwand,
  //             Torbogen und Palisade lesen damit als RUNDES Holz statt als
  //             Zwei-Ton-Brett. L 100,65 | S_hsv 0,547 | C*ab 27,7.
  J: '#94713f', // Holz/Leder Spitzlicht, Maserung (NEU 1.5)
  // Trank (Slice 1)
  x: '#e0524c', // Trank-Rot hell (leuchtender Heiltrank)
  // Nebel (Slice 1)
  f: '#8a92a0', // Nebel-Grau (einziger Fog-Ton)
  // Rost (NEU Slice 2, Rostpanzer/Schild/Bumerang-Truhe): 4 -> 5 -> 6
  4: '#5e2c1c', // Rost dunkel, Plattenschatten
  5: '#8f4a24', // Rost mittel, Plattenflaeche
  6: '#c06a33', // Rost hell, Kanten und Nieten (Licht oben links)
  // Seelenglut (NEU Slice 3, Grabwaechter-Signatur): 7 -> 8
  // Spektral-Gruen, klar abgesetzt von Elite-Rot und Fackel-Orange.
  7: '#2f7d5c', // Seelenglut dunkel (Augenhoehlen-Tiefe, Klingenrunen-Grund)
  8: '#7ff0b8', // Seelenglut hell (gluehende Augen, heisse Runen, Telegraph)
  // GRAFIKPASS 4 (§3.6): genau 3 NEUE Symbol-Toene (Alnum voll, 'l' verboten).
  // Symbol-Keys sind ein eigener Namespace ggue. Map-Legenden ('=' ist zugleich
  // GRAVEYARD-Weg-Legendenzeichen — hier reine PALETTE-Rolle, kein Konflikt).
  '=': '#56757a', // Teich-Glanz = WELLENKAMM-Spitze. GP6 §3.1 +34 je Kanal:
  //               Luma 108,3 (vorher #345358 / 74,3; GP5-R2 #466e67 / 97,2;
  //               GP3 #3f7a70), S 0,295. Bleibt unter 'A' (129,1) und weit
  //               unter 'D' (156,8) — Wasser ist NICHT der hellste Ton im Bild
  //               (GP3-R3-Auflage). Der Hex-Wert ist in NEW_TONES eines
  //               Art-Waechters eingefroren: .tmp/check_gfx6_art.mjs (§7.G,
  //               Integrator) und .tmp/shot_gfx6.py GLANZ_RGB (Proof) muessen
  //               auf #56757a stehen.
  '+': '#1a2a1b', // Kronen-Back dunkel 1 (zweite Kronenreihe, ~-20% Value ggue e).
  '*': '#141f15', // Kronen-Back dunkel 2 (tiefster Back-Kronen-Ton, unter '+').
  // GP4-R2 (Jury K2/M): kuehler Back-Kronen-Rim an der Oberkante. Der frozen
  // .tmp/check_gfx4_art.mjs erzwingt genau 3 Symbol-Toene (=+*); ein neuer '#'
  // (~#3a4a4d) haette ihn rot gefaerbt. Daher Bestandston 'C' (#3c5a70, kaltblau)
  // als Rim verwendet — eine Stufe blauer als das Ideal, aber ohne Testbruch.
  //
  // GRAFIKPASS 5 (§1.1/§1.6/§3.B4/§3.B6) — NUR Kommentar, KEIN neuer Ton.
  // HISTORISCH: die Luminanzzahlen in diesem Block sind GP5-Staende. Gueltig
  // ist der GP6-§3.1-Block am Dateikopf (e 46,9 | E 61,1 | a 82,7 | m 104,4 |
  // K 111,1 | A 129,1 | w 47,3 | W 67,7 | 9 88,0 | '=' 108,3).
  // Die Palette bleibt bei 61 Alnum + 3 Symbolen ('='/'+'/'*'). Festgehalten
  // sind hier die Ton-Entscheide des Passes, weil sie sonst nur im Grid stehen:
  //  1. Der GP4-R2-Notbehelf 'C' als Back-Kronen-Rim ist ZURUECKGENOMMEN. Der
  //     kaltblaue Streifen las bei 4-6x als Stahlband quer durch den Wald
  //     (Jury-Prio-0). Rim ist jetzt 'E' (#253522, Gras dunkel) — 'a' waere zu
  //     hell und haette den Defekt in Gruen neu erzeugt (Review-Entscheid).
  //     Damit taucht 'C' im ganzen art/-Bestand nur noch dort auf, wo Stahl
  //     gemeint ist (Klingen).
  //  2. TON-WAISEN beseitigt: 'n' (Nacht-Schatten) ist auf den shore_*-Kacheln
  //     kein Wasserton mehr — er bleibt nur als LAND-seitiges Kontaktband und
  //     als wasserseitiges Tiefenband der Konkav-Kacheln. Freistehende Tupfer
  //     im offenen Wasser sind 'w'. Ebenso ersetzt: kalter 'i'-Schaum auf den
  //     Konkav-Ufern -> 'W' (zweithellste Wasserstufe, wie GP4-R2 auf den
  //     geraden Ufer-Tiles); Trank-Glanz 'i' -> warme Rampe 1 > y > o;
  //     heart_full ohne Knochen-'N' (reine x > R > r-Rampe).
  //  3. WASSER-RAMPE, gemessene Luminanz (0.299R+0.587G+0.114B); GP5-R2-Werte
  //     in Klammern nach der Entsaettigung:
  //     k #14101a ~18  <  w (#0e1614) ~19  <  W (#1e3032) ~43
  //     <  9 (#2e484c) ~65  <  '=' (#466e67) ~97.
  //     Deshalb ist §3.B6 "eine Stufe" wortwoertlich umsetzbar:
  //     water_shallow  9 -> '='   (eine Stufe HELLER)
  //     water_mid      9 -> 'W'   (eine Stufe DUNKLER)
  //     water_mid_calm w -> 'k'   (eine Stufe DUNKLER; 'k' ist der einzige Ton
  //                                UNTER 'w', dithered ~50 % gesetzt, damit die
  //                                Tiefzone nicht flach schwarz kippt).
  //     Der Deckungsgrad der drei Schleier ist dabei UNVERAENDERT geblieben —
  //     die zeitliche Varianz im Teich-Fenster (Gate §7) haengt allein daran.
  //     '=' bleibt mit ~103 unter dem Gras-Spitzlicht 'A' (#66804a ~114) und
  //     weit unter dem Stein-Spitzlicht 'D' (#949eae ~157): Wasser wird durch
  //     die Anhebung NICHT wieder der hellste Ton im Frame (GP3-R3-Auflage).
  //  4. WARME TEXEL AUF WASSER gibt es ausschliesslich in water_reflect_0/_1
  //     (Y/o/y). Das ist die Ton-Seite der Konsistenz-Regel §3.B4/§7: was warm
  //     auf Wasser leuchtet, ist Kanal-Reflexion, nichts sonst.
  //
  // GRAFIKPASS 5 RUNDE 2 (Jury-Auflage ART-1) — Ton-Rollen im NEUEN Wasser:
  //     'w' Grundflaeche (Ruhewasser)  |  '9' Wellenkamm  |  '=' Kammglanz
  //     'W' Wellental direkt unter dem Kamm  |  'k' Tiefenlinie der Tiefzone
  //         (water_mid / water_mid_calm — der einzige Ton UNTER 'w').
  //     Die Rampe wird damit als ZEILEN-Sprache gelesen, nicht mehr als
  //     Per-Pixel-Rauschen. Kein neuer Ton, keine neue Palettenbreite.
  //
  // =========================================================================
  // GP7-CH-1 §E3 — DIE 14 NEUEN SYMBOL-TOENE (Menschen). GUELTIGER STAND.
  // =========================================================================
  // Quelle WOERTLICH: .tmp/gp7ch_p0/toene.json (Rechner .tmp/gp7ch_p0/
  // 04_rechner.mjs, Phase 0 P0.b), Tabelle eingefroren in
  // design/GP7CH1_PHASE0.md ("Die 14 neuen Toene"). Kein Hex-Wert ist beim
  // Eintragen nachjustiert worden.
  //
  // WARUM SYMBOLE: die 61 alnum-Schluessel sind voll ('l' ist verboten) und
  // die Slice-6-Methode (Null-Texel-Toene umwidmen) ist abgeerntet — ohne
  // neuen Namensraum ist eine echte Stofframpe je Mensch nicht baubar
  // (Landkarte Teil C §5, Vorentscheid). Die 14 Zeichen stammen aus dem
  // bewiesen kollisionsfreien Satz  ! % & ( ) : ; ? @ [ ] ^ _ |  (m3: frei
  // von PALETTE, von ALLEN Karten-Legenden und von ALLEN Grids). Symbol-Keys
  // sind ein eigener Namensraum gegenueber den Map-Legenden (wie '=' seit GP4).
  //
  // AUFLAGEN (E3/M11, nachgerechnet in .tmp/gp7ch_p0/nachweis.txt, 0 ROT):
  //  * dE00 >= 10 zu ALLEN 64 Bestandstoenen — Minimum 10,30 ('!' gegen '4')
  //  * dE00 >= 8 INNERHALB einer neuen Rampe — Minimum 8,07
  //  * dE00 >= 12 ZWISCHEN zwei neuen Rampen — Minimum 12,07
  //  * dE00 >= 12 zu u/U/X/Z (V6 "der Held bleibt das einzige Violett") —
  //    Minimum 12,03 ('%' gegen 'Z'). '^' IST die Held-Rampe (Einschub) und
  //    haelt dieselbe Auflage mit 13,26 zu X und Z.
  //  * C*ab < 30,5 (Fackelkern-Deckel '1', palette.js:71-73) — Maximum 29,85
  //    ('^'); zum Vergleich Bestand: G 30,32 / '1' 30,48.
  //  * KEINE Paletten-L-Regel gegen das M1-Band (M13 = Kategorienfehler: M1
  //    ist ein Bild-Median, keine Palettengroesse). Nachweis ist die
  //    REALMESSUNG nach dem Figuren-Umbau (M1 56..69, E1 >= 0,64 %,
  //    L<16 <= 2,0 %). Der dunkelste neue Ton liegt bei L601 64,1, also weit
  //    ueber dem L<16-Deckel; 13 der 14 Toene liegen ueber L601 96 und
  //    stuetzen die E1-Highlight-Untergrenze.
  //
  // SANKTIONIERTE FOLGE (E8, KEIN Fehler): .tmp/check_gfx6_art.mjs:74-79
  // deckelt den Zeichensatz auf "61 alnum + 3 Symbole" und wird durch diesen
  // Block ROT ("Symbol-Toene falsch"); ebenso .tmp/check_gp6_art_self.mjs:26
  // (erwartete Rot-Zahl 5 -> 6). Beide Stellen stehen namentlich im
  // Sanktions-Katalog. smoke_test.mjs:81-93, sprite_factory.js:17-19 und
  // art_slice3_selfcheck pruefen nur die MITGLIEDSCHAFT in PALETTE und
  // bleiben gruen. Die mobile/-Spiegelkopie entsteht je APK-Build neu.
  //
  //   Ton | Rampe | Hex      | L601  | C*ab | Hue   | Rolle
  //   ----+-------+----------+-------+------+-------+------------------------
  //    !  | G     | #5b3438  |  64,1 | 18,8 |  15,5 | Hedda Wolle Schatten
  //    %  | G     | #a07887  | 133,7 | 18,2 | 353,5 | Hedda Wolle Licht
  //    &  | CORM  | #188185  |  98,1 | 28,1 | 201,5 | Corm Wolle dunkel
  //    (  | CORM  | #4b918a  | 123,3 | 24,0 | 187,4 | Corm Wolle mittel
  //    )  | CORM  | #71a394  | 146,3 | 20,2 | 173,0 | Corm Wolle hell
  //    :  | BRAN  | #795a57  |  98,9 | 14,0 |  28,6 | Bran Leder dunkel
  //    ;  | BRAN  | #a77769  | 131,8 | 22,7 |  41,9 | Bran Leder mittel
  //    ?  | BRAN  | #b0988c  | 157,8 | 11,8 |  54,1 | Bran Leder hell
  //    @  | MILE  | #327596  | 100,7 | 26,3 | 246,8 | Mile Kittel dunkel
  //    [  | MILE  | #4691b0  | 126,1 | 27,1 | 239,2 | Mile Kittel mittel
  //    ]  | MILE  | #62adba  | 152,1 | 24,2 | 215,1 | Mile Kittel hell
  //    ^  | HELD  | #6c75a8  | 120,1 | 29,9 | 288,3 | Held Zwischenstufe X->Z
  //    _  | RIM   | #e0c3c3  | 203,7 | 10,9 |  20,2 | Rim warm
  //    |  | RIM   | #abdcda  | 205,1 | 16,7 | 194,6 | Rim kalt
  //
  // HEDDA — Krapp-Wolle: die Bestands-Rampe G bekommt ihre zwei fehlenden
  // Stufen, damit aus dem Ein-Ton-Kleid (83 Texel, 1 Stufe) eine Rampe wird:
  //   ! (64,1) -> G (98,0) -> % (133,7); Schritte 33,9 / 35,7 = 1,05,
  //   Hue-Spanne 22,1 Grad (T4-Ziel >= 20), Saettigungsmaximum in der Mitte.
  // Der Schatten dreht WARM Richtung Braunrot (Hue 15,5), NICHT kuehl: der
  // kuehle Sektor gehoert dem Helden (E3/M12 — die kuehle Suche liess nur
  // 4,7 % Kandidaten uebrig, alle hart an der 'U'-Schranke).
  '!': '#5b3438', // Krapp-Wolle SCHATTEN, Rampe G Stufe 1/3 (Hedda). L 64,1 | C*ab 18,8
  '%': '#a07887', // Krapp-Wolle LICHT,    Rampe G Stufe 3/3 (Hedda). L 133,7 | C*ab 18,2
  // CORM — eigene PETROL-Familie, komplette 3er-Rampe: & -> ( -> ).
  // Sie ist ausdruecklich NICHT die Steinrampe seiner eigenen Kapellenwand
  // (g/s/S) und nicht Erde (E6-Sperrliste); L601 liegt im P0.d-Fenster
  // 116,71..159,37. Schritte 25,2 / 23,1 = 1,09, Hue-Spanne 28,5 Grad.
  '&': '#188185', // Wolle DUNKEL,  Rampe CORM Stufe 1/3. L 98,1 | C*ab 28,1
  '(': '#4b918a', // Wolle MITTEL,  Rampe CORM Stufe 2/3 (Leitton). L 123,3 | C*ab 24,0
  ')': '#71a394', // Wolle HELL,    Rampe CORM Stufe 3/3. L 146,3 | C*ab 20,2
  // BRAN — versengtes Leder, eigene warme Familie: : -> ; -> ?.
  // Er verlaesst damit die Holzrampe seiner eigenen Schmiede (q/j/Q/c/J) und
  // greift NICHT nach Rost 4/5/6 — Rost bleibt EXKLUSIV beim Torwaechter (M9,
  // sonst stehen zwei rostbraune Maenner nebeneinander). Schritte 32,8 / 26,1
  // = 1,26, Hue-Spanne 25,5 Grad, Saettigungsmaximum in der Mittelstufe.
  ':': '#795a57', // Leder DUNKEL,  Rampe BRAN Stufe 1/3. L 98,9 | C*ab 14,0
  ';': '#a77769', // Leder MITTEL,  Rampe BRAN Stufe 2/3 (Leitton). L 131,8 | C*ab 22,7
  '?': '#b0988c', // Leder HELL,    Rampe BRAN Stufe 3/3. L 157,8 | C*ab 11,8
  // MILE — Kittel, eigene STAHLBLAU-Familie: @ -> [ -> ].
  // Bewusst weder Krapp (das ist Heddas Alleinstellung) noch Gruen (Gras-
  // Sperrliste) noch Leinen/Knochen O/B/b (die Naehe zu den Skeletten war der
  // Befund). Schritte 25,4 / 26,0 = 1,02, Hue-Spanne 31,7 Grad.
  '@': '#327596', // Kittel DUNKEL, Rampe MILE Stufe 1/3. L 100,7 | C*ab 26,3
  '[': '#4691b0', // Kittel MITTEL, Rampe MILE Stufe 2/3 (Leitton). L 126,1 | C*ab 27,1
  ']': '#62adba', // Kittel HELL,   Rampe MILE Stufe 3/3. L 152,1 | C*ab 24,2
  // HELD — EINSCHUB in die Bestands-Stofframpe u -> U -> X -> ^ -> Z.
  // Die 48,2-L-Schlucht X->Z war das Schrittverhaeltnis 1,745 (T5-Ziel <= 1,6);
  // mit '^' lauten die Schritte 27,6 / 31,3 / 20,9 / 27,3 = 1,497. Das
  // analytisch zulaessige Einschubfenster war L601 118,78..123,31.
  '^': '#6c75a8', // Umhang ZWISCHENSTUFE, Rampe HELD Stufe 4/5. L 120,1 | C*ab 29,9
  // RIM — zwei helle Kantentoene, warm UND kalt einsetzbar (T6: jede Figur
  // braucht >= 12 % der Kontur als Rim, heute haben zwei von elf ueberhaupt
  // einen). DEKLARIERTE AUSNAHME von Stilregel 10 ("neue Farben nur als
  // komplette Rampe"): ein Rim ist keine Materialrampe, sondern eine Kante —
  // die Ausnahme steht in ART_DIRECTION.md (Sanktion E4/E8).
  '_': '#e0c3c3', // Rim WARM (Haut/Leder/Holzseite). L 203,7 | C*ab 10,9
  '|': '#abdcda', // Rim KALT (Stoff/Stahl/Steinseite). L 205,1 | C*ab 16,7
};
