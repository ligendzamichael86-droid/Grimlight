# Slice-6 Spec-Review (14.08.2026, wf_bb3d6861-f48)


---

# PRÜFER 1: Tests & Bestand

## SPEC-REVIEW SLICE 6 (Rev 1), LINSE 1 "Tests & Bestand"

Basis: HEAD `6ec7f5b`, alle Suiten heute nachgemessen (keine Spieldatei berührt, kein Port belegt):
`smoke GRÜN (7632 Ticks)` · `check_save_slice4 GRÜN (48)` · `check_main_slice1 25` · `check_inventory_slice2 25` · `check_boss_slice3 33` · `check_gfx6_art GRÜN` · `probe_god GRÜN` · `.tmp/check_builderA_slice3 GRÜN (91)` · `.tmp/probe_s4_engine GRÜN` · **`.tmp/check_world_slice1 ROT (Bestand, CATACOMBS-Truhe/Fackel)`**.

---

### BLOCKER

**B1 (§0.1, §5) "die 48 Bestands-Assertions bleiben byte-gleich" ist widerlegt.**
Beleg: `tools/check_save_slice4.mjs:235` `ok(!!s1 && s1.v === 1, '§3.1 Boot 1: Stand traegt Schema v1')`. `s1` ist **kein Fixture**, sondern der Stand, den das laufende Spiel in Boot 1 über `visibilitychange` schreibt (`:224-235`), und `save.js:61` schreibt `v: SAVE_VERSION`. Mit `SAVE_VERSION = 2` ist diese Assertion ROT. Die Landkarte A 5.2 ("die übrigen 47 Assertions sind versionsagnostisch") hat diese Zeile übersehen, die Spec hat den Fehler geerbt.
Fix: `:235` namentlich sanktionieren (`s1.v === 2`, Marker S6-§7B) und den v1-Beweis als **neuen** Boot mit rohem v1-Fixture führen, nicht über den vom Spiel geschriebenen Stand.

**B2 (§0.1, §5) Boot 4b kippt zwingend.**
Beleg: `check_save_slice4.mjs:335` setzt `{...JSON.parse(standNachBoot1), v: 2}` und `:340` verlangt `!hatText('FORTSETZEN')`. Unter v2 ist dieses Fixture ein **gültiger** Stand (es entsteht aus einem v2-Stand), das Menü erscheint, ROT.
Fix: Fixture auf `v: 3` heben (Ablehnungs-Test bleibt scharf), Zeile als zweite Sanktion listen.

**B3 (§0.1, §7.B) Zwei weitere Bestandszeilen im smoke sind unvermeidlich.**
Beleg: `tools/smoke_test.mjs:4130-4131` `SAVE_KEY === 'grimlight.save.v1' && SAVE_VERSION === 1` und `:4191` `kaputt('fremde Schema-Version', d => d.v = 2)` erwartet `null`. §7.B sanktioniert **nur** `smoke:2150`.
Fix: §7.B auf vier Stellen erweitern (smoke:4131, smoke:4191, check_save:235, check_save:335-341), je mit Marker und git-diff-Beleg.

**B4 (§0.1, §7.B) Der geo-Golden liegt an ZWEI Orten, nicht an einem.**
Beleg: `smoke_test.mjs:2150` (GOLD.GRAVEYARD.geo) **und** `smoke_test.mjs:3571-3572` (§7F(i) prüft dieselben Hashes hart gegen die Zeichenketten). Ein Portal in `GRAVEYARD.portals` geht über `po: def.portals` (`:2168`) in den Hash. Die Formulierung "git-diff EINE Zeile" ist nicht erfüllbar; Landkarte A 6.2/6.3 sagt das ausdrücklich, die Spec hat es verloren.
Fix: §0.1 und §7.B auf "genau zwei geo-Zeilen (smoke:2150 und smoke:3572), ein sol-Hash unverändert" ändern.

**B5 (§6.1) "Mass NUR 48x32/64x48/64x32 (Masstabelle unangetastet)" ist technisch unmöglich.**
Beleg: `check_gfx6_art.mjs:122-135` und `smoke_test.mjs:1732-1747` matchen über **Key-Muster** (`/^tree_canopy_xl_b.../`, `/^canopy_shadow_xl_.../`), Default `return [16,16]`. Ein Dach-Key `dorf_dach_a` mit 48x32 fällt in den 16x16-Default und macht **beide** Wächter ROT, egal ob die Größenklasse existiert. Größenklassen zu treffen genügt nicht, der Name muss getroffen werden. Betrifft Dächer, `shadowArt`-Bakes (`tilemap.js:760-763`, `sw*16 x 32`) und das Marktsegel.
Fix: je eine sanktionierte Musterzeile pro Wächter (z. B. `/^dorf_(dach|segel)_[a-z](_m)?$/ → 48,32`, `/^dorf_bake_.../ → 48,32`), Gegen-Gate `smoke:1756-1759` bleibt grün (Klassen wachsen nicht). Alternative: keine Over-Spans, dann entfällt aber die GP6-Dach-Transparenz, die §6.1 als "gratis" verbucht.

**B6 (§0.1, §6) Die 5. Karte kippt eine heute grüne Suite, die die Spec nicht erwähnt.**
Beleg: `.tmp/check_builderA_slice3.mjs:55` `ok('MAPS hat 4 Eintraege', Object.keys(MAPS).length === 4 && ...)`, heute grün (91 Prüfungen, nachgemessen). Landkarte A 6.2 nennt sie ("bewusst entscheiden"), Spec §0.1/§7 schweigt, §7.C verbietet zugleich "alles andere Bestehende".
Fix: entweder Zeile sanktionieren (4 → 5) oder die Suite als abgelöst deklarieren, mit Beleg wie bei check_gfx5_art.

---

### MAJOR

**M1 (§5) Save v2 kann `.tmp/probe_s4_engine.mjs` (heute GRÜN) mitreißen.**
Beleg: `:446` und `:482-485` bauen Stände **von Hand** aus `basis` plus `runFlags: { bossDead, openedChests }`, also v2-förmig, aber **ohne** `quests/npcFlags/gekauft`. Verlangt `runFlagsOk` (`save.js:131-136`) die neuen Felder auf dem v2-Pfad, liefert `deserialize` null, das Titel-Menü fehlt und mehrere Assertions kippen.
Fix: §5 verbindlich festschreiben: die neuen runFlags-Felder sind **auf beiden Pfaden optional mit Default** (fehlend = leer), nicht nur bei der v1-Migration. Zusatz-Gate in A1: "v2-Stand ohne Quest-Felder lädt".

**M2 (§2.2) Die Dialogbox liegt exakt auf den Touch-Knöpfen.**
Beleg: Box `16..304 / y 120..172` gegen `input.js:107-112` A (288,148,r16 → 272..304 x 132..164) und B (252,144,r12 → 240..264 x 132..156). `hud.js:523-524` zeichnet Knöpfe ohne `visible`-Flag (nur `visible === false` überspringt; A und B tragen das Feld gar nicht), und der Zeichner läuft in `drawWorld` vor jedem Overlay in `render()`. Auf Michaels Handy liegt die Box über A und B.
Fix: Box-Unterkante auf ≤ 128 ziehen oder A/B im Zustand `dialog` per neuem `visible`-Feld ausblenden (dann ist es eine weitere main.js-Stelle, Muster `input.touch.pause.visible`, `main.js:1663`).

**M3 (§3.1 gegen §3.2) Taschen-Erweiterung 7 → 10 ist im Inventar nicht darstellbar.**
Beleg: `inventory_ui.js:53-54` `ROW_H 17`, `ROWS = 7` (hart), Liste 26..145, Knopf 145..167; Tap-Hittest `:132-138` prüft `< LIST_Y + ROWS*ROW_H`; der Cursor klemmt dagegen auf `items.length - 1` (`:104-105`), läuft also mit 10 Items unsichtbar aus der gezeichneten Liste. §3.2 friert das Panel gleichzeitig ein ("Inventar-Panel TABU"). Dazu die Bestands-Deklaration `uebergaben/2026-08-13_slice4_mobile.md:2`: schon bei 7 Items überlappt die Liste den ANLEGEN-Knopf.
Fix: entweder Ware streichen (Preis/Leistung wandert auf Herzcontainer und Tränke) oder das Panel als sanktionierte Bestandsänderung öffnen (Blättern), was §3.2 heute ausschließt. Beides muss in §9 deklariert werden.

**M4 (§6.2) Der Portalort ist unbelegt und widerspricht drei Quellen.**
Beleg: Spec sagt "GRAVEYARD-Sued <-> DORF-Osttor". `GDD.md:38` sagt "oben das sterbende Dorf"; Landkarte A 6.3 empfiehlt **probenbelegt** Nordtor `(4,1)/(5,1)`; Landkarte B 3.2 empfiehlt V1 auf der Wegkachel `(1,12)` im **Westen** ("du kommst aus dem Dorf", `maps.js:621` `playerSpawn = tc(3,12)`). Süd-Ausgang plus Ost-Eingang ist zudem in sich verdreht. Die Sondenmessung deckt genau die vier Suiten-Routen ab, nicht die willkürliche Süd-Kachel. Da dies die **einzige** sanktionierte geo-Änderung ist, muss die Kachel exakt benannt und belegt sein.
Fix: Kachel zeilengenau festlegen (Empfehlung: Landkarte-B-V1 `(1,12)`, Torbogen als Over-Kachel = sol- und geo-neutral), Sondenlauf wiederholen und in §6.2 als Beleg zitieren.

**M5 (§6.1) `swayPoses`-Segel kostet 8 Grids, nicht 2.**
Beleg: `tilemap.js:739-757` wirft, wenn `swayPoses` nicht **genau 8** Einträge hat, kein `span > 1` vorliegt oder `poses[0] !== art`. Landkarte B 1.2 hat den Marktstand mit "Segel 48x32 + `_m`" = 2 Grids budgetiert, das Volumen §6.4 (~70 Grids) baut darauf auf.
Fix: entweder statisches Segel (kein `swayPoses`) oder +6 Grids ins Budget und in die Maßtabellen-Sanktion (B5) aufnehmen.

**M6 (§5) Der Ladepfad ist nicht benannt.**
Beleg: `main.js:1219-1229 ladeSpielstand` kopiert **feldweise** nur `bossDead` und `openedChests`; `resetRun` (`:1205-1212`) ebenso einzeln. §4 nennt nur resetRun. Ohne Nachzug in `ladeSpielstand` scheitert der A1-Beweis "jeder gültige v1-Stand lädt verlustfrei, Feld für Feld" an der letzten Station, und Quest-Flags eines vorherigen Runs stehen stehen.
Fix: §5 explizit auf `save.js` + `main.js:1205-1212` + `main.js:1219-1229` erweitern, mit A1-Gate "geladene Quest-Felder identisch zum Stand".

**M7 (§2.2) `audioGeduckt` bleibt unentschieden.**
Beleg: `main.js:1244` `audioGeduckt = next === 'paused' || next === 'inventory'`. Landkarte A 2.2 (4) verlangt ausdrücklich eine Entscheidung. §9 deklariert sie nicht, damit trifft sie ein Bau-Agent.
Fix: in §9 deklarieren (Vorschlag der Landkarte: nicht ducken).

---

### MINOR

**m1 (§6.1)** `DORF` muss `skeletonSpawns: []` und `ghoulSpawns: []` **führen**, nicht weglassen: `main.js:1113-1116` ruft `mapDef.skeletonSpawns.map(...)`/`ghoulSpawns.map(...)` ungeguardet (nur `enemySpawns` ist `|| []`), und `geoHash` (`smoke:2164-2171`) liest zusätzlich `propSpawns`, `portals`, `torchChars`. Spec sagt nur "KEINE enemySpawns". Auch das Gegnerfrei-Gate der Landkarte greift sonst auf `undefined.length`.

**m2 (§6)** 44x28 ist haltbar, die Landkarte widerspricht sich aber: A 6.2 nennt `.tmp/check_world_slice1.mjs:40-42` ("DORF muss 40x24 sein") als bindend, B 5.2 spezifiziert 44x28. Gemessen: **check_world_slice1 ist am HEAD bereits ROT** (CATACOMBS-Truhen/Fackel-Assertions), also kein Wächter. Spec sollte das namentlich erklären, sonst "repariert" ein Bau-Agent die Kartengröße.

**m3 (§3.1)** Trankkauf braucht die Deckelregel: `player.js:68 maxPotions = 3`; heute füllt nur `entities/` auf (TABU) und `enemies.js:590-597` wandelt bei vollem Beutel in +2 Gold. Ohne Regel verschwindet gekauftes Gold folgenlos.

**m4 (§6.2)** "Respawn im Dorf = Torwaechter-Anker" ist mehrdeutig. Der Todespfad (`main.js:2053-2054`, Gold-Halbierung plus `buildWorld(currentMapKey, lastSpawn, true)`) wird in `check_main_slice1:275-284` und `check_boss_slice3:256` gemessen. Spec muss deklarieren: Eintritts-Spawn, **kein** Eingriff in den Todespfad.

**m5 (§3.2)** "Tap-Zonen >= 6 mm" ist unbelegt messbar: `smoke:4047` misst ausschließlich `input.touch`-Kreise, keine UI-Rechtecke. A1 braucht ein additives Shop-Geometrie-Gate (Muster `smoke:5352-5361` für PAUSE_MENU_ZONES), sonst ist die Zusage nicht prüfbar.

**m6 (§0.2, §8)** Neue Module fallen zusätzlich unter `smoke:5218-5234` (in `game/js/**`: null `.stop()`, genau ein `.start()`) und `tools/check_syntax.sh`. Trivial einzuhalten, gehört aber in §0.2 neben den 5189-Wächter.

**m7 (§2.2)** Die Zustands-Stellenliste ist unvollständig um den Lifecycle: `pausiere()` bricht bei `state !== 'playing'` ab (`main.js:1362`), `systemPause()` (`:1374-1376`) speichert also im Dialog, pausiert aber nicht; `input.touch.pause.visible` (`:1663`) macht den Pause-Knopf im Dialog unsichtbar. Beides ist Präzedenz aus `inventory` und vermutlich akzeptabel, muss aber deklariert sein, weil A4 den App-Kill prüft.

---

### GEPRÜFT UND HALTBAR (keine Änderung nötig)

- **§0.2 npcs.js ohne Events:** `smoke:5188-5197` liest `jsDateien('game/js/entities')` **rekursiv über alle** Dateien, sammelt aber nur `events.push('x')`, `events.push({type:'x'`, `deathEvent:'x'`. Eine Datei ganz ohne diese Muster trägt nichts bei, `typen.size >= 14` wird von Bestand getragen. Kopf-Importe `smoke:20-27` benennen Module einzeln, keine Verzeichnis-Aufzählung. Eine neue `entities/`-Datei bricht dort nichts.
- **§0.4 Sperrliste:** vollständig gegen die echten Sonden. Scharf sind nur Negativ-Sonden und die Erst-Treffer-Sonden (`check_main:123-124`, `check_inventory:170/214`, `check_save:178-179`, `goldText = texts().find(s => s.startsWith('GOLD'))`). `check_inventory_slice2:331 'HERZ 3  SCHADEN 2  TEMPO 100%'` ist eine **Positiv**-Sonde per `includes` auf einem einzelnen fillText, keine Gleichheit, und muss deshalb **nicht** auf die Sperrliste. `smoke:5376` bindet nur `drawPause`. Die Regel "kein GOLD-Anfang vor drawHUD" trifft die Erst-Treffer-Falle korrekt.
- **§7.A additive DORF-Zeile in §36:** ja, additiv. `smoke:2172` iteriert `Object.keys(GOLD)`, `AMBIENT` ist ein Lookup; je ein Eintrag genügt, die Schleife bleibt unberührt, 0,28 hält die Paarweise-Verschiedenheit (0,22/0,55/0,52/0,48).
- **§2.3 Angriffsverhalten ohne NPC:** `attackSwallow` (`main.js:1685-1692`) steht vor der Zustandskette; auf den vier Bestandskarten bleibt `npcs` leer, damit byte-gleich, solange `updateNpcs` weder Eingaben verbraucht noch Events pusht. Kein Flusstest erreicht einen NPC (DORF existiert dort nicht) - vorbehaltlich M4.
- **§2.2 Musik:** `musikFuerZustand` (`main.js:843-851`) fängt `'dialog'` im `else if (mapDef)`-Zweig, Kartenmusik läuft, keine Änderung nötig.
- **§3 Händler-Mechanik:** `rollItem(rng = Math.random, opts)` (`items.js:55`) ist saatfähig; `addItem` liefert `false` bei voller Tasche (`items.js:87-92`); `player.gold` wird bereits ausschließlich in `main.js` geschrieben (`:1102/1110/1351/1906/2053`), der Abzug braucht kein `entities/`; `save.js:108` validiert capacity 1..64 ohne Schema-Änderung.
- **§0.5 c/G-Umwidmung:** kein grüner Wächter bindet die Hexwerte. `check_gfx6_art:58-79` bindet nur die 10 Offset-Töne, 3 Symbole, 61 alnum-Schlüssel; `check_art_gfx3:57` (G) und `dev_art_slice2:124` (c) liegen in `.tmp` und sind abgelöst. Deklaration in §0.5 ist korrekt.
- **§0.9 Song-Pflicht:** `songs/index.js:33-37` wirft; `smoke:4923-4927` prüft die 8 Pflichtschlüssel per `every`, ein 9. Schlüssel ist additiv erlaubt, muss aber die Peak-Gates `smoke:5058-5064` und das Summen-Gate `:5087` bestehen. Reihenfolge in §8 (AUDIO parallel zu WORLD, ENGINE danach) ist tragfähig, sofern der Song-Stub mit `map_dorf.js` zusammen eincheckt.

---

**Bilanz:** Rev 1 ist in Systemzuschnitt und Sperrlisten belastbar, aber testseitig falsch bilanziert: 6 Blocker (vier unsanktionierte Bestandszeilen für Save v2, der zweite geo-Golden, die namensgebundene Maßtabelle, die 4-Karten-Assertion) plus 7 Major, davon drei mit echtem Spielschaden (Dialogbox über den Touch-Knöpfen, capacity 10 ohne Anzeige, unbelegter Portalort) - Rev 2 muss §0.1/§7.B von "eine Sanktion" auf "sechs benannte Sanktionen in vier Dateien" umstellen.


---

# PRÜFER 2: Systeme/Content

# LINSE 2 — SYSTEME/CONTENT-MACHBARKEIT · SPEC_SLICE_6.md Rev 1

Basis HEAD 6ec7f5b, alles read-only nachgemessen, keine Spieldatei berührt, kein Port belegt. Zwei Bestandsprüfungen habe ich zur Belegsicherung ausgeführt (`node .tmp/check_world_slice1.mjs`, `node .tmp/check_builderA_slice3.mjs`).

---

## BLOCKER

**B1 — §0.5 / §9.M1: Der Sättigungs-Deckel verbietet exakt das Biom, das §6.4 vorschreibt.**
Beleg: Die Projekt-Formel ist `S = (max-min)/max` (HSV), wörtlich festgeschrieben in `game/js/art/palette.js:118-120` (Wasser-Präzedenz gegen Gras `A`). Damit gilt für den Fackelkern `1` (`palette.js:96`, `#ffe9b0`): **S = 79/255 = 0,310**. Gegenprobe der Töne, die §6.4 dem Dorf zuweist: Holz `q/j/Q/J` (`palette.js:178-181`) = 0,500 / 0,553 / 0,577 / 0,574; Rost `4/5/6` (`:187-189`) = 0,702 / 0,748 / 0,734; und selbst das Bestandsgras `A` (`:74`) = 0,378 — das auf der Dorfwiese unvermeidlich liegt. §0.5 wie geschrieben macht jede einzelne Dorfkachel regelwidrig, inklusive der bereits existierenden.
Fix: Referenzton auf `o` Fackel-Orange (`palette.js:93`, S = 174/216 = **0,806**) umstellen, Deckel NUR auf neue/umgewidmete Töne anwenden, Zahl nennen. Konkrete Formulierung für Rev 2: *„Für jeden umgewidmeten oder neu gesetzten Dorf-Ton gilt S = (max−min)/max ≤ 0,60; kein Dorf-Ton erreicht S('o') = 0,806. Die Bestandsrampen Holz (≤ 0,577), Rost (≤ 0,748) und Gras (≤ 0,378) sind namentlich bestandsgeschützt."* Ohne Formel + Zahl + Bestandsschutz ist §9.M1 für Michael nicht entscheidbar und für den Builder nicht messbar.

**B2 — §7 / §0.1: Die fünfte Karte macht einen heute GRÜNEN Wächter rot, den §7.C verbietet anzufassen.**
Beleg: `.tmp/check_builderA_slice3.mjs:55-56` `ok('MAPS hat 4 Eintraege', Object.keys(MAPS).length === 4 && ...)`. Gemessen JETZT: `91 Pruefungen bestanden. ALLE GRUEN`. `maps.js:737` registriert genau vier. DORF ⇒ ROT. §7.B sanktioniert **genau eine** Änderung (geo smoke:2150), §7.C verbietet alles andere Bestehende.
Fix: als sanktionierte Änderung #2 mit git-diff-Beleg und Marker `S6-§7B` aufnehmen (`4` → `5`, plus `MAPS.DORF`), oder die Datei begründet für tot erklären. Nicht schweigen — der Bau bricht sonst in Phase 3.

**B3 — §5 / §0.1: SAVE_VERSION 2 kollidiert mit drei Bestands-Assertions; §0.1 verspricht gleichzeitig Byte-Gleichheit.**
Beleg, alle drei verifiziert: `tools/smoke_test.mjs:4130-4131` (`SAVE_KEY === 'grimlight.save.v1' && SAVE_VERSION === 1`); `smoke_test.mjs:4191` `kaputt('fremde Schema-Version', (d) => { d.v = 2; })` erwartet `null`; `tools/check_save_slice4.mjs:334-341` Boot 4b setzt `{...v:2}` und verlangt `!hatText('FORTSETZEN')`. §0.1 sagt wörtlich „die 48 Bestands-Assertions bleiben byte-gleich" — mit v2 ist das arithmetisch unmöglich (:341 ist eine der 48).
Fix: §0.1 korrigieren auf „47 der 48 bleiben byte-gleich, :335-341 ist Sanktion #4" und §7.B um drei zeilengenaue Sanktionen erweitern. Andernfalls ist §5 nicht baubar.

**B4 — §4 / §0.2: Zwei der fünf Landkarte-Quests brechen die Tabu-Liste bzw. haben keinen Eigentümer.**
Beleg: Q2 „Brans Werkzeug" braucht laut Landkarte-B §5.5 „genau einen neuen `content`-Wert" — der Dispatch steht in `entities/props.js:64-101`, und §0.2 erklärt `props.js` ausdrücklich für TABU. Q4 „Die Nachtwache" braucht einen Zweig in `portalBlocked` (`world/maps.js:749-765`); §8 gibt WORLD nur „maps.js Portal/Registrierung", §7 sanktioniert nichts davon, und über der Funktion liegen 6 Bestands-Assertions (`smoke_test.mjs:1494-1505`).
Fix: §4 muss die baubare Menge NAMENTLICH nennen. Baubar ohne Tabubruch sind Q1 (mit M9-Fix), Q3 (null neue Mechanik) und Q5 (nur Dialogflags) — das erfüllt „3-5 Quests" exakt an der Untergrenze. Wenn Q2/Q4 gewollt sind: `props.js` für **einen** additiven `else if`-Zweig öffnen bzw. `portalBlocked` um einen optionalen 4. Parameter erweitern (die 6 Alt-Aufrufe mit 3 Argumenten bleiben grün) — beides mit Sanktionsmarker.

**B5 — §2 / §0.3: „Reichweite+Blickrichtung" ist nicht nur vage, die naheliegende Lesart funktioniert numerisch NICHT.**
Beleg, durchgerechnet: Spieler-AABB 12×14 (`entities/player.js:56-57`), Spawn = AABB-Zentrum, NPC steht mittig auf einer soliden Kachel. Steht der Spieler gegen die Kachel gepresst, beträgt der Mittenabstand **15 px vertikal / 14 px horizontal** — der einzige „Reichweite"-Präzedenzfall `stats.reach = 12` (`items/items.js:17`) und `PICKUP_RADIUS = 12` (`enemies.js:24`) liegen darunter. Ein Test „Abstand < reach" feuert also NIE; talkbar wäre der NPC erst mit dem Affix `+4 REICHWEITE`.
Fix: die Schwert-Geometrie wörtlich übernehmen und in §2.3 hinschreiben: Trefferbox = Quadrat `SWORD_SIZE = 16` (`player.js:15`), Zentrum bei `(cx,cy) ± reach` in `player.facing` (`player.js:166-175`), Test `aabbOverlap(box, npc)` (`entity.js:9-11`). Nachgerechnet: vertikal Box T+4..T+18 gegen NPC T+1..T+15 → Überlappung; horizontal S−2..S+14 gegen S+2..S+14 → Überlappung. Beides trägt. `facing` ist vierwertig ohne Diagonalen (`player.js:151-152`) — auch das gehört in die Spec, sonst baut der Builder einen Winkeltest.

---

## MAJOR

**M1 — §2.2: Die Dialogbox liegt deckungsgleich auf drei LEBENDEN Touch-Zonen, und es fehlt der Trank-Schlucker.**
Beleg: Box x 16..304 / y 120..172. B-Zone (Trank) `{x:252,y:144,r:12}` (`core/input.js:107-109`) = x 240..264, y 132..156 — vollständig in der Box. Die reale Angriffszone ist nicht der A-Kreis, sondern die **ganze rechte Bildhälfte** (`input.js:243-247`: `else attackIds.add(...)` nach `p.x < VIEW_W/2`). Die linke Hälfte bis `JOY_FIELD_Y1 = 156` (`input.js:49`) eröffnet eine Joystick-Basis. Zeichnerisch liegt die Box OBEN, weil `drawHUD` am Ende von `drawWorld` läuft (`main.js:2440`) und Overlays danach (`:2454-2470`) — die Knöpfe sind also unsichtbar, aber scharf.
Der harte Fehler: es gibt keinen Trank-Schlucker analog `attackSwallow`. `player.js:116-117` rechnet `potionEdge = !!input.potion && !potionHeld`, und `potionHeld` wird ausschließlich in `player.update` nachgeführt — das in der harten Pause nicht läuft. Ein durch den Dialog gehaltener Finger auf der B-Zone trinkt im ersten Frame nach dem Schließen einen Trank.
Fix, vier Punkte in §2.2: (a) `attackSwallow = true` **beim Öffnen UND beim Schließen** (Muster `main.js:1975`); (b) ein `potionSwallow` derselben Bauform; (c) `input.hudBoxVisible = false` im dialog-Zweig (Muster `main.js:1980`, sonst bleibt die HUD-Box-Zone mit ihrem letzten Wert scharf und öffnet nach dem Schließen das Inventar); (d) Box auf **y 96..148** heben — dann liegt sie über der B-Zone-Oberkante nicht mehr deckungsgleich und komplett über dem Gestenstreifen.

**M2 — §2.2/§3.2: Options-Tapzonen im unteren Boxdrittel liegen im System-Gestenbereich, und §3.2 unterbietet den Projektstandard.**
Beleg: `input.js:44-49` erklärt zeilengenau, warum unterhalb y 156 kein Touch mehr angenommen wird (Android-Wischbalken / iOS-Home-Indicator, 24 interne px = 9,03 mm). Die Box reicht bis 172. Der Projektstandard für Tapziele ist ≥ 9 mm Durchmesser (`input.js:97-113`, gemessen `smoke_test.mjs:4047`); §3.2 schreibt „≥ 6 mm".
Fix: Optionszonen ≥ 24 px hoch, Unterkante ≤ 156; §3.2 auf ≥ 9 mm anheben, sonst hat der Händler schlechtere Ergonomie als jeder Bestandsknopf.

**M3 — §6.1: Das EINE rote Gate der Landkarte steht nicht als bindende Auflage in der Spec.**
Beleg: `smoke_test.mjs:598-606` läuft über `Object.entries(MAPS)` und verlangt `def.torchChars.flatMap(findTiles).length > 0`; `smoke_test.mjs:2632-2638` verlangt für JEDES `torchChar` `legend[ch].anim.length === 3`. §6.1 sagt nur „Heddas Kate 3x2 mit HERDFEUER-Licht" — ein Herdfeuer, das als `extraLights` gebaut wird (was §6 ebenfalls erlaubt), lässt `DORF.torchChars` leer und die Karte ROT.
Fix wörtlich in §6.1: *„DORF.torchChars enthält mindestens das Herdfeuer-Zeichen; dessen Legendeneintrag führt `anim` mit GENAU 3 Frames; der Flammenkern-Ton `1` liegt in Grid-Zeilen 5..7 (Bodenfackel-Hotspot `cy−2`, `main.js:1160-1167` setzt `l.wall` nur bei Art-Key-Präfix `torch_wall`)."*

**M4 — §6: Betretbarkeit der Häuser ist nicht deklariert, die Fehlliste suggeriert das Gegenteil.**
Beleg: Landkarte §1.2 Gruppe C führt „Tür zu/**offen**"; §6.1 listet 7 Gebäude ohne ein Wort zu Innenräumen. Ein Builder kann daraus Innenkarten ableiten — das wären weitere `MAPS`-Einträge (⇒ B2 erneut), weitere Portale, weitere Art.
Fix: Deklaration in §9: *„Häuser sind in Slice 6 NICHT betretbar. Die Türkachel ist begehbare Schwelle ohne Portal; ‚Tür offen' ist Deko/Zustandsvariante. Innenräume sind Slice-6b."*

**M5 — §6.1: „Spieler-unter-Dach-Transparenz gratis" feuert bei der spezifizierten Bauform fast nie.**
Beleg: `tilemap.js:1252-1266` schaltet die Halbtransparenz nur, wenn die **Standkachel** des Spielers im Span-Fußabdruck liegt (`opts.playerTile`, gesetzt `main.js:2414`). Landkarte §4.2 schreibt aber „GROUND = solide Wandkacheln + eine begehbare Türschwelle". Unter einem Dach über massiven Wänden gibt es damit genau EINE begehbare Kachel — der Effekt, mit dem §6.1 wirbt, ist praktisch unsichtbar.
Fix: mindestens eine Traufreihe Dachüberhang auf begehbaren Boden verlangen und messbar machen: additives Gate „≥ 8 begehbare Kacheln liegen unter einem Dach-Span" — `gen_dorf_layout` führt mit `deckungsRaster` ohnehin die passende Datenstruktur (Landkarte §4.1 Punkt 4).

**M6 — §3: Die Ökonomie geht nicht auf; die Preisliste erzwingt genau das Farming, das die Landkarte verbietet.**
Nachgerechnet aus der Landkarte-Bilanz plus Bestandscode: Von den ~137 Gold fallen **18 erst NACH dem Boss** an (Boss 6-10 `main.js:1864-1867`, Siegtruhe 8-12 `props.js:94-99`) — und der Sieg ruft `resetRun()` (`main.js:2065`), was `player = null` setzt und über `buildWorld(..., carry=false)` mit Gold 0 neu startet. **Vor dem Boss verfügbar: 20,5 + 57,8 + 40,9 = 119,2 Gold.** Dem stehen gegenüber: Trank 25 + Slot-Item 80-150 + Tasche 300 + Herz 400 = **805-875**. Fehlbetrag ≈ 690-755 ÷ 58 Gold je Katakomben-Runde = **≈ 12 zusätzliche Runden à 2-3 min = 25-35 min reines Farmen**. Ein Tod halbiert das Gold (`main.js:2053`) = ~3,4 Farmrunden Strafe.
Fix: Zielzahl in die Spec („alle Einmalwaren in ≤ N Runden ohne Zwangsfarmen"), dann Preise daraus ableiten — Vorschlag Herz 250 / Tasche 180 / Slot-Item 60-110 / Trank 25 ergibt ~515 und damit ~7 Runden inklusive Fortschritt. Und: die Preise als **feste Zahlen** in Rev 1.1 einfrieren, nicht als Spannen (§3.1 schreibt heute „~15/35", „80-150" — der Builder muss würfeln).

**M7 — §3.1/§5: „je Dorfbesuch" ist undefiniert, hat kein Save-Feld und ist in jeder plausiblen Lesart ausbeutbar.**
Beleg: `buildWorld` läuft bei JEDEM Betreten (Portalpfad `main.js:1774-1776`), beim Respawn nach Tod (`main.js:2054`) und beim Laden (`ladeSpielstand` → `buildWorld`, `main.js:1219-1228`). Ein dort hochgezählter Zähler bedeutet: Osttor raus, Osttor rein = neuer Seed = kostenloser Neuwurf von Brans und Miles Angebot; App killen und laden ebenso. Zusätzlich: §5 listet als neue Felder nur `{npcFlags, quests, runFlags.gekauft}` — das von der Landkarte §4.1 vorgesehene **vierte** Feld `dorfBesuche` fehlt, der Seed hat also gar keinen Speicherort in v2.
Fix: Feld aufnehmen (`runFlags.dorfSeed:int`) und die Neuwurf-Bedingung nennen statt „Besuch": *„Der Seed wird NUR neu gezogen, wenn seit dem letzten Ziehen eine andere Karte betreten wurde UND ein Kauf stattfand"* — oder schlichter: Seed wechselt bei Kauf und bei `bossDead`-Flanke. `deserialize`/`runFlagsOk` (`save.js:131-136`) und beide main.js-Kopierstellen mitziehen.

**M8 — §3.1: Hedas Gratis-Vollheilung „je Dorfbesuch" entwertet die Dauer-Goldsenke.**
Beleg: DORF hängt per §6.2 direkt an GRAVEYARD. Ein Torschritt hin und zurück = volle Heilung, beliebig oft. Tränke (25 Gold) sind laut Landkarte §3.2 „die natürliche Dauer-Senke" — die ist im gesamten Frühspiel tot, und der Friedhof wird risikofrei.
Fix: entweder ausdrücklich deklarieren („gewollt, Dorf ist der sichere Ort", GDD.md:40 stützt das) oder ein Boolean in `runFlags`: Heilung nur, wenn seit der letzten Heilung eine tiefere Karte betreten wurde. Ein Satz, aber er muss dastehen — sonst entscheidet der Builder.

**M9 — §4: Die in §4 genannte Zählquelle kann die genannten Quests nicht tragen.**
Beleg: §4 schreibt „Trigger aus vorhandenen Beobachtern (**enemy_died-Zaehler**, ...)". `enemies.js:486` `events.push('enemy_died')` trägt **weder kind noch Karte**; eine Erweiterung erzwänge eine neue `hasEvent`-Zeile (Quelltext-Wächter `smoke_test.mjs:5189-5197`, verifiziert). Die Landkarte-Q1 („fünf **Skelette**") ist kind-spezifisch. Die einzige kind-tragende Beobachtung ist die `AUDIO_STATE`-WeakMap (`main.js:964`, Auswertung `:1524-1530`, sieht `e.kind` beim Übergang nach `'die'`); sie läuft unabhängig von den Ton-Einstellungen (die Sperre sitzt in `spieleSfx`, `main.js:655-656`, nicht im Beobachter) — nachgeprüft, damit zählt sie auch bei stummem Spiel. Kartenbezogene Ziele („töte 10 in Karte X") gehen ebenfalls NUR dort, weil `currentMapKey` im selben Gültigkeitsbereich liegt.
Fix: §4 auf die AUDIO_STATE-Route umschreiben (Datei:Zeile nennen) oder die Quest-Ziele kind-agnostisch formulieren. Nebenauflage: der neue Zählzweig gehört in die **zweite** Schleife, nicht in die eingefrorene props-Bestandsschleife (`smoke_test.mjs:5290-5307`, 400-Zeichen-Fenster mit ≥100 Zeichen Reservepflicht).

**M10 — §4/§5: Die Quest-Persistenz über die zwei main.js-Kopierstellen ist unbewiesen.**
Beleg: `resetRun` (`main.js:1205-1211`) und `ladeSpielstand` (`main.js:1219-1221`) kopieren `runFlags` **feldweise von Hand**; genau dieser Mechanismus hat schon einmal den Run unlösbar gemacht (Warnkommentar `main.js:1206-1210`, Review P1-B5). A1 beweist nur den reinen Modul-Roundtrip.
Fix: zwei additive Gates — (a) Quelltext-Anker auf die Rümpfe im Muster `smoke_test.mjs:4777-4779` (`resetRumpf.includes('runFlags.quests = {}')` usw.), (b) ein Boot in `check_save_slice4`: v2-Stand mit aktiver Quest und Zählerstand 3 → FORTSETZEN → Zähler steht auf 3.

**M11 — §4: Reset-Semantik stimmt, steht aber nirgends — und eine Quest kann durch Tod unlösbar werden.**
Beleg gemessen: Tod ruft **kein** `resetRun` (`main.js:2048-2062`: Gold halbieren, `buildWorld(currentMapKey, lastSpawn, true)`, `runFlags` unberührt) — Quests überleben den Tod, wie gewünscht. `resetRun` läuft nur bei Neues-Spiel und nach dem Sieg (`main.js:2065`). Die Falle: `runFlags.openedChests` überlebt den Tod (`main.js:1134-1137` filtert die Truhe dauerhaft weg), ein am Boden liegender Drop überlebt ihn nicht (buildWorld verwirft `drops`). Eine Quest-Truhe, deren Inhalt als Bodendrop erscheint, ist nach einem Tod zwischen Öffnen und Aufheben **für immer weg**.
Fix: beide Sätze als Deklaration in §4, plus bindende Auflage: *„Quest-Gegenstände werden beim Öffnen DIREKT vergeben (Muster `props.js:66-88` für boomerang/boss_key/heart), nie über `dropAt`; das Quest-Flag setzt die Öffnungs-Flanke, nicht der Aufheb-Vorgang."*

**M12 — §2.1: Die NPC-Spawnkonvention ist die Umkehrung der projektweiten Regel und muss als solche geschrieben werden.**
Beleg: `smoke_test.mjs:121-146` prüft Spieler-, Skelett-, Ghul-, Prop- und enemySpawns auf `!rectCollides` — „Spawn begehbar" ist im Projekt die Norm. `npcSpawns` ist heute von keinem Gate erfasst (kein rotes Gate, entwarnt), aber die in §7.A angekündigten „NPC-Sonden" würden bei naiver Bauform genau die Norm nachbilden und §2.1 widerlegen.
Fix: in §2.1 explizit invertieren und beide Richtungen als Gates verlangen: *„Steh-NPC-Spawn MUSS auf solider Kachel liegen (`rectCollides === true`); Wander-NPC-Spawn MUSS frei sein (`rectCollides === false`)."*

**M13 — §2.1: Wander ohne Leine, Durchdringung nicht deklariert, RNG bricht das A1-Gate.**
Beleg: Das übernommene Muster (`enemies.js:276-288`) ist ein unbeschränkter Random-Walk (Timer 1-2 s, Gleichverteilungswinkel, kein Heimatanker) — Mile verlässt über Minuten seinen Marktstand. Entity-gegen-Entity-Kollision gibt es projektweit nicht (`entity.js:31-57` konsultiert ausschließlich `map.rectCollides`), Wander-NPCs laufen also durch den Spieler hindurch und können in Portale/Dach-Spans wandern. `Math.random` in `entities/npcs.js` ist erlaubt (der Quelltext-Wächter `smoke_test.mjs:1762-1770` deckt nur `world/` und `art/`), sprengt aber das A1-Gate „NPC-Update kollisionsfrei" als deterministischen Node-Test.
Fix: (a) Leine — `home = spawn`, Radius ≤ 24 px, außerhalb wird die Richtung Richtung Heimat neu gezogen, plus Gate „Wander-NPC verlässt in 10 000 Ticks nie seinen Heimatradius"; (b) Deklaration *„NPCs und Spieler durchdringen einander; Reden ist Reichweite+Blick, nie Berührung"*; (c) Signatur `updateNpcs(dt, npcs, map, rng = Math.random)`.

**M14 — §1 A3 / §6: Das M1-Band 54..66 hängt an einer Bodenmischung, die die Spec nicht bindet.**
Beleg: Landkarte §2.4-Tabelle bei ambient 0,22: Mischung A (70 % Gras) → 41,3; Mischung B (45/50) → 64,3; Mischung C (30/65) → 76,0. Der Bandvorschlag 54..66 gilt ausschließlich für B. §6 schreibt aber nirgends einen Flächenanteil vor — die Phase-0-Messung landet je nach Layout irgendwo zwischen 41 und 76, und das Band ist danach eingefroren („Schwellen nach Eintrag NIE anpassen").
Fix: Flächenauflage als Layout-Anforderung an `gen_dorf_layout`: Anteil Platz-/Erdkacheln 45-55 % der begehbaren Fläche, vom Generator selbst nachgerechnet und in Phase 0 protokolliert — sonst ist A3 nicht abnahmefähig.

**M15 — §3/§6.2: Die Goldsenke steht am entgegengesetzten Ende der Welt von der Goldquelle.**
Beleg: Verdient wird in CATACOMBS (57,8) und FLUESTERGRUFT (40,9); das Dorf hängt per §6.2 an GRAVEYARD. Ein Einkauf kostet drei Kartenrückwege, und da `buildWorld` Gegner **und** Vasen bei jedem Betreten frisch aufbaut (`main.js:1113-1133`), ist jeder Rückweg zugleich ein Kampfweg. Die Landkarte hatte dafür V3 (Stadtportal, §3.2) vorgeschlagen; die Spec lässt es kommentarlos weg.
Fix: entweder V3 als kleines Zusatzsystem aufnehmen (Landkarte: „ein Warp-Pfad in main.js, kein Portal-AABB, kein Hash") oder ausdrücklich deklarieren, dass der Rückweg gewollter Teil der Schleife ist — mit der Konsequenz für M6 (die Preise müssen dann niedriger sein, weil ein Kauf teurer als sein Preis ist).

---

## MINOR

**m1 — §6: 44×28 ist frei, aber der scheinbare Gegner ist ein bereits toter Wächter — das gehört deklariert.**
Gemessen: `node .tmp/check_world_slice1.mjs` ist HEUTE schon ROT (`BOSS_KAMMER: Zeile 11 hat 20 Zeichen`, `CATACOMBS: genau 1 Truhe erwartet` → `CHECK ROT`). Die Landkarte-Zeile 249 („DORF muss 40×24 sein") ist damit veraltet. Zusätzlich geprüft: keine grüne Suite verdrahtet 40/24 — `smoke_test.mjs` iteriert durchweg über `def.rows.length` / `def.rows[0].length` (`:2419-2420, :2705-2706, :2826-2827, :2869-2870`).
Fix: `check_world_slice1.mjs` in die §0.5-Liste der namentlich toten Wächter aufnehmen (neben `check_art_gfx3:57` und `dev_art_slice2:124`), sonst liest ein späterer Agent sein Rot als Slice-6-Schaden.

**m2 — §6.1: Die Dorfglocke sprengt die Maßtabelle, die derselbe Absatz für unantastbar erklärt.**
Landkarte §5.3: „1×2 solide + **Over-Joch**". Ein 16×32-Over-Grid wäre eine SECHSTE Maßklasse und kostet zwei Wächterzeilen (`check_gfx6_art.mjs:122-133`, `smoke_test.mjs:1732-1743`) plus das „keine Klasse leer"-Gate (`smoke_test.mjs:1756-1759`).
Fix: Joch als **zwei gestapelte 16×16-Over-Kacheln ohne span** spezifizieren (Over ohne span ist per Definition 16×16) — dann bleibt die Tabelle wirklich unangetastet.

**m3 — §3.1: Für „kauft Items" existiert kein Codepfad und kein Eigentümer.**
`items/items.js` exportiert `rollItem`, `createInventory`, `addItem`, `equipItem`, `computeStats` — **kein `removeItem`**; und `items/items.js` taucht in KEINER Besitzliste von §8 auf. Verkauf eines angelegten Items bräuchte zusätzlich `recalcStats`.
Fix: `items.js` in §8 SYSTEME aufnehmen mit genau einer additiven Funktion `removeItem(inv, index)`, und deklarieren, ob Angelegtes verkäuflich ist (Empfehlung: nein — spart den Stat-Neurechnungspfad).

**m4 — §3.1: „2,5x" hat keine Basis, „15/35" hängt frei.**
Items tragen kein Wertfeld (`items.js:55-72` liefert `{slot,name,rare,affixes}`). Ohne Formel kann der Builder Miles Preis nicht berechnen.
Fix: Formel einfrieren, z. B. `preis(item) = BASIS[slot] × (rare ? 2 : 1)` mit konkreten BASIS-Zahlen, `verkauf = round(0,2 × preis)` — dann fallen 15/35 aus der Formel, statt daneben zu stehen. Geprüft und unbedenklich: Kauf 80-150 gegen Rückverkauf 15/35 ist in beide Richtungen verlustbehaftet, ein Round-Trip-Exploit existiert nicht; das darf als Absicht dastehen.

**m5 — §9.M1/§8: Wer die c/G-Zielwerte rechnet, steht da; welche Auflagen sie erfüllen müssen, nicht.**
Fix: drei prüfbare Bedingungen in §8 Phase 0 — (a) L-Monotonie der Holzrampe mit `c` als neuer Stufe (`q` 44,7 < `j` 64,4 < `Q` 83,7 < **c_neu** < `J` 117,8, Zielkorridor ~95-105); (b) S-Deckel nach B1; (c) `G` als NPC-Stoffton mit L zwischen den Nachbarn seiner Zielrampe. Dazu: die Landkarte bot `c` **zweifach** an (Holz-Zwischenstufe UND Rost-Glättung) — §6.4 vergibt es an Holz, also gehört der Satz „die Rostrampe bleibt dreistufig" in die Deklarationsliste. Der Ton-Zensus-Nachweis (§8 Phase 0) ist übrigens beweisbar statt messbar: `c` und `G` haben laut Landkarte 0 Texel in 0 Grids, also kann kein Bestandsgrid kippen — das darf so dastehen.

**m6 — §0.9/§6.1: song_dorf ist kein Boot-Crash, sondern ein Betreten-Crash — mit einer Ausnahme.**
`songFuer` wirft bei unbekanntem Schlüssel (`audio/songs/index.js:33-37`), aufgerufen über `musikFuerZustand` → `musikStarten(mapDef.music)` (`main.js:843-851`). Startkarte bleibt GRAVEYARD (§0.7), also fällt das erst beim Betreten des Dorfs — **außer** beim Dev-Einstieg `?map=DORF` (`main.js:266-270`), der dann beim Boot stirbt. Additiv-Sicherheit geprüft: `SONG_SCHLUESSEL` (`smoke_test.mjs:4923`) ist eine feste Teilmenge mit `every`, ein neuer Schlüssel ist unschädlich; die Peak-Gates (`:5058-5064` ≤ 0,70, Summengate `:5086`) laufen über ALLE `SONGS` und gelten mit.
Fix: §0.9 präzisieren — „SONG_DORF wird im selben Commit wie `map_dorf.js` als Stub registriert (Peak-Budget ≤ 0,70 gilt ab sofort); die Komposition iteriert danach unabhängig."

**m7 — §2.2: audioGeduckt für den neuen State ist nicht entschieden.**
`enterState` (`main.js:1244`) setzt `audioGeduckt = next === 'paused' || next === 'inventory'` — `'dialog'` fiele stillschweigend auf `false`, Weltklänge bleiben also in der harten Pause hörbar. Die Landkarte empfiehlt genau das, §2.2 sagt nur „Musik laeuft".
Fix: ein Satz — „dialog duckt NICHT (`audioGeduckt` bleibt false); der Dialog ist Teil der Welt, kein Menü."

---

## Einzeiler-Bilanz

Rev 1 ist in der Welt- und Karten-Schicht solide, aber in der System-Schicht noch nicht baubar: fünf BLOCKER (Sättigungs-Deckel verbietet mit der projekteigenen Formel S=(max−min)/max sogar das Bestandsgras; die 5. Karte kippt den heute grünen `check_builderA_slice3:55`; SAVE_VERSION 2 kollidiert mit drei Assertions, die §0.1 gleichzeitig für unantastbar erklärt; zwei der fünf Quests brauchen das per §0.2 tabuisierte `props.js` bzw. einen unsanktionierten `portalBlocked`-Zweig; und die Interaktionsreichweite scheitert rechnerisch an 15 px Mindest-Mittenabstand gegen reach 12), fünfzehn MAJOR — davon die scharfkantigsten die Dialogbox auf drei lebenden Touchzonen ohne Trank-Schlucker, das nicht spezifizierte Herdfeuer-`torchChar` als einziges rotes Gate, und eine Preisliste, die ~12 zusätzliche Farmrunden erzwingt — plus sieben MINOR; alle mit konkreter Fix-Formulierung, keiner braucht neue Messungen außer M14.