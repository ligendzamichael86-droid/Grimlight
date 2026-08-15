# Slice 6 Phase 0 — Eichung, Finalschnitte, Generator-Entwuerfe

Stand 15.08.2026. Ergaenzt SPEC_SLICE_6.md Rev 2 (92d85eb); die hier
eingefrorenen Zahlen werden mit Abschluss von Phase 0 als Rev 2.1
bindend. Michael-Entscheide liegen vor: §9.M1 JA, §9.M2 JA.

## 1. QUEST-FINALSCHNITT (Fable, BINDEND)

Erlaubte Trigger (SPEC §4, abschliessend): (a) Kill-Zaehler je Karte
+ Sorte via main.js-Beobachter (AUDIO_STATE-WeakMap sieht den
die-Uebergang INKLUSIVE e.kind — Landkarte A 4.2), (b) runFlags
(bossDead, openedChests), (c) Dialog-Abschluss aus dialog.js-
Rueckgabe. props.js / portalBlocked / neue content-Werte: TABU.
Code-Fakten geprueft 15.08.: kinds heissen 'skeleton'/'ghoul'/
'hound'/'rust'; GRAVEYARD fuehrt 6 skeleton; CATACOMBS fuehrt
genau 3 rust (maps.js:622-699).

**Q1 "Der letzte Docht" (Hedda, Tutorial).** Toete 5 Skelette auf
dem FRIEDHOF. Trigger (a): kind 'skeleton', Karte GRAVEYARD.
Belohnung: 1 Trank + 15 Gold; bei vollem Trank-Beutel stattdessen
+10 Gold (deklariert: Belohnung verpufft nie folgenlos).

**Q2 "Glut fuer die Esse" (Bran).** Toete die 3 Rostpanzer in den
KATAKOMBEN. Trigger (a): kind 'rust', Karte CATACOMBS (genau 3
vorhanden; Gegner respawnen je Betreten — durch Tod unloesbar ist
ausgeschlossen). Belohnung: 10 Gold + Brans Slot-Angebote wuerfeln
ab jetzt MIT Selten-Chance (vorher nie; shop_ui liest das
Quest-Flag — ERSETZT die gekippte Hammer-Truhen-Skizze, Review B4).

**Q3 "Der versiegelte Sarg" (Corm, Hauptfaden).** Corm benennt den
Grabwaechter. Stufen: aktiv (Dialog) -> erfuellt
(runFlags.bossDead, Trigger (b)) -> belohnt (Dialog bei Corm,
40 Gold). NULL neue Mechanik; gibt dem Bestand die Stimme.

**Q4 "Was der Wind mitbringt" (Kette).** Sprich mit Bran, Hedda
und dem Torwaechter (beliebige Reihenfolge; npcFlags, Trigger (c));
der Dritte verraet die vergessene Friedhof-Truhe (BESTEHENDE Truhe,
reiner Hinweistext — kein neuer content-Wert). Belohnung: 10 Gold.
(ERSETZT die gekippte Nachtwache/portalBlocked-Skizze, Review B4.)

Vier Quests (Soll 3-5). Gestrichen: "Brans Werkzeug" (props.js),
"Die Nachtwache" (portalBlocked). Quest-Gold gesamt 75.
Deklariert: Respawn laesst runFlags stehen — Zaehler ueberleben
den Tod; resetRun leert alle Quest-Felder (SPEC §5).

## 2. OEKONOMIE-VORRECHNUNG (Fable; Agent-Pruefung PFLICHT)

Einnahmen Erstdurchlauf: ~137 (Landkarte 3.1, gemessen) + 75
Quest-Gold = ~212. Katakomben-Runde ~58 in 2-3 min.
Ausgaben-Katalog (SPEC §3.1): Trank 15, Slot-Angebot 60/90/120
(rare +50 %), Herzcontainer 250 einmalig, Hedda-Heilung 10,
Mile 2,5x Basis, Ankauf 12/28.
Prognose: Erstdurchlauf deckt 2 Traenke + Heilungen + EIN
90er-Angebot (~140); Herzcontainer kostet ~1 Katakomben-Runde
extra. Farming bleibt Option, nicht Pflicht. -> Bestaetigung/
Korrektur durch P0-OEKONOMIE-Agent gegen den echten Code.

## 3. OFFENE PHASE-0-PAKETE (Opus, parallel)

- P0-GEN: gen_dorf_layout + gen_dorf_dach Entwuerfe (NUR .tmp/
  slice6_p0/), Boden-Pool n=9 aus der Erde-Rampe MIT bindender
  Mischung (Eingabe der Eichung, Review M14), freie
  Legendenzeichen, Deckungsbeweis, Beweiszelle Spieler-unter-Dach.
- P0-FARBE: Umwidmungs-Rechner c/G (Soll-Hex, Holz-Rampen-
  Monotonie, Rost-Glaettung, S<=0,55, unter Fackelkern) + Zensus-
  Nachweis: kein Bestandsgrid kippt.
- P0-OEKONOMIE: §2 gegen den Code nachrechnen + Quest-Trigger-
  Machbarkeit Zeile fuer Zeile belegen.
- P0-EICHUNG (NACH P0-GEN): M1-DORF-Band simulieren (Muster
  gp6_p0b_e1_sim/s6b_belichtung_dorf) mit der GEBUNDENEN
  Boden-Mischung; Vorschlag ambient 0,28 / Tint #1a1410, Band
  ~54..66 — exakte Zahlen frieren hier ein.

## 4. ERGEBNISSE (werden nachgetragen -> Rev 2.1)

- [ ] Eichung: Band = __ .. __, E1-Schwelle = __, L<16-Deckel = __
- [ ] c = #______, G = #______ (Auflagen nachgerechnet)
- [ ] Boden-Mischung: __ (gebunden)
- [ ] Oekonomie: bestaetigt / korrigiert: __
