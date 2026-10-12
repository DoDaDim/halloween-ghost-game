"""Seam check: compares the column pair across each tile join with ordinary neighbouring columns inside the tiles."""
import cairosvg, io, os, numpy as np
from PIL import Image
os.chdir(os.path.join(os.path.dirname(__file__), ".."))
def arr(n): return np.asarray(Image.open(io.BytesIO(cairosvg.svg2png(url=n + '.svg'))).convert('RGBA')).astype(float)
def score(left, right):  # mean abs diff between the last column of left and first column of right
    return np.abs(left[:, -1] - right[:, 0]).mean()
O = ["graveyard", "church", "countryside", "schools", "city", "space"]
rows = []
for st in O:
    for L in ('far', 'mid', 'near'):
        a = arr(f'bg-{st}-{L}')
        inner = np.abs(np.diff(a, axis=1)).mean(axis=(0, 2))
        rows.append((f'bg-{st}-{L} (self-wrap)', score(a, a), np.percentile(inner, 99)))
for a, b in zip(O[:5], O[1:5]):
    for L in ('far', 'mid', 'near'):
        A, T, B = arr(f'bg-{a}-{L}'), arr(f'bg-trans-{a}-{b}-{L}'), arr(f'bg-{b}-{L}')
        inner = np.abs(np.diff(T, axis=1)).mean(axis=(0, 2))
        rows.append((f'{a}->trans ({L})', score(A, T), np.percentile(inner, 99)))
        rows.append((f'trans->{b} ({L})', score(T, B), np.percentile(inner, 99)))
bad = [r for r in rows if r[1] > max(1.0, r[2])]
for r in rows: print(f'{r[0]:45s} seam {r[1]:6.2f}   p99 inner {r[2]:6.2f}  {"<-- CHECK" if r in bad else ""}')
print("OK" if not bad else f"{len(bad)} joins to check")
