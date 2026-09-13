# GP7-CH-2 PHASE 1 — GEMEINSAMER RAHMEN (Fable, 12.09.2026)

Spiel: Grimlight, /home/coder/Grimlight, 320x180 Canvas, SNES-Look. Pass GP7-CH-2 "Die Horde wird lesbar",
Phase 1, ART-FIRST nach CH-1 Rev 2.2/2.3 (Versuch 1 von CH-1 scheiterte, weil Zeichner ihre Bilder nicht sahen).

PFLICHT-LEKTUERE (in dieser Reihenfolge):
1. design/SPEC_GP7CH2.md — Rev 1 §0-§8 + REV 2 (E-A Engine, E-B Kunst-Gates, E-C Umfang/Palette, E-D Abnahme). Rev 2 schlaegt Rev 1.
2. design/GP7CH2_PHASE0.md — Rev-2.1-Entscheide (R-A1..R-A10, R-B1..R-B8, R-C1..R-C4, R-D1) + V-P0-Aufloesungen P1-P15 + GEBUNDENE ZAHLEN (Toene, Fenster, Vorher-Tabelle, Ziel-Profile, Innenraum-Ziele, Horden-Anker). Diese Zahlen schlagen Rev 2.
3. design/GP7CH2_LANDKARTE_C_ZIELBILD.md — §0 Befunde, §1 H1-H8 Techniken, §2 STECKBRIEFE (BINDEND, mit V3-Korrektur Hund), §4 Flash-Spezifikation.
4. design/GP7CH1_ANKER_HELD.md — 10 Erbregeln (BINDEND fuer jede Figur).
5. design/SPEC_GP7CH1.md — Rev 2.2 M1 (Art-first) + Rev 2.3 G-B (Schwarz-Lesart), G-C (Merkmal), G-F (Flip-Falle).
6. design/GP7CH2_LANDKARTE.md — Vorentscheide V1-V13; Teil A (GP7CH2_LANDKARTE_A_ENGINE.md) nach Bedarf.
7. game/js/art/palette.js — 86 Toene; die 8 neuen (" $ / < > { } Backtick) mit Rollen/Rampen kommentiert.
8. design/referenz/gp7ch2/ — die eingefrorenen VORHER-Boegen (Figuren-Bogen Gegner, Horden-Tafeln A-D) + README. Blindtest-Aufloesung NICHT lesen.
9. .tmp/gp7ch_p0/gegner_material_IST.json — Format der Material-Tabelle (GP7CH2/MATERIAL-TABELLE/1).

WERKZEUGE:
- node .tmp/gp7ch_p0/figuren_messung.mjs --beides            (alle Gegner-Gates, Vorher/Nachher; Material-Tabelle: --material-gegner <pfad.json>)
- node tools/figuren_bogen.mjs --modus nachher --out <dir>     (Figuren-Bogen Menschen + Gegner, 1x/6x/squint, 4 Boeden)
- node tools/horden_bogen.mjs --etikett nachher --out <dir> [--squintblind] [--tafel A|B|C|D] [--boden gruft|gras] [--rim|--flash|--grau nur Vorschau]
  Erfolg = "HORDEN-BOGEN FERTIG" / "FIGUREN-BOGEN FERTIG"; Fehler = "FEHLER:"; Exit-Codes nie glauben.
- node .tmp/check_gfx6_art.mjs (GP6-ART-CHECK GRUEN, inkl. GP7CH2-Masstabelle + Decal-Masse), node tools/smoke_test.mjs (825 ok + evtl. neue additive Gates des Engine-Agenten), node .tmp/check_engineB_gp6.mjs.
- 12x-Crops fuer die Sichtkontrolle: eigenes kleines Node-Skript (Muster: .tmp/gp7ch_held2/render.mjs oder Kopie von tools/figuren_bogen.mjs) nach .tmp/gp7ch2_p1/<DEIN-KUERZEL>/.

EISERNE REGELN (alle Agenten):
- KEIN git add/commit (Fable committet). Keine Server ausser dem dir zugewiesenen Port; 8123 tabu. Exit-Codes nie glauben, Ausgaben zitieren.
- MUTEX fuer game/js/art/sprites_figuren.js (DREI Agenten schreiben in diese Datei): vor JEDEM Schreiben `mkdir /home/coder/Grimlight/.tmp/gp7ch2_p1/LOCK` (bei Fehlschlag 2 s warten, erneut, max 120 s; dann melden), dann Datei FRISCH lesen, NUR deine eigenen Key-Bloecke per gezielter Ersetzung patchen (regex auf `^  <key>: [` bis zur schliessenden `],`), schreiben, sofort `rmdir /home/coder/Grimlight/.tmp/gp7ch2_p1/LOCK`. Lock nie laenger als 60 s halten. NIEMALS die ganze Datei aus einem alten Stand zurueckschreiben. Fremde Keys sind TABU.
- Groessenleiter FEST (V8/§0.3): skeleton_* 16x16, hound_* 16x12, ghoul_* 16x20, rust_* 20x18 (NEU, Zeichner B), warden_* 24x32, shield_side 6x12 / shield_up+down 12x6. AABB nie anfassen. Flip-Liste main.js:106-128 unangetastet; keine Decal-Flips.
- *_decal-Keys (skeleton_decal, ghoul_decal, hound_decal, rust_decal) legt NUR der Engine-Agent an (provisorisch, am ENDE von SPRITES). Zeichner ersetzen nur den INHALT unter dem Mutex; existiert der Key noch nicht, warten (poll 30 s), nicht selbst anlegen. Kein warden_decal (§8).
- Sanktionierte Test-/Werkzeugstellen NUR fuer den Engine-Agenten (§5). Zeichner aendern keine Tests, keine Werkzeuge, keinen Spielcode ausser den eigenen Grids.
- Spieldynamik bleibt: keine Balance/Tempo/Spawn/KI-Aenderung (V13, Michael 16.08.).
- Server: 2 Kerne, drei Agenten parallel — schwere Suiten (smoke) nur wenn noetig, nacheinander; Rendern ist billig.
- Finaler Text = Rohdaten-Report mit den Abschnitten ## OK / ## REPORT / ## ABWEICHUNGEN (ehrlich: was NICHT erreicht wurde und warum).
- LEHRE 12.09. (Zeichner A): beim Patchen von sprites_figuren.js NIE String.replace mit einem Ersatztext benutzen, der '$' enthaelt ('$'' = "alles nach dem Treffer" -> Datei verdreifacht). Nur Funktions-Ersetzung (replace(re, () => text)) oder Konkatenation; nach jedem Schreiben: Import + Key-Zaehlung (jeder Key genau 1x).
