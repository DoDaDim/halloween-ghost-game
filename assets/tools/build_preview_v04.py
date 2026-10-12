"""preview-sheet-v04-obstacles.png: per stage, TOP (hanging) sets and BOTTOM (standing) sets side by side,
each as art + hitbox overlay at 2x, plus a 1x game-size mock on the stage background."""
import os, json, io
import cairosvg
from PIL import Image, ImageDraw
from build_preview_v03b import night, png, svgimg, panel, label, hit, F, TXT, SUB, GROUND
from build_v04_obstacles import STAGE_TOPS, STAGE_BOTTOMS, RETIRED_TOPS
A = os.path.join(os.path.dirname(__file__), "..")
HIT = json.load(open(os.path.join(A, "hitboxes.json")))
COL = HIT["columns"]
NEW = {k for k, v in COL.items() if isinstance(v, dict) and v.get("side")}
def art(cid): return COL[cid]["files"].split("-{")[0]

def ceiling(img, od, p, x, y, show):   # 1 body + cap-bottom; bottom of cap at y+288
    for n, oy in ((p + "-body", y), (p + "-cap-bottom", y + 128)):
        img.alpha_composite(png(n), (x, oy))
        if show: hit(od, HIT[n], x, oy)
def floor(img, od, p, x, y, show):     # cap-top + 1 body; top at y
    for n, oy in ((p + "-cap-top", y), (p + "-body", y + 160)):
        img.alpha_composite(png(n), (x, oy))
        if show: hit(od, HIT[n], x, oy)

def mock(st, tops, bots):
    """1x, 360x640 world window: far+mid+near, 3 column pairs, ghost. True game size."""
    out = Image.new("RGBA", (360, 640))
    for L in ("far", "mid", "near"):
        out.alpha_composite(svgimg(f"bg-{st}-{L}", 1).crop((120, 0, 480, 640)))
    g = GROUND.get(st)
    d = ImageDraw.Draw(out)
    gy = 560
    if g: d.rectangle([0, gy, 360, 640], fill=g + (255,)); d.line([(0, gy), (360, gy)], fill=(255, 220, 240, 255), width=2)
    gap = 160
    for i, (cx, centre) in enumerate(((30, 250), (150, 330), (270, 270))):
        t, b = tops[i % len(tops)], bots[i % len(bots)]
        tp, bp = art(t), art(b)
        ce, fe = COL[t]["ceilEdge"], COL[b]["floorEdge"]
        capY = int(centre - gap / 2 - ce)
        cap = png(tp + "-cap-bottom", 1); body = png(tp + "-body", 1)
        y = capY - 64
        while y > -64: out.alpha_composite(body, (cx, y)) if y >= 0 else out.alpha_composite(body.crop((0, -y, 80, 64)), (cx, 0)); y -= 64
        out.alpha_composite(cap, (cx, capY)) if capY >= 0 else None
        fy = int(centre + gap / 2 - fe)
        out.alpha_composite(png(bp + "-cap-top", 1), (cx, fy))
        y = fy + 80; bb = png(bp + "-body", 1)
        while y < gy: out.alpha_composite(bb.crop((0, 0, 80, min(64, gy + 4 - y))), (cx, y)); y += 64
    gh = png("ghost-normal-idle-0", 1)
    out.alpha_composite(gh, (96, 300))
    return out

def sheet():
    stages = list(STAGE_TOPS)
    W, PH = 2240, 780
    H = 190 + len(stages) * (PH + 30) + 120
    img = night(W, H); d = ImageDraw.Draw(img)
    d.text((60, 40), "Halloween Ghost Game · v0.4 obstacles: TOPS hang, BOTTOMS stand", font=F["t"], fill=TXT)
    d.text((60, 96), "per stage: hanging tops (ceiling: -body + -cap-bottom) | standing bottoms (floor: -cap-top + -body) · each shown plain and with hitboxes.json in pink · 2x PNGs", font=F["s"], fill=SUB)
    d.text((60, 122), "right: the same stage at TRUE GAME SIZE (1x, 360x640 world window, ghost 64px) · 'kept' = existing v0.3 art · gap edge = ceilEdge (top) / floorEdge (bottom)", font=F["s"], fill=SUB)
    ov = Image.new("RGBA", img.size, (0, 0, 0, 0)); od = ImageDraw.Draw(ov)
    for si, st in enumerate(stages):
        y0 = 170 + si * (PH + 30)
        panel(img, 40, y0, W - 80, PH, f"{st.upper()}")
        tops, bots = list(STAGE_TOPS[st]), list(STAGE_BOTTOMS[st])
        d.text((260, y0 + 20), "TOP · hangs from above", font=F["s"], fill=SUB)
        x = 70
        for cid in tops:
            p = art(cid)
            ceiling(img, od, p, x, y0 + 56, False)
            ceiling(img, od, p, x + 165, y0 + 56, True)
            tag = "" if cid in NEW else "  (kept)"
            label(img, x + 162, y0 + 364, f"{p.replace('obs-', '')}{tag}")
            label(img, x + 162, y0 + 384, f"ceilEdge {COL[cid]['ceilEdge']}")
            x += 340
        x = 70
        by = y0 + 420
        d.text((70, by - 18), "BOTTOM · stands on the ground", font=F["s"], fill=SUB)
        for cid in bots:
            p = art(cid)
            floor(img, od, p, x, by + 8, False)
            floor(img, od, p, x + 165, by + 8, True)
            tag = "" if (cid in NEW) else "  (kept)"
            label(img, x + 162, by + 308, f"{p.replace('obs-', '')}{tag}")
            label(img, x + 162, by + 328, f"floorEdge {COL[cid]['floorEdge']}")
            x += 340
        m = mock(st, tops, bots)
        img.alpha_composite(m, (W - 80 - 380, y0 + 60))
        label(img, W - 80 - 200, y0 + 718, "1x game size (true pixels)")
    img.alpha_composite(ov)
    yb = H - 100
    d = ImageDraw.Draw(img)
    d.text((60, yb), "Retired as TOPS (files kept): " + ", ".join(sorted({k for k in RETIRED_TOPS})) + ".  Space bottoms drop tomb-a.", font=F["s"], fill=SUB)
    d.text((60, yb + 26), "Hitboxes stay inside the 72 px column (x 4..76), sit slightly inside the art, and skip decorative bits (flames, glows, leaves, sparkles, tails, legs). All sprites are static.", font=F["s"], fill=SUB)
    img.convert("RGB").save(os.path.join(A, "preview-sheet-v04-obstacles.png"), optimize=True)
    print(img.size)
if __name__ == "__main__":
    sheet()
