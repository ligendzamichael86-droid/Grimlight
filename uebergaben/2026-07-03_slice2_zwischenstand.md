# Zwischenstand: Slice 2 "Loot & Inventar" (Session 03.07.2026, abends)

Dies ist KEINE Abschluss-Übergabe. Slice 2 ist in Arbeit; dieses Dokument
sichert den Stand für die Fortsetzung nach einer Kontext-Kompaktierung.

## Was fertig ist

1. **Design-Panel gelaufen** (3 parallele Blickwinkel: Systemdesign,
   Engine-Architektur, Mobile-UX). Ergebnis vollständig in die Spec
   synthetisiert, die Panel-Rohtexte müssen nicht aufbewahrt werden.
2. **`design/SPEC_SLICE_2.md` geschrieben und bindend** — inklusive der
   8 Panel-Entscheidungen im Kopf (Bumerang 0 Schaden/nur Stun, 7-Zeilen-
   Inventarliste, volle Tasche lässt liegen, Bumerang-Truhe Westkammer,
   Siegtruhe ohne Gear, dritter Touch-Button W als dokumentierte
   GDD-Abweichung, feste Affix-Werte, keine Grabratte/Knochenwerfer).
3. **Adversarialer Spec-Review gelaufen und KOMPLETT eingearbeitet**:
   4 Blocker (Vase/Truhen-Kollision tc(4,16) → Vase nach tc(4,17);
   Stun-Check-Platzierung NACH Schwert/Knockback-Block; ui.open() mit
   geprimten Held-Flags gegen Sofort-Schließen; speed-Rundung wegen
   90*1.1 !== 99) und 12 Klärungen (u. a. Truhen-Zähl-Check-Ersatz,
   equipItem-Splice, player.zeldaState-Spiegel, newFlag-Setter,
   Hound-contactDamage-Mutation, Fade/Victory/Tod-Gating, preventDefault
   für I/Tab/L, Sichtbarkeits-Gating der Touch-Zonen, Event-Formen).
   Review bestätigte: alle 8 Spawn-Tiles begehbar (per Skript gegen die
   ROWS geprüft).
4. **`workflows/SLICE_2_loot_inventar.md` angelegt** (Ablauf, Besitz,
   Besonderheiten).

## Was blockiert ist

**Build Phase 1 wurde gestartet und musste abgebrochen werden:** Alle drei
Builder-Agenten (A, B, Art) bekamen vom Berechtigungssystem KEINE
Lesezugriffe ("The user doesn't want to take this action right now"),
auch im Wiederholungsversuch. **Keine einzige Spieldatei wurde verändert,
keine .tmp-Dateien erstellt — der Code steht exakt auf dem grünen
Slice-1.5-Stand.** Michael wurde gebeten, den Bypass-Permissions-Modus zu
aktivieren; danach die drei Builder einfach neu starten.

## Nächster Schritt: 3 Builder parallel neu starten (Phase 1)

Alle technischen Details stehen in `design/SPEC_SLICE_2.md` §2 + §3.
Aufteilung mit exklusivem Datei-Besitz:

1. **Builder A:** `game/js/items/items.js` (NEU, Verzeichnis anlegen),
   `game/js/core/input.js`, `game/js/world/maps.js`. Pflicht-Verifikation:
   node --check; .tmp/dev_a_items.mjs (rollItem/computeStats exakt,
   equipItem-Regeln, JSON-Wächter); .tmp/dev_a_maps.mjs (Spawns begehbar,
   keine Prop-Doppelbelegung, 1x treasure + 1x boomerang in CATACOMBS);
   createInput() in Node importieren.
2. **Builder B:** `game/js/entities/` komplett (entity.js: hasEvent/
   getEvent; enemies.js: Hound + Rostpanzer + Dispatch + Stun + Drop-
   Tabellen/Pity + stats-Schaden; player.js: inv/stats/recalcStats;
   props.js: content-Feld + boomerangHit; projectiles.js NEU: Bumerang).
   WICHTIG: wander/chase-Block wörtlich in updateWanderChase extrahieren
   (Skelett/Ghul-Regression); items.js-API aus der Spec ist eingefroren,
   bei fehlendem items.js mit Stub-Objekten testen. Pflicht-Verifikation:
   node --check auf alle 5; .tmp/dev_b_enemies.mjs + .tmp/dev_b_projectiles.mjs.
3. **Art:** `game/js/art/palette.js` + `sprites.js`. Neue Schlüssel:
   hound_0/1/telegraph/leap/down/die (16×12, Blick nach rechts),
   rust_0/1/die (16×18, helle Rücken-Rippen), shield_side/up/down,
   block_spark (8×8), boomerang_0/1 (10×10), item_weapon/armor/ring
   (10×10), sparkle_0/1 (8×8), icon_weapon/armor/ring (12×12),
   icon_boomerang (16×16). Max. 3 neue Palettenfarben (Rost). ALLE alten
   Schlüssel bleiben. Pflicht-Verifikation: .tmp/dev_art_slice2.mjs
   (Zeilenlängen, Palettendeckung, Alt-Schlüssel eingefroren).

**Danach Phase 2 (sequenziell, ein Integrator):** `game/js/ui/inventory_ui.js`
(NEU), `game/js/ui/hud.js`, `game/js/main.js`, `tools/smoke_test.mjs`
Abschnitte 22-29, neuer Flusstest `.tmp/check_inventory_slice2.mjs`.
Details Spec §3 (inventory_ui/hud/main) + §4 (alle 8 Testabschnitte).

**Danach:** Verify (Syntax, Smoke inkl. Regression, alte + neuer Flusstest),
Screenshot-Proof (eigener Server 127.0.0.1:8124 mit Wurzel game/, NIE Port
8123; Playwright aus .tmp/venv; Motive s2_01 bis s2_07 laut Spec §5),
Abschluss-Übergabe, Workflow-Erkenntnisse, Memory-Update.

## Arbeitsregeln (aus den Vorgänger-Slices, weiter bindend)

1. Subagenten-Regeln in jeden Builder-Prompt: exklusiver Datei-Besitz
   nennen, KEINE Gedankenstriche (--), Kommentarstil wie Bestand,
   Abweichungen dokumentieren, Selbst-Verifikation vor Fertigmeldung.
2. Fußkanten-Anker-Konvention für alle Positions-Asserts.
3. Kampfcode liest nie Affixe, nur player.stats (Fallbacks ?? Basiswert).
4. Neue Side-Sprites in die Flip-Liste in main.js (Phase 2, bekannte Falle).
5. Port 8123 gehört Michael, Agenten nur 8124.
