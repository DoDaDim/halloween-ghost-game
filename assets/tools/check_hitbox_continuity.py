"""Audit every column piece in hitboxes.json for vertical breaks.

A column must be solid from the screen edge to its gap edge, so each 1x pixel row (sampled every 0.25 px)
between the attachment edge and the gap edge must be covered by at least one rect or circle:
  body        rows 0..64 (it tiles, so the whole tile)
  cap-bottom  rows 0 .. ceilEdge    (ceiling column: attaches at y=0, gap edge at the bottom)
  cap-top     rows floorEdge .. 80  (floor column: gap edge at the top, attaches at y=80)
It also checks that each cap overlaps its body rect at the joint row (y=0 for cap-bottom, y=80 for cap-top),
and warns when two adjacent covered rows don't overlap horizontally (shapes touch only diagonally).
Usage: python3 tools/check_hitbox_continuity.py   (exit code 1 if any break is found)"""
import json, os, sys
A = os.path.join(os.path.dirname(__file__), "..")
H = json.load(open(os.path.join(A, "hitboxes.json")))
STEP = 0.25

def spans(h, y):
    """x-intervals covered at row y"""
    out = []
    for (x, ry, w, hh) in h.get("rects", []):
        if ry <= y < ry + hh: out.append((x, x + w))
    for (cx, cy, r) in h.get("circles", []):
        d = r * r - (y - cy) ** 2
        if d > 0: k = d ** 0.5; out.append((cx - k, cx + k))
    return out

def edges(h):
    ys0 = [y for (x, y, w, hh) in h.get("rects", [])] + [cy - r for (cx, cy, r) in h.get("circles", [])]
    ys1 = [y + hh for (x, y, w, hh) in h.get("rects", [])] + [cy + r for (cx, cy, r) in h.get("circles", [])]
    return min(ys0), max(ys1)

def audit(name, h, y0, y1):
    breaks, warns, run, prev = [], [], None, None
    y = y0
    while y < y1 - 1e-9:
        s = spans(h, y + STEP / 2)
        if not s:
            run = run or [y, y]; run[1] = y + STEP
        else:
            if run: breaks.append(tuple(run)); run = None
            if prev and not any(a < d and c < b for a, b in prev for c, d in s):
                warns.append(y)
            prev = s
        y += STEP
    if run: breaks.append(tuple(run))
    return breaks, warns

def seam(name, h, body, y):
    """the cap must overlap its body tile horizontally at the joint row"""
    a = spans(h, y); b = spans(body, 0.5)
    return bool(a) and any(p < s2 and q < r for p, r in a for q, s2 in b)

def pieces():
    for k, v in H.items():
        if not isinstance(v, dict) or not ("rects" in v or "circles" in v): continue
        if k.endswith("-body"): yield k, v, 0, 64
        elif k.endswith("-cap-bottom"): yield k, v, 0, edges(v)[1]
        elif k.endswith("-cap-top"): yield k, v, edges(v)[0], 80

if __name__ == "__main__":
    bad = 0; n = 0
    for name, h, y0, y1 in pieces():
        n += 1
        br, wr = audit(name, h, y0, y1)
        for a, b in br: print(f"BREAK  {name:42s} no coverage y {a:g}..{b:g}"); bad += 1
        for y in wr: print(f"warn   {name:42s} rows {y-STEP:g}/{y:g} only touch diagonally")
        base = name.rsplit("-cap-", 1)[0] if "-cap-" in name else None
        if base and base + "-body" in H:
            y = 0.5 if name.endswith("-cap-bottom") else 79.5
            if not seam(name, h, H[base + "-body"], y):
                print(f"BREAK  {name:42s} does not overlap {base}-body at the joint row y {y}"); bad += 1
    print(f"{n} column pieces checked, {bad} break(s)")
    sys.exit(1 if bad else 0)
