# design/referenz/gp7ch2 — REFERENZ-BOEGEN GP7-CH-2 (P0.d, VORHER eingefroren)

**HEAD-Commit: `9bc205e`** ("GP7-CH-2 Spec Rev 2: alle 10 Blocker + 25 Major +
25 Minor beider Linsen eingearbeitet ...", 2026-09-11 12:43 +0000).
**Erzeugt am: 2026-09-12.** Arbeitsbaum beim Lauf: nur `tools/figuren_bogen.mjs`
(Rev 3) geaendert und `tools/horden_bogen.mjs` neu — an `game/js/art/*` nichts.

## Zweck — warum diese Kopie existiert

Beide Werkzeuge rendern **immer den aktuellen Kunst-Stand**. `--modus`/`--etikett`
ist nur das Dateinamens-Etikett und sagt nichts darueber, welche Pixel gerendert
werden. Sobald Phase 1 (§3 der Spec) die Gegner-Grids neu zeichnet, liefert ein
Aufruf mit `--etikett vorher` bereits die NEUE Kunst. **Dieser Ordner ist damit
der einzige Beleg des VORHER-Standes** — es gibt keinen zweiten Weg, ihn
zurueckzuholen, ausser ueber den Commit-Stand der Art-Dateien.

Der Ordner ist **nicht wegwerfbar**: `.tmp/` ist laut CLAUDE.md disposable,
dieser Ordner ist es ausdruecklich nicht (Spec `design/SPEC_GP7CH2.md` §2 P0.d:
"REFERENZ: Figuren-Bogen (Gegner) + Horden-Bogen VORHER nach design/referenz/
versioniert — **Phase 1 startet nicht ohne**", und E-C6 "Referenz-Boegen nach
design/referenz/gp7ch2/ (CH-1-Dateien bleiben)").

Der Nachher-Vergleich laeuft spaeter ueber denselben Aufruf mit dem Etikett
`nachher` in ein Schwesterverzeichnis; die Anordnung ist eingefroren, damit sich
Vorher und Nachher Zelle fuer Zelle und Texel fuer Texel uebereinanderlegen
lassen.

## Was drin liegt (94 Dateien)

| Gruppe | Anzahl | Muster |
|---|---|---|
| Menschen-Bogen (Figuren) | 12 PNG | `figuren_bogen_vorher_<gras\|lehm\|weg\|gruft>_<1x\|6x\|squint>.png` |
| Gegner-Bogen (Figuren) | 12 PNG | `figuren_bogen_vorher_gegner_<gras\|lehm\|weg\|gruft>_<1x\|6x\|squint>.png` |
| Figuren-Legende | 1 TXT | `figuren_bogen_vorher_legende.txt` |
| Horden-Tafeln | 24 PNG | `horden_bogen_vorher_<A_feld\|B_knaeuel\|C_leiter\|D_schlachtfeld>_<gruft\|gras>_<1x\|6x\|squint>.png` |
| Horden-Messung + Legende | 1 JSON + 1 TXT | `horden_bogen_vorher_messung.json`, `horden_bogen_vorher_legende.txt` |
| Blindtest-Kacheln | 40 PNG | `horden_blind_vorher_<gruft\|gras>_<farbe\|grau>_<1x\|6x>_<01..05>.png` |
| Blindtest-Aufloesung | 1 TXT | `horden_blind_vorher_aufloesung.txt` |
| Zusammengefuehrte Vorher-Messung | 1 JSON | `vorher_messung.json` |
| Diese Datei | 1 MD | `README.md` |

**KEINE Schalter-Varianten in der Referenz.** `tools/horden_bogen.mjs` kann
`--rim`, `--flash` und `--grau` (Dateien mit `_rim`/`_flash`/`_grau` im Namen);
die liegen hier **absichtlich nicht**. Planer-Entscheid: die Gates werden immer
am **schalterlosen** Lauf gemessen, die Schalter sind Vorschau/Sondierung. Wer
sie sehen will, erzeugt sie sich in ein `.tmp/`-Verzeichnis.

## ⚠ Die Blindtest-Aufloesung darf der Juror NICHT lesen

`horden_blind_vorher_aufloesung.txt` enthaelt die Zuordnung der 5 Blind-Kacheln
je Boden zu Gegnersorte und Grid. Sie ist **ausschliesslich fuer die Auswertung**
gedacht. Wer den Blindtest abnimmt (Spec E-B10: "Juror (nicht Zeichner) bekommt
die Squint-Kacheln ohne Legende in Zufallsreihenfolge, Treffer nur bei Farbe UND
Graustufe; Ziel 1x >=4/5, 6x 5/5"), bekommt nur die 40 PNG — nie diese Datei,
und auch nicht `horden_bogen_vorher_legende.txt` oder die JSONs, die dieselbe
Information fuehren. Wird sie vorher gelesen, ist der Test verbrannt und muss
mit einem neuen Seed wiederholt werden.

## Eingefrorene Anordnung Horden-Bogen (Spec E-C6, woertlich aus der Legende)

- **Seed**: `12345` (ein Strom fuer die Aufstellung; der Flash-Schalter zieht aus
  einem eigenen Strom mit demselben Seed, damit er die Aufstellung nicht
  verschiebt).
- **Roster**: 12 `skeleton` / 8 `ghoul` / 5 `hound` / 4 `rust` / 1 `warden`
  = 30 Figuren, Frame 0 je Figur, Typ-Reihenfolge wie im Roster. Kein Fussvolk
  (Spec E-C1). Jede Aenderung an Roster, Typ-Reihenfolge oder Anzahl verschiebt
  ALLE Positionen — deshalb hat das keinen Schalter.
- **Streuung**: `x = 20 + rnd()*(320-60)`, `y = 24 + rnd()*(180-60)`,
  `flip = rnd() < 0.5`, je Figur 3 Zieher.
- **Kachelformel**: Kachelsatz Gruft = `stone_floor` + `_v1`/`_v2`/`_v3` +
  `_cracked`, Auswahl **`(tx*7 + ty*11) % n`**. Gras = `grass_g5_00` (n=1).
- **Leinwandmasse**: Tafel A und D **320x180** (Spielaufloesung), Tafel B
  **120x90**, Tafel C **192x48**. 6x = Nearest Neighbour x6; squint = 1x per NN
  50 % runter (Quelltexel 2x/2y), dann zurueck und x6 — deckungsgleich mit 6x.
- **Y-Sort** nach `y + aabb.h`; Schattenprofile wie im Prototyp.
- **Boeden**: `gruft` L(Rec601) 50,38 (CATACOMBS / FLUESTERGRUFT / BOSS_KAMMER),
  `gras` L(Rec601) 49,89 (GRAVEYARD).
- **Tafeln**: A_feld = 30 Gegner gestreut (die Spielsituation) · B_knaeuel = 20
  Gegner in 4 Reihen mit 9 px X-Abstand (der Haertefall) · C_leiter = 5
  Gegner-Spalten in Roster-Reihenfolge + Held als Massstab, fussbuendig ·
  D_schlachtfeld = 30 Decals + 10 lebende Gegner.
- **Decal-Deklaration**: es gibt heute kein einziges `*_decal`-Grid; Tafel D
  zeichnet ersatzweise die `*_die`-Grids als Platzhalter. Die Bodenbedeckung ist
  damit eine OBERGRENZE. Im Nachher-Lauf faellt die Warden-Leiche weg (Spec
  Sec.8) — aus 30 Platzhaltern werden 29 Decals.

## Raster Figuren-Bogen (aus der Figuren-Legende)

- Zelle **32x48 px** (2x3 Kacheln), Markenband 8 px unter jeder Zeile, Figur
  horizontal zentriert, gemeinsame Fusskante auf Zellunterkante minus 8 px.
- Menschen-Bogen **544x224 px** bei 1x (3264x1344 bei 6x/squint): Zeile H Held
  17 Zellen, S Schwerthieb 3, N NPCs 15, K Kontext (Gegner) 5.
- Gegner-Bogen **288x280 px** bei 1x (1728x1680 bei 6x/squint): Zeile A Skelett
  3, B Ghul 3, C Grufthund 6, D Rostpanzer + Schild 6, W Grabwaechter 9
  = **27 Gegner-Grids**.
- Vier Boeden: `gras` grass_g5_00 (L 49,9), `lehm` dorf_lehm_00 (72,8), `weg`
  path (90,9), `gruft` stone_floor (52,5).

## Reproduktion

```
node tools/figuren_bogen.mjs --modus vorher --out design/referenz/gp7ch2
node tools/horden_bogen.mjs --etikett vorher --out design/referenz/gp7ch2 --squintblind
```

(`--out` ist relativ zur REPO-Wurzel, nicht zum cwd.) Danach wurde
`vorher_messung.json` zusammengefuehrt (siehe unten). Erfolgs-Strings im Log:
`FIGUREN-BOGEN FERTIG` bzw. `HORDEN-BOGEN FERTIG`; Fehler melden sich mit
`FEHLER:` am Zeilenanfang — Exit-Codes sind nicht die Quelle der Wahrheit.

**Determinismus nachgewiesen** (P0.d, 2026-09-12): beide Aufrufe ein zweites Mal
nach `.tmp/gp7ch2_p0d/lauf2/`; `diff -r` ohne Ausgabe, alle 92 erzeugten Dateien
byte-gleich — auch die beiden Legenden-TXT (sie fuehren keine Pfade im Inhalt).
Zusaetzlich sind die 24 Horden-Tafeln, die 40 Blind-Kacheln, `horden_bogen_
vorher_messung.json` und `horden_bogen_vorher_legende.txt` **byte-gleich mit dem
P0.c-Kanonlauf** `.tmp/gp7ch2_p0c/bogen/`, und die 25 Figuren-Dateien byte-gleich
mit dem P0.c-Nachbeweis `.tmp/gp7ch2_p0c/nachbeweis/`.

## `vorher_messung.json` — die Zahlen an einem Ort

Zusammengefuehrt (Inhalte **unveraendert** uebernommen, keine Zahl umgerechnet)
aus dem Horden-Mess-JSON dieses Laufs und den sechs Vorher-JSONs aus P0.a
(`.tmp/gp7ch_p0/`). Struktur:

```
{ "head": "9bc205e",
  "quellen": { "<pfad>": "<sha256>", ... },
  "horden_bogen":   <horden_bogen_vorher_messung.json>,
  "gegner_messung": <gegner_messung_vorher.json>,
  "e1fenster":      <gegner_e1fenster_vorher.json>,
  "leitplanken":    <gegner_leitplanken_vorher.json>,
  "kontrolle":      <gegner_kontrolle_vorher.json>,
  "ziele":          <gegner_ziele_vorher.json>,
  "material_ist":   <gegner_material_IST.json> }
```

Die Quell-sha256 (Stand 2026-09-12):

| Quelle | sha256 |
|---|---|
| `design/referenz/gp7ch2/horden_bogen_vorher_messung.json` | `968c6462f2f3885db7924af9783b73d4a8341541e4f275a5753ba30ff8ae8a8c` |
| `.tmp/gp7ch_p0/gegner_messung_vorher.json` | `ed6f47cdb930467b7bcd7edd4baf3b094d52221f933bbc4a09c2a569ea9b037a` |
| `.tmp/gp7ch_p0/gegner_e1fenster_vorher.json` | `636d3a9bdf2b48a5e0ca74d60214f0127ed120f2737b79766a8c8f4e7b4ccdda` |
| `.tmp/gp7ch_p0/gegner_leitplanken_vorher.json` | `e5a970f9b8c550ba549ecebaf87ffdbb573f6217b54dceb512c9c44a213abe0b` |
| `.tmp/gp7ch_p0/gegner_kontrolle_vorher.json` | `a91ea7ed88a9252000016512deff19eb9499d9b4209e2a10f8b1da4c6fec4c87` |
| `.tmp/gp7ch_p0/gegner_ziele_vorher.json` | `b0928d9f13ea898e8b6a08fa5e06bb276c6c55a5c10949433c1f1f59e867a1dd` |
| `.tmp/gp7ch_p0/gegner_material_IST.json` | `8cc5818e4f55ac74af6dabfafb966f15b8f00f2204ee25b62c6b4586b8dd83d0` |

Der Eintrag `design/referenz/gp7ch2/horden_bogen_vorher_messung.json` ist die
Datei in diesem Ordner; die sechs `.tmp/gp7ch_p0/`-Eintraege stammen aus P0.a und
liegen in einem disposablen Verzeichnis — genau deshalb sind sie hier hinein
kopiert und mit Hash festgenagelt.

## PROVENIENZ — die Kunst-Quellen, aus denen beide Boegen gerendert wurden

| Datei | sha256 |
|---|---|
| `game/js/art/sprites_figuren.js` | `729e68853ac20be85c0dd81ebb071203f7675f159b918e21246ebb16dce11438` |
| `game/js/art/sprites_tiles.js` | `46c26c767476999deca74ff88c026e8a007fbe7a4057fda62f8488bdecfcca09` |
| `game/js/art/sprites.js` | `41d6b7a90c9bdd057e10c4924a460ef8fdd5a665a8b36237642928d4fe81284d` |
| `game/js/art/palette.js` | `f89ff2e3967c91f785ad8ec468d43be4cbba3b7dc7b91362b37acc438375e46e` |

Diese vier Hashes stehen identisch im Abschnitt PROVENIENZ beider Legenden und
entsprechen dem Commit-Stand von `9bc205e` (an `game/js/art/*` war beim Lauf
nichts uncommitted).

## Inhaltsverzeichnis mit sha256 (93 Dateien)

`README.md` selbst kann seinen eigenen Hash naturgemaess nicht fuehren und fehlt
darum in der Tabelle (gleiche Konvention wie in `design/referenz/README.md`).

| Datei | Mass | Bytes | sha256 |
|---|---|---|---|
| `figuren_bogen_vorher_gegner_gras_1x.png` | 288x280 | 5904 | `210eb41c0cc7351ed7bbd33ead58ac355a4f935e8ca13bafe9b9a5c6895b7056` |
| `figuren_bogen_vorher_gegner_gras_6x.png` | 1728x1680 | 50168 | `2166f55c1a6a0a50fa8c0f6c6c38df88d0e6e76cee7c6b45dd1ca259b33f663d` |
| `figuren_bogen_vorher_gegner_gras_squint.png` | 1728x1680 | 41909 | `758642e21430a106461ac592512698e4f8cc604b701d1b7b2135457b0c233112` |
| `figuren_bogen_vorher_gegner_gruft_1x.png` | 288x280 | 6168 | `3728b5ef2fdeb81e632483606230757bfda1c90bc93c12e71477e5e7bf948c6b` |
| `figuren_bogen_vorher_gegner_gruft_6x.png` | 1728x1680 | 57165 | `eecf0ccab30aa637996dce687277f663f829b3e0b6ea809ecda4b5d56aea8a82` |
| `figuren_bogen_vorher_gegner_gruft_squint.png` | 1728x1680 | 50892 | `004cbc23e013516ef0c4dd6cd17ac75309e862250b3818dd070661ff429b3822` |
| `figuren_bogen_vorher_gegner_lehm_1x.png` | 288x280 | 6136 | `e922f2cd69fa11e63c239d753d21200fafb9c48aa7d2da72d1a08df15cdd1f1d` |
| `figuren_bogen_vorher_gegner_lehm_6x.png` | 1728x1680 | 57087 | `f201d46589d1e4c0275f505c3e42d7cf0c20a81a482bd97e6c7bb73dc998864c` |
| `figuren_bogen_vorher_gegner_lehm_squint.png` | 1728x1680 | 48756 | `af0b75cf0634e9139668b46edbe1ff4f0c38f4bbfe79c060cd7206de34d4af2c` |
| `figuren_bogen_vorher_gegner_weg_1x.png` | 288x280 | 5765 | `5b2b71e087745bb2fc0d605a13dd15f4fd38cdb126b62c88adb27c57aba6215b` |
| `figuren_bogen_vorher_gegner_weg_6x.png` | 1728x1680 | 45073 | `4adce58022bfdc1904c793c6eee72609ecf905a5ce1579ffb36f7bd323ef55dc` |
| `figuren_bogen_vorher_gegner_weg_squint.png` | 1728x1680 | 42890 | `2921863608a410f81953118c0eaa04cba841951fd1270335107bb1e7d3cd4d49` |
| `figuren_bogen_vorher_gras_1x.png` | 544x224 | 8119 | `a269cd9c7fa3c3bbed42ab5388219f6fc9d96cc8d259e124fcf3a0886cb9b217` |
| `figuren_bogen_vorher_gras_6x.png` | 3264x1344 | 74851 | `ee6bfc8b5e9330af7bd8f7ff1ed70ce2f2c355ebe5c5f81676524f5388aab227` |
| `figuren_bogen_vorher_gras_squint.png` | 3264x1344 | 63862 | `a0e520f2d6413a33e68a68b45f3becaaa341f11cf3a507f34ab02266873bf284` |
| `figuren_bogen_vorher_gruft_1x.png` | 544x224 | 8927 | `e14d8b71ca7ca1f2f8c19f4e7277ffe8568bd20130ba051c90f22ea3ca48bb88` |
| `figuren_bogen_vorher_gruft_6x.png` | 3264x1344 | 84923 | `978fec8b73fd93dfafde67d5411c81d32b7caea7e2a251529dd055c60b6d7528` |
| `figuren_bogen_vorher_gruft_squint.png` | 3264x1344 | 77183 | `600c9573f2ff18326cac90ef6901646305da4713ab604995b05da3a6711526b6` |
| `figuren_bogen_vorher_legende.txt` | — | 10688 | `7fe7773178538eed9199b1ce123807eca050a4f405e5b30de6e9c21ec38aaaf7` |
| `figuren_bogen_vorher_lehm_1x.png` | 544x224 | 8634 | `6e0a4b491156623b37387b30aaee1ae722b90fb2343ed60079e8fff698a2621f` |
| `figuren_bogen_vorher_lehm_6x.png` | 3264x1344 | 84938 | `3fad3714e6a0ad98f0f9cfb5a521c4fa4d845af9cbdea91ad77cdaa8df385deb` |
| `figuren_bogen_vorher_lehm_squint.png` | 3264x1344 | 73087 | `dfee5fba1e952debdd9157114a70142ac274be07c2b4692d523473b8599cb2a7` |
| `figuren_bogen_vorher_weg_1x.png` | 544x224 | 7937 | `4595ae22449f7718bc8e56f2f08c278150706793af7af29a966ffaa7c19bc2bc` |
| `figuren_bogen_vorher_weg_6x.png` | 3264x1344 | 67517 | `9febc0508f23572387989e6eaf51a78ada760061d2c87a1716b4e5041c3949c5` |
| `figuren_bogen_vorher_weg_squint.png` | 3264x1344 | 65430 | `0b6ec13ed8367005fa36c25924c1b72854211f1ca64025606ba2baa5e77849f8` |
| `horden_blind_vorher_aufloesung.txt` | — | 879 | `dca0e8b9a6ded05c9cd5819909f0369b052f2c14f74bdeacdf3f1eb32a2a5082` |
| `horden_blind_vorher_gras_farbe_1x_01.png` | 32x48 | 266 | `172f3a967533b1d8a5c7297086167e10d6a3812761075afee0171adebba189b0` |
| `horden_blind_vorher_gras_farbe_1x_02.png` | 32x48 | 259 | `14ef00f747f74fbdc18d49dddb03ec30567e9efd696afafb543b0c1a789810da` |
| `horden_blind_vorher_gras_farbe_1x_03.png` | 32x48 | 272 | `59353082367e0b0d953e9c4fbec83fca6e5c833e13619bc76a6683b88d17f716` |
| `horden_blind_vorher_gras_farbe_1x_04.png` | 32x48 | 297 | `b47156b94be26b83c7a2005a3d22d83e51605f50eb2e8f827a61e0b49e764f37` |
| `horden_blind_vorher_gras_farbe_1x_05.png` | 32x48 | 447 | `b2fb43ae7f10150fa77fe482a0db92d068b43b9986b80c6564c3419a7efb6121` |
| `horden_blind_vorher_gras_farbe_6x_01.png` | 192x288 | 1169 | `ac7c68c85c72ae635867572caaeb291fa4da6f408ca56eec5931ac3510941408` |
| `horden_blind_vorher_gras_farbe_6x_02.png` | 192x288 | 1138 | `24d3ffc73b685c7ed574e7665b39e955c96da82b878f4f3bab99de774539741c` |
| `horden_blind_vorher_gras_farbe_6x_03.png` | 192x288 | 1219 | `dc17c7a663ab581e18a716ae1ed3c50c7c772c947009b63e26c6c6e8641101b5` |
| `horden_blind_vorher_gras_farbe_6x_04.png` | 192x288 | 1231 | `1057ade994d8270e666d37886fee4dc7ab91ce3ce1f3c21cf1095cfbb7e6cf7d` |
| `horden_blind_vorher_gras_farbe_6x_05.png` | 192x288 | 1456 | `0a34154f62b81505a8b274b7bb3f2e1c82a1300a2f5493974b2af08ae4b5a96f` |
| `horden_blind_vorher_gras_grau_1x_01.png` | 32x48 | 254 | `762b274fce13677837113bff7cbfe7452026eb6748afefab9df99b4ac8291627` |
| `horden_blind_vorher_gras_grau_1x_02.png` | 32x48 | 250 | `087e9857abdaf9f296ed173a610d30d769cd8e6ebb6b8f6d9aeaa592d0fdd3e3` |
| `horden_blind_vorher_gras_grau_1x_03.png` | 32x48 | 261 | `347135d23c13317f0166c277b42bf92cf54acb914013ed712a3a64ad349de587` |
| `horden_blind_vorher_gras_grau_1x_04.png` | 32x48 | 284 | `3c80b36eab75d1cec5c7829bbe52ca524f0a7717bbeac04c64b6a8902bc43171` |
| `horden_blind_vorher_gras_grau_1x_05.png` | 32x48 | 419 | `3cda077116c4de04f4fb5beb32bfacc74cd264bd77ccd7a0cc6ced86edf663f1` |
| `horden_blind_vorher_gras_grau_6x_01.png` | 192x288 | 1148 | `91281df2b89634a1e6ac005d2a5e0fd8f9386ec27eb27d955369690e3f8e6744` |
| `horden_blind_vorher_gras_grau_6x_02.png` | 192x288 | 1116 | `281b91a09e7d45c4669feab6b7d1d6429c493e1decf267c452b658e2e4f6d601` |
| `horden_blind_vorher_gras_grau_6x_03.png` | 192x288 | 1190 | `3f63d6a0f8665e33c7aa82cefb4d1ad6ac66603efae6f20a87f708827586507c` |
| `horden_blind_vorher_gras_grau_6x_04.png` | 192x288 | 1207 | `ed988882035e7eac8db337efc03b71d91adce8a86443c8471f10b1fcb83104f5` |
| `horden_blind_vorher_gras_grau_6x_05.png` | 192x288 | 1424 | `f8895806096c758b1e5f24739e7b8764d972c6cc2985fb58dee1e1dcd10898c8` |
| `horden_blind_vorher_gruft_farbe_1x_01.png` | 32x48 | 341 | `bc50969771af34e46d26256c056257ec1fbbd1884c790f0dc05994969a4dac80` |
| `horden_blind_vorher_gruft_farbe_1x_02.png` | 32x48 | 352 | `b0e1c4bf0a63a432de871597c6aae979f42cdee6715b900f98918767f1ae38fd` |
| `horden_blind_vorher_gruft_farbe_1x_03.png` | 32x48 | 497 | `0268168ecd4d63053bba47edd20636b3cfd3921c8ef07d85670bc8b8cd6ae45f` |
| `horden_blind_vorher_gruft_farbe_1x_04.png` | 32x48 | 358 | `d8c6484c8e3b2b093b5e0a4438f8e41c7c7d77134cee5aeaccc488e92eba13d3` |
| `horden_blind_vorher_gruft_farbe_1x_05.png` | 32x48 | 386 | `952d57a1d10a8c241e8a5c01f567f1b923ded9ff63dca92f5d4487e930a80174` |
| `horden_blind_vorher_gruft_farbe_6x_01.png` | 192x288 | 1264 | `2ea0457837772a52f264515d60827e3fc98ef689526efce3eb32d5fa71d7a0eb` |
| `horden_blind_vorher_gruft_farbe_6x_02.png` | 192x288 | 1298 | `3b23cb03cf81654cd5539ff2b7293d7d16bb4db58565eaad0f22248a1c086f00` |
| `horden_blind_vorher_gruft_farbe_6x_03.png` | 192x288 | 1552 | `f72fb51d98bb51249a6a87ea4fc7ff387b7cf553f8ad9a7722deaa88d41c1713` |
| `horden_blind_vorher_gruft_farbe_6x_04.png` | 192x288 | 1334 | `3fb483cac8b8e437b7ff8b05e1eec07fe56add8c7955e5dd5a4d550872f733de` |
| `horden_blind_vorher_gruft_farbe_6x_05.png` | 192x288 | 1355 | `0859450031f21011081a7e776c6c7bf1a53f7b41b988cab3fe5c3bc3c029e09f` |
| `horden_blind_vorher_gruft_grau_1x_01.png` | 32x48 | 320 | `bfc6aeb892ddffe7381436f7ddd44aa6bcce4b66c35a688c28babb49692edc1b` |
| `horden_blind_vorher_gruft_grau_1x_02.png` | 32x48 | 333 | `eb5e51461a22044b22c95ba79a737941339b9e4ef2dc46749b2bc97b296ed5ee` |
| `horden_blind_vorher_gruft_grau_1x_03.png` | 32x48 | 463 | `1ef03119ae47b57ddd3d72a1441e38da9e78387bc879dfcbe7d4e9bde193f17d` |
| `horden_blind_vorher_gruft_grau_1x_04.png` | 32x48 | 332 | `7fb0dada7594e975fde70c057d755f34b3ffde2dc06fdf175bd2257d75f01071` |
| `horden_blind_vorher_gruft_grau_1x_05.png` | 32x48 | 362 | `b28ad2b60ca049e78e26eb8cfc6479adc367e70c6c9a0f4c6ddd5caef47a091d` |
| `horden_blind_vorher_gruft_grau_6x_01.png` | 192x288 | 1236 | `056daee21334a4337de908e67978ed3bc00ad26262d5086f5a80c310a4fbb1cb` |
| `horden_blind_vorher_gruft_grau_6x_02.png` | 192x288 | 1275 | `90a11fd6588999a367a5f7db31f1639b230c57d307772c2aaff987f59c20f916` |
| `horden_blind_vorher_gruft_grau_6x_03.png` | 192x288 | 1517 | `2c85f19510f3eb02ee1558f7656ad9c5b951840c1e11afcd7229c92ee010adf1` |
| `horden_blind_vorher_gruft_grau_6x_04.png` | 192x288 | 1304 | `9671267aef4e0999422b10e63dd2080a7813b2a8369e703c5fc3b11ae1b32367` |
| `horden_blind_vorher_gruft_grau_6x_05.png` | 192x288 | 1328 | `0b550f159a87b913f72e16c006a7655200853e5cd9e5417475676ef4a2a65d7a` |
| `horden_bogen_vorher_A_feld_gras_1x.png` | 320x180 | 5336 | `13d75d5cb2474dc5d0dd3929ba9b183e81ec25b2bcb11f201be63ce768f2d765` |
| `horden_bogen_vorher_A_feld_gras_6x.png` | 1920x1080 | 41473 | `353d1860e4456930542fcd33c3e0feb5e11b6f6bb674f1e7a6787044bad1f41b` |
| `horden_bogen_vorher_A_feld_gras_squint.png` | 1920x1080 | 33412 | `8f56209dd6fe4e2701c918af12ac1a38e15020575ac23e418ce91a0d97b722d4` |
| `horden_bogen_vorher_A_feld_gruft_1x.png` | 320x180 | 6554 | `e7728310bc80c9843ebc9b8fe77baf4ef83d53118deaaea9f85f3cc570fb5f63` |
| `horden_bogen_vorher_A_feld_gruft_6x.png` | 1920x1080 | 52990 | `46454acae0944215dd5a91f65c395698255a86a9560e7128b531fd7cee6ca81f` |
| `horden_bogen_vorher_A_feld_gruft_squint.png` | 1920x1080 | 44392 | `5d09088588afe663c6a63ce83b2907cf25846dd89b25f9f584a7d6493fa12ccb` |
| `horden_bogen_vorher_B_knaeuel_gras_1x.png` | 120x90 | 1234 | `d383a1dcaabde4336e70fcd1a85921fe8feb6fb3534103c2084f87415e614ee7` |
| `horden_bogen_vorher_B_knaeuel_gras_6x.png` | 720x540 | 8600 | `645c4e7a0f1b7cdf7122714e7c70bcf9847fe021e90048d2cb5309b097e0e676` |
| `horden_bogen_vorher_B_knaeuel_gras_squint.png` | 720x540 | 7312 | `787786fc33433cfa45a9bcccbb0a30fcad89488863b58907e6b8208dac6b38a6` |
| `horden_bogen_vorher_B_knaeuel_gruft_1x.png` | 120x90 | 1800 | `e22bc6b4ca533ebe5f75794350b2b5a9f1b046acb468fb1c7bcc285b303513b5` |
| `horden_bogen_vorher_B_knaeuel_gruft_6x.png` | 720x540 | 10822 | `0edb032faa6a22532c941e433515c8823ce9197b8e29bb92654b275ce58eca01` |
| `horden_bogen_vorher_B_knaeuel_gruft_squint.png` | 720x540 | 8830 | `9514e463108c720dfbdd04ff011d4d67c650359e0e69a6d34c8c7aecc3ff8b13` |
| `horden_bogen_vorher_C_leiter_gras_1x.png` | 192x48 | 1865 | `1e046ce1cd7707fa0944f8eae07bcc15f5bc73be9c171a258999196370f6babf` |
| `horden_bogen_vorher_C_leiter_gras_6x.png` | 1152x288 | 8444 | `d44fd3a20e0a352cc89d4204bddcbbd48d04c5c5caaca562ba1dd8d048f37f63` |
| `horden_bogen_vorher_C_leiter_gras_squint.png` | 1152x288 | 6883 | `0f5fb2f6b8d2f6973ffaa397615be7592a820359bbc9afb5aea315bf09447ea0` |
| `horden_bogen_vorher_C_leiter_gruft_1x.png` | 192x48 | 2318 | `5365da0b441ceaeb41ff2ddb19c3c1a3d9464fa7b9d2e164876f3c0f9b7af358` |
| `horden_bogen_vorher_C_leiter_gruft_6x.png` | 1152x288 | 10314 | `83d49806d03a7b27985a5ee058d84fef7735f0be9e9578f741faf4029408dfbf` |
| `horden_bogen_vorher_C_leiter_gruft_squint.png` | 1152x288 | 8415 | `e24fe6136cbc7dce4ff1bf362c49a3525d918f89d88fb5ba111f7074126e77ac` |
| `horden_bogen_vorher_D_schlachtfeld_gras_1x.png` | 320x180 | 4484 | `ce15d8ae9454d875b7e179109ea1370287396c64e942b3971909a1d6e8ba5d97` |
| `horden_bogen_vorher_D_schlachtfeld_gras_6x.png` | 1920x1080 | 38103 | `8d0a3ea45446acb9e64f94c96e658b1f23916268c63940023c162860a1dc486c` |
| `horden_bogen_vorher_D_schlachtfeld_gras_squint.png` | 1920x1080 | 30777 | `f0f74d37b4008b097b6a70752c9680dbfd018f90d4da3a78603bdb39b85438aa` |
| `horden_bogen_vorher_D_schlachtfeld_gruft_1x.png` | 320x180 | 5618 | `c4ec67fa7f62217781a95004bd65ebc52f0e531a7fad5d6d5d4e271459efef6d` |
| `horden_bogen_vorher_D_schlachtfeld_gruft_6x.png` | 1920x1080 | 50143 | `28362e5ff225e833c0bac02ce0ffdf6cad1fad60d83e80cf4b464aa8527aa070` |
| `horden_bogen_vorher_D_schlachtfeld_gruft_squint.png` | 1920x1080 | 42389 | `ec97c12b9369f6647817c031da3c25cfecc62e2a2a5170aec575354a4799a571` |
| `horden_bogen_vorher_legende.txt` | — | 21438 | `c60d1a41d7023f64cb3cf0019ae562ce9aac35218b0b2af176cdcaf53148efd1` |
| `horden_bogen_vorher_messung.json` | — | 51410 | `968c6462f2f3885db7924af9783b73d4a8341541e4f275a5753ba30ff8ae8a8c` |
| `vorher_messung.json` | — | 559441 | `58799ab7fa1798b979002833abd90979764c77646f5a90ba3e549a944a2a19c7` |

Dieselben Hashes fuehren auch die beiden Legenden-TXT in ihrem Abschnitt DATEIEN
— jede fuer ihre eigenen PNG. Dort fehlen naturgemaess: die Legende selbst,
`README.md` und `vorher_messung.json` (beide erst nach den Laeufen entstanden);
`horden_bogen_vorher_messung.json` steht in der Horden-Legende ohne Hash
(als `(Mess-JSON)`), weil es zum Zeitpunkt des Schreibens noch waechst.

## CH-1-Referenz unberuehrt

Die 21 CH-1-Dateien direkt in `design/referenz/` (Figuren-Boegen vorher/nachher
+ deren README) sind von P0.d **nicht angefasst** worden: sha256-Liste vor dem
ersten Lauf gezogen und nach allen Schritten erneut — Diff leer. CH-2 liegt
ausschliesslich in diesem Unterordner (Spec E-C6: "CH-1-Dateien bleiben").

Hinweis fuer den Vergleich: `design/referenz/figuren_bogen_nachher_*` (CH-1,
versioniert 10.09. 21:00 mit 3853dda) ist **nicht** mit den Menschen-Boegen hier
byte-gleich. Grund ist nicht dieser Lauf, sondern die Provenienz jener Dateien:
ihre Legende nennt `sprites_figuren.js aee65951...` und `palette.js c7a7dd51...`
— das ist exakt der Kunst-Stand des Commits `adc8c0a1` ("GP7-CH-1 Phase 1b NPCs
Versuch 2", 10.09. 15:48, Vorfahr von HEAD; von V-P0 per `git show` belegt).
Danach aenderten 9c01e14, 2ccf0da (Cast-Jury-Palette), f3302d5 und 9ef18ee die
Kunst noch einmal. Der CH-1-Nachher-Bogen zeigt also einen aelteren, committeten
Zwischenstand, nicht den abgenommenen Cast. Die Boegen hier zeigen den Stand von
`9bc205e` und gelten damit zugleich als CH-1-Nachher-Beleg AM HEAD
(design/GP7CH2_PHASE0.md R-D1).
