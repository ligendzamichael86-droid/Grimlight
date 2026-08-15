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
dem FRIEDHOF. Trigger (a): kind 'skeleton', Karte GRAVEYARD; der
Zaehler zaehlt NUR Kills nach Quest-Annahme (deklariert).
Belohnung PRAEZISE (Pruefer-Befund 6): 1 Trank + 15 Gold; ist der
Beutel voll, ersetzen 10 Gold den Trank — Auszahlung dann 25 Gold
gesamt, nie weniger. Q1 ist zugleich die Antwort auf Pruefer-
Befund 5 (Erstbesuchs-Kaufkraft ~45 Gold): die Docht-Schleife
(annehmen -> 5 Kills -> zurueck) hebt den Erstbesuch auf ~65-70 —
Brans 60er-Angebot ist damit IM ersten Dorfbesuch verdienbar,
nicht geschenkt. Preise 60/90/120 bleiben (deklariert: erster
Besuch = Schaufenster + Trank + Quests; kaufen nach der Schleife).

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
der Dritte verraet die vergessene GOLD-TRUHE IN DER SCHATZKAMMER
DER KATAKOMBEN (BESTEHENDE Truhe tc(36,15), maps.js:711, hinter
Ghul-Wachen + Rostpanzer; reiner Hinweistext — kein neuer
content-Wert). KORRIGIERT nach Pruefer-Befund 3: der FRIEDHOF hat
NULL Truhen (maps.js:635-641 nur vase/urn) — die Rev-2-Formulierung
"Friedhof-Truhe" war am Code nicht einloesbar. Belohnung: 10 Gold.
(ERSETZT die gekippte Nachtwache/portalBlocked-Skizze, Review B4.)

Vier Quests (Soll 3-5). Gestrichen: "Brans Werkzeug" (props.js),
"Die Nachtwache" (portalBlocked). Quest-Gold gesamt 75.
Deklariert: Respawn laesst runFlags stehen — Zaehler ueberleben
den Tod; resetRun leert alle Quest-Felder (SPEC §5).

## 2. OEKONOMIE — GEPRUEFT UND KORRIGIERT (P0-OEKONOMIE, 15.08.)

Der Pruefer fand 6 Befunde gegen die Fable-Vorrechnung; die Zahlen
hier ERSETZEN sie (Rechenweg: .tmp/slice6_p0/oekonomie_sim.mjs,
deterministische Erwartungswerte aus den echten Modul-Importen).

Einnahmen: Erstdurchlauf 137,2 als UNTERGRENZE; realistisch
137..187 (drei vorher fehlende Stroeme: Trank-Ueberlauf +2 Gold
[8,6 Trank-Drops erwartet gegen MAX_POTIONS 3 — Ueberlauf ist der
NORMALFALL], Gear-Ankauf ~+26 Erstdurchlauf / +37,5 je Farmrunde,
Boss-Adds +4..12). Mit Quest-Gold 75: ~212..262 NACH dem Boss.
**Farm-Runde Katakomben = 47,8, NICHT 58** (Befund 1: die
Gold-Truhe filtert runFlags.openedChests dauerhaft weg,
main.js:1134-1137; 57,8 gilt nur beim Erstbetreten).
**Kaufkraft ist eine SEQUENZ, kein Kassensturz** (Befund 5): beim
Erstbesuch im Dorf liegen ~45,5 vor — Aufloesung ueber die
Q1-Schleife (siehe §1). Nach Katakomben ~113, vor dem Boss ~154,
nach Boss+Q3 ~212 (Untergrenzen).
**Herzcontainer:** nach einem 140er-Ausgabenpaket ~3-4 Farmrunden
(pessimistisch mit 1 Tod: 4) — DECKT sich mit SPEC §3.1 "~3
Runden"; die PHASE0-Behauptung "~1 Runde extra" war falsch
(Befund 2). Mit Gear-Ankauf sinkt es auf ~2 Runden. Farming
bleibt Option, nicht Pflicht — bestaetigt.
Q2-Fairness bestaetigt: rust ist Frontkegel-Block ±60°
(enemies.js:250-257, Schwert UND Bumerang), hp 5, langsamster
Gegner, Blick dreht max. alle 0,4 s — Flankieren toetet normal.
Deklariert (Nebenbefund, NICHT Slice-6-Scope): die Siegtruhe ist
von openedChests ausgenommen und respawnt je BOSS_KAMMER-Betreten
inkl. Victory-Screen (main.js:1810/1139-1141) — bekanntes
Bestands-Konsistenzloch, als Farm unpraktisch, bleibt liegen.

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
- [x] Boden-Mischung GEBUNDEN (P0-GEN, .tmp/slice6_p0/
      dorf_boden_pool.json): Palette-L-Mittel der Bodenflaeche
      **75,46** ueber 260 608 Texel; Flaechen-Mix der 1022
      Bodenkacheln: 78,18 % Lehm-Pool n=9 (L-Mittel 73,46) /
      14,78 % Weg ausgetreten n=5 (91,16) / 4,01 % Lehm-Detail
      n=5 (61,22) / 2,64 % Weg ueberwuchert n=7 (68,51 — traegt
      die EINZIGEN Gruentoene des Dorfs). Layout: 44x28, Spawn
      tc(39,15) am Osttor, Portal tileRect(42,14,1,2) ->
      GRAVEYARD tc(3,12); Erreichbarkeit 1022/1022, 0 Inseln;
      56 neue Tile-Grids (25 Blaupausen liegen bei), 15 Bestand.

## 5. GEN-BEFUNDE — FABLE-ENTSCHEIDE (15.08., bindend fuer Rev 2.1)

E1 **Anker-Versatz (Blocker-Kandidat):** tilemap.js:487-528 gibt
jedem Over-Span hash-Versatz dx (Clamp ANCHOR_CLAMP, Default 14)
und dy ±4 ohne Clamp — gemessen bis dx +14 (Kate I) / -13
(Osttor). ENTSCHEID: die 9 dorf_*-Over-Keys kommen MIT W:0 in
ANCHOR_CLAMP (rein additive Tabellenzeilen, kein Bestands-Key,
kein Logik-Edit; Bestandskarten rendern byte-gleich, da dorf_*
dort nie vorkommt — Op-Stream-Hashes unberuehrt). Besitz: WORLD-
Agent (einziger tilemap.js-Eingriff, exakt diese Tabellenzeilen).
dy bleibt: ART-Auflage ≥4 px senkrechte Transparenz-Reserve am
Dachgrid-Rand.
E2 **Deckungsmodell TRAUFE ist bindend** (Wandblock span_w x
(span_h-1), oberste Span-Zeile = begehbare Traufe; kanonische
Beweiszelle (12,7) hinter der Schmiede). Die Rev-2-Formulierung
"vollstaendig ueber Wandkacheln" war unpraezise — das
--vollwand-Gegenmodell liefert 0 Beweiszellen und widersPRICHT
§6.1; verworfen.
E3 **ART-Auflage Dach-Unterkante** (aus TRAUFE): unteres Grid-Ende
ueberwiegend transparent, Gate T4: ≥85 % bei 48x32, ≥90 % bei
64x48 (Blaupausen erfuellen es) — sonst verdeckt das Dach die
Wandfront samt Tuer.
E4 **Segel = 5 Grids** (swayPoses-Folge [0,+1,+2,+1,0,-1,-2,-1]
hat 8 Eintraege ueber 5 distinkte Posen) — Budget sinkt ~76 -> ~73.
E5 **torchChars = ['F','E'] BLEIBT** (Herdfeuer Pflicht per A3,
Esse als zweites Warmlicht wie Landkarte B §5.3 — Tristram hatte
Schmiede UND Herd; der "ein einziger Lichtpunkt"-Satz in §5.1 ist
Referenz-Analyse, keine Regel). Die Eichung rechnet MIT beiden.
E6 Landkarte-Saetze "Kapelle zeigt zum Friedhofstor"/"Speicher,
dahinter der Weg zum Tor" sind durch Rev 2 §6.2 (OSTTOR)
ueberholt — Kapelle bleibt Nord-Landmarke, Weg laeuft oestlich.
Kein Handlungsbedarf, deklariert.
E7 **Legenden-Mnemonik hat Vorrang vor GY-Konvention:** T/t =
Tuer zu/offen, Y = toter Stamm (Legenden sind je Karte eigene
Namespaces; GY-Belegung ist nicht bindend). Deklariert; ebenso
Karten-Legende 'G' (Glocken-Joch) vs. Paletten-Ton 'G'
(NPC-Stoff) — getrennte Namespaces, kein Konflikt.
E8 **Masstabellen-Patch fix:** die 6 Musterzeilen aus dem
GEN-Report (dorf_dach_(a|b), dorf_dach_(c|d|tor), dorf_bake_gross
64x32, dorf_bake_klein, dorf_segel(_[rl][12])?, dorf_glocke)
gehen WOERTLICH an beide sanktionierte Orte (§7.B(8)); Gegen-Gate
T2b nachgerechnet gruen (kein Bestands-Key umgeleitet, KEINE
fuenfte Musterzeile — der Torbogen laeuft als dorf_dach_tor).
E9 Der Dach-Zensus verschiebt sich, sobald P0-FARBE 'c' setzt
(Blaupausen nutzen bewusst kein c/G) — die EICHUNG wartet deshalb
auf P0-FARBE und rechnet mit dem finalen c-Wert.
- [x] Oekonomie: KORRIGIERT (6 Befunde, siehe §2; Q4-Truhe ->
      Katakomben-Schatzkammer, Farm-Rate 47,8, Herz ~3-4 Runden,
      Q1-Klausel praezisiert, Erstbesuchs-Kaufkraft ueber
      Q1-Schleife geloest)
