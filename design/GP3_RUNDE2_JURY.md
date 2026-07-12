# Grafikpass 3 — Jury-Ergebnis Runde 2 (12.07.2026, neue Skala)

Skala: 10 = herausragende moderne Handy-Pixel-Art, SoM = 8,5-9,
gutes SNES-Spiel = 6, GP2-Endstand (Baseline) = 4,5-5.

**Noten: 6,0 / 6,0 / 6,0 → MEDIAN 6,0** (einstimmig; alle drei
bilder_gelesen=true, direkte Agent-Juroren auf Opus, alle 10 R2-PNGs
plus 4 R1-Archive plus g2_01-Baseline gelesen).

Meilenstein 6,5 NICHT erreicht → Runde 3 (letzte Runde laut Spec §6.3).
Verlauf: GP2-Baseline ~4,5-5 → R1 5,5 → R2 6,0.

Einhelliges Lob: organischer Teichrand (Marquee weg), Riss-Raster der
Katakomben praktisch eliminiert, Licht/Alpha-Schatten "echtes
Über-SNES-Niveau", Kohärenz/Atmosphäre stark (2× 6,5), Funken-Zerfall,
HUD-Bevel, sauberere Sprite-Kanten. Einhellige Deckelung: Wasser bleibt
schwächstes Kriterium (H 5,5 / K 5,0 / M 5,0 — Jalousie-Raster, fehlende
Tiefe, Temperatur-Fremdkörper), Gras-Stempel-Wiederholung, gleichförmige
Kronen-Silhouetten, flache Prop-Verankerung (fehlende Kontaktschatten).

## Kriterien-Matrix (Handwerk / Komposition / Moderne)

| Kriterium | H | K | M |
|---|---|---|---|
| K1 Flächen-Wiederholung | 6,0 | 5,5 | 6,0 |
| K2 Wald/Kronen | 5,5 | 5,5 | 6,0 |
| K3 Wasser | 5,5 | 5,0 | 5,0 |
| K4 Zweite Reihe/Props | 5,5 | 6,0 | 6,5 |
| K5 Kohärenz | 6,5 | 6,0 | 6,5 |
| K6 Moderne Veredelung | 6,0 | 6,0 | 6,5 |

## Juror-Anweisungen WÖRTLICH (Lehre GP2: nicht paraphrasieren)

### Wasser (K3 + K1-Anteile, niedrigstes Kriterium — Priorität 1)

- H-K1: "Wasser: jede Wellenzeile horizontal um wechselnde 1-3 px
  versetzen und Ripple-Länge variieren, damit keine vertikalen Säulen
  entstehen."
- M-K1a: "Drei Wellen-Grids alternierend horizontal versetzen (Zeile n:
  0px, n+1: +5px, n+2: +11px) und jede 4. Zeile eine dunklere
  Wellenlinie (Grundton −12 % Helligkeit) einstreuen."
- H-K3: "Uniforme Horizontalbänder durch 2-3 Ripple-Töne in versetzten
  Kurz-Strichen (3-6 px, pro Zeile offset) ersetzen. [...] Weiße
  Sparkles auf isolierte 1 px-Highlights NUR an Ripple-Kämmen (jede
  ~5. Welle) reduzieren."
- K-K3a: "eine durchgehende 1-2px hellere Uferschaum-Linie entlang der
  GESAMTEN Wasser-Land-Grenze legen, die den Kachelstufen folgt und sie
  verschmilzt."
- K-K3b: "die horizontalen Wellen um 1px pro Reihe versetzen und alle
  3-4 Reihen einen helleren Glanzstreifen einstreuen."
- M-K3a: "Im vertikalen Gruftkanal (g3_04) laufen die Wellen horizontal,
  obwohl das Wasser vertikal fließt — Wellenlinien um 90° drehen
  (vertikale, leicht wellige Strähnen)."
- M-K3b: "1-2px weiße Glanzlichter (Alpha 60 %) nur an den fackel-nahen
  organischen Randkanten setzen statt flächig gleichem Raster."
- M-K3c: "Grundton von Blaugrau 8-10 % Richtung Grün-Teal ziehen, damit
  das Wasser nicht als kalter Fremdkörper in der warmgrünen Palette
  liest." Plus H-K5: "Spitzen-Helligkeit/Sättigung des Wassers um
  ~8-10 % senken."
- WIDERSPRUCH Tiefengradient: H-K3 will "dunkleres Band an der
  Uferkante, das zur offenen Fläche aufhellt"; K-K3c will "Innenfläche
  1 Ton dunkler als den Rand" (= hell am Ufer, dunkel in der Mitte).
  ENTSCHEID Hauptloop: K gewinnt — physikalisches Modell und
  R1-Anweisung 1 sowie das bestehende BFS-depthOverlay arbeiten bereits
  Ufer-hell → Mitte-dunkel. H's Intention (Fläche statt Streifen lesen)
  wird über die dunkle 1-2-px-Wasserlinie DIREKT an der Kante plus den
  verstärkten Gradienten erfüllt.
- WIDERSPRUCH Zeilen-Versatz (drei unvereinbare Zahlvorgaben): H will
  "wechselnde 1-3 px" (bewusst unregelmäßig), K will "1px pro Reihe"
  (regelmäßig), M will Grid-weise "0px/+5px/+11px". ENTSCHEID Hauptloop:
  kombiniert — INNERHALB jedes Wasser-Grids unregelmäßiger Zeilen-Versatz
  von wechselnd 1-3 px (H gewinnt; ein regelmäßiger 1px-Treppenversatz
  erzeugte nur ein neues Muster), ZWISCHEN den drei Grid-Varianten
  zusätzlich globale Offsets ~0/+5/+11 px (M). Ks Intention (kein
  Kachelraster im Wasser) wird dadurch miterfüllt.

### Gras / Wege (K1)

- K-K1a: "mindestens 3 Gras-Detail-Sprites (kurzes Büschel / langer
  Halm / kleiner Fleck) per Hash-Noise statt Raster streuen, Dichte
  < 1 Detail pro 3×3 Kacheln."
- K-K1b: "eine zweite Makro-Ebene aus unregelmäßigen dunkelgrünen
  Patches über je 3-4 Kacheln darüberlegen — ohne diese Makro-Variation
  bleibt jede Grasfläche flach und das Tiling sichtbar."
- H-K1: "Von jedem Boden-Detailstempel 3 Rotations-/Spiegel-Varianten
  anlegen und die Platzierung um ±2-3 px vom Tile-Raster jittern.
  Zusätzlich alle ~6-8 Tiles EIN größeres, seltenes Detail
  (Riss-Erdfleck oder Moosklumpen über 2×2 Tiles)."
- M-K1c: "Grasbüschel-Stempel in 3 Spiegel-/Rotationsvarianten ablegen
  und Setzdichte per Noise statt festem Intervall."
- M-K1b (Wege): "pro 16×16-Weg-Tile 2-4 dunklere Kies-Pixel (−15 %) und
  1-2 hellere Sand-Pixel (+12 %) an nicht-rasterausgerichteten
  Positionen streuen (Offset per (x*7+y*13)%16)."

### Kronen (K2)

- H-K2: "In die obere Kronen-Kante je 2-3 asymmetrische Kerben schneiden
  (4 px-Cluster entfernen), sodass keine zwei Kronen dieselbe Außenlinie
  teilen. Rim von 1 px auf einen 2 px-Cluster NUR auf der oberen linken
  Lichtseite verstärken und das untere Schattenband als gebogenen
  Schlagschatten auf die darunterliegende Krone ziehen. Basiston
  benachbarter Kronen um ±10-15° gegeneinander (gelbgrün vs. blaugrün)."
- K-K2: "3 Kronen-Varianten in unterschiedlichen Durchmessern
  (16/24/32px) [...] obere Silhouette eine unregelmäßige Auf-/Ab-Linie
  (nie zwei gleich große nebeneinander); 2-3 Kronen 4-6px über die Kante
  nach links ragen lassen [...] einzelne 2px-Stamm-Ansätze für Tiefe."
- M-K2: "Mindestens 3 Kronen-Breiten mischen (20/28/36 px); Highlight-
  Kante (Grün +18 %) nur auf die licht-zugewandte obere-linke Seite,
  untere-rechte Kante mit 2px-Schattenband (Grün −20 %) [...]
  Silhouettenkante zum Boden mit 2-3px-Blätter-Ausbuchtungen
  unregelmäßig aufbrechen statt gerader Vertikalkante."
- WIDERSPRUCH Größen (16/24/32 vs. 20/28/36): ENTSCHEID Hauptloop —
  Sprite-MASSE sind eiserne Regel §0.7 (Grids bleiben 32×32-Spans).
  Umsetzung als FOOTPRINT-Variation INNERHALB der 32×32-Grids: effektive
  Kronenbreiten ~20/26/32 px über die 6 Silhouetten M/N/O/Q/V/X verteilt.

### Zweite Reihe / Props (K4 + K5-Anteile)

- H-K4: "Jedem Grab-Prop (Stein, Kreuz, Zaun) einen 1 px hell-warmgrauen
  Oberkanten-Rim und ein 1 px Kontakt-Schatten-Oval darunter geben. Auf
  Wraith und Ghul einen 1 px kühl-blauen Einstufen-Rim auf der
  Fackel-zugewandten Seite setzen, passend zum Rim des Helden."
- K-K5: "unter jede stehende Requisite (Grabstein, Kreuz, Topf) eine
  weiche 1-2px dunkle Kontakt-Schatten-Ellipse (Alpha ~40%, zur
  Lichtquelle versetzt)."
- K-K4: "Vierbeiner — Beine per 1px dunkler Trennlücken separieren, Kopf
  mit 1-2px hellerer Schnauzen-/Ohr-Kante vom Rumpf abheben, 1px dunkle
  Schatten-Ellipse darunter; zusätzlich 2 alternative Grabstein-
  Silhouetten (gebrochen/schräg, Kreuz-Form)."
- M-K4a: "Held-Gesicht unter der Kapuze ist nur dunkler Fleck: 2px
  Hautton + 1px Augenschatten setzen." (player_* bleibt laut §8c.1
  geöffnet, nur Pixel.)
- M-K4b: "Skelett/Grabwächter mit 1px fast-schwarzem Outline-Saum."
- H-K5: "Rim-Modell vereinheitlichen — denselben 1 px-Richtungsrim auf
  alle erhabenen Entities anwenden." (Per-Sprite-Pixel, NICHT als
  Render-Pass — der ist Nicht-Ziel §1.)

### Licht / Partikel / UI (K6)

- M-K6a: "Funken an der Flammenbasis in Dichte verdoppeln/verdreifachen
  und jeden Funken mit 2px additivem Glow (warmes Orange, Alpha 40 %)
  umgeben, damit sie glühen statt Einzelpunkte zu sein."
- H-K6 Boss-Bar: "2 px dunklem Rahmen + 1 px Innenbevel, dezentem
  Vertikal-Gradient (helleres oberes Drittel), Segment-Ticks und einer
  entsättigten 'verlorene HP'-Rinne dahinter."
- H-K6 HUD: "1 px helle Kante oben-links, 1 px dunkle Kante
  unten-rechts, plus schwacher Innen-Drop-Shadow."
- K-K6: "in den Pool-Zentren einen zusätzlichen +1-Ton-Highlight nur auf
  bereits helle Textur-Pixel legen, damit das Licht die Oberfläche
  'trifft' statt als reiner Overlay-Kreis aufzuliegen."
- M-K6b: "Rim-Light konsequent auf alle Figuren: die der Lichtquelle
  zugewandte Kante mit 1px Rim (Fackel = orange, sonst kühl)." —
  Umsetzung per-Sprite in den Grids (Farblogik: warme Rim-Töne bei
  Fackel-Nähe-Sprites wie torch_*/Boss, kühle bei Freiland-Gegnern);
  ein LICHTRICHTUNGS-abhängiger Rim wäre ein Render-Pass (Nicht-Ziel).
- M-K5b: "Zwischen Friedhof-Erdweg und Katakomben-Boden einen
  gemeinsamen warmen Mittelton" — Umsetzung als Paletten-Verwandtschaft
  (geteilter Mittelton), KEIN neues Übergangs-Tile.

## Hauptloop-Entscheidungen für Runde 3 (Fable, 12.07.2026)

Adversarial GEPRÜFT (Opus-Workflow 12.07.2026): alle vier Engine-Mandate
GO. Kernbeleg: Smoke §36 hasht das SOLIDITÄTS-Raster, nicht die
rows-Bytes (smoke_test.mjs:1843-1844) — begehbare Deko-Tausche sind
hash-neutral; §16 ist eine Mindestliste (neue Keys erlaubt); die
§35-Wasser-Assertions nutzen eine synthetische Legende (art-unabhängig);
check_inventory lädt FLUESTERGRUFT nicht; Boss-Bar liegt in hud.js:105-120
und ist bereits fillRect-only, der ambientAlpha-Detektor der Boss-
Flusstests greift das ERSTE Teilalpha-fillRect (lighting, vor drawHUD)
und bleibt von Bar-Änderungen unberührt.

1. **ART-RUNDE (Art-Fixer, nur art/):** alle Wasser-Grid-Anweisungen
   (Zeilen-Versatz, Kurz-Striche, Glanzstreifen, Sparkle-Reduktion,
   Uferschaum-Kontinuität), Wasser-Temperatur/Sättigung in palette.js,
   Gras-Stempel-Varianten, Weg-Kies/Sand-Korn, Kronen-Footprints/Kerben/
   Ausbuchtungen/Tonvarianz, Props-Kontaktschatten + Rims + Grabstein-
   Varianten (via variants[], keine neuen Keys), Grufthund, Helden-
   Gesicht (§8c.1), Outline-Säume.
2. **ENGINE-MANDAT (Engine-Fixer, §6.3-Eskalation):**
   a. gen_deco3.mjs: Gras-Detail-Streuung von festem Intervall auf
      Hash-Noise; NEU Makro-Patches (dunkelgrüne begehbare Cluster über
      2×2 bis 3×3 Kacheln, GRAVEYARD). Seltenes Großdetail ~1/6-8
      Kacheln (H-K1). VORBEDINGUNGEN (geprüft): durch das bestehende
      verifyNeutral-Gate (gen_deco3.mjs:39-67); nur nicht-solide
      Zeichen; keine Fackel-/Portal-/Spawn-Zelle überschreiben; die
      Span-Zeichen M/N/O/Q/V/X meiden; Legenden-Einträge mit
      fringeSource/fringeSet 'grass' (sonst Fringe-Löcher); Grids
      exakt 16×16.
   b. Gruftkanal-Fließrichtung: neue vertikale Wasser-Keys (exakt
      16×16) + FLUESTERGRUFT-Legenden-Umlenkung. Die Abwärtsdrift wird
      ART-GEBACKEN in die 4 Frames (vertikaler Phasenversatz zwischen
      den Frame-Grids); animSync/animRate-Engine-Code UNVERÄNDERT —
      eine echte per-Zeile-Laufzeit-Phase kollidierte mit dem
      §35-animSync-Test (smoke_test.mjs:1624). Kein Math.random in
      Grids/Legende. FALLBACK bei unerwarteter Kollision: horizontale
      Bänder mit stärkerem Versatz, keine Legenden-Änderung.
   c. particles.js: Spawn-Dichte an Flammenbasis 2-3× (main.js-seitig),
      Obergrenze 60 UNVERÄNDERT (Smoke §36:1867 prüft den Deckel
      spawnraten-unabhängig); Render: 1px-Kern + 2px-Halo (fillRect,
      warmes Orange, Alpha ~0,4) im main.js-§2.4-Block.
   d. hud.js Boss-Bar ENG GEÖFFNET (nur Zeichnung: Rahmen, Bevel,
      Gradient, Ticks, Verlust-Rinne; fillRect-only; keine
      Gameplay-Werte; Bar bleibt in drawHUD, also NACH lighting.draw —
      so bleibt der ambientAlpha-Detektor der Boss-Flusstests
      unberührt). Analog §2.6-Muster.
3. **VERTAGT auf Pass 4 (STRUKTURELL):** Licht-trifft-Textur (K-K6,
   Per-Pixel-Licht = explizites Nicht-Ziel §1), Boss-Skalierung/
   Arena-Komposition, rechteckiger Teich-Footprint (Map-Authoring/
   Autotiling), Skull-Icon welthaft vs. Marker (UI/Gameplay-Entscheid),
   Rim als globaler Render-Pass, Parallaxe/Mittelgrund, g3_05-Zoo
   (Level-Design), "Spieler steht auf dem Wasser" (aus R1 vertagt),
   Animationsreichtum/mehr Animationsphasen (H strukturell —
   Asset-Produktions-Scope, Slice-5/Pass-4-Kandidat).

## Betriebsnotizen

- Diese Runde lief zeitweise mit Haiku als Hauptloop (Regelverstoß gegen
  "Fable plant, Opus baut" — Hauptloop gehört auf Fable). Juroren selbst
  liefen korrekt auf Opus; Median-Bildung war korrekt; die ERST-
  Konsolidierung war paraphrasiert statt wörtlich und wurde durch dieses
  Dokument ersetzt. Lehre: Nach Session-Restart Modell des Hauptloops
  prüfen, BEVOR konsolidiert wird.
- Juror-Prompts nutzten als GP2-Baseline nur g2_01 (Spec §6.2 nennt
  g2_* plus slice1-Baselines) — für die Vergleichs-Einordnung R2
  ausreichend, für R3 wieder die volle Baseline-Liste mitgeben.
