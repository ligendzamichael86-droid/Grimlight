# Uebergabe GP7-CH-1 "Die Menschen" — Charakter-Pass 1 (10.09.2026)

Michael-Direktive 16.08.: Menschen "viel besser", Spieldynamik bleibt.
Stand: HEAD 9ef18ee, APK 10.09. 18:23 auf 8125. **Cast-Juror:
GESAMTER CAST FREIGEGEBEN — "Viel besser? Ja."** MICHAELS GERAETETEST
= finale Abnahme (offen): "Erkennst du aus der Entfernung, wer wer
ist? Sehen die Menschen viel besser aus?"

## Ergebnis in Zahlen (Bild-Juroren, Skala 10 = herausragende
moderne Handy-Pixel-Art, SoM 8,5-9, Bestandswelt 7,5)

| Figur | vorher | nachher |
|---|---|---|
| Held | 6,0 | **8,4** (Stil-Anker) |
| Bran | 5,5 | **7,5** |
| Hedda | 5,5 | **7,3** |
| Corm | 5,5 | **8,0** |
| Mile | 5,0 | **7,7** |
| Torwaechter | 6,0 | **7,8** |
| Cast (Median 6) | 5,75 | **7,75** |

Squint-Test bei 1x: alle sechs benennbar (vorher: "vier identische
Briefkaesten"). Messziele (P0.d, 9 Familien): alle Kern-Gates gruen;
deklarierte Aufloesungen G-A..G-N in design/SPEC_GP7CH1.md.
Bestandsschutz: Held-M3/M4/M5 gruen, DORF-M1 d1-d6 + 5 Bestands-
karten gruen mit neuem Cast, 0 Konsolenfehler, Smoke 825, gfx6.

## Was geliefert ist
- Held: 20 Grids neu (Kapuze schmaler als Schultern, Gesicht mit
  3 Merkmalen frontal+Profil, Rampe u/U/X/^/Z, Rim Z+_ flip-neutral,
  Sel-Out-Kante, Schwarz 35->23 %, Animation lebendiger).
- 5 NPCs: 15 Grids neu nach Steckbriefen (Bran breit+schief mit
  Hammer/Stein-Bart/Leder; Hedda Kegel+Diagonalstock+Krapp-Rampe;
  Corm hoch+schmal, Buch, dunkle Petrol-Wolle; Mile Kinderproportion,
  Tasche+Bandelier, Stahlblau-Kittel; Torwaechter geneigter Speer,
  Stahlhaube, Rost exklusiv). Echte Talk-Frames (10-22 %), T9-Idle.
- Palette +14 Symbol-Toene (Stoff-Rampen, Rim), Tueren 2 Kacheln
  breit, ANCHOR/Stilbibel-Sanktionen, Torwaechter-Anker ohne
  Eintritts-Ueberlappung. Werkzeuge: tools/figuren_bogen.mjs,
  .tmp/gp7ch_p0/figuren_messung.mjs (9 Gate-Familien, vorher/
  nachher, Materialflaechen-dE00). Vorher/Nachher-Boegen versioniert
  in design/referenz/.

## Wie man testet
APK ueber die Startseite /proxy/8125/ (Direktlinks 401). Im Dorf:
alle fuenf aus der Entfernung erkennen, mit allen reden (Sprech-
Bilder), Held auf Weg/Lehm/Gras ansehen (Kontrast ueber Farbton+Rim).
Werkzeug: node tools/figuren_bogen.mjs nachher <ziel>; Messung:
node .tmp/gp7ch_p0/figuren_messung.mjs --beides --vorher-zeiger
75106c7 --material .tmp/gp7ch_p0/material_phase1b_merge.json

## Bindende Erkenntnisse (neu)
1. ART-FIRST: Zeichner muessen ihre Renders SEHEN (direkte Agenten,
   Read auf PNG) — Workflow-Agenten optimieren blind gegen Zahlen
   (Versuch 1 abgelehnt: +45 L, Animation zerstoert).
2. Untergrenzen sind so wichtig wie Obergrenzen (Frame-Diffs,
   Koerper-L-Band); Idle-Ganzkoerper-Verschiebung ist keine Bewegung.
3. Gates an der Bestandskunst RUECKRECHNEN, bevor sie eingefroren
   werden (dL-Band-Kollaps, Tuer-Span-Wurf, Palettenbudget — alle
   erst im Review gefunden).
4. Flip-neutrales Seitenlicht (Engine spiegelt) — Anker-Regel 1.
5. dE00 auf der dominanten Materialflaeche, nicht Ganzkoerper (G-N).
6. NIE zwei Orchestrator-Sitzungen auf einem Projekt (10.09.:
   Parallel-Instanz ueberschrieb Bran/Hedda; ListAgents pruefen).
7. Nachher-Bogen IMMER nach dem letzten Commit rendern (zweimal
   veraltet gewesen).

## Offen / Optionen (fuer Michaels Urteil)
- **Dorf heller als sein Held:** 4 von 5 Bewohnern stehen bei L
  106-120, der Held bei 76 — erzwungen durch die E1-Weg-Untergrenze
  (117 L) ihrer Standkacheln. OPTION bei "immer noch zu hell": die
  vier NPC-Standkacheln in map_dorf.js von Weg '=' auf Lehm '.'
  setzen (Untergrenze 100) und eine gemeinsame Abdunklungsrunde
  fahren — 4 Zeichen + eine Zeichenrunde, keine neue Etappe.
  Heddas "staubig" ist nur so erreichbar (Box: E1 unten, Bran warm,
  Held kalt — bewiesen).
- Bran/Torwaechter Leitton 10,5 dE00 (beobachten); Brans Stein-Bart
  liegt im Violett-Sektor (h 303-307, C 11-13) — CH-4-Notiz; drei
  Graufamilien an Bran.
- Nicht in CH-1: Idle-Atmen/Hurt/Anticipation (Held 17 statt 42
  Grids) = CH-3; Hue-Spannen der Bestandsrampen (Haut 2 Stufen) =
  Paletten-Vorentscheid; Flash statt Blink + Gegner = CH-2.
- V3-Ausstiegs-Gate (24x32) NICHT ausgeloest: Median 7,75 < 8,0,
  aber die Handwerks-Gates sind erst teils gruen (Profil-Paare) —
  Entscheid nach Michaels Urteil.

## Naechste Schritte
Michael-Geraetetest -> ggf. Dorf-Abdunklungsoption -> CH-2 "Die
Horde wird lesbar" (Gegner: Skelett dL 133, Grufthund -10, Rostpanzer
Rauschen, zweistufiges Sterben, Flash statt Blink — Horden-Vorgriff)
-> CH-3 Animation -> CH-4 Licht auf Figuren. Slice-6-Abnahme haengt
weiter an Michaels Optik-Urteil (Menschen + Dorf).
