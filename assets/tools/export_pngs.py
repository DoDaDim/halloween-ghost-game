"""Export every SVG in assets/ to png/1x and png/2x, plus ghost strip sheets and hitboxes.json."""
import os, glob, json, cairosvg
from PIL import Image
A = os.path.join(os.path.dirname(__file__), "..")
for d in ("png/1x", "png/2x"): os.makedirs(os.path.join(A, d), exist_ok=True)
for f in sorted(glob.glob(os.path.join(A, "*.svg"))):
    n = os.path.basename(f)[:-4]
    for s, d in ((1, "png/1x"), (2, "png/2x")):
        cairosvg.svg2png(url=f, write_to=os.path.join(A, d, n + ".png"), scale=s)
ORDER = ["idle-0", "idle-1", "flap-0", "flap-1", "flap-2"]
for kind in ("normal", "golden"):
    for s, d in ((1, "png/1x"), (2, "png/2x")):
        W = 64 * s
        sheet = Image.new("RGBA", (W * 5, W), (0, 0, 0, 0))
        for i, fr in enumerate(ORDER):
            sheet.alpha_composite(Image.open(os.path.join(A, d, f"ghost-{kind}-{fr}.png")).convert("RGBA"), (i * W, 0))
        sheet.save(os.path.join(A, d, f"ghost-{kind}-strip.png"))
HIT = {
  "_units": "1x pixels, relative to each sprite's own top-left; multiply by draw scale",
  "ghost": {"type": "circle", "cx": 32, "cy": 33, "r": 18,
            "note": "same for all ghost frames, normal and golden; ignore the 1px idle bob"},
  "tomb-a-body": {"rects": [[8, 0, 64, 64]]},
  "tomb-b-body": {"rects": [[8, 0, 64, 64]]},
  "tomb-c-body": {"rects": [[9, 0, 62, 64]]},
  "tomb-a-cap-top":    {"rects": [[8, 40, 64, 40]], "circles": [[40, 40, 30]]},
  "tomb-a-cap-bottom": {"rects": [[8, 0, 64, 40]],  "circles": [[40, 40, 30]]},
  "tomb-b-cap-top":    {"rects": [[5, 45, 70, 35], [35, 5, 10, 40], [23, 13, 34, 8]]},
  "tomb-b-cap-bottom": {"rects": [[5, 0, 70, 35], [35, 35, 10, 40], [23, 59, 34, 8]]},
  "tomb-c-cap-top":    {"rects": [[8, 31, 64, 49]]},
  "tomb-c-cap-bottom": {"rects": [[8, 0, 64, 49]]},
}
# ---------------- v0.3 extras ----------------
HIT.update({
  "obs-common-coffin-body":        {"rects": [[13, 0, 54, 64]]},
  "obs-common-coffin-cap-top":     {"rects": [[13, 32, 54, 48], [19, 10, 42, 22]]},
  "obs-common-coffin-cap-bottom":  {"rects": [[13, 0, 54, 48], [19, 48, 42, 22]]},
  "obs-common-cross-body":         {"rects": [[21, 0, 38, 64]]},
  "obs-common-cross-cap-top":      {"rects": [[21, 7, 38, 73], [7, 23, 66, 18]]},
  "obs-common-cross-cap-bottom":   {"rects": [[21, 0, 38, 73], [7, 39, 66, 18]]},
  "obs-space-moonrock-body":       {"rects": [[8, 0, 64, 64]]},
  "obs-space-moonrock-cap-top":    {"rects": [[8, 36, 64, 44]], "circles": [[40, 36, 24]]},
  "obs-space-moonrock-cap-bottom": {"rects": [[8, 0, 64, 44]], "circles": [[40, 44, 24]]},
})
HIT["columns"] = {
  "_note": "Bottom/top column sets. gapEdge = hitbox edge nearest the gap (sprite y). pumpkinSeat = where the pumpkin's bottom-centre rests on a cap-top (sprite x,y).",
  "tomb-a":   {"files": "tomb-a-{body,cap-top,cap-bottom}",   "floorEdge": 10, "ceilEdge": 70, "pumpkinSeat": [40, 8]},
  "tomb-b":   {"files": "tomb-b-{body,cap-top,cap-bottom}",   "floorEdge": 5,  "ceilEdge": 75, "pumpkinSeat": [40, 3]},
  "tomb-c":   {"files": "tomb-c-{body,cap-top,cap-bottom}",   "floorEdge": 31, "ceilEdge": 49, "pumpkinSeat": [40, 25]},
  "coffin":   {"files": "obs-common-coffin-{body,cap-top,cap-bottom}",   "floorEdge": 10, "ceilEdge": 70, "pumpkinSeat": [40, 7]},
  "cross":    {"files": "obs-common-cross-{body,cap-top,cap-bottom}",    "floorEdge": 7,  "ceilEdge": 73, "pumpkinSeat": [40, 5]},
  "moonrock": {"files": "obs-space-moonrock-{body,cap-top,cap-bottom}",  "floorEdge": 12, "ceilEdge": 68, "pumpkinSeat": [40, 11]},
}
HIT["hazards"] = {
  "bat":     {"files": "obs-common-bat-flap-{0,1,2}", "size": [48, 48], "type": "circle", "cx": 24, "cy": 25, "r": 12},
  "pumpkin": {"files": "obs-common-pumpkin",          "size": [40, 40], "type": "circle", "cx": 20, "cy": 23, "r": 14, "restY": 38,
              "note": "art bottom-centre is (20,38): draw at (seatX-20, capY+seatY-38). Rolling: rotate about (20,23), angle += dx/14.5 rad"},
  "skull":   {"files": "obs-common-skull-{0,1}",      "size": [40, 40], "type": "circle", "cx": 20, "cy": 19, "r": 13},
}
HIT["pickups"] = {
  "golden-ghost": {"files": "pickup-golden-ghost-{0,1,2}", "size": [56, 56], "type": "circle", "cx": 28, "cy": 28, "r": 16, "placement": "gapCentre"},
  "sweet-wrapped":  {"files": "pickup-sweet-wrapped",  "size": [32, 32], "type": "circle", "cx": 16, "cy": 16, "r": 10},
  "sweet-lollipop": {"files": "pickup-sweet-lollipop", "size": [32, 32], "type": "circle", "cx": 16, "cy": 13, "r": 10},
  "sweet-macaron":  {"files": "pickup-sweet-macaron",  "size": [32, 32], "type": "circle", "cx": 16, "cy": 16, "r": 10},
}
HIT["events"] = {
  "graveyard-hearse": {"files": "event-graveyard-hearse-{0,1}", "size": [160, 64], "rects": [[8, 34, 30, 26], [38, 12, 116, 48]],
                       "anchor": "bottom of sprite (y=64) on the ground line", "direction": "right-to-left", "speed": 175},
  "church-batSwarm":  {"reuses": "hazards.bat"},
  "countryside-pumpkinRoll": {"reuses": "hazards.pumpkin"},
  "schools-sweetShower": {"reuses": ["pickups.sweet-wrapped", "pickups.sweet-lollipop", "pickups.sweet-macaron"], "hazard": False},
  "city-nightbus":    {"files": "event-city-nightbus-{0,1}", "size": [192, 72], "rects": [[9, 8, 177, 58]],
                       "anchor": "bottom of sprite (y=72) on the ground line", "direction": "right-to-left", "speed": 160},
  "city-pigeon":      {"files": "event-city-pigeon-flap-{0,1,2}", "size": [40, 40], "type": "circle", "cx": 20, "cy": 22, "r": 10},
  "warning":          {"files": "ui-event-warning-{0,1}", "size": [40, 40], "hitbox": None},
}
HIT["ambient"] = {"_note": "decorative only - NO hitboxes", "files": [
  "amb-graveyard-fog-back", "amb-graveyard-fog-front", "amb-church-bird-perch", "amb-church-bird-fly-{0,1,2}",
  "amb-school-bike-mint", "amb-school-bike-pink", "amb-city-rain-{0,1,2}", "amb-space-star-{0,1,2}", "amb-space-starfield"]}
# ---------------- v0.3b: stage top columns, space set, cutscene, backgrounds ----------------
from build_stage_columns import HIT as COLHIT, EDGES as COLEDGES
HIT.update(COLHIT)
HIT["columns"].update(COLEDGES)
HIT["columns"]["asteroid"] = {"aliasOf": "moonrock", "files": "obs-space-moonrock-{body,cap-top,cap-bottom}", "floorEdge": 12, "ceilEdge": 68, "pumpkinSeat": [40, 11],
                              "note": "space bottom column 'asteroid' = the moon-rock pillar art"}
HIT["columns"]["_space"] = {"top": {"obs-space-satellite": 2, "obs-space-ufo": 1}, "bottom": {"asteroid": 2, "tomb-a": 1},
                            "note": "tomb-a in space uses the normal tomb-a files; Code may add a soft shadow/glow under it so it reads as floating"}
HIT["columns"]["_stageTops"] = {"church-spire": "obs-church-spire", "bell": "obs-church-bell", "tree-branch": "obs-countryside-branch",
                                "scarecrow": "obs-countryside-scarecrow", "school-chimney": "obs-school-chimney", "clock-tower": "obs-school-clocktower",
                                "skyscraper": "obs-city-skyscraper", "crane-hook": "obs-city-cranehook", "satellite": "obs-space-satellite", "ufo": "obs-space-ufo",
                                "note": "Tuning placeholder id -> art set"}
HIT["hazards"]["miniAsteroid"] = {"files": "obs-space-miniasteroid", "size": [40, 40], "type": "circle", "cx": 20, "cy": 20, "r": 13,
                                  "note": "single sprite; spin by rotating about (20,20), ~90-120 deg/s"}
HIT["hazards"]["alien"] = {"files": "obs-space-alien-{0,1}", "size": [40, 40], "type": "circle", "cx": 20, "cy": 22, "r": 13,
                           "note": "frame 1 is drawn 1.5px higher (built-in bob); keep the circle at (20,22)"}
HIT["pickups"]["golden-ghost-space"] = {"files": "pickup-golden-ghost-space-{0,1,2}", "size": [56, 56], "type": "circle", "cx": 28, "cy": 28, "r": 16,
                                        "placement": "gapCentre", "note": "brighter-glow variant for the space background"}
HIT["events"]["space-meteor"] = {"files": "event-space-meteor-{0,1}", "size": [72, 48], "type": "circle", "cx": 18, "cy": 32, "r": 12,
                                 "direction": "from top-right toward bottom-left (trail points up-right)", "note": "trail is decorative"}
HIT["cutscene"] = {"_note": "rocket launch: decorative only, NO hitboxes (collisions are off for the 2.5 s cutscene)",
                   "files": ["prop-city-launchpad", "cut-rocket-idle-{0,1}", "cut-rocket-thrust-{0,1}", "cut-rocket-flame-{0,1,2}",
                             "cut-smoke-puff-{0,1,2}", "cut-cloud-{a,b,c}", "bg-launch-sky"],
                   "anchors": {"rocketNozzleBottomCentre": [48, 144], "flameTopCentre": [24, 0], "rocketFinBase_y": 140, "launchpadTop": [70, 112]}}
HIT["backgrounds"] = {"_note": "decorative only - NO hitboxes. 720x640 world px tiles, scroll horizontally",
                      "stages": ["graveyard", "church", "countryside", "schools", "city", "space"], "layers": ["far", "mid", "near"],
                      "scroll": {"far": 0.1, "mid": 0.3, "near": 0.6, "space": {"far": 0.05, "mid": 0.15, "near": 0.5}},
                      "transitions": ["bg-trans-graveyard-church-*", "bg-trans-church-countryside-*", "bg-trans-countryside-schools-*", "bg-trans-schools-city-*"]}
# ---------------- v0.4: hanging tops + standing bottoms (side-specific sets) ----------------
from build_v04_obstacles import HIT as V4HIT, EDGES as V4EDGES, STAGE_TOPS, STAGE_BOTTOMS, RETIRED_TOPS
HIT.update(V4HIT)
HIT["columns"].update(V4EDGES)
HIT["columns"]["_stageTopsV04"] = dict(STAGE_TOPS, note="v0.4 per-stage TOP (ceiling) sets: art prefix -> suggested weight (Tuning owns weights). Tops use -body + -cap-bottom only.")
HIT["columns"]["_stageBottomsV04"] = dict(STAGE_BOTTOMS, note="v0.4 per-stage BOTTOM (floor) sets: column id -> suggested weight. Bottoms use -body + -cap-top only. tomb-a is dropped from space.")
HIT["columns"]["_retiredTops"] = dict(RETIRED_TOPS, note="no longer used as TOP obstacles from v0.4 (files kept). Tombs/coffin/cross remain graveyard bottoms.")
# generic strips for every other multi-frame set (name ends in -<digit>)
import re, collections
groups = collections.defaultdict(list)
for f in sorted(glob.glob(os.path.join(A, "*.svg"))):
    n = os.path.basename(f)[:-4]
    m = re.match(r"(.+)-(\d)$", n)
    if m and not n.startswith("ghost-"): groups[m.group(1)].append(n)
for base, names in groups.items():
    for d in ("png/1x", "png/2x"):
        ims = [Image.open(os.path.join(A, d, n + ".png")).convert("RGBA") for n in names]
        w, h = ims[0].size
        st = Image.new("RGBA", (w * len(ims), h), (0, 0, 0, 0))
        for i, im in enumerate(ims): st.alpha_composite(im, (i * w, 0))
        st.save(os.path.join(A, d, base + "-strip.png"))
json.dump(HIT, open(os.path.join(A, "hitboxes.json"), "w"), indent=2)
print("exported")
