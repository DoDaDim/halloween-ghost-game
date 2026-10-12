"""Hand-authored SVG chibi ghost frames (original art). Writes SVGs into assets/."""
import os
OUT = os.path.join(os.path.dirname(__file__), "..")

PAL = {
    "normal": dict(body_hi="#FFFFFF", body_lo="#E6DDF7", shade="#D3C6EE", line="#6B4E7A",
                   eye="#4A3358", eye2="#7A5A9E", blush="#FFB3CB", mouth="#E87FA3", arm="#F3EEFC"),
    "golden": dict(body_hi="#FFF7D6", body_lo="#FFD873", shade="#F6C766", line="#8E5A3C",
                   eye="#5A3828", eye2="#A0674A", blush="#FF9EA8", mouth="#E8798A", arm="#FFF0BE"),
}

# frame definitions: dy = body bob, arm = (y, angle) per side, tail sway, eyes, mouth
FRAMES = {
    "idle-0": dict(dy=0,   arm=(37, 20),  sway=0,    eyes="open",  mouth="w"),
    "idle-1": dict(dy=1,   arm=(38, 26),  sway=1.2,  eyes="blink", mouth="w"),
    "flap-0": dict(dy=0,   arm=(32, -42), sway=-1.6, eyes="open",  mouth="o"),   # arms up
    "flap-1": dict(dy=0,   arm=(36, 0),   sway=0,    eyes="open",  mouth="o"),   # mid
    "flap-2": dict(dy=0,   arm=(39, 40),  sway=1.8,  eyes="open",  mouth="w"),   # arms down
}

def body_path(s):
    # dome head + three soft wisps; s = tail sway
    return (f"M12,30 C12,17 21,8 32,8 C43,8 52,17 52,30 L52,43 "
            f"C52,49 50,53 {46+s:.1f},{56:.1f} "
            f"C43,55.5 41,52 38.5,52 "
            f"C36,52 35,57.5 {32+s:.1f},58.5 "
            f"C29,57.5 28,52 25.5,52 "
            f"C23,52 21,55.5 {18+s:.1f},56 "
            f"C14,53 12,49 12,43 Z")

def sparkle(x, y, r, fill, line, op=1.0):
    k = r * 0.28
    return (f'<path d="M{x},{y-r} Q{x+k},{y-k} {x+r},{y} Q{x+k},{y+k} {x},{y+r} '
            f'Q{x-k},{y+k} {x-r},{y} Q{x-k},{y-k} {x},{y-r} Z" fill="{fill}" stroke="{line}" '
            f'stroke-width="0.9" stroke-linejoin="round" opacity="{op}"/>')

GOLD_SPARKLES = {
    "idle-0": [(8, 13, 3.6, 1), (56.5, 9, 2.6, .9), (57, 51, 2.2, .8)],
    "idle-1": [(9, 14, 2.4, .8), (56, 10, 3.6, 1), (6.5, 48, 2.2, .85)],
    "flap-0": [(7, 15, 3.2, 1), (57, 49, 3.0, .95), (55.5, 8, 2.0, .8)],
    "flap-1": [(8.5, 12, 2.6, .9), (57, 12, 3.0, 1), (7, 51, 2.6, .9)],
    "flap-2": [(56.5, 10, 3.4, 1), (7.5, 10, 2.2, .8), (57.5, 52, 2.4, .9)],
}

def ghost_svg(kind, fname):
    p, f = PAL[kind], FRAMES[fname]
    dy, (ay, ang), s = f["dy"], f["arm"], f["sway"]
    L = p["line"]
    g = []
    g.append(f'<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">')
    g.append(f'''<defs>
  <radialGradient id="b" cx="0.38" cy="0.3" r="0.8">
    <stop offset="0" stop-color="{p["body_hi"]}"/><stop offset="0.55" stop-color="{p["body_hi"]}"/>
    <stop offset="1" stop-color="{p["body_lo"]}"/></radialGradient>
  <linearGradient id="e" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0.35" stop-color="{p["eye"]}"/><stop offset="1" stop-color="{p["eye2"]}"/></linearGradient>
  <radialGradient id="glow"><stop offset="0.45" stop-color="#FFE7A0" stop-opacity="0.55"/>
    <stop offset="1" stop-color="#FFE7A0" stop-opacity="0"/></radialGradient>
  <radialGradient id="sh" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="{p["shade"]}" stop-opacity="0.8"/>
    <stop offset="1" stop-color="{p["shade"]}" stop-opacity="0"/></radialGradient>
  <clipPath id="c"><path d="{body_path(s)}"/></clipPath>
</defs>''')
    if kind == "golden":
        # soft glow behind
        g.append(f'<circle cx="32" cy="{33+dy}" r="31" fill="url(#glow)"/>')
    g.append(f'<g transform="translate(0,{dy})">')
    # arms (behind body)
    for side, x in ((-1, 13.5), (1, 50.5)):
        a = ang * side  # mirror: positive ang = arm tips down
        g.append(f'<ellipse cx="{x + side*4.2}" cy="{ay}" rx="6.2" ry="4" fill="{p["arm"]}" stroke="{L}" '
                 f'stroke-width="2" transform="rotate({a} {x} {ay})"/>')
    # body
    g.append(f'<path d="{body_path(s)}" fill="url(#b)"/>')
    # inner shading (lower right) + top gloss, clipped to body
    g.append(f'<g clip-path="url(#c)"><ellipse cx="47" cy="47" rx="17" ry="16" fill="url(#sh)"/>'
             f'<ellipse cx="22" cy="57" rx="13" ry="7" fill="url(#sh)"/></g>')
    g.append(f'<path d="{body_path(s)}" fill="none" stroke="{L}" stroke-width="2.2" stroke-linejoin="round"/>')
    g.append(f'<ellipse cx="22" cy="15.5" rx="4.2" ry="2.4" fill="#FFFFFF" opacity="0.9" transform="rotate(-28 22 15.5)"/>')
    g.append(f'<circle cx="28.5" cy="12.3" r="1.1" fill="#FFFFFF" opacity="0.9"/>')
    # blush
    for cx in (18.8, 45.2):
        g.append(f'<ellipse cx="{cx}" cy="35.2" rx="3.6" ry="2.1" fill="{p["blush"]}" opacity="0.85"/>')
    g.append(f'<g stroke="#FFFFFF" stroke-width="0.7" stroke-linecap="round" opacity="0.8">'
             f'<path d="M16.8,34.6 l0.9,-1.2 M18.6,34.8 l0.9,-1.2"/><path d="M43.2,34.6 l0.9,-1.2 M45,34.8 l0.9,-1.2"/></g>')
    # eyes
    if f["eyes"] == "open":
        for cx in (24.2, 39.8):
            g.append(f'<ellipse cx="{cx}" cy="28.6" rx="4.3" ry="5.3" fill="url(#e)"/>')
            g.append(f'<ellipse cx="{cx-1.3}" cy="26.6" rx="1.8" ry="2.1" fill="#FFFFFF"/>')
            g.append(f'<circle cx="{cx+1.6}" cy="31" r="0.95" fill="#FFFFFF"/>')
            g.append(f'<circle cx="{cx+2.2}" cy="27.2" r="0.5" fill="#FFFFFF" opacity="0.8"/>')
    else:
        for cx in (24.2, 39.8):
            g.append(f'<path d="M{cx-4},29.2 Q{cx},32.6 {cx+4},29.2" fill="none" stroke="{p["eye"]}" stroke-width="2" stroke-linecap="round"/>')
            g.append(f'<path d="M{cx+3.6},29.4 l1.4,-1" stroke="{p["eye"]}" stroke-width="1.2" stroke-linecap="round"/>')
    # mouth
    if f["mouth"] == "w":
        g.append(f'<path d="M29.4,34.4 Q30.7,36.4 32,34.6 Q33.3,36.4 34.6,34.4" fill="none" stroke="{L}" '
                 f'stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>')
    else:
        g.append(f'<ellipse cx="32" cy="35.4" rx="1.9" ry="2.2" fill="{p["mouth"]}" stroke="{L}" stroke-width="1.2"/>')
        g.append(f'<ellipse cx="32" cy="36.4" rx="1" ry="0.7" fill="#FFC4D4"/>')
    if kind == "golden":
        # tiny heart-sparkle on head
        g.append(sparkle(40.5, 14.5, 2.4, "#FFFFFF", "#F2B84B"))
    g.append('</g>')
    if kind == "golden":
        for (x, y, r, op) in GOLD_SPARKLES[fname]:
            g.append(sparkle(x, y, r, "#FFF4B8", "#D9953A", op))
    g.append('</svg>')
    return "\n".join(g)

if __name__ == "__main__":
    for kind in PAL:
        for fname in FRAMES:
            with open(os.path.join(OUT, f"ghost-{kind}-{fname}.svg"), "w") as fh:
                fh.write(ghost_svg(kind, fname))
    print("ok")
