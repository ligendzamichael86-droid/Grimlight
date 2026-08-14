# SPEC Slice 6 — "Welt & Seelen" (Rev 1, 14.08.2026, Fable)

Grundlage: design/SLICE6_LANDKARTE.md (Teil A Engine, Teil B Dorf —
Datei:Zeile-Belege bindend), design/GDD.md:38-40 (Gramfeld ist DORT
spezifiziert: Dauerzwielicht, vernagelte Fenster, Herdfeuer,
Tristram-Stimmung — bindend), MASTERPLAN_TIEFE.md.
Deliverable: Das Dorf Gramfeld als 5. Karte — 5 NPCs mit Dialog,
Haendler als Gold-Senke, 3-5 Quests, Save v2 mit verlustfreier
Migration — spielbar auf Michaels Handy.

BUILD-SPERRE: Der Bau startet ERST nach (a) Michaels Slice-5-
Hoertest-Abschluss (Audio-Iterationen kollidieren mit main.js) und
(b) den zwei MICHAEL-ENTSCHEIDEN in §9.M. Planung (Spec + Review +
Phase 0) laeuft vorab.

## §0 Eiserne Regeln

0.1 Kanonische Flusstests NULL. probe_god + check_save_slice4 gruen
(Save-v2 erweitert check_save ADDITIV; die 48 Bestands-Assertions
bleiben byte-gleich — v1-Staende laden weiter!). S4-GOLD/S5-Gates
gruen. sol-Hashes NULL; geo-Hash: GENAU EINE sanktionierte Aenderung
(neues Friedhof-Portal; §9.M2 — ERSTE geo-Aenderung der Projekt-
geschichte, braucht Michaels Freigabe; git-diff-Beleg smoke:2150).

0.2 entities/ wird fuer npcs.js GEOEFFNET (Slice-Muster wie boss.js
in Slice 3): NEUE Datei entities/npcs.js mit EIGENEM Array — NICHT
registerEnemyKind (NPCs waeren sonst schlagbar/lootbar, Landkarte A
1.1). npcs.js pusht KEINE Events (smoke:5189-Waechter!), sondern
liefert Rueckgabewerte (updateNpcs -> {nahe}). player.js/enemies.js/
boss.js/props.js/projectiles.js bleiben TABU.

0.3 Kein neuer Input-Knopf: Reden = Angriffs-Pegel bei NPC in
Reichweite+Blickrichtung (attackSwallow-Praezedenz main.js:1688).
KeyQ ist NICHT frei (smoke:5564).

0.4 Text-Sonden-Regel (bindend, Landkarte A 2.4): Kein neuer Text
enthaelt einen Teilstring aus der Sperrliste (GOLD/SIEG/GAME OVER/
GRIMLIGHT/STUFE/AUSRUESTUNG/x 0/ENTER/FORTSETZEN/NEUES SPIEL/GOTT/
PAUSE/WEITER/VERSCHLOSSEN/VERSIEGELT/GRABWAECHTER/KNOCHEN-BUMERANG/
berklinge/bezwungen/DER TOD FORDERT); kein Text mit GOLD-Anfang vor
drawHUD. Dialog-Umbruch ZEICHENBASIERT (48 Zeichen/Zeile, 4,8 px je
Zeichen — KEIN measureText). Dialogbox NUR Haupt-ctx, fillRect-
Rahmen (kein strokeRect).

0.5 Palette: KEINE neuen Schluessel; die zwei Null-Nutzungs-Toene
'c' (#1d2f3d) und 'G' (#82854c) werden UMGEWIDMET (Dach-Zwischen-
stufe warm + NPC-Stoffton; §0.11-konform; die zwei ABGELOESTEN
Alt-Waechter check_art_gfx3:57 und dev_art_slice2:124 sind nicht
auf der Gruen-Liste — namentlich deklariert, nicht anfassen).
Saettigungs-Deckel: kein Dorf-Ton gesaettigter als der Fackelkern.

0.6 Sprites nur ANS ENDE (+ Flips ans Listenende); NPC-Mass 16x24.
0.7 Startkarte BLEIBT GRAVEYARD (Dorf-Start = spaetere Etappe).
0.8 Ports/Commit-Disziplin wie gehabt. 0.9 song_dorf ist PFLICHT
(songFuer wirft sonst); wartet auf Michaels Hoertest-Vokabular.

## §1 ABNAHME

A1 Objektive Gates (Node, additiv): Dialog-Reducer pur (Umbruch/
Blaettern/Auswahl deterministisch); Haendler-Logik pur (Kauf/
Verkauf/Gold-Grenzen/volle Tasche); Quest-Maschine pur (Ueber-
gaenge, resetRun-Reset, Save-Roundtrip); Save-v2-Migration: JEDER
gueltige v1-Stand laedt verlustfrei (Feld-fuer-Feld-Beweis),
v2-Roundtrip, Muell -> null; NPC-Update kollisionsfrei; DORF
gegnerfrei-Gate.

A2 Alle Suiten gruen; §7-Sanktionen per git-diff; APK baut.

A3 M1-DORF-Band nach GP6-Methodik: Phase 0 EICHT (Simulation +
Formel VOR der Messung; Zwielicht-Vorschlag ambient 0,28 / Tint
#1a1410, Median-Band ~54..66 — exakte Zahlen frieren als Rev 1.1
ein), 8-Phasen-Median, Kontrollen. Kleine Sicht-Jury (1-2) auf das
neue Biom.

A4 MICHAELS GERAETETEST = finale Abnahme: Dorf betreten, alle 5
NPCs, kaufen/verkaufen, eine Quest komplett, Save v2 ueberlebt
App-Kill, sein v1-Spielstand hat die Migration ueberlebt.

## §2 NPCs & DIALOG

2.1 entities/npcs.js: eigenes Array, Spawn-Konvention wie enemies,
moveWithCollision/aabbOverlap wiederverwendet, wander fuer 2 NPCs,
Rest ortsfest mit 2-Frame-Idle; Kollision ueber SOLIDE Legenden-
Kachel unter Steh-NPCs (Weg a — DORF hat noch keinen sol-Hash);
drawNpc ueber pushTinted (Y-Sort/Schatten/Tint gratis).

2.2 Dialog: neuer State 'dialog' (harte Pause wie inventory; Musik
laeuft); dialog.js als PURER Reducer (Muster titleMenuStep): Seiten,
48-Zeichen-Umbruch, Fortsetzen per confirm/Tap-Flanke, Optionen
(max 3) mit Tap-Vorrang; Texte als Datenmodul entities/
npc_dialoge.js (Sperrliste!). Box (16..304, y 120..172),
Sprech-Frame, '!'-Blase ueber Quest-Gebern.

2.3 updateNpcs liefert {nahe}; main.js zeigt Hinweis-Blase,
Angriffs-Pegel oeffnet Dialog + attackSwallow.

## §3 HAENDLER (Gold-Senke)

3.1 Bran (Schmiede): kauft Items (Erloes niedrig ~15/35), verkauft
je Slot EIN gesaetes Fest-Angebot je Dorfbesuch (rollItem mit
deterministischem Seed aus Save-Zaehler), Traenke (25), Taschen-
Erweiterung capacity 7->10 (300, einmalig via runFlags), Herz-
container (400, EINMALIG via runFlags). Preis-Anker an gemessener
Bilanz (~137 Gold Erstdurchlauf, ~58 je Katakomben-Runde). Hedda:
Traenke + Voll-Heilung je Dorfbesuch kostenlos. Mile: EIN Zufalls-
Item/Besuch zum Wucherpreis (2,5x).

3.2 Haendler-UI: EIGENES Modul ui/shop_ui.js + eigener State 'shop'
(Inventar-Panel TABU — LIST_Y/X-Anker eingefroren); Bauform wie
inventory_ui (Logik ohne ctx + Zeichner), Tap-Zonen >= 6 mm.

## §4 QUESTS

quest.js (pur): Zustaende angeboten/aktiv/erfuellt/abgeschlossen in
runFlags.quests (questId -> status+zaehler); resetRun leert;
Trigger aus vorhandenen Beobachtern (enemy_died-Zaehler, chest/
boss-Flags, Dialog-Abschluss). 3-5 Quests aus Landkarte-B §5.5
(Corm = Hauptfaden "was unter dem Friedhof liegt" -> Boss; 2
Neben-Quests mit zaehlbaren Zielen; Belohnung Gold/Item). Quest-Log:
KEINE eigene UI-Seite — NPCs sagen den Stand (deklariert).

## §5 SAVE v2

save.js: SAVE_VERSION 2; neue Felder {npcFlags, quests,
runFlags.gekauft}; migrateV1(v1) -> v2 (fehlende Felder Defaults;
NIEMALS null fuer gueltige v1!); deserialize nimmt v1 NUR ueber
Migration, v2 direkt; pur + Node-getestet. check_save_slice4:
Bestands-Boots byte-gleich + NEUE additive v1->v2/v2-Boots.

## §6 DIE KARTE — GRAMFELD (44x28)

6.1 world/map_dorf.js nach Landkarte-B §5: Schmiede 4x3, Heddas
Kate 3x2 mit HERDFEUER-Licht, Kapelle 4x3, 3 verlassene Katen,
Speicher; Brunnen 2x2 solide; geborstene Dorfglocke (Landmarke);
Marktstand mit swayPoses-Segel; Osttor -> Friedhof. Daecher als
Over-Spans (GP6-Mechanik: Spieler-unter-Dach-Transparenz gratis!),
Mass NUR 48x32/64x48/64x32 (Masstabelle unangetastet). ambient
0,28 / Tint #1a1410 (Zwielicht, GDD), mapDef.music 'dorf', fog an,
KEINE enemySpawns + additives Gegnerfrei-Gate.

6.2 Anschluss: EIN neues Portal GRAVEYARD-Sued <-> DORF-Osttor
(geo-Sanktion §9.M2); Respawn im Dorf = Torwaechter-Anker.

6.3 Generatoren (Phase 0): gen_dorf_layout (Grundrisse, Soliditaet,
freie Legendenzeichen, Wege), gen_dorf_dach (Dach-Grids +
Schatten-Bakes + _m), Boden-Pool n=9 aus der Erde-Rampe.

6.4 Art-Volumen: ~70 Grids (~40 handgezeichnet; Rest Generator) —
zwischen GP5 und GP6, zweimal bewaeltigt. Rampen: Holz q/j/Q/J +
'c'-Zwischenstufe, Erde fuer Lehm/Platz, Rost fuer Ziegel, O/B
fuer Stroh, 'G' als NPC-Stoff; NPC-Kleider kontrastieren zum
Helden-Violett.

## §7 TEST-KATALOG (abschliessend)

A. ADDITIV (S6-§7F(a)..): alle A1-Gates; DORF-gegnerfrei; additive
DORF-Zeile in §36 (sol/geo/ambient-Haertung); Dialog/Shop/Quest-
Reducer; NPC-Sonden; Migration. B. SANKTIONIERT #1 [NACH FREIGABE
§9.M2]: smoke:2150 geo-GOLD GRAVEYARD (das neue Portal), Marker
S6-§7B, git-diff EINE Zeile. C. Verboten: alles andere Bestehende
(insb. Inventar-Panel, Pause-Geometrie, Flusstests).

## §8 BUILD-TOPOLOGIE (nach Aufhebung der Build-Sperre)

Phase 0: M1-DORF-Eichung + Umwidmungs-Rechner c/G + Generatoren +
Ton-Zensus-Nachweis (kein Bestandsgrid kippt) -> Rev 1.1.
Phase 1 parallel: ART (~70 Grids) · WORLD (map_dorf.js + maps.js
Portal/Registrierung) · SYSTEME (entities/npcs.js +
npc_dialoge.js, dialog.js, quest.js, ui/shop_ui.js, save.js v2 —
alles pure Module) · AUDIO (song_dorf nach Hoertest-Vokabular).
Phase 2: ENGINE (main.js: States dialog/shop, NPC-Verdrahtung,
Quest-Trigger, Portal). Phase 3: INTEGRATOR (§7, Suiten, APK).
Phase 4: kleine Sicht-Jury + MICHAEL (A4).

## §9 DEKLARATIONEN + MICHAEL-ENTSCHEIDE

§9.M1 [MICHAEL]: Art-Direction-Regel 4 biom-lokal aufweichen —
heute: "Fackel-Orange/Gelb sind die einzigen warmen Lichtquellen,
Rest kalt". Vorschlag: "Warm ist im Dorf das MATERIAL (Holz/Lehm/
Rost), warm-LEUCHTEND bleibt nur Feuer; Saettigung unter Fackel-
kern gedeckelt." Ohne diesen Satz ist das ganze Biom regelwidrig.

§9.M2 [MICHAEL]: geo-Hash-Sanktion — erste geo-Aenderung der
Projektgeschichte (bisher deklariertes STOPP-Signal). Umfang:
GENAU die eine GRAVEYARD-geo-Zeile fuer das neue Dorf-Portal.

Deklariert (Fable): Startkarte bleibt GRAVEYARD; Quest-Log ueber
NPC-Ansprache; Hedda heilt kostenlos; Mile-Wucher 2,5x;
Herzcontainer/Tasche einmalig; c/G-Umwidmung + zwei tote
Alt-Waechter; NPC-Kollision ueber solide Kacheln; Reden auf
Angriffs-Pegel; Save-v2-Migration verlustfrei (A1-bewiesen).
