#!/usr/bin/env python3
# E-A5 Auswertung: Silhouetten-Verlust-Frames + Leichen-Blitz-Sonde.
import json, sys

def lade(p):
    return [json.loads(z) for z in open(p) if z.strip()]

def parse_tick(t):
    if not t: return None
    kopf, rest = t.split(' | ', 1)
    gegnerteil = rest.split(' | D')[0].strip()
    teile = kopf.split(' ')
    pf = teile[3].split(',')
    spieler = {'x': float(pf[0]), 'y': float(pf[1]), 'hp': int(pf[2]), 'state': pf[3], 'invuln': float(pf[4])}
    gegner = []
    if gegnerteil:
        for g in gegnerteil.split(' '):
            kind, rest2 = g.split(':', 1)
            f = rest2.split(',')
            gegner.append({'kind': kind, 'x': float(f[0]), 'y': float(f[1]), 'hp': int(f[2]), 'state': f[3], 'hurt': float(f[4])})
    return {'map': teile[0], 'state': teile[1], 'spieler': spieler, 'gegner': gegner}

def auswerten(p, tag):
    rows = lade(p)
    sp_fenster, ge_fenster = [], []
    sp_offen = ge_offen = None
    sterbe_frames = tot_frames = decal_frames = 0
    decal_namen = set()
    vor_inv = vor_hurt = 0.0
    for r in rows:
        t = parse_tick(r['tick'])
        if t is None: continue
        sp = t['spieler']
        lebende = [g for g in t['gegner'] if g['state'] != 'die']
        if any(g['state'] == 'die' for g in t['gegner']): sterbe_frames += 1
        if sp['state'] == 'dead': tot_frames += 1
        if r['decal']:
            decal_frames += 1; decal_namen.update(r['decal'])
        inv_an = sp['invuln'] > 0 and sp['state'] != 'dead'
        if inv_an and vor_inv <= 0: sp_offen = {'start': r['f'], 'len': 0, 'verlust': 0}
        if inv_an and sp_offen is not None:
            sp_offen['len'] += 1
            if r['spieler'] == 0: sp_offen['verlust'] += 1
        if (not inv_an) and sp_offen is not None:
            sp_fenster.append(sp_offen); sp_offen = None
        vor_inv = 1.0 if inv_an else 0.0
        hurt_an = any(g['hurt'] > 0 for g in lebende)
        erwartet = len(t['gegner'])
        if hurt_an and vor_hurt <= 0: ge_offen = {'start': r['f'], 'len': 0, 'verlust': 0}
        if hurt_an and ge_offen is not None:
            ge_offen['len'] += 1
            if r['gegner'] < erwartet: ge_offen['verlust'] += erwartet - r['gegner']
        if (not hurt_an) and ge_offen is not None:
            ge_fenster.append(ge_offen); ge_offen = None
        vor_hurt = 1.0 if hurt_an else 0.0
    print('--- %s (%s) ---' % (tag, p.split('/')[-1]))
    for name, F in (('Spieler', sp_fenster), ('Gegner ', ge_fenster)):
        print('  %s-Trefferfenster: %d' % (name, len(F)))
        if F:
            vs = [w['verlust'] for w in F]; ls = [w['len'] for w in F]
            print('    Fensterlaenge min/max/summe: %d/%d/%d Frames' % (min(ls), max(ls), sum(ls)))
            print('    VERLUSTFRAMES min/max/summe: %d/%d/%d' % (min(vs), max(vs), sum(vs)))
            print('    je Fenster: %s' % vs)
    print('  Frames mit sterbendem Gegner (state die): %d' % sterbe_frames)
    print('  Frames mit totem Spieler (state dead):    %d' % tot_frames)
    print('  Frames mit gezeichnetem *_decal:          %d  %s' % (decal_frames, sorted(decal_namen)))

if __name__ == '__main__':
    auswerten(sys.argv[1], sys.argv[2])
