# Workflow: Grafikpass 4 — "Struktur & Licht" (Ziel: Median 8 = Block-Ende)

## Ziel

Die vier 6,5er-Deckel aus GP3 strukturell knacken: Teich-Reparatur
(Schimmer-Loop, organische Uferlinie mit Konkav-Autotiling +
Silhouetten-Umformung), zweite dunklere Kronenreihe + Kronen-Volumen,
Licht-trifft-Textur (Lit-Dither-Pass, Flaggschiff), Sprite-/HUD-
Modellierung — plus minimale Animations-Politur (Fackel 3-Frame,
Gras-Sway) gegen den SoM-Vergleichs-Deckel.

MEILENSTEIN-LOGIK (Auftrag Michael 12.07.2026: "Grafik bis 8/10,
dann erneute Entscheidung"): Median >= 8 in irgendeiner Runde →
Grafik-Block endet mit Abnahme. Nach Runde 3: 7,5-7,9 → Abnahme +
GP5-Planung; < 7,5 → Eskalation an Michael mit Analyse.

## Inputs

- `design/SPEC_GRAFIKPASS_4.md` (bindend; Revision 2 nach
  adversarialem Review: 1 Blocker, 10 Majors, 15 Minors eingearbeitet)
- `design/GP3_RUNDE3_JURY.md` (Backlog-Quelle)
- Grüne Basis: Commit 2914649

## Ablauf

1. Landkarte (4 Opus-Leser) + Spec im Hauptloop (Fable) +
   adversarialer Review (3 Opus-Prüfer). ERLEDIGT 12.07.2026.
2. Build: Art + Engine-A (unabhängige Mandate) parallel, dann
   Engine-B (braucht Art-Keys), dann Integrator (prüft die drei
   KOPPLUNGEN aus Spec §7). Muster GP3-R3 (lief mit 0 Fixes).
3. Proof: gp3_final/-Archiv ZUERST, dann g4_01-g4_09 + Serien;
   Beweis-Fenster beachten (Teich 1,5-15 % — Ober-UND-Untergrenze!),
   Kanal per Residuum-Verfahren, Lit-Texel-Nachweis.
4. Jury: 3 DIREKTE Opus-Agenten (nie Workflow-Subagenten — kein
   PNG-Zugriff), bilder_gelesen-Pflichtfeld, bewusste Entscheide im
   Prompt deklarieren. Median laut Meilenstein-Logik.
5. Abnahme laut Spec §8, Übergabe, Commit, Memory (Hauptloop).

## Besonderheiten

- ALLE ausführenden Agenten auf Opus ("Fable plant, Opus baut");
  nach Session-Restart ZUERST das Hauptloop-Modell prüfen (GP3-Lehre).
- Port 8123 = Auftraggeber; Agenten nur 8124.
- Tests: Flusstests NULL Änderungen; smoke NUR der exakte §5-Katalog
  (GOLD.GRAVEYARD.sol einzige Hash-Änderung; geo-Änderung = STOPP).
- Ambient-Werte sind eingefroren (GP3-Kontingent verbraucht).
- Composite-Hygiene: jeder 'lighter'-Block stellt gco/alpha explizit
  wieder her (Stubs restaurieren gco nicht — grüner Test, kaputter
  Browser).
- Palette ist VOLL: neue Töne nur '='/'+'/'*' laut Spec §3.6.
- Der "Wraith" der Juroren ist der GHUL (nicht der warden).

## Abnahme

Siehe `design/SPEC_GRAFIKPASS_4.md` §8. Übergabe in `uebergaben/`.

## Erkenntnisse / Änderungen (Lauf 12.-14.07.2026, 3 Runden)

Abgeschlossen, Übergabe: `uebergaben/2026-07-14_grafikpass4.md`.
Notenverlauf Median 7,0 → 7,5 → 7,5 (GP3-final 6,5 → +1,0).
Block-Ziel 8 nicht erreicht → laut Meilenstein-Logik: Abnahme + GP5.

1. **Struktur-Grenze erreicht:** Die R3-Jury ist einstimmig — die
   verbliebenen Deckel (Gras-Grundraster aus Musterfunktion,
   Wasser-Rechteck-Silhouetten, Kronen-Perlenkette, ungerastertes
   Licht) sind PIPELINE-/ENGINE-Themen; weitere Tile-Varianten heben
   sie nicht. GP5 muss ein Struktur-Pass werden (Glyphen-Stempler,
   Wasser-Bitmask-Autotiling, Anker-Layout, Licht-Quantisierung).
2. **Bei 1x UND vergrößert prüfen:** Der Stahlblau-Balken-Defekt im
   Kronenband überlebte zwei Runden, weil Proof+Jury nur 1x sahen.
   Ab GP5: 4-6x-Crops (Baumspalte, Wasserkachel, HUD) im Pflichtpaket;
   Frame-Strips mit 6-8 Frames.
3. **Mikro-Fix-Muster bewährt:** Der Teich-Schimmer lag nur im
   gespeicherten Render über der Untergrenze (1,69%), im Modus von 9
   Läufen darunter (1,43%) — Robustheits-Sampling gehört in jeden
   Bewegungs-Beweis. Der modellbasierte Mikro-Fix (Beweis-Crop
   nachgebaut, beschränkte Suche) schlug Handentwürfe bei geringerer
   Dichte.
4. **Ausfall-Resilienz:** Monatslimit + zwei Prozess-Enden mitten in
   R3 — kein Arbeitsverlust dank: Commit nach jedem grünen Stand,
   Workflow-resumeFromRunId, SendMessage-Fortsetzung von Agenten,
   Schadensbild-Erstauftrag an Nachfolger. Nachfolger verifizierten
   statt neu zu bauen (korrekt: "nicht verschlimmbessern").
5. **Kopplungs-Falle depthOverlays:** Die Teich-"Beruhigungsdecke"
   dämpfte unbeabsichtigt das Kanal-Drift-Signal (geteilter
   water_mid-Key) — Entkopplung via water_mid_calm. Lehre: geteilte
   Overlay-Keys vor Änderungen auf ALLE Nutzer-Maps prüfen.
6. **Juror-Widersprüche dokumentiert entscheiden** (Funken hart vs.
   gelobt → Kompromiss) — aber Ergebnis nachprüfen: der Kompromiss-
   Ring wurde als geschlossenes Rechteck implementiert und von allen
   drei Juroren als Regression gemeldet (Eckpixel!). Lehre: Render-
   Wirkung von Partikel-Änderungen im Proof mit Nahaufnahme belegen.
