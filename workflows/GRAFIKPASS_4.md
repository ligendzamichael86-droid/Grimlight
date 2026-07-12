# Workflow: Grafikpass 4 — "Struktur & Licht" (Ziel: Median 8 = Block-Ende)

## Ziel

Die vier 6,5er-Deckel aus GP3 strukturell knacken: Teich-Reparatur
(Schimmer-Loop, organische Uferlinie mit Konkav-Autotiling +
Silhouetten-Umformung), zweite dunklere Kronenreihe + Kronen-Volumen,
Licht-trifft-Textur (Lit-Dither-Pass, Flaggschiff), Sprite-/HUD-
Modellierung — plus minimale Animations-Politur (Fackel 3-Frame,
Gras-Sway) gegen den SoM-Vergleichs-Deckel.

MEILENSTEIN-LOGIK (Auftrag Michael 12.07.2026: "Grafik bis 8/10,
dann erneute Entscheidung"): Median >= 8 in irgendeiner Runde →
Grafik-Block endet mit Abnahme. Nach Runde 3: 7,5-7,9 → Abnahme +
GP5-Planung; < 7,5 → Eskalation an Michael mit Analyse.

## Inputs

- `design/SPEC_GRAFIKPASS_4.md` (bindend; Revision 2 nach
  adversarialem Review: 1 Blocker, 10 Majors, 15 Minors eingearbeitet)
- `design/GP3_RUNDE3_JURY.md` (Backlog-Quelle)
- Grüne Basis: Commit 2914649

## Ablauf

1. Landkarte (4 Opus-Leser) + Spec im Hauptloop (Fable) +
   adversarialer Review (3 Opus-Prüfer). ERLEDIGT 12.07.2026.
2. Build: Art + Engine-A (unabhängige Mandate) parallel, dann
   Engine-B (braucht Art-Keys), dann Integrator (prüft die drei
   KOPPLUNGEN aus Spec §7). Muster GP3-R3 (lief mit 0 Fixes).
3. Proof: gp3_final/-Archiv ZUERST, dann g4_01-g4_09 + Serien;
   Beweis-Fenster beachten (Teich 1,5-15 % — Ober-UND-Untergrenze!),
   Kanal per Residuum-Verfahren, Lit-Texel-Nachweis.
4. Jury: 3 DIREKTE Opus-Agenten (nie Workflow-Subagenten — kein
   PNG-Zugriff), bilder_gelesen-Pflichtfeld, bewusste Entscheide im
   Prompt deklarieren. Median laut Meilenstein-Logik.
5. Abnahme laut Spec §8, Übergabe, Commit, Memory (Hauptloop).

## Besonderheiten

- ALLE ausführenden Agenten auf Opus ("Fable plant, Opus baut");
  nach Session-Restart ZUERST das Hauptloop-Modell prüfen (GP3-Lehre).
- Port 8123 = Auftraggeber; Agenten nur 8124.
- Tests: Flusstests NULL Änderungen; smoke NUR der exakte §5-Katalog
  (GOLD.GRAVEYARD.sol einzige Hash-Änderung; geo-Änderung = STOPP).
- Ambient-Werte sind eingefroren (GP3-Kontingent verbraucht).
- Composite-Hygiene: jeder 'lighter'-Block stellt gco/alpha explizit
  wieder her (Stubs restaurieren gco nicht — grüner Test, kaputter
  Browser).
- Palette ist VOLL: neue Töne nur '='/'+'/'*' laut Spec §3.6.
- Der "Wraith" der Juroren ist der GHUL (nicht der warden).

## Abnahme

Siehe `design/SPEC_GRAFIKPASS_4.md` §8. Übergabe in `uebergaben/`.

## Erkenntnisse / Änderungen

(wird nach dem Lauf ergänzt)
