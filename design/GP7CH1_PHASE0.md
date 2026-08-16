# GP7-CH-1 Phase 0 — Ergebnisse + Rev-2.1-Entscheide (16.08.2026, Fable)

Commits: 75106c7 (P0.a Split), b9a5029 (P0.c+e Bogen+Referenz).
Der V-P0-Pruefer liess 5 Restpunkte (R1-R5) — hier die bindenden
Aufloesungen; wo Zahlen stehen, ERSETZEN sie die Rev-2-Schaetzwerte.

## REV-2.1-ENTSCHEIDE (Fable, nach V-P0)

R1 **Gruft-Stein-Band korrigiert:** Das in Rev 2 eingefrorene
85..127 war FALSCH (Pruefer-Schaetzwert; das begehbare
floor_decal_bones L70,03 in BOSS_KAMMER hebt die Untergrenze).
BINDEND: **95,03..127,51** und generell gelten die von P0.d aus
den ECHTEN Karten gerechneten Baender (Tabelle unten), nicht die
Review-Schaetzungen.
R2 **Ersatzklausel klassenweit:** dE00>=25 gilt gegen die
SCHLECHTESTE (dE00-niedrigste) auf Karten platzierte Kachel der
jeweiligen Bodenklasse, nie gegen eine Vertreterin.
R3 **Bodenklassen-Zugehoerigkeit:** Nur Kachel-Arts, die auf
mindestens einer Karte PLATZIERT sind (P0.d-Definition ist
massgeblich; TILE_ART-Praefix-Gruppierung ist verboten — path_v4
liegt auf keiner Karte).
R4 **P0-Commits:** erledigt (75106c7, b9a5029, dieses Dokument).
R5 **Referenz-Bogen-Luecke:** attack/die/sword_slash fehlen —
wird per Nachfix ergaenzt und neu committet BEVOR Phase 1a
startet (M15-Gate).
**HELD-ENTSCHEID (loest Review-B1 endgueltig):** Das L-Fenster
des Helden (Schnitt aller 4 Klassen = 116,7..127,5, nur 10,8 L)
wird NICHT benutzt — ein +48-L-Sprung wuerde den duesteren Helden
zerstoeren (ART_DIRECTION). Der Held laeuft AUSSCHLIESSLICH ueber
den dE00-Pfad: dE00 >= 25 gegen die schlechteste Kachel JEDER
Wirkort-Klasse (heute: 23,7 gegen path_v5 — knapp drunter; Phase
1a muss das Violett entsprechend schaerfen: staerkere Saettigung/
Hue-Konsequenz + neue X-Z-Zwischenstufe + Rim). NPCs: je Figur
L-Fenster ODER dE00-Pfad nach P0.d-Tabelle.

## GEBUNDENE ZAHLEN AUS PHASE 0

### Die 14 neuen Toene (P0.b, nach Fixer-Korrektur '^')

| Zeichen | Hex | L | C*ab | Hue | Rolle |
|---|---|---|---|---|---|
| ! | #5b3438 | 64.1 | 18.8 | 15.5 | Hedda — Krapp-Wolle, G-Rampe geschlossen (Schatten WARM Richtung Braunrot, E3/M12) |
| % | #a07887 | 133.7 | 18.2 | 353.5 | Hedda — Krapp-Wolle, G-Rampe geschlossen (Schatten WARM Richtung Braunrot, E3/M12) |
| & | #188185 | 98.1 | 28.1 | 201.5 | Corm — Wolle, eigene Petrol-Familie (NICHT Stein g/s/S, NICHT Erde); L601 an das P0.d-Fenster 116,71..159,37 gelegt |
| ( | #4b918a | 123.3 | 24.0 | 187.4 | Corm — Wolle, eigene Petrol-Familie (NICHT Stein g/s/S, NICHT Erde); L601 an das P0.d-Fenster 116,71..159,37 gelegt |
| ) | #71a394 | 146.3 | 20.2 | 173.0 | Corm — Wolle, eigene Petrol-Familie (NICHT Stein g/s/S, NICHT Erde); L601 an das P0.d-Fenster 116,71..159,37 gelegt |
| : | #795a57 | 98.9 | 14.0 | 28.6 | Bran — versengtes Leder, eigene warme Familie (NICHT Rost 4/5/6, NICHT Holz) |
| ; | #a77769 | 131.8 | 22.7 | 41.9 | Bran — versengtes Leder, eigene warme Familie (NICHT Rost 4/5/6, NICHT Holz) |
| ? | #b0988c | 157.8 | 11.8 | 54.1 | Bran — versengtes Leder, eigene warme Familie (NICHT Rost 4/5/6, NICHT Holz) |
| @ | #327596 | 100.7 | 26.3 | 246.8 | Mile — Kittel, eigene Stahlblau-Familie (NICHT Krapp, NICHT Gruen, NICHT Leinen/Knochen) |
| [ | #4691b0 | 126.1 | 27.1 | 239.2 | Mile — Kittel, eigene Stahlblau-Familie (NICHT Krapp, NICHT Gruen, NICHT Leinen/Knochen) |
| ] | #62adba | 152.1 | 24.2 | 215.1 | Mile — Kittel, eigene Stahlblau-Familie (NICHT Krapp, NICHT Gruen, NICHT Leinen/Knochen) |
| ^ | #6c75a8 | 120.1 | 29.9 | 288.3 | Held — Zwischenstufe in der X->Z-Schlucht (Schrittverhaeltnis 1,745 -> <=1,6) |
| _ | #e0c3c3 | 203.7 | 10.9 | 20.2 | Rim-Toene hell, warm + kalt einsetzbar — deklarierte Ausnahme Stilregel 10 |
| | | #abdcda | 205.1 | 16.7 | 194.6 | Rim-Toene hell, warm + kalt einsetzbar — deklarierte Ausnahme Stilregel 10 |

### E1-Fenstertabelle (P0.d, figuren_e1fenster.json — BINDEND)

```json
{
 "e1": {
  "de00_reichweite": {
   "hinweis": "max erreichbares min-dE00 ueber ALLE Kacheln der Klasse, Rasterscan des sRGB-Wuerfels",
   "klassen": {
    "DORF-Lehm": {
     "alle": {
      "C<=15": {
       "max_dE00_je_L": {
        "50": 22.5756,
        "60": 22.1189,
        "70": 21.7149,
        "80": 22.271,
        "90": 23.0072,
        "100": 24.4162,
        "110": 26.4061,
        "116": 27.7899,
        "120": 28.9679,
        "130": 31.6839,
        "140": 35.3065,
        "150": 38.5923,
        "160": 41.9066,
        "170": 45.0956
       },
       "max_dE00_je_L_voll": {
        "40": 23.2529,
        "42": 23.1236,
        "44": 23.0843,
        "46": 22.5131,
        "48": 22.7381,
        "50": 22.5756,
        "52": 22.1535,
        "54": 22.2879,
        "56": 22.1878,
        "58": 22.1026,
        "60": 22.1189,
        "62": 22.0838,
        "64": 22.0158,
        "66": 22.0256,
        "68": 21.8504,
        "70": 21.7149,
        "72": 21.91,
        "74": 22.0043,
        "76": 21.8969,
        "78": 22.1215,
        "80": 22.271,
        "82": 22.2109,
        "84": 22.4681,
        "86": 22.7134,
        "88": 22.7261,
        "90": 23.0072,
        "92": 23.3497,
        "94": 23.5387,
        "96": 23.7423,
        "98": 24.1799,
        "100": 24.4162,
        "102": 24.6959,
        "104": 25.2005,
        "106": 25.4796,
        "108": 25.8353,
        "110": 26.4061,
        "112": 26.7234,
        "114": 27.1542,
        "116": 27.7899,
        "118": 28.1412,
        "120": 28.9679,
        "122": 29.7586,
        "124": 29.9396,
        "126": 30.5896,
        "128": 31.4601,
        "130": 31.6839,
        "132": 32.4771,
        "134": 33.3144,
        "136": 33.5782,
        "138": 34.4083,
        "140": 35.3065,
        "142": 35.6053,
        "144": 36.4629,
        "146": 37.4045,
        "148": 37.7273,
        "150": 38.5923,
        "152": 39.5409,
        "154": 39.8676,
        "156": 40.7042,
        "158": 41.6032,
        "160": 41.9066,
        "162": 42.6732,
        "164": 43.4712,
        "166": 43.7324,
        "168": 44.4089,
        "170": 45.0956,
        "172": 45.3155,
        "174": 46.0275,
        "176": 46.5159,
        "178": 46.7101,
        "180": 47.3606
       },
       "reichweite_L": [
        [
         104,
         180
        ]
       ],
       "reichweite_L_huelle": [
        104,
        180
       ]
      },
      "C<=20": {
       "max_dE00_je_L": {
        "50": 24.7237,
        "60": 24.4816,
        "70": 24.5859,
        "80": 25.023,
        "90": 26.2304,
        "100": 27.5998,
        "110": 29.3336,
        "116": 30.5374,
        "120": 31.7383,
        "130": 34.4671,
        "140": 37.4533,
        "150": 41.1345,
        "160": 44.2772,
        "170": 46.8879
       },
       "max_dE00_je_L_voll": {
        "40": 24.8672,
        "42": 24.9012,
        "44": 24.9553,
        "46": 24.8301,
        "48": 24.7511,
        "50": 24.7237,
        "52": 24.726,
        "54": 24.7596,
        "56": 24.5849,
        "58": 24.6838,
        "60": 24.4816,
        "62": 24.6712,
        "64": 24.6538,
        "66": 24.6856,
        "68": 24.7582,
        "70": 24.5859,
        "72": 24.8934,
        "74": 25.0303,
        "76": 24.9857,
        "78": 25.0987,
        "80": 25.023,
        "82": 25.3303,
        "84": 25.5606,
        "86": 25.6285,
        "88": 25.9618,
        "90": 26.2304,
        "92": 26.2617,
        "94": 26.6682,
        "96": 27.071,
        "98": 27.1141,
        "100": 27.5998,
        "102": 28.0714,
        "104": 28.136,
        "106": 28.6315,
        "108": 28.9485,
        "110": 29.3336,
        "112": 29.7312,
        "114": 30.2636,
        "116": 30.5374,
        "118": 31.1561,
        "120": 31.7383,
        "122": 32.0464,
        "124": 32.7364,
        "126": 33.3685,
        "128": 33.7081,
        "130": 34.4671,
        "132": 35.1479,
        "134": 35.5156,
        "136": 36.3384,
        "138": 37.0627,
        "140": 37.4533,
        "142": 38.3272,
        "144": 39.0809,
        "146": 39.485,
        "148": 40.3814,
        "150": 41.1345,
        "152": 41.5356,
        "154": 42.4051,
        "156": 43.1123,
        "158": 43.6363,
        "160": 44.2772,
        "162": 44.9008,
        "164": 45.3754,
        "166": 45.9227,
        "168": 46.4585,
        "170": 46.8879,
        "172": 47.3844,
        "174": 48.0464,
        "176": 48.2249,
        "178": 48.6781,
        "180": 49.2861
       },
       "reichweite_L": [
        [
         74,
         74
        ],
        [
         78,
         180
        ]
       ],
       "reichweite_L_huelle": [
        74,
        180
       ]
      },
      "C<=25": {
       "max_dE00_je_L": {
        "50": 25.5184,
        "60": 26.1121,
        "70": 27.0192,
        "80": 27.9606,
        "90": 28.6572,
        "100": 30.0821,
        "110": 31.8238,
        "116": 33.2361,
        "120": 34.54,
        "130": 37.0
```
