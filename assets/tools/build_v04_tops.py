"""v0.4 TOP obstacles: things that really hang down / come from the sky.
Tiling body = the suspension (bough, thread, chain, vine, rope, string, cable, pole, arm, tether).
cap-bottom = the hanging object at the gap edge. No cap-top on purpose: these never stand on the ground."""
import math
from v04_common import *

# ================= GRAVEYARD: dead branch with a lantern =================
DB = dict(bark="#C9BBD3", bark2="#A996B8", hi="#E2D8EA", line="#5A4A6E", iron="#8F86B8", iron2="#6E6698", glass="#FFE9A8", glow="#FFF4C8")
def bough_strip(x0, x1, c, y0=0, y1=64):
    return (f'<rect x="{x0}" y="{y0}" width="{x1-x0}" height="{y1-y0}" fill="{c["bark"]}"/>'
            f'<rect x="{x1-7}" y="{y0}" width="7" height="{y1-y0}" fill="{c["bark2"]}" opacity="0.8"/>'
            f'<rect x="{x0+3}" y="{y0}" width="3" height="{y1-y0}" fill="{c["hi"]}"/>')
def lantern_body():
    c = DB
    d = tile3(f'<path d="M34,0 C38,14 30,22 36,34 C41,44 33,54 36,64 M44,0 C41,12 47,26 43,38 C40,48 46,56 44,64" stroke="{c["bark2"]}" stroke-width="1.4" fill="none"/>'
              f'<path d="M30,20 C24,18 20,14 17,9 M20,13 L15,13" stroke="{c["line"]}" stroke-width="3.6" fill="none" stroke-linecap="round"/>'
              f'<path d="M30,20 C24,18 20,14 17,9 M20,13 L15,13" stroke="{c["bark"]}" stroke-width="1.6" fill="none" stroke-linecap="round"/>'
              f'<path d="M50,46 C56,44 60,40 63,35 M60,40 L65,41" stroke="{c["line"]}" stroke-width="3.6" fill="none" stroke-linecap="round"/>'
              f'<path d="M50,46 C56,44 60,40 63,35 M60,40 L65,41" stroke="{c["bark"]}" stroke-width="1.6" fill="none" stroke-linecap="round"/>'
              f'<ellipse cx="41" cy="27" rx="2.6" ry="3.6" fill="{c["line"]}" opacity="0.7"/>')
    return svg(80, 64, bough_strip(29, 51, c) + d + f'<path d="M29,-1 V65 M51,-1 V65" stroke="{c["line"]}" stroke-width="{LW}"/>')
def lantern_cap():
    c = DB
    s = bough_strip(29, 51, c, -2, 8)
    s += f'<path d="M29,-2 V6 C29,13 35,15 40,15 C45,15 51,13 51,6 V-2" fill="{c["bark"]}" stroke="{c["line"]}" stroke-width="{LW}"/>'
    # bare twigs from the knob (decorative)
    for sx in (-1, 1):
        s += (f'<path d="M{40+sx*9},8 C{40+sx*18},7 {40+sx*24},3 {40+sx*29},0 M{40+sx*21},5 L{40+sx*27},8" stroke="{c["line"]}" stroke-width="3.4" fill="none" stroke-linecap="round"/>'
              f'<path d="M{40+sx*9},8 C{40+sx*18},7 {40+sx*24},3 {40+sx*29},0 M{40+sx*21},5 L{40+sx*27},8" stroke="{c["bark"]}" stroke-width="1.5" fill="none" stroke-linecap="round"/>')
    s += chain_v(40, 14, 24, "#D9D2F0", c["line"], 12)
    s += '<g transform="translate(40,23) scale(1.25) translate(-40,-33)">'
    # lantern
    s += (f'<defs><radialGradient id="lgl"><stop offset="0" stop-color="#FFE9A8" stop-opacity="0.55"/><stop offset="1" stop-color="#FFE9A8" stop-opacity="0"/></radialGradient></defs>'
          f'<circle cx="40" cy="56" r="24" fill="url(#lgl)"/>')
    s += (f'<path d="M23,44 L31,35 H49 L57,44 Z" fill="{c["iron"]}" stroke="{c["line"]}" stroke-width="2" stroke-linejoin="round"/>'
          f'<rect x="35" y="33" width="10" height="4" rx="2" fill="{c["iron"]}" stroke="{c["line"]}" stroke-width="1.6"/>'
          f'<rect x="20" y="42" width="40" height="5" rx="2.5" fill="{c["iron"]}" stroke="{c["line"]}" stroke-width="2"/>'
          f'<rect x="24" y="47" width="32" height="21" rx="3" fill="{c["glass"]}" stroke="{c["line"]}" stroke-width="2"/>'
          f'<path d="M32.5,47 V68 M47.5,47 V68" stroke="{c["iron2"]}" stroke-width="1.8"/>'
          f'<rect x="21" y="67" width="38" height="5" rx="2.5" fill="{c["iron"]}" stroke="{c["line"]}" stroke-width="2"/>'
          f'<path d="M37,72 L40,77 L43,72 Z" fill="{c["iron"]}" stroke="{c["line"]}" stroke-width="1.3" stroke-linejoin="round"/>'
          f'<path d="M26.5,50 V60" stroke="#FFF" stroke-width="1.6" stroke-linecap="round" opacity="0.8"/>'
          + face(40, 57, 0.95, "lnE", "#5A3828", "#A0674A")
          + '</g>' + sparkle(70, 50, 2.6, "#FFF4B8", "#D9953A") + sparkle(10, 60, 2, "#FFF4B8", "#D9953A"))
    return svg(80, 80, s)
reg_top("obs-graveyard-lantern-branch", lantern_body(), lantern_cap(),
        {"rects": [[31, 0, 18, 64]]},
        {"rects": [[31, 0, 18, 8], [33, 8, 14, 6], [37, 14, 6, 9], [35, 23, 10, 4], [30, 26, 20, 4], [25, 30, 30, 4], [21, 34, 38, 2], [16, 35, 48, 5], [21, 40, 38, 26], [17, 66, 46, 5]]},
        note="static (no sway); twigs, glow and the little finial under the lantern are decorative")

# ================= GRAVEYARD: spider on a thread under a cobweb =================
SPD = dict(body="#C3B1EC", body2="#9F8BD6", line="#54427A", web="#F4EEFF", webl="#B9A9E0")
def spider_body():
    d = thread_v(40, -2, 66) + tile3(sparkle(40, 22, 2.2, "#FFFFFF", "#B9A9E0", 0.9, 0.8) + f'<circle cx="40" cy="50" r="1.6" fill="#E6F2FF" stroke="#8E7BB8" stroke-width="0.7"/>')
    return svg(80, 64, d)
def web_pts(cx, cy, rx, ry, n=8, k=1.0, rot=0):
    return [(cx + math.cos(math.radians(rot + 360 * i / n)) * rx * k, cy + math.sin(math.radians(rot + 360 * i / n)) * ry * k) for i in range(n)]
def spider_cap():
    c = SPD
    s = thread_v(40, -2, 14)
    cx, cy, rx, ry = 40, 28, 31, 17
    outer = web_pts(cx, cy, rx, ry, 8, 1, 22.5)
    poly = lambda pts: "M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in pts) + " Z"
    s += f'<path d="{poly(outer)}" fill="#FFFFFF" opacity="0.22"/>'
    for k in (1.0, 0.68, 0.38):
        pts = web_pts(cx, cy, rx, ry, 8, k, 22.5)
        # sagging threads between spokes
        d = f"M{pts[0][0]:.1f},{pts[0][1]:.1f}"
        for i in range(1, 9):
            a, b = pts[i - 1], pts[i % 8]
            mx, my = (a[0] + b[0]) / 2, (a[1] + b[1]) / 2
            d += f" Q{cx+(mx-cx)*0.86:.1f},{cy+(my-cy)*0.86:.1f} {b[0]:.1f},{b[1]:.1f}"
        s += f'<path d="{d}" fill="none" stroke="{c["webl"]}" stroke-width="2.6" opacity="0.6"/><path d="{d}" fill="none" stroke="{c["web"]}" stroke-width="1.3"/>'
    for x, y in outer:
        s += f'<path d="M{cx},{cy} L{x:.1f},{y:.1f}" stroke="{c["webl"]}" stroke-width="2.4" opacity="0.6"/><path d="M{cx},{cy} L{x:.1f},{y:.1f}" stroke="{c["web"]}" stroke-width="1.2"/>'
    s += sparkle(20, 22, 2.2, "#FFFFFF", "#B9A9E0") + sparkle(60, 35, 1.8, "#FFFFFF", "#B9A9E0")
    s += thread_v(40, 28, 52)
    # spider (legs decorative)
    s += '<g transform="translate(40,52) scale(1.15) translate(-40,-52)">'
    for sx in (-1, 1):
        for i, (a, b) in enumerate(((-4, -10), (0, -4), (4, 3), (7, 9))):
            x0, y0 = 40 + sx * 8, 61 + a * 0.9
            s += (f'<path d="M{x0},{y0} Q{40+sx*17},{y0+b-4} {40+sx*(19+i)},{y0+b+5}" stroke="{c["line"]}" stroke-width="3.2" fill="none" stroke-linecap="round"/>'
                  f'<path d="M{x0},{y0} Q{40+sx*17},{y0+b-4} {40+sx*(19+i)},{y0+b+5}" stroke="{c["body2"]}" stroke-width="1.4" fill="none" stroke-linecap="round"/>')
    s += (f'<defs><radialGradient id="spB" cx="0.38" cy="0.3" r="0.8"><stop offset="0.3" stop-color="{c["body"]}"/><stop offset="1" stop-color="{c["body2"]}"/></radialGradient></defs>'
          f'<circle cx="40" cy="62" r="12.5" fill="url(#spB)" stroke="{c["line"]}" stroke-width="2"/>'
          f'<ellipse cx="35.5" cy="55.5" rx="3.4" ry="1.8" fill="#FFF" opacity="0.75" transform="rotate(-30 35.5 55.5)"/>'
          + face(40, 63, 0.9, "spE", "#3E2C5C", "#6A4E9A")
          + f'<path d="M38.2,66.6 L38.8,68.4 M41.8,66.6 L41.2,68.4" stroke="#FFF" stroke-width="1.1" stroke-linecap="round"/>'
          f'<g transform="translate(40,50.5)"><path d="M0,0 L-5,-3 Q-6,0 -5,3 Z M0,0 L5,-3 Q6,0 5,3 Z" fill="#FFB6CC" stroke="{c["line"]}" stroke-width="1"/><circle r="1.5" fill="#FF9EBB"/></g></g>')
    return svg(80, 80, s)
reg_top("obs-graveyard-spider", spider_body(), spider_cap(),
        {"rects": [[39, 0, 2, 64]]},
        {"rects": [[39, 0, 2, 14], [16, 19, 48, 18], [24, 13, 32, 6], [24, 37, 32, 5], [39, 42, 2, 11]], "circles": [[40, 64, 12]]},
        note="cobweb counts (inner rects); spider legs, dew sparkles and the bow are decorative. Static")

# ================= CHURCH: candle chandelier on a chain =================
CHD = dict(gold="#F6D58E", gold2="#E3B866", line="#8E5A3C", wax="#FFF6EA", wax2="#F0DCCB", flame="#FFD27A", flame2="#FFF4C8", drip="#FFB6CC")
def chand_body():
    return svg(80, 64, chain_v(40, 0, 64, CHD["gold"], CHD["line"], 16))
def candle(x, ybase, h, c):
    return (f'<rect x="{x-3.5}" y="{ybase-h}" width="7" height="{h}" rx="2" fill="{c["wax"]}" stroke="{c["line"]}" stroke-width="1.4"/>'
            f'<path d="M{x-3.5},{ybase-h+3} q1.5,3 3,0 q1,2 3,0" stroke="{c["drip"]}" stroke-width="1.6" fill="none" stroke-linecap="round"/>'
            f'<path d="M{x},{ybase-h} V{ybase-h-2}" stroke="{c["line"]}" stroke-width="1"/>'
            f'<path d="M{x},{ybase-h-10} Q{x+4},{ybase-h-5} {x},{ybase-h-2} Q{x-4},{ybase-h-5} {x},{ybase-h-10} Z" fill="{c["flame"]}" stroke="#E8A050" stroke-width="0.9"/>'
            f'<ellipse cx="{x}" cy="{ybase-h-4.5}" rx="1.3" ry="2" fill="{c["flame2"]}"/>'
            f'<circle cx="{x}" cy="{ybase-h-5}" r="7" fill="#FFE9A8" opacity="0.22"/>')
def chand_cap():
    c = CHD
    s = chain_v(40, 0, 30, c["gold"], c["line"], 16)
    cups = [(12, 44), (27, 49), (53, 49), (68, 44)]
    tray = "M7,42 Q8,40 10,40 H70 Q72,40 73,42 Q68,57 40,57 Q12,57 7,42 Z"
    s += (f'<path d="{tray}" fill="{c["gold"]}" stroke="{c["line"]}" stroke-width="2" stroke-linejoin="round"/>'
          f'<path d="M14,45 Q40,58 66,45 Q40,52 14,45 Z" fill="{c["gold2"]}" opacity="0.8"/>'
          f'<path d="M12,43.5 H30" stroke="#FFF6D6" stroke-width="1.6" stroke-linecap="round"/>'
          + "".join(f'<circle cx="{x}" cy="{y}" r="1.6" fill="#FFB6CC" stroke="{c["line"]}" stroke-width="0.8"/>' for x, y in ((20, 50), (40, 53.5), (60, 50))))
    for x, y in cups:
        s += candle(x, y - 1, 13, c)
        s += f'<path d="M{x-6},{y-2} H{x+6} L{x+4},{y+1} H{x-4} Z" fill="{c["gold"]}" stroke="{c["line"]}" stroke-width="1.5" stroke-linejoin="round"/>'
    s += candle(40, 34, 0.01, c).replace('opacity="0.22"', 'opacity="0"') if False else ""
    s += (f'<path d="M40,28 V34" stroke="{c["line"]}" stroke-width="3"/>'
          f'<ellipse cx="40" cy="36" rx="7" ry="3.5" fill="{c["gold2"]}" stroke="{c["line"]}" stroke-width="1.6"/>'
          f'<ellipse cx="40" cy="44" rx="11" ry="9.5" fill="{c["gold"]}" stroke="{c["line"]}" stroke-width="2"/>'
          f'<ellipse cx="36" cy="40" rx="3" ry="1.8" fill="#FFF" opacity="0.7" transform="rotate(-30 36 40)"/>'
          + face(40, 45, 0.8, "chE", "#5A3828", "#A0674A") +
          f'<path d="M40,57 V60" stroke="{c["line"]}" stroke-width="2.4"/>'
          f'<path d="M40,60 Q45,66 40,72 Q35,66 40,60 Z" fill="#E6F2FF" stroke="#7A7AB0" stroke-width="1.4"/>'
          f'<path d="M38.6,64 L39.4,68" stroke="#FFF" stroke-width="1" stroke-linecap="round"/>')
    return svg(80, 80, s)
reg_top("obs-church-chandelier", chand_body(), chand_cap(),
        {"rects": [[37, 0, 6, 64]]},
        {"rects": [[37, 0, 6, 33], [34, 33, 12, 3], [30, 36, 20, 16], [9, 29, 6, 13], [24, 34, 6, 13], [50, 34, 6, 13], [65, 29, 6, 13],
                   [9, 41, 62, 4], [14, 45, 52, 5], [22, 50, 36, 5], [39, 55, 2, 6], [39, 60, 2, 4]], "circles": [[40, 66, 3]]},
        note="static; candle flames and glow are decorative (they point up, away from the gap). Chain counted solid (link holes are far too small to pass)")

# ================= CHURCH: bats hanging upside down =================
HB = dict(body="#BBA7E6", body2="#9C86D2", wing="#A994DC", line="#54427A", vine="#B9A3A0", vine2="#9C8480", vline="#5E4A58", leaf="#A9DDBF", lline="#4F7A62")
def vine_body():
    c = HB
    d = tile3(f'<path d="M40,0 C43,16 37,32 40,48 C42,56 40,62 40,64" stroke="{c["vline"]}" stroke-width="8" fill="none"/>'
              f'<path d="M40,0 C43,16 37,32 40,48 C42,56 40,62 40,64" stroke="{c["vine"]}" stroke-width="5" fill="none"/>'
              + leaf(43, 12, -20, c["leaf"], c["lline"]) + leaf(37, 34, 200, c["leaf"], c["lline"]) + leaf(42, 52, -30, "#C3EBD3", c["lline"]))
    return svg(80, 64, d)
def hanging_bat(cx, top, h, c, gid):
    """wrapped-up bat hanging head-down. top = feet y; body capsule from top+3 to top+h"""
    y0, y1 = top + 3, top + h
    cy = (y0 + y1) / 2; rx = 10; ry = (y1 - y0) / 2
    s = (f'<path d="M{cx-3},{top+4} V{top} M{cx+3},{top+4} V{top}" stroke="{c["line"]}" stroke-width="2" stroke-linecap="round"/>'
         f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{c["wing"]}" stroke="{c["line"]}" stroke-width="2"/>'
         f'<path d="M{cx-rx+1},{cy-2} Q{cx-3},{cy+2} {cx},{y0+3} M{cx+rx-1},{cy-2} Q{cx+3},{cy+2} {cx},{y0+3}" stroke="{c["body2"]}" stroke-width="1.3" fill="none"/>'
         # head at the bottom, ears pointing down
         f'<path d="M{cx-7},{y1-4} L{cx-8},{y1+4} L{cx-3},{y1} Z M{cx+7},{y1-4} L{cx+8},{y1+4} L{cx+3},{y1} Z" fill="{c["body2"]}" stroke="{c["line"]}" stroke-width="1.5" stroke-linejoin="round"/>'
         f'<ellipse cx="{cx}" cy="{y1-7}" rx="8" ry="7" fill="{c["body"]}" stroke="{c["line"]}" stroke-width="1.8"/>'
         f'<path d="M{cx-5.5},{y1-8.5} Q{cx-3.5},{y1-6} {cx-1.5},{y1-8.5} M{cx+1.5},{y1-8.5} Q{cx+3.5},{y1-6} {cx+5.5},{y1-8.5}" stroke="#3E2C5C" stroke-width="1.3" fill="none" stroke-linecap="round"/>'
         + blush(cx - 5.5, cx + 5.5, y1 - 11, 1.8, 1.1) +
         f'<path d="M{cx-1.5},{y1-12.5} Q{cx},{y1-13.8} {cx+1.5},{y1-12.5}" stroke="#3E2C5C" stroke-width="1" fill="none" stroke-linecap="round"/>'
         f'<ellipse cx="{cx-4}" cy="{cy-5}" rx="2" ry="3.4" fill="#FFF" opacity="0.5"/>')
    return s
def bats_cap():
    c = HB
    s = (f'<path d="M40,-2 C42,6 39,10 40,16" stroke="{c["vline"]}" stroke-width="8" fill="none"/>'
         f'<path d="M40,-2 C42,6 39,10 40,16" stroke="{c["vine"]}" stroke-width="5" fill="none"/>')
    # perch twig
    s += (f'<path d="M8,19 C20,14 60,14 72,19" stroke="{c["vline"]}" stroke-width="7" fill="none" stroke-linecap="round"/>'
          f'<path d="M8,19 C20,14 60,14 72,19" stroke="{c["vine"]}" stroke-width="4" fill="none" stroke-linecap="round"/>'
          + leaf(70, 18, -40, c["leaf"], c["lline"]) + leaf(10, 18, 220, c["leaf"], c["lline"]))
    s += hanging_bat(20, 17, 34, c, "b1") + hanging_bat(60, 17, 34, c, "b3") + hanging_bat(40, 16, 42, c, "b2")
    s += (f'<text x="66" y="40" font-family="sans-serif" font-size="7" fill="#E6DCFF" opacity="0.9">z</text>'
          f'<text x="70" y="33" font-family="sans-serif" font-size="5" fill="#E6DCFF" opacity="0.8">z</text>')
    return svg(80, 80, s)
reg_top("obs-church-bats", vine_body(), bats_cap(),
        {"rects": [[38, 0, 6, 64]]},
        {"rects": [[37, 0, 6, 15], [9, 15, 62, 4], [36, 18, 2, 4], [42, 18, 2, 4]],
         "circles": [[20, 30, 8], [20, 42, 8], [60, 30, 8], [60, 42, 8], [40, 29, 8.5], [40, 42, 8.5], [40, 50, 7]]},
        note="three sleeping bats (not the flapping hazard bat). Ear tips, leaves and z's are decorative. Static")

# ================= COUNTRYSIDE: beehive on a bough =================
BH = dict(hive="#FFD98A", hive2="#F2C46E", line="#8E5A3C", bark="#D2B4A4", bark2="#B8968A", bline="#6A4A4E", leaf="#A9DDBF", lline="#4F7A62")
def bough_body():
    c = BH
    d = (f'<rect x="33" y="0" width="14" height="64" fill="{c["bark"]}"/><rect x="42" y="0" width="5" height="64" fill="{c["bark2"]}" opacity="0.8"/>'
         f'<path d="M33,-1 V65 M47,-1 V65" stroke="{c["bline"]}" stroke-width="{LW}"/>'
         + tile3(f'<path d="M37,4 C39,14 36,22 38,30" stroke="{c["bark2"]}" stroke-width="1.2" fill="none"/>'
                 + leaf(47, 16, -25, c["leaf"], c["lline"]) + leaf(48, 21, 15, "#C3EBD3", c["lline"]) + leaf(33, 46, 205, c["leaf"], c["lline"]) + leaf(33, 51, 165, "#C3EBD3", c["lline"])))
    return svg(80, 64, d)
def bee(x, y, s=1.0):
    return (f'<g transform="translate({x},{y}) scale({s})"><ellipse cx="-1" cy="-4" rx="3" ry="2.2" fill="#FFF" opacity="0.85" stroke="#8E7BB8" stroke-width="0.6"/>'
            f'<ellipse cx="0" cy="0" rx="4.2" ry="3.2" fill="#FFE08A" stroke="#5A3828" stroke-width="1"/><path d="M-1,-3 V3 M1.6,-2.8 V2.8" stroke="#5A3828" stroke-width="1.1"/>'
            f'<circle cx="-2.6" cy="-0.6" r="0.6" fill="#3E2C2C"/></g>')
def beehive_cap():
    c = BH
    s = (f'<rect x="33" y="-2" width="14" height="24" fill="{c["bark"]}"/><path d="M33,-2 V22 M47,-2 V22" stroke="{c["bline"]}" stroke-width="{LW}"/>'
         + leaf(47, 8, -25, c["leaf"], c["lline"]))
    hive = "M15,66 C11,50 16,28 40,21 C64,28 69,50 65,66 Q40,73 15,66 Z"
    s += (f'<defs><linearGradient id="hv" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="{c["hive"]}"/><stop offset="0.6" stop-color="{c["hive"]}"/><stop offset="1" stop-color="{c["hive2"]}"/></linearGradient>'
          f'<clipPath id="hvc"><path d="{hive}"/></clipPath></defs>'
          f'<path d="{hive}" fill="url(#hv)"/>'
          f'<g clip-path="url(#hvc)">' + "".join(f'<path d="M0,{y} Q40,{y+5} 80,{y}" stroke="{c["hive2"]}" stroke-width="2.2" fill="none"/>' for y in (31, 40, 49, 58)) + '</g>'
          f'<path d="{hive}" fill="none" stroke="{c["line"]}" stroke-width="{LW}" stroke-linejoin="round"/>'
          f'<path d="M24,36 C25,31 29,27 33,25" stroke="#FFF6D6" stroke-width="2.2" fill="none" stroke-linecap="round"/>'
          f'<ellipse cx="40" cy="62" rx="6" ry="4" fill="#8E5A3C" stroke="{c["line"]}" stroke-width="1.4"/>'
          + face(40, 47, 1.0, "hvE", "#5A3828", "#A0674A") +
          f'<path d="M58,67 q2,5 0,8 q-2,-3 0,-8 z" fill="#FFC85A" stroke="{c["line"]}" stroke-width="1"/>'
          + bee(12, 32, 0.95) + bee(69, 44, 0.9))
    return svg(80, 80, s)
reg_top("obs-countryside-beehive", bough_body(), beehive_cap(),
        {"rects": [[35, 0, 10, 64]]},
        {"rects": [[35, 0, 10, 24], [18, 44, 44, 22], [31, 25, 18, 6]], "circles": [[40, 43, 19]]},
        note="the two bees, leaves and the honey drip are decorative. Static")

# ================= COUNTRYSIDE: rope swing =================
SW = dict(rope="#F6E7C6", line="#7A5A4E", twist="#D9BF98", seat="#E6CDB4", seat2="#CFAF93")
def swing_body():
    return svg(80, 64, rope_v(17, -1, 65) + rope_v(63, -1, 65))
def swing_cap():
    c = SW
    s = rope_v(17, -1, 52) + rope_v(63, -1, 52)
    s += (f'<rect x="7" y="51" width="66" height="10" rx="4" fill="{c["seat"]}" stroke="{c["line"]}" stroke-width="{LW}"/>'
          f'<path d="M11,54.5 H56" stroke="#F3E2CF" stroke-width="1.6" stroke-linecap="round"/><path d="M26,58 q8,-2 16,0" stroke="{c["seat2"]}" stroke-width="1.2" fill="none"/>'
          + "".join(f'<path d="M{x-4},50 Q{x},47 {x+4},50 M{x-4},62 Q{x},65 {x+4},62" stroke="{c["line"]}" stroke-width="3.6" fill="none" stroke-linecap="round"/>'
                    f'<path d="M{x-4},50 Q{x},47 {x+4},50 M{x-4},62 Q{x},65 {x+4},62" stroke="{c["rope"]}" stroke-width="2" fill="none" stroke-linecap="round"/>' for x in (17, 63))
          + flower(30, 56, 2.2, "#FFB6CC") + leaf(34, 56, 10))
    # a little sleepy pumpkin riding the swing (collides)
    s += (f'<ellipse cx="44" cy="42" rx="12" ry="9.5" fill="#FFC9A0" stroke="#8A5068" stroke-width="2"/>'
          f'<path d="M38,34 Q36,42 38,50.5 M50,34 Q52,42 50,50.5 M44,32.6 V51" stroke="#EE9A70" stroke-width="1.3" fill="none"/>'
          f'<path d="M44,33 Q45,28 48,27" stroke="#4F8A6C" stroke-width="2.6" fill="none" stroke-linecap="round"/>'
          + happy_eyes(40, 48, 41.5, 2, "#5A3550", 1.3) + blush(37, 51, 45, 1.8, 1.1, "#FF9EB0") +
          f'<path d="M42.6,45 Q44,46.4 45.4,45" stroke="#5A3550" stroke-width="1.1" fill="none" stroke-linecap="round"/>')
    return svg(80, 80, s)
reg_top("obs-countryside-swing", swing_body(), swing_cap(),
        {"rects": [[15, 0, 50, 64]]},
        {"rects": [[15, 0, 50, 51], [8, 51, 64, 9]]},
        note="body rect spans both ropes on purpose: the seat spans the full width, so nothing can ever pass between the ropes (same result as two rope rects). Rope knots under the seat are decorative. Static")

# ================= SCHOOLS: hanging handbell =================
HBL = dict(bell="#A8DCD9", bell2="#7FC2C0", line="#3F5C6E", rim="#F6D58E", wood="#FFCFA8", wood2="#F2A57A", wline="#8A5A4E")
def handbell_body():
    return svg(80, 64, rope_v(40, -1, 65, 6, "#FFC9DA", "#7A4E66", "#FFF3F7"))
def handbell_cap():
    c = HBL
    s = rope_v(40, -1, 10, 6, "#FFC9DA", "#7A4E66", "#FFF3F7")
    s += (f'<path d="M33,12 Q40,4 47,12 Q40,16 33,12 Z" fill="#FFC9DA" stroke="#7A4E66" stroke-width="1.6"/>'
          f'<rect x="35" y="9" width="10" height="21" rx="4" fill="{c["wood"]}" stroke="{c["wline"]}" stroke-width="2"/>'
          f'<path d="M38,12 V26" stroke="#FFE6D2" stroke-width="1.6" stroke-linecap="round"/>'
          f'<path d="M34,29 H46 V33 H34 Z" fill="{c["rim"]}" stroke="{c["line"]}" stroke-width="1.5"/>')
    bell = "M30,33 H50 C53,40 54,50 58,56 C61,60 66,61 66,64 Q66,67 62,67 H18 Q14,67 14,64 C14,61 19,60 22,56 C26,50 27,40 30,33 Z"
    s += (f'<defs><linearGradient id="hbg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="{c["bell"]}"/><stop offset="0.6" stop-color="{c["bell"]}"/><stop offset="1" stop-color="{c["bell2"]}"/></linearGradient></defs>'
          f'<path d="{bell}" fill="url(#hbg)" stroke="{c["line"]}" stroke-width="{LW}" stroke-linejoin="round"/>'
          f'<path d="M16,63 H64" stroke="{c["rim"]}" stroke-width="3.2"/><path d="M27,44 H53" stroke="#FFB6CC" stroke-width="3"/>'
          f'<path d="M31,37 C29,44 28,50 25,55" stroke="#E6FBF8" stroke-width="2" fill="none" stroke-linecap="round"/>'
          + face(40, 54, 0.9, "hbE", "#2E4A5A", "#5A7E94") +
          f'<path d="M40,67 V69" stroke="{c["line"]}" stroke-width="1.6"/><circle cx="40" cy="71.5" r="3.2" fill="{c["rim"]}" stroke="{c["line"]}" stroke-width="1.4"/>'
          f'<path d="M70,50 l5,-3 M71,56 h6 M10,50 l-5,-3 M9,56 h-6" stroke="#FFE08A" stroke-width="1.6" stroke-linecap="round"/>')
    return svg(80, 80, s)
reg_top("obs-school-handbell", handbell_body(), handbell_cap(),
        {"rects": [[37, 0, 6, 64]]},
        {"rects": [[37, 0, 6, 10], [36, 10, 8, 23], [31, 33, 18, 9], [27, 42, 26, 10], [22, 52, 36, 6], [18, 58, 44, 2], [15, 60, 50, 6], [37.5, 66, 5, 3]],
         "circles": [[40, 71, 3]]},
        note="ding lines are decorative. Static (optional sway: rotate +-6 deg about (40,0) of the cap only if you also grow every rect by 4px sideways)")

# ================= SCHOOLS: kite tangled on its string =================
KT = dict(line="#6B4E7A", pink="#FFC9DA", mint="#BDEBD6", butter="#FFEBB0", lilac="#D9CCF5")
def kite_body():
    d = (f'<path d="M40,-1 V65" stroke="#8A6A9A" stroke-width="2.4"/><path d="M40,-1 V65" stroke="#FFF3F7" stroke-width="1"/>'
         + tile3(f'<path d="M40,30 l-4,-2.5 v5 Z M40,30 l4,-2.5 v5 Z" fill="#FFB6CC" stroke="{KT["line"]}" stroke-width="0.8"/>'))
    return svg(80, 64, d)
def kite_cap():
    c = KT
    s = (f'<path d="M40,-1 V6 C40,10 47,10 46,14 C45,18 35,16 36,12 C37,9 41,11 40,17" stroke="#8A6A9A" stroke-width="2.4" fill="none" stroke-linecap="round"/>'
         f'<path d="M40,-1 V6 C40,10 47,10 46,14 C45,18 35,16 36,12 C37,9 41,11 40,17" stroke="#FFF3F7" stroke-width="1" fill="none" stroke-linecap="round"/>')
    T, L, R, B = (40, 16), (12, 40), (68, 40), (40, 70)
    s += (f'<path d="M{T[0]},{T[1]} L{L[0]},{L[1]} L40,40 Z" fill="{c["pink"]}"/><path d="M{T[0]},{T[1]} L{R[0]},{R[1]} L40,40 Z" fill="{c["mint"]}"/>'
          f'<path d="M{L[0]},{L[1]} L{B[0]},{B[1]} L40,40 Z" fill="{c["lilac"]}"/><path d="M{R[0]},{R[1]} L{B[0]},{B[1]} L40,40 Z" fill="{c["butter"]}"/>'
          f'<path d="M40,16 V70 M12,40 H68" stroke="#E6CDB4" stroke-width="2"/>'
          f'<path d="M{T[0]},{T[1]} L{L[0]},{L[1]} L{B[0]},{B[1]} L{R[0]},{R[1]} Z" fill="none" stroke="{c["line"]}" stroke-width="{LW}" stroke-linejoin="round"/>'
          f'<path d="M36,22 L24,33" stroke="#FFF" stroke-width="1.6" stroke-linecap="round" opacity="0.8"/>'
          f'<ellipse cx="40" cy="44" rx="10" ry="7.5" fill="#FFF8F0" opacity="0.85"/>'
          + face(40, 44, 0.85, "ktE", "#4A3358", "#7A5A9E", "o") )
    # tail curls up and away to the right (decorative)
    tail = "M40,70 C48,76 58,74 62,66 C65,60 70,58 74,60"
    s += f'<path d="{tail}" stroke="#8A6A9A" stroke-width="1.6" fill="none"/>'
    for x, y in ((50, 74), (62, 66), (72, 59.5)):
        s += f'<path d="M{x},{y} l-4,-3 v6 Z M{x},{y} l4,-3 v6 Z" fill="#FFB6CC" stroke="{c["line"]}" stroke-width="0.8" stroke-linejoin="round"/>'
    return svg(80, 80, s)
reg_top("obs-school-kite", kite_body(), kite_cap(),
        {"rects": [[39, 0, 2, 64]]},
        {"rects": [[39, 0, 2, 18], [39, 17, 2, 6], [35, 22, 10, 8], [26, 30, 28, 6], [19, 36, 42, 8], [27, 44, 26, 10], [34, 54, 12, 8], [37, 62, 6, 4]]},
        note="the string tangle loop and the bow tail are decorative. Static")

# ================= SCHOOLS: dangling classroom lamp =================
LP = dict(shade="#BDEBD6", shade2="#97D6BC", line="#3F6A5E", cap="#F6D58E", bulb="#FFF4C8", glow="#FFE9A8")
def lamp_body():
    return svg(80, 64, cable_v(40, -1, 65, "#C9B6E8", "#5E4A7E", 2.4))
def lamp_cap():
    c = LP
    s = cable_v(40, -1, 26, "#C9B6E8", "#5E4A7E", 2.4)
    s += (f'<defs><radialGradient id="lg" cx="0.5" cy="0" r="1"><stop offset="0" stop-color="{c["glow"]}" stop-opacity="0.75"/><stop offset="1" stop-color="{c["glow"]}" stop-opacity="0"/></radialGradient></defs>'
          f'<path d="M12,58 L2,80 H78 L68,58 Z" fill="url(#lg)"/>'
          f'<circle cx="40" cy="62" r="6.5" fill="{c["bulb"]}" stroke="#D9A85A" stroke-width="1.6"/><path d="M38,60 q1,-2 2,0" stroke="#FFF" stroke-width="1.2" fill="none"/>'
          f'<rect x="34" y="25" width="12" height="7" rx="2" fill="{c["cap"]}" stroke="{c["line"]}" stroke-width="1.6"/>')
    shade = "M33,31 H47 C51,37 56,41 63,45 C69,49 71,53 71,58 H9 C9,53 11,49 17,45 C24,41 29,37 33,31 Z"
    s += (f'<path d="{shade}" fill="{c["shade"]}" stroke="{c["line"]}" stroke-width="{LW}" stroke-linejoin="round"/>'
          f'<path d="M49,34 C54,40 61,44 67,48 C70,51 71,54 71,58 H58 C58,50 54,40 49,34 Z" fill="{c["shade2"]}" opacity="0.7"/>'
          f'<path d="M9,58 H71" stroke="{c["line"]}" stroke-width="{LW}"/><path d="M11,55.5 H69" stroke="#FFF" stroke-width="1.4" opacity="0.6"/>'
          + "".join(f'<circle cx="{x}" cy="{y}" r="1.5" fill="#FFF" opacity="0.8"/>' for x, y in ((24, 50), (56, 48), (34, 41), (62, 53)))
          + f'<path d="M30,38 C25,43 19,46 15,50" stroke="#F0FFF8" stroke-width="2" fill="none" stroke-linecap="round"/>'
          + face(40, 47, 0.9, "lpE", "#2E4A40", "#5A8A78", "w", True))
    return svg(80, 80, s)
reg_top("obs-school-lamp", lamp_body(), lamp_cap(),
        {"rects": [[38, 0, 4, 64]]},
        {"rects": [[38, 0, 4, 26], [35, 26, 10, 5], [34, 31, 12, 6], [28, 37, 24, 7], [19, 44, 42, 6], [11, 50, 58, 7]],
         "circles": [[40, 62, 6]]},
        note="the light cone is decorative. Static")

# ================= CITY: window-cleaner's cradle =================
CR = dict(frame="#FFE3A0", frame2="#F2C46E", line="#7A5A3E", box="#FFC9DA", box2="#F2A9BE", cable="#C9C6E0", cline="#4E4A6E")
def cradle_body():
    return svg(80, 64, cable_v(15, -1, 65, CR["cable"], CR["cline"], 2.6) + cable_v(65, -1, 65, CR["cable"], CR["cline"], 2.6))
def cradle_cap():
    c = CR
    s = cable_v(15, -1, 36, c["cable"], c["cline"], 2.6) + cable_v(65, -1, 36, c["cable"], c["cline"], 2.6)
    s += (f'<path d="M15,22 L10,36 M15,22 L20,36 M65,22 L60,36 M65,22 L70,36" stroke="{c["cline"]}" stroke-width="1.6"/>'
          f'<circle cx="15" cy="22" r="3" fill="{c["frame"]}" stroke="{c["line"]}" stroke-width="1.4"/><circle cx="65" cy="22" r="3" fill="{c["frame"]}" stroke="{c["line"]}" stroke-width="1.4"/>')
    # cleaner ghost behind the rail
    s += (f'<g transform="translate(40,38) scale(1.55)"><path d="M-9,8 V-1 C-9,-8 -5,-12 0,-12 C5,-12 9,-8 9,-1 V8 Z" fill="#FFFFFF" stroke="#6B4E7A" stroke-width="1.3"/>'
          f'<path d="M-9.5,-6 Q0,-16 9.5,-6 Z" fill="#9EDBF0" stroke="#3F5C6E" stroke-width="1"/><path d="M-11,-6 H11" stroke="#3F5C6E" stroke-width="1.6" stroke-linecap="round"/></g>'
          + face(40, 34, 0.85, "crE", "#4A3358", "#7A5A9E") +
          f'<path d="M53,30 L60,22" stroke="{c["line"]}" stroke-width="2.4" stroke-linecap="round"/><rect x="56" y="16" width="12" height="5" rx="2" fill="#A8DCD9" stroke="#3F5C6E" stroke-width="1.3" transform="rotate(-45 62 18.5)"/>'
          + "".join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#E6F6FF" stroke="#9EC6E6" stroke-width="0.8" opacity="0.9"/>' for x, y, r in ((68, 12, 2.6), (72, 18, 1.8), (61, 9, 1.6))))
    s += (f'<rect x="7" y="36" width="66" height="5" rx="2.5" fill="{c["frame"]}" stroke="{c["line"]}" stroke-width="1.8"/>'
          f'<path d="M12,41 V47 M24,41 V47 M40,41 V47 M56,41 V47 M68,41 V47" stroke="{c["line"]}" stroke-width="1.8"/>'
          f'<rect x="8" y="46" width="64" height="20" rx="4" fill="{c["box"]}" stroke="{c["line"]}" stroke-width="{LW}"/>'
          f'<rect x="60" y="48" width="10" height="16" fill="{c["box2"]}" opacity="0.8"/>'
          f'<path d="M10,52 l6,-5 M18,60 l12,-12 M32,64 l14,-14" stroke="#FFF" stroke-width="2" stroke-linecap="round" opacity="0.45"/>'
          f'<path d="M14,60 H50" stroke="{c["frame2"]}" stroke-width="2.6" stroke-linecap="round"/>'
          f'<path d="M52,50 h10 l-1.5,9 h-7 z" fill="#C9B6E8" stroke="{c["line"]}" stroke-width="1.3" stroke-linejoin="round"/><path d="M52.5,50 q4.5,-4 9,0" stroke="{c["line"]}" stroke-width="1.1" fill="none"/>')
    return svg(80, 80, s)
reg_top("obs-city-cradle", cradle_body(), cradle_cap(),
        {"rects": [[13, 0, 54, 64]]},
        {"rects": [[13, 0, 54, 36], [8, 36, 64, 30]]},
        note="body rect spans both cables: the cradle below spans the full width, so the space between cables can never be reached (equivalent to two cable rects). Squeegee and suds bubbles are decorative. Static")

# ================= CITY: hanging traffic lights =================
TL = dict(box="#9F9DD8", box2="#8380C0", line="#3E3A6E", pole="#C9C6E0", red="#FF9EB0", amber="#FFE08A", green="#9EF0C8", off="#6E6AA8")
def tl_body():
    c = TL
    d = (f'<rect x="35" y="0" width="10" height="64" fill="{c["pole"]}"/><rect x="41" y="0" width="4" height="64" fill="#A9A6CF"/>'
         f'<path d="M35,-1 V65 M45,-1 V65" stroke="{c["line"]}" stroke-width="2"/>'
         + tile3(f'<rect x="33" y="28" width="14" height="5" rx="2" fill="#FFB6CC" stroke="{c["line"]}" stroke-width="1.4"/>'))
    return svg(80, 64, d)
def tl_cap():
    c = TL
    s = (f'<rect x="35" y="-2" width="10" height="14" fill="{c["pole"]}"/><path d="M35,-2 V12 M45,-2 V12" stroke="{c["line"]}" stroke-width="2"/>'
         f'<rect x="28" y="10" width="24" height="6" rx="2" fill="{c["pole"]}" stroke="{c["line"]}" stroke-width="1.6"/>'
         f'<rect x="21" y="15" width="38" height="58" rx="8" fill="{c["box"]}" stroke="{c["line"]}" stroke-width="{LW}"/>'
         f'<rect x="49" y="18" width="7" height="52" rx="3" fill="{c["box2"]}" opacity="0.7"/>'
         f'<path d="M25,20 V36" stroke="#D3D2F4" stroke-width="1.8" stroke-linecap="round"/>')
    for i, (y, col, kind) in enumerate(((28, c["red"], "sleepy"), (44, c["amber"], "o"), (60, c["green"], "w"))):
        s += (f'<circle cx="40" cy="{y}" r="11" fill="{col}" opacity="0.28"/>'
              f'<circle cx="40" cy="{y}" r="7.5" fill="{col}" stroke="{c["line"]}" stroke-width="1.6"/>'
              f'<path d="M34.5,{y-4} Q36,{y-6.5} 39,{y-6.8}" stroke="#FFF" stroke-width="1.3" fill="none" stroke-linecap="round" opacity="0.85"/>')
        s += face(40, y + 0.5, 0.58, f"tlE{i}", "#3E2C5C", "#6A4E9A", kind if kind != "sleepy" else "w", kind == "sleepy")
    return svg(80, 80, s)
reg_top("obs-city-trafficlight", tl_body(), tl_cap(),
        {"rects": [[36, 0, 8, 64]]},
        {"rects": [[36, 0, 8, 11], [29, 11, 22, 7], [23, 17, 34, 54]]},
        note="narrow (34 px housing): honest to the art and a bit forgiving, like the bell post. Static")

# ================= CITY: neon sign on chains =================
NS = dict(board="#3E3A6E", line="#2A2650", neon="#FF9EC8", neon2="#9EF0E0", neon3="#FFE9A8")
def ns_body():
    return svg(80, 64, chain_v(22, 0, 64, "#C9C6E0", "#4E4A6E", 16) + chain_v(58, 0, 64, "#C9C6E0", "#4E4A6E", 16))
def neon(d, col, w=2):
    return (f'<path d="{d}" fill="none" stroke="{col}" stroke-width="{w*3}" opacity="0.3" stroke-linecap="round" stroke-linejoin="round"/>'
            f'<path d="{d}" fill="none" stroke="{col}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>'
            f'<path d="{d}" fill="none" stroke="#FFF" stroke-width="{w*0.35:.2f}" opacity="0.85" stroke-linecap="round" stroke-linejoin="round"/>')
def ns_cap():
    c = NS
    s = chain_v(22, 0, 30, "#C9C6E0", "#4E4A6E", 16) + chain_v(58, 0, 30, "#C9C6E0", "#4E4A6E", 16)
    s += (f'<circle cx="22" cy="31" r="3" fill="none" stroke="#C9C6E0" stroke-width="2"/><circle cx="58" cy="31" r="3" fill="none" stroke="#C9C6E0" stroke-width="2"/>'
          f'<rect x="6" y="32" width="68" height="34" rx="9" fill="{c["board"]}" stroke="{c["line"]}" stroke-width="{LW}"/>'
          f'<rect x="9" y="35" width="62" height="28" rx="7" fill="none" stroke="{c["neon"]}" stroke-width="1.4" opacity="0.8"/>')
    # neon ghost (mint) + heart (pink) + star (butter)
    g = "M18,58 V47 C18,42 21,39 25,39 C29,39 32,42 32,47 V58 L29.5,56 L27,58 L25,56 L23,58 L20.5,56 Z"
    s += neon(g, c["neon2"], 1.8)
    s += f'<circle cx="22.6" cy="47" r="1.3" fill="{c["neon2"]}"/><circle cx="27.4" cy="47" r="1.3" fill="{c["neon2"]}"/>'
    hx, hy = 47, 49
    heart = f"M{hx},{hy+8} C{hx-11},{hy} {hx-9},{hy-8} {hx-4},{hy-8} C{hx-2},{hy-8} {hx},{hy-6} {hx},{hy-4} C{hx},{hy-6} {hx+2},{hy-8} {hx+4},{hy-8} C{hx+9},{hy-8} {hx+11},{hy} {hx},{hy+8} Z"
    s += neon(heart, c["neon"], 2)
    s += neon("M63,41 L64.5,45 L68.5,45.3 L65.4,47.8 L66.5,51.8 L63,49.5 L59.5,51.8 L60.6,47.8 L57.5,45.3 L61.5,45 Z", c["neon3"], 1.4)
    s += neon("M58,58 H68", c["neon2"], 1.4)
    return svg(80, 80, s)
reg_top("obs-city-neonsign", ns_body(), ns_cap(),
        {"rects": [[18, 0, 44, 64]]},
        {"rects": [[18, 0, 44, 34], [8, 33, 64, 32]]},
        note="body rect spans both chains: the sign board spans the full width, so the space between chains can never be reached. Neon glow is decorative. Static")

# ================= SPACE: space-station robot arm =================
SA = dict(arm="#F3F1FA", arm2="#D6D2EA", line="#4E5280", stripe="#9EF0E0", joint="#C9B6F0", joint2="#A891DE", gold="#FFE3A0")
def arm_body():
    c = SA
    d = (f'<rect x="27" y="0" width="26" height="64" fill="{c["arm"]}"/><rect x="45" y="0" width="8" height="64" fill="{c["arm2"]}"/>'
         f'<rect x="31" y="0" width="3" height="64" fill="#FFF"/>'
         + tile3(f'<rect x="25" y="26" width="30" height="12" rx="3" fill="{c["joint"]}" stroke="{c["line"]}" stroke-width="1.8"/>'
                 f'<path d="M27,32 H53" stroke="{c["joint2"]}" stroke-width="1.4"/>'
                 f'<circle cx="40" cy="10" r="2.2" fill="{c["stripe"]}" stroke="{c["line"]}" stroke-width="0.9"/>'
                 f'<path d="M36,48 H44 M36,52 H44" stroke="{c["arm2"]}" stroke-width="1.4"/>')
         + f'<path d="M27,-1 V65 M53,-1 V65" stroke="{c["line"]}" stroke-width="{LW}"/>')
    return svg(80, 64, d)
def arm_cap():
    c = SA
    s = (f'<rect x="27" y="-2" width="26" height="20" fill="{c["arm"]}"/><rect x="45" y="-2" width="8" height="20" fill="{c["arm2"]}"/>'
         f'<path d="M27,-2 V18 M53,-2 V18" stroke="{c["line"]}" stroke-width="{LW}"/>'
         f'<circle cx="40" cy="27" r="13" fill="{c["joint"]}" stroke="{c["line"]}" stroke-width="{LW}"/>'
         f'<circle cx="40" cy="27" r="7" fill="{c["joint2"]}" opacity="0.5"/>'
         f'<ellipse cx="35" cy="21" rx="3.4" ry="2" fill="#FFF" opacity="0.7" transform="rotate(-30 35 21)"/>'
         + face(40, 28, 0.75, "saE", "#3E2C5C", "#6A4E9A") +
         f'<rect x="24" y="39" width="32" height="9" rx="3" fill="{c["arm"]}" stroke="{c["line"]}" stroke-width="2"/>'
         f'<circle cx="50" cy="43.5" r="2" fill="{c["stripe"]}" stroke="{c["line"]}" stroke-width="0.8"/>')
    for sx in (-1, 1):
        claw = f"M{40+sx*10},46 C{40+sx*24},47 {40+sx*28},60 {40+sx*18},70 Q{40+sx*14},71 {40+sx*12},67 C{40+sx*17},61 {40+sx*15},55 {40+sx*6},51 Z"
        s += f'<path d="{claw}" fill="{c["arm2"]}" stroke="{c["line"]}" stroke-width="2" stroke-linejoin="round"/>'
    # it's holding a little star
    s += (sparkle(40, 61, 8, c["gold"], "#D9953A", 1, 1.4) + f'<circle cx="40" cy="61" r="12" fill="{c["gold"]}" opacity="0.2"/>')
    return svg(80, 80, s)
reg_top("obs-space-arm", arm_body(), arm_cap(),
        {"rects": [[29, 0, 22, 64]]},
        {"rects": [[29, 0, 22, 16], [25, 39, 30, 9], [50, 48, 8, 5], [55, 51, 7, 8], [56, 59, 6, 6], [18, 51, 7, 8], [22, 48, 8, 5], [18, 59, 6, 6], [36, 54, 8, 14], [32, 58, 16, 6]],
         "circles": [[40, 27, 12]]},
        note="claw tips past y 62 and the star's glow are decorative. Static")

# ================= SPACE: tethered astronaut =================
AS = dict(suit="#F7F5FF", suit2="#DCD6F0", line="#4E4A7E", visor="#BFE6FF", visor2="#8EC2F0", pack="#C9B6F0", tether="#FFE3A0", tline="#8E5A3C")
def tether(y0, y1, c):
    s = f'<path d="M40,{y0} V{y1}" stroke="{c["tline"]}" stroke-width="7"/><path d="M40,{y0} V{y1}" stroke="{c["tether"]}" stroke-width="4.4"/>'
    y = y0 - (y0 % 8)
    while y < y1:
        if y + 3 > y0 and y + 3 < y1:
            s += f'<path d="M37,{y+1} Q40,{y+5} 43,{y+1}" stroke="{c["tline"]}" stroke-width="1.2" fill="none"/>'
        y += 8
    return s
def astro_body():
    return svg(80, 64, tether(-1, 65, AS))
def astro_cap():
    c = AS
    s = tether(-1, 16, c)
    s += (f'<rect x="30" y="14" width="20" height="10" rx="3" fill="{c["pack"]}" stroke="{c["line"]}" stroke-width="1.8"/>'
          # arms waving
          f'<path d="M28,52 C20,50 16,46 15,40" stroke="{c["line"]}" stroke-width="9.5" fill="none" stroke-linecap="round"/><path d="M28,52 C20,50 16,46 15,40" stroke="{c["suit"]}" stroke-width="6" fill="none" stroke-linecap="round"/>'
          f'<path d="M52,52 C60,52 64,56 65,61" stroke="{c["line"]}" stroke-width="9.5" fill="none" stroke-linecap="round"/><path d="M52,52 C60,52 64,56 65,61" stroke="{c["suit"]}" stroke-width="6" fill="none" stroke-linecap="round"/>'
          f'<circle cx="15" cy="39" r="4" fill="#FFB6CC" stroke="{c["line"]}" stroke-width="1.6"/><circle cx="65" cy="62" r="4" fill="#FFB6CC" stroke="{c["line"]}" stroke-width="1.6"/>'
          # legs + boots
          f'<rect x="29" y="60" width="9" height="12" rx="3" fill="{c["suit"]}" stroke="{c["line"]}" stroke-width="1.8"/><rect x="42" y="60" width="9" height="12" rx="3" fill="{c["suit"]}" stroke="{c["line"]}" stroke-width="1.8"/>'
          f'<rect x="28" y="69" width="11" height="5" rx="2.5" fill="{c["pack"]}" stroke="{c["line"]}" stroke-width="1.5"/><rect x="41" y="69" width="11" height="5" rx="2.5" fill="{c["pack"]}" stroke="{c["line"]}" stroke-width="1.5"/>'
          # torso
          f'<rect x="27" y="44" width="26" height="20" rx="8" fill="{c["suit"]}" stroke="{c["line"]}" stroke-width="2"/>'
          f'<rect x="34" y="50" width="12" height="8" rx="2" fill="{c["pack"]}" stroke="{c["line"]}" stroke-width="1.2"/>'
          f'<circle cx="37" cy="54" r="1.4" fill="#9EF0E0"/><circle cx="43" cy="54" r="1.4" fill="#FFB6CC"/>'
          # helmet
          f'<circle cx="40" cy="33" r="15.5" fill="{c["suit"]}" stroke="{c["line"]}" stroke-width="{LW}"/>'
          f'<ellipse cx="40" cy="34" rx="11.5" ry="10" fill="{c["visor"]}" stroke="{c["line"]}" stroke-width="1.6"/>'
          f'<path d="M31,30 Q33,25 38,25" stroke="#FFF" stroke-width="2" fill="none" stroke-linecap="round"/>'
          + face(40, 35, 0.8, "asE", "#3E2C5C", "#6A4E9A") +
          f'<path d="M52,22 L55,17" stroke="{c["line"]}" stroke-width="1.4"/><circle cx="55.5" cy="16" r="2" fill="#FFB6CC" stroke="{c["line"]}" stroke-width="0.9"/>'
          + sparkle(66, 26, 3, "#FFF4B8", "#D9953A") + sparkle(12, 60, 2.2, "#FFF4B8", "#D9953A"))
    return svg(80, 80, s)
reg_top("obs-space-astronaut", astro_body(), astro_cap(),
        {"rects": [[37, 0, 6, 64]]},
        {"rects": [[37, 0, 6, 15], [31, 15, 18, 6], [29, 46, 22, 16], [30, 61, 7, 9], [43, 61, 7, 9], [29, 69, 9, 4], [42, 69, 9, 4], [12, 36, 7, 7], [61, 58, 7, 7], [16, 41, 6, 6], [21, 47, 8, 6], [52, 50, 10, 6]],
         "circles": [[40, 33, 14]]},
        note="antenna bobble and sparkles are decorative. Static (Code may bob the whole column 1-2 px; hitbox moves with it)")

if __name__ == "__main__":
    write_all(); print(len(FILES), "files"); import json; print(json.dumps(EDGES, indent=0)[:3000])
