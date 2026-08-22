# GP7-CH-1 STIL-ANKER HELD (22.08.2026) — Regeln, die jede Figur erbt

Held Versuch 2 ist vom Bild-Juror FREIGEGEBEN (6,0 -> 7,9 -> 8,4).
Commit d95f3fe + Profil-Politur. Die NPCs (1b) und spaeter die
Gegner (CH-2) bauen auf diesen Regeln — sie sind BINDEND:

1. SEITENFRAMES FLIP-NEUTRAL: Licht von OBEN (Kuppel/Schulter-
   Oberkante), keine senkrechte Lichtkante. Abnahmeregel: gemessene
   Links/Rechts-dL der Koerpertexel in Seitenframes <= 5 L
   (Held: 2,6-5,2 gegen 21,4 frontal). Front/Rueck: oben-links.
2. SELEKTIVES OUTLINE BIS ZU DEN STIEFELN: Schattenseite k,
   Lichtseite dunkelster Materialton (u/q statt k), kein schwarzer
   Vollring um Beine/Fuesse. Kante LUECKENLOS (Stilregel 2 neu).
3. SEKUNDAERBEWEGUNG AUF DER SILHOUETTE (Saum, Kante, Requisit),
   NIE als Einzeltexel-Tausch im Flaecheninneren (liest als
   Rauschen, zaehlt als Solitaer).
4. REQUISITEN (Griff, Klinge, Speer, Stock, Buch, Schnallen,
   Tasche) sind als Material-Tabellen-Flaeche art:"requisit"
   deklariert und aus dem Solitaer-Gate ausgenommen; Augen/Glanz
   als art:"merkmal" (max 12/Grid).
5. UMRISS-GATE = SCHWARZANTEIL (T2): k+n <= 25 % (Held 20,5) und
   >= 3 Konturtoene >= 8 Texel (ohne Requisit). Die geometrische
   Kontur/opak-Kennzahl beschreibt nur die Koerperform (Beinspalt)
   und ist KEIN Gate mehr (G-B).
6. GESICHTSKONSTRUKTION (frontal): nnnnn-Brauenband, darunter
   hkhk2 (zwei k-Augen, h-Nasensteg), obere Wangenzeile dunkel (2),
   nur schmales h-Band um die Augen -> "von unter der Kapuzenkante
   angeleuchtet", nicht angestrahlt. Profil: Auge 1 Hauttexel vor
   der Front, Nase 1 Texel raus, Kinnstufe, n-Mundlinie.
7. RIM: warm ('_') als 2-3 Texel harter Glanzpunkt auf der Kuppel +
   die hellste STOFF-Stufe (beim Held Z) als weiche Lichtkante —
   nie der kalte Rim-Ton '|' auf warmem/violettem Stoff (liest als
   Eis). Dosis klein: 1 px, kein Pelzbesatz.
8. RAMPEN: 5 Stufen mit monotonem L UND monotoner Hue (keine
   Ruecksprung-Stufe wie u->^->X), Zwischenstufen als echte Stufen,
   nicht als Fleck. Max. Einzelton einer Materialflaeche <= 55 %.
9. ANIMATION: Frame-Diffs NIE unter den Vorher-Untergrenzen; bei
   NPC-Talk-Frames ist das Ziel >= 6 % Texel-Diff MIT Silhouetten-
   aenderung (Mund, Kopfneigung, Hand).
10. MESSEN + SEHEN: jede Runde 6x rendern und ANSCHAUEN; Zahlen
    sind Leitplanken, Lesbarkeit ist das Gate.
Welt-Backlog (nicht Figur): dorf_stufe dE00 3,1 gegen den Helden.
