"""v0.3b: space hazards, meteor event, space pickup glow variant, rocket-launch cutscene sprites + launch sky."""
import os, math, random
from build_tombs import svg, flower, LW
from build_extras import sparkle, blush, happy_eyes, mini_ghost, pickup_ghost, eyes
from build_stage_columns import alien_head
OUT = os.path.join(os.path.dirname(__file__), "..")
FILES = {}

def lumpy(cx, cy, r, n=9, amp=0.12, seed=1):
    random.seed(seed)
    pts = []
    for i in range(n):
        a = i / n * 2 * math.pi
        rr = r * (1 + random.uniform(-amp, amp))
        pts.append((cx + math.cos(a) * rr, cy + math.sin(a) * rr))
    # smooth closed path through points (Catmull-Rom -> Bezier)
    d = f"M{pts[0][0]:.1f},{pts[0][1]:.1f} "
    for i in range(n):
        p0, p1, p2, p3 = pts[i - 1], pts[i], pts[(i + 1) % n], pts[(i + 2) % n]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        d += f"C{c1[0]:.1f},{c1[1]:.1f} {c2[0]:.1f},{c2[1]:.1f} {p2[0]:.1f},{p2[1]:.1f} "
    return d + "Z"

def crater(x, y, r, fill, line, rim):
    return (f'<ellipse cx="{x}" cy="{y}" rx="{r}" ry="{r*0.8:.2f}" fill="{fill}" stroke="{line}" stroke-width="0.9"/>'
            f'<path d="M{x-r*0.75:.1f},{y+r*0.2:.1f} Q{x},{y+r:.1f} {x+r*0.75:.1f},{y+r*0.2:.1f}" stroke="{rim}" stroke-width="1" fill="none" stroke-linecap="round"/>')

def mini_asteroid():
    line = "#4E4C80"
    g = ['<defs><radialGradient id="ag" cx="0.38" cy="0.32" r="0.8"><stop offset="0.3" stop-color="#D6D3F2"/><stop offset="1" stop-color="#A9A5DA"/></radialGradient></defs>',
         f'<path d="{lumpy(20, 20, 15.8, 9, 0.1, 4)}" fill="url(#ag)" stroke="{line}" stroke-width="2" stroke-linejoin="round"/>',
         crater(27, 12, 3.4, "#B9B5E2", line, "#EEEDFF"), crater(10.5, 24, 2.6, "#B9B5E2", line, "#EEEDFF"), crater(28, 29, 2.2, "#B9B5E2", line, "#EEEDFF"),
         '<ellipse cx="13" cy="11" rx="3.4" ry="1.8" fill="#FFF" opacity="0.75" transform="rotate(-35 13 11)"/>',
         happy_eyes(15.5, 23.5, 19.5, 2.3, "#3E2C5C", 1.5), blush(12.5, 26.5, 23, 2, 1.2),
         '<path d="M18.4,23 Q19.5,24.4 20.6,23" stroke="#3E2C5C" stroke-width="1.1" fill="none" stroke-linecap="round"/>']
    return svg(40, 40, "".join(g))

def alien(frame):
    dy = 0 if frame == "0" else -1.5
    line = "#3E5A4E"
    hands = (("M7,26 Q3,22 4,18", "M33,26 Q37,22 36,18") if frame == "0" else ("M7,25 Q2,26 2,30", "M33,25 Q37,20 36,15"))
    g = ['<defs><radialGradient id="al" cx="0.4" cy="0.3" r="0.8"><stop offset="0.35" stop-color="#C9F3D8"/><stop offset="1" stop-color="#93D9B4"/></radialGradient>'
         '<radialGradient id="ash"><stop offset="0" stop-color="#9EF0E0" stop-opacity="0.45"/><stop offset="1" stop-color="#9EF0E0" stop-opacity="0"/></radialGradient></defs>',
         '<ellipse cx="20" cy="37" rx="11" ry="3" fill="url(#ash)"/>',
         f'<g transform="translate(0,{dy})">']
    for h in hands:
        g.append(f'<path d="{h}" stroke="{line}" stroke-width="4.6" fill="none" stroke-linecap="round"/><path d="{h}" stroke="#B8EBC8" stroke-width="2.6" fill="none" stroke-linecap="round"/>')
    a1, a2 = (("M15,9 L12,3", "M25,9 L28,3") if frame == "0" else ("M15,9 L11,4", "M25,9 L29,4"))
    g.append(f'<path d="{a1} M{a2[1:]}" stroke="{line}" stroke-width="1.5" stroke-linecap="round"/>')
    for (x, y) in ((12, 3), (28, 3)) if frame == "0" else ((11, 4), (29, 4)):
        g.append(f'<circle cx="{x}" cy="{y}" r="2.4" fill="#FFB6CC" stroke="{line}" stroke-width="1"/>')
    g.append(f'<path d="M20,7 C29,7 35,13.5 35,22 C35,30.5 28.5,36 20,36 C11.5,36 5,30.5 5,22 C5,13.5 11,7 20,7 Z" fill="url(#al)" stroke="{line}" stroke-width="2"/>')
    g.append('<ellipse cx="13.5" cy="13" rx="3.4" ry="1.8" fill="#FFF" opacity="0.8" transform="rotate(-35 13.5 13)"/>')
    g.append(eyes(14.5, 25.5, 21.5, 3.6, 4.4, "#2E2450", "#5A4A9A", "aie"))
    g.append(blush(9.6, 30.4, 27, 2.4, 1.4))
    g.append(f'<path d="M17.5,28.4 Q20,30.6 22.5,28.4" stroke="{line}" stroke-width="1.3" fill="none" stroke-linecap="round"/>')
    g.append('</g>')
    return svg(40, 40, "".join(g))

def meteor(frame):
    line = "#7A4E5E"
    L = 1.0 if frame == "0" else 0.88
    tx, ty = 18 + 52 * L, 32 - 28 * L
    g = [f'<defs><linearGradient id="mt" x1="18" y1="32" x2="{tx:.1f}" y2="{ty:.1f}" gradientUnits="userSpaceOnUse">'
         '<stop offset="0" stop-color="#FFE08A" stop-opacity="0.95"/><stop offset="0.45" stop-color="#FFB6CC" stop-opacity="0.7"/><stop offset="1" stop-color="#C9B6F0" stop-opacity="0"/></linearGradient>'
         '<radialGradient id="mh" cx="0.4" cy="0.35" r="0.8"><stop offset="0.3" stop-color="#FFD9C2"/><stop offset="1" stop-color="#F2A58A"/></radialGradient></defs>']
    # trail: tapered wedge from head toward upper right
    ang = math.atan2(ty - 32, tx - 18); px, py = -math.sin(ang), math.cos(ang)
    w = 12.5
    g.append(f'<path d="M{18+px*w:.1f},{32+py*w:.1f} Q{(18+tx)/2+px*w*0.5:.1f},{(32+ty)/2+py*w*0.5:.1f} {tx:.1f},{ty:.1f} Q{(18+tx)/2-px*w*0.5:.1f},{(32+ty)/2-py*w*0.5:.1f} {18-px*w:.1f},{32-py*w:.1f} Z" fill="url(#mt)"/>')
    sp = [(44, 14, 2.4), (56, 12, 1.8), (36, 26, 1.6)] if frame == "0" else [(48, 18, 2), (60, 8, 2.4), (38, 20, 1.6)]
    for (x, y, r) in sp: g.append(sparkle(x, y, r, "#FFF6D6", "#FFF6D6", 0.95, 0.3))
    g.append(f'<path d="{lumpy(18, 32, 14.5, 8, 0.08, 7)}" fill="url(#mh)" stroke="{line}" stroke-width="2" stroke-linejoin="round"/>')
    g.append(crater(23, 26, 2.6, "#F2A58A", line, "#FFE3D4") + crater(11, 37, 2, "#F2A58A", line, "#FFE3D4"))
    g.append('<ellipse cx="12" cy="24.5" rx="3" ry="1.6" fill="#FFF" opacity="0.8" transform="rotate(-35 12 24.5)"/>')
    g.append(eyes(13.5, 21.5, 32, 2.3, 2.8, "#4A2E40", "#7A4E6A", "me") + blush(10, 25.5, 36, 1.9, 1.1, "#FF8FAE"))
    g.append(f'<path d="M16,36.6 Q17.5,38.2 19,36.6" stroke="{line}" stroke-width="1.1" fill="none" stroke-linecap="round"/>')
    return svg(72, 48, "".join(g))

def pickup_space(frame):
    base = pickup_ghost(frame)
    inner = base[base.index(">") + 1: base.rindex("</svg>")]
    pre = ('<defs><radialGradient id="sgl"><stop offset="0.35" stop-color="#FFFBE6" stop-opacity="0.95"/><stop offset="0.7" stop-color="#FFE08A" stop-opacity="0.55"/>'
           '<stop offset="1" stop-color="#FFE08A" stop-opacity="0"/></radialGradient></defs>'
           '<circle cx="28" cy="28" r="28" fill="url(#sgl)"/>'
           '<circle cx="28" cy="28" r="24.5" fill="none" stroke="#FFF3B0" stroke-width="2.4" opacity="0.95"/>'
           '<circle cx="28" cy="28" r="24.5" fill="none" stroke="#E2A23E" stroke-width="0.8" opacity="0.8"/>')
    return svg(56, 56, pre + inner)

# ---------------- ROCKET ----------------
RK = dict(body="#FFF6EC", body2="#E6DCF2", line="#5A4677", nose="#FFB6CC", nose2="#F59AB5", fin="#A9DDBF", fin2="#86C9A3", gold="#F6D58E", noz="#C9B6E8")
def ghost_face_porthole(cx, cy, excited):
    s = (f'<path d="M{cx-11},{cy+14} V{cy} C{cx-11},{cy-8} {cx-6},{cy-12} {cx},{cy-12} C{cx+6},{cy-12} {cx+11},{cy-8} {cx+11},{cy} V{cy+14} Z" fill="#FFFFFF" stroke="#6B4E7A" stroke-width="1.6"/>')
    if excited:
        s += eyes(cx - 4.5, cx + 4.5, cy - 1, 2.6, 3.2, "#4A3358", "#7A5A9E", "rge")
        s += f'<ellipse cx="{cx}" cy="{cy+5}" rx="1.6" ry="1.9" fill="#E87FA3" stroke="#6B4E7A" stroke-width="0.9"/>'
    else:
        s += happy_eyes(cx - 4.5, cx + 4.5, cy - 0.5, 2.6, "#4A3358", 1.5)
        s += f'<path d="M{cx-2},{cy+4} Q{cx-1},{cy+5.4} {cx},{cy+4.2} Q{cx+1},{cy+5.4} {cx+2},{cy+4}" stroke="#6B4E7A" stroke-width="1.1" fill="none" stroke-linecap="round"/>'
    s += blush(cx - 7.5, cx + 7.5, cy + 3.5, 2, 1.2)
    return s
def rocket(state, frame):
    c = RK
    dx = 0 if state == "idle" else (-1 if frame == "0" else 1)
    g = [f'<defs><linearGradient id="rb" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFFFFF"/><stop offset="0.5" stop-color="{c["body"]}"/><stop offset="1" stop-color="{c["body2"]}"/></linearGradient>'
         f'<clipPath id="pc"><circle cx="48" cy="66" r="13"/></clipPath></defs>', f'<g transform="translate({dx},0)">']
    # fins (behind)
    g.append(f'<path d="M26,96 C14,104 9,118 10,138 Q10,141 13,140 L28,128 Z" fill="{c["fin"]}" stroke="{c["line"]}" stroke-width="{LW}" stroke-linejoin="round"/>'
             f'<path d="M70,96 C82,104 87,118 86,138 Q86,141 83,140 L68,128 Z" fill="{c["fin2"]}" stroke="{c["line"]}" stroke-width="{LW}" stroke-linejoin="round"/>')
    # nozzle
    g.append(f'<path d="M36,128 H60 L64,144 H32 Z" fill="{c["noz"]}" stroke="{c["line"]}" stroke-width="{LW}" stroke-linejoin="round"/>'
             f'<path d="M36,136 H60" stroke="#E3D9F8" stroke-width="1.6"/>')
    # body capsule
    body = "M48,6 C62,14 72,36 72,64 V120 Q72,132 60,132 H36 Q24,132 24,120 V64 C24,36 34,14 48,6 Z"
    g.append(f'<path d="{body}" fill="url(#rb)" stroke="{c["line"]}" stroke-width="{LW}" stroke-linejoin="round"/>')
    g.append(f'<clipPath id="bc"><path d="{body}"/></clipPath><g clip-path="url(#bc)">'
             f'<path d="M20,40 Q48,48 76,40 V0 H20 Z" fill="{c["nose"]}"/><path d="M60,0 L76,40 Q66,44 60,44 Z" fill="{c["nose2"]}" opacity="0.7"/>'
             f'<rect x="20" y="104" width="60" height="9" fill="{c["nose"]}"/><rect x="20" y="113" width="60" height="3" fill="{c["gold"]}"/></g>')
    g.append(f'<path d="M25,40 Q48,48 71,40" fill="none" stroke="{c["line"]}" stroke-width="1.8"/><path d="M24,104 H72 M24,116 H72" stroke="{c["line"]}" stroke-width="1.4"/>')
    g.append(f'<path d="M33,24 C30,34 29,46 29,58" stroke="#FFF" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.9"/>')
    # porthole with the ghost
    g.append(f'<circle cx="48" cy="66" r="16.5" fill="{c["gold"]}" stroke="{c["line"]}" stroke-width="{LW}"/>'
             f'<circle cx="48" cy="66" r="13" fill="#CFE6FF" stroke="{c["line"]}" stroke-width="1.4"/>'
             f'<g clip-path="url(#pc)">{ghost_face_porthole(48, 68, state == "thrust")}</g>'
             f'<path d="M39,60 A10,10 0 0,1 45,55" stroke="#FFF" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.9"/>'
             + "".join(f'<circle cx="{48+math.cos(math.radians(a))*15:.1f}" cy="{66+math.sin(math.radians(a))*15:.1f}" r="0.9" fill="{c["line"]}"/>' for a in range(0, 360, 45)))
    # decals: stars + window lights
    g.append(sparkle(36, 92, 3, "#FFE08A", "#C9953A", 1, 0.8) + sparkle(61, 88, 2.2, "#FFB6CC", "#C9708A", 1, 0.8))
    blink = "#9EF0E0" if (state == "idle" and frame == "0") or state == "thrust" else "#7FA8A0"
    g.append(f'<circle cx="48" cy="98" r="2.6" fill="{blink}" stroke="{c["line"]}" stroke-width="1"/>')
    g.append(f'<path d="M48,6 V1" stroke="{c["line"]}" stroke-width="1.6"/><circle cx="48" cy="1.5" r="1.6" fill="{c["gold"]}" stroke="{c["line"]}" stroke-width="0.8"/>')
    g.append('</g>')
    return svg(96, 148, "".join(g))
def flame(frame):
    L, wob = {"0": (60, 0), "1": (72, 2), "2": (52, -2)}[frame]
    def tear(w, l, col, op=1):
        return (f'<path d="M{24-w},0 C{24-w},{l*0.35} {24-w*0.5+wob},{l*0.75} {24+wob},{l} C{24+w*0.5+wob},{l*0.75} {24+w},{l*0.35} {24+w},0 Z" fill="{col}" opacity="{op}"/>')
    g = ['<defs><radialGradient id="fg" cx="0.5" cy="0.2" r="0.8"><stop offset="0" stop-color="#FFE7B0" stop-opacity="0.8"/><stop offset="1" stop-color="#FFB6CC" stop-opacity="0"/></radialGradient></defs>',
         f'<ellipse cx="24" cy="{L*0.45}" rx="24" ry="{L*0.55}" fill="url(#fg)"/>',
         tear(15, L, "#FFB38A") + tear(10.5, L * 0.78, "#FFD98A") + tear(6, L * 0.5, "#FFF8E0"),
         f'<path d="M{24-15},0 C{24-15},{L*0.35} {24-7.5+wob},{L*0.75} {24+wob},{L} C{24+7.5+wob},{L*0.75} {24+15},{L*0.35} {24+15},0" fill="none" stroke="#E07A6A" stroke-width="1.4" opacity="0.7"/>']
    random.seed(int(frame) + 3)
    for _ in range(3):
        g.append(sparkle(round(random.uniform(8, 40), 1), round(random.uniform(L * 0.4, L * 0.95), 1), 1.8, "#FFF6D6", "#FFF6D6", 0.9, 0.3))
    return svg(48, 80, "".join(g))
def smoke(frame):
    s = {"0": 0.55, "1": 0.8, "2": 1.0}[frame]; op = {"0": 1, "1": 1, "2": 0.92}[frame]
    blobs = [(32, 36, 16), (18, 40, 11), (46, 40, 12), (25, 26, 11), (40, 27, 10)]
    g = [f'<g transform="translate(32,36) scale({s}) translate(-32,-36)" opacity="{op}">']
    g.append("".join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#EDE6F8" stroke="#8F7FB5" stroke-width="2"/>' for x, y, r in blobs))
    g.append("".join(f'<circle cx="{x}" cy="{y}" r="{r-1.4}" fill="#EDE6F8"/>' for x, y, r in blobs))
    g.append('<circle cx="24" cy="24" r="4" fill="#FFF" opacity="0.8"/><circle cx="44" cy="44" r="7" fill="#D9CFF0" opacity="0.7"/></g>')
    return svg(64, 64, "".join(g))
def launchpad():
    line = "#4A4A7E"
    g = []
    # gantry tower
    g.append(f'<rect x="150" y="6" width="30" height="108" fill="#FFE3A0" opacity="0.3"/>')
    for y in range(6, 110, 18):
        g.append(f'<path d="M152,{y} L178,{y+18} M178,{y} L152,{y+18} M150,{y} H180" stroke="#FFE3A0" stroke-width="3"/><path d="M152,{y} L178,{y+18} M178,{y} L152,{y+18} M150,{y} H180" stroke="{line}" stroke-width="0.8" opacity="0.5"/>')
    g.append(f'<path d="M150,4 V114 M180,4 V114" stroke="#F2C46E" stroke-width="5"/><path d="M147.5,4 V114 M152.5,4 V114 M177.5,4 V114 M182.5,4 V114" stroke="{line}" stroke-width="1.3"/>')
    g.append(f'<rect x="108" y="40" width="44" height="7" rx="2" fill="#F2C46E" stroke="{line}" stroke-width="1.6"/><rect x="104" y="37" width="7" height="13" rx="2" fill="#C9B6E8" stroke="{line}" stroke-width="1.4"/>')
    g.append(f'<circle cx="165" cy="2.5" r="5" fill="#FFB6CC" opacity="0.35"/><circle cx="165" cy="3" r="2.6" fill="#FFB6CC" stroke="{line}" stroke-width="1"/>')
    g.append(f'<path d="M180,20 H192 V30 H180" fill="#A8DCD9" stroke="{line}" stroke-width="1.2"/><path d="M182,25 H190" stroke="#FFF" stroke-width="1"/>')
    # pad platform
    g.append(f'<path d="M4,112 H196 L188,128 H12 Z" fill="#D6D2EA" stroke="{line}" stroke-width="{LW}" stroke-linejoin="round"/>')
    g.append(f'<clipPath id="lp"><path d="M4,112 H196 L188,128 H12 Z"/></clipPath><g clip-path="url(#lp)">' + "".join(
        f'<path d="M{x},112 l-10,16 h8 l10,-16 z" fill="#FFB6CC" opacity="0.8"/>' for x in range(10, 200, 18)) + '</g>')
    g.append(f'<rect x="12" y="128" width="176" height="12" fill="#B9B3D9" stroke="{line}" stroke-width="{LW}"/>')
    for x in (30, 100, 170):
        g.append(f'<circle cx="{x}" cy="134" r="2.4" fill="#FFE9A8" stroke="{line}" stroke-width="0.9"/>')
    g.append(f'<path d="M30,112 V100 M110,112 V100" stroke="{line}" stroke-width="1.8"/>' +
             f'<path d="M30,100 l8,3 l-8,3 Z" fill="#9EF0E0" stroke="{line}" stroke-width="0.9"/><path d="M110,100 l-8,3 l8,3 Z" fill="#FFB6CC" stroke="{line}" stroke-width="0.9"/>')
    return svg(200, 140, "".join(g))
def cloud(variant):
    random.seed({"a": 1, "b": 2, "c": 3}[variant])
    W, H = 160, 64
    blobs = [(28, 42, 18), (52, 34, 22), (80, 28, 24), (108, 34, 21), (132, 42, 17), (70, 46, 18), (100, 46, 16)]
    if variant == "b": blobs = [(x * 0.8 + 16, y + 4, r * 0.85) for x, y, r in blobs]
    if variant == "c": blobs = [(160 - x, y, r) for x, y, r in blobs]
    col = {"a": "#F6F1FF", "b": "#FFE6EE", "c": "#E8F4FF"}[variant]
    g = [f'<g opacity="0.95">']
    g.append("".join(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="{col}" stroke="#A99BD6" stroke-width="2"/>' for x, y, r in blobs))
    g.append("".join(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r-1.4:.1f}" fill="{col}"/>' for x, y, r in blobs))
    g.append(f'<rect x="20" y="46" width="120" height="16" rx="8" fill="{col}"/>')
    g.append(f'<path d="M24,60 H136" stroke="#A99BD6" stroke-width="2" stroke-linecap="round"/>')
    g.append('<ellipse cx="62" cy="24" rx="10" ry="4" fill="#FFF" opacity="0.8"/></g>')
    return svg(W, H, "".join(g))
def launch_sky():
    W, H = 360, 1920
    g = ['<defs><linearGradient id="ls" x1="0" y1="1" x2="0" y2="0">'
         '<stop offset="0" stop-color="#4E3E78"/><stop offset="0.18" stop-color="#7A5E9E"/><stop offset="0.36" stop-color="#C9A6D6"/>'
         '<stop offset="0.5" stop-color="#9C86C9"/><stop offset="0.68" stop-color="#3E3470"/><stop offset="0.86" stop-color="#211B44"/><stop offset="1" stop-color="#161333"/></linearGradient>'
         '<radialGradient id="neb"><stop offset="0" stop-color="#FFB6CC" stop-opacity="0.35"/><stop offset="1" stop-color="#FFB6CC" stop-opacity="0"/></radialGradient>'
         '<radialGradient id="neb2"><stop offset="0" stop-color="#9EF0E0" stop-opacity="0.25"/><stop offset="1" stop-color="#9EF0E0" stop-opacity="0"/></radialGradient></defs>',
         f'<rect width="{W}" height="{H}" fill="url(#ls)"/>',
         '<ellipse cx="90" cy="260" rx="160" ry="110" fill="url(#neb)"/><ellipse cx="290" cy="440" rx="150" ry="100" fill="url(#neb2)"/>']
    random.seed(8)
    for _ in range(170):
        y = random.uniform(0, 1150) ** 1.0
        if random.random() < (1 - y / 1150) ** 0.7:
            r = random.choice([0.7, 0.9, 1.1, 1.4])
            g.append(f'<circle cx="{random.uniform(0, W):.1f}" cy="{y:.1f}" r="{r}" fill="#FFF6D6" opacity="{random.uniform(0.5, 1):.2f}"/>')
    for _ in range(9):
        g.append(sparkle(round(random.uniform(10, W - 10), 1), round(random.uniform(20, 800), 1), random.choice([2.4, 3.2]), "#FFF8DC", "#F2D48A", 0.9, 0.4))
    # soft cloud bands (sea of clouds) around the middle
    for band_y, col, op in ((1180, "#F6E8FA", 0.75), (1080, "#FFE6EE", 0.6), (1300, "#E8DDF6", 0.85), (960, "#F6F1FF", 0.4)):
        for i in range(8):
            x = i * 52 + random.uniform(-10, 10)
            g.append(f'<ellipse cx="{x:.1f}" cy="{band_y + random.uniform(-14, 14):.1f}" rx="{random.uniform(40, 62):.1f}" ry="{random.uniform(18, 30):.1f}" fill="{col}" opacity="{op}"/>')
    # city glow + skyline silhouettes at the very bottom (matches bg-city far)
    g.append('<rect x="0" y="1760" width="360" height="160" fill="#5A4A86" opacity="0.6"/>')
    for i, (x, w, h) in enumerate([(0, 40, 90), (36, 30, 130), (62, 44, 80), (100, 26, 150), (122, 50, 100), (168, 34, 120), (198, 46, 85), (240, 30, 140), (266, 48, 95), (310, 50, 125)]):
        g.append(f'<rect x="{x}" y="{1920-h}" width="{w}" height="{h}" rx="3" fill="#3E3470"/>')
        for wy in range(1920 - h + 10, 1910, 16):
            for wx in range(x + 6, x + w - 6, 10):
                if (wx * 3 + wy) % 7 < 3: g.append(f'<rect x="{wx}" y="{wy}" width="4" height="5" rx="1" fill="#FFE9A8" opacity="0.8"/>')
    return svg(W, H, "".join(g))

if __name__ == "__main__":
    FILES["obs-space-miniasteroid"] = mini_asteroid()
    for f in "01": FILES[f"obs-space-alien-{f}"] = alien(f)
    for f in "01": FILES[f"event-space-meteor-{f}"] = meteor(f)
    for f in "012": FILES[f"pickup-golden-ghost-space-{f}"] = pickup_space(f)
    for f in "01": FILES[f"cut-rocket-idle-{f}"] = rocket("idle", f); FILES[f"cut-rocket-thrust-{f}"] = rocket("thrust", f)
    for f in "012": FILES[f"cut-rocket-flame-{f}"] = flame(f); FILES[f"cut-smoke-puff-{f}"] = smoke(f)
    FILES["prop-city-launchpad"] = launchpad()
    for v in "abc": FILES[f"cut-cloud-{v}"] = cloud(v)
    FILES["bg-launch-sky"] = launch_sky()
    for k, v in FILES.items(): open(os.path.join(OUT, k + ".svg"), "w").write(v)
    print(len(FILES), "files")
