# Übergabe 2026-07-12 — Grafikpass 3 "Moderne Mittel" ABGESCHLOSSEN

## Status

Alle 3 Runden der Qualitätsschleife gefahren, Abnahme nach Spec §8 erfüllt:
- `check_syntax.sh` grün (24 Dateien), `smoke_test.mjs` 3× grün
  (36 Abschnitte inkl. neuem Gameplay-Neutralitäts-Wächter §36)
- Alle drei Flusstests grün (25/25/33 Assertions) mit GENAU den 7
  sanktionierten Ambient-Zeilen (check_main 0.82→0.78, check_boss
  0.7→0.66; check_inventory byte-unverändert) — On-Disk belegt
- git-diff-Beweis: über den ganzen Pass nur die 11 erlaubten Dateien;
  entities/, items/, tilemap.js (R3), lighting.js (R3), Tests in R3
  komplett eingefroren; §36-Solidity-/Geo-Golden-Hashes aller 4 Maps
  halten (Solidität, Spawns, Portale, Fackeln identisch zu 204e28f)
- Bewegungs-Beweise: Teich/Kanal-Szene 21,97 % Pixel-Diff, Gruftkanal-
  ABWÄRTSDRIFT +4px/Frame per Residuum-Zeilenprofil belegt, Funken
  39,11 %; 0 Konsolen-Fehler; finale g3_01-g3_08 (13 PNGs) in
  .tmp/screenshots/, Runden-Archive in gp3_runde1/ und gp3_runde2/

## Notenverlauf (NEUE Skala: 10 = moderne Handy-Pixel-Art, SoM = 8,5-9, gutes SNES = 6)

| Runde | Noten | Median | Kern der Runde |
|---|---|---|---|
| 1 | 6 / 5,5 / 5,5 | 5,5 | Moderne Mittel geöffnet: Partikel, Alpha-Schatten, ambientTint, Wellenbänder, 6 Kronen, HUD-Panel |
| 2 | 6 / 6 / 6 | 6,0 | Organischer Teichrand, Riss-Raster weg, Gras gebrochen, Kronen-Rim, Helden-Gesicht, Vignette entschärft |
| 3 | 6,5 / 6,5 / 6,5 | 6,5 | Wasser-Neubau (Kurz-Strich-Ripples, Uferschaum, Teal), VERTIKALER Gruftkanal, Gras-Makro-Patches, Kronen-Kerben, Kontaktschatten, Funken-Glow, Boss-Bar |

**MEILENSTEIN Median >= 6,5 ERREICHT** (erstmals seit Verschärfung des
Ziels). Auf der Skala heißt das: knapp über "gutes echtes SNES-Spiel",
GP2-Baseline (4,5-5) klar hinter uns, SoM (8,5-9) noch deutlich vorn.
Projekt-Endziel bleibt Median 10 — 6,5 ist ein Meilenstein.

## Was jetzt sichtbar anders ist (gegenüber GP2 / 204e28f)

- **Wasser:** entsättigtes Grün-Teal statt kaltem Blau, versetzte
  Kurz-Strich-Ripples mit Glanzstreifen und Kamm-Sparkles,
  durchgehende Uferschaum-Kante; der GRUFTKANAL fließt sichtbar
  VERTIKAL abwärts (eigene water_v-Tiles, Drift art-gebacken)
- **Friedhof:** Gras-Makro-Patches (moosige Cluster per Hash-Noise),
  3 Detail-Sorten (Büschel/Halm/Fleck), seltene Großdetails, Weg mit
  Kies-/Sand-Korn; alles gameplay-neutral bewiesen (Solidity-Guard)
- **Wald:** 6 Kronen-Silhouetten mit individuellen Top-Kerben,
  Footprint-Vielfalt, Rim/Schattenband
- **Licht/Partikel:** Fackel-Funken 3× dichter mit additivem
  2px-Glow-Halo und 3-Stufen-Zerfall; weiche Alpha-Bodenschatten unter
  allen beweglichen Entities; Farbtemperatur pro Map (ambientTint);
  Ambient-Rebalancing CATACOMBS 0.78 / BOSS_KAMMER 0.66
- **UI:** HUD-Panel mit 2-Ton-Bevel; Boss-HP-Balken mit Rahmen,
  Innen-Bevel, Vertikal-Gradient, Segment-Ticks, Verlust-Rinne
- **Sprites:** Skelett frontal neu + Outline, Ghul kränkliches
  Gelbgrün + kühler Rim, Grabwächter-Backlight, Helden-Gesicht + Rim,
  Kontaktschatten-Ovale unter Grabsteinen/Zaun/Props, 2 neue
  Grabstein-Silhouetten

## Bindende Festlegungen aus dem Pass

1. Neue Engine-Bausteine: core/particles.js (Ember-System, Deckel 60,
   Math.random NUR im Spawn-Pfad — dokumentierte Ausnahme),
   Weichschatten-Pass in main.js (fillRect-only), ambientTint-
   Durchreichung an lighting.draw, Boss-Bar-Zeichnung in hud.js.
2. water_v/water_v_1/_2/_3: vertikal fließendes Wasser als eigener
   4-Frame-Zyklus; Drift IMMER art-gebacken (Frame N = Muster um 4N px
   nach unten) — eine Laufzeit-Phasenverschiebung würde den
   §35-animSync-Test brechen.
3. Smoke §36 hasht SOLIDITÄT + Geometrie (Spawns/Portale/Fackeln),
   NICHT rows-Bytes: begehbare Deko-Tausche in GRAVEYARD/CATACOMBS
   sind sanktioniert, solange gen_deco3-verifyNeutral grün ist.
4. Die 7 Flusstest-Ambient-Zeilen sind verbraucht; weitere
   Ambient-Änderungen brauchen wieder eine Spec mit sanktionierten
   Alt-Test-Änderungen.
5. Juror-Prozess: direkte Opus-Agenten (Workflow-Subagenten können
   keine PNGs lesen), Pflichtfeld bilder_gelesen, bewusste
   Design-Entscheide im Prompt deklarieren, Anweisungen WÖRTLICH
   konsolidieren (Widersprüche explizit als Hauptloop-Entscheid).
6. Basisgras heißt intern bereits grass_dark — bei neuen Key-Namen
   vorher gegen sprites.js grep'en (Namenskollision R3).

## Backlog für Pass 4 (konsolidiert in design/GP3_RUNDE3_JURY.md)

Priorität 1 (echter Regressions-Befund, Kompositions-Juror): der
OFFENE TEICH liest als Speckle-Teppich — Glanz-Streifen im Stillwasser
zurückbringen, Speckle-Dichte ~30 % runter, Uferschaum am Teich
sichtbar machen. Danach: Kronen-Volumen (neues schwächstes Kriterium
— innere Schatten-Taschen, zweite Kronenreihe, Stämme), organische
Wasserkanten (Autotiling/Marching-Squares — größter Struktur-Hebel,
alle 3 Juroren), Flächen-Feinschliff (Glyphen-Rotation, Wiesenlicht-
Rampe), Gegner-2-Ton-Modellierung, XP-Balken in Boss-Bar-Sprache,
Boss-Arena-Boden-Decals, Schatten-Opazität Props vs. Gegner
vereinheitlichen, Kronen-Parallaxe, Licht-trifft-Textur,
"Spieler steht auf Wasser".

## Betriebsnotizen

- Teile von R2 liefen mit Haiku als Hauptloop (Verstoß gegen "Fable
  plant, Opus baut" auf der Hauptloop-Seite). Fable-Nachprüfung mit 5
  parallelen Opus-Prüfern: alles Technische war grün, aber die
  Konsolidierung musste ersetzt werden (paraphrasiert statt wörtlich,
  zwei übersehene Juror-Widersprüche). Lehre in GRAFIKPASS_3.md.
- Adversariale Scope-Prüfung der Engine-Mandate VOR dem Build hat sich
  ausgezahlt: R3 lief ohne einen einzigen Test-Edit, Integrator
  brauchte null Fixes, alles im ersten Lauf grün.
- Kanal-Drift-Nachweis: Roh-Pixel-Korrelation versagt (Tiefen-Schleier),
  Residuum-Zeilenprofil nutzen (.tmp/kanal_proof.py).

## Testen

Server läuft in Michaels Terminal (Port 8123): kompletter Run Friedhof
→ Katakomben → Flüstergruft → Bosskammer. Sehenswert: Gruftkanal in der
Flüstergruft (fließt jetzt abwärts!), Teich im Südosten des Friedhofs,
Fackeln überall (dichte Funken mit Glow), Boss-Kammer (neuer HP-Balken,
hellerer Boden). Dev: `?map=FLUESTERGRUFT`, `?map=BOSS_KAMMER`.
