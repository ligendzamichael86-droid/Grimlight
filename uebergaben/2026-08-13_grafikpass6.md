# Übergabe 2026-08-13 — Grafikpass 6 "Licht & Maßstab" ABGENOMMEN

Erster Pass mit MESSZIEL-ABNAHME (Spec Rev 2.5, §1/§10) statt
10er-Skala. Abnahme-Status: **ALLE 15 Gates GRÜN** (M1-M5, E2,
Schachbrett, Perf, Strips, Sanity — mit Positiv-/Negativ-Kontrollen),
alle Suiten grün, Jury ohne offenen Prio-0. Informative Noten:
R1 7,0/7,4/7,5 → nach Runde 2 **7,5 (H) / 7,8 (K) / 7,5 (M),
Median 7,5** (GP5-Endstand: 7,0). Beide Bild-Juroren sehen 8,0-8,2
in dieser Ausbaustufe erreichbar (Backlog unten).

## Was GP6 geliefert hat (messtechnisch bewiesen)

- **Belichtung (Hebel 2):** Paletten-Offset (Gras +15 L, Wasser im
  Gleichschritt, 10 Töne) + Ambient 0,22/0,55/0,52/0,48 + weichere
  Vignette. Mediane 38,5-45,7 in allen Bändern (vorher außen 22-25:
  "unsichtbarer Matsch" ist Geschichte). 8-Phasen-Median-Disziplin.
- **Licht-Quantisierung (Hebel 1):** 12 harte Stufen (lightRuns/
  quantizeLight, 4-px-Läufe, Eimer-Bündelung), exakt 13 Leiterstufen
  gemessen, Plateau-Anteil 96,8 %, Warm-Pass block-gerastert
  (Glow-Vielfalt 30→22). Performance 2,10 ms = BESSER als der alte
  Renderer (Baseline 2,07/Limit 2,79; Läufe max 1679/2000).
- **Sprite-Licht + Schatten (Hebel 3):** Tint-Masken-Fassade
  (entities/ blieb tabu), ΔWarm +66/+52 (Ziel +18), Halbseiten-
  Modellierung; Kontaktschatten-Unterzeile für ALLE Klassen (10-18
  Texel unter der Fußkante, innen wie außen).
- **Kronen-Maßstab (Hebel 4):** XL-Klassen 48×32/64×48 mit je 5
  gebackenen Scher-Posen, Walddach 100 % Deckung aus 4 Keys,
  Spieler-unter-Laub mit gradierter Verdeckung V(Kopf) 0,53
  (halbtransparent statt ausgelöscht), Culling-Fix rechts,
  material-getönte Kronen-Schatten mit Überlapp-Dedupe
  (Schachbrett-Metrik 6-7 % → 0,9-1,3 %).
- **R3-Restliste:** Kanal-Uferring senkrecht (water_shallow_vert),
  Teich-Specular, Ufer entregelt, Flammen-Kern am Docht, Boss-
  Kratzer kalt, Wegsporn ans Wasser ('P'/path_pebbles), Halm-
  Größenklassen, HUD (XP-Rampe, Pixelziffern statt Θ-Null,
  Boss-Lag-Rampe).

## Test-Bilanz

Kanonische Flusstests: GENAU die 13 sanktionierten Ambient-Zeilen
(§7.A, zeilengenau von zwei Prüfern + Juror M verifiziert), sonst
NULL. Golden-Hashes sol/geo: NULL. Smoke: +111 additive Assertions
(§7.F), 5 sanktionierte Bestandsstellen mit Markern (§7.B/C/D/G).
check_gfx6_art ersetzt check_gfx5_art. God-Mode (?god=1) durchweg
grün mitgeprüft.

## Bindende DEKLARATIONEN der Abnahme

1. **Michael, 13.08. (P0-D, Option a):** "GP6 verbessert die
   Dunkelanteile innen nicht, es verschlechtert sie nicht" — die
   Rev-2.1-L<16-Bänder gelten; Dunkel-Inventur ist GP7-PFLICHT.
2. Lichtfeld hart gestuft OHNE Bayer, Kanten 4 px (Juror H: die
   1,55×-Kosten für 2 px sind NICHT fällig — nichts ruiniert).
   ABER: die 12-Stufen-Treppe ist im Bild praktisch unsichtbar
   (1-5 L je Stufe) — "sichtbare Lichtsprache" ist GP7-Grundsatzfrage.
3. Kronen-Transparenz per Alpha 0,55 (Juror-H-P1: erzeugt 383
   Zwischenfarben + wirkt auf den ganzen Span — GP7: Stipple-Maske
   + Spieler-Blende).
4. GOLD-Θ auf Game-Over/Sieg, Schatten-Blinken, Lit-Dither-Blinken
   der Kratzer, _m-Kronen mit ungespiegeltem Schatten, Props getönt/
   Drops nicht (alle Jury-gesichtet, keine Befunde).

## Wackelkandidaten (grün, aber knapp — bei JEDER Folgeänderung neu messen)

CATACOMBS-Median 40,10 (Grenze 40,0; ungünstigste Phase 0,01 L) ·
g6_02-Median 45,68 (Obergrenze 46,0) · E2 22/24 · M5 innen 6,64/6,0.

## GP7-Backlog (priorisiert, aus Jury R1+R2 — Details GP6_JURY_R1.md)

1. PFLICHT: Dunkel-Inventur (Dither-Paare angehoben×stehengeblieben;
   Wurzel des Restrauschens inkl. Krone-auf-Krone-Altgitter).
2. Sichtbare Lichtsprache (weniger Stufen ODER mehr Hub) — H-Kernpunkt.
3. Komposition: Perspektiv-Mix Alt-Bäume, Walddach-Verzahnung
   statt Heckenreihen (K: trennt 7,8 von 8,0-8,2).
4. Warm-Rampe statt kontinuierlichem Tint (Figur wäscht braun);
   Kronen-Stipple statt Alpha; Boden-Textur-Runde (Boss-Sprenkel);
   Boss-Balken-Stil; path_pebbles-Varianten; Kanal-Reflex-Leitern;
   E2 über 8 Phasen + Untergrenze; Scher-Bänder 3-4 + Schatten-Posen.

## Bindende ERKENNTNISSE des Passes (auch in workflows/GRAFIKPASS_6.md)

1. **Messziel-Abnahme funktioniert** — aber Gates brauchen Ober- UND
   Untergrenzen (M4 belohnte Totalverdeckung, ΔWarm hat kein Dach:
   beide Goodhart-Richtungen sind real).
2. **Eich-Schwellen nur nach VOR der Messung fixierter Formel** —
   und der Einfrier-Commit darf sonst NICHTS anfassen (die Rev-2.1-
   Band-Anhebung wurde zu Recht als Prio-0 gerügt und brauchte
   Michaels nachträglichen Entscheid).
3. **Mess-Methoden-Korrekturen brauchen denselben Review wie Specs:**
   drei meiner Korrektur-Begründungen enthielten Rechenfehler, die
   erst Agenten/Juroren fanden. Binäre Metriken degenerieren bei
   Alpha-Blending (A==B-Zählung → gradierte V-Metrik).
4. **Absolute Töne sind fast immer falsch** — Schatten/Dither
   material-RELATIV zur Bodenrampe wählen; jede Palette-Anhebung
   reißt alle Paarungen mit stehengebliebenen Tönen auf.
5. **Bewegte Messgrößen einfrieren oder mitteln** (M1-Phasen-Median);
   Fixer-Eskalation statt stiller Entscheide hat den Pass zweimal
   gerettet (Ton-Gegenproben, WRAP-Nachzug).

## Commits

Spec/Planung d19b035 · Rev2 73de948 · Rev2.1 17f2ce4 · Phase 1
410ffcb · Phase 2 f70b30d · Phase 3 05a9e8a · Rev2.2 37f4dcf ·
Fix-R1 33c7284 · Rev2.3 a8e09ba · Jury/Rev2.4 0658ec7 · P0-D
7848c8d · Rev2.5 879ae8e · Runde 2 772a1d2 · Abschluss (dieser).

## Testen (Michael)

Port 8123 (+ ?god=1): Friedhof hell mit Walddach (drunter laufen —
du bleibst sichtbar), Wege ohne Punktgitter, Fackeln mit warmen
Figuren und Kern am Docht, Katakomben/Gruft/Boss in neuer
Belichtung, HUD mit Pixelziffern. Messreport: .tmp/g6_proof_results
.json, Jury-Material .tmp/g6_jury_manifest.md.
