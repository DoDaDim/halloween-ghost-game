"""v0.3b: stage TOP columns (church/countryside/school/city) + space columns. 80-wide canvases, 72px footprint.
Writes SVGs and exposes HIT (hitboxes) for export_pngs.py."""
import os, math
from build_tombs import svg, flower, leaf, LW
from build_extras import sparkle, blush, happy_eyes, mini_ghost, flip_v
OUT = os.path.join(os.path.dirname(__file__), "..")
FILES, HIT, EDGES = {}, {}, {}

def mirror(h):
    out = {}
    if "rects" in h: out["rects"] = [[x, 80 - y - hh, w, hh] for (x, y, w, hh) in h["rects"]]
    if "circles" in h: out["circles"] = [[cx, 80 - cy, r] for (cx, cy, r) in h["circles"]]
    return out
def edge_top(h):  # min y over shapes (floor cap -> gap edge)
    ys = [y for (x, y, w, hh) in h.get("rects", [])] + [cy - r for (cx, cy, r) in h.get("circles", [])]
    return min(ys)
def edge_bot(h):
    ys = [y + hh for (x, y, w, hh) in h.get("rects", [])] + [cy + r for (cx, cy, r) in h.get("circles", [])]
    return max(ys)
def register(name, body, top, bot, hb_body, hb_top, hb_bot=None, seat=None):
    FILES[name + "-body"], FILES[name + "-cap-top"], FILES[name + "-cap-bottom"] = body, top, bot
    hb_bot = hb_bot or mirror(hb_top)
    HIT[name + "-body"], HIT[name + "-cap-top"], HIT[name + "-cap-bottom"] = hb_body, hb_top, hb_bot
    EDGES[name] = {"files": name + "-{body,cap-top,cap-bottom}", "floorEdge": edge_top(hb_top), "ceilEdge": edge_bot(hb_bot)}
    if seat: EDGES[name]["pumpkinSeat"] = seat

def body_rect(x0, x1, fill, shade, hi, line, decor=""):
    w = x1 - x0
    return svg(80, 64, f'<rect x="{x0}" y="0" width="{w}" height="64" fill="{fill}"/>'
               f'<rect x="{x1-12}" y="0" width="12" height="64" fill="{shade}" opacity="0.75"/>'
               f'<rect x="{x0+4}" y="0" width="4" height="64" fill="{hi}"/>' + decor +
               f'<path d="M{x0},-1 V65 M{x1},-1 V65" stroke="{line}" stroke-width="{LW}"/>')

# ======================= CHURCH SPIRE =======================
SP = dict(fill="#D6D0EA", shade="#BBB2DA", hi="#E9E5F6", line="#5E5486", roof="#A9B4E8", roof2="#8E9AD6", gold="#F6D58E", glow="#FFE9A8")
def arch_window(x, y, w, h, c):
    return (f'<path d="M{x},{y+h} V{y+w/2} A{w/2},{w/2} 0 0,1 {x+w},{y+w/2} V{y+h} Z" fill="{c["glow"]}" stroke="{c["line"]}" stroke-width="1.6"/>'
            f'<path d="M{x+w/2},{y+2} V{y+h} M{x},{y+h*0.62} H{x+w}" stroke="#E8C77A" stroke-width="1"/>')
def spire_body():
    c = SP
    d = (f'<g stroke="{c["shade"]}" stroke-width="1.4" opacity="0.9"><path d="M4,16 H76 M4,48 H76 M22,0 V16 M58,16 V48 M22,48 V64"/></g>'
         + arch_window(33, 22, 14, 20, c))
    return body_rect(4, 76, c["fill"], c["shade"], c["hi"], c["line"], d)
def spire_cap(flip):
    c = SP
    tower = (f'<rect x="4" y="56" width="72" height="26" fill="{c["fill"]}"/><rect x="64" y="56" width="12" height="26" fill="{c["shade"]}" opacity="0.75"/>'
             f'<path d="M4,82 V56 M76,82 V56" stroke="{c["line"]}" stroke-width="{LW}"/>'
             f'<rect x="2" y="50" width="76" height="8" rx="3" fill="{c["hi"]}" stroke="{c["line"]}" stroke-width="{LW}"/>')
    roof = (f'<path d="M7,51 L37.5,7.5 Q40,4.5 42.5,7.5 L73,51 Z" fill="{c["roof"]}" stroke="{c["line"]}" stroke-width="{LW}" stroke-linejoin="round"/>'
            f'<path d="M40,8 L73,51 H56 Z" fill="{c["roof2"]}" opacity="0.6"/>'
            + "".join(f'<path d="M{40-32*(y-6)/48+3:.1f},{y} Q{40:.1f},{y+3.5} {40+32*(y-6)/48-3:.1f},{y}" stroke="{c["roof2"]}" stroke-width="1.3" fill="none"/>' for y in (20, 30, 40))
            + f'<circle cx="40" cy="36" r="5" fill="{c["glow"]}" stroke="{c["line"]}" stroke-width="1.5"/><path d="M40,31.5 V40.5 M35.5,36 H44.5" stroke="#E8C77A" stroke-width="1"/>'
            f'<path d="M26,26 L33,16" stroke="#FFF" stroke-width="1.6" stroke-linecap="round" opacity="0.6"/>')
    fin = (f'<path d="M40,6 V-1 M37,1.5 H43" stroke="{c["gold"]}" stroke-width="2.2" stroke-linecap="round"/>'
           f'<circle cx="40" cy="6" r="1.8" fill="{c["gold"]}" stroke="{c["line"]}" stroke-width="0.8"/>')
    art = roof + fin + tower
    return svg(80, 80, flip_v(80, art) if flip else art)
register("obs-church-spire", spire_body(), spire_cap(False), spire_cap(True),
         {"rects": [[8, 0, 64, 64]]}, {"rects": [[8, 50, 64, 30], [22, 36, 36, 14], [31, 21, 18, 15], [37, 12, 6, 9]]}, seat=[40, 3])

# ======================= CHURCH BELL =======================
BL = dict(wood="#E6CDB4", wood2="#CFAF93", wline="#7A5A4E", rope="#F6E7C6", bell="#FFE6A6", bell2="#F2C46E", bline="#8E5A3C")
def bell_body():
    c = BL
    d = "".join(f'<path d="M20,{y} Q40,{y+5} 60,{y}" stroke="{c["rope"]}" stroke-width="4" fill="none"/><path d="M20,{y} Q40,{y+5} 60,{y}" stroke="{c["wline"]}" stroke-width="0.9" fill="none" opacity="0.6"/>' for y in (8, 13, 40, 45))
    d += f'<path d="M30,20 q2,8 0,14 M48,52 q-2,6 0,10" stroke="{c["wood2"]}" stroke-width="1.2" fill="none"/>'
    return body_rect(20, 60, c["wood"], c["wood2"], "#F3E2CF", c["wline"], d)
def bell_shape(y0, c, face=True):
    # bell spanning y0 (top) .. y0+50 (rim bottom), x 6..74
    p = (f"M40,{y0} C51,{y0} 55,{y0+8} 55,{y0+18} C55,{y0+30} 60,{y0+38} 72,{y0+43} Q75,{y0+45} 73,{y0+48} "
         f"Q72,{y0+50} 68,{y0+50} H12 Q8,{y0+50} 7,{y0+48} Q5,{y0+45} 8,{y0+43} C20,{y0+38} 25,{y0+30} 25,{y0+18} C25,{y0+8} 29,{y0} 40,{y0} Z")
    s = (f'<defs><linearGradient id="bg{y0}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="{c["bell"]}"/><stop offset="0.55" stop-color="{c["bell"]}"/><stop offset="1" stop-color="{c["bell2"]}"/></linearGradient></defs>'
         f'<path d="{p}" fill="url(#bg{y0})" stroke="{c["bline"]}" stroke-width="{LW}" stroke-linejoin="round"/>'
         f'<path d="M9,{y0+44} H71" stroke="{c["bline"]}" stroke-width="1.4" opacity="0.6"/>'
         f'<path d="M31,{y0+8} C29,{y0+14} 29,{y0+24} 27,{y0+32}" stroke="#FFF8DC" stroke-width="2.4" fill="none" stroke-linecap="round" opacity="0.9"/>')
    if face:
        s += happy_eyes(33, 47, y0 + 28, 3, "#5A3828", 1.8) + blush(29, 51, y0 + 33, 3, 1.7, "#FF9EA8")
        s += f'<path d="M37.6,{y0+33} Q40,{y0+35.4} 42.4,{y0+33}" stroke="#5A3828" stroke-width="1.4" fill="none" stroke-linecap="round"/>'
    return s
def bow(x, y, col="#FFB6CC", line="#7A4E66"):
    return (f'<g transform="translate({x},{y})"><path d="M0,0 L-7,-4.5 Q-8.5,0 -7,4.5 Z M0,0 L7,-4.5 Q8.5,0 7,4.5 Z" fill="{col}" stroke="{line}" stroke-width="1.2" stroke-linejoin="round"/>'
            f'<path d="M-1,1 L-4,7 M1,1 L4,7" stroke="{line}" stroke-width="1.2" stroke-linecap="round"/><circle r="2" fill="#FF9EBB" stroke="{line}" stroke-width="1"/></g>')
def bell_cap(hanging):
    c = BL
    if hanging:   # hangs from a post coming down from the ceiling
        post = (f'<rect x="20" y="-2" width="40" height="14" fill="{c["wood"]}"/><path d="M20,-2 V12 M60,-2 V12" stroke="{c["wline"]}" stroke-width="{LW}"/>'
                f'<rect x="8" y="9" width="64" height="9" rx="4" fill="{c["wood"]}" stroke="{c["wline"]}" stroke-width="{LW}"/>'
                f'<path d="M12,12 H66" stroke="#F3E2CF" stroke-width="1.6" stroke-linecap="round"/>'
                f'<path d="M40,18 V22" stroke="{c["bline"]}" stroke-width="3"/>')
        clap = f'<path d="M40,64 V70" stroke="{c["bline"]}" stroke-width="2"/><circle cx="40" cy="73" r="4.2" fill="{c["bell2"]}" stroke="{c["bline"]}" stroke-width="1.6"/>'
        return svg(80, 80, post + clap + bell_shape(20, c) + bow(40, 22))
    post = (f'<rect x="20" y="62" width="40" height="20" fill="{c["wood"]}"/><path d="M20,62 V82 M60,62 V82" stroke="{c["wline"]}" stroke-width="{LW}"/>'
            f'<rect x="8" y="57" width="64" height="8" rx="3.5" fill="{c["wood"]}" stroke="{c["wline"]}" stroke-width="{LW}"/>')
    return svg(80, 80, post + bell_shape(8, c) + bow(40, 9))
register("obs-church-bell", bell_body(), bell_cap(False), bell_cap(True),
         {"rects": [[23, 0, 34, 64]]},
         {"rects": [[23, 56, 34, 24], [12, 34, 56, 22], [27, 20, 26, 14]], "circles": [[40, 22, 12]]},
         {"rects": [[23, 0, 34, 18], [38, 17, 4, 6], [12, 46, 56, 22], [27, 32, 26, 14]], "circles": [[40, 34, 12], [40, 72, 4]]}, seat=[40, 7])

# ======================= COUNTRYSIDE BRANCH (tree) =======================
TR = dict(bark="#D2B4A4", bark2="#B8968A", bhi="#E6D0C4", line="#6A4A4E", leaf="#A9DDBF", leaf2="#8CCBA9", lline="#4F7A62")
def tree_body():
    c = TR
    d = (f'<path d="M20,0 C24,16 16,40 20,64 M34,0 C30,20 38,44 34,64 M54,0 C58,22 50,42 54,64" stroke="{c["bark2"]}" stroke-width="1.6" fill="none"/>'
         f'<ellipse cx="46" cy="30" rx="6" ry="8" fill="#7A5A5E" stroke="{c["line"]}" stroke-width="1.4"/>'
         f'<circle cx="44" cy="29" r="1.6" fill="#FFE08A"/><circle cx="48.4" cy="29" r="1.6" fill="#FFE08A"/>')  # owl eyes in a knot hole
    return body_rect(8, 72, c["bark"], c["bark2"], c["bhi"], c["line"], d)
CANOPY = [(40, 52, 22), (18, 50, 14), (62, 50, 14), (26, 66, 12), (54, 66, 12), (40, 68, 11), (30, 38, 12), (50, 38, 12)]
def canopy(c):
    s = "".join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{c["leaf"]}" stroke="{c["lline"]}" stroke-width="{LW}"/>' for x, y, r in CANOPY)
    s += "".join(f'<circle cx="{x}" cy="{y}" r="{r-1.3}" fill="{c["leaf"]}"/>' for x, y, r in CANOPY)
    s += "".join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{col}" opacity="0.9"/>' for x, y, r, col in
                 [(48, 60, 9, "#9AD3B4"), (24, 56, 6, "#9AD3B4"), (58, 44, 5, "#C3EBD3")])
    s += "".join(leaf(x, y, a, f, "#8A5A5A") for x, y, a, f in [(16, 44, -30, "#FFC9A0"), (60, 60, 30, "#FFB6CC"), (34, 58, 160, "#FFD9A6"), (48, 42, -60, "#FFB6CC")])
    s += f'<ellipse cx="30" cy="34" rx="5" ry="2.5" fill="#E6F7EC" opacity="0.8" transform="rotate(-30 30 34)"/>'
    return s
def apple(x, y):
    return (f'<path d="M{x},{y-8} V{y-4}" stroke="#6A4A4E" stroke-width="1.2"/><circle cx="{x}" cy="{y}" r="4.2" fill="#FFB6C1" stroke="#7A4E5E" stroke-width="1.3"/>'
            f'<circle cx="{x-1.4}" cy="{y-1.3}" r="1.1" fill="#FFF" opacity="0.8"/>')
def tree_cap(flip):
    c = TR
    trunk = (f'<rect x="8" y="-2" width="64" height="40" fill="{c["bark"]}"/><rect x="60" y="-2" width="12" height="40" fill="{c["bark2"]}" opacity="0.75"/>'
             f'<path d="M20,0 C24,16 16,30 20,38 M54,0 C58,22 50,30 54,38" stroke="{c["bark2"]}" stroke-width="1.6" fill="none"/>'
             f'<path d="M8,-2 V38 M72,-2 V38" stroke="{c["line"]}" stroke-width="{LW}"/>')
    art = trunk + canopy(c)
    if flip:  # canopy at top (floor column)
        return svg(80, 80, flip_v(80, art) + apple(17, 40) + apple(63, 38))
    return svg(80, 80, art + apple(22, 76) + apple(58, 75))
register("obs-countryside-branch", tree_body(), tree_cap(True), tree_cap(False),
         {"rects": [[11, 0, 58, 64]]},
         {"rects": [[11, 42, 58, 38]], "circles": [[40, 29, 25]]},
         None, seat=[40, 6])

# ======================= COUNTRYSIDE SCARECROW =======================
SC = dict(pole="#E6CDB4", pole2="#CFAF93", wline="#7A5A4E", sack="#F7E8C8", sack2="#E6CFA4", shirt="#C9B6E8", shirt2="#A8DDC4", line="#6A4A5E", hat="#FFC9A0", hat2="#F2A57A", straw="#FFE08A")
def scare_body():
    c = SC
    d = "".join(f'<path d="M26,{y} L54,{y+6}" stroke="{c["straw"]}" stroke-width="2" stroke-linecap="round"/>' for y in (6, 26, 46))
    d += f'<path d="M30,16 q2,6 0,12 M48,36 q-2,6 0,10" stroke="{c["pole2"]}" stroke-width="1.2" fill="none"/>'
    return body_rect(26, 54, c["pole"], c["pole2"], "#F3E2CF", c["wline"], d)
def scarecrow(y, c, legs):
    s = []
    # arms crossbar + sleeves
    s.append(f'<rect x="5" y="{y+30}" width="70" height="11" rx="5" fill="{c["shirt"]}" stroke="{c["line"]}" stroke-width="{LW}"/>')
    s.append(f'<path d="M14,{y+30} V{y+41} M26,{y+30} V{y+41} M54,{y+30} V{y+41} M66,{y+30} V{y+41}" stroke="{c["shirt2"]}" stroke-width="2.4"/>')
    for x, d in ((5, -1), (75, 1)):
        s.append(f'<path d="M{x},{y+32} l{d*5},-3 M{x},{y+35.5} l{d*6},0 M{x},{y+39} l{d*5},3" stroke="#E8B84A" stroke-width="2" stroke-linecap="round"/>')
    # torso
    s.append(f'<path d="M27,{y+30} H53 L55,{y+56} Q40,{y+60} 25,{y+56} Z" fill="{c["shirt"]}" stroke="{c["line"]}" stroke-width="{LW}" stroke-linejoin="round"/>')
    s.append(f'<path d="M33,{y+30} V{y+57} M47,{y+30} V{y+57} M26,{y+42} H54" stroke="{c["shirt2"]}" stroke-width="2.2" opacity="0.9"/>')
    s.append(f'<rect x="42" y="{y+45}" width="8" height="7" rx="1.5" fill="#FFB6CC" stroke="{c["line"]}" stroke-width="1" stroke-dasharray="1.5 1"/>')
    if legs:
        s.append(f'<path d="M30,{y+56} V{y+64} M50,{y+56} V{y+64}" stroke="#9AB4D8" stroke-width="7" stroke-linecap="round"/>'
                 f'<path d="M30,{y+56} V{y+64} M50,{y+56} V{y+64}" stroke="{c["line"]}" stroke-width="0.8" opacity="0" />'
                 f'<path d="M27,{y+64} l-3,4 M30,{y+65} v4 M33,{y+64} l3,4 M47,{y+64} l-3,4 M50,{y+65} v4 M53,{y+64} l3,4" stroke="#E8B84A" stroke-width="1.8" stroke-linecap="round"/>')
    # head (sack) + hat
    s.append(f'<circle cx="40" cy="{y+20}" r="13" fill="{c["sack"]}" stroke="{c["line"]}" stroke-width="{LW}"/>')
    s.append(f'<path d="M30,{y+26} q2,-2 4,0" stroke="{c["sack2"]}" stroke-width="1.2" fill="none"/>')
    s.append(f'<circle cx="35" cy="{y+19}" r="2.6" fill="#4A3358"/><circle cx="45" cy="{y+19}" r="2.6" fill="#4A3358"/>'
             f'<circle cx="34.2" cy="{y+18.2}" r="0.9" fill="#FFF"/><circle cx="44.2" cy="{y+18.2}" r="0.9" fill="#FFF"/>')
    s.append(blush(31, 49, y + 24, 2.6, 1.5, "#FFA9B8"))
    s.append(f'<path d="M35,{y+26} Q40,{y+29.5} 45,{y+26}" stroke="{c["line"]}" stroke-width="1.3" fill="none" stroke-linecap="round"/>'
             f'<path d="M36.5,{y+26.6} l0.6,1.6 M40,{y+27.8} v1.6 M43.5,{y+26.6} l-0.6,1.6" stroke="{c["line"]}" stroke-width="0.9"/>')
    s.append(f'<ellipse cx="40" cy="{y+9}" rx="20" ry="4.5" fill="{c["hat"]}" stroke="{c["line"]}" stroke-width="{LW}"/>'
             f'<path d="M30,{y+8} Q30,{y-3} 40,{y-3} Q50,{y-3} 50,{y+8} Z" fill="{c["hat"]}" stroke="{c["line"]}" stroke-width="{LW}" stroke-linejoin="round"/>'
             f'<path d="M30.5,{y+5} H49.5" stroke="#FFB6CC" stroke-width="3"/>'
             + flower(47, y + 4.5, 1.8, "#FFF3E0"))
    return "".join(s)
def scare_cap(hanging):
    c = SC
    if hanging:
        pole = (f'<rect x="26" y="-2" width="28" height="40" fill="{c["pole"]}"/><path d="M26,-2 V38 M54,-2 V38" stroke="{c["wline"]}" stroke-width="{LW}"/>')
        return svg(80, 80, pole + scarecrow(10, c, True))
    pole = (f'<rect x="26" y="50" width="28" height="32" fill="{c["pole"]}"/><path d="M26,50 V82 M54,50 V82" stroke="{c["wline"]}" stroke-width="{LW}"/>')
    return svg(80, 80, pole + scarecrow(4, c, False))
register("obs-countryside-scarecrow", scare_body(), scare_cap(False), scare_cap(True),
         {"rects": [[29, 0, 22, 64]]},
         {"rects": [[8, 35, 64, 9], [28, 34, 24, 46]], "circles": [[40, 22, 12]]},
         {"rects": [[29, 0, 22, 20], [8, 41, 64, 9], [28, 40, 24, 26], [27, 66, 26, 8]], "circles": [[40, 28, 12]]}, seat=[40, 2])

# ======================= SCHOOL CHIMNEY =======================
CH = dict(brick="#F2C3B8", brick2="#E3A9A0", hi="#F9DCD4", line="#7A4E5E", crown="#F7E6DA")
def bricks(y0, y1, x0=8, x1=72):
    s = []
    for i, y in enumerate(range(y0, y1, 8)):
        s.append(f'<path d="M{x0},{y} H{x1}" stroke="{CH["brick2"]}" stroke-width="1.2"/>')
        off = 0 if i % 2 == 0 else 8
        for x in range(x0 + 8 + off, x1, 16):
            s.append(f'<path d="M{x},{y} V{min(y+8, y1)}" stroke="{CH["brick2"]}" stroke-width="1.2"/>')
    return "".join(s)
def chim_body():
    c = CH
    return body_rect(8, 72, c["brick"], c["brick2"], c["hi"], c["line"], bricks(0, 64) + '<rect x="40" y="17" width="15" height="6" rx="1" fill="#FFD9CF" opacity="0.8"/>')
def chim_cap(flip):
    c = CH
    art = (f'<rect x="8" y="22" width="64" height="60" fill="{c["brick"]}"/><rect x="60" y="22" width="12" height="60" fill="{c["brick2"]}" opacity="0.6"/>'
           + bricks(32, 82) +
           f'<path d="M8,22 V82 M72,22 V82" stroke="{c["line"]}" stroke-width="{LW}"/>'
           f'<rect x="3" y="14" width="74" height="11" rx="4" fill="{c["crown"]}" stroke="{c["line"]}" stroke-width="{LW}"/>'
           f'<path d="M7,17.5 H60" stroke="#FFF" stroke-width="1.6" stroke-linecap="round"/>'
           + "".join(f'<path d="M{x},14 L{x+1.5},5 H{x+12.5} L{x+14},14 Z" fill="#C9B6E8" stroke="{c["line"]}" stroke-width="{LW}" stroke-linejoin="round"/>'
                     f'<rect x="{x-0.5}" y="3" width="15" height="4" rx="2" fill="#DCCFF3" stroke="{c["line"]}" stroke-width="1.6"/>' for x in (17, 47)))
    face = (happy_eyes(33, 47, 52, 3, "#5A3550", 1.8) + blush(28, 52, 57, 3, 1.6, "#FF9EB0") +
            f'<path d="M37.5,56.5 Q40,59 42.5,56.5" stroke="#5A3550" stroke-width="1.4" fill="none" stroke-linecap="round"/>')
    if flip:
        return svg(80, 80, flip_v(80, art) + f'<g transform="translate(0,-24)">{face}</g>')
    return svg(80, 80, art + face)
register("obs-school-chimney", chim_body(), chim_cap(False), chim_cap(True),
         {"rects": [[11, 0, 58, 64]]},
         {"rects": [[11, 24, 58, 56], [5, 14, 70, 10], [19, 5, 11, 9], [49, 5, 11, 9]]}, seat=[40, 3])

# ======================= SCHOOL CLOCK TOWER =======================
CT = dict(stone="#E6DCF0", shade="#CDBFE0", hi="#F3EEF9", line="#5E5486", roof="#9ED8C8", roof2="#7FC2B0", face="#FFF8EC", gold="#F6D58E")
def ct_body():
    c = CT
    d = (f'<g stroke="{c["shade"]}" stroke-width="1.3"><path d="M10,24 H70 M10,56 H70 M28,0 V24 M52,24 V56 M28,56 V64"/></g>'
         f'<circle cx="40" cy="40" r="6" fill="#FFE9A8" stroke="{c["line"]}" stroke-width="1.5"/><path d="M40,34 V46 M34,40 H46" stroke="#E8C77A" stroke-width="1"/>')
    return body_rect(10, 70, c["stone"], c["shade"], c["hi"], c["line"], d)
def clock(cx, cy, r, c):
    ticks = "".join(f'<circle cx="{cx+math.cos(math.radians(a))*(r-3.2):.2f}" cy="{cy+math.sin(math.radians(a))*(r-3.2):.2f}" r="0.9" fill="{c["line"]}"/>' for a in range(0, 360, 30))
    return (f'<circle cx="{cx}" cy="{cy}" r="{r+3}" fill="{c["gold"]}" stroke="{c["line"]}" stroke-width="{LW}"/>'
            f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{c["face"]}" stroke="{c["line"]}" stroke-width="1.4"/>' + ticks +
            happy_eyes(cx - 5.5, cx + 5.5, cy - 2, 2.4, "#4A3358", 1.5) + blush(cx - 8.5, cx + 8.5, cy + 3, 2.2, 1.3) +
            f'<path d="M{cx},{cy+5} V{cy+9.5} M{cx},{cy+5} L{cx+4},{cy+7}" stroke="#E0607E" stroke-width="1.6" stroke-linecap="round"/>'
            f'<circle cx="{cx}" cy="{cy+5}" r="1.2" fill="#E0607E"/>')
def ct_cap(hanging):
    c = CT
    if not hanging:
        art = (f'<rect x="10" y="68" width="60" height="14" fill="{c["stone"]}"/><path d="M10,68 V82 M70,68 V82" stroke="{c["line"]}" stroke-width="{LW}"/>'
               f'<rect x="6" y="30" width="68" height="40" rx="4" fill="{c["stone"]}" stroke="{c["line"]}" stroke-width="{LW}"/>'
               f'<rect x="60" y="32" width="12" height="36" fill="{c["shade"]}" opacity="0.6"/>'
               + clock(40, 50, 14, c) +
               f'<path d="M6,31 L37.5,5.5 Q40,3.5 42.5,5.5 L74,31 Z" fill="{c["roof"]}" stroke="{c["line"]}" stroke-width="{LW}" stroke-linejoin="round"/>'
               f'<path d="M40,6 L74,31 H58 Z" fill="{c["roof2"]}" opacity="0.6"/>'
               f'<path d="M40,4 V-1" stroke="{c["gold"]}" stroke-width="2"/><path d="M40,-1 l7,2.5 l-7,2.5 Z" fill="#FFB6CC" stroke="{c["line"]}" stroke-width="0.8"/>'
               f'<path d="M24,20 L32,13" stroke="#FFF" stroke-width="1.6" stroke-linecap="round" opacity="0.7"/>')
        return svg(80, 80, art)
    art = (f'<rect x="10" y="-2" width="60" height="12" fill="{c["stone"]}"/><path d="M10,-2 V10 M70,-2 V10" stroke="{c["line"]}" stroke-width="{LW}"/>'
           f'<rect x="6" y="8" width="68" height="52" rx="5" fill="{c["stone"]}" stroke="{c["line"]}" stroke-width="{LW}"/>'
           f'<rect x="60" y="10" width="12" height="48" fill="{c["shade"]}" opacity="0.6"/>'
           + clock(40, 32, 14, c) +
           f'<path d="M12,60 H68 L62,68 Q40,72 18,68 Z" fill="{c["roof"]}" stroke="{c["line"]}" stroke-width="{LW}" stroke-linejoin="round"/>'
           f'<path d="M40,70 V74" stroke="{c["gold"]}" stroke-width="1.8"/><circle cx="40" cy="76" r="3" fill="{c["gold"]}" stroke="{c["line"]}" stroke-width="1.2"/>')
    return svg(80, 80, art)
register("obs-school-clocktower", ct_body(), ct_cap(False), ct_cap(True),
         {"rects": [[13, 0, 54, 64]]},
         {"rects": [[9, 30, 62, 50], [21, 18, 38, 12], [33, 9, 14, 9]]},
         {"rects": [[13, 0, 54, 10], [9, 8, 62, 52], [16, 60, 48, 9]]}, seat=[40, 3])

# ======================= CITY SKYSCRAPER =======================
SS = dict(wall="#B9B8E8", shade="#9F9DD8", hi="#D3D2F4", line="#4A4A7E", lit="#FFE9A8", dark="#8E8CC8", neon="#FF9EC8", neon2="#9EF0E0")
def windows(y0, y1, c, x0=12, x1=62, seed=0):
    s = []; k = seed
    for y in range(y0, y1, 16):
        for x in range(x0, x1, 13):
            k += 1
            col = c["lit"] if (k * 7) % 5 in (0, 2, 3) else c["dark"]
            s.append(f'<rect x="{x}" y="{y+3}" width="9" height="10" rx="2" fill="{col}" stroke="{c["line"]}" stroke-width="1"/>')
    return "".join(s)
def neon_strip(x, y0, y1, col):
    return (f'<path d="M{x},{y0} V{y1}" stroke="{col}" stroke-width="6" opacity="0.35" stroke-linecap="round"/>'
            f'<path d="M{x},{y0} V{y1}" stroke="{col}" stroke-width="2.2" stroke-linecap="round"/>'
            f'<path d="M{x},{y0} V{y1}" stroke="#FFF" stroke-width="0.8" stroke-linecap="round" opacity="0.8"/>')
def ss_body():
    c = SS
    d = windows(0, 64, c) + neon_strip(68.5, 0, 64, c["neon"])
    return body_rect(6, 74, c["wall"], c["shade"], c["hi"], c["line"], d)
def neon_sign(cx, cy, c):
    heart = f"M{cx},{cy+7} C{cx-10},{cy} {cx-9},{cy-7} {cx-4},{cy-7} C{cx-2},{cy-7} {cx},{cy-5} {cx},{cy-3.5} C{cx},{cy-5} {cx+2},{cy-7} {cx+4},{cy-7} C{cx+9},{cy-7} {cx+10},{cy} {cx},{cy+7} Z"
    return (f'<rect x="{cx-19}" y="{cy-11}" width="38" height="22" rx="7" fill="#3E3A6E" stroke="{c["line"]}" stroke-width="1.8"/>'
            f'<rect x="{cx-17}" y="{cy-9}" width="34" height="18" rx="5" fill="none" stroke="{c["neon2"]}" stroke-width="1.4" opacity="0.9"/>'
            f'<path d="{heart}" fill="none" stroke="{c["neon"]}" stroke-width="5" opacity="0.35"/>'
            f'<path d="{heart}" fill="none" stroke="{c["neon"]}" stroke-width="2"/><path d="{heart}" fill="none" stroke="#FFF" stroke-width="0.7" opacity="0.9"/>'
            + sparkle(cx - 12, cy - 3, 2.4, "#FFF6C8", "#FFF6C8", 1, 0.3) + sparkle(cx + 12, cy + 3, 2, "#9EF0E0", "#9EF0E0", 1, 0.3))
def ss_cap(flip):
    c = SS
    art = (f'<rect x="6" y="40" width="68" height="42" fill="{c["wall"]}"/><rect x="62" y="40" width="12" height="42" fill="{c["shade"]}" opacity="0.75"/>'
           + windows(64, 82, c, seed=3) + neon_strip(68.5, 44, 82, c["neon"]) +
           f'<path d="M6,82 V40 H74 V82" fill="none" stroke="{c["line"]}" stroke-width="{LW}" stroke-linejoin="round"/>'
           f'<rect x="3" y="37" width="74" height="6" rx="2.5" fill="{c["hi"]}" stroke="{c["line"]}" stroke-width="1.8"/>'
           f'<rect x="16" y="22" width="48" height="16" fill="{c["wall"]}" stroke="{c["line"]}" stroke-width="{LW}"/>'
           f'<rect x="54" y="23" width="9" height="14" fill="{c["shade"]}" opacity="0.7"/>'
           + "".join(f'<rect x="{x}" y="26" width="7" height="8" rx="1.5" fill="{c["lit"] if x != 33 else c["dark"]}" stroke="{c["line"]}" stroke-width="1"/>' for x in (21, 33, 45))
           + f'<path d="M40,22 V5" stroke="{c["line"]}" stroke-width="2"/><path d="M36,12 H44" stroke="{c["line"]}" stroke-width="1.6"/>'
           f'<circle cx="40" cy="4" r="4" fill="{c["neon"]}" opacity="0.35"/><circle cx="40" cy="4" r="2" fill="{c["neon"]}" stroke="{c["line"]}" stroke-width="0.8"/>')
    sign = neon_sign(40, 53 if not flip else 27, c)
    return svg(80, 80, (flip_v(80, art) if flip else art) + sign)
register("obs-city-skyscraper", ss_body(), ss_cap(False), ss_cap(True),
         {"rects": [[9, 0, 62, 64]]},
         {"rects": [[9, 40, 62, 40], [19, 23, 42, 17]]}, seat=[40, 21])

# ======================= CITY CRANE HOOK =======================
CN = dict(steel="#FFE3A0", steel2="#F2C46E", line="#7A5A3E", block="#D6D2EA", block2="#B9B3D9", bline="#4E4A6E", stripe="#FFB6CC")
def lattice(y0, y1):
    c = CN
    cid = f"lat{y0+10}_{y1+10}"
    s = [f'<clipPath id="{cid}"><rect x="0" y="{y0}" width="80" height="{y1-y0}"/></clipPath><g clip-path="url(#{cid})">',
         f'<rect x="16" y="{y0}" width="48" height="{y1-y0}" fill="{c["steel"]}" opacity="0.25"/>']
    for y in range(y0 - ((y0 % 32) if y0 >= 0 else (y0 % 32)), y1, 32):
        s.append(f'<path d="M20,{y} L60,{y+16} L20,{y+32} M20,{y} H60 M20,{y+16} H60" stroke="{c["steel"]}" stroke-width="4" fill="none" stroke-linejoin="round"/>')
        s.append(f'<path d="M20,{y} L60,{y+16} L20,{y+32} M20,{y} H60 M20,{y+16} H60" stroke="{c["line"]}" stroke-width="0.9" fill="none" opacity="0.6"/>')
    s.append('</g>')
    s.append(f'<rect x="15" y="{y0-1}" width="7" height="{y1-y0+2}" fill="{c["steel"]}"/><rect x="58" y="{y0-1}" width="7" height="{y1-y0+2}" fill="{c["steel2"]}"/>')
    s.append(f'<path d="M15,{y0-1} V{y1+1} M22,{y0-1} V{y1+1} M58,{y0-1} V{y1+1} M65,{y0-1} V{y1+1}" stroke="{c["line"]}" stroke-width="1.8"/>')
    return "".join(s)
def crane_body():
    return svg(80, 64, lattice(0, 64))
def crane_cap(hanging):
    c = CN
    if hanging:
        art = (lattice(-2, 12) + f'<rect x="12" y="10" width="56" height="6" rx="2" fill="{c["steel2"]}" stroke="{c["line"]}" stroke-width="1.8"/>'
               f'<path d="M36,16 V26 M44,16 V26" stroke="{c["bline"]}" stroke-width="1.6"/>'
               f'<rect x="24" y="24" width="32" height="22" rx="6" fill="{c["block"]}" stroke="{c["bline"]}" stroke-width="{LW}"/>'
               f'<rect x="48" y="26" width="6" height="18" fill="{c["block2"]}" opacity="0.8"/>'
               f'<path d="M27,40 l5,-6 M33,40 l5,-6 M39,40 l5,-6 M45,40 l5,-6" stroke="{c["stripe"]}" stroke-width="2.6" stroke-linecap="round"/>'
               f'<circle cx="40" cy="31" r="3" fill="#FFF" stroke="{c["bline"]}" stroke-width="1.2"/>'
               f'<path d="M40,46 V52" stroke="{c["bline"]}" stroke-width="3"/>'
               f'<path d="M40,52 C40,60 38,66 34,66 C29,66 28,60 30.5,57" fill="none" stroke="{c["bline"]}" stroke-width="7.5" stroke-linecap="round"/>'
               f'<path d="M40,52 C40,60 38,66 34,66 C29,66 28,60 30.5,57" fill="none" stroke="#C9C6E0" stroke-width="4.5" stroke-linecap="round"/>'
               f'<path d="M39,55 C39,59 38,62 36,63.5" fill="none" stroke="#FFF" stroke-width="1.2" stroke-linecap="round"/>'
               # little tag on the hook
               f'<path d="M46,58 l4,10 h8 l-2,-10 z" fill="#FFF3B0" stroke="{c["line"]}" stroke-width="1.2" stroke-linejoin="round"/>'
               f'<path d="M40,53 L47,59" stroke="{c["line"]}" stroke-width="0.8"/>'
               + sparkle(52.5, 63, 2, "#FFB6CC", "#FFB6CC", 1, 0.3))
        return svg(80, 80, art)
    art = (lattice(60, 82) +
           f'<rect x="2" y="22" width="76" height="8" rx="2" fill="{c["steel"]}" stroke="{c["line"]}" stroke-width="1.8"/>'
           f'<path d="M6,26 l6,-4 l6,8 l6,-8 l6,8 l6,-8 l6,8 l6,-8 l6,8 l6,-8 l6,8 l6,-8" stroke="{c["line"]}" stroke-width="0.9" fill="none" opacity="0.6"/>'
           f'<rect x="12" y="30" width="56" height="32" rx="6" fill="#A8DCD9" stroke="{c["line"]}" stroke-width="{LW}"/>'
           f'<rect x="18" y="35" width="30" height="18" rx="4" fill="#E6F2FF" stroke="{c["line"]}" stroke-width="1.5"/>'
           + mini_ghost(33, 46, 0.95) +
           f'<path d="M21,50 L28,38" stroke="#FFF" stroke-width="1.5" stroke-linecap="round" opacity="0.8"/>'
           f'<rect x="52" y="36" width="10" height="20" rx="2" fill="#86C5C6" stroke="{c["line"]}" stroke-width="1.2"/>'
           f'<path d="M12,58 H68" stroke="{c["stripe"]}" stroke-width="3"/>'
           f'<circle cx="62" cy="18" r="5" fill="#FFB6CC" opacity="0.35"/><circle cx="62" cy="18" r="2.6" fill="#FFB6CC" stroke="{c["line"]}" stroke-width="1"/><path d="M62,20.6 V22" stroke="{c["line"]}" stroke-width="1.2"/>')
    return svg(80, 80, art)
register("obs-city-cranehook", crane_body(), crane_cap(False), crane_cap(True),
         {"rects": [[17, 0, 46, 64]]},
         {"rects": [[5, 23, 70, 7], [15, 30, 50, 50]]},
         {"rects": [[17, 0, 46, 16], [36, 16, 8, 10], [26, 25, 28, 20], [29, 45, 13, 23]]}, seat=[40, 21])

# ======================= SPACE SATELLITE =======================
SA = dict(metal="#D3D8EC", metal2="#B6BCDA", hi="#ECEFFA", line="#4E5280", gold="#FFE3A0", gold2="#F2C46E", panel="#A9C8F0", panel2="#8DB0E6", light="#9EF0E0")
def sat_body():
    c = SA
    d = (f'<path d="M14,8 H66 M14,40 H66" stroke="{c["metal2"]}" stroke-width="2"/>'
         f'<path d="M18,8 L62,40 M62,8 L18,40" stroke="{c["metal2"]}" stroke-width="1.4"/>'
         + "".join(f'<circle cx="{x}" cy="{y}" r="1.2" fill="{c["line"]}" opacity="0.6"/>' for x in (19, 61) for y in (14, 34, 52))
         + f'<circle cx="40" cy="54" r="3" fill="{c["light"]}" stroke="{c["line"]}" stroke-width="1"/><circle cx="40" cy="54" r="6" fill="{c["light"]}" opacity="0.3"/>')
    return body_rect(14, 66, c["metal"], c["metal2"], c["hi"], c["line"], d)
def sat_art(c):
    s = []
    for x0 in (2, 58):
        s.append(f'<rect x="{x0}" y="13" width="20" height="20" rx="2" fill="{c["panel"]}" stroke="{c["line"]}" stroke-width="1.8"/>'
                 f'<path d="M{x0+6.7},13 V33 M{x0+13.3},13 V33 M{x0},23 H{x0+20}" stroke="{c["panel2"]}" stroke-width="1.2"/>'
                 f'<path d="M{x0+2},15.5 L{x0+6},15.5" stroke="#FFF" stroke-width="1.2" stroke-linecap="round" opacity="0.8"/>')
    s.append(f'<path d="M22,23 H25 M55,23 H58" stroke="{c["line"]}" stroke-width="2.4"/>')
    s.append(f'<rect x="14" y="-2" width="52" height="8" fill="{c["metal"]}"/><path d="M14,-2 V6 M66,-2 V6" stroke="{c["line"]}" stroke-width="{LW}"/>')
    s.append(f'<rect x="24" y="4" width="32" height="40" rx="5" fill="{c["gold"]}" stroke="{c["line"]}" stroke-width="{LW}"/>'
             f'<rect x="46" y="6" width="8" height="36" fill="{c["gold2"]}" opacity="0.6"/>'
             f'<path d="M24,14 H56 M24,36 H56" stroke="{c["gold2"]}" stroke-width="1.2"/>')
    s.append(f'<path d="M40,44 V50" stroke="{c["line"]}" stroke-width="2.6"/>'
             f'<path d="M16,50 H64 Q62,66 40,68 Q18,66 16,50 Z" fill="{c["metal"]}" stroke="{c["line"]}" stroke-width="{LW}" stroke-linejoin="round"/>'
             f'<path d="M20,52 H60 Q57,62 40,64 Q23,62 20,52 Z" fill="{c["hi"]}"/>'
             f'<path d="M40,52 V72" stroke="{c["line"]}" stroke-width="1.8"/><circle cx="40" cy="74" r="2.8" fill="#FFB6CC" stroke="{c["line"]}" stroke-width="1.2"/>')
    return "".join(s)
def sat_face(cy):
    return (happy_eyes(34.5, 45.5, cy, 2.6, "#5A3828", 1.6) + blush(30.5, 49.5, cy + 4.5, 2.4, 1.4, "#FF9EA8") +
            f'<path d="M38,{cy+4} Q40,{cy+6} 42,{cy+4}" stroke="#5A3828" stroke-width="1.3" fill="none" stroke-linecap="round"/>')
def sat_cap(flip):
    c = SA
    art = sat_art(c)
    if flip:
        return svg(80, 80, flip_v(80, art) + sat_face(52))
    return svg(80, 80, art + sat_face(24))
register("obs-space-satellite", sat_body(), sat_cap(True), sat_cap(False),
         {"rects": [[17, 0, 46, 64]]},
         {"rects": [[17, 74, 46, 6], [26, 38, 28, 40], [39, 29, 2, 10], [5, 49, 70, 16], [18, 13, 44, 17]]},
         {"rects": [[17, 0, 46, 6], [26, 2, 28, 40], [39, 41, 2, 10], [5, 15, 70, 16], [18, 50, 44, 17]]}, seat=[40, 8])

# ======================= SPACE UFO =======================
UF = dict(hull="#D9C9F5", hull2="#B9A3E6", line="#4E3D7A", stalk="#C9B6F0", stalk2="#A891DE", glass="#DFF4FF", light="#9EF0E0", alien="#B8EBC8")
def ufo_body():
    c = UF
    d = "".join(f'<rect x="22" y="{y}" width="36" height="6" rx="3" fill="{c["light"]}" stroke="{c["line"]}" stroke-width="1.2"/>'
                f'<rect x="20" y="{y-2}" width="40" height="10" rx="5" fill="{c["light"]}" opacity="0.25"/>' for y in (12, 44))
    return body_rect(24, 56, c["stalk"], c["stalk2"], "#E3D9F8", c["line"], d)
def alien_head(cx, cy, s=1.0, c=UF):
    return (f'<g transform="translate({cx},{cy}) scale({s})">'
            f'<path d="M-3,-8 L-6,-14 M3,-8 L6,-14" stroke="{c["line"]}" stroke-width="1.3" stroke-linecap="round"/>'
            f'<circle cx="-6" cy="-14.5" r="2" fill="#FFB6CC" stroke="{c["line"]}" stroke-width="0.9"/><circle cx="6" cy="-14.5" r="2" fill="#FFB6CC" stroke="{c["line"]}" stroke-width="0.9"/>'
            f'<ellipse cx="0" cy="0" rx="10" ry="9" fill="{c["alien"]}" stroke="{c["line"]}" stroke-width="1.5"/>'
            f'<ellipse cx="-3.8" cy="-0.5" rx="2.4" ry="3" fill="#2E2450"/><ellipse cx="3.8" cy="-0.5" rx="2.4" ry="3" fill="#2E2450"/>'
            f'<circle cx="-4.5" cy="-1.6" r="0.9" fill="#FFF"/><circle cx="3.1" cy="-1.6" r="0.9" fill="#FFF"/>'
            f'<ellipse cx="-7" cy="3" rx="1.8" ry="1" fill="#FFB3CB"/><ellipse cx="7" cy="3" rx="1.8" ry="1" fill="#FFB3CB"/>'
            f'<path d="M-1.6,3.6 Q0,5 1.6,3.6" stroke="{c["line"]}" stroke-width="1" fill="none" stroke-linecap="round"/></g>')
def saucer(y, c):
    # y = saucer centre line
    lights = "".join(f'<circle cx="{x}" cy="{y+2}" r="2.2" fill="{col}" stroke="{c["line"]}" stroke-width="0.8"/>' for x, col in
                     zip((14, 27, 40, 53, 66), ("#FFB6CC", "#FFE9A8", "#9EF0E0", "#FFE9A8", "#FFB6CC")))
    return (f'<path d="M26,{y+8} H54 Q50,{y+16} 40,{y+16} Q30,{y+16} 26,{y+8} Z" fill="{c["hull2"]}" stroke="{c["line"]}" stroke-width="{LW}" stroke-linejoin="round"/>'
            f'<ellipse cx="40" cy="{y+2}" rx="37" ry="9" fill="{c["hull"]}" stroke="{c["line"]}" stroke-width="{LW}"/>'
            f'<path d="M8,{y+3} Q40,{y+12} 72,{y+3}" stroke="{c["hull2"]}" stroke-width="2" fill="none"/>' + lights +
            f'<path d="M16,{y-3} Q30,{y-7} 44,{y-7}" stroke="#FFF" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="0.8"/>')
def dome(y, c):
    return (f'<path d="M22,{y} Q22,{y-22} 40,{y-22} Q58,{y-22} 58,{y} Z" fill="{c["glass"]}" stroke="{c["line"]}" stroke-width="{LW}" opacity="0.95"/>'
            + alien_head(40, y - 8, 0.95) +
            f'<path d="M27,{y-6} Q27,{y-17} 36,{y-18.5}" stroke="#FFF" stroke-width="1.8" fill="none" stroke-linecap="round" opacity="0.9"/>')
def ufo_cap(hanging):
    c = UF
    if hanging:
        stalk = f'<rect x="24" y="-2" width="32" height="22" fill="{c["stalk"]}"/><path d="M24,-2 V20 M56,-2 V20" stroke="{c["line"]}" stroke-width="{LW}"/>'
        beam = (f'<defs><linearGradient id="bm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C9FFF4" stop-opacity="0.85"/><stop offset="1" stop-color="#C9FFF4" stop-opacity="0.1"/></linearGradient></defs>'
                f'<path d="M30,64 L20,80 H60 L50,64 Z" fill="url(#bm)"/>')
        return svg(80, 80, stalk + beam + dome(48, c) + saucer(50, c))
    stalk = f'<rect x="24" y="54" width="32" height="28" fill="{c["stalk"]}"/><path d="M24,54 V82 M56,54 V82" stroke="{c["line"]}" stroke-width="{LW}"/>'
    return svg(80, 80, stalk + dome(36, c) + saucer(38, c))
register("obs-space-ufo", ufo_body(), ufo_cap(False), ufo_cap(True),
         {"rects": [[26, 0, 28, 64]]},
         {"rects": [[26, 52, 28, 28], [32, 45, 16, 8], [7, 32, 66, 14], [24, 17, 32, 15]]},
         {"rects": [[26, 0, 28, 30], [7, 44, 66, 14], [24, 29, 32, 15], [28, 58, 24, 8]]}, seat=[40, 15])

if __name__ == "__main__":
    for k, v in FILES.items(): open(os.path.join(OUT, k + ".svg"), "w").write(v)
    print(len(FILES), "files"); print(EDGES)
