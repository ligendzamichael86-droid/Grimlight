# Slice 6 — Uebertrag aus Phase 1 an Phase 2 (ENGINE) und Phase 3 (INTEGRATOR)

Stand 15.08.2026, nach Commit f48833e (Phase 1 GRUEN, 0 Blocker,
1 Fix-Runde). Quellen: Workflow-Reports Bau/Sanktion/V-TESTS/V-SPEC.

## An PHASE 2 (ENGINE, main.js — einziger Besitz)

1. Verdrahtung nach SPEC §2.2-Stellenliste: States 'dialog' + 'shop',
   NPC-Spawning aus mapDef.npcSpawns (Konvention {x,y,id}, AABB-Zentrum
   Weltpixel), updateNpcs-Aufruf + {nahe}-Hinweisblase (gfx-Schluessel
   npc_blase — NICHT npc_bubble, wurde in der Fix-Runde angeglichen),
   Reden auf Angriffs-Pegel + attackSwallow, Trank-Schlucker im Dialog.
2. Quest-Beobachter NUR in main.js: Kill-Zaehler je Karte+Sorte ueber
   die AUDIO_STATE-WeakMap (die-Uebergang traegt e.kind), Dialog-
   Abschluss aus dialog.js-Rueckgabe, bossDead aus runFlags.
   quest.js-API: questAnnehmen hat ein OPTIONALES drittes Argument
   runFlags (behebt Boss-vor-Corm-Softlock bei Q3 — nutzen!).
3. Save-v2-Kopierstellen: resetRun LEERT alle vier Felder
   {npcFlags,quests,gekauft,dorfBesuche}; ladeSpielstand kopiert alle
   vier feldweise; dorfBesuche-Zaehler bei buildWorld(DORF) via Portal
   (carry) inkrementieren.
4. A/B/W-Touchzonen visible:false im State 'dialog' UND im State
   'shop' (Muster pause.visible). Damit wird die V-SPEC-MINOR-
   Ueberdeckung SHOP_BTN_HANDEL/W-Zone gegenstandslos; der irre-
   fuehrende Kommentar in shop_ui.js:~108 ("KEINE UEBERDECKUNG...")
   ist dabei zu korrigieren.
5. Flip-Liste main.js:94-105: die npc_*-Keys ANS ENDE anhaengen
   (npcs.js drawNpc sucht `${key}_flip`; ART lieferte frontal, 16
   npc_-Sprites 5x_0/5x_1/5x_talk/npc_blase). Ohne Anhang bleibt
   facingLeft wirkungslos (heute stiller Fallback frontal — spielbar,
   aber Blickrichtung sichtbar machen ist gewollt).
6. Steh-NPC-Kollision: Anker stehen auf begehbaren Kacheln (WORLD-
   Entscheid); Durchdringung Spieler/NPC ist spec-deklariert — KEINE
   Solid-Kachel nachziehen, Verhalten so lassen.

## An PHASE 3 (INTEGRATOR)

7. Der komplette §7.A-ADDITIV-Block fehlt planmaessig noch:
   v1-ROHFIXTURE-Boot in check_save, v2-Default-Boot, DORF-Zeile in
   §36 (sol/geo/ambient-Haertung), Gegnerfrei-Gate, Shop-Geometrie-
   Gate (>=6 mm), Dialog-Touch-Ausblendungs-Gate, Kill-Zaehler-Gates,
   ladeSpielstand-Feldvergleich.
8. save.js Schreiben/Pruefen-Asymmetrie: 1/10 behoben (quests-Status
   gefiltert); NEUN Faelle offen, in denen serialize ungefiltert
   schreibt, was deserialize ablehnt -> haerten (sonst kann ein
   korrupter Laufzeit-Zustand einen nicht mehr ladbaren Stand
   schreiben).
9. G3-Stroh-Nachweis auf der richtigen Ebene: B < 60 % der Highlight-
   Texel IM D5-MESSFENSTER (Playwright-Realmessung), nicht nur je
   Dachgrid. dorf_segel weicht von der Eichungs-Blaupause ab
   (Deckung 54,5 % statt 39,2 %) — G4-Nachrechnung mit echter Art war
   trotzdem gruen (alle 5 Szenen im Band 56..69, eichung_nachrechnung
   .json), Realmessung bleibt Pflicht (M1/E1/L<16 gegen die
   eingefrorenen Werte).
10. .tmp/check_gp6_art_self.mjs: 5 ROT von 428 (HEAD hatte 3; neu:
    "SPRITES byte-unveraendert" + Folge) — GP6-Selbstpruefer, durch
    legitimen Sprite-Zuwachs abgeloest; als abgeloest DEKLARIEREN,
    nicht reparieren. Ebenso .tmp/check_world_slice1 weiterhin tot
    (Dorf-Zeilen 44 Zeichen gegen 40er-Annahme — Alt-Sonde).

## Deklarationen aus Phase 1 (fuer Uebergabe/Jury)

- 'Graeberklinge' (Bestands-Item) enthaelt die Flusstest-Sonde
  'berklinge' und erscheint in Brans Auslage — Bestandsstring, kein
  neuer Text, deklariert.
- Mile wuerfelt NIE selten (PHASE0 §1 woertlich: Selten-Chance nur
  fuer BRANS Angebote).
- Q4-Hinweis kann auf eine bereits geoeffnete Truhe zeigen
  (openedChests) — narrativ unschaedlich ("vergessen" bleibt wahr),
  deklariert.
- Stroh-Moos bringt Gruentoene in Over-Grids — durch G3 sanktioniert,
  schlaegt die aeltere PHASE0-Notiz "einzige Gruentoene auf dem Weg".
- Dach-Loecher der verlassenen Katen sind OPAK (dunkles Inneres mit
  Sparren) statt transparent — bewusst, sonst blitzt die Wandkachel
  durchs Dach.
- dorf_dach_a_m ist kein reiner Spiegel (Alterung Speicher-Dach),
  Lichtrichtung bleibt oben-links in beiden.
- Paletten-Schluessel 'c' wurde im Objekt in die Holz-Rampe
  umsortiert (kein Waechter haengt an der Reihenfolge — geprueft).
