# Art Direction — Grimlight

SNES-Pixel-Look, Diablo-Stimmung: entsättigt, dunkel, warme Lichtinseln.

## Palette (24 Farben, Schlüssel = Grid-Zeichen)

| Rampe | Schlüssel | Farben | Einsatz |
|---|---|---|---|
| Umriss/Schatten | k, n | #14101a, #221c26 | Konturen, Baumholz, Nacht |
| Stein | g, s, S | #3a3542, #575061, #7d7588 | Mauern, Grabsteine |
| Gras | e, E, m | #17211a, #22301f, #3a4a2e | Friedhofsboden, Moos |
| Erde | p, P | #453a34, #6b5a44 | Wege, Fackelpfosten |
| Knochen | B, b | #948b76, #d6cbb1 | Skelette, Knochenreste |
| Blut | r, R | #6e1a20, #ae2f2a | Herzen, Treffer |
| Feuer/Gold | Y, o, y | #97662a, #d8722a, #f0bf4e | Fackeln, Münzen, Griffe |
| Kaltblau/Stahl | c, C, i | #1d2f3d, #3c5a70, #92aec0 | Wasser-Ripple, Klingen |
| Held | u, U, h | #2c2434, #4a3d57, #c29267 | Umhang violett, Haut |
| Wasser | w | #0a0f14 | Teich, fast schwarz |

## Stilregeln

1. Jedes Objekt nutzt eine Hell/Mittel/Dunkel-Rampe, Licht kommt von oben links.
2. Alle Figuren haben eine geschlossene k-Kontur (klare Silhouette vor dunklem Boden).
3. Boden bleibt sehr dunkel (e/w als Basis); helle Töne (b, y, i) sind Akzente
   und lenken das Auge: Knochen, Gold, Klingen, Feuer.
4. Warm gegen kalt: Fackel-Orange/Gelb sind die einzigen warmen Lichtquellen,
   der Rest der Welt ist kalt-grün/grau/blau.
5. Held: violetter Kapuzen-Umhang (u/U), Gesicht im Hutschatten, Schwert immer
   sichtbar (unten seitlich, oben auf dem Rücken, seitlich in der Hand).
6. Skelette: b/B-Knochen mit tiefen k-Augenhöhlen und Rippen-Lücken.
7. Nichts steht gerade: Grabsteine leicht schief, Bäume knorrig und kahl,
   Wege fleckig. Perfekte Symmetrie nur bei HUD-Elementen.
8. Tiles sind voll deckend (kein '.'), Figuren-Sprites nutzen Transparenz.
9. Lauf-Frames unterscheiden sich mindestens in der Beinstellung.
10. Neue Farben nur als komplette Rampe und nur, wenn keine bestehende passt.

## Slice 1 — Katakomben, Ghul, Props (Ergänzung)

Neue Palettenrampen (10 Farben, insgesamt 34):

| Rampe | Schlüssel | Farben | Einsatz |
|---|---|---|---|
| Katakomben-Stein (kalt) | t, T, L | #23262d, #3d434d, #5f6774 | Boden, Ziegelwand, Säulen, Urnen |
| Ghul-Fleisch | d, G, H | #4c5a3a, #75855a, #a9b287 | Ghul: fahle Haut hell oben, dunkle Glieder |
| Holz | q, Q | #3a291d, #6f4d2f | Truhe, Vase |
| Trank | x | #e0524c | Heiltrank-Flasche (leuchtend) |
| Nebel | f | #8a92a0 | fog_blob, einziger Fog-Ton |

Stilregeln Slice 1:

1. Katakomben sind KALT: t/T/L-Grau statt des violetten Friedhof-Steins (g/s/S),
   Moosakzente (m) sparsam als einziges Leben; einzige Wärme sind die Wandfackeln.
2. Ghul: aufgedunsener Untoter in Erd-Fetzen (p/P um die Hüfte), breiter und
   massiger als ein Skelett, tiefe k-Augenhöhlen in fahlem H-Schädel, hängende Arme.
3. Held-Laufzyklus: 4 Frames pro Richtung, Beinstellungen
   Kontakt / Passing / Kontakt gespiegelt / Passing; Passing-Frames haben kürzere
   Beine (Körper-Bob), die beiden Passing-Frames unterscheiden sich leicht.
4. Truhe: dunkles Holz (q) mit Y-Beschlägen; im geschlossenen Deckel-Spalt
   schimmert Gold (y) — das Slice-Ziel lockt sichtbar.
5. torch_wall-Frames flackern deutlich: Frame 0 hohe Flamme leicht links,
   Frame 1 kürzere Flamme nach rechts geduckt (nicht nur 1 Pixel Unterschied).
6. fog_blob nutzt genau EINEN Grauton (f) plus Transparenz; Tiefe entsteht
   im Spiel über globalAlpha und Drift, nicht über die Pixel.
