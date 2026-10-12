"""Hand-authored SVG tombstone obstacles (original art).
Each pattern: body (80x64, tiles vertically), cap-top (80x80, sits on top of a floor-rising column),
cap-bottom (80x80, sits under a ceiling-hanging column). All columns are 72px wide (x=4..76) in an 80px canvas."""
import os
OUT = os.path.join(os.path.dirname(__file__), "..")
LW = 2.4

def svg(w, h, inner):
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">\n{inner}\n</svg>\n'

def flower(x, y, r, petal, core="#FFE9A6", line="#7A5A8A"):
    s = [f'<g stroke="{line}" stroke-width="1">']
    import math
    for i in range(5):
        a = math.radians(i * 72 - 90)
        s.append(f'<circle cx="{x + math.cos(a)*r:.2f}" cy="{y + math.sin(a)*r:.2f}" r="{r*0.78:.2f}" fill="{petal}"/>')
    s.append(f'<circle cx="{x}" cy="{y}" r="{r*0.6:.2f}" fill="{core}"/></g>')
    return "".join(s)

def leaf(x, y, ang, fill="#A6DDBF", line="#5E8A73"):
    return (f'<path d="M0,0 Q4,-4 9,0 Q4,4 0,0 Z" fill="{fill}" stroke="{line}" stroke-width="1" '
            f'transform="translate({x},{y}) rotate({ang})"/>')

# ---------------- Pattern A: rounded RIP headstone, lavender, mint moss ----------------
A = dict(fill="#D4CDE8", hi="#E6E1F4", shade="#BDB2D8", line="#6B5A84", moss="#AEE3C6", moss2="#8ACFAA", moss_line="#4F8A6C", engr="#9C8FBE")

def a_body():
    c = A
    return svg(80, 64, f'''<rect x="4" y="0" width="72" height="64" fill="{c["fill"]}"/>
<rect x="62" y="0" width="14" height="64" fill="{c["shade"]}" opacity="0.7"/>
<rect x="9" y="0" width="5" height="64" fill="{c["hi"]}"/>
<g stroke="{c["engr"]}" stroke-width="1.6" stroke-linecap="round" fill="none" opacity="0.85">
  <path d="M16,20 H66"/><path d="M40,4 V18"/><path d="M16,52 H66"/><path d="M28,22 V50"/><path d="M54,22 V50"/>
</g>
<g fill="{c["engr"]}" opacity="0.5"><circle cx="20" cy="36" r="1.2"/><circle cx="46" cy="10" r="1"/><circle cx="62" cy="40" r="1.3"/><circle cx="36" cy="58" r="1"/></g>
<path d="M54,52 q3,-5 7,-2 q4,-3 6,2 q-1,4 -6,3 q-5,2 -7,-3 z" fill="{c["moss"]}" stroke="{c["moss_line"]}" stroke-width="1.2"/>
<path d="M4,-1 V65 M76,-1 V65" stroke="{c["line"]}" stroke-width="{LW}"/>''')

def rip(x, y, col):
    # hand-drawn R I P letters as strokes (no font dependency)
    return (f'<g transform="translate({x},{y})" fill="none" stroke="{col}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">'
            f'<path d="M0,12 V0 H5 Q9,0 9,3.5 Q9,7 5,7 H0 M5,7 L9,12"/>'
            f'<path d="M14,0 V12"/>'
            f'<path d="M19,12 V0 H24 Q28,0 28,3.5 Q28,7 24,7 H19"/></g>')

def a_cap(flip):
    c = A
    shape = "M4,82 V40 C4,19 20,7 40,7 C60,7 76,19 76,40 V82"
    moss = (f'<path d="M7,33 C9,22 17,13 27,10 C31,9 33,12 31,14 C26,16 22,20 20,25 C19,29 21,33 18,35 '
            f'C16,37 15,33 14,32 C12,36 13,41 10,41 C7,41 7,37 7,33 Z" fill="{c["moss"]}" stroke="{c["moss_line"]}" stroke-width="1.3" stroke-linejoin="round"/>'
            f'<path d="M11,30 C12,24 16,19 21,16" stroke="{c["moss2"]}" stroke-width="2" fill="none" stroke-linecap="round"/>'
            f'<circle cx="25.5" cy="12" r="1.3" fill="#FFFFFF" opacity="0.7"/>')
    stone = (f'<path d="{shape} Z" fill="{c["fill"]}"/>'
             f'<path d="M62,82 V40 C62,30 66,22 70,20 C74,26 76,32 76,40 V82 Z" fill="{c["shade"]}" opacity="0.7"/>'
             f'<path d="M9,82 V40 C9,30 12,24 14,22 V82 Z" fill="{c["hi"]}"/>'
             f'<path d="M58,13 C64,16 69,21 71,27" stroke="#FFFFFF" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.6"/>'
             + moss +
             f'<path d="M54,74 q3,-5 7,-2 q4,-3 6,2 q-1,4 -6,3 q-5,2 -7,-3 z" fill="{c["moss"]}" stroke="{c["moss_line"]}" stroke-width="1.2"/>'
             f'<path d="{shape}" fill="none" stroke="{c["line"]}" stroke-width="{LW}" stroke-linejoin="round"/>')
    # engraved plaque + text (kept upright in both variants)
    ty = 34 if not flip else 26
    text = (f'<rect x="20" y="{ty}" width="40" height="22" rx="7" fill="{c["shade"]}" opacity="0.55" stroke="{c["engr"]}" stroke-width="1.2"/>'
            + rip(26, ty + 5, "#7E6FA6") +
            f'<path d="M30,{ty+30} q2,-2 4,0 q2,-2 4,0 q-1,3 -4,5 q-3,-2 -4,-5 z" fill="#FFB3CB" stroke="{c["line"]}" stroke-width="1"/>'
            f'<path d="M42,{ty+30} q2,-2 4,0 q2,-2 4,0 q-1,3 -4,5 q-3,-2 -4,-5 z" fill="#FFB3CB" stroke="{c["line"]}" stroke-width="1" opacity="0.0"/>')
    if flip:
        return svg(80, 80, f'<g transform="translate(0,80) scale(1,-1)">{stone}</g>\n{text}')
    return svg(80, 80, stone + "\n" + text)

# ---------------- Pattern B: cross-topped slab with flowers, mauve ----------------
B = dict(fill="#DCD0E0", hi="#ECE4EF", shade="#C4B4CC", line="#6E5578", groove="#A894B3")

def b_body():
    c = B
    vine = "M14,0 C20,16 8,48 14,64"
    return svg(80, 64, f'''<rect x="4" y="0" width="72" height="64" fill="{c["fill"]}"/>
<rect x="62" y="0" width="14" height="64" fill="{c["shade"]}" opacity="0.7"/>
<rect x="8" y="0" width="3" height="64" fill="{c["hi"]}"/>
<path d="M22,0 V64 M58,0 V64" stroke="{c["groove"]}" stroke-width="1.6" opacity="0.8"/>
<path d="M23.5,0 V64" stroke="{c["hi"]}" stroke-width="1"/>
<g fill="{c["groove"]}" opacity="0.6"><path d="M36,14 l4,-4 l4,4 l-4,4 z"/><path d="M36,46 l4,-4 l4,4 l-4,4 z"/></g>
<path d="{vine}" stroke="#7FB898" stroke-width="1.8" fill="none"/>
{leaf(15, 14, -30)}{leaf(12, 30, 200)}{leaf(13, 46, -20)}{leaf(14, 62, 190)}
{flower(16.5, 22, 2.2, "#FFCFA8")}{flower(11.5, 54, 2.2, "#FFB6CC")}
<path d="M4,-1 V65 M76,-1 V65" stroke="{c["line"]}" stroke-width="{LW}"/>''')

def b_cap(flip):
    c = B
    cross = (f'<path d="M34,44 V22 H24 Q21,22 21,19 V15 Q21,12 24,12 H34 V5 Q34,2 37,2 H43 Q46,2 46,5 V12 H56 Q59,12 59,15 V19 Q59,22 56,22 H46 V44 Z" '
             f'fill="{c["fill"]}" stroke="{c["line"]}" stroke-width="{LW}" stroke-linejoin="round"/>'
             f'<path d="M37,6 V40" stroke="{c["hi"]}" stroke-width="2.2" stroke-linecap="round"/>'
             f'<path d="M43,22 V42" stroke="{c["shade"]}" stroke-width="3" opacity="0.8"/>'
             f'<circle cx="40" cy="17" r="2.2" fill="#FFB6CC" stroke="{c["line"]}" stroke-width="1"/>')
    slab = (f'<path d="M4,82 V58 H76 V82" fill="{c["fill"]}"/>'
            f'<rect x="62" y="58" width="14" height="24" fill="{c["shade"]}" opacity="0.7"/>'
            f'<rect x="8" y="58" width="3" height="24" fill="{c["hi"]}"/>'
            f'<path d="M22,58 V82 M58,58 V82" stroke="{c["groove"]}" stroke-width="1.6" opacity="0.8"/>'
            f'<path d="M4,58 V82 M76,58 V82" stroke="{c["line"]}" stroke-width="{LW}"/>'
            f'<rect x="1.2" y="42" width="77.6" height="17" rx="6" fill="{c["fill"]}" stroke="{c["line"]}" stroke-width="{LW}"/>'
            f'<rect x="5" y="44.5" width="60" height="3" rx="1.5" fill="{c["hi"]}"/>'
            f'<path d="M6,55.5 H74" stroke="{c["shade"]}" stroke-width="2.4" stroke-linecap="round"/>')
    flowers = (leaf(22, 43, 200) + leaf(57, 43, -20) + leaf(30, 41, 230) + leaf(47, 41, -50) +
               flower(26, 38.5, 3.4, "#FFB6CC") + flower(54, 39, 3.2, "#FFCFA8") +
               flower(31.5, 41.5, 2.4, "#C9F0DA") + flower(48.5, 41.5, 2.4, "#E3D4FF") +
               f'<g fill="#FFFFFF" opacity="0.9"><circle cx="16" cy="50" r="1"/><circle cx="66" cy="51" r="1"/></g>')
    body = cross + slab + flowers
    if flip:
        return svg(80, 80, f'<g transform="translate(0,80) scale(1,-1)">{body}</g>')
    return svg(80, 80, body)

# ---------------- Pattern C: stacked sleepy mochi-stones, blue-grey / lilac ----------------
C = dict(f1="#C9D2E6", f2="#D9CCE6", hi="#E8EDF7", shade1="#AEB9D3", shade2="#C2B2D6", line="#5F5A86", crack="#8A84AE")

def stone(x, y, w, h, r, fill, shade, extra=""):
    c = C
    return (f'<g><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}"/>'
            f'<clipPath id="k{x}{y}"><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}"/></clipPath>'
            f'<g clip-path="url(#k{x}{y})"><ellipse cx="{x+w-6}" cy="{y+h}" rx="{w*0.45}" ry="{h*0.55}" fill="{shade}" opacity="0.75"/>'
            f'<ellipse cx="{x+w*0.3}" cy="{y+4}" rx="{w*0.22}" ry="3" fill="{c["hi"]}" opacity="0.9"/></g>'
            f'{extra}<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="none" stroke="{c["line"]}" stroke-width="{LW}"/></g>')

def c_body():
    c = C
    s1 = stone(5, 1.5, 70, 29, 12, c["f1"], c["shade1"],
               f'<path d="M58,6 l-3,6 l4,3 l-3,6" stroke="{c["crack"]}" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
               f'<g fill="{c["crack"]}" opacity="0.5"><circle cx="20" cy="20" r="1.2"/><circle cx="40" cy="24" r="1"/></g>')
    s2 = stone(8, 33.5, 64, 29, 12, c["f2"], c["shade2"],
               f'<path d="M18,40 l4,5 l-2,4" stroke="{c["crack"]}" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
               f'<g fill="{c["crack"]}" opacity="0.5"><circle cx="52" cy="54" r="1.2"/><circle cx="34" cy="44" r="1"/></g>'
               f'<path d="M60,52 q2,-4 5,-1 q3,0 2,3 q-4,2 -7,-2 z" fill="#AEE3C6" stroke="#4F8A6C" stroke-width="1"/>')
    # mortar shadow behind the gaps so the column reads as solid
    back = f'<rect x="12" y="0" width="56" height="64" fill="{c["shade1"]}" opacity="0.9"/>'
    return svg(80, 64, back + s1 + s2)

def sleepy_face(cx, cy):
    c = C
    return (f'<g stroke="{c["line"]}" stroke-width="2" fill="none" stroke-linecap="round">'
            f'<path d="M{cx-17},{cy} Q{cx-12},{cy+4} {cx-7},{cy}"/><path d="M{cx+7},{cy} Q{cx+12},{cy+4} {cx+17},{cy}"/>'
            f'<path d="M{cx-17.5},{cy+0.3} l-1.6,-1.3 M{cx+17.5},{cy+0.3} l1.6,-1.3" stroke-width="1.3"/></g>'
            f'<ellipse cx="{cx-16}" cy="{cy+7}" rx="4" ry="2.3" fill="#FFB3CB" opacity="0.85"/>'
            f'<ellipse cx="{cx+16}" cy="{cy+7}" rx="4" ry="2.3" fill="#FFB3CB" opacity="0.85"/>'
            f'<ellipse cx="{cx}" cy="{cy+7}" rx="2.2" ry="1.6" fill="#E87FA3" stroke="{c["line"]}" stroke-width="1.1"/>'
            # snot-bubble-free drool-free: little sleep bubble
            f'<circle cx="{cx+5.5}" cy="{cy+5}" r="2.6" fill="#E7F4FF" stroke="{c["line"]}" stroke-width="0.9" opacity="0.9"/>'
            f'<circle cx="{cx+4.8}" cy="{cy+4.2}" r="0.7" fill="#FFFFFF"/>')

def zz(x, y, col="#B9A8E6", line="#C3B4F0"):
    return (f'<g fill="none" stroke="{line}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">'
            f'<path d="M{x},{y} h6 l-6,6 h6"/><path d="M{x+8},{y-8} h4 l-4,4 h4" stroke-width="1.3"/></g>')

def c_cap(flip):
    c = C
    crack1 = f'stroke="{c["crack"]}" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round"'
    if not flip:
        big = stone(4, 24, 72, 54, 24, c["f2"], c["shade2"],
                    f'<path d="M22,26 l2,5 l-3,4 l2,4" {crack1}/><path d="M67,52 l-4,3 l1,4" {crack1}/>')
        tuft = (f'<path d="M30,25 q2,-6 5,-1 q3,-7 6,-1 q3,-5 5,1" fill="#AEE3C6" stroke="#4F8A6C" stroke-width="1.2" stroke-linejoin="round"/>'
                f'<path d="M38,20 V14" stroke="#4F8A6C" stroke-width="1.3"/>' + flower(38, 12, 2.6, "#FFCFA8"))
        back = f'<rect x="12" y="70" width="56" height="11" fill="{c["shade1"]}" opacity="0.9"/>'
        return svg(80, 80, back + big + tuft + sleepy_face(40, 47) + zz(58, 15))
    else:
        big = stone(4, 2, 72, 54, 24, c["f1"], c["shade1"],
                    f'<path d="M58,52 l-2,-5 l3,-4" {crack1}/><path d="M13,14 l4,3 l-1,4" {crack1}/>')
        drip = (f'<path d="M30,55 q2,6 5,1 q3,7 6,1 q3,5 5,-1" fill="#AEE3C6" stroke="#4F8A6C" stroke-width="1.2" stroke-linejoin="round"/>')
        back = f'<rect x="12" y="0" width="56" height="10" fill="{c["shade1"]}" opacity="0.9"/>'
        return svg(80, 80, back + big + drip + sleepy_face(40, 27) + zz(60, 74))

if __name__ == "__main__":
    out = {
        "tomb-a-body": a_body(), "tomb-a-cap-top": a_cap(False), "tomb-a-cap-bottom": a_cap(True),
        "tomb-b-body": b_body(), "tomb-b-cap-top": b_cap(False), "tomb-b-cap-bottom": b_cap(True),
        "tomb-c-body": c_body(), "tomb-c-cap-top": c_cap(False), "tomb-c-cap-bottom": c_cap(True),
    }
    for k, v in out.items():
        open(os.path.join(OUT, k + ".svg"), "w").write(v)
    print("ok")
