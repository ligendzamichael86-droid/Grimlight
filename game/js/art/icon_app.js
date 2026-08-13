// =============================================================================
// App-Launcher-Icon als Pixel-Grid — Slice 4, Spec §0.7.
// =============================================================================
// REINES DATENMODUL. Es wird von KEINEM Spielmodul importiert und ist
// ABSICHTLICH NICHT Teil von SPRITES / TILE_ART aus art/sprites.js:
//   * check_gfx6_art.mjs validiert jedes SPRITES-Grid gegen die Grid-Masse
//     der Figuren-/Kachel-Klassen (16x16 ... 64x48) — ein 32x32-Icon waere
//     dort ein Fehlbefund (Review P1-M9).
//   * buildAll(SPRITES) in main.js:50 rastert JEDEN Key beim Spielstart in ein
//     Canvas und legt ihn in die MASK_REG. Ein Launcher-Icon dort waere pro
//     Boot verschwendete Arbeit und wuerde die Canvas-Reihenfolge der
//     Flusstests verschieben.
// Einziger Leser ist tools/render_icon.mjs (Node), das daraus die
// Android-mipmap-PNGs erzeugt. CLAUDE.md-Regel 3 ("Grafik als Code") bleibt
// damit gewahrt: im Repo liegt Text, die Binaerdateien entstehen beim Build
// unterhalb des gitignorierten mobile/android/.
//
// FORMAT wie in art/sprites.js: jedes Zeichen ist ein PALETTE-Schluessel,
// '.' = transparent. Genau 32 Zeilen a 32 Zeichen.
//
// MOTIV: die Fackel — das Erkennungszeichen des Spiels (Grimlight = grim +
// light). Farbrampe wie die Bestands-Fackel TILE_ART.torch_0:
//   r (#6e1a20) -> R (#ae2f2a) -> o (#d8722a) -> y (#f0bf4e) -> 1 (#ffe9b0)
// Der Kern '1' sitzt tief in der Flamme, der Saum aussen dunkelrot; der
// Pfosten nutzt die Erd-Rampe p/P/V mit k-Umriss und einer Lederwicklung
// q/j/J. Das Motiv liegt zwischen Spalte 9 und 22 und den Zeilen 1..30, hat
// also auf allen vier Seiten Rand — noetig fuer die 66-%-Sicherheitszone des
// adaptiven Android-Icons (Vordergrund-Ebene).
//
// KEIN Zufall, KEIN Zeitstempel — der Quelltext-Waechter in
// smoke_test.mjs:1762 liest den ROHTEXT jeder Datei unter art/, die beiden
// verbotenen Aufrufnamen duerfen hier also nicht einmal im Kommentar stehen.
// =============================================================================

// Hintergrundfarbe der Launcher-Kachel und des adaptiven Icons.
// Grimlight-Dunkelgruen = PALETTE['+'] (#1a2a1b, Laub sehr dunkel).
// tools/build_apk.sh schreibt diesen Wert idempotent nach
// mobile/android/app/src/main/res/values/ic_launcher_background.xml.
export const ICON_APP_BG = '#1a2a1b';

// Groesse des Grids (Kantenlaenge in Pixeln). Quadratisch.
export const ICON_APP_SIZE = 32;

export const ICON_APP = [
  '................................',
  '.................rr.............',
  '................rRr.............',
  '...............rRRr.............',
  '..............rRoRr.............',
  '.............rRoyoRr............',
  '.............rRoyyoRr...........',
  '............rRoyyyoRr...........',
  '...........rRoyyyyyoRr..........',
  '...........rRoyyyyyoRr..........',
  '..........rRoyy111yyoRr.........',
  '..........rRoyy111yyoRr.........',
  '.........rRoyy1111yyoRr.........',
  '.........rRoyy1111yyoRr.........',
  '.........rRoyy1111yyoRr.........',
  '.........rRoyy1111yyoRr.........',
  '..........rRoyy11yyoRr..........',
  '...........rRoyyyyoRr...........',
  '............rRoyyoRr............',
  '.............rRooRr.............',
  '............kpPVVPpk............',
  '............kpPVVPpk............',
  '............kqjJJjqk............',
  '............kqjJJjqk............',
  '............kpPVVPpk............',
  '............kpPVVPpk............',
  '............kpPVVPpk............',
  '............kpPVVPpk............',
  '............kpPVVPpk............',
  '...........kppPVVPppk...........',
  '...........kkkkkkkkkk...........',
  '................................',
];
