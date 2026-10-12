"""v0.4 BOTTOM obstacles: things that stand on the ground.
Tiling body = the lower part repeated down to the ground. cap-top = the top at the gap edge. No cap-bottom on purpose."""
import math
from v04_common import *

def slab(x0, x1, y0, y1, fill, shade, hi, line, sw=None):
    return (f'<rect x="{x0}" y="{y0}" width="{x1-x0}" height="{y1-y0}" fill="{fill}"/>'
            f'<rect x="{x1-12}" y="{y0}" width="12" height="{y1-y0}" fill="{shade}" opacity="0.75"/>'
            f'<rect x="{x0+4}" y="{y0}" width="4" height="{y1-y0}" fill="{hi}"/>'
            f'<path d="M{x0},{y0} V{y1} M{x1},{y0} V{y1}" stroke="{line}" stroke-width="{sw or LW}"/>')

# ================= CHURCH: old gravestone wrapped in ivy =================
IV = dict(fill="#EADBC8", shade="#D6C2AC", hi="#F6ECDF", line="#7A5E58", engr="#BFA690", ivy="#A9DDBF", ivy2="#8CCBA9", iline="#4F7A62")
def ivy_vine(c, pts, leaves):
    d = "M" + " ".join(f"{x},{y}" for x, y in pts[:1]) + "".join(f" Q{a},{b} {x},{y}" for (a, b, x, y) in pts[1:])
    s = f'<path d="{d}" stroke="{c["iline"]}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="{d}" stroke="{c["ivy2"]}" stroke-width="1.6" fill="none" stroke-linecap="round"/>'
    for x, y, a in leaves:
        s += (f'<path d="M0,0 C-4,-3 -4,-8 0,-10 C4,-8 4,-3 0,0 Z" fill="{c["ivy"]}" stroke="{c["iline"]}" stroke-width="1.1" transform="translate({x},{y}) rotate({a})"/>'
              f'<path d="M0,-1 V-8" stroke="{c["ivy2"]}" stroke-width="0.8" transform="translate({x},{y}) rotate({a})"/>')
    return s
def ivystone_body():
    c = IV
    d = slab(6, 74, -1, 65, c["fill"], c["shade"], c["hi"], c["line"])
    d += tile3(f'<path d="M6,22 H74 M6,54 H74 M40,-10 V22 M24,22 V54 M58,54 V70" stroke="{c["engr"]}" stroke-width="1.4" opacity="0.7"/>'
               + ivy_vine(c, [(14, 0), (22, 16, 16, 32), (10, 48, 16, 64)], [(17, 8, 40), (14, 26, -50), (17, 40, 50), (13, 56, -40)])
               + ivy_vine(c, [(64, 10), (58, 24, 64, 38)], [(62, 18, -40), (64, 32, 50)]))
    return svg(80, 64, d)
def ivystone_cap():
    c = IV
    shape = "M4,82 V36 Q4,30 10,30 H20 C20,18 28,11 40,11 C52,11 60,18 60,30 H70 Q76,30 76,36 V82"
    s = (f'<path d="{shape} Z" fill="{c["fill"]}"/><path d="M62,82 V32 H70 Q76,30 76,36 V82 Z" fill="{c["shade"]}" opacity="0.75"/>'
         f'<path d="M48,14 C54,17 58,22 59,30 H64 V82 H62 Z" fill="{c["shade"]}" opacity="0.5"/>'
         f'<rect x="8" y="34" width="4" height="48" fill="{c["hi"]}"/>'
         f'<path d="{shape}" fill="none" stroke="{c["line"]}" stroke-width="{LW}" stroke-linejoin="round"/>'
         f'<path d="M28,19 C31,15 35,13 39,13" stroke="#FFF" stroke-width="1.8" fill="none" stroke-linecap="round" opacity="0.8"/>'
         # carved heart + face
         f'<path d="M40,34 C34,30 33,25 36.5,23.5 C38.5,22.8 40,24.5 40,25.5 C40,24.5 41.5,22.8 43.5,23.5 C47,25 46,30 40,34 Z" fill="#FFC9DA" stroke="{c["engr"]}" stroke-width="1.2"/>'
         f'<rect x="20" y="42" width="40" height="22" rx="6" fill="{c["shade"]}" opacity="0.55" stroke="{c["engr"]}" stroke-width="1.2"/>'
         + face(40, 52, 0.95, "ivE", "#5A4038", "#8A6A5E", "w", True))
    s += ivy_vine(c, [(10, 82), (6, 62, 12, 48), (18, 36, 24, 26), (30, 16, 40, 12), (50, 10, 56, 18)],
                  [(9, 70, -60), (12, 54, 40), (16, 42, -30), (24, 26, 60), (32, 15, -20), (46, 10, 30), (55, 17, 80)])
    s += ivy_vine(c, [(70, 30), (72, 44, 66, 58), (62, 68, 68, 80)], [(71, 38, 60), (67, 54, -50), (65, 70, 40)])
    s += flower(26, 24, 2.2, "#FFB6CC") + flower(58, 64, 2, "#FFF3E0")
    return svg(80, 80, s)
reg_bot("obs-church-ivystone", ivystone_body(), ivystone_cap(),
        {"rects": [[8, 0, 64, 64]]},
        {"rects": [[8, 32, 64, 48], [22, 22, 36, 10]], "circles": [[40, 31, 18]]}, [40, 12],
        note="warm sandstone (not the lilac graveyard stones). Ivy leaves and flowers are decorative")

# ================= CHURCH: stone font =================
FN = dict(fill="#DCD6EC", shade="#C2B9DC", hi="#EEEAF7", line="#5E5486", water="#A9D8F0", water2="#D6EEFA", engr="#ABA0CC")
def font_body():
    c = FN
    d = slab(22, 58, -1, 65, c["fill"], c["shade"], c["hi"], c["line"])
    d += tile3(f'<path d="M31,0 V64 M40,0 V64 M49,0 V64" stroke="{c["engr"]}" stroke-width="1.3" opacity="0.6"/>'
               f'<rect x="20" y="40" width="40" height="6" rx="2" fill="{c["fill"]}" stroke="{c["line"]}" stroke-width="1.8"/>')
    return svg(80, 64, d)
def font_cap():
    c = FN
    s = slab(22, 58, 56, 82, c["fill"], c["shade"], c["hi"], c["line"])
    s += f'<path d="M31,58 V82 M40,58 V82 M49,58 V82" stroke="{c["engr"]}" stroke-width="1.3" opacity="0.6"/>'
    s += f'<path d="M24,58 L18,46 H62 L56,58 Z" fill="{c["fill"]}" stroke="{c["line"]}" stroke-width="2" stroke-linejoin="round"/>'
    bowl = "M7,19 H73 C73,32 66,44 52,47 H28 C14,44 7,32 7,19 Z"
    s += (f'<path d="{bowl}" fill="{c["fill"]}" stroke="{c["line"]}" stroke-width="{LW}" stroke-linejoin="round"/>'
          f'<path d="M58,22 H72 C71,32 66,40 56,45 Z" fill="{c["shade"]}" opacity="0.75"/>'
          f'<path d="M12,24 C13,32 17,38 23,42" stroke="#FFF" stroke-width="1.8" fill="none" stroke-linecap="round" opacity="0.7"/>'
          f'<rect x="5" y="14" width="70" height="7" rx="3.5" fill="{c["hi"]}" stroke="{c["line"]}" stroke-width="2"/>'
          f'<ellipse cx="40" cy="15.5" rx="30" ry="2.4" fill="{c["water"]}"/><path d="M22,15.2 q3,-1.2 6,0 M46,15.6 q3,-1.2 6,0" stroke="{c["water2"]}" stroke-width="1" fill="none"/>'
          + "".join(f'<g transform="translate({x},31)"><circle r="4.2" fill="none" stroke="{c["engr"]}" stroke-width="1.2"/><path d="M0,-4.2 V4.2 M-4.2,0 H4.2" stroke="{c["engr"]}" stroke-width="1"/></g>' for x in (18, 62))
          + face(40, 30, 0.95, "fnE", "#3E3A6E", "#6A66A0")
          + sparkle(64, 9, 2.6, "#E6F6FF", "#7AA8D8") + sparkle(17, 8, 2, "#E6F6FF", "#7AA8D8"))
    return svg(80, 80, s)
reg_bot("obs-church-font", font_body(), font_cap(),
        {"rects": [[24, 0, 32, 64]]},
        {"rects": [[7, 15, 66, 6], [10, 21, 60, 12], [16, 33, 48, 9], [25, 42, 30, 6], [22, 48, 36, 8], [24, 56, 32, 24]]}, [40, 14],
        note="pedestal is 36 px wide (honest, a bit forgiving between pairs). Water sparkles are decorative")

# ================= CHURCH: lychgate post =================
LY = dict(wood="#E6CDB4", wood2="#CFAF93", hi="#F3E2CF", line="#7A5A4E", roof="#C9B6E8", roof2="#AE98DA", rline="#5E4A7E")
def lych_body():
    c = LY
    d = slab(20, 60, -1, 65, c["wood"], c["wood2"], c["hi"], c["line"])
    d += tile3(f'<path d="M20,8 L60,40 M60,8 L20,40" stroke="{c["wood2"]}" stroke-width="3"/><path d="M20,8 H60 M20,40 H60" stroke="{c["line"]}" stroke-width="1.4"/>'
               f'<path d="M28,50 q2,6 0,10" stroke="{c["wood2"]}" stroke-width="1.2" fill="none"/>')
    return svg(80, 64, d)
def lych_cap():
    c = LY
    s = slab(20, 60, 46, 82, c["wood"], c["wood2"], c["hi"], c["line"])
    s += f'<path d="M20,56 L60,82 M60,56 L20,82" stroke="{c["wood2"]}" stroke-width="3"/><path d="M20,56 H60" stroke="{c["line"]}" stroke-width="1.4"/>'
    roof = "M4,47 L37,14 Q40,11 43,14 L76,47 Q76,51 72,51 H8 Q4,51 4,47 Z"
    s += (f'<path d="{roof}" fill="{c["roof"]}" stroke="{c["rline"]}" stroke-width="{LW}" stroke-linejoin="round"/>'
          f'<path d="M40,13 L76,47 Q76,51 72,51 H58 Z" fill="{c["roof2"]}" opacity="0.55"/>'
          + "".join(f'<path d="M{40-36*(y-12)/36+3:.1f},{y} Q{40},{y+3} {40+36*(y-12)/36-3:.1f},{y}" stroke="{c["roof2"]}" stroke-width="1.4" fill="none"/>' for y in (24, 32, 40))
          + f'<path d="M7,47 H73" stroke="{c["wood"]}" stroke-width="3.4"/><path d="M5,49.5 H75" stroke="{c["rline"]}" stroke-width="1"/>'
          f'<path d="M24,32 L34,21" stroke="#FFF" stroke-width="1.6" stroke-linecap="round" opacity="0.6"/>'
          f'<circle cx="40" cy="11" r="2.4" fill="#F6D58E" stroke="{c["rline"]}" stroke-width="1"/>'
          # little lantern hanging under the eave (inside the post rect), welcome face on the post
          f'<rect x="29" y="58" width="22" height="16" rx="5" fill="{c["hi"]}" stroke="{c["line"]}" stroke-width="1.4"/>'
          + face(40, 66, 0.8, "lyE", "#5A3828", "#A0674A")
          + leaf(66, 46, -20) + leaf(14, 46, 200) + flower(70, 46, 2, "#FFB6CC"))
    return svg(80, 80, s)
reg_bot("obs-church-lychgate", lych_body(), lych_cap(),
        {"rects": [[22, 0, 36, 64]]},
        {"rects": [[35, 17, 10, 6], [28, 23, 24, 7], [21, 30, 38, 7], [14, 37, 52, 6], [7, 43, 66, 7], [22, 50, 36, 30]]}, [40, 13],
        note="roof ridge knob, leaves and flower are decorative")

# ================= COUNTRYSIDE: stacked hay bales =================
HY = dict(hay="#FFE3A0", hay2="#F2C46E", hi="#FFF1C8", line="#8E6A3C", twine="#E39A7A")
def bale(y, h, c, x0=6, x1=74):
    s = (f'<rect x="{x0}" y="{y}" width="{x1-x0}" height="{h}" rx="7" fill="{c["hay"]}" stroke="{c["line"]}" stroke-width="{LW}"/>'
         f'<rect x="{x1-13}" y="{y+3}" width="10" height="{h-6}" rx="4" fill="{c["hay2"]}" opacity="0.7"/>'
         f'<path d="M{x0+5},{y+5} V{y+h-6}" stroke="{c["hi"]}" stroke-width="2.4" stroke-linecap="round"/>')
    for i in range(7):
        xx = x0 + 10 + i * 8
        s += f'<path d="M{xx},{y+6+(i%3)*3} l3,5 M{xx+3},{y+h-12+(i%2)*3} l-2,5" stroke="{c["hay2"]}" stroke-width="1.2" stroke-linecap="round"/>'
    s += f'<path d="M{x0+18},{y+1} V{y+h-1} M{x1-18},{y+1} V{y+h-1}" stroke="{c["twine"]}" stroke-width="2.4"/>'
    return s
def hay_body():
    return svg(80, 64, tile3(bale(0, 32, HY) + bale(32, 32, HY)))
def hay_cap():
    c = HY
    s = bale(48, 34, c) + bale(16, 33, c, 7, 73)
    s += face(40, 34, 1.0, "hyE", "#5A3828", "#A0674A")
    s += (f'<path d="M14,16 l-3,-6 M18,16 l0,-7 M60,16 l2,-6 M65,16 l4,-5" stroke="{c["hay2"]}" stroke-width="1.6" stroke-linecap="round"/>'
          + flower(58, 13, 3, "#FFB6CC") + f'<path d="M58,16 V20" stroke="#4F8A6C" stroke-width="1.4"/>'
          + leaf(23, 14, -150, "#A9DDBF"))
    return svg(80, 80, s)
reg_bot("obs-countryside-haybales", hay_body(), hay_cap(),
        {"rects": [[9, 0, 62, 64]]},
        {"rects": [[10, 18, 60, 31], [9, 49, 62, 31]]}, [40, 16],
        note="straw tufts, flower and leaf on top are decorative")

# ================= COUNTRYSIDE: pumpkin stack on crates =================
PS = dict(wood="#E6CDB4", wood2="#CFAF93", hi="#F3E2CF", line="#7A5A4E", pk="#FFC9A0", pk2="#FFAE84", lobe="#EE9A70", pline="#8A5068", stem="#9ED8B4", sline="#4F8A6C")
def crate(y, h, c):
    return (f'<rect x="6" y="{y}" width="68" height="{h}" rx="3" fill="{c["wood"]}" stroke="{c["line"]}" stroke-width="{LW}"/>'
            f'<rect x="60" y="{y+2}" width="12" height="{h-4}" fill="{c["wood2"]}" opacity="0.7"/>'
            f'<path d="M6,{y+h/3:.1f} H74 M6,{y+2*h/3:.1f} H74" stroke="{c["line"]}" stroke-width="1.3"/>'
            f'<path d="M12,{y+2} V{y+h-2} M68,{y+2} V{y+h-2}" stroke="{c["wood2"]}" stroke-width="3"/>'
            f'<path d="M14,{y+h-4} L66,{y+4}" stroke="{c["wood2"]}" stroke-width="2.4"/>')
def pkn(cx, cy, rx, ry, c, gid, fc=True, sleepy=False):
    s = (f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{c["pk"]}" stroke="{c["pline"]}" stroke-width="2"/>'
         f'<path d="M{cx-rx*0.45:.1f},{cy-ry+1:.1f} Q{cx-rx*0.62:.1f},{cy} {cx-rx*0.45:.1f},{cy+ry-1:.1f} M{cx+rx*0.45:.1f},{cy-ry+1:.1f} Q{cx+rx*0.62:.1f},{cy} {cx+rx*0.45:.1f},{cy+ry-1:.1f}" stroke="{c["lobe"]}" stroke-width="1.4" fill="none"/>'
         f'<ellipse cx="{cx-rx*0.55:.1f}" cy="{cy-ry*0.45:.1f}" rx="{rx*0.16:.1f}" ry="{ry*0.2:.1f}" fill="#FFF" opacity="0.7"/>'
         f'<path d="M{cx},{cy-ry+1} Q{cx+1},{cy-ry-4} {cx+4},{cy-ry-5}" stroke="{c["sline"]}" stroke-width="3" fill="none" stroke-linecap="round"/>'
         f'<path d="M{cx},{cy-ry+1} Q{cx+1},{cy-ry-4} {cx+4},{cy-ry-5}" stroke="{c["stem"]}" stroke-width="1.6" fill="none" stroke-linecap="round"/>')
    if fc: s += face(cx, cy + 1, ry / 11, gid, "#5A3550", "#8A5A80", "w", sleepy, "#FF9EB0")
    return s
def pumpkins_body():
    return svg(80, 64, tile3(crate(0, 32, PS) + crate(32, 32, PS)))
def pumpkins_cap():
    c = PS
    s = crate(46, 36, c)
    s += pkn(40, 34, 27, 14, c, "pkA") + pkn(40, 14, 11, 8.5, c, "pkB", True, True)
    s += leaf(54, 6, -30, "#A9DDBF")
    return svg(80, 80, s)
reg_bot("obs-countryside-pumpkinstack", pumpkins_body(), pumpkins_cap(),
        {"rects": [[8, 0, 64, 64]]},
        {"rects": [[8, 47, 64, 33], [19, 28, 42, 13], [27, 22, 26, 25], [34, 9, 12, 10], [37, 18, 6, 5]]}, [40, 6],
        note="two cute pumpkins on a crate stack. Stems and the leaf are decorative")

# ================= COUNTRYSIDE: milk churn =================
MC = dict(m="#DDE6F2", m2="#BCC8DE", hi="#F4F8FC", line="#4E5A7E", band="#A9C8F0", spot="#6E6698")
def churn_body():
    c = MC
    d = slab(14, 66, -1, 65, c["m"], c["m2"], c["hi"], c["line"])
    d += tile3(f'<rect x="12" y="20" width="56" height="7" rx="3" fill="{c["band"]}" stroke="{c["line"]}" stroke-width="1.6"/>'
               f'<path d="M24,44 q4,-4 8,0 q2,5 -4,6 q-5,0 -4,-6 Z M50,52 q3,-3 6,0 q1,4 -3,4 q-4,0 -3,-4 Z" fill="{c["spot"]}" opacity="0.55"/>')
    return svg(80, 64, d)
def churn_cap():
    c = MC
    s = slab(14, 66, 44, 82, c["m"], c["m2"], c["hi"], c["line"])
    s += (f'<path d="M14,46 C14,38 22,36 28,32 H52 C58,36 66,38 66,46 Z" fill="{c["m"]}" stroke="{c["line"]}" stroke-width="{LW}" stroke-linejoin="round"/>'
          f'<path d="M52,32 C58,36 66,38 66,46 H56 C56,40 54,36 52,32 Z" fill="{c["m2"]}" opacity="0.7"/>'
          f'<rect x="28" y="20" width="24" height="13" fill="{c["m"]}" stroke="{c["line"]}" stroke-width="2"/>'
          f'<rect x="44" y="21" width="7" height="11" fill="{c["m2"]}" opacity="0.7"/>'
          f'<rect x="24" y="13" width="32" height="8" rx="4" fill="{c["band"]}" stroke="{c["line"]}" stroke-width="2"/>'
          f'<path d="M36,13 Q36,7 40,7 Q44,7 44,13" fill="{c["band"]}" stroke="{c["line"]}" stroke-width="1.8"/>'
          f'<path d="M27,15.5 H50" stroke="#FFF" stroke-width="1.4" stroke-linecap="round" opacity="0.8"/>'
          # side handles hugging the shoulder
          f'<path d="M15,50 C9,50 9,60 15,60" stroke="{c["line"]}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M15,50 C9,50 9,60 15,60" stroke="{c["band"]}" stroke-width="2.4" fill="none" stroke-linecap="round"/>'
          f'<path d="M65,50 C71,50 71,60 65,60" stroke="{c["line"]}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M65,50 C71,50 71,60 65,60" stroke="{c["band"]}" stroke-width="2.4" fill="none" stroke-linecap="round"/>'
          f'<rect x="12" y="70" width="56" height="7" rx="3" fill="{c["band"]}" stroke="{c["line"]}" stroke-width="1.6"/>'
          + face(40, 56, 1.0, "mcE", "#3E3A6E", "#6A66A0") +
          f'<path d="M22,48 q3,-3 6,0 q1,4 -3,4 q-4,0 -3,-4 Z" fill="{c["spot"]}" opacity="0.55"/>'
          + flower(58, 64, 2.4, "#FFF3E0"))
    return svg(80, 80, s)
reg_bot("obs-countryside-churn", churn_body(), churn_cap(),
        {"rects": [[16, 0, 48, 64]]},
        {"rects": [[25, 14, 30, 6], [29, 20, 22, 13], [22, 33, 36, 6], [16, 39, 48, 41], [9, 51, 7, 8], [64, 51, 7, 8]]}, [40, 12],
        note="the lid knob is decorative; side handles collide")

# ================= SCHOOLS: stacked books + apple =================
BK = dict(line="#5E4A7E", cols=[("#FFC9DA", "#F2A9BE"), ("#BDEBD6", "#97D6BC"), ("#FFEBB0", "#F2D27A"), ("#C9DAF8", "#A8C0EE"), ("#E3D4FF", "#C9B6F0")])
BOOKS = [(7, 72, 0), (9, 73, 1), (6, 70, 2), (10, 74, 3)]
def book(x0, x1, y, h, col, line, k):
    a, b = col
    return (f'<rect x="{x0}" y="{y}" width="{x1-x0}" height="{h}" rx="2.5" fill="{a}" stroke="{line}" stroke-width="2"/>'
            f'<rect x="{x1-7}" y="{y+1.5}" width="4" height="{h-3}" fill="#FFF8EC" stroke="{line}" stroke-width="0.9"/>'
            f'<path d="M{x0+8},{y+3} V{y+h-3} M{x0+12},{y+3} V{y+h-3}" stroke="{b}" stroke-width="1.6"/>'
            + (f'<path d="M{x0+22},{y+h/2:.1f} h{12+k*3}" stroke="{b}" stroke-width="3" stroke-linecap="round"/>'))
def books_body():
    c = BK
    return svg(80, 64, tile3("".join(book(x0, x1, i * 16, 16, c["cols"][(i + 1) % 5], c["line"], i) for i, (x0, x1, k) in enumerate(BOOKS))))
def books_cap():
    c = BK
    s = ""
    for i, (x0, x1) in enumerate(((8, 71), (6, 73), (10, 74))):
        s += book(x0, x1, 32 + i * 16, 16, c["cols"][(i + 3) % 5], c["line"], i)
    s += book(13, 67, 25, 8, c["cols"][4], c["line"], 0).replace('stroke-width="3"', 'stroke-width="2"')
    # pencil lying on top
    s += (f'<path d="M14,22 H58 L64,24.5 L58,27 H14 Z" fill="#FFE08A" stroke="{c["line"]}" stroke-width="1.4" stroke-linejoin="round"/>'
          f'<path d="M58,22 L64,24.5 L58,27 Z" fill="#FFE6D2"/><path d="M62,23.6 L64,24.5 L62,25.4 Z" fill="{c["line"]}"/>'
          f'<rect x="10" y="22" width="5" height="5" rx="1.5" fill="#FFB6CC" stroke="{c["line"]}" stroke-width="1.2"/>')
    # apple with a face
    s += (f'<path d="M40,11 C36,6 26,8 27,17 C28,23 34,25 40,22 C46,25 52,23 53,17 C54,8 44,6 40,11 Z" fill="#FFB6C1" stroke="#7A4E5E" stroke-width="2"/>'
          f'<path d="M40,11 Q40,6 43,3" stroke="#6A4A4E" stroke-width="1.8" fill="none" stroke-linecap="round"/>'
          + leaf(43, 5, -20) +
          f'<ellipse cx="32" cy="12" rx="2" ry="1.4" fill="#FFF" opacity="0.8"/>'
          + face(40, 16, 0.7, "bkE", "#5A3040", "#8A4E66"))
    return svg(80, 80, s)
reg_bot("obs-school-books", books_body(), books_cap(),
        {"rects": [[11, 0, 58, 64]]},
        {"rects": [[9, 33, 61, 47], [14, 22, 50, 11], [29, 10, 22, 12]]}, [40, 9],
        note="apple stem and leaf are decorative")

# ================= SCHOOLS: lockers =================
LK = dict(a="#A9C8F0", a2="#8DB0E6", b="#BDEBD6", b2="#97D6BC", line="#3F4E7A", hi="#E6F0FF")
def locker_pair(y0, y1, c):
    s = ""
    for x0, x1, f, f2 in ((6, 40, c["a"], c["a2"]), (40, 74, c["b"], c["b2"])):
        s += (f'<rect x="{x0}" y="{y0}" width="{x1-x0}" height="{y1-y0}" fill="{f}"/>'
              f'<rect x="{x1-7}" y="{y0}" width="7" height="{y1-y0}" fill="{f2}" opacity="0.8"/>'
              f'<rect x="{x0+3}" y="{y0}" width="3" height="{y1-y0}" fill="{c["hi"]}" opacity="0.7"/>')
    s += f'<path d="M6,{y0} V{y1} M40,{y0} V{y1} M74,{y0} V{y1}" stroke="{c["line"]}" stroke-width="{LW}"/>'
    return s
def locker_details(y, c):
    return ("".join(f'<path d="M{x},{y+6+i*4} h14" stroke="{c["line"]}" stroke-width="1.4" stroke-linecap="round" opacity="0.7"/>' for x in (14, 48) for i in range(3))
            + f'<rect x="32" y="{y+26}" width="4" height="10" rx="2" fill="#FFE08A" stroke="{c["line"]}" stroke-width="1.1"/><rect x="44" y="{y+26}" width="4" height="10" rx="2" fill="#FFE08A" stroke="{c["line"]}" stroke-width="1.1"/>'
            f'<path d="M6,{y+60} H74" stroke="{c["line"]}" stroke-width="1.6"/>')
def lockers_body():
    c = LK
    return svg(80, 64, locker_pair(-1, 65, c) + tile3(locker_details(0, c)))
def lockers_cap():
    c = LK
    s = locker_pair(30, 82, c) + locker_details(36, c).replace('<path d="M6,96 H74" stroke="#3F4E7A" stroke-width="1.6"/>', "")
    s += (f'<rect x="4" y="27" width="72" height="6" rx="3" fill="#E3D4FF" stroke="{c["line"]}" stroke-width="2"/>'
          f'<path d="M14,52 l2,-4 l2,4 l4,0.5 l-3,3 l1,4 l-4,-2 l-4,2 l1,-4 l-3,-3 Z" fill="#FFE08A" stroke="{c["line"]}" stroke-width="0.9"/>'
          f'<path d="M58,55 C54,52 54,49 56,48 C57.2,47.6 58,48.6 58,49.2 C58,48.6 58.8,47.6 60,48 C62,49 62,52 58,55 Z" fill="#FFB6CC" stroke="{c["line"]}" stroke-width="0.9"/>')
    # backpack on top
    s += (f'<path d="M27,28 V16 C27,10 32,7 40,7 C48,7 53,10 53,16 V28 Z" fill="#FFC9DA" stroke="#7A4E66" stroke-width="2.2" stroke-linejoin="round"/>'
          f'<path d="M34,7.5 Q40,2 46,7.5" stroke="#7A4E66" stroke-width="2.4" fill="none" stroke-linecap="round"/>'
          f'<rect x="31" y="19" width="18" height="9" rx="3" fill="#FFE3EC" stroke="#7A4E66" stroke-width="1.5"/>'
          + face(40, 14.5, 0.62, "lkE", "#5A3040", "#8A4E66"))
    return svg(80, 80, s)
reg_bot("obs-school-lockers", lockers_body(), lockers_cap(),
        {"rects": [[8, 0, 64, 64]]},
        {"rects": [[8, 33, 64, 47], [5, 28, 70, 5], [29, 10, 22, 18]]}, [40, 8],
        note="the backpack collides; its top handle is decorative")

# ================= SCHOOLS: globe on a stand =================
GL = dict(sea="#A9D8F0", sea2="#86C0E6", land="#BDEBD6", lline="#4F7A62", line="#3F4E7A", brass="#F6D58E", bline="#8E5A3C", wood="#E6CDB4", wood2="#CFAF93")
def globe_body():
    c = GL
    d = (f'<rect x="33" y="-1" width="14" height="66" fill="{c["wood"]}"/><rect x="42" y="-1" width="5" height="66" fill="{c["wood2"]}"/>'
         f'<path d="M33,-1 V65 M47,-1 V65" stroke="{c["bline"]}" stroke-width="2"/>'
         + tile3(f'<rect x="31" y="30" width="18" height="6" rx="3" fill="{c["brass"]}" stroke="{c["bline"]}" stroke-width="1.5"/>'))
    return svg(80, 64, d)
def globe_cap():
    c = GL
    s = (f'<rect x="33" y="60" width="14" height="22" fill="{c["wood"]}"/><rect x="42" y="60" width="5" height="22" fill="{c["wood2"]}"/><path d="M33,60 V82 M47,60 V82" stroke="{c["bline"]}" stroke-width="2"/>'
         f'<path d="M30,62 H50 L46,55 H34 Z" fill="{c["brass"]}" stroke="{c["bline"]}" stroke-width="1.8" stroke-linejoin="round"/>')
    s += (f'<defs><clipPath id="gc"><circle cx="40" cy="31" r="22"/></clipPath></defs>'
          f'<circle cx="40" cy="31" r="22" fill="{c["sea"]}"/>'
          f'<g clip-path="url(#gc)"><path d="M18,22 C24,14 34,16 34,22 C34,28 26,30 28,36 C30,42 22,44 18,40 Z M44,12 C52,10 60,16 58,24 C56,30 48,28 46,22 C45,18 40,16 44,12 Z M46,38 C52,34 62,38 60,46 C56,52 46,50 46,44 Z" fill="{c["land"]}" stroke="{c["lline"]}" stroke-width="1.3"/>'
          f'<path d="M50,10 A22,22 0 0,1 62,31 A22,22 0 0,1 50,52 L62,52 L62,10 Z" fill="{c["sea2"]}" opacity="0.45"/></g>'
          f'<circle cx="40" cy="31" r="22" fill="none" stroke="{c["line"]}" stroke-width="2"/>'
          f'<path d="M24,20 C27,15 31,13 35,12" stroke="#FFF" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.85"/>'
          # brass meridian hugging the globe
          f'<path d="M20,43 A24,24 0 1,1 60,43" stroke="{c["bline"]}" stroke-width="4.4" fill="none" stroke-linecap="round"/>'
          f'<path d="M20,43 A24,24 0 1,1 60,43" stroke="{c["brass"]}" stroke-width="2.4" fill="none" stroke-linecap="round"/>'
          f'<path d="M40,53 V56" stroke="{c["bline"]}" stroke-width="3"/>'
          f'<circle cx="40" cy="6" r="2" fill="{c["brass"]}" stroke="{c["bline"]}" stroke-width="1"/>'
          f'<ellipse cx="40" cy="33" rx="9" ry="6.5" fill="#F4FBFF" opacity="0.7"/>'
          + face(40, 33, 0.85, "glE", "#3E3A6E", "#6A66A0"))
    return svg(80, 80, s)
reg_bot("obs-school-globe", globe_body(), globe_cap(),
        {"rects": [[35, 0, 10, 64]]},
        {"rects": [[35, 55, 10, 25], [33, 56, 14, 6], [38, 53, 4, 3]], "circles": [[40, 31, 23]]}, [40, 6],
        note="the circle covers the globe; the thin brass ring rim (outer edge ~26) pokes ~2 px past it. Top knob is decorative. Stand pole is narrow (honest)")

# ================= CITY: postbox =================
PB = dict(red="#FBA493", red2="#E8887A", hi="#FFD0C4", line="#7A3E52", dark="#5A2E40", gold="#F6D58E")
def postbox_body():
    c = PB
    d = slab(12, 68, -1, 65, c["red"], c["red2"], c["hi"], c["line"])
    d += tile3(f'<path d="M12,58 H68" stroke="{c["red2"]}" stroke-width="1.6"/><path d="M12,61 H68" stroke="{c["line"]}" stroke-width="1" opacity="0.5"/>'
               f'<circle cx="18" cy="30" r="1.3" fill="{c["red2"]}"/><circle cx="62" cy="30" r="1.3" fill="{c["red2"]}"/>')
    return svg(80, 64, d)
def postbox_cap():
    c = PB
    s = slab(12, 68, 34, 82, c["red"], c["red2"], c["hi"], c["line"])
    s += (f'<path d="M12,33 C12,18 24,11 40,11 C56,11 68,18 68,33 Z" fill="{c["red"]}" stroke="{c["line"]}" stroke-width="{LW}" stroke-linejoin="round"/>'
          f'<path d="M54,15 C62,19 67,25 68,33 H58 C58,26 57,20 54,15 Z" fill="{c["red2"]}" opacity="0.7"/>'
          f'<path d="M24,22 C28,17 33,15 38,14" stroke="#FFF" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.8"/>'
          f'<rect x="8" y="30" width="64" height="7" rx="3.5" fill="{c["hi"]}" stroke="{c["line"]}" stroke-width="2"/>'
          f'<rect x="24" y="41" width="32" height="5" rx="2.5" fill="{c["dark"]}"/>'
          f'<rect x="28" y="52" width="24" height="16" rx="3" fill="#FFF3E0" stroke="{c["line"]}" stroke-width="1.4"/>'
          f'<path d="M28,52 L40,61 L52,52" stroke="{c["line"]}" stroke-width="1.2" fill="none"/>'
          f'<path d="M40,66 C37,64 36.5,62 38,61.4 C39,61 40,62 40,62.4 C40,62 41,61 42,61.4 C43.5,62 43,64 40,66 Z" fill="#FF8FAE"/>'
          + face(40, 23, 0.85, "pbE", "#5A2E40", "#8A4E66") +
          f'<circle cx="40" cy="10" r="2.2" fill="{c["gold"]}" stroke="{c["line"]}" stroke-width="1"/>')
    return svg(80, 80, s)
reg_bot("obs-city-postbox", postbox_body(), postbox_cap(),
        {"rects": [[14, 0, 52, 64]]},
        {"rects": [[9, 31, 62, 5], [14, 36, 52, 44], [18, 20, 44, 11], [30, 14, 20, 6]], "circles": [[40, 32, 19]]}, [40, 12],
        note="top knob is decorative")

# ================= CITY: red phone box =================
PH = dict(red="#F28CA0", red2="#DC6E86", hi="#FFB8C6", line="#6E2E48", glass="#DFF4FF", glass2="#BFE0F5", sign="#FFF3E0")
def phone_panes(y0, c):
    s = f'<rect x="16" y="{y0}" width="48" height="56" rx="2" fill="{c["glass"]}" stroke="{c["line"]}" stroke-width="1.6"/>'
    s += f'<path d="M32,{y0} V{y0+56} M48,{y0} V{y0+56} M16,{y0+14} H64 M16,{y0+28} H64 M16,{y0+42} H64" stroke="{c["red"]}" stroke-width="2.6"/>'
    s += f'<path d="M20,{y0+4} L28,{y0+12} M36,{y0+18} L44,{y0+26}" stroke="#FFF" stroke-width="1.4" stroke-linecap="round" opacity="0.8"/>'
    return s
def phone_body():
    c = PH
    d = slab(8, 72, -1, 65, c["red"], c["red2"], c["hi"], c["line"])
    d += tile3(phone_panes(4, c))
    return svg(80, 64, d)
def phone_cap():
    c = PH
    s = slab(8, 72, 34, 82, c["red"], c["red2"], c["hi"], c["line"])
    s += phone_panes(42, c)
    s += mini_ghost(40, 56, 1.25)  # a little ghost making a call
    s += (f'<rect x="6" y="25" width="68" height="10" rx="2" fill="{c["red"]}" stroke="{c["line"]}" stroke-width="2"/>'
          f'<rect x="16" y="27" width="48" height="6" rx="1.5" fill="{c["sign"]}" stroke="{c["line"]}" stroke-width="1"/>'
          f'<path d="M37,28.6 q-1.6,1.4 0,2.8 l1,0.4 q0.8,-0.6 0,-1.2 M43,28.6 q1.6,1.4 0,2.8 l-1,0.4 q-0.8,-0.6 0,-1.2" stroke="{c["line"]}" stroke-width="1" fill="none"/>'
          f'<path d="M10,26 C10,18 22,13 40,13 C58,13 70,18 70,26 Z" fill="{c["red"]}" stroke="{c["line"]}" stroke-width="{LW}" stroke-linejoin="round"/>'
          f'<path d="M22,19 C26,16 31,15 36,15" stroke="#FFF" stroke-width="1.8" fill="none" stroke-linecap="round" opacity="0.8"/>'
          f'<path d="M32,13 C32,9 35,7 40,7 C45,7 48,9 48,13 Z" fill="{c["red2"]}" stroke="{c["line"]}" stroke-width="1.8"/>'
          f'<circle cx="40" cy="5" r="2" fill="#F6D58E" stroke="{c["line"]}" stroke-width="1"/>')
    return svg(80, 80, s)
reg_bot("obs-city-phonebox", phone_body(), phone_cap(),
        {"rects": [[10, 0, 60, 64]]},
        {"rects": [[10, 35, 60, 45], [7, 26, 66, 9], [14, 17, 52, 9], [33, 9, 14, 8]]}, [40, 8],
        note="roof knob is decorative")

# ================= CITY: fire hydrant on a standpipe =================
FH = dict(y="#FFE08A", y2="#F2C46E", hi="#FFF1C8", line="#7A5A3E", cap="#A8DCD9", cap2="#86C5C6")
def hydrant_body():
    c = FH
    d = slab(25, 55, -1, 65, c["y"], c["y2"], c["hi"], c["line"])
    d += tile3(f'<rect x="21" y="26" width="38" height="8" rx="3" fill="{c["y2"]}" stroke="{c["line"]}" stroke-width="1.8"/>'
               + "".join(f'<circle cx="{x}" cy="30" r="1.3" fill="{c["line"]}"/>' for x in (27, 40, 53)))
    return svg(80, 64, d)
def hydrant_cap():
    c = FH
    s = slab(25, 55, 70, 82, c["y"], c["y2"], c["hi"], c["line"])
    s += (f'<rect x="18" y="28" width="44" height="44" rx="6" fill="{c["y"]}" stroke="{c["line"]}" stroke-width="{LW}"/>'
          f'<rect x="50" y="30" width="10" height="40" fill="{c["y2"]}" opacity="0.7"/>'
          f'<rect x="22" y="30" width="4" height="38" fill="{c["hi"]}"/>'
          f'<rect x="8" y="44" width="11" height="10" rx="3" fill="{c["cap"]}" stroke="{c["line"]}" stroke-width="1.8"/>'
          f'<rect x="61" y="44" width="11" height="10" rx="3" fill="{c["cap"]}" stroke="{c["line"]}" stroke-width="1.8"/>'
          f'<path d="M20,33 C14,33 13,38 14,44" stroke="{c["line"]}" stroke-width="1" fill="none" stroke-dasharray="2 1.5"/>'
          f'<path d="M20,28 C20,19 29,14 40,14 C51,14 60,19 60,28 Z" fill="{c["cap"]}" stroke="{c["line"]}" stroke-width="{LW}" stroke-linejoin="round"/>'
          f'<path d="M27,22 C30,18 34,17 38,16.5" stroke="#FFF" stroke-width="1.8" fill="none" stroke-linecap="round" opacity="0.8"/>'
          f'<rect x="35" y="9" width="10" height="6" rx="1.5" fill="{c["cap2"]}" stroke="{c["line"]}" stroke-width="1.6"/>'
          f'<rect x="16" y="26" width="48" height="5" rx="2.5" fill="{c["y2"]}" stroke="{c["line"]}" stroke-width="1.6"/>'
          f'<rect x="16" y="66" width="48" height="6" rx="2.5" fill="{c["y2"]}" stroke="{c["line"]}" stroke-width="1.6"/>'
          + face(40, 47, 1.0, "fhE", "#5A3828", "#A0674A"))
    return svg(80, 80, s)
reg_bot("obs-city-hydrant", hydrant_body(), hydrant_cap(),
        {"rects": [[27, 0, 26, 64]]},
        {"rects": [[20, 30, 40, 42], [17, 27, 46, 4], [17, 66, 46, 6], [9, 45, 10, 8], [61, 45, 10, 8], [23, 20, 34, 8], [31, 16, 18, 4], [36, 10, 8, 6], [27, 72, 26, 8]]}, [40, 9],
        note="standpipe below is 30 px wide (honest, forgiving)")

# ================= SPACE: crystal spires =================
CY = dict(line="#5A4A8A", cols=[("#FFC2DD", "#F29EC4"), ("#C9F0DA", "#9ED8B8"), ("#E3D4FF", "#C2AEF0")], rock="#CBC9EF", rock2="#ABA8DE", rline="#55548C")
SPIRES = [(7, 29, 0), (29, 51, 1), (51, 73, 2)]
def prism(x0, x1, y0, y1, col, line, tip=None):
    a, b = col; m = (x0 + x1) / 2
    top = f"M{x0},{y1} V{tip[1]} L{m},{tip[0]} L{x1},{tip[1]} V{y1} Z" if tip else f"M{x0},{y1} V{y0} H{x1} V{y1} Z"
    s = f'<path d="{top}" fill="{a}"/>'
    s += f'<path d="M{m+3},{(tip[0]+4) if tip else y0} V{y1} H{x1} V{tip[1] if tip else y0} Z" fill="{b}" opacity="0.8"/>' if True else ""
    s += f'<path d="M{x0+3.5},{(tip[1]+2) if tip else y0} V{y1}" stroke="#FFF" stroke-width="2" opacity="0.7"/>'
    s += f'<path d="{top}" fill="none" stroke="{line}" stroke-width="2.2" stroke-linejoin="round"/>'
    return s
def crystals_body():
    c = CY
    d = "".join(prism(x0, x1, -2, 66, c["cols"][k], c["line"]) for x0, x1, k in SPIRES)
    d += tile3(sparkle(18, 20, 2.4, "#FFFFFF", "#B9A9E0") + sparkle(62, 46, 2, "#FFFFFF", "#B9A9E0") + f'<path d="M7,40 H29 M51,12 H73 M29,54 H51" stroke="{c["line"]}" stroke-width="1" opacity="0.35"/>')
    return svg(80, 64, d)
def crystals_cap():
    c = CY
    s = prism(7, 29, 0, 82, c["cols"][0], c["line"], (26, 36)) + prism(51, 73, 0, 82, c["cols"][2], c["line"], (18, 28)) + prism(29, 51, 0, 82, c["cols"][1], c["line"], (6, 18))
    s += face(40, 40, 0.85, "cyE", "#3E2C5C", "#6A4E9A")
    s += sparkle(66, 8, 3.2, "#FFF4B8", "#D9953A") + sparkle(14, 18, 2.4, "#FFFFFF", "#B9A9E0") + sparkle(40, 66, 2, "#FFFFFF", "#B9A9E0")
    return svg(80, 80, s)
# spire tips: rects stepped inside each point (the very tips, < 5 px wide, are excluded)
reg_bot("obs-space-crystals", crystals_body(), crystals_cap(),
        {"rects": [[8, 0, 64, 64]]},
        {"rects": [[8, 37, 20, 43], [52, 29, 20, 51], [30, 18, 20, 62], [34, 11, 12, 7], [11, 31, 14, 6], [55, 23, 14, 6]]}, [40, 9],
        note="three pastel crystal spires; the last ~4 px of each point, and the sparkles, are decorative")

# ================= SPACE: alien plant =================
AP = dict(stalk="#B8EBC8", stalk2="#93D6AC", line="#3F6A5E", pet="#E3D4FF", pet2="#C9B6F0", pline="#5A4A8A", core="#FFE9A8", glow="#9EF0E0")
def plant_body():
    c = AP
    d = (f'<rect x="31" y="-1" width="18" height="66" fill="{c["stalk"]}"/><rect x="43" y="-1" width="6" height="66" fill="{c["stalk2"]}"/>'
         f'<path d="M31,-1 V65 M49,-1 V65" stroke="{c["line"]}" stroke-width="{LW}"/>'
         + tile3(f'<path d="M31,18 C24,16 20,10 22,6 C27,7 31,12 31,18 Z" fill="{c["stalk"]}" stroke="{c["line"]}" stroke-width="1.6"/>'
                 f'<path d="M49,46 C56,44 60,38 58,34 C53,35 49,40 49,46 Z" fill="{c["stalk"]}" stroke="{c["line"]}" stroke-width="1.6"/>'
                 + "".join(f'<circle cx="{x}" cy="{y}" r="1.6" fill="{c["glow"]}" stroke="{c["line"]}" stroke-width="0.6"/>' for x, y in ((36, 28), (42, 56), (38, 8)))))
    return svg(80, 64, d)
def plant_cap():
    c = AP
    s = (f'<rect x="31" y="40" width="18" height="42" fill="{c["stalk"]}"/><rect x="43" y="40" width="6" height="42" fill="{c["stalk2"]}"/>'
         f'<path d="M31,40 V82 M49,40 V82" stroke="{c["line"]}" stroke-width="{LW}"/>'
         f'<path d="M31,66 C24,64 20,58 22,54 C27,55 31,60 31,66 Z" fill="{c["stalk"]}" stroke="{c["line"]}" stroke-width="1.6"/>'
         f'<path d="M49,72 C56,70 60,64 58,60 C53,61 49,66 49,72 Z" fill="{c["stalk"]}" stroke="{c["line"]}" stroke-width="1.6"/>')
    # antenna tendrils (decorative)
    for sx in (-1, 1):
        s += (f'<path d="M{40+sx*6},16 C{40+sx*8},8 {40+sx*14},6 {40+sx*16},3" stroke="{c["line"]}" stroke-width="2" fill="none" stroke-linecap="round"/>'
              f'<circle cx="{40+sx*16}" cy="3" r="2.6" fill="{c["glow"]}" stroke="{c["line"]}" stroke-width="1"/>')
    # petals
    for a in (-150, -110, -70, -30, 10, 170, 210):
        pass
    petals = [(14, 30, -20), (66, 30, 20), (24, 20, -40), (56, 20, 40), (20, 40, 10), (60, 40, -10)]
    for x, y, r in petals:
        s += f'<ellipse cx="{x}" cy="{y}" rx="12" ry="8" fill="{c["pet"]}" stroke="{c["pline"]}" stroke-width="2" transform="rotate({r} {x} {y})"/>'
        s += f'<ellipse cx="{x}" cy="{y}" rx="6" ry="3.4" fill="{c["pet2"]}" opacity="0.7" transform="rotate({r} {x} {y})"/>'
    s += (f'<circle cx="40" cy="31" r="16" fill="{c["core"]}" stroke="{c["pline"]}" stroke-width="{LW}"/>'
          f'<ellipse cx="34" cy="24" rx="3.6" ry="2.2" fill="#FFF" opacity="0.8" transform="rotate(-30 34 24)"/>'
          + face(40, 32, 0.95, "apE", "#3E2C5C", "#6A4E9A")
          + sparkle(70, 52, 2.6, "#FFF4B8", "#D9953A") + sparkle(10, 56, 2, "#FFFFFF", "#9EF0E0"))
    return svg(80, 80, s)
reg_bot("obs-space-alienplant", plant_body(), plant_cap(),
        {"rects": [[33, 0, 14, 64]]},
        {"rects": [[33, 46, 14, 34], [6, 27, 68, 7], [12, 34, 56, 7], [14, 20, 52, 7]], "circles": [[40, 31, 15]]}, [40, 14],
        note="petal tips, glowing antennae, stalk leaves and sparkles are decorative")

if __name__ == "__main__":
    write_all(); print(len(FILES), "files")
    for k, v in EDGES.items(): print(k, v.get("floorEdge"))
