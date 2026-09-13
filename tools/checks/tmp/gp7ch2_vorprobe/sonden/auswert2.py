#!/usr/bin/env python3
# E-A5 Silhouetten-Verlust JE SORTE. Der Hund-Aufsteh-Blink (enemies.js:621-624)
# BLEIBT laut §5(1) und wird deshalb getrennt ausgewiesen.
import json, sys
KINDS = ['skeleton', 'ghoul', 'hound', 'rust', 'warden']

def parse_tick(t):
    if not t: return None
    kopf, rest = t.split(' | ', 1)
    gt = rest.split(' | D')[0].strip()
    teile = kopf.split(' '); pf = teile[3].split(',')
    sp = {'hp': int(pf[2]), 'state': pf[3], 'invuln': float(pf[4])}
    g = []
    if gt:
        for x in gt.split(' '):
            kind, r2 = x.split(':', 1); f = r2.split(',')
            g.append({'kind': kind, 'hp': int(f[2]), 'state': f[3], 'hurt': float(f[4])})
    return {'map': teile[0], 'spieler': sp, 'gegner': g}

def gezeichnet_pro_kind(namen):
    out = dict((k, 0) for k in KINDS)
    for nm in namen:
        for k in KINDS:
            if nm.startswith(k + '_'): out[k] += 1; break
        else:
            if nm.startswith('warden'): out['warden'] += 1
    return out

def lauf(p, tag):
    rows = [json.loads(z) for z in open(p) if z.strip()]
    # Fenster je SORTE: solange >=1 lebender Gegner dieser Sorte hurtTimer>0 hat
    fenster = dict((k, []) for k in KINDS); offen = dict((k, None) for k in KINDS)
    leichen_blitz = 0; sterbeframes = 0; dead_frames = 0
    decal_pro_map = {}
    for r in rows:
        t = parse_tick(r['tick'])
        if t is None: continue
        gez = gezeichnet_pro_kind(r['gegnerNamen'])
        for k in KINDS:
            # graveward zeichnet als warden_*
            inListe = [g for g in t['gegner'] if (g['kind'] == k or (k == 'warden' and g['kind'] == 'graveward'))]
            # Erwartung: JEDER Gegner dieser Sorte zeichnet genau ein Sprite.
            # AUSNAHME: Hund im 'down' (Aufsteh-Blink bleibt, §5(1)).
            erwartet = len([g for g in inListe if not (k == 'hound' and g['state'] == 'down')])
            getroffen = any(g['hurt'] > 0 and g['state'] != 'die' for g in inListe)
            if getroffen and offen[k] is None:
                offen[k] = {'start': r['f'], 'len': 0, 'verlust': 0}
            if getroffen:
                offen[k]['len'] += 1
                if gez[k] < erwattet_fix(erwartet, gez[k]): pass
                if gez[k] < erwartet: offen[k]['verlust'] += erwartet - gez[k]
            elif offen[k] is not None:
                fenster[k].append(offen[k]); offen[k] = None
        if any(g['state'] == 'die' for g in t['gegner']): sterbeframes += 1
        if t['spieler']['state'] == 'dead': dead_frames += 1
        if r['decal']:
            decal_pro_map.setdefault(t['map'], 0)
            decal_pro_map[t['map']] += 1
    print('--- %s ---' % tag)
    for k in KINDS:
        F = fenster[k]
        if not F: continue
        print('  %-9s Trefferfenster %d | Laenge %s | VERLUSTFRAMES %s (Summe %d)'
              % (k, len(F), [w['len'] for w in F], [w['verlust'] for w in F], sum(w['verlust'] for w in F)))
    print('  Frames mit sterbendem Gegner: %d | Frames Spieler dead: %d' % (sterbeframes, dead_frames))
    print('  Frames mit *_decal-Draw je Karte: %s' % decal_pro_map)

def erwattet_fix(a, b): return a
lauf(sys.argv[1], sys.argv[2])
