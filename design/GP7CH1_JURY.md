# GP7-CH-1 Jury-Protokoll (Versuch 2, 22.08.-10.09.2026)

Held: Bild-Juror 6,0 -> 7,9 -> 8,4 (FREIGEGEBEN als Stil-Anker, 22.08.).
Cast: Bild-Juror 10.09. — NPC-Median 5,5 -> 7,3; Squint-Test bei 1x: alle sechs benennbar.
Verdikt: Torwaechter FREIGEBEN; Bran/Hedda/Corm/Mile je EINE Runde (Rezepte unten, bindend).



# ===== CAST-JUROR 10.09.2026 (alle sechs Menschen) =====

# CAST-JUROR GP7-CH-1 Versuch 2, kompletter Menschen-Cast

## 0. VORBEMERKUNG: Der NACHHER-Bogen war beim Start falsch

`/home/coder/Grimlight/.tmp/screenshots/figuren_bogen_nachher_*.png` war zu Beginn aus `sprites_figuren.js` **d1774317** gerendert, also aus dem Held-only-Stand vom 22.08. Der committete NPC-Stand (adc8c0a) ist **aee65951**. Wer die NPCs gegen diese Dateien beurteilt hat, hat die alten NPCs gesehen. Ich habe deshalb mit `node tools/figuren_bogen.mjs --modus nachher --out <scratchpad>` neu gerendert und **gegen den echten Commit-Stand geurteilt**. (Der Projektordner ist inzwischen ebenfalls neu erzeugt worden und stimmt jetzt; Hashes decken sich mit meinem Lauf.)

Zweiter Aktenbefund: `mess_final.out` misst sha **b4a0cee2**, committet ist **aee65951**. Nach der letzten Zeichner-Änderung wurde nicht neu gemessen. Ich habe die Kernzahlen selbst gegen den Commit-Stand nachgerechnet; das Bild ändert sich nicht.

---

## 1. NOTEN

| Figur | VORHER | NACHHER | Δ |
|---|---|---|---|
| Bran | 5,5 | **7,3** | +1,8 |
| Hedda | 5,5 | **7,2** | +1,7 |
| Corm | 5,5 | **7,0** | +1,5 |
| Mile | 5,0 | **7,4** | +2,4 |
| Torwächter | 6,0 | **7,8** | +1,8 |
| Held (Referenz, unverändert) | 6,0 | 8,4 | |

**CAST-NOTE NPCs (Median) 5,5 → 7,3.** Median über alle sechs inkl. Held: **7,35**.

Einordnung: Bestandswelt 7,5, SoM 8,5 bis 9. Der Cast liegt jetzt knapp unter der eigenen Welt und deutlich über dem Stand, den Michael am 16.08. zurückgewiesen hat. Er ist **noch nicht auf Held-Niveau**, und der Abstand ist fast vollständig ein Ton- und Stimmungsabstand, kein Form-Abstand.

---

## 2. JE FIGUR: Mensch? Steckbrief? Anker-Regeln?

### BRAN (7,3)
**Mensch bei 1x/6x:** Ja, beides. Im Graustufen-Squint bleibt "breiter alter Mann mit Hammer an der Schulter" stehen.
**Steckbrief Punkt für Punkt:** breiteste Silhouette des Casts ja (296 opake Texel, größte Masse) | schiefe Schulterlinie, Hammerarm oben ja | Kopf ohne Hals zwischen den Schultern versenkt ja | Hammer als Requisit ja, liest schon im Squint als grauer Block | nackte Arme mit hohem Hautanteil ja (197 Texel Haut) | Bart als eigener Wertblock **ja, aber auf der falschen Rampe** (O/B/b = Leinen/Knochen, dieselben Töne wie Heddas Kopftuch und die Skelettrampe) | **Holzrampe verlassen ja**, aber das neue Leder (`:` #795a57 / `;` #a77769 / `?` #b0988c, h 42 Grad, C 23) liest **rosé, nicht versengtes Leder**.
**Anker:** Sel-Out bis zu den Stiefeln ja (Zeilen 22/23 `jjjjk` / `jqqqk`, kein schwarzer Ring) | Rim `_` 12,3 Prozent auf der Kontur, warm auf warmem Stoff, korrekt | Sekundärbewegung auf der Silhouette ja (Idle-Diff auf 15 Zeilen verteilt, **0 Prozent starre Ganzkörperverschiebung**, gemessen: die Verschiebungshypothese ist schlechter als der Rohdiff) | Talk echt: 16,7 Prozent Texel-Diff mit 14 Texeln Silhouettenänderung.

### HEDDA (7,2)
**Mensch bei 1x/6x:** Ja.
**Steckbrief:** Kegel-Silhouette, einzige die sich nach unten öffnet, ja | Stock **diagonal durch die Silhouette** statt Zaunpfahl am Rand ja, klar erfüllt | Schultertuch ja | eigene Kleiderrampe mit mehr als einer Stufe ja (`!` L64 / `G` L98 / `%` L134, wobei `!` überwiegend Schattenkante ist, in der Fläche also eher 2 Stufen) | **krummer Rücken, Kopf nach vorn geschoben: nur schwach**, der Kopf sitzt 1 px links der Körperachse, aber nicht tief in den Schultern.
**Anker:** Sel-Out bis zu den Schuhen ja | Rim `_` 14,3 Prozent | Talk 12,8 Prozent mit 14 Texeln Silhouettenänderung | Idle 4,8 Prozent Silhouettendiff, 0 starre Verschiebung, aber nur auf 3 Zeilenregionen und am unteren Rand des T9-Bandes.
**Mangel:** Kleid liest pastellrosa. Zusätzlich sitzt ihre hellste Masse (`b` #d6cbb1, L 203) am Kopf und ist das **hellste Texel jedes Dorfbewohners überhaupt**, auf der Skelettrampe.

### CORM (7,0)
**Mensch bei 1x/6x:** Ja, und zwar getragen von Gesicht plus Buch. Die Kutte allein wäre ein Kegel; Brauenband, zwei Augen, weißer Bart und das vorgehaltene Buch machen ihn zur Person. Das ist stabil, aber es ist eine schmale Basis.
**Steckbrief:** hoch und schmalschultrig ja | spitze Kapuze ja | Buch nach vorn, bricht die Brustlinie ja | Krapp-Stola als einziger Akzent ja | Steinrampe verlassen ja | **eine Schulter fallengelassen: nein**, die Schulterlinie (Zeilen 9 bis 11) ist praktisch waagerecht | **"dunkle Wolle": nein**, das ist der Kernmangel.
**Anker:** Sel-Out ja, Unterkante materialtonig (`&`/`n`, kein schwarzer Abschluss) | Rim `|` 13,3 Prozent, kalt auf kaltem Stoff, damit regelkonform | Talk 14,1 Prozent | Idle 4,6 Prozent, 0 starre Verschiebung, aber nur 2 bis 3 Regionen.

### MILE (7,4)
**Mensch bei 1x/6x:** Ja, und als **Kind** sofort erkennbar. Die stärkste Einzelverbesserung des Casts: der graue Teller von vorher (las als Schild oder Spiegel) ist jetzt eine Tasche mit Gurt, und eine Hand liegt darauf.
**Steckbrief:** übergroßer Kopf ja | schmale Schultern ja | Hand an der Tasche ja | Tasche fest auf einer Hüfte ja | Kittel eigene Familie ja (Stahlblau `@`/`[`/`]`, **31,7 Grad Hue-Spanne, der beste Hue-Shift des ganzen Casts**) | Leinen/Knochenrampe verlassen ja | Charakter-Tick vorhanden ja.
**Anker:** Sel-Out bis zu den Schuhen ja | Rim: `_` Haarkuppel plus `]`, aber nur **8,1 Prozent auf der Kontur** (das Gate passiert nur über die E5-Lesart mit dem 1-innen-Ring, 14,5) | Talk 13,0 Prozent | Idle **17,7 Prozent**, damit deutlich über dem T9-Band 4 bis 10.
**Zusatzbefund:** bbox `[1..12]` in einem 16 breiten Grid. `drawNpc` zentriert über die Bildbreite, `drawSoftShadow` und die Blase hängen an Hitbox beziehungsweise Grid. Mile steht damit rund 1,5 px links neben seinem eigenen Schatten, am Gerät 9 physische Pixel.

### TORWÄCHTER (7,8) — beste Arbeit der Runde
**Mensch bei 1x/6x:** Ja, sofort, auf allen drei Böden.
**Steckbrief:** Speer bricht die Rahmenoberkante ja (Zeilen 0/1, Spalte 15), geneigt statt senkrecht ja | Speer als einzige Vertikale des Casts ja | Rost 4/5/6 exklusiv ja | **kalte Stahlhaube C/i** ja, und sie ist der Ankerpunkt des Kopfes | Gewichtsverlagerung im Idle ja.
**Anker:** Sel-Out bis zu den Stiefeln ja | Rim `I`/`|` 11,7 auf Kontur / 12,6 nach E5 | Talk 9,6 Prozent mit 19 Texeln Silhouettenänderung, die größte Silhouettenbewegung aller fünf Talk-Frames | Idle 7,2 Prozent, 0 starre Verschiebung, **aber nur 2 Regionen** (Zeile 10 plus Beine 18 bis 23), T9 will 3.
**Einziger Zahl-Ausreißer:** geometrischer Umriss 41,4 Prozent. Das ist ein Werkzeugartefakt: der 1 px Speerschaft über 22 Zeilen zählt vollständig als Kontur. Kunstseitig ist sein Schwarzanteil 12,5 Prozent, der zweitbeste Wert des Casts.

---

## 3. UNTERSCHEIDBARKEIT im SQUINT bei 1x

**Ja, ich kann alle sechs benennen** (Farbe und Graustufe getestet):

1 dunkelviolett, schmal, Beine sichtbar = **Held**
2 breite helle Masse, dunkler Block links oben = **Bran** (Hammerkopf)
3 helle Kopfkappe, Kegelrock, dünne Diagonale = **Hedda** (Stock)
4 dunkle Spitze über hellem Gesicht, bodenlanger Kegel, heller Block rechts = **Corm** (Buch)
5 klein und niedrig, eine Größenstufe darunter = **Mile**
6 helle Senkrechte bricht oben aus dem Rahmen = **Torwächter** (Speer)

Zum Vergleich: im VORHER-Squint sind Bran, Hedda, Corm und Torwächter **vier identische Briefkästen**, unterschieden nur durch die Rumpffarbe. Das ist der große sichtbare Sprung, den CH-1 versprochen hat, und er ist eingelöst.

**Die zwei nächsten: BRAN und HEDDA.** In beiden Squint-Varianten. Ursache mechanisch benennbar, nicht Geschmack:
- gleiche Kopfmasse auf **derselben Rampe** (O/B/b: Brans Bart, Heddas Kopftuch),
- benachbarte Kleidfamilien (Bran h 42 Grad C 23, Hedda h 353 Grad C 18; rund 50 Grad auseinander, beide chromaarm),
- fast gleiche Körperhelligkeit (120,0 gegen 120,4),
- Profilähnlichkeit 75,2, damit über dem 70er-Ziel für typübergreifende Paare.

Es trägt trotzdem, weil Bran breiter ist und den Hammer hat. Aber es trägt knapp.

---

## 4. DIE VIER PRÜFFRAGEN

### (a) Corm hell-petrol, Hedda blasses Rosa: eine Iteration dunkler?

**Der Zeichner hat bei Corm recht, und ich habe es nachgerechnet.** Corms Kutte über den dE00-Pfad abgedunkelt, Hue und Chroma konstant:

| ΔL* | Rampe & ( ) als L | dE00 zu path | dE00 zu Lehm |
|---|---|---|---|
| 0 (IST) | 98 / 123 / 146 | 31,1 | 34,3 |
| −15 | 64 / 83 / 108 | **26,7** | **27,3** |
| −20 | 56 / 70 / 95 | **26,6** | **26,2** |
| −30 | 40 / 49 / 70 | 27,2 | 24,9 |

Der dE00-Ersatzpfad aus E1 (Schwelle 25) hält bis etwa ΔL* −25 auf beiden Böden. Corm ist **nicht** durch das Helligkeitsfenster gebunden; das Fenster hat ihn nur zufällig dorthin geschoben, weil das Werkzeug den dL-Pfad zuerst prüft. **URTEIL: Iteration ja, ΔL* −15 bis −18. Zwingend.** Auf Gras ist er heute ein leuchtender Minzturm, in Gramfeld das hellste und einzige kalte Element. Das ist der eine Punkt, an dem dieser Cast die Diablo-Direktive verfehlt.

**Bei Hedda ist die Antwort nein, und die Zahlen sind eindeutig gegen den Zeichner.** Hedda steht in `map_dorf.js:301` auf `'='`, also auf **Weg** (Untergrenze 116,7 L). Sie liegt bei 120,4, hat also 3,7 L Luft. Ihr dE00 zum Weg erreicht selbst abgedunkelt **nie 25** (gemessen 21,0 bis 23,2 über den ganzen Bereich). Jede Abdunklung reißt beide E1-Pfade gleichzeitig:

| ΔL* | Körper-L | dL zum Weg | dE00 zum Weg |
|---|---|---|---|
| 0 | 112,4 (Kleid) | 21,5 | 22,1 |
| −8 | 92,5 | 1,6 | 21,0 |
| −15 | 75,8 | −15,1 | 21,7 |

**URTEIL: keine Abdunklung.** Der wirksame und E1-freie Hebel bei Hedda ist **Sättigung statt Helligkeit**: `%` von C 18 auf C 26 bis 28 bei konstantem L*. Das nimmt das Pastellige weg, ohne Körper-L anzufassen, und bleibt unter der E3-Auflage C\*ab < 30,5. Falls Michael sie trotzdem dunkel will, ist das **kein Kunstauftrag, sondern eine Ein-Zeichen-Kartenänderung** (Hedda von `'='` auf `'.'`, Untergrenze fällt von 117 auf 100). Das ist eine Fable-Entscheidung, keine Zeichner-Entscheidung.

**Nachtrag, den der Zeichner nicht gemeldet hat:** Brans Leder ist dasselbe Problem in Grün. dL 33,2 zum Weg, dE00 nur 17,1, also lebt er vom dL und darf ebenfalls nicht dunkler. Aber er darf **wärmer und satter**: h 42 → 60 bis 70 Grad, C +8 bis +12, L\* konstant. dL bleibt bei 31 bis 32, E1 unberührt. Das behebt gleichzeitig den Rosa-Eindruck und den Bran/Hedda-Abstand.

### (b) Torwächter Körper-L 102: trennt er sich auf dem Weg?

**Ja, und die Frage ist teilweise gegenstandslos.** Er steht in `map_dorf.js:304` auf `'.'`, also auf **DORF-Lehm**, nicht auf dem Weg. Dort misst er dL 26,7 bis 32,5 und dE00 16,2 bis 26,3, beide Pfade grün.

Auf dem Weg (Bogen `..._weg_*`, Zeichner-Crop `B_FINAL_crop_weg_12x.png`) trennt er sich am Bild ebenfalls klar. Träger sind nicht die Helligkeit, sondern drei andere Dinge: **Chroma 31,9**, der mit Abstand höchste Wert des Casts gegen einen Weg mit C 16; die geschlossene dunkle Kante; und die kalte Stahlhaube plus Speerspitze als Gegenpol oben. Der Fortschritt gegen Vorher (dL −5,6, also dunkler als sein Boden, "Grufthund-Skandal" in klein) auf jetzt +11 ist sichtbar. **G-J trägt am Bild. Keine Runde nötig.**

### (c) Profilähnlichkeit Held/Bran/Torwächter 83 bis 87: im Squint unterscheidbar?

**Ja, alle drei, in Farbe und in Graustufe.** Träger sind genau die drei Merkmale, die G-K als Nicht-Profil-Differenzierer zulässt:
- **Requisit bricht den Rahmen:** Speer nach oben (Torwächter), Hammerkopf seitlich an der Schulter (Bran), Klinge am Körper (Held). Alle drei bleiben im halbierten Bild sichtbar.
- **Kopf-Schulter-Verhältnis:** Bran breiteste Schulterlinie ohne Hals; Torwächter Haube plus Kragen, kompakter Kopf; Held schmale Kapuze über breiteren Schultern.
- **Wert:** Held 76 L, Torwächter 106, Bran 120. Auch entfärbt ist das eine klare Dreier-Staffelung.

Zwei Anmerkungen fürs Protokoll: **Corm/Torwächter 90,27** verfehlt auch die entspannte Männer-Schwelle 90, wenn auch um 0,27; der Nicht-Profil-Differenzierer (Buch gegen Speer, Petrol gegen Rost) ist unstrittig da. Und G-K deckt die **Hedda-Paare nicht ab**: Held/Hedda 82,6, Hedda/Torwächter 79,2, Hedda/Corm 77,9, Bran/Hedda 75,2 stehen formal weiter über dem 70er-Ziel. Die Augenprobe trägt sie; der billigste Hebel darauf steht unten in ihrer Runde.

### (d) Mile: Kopf beginnt in Zeile 3, Blase 4 px über dem Haar. Stört das?

**Nein. Keine Runde deswegen.** Gerendert (`npc_blase` über allen sechs, `npcs.js:217-227`): die Blase hängt an der Grid-Oberkante, nicht an der Pixel-Oberkante, also stehen **alle Blasen im Dorf auf derselben Höhe**. Über Mile ist der Abstand größer, aber eine Sprechblase, die schwebt, ist eine Sprechblase, die schwebt; und die einheitliche Höhe hilft beim Absuchen des Dorfes. Gemessen ist es übrigens Zeile 3, nicht 4, der Abstand also 4 px inkl. der 1 px Grundlücke, wie G-L es beschreibt.

**Was bei Mile stattdessen stört**, und was in der Meldung fehlt, ist der bbox-Versatz `[1..12]`: er steht neben seinem eigenen Schatten.

---

## 5. TOP-BEFUNDE, je Figur GENAU EINE Runde

### BRAN (2 Eingriffe, ein Durchgang)
1. **Leder-Rampe `:` `;` `?`, Zeilen 15 bis 21 (Schurz):** Hue 42 → 60 bis 70 Grad, Chroma +8 bis +12, **L\* konstant**. Richtwerte `#815848` / `#a97755` / `#b4987b` oder wärmer. Wirkung: aus Rosa wird Leder, und der Abstand zu Heddas Krapp (h 353) verdoppelt sich. Gemessen: dL zum Weg bleibt 31 bis 32, E1 unberührt.
2. **Bart von der Knochenrampe holen, Zeilen 7 bis 11, Spalten 4 bis 12:** `O`/`B`/`b` durch zwei warmgraue Eigenstufen ersetzen und die hellste (`b`, L 203, 5 Texel) streichen. Wirkung: löst gleichzeitig die Doppelung mit Heddas Kopftuch und mit der Skelettrampe und setzt den Kopf auf die Schultern.

### HEDDA (3 kleine Eingriffe, ein Durchgang)
1. **Kleid-Leitton `%` (#a07887), Zeilen 12 bis 23:** Chroma 18 → 26 bis 28 bei **konstantem L\***. Aus blassem Rosa wird staubiges Krapprot. E1 bleibt unberührt, E3-Deckel C\*ab < 30,5 bleibt gehalten.
2. **Kopftuch-Spitzlicht `b` (#d6cbb1, L 203), Zeilen 1 bis 2:** raus, ersetzen durch ein warmgraues Leinen bei L 150 bis 160. Das ist das hellste Texel jedes Dorfbewohners und es sitzt auf der Skelettrampe.
3. **Kopf 1 px tiefer in die Schultern (Zeilen 3 bis 7 nach unten, Schulterzeilen 8 bis 11 nach oben):** erfüllt den offenen Steckbriefpunkt "krummer Rücken, Kopf nach vorn" und ist zugleich der billigste Hebel auf Bran/Hedda 75,2 und Held/Hedda 82,6.

### CORM (2 Eingriffe, ein Durchgang) — die wichtigste Runde des Casts
1. **Kutte-Rampe `&` `(` `)` um ΔL\* −15 bis −18 absenken**, Hue und Chroma unverändert. Richtwerte bei −15: `&` `#005b60`, `(` `#216a64`, `)` `#4b7c6e`. Nachgerechnet: dE00 bleibt 26,7 zum Weg und 27,3 zum Lehm, also über der E1-Ersatzschwelle 25 auf beiden Böden. Der Palettenrechner muss die neuen Hexwerte gegen die E3-Auflagen (dE00 ≥ 10 zu allen Bestandstönen, ≥ 12 zu u/U/X/Z) nachprüfen; die Hue-Lage 173 bis 201 Grad gegen das Violett des Helden bei 308 Grad macht das unkritisch.
2. **Rim `|` (#abdcda, L 205) auf 2 bis 3 Texel an der Kapuzenkuppel begrenzen**, Zeilen 0 bis 4; die untere Lichtkante (Zeilen 10 bis 14) auf `)` zurücknehmen. Bei dunkler Kutte wird der heutige Rim sonst zur Leuchtröhre; Anker-Regel 7 sagt "Dosis klein".
3. Wenn im selben Durchgang noch Platz ist: **eine Schulter 1 px fallen lassen, Zeilen 9 bis 11.** Offener Steckbriefpunkt und der einzige Hebel auf Corm/Torwächter 90,27.

### MILE (3 kleine Eingriffe, ein Durchgang)
1. **Idle-Tick beschneiden:** der Kopf wandert heute über die Zeilen 3 bis 11 um 1 px seitwärts, das ergibt 17,7 Prozent Silhouettendiff statt der 4 bis 10 aus T9. Den Versatz auf die Zeilen 3 bis 7 (Haarkappe) begrenzen, Kinn stehen lassen, dafür 1 px Fersenwippen in den Zeilen 21 bis 23. Ziel etwa 8 Prozent auf 3 Regionen.
2. **Figur 1 px nach rechts, bbox `[1..12]` → `[2..13]`:** setzt ihn wieder über seinen eigenen Weichschatten und unter seine Blase.
3. **Rim echt auf die Kontur:** 3 bis 4 Texel `]`/`_` auf die linke Kittelkante, Zeilen 15 bis 19. Heute 8,1 Prozent auf Kontur, das Gate hält nur über die 1-innen-Lesart.

### TORWÄCHTER
**Keine Runde nötig.** Falls trotzdem eine gefahren wird, kostet der T9-Regionen-Punkt vier Texel: 1 px Speerspitzen-Tippen in den Zeilen 0 bis 2 und 1 px Helmnicken, damit der Idle Kopf, Schaft und Beine trägt statt nur die Beine.

### Prozess, nicht Kunst (an Fable, blockiert keine Figur)
- **Material-Tabellen sind nicht zusammengeführt.** `mess_final.out` rechnet mit `material_B.json` und meldet TABELLENFEHLER für Bran (11 nicht zugeordnete Töne, darunter `;` mit 148 und `:` mit 102 Texeln), Hedda (7) und Corm (6). E5 macht die Tabelle zur Deliverable-Pflicht, und Solitär-, Rim- und Rampen-Gates lesen aus ihr. Die grünen Zahlen für A's drei Figuren sind formal unbelegt. `material_A.json` existiert und muss eingemischt werden.
- **G-L ist offen:** `rampeVon` kennt die 14 neuen Töne nicht ("dominante Rampe Holz" für Mile, "unbekannt:(" für Corm).
- **Nach der letzten Zeichner-Änderung wurde nicht neu gemessen** (gemessen b4a0cee2, committet aee65951).

---

## 6. VERDIKT

| Figur | Verdikt |
|---|---|
| **Bran** | **EINE Runde** (Leder-Hue und Chroma, Bart von der Knochenrampe) |
| **Hedda** | **EINE Runde** (Chroma hoch statt L runter, Leinen-Spitzlicht raus, Kopf 1 px in die Schultern) |
| **Corm** | **EINE Runde, zwingend** (Kutte ΔL\* −15 bis −18, Rim eindampfen) |
| **Mile** | **EINE Runde** (Idle-Tick beschneiden, 1 px nach rechts, Rim auf die Kontur) |
| **Torwächter** | **FREIGEBEN** |

**Beantwortet dieser Cast auf Michaels Handy die Frage "viel besser?" mit Ja?**

Formseitig ja, klar und ohne Einschränkung: sechs Figuren, die man aus der Entfernung auseinanderhält, mit Hammer, Stock, Buch, Tasche und Speer statt sechs Briefkästen, und die Abnahmefrage "Erkennst du, wer wer ist?" ist bestanden. Stimmungsseitig noch nicht ganz: vier von fünf Dorfbewohnern stehen bei L 113 bis 120, der Held bei 76, und Corm leuchtet mintfarben aus einem Diablo-Dorf heraus. Michaels stehender Einwand seit 16.08. lautet "sieht auch nicht gut aus" und zielt genau auf so etwas. **Mit der Corm-Abdunklung und Brans Leder-Drehung erwarte ich ein Ja; ohne sie erwarte ich "besser, aber immer noch zu bunt".**


# ===== BILD-JUROR HELD 22.08.2026 (Versuch 2 + Nachpruefung) =====

Alle sechs Bilder gesichtet, Grids gelesen, `gates.mjs` selbst laufen lassen, Metriken unabhängig nachgerechnet.

---

## 1. Punkt für Punkt

**Punkt 1 — Seitengesicht: BEHOBEN** (6 von 7 Teilschritten). `player_side_0` Zeilen 4-8 jetzt: Auge `k` auf Spalte 11 (vorher 10), genau ein Hauttexel (Sp. 12) bis zur Vorderkante, Nase auf Zeile 6 einen Texel weiter raus (Front Sp. 13, `k` auf 14), Kinnstufe Zeile 7 zurück auf Sp. 12, Kapuzenschatten `n` auf Sp. 9 statt des `2`-Ausblutens. Rückenkante entzackt: drei monotone Stufen (Sp. 2 → 1 → 0) statt Zickzack. Beleg `kopf_lupe.png` untere Reihe Bilder 1-3 — aus dem Fleck ist ein Profil geworden. **Offen: der Mundschatten.** Zeile 7 ist `222`, ein gleichförmiges Feld; das eine `n` auf Sp. 12 fehlt.

**Punkt 2 — Lichtkippen: BEHOBEN, messbar.** `flipprobe.png`: der Rim liegt in beiden Reihen als Kappe OBEN auf der Kapuze, keine senkrechte Lichtkante kippt. Nachgerechnet als Links/Rechts-Luminanzdifferenz der Körpertexel:

| Frame | dL links−rechts |
|---|---|
| side_0 / _1 / _2 / _3 | +3,8 / +4,2 / +3,9 / +5,2 |
| attack_side | +2,6 |
| down_0 (wird nie gespiegelt) | **+21,4** |

Die Seitenframes sind auf ±5 L lichtsymmetrisch, eine Rampenstufe misst 25-30 L. Das Spiegeln verschiebt das Licht um weniger als ein Viertel einer Stufe. Restbefund ohne Wirkung: eine `X`-Spalte (Sp. 3 Z. 2-8, Sp. 2 Z. 9-13) ist noch eine senkrechte Lichtlinie, aber sie steckt in der `u`-Kante und liest als Falte — die ±5 L belegen es.

**Punkt 3 — Einzeltexel-Rauschen: BEHOBEN.** Zwischen down_0 und down_1 ändert sich oberhalb Zeile 15 **kein einziger Texel** (vorher 5 verstreute Einzelwechsel); dasselbe für down_1/2 und side_0/1. Die Bewegung sitzt jetzt in der Silhouette: Silhouettendiff 22 Texel frontal, 61 seitlich. Schulterleiter Zeile 9 von `_Z^X` (vier Töne in vier Texeln) auf `.ZZ^^^^UUU` — geclustert. Z-Sporne gepaart (down_0 Z. 15/16 Sp. 12 stehen jetzt übereinander). Zahlen: Stoff-Solitäre über alle 17 Frames **203 → 30**.

**Zugabe Beine: BEHOBEN.** Zeilen 17-23 jetzt `uUUUk` / `qjqqk` / `qjjjk` statt `kUUUk` / `kjqqk`. `k` gesamt **1004 → 528 Texel**. Im 12x-Crop sind die zwei schwarz umrandeten Stöcke unter dem Torso verschwunden.

**Zugabe Riemen: BEHOBEN.** down_0 Zeile 5 Spalte 12 = `j` verbindet Körperkante und Griff. Rest: Zeile 4 Sp. 12 ist noch transparent, die Knaufspitze hängt einen Texel frei — bei einem Rückentrage-Knauf physikalisch richtig, unauffällig.

**Gesamtmessung (gates.mjs, selbst gelaufen):**

| | vorher | nachher |
|---|---|---|
| Solitär (Ziel ≤8) | 11,94 % | **4,57 %** grün |
| Konturtöne ≥8 (Ziel ≥3) | 4 | **13** grün |
| Rim E5 (Ziel ≥12) | 8,5 % | **14,1 %** grün |
| Schwarzanteil k+n (T2-Definition, Ziel ≤25) | 34,3 % | **20,5 %** grün |
| Stoff-Verteilung (kein Ton >55 %) | U 56 %, `^` 0 % | u 28 / U 49 / X 11 / `^` 5 / Z 6 grün |
| bbox-Symmetrie | 26,0 | 23,8 |
| geom. Kontur (falsch implementiertes Gate) | 30,2 % | 29,0 % |

Alle 18 Frame-Diffs über den Untergrenzen, mehrere deutlich: down_3/0 38 → 65, side_3/0 58 → 97, attack_side 103 → 173.

## 2. Grimmigkeit und Augen

**Grimmigkeit zurück: ja.** Hautrampe kippt von 54 % auf 44 % Hellanteil (`h` 95 → 86, `2` 81 → 109). Im Gesicht frontal ist die obere Wangenzeile jetzt komplett `22222`; es bleiben genau 4 helle Hauttexel, zwei in der Augenzeile, zwei darunter. Der Kopf ist damit kein Leuchtfleck mehr, sondern liest als „von unter der Kapuzenkante angeleuchtet". Im 12x-Crop ist der Puppenhaft-Eindruck der letzten Runde weg.

**Augen noch lesbar: ja, unverändert.** Die Konstruktion `hkhk2` ist nicht angefasst worden — zwei `k`-Augen mit `h`-Nasensteg, darüber das `nnnnn`-Brauenband. Bei 6x eindeutig zwei Augen, bei 1x weiterhin eine dunkle Kerbe im Gesichtsfeld, die den Kopf als Kopf trägt. Die Abdunklung der Wange darüber hat den Kontrast zu den Augen sogar erhöht statt gesenkt.

## 3. Flip-Probe

**Nichts kippt mehr.** Siehe die Tabelle unter Punkt 2. Einzige Restbewegung: die Rim-Kappe sitzt rechtslaufend leicht links vom Kapuzenscheitel, gespiegelt leicht rechts davon — 1 bis 2 Texel Versatz auf der Krone. Bei Licht von oben ist das kein Widerspruch.

## 4. Profil-Note: 7,2 (vorher 5,5)

Das Profil hat jetzt Augenlage, Nase und Kinnstufe und ist damit eindeutig ein Kopf, der nach rechts schaut. Das „lesbar, nicht schön" des Zeichners ist die korrekte Selbsteinschätzung, und der Grund ist benennbar: Zeile 6 ist `2hhh` — die Nasenzeile trägt DREI helle Hauttexel, also ist die breiteste und hellste Stelle des Kopfes die Zeile unter dem Auge. Das liest als Schnauze statt als Nase. Zwei Texel korrigieren das komplett: Zeile 6 Spalte 11 von `h` auf `2` (Wange hinter der Nase in den Schatten, helle Masse schrumpft von drei auf zwei Texel und rutscht nach vorn), plus das fehlende `n` auf Zeile 7 Spalte 12 als Mundlinie.

## 5. Gesamtnote: 7,9 → **8,4**

Lesbarkeit/Silhouette 8,6 · Gesicht frontal 8,4 / Profil 7,2 · Material/Licht 8,5 frontal, 7,5 seitlich · Animation 7,4.

Über der Bestands-Welt (7,5), am unteren Rand von SoM (8,5-9). Der Rest bis 10 ist nicht mehr Zeichnung: es sind 17 statt 42 Grids (kein Idle-Atmen, kein Hurt, keine Anticipation/Recover) und die Hue-Spanne, die am Palettenblocker aus §5 hängt. Beides war nie Auftrag dieses Passes.

**Beide erklärten Kosten geprüft und akzeptiert:**
- *Seitenansicht flacher:* bestätigt und beziffert (dL-Asymmetrie 21,4 frontal gegen 2,6-5,2 seitlich). Das ist der Preis für Flip-Neutralität und der richtige Handel — ein kippendes Licht ist ein Fehler, eine flachere Seite ist eine Eigenschaft. Auf `held_weg_6x.png` und `held_gras_6x.png` trennt die Seitenansicht weiterhin, getragen von Kapuzenkappe, Stiefeln und Klinge.
- *dE00 0,3-0,5 unter vorher:* bestätigt und trivial (path 21,6 → 21,1; grass_g5 21,3 → 21,0). Gegenrechnung: Rim 8,5 % → 14,1 %. Die Kante leistet ein Vielfaches dessen, was der Flächenkontrast verliert. G-A' korrekt deklariert.

## 6. VERDIKT: **FREIGEBEN als Stil-Anker für die NPCs**

Beide Blocker der letzten Runde sind geschlossen, und zwar messbar, nicht nur nach Augenschein. Die zwei offenen Texel im Profil (Wange `h`→`2`, Mundlinie `n`) sind Politur am Helden selbst, keine Regel, die ein NPC erben würde — die gehören in den Slice-Backlog, nicht in eine weitere Runde.

**Was aus diesem Pass als Regel in das Anker-Dokument muss, bevor der erste NPC gezeichnet wird:**

1. Seitenframes bleiben flip-neutral: Licht von oben, keine senkrechte Lichtkante. Abnahmeregel = die gemessene Links/Rechts-dL der Seitenframes bleibt unter einer halben Rampenstufe (hier ≤5 L gegen 21 L frontal).
2. Selektives Outline gilt bis zu den Stiefeln, nicht nur bis zum Gürtel.
3. Sekundärbewegung gehört auf die Silhouette (Saum, Kante), nie als Einzeltexel-Tausch im Flächeninneren.
4. Requisiten (Griff, Klinge, Schnallen) sind aus dem Solitär-Gate ausgenommen — beim Held sind 44 der 135 Solitäre das Schwert.
5. **Das Umriss-Gate muss vor der ersten NPC-Messung neu gefasst werden.** `gates.mjs:50` misst Umfang durch Fläche und meldet deshalb weiter 29 %. Zielbild T2 misst Schwarzanteil; danach steht die Figur bei 20,5 % und hat 13 Konturtöne. Wenn das Gate so bleibt, misst der ganze NPC-Pass eine Kennzahl, die nur die Körperform beschreibt und keinen Handwerksfehler.

**Ein Befund zur Weitergabe, nicht aus diesem Pass:** dE00 des Helden gegen `dorf_stufe` = 3,1 (vorher 3,6). Auf dieser einen Kachel ist die Figur nahezu farbgleich mit dem Boden und trennt nur über Rim und Umriss. Vorbestand, Kachelseite, gehört in den Welt-Backlog.
