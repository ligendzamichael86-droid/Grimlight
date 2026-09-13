#!/usr/bin/env python3
# LEICHEN-BLITZ-SONDE (E-A1) + Signal-Buchhaltung.
import json, sys
def parse_tick(t):
    if not t: return None
    kopf, rest = t.split(' | ', 1); gt = rest.split(' | D')[0].strip()
    teile = kopf.split(' '); pf = teile[3].split(',')
    sp = {'hp': int(pf[2]), 'state': pf[3], 'invuln': float(pf[4])}
    g = []
    if gt:
        for x in gt.split(' '):
            kind, r2 = x.split(':', 1); f = r2.split(',')
            g.append({'kind': kind, 'hp': int(f[2]), 'state': f[3], 'hurt': float(f[4])})
    return {'map': teile[0], 'spieler': sp, 'gegner': g}

rows = [json.loads(z) for z in open(sys.argv[1]) if z.strip()]
sterbe = 0; sterbe_signal = 0
dead = 0; dead_signal = 0
rein_sterbe = 0; rein_sterbe_signal = 0   # nur Leichen im Bild, nichts Lebendes getroffen
alle_signal = 0; alphas = {}
sterbe_laeufe = []; lauf = 0
for r in rows:
    t = parse_tick(r['tick'])
    if t is None: continue
    s = r.get('signal', [])
    alle_signal += len(s)
    for a in s: alphas[a] = alphas.get(a, 0) + 1
    hat_die = any(g['state'] == 'die' for g in t['gegner'])
    lebend_getroffen = any(g['hurt'] > 0 and g['state'] != 'die' for g in t['gegner'])
    sp_invuln_an = t['spieler']['invuln'] > 0 and t['spieler']['state'] != 'dead'
    if hat_die:
        sterbe += 1; sterbe_signal += len(s); lauf += 1
        if not lebend_getroffen and not sp_invuln_an:
            rein_sterbe += 1; rein_sterbe_signal += len(s)
    else:
        if lauf: sterbe_laeufe.append(lauf); lauf = 0
    if t['spieler']['state'] == 'dead':
        dead += 1; dead_signal += len(s)
if lauf: sterbe_laeufe.append(lauf)
print('--- %s ---' % sys.argv[2])
print('  Signal-Draws gesamt: %d   Alphas: %s' % (alle_signal, dict(sorted(alphas.items()))))
print('  Sterbeframes (>=1 Gegner state die): %d, Laeufe je Kill: %s' % (sterbe, sterbe_laeufe))
print('    davon REINE Sterbeframes (kein lebender Treffer, keine Spieler-Unverwundbarkeit): %d' % rein_sterbe)
print('    SIGNAL-DRAWS in reinen Sterbeframes: %d   <-- MUSS 0 SEIN' % rein_sterbe_signal)
print('  Frames mit totem Spieler (state dead): %d' % dead)
print('    SIGNAL-DRAWS darin: %d   <-- MUSS 0 SEIN' % dead_signal)
