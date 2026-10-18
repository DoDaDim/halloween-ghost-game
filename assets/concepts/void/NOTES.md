# The Void: concept directions (concept only, NOT wired into the game)

The Void is a final endless zone after space, where retro objects from the past float as obstacles. Everything is script-generated SVG and rendered by `tools/build_void_concepts.py`, which builds all three sheets. It reuses the game's ghost puppet from `assets/tools/build_v05.py`. This job didn't touch `hitboxes.json`, the main `ASSETS.md` or any game files.

Shared obstacle cast: typewriter, CRT TV, rotary phone, cassette, gramophone, alarm clock. Each one has a readable silhouette, and the faces are optional.

| sheet | direction | pitch |
|---|---|---|
| `void-concept-A.png` | Nebula Drift | A dreamy lilac nebula where lost keepsakes float on pastel ribbons, sleepy and sweet. |
| `void-concept-B.png` | Static Signal | A lost-channel VHS void: CRT towers, teal/magenta glitch and scanlines, with cute pixel faces on the screens. |
| `void-concept-C.png` | Memory Glow | A deep ink void where warm sepia memories glow like lanterns, hung on golden light-threads. |

## Top and bottom logic for floating objects
- **A:** tops hang from cloud banks on satin ribbons. Bottoms sit on cotton-candy cloud islands, with a ribbon down to the screen edge.
- **B:** tops dangle from coiled phone and AV cords. Bottoms are wobbly stacks of CRTs and cassettes on a cable to the floor.
- **C:** tops hang on golden light-threads. Bottoms float on memory-dust pools, with a thread down to the edge.

## Later (when one is picked)
- **Hitbox continuity rule:** treat each tether, cord or stack link as a solid rect at least about 24px wide, from the screen edge to the gap edge. That way the ghost can't fly between objects or along a thin ribbon. Objects bob about ±4px visually only, and the hitbox stays still.
- **Stacking:** objects stack inside the 72px column footprint, at about 90px per object, so the art will need resizing to fit the 72px footprint.
- **Transition:** each sheet shows a 4-panel space-to-Void idea. A: the stars blur into pastel mist, then ribbons drift in. B: the signal crackles, then NO SIGNAL, then it tunes into the Void. C: the stars go out one by one, then a warm memory-light blooms.
- **Pick-and-mix:** directions can be combined, for example A's ribbons with C's glow.
