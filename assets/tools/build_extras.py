"""v0.3 extras: common columns, hazards, pickups, events, warning marker, ambient layers. Hand-authored SVG."""
import os, math, random
from build_ghosts import ghost_svg
from build_tombs import svg, flower, leaf, LW
OUT = os.path.join(os.path.dirname(__file__), "..")
FILES = {}
def put(name, s): FILES[name] = s

def eyes(cx1, cx2, cy, rx, ry, col="#4A3358", col2="#7A5A9E", gid="e"):
    s = [f'<defs><linearGradient id="{gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0.35" stop-color="{col}"/><stop offset="1" stop-color="{col2}"/></linearGradient></defs>']
    for cx in (cx1, cx2):
        s.append(f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="url(#{gid})"/>'
                 f'<ellipse cx="{cx-rx*0.32:.2f}" cy="{cy-ry*0.38:.2f}" rx="{rx*0.42:.2f}" ry="{ry*0.4:.2f}" fill="#FFF"/>'
                 f'<circle cx="{cx+rx*0.38:.2f}" cy="{cy+ry*0.42:.2f}" r="{rx*0.22:.2f}" fill="#FFF"/>')
    return "".join(s)
def blush(x1, x2, y, rx=2.6, ry=1.5, col="#FFB3CB"):
    return "".join(f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="{col}" opacity="0.85"/>' for x in (x1, x2))
def happy_eyes(cx1, cx2, cy, w, col, sw=1.6):
    return "".join(f'<path d="M{cx-w},{cy+1} Q{cx},{cy-w*0.9} {cx+w},{cy+1}" fill="none" stroke="{col}" stroke-width="{sw}" stroke-linecap="round"/>' for cx in (cx1, cx2))
def sparkle(x, y, r, fill="#FFF4B8", line="#D9953A", op=1.0, sw=0.9):
    k = r * 0.28
    return (f'<path d="M{x},{y-r} Q{x+k},{y-k} {x+r},{y} Q{x+k},{y+k} {x},{y+r} Q{x-k},{y+k} {x-r},{y} Q{x-k},{y-k} {x},{y-r} Z" '
            f'fill="{fill}" stroke="{line}" stroke-width="{sw}" stroke-linejoin="round" opacity="{op}"/>')
def flip_v(h, inner): return f'<g transform="translate(0,{h}) scale(1,-1)">{inner}</g>'

# =========================== COLUMNS (80 wide, body 80x64 tiles, caps 80x80) ===========================
# ---- Coffin: dusty-rose wood, lilac trim, bat-heart emblem
CF = dict(fill="#EBC9D2", hi="#F7E1E7", shade="#D5A9B8", line="#7A4E66", trim="#C9B6E8", grain="#C99AAB", gold="#F6D58E")
def coffin_body():
    c = CF
    return svg(80, 64, f'''<rect x="10" y="0" width="60" height="64" fill="{c["fill"]}"/>
<rect x="56" y="0" width="14" height="64" fill="{c["shade"]}" opacity="0.75"/>
<rect x="13" y="0" width="4" height="64" fill="{c["hi"]}"/>
<path d="M18,0 V64 M62,0 V64" stroke="{c["trim"]}" stroke-width="2.4"/>
<path d="M28,6 q2,10 0,20 M44,30 q-2,12 0,26 M52,2 q2,8 0,14" stroke="{c["grain"]}" stroke-width="1.2" fill="none" stroke-linecap="round" opacity="0.8"/>
<rect x="5" y="26" width="7" height="14" rx="3" fill="{c["gold"]}" stroke="{c["line"]}" stroke-width="1.4"/>
<rect x="68" y="26" width="7" height="14" rx="3" fill="{c["gold"]}" stroke="{c["line"]}" stroke-width="1.4"/>
<path d="M10,-1 V65 M70,-1 V65" stroke="{c["line"]}" stroke-width="{LW}"/>''')
def bat_heart(x, y, c):
    return (f'<g transform="translate({x},{y})">'
            f'<path d="M-6,-1 Q-13,-7 -16,-1 Q-13,0 -12,3 Q-9,1 -7,4 Z M6,-1 Q13,-7 16,-1 Q13,0 12,3 Q9,1 7,4 Z" fill="{c["trim"]}" stroke="{c["line"]}" stroke-width="1.1" stroke-linejoin="round"/>'
            f'<path d="M0,7 C-9,1 -8,-6 -3.5,-6 C-1.5,-6 0,-4.5 0,-3 C0,-4.5 1.5,-6 3.5,-6 C8,-6 9,1 0,7 Z" fill="#FFB3CB" stroke="{c["line"]}" stroke-width="1.3"/>'
            f'<ellipse cx="-3" cy="-3" rx="1.4" ry="1" fill="#FFF" opacity="0.9"/></g>')
def coffin_cap(flip):
    c = CF
    shape = "M10,82 V54 L4.5,31 Q3.8,28 5.5,25.5 L18,8.5 Q20,6 23,6 H57 Q60,6 62,8.5 L74.5,25.5 Q76.2,28 75.5,31 L70,54 V82"
    inner = "M18,82 V54 L12.5,31 L23,14 H57 L67.5,31 L62,54 V82"
    stone = (f'<path d="{shape} Z" fill="{c["fill"]}"/>'
             f'<path d="M56,82 V54 L62,31 L57,14 L62,8.5 L74.5,25.5 Q76.2,28 75.5,31 L70,54 V82 Z" fill="{c["shade"]}" opacity="0.75"/>'
             f'<path d="M13,82 V54 L8,31 L19,13 L21,13 L11,31 L16,54 V82 Z" fill="{c["hi"]}"/>'
             f'<path d="{inner}" fill="none" stroke="{c["trim"]}" stroke-width="2.4" stroke-linejoin="round"/>'
             f'<rect x="68" y="60" width="7" height="14" rx="3" fill="{c["gold"]}" stroke="{c["line"]}" stroke-width="1.4"/>'
             f'<rect x="5" y="60" width="7" height="14" rx="3" fill="{c["gold"]}" stroke="{c["line"]}" stroke-width="1.4"/>'
             f'<path d="{shape}" fill="none" stroke="{c["line"]}" stroke-width="{LW}" stroke-linejoin="round"/>'
             f'<path d="M26,10 H50" stroke="#FFF" stroke-width="1.8" stroke-linecap="round" opacity="0.7"/>')
    emblem = bat_heart(40, 36 if not flip else 44, c) + (f'<g fill="{c["gold"]}" stroke="{c["line"]}" stroke-width="0.8">'
             + "".join(f'<circle cx="{x}" cy="{(20 if not flip else 60)}" r="1.4"/>' for x in (27, 53)) + '</g>')
    return svg(80, 80, (flip_v(80, stone) if flip else stone) + emblem)

# ---- Cross column: big lilac-pink stone cross, heart at the crossing, hanging wreath
CR = dict(fill="#E4D2EA", hi="#F3EAF6", shade="#CDB5D8", line="#6E5578", groove="#B39CC2")
def cross_body():
    c = CR
    return svg(80, 64, f'''<rect x="18" y="0" width="44" height="64" fill="{c["fill"]}"/>
<rect x="50" y="0" width="12" height="64" fill="{c["shade"]}" opacity="0.75"/>
<rect x="22" y="0" width="4" height="64" fill="{c["hi"]}"/>
<path d="M34,10 l2,5 l-3,3 M44,44 l-2,4 l2,4" stroke="{c["groove"]}" stroke-width="1.3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
<g fill="{c["groove"]}" opacity="0.6"><circle cx="30" cy="34" r="1.1"/><circle cx="47" cy="22" r="1"/><circle cx="38" cy="58" r="1.2"/></g>
<path d="M18,-1 V65 M62,-1 V65" stroke="{c["line"]}" stroke-width="{LW}"/>''')
def cross_cap(flip):
    c = CR
    shape = ("M18,82 V44 H9 Q4,44 4,39 V25 Q4,20 9,20 H18 V10 Q18,4 24,4 H56 Q62,4 62,10 V20 H71 Q76,20 76,25 V39 Q76,44 71,44 H62 V82")
    body = (f'<path d="{shape} Z" fill="{c["fill"]}"/>'
            f'<path d="M50,82 V44 H62 V82 Z M50,10 Q50,7 54,7 H58 Q60,8 61,10 V40 H50 Z" fill="{c["shade"]}" opacity="0.75"/>'
            f'<path d="M64,40 H74 V26 Q74,23 71,23 H64 Z" fill="{c["shade"]}" opacity="0.75"/>'
            f'<path d="M22,82 V12 Q22,8 25,8 V82 Z" fill="{c["hi"]}"/><path d="M8,24 H17" stroke="{c["hi"]}" stroke-width="2.4" stroke-linecap="round"/>'
            f'<path d="{shape}" fill="none" stroke="{c["line"]}" stroke-width="{LW}" stroke-linejoin="round"/>'
            # wreath ring hanging across the crossing
            f'<circle cx="40" cy="32" r="11" fill="none" stroke="#A6DDBF" stroke-width="4"/>'
            f'<circle cx="40" cy="32" r="11" fill="none" stroke="#5E8A73" stroke-width="0.9" stroke-dasharray="3 2.6"/>'
            + flower(31, 26, 2.3, "#FFB6CC") + flower(49, 27, 2.3, "#FFCFA8") + flower(33, 40.5, 2.1, "#E3D4FF") + flower(48, 39.5, 2.1, "#FFB6CC"))
    def heart(dy):
        return (f'<g transform="translate(0,{dy})"><path d="M40,36.5 C32,31 33,25 37,25 C38.6,25 40,26.4 40,27.8 C40,26.4 41.4,25 43,25 C47,25 48,31 40,36.5 Z" fill="#FFB3CB" stroke="{c["line"]}" stroke-width="1.3"/>'
                f'<ellipse cx="37.2" cy="27.6" rx="1.3" ry="0.9" fill="#FFF"/></g>')
    if flip:
        return svg(80, 80, flip_v(80, body) + heart(17))
    return svg(80, 80, body + heart(0))


# ---- Space moon-rock pillar: periwinkle rock, craters, pink crystal sprouts
MR = dict(fill="#CBC9EF", hi="#E3E2FA", shade="#ABA8DE", line="#55548C", crater="#B3B0E2", crim="#EEEDFF")
def crater(x, y, r):
    c = MR
    return (f'<ellipse cx="{x}" cy="{y}" rx="{r}" ry="{r*0.8:.2f}" fill="{c["crater"]}" stroke="{c["line"]}" stroke-width="1" opacity="0.95"/>'
            f'<path d="M{x-r*0.8:.1f},{y+r*0.2:.1f} Q{x},{y+r*1.05:.1f} {x+r*0.8:.1f},{y+r*0.2:.1f}" stroke="{c["crim"]}" stroke-width="1.2" fill="none" stroke-linecap="round"/>')
def moon_body():
    c = MR
    return svg(80, 64, f'''<rect x="4" y="0" width="72" height="64" fill="{c["fill"]}"/>
<rect x="62" y="0" width="14" height="64" fill="{c["shade"]}" opacity="0.75"/>
<rect x="9" y="0" width="5" height="64" fill="{c["hi"]}"/>
{crater(26, 14, 6)}{crater(52, 36, 8)}{crater(22, 50, 4)}{crater(60, 8, 3)}
<g fill="#FFF" opacity="0.8"><circle cx="40" cy="22" r="0.9"/><circle cx="16" cy="32" r="0.8"/><circle cx="44" cy="56" r="1"/></g>
<path d="M4,-1 V65 M76,-1 V65" stroke="{c["line"]}" stroke-width="{LW}"/>''')
def crystal(x, y, h, col="#FFC2DD", line="#7A4E7A"):
    w = h * 0.38
    return (f'<path d="M{x-w},{y} L{x-w*0.8},{y-h*0.7} L{x},{y-h} L{x+w*0.8},{y-h*0.7} L{x+w},{y} Z" fill="{col}" stroke="{line}" stroke-width="1.2" stroke-linejoin="round"/>'
            f'<path d="M{x-w*0.3:.1f},{y-h*0.7:.1f} L{x},{y-h*0.9:.1f}" stroke="#FFF" stroke-width="1.1" stroke-linecap="round"/>')
def moon_cap(flip):
    c = MR
    shape = "M4,82 V36 C4,27 10,22 17,22 C19,13 27,9 35,11 C41,5 54,6 59,14 C69,14 76,21 76,31 V82"
    rock = (f'<path d="{shape} Z" fill="{c["fill"]}"/>'
            f'<path d="M62,82 V30 C66,24 70,22 72,23 C75,26 76,28 76,31 V82 Z" fill="{c["shade"]}" opacity="0.75"/>'
            f'<path d="M9,82 V36 C9,31 11,28 14,27 V82 Z" fill="{c["hi"]}"/>'
            f'{crater(30, 30, 6.5)}{crater(56, 52, 7)}{crater(22, 62, 4)}{crater(52, 24, 3)}'
            f'<path d="{shape}" fill="none" stroke="{c["line"]}" stroke-width="{LW}" stroke-linejoin="round"/>'
            f'<path d="M38,13 C44,10 51,11 55,15" stroke="#FFF" stroke-width="1.8" fill="none" stroke-linecap="round" opacity="0.7"/>'
            + crystal(64, 18, 12) + crystal(70.5, 21, 8, "#C9F0DA", "#4F7A6C") + crystal(22, 24, 7, "#E3D4FF", "#6A5A9A"))
    star = sparkle(12, 10, 4, "#FFF4B8", "#D9953A") if not flip else sparkle(12, 70, 4, "#FFF4B8", "#D9953A")
    return svg(80, 80, (flip_v(80, rock) if flip else rock) + star)

# =========================== HAZARDS ===========================
# ---- Bat (48x48), body r~14.5, hit r12 @ (24,25). Frames: up, mid, down
BAT = dict(body="#BBA7E6", body2="#9C86D2", wing="#CDBDF2", line="#54427A")
def bat_svg(frame, sc=1.0):
    c = BAT
    ang = {"0": -32, "1": 0, "2": 30}[frame]
    wing = "M0,-4 C6,-11 15,-13 21,-8 Q19.5,-3.5 21,1.5 Q16,-0.5 13.5,4 Q10.5,0.5 6.5,4 Q4,1 0,3.5 Z"
    g = [f'<defs><radialGradient id="bb" cx="0.38" cy="0.3" r="0.8"><stop offset="0.3" stop-color="{c["body"]}"/><stop offset="1" stop-color="{c["body2"]}"/></radialGradient></defs>']
    g.append(f'<g transform="translate(24,25) scale({sc}) translate(-24,-25)">')
    for side, x in ((1, 36.5), (-1, 11.5)):
        g.append(f'<g transform="translate({x},24) scale({side},1) rotate({ang})"><path d="{wing}" fill="{c["wing"]}" stroke="{c["line"]}" stroke-width="1.8" stroke-linejoin="round"/>'
                 f'<path d="M3,-2 Q10,-8 18,-7" stroke="#E7DEFF" stroke-width="1.2" fill="none" stroke-linecap="round"/></g>')
    g.append(f'<path d="M14.5,17 L13.5,7.5 Q14,6 15.5,7 L20.5,11.5 Z M33.5,17 L34.5,7.5 Q34,6 32.5,7 L27.5,11.5 Z" fill="{c["body2"]}" stroke="{c["line"]}" stroke-width="1.8" stroke-linejoin="round"/>')
    g.append(f'<circle cx="24" cy="25" r="14.5" fill="url(#bb)" stroke="{c["line"]}" stroke-width="2"/>')
    g.append(f'<ellipse cx="19" cy="17.5" rx="3.6" ry="2" fill="#FFF" opacity="0.75" transform="rotate(-30 19 17.5)"/>')
    g.append(f'<ellipse cx="24" cy="31" rx="7.5" ry="5" fill="#D8CBF5" opacity="0.7"/>')
    g.append(eyes(19, 29, 24, 3.4, 4, "#3E2C5C", "#6A4E9A", "be"))
    g.append(blush(15.2, 32.8, 29, 2.6, 1.5))
    g.append(f'<path d="M21.6,29.2 Q24,31.4 26.4,29.2" fill="none" stroke="{c["line"]}" stroke-width="1.3" stroke-linecap="round"/>'
             f'<path d="M22.6,30.2 L23.3,32.4 L24,30.6 Z" fill="#FFF" stroke="{c["line"]}" stroke-width="0.6" stroke-linejoin="round"/>')
    g.append('</g>')
    return svg(48, 48, "".join(g))

# ---- Pumpkin (40x40), body ~r16-17, hit r14 @ (20,23); bottom of art rests at y=38
PK = dict(fill="#FFC9A0", fill2="#FFAE84", lobe="#EE9A70", line="#8A5068", stem="#9ED8B4", stemline="#4F8A6C")
def pumpkin_svg(frame="0"):
    c = PK
    g = [f'<defs><radialGradient id="pg" cx="0.4" cy="0.35" r="0.75"><stop offset="0.3" stop-color="{c["fill"]}"/><stop offset="1" stop-color="{c["fill2"]}"/></radialGradient></defs>']
    g.append(f'<path d="M19,10 Q18,5 20.5,2.5 Q22.5,2 23,3.5 Q21.5,6 22,10 Z" fill="{c["stem"]}" stroke="{c["stemline"]}" stroke-width="1.4" stroke-linejoin="round"/>'
             f'<path d="M22.5,5 Q27,1 31,4.5 Q27,7.5 22.5,5 Z" fill="#B9E8C9" stroke="{c["stemline"]}" stroke-width="1.1"/>')
    body = "M20,8.5 C26,7 31,7 34.5,10.5 C39,14.5 39,30 35,34.5 C31.5,38.6 25.5,38.4 20,37.6 C14.5,38.4 8.5,38.6 5,34.5 C1,30 1,14.5 5.5,10.5 C9,7 14,7 20,8.5 Z"
    g.append(f'<path d="{body}" fill="url(#pg)" stroke="{c["line"]}" stroke-width="2" stroke-linejoin="round"/>')
    g.append(f'<path d="M13,8.4 C8.5,14 8.5,32 13,37.8 M27,8.4 C31.5,14 31.5,32 27,37.8" stroke="{c["lobe"]}" stroke-width="1.5" fill="none" stroke-linecap="round"/>')
    g.append(f'<ellipse cx="11" cy="14.5" rx="3" ry="1.8" fill="#FFF" opacity="0.75" transform="rotate(-35 11 14.5)"/>')
    # cute jack face: rounded triangle eyes with highlights, smile with one tooth
    for x in (14, 26):
        g.append(f'<path d="M{x-3.4},{24.5} Q{x},{16.5} {x+3.4},{24.5} Q{x},{26} {x-3.4},{24.5} Z" fill="#6A3C55"/>'
                 f'<circle cx="{x-0.8}" cy="21.8" r="1.1" fill="#FFF"/>')
    if frame == "0":
        g.append(f'<path d="M15.5,28.6 Q20,32.8 24.5,28.6" fill="none" stroke="#6A3C55" stroke-width="1.6" stroke-linecap="round"/>'
                 f'<path d="M18.6,30.4 L19.4,32.2 L20.4,30.6 Z" fill="#FFF8E6" stroke="#6A3C55" stroke-width="0.6"/>')
    g.append(blush(9.5, 30.5, 28.5, 2.6, 1.5, "#FF9EAE"))
    return svg(40, 40, "".join(g))

# ---- Floating skull (40x40), cranium r~15.5, hit r13 @ (20,19). 2 frames: glow pulse + bob
SK = dict(bone="#FFF6EE", bone2="#EBDDF2", line="#6B4E7A", socket="#5B4470")
def skull_svg(frame):
    c = SK
    dy = 0 if frame == "0" else -1
    glow_op = 0.45 if frame == "0" else 0.7
    g = [f'<defs><radialGradient id="sg" cx="0.4" cy="0.35" r="0.75"><stop offset="0.4" stop-color="{c["bone"]}"/><stop offset="1" stop-color="{c["bone2"]}"/></radialGradient>'
         f'<radialGradient id="sw"><stop offset="0.3" stop-color="#C9F0E6" stop-opacity="{glow_op}"/><stop offset="1" stop-color="#C9F0E6" stop-opacity="0"/></radialGradient></defs>']
    g.append(f'<ellipse cx="20" cy="35" rx="12" ry="4.5" fill="url(#sw)"/>')
    g.append(f'<g transform="translate(0,{dy})">')
    head = "M20,3.5 C29.5,3.5 35.5,10 35.5,18 C35.5,23.5 32.5,26.5 29.5,28 V32 Q29.5,34 27.5,34 H12.5 Q10.5,34 10.5,32 V28 C7.5,26.5 4.5,23.5 4.5,18 C4.5,10 10.5,3.5 20,3.5 Z"
    g.append(f'<path d="{head}" fill="url(#sg)" stroke="{c["line"]}" stroke-width="2" stroke-linejoin="round"/>')
    g.append(f'<ellipse cx="13.5" cy="9.5" rx="3.6" ry="2" fill="#FFF" transform="rotate(-30 13.5 9.5)"/>')
    for x in (14, 26):
        g.append(f'<ellipse cx="{x}" cy="18.5" rx="4.4" ry="4.8" fill="{c["socket"]}"/>'
                 f'<ellipse cx="{x-1.3}" cy="16.8" rx="1.8" ry="1.9" fill="#FFF"/><circle cx="{x+1.5}" cy="20.6" r="0.9" fill="#FFF"/>')
    g.append(f'<path d="M20,22.6 L18.6,25 Q20,25.8 21.4,25 Z" fill="{c["socket"]}" stroke="{c["socket"]}" stroke-width="0.8" stroke-linejoin="round"/>')
    g.append(blush(8.8, 31.2, 24.2, 2.4, 1.4))
    g.append(f'<path d="M14.5,28 V31.5 M18.2,28 V32 M21.8,28 V32 M25.5,28 V31.5" stroke="{c["line"]}" stroke-width="1.1" stroke-linecap="round" opacity="0.6"/>')
    g.append(f'<path d="M12,28 H28" stroke="{c["line"]}" stroke-width="1.1" stroke-linecap="round" opacity="0.6"/>')
    # tiny pink bow
    g.append(f'<g transform="translate(29.5,7) rotate(20)"><path d="M0,0 L-5,-3.2 Q-6,0 -5,3.2 Z M0,0 L5,-3.2 Q6,0 5,3.2 Z" fill="#FFB6CC" stroke="{c["line"]}" stroke-width="1" stroke-linejoin="round"/><circle r="1.6" fill="#FF9EBB" stroke="{c["line"]}" stroke-width="0.9"/></g>')
    g.append('</g>')
    return svg(40, 40, "".join(g))

# =========================== PICKUPS ===========================
def ghost_inner(kind, frame):
    s = ghost_svg(kind, frame)
    return s[s.index(">") + 1: s.rindex("</svg>")]
PU_SP = {"0": [(8, 12, 4, 1), (48, 16, 3, .85), (47, 46, 2.6, .9), (9, 44, 2.2, .7)],
         "1": [(9, 13, 2.8, .8), (47.5, 14, 4, 1), (8, 45, 3, .95), (48, 45, 2, .7)],
         "2": [(7.5, 14, 3.4, .9), (49, 15, 2.4, .75), (46, 47, 3.4, 1), (10, 46, 2.6, .85)]}
def pickup_ghost(frame):
    dy = {"0": 0, "1": -1.5, "2": -0.6}[frame]
    g = ['<defs><radialGradient id="tk"><stop offset="0.55" stop-color="#FFF1BF" stop-opacity="0.75"/><stop offset="0.85" stop-color="#FFE08A" stop-opacity="0.35"/><stop offset="1" stop-color="#FFE08A" stop-opacity="0"/></radialGradient></defs>',
         '<circle cx="28" cy="28" r="27" fill="url(#tk)"/>',
         f'<circle cx="28" cy="28" r="22.5" fill="none" stroke="#FFE7A3" stroke-width="1.6" stroke-dasharray="1.5 3.2" stroke-linecap="round" opacity="0.95"/>',
         f'<g transform="translate(28,{28+dy}) scale(0.84) translate(-32,-33)">{ghost_inner("golden", "idle-1")}</g>']
    for (x, y, r, op) in PU_SP[frame]:
        g.append(sparkle(x, y, r, "#FFFBE0", "#E2A23E", op))
    # tiny "+" heart glint
    g.append(f'<path d="M44,6.5 v5 M41.5,9 h5" stroke="#FFF7C8" stroke-width="1.8" stroke-linecap="round"/>')
    return svg(56, 56, "".join(g))

def sweet_wrapped():
    g = ['<defs><clipPath id="wc"><ellipse cx="16" cy="16" rx="11.5" ry="11"/></clipPath></defs>',
         '<path d="M5.5,16 L0.8,9 Q0,16 0.8,23 Z M26.5,16 L31.2,9 Q32,16 31.2,23 Z" fill="#FFD6E4" stroke="#8A5068" stroke-width="1.4" stroke-linejoin="round"/>',
         '<ellipse cx="16" cy="16" rx="11.5" ry="11" fill="#FFB6CC"/>',
         '<g clip-path="url(#wc)" stroke="#FFF4F7" stroke-width="3.2"><path d="M4,8 L14,28 M12,4 L24,28 M20,3 L32,26"/></g>',
         '<ellipse cx="16" cy="16" rx="11.5" ry="11" fill="none" stroke="#8A5068" stroke-width="1.8"/>',
         '<ellipse cx="11.5" cy="10" rx="3" ry="1.6" fill="#FFF" opacity="0.85" transform="rotate(-30 11.5 10)"/>',
         happy_eyes(12.5, 19.5, 16.5, 2.2, "#5A3550"), blush(9.5, 22.5, 19.5, 1.9, 1.1, "#FF8FAE"),
         '<path d="M14.8,20 Q16,21.2 17.2,20" fill="none" stroke="#5A3550" stroke-width="1.1" stroke-linecap="round"/>']
    return svg(32, 32, "".join(g))
def sweet_lollipop():
    g = ['<rect x="14.8" y="22" width="2.4" height="9" rx="1.2" fill="#FFF8EE" stroke="#8A5068" stroke-width="1.1"/>',
         '<circle cx="16" cy="13" r="11.5" fill="#BFEBD6" stroke="#4F7A6C" stroke-width="1.8"/>',
         '<path d="M16,13 m0,-1.5 a1.5,1.5 0 1,1 -1.5,1.5 a3.5,3.5 0 1,1 3.5,3.5 a5.5,5.5 0 1,1 -5.5,-5.5 a7.5,7.5 0 1,1 7.5,7.5 a9.2,9.2 0 0,1 -9.2,-9.2" fill="none" stroke="#FFB6CC" stroke-width="2.4" stroke-linecap="round"/>',
         '<ellipse cx="10.5" cy="7" rx="3" ry="1.6" fill="#FFF" opacity="0.85" transform="rotate(-35 10.5 7)"/>',
         '<path d="M17,27 q3,-3 5,0 q-2.5,2 -5,0 Z M15,27 q-3,-3 -5,0 q2.5,2 5,0 Z" fill="#E3D4FF" stroke="#6A5A9A" stroke-width="0.9"/>']
    return svg(32, 32, "".join(g))
def sweet_macaron():
    g = ['<path d="M4.5,13 Q4.5,5 16,5 Q27.5,5 27.5,13 Z" fill="#E3D4FF" stroke="#6A5A9A" stroke-width="1.6" stroke-linejoin="round"/>',
         '<path d="M4.5,19 Q4.5,27.5 16,27.5 Q27.5,27.5 27.5,19 Z" fill="#E3D4FF" stroke="#6A5A9A" stroke-width="1.6" stroke-linejoin="round"/>',
         '<path d="M4,13 Q16,11.5 28,13 V19 Q16,20.5 4,19 Z" fill="#FFF3E0" stroke="#6A5A9A" stroke-width="1.4" stroke-linejoin="round"/>',
         '<path d="M6,13 q1.5,1.6 3,0 q1.5,1.6 3,0 q1.5,1.6 3,0 q1.5,1.6 3,0 q1.5,1.6 3,0 q1.5,1.6 3,0" fill="none" stroke="#C9B6E8" stroke-width="1"/>',
         '<ellipse cx="11" cy="8" rx="3" ry="1.3" fill="#FFF" opacity="0.85"/>',
         happy_eyes(12.5, 19.5, 23, 2, "#4A3358", 1.4), blush(9.5, 22.5, 24.5, 1.8, 1.0, "#FFB3CB")]
    return svg(32, 32, "".join(g))

# =========================== BIRDS (pigeon event + ambient church birds) ===========================
def bird_svg(frame, size, body, body2, wingc, line, neck=None, perched=False):
    # facing LEFT. Designed in a 40x40 box, scaled to `size`
    sc = size / 40
    g = [f'<defs><radialGradient id="pb" cx="0.4" cy="0.35" r="0.8"><stop offset="0.35" stop-color="{body}"/><stop offset="1" stop-color="{body2}"/></radialGradient></defs>',
         f'<g transform="scale({sc})">']
    if perched:
        g.append(f'<path d="M17,33 v4 l-2,1.5 M23,33 v4 l2,1.5 M23,37 l-1.5,1.6" stroke="#E7A07A" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>')
    tail = "M30,24 L38.5,20.5 Q39.5,24 38,27.5 Z"
    g.append(f'<path d="{tail}" fill="{wingc}" stroke="{line}" stroke-width="1.6" stroke-linejoin="round"/>')
    ang = {"perch": 0, "0": -62, "1": -18, "2": 28}[frame]
    back_wing = f'<g transform="translate(21,18) rotate({ang*0.85-12}) scale(0.8)"><path d="M0,0 C4,-6 13,-7 18,-3 Q16,0 17,2.5 Q13,1.5 12,4 Q8,2.5 5,4.5 Q2,3.5 0,0 Z" fill="{body2}" stroke="{line}" stroke-width="1.5" stroke-linejoin="round" opacity="0.95"/></g>'
    if not perched: g.append(back_wing)
    g.append(f'<ellipse cx="20" cy="22" rx="13" ry="12" fill="url(#pb)" stroke="{line}" stroke-width="1.9"/>')
    if neck: g.append(f'<path d="M10.5,26 Q14,30.5 20,30.5" stroke="{neck}" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.9"/>')
    g.append(f'<ellipse cx="15" cy="15" rx="3.6" ry="1.9" fill="#FFF" opacity="0.7" transform="rotate(-30 15 15)"/>')
    g.append(f'<path d="M7.6,20 L3,22.2 L7.8,23.8 Z" fill="#FFCFA8" stroke="{line}" stroke-width="1.2" stroke-linejoin="round"/>')
    g.append(f'<ellipse cx="13" cy="19.5" rx="2.4" ry="2.8" fill="#3E2C5C"/><circle cx="12.3" cy="18.6" r="0.95" fill="#FFF"/><circle cx="13.8" cy="20.7" r="0.45" fill="#FFF"/>')
    g.append(f'<ellipse cx="13" cy="24.6" rx="2.3" ry="1.3" fill="#FFB3CB" opacity="0.85"/>')
    if perched:
        g.append(f'<path d="M19,22 C24,18 31,20 32,26 Q26,30 20,28 Z" fill="{wingc}" stroke="{line}" stroke-width="1.5" stroke-linejoin="round"/>')
    else:
        g.append(f'<g transform="translate(19,19) rotate({ang}) scale(0.8)"><path d="M0,0 C4,-7 15,-9 22,-4 Q19.5,-1 21,2.5 Q16.5,1 15.5,4.5 Q12,2 10,5.5 Q6,3 3,5.5 Q0,4 0,0 Z" fill="{wingc}" stroke="{line}" stroke-width="1.6" stroke-linejoin="round"/></g>')
    g.append('</g>')
    return svg(size, size, "".join(g))

# =========================== EVENTS ===========================
def wheel(cx, cy, r, frame, tyre="#5A4677", hub="#D9CFF0", line="#3E2C5C"):
    a0 = 0 if frame == "0" else 45
    spokes = "".join(f'<path d="M{cx},{cy} L{cx + math.cos(math.radians(a0+k*90))*r*0.62:.2f},{cy + math.sin(math.radians(a0+k*90))*r*0.62:.2f}" stroke="{line}" stroke-width="1.4" stroke-linecap="round"/>' for k in range(4))
    return (f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{tyre}" stroke="{line}" stroke-width="1.8"/>'
            f'<circle cx="{cx}" cy="{cy}" r="{r*0.66:.2f}" fill="{hub}" stroke="{line}" stroke-width="1.2"/>' + spokes +
            f'<circle cx="{cx}" cy="{cy}" r="{r*0.2:.2f}" fill="#FFE08A" stroke="{line}" stroke-width="1"/>'
            f'<path d="M{cx-r*0.55:.1f},{cy-r*0.55:.1f} A{r*0.78:.1f},{r*0.78:.1f} 0 0,1 {cx+r*0.1:.1f},{cy-r*0.78:.1f}" stroke="#8F7FB5" stroke-width="1.3" fill="none" stroke-linecap="round"/>')

def mini_ghost(x, y, s=1.0, col="#FFFFFF", line="#6B4E7A"):
    return (f'<g transform="translate({x},{y}) scale({s})"><path d="M-7,8 V0 C-7,-5 -4,-8 0,-8 C4,-8 7,-5 7,0 V8 L4.5,6 L2.3,8 L0,6 L-2.3,8 L-4.5,6 Z" fill="{col}" stroke="{line}" stroke-width="1.3" stroke-linejoin="round"/>'
            f'<ellipse cx="-2.6" cy="-0.6" rx="1.2" ry="1.5" fill="#4A3358"/><ellipse cx="2.6" cy="-0.6" rx="1.2" ry="1.5" fill="#4A3358"/>'
            f'<circle cx="-3" cy="-1.2" r="0.45" fill="#FFF"/><circle cx="2.2" cy="-1.2" r="0.45" fill="#FFF"/>'
            f'<ellipse cx="-4.4" cy="2.2" rx="1.3" ry="0.8" fill="#FFB3CB"/><ellipse cx="4.4" cy="2.2" rx="1.3" ry="0.8" fill="#FFB3CB"/></g>')

HE = dict(body="#BBA9DE", body2="#9F8BCB", hi="#D8CCF0", line="#4E3D6E", glass="#E6F2FF", trim="#F2E6FF")
def hearse(frame):
    c = HE
    body = "M10,56 Q5,56 5,51 V45 Q5,35 15,33.5 L38,31 Q44,13 56,10 Q60,8.5 66,8.5 H146 Q156,8.5 156,18.5 V51 Q156,56 151,56 Z"
    g = [f'<defs><linearGradient id="hg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{c["hi"]}"/><stop offset="0.45" stop-color="{c["body"]}"/><stop offset="1" stop-color="{c["body2"]}"/></linearGradient></defs>']
    g.append(f'<ellipse cx="80" cy="62" rx="74" ry="2.6" fill="#2A2040" opacity="0.25"/>')
    g.append(f'<path d="{body}" fill="url(#hg)" stroke="{c["line"]}" stroke-width="2.2" stroke-linejoin="round"/>')
    # windscreen with a tiny ghost driver
    g.append(f'<path d="M42,30 L52,15 Q54,13 57,13 H62 V30 Z" fill="{c["glass"]}" stroke="{c["line"]}" stroke-width="1.6" stroke-linejoin="round"/>')
    g.append(mini_ghost(55, 23, 0.9))
    g.append(f'<path d="M46,27 L53,17" stroke="#FFF" stroke-width="1.6" stroke-linecap="round" opacity="0.8"/>')
    # side windows with lace curtains
    for (x0, x1) in ((66, 98), (102, 148)):
        g.append(f'<rect x="{x0}" y="13" width="{x1-x0}" height="17" rx="5" fill="#F7EFFF" stroke="{c["line"]}" stroke-width="1.6"/>')
        sc = "".join(f'q{2},{3.4} {4},0 ' for _ in range(int((x1 - x0 - 2) / 4)))
        g.append(f'<path d="M{x0+1},20 {sc}" fill="none" stroke="#C9B6E8" stroke-width="1.3"/>')
        g.append(f'<path d="M{x0+1},14.5 H{x1-1} V19 Q{(x0+x1)/2},25 {x0+1},19 Z" fill="#FFFFFF" opacity="0.6"/>')
    g.append(mini_ghost(122, 23, 0.75, "#FFF7D6", "#8E5A3C"))  # a golden passenger peeks out
    # trim + door line + wreath
    g.append(f'<path d="M8,38 H155" stroke="{c["trim"]}" stroke-width="2" opacity="0.9"/>'
             f'<path d="M64,33 V54 M100,33 V54" stroke="{c["line"]}" stroke-width="1.2" opacity="0.5"/>')
    g.append(f'<circle cx="118" cy="44" r="6" fill="none" stroke="#A6DDBF" stroke-width="3"/>' + flower(113, 41, 1.8, "#FFB6CC") + flower(123, 47, 1.8, "#FFCFA8") + flower(122, 39.5, 1.5, "#E3D4FF"))
    g.append(f'<path d="M86,44 h5" stroke="{c["line"]}" stroke-width="2" stroke-linecap="round"/><path d="M70,44 h5" stroke="{c["line"]}" stroke-width="2" stroke-linecap="round"/>')
    # roof: little bat ornament + roof rail
    g.append(f'<path d="M70,8.5 V6.5 H140 V8.5" fill="none" stroke="{c["line"]}" stroke-width="1.4"/>')
    g.append(f'<g transform="translate(106,4.2) scale(0.55)"><path d="M-5,0 Q-13,-7 -17,0 Q-13,1 -12,4 Q-9,2 -7,5 Z M5,0 Q13,-7 17,0 Q13,1 12,4 Q9,2 7,5 Z" fill="#C9B6E8" stroke="{c["line"]}" stroke-width="1.6"/><circle r="5" fill="#C9B6E8" stroke="{c["line"]}" stroke-width="1.6"/></g>')
    # lights + bumper
    g.append(f'<ellipse cx="8.5" cy="42.5" rx="3.2" ry="3.8" fill="#FFF0A8" stroke="{c["line"]}" stroke-width="1.3"/>'
             f'<rect x="152" y="40" width="5" height="7" rx="2" fill="#FFB6CC" stroke="{c["line"]}" stroke-width="1.2"/>'
             f'<rect x="3" y="49" width="14" height="5" rx="2.5" fill="#E6E0F4" stroke="{c["line"]}" stroke-width="1.2"/>')
    # wheel arches + wheels (bottom of tyres at y=64 = ground line)
    for wx in (34, 126):
        g.append(f'<path d="M{wx-13},56 A13,13 0 0,1 {wx+13},56 Z" fill="#6E5A92" stroke="{c["line"]}" stroke-width="1.6"/>')
        g.append(wheel(wx, 54, 10, frame))
    return svg(160, 64, "".join(g))

BUS = dict(body="#A8DCD9", body2="#86C5C6", hi="#D2F0EE", line="#3F5C6E", win="#FFEBB0", trim="#FFC9DA")
def nightbus(frame):
    c = BUS
    g = [f'<defs><linearGradient id="ng" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{c["hi"]}"/><stop offset="0.4" stop-color="{c["body"]}"/><stop offset="1" stop-color="{c["body2"]}"/></linearGradient></defs>']
    g.append(f'<ellipse cx="96" cy="70" rx="90" ry="2.4" fill="#1E2A3A" opacity="0.25"/>')
    body = "M10,62 Q6,62 6,58 V20 Q6,4 22,4 H176 Q188,4 188,16 V58 Q188,62 184,62 Z"
    g.append(f'<path d="{body}" fill="url(#ng)" stroke="{c["line"]}" stroke-width="2.2" stroke-linejoin="round"/>')
    # destination sign with moon + stars
    g.append(f'<rect x="20" y="7" width="40" height="9" rx="3" fill="#3F4B78" stroke="{c["line"]}" stroke-width="1.2"/>'
             f'<path d="M27,9 a3.4,3.4 0 1,0 3.4,5.4 a2.8,2.8 0 1,1 -3.4,-5.4 Z" fill="#FFE9A8"/>'
             + sparkle(40, 11.5, 2.2, "#FFE9A8", "#FFE9A8", 1, 0.4) + sparkle(48, 11.5, 1.8, "#FFE9A8", "#FFE9A8", 1, 0.4) + sparkle(55, 11.5, 2.2, "#FFE9A8", "#FFE9A8", 1, 0.4))
    # windscreen
    g.append(f'<path d="M9,20 Q9,18 12,18 H32 V44 H9 Z" fill="#E6F2FF" stroke="{c["line"]}" stroke-width="1.6" stroke-linejoin="round"/>'
             f'<path d="M13,38 L24,21" stroke="#FFF" stroke-width="2" stroke-linecap="round" opacity="0.8"/>')
    g.append(mini_ghost(22, 34, 0.85))
    # passenger windows (lit) with passengers
    pas = [("ghost", "#FFFFFF"), (None, None), ("cat", None), ("ghost", "#FFF7D6"), (None, None)]
    for i in range(5):
        x = 40 + i * 29
        g.append(f'<rect x="{x}" y="18" width="24" height="20" rx="5" fill="{c["win"]}" stroke="{c["line"]}" stroke-width="1.6"/>')
        g.append(f'<path d="M{x+3},21 h8" stroke="#FFF" stroke-width="1.6" stroke-linecap="round" opacity="0.8"/>')
        kind, col = pas[i]
        if kind == "ghost": g.append(mini_ghost(x + 12, 31, 0.8, col))
        if kind == "cat":
            g.append(f'<g transform="translate({x+12},31)"><path d="M-6,7 V-1 L-6,-7 L-2.5,-3.5 H2.5 L6,-7 V7 Z" fill="#6E5A92" stroke="{c["line"]}" stroke-width="1"/>'
                     f'<ellipse cx="-2.4" cy="0" rx="1.2" ry="1.4" fill="#FFE08A"/><ellipse cx="2.4" cy="0" rx="1.2" ry="1.4" fill="#FFE08A"/></g>')
    # door
    g.append(f'<rect x="170" y="18" width="13" height="40" rx="3" fill="#E6F2FF" stroke="{c["line"]}" stroke-width="1.5"/><path d="M176.5,19 V57" stroke="{c["line"]}" stroke-width="1"/>')
    g.append(f'<path d="M7,47 H187" stroke="{c["trim"]}" stroke-width="3.2"/><path d="M7,50.5 H187" stroke="#FFFFFF" stroke-width="1" opacity="0.7"/>')
    g.append(f'<ellipse cx="11" cy="54" rx="3.4" ry="3" fill="#FFF0A8" stroke="{c["line"]}" stroke-width="1.2"/>'
             f'<rect x="185" y="40" width="4" height="8" rx="2" fill="#FFB6CC" stroke="{c["line"]}" stroke-width="1.1"/>'
             f'<rect x="4" y="56" width="16" height="5" rx="2.5" fill="#E6E0F4" stroke="{c["line"]}" stroke-width="1.2"/>')
    for wx in (42, 150):
        g.append(f'<path d="M{wx-14},62 A14,14 0 0,1 {wx+14},62 Z" fill="#4E6B7E" stroke="{c["line"]}" stroke-width="1.6"/>')
        g.append(wheel(wx, 61, 11, frame, tyre="#3F4B66", hub="#CFE6EA", line="#25324A"))
    return svg(192, 72, "".join(g))

def warning(frame):
    s = 1.0 if frame == "0" else 1.12
    op = 0.55 if frame == "0" else 0.85
    g = [f'<defs><radialGradient id="wg"><stop offset="0.5" stop-color="#FFC9DA" stop-opacity="{op}"/><stop offset="1" stop-color="#FFC9DA" stop-opacity="0"/></radialGradient></defs>',
         '<circle cx="20" cy="20" r="20" fill="url(#wg)"/>',
         f'<g transform="translate(20,20) scale({s}) translate(-20,-20)">',
         '<path d="M33,20 L38,20 L33.6,15.2 Z M33,20 L38,20 L33.6,24.8 Z" fill="#FFB6CC" stroke="#7A4E66" stroke-width="1.4" stroke-linejoin="round"/>',
         '<circle cx="19" cy="20" r="13.5" fill="#FFE3EC" stroke="#7A4E66" stroke-width="2.2"/>',
         '<path d="M19,12 V22.5" stroke="#E0607E" stroke-width="4.2" stroke-linecap="round"/>',
         '<circle cx="19" cy="27.6" r="2.4" fill="#E0607E"/>',
         '<ellipse cx="13.5" cy="13" rx="3" ry="1.6" fill="#FFF" transform="rotate(-35 13.5 13)"/>',
         '</g>']
    return svg(40, 40, "".join(g))

# =========================== AMBIENT ===========================
def fog(layer):
    W, H = 360, (120 if layer == "back" else 80)
    random.seed(11 if layer == "back" else 23)
    col = "#E9E2FA" if layer == "back" else "#F6F2FF"
    g = [f'<defs><radialGradient id="f"><stop offset="0" stop-color="{col}" stop-opacity="{0.55 if layer=="back" else 0.6}"/><stop offset="0.6" stop-color="{col}" stop-opacity="0.25"/><stop offset="1" stop-color="{col}" stop-opacity="0"/></radialGradient>'
         f'<linearGradient id="fb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{col}" stop-opacity="0"/><stop offset="1" stop-color="{col}" stop-opacity="{0.45 if layer=="back" else 0.35}"/></linearGradient></defs>',
         f'<rect x="0" y="{H*0.45}" width="{W}" height="{H*0.55}" fill="url(#fb)"/>']
    n = 14 if layer == "back" else 10
    for i in range(n):
        x = i * W / n + random.uniform(-8, 8)
        y = H * random.uniform(0.5, 0.82)
        rx, ry = random.uniform(40, 70), random.uniform(18, 30) * (H / 120)
        for dx in (-W, 0, W):
            if -rx < x + dx < W + rx:
                g.append(f'<ellipse cx="{x+dx:.1f}" cy="{y:.1f}" rx="{rx:.1f}" ry="{ry:.1f}" fill="url(#f)"/>')
    return svg(W, H, "".join(g))

def rain(frame):
    T = 128
    random.seed(5)
    drops = [(random.uniform(0, T), random.uniform(0, T), random.uniform(9, 15), random.uniform(0.35, 0.7)) for _ in range(26)]
    shift = frame * T / 3
    g = []
    for (x, y, L, op) in drops:
        y2 = (y + shift) % T; x2 = (x - shift * 0.25) % T
        for dx in (-T, 0, T):
            for dy in (-T, 0, T):
                X, Y = x2 + dx, y2 + dy
                if -20 < X < T + 20 and -20 < Y < T + 20:
                    g.append(f'<path d="M{X:.1f},{Y:.1f} l{-L*0.25:.1f},{L:.1f}" stroke="#D4E6FF" stroke-width="1.6" stroke-linecap="round" opacity="{op:.2f}"/>')
    return svg(T, T, "".join(g))

def star(frame):
    r, op, gl = {"0": (3.2, 0.75, 0.3), "1": (5.2, 1, 0.55), "2": (4, 0.9, 0.4)}[frame]
    return svg(16, 16, f'<defs><radialGradient id="sg"><stop offset="0" stop-color="#FFF6D6" stop-opacity="{gl}"/><stop offset="1" stop-color="#FFF6D6" stop-opacity="0"/></radialGradient></defs>'
               f'<circle cx="8" cy="8" r="8" fill="url(#sg)"/>' + sparkle(8, 8, r, "#FFF8DC", "#F2D48A", op, 0.6))

def starfield():
    T = 180; random.seed(3); g = []
    cols = ["#FFF6D6", "#E3D4FF", "#C9F0E6", "#FFD6E4"]
    for _ in range(38):
        x, y, r = random.uniform(0, T), random.uniform(0, T), random.choice([0.6, 0.8, 1, 1.3])
        g.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r}" fill="{random.choice(cols)}" opacity="{random.uniform(0.5, 0.95):.2f}"/>')
    for _ in range(4):
        g.append(sparkle(round(random.uniform(10, T-10), 1), round(random.uniform(10, T-10), 1), random.choice([2.2, 2.8]), "#FFF8DC", "#F2D48A", 0.9, 0.4))
    return svg(T, T, "".join(g))

def bike(variant):
    fr, acc = {"mint": ("#9ED8C0", "#FFB6CC"), "pink": ("#FFB6CC", "#C9B6E8")}[variant]
    line = "#5A4677"
    g = []
    for wx in (15, 57):
        g.append(f'<circle cx="{wx}" cy="34" r="11.5" fill="none" stroke="{line}" stroke-width="3"/>'
                 f'<circle cx="{wx}" cy="34" r="11.5" fill="none" stroke="#8F7FB5" stroke-width="1"/>'
                 + "".join(f'<path d="M{wx},34 L{wx+math.cos(math.radians(a))*10:.1f},{34+math.sin(math.radians(a))*10:.1f}" stroke="#CFC6E6" stroke-width="0.8"/>' for a in range(0, 360, 45)) +
                 f'<circle cx="{wx}" cy="34" r="1.8" fill="{acc}" stroke="{line}" stroke-width="0.8"/>')
    g.append(f'<g fill="none" stroke="{fr}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round">'
             f'<path d="M15,34 L33,35 L28,19 Z M28,19 L49,19 L33,35 M49,19 L57,34 M47,12 L50,22"/></g>')
    g.append(f'<g fill="none" stroke="{line}" stroke-width="0.9" opacity="0.5"><path d="M15,34 L33,35 L28,19 Z M28,19 L49,19 L33,35 M49,19 L57,34"/></g>')
    g.append(f'<path d="M22,15.5 Q27,13 33,15.5 Q28,18 22,15.5 Z" fill="#8F7FB5" stroke="{line}" stroke-width="1.2"/>'
             f'<path d="M43,11 Q47,9.5 52,11" stroke="{line}" stroke-width="2.2" fill="none" stroke-linecap="round"/>'
             f'<path d="M43,11 q-4,3 -3,7 M44,11.5 q-2,4 0,7" stroke="{acc}" stroke-width="1.3" fill="none" stroke-linecap="round"/>'
             f'<circle cx="52" cy="9" r="1.8" fill="#FFE08A" stroke="{line}" stroke-width="0.9"/>')
    # front basket with flowers
    g.append(f'<path d="M52,14 H66 L64,24 H54 Z" fill="#F3D9B8" stroke="{line}" stroke-width="1.4" stroke-linejoin="round"/>'
             f'<path d="M55,14.5 L56,23.5 M59,14.5 V23.5 M63,14.5 L62,23.5 M53,18.5 H65" stroke="#C9A982" stroke-width="0.9"/>'
             + flower(56, 12.5, 1.9, acc) + flower(62, 12, 1.9, "#FFCFA8") + leaf(58.5, 13, -70, "#A6DDBF", "#5E8A73"))
    g.append(f'<path d="M33,35 L29,45" stroke="{line}" stroke-width="1.6" stroke-linecap="round"/>')
    g.append(f'<circle cx="33" cy="35" r="3" fill="{fr}" stroke="{line}" stroke-width="1.2"/>')
    return svg(72, 48, "".join(g))

if __name__ == "__main__":
    put("obs-common-coffin-body", coffin_body()); put("obs-common-coffin-cap-top", coffin_cap(False)); put("obs-common-coffin-cap-bottom", coffin_cap(True))
    put("obs-common-cross-body", cross_body()); put("obs-common-cross-cap-top", cross_cap(False)); put("obs-common-cross-cap-bottom", cross_cap(True))
    put("obs-space-moonrock-body", moon_body()); put("obs-space-moonrock-cap-top", moon_cap(False)); put("obs-space-moonrock-cap-bottom", moon_cap(True))
    for f in "012": put(f"obs-common-bat-flap-{f}", bat_svg(f))
    put("obs-common-pumpkin", pumpkin_svg())
    for f in "01": put(f"obs-common-skull-{f}", skull_svg(f))
    for f in "012": put(f"pickup-golden-ghost-{f}", pickup_ghost(f))
    put("pickup-sweet-wrapped", sweet_wrapped()); put("pickup-sweet-lollipop", sweet_lollipop()); put("pickup-sweet-macaron", sweet_macaron())
    for f in "01": put(f"event-graveyard-hearse-{f}", hearse(f)); put(f"event-city-nightbus-{f}", nightbus(f)); put(f"ui-event-warning-{f}", warning(f))
    for f in "012": put(f"event-city-pigeon-flap-{f}", bird_svg(f, 40, "#DCD8EE", "#BDB6DC", "#C9C2E6", "#55507A", neck="#A6E3CF"))
    put("amb-church-bird-perch", bird_svg("perch", 24, "#9C8CC6", "#7D6DAE", "#8B7BBB", "#3E2C5C", perched=True))
    for f in "012": put(f"amb-church-bird-fly-{f}", bird_svg(f, 24, "#9C8CC6", "#7D6DAE", "#8B7BBB", "#3E2C5C"))
    put("amb-graveyard-fog-back", fog("back")); put("amb-graveyard-fog-front", fog("front"))
    for f in range(3): put(f"amb-city-rain-{f}", rain(f))
    for f in "012": put(f"amb-space-star-{f}", star(f))
    put("amb-space-starfield", starfield())
    put("amb-school-bike-mint", bike("mint")); put("amb-school-bike-pink", bike("pink"))
    for k, v in FILES.items(): open(os.path.join(OUT, k + ".svg"), "w").write(v)
    print(len(FILES), "files")
