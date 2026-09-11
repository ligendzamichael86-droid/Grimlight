# GP7-CH-2 Spec-Review (11.09.2026) — Fix-Formulierungen BINDEND

# ===== LINSE 1: ENGINE/TESTS/SPIELDYNAMIK =====

## ADVERSARIALE SPEC-PRÜFUNG design/SPEC_GP7CH2.md Rev 1 (HEAD 0d4fbbb)

Nur gelesen, alle Proben in `/home/coder/Grimlight/.tmp/gp7ch2_review/`, Arbeitsbaum sauber (`git status` leer), Port 8123/8124 nicht angefasst. Alle Zahlen unten sind gemessen, nicht geschätzt.

---

# BLOCKER

**B1 — Die Flash-Bedingung blitzt jede Leiche durch. §4 / Teil A 2.4 Schritt 2**
Teil A 2.4 schreibt `flash = (ent.hurtTimer > 0 || ent.invulnTimer > 0) ? 1 : 0`; §4 übernimmt die Bedingung stillschweigend. Gemessen (`.tmp/gp7ch2_review/hurt_die.mjs`, `player_dead.mjs`):
- `game/js/entities/enemies.js:441-451`: der `die`-Zweig macht `continue` **vor** der Dekrementzeile `:453`. `hurtTimer` bleibt über die ganzen 25 Sterbeframes auf exakt 0,200 stehen (Protokoll: `0:state=die hurt=0.200` bis `25:state=die hurt=0.200`).
- `game/js/entities/player.js:98-101` kehrt im `dead`-Zweig zurück, bevor `:110` dekrementiert. Nach 120 Ticks: `state dead, invulnTimer 1.000` — Flash-Bedingung **dauerhaft an**, also weißer Puls auf dem GAME-OVER-Leichnam bis zum Neustart.
Heute verhindern genau die drei Blinkzeilen das: `enemies.js:620` sitzt im `else`-Zweig (nicht im `die`-Pfad), `boss.js:324` und `player.js:229` tragen die Ausschlüsse `e.state !== 'die'` / `player.state !== 'dead'` **im Prädikat**. Wer sie streicht und den Flash an die Timer hängt, verliert genau diesen Schutz.
Zusätzlich: V6 fordert „Dauer Hitstop+1 (3 Treffer / 4 Kill)", `HURT_FLASH` ist aber 0,2 s = 12 Frames. Ein Timer-gekoppelter Flash blitzt 12 statt 3 Frames; ein Frame-Zähler braucht Zustand, und §4 sagt nicht, wo er lebt und wann er tickt — der Hitstop-Zweig `main.js:2021-2028` überspringt den `else`-Block komplett, ein dort dekrementierter Zähler friert also mit.
**Fix-Formulierung §4:** „Flash-Quelle ist ein FLANKEN-Zähler in main.js (WeakMap je Entity, dekrementiert im Zeichenpfad, nicht im Update-Zweig): auf die Flanke `hurtTimer`/`invulnTimer` 0 -> >0 werden 3 Frames gesetzt (4 beim Kill). NIE direkt `hurtTimer > 0`. Ausschlüsse wörtlich wie heute: Gegner `state !== 'die'`, Spieler `state !== 'dead'`."

**B2 — Das Decal-Rezept erzeugt Phantom-Decals bei JEDEM Kartenwechsel und jedem Respawn. §4 / V7 / Teil A 3.3**
V7 und der Code-Entwurf Teil A 3.3 räumen in `buildWorld` nur `decals.length = 0`, nicht aber das Diff-Set `lebendeVorFrame`. `game/js/main.js:1158` ersetzt `enemies` komplett; der Diff läuft im nächsten freien Frame gegen das **alte** Set. Rezept 1:1 implementiert und durch den Flusstest gefahren (`.tmp/gp7ch2_review/decal_patch.mjs` + `rig_check_main_slice1.mjs`):

```
SONDE-DECAL +1  auf GRAVEYARD  -> gesamt 1     (echter Kill)
SONDE-DECAL +7  auf CATACOMBS  -> gesamt 7     (die 7 ueberlebenden GRAVEYARD-Gegner)
SONDE-DECAL +17 auf GRAVEYARD  -> gesamt 17    (alle 17 CATACOMBS-Gegner)
SONDE-DECAL +8  auf GRAVEYARD  -> gesamt 8     (Respawn nach Tod)
```
Die Regex des DORF-Gates `tools/smoke_test.mjs:6612` ist `/^(skeleton|ghoul|hound|rust|warden|shield)/`, also **präfixgebunden**: `skeleton_decal` matcht. Ein Gang GRAVEYARD -> DORF macht das Gate rot. Gegenprobe mit Fix (`decals.length = 0; lebendeVorFrame = new Set();` in `buildWorld`) ergibt `+1 auf GRAVEYARD` und sonst nichts, check_main weiter 25 grün.
**Fix-Formulierung V7/§4:** „buildWorld räumt `decals` UND `lebendeVorFrame` (beide in derselben Zeile, main.js:1158ff). Der Frame-Diff läuft ausschließlich im `else`-Zweig direkt hinter `updateEnemies` (main.js:2079), nie über eine buildWorld-Grenze hinweg."
**Zusatz:** Das neue Gate „Decals nach buildWorld = 0 (DORF-Gate bleibt grün)" (§5(5)) fängt das **nicht**, wenn es nur den bestehenden S6-Boot nachfährt: der bootet direkt in DORF und verlässt es nie. Das Gate muss **von einer Kampfkarte MIT Kill nach DORF reisen**, sonst ist es falsch-grün.

**B3 — Die E1-Fenster und damit die ganze Wertleiter sind gegen Kacheln zurückgerechnet, die V2s eigene Definition ausschließt. §1 / V2 / Teil A 1.4**
V2 definiert die Leitklasse als „>= 80 % der Zellen", Weg und Gruft-Wasser ausdrücklich als Minderheitsklassen. Gemessen über die echten Map-Zeilen (`.tmp/gp7ch2_review/leitklassen.mjs`, `tile_l.mjs`, Anteile an den **begehbaren** Zellen):

| Karte | Leitklasse >= 80 % | L | korrektes Fenster (dL 25..90) |
|---|---|---|---|
| GRAVEYARD | GRAS 85,4 % (grass_g5_00 allein nur 49,2 %) | 47,0..56,3 | **81,3 .. 137,0** |
| CATACOMBS | stone_floor 98,6 % | 52,5..53,0 | **78,0 .. 142,5** |
| FLUESTERGRUFT | stone_floor 85,5 % | 52,5 | **77,5 .. 142,5** |
| BOSS_KAMMER | stone_floor 96,4 % | 52,5 | **77,5 .. 142,5** |

Minderheitsklassen: Weg 11,6 % (L 90,9), water_v 14,0 % (60,3), floor_decal_bones **1,2 %** (70,0), stairs_up 0,2..1,2 % (44,7), crypt_stairs_down 0,2..0,3 % (37,5).
Teil A 1.4 rechnet die Obergrenze 127,3 aus `crypt_stairs_down` (0,3 % der Zellen) und die Untergrenze 95,2 aus `floor_decal_bones` (1,2 %) und zählt `water_v` in die Leitklasse. Daraus entsteht der „Sprengsatz" Skelett-Fenster 116,5..127,3 (10,9 L). **Nach V2s eigener Regel ist das Skelett-Fenster 81,3..137,0, also 55,7 L breit.** Dieselbe Korrektur betrifft Hund (81,3..137,0), Ghul/Rost (78,0..142,5), Warden (77,5..142,5).
Folgefehler in §1, alle drei prüfbar:
1. **Hund 90..100 widerspricht V2 direkt.** V2 nennt für „Skelett/Hund" das Fenster [95..127]; die 95 stammt aus der BOSS_KAMMER, wo der Hund gar nicht vorkommt. Die Schnittmenge aus §1-Band und V2-Fenster ist 95..100.
2. **Die Wertleiter verletzt ihre eigene Abstandsregel.** MITTEL 105..117 und HELL 118..126 berühren sich (1 L), HELL 118..126 und GROSS 128..134 liegen 2 L auseinander. Zwei Figuren, die beide im Fenster liegen (Ghul 117, Skelett 118), reißen „Abstand benachbarter Stufen >= 5 L".
3. **Rost 85..100 unterschreitet den (alten) Fensterboden 85,3.**
**Fix-Formulierung §1/V2:** „Leitklasse = Bodenklasse mit >= 80 % der BEGEHBAREN Zellen, namentlich: GRAVEYARD = alle `grass_*` + `dirt_patch*` (85,4 %), CAT/FG/BOSS = `stone_floor*`. ALLES andere (Weg 11,6 %, water_v 14,0 %, bones, skull, stairs_up, crypt_stairs_down, floor_decal_*) ist Minderheitsklasse mit dem weichen Kriterium. Fenster: Skelett/Hund 81,3..137,0, Ghul/Rost 78,0..142,5, Warden 77,5..142,5. Wertleiter mit >= 5 L GETRENNTEN Bändern, z. B. DUNKEL 88..100 / MITTEL 106..118 / HELL 124..134 / GROSS 136..142."

**B4 — „Positionsfolgen der Flusstests byte-gleich" ist beweisbar unerfüllbar. §4 / §6**
`.tmp/check_main_slice1.mjs:125-135` und `.tmp/check_inventory_slice2.mjs:175-185` cachen beim Blinken den letzten Wert (`lastPlayer`). Fällt der Blink weg, liefert `playerScreen()` in JEDEM Frame frische Werte. Gemessen (`.tmp/gp7ch2_review/spur.mjs`, identisches Drehbuch, 2400 Frames, Basis gegen Baum mit entfernten Blinkzeilen + eager Flash):
```
Spieler-Draws fehlend: BASIS 90 von 2400   |  FLASH 0 von 2400
Positionsfolge: 14 von 2400 Frames abweichen, erster bei Frame 469
  BASIS[469] 51/98   FLASH[469] 52/96
```
Die Abweichung ist **der Zweck des Umbaus** (Silhouetten-Verlust 90 -> 0), nicht ein Fehler. Zusätzlich ändert sich die Steuerlogik von check_inventory: `skeletonsScreen()` (`:186-190`) sieht jetzt auch getroffene Skelette, `nearestSkeleton()` wählt anders.
**Fix-Formulierung §4:** „Dynamischer Beweis = Gleichheit der WELTKOORDINATEN je Tick (player.x/y und enemies[i].x/y aus einer Scratch-Sonde), NICHT der gezeichneten `playerScreen()`-Folge. Zusätzlich: Zahl der Frames ohne Spieler-/Gegner-Draw je Treffer von 90 auf 0 (Gegner 6 -> 0, Spieler 30 -> 0)."

---

# MAJOR

**M1 — `k/n -> '.'` liefert weder „Umriss bleibt schwarz" noch ein lochfreies Inneres. §0.5 / V6**
Gemessen (`.tmp/gp7ch2_review/umriss.mjs`, Kontur = opaker Texel mit >= 1 transparentem 4er-Nachbarn):

| Grid | Kontur | davon k/n | **Kontur bleibt WEISS** | k/n im Inneren (= Loch) |
|---|---|---|---|---|
| player_down_0 | 76 | 40 | **36 (47,4 %)** | 19 (32,2 % des Schwarz) |
| skeleton_0 | 66 | 40 | 26 (39,4 %) | 10 |
| rust_0 | 62 | 57 | 5 | 23 (28,8 %) |
| warden_idle | 104 | 95 | 9 | 33 (25,8 %) |
| npc_mile_0 | 62 | 24 | 38 (61,3 %) | 3 |

Der **Spieler** bekommt laut §4 einen Flash und wird in CH-2 nicht neu gezeichnet: sein Umriss brennt auf 36 von 76 Texeln weiß aus. Der Warden wird „nur nachgezogen" und bekommt 33 Löcher.
**Fix-Formulierung §0.5:** „Die Flash-Maske entsteht GEOMETRISCH: opake Texel mit >= 1 transparentem 4er-Nachbarn oder Rahmenkante werden auf '.' gesetzt (Kontur-Definition E5, SPEC_GP7CH1 E5), NICHT über die Tonmenge k/n. Ein Ton-Filter k/n ist nur zulässig, wenn das Grid die Auflage `Kontur zu 100 % k/n UND kein k/n im Inneren` erfüllt; für player_*, npc_* und warden_* ist das heute nicht erfüllt."

**M2 — Die Teil-A-Profilmatrix ist mit der sanktionierten E5-Formel nicht reproduzierbar, §1 friert sie trotzdem ein. §0.1 / §1 / Teil A 5.1**
Ich habe `breitenprofil` + `profilAehnlichkeit` aus `.tmp/gp7ch_p0/figuren_messung.mjs:849-862` wörtlich nachgebaut (`.tmp/gp7ch2_review/profil_variants.mjs`):

| Paar | E5 wörtlich (fußbündig, Rohzeilen) | Teil A 5.1 | Teil C |
|---|---|---|---|
| Ghul/Rostpanzer | **78,9** | 72,4 | 78,9 |
| Skelett/Ghul | **59,7** | 65,2 | 76 |
| Skelett/Grufthund | **60,1** | 56,1 | – |
| Grufthund/Rostpanzer | **57,9** | 43,1 | – |

Teil A „korrigiert" hier ausgerechnet die Zahl, die der sanktionierte Code liefert (78,9). Die nächste Variante an Teil A ist „bbox-Zeilen + KOPFbündig" (trifft 6 von 10 Paaren exakt), was §1s eigener Vorgabe „Profil (E5, **fußbündig**)" widerspricht; die vier Skelett-Paare trifft keine der sieben getesteten Varianten.
Gegenprobe: die **Körper-L-Anker sind reproduzierbar** (`.tmp/gp7ch2_review/koerperL.mjs`, E5 über alle Grids): Skelett 162,6 / Ghul 96,2 / Hund 75,6 / Rost 112,8 / Warden 139,2 gegen Teil A 162,5 / 96,0 / 75,4 / 112,7 / 139,5. Nur die Profilmatrix bricht.
Konsequenz: §1s Positivkontrolle „Werkzeug reproduziert die Teil-A-Anker" geht in P0.a **an Tag 1 rot**, und „nur ein Paar reißt das Ziel <= 60" stimmt nicht (E5 wörtlich: Skelett/Ghul 59,7 besteht schon heute, Skelett/Hund 60,1 ist Grenzfall, Ghul/Rost 78,9 statt 72,4).
**Fix-Formulierung §0.1/P0.a:** „Anker = Teil A 1.2 und 7.2 (Körper-L, Schwarz, Rim, Spiegel, Frame-Diff). Die PROFILMATRIX aus Teil A 5.1 ist KEIN Anker; P0.a misst sie mit `breitenprofil`/`profilAehnlichkeit` (figuren_messung:849-862, fußbündig, Rohzeilen inkl. leerer) neu und friert das Ergebnis ein. IST-Worst-Case ist damit Ghul/Rost 78,9."

**M3 — Neue FLIP-Einträge verschieben `smoke:6408` und machen das DORF-Gate falsch-grün. §0.2 / §5(6) / V7**
`tools/smoke_test.mjs:6396-6408` baut `S6_NAMEN = [...Object.keys(SPRITES), ...S6_FLIP(37), ...Object.keys(TILE_ART)]` mit einer **hartkodierten 37er-Flip-Liste**, die heute exakt mit `main.js:106-128` übereinstimmt. Neue SPRITES-Keys am Ende sind harmlos (Object.keys ist live). Fünf neue `*_decal_flip`-Einträge verschieben dagegen den gesamten TILE_ART-Namensblock um 5: die Decal-Flip-Canvases bekommen Kachelnamen, `d.gesehen` (`:6452-6460`) sieht sie nicht mehr, und die GEGNER-Regex `:6612` läuft ins Leere. `check_main_slice1:100-106`, `check_inventory_slice2:145-151` und `check_save_slice4:112-116` tragen nur 12er-Listen und sind im Kachelbereich ohnehin schon verschoben (harmlos, sie filtern auf `player`/`skeleton`).
§5 sagt „NICHTS SONST" und sanktioniert in smoke nur ADDITIVE Gates; die nötige S6_FLIP-Erweiterung wäre eine Änderung an einem bestehenden Rig.
**Fix-Formulierung V7/§5:** „Decals werden NICHT gespiegelt (flaches Bodenzeichen, `seite` entfällt) — dann null neue Flip-Einträge. Falls doch: §5 nimmt zusätzlich `tools/smoke_test.mjs:6396-6408 (S6_FLIP)` in den Sanktionskatalog auf, sonst wird smoke:6612 still falsch-grün."

**M4 — §5(4) „gp6_art_self 6 Rot -> 7" ist sachlich falsch. §0.7 / §5(4)**
`node .tmp/check_gp6_art_self.mjs` heute: `6 ROT von 428 Pruefungen`. Die Symbolprüfung `.tmp/check_gp6_art_self.mjs:26` (`pruef(sym.length === 3 && sym.join('') === '=+*')`) ist **bereits rot** (`ist =+*!%&():;?@[]^_|`). Sieben weitere Symboltöne machen sie nicht ein zweites Mal rot. Auch `SPRITES byte-unveraendert` (:57) und `SPRITES-Indizes 0..74` (:58) sind bereits rot, neue Keys ändern daran nichts; eine SPRITES-Maßtabelle gibt es dort nicht (`MASSE` gilt nur für TILE_ART, :48).
**Fix-Formulierung §0.7/§5(4):** „gp6_art_self bleibt bei **6 Rot** (Symbolzeile, SPRITES-Byte-Freeze und 75-Key-Zeile sind seit CH-1 rot). Keine neue Rotzahl deklarieren."

**M5 — H1s inner-familiäres Profil-Gate fällt in §1 weg, ausgerechnet für Skelett/Fußvolk. §1 gegen Teil C H1**
Teil C H1 fordert „ganze Figur <= 60 **innerhalb einer Familie** UND <= 60 familienübergreifend". §1 schreibt nur „ganze Figur <= 60 familienübergreifend". Teil C ordnet das **Fußvolk der Familie AUFRECHT-SCHMAL zu, also derselben wie das Skelett** — das Paar mit der höchsten Verwechslungsgefahr (beide 16 breit, beide Knochenwelt) bleibt damit ungedeckelt. Die Familientabelle steht außerdem nur in Teil C, nicht in der Spec, obwohl §1 („Familie+Stufe nie beide gleich") und V8 sie voraussetzen.
**Fix-Formulierung §1:** „Familien (eingefroren, aus Teil C H1): AUFRECHT-SCHMAL Skelett+Fußvolk / AUFRECHT-MASSIG Ghul / AUFRECHT-BREIT Rostpanzer / VIERBEINER-NIEDRIG Grufthund / GROSS-ELITE Warden. Profil <= 60 für JEDES Paar, innerhalb wie zwischen Familien."

**M6 — „Warden nachziehen" gegen §1 ist ein Vollumbau von 9 Grids. §3 gegen §1**
§3 sagt „Warden nachziehen (Rim, Kante, Sekundärbewegung)". §1 gilt aber „je Gegner-Grid" und trifft den Warden mit: bbox-Spiegelgleichheit <= 65 (IST `warden_idle` 94,7), Solitär <= 8 % (IST 17,0), Körper-L 128..134 (IST 139,2, gemessen über alle 9 Grids), Rim >= 12 % flip-neutral (IST 12,5 %, aber als seitliche Kante), >= 3 Konturtöne >= 8 Texel. Das sind 9 Grids à 24x32 mit 4064 opaken Texeln und 19 Tönen, keine Politur. Dazu kommt: Maßwechsel wäre zusätzlich `.tmp/art_slice3_selfcheck.mjs:23-32` (steht nicht zur Debatte, aber der Umbau selbst kostet Zeichenzeit, die §3 nicht budgetiert).
**Fix-Formulierung §3:** „Warden-Umfang namentlich auflisten (welche der §1-Ziele gelten, welche werden für den Warden deklariert ausgesetzt) und ihn NICHT als ‚nachziehen' führen; er ist die dritte Vollfigur des Passes oder er bekommt eine Ausnahmeliste."

**M7 — Kein Gate beweist, dass Timer und Hitstop unangetastet bleiben. §4 / §5(5)**
§5(5) listet Silhouetten-Verlust, Decal-Reinheit, Decals-nach-buildWorld, Deckel 24, Decal-Positivkontrolle und Frame-Diff-Untergrenzen. **Keines** davon misst `hurtTimer`, `invulnTimer`, `dieTimer` oder `hitstop`. §4 stützt sich auf „Suiten-Zahlen unverändert" — eine Assertionszahl (825/25/25/33) bleibt aber konstant, auch wenn Werte kippen. Das Haus hat das Muster bereits: `tools/smoke_test.mjs:5294-5300` prüft per Quelltext-Regex, dass der Spieler-Schaden-Zweig keinen Hitstop anfasst.
**Fix-Formulierung §5(5):** „Zusätzliches additives Gate nach Muster smoke:5294-5300: der neue Flash-/Decal-Block in main.js enthält keine Zuweisung an `hurtTimer|invulnTimer|dieTimer|hitstop|dieTime|DIE_TIME` (Quelltext-Regex über den Blockbereich), und `entities/enemies.js`, `boss.js`, `player.js` enthalten nach dem Eingriff exakt gleich viele Zuweisungen an diese Felder wie vorher."

**M8 — „Kopf-Schulter <= 55 für JEDES Paar" ist nur mit degenerierten Silhouetten erreichbar. §1**
IST gemessen (`.tmp/gp7ch2_review/profil.mjs`, oberste 6 BELEGTE Zeilen, kopfbündig, E5-Formel): 8 von 10 Paaren reißen, Worst Case Skelett/Ghul 86,9 (deckt sich mit Teil C). Erreichbarkeitssuche über 36 937 bis 322 369 plausible Kopf-Schulter-Profile je Figur (`kopf_such.mjs`, 6 Figuren inkl. Fußvolk, monoton steigend, Scheitel 2..8, Schulter >= Scheitel+2): eine Lösung existiert, aber sie sieht so aus:
```
Skelett [8,9,12,13,14,15]  Fussvolk [2,2,4,4,4,14]  Ghul [4,5,6,7,8,8]
Rost [2,2,3,8,19,20]       Hund [2,2,2,2,2,6]       Warden [3,21,21,24,24,24]
```
Der Grufthund müsste über 5 Zeilen **2 Texel breit** sein (IST `[4,9,13,15,14,13]`), was bei einem Vierbeiner in 16x12 keine Kopf-Schulter-Zone mehr ist, sondern eine Nadel. Bei <= 65 wird der Raum plausibel (`Hund [3,3,3,3,6,6]`, `Skelett [2,4,4,5,8,13]`).
Zweitens: §1 sagt „oberste 6 Zeilen", Teil C sagt „oberste 6 **belegte** Zeilen". Die Zeile 0 von `skeleton_0` ist leer, der Warden hat mehrere leere Kopfzeilen; die zwei Lesarten liefern verschiedene Zahlen.
**Fix-Formulierung §1:** „Kopf-Schulter-Zone = die obersten 6 BELEGTEN Zeilen (Teil C H1). Grenze <= 65 für jedes Paar, <= 55 nur innerhalb einer Familie; der Grufthund (16x12, 6 Zeilen = halbe Figur) wird mit seinen obersten 3 belegten Zeilen gemessen. P0.a rechnet die sechs Zielprofile VOR und friert sie als Steckbriefzeile ein — sonst iteriert der Zeichner blind gegen ein Gate, dessen Lösungsraum eine Handvoll Vektoren groß ist."

---

# MINOR

**m1** §0.5 nennt „main.js:130" für den TILE_ART-Bau; `const tiles = buildAll(TILE_ART, PALETTE)` steht auf **main.js:131**. Ebenso: `player.js:228-231` ist Kommentar+Block, die Blinkzeile ist **229**; `boss.js:323-324` ist Kommentar 323 + Zeile **324**.

**m2** §1 „Rost 85..100" unterschreitet den (alten) Fensterboden 85,3 um 0,3 L. Mit der B3-Korrektur erledigt; sonst auf 86..100 setzen.

**m3** §1 friert Frame-Diff-Untergrenzen nur für die fünf **Lauf-Paare** ein. Ohne Untergrenze bleiben `hound_telegraph/leap/down/die` (4 Grids, der Hund hat 6 von 27 Gegner-Keys) und 7 der 9 Warden-Grids. Fix: „Untergrenze gilt für JEDES Paar aufeinanderfolgender Posen derselben Figur; Teil A 7.2 nennt die Ausgangswerte für die Lauf-Paare, P0.a misst die übrigen nach."

**m4** §1 „Decal: <= 25 % Rahmen, <= 6 Zeilen". Beim 16x12-Hund sind 6 Zeilen **50 % der Figurhöhe**, bei Ghul/Skelett 30 bis 33 %. Und „Rahmen" ist nicht definiert: das eigene `*_decal`-Grid (dann ist <= 25 % bei 16x6 nur 24 Texel) oder das Basisgrid. Fix: „<= 6 Zeilen UND <= 40 % der Höhe des Basisgrids; Rahmen-% bezieht sich auf das `*_decal`-Grid selbst."

**m5** Der Decal-Zeichenzweig (Teil A 3.3: vor `drawSoftShadow(player)`, `main.js:2663`) liegt **nach** Lit-Dither (`:2570-2604`) und Wasserreflexion (`:2606-2628`): ein Decal auf einer beleuchteten Kachel wird vom Bodenlicht **nicht** aufgehellt und liest als dunkler Fleck im Fackelkegel. Außerdem: wenn der Decal-Zeichner `tintCfg` für den eingefrorenen Tint setzt, muss er `window.__noTint` genauso respektieren wie die renderables-Schleife (`main.js:2685`), sonst schlägt bei einem Tod in einer Messszene `.tmp/check_engineB_gp6.mjs:238-240` zu. Fix: beides in §4 als Satz aufnehmen.

**m6 Palette-Kollisionsbefund (P0.b, geprüft):** Grid-Literale in `game/js/art/sprites_figuren.js` sind **einfach gequotete** Strings (`'................'`), keine Template-Literale (0 Backticks in der Datei). Damit kollidieren `" $ / < > { }` **nicht** mit dem Literalformat. Legenden-Schlüssel aller vier Kampfkarten plus DORF enthalten als Symbole nur `# . , = ~ -` — keine Kollision. Format-Guards prüfen generisch `c in PALETTE` (`check_gfx6_art:101-109`, `art_slice3_selfcheck:10-20`, `smoke:81-93`). `tools/figuren_bogen.mjs` schreibt PNG + TXT, kein XML/SVG. Zwei Restrisiken: (a) `"` in den JSON-Deliverables aus §3 (Material-Tabelle, Tauschschlüssel) muss escaped werden, (b) `^` und `]` sind **bereits** Palettenschlüssel — also nie eine RegExp-Zeichenklasse über Palettenschlüssel bauen (heute tut das niemand: `new RegExp` kommt nur in `smoke:4729` und `:5234` vor, beide ohne Palette). Fix: diese drei Sätze als Kollisionsnachweis in P0.b aufnehmen, statt ihn erst zu beauftragen.

**m7** P0.d schreibt die Referenzbögen nach `design/referenz/`. `tools/figuren_bogen.mjs:365` und `:415` bilden die Dateinamen als `figuren_bogen_<modus>_<boden>_<tag>.png`. Dort liegen bereits die **CH-1-Bögen** (`figuren_bogen_vorher_gras_1x.png` usw., 20 Dateien). Ein CH-2-„vorher"-Lauf auf die drei Bestandsböden überschreibt sie und löscht damit den CH-1-Vorher-Nachher-Beleg. Fix: „P0.d schreibt nach `design/referenz/gp7ch2/`; die CH-1-Dateien bleiben unangetastet."

**m8** §1 übernimmt aus E5 (`design/SPEC_GP7CH1.md:67-71`) NICHT den UMRISS-ANTEIL <= 25 % und ersetzt ihn durch „Schwarz k+n <= 25 %". Das sind verschiedene Größen: `skeleton_0` Umriss 49,3 % gegen Schwarz 37,3 %, `warden_idle` 20,8 gegen 23,6. Da §6 ausdrücklich „eine Hand mit dem Menschen-Cast" prüft, sollte die Ersetzung deklariert sein (inkl. der Tatsache, dass auch `player_down_0` mit 29,5 % Umriss über E5s 25 % liegt).

**m9** §1 „FLIP-NEUTRAL (Seitenframes |dL links-rechts| <= 6,5 L)": Gegner haben **keine eigenen Seitenframes**; `enemies.js:637-641` und `boss.js:331` spiegeln die Basisframes. Die Auflage muss für JEDES Gegner-Grid gelten, nicht für eine Framegruppe, die nicht existiert.

**m10** Fußvolk: (a) hat laut V9/§8 keinen Spawn und damit keinen Wirkort, „Körper-L im V2-Fenster" ist für es undefiniert (Fix: „Fußvolk wird gegen das Gruft-Stein-Fenster gemessen, weil es dort in Slice 7 landet"); (b) der Schlüsselpräfix muss festgelegt werden: `npc_fussvolk_*` würde die GP7CH-Maßprobe `.tmp/check_gfx6_art.mjs:844-864` (`/^(player|npc)_/` muss 16x24 sein) reißen, `fussvolk_*` ist frei.

**m11** P0.e Übergangsregel Rost: eine einzige additive Gate-Zeile kann nicht gleichzeitig 16x18 dulden und 20x18 erzwingen, ohne sich selbst zu erfüllen. Sauber ist: P0.e-Commit schreibt „rust_0/_1/_die alle gleich groß UND aus {16x18, 20x18}", der Rost-Commit verschärft dieselbe Zeile auf 20x18. Das sind **zwei** Berührungen von `check_gfx6_art`; §5(3) sanktioniert nur eine. Fix: §5(3) auf „zwei Berührungen (P0.e additiv, Rost-Commit verschärfend)" erweitern.

**m12** §0.2 „Flip-Indizes 8/11/17/20 eingefroren; smoke:5669 zählt sie": die Indizes stimmen (`main.js:106-128`: 8=skeleton_die, 11=ghoul_die, 17=hound_die, 20=rust_die), aber `smoke:5669` zählt **gezeichnete Namen** per `/skeleton_die|ghoul_die/`, keine Flip-Indizes. Formulierung entschärfen, sonst sucht der Umsetzer einen Wächter, den es nicht gibt.

---

# VERIFIZIERTE BEHAUPTUNGEN (Spec hat hier recht, Proben liegen bei)

1. **V6/§0.5 Flash-Bauweg trägt.** `.tmp/gp7ch2_review/engineB_flash.mjs` (eager nach dem TILE_ART-Bau, gezeichnet als LETZTER Draw): **SELBSTPRUEFUNG GRUEN**, `boot 472 -> 592` (120 Flash-Canvases), keine Namensverschiebung. Auch mit **erzwungenem** Flash-Draw bei Alpha 0,8 auf jeder Entity (`engineB_forced.mjs`) bleibt alles grün. `boot` wird in `check_engineB_gp6.mjs:78-80` **nach** `await import('../game/js/main.js')` gemessen, jedes im Modulrumpf erzeugte Canvas liegt also darunter, `istMaske` ist false, die Alpha-Whitelist `:145-148` sieht es nie. **Der Spieler-Puls 0..0,35 über die Flash-Maske ist damit gate-frei.**
2. **Beide Negativkontrollen bestätigen die Warnungen.** Lazy gebaut: `ROT §4.2 Masken-Alpha ... 0.16,0.8,0.08`. Flash VOR den Tint-Masken: `ROT §0.5 Waechter B: JEDEM Masken-Draw geht das ORIGINAL-gfx-Canvas ... voraus` (der Rückwärts-Scan `:132-139` nimmt den Flash als Original).
3. **Die Grid-Vorverarbeitung ist geometrisch korrekt** (nur inhaltlich falsch, s. M1): `buildTintMask` (`sprite_factory.js:68-97`) legt `canvas.width/height` aus dem übergebenen Grid an und überspringt `.` — Maße und Ursprung bleiben identisch, `drawImage(..., ...a)` sitzt deckungsgleich.
4. **Die drei Rigs bleiben grün.** Mit entfernten Blinkzeilen + eager Flash in einem Vollbaum-Klon: check_main **25**, check_inventory **25**, check_boss **33** (inkl. `:253-255` GAME-OVER-Frame). Smoke im Bestand nachgemessen: **825, GRÜN**, 7642 Ticks.
5. **Eigene Decal-Keys lösen beide Wächter wirklich.** `check_inventory_slice2:370` prüft `hasSprite('skeleton_die')` gegen die Ops **des aktuellen Frames** — ein persistentes `skeleton_die`-Decal aus dem Kill bei `:280` macht `oneHit` im ersten Frame wahr. `smoke:5669` zählt `/skeleton_die|ghoul_die/` **unverankert**, `skeleton_decal` matcht nicht.
6. **Kein Maß-Gate für Rost 16x18 -> 20x18** in einer grünen Suite: nur `.tmp/dev_art_slice2.mjs:186` (tot). `check_gfx6_art` und `art_slice3_selfcheck` führen SPRITES-Maßtabellen ausschließlich für warden/ghoul/elite_glow/levelup/icon_key und für `/^(player|npc)_/`.
7. **Bild-M5 ist art-invariant.** `shot_gfx6.py:2810-2816` leitet die Messzeile aus der **AABB** ab (`round(baseY - cam.y) + 1`), eine Zeile UNTER der Fußkante, die kein Sprite verdecken kann. Ein neues Skelett kann die 2-Texel-Marge nicht kippen.
8. **M3s `M3_HALB_NOTINT_MAX` gefährdet die Kunst nicht**: `shot_gfx6.py:2243-2254` führt die wörtliche noTint-Halbseitendifferenz als **Nebenbefund**; das Gate ist der Tint-ANTEIL, und die Fern-Kontrolle wandert nicht in `errors`. Teil A 7.3 (Marge 0,85 L, Grenze 8,2 L Halbasymmetrie) steht.
9. **P0.f ist machbar, hier das Rezept** (in `.tmp/gp7ch2_review/build_probe.mjs` erprobt): `game/js/main.js` in den Scratch kopieren, dabei `from './` -> `from '../../game/js/` **und** `import './` -> `import '../../game/js/` ersetzen; von `check_engineB_gp6.mjs` eine Kopie ziehen und dort **auch die dynamischen** `import('../game/js/...')` umbiegen (sonst `ERR_MODULE_NOT_FOUND` bei `world/maps.js`). Für Flusstest-Proben ist ein Vollbaum-Klon (`cp -r game/js .tmp/.../gjs`) einfacher, weil damit auch `entities/*` patchbar ist.

---

**Einzeiler-Bilanz:** Die Engine-Bauwege stimmen im Kern (eager Flash ist bewiesen gate-frei, eigene Decal-Keys retten die beiden Wächter, alle Rigs bleiben grün), aber vier Dinge kippen die Spec in der vorliegenden Fassung: die Flash-Bedingung blitzt jede Leiche (hurtTimer und invulnTimer frieren im Sterbe-/Tot-Zweig ein), das Decal-Rezept produziert nachgewiesen 7 bis 17 Phantom-Decals bei jedem Kartenwechsel und Respawn, die gesamte Wertleiter ist gegen Bodenkacheln mit 0,3 bis 1,2 Prozent Flächenanteil zurückgerechnet (echtes Skelett-Fenster 81,3..137,0 statt 116,5..127,3), und „Positionsfolgen byte-gleich" ist als Abnahmekriterium beweisbar unerfüllbar (14 von 2400 Frames, gemessen).


# ===== LINSE 2: ART/HORDEN-LESBARKEIT/MACHBARKEIT =====

Alle Pflicht-Lektüre gelesen (Spec Rev 1, Landkarte V1-V13, Teil A + C, CH-1-Anker + SPEC Rev 2.3, palette.js, die 5 Gegner-Grids), 4 Beweisbilder angesehen, alle Zahlen unten selbst nachgerechnet (Proben in `.tmp/gp7ch2_review_art/`, nichts verändert, kein Server).

---

# BLOCKER

**B1 — „Kopf-Schulter ≤55 zu JEDEM Paar" ist unter den eigenen Steckbriefen beweisbar unerreichbar.**
Beleg: ich habe die E5-Profilformel nachgebaut (reproduziert Teil C 0.3 exakt: Skelett/Ghul 86,9, Skelett/Rost 80,4, Ghul/Hund 80,0, Ghul/Rost 77,6). Dann Optimierung über 6 Profile (Warden als Eichkörper fest auf seinem IST `[2,6,12,16,19,20]`), Auflagen direkt aus §3/Teil C §2-3: Skelett „Schädel schmaler als Schultern" + Arme (Schulterzeile ≥10), Ghul „hochgezogene Schultern/breiteste Form" (≥13), Rost „Schulterplatten-Ausladung" (≥16 — die *einzige* Begründung für 20 px), Fußvolk „Kapuze als eine abfallende Linie" (Schulter ≥8):

| Auflagenlage | bestes max. Paar | bindendes Paar |
|---|---|---|
| völlig frei (Zickzack-Profile) | 27,1 | – |
| monoton + Schulter ≥6 + Warden fest | 53,3 | nur mit Skelett `[1,1,1,1,1,6]` / Rost `[4,4,4,4,4,6]` = Stöcke |
| **Steckbrief-Auflagen** | **61,8** | **Ghul/Rost** |

≤55 ist nur mit Figuren erreichbar, die über fünf von sechs Zeilen 1-4 px breit sind. Das bindende Paar ist ausgerechnet Ghul/Rost — das Paar, das der 20-px-Umbau trennen sollte. Präzedenz: G-K hat in CH-1 genau diese Metrik von 70 auf 90 aufmachen müssen; CH-2 verschärft sie auf 55 bei 6 statt 2 Figuren.
Fix: „Kopf-Schulter ≤65 für JEDES Paar; ≤55 nur innerhalb einer Familie; Paare mit dem Warden sind ausgenommen (Eichkörper, eingefroren). Wer 65 reißt, braucht einen NICHT-Profil-Differenzierer (Rückenaufbau, Wertstufe, Rim-Ton) — Nachweis am Squint-Bogen, Muster G-K."

**B2 — „dE00 ≥12 zwischen Rampen" ist im Band L601 80..95 arithmetisch unmöglich.**
Beleg (`maxres.mjs`, Vollscan RGB gegen alle 78 Töne, C\*ab ≤30,4): global größte erreichbare dE00-Reserve je Luminanz — L80 **11,15**, L85 **10,74**, L90 **10,82**, L95 **11,72**, erst ab L100 12,33. Genau dieses Band belegt §1 mit **Grufthund 90..100** und **Rost 85..100**, und die Schattenstufen aller neuen Rampen liegen darunter. Jeder Kandidat, der das Maximum erreicht, sitzt bei C\*ab 29,5-30,4, also hart an der E3-Decke (dieselbe Falle wie M12 in CH-1: „kühl lässt nur 4,7 % Kandidaten, alle hart an U").
Fix: „P0.b rechnet die Reserve je Ziel-L VOR dem Zuteilen. Wo die globale Reserve <12 liegt (L601 80..95, gemessen 10,7..11,7), gilt statt ≥12 zwischen Rampen: ≥10 zu allen 78 UND ≥8 innerhalb der Rampe UND eine dokumentierte Nicht-Farb-Trennung (Familie + Wertstufe + Rim). Deklaration nach Muster G-M."

**B3 — Der Hund-Steckbrief „kalt-neutral in 90..100" beschreibt eine Farbe, die es nicht gibt.**
Beleg (`sektor78.mjs`): freie Hue-Eimer bei L601 90 = **5/36**, bei 95 = 6/36, bei 100 = 8/36. Die Kandidaten dort sind entweder
* hue 199-211 mit **C\*ab 29,3-30,4** (`#008487`, `#068689`, `#128a8d`) — gesättigtes Petrol, exakt die Corm-Wolle/Wasser/`|`-Familie, alles andere als „neutral"; oder
* hue 284-287 mit C 24-29,5 (`#4e5a8a`) — gesättigtes Blauviolett, nächster Bestandston C/X; oder
* hue 25-30 mit C ≈7 (echt neutral, aber **warm**) — und damit von der eigenen Regel „Hue ≥60° vom Weg (gemessen z/p/v/M/P/V = hue 56,3..78,4)" gesperrt.

Die „≥60° von Gras (gemessen 122,9..155,6) UND vom Weg" lässt nur das Fenster ≈216..356 übrig; darin sind bei L90-100 ausschließlich die zwei gesättigten Sektoren oben frei. **Kalt oder neutral — beides zusammen ist bei L 90..100 nicht konstruierbar.**
Fix: „V3 wird präzisiert: Grufthund = kalt-GESÄTTIGT im Sektor hue 195..215 (Petrol, C\*ab 26..30,4) ODER neutral-warm mit Trennung nur über Rim + Wertstufe. Die Formulierung ‚kalt-neutral' entfällt. Die Sperrliste bekommt zusätzlich `t/T/L/D` (Katakomben-Steinrampe, hue 269..274) und `&/(/)`(Corm) namentlich."

**B4 — Die Palettenbilanz steht auf einer falschen Tatsache: `x` und `f` sind NICHT unbenutzt.**
Beleg (Tonzensus über SPRITES + TILE_ART):
* `x` #e0524c: **17 Texel** — `potion:14`, `heart_full:3`. Das ist die Farbe von Heiltrank und Herz, also des wichtigsten Pickup- und HUD-Signals. C\*ab **64,3** (lauteste Farbe des Spiels; E3-Decke ist 30,5).
* `f` #8a92a0: **234 Texel** — `fog_blob`. `hud.js:611` zeichnet 8 driftende Nebelblobs bei `map.fog === true`; **GRAVEYARD hat `fog: true`** (`maps.js:673`) — die Hauptkarte des Grufthunds.
* Zusätzlich: **dE00(f, D) = 3,90** (D = Katakomben-Stein-Spitzlicht, `brick_wall_l1..l4` sind per `check_gfx6_art:580` auf `kTtLD` festgenagelt) und dE00(f, F) = 9,62. `f` würde als neuer Ton die E3-Auflage „≥10 zu allen" selbst reißen; es kommt nur als Bestand durch.

Damit ist V4/P0.b „bis zu 7 neue + x/f aus Bestand" auf Sand gebaut: der Hund bekäme als Spitzlicht die Nebelfarbe seiner eigenen Karte und einen Ton, der 3,9 dE00 von der Gruftwand-Kante entfernt ist.
Fix: „P0.b streicht `f` aus der Hund-Rampe (Beleg: fog_blob 234 Texel, GRAVEYARD fog:true, dE00(f,D)=3,90) und `x` aus allen Figurenflächen (potion/heart_full, C\*ab 64,3). Der Bedarf steigt damit auf 3+2+3 = 8 neue Symbol-Töne; der Deckel in §2 P0.b wird von 7 auf 8 gehoben oder die Ghul-Lumpen auf 1 neue Stufe + Bestand reduziert — ausdrücklich entscheiden, nicht rechnen lassen."

**B5 — „Trenn-Rate im Überlapp ≥80 %": Definition und Anker widersprechen sich; das Gate ist am IST schon fast erfüllt.**
Beleg: Teil C 5.2 definiert Trenn-Rate = „Grenzkanten mit Rim-Texel ODER Wertsprung ≥25 L" und nennt IST **0 %**. Ich habe die Knäuel-Reihe exakt nachgebaut (5 Figuren, 9 px X-Abstand, spätere Figur vorn) und mit dieser Formel gemessen:

| Reihe | Grenzkanten | mit ΔL ≥25 | **Trenn-Rate** |
|---|---|---|---|
| skeleton_0 ×5 | 76 | 60 | **78,9 %** |
| ghoul_0 ×5 | 104 | 64 | 61,5 % |
| hound_0 ×5 | 84 | 56 | 66,7 % |
| rust_0 ×5 | 84 | 28 | 33,3 % |

Ursache: der schwarze Umriss (L 18,3) der vorderen Figur gegen den Körper der hinteren erzeugt ΔL ≥25 quasi überall. Das Bild `knaeuel_ohnerim_4x.png` — das ich angesehen habe und das die Knochenwand zweifelsfrei zeigt — misst nach der eigenen Formel **78,9 %, also 1,1 Punkte unter dem Ziel**. Mit einem einzigen Rim-Texel je Figur wäre das Gate grün, das Bild bliebe eine Wand. Und E5's Pflicht „Werkzeug reproduziert die Anker" ist unerfüllbar, weil die 0 % nicht reproduzierbar sind.
Fix: „Trenn-Rate wird neu definiert: Grenzkanten NUR zwischen den MATERIAL-Texeln (k/n ausgenommen) zweier Figuren; getrennt gilt eine Kante bei Rim-Texel ODER |ΔL| ≥25 ODER dE00 ≥20. Anker VORHER wird in P0.c mit dieser Formel neu gemessen und eingefroren (die 0 % aus Teil C sind ungültig). Zweitgate, das nicht durch den Umriss erschlichen werden kann: mittlere |ΔL| zwischen den Körper-L der benachbarten Typen ≥15."

**B6 — „Fußvolk aus Bestand" hat im Fenster 105..117 keine freie Rampe außer den vier CH-1-Menschenrampen.**
Beleg: alle Bestands-3-Stufen-Rampen in der Nähe von L 105-117 sind vergeben — Knochen O/B/b/N (Skelett-Identität, Rost/Warden ≤10 %), Ghul d/H/3, Rost 4/5/6 (ortsexklusiv), Erde z/p/v/P/V (Hund-Sperrliste + Weg), Gras e/E/a/m/K/A (GY-Sperrliste), Wasser w/W/9/= (Flüstergruft), Stein g/s/S/F (hue 303-307) und Katakomben-Stein t/T/L/D (hue 269-274) sind Boden/Wand der Wirkorte, Umhang u/U/X/^/Z ist Held+Warden. Übrig bleiben **exakt** Krapp `!/G/%` (64/98/134 = Hedda), Wolle `&/(/)` (58,5/80,9/103 = Corm), Leder `:/;/?` (98,3/130,4/158,3 = Bran), Kittel `@/[/]` (100,7/126,1/152,1 = Mile). Für Körper-L 105..117 passen nur Leder und Kittel — das Fußvolk würde als Bran oder Mile lesen. Genau der Defekt, den CH-2 abschafft („Rostpanzer teilt 8 von 9 Tönen mit den Menschen", Teil C 0.2). §1's Sperrliste verbietet das nicht.
Fix: „§1 Sperrliste ergänzen: KEIN Gegner führt eine CH-1-Menschenrampe (!/%/G, &/(/), :/;/?, @/[/]) als dominante Materialfläche — Fortschreibung von E6 über die Artgrenze. Folge: Fußvolk braucht entweder 2 eigene neue Töne (Budget!) oder wird aus CH-2 gestrichen und nach Slice 7 verschoben. Entscheiden, nicht offenlassen."

---

# MAJOR

**M1 — Die Wertleiter in §1 verletzt ihre eigene ≥5-L-Regel im selben Satz.**
Beleg: „Hund 90..100, Rost 85..100, Ghul 105..117, Fussvolk 105..117, Skelett 118..126, Warden 128..134 — Abstand benachbarter Stufen >= 5 L". Gemessene Lücken: 100→105 = 5 ✓, **117→118 = 1**, **126→128 = 2**. Ein Ghul bei 116 und ein Skelett bei 119 sind „im Fenster" und reißen die Nachbarregel gleichzeitig.
Fix: „Bänder trimmen auf DUNKEL 85..100 / MITTEL 105..113 / HELL 120..126 / GROSS 131..134; die ≥5-L-Regel gilt zwischen den gemessenen Ist-Werten, nicht zwischen den Bandrändern."

**M2 — Die Körper-L-Zahl ist nicht die Zahl, die der Zeichner in die Rampe schreibt (E5 zieht die Kontur ab).**
Beleg (`koerperL.mjs`, E5 nachgerechnet, reproduziert Teil A 1.1): Skelett Körper-L 162,6 über **161 Innen-Texel**; Innenraum = `b:93 / B:32 / k:26 / N:10`; die Kontur (101 k, 55 b, 2 N) zählt gar nicht mit. Ohne die 26 schwarzen Innentexel wären es 190,3. Rechnung: um 122 zu MESSEN, muss die Nicht-Schwarz-Innenfläche bei 26 bleibenden schwarzen Innentexeln auf **≈142** mitteln. Gleichzeitig will „Schwarz ≤25 %" genau diese Innen-Schwarzflächen (Augenhöhlen, Rippenfenster) verkleinern — jedes entfernte schwarze Innentexel hebt Körper-L. Die zwei Gates ziehen gegeneinander, und der „dunkelste Materialton" der Anker-Regel 2 sitzt per Definition auf der Kontur, senkt Körper-L also um 0.
Fix: „§1 ergänzen: Körper-L ist eine INNENRAUM-Größe. P0.a gibt je Figur zusätzlich ‚Rampen-Mittel der Innenfläche ohne k/n' aus; Zielband dafür: Skelett 138..148, Hund 95..108, Rost 92..108, Ghul 108..122. Der Zeichner zielt auf diese Zahl, nicht auf die Gate-Zahl."

**M3 — „Frame-Diff ≥ IST" friert beim Skelett das Fußgeschlurfe ein; Teil C's echte Forderung ist verschwunden.**
Beleg: skeleton_0/_1 Texel-Diff 12 (9,0 %), Silhouetten-Diff 8 (6,0 %) — und die Silhouettenänderung liegt **ausschließlich in den Zeilen 14 und 15** (Füße). Dasselbe bei Ghul (Zeilen 16-19) und Rost (14-17): alle drei Walk-Zyklen sind Fuß-Only. Teil C §2 forderte für CH-2 ausdrücklich „Silhouetten-Diff ≥8 % mit Bewegung in ≥2 Regionen"; in §1/§3 steht nur noch „≥ IST".
Fix: „§1: Walk-Paare brauchen Silhouetten-Diff ≥8 % UND Änderung in ≥2 getrennten Zeilenbändern (nicht nur die untersten 3 Zeilen). ‚≥ IST' bleibt als Untergrenze zusätzlich bestehen."

**M4 — Das „zweistufige Sterben" hat faktisch nur eine sichtbare Stufe.**
Beleg: (a) §8 streicht das 2-Frame-Zusammensacken, also ist Stufe 1 eine statische Pose über 24 Frames; (b) §3 sagt „Skelett/Ghul/Rost aus `*_die` ableiten, ≤25 %/6 Z." — aber `skeleton_die` 19,9 %/5 Z., `ghoul_die` 16,3 %/5 Z., `rust_die` 22,9 %/6 Z. sind **bereits decal-tauglich**. Ein aus ihnen abgeleitetes Decal ist dasselbe Bild. Der Spieler sieht: harter Schnitt Stehen→Liegen, 0,4 s Standbild, dann ein Wechsel auf ein identisches Bild. Nur der Hund (41,1 %/7 Z.) bekommt real ein zweites Bild.
Fix: „§3: `*_decal` muss sich von `*_die` messbar unterscheiden — Texel-Diff ≥30 % ODER ≥2 Zeilen flacher ODER Wertabsenkung ≥20 L (Blutlache/Staub). Positivkontrolle in §5(5) prüft den Unterschied, nicht nur die Existenz. Wenn das 2-Frame-Zusammensacken bleibt gestrichen, muss die Spec sagen, dass der Übergang lebend→`*_die` ein bewusster Ein-Frame-Schnitt ist (Hitstop-Kaschierung, HITSTOP_K 3)."

**M5 — Szenen-Schwarzanteil ≤25 % und die Einzeldeckel sind nicht gleichzeitig erfüllbar.**
Beleg: Szene = Σ Schwarz / Σ opak, gewichtet mit dem Bogen-Roster 12/8/5/4/1 (ich reproduziere Teil C's IST exakt: 1889/5027 = 37,6 %). Trifft jede Figur ihren Deckel *punktgenau* (Skelett/Ghul/Rost 25 %, Hund 30 % deklariert, Warden 24,2 %), ergibt sich **25,47 %** — über dem Szenenziel. Ohne die Hund-Ausnahme 24,92 %. Die deklarierte 30-%-Ausnahme wurde nie in die Szenenzahl durchgerechnet.
Fix: „Szenenziel auf ≤26 % setzen ODER die Hund-Texel aus der Szenensumme herausrechnen (deklarierte Ausnahme). Zusätzlich festhalten: der Szenenwert ist ein gewichtetes Mittel der Einzelwerte und damit über das Roster steuerbar — er ist Kennzahl, kein zweites unabhängiges Gate."

**M6 — Das Minderheitsklassen-Kriterium ist ein No-op; die Weg-Pflichtprüfung ist damit still abgeschafft.**
Beleg: V2/§1 „Minderheitsklassen (GY-Weg 11,6 %, Gruft-Wasser) mit weichem Kriterium: dL≥10 ODER dE00≥20 ODER **Rim≥12**". §1 verlangt Rim ≥12 % der Kontur aber ohnehin von **jedem** Gegner. Damit besteht jede Figur das Minderheitskriterium per Konstruktion. Der schlechteste Fall des Spiels (Grufthund auf dem Weg: dL **−16,1**, dE00 **6,6**, Teil A 1.4) wird nie gemessen. CH-1's M17 hatte die Weg-Pflichtprüfung ausdrücklich eingeführt.
Fix: „Weiches Kriterium ändern auf: dL≥10 ODER dE00≥20 ODER (Rim≥12 % UND dL ≥ VORHER + 15). P0.a gibt dL/dE00 gegen Weg und Wasser je Gegner separat aus; Rot dort ist ein deklarationspflichtiger Befund (Muster G-J), kein Freifahrtschein."

**M7 — Rost 20×18 verschluckt sein eigenes Schild; der Offset ist nicht sanktioniert.**
Beleg (`enemies.js:637-659`, AABB 14×16 aus `smoke:3336-3341`): Sprite wird auf `x + 7 − imgW/2` gesetzt. Bei 20 px Breite spannt der Sprite `x−3 … x+16`; `shield_side` (6×12) liegt bei `x + 7 − 3 + faceX·6` = `x+10 … x+15`, vertikal `y+2 … y+13`. Das sind **Sprite-Spalten 13-18 von 0-19 und Zeilen 4-15** — das Schild deckt die neue rechte Schulterplatte vollständig ab und ragt nur noch 1 px vor die Silhouette (heute bei 16 px ragt es 1 px darüber hinaus und bricht die Silhouette). Die einzige Begründung für 20×18 („Schulterplatten-Ausladung", Teil C §2) wirkt genau in der Richtung, in der das Overlay sie zudeckt. `enemies.js:642-659` steht nicht im Sanktionskatalog §5, der Offset kann also nicht nachgezogen werden.
Fix: „§3 B-Auflage: Die Ausladung liegt in den Spalten 0-2 und 17-19; die Spalten 13-18 (Schild-Landezone, gemessen aus enemies.js:646-648 bei AABB 14×16) bleiben dunkel/zurückgesetzt, damit das Schild darauf und nicht darin liegt. Der Silhouetten-Nachweis wird am Horden-Bogen in der SEITEN-Blickrichtung mit gezeichnetem Schild geführt, nicht am nackten Grid."

**M8 — Neue Flip-Keys kippen `smoke` — und §5 verbietet die nötige Pflege.**
Beleg: `tools/smoke_test.mjs:6396-6408` hält `S6_FLIP` als **wörtliche Kopie** der 37er-Flip-Liste aus `main.js:105-128` samt Kommentar „Abweichen verschöbe alle Namen hinter dem SPRITES-Block"; `S6_NAMEN = [...Object.keys(SPRITES), ...S6_FLIP..., ...Object.keys(TILE_ART)]`. Neue SPRITES-Keys am Ende sind folgenlos (beide Seiten lesen live). **Neue FLIP-Einträge sind es nicht**: jeder zusätzliche Flip verschiebt alle TILE_ART-Namen und damit `smoke:6612-6615` (GEGNER/DORF-Gate) und die namensbasierten S6-Zusicherungen. §0.2 erlaubt neue Flips, Teil A 3.3 schlägt sie vor („falls gespiegelt, 5 Flip-Keys hinter Index 36"), §5(6) sagt „NICHTS SONST".
Fix: „§0.2 präzisieren: `*_decal` bekommen KEINE Flip-Keys (eine Leiche hat keine Blickrichtung; main.js kann das Decal bei Bedarf aus dem `*_die_flip`-Canvas einfrieren). Fußvolk ebenfalls keine (§8 sagt das bereits — Teil C's Umfangstabelle ‚5 Grids + 5 Flips' ist damit überholt). Wird doch ein Flip gebraucht, ist `smoke:6396-6408 S6_FLIP` namentlich zu sanktionieren."

**M9 — Die Realmessung aus §6 misst in einer 64-Ton-Welt.**
Beleg: `.tmp/shot_gfx6.py:309` parst die Palette mit `re.finditer(r"^\s*'?([A-Za-z0-9=+*])'?:...")`. Die Zeichenklasse kennt **keinen** der 14 CH-1-Symboltöne — `PALETTE`/`PAL_RGB` enthalten heute 64 statt 78 Töne. `palette_klasse()` (tol 10) klassifiziert jedes Texel auf den nächsten dieser 64; `m1_goodhart` zählt daraus Tonklassen, Cluster und Top-Anteil. §6 verlangt „Bestandskarten-M1 g6_01-05 (neue Gegner im Bild)" — mit 7 weiteren Symboltönen fallen die neuen Gegnerflächen als „(gemischt)" heraus oder werden auf Fremdtöne gemappt. `shot_gfx6.py` steht nicht im Sanktionskatalog.
Fix: „P0.a zieht `.tmp/shot_gfx6.py:309` nach (`[A-Za-z0-9]|[^\\w\\s'\"]` bzw. explizite Symbolliste) und weist die Differenz der M1-Zahlen vorher/nachher aus. §5 bekommt den Punkt (7): `.tmp/shot_gfx6.py` Palettenregex, deklariert."

**M10 — Michaels Geräteauftrag beschreibt eine Situation, die das Spiel nicht herstellen kann.**
Beleg: Flüstergruft (`map_fluestergruft.js:126-150`) = 15 Gegner: 7 Skelett (2 elite), 4 Ghul (1 elite), 3 Hund (1 elite), **1 Rost**. Sight-Radien (`enemies.js:78/94/114/141`): Skelett 96, Ghul 80, Hund 110, Rost 70 px; De-Aggro bei `dist >= e.sight` (`:271`, `:350`, `:394`). Aus der Spawn-Geometrie gerechnet (Wände ignoriert, also Obergrenze): **max. 6 von 15 passen gleichzeitig in einen 320×180-Ausschnitt**, **max. 7 von 15 können gleichzeitig innerhalb ihres Sight jagen**. „Lass dich von allen gleichzeitig verfolgen" ist mechanisch nicht ausführbar. Dazu: 4 der 15 tragen `elite_glow` (blinkt 0,3 s alle 1,2 s) plus einen eigenen `frameLights`-Eintrag — sie sind durch das Overlay unterscheidbar, nicht durch die Kunst; Warden und Fußvolk kommen in der Szene gar nicht vor, der Rost genau einmal, und zwar in der Engstelle vor dem Portal.
Fix: „Geräteauftrag umschreiben: ‚Geh mit ?god=1 durch die Flüstergruft bis in die Schlüsselkammer. (1) Sag mir bei jedem Gegner, den du siehst, welche Sorte das ist, BEVOR du drauf bist. (2) Fühlt sich Draufhauen nach etwas an oder flackert es nur?' Zusätzlich Katakomben (15 Gegner, 3 Rost, KEINE Eliten) als zweite Szene — dort ist die Sortenfrage unverzerrt. Ausdrücklich deklarieren: die 30-Gegner-Horde ist am Gerät nicht herstellbar; ihr Beleg ist und bleibt der Horden-Bogen."

**M11 — Der VORHER-Horden-Bogen ist nicht einfrierbar, wie P0.c ihn beschreibt.**
Beleg: der Prototyp `horde.mjs` erzeugt die Aufstellung aus `seed=12345` + `TYPEN` in fester Reihenfolge 12/8/5/4/1 und verbraucht je Entität 3 `rnd()`-Zieher. Jede Änderung an Roster, Typ-Reihenfolge oder Anzahl **verschiebt alle 30 Positionen**. Außerdem: Tafel C soll „alle sechs Typen plus Held" zeigen — vorher gibt es den sechsten Typ nicht; und ob das Fußvolk in Tafel A/B auftaucht, entscheidet über den Szenen-Schwarzanteil (M5). §2 P0.c sagt nur „deterministisch".
Fix: „P0.c friert wörtlich ein: seed 12345, TYPEN-Reihenfolge und -Anzahl 12 Skelett / 8 Ghul / 5 Hund / 4 Rost / 1 Warden, **kein Fußvolk in Tafel A/B**, Kachelsatz GRUFT = stone_floor + _v1/_v2/_v3 + _cracked mit der Formel `(tx*7+ty*11)%n`, Leinwand 320×180, Y-Sort nach `y+aabb.h`, Schattenprofile wie im Prototyp, Frame 0 jeder Figur. Tafel C ist vorher 5-spaltig, nachher 6-spaltig — deklariert. Vorher-Bogen wird mit sha256 je PNG nach design/referenz/ versioniert."

**M12 — Die drei Varianten je Gegner haben kein Tonbudget, kein Gate und kein Bild.**
Beleg: §3 „3 Varianten als Tauschschlüssel-Definition (JSON, keine Grids)". §2 P0.b verteilt alle 7 neuen Töne auf Skelett 3 / Ghul 2 / Hund 2 — für Varianten bleibt **null**. Ein Tauschschlüssel tauscht aber die 2 obersten Stufen *gegen andere Töne*; aus dem Bestand heißt das zwangsläufig: Skelett-„Verwittert" → Ghul-Oliv oder Gras, Rost-„Grünspan" (kaltes Kupfer) → das Petrol-Feld `&/(/)` (Corm) bzw. `7/8`, Hund-„Blutig" → `x` (Trankfarbe, B4). §1 enthält kein einziges Varianten-Messziel; Teil C's Auflage „jede Variante hält dL/dE00 nach H4 und unterscheidet sich von den Geschwistern um dE00 ≥12" ist ersatzlos weg.
Fix: „Entweder: Varianten fallen aus CH-2 (deklariert, Backlog Kampf-Slice) — oder §1 bekommt die Auflage zurück (Variante hält ihr Körper-L-Fenster, dE00 ≥12 zu den Geschwistern, keine Sperrlisten-Rampe) UND §2 P0.b weist ihnen ausdrücklich nur Bestandstöne zu, die die Sperrlisten überstehen, mit namentlichem Nachweis je Variante. Ohne Rendering ins Bild ist die Abnahme sonst nicht möglich."

**M13 — Flash und Unverwundbarkeit sprechen dieselbe visuelle Vokabel — genau das, was Teil C 4.2 verbietet.**
Beleg: §4 setzt für den Treffer „warmweiß über die Flash-Maske, 3/4 Frames" und für die 1 s Unverwundbarkeit „2-Frame-Flash + Flash-Masken-Puls 6 Hz Alpha 0..0,35" — also dieselbe Maske, derselbe Ton, nur schwächer und länger. Teil C 4.2 argumentiert wörtlich: „Ein Flash markiert ein Ereignis. Unverwundbarkeit ist ein Zustand … ein 1 s langer weißer Flash liest als ‚brennt'". Der Alpha-Puls auf dem Sprite (1,00..0,55), den Teil C stattdessen vorschlug, ist durch `check_engineB` (`org.alpha === 1`) verboten — die Spec ersetzt ihn durch dieselbe Farbe statt durch eine andere Vokabel.
Fix: „Unverwundbarkeit bekommt eine eigene Vokabel: KALTE Maske (Ton aus der `|`-Familie, #abdcda) im 6-Hz-Puls, Alpha nur aus der Whitelist {0,08 0,12 0,16} — warm = getroffen, kalt = geschützt. P0.f prüft die Kalt-Maske mit."

**M14 — „Flip-neutral (Seitenframes)" trifft bei drei von fünf Gegnern ins Leere.**
Beleg: Skelett, Ghul und Rost haben **nur Frontalgrids** (`skeleton_0/_1/_die`, analog Ghul/Rost); die Engine spiegelt genau diese (`enemies.js:634-641`). Der Grufthund ist umgekehrt **ausschließlich** Seitenansicht. §1 bindet die Regel aber an „Seitenframes" — ein Zeichner darf daraus folgern, dass sie für das Skelett nicht gilt. Das Skelett ist zugleich die M3-Messfigur mit der harten Halbseiten-Grenze 8,2 L (Teil A 7.3, IST +0,37).
Fix: „§1: ‚FLIP-NEUTRAL gilt für JEDES Gegner-Grid, weil jedes gespiegelt gezeichnet wird (enemies.js:634-641). Gemessen wird die Halbseiten-L-Differenz der Körpertexel: ≤6,5 L, Skelett zusätzlich M3-hart ≤8,2 L.' Dazu die Rechenhilfe für den Zeichner: bei ~67 Körpertexeln je Hälfte verschiebt EIN Rampenschritt (≈25-30 L) auf 9 Texeln die Halbseite um ~4 L — die Pose ‚ein Arm hängt, einer erhoben' hat also Budget für genau EINEN Stufenunterschied zwischen den Armen, nicht zwei."

**M15 — „Decal-Bodenbedeckung ≤12 %" kann nie feuern.**
Beleg: Deckel 24 (§5(5)), Decal ≤25 % Rahmen, Bildfläche 320×180 = 57 600. Worst Case gerechnet: 24 × 16×16 × 25 % = 2,67 %; 30 Tode = 3,33 %; Rost 20×18 = 3,75 %; Ghul 16×20 = 3,33 %. Das Gate liegt um den Faktor 3,2 über dem physikalischen Maximum — es ist tot.
Fix: „Ziel auf ≤4 % korrigieren ODER die Größe auf die BEGEHBARE Fläche des Ausschnitts beziehen (dort ist der Worst Case ≈6-8 %) ODER das Gate streichen und durch die Sichtprüfung ‚Tafel D liest als Schlachtfeld, nicht als Teppich' ersetzen. So wie es steht, ist es eine Nullmessung."

**M16 — Decals können mitblitzen (kein Ausschluss deklariert).**
Beleg: §4 nennt die Nie-Blitzen-Liste „sword_slash/npc_blase/NPCs". Decals werden nach Teil A 3.3 mit `tintDrawImage(gfx[d.key], …)` gezeichnet, also durch dieselbe Fassade, deren `tintCfg.flash` von `pushTinted` gesetzt wird; die Decal-Schleife läuft aber **außerhalb** von `pushTinted` (eingefrorene warmA/kaltA). Ein stehengebliebenes `flash = 1` aus dem letzten `pushTinted` lässt die Leichen blitzen.
Fix: „§4 ergänzen: Decals setzen `tintCfg.flash = 0` explizit vor jedem Draw; Gate in §5(5): ‚in keinem Frame wird ein `*_decal` mit gesetztem Flash gezeichnet' (headless zählbar)."

**M17 — Die Profil-Lesart ist in zwei bindenden Dokumenten verschieden, und die Vorrangregel wählt die falsche.**
Beleg: Landkarte sagt „WO A UND C ABWEICHEN, GILT A"; §0.1 sagt „Landkarte-C-Zahlen sind KEINE Anker". Teil A 5.1 misst Skelett/Ghul 65,2, Ghul/Rost 72,4, Hund/Rost 43,1; Teil C 0.3 misst **fußbündig** Skelett/Ghul 59,7, Ghul/Rost 78,9, Hund/Rost 57,9 und nennt Teil A's Lesart „methodisch falsch" (die Engine setzt Füße auf die AABB-Unterkante, `enemies.js:639-641`). §1 schreibt „Profil (E5, **fussbuendig**)" — also Teil C. Ich reproduziere mit der fußbündigen E5-Formel Teil C's Kopf-Schulter-Zahlen exakt (86,9 / 80,4 / 80,0 / 77,6) und ganze Figur 59,7 / 78,9. Differenz bis 8 Punkte — das entscheidet über Grün/Rot.
Fix: „§0.1 präzisieren: ‚Für das PROFIL gilt ausdrücklich die fußbündige Lesart aus Teil C 0.3; Teil A 5.1 ist mit kopfbündiger Ausrichtung gerechnet und wird NICHT als Anker eingefroren. P0.a reproduziert die sechs Teil-C-Werte als Positivkontrolle.'"

---

# MINOR

**m1** Hund-Fenster: §1 sagt 90..100, V2 (bindend) sagt für „Skelett/Hund [95..127]". Nachgerechnet stammt die 95,2 aus BOSS_KAMMER (`stairs_up` 44,9 +50), und der Hund läuft dort nicht — sein echtes Fenster ist 88,1..127,3. §1 hat recht, V2's Text ist falsch. → *Fix: V2 im Spec-Kopf korrigieren („Skelett [95..127] wegen Boss-Adds, Hund [88..127]"), sonst zielt der Zeichner auf 95 statt 90.*

**m2** §5(1) „je genau eine Zeile": `enemies.js:620` ✓ und `boss.js:324` ✓, aber `player.js:229-231` ist ein dreizeiliger `if { return; }`-Block. → *Fix: „enemies.js:620 eine Zeile, boss.js:324 eine Zeile, player.js:229-231 ein dreizeiliger Sichtbarkeits-`if`-Block — sonst nichts."*

**m3** Flash-Ton: Teil C nennt `#fff4dc`; L601 = **244,55**, hellster Körperton `N` = 232,9 → **+11,65**, reißt die eigene „≥12 L"-Auflage. Rost und Warden behalten `N`. → *Fix: Ton in §4 festnageln auf `#fff8ea` (L 248,5, +15,6) und die Auflage „≥12 L über dem hellsten Körperton JEDER blitzenden Figur" explizit auf Warden/Rost beziehen.*

**m4** Der warme Rim `_` hat L 203,7, `b` hat L 203,3 — **ΔL 0,4**. Solange Rost und Warden `b` führen (≤10 % Rippenlinie erlaubt), ist ihr Rim im Graustufen-Squint unsichtbar; er trennt nur über dE00 16,45. → *Fix: Rost/Warden bekommen `|` (L 205,1, dE00 zu b = 20,44) oder die Rippenlinie darf `b` nicht an der Kontur führen.*

**m5** Solitär ≤8 % gegen „Sehnen" und 3 Stufen in 2-px-Geometrie: Hund heute 22,7 % (15/66) bei 111 Texeln; erlaubt wären nach Abzug ~5 Texel. Eine 1-px-Sehne ist per 4-Nachbarschaft eine Kette von Solitären. Der einzige Ausweg wäre der „merkmal"-Deckel (12/Grid) — genau der Missbrauch, den G-C ausschließt. → *Fix: §1 Zusatz: „Sekundärstrukturen (Sehnen, Rippen, Nieten) laufen mindestens 2 Texel in einer Richtung; 1-px-Diagonalen sind Rauschen und zählen als Solitär. Der Merkmal-Deckel gilt nur für Augen/Glut/Glanz, namentlich in der Material-Tabelle."*

**m6** Der Spieler-Puls „Alpha 0..0,35" liegt nicht auf der `check_engineB`-Whitelist `{0,08 0,12 0,16 0,24 0,36}`. Heute unkritisch (Flash-Canvases sind vor-Boot), aber P0.f ist genau die Probe, die das absichern soll. → *Fix: Puls auf diskrete Stufen {0 0,08 0,12 0,16} legen.*

**m7** Squint-Gate „≥5/6 bei 1x, 6/6 bei 6x (Juror)" ist nicht messbar spezifiziert: kein Verfahren, kein Juror-Protokoll, keine Aussage welcher Typ die eine erlaubte 1x-Fehlstelle sein darf, und die Graustufen-Pflicht (Teil C 5.2 „Farbe UND Graustufe") fehlt in §1. Der Juror ist derselbe Agententyp, der die Kunst gemacht hat. → *Fix: „Der Squint-Test läuft blind: der Juror bekommt die 6 Squint-Kacheln in zufälliger Reihenfolge OHNE Legende und benennt; ein Typ gilt als benannt, wenn er ihn in Farbe UND Graustufe trifft. Juror ist nicht der Zeichner. Die erlaubte 1x-Fehlstelle ist namentlich das Fußvolk (kleinste Figur), niemand sonst."*

**m8** §8 „Fußvolk ohne CREATORS/Spawn/Flip" widerspricht Teil C's Umfangstabelle („5 Grids plus 5 Flips") und Teil C §3 („die Flip-Einträge in main.js"). §8 hat recht (der Bogen spiegelt das Grid selbst, `horde.mjs:zeichne(...,flip)`). → *Fix: in §8 den Widerspruch namentlich auflösen.*

**m9** Der eingefrorene Decal-Tint (`warmA/kaltA` beim Splice) wird falsch, sobald sich das Licht bewegt — in der Flüstergruft laufen 4 Eliten mit eigenem `frameLights`-Eintrag (`enemies.js:684-688`) und der Spieler trägt die Laterne. → *Fix: als bewusste Entscheidung deklarieren („Leichen behalten das Licht ihres Todesmoments — Kosten: 0 Updates; Revision CH-4") statt stillschweigend.*

**m10** „Kopf-Schulter ≤55 zu JEDEM Paar" nennt die Menge nicht. Ist der Held dabei (V-SPEC prüft ja „eine Hand mit dem Menschen-Cast"), dann müssten Rost/Held 76,9 und Ghul/Held 75,0 auf 55 — gegen einen eingefrorenen CH-1-Anker. → *Fix: „Paarmenge = die sechs Gegner untereinander. Gegen die CH-1-Menschen wird nicht gemessen, sondern beim Cast-Juror gesehen."*

**m11** „Silhouetten-Verlust-Frames je Treffer = 0" kollidiert mit dem in §8 bewusst erhaltenen Hund-Aufsteh-Blink (`enemies.js:621-624`, ~9 von 18 Frames unsichtbar). Ein naiver headless-Zähler zählt ihn mit. → *Fix: „Gate zählt nur Frames innerhalb `hurtTimer > 0` (Gegner) bzw. `invulnTimer > 0` (Spieler). Der `down`-Telegraph des Hundes ist ausdrücklich ausgenommen."*

**m12** Hund-Decal: §1 gibt generisch ≤25 %/≤6 Zeilen; Teil C forderte für `hound_rest` ≤25 %/**≤4** Zeilen (weil `hound_die` bei 7 Zeilen und Zeilenband 4-10 zu hoch im Rahmen sitzt). Bei 16×12 sind 6 Zeilen die halbe Grid-Höhe. → *Fix: Hund-Decal ≤4 Zeilen, Zeilenband 8-11.*

**m13** `x` #e0524c hat C\*ab **64,3** — mehr als das Doppelte der E3-Decke 30,5 und der lauteste Ton des Spiels (nächste: `6` 53,8, `8` 48,0, `5` 43,5). Teil C setzt ihn für Hund-„Blutig" und Fußvolk-„Blutfleck" ein. → *Fix: mit B4 zusammen streichen; Blutakzente über `r/R` (C 18,0/38,6) oder `!` (18,8).*

---

## EINZEILER-BILANZ

**6 BLOCKER / 17 MAJOR / 13 MINOR.** Die Spec ist engine-seitig sauber recherchiert (Flash eager-nach-Tiles, eigene Decal-Keys, DIE_TIME byte-gleich — alles nachgeprüft und tragfähig), aber ihre KUNST-Gates sind an drei Stellen arithmetisch unerfüllbar (Kopf-Schulter ≤55 → Optimum 61,8; dE00 ≥12 im Band L 80..95 → Maximum 10,7..11,7; „kalt-neutral" bei L 90..100 existiert nicht), stehen auf einer falschen Palettentatsache (`x` = Trank/Herz mit 17 Texeln, `f` = fog_blob mit 234 Texeln auf der Nebel-Karte GRAVEYARD und 3,90 dE00 vom Gruftwand-Spitzlicht), messen mit der Trenn-Rate und der Decal-Bodenbedeckung zwei Größen, die das Beweisbild mit 78,9 % bzw. den Worst Case mit 3,75 % schon heute passieren — und die einzige menschliche Abnahme fragt nach einer Horde, die die Flüstergruft mit max. 6-7 gleichzeitig sichtbaren Gegnern gar nicht herstellen kann.
