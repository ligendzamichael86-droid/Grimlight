---
name: project-grimlight
description: "Handyspiel Grimlight (Zelda×Diablo, SNES-Look) /home/coder/Grimlight; Slices 0-5 abgenommen; Slice 6 Dorf gebaut (Abnahme = Optik offen); GP7-CH-1 Menschen FERTIG (Cast 7,75, Michael-Urteil offen); GP7-CH-2 Gegner LÄUFT: Spec Rev 2 (9bc205e), Phase-0-Workflow wf_4473cbab-a32 aktiv — WIEDEREINSTIEG-Block oben im Text"
metadata: 
  node_type: memory
  type: project
  originSessionId: 2135f5db-b185-41ca-95a9-9bd4f9302d40
  modified: 2026-08-15T07:06:05.219Z
---

Spielprojekt mit Michael (Programmier-Neuling, will früh sehen/testen): 2D-Action-Adventure
für Android/iOS. Zelda liefert Spieldynamik, Diablo Welt/Atmosphäre, SNES-Pixel-Look.
Projekt: /home/coder/Grimlight, aufgebaut nach [[project-wat-framework]]-Prinzipien
(CLAUDE.md, workflows/, tools/, uebergaben/).

**Technik (bindend):** Vanilla-JS/Canvas ES-Module OHNE Build-Toolchain (kein npm in der
Umgebung, nur Node 20 + corepack); interne Auflösung 320x180, 16px-Tiles; Grafik als
Text-Pixel-Grids in game/js/art/; alle Module außer main.js in Node importierbar
(Headless-Smoke-Tests). Mobile-Verpackung später per Capacitor (Slice 4).

**Grafik-Anspruch (explizite Vorgabe Michael, 02.07.2026): Secret-of-Mana-Niveau.**
Pixel-als-Code mit Farbrampen, Fringe-Übergangs-Tiles, Over-Layer (Baumkronen über
Spieler), Y-Sortierung, 16x24-Held. In CLAUDE.md verankert.

**Arbeitsweise:** vertikale Slices, Multi-Agent-Pipeline pro Slice (Design-Panel ->
Builder -> Verify -> Fixer -> Screenshot-Proof). Grafik-Qualitätspässe als Workflow:
3 Juroren (verschiedene Blickwinkel) parallel -> Median -> Art-Agent (nur art/-Dateien)
-> Re-Render auf Port 8124; Abbruch bei Note >= 8 oder 3 Runden.

**Stand 04.07.2026:** Slices 0, 1, 1.5 und **2 FERTIG**. Slice 2 lieferte: Bumerang
(0 Schaden/nur Stun, Truhe Westkammer Katakomben, Taste L/Button W), Loot mit 8
Fest-Affixen und 2 Seltenheiten inkl. Pity 12, Inventar (I/Tab, Vollpause, 7 Plätze,
3 Slots), Grufthund + Rostpanzer. Smoke-Test 29 Abschnitte grün, 3 Flusstests grün
(check_main_slice1 24, check_victory_slice1 13, check_inventory_slice2 25 Assertions).
Übergabe mit allen dokumentierten Abweichungen (u. a. Victory-Alt-Test leert neue
enemySpawns wegen echten Spec-Konflikts): **uebergaben/2026-07-04_slice2_abschluss.md**.
Workflow-Erkenntnisse in workflows/SLICE_2_loot_inventar.md.

**Slice 3 (Progression) KOMPLETT FERTIG am 06.07.2026** — Build als erster
Komplett-Lauf nach [[feedback-fable-plant-opus-baut]] (8 Opus-Agenten, 0 Ausfälle,
0 Verify-Findings, Fixer arbeitslos). Alles grün committet als 17063fa (18 Dateien,
+1876). Übergabe: uebergaben/2026-07-06_slice3_progression.md. Neu spielbar:
XP/Level mit Ring-Effekt, Flüstergruft (begehbares Wasser, Eliten, Schlüssel- und
Herzcontainer-Truhen), Grabwächter-Boss (Telegraphie, Phasen-Adds, Bumerang-Abbruch),
Respawn mit Gold-Halbierung, Sieg hinter dem Boss. check_boss_slice3.mjs (33) ersetzt
check_victory_slice1 spec-konform.

**Roadmap-Hinweis (Michael, 07.07.2026):** Nach Slice 4 (Capacitor/Mobile) und
Slice 5 (Sound/Polish) sind AUSDRÜCKLICH weitere Grafik- und Gameplay-
Verbesserungspässe gewünscht — der Fahrplan endet nicht bei Slice 5;
Schwerpunkte dann anhand des Spielgefühls auf dem echten Gerät entscheiden.

**Qualitätsziel VERSCHÄRFT (Michael, 07.07.2026): "Abnahmeziel 10, oder
besser 12 — wir haben das Handy als Grundlage, kein SNES."** Heißt: Secret
of Mana ÜBERTREFFEN. SNES-Ästhetik ja, SNES-Hardware-Grenzen nein (moderne
Mittel erlaubt: unbegrenzte Palette, dynamisches Licht, Partikel, Alpha-
Schatten, Parallaxe — Pixel-Look bleibt). Juroren-Skala ab Grafikpass 3
neu geeicht: 10 = herausragende moderne Handy-Pixel-Art, SoM ≈ 8,5-9;
Median 8 ist Meilenstein, NIE Endabnahme. In CLAUDE.md verankert.
Grafikpass 2 (läuft) behält seine alte Eichung (10=SoM) für die
Runden-Vergleichbarkeit; keine frühe Abnahme bei 8 mehr.

**GRAFIKPASS 2 KOMPLETT FERTIG am 07.07.2026** — committet als 204e28f
(Spec/SOP: bc0de5a). 3 Runden Juror-Schleife, Median 6 → 6,5 → 6,5
(Meilenstein 8 nicht erreicht, Struktur-Grundlagen liegen). Neu in der
Engine (tilemap.js, alles deterministisch): span-Anker (32x32-Kronen),
variants+variantIndex, animRate/animSync (Wasser-Ping-Pong), shorePrefix
(Ufer-Kacheln), depthOverlays (BFS-Tiefenverlauf), Kronen-Schatten;
lighting.js Warm-Glow (flicker>=0.8), TORCH_RADIUS 72. Übergabe MIT
PRIORISIERTEM BACKLOG für Grafikpass 3: uebergaben/2026-07-07_grafikpass2.md.
Wichtige Lehren (in workflows/GRAFIKPASS_2.md): Juror-Anweisungen wörtlich
weiterreichen (Konsolidierungs-Paraphrase erzeugte den Bilderrahmen-Teich-
Bug), Ambient-Werte sind flusstest-gebunden (Änderung braucht sanktionierte
Alt-Test-Änderungen), Null-Jury-Urteile (Bild-Lesezugriff verweigert)
ausfiltern + Ersatz-Juror, Animationen per Pixel-Diff beweisen lassen.

**GRAFIKPASS 3 "Moderne Mittel" KOMPLETT FERTIG am 12.07.2026** —
committet als 2914649 (R1 77a060e, R2 15f6e09). 3 Runden, Median
5,5 → 6,0 → 6,5, Runde 3 EINSTIMMIG 6,5 — **Meilenstein 6,5 erreicht**
(neue Skala; SoM 8,5-9 bleibt das Ziel, Endziel 10). Neu: particles.js
(Ember, Deckel 60), fillRect-Weichschatten, ambientTint, Ambient 0.78/0.66
(die 7 sanktionierten Flusstest-Zeilen sind VERBRAUCHT), Wasser-Neubau in
Teal, VERTIKALER Gruftkanal (water_v, Drift art-gebacken — Laufzeit-Phase
würde §35-animSync brechen), Gras-Makro-Patches (Smoke §36 hasht SOLIDITÄT,
nicht rows-Bytes → begehbare Deko-Tausche sanktioniert via gen_deco3-
verifyNeutral), 6 Kronen mit Kerben, Funken-Glow, Boss-HP-Balken.
Übergabe: uebergaben/2026-07-12_grafikpass3.md; Pass-4-Backlog priorisiert
in design/GP3_RUNDE3_JURY.md (Prio 1: Teich-Speckle-Regression, dann
Kronen-Volumen, organische Wasserkanten/Autotiling). Lehren in
workflows/GRAFIKPASS_3.md: nach Session-Restart HAUPTLOOP-MODELL prüfen
(R2 lief teils mit Haiku — Konsolidierung musste durch Fable ersetzt
werden: wörtlich zitieren, Widersprüche explizit entscheiden);
adversariale Scope-Prüfung der Engine-Mandate VOR dem Build (R3 lief ohne
Test-Edits, Integrator 0 Fixes); bewusste Design-Entscheide im
Juror-Prompt deklarieren; neue Key-Namen vorher gegen sprites.js grep'en
(grass_dark-Kollision); Kanal-Drift nur per Residuum-Zeilenprofil
nachweisbar (.tmp/kanal_proof.py); Juroren IMMER via direktem
Agent-Werkzeug (Workflow-Subagenten können keine PNGs lesen).
Seit 13.07.2026 ist das Screenshot-Lesen DAUERHAFT freigegeben:
"Read(//home/coder/Grimlight/.tmp/screenshots/**)" in
~/.claude/settings.json (Michael: "immer freigeben") — Juroren
blockieren nicht mehr am Berechtigungs-Dialog; bei Block trotzdem:
Agent per SendMessage fortsetzen statt neu spawnen (Kontext bleibt).

**RICHTUNGSENTSCHEID (Michael, 12.07.2026): "wir machen mit grafik
weiter bis 8/10, dann erneute entscheidung"** — Grafik-Block läuft,
bis der Juror-Median 8 erreicht ist (Slice 4 Mobile zurückgestellt).

**GRAFIKPASS 4 "Struktur & Licht" ABGESCHLOSSEN 14.07.2026** —
Median 7,0 → 7,5 → 7,5 (Commits 555ea86/74b8928/3975f56+133c81e,
Abschluss 335b269; +1,0 ggü. GP3-final 6,5; Block-Ziel 8 verfehlt →
GP5 folgt). Neu: Lit-Dither-Pass ("Licht trifft Textur", tilemap.js
litDitherCells + LIT_FLOOR_MAPS in main.js), Teich organisch+Schimmer
(water_mid_calm-Split vom Kanal!), 2. Kronenreihe, Konkav-Shore-
Wahrheitstabelle, Boss-Decals, 8 Gras-Varianten, HUD/XP-Politur.
Einziger Golden-Hash-Wechsel: GOLD.GRAVEYARD.sol (Teich-Umformung).
JURY-KERNBEFUND (einstimmig): Weg zur 8 ist STRUKTURELL — Gras-
GLYPHEN-Stempler statt Musterfunktion, Wasser-BITMASK-Autotiling mit
Uferband, Kronen-ANKER-Layout + Kronen-über-Spieler sichtbar machen
(CLAUDE.md-Pflicht, nirgends belegt!), Licht-QUANTISIERUNG (6 Stufen
+ Bayer). PRIO-0-Defekte für GP5: Stahlblau-Balken im Kronenband
(Back-Rim durch Sichtfenster, seit R2 unentdeckt), Funken-Halo als
Rechteck (Eckpixel), verwaiste Einzeltöne, HUD-Transparenz. Backlog:
design/GP4_RUNDE3_JURY.md; Lehren: workflows/GRAFIKPASS_4.md (u. a.
4-6x-Crops + 6-8-Frame-Strips ab GP5 Pflicht; Bewegungs-Gates über
Sampling-Modus messen; drawSoftShadow-Zeilen überlappen NICHT).
**GRAFIKPASS 5 "Wurzeln & Raster" + GRAFIK-BLOCK ABGESCHLOSSEN
07.08.2026** — Median 7,0/7,0/7,0 (Commits 77c962f/94a6548/9d12c2d/
7704f53/9cf667f). Block-Ziel 8 verfehlt → ESKALATION AN MICHAEL:
design/DOSSIER_GRAFIKBLOCK.md (5 machbare Hebel: Licht-Quantisierung
["blockiert jede Note über 7,5"], Belichtungs-Sockel [sanktionierte
Test-Runde nach GP3-Muster], Sprite-Beleuchtung+Engine-Schatten,
Kronen-Maßstab, Karten-Autorenschaft; Optionen A=GP6 "Licht &
Maßstab" mit MESSZIEL-Abnahme statt 10er-Skala / B=erst Slice 4 /
C=Ziel-Eichung — Empfehlung A dann B). WICHTIG: Jury-Linse hat sich
verschärft (6x-Crops+Pixel-Messungen ab GP5; GP4-final rückwirkend
6,0-6,5) — unter konsistenter Linse ~+2,5 seit GP2. GP5-Wurzel-Funde:
variantIndex-Diagonalgitter bei geradem n (UNGERADE n jetzt Gesetz +
Wächter), einseitige Ufer-Emission, Mote-Additiv-Sättigung (Staub =
source-over). Mess-Disziplin etabliert: Juror-eigene Metriken,
validierte Fenster, Positiv-+Negativ-Kontrollen, 9-Lauf-Modus,
Schwellen NIE anpassen. R3-Restliste (u.a. Kanal-Uferring-Einzeiler
water_shallow_v in map_fluestergruft.js:97) in der Übergabe
2026-08-07.

**GP6 "Licht & Maßstab" ABGENOMMEN 13.08.2026** (Option A komplett):
Erster Pass mit MESSZIEL-ABNAHME — alle 15 Gates grün, Jury-Noten
7,5/7,8/7,5 (Median 7,5; GP5: 7,0). Geliefert: Belichtung repariert
(Paletten-Offset +15 L + Ambient 0,22/0,55/0,52/0,48 + 13
sanktionierte Flusstest-Zeilen — Kontingent VERBRAUCHT), Licht auf
12 harte Stufen (lightRuns/quantizeLight/lightAt in lighting.js,
kostenneutral), Sprite-Tint-Fassade (entities/ blieb tabu),
XL-Kronen 48×32/64×48 mit Scher-Posen + Spieler-Transparenz 0,55,
material-getönte Kronen-Schatten, komplette R3-Restliste. Übergabe
mit Wackelkandidaten + priorisiertem GP7-Backlog:
uebergaben/2026-08-13_grafikpass6.md; Jury-Prozess + Erkenntnisse:
design/GP6_JURY_R1.md, workflows/GRAFIKPASS_6.md. WICHTIG: (a)
Michael-Deklaration P0-D: GP6 verbessert Dunkelanteile innen nicht
— Dunkel-Inventur ist GP7-PFLICHT; (b) Juror-Konsens: 8,0-8,2
erreichbar mit Komposition (Walddach-Verzahnung, Perspektiv-Mix)
+ sichtbarer Lichtsprache + Bodentextur. Spec-Lehren: Gates
brauchen Ober- UND Untergrenzen; Eich-Formeln vor der Messung;
Mess-Korrekturen brauchen Review (3 Fable-Rechenfehler von
Agenten gefunden). NÄCHSTER SCHRITT laut Entscheid 07.08.:
OPTION B = Slice 4 (Capacitor/Mobile, APK).
GOD-MODE als Testwerkzeug eingebaut (Commit 7e1d86d): ?god=1 →
unverwundbar, Schaden x10, Tempo x1,4, 500 Gold + Bumerang, gelbes
GOTT im HUD; ohne Parameter byte-verhaltensgleich (Flusstests
byte-identisch). Achtung: VSCode-Port-Weiterleitung verliert den
Query-Parameter — Michael muss ?god=1 in der Adresszeile anhängen. Scope aus der Juror-Decke von Pass 1 (Noten 6/6/6,5 —
"Grenze der Kachel-Politur, Note 8 braucht Struktur-Arbeit"):
1. 2x2-Großkronen (Multi-Tile-Overlay; braucht Engine-Support in tilemap/maps,
   Over-Layer kann bisher nur 1x1)
2. Tile-Varianten gegen Wiederholung (Legende: Varianten-Arrays + deterministische
   Auswahl aus Tile-Koordinate, KEIN Math.random im Renderpfad)
3. Wasser in die Screenshot-Route (Friedhofsteich + Fluestergruft-Wasser zeigen)
4. Sprite-Politur zweite Reihe: Skelett/Ghul/Grufthund-Rampen, Props
Vorgehen wie Pass 1 (workflows/SLICE_1_5_grafikpass.md als Vorlage): erst Spec
(SPEC_GRAFIKPASS_2.md) im Hauptloop schreiben, adversarialer Review, dann
Engine+Art parallel, Integration, Juror-Schleife (3 Juroren parallel, Median,
Ziel Note >= 8, max 3 Runden, Baseline = s3_*-Screenshots), Abnahme, Übergabe,
Commit. ALLE Agenten model 'opus' ([[feedback-fable-plant-opus-baut]]).
Alt-Flusstests: Flip-Listen-Regel beachten (neue Sprites nur ans Ende), Tests
ankern auf Fußkante/Zentrum. Grüne Basis = Commit 17063fa.

Ursprüngliche Design-Notizen Slice 3:
Git drin (Initial-Commit f620c2a = grüner Slice-2-Stand). Design-Panel (3
Perspektiven) gelaufen, Synthese im Hauptloop, danach adversarialer Review mit
3 Prüfern gegen den echten Code (31 Befunde: 2 Blocker, 8 Majors; ALLE
eingearbeitet). **design/SPEC_SLICE_3.md (637 Zeilen) ist fertig und bindend**,
dazu workflows/SLICE_3_progression.md. Kern: XP/Level (Schwellen
[0,20,50,90,140], Cap 5, +2 maxHp + Vollheilung je Stufe; Level=Zähigkeit,
Items=Macht), 2 neue Maps (FLUESTERGRUFT 40x24, BOSS_KAMMER 20x12; eigene
Dateien map_*.js + neues world/coords.js gegen Zirkelimport), Boss 'graveward'
HP 26 in eigenem boss.js (registerEnemyKind MIT drawer-Param, idle/Aggro bei
64 px oder Treffer, Muster A Rundumschlag / B Sturmschlag mit Bodenmarkern,
Phasen 17/9 mit Skelett-Rufen, Bumerang bricht Cast ab und verlängert stuck),
Eliten (nur Faktoren + elite_glow + frameLights), Boss-Schlüssel +
Herzcontainer als Truhen-contents, Respawn statt Run-Neustart (Gold halbiert,
player.deathToll-Spiegel, Fluchtklausel: bossLocked blockt nur wenn Boss nicht
idle), Sieg wandert hinter den Boss (Katakomben-Truhe wird content 'gold').
GENAU DREI erlaubte Alt-Test-Änderungen (Spec §4). Wichtigste Review-Fixes
stehen in der Spec: Boss-Sterbepfad über dieTime/deathEvent/noDrops,
knockTimer nur bei knockFactor>0 (sonst friert die Boss-Maschine je Treffer
ein), Bumerang-Truhe pusht statt überschreibt inv.zelda (Schlüssel-Softlock),
portalBlocked() als pure Funktion in maps.js (headless testbar), Flip-Liste
nur ans Ende anhängen, STUFE hinter dem TEMPO-String. Spec+Workflow committet
als 114c742 (06.07.2026). Build Phase 1 am 06.07.2026 gestartet — erstmals
nach Michaels Regel [[feedback-fable-plant-opus-baut]]: alle Workflow-Agenten
mit model 'opus'.
**Nächster Schritt: Build Phase 1** parallel mit exklusivem Besitz (Muster
Slice 2): Builder A world/coords.js + map_fluestergruft.js + map_bosskammer.js
+ maps.js + items/progression.js; Builder B entities/boss.js + enemies.js +
player.js + props.js + projectiles.js; Art warden_*-Set + elite_glow +
levelup_0/1 + icon_key + Gruft-Tiles. Danach Integrator C (hud.js,
inventory_ui.js, main.js, Smoke 30-34, check_boss_slice3.mjs), Verify
(inkl. Touch-Fairness-Checkliste §2.3), Screenshot-Proof s3_01-s3_08
(.tmp/shot_slice2.py, Port 8124), Übergabe + Commit. items/items.js ist für
ALLE Builder tabu.

**STAND 15.08.2026 ABEND (Slice 5 + 6):** Slice 5 Sound ABGENOMMEN AM GERÄT
15.08. (98a546e/e3bce1a; "klingt gut", 0 Mängel, Iterationsrunden
entfallen; Übergabe d11e0cf; Musik-Änderungen künftig nur
audio/songs/*+Mixer, nie main.js). Slice 6 "Welt & Seelen": PHASE 0 KOMPLETT (Rev 2.1 = 592a89c;
SPEC_SLICE_6.md-Kopf trägt alle gebundenen Werte: M1-Band 56..69, E1
0,64%, L<16 2,0%, ambient 0,28/#1a1410/40/fog; c=#805f3a, G=#8f4c5d,
Fackelkern-Auflage C*ab<30,5; Boden-L 75,46; TRAUFE-Modell; 4 Quests
Docht/Esse/Sarg/Wind; Rev 1 = 6ec7f5b via git show lesen). **PHASE 1
KOMPLETT GEBAUT UND GRÜN (f48833e):** 56 Tile-Grids + 5 NPCs (16
npc_-Sprites inkl. _talk + npc_blase), map_dorf 44×28 + GRAVEYARD-
Westtor (geo-Hash sanktioniert getauscht, sol byte-gleich), ANCHOR_CLAMP
W:0 (9 dorf-Keys), song_dorf-Stub, pure Module npcs/npc_dialoge/dialog/
quest/shop_ui/save-v2; alle 8 S6-§7B-Sanktionen mit Markern; Smoke 738
×3, alle Suiten grün; Workflow wf_d68a7e13-53e (1 Session-Limit-Ausfall
SYSTEME, per resumeFromRunId + Schadensbild-Preamble geheilt; 1
Fix-Runde: Schlüsselbrüche npc_wache/torwaechter + npc_blase, fehlende
_talk-Frames). **PHASEN 2+3+POLITUR KOMPLETT (Stand 16.08., HEAD 7410d4d): Dorf
SPIELBAR + GEMESSEN + GEHÄRTET + POLIERT.** Phase 2 (3253c26):
main.js verdrahtet, V-Probe 134 Assertions. Phase 3 (53ccbf5):
Save-Härtung + 102 additive S6-§7F-Gates (Smoke 825), Realmessung
ALLE Szenen grün (Dorf-Band 56..69, alle 4 Bestandskarten
unverschoben). Sichtjury (design/SLICE6_JURY.md, 9547b94): A 6,0 /
B 6,5 → Polierpass (4d621dd: Bakes, Stroh warm, Boden, Y-Saum,
Blase) → Nachprüfung B **7,0**; letzte Politur 7410d4d (shadowArt
an Joch/Segel/Osttor). GP7-Backlog priorisiert in SLICE6_JURY.md
(inkl. Materialgrenzen-Nachstempel tilemap.js:1030-1038).
**MICHAEL 16.08.: Slice-6-Abnahme ZURÜCKGEHALTEN ("sieht auch nicht
gut aus") — Gate = OPTIK; Nachtrag: "erst die menschen, die
Spieldynamik bleibt" (kein Kampf-Umbau jetzt). GP7-CH-1 LÄUFT:
Landkarte 3-teilig (505c39f, GP7CH_LANDKARTE*.md: T1-T14,
Steckbriefe, 6 Canvas-Rigs, Flip<=22-Regel) + Spec Rev 2 (63fa2a4;
Review fand 7 BLOCKER: dL-Band kollabierte Cast->Fix je
Wirkort-Klasse+dE00>=25-Ersatz, Tür-Span wirft tilemap:752/900->
Türen 2 Kacheln BREIT, Palette +14 fest zugeteilt aus Symbolsatz
!%&():;?@[]^_|, Stilbibel-Regeln 2/4/10 GP7CH-sanktioniert,
bbox-Symmetrie, alle 9 Messformeln fix). PHASE 0 FERTIG (75106c7 Split, b9a5029/2dc203f Bogen+Referenz,
e9dc217 Rev 2.1: Gruft-Band 95..127,5, Held=dE00-Pfad). PHASE 1
VERSUCH 1 ABGELEHNT 22.08. (Branch gp7ch1-versuch1: Held +45 L
aufgehellt + Animation zerstört, Bran/Hedda/Corm lesen nicht als
Menschen — Ursache: Workflow-Agenten sahen ihre Renders nicht,
Goodhart auf Zahlen-Gates). Gerettet auf main: Palette +14, Türen
2 Kacheln breit, Sanktionen (a0ee742). Rev 2.2 (1430ecc):
art-first, DIREKTE Zeichner mit Bild-Selbstkontrolle, Untergrenzen
(Held L 78,8±8, Frame-Diffs ≥ vorher 43/135/161), Messwerkzeug-Fix
(RIMTOENE-Hardcode!). VERSUCH 2: HELD FERTIG + FREIGEGEBEN (Juror 6,0→7,9→8,4; Commits
d95f3fe/2ea79d5; 10+7 Bild-Schleifen; ANKER-Doku
design/GP7CH1_ANKER_HELD.md mit 10 Erbregeln, u. a. flip-neutrales
Seitenlicht G-F). NPCs 1b FERTIG GEZEICHNET + COMMITTET (adc8c0a, 10.09.): zwei
direkte Zeichner (A Bran/Hedda/Corm 4 Schleifen je Figur; B Mile/
Torwächter 12 Schleifen, V1 nach Sichtung verworfen), alle Kern-
Gates grün, Suiten grün (825). Deklariert: G-J Torwächter-L Rost-
Deckel, G-K Männer-Paare Profil ≤90 + Differenzierer, G-L Werkzeug-
Nachzug. **>>> WIEDEREINSTIEG NACH COMPACT (Stand 12.09.2026 06:20 UTC) <<<**
ORCHESTRATOR: diese Sitzung (coder-cf, 2135f5db). Andere Sitzung coder-98
hat Grimlight per SendMessage abgegeben (10.09.) und hält still. PFLICHT
vor jedem Schritt: `git log -3` auf fremde Commits + ListAgents prüfen.
HEAD 9bc205e = SPEC_GP7CH2 Rev 2 (alle Review-Befunde drin), Baum sauber.
LAUFEND (seit 12.09. 06:35 UTC, Michael: 'mache es so'): Phase 0 CH-2 als FUENF DIREKTE Opus-Agenten (Workflow wf_4473cbab-a32 GESTOPPT — Befund: Workflow-Laufzeit laesst nur 2 Agenten gleichzeitig laufen, alle bisherigen Laeufe max 2; Direkt-Agenten haben die Grenze nicht und sind per SendMessage einzeln fortsetzbar). Agent-IDs fuer Resume per SendMessage: P0.a Messwerkzeug ab8f41e3c7469dcc2 | P0.b Palette a3a3d43e4a49a1b7a | P0.c Horden-Bogen a0e336cddf71c9b9e (Ausgaben .tmp/gp7ch2_p0c/) | P0.e Massgate aa73b6f83d0540be6 (Port 8124) | P0.f Vorprobe a340f9908d2c8bb94 (Klon .tmp/gp7ch2_vorprobe/, Port 8129, Patch PATCH_flash_decal.diff). Rueckgabeformat je Agent: '## OK', '## REPORT', '## ABWEICHUNGEN'. STAND 07:30: P0.e GRUEN, P0.b GRUEN (10 Abw.), P0.f GRUEN (11 Punkte, Patch .tmp/gp7ch2_vorprobe/PATCH_flash_decal.diff) — meine Entscheide dazu in /home/coder/Grimlight/.tmp/gp7ch2_p0/FABLE_ENTSCHEIDE.md (Kill-Flash-Zaehler zeichnet zu Ende, noTint-Hoist, smoke-Gate muss reisen, SYM-Deckel 25, Palette +8 als Vorab-Commit vor Phase 1, Hund 6,49 deklariert, Skelett-Schatten violett/dunkel erzwungen). ALLE 5 GRUEN (P0.a 08:15, P0.c 08:10; Entscheide in FABLE_ENTSCHEIDE.md nachgetragen). P0.d Referenz GRUEN 08:50 (design/referenz/gp7ch2/ 94 Dateien 2,4 MB, byte-gleich Kanon; Befund: CH-1-Nachher-Bogen aus uncommittetem Baum, Entscheid R-D1 in Doku). design/GP7CH2_PHASE0.md GESCHRIEBEN (Rev-2.1-Entscheide R-A1..R-A10, R-B1..R-B8, R-C1..R-C4, R-D1, gebundene Zahlen); Erratum in GP7CH1_PHASE0.md. V-P0 Pruefer a4bd76fdadea216ce: gestartet 07:47, durch Prozess-Neustart ~08:00 gestoppt (Punkte 1-3 + Teil 5 erledigt, Logs in .tmp/gp7ch2_vp0/), per SendMessage 14:45 fortgesetzt, FERTIG 15:05: GRUEN nein — 10 ROTE = alles Doku-Zahlen (Ton-Minima, Sperrlisten Ghul, mdL Bild, Zeilenzahl, 5 Legenden, CH-1-Provenienz war FALSCH: Hashes = Commit adc8c0a1, Marker R9) + 15 Restpunkte; ALLE von Fable behoben/entschieden (in GP7CH2_PHASE0.md Abschnitt V-P0 + R-D1 neu, README korrigiert, Marker verschoben, gfx6 GRUEN). V-P0 RUNDE 2 GRUEN 15:20 -> PHASE 0 COMMITTET cdd08a6 (98 Dateien, Baum sauber). Palette +8 COMMITTET c60d153 (15:45). ENGINE E FERTIG + COMMITTET: Schritt 2 c2d713b (16:40: 37 smoke-Gates §5(5), smoke-KANON JETZT 862, Debug-Deckel window.__decalDeckel, Beweise .tmp/gp7ch2_p1/E/beweise.md; Rost headless nicht toetbar -> Decal nur sortenagnostisch belegt). Engine Schritt 1 COMMITTET 5eb42d5 (16:15: main.js Flash+Decal, 3 Blink-Stellen raus, 4 provisorische *_decal-Keys; Suiten gruen laut E; Commit unter dem Mutex, Zeichner hatten noch nicht geschrieben). PHASE 1 LAEUFT seit 12.09. 15:50 UTC mit DREI DIREKTEN Opus-Agenten (Resume per SendMessage): ENGINE E a32fc594998f76dcb (Patch + R-A1/R-A3 + Decal-Keys provisorisch + smoke-Gates §5(5) + Beweise; Zwischenmeldung .tmp/gp7ch2_p1/E/schritt1.md; Port 8124) | ZEICHNER A a25a22c80421588f4 FERTIG 20:00 (Gates 11->49/63, Skelett 10/11, Hund 8/11, Warden 5/8; Zwischenfall String.replace '$' repariert+von Fable verifiziert; Entscheide A1-A9 in FABLE_ENTSCHEIDE.md: G5 Spiegel-Gate jetzt TON-Lesart <= 65, Warden dash/b deklariert). STAND 20:20: Kunst KOMPLETT uncommitted in sprites_figuren.js (95 Keys je 1x, gfx6 GRUEN, Tafel B 82,47 %, Schwarz ~18 %); material_gesamt.json gemerged; Blindsatz NACHHER in .tmp/gp7ch2_v/blind/ (Aufloesung von Fable NICHT gelesen). Nachzug-Werkzeug a2de4545b661c43d2 FERTIG 21:30 (Gates 57/65; undeklarierte Rote nur ghoul_die G2+G5 -> Fix B). V-SPEC a56e23c1a87df31ec FERTIG 22:05: GRUEN nein — 1 BLOCKER (skeleton_/hound_decal abstrakt, 0 Kontur), 3 MAJOR (Ghul-Rim 8er-Balken = Knaeuel-Wand; Rost '|' liest als Frost -> E-B9 Rost neu: '_' Helmkuppe + '6' weiche Kante; Decal-Ausnahme missbraucht -> neue Decal-Regel >= 1 Konturton >= 4 Texel Bodenkante, Rim <= 15 %), 6 MINOR; Noten Sk 7 / Hu 8 / Ro 7 / Gh 6 / Wa 7 / Horde 7 (vorher ~4). FIX-RUNDE 1 VORBEREITET: .tmp/gp7ch2_p1/FIX1_ZEICHNER_A.md + FIX1_ZEICHNER_B.md (Entscheide in FABLE_ENTSCHEIDE.md Abschnitt V-SPEC). V-TESTS af5dcd4fdf8df0165 FERTIG 18:35 UTC: GRUEN (kein neuer Befund; 11 Restpunkte entschieden in FABLE_ENTSCHEIDE.md; M1 sieht Gegner nicht = deklariert; K3 skeleton_0 6,08 knapp; Rost-Decal behavioral belegt). FIX-RUNDE 1: A+B FERTIG (~21:20 UTC; Decals als Leichen, Skelett 12/12, Ghul 11/12, Rost ohne '|'), ABER Tafel B 76,8 % < 80 -> Fable-Diagnose (77 nicht getrennt: Sk/Sk 40, Gh/Gh 24) -> NACHBESSERUNG laeuft seit ~21:40 UTC per SendMessage (A: Rim auf erhobenem Arm + ungleiche Armkanten '/'/'$', Skelett-Einzelton '/' bis 70 % DEKLARIERT; B: ungleiche Ghul-Armkanten — FERTIG ~22:20 UTC, rechte Flanke '<', Tafel B 81,63 % >= 80). ACHTUNG: Read (Bild-PNG) faellt seit ~22:00 UTC mit PreToolUse-Hook-Timeout aus (keine lokalen Hooks konfiguriert -> IDE-Host-Client nicht erreichbar); Bash geht. V-SPEC r2 + Blind-Juror 3 brauchen Read auf PNG -> vorher mit einem kleinen Read testen; V-TESTS r2 + Nachzug gehen ohne Bilder. A-Nachbesserung FERTIG ~22:40 UTC (Tafel B 91,3 %, Skelett MAXTON 59,3 deklariert <= 70). KUNST FINAL fuer r2. Read auf PNG geht wieder (~22:50). Nachzug r2 FERTIG (~23:20 UTC): G12 +Rim/+Bodenkante, shield ohne G7, DEKLARATIONSLISTE mit Rahmen (Skelett MAXTON 70, Ghul 90 [Schaedel-Akzent], Warden 75, Hund Hue >= 19, Rost >= 10, Warden G4 nur dash) + zweite Bilanz 6/6 64/64 OFFEN ROT KEINE (erste 1/6 57/64); gfx6 Rost [[20,18]]. V-TESTS r2 FERTIG (~22:45 UTC): alles gruen AUSSER M3 skeleton_0 K3 3,11 (< 6,0) — eigene Halbseiten-Neigung -4,99 durch die Knaeuel-Kanten. A v4 FERTIG ~23:05 UTC (Halbseiten 0,75/1,51, Augenhoehlen getrennt, rosa Hand weg, Koerper-L 125,29, Tafel B 86,5). V-TESTS r2b: gruen ausser M3-K3 skeleton_0 4,64 -> DEKLARIERT P1-D11. **KUNST COMMITTET ef1b27e (23:35 UTC, Baum sauber)**: 5 Gegner + 4 Decals, Doku GP7CH2_PHASE1.md, Uebergabe uebergaben/2026-09-12_gp7ch2_gegner.md. APK GEBAUT + VERIFIZIERT (12.09. 22:45 Serverzeit, 4,19 MB, enthaelt sprites 6e4039c8 + main.js mit Decal-Engine + Palette 86), auf 8125 (PID 196200). Doku-Hashes committet (HEAD = Folgecommit von ef1b27e). Michael-Nachricht GESENDET 12.09.: Links /proxy/8125/ (APK) + /proxy/8129/ (Browser), E-D-Frage, Cast-Juror-Kritik (Skelett khaki/Warden Stilbruch) -> Politur-Runde CH-2b = Michaels Entscheid. GP7-CH-2 PHASE 1 DAMIT FERTIG (Abnahme offen). 13.09.: Michael fragt nach GITHUB (Ziel: Betrieb auf anderem Rechner mit mehr Kernen). BEFUND: Repo hat KEIN Remote (nur lokal, .git 10 MB); kanonische Pruef-Suiten liegen in .tmp/ (gitignored!) -> Portabilitaets-Agent ac6bc6560249d12df kopiert sie nach tools/checks/ + restore_tmp.sh + design/BETRIEB_NEUER_RECHNER.md + Clone-Probe. Deploy-Key erzeugt: ~/.ssh/grimlight_deploy (pub gezeigt: ssh-ed25519 ...OpSxt grimlight-deploy@srv1457801) — Michael muss GitHub-Repo anlegen + Deploy-Key mit Schreibrecht eintragen + URL nennen; dann git remote add origin git@github.com:... + push (GIT_SSH_COMMAND mit dem Key). NIE Token/Passwort im Chat. DANACH: V-TESTS r2b (resume af5dcd4fdf8df0165: M3 + Halbseiten + Suiten + Tafel B) -> bei GRUEN sofort COMMIT (sprites_figuren.js, .gitignore, design/GP7CH2_PHASE1.md, uebergaben/2026-09-12_gp7ch2_gegner.md) -> APK bash tools/build_apk.sh -> 8125 pruefen -> Michael-Nachricht mit Links + E-D-Frage + Cast-Juror-Kritik (Politur-Entscheid bei Michael). DANACH: COMMIT (sprites_figuren.js, .gitignore, design/GP7CH2_PHASE1.md; .tmp-Werkzeuge ausserhalb git) -> CAST-JUROR FERTIG (22:35 UTC): CAST 4,0 -> 6,25 (Sk 5,0 / Gh 6,5 / Hu 7,0 / Ro 7,0 / Wa 4,5 / Horde 6,0) — strenger als V-SPEC r2 (8/7/8/8/7/8); Kritik: Skelett khaki statt Knochenweiss + Kopfband + rosa Arm; Warden unangetastet = Stilbruch; Decals = Kratzer; Rostreihe = Wand. ENTSCHEID FABLE: JETZT AUSLIEFERN (geprueft), Politur-Runde CH-2b = MICHAELS ENTSCHEID nach Geraetetest (Kernfrage: Skelett Knochenweiss vs Wertleiter). Kritik steht in Uebergabe + PHASE1-Doku -> Uebergabe uebergaben/2026-09-12_gp7ch2_gegner.md -> APK bash tools/build_apk.sh + 8125 -> Michael E-D-Frage. | V-SPEC r2 FERTIG: GRUEN, Noten Sk 8 / Hu 8 / Ro 8 / Gh 7 / Wa 7 / Horde 8 (offen nur MINOR: rosa Skelett-Hand = Politur-Kandidat) | Blind-Juror 3 FERTIG: 40/40 (E-B10 erfuellt). design/GP7CH2_PHASE1.md ENTWURF geschrieben (Runde-2-Abschnitt offen). NACH Nachzug: V-TESTS r2 (resume af5dcd4fdf8df0165). Dann Commit Kunst+Tools+Doku (GP7CH2_PHASE1.md schreiben: Rev-2.1-Ergaenzungen aus FABLE_ENTSCHEIDE Phase 1), Cast-Juror, APK, Michael. Urspruenglich gestartet 18:40 UTC per SendMessage: A a25a22c80421588f4 (Decals neu, Skelett Gesicht/Schultern, Hund-Sehne, Warden-Saum) + B a75b4a35e9667f7e2 (Ghul Rim-Segmente + grosser Schaedel + ghoul_die, Rost Rim '_'+'6' statt '|', Decals, Doppelkommentar). DANACH: Nachzug-Agent a2de4545b661c43d2 (G12 Rim <= 15 % + Bodenkante >= 4; shield ohne G7; check_gfx6_art Rost [[20,18]]) -> V-TESTS r2 (Suiten, Gates, M3, G12) + V-SPEC r2 (Bild) + Blind-Juror 3 (frisch, Nachher-v2-Satz neu rendern nach .tmp/gp7ch2_v/blind2/) -> Commit Kunst -> Cast-Juror -> APK -> Michael. HINWEIS: Uhrzeiten in aelteren Notizen (20:00-22:05) waren geschaetzt und zu hoch. VORSCHAU-SERVER fuer Michael: .tmp/serve_game_8129.py auf Port 8129 (PID .tmp/serve_game_8129.pid, gestartet 12.09. 19:55 UTC, serviert game/ live = Arbeitsbaum; Link /proxy/8129/ mit Schlussstrich); 8123 = Michaels eigener Server, nicht anfassen. (gestartet 21:35, .tmp/gp7ch2_v/tests/, Port 8124) | Squint-Blind-Juror 1 a7c90902d2b3b7634 FERTIG 20:40: 6x 5/5 beide Boeden GRUEN, 1x gruft 4/5 GRUEN, 1x GRAS 1/5 ROT (Skelett->Rost, Ghul->Warden, Hund/Rost im Grau formlos) — Auswertung .tmp/gp7ch2_v/squint/juror1_nachher_auswertung.md; Juror VORHER-Satz a7e871e7ce1186f23 FERTIG: 40/40 (!) — die alten Figuren lebten bei 1x von extremen Werten (Skelett 162), die Rev-2-Wertleiter komprimiert absichtlich; Einordnung + Fix-Option in .tmp/gp7ch2_v/squint/juror1_nachher_auswertung.md. Juror 2 NACHHER aced90cb6d1ad34e8 FERTIG 21:05: vertauscht SKELETT<->GHUL in ALLEN 8 Serien (3/5 ueberall) — Ursache: Skelett-Schaedel im rosa Mittelton '$' + Sand-Koerper liest als Ghul; Ghul-Rim-Balken liest als Klinge, Schaedel zu klein. FIX-RUNDE PFLICHT (F1 Ghul grosser Schaedel + Rim dosiert, G7-Ausnahme Schaedel 2 Stufen; F2 Skelett Schaedel nur '/'+'_', Schultern <= 10, Koerper-L 126) — Befund in juror1_nachher_auswertung.md; mit V-SPEC/V-TESTS-Befunden buendeln, dann A/B per SendMessage (Fallback: frische Agenten mit AUFTRAG-Dateien). NACH Nachzug: V-TESTS starten (AUFTRAG_VTESTS.md, .tmp/gp7ch2_v/tests/, Port 8124). Dann Fix (max 2) -> Commit -> Cast-Juror -> APK -> Michael. (alt: .tmp/gp7ch2_p1/A/) | ZEICHNER B a75b4a35e9667f7e2 (Rost 20x18->Ghul; .tmp/gp7ch2_p1/B/) — FERTIG 17:35 (Gates 11->41/63, Paar-Gates gruen, Tafel B 84,85 %), Nachzieh-Runde Ghul v2 FERTIG 18:30 (Spiegel 79,8/78,3, Tafel B 82,47 %, Paar-Gates gruen) — B KOMPLETT; Entscheide zu B1-B8 in .tmp/gp7ch2_p0/FABLE_ENTSCHEIDE.md (Abschnitt PHASE 1: *_decal ohne G2/G3/G4, shield ohne G4, Rost Spiegel 81 + Hue 12 deklariert; Material-Tabellen A+B mergen; Paar-Matrix nach A wiederholen). Mutex .tmp/gp7ch2_p1/LOCK. PRUEFPHASE VORBEREITET (Auftragsdateien in .tmp/gp7ch2_p1/: AUFTRAG_NACHZUG_WERKZEUG.md [zuerst, kleiner Agent: *_decal ohne G2-G5, shield ohne G4/G5, P11-Anzeige], AUFTRAG_VTESTS.md, AUFTRAG_VSPEC.md, AUFTRAG_SQUINT.md [frischer Agent, nur 40 NACHHER-Blind-PNG-Pfade], merge_material.py [A+B -> material_gesamt.json, nach A laufen lassen]). Reihenfolge nach A: merge -> Nachzug-Agent -> V-TESTS ∥ V-SPEC ∥ Squint-Juror -> Fix (max 2) -> Commit -> Cast-Juror -> APK -> Michael. NACH ALLEN DREI: V-TESTS + V-SPEC (direkt, adversarial; V-SPEC liest Boegen als Bild; Squint-Juror = FRISCHER Agent nur mit den 40 Blind-PNG-Pfaden, NIE die Aufloesung) -> max 2 Fix-Runden -> Commit -> Cast-Juror (direkt, PNG, Note je Gegner + Horde) -> APK bash tools/build_apk.sh + 8125 -> Michael-Frage E-D (Fluestergruft + Katakomben: Sorte vor Kontakt benennen; fuehlt sich Draufhauen nach etwas an). Phase-1-Plan (alt): Zeichner A (Skelett->Hund->Warden-Nachzug) + Zeichner B (Rost 20x18->Ghul) DIREKT mit Read auf 6x-Renders, Mutex .tmp/gp7ch_npc/LOCK-Muster fuer sprites_figuren.js, + Engine-Agent 1e (Patch aus .tmp/gp7ch2_vorprobe/PATCH_flash_decal.diff + R-A1 spur_kill + R-A3 noTint-Hoist + echtes reisendes DORF-Gate + smoke-Gates §5(5)); Auftraege FERTIG GESCHRIEBEN in /home/coder/Grimlight/.tmp/gp7ch2_p1/AUFTRAG_COMMON.md + AUFTRAG_ZEICHNER_A.md + AUFTRAG_ZEICHNER_B.md + AUFTRAG_ENGINE_E.md (Agenten lesen sie selbst; Mutex .tmp/gp7ch2_p1/LOCK via mkdir; Engine legt provisorische *_decal-Keys an; Engine Schritt 1 = Patch + R-A1/R-A3 -> Fable committet Zwischenstand; Engine Port 8124). Start aller drei DIREKT + parallel sobald der Paletten-Commit steht. 8125-Server lief durch (PID 196200). BLINDTEST-HYGIENE: Fable liest horden_blind_vorher_aufloesung.txt NIE; Squint-Juror = frischer Agent nur mit den 40 PNG-Pfaden. DANACH: Rote fixen (max 1 Runde, Fixer-Agent), V-P0-Abschnitt in Doku, COMMIT (tools/horden_bogen.mjs, tools/figuren_bogen.mjs, design/referenz/gp7ch2/, design/GP7CH2_PHASE0.md, design/GP7CH1_PHASE0.md), dann Vorab-Commit Palette +8 (R-A9) durch Engine-Agent, dann Phase 1. DANACH von Hand als Direkt-Agenten: P0.d Referenz (design/referenz/gp7ch2, Prompt im Workflow-Script Phase 'Referenz') -> V-P0 adversarialer Pruefer (Prompt vPrompt im Script) -> max 1 Fix-Runde -> Commit. Script-Pfad (Prompt-Quelle): /home/coder/.claude/projects/-home-coder-Grimlight/2135f5db-b185-41ca-95a9-9bd4f9302d40/workflows/scripts/gp7ch2-phase0-wf_4473cbab-a32.js. Alte Workflow-Notiz: LAUFEND: Phase-0-Workflow CH-2 — Run wf_4473cbab-a32, Task w80feqaeb (3. Anlauf 12.09. 06:19 UTC; die 2 Vorläufe starben durch Compact/Neustart nach 21 s bzw. 15 min, KEIN Paket fertig, keine Cache-Treffer; Script um VORLAUF-HINWEIS ergänzt),
Script /home/coder/.claude/projects/-home-coder-Grimlight/2135f5db-b185-
41ca-95a9-9bd4f9302d40/workflows/scripts/gp7ch2-phase0-wf_4473cbab-a32.js
(Resume: Workflow({scriptPath, resumeFromRunId:'wf_4473cbab-a32'});
Pakete P0.a Werkzeug-Gegner [.tmp/gp7ch_p0/figuren_messung.mjs +
shot_gfx6.py:309 Regex] / P0.b Palette 8 Töne [.tmp/gp7ch2_p0/] /
P0.c tools/horden_bogen.mjs + figuren_bogen Gegner+Gruftstein / P0.e
additive Gegner-Maßtabelle check_gfx6_art / P0.f Engine-Vorprobe im
Klon .tmp/gp7ch2_vorprobe/ → P0.d Referenz design/referenz/gp7ch2/ →
V-P0). NACH GRÜN: Phase-0-Ergebnisse committen (tools/, design/
referenz/gp7ch2, Doku GP7CH2_PHASE0.md mit Tönen/Zielprofilen/
Innenraum-Zielen als Rev 2.1), DANN Phase 1: ZWEI DIREKTE Zeichner
(A Skelett→Hund→Warden-Nachzug; B Rost 20x18→Ghul) mit Mutex
.tmp/gp7ch_npc/LOCK-Muster in sprites_figuren.js, art-first (Read
auf 6x-Renders je Schleife, ≥3 Schleifen), Material-Tabellen,
Horden-Bogen nach jeder Figur; PARALLEL Engine-Agent (Flash Flanken-
Zähler + Decal-Liste nach P0.f-Diff, entities nur 3 Blink-Zeilen);
→ Sanktion (§5 Rev 2: 3 Blink-Zeilen, gfx6 SYM-Deckel +8, Maßgate
Rost 20x18 verschärfen, shot_gfx6-Regex, additive Gates Silhouetten-
Verlust/Decal/Timer-Regex) → V-TESTS+V-SPEC → Cast-Juror (direkt,
Figuren+Horden-Bogen, Squint BLIND) → APK → MICHAEL: "in Flüstergruft
+ Katakomben mit ?god=1 jede Gegner-Sorte benennen BEVOR du drauf
bist; fühlt sich Draufhauen nach etwas an?" GESTRICHEN aus CH-2:
Fußvolk + Varianten (→ Kampf-Slice). OFFEN BEI MICHAEL: CH-1-Geräte-
urteil Menschen (APK 10.09. 18:23 auf 8125; Server starb beim Compact 11.09., neu gestartet 12.09. 06:18 PID in .tmp/serve_apk_8125.pid — nach JEDEM Neustart prüfen: ss -ltnp | grep 8125) + Juror-
Frage Corm-Petrol. DANACH: CH-3 Animation, CH-4 Licht, GP7-WELT-
Backlog (SLICE6_JURY.md), Slice-6-Abnahme neu stellen; Kampf-Slice
mit neuem Michael-Vorschlag. DOKU-KETTE CH-2: GP7CH2_LANDKARTE.md
(V1-V13) + _A_ENGINE + _C_ZIELBILD, SPEC_GP7CH2.md (Rev 1 + Rev 2 E-A..
E-D), GP7CH2_SPEC_REVIEW.md. CH-1-Doku: SPEC_GP7CH1 Rev 2.3 (G-A..G-N),
GP7CH1_ANKER_HELD.md (10 Erbregeln), GP7CH1_JURY.md, uebergaben/
2026-09-10_gp7ch1_menschen.md. LEHRE 12.09.: Workflow-Tool = max 2 Agenten gleichzeitig (gemessen ueber alle 8 Laeufe) und stirbt bei Compact/Neustart ohne Cache — fuer echt parallele Pakete DIREKTE Agenten (run_in_background) nehmen, Prompts aus dem Script kopieren, Ports je Agent zuweisen (8124/8129), IDs sofort ins Gedaechtnis. LEHREN: Zeichner nur DIREKT (PNG-Read),
Untergrenzen einfrieren, Gates an Bestandskunst rückrechnen, pkill
nie mit Selbsttreffer-Muster, Nachher-Bogen nach letztem Commit
rendern (--modus nachher --out .tmp/screenshots).

**11.09.2026: MICHAEL "dann arbeite du weiter" → diese Sitzung (coder-cf)
ist wieder ALLEINIGER Grimlight-Orchestrator (andere Sitzung coder-98
per SendMessage informiert, HEAD 3853dda = deren Übergabe
uebergaben/2026-09-10_gp7ch1_menschen.md: Cast 7,75 freigegeben, APK
18:23 auf 8125, Michael-Gerätetest OFFEN). CH-2 "Die Horde wird lesbar": LANDKARTE FERTIG (0565855: Teil A Engine
[E5-Messung, E1-Fenster, Flash EAGER nach tiles-Bau sonst engineB rot,
Decals mit EIGENEN Keys, DIE_TIME/Splice byte-gleich] + Teil C
Zielbild [H1-H8, Horden-Bogen-Prototyp: 37,6 % Schwarz, Knochenwand,
Squint 2/5] + V1-V13) und SPEC Rev 1 (0d4fbbb); REVIEWS FERTIG (10 Blocker/25 Major/25 Minor, design/GP7CH2_SPEC_
REVIEW.md) → SPEC REV 2 (9bc205e): Flanken-Zähler-Flash, geometrische
Kontur-Maske, kalte Unverwundbar-Maske, Decal-Räumung inkl. Diff-Set,
Leitklassen-Fenster 81..137/78..142, Wertleiter 85-100/105-113/120-126/
131-134, Profil fußbündig ≤60 / Kopf-Schulter ≤65, Palette 8 neue
(x/f GESPERRT), FUSSVOLK + VARIANTEN GESTRICHEN (Kampf-Slice), Warden-
Ausnahmeliste, Squint blind, Michael-Auftrag "jede Sorte benennen bevor
du drauf bist" (Flüstergruft + Katakomben). PHASE 0 LÄUFT (Workflow:
P0.a Werkzeug-Gegner / P0.b Palette 8 / P0.c horden_bogen / P0.e Maß-
gate / P0.f Engine-Vorprobe im Klon → P0.d Referenz design/referenz/
gp7ch2/ → Prüfung). ALT: Reviews (2 Prüfer). Danach Rev 2 → Phase 0 (Werkzeuge, Palette <=7 mit
Kollisionsnachweis, Referenz-Bögen versioniert, Engine-Vorprobe) →
Phase 1 zwei direkte Zeichner (A Skelett/Hund/Warden, B Rost 20x18/
Ghul/Fussvolk) + Engine-Agent Flash/Decal → Sanktion (3 Blink-Zeilen)
→ Prüfung → Jury → APK → Michael Flüstergruft-Frage. ALT: Landkarte (2 direkte Opus-Analysten: Bestand/Engine-Bindungen
für Flash-statt-Blink + zweistufiges Sterben + Paletten-Varianten;
Zielbild Horden-Lesbarkeit + Steckbriefe + Horden-Bogen) → Spec (Fable)
→ Review → Build art-first (direkte Zeichner!) → Jury → APK → Michael.
Spieldynamik bleibt unangetastet (Engine nur Flash/Decal, sanktioniert
mit Dynamik-Unveränderlichkeits-Beweis).**

**ÜBERGABE 10.09. ~18:45: Eine PARALLELE Fable-Sitzung (coder-f7) ist
seit 16:34 alleiniger Grimlight-Orchestrator (Commits bis f3302d5:
eigene Jury 7928ec4, Mile-Runde, Paletten-Runde 2ccf0da G-M/G-N, Form-
Runde Bran/Hedda/Corm f3302d5, APK 18:19). Diese Sitzung (2135f5db)
hat auf Grimlight STILLGELEGT — keine Schreibzugriffe mehr; ihr Bran/
Hedda-Stand liegt in .tmp/gp7ch_runde2/. LEHRE: vor jedem Grimlight-
Schritt `git log -3` prüfen, ob eine andere Sitzung aktiv ist (Commits
fremder Herkunft = STOPP + ListAgents/SendMessage-Koordination).**
**STAND 10.09.2026 ABEND (nur diese Sitzung coder-f7 orchestriert;
eine parallele Instanz derselben Sitzung [coder-cf] hatte heute
16:34-18:09 eigenmächtig Jury+Bran/Hedda-Runde gefahren und
sprites_figuren.js um 18:09 überschrieben — entdeckt, ihr Stand liegt
in f3302d5/.tmp/gp7ch_runde2, sie steht STILL; NIE zwei Orchestratoren
auf Grimlight!):** Cast-Juror (meiner) 10.09.: NPC-Median 5,5→7,3,
Squint "alle sechs benennbar" BESTANDEN (design/GP7CH1_JURY.md);
Korrekturrunde umgesetzt: Palette 2ccf0da (Corm dunkel via dE00-
Pfad auf dominanter Materialfläche G-N; Bran satter, Hue-Drehung
E3-gesperrt; Hedda C 18→28), Mile 9c01e14, Corm f3302d5, Bran/Hedda
A-Endstand WIEDERHERGESTELLT 9ef18ee (Körper-L 117,5/117,2 im
Fenster). DORF-M1 d1-d6 + 5 Bestandskarten grün mit Cast; Held
M3/M4/M5 grün; Osttor-Anker 3aa7af9. **APK 10.09. 18:23 = HEAD 9ef18ee
auf 8125 → MICHAEL-GERÄTETEST OFFEN** ("erkennst du aus der
Entfernung, wer wer ist? viel besser?"). JUROR-NACHPRÜFUNG 10.09.: GESAMTER CAST FREIGEGEBEN (NPC-Median
7,7, alle sechs 7,75, Corm 8,0; verdikt gilt für 9ef18ee — belegt).
ÜBERGABE uebergaben/2026-09-10_gp7ch1_menschen.md (mit Option:
4 NPC-Standkacheln Weg->Lehm + Abdunklungsrunde, falls Michael
'zu hell' sagt). NÄCHSTES: Michael-Urteil -> CH-2 Gegner (oder
Abdunklung); V3-Gate nicht ausgelöst (7,75<8,0). Nachher-Bogen .tmp/screenshots/figuren_bogen_nachher_*,
Vorher design/referenz/. ALTER TEXT:
(Workflow wf_5935df8f-7e2): Split sprites_figuren/tiles+Fassade ->
Paletten-Rechner||Figuren-Bogen+design/referenz/-VORHER||
Messwerkzeug mit E1-Fenstertabelle -> Prüfung. Danach Phase 1:
1a Held (17+3 sword_slash) -> 1b NPCs (15) -> 1c parallel
Türen+Palette; dann Sanktion (E8: gfx6_art:74-79 +14 Zeichen,
ART_DIRECTION 2/4/10, additive 16x24-Maßzeile, gp6_art_self 5->6
Rot, check_gfx4_art tot) -> Jury (Figuren-Bogen) -> APK ->
Michael. Masterplan 0978d57, Direktive
[[grimlight-menschen-und-kampf]].** Alter Wartepunkt (funktionale
Checkliste) bleibt sinnvoll, ist aber nicht mehr das Gate:
(APK 16.08. 00:10 auf /proxy/8125/; Checkliste: v1-Stand migriert,
Westtor, 5 NPCs, Q1 komplett, kaufen, App-Kill). Danach:
Slice-6-Übergabe + Masterplan-Update → Slice 7 (Rätsel) oder GP7
nach Michaels Wahl. MERKE: pkill/pgrep NIE mit Mustern, die die
eigene Befehlszeile fangen (zweimal selbst gekillt — PID-Datei
oder /proc-cmdline-Filter nutzen).** Write-Hook-Timeout:
design/-Dateien notfalls per Bash-Heredoc.

**Betriebswissen:** Dev-Server des Auftraggebers auf Port 8123 (Agenten: NIE anfassen,
eigener Server auf 8124). Playwright: venv nötig (PEP 668), Chromium persistent in
~/.cache/ms-playwright. Workflow-Resume nach Session-Limit/Prozess-Exit funktioniert
(resumeFromRunId, Cache-Replay); vorher Dateizustand prüfen, gestorbene Agenten können
halbfertige Edits hinterlassen (Slice 2: Integrator starb am Session-Limit, halbfertige
main.js; Gegenmittel: Schadensbild dokumentieren und dem Nachfolger als Erstauftrag
mitgeben). Screenshot-Inszenierung ohne Spieldatei-Änderung: .tmp/shot_slice2.py
(performance.now-Zeitlupe/Freeze, Math.random-Würfelschlange nur im
spawnDeathDrops-Stack, Telemetrie-Wrapper per Route-Interception), wiederverwendbar.
Flusstests ankern Spielerposition auf Fußkante/Zentrum, nie auf Zeichen-Ecken.
Git im Projekt: f620c2a (Slice-2-Stand), 114c742 (Slice-3-Spec).
