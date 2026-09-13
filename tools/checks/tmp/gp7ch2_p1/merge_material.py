#!/usr/bin/env python3
"""Fuehrt material_A.json (Skelett, Grufthund, Warden) und material_B.json (Rostpanzer, Schild, Ghul) zu material_gesamt.json zusammen."""
import json, sys, hashlib
A=json.load(open('.tmp/gp7ch2_p1/A/material_A.json')); B=json.load(open('.tmp/gp7ch2_p1/B/material_B.json'))
assert A.get('$format')==B.get('$format')=='GP7CH2/MATERIAL-TABELLE/1', (A.get('$format'),B.get('$format'))
von_A={'Skelett','Grufthund','Warden'}; von_B={'Rostpanzer','Schild','Ghul'}
fig={}
for name in von_A:
    assert name in A['figuren'], f'A fehlt {name}: {list(A["figuren"])}'; fig[name]=A['figuren'][name]
for name in von_B:
    assert name in B['figuren'], f'B fehlt {name}: {list(B["figuren"])}'; fig[name]=B['figuren'][name]
out=dict(A); out['figuren']=fig; out['$quelle']={'A':'material_A.json (Skelett, Grufthund, Warden)','B':'material_B.json (Rostpanzer, Schild, Ghul)','zusammengefuehrt':'Fable 12.09.2026'}
for k in ('rim','requisiten','merkmale'):
    if k in A or k in B:
        out[k]={**(A.get(k) or {}), **(B.get(k) or {})} if isinstance(A.get(k,{}),dict) else A.get(k) or B.get(k)
s=json.dumps(out,ensure_ascii=False,indent=2); open('.tmp/gp7ch2_p1/material_gesamt.json','w').write(s)
print('material_gesamt.json', len(s), 'Bytes, Figuren:', sorted(fig), 'sha256', hashlib.sha256(s.encode()).hexdigest()[:16])
for n,f in fig.items(): print(' ', n, [ (x.get('art'), ''.join(x.get('toene',[]))) for x in f.get('flaechen',[]) ])
