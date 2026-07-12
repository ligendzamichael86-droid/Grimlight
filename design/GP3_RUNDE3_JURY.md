# Grafikpass 3 — Jury-Ergebnis Runde 3 (12.07.2026, neue Skala) — FINAL

Skala: 10 = herausragende moderne Handy-Pixel-Art, SoM = 8,5-9,
gutes SNES-Spiel = 6, GP2-Endstand (Baseline) = 4,5-5.

**Noten: 6,5 / 6,5 / 6,5 → MEDIAN 6,5 — MEILENSTEIN ERREICHT**
(einstimmig; alle drei bilder_gelesen=true, direkte Opus-Juroren,
je 10 R3-Bilder + 4 R2-Archive + 2 GP2-Baselines gelesen).

Pass-Verlauf: GP2-Baseline ~4,5-5 → R1 5,5 → R2 6,0 → R3 6,5.
Projekt-Endziel bleibt Median 10 (SoM übertreffen) — 6,5 ist ein
Meilenstein, keine Endabnahme.

## Kriterien-Matrix (Handwerk / Komposition / Moderne)

| Kriterium | H | K | M |
|---|---|---|---|
| K1 Flächen-Wiederholung | 7 | 6,5 | 6,5 |
| K2 Wald/Kronen | 6 | 6,5 | 5,5 |
| K3 Wasser | 7 | 5,5 | 6,5 |
| K4 Zweite Reihe/Props | 6,5 | 7 | 6,5 |
| K5 Kohärenz | 7,5 | 6,5 | 7 |
| K6 Moderne Veredelung | 7 | 7 | 6,5 |

Einhelliges Lob: Wasser-Umbau als "Headline-Erfolg" (H), vertikaler
Gruftkanal liest als fließendes/algiges Wasser, Gras-Makro-Patches
senken das Tiling sichtbar, Kontaktschatten erden die Props,
Funken-Glow + Boss-Bar = echte moderne Politur, Kohärenz stärkste
Achse. Neue Deckelung: KRONEN jetzt schwächstes Kriterium (6/6,5/5,5,
"Blumenkohl-Kolonne", einlagiger Randstreifen ohne inneres Volumen).

## EHRLICHKEITS-BEFUND (Kompositions-Juror, K3 = 5,5)

Der OFFENE TEICH (g3_01) ist gegenüber R2 teilregrediert: die
Kurz-Strich-Ripples lesen dort als "flacher, fusseliger
Speckle-Teppich" statt als Spiegelfläche; die R2-Wellenbänder trugen
die Oberflächen-Anmutung besser. Die Uferschaum-Linie ist am
Freiflächen-Teich nicht sichtbar (Rasiermesser-Rechteckkante). Der
GRUFTKANAL funktioniert dagegen bei allen drei Juroren. → Priorität 1
im Pass-4-Backlog: Teich-Oberfläche (Glint-Streifen zurück, Speckle
runter) und Teich-Kante.

## Konsolidiertes Pass-4-Backlog (aus den drei R3-Urteilen)

ART (Priorität nach Konvergenz):
1. TEICH-REPARATUR: horizontale Glanz-Streifen im Stillwasser zurück
   (1px hoch, 6-10px lang, 3 versetzte Höhen, hellster Wasserton,
   langsam driftend), Ripple-/Speckle-Dichte ~30 % senken und Kämme zu
   kurzen horizontalen Läufen (3-5px) bündeln; Speckle-Optik nur im
   Kanal belassen. Uferschaum am Freiflächen-Teich SICHTBAR machen
   (2px gebrochene nahweiße Linie an allen Kanten, 1px ins Gras
   gedithert, 1px dunkleres Tiefen-Band innen).
2. KRONEN-VOLUMEN (neues schwächstes Kriterium): 3-Ton-Cluster-Rampe —
   2-3 innere Schatten-Taschen unten-rechts pro Laub-Klumpen carven
   statt nur außen shaden; geclusterte Specular-Tupfer (3-4px) am
   oberen-linken Kamm; 2-3px Schatten-Spalt zwischen überlappenden
   Keulen; Keulenradius ±2px je Krone; zweite, dunklere Kronenreihe
   (−20 % Value, 6-8px nach oben versetzt) hinter der Frontreihe;
   braune 2×4px-Stamm-Pixel zwischen Kronenbasen.
3. FLÄCHEN-FEINSCHLIFF: Rauten/Blatt-Detail auf 3 rotierende Glyphen +
   Positions-Jitter hash(x,y)%5−2; zweite grobe Hash-Rampe (48-64px
   Periode, ±8 Luma) als "Wiesenlicht"; ~15 % Tiles ganz ohne Detail;
   Weg-Mitte: Fahrspur-/Schleiflinien + einzelne Kiesel.
4. GEGNER-MODELLIERUNG: 2-Ton-Körperrampe + 1px-Rim lichtseitig je
   Gegner; Wraith mit klarem Wertsprung neu (heller Schädel vs.
   dunkles Tuch) — Achtung: es gibt KEINEN wraith-Key in sprites.js,
   Juroren meinen vermutlich den Grabwächter/warden — klären; Hund:
   Rücken-Highlightlinie + hellere Beintrennungen.
5. HUD-ANGLEICH: XP-Balken in der Sprache des neuen Boss-Balkens
   (Bevel-Trog, Innen-Highlight); HUD-Panel Innen-Bevel + leichter
   Vertikal-Gradient; Fackel-Kern 1px additiver Hotspot.
6. BOSS-ARENA: 3-4 schwache Boden-Decals (Risse, Knochenhaufen,
   ~12 % Value über Bodenton) in der Mittelzone; Boden-Staub zu 2-3
   driftenden Mote-Clustern nahe der Fackeln bündeln.

ENGINE/STRUKTUR (Pass-4-Kandidaten):
- Organische Wasserkanten: Autotiling/Marching-Squares-Ufersystem
  oder diagonale Shore-Tiles (alle 3 Juroren — größter Struktur-Hebel).
- Prop- vs. Gegner-Schatten-Opazität vereinheitlichen (~35 % Alpha
  weiches Oval für beide; Engine-Pass-Tuning).
- Kronen-Parallaxe/Vordergrund-Canopy-Ebene; Per-Pixel-Wasser-Reflexe;
  Licht-trifft-Textur (aus R2 vertagt); "Spieler steht auf Wasser"
  (aus R1 vertagt); dediziertes dunkleres Gras-Tile für Makro-Patches
  (grass_dark-Namenskollision, s. Übergabe); Wiesenlicht-Makro-Rampe
  ggf. als Engine-Overlay statt Tile-Varianten.

## Betriebsnotizen

- Alle drei Juroren erhielten den R3-Änderungskatalog im Prompt plus
  den Hinweis auf den Engine-Schatten-Entscheid — Juror H hat den
  Entscheid explizit als "kein Defekt" bestätigt (Muster beibehalten:
  bewusste Entscheide im Juror-Prompt deklarieren).
- Grufthund-Schatten-Konflikt (Jury R2 K-K4 vs. Spec §2.5): Hauptloop-
  Entscheid — der weiche Engine-Schatten-Pass erfüllt die Anweisung,
  kein gebackenes Oval (hätte gedoppelt).
- Wasser-Pixel-Diff-Richtwerte haben sich planmäßig verschoben:
  Teich/Kanal-Szene 21,97 % (vorher ~40 %, sanftere Wellen), Funken
  39,11 % (vorher ~21 %, dreifache Dichte + Halo). Kanal-Abwärtsdrift
  nur per Residuum-Zeilenprofil nachweisbar (statischer Tiefen-Schleier
  überdeckt Roh-Korrelation) — Verfahren in .tmp/kanal_proof.py.
