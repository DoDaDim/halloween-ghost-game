# Halloween Ghost Game: Art Assets (v1 + v0.3 extras + v0.3 stages, backgrounds, launch and space + v0.4 obstacles)

Original hand-authored SVG art in a pastel Japanese kawaii style. Outlines are soft plum/lavender, never black.
Every SVG has a transparent PNG export at 1x and 2x:

- `png/1x/<name>.png`: native size (the sizes below)
- `png/2x/<name>.png`: double size, for DPR 2–3 phones. Draw it at the 1x size.

All coordinates below are **1x pixels, measured from the sprite's top-left corner**. If you draw at scale `s`, multiply by `s`.
The same numbers are in machine-readable form in `hitboxes.json`.

Target screen is 390×844 portrait (from docs/QA.md). At 1x the ghost is about 40 px wide and a column is 72 px wide, which suits that screen.

## 1. Ghost sprites (64×64, 2x = 128×128)

| File (`.svg` and `png/{1x,2x}/*.png`) | Frame |
|---|---|
| `ghost-normal-idle-0` | idle, eyes open, little "w" mouth |
| `ghost-normal-idle-1` | idle, happy blink, body 1 px lower, tail sways |
| `ghost-normal-flap-0` | flap: arm-nubs **up**, "o" mouth, tail wisps swing back |
| `ghost-normal-flap-1` | flap: arms level (mid) |
| `ghost-normal-flap-2` | flap: arms **down**, tail swings forward |
| `ghost-golden-*` | the same 5 frames in a honey/gold palette with a soft glow and twinkling sparkles (sparkle positions change each frame) |
| `png/1x/ghost-normal-strip.png` (320×64), `png/2x/…` (640×128) | horizontal strip, frames in order idle-0, idle-1, flap-0, flap-1, flap-2 |
| `png/1x/ghost-golden-strip.png` (320×64), `png/2x/…` (640×128) | same order, golden |

- **Canvas and anchor:** every frame uses the same 64×64 canvas, and the body is centred the same way in each one. Anchor at the centre **(32, 32)**, then rotate around it for the usual Flappy tilt (about −20° rising, up to +60° diving). Swapping frames causes no jitter. The only built-in motion is the deliberate 1 px bob in idle-1.
- **Suggested animation:**
  - Idle (title screen or "get ready"): idle-0 ⇄ idle-1 at **2 fps**. Or hold idle-0 and flash idle-1 for about 120 ms every 2–3 s as a blink.
  - Flap: on each tap, play flap-0 → flap-1 → flap-2 → flap-1 at **12 fps** (about 330 ms), then go back to idle-0 while falling. A gentle loop of flap-1 → flap-2 → flap-1 → flap-0 at 8 fps also works.
  - Golden: same timings. The sparkles twinkle as the frames change.
- **Hitbox:** a **circle centred at (32, 33) with r = 18**, the same for every frame and both colours. The body art is about r 20–21, so near-misses feel fair. Arm-nubs, tail wisps, sparkles and the gold glow never collide. You can ignore the 1 px idle bob. If you rotate the sprite, the circle stays valid.

## 2. Tombstone obstacles (Flappy-style columns)

Three patterns: **A** is a rounded "RIP" headstone with mint moss (lavender stone). **B** is a slab with a cross, pastel flowers and a vine (mauve stone). **C** is a stack of sleepy mochi stones with a dozing face, cracks and "z z" (blue-grey and lilac stones alternate).

| File | 1x size | 2x size | Role |
|---|---|---|---|
| `tomb-{a,b,c}-body` | 80×64 | 160×128 | column body, **tiles vertically** with no seams |
| `tomb-{a,b,c}-cap-top` | 80×80 | 160×160 | top end of a **floor-rising** column (faces the gap, above the body) |
| `tomb-{a,b,c}-cap-bottom` | 80×80 | 160×160 | bottom end of a **ceiling-hanging** column (faces the gap, below the body) |

**Building a column.** All sprites are 80 px wide and share the same x. The stone column itself is 72 px wide (x = 4..76). Cap B's slab lip is 78 px wide.

- **Floor column with its gap edge at `gapBottomY`:** draw `cap-top` at `y = gapBottomY - capTopOffset`. Then repeat `body` every 64 px from `capY + 80` down to the ground. Clip or let the ground cover the last tile. The visible art starts lower than the top of the cap canvas:
  - A: arch top at y = 7
  - B: cross top at y = 2
  - C: flower at y ≈ 9, stone top at y = 24

  So for a tight fit, use `capTopOffset` = A 7, B 2, C 24 (the flower and z's poke into the gap but don't collide). You can also just use 0 and treat the hitbox top as the gap edge.
- **Ceiling column with its gap edge at `gapTopY`:** draw `cap-bottom` with its bottom at `gapTopY + offset`. The visible art ends at A y = 73, B y = 78 (cross tip), C y = 56 (stone; the z's go to ~80). Then tile `body` upward from the cap's top edge every 64 px until the tiles pass y = 0.
- The ceiling caps are mirrored, but the **"RIP" text and the sleepy face stay upright**. The moss and the vine on C become hanging drips. B's cross hangs down Flappy-pipe style, and its round flowers read fine either way.
- If you prefer one cap plus a canvas flip, flipping `cap-top` with `scale(1,-1)` also works for A and B (the text would then be upside down). Use the real `cap-bottom` for C.

**Tombstone hitboxes** (rects are `[x, y, w, h]`, circles are `[cx, cy, r]`, 1x, relative to each sprite's top-left; the art is inset by about 4 px):

| Sprite | Hitbox |
|---|---|
| `tomb-a-body`, `tomb-b-body` | rect `[8, 0, 64, 64]` |
| `tomb-c-body` | rect `[9, 0, 62, 64]` |
| `tomb-a-cap-top` | rect `[8, 40, 64, 40]` + circle `[40, 40, 30]` (arch) |
| `tomb-a-cap-bottom` | rect `[8, 0, 64, 40]` + circle `[40, 40, 30]` |
| `tomb-b-cap-top` | slab `[5, 45, 70, 35]`, cross post `[35, 5, 10, 40]`, cross arms `[23, 13, 34, 8]` |
| `tomb-b-cap-bottom` | slab `[5, 0, 70, 35]`, cross post `[35, 35, 10, 40]`, cross arms `[23, 59, 34, 8]` |
| `tomb-c-cap-top` | rect `[8, 31, 64, 49]` |
| `tomb-c-cap-bottom` | rect `[8, 0, 64, 49]` |

For a simpler collision model, use one rect per column: **x 8..72**, running from the hitbox edge nearest the gap to the screen edge. The nearest edges are:

- Floor caps: A 10, B 5 (cross) or 45 (slab only), C 31
- Ceiling caps: A 70, B 75 or 35, C 49

Decorations never collide: flowers, leaves, moss tufts, the z's and the leaf tips on the vine.

**Gameplay tip:** B's cross is narrow. If you use only the slab rect for B, players can "thread" past the cross, which feels generous. Keep the cross rects if you want it strict.

## 3. Palette (for UI / backgrounds to match)

| Use | Hex |
|---|---|
| ghost outline (plum) | `#6B4E7A` |
| ghost body | `#FFFFFF` → `#E6DDF7` |
| eyes | `#4A3358` → `#7A5A9E` |
| blush | `#FFB3CB` |
| golden body | `#FFF7D6` → `#FFD873` |
| golden outline | `#8E5A3C` |
| sparkle | `#FFF4B8` / `#D9953A` |
| stone A | `#D4CDE8` (outline `#6B5A84`) |
| stone B | `#DCD0E0` (outline `#6E5578`) |
| stone C | `#C9D2E6` / `#D9CCE6` (outline `#5F5A86`) |
| moss / mint | `#AEE3C6` |
| flowers | peach `#FFCFA8`, pink `#FFB6CC` |
| preview night sky | `#282142` → `#4E3E6E` |

## 4. v0.3 extras (matches TUNING.md v1.4)

Naming: `obs-common-*` (column sets and hazards used in every stage), `obs-<stage>-*` (stage-specific), `pickup-*`, `event-<stage>-<name>-*`, `ui-*`, `amb-<stage>-*`. Every file is `.svg` plus `png/1x` and `png/2x`. Every multi-frame set also has a horizontal `<base>-strip.png` in frame order.

All hitbox numbers below are also in `hitboxes.json`. The original top-level keys are unchanged; the new sections are `columns`, `hazards`, `pickups`, `events` and `ambient`. Radii are exactly as TUNING v1.4 specifies, and each circle sits a little inside the visible body.

### 4a. Column sets (same 72 px footprint and 80-wide canvases as the tombstones)

Each set has `-body` (80×64, tiles vertically), `-cap-top` (80×80, floor column) and `-cap-bottom` (80×80, ceiling column). The stacking rules from §2 apply unchanged.

| Set | Files | Look | Gap edge, floor / ceiling | Pumpkin seat (on cap-top) |
|---|---|---|---|---|
| Coffin (common, bottom mix) | `obs-common-coffin-{body,cap-top,cap-bottom}` | Dusty-rose coffin with lilac trim, gold handles, bat-winged heart emblem | 10 / 70 | (40, 7) |
| Cross (common, bottom mix) | `obs-common-cross-{body,cap-top,cap-bottom}` | Big lilac stone cross with a heart and a flower wreath | 7 / 73 | (40, 5) |
| **Moon-rock pillar (space bottom column)** | `obs-space-moonrock-{body,cap-top,cap-bottom}` | Periwinkle cratered moon rock, pink, mint and lilac crystal sprouts, a twinkle star | 12 / 68 | (40, 11) |

Pumpkin seats for the existing tombstones: tomb-a (40, 8), tomb-b (40, 3) (it balances on the cross), tomb-c (40, 25).

Column hitboxes (`[x, y, w, h]` rects and `[cx, cy, r]` circles, 1x):

| Sprite | Hitbox |
|---|---|
| coffin body | `[13, 0, 54, 64]` |
| coffin cap-top | `[13, 32, 54, 48]` + `[19, 10, 42, 22]` |
| coffin cap-bottom | `[13, 0, 54, 48]` + `[19, 48, 42, 22]` |
| cross body | `[21, 0, 38, 64]` (post) |
| cross cap-top | post `[21, 7, 38, 73]` + bar `[7, 23, 66, 18]` |
| cross cap-bottom | post `[21, 0, 38, 73]` + bar `[7, 39, 66, 18]` |
| moonrock body | `[8, 0, 64, 64]` |
| moonrock cap-top | `[8, 36, 64, 44]` + circle `[40, 36, 24]` |
| moonrock cap-bottom | `[8, 0, 64, 44]` + circle `[40, 44, 24]` |

The cross post is narrower than 72 px; the hitbox follows the art honestly, so that column is slightly more forgiving.

### 4b. Between-pair hazards (exactly one circle each)

| Hazard | Files | Canvas | Hit circle | Frames / fps | Notes |
|---|---|---|---|---|---|
| Bat | `obs-common-bat-flap-{0,1,2}` (0 wings up, 1 level, 2 down) | 48×48 | (24, 25) **r12** (body r 14.5) | 0,1,2,1 at 12 fps | Wings and ears never collide. Also used by the church bat-swarm event. |
| Pumpkin | `obs-common-pumpkin` | 40×40 | (20, 23) **r14** (body about 17×14.5) | single | Flat-ish bottom at (20, 38). To sit it on a cap, draw it at `(capX + seatX − 20, capY + seatY − 38)`. Stem and leaf never collide. |
| Skull | `obs-common-skull-{0,1}` | 40×40 | (20, 19) **r13** (cranium r 15.5) | 0↔1 at 3 fps (glow pulse, 1 px bob) | Floats with a soft mint glow; the bow is decorative. |

**Pumpkin roll (countryside event):** reuse `obs-common-pumpkin`. Rotate it about (20, 23) with `angle += dx / 14.5` rad so it rolls without sliding, and add the bounce in code. No extra frames are needed because the art reads fine at any angle.

### 4c. Pickups (rewards, not traps)

| Pickup | Files | Canvas | Hit circle | Frames / fps | Notes |
|---|---|---|---|---|---|
| Golden ghost | `pickup-golden-ghost-{0,1,2}` | 56×56 | (28, 28) **r16** | 0,1,2,1 at 6 fps (built-in 1.5 px bob, sparkle twinkle) | Contented closed-eye golden ghost on a glowing token ring with sparkles and a "+" glint. It reads as positive at a glance. Place its centre (28, 28) on the gap centre. |
| Sweets (schools event) | `pickup-sweet-wrapped`, `pickup-sweet-lollipop`, `pickup-sweet-macaron` | 32×32 | **r10**, at (16, 16) for wrapped and macaron, (16, 13) for the lollipop | single | Pick a variant at random and wobble ±15° while falling. No hazard. |

### 4d. One-time events (`event-<stage>-<name>`)

Free slots follow the same pattern, for example `event-church-*` and `event-countryside-*`. Those two events currently reuse the bat and the pumpkin, so they need no new files.

| Event | Files | Canvas | Hitbox | Placement and motion |
|---|---|---|---|---|
| Graveyard hearse | `event-graveyard-hearse-{0,1}` (wheel-spin frames) | 160×64 | bonnet `[8, 34, 30, 26]` + cabin `[38, 12, 116, 48]` | Sprite bottom (tyres, y = 64) on the ground line, so draw at `y = groundY − 64`. Faces left and drives **right to left**, entering at x = 360 and leaving at x = −160. Use **≈175 px/s** screen speed to cross in about 3 s, and swap wheel frames at about 10 fps. The art is about 60 px tall (cabin hitbox top 52 px above ground). TUNING's "floor rises 60 px" is the safe simple version. |
| City night bus | `event-city-nightbus-{0,1}` | 192×72 | `[9, 8, 177, 58]` | Draw at `y = groundY − 72`, driving **right to left** at **≈160 px/s** to cross in about 3.5 s; wheel frames at about 10 fps. The art is about 70 px tall (hitbox top 64 px above ground). |
| City pigeon flock | `event-city-pigeon-flap-{0,1,2}` | 40×40 | (20, 22) **r10** (body 13×12) | Faces left; frames 0,1,2,1 at 12 fps. Fly in a loose V above the bus, right to left. |
| Church bat swarm | reuses `obs-common-bat-*` | | r12 each | |
| Countryside pumpkin roll | reuses `obs-common-pumpkin` | | r14 each | Rolling per §4b. |
| Schools sweet shower | reuses `pickup-sweet-*` | | r10 each, collect only | |
| Warning marker | `ui-event-warning-{0,1}` | 40×40 | none (UI) | A pink "!" bubble with an arrow pointing **right**. Toggle 0↔1 at 4 fps for the 1 s telegraph and place it at the screen edge where the event enters, at the event's height. Mirror it for the left edge and rotate it −90° to point up (sweet shower from the top). |

### 4e. Ambient: decorative only, NO hitboxes, never collide

| Zone | Files | Size | Use |
|---|---|---|---|
| Graveyard fog | `amb-graveyard-fog-back`, `amb-graveyard-fog-front` | 360×120, 360×80 | Semi-transparent and seamless horizontally; tile in x. Bottom edge on the ground line. Scroll the back layer at 0.3× and the front at 0.6× world speed. Draw the back layer behind the columns and the front layer in front of them. |
| Church birds | `amb-church-bird-perch`, `amb-church-bird-fly-{0,1,2}` | 24×24 | Perch them on the church roofline. When the ghost comes within about 120 px, switch to fly frames (0,1,2,1 at 12 fps), move up-left at about (−80, −120) px/s and fade out. They face left; mirror them to scatter right. |
| School bikes | `amb-school-bike-mint`, `amb-school-bike-pink` | 72×48 | Near-layer props: tyres touch y ≈ 46, so draw at `y = groundY − 46`. Scroll at 1.0–1.1× world speed. |
| City rain | `amb-city-rain-{0,1,2}` | 128×128, tiles in x and y | Each frame is the same rain shifted 1/3 of a tile down and slightly left. Either cycle the frames at 12 fps over a static tiling, or use frame 0 alone and scroll it at about (−125, +500) px/s. |
| Space stars | `amb-space-star-{0,1,2}`, `amb-space-starfield` | 16×16, 180×180 tile | Twinkle cycle 0,1,2,1 at 4 fps with a random phase per star. The starfield tiles and scrolls at about 0.1×. |

### 4f. Palette additions

| Use | Hex |
|---|---|
| coffin | `#EBC9D2` / trim `#C9B6E8` / line `#7A4E66` |
| cross | `#E4D2EA` |
| moon rock | `#CBC9EF` / line `#55548C` |
| bat | `#BBA7E6` |
| pumpkin | `#FFC9A0` |
| skull bone | `#FFF6EE` |
| hearse | `#BBA9DE` |
| night bus | `#A8DCD9` with pink stripe `#FFC9DA` and lit windows `#FFEBB0` |
| rain | `#D4E6FF` |
| fog | `#E9E2FA` / `#F6F2FF` |

## 5. Other files

- `preview-sheet.png` (1800×1890): the v1 ghost and tombstone sprites, labelled, on a pastel night background, with a hitbox overlay row.
- `preview-sheet-v03-extras.png` (1800×2450): every v0.3 extra, with hitboxes in pink. The ambient row is marked as having no hitboxes.
- `hitboxes.json`: the hitbox numbers above, for code.
- `tools/build_ghosts.py`, `tools/build_tombs.py`, `tools/build_extras.py`: the generators that write the SVGs (edit these, not the SVGs).
- `tools/export_pngs.py`: re-exports the PNGs and strips with cairosvg and writes `hitboxes.json`.
- `tools/build_preview.py`, `tools/build_preview_extras.py`: rebuild the two preview sheets.

Rebuild everything with: `cd assets && python3 tools/build_ghosts.py && python3 tools/build_tombs.py && (cd tools && python3 build_extras.py) && python3 tools/export_pngs.py && python3 tools/build_preview.py && python3 tools/build_preview_extras.py`

## 6. v0.3 stage TOP columns + space columns (TUNING v1.4 / v1.5)

Same rules as §2 and §4a: 80-wide canvases, 72 px footprint (x = 4..76), `-body` 80×64 tiles vertically, `-cap-top` 80×80 ends a **floor** column, `-cap-bottom` 80×80 ends a **ceiling** column. **v0.4: the spire, scarecrow, chimney, clock tower and skyscraper are retired as tops (§10b); bell, tree-branch, crane-hook, satellite and ufo stay.** Tuning used these sets for the TOP (ceiling) column of each stage, so `-cap-bottom` is the one players see most; `-cap-top` is provided so any set can also be used as a floor column. Text, faces, bells, signs and the scarecrow stay upright on both caps.

| Tuning id | Files | Stage | Look | Gap edge floor / ceiling | Pumpkin seat (cap-top) |
|---|---|---|---|---|---|
| `church-spire` **(retired as top in v0.4, see §10)** | `obs-church-spire-{body,cap-top,cap-bottom}` | church | Lilac stone tower with glowing arched windows; periwinkle tiled spire, round window, gold cross finial | 12 / 68 | (40, 3) |
| `bell` | `obs-church-bell-{body,cap-top,cap-bottom}` | church | Wooden post wrapped in rope; a smiling honey-gold bell with a pink bow hangs from a yoke (ceiling) or sits on a bracket (floor) | 10 / 76 | (40, 7) |
| `tree-branch` | `obs-countryside-branch-{body,cap-top,cap-bottom}` | countryside | Mauve bark trunk with an owl peeking from a knot hole; fluffy mint leaf canopy with autumn leaves and two pink apples | 4 / 76 | (40, 6) |
| `scarecrow` **(retired as top in v0.4, see §10)** | `obs-countryside-scarecrow-{body,cap-top,cap-bottom}` | countryside | Straw-wrapped pole; sack-head scarecrow with button eyes, peach straw hat with a flower, lilac/mint plaid sleeves, patch; dangling legs on the ceiling version | 10 / 74 | (40, 2) |
| `school-chimney` **(retired as top in v0.4, see §10)** | `obs-school-chimney-{body,cap-top,cap-bottom}` | schools | Peach-pink brick chimney with a cream crown, two lilac chimney pots and a sleepy smile | 5 / 75 | (40, 3) |
| `clock-tower` **(retired as top in v0.4, see §10)** | `obs-school-clocktower-{body,cap-top,cap-bottom}` | schools | Cream-lilac tower; gold-rimmed clock with a happy face; mint roof with a pink flag (floor) or mint ledge with a pendulum bob (ceiling) | 9 / 69 | (40, 3) |
| `skyscraper` **(retired as top in v0.4, see §10)** | `obs-city-skyscraper-{body,cap-top,cap-bottom}` | city | Periwinkle tower with lit/dark window grid and a pink neon edge strip; set-back roof, antenna light and a neon heart sign (sign stays upright) | 23 / 57 | (40, 21) |
| `crane-hook` | `obs-city-cranehook-{body,cap-top,cap-bottom}` | city | Butter-yellow lattice crane mast; ceiling version ends in a striped hook block and hook with a little tag; floor version has a mint cab with a ghost operator | 23 / 68 | (40, 21) |
| `satellite` | `obs-space-satellite-{body,cap-top,cap-bottom}` | space | Silver truss boom; smiling gold-foil satellite with blue solar wings and a dish (dish faces the gap) | 13 / 67 | (40, 8) |
| `ufo` | `obs-space-ufo-{body,cap-top,cap-bottom}` | space | Lilac stalk with mint ring lights; saucer with rim lights and a glass dome with a little alien pilot; soft tractor-beam glow under the ceiling version | 17 / 66 | (40, 15) |

`hitboxes.json → columns._stageTops` maps each Tuning id to its file prefix.

**Gap edge** = first/last hitbox pixel in the cap (1x). Use it the same way as the tombstone `capTopOffset`: e.g. place a ceiling cap so `capY + ceilEdge = gapTopY`. Decorative bits (spire finial, antenna, flag, hat brim, smoke-less chimney pots, crane tag, UFO beam) poke slightly past the edge without colliding.

Hitboxes (1x, `[x, y, w, h]` rects, `[cx, cy, r]` circles, each inset a few px inside the art):

| Sprite | body | cap-top | cap-bottom |
|---|---|---|---|
| obs-church-spire | `[8, 0, 64, 64]` | `[8, 50, 64, 30]` + `[22, 36, 36, 14]` + `[31, 21, 18, 15]` + `[37, 12, 6, 9]` | `[8, 0, 64, 30]` + `[22, 30, 36, 14]` + `[31, 44, 18, 15]` + `[37, 59, 6, 9]` |
| obs-church-bell | `[23, 0, 34, 64]` | `[23, 56, 34, 24]` + `[12, 34, 56, 22]` + `[27, 20, 26, 14]` + circle `[40, 22, 12]` | `[23, 0, 34, 18]` + `[38, 17, 4, 6]` + `[12, 46, 56, 22]` + `[27, 32, 26, 14]` + circle `[40, 34, 12]` + circle `[40, 72, 4]` |
| obs-countryside-branch | `[11, 0, 58, 64]` | `[11, 42, 58, 38]` + circle `[40, 29, 25]` | `[11, 0, 58, 38]` + circle `[40, 51, 25]` |
| obs-countryside-scarecrow | `[29, 0, 22, 64]` | `[8, 35, 64, 9]` + `[28, 34, 24, 46]` + circle `[40, 22, 12]` | `[29, 0, 22, 20]` + `[8, 41, 64, 9]` + `[28, 40, 24, 26]` + `[27, 66, 26, 8]` + circle `[40, 28, 12]` |
| obs-school-chimney | `[11, 0, 58, 64]` | `[11, 24, 58, 56]` + `[5, 14, 70, 10]` + `[19, 5, 11, 9]` + `[49, 5, 11, 9]` | `[11, 0, 58, 56]` + `[5, 56, 70, 10]` + `[19, 66, 11, 9]` + `[49, 66, 11, 9]` |
| obs-school-clocktower | `[13, 0, 54, 64]` | `[9, 30, 62, 50]` + `[21, 18, 38, 12]` + `[33, 9, 14, 9]` | `[13, 0, 54, 10]` + `[9, 8, 62, 52]` + `[16, 60, 48, 9]` |
| obs-city-skyscraper | `[9, 0, 62, 64]` | `[9, 40, 62, 40]` + `[19, 23, 42, 17]` | `[9, 0, 62, 40]` + `[19, 40, 42, 17]` |
| obs-city-cranehook | `[17, 0, 46, 64]` | `[5, 23, 70, 7]` + `[15, 30, 50, 50]` | `[17, 0, 46, 16]` + `[36, 16, 8, 10]` + `[26, 25, 28, 20]` + `[29, 45, 13, 23]` |
| obs-space-satellite | `[17, 0, 46, 64]` | `[17, 74, 46, 6]` + `[26, 38, 28, 40]` + `[39, 29, 2, 10]` + `[5, 49, 70, 16]` + `[18, 13, 44, 17]` | `[17, 0, 46, 6]` + `[26, 2, 28, 40]` + `[39, 41, 2, 10]` + `[5, 15, 70, 16]` + `[18, 50, 44, 17]` |
| obs-space-ufo | `[26, 0, 28, 64]` | `[26, 52, 28, 28]` + `[32, 45, 16, 8]` + `[7, 32, 66, 14]` + `[24, 17, 32, 15]` | `[26, 0, 28, 30]` + `[7, 44, 66, 14]` + `[24, 29, 32, 15]` + `[28, 58, 24, 8]` |

Narrow bodies, on purpose and honest to the art: bell post 34 px, scarecrow pole 22 px, UFO stalk 28 px, crane mast and satellite truss 46 px. Those columns are a bit more forgiving between the caps; Tuning may want to keep them at weight 1 (bell, scarecrow and ufo already are).

### 6a. Space bottom columns

- **asteroid** = the existing moon-rock pillar `obs-space-moonrock-{body,cap-top,cap-bottom}` (§4a). `hitboxes.json → columns.asteroid` is an alias (`aliasOf: moonrock`) with the same edges and seat. No new files.
- **tomb-a** in space reuses `tomb-a-*` unchanged. **v0.4: dropped from space** (use `obs-space-crystals` / `obs-space-alienplant`, §10). Optional for Code: draw a soft lilac glow/shadow ellipse under it so it reads as floating.
- `columns._space` repeats the Tuning v1.5 weights (top satellite 2 / ufo 1, bottom asteroid 2 / tomb-a 1).

### 6b. Space hazards, event and pickup

| Files | 1x size | Frames / fps | Hitbox (circle, 1x) | Notes |
|---|---|---|---|---|
| `obs-space-miniasteroid` | 40×40 | single sprite | (20, 20) r13 | Cute sleepy cratered rock. **Spin** by rotating about (20, 20), about 90–120°/s; the circle doesn't change. Art radius ≈ 15.8. |
| `obs-space-alien-{0,1}` | 40×40 (strip 80×40) | 0↔1 at 3 fps | (20, 22) r13 | Mint alien with antenna bobbles, waving. Frame 1 is drawn 1.5 px higher (built-in bob) on top of Tuning's bobY motion. |
| `event-space-meteor-{0,1}` | 72×48 (strip 144×48) | 0↔1 at 10 fps (trail flicker) | (18, 32) r12 | Peach meteor head with a pink→lilac sparkly trail pointing up-right, so it reads as travelling **from top-right to bottom-left** (matches Tuning's diagonal waves). Mirror horizontally for a top-left entry. Trail is decorative. |
| `pickup-golden-ghost-space-{0,1,2}` | 56×56 (strip 168×56) | same as the normal pickup | (28, 28) r16 | **Space glow variant.** The normal token reads OK on space but blends into the darker sky, so this one adds a brighter cream-gold halo and a solid outer ring. Use it whenever the stage is space. |

## 7. Parallax backgrounds (`bg-<stage>-<layer>`), decorative only, NO hitboxes

- Tile size **720×640 world px** (2x PNG 1440×1280). That's 2 screens wide in the 360×640 logical world that `game.js` letterboxes onto the 390×844 phone, so draw them in world coordinates at y = 0 and the canvas transform scales them. The ground top is y = 560 (Code's ground band still draws on top). If Code ever fills the extra height of a 390×844 screen, extend upward with the sky's top colour.
- Every tile wraps seamlessly (all elements are drawn with ±720 copies and the hill profiles are periodic). Checked by rendering tiles side by side and with `tools/check_seams.py` (all 42 joins pass).
- `far` is opaque (sky gradient + moon + stars + distant hills). `mid` and `near` are transparent overlays, so draw far → mid → near → obstacles → ground.

| Stage | far | mid | near |
|---|---|---|---|
| graveyard | lavender night, big moon, distant hills with bare trees | hill of tombstone and cross silhouettes, a glowing mausoleum, spooky-cute trees | iron fence, bushes, lanterns, jack-o'-lanterns, mushrooms |
| church | blue-lilac night, crescent moon, hillside village | the church (rose window, spire, lit door), a cottage, round trees and pines | stone wall, warm street lamps, mint hedges |
| countryside | teal night, big full moon, rolling hills with tiny pines | pink barn, windmill, farmhouse, haystacks, tree | wooden fence, corn stalks, little pumpkins |
| schools | purple-pink dusk, crescent moon, town hills with houses | school with clock tower, lit windows and flag, bunting, trees | swing, slide, fence, bush, small tree |
| city | deep indigo with pink haze, distant skyline | lit pastel towers with neon bars/hearts/moons | street lamps, bench, mailbox, bushes, cones |
| space (endless) | deep violet, dense twinkling stars, pink/mint/lilac nebulae | ringed pink planet, mint planet, gold moonlet, lilac moonlet | optional: drifting mini rocks and sparkle dust |

**Suggested scroll speeds** (multiples of the obstacle/world speed, 150–240 px/s): far **0.1×**, mid **0.3×**, near **0.6×**. Space: far **0.05×**, mid **0.15×**, near **0.5×**. `offset = (distance × factor) mod 720`, then draw the tile at `-offset` and `-offset + 720`.

### 7a. Transition tiles (`bg-trans-<from>-<to>-<layer>`)

Files: `bg-trans-graveyard-church-{far,mid,near}`, `bg-trans-church-countryside-*`, `bg-trans-countryside-schools-*`, `bg-trans-schools-city-*` (720×640 each). The **left edge matches the outgoing tile's right edge, and the right edge matches the incoming tile's left edge**, per layer: the sky crossfades across the middle 30 % (x ≈ 250–470), the hill profile and colour morph there too, outgoing props stay on the left and incoming props on the right, with a bridging tree (mid) and bush (near).

How to use: when the stage changes (the empty slot + banner), for each layer, at that layer's **next** tile boundary draw the transition tile once instead of another outgoing tile, then switch to incoming tiles.

Because the far layer moves so slowly (a far tile takes ~30–48 s to scroll past), a boundary may be far away. Recommended rule:
- **near**: always use the transition tile (next boundary is ≤ 6 s away).
- **mid / far**: use the transition tile if the layer's next boundary is ≤ 3 s away; otherwise **crossfade**: draw the outgoing and incoming tiles at the same offset and fade the incoming alpha 0→1 over 1.5 s (the banner time). Crossfade is always a safe fallback for every layer.
- **city → space** has no transition tile: the rocket-launch cutscene is the transition (§8). After it, start the space layers at offset 0.

## 8. Rocket launch cutscene (2.5 s, NO hitboxes)

| Files | 1x size | Notes |
|---|---|---|
| `prop-city-launchpad` | 200×140 | Pastel launch pad with pink hazard stripes, butter-yellow gantry, arm, lights and flags. Pad surface y = 112. Place it with its bottom on the ground: world (80, 420). |
| `cut-rocket-idle-{0,1}` | 96×148 (strip 192×148) | Cream rocket, pink nose, mint fins, gold porthole with the ghost inside (happy face). Frame 1 dims the mint status light. 4 fps. |
| `cut-rocket-thrust-{0,1}` | 96×148 (strip 192×148) | Ghost goes wide-eyed with an "o" mouth; frames are shifted −1 / +1 px for a built-in shake. 12 fps. |
| `cut-rocket-flame-{0,1,2}` | 48×80 (strip 144×80) | Peach/butter/cream flame with sparks. Top-centre anchor (24, 0) sits on the nozzle's bottom-centre (48, 144): draw at `(rocketX + 24, rocketY + 144)`. 15 fps, order 0,1,2,1. Frame 2 is the short ignition flame. |
| `cut-smoke-puff-{0,1,2}` | 64×64 (strip 192×64) | Lavender-white puffs, small → big. Use as particles: spawn at the pad ±60 px, scale 0.6→1.4, drift sideways, fade alpha 1→0 over ~0.7 s, stepping frames 0→1→2. |
| `cut-cloud-{a,b,c}` | 160×64 | White, pink and blue cloud sprites that rush down past the rocket during the climb (500–700 px/s, 3–4 of them). |
| `bg-launch-sky` | 360×1920 (2x 720×3840) | Vertical backdrop: city glow and skyline at the bottom, then dusk lilac, a sea of clouds around y ≈ 960–1320, then deep space with stars and nebulae at the top. Show a 360×640 window and pan it from the bottom (y = 1280) to the top (y = 0). |

Rocket placement on the pad: `rocketX = padX + 70 − 48`, `rocketY = padY + 112 − 140` (fins rest on the pad), i.e. world (102, 392).

**Timeline (2.5 s):**

| Time | What happens | Sprites |
|---|---|---|
| 0.00–0.50 | City layers keep scrolling slowly to a stop (or freeze); pad + rocket slide in from the right with the pairs cleared. The player ghost tweens into the porthole (48, 66) over 0.3 s and hides. | `cut-rocket-idle-0/1` @ 4 fps |
| 0.50–0.80 | Ignition: small flame, smoke bursts, 1–2 px screen shake. | `cut-rocket-thrust-0/1` @ 12 fps, `flame-2`, smoke particles |
| 0.80–1.00 | Lift-off: rocket rises with ease-in (~60 px), flame cycles. | thrust @ 12 fps, `flame-0,1,2,1` @ 15 fps |
| 1.00–2.20 | Climb: switch the backdrop to `bg-launch-sky` and pan bottom → top with smoothstep; rocket holds around y ≈ 250 and drifts up ~40 px; clouds rush down. | thrust + flame, `cut-cloud-*` |
| 2.20–2.50 | Arrival: crossfade to the `bg-space-*` layers over 0.2–0.3 s; the rocket zooms off the top (≈ 600 px/s) and the ghost pops out at the player start position. Then the normal stage breather. | thrust + flame, then hide |

The storyboard is in `preview-sheet-v03-backgrounds.png`.

## 9. v0.3b preview sheets and tools

- `preview-sheet-v03-stages.png` (2200×1860): all 8 stage top-column sets: ceiling column art, the same with hitboxes, and the floor variant with hitboxes.
- `preview-sheet-v03-backgrounds.png` (1560×4420): each stage composited (far+mid+near) with two tiles side by side, the 4 transitions in sequence (outgoing | transition | incoming, seams dashed), the rocket-launch storyboard, then space looping over 3 tiles.
- `preview-sheet-v03-space.png` (1800×1980): space columns (satellite, ufo, asteroid = moon-rock, floating tomb-a) with hitboxes, mini asteroid spin, alien frames, meteor frames, the golden-pickup space variant next to the normal one, then the rocket kit (idle/thrust, flames, assembled, smoke, clouds).
- `tools/build_stage_columns.py` (stage + space columns, and their hitboxes), `tools/build_space_launch.py` (space hazards, meteor, space pickup, rocket kit, launch sky), `tools/build_backgrounds.py` (all `bg-*` tiles), `tools/check_seams.py` (tile-seam check), `tools/build_preview_v03b.py` (the three sheets above).

Rebuild v0.3b: `cd assets/tools && python3 build_stage_columns.py && python3 build_space_launch.py && python3 build_backgrounds.py && cd .. && python3 tools/export_pngs.py && python3 tools/check_seams.py && python3 tools/build_preview_v03b.py`


## 10. v0.4 obstacles: TOPS hang, BOTTOMS stand (David's brief)

**Rule:** a TOP (ceiling) obstacle is something that really hangs down or comes from the sky, never a ground object flipped upside down. A BOTTOM (floor) obstacle stands on the ground. Top and bottom sets look clearly different in every stage.

**Side-specific sets (new in v0.4).** Same 80-wide canvases and 72 px footprint (x = 4..76) as §2 / §4a / §6, but each new set only ships the end it is meant for, so nothing can be used upside down:

- **Tops:** `obs-<stage>-<object>-body` (80×64) + `-cap-bottom` (80×80). The **body is the suspension** (bough, thread, chain, vine, rope, string, cable, pole, robot arm, tether) and tiles vertically up to the ceiling; the **cap-bottom is the hanging object** at the gap edge. No `-cap-top`.
- **Bottoms:** `obs-<stage>-<object>-cap-top` (80×80) + `-body` (80×64). The cap-top is the top of the object at the gap edge; the body tiles down to the ground. No `-cap-bottom`.
- `game.js` already handles this: it only loads `-cap-top` / `-cap-bottom` when `hitboxes.json` lists that sprite, and `resolveColumn` only needs `capBottom` for a top and `capTop` for a bottom. So **only use v0.4 tops on the `top` side and v0.4 bottoms on the `bottom` side.**
- Each body hitbox is **one rect** (game.js uses `body.rects[0]`).
- `hitboxes.json → columns.<id>` has `"side": "top"|"bottom"`, `ceilEdge` (tops) or `floorEdge` + `pumpkinSeat` (bottoms), and a `note` saying what is decorative. The prefix for schools is `obs-school-` (matches the existing `obs-school-*` and `amb-school-*` files).
- **All v0.4 sprites are static.** No swing animation, so the hitbox is exact. If Code ever adds a sway, rotate the cap about (40, 0) by at most ±6° and grow every cap rect by 4 px sideways (noted per set where it makes sense).
- Hitboxes sit inside the art (checked by rendering every sprite at 4× and measuring hitbox pixels over empty art: under 3 % for every solid object, which is just anti-aliased edges; the chandelier chain reads ~12 % only because its link holes are counted as solid, which is far too small for the ghost to pass). The deliberate exceptions are the **two-rope / two-chain / two-cable bodies** (`countryside-swing`, `city-cradle`, `city-neonsign`). Their one body rect spans both suspensions, because the seat / cradle / sign below spans the full width. The space between the ropes is enclosed and can never be reached, so this gives the same collisions as two thin rects.
- Decorative, never collide: flames, glows, light cones, leaves, flowers, sparkles, dew, bees, bow tails, spider legs, ear tips, z's, antennae bobbles, top knobs and finials, straw tufts.

### 10a. Per-stage sets (weights are suggestions; Tuning owns them)

| Stage | TOP ids (hang) | BOTTOM ids (stand) |
|---|---|---|
| graveyard | `obs-graveyard-lantern-branch` 2, `obs-graveyard-spider` 2 | `tomb-a` 1 *(kept)*, `tomb-b` 1 *(kept)*, `tomb-c` 1 *(kept)*, `coffin` 1 *(kept)*, `cross` 1 *(kept)* |
| church | `obs-church-chandelier` 2, `obs-church-bats` 1, `obs-church-bell` 1 *(kept)* | `obs-church-ivystone` 2, `obs-church-font` 1, `obs-church-lychgate` 1 |
| countryside | `obs-countryside-beehive` 2, `obs-countryside-branch` 2 *(kept)*, `obs-countryside-swing` 1 | `obs-countryside-haybales` 2, `obs-countryside-pumpkinstack` 1, `obs-countryside-churn` 1 |
| schools | `obs-school-handbell` 2, `obs-school-kite` 2, `obs-school-lamp` 1 | `obs-school-books` 2, `obs-school-lockers` 2, `obs-school-globe` 1 |
| city | `obs-city-cradle` 2, `obs-city-trafficlight` 2, `obs-city-neonsign` 1, `obs-city-cranehook` 1 *(kept)* | `obs-city-postbox` 2, `obs-city-phonebox` 1, `obs-city-hydrant` 1 |
| space | `obs-space-satellite` 2 *(kept)*, `obs-space-arm` 1, `obs-space-astronaut` 1, `obs-space-ufo` 1 *(kept)* | `moonrock` 2 *(kept)*, `obs-space-crystals` 1, `obs-space-alienplant` 1 |

Machine-readable: `hitboxes.json → columns._stageTopsV04`, `columns._stageBottomsV04` (stage → id → suggested weight) and `columns._retiredTops`. The kept ids use their existing `columns` entries: `obs-church-bell`, `obs-countryside-branch`, `obs-city-cranehook`, `obs-space-satellite`, `obs-space-ufo` (tops); `tomb-a/b/c`, `coffin`, `cross`, `moonrock` (bottoms). **Space drops `tomb-a`** (the v0.3 `columns._space` block is left untouched for compatibility, but v0.4 should use `_stageBottomsV04.space`).

### 10b. Retired as TOPS (files kept, nothing deleted)

| Set | Was | Now |
|---|---|---|
| `tomb-a`, `tomb-b`, `tomb-c` | graveyard top | graveyard **bottom** only |
| `obs-church-spire` | church top | retired (ground building) |
| `obs-countryside-scarecrow` | countryside top | retired (ground object) |
| `obs-school-clocktower`, `obs-school-chimney` | schools top | retired (buildings) |
| `obs-city-skyscraper` | city top | retired (building) |
| coffin / cross outside the graveyard | every stage's bottom | graveyard only; other stages use their own bottoms |

### 10c. New TOPS (hanging): look, gap edge, hitboxes (1x, `[x, y, w, h]` rects, `[cx, cy, r]` circles)

| Set | Look | ceilEdge | body | cap-bottom |
|---|---|---|---|---|
| `obs-graveyard-lantern-branch` | Twisted lilac-grey dead bough with bare twigs; a glowing iron lantern with a happy face hangs from a short chain | 71 | `[31, 0, 18, 64]` | `[31, 0, 18, 8]` + `[33, 8, 14, 6]` + `[37, 14, 6, 9]` + `[35, 23, 10, 4]` + `[30, 26, 20, 4]` + `[25, 30, 30, 4]` + `[21, 34, 38, 2]` + `[16, 35, 48, 5]` + `[21, 40, 38, 26]` + `[17, 66, 46, 5]` |
| `obs-graveyard-spider` | Silk thread with dew sparkles; a hanging cobweb, then a round lilac spider with a pink bow and tiny fangs | 76 | `[39, 0, 2, 64]` | `[39, 0, 2, 14]` + `[16, 19, 48, 18]` + `[24, 13, 32, 6]` + `[24, 37, 32, 5]` + `[39, 42, 2, 11]` + circle `[40, 64, 12]` |
| `obs-church-chandelier` | Gold chain; gold chandelier tray with a smiling hub, four cream candles (pink drips, flames up) and a crystal drop | 69 | `[37, 0, 6, 64]` | `[37, 0, 6, 33]` + `[34, 33, 12, 3]` + `[30, 36, 20, 16]` + `[9, 29, 6, 13]` + `[24, 34, 6, 13]` + `[50, 34, 6, 13]` + `[65, 29, 6, 13]` + `[9, 41, 62, 4]` + `[14, 45, 52, 5]` + `[22, 50, 36, 5]` + `[39, 55, 2, 6]` + `[39, 60, 2, 4]` + circle `[40, 66, 3]` |
| `obs-church-bats` | Ivy-leaf vine; a twig perch with three sleeping bats hanging upside down, wrapped in their wings | 57 | `[38, 0, 6, 64]` | `[37, 0, 6, 15]` + `[9, 15, 62, 4]` + `[36, 18, 2, 4]` + `[42, 18, 2, 4]` + circle `[20, 30, 8]` + circle `[20, 42, 8]` + circle `[60, 30, 8]` + circle `[60, 42, 8]` + circle `[40, 29, 8.5]` + circle `[40, 42, 8.5]` + circle `[40, 50, 7]` |
| `obs-countryside-beehive` | Leafy bough; a honey-gold straw skep with a happy face and entrance hole, two little bees | 66 | `[35, 0, 10, 64]` | `[35, 0, 10, 24]` + `[18, 44, 44, 22]` + `[31, 25, 18, 6]` + circle `[40, 43, 19]` |
| `obs-countryside-swing` | Two hemp ropes; wooden plank seat with a flower, and a sleepy pumpkin riding it | 60 | `[15, 0, 50, 64]` | `[15, 0, 50, 51]` + `[8, 51, 64, 9]` |
| `obs-school-handbell` | Pink-and-white striped rope; a mint school handbell with a peach wooden handle, gold rim, pink band and face | 74 | `[37, 0, 6, 64]` | `[37, 0, 6, 10]` + `[36, 10, 8, 23]` + `[31, 33, 18, 9]` + `[27, 42, 26, 10]` + `[22, 52, 36, 6]` + `[18, 58, 44, 2]` + `[15, 60, 50, 6]` + `[37.5, 66, 5, 3]` + circle `[40, 71, 3]` |
| `obs-school-kite` | Kite string with little bows; tangled string loop and a pastel quarter-diamond kite with a surprised face and a bow tail | 66 | `[39, 0, 2, 64]` | `[39, 0, 2, 18]` + `[39, 17, 2, 6]` + `[35, 22, 10, 8]` + `[26, 30, 28, 6]` + `[19, 36, 42, 8]` + `[27, 44, 26, 10]` + `[34, 54, 12, 8]` + `[37, 62, 6, 4]` |
| `obs-school-lamp` | Lilac cable; mint dome classroom lamp with a sleepy face, glowing bulb and soft light cone | 68 | `[38, 0, 4, 64]` | `[38, 0, 4, 26]` + `[35, 26, 10, 5]` + `[34, 31, 12, 6]` + `[28, 37, 24, 7]` + `[19, 44, 42, 6]` + `[11, 50, 58, 7]` + circle `[40, 62, 6]` |
| `obs-city-cradle` | Two steel cables; butter-yellow rail and pink window-cleaner's cradle with a ghost cleaner in a cap, squeegee and bucket | 66 | `[13, 0, 54, 64]` | `[13, 0, 54, 36]` + `[8, 36, 64, 30]` |
| `obs-city-trafficlight` | Steel pole with a pink band; periwinkle traffic-light housing, three pastel lights with faces (sleepy, 'o', smile) | 71 | `[36, 0, 8, 64]` | `[36, 0, 8, 11]` + `[29, 11, 22, 7]` + `[23, 17, 34, 54]` |
| `obs-city-neonsign` | Two silver chains; dark sign board with pink neon border, a mint neon ghost, a pink heart and a butter star | 65 | `[18, 0, 44, 64]` | `[18, 0, 44, 34]` + `[8, 33, 64, 32]` |
| `obs-space-arm` | White robot boom with lilac joint rings; lilac elbow joint with a face, wrist and claw holding a gold star | 68 | `[29, 0, 22, 64]` | `[29, 0, 22, 16]` + `[25, 39, 30, 9]` + `[50, 48, 8, 5]` + `[55, 51, 7, 8]` + `[56, 59, 6, 6]` + `[18, 51, 7, 8]` + `[22, 48, 8, 5]` + `[18, 59, 6, 6]` + `[36, 54, 8, 14]` + `[32, 58, 16, 6]` + circle `[40, 27, 12]` |
| `obs-space-astronaut` | Gold coiled tether; a waving astronaut with a blue visor and a face, pink gloves, lilac boots | 73 | `[37, 0, 6, 64]` | `[37, 0, 6, 15]` + `[31, 15, 18, 6]` + `[29, 46, 22, 16]` + `[30, 61, 7, 9]` + `[43, 61, 7, 9]` + `[29, 69, 9, 4]` + `[42, 69, 9, 4]` + `[12, 36, 7, 7]` + `[61, 58, 7, 7]` + `[16, 41, 6, 6]` + `[21, 47, 8, 6]` + `[52, 50, 10, 6]` + circle `[40, 33, 14]` |

**Using a top:** draw `cap-bottom` at `capY = gapTopY − ceilEdge`, then tile `body` upward from `capY` every 64 px (exactly as `spriteLayout` already does). **Narrow ones, honest to the art:** spider thread and kite string 2 px, lamp cable 4 px, bell rope / chandelier chain / astronaut tether 6 px, bats vine 6 px, beehive bough 10 px, traffic-light pole 8 px. The suspension is a full-height wall anyway, so this only changes how soon the ghost may rise after passing the hanging object.

### 10d. New BOTTOMS (standing)

| Set | Look | floorEdge | pumpkinSeat | body | cap-top |
|---|---|---|---|---|---|
| `obs-church-ivystone` | Warm sandstone headstone with a domed top, carved heart, sleepy face, wrapped in ivy and flowers | 13 | (40, 12) | `[8, 0, 64, 64]` | `[8, 32, 64, 48]` + `[22, 22, 36, 10]` + circle `[40, 31, 18]` |
| `obs-church-font` | Fluted lilac stone pedestal; wide stone font bowl with water on top, quatrefoils and a face | 15 | (40, 14) | `[24, 0, 32, 64]` | `[7, 15, 66, 6]` + `[10, 21, 60, 12]` + `[16, 33, 48, 9]` + `[25, 42, 30, 6]` + `[22, 48, 36, 8]` + `[24, 56, 32, 24]` |
| `obs-church-lychgate` | Oak post with cross bracing; little lilac shingle roof with gold knob, plaque with a face | 17 | (40, 13) | `[22, 0, 36, 64]` | `[35, 17, 10, 6]` + `[28, 23, 24, 7]` + `[21, 30, 38, 7]` + `[14, 37, 52, 6]` + `[7, 43, 66, 7]` + `[22, 50, 36, 30]` |
| `obs-countryside-haybales` | Stacked golden hay bales tied with twine; the top bale has a face, a flower and straw tufts | 18 | (40, 16) | `[9, 0, 62, 64]` | `[10, 18, 60, 31]` + `[9, 49, 62, 31]` |
| `obs-countryside-pumpkinstack` | Stacked wooden crates; a big smiley pumpkin with a sleepy little pumpkin on top | 9 | (40, 6) | `[8, 0, 64, 64]` | `[8, 47, 64, 33]` + `[19, 28, 42, 13]` + `[27, 22, 26, 25]` + `[34, 9, 12, 10]` + `[37, 18, 6, 5]` |
| `obs-countryside-churn` | Tall pale-blue milk churn with cow spots and bands; shoulder, neck, lid, side handles and a face | 14 | (40, 12) | `[16, 0, 48, 64]` | `[25, 14, 30, 6]` + `[29, 20, 22, 13]` + `[22, 33, 36, 6]` + `[16, 39, 48, 41]` + `[9, 51, 7, 8]` + `[64, 51, 7, 8]` |
| `obs-school-books` | Stacked pastel books; on top a pencil, a thin book and an apple with a face | 10 | (40, 9) | `[11, 0, 58, 64]` | `[9, 33, 61, 47]` + `[14, 22, 50, 11]` + `[29, 10, 22, 12]` |
| `obs-school-lockers` | Blue and mint lockers with vents and handles; star and heart stickers, a pink backpack with a face on top | 10 | (40, 8) | `[8, 0, 64, 64]` | `[8, 33, 64, 47]` + `[5, 28, 70, 5]` + `[29, 10, 22, 18]` |
| `obs-school-globe` | Wooden stand pole with brass rings; pastel globe with a face in a brass meridian | 8 | (40, 6) | `[35, 0, 10, 64]` | `[35, 55, 10, 25]` + `[33, 56, 14, 6]` + `[38, 53, 4, 3]` + circle `[40, 31, 23]` |
| `obs-city-postbox` | Coral pillar postbox with a domed cap, slot, envelope-and-heart plate and a face | 13 | (40, 12) | `[14, 0, 52, 64]` | `[9, 31, 62, 5]` + `[14, 36, 52, 44]` + `[18, 20, 44, 11]` + `[30, 14, 20, 6]` + circle `[40, 32, 19]` |
| `obs-city-phonebox` | Pink phone box with glazed panes (a mini ghost inside on the call), sign band with a phone icon, domed roof | 9 | (40, 8) | `[10, 0, 60, 64]` | `[10, 35, 60, 45]` + `[7, 26, 66, 9]` + `[14, 17, 52, 9]` + `[33, 9, 14, 8]` |
| `obs-city-hydrant` | Butter-yellow standpipe with bolted flanges; chubby hydrant with mint bonnet, side caps and a face | 10 | (40, 9) | `[27, 0, 26, 64]` | `[20, 30, 40, 42]` + `[17, 27, 46, 4]` + `[17, 66, 46, 6]` + `[9, 45, 10, 8]` + `[61, 45, 10, 8]` + `[23, 20, 34, 8]` + `[31, 16, 18, 4]` + `[36, 10, 8, 6]` + `[27, 72, 26, 8]` |
| `obs-space-crystals` | Three pastel crystal prisms (pink, mint, lilac); pointed tips, the middle one has a face | 11 | (40, 9) | `[8, 0, 64, 64]` | `[8, 37, 20, 43]` + `[52, 29, 20, 51]` + `[30, 18, 20, 62]` + `[34, 11, 12, 7]` + `[11, 31, 14, 6]` + `[55, 23, 14, 6]` |
| `obs-space-alienplant` | Mint alien stalk with glowing buds; big lilac flower with a butter face and two glowing antennae | 16 | (40, 14) | `[33, 0, 14, 64]` | `[33, 46, 14, 34]` + `[6, 27, 68, 7]` + `[12, 34, 56, 7]` + `[14, 20, 52, 7]` + circle `[40, 31, 15]` |

**Using a bottom:** draw `cap-top` at `capY = gapBottomY − floorEdge`, then tile `body` from `capY + 80` down to the ground. Narrower standing bodies (honest): font pedestal 32, lychgate post 36, churn 48, globe pole 10, hydrant standpipe 26, alien-plant stalk 14.

### 10e. Files and tools

- 56 new SVGs (+ `png/1x`, `png/2x`): 14 tops × (`-body`, `-cap-bottom`) and 14 bottoms × (`-cap-top`, `-body`).
- `preview-sheet-v04-obstacles.png` (2240×5170): one panel per stage with the hanging tops (plain + pink hitbox overlay) above the standing bottoms (plain + overlay), plus a **1x true-game-size** mock of the stage (background, three pairs, the ghost).
- Generators: `tools/v04_common.py` (helpers, side-specific `reg_top` / `reg_bot` with column/one-rect checks), `tools/build_v04_tops.py`, `tools/build_v04_bottoms.py`, `tools/build_v04_obstacles.py` (writes all + stage maps), `tools/build_preview_v04.py`. `tools/export_pngs.py` now also merges the v0.4 hitboxes and maps (existing keys unchanged).
- Rebuild v0.4: `cd assets/tools && python3 build_v04_obstacles.py && cd .. && python3 tools/export_pngs.py && python3 tools/build_preview_v04.py`


### 10f. Hitbox continuity (v0.4.1)

Every column is solid from the screen edge to its gap edge, so even a 2 px thread or string blocks the ghost. `tools/check_hitbox_continuity.py` audits all 104 column pieces (bodies and both cap kinds, v1 to v0.4). It samples every 0.25 px row from the attachment edge to the gap edge (rects and circles combined), checks that each cap overlaps its body rect at the joint row, and exits 1 on any break. Run it after any hitbox edit: `python3 tools/check_hitbox_continuity.py`. The breaks it found were closed with small rects that follow the art (thread/string/stem/feet extensions, the hydrant standpipe inside its cap). **No gap edge (ceilEdge / floorEdge) or pumpkin seat changed.**

## 11. v0.5 death animations, stage transitions, profile icons (decorative, NO hitboxes)
Source: `tools/build_v05.py` (SVG), PNGs via `tools/export_pngs.py` (`png/1x`, `png/2x`, every multi-frame set also gets `<base>-strip.png`, frames left->right). Preview: `preview-sheet-v05.png` (`tools/build_preview_v05.py`).

### 11.1 Deaths: `death-<type>-<n>` (normal) and `death-<type>-golden-<n>` (golden ghost)
- Canvas **128x128**, **12 fps**, play once and **hold the last frame**. **Anchor `[64, 64]`** = the ghost sprite anchor `[32,32]` of the 64x64 ghost: draw at `(ghostX - 64*k, ghostY - 64*k)` with `k = CONFIG.ghost.size / 64`, i.e. the ghost in frame 0 sits exactly where the live sprite was. Art may leave the 64px box (bats, stars, smoke) but stays inside 128.
- Use the golden strip while the golden/invincible look is active, else the normal one. Same frame counts.

| type | frames | length | what happens |
|---|---|---|---|
| `bat` | 10 | 0.83s | bat swoops in (0-2), grabs head (3), carries the dangling, swirly-eyed ghost up and out of the top (4-9) |
| `pumpkin` | 8 | 0.67s | pumpkin drops (0-1), squish (2), pancake ghost under the pumpkin with swirl eyes + mini star ring (3-7) |
| `meteor` | 10 | 0.83s | flash (0), sooty frazzled ghost with rising smoke (1-9), coughs a puff (4-6) |
| `tombstone` | 10 | 0.83s | bonk to the right (0-1), dazed wobble with orbiting stars + birdies (2-9; loop 2-9 if you want to hold longer) |
| `skull` | 10 | 0.83s | "!!" jump (0), turns pale blue (1-2), shivers (3-9) and fades off up-right (6-9) |
| `floor` | 8 | 0.67s | splat + dust (0), bounce (1), flop (2-3), lies flat on its side with x_x eyes (4-7). Floor line at canvas y=95 (≈ ghost bottom +5) |
| `generic` | 10 | 0.83s | small bonk (0), dizzy spin + shrink (1-6), sparkle poof (7-9; last frame nearly empty, fade it) |

### 11.2 Reusable FX
- `fx-stars-ring-0..5` (6f, 64x32 loop, orbit centre (32,16); place centre ~20px above the ghost head)
- `fx-smoke-puff-0..3` (4f, 48x48, grows + fades, play once)
- `fx-sparkle-poof-0..4` (5f, 96x96, centre (48,48))
- `fx-bonk-0..2` (3f, 64x64 impact star, centre (32,32))

### 11.3 Stage transitions (exact filenames)
- Banner, blank: **`ui-banner-blank`** (300x90; text area centred x=150, baseline y≈47, ~200px wide; Code draws `CONFIG.looks[id].name` on it). Themed blanks: `ui-banner-<stage>-blank`. Pre-lettered extras: `ui-banner-graveyard`, `ui-banner-church`, `ui-banner-countryside`, `ui-banner-schools`, `ui-banner-city`, `ui-banner-space` (text = CONFIG.looks names; lettered in Capriola, so use the PNGs).
- Swoosh: **`fx-swoosh-0..5`** (240x64, 6f @12fps, streak travels left->right, frame 0 empty).
- Bursts: **`fx-burst-<stage>-0..5`** (160x160, centre (80,80), 6f @12fps, play once): graveyard = mini bats, church = bells + doves, countryside = leaves, schools = stars + paper, city = neon sparkles, space = stars.
- Badge: **`ui-stage-badge-blank`** (96x48; "Stage" + empty number disc, centre (74,24) r13) and numbered **`ui-stage-badge-1` .. `ui-stage-badge-6`**.
- Sky palettes (also `sky-palettes.json`; identical to the `sky` gradient of `bg-<stage>-far`, y 0 -> 640):

| stage | top | bottom |
|---|---|---|
| graveyard | `#241D40` | `#5E4A86` |
| church | `#222350` | `#5A5490` |
| countryside | `#1E2C4A` | `#4E6E8A` |
| schools | `#26245A` | `#6E5694` |
| city | `#1C2044` | `#4C3E7A` |
| space | `#120F2C` | `#2B2050` |

### 11.4 Profile icons (32 and 48 px; SVGs are 48-unit viewBox at the stated size)
`ui-icon-add-player-32|48`, `ui-icon-trophy-32|48`, `ui-icon-player-chip-<pink|mint|butter|lilac>-32|48` (avatar badge; cycle colours per player).

### 11.5 Suggested object id -> death type (for `CONFIG.deathAnims`; machine-readable copy in `death-map.json`)
Keys are the ids game.js passes to `die()` (column id, `hazard:<type>` -> type, `event:<id>` -> id, `ground`/`ceiling`). Anything unmapped -> `generic`. `warning` is not lethal so it is omitted.

| id | kind | death |
|---|---|---|
| `tomb-a` | column | **tombstone** |
| `tomb-b` | column | **tombstone** |
| `tomb-c` | column | **tombstone** |
| `coffin` | column | **tombstone** |
| `cross` | column | **tombstone** |
| `moonrock` | column | **tombstone** |
| `obs-church-spire` | column | **tombstone** |
| `obs-church-bell` | column | **generic** |
| `obs-countryside-branch` | column | **generic** |
| `obs-countryside-scarecrow` | column | **generic** |
| `obs-school-chimney` | column | **tombstone** |
| `obs-school-clocktower` | column | **tombstone** |
| `obs-city-skyscraper` | column | **tombstone** |
| `obs-city-cranehook` | column | **generic** |
| `obs-space-satellite` | column | **generic** |
| `obs-space-ufo` | column | **generic** |
| `asteroid` | column | **meteor** |
| `obs-graveyard-lantern-branch` | column | **generic** |
| `obs-graveyard-spider` | column | **generic** |
| `obs-church-chandelier` | column | **generic** |
| `obs-church-bats` | column | **bat** |
| `obs-countryside-beehive` | column | **generic** |
| `obs-countryside-swing` | column | **generic** |
| `obs-school-handbell` | column | **generic** |
| `obs-school-kite` | column | **generic** |
| `obs-school-lamp` | column | **generic** |
| `obs-city-cradle` | column | **generic** |
| `obs-city-trafficlight` | column | **generic** |
| `obs-city-neonsign` | column | **generic** |
| `obs-space-arm` | column | **generic** |
| `obs-space-astronaut` | column | **generic** |
| `obs-church-ivystone` | column | **tombstone** |
| `obs-church-font` | column | **tombstone** |
| `obs-church-lychgate` | column | **tombstone** |
| `obs-countryside-haybales` | column | **generic** |
| `obs-countryside-pumpkinstack` | column | **pumpkin** |
| `obs-countryside-churn` | column | **generic** |
| `obs-school-books` | column | **generic** |
| `obs-school-lockers` | column | **generic** |
| `obs-school-globe` | column | **generic** |
| `obs-city-postbox` | column | **generic** |
| `obs-city-phonebox` | column | **generic** |
| `obs-city-hydrant` | column | **generic** |
| `obs-space-crystals` | column | **tombstone** |
| `obs-space-alienplant` | column | **generic** |
| `bat` | hazard | **bat** |
| `pumpkin` | hazard | **pumpkin** |
| `skull` | hazard | **skull** |
| `miniAsteroid` | hazard | **meteor** |
| `alien` | hazard | **generic** |
| `graveyard-hearse` | event | **floor** |
| `church-batSwarm` | event | **generic** |
| `countryside-pumpkinRoll` | event | **generic** |
| `schools-sweetShower` | event | **generic** |
| `city-nightbus` | event | **floor** |
| `city-pigeon` | event | **bat** |
| `space-meteor` | event | **meteor** |
| `ground` | edge | **floor** |
| `ceiling` | edge | **generic** |

## 12. v0.5 share score card (600x800, decorative, NO hitboxes)

Built by `tools/build_scorecard.py` (preview: `tools/build_preview_scorecard.py` -> `preview-sheet-v05-scorecard.png`).

- Frames: `ui-scorecard-frame.svg` (neutral night) and `ui-scorecard-frame-<stage>.svg` for graveyard, church, countryside, schools, city, space and **void** (v0.6: void sky `#2C2356` -> `#7A64AE`). The outer sky and border are tinted from `sky-palettes.json`; the cream card stays the same, so text colours work on every tint.
- PNGs: `png/1x/` (600x800) and `png/2x/` (1200x1600). Copies are also at the assets root: `ui-scorecard-frame[-<stage>].png` and `...@2x.png`.
- Share icon: `ui-icon-share-32` and `ui-icon-share-48` (.svg plus png 1x/2x), styled like the other ui-icons.
- The layout data is also in `scorecard-layout.json`. Rects are `[x, y, w, h]` in 600x800 coordinates; double them for @2x. Use a rounded bold font, centre the text horizontally in the rect with `textBaseline='middle'` at y+h/2, and shrink to fit the width.

| area | x | y | w | h | align | baseline | max font px | colour | notes |
|---|---|---|---|---|---|---|---|---|---|
| ghost | 200 | 66 | 200 | 200 | centre (image) | - | - | - | draw ghost sprite centred, e.g. 64px art at 3x = 192px |
| stage | 110 | 282 | 380 | 40 | center | middle | 28 | `#7A5A9E` |  |
| score | 80 | 330 | 440 | 140 | center | middle | 120 | `#4A3358` | optional 4px stroke #FFFFFF behind fill for extra pop |
| best | 130 | 480 | 340 | 40 | center | middle | 28 | `#C9798F` |  |
| player | 120 | 546 | 360 | 56 | center | middle | 34 | `#4A3358` | sits on a lilac pill; shrink-to-fit |
| url | 90 | 742 | 420 | 36 | center | middle | 22 | `#4A3358` | cream ribbon at the bottom, outside the card |

## 13. v0.5 power-ups (Rush / Extra Life / Chill)

Built by `tools/build_powerups.py`; the preview is `tools/build_preview_powerups.py` -> `preview-sheet-v05-powerups.png`. Every name below is an `.svg` plus `png/1x` and `png/2x`. Animated sets also have `<name>-strip.png` (frames left to right, all the same size). Offsets are relative to the 64x64 ghost sprite's top-left (ghost anchor (32,32), hitbox centre (32,33)).

### Pickups (hitboxes.json -> `pickups.power-rush|power-life|power-chill`)
| file | size | frames | fps | hitbox |
|---|---|---|---|---|
| `pickup-rush-{0..3}` gold ghost token + lightning badge | 56x56 | 4 loop | 8 | circle (28,28) r16, gapCentre |
| `pickup-life-{0..3}` red ghost token + heart badge | 56x56 | 4 loop | 8 | same |
| `pickup-chill-{0..3}` blue ghost token + snowflake badge | 56x56 | 4 loop | 8 | same |
The radius follows the golden-ghost pickup convention (r16). Tuning owns the final values. The bob (about 2px) and the ring spin are built into the frames.

### Golden Ghost Rush
- `ghost-rush-{0..3}`: 112x64, 4-frame loop at 12fps. A glowing gold ghost with speed streaks and afterimages built in. It replaces the ghost sprite: the ghost's 64x64 sits at x 48..112, so draw at **(ghost.x-48, ghost.y)**. The hitbox is unchanged.
- `fx-rush-aura-{0..3}`: 96x96 glow loop at 8fps, drawn under the ghost at **(-16,-16)** (centre (48,49) = ghost (32,33)).
- `fx-rush-trail-{0..3}`: 80x64 afterimage and streak loop at 12fps, drawn behind the ghost at **(-64, 0)**. Optional if you use ghost-rush.
- `fx-candy-burst-{0..5}`: 128x128 at 12fps (0.5s, one-shot). Centre (64,64) goes on the smashed obstacle. A bonk star with sweets flying out and falling.

### Red Extra Life
- `ghost-heart-overlay-{0,1}`: 20x20 heartbeat loop at 4fps, drawn at **(+40, +2)** from the ghost's top-left (top-right of the head). Shown while a spare life is held.
- `fx-heart-pop-{0..5}`: 96x96 at 12fps (0.5s), life gained. Centre (48,48) on the ghost centre, at offset (-16,-16).
- `fx-heart-break-{0..5}`: 96x96 at 12fps (0.5s), life used: the heart cracks into halves plus a puff. Same anchor.

### Blue Slow-Mo Chill
- `ui-frost-vignette`: 360x640 full-screen overlay (stretch to the viewport), with frosted corners and edge flakes and a transparent centre. **Suggested extra tint: fill `#BFE6FF` at alpha 0.18** under the vignette, and fade both in and out over about 0.3s.
- `fx-frost-flake-a|b|c`: 16x16 single particles (large, mid, small). Fall at 30-60px/s with a slight sway and rotate 30-90 deg/s.
- `fx-frost-burst-{0..5}`: 96x96 at 12fps (0.5s) on pickup or activation, centred on the ghost at (-16,-16).

### HUD icons
`ui-hud-rush-32|48`, `ui-hud-life-32|48`, `ui-hud-chill-32|48` (viewBox 48, same style as the ui-icons).

## 14. Stage 7 'void' (The Void, endless zone after space; concept A "Nebula Drift")

Built by `tools/build_void.py`, which writes the SVGs, the `png/1x` and `png/2x` PNGs and the strips, and merges into `hitboxes.json`, `sky-palettes.json` and `death-map.json`. `tools/export_pngs.py` re-applies the merge at the end. Preview: `tools/build_preview_void.py` -> `preview-sheet-void.png`. Check: `python3 tools/check_hitbox_continuity.py` reports **128 pieces, 0 breaks**.

### 14.1 Obstacles (v0.4 conventions: 80px canvas, 72px footprint x 4..76, body 80x64 tiles vertically, caps 80x80)
- **Tops** `obs-void-<obj>-top-{body,cap-bottom}`: a satin-ribbon body tile, with the object hanging under a bow as the cap-bottom. The ribbon is a solid 24px rect `[28,0,24,64]`. The ceiling cloud bank is drawn in `bg-void-near` at y 0..~50.
- **Bottoms** `obs-void-<obj>-bottom-{cap-top,body}`: the object sitting on a cotton-candy cloud as the cap-top, with a cloud-stack body tile (solid `[10,0,60,64]`).
- Objects: `typewriter`, `crt`, `phone`, `cassette`, `gramophone`, `alarm` (alarm clock). Every object has both a top and a bottom version.
- The cap and body share a prefix, as in v0.4 (`<id>-body` + `<id>-cap-bottom|cap-top`), so the column ids are `obs-void-<obj>-top` and `obs-void-<obj>-bottom`. The game pairs them by that id, and so does the continuity checker.
- Art extends into the gap by at most 1.5px past the hitbox, plus the stroke. Decorative only: the bow loops, the cloud side bumps, the sparkles and the phone's little cord stub.
- CRT antenna tips and the alarm-clock bells are solid.

| object | top column id | ceilEdge | bottom column id | floorEdge | pumpkinSeat |
|---|---|---|---|---|---|
| typewriter | `obs-void-typewriter-top` | 77 | `obs-void-typewriter-bottom` | 6 | [40, 6] |
| crt | `obs-void-crt-top` | 76 | `obs-void-crt-bottom` | 6 | [40, 14] |
| phone | `obs-void-phone-top` | 75 | `obs-void-phone-bottom` | 6 | [40, 6] |
| cassette | `obs-void-cassette-top` | 77 | `obs-void-cassette-bottom` | 6 | [40, 6] |
| gramophone | `obs-void-gramophone-top` | 77 | `obs-void-gramophone-bottom` | 6 | [40, 6] |
| alarm | `obs-void-alarm-top` | 75.7 | `obs-void-alarm-bottom` | 6 | [40, 6] |

`hitboxes.json`: piece rects and circles are at the top level (`obs-void-*-body`, `-cap-bottom`, `-cap-top`). The edges are in `columns.obs-void-*`. The sets are in `columns._stageTopsVoid` and `columns._stageBottomsVoid`, as column id -> suggested weight. Tuning owns the weights.
- Tops: crt 2, phone 2, alarm 2, typewriter 1, cassette 1, gramophone 1.
- Bottoms: typewriter 2, crt 2, the others 1.
- All pieces are static. Code may bob a whole column ±2px, with the hitbox moving with it.

**death-map.json**: `obs-void-*-top` -> `generic`, because a soft ribbon with a hanging object matches the other v0.4 hanging tops. `obs-void-*-bottom` -> `tombstone` (see-stars), because these are hard retro objects bumped head-on. This is noted in `_voidNote`.

### 14.2 Backgrounds: v0.6 memory-lite set (replaces the full-height 720x640 tiles)
Built by `python3 tools/build_void.py --bg-lite` (it's also part of the full build). Verified by `python3 tools/check_void_lite.py`, which rebuilds each layer from its parts the way Code draws them, compares it with the `-full` backup, checks seams and prints the memory figures.
The layout data is in `hitboxes.json` -> `backgrounds.void`, and `"void"` is now in `backgrounds.stages`. **Each layer is a stack of parts drawn inside the usual 720-world-px tile slot** (tileWidth 720, same scroll offset as before). Every part is seamless in x. `y` is the world-px offset from the top of the 640-high playfield. PNGs are in `png/1x/` and `png/2x/`, with SVGs at the assets root.

| layer | part | 1x px | 2x px | world y | how to draw (per 720 tile slot) |
|---|---|---|---|---|---|
| far | sky gradient | - | - | 0..640 | canvas `createLinearGradient(0,0,0,640)` from `#2C2356` to `#7A64AE` (`sky-palettes.json` -> void). It doesn't scroll, so draw it once per frame. Optional image: `bg-void-far-sky` (8x64, 2x 16x128), drawn stretched to the full width and 640 high. |
| far | `bg-void-far-nebula` | 360x80 | 720x160 | 0 | **Draw stretched to 720x640** (`drawImage(img, dx, y, 720*s, 640*s)`) with `imageSmoothingEnabled = true`. The blobs are soft radial gradients, so the stretch is invisible: the rebuilt far layer has a mean diff of 0.5/255 against the old tile. |
| far | `bg-void-far-stars` | 360x320 | 720x640 | 0 and 320 | Draw 2x2 per slot at (0,0), (360,0), (0,320) and (360,320). It is seamless in x and y. It uses the old density and palette (42 stars + 3 sparkles per tile). The star positions are new, so it isn't pixel-identical to the old tile. |
| mid | `bg-void-mid-upper` | 720x320 | 1440x640 | **128** | Draw at (dx, 128). Contains the clock, CRT, cassette and gramophone silhouettes plus 2 mist ovals. It is cut from the old tile, so it's pixel-identical. |
| mid | `bg-void-mid-lower` | 720x96 | 1440x192 | **504** | Draw at (dx, 504). Contains the phone silhouette plus the low mist oval. Pixel-identical. |
| near | `bg-void-near-ceil` | 720x72 | 1440x144 | **0** | Cotton-candy ceiling bank, content y 0..68. |
| near | `bg-void-near-floor` | 720x84 | 1440x168 | **556** | Cotton-candy floor bank, content y 560..640. |
| near | `bg-void-near-glint-sparkle` | 12x12 | 24x24 | sprite | anchor (6,6). Placed 6 times per slot, see `placements`. Draw at `(x - 6*scale, y - 6*scale)`, size `12*scale`. |
| near | `bg-void-near-glint-note` | 20x20 | 40x40 | sprite | anchor (6,17), with 65% alpha baked in. Placed 3 times per slot. |

Glint placements (world px in the 720 slot, `hitboxes.json` -> `backgrounds.void.near[2].placements`):
- sparkles at (40,140) x0.75, (200,470) x0.9, (330,90) x0.65, (480,330) x0.8, (640,500) x0.7 and (560,180) x0.6
- notes at (120,260), (420,420) and (690,230), all x1

Dropping the glints entirely is also fine.

**Decoded RGBA memory** (w*h*4, source images only, not counting Code's layer cache):

| set | 1x | 2x |
|---|---|---|
| old `bg-void-{far,mid,near}` (3 x 720x640 / 1440x1280) | 5.27 MiB | 21.09 MiB |
| old `bg-trans-space-void-{far,mid,near}` (now skipped) | 5.27 MiB | 21.09 MiB |
| **new lite set (all parts above, including the sky PNG and glints)** | **2.12 MiB** | **8.50 MiB** (-60% vs the old void layers; -80% vs void + trans) |

At 2x the new set breaks down as follows:
- far: nebula 0.44 + stars 1.76 = 2.20 MiB (the sky PNG adds 0.008 MiB if used)
- mid: upper 3.52 + lower 1.05 = 4.57 MiB
- near: ceiling 0.79 + floor 0.92 + glints 0.01 = 1.72 MiB

Further optional savings:
- Load the **1x** `bg-void-mid-*` on 2x screens. The silhouettes are soft and sit at 42% alpha with 0.15x parallax. This brings mid down to 1.14 MiB, saving 3.4 MiB.
- Do the same with `bg-void-far-stars`, saving 1.3 MiB. 2x is then about 3.7 MiB.

- Old full-height files are kept as backups: `bg-void-{far,mid,near}-full.svg` and `png/{1x,2x}/bg-void-{far,mid,near}-full.png`. The original names `bg-void-{far,mid,near}.*` are **left in place, unchanged** so the current loader (`bg-{stage}-{layer}.png`) doesn't 404 until Code switches over to `backgrounds.void`. After that they can be deleted (they're identical to the `-full` files).
- Suggested scroll speeds are unchanged: far 0.05x, mid 0.15x, near 0.5x (`backgrounds.scroll.void`).
- Seams (self-wrap, `check_void_lite.py`):
  - mid upper and lower: 0.00
  - near ceiling: 0.13, near floor: 0.11
  - stars: x 0.28, y 0.00
  - nebula: 5.5 at its native 360px size, below its p99 inner column diff of 10.9. Stretched to 1440px, the wrap is 0.10, the same as the old tile's 0.15.
- `sky-palettes.json` -> `"void": {"top": "#2C2356", "bottom": "#7A64AE"}`.

### 14.3 Space -> Void transition
- **Deprecated / optional:** `bg-trans-space-void-{far,mid,near}` (720x640, 21 MiB at 2x). These files are left in place but are **not used**. Following David's OK, Code swaps the space layers for the void lite set **under the mist at frame 3**, with no transition tiles. They aren't listed in `backgrounds.transitions` (`backgrounds.void.transitions` says "none").
- Overlay `bg-trans-space-void-mist-0..7`: still used. It is 360x640 full-screen, transparent, **8 frames @ 8 fps (1.0 s), played once over the scene**, with a strip at `bg-trans-space-void-mist-strip.png`.
  - Frames 0-3: the stars blur into pastel mist (alpha rises).
  - Frames 4-7: satin ribbons with bows drift down from the top while the mist thins. Frame 7 is almost clear.
  - Start the overlay with the stage banner, and **swap the bg layers to void at frame 3**, when the mist is thickest.
- Then `ui-banner-void` plus `fx-burst-void` as for the other stages.

### 14.4 UI (matches section 11.3)
- `ui-banner-void` (300x90, pre-lettered "The Void" in Capriola) and `ui-banner-void-blank`, with alarm-clock and cassette motifs.
- `ui-stage-badge-7` (96x48).
- `fx-burst-void-0..5` (160x160, centre (80,80), 6 frames @ 12 fps, play once; strip `fx-burst-void-strip.png`): music notes, mini cassettes, ribbon curls and pastel stars.

## 15. Void v2.0: retro floaters and the Invader Wave (TUNING v2.0)

Built by `tools/build_void_v2.py`, which writes the SVGs, the `png/1x` and `png/2x` PNGs and the strips, and merges into `hitboxes.json` and `death-map.json`. Preview: `tools/build_preview_void_v2.py` -> `preview-sheet-void-v2.png`. Names follow `game.js` `CONFIG.assets.sheets`.

### 15.1 Floaters (`hitboxes.json` -> `hazards.void-float-*`, circle at (20,20); Tuning owns r)
| hazard id | art | files | r | frames |
|---|---|---|---|---|
| `void-float-a` | mini cassette | `obs-void-float-cassette` (frame 0, as game.js loads it), `obs-void-float-cassette-0..3`, `-strip` | 13 | 4 @ 6 fps |
| `void-float-b` | pocket watch ("clock") | `obs-void-float-clock`, `-0..3`, `-strip` | 14 | 4 @ 6 fps |
| `void-float-c` | mini rotary phone | `obs-void-float-phone`, `-0..3`, `-strip` | 12 | 4 @ 6 fps |
| `void-float-d` (optional, not in CONFIG yet) | floppy disk | `obs-void-float-floppy`, `-0..3`, `-strip` | 13 | 4 @ 6 fps |
- 40x40. The loop is a gentle ±6° wobble about the hit centre plus a sparkle twinkle. The hit circle stays at (20,20) on every frame.
- `game.js` currently loads the single frame. To animate, use `file: 'obs-void-float-<art>-strip.png', frames: [0,1,2,3], fps: 6`.
- The drift and bob motion is Code's (`CONFIG.hazards.types`).
- The phone art is a bit wider than its r12 circle. That's intentional and matches the small hitbox Tuning set.

### 15.2 Invader Wave (`hitboxes.json` -> `events.void-invader`, circle (20,20) r14; Tuning owns r)
- `event-void-invader-strip.png` (type a, mint): 40x40, **2-frame march @ 4 fps**, as `game.js` expects. Frames are `event-void-invader-0` and `-1`.
- Extra types with the same size, hitbox and fps: `event-void-invader-b-strip` (pink) and `event-void-invader-c-strip` (lilac). These are listed in `events.void-invader.variants`, for example one type per row or per wave.
- `event-void-invader-pop-0..5` plus `-strip`: 64x64, centre (32,32), 6 frames @ 12 fps, played once. Pixel confetti and a "pop!". Decorative, with no hitbox (`events.void-invader-pop`).
- `ui-event-warning-void-0/1` plus `-strip`: 40x40, 2 frames @ 4 fps. The Void version of `ui-event-warning`: a "!" bubble with an invader peeking out (`events.warning-void`), for the "Invaders!" warning.
- Art is about 32x26 inside the 40 canvas. With Code's `spacing: 44` there are about 12px between invaders in a curtain. The legs reach about 1–2px past r14 at the bottom corners.

### 15.3 death-map.json
`void-float-a`, `-b`, `-c` and `-d` -> `generic` (small, light keepsakes; `game.js` already maps them this way). `void-invader` and `invaderWave` -> `generic`. This is noted in `_voidV2Note`.

## Promo / non-game art

| File | Size | Notes |
|---|---|---|
| `thumb-alfie-cozy-jazz.png` | 1280×720 | YouTube thumbnail for "Cozy Jazz for Dogs" (Alfie, ink + coloured-pencil style). Not an in-game sprite, so no hitbox and no entry in `hitboxes.json`. Source and generator: `/workspace/dog-jazz/thumb-kawaii/` (`tools/build_ghibli.py`). |
| `thumb-alfie-cozy-jazz-168x94.png` | 168×94 | Small-size legibility check of the above. |
