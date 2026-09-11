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
