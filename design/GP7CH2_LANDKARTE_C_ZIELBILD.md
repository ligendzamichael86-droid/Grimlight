# GP7-CH-2 Landkarte Teil C: Horden-Zielbild (11.09.2026, Opus-Analyst)

Alle Messungen liegen vor (Sonden und Beweisbilder in `/home/coder/Grimlight/.tmp/gp7ch_ch2_sonde/`). Hier der Rohdaten-Report.

---

# GP7-CH-2 ZIELBILD-ANALYSE "DIE HORDE WIRD LESBAR"

**Messgrundlage:** alle Zahlen selbst nachgerechnet gegen HEAD 3853dda aus `game/js/art/sprites_figuren.js`, `palette.js`, `sprites_tiles.js`, `world/maps.js`, `entities/enemies.js`, `main.js`. Sonden: `mess_gegner.mjs` (Einzelmessung), `mess2.mjs` (Kontrast/Rampen/Decals), `mess3.mjs` (Tonverfügbarkeit), `mess4/mess6.mjs` (Bodenklassen je Karte), `sym.mjs`, `prof.mjs`, plus zwei **neue Beweisinstrumente**: `horde.mjs` (30 Gegner auf einem 320x180-Bildschirm) und `knaeuel.mjs` (20 Gegner mit 9-px-X-Abstand). Referenzrecherche: Darktide-Gegnerkunst-Devblog, AndroidArts-Diablo-Analyse, Dead-Cells-Artdeepdive, Vampire-Survivors-Lesbarkeitskritik.

## 0. VIER BEFUNDE VORWEG, WEIL SIE ALLES RAHMEN

**(0.1) Die Gegner stehen auf dem Stand VOR CH-1, nicht danach.** Schwarzanteil (k+n): Skelett 37,3 / Ghul 37,9 / Grufthund 40,5 / **Rostpanzer 44,9** Prozent. Die CH-1-Menschen liegen bei 12,0 bis 15,7 (Held 19,2 bis 22,9). Konturtöne mit >= 8 Texeln: Skelett **2**, Ghul/Grufthund/Rostpanzer/Warden je **1** (nur `k`). CH-1-Menschen: 3 bis 5. Ton-Spiegelgleichheit (E5-Lesart, Tonvergleich): Skelett **83,6** / Rostpanzer **69,7** / Grufthund 58,6 / Warden 54,5 / Ghul 45,3 gegen CH-1-Menschen 12,0 bis 43,1. **Der Abstand Gegner zu Menschen ist heute größer als der Abstand, den CH-1 überbrückt hat.**

**(0.2) Drei von fünf Gegnern tragen denselben Leitton.** `b` (#d6cbb1, L 203) ist dominante Materialfläche beim **Skelett (47,8 % der Figur), beim Rostpanzer (17,4 %) und beim Warden (24,8 %)**. Derselbe Ton trägt zusätzlich Brans Bart und Heddas Kopftuch (beide CH-1-abgenommen). Der Rostpanzer teilt **8 von 9 Tönen** mit den Menschen. Das ist die mechanische Ursache dafür, dass die Horde als eine Masse liest, und es ist eine Kopplung, die CH-2 nicht einseitig auflösen kann (siehe 0.4).

**(0.3) Die Kopf-Schulter-Zone, die laut Darktide den größten wahrgenommenen Unterschied trägt, ist bei uns die ÄHNLICHSTE Zone.** Breitenprofil der obersten 6 belegten Zeilen, paarweise: Skelett/Ghul **86,9** / Skelett/Rostpanzer **80,4** / Ghul/Grufthund **80,0** / Ghul/Rostpanzer 77,6. Über die ganze Figur (fußbündig, E5-Formel): Ghul/Rostpanzer **78,9** / Skelett/Rostpanzer 67,7 / Skelett/Ghul 59,7 / Grufthund/Rostpanzer 57,9 / Grufthund/Ghul 45,4.
*Korrektur an Teil C:* die dortigen Zahlen (Skelett/Ghul 76, Ghul/Rostpanzer 78, Hund/Rostpanzer 56) stammen aus einer Vorformel. Nach der in E5 eingefrorenen Formel und **fußbündig ausgerichtet** (die Engine setzt Füße auf die AABB-Unterkante, `enemies.js:639-641`; kopfbündiges Vergleichen von 16x12 gegen 16x20 ist methodisch falsch) sehen die Werte anders aus. Fußbündig ist die verbindliche Lesart für Gegner.

**(0.4) Der schärfste neue Befund: die dL-Regel aus E1 und die Horden-Wertstaffelung schließen einander heute aus.** Wörtlich nach E1 gerechnet (dL 25..90 gegen ALLE begehbaren Kachelarten der Wirkorte) ergibt sich:

| Karte | begehbare Kachelarten | L-Spanne | zulässiges Körper-L-Fenster |
|---|---|---|---|
| GRAVEYARD | 86 | 37,5 .. 91,5 | **116 .. 128** |
| CATACOMBS | 12 | 37,5 .. 53,2 | 78 .. 128 |
| FLÜSTERGRUFT | 11 | 37,5 .. 60,3 | 85 .. 128 |
| BOSS_KAMMER | 8 | 44,7 .. 70,0 | 95 .. 135 |

Skelett und Grufthund laufen beide über GRAVEYARD **und** die Gruft. Ihr Schnittfenster ist **[116 .. 128]**, also 12 L breit. Zwei Gegner, die derselben Horde angehören, dürften sich dann um höchstens 12 L unterscheiden. Genau das erzeugt Brei. **CH-2 braucht hierfür eine Gate-Auflösung vor Baubeginn, analog zu G-A/G-J.**
Die Zahlen für die Auflösung liegen vor: von 1636 begehbaren Zellen aller Gegnerkarten sind **88 Prozent dunkel** (L 47 bis 60,3). GRAVEYARD ist zu 84,4 % Gras (L 47,0..56,3), 11,6 % Weg (L 90,9..91,2), 3,7 % Deko-Boden, 0,3 % Treppe. Die Spanne 37,5..91,5 entsteht aus zwei Randklassen mit zusammen 11,9 % der Zellen.

---

## 1. HORDEN-LESBARKEITS-ANATOMIE: acht Techniken mit Messziel und IST

### H1 Silhouetten-Familien, höchstens vier, Kopf-Schulter zuerst
*Regel (Darktide, wörtlich):* "The shoulder/head area gave the most impact in terms of perceived difference between enemies", und: eine ganze Gegner-Ebene wird als **ein** Charakter behandelt, damit man Horde von Roamer und Roamer von Elite unterscheidet, statt einzelne Instanzen herauszuheben. Rückenaufbauten ändern die Silhouette von vorn **und** von der Seite und sind das billigste Distanz-Erkennungsmerkmal.
*Messgröße:* (a) Breitenprofil-Ähnlichkeit fußbündig über die ganze Figur, (b) dieselbe Formel auf die obersten 6 belegten Zeilen.
*IST:* siehe 0.3. Worst Case ganz: Ghul/Rostpanzer 78,9. Worst Case Kopf-Schulter: Skelett/Ghul 86,9.
*ZIEL:* **ganze Figur <= 60 innerhalb einer Familie und <= 60 familienübergreifend; Kopf-Schulter-Zone <= 55 für JEDES Paar.** Die Kopf-Schulter-Zahl ist das schärfere Gate und die, an der die Pixel zuerst ausgegeben werden.
*Familien (vier, eingefroren):* AUFRECHT-SCHMAL (Skelett) / AUFRECHT-MASSIG (Ghul, Rostpanzer) / VIERBEINER-NIEDRIG (Grufthund) / GROSS-ELITE (Warden). Das Fußvolk tritt AUFRECHT-SCHMAL bei, eine Größenstufe tiefer. **Ghul und Rostpanzer sind heute das einzige Paar in derselben Familie und reißen beide Gates.** Einer von beiden muss die Familie über einen Rückenaufbau verlassen (Vorschlag: Rostpanzer bekommt die Schulterplatten-Ausladung und wird AUFRECHT-BREIT).

### H2 Größenleiter, sichtbar statt nur vorhanden
*IST (Grid / bbox / Rahmenfüllung):* Grufthund 16x12 / 15x11 / 57,8 % | Skelett 16x16 / 14x15 / 52,3 % | Rostpanzer 16x18 / 16x18 / 61,8 % | Ghul 16x20 / 16x20 / 63,4 % | Warden 24x32 / 24x32 / 68,8 %.
*Befund:* Die Höhenleiter existiert (12/16/18/20/32), aber die **Breite** ist bei allen 14 bis 16 gedeckelt. Ghul und Rostpanzer füllen den 16er-Rahmen randlos aus; sie können nicht breiter werden, ohne den Rahmen zu verlassen.
*ZIEL:* KLEIN 16x14 (Fußvolk) / 16x12 (Hund, quer) | MITTEL 16x16 bis 16x20 | GROSS 24x32. **Zusätzlich eine Breitenleiter:** bbox-Breite je Größenklasse mindestens 2 px auseinander; der Rostpanzer bekommt als einziger MITTEL-Gegner einen Rahmen von **20x18** (die Engine liest die Sprite-Maße aus dem Canvas, `enemies.js:639-641`, Kosten null; die AABB 14x16 bleibt unberührt, damit smoke:3338-3340 grün bleibt).

### H3 Wert-Staffelung (der Diablo-Hebel)
*Regel:* Diablo 1 ließ entfernte Gegner über den Lichtradius bewusst zu **reinen dunklen Silhouetten kollabieren**. Dead Cells fährt umgekehrt: Gegner und ihre Angriffe mit hoher Sättigung, Kontrast und Helligkeit, damit die Gefahr sofort ablesbar ist. Beides setzt voraus, dass die Gegner untereinander **Wertstufen** haben.
*Messgröße:* Körper-L (opake Nicht-k/n-Texel, Teil-C-Lesart), plus Abstand zur Nachbarstufe.
*IST:* Skelett **193,7** / Warden 143,4 / Rostpanzer 135,0 / Ghul 102,4 / Grufthund **80,6**. Spanne 113 L, aber ohne System, und das Skelett liegt 65 L über dem oberen Rand jedes Bandes.
*ZIEL (Vorschlag, drei Stufen, >= 15 L Abstand, alle innerhalb 85..140):*

| Stufe | Körper-L Ziel | wer | heute | Delta |
|---|---|---|---|---|
| DUNKEL | 85 .. 100 | Grufthund, Rostpanzer | 80,6 / 135,0 | +5..+20 / **-35..-50** |
| MITTEL | 108 .. 122 | Ghul, Horden-Fußvolk | 102,4 / neu | +6..+20 |
| HELL | 128 .. 140 | Skelett | 193,7 | **-54..-66** |
| GROSS | 130 .. 145 | Warden | 143,4 | halten |

Zwei Typen dürfen eine Stufe nur teilen, wenn sie **verschiedenen Familien** angehören (Hund = Vierbeiner gegen Rostpanzer = aufrecht-breit; Ghul = massig gegen Fußvolk = klein). Damit sind Ghul und Rostpanzer, das heutige Problempaar, **in Familie UND Wertstufe getrennt**.

### H4 Kontrast-Band gegen den Boden, neu gefasst
*Vorschlag zur Gate-Auflösung (nenne ich hier G-O, Entscheid liegt bei Fable):*
1. **dL 25..90 gilt gegen die LEITKLASSE der Karte** (die Bodenklasse mit >= 80 % der begehbaren Zellen): GRAVEYARD Gras L 47,0..56,3, CATACOMBS/BOSS Stein L 51,3..70,0, FLÜSTERGRUFT Stein L 52,5. Fenster: Gras **[81 .. 137]**, Gruft-Stein **[78 .. 142]**, Boss-Stein [95 .. 141]. Schnitt für einen Gegner auf Gras und Stein: **[81 .. 137]**, 56 L breit. Darin passt die Leiter aus H3 vollständig.
2. **Minderheitsklassen (GRAVEYARD-Weg 11,6 %, Gruft-Wasser 14,0 %) bekommen ein weicheres Kriterium:** dL >= 10 ODER dE00 >= 20 ODER Rim >= 12 % der Kontur. Begründung aus der Messung: der Held selbst hat auf dem Weg dL -11,3 und wurde in G-A über Rim und Kante abgenommen; für Gegner dieselbe Lesart anzulegen ist konsistent, nicht nachgiebig.
3. **Harte Sperrliste je Gegner** (Fortschreibung von E6): Grufthund verlässt die Erdrampe z/p/v/P/V **vollständig**, inklusive deren Spitzlicht V. Ghul verlässt die Steinrampe g. Skelett darf die Knochen-Kachelrampe `bones` (L 53,5) und `floor_decal_bones` (L 70,0) nicht als dominante Rampe führen.
*IST-Tabelle (Körper-L, dL / dE00 je Leitkachel):*

| Gegner | Körper-L | Gras 49,9 | Gruft-Stein 52,5 | Weg 90,9 | Lehm 72,8 |
|---|---|---|---|---|---|
| Skelett | 193,7 | +143,8 / 58,0 | +141,2 / 58,7 | +102,7 / 36,0 | +120,8 / 45,7 |
| Ghul | 102,4 | +52,5 / 19,7 | +49,9 / 25,4 | +11,4 / 12,1 | +29,6 / 16,4 |
| **Grufthund** | 80,6 | +30,7 / 19,1 | +28,1 / 16,9 | **-10,4 / 5,7** | +7,8 / 3,3 |
| Rostpanzer | 135,0 | +85,1 / 37,7 | +82,6 / 36,0 | +44,1 / 18,5 | +62,2 / 24,9 |
| Warden | 143,4 | +93,5 / 34,9 | +91,0 / 36,0 | +52,5 / 22,1 | +70,6 / 28,1 |

Der Grufthund ist mit dL -10,4 **und** dE00 5,7 gegen den Weg der einzige Fall, der beide Pfade gleichzeitig reißt. Er ist der schlechteste Lesbarkeitsfall des Spiels, und das bestätigt der Bogen-Beweis (siehe Abschnitt 5).

### H5 Umriss-Budget: die Horde besteht zu einem Drittel aus Schwarz
*Messung am Horden-Prototyp* (`horde.mjs`, 30 Gegner: 12 Skelett, 8 Ghul, 5 Hund, 4 Rost, 1 Warden, Y-sortiert auf Gruft-Stein): **5 027 Gegner-Texel auf einem 320x180-Bildschirm, davon 1 889 reines Schwarz = 37,6 Prozent.** Die Gegner belegen 8,2 % der Bildfläche; innerhalb dieser Fläche ist jeder dritte sichtbare Texel `k` oder `n`.
*ZIEL:* Schwarzanteil je Gegner-Grid **<= 25 Prozent** (Grufthund <= 30 Prozent, vier Läufe erzeugen drei Zwischenräume; deklarierte Ausnahme), **>= 3 Konturtöne mit je >= 8 Texeln** je Grid. Szenen-Messgröße im Horden-Bogen: **Schwarz-Sprenkel-Anteil der Szene <= 25 Prozent.** Der Weg von 37,6 auf 25 nimmt der Szene 632 schwarze Texel ab, das ist mehr als der ganze Ghul-Sprite.
*IST je Grid (geometrischer Umriss / Schwarzanteil):* Skelett 49,3 / 37,3 | Ghul 34,5 / 37,9 | Grufthund 42,3 / 40,5 | Rostpanzer 34,8 / 44,9 | Warden 19,7 / 24,2.
*Der Warden liegt als Einziger bereits im Ziel und bleibt der Eichkörper.*

### H6 Rim als Trennung im Überlapp, und die Flip-Falle
*Beweis (`knaeuel.mjs`, `knaeuel_ohnerim_4x.png`):* 20 Gegner in vier Reihen mit 9 px X-Abstand. Die fünf nebeneinander stehenden Skelette verschmelzen trotz vollständigem schwarzem Umriss zu **einer durchgehenden Knochenwand**. Ursache: der schwarze Umriss trennt zwei Flächen nur dann, wenn die Flächen verschiedene Werte haben. Fünfmal L 203 nebeneinander liest als Zaun, nicht als fünf Figuren. Im Squint verschwindet die Einzelfigur vollständig.
*IST Rim im Gegner-Cast:* **exakt ein Rim existiert**: der Ghul trägt `C` (#3c5a70) mit 9 Texeln an der linken Kante. Skelett, Grufthund, Rostpanzer: null. Der Warden hat `8`/`I` als Glut/Glanz, keinen Kantenrim.
*Flip-Falle (G-F, überträgt sich direkt):* **Alle fünf Gegner werden gespiegelt gezeichnet** (`enemies.js:634-641`, `e.facingLeft ? key_flip : key`). Der Ghul-Rim sitzt heute als **senkrechte Lichtkante links** und landet nach links laufend auf der Schattenseite. Anker-Regel 1 (flip-neutral, Licht von oben, keine senkrechte Lichtkante in Seitenansichten) gilt damit für **alle** Gegner, und der einzige vorhandene Gegner-Rim verletzt sie.
*ZIEL:* Jeder Gegner >= 12 Prozent der Kontur als Rim, **flip-neutral von oben** (Schädeldecke, Schulteroberkante, Rückenkamm). Tonwahl aus dem Bestand, keine neuen Rim-Töne nötig: warm `_` (#e0c3c3, L 204) für Skelett und Rostpanzer, kalt `|` (#abdcda, L 205) für Ghul und Grufthund, plus je die hellste eigene Materialstufe als weiche Kante (Anker-Regel 7).
*Zweite Messgröße für den Überlapp:* **Trenn-Rate der Überlappkanten** = Anteil der Grenzlinien zwischen zwei überlappenden Gegnern, an denen ein Rim-Texel ODER ein Wertsprung >= 25 L steht. Ziel >= 80 Prozent.

### H7 Farb-Cluster statt Sprenkel
*IST (Solitär-Texel ohne k/n, ungerundet):* Bran 1,1 / Corm 1,9 / Mile 2,1 / Held 5,0 / Torwächter 6,0 / Ghul 7,1 / Hedda 7,5 / Skelett **14,3** (Frame 1: **19,0**) / Warden 16,3 / Grufthund **22,7** (Frame 1: **26,6**) / Rostpanzer **32,7** (Frame 1: 33,7).
*Neu gegenüber Teil C:* Der **Grufthund ist der zweitschlechteste Fall (22,7 bis 26,6 Prozent)**, in Teil C gar nicht ausgewiesen. Bei 16x12 und 111 opaken Texeln sind das 20 bis 22 freistehende Einzelpixel auf einer Figur, die im Spiel 7-mal vorkommt.
*ZIEL:* <= 8 Prozent nach G-C-Lesart (Merkmal-/Requisit-/Rim-Texel aus der Material-Tabelle abgezogen, Deckel 12 Merkmal-Texel je Grid). Beim Rostpanzer heißt das: Rostplatten in mindestens 2x2-Clustern, nicht texelweise gestreut.

### H8 Rampen und Hue-Shift: die Gegner haben teils gar keine Rampen
*IST:*

| Rampe | Töne | Hue-Spanne | L-Stufen | Schrittverhältnis |
|---|---|---|---|---|
| Knochen | O/B/b/N | **5,1 Grad** | 102/139/203/233 | 36,8 / **64,0** / 29,6 = 2,2 |
| Ghul-"Tuch" | g/d | **198,2 Grad** | 56/84 | eine Stufe |
| Ghul-Schädel | H/3 | 0,7 Grad | 172/199 | eine Stufe |
| Erde (Hund) | z/p/v/P/V | 21,5 Grad | 44/61/76/103/134 | 16,7/15,9/26,4/30,9 = 1,9 |
| Rost | 4/5/6 | 12,0 Grad | 57/90/125 | 33,2 / 35,1 = **1,06** |

*Befund Ghul:* `g` ist #3a3542 (h 306 Grad, violettgrau, die **Steinrampe**), `d` ist #585a2c (h 108 Grad, oliv). Das sind zwei unverwandte Materialien, die als eine Fläche gezeichnet sind. Die "Hue-Spanne 198 Grad" ist kein Hue-Shift, sie ist ein Materialbruch. Der Ghul hat de facto **keine** Kleiderrampe.
*Befund Rost:* die einzige Gegner-Rampe mit vorbildlichem Schrittgleichmaß (1,06). Behalten.
*ZIEL:* >= 3 Stufen je Materialfläche >= 40 Texel, Schrittverhältnis <= 1,6, Hue-Spanne >= 20 Grad je 3-Stufen-Rampe, kein Einzelton > 55 Prozent einer Materialfläche (Skelett heute: `b` trägt 47,8 Prozent der **ganzen Figur**).

---

## 2. STECKBRIEFE VERTIEFT

Gemeinsame Erbregeln aus `GP7CH1_ANKER_HELD.md`, die **alle fünf Gegner erben**: flip-neutrales Seitenlicht (Regel 1, gilt hier für jeden Gegner, weil jeder gespiegelt wird), selektives Outline bis zum Bodenkontakt mit lückenloser Kante (Regel 2), Sekundärbewegung nur auf der Silhouette (Regel 3), Material-Tabelle mit `art:"requisit"/"merkmal"/"rim"` (Regeln 4/5), 5-stufige Rampen mit monotonem L und monotoner Hue (Regel 8), 6x rendern und ansehen (Regel 10).

### SKELETT (16x16) — Reihenfolge-Platz 1
*Warum zuerst:* 21 der 41 Spawns im ganzen Spiel (51 Prozent) sind Skelette. Es ist zugleich der größte Einzelfehler (dL +143,8 auf Gras) und der Ton-Lieferant für Rostpanzer und Warden.
**Silhouetten-Signatur:** geneigter Schädel (heute waagerecht und mittig), schmales Rippenfenster (existiert, behalten), **ein Arm hängt, einer erhoben** (heute beide symmetrisch, Ton-Spiegelgleichheit 83,6). Kopf-Schulter-Zone: der Schädel muss **schmaler als die Schultern** werden; heute ist Zeile 1 bis 6 durchgehend 8 bis 10 px, also ein Kasten.
**Rampe:** heute O/B/b/N mit `b` auf 64 von 84 Knochentexeln. Ziel: eigene 5-stufige Knochenrampe, Körper-L 128..140, `b` nur noch als Spitzlicht (<= 15 Prozent der Fläche). **Neue Töne nötig: 3 bis 4** (siehe Palettenbilanz 6.2). Hue-Shift: Schatten dreht kalt Richtung 250 bis 270 Grad (Grabkälte), Licht dreht warm Richtung 80 Grad, Spanne >= 25 Grad.
**Rim:** warm `_`, flip-neutral auf Schädeldecke und Schlüsselbein. **Umriss:** <= 25 Prozent, >= 3 Konturtöne (heute 2: k 40, b 25).
**Animation Minimum für Masse:** Walk 2 (heute 2, Texel-Diff 12 = 9,0 Prozent, Silhouetten-Diff 8 = 6,0 Prozent, nur Beine). Erweiterung auf 3 mit echter Schulterrotation gehört nach CH-3; **CH-2 hebt nur den Silhouetten-Diff der bestehenden zwei Frames auf >= 8 Prozent mit Bewegung in >= 2 Regionen.** Attack: heute keiner. Hurt: Flash.
**Zweistufiges Sterben:** Stufe 1 = `skeleton_die` (Name **bindend**, siehe 6.3) als Zusammensacken, 2 Frames, 0,2 s. Stufe 2 = neues Decal `skeleton_rest`. IST `skeleton_die`: 51 Texel, 19,9 Prozent Rahmenfüllung, 5 Zeilen (9..13). **Bereits im Ziel**, taugt als Decal-Vorlage.
**3 Witterungsvarianten (Tauschschlüssel = die 2 obersten Knochenstufen):** *Verwittert* (entsättigt, ins Graugrüne, Moosansatz an der Unterkante), *Frisch/feucht* (höhere Sättigung, warm), *Verbrannt* (untere Stufe fast auf `n`, obere ascheblass). **Elite-Overlay:** `elite_glow` 8x8 existiert (`enemies.js:657-668`) plus ein 6x6-Helm-Overlay nach dem Muster von `shield_*`.

### GHUL (16x20) — Reihenfolge-Platz 4
*Der heimliche Beste, aber mit einem verdeckten Materialfehler.* Solitär 7,1, Ton-Spiegelgleichheit 45,3 (bester Gegnerwert), 20 belegte Zeilen.
**Silhouetten-Signatur:** breiteste, gebeugteste Form, **ungleiche Schultern**, Arme bis unter die Knie. Kopf-Schulter-Zone muss sich vom Skelett lösen: heute 86,9 Ähnlichkeit. Konkret: der Ghul bekommt einen **eingezogenen Hals mit hochgezogenen Schultern**, das Skelett einen freistehenden Schädel auf schmalem Hals. Das allein trennt die Zone.
**Rampe:** `g` (Steinrampe!) plus `d` (oliv) sind zwei Materialien in einer Fläche. Ziel: eigene Lumpen-Rampe, 3 Stufen, Körper-L 108..122. **Neue Töne nötig: 3.** Der Schädel behält H/3, braucht aber eine dritte Stufe.
**Rim:** kalt `|`, flip-neutral **oben** statt wie heute links. Die vorhandenen 9 `C`-Texel sind der Fehler, nicht die Vorlage.
**Animation:** Walk 2 (Texel-Diff 25 = 12,3 Prozent, Silhouette 14 = 6,9 Prozent, brauchbar). Ein schleifender Fuß als dritter Frame gehört nach CH-3.
**Sterben:** `ghoul_die` 52 Texel / 16,3 Prozent / 5 Zeilen. Bestes Decal des Casts, unverändert übernehmen.
**Varianten:** *Wassertot* (aufgedunsen, kaltgrün), *Ausgedörrt* (ledrig, warmbraun), *Frisch* (Fleischton, höchste Sättigung). **Elite:** Kettenfetzen-Overlay am Rücken (Rückenaufbau = Distanzmerkmal nach Darktide).

### GRUFTHUND (16x12) — Reihenfolge-Platz 2
*Zweitgrößter Sprung nach dem Skelett: er ist der einzige Gegner, der beide Kontrastpfade gleichzeitig reißt, und er hat 26,6 Prozent Solitär-Rauschen.*
**Silhouetten-Signatur:** einziger Vierbeiner, die horizontale Lesart trennt ihn bereits am besten (Grufthund/Ghul 45,4). Verstärken: längerer Rumpf, **tiefer gestellter Kopf** (unter Schulterhöhe), Schwanz als Silhouettenbrecher nach hinten-oben. Kopf-Schulter-Zone gegen Ghul heute 80,0 (die aufgerichtete Kopfpartie ist zu hoch).
**Rampe:** verlässt z/p/v/P/V **vollständig**, inklusive V (dem Spitzlicht des Weges, auf dem er jagt). Ziel: kalte Sehnen/Schatten-Rampe, Körper-L 85..100, Hue >= 60 Grad entfernt von Gras (h 150) **und** vom Weg (h 78). Damit trägt ihn auf dem Weg der dE00-Pfad statt des dL-Pfads. **Neue Töne nötig: 3 bis 4** (oder Nutzung von `f` #8a92a0, siehe 6.2).
**Merkmal:** ein einziges Texel Seelenglut `8` (#7ff0b8, L 200) als Auge. Als `art:"merkmal"` deklariert, damit es nicht als Solitär-Rauschen zählt. Das ist das billigste Distanzmerkmal des ganzen Passes.
**Rim:** kalt `|` auf Rückenkamm und Schädeloberkante.
**Animation:** Lauf 2 (Texel-Diff 32 = 28,8 Prozent, Silhouette 20 = 18,0 Prozent — der **beste** Wert des Casts, behalten). Telegraph/Leap/Down existieren und sind gute Arbeit; sie werden nur nachgezogen (Rampe, Rim, Entrauschen).
**Sterben:** `hound_die` ist mit **79 Texeln / 41,1 Prozent Rahmenfüllung / 7 Zeilen** der **einzige Decal-Kandidat, der das Ziel reißt**. Er wird zu Stufe 1 (Pose "kippt auf die Seite"), und Stufe 2 braucht ein **neues, flaches Decal** `hound_rest` mit <= 25 Prozent und <= 4 Zeilen.
**Varianten:** *Räudig* (Fellücken, Knochen durch), *Aschig*, *Blutig* (der freie Ton `x` #e0524c als Akzent). **Elite:** zweiter Kopf oder Rückenstacheln als Overlay.

### ROSTPANZER (16x18 -> Vorschlag 20x18) — Reihenfolge-Platz 3
*Höchstes Rauschen (32,7 Prozent), höchster Schwarzanteil (44,9 Prozent), teilt 8 von 9 Tönen mit den Menschen.*
**Silhouetten-Signatur:** die **Schulterplatten-Ausladung**, die heute am 16-px-Rahmen abgeschnitten wird. Er ist die Figur, die Breite am dringendsten braucht. Mit 20 px Rahmen wird er zur Familie AUFRECHT-BREIT und verlässt damit die Kollision mit dem Ghul (heute 78,9 ganz / 77,6 Kopf-Schulter).
**Rampe:** Rost 4/5/6 behalten (bestes Schrittgleichmaß des Casts, 1,06). **Aber:** E6 erklärt Rost zur exklusiven Identität des Torwächters. Das ist ein offener Widerspruch, den CH-2 deklarieren muss. *Vorschlag:* "Rost ist **ortsgetrennt exklusiv**: Torwächter im DORF, Rostpanzer in Gruft/Katakomben. Die Karten teilen keine Gegner und keine NPCs; die Figuren treffen sich nie." Kosten: eine Zeile Deklaration, null Töne.
**Was weg muss:** die Knochenfläche N/b/B/O. Sie ist der geteilte Leitton mit dem Skelett und macht ihn im Bogen zum "Skelett mit orangem Helm" (siehe Abschnitt 5). Ziel: Körper-L 85..100, Knochen nur als schmale Rippenlinie <= 10 Prozent.
**Behalten:** das Schild-Overlay (`shield_side/up/down`, gezeichnet mit Offset `faceX*6`, `enemies.js:642-656`). Es ist die vorhandene Overlay-Ebene und die Vorlage für jedes Elite-Anbauteil.
**Animation:** Walk 2 (Texel-Diff 32 = 18,0 Prozent, Silhouette 16 = 9,0 Prozent). Block existiert.
**Sterben:** `rust_die` 66 Texel / 22,9 Prozent / 6 Zeilen. Im Ziel, übernehmen.
**Varianten:** *Nassrost* (dunkel, gesättigt), *Trockenrost* (hell, staubig), *Grünspan* (kaltes Kupfer, der einzige Bruch aus der Warmfamilie). **Elite:** zweites Schild oder Helmzier über das vorhandene Overlay.

### GRABWÄCHTER (24x32) — nur nachziehen, und mit einer Warnung
*Bester Wert des Casts: 19,7 Prozent geometrischer Umriss, 24,2 Prozent Schwarz, Ton-Spiegelgleichheit 54,5, 19 Töne, 9 Zustände, Walk-Silhouetten-Diff 66 Texel = 15,0 Prozent.* Bleibt Eichkörper.
*Nachziehen:* Rim (hat keinen), Sekundärbewegung an den 24 Stofftexeln u/U/X, flip-neutrale Seitenkante.
**WARNUNG, die Teil C nicht hatte:** Teil C schlägt "Hue-Shift der Knochenrampe" vor. Die Knochenrampe O/B/b/N wird von **Skelett, Rostpanzer, Warden, Brans Bart und Heddas Kopftuch** geteilt. Ein Hex-Shift an O/B/b/N ändert **zwei CH-1-abgenommene NPCs**. Entweder bekommt das Skelett eine **eigene neue** Knochenrampe (bevorzugt, siehe Palettenbilanz), oder der Hue-Shift der Bestandsrampe wird als CH-1-Wiedereröffnung deklariert und beim Cast-Juror gegengeprüft. **Nicht stillschweigend machen.**

---

## 3. SECHSTER TYP "HORDEN-FUSSVOLK" (16x14)

**Empfehlung: JA, jetzt zeichnen, aber OHNE Registrierung und OHNE Spawn.**

Begründung entlang der Spieldynamik-Regel: ein neuer `kind` in `CREATORS` (`enemies.js:180`) plus ein `enemySpawns`-Eintrag wäre eine Änderung der Spieldynamik. Beides ist **nicht nötig**, um die Figur zu gebären. Der Horden-Bogen und das Messwerkzeug lesen `SPRITES` direkt (wie `tools/figuren_bogen.mjs` es heute tut), nicht die Karten. CH-2 liefert also:
- die Grids in `sprites_figuren.js` (**angehängt**, siehe 6.3),
- die Flip-Einträge in `main.js` (**angehängt nach Index 22**, siehe 6.3),
- den Eintrag in der Material-Tabelle,
- die 4 Paletten-Varianten als Tauschschlüssel-Definition,
- Messung und Jury-Urteil im Horden-Bogen.

**Kein** `CREATORS`-Eintrag, **kein** Spawn, **kein** Balance-Wert. Slice 7 verdrahtet die fertige, gemessene und abgenommene Figur in einem Zug.

**Steckbrief:**
- **Maß:** 16x14, bbox-Ziel 12x13. Eine Größenstufe unter dem Skelett (16x16), damit 30 Stück als **Teppich** lesen und nicht als Wand.
- **Familie:** AUFRECHT-SCHMAL, Untertyp KLEIN. Kopf-Schulter-Ähnlichkeit zum Skelett <= 55 verlangt: **kein freistehender Schädel**. Vorschlag: Kapuze/Lumpenhaube, die Kopf und Schultern zu einer einzigen abfallenden Linie verbindet (die Gegenform zum Skelettschädel).
- **Töne:** <= 6, davon <= 2 schwarz. Körper-L 112..122 (Wertstufe MITTEL, Familie KLEIN, damit vom Ghul über die Größe getrennt).
- **Umriss:** <= 20 Prozent Schwarzanteil, >= 3 Konturtöne.
- **Rim:** 1 Ton, flip-neutral auf der Haubenoberkante, >= 12 Prozent der Kontur.
- **Animation:** 2 Walk (Silhouetten-Diff >= 8 Prozent), 1 Attack (eine Pose, Ausfallschritt, bricht den Rahmen seitlich).
- **Sterben zweistufig:** Stufe 1 `fussvolk_die` (Zusammensacken, 1 Frame reicht bei dieser Größe), Stufe 2 `fussvolk_rest` als Decal <= 20 Prozent Rahmenfüllung, <= 4 Zeilen.
- **4 Paletten-Varianten ab Tag eins:** Tauschschlüssel = die 2 Stufen der Lumpenfläche plus der Hautton. Varianten: *Grau*, *Moorbraun*, *Ascheschwarz*, *Blutfleck* (mit `x`). Auflage aus 3.2: jede Variante hält dL/dE00 nach H4 und unterscheidet sich von ihren Geschwistern um dE00 >= 12.
- **Grid-Kosten:** 5 Grids plus 5 Flips. Das ist die billigste Figur des Passes und spart Slice 7 einen kompletten Zeichenblock.

---

## 4. FLASH STATT BLINK — visuelle Spezifikation

**IST:** `enemies.js:620` blendet einen getroffenen Gegner alle 1/20 s **vollständig aus** (`return false`, kein Draw), `HURT_FLASH = 0.2` s, also 6 unsichtbare von 12 Frames je Treffer. `player.js:229` blendet den unverwundbaren Spieler alle 1/12 s aus, `INVULN_TIME = 1` s, also **rund 30 unsichtbare Frames je Treffer**. Zusätzlich blinkt der Grufthund beim Aufstehen (`enemies.js:622-625`).

### 4.1 Gegner: weißer Vollflächen-Flash, Umriss bleibt schwarz
- **Dauer: 3 Frames bei Treffer, 4 Frames bei Kill.** Begründung: der Hitstop steht bereits auf 2/3/4 (`main.js:980-982`, HITSTOP_H 2 / HITSTOP_K 3 / HITSTOP_B 4). Der Flash muss den Freeze **überleben**, sonst sieht der Spieler ihn nicht, weil der Freeze das Bild anhält. Flash = Hitstop + 1 Frame ist die einfachste kopplungsfreie Regel und liegt im Literatur-Optimum (1 bis 3 Frames).
- **Ton: warmes Weiß `#fff4dc`.** Begründung aus dem Bestand: `main.js:2804` fährt den Bildschirm-Flash bei Spielerschaden bereits mit `rgba(255,244,220,0.18)`. Derselbe Ton für den Sprite-Flash hält die Familie zusammen. Reines `#ffffff` ist in dieser entsättigten Palette ein Fremdkörper.
- **Helligkeitsauflage:** der Flash-Ton muss **mindestens 12 L über dem hellsten Körperton der Figur** liegen. Hellster Körperton im Cast ist `N` #f1e9d3 mit L 233. `#fff4dc` hat L 244,5, also +11,5. Knapp; falls das Skelett seine Rampe behält, auf `#fff8ea` (L 249) gehen. Bei einem Skelett, das nach H3 auf Körper-L 128..140 kommt, ist die Auflage komfortabel erfüllt.
- **Der Umriss bleibt schwarz.** Das ist die wichtigste Abweichung von der Literatur und sie ist gemessen: `horde_gruft_flash_4x.png` zeigt, dass ein Vollflächen-Flash **inklusive** Umriss zwei überlappende Gegner zu einem einzigen weißen Klumpen verschmilzt. Der Umriss ist genau das, was im Gedränge noch trennt. Technisch: `buildTintMask` (`sprite_factory.js:68-97`) malt heute **jedes** Nicht-`.`-Texel. Es braucht eine Variante, die die als `art:"umriss"` deklarierten Töne (k, n) überspringt. Aufwand: ein zusätzlicher Parameter, ein zusätzlicher Cache-Schlüssel in `tintMaske` (`main.js:193-215`), rund 15 Zeilen. Die lazy Masken-Registry (`MASK_REG`, `main.js:155-165`) trägt die Grids bereits, auch spaltengespiegelt für `_flip`.
- **Messziel: Silhouetten-Verlust-Frames je Treffer = 0.** Prüfbar headless: kein Frame zwischen Treffer und Ende des Hurt-Fensters darf den Gegner-Sprite aus der Zeichenliste nehmen.
- **Horden-Wirkung:** 40 Gegner, von denen die Hälfte flimmernd verschwindet, ist Chaos. 40 Gegner, die 3 Frames warmweiß aufblitzen und dabei ihren schwarzen Umriss behalten, lesen als Wucht.

### 4.2 Spieler-Unverwundbarkeit: **Alpha-Puls, nicht Flash**
**Entscheid-Vorschlag mit Begründung:**
- Ein Flash markiert ein **Ereignis** ("jetzt getroffen"). Unverwundbarkeit ist ein **Zustand** über 1,0 s. Ein 1 s langer weißer Flash liest als "brennt", nicht als "kurz unverwundbar".
- Der Spieler ist die Figur, die der Spieler die ganze Zeit verfolgt. Er darf **nie** seine Silhouette verlieren. Heute verliert er sie 30 Frames lang, das ist die Hälfte der Unverwundbarkeit.
- **Vorschlag:** (a) genau **2 Frames warmweißer Flash auf dem Trefferframe** (dieselbe Maske wie bei den Gegnern, Umriss bleibt), danach (b) **Alpha-Puls zwischen 1,00 und 0,55 mit 6 Hz** für den Rest der Unverwundbarkeit. Nie unter 0,5.
- **Messziel:** Spieler-Silhouetten-Verlust-Frames = 0; minimale Zeichenalpha >= 0,5; Pulsfrequenz <= 8 Hz (über 8 Hz wird Flimmern zum Reizfaktor, und `HURT_FLASH`/Invuln laufen bereits auf dem 12er- und 20er-Raster, das ist zu schnell).
- **Warnung:** bei einem Alpha-Puls über `ctx.globalAlpha` ist die Wächter-Regel §0.5 "kein Teilalpha-fillRect auf einem Offscreen" zu beachten; der Puls gehört an das `drawImage` im Haupt-ctx, nicht in die Maske.

---

## 5. DIE HORDE IM BILD — Werkzeugvorschlag "Horden-Bogen"

Ich habe den Prototyp bereits gebaut und gemessen; er liegt in `.tmp/gp7ch_ch2_sonde/horde.mjs` und `knaeuel.mjs`. Beide sind reine Node-PNG-Dumps ohne Browser, ohne Server, ohne Playwright, nach dem Muster von `tools/figuren_bogen.mjs` (dessen PNG-, Kachel-, Squint- und Font-Bausteine übernommen werden können).

### 5.1 Was der Bogen liefert (Vorschlag `tools/horden_bogen.mjs`)
Vier Tafeln, je in 1x / 6x / Squint (Nearest-Neighbour 50 Prozent runter und zurück), je auf **zwei echten Böden** (Gruft-Stein und Gras), also 24 PNG plus Legende:
- **Tafel A "Feld":** 30 Gegner deterministisch gestreut, Y-sortiert, mit Weichschatten. Das ist die Spielsituation.
- **Tafel B "Knäuel":** 20 Gegner in vier Reihen mit 9 px X-Abstand, also erzwungener Überlapp. Das ist der Härtefall.
- **Tafel C "Leiter":** je ein Exemplar aller sechs Typen plus Held nebeneinander, fußbündig, zum Ablesen von Größen- und Wertleiter.
- **Tafel D "Schlachtfeld":** 30 Decals plus 10 lebende Gegner, zum Prüfen der Bodenbedeckung.
Zusätzlich je Tafel ein Schalter: **mit/ohne Rim**, **mit/ohne Flash**, **Farbe/Graustufe**.

### 5.2 Messgrößen des Bogens (alle am Prototyp bereits gerechnet)

| Messgröße | Definition | IST (Prototyp) | ZIEL |
|---|---|---|---|
| Schwarz-Sprenkel-Anteil | Schwarze Texel / alle Gegnertexel der Szene | **37,6 %** (1 889 / 5 027) | <= 25 % |
| Überlapp-Rate | Anteil Gegner, die mindestens 1 Texel mit einem anderen teilen | 50 % bei 30 Gegnern | Kennzahl, kein Gate |
| Trenn-Rate im Überlapp | Grenzkanten mit Rim-Texel oder Wertsprung >= 25 L | 0 % (kein Gegner hat einen tauglichen Rim) | >= 80 % |
| Trennbarkeits-Rate im Squint | Von N Gegnern im Squint-Bild benennbar (Juror, Farbe UND Graustufe) | **2 von 5 Typen** (nur Grufthund und Warden) | >= 5 von 6 bei 1x, 6 von 6 bei 6x |
| Wert-Staffelung | Körper-L je Typ, Abstand zur Nachbarstufe | Skelett 193,7 bricht aus, b geteilt | 3 Stufen, >= 15 L Abstand |
| Decal-Bodenbedeckung | Decal-Texel / Bildfläche nach 30 Toden | nicht messbar (Decals existieren nicht) | <= 12 %, kein Decal > 6 Zeilen |
| Flächenanteil der Horde | Gegnertexel / Bildfläche | 8,2 % bei 30 Gegnern | Kennzahl für Perf-Abschätzung |

### 5.3 Was der Prototyp heute schon beweist (angeschaut bei 4x und im Squint)
- **`horde_gruft_4x.png`:** Skelett und Rostpanzer lesen als **dieselbe Figur**, unterschieden nur durch einen orangen Helm. Der Ghul ist eine olivgrüne Variante desselben Kopfes. Drei von fünf Typen tragen oben dieselbe helle Masse.
- **`horde_gruft_squint.png`:** im Squint bleiben **nur zwei** Typen benennbar: der Grufthund (waagerecht, dunkel) und der Warden (Größe plus türkise Glut). Skelett, Ghul und Rostpanzer sind ein gemeinsames blasses Feld.
- **`horde_gras_4x.png`:** auf Gras verschwindet der Grufthund fast vollständig (dL +30,7, aber dE00 nur 19,1 und dieselbe warme Erdfamilie wie der Boden), während das Skelett das Bild erschlägt. Beide Fehler in einem Bild.
- **`knaeuel_ohnerim_4x.png` / `_squint.png`:** fünf Skelette mit 9 px Abstand verschmelzen zu **einer Knochenwand**, obwohl jede Figur einen lückenlosen schwarzen Umriss hat. Das ist der Beweis, dass der Umriss allein im Gedränge nicht trennt und dass H3 (Wert-Staffelung) und H6 (Rim) die eigentlichen Horden-Techniken sind.
- **`horde_gruft_flash_4x.png`:** Vollflächen-Flash inklusive Umriss lässt überlappende Gegner verschmelzen. Beleg für 4.1.

---

## 6. PASS-SCHNITT CH-2

### 6.1 Umfang in Grids (grob)

| Block | Grids | Flips | Bemerkung |
|---|---|---|---|
| Skelett | 4 (2 Walk, 1 Fall-Frame, 1 Decal) | 4 | `skeleton_die` = Fall-Stufe, Name bindend |
| Grufthund | 8 (6 vorhandene nachgezogen, 1 Fall, 1 neues flaches Decal) | 8 | `hound_die` wird Fall-Pose |
| Rostpanzer | 7 (2 Walk auf 20x18, 1 Fall, 1 Decal, 3 Schild-Overlays) | 7 | Schild gehört ihm (E9 deklariert) |
| Ghul | 4 | 4 | bestes Decal des Casts bleibt |
| Grabwächter | 4 bis 9 (nachziehen) | 0 (existieren) | nur Rim, Kante, Sekundärbewegung |
| Fußvolk (neu) | 5 | 5 | ohne Registrierung, ohne Spawn |
| **Summe** | **32 bis 37** | **28** | plus ~740 Quelltextzeilen |

Werkzeugarbeit zusätzlich: `tools/horden_bogen.mjs` (neu, Prototyp liegt vor), `figuren_messung.mjs` um die Gegner-Roster erweitert (`figurenVon()` Zeile 287 und `wirkortKlassen()` Zeile 590 sind die beiden Stellen; die Bodenklassen-Bänder liegen bereits vor).
Engine-Arbeit: Flash-Maske (rund 15 Zeilen), zweistufiges Sterben plus Decal-Liste, Schatten-Bake je Größenklasse (optional, 1 `drawImage` statt 4 `fillRect`, bei 40 Gegnern 160 auf 40).

### 6.2 Palettenbilanz (Vorentscheid, blockierend wie E3 es für CH-1 war)
- Stand heute: **78 Töne** (61 alnum, 17 Symbole). Die 14 in E3 sanktionierten Symbole aus dem "bewiesen kollisionsfreien Satz" `! % & ( ) : ; ? @ [ ] ^ _ |` sind **vollständig verbraucht**.
- **Zwei Töne sind im ganzen Projekt unbenutzt (0 Texel in Figuren UND Kacheln):** `x` #e0524c (L 124, h 31, C 64, warmes Rot) und `f` #8a92a0 (L 145, h 270, C 8, kaltes Grauviolett). Beide sofort verfügbar, ohne Sanktion.
- 19 Töne tragen heute keine Figur, sind aber semantisch an Kacheln gebunden (Gras e/E/a/m/K/A, Wasser w/W/9/=, Laub 0/+/*, Erde M, Feuer o, 1). Für Gegner nur mit Sperrlisten-Prüfung brauchbar: die Grasrampe ist für alle GRAVEYARD-Gegner gesperrt, die Wasserrampe für alle FLÜSTERGRUFT-Gegner.
- **Restbudget an Symbolschlüsseln:** 15 ASCII-Symbole stehen nicht in der Palette (`" # $ ' , - . / < > \ \` { } ~`). Davon scheiden `.` (Transparenz-Marker) und `'`/`\` (Zeichenketten-Escaping in den Grid-Literalen) aus. Bleiben **rund 11 Kandidaten**, die aber einen **neuen Kollisionsnachweis brauchen** (das Gegenstück zu m3 aus CH-1).
- **Geschätzter Bedarf CH-2:** Skelett-Knochenrampe eigen 3 bis 4, Ghul-Lumpen 3, Grufthund-Kaltrampe 3 bis 4 (davon 1 durch `f` gedeckt), Fußvolk 3. **Summe 11 bis 13 neue Töne**, davon 2 aus dem Bestand. Netto **9 bis 11 neue Symbolschlüssel**. Das passt knapp in das Restbudget und braucht dieselben E3-Auflagen (dE00 >= 10 zu allen Bestandstönen, >= 8 innerhalb einer Rampe, >= 12 zwischen neuen Rampen, C*ab < 30,5) plus die Sanktion von `check_gfx6_art.mjs:74-79` (Symbol-Deckel 17 auf 26 bis 28) und `check_gp6_art_self.mjs` (erwartete Rot-Zahl).
- **Alternative, falls der Vorentscheid gegen eine Erweiterung fällt:** das Skelett behält O/B/b/N und wird nur über Verteilung, Silhouette, Rim und Umriss verbessert. Dann bleibt der geteilte Leitton `b` mit Rostpanzer und Warden bestehen, und die Kopf-Schulter-Trennung muss **allein** die Arbeit machen. Das ist machbar, aber die Messung sagt: es ist der schwerere Weg.

### 6.3 Fünf harte technische Fesseln (alle nachgeprüft)
1. **`skeleton_die`, `ghoul_die`, `hound_die`, `rust_die` behalten ihre Namen und ihre Position.** Zwei Gründe: (a) `tools/smoke_test.mjs:5669` erkennt den Kill-Frame der Hitstop-Uhr über `b.zaehle(/skeleton_die|ghoul_die/)`; wandert die Sterbe-Grafik hinter eine neue Stufe-1-Pose, fällt der Kill-Draw aus dem Angriffslauf (BASIS 12 bis 24 Frames) heraus und `S5-§7A(h) A3` wird rot. (b) Die vier `*_die`-Keys stehen in `main.js:106-127` auf den Flip-Indizes 8, 11, 17 und 20, also **innerhalb der eingefrorenen ersten 22**. Deshalb: `*_die` = **Stufe 1** (Zusammensacken), das Decal bekommt einen **neuen** Namen (`*_rest`) und wird angehängt.
2. **Neue SPRITES-Keys nur anhängen.** `Object.keys(SPRITES)` wird von `check_main_slice1` und `check_inventory_slice2` live gelesen, Anhängen ist folgenlos. Neue Flip-Einträge **nur nach `npc_torwaechter_talk`** (aktuell Index 36).
3. **AABB nicht anfassen.** `smoke_test.mjs:3338-3340` koppelt Sprite und AABB im M5-Schattengate (Skelett 12x14, Ghul 14x14, Grufthund 14x12, Rostpanzer 14x16, Boss 20x24, Schwelle >= 8 Texel). Der Sprite darf wachsen (Rostpanzer 16x18 auf 20x18), die AABB nicht. Achtung auf die BIG-Schwelle `ent.w >= 18 && ent.h >= 20` (`main.js:2559`): sie hängt an der AABB, nicht am Sprite, bleibt also bei 14x16 unberührt.
4. **Die Knochenrampe O/B/b/N ist CH-1-gekoppelt.** Ein Hex-Shift dort ändert Brans Bart und Heddas Kopftuch. Siehe Warnung im Warden-Steckbrief.
5. **Der Grid-Wohlgeformtheits-Gate fehlt weiterhin.** `smoke_test.mjs:1766-1769` prüft Zeilenbreiten **nur für TILE_ART**. Bei 32 bis 37 neuen handgepflegten Gegner-Grids ist eine um ein Zeichen zu kurze Zeile fast sicher und fällt erst zur Laufzeit auf. Der additive Gate war schon für CH-1 empfohlen und ist nicht gebaut worden. **Vor Phase 1 nachziehen.**

### 6.4 Reihenfolge (größter Sprung zuerst)
1. **Skelett** (21 von 41 Spawns = 51 Prozent; dL +143,8; 85 Prozent der Figur auf 2 Tönen; Ton-Spiegelgleichheit 83,6). Größter Einzelsprung des Passes.
2. **Grufthund** (einziger Gegner, der beide Kontrastpfade gleichzeitig reißt: dL -10,4 **und** dE00 5,7 auf dem Weg; 26,6 Prozent Solitär; sein Decal ist das einzige, das die 25-Prozent-Grenze reißt).
3. **Rostpanzer** (32,7 Prozent Solitär, 44,9 Prozent Schwarz, 8 von 9 Tönen mit Menschen geteilt, Rahmenwechsel auf 20 breit löst zugleich die Ghul-Kollision).
4. **Ghul** (profitiert vom Rostpanzer-Umbau; braucht selbst nur die Lumpenrampe und den flip-neutralen Rim).
5. **Fußvolk** (billigste Figur, profitiert von allen vorher getroffenen Entscheidungen).
6. **Grabwächter nachziehen** (Rim, Kante, Sekundärbewegung; Eichkörper, nicht neu bauen).
7. **Flash-Umbau und zweistufiges Sterben** laufen parallel zur Kunst, weil sie keine Grids berühren. Der Flash gehört **vor** die Jury-Runde, weil er die Horde im Bogen sichtbar verändert.

### 6.5 Abnahme-Auftrag an Michael am Gerät
**Empfehlung: kein God-Mode-Spawn in CH-2.** Begründung: eine Spawn-Taste wäre der einzige Punkt des Passes, der `enemies.js` oder `main.js` in der Spiellogik anfasst, und sie ist nicht nötig, weil die Flüstergruft bereits **15 Gegner** trägt (5 Skelette, 3 Ghule, 2 Hunde, 1 Rostpanzer plus 4 Eliten) und die Katakomben 15. Das ist kein Diablo-Haufen, aber es reicht für die Frage, die CH-2 stellt.
**Geräteauftrag (Vorschlag, zwei Fragen, unter einer Minute):**
> *"Geh mit `?god=1` in die Flüstergruft und lass dich von allen gleichzeitig verfolgen. Erstens: kannst du auf einen Blick sagen, welche Sorte wo steht, ohne hinzuschauen? Zweitens: fühlt sich Draufhauen jetzt nach etwas an, oder flackert es nur?"*

Zusätzlich, ohne Gerät und ohne Code: **der Horden-Bogen als Bildbeleg**, Vorher gegen Nachher, damit Michael die 30-Gegner-Situation sieht, bevor Slice 7 sie baut. Der Vorher-Bogen muss **vor Phase 1 gerendert und nach `design/referenz/` versioniert** werden, wie P0.e es für CH-1 verlangt hat (dort war es die Bedingung, ohne die Phase 1 nicht startet).

### 6.6 Was ausdrücklich NICHT in CH-2 gehört
- **Balance:** kein HP-, Schaden-, Geschwindigkeits- oder Drop-Wert. `ANIM_RATE`, `DIE_TIME`, `HURT_FLASH` werden nur angefasst, soweit der Flash-Umbau es zwingend verlangt, und dann mit Beleg.
- **Tempo und Kampfgefühl:** Hitstop bleibt bei 2/3/4. Der Flash koppelt an diese Zahlen, er ändert sie nicht. Die Diablo-Direktive ("schneller, Horden, später Magie") ist CH-2 ausdrücklich **nicht**.
- **Spawn-Wellen, Gegnerzahlen, KI-Abstandshaltung.** Kein neuer `kind` wird registriert, keine Karte bekommt einen Gegner mehr oder weniger.
- **Perf-Umbau.** Der Schatten-Bake je Größenklasse ist als *optional* markiert; wenn er Zeit kostet, fällt er, ohne dass ein Messziel leidet. Der Tint-Masken-Cache (bis zu 7 Masken je Sprite, `main.js:198`) bleibt unangetastet, auch wenn die Doku dort falsch ist (Teil A, Befund 6.1).
- **Das Lichtsystem.** Der Diablo-Trick "entfernte Gegner kollabieren zu reinen Silhouetten" ist technisch möglich (`LIT_FLOOR_MAPS`, `frameLights`, `tintFor`) und ein echtes Alleinstellungsmerkmal, aber er ist **CH-4 (Licht auf den Figuren)**, nicht CH-2. In CH-2 gehört er in den Backlog, mit dem Hinweis, dass H3 (Wert-Staffelung) die Voraussetzung dafür ist.
- **Maßfrage.** 16 Breite bleibt tragend. Die einzige Ausnahme ist der Rostpanzer auf 20x18, und die ist engine-kostenfrei (Größenagnostik, Teil A 3.1) und AABB-neutral.

---

### Offene Entscheidungen, die vor Baubeginn bei Fable/Michael liegen
1. **G-O (dL-Band für Gegner):** Leitklassen-Lesart statt Extremwert-Lesart, sonst kollabiert die Wertleiter auf 12 L. Zahlen dafür liegen in 0.4 und H4.
2. **Palettenerweiterung um 9 bis 11 Symbolschlüssel** (oder der Verzicht mit den in 6.2 genannten Folgen). Braucht einen neuen Kollisionsnachweis.
3. **Knochenrampe:** eigene neue Rampe fürs Skelett, oder Hue-Shift der Bestandsrampe mit deklarierter CH-1-Wiedereröffnung.
4. **Rost-Exklusivität:** E6 sagt "Rost exklusiv Torwächter", der Rostpanzer trägt sie seit Slice 2. Vorschlag: ortsgetrennte Exklusivität deklarieren.
5. **Fußvolk ohne Registrierung** (meine Empfehlung) gegen Fußvolk mit `CREATORS`-Eintrag aber ohne Spawn.

Sources: [Darktide 101: Enemy Character Art](https://www.playdarktide.com/news/darktide-101-enemy-character-art), [AndroidArts Diablo-Analyse](https://androidarts.com/diablo/diablo.htm), [Dead Cells Art Design Deep Dive](https://www.gamedeveloper.com/production/art-design-deep-dive-giving-back-colors-to-cryptic-worlds-in-i-dead-cells-i-), [7 Game Feel Tricks](https://dawnosaur.substack.com/p/7-game-feel-tricks-to-improve-your), [Vampire Survivors Lesbarkeitskritik](https://steamcommunity.com/app/1794680/discussions/0/4631482569784862581/)
