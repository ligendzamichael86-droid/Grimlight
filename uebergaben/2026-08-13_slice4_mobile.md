# Übergabe 2026-08-13 — Slice 4 "Mobile" ABGENOMMEN

**Abnahme durch Michael am Gerät (A7): "sieht gut aus."** Grimlight
läuft als installierte Android-App — das Projektziel (Handyspiel)
ist erstmals physisch erfüllt.

## Geliefert

- **Android-APK** (3,9 MB, de.grimlight.app, minSdk 22/target 34,
  einzige Permission INTERNET): Capacitor 6.2.1, webDir = ../game
  (kein Spiegel), Querformat-Lock, Vollbild, adaptives Launcher-Icon
  aus Pixel-Grid (game/js/art/icon_app.js + tools/render_icon.mjs —
  keine Binärdatei im Repo). Toolchain (JDK 17 + SDK 34, gepinnt mit
  sha256) in toolchain/ (gitignored), reproduzierbar via
  tools/setup_android_toolchain.sh; Build via tools/build_apk.sh
  (kalt ~2 min, warm ~15 s, idempotente Patches); Auslieferung via
  tools/serve_apk.py (Port 8125; Datei-Direktlinks geben ohne
  Login-Cookie 401 → IMMER über die Startseite /proxy/8125/ gehen,
  steht in tools/ANLEITUNG_APK.md).
- **Save-System v1** (game/js/items/save.js, rein + Node-testbar):
  speichert bei Kartenwechsel/Respawn/Pause/Back — NIE in
  buildWorld/resetRun (Review-Falle: hätte hp=0 gespeichert);
  Titel-Menü FORTSETZEN/NEU; openedChests gegen die Gold-Farm
  (Siegtruhe deklariert ausgenommen; resetRun leert die Liste).
- **Lifecycle:** Pause-State bei App-Wechsel/pagehide mit Auto-Save;
  Android-Zurück-Taste → Pause-Menü (WEITER/NEUSTART/GOTT/FPS)
  via @capacitor/app; GOTT-Toggle baut den Spieler korrekt neu
  (Laufzeit-Flag allein boostet nicht — Review-Beleg).
- **Touch-Ergonomie:** Zonen-Geometrie (Unterkanten ≥ 24 px über
  Canvas-Rand, Joystick-Vollausschlag 12,1 mm, Lücken-Gates),
  Halbpixel-Fix (Gerätepixel-Rundung), Hochformat-Hinweis (rein
  CSS), manifest.json (ohne Icons, deklariert).
- **Performance:** LUT-Memoisierung am Licht-Objekt + interner
  Lauf-Puffer — PIXEL-GLEICH bewiesen über die in Phase 0
  eingefrorenen S4-GOLD-Op-Strom-Hashes (3 Setups, scharf
  gestellt mit Negativ-Kontrollen).

## Test-Bilanz

Kanonische Flusstests NULL angefasst (erster Slice ohne jede
sanktionierte Zeile). Smoke +139 additive Assertions (S4-§7F(gold)
+ (a)-(f)); NEU tools/check_save_slice4.mjs (48 Assertions, 6 Boots
per ?boot=N-Cache-Busting). Alle Suiten grün inkl. GP6-Art-Check
und probe_god.

## Deklarationen / bekannte Punkte

1. App- und Browser-Spielstand sind ZWEI getrennte Stände
   (Origin https://localhost vs Proxy-Domain).
2. Inventar-Zeilenhöhe 20 überlappt bei VOLLEM Beutel (7 Items)
   den ANLEGEN-Knopf — kosmetisch, 69 mm Trefffläche bleibt;
   sauberer Layout-Fix braucht Test-Freigabe → Slice 5.
3. Debug-Signatur ("unbekannter Entwickler"-Dialog ist normal);
   Play-Store-Release = eigener Keystore, spätere Arbeit.
4. iOS aus Scope (braucht macOS). PWA nur Manifest, kein SW.
5. Vasen/Gegner respawnen (Bestand); Siegtruhen-Refill bleibt.
6. platform-tools "latest"; Kaltstart braucht Netz (4 Hosts).

## Bindende Erkenntnisse (auch für kommende Slices)

1. Browser-API-Zugriffe in main.js IMMER mit typeof+try/catch-Guard
   — die Flusstest-Stubs sind minimal und getElementById liefert
   IMMER das Canvas.
2. Vor Renderer-Optimierungen: Op-Strom-Hashes in EIGENEM Commit
   einfrieren (S4-GOLD-Muster) — "pixel-gleich" ist beweisbar.
3. Suiten-Ausgaben explizit greppen, nie nur Exit-Code/tail
   (Top-Level-await-Absturz kann Exit 0 liefern).
4. Closure-Konstanten (godBoost) sind laufzeit-immun — Zustand,
   der umschaltbar sein soll, braucht Neubau oder echte Felder.
5. Der code-server-Proxy: Datei-Links 401 ohne Cookie,
   Seiten-Links leiten zum Login — Download-Flows brauchen eine
   Startseite.

## Commits

Landkarte+Spec 57ed4a1 · Rev 2 d7e7ef7 · Build 43f40aa ·
Abschluss (dieser). APK: mobile/android/app/build/outputs/apk/
debug/app-debug.apk (sha256 bcb24886…e8cd).

## Testen (Michael)

Browser wie immer Port 8123. APK neu bauen: `bash
tools/build_apk.sh`; ausliefern: `python3 tools/serve_apk.py`
(dann Handy → /proxy/8125/). Anleitung: tools/ANLEITUNG_APK.md.
