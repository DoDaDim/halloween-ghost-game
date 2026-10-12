"""Compose assets/preview-sheet.png from the 2x PNGs, with hitbox overlay row."""
import os, json, random
from PIL import Image, ImageDraw, ImageFont
A = os.path.join(os.path.dirname(__file__), "..")
P2 = os.path.join(A, "png/2x")
HIT = json.load(open(os.path.join(A, "hitboxes.json")))
FONT = "/usr/share/fonts/truetype/sand-box/google/Capriola/Capriola-Regular.ttf"
f_title, f_h, f_s = ImageFont.truetype(FONT, 40), ImageFont.truetype(FONT, 24), ImageFont.truetype(FONT, 17)
W, H = 1800, 1890
img = Image.new("RGBA", (W, H))
top, bot = (40, 33, 66), (78, 62, 110)
d = ImageDraw.Draw(img)
for y in range(H):
    t = y / H; d.line([(0, y), (W, y)], fill=tuple(int(top[i] + (bot[i] - top[i]) * t) for i in range(3)) + (255,))
random.seed(7)
for _ in range(140):
    x, y, r = random.randint(0, W), random.randint(0, H), random.choice([1, 1, 1.5, 2])
    d.ellipse([x - r, y - r, x + r, y + r], fill=(255, 245, 225, random.randint(90, 200)))
# moon
d.ellipse([W - 190, 40, W - 70, 160], fill=(255, 241, 214, 255)); d.ellipse([W - 160, 30, W - 50, 140], fill=top + (255,))
TXT, SUB, PANEL = (255, 240, 248), (214, 200, 240), (255, 255, 255, 18)
d.text((60, 50), "Halloween Ghost Game · art preview", font=f_title, fill=TXT)
d.text((60, 104), "pastel kawaii · 2x PNGs shown (1x = half size) · all frames share one 64×64 canvas", font=f_s, fill=SUB)

def png(n): return Image.open(os.path.join(P2, n + ".png")).convert("RGBA")
def panel(x, y, w, h):
    o = Image.new("RGBA", img.size, (0, 0, 0, 0)); ImageDraw.Draw(o).rounded_rectangle([x, y, x + w, y + h], 24, fill=PANEL)
    img.alpha_composite(o)
FR = ["idle-0", "idle-1", "flap-0", "flap-1", "flap-2"]
LBL = ["idle 0", "idle 1 (blink)", "flap 0 (up)", "flap 1 (mid)", "flap 2 (down)"]
y0 = 160
for kind, title in (("normal", "Chibi ghost — normal"), ("golden", "Chibi ghost — rare golden")):
    panel(40, y0, W - 80, 290)
    d.text((70, y0 + 18), title, font=f_h, fill=TXT)
    for i, fr in enumerate(FR):
        x = 90 + i * 330
        im = png(f"ghost-{kind}-{fr}").resize((192, 192), Image.LANCZOS)  # 3x for visibility
        img.alpha_composite(im, (x, y0 + 60))
        d.text((x + 96, y0 + 262), f"ghost-{kind}-{fr}  ·  {LBL[i]}", font=f_s, fill=SUB, anchor="mm")
    y0 += 310

def column(x, y, p, n_body=2, ceiling=False):
    """paste a column at 2x. returns list of (sprite_name, ox, oy) for hitbox overlay"""
    parts = []
    if not ceiling:
        parts.append((f"tomb-{p}-cap-top", x, y)); yy = y + 160
        for _ in range(n_body): parts.append((f"tomb-{p}-body", x, yy)); yy += 128
    else:
        yy = y
        for _ in range(n_body): parts.append((f"tomb-{p}-body", x, yy)); yy += 128
        parts.append((f"tomb-{p}-cap-bottom", x, yy))
    for n, ox, oy in parts: img.alpha_composite(png(n), (ox, oy))
    return parts

NAMES = {"a": "A · rounded RIP + moss", "b": "B · cross + flowers", "c": "C · sleepy stacked stones"}
panel(40, y0, W - 80, 560)
d.text((70, y0 + 18), "Tombstone obstacles — floor column (cap-top + body×2) and ceiling column (body×2 + cap-bottom)", font=f_h, fill=TXT)
cols = {}
for i, p in enumerate("abc"):
    x = 90 + i * 560
    cols[p] = (column(x, y0 + 70, p), column(x + 200, y0 + 70, p, ceiling=True))
    d.text((x + 180, y0 + 530), NAMES[p], font=f_s, fill=SUB, anchor="mm")
y0 += 580

# hitbox row
panel(40, y0, W - 80, 500)
d.text((70, y0 + 18), "Hitboxes (pink, from hitboxes.json) — deliberately a little smaller than the art", font=f_h, fill=TXT)
ov = Image.new("RGBA", img.size, (0, 0, 0, 0)); od = ImageDraw.Draw(ov)
def draw_hit(name, ox, oy, s=2):
    key = "ghost" if name.startswith("ghost") else name
    h = HIT[key]
    if h.get("type") == "circle":
        cx, cy, r = h["cx"] * s + ox, h["cy"] * s + oy, h["r"] * s
        od.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(255, 120, 170, 70), outline=(255, 140, 190, 255), width=3)
    for (rx, ry, rw, rh) in h.get("rects", []):
        od.rectangle([ox + rx * s, oy + ry * s, ox + (rx + rw) * s, oy + (ry + rh) * s], fill=(255, 120, 170, 60), outline=(255, 140, 190, 255), width=3)
    for (cx, cy, r) in h.get("circles", []):
        od.ellipse([ox + (cx - r) * s, oy + (cy - r) * s, ox + (cx + r) * s, oy + (cy + r) * s], fill=(255, 120, 170, 40), outline=(255, 140, 190, 255), width=3)
gx = 90
for kind, fr in (("normal", "idle-0"), ("normal", "flap-0"), ("golden", "flap-2")):
    im = png(f"ghost-{kind}-{fr}")
    img.alpha_composite(im, (gx, y0 + 110)); draw_hit("ghost", gx, y0 + 110, s=2)
    d.text((gx + 64, y0 + 255), f"{kind} {fr}", font=f_s, fill=SUB, anchor="mm"); gx += 170
d.text((90, y0 + 320), "Ghost: 64×64 canvas, anchor = centre (32,32).", font=f_s, fill=SUB)
d.text((90, y0 + 348), "Hit circle (32,33) r=18 vs art ~r=21, so near-misses feel fair.", font=f_s, fill=SUB)
d.text((90, y0 + 376), "Arms, tail wisps, sparkles & glow never collide.", font=f_s, fill=SUB)
for i, p in enumerate("abc"):
    x = 640 + i * 370
    for parts in (column(x, y0 + 70, p, n_body=1), column(x + 175, y0 + 70, p, n_body=1, ceiling=True)):
        for n, ox, oy in parts: draw_hit(n, ox, oy)
    d.text((x + 167, y0 + 375), f"tomb-{p}", font=f_s, fill=SUB, anchor="mm")
img.alpha_composite(ov)
d = ImageDraw.Draw(img)
d.text((640, y0 + 410), "Column body hit = 64px-wide rect (4px inset per side); caps add arch circle / cross rects.", font=f_s, fill=SUB)
d.text((640, y0 + 438), "Flowers, moss tufts, z's and leaf tips are decorative only.", font=f_s, fill=SUB)
img.convert("RGB").save(os.path.join(A, "preview-sheet.png"), optimize=True)
print(img.size, y0 + 650)
