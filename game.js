// =============================================================================
// Ghost Flap v0.6.1 — Halloween Flappy-style kawaii ghost game (v0.6: The Void, TUNING v2.0;
// v0.6.1: warp cuts under the mist without trans tiles, space unloaded after the swap, Art §14.2 memory-lite Void parts, Void card frame)
// All tunables live in CONFIG (docs/TUNING.md v1.0–v1.7, plus build-only keys
// marked [build]). Game logic reads every number from CONFIG.
// Units: logical pixels (360x640 playfield) and seconds.
// PROGRESSION counts PAIRS PASSED (TUNING v1.7): gapFor/spacingFor/speedFor, unlockAt,
// v0.4.2: launch.atScore is the DISPLAYED score; v0.6: warp.atScore (space -> The Void) likewise. startAt, events firesAt/repeatEvery, hazards/golden minScore are all in pairs.
// Score (with bonuses) is only for display, best score and medals.
// QA hooks (query string): ?stage=N|id  ?event=hearse|rocket|<id>  ?pickup=1|all
//   ?event=warp (score -> warp.atScore)  ?stage=void
//   ?golden=1|0 (golden run)  ?god=1 (no deaths, hits logged)  ?effects=0
// =============================================================================
const CONFIG = {
  world: { width: 360, height: 640, groundHeight: 80, maxDt: 1 / 30,
          physicsHz: 60 }, // [build] fixed physics timestep (QA P2); values are tuned for 60 Hz

  ghost: {
    x: 108,               // ghost x position (30% of width)
    gravity: 1500,        // px/s² downward
    flapImpulse: -430,    // px/s — flap SETS vy to this (does not add)
    maxFallSpeed: 620,    // px/s cap when falling
    maxRiseSpeed: -520,   // px/s cap when rising
    hitboxRadius: 18,     // fallback circle hitbox radius; overridden by hitboxes.json
    tiltUp: -20,          // degrees on flap (cosmetic)
    tiltDownMax: 60,      // degrees max when falling (cosmetic)
    size: 64,             // drawn sprite size (64 = Art sprite 1:1, Tuning v1.2)
    tiltLerp: 10,         // [build] tilt easing (1/s)
    bobAmplitude: 6,      // [build] idle bob on the ready screen, px
    bobSpeed: 3,          // [build] idle bob speed, rad/s
  },

  tombstones: {           // column/gap geometry (all column types share it)
    width: 64,            // collision column width (sprite x 8..72)
    gapStart: 180,
    gapMin: 145,
    gapShrinkPer10: 3,
    spacingStart: 220,    // left edge to left edge
    spacingMin: 190,
    spacingShrinkPer10: 5,
    edgeMargin: 120,      // gap centre range 120..440
    maxCentreDelta: 180,
    firstSpawnDelay: 1.4,
    capRadius: 30,        // [build] placeholder tomb cap radius
    spawnMargin: 16,      // [build] spawn this far past the right edge
  },

  speed: { start: 150, stepEvery: 5, stepAmount: 6, max: 240 },

  patterns: {
    breatherPairs: 2,
    noRepeat: true,
    pool: [
      { name: 'random',     unlockAt: 0,  length: 1 },
      { name: 'stairsUp',   unlockAt: 15, length: 4, step: -50 },
      { name: 'stairsDown', unlockAt: 15, length: 4, step: 50 },
      { name: 'zigzag',     unlockAt: 30, length: 4, amplitude: 80 },
      { name: 'tunnel',     unlockAt: 30, length: 3, spacingDelta: -20 },
      { name: 'wave',       unlockAt: 50, length: 5, amplitude: 90 },
    ],
  },

  stages: {
    loopFrom: 'void', // v2.0: The Void is the final, endless stage (space is no longer endless)
    // v0.6.1 (QA F3, David's rule: top and bottom must not look alike): never pair the same object top and bottom.
    // objectOf: regex whose group 1 names the object behind a column id (obs-void-crt-top / -bottom -> crt).
    pairRule: { distinctObjects: true, objectOf: '^obs-void-(.+)-(?:top|bottom)$' },
    // v1.8: tops hang from above, bottoms are stage-themed. Ids are CONFIG.objects keys
    // (Art's hitboxes.json columns._stageTopsV04 / _stageBottomsV04). Tops only ever go on top, bottoms on the bottom.
    list: [
      { id: 'graveyard',   startAt: 0,
        top:    { 'lantern-branch': 2, 'spider': 2 },
        bottom: { 'tomb-a': 1, 'tomb-b': 1, 'tomb-c': 1, 'coffin': 1, 'cross': 1 } },
      { id: 'church',      startAt: 5,
        top:    { 'chandelier': 2, 'bats': 1, 'bell': 1 },
        bottom: { 'ivystone': 2, 'font': 1, 'lychgate': 1 } },
      { id: 'countryside', startAt: 15,
        top:    { 'beehive': 2, 'branch': 2, 'swing': 1 },
        bottom: { 'haybales': 2, 'pumpkinstack': 1, 'churn': 1 } },
      { id: 'school',      startAt: 30,
        top:    { 'handbell': 2, 'kite': 2, 'lamp': 1 },
        bottom: { 'books': 2, 'lockers': 2, 'globe': 1 } },
      { id: 'city',        startAt: 50,
        top:    { 'cradle': 2, 'trafficlight': 2, 'neonsign': 1, 'cranehook': 1 },
        bottom: { 'postbox': 2, 'phonebox': 1, 'hydrant': 1 } },
      { id: 'space',       startAt: 100,
        top:    { 'satellite': 2, 'arm': 1, 'astronaut': 1, 'ufo': 1 },
        bottom: { 'moonrock': 2, 'crystals': 1, 'alienplant': 1 },
        // applied only while in space; same key names as CONFIG.ghost
        physics: { gravity: 1400, flapImpulse: -415, maxFallSpeed: 560, maxRiseSpeed: -520 } },
      // v2.0 (TUNING.md): reached ONLY by the warp at a displayed score (no startAt in pairs).
      // Art §14 column ids (Tuning's void-top-* / void-bot-* placeholders are aliases, see objectAliases).
      // Weights = Art's suggested weights from hitboxes.json columns._stageTopsVoid / _stageBottomsVoid (Tuning owns them).
      { id: 'void',        startAtScore: 200, // displayed score, like the launch (= warp.atScore)
        top:    { 'obs-void-crt-top': 2, 'obs-void-phone-top': 2, 'obs-void-alarm-top': 2, 'obs-void-typewriter-top': 1, 'obs-void-cassette-top': 1, 'obs-void-gramophone-top': 1 },
        bottom: { 'obs-void-typewriter-bottom': 2, 'obs-void-crt-bottom': 2, 'obs-void-phone-bottom': 1, 'obs-void-cassette-bottom': 1, 'obs-void-gramophone-bottom': 1, 'obs-void-alarm-bottom': 1 },
        physics: 'normal',                 // back to standard flap and gravity
        breatherPairs: 1,                  // 1 random breather between patterns (was 2)
        speed: { stepEveryPairs: 10, stepAmount: 4, max: 270 }, // ramps on from 240, counted from Void entry
        gap: 145, spacing: 190 },          // held at the floors, never tighter
    ],
    aliases: { schools: 'school' }, // [build] old stage ids still accepted by ?stage= / setStage
    bottom: { 'tomb-a': 1, 'tomb-b': 1, 'tomb-c': 1 }, // [build] default if a stage has no bottom map
    transition: {
      emptySlots: 1,        // empty pair-slot at a stage change
      bannerSeconds: 1.5,   // stage name banner during the crossfade
      easyPairs: 2,         // first pairs of a new stage: random only...
      easyGapBonus: 15,     // ...with a gap this much wider
      speedHoldPairs: 0,    // v1.5: 0 = off (speed purely score-based); code path kept
      crossfadeSeconds: 1.5,// [build] backdrop crossfade length
    },
  },

  // v1.8: the old `columns` bottom-mix map is retired; bottoms live in stages.list[].bottom

  // small hazards in the open space BETWEEN pairs, never inside a gap
  hazards: {
    minClearance: 70,   // px from the line joining neighbouring gap centres (measured to hazard edge)
    minScore: 3,        // in PAIRS (v1.7)
    maxPerPair: 1,
    types: {
      bat:          { radius: 12, motion: 'bobY', amplitude: 30, period: 1.2 },
      pumpkin:      { radius: 14, motion: 'sitOnColumn' }, // [build] rests on the ground between pairs (see report)
      skull:        { radius: 13, motion: 'driftY', amplitude: 45, period: 2.4 },
      miniAsteroid: { radius: 13, motion: 'driftY', amplitude: 40, period: 3.0, spin: true, spinSpeed: 1.8 }, // ~103 deg/s (Art: 90-120)
      alien:        { radius: 13, motion: 'bobY', amplitude: 30, period: 1.4 },
      // v2.0 retro floaters (r 12 to 14 per Tuning; motion values [build])
      'void-float-a': { radius: 13, motion: 'driftY', amplitude: 35, period: 2.8, art: 'cassette' },
      'void-float-b': { radius: 14, motion: 'bobY', amplitude: 28, period: 1.6, art: 'clock' },
      'void-float-c': { radius: 12, motion: 'driftY', amplitude: 40, period: 3.2, art: 'phone' },
      'void-float-d': { radius: 13, motion: 'bobY', amplitude: 30, period: 2.0, art: 'floppy' }, // Art §15 optional floppy (pending Tuning sign-off)
    },
    perStage: {
      graveyard:   { chance: 0.15, mix: { skull: 2, pumpkin: 1 } },
      church:      { chance: 0.20, mix: { bat: 2, skull: 1 } },
      countryside: { chance: 0.25, mix: { pumpkin: 2, bat: 1 } },
      school:      { chance: 0.30, mix: { bat: 1, pumpkin: 1, skull: 1 } },
      city:        { chance: 0.35, mix: { bat: 2, skull: 2, pumpkin: 1 } },
      space:       { chance: 0.35, mix: { miniAsteroid: 2, alien: 1 } },
      void:        { chance: 0.40, mix: { 'void-float-a': 1, 'void-float-b': 1, 'void-float-c': 1, 'void-float-d': 1 } }, // retro floaters (d = floppy, equal weight, pending Tuning)
    },
    noHazardDuring: ['transition', 'event', 'goldenPickupPair'],
  },

  launch: {
    target: 'space',         // v0.6: the stage the rocket flies to (no longer the endless loop stage)
    trigger: 'score',        // v0.4.2 hotfix (David): launch when the DISPLAYED score reaches atScore
    atScore: 100,            // displayed score (bonuses included); pairs >= stages[space].startAt also launches (QA hooks)
    eventFinishMaxSeconds: 6, // an ACTIVE event at that moment finishes first (max this long), else it's cleared
    cutsceneSeconds: 2.5,    // no collisions, no scoring, pairs on screen cleared, taps ignored
    speedRamps: true,        // speedFor(score) keeps applying
    then: 'transition',      // normal stage breather afterwards
    achievement: 'Lift-off!',
    // Art timeline (ASSETS.md §8), in seconds of a 2.5 s cutscene (scaled if cutsceneSeconds changes)
    timeline: { padIn: 0.5, board: 0.3, ignite: 0.5, liftOff: 0.8, climb: 1.0, arrive: 2.2 },
    padWorld: [80, 420],     // launch pad top-left (bottom on the ground line)
    rocketOnPad: [22, -28],  // rocket offset from pad: x = padX + 70 - 48, y = padY + 112 - 140
    porthole: [48, 66],      // ghost tweens into this point of the rocket sprite
    liftOffRise: 60, climbHoldY: 250, climbDrift: 40, zoomSpeed: 600,
    skyPan: [1280, 0],       // bg-launch-sky window top: bottom -> top during the climb
    clouds: { count: 4, speedMin: 500, speedMax: 700 },
    smoke: { life: 0.7, spread: 60, rate: 22 },
    shakePx: 2,
    crossfadeAt: 0.88,       // = arrive / 2.5: stage switches to space and its layers fade in
  },

  // v2.0 (TUNING.md): space -> The Void handover. Same rule as the launch: DISPLAYED score, once per run
  // (reset() clears it), a bonus jumping past atScore still triggers, an active event finishes first.
  warp: {
    atScore: 200,
    cutsceneSeconds: 2.0,     // no collisions, no scoring, pairs cleared, taps ignored
    then: 'transition',
    achievement: 'Into the Void',
    from: 'space', target: 'void', // [build]
    eventFinishMaxSeconds: 6, // [build] same as the launch
    // [build] 'stars blur into pastel mist', seconds of a 2.0 s cutscene (scaled if cutsceneSeconds changes):
    // 0..streak[1] the stars stretch into streaks; at mistStart Art's mist overlay (§14.3, 8 f @ 8 fps, once) and the
    // 'The Void' banner start together; the bg layers switch to void (via the trans tiles) at mist frame switchFrame.
    timeline: { streak: [0.0, 1.2], mistStart: 1.0, ghostSettle: 1.0 },
    mist: { file: 'bg-trans-space-void-mist-strip.png', folder: '1x', frames: 8, fps: 8, w: 360, h: 640, switchFrame: 3, // 1x strip upscaled (soft art, 4x less memory)
      // v0.6.1 (QA F1 flicker): alpha-crossfade frame f -> f+1 by sub-frame progress (the frame after the last is empty),
      // normalise: per-frame alpha gain so each frame's mean mist luminance follows a 3-tap smoothed curve (never > 1),
      // swapFadeSeconds: the outgoing (space) backdrop, snapshotted just before the cut, fades out over the new one.
      crossfade: true, normalise: true, swapFadeSeconds: 0, // swapFade (full-canvas snapshot) costs 33 ms frames in headless: off
      veil: { peak: 0.5, halfWidth: 0.2 } }, // a flat lilac veil peaking at the cut hides the space -> void luminance step (drawn into the 1x mist buffer)
    warmOnIdle: true,         // v0.6.1 (QA F4): from the prewarm trigger, decode the Void images one per idle callback
    streakLength: 110, streakCount: 36, mistBlobs: 10, ribbons: 3, // placeholder mist (if Art's strip is missing)
    prewarmScoreAhead: 5,     // [build] queue the Void tiles only this close to atScore (or once the warp starts)
    // v0.6.1 (Art option b): no bg-trans-space-void tiles (not even loaded); the layers cut space -> void under the
    // mist at switchFrame, then the space tiles are evicted and their images unloaded (reloaded on the next run).
    useTransitionTiles: false,
    unloadFromAfterSwap: true,
    deferLayers: ['near'],    // Void layers built only after the swap (space gone first: 2x peak 23.5 MB, not 31.7);
                              // under the warp mist an uncached deferred layer is skipped for the few frames its build takes
    qaStartPairs: 200,        // [build] ?stage=void starts here (QA only; the real entry is the warp)
  },

  golden: {
    run: { enabled: true, chance: 0.04, scoreMultiplier: 2, firstPointBonus: 10 }, // kept per Boss/David
    maxMultiplier: 2,                   // run x2 and pickup x2 don't stack (null = allow stacking)
    pickupOnGoldenRun: 'doubleInstant', // golden run: pickup pays 2x instant points, no x2 mode
    // v1.9: the old golden pickup + x2 mode are replaced by CONFIG.specials.rush (golden.run stays)
    sparkleRate: 18,       // [build]
    sparkleLife: 0.6,      // [build]
  },

  // v1.9 / v1.9.1 (TUNING.md): three rare special ghosts at a gap centre. Progress counts in PAIRS.
  specials: {
    minPairsBetweenAny: 8, onePerScreen: true, noSpawnWhileActive: true,
    noSpawnDuring: ['transition', 'event', 'launch'],
    radius: 16, placement: 'gapCentre',
    order: ['rush', 'extraLife', 'slowMo'], // roll order when several are due (pity first)
    rush: {
      fromPairs: 10, chancePerPair: 0.03, minPairsBetween: 25, pityAfterPairs: 50,
      space: { chancePerPair: 0.04, minPairsBetween: 20, pityAfterPairs: 40 },
      void:  { chancePerPair: 0.04, minPairsBetween: 20, pityAfterPairs: 40 }, // v2.0: the Void uses the space rates
      seconds: 5, invincible: true, smashThrough: true,
      instantPoints: 5, pairPoints: 1, smashBonus: 1, scoreMultiplier: 2, // x2 capped by golden.maxMultiplier
      graceSeconds: 1.0, floorAndCeilingSafe: true,
      forwardShift: 30, shiftEaseSeconds: 0.4, // cosmetic only: hitbox stays at ghost.x
    },
    extraLife: {
      fromPairs: 8, chancePerPair: 0.025, minPairsBetween: 30, pityAfterPairs: 60,
      maxHeld: 1, instantPoints: 2, pointsIfAlreadyHeld: 5,
      onHit: { invulnSeconds: 1.5, knockToGapCentre: true, knockSeconds: 0.3, vyAfter: 0 },
      blinkHz: 10,
    },
    slowMo: {
      fromPairs: 15, chancePerPair: 0.03, minPairsBetween: 20, pityAfterPairs: 45,
      seconds: 6, worldScale: 0.6, rampSeconds: 0.4, instantPoints: 3,
      tint: '#BFE6FF', tintAlpha: 0.18, overlayFadeSeconds: 0.3,
      flakes: { max: 18, perSecond: 6, fallMin: 30, fallMax: 60, spinMin: 30, spinMax: 90, sway: 10 },
    },
    // [build] Art (ASSETS.md §13). Offsets relative to the 64px ghost's top-left; sizes in game px.
    art: {
      pickup: { rush: 'pickup-rush-strip.png', extraLife: 'pickup-life-strip.png', slowMo: 'pickup-chill-strip.png', size: 56, frames: 4, fps: 8 },
      ghostRush: { file: 'ghost-rush-strip.png', w: 112, h: 64, frames: 4, fps: 12, dx: -48, dy: 0 },
      rushAura: { file: 'fx-rush-aura-strip.png', w: 96, h: 96, frames: 4, fps: 8, dx: -16, dy: -16 },
      candyBurst: { file: 'fx-candy-burst-strip.png', w: 128, h: 128, frames: 6, fps: 12 },
      heart: { file: 'ghost-heart-overlay-strip.png', w: 20, h: 20, frames: 2, fps: 4, dx: 40, dy: 2 },
      heartPop: { file: 'fx-heart-pop-strip.png', w: 96, h: 96, frames: 6, fps: 12, dx: -16, dy: -16 },
      heartBreak: { file: 'fx-heart-break-strip.png', w: 96, h: 96, frames: 6, fps: 12, dx: -16, dy: -16 },
      frostBurst: { file: 'fx-frost-burst-strip.png', w: 96, h: 96, frames: 6, fps: 12, dx: -16, dy: -16 },
      frostVignette: { file: 'ui-frost-vignette.png' },
      flakes: ['fx-frost-flake-a.png', 'fx-frost-flake-b.png', 'fx-frost-flake-c.png'], flakeSize: 16,
      hud: { rush: 'ui-hud-rush-48.png', extraLife: 'ui-hud-life-48.png', slowMo: 'ui-hud-chill-48.png', size: 26 },
      fxSeconds: 0.5, // [build] = 6 frames @ 12 fps
      placeholder: { rush: '#FFD966', extraLife: '#FF6F8E', slowMo: '#8FD3FF' },
    },
  },

  // one event per stage visit; repeats (repeatEvery) only while still in that zone
  events: {
    speedHold: false,      // v1.5: off; code path kept
    warningSeconds: 1.0,
    repeatOnlyInZone: true, // [build] city repeats at 58, 83 (not after launch); space 120, 150, ...
    list: {
      graveyard:   { id: 'hearse',       firesAt: 3,  seconds: 3.0, bonus: 3,
                     floorRise: 60, length: 150, // [build] placeholder size; sprite uses hitboxes.json (top 52 px)
                     desc: 'Hearse rolls along the ground; floor rises 60 px while it passes.' },
      church:      { id: 'batSwarm',     firesAt: 10, seconds: 3.5, bonus: 4,   // TODO(v0.4) stub
                     desc: '6 bats burst from the spire in a loose line across the upper half; fly low.' },
      countryside: { id: 'pumpkinRoll',  firesAt: 22, seconds: 4.0, bonus: 5,   // TODO(v0.4) stub
                     desc: '3 pumpkins bounce across the lower half at different heights; thread between.' },
      school:      { id: 'sweetShower',  firesAt: 38, seconds: 4.0, bonus: 0, perSweet: 1, maxSweets: 6, // TODO stub
                     desc: 'Trick-or-treat sweets fall from the top; catch them for +1 each. No hazards.' },
      city:        { id: 'nightBus',     firesAt: 58, repeatEvery: 25, seconds: 3.5, bonus: 6, // TODO stub
                     desc: 'Night bus along the ground (floor rises 70 px) with a pigeon flock above; ride the middle.' },
      space:       { id: 'meteorShower', firesAt: 120, firesAfterLaunchPairs: 15, repeatEvery: 30, seconds: 4.0, bonus: 8,
                     // [build] 2 diagonal waves, each a curtain of meteors with one clear lane
                     waves: 2, waveCrossAt: [1.0, 2.6], laneHeight: 170, spacing: 50,
                     vx: -320, vy: 160, laneShiftMin: 60, laneShiftMax: 120, laneMinY: 140, laneMaxY: 420,
                     desc: 'Meteors streak diagonally from top-right in 2 waves with a clear lane between; hold the lane.' },
      // v2.0: counted from Void entry (pairs at the warp); meteors are space-only, so they stop in the Void
      void:        { id: 'invaderWave', firesAfterEntryPairs: 10, repeatEvery: 30, seconds: 4.0, bonus: 10,
                     // [build] 2 rows (formations) sweep right -> left, each a full-height curtain with ONE clear lane
                     waves: 2, waveCrossAt: [1.2, 2.8], laneHeight: 176, spacing: 44, r: 14, vx: -260, wiggle: 3,
                     rowSheets: ['invader', 'invaderB', 'invaderC'], // one colour per row (wave), picked without repeats
                     rowColors: ['#AEE3C6', '#FFB6CC', '#D9C6F5'],   // placeholder colours for the same three types
                     popSeconds: 0.5, warningSheet: 'warningVoid',
                     laneShiftMin: 60, laneShiftMax: 110, laneMinY: 150, laneMaxY: 410,
                     desc: 'Two rows of retro pixel invaders sweep across with one clear lane at least 176 px tall; hold the lane.' },
    },
  },

  scoring: {
    perPair: 1,
    medals: { bronze: 10, silver: 25, gold: 50, pumpkin: 100 },
    bestKey: 'ghostGame.best',
    // v0.5 player profiles + local top-10 (ScoreService)
    defaultPlayer: 'Player 1', // the pre-v0.5 best migrates into this profile
    maxNameLength: 12,
    maxProfiles: 12,
    topScoresMax: 10,
  },

  // v0.5 death animations (Art: ASSETS.md §11.1, death-map.json). Frames death-<type>-<n> and
  // death-<type>-golden-<n>, loaded as Art's <base>-strip.png (128x128, 12 fps, anchor [64,64] = ghost anchor; drawn at
  // (ghostX - 64k, ghostY - 64k), k = ghost.size / 64). Each plays once and holds its last frame
  // (tombstone loops frames loop[0]..loop[1] while held). `seconds` (< 1.5) = how long taps are
  // ignored; the normal restart lockout starts after it. A type whose frames fail to load falls back
  // to placeholder drawing. Map: generated from Art's death-map.json (59 ids; art prefixes and
  // '<stage>-<event>' keys translated to game ids) by qa/v05/gen_config.js, plus 'tomb' (random tomb).
  // Anything unlisted -> generic.
  deathAnims: {
    file: 'death-{type}-strip.png', goldenFile: 'death-{type}-golden-strip.png', // horizontal strips of the -<n> frames
    frameSize: 128, anchor: [64, 64], fps: 12,
    types: {
      bat:       { frames: 10, seconds: 1.1 },
      pumpkin:   { frames: 8,  seconds: 1.0 },
      meteor:    { frames: 10, seconds: 1.1 },
      tombstone: { frames: 10, seconds: 1.3, loop: [2, 9] },
      skull:     { frames: 10, seconds: 1.0 },
      floor:     { frames: 8,  seconds: 1.0 },
      generic:   { frames: 10, seconds: 1.0, fadeLast: true },
    },
    aliases: { stars: 'tombstone', stone: 'tombstone', poof: 'generic' }, // extra ?death= names
    fallback: 'generic',
    map: {
      'tomb-a': 'tombstone', 'tomb-b': 'tombstone', 'tomb-c': 'tombstone', coffin: 'tombstone', cross: 'tombstone', moonrock: 'tombstone',
      'obs-church-spire': 'tombstone', bell: 'generic', branch: 'generic', 'obs-countryside-scarecrow': 'generic', 'obs-school-chimney': 'tombstone', 'obs-school-clocktower': 'tombstone',
      'obs-city-skyscraper': 'tombstone', cranehook: 'generic', satellite: 'generic', ufo: 'generic', asteroid: 'meteor', 'lantern-branch': 'generic',
      spider: 'generic', chandelier: 'generic', bats: 'bat', beehive: 'generic', swing: 'generic', handbell: 'generic',
      kite: 'generic', lamp: 'generic', cradle: 'generic', trafficlight: 'generic', neonsign: 'generic', arm: 'generic',
      astronaut: 'generic', ivystone: 'tombstone', font: 'tombstone', lychgate: 'tombstone', haybales: 'generic', pumpkinstack: 'pumpkin',
      churn: 'generic', books: 'generic', lockers: 'generic', globe: 'generic', postbox: 'generic', phonebox: 'generic',
      hydrant: 'generic', crystals: 'tombstone', alienplant: 'generic', bat: 'bat', pumpkin: 'pumpkin', skull: 'skull',
      miniAsteroid: 'meteor', alien: 'generic', hearse: 'floor', batSwarm: 'generic', pumpkinRoll: 'generic', sweetShower: 'generic',
      nightBus: 'floor', 'city-pigeon': 'bat', meteorShower: 'meteor', ground: 'floor', ceiling: 'generic', tomb: 'tombstone',
      // v0.6 The Void
      // death-map.json §14: hanging tops -> generic, hard retro bottoms -> tombstone (see-stars)
      'obs-void-typewriter-top': 'generic', 'obs-void-crt-top': 'generic', 'obs-void-phone-top': 'generic', 'obs-void-cassette-top': 'generic', 'obs-void-gramophone-top': 'generic', 'obs-void-alarm-top': 'generic',
      'obs-void-typewriter-bottom': 'tombstone', 'obs-void-crt-bottom': 'tombstone', 'obs-void-phone-bottom': 'tombstone', 'obs-void-cassette-bottom': 'tombstone', 'obs-void-gramophone-bottom': 'tombstone', 'obs-void-alarm-bottom': 'tombstone',
      'void-float-a': 'generic', 'void-float-b': 'generic', 'void-float-c': 'generic', 'void-float-d': 'generic', invaderWave: 'generic', 'void-invader': 'generic',
    },
    fx: { // ASSETS.md §11.2 (12 fps)
      starsRing: { file: 'fx-stars-ring-strip.png', frames: 6, w: 64, h: 32 },
      smokePuff: { file: 'fx-smoke-puff-strip.png', frames: 4, w: 48, h: 48 },
      sparklePoof: { file: 'fx-sparkle-poof-strip.png', frames: 5, w: 96, h: 96 },
      bonk: { file: 'fx-bonk-strip.png', frames: 3, w: 64, h: 64 },
    },
    colors: { soot: '#2b2230', smoke: 'rgba(80, 70, 90, 0.55)', star: '#ffe08a', bat: '#5a4a78', spook: '#c9b3f0' },
  },

  // v0.5 stage transitions (Art: ASSETS.md §11.3): sky/palette crossfade, swooshing banner, burst,
  // 'Stage N' badge, parallax swap. Files use Art's stage ids (assets.backgrounds.artStageIds: school -> schools).
  transitions: {
    palette: { // from Art's sky-palettes.json ([top, bottom] of each bg-<stage>-far sky), interpolated during the crossfade
      graveyard:   ['#241D40', '#5E4A86'],
      church:      ['#222350', '#5A5490'],
      countryside: ['#1E2C4A', '#4E6E8A'],
      school:      ['#26245A', '#6E5694'],
      city:        ['#1C2044', '#4C3E7A'],
      space:       ['#120F2C', '#2B2050'],
      void:        ['#2C2356', '#7A64AE'], // sky-palettes.json (Art §14.2)
    },
    tintPeak: 0.32,          // overlay alpha at mid-crossfade (0 at both ends)
    banner: { inSeconds: 0.4, outSeconds: 0.4, fromX: 1.15, toX: -1.15, w: 300, h: 90, textX: 150, textBaseline: 47, sparkles: 14 }, // x as a fraction of W
    badge: { text: 'Stage {n}', y: 270, w: 96, h: 48, size: 14 },
    swap: { slide: { far: 18, mid: 30, near: 0 } }, // crossfaded layers ease up from +slide px (over assets.backgrounds.fadeSeconds)
    uiBarY: 505,             // v0.5 start/game-over buttons (players, top-10), logical px
    art: {                   // {stage} = Art's stage id, {n} = frame / stage number. Missing files -> placeholder drawing.
      banner: 'ui-banner-{stage}.png',          // pre-lettered (Capriola), preferred
      bannerStageBlank: 'ui-banner-{stage}-blank.png', bannerBlank: 'ui-banner-blank.png', // + CONFIG.looks name drawn on top
      burst: { file: 'fx-burst-{stage}-strip.png', frames: 6, w: 160, h: 160 },
      swoosh: { file: 'fx-swoosh-strip.png', frames: 6, w: 240, h: 64 }, // frame 0 is empty on purpose
      badge: 'ui-stage-badge-{n}.png', badgeBlank: 'ui-stage-badge-blank.png',
    },
  },
  // v0.5 profile icons (ASSETS.md §11.4), used by the DOM picker
  profileIcons: {
    dir: 'assets/png/2x/', size: 32,
    add: 'ui-icon-add-player-{size}.png', trophy: 'ui-icon-trophy-{size}.png', share: 'ui-icon-share-{size}.png',
    chip: 'ui-icon-player-chip-{color}-{size}.png', chipColors: ['pink', 'mint', 'butter', 'lilac'], // cycled per player
  },

  // [build] Column / hazard object registry. Sprites are picked up automatically when
  // Art adds the object's keys to hitboxes.json (no blind loads, so no 404s).
  // fallback 'tomb' = themed object drawn with tombstone sprites until its art exists.
  objects: {
    // side: 'top' = hangs (body + cap-bottom), 'bottom' = stands (cap-top + body). Only that cap is loaded.
    // art = file prefix in assets/. shape = placeholder used until (or if) the sprites load.
    // Retired as tops in v0.4 (files kept, not loaded): tomb-a/b/c (top), obs-church-spire,
    // obs-countryside-scarecrow, obs-school-clocktower, obs-school-chimney, obs-city-skyscraper.
    // --- tops ---
    'lantern-branch': { side: 'top', art: 'obs-graveyard-lantern-branch' },
    'spider':         { side: 'top', art: 'obs-graveyard-spider' },
    'chandelier':     { side: 'top', art: 'obs-church-chandelier' },
    'bats':           { side: 'top', art: 'obs-church-bats' },
    'bell':           { side: 'top', art: 'obs-church-bell' },
    'beehive':        { side: 'top', art: 'obs-countryside-beehive' },
    'branch':         { side: 'top', art: 'obs-countryside-branch' },
    'swing':          { side: 'top', art: 'obs-countryside-swing' },
    'handbell':       { side: 'top', art: 'obs-school-handbell' },
    'kite':           { side: 'top', art: 'obs-school-kite' },
    'lamp':           { side: 'top', art: 'obs-school-lamp' },
    'cradle':         { side: 'top', art: 'obs-city-cradle' },
    'trafficlight':   { side: 'top', art: 'obs-city-trafficlight' },
    'neonsign':       { side: 'top', art: 'obs-city-neonsign' },
    'cranehook':      { side: 'top', art: 'obs-city-cranehook' },
    'satellite':      { side: 'top', art: 'obs-space-satellite', shape: 'satellite' },
    'arm':            { side: 'top', art: 'obs-space-arm' },
    'astronaut':      { side: 'top', art: 'obs-space-astronaut' },
    'ufo':            { side: 'top', art: 'obs-space-ufo', shape: 'ufo' },
    // --- bottoms ---
    'tomb':           { side: 'bottom', tomb: 'random' },
    'tomb-a':         { side: 'bottom', tomb: 'a' },
    'tomb-b':         { side: 'bottom', tomb: 'b' },
    'tomb-c':         { side: 'bottom', tomb: 'c' },
    'coffin':         { side: 'bottom', art: 'obs-common-coffin', shape: 'coffin' },
    'cross':          { side: 'bottom', art: 'obs-common-cross', shape: 'cross' },
    'ivystone':       { side: 'bottom', art: 'obs-church-ivystone' },
    'font':           { side: 'bottom', art: 'obs-church-font' },
    'lychgate':       { side: 'bottom', art: 'obs-church-lychgate' },
    'haybales':       { side: 'bottom', art: 'obs-countryside-haybales' },
    'pumpkinstack':   { side: 'bottom', art: 'obs-countryside-pumpkinstack' },
    'churn':          { side: 'bottom', art: 'obs-countryside-churn' },
    'books':          { side: 'bottom', art: 'obs-school-books' },
    'lockers':        { side: 'bottom', art: 'obs-school-lockers' },
    'globe':          { side: 'bottom', art: 'obs-school-globe' },
    'postbox':        { side: 'bottom', art: 'obs-city-postbox' },
    'phonebox':       { side: 'bottom', art: 'obs-city-phonebox' },
    'hydrant':        { side: 'bottom', art: 'obs-city-hydrant' },
    'moonrock':       { side: 'bottom', art: 'obs-space-moonrock', shape: 'asteroid' },
    'crystals':       { side: 'bottom', art: 'obs-space-crystals' },
    'alienplant':     { side: 'bottom', art: 'obs-space-alienplant' },
    // --- v0.6 The Void (ASSETS.md §14). Loaded like v0.4: only when hitboxes.json lists <id>-cap-bottom (tops) /
    // <id>-cap-top (bottoms); otherwise the neutral hang/stand placeholder is drawn.
    'obs-void-typewriter-top':    { side: 'top', art: 'obs-void-typewriter-top' },
    'obs-void-crt-top':           { side: 'top', art: 'obs-void-crt-top' },
    'obs-void-phone-top':         { side: 'top', art: 'obs-void-phone-top' },
    'obs-void-cassette-top':      { side: 'top', art: 'obs-void-cassette-top' },
    'obs-void-gramophone-top':    { side: 'top', art: 'obs-void-gramophone-top' },
    'obs-void-alarm-top':         { side: 'top', art: 'obs-void-alarm-top' },
    'obs-void-typewriter-bottom': { side: 'bottom', art: 'obs-void-typewriter-bottom' },
    'obs-void-crt-bottom':        { side: 'bottom', art: 'obs-void-crt-bottom' },
    'obs-void-phone-bottom':      { side: 'bottom', art: 'obs-void-phone-bottom' },
    'obs-void-cassette-bottom':   { side: 'bottom', art: 'obs-void-cassette-bottom' },
    'obs-void-gramophone-bottom': { side: 'bottom', art: 'obs-void-gramophone-bottom' },
    'obs-void-alarm-bottom':      { side: 'bottom', art: 'obs-void-alarm-bottom' },
  },
  objectAliases: { asteroid: 'moonrock', 'tree-branch': 'branch', 'crane-hook': 'cranehook', // [build] old ids (TUNING <= v1.7)
    // TUNING v2.0 placeholder ids -> Art §14 columns
    'void-top-a': 'obs-void-phone-top', 'void-top-b': 'obs-void-alarm-top', 'void-top-c': 'obs-void-cassette-top',
    'void-bot-a': 'obs-void-typewriter-bottom', 'void-bot-b': 'obs-void-crt-bottom', 'void-bot-c': 'obs-void-gramophone-bottom' },
  // v1.8 collision rule: each column's hitbox must be unbroken from the screen edge to its gap edge.
  // Checked per id at load; any vertical break -> console.warn + a full-width rect for that id.
  hitboxContinuity: { enabled: true },

  // [build] decorative per-stage effects: no collision, pooled, capped
  // v0.3.1 rendering budget (QA P1)
  render: {
    maxDpr: 2,             // backing store capped at 2x CSS px even on DPR-3 phones
    evictSweepFrames: 30,  // v0.6: also drop off-screen/unneeded tiles every N idle frames (the Void has no next stage, so no build would ever evict the space tiles)
    layerCacheMax: 10,     // hard cap; 3 tiles per layer (current/outgoing, next, transition) + the launch sky
    farLayerScale: 0.5,    // far layers (slow, soft sky + hills) cached at half resolution, upscaled on blit
    skyScale: 0.5,         // launch-sky backdrop likewise
  },
  // QA hooks (?god, ?stage, ?event, ?pickup, ?golden, ?effects, ghostGame._dbg/setStage/...)
  debug: {
    enabled: 'auto',       // 'auto' = on for localhost, ::1, file:, *.local and private IPv4 literals
                           // (127.x, 10.x, 192.168.x, 172.16-31.x); off everywhere else. ?debug=0 always forces off.
    allowUrlOverride: false, // BUILD FLAG (v0.4.1: false = release default). true lets ?debug=1 turn debug on for ANY host.
                             // Local QA is unaffected (auto). Tests flip it by serving a modified game.js.
  },
  ambient: {
    enabled: true,
    graveyard:   { fog: { enabled: true, count: 6, alpha: 0.16, drift: 12 } },
    church:      { birds: { enabled: true, count: 6, roofY: 430, scatterDist: 120, flyVx: -80, flyVy: -120 } },
    countryside: { fireflies: { enabled: true, count: 14 } },
    school:      { bikes: { enabled: true, spacing: 170, speedFactor: 1.05 } },
    city:        { rain: { enabled: true, count: 60, speed: 500, slant: 125, color: 'rgba(212, 230, 255, 0.5)', width: 1.2 } }, // one batched path, capped count; Art's (-125, +500) px/s
    space:       { stars: { enabled: true, count: 30 }, shootingStars: { enabled: true, intervalMin: 2, intervalMax: 4.5 } },
    void:        { mist: { enabled: true, count: 7, alpha: 0.22, drift: 10 }, sparkles: { enabled: true, count: 22 } }, // v0.6
  },

  // [build] placeholder looks per stage (parallax silhouettes until Art backgrounds exist)
  looks: {
    graveyard:   { name: 'The Graveyard', sky: ['#1e1433', '#4a3270'], celestial: 'moon', ground: '#3b2a55', groundTop: '#6b5394', layers: ['#3a2a5c', '#30224d', '#271b40'] },
    church:      { name: 'The Old Church', sky: ['#1d1838', '#51407a'], celestial: 'moon', ground: '#3d2f52', groundTop: '#7a6a9c', layers: ['#3b3163', '#322853', '#291f45'] },
    countryside: { name: 'Countryside', sky: ['#18213d', '#3f4d7a'], celestial: 'moon', ground: '#2f3d4a', groundTop: '#5f8a7a', layers: ['#2c3a5e', '#25314f', '#1e2842'] },
    school:      { name: 'School Town', sky: ['#22183a', '#5a3f72'], celestial: 'moon', ground: '#3c2f4f', groundTop: '#8a6f9c', layers: ['#3d2f5e', '#33264f', '#2a1f42'] },
    city:        { name: 'Big City', sky: ['#141428', '#3c2f5e'], celestial: 'moon', ground: '#2c2a3e', groundTop: '#5c5a7a', layers: ['#2a2848', '#22203d', '#1b1a33'] },
    space:       { name: 'Outer Space', sky: ['#05040f', '#1c1238'], celestial: 'planet', ground: '#4a4560', groundTop: '#7d7896', layers: ['#ffffff', '#c9b3f0', '#6c6488'] },
    // v0.6 Nebula Drift (Art concept A palette #2A2150 #7A64AE #F3EAFF #D9C6F5 #6B4E7A #FFB6CC #AEE3C6 #BFE6FF)
    void:        { name: 'The Void', sky: ['#2C2356', '#7A64AE'], celestial: 'none', ground: '#6B4E7A', groundTop: '#D9C6F5', layers: ['#D9C6F5', '#FFB6CC', '#BFE6FF'],
                   mist: ['#FFB6CC', '#D9C6F5', '#AEE3C6', '#BFE6FF'], nebula: 0.28, ribbon: '#FFB6CC', ribbonShade: '#E58FAE', cloud: '#F3EAFF', cloudShade: '#D9C6F5' },
  },

  // v0.5 'Share score' (game-over button). {name} {score} {stage} {best} are filled in; the URL is sent separately
  // where the target supports it (navigator.share url, X intent url=) and appended for plain-text targets.
  share: {
    enabled: true,
    url: 'https://dodadim.github.io/halloween-ghost-game/',
    title: 'Ghost Game',
    template: '{name} scored {score} in Ghost Game, reaching {stage}! Can you beat it?',
    fileName: 'ghost-game-score.png',
    card: { w: 600, h: 800, scale: 2 }, // generated at 2x (1200x1600) with Art's @2x frame
    // Art (ASSETS.md §12): frame per stage (stage id 'school' -> file 'schools'); no-stage file = generic night sky
    frameFile: 'assets/ui-scorecard-frame{stage}@2x.png', frameStageFile: { school: 'schools' },
    frameGeneric: [],       // v0.6.1: Art's ui-scorecard-frame-void(@2x) is in; list stages here to force the generic frame
    layout: 'assets/scorecard-layout.json',
    font: '"Baloo 2", "Arial Rounded MT Bold", "Nunito", "Trebuchet MS", system-ui, sans-serif', // no runtime font loading
    areas: { // fallback copy of scorecard-layout.json (600x800 coords)
      ghost: { rect: [200, 66, 200, 200] },
      stage: { rect: [110, 282, 380, 40], maxFont: 28, color: '#7A5A9E', weight: 'bold' },
      score: { rect: [80, 330, 440, 140], maxFont: 120, color: '#4A3358', weight: '900', stroke: '#FFFFFF', strokeW: 4 },
      best: { rect: [130, 480, 340, 40], maxFont: 28, color: '#C9798F', weight: 'bold' },
      player: { rect: [120, 546, 360, 56], maxFont: 34, color: '#4A3358', weight: 'bold' },
      url: { rect: [90, 742, 420, 36], maxFont: 22, color: '#4A3358', weight: 'bold' },
    },
    intents: {
      x: 'https://twitter.com/intent/tweet?text={text}&url={url}',
      facebook: 'https://www.facebook.com/sharer/sharer.php?u={url}',
      whatsapp: 'https://wa.me/?text={full}',
    },
    toastSeconds: 1.6,
  },

  ui: {
    tapCuePad: 6, tapCueOffsets: [-30, 52, -84, 100, -130, 150], // QA TR-CUE: candidate y offsets from the ghost, first clear of banner + badge wins
    tapCueSeconds: 1.0,    // v0.3.1: 'Tap!' cue when the ghost pops out after the rocket
    restartLockout: 0.4,
    font: '"Trebuchet MS", "Arial Rounded MT Bold", system-ui, sans-serif',
    starCount: 40,
    floatTextSeconds: 1.1,
    // v0.6.2 (QA v0.6.1 N1): long names never overflow. Widths are canvas px (world is 360 wide); button is CSS px.
    nameFit: {
      ellipsis: '\u2026',
      ready:    { maxWidth: 360, pad: 14, size: 20, minSize: 15, step: 1 },   // 'name · Best: N' bottom line
      hud:      { gap: 12, size: 14, minSize: 11, step: 1 },                 // in-play top-left name (left of 'Best N')
      gameOver: { pad: 16, size: 18, minSize: 14, step: 1 },                 // inside the game-over panel
      list:     { topStagePx: 12, topStageLines: 2 }, // v0.6.3 (QA N2): profiles list / top-10 names fit their cell; stage + date on max 2 lines
      button:   { maxWidth: 220, padX: 16, iconW: 26, gap: 6, border: 2, fontSize: 16 }, // player pill (matches .gg-btn)
    },
  },

  assets: { // [build] Art's sprites (assets/ASSETS.md). Sizes are 1x sprite px.
    enabled: true,
    pngDir: 'assets/png',
    hiDpiThreshold: 1.5,
    resolutions: { '1x': 1, '2x': 2 },
    hitboxes: 'assets/hitboxes.json',
    loadTimeout: 8,
    ghost: {
      strips: { normal: 'ghost-normal-strip.png', golden: 'ghost-golden-strip.png' },
      frameOrder: ['idle-0', 'idle-1', 'flap-0', 'flap-1', 'flap-2'],
      frameSize: 64,
      anchor: [32, 32],
      hitbox: { cx: 32, cy: 33, r: 18 },
      idleFrames: ['idle-0', 'idle-1'],
      idleFps: 2,
      flapFrames: ['flap-0', 'flap-1', 'flap-2', 'flap-1'],
      flapFps: 12,
      deadFrame: 'idle-1',
    },
    columns: {
      // file templates per object id (tombs: tomb-a-body.png, ...)
      files: { body: '{art}-body.png', capTop: '{art}-cap-top.png', capBottom: '{art}-cap-bottom.png' }, // {art} = objects[id].art || id
      alwaysLoad: ['tomb-a', 'tomb-b', 'tomb-c'], // others load only if hitboxes.json lists the cap their side needs
      spriteWidth: 80,
      bodyHeight: 64,
      capHeight: 80,
      drawScale: 1,
      hitboxX: 8,
      // fallback gap edges if hitboxes.json is missing (otherwise computed from it)
      floorEdge: { 'tomb-a': 10, 'tomb-b': 5, 'tomb-c': 31 },
      ceilEdge:  { 'tomb-a': 70, 'tomb-b': 75, 'tomb-c': 49 },
    },
    // Sprite sheets (horizontal strips). Loaded only when the hitboxes.json path in `json`
    // exists, so art that hasn't landed yet never 404s. frames = strip indices in play order.
    sheets: {
      bat:          { file: 'obs-common-bat-flap-strip.png', w: 48, h: 48, frames: [0, 1, 2, 1], fps: 12, json: ['hazards', 'bat'] },
      pumpkin:      { file: 'obs-common-pumpkin.png', w: 40, h: 40, frames: [0], fps: 0, json: ['hazards', 'pumpkin'] },
      skull:        { file: 'obs-common-skull-strip.png', w: 40, h: 40, frames: [0, 1], fps: 3, json: ['hazards', 'skull'] },
      miniAsteroid: { file: 'obs-space-miniasteroid.png', w: 40, h: 40, frames: [0], fps: 0, json: ['hazards', 'miniAsteroid'] },
      alien:        { file: 'obs-space-alien-strip.png', w: 40, h: 40, frames: [0, 1], fps: 3, json: ['hazards', 'alien'] },
      goldenPickup: { file: 'pickup-golden-ghost-strip.png', w: 56, h: 56, frames: [0, 1, 2, 1], fps: 6, json: ['pickups', 'golden-ghost'] },
      goldenPickupSpace: { file: 'pickup-golden-ghost-space-strip.png', w: 56, h: 56, frames: [0, 1, 2, 1], fps: 6, json: ['pickups', 'golden-ghost-space'] },
      hearse:       { file: 'event-graveyard-hearse-strip.png', w: 160, h: 64, frames: [0, 1], fps: 10, json: ['events', 'graveyard-hearse'] },
      meteor:       { file: 'event-space-meteor-strip.png', w: 72, h: 48, frames: [0, 1], fps: 10, json: ['events', 'space-meteor'] },
      launchpad:    { file: 'prop-city-launchpad.png', w: 200, h: 140, frames: [0], fps: 0, json: ['cutscene'] },
      rocketIdle:   { file: 'cut-rocket-idle-strip.png', w: 96, h: 148, frames: [0, 1], fps: 4, json: ['cutscene'] },
      rocketThrust: { file: 'cut-rocket-thrust-strip.png', w: 96, h: 148, frames: [0, 1], fps: 12, json: ['cutscene'] },
      flame:        { file: 'cut-rocket-flame-strip.png', w: 48, h: 80, frames: [0, 1, 2, 1], fps: 15, json: ['cutscene'] },
      smoke:        { file: 'cut-smoke-puff-strip.png', w: 64, h: 64, frames: [0, 1, 2], fps: 0, json: ['cutscene'] },
      cloudA:       { file: 'cut-cloud-a.png', w: 160, h: 64, frames: [0], fps: 0, json: ['cutscene'] },
      cloudB:       { file: 'cut-cloud-b.png', w: 160, h: 64, frames: [0], fps: 0, json: ['cutscene'] },
      cloudC:       { file: 'cut-cloud-c.png', w: 160, h: 64, frames: [0], fps: 0, json: ['cutscene'] },
      launchSky:    { file: 'bg-launch-sky.png', w: 360, h: 1920, frames: [0], fps: 0, json: ['cutscene'] },
      warning:      { file: 'ui-event-warning-strip.png', w: 40, h: 40, frames: [0, 1], fps: 4, json: ['events', 'warning'] },
      fogBack:      { file: 'amb-graveyard-fog-back.png', w: 360, h: 120, frames: [0], fps: 0, json: ['ambient'], parallax: 0.3 },
      fogFront:     { file: 'amb-graveyard-fog-front.png', w: 360, h: 80, frames: [0], fps: 0, json: ['ambient'], parallax: 0.6 },
      birdPerch:    { file: 'amb-church-bird-perch.png', w: 24, h: 24, frames: [0], fps: 0, json: ['ambient'] },
      birdFly:      { file: 'amb-church-bird-fly-strip.png', w: 24, h: 24, frames: [0, 1, 2, 1], fps: 12, json: ['ambient'] },
      bikeMint:     { file: 'amb-school-bike-mint.png', w: 72, h: 48, frames: [0], fps: 0, json: ['ambient'] },
      bikePink:     { file: 'amb-school-bike-pink.png', w: 72, h: 48, frames: [0], fps: 0, json: ['ambient'] },
      rain:         { file: 'amb-city-rain-0.png', w: 128, h: 128, frames: [0], fps: 0, json: ['ambient'] },
      star:         { file: 'amb-space-star-strip.png', w: 16, h: 16, frames: [0, 1, 2, 1], fps: 4, json: ['ambient'] },
      starfield:    { file: 'amb-space-starfield.png', w: 180, h: 180, frames: [0], fps: 0, json: ['ambient'], parallax: 0.1 },
      // v0.6 Void floaters / invaders: loaded only once hitboxes.json lists them (placeholders until then)
      // Art §15.1: 4-frame wobble strips, hit circle fixed at (20,20)
      'void-float-a': { file: 'obs-void-float-cassette-strip.png', w: 40, h: 40, frames: [0, 1, 2, 3], fps: 6, json: ['hazards', 'void-float-a'] },
      'void-float-b': { file: 'obs-void-float-clock-strip.png',    w: 40, h: 40, frames: [0, 1, 2, 3], fps: 6, json: ['hazards', 'void-float-b'] },
      'void-float-c': { file: 'obs-void-float-phone-strip.png',    w: 40, h: 40, frames: [0, 1, 2, 3], fps: 6, json: ['hazards', 'void-float-c'] },
      'void-float-d': { file: 'obs-void-float-floppy-strip.png',   w: 40, h: 40, frames: [0, 1, 2, 3], fps: 6, json: ['hazards', 'void-float-d'] },
      // Art §15.2: invader types a (mint), b (pink), c (lilac) share size + hitbox; pop + Void warning icon are decorative
      invader:      { file: 'event-void-invader-strip.png',   w: 40, h: 40, frames: [0, 1], fps: 4, json: ['events', 'void-invader'] },
      invaderB:     { file: 'event-void-invader-b-strip.png', w: 40, h: 40, frames: [0, 1], fps: 4, json: ['events', 'void-invader'] },
      invaderC:     { file: 'event-void-invader-c-strip.png', w: 40, h: 40, frames: [0, 1], fps: 4, json: ['events', 'void-invader'] },
      invaderPop:   { file: 'event-void-invader-pop-strip.png', w: 64, h: 64, frames: [0, 1, 2, 3, 4, 5], fps: 12, json: ['events', 'void-invader-pop'] },
      warningVoid:  { file: 'ui-event-warning-void-strip.png', w: 40, h: 40, frames: [0, 1], fps: 4, json: ['events', 'warning-void'] },
    },
    // v0.6: Void-only v0.5-style art (banner, burst, badge 7, score-card frame) is requested only once Art's
    // Void set exists (a hitboxes.json key starting with detectPrefix, or 'void' in backgrounds.stages): no 404s.
    voidArt: { stage: 'void', detectPrefix: 'obs-void-', transitions: ['space-void'] }, // + bg-void-* / bg-trans-space-void-* (hitboxes.json backgrounds doesn't list them yet)
    backgrounds: {
      load: true,            // only stages listed in hitboxes.json backgrounds.stages are fetched (no 404s)
      file: 'bg-{stage}-{layer}.png', // Art: 720x640 world px tiles in png/{1x,2x}/, scroll horizontally
      tileWidth: 720,
      layers: ['far', 'mid', 'near'],
      parallax: { far: 0.1, mid: 0.3, near: 0.6 },              // Art's scroll factors
      parallaxByStage: { space: { far: 0.05, mid: 0.15, near: 0.5 }, void: { far: 0.05, mid: 0.15, near: 0.5 } }, // Art §14.2
      transFile: 'bg-trans-{from}-{to}-{layer}.png', // used at each layer's next tile edge (ASSETS.md §7a)
      transMaxSeconds: 3,    // mid/far: use the transition tile only if the next edge is this close...
      fadeSeconds: 1.5,      // ...otherwise crossfade outgoing -> incoming tiles over this long
      alwaysTransLayers: ['near'],
      // v0.6.1: optional per-layer geometry for trimmed art, { stage: { layer: { yOffset, height, stretch, fill } } } in world px.
      // yOffset: top of the file's band; height: band height (file scaled to it); stretch: true -> band runs to the bottom (H);
      // only yOffset -> native aspect. fill: 'gradient' on far paints the stage sky (looks[stage].sky) under the layers.
      // hitboxes.json backgrounds.layerMeta (same shape, Art's stage ids) is read too; CONFIG wins. Empty = full-height files.
      layerMeta: { void: {} },
      // v0.6.1: Art §14.2 memory-lite Void, drawn from hitboxes.json backgrounds.void (stacks of parts per 720 slot,
      // no layer cache, the old full bg-void-{layer} tiles are not loaded). lite1xOnHiDpi: these parts load from png/1x on
      // 2x screens (soft art; 2x decoded set 8.5 -> ~3.7 MiB). The warp mist strip is already 1x (warp.mist.folder).
      voidParts: { enabled: true, stage: 'void', glints: true, smoothing: true,
        lite1xOnHiDpi: ['bg-void-mid-upper.png', 'bg-void-mid-lower.png', 'bg-void-far-stars.png'] },
      artStageIds: { school: 'schools' }, // Art's bg files and hitboxes.json backgrounds still say 'schools'
    },
  },

  colors: {
    placeholder: '#b9b3c9',    // v0.4.1 neutral placeholder for missing non-graveyard column art
    bannerBg: 'rgba(24, 16, 42, 0.88)',   // v0.3.2 stage banner backing pill
    bannerEdge: 'rgba(255, 201, 218, 0.85)',
    moon: '#fff4d6', moonGlow: 'rgba(255, 244, 214, 0.18)', star: '#fdf6ff',
    ghostBody: '#fbf7ff', ghostShade: '#d9c9f5', ghostGolden: '#ffe08a', ghostGoldenShade: '#f5b942',
    eye: '#2b1d3d', blush: '#ffb3c9',
    tomb: '#b9b3c7', tombShade: '#9a93ab', tombOutline: '#7d7690',
    coffin: '#c9a99a', coffinOutline: '#7a5a5a', cross: '#cdc6dd',
    satellite: '#c9d2e6', panel: '#7fa6d6', ufo: '#b8f0d2', ufoDome: '#e6f7ff', asteroid: '#9a8fb0', asteroidShade: '#7b7092',
    hearse: '#3a2f4f', hearseTrim: '#c9b3f0', rocket: '#fdf6ff', rocketTrim: '#ffb3c9', flame: '#ffcf8a',
    text: '#ffffff', textShadow: 'rgba(30, 20, 51, 0.6)', panelBg: 'rgba(30, 20, 51, 0.72)',
    accent: '#ffb3c9', sparkle: '#fff3b0', warning: '#ffcf5a',
    bat: '#5a4a78', pumpkin: '#ffb37a', pumpkinStem: '#7fbf8a', skull: '#f3eefc', alien: '#a8e6a1',
    // v0.6 Void placeholders (concept A palette)
    vCream: '#F3EAFF', vLilac: '#D9C6F5', vPink: '#FFB6CC', vMint: '#AEE3C6', vBlue: '#BFE6FF', vInk: '#6B4E7A', vDeep: '#4A3358',
    invader: '#AEE3C6', invaderEye: '#2A2150',
  },
};

// ---- Derived difficulty helpers (TUNING.md) -----------------------------------
const gapFor = s => Math.max(CONFIG.tombstones.gapMin, CONFIG.tombstones.gapStart - Math.floor(s / 10) * CONFIG.tombstones.gapShrinkPer10);
const spacingFor = s => Math.max(CONFIG.tombstones.spacingMin, CONFIG.tombstones.spacingStart - Math.floor(s / 10) * CONFIG.tombstones.spacingShrinkPer10);
const speedFor = s => Math.min(CONFIG.speed.max, CONFIG.speed.start + Math.floor(s / CONFIG.speed.stepEvery) * CONFIG.speed.stepAmount);

// =============================================================================
// ScoreService — profiles, per-player bests, local top-10 and the game-over hook,
// kept apart from game logic.
// Public API (window.ScoreService):
//   getProfiles() -> [{ id, name, best }]       getCurrentProfile() -> { id, name }
//   addProfile(name) -> { ok, profile | reason } (trimmed, 1..maxNameLength chars, unique case-insensitively; selects it)
//   selectProfile(idOrName) -> bool              getBest(profile?) (default: current player)
//   getTopScores() -> [{ name, score, date, stage }] (best first, max topScoresMax)
//   submitScore(name, score, meta) -> Promise (STUB for a future online leaderboard; resolves not-implemented)
//   addGameOverListener(fn)
// Saving a score is INTERNAL: the game claims onGameOver/saveBest once at startup
// (claimInternal), so console code can't post arbitrary scores when debug is off.
// v0.5 storage: profiles in `${bestKey}.profiles`, top-10 in `${bestKey}.top`.
// Player 1 keeps the legacy `${bestKey}` slot, so the pre-v0.5 best migrates into it
// untouched; other players use `${bestKey}.<id>`. If localStorage throws, everything
// lives in memory for the session (QA B6).
// NOTE: localStorage itself can still be edited by a player; real protection for a
// leaderboard needs server-side validation (not attempted here).
// =============================================================================
const ScoreService = (() => {
  const S = () => CONFIG.scoring;
  const key = () => S().bestKey;
  const listeners = [];
  const mem = { best: {}, profiles: null, top: null }; // in-memory mirror (survives blocked storage)
  const read = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const write = (k, v) => { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } };
  const parse = (s, d) => { try { const v = JSON.parse(s); return v == null ? d : v; } catch (e) { return d; } };
  const cleanName = n => String(n == null ? '' : n).replace(/\s+/g, ' ').trim();
  // QA: name length counts graphemes (Intl.Segmenter), falling back to code points
  const seg = (typeof Intl !== 'undefined' && Intl.Segmenter) ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;
  const graphemes = s => seg ? Array.from(seg.segment(s), x => x.segment) : Array.from(s);
  const nameLen = s => graphemes(s).length;
  const clipName = s => graphemes(s).slice(0, S().maxNameLength).join('');
  const bestKeyFor = id => (id === 'p1' ? key() : `${key()}.${id}`);

  function loadProfiles() {
    let p = parse(read(`${key()}.profiles`), null);
    if (!p || !Array.isArray(p.list) || !p.list.length) p = mem.profiles;
    if (!p || !Array.isArray(p.list) || !p.list.length) { // first run / migration: legacy best -> Player 1
      p = { list: [{ id: 'p1', name: S().defaultPlayer }], current: 'p1' };
      write(`${key()}.profiles`, JSON.stringify(p));
    }
    p.list = p.list.filter(x => x && typeof x.id === 'string' && cleanName(x.name)).map(x => ({ id: x.id, name: clipName(cleanName(x.name)) }));
    if (!p.list.length) p.list = [{ id: 'p1', name: S().defaultPlayer }];
    if (!p.list.some(x => x.id === p.current)) p.current = p.list[0].id;
    mem.profiles = p;
    return p;
  }
  function saveProfiles(p) { mem.profiles = p; write(`${key()}.profiles`, JSON.stringify(p)); }
  function findProfile(ref) {
    const p = loadProfiles();
    if (ref == null) return p.list.find(x => x.id === p.current);
    if (typeof ref === 'object') ref = ref.id;
    const s = String(ref);
    return p.list.find(x => x.id === s) || p.list.find(x => x.name.toLowerCase() === cleanName(s).toLowerCase()) || null;
  }
  function getBest(profile) {
    const pr = findProfile(profile);
    if (!pr) return 0;
    const stored = parseInt(read(bestKeyFor(pr.id)), 10) || 0;
    return Math.max(mem.best[pr.id] || 0, stored);
  }
  function getProfiles() { return loadProfiles().list.map(x => Object.freeze({ id: x.id, name: x.name, best: getBest(x.id) })); }
  function getCurrentProfile() { const x = findProfile(); return Object.freeze({ id: x.id, name: x.name }); }
  function addProfile(name) {
    const n = cleanName(name);
    if (!n) return { ok: false, reason: 'empty' };
    if (nameLen(n) > S().maxNameLength) return { ok: false, reason: 'too-long' };
    const p = loadProfiles();
    if (p.list.some(x => x.name.toLowerCase() === n.toLowerCase())) return { ok: false, reason: 'duplicate' };
    if (p.list.length >= S().maxProfiles) return { ok: false, reason: 'full' };
    const id = 'p' + (Math.max(0, ...p.list.map(x => parseInt(x.id.slice(1), 10) || 0)) + 1);
    p.list.push({ id, name: n }); p.current = id; saveProfiles(p); profileChanged();
    return { ok: true, profile: Object.freeze({ id, name: n }) };
  }
  function selectProfile(ref) {
    const pr = findProfile(ref == null ? '' : ref);
    if (!pr) return false;
    const p = loadProfiles(); p.current = pr.id; saveProfiles(p); profileChanged();
    return true;
  }
  function getTopScores() {
    let t = parse(read(`${key()}.top`), null);
    if (!Array.isArray(t)) t = mem.top || [];
    // QA PR-TOP-LOAD: drop non-finite / negative scores and unknown stages, then re-sort (stable: earlier date first)
    const stages = new Set(CONFIG.stages.list.map(s => s.id));
    t = t.filter(e => e && typeof e.score === 'number' && Number.isFinite(e.score) && e.score >= 0 && (!e.stage || stages.has(String(e.stage))))
      .map((e, i) => ({ e, i })).sort((a, b) => b.e.score - a.e.score || (String(a.e.date || '') < String(b.e.date || '') ? -1 : String(a.e.date || '') > String(b.e.date || '') ? 1 : a.i - b.i))
      .map(x => x.e).slice(0, S().topScoresMax);
    mem.top = t;
    return t.map(e => Object.freeze({ name: clipName(cleanName(e.name)), score: e.score, date: String(e.date || ''), stage: String(e.stage || '') }));
  }
  /** INTERNAL. Saves score if it beats the current player's best. Returns true on a new best. */
  function saveBest(score) {
    if (!(score > getBest())) return false;
    const id = findProfile().id;
    mem.best[id] = score;
    write(bestKeyFor(id), String(score));
    return true;
  }
  function recordTop(entry) { // returns 1-based rank, or 0 if it didn't make the list
    if (!(entry.score > 0)) return 0;
    const t = getTopScores().map(e => ({ ...e }));
    t.push(entry);
    t.sort((a, b) => b.score - a.score || (a.date < b.date ? -1 : 1)); // ties: the earlier run keeps its place
    const kept = t.slice(0, S().topScoresMax), rank = kept.indexOf(entry) + 1;
    mem.top = kept; write(`${key()}.top`, JSON.stringify(kept));
    return rank;
  }
  /** INTERNAL. Called once by the game when a run ends. Returns { best, newBest, rank, player }. */
  const localDate = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; // QA PR-DATE
  function onGameOver(score, meta = {}) {
    const player = findProfile().name;
    const newBest = saveBest(score);
    const best = Math.max(score, getBest());
    const rank = recordTop({ name: player, score, date: localDate(), stage: String(meta.stage || '') });
    // QA DG9: listeners get a frozen COPY; the game's values below never come from it
    const shared = Object.freeze({ score, best, newBest, rank, player, ...meta });
    for (const fn of listeners) {
      try { fn(shared); } catch (e) { console.warn('onGameOver listener failed', e); }
    }
    return { best, newBest, rank, player };
  }
  let claimed = false;
  let profileHook = null; // QA PR-SYNC: the game's HUD/player refresh, set via claimInternal
  const profileChanged = () => { if (profileHook) try { profileHook(getCurrentProfile()); } catch (e) { console.warn('profile hook failed', e); } };
  const svc = {
    getBest, getProfiles, getCurrentProfile, addProfile, selectProfile, getTopScores,
    /** Stub for a future online leaderboard. Resolves without sending anything. */
    submitScore(name, score, meta = {}) {
      return Promise.resolve({ ok: false, submitted: false, reason: 'not-implemented', name, score, meta });
    },
    /** Extra game-over callbacks: fn({ score, best, newBest, rank, player, golden, stage }). */
    addGameOverListener(fn) { if (typeof fn === 'function') listeners.push(fn); },
    /** One-shot: the game takes the internal functions at startup; later calls get null. */
    claimInternal() {
      if (claimed) return null;
      claimed = true;
      return { saveBest, onGameOver, listeners, onProfileChange: fn => { profileHook = fn; } };
    },
  };
  return svc;
})();
window.ScoreService = ScoreService;

(() => {
  'use strict';

  const W = CONFIG.world.width;
  const H = CONFIG.world.height;
  const GROUND_Y = H - CONFIG.world.groundHeight;
  const TAU = Math.PI * 2;
  const canvas = document.getElementById('game');
  let ctx = canvas.getContext('2d');
  const mainCtx = ctx;
  const bgCanvas = document.createElement('canvas'); // offscreen buffer for stage crossfades
  const bgCtx = bgCanvas.getContext('2d');

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeInOut = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const easeIn = t => t * t;
  const easeOut = t => 1 - (1 - t) * (1 - t);
  const uiSeg = (typeof Intl !== 'undefined' && Intl.Segmenter) ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;
  const graphemes = str => (uiSeg ? Array.from(uiSeg.segment(String(str)), x => x.segment) : Array.from(String(str))); // v0.6.2
  // v0.6.2: shrink font (size->minSize) then trim whole graphemes + '…' until measure(name)+fixedW <= maxW.
  function fitName(mctx, name, fixedW, maxW, size, minSize, step, fontFor) {
    const NF = CONFIG.ui.nameFit, g = graphemes(name);
    let px = size; mctx.font = fontFor(px);
    const w = t => mctx.measureText(t).width;
    while (px - step >= minSize && w(name) + fixedW(px) > maxW) { px -= step; mctx.font = fontFor(px); }
    if (w(name) + fixedW(px) <= maxW) return { text: name, size: px, truncated: false, kept: g.length };
    let n = g.length - 1;
    while (n > 0 && w(g.slice(0, n).join('') + NF.ellipsis) + fixedW(px) > maxW) n--;
    return { text: g.slice(0, n).join('') + NF.ellipsis, size: px, truncated: true, kept: n };
  }
  const clipGraphemes = (str, n) => (uiSeg ? Array.from(uiSeg.segment(str), x => x.segment) : Array.from(str)).slice(0, n).join(''); // v0.6.1
  function weightedPick(map) {
    const entries = Object.entries(map || {}).filter(([, w]) => w > 0);
    if (!entries.length) return null;
    let total = 0;
    for (const [, w] of entries) total += w;
    let r = Math.random() * total;
    for (const [k, w] of entries) { r -= w; if (r < 0) return k; }
    return entries[entries.length - 1][0];
  }
  function seeded(seed) { // small deterministic RNG for background silhouettes
    let s = seed >>> 0;
    return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  }

  // ---- QA hooks via query string ------------------------------------------------
  const params = new URLSearchParams(location.search);
  function isLocalHost(h) {
    if (location.protocol === 'file:' || h === 'localhost' || h === '' || h === '::1' || h === '[::1]' || /\.local$/i.test(h)) return true;
    // private-IP rules apply ONLY to strict dotted-quad IPv4 literals (QA DG5: not to names like 10.cdn-example.com)
    const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(h);
    if (!m) return false;
    const o = m.slice(1).map(Number);
    if (o.some(x => x > 255)) return false;
    return o[0] === 127 || o[0] === 10 || (o[0] === 192 && o[1] === 168) || (o[0] === 172 && o[1] >= 16 && o[1] <= 31);
  }
  const DEBUG = (() => {
    const e = CONFIG.debug.enabled;
    if (params.get('debug') === '0') return false;
    if (params.get('debug') === '1' && CONFIG.debug.allowUrlOverride) return true;
    if (e !== 'auto') return !!e;
    return isLocalHost(location.hostname);
  })();
  // Score internals are claimed once; the public ScoreService can't save arbitrary scores.
  const SS = ScoreService.claimInternal();
  if (DEBUG) {
    window.CONFIG = CONFIG; // (also reachable as a global const)
    Object.assign(ScoreService, { saveBest: SS.saveBest, onGameOver: SS.onGameOver, onGameOverListeners: SS.listeners });
  } else {
    // casual-cheat hardening (debug off): nothing tweakable from the console
    const deepFreeze = o => { if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); Object.values(o).forEach(deepFreeze); } return o; };
    deepFreeze(CONFIG);
    Object.values(ScoreService).forEach(f => Object.freeze(f));
    Object.freeze(ScoreService);
  }
  const qp = k => (DEBUG ? params.get(k) : null); // QA params are ignored unless debug is on
  const forceGolden = qp('golden') != null ? qp('golden') !== '0' : null;
  const qaStage = qp('stage');
  const qaEvent = qp('event');
  const qaPickup = qp('pickup'); // '1' = next pair, 'all' = every eligible pair (v1.9: a Rush special)
  const qaPower = (qp('power') || '').split(',').map(k => ({ rush: 'rush', life: 'extraLife', extralife: 'extraLife', chill: 'slowMo', slowmo: 'slowMo' })[k.trim().toLowerCase()]).filter(Boolean);
  const qaGod = qp('god') === '1';
  const qaDeath = qp('death'); // v0.5: force a death anim (bat, pumpkin, meteor, stone|stars, skull, floor, poof|generic)
  const effectsOn = CONFIG.ambient.enabled && qp('effects') !== '0';

  const STAGES = CONFIG.stages.list;
  const stageIndexById = id => STAGES.findIndex(s => s.id === id);
  for (const st of STAGES) for (const side of ['top', 'bottom']) for (const id of Object.keys(st[side] || {})) { // v0.4: side-specific sets
    const o = CONFIG.objects[CONFIG.objectAliases[id] || id];
    if (!o || o.side !== side) console.warn(`[stages] ${st.id}.${side}: '${id}' is ${o ? 'a ' + o.side + ' object' : 'not in CONFIG.objects'}`);
  }
  function stageIndexForPairs(pairs) { // v0.6: score-only stages (no startAt, e.g. the Void) are never reached by pairs
    let idx = 0;
    STAGES.forEach((s, i) => { if (s.startAt != null && pairs >= s.startAt) idx = i; });
    return idx;
  }
  const LAUNCH_ID = CONFIG.launch.target || 'space', WARP = CONFIG.warp;
  const stageStartPairs = i => (STAGES[i].startAt != null ? STAGES[i].startAt : STAGES[i].id === WARP.target ? WARP.qaStartPairs : 0); // QA hooks
  function parseStage(v) {
    if (v == null) return null;
    const n = Number(v);
    if (Number.isInteger(n) && n >= 0 && n < STAGES.length) return n;
    const i = stageIndexById((CONFIG.stages.aliases || {})[v] || v);
    return i >= 0 ? i : null;
  }

  // ---- Asset preload --------------------------------------------------------------
  const A = CONFIG.assets;
  const sprites = {
    bgMeta: {}, bgUnloaded: {}, voidParts: null, // v0.6.1
    specials: {},      // v1.9 specials art (pickups, rush ghost, heart, frost, HUD)
    res: 1,
    ghost: { normal: null, golden: null },
    sets: {},          // column sets by object id: { body, capTop, capBottom, bodyPattern, hb, floorEdge, ceilEdge }
    tombVariants: [],  // tomb object ids that loaded completely
    sheets: {},        // name -> { img, def, json }
    bg: {},            // `${stage}-${layer}` -> image
    death: {},         // v0.5 death strips: '<type>' and '<type>:golden'
    fx: {},            // v0.5 fx strips (starsRing, smokePuff, sparklePoof, bonk)
    ui: {},            // v0.5 transition art: banner-<stage>, bannerBlank(-<stage>), burst-<stage>, swoosh, badge-<n>, badgeBlank
    hitboxes: null,
    status: 'pending',
    loaded: [], missing: [],
  };
  let hitboxRadius = CONFIG.ghost.hitboxRadius;
  let hitboxOffsetY = 0;
  let hitboxSource = 'config';

  function loadImage(src) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => { sprites.loaded.push(src); resolve(img); };
      img.onerror = () => { sprites.missing.push(src); resolve(null); };
      img.src = src;
    });
  }

  function applyGhostHitbox(hb, source) {
    const k = CONFIG.ghost.size / A.ghost.frameSize;
    if (!(hb && hb.r > 0)) return;
    hitboxRadius = hb.r * k;
    hitboxOffsetY = ((hb.cy != null ? hb.cy : A.ghost.anchor[1]) - A.ghost.anchor[1]) * k;
    hitboxSource = source;
  }

  // nearest-to-gap hitbox edge of a cap, from its hitbox shapes (sprite px)
  function capEdge(hb, side) {
    if (!hb) return null;
    let v = side === 'floor' ? Infinity : -Infinity;
    for (const [, y, , h] of hb.rects || []) v = side === 'floor' ? Math.min(v, y) : Math.max(v, y + h);
    for (const [, cy, r] of hb.circles || []) v = side === 'floor' ? Math.min(v, cy - r) : Math.max(v, cy + r);
    return isFinite(v) ? v : null;
  }

  function preload() {
    if (!A.enabled) { sprites.status = 'disabled'; return Promise.resolve(); }
    const dpr = window.devicePixelRatio || 1;
    const folder = dpr >= A.hiDpiThreshold ? '2x' : '1x';
    sprites.res = A.resolutions[folder];
    const dir = `${A.pngDir}/${folder}/`;
    const hbJob = (A.hitboxes && window.fetch)
      ? fetch(A.hitboxes).then(r => (r.ok ? r.json() : null)).catch(() => null)
      : Promise.resolve(null);

    const all = hbJob.then(hb => {
      sprites.hitboxes = hb;
      const has = k => !!(hb && hb[k]);
      const VA = A.voidArt; // v0.6: has Art's Void set landed? (gates the Void banner / burst / badge / card frame)
      sprites.voidArt = !!(hb && (Object.keys(hb).some(k => k.startsWith(VA.detectPrefix)) || (hb.void && typeof hb.void === 'object') ||
        ((hb.backgrounds && hb.backgrounds.stages) || []).includes(VA.stage)));
      const jobs = [];
      for (const kind of ['normal', 'golden']) {
        jobs.push(loadImage(dir + A.ghost.strips[kind]).then(img => { sprites.ghost[kind] = img; }));
      }
      // column objects: tombs always; others only when Art lists them in hitboxes.json
      const C = A.columns;
      for (const id of Object.keys(CONFIG.objects)) {
        const o = CONFIG.objects[id];
        if (o.tomb === 'random') continue;
        const art = o.art || id;
        // v0.4: load only the cap this object's side uses, and only if hitboxes.json lists it
        const need = o.side === 'top' ? 'capBottom' : 'capTop', file = need === 'capTop' ? 'cap-top' : 'cap-bottom';
        if (!(C.alwaysLoad.includes(id) || has(`${art}-${file}`))) continue;
        const set = (sprites.sets[id] = { id, art, side: o.side });
        const parts = ['body', need];
        for (const part of parts) {
          jobs.push(loadImage(dir + C.files[part].replace('{art}', art)).then(img => { set[part] = img; }));
        }
      }
      // sprite sheets: only when their hitboxes.json section exists
      for (const [name, sh] of Object.entries(A.sheets)) {
        let node = hb;
        for (const k of sh.json) node = node && node[k];
        if (!node) continue;
        jobs.push(loadImage(dir + sh.file).then(img => { if (img) sprites.sheets[name] = { img, def: sh, json: node }; }));
      }
      const bgList = (hb && hb.backgrounds && hb.backgrounds.stages) || [];
      sprites.bgMeta = (hb && hb.backgrounds && hb.backgrounds.layerMeta) || {};
      const artId = id => (A.backgrounds.artStageIds || {})[id] || id;
      if (A.backgrounds.load) {
        const voidBg = id => id === A.voidArt.stage && sprites.voidArt; // v0.6: Art §14 bg set (not yet in hitboxes.json backgrounds)
        const VP = A.backgrounds.voidParts, vSpec = VP && VP.enabled && hb && hb.backgrounds && hb.backgrounds.void;
        if (vSpec) { // v0.6.1: Art §14.2 parts (data-driven)
          const vp = sprites.voidParts = { spec: vSpec, img: {}, need: [], mb: 0 };
          const want = (f, need) => {
            if (vp.img[f] !== undefined) return; vp.img[f] = null; if (need) vp.need.push(f);
            const d = folder === '2x' && VP.lite1xOnHiDpi.includes(f) ? `${A.pngDir}/1x/` : dir;
            jobs.push(loadImage(d + f).then(img => { if (!img) return; vp.img[f] = img; vp.mb += img.naturalWidth * img.naturalHeight * 4 / 1048576; }));
          };
          for (const layer of A.backgrounds.layers) for (const p of vSpec[layer] || []) {
            if (p.file) want(p.file, true);
            if (p.kind === 'sprites' && VP.glints) for (const sp of Object.values(p.sprites || {})) want(sp.file, false);
          }
        }
        for (const st of STAGES) for (const layer of A.backgrounds.layers) {
          if (vSpec && st.id === VP.stage) continue; // v0.6.1: parts instead of the full tiles
          if (!bgList.includes(artId(st.id)) && !voidBg(st.id)) continue;
          const f = A.backgrounds.file.replace('{stage}', artId(st.id)).replace('{layer}', layer);
          jobs.push(loadImage(dir + f).then(img => { if (img) sprites.bg[`${st.id}-${layer}`] = img; }));
        }
        const transList = (hb && hb.backgrounds && hb.backgrounds.transitions) || [];
        for (let i = 0; i + 1 < STAGES.length; i++) for (const layer of A.backgrounds.layers) {
          const a = STAGES[i].id, b = STAGES[i + 1].id;
          if (a === WARP.from && b === WARP.target && !WARP.useTransitionTiles) continue; // v0.6.1: warp cuts under the mist
          if (!transList.includes(`bg-trans-${artId(a)}-${artId(b)}-*`) && !(sprites.voidArt && A.voidArt.transitions.includes(`${a}-${b}`))) continue; // city -> space: the rocket cutscene is the transition
          const f = A.backgrounds.transFile.replace('{from}', artId(a)).replace('{to}', artId(b)).replace('{layer}', layer);
          jobs.push(loadImage(dir + f).then(img => { if (img) sprites.bg[`trans-${a}-${b}-${layer}`] = img; }));
        }
      }
      return Promise.all(jobs);
    });
    const timeout = new Promise(resolve => setTimeout(resolve, A.loadTimeout * 1000));
    return Promise.race([all, timeout]).then(() => {
      const hb = sprites.hitboxes;
      const C = A.columns;
      for (const id of Object.keys(sprites.sets)) {
        const s = sprites.sets[id];
        if (!s.body) { delete sprites.sets[id]; continue; }
        s.bodyPattern = ctx.createPattern(s.body, 'repeat-y');
        s.hb = {
          capTop: hb && hb[`${s.art}-cap-top`],
          capBottom: hb && hb[`${s.art}-cap-bottom`],
          body: hb && hb[`${s.art}-body`],
        };
        s.floorEdge = capEdge(s.hb.capTop, 'floor');
        if (s.floorEdge == null) s.floorEdge = C.floorEdge[id] != null ? C.floorEdge[id] : 0;
        s.ceilEdge = capEdge(s.hb.capBottom, 'ceil');
        if (s.ceilEdge == null) s.ceilEdge = C.ceilEdge[id] != null ? C.ceilEdge[id] : C.capHeight;
        checkContinuity(s);
      }
      sprites.tombVariants = Object.keys(sprites.sets).filter(id => CONFIG.objects[id] && CONFIG.objects[id].tomb && CONFIG.objects[id].tomb !== 'random' && sprites.sets[id].capTop);
      applyGhostHitbox(A.ghost.hitbox, 'config.assets');
      if (hb && hb.ghost) applyGhostHitbox(hb.ghost, 'hitboxes.json');
      if (!sprites.ghost.normal) { hitboxRadius = CONFIG.ghost.hitboxRadius; hitboxOffsetY = 0; hitboxSource = 'config'; }
      sprites.status = 'done';
      loadV05Art(dir); // v0.5 deaths / fx / transition art: after the game is playable, never blocks the start
    });
  }
  function loadV05Art(dir) {
    const DA = CONFIG.deathAnims, TA = CONFIG.transitions.art, sid = id => (A.backgrounds.artStageIds || {})[id] || id;
    const jobs = [], put = (obj, k, f) => jobs.push(loadImage(dir + f)
      .then(img => (img && img.decode ? img.decode().then(() => img, () => img) : img)) // decode off the frame: no hitch at the first banner/death
      .then(img => { if (img) obj[k] = img; }));
    for (const type of Object.keys(DA.types)) {
      put(sprites.death, type, DA.file.replace('{type}', type));
      put(sprites.death, type + ':golden', DA.goldenFile.replace('{type}', type));
    }
    for (const [k, f] of Object.entries(DA.fx)) put(sprites.fx, k, f.file);
    put(sprites.ui, 'bannerBlank', TA.bannerBlank); put(sprites.ui, 'badgeBlank', TA.badgeBlank); put(sprites.ui, 'swoosh', TA.swoosh.file);
    STAGES.forEach((st, i) => {
      if (st.id === A.voidArt.stage && !sprites.voidArt) return; // v0.6: placeholders (blank banner + drawn badge) until Art's Void set exists
      put(sprites.ui, `banner-${st.id}`, TA.banner.replace('{stage}', sid(st.id)));
      put(sprites.ui, `bannerBlank-${st.id}`, TA.bannerStageBlank.replace('{stage}', sid(st.id)));
      put(sprites.ui, `burst-${st.id}`, TA.burst.file.replace('{stage}', sid(st.id)));
      put(sprites.ui, `badge-${i + 1}`, TA.badge.replace('{n}', i + 1));
    });
    if (sprites.voidArt) { const M = CONFIG.warp.mist; put(sprites.ui, 'warpMist', `../${M.folder}/${M.file}`); } // v0.6 Art §14.3 overlay (1x)
    const SA = CONFIG.specials.art; // v1.9 specials (Art §13); missing -> placeholder drawing
    for (const k of ['rush', 'extraLife', 'slowMo']) { put(sprites.specials, 'pickup-' + k, SA.pickup[k]); put(sprites.specials, 'hud-' + k, SA.hud[k]); }
    for (const k of ['ghostRush', 'rushAura', 'candyBurst', 'heart', 'heartPop', 'heartBreak', 'frostBurst', 'frostVignette']) put(sprites.specials, k, SA[k].file);
    SA.flakes.forEach((f, i) => put(sprites.specials, 'flake-' + i, f));
    return (sprites.v05 = Promise.all(jobs).then(() => { sprites.v05Status = 'done'; }));
  }

  // v1.8 collision rule: the hitbox must be unbroken (no y without a shape) from the screen edge
  // to the gap edge. The body tiles every 64 px, so its rects[0] must span y 0..64; the cap's shapes
  // must cover 0..ceilEdge (tops) or floorEdge..80 (bottoms). Otherwise warn + full-width rect.
  const hbFallbacks = {};
  function coverageBreaks(shapes, a, b) {
    const iv = [...(shapes.rects || []).map(([, y, , h]) => [y, y + h]), ...(shapes.circles || []).map(([, cy, r]) => [cy - r, cy + r])].sort((p, q) => p[0] - q[0]);
    const out = []; let cur = a;
    for (const [y0, y1] of iv) { if (y1 <= cur) continue; if (y0 > cur && cur < b) out.push([cur, Math.min(y0, b)]); cur = Math.max(cur, y1); if (cur >= b) break; }
    if (cur < b) out.push([cur, b]);
    return out;
  }
  function checkContinuity(s) {
    if (!CONFIG.hitboxContinuity.enabled) return;
    const C = A.columns, top = s.side === 'top', capKey = top ? 'capBottom' : 'capTop';
    const cap = s.hb[capKey], body = s.hb.body && s.hb.body.rects && s.hb.body.rects[0];
    if (!cap && !body) return; // no hitbox data at all: the default full-width rects are used anyway
    const breaks = [];
    if (!body) breaks.push({ part: 'body', at: [0, C.bodyHeight] });
    else { // report the MISSING rows of the 64 px tile, not the rect's extent (QA cosmetic)
      if (body[1] > 0) breaks.push({ part: 'body', at: [0, Math.min(body[1], C.bodyHeight)] });
      if (body[1] + body[3] < C.bodyHeight) breaks.push({ part: 'body', at: [Math.max(0, body[1] + body[3]), C.bodyHeight] });
    }
    if (cap) for (const br of (top ? coverageBreaks(cap, 0, s.ceilEdge) : coverageBreaks(cap, s.floorEdge, C.capHeight))) breaks.push({ part: top ? 'cap-bottom' : 'cap-top', at: br });
    if (!breaks.length) return;
    console.warn(`[hitboxes] ${s.id} (${s.art}): vertical break ${breaks.map(b => `${b.part} y ${b.at ? b.at.join('-') : '?'}`).join(', ')}; using a full-width rect`);
    const tw = CONFIG.tombstones.width;
    s.hb.body = { rects: [[C.hitboxX, 0, tw, C.bodyHeight]] };
    s.hb[capKey] = { rects: [top ? [C.hitboxX, 0, tw, s.ceilEdge] : [C.hitboxX, s.floorEdge, tw, C.capHeight - s.floorEdge]] };
    hbFallbacks[s.id] = breaks;
  }

  // ---- Resize / high-DPI ---------------------------------------------------------
  function resize() {
    const s0 = Math.min(window.innerWidth / W, window.innerHeight / H);
    const cssW = Math.floor(W * s0), cssH = Math.floor(H * s0);
    const dpr = Math.min(window.devicePixelRatio || 1, CONFIG.render.maxDpr); // QA P1: cap the backing store
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    const s = canvas.height / H; // canvasHeight / 640
    ctx.setTransform(s, 0, 0, s, 0, 0);
    bgCanvas.width = canvas.width; bgCanvas.height = canvas.height;
    bgCtx.setTransform(s, 0, 0, s, 0, 0);
    ctx.imageSmoothingEnabled = true;
  }
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', resize);
  resize();

  // ---- Game state ------------------------------------------------------------------
  const game = {
    state: 'loading', // 'loading' | 'ready' | 'playing' | 'over'
    paused: false,
    time: 0,
    score: 0,             // display / best / medals only
    pairs: 0,             // PAIRS PASSED: drives all progression (TUNING v1.7)
    best: ScoreService.getBest(),
    player: ScoreService.getCurrentProfile().name,
    newBest: false, rank: 0,
    death: null, deathObj: null,
    golden: false,           // golden RUN (per-run roll)
    goldenModeT: 0,          // v1.9: seconds of Ghost Rush left (gold glow, x2, invincible)
    sp: newSpecials(),
    firstPointGiven: false,
    deadTime: 0,
    flapT: -1,
    ghost: { y: H / 2 - 40, vy: 0, tilt: 0, prevY: H / 2 - 40 },
    physAcc: 0,
    cols: [], hazards: [], queue: [],
    lastPattern: null, lastCentre: null,
    slotX: null, spawnTimer: 0, lastSlotWasPair: false,
    stageIndex: 0, pendingStage: null, fade: null, banner: null,
    skipSlots: 0, easyLeft: 0,
    speedHoldPairsLeft: 0, speedHoldPairs: 0,
    eventNext: null, eventDue: null, event: null, eventLog: [],
    cutscene: null, launches: 0,
    pairsSincePickup: 0, forcePickupNext: false,
    sparkles: [], sparkleAcc: 0, poofs: [], floatTexts: [],
    dist: 0, speed: CONFIG.speed.start,
    flash: 0, god: qaGod, hits: [], cutsceneHitChecks: 0,
    stats: { pairs: 0, pickups: 0, pickupsTaken: 0, hazards: [], spawned: [] },
    perf: { frames: 0, costSum: 0, costMax: 0, intervalSum: 0, intervalMax: 0, costs: [] },
  };
  // Full game object only in debug; otherwise a small read-only view
  if (DEBUG) window.ghostGame = game;
  else window.ghostGame = Object.freeze(Object.defineProperties({}, Object.fromEntries(
    ['state', 'score', 'best', 'pairs', 'golden', 'player'].map(k => [k, { get: () => game[k], enumerable: true }]).concat([['stage', { get: () => STAGES[game.stageIndex].id, enumerable: true }]]))));
  game.debug = DEBUG;
  Object.defineProperty(game, 'hitbox', { get: () => ({ radius: hitboxRadius, offsetY: hitboxOffsetY, source: hitboxSource }) });
  Object.defineProperty(game, 'stage', { get: () => STAGES[game.stageIndex].id });
  game.sprites = sprites;

  const stage = () => STAGES[game.stageIndex];
  function physics() { // stage override (space) merged over CONFIG.ghost; 'normal' (the Void) = CONFIG.ghost as is
    const o = stage().physics;
    return Object.assign({}, CONFIG.ghost, o && typeof o === 'object' ? o : {});
  }
  function newSpecials() { // v1.9 specials state (per run)
    return { since: { rush: 0, extraLife: 0, slowMo: 0 }, last: { rush: null, extraLife: null, slowMo: null }, sinceAny: 0, lastAny: null,
      graceT: 0, slowT: 0, slowF: 1, frostA: 0, lag: 0, lifeHeld: 0, invulnT: 0, knock: null, shift: 0, smashed: 0,
      fx: [], flakes: [], flakeAcc: 0, collected: [], saves: [], force: qaPower.slice() };
  }
  function specialCfg(type) { const P = CONFIG.specials[type], o = P[stage().id]; return Object.assign({}, P, o && typeof o === 'object' ? o : {}); }
  function pickupCfg() { return { radius: CONFIG.specials.radius }; }
  const worldNow = () => game.time - game.sp.lag; // hazard motion clock (slows with Chill)
  const specialSafe = () => game.goldenModeT > 0 || game.sp.graceT > 0 || game.sp.invulnT > 0 || !!game.sp.knock;
  function specialFx(name, x, y, follow) { game.sp.fx.push({ name, t: 0, x, y, follow: !!follow }); if (game.sp.fx.length > 24) game.sp.fx.shift(); }
  function multiplier() {
    const runM = game.golden ? CONFIG.golden.run.scoreMultiplier : 1;
    const modeM = game.goldenModeT > 0 ? CONFIG.specials.rush.scoreMultiplier : 1;
    const m = runM * modeM;
    return CONFIG.golden.maxMultiplier != null ? Math.min(CONFIG.golden.maxMultiplier, m) : m;
  }
  function speedHoldActive() {
    if (CONFIG.stages.transition.speedHoldPairs > 0 && game.speedHoldPairsLeft > 0) return true;
    if (CONFIG.events.speedHold && game.event && game.event.phase !== 'waiting') return true;
    return false;
  }
  function currentSpeed() {
    const v = speedFor(speedHoldActive() ? game.speedHoldPairs : game.pairs);
    const sp = stage().speed; // v2.0: the Void ramps on from speedFor (= 240 cap), counted in pairs from Void entry
    if (sp && game.voidBasePairs != null) return Math.min(sp.max, v + Math.floor(Math.max(0, game.pairs - game.voidBasePairs) / sp.stepEveryPairs) * sp.stepAmount);
    return v;
  }
  const stageGap = () => (stage().gap != null ? stage().gap : gapFor(game.pairs));             // v2.0: the Void holds 145
  const stageSpacing = () => (stage().spacing != null ? stage().spacing : spacingFor(game.pairs)); // v2.0: the Void holds 190
  const transitionActive = () => (game.banner && game.banner.t < CONFIG.stages.transition.bannerSeconds) || game.easyLeft > 0 || game.skipSlots > 0 || !!game.cutscene;

  function centreRange() {
    return { min: CONFIG.tombstones.edgeMargin, max: H - CONFIG.tombstones.edgeMargin - CONFIG.world.groundHeight };
  }

  function scheduleZoneEvent() {
    const def = CONFIG.events.list[stage().id];
    let at = def ? def.firesAt : 0;
    // v0.4.2: zone after a score-based launch: firesAt is relative to the pairs count at lift-off
    if (def && stage().id === LAUNCH_ID && game.spaceBasePairs != null) at = game.spaceBasePairs + (def.firesAfterLaunchPairs != null ? def.firesAfterLaunchPairs : def.firesAt - STAGES[stageIndexById(LAUNCH_ID)].startAt);
    // v2.0: the Void's event counts from Void entry (pairs at the warp)
    if (def && def.firesAfterEntryPairs != null) at = (game.voidBasePairs != null ? game.voidBasePairs : game.pairs) + def.firesAfterEntryPairs;
    game.eventNext = def ? { zone: stage().id, score: at, def } : null;
  }

  // Stage switch (visuals crossfade, event schedule, optional speed hold)
  function enterStage(idx, instant) {
    const from = game.stageIndex;
    game.stageIndex = idx;
    game.fade = instant || from === idx ? null : { from, to: idx, t: 0 };
    if (game.eventDue && game.eventDue.zone !== STAGES[idx].id && !game.eventDue.forced) {
      game.eventLog.push({ id: game.eventDue.def.id, zone: game.eventDue.zone, scheduled: game.eventDue.score, pairs: game.pairs, status: 'missed' });
      game.eventDue = null;
    }
    scheduleZoneEvent();
    if (CONFIG.stages.transition.speedHoldPairs > 0) {
      game.speedHoldPairsLeft = CONFIG.stages.transition.speedHoldPairs;
      game.speedHoldPairs = game.pairs;
    }
  }

  function startBreather(keepBanner) {
    const T = CONFIG.stages.transition;
    if (!(keepBanner && game.banner && game.banner.stage === stage().id)) game.banner = { text: CONFIG.looks[stage().id].name, t: 0, stage: stage().id, index: game.stageIndex };
    game.queue.length = 0; // drop leftover breathers; the transition is the breather
    game.easyLeft = T.easyPairs;
    game.skipSlots = T.emptySlots;
  }

  function reloadUnloadedBg() { // v0.6.1: the warp unloads the space layers; a new run may reach space again
    for (const [key, src] of Object.entries(sprites.bgUnloaded)) {
      delete sprites.bgUnloaded[key];
      loadImage(src).then(img => { if (img && !sprites.bg[key]) sprites.bg[key] = img; });
    }
  }
  function reset() {
    reloadUnloadedBg(); warmQ = null;
    game.state = 'ready';
    game.paused = false;
    game.newBest = false;
    game.rank = 0;
    game.death = null; game.deathObj = null;
    game.player = ScoreService.getCurrentProfile().name;
    game.golden = forceGolden !== null ? forceGolden : (CONFIG.golden.run.enabled && Math.random() < CONFIG.golden.run.chance);
    game.goldenModeT = 0;
    game.sp = newSpecials();
    game.firstPointGiven = false;
    Object.assign(game.ghost, { y: H / 2 - 40, vy: 0, tilt: 0, prevY: H / 2 - 40 });
    game.flapT = -1;
    game.best = ScoreService.getBest();
    game.cols.length = 0; game.hazards.length = 0; game.queue.length = 0;
    game.lastPattern = null; game.lastCentre = null;
    game.slotX = null; game.lastSlotWasPair = false;
    game.spawnTimer = CONFIG.tombstones.firstSpawnDelay;
    game.pendingStage = null; game.banner = null; game.skipSlots = 0; game.easyLeft = 0;
    game.speedHoldPairsLeft = 0;
    game.event = null; game.eventDue = null; game.eventLog = [];
    game.cutscene = null; game.launches = 0; game.launchWaitT = 0; game.spaceBasePairs = null; game.launchLog = []; // QA: every run can launch once
    game.warps = 0; game.warpWaitT = 0; game.voidBasePairs = null; game.warpLog = []; // v0.6: every run can warp once
    game.tapCue = 0;
    game.pairsSincePickup = 0;
    game.forcePickupNext = qaPickup === '1';
    game.sparkles.length = 0; game.sparkleAcc = 0; game.poofs.length = 0; game.floatTexts.length = 0;
    game.flash = 0; game.hits = []; game.cutsceneHitChecks = 0;
    game.stats = { pairs: 0, pickups: 0, pickupsTaken: 0, hazards: [], spawned: [] };
    const qs = parseStage(qaStage);
    const startIdx = qs != null ? qs : 0;
    game.score = 0;
    game.pairs = stageStartPairs(startIdx); // QA hooks set PAIRS
    game.physAcc = 0;
    game.stageIndex = startIdx;
    if (STAGES[startIdx].id === WARP.target) { game.launches = 1; game.warps = 1; game.voidBasePairs = game.pairs; } // QA ?stage=void: already arrived
    game.fade = null;
    scheduleZoneEvent();
    if (qaEvent && qaEvent !== 'rocket') {
      const def = Object.values(CONFIG.events.list).find(d => d.id === qaEvent);
      const zone = Object.keys(CONFIG.events.list).find(z => CONFIG.events.list[z].id === qaEvent);
      if (def) game.eventDue = { zone, score: game.pairs, def, forced: true };
    }
    game.speed = currentSpeed();
  }

  // ---- Pattern generator (unchanged rules from v0.2) ---------------------------------
  function patternOffsets(p) {
    const out = [];
    for (let i = 0; i < p.length; i++) {
      switch (p.name) {
        case 'stairsUp':
        case 'stairsDown': out.push(i * p.step); break;
        case 'zigzag': out.push(i % 2 === 0 ? p.amplitude : -p.amplitude); break;
        case 'wave': out.push(p.amplitude * Math.sin(i * Math.PI / 2)); break;
        default: out.push(0);
      }
    }
    return out;
  }
  function randomCentre(last) {
    const r = centreRange();
    if (last === null) return rand(r.min, r.max);
    const d = CONFIG.tombstones.maxCentreDelta;
    return rand(Math.max(r.min, last - d), Math.min(r.max, last + d));
  }
  function refillQueue() {
    const pool = CONFIG.patterns.pool.filter(p => game.pairs >= p.unlockAt);
    let choices = pool;
    // 'random' counts as a pick; breathers never set lastPattern; skipped while only one is unlocked
    if (CONFIG.patterns.noRepeat && pool.length > 1) choices = pool.filter(p => p.name !== game.lastPattern);
    const p = choices[Math.floor(Math.random() * choices.length)];
    game.lastPattern = p.name;
    let last = game.lastCentre;
    if (p.name === 'random') {
      last = randomCentre(last);
      game.queue.push({ centre: last, spacingDelta: 0, pattern: 'random' });
    } else {
      const r = centreRange();
      const offs = patternOffsets(p);
      const lo = r.min - Math.min(...offs), hi = r.max - Math.max(...offs);
      const d = CONFIG.tombstones.maxCentreDelta - Math.abs(offs[0]);
      let a = lo, b = hi;
      if (last !== null) { a = Math.max(lo, last - d); b = Math.min(hi, last + d); }
      if (a > b) { a = lo; b = Math.max(lo, hi); }
      const start = rand(a, b);
      const d2 = CONFIG.tombstones.maxCentreDelta;
      let prev = last;
      offs.forEach((o, i) => {
        let c = clamp(start + o, r.min, r.max);
        if (prev !== null) c = clamp(c, prev - d2, prev + d2);
        prev = c;
        game.queue.push({ centre: c, spacingDelta: (i > 0 && p.spacingDelta) ? p.spacingDelta : 0, pattern: p.name });
      });
      last = game.queue[game.queue.length - 1].centre;
      const nb = stage().breatherPairs != null ? stage().breatherPairs : CONFIG.patterns.breatherPairs; // v2.0: the Void uses 1
      for (let i = 0; i < nb; i++) {
        last = randomCentre(last);
        game.queue.push({ centre: last, spacingDelta: 0, pattern: 'breather' });
      }
    }
    game.lastCentre = last;
  }
  const isPatternEntry = e => e && e.pattern && !['random', 'breather', 'easy'].includes(e.pattern);
  const patternRunning = () => game.queue.length > 0 && isPatternEntry(game.queue[0]);
  function peekEntry() {
    if (game.easyLeft > 0) return { spacingDelta: 0 };
    if (game.queue.length === 0) refillQueue();
    return game.queue[0];
  }
  function nextEntry() {
    if (game.easyLeft > 0) {
      game.easyLeft--;
      const c = randomCentre(game.lastCentre);
      game.lastCentre = c;
      return { centre: c, spacingDelta: 0, pattern: 'easy', easy: true };
    }
    if (game.queue.length === 0) refillQueue();
    return game.queue.shift();
  }

  // ---- Columns ---------------------------------------------------------------------
  function resolveColumn(id, side) { // side 'top' uses cap-bottom, 'bottom' uses cap-top
    id = CONFIG.objectAliases[id] || id;
    const o = CONFIG.objects[id] || { side, shape: side === 'top' ? 'hang' : 'stand' };
    const need = side === 'top' ? 'capBottom' : 'capTop';
    const own = sprites.sets[id];
    if (own && own[need] && !o.tomb) return { id, key: id, set: own, source: 'sprite' };
    if (side === 'top') return { id, shape: o.shape || 'hang', source: 'shape' }; // v0.4: tops never fall back to tombs
    if (!o.tomb) return { id, shape: o.shape || 'stand', source: 'shape' }; // QA V4: never a tombstone stand-in for other bottoms
    {
      let key = o.tomb && o.tomb !== 'random' ? `tomb-${o.tomb}` : null;
      if (!key || !sprites.sets[key]) {
        key = sprites.tombVariants.length ? sprites.tombVariants[Math.floor(Math.random() * sprites.tombVariants.length)] : null;
      }
      if (key && sprites.sets[key] && sprites.sets[key][need]) return { id, key, set: sprites.sets[key], source: 'sprite' };
      return { id, shape: 'tomb', source: 'shape' }; // tomb ids (graveyard only) keep the tombstone placeholder
    }
  }
  const objectRe = new RegExp(CONFIG.stages.pairRule ? CONFIG.stages.pairRule.objectOf : '^$');
  function objectOf(id) { id = CONFIG.objectAliases[id] || id; const m = objectRe.exec(id); return m ? m[1] : id; }
  function bottomWeights(st) {
    return st.bottom || CONFIG.stages.bottom;
  }

  // Placeholder column shapes in a local frame: x 0..64 (= collision column), y = 0 at the
  // gap edge, growing away from the gap (length L). Same rects are drawn and collided.
  const SHAPES = {
    tomb: L => ({ rects: [[0, 30, 64, L - 30]], circles: [[32, 30, 30]] }),
    coffin: L => ({ rects: [[4, 0, 56, 22], [0, 22, 64, L - 22]] }),
    cross: L => ({ rects: [[24, 0, 16, 40], [4, 10, 56, 14], [6, 40, 52, L - 40]] }),
    asteroid: L => ({ rects: [[4, 30, 56, L - 30]], circles: [[32, 30, 30]] }),
    satellite: L => ({ rects: [[0, 6, 64, 16], [16, 0, 32, 30], [26, 30, 12, L - 30]] }),
    ufo: L => ({ rects: [[0, 0, 64, 16], [18, 16, 28, 14], [28, 30, 8, L - 30]] }),
    stand: L => ({ rects: [[10, 0, 44, 8], [4, 8, 56, L - 8]] }), // neutral standing placeholder (plain block)
    hang: L => ({ rects: [[28, 40, 8, L - 40]], circles: [[32, 22, 22]] }), // generic hanging placeholder (thread + blob)
  };
  function shapeHitboxes(col, p, side) {
    const gapEdge = side === 'top' ? p.centre - p.gap / 2 : p.centre + p.gap / 2;
    const L = side === 'top' ? gapEdge + 100 : GROUND_Y - gapEdge + 100;
    const s = (SHAPES[col.shape] || SHAPES.tomb)(L);
    const dir = side === 'top' ? -1 : 1;
    const rects = s.rects.map(([x, y, w, h]) => dir > 0 ? [p.x + x, gapEdge + y, w, h] : [p.x + x, gapEdge - y - h, w, h]);
    const circles = (s.circles || []).map(([x, y, r]) => [p.x + x, gapEdge + dir * y, r]);
    return { rects, circles };
  }
  function spriteLayout(p, col, side) {
    const C = A.columns, k = C.drawScale;
    const sx = p.x - C.hitboxX * k;
    if (side === 'bottom') return { k, sx, capY: p.centre + p.gap / 2 - col.set.floorEdge * k, capH: C.capHeight * k };
    return { k, sx, capY: p.centre - p.gap / 2 - col.set.ceilEdge * k, capH: C.capHeight * k };
  }
  // World-space hitbox shapes of one column (sprites: hitboxes.json; shapes: SHAPES)
  function columnHitboxes(p, side) {
    const col = side === 'top' ? p.top : p.bottom;
    if (col.shape) return shapeHitboxes(col, p, side);
    const C = A.columns, L = spriteLayout(p, col, side);
    const tw = CONFIG.tombstones.width;
    const capHb = (side === 'top' ? col.set.hb.capBottom : col.set.hb.capTop) ||
      (side === 'top' ? { rects: [[C.hitboxX, 0, tw, col.set.ceilEdge]] } : { rects: [[C.hitboxX, col.set.floorEdge, tw, C.capHeight - col.set.floorEdge]] });
    const body = (col.set.hb.body && col.set.hb.body.rects && col.set.hb.body.rects[0]) || [C.hitboxX, 0, tw, C.bodyHeight];
    const rects = (capHb.rects || []).map(([x, y, w, h]) => [L.sx + x * L.k, L.capY + y * L.k, w * L.k, h * L.k]);
    const circles = (capHb.circles || []).map(([x, y, r]) => [L.sx + x * L.k, L.capY + y * L.k, r * L.k]);
    const bx = L.sx + body[0] * L.k, bw = body[2] * L.k;
    if (side === 'bottom') rects.push([bx, L.capY + L.capH, bw, GROUND_Y - (L.capY + L.capH) + 100]);
    else rects.push([bx, -100, bw, L.capY + 100]);
    return { rects, circles };
  }

  function circleRect(cx, cy, r, rx, ry, rw, rh) {
    const nx = clamp(cx, rx, rx + rw), ny = clamp(cy, ry, ry + rh);
    const dx = cx - nx, dy = cy - ny;
    return dx * dx + dy * dy < r * r;
  }
  function hitsShapes(s, cx, cy, r) {
    for (const [x, y, w, h] of s.rects) if (circleRect(cx, cy, r, x, y, w, h)) return true;
    for (const [x, y, cr] of s.circles) { const dx = cx - x, dy = cy - y, rr = r + cr; if (dx * dx + dy * dy < rr * rr) return true; }
    return false;
  }
  function pairHits(p, cx, cy, r) {
    return hitsShapes(columnHitboxes(p, 'top'), cx, cy, r) || hitsShapes(columnHitboxes(p, 'bottom'), cx, cy, r);
  }

  // ---- Hazards (between pairs) ----------------------------------------------------------
  function hazardY(h, t) {
    if (h.cfg.motion === 'sitOnColumn' || !h.cfg.amplitude) return h.baseY;
    return h.baseY + h.cfg.amplitude * Math.sin(TAU * t / h.cfg.period + h.phase);
  }
  function tryHazard(prev, p) {
    const HZ = CONFIG.hazards, st = HZ.perStage[stage().id];
    if (!st || HZ.maxPerPair < 1 || game.pairs < HZ.minScore) return;
    if (transitionActive() || p.easy || game.event || game.eventDue || p.pickup || (prev && prev.pickup)) return;
    if (!prev || !game.lastSlotWasPair) return;
    if (Math.random() >= st.chance) return;
    const type = weightedPick(st.mix);
    const cfg = HZ.types[type];
    if (!cfg) return;
    const shj = sprites.sheets[type];
    const r = shj && shj.json && shj.json.r > 0 ? shj.json.r : cfg.radius; // hitboxes.json radius when Art exists
    const tw = CONFIG.tombstones.width;
    const x = (prev.x + tw + p.x) / 2;
    const ax = prev.x + tw / 2, ay = prev.centre, bx = p.x + tw / 2, by = p.centre;
    const slope = (by - ay) / (bx - ax);
    const lineY = ay + slope * (x - ax);
    const cos = 1 / Math.sqrt(1 + slope * slope);
    const amp = cfg.motion === 'sitOnColumn' ? 0 : (cfg.amplitude || 0);
    const need = (HZ.minClearance + r) / cos; // vertical offset giving the perpendicular clearance
    let baseY = null;
    if (cfg.motion === 'sitOnColumn') {
      const y = GROUND_Y - r - (shj && shj.json.restY ? (shj.json.restY - shj.json.cy) : 0);
      if (y - lineY >= need) baseY = y;
    } else {
      const options = [];
      const aLo = r + amp + 4, aHi = lineY - need - amp;
      if (aHi >= aLo) options.push([aLo, aHi]);
      const bLo = lineY + need + amp, bHi = GROUND_Y - r - amp - 4;
      if (bHi >= bLo) options.push([bLo, bHi]);
      if (options.length) { const [lo, hi] = options[Math.floor(Math.random() * options.length)]; baseY = rand(lo, hi); }
    }
    if (baseY === null) return;
    const h = { type, cfg, x, baseY, phase: rand(0, TAU), r, born: game.time, line: { ax, ay, bx, by } };
    game.hazards.push(h);
    game.stats.hazards.push({ type, x, baseY, amp, r, ax, ay, bx, by, pairs: game.pairs, stage: stage().id });
  }

  // ---- Spawning -------------------------------------------------------------------------
  function spawnPair(x, entry) {
    const st = stage();
    const prev = game.cols[game.cols.length - 1];
    const gap = stageGap() + (entry.easy ? CONFIG.stages.transition.easyGapBonus : 0);
    const p = {
      x, centre: entry.centre, gap, passed: false, pattern: entry.pattern || 'random', easy: !!entry.easy, stage: st.id,
      top: null, bottom: null,
      pickup: null,
    };
    { // v0.6.1 pairRule (QA F3): the bottom never repeats the top's object
      const topId = weightedPick(st.top), R = CONFIG.stages.pairRule;
      let bw = bottomWeights(st);
      if (R && R.distinctObjects && topId) {
        const o = objectOf(topId), f = Object.fromEntries(Object.entries(bw).filter(([k]) => objectOf(k) !== o));
        if (Object.keys(f).length) bw = f;
      }
      p.top = resolveColumn(topId, 'top'); p.bottom = resolveColumn(weightedPick(bw), 'bottom');
    }
    // v1.9 specials roll: one on screen, global gap, none during transition / event / launch or an active Rush / Chill
    const SPc = CONFIG.specials, sp = game.sp;
    for (const k of SPc.order) sp.since[k]++;
    sp.sinceAny++;
    const blocked = (SPc.onePerScreen && game.cols.some(c => c.pickup && !c.pickup.taken)) || transitionActive() || p.easy
      || game.event || game.eventDue || game.cutscene || (SPc.noSpawnWhileActive && (game.goldenModeT > 0 || sp.slowT > 0 || sp.slowF < 1));
    let pick = null;
    if (!blocked) {
      const forced = sp.force.length ? sp.force[0] : (qaPickup === 'all' || game.forcePickupNext ? 'rush' : null);
      if (forced) { pick = forced; if (sp.force.length) sp.force.shift(); game.forcePickupNext = false; }
      else if (sp.lastAny == null || sp.sinceAny >= SPc.minPairsBetweenAny) {
        const due = SPc.order.map(k => [k, specialCfg(k)]).filter(([k, c]) => game.pairs >= c.fromPairs && (sp.last[k] == null || sp.since[k] >= c.minPairsBetween));
        const pity = due.find(([k, c]) => sp.since[k] >= c.pityAfterPairs);
        if (pity) pick = pity[0];
        else for (const [k, c] of due) if (Math.random() < c.chancePerPair) { pick = k; break; }
      }
    }
    if (pick) {
      p.pickup = { type: pick, dx: CONFIG.tombstones.width / 2, y: p.centre, taken: false };
      sp.since[pick] = 0; sp.last[pick] = game.pairs; sp.sinceAny = 0; sp.lastAny = game.pairs;
      game.stats.pickups++;
      (game.stats.specials || (game.stats.specials = [])).push({ type: pick, pairs: game.pairs, slot: game.stats.pairs, stage: st.id, cutscene: !!game.cutscene, transition: transitionActive(), event: !!(game.event || game.eventDue) });
    }
    tryHazard(prev, p);
    game.cols.push(p);
    game.stats.pairs++;
    game.stats.spawned.push({ stage: st.id, top: p.top.id, topKey: p.top.key || p.top.shape, bottom: p.bottom.id, bottomKey: p.bottom.key || p.bottom.shape, gap, easy: p.easy, pattern: p.pattern, pairs: game.pairs, pickup: !!p.pickup });
    if (game.speedHoldPairsLeft > 0) game.speedHoldPairsLeft--;
    game.slotX = x;
    game.lastSlotWasPair = true;
  }

  function spawnSlot(x) {
    const margin = CONFIG.tombstones.spawnMargin;
    if (x < W + margin - 24) x = W + margin; // after a pause, start at the edge (never pop in)
    // stage change: let a running pattern finish first
    if (game.pendingStage != null && !patternRunning()) {
      enterStage(game.pendingStage);
      game.pendingStage = null;
      startBreather();
    }
    if (game.skipSlots > 0) { game.skipSlots--; game.slotX = x; game.lastSlotWasPair = false; return; }
    if (game.eventDue && !patternRunning() && !transitionActive()) {
      const due = game.eventDue;
      const handler = EVENTS[due.def.id];
      if (!handler) { // stub: logged and rescheduled; does not pause anything
        game.eventLog.push({ id: due.def.id, zone: due.zone, scheduled: due.score, pairs: game.pairs, status: 'stub' });
        game.eventDue = null;
        rescheduleAfter(due);
      } else {
        game.event = { id: due.def.id, def: due.def, zone: due.zone, scheduled: due.score, phase: 'waiting', t: 0, data: {}, forced: !!due.forced };
        game.eventDue = null;
        if (CONFIG.events.speedHold) game.speedHoldPairs = game.pairs;
        return; // pairs paused while the event runs
      }
    }
    spawnPair(x, nextEntry());
  }

  function rescheduleAfter(due) {
    const def = due.def;
    if (due.forced) { if (!game.eventNext || game.eventNext.zone !== stage().id) scheduleZoneEvent(); return; }
    if (def.repeatEvery && (!CONFIG.events.repeatOnlyInZone || due.zone === stage().id)) {
      let n = due.score + def.repeatEvery;
      while (n <= game.pairs) n += def.repeatEvery;
      game.eventNext = { zone: due.zone, score: n, def };
    } else if (game.eventNext && game.eventNext.zone === due.zone) {
      game.eventNext = null;
    }
  }

  // ---- Events --------------------------------------------------------------------------
  const EVENTS = {
    hearse: {
      start(ev) {
        const d = ev.def, sh = sprites.sheets.hearse;
        if (sh) { // Art: 160x64, bottom on the ground line, enter x=360, leave x=-160
          const j = sh.json;
          const w = j.size ? j.size[0] : sh.def.w, h = j.size ? j.size[1] : sh.def.h;
          ev.data = { sprite: true, x: W, w, h, rects: j.rects, vx: (W + w) / d.seconds };
        } else {
          ev.data = { sprite: false, x: W + 10, w: d.length, h: d.floorRise, rects: [[6, 6, d.length - 12, d.floorRise - 6]], vx: (W + 20 + d.length) / d.seconds };
        }
      },
      update(ev, dt) { ev.data.x -= ev.data.vx * dt; },
      done(ev) { return ev.data.x + ev.data.w <= 0; },
      hitRects(ev) { const d = ev.data, top = GROUND_Y - d.h; return d.rects.map(([x, y, w, h]) => [d.x + x, top + y, w, h]); },
      hits(ev, cx, cy, r) { return this.hitRects(ev).some(([x, y, w, h]) => circleRect(cx, cy, r, x, y, w, h)); },
      lane() { return { y: GROUND_Y - 32, label: 'Hearse!' }; },
    },
    // Meteor shower (TUNING v1.5): 2 diagonal waves from the top-right, each a curtain of meteors
    // moving down-left with ONE clear lane; all meteors of a wave cross the ghost's column together.
    meteorShower: {
      start(ev) {
        const d = ev.def, sh = sprites.sheets.meteor;
        const r = sh && sh.json.r ? sh.json.r : 12;
        const meteors = [], lanes = [];
        let lane = clamp(game.ghost.y + hitboxOffsetY, d.laneMinY, d.laneMaxY);
        for (let w = 0; w < d.waves; w++) {
          if (w > 0) { const sh2 = rand(d.laneShiftMin, d.laneShiftMax) * (Math.random() < 0.5 ? -1 : 1); lane = clamp(lane + sh2, d.laneMinY, d.laneMaxY); if (Math.abs(lane - lanes[w - 1]) < d.laneShiftMin) lane = clamp(lanes[w - 1] - sh2, d.laneMinY, d.laneMaxY); }
          lanes.push(lane);
          const T = d.waveCrossAt[w];
          for (let yc = r; yc < GROUND_Y + 40; yc += d.spacing) {
            if (Math.abs(yc - lane) < d.laneHeight / 2 + r) continue;
            // position at time t: crosses (ghost.x, yc) at t = T
            meteors.push({ T, yc, r, wave: w, gone: false });
          }
        }
        ev.data = { meteors, lanes, r };
      },
      pos(ev, m) { const d = ev.def, dt = ev.t - m.T; return { x: CONFIG.ghost.x + d.vx * dt, y: m.yc + d.vy * dt }; },
      update(ev) {
        for (const m of ev.data.meteors) {
          if (m.gone) continue;
          const p = this.pos(ev, m);
          if (p.x < -80 || p.y > GROUND_Y + 10) { m.gone = true; if (p.y > GROUND_Y && p.x > -20) poof(p.x, GROUND_Y - 4); }
        }
      },
      done(ev) { return ev.data.meteors.every(m => m.gone); },
      hits(ev, cx, cy, r) {
        return ev.data.meteors.some(m => { if (m.gone) return false; const p = this.pos(ev, m); return (p.x - cx) ** 2 + (p.y - cy) ** 2 < (r + m.r) ** 2; });
      },
      lane() { return { y: 90, label: 'Meteors!' }; },
    },
    // v2.0 Invader Wave (the Void): 2 rows (formations) of pixel invaders sweep right -> left, each a full-height
    // curtain with ONE clear lane >= laneHeight tall (measured between invader edges, wiggle included).
    invaderWave: {
      start(ev) {
        const d = ev.def, sh = sprites.sheets.invader, r = sh && sh.json.r ? sh.json.r : d.r;
        const inv = [], lanes = [];
        let lane = clamp(game.ghost.y + hitboxOffsetY, d.laneMinY, d.laneMaxY);
        for (let w = 0; w < d.waves; w++) {
          if (w > 0) { const sh2 = rand(d.laneShiftMin, d.laneShiftMax) * (Math.random() < 0.5 ? -1 : 1); lane = clamp(lane + sh2, d.laneMinY, d.laneMaxY); if (Math.abs(lane - lanes[w - 1]) < d.laneShiftMin) lane = clamp(lanes[w - 1] - sh2, d.laneMinY, d.laneMaxY); }
          lanes.push(lane);
          for (let yc = r; yc < GROUND_Y + r; yc += d.spacing) {
            if (Math.abs(yc - lane) < d.laneHeight / 2 + r + d.wiggle) continue;
            inv.push({ T: d.waveCrossAt[w], yc, r, wave: w, ph: rand(0, TAU), gone: false });
          }
        }
        const pool = d.rowSheets.map((k, i) => i), rows = [];
        for (let w = 0; w < d.waves; w++) { if (!pool.length) d.rowSheets.forEach((k, i) => pool.push(i)); rows.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]); }
        ev.data = { inv, lanes, r, rows, pops: [] };
      },
      pos(ev, m) { const d = ev.def; return { x: CONFIG.ghost.x + d.vx * (ev.t - m.T), y: m.yc + d.wiggle * Math.sin(ev.t * 6 + m.ph) }; },
      update(ev, dt) {
        for (const m of ev.data.inv) if (!m.gone && this.pos(ev, m).x < -40) m.gone = true;
        for (const p of ev.data.pops) p.t += dt;
        ev.data.pops = ev.data.pops.filter(p => p.t < ev.def.popSeconds);
      },
      smash(ev, cx, cy, r) { // Rush: invaders it touches pop (Art's pop fx), +smashBonus each
        for (const m of ev.data.inv) { if (m.gone) continue; const p = this.pos(ev, m); if ((p.x - cx) ** 2 + (p.y - cy) ** 2 < (r + m.r) ** 2) { m.gone = true; ev.data.pops.push({ x: p.x, y: p.y, t: 0 }); smash(p.x, p.y); } }
      },
      done(ev) { return ev.data.inv.every(m => m.gone); },
      hits(ev, cx, cy, r) {
        return ev.data.inv.some(m => { if (m.gone) return false; const p = this.pos(ev, m); return (p.x - cx) ** 2 + (p.y - cy) ** 2 < (r + m.r) ** 2; });
      },
      lane() { return { y: 90, label: 'Invaders!' }; },
    },
    // batSwarm, pumpkinRoll, sweetShower, nightBus: TODO(v0.4) — stubs (logged only)
  };

  function updateEvent(dt) {
    const ev = game.event;
    if (!ev) return;
    const handler = EVENTS[ev.id];
    const G = CONFIG.ghost, tw = CONFIG.tombstones.width;
    ev.t += dt;
    if (game.launches === 0 && game.stageIndex < stageIndexById(LAUNCH_ID) && game.score >= CONFIG.launch.atScore) game.launchWaitT += dt / (game.sp.slowF || 1); // real seconds (Chill slows dt)
    if (game.warps === 0 && stage().id === WARP.from && game.score >= WARP.atScore) game.warpWaitT += dt / (game.sp.slowF || 1); // v0.6: same rule for the warp
    if (ev.phase === 'waiting') {
      // fairness: start only once nothing is left ahead of the ghost
      const clear = game.cols.every(p => p.x + tw < G.x - hitboxRadius - 4) && game.hazards.every(h => h.x + h.r < G.x - hitboxRadius - 4);
      if (clear) { ev.phase = 'warning'; ev.t = 0; }
    } else if (ev.phase === 'warning') {
      if (ev.t >= CONFIG.events.warningSeconds) { ev.phase = 'active'; ev.t = 0; handler.start(ev); game.eventLog.push({ id: ev.id, zone: ev.zone, scheduled: ev.scheduled, pairs: game.pairs, status: 'started' }); }
    } else if (ev.phase === 'active') {
      handler.update(ev, dt);
      if (ev.t >= ev.def.seconds && handler.done(ev)) {
        const pts = (ev.def.bonus || 0) * multiplier();
        if (pts) { game.score += pts; floatText(`+${pts} ${ev.def.id === 'hearse' ? 'Hearse dodged!' : 'Bonus!'}`, W / 2, H / 2 - 120, CONFIG.colors.warning); }
        game.eventLog.push({ id: ev.id, zone: ev.zone, scheduled: ev.scheduled, pairs: game.pairs, status: 'survived', bonus: pts });
        game.event = null;
        rescheduleAfter({ def: ev.def, zone: ev.zone, score: ev.scheduled, forced: ev.forced });
        game.slotX = W + CONFIG.tombstones.spawnMargin - stageSpacing(); // resume right away
        game.lastSlotWasPair = false;
      }
    }
  }

  // ---- Launch cutscene ------------------------------------------------------------------
  function startLaunch() {
    for (const p of game.cols) poof(p.x + CONFIG.tombstones.width / 2, p.centre);
    for (const h of game.hazards) poof(h.x, hazardY(h, worldNow()));
    game.cols.length = 0; game.hazards.length = 0; game.queue.length = 0;
    game.pendingStage = null; game.skipSlots = 0; game.easyLeft = 0;
    if (game.event) { game.eventLog.push({ id: game.event.id, zone: game.event.zone, scheduled: game.event.scheduled, pairs: game.pairs, status: 'cancelled' }); game.event = null; }
    game.eventDue = null;
    const CL = CONFIG.launch.clouds;
    game.cutscene = { t: 0, startY: game.ghost.y, switched: false, speeds: [], from: stage().id, smoke: [], smokeAcc: 0,
      clouds: Array.from({ length: CL.count }, (_, i) => ({ x: rand(-40, W - 120), at: i / CL.count, v: rand(CL.speedMin, CL.speedMax), kind: ['cloudA', 'cloudB', 'cloudC'][i % 3] })) };
    game.launches++;
    game.spaceBasePairs = game.pairs;
    game.launchLog.push({ score: game.score, pairs: game.pairs, from: stage().id, t: game.time });
    game.ghost.prevY = game.ghost.y;
    floatText(CONFIG.launch.achievement, W / 2, 150, CONFIG.colors.warning, 2);
  }
  // Cutscene layout at Art time s (0..2.5 s). Everything in world px; no hitboxes.
  function launchLayout(c) {
    const L = CONFIG.launch, T = L.timeline, s = c.t * 2.5 / L.cutsceneSeconds;
    const smooth = x => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
    const padX = lerp(W + 20, L.padWorld[0], easeOut(clamp(s / T.padIn, 0, 1)));
    const skyTop = s < T.climb ? L.skyPan[0] : lerp(L.skyPan[0], L.skyPan[1], smooth((s - T.climb) / (T.arrive - T.climb)));
    const shift = L.skyPan[0] - skyTop; // the city, ground and pad slide down as the sky pans up
    const restY = L.padWorld[1] + L.rocketOnPad[1];
    let ry = restY;
    const liftEnd = restY - L.liftOffRise;
    const holdEnd = L.climbHoldY - L.climbDrift;
    if (s >= T.liftOff && s < T.climb) ry = restY - L.liftOffRise * Math.pow((s - T.liftOff) / (T.climb - T.liftOff), 2);
    else if (s >= T.climb && s < T.arrive) { const k = (s - T.climb) / (T.arrive - T.climb); ry = lerp(liftEnd, L.climbHoldY, smooth(k / 0.4)) - L.climbDrift * k; }
    else if (s >= T.arrive) ry = holdEnd - L.zoomSpeed * (s - T.arrive);
    const rx = padX + L.rocketOnPad[0];
    return { s, T, padX, padY: L.padWorld[1] + (s >= T.climb ? shift : 0), skyTop, shift, rx, ry,
      thrust: s >= T.ignite, flame: s < T.ignite ? null : s < T.liftOff ? 'ignite' : 'cycle',
      shake: s >= T.ignite && s < T.liftOff ? L.shakePx : 0,
      skyAlpha: s < T.climb ? 0 : clamp((s - T.climb) / 0.15, 0, 1),
      spaceAlpha: s < T.arrive ? 0 : clamp((s - T.arrive) / 0.25, 0, 1) };
  }
  function rocketY(u) { return launchLayout({ t: u * CONFIG.launch.cutsceneSeconds }).ry; } // kept for QA
  function updateCutscene(dt) {
    const c = game.cutscene, L = CONFIG.launch, g = game.ghost;
    c.t += dt;
    const u = Math.min(1, c.t / L.cutsceneSeconds);
    const lay = launchLayout(c), T = lay.T;
    // ghost: tween into the porthole, hide during the flight, pop out at the start position on arrival
    const px = lay.rx + L.porthole[0], py = lay.ry + L.porthole[1];
    if (lay.s < T.board) { const k = easeInOut(lay.s / T.board); c.gx = lerp(CONFIG.ghost.x, px, k); g.y = lerp(c.startY, py, k); c.ghostScale = 1 - 0.4 * k; c.ghostHidden = false; }
    else if (lay.s < T.arrive) { c.gx = px; g.y = py; c.ghostHidden = true; }
    else { const k = clamp((lay.s - T.arrive) / (2.5 - T.arrive), 0, 1); c.gx = CONFIG.ghost.x; g.y = H / 2 - 40; c.ghostHidden = false; c.ghostScale = easeOut(k) * 1.1 - 0.1 * k * k; }
    if (u >= 1) { c.gx = CONFIG.ghost.x; g.y = H / 2 - 40; c.ghostScale = 1; }
    g.vy = 0; g.tilt = 0; g.prevY = g.y; game.physAcc = 0;
    // smoke particles from ignition until shortly after lift-off
    const SM = L.smoke;
    if (lay.s >= T.ignite && lay.s < T.climb + 0.2) {
      c.smokeAcc += dt * SM.rate;
      while (c.smokeAcc >= 1) { c.smokeAcc -= 1; c.smoke.push({ x: lay.rx + 48 + rand(-SM.spread, SM.spread), y: lay.padY + 100 + rand(-6, 6), vx: rand(-60, 60), vy: rand(-20, 10), t: 0 }); }
    }
    for (const p of c.smoke) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; }
    c.smoke = c.smoke.filter(p => p.t < SM.life);
    c.speeds.push({ pairs: game.pairs, speed: game.speed, expected: speedFor(game.pairs) });
    if (!c.switched && u >= L.crossfadeAt) { c.switched = true; enterStage(stageIndexById(L.target || CONFIG.stages.loopFrom), true); } // ST3: instant, the cutscene is the transition
    if (u >= 1) {
      game.cutscene = null;
      game.fade = null; // ST3: nothing of the old stage outlives the cutscene
      g.vy = 0;
      game.tapCue = CONFIG.ui.tapCueSeconds;
      startBreather();
      game.slotX = W + CONFIG.tombstones.spawnMargin - stageSpacing(); // first slot = the empty slot
      game.lastSlotWasPair = false;
      game.lastCompletedCutscene = { speeds: c.speeds };
    }
  }

  // ---- v0.6 warp cutscene (space -> The Void): stars blur into pastel mist -------------------------
  function startWarp() {
    for (const p of game.cols) poof(p.x + CONFIG.tombstones.width / 2, p.centre);
    for (const h of game.hazards) poof(h.x, hazardY(h, worldNow()));
    game.cols.length = 0; game.hazards.length = 0; game.queue.length = 0;
    game.pendingStage = null; game.skipSlots = 0; game.easyLeft = 0;
    if (game.event) { game.eventLog.push({ id: game.event.id, zone: game.event.zone, scheduled: game.event.scheduled, pairs: game.pairs, status: 'cancelled' }); game.event = null; }
    game.eventDue = null; game.eventNext = null;
    const look = CONFIG.looks[WARP.target] || {}, cols = look.mist || ['#FFB6CC'];
    game.cutscene = { kind: 'warp', t: 0, startY: game.ghost.y, switched: false, speeds: [], from: stage().id,
      streaks: Array.from({ length: WARP.streakCount }, () => ({ x: rand(0, W), y: rand(0, GROUND_Y), k: rand(0.5, 1.2) })),
      blobs: Array.from({ length: WARP.mistBlobs }, (_, i) => ({ x: rand(-40, W + 60), y: rand(40, GROUND_Y + 20), r: rand(70, 140), c: i % cols.length, v: rand(0.6, 1.2) })),
      ribbons: Array.from({ length: WARP.ribbons }, (_, i) => ({ x: 50 + i * (W - 100) / Math.max(1, WARP.ribbons - 1) + rand(-20, 20), len: rand(160, 300), ph: rand(0, TAU) })) };
    game.warps++;
    game.voidBasePairs = game.pairs;
    game.warpLog.push({ score: game.score, pairs: game.pairs, from: stage().id, t: game.time });
    game.ghost.prevY = game.ghost.y;
    floatText(WARP.achievement, W / 2, 150, CONFIG.colors.warning, 2);
  }
  function warpS(c) { return c.t * 2.0 / WARP.cutsceneSeconds; } // timeline is authored for a 2.0 s cutscene
  function releaseMistBuf() { if (typeof mistBuf !== 'undefined' && mistBuf) { mistBuf.width = mistBuf.height = 0; mistBuf = null; } }
  function updateWarp(dt) {
    const c = game.cutscene, g = game.ghost, T = WARP.timeline;
    c.t += dt;
    const u = Math.min(1, c.t / WARP.cutsceneSeconds), s = warpS(c);
    const k = easeInOut(clamp(s / T.ghostSettle, 0, 1));
    c.gx = CONFIG.ghost.x;
    g.y = lerp(c.startY, H / 2 - 40, k) + Math.sin(game.time * CONFIG.ghost.bobSpeed) * CONFIG.ghost.bobAmplitude * k * 0.5;
    g.vy = 0; g.tilt += (0 - g.tilt) * Math.min(1, CONFIG.ghost.tiltLerp * dt); g.prevY = g.y; game.physAcc = 0;
    c.speeds.push({ pairs: game.pairs, speed: game.speed, expected: speedFor(game.pairs) });
    const M = WARP.mist, ti = stageIndexById(WARP.target);
    if (!c.bannered && s >= T.mistStart) { // Art §14.3: the mist overlay starts with the stage banner
      c.bannered = true; c.mistAt = game.time;
      game.banner = { text: CONFIG.looks[WARP.target].name, t: 0, stage: WARP.target, index: ti };
    }
    if (!c.switched && s >= T.mistStart + M.switchFrame / M.fps) { c.switched = true; c.switchS = s; enterStage(ti, true); } // bg switches at mist frame 3
    if (u >= 1) {
      if (!c.switched) enterStage(stageIndexById(WARP.target), true);
      if (c.snap) { c.snap.width = c.snap.height = 0; c.snap = null; } releaseMistBuf();
      g.y = g.prevY = H / 2 - 40; g.vy = 0; g.tilt = 0;
      game.cutscene = null;
      game.fade = null;
      game.tapCue = CONFIG.ui.tapCueSeconds;
      startBreather(true); // then: 'transition' (the banner already started with the mist)
      game.slotX = W + CONFIG.tombstones.spawnMargin - stageSpacing();
      game.lastSlotWasPair = false;
      game.lastCompletedWarp = { speeds: c.speeds };
    }
  }

  // ---- Progress checks (stage / launch / events) -------------------------------------------
  function checkProgress() {
    if (game.cutscene) return;
    const launchIdx = stageIndexById(LAUNCH_ID);
    let target = stageIndexForPairs(game.pairs);
    if (launchIdx >= 0 && target >= launchIdx) target = launchIdx - 1; // space is only ever reached by the launch
    // v0.4.2: the launch fires once, when the displayed score reaches atScore (or pairs reach space.startAt),
    // from whatever stage we're in (city may be skipped). An active event finishes first (bounded, real seconds).
    const L = CONFIG.launch;
    const due = L.trigger === 'score' ? (game.score >= L.atScore || game.pairs >= STAGES[launchIdx].startAt) : game.pairs >= L.atScore;
    if (launchIdx >= 0 && game.stageIndex < launchIdx && game.launches === 0 && due) {
      game.pendingStage = null; game.eventDue = null; game.eventNext = null; // no new stage/event before the launch
      if (game.event && game.event.phase === 'active' && game.launchWaitT < L.eventFinishMaxSeconds) return; // updateEvent counts launchWaitT
      startLaunch(); return; // rocket launch into space (pairs cleared, no waiting)
    }
    // v0.6 warp: once per run, from space, when the DISPLAYED score reaches warp.atScore (a bonus jump past it counts)
    const warpTo = stageIndexById(WARP.target);
    if (warpTo >= 0 && stage().id === WARP.from && game.warps === 0 && game.score >= WARP.atScore) {
      game.pendingStage = null; game.eventDue = null; game.eventNext = null;
      if (game.event && game.event.phase === 'active' && game.warpWaitT < WARP.eventFinishMaxSeconds) return;
      startWarp(); return;
    }
    if (target > game.stageIndex && game.pendingStage == null) {
      game.pendingStage = target;
    } else if (game.pendingStage != null && target > game.pendingStage) {
      game.pendingStage = target;
    }
    const n = game.eventNext;
    if (n && !game.eventDue && !game.event && n.zone === stage().id && game.pairs >= n.score) {
      game.eventDue = { zone: n.zone, score: n.score, def: n.def };
      game.eventNext = null;
    }
  }

  // ---- Effects helpers -------------------------------------------------------------------
  function poof(x, y) { for (let i = 0; i < 8; i++) game.poofs.push({ x, y, vx: rand(-60, 60), vy: rand(-60, 60), life: 0.5 }); }
  function floatText(text, x, y, color, scale = 1) { game.floatTexts.push({ text, x, y, color, t: 0, scale }); }

  // ---- Input ----------------------------------------------------------------------------
  function flap() {
    game.ghost.vy = physics().flapImpulse; // SET, not add
    game.ghost.tilt = CONFIG.ghost.tiltUp;
    game.flapT = 0;
    game.tapCue = 0;
  }
  function restartFrom() { return game.deadTime + (game.death ? game.death.seconds : 0); } // lockout starts when the anim ends
  function onPress() {
    if (uiOpen()) return;
    if (game.state === 'loading') return;
    if (game.paused) { game.paused = false; lastT = performance.now(); return; }
    if (game.state === 'ready') {
      game.state = 'playing';
      flap();
      if (qaEvent === 'rocket') { game.pairs = Math.max(game.pairs, CONFIG.launch.atScore); }
      if (qaEvent === 'warp') { game.score = Math.max(game.score, WARP.atScore); }
    } else if (game.state === 'playing') {
      if (game.cutscene) return; // taps ignored during the launch cutscene
      flap();
    } else if (game.state === 'over') {
      if (deathPlaying()) return; // v0.5: taps ignored during the death animation
      if (game.time - restartFrom() >= CONFIG.ui.restartLockout) reset();
    }
  }
  canvas.addEventListener('pointerdown', e => { e.preventDefault(); onPress(); });
  const inUi = e => !!(e.target && e.target.closest && e.target.closest('.gg-ui')); // v0.5 DOM overlay (profiles / top-10)
  window.addEventListener('pointerdown', e => { if (e.target !== canvas && !inUi(e)) { e.preventDefault(); onPress(); } });
  window.addEventListener('keydown', e => {
    if (inUi(e)) return;
    if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); if (!e.repeat) onPress(); }
  });
  ['touchstart', 'touchmove', 'gesturestart', 'dblclick', 'contextmenu'].forEach(t =>
    window.addEventListener(t, e => { if (!inUi(e)) e.preventDefault(); }, { passive: false }));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && game.state === 'playing') game.paused = true;
    lastT = performance.now();
  });

  // ---- Scoring / death --------------------------------------------------------------------
  // v0.5 death animations (CONFIG.deathAnims): pure presentation, starts after the run has ended
  function deathAnimFor(obj) {
    const D = CONFIG.deathAnims;
    const forced = qaDeath && (D.types[qaDeath] ? qaDeath : D.aliases[qaDeath]);
    if (forced && D.types[forced]) return forced;
    const id = CONFIG.objectAliases[obj] || obj;
    const a = D.map[id] || (D.types[id] ? id : D.aliases[id]);
    return D.types[a] ? a : D.fallback;
  }
  function startDeath(anim, obj) {
    const D = CONFIG.deathAnims, T = D.types[anim];
    const g = game.ghost;
    game.death = { anim, obj: obj || null, golden: !!(game.golden || game.goldenModeT > 0), t: 0, seconds: Math.min(1.49, T.seconds), x: CONFIG.ghost.x, y: g.y, tilt: g.tilt, parts: [] };
    const d = game.death;
    if (anim === 'meteor') for (let i = 0; i < 10; i++) d.parts.push({ x: d.x + rand(-10, 10), y: d.y + rand(-10, 10), vx: rand(-25, 25), vy: rand(-70, -20), r: rand(5, 10), life: rand(0.6, 1.2) });
    if (anim === 'generic') for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; d.parts.push({ x: d.x, y: d.y, vx: Math.cos(a) * rand(60, 110), vy: Math.sin(a) * rand(60, 110), r: rand(5, 9), life: rand(0.5, 0.8) }); }
    if (anim === 'pumpkin') for (let i = 0; i < 6; i++) d.parts.push({ x: d.x + rand(-14, 14), y: d.y + 10, vx: rand(-80, 80), vy: rand(-90, -30), r: rand(2, 4), life: 0.7 });
  }
  function updateDeath(dt) {
    const d = game.death;
    if (!d) return;
    d.t = Math.min(d.seconds, d.t + dt);
    for (const q of d.parts) { q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vy += (d.anim === 'meteor' ? -10 : 160) * dt; }
    d.parts = d.parts.filter(q => q.life > 0);
  }
  const deathPlaying = () => !!(game.death && game.death.t < game.death.seconds);
  function die(cause, obj) {
    if (game.god) { if (!game.hits.length || game.time - game.hits[game.hits.length - 1].t > 0.3) game.hits.push({ cause, t: game.time, pairs: game.pairs, stage: stage().id, cutscene: !!game.cutscene }); return; }
    if (game.state === 'playing' && game.sp.lifeHeld > 0) { useExtraLife(cause, obj); return; }
    game.state = 'over';
    game.deadTime = game.time;
    game.flash = 1;
    game.deathCause = cause;
    game.deathObj = obj || null;
    startDeath(deathAnimFor(obj || cause), obj);
    if (game.event) { game.eventLog.push({ id: game.event.id, zone: game.event.zone, scheduled: game.event.scheduled, pairs: game.pairs, status: 'died' }); }
    const res = SS.onGameOver(game.score, { golden: game.golden, stage: stage().id });
    game.best = res.best; game.player = res.player; // the run belongs to whoever was selected when it ended
    game.newBest = res.newBest;
    game.rank = res.rank;
  }
  function addPoint() {
    let pts = CONFIG.scoring.perPair * multiplier();
    if (game.golden && !game.firstPointGiven) pts += CONFIG.golden.run.firstPointBonus;
    game.firstPointGiven = true;
    game.score += pts;
    game.pairs += 1; // progression counter: one per pair, regardless of bonuses
  }
  function useExtraLife(cause, obj) { // v1.9.1: heart pops, knocked to the nearest gap centre over 0.3 s, vy 0, then 1.5 s invulnerable
    const sp = game.sp, g = game.ghost, O = CONFIG.specials.extraLife.onHit, G = CONFIG.ghost, tw = CONFIG.tombstones.width;
    sp.lifeHeld--;
    let best = null;
    for (const p of game.cols) { const d = Math.abs(p.x + tw / 2 - G.x); if (!best || d < best.d) best = { d, y: p.centre }; }
    const toY = (best ? best.y : (centreRange().min + centreRange().max) / 2) - hitboxOffsetY;
    sp.knock = { t: 0, from: g.y, to: toY };
    g.vy = O.vyAfter;
    sp.saves.push({ cause, obj: obj || null, pairs: game.pairs, t: game.time, toY });
    specialFx('heartBreak', G.x, g.y, true);
    game.flash = 0.6;
  }
  function collectPickup(p) {
    const SPc = CONFIG.specials, sp = game.sp, type = p.pickup.type || 'rush', C = SPc[type], G = CONFIG.ghost, col = SPc.art.placeholder[type];
    p.pickup.taken = true;
    game.stats.pickupsTaken++;
    let pts = C.instantPoints, label = '';
    if (type === 'rush') {
      if (game.golden && CONFIG.golden.pickupOnGoldenRun === 'doubleInstant') pts *= 2;
      game.goldenModeT += C.seconds; sp.graceT = 0; label = '  Rush!';
    } else if (type === 'extraLife') {
      if (sp.lifeHeld >= C.maxHeld) pts = C.pointsIfAlreadyHeld; else { sp.lifeHeld++; label = '  +1 life'; }
      specialFx('heartPop', G.x, game.ghost.y, true);
    } else {
      sp.slowT += C.seconds; label = '  Chill!';
      specialFx('frostBurst', G.x, game.ghost.y, true);
    }
    game.score += pts;
    sp.collected.push({ type, pts, pairs: game.pairs, t: game.time, score: game.score });
    floatText(`+${pts}${label}`, G.x + 30, p.pickup.y - 30, col);
    for (let i = 0; i < 12; i++) game.sparkles.push({ x: p.x + p.pickup.dx, y: p.pickup.y, vx: rand(-90, 90), vy: rand(-90, 90), life: CONFIG.golden.sparkleLife });
  }
  function smash(x, y) { // Rush: obstacle bursts into candy, +smashBonus on top of the pair point
    const sp = game.sp; sp.smashed++;
    game.score += CONFIG.specials.rush.smashBonus;
    specialFx('candyBurst', x, y, false);
    floatText(`+${CONFIG.specials.rush.smashBonus}`, x, y - 20, CONFIG.specials.art.placeholder.rush);
  }
  function updateSpecials(dt) { // real-time timers (the ghost's own clock)
    const sp = game.sp, SPc = CONFIG.specials, M = SPc.slowMo, R = SPc.rush, g = game.ghost;
    if (sp.slowT > 0) sp.slowT = Math.max(0, sp.slowT - dt);
    const tgt = sp.slowT > 0 ? M.worldScale : 1, rate = (1 - M.worldScale) / M.rampSeconds;
    sp.slowF = sp.slowF < tgt ? Math.min(tgt, sp.slowF + rate * dt) : Math.max(tgt, sp.slowF - rate * dt);
    sp.frostA = clamp(sp.frostA + (sp.slowT > 0 ? 1 : -1) * dt / M.overlayFadeSeconds, 0, 1);
    if (game.goldenModeT > 0) { game.goldenModeT = Math.max(0, game.goldenModeT - dt); if (game.goldenModeT === 0) sp.graceT = R.graceSeconds; }
    else if (sp.graceT > 0) sp.graceT = Math.max(0, sp.graceT - dt);
    if (sp.invulnT > 0) sp.invulnT = Math.max(0, sp.invulnT - dt);
    const st = game.goldenModeT > 0 ? R.forwardShift : 0, sr = R.forwardShift / R.shiftEaseSeconds;
    sp.shift = sp.shift < st ? Math.min(st, sp.shift + sr * dt) : Math.max(st, sp.shift - sr * dt);
    if (sp.knock) {
      const O = SPc.extraLife.onHit, k = sp.knock; k.t += dt;
      const u = Math.min(1, k.t / O.knockSeconds), e = u * u * (3 - 2 * u);
      g.y = g.prevY = k.from + (k.to - k.from) * e; g.vy = O.vyAfter; game.physAcc = 0;
      if (u >= 1) { sp.knock = null; sp.invulnT = O.invulnSeconds; const sv = sp.saves[sp.saves.length - 1]; if (sv) { sv.endY = g.y; sv.endT = game.time; } }
    }
    for (const f of sp.fx) f.t += dt;
    sp.fx = sp.fx.filter(f => f.t < CONFIG.specials.art.fxSeconds);
    const FL = M.flakes;
    if (sp.frostA > 0 && effectsOn) { sp.flakeAcc += dt * FL.perSecond * sp.frostA; while (sp.flakeAcc >= 1 && sp.flakes.length < FL.max) { sp.flakeAcc -= 1; sp.flakes.push({ x: rand(0, W), y: -10, vy: rand(FL.fallMin, FL.fallMax), rot: rand(0, 360), spin: rand(FL.spinMin, FL.spinMax) * (Math.random() < 0.5 ? -1 : 1), k: Math.floor(rand(0, 3)), ph: rand(0, TAU) }); } }
    for (const f of sp.flakes) { f.y += f.vy * dt; f.rot += f.spin * dt; }
    sp.flakes = sp.flakes.filter(f => f.y < GROUND_Y + 10);
  }

  // ---- Update -------------------------------------------------------------------------------
  function update(dt) {
    game.time += dt;
    const g = game.ghost, G = CONFIG.ghost, tw = CONFIG.tombstones.width;
    if (game.flash > 0) game.flash = Math.max(0, game.flash - dt * 3);
    if (game.flapT >= 0 && game.state !== 'over') {
      game.flapT += dt;
      if (game.flapT >= A.ghost.flapFrames.length / A.ghost.flapFps) game.flapT = -1;
    }
    updateFx(dt);
    if (game.tapCue > 0) game.tapCue = Math.max(0, game.tapCue - dt);
    updateBgLayers(dt);
    if (game.state === 'loading') return;
    if (game.state === 'ready') {
      g.y = H / 2 - 40 + Math.sin(game.time * G.bobSpeed) * G.bobAmplitude;
      g.prevY = g.y; game.physAcc = 0;
      game.dist += CONFIG.speed.start * dt;
      return;
    }
    if (game.state === 'over') { updateDeath(dt); return; }

    // --- playing ---
    const speed = (game.speed = currentSpeed()); // progression speed (speedFor by pairs, never paused)
    updateSpecials(dt);
    const wdt = game.cutscene ? dt : dt * game.sp.slowF; // Chill slows the WORLD only; ghost physics stay on real dt
    game.sp.lag += dt - wdt;
    game.worldSpeed = speed * (dt ? wdt / dt : 1);
    game.dist += speed * wdt;
    if (game.cutscene) {
      if (game.cutscene.kind === 'warp') updateWarp(dt); else updateCutscene(dt);
    } else if (game.sp.knock) {
      // Extra Life knock-back owns the ghost's y for 0.3 s (vy 0); normal physics resume afterwards
    } else {
      // fixed-timestep vertical physics (QA P2): identical flap at 30/60/120 Hz
      const ph = physics(), STEP = 1 / CONFIG.world.physicsHz;
      game.physAcc += dt;
      while (game.physAcc >= STEP - 1e-9) {
        game.physAcc -= STEP;
        g.prevY = g.y;
        g.vy = clamp(g.vy + ph.gravity * STEP, ph.maxRiseSpeed, ph.maxFallSpeed);
        g.y += g.vy * STEP;
      }
      if (game.physAcc < 0) game.physAcc = 0;
      const targetTilt = g.vy < 0 ? G.tiltUp : (g.vy / ph.maxFallSpeed) * G.tiltDownMax;
      g.tilt += (targetTilt - g.tilt) * Math.min(1, G.tiltLerp * dt);
    }

    for (const p of game.cols) p.x -= speed * wdt;
    for (const h of game.hazards) h.x -= speed * wdt;
    while (game.cols.length && game.cols[0].x + tw < -20) game.cols.shift();
    while (game.hazards.length && game.hazards[0].x + game.hazards[0].r < -20) game.hazards.shift();
    if (game.slotX !== null) game.slotX -= speed * wdt;

    if (!game.cutscene) {
      // spawning
      if (!game.event) {
        if (game.slotX === null) {
          game.spawnTimer -= wdt;
          if (game.spawnTimer <= 0) spawnSlot(W + CONFIG.tombstones.spawnMargin);
        } else {
          const spacing = stageSpacing() + (peekEntry().spacingDelta || 0);
          if (game.slotX + spacing <= W + CONFIG.tombstones.spawnMargin) spawnSlot(game.slotX + spacing);
        }
      }
      updateEvent(wdt);

      // scoring + collisions
      const r = hitboxRadius, hy = g.y + hitboxOffsetY;
      for (const p of game.cols) {
        if (!p.passed && G.x > p.x + tw) { p.passed = true; addPoint(); }
        if (p.pickup && !p.pickup.taken) {
          const dx = G.x - (p.x + p.pickup.dx), dy = hy - p.pickup.y, rr = pickupCfg().radius + r;
          if (dx * dx + dy * dy < rr * rr) collectPickup(p);
        }
        if (!p.smashed && pairHits(p, G.x, hy, r)) {
          if (game.goldenModeT > 0) { p.smashed = true; smash(p.x + tw / 2, hy); continue; }
          if (specialSafe()) continue;
          const hitTop = hitsShapes(columnHitboxes(p, 'top'), G.x, hy, r);
          die('column', (hitTop ? p.top : p.bottom).id); if (game.state !== 'playing') return;
        }
      }
      for (const h of game.hazards) {
        if (h.smashed) continue;
        const dx = G.x - h.x, dy = hy - hazardY(h, worldNow()), rr = h.r + r;
        if (dx * dx + dy * dy < rr * rr) {
          if (game.goldenModeT > 0) { h.smashed = true; smash(h.x, hazardY(h, worldNow())); continue; }
          if (specialSafe()) continue;
          die('hazard:' + h.type, h.type); if (game.state !== 'playing') return;
        }
      }
      if (game.event && game.event.phase === 'active' && game.goldenModeT > 0 && EVENTS[game.event.id].smash) EVENTS[game.event.id].smash(game.event, G.x, hy, r);
      if (game.event && game.event.phase === 'active' && !specialSafe() && EVENTS[game.event.id].hits(game.event, G.x, hy, r)) {
        die('event:' + game.event.id, game.event.id); if (game.state !== 'playing') return;
      }
      if ((hy - r <= 0 || hy + r >= GROUND_Y) && specialSafe()) { // Rush: floor/ceiling safe; grace / invuln: no death
        g.y = g.prevY = clamp(hy, r + 1, GROUND_Y - r - 1) - hitboxOffsetY; if ((hy - r <= 0 && g.vy < 0) || (hy + r >= GROUND_Y && g.vy > 0)) g.vy = 0;
      } else if (hy - r <= 0 || hy + r >= GROUND_Y) {
        if (!game.god) g.y = g.prevY = clamp(hy, r, GROUND_Y - r) - hitboxOffsetY;
        else { g.y = g.prevY = clamp(g.y, r - hitboxOffsetY + 1, GROUND_Y - r - hitboxOffsetY - 1); g.vy = 0; }
        die(hy - r <= 0 ? 'ceiling' : 'ground', hy - r <= 0 ? 'ceiling' : 'ground');
        if (game.state !== 'playing') return;
      }
    }
    checkProgress();

    // golden sparkle trail (golden run or golden mode)
    if (game.golden || game.goldenModeT > 0) {
      game.sparkleAcc += dt * CONFIG.golden.sparkleRate;
      while (game.sparkleAcc >= 1) {
        game.sparkleAcc -= 1;
        game.sparkles.push({ x: G.x - 14 + rand(-4, 4), y: g.y + rand(-12, 12), vx: -speed * 0.6, vy: -10, life: CONFIG.golden.sparkleLife });
      }
    }
  }

  function updateFx(dt) {
    for (const s of game.sparkles) { s.life -= dt; s.x += s.vx * dt; s.y += (s.vy || -10) * dt; }
    if (game.sparkles.length > 200) game.sparkles.splice(0, game.sparkles.length - 200);
    game.sparkles = game.sparkles.filter(s => s.life > 0);
    for (const p of game.poofs) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; }
    game.poofs = game.poofs.filter(p => p.life > 0);
    for (const f of game.floatTexts) { f.t += dt; f.y -= 30 * dt; }
    game.floatTexts = game.floatTexts.filter(f => f.t < CONFIG.ui.floatTextSeconds * f.scale);
    if (game.fade) { game.fade.t += dt / CONFIG.stages.transition.crossfadeSeconds; if (game.fade.t >= 1) game.fade = null; }
    if (game.banner) { game.banner.t += dt; if (game.banner.t >= CONFIG.stages.transition.bannerSeconds + 0.4) game.banner = null; }
    if (effectsOn) updateAmbient(dt);
  }

  // ---- Ambient effects (decorative only, pooled, capped, no collision) -------------------
  const amb = { fog: [], birds: [], fireflies: [], rain: [], stars: [], shooting: [], shootTimer: 2 };
  function ambCfg(stageId, key) {
    const a = CONFIG.ambient[stageId];
    return effectsOn && a && a[key] && a[key].enabled ? a[key] : null;
  }
  function initAmbient() {
    const fog = CONFIG.ambient.graveyard.fog, birds = CONFIG.ambient.church.birds;
    for (let i = 0; i < fog.count; i++) amb.fog.push({ x: rand(0, W), y: rand(GROUND_Y - 60, GROUND_Y + 10), rx: rand(60, 120), ry: rand(14, 26), v: rand(0.5, 1.5) });
    for (let i = 0; i < birds.count; i++) amb.birds.push(perchBird({}, rand(40, W + 200)));
    for (let i = 0; i < CONFIG.ambient.countryside.fireflies.count; i++) amb.fireflies.push({ x: rand(0, W), y: rand(250, GROUND_Y - 20), ph: rand(0, TAU), sp: rand(0.5, 1.2) });
    for (let i = 0; i < CONFIG.ambient.city.rain.count; i++) amb.rain.push({ x: rand(0, W + 100), y: rand(-H, H), len: rand(8, 16) });
    amb.vsp = []; for (let i = 0; i < CONFIG.ambient.void.sparkles.count; i++) amb.vsp.push({ x: rand(0, W), y: rand(50, GROUND_Y - 10), ph: rand(0, TAU), k: rand(0.6, 1.3) });
    amb.vmist = []; for (let i = 0; i < CONFIG.ambient.void.mist.count; i++) amb.vmist.push({ x: rand(0, W), y: rand(120, GROUND_Y - 20), rx: rand(50, 100), ry: rand(14, 26), v: rand(0.5, 1.5), c: i });
    for (let i = 0; i < CONFIG.ambient.space.stars.count; i++) amb.stars.push({ x: rand(0, W), y: rand(0, GROUND_Y - 40), ph: rand(0, 4), k: rand(0.6, 1.2) });
  }
  function perchBird(b, x) { return Object.assign(b, { x, y: CONFIG.ambient.church.birds.roofY + rand(-6, 6), state: 'perch', t: 0, alpha: 1, mirror: Math.random() < 0.3 }); }
  function visibleStages() {
    const ids = [stage().id];
    if (game.fade) ids.push(STAGES[game.fade.from].id);
    return ids;
  }
  function updateAmbient(dt) {
    const speed = game.state === 'playing' ? game.speed : (game.state === 'ready' ? CONFIG.speed.start : 0);
    const vis = visibleStages();
    if (vis.includes('graveyard') && ambCfg('graveyard', 'fog')) {
      const F = ambCfg('graveyard', 'fog');
      for (const f of amb.fog) { f.x -= (speed * 0.3 + F.drift * f.v) * dt; if (f.x + f.rx < 0) { f.x = W + f.rx; f.y = rand(GROUND_Y - 60, GROUND_Y + 10); } }
    }
    if (vis.includes('church') && ambCfg('church', 'birds')) {
      const B = ambCfg('church', 'birds');
      for (const b of amb.birds) {
        b.t += dt;
        if (b.state === 'perch') {
          b.x -= speed * CONFIG.assets.backgrounds.parallax.mid * dt;
          if (Math.abs(b.x - CONFIG.ghost.x) < B.scatterDist && game.state === 'playing') { b.state = 'fly'; b.t = 0; }
          if (b.x < -30) perchBird(b, W + rand(20, 260));
        } else {
          b.x += (B.flyVx * (b.mirror ? -1 : 1) - speed * 0.2) * dt; b.y += B.flyVy * dt; b.alpha -= dt * 0.6;
          if (b.alpha <= 0 || b.y < -30) perchBird(b, W + rand(40, 300));
        }
      }
    }
    if (vis.includes('countryside')) for (const f of amb.fireflies) { f.ph += dt * f.sp; f.x -= (speed * 0.25 + 8) * dt; f.y += Math.sin(f.ph * 2) * 10 * dt; if (f.x < -5) { f.x = W + 5; f.y = rand(250, GROUND_Y - 20); } }
    if (vis.includes('city') && ambCfg('city', 'rain')) {
      const R = ambCfg('city', 'rain');
      for (const d of amb.rain) { d.y += R.speed * dt; d.x -= (R.slant + speed * 0.2) * dt; if (d.y > GROUND_Y || d.x < -20) { d.y = rand(-60, 0); d.x = rand(0, W + 120); } }
    }
    if (vis.includes('void')) {
      const Mi = ambCfg('void', 'mist');
      if (Mi) for (const f of amb.vmist) { f.x -= (speed * 0.2 + Mi.drift * f.v) * dt; if (f.x + f.rx < 0) { f.x = W + f.rx; f.y = rand(120, GROUND_Y - 20); } }
      if (ambCfg('void', 'sparkles')) for (const p of amb.vsp) { p.x -= speed * 0.08 * dt; if (p.x < -6) { p.x = W + 6; p.y = rand(50, GROUND_Y - 10); } }
    }
    if (vis.includes('space') && ambCfg('space', 'shootingStars')) {
      const S = ambCfg('space', 'shootingStars');
      amb.shootTimer -= dt;
      if (amb.shootTimer <= 0 && amb.shooting.length < 2) { amb.shooting.push({ x: rand(W * 0.4, W + 60), y: rand(20, 200), life: 0.8 }); amb.shootTimer = rand(S.intervalMin, S.intervalMax); }
      for (const s of amb.shooting) { s.x -= 420 * dt; s.y += 180 * dt; s.life -= dt; }
      amb.shooting = amb.shooting.filter(s => s.life > 0);
      for (const st of amb.stars) { st.x -= (speed * 0.04) * dt; if (st.x < -10) st.x = W + 10; }
    }
  }

  // ---- Sprite sheet helper ----------------------------------------------------------------
  function sheetFrame(sh, t, phase = 0) {
    const fr = sh.def.frames;
    if (!sh.def.fps || fr.length < 2) return fr[0];
    return fr[Math.floor((t + phase) * sh.def.fps) % fr.length];
  }
  function drawSheet(name, x, y, t, opts = {}) { // x,y = top-left in logical px
    const sh = sprites.sheets[name];
    if (!sh) return false;
    const res = sprites.res, fw = sh.def.w * res, fh = sh.def.h * res;
    const f = opts.frame != null ? opts.frame : sheetFrame(sh, t, opts.phase);
    const w = opts.w || sh.def.w, h = opts.h || sh.def.h;
    if (opts.mirror) { ctx.save(); ctx.translate(x + w, y); ctx.scale(-1, 1); ctx.drawImage(sh.img, f * fw, 0, fw, fh, 0, 0, w, h); ctx.restore(); }
    else ctx.drawImage(sh.img, f * fw, 0, fw, fh, x, y, w, h);
    return true;
  }
  function tileSheetX(name, offsetX, y, alpha = 1) {
    const sh = sprites.sheets[name];
    if (!sh) return false;
    const w = sh.def.w;
    let x0 = -((offsetX % w) + w) % w;
    ctx.globalAlpha = alpha;
    for (let x = x0; x < W; x += w) drawSheet(name, x, y, 0);
    ctx.globalAlpha = 1;
    return true;
  }

  // ---- Art parallax backgrounds (ASSETS.md §7): per-layer state, transition tiles or crossfade ------
  const bgState = {}; // layer -> { cur, base, trans: { from, to, k } | null, fade: { from, t } | null }
  const voidPartsReady = () => { const v = sprites.voidParts; return !!(v && v.need.length && v.need.every(f => v.img[f])); };
  const voidParts = id => id === A.backgrounds.voidParts.stage && voidPartsReady();
  const artBg = id => voidParts(id) || !!(sprites.bg[`${id}-far`] && sprites.bg[`${id}-mid`] && sprites.bg[`${id}-near`]);
  const bgFactor = (id, layer) => { const B = A.backgrounds; return ((B.parallaxByStage[id] || {})[layer]) || B.parallax[layer]; };
  function updateBgLayers(dt) {
    const B = A.backgrounds, TW = B.tileWidth, id = stage().id;
    for (const layer of B.layers) {
      let st = bgState[layer];
      if (!st) st = bgState[layer] = { cur: id, base: game.dist, trans: null, fade: null };
      if (st.cur !== id) {
        const from = st.cur, tile = sprites.bg[`trans-${from}-${id}-${layer}`];
        const warping = game.cutscene && game.cutscene.kind === 'warp';
        if (game.state !== 'playing' || (game.cutscene && !warping) || bgFactor(from, layer) !== bgFactor(id, layer)) {
          Object.assign(st, { cur: id, base: game.dist, trans: null, fade: null }); // QA jump or after the launch: offset 0
        } else if (warping) { // v0.6: under the thickest mist, swap the on-screen tile for the space->void trans tile (Art §14.3)
          const k0 = Math.floor(((game.dist - st.base) * bgFactor(id, layer)) / TW);
          Object.assign(st, { cur: id, trans: tile ? { from, to: id, k: k0 } : null, fade: null });
          if (!tile) Object.assign(st, { base: game.dist });
          (game.stats.bgChanges = game.stats.bgChanges || []).push({ layer, from, to: id, mode: tile ? 'warp-tile' : 'warp-cut', hasTile: !!tile });
          if (!tile && WARP.unloadFromAfterSwap) dropLayer(`${from}-${layer}`, true);
        } else {
          const f = bgFactor(id, layer), off = (game.dist - st.base) * f;
          const kn = Math.floor((off + W) / TW) + 1; // first tile not yet on screen
          const secs = (kn * TW - (off + W)) / Math.max(1, game.speed * f);
          if (st.trans) st.trans = null;
          if (tile && (B.alwaysTransLayers.includes(layer) || secs <= B.transMaxSeconds)) { st.trans = { from, to: id, k: kn }; st.fade = null; }
          else st.fade = { from, t: 0 };
          st.cur = id;
          game.stats.bgChanges = game.stats.bgChanges || [];
          game.stats.bgChanges.push({ layer, from, to: id, mode: st.trans ? 'tile' : 'fade', secsToEdge: Math.round(secs * 100) / 100, hasTile: !!tile });
        }
      }
      if (st.fade) { st.fade.t += dt / B.fadeSeconds; if (st.fade.t >= 1) st.fade = null; }
      if (st.trans) { const off = (game.dist - st.base) * bgFactor(id, layer); if (off >= (st.trans.k + 1) * TW) st.trans = null; }
    }
  }
  // v0.3.1 (QA P1): every parallax tile is pre-rendered once into an offscreen canvas at the
  // final backing-pixel size, cropped to its non-transparent rows, and blitted 1:1 (no scaling).
  const layerCache = new Map(); // key -> { canvas, y0 } (LRU order)
  const alphaRows = {};
  function clearLayerCache() { layerCache.clear(); }
  function opaqueRows(key, img, worldH) { // [y0, y1] in world px that contain any visible pixel
    if (alphaRows[key]) return alphaRows[key];
    let r = [0, worldH];
    try {
      const sw = 90, sh = Math.round(worldH / 8), c = document.createElement('canvas'); c.width = sw; c.height = sh;
      const x = c.getContext('2d'); x.drawImage(img, 0, 0, sw, sh);
      const d = x.getImageData(0, 0, sw, sh).data;
      let first = -1, last = -1;
      for (let y = 0; y < sh; y++) { for (let i = 0; i < sw; i++) if (d[(y * sw + i) * 4 + 3] > 0) { if (first < 0) first = y; last = y; break; } }
      if (first >= 0) r = [Math.max(0, (first - 1) * 8), Math.min(worldH, (last + 2) * 8)];
    } catch (e) { /* tainted or unsupported: keep full height */ }
    return (alphaRows[key] = r);
  }
  // v0.3.2: tiles are built OFF the frame with createImageBitmap (decode + resize off-thread),
  // scheduled on idle time (requestIdleCallback, setTimeout fallback), one build in flight at a time.
  // Only the current stage, the next stage and their transition tiles are kept (QA memory note).
  // Far layers and the launch sky are cached at reduced resolution and upscaled on blit.
  const buildQueue = [];
  let sweepN = 0, building = null, pumpScheduled = false, frameKeys = new Set(), lastFrameKeys = new Set();
  const layerScale = key => (key === 'launchSky' ? CONFIG.render.skyScale : /-far$/.test(key) ? CONFIG.render.farLayerScale : 1);
  function layerMeta(key) { // v0.6.1: CONFIG backgrounds.layerMeta, else hitboxes.json backgrounds.layerMeta (Art's stage ids)
    if (key === 'launchSky' || key.startsWith('trans-')) return null;
    const i = key.lastIndexOf('-'), id = key.slice(0, i), l = key.slice(i + 1), B = A.backgrounds;
    return ((B.layerMeta || {})[id] || {})[l] || (sprites.bgMeta[(B.artStageIds || {})[id] || id] || {})[l] || null;
  }
  function layerGeom(key, img) { // world band [yo, yo + wh] the file covers
    const m = layerMeta(key);
    if (!m) return { yo: 0, wh: H };
    const yo = m.yOffset || 0, nat = img.height * A.backgrounds.tileWidth / img.width;
    return { yo, wh: m.height != null ? m.height : m.stretch ? H - yo : m.yOffset != null ? nat : H };
  }
  function layerSrc(key) {
    const sky = key === 'launchSky';
    const img = sky ? sprites.sheets.launchSky && sprites.sheets.launchSky.img : sprites.bg[key];
    if (!img) return null;
    const g = sky ? { yo: 0, wh: sprites.sheets.launchSky.def.h } : layerGeom(key, img);
    const ww = sky ? W : A.backgrounds.tileWidth, wh = g.wh;
    const [y0, y1] = sky ? [0, wh] : opaqueRows(key, img, wh);
    return { img, ww, wh, y0, y1, yo: g.yo };
  }
  function getLayer(key) { // returns a fresh cache entry, or null (and queues a build)
    const scNow = canvas.height / H, e = layerCache.get(key);
    frameKeys.add(key);
    if (e && e.sc === scNow) return e;
    if (building !== key && !buildQueue.includes(key)) buildQueue.unshift(key); // needed now: front of the queue
    schedulePump();
    return null;
  }
  function schedulePump() {
    if (pumpScheduled || building) return;
    pumpScheduled = true;
    const run = () => { pumpScheduled = false; pump(); };
    if (window.requestIdleCallback) requestIdleCallback(run, { timeout: 250 }); else setTimeout(run, 16);
  }
  function makeBitmap(src, sx, sy, sw, sh, w, h) {
    const viaCanvas = () => { const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(src, sx, sy, sw, sh, 0, 0, w, h); return c; };
    if (!window.createImageBitmap) return Promise.resolve(viaCanvas());
    return createImageBitmap(src, sx, sy, sw, sh, { resizeWidth: w, resizeHeight: h, resizeQuality: 'high' })
      .then(bm => (bm.width === w && bm.height === h ? bm : (bm.close && bm.close(), viaCanvas())))
      .catch(viaCanvas);
  }
  function pump() {
    if (building) return;
    let key;
    while ((key = buildQueue.shift())) { const e = layerCache.get(key); if (!(e && e.sc === canvas.height / H)) break; }
    if (!key) return;
    const src = layerSrc(key);
    if (!src) { schedulePump(); return; }
    building = key;
    const sc = canvas.height / H, q = layerScale(key), kx = src.img.height / src.wh;
    const dw = Math.round(src.ww * sc), dh = Math.max(1, Math.round((src.y1 - src.y0) * sc));
    const t0 = performance.now();
    makeBitmap(src.img, 0, src.y0 * kx, src.img.width, (src.y1 - src.y0) * kx, Math.max(1, Math.round(dw * q)), Math.max(1, Math.round(dh * q))).then(bm => {
      building = null;
      if (sc !== canvas.height / H) { if (bm.close) bm.close(); buildQueue.push(key); schedulePump(); return; } // resized meanwhile
      const old = layerCache.get(key); if (old && old.img.close) old.img.close();
      layerCache.delete(key);
      layerCache.set(key, { img: bm, y0: src.yo + src.y0, dw, dh, sc, bytes: bm.width * bm.height * 4 });
      game.stats.layerBuilds = (game.stats.layerBuilds || 0) + 1;
      if (DEBUG) (game.stats.buildLog = game.stats.buildLog || []).push([key, Math.round(game.dist), +(performance.now() - t0).toFixed(1)]);
      game.stats.layerBuildMs = Math.max(game.stats.layerBuildMs || 0, performance.now() - t0);
      evictLayers();
      schedulePump();
    });
  }
  function dropLayer(key, unload) { // v0.6.1: evict a cached tile now (and optionally release its source image)
    const e = layerCache.get(key); if (e) { if (e.img.close) e.img.close(); layerCache.delete(key); }
    const qi = buildQueue.indexOf(key); if (qi >= 0) buildQueue.splice(qi, 1);
    frameKeys.delete(key); lastFrameKeys.delete(key);
    if (unload && sprites.bg[key]) { sprites.bgUnloaded[key] = sprites.bg[key].src; sprites.bg[key].src = ''; delete sprites.bg[key]; }
    (game.stats.dropped = game.stats.dropped || []).push(key);
    let b = 0; for (const x of layerCache.values()) b += x.bytes; game.stats.cacheMB = b / 1048576;
  }
  function evictLayers() { // keep only what is on screen or about to be
    const keep = new Set([...lastFrameKeys, ...frameKeys, ...prewarmKeys()]);
    for (const [k, e] of layerCache) if (!keep.has(k)) { if (e.img.close) e.img.close(); layerCache.delete(k); }
    while (layerCache.size > CONFIG.render.layerCacheMax) { const [k, e] = layerCache.entries().next().value; if (e.img.close) e.img.close(); layerCache.delete(k); }
    let b = 0; for (const e of layerCache.values()) b += e.bytes;
    game.stats.cacheMB = b / 1048576; game.stats.cacheMBPeak = Math.max(game.stats.cacheMBPeak || 0, game.stats.cacheMB);
  }
  function blit(e, dx, dy, alpha) {
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (alpha < 1) ctx.globalAlpha *= alpha;
    ctx.drawImage(e.img, dx, dy, e.dw, e.dh);
    ctx.restore();
  }
  const warpDeferred = (id, l) => id === WARP.target && (WARP.deferLayers || []).includes(l) && game.warps === 0 && !(game.cutscene && game.cutscene.kind === 'warp' && game.cutscene.switched);
  function warpPrewarmDue() { return game.warps > 0 || (game.cutscene && game.cutscene.kind === 'warp') || game.score >= WARP.atScore - WARP.prewarmScoreAhead; }
  function prewarmKeys() { // per layer: while it transitions keep from+trans+cur, once settled cur+next+trans (<= 3 per layer)
    const B = A.backgrounds, cur = stage().id, keys = [];
    let next = STAGES[game.stageIndex + 1];
    if (next && next.id === WARP.target && !warpPrewarmDue()) next = null; // v0.6: hold the Void tiles until the warp is near
    const launchNext = next && next.id === LAUNCH_ID;
    for (const l of B.layers) {
      const st = bgState[l];
      keys.push(`${cur}-${l}`);
      if (st && st.cur !== cur) { keys.push(`${st.cur}-${l}`, `trans-${st.cur}-${cur}-${l}`); continue; } // stage just switched, bg not yet
      if (st && st.trans) {
        keys.push(`trans-${st.trans.from}-${st.trans.to}-${l}`);
        const off = (game.dist - st.base) * bgFactor(cur, l);
        if (Math.floor(off / B.tileWidth) < st.trans.k) { keys.push(`${st.trans.from}-${l}`); continue; } // outgoing tile still on screen
        if (next) keys.push(`${next.id}-${l}`); // outgoing tile gone (mid ~20 s, far ~60 s to pass a trans tile): prewarm the next stage's tile, still 3 per layer
        continue;
      } else if (st && st.fade) { keys.push(`${st.fade.from}-${l}`); continue; }
      if (next && !warpDeferred(next.id, l)) { keys.push(`${next.id}-${l}`); if (!launchNext) keys.push(`trans-${cur}-${next.id}-${l}`); }
    }
    if (launchNext && B.layers.every(l => keys.includes(`${next.id}-${l}`))) keys.push('launchSky');
    return keys.filter(k => (k === 'launchSky' ? sprites.sheets.launchSky : sprites.bg[k]));
  }
  let warmQ = null, warmBusy = false; const warmLog = [];
  function warmVoid() { // v0.6.1 (QA F4): decode + upload the Void images one per idle callback once the warp is near
    if (!WARP.warmOnIdle || warmBusy || stage().id !== WARP.from || !warpPrewarmDue()) return;
    if (!warmQ) {
      const v = sprites.voidParts; warmQ = [];
      if (sprites.ui.warpMist) warmQ.push(sprites.ui.warpMist);
      if (v) for (const img of Object.values(v.img)) if (img) warmQ.push(img);
    }
    const img = warmQ.shift(); if (!img) return;
    warmBusy = true;
    const run = () => {
      const t0 = performance.now();
      const done = () => { try { const c = document.createElement('canvas'); c.width = c.height = 1; c.getContext('2d').drawImage(img, 0, 0, 1, 1); } catch (e) { /* ignore */ } if (img === sprites.ui.warpMist && !mistGain) mistGain = mistGains(img); warmLog.push([img.src.split('/').pop(), +(performance.now() - t0).toFixed(1)]); warmBusy = false; };
      (img.decode ? img.decode() : Promise.resolve()).then(done, done);
    };
    if (window.requestIdleCallback) requestIdleCallback(run, { timeout: 250 }); else setTimeout(run, 16);
  }
  function prewarm() { // queue (never build inline) everything the next stage change will need
    warmVoid();
    if (game.state === 'loading' || !artBg(stage().id)) return;
    const sc = canvas.height / H;
    for (const k of prewarmKeys()) { const e = layerCache.get(k); if (!(e && e.sc === sc) && building !== k && !buildQueue.includes(k)) buildQueue.push(k); }
    if (buildQueue.length) schedulePump();
    else if (!building && ++sweepN % CONFIG.render.evictSweepFrames === 0) evictLayers();
    lastFrameKeys = frameKeys; frameKeys = new Set();
  }
  function drawVoidSlot(layer, dx, slot, m, cwMax) { // v0.6.1: Art §14.2 parts inside one 720 world-px slot (backing px)
    const v = sprites.voidParts, sc = m.a, TW = A.backgrounds.tileWidth, y0 = m.f;
    const X = wx => Math.round(dx + wx * sc), Y = wy => Math.round(y0 + wy * m.d);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = A.backgrounds.voidParts.smoothing;
    for (const p of v.spec[layer] || []) {
      if (p.kind === 'gradient') { // doesn't scroll: once per frame, full canvas
        if (slot !== 0) continue;
        const g = ctx.createLinearGradient(0, Y(p.y), 0, Y(p.y + p.h)); g.addColorStop(0, p.top); g.addColorStop(1, p.bottom);
        ctx.fillStyle = g; ctx.fillRect(0, Y(p.y), cwMax, Y(p.y + p.h) - Y(p.y));
      } else if (p.kind === 'sprites') {
        if (!A.backgrounds.voidParts.glints) continue;
        for (const pl of p.placements || []) {
          const sp = p.sprites[pl.sprite], img = sp && v.img[sp.file]; if (!img) continue;
          const k = pl.scale || 1, w = sp.size1x[0] * k, h = sp.size1x[1] * k;
          const x = pl.x - sp.anchor[0] * k, y = pl.y - sp.anchor[1] * k;
          ctx.drawImage(img, X(x), Y(y), X(x + w) - X(x), Y(y + h) - Y(y));
        }
      } else if (p.file && v.img[p.file]) {
        const img = v.img[p.file], w = p.drawW || p.size1x[0], h = p.drawH || p.size1x[1];
        const nx = p.repeat === 'xy' || p.repeat === 'x' ? Math.ceil(TW / w) : 1, ny = p.repeat === 'xy' || p.repeat === 'y' ? Math.ceil((p.drawH || 640) / h) : 1;
        for (let ix = 0; ix < nx; ix++) for (let iy = 0; iy < ny; iy++) {
          const x = ix * w, y = (p.y || 0) + iy * h;
          ctx.drawImage(img, X(x), Y(y), X(x + w) - X(x), Y(y + h) - Y(y));
        }
      }
    }
    ctx.restore();
    game.stats.voidSlots = (game.stats.voidSlots || 0) + 1;
  }
  function drawArtBackground(id) {
    const B = A.backgrounds, TW = B.tileWidth, m = ctx.getTransform(), sc = m.a, cwMax = canvas.width;
    const fm = layerMeta(`${id}-far`);
    if (fm && fm.fill === 'gradient') { // v0.6.1: short far layer over the stage sky
      const sky = CONFIG.looks[id].sky, gr = ctx.createLinearGradient(0, m.f, 0, m.f + H * m.d);
      gr.addColorStop(0, sky[0]); gr.addColorStop(1, sky[1]);
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = gr; ctx.fillRect(0, Math.round(m.f), cwMax, Math.round(H * m.d)); ctx.restore();
    }
    const warpMist = game.cutscene && game.cutscene.kind === 'warp' && game.cutscene.switched;
    const parts = voidParts(id);
    for (const layer of B.layers) {
      const st = bgState[layer] && bgState[layer].cur === id ? bgState[layer] : { base: 0, trans: null, fade: null };
      const off = (game.dist - st.base) * bgFactor(id, layer);
      const k0 = Math.floor(off / TW);
      const px0 = Math.round(m.e + (k0 * TW - off) * sc), tw = Math.round(TW * sc);
      for (let i = 0; i < 2; i++) {
        const k = k0 + i, dx = px0 + i * tw;
        if (dx >= cwMax) break;
        let keyA, keyB = null, a = 1;
        if (st.trans) {
          const T = st.trans;
          keyA = k < T.k ? `${T.from}-${layer}` : k === T.k ? `trans-${T.from}-${T.to}-${layer}` : `${T.to}-${layer}`;
          if (!sprites.bg[keyA]) keyA = `${id}-${layer}`;
        } else if (st.fade && sprites.bg[`${st.fade.from}-${layer}`]) { keyA = `${st.fade.from}-${layer}`; keyB = `${id}-${layer}`; a = easeInOut(Math.min(1, st.fade.t)); }
        else keyA = `${id}-${layer}`;
        // v0.5 parallax swap: the incoming layer eases up into place while it fades in (no hard cut)
        const slide = keyB ? Math.round(((CONFIG.transitions.swap.slide[layer] || 0) * (1 - a)) * m.d) : 0;
        if (parts && keyA === `${id}-${layer}` && !keyB) { drawVoidSlot(layer, dx, i, m, cwMax); continue; } // v0.6.1
        for (const [key, al] of keyB ? [[keyA, 1], [keyB, a]] : [[keyA, 1]]) {
          const e = getLayer(key), yOff = key === keyB ? slide : 0;
          if (e) { blit(e, dx, Math.round(m.f + e.y0 * m.d) + yOff, al); continue; }
          // v0.6.1: a deferred Void layer still building under the warp mist is skipped (hidden by the mist)
          if (warpMist && id === WARP.target && (WARP.deferLayers || []).includes(layer)) { game.stats.warpSkipped = (game.stats.warpSkipped || 0) + 1; continue; }
          // not cached yet (first frames, or right after a resize): draw straight from the source image
          const img = sprites.bg[key], g = layerGeom(key, img);
          ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); if (al < 1) ctx.globalAlpha *= al;
          ctx.drawImage(img, dx, Math.round(m.f + g.yo * m.d) + yOff, tw, Math.round(g.wh * m.d)); ctx.restore();
          game.stats.directDraws = (game.stats.directDraws || 0) + 1;
          if (DEBUG) { const d = game.stats.directLog = game.stats.directLog || {}; d[key] = (d[key] || 0) + 1; }
        }
      }
    }
  }


  // ---- Placeholder parallax backgrounds ------------------------------------------------------
  const LAYERS = {}; // stageId -> [Path2D far, mid, near]
  function buildLayers() {
    const B = GROUND_Y;
    const hills = (rng, base, amp, n) => { const p = new Path2D(); p.moveTo(0, B); for (let x = 0; x <= W; x += 6) p.lineTo(x, base - amp * (0.5 + 0.5 * Math.sin((x / W) * TAU * n + 1.3))); p.lineTo(W, B); p.closePath(); return p; };
    const rr = (p, x, y, w, h, r) => { p.moveTo(x, y + h); p.lineTo(x, y + r); p.arcTo(x, y, x + r, y, r); p.lineTo(x + w - r, y); p.arcTo(x + w, y, x + w, y + r, r); p.lineTo(x + w, y + h); p.closePath(); };
    const tri = (p, x1, y1, x2, y2, x3, y3) => { p.moveTo(x1, y1); p.lineTo(x2, y2); p.lineTo(x3, y3); p.closePath(); };
    const make = {
      graveyard(rng) {
        const far = hills(rng, B - 110, 40, 1);
        const mid = new Path2D();
        for (let x = 10; x < W; x += rand(34, 52)) { if (rng() < 0.5) rr(mid, x, B - 34, 20, 34, 9); else { mid.rect(x + 7, B - 40, 6, 40); mid.rect(x, B - 30, 20, 6); } }
        const near = new Path2D();
        for (let x = 0; x < W; x += 14) { near.rect(x, B - 26, 4, 26); tri(near, x - 1, B - 26, x + 2, B - 32, x + 5, B - 26); }
        near.rect(0, B - 18, W, 3);
        return [far, mid, near];
      },
      church(rng) {
        const far = hills(rng, B - 100, 30, 1.5);
        const mid = new Path2D();
        mid.rect(170, B - 110, 120, 110); tri(mid, 165, B - 110, 230, B - 150, 295, B - 110);
        mid.rect(196, B - 200, 28, 90); tri(mid, 190, B - 200, 210, B - 250, 230, B - 200);
        mid.rect(30, B - 50, 50, 50); tri(mid, 25, B - 50, 55, B - 75, 85, B - 50);
        const near = new Path2D();
        for (let x = 0; x < W; x += 60) near.arc(x + 20, B - 8, 22, Math.PI, 0);
        return [far, mid, near];
      },
      countryside(rng) {
        const far = hills(rng, B - 120, 50, 0.8);
        const mid = new Path2D();
        mid.rect(40, B - 70, 80, 70); tri(mid, 32, B - 70, 80, B - 110, 128, B - 70);
        mid.rect(250, B - 140, 14, 140);
        for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.4; mid.moveTo(257, B - 140); mid.lineTo(257 + Math.cos(a) * 46, B - 140 + Math.sin(a) * 46); mid.lineTo(257 + Math.cos(a + 0.25) * 46, B - 140 + Math.sin(a + 0.25) * 46); mid.closePath(); }
        const near = new Path2D();
        for (let x = 0; x < W; x += 30) near.rect(x, B - 22, 5, 22);
        near.rect(0, B - 16, W, 3); near.rect(0, B - 8, W, 3);
        near.arc(180, B, 22, Math.PI, 0);
        return [far, mid, near];
      },
      school(rng) {
        const far = new Path2D();
        for (let x = 0; x < W; x += 40) far.rect(x, B - 60 - rng() * 50, 36, 120);
        const mid = new Path2D();
        mid.rect(90, B - 90, 180, 90); mid.rect(160, B - 150, 40, 60); tri(mid, 155, B - 150, 180, B - 180, 205, B - 150);
        const near = new Path2D();
        for (let x = 20; x < W; x += 110) { near.rect(x + 12, B - 30, 6, 30); near.arc(x + 15, B - 42, 20, 0, TAU); }
        return [far, mid, near];
      },
      city(rng) {
        const far = new Path2D();
        for (let x = 0; x < W; x += 24) far.rect(x, B - 120 - rng() * 140, 22, 300);
        const mid = new Path2D();
        for (let x = 0; x < W; x += 60) mid.rect(x, B - 70 - rng() * 120, 52, 300);
        const near = new Path2D();
        for (let x = 30; x < W; x += 120) { near.rect(x, B - 70, 4, 70); near.rect(x - 8, B - 74, 20, 6); }
        return [far, mid, near];
      },
      space(rng) {
        const far = new Path2D();
        for (let i = 0; i < 70; i++) { const x = rng() * W, y = rng() * (B - 20); far.moveTo(x + 1, y); far.arc(x, y, 0.6 + rng() * 1.1, 0, TAU); }
        const mid = new Path2D();
        mid.arc(250, 260, 46, 0, TAU);
        mid.arc(70, 400, 16, 0, TAU);
        const near = new Path2D();
        for (let i = 0; i < 9; i++) { const x = rng() * W, y = 300 + rng() * 200; near.moveTo(x + 5, y); near.arc(x, y, 3 + rng() * 5, 0, TAU); }
        return [far, mid, near];
      },
      void(rng) { // v0.6 placeholder Nebula Drift: soft mist ovals and cotton-candy cloud banks (ceiling + floor)
        const far = new Path2D();
        for (let i = 0; i < 6; i++) { const x = rng() * W, y = 80 + rng() * 360; far.moveTo(x + 60, y); far.ellipse(x, y, 60 + rng() * 40, 26 + rng() * 14, 0, 0, TAU); }
        const mid = new Path2D();
        for (let i = 0; i < 40; i++) { const x = rng() * W, y = rng() * (B - 30); mid.moveTo(x + 1.5, y); mid.arc(x, y, 0.8 + rng() * 1.2, 0, TAU); }
        const near = new Path2D();
        for (let x = 0; x <= W; x += 36) { near.moveTo(x + 30, 0); near.arc(x, 0, 30 + ((x * 7) % 11), 0, TAU); }
        return [far, mid, near];
      },
    };
    let seed = 7;
    for (const st of STAGES) LAYERS[st.id] = (make[st.id] || make.graveyard)(seeded(seed++));
  }
  buildLayers();

  // background stars for non-space stages
  const stars = [];
  for (let i = 0; i < CONFIG.ui.starCount; i++) stars.push({ x: Math.random() * W, y: Math.random() * (GROUND_Y - 200), r: 0.6 + Math.random() * 1.4, tw: Math.random() * TAU });

  function drawStageBackground(id) {
    frameStages.add(id);
    const look = CONFIG.looks[id];
    const BG = A.backgrounds;
    if (artBg(id)) { drawArtBackground(id); return; }
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, look.sky[0]); grad.addColorStop(1, look.sky[1]);
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
    if (id === 'space') {
      tileSheetX('starfield', game.dist * (sprites.sheets.starfield ? sprites.sheets.starfield.def.parallax : 0.1), 0);
      if (sprites.sheets.starfield) for (let y = 180; y < GROUND_Y; y += 180) { ctx.save(); ctx.translate(0, y); tileSheetX('starfield', game.dist * 0.1, 0); ctx.restore(); }
    } else {
      ctx.fillStyle = CONFIG.colors.star;
      for (const s of stars) { ctx.globalAlpha = 0.5 + 0.5 * Math.sin(game.time * 2 + s.tw); ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, TAU); ctx.fill(); }
      ctx.globalAlpha = 1;
    }
    // celestial
    const mx = W - 78, my = 96;
    if (look.celestial === 'none') { /* the Void: no moon */ }
    else if (look.celestial === 'planet') {
      ctx.fillStyle = 'rgba(160, 200, 255, 0.18)'; ctx.beginPath(); ctx.arc(mx, my, 50, 0, TAU); ctx.fill();
      ctx.fillStyle = '#9fd3ff'; ctx.beginPath(); ctx.arc(mx, my, 34, 0, TAU); ctx.fill();
      ctx.fillStyle = '#b8f0d2'; ctx.beginPath(); ctx.ellipse(mx - 8, my - 6, 14, 9, 0.4, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(mx + 12, my + 12, 9, 6, -0.3, 0, TAU); ctx.fill();
    } else {
      ctx.fillStyle = CONFIG.colors.moonGlow; ctx.beginPath(); ctx.arc(mx, my, 56, 0, TAU); ctx.fill();
      ctx.fillStyle = CONFIG.colors.moon; ctx.beginPath(); ctx.arc(mx, my, 36, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(200, 180, 150, 0.25)';
      ctx.beginPath(); ctx.arc(mx - 10, my - 8, 7, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(mx + 12, my + 10, 5, 0, TAU); ctx.fill();
    }
    // placeholder parallax silhouettes
    BG.layers.forEach((layer, i) => {
      const off = game.dist * BG.parallax[layer] * 0.7;
      const x0 = -((off % W) + W) % W;
      const path = LAYERS[id][i];
      ctx.fillStyle = look.layers[i];
      if (id === 'space') ctx.globalAlpha = [0.7, 0.35, 0.6][i];
      if (id === 'void') ctx.globalAlpha = [0.28, 0.8, 0.9][i];
      for (const x of [x0, x0 + W]) { ctx.save(); ctx.translate(x, 0); ctx.fill(path); ctx.restore(); }
      ctx.globalAlpha = 1;
      if (id === 'space' && i === 1) { // ring around the placeholder planet
        for (const x of [x0, x0 + W]) { ctx.strokeStyle = 'rgba(255, 207, 138, 0.45)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(x + 250, 260, 78, 16, -0.25, 0, TAU); ctx.stroke(); }
      }
      if (id === 'city' && i === 1) { // lit windows
        ctx.fillStyle = 'rgba(255, 235, 176, 0.35)';
        for (const x of [x0, x0 + W]) for (let bx = 6; bx < W; bx += 60) for (let wy = GROUND_Y - 60; wy > GROUND_Y - 150; wy -= 22) if (((bx * 7 + wy) % 3) === 0) ctx.fillRect(x + bx, wy, 8, 8);
      }
    });
  }

  const frameStages = new Set();
  function drawAmbientBack(id, alpha) {
    if (!effectsOn || alpha <= 0) return;
    frameStages.add(id + ':ambient');
    ctx.globalAlpha = alpha;
    if (id === 'graveyard' && ambCfg(id, 'fog')) {
      if (!tileSheetX('fogBack', game.dist * sprites.sheets.fogBack?.def.parallax, GROUND_Y - 120, alpha)) {
        ctx.fillStyle = `rgba(233, 226, 250, ${ambCfg(id, 'fog').alpha})`;
        for (const f of amb.fog.slice(0, 3)) { ctx.beginPath(); ctx.ellipse(f.x, f.y - 20, f.rx, f.ry, 0, 0, TAU); ctx.fill(); }
      }
    }
    if (id === 'church' && ambCfg(id, 'birds')) {
      for (const b of amb.birds) {
        ctx.globalAlpha = alpha * Math.max(0, b.alpha);
        if (b.state === 'perch') { if (!drawSheet('birdPerch', b.x - 12, b.y - 24, game.time, { mirror: b.mirror })) drawBirdShape(b, false); }
        else if (!drawSheet('birdFly', b.x - 12, b.y - 12, b.t, { mirror: b.mirror })) drawBirdShape(b, true);
      }
    }
    if (id === 'countryside' && ambCfg(id, 'fireflies')) {
      ctx.fillStyle = '#fff3b0';
      for (const f of amb.fireflies) { ctx.globalAlpha = alpha * (0.3 + 0.7 * Math.max(0, Math.sin(f.ph * 3))); ctx.beginPath(); ctx.arc(f.x, f.y, 2, 0, TAU); ctx.fill(); }
    }
    if (id === 'school' && ambCfg(id, 'bikes')) {
      const Bk = ambCfg(id, 'bikes');
      const off = (game.dist * Bk.speedFactor) % Bk.spacing;
      let i = Math.floor((game.dist * Bk.speedFactor) / Bk.spacing);
      for (let x = -off; x < W + 80; x += Bk.spacing, i++) {
        const name = i % 2 ? 'bikePink' : 'bikeMint';
        if (!drawSheet(name, x, GROUND_Y - 46, 0)) drawBikeShape(x, i % 2);
      }
    }
    if (id === 'void') {
      const Mi = ambCfg(id, 'mist'), mc = CONFIG.looks.void.mist;
      if (Mi) for (const f of amb.vmist) { ctx.globalAlpha = alpha * Mi.alpha; ctx.fillStyle = mc[f.c % mc.length]; ctx.beginPath(); ctx.ellipse(f.x, f.y, f.rx, f.ry, 0, 0, TAU); ctx.fill(); }
      if (ambCfg(id, 'sparkles')) { ctx.fillStyle = CONFIG.colors.vCream; for (const p of amb.vsp) { ctx.globalAlpha = alpha * (0.25 + 0.75 * Math.max(0, Math.sin(game.time * 2.2 + p.ph))); drawStar5(p.x, p.y, 2.4 * p.k, p.ph); } }
      ctx.globalAlpha = alpha;
    }
    if (id === 'space' && ambCfg(id, 'stars')) {
      for (const st of amb.stars) { if (!drawSheet('star', st.x - 8, st.y - 8, game.time, { phase: st.ph })) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(st.x, st.y, 1.2 * st.k, 0, TAU); ctx.fill(); } }
      ctx.strokeStyle = '#fff3b0'; ctx.lineWidth = 2;
      for (const s of amb.shooting) { ctx.globalAlpha = alpha * Math.max(0, s.life / 0.8); ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x + 34, s.y - 15); ctx.stroke(); }
    }
    ctx.globalAlpha = 1;
  }
  function drawAmbientFront(id, alpha) {
    if (!effectsOn || alpha <= 0) return;
    frameStages.add(id + ':ambient');
    ctx.globalAlpha = alpha;
    if (id === 'graveyard' && ambCfg(id, 'fog')) {
      if (!tileSheetX('fogFront', game.dist * (sprites.sheets.fogFront ? sprites.sheets.fogFront.def.parallax : 0.6), GROUND_Y - 80 + 20, alpha)) {
        ctx.fillStyle = `rgba(246, 242, 255, ${ambCfg(id, 'fog').alpha})`;
        for (const f of amb.fog.slice(3)) { ctx.beginPath(); ctx.ellipse(f.x, f.y, f.rx, f.ry, 0, 0, TAU); ctx.fill(); }
      }
    }
    if (id === 'city' && ambCfg(id, 'rain')) {
      const R = ambCfg(id, 'rain'); // v0.3.1: one batched path of short strokes (cheap), count capped in CONFIG
      ctx.strokeStyle = R.color; ctx.lineWidth = R.width; ctx.beginPath();
      for (const d of amb.rain) { ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - d.len * 0.25, d.y + d.len); }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  function drawBirdShape(b, flying) {
    ctx.strokeStyle = '#2a2240'; ctx.lineWidth = 2; ctx.beginPath();
    const w = flying ? Math.sin(b.t * 20) * 5 : 1;
    ctx.moveTo(b.x - 6, b.y - 4 - w); ctx.quadraticCurveTo(b.x - 2, b.y - 4, b.x, b.y - 2); ctx.quadraticCurveTo(b.x + 2, b.y - 4, b.x + 6, b.y - 4 - w); ctx.stroke();
  }
  function drawBikeShape(x, pink) {
    ctx.strokeStyle = pink ? '#ffc9da' : '#b8f0d2'; ctx.lineWidth = 2.5;
    const y = GROUND_Y - 12;
    ctx.beginPath(); ctx.arc(x + 14, y, 11, 0, TAU); ctx.arc(x + 58, y, 11, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 14, y); ctx.lineTo(x + 30, y - 18); ctx.lineTo(x + 50, y - 18); ctx.lineTo(x + 58, y); ctx.moveTo(x + 30, y - 18); ctx.lineTo(x + 36, y); ctx.lineTo(x + 50, y - 18); ctx.stroke();
  }

  function drawGround(id) {
    frameStages.add(id + ':ground');
    const look = CONFIG.looks[id];
    if (id === 'void') { // v0.6 (Art §14.2): no solid band; a soft translucent mist floor so the death line still reads
      const gr = ctx.createLinearGradient(0, GROUND_Y, 0, H);
      gr.addColorStop(0, 'rgba(243, 234, 255, 0.30)'); gr.addColorStop(1, 'rgba(217, 198, 245, 0.08)');
      ctx.fillStyle = gr; ctx.fillRect(0, GROUND_Y, W, CONFIG.world.groundHeight);
      ctx.fillStyle = 'rgba(243, 234, 255, 0.45)';
      const o2 = (game.dist * 0.5) % 30;
      for (let x = -o2; x < W + 30; x += 30) { ctx.beginPath(); ctx.arc(x + 15, GROUND_Y + 2, 6, Math.PI, 0); ctx.fill(); }
      if (!artBg(id)) { ctx.fillStyle = look.cloud; for (let x = -o2 * 2; x < W + 60; x += 44) { ctx.beginPath(); ctx.arc(x, H - 6, 34, 0, TAU); ctx.fill(); } }
      return;
    }
    ctx.fillStyle = look.ground; ctx.fillRect(0, GROUND_Y, W, CONFIG.world.groundHeight);
    ctx.fillStyle = look.groundTop; ctx.fillRect(0, GROUND_Y, W, 8);
    const off = game.dist % 40;
    if (id === 'space') {
      ctx.fillStyle = 'rgba(30, 25, 50, 0.35)';
      for (let x = -off; x < W + 40; x += 40) { ctx.beginPath(); ctx.ellipse(x + 12, GROUND_Y + 30 + (x % 3) * 8, 10, 4, 0, 0, TAU); ctx.fill(); }
    } else {
      for (let x = -off; x < W + 40; x += 40) { ctx.beginPath(); ctx.moveTo(x, GROUND_Y + 8); ctx.lineTo(x + 6, GROUND_Y + 18); ctx.lineTo(x + 12, GROUND_Y + 8); ctx.fill(); }
    }
  }

  // ---- Columns -----------------------------------------------------------------------------
  function drawSpriteColumn(p, side) {
    const col = side === 'top' ? p.top : p.bottom;
    const t = col.set, C = A.columns, L = spriteLayout(p, col, side), res = sprites.res;
    const w = C.spriteWidth * L.k, bodyH = C.bodyHeight * L.k;
    const fillBody = (originY, y0, y1) => {
      if (y1 <= y0) return;
      if (t.bodyPattern && t.bodyPattern.setTransform) {
        t.bodyPattern.setTransform(new DOMMatrix().translate(L.sx, originY).scale(L.k / res));
        ctx.fillStyle = t.bodyPattern; ctx.fillRect(L.sx, y0, w, y1 - y0);
      } else {
        const m2 = ctx.getTransform(), sn = y => (Math.round(y * m2.d + m2.f) - m2.f) / m2.d; // integer device-px tiles, no fractional seams
        // QA R1 (v0.4.1): clip to the body range so whole 64 px tiles never draw under/through the cap
        ctx.save(); ctx.beginPath(); ctx.rect(L.sx, y0, w, y1 - y0); ctx.clip();
        for (let y = originY + Math.floor((y0 - originY) / bodyH) * bodyH; y < y1; y += bodyH) { const a = sn(y), b = sn(y + bodyH); ctx.drawImage(t.body, L.sx, a, w, b - a + 1 / m2.d); }
        ctx.restore();
        game.stats.bodyFallbackDraws = (game.stats.bodyFallbackDraws || 0) + 1;
      }
    };
    // QA seam fix: snap the cap's edges to whole device pixels and run the body 1 device px under the cap,
    // so no half-covered row lets the background through at the cap/body joint.
    const m = ctx.getTransform(), dpx = 1 / m.d, snap = y => (Math.round(y * m.d + m.f) - m.f) / m.d;
    const c0 = snap(L.capY), c1 = snap(L.capY + L.capH);
    if (side === 'bottom') { fillBody(c1, c1 - dpx, GROUND_Y + 4); ctx.drawImage(t.capTop, L.sx, c0, w, c1 - c0); }
    else { fillBody(c0, 0, c0 + dpx); ctx.drawImage(t.capBottom, L.sx, c0, w, c1 - c0); }
  }
  const SHAPE_COLORS = {
    stand: ['placeholder', 'tombOutline'], hang: ['placeholder', 'tombOutline'],
    tomb: ['tomb', 'tombOutline'], coffin: ['coffin', 'coffinOutline'], cross: ['cross', 'tombOutline'],
    asteroid: ['asteroid', 'asteroidShade'], satellite: ['satellite', 'tombOutline'], ufo: ['ufo', 'tombOutline'],
  };
  function drawShapeColumn(p, side) {
    const col = side === 'top' ? p.top : p.bottom;
    const hb = columnHitboxes(p, side);
    const [fill, line] = SHAPE_COLORS[col.shape] || SHAPE_COLORS.tomb;
    ctx.fillStyle = CONFIG.colors[fill]; ctx.strokeStyle = CONFIG.colors[line]; ctx.lineWidth = 2.5;
    for (const [x, y, w, h] of hb.rects) { ctx.fillRect(x, y, w, h); ctx.strokeRect(x, y, w, h); }
    for (const [x, y, r] of hb.circles) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.stroke(); }
    // little details
    const gapEdge = side === 'top' ? p.centre - p.gap / 2 : p.centre + p.gap / 2, dir = side === 'top' ? -1 : 1;
    if (col.shape === 'satellite') { ctx.fillStyle = CONFIG.colors.panel; ctx.fillRect(p.x + 1, gapEdge + dir * 6 - (dir < 0 ? 16 : 0), 14, 16); ctx.fillRect(p.x + 49, gapEdge + dir * 6 - (dir < 0 ? 16 : 0), 14, 16); }
    if (col.shape === 'ufo') { ctx.fillStyle = CONFIG.colors.ufoDome; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(p.x + 10 + i * 15, gapEdge + dir * 8, 3, 0, TAU); ctx.fill(); } }
    if (col.shape === 'asteroid' || col.shape === 'tomb') { ctx.fillStyle = CONFIG.colors[col.shape === 'tomb' ? 'tombShade' : 'asteroidShade']; ctx.beginPath(); ctx.arc(p.x + 22, gapEdge + dir * 28, 6, 0, TAU); ctx.arc(p.x + 44, gapEdge + dir * 50, 4, 0, TAU); ctx.fill(); }
  }
  function drawColumns() {
    for (const p of game.cols) {
      for (const side of ['top', 'bottom']) {
        const col = side === 'top' ? p.top : p.bottom;
        if (p.smashed) continue; // Rush: burst into candy
        if (col.set) drawSpriteColumn(p, side); else drawShapeColumn(p, side);
      }
    }
  }

  // ---- Hazards / pickups / events --------------------------------------------------------------
  function drawHazards() {
    for (const h of game.hazards) {
      if (h.smashed) continue;
      const y = hazardY(h, worldNow()), sh = sprites.sheets[h.type];
      if (sh) {
        const j = sh.json, cx = j.cx != null ? j.cx : sh.def.w / 2, cy = j.cy != null ? j.cy : sh.def.h / 2;
        if (h.cfg.spin) { ctx.save(); ctx.translate(h.x, y); ctx.rotate(game.time * (h.cfg.spinSpeed || 1.5) + h.phase); drawSheet(h.type, -cx, -cy, game.time, { phase: h.phase }); ctx.restore(); }
        else drawSheet(h.type, h.x - cx, y - cy, game.time, { phase: h.phase });
        continue;
      }
      const r = h.r, x = h.x, c = CONFIG.colors;
      ctx.save(); ctx.translate(x, y);
      switch (h.type) {
        case 'bat': {
          const wf = Math.sin(game.time * 18 + h.phase) * 6;
          ctx.fillStyle = c.bat; ctx.beginPath(); ctx.moveTo(-r * 2, -wf); ctx.quadraticCurveTo(-r, -r, 0, 0); ctx.quadraticCurveTo(r, -r, r * 2, -wf); ctx.quadraticCurveTo(r, r * 0.4, 0, r * 0.5); ctx.quadraticCurveTo(-r, r * 0.4, -r * 2, -wf); ctx.fill();
          ctx.beginPath(); ctx.arc(0, 0, r * 0.8, 0, TAU); ctx.fill();
          ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-4, -2, 2.2, 0, TAU); ctx.arc(4, -2, 2.2, 0, TAU); ctx.fill(); break;
        }
        case 'pumpkin':
          ctx.fillStyle = c.pumpkin; ctx.beginPath(); ctx.ellipse(0, 0, r * 1.15, r, 0, 0, TAU); ctx.fill();
          ctx.fillStyle = c.pumpkinStem; ctx.fillRect(-2, -r - 5, 4, 7);
          ctx.fillStyle = '#5a3a3a'; ctx.beginPath(); ctx.arc(-5, -2, 2, 0, TAU); ctx.arc(5, -2, 2, 0, TAU); ctx.fill(); break;
        case 'skull':
          ctx.fillStyle = c.skull; ctx.beginPath(); ctx.arc(0, -2, r, 0, TAU); ctx.fill(); ctx.fillRect(-r * 0.6, 4, r * 1.2, 8);
          ctx.fillStyle = '#4a3358'; ctx.beginPath(); ctx.arc(-5, -2, 3.5, 0, TAU); ctx.arc(5, -2, 3.5, 0, TAU); ctx.fill(); break;
        case 'miniAsteroid':
          ctx.rotate(game.time * 1.5 + h.phase); ctx.fillStyle = c.asteroid; ctx.beginPath();
          for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, rr = r * (0.8 + ((i * 37) % 5) / 20); ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
          ctx.closePath(); ctx.fill(); ctx.fillStyle = c.asteroidShade; ctx.beginPath(); ctx.arc(3, -2, 3, 0, TAU); ctx.fill(); break;
        case 'void-float-a': // cassette
          ctx.rotate(Math.sin(game.time * 1.3 + h.phase) * 0.25);
          ctx.fillStyle = c.vPink; roundRect(-r * 1.2, -r * 0.8, r * 2.4, r * 1.6, 4); ctx.fill();
          ctx.fillStyle = c.vCream; roundRect(-r * 0.85, -r * 0.5, r * 1.7, r * 0.75, 3); ctx.fill();
          ctx.fillStyle = c.vInk; ctx.beginPath(); ctx.arc(-r * 0.42, -r * 0.12, 2.6, 0, TAU); ctx.arc(r * 0.42, -r * 0.12, 2.6, 0, TAU); ctx.fill(); break;
        case 'void-float-b': // alarm clock
          ctx.fillStyle = c.vPink; ctx.beginPath(); ctx.arc(-r * 0.62, -r * 0.78, r * 0.38, 0, TAU); ctx.arc(r * 0.62, -r * 0.78, r * 0.38, 0, TAU); ctx.fill();
          ctx.fillStyle = c.vCream; ctx.strokeStyle = c.vLilac; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill(); ctx.stroke();
          ctx.strokeStyle = c.vInk; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -r * 0.6); ctx.moveTo(0, 0); ctx.lineTo(r * 0.45, 0); ctx.stroke(); break;
        case 'void-float-c': // rotary phone
          ctx.fillStyle = c.vMint; roundRect(-r * 1.1, -r * 0.4, r * 2.2, r * 1.3, 5); ctx.fill();
          ctx.fillStyle = c.vMint; roundRect(-r * 1.25, -r * 0.95, r * 2.5, r * 0.5, 4); ctx.fill();
          ctx.fillStyle = c.vCream; ctx.beginPath(); ctx.arc(0, r * 0.25, r * 0.5, 0, TAU); ctx.fill();
          ctx.fillStyle = c.vInk; ctx.beginPath(); ctx.arc(0, r * 0.25, 2, 0, TAU); ctx.fill(); break;
        case 'void-float-d': // floppy disk
          ctx.rotate(Math.sin(game.time * 1.1 + h.phase) * 0.2);
          ctx.fillStyle = c.vBlue; roundRect(-r, -r, r * 2, r * 2, 3); ctx.fill();
          ctx.fillStyle = c.vCream; ctx.fillRect(-r * 0.55, -r, r * 1.1, r * 0.7); ctx.fillStyle = c.vInk; ctx.fillRect(r * 0.15, -r * 0.9, r * 0.25, r * 0.5);
          ctx.fillStyle = c.vCream; ctx.fillRect(-r * 0.7, r * 0.1, r * 1.4, r * 0.8); break;
        case 'alien':
          ctx.fillStyle = c.alien; ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.9, 0, 0, TAU); ctx.fill();
          ctx.strokeStyle = c.alien; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-5, -r + 2); ctx.lineTo(-8, -r - 6); ctx.moveTo(5, -r + 2); ctx.lineTo(8, -r - 6); ctx.stroke();
          ctx.fillStyle = '#2b1d3d'; ctx.beginPath(); ctx.ellipse(0, -1, 5, 6, 0, 0, TAU); ctx.fill(); break;
      }
      ctx.restore();
    }
  }
  function drawStrip(key, frames, fps, t, x, y, w, h, once) { // logical-px draw of a horizontal strip; false if not loaded
    const img = sprites.specials[key]; if (!img) return false;
    const n = Math.max(1, frames), fr = Math.floor(t * fps), f = once ? Math.min(n - 1, fr) : fr % n, fw = img.width / n;
    ctx.drawImage(img, f * fw, 0, fw, img.height, x, y, w, h); return true;
  }
  function drawPickups() { // v1.9 specials: Art token strips, placeholder orb otherwise
    const SA = CONFIG.specials.art, PK = SA.pickup;
    for (const p of game.cols) {
      if (!p.pickup || p.pickup.taken) continue;
      const x = p.x + p.pickup.dx, y = p.pickup.y, type = p.pickup.type || 'rush', sz = PK.size;
      if (drawStrip('pickup-' + type, PK.frames, PK.fps, game.time, x - sz / 2, y - sz / 2, sz, sz)) continue;
      const c = SA.placeholder[type];
      ctx.globalAlpha = 0.3; ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, sz * 0.5 + Math.sin(game.time * 5) * 2, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
      ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y + Math.sin(game.time * 4) * 2, CONFIG.specials.radius, 0, TAU); ctx.fill();
    }
  }
  function drawSpecialFx() { // candy bursts (world), heart pop/break + frost burst (on the ghost)
    const SA = CONFIG.specials.art, G = CONFIG.ghost, k = G.size / 64;
    for (const f of game.sp.fx) {
      const A2 = SA[f.name], cx = f.follow ? G.x + game.sp.shift : f.x, cy = f.follow ? game.ghost.y : f.y;
      const w = A2.w * (f.follow ? k : 1), h = A2.h * (f.follow ? k : 1);
      if (drawStrip(f.name, A2.frames, A2.fps, f.t, cx - w / 2, cy - h / 2, w, h, true)) continue;
      const u = f.t / 0.5, col = f.name === 'candyBurst' ? SA.placeholder.rush : f.name === 'frostBurst' ? SA.placeholder.slowMo : SA.placeholder.extraLife;
      ctx.globalAlpha = 1 - u; ctx.fillStyle = col;
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * 40 * u, cy + Math.sin(a) * 40 * u, 5, 0, TAU); ctx.fill(); }
      ctx.globalAlpha = 1;
    }
  }
  function drawFrost() { // Chill: #BFE6FF tint + Art vignette fading with sp.frostA; falling flakes
    const sp = game.sp, M = CONFIG.specials.slowMo, SA = CONFIG.specials.art;
    if (sp.frostA <= 0 && !sp.flakes.length) return;
    if (sp.frostA > 0) {
      ctx.globalAlpha = M.tintAlpha * sp.frostA; ctx.fillStyle = M.tint; ctx.fillRect(0, 0, W, H);
      const v = sprites.specials.frostVignette; ctx.globalAlpha = sp.frostA;
      if (v) ctx.drawImage(v, 0, 0, W, H);
      else { const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.62); g.addColorStop(0, 'rgba(191,230,255,0)'); g.addColorStop(1, 'rgba(230,246,255,0.55)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
      ctx.globalAlpha = 1;
    }
    const fs = SA.flakeSize;
    for (const f of sp.flakes) {
      const img = sprites.specials['flake-' + f.k], x = f.x + Math.sin(f.y / 30 + f.ph) * M.flakes.sway;
      ctx.save(); ctx.translate(x, f.y); ctx.rotate(f.rot * Math.PI / 180); ctx.globalAlpha = Math.max(0.3, sp.frostA);
      if (img) ctx.drawImage(img, -fs / 2, -fs / 2, fs, fs); else { ctx.fillStyle = '#E6F6FF'; ctx.fillRect(-2, -2, 4, 4); }
      ctx.restore();
    }
  }
  function drawSpecialHud() { // one icon per active type with a timer ring (life: held marker)
    const SPc = CONFIG.specials, SA = SPc.art, sp = game.sp, sz = SA.hud.size;
    const items = [];
    if (game.goldenModeT > 0) items.push(['rush', game.goldenModeT / SPc.rush.seconds]);
    if (sp.slowT > 0) items.push(['slowMo', sp.slowT / SPc.slowMo.seconds]);
    if (sp.lifeHeld > 0) items.push(['extraLife', null]);
    game.stats.hud = items.map(i => [i[0], i[1] == null ? null : +i[1].toFixed(3)]);
    items.forEach(([type, f], i) => {
      const cx = W / 2 - (items.length - 1) * 20 + i * 40, cy = 112, r = sz / 2 + 3;
      ctx.fillStyle = 'rgba(30,20,51,0.6)'; ctx.beginPath(); ctx.arc(cx, cy, r + 2, 0, TAU); ctx.fill();
      if (f != null) { ctx.strokeStyle = SA.placeholder[type]; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, f)); ctx.stroke(); }
      const img = sprites.specials['hud-' + type];
      if (img) ctx.drawImage(img, cx - sz / 2, cy - sz / 2, sz, sz);
      else { ctx.fillStyle = SA.placeholder[type]; ctx.beginPath(); ctx.arc(cx, cy, sz / 2 - 3, 0, TAU); ctx.fill(); }
    });
  }
  function drawEvent() {
    const ev = game.event;
    if (!ev) return;
    const handler = EVENTS[ev.id];
    if (ev.phase === 'warning') {
      const lane = handler.lane(ev);
      const on = Math.floor(ev.t * 8) % 2 === 0;
      if (!drawSheet((ev.def.warningSheet && sprites.sheets[ev.def.warningSheet]) ? ev.def.warningSheet : 'warning', W - 46, lane.y - 20, ev.t)) {
        if (on) { ctx.fillStyle = CONFIG.colors.warning; ctx.beginPath(); ctx.moveTo(W - 26, lane.y - 20); ctx.lineTo(W - 6, lane.y + 16); ctx.lineTo(W - 46, lane.y + 16); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#2b1d3d'; ctx.fillRect(W - 28, lane.y - 8, 4, 14); ctx.fillRect(W - 28, lane.y + 9, 4, 4); }
      }
      text(lane.label, W - 100, lane.y - 34, 18, { color: CONFIG.colors.warning });
    }
    if (ev.phase === 'active' && ev.id === 'meteorShower') {
      const h = EVENTS.meteorShower, d = ev.def;
      // telegraph each wave's clear lane at the right edge until it passes
      ev.data.lanes.forEach((ly, w) => {
        if (ev.t > d.waveCrossAt[w]) return;
        const a = 0.25 + 0.2 * Math.sin(ev.t * 10);
        ctx.fillStyle = `rgba(184, 240, 210, ${a})`; roundRect(W - 14, ly - d.laneHeight / 2 + 6, 8, d.laneHeight - 12, 4); ctx.fill();
      });
      const sh = sprites.sheets.meteor;
      for (const m of ev.data.meteors) {
        if (m.gone) continue;
        const p = h.pos(ev, m);
        if (p.x > W + 80 || p.y < -60) continue;
        if (sh) { const j = sh.json; drawSheet('meteor', p.x - (j.cx != null ? j.cx : 18), p.y - (j.cy != null ? j.cy : 32), ev.t, { phase: m.yc * 0.01 }); }
        else {
          ctx.strokeStyle = 'rgba(255, 201, 218, 0.7)'; ctx.lineWidth = 6; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + 40, p.y - 20); ctx.stroke(); ctx.lineCap = 'butt';
          ctx.fillStyle = '#ffcf9a'; ctx.beginPath(); ctx.arc(p.x, p.y, m.r, 0, TAU); ctx.fill();
        }
      }
    }
    if (ev.phase === 'active' && ev.id === 'invaderWave') { // v0.6: lane telegraph + pixel invaders (Art sprite if it lands)
      const h = EVENTS.invaderWave, d = ev.def;
      ev.data.lanes.forEach((ly, w) => {
        if (ev.t > d.waveCrossAt[w]) return;
        const a = 0.25 + 0.2 * Math.sin(ev.t * 10);
        ctx.fillStyle = `rgba(174, 227, 198, ${a})`; roundRect(W - 14, ly - d.laneHeight / 2 + 6, 8, d.laneHeight - 12, 4); ctx.fill();
      });
      const frame = Math.floor(ev.t * 4) % 2;
      for (const m of ev.data.inv) {
        if (m.gone) continue;
        const p = h.pos(ev, m), row = ev.data.rows[m.wave] || 0, key = d.rowSheets[row], sh = sprites.sheets[key];
        if (p.x > W + 40) continue;
        if (sh) { const j = sh.json; drawSheet(key, p.x - (j.cx != null ? j.cx : 20), p.y - (j.cy != null ? j.cy : 20), ev.t, { phase: m.wave * 0.125 }); continue; }
        drawInvader(p.x, p.y, m.r, frame, d.rowColors[row]);
      }
      for (const q of ev.data.pops) {
        const f = Math.min(5, Math.floor(q.t * 12));
        if (!drawSheet('invaderPop', q.x - 32, q.y - 32, 0, { frame: f })) { ctx.globalAlpha = 1 - q.t / d.popSeconds; ctx.fillStyle = CONFIG.colors.sparkle; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; ctx.fillRect(q.x + Math.cos(a) * 30 * q.t / d.popSeconds - 2, q.y + Math.sin(a) * 30 * q.t / d.popSeconds - 2, 4, 4); } ctx.globalAlpha = 1; }
      }
    }
    if (ev.phase === 'active' && ev.id === 'hearse') {
      const d = ev.data, top = GROUND_Y - d.h;
      if (d.sprite) { drawSheet('hearse', d.x, top, ev.t); return; }
      const c = CONFIG.colors;
      ctx.fillStyle = c.hearse; ctx.beginPath(); ctx.moveTo(d.x + 4, GROUND_Y - 10); ctx.lineTo(d.x + 4, top + 24); ctx.lineTo(d.x + 34, top + 4); ctx.lineTo(d.x + d.w - 8, top + 4); ctx.lineTo(d.x + d.w - 2, GROUND_Y - 10); ctx.closePath(); ctx.fill();
      ctx.fillStyle = c.hearseTrim; ctx.fillRect(d.x + 40, top + 12, 40, 16); ctx.fillRect(d.x + 88, top + 12, 50, 16); ctx.fillRect(d.x + 4, top + 34, d.w - 6, 4);
      ctx.fillStyle = '#1b1528'; for (const wx of [d.x + 30, d.x + d.w - 30]) { ctx.beginPath(); ctx.arc(wx, GROUND_Y - 8, 11, 0, TAU); ctx.fill(); }
    }
  }
  const INVADER = ['00100000100', '00010001000', '00111111100', '01101110110', '11111111111', '10111111101', '10100000101', '00011011000'];
  const INVADER_B = ['00100000100', '10010001001', '10111111101', '11101110111', '11111111111', '01111111110', '00100000100', '01000000010'];
  const invaderPaths = [INVADER, INVADER_B].map(rows => { const p = new Path2D(); rows.forEach((r, y) => [...r].forEach((b, x) => { if (b === '1') p.rect(x, y, 1, 1); })); return p; });
  function drawInvader(x, y, r, frame, color) { // 11x8 pixel invader scaled to the hitbox diameter (placeholder)
    const k = (r * 2) / 11;
    ctx.save(); ctx.translate(x - 5.5 * k, y - 4 * k); ctx.scale(k, k);
    ctx.fillStyle = color || CONFIG.colors.invader; ctx.fill(invaderPaths[frame]);
    ctx.fillStyle = CONFIG.colors.invaderEye; ctx.fillRect(3, 3, 1, 1); ctx.fillRect(7, 3, 1, 1);
    ctx.restore();
  }
  function drawFloatGlows() { // space has no ground art: soft glow under the floating tomb-a
    if (stage().id !== 'space') return;
    for (const p of game.cols) {
      if (p.bottom.id !== 'tomb-a') continue;
      const cx = p.x + CONFIG.tombstones.width / 2;
      const g = ctx.createRadialGradient(cx, GROUND_Y + 2, 2, cx, GROUND_Y + 2, 46);
      g.addColorStop(0, 'rgba(201, 182, 240, 0.55)'); g.addColorStop(1, 'rgba(201, 182, 240, 0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, GROUND_Y + 2, 46, 12, 0, 0, TAU); ctx.fill();
    }
  }
  function drawLaunchScene() {
    const c = game.cutscene, L = CONFIG.launch, lay = launchLayout(c), T = lay.T;
    ctx.save();
    if (lay.shake) ctx.translate(rand(-lay.shake, lay.shake), rand(-lay.shake, lay.shake));
    // 1. outgoing city, sliding down as the sky pans
    ctx.save(); ctx.translate(0, lay.s >= T.climb ? lay.shift : 0);
    drawStageBackground(c.from); if (lay.skyAlpha < 1) drawAmbientFront(c.from, 1 - lay.skyAlpha);
    ctx.restore();
    // 2. launch sky window (bottom -> top)
    if (lay.skyAlpha > 0) {
      ctx.globalAlpha = lay.skyAlpha;
      const sky = sprites.sheets.launchSky && getLayer('launchSky'), m = ctx.getTransform();
      if (sky) { // cached at reduced resolution: source rect in cache px, upscaled to the screen
        const q = sky.img.height / sky.dh, sy = lay.skyTop * m.d * q, sh = Math.min(sky.img.height - sy, H * m.d * q);
        ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = lay.skyAlpha;
        ctx.drawImage(sky.img, 0, sy, sky.img.width, sh, Math.round(m.e), Math.round(m.f), sky.dw, Math.round(sh / q));
        ctx.restore();
      } else if (sprites.sheets.launchSky) { ctx.globalAlpha = lay.skyAlpha; const r = sprites.sheets.launchSky.img.height / 1920; ctx.drawImage(sprites.sheets.launchSky.img, 0, lay.skyTop * r, W * r, H * r, 0, 0, W, H); }
      else {
        const k = 1 - lay.skyTop / L.skyPan[0], a = CONFIG.looks[c.from].sky, b = CONFIG.looks.space.sky;
        const gr = ctx.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, k > 0.5 ? b[0] : a[0]); gr.addColorStop(1, k > 0.5 ? b[1] : a[1]);
        ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
      }
      ctx.globalAlpha = 1;
    }
    // 3. ground + pad (slide down with the city)
    ctx.save(); ctx.translate(0, lay.s >= T.climb ? lay.shift : 0); drawGround(c.from); ctx.restore();
    if (!drawSheet('launchpad', lay.padX, lay.padY, 0)) {
      ctx.fillStyle = '#ffc9da'; ctx.fillRect(lay.padX + 20, lay.padY + 112, 160, 28);
      ctx.fillStyle = '#fff3b0'; ctx.fillRect(lay.padX + 150, lay.padY + 10, 12, 102); ctx.fillRect(lay.padX + 110, lay.padY + 40, 44, 6);
    }
    // 4. clouds rushing down during the climb
    if (lay.s >= T.climb && lay.s < T.arrive + 0.3) {
      for (const cl of c.clouds) {
        const start = T.climb + cl.at * (T.arrive - T.climb) * 0.8, y = -64 + cl.v * (lay.s - start);
        if (lay.s < start || y > H) continue;
        if (!drawSheet(cl.kind, cl.x, y, 0)) { ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.ellipse(cl.x + 80, y + 32, 70, 22, 0, 0, TAU); ctx.fill(); }
      }
    }
    // 5. space layers fade in on arrival
    if (lay.spaceAlpha > 0) { ctx.save(); ctx.globalAlpha = lay.spaceAlpha; drawStageBackground('space'); drawGround('space'); ctx.restore(); }
    // 6. smoke, flame, rocket
    const SM = L.smoke, smoke = sprites.sheets.smoke;
    for (const p of c.smoke) {
      const k = p.t / SM.life, sc = lerp(0.6, 1.4, k);
      ctx.globalAlpha = 1 - k;
      if (smoke) { ctx.save(); ctx.translate(p.x, p.y); ctx.scale(sc, sc); drawSheet('smoke', -32, -32, 0, { frame: Math.min(2, Math.floor(k * 3)) }); ctx.restore(); }
      else { ctx.fillStyle = '#efe8ff'; ctx.beginPath(); ctx.arc(p.x, p.y, 18 * sc, 0, TAU); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
    if (lay.ry > -160) {
      if (lay.flame) {
        const fx = lay.rx + 24, fy = lay.ry + 144;
        const ok = lay.flame === 'ignite' ? drawSheet('flame', fx, fy, 0, { frame: 2 }) : drawSheet('flame', fx, fy, c.t);
        if (!ok) { ctx.fillStyle = CONFIG.colors.flame; ctx.beginPath(); ctx.moveTo(fx + 8, fy); ctx.quadraticCurveTo(fx + 24, fy + (lay.flame === 'ignite' ? 30 : 70) + Math.sin(game.time * 40) * 8, fx + 40, fy); ctx.fill(); }
      }
      if (!drawSheet(lay.thrust ? 'rocketThrust' : 'rocketIdle', lay.rx, lay.ry, c.t)) {
        const col = CONFIG.colors, x = lay.rx + 48, y = lay.ry;
        ctx.fillStyle = col.rocketTrim; ctx.beginPath(); ctx.moveTo(x - 24, y + 110); ctx.lineTo(x - 44, y + 144); ctx.lineTo(x - 20, y + 138); ctx.fill(); ctx.beginPath(); ctx.moveTo(x + 24, y + 110); ctx.lineTo(x + 44, y + 144); ctx.lineTo(x + 20, y + 138); ctx.fill();
        ctx.fillStyle = col.rocket; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 34, y + 40, x + 26, y + 144); ctx.lineTo(x - 26, y + 144); ctx.quadraticCurveTo(x - 34, y + 40, x, y); ctx.fill();
        ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(x, y + 66, 13, 0, TAU); ctx.fill();
      }
    }
    ctx.restore();
    drawParticles();
    drawGhost();
    drawFloatTexts();
    drawHUD();
  }
  // v0.6 warp: space -> The Void. Stars stretch into streaks, then Art's mist overlay plays once (the bg layers
  // switch to the void trans tiles under the thickest frame); placeholder mist puffs if the strip is missing.
  let mistBuf = null, mistGain = null;
  function mistGains(img) { // v0.6.1: per-frame gain so mean mist luminance (alpha x luma) follows a smoothed curve
    const M = WARP.mist, n = M.frames, g = new Array(n).fill(1);
    if (!M.normalise) return g;
    try {
      const sw = 24, sh = 42, c = document.createElement('canvas'); c.width = sw * n; c.height = sh;
      const x = c.getContext('2d'); x.drawImage(img, 0, 0, sw * n, sh);
      const d = x.getImageData(0, 0, sw * n, sh).data, L = new Array(n).fill(0);
      for (let y = 0; y < sh; y++) for (let i = 0; i < sw * n; i++) { const o = (y * sw * n + i) * 4; L[Math.floor(i / sw)] += d[o + 3] / 255 * (0.299 * d[o] + 0.587 * d[o + 1] + 0.114 * d[o + 2]); }
      for (let f = 0; f < n; f++) L[f] /= sw * sh;
      for (let f = 0; f < n; f++) { const sm = (L[Math.max(0, f - 1)] + 2 * L[f] + L[Math.min(n - 1, f + 1)]) / 4; g[f] = L[f] > 1 ? Math.min(1, sm / L[f]) : 1; }
      game.stats.mistLum = L.map(v => +v.toFixed(1)); game.stats.mistGain = g.map(v => +v.toFixed(3));
    } catch (e) { /* tainted: no normalisation */ }
    return g;
  }
  function drawMistBlend(img, phi, veilA) { // crossfade frame f -> f+1 (premultiplied: copy + lighter), then one upscaled blit
    const M = WARP.mist, n = M.frames, fw = img.width / n, fh = img.height;
    if (!mistGain) mistGain = mistGains(img);
    if (!mistBuf && M.crossfade !== 'direct') { mistBuf = document.createElement('canvas'); mistBuf.width = fw; mistBuf.height = fh; }
    const f = Math.min(n - 1, Math.floor(phi)), p = clamp(phi - f, 0, 1);
    if (M.crossfade === 'direct') { // two alpha blits straight onto the frame (no offscreen pass)
      const a0 = ctx.globalAlpha;
      ctx.globalAlpha = a0 * (1 - p) * mistGain[f]; ctx.drawImage(img, f * fw, 0, fw, fh, 0, 0, W, H);
      if (f + 1 < n && p > 0) { ctx.globalAlpha = a0 * p * mistGain[f + 1]; ctx.drawImage(img, (f + 1) * fw, 0, fw, fh, 0, 0, W, H); }
      ctx.globalAlpha = a0; return;
    }
    const b = mistBuf.getContext('2d');
    b.globalCompositeOperation = 'copy'; b.globalAlpha = (1 - p) * mistGain[f]; b.drawImage(img, f * fw, 0, fw, fh, 0, 0, fw, fh);
    if (f + 1 < n && p > 0) { b.globalCompositeOperation = 'lighter'; b.globalAlpha = p * mistGain[f + 1]; b.drawImage(img, (f + 1) * fw, 0, fw, fh, 0, 0, fw, fh); }
    b.globalCompositeOperation = 'source-over';
    if (veilA > 0) { b.globalAlpha = veilA; b.fillStyle = CONFIG.colors.vLilac; b.fillRect(0, 0, fw, fh); } // veil in the small buffer: no extra full-screen pass
    b.globalAlpha = 1;
    ctx.drawImage(mistBuf, 0, 0, W, H);
  }
  function drawWarpScene() {
    const c = game.cutscene, T = WARP.timeline, M = WARP.mist, s = warpS(c), cur = stage().id;
    drawStageBackground(cur); drawAmbientBack(cur, 1);
    const k = clamp((s - T.streak[0]) / (T.streak[1] - T.streak[0]), 0, 1);
    if (!c.switched && k > 0) {
      const e = easeIn(k), pal = CONFIG.looks[WARP.target].mist;
      ctx.lineCap = 'round';
      c.streaks.forEach((p, i) => {
        const len = 2 + WARP.streakLength * e * p.k, x = ((p.x - 700 * e * e * p.k) % (W + len) + W + len) % (W + len) - len;
        ctx.globalAlpha = 0.85 * (1 - 0.5 * e); ctx.strokeStyle = e > 0.4 ? pal[i % pal.length] : '#fdf6ff'; ctx.lineWidth = 1.5 + 3 * e;
        ctx.beginPath(); ctx.moveTo(x, p.y); ctx.lineTo(x + len, p.y); ctx.stroke();
      });
      ctx.lineCap = 'butt'; ctx.globalAlpha = 0.22 * e; ctx.fillStyle = CONFIG.colors.vLilac; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
    }
    drawGround(cur);
    // v0.6.1 (QA F1): the outgoing backdrop, snapshotted on the frames just before the cut, fades out over the new one
    const swapAt = T.mistStart + M.switchFrame / M.fps;
    if (M.swapFadeSeconds > 0) {
      if (!c.switched && s >= swapAt - 0.05) {
        if (!c.snap) { c.snap = document.createElement('canvas'); c.snap.width = canvas.width; c.snap.height = canvas.height; }
        const sx = c.snap.getContext('2d'); sx.globalCompositeOperation = 'copy'; sx.drawImage(canvas, 0, 0); sx.globalCompositeOperation = 'source-over';
      } else if (c.switched && c.snap) {
        const a = 1 - (s - (c.switchS || swapAt)) / M.swapFadeSeconds;
        if (a > 0 && c.snap.width === canvas.width && c.snap.height === canvas.height) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = a; ctx.drawImage(c.snap, 0, 0); ctx.restore(); }
        else { c.snap.width = c.snap.height = 0; c.snap = null; }
      }
    }
    const mt = s - T.mistStart, f = Math.floor(mt * M.fps);
    let veilDone = false;
    if (mt >= 0 && f < M.frames) {
      const img = sprites.ui.warpMist;
      const vd = Math.abs(s - swapAt), veilA = M.veil && M.veil.peak > 0 ? Math.max(0, M.veil.peak * (1 - vd / M.veil.halfWidth)) : 0;
      if (img && M.crossfade) { drawMistBlend(img, mt * M.fps, veilA); veilDone = true; }
      else if (img) { const fw = img.width / M.frames; ctx.drawImage(img, f * fw, 0, fw, img.height, 0, 0, W, H); }
      else { // placeholder: pastel puffs thicken to frame 3, then thin
        const a = f <= M.switchFrame ? (f + 1) / (M.switchFrame + 1) : (M.frames - f) / (M.frames - M.switchFrame), pal = CONFIG.looks[WARP.target].mist;
        for (const b of c.blobs) { ctx.globalAlpha = 0.55 * a; ctx.fillStyle = pal[b.c % pal.length]; ctx.beginPath(); ctx.ellipse(b.x - mt * 120 * b.v, b.y, b.r, b.r * 0.6, 0, 0, TAU); ctx.fill(); }
        ctx.globalAlpha = 1;
      }
      game.stats.warpMistFrame = f;
    }
    if (!veilDone && M.veil && M.veil.peak > 0) { // v0.6.1 (QA F1): soften the background cut (fallback path; normally folded into the mist buffer)
      const d = Math.abs(s - swapAt), a = M.veil.peak * (1 - d / M.veil.halfWidth);
      if (a > 0) { ctx.globalAlpha = a; ctx.fillStyle = CONFIG.colors.vLilac; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
    }
    drawParticles();
    drawGhost();
    drawFloatTexts();
    drawHUD();
  }
  // ---- Ghost -----------------------------------------------------------------------------------
  function drawGhost() {
    const G = CONFIG.ghost, g = game.ghost, s = G.size;
    const alpha = game.state === 'playing' && !game.cutscene ? Math.min(1, game.physAcc * CONFIG.world.physicsHz) : 1;
    const y = lerp(g.prevY, g.y, alpha); // render interpolation between fixed physics steps
    const cs = game.cutscene;
    if (cs && cs.ghostHidden) return;
    ctx.save();
    const sp = game.sp, SA = CONFIG.specials.art, k = s / 64;
    if (game.state === 'playing' && (sp.graceT > 0 || sp.invulnT > 0 || sp.knock) && Math.floor(game.time * CONFIG.specials.extraLife.blinkHz) % 2) ctx.globalAlpha = 0.35;
    ctx.translate(cs && cs.gx != null ? cs.gx : G.x + sp.shift, y);
    if (game.goldenModeT > 0 && !cs) drawStrip('rushAura', SA.rushAura.frames, SA.rushAura.fps, game.time, (-32 + SA.rushAura.dx) * k, (-32 + SA.rushAura.dy) * k, SA.rushAura.w * k, SA.rushAura.h * k);
    if (cs && cs.ghostScale != null) ctx.scale(Math.max(0.01, cs.ghostScale), Math.max(0.01, cs.ghostScale));
    ctx.rotate(g.tilt * Math.PI / 180);
    const AG = A.ghost;
    let name;
    if (game.state === 'over') name = AG.deadFrame;
    else if (game.flapT >= 0) name = AG.flapFrames[Math.min(AG.flapFrames.length - 1, Math.floor(game.flapT * AG.flapFps))];
    else name = AG.idleFrames[Math.floor(game.time * AG.idleFps) % AG.idleFrames.length];
    const R = SA.ghostRush;
    if (!(game.goldenModeT > 0 && !cs && game.state === 'playing' && drawStrip('ghostRush', R.frames, R.fps, game.time, (-32 + R.dx) * k, (-32 + R.dy) * k, R.w * k, R.h * k))) drawGhostBody(name);
    if (sp.lifeHeld > 0) { const Hh = SA.heart;
      if (!drawStrip('heart', Hh.frames, Hh.fps, game.time, (-32 + Hh.dx) * k, (-32 + Hh.dy) * k, Hh.w * k, Hh.h * k)) { ctx.fillStyle = SA.placeholder.extraLife; ctx.beginPath(); ctx.arc((-32 + Hh.dx + 10) * k, (-32 + Hh.dy + 10) * k, 7 * k, 0, TAU); ctx.fill(); } }
    ctx.restore();
  }
  function drawGhostBody(name, eyes) { // ghost centred on the current transform origin
    const G = CONFIG.ghost, s = G.size;
    const golden = game.golden || game.goldenModeT > 0;
    const strip = golden ? sprites.ghost.golden : sprites.ghost.normal;
    if (strip) {
      const AG = A.ghost, k = s / AG.frameSize, fs = AG.frameSize * sprites.res;
      const idx = Math.max(0, AG.frameOrder.indexOf(name));
      ctx.drawImage(strip, idx * fs, 0, fs, fs, -AG.anchor[0] * k, -AG.anchor[1] * k, AG.frameSize * k, AG.frameSize * k);
    } else {
      const hw = s * 0.32;
      ctx.fillStyle = golden ? CONFIG.colors.ghostGolden : CONFIG.colors.ghostBody;
      ctx.strokeStyle = golden ? CONFIG.colors.ghostGoldenShade : CONFIG.colors.ghostShade; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-hw, 2); ctx.arc(0, 2, hw, Math.PI, 0); ctx.lineTo(hw, hw);
      for (let i = 0; i < 4; i++) { const x0 = hw - i * (hw / 2); ctx.quadraticCurveTo(x0 - hw / 4, hw + 6, x0 - hw / 2, hw); }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      if (eyes !== 'x') {
        ctx.fillStyle = CONFIG.colors.eye;
        for (const ex of [-7, 7]) { ctx.beginPath(); ctx.ellipse(ex, 1, 3, 4, 0, 0, TAU); ctx.fill(); }
      }
      ctx.fillStyle = CONFIG.colors.blush; ctx.globalAlpha *= 0.8;
      ctx.beginPath(); ctx.ellipse(-12, 8, 3.5, 2.2, 0, 0, TAU); ctx.ellipse(12, 8, 3.5, 2.2, 0, 0, TAU); ctx.fill(); ctx.globalAlpha /= 0.8;
    }
    if (eyes === 'x') { // x_x eyes over whatever the body drew
      const k = s / 64;
      ctx.fillStyle = CONFIG.colors.ghostBody;
      for (const ex of [-7, 7]) { ctx.beginPath(); ctx.ellipse(ex * k, 1 * k, 4.5 * k, 5.5 * k, 0, 0, TAU); ctx.fill(); }
      ctx.strokeStyle = CONFIG.colors.eye; ctx.lineWidth = 2.2 * k; ctx.lineCap = 'round';
      for (const ex of [-7, 7]) { ctx.beginPath(); ctx.moveTo((ex - 3.5) * k, -2.5 * k); ctx.lineTo((ex + 3.5) * k, 4.5 * k); ctx.moveTo((ex + 3.5) * k, -2.5 * k); ctx.lineTo((ex - 3.5) * k, 4.5 * k); ctx.stroke(); }
    }
  }

  // ---- v0.5 death animations (placeholders until Art's death-<type>-<n> strips land) ----------
  function drawStar5(x, y, r, rot) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = rot + i * Math.PI / 5 - Math.PI / 2, rr = i % 2 ? r * 0.45 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    ctx.closePath(); ctx.fill();
  }
  function drawBatShape(x, y, t, scale = 1) {
    if (drawSheet('bat', x - 24 * scale, y - 24 * scale, t, { w: 48 * scale, h: 48 * scale })) return;
    const flapA = Math.sin(t * 22) * 0.6;
    ctx.fillStyle = CONFIG.deathAnims.colors.bat;
    for (const dir of [-1, 1]) { ctx.save(); ctx.translate(x, y); ctx.scale(dir * scale, scale); ctx.rotate(flapA); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(14, -16, 26, -4); ctx.quadraticCurveTo(18, -2, 16, 6); ctx.quadraticCurveTo(8, 2, 0, 6); ctx.fill(); ctx.restore(); }
    ctx.beginPath(); ctx.ellipse(x, y + 2 * scale, 7 * scale, 9 * scale, 0, 0, TAU); ctx.fill();
  }
  function drawFx(name, x, y, f, scale = 1) { // fx strip frame f at top-left x,y (logical px)
    const img = sprites.fx[name], F = CONFIG.deathAnims.fx[name];
    if (!img) return false;
    const r = sprites.res;
    ctx.drawImage(img, f * F.w * r, 0, F.w * r, F.h * r, x, y, F.w * scale, F.h * scale);
    return true;
  }
  function drawDeath() {
    const d = game.death, D = CONFIG.deathAnims, G = CONFIG.ghost;
    const u = d.t / d.seconds, t = d.t;
    const T = D.types[d.anim], strip = (d.golden && sprites.death[d.anim + ':golden']) || sprites.death[d.anim];
    game.stats.deathDraws = (game.stats.deathDraws || 0) + 1;
    if (strip && T.frames) { // Art strip: 128x128 frames, anchor [64,64] = ghost anchor; play once, hold (or loop) the last
      let f = Math.floor(t * D.fps);
      if (f >= T.frames) f = T.loop ? T.loop[0] + (f - T.loop[0]) % (T.loop[1] - T.loop[0] + 1) : T.frames - 1;
      const k = G.size / A.ghost.frameSize, fs = D.frameSize * sprites.res, lastT = (T.frames - 1) / D.fps;
      const a = T.fadeLast && t > lastT ? Math.max(0, 1 - (t - lastT) / Math.max(0.05, d.seconds - lastT)) : 1;
      ctx.save(); ctx.globalAlpha *= a;
      ctx.drawImage(strip, f * fs, 0, fs, fs, d.x - D.anchor[0] * k, d.y - D.anchor[1] * k, D.frameSize * k, D.frameSize * k);
      ctx.restore();
      game.stats.deathSource = d.golden && sprites.death[d.anim + ':golden'] ? 'art-golden' : 'art'; game.stats.deathFrame = f;
      return;
    }
    game.stats.deathSource = 'placeholder';
    const C = D.colors;
    ctx.save();
    switch (d.anim) {
      case 'bat': { // grabbed (short struggle), then carried off up and away
        const lift = u < 0.2 ? 0 : easeIn((u - 0.2) / 0.8);
        const x = d.x + lift * 70 + (u < 0.2 ? Math.sin(t * 60) * 2 : 0), y = d.y - lift * (d.y + 90);
        ctx.translate(x, y); ctx.rotate((u < 0.2 ? Math.sin(t * 40) * 0.15 : -0.25) + 0);
        drawGhostBody('idle-1');
        ctx.restore(); ctx.save();
        drawBatShape(x, y - 30, t, 1.2);
        break;
      }
      case 'pumpkin': { // pumpkin drops on the ghost, squash + splat
        const drop = Math.min(1, u / 0.25), sq = u < 0.25 ? 0 : easeOut(Math.min(1, (u - 0.25) / 0.2));
        const sy = 1 - 0.72 * sq, sx = 1 + 0.6 * sq, base = d.y + G.size * 0.32;
        ctx.translate(d.x, base); ctx.scale(sx, sy); ctx.translate(0, -G.size * 0.32);
        drawGhostBody('idle-1', sq > 0.5 ? 'x' : null);
        ctx.restore(); ctx.save();
        const py = lerp(d.y - 220, base - G.size * 0.32 * sy * 2 - 12, easeIn(drop)) + (sq ? Math.sin(sq * Math.PI) * -6 : 0);
        if (!drawSheet('pumpkin', d.x - 22, py - 22, 0, { w: 44, h: 44 })) {
          ctx.fillStyle = CONFIG.colors.pumpkin; ctx.beginPath(); ctx.ellipse(d.x, py, 22, 18, 0, 0, TAU); ctx.fill();
          ctx.fillStyle = CONFIG.colors.pumpkinStem; ctx.fillRect(d.x - 3, py - 24, 6, 8);
        }
        ctx.fillStyle = CONFIG.colors.pumpkin;
        for (const q of d.parts) { ctx.globalAlpha = Math.max(0, q.life / 0.7); ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, TAU); ctx.fill(); }
        break;
      }
      case 'meteor': { // sooty frazzle + rising smoke
        const shake = (1 - u) * 3 * Math.sin(t * 50);
        ctx.translate(d.x + shake, d.y);
        drawGhostBody('idle-1', u > 0.15 ? 'x' : null);
        ctx.globalAlpha = Math.min(0.75, u * 3); ctx.fillStyle = C.soot; // soot blotches
        for (const [bx, by, br] of [[-12, -10, 9], [8, -14, 8], [12, 6, 10], [-6, 12, 9], [-16, 4, 6], [2, -2, 7]]) { ctx.beginPath(); ctx.arc(bx, by, br, 0, TAU); ctx.fill(); }
        ctx.globalAlpha = 1; ctx.strokeStyle = C.soot; ctx.lineWidth = 2; ctx.lineCap = 'round'; // frazzled tufts
        for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 7, -20); for (let j = 1; j <= 3; j++) ctx.lineTo(i * 7 + (j % 2 ? 4 : -4), -20 - j * 5 * Math.min(1, u * 4)); ctx.stroke(); }
        ctx.restore(); ctx.save();
        ctx.fillStyle = C.smoke;
        for (const q of d.parts) { ctx.globalAlpha = Math.max(0, Math.min(1, q.life)); ctx.beginPath(); ctx.arc(q.x, q.y, q.r * (1.6 - q.life * 0.5), 0, TAU); ctx.fill(); }
        break;
      }
      case 'tombstone': { // bonk: knocked back, dazed wobble, circling stars
        const knock = Math.sin(Math.min(1, u / 0.2) * Math.PI) * -8;
        ctx.translate(d.x + knock, d.y); ctx.rotate(Math.sin(t * 9) * 0.18 * (1 - u * 0.5));
        drawGhostBody('idle-1', 'x');
        ctx.restore(); ctx.save();
        if (!drawFx('starsRing', d.x + knock - 32, d.y - 30 - 16, Math.floor(t * D.fps) % D.fx.starsRing.frames)) {
          ctx.fillStyle = C.star;
          for (let i = 0; i < 5; i++) { const a = t * 6 + i * TAU / 5; drawStar5(d.x + knock + Math.cos(a) * 24, d.y - 30 + Math.sin(a) * 7, 6, t * 4); }
        }
        break;
      }
      case 'skull': { // spooked: shiver, fading flicker, lines
        const sh = Math.sin(t * 70) * 3 * (1 - u * 0.6);
        ctx.translate(d.x + sh, d.y); ctx.globalAlpha = 0.55 + 0.45 * Math.abs(Math.cos(t * 12));
        drawGhostBody('idle-1');
        ctx.globalAlpha = 1; ctx.strokeStyle = C.spook; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
        for (const a of [-2.4, -1.57, -0.7]) { ctx.beginPath(); ctx.moveTo(Math.cos(a) * 30, Math.sin(a) * 30); ctx.lineTo(Math.cos(a) * 40, Math.sin(a) * 40); ctx.stroke(); }
        break;
      }
      case 'floor': { // flop over, x_x
        const fl = easeOut(Math.min(1, u / 0.35)), onCeil = game.deathObj === 'ceiling';
        ctx.translate(d.x, d.y + (onCeil ? -6 : 6) * fl); ctx.rotate((onCeil ? -1 : 1) * fl * Math.PI / 2); ctx.scale(1 + 0.12 * fl, 1 - 0.12 * fl);
        drawGhostBody('idle-1', 'x');
        break;
      }
      default: { // poof: puff up, fade out, smoke ring
        const k = 1 + easeOut(Math.min(1, u / 0.5)) * 0.35;
        ctx.translate(d.x, d.y); ctx.scale(k, k); ctx.globalAlpha = Math.max(0, 1 - u * 1.4);
        drawGhostBody('idle-1', 'x');
        ctx.restore(); ctx.save();
        ctx.fillStyle = 'rgba(240, 232, 255, 0.85)';
        for (const q of d.parts) { ctx.globalAlpha = Math.max(0, q.life * 1.6); ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, TAU); ctx.fill(); }
      }
    }
    ctx.restore();
  }

  function drawParticles() {
    ctx.fillStyle = CONFIG.colors.sparkle;
    for (const s of game.sparkles) {
      ctx.globalAlpha = Math.max(0, s.life / CONFIG.golden.sparkleLife);
      ctx.beginPath(); ctx.moveTo(s.x, s.y - 5); ctx.lineTo(s.x + 1.5, s.y); ctx.lineTo(s.x, s.y + 5); ctx.lineTo(s.x - 1.5, s.y); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = 'rgba(240, 232, 255, 0.8)';
    for (const p of game.poofs) { ctx.globalAlpha = Math.max(0, p.life * 2); ctx.beginPath(); ctx.arc(p.x, p.y, 5 * (1.2 - p.life), 0, TAU); ctx.fill(); }
    ctx.globalAlpha = 1;
  }

  // ---- HUD -----------------------------------------------------------------------------------
  const hudFont = (weight) => px => `${weight} ${px}px ${CONFIG.ui.font}`;
  function text(str, x, y, size, opts = {}) {
    ctx.font = hudFont(opts.weight || 'bold')(size);
    ctx.textAlign = opts.align || 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(3, size / 6); ctx.strokeStyle = CONFIG.colors.textShadow; ctx.strokeText(str, x, y);
    ctx.fillStyle = opts.color || CONFIG.colors.text; ctx.fillText(str, x, y);
  }
  function medalFor(score) { // medals stay score-based on purpose (TUNING v1.7)
    const m = CONFIG.scoring.medals;
    if (score >= m.pumpkin) return 'Pumpkin medal';
    if (score >= m.gold) return 'Gold medal';
    if (score >= m.silver) return 'Silver medal';
    if (score >= m.bronze) return 'Bronze medal';
    return null;
  }
  function roundRect(x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function drawHUD() {
    const blink = 0.6 + 0.4 * Math.sin(game.time * 4);
    if (game.state === 'loading') { ctx.globalAlpha = blink; text('Loading…', W / 2, H / 2, 24); ctx.globalAlpha = 1; return; }
    if (game.state === 'ready') {
      text('Ghost Flap', W / 2, 150, 44);
      if (game.stageIndex > 0) text(CONFIG.looks[stage().id].name, W / 2, 230, 20, { color: CONFIG.colors.accent });
      if (game.golden) text('Golden ghost! x2 points', W / 2, 196, 18, { color: CONFIG.colors.ghostGolden });
      ctx.globalAlpha = blink; text('Tap to start', W / 2, H / 2 + 50, 26); ctx.globalAlpha = 1;
      { // v0.6.2: ' · Best: N' always shows in full; the name shrinks then ellipsizes
        const R = CONFIG.ui.nameFit.ready, suffix = `  ·  Best: ${game.best}`, f = hudFont('bold'), maxW = Math.min(R.maxWidth, W) - R.pad * 2;
        const fit = fitName(ctx, game.player, px => { const keep = ctx.font; ctx.font = f(px); const sw = ctx.measureText(suffix).width; ctx.font = keep; return sw; }, maxW, R.size, R.minSize, R.step, f);
        const line = fit.text + suffix; ctx.font = f(fit.size);
        game.stats.nameDraw = { where: 'ready', line, name: fit.text, suffix, size: fit.size, truncated: fit.truncated, kept: fit.kept, width: ctx.measureText(line).width, maxWidth: maxW, canvasW: W };
        text(line, W / 2, H - CONFIG.world.groundHeight / 2, fit.size);
      }
      return;
    }
    if (game.state === 'playing') {
      text(String(game.score), W / 2, 64, 52);
      if (game.tapCue > 0) { // v0.3.1: 'Tap!' cue after the rocket drops the ghost off (no physics change)
        const k = game.tapCue / CONFIG.ui.tapCueSeconds, pulse = 1 + 0.15 * Math.sin(game.time * 14);
        ctx.globalAlpha = Math.min(1, k * 3);
        const cue = tapCuePos(); game.stats.tapCueRect = cue.rect;
        text('Tap!', cue.x, cue.y, Math.round(24 * pulse), { color: CONFIG.colors.accent });
        ctx.globalAlpha = 1;
      }
      text(`Best ${game.best}`, W - 12, 22, 14, { align: 'right', weight: 'normal' });
      { // v0.6.2: name never runs into 'Best N'
        const Hc = CONFIG.ui.nameFit.hud, f = hudFont('normal'); ctx.font = f(14); const bw = ctx.measureText(`Best ${game.best}`).width;
        const maxW = W - 24 - bw - Hc.gap, fit = fitName(ctx, game.player, () => 0, maxW, Hc.size, Hc.minSize, Hc.step, f);
        game.stats.nameDrawHud = { name: fit.text, size: fit.size, truncated: fit.truncated, width: ctx.measureText(fit.text).width, maxWidth: maxW };
        text(fit.text, 12, 22, fit.size, { align: 'left', weight: 'normal' });
      }
      drawSpecialHud();
      if (game.banner) drawBanner();
      if (game.paused) { ctx.fillStyle = CONFIG.colors.panelBg; ctx.fillRect(0, 0, W, H); text('Paused', W / 2, H / 2 - 20, 36); text('Tap to resume', W / 2, H / 2 + 24, 20); }
      return;
    }
    if (game.death && game.death.t < game.death.seconds) { text(String(game.score), W / 2, 64, 52); return; } // v0.5: anim first, panel after
    const px = 40, py = 150, pw = W - 80, ph = 270;
    const pin = game.death ? easeOut(Math.min(1, (game.time - game.deadTime - game.death.seconds) / 0.25)) : 1;
    ctx.globalAlpha = pin;
    ctx.fillStyle = CONFIG.colors.panelBg; roundRect(px, py, pw, ph, 22); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = CONFIG.colors.accent; ctx.stroke();
    text('Game Over', W / 2, py + 40, 34);
    { // v0.6.2: name fits inside the panel
      const G = CONFIG.ui.nameFit.gameOver, f = hudFont('bold'), maxW = pw - G.pad * 2, fit = fitName(ctx, game.player, () => 0, maxW, G.size, G.minSize, G.step, f);
      game.stats.nameDrawOver = { name: fit.text, size: fit.size, truncated: fit.truncated, width: ctx.measureText(fit.text).width, maxWidth: maxW };
      text(fit.text, W / 2, py + 80, fit.size, { color: CONFIG.colors.accent });
    }
    text(`Score: ${game.score}`, W / 2, py + 116, 26);
    text(`Best: ${game.best}`, W / 2, py + 152, 22);
    let y = py + 186;
    if (game.newBest) { text('New best!', W / 2, y, 18, { color: CONFIG.colors.accent }); y += 26; }
    if (game.rank) { text(`#${game.rank} in the Top ${CONFIG.scoring.topScoresMax}`, W / 2, y, 16, { color: CONFIG.colors.sparkle }); y += 24; }
    const medal = medalFor(game.score);
    if (medal) text(medal, W / 2, y, 18, { color: CONFIG.colors.ghostGolden });
    ctx.globalAlpha = 1;
    if (game.time - restartFrom() >= CONFIG.ui.restartLockout) { ctx.globalAlpha = blink; text('Tap to restart', W / 2, py + ph + 40, 24); ctx.globalAlpha = 1; }
  }
  const BANNER = { y: 200, size: 30, padX: 18, h: 48 };
  function bannerRect(str) {
    ctx.font = `bold ${BANNER.size}px ${CONFIG.ui.font}`;
    const w = ctx.measureText(str).width + BANNER.padX * 2;
    return [W / 2 - w / 2, BANNER.y - BANNER.h / 2, w, BANNER.h];
  }
  function drawBannerPill(str) { // v0.3.2: dark rounded backing so the name reads over any art (e.g. the planet)
    const [x, y, w, h] = bannerRect(str);
    game.stats.bannerRect = [x, y, w, h];
    const a = ctx.globalAlpha;
    ctx.fillStyle = CONFIG.colors.bannerBg; roundRect(x, y, w, h, h / 2); ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = CONFIG.colors.bannerEdge; ctx.stroke();
    ctx.globalAlpha = a;
    text(str, W / 2, BANNER.y + 1, BANNER.size, { color: CONFIG.colors.accent });
  }
  // v0.5 banner: swooshes in (ease-out-back), holds, swooshes out (ease-in), with a burst,
  // a sparkle trail and a 'Stage N' badge. Art (CONFIG.transitions.art) replaces each piece when loaded.
  const easeOutBack = t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
  function bannerOffset(t) { // x offset (logical px) of the banner for banner time t
    const B = CONFIG.transitions.banner, hold = CONFIG.stages.transition.bannerSeconds;
    if (t < B.inSeconds) return (1 - easeOutBack(t / B.inSeconds)) * B.fromX * W;
    if (t < hold) return 0;
    return easeIn(Math.min(1, (t - hold) / B.outSeconds)) * B.toX * W;
  }
  function bannerArt(sid) { return sprites.ui[`banner-${sid}`] || sprites.ui[`bannerBlank-${sid}`] || sprites.ui.bannerBlank || null; }
  function bannerBox(sid, str) { // resting rect of the banner (art 300x90 or the pill)
    const TB = CONFIG.transitions.banner;
    return bannerArt(sid) ? [W / 2 - TB.w / 2, BANNER.y - TB.h / 2, TB.w, TB.h] : bannerRect(str);
  }
  function drawBanner() {
    const TB = CONFIG.transitions, B = TB.banner, TA = TB.art, t = game.banner.t, sid = game.banner.stage || stage().id, fps = 12;
    const dx = bannerOffset(t), [bx, by, bw, bh] = bannerBox(sid, game.banner.text);
    game.stats.bannerX = dx;
    // burst flourish on arrival (fx-burst-<stage>, 6 f @12 fps, play once)
    const bt = t - B.inSeconds * 0.7, burst = sprites.ui[`burst-${sid}`];
    if (bt > 0 && burst) {
      const f = Math.floor(bt * fps), F = TA.burst, r = sprites.res;
      if (f < F.frames) { const sz = F.w * 1.5; ctx.drawImage(burst, f * F.w * r, 0, F.w * r, F.h * r, W / 2 - sz / 2, BANNER.y - sz / 2, sz, sz); game.stats.burstFrame = f; }
    } else if (bt > 0 && bt < 0.6) { // placeholder burst
      const k = bt / 0.6, pal = TB.palette[sid] || ['#ffffff', '#ffb3c9'];
      ctx.save(); ctx.globalAlpha = 1 - k; ctx.strokeStyle = pal[1]; ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (let i = 0; i < 12; i++) { const a = i * TAU / 12, r0 = bw / 2 * 0.6 + 50 * easeOut(k), r1 = r0 + 14; ctx.beginPath(); ctx.moveTo(W / 2 + Math.cos(a) * r0, BANNER.y + Math.sin(a) * r0 * 0.45); ctx.lineTo(W / 2 + Math.cos(a) * r1, BANNER.y + Math.sin(a) * r1 * 0.45); ctx.stroke(); }
      ctx.restore();
    }
    // sparkle swoosh while the banner moves (fx-swoosh, 6 f @12 fps; drawn mirrored: the banner travels right -> left)
    const hold = CONFIG.stages.transition.bannerSeconds, moving = t < B.inSeconds || t > hold;
    if (moving) {
      const pt = t < B.inSeconds ? t : t - hold, sw = sprites.ui.swoosh;
      if (sw) {
        const F = TA.swoosh, r = sprites.res, f = Math.min(F.frames - 1, Math.floor(pt * fps));
        ctx.save(); ctx.translate(W / 2 + dx + bw * 0.25, BANNER.y); ctx.scale(-1.2, 1.2);
        ctx.drawImage(sw, f * F.w * r, 0, F.w * r, F.h * r, -F.w / 2, -F.h / 2, F.w, F.h); ctx.restore();
        game.stats.swooshFrame = f;
      } else {
        ctx.save(); ctx.fillStyle = CONFIG.colors.sparkle;
        for (let i = 0; i < B.sparkles; i++) { const f = i / B.sparkles; ctx.globalAlpha = (1 - f) * 0.9; drawStar5(W / 2 + dx + bw / 2 + f * 120, BANNER.y + Math.sin(i * 2.3 + t * 20) * bh * 0.4, 4 * (1 - f) + 1.5, i); }
        ctx.restore();
      }
    }
    ctx.save(); ctx.translate(dx, 0);
    const lettered = sprites.ui[`banner-${sid}`], blank = bannerArt(sid);
    if (lettered) ctx.drawImage(lettered, bx, by, bw, bh);
    else if (blank) { ctx.drawImage(blank, bx, by, bw, bh); text(game.banner.text, bx + B.textX, by + B.textBaseline - 10, 26, { color: CONFIG.colors.text }); }
    else drawBannerPill(game.banner.text);
    // 'Stage N' badge
    const BD = TB.badge, n = (game.banner.index != null ? game.banner.index : game.stageIndex) + 1, badge = sprites.ui[`badge-${n}`];
    if (badge) ctx.drawImage(badge, W / 2 - BD.w / 2, BD.y - BD.h / 2, BD.w, BD.h);
    else if (sprites.ui.badgeBlank) { ctx.drawImage(sprites.ui.badgeBlank, W / 2 - BD.w / 2, BD.y - BD.h / 2, BD.w, BD.h); text(String(n), W / 2 - BD.w / 2 + 74, BD.y + 1, 16, { color: CONFIG.colors.eye }); }
    else { const label = BD.text.replace('{n}', n); ctx.font = `bold ${BD.size}px ${CONFIG.ui.font}`; const w = ctx.measureText(label).width + 20; ctx.fillStyle = CONFIG.colors.bannerBg; roundRect(W / 2 - w / 2, BD.y - 12, w, 24, 12); ctx.fill(); text(label, W / 2, BD.y + 1, BD.size, { color: CONFIG.colors.sparkle }); }
    ctx.restore();
    game.stats.bannerRect = [bx, by, bw, bh]; // resting rect (the Tap! cue avoids it)
    game.stats.bannerArt = lettered ? 'lettered' : blank ? 'blank' : 'pill';
  }
  // v0.5 sky/palette crossfade: gradient overlay between stage palettes, peaking mid-fade
  function drawPaletteTint(fromId, toId, t) {
    const TP = CONFIG.transitions, a = TP.palette[fromId], b = TP.palette[toId];
    if (!a || !b) return;
    const mix = (c1, c2) => { const p = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16)); const x = p(c1), y = p(c2); return `rgb(${x.map((v, i) => Math.round(lerp(v, y[i], t))).join(',')})`; };
    const al = TP.tintPeak * Math.sin(Math.PI * Math.min(1, t));
    if (al <= 0.004) return;
    const gr = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    gr.addColorStop(0, mix(a[0], b[0])); gr.addColorStop(1, mix(a[1], b[1]));
    ctx.save(); ctx.globalAlpha = al; ctx.fillStyle = gr; ctx.fillRect(0, 0, W, GROUND_Y); ctx.restore();
    game.stats.tint = { from: fromId, to: toId, t: +t.toFixed(3), alpha: +al.toFixed(3) };
  }
  function tapCuePos() { // beside the ghost; drops below it if it would touch the banner
    const g = game.ghost, x = CONFIG.ghost.x + 58, w = 64, h = 32;
    let y = g.y - 30;
    if (game.banner) { // QA TR-CUE: keep clear of the banner and the 'Stage N' badge (pad 6 px)
      const BD = CONFIG.transitions.badge, P = CONFIG.ui.tapCuePad, ox = game.stats.bannerX || 0, [b0, b1, b2, b3] = bannerBox(game.banner.stage || stage().id, game.banner.text);
      const bd = [W / 2 - BD.w / 2, BD.y - BD.h / 2, BD.w, BD.h];
      const boxes = [[b0, b1, b2, b3], bd, [b0 + ox, b1, b2, b3], [bd[0] + ox, bd[1], bd[2], bd[3]]]; // resting + live (sliding) rects
      const hit = yy => boxes.some(([bx, by, bw, bh]) => x + w / 2 > bx - P && x - w / 2 < bx + bw + P && yy + h / 2 > by - P && yy - h / 2 < by + bh + P);
      y = CONFIG.ui.tapCueOffsets.map(o => g.y + o).find(yy => !hit(yy)) ?? g.y + CONFIG.ui.tapCueOffsets[1];
    }
    return { x, y, rect: [x - w / 2, y - h / 2, w, h] };
  }
  function drawFloatTexts() {
    for (const f of game.floatTexts) {
      ctx.globalAlpha = Math.max(0, 1 - f.t / (CONFIG.ui.floatTextSeconds * f.scale));
      text(f.text, f.x, f.y, 20, { color: f.color });
    }
    ctx.globalAlpha = 1;
  }

  function draw() {
    frameStages.clear();
    drawScene();
    game.lastFrameStages = [...frameStages];
  }
  function drawScene() {
    const cur = stage().id;
    const from = game.fade ? STAGES[game.fade.from].id : null;
    const t = game.fade ? easeInOut(Math.min(1, game.fade.t)) : 1;
    if (game.cutscene) { if (game.cutscene.kind === 'warp') drawWarpScene(); else drawLaunchScene(); return; }
    if (artBg(cur) && A.backgrounds.layers.some(l => bgState[l] && bgState[l].cur !== cur)) updateBgLayers(0); // QA TR-FLASH: stage switched after this tick's layer update; set up the tile/fade now, not one frame late
    drawStageBackground(cur);
    drawAmbientBack(cur, t);
    if (from && !(artBg(cur) && artBg(from))) { // placeholder crossfade: old stage rendered offscreen, composited at (1 - t)
      ctx = bgCtx;
      drawStageBackground(from);
      drawAmbientBack(from, 1);
      ctx = mainCtx;
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1 - t; ctx.drawImage(bgCanvas, 0, 0); ctx.restore();
    }
    if (from) drawPaletteTint(from, cur, t);
    drawColumns();
    drawHazards();
    drawPickups();
    drawGround(cur);
    if (from) { ctx.globalAlpha = 1 - t; drawGround(from); ctx.globalAlpha = 1; }
    drawFloatGlows();
    drawEvent();
    if (from) drawAmbientFront(from, 1 - t);
    drawAmbientFront(cur, t);
    drawParticles();
    drawSpecialFx();
    if (game.death) drawDeath(); else if (game.state !== 'loading') drawGhost();
    drawFrost();
    if (game.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${game.flash * 0.5})`; ctx.fillRect(0, 0, W, H); }
    drawFloatTexts();
    drawHUD();
  }

  // ---- QA hooks ----------------------------------------------------------------------------------
  if (DEBUG) {
  game.setStage = n => {
    const idx = parseStage(n);
    if (idx == null) return false;
    game.pairs = stageStartPairs(idx);
    if (game.state !== 'playing') { game.stageIndex = idx; game.fade = null; if (STAGES[idx].id === WARP.target) { game.launches = 1; game.warps = 1; game.voidBasePairs = game.pairs; } scheduleZoneEvent(); }
    return true; // while playing, the normal transition (or the launch) follows from pairs
  };
  game.triggerEvent = id => {
    const zone = Object.keys(CONFIG.events.list).find(z => CONFIG.events.list[z].id === id);
    if (id === 'rocket') { game.pairs = Math.max(game.pairs, CONFIG.launch.atScore); return true; }
    if (id === 'warp') { game.score = Math.max(game.score, WARP.atScore); return true; }
    if (!zone) return false;
    game.eventDue = { zone, score: game.pairs, def: CONFIG.events.list[zone], forced: true };
    return true;
  };
  game.forcePickup = () => { game.forcePickupNext = true; };
  game.killNow = obj => { // v0.5: end the run now with obj's death anim (object id, hazard, event or anim name)
    if (game.state === 'ready') { game.state = 'playing'; }
    if (game.state !== 'playing') return false;
    const god = game.god; game.god = false; die('debug:' + obj, obj); game.god = god; return game.death && game.death.anim;
  };
  game.deathAnimFor = obj => deathAnimFor(obj);
  game.givePower = type => { // v1.9 QA: collect a special now (same path as touching the token)
    type = ({ life: 'extraLife', chill: 'slowMo' })[type] || type;
    if (game.state === 'ready') { game.state = 'playing'; flap(); }
    if (game.state !== 'playing' || !CONFIG.specials[type]) return false;
    collectPickup({ x: CONFIG.ghost.x, pickup: { type, dx: 0, y: game.ghost.y, taken: false } }); return true;
  };
  game.dieAs = (cause, obj) => { if (game.state !== 'playing') return false; const god = game.god; game.god = false; die(cause, obj); game.god = god; return game.state; };
  game.worldNow = () => worldNow();
  game.ui = { openProfiles: () => openProfiles(), openTop: () => openTop(), close: () => closeUi() };
  game._dbg = { nextReady: () => { const n = STAGES[game.stageIndex + 1]; if (!n || !artBg(n.id) || voidParts(n.id) || (n.id === WARP.target && !warpPrewarmDue())) return true; const sc = canvas.height / H; return prewarmKeys().filter(k => k.includes(n.id) || k === 'launchSky').every(k => { const e = layerCache.get(k); return e && e.sc === sc; }) && A.backgrounds.layers.every(l => warpDeferred(n.id, l) || prewarmKeys().includes(`${n.id}-${l}`)); }, bgSettled: () => A.backgrounds.layers.every(l => { const st = bgState[l]; return st && st.cur === stage().id && !st.trans && !st.fade; }), prewarmReady: () => !building && !buildQueue.length && prewarmKeys().every(k => { const e = layerCache.get(k); return e && e.sc === canvas.height / H; }), hbFallbacks, coverageBreaks, hitsShapes, resolveColumn, stageIndexForPairs, pairHits, columnHitboxes, multiplier, physics, hazardY, speedFor, gapFor, spacingFor, EVENTS, currentSpeed, specialCfg, stageGap, stageSpacing, stageStartPairs, transitionActive, patternRunning, hitbox: () => ({ r: hitboxRadius, off: hitboxOffsetY }), getLayer, layerCache, layerMeta, layerGeom, voidPartsReady, objectOf, clipGraphemes, warmLog, spawnPairForTest: () => { const n = game.cols.length; spawnPair(W + 100, { centre: H / 2, pattern: 'random' }); return n < game.cols.length ? game.cols.splice(n, 1)[0] : null; }, voidPartsMB: () => (sprites.voidParts ? +sprites.voidParts.mb.toFixed(2) : 0), mistMB: () => { const i = sprites.ui.warpMist; return i ? +(i.naturalWidth * i.naturalHeight * 4 / 1048576).toFixed(2) : 0; } };
  }

  // ---- v0.5 'Who's playing?' + top-10 (small DOM overlay, mobile-friendly) ----------------------
  const ui = { bar: null, modal: null, open: null, shown: null };
  const icon = (key, color) => { const P = CONFIG.profileIcons, i = el('img', 'gg-ic'); i.alt = ''; i.width = i.height = P.size; i.draggable = false;
    i.src = P.dir + P[key].replace('{size}', P.size * 1.5 >= 48 ? 48 : P.size).replace('{color}', color || ''); i.onerror = () => i.remove(); return i; };
  const chipColor = id => { const P = CONFIG.profileIcons, i = ScoreService.getProfiles().findIndex(p => p.id === id); return P.chipColors[Math.max(0, i) % P.chipColors.length]; };
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  function buildUi() {
    const C = CONFIG.colors, st = el('style');
    st.textContent = `.gg-ui{font-family:${CONFIG.ui.font};color:#fff;-webkit-user-select:none;user-select:none;touch-action:manipulation}
.gg-bar{position:fixed;display:none;gap:10px;justify-content:center;transform:translate(-50%,-50%);z-index:5}
.gg-btn{font:inherit;font-weight:bold;font-size:16px;color:#fff;background:${C.bannerBg};border:2px solid ${C.bannerEdge};border-radius:22px;padding:9px 16px;min-height:44px;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer}
.gg-btn{display:inline-flex;align-items:center;gap:6px}.gg-item>span.gg-who{display:flex;align-items:center;gap:8px;min-width:0;flex:1 1 auto}.gg-item small{flex:none}span.gg-nm{display:block;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.gg-top td.nm{max-width:0;width:100%}.gg-top td.s{white-space:nowrap;line-height:1.25;font-size:${CONFIG.ui.nameFit.list.topStagePx}px !important}.gg-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.gg-ic{width:26px;height:26px;flex:none;pointer-events:none}
.gg-item span:not(.gg-nm){display:inline-flex;align-items:center;gap:8px}
.gg-btn:active{transform:scale(.96)}
.gg-modal{position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:rgba(10,6,20,.55);z-index:10}
.gg-panel{width:min(86vw,330px);max-height:80vh;overflow:auto;background:${C.panelBg.replace('0.72', '0.96')};border:3px solid ${C.accent};border-radius:22px;padding:16px 16px 14px;box-sizing:border-box}
.gg-panel h2{margin:0 0 12px;text-align:center;font-size:24px;color:${C.accent}}
.gg-list{display:flex;flex-direction:column;gap:8px;margin-bottom:12px}
.gg-item{display:flex;justify-content:space-between;align-items:center;font:inherit;font-size:17px;font-weight:bold;color:#fff;background:rgba(255,255,255,.08);border:2px solid transparent;border-radius:14px;padding:10px 14px;min-height:44px;cursor:pointer}
.gg-item.cur{border-color:${C.ghostGolden}}
.gg-item small{opacity:.75;font-weight:normal;margin-left:10px}
.gg-add{display:flex;gap:8px}
.gg-add input{flex:1;min-width:0;font:inherit;font-size:17px;padding:10px 12px;border-radius:12px;border:2px solid ${C.bannerEdge};background:#fff;color:#2b1d3d;user-select:text;-webkit-user-select:text}
.gg-err{min-height:20px;color:${C.warning};font-size:14px;margin:6px 2px 0}
.gg-close{display:block;margin:12px auto 0}
.gg-top{width:100%;border-collapse:collapse;font-size:15px}
.gg-top td{padding:6px 4px;border-bottom:1px solid rgba(255,255,255,.12)}
.gg-top td.n{text-align:right;font-weight:bold;color:${C.ghostGolden}}
.gg-top td.s{opacity:.75;font-size:13px}
.gg-empty{text-align:center;opacity:.8;padding:12px}
.gg-btn:disabled{opacity:.45;cursor:default;transform:none}
.gg-share-link{text-decoration:none}
.gg-toast{position:fixed;left:50%;bottom:12%;transform:translateX(-50%);display:none;z-index:20;font-weight:bold;font-size:17px;background:${C.bannerBg};border:2px solid ${C.accent};border-radius:18px;padding:10px 18px;pointer-events:none}`;
    document.head.appendChild(st);
    ui.bar = el('div', 'gg-ui gg-bar'); ui.bar.id = 'gg-bar';
    ui.playerBtn = el('button', 'gg-btn'); ui.playerBtn.id = 'gg-player'; ui.playerBtn.type = 'button';
    ui.topBtn = el('button', 'gg-btn'); ui.topBtn.append(icon('trophy'), el('span', null, `Top ${CONFIG.scoring.topScoresMax}`)); ui.topBtn.id = 'gg-topbtn'; ui.topBtn.type = 'button';
    ui.shareBtn = el('button', 'gg-btn'); ui.shareBtn.append(icon('share'), el('span', null, 'Share')); ui.shareBtn.id = 'gg-sharebtn'; ui.shareBtn.type = 'button'; ui.shareBtn.disabled = true;
    ui.bar.append(ui.playerBtn, ui.topBtn, ui.shareBtn);
    ui.modal = el('div', 'gg-ui gg-modal'); ui.modal.id = 'gg-modal';
    ui.panel = el('div', 'gg-panel'); ui.modal.appendChild(ui.panel);
    document.body.append(ui.bar, ui.modal);
    ui.playerBtn.addEventListener('click', () => openProfiles());
    ui.topBtn.addEventListener('click', () => openTop());
    ui.shareBtn.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); doShare(); });
    ui.modal.addEventListener('click', e => { if (e.target === ui.modal) closeUi(); });
    window.addEventListener('keydown', e => { if (e.key === 'Escape' && ui.open) closeUi(); });
  }
  function uiOpen() { return !!ui.open; }
  function closeUi() { ui.open = null; ui.modal.style.display = 'none'; ui.panel.textContent = ''; }
  function setPlayer() { game.player = ScoreService.getCurrentProfile().name; if (game.state !== 'over') game.best = ScoreService.getBest(); }
  SS.onProfileChange(setPlayer); // QA PR-SYNC: API add/selectProfile refresh the HUD player at once
  // v0.6.3 (QA N2): name spans in lists show the full name in title/aria-label and are trimmed by grapheme + '…' to their laid-out width
  function nameSpan(name) { const sp = el('span', 'gg-nm', name); sp.dataset.full = name; sp.title = name; sp.setAttribute('aria-label', name); return sp; }
  function fitNameSpans() {
    const mc = (ui.measure = ui.measure || document.createElement('canvas').getContext('2d'));
    for (const sp of ui.panel.querySelectorAll('span.gg-nm')) {
      const full = sp.dataset.full; sp.textContent = full; const avail = sp.clientWidth;
      if (!avail || sp.scrollWidth <= avail) { sp.dataset.truncated = '0'; continue; }
      const cs = getComputedStyle(sp), f = () => `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const fit = fitName(mc, full, () => 0, avail - 1, 1, 1, 1, f);
      sp.textContent = fit.text; sp.dataset.truncated = fit.truncated ? '1' : '0';
    }
  }
  function openProfiles(msg) {
    ui.open = 'profiles'; ui.panel.textContent = '';
    ui.panel.appendChild(el('h2', null, "Who's playing?"));
    const list = el('div', 'gg-list'); list.id = 'gg-profiles';
    const cur = ScoreService.getCurrentProfile().id;
    for (const pr of ScoreService.getProfiles()) {
      const b = el('button', 'gg-item' + (pr.id === cur ? ' cur' : '')); b.type = 'button'; b.dataset.id = pr.id;
      const nm = el('span', 'gg-who'); nm.append(icon('chip', chipColor(pr.id)), nameSpan(pr.name)); b.title = pr.name; b.setAttribute('aria-label', `${pr.name}, best ${pr.best}`);
      b.append(nm, el('small', null, `Best ${pr.best}`));
      b.addEventListener('click', () => { ScoreService.selectProfile(pr.id); setPlayer(); closeUi(); });
      list.appendChild(b);
    }
    const add = el('div', 'gg-add'), inp = el('input'), go = el('button', 'gg-btn'); go.append(icon('add'), el('span', null, 'Add'));
    inp.id = 'gg-name'; inp.placeholder = 'New player'; inp.autocomplete = 'off'; inp.enterKeyHint = 'done';
    // v0.6.1 (QA F2): no maxlength (it counts UTF-16 units); clip to maxNameLength graphemes on input/paste instead
    const clipInput = () => { const v = clipGraphemes(inp.value, CONFIG.scoring.maxNameLength); if (v !== inp.value) { inp.value = v; try { inp.setSelectionRange(v.length, v.length); } catch (e) { /* not focusable */ } } };
    inp.addEventListener('input', e => { if (!e.isComposing) clipInput(); });
    inp.addEventListener('compositionend', clipInput);
    go.id = 'gg-add'; go.type = 'button';
    const err = el('div', 'gg-err', msg || ''); err.id = 'gg-err';
    const submit = () => {
      const r = ScoreService.addProfile(inp.value);
      if (r.ok) { setPlayer(); closeUi(); return; }
      err.textContent = { empty: 'Type a name first', 'too-long': `Max ${CONFIG.scoring.maxNameLength} letters`, duplicate: 'That name is taken', full: 'No room for more players' }[r.reason] || 'Try another name';
    };
    go.addEventListener('click', submit);
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
    add.append(inp, go);
    const close = el('button', 'gg-btn gg-close', 'Close'); close.type = 'button'; close.addEventListener('click', closeUi);
    ui.panel.append(list, add, err, close);
    ui.modal.style.display = 'flex'; fitNameSpans();
  }
  function openTop() {
    ui.open = 'top'; ui.panel.textContent = '';
    ui.panel.appendChild(el('h2', null, `Top ${CONFIG.scoring.topScoresMax}`));
    const rows = ScoreService.getTopScores();
    if (!rows.length) ui.panel.appendChild(el('div', 'gg-empty', 'No scores yet. Go fly!'));
    else {
      const tb = el('table', 'gg-top'); tb.id = 'gg-topscores';
      rows.forEach((r, i) => {
        const tr = el('tr'), look = CONFIG.looks[r.stage];
        const nm = el('td', 'nm'); nm.title = r.name; nm.append(nameSpan(r.name));
        const st = el('td', 's'); st.append(document.createTextNode(look ? look.name : r.stage)); if (r.date) { st.append(el('br'), document.createTextNode(`${r.date.slice(8, 10)}/${r.date.slice(5, 7)}`)); } // v0.6.3: 2 lines max
        tr.append(el('td', 'n', `${i + 1}.`), nm, el('td', 'n', String(r.score)), st);
        tb.appendChild(tr);
      });
      ui.panel.appendChild(tb);
    }
    const close = el('button', 'gg-btn gg-close', 'Close'); close.type = 'button'; close.addEventListener('click', closeUi);
    ui.panel.appendChild(close);
    ui.modal.style.display = 'flex'; fitNameSpans();
  }
  function syncUi() { // show the buttons on the start screen and (after the anim) on game over
    const mode = game.state === 'ready' && !game.paused ? 'ready' : game.state === 'over' && !deathPlaying() ? 'over' : null;
    if (mode !== ui.shown) {
      ui.shown = mode;
      ui.bar.style.display = mode ? 'flex' : 'none';
      ui.playerBtn.style.display = mode === 'ready' ? '' : 'none';
      ui.shareBtn.style.display = mode === 'over' && SHC().enabled ? '' : 'none';
      if (mode === 'over' && SHC().enabled) setTimeout(prepareCard, 0);
      if (!mode && ui.open) closeUi();
    }
    if (ui.shareBtn) { const ok = mode === 'over' && shareReady(); if (ui.shareBtn.disabled === ok) ui.shareBtn.disabled = !ok; } // locked with the restart tap
    if (mode) {
      const r = canvas.getBoundingClientRect(), y = r.top + (CONFIG.transitions.uiBarY / H) * r.height;
      const pos = `${Math.round(r.left + r.width / 2)}px|${Math.round(y)}px`;
      if (pos !== ui.pos) { ui.pos = pos; ui.bar.style.left = pos.split('|')[0]; ui.bar.style.top = pos.split('|')[1]; }
      if (ui.playerLabel !== game.player) {
        ui.playerLabel = game.player; ui.playerBtn.textContent = '';
        // v0.6.2: measure-and-trim at a grapheme boundary (CSS ellipsis kept as a backstop)
        const B = CONFIG.ui.nameFit.button, mc = (ui.measure = ui.measure || document.createElement('canvas').getContext('2d'));
        const f = px => `bold ${px}px ${CONFIG.ui.font}`, avail = B.maxWidth - B.padX * 2 - B.border * 2 - B.iconW - B.gap;
        const fit = fitName(mc, game.player, () => 0, avail, B.fontSize, B.fontSize, 1, f);
        const sp = el('span', 'gg-name', fit.text); ui.playerBtn.title = game.player; ui.playerBtn.setAttribute('aria-label', `Player: ${game.player}`);
        ui.playerBtn.dataset.truncated = fit.truncated ? '1' : '0'; ui.playerBtn.dataset.avail = String(avail);
        ui.playerBtn.append(icon('chip', chipColor(ScoreService.getCurrentProfile().id)), sp);
      }
    }
  }
  // ---- v0.5 'Share score' (game-over only; never restarts; native share -> fallback sheet) -----------------
  const share = { busy: false, card: null, blob: null, key: null, layout: null, frames: new Map(), last: null, toastT: 0 };
  const SHC = () => CONFIG.share;
  function shareInfo() {
    const S = SHC(), look = CONFIG.looks[stage().id] || {}, stageName = look.name || stage().id;
    const vals = { name: game.player || 'Player 1', score: String(game.score), stage: stageName, best: String(game.best) };
    const text = S.template.replace(/\{(name|score|stage|best)\}/g, (m, k) => vals[k]); // QA SH-TPL: replacer fn, so $& / $' in names stay literal
    return Object.freeze({ text, url: S.url, full: `${text} ${S.url}`, stageId: stage().id, stageName, score: game.score, best: game.best,
      player: game.player || 'Player 1', golden: !!(game.golden || (game.death && game.death.golden)) });
  }
  const shareReady = () => SHC().enabled && game.state === 'over' && !deathPlaying() && game.time - restartFrom() >= CONFIG.ui.restartLockout;
  function loadShareLayout() {
    if (share.layout) return Promise.resolve(share.layout);
    const fb = SHC().areas;
    const job = window.fetch ? fetch(SHC().layout).then(r => (r.ok ? r.json() : null)).catch(() => null) : Promise.resolve(null);
    return job.then(j => { const out = {}; for (const k of Object.keys(fb)) out[k] = Object.assign({}, fb[k], j && j.areas && j.areas[k] ? j.areas[k] : {}); share.layout = out; return out; });
  }
  function loadFrame(sid) {
    const S = SHC(), f = S.frameStageFile[sid] || sid;
    const tryLoad = suffix => { const src = S.frameFile.replace('{stage}', suffix); if (share.frames.has(src)) return share.frames.get(src);
      const p = new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; }); share.frames.set(src, p); return p; };
    if ((S.frameGeneric || []).includes(sid)) return tryLoad(''); // v0.6: no Void frame from Art yet
    return tryLoad('-' + f).then(i => i || tryLoad(''));
  }
  function drawnFrame(x, W2, H2, sid) { // pastel fallback when Art's frame is missing
    const pal = CONFIG.transitions.palette[sid] || (CONFIG.looks[sid] || {}).sky || ['#241D40', '#5E4A86'];
    const g = x.createLinearGradient(0, 0, 0, H2); g.addColorStop(0, pal[0]); g.addColorStop(1, pal[1]); x.fillStyle = g; x.fillRect(0, 0, W2, H2);
    const rr = (l, t, w, h, r) => { x.beginPath(); x.moveTo(l + r, t); x.arcTo(l + w, t, l + w, t + h, r); x.arcTo(l + w, t + h, l, t + h, r); x.arcTo(l, t + h, l, t, r); x.arcTo(l, t, l + w, t, r); x.closePath(); };
    x.fillStyle = '#FFF4E6'; rr(50, 40, 500, 640, 40); x.fill(); x.lineWidth = 10; x.strokeStyle = '#F4B6C8'; x.stroke();
    x.lineWidth = 4; x.strokeStyle = '#BFE8D6'; rr(64, 54, 472, 612, 30); x.stroke();
    x.fillStyle = '#E3D4F5'; rr(120, 546, 360, 56, 28); x.fill();
    x.fillStyle = '#FFF4E6'; rr(80, 736, 440, 48, 24); x.fill();
  }
  function fitText(x, s, a, font) {
    const [l, t, w, h] = a.rect; let px = a.maxFont || 28;
    const set = () => { x.font = `${a.weight || 'bold'} ${px}px ${font}`; };
    set(); while (px > 8 && x.measureText(s).width > w) { px -= 1; set(); }
    x.textAlign = 'center'; x.textBaseline = 'middle';
    const cx = l + w / 2, cy = t + h / 2;
    if (a.stroke) { x.lineJoin = 'round'; x.lineWidth = (a.strokeW || 4) * 2; x.strokeStyle = a.stroke; x.strokeText(s, cx, cy); }
    x.fillStyle = a.color || '#4A3358'; x.fillText(s, cx, cy);
    return px;
  }
  async function makeCard(info) {
    const S = SHC(), k = S.card.scale || 2, c = document.createElement('canvas'); c.width = S.card.w * k; c.height = S.card.h * k;
    const x = c.getContext('2d'); x.scale(k, k);
    const [L, frame] = await Promise.all([loadShareLayout(), loadFrame(info.stageId), document.fonts && document.fonts.ready ? document.fonts.ready.catch(() => null) : null]);
    if (frame) x.drawImage(frame, 0, 0, S.card.w, S.card.h); else drawnFrame(x, S.card.w, S.card.h, info.stageId);
    const img = sprites.ghost[info.golden ? 'golden' : 'normal'], [gl, gt, gw, gh] = L.ghost.rect;
    if (img) { const fs = img.height, d = Math.min(gw, gh) * 0.96; x.imageSmoothingQuality = 'high'; x.drawImage(img, 0, 0, fs, fs, gl + (gw - d) / 2, gt + (gh - d) / 2, d, d); }
    else { x.fillStyle = info.golden ? CONFIG.colors.ghostGolden : '#ffffff'; x.beginPath(); x.arc(gl + gw / 2, gt + gh / 2, gw * 0.35, 0, TAU); x.fill(); }
    const f = S.font, fit = {};
    fit.stage = fitText(x, info.stageName, L.stage, f);
    fit.score = fitText(x, String(info.score), L.score, f);
    fit.best = fitText(x, `Best ${info.best}`, L.best, f);
    fit.player = fitText(x, info.player, L.player, f);
    fit.url = fitText(x, info.url.replace(/^https?:\/\//, '').replace(/\/$/, ''), L.url, f);
    share.cardMeta = { w: c.width, h: c.height, frame: frame ? frame.src.split('/').pop() : 'drawn', golden: info.golden, fit };
    return c;
  }
  function prepareCard() { // built once per game over, after the death anim, so the tap handler can share synchronously
    const info = shareInfo(), key = JSON.stringify(info);
    if (share.key === key) return share.job;
    share.key = key; share.blob = null; share.card = null;
    share.job = makeCard(info).then(c => new Promise(r => c.toBlob(b => { if (share.key === key) { share.card = c; share.blob = b; } r(b); }, 'image/png')))
      .catch(() => null);
    return share.job;
  }
  async function doShare() {
    if (!shareReady() || share.busy) return;
    share.busy = true;
    const info = shareInfo();
    const last = share.last = { info, path: null, result: null, size: 0, at: Date.now() };
    try {
      const blob = share.blob || (await prepareCard());
      last.size = blob ? blob.size : 0;
      if (navigator.share) {
        const base = { title: SHC().title, text: info.text, url: info.url };
        let data = base;
        if (blob && typeof File === 'function' && typeof navigator.canShare === 'function') {
          try { const d2 = Object.assign({}, base, { files: [new File([blob], SHC().fileName, { type: 'image/png' })] }); if (navigator.canShare(d2)) data = d2; } catch (e) { /* no file sharing */ }
        }
        last.path = data.files ? 'native-files' : 'native-text';
        try { await navigator.share(data); last.result = 'shared'; }
        catch (e) {
          if (e && e.name === 'AbortError') { last.result = 'aborted'; return; } // user cancelled: stay silent
          last.result = 'failed'; openShareSheet(info, blob);
        }
        return;
      }
      last.path = 'sheet'; openShareSheet(info, blob);
    } finally { share.busy = false; }
  }
  function shareLinks(info) {
    const I = SHC().intents, e = encodeURIComponent, fill = t => t.replace(/\{(text|url|full)\}/g, (m, k) => e(info[k]));
    return { x: fill(I.x), facebook: fill(I.facebook), whatsapp: fill(I.whatsapp) };
  }
  async function copyText(t) {
    try { if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(t); return 'clipboard'; } } catch (e) { /* fall through */ }
    try {
      const ta = el('textarea'); ta.value = t; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
      document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, t.length); const ok = document.execCommand('copy'); ta.remove();
      return ok ? 'execCommand' : null;
    } catch (e) { return null; }
  }
  function toast(msg) {
    if (!ui.toast) { ui.toast = el('div', 'gg-ui gg-toast'); ui.toast.id = 'gg-toast'; ui.toast.setAttribute('role', 'status'); document.body.appendChild(ui.toast); }
    ui.toast.textContent = msg; ui.toast.style.display = 'block';
    clearTimeout(share.toastT); share.toastT = setTimeout(() => { ui.toast.style.display = 'none'; }, SHC().toastSeconds * 1000);
  }
  function openShareSheet(info, blob) {
    ui.open = 'share'; ui.panel.textContent = '';
    ui.panel.appendChild(el('h2', null, 'Share score'));
    const list = el('div', 'gg-list gg-share'); list.id = 'gg-share';
    const links = shareLinks(info);
    for (const [id, label] of [['x', 'X'], ['facebook', 'Facebook'], ['whatsapp', 'WhatsApp']]) {
      const a = el('a', 'gg-item gg-share-link', null); a.append(el('span', null, label)); a.id = 'gg-share-' + id;
      a.href = links[id]; a.target = '_blank'; a.rel = 'noopener noreferrer'; list.appendChild(a);
    }
    const copy = el('button', 'gg-item'); copy.type = 'button'; copy.id = 'gg-share-copy'; copy.append(el('span', null, 'Copy link/text'));
    copy.addEventListener('click', async () => { const how = await copyText(info.full); if (share.last) share.last.copied = how; toast(how ? 'Copied!' : 'Copy failed'); });
    const save = el('button', 'gg-item'); save.type = 'button'; save.id = 'gg-share-save'; save.append(el('span', null, 'Save image'));
    save.addEventListener('click', async () => {
      const b = blob || share.blob || (await prepareCard()); if (!b) { toast('Image not ready'); return; }
      const u = URL.createObjectURL(b), a = el('a'); a.href = u; a.download = SHC().fileName; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(u), 4000); if (share.last) share.last.saved = b.size;
    });
    list.append(copy, save);
    const close = el('button', 'gg-btn gg-close', 'Close'); close.type = 'button'; close.addEventListener('click', closeUi);
    ui.panel.append(list, close);
    ui.modal.style.display = 'flex'; fitNameSpans();
  }
  buildUi();
  if (DEBUG) game._share = { shareInfo, shareReady, makeCard, prepareCard, doShare, shareLinks, copyText, openShareSheet, state: share };

  // ---- Main loop --------------------------------------------------------------------------------
  let lastT = performance.now();
  function frame(now) {
    const interval = now - lastT;
    const dt = Math.min(CONFIG.world.maxDt, Math.max(0, interval / 1000));
    lastT = now;
    const t0 = performance.now();
    if (!game.paused) update(dt);
    draw();
    syncUi();
    prewarm();
    const cost = performance.now() - t0;
    if (game.state === 'playing') {
      const pf = game.perf;
      pf.frames++; pf.costSum += cost; pf.costMax = Math.max(pf.costMax, cost);
      pf.intervalSum += interval; pf.intervalMax = Math.max(pf.intervalMax, interval);
      pf.costs.push(cost); if (pf.costs.length > 1200) pf.costs.shift();
    }
    requestAnimationFrame(frame);
  }

  initAmbient();
  requestAnimationFrame(frame);
  preload().then(() => reset());
})();
