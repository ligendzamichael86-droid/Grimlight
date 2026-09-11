# GP7-CH-2 Landkarte — "Die Horde wird lesbar" (11.09.2026, Fable)

Teile: A = GP7CH2_LANDKARTE_A_ENGINE.md (Bestand E5-gemessen, E1-
Fenster je Gegner je Karte, Flash-/Sterbe-/Varianten-Bauwege mit
Sanktionsbedarf, Testfesseln, M3-Marge), C = GP7CH2_LANDKARTE_C_
ZIELBILD.md (H1-H8, Steckbriefe, Fussvolk, Flash-Spez, Horden-Bogen).
WO A UND C ABWEICHEN, GILT A (E5-Formeln sind bindend; C nutzte fuer
Spiegelgleichheit/Profil/Koerper-L teils Vorformeln).

## KERNBEFUNDE
1. Gegner stehen auf dem Stand VOR CH-1: Schwarzanteil 37-45 % (Menschen
   12-16), Konturtoene 1-2, Spiegelgleichheit 87-96 (E5), Rim nur Ghul
   (C, aber als senkrechte Lichtkante = Flip-Fehler) und Warden.
2. Drei Typen teilen den Leitton b (Skelett 77 % seiner Farbmasse,
   Rost, Warden) — im Horden-Prototyp lesen Skelett/Rost als dieselbe
   Figur; im Squint nur 2/5 Typen benennbar; 5 Skelette mit 9 px
   Abstand = eine Knochenwand (Umriss trennt im Gedraenge NICHT).
3. E1-Fenster (E5-Koerper-L, alle Wirkort-Klassen): Skelett 116,5..
   127,3 (IST 162,5), Grufthund gleich (IST 75,4: reisst dL UND dE00
   auf dem Weg), Warden Decke 134,9 (IST 139,5), Ghul/Rost im Fenster.
4. Palette wieder bei Null-Reserve (78 Toene, E3-Satz 14/14 verbraucht);
   frei ohne Sanktion: x #e0524c, f #8a92a0, Rim-Toene _ und | (0
   Gegner-Texel). Rost 4/5/6 kollidiert mit E6 (Torwaechter exklusiv),
   Warden traegt die Helden-Rampe u/U/X.
5. Engine: Flash-Canvases muessen EAGER nach dem TILE_ART-Bau entstehen
   (sonst kippt check_engineB_gp6 Alpha-Whitelist/__noTint und alle 6
   Canvas-Rigs verschieben sich); Decals brauchen EIGENE Keys (sonst
   werden check_inventory:370 und smoke:5669 still falsch); DIE_TIME/
   Splice duerfen nicht wandern (smoke:206/892/1417/1429 ankern).

## FABLE-VORENTSCHEIDE (bindend fuer die Spec)
V1 Koerper-L-Lesart = E5 (Kontur raus). Skelett-Ziel 118..126.
V2 G-O dL-Regel fuer Gegner: dL 25..90 gegen die LEITKLASSE(N) der
   Wirkort-Karten (>=80 % der Zellen: GY-Gras, Gruft-Stein, Boss-
   Stein); Minderheitsklassen (GY-Weg 11,6 %, Gruft-Wasser) mit
   weichem Kriterium: dL>=10 ODER dE00>=20 ODER Rim>=12 %. Fenster
   damit: Skelett/Hund [95..127], Ghul/Rost [85..127], Warden [95..134].
   Wertleiter neu (>=5 L Abstand): DUNKEL 85..100 (Hund, Rost) /
   MITTEL 105..117 (Ghul, Fussvolk) / HELL 118..127 (Skelett) / GROSS
   128..134 (Warden). Familie+Wertstufe nie beide gleich.
V3 Grufthund = "Knochen und Sehne" (heller, kalt-neutral, DUNKEL-Stufe
   90..100, Erdrampe komplett verlassen, Seelenglut-Auge '8' als
   Merkmal); die C-Variante "schwarz und kalt" ist VERWORFEN (treibt
   ihn aus dem Fenster).
V4 Palette: sanktionierte Erweiterung um bis zu 7 neue Symbol-Toene
   (Kandidaten " $ / < > { } — Kollisionsnachweis Pflicht) + x + f aus
   dem Bestand: Skelett EIGENE Knochenrampe 3 (O/B/b/N bleiben Welt/
   CH-1 — kein Hue-Shift der Bestandsrampe), Ghul-Lumpen 2-3, Hund-
   Kaltrampe 2 + f, Fussvolk aus Bestand. Auflagen wie E3. Sanktion:
   check_gfx6_art SYM-Deckel + gp6_art_self-Rotzahl.
V5 Rost 4/5/6 = ORTSGETRENNT exklusiv (Torwaechter DORF / Rostpanzer
   Gruft+Katakomben; die Karten teilen keine Figuren) — deklariert.
   Warden u/U/X = Bestand, CH-4-Notiz.
V6 FLASH statt Blink: Bauweg A (Teil A 2.4): eager Flash-Canvases in
   main.js NACH tiles-Bau; Grid-Vorverarbeitung k/n->'.' (Umriss
   bleibt schwarz) statt sprite_factory-Aenderung; gezeichnet ZULETZT
   nach den Tint-Masken; warmweiss (>=12 L ueber hellstem Koerperton);
   Dauer Hitstop+1 (3 Treffer / 4 Kill); Spieler: 2-Frame-Flash +
   Unverwundbarkeit als 6-Hz-PULS DER FLASH-MASKE (Alpha 0..0,35), NIE
   Sprite-Alpha (check_engineB org.alpha===1). Sanktion entities/:
   GENAU die drei return-Blinkzeilen enemies.js:620 / boss.js:323-324
   / player.js:228-231. Hund-Aufsteh-Blinken bleibt (Telegraph).
V7 ZWEISTUFIGES STERBEN ohne Zeitverschiebung: DIE_TIME/Splice/Drops/
   Events byte-gleich; Stufe 1 = bestehendes *_die (Namen+Flip-Index
   fest; Art verbessert die Pose), Stufe 2 = Decal mit EIGENEN Keys
   *_decal (ans Ende), komplett in main.js (Frame-Diff am Splice,
   Tint einmal eingefroren, gezeichnet vor den Renderables, Deckel 24,
   aeltestes faellt, buildWorld raeumt). Neue Gates: decals mutieren
   nichts/pushen nie; null Decals nach Kartenwechsel (DORF-Gate!);
   Deckel; Positivkontrolle *_decal jeden Folgeframe. Warden: kein
   Decal. Hund: neues flaches Decal (hound_die reisst 41 %/7 Zeilen).
V8 Masse: Rostpanzer 20x18 (gate-frei, AABB 14x16 bleibt) — Familie
   AUFRECHT-BREIT; Skelett/Hund 16x16/16x12 frei; Ghul 16x20 + Warden
   24x32 unveraendert. AABB nie anfassen.
V9 Fussvolk 16x14: Grids + Material-Tabelle + 4 Varianten-Definition,
   OHNE CREATORS/Spawn/Flip (Slice 7 verdrahtet). Nur Horden-Bogen.
V10 Werkzeuge (Phase 0): figuren_messung um Gegner (figurenVon,
   REQUISITEN, Rim-Kandidat C, Wirkort-Tabellen aller 4 Kampfkarten,
   Gegner-Material-Tabelle, Anker NEU mit E5 — NICHT die C-Zahlen);
   figuren_bogen + Gruft-Stein-Boden + Gegner-Zeilen; NEU tools/
   horden_bogen.mjs (Tafeln A-D, Schalter Rim/Flash/Grau); Vorher-
   Figuren- und Horden-Bogen versioniert in design/referenz/ VOR
   Phase 1; additive Gegner-Masstabelle in check_gfx6_art (GP7CH2).
V11 M3-Schutz: Skelett-Halbseiten-Asymmetrie <=6,5 L (Anker-Regel 1;
   Gate-Grenze 8,2) — Abdunklung selbst ist M3-neutral; Realmessung
   M3/M4/M5 + Bestandskarten-M1 Pflicht nach dem Umbau.
V12 Reihenfolge: Skelett -> Hund -> Rost -> Ghul -> Fussvolk -> Warden
   nachziehen; Engine (Flash+Decal) parallel, VOR der Jury.
V13 NICHT in CH-2: Balance, Tempo, Spawns, KI, Perf-Bake, Lichtsystem-
   Kollaps (CH-4), AABB, God-Mode-Spawn (Fluestergruft hat 15 Gegner).
