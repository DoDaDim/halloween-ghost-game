"""Compose assets/preview-sheet-v03-extras.png (2x PNGs), hitboxes overlaid in pink from hitboxes.json."""
import os, json, random
from PIL import Image, ImageDraw, ImageFont
A = os.path.join(os.path.dirname(__file__), "..")
P2 = os.path.join(A, "png/2x")
HIT = json.load(open(os.path.join(A, "hitboxes.json")))
FONT = "/usr/share/fonts/truetype/sand-box/google/Capriola/Capriola-Regular.ttf"
f_title, f_h, f_s = ImageFont.truetype(FONT, 40), ImageFont.truetype(FONT, 24), ImageFont.truetype(FONT, 16)
W, H = 1800, 2450
img = Image.new("RGBA", (W, H)); d = ImageDraw.Draw(img)
top, bot = (40, 33, 66), (78, 62, 110)
for y in range(H):
    t = y / H; d.line([(0, y), (W, y)], fill=tuple(int(top[i] + (bot[i] - top[i]) * t) for i in range(3)) + (255,))
random.seed(9)
for _ in range(160):
    x, y, r = random.randint(0, W), random.randint(0, H), random.choice([1, 1, 1.5, 2])
    d.ellipse([x - r, y - r, x + r, y + r], fill=(255, 245, 225, random.randint(80, 180)))
d.ellipse([W - 190, 40, W - 70, 160], fill=(255, 241, 214, 255)); d.ellipse([W - 160, 30, W - 50, 140], fill=top + (255,))
TXT, SUB = (255, 240, 248), (214, 200, 240)
d.text((60, 50), "Halloween Ghost Game · v0.3 extras", font=f_title, fill=TXT)
d.text((60, 104), "2x PNGs · pink = hitbox from hitboxes.json · ambient row has NO hitboxes", font=f_s, fill=SUB)
def png(n): return Image.open(os.path.join(P2, n + ".png")).convert("RGBA")
ov = Image.new("RGBA", img.size, (0, 0, 0, 0)); od = ImageDraw.Draw(ov)
def panel(x, y, w, h, title):
    o = Image.new("RGBA", img.size, (0, 0, 0, 0)); ImageDraw.Draw(o).rounded_rectangle([x, y, x + w, y + h], 24, fill=(255, 255, 255, 18))
    img.alpha_composite(o); ImageDraw.Draw(img).text((x + 30, y + 16), title, font=f_h, fill=TXT)
def label(x, y, t): ImageDraw.Draw(img).text((x, y), t, font=f_s, fill=SUB, anchor="mm")
PINK_F, PINK_O = (255, 120, 170, 70), (255, 140, 190, 255)
def hit(h, ox, oy, s=2):
    if not h: return
    if h.get("type") == "circle":
        cx, cy, r = ox + h["cx"] * s, oy + h["cy"] * s, h["r"] * s
        od.ellipse([cx - r, cy - r, cx + r, cy + r], fill=PINK_F, outline=PINK_O, width=3)
    for (rx, ry, rw, rh) in h.get("rects", []):
        od.rectangle([ox + rx * s, oy + ry * s, ox + (rx + rw) * s, oy + (ry + rh) * s], fill=PINK_F, outline=PINK_O, width=3)
    for (cx, cy, r) in h.get("circles", []):
        od.ellipse([ox + (cx - r) * s, oy + (cy - r) * s, ox + (cx + r) * s, oy + (cy + r) * s], fill=(255, 120, 170, 40), outline=PINK_O, width=3)
def paste(n, x, y, show_hit=None):
    img.alpha_composite(png(n), (x, y))
    if show_hit is not None: hit(show_hit, x, y)

# ---- 1. columns
y0 = 150
panel(40, y0, W - 80, 640, "Columns (72px footprint): coffin & cross (common), moon-rock (space). Pumpkin shown on its seat.")
pre = {"coffin": "obs-common-coffin", "cross": "obs-common-cross", "moonrock": "obs-space-moonrock"}
for i, k in enumerate(["coffin", "cross", "moonrock"]):
    x = 80 + i * 570; y = y0 + 80
    p = pre[k]; seat = HIT["columns"][k]["pumpkinSeat"]
    for hb, ox in ((False, 0), (True, 180), (True, 360)):
        if ox < 360:   # floor column
            yy = y + 60
            paste(p + "-cap-top", x + ox, yy, HIT[p + "-cap-top"] if hb else None)
            if not hb: paste("obs-common-pumpkin", x + ox + (seat[0] - 20) * 2, yy + (seat[1] - 38) * 2 + 2)
            for j in range(2): paste(p + "-body", x + ox, yy + 160 + j * 128, HIT[p + "-body"] if hb else None)
        else:          # ceiling column with hitboxes
            for j in range(2): paste(p + "-body", x + ox, y + j * 128, HIT[p + "-body"])
            paste(p + "-cap-bottom", x + ox, y + 256, HIT[p + "-cap-bottom"])
    label(x + 260, y0 + 610, {"coffin": "obs-common-coffin-*", "cross": "obs-common-cross-*", "moonrock": "obs-space-moonrock-*  (space bottom column)"}[k])
y0 += 660

# ---- 2. hazards + pickups
panel(40, y0, W - 80, 330, "Between-pair hazards (bat r12 · pumpkin r14 · skull r13) and pickups (golden ghost r16 · sweets r10)")
x = 80; y = y0 + 80
for n in ["obs-common-bat-flap-0", "obs-common-bat-flap-1", "obs-common-bat-flap-2"]:
    paste(n, x, y); label(x + 48, y + 120, n.replace("obs-common-", "")); x += 110
paste("obs-common-bat-flap-1", x, y, HIT["hazards"]["bat"]); label(x + 48, y + 120, "bat hit"); x += 120
paste("obs-common-pumpkin", x, y + 8); label(x + 40, y + 120, "pumpkin"); x += 95
paste("obs-common-pumpkin", x, y + 8, HIT["hazards"]["pumpkin"]); label(x + 40, y + 120, "hit"); x += 105
for n in ["obs-common-skull-0", "obs-common-skull-1"]:
    paste(n, x, y + 8); label(x + 40, y + 120, n.replace("obs-common-", "")); x += 95
paste("obs-common-skull-0", x, y + 8, HIT["hazards"]["skull"]); label(x + 40, y + 120, "hit"); x += 115
for n in ["pickup-golden-ghost-0", "pickup-golden-ghost-1", "pickup-golden-ghost-2"]:
    paste(n, x, y - 8); label(x + 56, y + 120, n.replace("pickup-golden-ghost", "golden")); x += 120
paste("pickup-golden-ghost-0", x, y - 8, HIT["pickups"]["golden-ghost"]); label(x + 56, y + 120, "hit"); x += 125
for n in ["wrapped", "lollipop", "macaron"]:
    paste("pickup-sweet-" + n, x, y + 10, HIT["pickups"]["sweet-" + n] if False else None); label(x + 32, y + 120, n); x += 75
x = 80; y = y0 + 220
d = ImageDraw.Draw(img)
d.text((x, y), "Pumpkin rolling (countryside event): rotate the single sprite about (20,23), angle += dx / 14.5 rad.  Sweets hit r10 shown below:", font=f_s, fill=SUB)
x = 1150
for n in ["wrapped", "lollipop", "macaron"]:
    paste("pickup-sweet-" + n, x, y + 30, HIT["pickups"]["sweet-" + n]); x += 80
y0 += 350

# ---- 3. events
panel(40, y0, W - 80, 560, "One-time events · event-<stage>-<name> · '!' warning marker")
x, y = 80, y0 + 80
paste("event-graveyard-hearse-0", x, y); paste("event-graveyard-hearse-1", x + 340, y); paste("event-graveyard-hearse-0", x + 680, y, HIT["events"]["graveyard-hearse"])
label(x + 160, y + 145, "graveyard-hearse-0"); label(x + 500, y + 145, "hearse-1 (wheel spin)"); label(x + 840, y + 145, "hit · 60px tall · right-to-left 175 px/s")
for i, n in enumerate(["ui-event-warning-0", "ui-event-warning-1"]):
    paste(n, 1160 + i * 110, y + 20); label(1200 + i * 110, y + 120, n.replace("ui-event-", ""))
d = ImageDraw.Draw(img); d.text((1400, y + 30), "flip for left edge,\nrotate -90° for top\n(sweet shower)", font=f_s, fill=SUB)
y += 175
paste("event-city-nightbus-0", x, y); paste("event-city-nightbus-1", x + 400, y); paste("event-city-nightbus-0", x + 800, y, HIT["events"]["city-nightbus"])
label(x + 192, y + 165, "city-nightbus-0"); label(x + 592, y + 165, "nightbus-1 (wheel spin)"); label(x + 992, y + 165, "hit · 70px tall · right-to-left 160 px/s")
y += 195
for i in range(3): paste(f"event-city-pigeon-flap-{i}", x + i * 100, y); label(x + 40 + i * 100, y + 92, f"pigeon-{i}")
paste("event-city-pigeon-flap-1", x + 310, y, HIT["events"]["city-pigeon"]); label(x + 350, y + 92, "hit r10")
d = ImageDraw.Draw(img)
d.text((x + 460, y + 10), "Church bat swarm reuses obs-common-bat · countryside pumpkin roll reuses obs-common-pumpkin\nSchools sweet shower reuses pickup-sweet-* (no hazard)", font=f_s, fill=SUB)
y0 += 580

# ---- 4. ambient
panel(40, y0, W - 80, 680, "Ambient — decorative only, NO hitboxes")
x, y = 80, y0 + 70
# fog over a mini graveyard strip so it reads
paste("tomb-a-cap-top", x + 60, y + 60); paste("tomb-c-cap-top", x + 400, y + 40)
paste("amb-graveyard-fog-back", x, y); paste("amb-graveyard-fog-front", x, y + 80)
label(x + 360, y + 255, "amb-graveyard-fog-back (360×120) + fog-front (360×80), tile horizontally")
xx = 860
paste("amb-church-bird-perch", xx, y + 40); label(xx + 24, y + 110, "bird-perch")
for i in range(3): paste(f"amb-church-bird-fly-{i}", xx + 80 + i * 70, y + 40); label(xx + 104 + i * 70, y + 110, f"fly-{i}")
paste("amb-school-bike-mint", xx + 320, y + 10); paste("amb-school-bike-pink", xx + 480, y + 10)
label(xx + 392, y + 120, "amb-school-bike-mint"); label(xx + 552, y + 120, "bike-pink")
y += 290
for i in range(3):
    o = Image.new("RGBA", (256, 256), (46, 58, 86, 255)); o.alpha_composite(png(f"amb-city-rain-{i}"))
    img.alpha_composite(o, (x + i * 280, y)); label(x + 128 + i * 280, y + 275, f"amb-city-rain-{i} (128 tile)")
xx = 950
for i in range(3): paste(f"amb-space-star-{i}", xx + i * 60, y + 40); label(xx + 16 + i * 60, y + 95, f"star-{i}")
o = Image.new("RGBA", (360, 360), (24, 20, 46, 255)); o.alpha_composite(png("amb-space-starfield"))
img.alpha_composite(o.resize((240, 240)), (xx + 210, y)); label(xx + 330, y + 260, "amb-space-starfield (180 tile)")
img.alpha_composite(ov)
img.convert("RGB").save(os.path.join(A, "preview-sheet-v03-extras.png"), optimize=True)
print("ok", y0 + 780)
