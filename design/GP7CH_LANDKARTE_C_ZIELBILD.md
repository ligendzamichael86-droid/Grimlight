# GP7-CH Landkarte Teil C: Zielbild-Analyse (16.08.2026, Opus-Analyst, konsolidiert)

Alle Messungen liegen vor. Hier der Rohdaten-Report.

---

# GP7-CH ZIELBILD-ANALYSE

**Messgrundlage:** 57 Figuren-Grids (~1.412 Quellzeilen) aus `game/js/art/sprites.js`, Palette aus `game/js/art/palette.js`, Zeichenpfade aus `player.js:227-247` / `enemies.js:634-641` / `npcs.js:200-229` / `main.js:2487-2573`. Alle Zahlen unten sind nachgerechnet, nicht geschätzt (Skripte im Scratchpad: `measure.mjs`, `measure2.mjs`). Referenzrecherche parallel: Slynyrd/Pixelblog (gleiche Kachelgröße, gleiche 320x180-Auflösung), Saint11, Derek Yu, Dead Cells, Darktide-Gegnerkunst, AndroidArts-Diablo-Analyse.

**Ein Befund vorweg, weil er alles rahmt:** Beide Zeichenpfade sind ausdrücklich "größenagnostisch" (Sprite-Maße werden aus dem Canvas gelesen, horizontal auf die Hitbox zentriert, Füße auf Hitbox-Unterkante). Sprite-Maße variieren im laufenden Spiel bereits von 16x12 bis 24x32. **Die Maßfrage kostet die Engine exakt null.** Sie ist reine Art- und Welt-Maßstabs-Frage und lässt sich ohne Lock-in verschieben.

---

## 1. QUALITÄTS-ANATOMIE: 12 Techniken mit Messziel und IST-Wert

### T1 Silhouetten-Familien (Zeilenbreiten-Profil)
*Definition:* Zwei Figuren, die zusammen im Bild stehen, müssen sich allein an der Zeilenbreiten-Kurve unterscheiden lassen, ohne Farbe.
*Messgröße:* Paarweise Ähnlichkeit der Zeilenbreiten-Profile (100 = identische Silhouettenmasse).
*IST:* Bran/Corm **90**, Bran/Torwächter **90**, Held/Bran **89**, Held/Torwächter **88**, Hedda/Corm 86. Einzige Ausnahme: Mile 64 bis 70. Gegner: Skelett/Ghul **76**, Ghul/Rostpanzer **78**, Hund/Rostpanzer 56 (bester Wert).
*Befund:* Vier von sechs Menschen sind derselbe Kasten. Mile ist der Beweis, dass Variation funktioniert (und die Figur, die die Juroren nie bemängelt haben).
*ZIEL:* Menschen paarweise <= 70, Gegner familienübergreifend <= 60.

### T2 Selektives Outline (Sel-Out)
*Definition:* Der Umriss ist kein gleichmäßiger schwarzer Ring, sondern wird zur Lichtseite hin heller, nimmt innen den dunklen Materialton statt Schwarz und entfällt dort, wo die Figur ohnehin auf Dunkel steht.
*Messgröße:* (a) Umriss-Anteil an allen Texeln, (b) Zahl unterschiedlicher Umriss-Töne je Figur.
*IST:* Umriss-Anteil 26 bis 45 Prozent. Held 90 von 256 Texeln = **35 Prozent reines Schwarz**. Rostpanzer 45 Prozent, Rost-Leiche 55 Prozent. Im gesamten Cast existieren genau **zwei** Umriss-Töne (k L18, n L31). Bester Wert: Warden mit 21 bis 24 Prozent, und der Warden ist die einzige Figur, die keine Jury je bemängelt hat.
*ZIEL:* <= 25 Prozent Umriss-Anteil, >= 3 Umriss-Töne je Figur.
*Hebel:* Beim Held sind das rund 26 freiwerdende Texel. Das Gesichtsfeld hat heute 24.

### T3 Farb-Cluster statt Einzelpixel
*Definition:* Jedes Texel gehört zu einer Fläche; freistehende Einzelpixel lesen als Rauschen, nicht als Form.
*Messgröße:* Anteil Solitär-Texel (kein 4er-Nachbar gleicher Farbe), Umriss ausgenommen.
*IST:* Bran 3,6 / Mile 5,3 / Hedda 6,6 / Torwächter 6,7 / Ghul 7,1 / Corm 9,0 / Held 12,6 / Skelett 14,3 / Warden 16,2 / **Rostpanzer 35,3 Prozent**.
*ZIEL:* <= 8 Prozent. Der Rostpanzer ist der einzige harte Ausreißer (deckungsgleich mit GP6-Jury-Befund H2 "Boss-Arena-Sprenkel").

### T4 Hue-Shift in Rampen
*Definition:* Beim Aufhellen dreht der Farbton zur Lichtfarbe und entsättigt, beim Abdunkeln dreht er zur Umgebungsfarbe (kalt).
*Messgröße:* Hue-Spanne in Grad über die Rampe. Referenzwert Slynyrd: **20 Grad pro Stufe.**
*IST (Charakter-Rampen):* Ghul **2**, Held-Stoff **3**, Haut **3**, Knochen **3**, Stahl **3**, Seele 4, Stein 6, Rost 9, Holz 10 Grad. Über die GESAMTE Rampe, nicht pro Stufe.
*IST (Welt-Rampen):* Gras **59 Grad**, Erde 13.
*Befund:* Die Welt hat den Hue-Shift bekommen, die Menschen nicht. Bei 4 Stufen wäre der Referenzwert 60 Grad Spanne; wir liegen bei 3. Das ist der größte einzelne Handwerks-Rückstand und er ist **maßunabhängig**: bei 24x32 wäre er exakt genauso schlecht.
*ZIEL:* >= 20 Grad Spanne je 3-Stufen-Rampe, >= 40 Grad je 4-Stufen-Rampe. Sättigung mit Maximum in der Mittelstufe.

### T5 Rampen-Stufen je Materialfläche und Schritt-Gleichmaß
*Definition:* Jede Materialfläche ab einer Mindestgröße trägt mindestens 3 Werte, und die Luminanzschritte sind gleichmäßig (keine Schluchten, keine Doppelungen).
*Messgröße:* (a) Stufen je Fläche >= 40 Texel, (b) Verhältnis größter zu kleinstem Schritt, (c) Anteil des dominantesten Einzeltons an der Fläche.
*IST Stufen:*
- Hedda Kleid: 83 Texel, **1 Stufe** (G allein; die "Falten" sind r bei dL 46, also Nadelstreifen; Jury-Befund bestätigt)
- Corm Kutte: 120 Texel, **2 Stufen** (g/s)
- Torwächter Panzer: 80 Texel, 3 Stufen (aber es ist die Ziegel-Rampe)
- Bran Schurz: 102 Texel, 4 Stufen (aber es ist die Holz-Rampe seiner eigenen Schmiede)
- Skelett: 84 Knochen-Texel, davon **64 auf einem Ton** (b). Mit k zusammen tragen 2 Töne 85 Prozent der Figur.
*IST Schritt-Gleichmaß:* Ghul d>H>3 **87,8 / 27,2** (Verhältnis 3,2). Knochen O>B>b>N 36,8 / **64,0** / 29,6 (2,2). Stahl C>i>I 84,1 / 59,3. Seele 7>8: eine einzige Stufe von **102 L**. Held-Stoff u>U>X>Z 27,6 / 31,3 / **48,2** (1,7).
*ZIEL:* >= 3 Stufen je Fläche >= 40 Texel, Schrittverhältnis <= 1,6, kein Einzelton > 55 Prozent einer Materialfläche.

### T6 Rimlight-Sprache
*Definition:* Ein 1px-Band eines hellen Tons an der Kante, das die Figur ohne Umriss vom Boden trennt, und das der Lichtrichtung folgt.
*Messgröße:* Rim-Texel als Anteil der Kontur, plus Reaktion auf Lichtrichtung.
*IST:* Von 11 Figuren haben **zwei** einen Rim. Held: Z, 8 Texel (~6 Prozent der Kontur), **statisch identisch in allen vier Richtungen**, reagiert also auf gar nichts. Ghul: C, 9 Texel links. Kein NPC, kein anderer Gegner hat einen.
*ZIEL:* Jede Figur >= 12 Prozent der Kontur, Seite an die Tint-Richtung gekoppelt (`seite` wird in `pushTinted` bereits berechnet, main.js:2703).
*Horden-Relevanz:* Bei überlappenden Gegnern ist der Rim das Einzige, was zwei gleiche Figuren trennt. Er ist kein Politur-Merkmal, er ist ein Horden-Merkmal.

### T7 Anti-Symmetrie
*Definition:* Nichts an einer lebenden Figur ist spiegelgleich; Requisit, Schulterhöhe, Faltenwurf und Haltung brechen die Mittelachse.
*Messgröße:* Anteil spiegelgleicher Texel.
*IST:* Corm **87**, Mile 85, Bran 84, Held (down) 82, Hedda 81, Skelett 80, Held (up) 79, Rostpanzer 65, Torwächter 62, Warden 52, **Ghul 40 Prozent**.
*Befund:* Die Rangfolge ist exakt umgekehrt zur Jury-Bewertung. Ghul, Warden und Torwächter sind die drei Figuren, die nie bemängelt wurden, und die drei mit der niedrigsten Symmetrie. Diese Technik kostet **null Texel**.
*ZIEL:* <= 65 Prozent bei allen Figuren.

### T8 Kontrast-Band Figur gegen Boden
*Definition:* Die Körperfläche (ohne Umriss) muss von jedem Boden, auf dem die Figur stehen kann, einen definierten Luminanzabstand halten. Nicht zu wenig (verschwindet) und nicht zu viel (schreit).
*Messgröße:* dL Körperfläche gegen Kachel-Mittel-L.
*IST:* Bodenmittel 60,1 über 24 Kacheln; Weg-Kacheln allein aber L 88,8 bis 91,7.
| Figur | Körper-L | dL zum Bodenmittel |
|---|---|---|
| Grufthund | 80,6 | 20,5 (**auf dem Weg: -10,3**) |
| Held | 80,4 | 20,2 |
| Torwächter | 92,3 | 32,2 |
| Hedda | 97,8 | 37,6 |
| Corm | 99,3 | 39,2 |
| Ghul | 102,4 | 42,3 |
| Bran | 105,0 | 44,9 |
| Mile | 115,4 | 55,3 |
| Rostpanzer | 135,0 | 74,9 |
| Warden | 143,4 | 83,3 |
| **Skelett** | **193,7** | **133,5** |
*Befund 1:* Die Spanne 20 bis 133 ist kein System, sondern Zufall. Skelett schreit, Grufthund verschwindet.
*Befund 2, schwerwiegender:* **Vier von sechs Menschen tragen die Rampe des Gebäudes, vor dem sie stehen.** Bran = Holz q/j/c/J (seine eigene Schmiede), Corm = Stein g/s (seine eigene Kapelle), Torwächter = Rost 4/5/6 (die Ziegel), Grufthund = Erde z/p/v/P/V (der Weg, auf dem er jagt, inklusive dessen Spitzlicht V). Nur Hedda hat einen eigenen Stoffton (G), und der hat keine Rampe.
*ZIEL:* dL 25 bis 90 gegen JEDEN begehbaren Boden. Plus eine harte Sperrliste: keine Figur führt als dominante Rampe die dominante Rampe ihrer Standkacheln.

### T9 Sub-Pixel-Bewegung über Frame-Paare
*Definition:* Zwischen zwei Frames bewegen sich Körperteile phasenversetzt um je 1px, sodass das Auge eine Bewegung unterhalb der Pixelbreite integriert, statt einen Sprung zu sehen.
*Messgröße:* Silhouetten-Diff in Prozent und dessen Verteilung über Körperregionen.
*IST:* NPC-Idle-Paare zeigen 44 bis 66 Prozent Texel-Diff, aber nur 11 bis 21 Prozent Silhouetten-Diff. Ursache: die ganze Figur wird um **eine Zeile nach unten verschoben**. Das ist kein Sub-Pixel, das ist ein Ganzkörper-Sprung. Skelett-Paar: 8,7 Prozent Texel, 5,8 Prozent Silhouette (nur Beine). Held down: 16,2 / 6,4. Held side (bester Wert): 25,3 / 19,1.
*Caveat aus der Recherche:* Echte Sub-Pixel-Animation (das Animieren des Anti-Aliasing) degradiert unterhalb von ~16 Farben. Unsere Figuren haben 4 bis 13 Töne, das Skelett 4. Diese Technik ist erst verfügbar, wenn die Ton-Budgets steigen (siehe T5).
*ZIEL:* Idle-Silhouetten-Diff 4 bis 10 Prozent, verteilt auf >= 3 Regionen, davon <= 50 Prozent aus starrer Vertikalverschiebung.

### T10 Sekundärbewegung (Stoff, Haar, Bart, Riemen)
*Definition:* Stoff und Haar folgen dem Körper einen Frame verzögert.
*Messgröße:* Anteil der Lauf-Frames, in denen sich eine Sekundärregion ändert, ohne dass sich der Grundkörper ändert. Referenzwert Slynyrd: Haar bewegt sich in Frame 2 und 4 eines 6er-Zyklus.
*IST:* **0 Prozent.** Der Helden-Umhang (u/U/X, 132 Texel) ist in allen vier Laufframes einer Richtung pixelidentisch; nur die Zeilen 17 bis 23 (Beine) ändern sich. Kein Bart, kein Umhangsaum, kein Rock, keine Stola im ganzen Cast bewegt sich je unabhängig.
*ZIEL:* >= 25 Prozent der Laufframes tragen eine reine Sekundäränderung; >= 1 definierte Sekundärregion je Figur.
*Mechanik ist vorhanden:* `enemies.js:642-651` zeichnet dem Rostpanzer ein Schild-Overlay mit eigenem Offset. Das ist bereits die Overlay-Ebene, die Umhang und Waffe braucht (und später die Ausrüstungs-Darstellung).

### T11 Squash and Stretch, dosiert, und die Angriffs-Phasen
*Definition:* Vertikale Amplitude im Zyklus, Anticipation vor dem Schlag, Follow-Through danach.
*Messgröße:* Bob-Amplitude in px; Zahl der Angriffs-Posen.
*IST:* Lauf-Bob exakt 1px (dokumentiert und korrekt). Angriff: **eine einzige Pose je Richtung**. `player.js` kennt ATTACK_TOTAL und ATTACK_BUSY, aber nur ein Sprite. Es gibt keine Hurt-Pose, der Spieler blinkt nur.
*Referenzwert:* Slynyrd fährt Angriffe immer mit 6 Frames und differenziert allein über Timing (Schwert 100/50/50/50/100/50 ms = 400 ms; Speer 550 ms; Hammer 800 ms). Phasen: Anticipation (1 Frame, variabler Halt), Smear, Follow-Through (1 Frame, langer Halt), Recover (1 Frame, Pose ZWISCHEN Follow-Through und Idle). Keine Smears in Anticipation oder Recovery.
*ZIEL Minimalstufe:* 3 Posen je Angriffsrichtung (Anticipation / Strike / Recover), Bob 1 bis 2px, Hurt als echte Pose.

### T12 Kontaktschatten und Bodenverankerung
*IST:* **Die einzige Technik, die das Projekt bereits auf modernem Niveau fährt.** 4-Zeilen-Weichschatten, Alphas 0,34/0,40/0,20/0,10, Breiten 0,90/0,95/0,70/0,40 x Hitbox, plus BIG-Profil mit 5 Zeilen ab 18x20. GP6 §4.3 misst >= 8 sichtbare Texel unter der Fußkante bei dL 6,73. Nicht anfassen, nur erweitern.
*Zwei Lücken:* (a) Der Schatten hängt an der Hitbox, nicht am Sprite. Held: Hitbox 12 breit, Sprite 15 breit, also 11px Schatten unter einer 15px-Figur. (b) Der Schatten bobbt nicht mit; die Recherche empfiehlt ausdrücklich einen mitbobbenden Schatten, damit die Figur als fester Körper liest statt zu gleiten.
*ZIEL:* Schattenbreite an die sichtbare Sprite-Breite koppeln, Bob-Kopplung 1px.

### Zwei Engine-seitige Techniken, die im Charakterpass mitentschieden werden

**T13 Treffer-Flash statt Blink.**
*IST:* `enemies.js:620` blendet einen getroffenen Gegner alle 1/20 s vollständig aus; `player.js:227` lässt den unverwundbaren Spieler alle 1/12 s verschwinden. Das ist Technik von 1988. Die Referenz nennt einheitlich den weißen Vollflächen-Flash über 1 bis 2 Frames (Optimum 2 bis 3) plus Hitstop plus Shake.
*Die Maschine existiert bereits:* `buildTintMask` (sprite_factory.js:65-97) erzeugt ein Canvas mit der identischen Alpha-Form des Sprites in beliebigen Tönen. Ein Weiß-Flash kostet eine zusätzliche `drawImage` und behält die Silhouette.
*Messziel:* Silhouetten-Verlust-Frames je Treffer = 0.
*Horden-Relevanz:* 40 Gegner, von denen die Hälfte flimmernd verschwindet, ist unlesbares Chaos. 40 Gegner, die weiß aufblitzen, lesen als Wucht.

**T14 Lesbarkeit bei 1x und am Gerät.**
*IST:* 320x180, ganzzahlig skaliert (`main.js:84-92`). Auf einem 2340x1080-Handy im Querformat ist der ganzzahlige Faktor **6** (1080/180). Der Held ist also physisch 96x144 Pixel groß, sein Gesichtsfeld (6x4 Texel) physisch 36x24 Pixel. Jeder oben gemessene Handwerksfehler wird sechsfach vergrößert ausgeliefert. Die Recherche bestätigt 320x180 bei 6x als bewusste Referenzauflösung für genau diesen Stil.
*Messziel:* Jury-Bogen bei 1x UND 6x, plus Squint-Test (auf 50 Prozent runter und zurück): die Figur muss allein an der Silhouette identifizierbar bleiben.

---

## 2. FIGUREN-STECKBRIEFE

> **Vorab-Korrektur zur Aufgabenstellung:** Es existieren **fünf** Gegnertypen, nicht sechs (skeleton, ghoul, hound, rust, graveward). Ich liefere fünf Steckbriefe plus den Vorschlag für den sechsten, den Slice 7 ohnehin braucht und der jetzt hordentauglich geboren werden sollte.

### HELD (16x24, 17 Grids)
**Silhouette:** Heute 82 Prozent spiegelgleich, 35 Prozent Umriss, dL 20 zum Boden (niedrigster Wert des Casts neben dem Hund). Unverwechselbar wird er über drei Dinge: die **Kapuzenspitze außermittig nach links**, den **Umhangsaum, der nach rechts ausschwingt** (und der als Einziger im Spiel Sekundärbewegung trägt), und die **Klinge, die die Silhouette immer auf einer Seite durchbricht** (unten seitlich, oben auf dem Rücken, seitlich in der Hand). Er ist bereits das einzige Violett der Welt (G steht 75 bis 78 Grad Hue entfernt) und muss es bleiben.
**Requisit/Pose:** Leichte Vorlage im Stand, Gewicht auf dem vorderen Fuß, Schwerthand nie symmetrisch zur Körperachse.
**Materialien:** Umhang u/U/X/Z braucht Hue-Shift (Schatten Richtung 280 Grad Blauviolett, Spitzlicht Richtung 250 bis 255 Grad und entsättigt) und eine Zwischenstufe in der 48-L-Schlucht X nach Z. Heute trägt Z nur 8 Texel und X nur 29 gegen 67 Mittelton und 28 Dunkel. Das Gesichtsfeld (6x4, 18 Hauttexel) braucht drei ablesbare Merkmale statt des heutigen `kkhhkk`-Blocks: Brauenschatten, 2 Augentexel, Wangenlicht.
**Animations-Minimum:** 4 Richtungen x [Idle 2 (Atem + Umhang), Walk 4, Attack 3 (Anticipation/Strike/Recover), Hurt 1] plus 2 gemeinsame Die-Frames = **42 Grids** (heute 17). Hurt ist komplett neu; heute blinkt der Spieler nur.

### BRAN DER SCHMIED (16x24)
**Silhouette:** Muss die **breiteste, schiefste Schulterlinie des Casts** werden: eine Schulter 2px höher (Hammerarm), Kopf zwischen den Schultern versenkt, kein Hals. Heute 84 Prozent spiegelgleich und zu 90 Prozent deckungsgleich mit Corm und dem Torwächter.
**Requisit/Pose:** Hammer; der Amboss existiert bereits als Kachel (`dorf_amboss`, sprites.js:9627), ebenso die Esse mit 3-Frame-Animation.
**Materialien:** **Muss die Holzrampe verlassen** (heute 102 Texel q/j/c/J = exakt die Rampe seiner eigenen Schmiede und ihrer Traufe; Jury-Backlog Punkt 6). Vorschlag: versengtes Leder auf der Rost-Rampe 4/5/6, das bindet ihn ans Eisen statt ans Bauholz. 43 Hauttexel (nackte Arme) sind der höchste Hautwert des Casts und ein gutes Instinkt-Merkmal: behalten und den Bart als eigenen Wertblock (B/b) setzen, damit der Kopf bei 1x liest.
**Animation:** Idle 2 (Blasebalg-Atem im Brustkorb), Talk 1 (echt, siehe unten), **Tätigkeits-Loop 4 Frames Hämmern** (Heben / Halten / Schlag / Rückprall), Schlagframe synchron zur vorhandenen Esse-Animation, Funken über das vorhandene Partikelsystem.

### ALTE HEDDA (16x24)
**Silhouette:** Die **einzige Figur, deren Silhouette sich nach unten verjüngt** (Kegel des Gewands). Das ist bereits so und ist ihr wertvollstes Merkmal: übertreiben. Krummer Rücken, Kopf nach vorn geschoben, und der **Stock diagonal durch die Silhouette** statt der heutigen senkrechten j-Spalte am äußersten Rand (die liest als Zaunpfahl).
**Materialien:** Sie hat als Einzige einen eigenen Kleiderton (G Krapp, 83 Texel), aber mit **einer einzigen Stufe**. Sie braucht mindestens zwei weitere G-Stufen (dunkel ~L 65, hell ~L 130). **Achtung, Blocker:** Die Palette hat 61 alnum plus 3 Symbole, und es ist genau **ein** alnum-Schlüssel frei ('l', und der ist verboten). Ohne sanktionierte Palettenerweiterung ist eine echte Stofframpe für die NPCs nicht baubar (siehe §5, Vorentscheid).
**Animation:** Idle 2 (Atem plus ein Schultertuch, das nachzieht), Talk 1, Tätigkeits-Loop 3 Frames (Schale rühren oder Kräuter mörsern).

### VATER CORM (16x24)
**Silhouette:** Mit **87 Prozent Spiegelgleichheit der schlechteste Wert des Casts** und mit 271 opaken Texeln die vollste Fläche, also ein massiver Kasten. Er muss aufhören, ein Rechteck zu sein: hoch und schmalschultrig, spitze Kapuze, **das Buch nach vorn gehalten, das die Brustlinie durchbricht**, eine Schulter fallengelassen.
**Materialien:** **Muss die Steinrampe verlassen** (120 Texel g/s = die Rampe seiner eigenen Kapellenwand). Vorschlag: dunkle Wolle auf z/p/v (Erde, tief) mit der Krapp-Stola G als einzigem Akzent, die bereits vorhanden ist (16 Texel, gute Entscheidung).
**Animation:** Idle 2 mit dem **langsamsten Atem des Casts** (~1,0 fps gegen die heutigen 1,6 für alle), Talk 1, Tätigkeits-Loop 2 Frames (Seite umblättern oder Zeichen schlagen).

### MILE DAS BOTENKIND (16x24, bbox 12x20)
**Silhouette:** Die einzige Figur, die sich heute schon unterscheidet (64 bis 70 Prozent Ähnlichkeit zu allen anderen, Kopf beginnt erst in Zeile 4). Weiter treiben: noch schmalere Schultern, übergroßer Kopf, permanente Vorlage, **eine Hand immer an der Tasche**. Heute 85 Prozent spiegelgleich: die Tasche gehört fest auf eine Hüfte.
**Materialien:** Leinen O/B (50 Texel) grenzt an die Knochenrampe der Skelette. Kittel in die Krapp-Familie oder ein Grün verschieben.
**Animation:** Idle 2 mit echtem **Charakter-Tick** (Fersenwippen plus zwei Kopfstellungen, "schaut sich um"), Talk 1, Tätigkeits-Loop (auf der Stelle traben oder einen Stein hochwerfen).

### DER TORWÄCHTER (16x24)
**Silhouette:** Mit 62 Prozent Spiegelgleichheit zweitbester Wert. Der **Speer ist das einzige senkrechte Element im Cast, das den Bildrand oben durchbricht**: das ist seine Unterschrift. Verstärken, indem der Speer geneigt statt senkrecht steht.
**Materialien:** Rost 4/5/6 (80 Texel) ist zugleich die Ziegelrampe, aber er steht an der Holzpalisade, also ist die Kollision kleiner. Trotzdem: **die Haube bekommt eine kalte Stahlstufe (C/i)**, damit Rüstung nicht als Mauerwerk liest, und wird zur einzigen S-Ton-Masse (L122) im Dorf.
**Animation:** Idle 2 (Gewichtsverlagerung, Speer tippt auf dem Gegentakt auf), Talk 1, Tätigkeits-Loop (Kopf scannt links/rechts über 6 s).

### DIE FÜNF TALK-FRAMES (alle NPCs, gemeinsamer Befund)
Gemessen: `npc_*_talk` unterscheidet sich vom Idle-Frame um **genau 4 Texel = 1,5 bis 2,3 Prozent**, Silhouetten-Diff **0**. Bei 6x Skalierung ist das ein Zucken von 4 Bildpunkten in der Mundzeile. Der Sprech-Frame ist faktisch ein No-op. Er braucht mindestens: offener Mund, Kopfneigung 1px, eine Hand hebt sich, Schultern 1px höher.

---

### GEGNER

### SKELETT (16x16)
**Problem in Zahlen:** dL **133,5** zum Boden (schreit), **85 Prozent der Figur auf zwei Tönen** (k plus b), 80 Prozent spiegelgleich, Laufpaar-Diff 8,7 Prozent (nur Beine). Zwanzig davon in einer Horde ergeben eine Wand aus weißem Rauschen.
**Zielbild:** Muss **dunkler werden und eine Mittelstufe gewinnen**: Körper auf O/B/b mit b nur noch als Spitzlicht statt als Grundton (heute 64 von 84). Silhouetten-Signatur: das schmale Rippenfenster (existiert, behalten) plus ein **geneigter Schädel**. Anti-Symmetrie: ein Arm hängt, einer ist erhoben.
**Animation:** Walk 2 auf 4 (echte Schulterrotation), Attack 2, Hurt über Flash, **Die zweistufig**.

### GHUL (16x20)
**Der heimliche Beste unter den kleinen Gegnern:** 40 Prozent Spiegelgleichheit, 7,1 Prozent Solitär-Texel, dL 42. Anti-Symmetrie und Masse behalten.
**Zielbild:** Die Lumpen tragen heute 'g' (39 Texel = die **Steinrampe**) und müssen eine eigene Stofframpe bekommen. Silhouetten-Signatur: die breiteste, gebeugteste Form mit ungleichen Schultern, Arme bis unter die Knie.
**Animation:** Walk 2 auf 3 (ein Fuß schleift), Ausfall/Attack 2, Die zweistufig.

### GRUFTHUND (16x12)
**Der schlechteste Lesbarkeitsfall des Spiels:** Körper L 80,6 in der **Erdrampe z/p/v/P/V**, auf Weg-Kacheln (L 91) also **dL -10**. Er ist dunkler als der Boden, auf dem er jagt, und benutzt dessen eigene Töne, inklusive dessen Spitzlicht V.
**Zielbild:** Erdrampe **komplett verlassen**. Schwarz und kalt (n/u plus kalter Rim) oder Knochen und Sehne. Silhouette: der einzige Vierbeiner, die horizontale Lesart ist bereits einzigartig (Hund gegen Rostpanzer 56 Prozent = beste Trennung im Cast). Verstärken: längerer Rumpf, tiefer Kopf, Schwanz als Silhouettenbrecher. **Ein einziges Texel Seelenglut '8' (L200) als Auge** macht einen dunklen Hund im Rudel bei 1x lesbar.
**Animation:** Lauf 2 auf 4, Telegraph/Leap/Down existieren bereits (gute Arbeit), Die zweistufig.

### ROSTPANZER (16x18)
**Problem in Zahlen:** **35,3 Prozent Solitär-Texel** (höchstes Rauschen des Casts), 45 Prozent Umriss, dL 75.
**Zielbild:** Entrauschen (Rostplatten in mindestens 2x2-Cluster), Umriss runter. Silhouetten-Signatur: die **Schulterplatten-Ausladung**, die heute vom 16px-Rahmen abgeschnitten wird. Das ist die Figur, die Breite am dringendsten bräuchte.
**Behalten:** Das Schild-Overlay ist die Vorlage für "Ausrüstung als Overlay-Ebene" und für Elite-Staffelung.
**Animation:** Walk 2 auf 3, Block 1 (existiert), Die zweistufig.

### GRABWÄCHTER (24x32, Boss, 9 Zustände)
**Die beste Charakterarbeit des Projekts, in Zahlen:** 19 Töne, **21 bis 24 Prozent Umriss** (bester Wert), 52 Prozent Spiegelgleichheit, 9 Animationszustände mit 3-Kanal-Telegraphie.
**Rolle im Pass:** Nicht neu bauen, sondern **als Eichkörper benutzen**. Alles, was GP7-CH behauptet, sollte am Warden gegengeprüft werden, weil der Warden bereits punktet. Nachziehen nur: Hue-Shift der Knochenrampe, Rim, Sekundärbewegung an den 24 Stofftexeln (u/U/X).

### VORSCHLAG SECHSTER TYP: HORDEN-FUSSVOLK (neu, für Slice 7)
Slice 7 braucht eine billige Massen-Einheit. Sie jetzt zu entwerfen kostet fast nichts und spart später einen ganzen Pass.
**Spezifikation:** 16x14, <= 6 Töne, <= 20 Prozent Umriss, 2 Walk-Frames, 1 Attack, 2-stufiger Tod, **4 Paletten-Varianten ab Tag eins**. Silhouette: ausdrücklich **klein und niedrig**, eine Größenstufe unter dem Skelett, damit 30 Stück als Teppich lesen und nicht als Wand.

---

## 3. HORDEN-VORGRIFF: was jetzt entschieden werden muss

### 3.1 Zweistufiges Sterben (der größte Hebel)
Heute: `DIE_TIME = 0.4` s, danach `splice` plus Drops (`enemies.js:441-451`). In einer Horde sind 15 gleichzeitige Tode 15 Entities, die animieren und dann poppen.
**Entwurf:** Stufe 1 = Zusammensacken, 2 Frames, 0,2 s, noch Entity. Stufe 2 = Entity wird entfernt, ein **Decal** wandert in eine flache Decal-Liste (kein Entity, kein Update, gezeichnet mit dem Boden).
**Gute Nachricht aus den Messungen:** Die vorhandenen `*_die`-Grids sind bereits perfekte Decals. skeleton_die 51 Texel / 20 Prozent Rahmenfüllung, ghoul_die 52 / 16, rust_die 66 / 23, hound_die 79 / 41. Sie liegen flach, sind flächenarm und halten Standzeit aus.
**Messziel:** Decal <= 25 Prozent Rahmenfüllung und <= 6 Zeilen hoch, damit 30 Stück den Boden nicht zukleistern.

### 3.2 Paletten-Varianten, aber mit einer Einschränkung
`buildSprite(grid, palette)` nimmt die Palette als Parameter. Ein modifiziertes Palettenobjekt erzeugt aus **demselben Grid** einen umgefärbten Sprite. Kosten: null Grids.
**Jetzt festzulegen:** je Gegnertyp die 2 bis 3 "Tauschschlüssel", und die Grids so zeichnen, dass diese Schlüssel die Identitätsmasse tragen. Gemessen liegt die Identitätsmasse des Skeletts auf 'b' (64 von 84 Knochentexeln), also sind b plus B seine Tauschschlüssel.
**Gegenposition, die ich mitliefern muss:** Die AndroidArts-Diablo-Analyse hält die umgefärbten Skelette in Diablo 1 ausdrücklich für einen Fehler ("sie sollten alle knochenfarben sein, eher mit unterschiedlicher Ausrüstung und Stufe als mit Umfärbungen"), und Darktide formuliert dieselbe Regel positiv: **Tier-Trennung über Körperbau und Anbauteile, Varianz innerhalb eines Tiers über Tint und Decals.**
**Synthese für uns:** Paletten-Varianten NUR für Witterungsvarianz innerhalb einer Stufe (3 Varianten je Typ = 15 Looks aus 5 Grids). Elite-Staffelung dagegen über **Anbauteile als Overlay** (die Mechanik existiert: Rostpanzer-Schild, `elite_glow` 8x8) und über Größenstufen.
**Messziel:** Jede Variante hält dL 25 bis 90 zum Boden und unterscheidet sich von ihren Geschwistern um dE >= 12.

### 3.3 Silhouetten-Familien als Gesetz
Höchstens vier Familien für die gesamte Bestiarie: AUFRECHT-SCHMAL (Skelett), AUFRECHT-MASSIG (Ghul, Rostpanzer), VIERBEINER-NIEDRIG (Hund), GROSS-ELITE (Warden). Jeder neue Gegner tritt einer Familie bei und muss <= 60 Prozent Profilähnlichkeit zu jedem anderen Mitglied halten. **Heute fallen Skelett/Ghul (76) und Ghul/Rostpanzer (78) durch.** Das jetzt zu reparieren ist billig; nach Slice 7 vervielfacht sich der Fehler.
**Darktide-Regel, die direkt überträgt:** Der **Kopf- und Schulterbereich liefert den größten wahrgenommenen Unterschied** zwischen Gegnern. Dort zuerst Pixel ausgeben. **Rückenaufbauten** ändern die Silhouette von vorn UND von der Seite und sind das billigste Distanz-Erkennungsmerkmal.

### 3.4 Flash statt Blink
Siehe T13. Vor den Horden nicht verhandelbar.

### 3.5 Größenstufen einfrieren
Heute existiert bereits eine brauchbare Leiter: 16x12 (Hund), 16x16 (Skelett), 16x18 (Rostpanzer), 16x20 (Ghul), 24x32 (Warden). **Festschreiben** als KLEIN 16x14 / MITTEL 16x18-20 / GROSS 24x32 und nicht zulassen, dass alles auf ein Maß driftet. Eine Horde liest, wenn die Stufen sichtbar sind.

### 3.6 Zeichenkosten pro Gegner
`drawSoftShadow` macht 4 `fillRect` je Entity, `pushTinted` zeichnet Sprite plus Tint-Maske. Bei 40 Gegnern: 160 fillRect plus 80 drawImage je Frame. Nicht tödlich, aber während der Charakterarbeit billig zu entschärfen: Schatten je Größenklasse einmal in ein Canvas backen (1 drawImage statt 4 fillRect).

### 3.7 Überlappungsregel
Recherche-Regel für Draufsicht: **Y-Überlappung der oberen Sprite-Hälfte ist erlaubt, X-Überlappung liest als Verwirrung.** Für Horden heißt das: die KI-Abstandshaltung und der Rim (T6) sind zusammen das Lesbarkeits-Paar. Diablo 1 hat zusätzlich den Lichtradius benutzt, um entfernte Gegner bewusst zu **reinen dunklen Silhouetten kollabieren zu lassen**. Unser Lichtsystem kann das; das wäre ein Alleinstellungsmerkmal und passt exakt zur Diablo-Direktive.

### 3.8 Umriss-Anteil ist ein Horden-Budget
40 Gegner mal 35 Prozent Schwarztexel sprenkeln den Bildschirm zu. Der Weg von 35 auf 25 Prozent (T2) ist messbarer Horden-Gewinn, nicht Kosmetik.

---

## 4. MASS-FRAGE: mein Votum

### 4.1 Die Recherche spricht gegen uns, und das gehört auf den Tisch
- Slynyrd, **gleiche 16px-Kacheln, ausdrücklich gleiche 320x180-Auflösung bei 6x**, fährt seinen Draufsicht-Helden mit **26x32**. Wir liegen bei 16x24, also bei **46 Prozent seines Pixelbudgets**.
- Seine Proportionsregel lautet: Sprite = 1 Kachel breit x 2 Kacheln hoch (oder Vielfache), Kopf ein Drittel bis die Hälfte der Höhe. Unser Held ist 1 x 1,5 Kacheln; sein Kopf nimmt 37 Prozent (im Rahmen).
- Die Detail-Leiter (Pixel Parmesan, Derek Yu) verortet "Gesichtsausdruck, unterscheidbare Frisuren, ablesbare Rüstung, 3 bis 4 Stufen Gradient je Material" bei **32x32**, nicht bei 16x24. Das ist wörtlich unsere GP7-CH-Zielliste.
- Zur Tür sagt die Recherche ausdrücklich: **Türöffnungen auf 2 Kacheln verbreitern, nicht die Figur schrumpfen.**

### 4.2 Die Messung spricht dagegen, jetzt zu wachsen
Wir nutzen das aktuelle Format zu schätzungsweise 60 Prozent:
| Reserve | IST | Kostet an Pixeln |
|---|---|---|
| Umriss 35 auf 25 Prozent | 90 von 256 Texeln schwarz | setzt ~26 Texel frei (Gesichtsfeld hat 24) |
| Anti-Symmetrie 82 auf 65 Prozent | 82 Prozent spiegelgleich | null |
| Hue-Shift | 3 Grad statt 40+ | null |
| Sekundärbewegung | 0 Prozent | null |
| Stofframpe >= 3 Stufen | Hedda 1, Corm 2 | null (Umverteilung) |
| Rampen-Umverteilung | Z 8 / X 29 gegen U 67 | null |

**Und entscheidend: kein einziger dieser Defekte wird durch mehr Pixel behoben.** Ein 24x32-Sprite mit 3 Grad Hue-Spanne, 82 Prozent Symmetrie und 35 Prozent Umriss sieht bei 6x genauso billig aus, nur größer.

### 4.3 Was 20x28 konkret kostet, in Zahlen aus dieser Karte
- **Türen sind 1 Kachel = 16x16** (`dorf_tuer_zu`, Legende `map_dorf.js:178`). Eine 20px-Figur wäre **25 Prozent breiter als jede Tür des Spiels**.
- **Kleine Katen** (`H`/`L`/`N`, span [3,2], Wandblock **3x1**) sind 48px breit mit **einer einzigen 16px-Wandzeile**. Eine 28px-Figur davor ist fast doppelt so hoch wie die gesamte Wand; das Dach begänne an ihrer Hüfte.
- **Große Häuser** (span [4,3], Wandblock 4x2) sind 64px breit, 32px Wand.
- **Kachelgebundene Requisiten**, die gegen einen 16px-Menschen gezeichnet wurden: Amboss, Brunnen (2x2), Glocke, Theke, Fass/Kiste, Zaun, Palisade, Herdfeuer, Esse. Grob 40 Grids.
- **Neuzeichnung:** 57 Figuren-Grids, ~1.412 Quellzeilen. Ein Maßwechsel ist keine Skalierung, sondern eine vollständige Neuzeichnung des gesamten Casts.
- **Karte:** Gramfeld ist 44x28 Kacheln. Größere Häuser heißt Neulayout.
Größenordnung: **zwei bis drei Charakterpässe**, für +29 Prozent Körperdetail und +67 Prozent Gesichtsdetail, die das jetzige Format noch nicht ausgegeben hat.

### 4.4 Mein Votum
**16 Breite ist tragend und darf nicht wackeln. Die Höhe ist verhandelbar, aber dort liegt das Defizit nicht. CH-1 läuft auf 16x24.**

Begründung in einem Satz: Die Maßentscheidung kostet die Engine null und lässt sich daher ohne Lock-in um genau eine Runde verschieben, während die Handwerksentscheidung jede Runde kostet, in der sie nicht getroffen wird.

**Der Ausstiegs-Gate dazu, ausdrücklich vorab festgelegt:** Wenn nach CH-1 alle Handwerks-Messziele grün sind (Umriss <= 25, Symmetrie <= 65, Hue-Spanne >= 20 Grad je Rampe, Stofframpe >= 3 Stufen, dL-Band 25 bis 90) **und der Jury-Median trotzdem unter 8,0 liegt**, dann ist das Format bewiesenermaßen die Grenze und der Maßschnitt ist auf Beweis statt auf Vermutung gerechtfertigt.

**Falls wir dann wachsen: nicht 20x28, sondern 24x32.** Gründe: 24 sind exakt 1,5 Kacheln, 32 exakt 2 Kacheln, das ist das kanonische Verhältnis der Referenz; 20x28 ist ein Nicht-Vielfaches, das zu nichts passt, und bringt nur den Faktor 1,46 statt 2,0. Wenn wir den Welt-Umbau einmal bezahlen, dann für das Format, das die Vokabeln wirklich freischaltet. Und wir hätten mit dem Warden (24x32, bester Wert im Cast) bereits einen funktionierenden Eichkörper.

### 4.5 Ein billiger Gewinn, unabhängig von der Maßentscheidung
**Die Türen sind schon heute falsch.** Der 24px-Held ist bereits das 1,5-fache einer 16px-Tür. Alle 7 Türen sitzen in einer Wandzeile mit Wand oder Boden darüber (nachgeprüft: Positionen 21/4, 30/8, 5/9, 12/9, 5/18, 11/22, 25/23). Der Tilemap unterstützt Spans bereits (`span: [4,3]` für Dächer). Türen auf `span: [1,2]` zu heben kostet **2 Grids plus 7 Ein-Zeichen-Kartenänderungen** und behebt einen bestehenden Maßstabsbruch, der Michael heute schon ins Auge fällt. Das gehört in CH-1 als Nebenauftrag.

---

## 5. PASS-SCHNITT

**Grundsatz:** Jede Runde endet mit etwas, das Michael in unter einer Minute am Gerät sieht, und die **erste Runde ist der größte sichtbare Sprung**. Der größte sichtbare Sprung sind nicht mehr Animationsframes, sondern dass die Figuren aufhören, wie einander und wie ihre Häuser auszusehen.

### VORENTSCHEID (vor CH-1, Michael/Fable, blockierend)
Die Palette hat **61 alnum plus 3 Symbole, und genau ein freier alnum-Schlüssel ('l', verboten)**. Die Slice-6-Methode (Null-Texel-Töne umwidmen) hat die freien Töne bereits abgeerntet. Eine echte NPC-Stofframpe braucht 6 bis 8 neue Töne. **Ohne sanktionierte Palettenerweiterung (neuer Symbol-Namespace) ist §1/T5 für die NPCs nicht baubar.** Diese Entscheidung muss vor CH-1 fallen, nicht während.

**Zweiter Vorentscheid, operativ:** `sprites.js` ist eine Datei mit 10.454 Zeilen und die Regel "exklusiver Datei-Besitz" macht damit jeden Charakterpass zwangsweise seriell. `SPRITES` (Zeile 13) und `TILE_ART` (Zeile 2021) sind bereits zwei getrennte Exporte. **Aufteilung in `art/sprites_figuren.js` und `art/sprites_tiles.js` vor CH-1** ist ein mechanischer Schnitt, der jede künftige Charakterrunde parallelisierbar macht.

### CH-1 "DIE MENSCHEN BEKOMMEN KLEIDER UND GESICHTER" (grösster Sprung)
Umfang: Held plus 5 NPCs, **nur Standbilder**, keine neuen Animationszustände. Rund 21 Grids überarbeitet plus die 2 Türgrids.
Messziele: Kleider-Rampen verlassen die Gebäude-Rampen (Sperrliste je Biom) | Umriss <= 25 Prozent, >= 3 Umrisstöne | Symmetrie <= 65 Prozent | Profilähnlichkeit paarweise <= 70 | Hue-Spanne >= 20 Grad je Rampe | Stofframpe >= 3 Stufen ab 40 Texel | Rim auf allen sechs, >= 12 Prozent der Kontur | dL 25 bis 90 gegen jeden Boden | Solitär-Texel <= 8 Prozent.
Geräteauftrag an Michael: *"Lauf durch Gramfeld und schau dir die fünf Leute aus der Entfernung an. Erkennst du, wer wer ist, bevor du nah genug zum Reden bist?"*
Das ist die Runde, die "viel besser" beantwortet.

### CH-2 "DIE HORDE WIRD LESBAR"
Umfang: alle 5 Gegner plus der neue sechste Typ, Standbilder plus der Sterbe-Umbau.
Messziele: Skelett von dL 133 ins Band 25 bis 90 plus Mittelstufe | Grufthund raus aus der Erdrampe (heute dL -10 auf dem Weg) | Rostpanzer 35,3 auf <= 8 Prozent Solitär-Texel | Familienähnlichkeit <= 60 (heute 76/78) | zweistufiger Tod plus Decal-Liste | Flash statt Blink (0 Silhouetten-Verlust-Frames) | Tauschschlüssel je Typ definiert, 3 Varianten je Typ gezeichnet und gemessen | sechster Typ geboren.
Geräteauftrag: *"God-Mode, spawn viele Gegner, schau auf den Haufen. Kannst du sie auseinanderhalten? Fühlt sich Töten nach etwas an?"*
Das ist die Runde, die Slice 7 billiger macht.

### CH-3 "SIE BEWEGEN SICH"
Umfang: Animation. Held Attack 3-phasig je Richtung plus Hurt-Pose plus Umhang-Sekundärbewegung, NPC-Tätigkeits-Loops (Bran hämmert), Gegner Walk 2 auf 3/4, Idle-Umbau weg vom Ganzkörper-Sprung, **echte Sprech-Frames** (heute 4 Texel Unterschied, Silhouette 0).
Messziele: Sekundärbewegung >= 25 Prozent der Laufframes | Idle-Silhouetten-Diff 4 bis 10 Prozent, <= 50 Prozent davon starre Verschiebung | Angriff 3 Posen | Sprech-Frame >= 6 Prozent Texeldiff mit Silhouettenänderung.
Prozessregel aus der Recherche (Dead Cells): *Erst wenn die Animation mit der kleinstmöglichen Framezahl überzeugt und richtig getimt ist, kommen Zwischenframes dazu, und zwar VOR oder NACH den Keyframes, niemals dazwischen.*
Umfangreichste Runde (~40 bis 60 neue Grids). Muss nach CH-1/CH-2 liegen, sonst animieren wir die falschen Figuren.

### CH-4 "LICHT AUF DEN MENSCHEN" (optional, verschmilzt mit GP7-WELT)
Umfang: die Tint-Pipeline auf Figuren. Heute erreicht `WARM_ALPHA` **0,36** eines flachen Zwei-Ton-Orange über der ganzen Figur; GP6-Jury H3/K5 hat das bereits als "Figur wäscht am Licht monochrom braun" protokolliert. Ein Charakterpass, der in CH-1 Rampen repariert und dann eine 0,36-Orangewäsche darüberlaufen lässt, hat die Arbeit weggeworfen.
Messziele: Farbanzahl einer beleuchteten Figur sinkt um <= 20 Prozent gegen unbeleuchtet | Farbton jeder Rampe innerhalb 15 Grad erhalten | Rim aus CH-1 an die Tint-Richtung gekoppelt (`seite` existiert bereits in `pushTinted`).

### ABNAHME-INSTRUMENT (für alle Runden)
Die Pipeline existiert (`.tmp/shot_gfx*.py`, `g4_crops.py`, `build_strips.py`, `shot_god.py`). Was fehlt, ist ein **Figuren-Bogen**: alle Figuren, alle Frames, **auf drei verschiedenen Bodenmaterialien**, gerendert bei 1x und 6x nebeneinander, plus Squint-Ansicht. Das ist das Werkzeug, das eine Charakter-Jury braucht und das die Welt-Juries nie gebraucht haben. Einmal bauen, viermal benutzen.
