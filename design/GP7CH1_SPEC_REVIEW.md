# GP7-CH-1 Spec-Review (16.08.2026) — beide Linsen, Fix-Formulierungen BINDEND



# ===== LINSE 1: TESTS/WAECHTER/MESSBARKEIT =====

## GP7-CH-1 SPEC-REVIEW — Linse TESTS/WÄCHTER/MESSBARKEIT

Alles unten ist gegen den echten Code/Tests nachgerechnet. Eigene Proben: `/home/coder/Grimlight/.tmp/gp7ch_review/probe1..13.mjs` + `color.mjs` (nur lesend; keine Spieldatei, kein Test, kein Server berührt).

---

## BLOCKER

**B1 — V4 ist am Bauweg der Spec nicht baubar: `span` an einem GROUND-Zeichen wirft.**
`/home/coder/Grimlight/game/js/world/tilemap.js:744-753`:
```js
if (sw > 1 || sh > 1) {
  if (def.variants || def.anim) throw ...
  for (let ty = 0; ty < hTiles; ty++)
    if (rows[ty].indexOf(ch) !== -1) throw new Error(`createTilemap: span-Zeichen '${ch}' (w>1/h>1) kommt in den GROUND-rows vor (Ground bleibt 1x1)`);
}
```
`span:[1,2]` erfüllt `sh>1`. T/t stehen in `DORF_ROWS` (7 Stück: (21,4) (30,8) (5,9) (12,9) (5,18) (11,22) (25,23)). Real ausgeführt (probe1.mjs):
`SPEC-VARIANTE WURF: createTilemap: span-Zeichen 'T' (w>1/h>1) kommt in den GROUND-rows vor`.
Folge: nicht „ein roter Check", sondern eine **Exception** in jedem Boot-Rig und in `geoHash` (smoke:5881-5887 ruft `createTilemap`) — der ganze Smoke-Lauf stirbt. §2 („map_dorf-Legende T/t bekommt span [1,2]") und §0.1 („einzige Nicht-Art-Edits: map_dorf.js-Legende T/t") beschreiben damit einen unmöglichen Bauweg.
**Fix-Wortlaut:** V4 in §2/§0.1/§6 streichen und durch einen der drei Wege ersetzen (siehe B2).

**B2 — Auch der Over-Weg trägt nicht: über JEDER Tür liegt bereits ein Dach-Span.**
Gemessen (probe2/probe3.mjs) für alle 7 Türen: die Zelle über der Tür ist von einem Over-Span-Dach zu **75 % (192/256) bzw. 100 % (256/256)** opak überdeckt; die Türzeile selbst ist schon heute zu 25-37 % vom Traufenrand überzeichnet. Beispiel: Tür (21,4) unter `dorf_dach_b`, Anker (20,2), span[4,3] → Zelle (21,3) = 256/256 opak. Zusätzlich, alles ohne tilemap.js-Edit unvermeidbar:
- **Anker-Jitter**: `tilemap.js:1219-1222` + `anchorOffset` (`:537-550`). Ohne eigene `ANCHOR_CLAMP`-Zeile gilt `ANCHOR_CLAMP_DEFAULT = 14` (`:533`) → gemessene Versätze der 7 Türanker: dx **+9/+9/−14/−4/−4/−5/−5**, dy **−1/+1/0/+3/−2/0/−3**. Mit W=0-Zeile bleibt dy ±4 („dy bleibt ungeklammert", `:521-522`).
- **Sway**: `tilemap.js:1236` `if (!def.swayPoses) ax += swayPhase(...).dx` → die Tür wiegt sich wie eine Krone. Ohne `span` greift stattdessen `:1259` mit `HANG_SWAY_AMP` (±2 px).
- **Halbtransparenz**: `tilemap.js:1280-1287` — steht der Spieler im Span-Fußabdruck, wird die Tür mit `CROWN_PLAYER_ALPHA` gezeichnet. Genau beim Herantreten.
- Ein 16x32-Grid als GROUND-Kachel scheidet aus: `drawImage(img, ax, ay)` zeichnet nach **unten**, nicht nach oben.
`ANCHOR_CLAMP`/Sway/Alpha stehen in tilemap.js — §0.1 zählt die erlaubten Nicht-Art-Edits abschließend auf, tilemap.js ist nicht dabei.
**Fix-Wortlaut (empfohlen):** „V4 wird auf **zwei Kacheln BREITE** statt doppelte Höhe umgestellt (Teil C 4.1 zitiert die Recherche wörtlich so: *Türöffnungen auf 2 Kacheln verbreitern, nicht die Figur schrumpfen*). Umsetzung: 2-4 neue 16x16-Keys `dorf_tuer_zu_l/_r` (+ offen), 2 neue Legendenzeichen mit `solid:true`, 7 Ein-Zeichen-Änderungen in DORF_ROWS, bei denen ausschließlich SOLIDE Wandzeichen (V/W/Z/C) durch solide Türhälften ersetzt werden → **sol-Hash byte-gleich**, geo unberührt, **§6(2) entfällt ersatzlos** (keine neue Maßklasse). Alternative nur mit eigener Sanktion: 16x32-Over-Tür + ANCHOR_CLAMP-Zeile W=0 + Sway-Ausnahme + Alpha-Ausnahme in tilemap.js + Neuschnitt der Traufenzeile in 7 Dachgrids — das ist kein CH-1-Nebenauftrag."

**B3 — §3 dL-Band 25..90 „gegen JEDE begehbare Leitkachel" ist nicht durchgerechnet und kollabiert den ganzen Cast.**
Gemessen (probe5.mjs, Mittel-L aller begehbaren Kachel-Arts je Karte):
- DORF: `,`51,3 · `S`69,4 · `D`70,1 · `.`72,8 · `=`90,9 · `-`91,5
- alle 5 Karten: dunkelste begehbare Kachel `crypt_stairs_down` **37,5**, hellste `path_v6` **91,5**
Zulässiges Körper-L, damit |dL| ∈ [25,90] gegen ALLE gilt:
- NPCs (nur DORF): **116,5..141,0** (oder 1,5..26,0 = dunkler als der Umriss k L18,3 → absurd)
- **Held (läuft auf allen 5 Karten): 116,5..127,5 — ein 11 L breites Fenster.**
IST: Held 80,4 · Torwächter 92,3 · Hedda 97,8 · Corm 99,3 · Bran 105,0 · Mile 115,4 → **alle sechs fallen durch**, und die Erfüllung zwingt alle sechs Figuren in ein 25-L-Band (Held sogar heller als Bran). Das arbeitet direkt gegen „man erkennt aus der Entfernung, wer wer ist", gegen T8 („Skelett schreit bei dL 133") und gegen die Grunddirektive (CLAUDE.md „düstere Diablo-Stimmung"; ART_DIRECTION.md:24 „Boden bleibt sehr dunkel; helle Töne sind Akzente"). Das ist exakt der GP6-Fehler: Ober- UND Untergrenze gesetzt, Schnittmenge nie gerechnet.
**Fix-Wortlaut:** „dL wird gegen die **Kacheln des Wirkorts** gemessen (Standkacheln im Wanderradius), nicht gegen jede begehbare Kachel des Spiels; das Band wird je Figur GESTAFFELT vergeben (Tabelle in §3, z. B. Held 30, Hedda 45, Corm 50, Bran 60, Mile 70, Torwächter 55, jeweils ±10), und der Weg (L 90,9/91,5) liefert die Untergrenze, nicht zusätzlich die Obergrenze. Die zulässigen Körper-L-Fenster werden vor Baubeginn ausgerechnet und in §3 als Zahlen eingetragen."

---

## MAJOR

**M4 — §3 Sperrliste misst am falschen Ort.** Alle 5 NPCs stehen auf `path`/`dorf_lehm_00`, deren dominante Rampe **Erde** ist (`path`: M 233 von 256 Texeln; `Lehm`: v 164). Wörtlich angewandt verbietet die Regel also nur die Erdrampe — die Klammer „(Bran!=Holz, Corm!=g/s)" ist aus der Definition **nicht ableitbar**. Der reale Konflikt ist der Hintergrund (probe12.mjs): Bran → `dorf_fenster_vernagelt` (n/j/k/q) + `dorf_amboss` (v/k/s/g); Hedda → `dorf_tuer_zu` (q/j/Q); Corm → `dorf_tuer_offen` (n/q/j); Mile → `dorf_theke_r` (v/k/Q/j); Torwächter: nichts Solides in 2 Zeilen (sein Rost-Konflikt sind die Ziegel im Osten).
**Fix:** „Wirkort := die SOLIDEN Kacheln im Wanderradius (npcs.js:51 Radius 24 px) **plus** die Standkacheln. Verbotene Rampen je Figur werden namentlich in §3 gelistet."

**M5 — §3 „Umriss ≤ 25 % UND ≥ 3 Umrisstöne": zwei unvereinbare Lesarten, die tonbasierte ist selbstauflösend.** Gemessen (probe13.mjs), Ton-Lesart (k+n / opak) vs. geometrische Lesart (Randtexel / opak):
Held 35/29 · Bran 34/28 · Hedda 27/29 · Corm 27/23 · Mile 35/32 · Torwächter 28/27; Randton-Anzahl geometrisch: 5/1/3/1/1/4 → Hedda und Torwächter erfüllen „≥3 Töne" heute schon. In der Ton-Lesart sinkt „Umriss-Anteil" automatisch gegen 0, sobald Sel-Out den k-Ring durch Materialtöne ersetzt — der Gate misst dann nichts mehr.
**Fix:** „Umriss := opakes Texel mit ≥1 transparentem 4-Nachbarn oder Rahmenkante. Umrisstöne := verschiedene Töne auf dieser Menge, jeder ≥8 Texel. Anteil = Umriss/opak ≤ 25 %."

**M6 — §3 „Rim ≥ 12 % der Kontur": Nenner undefiniert, Positivkontrolle dadurch unerfüllbar, und es sind keine Rim-Töne budgetiert.** Held-Z = 8 Texel = **11 %** der geometrischen Kontur (73) — Teil C nennt dieselbe Größe „~6 %". Die Auflage aus §3 („P0.d gegen die ALTEN Grids muss die IST-Werte reproduzieren") ist damit für Rim nicht erfüllbar. Zusätzlich: P0.b vergibt 8 Töne, alle Stoff (3 G + 3 Wolle + 2 Reserve) — **kein einziger Rim-Ton**, obwohl §3 „Ton je Figur definiert" für 6 Figuren fordert; die naheliegenden Bestandstöne (S, i, b, V) liegen genau in den per Sperrliste verbotenen Rampen.
**Fix:** Kontur = Randtexelmenge aus M5; Rim-Ton je Figur in §2 namentlich festlegen und im Palettenbudget mitzählen (8 → 8+n).

**M7 — §3 „Profilähnlichkeit ≤ 70": Formel existiert nirgends im Repo.** Sie steht ausschließlich im Sitzungs-Scratchpad des Teil-C-Analysten, `measure2.mjs:92-99`: `100*(1 − Σ|a_i−b_i| / Σ max(a_i,b_i))` über zeilengleich indizierte Breitenprofile, ohne Höhennormierung. Nachgerechnet (probe7.mjs): IST-Maximum **90** (Bran/Corm, Bran/Torwächter); Held/Bran 89, Held/Torwächter 88. Machbarkeit (probe7/8): 6 Profile mit allen 15 Paaren ≤70 gelingen nur mit 4-6 px schmalen Strichfiguren; 4 „erwachsene" Profile (Schulter ≥9, ≥20 belegte Zeilen) sind machbar, verlangen aber ~30 % Breitenspreizung je Paar (gefundener Satz: 5-7 / 9-12 / 9 / 14 px). Der Wert ist außerdem billig über Vertikalverschiebung erkaufbar, und die Spec sagt nicht, welches Helden-Grid gemessen wird (Teil C: `player_down_0`).
**Fix:** Formel wörtlich in §3 einsetzen, `player_down_0` als Helden-Referenz festschreiben, und je Figur ein Ziel-Breitenband vorgeben (sonst iteriert der Art-Agent blind gegen eine 15-Paar-Matrix).

**M8 — §3 „Materialfläche ≥ 40 Texel" ist nicht maschinell entscheidbar.** Es gibt keine Ton→Material-Zuordnung in den Daten; Teil C hat „Hedda Kleid 83 Texel" von Hand bestimmt. P0.d kann das nicht messen.
**Fix:** „Der Art-Agent liefert eine MATERIAL-TABELLE (Figur → Material → Tonmenge) als Teil des Deliverables; P0.d liest sie und misst Stufen/Schrittverhältnis/Dominanz je deklarierter Fläche."

**M9 — §0.3 M5-Warnung ist sachlich falsch.** Nachgerechnet (probe9.mjs, Logik 1:1 aus smoke:3336-3372): gezählt wird ausschließlich die Zeile `dy=-1`, und die liegt bei JEDER Klasse vollständig **unter** dem Sprite. Ersetzt man jedes Grid durch ein volldeckendes Grid, ändert sich **kein einziger Wert** (11/11/13/13/13/18/11/11/14 = `round(w*0,9)`). Der Gate hängt allein an der AABB-Breite, die CH-1 nicht anfasst; die Negativkontrolle liefert für alle Klassen 0 und ist ebenso invariant. „Margen 3-10 Texel, Fußbreiten-Änderungen" ist eine erfundene Auflage, die den Art-Agenten grundlos einschränkt (Fehlerklasse „Formel, die Bestandskunst verboten hätte").
**Fix:** „§0.3: M5 (smoke:3336-3392) ist bewiesen art-invariant, solange die AABB unangetastet bleibt (Beweis: volldeckendes Ersatz-Grid ändert die Zählung nicht). Stattdessen zu beachten ist das BILD-M5 aus `.tmp/shot_gfx6.py` (`texel_ueber_schwelle` 10 gegen `soll_texel` 8 = Marge 2, Beleg `.tmp/g6_proof_results.json`)."

**M10 — §0.4 M3/M4-Nachzug ist so nicht ausführbar.** `.tmp/shot_gfx6.py:106` importiert `playwright.sync_api`; im Environment: `ModuleNotFoundError: No module named 'playwright'` (nur die Browser-Binaries liegen in `~/.cache/ms-playwright`). `:110 BASE = "http://127.0.0.1:8124"` — das Skript startet **keinen** Server. Die Spec nennt weder Aufruf (`python3 .tmp/shot_gfx6.py m3,m4`, Teillauf-Schalter `:117 ONLY`), noch Server/Port, noch die Abhängigkeit, noch die heutigen Margen. „Schwellen FEST" ohne IST-Werte lädt zum stillen Drift ein. IST aus `.tmp/g6_proof_results.json`: `player_down_0` dWarm **66,53** (min 18), K3-Tint-Anteil NAH **11,02** (min 6), ausgebrannt **0**; M4 V(Kopf) **0,529** (Band 0,45..0,85), voll_lesbar **100 %** (min 25), voll_silhouette **265** gegen Referenz **275** bei ±10 % Warnschwelle → eine umgebaute Helden-Silhouette kippt diese Warnung leicht.
**Fix:** §0.4 um Aufruf, Server (Port 8124, nicht 8123), Installationsschritt und die vier IST-Zahlen ergänzen; die 275er-Referenz ausdrücklich als Warnung-ohne-Gate deklarieren.

**M11 — §0.2 „check_gp6_art_self 5 Rot" wird nicht halten.** `.tmp/check_gp6_art_self.mjs:26` `sym.length === 3 && sym.join('') === '=+*'` kippt durch die 8 neuen Symbole; `:41-47` prüft TILE_ART gegen `MASSE = {16x16,32x32,48x32,64x48,64x32}` und kippt durch jedes 16x32-Türgrid. Aus 5 Rot werden 6-8 Rot.
**Fix:** wie SLICE6_PHASE2_NOTIZEN:55-59: neue erwartete Rot-Zahl **und** die namentlich betroffenen Zeilen vorab deklarieren.

**M12 — §2 fordert ein Messziel, das §3 nicht kennt und das laut Teil C zu CH-3 gehört.** „Talk-Frames werden ECHT (≥6 % Texel-Diff MIT Silhouettenänderung)" steht in §2; §3 („die CH-1-Gates laufen NUR ueber dieses Werkzeug") enthält es nicht; Teil C listet exakt diese Metrik unter CH-3 (`GP7CH_LANDKARTE_C_ZIELBILD.md:309`). Anforderung ohne Gate + Pass-Schnitt-Widerspruch zu §8.

**M13 — Stilbibel bleibt im Widerspruch.** `design/ART_DIRECTION.md:23` („Alle Figuren haben eine geschlossene k-Kontur") wird von §3 (Sel-Out, ≥3 Umrisstöne, Umriss entfällt auf Dunkel) frontal verletzt; `:35` Regel 10 („Neue Farben nur als komplette Rampe") von P0.b („2 Reserve-Toene fuer Leinen-warm/Akzent"). §6 verbietet jede weitere Änderung („NICHTS SONST").
**Fix:** §6(3) einfügen: „Doku-Sanktion ART_DIRECTION.md:23 und :35 (Regel 2 + Regel 10), Marker GP7CH, Wortlaut minimal."

---

## MINOR

**m1 — §6(2) Gegen-Gate: Entwarnung, aber Wortlaut nachziehen.** Verifiziert: `tools/smoke_test.mjs:1744-1761` (MASSTABELLE), `:1763-1771` (Maß-Gate), `:1773-1777` (Gegen-Gate) und `.tmp/check_gfx6_art.mjs:127-140/163-166/167-172`. Das Gegen-Gate prüft nur, dass die **fünf gelisteten** Klassen belegt sind (`['16x16',...].every(k => klassen.has(k))`) — eine sechste Klasse zwingt es zu nichts, 16x16 bleibt belegt. Aber beide Check-Titel/Kommentare nennen die Klassenmenge wörtlich; sonst lügt der Testtext.

**m2 — §6(1) Zeilenbeleg stimmt** (`check_gfx6_art.mjs:74-79`, Assertions `:76`/`:77`). Die Kommentare `:5` und `:14` behaupten ebenfalls „61 alnum + 3 Symbole" → in die „Wortlaut minimal"-Sanktion aufnehmen. **Vollständigkeitsprobe bestanden:** in den GRÜNEN Suiten deckelt nur diese eine Stelle den Zeichensatz; `smoke:81-93`, `art_slice3_selfcheck:10-20`, `sprite_factory:17-19` prüfen nur Mitgliedschaft in PALETTE. `check_gfx4_art:16-19`, `check_gfx5_art:51-54`, `check_art_gp5_self:14-19`, `check_art.mjs:27-31` sind tot/abgelöst.

**m3 — 8 kollisionsfreie Symbole existieren** (probe6.mjs): frei von PALETTE **und** allen Legenden **und** allen Grids sind 24 ASCII-Zeichen; quell-/regexunkritisch davon 17: `! " % & ( ) : ; < > ? @ [ ] ^ _ |`. Belegt: `* + =` (Palette/Grids), `# , - = ~` (Legenden). Empfehlung: die 8 Zeichen in der Spec benennen statt dem Rechner zu überlassen.

**m4 — dE00≥10 ist erfüllbar, die Sperrliste aber unvollständig.** Machbarkeit (probe10/11.mjs, C*ab<30,5 gegen u/U/X/Z + q/j/Q/c/J + g/s/S + 4/5/6 + z/p/v/M/P/V): G_dunkel L65 im Krapp-Fenster → 532 Kandidaten (bestes `#682a3e`, min dE00 15,1); G_hell L130 → 1104 (bestes `#b67074`, 18,9); Wolle-Stufen 2100-10500 Kandidaten. Der Bestandston G selbst hält 16,1 — die 10er-Auflage ist bestandskompatibel. **Fehlt in der Sperrliste:** Knochen O/B/b (Teil C: „Mile Leinen O/B grenzt an die Knochenrampe") und Stahl C/i (Torwächter-Haube). Die Fackelkern-Regel ist korrekt zitiert (`palette.js:71-73`, C*ab('1')=30,5).

**m5 — Umfangs-Ehrlichkeit.** Grid-Zahl stimmt (probe9.mjs: 17 `player_*` + 15 `npc_*` in 16x24; `npc_blase` ist der 16. npc-Key, 8x8) — aber V5/Teil C §5 versprachen „~21 Grids"; die Spec vergrößert das Deliverable um 50 % und gibt es **einem** Agenten, der zusätzlich palette.js, sprites_tiles.js und map_dorf.js besitzt. Empfehlung: Phase 1 aufteilen in 1a Held (17 Grids), 1b NPCs (15 Grids, gleiche Datei → seriell), 1c Türen+Palette (andere Dateien → echt parallel; genau dafür ist V2 da).

**m6 — Umfangslücken.** `sword_slash_down/up/side` steht weder im Deliverable noch in §4s Nicht-Anfassen-Liste, wird aber geflippt (`main.js:108`) und gehört zur Helden-Klinge → entscheiden. `shield_side/up/down` gehört dem **Rostpanzer** (`enemies.js:644-646`), nicht dem Helden → als CH-2 deklarieren, damit es niemand „mitrepariert". `npc_blase` ist korrekt ausgenommen, hängt aber an der **Rahmen-Oberkante** (`npcs.js:222-225`: `n.y + n.h - img.height - b.height - 1`) → Auflage „Kopfoberkante bleibt in Zeile 0/1" ergänzen, sonst schwebt die Questblase.

**m7 — Flip-Konsequenz fehlt.** Mile und Torwächter werden beim Linkslaufen geflippt (`main.js:126-127`, `npcs.js:203-208`). „Tasche auf EINER Hüfte" und „Speer geneigt" springen dadurch die Seite. Entweder ausdrücklich akzeptieren oder die Asymmetrie flip-neutral setzen.

**m8 — P0.c braucht keinen Browser.** Ein reiner Node-PNG-Dump existiert (`.tmp/png.mjs` + `.tmp/gp7ch_probe/render.mjs:1-2` „KEIN Server, KEIN Browser"). In der Spec benennen. Der Bogen sollte die **echten** Kacheln kacheln (path L 90,9 / dorf_lehm_00 72,8 / grass_dark_v3 48,1), nicht wie die Teil-A-Sonde flache Mittelfarben.

**m9 — §0.2-Kanon real nachgelaufen:** check_main_slice1 **25**, check_inventory_slice2 **25**, check_boss_slice3 **33**, check_builderA_slice3 **106**, check_save_slice4 **63**, probe_god / probe_s4_engine / check_engineB_gp6 / check_gfx6_art GRÜN. Der dritte „Flusstest" mit 33 ist `.tmp/check_boss_slice3.mjs` — in Teil B nicht gelistet, in §0.2 namentlich nennen (er führt **kein** Canvas-Order-Rig, die „6 Rigs" aus Teil B bleiben korrekt).

**m10 — P0.a: kein Hindernis gefunden.** Alle Importe sind benannte Importe (`main.js:4`, `smoke:8`, `check_save:38` + ~20 .tmp-Dateien); die APK packt `webDir: "../game"` als Verzeichnis (`mobile/capacitor.config.json`, `build_apk.sh:181`); kein Test zählt Dateien in `game/js/art`; die beiden verzeichnisscannenden Quelltext-Wächter (`smoke:1783-1789` Math.random/Date.now, `smoke:5258-5273` `.start()`/`.stop()`) sind von reinen Datenmodulen erfüllt. **Ergänzen:** „Beweis P0.a: sha256 über `Object.keys(SPRITES).join(',')` und `Object.keys(TILE_ART).join(',')` vor/nach identisch."

**m11 — §4-Golden-Zusage präzisieren.** `sol` hasht rows × `legend.solid` (`smoke:5878-5880`), `geo` hasht Spawns/Portale/torch-findTiles (`:5881-5887`) — beide sehen weder Art noch Over-Zeichen; die Zusage „Over-Span ist rein visuell" stimmt. Aber `geoHash` **ruft** `createTilemap` auf: der Wurf aus B1 macht den Check nicht rot, sondern reißt den Lauf ab.

**m12 — §0.4 Szenenangabe fehlt.** M3/M4 messen ausschließlich GRAVEYARD-Szenen mit `player_down_0` und `skeleton_0` (`shot_gfx6.py:1918-1921`, `:2015`); Teillauf über `sys.argv[1]` (`:117`), Buchführung im `teillauf`-Block von `g6_proof_results.json`. In §0.4 als Aufrufzeile festschreiben.

---

**Bilanz:** 3 Blocker (V4 wirft in der Engine; V4 ist auch über den Over-Layer geometrisch unmöglich; das dL-Band 25..90 zwingt alle sechs Menschen in ein 11-25 L breites Helligkeitsfenster und ist heute von keiner Figur erfüllt), 10 Major (Sperrliste misst am falschen Ort, vier Messziele ohne belastbare Definition, M5-Warnung sachlich falsch, M3/M4-Proof mangels playwright nicht ausführbar, Rot-Zähler-Drift, CH-3-Ziel in CH-1, Stilbibel-Konflikt), 12 Minor — die zwei Sanktionsstellen aus §6 sind für den Zeichensatz nachweislich **vollständig**, alles andere in §6/§4 kippt mit V4 oder braucht eine dritte, dokumentarische Sanktion.


# ===== LINSE 2: ART/DESIGN/MACHBARKEIT =====

Alle Proben liegen in `/home/coder/Grimlight/.tmp/gp7ch_review/` (`dl_band.mjs`, `metriken.mjs`, `feasibility.mjs`, `tuer_geometrie.mjs`, `palette_raum.mjs`, `krapp.mjs`, `alternativ.mjs`, `de_check.mjs`). Port 8123 unberührt, nichts geändert.

# V-SPEC ADVERSARIAL: design/SPEC_GP7CH1.md (Linse ART/DESIGN/MACHBARKEIT)

## BLOCKER

**B1. Das dL-Band aus §3 lässt ein Körper-L-Fenster von 10,7 L übrig und erzwingt eine helle Heldenfigur.**
§3: „dL 25..90 gegen JEDE begehbare Leitkachel (inkl. Weg 91!)". Ich habe alle begehbaren Leitkacheln aus GRAVEYARD/DORF/FLUESTERGRUFT ausgezählt (117 Kacheln, `dl_band.mjs`): L 37,5 (crypt_stairs_down) bis 91,7 (path_v5). Daraus folgt exakt:

| Geltungsbereich | zulässiges Körper-L | Breite |
|---|---|---|
| ALLE Karten | **1,8..12,5** oder **116,8..127,5** | je 10,7 L |
| nur DORF | 1,8..26,3 oder 116,8..141,3 | je 24,5 L |
| nur GY-Gras 46,9 + Weg 91 | 1,0..21,8 oder 116,1..136,9 | je 20,8 L |

Der dunkle Ast ist **palettentechnisch unmöglich**: der dunkelste Ton der Palette ist `k` #14101a mit L 18,3, es gibt **null** Töne unter L 12,5 (`palette_raum.mjs`). Bleibt allein das Fenster **L 116,8..127,5**, in das ALLE SECHS Menschen gleichzeitig müssen. IST: Held 78,8 / Torwächter 92,3 / Hedda 97,8 / Corm 99,3 / Bran 105,0 / Mile 115,4 (`dl_band.mjs`, Mile ist die Einzige, die fast passt).

Konsequenzen, jede für sich ein Widerspruch zu bindendem Text:
- **Held:** +38 L. Seine Masse ist heute `U` #4a3d57 (220 Texel, L 67,9) plus `u` (78 Texel, L 40,2). Ein Mittel von 122 heißt: der Umhang liegt zwischen `X` (L 99,2) und `Z` (L 147,4), also **helles Lavendel**. Das kollidiert mit ART_DIRECTION:22-25 („Boden bleibt sehr dunkel; helle Töne sind Akzente"), :29 („Gesicht im Hutschatten"), CLAUDE.md „entsättigt, dunkel" und mit T8s eigener Begründung („nicht zu viel, sonst schreit" gegen das Skelett bei 193). Zusätzlich: `Z` L 147,4 ist heute der Rim. Bei Körper-L 122 trägt Z keinen Rim mehr, es bräuchte einen NEUEN Violett-Ton über L 147, der im 8er-Budget nicht vorgesehen ist.
- **Hedda:** P0.b friert die G-Rampe auf G_dunkel ~L65 / G L 97,97 / G_hell ~L130 fest. Rampenmittel ~98. Eine G-dominante Hedda kann 116,8 **nie** erreichen. §1 P0.b und §3 widersprechen sich direkt.
- **Corm:** Teil C §2 (bindend über §2) verlangt „Wolle-**dunkel**". Jede dunkle Wollrampe liegt bei L 40..90. Unvereinbar mit dem Band.
- Alle sechs in einem 10,7-L-Fenster heißt: **wertgleicher Cast**. Genau das misst der Squint-Test des Figuren-Bogens (§1 P0.c, 50 % runterskaliert) als Versagen. Instrument und Gate zeigen in entgegengesetzte Richtungen.

*Wurzel des Fehlers:* Die IST-Zahlen aus Teil C T8 sind gegen den **Bodenmittelwert** (60,1) gerechnet, das ZIEL formuliert dieselbe Zahl gegen **jede einzelne Kachel**. Das ist eine andere Metrik, und der Autor hat die Bandbreite nie zurückgerechnet.

*Fix-Formulierung (durchgerechnet, `alternativ.mjs`):*
> §3, dL-Ziel neu: „dL 25..90 gegen die Leitkacheln der BODEN-KLASSE des jeweiligen Wirkorts (NPCs: DORF-Lehm 69..75 und WEG 91; Held zusätzlich GY-Gras 47..63 und GRUFT-Stein 37..60). Der Umriss (k/n) und die Rim-Texel bleiben aus der Körperflächen-Mittelung ausgenommen. Ein Boden, gegen den dL < 25 ausfällt, gilt ERSATZWEISE als bestanden, wenn dE00(Körper, Kachel) >= 25 ist."
> Bänder damit: GY-Gras 88..137 (49 L), DORF-Lehm 100..159 (59 L), WEG 117..181, GRUFT-Stein 85..127 (42 L).

Die dE00-Ersatzklausel ist nicht kosmetisch: Teil A Befund 5.1 stellt selbst fest, dass der Held im Dorf „nur über Farbton" liest. Gemessen (`de_check.mjs`): Held gegen DORF-Lehm dL 6, aber dE00 16; Held gegen GY-Gras dL 29 / dE00 23. Eine reine L-Metrik kann den einzigen Kontrastmechanismus, den die Figur heute hat, nicht sehen.

---

**B2. V4 (Türen als 16x32-Span) ist in der bestehenden Engine nicht baubar, und über KEINER der 7 Türen steht freie Wand.**

Zwei harte Wächter in `game/js/world/tilemap.js` schließen den in §2 beschriebenen Weg aus:
- `:752` wirft, wenn ein Span-Zeichen mit w>1 oder h>1 in den GROUND-rows vorkommt. `map_dorf.js:178-179` hat `'T'`/`'t'` in den Ground-rows.
- `:900` wirft, wenn ein Over-Zeichen auf einen soliden Legendeneintrag zeigt. T/t sind `solid: true` (Häuser sind laut SPEC §6.1 nicht betretbar).

„map_dorf-Legende T/t bekommt span [1,2]" (§2, letzte Zeile) lässt also **jeden Kartenaufbau werfen**, inklusive `geoHash` im §36-Golden. §0.1 erlaubt als einzigen Nicht-Art-Edit die *Legende* T/t; der einzige legale Weg (Ground-Zeichen auf ein anderes solides Zeichen tauschen plus neues Over-Zeichen in die Zeile darüber) ändert die **ROWS**, nicht nur die Legende, und liegt damit außerhalb von §0.1.

Schwerer wiegt die Geometrie. §2 verlangt „Unterkante = heutige Tuerzeile, obere Haelfte in die Wandflaeche". Nachgerechnet für alle 7 Türen (`tuer_geometrie.mjs`, Ankerkonvention aus `map_dorf.js:84-87`):

| Tür | Zeile darüber | Gebäude | obere Türhälfte vom Dachgrid verdeckt |
|---|---|---|---|
| t (21,4) Kapelle | 'C' Wand | 2 Wandzeilen | **256/256 Texel = 100 %** |
| t (12,9) Schmiede | 'W' Wand | 2 Wandzeilen | **256/256 = 100 %** |
| T (25,23) Speicher | 'Z' Wand | 2 Wandzeilen | **256/256 = 100 %** |
| T (30,8) Heddas Kate | '.' **begehbare Traufe** | **1 Wandzeile** | 192/256 = 75 % |
| T (5,9) verlassene Kate | '.' **Traufe** | **1 Wandzeile** | 192/256 = 75 % |
| T (5,18) verlassene Kate | '.' **Traufe** | **1 Wandzeile** | 192/256 = 75 % |
| T (11,22) verlassene Kate | '.' **Traufe** | **1 Wandzeile** | 192/256 = 75 % |

Die vier kleinen Katen bestätigen die Vermutung exakt: Wandblock 3x1, also **eine** 16-px-Wandzeile; darüber liegt die begehbare Traufe, auf der das Strohdach sitzt. Die obere Türhälfte läge im Dach und auf einer Kachel, über die der Spieler laufen kann.

Der Befund für die drei GROSSEN Häuser ist neu und schlimmer als erwartet: sie haben nominell 2 Wandzeilen, aber `dorf_dach_a`/`dorf_dach_b` sind in Span-Zeile 1 mit 882 bzw. 928 von 1024 Texeln deckend und über der Türspalte **zu 100 % opak**. Die obere Wandzeile ist visuell komplett Dach. Es gibt im ganzen Dorf **keine einzige Tür mit freier Wand darüber**. Zusatz: die heutige Türzeile ist bereits zu 25 % (groß) bzw. 38 % (klein) von der Traufe verdeckt, die sichtbare Tür ist also schon jetzt nur ~10-12 px hoch.

Drittens: die Over-Ebene wird in `main.js:2790` NACH der renderables-Schleife gezeichnet, also **über dem Spieler**, und mit `CROWN_PLAYER_ALPHA = 0.55` (`tilemap.js:677`) halbtransparent, sobald der Spieler im Span-Fußabdruck steht. Eine Span-Tür würde vor dem Spieler stehen und beim Herantreten durchsichtig werden.

*Fix-Formulierung:*
> V4 in CH-1 STREICHEN oder auf den einzigen tragfähigen Zuschnitt reduzieren: „Türen bleiben 16x16 in den Ground-rows. Der Maßstabsbruch wird stattdessen im Türgrid gelöst: Sturzbogen und Schwelle so zeichnen, dass die sichtbaren ~11 px als Türöffnung mit angedeutetem Bogen lesen. Ein echter 16x32-Span erfordert (a) eine sanktionierte Öffnung von tilemap.js:752/900, (b) ROWS-Änderungen an 7 Zellen, (c) Neuzeichnung von dorf_dach_a/b/c/d/d_m mit einer freien 16-px-Türnische je Türspalte und (d) eine Regel für die Zeichenreihenfolge Dach gegen Tür. Das ist ein eigener Welt-Pass, kein Nebenauftrag."

Falls V4 bleiben soll: nur die drei GROSSEN Häuser, und dann zwingend mit Punkt (c). Die vier Katen behalten 16x16, sonst steht die Tür im Stroh.

---

**B3. Das 8-Ton-Budget deckt die bindenden Steckbriefe nicht. Fehlbetrag mindestens 4 Töne.**

Angebot (§1 P0.b): G-Rampe 2 neu (G selbst existiert) + Wolle-dunkel 3 + Reserve 2 = **7 benannt von 8**. Nachfrage aus den über §2 bindenden Steckbriefen, gegen die §3-Auflage „jede Materialfläche >= 40 Texel: >= 3 Stufen":

| Figur | Bedarf | Texel heute | neue Töne |
|---|---|---|---|
| Hedda | G-Rampe schließen | G 83 | 2 (gedeckt) |
| Corm | Wolle-dunkel 3 Stufen | Kutte 120 | 3 (gedeckt) |
| **Bran** | „versengtes Leder auf Rost-Basis **+ eigener Stoff**" | Schurz 102 | **3** (nicht gedeckt) |
| **Mile** | „raus aus Leinen-Knochen-Nähe", neuer Kittel | Leinen O/B 50 | **3** (nicht gedeckt) |
| **Held** | Zwischenstufe in der X-nach-Z-Schlucht | Stoff 220+ | **1** (nicht gedeckt) |
| Torwächter | Stahl-Stufe C/i | Haube | 0 (Bestand) |

Summe **12** gegen Budget **8**. Selbst wenn Bran ohne eigenen Stoff auf 4/5/6 fährt (was §2 wörtlich fordert und was B4-Nachbar M9 auslöst) und Mile die 2 Reservetöne bekommt (dann nur 2 Stufen, §3 rot), bleiben 2+3+2+1 = 9 > 8.

Der Helden-Ton ist nicht verhandelbar: gemessen `u`>`U`>`X`>`Z` = 27,6 / 31,3 / **48,2** L, **Schrittverhältnis 1,75** gegen das §3-Ziel <= 1,6 (`dl_band.mjs`). Ohne neuen Ton bleibt nur, `X` oder `Z` im Hex zu verschieben, was das Markenzeichen und die M3/M4-Realmessung anfasst.

*Fix-Formulierung:*
> §1 P0.b: „+**14** Symbol-Töne" statt +8, mit fester Zuteilung: G-Rampe 2, Corm-Wolle 3, Bran-Leder 3, Mile-Kittel 3, Held-Zwischenstufe 1, Reserve 2. §6.1 entsprechend auf 14 Zeichen. Falls 14 politisch nicht geht: Mile bekommt Heddas G-Rampe als **Wertvariante** (dieselben 3 Töne, andere Verteilung), und die Steckbrief-Zeile „Mile raus aus Leinen" wird auf „Mile: Kittel auf die G-Rampe, Tasche als einziger Fremdton" präzisiert. Dann Bedarf 9, Budget 9.

---

**B4. §3 verlangt >= 3 Umrisstöne (Sel-Out), ART_DIRECTION.md:23 verlangt eine geschlossene k-Kontur für alle Figuren, und §6.3 verbietet, das aufzulösen.**

ART_DIRECTION.md:23 wörtlich: „Alle Figuren haben eine geschlossene k-Kontur (klare Silhouette vor dunklem Boden)." Teil C T2 definiert Sel-Out als das Gegenteil: „wird zur Lichtseite hin heller, nimmt innen den dunklen Materialton statt Schwarz und **entfällt dort, wo die Figur ohnehin auf Dunkel steht**". Teil A Befund 5.2 wertet die undichte Kontur von Torwächter (70 %) und Skelett (61 %) ausdrücklich als **Verstoß** gegen ART_DIRECTION:23 und die Hebel-Liste (Teil A, billigster Hebel 5) will sie schließen. §3 verlangt dieselbe Kontur zu öffnen. Das sind zwei bindende Dokumente mit entgegengesetzter Anweisung, und §6 („NICHTS SONST: kein Flusstest, kein Golden, keine weitere Zeile") lässt keine Stelle offen, an der ART_DIRECTION.md nachgezogen wird. Die Spec nennt ART_DIRECTION.md kein einziges Mal.

Dasselbe Paar noch einmal beim Rim: §3 fordert „Rim >= 12 % der Kontur". Bei geschlossener k-Kontur liegt der Rim per Definition **eine Zeile innerhalb** der Kontur (nachgeprüft an `player_side_0:1` `....kZXXXZk.....`, Z sitzt hinter k) und ist damit nach jeder üblichen Konturdefinition 0 %. Held_down kommt heute auf 4,1 %, Held_side auf 0,0 % (`metriken.mjs`).

*Fix-Formulierung:*
> §6 einen Punkt (2b) ergänzen: „design/ART_DIRECTION.md Stilregel 2 wird neu gefasst: ‚Jede Figur hat eine LÜCKENLOSE Silhouettenkante. Der Kantenton ist selektiv: k auf der Schattenseite, der dunkelste Materialton der angrenzenden Fläche auf der Lichtseite, ein Rim-Ton entlang der oberen Lichtkante. Ein Aussetzen der Kante zu transparent ist NICHT erlaubt.' Marker GP7CH."
> §3 präzisieren: „Kontur = Menge der opaken Texel mit mindestens einem transparenten 4er-Nachbarn. Umrisstöne = die auf dieser Menge vorkommenden Töne, gezählt ohne Requisitentöne (Klinge, Speer, Stock). Rim-Anteil zählt Rim-Texel AUF dieser Menge."

Ohne diese Präzisierung ist das Gate bedeutungslos: nach der naiven Lesart „jeder Ton, der den Rand berührt" hat der Held **heute schon 5** Umrisstöne (Y Z k n y) und der Torwächter 4 (S i j k), weil Schwertknauf und Speer am Rand liegen (`metriken.mjs`). Das Ziel wäre am Tag 0 grün, ohne einen Pixel Arbeit.

---

## MAJOR

**M5. Das Symmetrie-Gate <= 65 % ist durch eine 1-px-Verschiebung ohne jede Kunstarbeit erfüllbar.**
Teil C ist nur mit der Grid-Mittelachse (x -> 15-x) reproduzierbar; mit der bbox-Achse ergeben sich völlig andere Werte (`feasibility.mjs`):

| Figur | Teil C | Ton/Grid | Ton/bbox |
|---|---|---|---|
| Held down | 82 | 82,1 | **26,0** |
| Corm | 87 | 86,5 | **47,9** |
| Hedda | 81 | 80,6 | **45,1** |

Die Positivkontrolle aus §3 („Corm-Symmetrie 87 %") pinnt damit implizit die Grid-Achse. Genau die ist gameable: dieselben Grids um 1 px verschoben ergeben Held 82,1 -> **15,8**, Corm 86,5 -> **36,8**, Bran 84,2 -> 25,7, Mile 84,8 -> 24,1. Alle sechs bestehen das Gate sofort, ohne dass sich am Bild etwas ändert.
*Fix:* „Spiegelgleichheit wird um die bbox-Mittelachse der opaken Texel gemessen (nicht um die Grid-Mitte), Requisitentöne eingeschlossen. Positivkontrolle: Corm 47,9 / Bran 84,2 / Held down 26,0." Dann ist das Gate für Corm und Held bereits grün und muss auf Bran/Mile/Torwächter zielen, wo der Defekt real sitzt.

**M6. §3 nennt neun Messgrößen und definiert keine einzige. P0.d „misst automatisch", aber nach welcher Formel steht nirgends.** Belegt: Profilähnlichkeit ist reproduzierbar (meine Formel trifft Teil C exakt: Bran/Corm 90, Bran/Torwächter 90, Held/Bran 89, Hedda/Corm 86, Mile 64-70, `metriken.mjs`), Symmetrie und Umrisstöne sind es nicht (M5, B4). Die Positivkontrolle in §3 nennt nur 2 Ankerwerte für 9 Größen.
*Fix:* §3 um eine Definitionstabelle ergänzen, je Messgröße Formel plus IST-Ankerwert für ALLE sechs Figuren, nicht nur zwei Beispiele.

**M7. Rim-Richtung in CH-1 ist nicht entschieden.** ART_DIRECTION:22 sagt „Licht kommt von oben links". Teil C T6 ZIEL sagt „Seite an die Tint-Richtung gekoppelt (`seite` in `pushTinted`, main.js:2703)". Teil C §5 CH-4 sagt „Rim aus CH-1 an die Tint-Richtung gekoppelt", verlegt die Kopplung also nach CH-4. §3 sagt nur „Ton je Figur definiert". Da §0.1 jeden Code-Edit verbietet, KANN der Rim in CH-1 nur statisch sein.
*Fix:* §3 explizit: „Rim in CH-1 ist STATISCH oben-links (ART_DIRECTION:22). Die Kopplung an `seite` ist deklariert für CH-4 und wird in CH-1 nicht gemessen."

**M8. Die SPERRLISTE widerspricht ihren eigenen Beispielen, und alle fünf NPCs stehen auf derselben Klasse.** §3: „dominante Figur-Rampe != dominante Rampe der **Standkacheln** ihres Wirkorts (Bran!=Holz, Corm!=g/s)". Nachgeprüft (`map_dorf.js:266-270`, Rampen-Dominanz in `metriken.mjs`): Bran steht auf (14,11) = `=` path, dominante Rampe **Erde** 256/256. Hedda (30,10) path, Mile (24,18) path, Torwächter (39,16) `.` dorf_lehm = Erde 256/256. Nur Corm erreicht mit Wanderradius die Kapellenstufe (Stein 174). Wörtlich gelesen verbietet die Sperrliste allen fünf NPCs die **Erdrampe** und erlaubt Bran das Holz. Der eigentliche Befund (Teil C T8 Befund 2: die Figur trägt die Rampe des Gebäudes DAHINTER) steht nicht in der Regel.
*Fix:* „Sperrliste: die dominante Rampe einer Figur darf weder die dominante Rampe ihrer Standkacheln noch die des Bauwerks sein, vor dem sie steht (Bran: Holz q/j/Q/c/J UND Erde; Corm: Stein g/s/S UND Erde; Hedda/Mile/Torwächter: Erde; Torwächter zusätzlich: nicht die Palisaden-Rampe)."

**M9. Bran auf Rost-Basis erzeugt genau die Uniformität, die CH-1 abschaffen soll, und kein Gate fängt das.** Der Torwächter trägt bereits Rost 4/5/6 mit 80 Texeln (`metriken.mjs`). Die beiden liegen heute bei **Profilähnlichkeit 90** (schlechtester Wert des Casts). §3 gatet Profil und dL, aber nirgends „zwei Figuren teilen dieselbe dominante Rampe". Die vorgeschlagene Stahl-Stufe C/i an der Haube reicht nicht: sie betrifft die Haube, nicht die 80 Rumpf-Texel. Zwei rostbraune, gleich breite Männer nebeneinander ist derselbe Fehler wie heute, nur in Braun statt in Kasten.
*Fix:* entweder Bran auf einen eigenen Ledertonsatz (siehe B3) und Rost bleibt exklusiv beim Torwächter, oder §3 ergänzen: „keine zwei Menschen teilen dieselbe dominante Rampe; wo Rampen verwandt sind, muss dE00 der beiden Leittöne >= 15 sein."

**M10. Mile hat kein Ziel.** §2 sagt nur „raus aus Leinen-Knochen-Naehe". Teil C bietet zwei sich ausschließende Optionen („Krapp-Familie **oder** ein Grün"). Krapp = Heddas Leitfarbe (Kollision mit ihrem einzigen Alleinstellungsmerkmal). Grün = die Welt-Grasrampe e/E/a/m/K/A und damit sperrlistig auf dem Friedhof. Die Spec entscheidet nicht, also entscheidet der Bau-Agent im Alleingang.
*Fix:* eine der beiden Optionen in §2 festschreiben, samt Ton-Zuteilung aus B3.

**M11. P0.b setzt die dE00-Untergrenze nur gegen 21 Töne. Die Kollision, die Mile lösen soll, kann dadurch wieder entstehen.** §1 P0.b fordert dE00 >= 10 nur zu u/U/X/Z und den Gebäude-Leitrampen. Nicht gefordert: Abstand zur Knochenrampe O/B/b/N (genau Miles Problem), zum Ghul-Fleisch d/H/3, zur Blutrampe r/R, zu `G` selbst und **zwischen den 8 neuen Tönen untereinander**.
*Fix:* „dE00 >= 10 zu ALLEN 64 Bestandstönen und >= 8 zwischen je zwei neuen Tönen derselben Rampe, >= 12 zwischen Tönen verschiedener neuer Rampen."

**M12. Die G-Rampe mit „Schatten kühler" hat nur einen 5-%-Korridor, und der Blocker ist der Heldenumhang.** Nachgerechnet (`krapp.mjs`): G #8f4c5d hat Lab-Hue 5,2 Grad, u/U/X/Z liegen bei 308-310 Grad. Im Suchraum L601 60..70 mit C*ab 10..30,5 und Hue-Shift 20..70 Grad kühler gibt es 1706 Kandidaten, davon erfüllen **81 (4,7 %)** die dE00->=10-Auflage. Von den 1625 Durchfallern scheitern **1545 an `U`**. Die besten Überlebenden liegen bei dE00 10,4 bis 11,9 zu U, also 0,4 bis 1,9 über der Schranke. Bei dE00 ~11 ist eine 6x skalierte Heddaschatten-Fläche vom Heldenumhang-Mittelton visuell kaum zu trennen, was V6 („Held-Silhouette bleibt das einzige Violett") direkt untergräbt.
*Fix:* entweder dE00-Schranke zu u/U/X/Z auf >= 15 anheben (dann muss der Hue-Shift der G-Rampe WÄRMER laufen, nicht kühler), oder P0.b umformulieren: „G-Rampe: Schatten dreht Richtung **Braunrot** (Hue 15..30 Grad), Licht Richtung Rosa-entsättigt. Die Regel ‚Schatten kühler' gilt für alle neuen Rampen AUSSER G, weil der kühle Sektor dem Helden gehört (deklariert)."

**M13. Die Auflage „kein L-Konflikt mit dem M1-Boden-Band" ist eine Kategorieverwechslung und würde die eigenen Zielwerte verbieten.** Das M1-DORF-Band ist **56..69** (`design/SLICE6_PHASE0.md:106`, `map_dorf.js:18`) und ist ein 8-Phasen-**Median des gerenderten Bildes**, keine Palettengröße; in `.tmp/shot_gfx6.py:133-137` existiert für DORF gar kein M1-Eintrag. Wörtlich auf Palettentöne angewandt verbietet die Auflage genau L 56..69, also **G_dunkel ~L65** aus derselben Zeile und die Mittelstufe von Corms Wolle.
*Fix:* streichen und ersetzen durch: „Die neuen Töne dürfen den DORF-M1-Median (56..69), die E1-Highlight-Schwelle (>= 0,64 % Anteil L>96) und den L<16-Deckel (<= 2,0 %) nicht kippen; Nachweis durch Realmessung nach dem Umbau, nicht durch eine Palettenregel."

**M14. §0.4 friert M3 „ausgebrannt == 0" ein, während §3 eine Aufhellung um ~43 L erzwingt.** `shot_gfx6.py:1948` zählt Sprite-Pixel über `M3_AUSBRENNEN_L`; das Gate ist `aus == 0` (`:2232`). M3 misst `player_down_0` unter dem Fackelkegel, und die Tint-Fassade legt bis zu WARM_ALPHA 0,36 Orange darüber (Teil C §5 CH-4). Ein Held, dessen Körpermittel von 78,8 auf 122 steigt, bringt seine Spitzlichter in Clipping-Nähe. §0.4 sagt „Schwellen FEST", was bedeutet: der Bau kann M3 rot machen und hat keinen Ausweg.
*Fix:* §0.4 ergänzen: „Reihenfolge zwingend: dL-Zielwert je Figur festlegen, DANN M3-Realmessung, DANN Art. Fällt `ausgebrannt` > 0 aus, ist das dL-Ziel des Helden die nachgebende Größe, nicht die M3-Schwelle."

**M15. Es gibt kein VORHER-Einfrieren des Figuren-Bogens, und das Archiv liegt in einem als wegwerfbar deklarierten Ordner.** §1 P0.c baut das Werkzeug und schreibt nach `.tmp/screenshots/`. §4 verlangt „Figuren-Bogen VORHER/NACHHER archiviert", bindet den VORHER-Lauf aber an keinen Zeitpunkt und an keinen Commit. §5 verlangt „Vergleich VORHER/NACHHER-Bogen" als Jury-Instrument. CLAUDE.md:„Alles in `.tmp/` ist wegwerfbar." Ergebnis: Phase 1 kann starten, ohne dass je ein Referenzbild existiert, und selbst ein erzeugtes kann zwischen Phase 0 und Jury verschwinden.
*Fix:* §1 P0.c einen expliziten Schritt P0.e voranstellen: „P0.e REFERENZ-BOGEN (eigener Commit, VOR Phase 1): figuren_bogen gegen die HEUTIGEN Grids laufen lassen, Ausgabe nach `design/referenz/figuren_bogen_VORHER_<hash>.png` (versioniert, nicht `.tmp/`). Phase 1 darf nicht beginnen, bevor diese Datei im Repo liegt. Der NACHHER-Bogen muss mit identischer Anordnung, Skala und Bodenwahl erzeugt werden."

**M16. Der Figuren-Bogen ist als Instrument unterspezifiziert.** §1 P0.c nennt „3 Boeden (GRAVEYARD-Gras, DORF-Lehm, DORF-Weg)", aber Gras hat 47 Varianten mit L 47,0 bis 63,0, Lehm 9 mit 72,2 bis 75,2, Weg 6 mit 90,9 bis 91,7 (`dl_band.mjs`). Ohne feste Kachel-Keys ist der Bogen nicht reproduzierbar und VORHER/NACHHER nicht vergleichbar. Es fehlen außerdem: Frame-Reihenfolge, Figuren-Reihenfolge, Dateinamen-Schema, Beschriftung, und die Zusage, dass der Squint-Pfad (50 % runter und zurück) mit Nearest-Neighbour arbeitet.
*Fix:* Kachel-Keys festnageln (Vorschlag: `grass_g5_00` L 49,9 / `dorf_lehm_00` L 72,8 / `path` L 90,9), Reihenfolge = Held down/up/side, dann Bran/Hedda/Corm/Mile/Torwächter je 0/1/talk, Dateiname `figuren_bogen_<vorher|nachher>_<boden>_<1x|6x|squint>.png`.

**M17. Der Held hat auf dem Dorfweg heute dL -12, also denselben Defekt, den §8 als „Grufthund-dL-Skandal" auf CH-2 vertagt.** Gemessen (`de_check.mjs`): Held gegen `path` dL **-12** / dE00 21. Teil C T8 nennt für den Grufthund „-10,3 auf dem Weg" und nennt das den schlechtesten Lesbarkeitsfall des Spiels. Der Held ist schlechter, steht auf derselben Kachel und ist die Figur, die Michael beim Gerätetest die ganze Zeit ansieht. §8 deklariert nur den Hund. Auch Bran ist auf dem Weg bei dE00 8, dem niedrigsten Farbabstand des Casts, und er STEHT dort (Anker 14,11 = path).
*Fix:* §8 korrigieren („der Held teilt den Befund und wird in CH-1 mitbehandelt") und in §3 die Weg-Kachel als benannte Pflichtprüfung je NPC führen, mit den Standkacheln aus `map_dorf.js:266-270` als Beleg.

**M18. „MASSE UNVERAENDERT 16x24" ist durch keinen Wächter gedeckt, und §6.3 verbietet, einen nachzuziehen.** `check_gfx6_art.mjs` prüft für SPRITES nur gleiche Zeilenbreiten und Palettenzugehörigkeit (`checkGrid`), Maße nur für `ghoul_*` (16x20). `smoke_test.mjs:472/566/577` sind reine Existenzprüfungen. Bei 32 handgepflegten Grids fällt ein 16x23-Grid erst als M5-Zufallsbefund oder gar nicht auf. Nebenbefund: Teil A Risiko 4 („kein Wohlgeformtheits-Gate auf Charakter-Grids") ist zu scharf formuliert, die Zeilenbreiten-Prüfung existiert in check_gfx6_art bereits; was fehlt, ist die Maßprüfung.
*Fix:* §6 einen Punkt (2c) ergänzen: „check_gfx6_art.mjs, additive Zeile: alle Keys `/^(player|npc)_/` sind 16 breit und 24 hoch. Marker GP7CH. Reine Ergänzung, kein Bestands-Gate wird verändert."

**M19. `.tmp/check_gfx4_art.mjs:16-19` erzwingt ebenfalls alnum 61 / sym 3 und ist in der Spec weder grün- noch totgelistet.** Teil A Risiko 2 nennt beide Wächter ausdrücklich; §6.1 sanktioniert nur `check_gfx6_art.mjs:74-79`, §6.3 sagt „NICHTS SONST", §0.2 listet check_gfx4_art nicht auf und die Tot-Liste nennt nur check_gp6_art_self und check_world_slice1. Ich habe den Wächter laufen lassen: er ist **bereits heute rot** (`Neuton '=' = #56757a, erwartet #3f7a70` plus dutzende Maß-Fehler aus GP5/GP6), also faktisch abgelöst.
*Fix:* §0.2 ergänzen: „deklariert-tot zusätzlich: `.tmp/check_gfx4_art.mjs` (seit GP6 rot, Beleg: '='-Ton und XL-Kronenmaße). Keine Aktion."

---

## MINOR

**m20.** §1 P0.b sagt „+8 Symbol-Toene", zählt aber nur 7 auf (2 + 3 + 2). Der achte ist unzugeteilt.

**m21.** Held-Körper-L ist in drei bindenden Quellen verschieden: Teil A §5 „75,8", Teil C T8 „80,4", meine Messung über alle drei Ansichten 78,8 (down allein 79,4). §3 verlangt, dass P0.d „die IST-Werte aus Teil A/C reproduziert". Bei drei Werten geht das nicht. Ursache ist vermutlich die Frage, ob `u`/`n` als Umriss zählen und ob über 1 oder 3 Grids gemittelt wird. Definition nachtragen.

**m22.** §6.2 gibt eine Prüfauflage („Gegen-Gate ‚alle Klassen belegt' darf NICHT erweitert werden müssen, prüfen, sonst melden"). **Ergebnis: grün.** Beide Stellen (`smoke_test.mjs:1774-1777`, `check_gfx6_art.mjs:160-165`) prüfen nur, dass die fünf bekannten Klassen belegt SIND, nicht dass die Klassenmenge genau diese fünf ist. Eine 16x32-Musterzeile fügt eine Klasse hinzu, ohne eine zu leeren. Nur der Label-Text „{16×16, 32×32, 48×32, 64×48, 64×32}" wird stehengelassen falsch und sollte mitgezogen werden.

**m23.** T1 „paarweise <= 70" ist im 16x24-Rahmen **erreichbar** (positiver Befund, `feasibility.mjs`: aus 347.118 plausiblen Menschenprofilen liefert die Suche eine 6er-Familie mit paarweise <= 70). Preis: die Texelsummen der Familie spreizen von 151 bis 242, also Faktor 1,6 in der Masse. Heute liegt der Cast bei 176 bis 271, nutzt die Spreizung aber nicht (10 von 15 Paaren zwischen 78 und 90, nur Mile mit 64-70 unter der Schranke). Der Weg ist offen, aber jede Figur muss substanziell an Masse gewinnen oder verlieren, und das kollidiert mit dem M5-Schattengate (`smoke_test.mjs:3338-3341`, AABB fest 12x14) sowie mit §0.3.

**m24.** §2 fordert Talk-Frames mit „>= 6 % Texel-Diff MIT Silhouettenaenderung". IST gemessen: alle fünf bei **1,0 % Texel-Diff und 0,0 % Silhouetten-Diff** (`metriken.mjs`, Teil C nennt „4 Texel = 1,5 bis 2,3 %", meine Zahl bezieht sich auf 384 Rahmentexel). Der Sprung ist Faktor 6, in einem Pass, der laut §8 „Talk-/Idle-FRAMEZAHLEN bleiben (2+1)" keine neuen Zustände bekommt. Machbar, aber es bedeutet 5 vollständig neu gezeichnete Talk-Grids, die in der Umfangsangabe („~21 Grids", V5) mitzählen müssen.

**m25.** ART_DIRECTION Stilregel 4 („Fackel-Orange/Gelb sind die einzigen warmen Lichtquellen, der Rest der Welt ist kalt-grün/grau/blau") ist heute schon nur noch halb wahr: 35 von 64 Tönen sind warm (R > B+8, `palette_raum.mjs`). Der Deckel C*ab < 30,5 aus P0.b ist ein **Buntheits**-Deckel und begrenzt Wärme nicht (`c` #805f3a und `G` #8f4c5d liegen bei 27,7 und 30,3 und sind beide warm). Für neue „Leinen-warm"-Töne reicht er also nicht als Schutz. Der Regelverstoß ist bereits Bestand und die Regel gehört ohnehin umgeschrieben (siehe B4-Fix, gleicher Commit): „Warm ist erlaubt als MATERIAL (Holz, Leder, Lehm, Stoff), verboten als LICHT: leuchtende Warmtöne (o/y/1) bleiben Feuer, Gold und Klingenreflex vorbehalten."

**m26.** Stilregel 10 („Neue Farben nur als komplette Rampe") wird von den 2 Reservetönen aus P0.b direkt verletzt. Entweder als Ausnahme deklarieren oder die Reserve zu einer 3er-Rampe machen (was das Budget weiter belastet, siehe B3).

---

## BILANZ

Vier Blocker, davon zwei rechnerisch zwingend (dL-Band lässt 10,7 L Fenster und erzwingt einen hellen Helden; über keiner der 7 Türen steht freie Wand, und die Span-Mechanik wirft in tilemap.js:752/900), einer arithmetisch (8 Töne gegen 12 Bedarf) und einer dokumentarisch (Sel-Out gegen die geschlossene k-Kontur, ohne Sanktionsschlitz); dazu 15 Major, von denen M5 das Symmetrie-Gate durch eine 1-px-Verschiebung entwertet und M6 neun Messgrößen ohne Definition lässt. Die Spec ist in Aufbau, Testbindung und Sanktionsdisziplin sauber, aber ihre Messziele sind an der Bestandskunst nie zurückgerechnet worden.
