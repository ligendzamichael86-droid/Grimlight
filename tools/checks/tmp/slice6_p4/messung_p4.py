# SLICE 6 PHASE 3 — AUFTRAG A: REALMESSUNG gegen die EINGEFRORENEN Werte.
#
# REINES LESE-WERKZEUG. Es aendert KEINE Spieldatei und KEINEN Test. Alle
# Eingriffe leben in den .tmp-Modulwrappern von shot_gfx6.py (Route-Inter-
# ception), die hier UNVERAENDERT importiert werden.
#
# METHODIK WOERTLICH aus .tmp/shot_gfx6.py (Rev 2.3 M1-PHASEN) bzw.
# .tmp/gp6_belichtung_messung.py:
#   * Messung auf dem 320x180-CANVAS-BACKING-STORE (toDataURL, keine CSS-Skalierung)
#   * Rec.601-Luminanz L = 0,299 R + 0,587 G + 0,114 B
#   * HUD-Maske Panel + BossBar + ItemBox je +1 px (S.MASK, identisch)
#   * 8 FESTE Phasen 6,05 .. 13,05 s (arm_freeze / phase_cond, 1/8-s-Fenster)
#   * je Kennzahl entscheidet der MEDIAN ueber die 8 Phasen
#   * Goodhart-Tonklassifikation am palette-puren Zwilling DESSELBEN
#     eingefrorenen Augenblicks (ambient 0, Vignette aus)
#   * __noShake/__noFlash/__noAudio stehen ueber S.INIT_JS vor dem ersten Frame
#
# SOLL-WERTE (design/SLICE6_PHASE0.md §4, eingefroren; NICHT anpassbar):
#   DORF:      M1-Median-Band 56 .. 69 | E1 (L>96) >= 0,64 % | L<16 <= 2,0 %
#   GRAVEYARD: M1-Median-Band 38 .. 46 (Regression, S.M1_KARTEN unveraendert)
#
# G3-NACHWEIS (SLICE6_PHASE2_NOTIZEN Punkt 9): Anteil des Stroh-Tons 'B'
# (#948b76) an den Highlight-Texeln IM D5-MESSFENSTER < 60 %.
#
# Aufruf: .tmp/venv/bin/python .tmp/slice6_p3_messung/messung_a.py

import json
import statistics
import sys
import time

_ARGV = list(sys.argv)
sys.argv = [sys.argv[0], "m1"]                 # ONLY-Filter von shot_gfx6 neutralisieren
sys.path.insert(0, "/home/coder/Grimlight/.tmp")
import shot_gfx6 as S                          # noqa: E402
from playwright.sync_api import sync_playwright  # noqa: E402

ROOT = "/home/coder/Grimlight"
MDIR = f"{ROOT}/.tmp/slice6_p4"

# --- DORF-Spezifikation: die EINGEFRORENEN Werte aus PHASE0 §4 --------------
# Aussen-Karte wie GRAVEYARD -> Highlight-Schwelle L > 96, Goodhart-Einzelton
# <= 60 % (S.M1_GOODHART_EINZEL_AUSSEN). Keine Bestandsschwelle wird beruehrt.
S.M1_KARTEN["DORF"] = {"median": (56.0, 69.0), "hl_L": 96, "hl_min": 0.64,
                       "dunkel_max": 2.0, "aussen": True}

tcx = S.tcx

# (tag, karte, url, spielerziel, sollkamera oder None)
SZENEN = [
    ("d1_dorf_osttor",       "DORF",      "/?map=DORF", (tcx(39), tcx(15)), None),
    ("d2_dorf_platz",        "DORF",      "/?map=DORF", (tcx(24), tcx(15)), None),
    ("d3_dorf_herdfeuer",    "DORF",      "/?map=DORF", (tcx(30), tcx(11)), None),
    ("d4_dorf_schmiede",     "DORF",      "/?map=DORF", (tcx(13), tcx(12)), None),
    ("d5_dorf_katen_west",   "DORF",      "/?map=DORF", (tcx(6),  tcx(19)), None),
    # ADDITIV (GP7-CH-1 Rev 2.2 M3): CORM-MESSSZENE. Corm stand in KEINER der
    # Realmess-Szenen d1..d5 (V-TESTS-Befund d). Sein Spawn ist map_dorf.js
    # npcSpawns tc(21, 6) ("Vater Corm, der Kuester — Kapellenstufe (21,5)/
    # (22,5)"). Der Spieler wird ZWEI Kacheln suedlich davon auf die Wegkachel
    # (21,8) gesetzt (rows[8][21] == '=', legend nicht solid) — nah genug, dass
    # Corm sicher im Bild steht, weit genug, dass die Figuren sich nicht
    # ueberlappen und die NPC-Kollision den Spieler nicht verschiebt.
    #
    # KAMERA (rechnerisch, camera.follow + Klemmung, core/camera.js:11-16 und
    # main.js:1085-1093, VIEW 320x180, Karte 44x28 Kacheln = 704x448 px):
    #   Spielermitte = (tcx(21), tcx(8)) = (344, 136)
    #   cam.x = clamp(344 - 160, 0, 704-320) = 184
    #   cam.y = clamp(136 -  90, 0, 448-180) =  46      -> SOLL (184, 46), ganzzahlig
    # Bildausschnitt: Kacheln x 11,5..31,5 | y 2,875..14,125.
    #   Corms Kachel (21,6) liegt bei Bildschirm-Pixel x 152..168, y 50..66,
    #   also waagerecht mittig und mit 50 px Luft nach oben.
    #   Die Kapelle (Zeilen 3..5, Kacheln 20..23: 'CCCC' / 'C tjv' / 'SS')
    #   liegt vollstaendig im Bild (Bildschirm-y 2..50).
    # Die Sollkamera wird MITGEGEBEN: settle_camera meldet jede Abweichung, das
    # Framing ist damit gepruefte Zusage und nicht nur Absicht.
    ("d6_dorf_kapelle",      "DORF",      "/?map=DORF", (tcx(21), tcx(8)),  (184, 46)),
    # REGRESSION: exakt die zwei GRAVEYARD-Szenen aus S.M1_SZENEN, gleiche
    # Kameras, gleiches Band 38..46 — Beweis, dass Slice 6 den Bestand nicht
    # verschoben hat.
    ("g6_01_friedhof_teich", "GRAVEYARD", "/", (tcx(27), tcx(17)), (280, 190)),
    ("g6_02_friedhof_waldrand", "GRAVEYARD", "/", (596, tcx(12)), (320, 110)),
    # ZUSATZ-REGRESSION (ueber den Auftrag hinaus, gleiche Pipeline): die drei
    # restlichen Bestandskarten aus S.M1_SZENEN. Sie belegen zusammen mit
    # GRAVEYARD, dass Slice 6 KEINE Bestandskarte verschoben hat.
    ("g6_03_katakomben_halle", "CATACOMBS", "/?map=CATACOMBS", (tcx(17), tcx(4)), (120, 0)),
    ("g6_04_gruft_kanal", "FLUESTERGRUFT", "/?map=FLUESTERGRUFT", (tcx(20), tcx(14)), None),
    ("g6_05_boss_arena", "BOSS_KAMMER", "/?map=BOSS_KAMMER", (tcx(10), tcx(9)), None),
]

STROH = "B"      # Palette #948b76 — Stroh der verlassenen Katen (G3)
STROH_IDX = S.PAL_KEYS.index(STROH)


def ampel(ok):
    return "GRUEN" if ok else "ROT"


def ton_zensus(ist, pur, hl_L):
    """VOLLE Ton-Verteilung der Highlight-Texel (kein Top-8-Schnitt) —
    identische Methode wie S.m1_goodhart: Highlight-Maske am IST-Frame
    (L > hl_L, HUD maskiert), Palettenton am palette-puren Zwilling."""
    L = S.lum(S.arr(ist))
    hl = (L > hl_L) & S.MASK
    idx = S.palette_klasse(S.arr(pur))
    sel = idx[hl]
    n_hl = int(sel.size)
    n_zu = int((sel >= 0).sum())
    n_b = int((sel == STROH_IDX).sum())
    verteilung = {}
    for k in range(len(S.PAL_KEYS)):
        c = int((sel == k).sum())
        if c:
            verteilung[S.PAL_KEYS[k]] = c
    return {
        "highlight_texel": n_hl, "zuordenbar": n_zu,
        "gemischt": n_hl - n_zu,
        "B_texel": n_b,
        "B_pct_zuordenbar": round(100.0 * n_b / max(1, n_zu), 3),
        "B_pct_alle_highlight": round(100.0 * n_b / max(1, n_hl), 3),
        "verteilung_texel": dict(sorted(verteilung.items(), key=lambda kv: -kv[1])),
    }


def messe_szene(pw, tag, karte, url, ziel, sollcam):
    spec = S.M1_KARTEN[karte]
    browser, ctx, page = S.open_map(pw, S.BASE + url)
    if karte == "BOSS_KAMMER":
        # woertlich aus shot_gfx6.m1: der Boss wird gehalten, die Welt NICHT geleert
        page.wait_for_timeout(800)
        S.hold_boss(page)
        S.place(page, *ziel, clear_world=False)
    else:
        S.place(page, *ziel)
    cam = S.settle_camera(page, tag, ziel, soll=sollcam)
    page.wait_for_timeout(200)
    amb_real = page.evaluate("() => (window.__snap ? window.__snap.ambient : null)")

    phasen = []
    frames = {}
    for ph in S.M1_PHASEN:
        S.set_scale(page, 1.0)
        t_vor = S.time_now(page)
        if isinstance(t_vor, (int, float)) and t_vor > ph:
            print(f"  [{tag}] Phase {ph}: VERPASST (t={t_vor:.4f})")
            continue
        S.arm_freeze(page, S.phase_cond(ph), 30000)
        if not S.wait_frozen(page, 32000):
            print(f"  [{tag}] Phase {ph}: EINFRIEREN FEHLGESCHLAGEN")
            continue
        page.wait_for_timeout(120)
        t_frz = S.time_now(page)
        ist, pur, kz, gh = S.m1_phase(page, spec)
        # G3: Anteil des Stroh-Tons an den Highlight-Texeln (zwei Nenner).
        # NICHT aus gh["anteile_pct"] (dort auf TOP-8 gekuerzt), sondern
        # aus dem VOLLEN Ton-Zensus derselben Methode.
        zen = ton_zensus(ist, pur, spec["hl_L"])
        anteile = gh["anteile_pct"]
        stroh_pct_zuordenbar = zen["B_pct_zuordenbar"]
        phasen.append({
            "phase_soll_s": ph, "t": round(float(t_frz), 4),
            "median": kz["median"], "highlight_pct": kz["highlight_pct"],
            "unter16_pct": kz["unter16_pct"], "mittel": kz["mittel"],
            "P25": kz["P25"], "P75": kz["P75"],
            "highlight_texel": gh["highlight_texel"], "zuordenbar": gh["zuordenbar"],
            "ton_klassen": gh["ton_klassen"], "cluster": gh["cluster"],
            "groesster_einzelton": gh["groesster_einzelton"],
            "stroh_B_pct": round(stroh_pct_zuordenbar, 3),
            "stroh_B_pct_alle_highlight": zen["B_pct_alle_highlight"],
            "ton_zensus": zen,
            "anteile_pct": anteile,
            "median_pass": spec["median"][0] <= kz["median"] <= spec["median"][1],
            "highlight_pass": kz["highlight_pct"] >= spec["hl_min"],
            "unter16_pass": kz["unter16_pct"] <= spec["dunkel_max"],
            "goodhart_pass": gh["pass"],
        })
        frames[ph] = ist
        print(f"  [{tag}] Phase {ph:5.2f} (t={float(t_frz):7.4f}): Median "
              f"{kz['median']:6.2f} | HL {kz['highlight_pct']:6.3f} % | L<16 "
              f"{kz['unter16_pct']:6.3f} % | Ton {gh['groesster_einzelton']} | "
              f"B {stroh_pct_zuordenbar:5.2f} %")
    camE = S.get_camera(page)
    S.assert_int_camera(camE, tag + "_ende")
    ctx.close()
    browser.close()

    if not phasen:
        return {"tag": tag, "karte": karte, "FEHLER": "keine Phase gemessen"}

    med = round(float(statistics.median([p["median"] for p in phasen])), 3)
    hl = round(float(statistics.median([p["highlight_pct"] for p in phasen])), 3)
    dk = round(float(statistics.median([p["unter16_pct"] for p in phasen])), 3)
    kl = round(float(statistics.median([p["ton_klassen"] for p in phasen])), 2)
    cl = round(float(statistics.median([p["cluster"] for p in phasen])), 2)
    ez = round(float(statistics.median(
        [(p["groesster_einzelton"][1] if p["groesster_einzelton"] else 0.0)
         for p in phasen])), 2)
    stroh = round(float(statistics.median([p["stroh_B_pct"] for p in phasen])), 3)
    stroh_alle = round(float(statistics.median(
        [p["stroh_B_pct_alle_highlight"] for p in phasen])), 3)

    # Repraesentative Phase = die dem Phasen-Median naechste (Gleichstand: frueheste)
    repr_i = min(range(len(phasen)), key=lambda i: (abs(phasen[i]["median"] - med), i))
    repr_ph = phasen[repr_i]["phase_soll_s"]
    frames[repr_ph].save(f"{MDIR}/frame_{tag}.png")

    grenze = (S.M1_GOODHART_EINZEL_AUSSEN if spec["aussen"]
              else S.M1_GOODHART_EINZEL_INNEN)
    med_ok = spec["median"][0] <= med <= spec["median"][1]
    hl_ok = hl >= spec["hl_min"]
    dk_ok = dk <= spec["dunkel_max"]
    gh_ok = kl >= S.M1_GOODHART_KLASSEN and cl >= S.M1_GOODHART_CLUSTER and ez <= grenze

    rec = {
        "tag": tag, "karte": karte, "kamera": cam, "ambient_real": amb_real,
        "verfahren": ("8 FESTE Phasen 6,05..13,05 s (arm_freeze, 1/8-s-Fenster); "
                      "je Kennzahl MEDIAN ueber die Phasen; 320x180-Backing-Store, "
                      "Rec.601, HUD-Maske Panel+BossBar+ItemBox +1 px"),
        "phasen_gemessen": len(phasen), "phasen_soll": len(S.M1_PHASEN),
        "phasen": phasen,
        "repraesentative_phase_s": repr_ph,
        "M1_median": {"soll": f"{spec['median'][0]} .. {spec['median'][1]}",
                      "ist": med,
                      "spanne": [min(p["median"] for p in phasen),
                                 max(p["median"] for p in phasen)],
                      "reserve_unten_L": round(med - spec["median"][0], 3),
                      "reserve_oben_L": round(spec["median"][1] - med, 3),
                      "status": ampel(med_ok)},
        "E1_highlight_pct": {"soll": f">= {spec['hl_min']}", "ist": hl,
                             "highlight_L": spec["hl_L"],
                             "spanne": [min(p["highlight_pct"] for p in phasen),
                                        max(p["highlight_pct"] for p in phasen)],
                             "reserve_pp": round(hl - spec["hl_min"], 3),
                             "status": ampel(hl_ok)},
        "L_unter16_pct": {"soll": f"<= {spec['dunkel_max']}", "ist": dk,
                          "spanne": [min(p["unter16_pct"] for p in phasen),
                                     max(p["unter16_pct"] for p in phasen)],
                          "reserve_pp": round(spec["dunkel_max"] - dk, 3),
                          "status": ampel(dk_ok)},
        "goodhart": {"ton_klassen_median": kl, "ton_klassen_soll": S.M1_GOODHART_KLASSEN,
                     "cluster_median": cl, "cluster_soll": S.M1_GOODHART_CLUSTER,
                     "einzelton_median_pct": ez, "einzelton_grenze_pct": grenze,
                     "status": ampel(gh_ok)},
        "stroh_B_pct_median": stroh,
        "stroh_B_pct_alle_highlight_median": stroh_alle,
        "stroh_B_spanne": [min(p["stroh_B_pct"] for p in phasen),
                           max(p["stroh_B_pct"] for p in phasen)],
        "alle_phasen_einzeln_im_band": all(p["median_pass"] for p in phasen),
        "status_gesamt": ampel(med_ok and hl_ok and dk_ok and gh_ok),
    }
    print(f"  == {tag}: Median {med} (Soll {spec['median']}) {ampel(med_ok)} | "
          f"E1 {hl} (>= {spec['hl_min']}) {ampel(hl_ok)} | L<16 {dk} "
          f"(<= {spec['dunkel_max']}) {ampel(dk_ok)} | Goodhart {ampel(gh_ok)}")
    return rec


def main():
    t0 = time.time()
    nur = set(_ARGV[1].split(",")) if len(_ARGV) > 1 else None
    # Teillauf-MERGE (Muster shot_gfx6): ein gefilterter Lauf ergaenzt die
    # vorhandenen Szenen, statt sie zu verwerfen.
    erg = {}
    if nur:
        try:
            with open(f"{MDIR}/messung_polish.json") as fh:
                erg = json.load(fh).get("szenen", {})
        except FileNotFoundError:
            erg = {}
    with sync_playwright() as pw:
        for tag, karte, url, ziel, sollcam in SZENEN:
            if nur and tag not in nur:
                continue
            print(f"== {tag} ({karte}) ==")
            # WIEDERHOLUNG bei unvollstaendiger Phasenreihe: der Phasen-Median
            # steht sonst auf unvollstaendiger Basis (shot_gfx6-Regel). Das
            # Messverfahren selbst bleibt unveraendert — wiederholt wird die
            # SZENE, nicht die Schwelle.
            for versuch in range(1, 4):
                r = messe_szene(pw, tag, karte, url, ziel, sollcam)
                if r.get("phasen_gemessen") == len(S.M1_PHASEN):
                    r["versuche"] = versuch
                    break
                print(f"  [{tag}] Versuch {versuch}: nur "
                      f"{r.get('phasen_gemessen', 0)} von {len(S.M1_PHASEN)} Phasen "
                      f"— WIEDERHOLUNG der Szene")
            r["versuche"] = versuch
            erg[tag] = r

    # ---- G3 auf MESSFENSTER-Ebene in d5 ------------------------------------
    d5 = erg.get("d5_dorf_katen_west", {})
    g3 = {"szene": "d5_dorf_katen_west",
          "ton": STROH, "hex": "#948b76",
          "soll": "< 60 % der (zuordenbaren) Highlight-Texel im d5-Messfenster",
          "ist_median_pct": d5.get("stroh_B_pct_median"),
          "ist_median_pct_alle_highlight": d5.get("stroh_B_pct_alle_highlight_median"),
          "spanne_pct": d5.get("stroh_B_spanne"),
          "status": ampel(isinstance(d5.get("stroh_B_pct_median"), (int, float))
                          and d5["stroh_B_pct_median"] < 60.0)}

    zus = {
        "zweck": "Slice 6 Phase 3 — Realmessung gegen die eingefrorenen Werte "
                 "(SLICE6_PHASE0 §4) + GRAVEYARD-Regression",
        "soll_dorf": {"M1_band": [56.0, 69.0], "E1_min_pct": 0.64,
                      "L_unter16_max_pct": 2.0, "highlight_L": 96},
        "soll_graveyard": {"M1_band": [38.0, 46.0], "E1_min_pct": 1.01,
                           "L_unter16_max_pct": 3.0, "highlight_L": 96},
        "methodik": ("woertlich aus .tmp/shot_gfx6.py (Rev 2.3 M1-PHASEN) und "
                     ".tmp/gp6_belichtung_messung.py — 320x180-Backing-Store, "
                     "8 Phasen 6,05..13,05 s, Median je Kennzahl, HUD-Maske, "
                     "Rec.601; __noShake/__noFlash/__noAudio aktiv"),
        "G3_d5": g3,
        "szenen": erg,
        "konsolenfehler": S.errors,
        "konsolenwarnungen": S.warnings,
        "dauer_s": round(time.time() - t0, 1),
    }
    with open(f"{MDIR}/messung_polish.json", "w") as fh:
        json.dump(zus, fh, indent=2, ensure_ascii=False)

    # ---- Tabelle -----------------------------------------------------------
    print("\n" + "=" * 108)
    print(f"{'Szene':<26}{'Karte':<11}{'M1 Soll':>12}{'M1 Ist':>9}{'':>2}"
          f"{'E1 Soll':>9}{'E1 Ist':>9}{'':>2}{'L<16 So':>9}{'L<16 Is':>9}")
    print("-" * 108)
    reihenfolge = [s[0] for s in SZENEN if s[0] in erg]
    for tag in reihenfolge:
        r = erg[tag]
        if "FEHLER" in r:
            print(f"{tag:<26}{r['karte']:<11}  FEHLER: {r['FEHLER']}")
            continue
        print(f"{tag:<26}{r['karte']:<11}{r['M1_median']['soll']:>12}"
              f"{r['M1_median']['ist']:>9}{'+' if r['M1_median']['status']=='GRUEN' else '!':>2}"
              f"{r['E1_highlight_pct']['soll']:>9}{r['E1_highlight_pct']['ist']:>9}"
              f"{'+' if r['E1_highlight_pct']['status']=='GRUEN' else '!':>2}"
              f"{r['L_unter16_pct']['soll']:>9}{r['L_unter16_pct']['ist']:>9}"
              f"{'+' if r['L_unter16_pct']['status']=='GRUEN' else '!':>2}")
    print("-" * 108)
    print(f"G3 d5 Stroh 'B': {g3['ist_median_pct']} % (Soll < 60 %) -> {g3['status']}")
    alle = all(r.get("status_gesamt") == "GRUEN" for r in erg.values())
    print(f"GESAMT: {'ALLE GATES GRUEN' if alle else 'MINDESTENS EIN GATE ROT'}")
    if S.errors:
        print("\nKONSOLENFEHLER:")
        for e in S.errors:
            print("  " + e)
    else:
        print("0 Konsolenfehler.")
    print(f"geschrieben: {MDIR}/messung_polish.json")


if __name__ == "__main__":
    main()
