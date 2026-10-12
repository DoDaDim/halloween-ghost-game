"""preview-sheet-v03-stages.png, preview-sheet-v03-backgrounds.png, preview-sheet-v03-space.png"""
import os, json, random, io
import cairosvg
from PIL import Image, ImageDraw, ImageFont
A = os.path.join(os.path.dirname(__file__), "..")
P2 = os.path.join(A, "png/2x"); P1 = os.path.join(A, "png/1x")
HIT = json.load(open(os.path.join(A, "hitboxes.json")))
FONT = "/usr/share/fonts/truetype/sand-box/google/Capriola/Capriola-Regular.ttf"
F = {k: ImageFont.truetype(FONT, v) for k, v in (("t", 40), ("h", 24), ("s", 16))}
TXT, SUB = (255, 240, 248), (214, 200, 240)
PINK_F, PINK_O = (255, 120, 170, 60), (255, 140, 190, 255)

def night(W, H, top=(40, 33, 66), bot=(78, 62, 110), seed=9):
    img = Image.new("RGBA", (W, H)); d = ImageDraw.Draw(img)
    for y in range(H):
        t = y / H; d.line([(0, y), (W, y)], fill=tuple(int(top[i] + (bot[i] - top[i]) * t) for i in range(3)) + (255,))
    random.seed(seed)
    for _ in range(W * H // 12000):
        x, y, r = random.randint(0, W), random.randint(0, H), random.choice([1, 1, 1.5, 2])
        d.ellipse([x - r, y - r, x + r, y + r], fill=(255, 245, 225, random.randint(70, 170)))
    return img
def png(n, s=2): return Image.open(os.path.join(P2 if s == 2 else P1, n + ".png")).convert("RGBA")
def svgimg(n, scale):
    return Image.open(io.BytesIO(cairosvg.svg2png(url=os.path.join(A, n + ".svg"), scale=scale))).convert("RGBA")
def panel(img, x, y, w, h, title=None, fill=(255, 255, 255, 18)):
    o = Image.new("RGBA", img.size, (0, 0, 0, 0)); ImageDraw.Draw(o).rounded_rectangle([x, y, x + w, y + h], 24, fill=fill)
    img.alpha_composite(o)
    if title: ImageDraw.Draw(img).text((x + 30, y + 16), title, font=F["h"], fill=TXT)
def label(img, x, y, t, anchor="mm"): ImageDraw.Draw(img).text((x, y), t, font=F["s"], fill=SUB, anchor=anchor)
def hit(od, h, ox, oy, s=2):
    if not h: return
    if h.get("type") == "circle":
        cx, cy, r = ox + h["cx"] * s, oy + h["cy"] * s, h["r"] * s
        od.ellipse([cx - r, cy - r, cx + r, cy + r], fill=PINK_F, outline=PINK_O, width=3)
    for (rx, ry, rw, rh) in h.get("rects", []):
        od.rectangle([ox + rx * s, oy + ry * s, ox + (rx + rw) * s, oy + (ry + rh) * s], fill=PINK_F, outline=PINK_O, width=2)
    for (cx, cy, r) in h.get("circles", []):
        od.ellipse([ox + (cx - r) * s, oy + (cy - r) * s, ox + (cx + r) * s, oy + (cy + r) * s], fill=(255, 120, 170, 40), outline=PINK_O, width=2)
def column(img, od, p, x, y, n_body, ceiling, show_hit):
    parts = []
    if ceiling:
        for j in range(n_body): parts.append((p + "-body", x, y + j * 128))
        parts.append((p + "-cap-bottom", x, y + n_body * 128))
    else:
        parts.append((p + "-cap-top", x, y))
        for j in range(n_body): parts.append((p + "-body", x, y + 160 + j * 128))
    for n, ox, oy in parts:
        img.alpha_composite(png(n), (ox, oy))
        if show_hit: hit(od, HIT[n], ox, oy)

# ======================= 1. stage top columns =======================
def sheet_stages():
    sets = [("obs-church-spire", "church-spire"), ("obs-church-bell", "bell"), ("obs-countryside-branch", "tree-branch"),
            ("obs-countryside-scarecrow", "scarecrow"), ("obs-school-chimney", "school-chimney"), ("obs-school-clocktower", "clock-tower"),
            ("obs-city-skyscraper", "skyscraper"), ("obs-city-cranehook", "crane-hook")]
    W, H = 2200, 1860
    img = night(W, H); d = ImageDraw.Draw(img)
    d.text((60, 46), "Halloween Ghost Game · v0.3 stage TOP columns", font=F["t"], fill=TXT)
    d.text((60, 100), "each set: ceiling column (art) · ceiling column (hitbox) · floor variant (hitbox) · 2x PNGs · pink = hitboxes.json", font=F["s"], fill=SUB)
    ov = Image.new("RGBA", img.size, (0, 0, 0, 0)); od = ImageDraw.Draw(ov)
    for i, (p, tid) in enumerate(sets):
        r, c = divmod(i, 4)
        x0, y0 = 50 + c * 535, 150 + r * 860
        panel(img, x0, y0, 515, 830)
        column(img, od, p, x0 + 15, y0 + 20, 3, True, False)
        column(img, od, p, x0 + 180, y0 + 20, 3, True, True)
        column(img, od, p, x0 + 345, y0 + 440, 1, False, True)
        e = HIT["columns"][p]
        label(img, x0 + 257, y0 + 790, f"{p}  (Tuning id: {tid})")
        label(img, x0 + 257, y0 + 812, f"gap edge: floor {e['floorEdge']} · ceiling {e['ceilEdge']}")
    img.alpha_composite(ov)
    img.convert("RGB").save(os.path.join(A, "preview-sheet-v03-stages.png"), optimize=True)

# ======================= 2. backgrounds =======================
GROUND = {"graveyard": (59, 42, 85), "church": (52, 46, 88), "countryside": (40, 58, 72), "schools": (56, 46, 92), "city": (40, 36, 70), "space": None}
def composite_stage(st, ntiles, scale, with_ground=True):
    tiles = [svgimg(f"bg-{st}-{L}", scale) for L in ("far", "mid", "near")]
    w, h = tiles[0].size
    out = Image.new("RGBA", (w * ntiles, h))
    for t in tiles:
        for k in range(ntiles): out.alpha_composite(t, (k * w, 0))
    if with_ground and GROUND.get(st):
        ImageDraw.Draw(out).rectangle([0, int(560 * scale), w * ntiles, h], fill=GROUND[st] + (255,))
        ImageDraw.Draw(out).rectangle([0, int(560 * scale), w * ntiles, int(566 * scale)], fill=(107, 83, 148, 255))
    return out
def composite_seq(names_per_layer, scale, ground=None):
    first = svgimg(names_per_layer[0][0], scale); w, h = first.size
    out = Image.new("RGBA", (w * len(names_per_layer[0]), h))
    for layer in names_per_layer:
        for k, n in enumerate(layer): out.alpha_composite(svgimg(n, scale), (k * w, 0))
    if ground: ImageDraw.Draw(out).rectangle([0, int(560 * scale), out.width, h], fill=ground + (255,))
    return out, w
def seam_marks(img, x, y, w, h, xs):
    d = ImageDraw.Draw(img)
    for sx in xs:
        for yy in range(y, y + h, 10): d.line([(x + sx, yy), (x + sx, yy + 5)], fill=(255, 200, 230, 200), width=1)

def storyboard_frame(t):
    """360x640 world frame of the rocket launch at time t (s)."""
    fr = Image.new("RGBA", (360, 640))
    def put(n, x, y, scale=1.0):
        im = png(n, 1)
        if scale != 1.0: im = im.resize((int(im.width * scale), int(im.height * scale)), Image.LANCZOS)
        fr.alpha_composite(im, (int(x), int(y)))
    if t < 1.0:
        fr.alpha_composite(composite_stage("city", 1, 1.0).crop((0, 0, 360, 640)))
        put("prop-city-launchpad", 80, 420)
        rise = 0 if t < 0.8 else (t - 0.8) * 300
        ry = 392 - rise
        if t < 0.5: put("cut-rocket-idle-0", 102, ry)
        else:
            put(f"cut-rocket-flame-{2 if t < 0.8 else 1}", 102 + 48 - 24, ry + 144)
            put("cut-rocket-thrust-0", 102, ry)
            for i, (dx, s) in enumerate(((-60, 0.9), (60, 1.0), (-20, 1.2), (30, 0.8))):
                put(f"cut-smoke-puff-{min(2, int((t - 0.5) * 6) + (i % 2))}", 150 + dx - 32 * s, 500 - 10 * i, s)
    else:
        sky = png("bg-launch-sky", 1)
        p = min(1.0, (t - 1.0) / 1.2); p = p * p * (3 - 2 * p)
        top = int((1920 - 640) * (1 - p))
        fr.alpha_composite(sky.crop((0, top, 360, top + 640)))
        if t >= 2.3:
            sp = composite_stage("space", 1, 1.0, False).crop((0, 0, 360, 640)); sp.putalpha(Image.eval(sp.getchannel("A"), lambda a: int(a * min(1, (t - 2.3) / 0.2))))
            fr.alpha_composite(sp)
        ry = 250 - (t - 1.0) * 40
        put(f"cut-rocket-flame-{int(t * 15) % 3}", 132 + 24, ry + 144)
        put(f"cut-rocket-thrust-{int(t * 12) % 2}", 132, ry)
        if 1.1 < t < 2.1:
            put("cut-cloud-a", -40 + (t - 1.1) * 30, 120 + (t - 1.1) * 560)
            put("cut-cloud-c", 220, 40 + (t - 1.1) * 700)
    return fr

def sheet_backgrounds():
    W, H = 1560, 4420
    img = night(W, H, seed=12); d = ImageDraw.Draw(img)
    d.text((60, 46), "Halloween Ghost Game · v0.3 parallax backgrounds", font=F["t"], fill=TXT)
    d.text((60, 100), "far + mid + near composited · each tile 720×640 world px (here 0.5×), two tiles side by side, dashes = tile seams · ground band = Code's", font=F["s"], fill=SUB)
    y = 150
    panel(img, 30, y, W - 60, 1150, "Stages (each loops seamlessly)")
    for i, st in enumerate(["graveyard", "church", "countryside", "schools", "city", "space"]):
        r, c = divmod(i, 2)
        x0, y0 = 60 + c * 740, y + 60 + r * 360
        im = composite_stage(st, 2, 0.5)
        im = im.resize((720, 320), Image.LANCZOS)
        img.alpha_composite(im, (x0, y0)); seam_marks(img, x0, y0, 720, 320, [360])
        label(img, x0 + 360, y0 + 334, f"bg-{st}-far / -mid / -near" + ("  (endless final zone)" if st == "space" else ""))
    y += 1170
    panel(img, 30, y, W - 60, 1750, "Transitions in sequence: outgoing tile  |  bg-trans-<from>-<to>-<layer>  |  incoming tile  (0.6x)")
    O = ["graveyard", "church", "countryside", "schools", "city"]
    for i, (a, b) in enumerate(zip(O, O[1:])):
        x0, y0 = 40, y + 60 + i * 420
        seq = [[f"bg-{a}-{L}", f"bg-trans-{a}-{b}-{L}", f"bg-{b}-{L}"] for L in ("far", "mid", "near")]
        im, w = composite_seq(seq, 0.6, GROUND[b])
        img.alpha_composite(im, (x0 + 20, y0)); seam_marks(img, x0 + 20, y0, im.width, im.height, [w, 2 * w])
        label(img, x0 + 20 + w * 1.5, y0 + im.height + 14, f"bg-{a}  |  bg-trans-{a}-{b}  |  bg-{b}")
    y += 1770
    panel(img, 30, y, W - 60, 620, "Rocket launch cutscene (2.5 s, no hitboxes) — storyboard at 360×640 world size, 0.62×")
    times = [0.0, 0.6, 0.95, 1.4, 1.95, 2.45]
    names = ["0.0 s idle on pad", "0.6 s ignition + smoke", "0.95 s lift-off", "1.4 s through the clouds", "1.95 s upper sky", "2.45 s fade into space"]
    for i, t in enumerate(times):
        fr = storyboard_frame(t).resize((223, 397), Image.LANCZOS)
        x0 = 60 + i * 243
        img.alpha_composite(fr, (x0, y + 70))
        label(img, x0 + 111, y + 485, names[i])
    d = ImageDraw.Draw(img)
    d.text((60, y + 515), "Frames: idle 0/1 (4 fps), then thrust 0/1 (12 fps, 1 px shake) + flame 0,1,2 (15 fps) at the nozzle; smoke puffs 0,1,2 as growing particles.\nbg-launch-sky pans bottom to top from 1.0 to 2.2 s while cut-cloud-* rush downward; space layers fade in over the last 0.2 s.", font=F["s"], fill=SUB)
    y += 640
    panel(img, 30, y, W - 60, 380, "Space loops forever (3 tiles shown)")
    im = composite_stage("space", 3, 0.5, False).resize((1080, 320), Image.LANCZOS)
    img.alpha_composite(im, (60, y + 50)); seam_marks(img, 60, y + 50, 1080, 320, [360, 720])
    d.text((1170, y + 80), "bg-space-far (0.05×)\nbg-space-mid (0.15×)\nbg-space-near (0.5×, optional)\n\nNo ground band: Code\nkeeps its floor line\n(see ASSETS.md §6).", font=F["s"], fill=SUB)
    img.convert("RGB").save(os.path.join(A, "preview-sheet-v03-backgrounds.png"), optimize=True)

# ======================= 3. space set =======================
def sheet_space():
    W, H = 1800, 1980
    img = Image.new("RGBA", (W, H))
    bgtile = svgimg("bg-space-far", H / 640 + 0.01)
    img.alpha_composite(bgtile.crop((0, 0, W, H)))
    d = ImageDraw.Draw(img)
    d.text((60, 46), "Halloween Ghost Game · v0.3 space set", font=F["t"], fill=TXT)
    d.text((60, 100), "on the bg-space layers · 2x PNGs · pink = hitboxes.json", font=F["s"], fill=SUB)
    ov = Image.new("RGBA", img.size, (0, 0, 0, 0)); od = ImageDraw.Draw(ov)
    y = 150
    panel(img, 30, y, W - 60, 760, "Columns — top: satellite (2) · ufo (1)   bottom: asteroid = moon-rock (2) · floating tomb-a (1)", fill=(20, 16, 40, 140))
    x = 60
    for p, name in (("obs-space-satellite", "obs-space-satellite"), ("obs-space-ufo", "obs-space-ufo"),
                    ("obs-space-moonrock", "asteroid = obs-space-moonrock"), ("tomb-a", "tomb-a (floating, reused)")):
        column(img, od, p, x, y + 60, 1, True, False); column(img, od, p, x + 175, y + 60, 1, True, True)
        column(img, od, p, x, y + 380, 1, False, False); column(img, od, p, x + 175, y + 380, 1, False, True)
        label(img, x + 167, y + 700, name); x += 420
    y += 780
    panel(img, 30, y, W - 60, 330, "Between-pair hazards · meteor event · golden pickup (space glow)", fill=(20, 16, 40, 140))
    x, yy = 60, y + 70
    mini = png("obs-space-miniasteroid")
    for k, ang in enumerate((0, 90, 180, 270)):
        img.alpha_composite(mini.rotate(-ang, resample=Image.BICUBIC), (x, yy)); label(img, x + 40, yy + 110, f"spin {ang}°"); x += 90
    img.alpha_composite(mini, (x, yy)); hit(od, HIT["hazards"]["miniAsteroid"], x, yy); label(img, x + 40, yy + 110, "r13"); x += 110
    for f in "01":
        img.alpha_composite(png(f"obs-space-alien-{f}"), (x, yy)); label(img, x + 40, yy + 110, f"alien-{f}"); x += 90
    img.alpha_composite(png("obs-space-alien-0"), (x, yy)); hit(od, HIT["hazards"]["alien"], x, yy); label(img, x + 40, yy + 110, "r13"); x += 110
    for f in "01":
        img.alpha_composite(png(f"event-space-meteor-{f}"), (x, yy - 8)); label(img, x + 72, yy + 110, f"meteor-{f}"); x += 160
    img.alpha_composite(png("event-space-meteor-0"), (x, yy - 8)); hit(od, HIT["events"]["space-meteor"], x, yy - 8); label(img, x + 72, yy + 110, "r12"); x += 170
    for n, l in (("pickup-golden-ghost-0", "normal pickup"), ("pickup-golden-ghost-space-0", "space-0"), ("pickup-golden-ghost-space-1", "space-1")):
        img.alpha_composite(png(n), (x, yy - 16)); label(img, x + 56, yy + 110, l); x += 125
    img.alpha_composite(png("pickup-golden-ghost-space-2"), (x, yy - 16)); hit(od, HIT["pickups"]["golden-ghost-space"], x, yy - 16); label(img, x + 56, yy + 110, "r16")
    d = ImageDraw.Draw(img)
    d.text((60, y + 210), "Meteor shower: meteors enter from the top-right and travel down-left along their trail (mirror horizontally for a top-left entry). Frames 0/1 at 10 fps.\nMini asteroid: rotate the single sprite about (20,20). Alien: frames 0/1 at 3 fps (built-in 1.5 px bob).", font=F["s"], fill=SUB)
    y += 350
    panel(img, 30, y, W - 60, 660, "Rocket launch kit (no hitboxes)", fill=(20, 16, 40, 140))
    x = 60
    for n in ("cut-rocket-idle-0", "cut-rocket-idle-1", "cut-rocket-thrust-0", "cut-rocket-thrust-1"):
        img.alpha_composite(png(n), (x, y + 70)); label(img, x + 96, y + 380, n.replace("cut-rocket-", "rocket ")); x += 210
    for f in "012":
        img.alpha_composite(png(f"cut-rocket-flame-{f}"), (x, y + 90)); label(img, x + 48, y + 380, f"flame-{f}"); x += 110
    x += 60
    rk = png("cut-rocket-thrust-0"); fl = png("cut-rocket-flame-1")
    img.alpha_composite(fl, (x + 96 - 48, y + 70 + 288 - 60)); img.alpha_composite(rk.crop((0, 0, 192, 296)), (x, y + 10))
    label(img, x + 96, y + 380, "assembled (flame top at nozzle)")
    x, yy = 60, y + 420
    for f in "012":
        img.alpha_composite(png(f"cut-smoke-puff-{f}"), (x, yy)); label(img, x + 64, yy + 140, f"smoke-{f}"); x += 150
    for v in "abc":
        img.alpha_composite(png(f"cut-cloud-{v}"), (x, yy + 10)); label(img, x + 160, yy + 140, f"cloud-{v}"); x += 335
    img.alpha_composite(ov)
    img.convert("RGB").save(os.path.join(A, "preview-sheet-v03-space.png"), optimize=True)

if __name__ == "__main__":
    sheet_stages(); sheet_backgrounds(); sheet_space(); print("ok")
