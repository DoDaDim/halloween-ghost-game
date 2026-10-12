"""v0.4 obstacle helpers: side-specific column sets (tops = hanging, bottoms = standing)."""
import os, math
from build_tombs import svg, flower, leaf, LW
from build_extras import sparkle, blush, happy_eyes, mini_ghost, eyes
OUT = os.path.join(os.path.dirname(__file__), "..")
FILES, HIT, EDGES = {}, {}, {}

def tile3(inner):
    """repeat a 64-period body decoration at -64/0/+64 so the tile wraps seamlessly"""
    return inner + f'<g transform="translate(0,-64)">{inner}</g><g transform="translate(0,64)">{inner}</g>'

def edge_top(h):
    return min([y for (x, y, w, hh) in h.get("rects", [])] + [cy - r for (cx, cy, r) in h.get("circles", [])])
def edge_bot(h):
    return max([y + hh for (x, y, w, hh) in h.get("rects", [])] + [cy + r for (cx, cy, r) in h.get("circles", [])])

def check(name, h, body=False):
    for (x, y, w, hh) in h.get("rects", []):
        assert 4 <= x and x + w <= 76, (name, "rect outside column", x, w)
        assert 0 <= y and y + hh <= (64 if body else 80), (name, "rect outside canvas", y, hh)
    for (cx, cy, r) in h.get("circles", []):
        assert 4 <= cx - r and cx + r <= 76, (name, "circle outside column", cx, r)
    if body: assert len(h["rects"]) == 1 and not h.get("circles"), (name, "body must be ONE rect (game.js uses rects[0])")

def reg_top(name, body, cap, hb_body, hb_cap, sway=None, note=None):
    check(name + "-body", hb_body, True); check(name + "-cap-bottom", hb_cap)
    FILES[name + "-body"], FILES[name + "-cap-bottom"] = body, cap
    HIT[name + "-body"], HIT[name + "-cap-bottom"] = hb_body, hb_cap
    e = {"files": name + "-{body,cap-bottom}", "side": "top", "ceilEdge": edge_bot(hb_cap)}
    if sway: e["sway"] = sway
    if note: e["note"] = note
    EDGES[name] = e

def reg_bot(name, body, cap, hb_body, hb_cap, seat, note=None):
    check(name + "-body", hb_body, True); check(name + "-cap-top", hb_cap)
    FILES[name + "-body"], FILES[name + "-cap-top"] = body, cap
    HIT[name + "-body"], HIT[name + "-cap-top"] = hb_body, hb_cap
    e = {"files": name + "-{body,cap-top}", "side": "bottom", "floorEdge": edge_top(hb_cap), "pumpkinSeat": seat}
    if note: e["note"] = note
    EDGES[name] = e

# ---------- small drawing helpers ----------
def face(cx, cy, s=1.0, gid="fe", line="#4A3358", eye2="#7A5A9E", mouth="w", sleepy=False, bl="#FFB3CB"):
    """glossy kawaii face centred at (cx, cy); s scales spacing"""
    dx, ey = 6 * s, cy - 1.5 * s
    out = (happy_eyes(cx - dx, cx + dx, ey, 2.6 * s, line, 1.5 * s) if sleepy
           else eyes(cx - dx, cx + dx, ey, 2.3 * s, 2.9 * s, line, eye2, gid))
    out += blush(cx - dx - 3.6 * s, cx + dx + 3.6 * s, cy + 2.6 * s, 2.5 * s, 1.5 * s, bl)
    my = cy + 2.4 * s
    if mouth == "w":
        out += f'<path d="M{cx-2.4*s:.2f},{my:.2f} Q{cx-1.2*s:.2f},{my+1.8*s:.2f} {cx:.2f},{my:.2f} Q{cx+1.2*s:.2f},{my+1.8*s:.2f} {cx+2.4*s:.2f},{my:.2f}" stroke="{line}" stroke-width="{1.2*s:.2f}" fill="none" stroke-linecap="round"/>'
    elif mouth == "o":
        out += f'<ellipse cx="{cx}" cy="{my+0.8*s:.2f}" rx="{1.4*s:.2f}" ry="{1.7*s:.2f}" fill="#E87FA3" stroke="{line}" stroke-width="{0.9*s:.2f}"/>'
    else:
        out += f'<path d="M{cx-2*s:.2f},{my:.2f} Q{cx:.2f},{my+2.2*s:.2f} {cx+2*s:.2f},{my:.2f}" stroke="{line}" stroke-width="{1.2*s:.2f}" fill="none" stroke-linecap="round"/>'
    return out

def rope_v(x, y0, y1, w=5, fill="#F6E7C6", line="#7A5A4E", twist="#D9BF98"):
    s = (f'<rect x="{x-w/2}" y="{y0}" width="{w}" height="{y1-y0}" fill="{fill}"/>'
         f'<path d="M{x-w/2},{y0} V{y1} M{x+w/2},{y0} V{y1}" stroke="{line}" stroke-width="1.6"/>')
    y = y0 - (y0 % 8)
    while y < y1:
        a, b = max(y, y0), min(y + 6, y1)
        if b > a: s += f'<path d="M{x-w/2+0.6},{a} L{x+w/2-0.6},{b}" stroke="{twist}" stroke-width="1.4"/>'
        y += 8
    return s

def chain_v(x, y0, y1, col="#F6D58E", line="#8E5A3C", period=16):
    """links: oval every period/2, alternating front/side. y0 must be a multiple of period/2 for seamless tiles"""
    s = []
    y = y0 - ((y0 % period) + period) % period - period
    i = 0
    while y < y1 + period:
        if (i % 2) == 0:
            s.append(f'<rect x="{x-4}" y="{y}" width="8" height="{period*0.62:.1f}" rx="4" fill="none" stroke="{line}" stroke-width="4.2"/>'
                     f'<rect x="{x-4}" y="{y}" width="8" height="{period*0.62:.1f}" rx="4" fill="none" stroke="{col}" stroke-width="2.2"/>')
        else:
            s.append(f'<path d="M{x},{y} V{y+period*0.62:.1f}" stroke="{line}" stroke-width="4.4" stroke-linecap="round"/>'
                     f'<path d="M{x},{y} V{y+period*0.62:.1f}" stroke="{col}" stroke-width="2.2" stroke-linecap="round"/>')
        y += period / 2; i += 1
    cid = f"cv{int(x)}_{int(y0)+20}_{int(y1)+20}"
    return f'<clipPath id="{cid}"><rect x="0" y="{y0}" width="80" height="{y1-y0}"/></clipPath><g clip-path="url(#{cid})">' + "".join(s) + "</g>"

def thread_v(x, y0, y1, col="#F4EEFF", line="#8E7BB8", w=2.2):
    return (f'<path d="M{x},{y0} V{y1}" stroke="{line}" stroke-width="{w+1.4}" opacity="0.55"/>'
            f'<path d="M{x},{y0} V{y1}" stroke="{col}" stroke-width="{w}"/>')

def cable_v(x, y0, y1, col="#B9B3D9", line="#4E4A6E", w=3):
    return (f'<path d="M{x},{y0} V{y1}" stroke="{line}" stroke-width="{w+2}"/>'
            f'<path d="M{x},{y0} V{y1}" stroke="{col}" stroke-width="{w}"/>')

def shine(x1, y1, x2, y2, w=1.6, op=0.75):
    return f'<path d="M{x1},{y1} L{x2},{y2}" stroke="#FFF" stroke-width="{w}" stroke-linecap="round" opacity="{op}"/>'

def write_all():
    for k, v in FILES.items(): open(os.path.join(OUT, k + ".svg"), "w").write(v)
