// Grimlight-Palette — düstere Diablo-Stimmung, SNES-Rampen.
// Slice 1.5: 4-5-Ton-Rampen pro Material (Messlatte Secret of Mana).
// Bestehende Zeichen behalten ihre Rolle, neue Zeichen ergänzen die Rampen.
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
  e: '#17211a', // Gras sehr dunkel (Basiston)
  E: '#253522', // Gras dunkel (Slice 1.5 R1: angehoben, überlebt das Licht)
  a: '#394d30', // Gras mittel (Gfx2-R2 §8a.2: +12% aufgehellt, Farbton gehalten)
  m: '#506341', // Moos / Grasbüschel hell (Gfx2-R2 §8a.2: +11% aufgehellt)
  K: '#586c38', // Warmes Mittelgrün (NEU Gfx2-R2 §8a.2): Büschel-Akzent, sitzt a<K<A
  A: '#66804a', // Gras/Moos Spitzlicht (R2: angehoben, trägt unterm Lichtsystem)
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
  // Kaltes Blau / Stahl: c -> C -> i -> I
  c: '#1d2f3d', // Kaltblau dunkel
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
  w: '#0d141b', // Wasser sehr dunkel (R1: kein Reinschwarz mehr)
  W: '#1a2e3e', // Wasser mittel (R2: kälter und deutlich heller als w)
  9: '#2e5568', // Wasser-Zwischenblau (Gfx2-R3 §8b.2: heller+gesättigter für
  //             Kräusel UND Tiefen-Overlays; bleibt klar unter Sprite-Helligkeit)
  // Katakomben-Stein (kalte Grau-Rampe): k -> t -> T -> L -> D
  // Gfx2-R3 §8b.3: t/T/L/D um ~10% aufgehellt (Farbton gehalten, Mobile-Lesbarkeit).
  t: '#262a31', // Katakomben-Stein dunkel (Bodenbasis)
  T: '#434a55', // Katakomben-Stein mittel
  L: '#687180', // Katakomben-Stein hell (Kanten, Licht)
  D: '#949eae', // Katakomben-Stein Spitzlicht (NEU 1.5, Ziegel-Oberkanten)
  // Ghul-Fleisch (grünlich-fahl, aufgedunsen): d -> G -> H -> 3
  d: '#4c5a3a', // Ghul-Fleisch dunkel
  G: '#75855a', // Ghul-Fleisch mittel
  H: '#a9b287', // Ghul-Fleisch hell (fahle Haut)
  3: '#c9cfa6', // Ghul-Fleisch Spitzlicht (NEU 1.5, Schädel/Schultern)
  // Holz/Leder (Truhe, Vase, Stiefel): n -> q -> j -> Q -> J
  q: '#3a291d', // Holz dunkel
  j: '#553b26', // Holz mittel (NEU 1.5, Zwischenton q->Q)
  Q: '#6f4d2f', // Holz hell
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
};
