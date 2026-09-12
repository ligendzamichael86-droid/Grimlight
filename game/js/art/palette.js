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
  // AUFLAGEN (E3/M11; Erstlauf .tmp/gp7ch_p0/nachweis.txt 0 ROT, nach der
  // CAST-JUROR-RUNDE 10.09. neu gerechnet in .tmp/gp7ch_palette2/ — 1 ROT,
  // benannt und begruendet im Cast-Juror-Block unten):
  //  * dE00 >= 10 zu ALLEN 64 Bestandstoenen — Minimum 9,04 (')' gegen '=')
  //    ist ROT; ohne ')' liegt das Minimum unveraendert bei 10,30 ('!'/'4'),
  //    die sechs anderen neu gerechneten Toene bei 10,37 bis 14,10.
  //  * dE00 >= 8 INNERHALB einer neuen Rampe — Minimum 8,02 ('&'/'(')
  //  * dE00 >= 12 ZWISCHEN zwei neuen Rampen — Minimum 13,34 ('!'/':')
  //  * dE00 >= 12 zu u/U/X/Z (V6 "der Held bleibt das einzige Violett") —
  //    Minimum 13,26 ('^' gegen 'Z'). '^' IST die Held-Rampe (Einschub) und
  //    haelt dieselbe Auflage.
  //  * C*ab < 30,5 (Fackelkern-Deckel '1', palette.js:71-73) — Maximum 30,36
  //    (';'); zum Vergleich Bestand: G 30,32 / '1' 30,48.
  //  * KEINE Paletten-L-Regel gegen das M1-Band (M13 = Kategorienfehler: M1
  //    ist ein Bild-Median, keine Palettengroesse). Nachweis ist die
  //    REALMESSUNG nach dem Figuren-Umbau (M1 56..69, E1 >= 0,64 %,
  //    L<16 <= 2,0 %). Der dunkelste neue Ton liegt seit der Cast-Juror-Runde
  //    bei L601 58,5 ('&'), also weiter weit ueber dem L<16-Deckel; 11 der 14
  //    Toene liegen ueber L601 96 und stuetzen die E1-Highlight-Untergrenze.
  //
  // SANKTIONIERTE FOLGE (E8, KEIN Fehler): .tmp/check_gfx6_art.mjs:74-79
  // deckelt den Zeichensatz auf "61 alnum + 3 Symbole" und wird durch diesen
  // Block ROT ("Symbol-Toene falsch"); ebenso .tmp/check_gp6_art_self.mjs:26
  // (erwartete Rot-Zahl 5 -> 6). Beide Stellen stehen namentlich im
  // Sanktions-Katalog. smoke_test.mjs:81-93, sprite_factory.js:17-19 und
  // art_slice3_selfcheck pruefen nur die MITGLIEDSCHAFT in PALETTE und
  // bleiben gruen. Die mobile/-Spiegelkopie entsteht je APK-Build neu.
  //
  // =========================================================================
  // CAST-JUROR-RUNDE 10.09. — SIEBEN TOENE NEU GERECHNET (& ( ) : ; ? %)
  // =========================================================================
  // Quelle: design/GP7CH1_JURY.md §5 (Rezepte "bindend"). Nachgerechnet in
  // .tmp/gp7ch_palette2/ mit demselben Rechenweg wie .tmp/gp7ch_p0/
  // 04_rechner.mjs + lib_farbe.mjs (CIEDE2000, voller 8-Bit-sRGB-Scan je
  // Slot). Die anderen sieben Symbol-Toene (! @ [ ] ^ _ |) sind UNVERAENDERT,
  // ebenso jedes Grid: die sieben Zeichen kommen ausschliesslich in
  // npc_corm_0/1/talk, npc_bran_0/1/talk und npc_hedda_0/1/talk vor (Zensus
  // ueber sprites_figuren.js: 864 Texel in 9 Grids; sprites_tiles.js: 0
  // Treffer). Bestandsgrafik kann durch diese Zeilen nicht kippen.
  //
  //   CORM  &  #188185 -> #005356  ΔL* -17,5  Hue 201,5 -> 201,6  C 28,1 -> 21,7
  //         (  #4b918a -> #1d6862  ΔL* -16,0  Hue 187,4 -> 187,7  C 24,0 -> 24,1
  //         )  #71a394 -> #4d7468  ΔL* -17,5  Hue 173,0 -> 172,2  C 20,2 -> 16,8
  //   BRAN  :  #795a57 -> #83564c  L* konst.  Hue  28,6 ->  37,8  C 14,0 -> 22,0
  //         ;  #a77769 -> #b0725f  L* konst.  Hue  41,9 ->  42,8  C 22,7 -> 30,4
  //         ?  #b0988c -> #b0998b  L* konst.  Hue  54,1 ->  59,3  C 11,8 -> 12,2
  //   HEDDA %  #a07887 -> #ae7189  L* konst.  Hue 353,5 -> 353,6  C 18,2 -> 27,8
  //
  // NACHWEIS CORM (die bindende Zahl des Juror-Rezepts): dE00 der Kutte-
  // Mittelfarbe (Toene & ( ) ueber alle drei Grids) gegen die Bodenkacheln —
  // path_v5 26,2 | path 26,4 | dorf_lehm_00 26,3 | schlechteste Lehmkachel
  // (dorf_lehm_08) 26,2. Alle vier ueber der E1-Ersatzschwelle 25; der Juror
  // hatte 26,6..27,3 gemessen. Rampe 3-stufig monoton, Schrittverhaeltnis
  // 1,013, Hue-Spanne 29,4 Grad.
  // NACHWEIS BRAN: Koerper-L 117,2 -> 116,9 (Toene gleich hell), dL zum Weg
  // 25,5 -> 25,2 auf der P0.d-Lesart bzw. 26,5 -> 25,7 auf der Rampen-Lesart,
  // E1 unberuehrt; der Abstand zu Heddas Krapp waechst auf ALLEN neun Paaren
  // (kleinster 11,1 -> 11,3; die beiden Leittoene ';'/'%' 12,3 -> 16,7).
  // NACHWEIS HEDDA: Koerper-L 116,5 -> 116,6, Rampe !/G/% monoton, C*ab 27,8
  // unter dem Deckel 30,5.
  //
  // DREI KOLLISIONEN — GEMELDET STATT ERZWUNGEN:
  //  1. ')' haelt "dE00 >= 10 zu allen 64 Bestandstoenen" NICHT: 9,04 gegen
  //     '=' (Wasser-Kammglanz) und 9,07 gegen '7'. Im gesamten Juror-Korridor
  //     ΔL* -15..-18 gibt es bei fester Hue-Lage 173 Grad KEINEN Wert >= 10
  //     (Maximum 9,04, voller 8-Bit-Scan; auch mit +-14 Grad Hue-Spiel und
  //     +-6 Chroma bleibt das Maximum 9,76). E3 haelt erst wieder bei ΔL*
  //     >= -11 (zu flach fuer das Rezept) oder <= -24 (zu tief). Gewaehlt ist
  //     das Korridor-Maximum; dafuer musste Chroma von 20,2 auf 16,8 zurueck
  //     (bei unveraendertem Chroma waeren es nur 7,7).
  //  2. '&' kann "Chroma unveraendert" nicht halten: auf Hue 201,5 liegt das
  //     sRGB-Gamut-Maximum schon bei ΔL* -15 bei C*ab 23,0 (IST 28,1), bei
  //     ΔL* -18 bei 21,5. Gewaehlt 21,7; die Differenz zum Gamut-Maximum
  //     geht an die Intra-Rampen-Auflage >= 8 gegen '(' (erreicht 8,02).
  //  3. Brans Rezept "Hue 42 -> 60..70 Grad bei Chroma +8..+12" ist mit E3
  //     unvereinbar. Der warme Sektor auf L* 41 / 54 / 65 ist von 2 j Q c 5 6
  //     h Y V J besetzt; bei Mittelton-Hue 60..70 liegt das erreichbare
  //     Maximum bei 8,05 statt 10 — und zwar bei JEDEM Chroma, auch bei
  //     Chroma 0. Umgesetzt ist deshalb die Chroma-Haelfte des Rezepts mit
  //     der groessten E3-vertraeglichen Drehung. '?' ist zusaetzlich von 'h'
  //     (#c29267) eingeklemmt und nimmt nur +0,4 Chroma auf; auch +-6 L*
  //     Drift oeffnet dort nichts (Maximum 8,9).
  //
  // ABWEICHENDE LESART, DIE FABLE ENTSCHEIDEN MUSS: auf der P0.d-KOERPER-
  // Mittelfarbe (ganze Figur ohne Kontur und Rim) faellt Corm durch die
  // Absenkung auf dL 1,4 und dE00 22,3 gegen den Weg — dort sind nach dieser
  // Runde BEIDE E1-Pfade zu (vorher dL 26,9 / dE00 26,1). Der Juror hat auf
  // der KUTTEN-Mittelfarbe gerechnet (dort 26,2, siehe oben); die Auswahl
  // dieser Lesart ist keine Palettenfrage.
  //
  //   Ton | Rampe | Hex      | L601  | C*ab | Hue   | Rolle
  //   ----+-------+----------+-------+------+-------+------------------------
  //    !  | G     | #5b3438  |  64,1 | 18,8 |  15,5 | Hedda Wolle Schatten
  //    %  | G     | #ae7189  | 134,0 | 27,8 | 353,6 | Hedda Wolle Licht
  //    &  | CORM  | #005356  |  58,5 | 21,7 | 201,6 | Corm Wolle dunkel
  //    (  | CORM  | #1d6862  |  80,9 | 24,1 | 187,7 | Corm Wolle mittel
  //    )  | CORM  | #4d7468  | 103,0 | 16,8 | 172,2 | Corm Wolle hell
  //    :  | BRAN  | #83564c  |  98,3 | 22,0 |  37,8 | Bran Leder dunkel
  //    ;  | BRAN  | #b0725f  | 130,4 | 30,4 |  42,8 | Bran Leder mittel
  //    ?  | BRAN  | #b0998b  | 158,3 | 12,2 |  59,3 | Bran Leder hell
  //    @  | MILE  | #327596  | 100,7 | 26,3 | 246,8 | Mile Kittel dunkel
  //    [  | MILE  | #4691b0  | 126,1 | 27,1 | 239,2 | Mile Kittel mittel
  //    ]  | MILE  | #62adba  | 152,1 | 24,2 | 215,1 | Mile Kittel hell
  //    ^  | HELD  | #6c75a8  | 120,1 | 29,9 | 288,3 | Held Zwischenstufe X->Z
  //    _  | RIM   | #e0c3c3  | 203,7 | 10,9 |  20,2 | Rim warm
  //    |  | RIM   | #abdcda  | 205,1 | 16,7 | 194,6 | Rim kalt
  //
  // HEDDA — Krapp-Wolle: die Bestands-Rampe G bekommt ihre zwei fehlenden
  // Stufen, damit aus dem Ein-Ton-Kleid (83 Texel, 1 Stufe) eine Rampe wird:
  //   ! (64,1) -> G (98,0) -> % (134,0); Schritte 33,9 / 36,0 = 1,06,
  //   Hue-Spanne 22,0 Grad (T4-Ziel >= 20), Saettigungsmaximum in der Mitte.
  // Der Schatten dreht WARM Richtung Braunrot (Hue 15,5), NICHT kuehl: der
  // kuehle Sektor gehoert dem Helden (E3/M12 — die kuehle Suche liess nur
  // 4,7 % Kandidaten uebrig, alle hart an der 'U'-Schranke).
  '!': '#5b3438', // Krapp-Wolle SCHATTEN, Rampe G Stufe 1/3 (Hedda). L 64,1 | C*ab 18,8
  '%': '#ae7189', // Krapp-Wolle LICHT,    Rampe G Stufe 3/3 (Hedda). L 134,0 | C*ab 27,8
                  // Cast-Juror-Runde 10.09.: C*ab 18,2 -> 27,8 bei KONSTANTEM L* (54,7)
                  // und konstanter Hue (353,5 -> 353,6). Aus blassem Rosa wird staubiges
                  // Krapprot; Koerper-L der Figur bleibt 116,5 -> 116,6 (E1 unberuehrt).
  // CORM — eigene PETROL-Familie, komplette 3er-Rampe: & -> ( -> ).
  // Sie ist ausdruecklich NICHT die Steinrampe seiner eigenen Kapellenwand
  // (g/s/S) und nicht Erde (E6-Sperrliste). Cast-Juror-Runde 10.09.: die
  // ganze Rampe um ΔL* -16,0 bis -17,5 abgesenkt (Auftrag -15..-18), Hue
  // gehalten (Abweichung <= 0,75 Grad). Das P0.d-L601-Fenster 116,71..159,37
  // ist damit BEWUSST verlassen — der Juror hat den E1-Ersatzpfad ueber dE00
  // gerechnet und ihn fuer die Kutte offen gemessen (Nachweis im Cast-Juror-
  // Block oben). Schritte 22,4 / 22,1 = 1,01, Hue-Spanne 29,4 Grad.
  '&': '#005356', // Wolle DUNKEL,  Rampe CORM Stufe 1/3. L 58,5 | C*ab 21,7
                  // (ΔL* -17,5; Chroma 28,1 -> 21,7 ist GAMUT-erzwungen, siehe oben)
  '(': '#1d6862', // Wolle MITTEL,  Rampe CORM Stufe 2/3 (Leitton). L 80,9 | C*ab 24,1
                  // (ΔL* -16,0; Chroma unveraendert, Abweichung +0,07)
  ')': '#4d7468', // Wolle HELL,    Rampe CORM Stufe 3/3. L 103,0 | C*ab 16,8
                  // (ΔL* -17,5; EINZIGE E3-Verletzung der Palette: dE00 9,04 zu '=')
  // BRAN — versengtes Leder, eigene warme Familie: : -> ; -> ?.
  // Er verlaesst damit die Holzrampe seiner eigenen Schmiede (q/j/Q/c/J) und
  // greift NICHT nach Rost 4/5/6 — Rost bleibt EXKLUSIV beim Torwaechter (M9,
  // sonst stehen zwei rostbraune Maenner nebeneinander). Genau diese Sperre
  // ist der Grund, warum die Cast-Juror-Runde 10.09. hier nur die CHROMA-
  // Haelfte ihres Rezepts umsetzen konnte (Begruendung im Block oben):
  // L* je Stufe konstant (Abweichung <= 0,36), Chroma : +8,0 / ; +7,6 / ? +0,4,
  // Drehung : +9,2 / ; +1,0 / ? +5,2 Grad. Schritte 32,1 / 27,9 = 1,15,
  // Hue-Spanne 21,5 Grad, Saettigungsmaximum in der Mittelstufe.
  ':': '#83564c', // Leder DUNKEL,  Rampe BRAN Stufe 1/3. L 98,3 | C*ab 22,0
  ';': '#b0725f', // Leder MITTEL,  Rampe BRAN Stufe 2/3 (Leitton). L 130,4 | C*ab 30,4
                  // (der Fackelkern-Deckel C*ab < 30,5 bindet hier und deckelt
                  //  die Juror-Vorgabe "+8 bis +12" bei +7,6)
  '?': '#b0998b', // Leder HELL,    Rampe BRAN Stufe 3/3. L 158,3 | C*ab 12,2
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
  // =========================================================================
  // GP7-CH-2 PHASE 0 — ACHT NEUE GEGNER-TOENE (12.09.2026). GUELTIGER STAND.
  // =========================================================================
  // Quelle WOERTLICH: .tmp/gp7ch2_p0/toene_ch2.json (Rechner .tmp/gp7ch2_p0/
  // 17_final.mjs auf dem RGB-Vollscan 11_vollscan.mjs, Phase 0 P0.b), Tabelle
  // eingefroren in design/GP7CH2_PHASE0.md ("Die 8 neuen Toene") und gebunden
  // durch R-C1. Kein Hex-Wert ist beim Eintragen nachjustiert worden (byte-
  // genau aus der JSON uebernommen). VORAB-COMMIT nach R-A9: die Toene stehen
  // VOR Phase 1 in der Palette, damit beide Zeichner sofort alle Stufen haben
  // und palette.js aus dem Mutex faellt. Heute nutzt sie KEIN Grid (0 Texel) —
  // diese Runde hat keine Pixelwirkung.
  //
  // WARUM WEITER SYMBOLE: die 61 alnum-Schluessel sind voll ('l' ist verboten),
  // die Slice-6-Methode (Null-Texel-Toene umwidmen) ist abgeerntet, und die 14
  // CH-1-Symbole gehoeren dem Menschen-Cast. Die 8 Zeichen " $ / < > { } ` sind
  // nachgewiesen kollisionsfrei (R-C2, .tmp/gp7ch2_p0/kollision.json): 435
  // Grids / 214.912 Texel ohne Treffer, die 5 Kartenlegenden in 4 world-Dateien
  // fuehren nur # , - . = ~, alle Guards pruefen generisch die MITGLIEDSCHAFT
  // in PALETTE, und keine RegExp-Zeichenklasse laeuft ueber Palettenschluessel
  // (keines der 8 Zeichen ist dort Metazeichen). Schreibregel: im JS immer
  // EINFACH gequotet ('"' und '`'), in JSON-Deliverables wird nur " escapt.
  //
  //   Ton | Rampe   | Hex      | L601  | C*ab | Hue   | Rolle
  //   ----+---------+----------+-------+------+-------+-----------------------
  //    "  | SKELETT | #4b5686  |  88,2 | 29,6 | 287,8 | Knochen Schatten kalt
  //    $  | SKELETT | #8c7671  | 124,0 |  9,7 |  37,6 | Knochen Mitte
  //    /  | SKELETT | #ae9a66  | 154,1 | 30,0 |  90,2 | Knochen Licht warm
  //    <  | GHUL    | #737b71  | 119,5 |  6,7 | 138,5 | Lumpen mittel
  //    >  | GHUL    | #7f968c  | 142,0 | 10,5 | 166,0 | Lumpen hell
  //    {  | HUND    | #008190  |  92,1 | 29,1 | 214,6 | Fell dunkel
  //    }  | HUND    | #268685  | 105,2 | 28,0 | 195,5 | Fell mittel
  //    `  | HUND    | #3a9897  | 123,8 | 28,4 | 195,7 | Fell licht
  //
  // RAMPEN
  //  * SKELETT-KNOCHEN  " -> $ -> /  (drei neue Stufen): L601 88,2 -> 124,0 ->
  //    154,1, Schritte 35,8 / 30,0 = Verhaeltnis 1,19, Hue-Drehung 162 Grad
  //    (kalt-violetter Kantenschatten, neutrale Mitte, warmes Licht). dE00
  //    innerhalb der Rampe 25,47 ("/$) | 47,11 ("//) | 21,54 ($//).
  //  * GHUL-LUMPEN  < -> >  PLUS Bestand 'd' (#585a2c) als dunkelste Stufe:
  //    L601 84,2 -> 119,5 -> 142,0, Schritte 35,3 / 22,5 = Verhaeltnis 1,57,
  //    Hue-Spanne 58 Grad; dE00 18,10 (d/<) | 27,36 (d/>) | 10,46 (</>).
  //    'O' (Knochen dunkel) war der Alternativvorschlag und ist VERWORFEN:
  //    gegen den GRAVEYARD-Weg 'P' nur dE00 5,56.
  //  * HUND-PETROL  { -> } -> `  (drei neue Stufen): L601 92,1 -> 105,2 ->
  //    123,8, Schritte 13,0 / 18,6 = Verhaeltnis 1,43, hue 195,5..214,6,
  //    C*ab 28,0..29,1 (Selbstauflage <= 30,0 unter dem Fackelkern-Deckel
  //    '1' = 30,5). Kalt-gesaettigtes Petrol, ortsgetrennt zu Corms Wolle
  //    (DORF) deklariert; dE00 zu & ( ) 10,09, zu t/T/L/D 18,75.
  //  Zwischen den drei Rampen: Sk/Gh 17,11 ($/<) | Sk/Hu 25,51 ("/{) | Gh/Hu
  //  12,79 (>/`) — alle ueber der E3-Schranke 12.
  //
  // DEKLARATIONEN (R-B5/R-C1 — gemeldet statt erzwungen; Praezedenz CH-1 9,04)
  //  1. HUND innerhalb der Rampe dE00 6,49 statt >= 8 (Paare 6,67 / 10,43 /
  //     6,49). Erschoepfend bewiesen: im Fenster hue 195..215 / C*ab 24..30
  //     traegt KEINE der 960 Fenster-Zellen ein Tripel mit 8 (Band L601 80..95
  //     erlaubt global nur 10,36..11,71; >= 12 erst ab L601 98). Die Trennung
  //     laeuft ueber die L601-Schritte 13,0 / 18,6 — Zeichner-Auflage: die
  //     Hund-Stufen sind WERT-Stufen, nie zwei Nachbarstufen ohne Zwischenzeile.
  //  2. HUND Hue-Spanne 19,17 statt >= 20 Grad: das Rev-2-Fenster war exakt
  //     20 Grad breit (Spec-Fehler). Kein Rim nur um die Zahl zu retten.
  //  3. '"' gegen Held-'X' dE00 10,45 statt 12 (V6 "der Held bleibt das
  //     einzige Violett"): kalt UND dunkel ist im Bestand unerreichbar, die
  //     Trennung traegt Wert + Familie + Ort.
  //  4. '/' gegen Ghul-Bestand 'H' dE00 10,28 statt 12, bei dL 17,9 — das
  //     Skelett-Licht 154,1 ist DUNKLER als der Ghul-Akzent 'H' (172,0). Der
  //     Ghul fuehrt 'H' nur als Schaedel-Akzent, nie als Flaeche; die
  //     Figur-Mittel liegen in getrennten Baendern.
  //  5. SKELETT-SCHATTEN '"' liegt ERZWUNGEN bei hue 287,8 / L601 88,2 statt
  //     im gewuenschten kalten Sektor 250..270 bei ~105: dieser Sektor hat im
  //     gesamten Bereich L601 70..122 KEINE Zelle mit min-dE00 >= 9,5 (C, @,
  //     [, L, f, D, i belegen ihn; Maximum 9,349 im vollen sRGB-Scan, von V-P0
  //     unabhaengig nachgerechnet). >= 10 gibt es kalt nur bei L601 85..94 /
  //     hue 283..289. Zeichner-Auflage Skelett: >= 65 % Lichtstufe '/' im
  //     Innenraum (Rechnung 0,10/0,25/0,65 = 139,95 im bindenden Band
  //     139,6..146,7; bei 60 % nur 138,45 = unter der Untergrenze), '"' nur
  //     als Kanten-/Rippenschatten, nie flaechig.
  //  Minima zu den Sperrlisten (E-C4): Corm & ( ) 24,09 / 11,46 / 10,09 |
  //  Katakomben t T L D 13,89 / 13,92 / 18,75 | Hedda ! % G 15,23 / 32,16 /
  //  46,30 | Bran : ; ? 11,93 / 20,16 / 31,37 | Mile @ [ ] 16,87 / 14,09 /
  //  10,05 | Held u U X ^ Z 10,45 / 24,60 / 23,36 | Knochen O B b N 10,42 /
  //  11,03 / 24,41 | Gras e E a m K A 16,05 / 11,11 / 19,14 | Erde z p v M P V
  //  10,17 / 15,83 / 29,38 | Wasser w W 9 '=' 18,96 / 10,77 / 10,10 | Stein
  //  g s S F 11,90 / 17,57 / 30,76 | Rost 4 5 6 19,16 / 28,46 / 42,47
  //  (Reihenfolge je Eintrag: SKELETT / GHUL / HUND).
  //
  // 'x' UND 'f' BLEIBEN BESTAND, ALS FIGURENFARBE GESPERRT (E-C3): 'x'
  // (#e0524c, Trank/Herz) ist mit C*ab 64 der bunteste Ton der Palette und
  // gehoert dem HUD; 'f' (#8a92a0, fog_blob, 234 Texel, GRAVEYARD fog:true)
  // ist mit dE00 3,9 zu 'D' ohnehin kein eigener Materialton. Blutakzente
  // laufen ueber r/R, nie ueber 'x'.
  //
  // SANKTIONIERTE FOLGE (KEIN Fehler): .tmp/check_gfx6_art.mjs SYM-Deckel
  // 17 -> 25 (§5(2), dieselbe Runde) und .tmp/shot_gfx6.py:309 Paletten-Regex
  // um diese 8 Zeichen (§5(7), zweite Beruehrung — sonst messen die Realmess-
  // Szenen in einer 78-Ton-Welt). .tmp/check_gp6_art_self.mjs:26 (erwartete
  // "genau 3 Symboltoene") BLEIBT rot wie seit CH-1 — 6 ROT von 428, KEIN
  // siebtes (E-A7). smoke_test.mjs:81-93, sprite_factory.js:17-19 und
  // art_slice3_selfcheck pruefen nur die MITGLIEDSCHAFT in PALETTE und bleiben
  // gruen. Die mobile/-Spiegelkopie der Palette entsteht je APK-Build neu.
  // PALETTE NACH CH-2 (R-C2): 86 Toene = 61 alnum + 25 Symbole (3 alt + 14
  // CH-1 + 8 CH-2).
  '"': '#4b5686', // Knochen SCHATTEN (kalt), Rampe SKELETT Stufe 1/3. L601 88,2 | C*ab 29,6 | Hue 287,8
                  // (hue ERZWUNGEN, siehe Deklaration 5; nur Kanten/Rippen, nie Flaeche)
  '$': '#8c7671', // Knochen MITTE,           Rampe SKELETT Stufe 2/3. L601 124,0 | C*ab 9,7 | Hue 37,6
  '/': '#ae9a66', // Knochen LICHT (warm),    Rampe SKELETT Stufe 3/3 (Leitton, >= 65 % der
                  // Innenflaeche). L601 154,1 | C*ab 30,0 | Hue 90,2
  '<': '#737b71', // Lumpen MITTEL, Rampe GHUL Stufe 2/3 (Leitton; Stufe 1/3 ist Bestand 'd').
                  // L601 119,5 | C*ab 6,7 | Hue 138,5
  '>': '#7f968c', // Lumpen HELL,   Rampe GHUL Stufe 3/3. L601 142,0 | C*ab 10,5 | Hue 166,0
  '{': '#008190', // Fell DUNKEL,   Rampe HUND-PETROL Stufe 1/3. L601 92,1 | C*ab 29,1 | Hue 214,6
  '}': '#268685', // Fell MITTEL,   Rampe HUND-PETROL Stufe 2/3 (Leitton). L601 105,2 | C*ab 28,0 | Hue 195,5
  '`': '#3a9897', // Fell LICHT,    Rampe HUND-PETROL Stufe 3/3. L601 123,8 | C*ab 28,4 | Hue 195,7
};
