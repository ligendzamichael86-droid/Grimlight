# Grimlight — Game Design Document

Arbeitstitel: **Grimlight**. 2D-Action-Adventure für Android/iOS, SNES-Pixel-Look (320×180, 16×16-Tiles), Vanilla-JS/Canvas.
Bindend zusammen mit `SPEC_SLICE_0.md` und dem Slice-Fahrplan in `CLAUDE.md`. Slice-Marker: `[S0]`…`[S5]`.

## 1. Vision (3 Sätze)

Grimlight spielt sich wie ein SNES-Zelda: direktes Top-Down-Movement, präziser Schwertkampf, Herzen, Räume und Items, die neue Wege öffnen.
Es sieht und fühlt sich aber an wie Diablo: ein sterbendes Dorf über verfluchten Katakomben, Fackellicht in der Dunkelheit, Gold und Loot, das aus Gegnern klimpert.
Jede Sitzung auf dem Handy soll in unter einer Minute im Spiel sein und in 5 bis 15 Minuten einen spürbaren Fortschritt liefern: ein Raum tiefer, ein Item besser, ein Herz mehr.

## 2. Die 5 Design-Säulen

1. **Kampf von Zelda, nicht von Diablo.**
   Übernommen (A Link to the Past): manuelles Zielen über Blickrichtung, Schwert-Hitbox, Knockback, Unverwundbarkeits-Blinken, lesbare Gegner-Telegraphie. Explizit NICHT: Klick-auf-Gegner-Autoangriff, Trefferwürfel, Attack-Speed-Spam, Skill-Bars.
2. **Welt und Stimmung von Diablo, nicht von Zelda.**
   Übernommen (Diablo 1): das eine verfallene Dorf als Hub, Abstieg Ebene um Ebene, Dunkelheit plus Lichtquellen, entsättigte Palette, Knochen und Grabsteine. Explizit NICHT: Hyrule-Buntheit, Oberwelt mit vielen Biomen, freundliche NPC-Dörfer, Humor-Ton.
3. **Zwei Progressionsschienen, sauber getrennt.**
   Zelda-Schiene: feste Fähigkeits-Items (Zweitwaffe, Schlüssel, Herzcontainer) öffnen Räume und Spielweisen. Diablo-Schiene: zufällige Drops mit Affixen drehen nur an Zahlen. Explizit NICHT: zufällige Drops, die Wege freischalten, und keine festen Items mit Zufallswerten. (Details in Abschnitt 6.)
4. **Räume statt Arenen.**
   Von Zelda: handgebaute Räume mit Kollision, Platzierung und kleinen Kampf-Puzzles; von Diablo nur die Ebenen-Struktur, NICHT die Zufallsgenerierung der Layouts (alle Maps handgebaut, mindestens bis Slice 5).
5. **Handy zuerst, aber ohne Kompromiss beim Gefühl.**
   Kurze Sessions, große Touch-Ziele, sofortiges Weiterspielen. Explizit NICHT: Energie-Systeme, Timer, Monetarisierungs-Mechanik, Auto-Kampf.

## 3. Core Gameplay Loop

**30-Sekunden-Loop [S0]:** Raum betreten → Gegner lesen (Position, Verhalten) → mit Movement Position erarbeiten → Schwertschlag im richtigen Moment → Knockback/Treffer bestätigen → Drops (Gold, ab S2 Items, ab S1 Tränke) einsammeln → nächste Gegnergruppe oder Durchgang.
Spannungsquelle: eigene Herzen sind knapp, Kontaktschaden ist real, Heilung ist selten.

**Session-Loop (5–15 min):**
1. Im Dorf starten [S1]: Zustand prüfen, ab S2 Ausrüstung anlegen, ab S4 Save laden.
2. Zum Friedhof/Abstieg gehen, 2 bis 4 Räume/Ebenenabschnitte spielen [S0/S1/S3].
3. Beute heimbringen oder tiefer riskieren; Boss-Tür als Sitzungs-Höhepunkt [S3].
4. Rückkehr ins Dorf = sicherer Speicherpunkt [S4]; nächstes Ziel ist sichtbar (verschlossene Tür, fehlendes Item).

## 4. Welt-Skizze

Ein Ort, vertikal erzählt: oben das sterbende Dorf, darunter die Toten.

- **Gramfeld (Dorf-Hub) [S1]:** Verfallenes Dorf im Dauerzwielicht. Vernagelte Fenster, ein zögerndes Herdfeuer, zwei drei verängstigte Bewohner. Stimmung: Tristram — leise, wartend, letzter sicherer Ort. Funktion: Start, Heilung, ab S2 Ausrüstungs-Check, ab S4 Speicherpunkt.
- **Friedhof von Gramfeld [S0]:** Schiefe Grabsteine, kahle Bäume, ein schwarzer Teich, vereinzelte Fackeln gegen die Dunkelheit. Stimmung: offene Kälte, erste Skelette. Die spielbare Map aus Slice 0; ab S1 mit Abgang in die Tiefe.
- **Katakomben, Ebene 1 „Die Beinhäuser" [S1]:** Enge Gänge voller Knochenregale, Vasen und Kisten, Fackellicht als einzige Orientierung. Stimmung: klaustrophobisch, erste echte Dunkelheit (Licht-System). Zerschlagbares Inventar, Tränke.
- **Katakomben, Ebene 2 „Die Flüstergruft" [S3]:** Weitere Hallen, geflutete Abschnitte, mehrere verbundene Räume mit Übergängen. Stimmung: feucht, hallend, etwas beobachtet dich. Endet an der Boss-Kammer.
- **Boss-Kammer „Der Grabwächter" [S3]:** Runde Halle unter der Flüstergruft, Sitzungs- und Slice-3-Höhepunkt.
- Tiefere Ebenen (Slice 5+): nur angedeutet, verschlossenes Tor am Grund der Flüstergruft.

## 5. Gegner-Roster (Slices 0–3)

- **Skelett [S0]:** Wandert ziellos zwischen den Gräbern und nimmt die Verfolgung auf, sobald es den Spieler sieht; verletzt durch bloßen Kontakt. Stirbt nach zwei Treffern und zerfällt in eine Handvoll Münzen — der Lehrmeister für Abstand und Timing.
- **Grabratte [S1]:** Klein, schnell, flüchtet nach einem Biss kurz in die Dunkelheit und stößt aus unerwarteter Richtung wieder vor. Ein Treffer genügt, aber sie bestraft Stillstand und blindes Draufhalten.
- **Knochenwerfer [S1]:** Skelett-Variante, die auf Distanz bleibt und in langsamem Rhythmus Knochen wirft, weicht bei Annäherung zurück. Zwingt den Spieler, Räume aktiv zu durchqueren statt am Eingang zu kämpfen.
- **Grufthund [S2]:** Umkreist den Spieler und setzt zu einem telegraphierten Sprungbiss an, nach dem er kurz verwundbar liegen bleibt. Erster Gegner, der die S2-Zweitwaffe (Unterbrechen auf Distanz) belohnt.
- **Rostpanzer-Skelett [S2]:** Langsam, blockt Frontalangriffe mit Schild und ist nur von der Seite oder von hinten verwundbar. Lässt überdurchschnittlich oft Ausrüstung fallen.
- **Der Grabwächter (Boss) [S3]:** Massiver Knochenkoloss mit Zweihänder: langsame, weiträumige Schläge mit klarer Ausholphase, ruft in zwei Phasenwechseln Skelette als Verstärkung. Prüft alles Gelernte: Positionsspiel, Timing, Prioritäten unter Druck.
- **[S3] zusätzlich:** stärkere Elite-Varianten (mehr HP, Tempo) der S0–S2-Gegner für die Flüstergruft, keine neuen Verhaltensmuster.

## 6. Loot-Philosophie

**Grundsatz:** Fähigkeiten sind designt, Zahlen dürfen würfeln.

- **Zelda-Items (fest, platziert):** Zweitwaffe [S2], Herzcontainer [S3], Schlüssel/Boss-Schlüssel [S3]. Liegen an festen Orten oder hinter Bossen, droppen nie zufällig, schalten Spielweisen und Wege frei. Es gibt genau ein Exemplar, keine Varianten.
- **Diablo-Drops (zufällig, aus Gegnern/Vasen):** Gold [S0], Tränke [S1], Ausrüstung mit Affixen [S2] (z. B. Schwert „+1 Schaden", Ring „+10 % Tempo", Rüstung „+2 max. HP-Punkte"). Reine Zahlenprogression, niemals neue Verben, niemals Schlüssel zum Weiterkommen.
- **Warum die Trennung:** Zufalls-Loot darf den handgebauten Zelda-Fortschritt nie blockieren (kein „Pech gehabt, kein Schlüssel gedroppt") und feste Items dürfen nie entwertet werden („der Drop ist besser als das Boss-Item").
- Affix-Budget klein halten: pro Item höchstens 1–2 Affixe, Werte lesbar auf einem Handybildschirm [S2]. Gold als universeller Trostpreis und (ab S3) Währung im Dorf.

## 7. Touch-Steuerung (Philosophie)

- **Daumen-Ergonomie vor Menü-Tiefe:** linke Bildschirmhälfte = dynamischer Joystick (entsteht dort, wo der Daumen aufsetzt), rechte Hälfte = Angriff [S0]. Ab S2 maximal ein zweiter Button (Zweitwaffe); mehr Buttons gibt es nicht, eher gar keine neuen Verben.
- **Verzeihende Eingaben statt Präzisionszwang:** Deadzone am Joystick, große Trefferflächen, Angriffs-Hitbox großzügig in Blickrichtung; der Bildschirm-Daumen verdeckt nie das Spielgeschehen (HUD und Buttons halbtransparent, Spieler nie am unteren Rand gefangen).
- **Tastatur und Touch sind gleichberechtigt [S0]:** identisches Input-Interface (`dirX/dirY/attack`), kein Modus-Umschalten, Touch-Overlay erscheint nur bei Touch-Nutzung.
- **Session-Respekt [S4]:** Auto-Save an sicheren Punkten, sofortiges Fortsetzen nach App-Wechsel, keine Eingabe geht durch Pause/Resume verloren.

## 8. Inhalt nach Slices (Kurzreferenz)

| Slice | GDD-Inhalt |
|---|---|
| 0 | Friedhof, Skelett, Schwertkampf, Herzen, Gold, Touch+Tastatur, Title/GameOver/Victory |
| 1 | Dorf Gramfeld (Hub), Beinhäuser, Licht/Fackeln, Vasen, Tränke, Grabratte, Knochenwerfer |
| 2 | Affix-Drops, Ausrüstung/Inventar, Zelda-Zweitwaffe, Grufthund, Rostpanzer-Skelett |
| 3 | XP/Level, Flüstergruft (mehrere Räume), Schlüssel, Herzcontainer, Boss Grabwächter, Eliten, Gold-Händler |
| 4 | Capacitor-Apps, Save-System, Performance, Session-Respekt |
| 5 | Chiptune-Sound/Musik, Game-Feel-Polish, Ausblick tiefere Ebenen |
