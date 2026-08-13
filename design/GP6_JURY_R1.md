# GP6 Jury-Runde 1 (13.08.2026) — Konsolidierung (Fable)

Noten (INFORMATIV): H 7,0 · K 7,4 · M 7,5 → **Median 7,4** (GP5: 7,0).
Alle drei Juroren bestätigen die ROHMESSUNGEN als echt (M hat alle
fünf M1-Szenen auf die letzte Stelle deckungsgleich nachgemessen und
alle Suiten selbst gefahren). Die Mess-Validierungen sind überwiegend
VALIDE; die Prio-0-Befunde richten sich gegen ZWEI Bild-Defekte
(Build) und ZWEI Prozess-Entscheide (Hauptloop). Vollständige
Berichte: Task-Ausgaben der Session (Auszüge unten wörtlich).

## PRIO-0 (bindend für Runde 2)

### P0-A "Spieler verschwindet unter XL-Kronen" (Juror K)
> "von 275 Silhouetten-Texeln (Box x177..191, y73..97) sind unter der
> Krone **0 sichtbar** […] CLAUDE.md fordert 'Layering (Kronen über
> dem Spieler)', also Überlagerung, nicht Auslöschung. […] M4 belohnt
> genau das: der Gate-Optimalwert ist der Defekt."
> Rezept K: "Liegt der Fußpunkt des Spielers im Fußabdruck einer
> Over-Krone, die betroffenen Kronen-Draws mit ctx.globalAlpha ≈ 0,55
> zeichnen […] Zusätzlich M4 eine Obergrenze geben (Quotient ≤ 0,85)
> […] Abnahme: mindestens 25 Prozent der 275 Silhouetten-Texel in der
> M4-Beweiszelle lesbar."

### P0-B "Kronenschatten-Fliegengitter" (Juror K UND Juror H, unabhängig)
> H: "canopy_shadow (und die canopy_shadow_xl_*) stempeln ein starres
> 25-%-Bayer-Punktgitter aus den beiden absolut dunkelsten
> Palettentönen auf den Boden […] ΔL 60,6 bzw. 69,7 [je Punkt] […]
> liest nicht als Schatten, sondern als Fehler: eine flache Erdstraße
> hinter einem Moskitonetz."
> K: "ΔL 50,7 bei 27,5 Prozent Punktdichte […] Wo sich zwei
> Kronenschatten überlappen, wird doppelt gestempelt […] Abnahme:
> Schachbrett-Blockanteil zurück unter 2 Prozent."
> Rezept H (gewählt, art-nah): Schatten-Töne auf die Schattenstufen
> der jeweiligen BODENRAMPE umtonen; sauber: pro Material ein eigener
> Key (canopy_shadow_g/_d, additiv ans Ende). Plus Überlapp-Dedupe im
> Schatten-Zweitpass (ein Stempel je Zelle).

### P0-C "K2-Streichungs-Begründung falsch" (Juror M; H bestätigt Sache, verwirft Wortlaut)
> M: "Der Mindestbedarf ist 17 Blöcke [nicht 19], und ich habe einen
> Strahl mit genau 18 Blöcken konstruiert, der K2 erfüllt. […]
> keine Datenfälschung […] Fehlerhaft ist das Argument, nicht die
> Zahl."
> H: "Die Regel war unfair, nicht unmöglich. […] mit der ersatzlosen
> Streichung überlebt kein einziges Kriterium für die räumliche
> Ausdehnung der Stufen. Ersatz wäre billig gewesen (z. B. […] ein am
> Zensus geeichtes '≥ 5 lange Plateaus', das er besteht)."
> ENTSCHEID Fable (Rev 2.4): Kopf-Begründung korrigiert (empirisch,
> nicht arithmetisch); ERSATZREGEL eingesetzt: ≥ 5 Plateaus ≥ 2 Blöcke
> auf dem Proof-Strahl (am Zensus geeicht: 55 % aller Strahlen
> erreichen ≥ 5; der gemessene Strahl: genau 5). §1/M2-Körper
> nachgezogen (stand noch auf Rev-2.1-Wortlaut).

### P0-D "L<16-Bänder in Rev 2.1 angehoben" (Juror M)
> "Rev 2 friert alle Nicht-E1/E2-Schwellen ein; Rev 2.1 hebt trotzdem
> L<16 CATACOMBS 6,0 → 10,0 und BOSS_KAMMER 4,0 → 5,0 an […]
> Verlangt: entweder Rückkehr auf die Rev-2-Bänder mit Nachbesserung
> an k/t, oder eine ausdrückliche, an Michael adressierte Deklaration,
> dass GP6 die Dunkelanteile innen nicht verbessert, sondern nur
> nicht verschlechtert."
> ENTSCHEID: An MICHAEL eskaliert. **MICHAEL 13.08.2026: OPTION a**
> — Deklaration angenommen ("GP6 verbessert die Dunkelanteile innen
> nicht, es verschlechtert sie nicht"), Rev-2.1-Bänder bleiben,
> Dunkel-Inventur (H-P1-1) ist Pflicht-Backlog für GP7. Damit ist
> P0-D AUFGELÖST.

## PRIO-1/2 (Backlog, NICHT Runde 2 — §9: Runde N+1 baut nur Prio-0)

- H1: Dither-Inventur "angehobener × stehengebliebener Ton" (Wurzel
  des gestiegenen Einzelpixel-Rauschens; GP7).
- H2: Boss-Arena-Sprenkel (8,94 % Solitär-Texel). H3: Warm-Tint
  kontinuierlich statt Rampe (122 Farben nah; K-P1-K5 deckungsgleich:
  Figur wäscht am Licht monochrom braun — GP7: 4-5-stufige
  Warm-Rampe + Farbton-Erhalt-Gate). H4: Fackel als Lichtquelle
  außen schwach. H6/E2: 8-Phasen + Untergrenze.
- K3: Perspektiv-Mix Alt-Bäume vs XL-Aufsicht. K4: Heckenreihe statt
  Dach (Y-Verzahnung). K6: Boss-Balken-Stil. K7: Scher-Bänder (2 auf
  42 Zeilen → Rissline) + Schatten-Posen. K9: path_pebbles-Tapete.
  K10: HUD-Balance. K11: Kanal-Reflex-Leitern (GP5-Erbe).
- M-P1: Manifest-ΔWarm-Fehler (51,4 nicht 64,4), XP-Rampe ohne Gate/
  Crop-Beleg, Gradient-Bildunterschrift, M1-Positiv-Kontrolle ist
  Datei-Wiederholung, CATACOMBS-Median-Reserve 0,01 L in die Tabelle.
- H: "Die 4-px-Rasterung ruiniert nichts […] die 1,55x sind nicht
  fällig." UND: "Die 12-Stufen-Treppe liest als gar nichts" —
  sichtbare Lichtsprache = GP7-Grundsatzfrage (weniger Stufen oder
  mehr Hub), an Michael berichtet.

## Runde-2-Zuschnitt (nach §9)

Build: P0-A (Kronen-Transparenz über Spieler + M4-Obergrenze) und
P0-B (Material-Schatten + Dedupe + Schachbrett-Gate < 2 %).
Spec: Rev 2.4 (P0-C-Auflösung, M4-Verschärfung, Manifest-Fixes).
Michael: P0-D-Entscheid. Danach Proof-Nachlauf der betroffenen Gates
+ Jury-Kurzbestätigung durch K und H (Sichtprüfung der zwei Fixes).
