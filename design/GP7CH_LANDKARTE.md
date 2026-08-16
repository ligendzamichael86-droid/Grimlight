# GP7-CH Landkarte — "Die Menschen" (16.08.2026, Fable)

Michael-Direktive 16.08.: Die Menschen muessen "viel besser" werden;
die Spieldynamik bleibt unangetastet; Slice-6-Abnahme haengt an der
Optik. Drei Analysen (Datei:Zeile-Belege bindend):
- Teil A: GP7CH_LANDKARTE_A_BESTAND.md (Inventar, Rampen, Kontraste,
  Kosten Weg A/B)
- Teil B: GP7CH_LANDKARTE_B_WAECHTER.md (alle Test-Bindungen: 6
  Canvas-Rigs, Flip-Regel, M5-Margen, M3/M4-Sprite-Kopplung,
  Wohlgeformtheits-Gates)
- Teil C: GP7CH_LANDKARTE_C_ZIELBILD.md (12+2 Techniken T1-T14 mit
  IST/ZIEL-Messwerten, Figuren-Steckbriefe, Horden-Vorgriff,
  Massfrage, Pass-Schnitt CH-1..CH-4)

## KERNBEFUNDE (Kurzfassung)

1. Kein gemessener Defekt stammt vom Sprite-Mass. 4 von 6 Menschen
   tragen die Rampe ihres eigenen Gebaeudes; Held 35 % Schwarz-
   Umriss und 82 % spiegelgleich; Hue-Spanne der Figuren-Rampen
   2-10 Grad (Welt: bis 59); Sekundaerbewegung 0 %; NPC-Talk-Frames
   sind 4-Texel-No-ops; Held ohne Idle/Hurt, Attack = 1 Frame;
   Skelett dL 133 (schreit), Grufthund dL -10 auf dem Weg
   (verschwindet). Der Warden (24x32, 19 Toene, 21 % Umriss, 52 %
   Symmetrie) ist der Eichkoerper: dieselbe Engine kann es.
2. Anhaengen ist sicher (alle 6 Rigs lesen SPRITES live); Flip-
   Liste NUR ans Ende (Einschub kippt u. a. das DORF-gegnerfrei-
   Gate falsch-rot). M5-Schattenmargen 3-10 Texel; M3/M4 in
   shot_gfx6.py haengen an den HEUTIGEN Pixeln von player_down_0/
   skeleton_0 (Umfaerbung -> Proof nachziehen); ghoul_0 braucht 'C'.
3. Paletten-Reserve exakt NULL (64/64 Toene in Nutzung); der
   61+3-Deckel ist ein Waechter-Konstrukt (aktiv nur noch
   check_gfx6_art.mjs:74-79), keine Technikgrenze.

## FABLE-VORENTSCHEIDE (bindend fuer die Spec)

V1 **Paletten-Erweiterung: JA, sanktioniert.** Neuer Symbol-
   Namespace fuer Charakter-Stoffe: +8 Slots (Zeichen-Satz legt die
   Spec fest; Grid-tauglich = 1 Zeichen, nicht '.', nicht alnum).
   Sanktion: GENAU die Deckel-Zeilen check_gfx6_art.mjs:74-79
   (sym-Satz erweitert; alnum bleibt 61), Marker GP7CH. smoke:81-93
   und sprite_factory tragen neue Schluessel automatisch.
V2 **sprites.js-Split: JA, vor CH-1.** art/sprites_figuren.js
   (SPRITES) + art/sprites_tiles.js (TILE_ART), sprites.js bleibt
   FASSADE mit unveraenderten Re-Exports — Schluessel-Reihenfolge
   byte-stabil, alle Importe unveraendert, Canvas-Rigs unberuehrt
   (Beweis: alle Suiten gruen, Einzel-Commit).
V3 **Mass: CH-1 laeuft auf 16x24.** 16 Breite unantastbar.
   AUSSTIEGS-GATE vorab fixiert: sind nach CH-1 ALLE Handwerks-
   Messziele gruen (Umriss<=25 %, Symmetrie<=65 %, Hue>=20 Grad,
   Stofframpe>=3 Stufen, dL-Band 25..90, Profil<=70) UND der
   Jury-Median bleibt <8,0, ist das Format bewiesene Grenze ->
   Folgeschnitt auf 24x32 (NICHT 20x28; Kachel-Vielfache, Warden
   als Eichkoerper). Vorher NICHT.
V4 **Tueren-Nebenauftrag: JA.** Tueren auf span [1,2] (Art 16x32)
   — behebt den heute schon sichtbaren Massstabsbruch (Held 1,5x
   so hoch wie jede Tuer). Sanktion: +1 Masstabellen-Musterzeile
   16x32 an BEIDEN Orten (smoke ~1744-1777 Block, check_gfx6_art
   ~128-172), Marker GP7CH; map_dorf-Legende T/t (sol/geo-Beweis
   Pflicht — Golden byte-gleich).
V5 **Pass-Schnitt wie Teil C §5:** CH-1 Menschen-Standbilder
   (Held+5 NPCs, ~21 Grids + 2 Tuer-Grids; KEINE neuen
   Animationszustaende), CH-2 Gegner+Horden-Grundlagen, CH-3
   Animation, CH-4 Licht-auf-Figuren. Je Runde: Figuren-Bogen +
   Jury + Michael am Geraet. Der FIGUREN-BOGEN (alle Figuren, 3
   Boeden, 1x+6x+Squint) wird als Phase-0-Werkzeug gebaut.
V6 **Deklariert:** Flash-statt-Blink (T13) und zweistufiges
   Sterben (3.1) gehoeren zu CH-2 (brauchen sanktionierte
   enemies.js-Oeffnung — NICHT in CH-1, Spieldynamik bleibt).
   Held-Silhouette bleibt das einzige Violett; G-Stofframpe wird
   ueber neue V1-Toene geschlossen (nicht ueber Fremd-Toene).
