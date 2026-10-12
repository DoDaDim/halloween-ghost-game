"""v0.3b parallax backgrounds: bg-<stage>-<far|mid|near> (720x640 world px, tile horizontally) and
bg-trans-<from>-<to>-<layer> transition tiles (left edge = outgoing stage, right edge = incoming stage).
World coords match game.js (360x640 logical, ground top at y=560)."""
import os, math, random
from build_extras import sparkle
OUT = os.path.join(os.path.dirname(__file__), "..")
TW, H, GY = 720, 640, 560
FILES = {}
INK = "#2A2146"

def periodic(base, terms):
    return lambda x: base + sum(a * math.sin(2 * math.pi * k * x / TW + p) for (a, k, p) in terms)
def smooth(t): t = max(0.0, min(1.0, t)); return t * t * (3 - 2 * t)
W0, W1 = 0.35 * TW, 0.65 * TW
def wfun(x): return smooth((x - W0) / (W1 - W0))
def hexmix(a, b, t):
    a = [int(a[i:i+2], 16) for i in (1, 3, 5)]; b = [int(b[i:i+2], 16) for i in (1, 3, 5)]
    return "#%02X%02X%02X" % tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))

# ------------------------------------------------------------------ element painters
def glow(x, y, r, col, op=0.45):
    k = f"gl{col[1:]}{int(op*100)}"   # objectBoundingBox gradient -> position independent, safe to reuse
    return (f'<radialGradient id="{k}"><stop offset="0" stop-color="{col}" stop-opacity="{op}"/><stop offset="1" stop-color="{col}" stop-opacity="0"/></radialGradient>'
            f'<circle cx="{x}" cy="{y}" r="{r}" fill="url(#{k})"/>')
def star_dot(x, y, r, col="#FFF6D6", op=0.85): return f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r}" fill="{col}" opacity="{op:.2f}"/>'
def moon(x, y, r, crescent=False, sky="#2B2347"):
    s = glow(x, y, r * 2.2, "#FFF1D6", 0.28) + f'<circle cx="{x}" cy="{y}" r="{r}" fill="#FFF3DA"/>'
    if crescent: s += f'<circle cx="{x+r*0.45}" cy="{y-r*0.25}" r="{r*0.9}" fill="{sky}"/>'
    else:
        s += f'<circle cx="{x-r*0.3}" cy="{y-r*0.2}" r="{r*0.18}" fill="#EBDCC4" opacity="0.7"/><circle cx="{x+r*0.35}" cy="{y+r*0.3}" r="{r*0.12}" fill="#EBDCC4" opacity="0.7"/>'
        s += f'<path d="M{x-r*0.35},{y+r*0.45} Q{x},{y+r*0.65} {x+r*0.1},{y+r*0.5}" stroke="#EBDCC4" stroke-width="2" fill="none" opacity="0.5"/>'
    return s
def bare_tree(x, b, col, s=1.0, line=None):
    st = f' stroke="{line}" stroke-width="1.4"' if line else ""
    return (f'<g transform="translate({x},{b}) scale({s})"><path d="M-4,0 C-3,-20 -5,-34 -2,-46 C-12,-52 -16,-60 -14,-66 M-2,-46 C2,-58 8,-62 14,-70 M-3,-30 C-12,-34 -20,-34 -24,-40 M-1,-36 C8,-40 14,-46 18,-46 L4,0 Z" '
            f'fill="{col}" stroke="{col}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>'
            + "".join(f'<circle cx="{cx}" cy="{cy}" r="3.2" fill="{col}"{st}/>' for cx, cy in ((-14, -66), (14, -70), (-24, -40), (18, -46))) + '</g>')
def round_tree(x, b, col, col2, s=1.0, line=INK):
    return (f'<g transform="translate({x},{b}) scale({s})"><rect x="-4" y="-26" width="8" height="26" rx="2" fill="{col2}" stroke="{line}" stroke-width="1.4"/>'
            f'<circle cx="0" cy="-40" r="20" fill="{col}" stroke="{line}" stroke-width="1.6"/><circle cx="-12" cy="-30" r="12" fill="{col}" stroke="{line}" stroke-width="1.6"/>'
            f'<circle cx="12" cy="-30" r="12" fill="{col}" stroke="{line}" stroke-width="1.6"/><circle cx="0" cy="-40" r="18.6" fill="{col}"/><circle cx="-12" cy="-30" r="10.6" fill="{col}"/><circle cx="12" cy="-30" r="10.6" fill="{col}"/>'
            f'<ellipse cx="-7" cy="-48" rx="6" ry="3" fill="#FFFFFF" opacity="0.18"/></g>')
def pine(x, b, col, s=1.0, line=INK):
    return (f'<g transform="translate({x},{b}) scale({s})"><path d="M0,-58 L14,-30 H7 L18,-8 H-18 L-7,-30 H-14 Z" fill="{col}" stroke="{line}" stroke-width="1.5" stroke-linejoin="round"/>'
            f'<rect x="-3" y="-8" width="6" height="8" fill="{line}"/></g>')
def tomb_sil(x, b, col, line, kind, s=1.0):
    if kind == 0: d = "M-10,0 V-18 Q-10,-28 0,-28 Q10,-28 10,-18 V0 Z"
    elif kind == 1: d = "M-3,0 V-20 H-10 V-26 H-3 V-33 H3 V-26 H10 V-20 H3 V0 Z"
    else: d = "M-12,0 V-14 Q-12,-20 -6,-20 H6 Q12,-20 12,-14 V0 Z"
    return f'<g transform="translate({x},{b}) scale({s})"><path d="{d}" fill="{col}" stroke="{line}" stroke-width="1.4" stroke-linejoin="round"/></g>'
def mausoleum(x, b, col, line):
    return (f'<g transform="translate({x},{b})"><rect x="-26" y="-40" width="52" height="40" fill="{col}" stroke="{line}" stroke-width="1.5"/>'
            f'<path d="M-32,-40 L0,-60 L32,-40 Z" fill="{col}" stroke="{line}" stroke-width="1.5" stroke-linejoin="round"/>'
            f'<path d="M-8,0 V-18 Q-8,-26 0,-26 Q8,-26 8,-18 V0 Z" fill="#FFE9A8" opacity="0.75" stroke="{line}" stroke-width="1.2"/>'
            f'<path d="M-20,-36 V0 M20,-36 V0" stroke="{line}" stroke-width="1.2" opacity="0.6"/>{glow(0, -14, 26, "#FFE9A8", 0.25)}</g>')
def iron_fence(x, b, w, col, line=INK):
    s = [f'<g transform="translate({x},{b})">', f'<path d="M0,-10 H{w} M0,-28 H{w}" stroke="{col}" stroke-width="3"/>']
    for i in range(0, w + 1, 10):
        s.append(f'<path d="M{i},0 V-34" stroke="{col}" stroke-width="2.6"/><circle cx="{i}" cy="-36" r="2.6" fill="{col}"/>')
    s.append('</g>'); return "".join(s)
def lantern(x, b):
    return (f'<g transform="translate({x},{b})">{glow(0, -44, 30, "#FFE9A8", 0.4)}<path d="M0,0 V-36" stroke="{INK}" stroke-width="2.4"/>'
            f'<path d="M-6,-36 H6 L5,-50 H-5 Z" fill="#FFE9A8" stroke="{INK}" stroke-width="1.6" stroke-linejoin="round"/><path d="M-7,-50 L0,-56 L7,-50 Z" fill="#7E6BA8" stroke="{INK}" stroke-width="1.4"/></g>')
def mushroom(x, b, col):
    return (f'<g transform="translate({x},{b})"><rect x="-2.5" y="-9" width="5" height="9" rx="2" fill="#F6EFE6" stroke="{INK}" stroke-width="1.2"/>'
            f'<path d="M-9,-8 Q-9,-17 0,-17 Q9,-17 9,-8 Z" fill="{col}" stroke="{INK}" stroke-width="1.4"/><circle cx="-3" cy="-12" r="1.5" fill="#FFF"/><circle cx="3.5" cy="-10.5" r="1.1" fill="#FFF"/></g>')
def bush(x, b, w, col, col2, line=INK):
    n = max(2, int(w / 18)); s = [f'<g transform="translate({x},{b})">']
    blobs = [(w * (i + 0.5) / n, -10 - 6 * ((i * 7) % 3) / 2, 12 + (i % 2) * 4) for i in range(n)]
    s.append("".join(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r}" fill="{col}" stroke="{line}" stroke-width="1.5"/>' for cx, cy, r in blobs))
    s.append(f'<rect x="0" y="-12" width="{w}" height="12" fill="{col}"/>')
    s.append("".join(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r-1.3}" fill="{col}"/>' for cx, cy, r in blobs))
    s.append("".join(f'<circle cx="{cx-3:.1f}" cy="{cy-4:.1f}" r="3" fill="{col2}" opacity="0.6"/>' for cx, cy, r in blobs))
    s.append('</g>'); return "".join(s)
def jack(x, b, s=1.0):
    return (f'<g transform="translate({x},{b}) scale({s})">{glow(0, -8, 16, "#FFC9A0", 0.35)}<ellipse cx="0" cy="-8" rx="11" ry="8.5" fill="#FFB98A" stroke="{INK}" stroke-width="1.4"/>'
            f'<path d="M-4,-16 V-8 M4,-16 V-8" stroke="#E8996E" stroke-width="1"/><path d="M0,-16 V-20" stroke="#5E8A73" stroke-width="2.2" stroke-linecap="round"/>'
            f'<path d="M-6,-10 l2,-3 l2,3 z M2,-10 l2,-3 l2,3 z" fill="#FFF0A8"/><path d="M-4,-5 Q0,-2 4,-5" stroke="#FFF0A8" stroke-width="1.4" fill="none"/></g>')
def house(x, b, w, h, col, roof, lit=True, line=INK, chimney=True):
    s = [f'<g transform="translate({x},{b})">']
    if chimney: s.append(f'<rect x="{w*0.62}" y="{-h-h*0.55}" width="{w*0.12}" height="{h*0.4}" fill="{roof}" stroke="{line}" stroke-width="1.2"/>')
    s.append(f'<rect x="0" y="{-h}" width="{w}" height="{h}" fill="{col}" stroke="{line}" stroke-width="1.4"/>')
    s.append(f'<path d="M{-w*0.1},{-h} L{w/2},{-h-h*0.6} L{w*1.1},{-h} Z" fill="{roof}" stroke="{line}" stroke-width="1.4" stroke-linejoin="round"/>')
    if lit:
        ww = max(4, w * 0.18)
        for wx in (w * 0.18, w * 0.62):
            s.append(f'<rect x="{wx:.1f}" y="{-h*0.72:.1f}" width="{ww:.1f}" height="{ww*1.1:.1f}" rx="1.5" fill="#FFE9A8" stroke="{line}" stroke-width="1"/>')
    s.append('</g>'); return "".join(s)
def church(x, b, col, roof, line=INK):
    return (f'<g transform="translate({x},{b})">{glow(60, -60, 70, "#FFE9A8", 0.18)}'
            f'<rect x="0" y="-70" width="90" height="70" fill="{col}" stroke="{line}" stroke-width="1.6"/>'
            f'<path d="M-6,-70 L45,-104 L96,-70 Z" fill="{roof}" stroke="{line}" stroke-width="1.6" stroke-linejoin="round"/>'
            f'<rect x="90" y="-112" width="36" height="112" fill="{col}" stroke="{line}" stroke-width="1.6"/>'
            f'<path d="M86,-112 L108,-168 L130,-112 Z" fill="{roof}" stroke="{line}" stroke-width="1.6" stroke-linejoin="round"/>'
            f'<path d="M108,-168 V-182 M102,-176 H114" stroke="#F6D58E" stroke-width="2.4" stroke-linecap="round"/>'
            f'<circle cx="45" cy="-48" r="13" fill="#FFE3F0" stroke="{line}" stroke-width="1.4"/>'
            + "".join(f'<path d="M45,-48 L{45+13*math.cos(math.radians(a)):.1f},{-48+13*math.sin(math.radians(a)):.1f}" stroke="{c}" stroke-width="3"/>' for a, c in zip(range(0, 360, 45), ["#FFB6CC", "#9EF0E0", "#FFE08A", "#C9B6F0"] * 2))
            + f'<circle cx="45" cy="-48" r="13" fill="none" stroke="{line}" stroke-width="1.4"/><circle cx="45" cy="-48" r="3.5" fill="#FFE9A8" stroke="{line}" stroke-width="1"/>'
            f'<path d="M100,0 V-22 Q100,-32 108,-32 Q116,-32 116,-22 V0 Z" fill="#FFE9A8" stroke="{line}" stroke-width="1.4"/>'
            f'<path d="M98,-86 V-96 Q98,-102 108,-102 Q118,-102 118,-96 V-86 Z" fill="#FFE9A8" stroke="{line}" stroke-width="1.2"/>'
            + "".join(f'<path d="M{wx},-14 V-30 Q{wx},-36 {wx+5},-36 Q{wx+10},-36 {wx+10},-30 V-14 Z" fill="#C9E6FF" stroke="{line}" stroke-width="1.2"/>' for wx in (12, 68)) + '</g>')
def street_lamp(x, b, col="#7E6BA8", glowc="#FFE9A8"):
    return (f'<g transform="translate({x},{b})">{glow(0, -70, 40, glowc, 0.38)}<path d="M0,0 V-64 Q0,-72 8,-72" stroke="{INK}" stroke-width="5" fill="none" stroke-linecap="round"/>'
            f'<path d="M0,0 V-64 Q0,-72 8,-72" stroke="{col}" stroke-width="2.6" fill="none" stroke-linecap="round"/>'
            f'<path d="M3,-72 H15 L13,-66 H5 Z" fill="{glowc}" stroke="{INK}" stroke-width="1.4" stroke-linejoin="round"/><rect x="-5" y="-4" width="10" height="4" rx="1" fill="{col}" stroke="{INK}" stroke-width="1.2"/></g>')
def stone_wall(x, b, w, col, line=INK):
    s = [f'<g transform="translate({x},{b})"><rect x="0" y="-18" width="{w}" height="18" rx="3" fill="{col}" stroke="{line}" stroke-width="1.4"/>']
    for i in range(0, w - 4, 16): s.append(f'<path d="M{i+8},-18 V-9 M{i},-9 H{i+16} M{i},-9 V0" stroke="{line}" stroke-width="0.9" opacity="0.5"/>')
    s.append(f'<rect x="-2" y="-22" width="{w+4}" height="5" rx="2" fill="{col}" stroke="{line}" stroke-width="1.2"/></g>'); return "".join(s)
def barn(x, b):
    return (f'<g transform="translate({x},{b})"><rect x="0" y="-46" width="64" height="46" fill="#C98A9A" stroke="{INK}" stroke-width="1.6"/>'
            f'<path d="M-6,-46 L8,-70 H56 L70,-46 Z" fill="#8E6A86" stroke="{INK}" stroke-width="1.6" stroke-linejoin="round"/>'
            f'<rect x="20" y="-30" width="24" height="30" fill="#F3E2CF" stroke="{INK}" stroke-width="1.4"/><path d="M20,-30 L44,0 M44,-30 L20,0" stroke="#C98A9A" stroke-width="2.4"/>'
            f'<rect x="26" y="-58" width="12" height="9" rx="2" fill="#FFE9A8" stroke="{INK}" stroke-width="1.1"/></g>')
def windmill(x, b, rot=10):
    blades = "".join(f'<g transform="rotate({rot+a})"><rect x="-3" y="-38" width="6" height="36" fill="#F3E2CF" stroke="{INK}" stroke-width="1.2"/>'
                     f'<rect x="3" y="-36" width="8" height="28" fill="#E6D8F2" stroke="{INK}" stroke-width="1"/></g>' for a in (0, 90, 180, 270))
    return (f'<g transform="translate({x},{b})"><path d="M-14,0 L-9,-70 H9 L14,0 Z" fill="#E6D0C4" stroke="{INK}" stroke-width="1.6" stroke-linejoin="round"/>'
            f'<path d="M-12,-70 L0,-84 L12,-70 Z" fill="#8E6A86" stroke="{INK}" stroke-width="1.4"/><rect x="-4" y="-36" width="8" height="10" rx="2" fill="#FFE9A8" stroke="{INK}" stroke-width="1"/>'
            f'<g transform="translate(0,-70)">{blades}<circle r="3.4" fill="#F6D58E" stroke="{INK}" stroke-width="1.2"/></g></g>')
def haystack(x, b):
    return (f'<g transform="translate({x},{b})"><path d="M-16,0 Q-18,-24 0,-28 Q18,-24 16,0 Z" fill="#F6D58E" stroke="{INK}" stroke-width="1.4"/>'
            f'<path d="M-10,-6 l3,-8 M-2,-4 l1,-10 M7,-6 l-2,-9 M-6,-18 l3,-5 M5,-19 l-2,-5" stroke="#D9AE5A" stroke-width="1.2" stroke-linecap="round"/></g>')
def wood_fence(x, b, w, col="#E6CDB4"):
    s = [f'<g transform="translate({x},{b})"><path d="M0,-10 H{w} M0,-22 H{w}" stroke="{INK}" stroke-width="5"/><path d="M0,-10 H{w} M0,-22 H{w}" stroke="{col}" stroke-width="3"/>']
    for i in range(0, w + 1, 20):
        s.append(f'<path d="M{i-3},0 V-26 L{i},-30 L{i+3},-26 V0 Z" fill="{col}" stroke="{INK}" stroke-width="1.3" stroke-linejoin="round"/>')
    s.append('</g>'); return "".join(s)
def corn(x, b, s=1.0):
    return (f'<g transform="translate({x},{b}) scale({s})"><path d="M0,0 C1,-20 -1,-34 0,-48" stroke="#8CCBA9" stroke-width="3" fill="none"/>'
            f'<path d="M0,-14 C-10,-18 -14,-24 -16,-30 C-8,-26 -4,-22 0,-20 M0,-26 C10,-30 14,-36 15,-42 C8,-38 4,-34 0,-32 M0,-36 C-8,-40 -10,-46 -11,-52 C-5,-48 -2,-44 0,-42" fill="#A9DDBF" stroke="{INK}" stroke-width="1.1"/>'
            f'<ellipse cx="3" cy="-30" rx="3" ry="7" fill="#FFE08A" stroke="{INK}" stroke-width="1" transform="rotate(15 3 -30)"/></g>')
def school(x, b, col="#E6D0E0", roof="#9ED8C8"):
    s = [f'<g transform="translate({x},{b})">{glow(110, -50, 120, "#FFE9A8", 0.12)}',
         f'<rect x="0" y="-62" width="220" height="62" fill="{col}" stroke="{INK}" stroke-width="1.6"/>',
         f'<path d="M-6,-62 H226 L214,-74 H6 Z" fill="{roof}" stroke="{INK}" stroke-width="1.6" stroke-linejoin="round"/>',
         f'<rect x="90" y="-104" width="40" height="42" fill="{col}" stroke="{INK}" stroke-width="1.6"/>',
         f'<path d="M84,-104 L110,-126 L136,-104 Z" fill="{roof}" stroke="{INK}" stroke-width="1.6" stroke-linejoin="round"/>',
         f'<circle cx="110" cy="-86" r="11" fill="#FFF8EC" stroke="{INK}" stroke-width="1.5"/><path d="M110,-86 V-93 M110,-86 L115,-84" stroke="{INK}" stroke-width="1.5" stroke-linecap="round"/>',
         f'<path d="M98,0 V-26 Q98,-34 110,-34 Q122,-34 122,-26 V0 Z" fill="#FFE9A8" stroke="{INK}" stroke-width="1.4"/><path d="M110,-34 V0" stroke="{INK}" stroke-width="1"/>']
    for i, wx in enumerate((12, 40, 68, 140, 168, 196)):
        for wy in (-54, -28):
            lit = (i + wy) % 3 != 0
            s.append(f'<rect x="{wx-6}" y="{wy}" width="16" height="14" rx="2" fill="{"#FFE9A8" if lit else "#B9B3D9"}" stroke="{INK}" stroke-width="1.1"/><path d="M{wx+2},{wy} V{wy+14}" stroke="{INK}" stroke-width="0.8"/>')
    s.append(f'<path d="M110,-126 V-140" stroke="{INK}" stroke-width="1.6"/><path d="M110,-140 l10,3 l-10,3 Z" fill="#FFB6CC" stroke="{INK}" stroke-width="1"/>')
    s.append('</g>'); return "".join(s)
def bunting(x, b, w, h=60):
    s = [f'<g transform="translate({x},{b})"><path d="M0,0 V-{h} M{w},0 V-{h}" stroke="{INK}" stroke-width="2.4"/>',
         f'<path d="M0,-{h} Q{w/2},-{h-14} {w},-{h}" stroke="{INK}" stroke-width="1.2" fill="none"/>']
    cols = ["#FFB6CC", "#FFE08A", "#9EF0E0", "#C9B6F0"]
    n = int(w / 12)
    for i in range(1, n):
        t = i / n; px = w * t; py = -h + 14 * 4 * t * (1 - t) * 0.5 * 2
        s.append(f'<path d="M{px-4:.1f},{py:.1f} L{px+4:.1f},{py:.1f} L{px:.1f},{py+8:.1f} Z" fill="{cols[i%4]}" stroke="{INK}" stroke-width="0.8"/>')
    s.append('</g>'); return "".join(s)
def swing(x, b):
    return (f'<g transform="translate({x},{b})"><path d="M-30,0 L-20,-56 L-10,0 M30,0 L20,-56 L10,0 M-22,-54 H22" stroke="#C9B6F0" stroke-width="4" fill="none" stroke-linejoin="round"/>'
            f'<path d="M-30,0 L-20,-56 L-10,0 M30,0 L20,-56 L10,0 M-22,-54 H22" stroke="{INK}" stroke-width="1" fill="none" opacity="0.6"/>'
            f'<path d="M-6,-54 V-18 M6,-54 V-18" stroke="{INK}" stroke-width="1.2"/><rect x="-9" y="-19" width="18" height="4" rx="2" fill="#FFB6CC" stroke="{INK}" stroke-width="1"/></g>')
def slide(x, b):
    return (f'<g transform="translate({x},{b})"><path d="M0,0 V-46 M14,0 V-46 M0,-46 H14 M2,-10 H12 M2,-22 H12 M2,-34 H12" stroke="#FFE08A" stroke-width="3" fill="none"/>'
            f'<path d="M14,-46 C30,-44 34,-10 52,-4 L52,0 C30,-4 26,-38 14,-40 Z" fill="#9EF0E0" stroke="{INK}" stroke-width="1.4" stroke-linejoin="round"/></g>')
def building(x, b, w, h, col, line=INK, seed=0, neon=None, lit=0.5, win="#FFE9A8", dark="#5E5A96"):
    random.seed(seed)
    s = [f'<g transform="translate({x},{b})"><rect x="0" y="{-h}" width="{w}" height="{h}" rx="2" fill="{col}" stroke="{line}" stroke-width="1.4"/>']
    for wy in range(-h + 10, -8, 14):
        for wx in range(6, w - 8, 11):
            s.append(f'<rect x="{wx}" y="{wy}" width="6" height="7" rx="1" fill="{win if random.random() < lit else dark}"/>')
    if neon:
        col_n, kind = neon
        if kind == "bar":
            s.append(f'<path d="M{w-4},{-h+8} V-10" stroke="{col_n}" stroke-width="6" opacity="0.3"/><path d="M{w-4},{-h+8} V-10" stroke="{col_n}" stroke-width="2"/>')
        else:
            cx, cy = w / 2, -h + 22
            s.append(f'<rect x="{cx-16}" y="{cy-10}" width="32" height="20" rx="6" fill="#2E2A5A" stroke="{line}" stroke-width="1.2"/>' + glow(cx, cy, 24, col_n, 0.35) +
                     f'<path d="M{cx-8},{cy+4} a6,6 0 1,1 4,-9 a6,6 0 1,1 4,9" stroke="{col_n}" stroke-width="2" fill="none"/>' if kind == "moon" else
                     f'<rect x="{cx-16}" y="{cy-10}" width="32" height="20" rx="6" fill="#2E2A5A" stroke="{line}" stroke-width="1.2"/>' + glow(cx, cy, 24, col_n, 0.35) +
                     f'<path d="M{cx},{cy+6} C{cx-9},{cy} {cx-8},{cy-7} {cx-3.5},{cy-7} C{cx-1.5},{cy-7} {cx},{cy-5} {cx},{cy-4} C{cx},{cy-5} {cx+1.5},{cy-7} {cx+3.5},{cy-7} C{cx+8},{cy-7} {cx+9},{cy} {cx},{cy+6} Z" stroke="{col_n}" stroke-width="2" fill="none"/>')
    s.append('</g>'); return "".join(s)
def bench(x, b):
    return (f'<g transform="translate({x},{b})"><path d="M2,0 V-10 M30,0 V-10" stroke="{INK}" stroke-width="2.4"/><rect x="0" y="-13" width="32" height="4" rx="2" fill="#FFC9A0" stroke="{INK}" stroke-width="1.1"/>'
            f'<rect x="0" y="-22" width="32" height="4" rx="2" fill="#FFC9A0" stroke="{INK}" stroke-width="1.1"/><path d="M4,-18 V-13 M28,-18 V-13" stroke="{INK}" stroke-width="1.4"/></g>')
def mailbox(x, b):
    return (f'<g transform="translate({x},{b})"><rect x="-2" y="-14" width="4" height="14" fill="{INK}"/><path d="M-9,-14 V-26 Q-9,-32 0,-32 Q9,-32 9,-26 V-14 Z" fill="#FFB6CC" stroke="{INK}" stroke-width="1.4"/>'
            f'<path d="M-5,-24 H5" stroke="{INK}" stroke-width="1.6" stroke-linecap="round"/></g>')
def cone(x, b):
    return (f'<g transform="translate({x},{b})"><path d="M-7,0 L-2,-18 H2 L7,0 Z" fill="#FFC9A0" stroke="{INK}" stroke-width="1.2" stroke-linejoin="round"/>'
            f'<path d="M-4.5,-8 H4.5" stroke="#FFF" stroke-width="2.4"/><rect x="-9" y="-2" width="18" height="2.5" rx="1" fill="#FFC9A0" stroke="{INK}" stroke-width="1"/></g>')
def planet(x, y, r, col, col2, ring=None, line="#3E3470"):
    s = [f'<g transform="translate({x},{y})">', glow(0, 0, r * 1.8, col, 0.22)]
    if ring:
        s.append(f'<ellipse cx="0" cy="0" rx="{r*1.75}" ry="{r*0.45}" fill="none" stroke="{ring}" stroke-width="{r*0.16:.1f}" transform="rotate(-14)" opacity="0.9"/>')
    s.append(f'<radialGradient id="pl{int(x)}{int(y)}" cx="0.35" cy="0.3" r="0.8"><stop offset="0.2" stop-color="{col}"/><stop offset="1" stop-color="{col2}"/></radialGradient>'
             f'<circle r="{r}" fill="url(#pl{int(x)}{int(y)})" stroke="{line}" stroke-width="1.8"/>'
             f'<path d="M{-r*0.85:.1f},{-r*0.2:.1f} Q0,{r*0.05:.1f} {r*0.85:.1f},{-r*0.35:.1f}" stroke="{col2}" stroke-width="{r*0.12:.1f}" fill="none" opacity="0.6"/>'
             f'<ellipse cx="{-r*0.35:.1f}" cy="{-r*0.45:.1f}" rx="{r*0.28:.1f}" ry="{r*0.14:.1f}" fill="#FFF" opacity="0.5" transform="rotate(-30 {-r*0.35:.1f} {-r*0.45:.1f})"/>')
    if ring:  # front half of ring
        s.append(f'<path d="M{-r*1.7:.1f},{r*0.42:.1f} A{r*1.75:.1f},{r*0.45:.1f} 0 0,0 {r*1.7:.1f},{-r*0.42:.1f}" fill="none" stroke="{ring}" stroke-width="{r*0.16:.1f}" transform="rotate(-14)"/>')
    s.append('</g>'); return "".join(s)
def nebula(x, y, rx, ry, col, op):
    k = f"nb{int(x)}{int(y)}"
    return (f'<radialGradient id="{k}"><stop offset="0" stop-color="{col}" stop-opacity="{op}"/><stop offset="1" stop-color="{col}" stop-opacity="0"/></radialGradient>'
            f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="url(#{k})"/>')
def rocklet(x, y, r, rot):
    return (f'<g transform="translate({x},{y}) rotate({rot})"><path d="M{-r},0 Q{-r},{-r*0.9} 0,{-r} Q{r*1.1},{-r*0.8} {r},{r*0.1} Q{r*0.6},{r} {-r*0.2},{r*0.9} Q{-r},{r*0.7} {-r},0 Z" fill="#B9B5E2" stroke="#3E3470" stroke-width="1.3"/>'
            f'<circle cx="{r*0.2:.1f}" cy="{-r*0.2:.1f}" r="{r*0.25:.1f}" fill="#9F9BD2"/></g>')

# ------------------------------------------------------------------ stage definitions
def stars(seed, n, ymax, cols=("#FFF6D6",), sparkles=0):
    random.seed(seed); out = []
    for _ in range(n):
        x, y = random.uniform(0, TW), random.uniform(10, ymax) ** 1.0
        r = random.choice([0.7, 0.9, 1.1, 1.4]); c = random.choice(cols); op = random.uniform(0.45, 0.95)
        out.append((x, 2, "sky", (lambda x, b, y=y, r=r, c=c, op=op: star_dot(x, y, r, c, op))))
    for _ in range(sparkles):
        x, y = random.uniform(0, TW), random.uniform(20, ymax)
        r = random.choice([2.2, 2.8, 3.4])
        out.append((x, 8, "sky", (lambda x, b, y=y, r=r: sparkle(round(x, 1), round(y, 1), r, "#FFF8DC", "#F2D48A", 0.9, 0.4))))
    return out

def E(x, w, fn): return (x, w, "ground", fn)
def S(x, w, fn): return (x, w, "sky", fn)

STAGES = {}
# ---- graveyard
STAGES["graveyard"] = {
  "far": dict(sky=("#241D40", "#5E4A86"), band=(periodic(468, [(10, 1, 0.3), (6, 3, 1.2), (3, 5, 2)]), "#463A6A"),
              els=stars(1, 70, 380, ("#FFF6D6", "#E3D4FF"), 5) + [S(470, 120, lambda x, b: moon(x + 60, 120, 38))] +
                  [E(x, 30, (lambda x, b, s=s: bare_tree(x, b + 2, "#3E3362", s))) for x, s in ((80, 0.5), (300, 0.6), (420, 0.45), (610, 0.55))]),
  "mid": dict(band=(periodic(518, [(8, 1, 1.0), (6, 2, 0.2), (3, 4, 1.7)]), "#54467E"),
              els=[E(x, 24, (lambda x, b, k=k: tomb_sil(x, b + 3, "#6E5E9C", INK, k, 1.0))) for x, k in ((40, 0), (75, 1), (150, 2), (230, 0), (262, 1), (500, 2), (560, 0), (600, 1), (680, 0))] +
                  [E(330, 60, lambda x, b: mausoleum(x + 30, b + 4, "#6E5E9C", INK)), E(420, 40, lambda x, b: bare_tree(x, b + 4, "#4A3D72", 0.9, None)),
                   E(110, 40, lambda x, b: bare_tree(x, b + 4, "#4A3D72", 0.75))]),
  "near": dict(band=(periodic(555, [(3, 2, 0.5), (2, 5, 1.1)]), "#3F3263"),
               els=[E(0, 90, lambda x, b: iron_fence(x, b + 2, 90, "#7E6BA8")), E(390, 110, lambda x, b: iron_fence(x, b + 2, 110, "#7E6BA8")),
                    E(120, 80, lambda x, b: bush(x, b + 3, 80, "#4E417C", "#7E6BA8")), E(560, 70, lambda x, b: bush(x, b + 3, 70, "#4E417C", "#7E6BA8")),
                    E(230, 10, lambda x, b: lantern(x, b + 2)), E(670, 10, lambda x, b: lantern(x, b + 2)),
                    E(300, 20, lambda x, b: jack(x, b + 3, 1.0)), E(530, 10, lambda x, b: mushroom(x, b + 2, "#FFB6CC")), E(540, 10, lambda x, b: mushroom(x + 6, b + 2, "#C9B6F0")),
                    E(700, 30, lambda x, b: jack(x, b + 3, 0.8))]),
}
# ---- church
STAGES["church"] = {
  "far": dict(sky=("#222350", "#5A5490"), band=(periodic(462, [(9, 1, 2.0), (6, 2, 0.6), (3, 6, 1.0)]), "#403C70"),
              els=stars(2, 60, 360, ("#FFF6D6", "#C9F0E6"), 4) + [S(120, 80, lambda x, b: moon(x + 40, 110, 30, True, "#2E2E5C"))] +
                  [E(x, 30, (lambda x, b, w=w: house(x, b + 3, w, w * 0.7, "#4E4A82", "#47437A", True, "#3A3668", False))) for x, w in ((240, 18), (270, 22), (520, 20), (548, 16), (640, 20))]),
  "mid": dict(band=(periodic(522, [(6, 1, 0.4), (4, 3, 2.2)]), "#4E4A82"),
              els=[E(150, 130, lambda x, b: church(x, b + 4, "#D9D2EE", "#A9B4E8")),
                   E(470, 70, lambda x, b: house(x, b + 4, 56, 40, "#D9CFE6", "#B9A8DB", True)),
                   E(40, 40, lambda x, b: round_tree(x + 20, b + 4, "#5E9C8A", "#6A4A5E", 0.9)), E(380, 40, lambda x, b: round_tree(x + 20, b + 4, "#5E9C8A", "#6A4A5E", 1.0)),
                   E(620, 40, lambda x, b: pine(x + 20, b + 4, "#4F8A7A", 1.1)), E(670, 40, lambda x, b: pine(x + 20, b + 4, "#4F8A7A", 0.85))]),
  "near": dict(band=(periodic(556, [(2, 2, 0.2), (2, 3, 1.6)]), "#3A3866"),
               els=[E(0, 150, lambda x, b: stone_wall(x, b + 2, 150, "#8F87C0")), E(420, 130, lambda x, b: stone_wall(x, b + 2, 130, "#8F87C0")),
                    E(200, 10, lambda x, b: street_lamp(x, b + 2)), E(600, 10, lambda x, b: street_lamp(x, b + 2)),
                    E(250, 100, lambda x, b: bush(x, b + 3, 100, "#4E7A7A", "#9ED8C8")), E(660, 60, lambda x, b: bush(x, b + 3, 60, "#4E7A7A", "#9ED8C8"))]),
}
# ---- countryside
STAGES["countryside"] = {
  "far": dict(sky=("#1E2C4A", "#4E6E8A"), band=(periodic(455, [(16, 1, 0.8), (8, 2, 2.4), (4, 4, 0.1)]), "#35506A"),
              els=stars(3, 55, 340, ("#FFF6D6", "#C9F0E6"), 3) + [S(560, 120, lambda x, b: moon(x + 60, 130, 46))] +
                  [E(x, 20, (lambda x, b: pine(x, b + 3, "#2E4860", 0.45, "#2A4058"))) for x in (60, 80, 330, 350, 372, 640)]),
  "mid": dict(band=(periodic(515, [(10, 1, 2.6), (6, 2, 1.0), (2, 5, 0.4)]), "#426078"),
              els=[E(90, 70, lambda x, b: barn(x, b + 4)), E(250, 30, lambda x, b: windmill(x + 15, b + 4, 15)),
                   E(420, 60, lambda x, b: house(x, b + 4, 48, 34, "#E6D0C4", "#8E6A86", True)),
                   E(180, 30, lambda x, b: haystack(x + 15, b + 4)), E(560, 30, lambda x, b: haystack(x + 15, b + 4)), E(600, 30, lambda x, b: haystack(x + 20, b + 4)),
                   E(670, 40, lambda x, b: round_tree(x + 20, b + 4, "#5E9C8A", "#6A4A5E", 0.8))]),
  "near": dict(band=(periodic(556, [(3, 1, 1.1), (2, 4, 0.3)]), "#2F4558"),
               els=[E(0, 200, lambda x, b: wood_fence(x, b + 2, 200)), E(420, 160, lambda x, b: wood_fence(x, b + 2, 160))] +
                   [E(x, 20, (lambda x, b, s=s: corn(x, b + 2, s))) for x, s in ((230, 1.0), (250, 0.9), (272, 1.1), (300, 0.95), (620, 1.0), (645, 1.1), (668, 0.9))] +
                   [E(x, 20, (lambda x, b, s=s: jack(x, b + 3, s))) for x, s in ((60, 0.9), (140, 1.1), (350, 0.8), (500, 1.0), (700, 0.85))]),
}
# ---- schools
STAGES["schools"] = {
  "far": dict(sky=("#26245A", "#6E5694"), band=(periodic(460, [(8, 1, 1.4), (5, 3, 0.2), (3, 5, 2.2)]), "#463F72"),
              els=stars(4, 60, 360, ("#FFF6D6", "#FFD6E4"), 4) + [S(60, 80, lambda x, b: moon(x + 40, 100, 26, True, "#2A2860"))] +
                  [E(x, 30, (lambda x, b, w=w: house(x, b + 3, w, w * 0.8, "#544C86", "#4A4380", True, "#3E3870", True))) for x, w in ((200, 22), (230, 18), (380, 20), (410, 24), (600, 20), (630, 18))]),
  "mid": dict(band=(periodic(522, [(5, 1, 0.9), (3, 3, 1.9)]), "#554C86"),
              els=[E(220, 230, lambda x, b: school(x, b + 4)), E(40, 60, lambda x, b: round_tree(x + 30, b + 4, "#6AA898", "#6A4A5E", 1.1)),
                   E(520, 120, lambda x, b: bunting(x, b + 4, 120, 56)), E(660, 40, lambda x, b: round_tree(x + 20, b + 4, "#6AA898", "#6A4A5E", 0.9))]),
  "near": dict(band=(periodic(556, [(2, 2, 2.2), (2, 3, 0.4)]), "#3C3568"),
               els=[E(60, 60, lambda x, b: swing(x + 30, b + 2)), E(200, 60, lambda x, b: slide(x, b + 2)),
                    E(300, 120, lambda x, b: wood_fence(x, b + 2, 120, "#C9B6E8")), E(470, 80, lambda x, b: bush(x, b + 3, 80, "#4E6E7A", "#9ED8C8")),
                    E(600, 20, lambda x, b: round_tree(x + 10, b + 2, "#5E8E86", "#6A4A5E", 0.7)), E(680, 20, lambda x, b: mushroom(x, b + 2, "#FFE08A"))]),
}
# ---- city
city_far = [E(x, w, (lambda x, b, w=w, h=h, sd=sd: building(x, b + 2, w, h, "#3E3870", "#34305E", sd, None, 0.25, "#C9B6E8", "#4A4480"))) for sd, (x, w, h) in
            enumerate([(0, 40, 120), (44, 30, 170), (78, 46, 110), (130, 34, 190), (170, 52, 130), (228, 30, 160), (262, 46, 105), (314, 36, 180), (356, 50, 125),
                       (412, 32, 165), (450, 44, 115), (500, 34, 200), (540, 50, 135), (596, 30, 170), (632, 46, 120), (684, 36, 160)])]
STAGES["city"] = {
  "far": dict(sky=("#1C2044", "#4C3E7A"), band=(periodic(560, [(0, 1, 0)]), "#34305E"),
              els=stars(5, 45, 260, ("#FFF6D6", "#FFD6E4"), 2) + [S(0, 720, lambda x, b: nebula(x + 360, 420, 420, 130, "#FFB6CC", 0.18))] + city_far),
  "mid": dict(band=(periodic(560, [(0, 1, 0)]), "#3E3874"),
              els=[E(x, w, (lambda x, b, w=w, h=h, sd=sd, n=n: building(x, b + 2, w, h, col, INK, sd + 40, n, 0.55))) for sd, (x, w, h, col, n) in enumerate([
                   (10, 70, 210, "#6E66A8", ("#FF9EC8", "bar")), (90, 60, 160, "#7A70B4", ("#9EF0E0", "heart")), (160, 80, 250, "#635CA0", ("#FFE08A", "bar")),
                   (250, 64, 180, "#7A70B4", ("#FF9EC8", "moon")), (326, 74, 230, "#6E66A8", None), (412, 60, 150, "#635CA0", ("#9EF0E0", "bar")),
                   (484, 86, 270, "#7A70B4", ("#FF9EC8", "heart")), (582, 62, 190, "#6E66A8", ("#FFE08A", "moon")), (654, 60, 220, "#635CA0", ("#9EF0E0", "bar"))])]),
  "near": dict(band=(periodic(557, [(0, 1, 0)]), "#2E2A56"),
               els=[E(40, 10, lambda x, b: street_lamp(x, b + 1, "#9EF0E0", "#FFE9A8")), E(400, 10, lambda x, b: street_lamp(x, b + 1, "#9EF0E0", "#FFE9A8")),
                    E(120, 32, lambda x, b: bench(x, b + 1)), E(500, 20, lambda x, b: mailbox(x, b + 1)),
                    E(220, 90, lambda x, b: bush(x, b + 3, 90, "#4E6E7A", "#9ED8C8")), E(600, 70, lambda x, b: bush(x, b + 3, 70, "#4E6E7A", "#9ED8C8")),
                    E(330, 14, lambda x, b: cone(x, b + 1)), E(690, 14, lambda x, b: cone(x, b + 1))]),
}
# ---- space (endless; no ground band)
STAGES["space"] = {
  "far": dict(sky=("#120F2C", "#2B2050"), band=None,
              els=stars(6, 160, 630, ("#FFF6D6", "#E3D4FF", "#C9F0E6", "#FFD6E4"), 10) +
                  [S(0, 720, lambda x, b: (nebula(x + 160, 220, 220, 120, "#FFB6CC", 0.28) + nebula(x + 520, 420, 240, 140, "#9EF0E0", 0.2) + nebula(x + 380, 120, 160, 80, "#C9B6F0", 0.25)))]),
  "mid": dict(band=None,
              els=[S(140, 160, lambda x, b: planet(x + 80, 200, 46, "#FFC2DD", "#E58AB0", "#C9F0E6")),
                   S(470, 80, lambda x, b: planet(x + 40, 420, 26, "#B8EBC8", "#7FC2A0")),
                   S(620, 40, lambda x, b: planet(x + 20, 110, 14, "#FFE3A0", "#E8B85A")),
                   S(330, 40, lambda x, b: planet(x + 20, 520, 11, "#C9B6F0", "#9C86D2"))]),
  "near": dict(band=None,
               els=[S(x, 20, (lambda x, b, y=y, r=r, ro=ro: rocklet(x, y, r, ro))) for x, y, r, ro in ((60, 160, 7, 10), (250, 470, 5, 40), (420, 90, 6, -20), (600, 330, 8, 70), (700, 560, 5, 0))] +
                   stars(7, 0, 600, sparkles=12)),
}

# lift far/mid hills a little so the backdrop fills more of the 640px world
for _st in ("graveyard", "church", "countryside", "schools"):
    for _layer, _dy in (("far", -34), ("mid", -22)):
        _f, _c = STAGES[_st][_layer]["band"]
        STAGES[_st][_layer]["band"] = ((lambda x, f=_f, d=_dy: f(x) + d), _c)

# ------------------------------------------------------------------ renderers
def band_path(yf, x0=0, x1=TW, step=6):
    pts = [(x, yf(x)) for x in range(x0, x1 + 1, step)]
    return f"M{x0},{H} " + " ".join(f"L{x:.1f},{y:.1f}" for x, y in pts) + f" L{x1},{H} Z"
def band_svg(yf, col, line=True):
    s = f'<path d="{band_path(yf)}" fill="{col}"/>'
    if line:
        s += f'<path d="' + "M" + " L".join(f"{x:.1f},{yf(x):.1f}" for x in range(0, TW + 1, 6)) + f'" fill="none" stroke="#FFFFFF" stroke-opacity="0.12" stroke-width="2"/>'
    return s
def sky_svg(top, bot):
    return (f'<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{top}"/><stop offset="1" stop-color="{bot}"/></linearGradient>'
            f'<rect width="{TW}" height="{H}" fill="url(#sky)"/>')
def place(el, x, yf):
    ex, w, kind, fn = el
    b = yf(x + w / 2) if (kind == "ground" and yf) else 0
    return fn(x, b)
def render_tile(stage, layer):
    L = STAGES[stage][layer]
    g = []
    if "sky" in L: g.append(sky_svg(*L["sky"]))
    yf = L["band"][0] if L.get("band") else None
    sky_els = [e for e in L["els"] if e[2] == "sky"]; gr_els = [e for e in L["els"] if e[2] == "ground"]
    for e in sky_els:
        for dx in (-TW, 0, TW):
            if e[0] + dx + e[1] + 200 > 0 and e[0] + dx - 200 < TW: g.append(place(e, e[0] + dx, yf))
    if yf: g.append(band_svg(yf, L["band"][1]))
    for e in gr_els:
        for dx in (-TW, 0, TW):
            if e[0] + dx + e[1] + 120 > 0 and e[0] + dx - 120 < TW: g.append(place(e, e[0] + dx, lambda X, yf=yf, dx=dx: yf(X - dx)))
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{TW}" height="{H}" viewBox="0 0 {TW} {H}">' + "".join(g) + '</svg>'

def render_trans(a, b, layer):
    A, B = STAGES[a][layer], STAGES[b][layer]
    g = []
    if "sky" in A:
        (t1, b1), (t2, b2) = A["sky"], B["sky"]
        g.append(f'<linearGradient id="ska" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{t1}"/><stop offset="1" stop-color="{b1}"/></linearGradient>'
                 f'<linearGradient id="skb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{t2}"/><stop offset="1" stop-color="{b2}"/></linearGradient>'
                 f'<linearGradient id="skm" x1="0" y1="0" x2="{TW}" y2="0" gradientUnits="userSpaceOnUse">'
                 + "".join(f'<stop offset="{t:.2f}" stop-color="#FFFFFF" stop-opacity="{wfun(t*TW):.3f}"/>' for t in [i / 20 for i in range(21)]) +
                 f'</linearGradient><mask id="skmask" maskUnits="userSpaceOnUse" x="0" y="0" width="{TW}" height="{H}"><rect width="{TW}" height="{H}" fill="url(#skm)"/></mask>'
                 f'<rect width="{TW}" height="{H}" fill="url(#ska)"/><rect width="{TW}" height="{H}" fill="url(#skb)" mask="url(#skmask)"/>')
    ya, yb = A["band"][0], B["band"][0]
    yf = lambda x: ya(x) * (1 - wfun(x)) + yb(x) * wfun(x)
    cut_a, cut_b = W0 - 10, W1 + 10
    def els(Lx, side):
        out = []
        for e in Lx["els"]:
            x, w = e[0], e[1]
            if side == "a":
                if x < cut_a: out.append((e, x))
                if x + w > TW - 40: out.append((e, x - TW))     # straddlers re-enter at the left edge
            else:
                if x > cut_b: out.append((e, x))
                if x < 80: out.append((e, x + TW))               # left-edge pieces of the incoming tile poke back in at x=720
        return out
    ea, eb = els(A, "a"), els(B, "b")
    for (e, x) in ea + eb:
        if e[2] == "sky":
            src = ya if (e, x) in ea else yb
            g.append(place(e, x, src))
    ca, cb = A["band"][1], B["band"][1]
    g.append(f'<linearGradient id="bandg" x1="0" y1="0" x2="{TW}" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0.35" stop-color="{ca}"/><stop offset="0.65" stop-color="{cb}"/></linearGradient>')
    g.append(f'<path d="{band_path(yf)}" fill="url(#bandg)"/>')
    g.append(f'<path d="' + "M" + " L".join(f"{x:.1f},{yf(x):.1f}" for x in range(0, TW + 1, 6)) + f'" fill="none" stroke="#FFFFFF" stroke-opacity="0.12" stroke-width="2"/>')
    if layer == "mid":
        g.append(round_tree(352, yf(352) + 4, hexmix("#5E9C8A", "#6AA898", 0.5), "#6A4A5E", 0.95))
    if layer == "near":
        g.append(bush(318, yf(350) + 3, 70, hexmix(A["band"][1], "#4E6E7A", 0.5), "#9ED8C8"))
    for (e, x) in ea + eb:
        if e[2] == "ground":
            src = ya if (e, x) in ea else yb
            g.append(place(e, x, lambda X, src=src, x=x, e0=e[0]: src(X - (x - e0))))
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{TW}" height="{H}" viewBox="0 0 {TW} {H}">' + "".join(g) + '</svg>'

ORDER = ["graveyard", "church", "countryside", "schools", "city"]
if __name__ == "__main__":
    for st in STAGES:
        for layer in ("far", "mid", "near"):
            FILES[f"bg-{st}-{layer}"] = render_tile(st, layer)
    for a, b in zip(ORDER, ORDER[1:]):
        for layer in ("far", "mid", "near"):
            FILES[f"bg-trans-{a}-{b}-{layer}"] = render_trans(a, b, layer)
    for k, v in FILES.items(): open(os.path.join(OUT, k + ".svg"), "w").write(v)
    print(len(FILES), "files")
