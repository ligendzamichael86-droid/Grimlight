# SPEC GP7-CH-1 — "Die Menschen bekommen Kleider und Gesichter" (Rev 1, 16.08.2026, Fable)

Grundlage: GP7CH_LANDKARTE.md (V1-V6 bindend) + Teile A/B/C
(Datei:Zeile-Belege bindend). Deliverable: Held + 5 NPCs als
komplett ueberarbeitete Standbild-Familie (alle 32 bestehenden
Menschen-Grids: 17 player_* + 15 npc_*; MASSE UNVERAENDERT 16x24,
KEINE neuen SPRITES-Keys, KEINE neuen Animationszustaende) + die
2 Tuer-Span-Grids (V4) + Paletten-Namespace (V1) — sichtbar auf
Michaels Geraet als "man erkennt aus der Entfernung, wer wer ist".
Spieldynamik: NULL Beruehrung (Michael 16.08.).

## §0 Eiserne Regeln

0.1 KEIN Code-Edit in player/npcs/enemies/boss/main/hud (reiner
Art-Pass; einzige Nicht-Art-Edits: map_dorf.js-Legende T/t fuer
V4 + die 2 Sanktionsstellen §6). Flip-Liste UNANGETASTET (keine
neuen Keys noetig — Teil B: Anhaengen waere safe, aber CH-1
braucht keins). 0.2 Suiten-Kanon wie Slice 6 (gruen = 825er-Smoke
x3, Flusstests 25/25/33, check_gfx6_art, check_save 63, probe_god,
probe_s4_engine, builderA 106; deklariert-tot/abgeloest-Liste
unveraendert inkl. check_gp6_art_self 5 Rot). 0.3 M5-Vorsicht:
Fussbreiten-Aenderungen gegen smoke:3336-3392 (Margen 3-10 Texel,
Negativkontrolle braucht >=1 Durchfaller ohne dy=-1). 0.4 M3/M4-
NACHZUG PFLICHT: shot_gfx6.py M3 (dWarm>=18, Halb>=6,
ausgebrannt==0) + M4 messen die HEUTIGEN player_down_0-Pixel —
nach dem Umbau Realmessung wiederholen, Schwellen FEST. skeleton_0
wird in CH-1 NICHT angefasst (Gegner = CH-2). 0.5 Kein
measureText/strokeRect/translate; Palettenzeichen nur aus PALETTE
(smoke:81-93 + Laufzeit-Wurf sprite_factory:17-19).

## §1 PHASE 0 — WERKZEUGE + VORBAU (je eigener Commit)

P0.a V2-SPLIT: art/sprites_figuren.js (SPRITES) +
art/sprites_tiles.js (TILE_ART), sprites.js wird FASSADE
(Re-Export, Schluessel-Reihenfolge BYTE-STABIL — die 6 Canvas-Rigs
aus Teil B haengen daran). Beweis: alle Suiten gruen, git diff
zeigt reine Verschiebung.
P0.b V1-PALETTE: +8 Symbol-Toene fuer Charakter-Stoffe. Ein
RECHNER (Muster umwidmung_rechner.mjs) bestimmt die Hex-Werte:
(1) G-Stofframpe komplett: G_dunkel ~L65 / G #8f4c5d / G_hell
~L130, Hue-Shift >=20 Grad ueber die Rampe (Schatten kuehler,
Licht waermer-entsaettigt); (2) WOLLE-dunkel-Rampe (Corm) 3
Stufen; (3) 2 Reserve-Toene fuer Leinen-warm/Akzent. Auflagen:
C*ab < 30,5 (Fackelkern-Regel), dE00 >= 10 zu Helden-Violett
u/U/X/Z UND zu allen Gebaeude-Leitrampen (Holz q/j/Q/c/J, Stein
g/s/S, Rost 4/5/6, Erde z/p/v/M/P/V), kein L-Konflikt mit dem
M1-Boden-Band. Zeichen-Satz: 8 Symbole, die in keinem Grid/keiner
Legende vorkommen (Rechner beweist Kollisionfreiheit gegen ALLE
rows/Grids). Sanktion §6.1.
P0.c FIGUREN-BOGEN (tools/figuren_bogen.py o. .mjs): rendert ALLE
Figuren x alle Frames auf 3 Boeden (GRAVEYARD-Gras, DORF-Lehm,
DORF-Weg) bei 1x und 6x nebeneinander + Squint-Spalte (50 %
runterskaliert). Ausgabe .tmp/screenshots/figuren_bogen_*.png.
Das ist das Jury- und Michael-Instrument aller CH-Runden.
P0.d MESSWERKZEUG (.tmp/gp7ch/figuren_messung.mjs, deterministisch):
misst je Figur T1-T8 automatisch: paarweise Profilaehnlichkeit,
Umriss-Anteil + Umrisstoene, Spiegelgleichheit, Hue-Spanne je
Rampe, Stufen/Schrittverhaeltnis/Dominanzanteil je Materialflaeche
>=40 Texel, dL gegen die Leitkacheln ALLER begehbaren Boeden,
Solitaer-Texel, Rim-Anteil der Kontur. Ausgabe JSON. Die
CH-1-Gates (§3) laufen NUR ueber dieses Werkzeug (eine Quelle).

## §2 PHASE 1 — ART (ein Opus-Agent, exklusiv sprites_figuren.js
+ palette.js-Werte aus P0.b + die 2 Tuer-Grids in sprites_tiles.js
+ map_dorf.js-Legende T/t)

Steckbriefe aus Teil C §2 sind BINDEND (Held: Kapuze aussermittig,
Umhangsaum, Klinge bricht Silhouette, Gesicht 3 Merkmale; Bran:
breiteste schiefste Schulterlinie, verlaesst Holz -> versengtes
Leder auf Rost-Basis + eigener Stoff; Hedda: Kegel uebertreiben,
Stock diagonal, G-Rampe; Corm: schmal+hoch, Buch bricht Brustlinie,
Wolle-dunkel + Krapp-Stola; Mile: Kopf gross, Tasche auf EINER
Huefte, raus aus Leinen-Knochen-Naehe; Torwaechter: Speer geneigt,
Haube mit Stahl-Stufe C/i). Talk-Frames werden ECHT (>=6 %
Texel-Diff MIT Silhouettenaenderung: Mund, Kopfneigung, Hand).
Tueren: dorf_tuer_zu/offen als 16x32-Span-Paar neu (V4),
Unterkante = heutige Tuerzeile, obere Haelfte in die Wandflaeche;
map_dorf-Legende T/t bekommt span [1,2] + neue Art-Keys
(TILE_ART-Anhang ANS ENDE).

## §3 MESSZIELE (eingefroren; Quelle = P0.d; ALLE 6 Menschen)

M-CH1: Umriss <= 25 % UND >= 3 Umrisstoene | Spiegelgleichheit
<= 65 % | Profilaehnlichkeit PAARWEISE <= 70 | Hue-Spanne >= 20
Grad je 3-Stufen-Rampe (>= 40 bei 4) | jede Materialflaeche >= 40
Texel: >= 3 Stufen, Schrittverhaeltnis <= 1,6, kein Einzelton
> 55 % | Rim >= 12 % der Kontur, Ton je Figur definiert | dL
25..90 gegen JEDE begehbare Leitkachel (inkl. Weg 91!) |
Solitaer-Texel <= 8 % | SPERRLISTE: dominante Figur-Rampe !=
dominante Rampe der Standkacheln ihres Wirkorts (Bran!=Holz,
Corm!=g/s, Grufthund-Regel erst CH-2). Positiv-/Negativkontrolle:
P0.d gegen die ALTEN Grids muss die IST-Werte aus Teil A/C
reproduzieren (z. B. Held-Umriss 35 %, Corm-Symmetrie 87 %) —
sonst misst das Werkzeug falsch.

## §4 BESTANDS-SCHUTZ

Alle §0.2-Suiten gruen. M3/M4-Realproof NEU gruen (§0.4). M5 gruen.
Tuer-Umbau: DORF-§36-Golden byte-gleich (sol/geo unberuehrt —
Over-Span ist rein visuell), Beweis im Report. Figuren-Bogen
VORHER/NACHHER archiviert. KEINE Aenderung an skeleton/ghoul/
hound/rust/warden/npc_blase/Item-/HUD-Grids.

## §5 JURY + ABNAHME

Figuren-Bogen-Jury: 2 Juroren (direkte Agenten, PNG), Linsen
Silhouette/Lesbarkeit und Material/Licht; Skala wie gehabt;
Vergleich VORHER/NACHHER-Bogen. Danach frische APK auf 8125 und
MICHAEL-Geraetefrage (finale Instanz): "Lauf durch Gramfeld —
erkennst du aus der Entfernung, wer wer ist? Sehen die Menschen
GUT aus?" Budget: >= 2 Iterationsrunden nach Michaels Rezepten
sind Teil von CH-1, keine neue Etappe.

## §6 SANKTIONS-KATALOG (abschliessend; Marker GP7CH, git-diff-Beleg)

(1) check_gfx6_art.mjs:74-79: Symbol-Satz-Deckel '=+*' -> '=+*'
plus die 8 neuen V1-Zeichen (alnum bleibt 61; Wortlaut minimal).
(2) Masstabellen +1 Musterzeile 16x32 fuer das Tuer-Span-Paar an
BEIDEN Orten (smoke ~1744-1777, check_gfx6_art ~128-172);
Gegen-Gate "alle Klassen belegt" darf NICHT erweitert werden
muessen — pruefen, sonst melden. (3) NICHTS SONST: kein Flusstest,
kein Golden, keine weitere Zeile. Erwartet-kippende Alt-Waechter
(bereits tot/abgeloest, Teil B §5): keine Aktion.

## §7 BUILD-TOPOLOGIE

Phase 0 (P0.a-d, sequentiell, je Commit) -> Phase 1 ART (ein
Agent) -> SANKTION (§6, eigener Schritt, Builder ruehren keine
Tests an) -> PRUEFUNG (V-TESTS Suiten+Messziele+M3/M4-Proof;
V-SPEC adversarial gegen diese Spec) -> Fix-Schleife max 2 ->
EIN CH-1-Commit -> Jury -> APK -> Michael. Alle Ausfuehrenden
Opus; Werkzeuge deterministisch; Exit-Codes nie glauben.

## §8 DEKLARATIONEN

Talk-/Idle-FRAMEZAHLEN bleiben (2+1) — mehr Bewegung ist CH-3.
Gegner unveraendert (CH-2). Flash-statt-Blink/Sterbe-Umbau CH-2.
Das V3-Ausstiegs-Gate (24x32) wird NACH der CH-1-Jury ausgewertet,
nicht vorher diskutiert. Der Grufthund-dL-Skandal (Teil C T8)
wartet auf CH-2 — deklariert, nicht vergessen.
