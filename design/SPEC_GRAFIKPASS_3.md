# Technische Spezifikation — Grafikpass 3 "Moderne Mittel"

Stand: 08.07.2026, BINDEND. Adversarialer 3-Blickwinkel-Review eingearbeitet
(3 Blocker: ellipse/roundRect hätten alle Flusstest-Stubs gecrasht → Schatten
und Panel sind jetzt fillRect-only; Smoke-Abschnitt-21-Freeze kollidierte mit
den Spiegelkronen-Zeichen → sanktionierte Minimal-Edits benannt; 4 Majors u. a.
main.js-Öffnung für die tint-Durchreichung und Fringe-Flags der Deko-Zeichen;
5 Minors inkl. Juror-Übergangsanker für die neue Skala).

Ausgangslage: Grafikpass 2 endete bei Median 6,5 (alte Skala, 10 = Secret of
Mana) mit priorisiertem Backlog (uebergaben/2026-07-07_grafikpass2.md).
Michael hat das Ziel verschärft: **"Abnahmeziel 10, oder besser 12 — wir
haben das Handy als Grundlage, kein SNES."** Dieser Pass setzt das Backlog
um UND öffnet erstmals die modernen Mittel, die ein SNES nie hatte:
Partikel, echte Alpha-Schatten, Farbtemperatur-Stimmung. SNES-Ästhetik
bleibt (320×180, Pixel-Grids, 16-px-Tiles); die SNES-HARDWARE-Grenzen fallen.

**NEUE JUROR-SKALA (ab diesem Pass, bindend):**
- 10 = herausragende MODERNE Handy-Pixel-Art (Klasse Octopath/CrossCode)
- 8,5-9 = Secret of Mana selbst
- 6 = "gutes echtes SNES-Spiel" (entspricht der alten 8)
- Meilenstein dieses Passes: Median >= 6,5 auf der NEUEN Skala.
  Kein früher Abbruch; 3 Runden werden voll genutzt (Projektziel bleibt 10,
  verfolgt über Folgepässe).

Grüne Basis: Commit 204e28f. Bindend bleiben alle früheren Specs/Übergaben,
soweit hier nicht AUSDRÜCKLICH geöffnet.

## 0. Eiserne Regeln (Änderungen zu GP2 sind markiert)

1. **KEINE Gameplay-Änderung:** Kollision, Spawns, Portale, Hitboxen,
   Kampfwerte, XP, Loot bleiben exakt wie 204e28f.
2. **GEÄNDERT — rows-Deko-Ausnahme:** Die Ground-ROWS von GRAVEYARD und
   CATACOMBS dürfen in diesem Pass verändert werden, ABER ausschließlich
   durch Tausch BEGEHBARER Deko-Zeichen untereinander bzw. gegen
   Boden-Zeichen (§4.3). Der Beweis der Gameplay-Neutralität ist
   automatisiert (§5, Solidity-Guard): Soliditäts-Raster, alle Spawns,
   Portale, Fackel-Positionen und Truhen-Plätze byte-identisch.
   FLUESTERGRUFT- und BOSS_KAMMER-rows bleiben byte-identisch.
3. **Flusstests:** Es gibt GENAU SIEBEN erlaubte Änderungen (§5.1), alle
   sind reine Zahlwert-Anpassungen der Ambient-Fingerprints. Alles andere
   an .tmp/check_*.mjs ist tabu.
4. **Tabu bleiben:** `game/js/items/` und `game/js/entities/` (komplett),
   `game/js/core/` AUSSER lighting.js und der NEUEN Datei
   core/particles.js, `game/js/ui/` AUSSER der drawHUD-Panel-Erweiterung
   (§2.6), `player_*`-Sprites.
   **GEÖFFNET (nur Pixel-Inhalt, Maße fix):** `warden_*`, `torch_*`,
   `fringe_*`/`moss_fringe_*` (§3.5).
   **GEÖFFNET (eng umrissen):** main.js für §2.3 (NUR das Anhängen von
   `mapDef.ambientTint` als 6. Argument an den lighting.draw-Aufruf,
   Zeile ~501), §2.4 (Partikel-Integration) und §2.5 (Weichschatten-Pass);
   lighting.js für §2.3 (ambientTint + Schmier-Diagnose). Fällt die
   Schmier-Diagnose auf die VIGNETTE, ist zusätzlich hud.js:drawVignette
   eng mitgeöffnet (nur Gradient-Stops/Radien, dokumentieren).
5. **Kein `Math.random`/`Date.now` in `game/js/world/` und `game/js/art/`**
   (Smoke-Wächter bleibt). AUSNAHME NEU: `core/particles.js` DARF
   Math.random im SPAWN-Pfad nutzen (Partikel sind nicht testfixiert);
   der Render-Determinismus-Smoke bleibt auf world/art beschränkt.
6. Port 8123 gehört dem Auftraggeber; Agenten nutzen 8124 (Regeln wie GP2).
7. Sprite-/Tile-MASSE unverändert; neue Keys sind 16×16, außer den drei
   gespiegelten Kronen (32×32, §3.2).
8. Flip-Liste in main.js unverändert (Kronen-Spiegelung passiert als
   Text-Spiegelung im Generator, NICHT zur Laufzeit).

## 1. Scope: sechs Pakete

A. **Wasser-Wellenbänder:** Stipple-Rauschen wird zu horizontalen
   Wellenbändern mit nahtlosem Scroll-Loop; Nassrand am Gruft-Kanal.
B. **Wald-Vielfalt:** 3 gespiegelte Großkronen (6 Silhouetten gesamt),
   vertikaler Anker-Jitter, Stammlücken an der Kronenbasis.
C. **Dichte & Dekals:** Gras-Deko-Streuung im Friedhof (~1/20), Riss-Dichte
   der Katakomben auf ~1/7 gesenkt, Riss-Varianten.
D. **Licht & Stimmung:** Farbtemperatur pro Map (ambientTint), Ambient-
   Rebalancing (CATACOMBS 0.78, BOSS_KAMMER 0.66) MIT den 7 sanktionierten
   Alt-Test-Anpassungen, AO-Kanten, Diagnose des "Schatten-Schmiers".
E. **Partikel & Alpha-Schatten (MODERN):** Glut-Funken über Fackeln
   (core/particles.js NEU), weiche rgba-Bodenschatten unter beweglichen
   Entities, HUD-Panel.
F. **Sprite-Refresh:** Skelett frontal neu, Ghul-Farbton kränkliches
   Gelbgrün, Grabwächter-Umriss+Backlight, Fackel-Flammenkern.

Nicht-Ziele: Mittelgrund-Silhouetten (Säulen/Wurzeln zwischen Ebenen),
Parallaxe, Wasser-UV-Scrolling per Shader, Gegner-Rimlight als globaler
Render-Pass — alles Kandidaten für Pass 4; hier bewusst draußen.

## 2. Engine (Besitz: Engine-Builder)

### 2.1 tilemap.js — Anker-Jitter + Nassrand

- **Anker-Jitter:** span-Anker (Kronen) erhalten beim Over-Draw einen
  deterministischen vertikalen Pixel-Versatz:
  `jy = variantIndex(tx, ty, 5) - 2` (also -2..+2 px), addiert auf sy.
  Culling-Fenster oben um 1 Tile zusätzlich erweitern (Jitter kann Anker
  knapp über den Viewport schieben). Ground-Layer unberührt.
- **Nassrand (additiv):** Trägt ein TARGET-Def `shorePrefix` und das
  Quell-Set ist 'moss', werden die moss_fringe_*-Keys WEITERHIN emittiert
  und ZUSÄTZLICH danach `wet_n/e/s/w` (nur Orthogonale). Das grass-Quell-
  Verhalten (ersetzen durch shore_*) bleibt exakt wie in GP2.
  FLUESTERGRUFT-'~' erhält `shorePrefix: 'wet'` (§4.1).

### 2.2 Wasser-Scroll-Loop (Legende, kein Engine-Code)

Der Ping-Pong wird durch einen nahtlosen 4-Frame-ZYKLUS ersetzt:
`anim: ['water', 'water_1', 'water_2', 'water_3'], animRate: 3,
animSync: true` an GRAVEYARD- und FLUESTERGRUFT-'~'. Nahtlosigkeit ist
Art-Pflicht (§3.1: Bänder wandern pro Frame 4 px, 4×4 = 16 px = Kachelhöhe
→ Frame 3 → Frame 0 ist übergangsfrei). depthOverlays/shore bleiben.

### 2.3 lighting.js — ambientTint + Schmier-Diagnose

- `draw(ctx, camera, lights, ambient, timeSec, tint)` — neuer optionaler
  Parameter: Füllfarbe des Dunkel-Overlays statt fix '#050510'.
  main.js reicht `mapDef.ambientTint` durch. Werte (§4.2): GRAVEYARD
  '#0a0a18' (blauviolette Nacht), CATACOMBS '#06080f' (kaltes Blau),
  FLUESTERGRUFT '#04100c' (grünschwarzes Grabwasser), BOSS_KAMMER
  '#120608' (rotbraune Drohung). Fehlt tint → bisheriger Default.
- **Schmier-Diagnose (Juror-Befund R3):** Der weiche Schatten-Blob in den
  Katakomben-Shots ist zu identifizieren (Verdacht: Warm-Glow-Gradient
  oder Vignette auf großen Radien) und zu beheben (z. B. Gradient-Stops
  straffen, Glow-Radius kappen). Befund + Fix im Bericht dokumentieren.

### 2.4 core/particles.js (NEU) + main.js-Integration

- Node-importierbares Modul: `createParticles()` →
  `{ list, spawnEmbers(x, y, dt), update(dt), draw(ctx, camera) }`.
  Glut-Funken: 1-2 px, Töne o/y/1 (Palette), steigen 6-12 px/s, leichte
  Sinus-Drift, Lebensdauer 1,2-2,5 s, Alpha blendet gegen Ende aus
  (globalAlpha, das IST der moderne Teil). Obergrenze hart: 60 Partikel
  gesamt (Mobile-Budget). Math.random erlaubt (nur hier, §0.5).
- main.js: pro Frame für jede SICHTBARE Fackel-Lichtquelle (lights mit
  flicker >= 0.8, im Viewport ±32 px) spawnEmbers mit ~2-4 Funken/s;
  update im Fixed-Step-Block. ZEICHENZEITPUNKT (Review-Klärung, eindeutig):
  particles.draw NACH lighting.draw (main.js ~Z.501) und VOR drawVignette
  (~Z.502) — Funken sind selbstleuchtende Lichtquellen-Deko und werden vom
  Dunkel-Overlay NICHT abgedunkelt.
  Title/Inventory/GameOver: Partikel pausieren (kein Update im Freeze).

### 2.5 main.js — Alpha-Weichschatten (moderner Bodenkontakt, fillRect-only)

In drawWorld, VOR der renderables-Schleife: für Spieler und jeden Gegner
einen weichen Bodenschatten am Fußpunkt zeichnen — AUSSCHLIESSLICH aus
fillRect (die Flusstest-Stubs kennen kein ctx.ellipse/roundRect; das war
Review-Blocker Nr. 1): drei gestapelte, zentrierte 1-px-Zeilen mit
Breiten 0.9/0.7/0.4 × Hitbox-Breite, fillStyle '#000', globalAlpha 0.14
je Zeile (Überlappung ergibt die weiche Mitte), Unterkante y + h - 1.
KEINE Schatten für Props/Drops (behalten ihre gebackenen Dither-Schatten).
WICHTIG (Doppel-Schatten, Review): Der Art-Builder ENTFERNT im Gegenzug
die in GP2 gebackenen Kontaktschatten-Reihen aus den GEGNER-Grids
(skeleton/ghoul/hound/rust Fußzeilen) — einheitlicher moderner Look;
Props/Truhen behalten ihre gebackenen.

### 2.6 ui/hud.js — HUD-Panel (eng umrissen)

NUR in drawHUD: hinter dem bestehenden HUD-Block oben links (Herzen, GOLD,
Trank, XP-Balken) ein dezentes Panel — AUSSCHLIESSLICH aus fillRect
(Review-Blocker: kein roundRect/strokeRect/Pfad, die Stubs kennen sie
nicht): Grundfläche fillStyle '#0a0a12' mit globalAlpha 0.55; "Rundung"
per Eckabzug (die vier 1-px-Eckpixel auslassen, d. h. Fläche aus 3
fillRects zusammensetzen); 1-px-Rand als vier dünne fillRect-Streifen
'#3a3542' mit Alpha 0.4. Panel-fillStyle bewusst NICHT '#000' (der
fadeAlpha-Detektor der Flusstests filtert '#000'-Vollbild-Rects; Panel
ist zudem nicht vollbild). Keine Layout-/Logik-Änderung, alle bestehenden
Zeichnungen bleiben identisch positioniert, Texte und deren Reihenfolge
NICHT ändern.

## 3. Art (Besitz: Art-Builder)

### 3.1 Wasser-Wellenbänder (Paket A)

- `water`/`water_1`/`water_2` NEU + `water_3` NEU (16×16): 2-3 horizontale
  Wellenbänder pro Kachel (je 2-3 px hoch, Ton 9 dominant, W als weicher
  Rand, i nur als 2-4-px-Glanzstriche AUF den Bändern), Bandabstand 5-6 px,
  zwischen den Bändern ruhiges w. Bänder wandern pro Frame exakt 4 px nach
  unten (zyklisch, 16 px Periode → nahtloser Loop). Stipple-Kontrast
  gegenüber GP2 um ~25 % senken; KEINE Einzelpixel-Sprenkel mehr.
- `water_shallow`/`water_mid` an die Bänder anpassen (dezenter, damit
  Ufer-Schleier und Bänder nicht interferieren).
- NEU `wet_n/e/s/w` (16×16, viel '.'): 1-2 px dunkle Nasskante (w/n) plus
  1 px entsättigter Feuchtschimmer (9) an der jeweiligen Landseite — liegt
  am Gruft-Kanal ZUSÄTZLICH über den Moos-Ufern (§2.1).

### 3.2 Wald-Vielfalt (Paket B)

- NEU `tree_canopy_2x2_am`, `_bm`, `_cm` (32×32): exakte horizontale
  SPIEGELUNGEN von _a/_b/_c — im Generator (.tmp) als Text-Spiegelung
  erzeugt, dann von Hand die Lichtrichtung KORRIGIEREN (Licht muss oben-
  LINKS bleiben: Lichtkappen/Glanzcluster nach der Spiegelung umsetzen).
- Alle 6 Kronen: an der Basis 2-3 px dunkle Stamm-Lücken (0/k), damit
  Baumreihen als Einzelbäume lesen.
- gen_overrows2.mjs (Engine-Besitz) rotiert künftig über 6 Zeichen:
  M/N/O (wie gehabt) + NEU 'Q'→_am, 'V'→_bm, 'X'→_cm (§4.1; Zeichen sind
  in beiden Map-Legenden-Namensräumen frei). Ost-/West-Reihen-Regel
  (nie gleiche Silhouette benachbart) gilt über alle 6.

### 3.3 Dichte & Dekals (Paket C, Grids; Platzierung macht Engine §4.3)

- NEU `grass_tuft` (hohes Grasbüschel, 16×16, begehbar-Deko),
  `pebble_small` (kleiner Stein), `dirt_patch` (kahler Erdfleck) — alle
  drei im Friedhofs-Gras-Stil (e-Basis), KEIN Blickfang, Bodenkontakt.
- `stone_floor_cracked` bekommt `variants`: NEU `stone_floor_cracked_v1`
  (feiner Vertikalriss) + `stone_floor_cracked_v2` (2-px-Eckabplatzung) —
  drei Riss-Motive statt eines "7"-Stempels.

### 3.4 Sprite-Refresh (Paket F; Maße fix)

- GEGNER-Kontaktschatten RAUS (Gegenstück zu §2.5, Review): die in GP2
  gebackenen Dither-Schattenreihen an den Fußzeilen von skeleton_*,
  ghoul_*, hound_*, rust_* werden entfernt (der neue fillRect-Weichschatten
  aus main.js übernimmt). Props/Truhen/Vasen behalten ihre gebackenen.
- `skeleton_0/1/die` (16×16): FRONTALE Neuzeichnung — klarer Schädel mit
  2 dunklen Augenhöhlen, 2-px-Knochen, Arme unten-außen, durchgehender
  k-Umriss, b-dominante Töne (N nur 1-px-Schädel-Rim). Ziel: liest auf
  einen Blick als Skelett, nie als Spinne.
- Ghul-Töne d/G/H/3 werden IM FARBTON verschoben (sanktionierte
  Bestandston-Änderung): weg vom Hecken-Grün, hin zu kränklichem Gelbgrün
  (+Rot, -Blau; Helligkeit je ±5 %); Umriss-Kante schattenseitig dunkler.
- `warden_*` (GEÖFFNET, nur Pixel): durchgehender 1-px-Dunkelumriss, 1-px
  Backlight-Saum oben (Seelenglut 7/8, dezent), dunkle Fuge zwischen
  Schädel und Beinmasse. Die grünen Augen bleiben der hellste Punkt.
- `torch_0/1` (GEÖFFNET): Flammenkern 2 Stufen heller (1-Ton als Kern),
  1-px-Flackerrand zwischen den Frames deutlicher.
- `fringe_*`/`moss_fringe_*` (GEÖFFNET): 1-px AO-Kante an der Innenseite
  (dunkelster Ton), damit Wand-Boden-Übergänge sitzen.

### 3.5 Palette

Frei sind weiterhin nur wenige Zeichen; Budget: max. 2 neue Töne (Vorrat:
'l' bleibt verboten; verfügbar z. B. Umlaut-freie Reserve prüfen — falls
kein Zeichen mehr frei ist, mit vorhandenen Rampen arbeiten und das im
Bericht dokumentieren). Ghul-/Steinton-Anpassungen laut §3.4/GP2-Regeln.

## 4. Maps & Platzierung (Besitz: Engine-Builder)

### 4.1 Legenden

- GRAVEYARD: '~' anim → 4-Frame-Zyklus (§2.2); OVER-Zeichen 'Q','V','X'
  NEU (gespiegelte Kronen, span [2,2]); NEU Ground-Deko 'u'→grass_tuft,
  'p'? — ACHTUNG Zeichen-Kollisionen je Legende prüfen; frei wählbare
  Zeichen sind Legenden-lokal, der Builder inventarisiert vor Vergabe.
  Deko-Einträge: { art, solid: false, fringeSource: true,
  fringeSet: 'grass' } — WIE '.'-Gras (Review-Major: ohne fringeSource
  entstünden 1-Tile-Fringe-Löcher an Weg-/Wasserkanten neben Deko).
- CATACOMBS: ',' erhält variants ['stone_floor_cracked',
  'stone_floor_cracked_v1', 'stone_floor_cracked_v2']; ambient 0.78;
  ambientTint (§2.3).
- FLUESTERGRUFT: '~' anim 4-Frame + shorePrefix 'wet'; ambientTint.
  rows byte-identisch!
- BOSS_KAMMER: ambient 0.66; ambientTint. rows byte-identisch!
- GRAVEYARD ambient 0.45 UNVERÄNDERT; ambientTint neu.

### 4.2 Ambient-Werte (die EINZIGEN Zahländerungen)

CATACOMBS 0.82 → 0.78; BOSS_KAMMER 0.70 → 0.66. Sonst nichts.
Die veralteten "ZURUECKGENOMMEN"-Kommentare aus GP2 an diesen beiden
Stellen (maps.js ~287-290, map_bosskammer.js ~64) werden mit angepasst
(jetzt umgesetzt via §5.1) — rein kosmetisch.

### 4.3 rows-Deko (Generator .tmp/gen_deco3.mjs, deterministisch)

- GRAVEYARD: auf ~1/20 der reinen Gras-Zellen ('.') Deko streuen
  (grass_tuft/pebble_small/dirt_patch via neue Zeichen), nie angrenzend
  an Portale/Spawns/Truhen-Zellen, nie zwei Deko-Zeichen orthogonal
  benachbart, deterministisch via variantIndex-Hash.
- CATACOMBS: die ','-Dichte (Riss-Kacheln) von heute auf ~1/7 der
  Bodenfläche senken (','→'.' Tausch), Verteilung entklumpen.
- Der Generator VERIFIZIERT (wirft sonst) und der Smoke-Guard (§5.2)
  beweist: Soliditäts-Raster, playerSpawn, alle skeleton-/ghoul-/
  enemySpawns, propSpawns, portals, torchChars-POSITIONEN (findTiles)
  byte-identisch zu 204e28f. Fackel-Zeichen und begehbare Sonderzeichen
  (U/D) werden NIE getauscht.

## 5. Tests (Besitz: Engine-Builder; Integrator macht grün)

### 5.1 Flusstests — GENAU SIEBEN Wert-Anpassungen, sonst NICHTS

- .tmp/check_main_slice1.mjs Zeile ~229 und ~236: `0.82` → `0.78`
  (2 Zeilen).
- .tmp/check_boss_slice3.mjs Zeilen ~143, ~172, ~185, ~244, ~264:
  `0.7` → `0.66` (5 Zeilen).
PRO ZEILE dürfen BEIDE Wert-Vorkommen angepasst werden (Assertion-Literal
UND der Wert im Meldungs-String derselben Zeile — sonst meldete der grüne
Test irreführend "ambient 0.82"; Review-Minor). Assertion-Struktur und
alles Übrige bleiben byte-identisch. check_inventory_slice2.mjs: NULL
Änderungen. Es werden KEINE Stub-Methoden ergänzt — §2.5/§2.6 sind
absichtlich fillRect-only, damit die Stubs unverändert tragen.

### 5.2 tools/smoke_test.mjs — erlaubte Änderungen

1. Abschnitt 16 (additiv): neue Pflicht-Keys (water_3, wet_n/e/s/w,
   3 gespiegelte Kronen, grass_tuft, pebble_small, dirt_patch,
   stone_floor_cracked_v1/v2).
2. Abschnitt 35: Wasser-Anim-Erwartung auf den 4-Frame-Zyklus umstellen
   (die bestehende Ping-Pong-Assertion DARF dafür angepasst werden);
   die spanKeys-Liste der Grid-Maße-Prüfung (~Z.1615) um die drei
   Spiegelkronen `tree_canopy_2x2_am/_bm/_cm` auf 6 Einträge erweitern
   (Review-Major: sonst schlägt die 16×16-Annahme auf den neuen 32×32-
   Grids fehl); den Ground-rows-Freeze (~Z.1644, Liste ['M','N','O'])
   additiv um 'Q','V','X' erweitern. Dazu additiv: wet-Emission-Test
   (Moos-Ufer liefert moss_fringe_* UND wet_*), Anker-Jitter-Test
   (deterministisch, Wertebereich -2..+2, Kamera-Fenster erfasst
   gejitterte Anker).
2b. Abschnitt 21 (sanktionierter MINIMAL-Edit, Review-Blocker Nr. 2):
   im Stamm-Deckungs-Check (~Z.586-587) das Anker-Zeichen-Literal
   `'MNO'` → `'MNOQVX'` (die gespiegelten Kronen decken Stämme
   gleichwertig). SONST NICHTS in Abschnitt 21.
3. NEU Abschnitt 36 "Gameplay-Neutralität GP3": Soliditäts-Raster-Hash
   aller 4 Maps gegen eingebettete Golden-Hashes von 204e28f; Spawns/
   Portale/torch-findTiles-Positionen identisch (Golden-Werte im Test
   eingebettet, vom Builder aus 204e28f generiert); Ambient-Werte exakt
   0.45/0.78/0.85/0.66; particles.js: Node-Import, Obergrenze 60
   erzwungen, update ohne Browser lauffähig.
4. Alle übrigen Abschnitte: UNVERÄNDERT.

### 5.3 Weiter gelten

check_syntax grün; Smoke 3× (Abnahme); Flusstests grün mit GENAU den
7 Anpassungen; Quelltext-Wächter world/art bleibt (particles.js liegt in
core/ und ist ausgenommen).

## 6. Screenshot-Route + Jury

### 6.1 Szenen (.tmp/shot_gfx3.py, Vorlage shot_gfx2.py, Port 8124)

g3_01 bis g3_06 = die GP2-Szenen (Vergleichbarkeit; Kamera identisch zu
g2_*), PLUS:
- `g3_07_fackel_funken_a/b/c.png`: Fackel-Nahaufnahme Friedhof, Serie
  0,5 s Abstand — Funken müssen sichtbar WANDERN (Pixel-Diff-Pflicht wie
  beim Wasser; Partikel im Bildausschnitt > 0).
- `g3_04`-Wasser-Serie: Pixel-Diff-Pflicht bleibt (Bänder-Scroll).
- `g3_08_hud_panel.png`: beliebige Spielszene mit HUD im Fokus (Zoom
  nicht nötig, 1:1-Crop oben links genügt).

### 6.2 Jury (3 parallel + Median; NEUE SKALA)

Eichung im Prompt: 10 = herausragende moderne Handy-Pixel-Art
(Octopath/CrossCode-Klasse), 8,5-9 = Secret of Mana, 6 = gutes echtes
SNES-Spiel. ÜBERGANGSANKER (Review, Pflicht im Juror-Prompt): der
GP2-Endstand (die g2_*-Baselines) entspricht auf DIESER Skala etwa
4,5-5 — GP3 muss sichtbar darüber liegen; Meilenstein-Median 6,5.
Kriterien wie GP2 (Flächen, Wald, Wasser, Sprites, Kohärenz)
PLUS Kriterium 6: "Moderne Veredelung" (Partikel, Alpha-Schatten,
Temperatur — wirken sie integriert oder aufgesetzt?).
PFLICHTFELD im Schema: `bilder_gelesen: true/false` — Urteile mit false
oder Gesamtnote 0 werden ausgefiltert und einzeln durch einen
Ersatz-Juror ersetzt (Lehre aus GP2). Baselines: die archivierten
runde3-Stände von GP2 (g2_*) plus slice1-Baselines.

### 6.3 Schleife

3 Runden, Median-Ziel >= 6,5 (neue Skala), kein früher Abbruch unter 10.
Struktur-Eskalation innerhalb der Runde an den Hauptloop (wie GP2 §6.3).
Art-Fixer-Runden: nur art/; Engine-Nacharbeiten nur via Hauptloop-Mandat.

## 7. Datei-Besitz

| Agent | Dateien |
|---|---|
| Engine-Builder | world/tilemap.js, world/maps.js, world/map_fluestergruft.js, world/map_bosskammer.js, core/lighting.js, core/particles.js (NEU), main.js (NUR §2.3-tint-Zeile + §2.4/§2.5-Blöcke), ui/hud.js (NUR §2.6; drawVignette nur bei Schmier-Diagnose laut §0.4), tools/smoke_test.mjs, .tmp/gen_overrows2.mjs, .tmp/gen_deco3.mjs (NEU), die 7 Flusstest-Zeilen (§5.1) |
| Art-Builder | art/palette.js, art/sprites.js, eigene Dev-Checks/Generatoren in .tmp/ |
| Integrator | Nicht-Tabu-Dateien beider Builder; Konflikt → Spec gewinnt |
| Proof-Agent | .tmp/shot_gfx3.py, .tmp/screenshots/g3_* |

Schnittstelle: Key-Namen/Maße aus §3 eingefroren; Doppelanlage → Besitzer
gewinnt, Inhalt = wörtlich Spec.

## 8c. Runde-2-Entscheidungen des Hauptloops (nach Jury R1, Median 5,5)

Jury R1 (neue Skala): 6 / 5,5 / 5,5 → Median 5,5. Vollständiges Ergebnis
und konsolidierte Anweisungen: design/GP3_RUNDE1_JURY.md (BINDEND für
Runde 2, Anweisungen 1-10). Zusätzliche Entscheide:

1. **player_* GEÖFFNET (nur Pixel, alle Maße/Posen/Frame-Zahlen fix):**
   Gesicht (2 px dunkle Augenlinie, 1 px Wangenschatten schattenseitig)
   und kühle 1-px-Rim-Kante an Schultern/Kapuze oben-links — auf ALLEN
   player_*-Frames konsistent (die Flip-Quellen bleiben dieselben Grids;
   keine neuen Keys).
2. **hud.js:drawVignette GEÖFFNET (eng):** Vignette deutlich abschwächen
   (max-Alpha runter, Innenradius größer), damit der "unmotivierte
   Dunkel-Fleck" (2 Juroren) verschwindet; KEINE Kopplung an Lichtquellen
   in diesem Pass (zu großer Umbau — Pass-4-Kandidat).
3. **stone_floor-Diagnose:** Die Riss-Wiederholung in g3_03/g3_06 stammt
   aus den stone_floor-VARIANTEN (v1/v2 tragen beide Riss-Motive und
   liegen via variantIndex auf 1/3 der Fläche). Art: nur EINE Variante
   behält einen dezenten Riss (gespiegelt/gedreht), die andere wird
   Platten-Versatz/Abnutzung OHNE Riss.
4. Boss-Arena-Lesbarkeit: dunkelste Tile-Töne unter ambient 0.66 im
   Sheet prüfen und art-seitig anheben (keine globalen Basiston-Sprünge).
5. Anweisung 11 aus GP3_RUNDE1_JURY.md (Spieler "steht auf dem Wasser")
   bleibt VERTAGT (Pass 4, Struktur).

## 8. Abnahme

1. check_syntax grün; Smoke 3× grün (36 Abschnitte).
2. Flusstests grün mit GENAU den 7 Zeilen-Anpassungen aus §5.1 (git diff
   belegt: nur diese 7 Zeilen, je Assertion-Literal + Meldetext-Wert;
   keine Stub-Änderungen); Solidity-Guard (§5.2.3) grün.
3. Drei dokumentierte Runden mit Notenverlauf auf der NEUEN Skala
   (Meilenstein: Median >= 6,5).
4. Bewegungs-Beweise: Wasser-Bänder UND Funken je per Pixel-Diff belegt.
5. Null Konsolen-Fehler; finale g3_*-Screenshots in .tmp/screenshots/.
6. Übergabe, Erkenntnisse in workflows/GRAFIKPASS_3.md, Commit, Memory
   (Hauptloop).
