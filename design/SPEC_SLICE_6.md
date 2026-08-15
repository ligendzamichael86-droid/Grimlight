# SPEC Slice 6 — "Welt & Seelen" (Rev 2.1, 15.08.2026, Fable)

REV 2.1 = Rev 2 + design/SLICE6_PHASE0.md (BESTANDTEIL DER SPEC;
Phase 0 abgeschlossen, alle Zahlen gebunden). Wo PHASE0 und Rev
1/2 abweichen, gilt PHASE0. Kurzfassung der gebundenen Werte:
M1-DORF-Band 56..69, E1 >= 0,64 %, L<16 <= 2,0 %, ambient 0,28 /
#1a1410 / Radius 40 / fog true; c=#805f3a, G=#8f4c5d
(Fackelkern-Auflage neu: C*ab < 30,5); Boden-L 75,46 gebunden;
TRAUFE-Deckungsmodell; ANCHOR_CLAMP W:0 fuer 9 dorf_*-Keys
(einziger tilemap.js-Eingriff, WORLD); T4-Dachkanten-Gate
(>=85 %/>=90 % transparent) + >=4 px dy-Reserve + Stroh-Zweit-
Highlight (G3); Masstabellen-Wortlaut fix (E8); 4 Quests final
(Docht/Esse/Sarg/Wind, Q4-Truhe = Katakomben-Schatzkammer);
Segel 5 Grids (Budget ~73); Bau-Ablauf: Builder beruehren KEINE
Tests, alle 8 §7.B-Sanktionen in EINEM Sanktions-Schritt nach
dem Bau, EIN Phase-1-Commit nach gruenen Suiten.

Rev 1 + adversarialer Review design/SLICE6_SPEC_REVIEW.md
(11 BLOCKER / 22 MAJOR / ~14 MINOR — ALLE eingearbeitet; die
Fix-Formulierungen der Pruefer sind bindend). Grundlagen unveraendert
(SLICE6_LANDKARTE, GDD.md:38-40 Gramfeld, MASTERPLAN).

BUILD-SPERRE AUFGEHOBEN (15.08.2026, Michael): Hoertest-Stand
"noch nicht — trotzdem weiter" (der Slice-5-Hoertest bleibt als
finale S5-Geraeteabnahme OFFEN); §9.M1 JA, §9.M2 JA. Deklariert:
Musik-Iterationen nach dem Hoertest beruehren NUR audio/songs/*
und Mixer-Konstanten, NIE main.js — der urspruengliche
Kollisionsgrund der Sperre entfaellt damit.

## §0 Eiserne Regeln

0.1 Kanonische Flusstests NULL. sol-Hashes NULL. **Sanktions-Katalog
VOLLSTAENDIG in §7.B** (der Review fand: geo liegt an ZWEI Orten;
Save-v2 kippt VIER konkrete Bestandszeilen; die 5. Karte kippt
check_builderA_slice3:55; die Dach-Waechter matchen NAMEN, nicht
Groessen — alles einzeln sanktioniert, nichts davon "still").
**Der v1-Lade-Beweis laeuft ueber ein ROHES v1-Fixture** (neuer
additiver Boot in check_save), nicht ueber den vom Spiel
geschriebenen Stand (der traegt kuenftig v2).

0.2 entities/npcs.js wie Rev 1 (eigenes Array, KEINE Events,
Rueckgabewerte; smoke:5189 verifiziert unschaedlich). NEU: neue
Module unterliegen auch smoke:5218-5234 (.start/.stop-Zaehlung)
und check_syntax. player/enemies/boss/props/projectiles TABU —
**alle Quest-Trigger leben deshalb in main.js-Beobachtern**
(main.js kennt currentMapKey: Kill-Zaehler JE KARTE sind dort
sauber moeglich; Review B4/M9-Aufloesung).

0.3 Reden = Angriffs-Pegel; **Interaktions-Geometrie KONKRET:
Mitten-Abstand <= 22 px UND Blickrichtungs-Skalarprodukt > 0**
(reach 12 scheitert am 15-px-Mindest-Mittenabstand, Review B5).
Zusaetzlich TRANK-Schlucker im Dialog (Muster attackSwallow).

0.4 Text-Sonden-Regel wie Rev 1 (vom Pruefer als vollstaendig
bestaetigt). 0.5 Palette: c/G-Umwidmung; **Saettigungs-Deckel NUR
fuer die zwei NEUEN Werte: S <= 0,55** (die Rev-1-Formel haette
Bestandsgras verboten, Review-B1); Auflagen der Umwidmung (Holz-
Rampen-Monotonie, Rost-Glaettung) rechnet Phase 0. 0.6-0.8 wie
Rev 1. 0.9 **song_dorf wird als STUB im selben Commit wie
map_dorf.js registriert** (Peak-Gates gelten ab sofort; Betreten-
Crash sonst); Komposition iteriert danach unabhaengig.

## §1 ABNAHME

A1 wie Rev 1 PLUS: v2-Stand OHNE neue Felder laedt (Defaults auf
BEIDEN Pfaden — haelt probe_s4_engine gruen, Review M1);
geladene Quest-Felder feldweise identisch (ladeSpielstand-Gate);
Shop-Geometrie-Gate (Tap-Rechtecke >= 6 mm, additiv — die Zusage
war vorher unpruefbar); Dialog-State: A/B/W-Zonen unsichtbar +
Trank geschluckt; NPC-Wander an der Leine (<= 24 px um Anker;
Math.random im Wander ist erlaubt wie bei enemies und von den
Determinismus-Gates AUSGENOMMEN — deklariert).
A2 wie Rev 1. A3 wie Rev 1; **die Phase-0-Eichung bindet die
Boden-MISCHUNG des Generators als Eingabe** (das Band haengt daran,
Review M14). **Herdfeuer ist PFLICHT-torchChar der DORF-Legende**
(das eine rote Licht-Gate, Review M3-Sys). A4 wie Rev 1.

## §2 NPCs & DIALOG

2.1 wie Rev 1; Spawn-Konvention EXPLIZIT: npcSpawns tragen das
AABB-ZENTRUM in Weltpixeln (wie enemies; Beleg maps.js:4-5);
Wander mit Leine (Anker + Radius 24, nur freie Kacheln,
Durchdringung Spieler/NPC ist akzeptiert und deklariert).

2.2 Dialog-State wie Rev 1, ABER: **Box y 76..128** (UNTER dem HUD,
UEBER allen Touch-Zonen — die Rev-1-Lage 120..172 lag deckungs-
gleich auf A/B, Review M2 beider Linsen); im State 'dialog'
bekommen A/B/W `visible:false` (Muster pause.visible, eine
main.js-Stelle); Options-Zonen im OBEREN Boxdrittel (nie im
System-Gestenbereich); **audioGeduckt bleibt false** ("der Dialog
ist Teil der Welt, kein Menue" — deklariert); systemPause im
Dialog: speichert, pausiert nicht (Praezedenz inventory,
deklariert). Zustands-Stellenliste komplett: 1750/1956/1978,
render 2445-2470, enterState 1235-1251, touch-visible 1663,
HUD-Spiegel 1668, pausiere-Guard 1362.

2.3 wie Rev 1 + §0.3-Geometrie.

## §3 HAENDLER (Oekonomie NEU GERECHNET, Review M6/M7/M8)

3.1 Bran: verkauft je Slot EIN Fest-Angebot je Dorfbesuch
(Basispreise 60/90/120 nach Slot; rare +50 %), Traenke 15 (Deckel:
bei maxPotions==3 verweigert der Kauf mit Hinweis — Gold darf nie
folgenlos verschwinden, Review m3-Tests), Herzcontainer 250
(EINMALIG). **Taschen-Erweiterung GESTRICHEN** (Inventar-UI kann
nur 7 Zeilen, Panel ist TABU — eigene spaetere Etappe mit
UI-Umbau; Review M3-Tests). Ankauf: Basis 12 / rare 28 (Formel im
Modul; Rueckverkauf des Angebots = bewusster Verlust). Hedda:
Heilung 10 Gold (Dauer-Senke statt gratis, Review M8), Traenke 15.
Mile: 2,5x auf den Bran-Basispreis des gewuerfelten Slots.
**"Dorfbesuch" DEFINIERT:** buildWorld(DORF) via Portal (carry) —
Zaehler runFlags.dorfBesuche (NEUES v2-Feld, §5); Portal-Pendeln
ist moeglich und als akzeptierter Preis deklariert (kostet
Laufweg; Heilung kostet jetzt Gold). Erreichbarkeit nachgerechnet:
Erstdurchlauf ~137 Gold deckt Traenke+1 Slot-Angebot; Herzcontainer
= ~3 Katakomben-Runden — Farming ist Option, nicht Pflicht.

3.2 shop_ui wie Rev 1 + A1-Geometrie-Gate.

## §4 QUESTS (Eigentuemer-sauber, Review B4/M9-M11)

quest.js pur (Zustandsmaschine); ALLE Trigger als main.js-
Beobachter (Kill-Zaehler je Karte via currentMapKey beim
enemy_died-Konsum; Truhen/Boss aus runFlags; Dialog-Abschluss aus
dialog.js-Rueckgabe). Die 3-5 Quests werden in Phase 0 FINAL
gegen die Trigger-Liste geschnitten — KEINE Quest darf props.js/
portalBlocked/einmalige Drops brauchen (zwei Landkarte-Skizzen
fielen genau daran, Review B4) und KEINE kann durch Tod unloesbar
werden (Respawn laesst runFlags stehen — Semantik deklariert).

## §5 SAVE v2

Wie Rev 1 PLUS: neue Felder {npcFlags, quests, gekauft,
dorfBesuche} — **auf BEIDEN Pfaden optional mit Default** (v2 ohne
sie laedt; Review M1); die DREI Kopierstellen sind Teil des
Auftrags: save.js + resetRun (main.js:1205-1212, leert quests/
npcFlags/gekauft/dorfBesuche NICHT — Moment: resetRun LEERT
Run-gebundene Felder [quests ja, dorfBesuche ja]; npcFlags/gekauft
sind Run-gebunden ebenfalls -> ALLE vier werden geleert,
deklariert) + ladeSpielstand (main.js:1219-1229, kopiert alle
vier feldweise; A1-Gate). Sanktionen dafuer in §7.B.

## §6 GRAMFELD

6.1 wie Rev 1 PLUS: skeletonSpawns/ghoulSpawns als LEERE Arrays
GEFUEHRT (main.js mappt ungeguardet, Review m1); Herdfeuer als
torchChar (A3); **Haeuser sind NICHT betretbar** (Tueren sind
Zustands-Deko zu/offen; die Dach-Transparenz greift nur beim
Vorbeilaufen am Dachrand — der "gratis"-Claim ist entsprechend
ehrlich deklariert, Review M4/M5-Sys); Dorfglocken-Joch und
Marktsegel-Masse stehen MIT in der §7.B-Mustersanktion; Segel
MIT swayPoses kostet 8 Grids — Budget auf ~76 Grids korrigiert
(Review M5-Tests).

6.2 **Portal: GRAVEYARD-WESTTOR auf der Wegkachel (1,12)** —
probenbelegte Empfehlung der Landkarte (Spawn tc(3,12) liest
"du kommst aus dem Dorf"); Torbogen als Over-Deko; DORF-Osttor.
GDDs "oben das Dorf" meint die VERTIKALE Erzaehlung (Dorf ueber
den Katakomben), nicht die Himmelsrichtung — deklariert.
geo-Sanktion §9.M2 umfasst BEIDE Hash-Orte (smoke:2150 + 3572).
Respawn im DORF = Eintritts-Spawn; der Todespfad (Gold-Halbierung,
lastSpawn) bleibt UNBERUEHRT (Review m4).

6.3/6.4 wie Rev 1 (Budget ~76).

## §7 TEST-KATALOG (abschliessend)

A. ADDITIV (S6-§7F): alle A1-Gates inkl. Shop-Geometrie, Dialog-
Touch-Ausblendung, v1-FIXTURE-Boot, v2-Default-Boot, DORF-Zeile
in §36, gegnerfrei, Kill-Zaehler.
B. SANKTIONIERT (je Marker S6-§7B, git-diff-Beleg, NUR nach
§9.M2-Freigabe wo geo betroffen): (1) smoke:2150 GRAVEYARD.geo;
(2) smoke:3571-3572 geo-Zweitort; (3) smoke:4131 SAVE_KEY/VERSION
-> v2; (4) smoke:4191 kaputt-Fixture v:2 -> v:3;
(5) check_save:235 s1.v===2; (6) check_save:335-341 Fixture v:3;
(7) check_builderA_slice3:55 MAPS 4 -> 5; (8) Masstabellen-
Musterzeilen in check_gfx6_art:122-135 UND smoke:1732-1747
(dorf_dach/dorf_bake/dorf_segel/dorf_glocke-Muster mit exakten
Massen; Gegen-Gate smoke:1756-1759 bleibt gruen).
C. Verboten: alles andere (insb. Inventar-Panel, Pause-Geometrie,
Flusstests). Deklariert: .tmp/check_world_slice1 ist am HEAD
BEREITS ROT (toter Waechter, nicht "reparieren"!).

## §8 BUILD-TOPOLOGIE

Wie Rev 1; Phase 0 zusaetzlich: Quest-Finalschnitt gegen die
Trigger-Liste, Oekonomie-Simulationstabelle, c/G-Auflagen-Rechnung,
Boden-Mischungs-Bindung. song_dorf-Stub im WORLD-Commit (§0.9).

## §9 DEKLARATIONEN + MICHAEL-ENTSCHEIDE

§9.M1 [MICHAEL] Art-Direction-Aufweichung — unveraendert (mit dem
korrigierten S<=0,55-Deckel nur fuer Neu-Toene).
**ENTSCHIEDEN 15.08.2026: JA** (warm ist im Dorf das MATERIAL,
warm-leuchtend bleibt nur Feuer).
§9.M2 [MICHAEL] geo-Sanktion — Umfang praezisiert: die ZWEI
Hash-Orte fuer das EINE neue Westtor-Portal (1,12).
**ENTSCHIEDEN 15.08.2026: JA** (Freigabe fuer GENAU diese zwei
Stellen smoke:2150 + smoke:3571-3572, nichts weiter).

Deklariert (Fable, neu): Tasche gestrichen (spaetere Etappe);
Hedda 10 Gold; Dorfbesuch-Definition + Pendel-Akzeptanz; Haeuser
nicht betretbar; Dach-Transparenz nur am Rand; dialog duckt nicht;
systemPause im Dialog speichert ohne Pause; NPC-Durchdringung;
Wander-RNG von Determinismus-Gates ausgenommen; resetRun leert
alle vier neuen Felder; Respawn=Eintritts-Spawn; Segel 8 Grids;
check_world_slice1 tot; Portalort West (GDD-"oben" = vertikal).
