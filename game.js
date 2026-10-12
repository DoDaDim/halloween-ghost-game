// =============================================================================
// Ghost Flap v0.3 — Halloween Flappy-style kawaii ghost game
// All tunables live in CONFIG (docs/TUNING.md v1.0–v1.7, plus build-only keys
// marked [build]). Game logic reads every number from CONFIG.
// Units: logical pixels (360x640 playfield) and seconds.
// PROGRESSION counts PAIRS PASSED (TUNING v1.7): gapFor/spacingFor/speedFor, unlockAt,
// startAt, launch.atScore, events firesAt/repeatEvery, hazards/golden minScore are all in pairs.
// Score (with bonuses) is only for display, best score and medals.
// QA hooks (query string): ?stage=N|id  ?event=hearse|rocket|<id>  ?pickup=1|all
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
    loopFrom: 'space', // final stage, endless
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
    },
    perStage: {
      graveyard:   { chance: 0.15, mix: { skull: 2, pumpkin: 1 } },
      church:      { chance: 0.20, mix: { bat: 2, skull: 1 } },
      countryside: { chance: 0.25, mix: { pumpkin: 2, bat: 1 } },
      school:      { chance: 0.30, mix: { bat: 1, pumpkin: 1, skull: 1 } },
      city:        { chance: 0.35, mix: { bat: 2, skull: 2, pumpkin: 1 } },
      space:       { chance: 0.35, mix: { miniAsteroid: 2, alien: 1 } },
    },
    noHazardDuring: ['transition', 'event', 'goldenPickupPair'],
  },

  launch: {
    atScore: 100,            // in PAIRS (v1.7); = stages[space].startAt
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

  golden: {
    run: { enabled: true, chance: 0.04, scoreMultiplier: 2, firstPointBonus: 10 }, // kept per Boss/David
    maxMultiplier: 2,                   // run x2 and pickup x2 don't stack (null = allow stacking)
    pickupOnGoldenRun: 'doubleInstant', // golden run: pickup pays 2x instant points, no x2 mode
    pickup: {
      minScore: 3,           // in PAIRS (v1.7)
      chancePerPair: 0.06,
      minPairsBetween: 12,
      pityAfterPairs: 30,
      radius: 16,
      placement: 'gapCentre',
      instantPoints: 5,
      space: { chancePerPair: 0.08, minPairsBetween: 10, pityAfterPairs: 25, instantPoints: 10 },
      drawSize: 44,        // [build] drawn size of the floating golden ghost
    },
    mode: { seconds: 8, scoreMultiplier: 2, extendOnPickup: true },
    sparkleRate: 18,       // [build]
    sparkleLife: 0.6,      // [build]
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
      space:       { id: 'meteorShower', firesAt: 120, repeatEvery: 30, seconds: 4.0, bonus: 8,
                     // [build] 2 diagonal waves, each a curtain of meteors with one clear lane
                     waves: 2, waveCrossAt: [1.0, 2.6], laneHeight: 170, spacing: 50,
                     vx: -320, vy: 160, laneShiftMin: 60, laneShiftMax: 120, laneMinY: 140, laneMaxY: 420,
                     desc: 'Meteors streak diagonally from top-right in 2 waves with a clear lane between; hold the lane.' },
    },
  },

  scoring: {
    perPair: 1,
    medals: { bronze: 10, silver: 25, gold: 50, pumpkin: 100 },
    bestKey: 'ghostGame.best',
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
  },
  objectAliases: { asteroid: 'moonrock', 'tree-branch': 'branch', 'crane-hook': 'cranehook' }, // [build] old ids (TUNING <= v1.7)
  // v1.8 collision rule: each column's hitbox must be unbroken from the screen edge to its gap edge.
  // Checked per id at load; any vertical break -> console.warn + a full-width rect for that id.
  hitboxContinuity: { enabled: true },

  // [build] decorative per-stage effects: no collision, pooled, capped
  // v0.3.1 rendering budget (QA P1)
  render: {
    maxDpr: 2,             // backing store capped at 2x CSS px even on DPR-3 phones
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
  },

  // [build] placeholder looks per stage (parallax silhouettes until Art backgrounds exist)
  looks: {
    graveyard:   { name: 'The Graveyard', sky: ['#1e1433', '#4a3270'], celestial: 'moon', ground: '#3b2a55', groundTop: '#6b5394', layers: ['#3a2a5c', '#30224d', '#271b40'] },
    church:      { name: 'The Old Church', sky: ['#1d1838', '#51407a'], celestial: 'moon', ground: '#3d2f52', groundTop: '#7a6a9c', layers: ['#3b3163', '#322853', '#291f45'] },
    countryside: { name: 'Countryside', sky: ['#18213d', '#3f4d7a'], celestial: 'moon', ground: '#2f3d4a', groundTop: '#5f8a7a', layers: ['#2c3a5e', '#25314f', '#1e2842'] },
    school:      { name: 'School Town', sky: ['#22183a', '#5a3f72'], celestial: 'moon', ground: '#3c2f4f', groundTop: '#8a6f9c', layers: ['#3d2f5e', '#33264f', '#2a1f42'] },
    city:        { name: 'Big City', sky: ['#141428', '#3c2f5e'], celestial: 'moon', ground: '#2c2a3e', groundTop: '#5c5a7a', layers: ['#2a2848', '#22203d', '#1b1a33'] },
    space:       { name: 'Outer Space', sky: ['#05040f', '#1c1238'], celestial: 'planet', ground: '#4a4560', groundTop: '#7d7896', layers: ['#ffffff', '#c9b3f0', '#6c6488'] },
  },

  ui: {
    tapCueSeconds: 1.0,    // v0.3.1: 'Tap!' cue when the ghost pops out after the rocket
    restartLockout: 0.4,
    font: '"Trebuchet MS", "Arial Rounded MT Bold", system-ui, sans-serif',
    starCount: 40,
    floatTextSeconds: 1.1,
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
    },
    backgrounds: {
      load: true,            // only stages listed in hitboxes.json backgrounds.stages are fetched (no 404s)
      file: 'bg-{stage}-{layer}.png', // Art: 720x640 world px tiles in png/{1x,2x}/, scroll horizontally
      tileWidth: 720,
      layers: ['far', 'mid', 'near'],
      parallax: { far: 0.1, mid: 0.3, near: 0.6 },              // Art's scroll factors
      parallaxByStage: { space: { far: 0.05, mid: 0.15, near: 0.5 } },
      transFile: 'bg-trans-{from}-{to}-{layer}.png', // used at each layer's next tile edge (ASSETS.md §7a)
      transMaxSeconds: 3,    // mid/far: use the transition tile only if the next edge is this close...
      fadeSeconds: 1.5,      // ...otherwise crossfade outgoing -> incoming tiles over this long
      alwaysTransLayers: ['near'],
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
  },
};

// ---- Derived difficulty helpers (TUNING.md) -----------------------------------
const gapFor = s => Math.max(CONFIG.tombstones.gapMin, CONFIG.tombstones.gapStart - Math.floor(s / 10) * CONFIG.tombstones.gapShrinkPer10);
const spacingFor = s => Math.max(CONFIG.tombstones.spacingMin, CONFIG.tombstones.spacingStart - Math.floor(s / 10) * CONFIG.tombstones.spacingShrinkPer10);
const speedFor = s => Math.min(CONFIG.speed.max, CONFIG.speed.start + Math.floor(s / CONFIG.speed.stepEvery) * CONFIG.speed.stepAmount);

// =============================================================================
// ScoreService — score persistence + game-over hook, kept apart from game logic.
// Public API (window.ScoreService): getBest(), submitScore(name, score) (stub),
// addGameOverListener(fn). Saving a best is INTERNAL: the game claims the
// internal functions once at startup (claimInternal), so console code can't
// call saveBest/onGameOver with an arbitrary value when debug is off. With debug
// on, the game re-exposes saveBest/onGameOver/onGameOverListeners for QA.
// NOTE: localStorage itself can still be edited by a player; real protection
// for a leaderboard needs server-side validation (not attempted here).
// =============================================================================
const ScoreService = (() => {
  const key = () => CONFIG.scoring.bestKey;
  const listeners = [];
  let mem = 0; // in-memory best (closure): survives when localStorage throws (QA B6)
  function getBest() {
    let stored = 0;
    try { stored = parseInt(localStorage.getItem(key()), 10) || 0; } catch (e) { stored = 0; }
    return Math.max(mem, stored);
  }
  /** Saves score if it beats the best (memory always, storage when available). Returns true on a new best. */
  function saveBest(score) {
    if (!(score > getBest())) return false;
    mem = score;
    try { localStorage.setItem(key(), String(score)); } catch (e) { /* storage unavailable: memory keeps it */ }
    return true;
  }
  /** Called once by the game when a run ends. Returns { best, newBest }. */
  function onGameOver(score, meta = {}) {
    const newBest = saveBest(score);
    const best = Math.max(score, getBest());
    // QA DG9: listeners get a frozen COPY; the game's values below never come from it
    const shared = Object.freeze({ score, best, newBest, ...meta });
    for (const fn of listeners) {
      try { fn(shared); } catch (e) { console.warn('onGameOver listener failed', e); }
    }
    return { best, newBest };
  }
  let claimed = false;
  const svc = {
    getBest,
    /** Stub for a future online leaderboard. Resolves without sending anything. */
    submitScore(name, score) {
      return Promise.resolve({ ok: false, submitted: false, reason: 'not-implemented', name, score });
    },
    /** Extra game-over callbacks: fn({ score, best, newBest, golden, stage }). */
    addGameOverListener(fn) { if (typeof fn === 'function') listeners.push(fn); },
    /** One-shot: the game takes the internal functions at startup; later calls get null. */
    claimInternal() {
      if (claimed) return null;
      claimed = true;
      return { saveBest, onGameOver, listeners };
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
  const qaPickup = qp('pickup'); // '1' = next pair, 'all' = every pair
  const qaGod = qp('god') === '1';
  const effectsOn = CONFIG.ambient.enabled && qp('effects') !== '0';

  const STAGES = CONFIG.stages.list;
  const stageIndexById = id => STAGES.findIndex(s => s.id === id);
  for (const st of STAGES) for (const side of ['top', 'bottom']) for (const id of Object.keys(st[side] || {})) { // v0.4: side-specific sets
    const o = CONFIG.objects[CONFIG.objectAliases[id] || id];
    if (!o || o.side !== side) console.warn(`[stages] ${st.id}.${side}: '${id}' is ${o ? 'a ' + o.side + ' object' : 'not in CONFIG.objects'}`);
  }
  function stageIndexForPairs(pairs) {
    let idx = 0;
    STAGES.forEach((s, i) => { if (pairs >= s.startAt) idx = i; });
    return idx;
  }
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
    res: 1,
    ghost: { normal: null, golden: null },
    sets: {},          // column sets by object id: { body, capTop, capBottom, bodyPattern, hb, floorEdge, ceilEdge }
    tombVariants: [],  // tomb object ids that loaded completely
    sheets: {},        // name -> { img, def, json }
    bg: {},            // `${stage}-${layer}` -> image
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
      const artId = id => (A.backgrounds.artStageIds || {})[id] || id;
      if (A.backgrounds.load) {
        for (const st of STAGES) for (const layer of A.backgrounds.layers) {
          if (!bgList.includes(artId(st.id))) continue;
          const f = A.backgrounds.file.replace('{stage}', artId(st.id)).replace('{layer}', layer);
          jobs.push(loadImage(dir + f).then(img => { if (img) sprites.bg[`${st.id}-${layer}`] = img; }));
        }
        const transList = (hb && hb.backgrounds && hb.backgrounds.transitions) || [];
        for (let i = 0; i + 1 < STAGES.length; i++) for (const layer of A.backgrounds.layers) {
          const a = STAGES[i].id, b = STAGES[i + 1].id;
          if (!transList.includes(`bg-trans-${artId(a)}-${artId(b)}-*`)) continue; // city -> space: the rocket cutscene is the transition
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
    });
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
    newBest: false,
    golden: false,           // golden RUN (per-run roll)
    goldenModeT: 0,          // seconds of pickup golden mode left
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
    ['state', 'score', 'best', 'pairs', 'golden'].map(k => [k, { get: () => game[k], enumerable: true }]).concat([['stage', { get: () => STAGES[game.stageIndex].id, enumerable: true }]]))));
  game.debug = DEBUG;
  Object.defineProperty(game, 'hitbox', { get: () => ({ radius: hitboxRadius, offsetY: hitboxOffsetY, source: hitboxSource }) });
  Object.defineProperty(game, 'stage', { get: () => STAGES[game.stageIndex].id });
  game.sprites = sprites;

  const stage = () => STAGES[game.stageIndex];
  function physics() { // stage override (space) merged over CONFIG.ghost
    return Object.assign({}, CONFIG.ghost, stage().physics || {});
  }
  function pickupCfg() {
    const P = CONFIG.golden.pickup;
    return Object.assign({}, P, (P[stage().id] && typeof P[stage().id] === 'object') ? P[stage().id] : {});
  }
  function multiplier() {
    const runM = game.golden ? CONFIG.golden.run.scoreMultiplier : 1;
    const modeM = game.goldenModeT > 0 ? CONFIG.golden.mode.scoreMultiplier : 1;
    const m = runM * modeM;
    return CONFIG.golden.maxMultiplier != null ? Math.min(CONFIG.golden.maxMultiplier, m) : m;
  }
  function speedHoldActive() {
    if (CONFIG.stages.transition.speedHoldPairs > 0 && game.speedHoldPairsLeft > 0) return true;
    if (CONFIG.events.speedHold && game.event && game.event.phase !== 'waiting') return true;
    return false;
  }
  function currentSpeed() {
    return speedFor(speedHoldActive() ? game.speedHoldPairs : game.pairs);
  }
  const transitionActive = () => (game.banner && game.banner.t < CONFIG.stages.transition.bannerSeconds) || game.easyLeft > 0 || game.skipSlots > 0 || !!game.cutscene;

  function centreRange() {
    return { min: CONFIG.tombstones.edgeMargin, max: H - CONFIG.tombstones.edgeMargin - CONFIG.world.groundHeight };
  }

  function scheduleZoneEvent() {
    const def = CONFIG.events.list[stage().id];
    game.eventNext = def ? { zone: stage().id, score: def.firesAt, def } : null;
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

  function startBreather() {
    const T = CONFIG.stages.transition;
    game.banner = { text: CONFIG.looks[stage().id].name, t: 0 };
    game.queue.length = 0; // drop leftover breathers; the transition is the breather
    game.easyLeft = T.easyPairs;
    game.skipSlots = T.emptySlots;
  }

  function reset() {
    game.state = 'ready';
    game.paused = false;
    game.newBest = false;
    game.golden = forceGolden !== null ? forceGolden : (CONFIG.golden.run.enabled && Math.random() < CONFIG.golden.run.chance);
    game.goldenModeT = 0;
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
    game.cutscene = null;
    game.tapCue = 0;
    game.pairsSincePickup = 0;
    game.forcePickupNext = qaPickup === '1';
    game.sparkles.length = 0; game.sparkleAcc = 0; game.poofs.length = 0; game.floatTexts.length = 0;
    game.flash = 0; game.hits = []; game.cutsceneHitChecks = 0;
    game.stats = { pairs: 0, pickups: 0, pickupsTaken: 0, hazards: [], spawned: [] };
    const qs = parseStage(qaStage);
    const startIdx = qs != null ? qs : 0;
    game.score = 0;
    game.pairs = STAGES[startIdx].startAt; // QA hooks set PAIRS
    game.physAcc = 0;
    game.stageIndex = startIdx;
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
      for (let i = 0; i < CONFIG.patterns.breatherPairs; i++) {
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
    const gap = gapFor(game.pairs) + (entry.easy ? CONFIG.stages.transition.easyGapBonus : 0);
    const p = {
      x, centre: entry.centre, gap, passed: false, pattern: entry.pattern || 'random', easy: !!entry.easy, stage: st.id,
      top: resolveColumn(weightedPick(st.top), 'top'),
      bottom: resolveColumn(weightedPick(bottomWeights(st)), 'bottom'),
      pickup: null,
    };
    // golden pickup roll
    const P = pickupCfg();
    game.pairsSincePickup++;
    let pick = false;
    if (qaPickup === 'all' || game.forcePickupNext) pick = true;
    else if (game.pairs >= P.minScore && game.pairsSincePickup >= P.minPairsBetween &&
             (Math.random() < P.chancePerPair || game.pairsSincePickup >= P.pityAfterPairs)) pick = true;
    if (pick) {
      p.pickup = { dx: CONFIG.tombstones.width / 2, y: p.centre, taken: false };
      game.pairsSincePickup = 0;
      game.forcePickupNext = false;
      game.stats.pickups++;
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
    // batSwarm, pumpkinRoll, sweetShower, nightBus: TODO(v0.4) — stubs (logged only)
  };

  function updateEvent(dt) {
    const ev = game.event;
    if (!ev) return;
    const handler = EVENTS[ev.id];
    const G = CONFIG.ghost, tw = CONFIG.tombstones.width;
    ev.t += dt;
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
        game.slotX = W + CONFIG.tombstones.spawnMargin - spacingFor(game.pairs); // resume right away
        game.lastSlotWasPair = false;
      }
    }
  }

  // ---- Launch cutscene ------------------------------------------------------------------
  function startLaunch() {
    for (const p of game.cols) poof(p.x + CONFIG.tombstones.width / 2, p.centre);
    for (const h of game.hazards) poof(h.x, hazardY(h, game.time));
    game.cols.length = 0; game.hazards.length = 0; game.queue.length = 0;
    game.pendingStage = null; game.skipSlots = 0; game.easyLeft = 0;
    if (game.event) { game.eventLog.push({ id: game.event.id, zone: game.event.zone, scheduled: game.event.scheduled, pairs: game.pairs, status: 'cancelled' }); game.event = null; }
    game.eventDue = null;
    const CL = CONFIG.launch.clouds;
    game.cutscene = { t: 0, startY: game.ghost.y, switched: false, speeds: [], from: stage().id, smoke: [], smokeAcc: 0,
      clouds: Array.from({ length: CL.count }, (_, i) => ({ x: rand(-40, W - 120), at: i / CL.count, v: rand(CL.speedMin, CL.speedMax), kind: ['cloudA', 'cloudB', 'cloudC'][i % 3] })) };
    game.launches++;
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
      game.slotX = W + CONFIG.tombstones.spawnMargin - spacingFor(game.pairs); // first slot = the empty slot
      game.lastSlotWasPair = false;
      game.lastCompletedCutscene = { speeds: c.speeds };
    }
  }

  // ---- Progress checks (stage / launch / events) -------------------------------------------
  function checkProgress() {
    if (game.cutscene) return;
    const target = stageIndexForPairs(game.pairs);
    const launchIdx = stageIndexById(CONFIG.stages.loopFrom);
    if (launchIdx >= 0 && target === launchIdx && game.stageIndex < launchIdx && game.pairs >= CONFIG.launch.atScore) {
      startLaunch(); return; // rocket launch into the final zone (pairs cleared, no waiting)
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
  function onPress() {
    if (game.state === 'loading') return;
    if (game.paused) { game.paused = false; lastT = performance.now(); return; }
    if (game.state === 'ready') {
      game.state = 'playing';
      flap();
      if (qaEvent === 'rocket') { game.pairs = Math.max(game.pairs, CONFIG.launch.atScore); }
    } else if (game.state === 'playing') {
      if (game.cutscene) return; // taps ignored during the launch cutscene
      flap();
    } else if (game.state === 'over') {
      if (game.time - game.deadTime >= CONFIG.ui.restartLockout) reset();
    }
  }
  canvas.addEventListener('pointerdown', e => { e.preventDefault(); onPress(); });
  window.addEventListener('pointerdown', e => { if (e.target !== canvas) { e.preventDefault(); onPress(); } });
  window.addEventListener('keydown', e => {
    if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); if (!e.repeat) onPress(); }
  });
  ['touchstart', 'touchmove', 'gesturestart', 'dblclick', 'contextmenu'].forEach(t =>
    window.addEventListener(t, e => e.preventDefault(), { passive: false }));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && game.state === 'playing') game.paused = true;
    lastT = performance.now();
  });

  // ---- Scoring / death --------------------------------------------------------------------
  function die(cause) {
    if (game.god) { if (!game.hits.length || game.time - game.hits[game.hits.length - 1].t > 0.3) game.hits.push({ cause, t: game.time, pairs: game.pairs, stage: stage().id, cutscene: !!game.cutscene }); return; }
    game.state = 'over';
    game.deadTime = game.time;
    game.flash = 1;
    game.deathCause = cause;
    if (game.event) { game.eventLog.push({ id: game.event.id, zone: game.event.zone, scheduled: game.event.scheduled, pairs: game.pairs, status: 'died' }); }
    const res = SS.onGameOver(game.score, { golden: game.golden, stage: stage().id });
    game.best = res.best;
    game.newBest = res.newBest;
  }
  function addPoint() {
    let pts = CONFIG.scoring.perPair * multiplier();
    if (game.golden && !game.firstPointGiven) pts += CONFIG.golden.run.firstPointBonus;
    game.firstPointGiven = true;
    game.score += pts;
    game.pairs += 1; // progression counter: one per pair, regardless of bonuses
  }
  function collectPickup(p) {
    const P = pickupCfg();
    p.pickup.taken = true;
    game.stats.pickupsTaken++;
    const onRun = game.golden && CONFIG.golden.pickupOnGoldenRun === 'doubleInstant';
    const pts = P.instantPoints * (onRun ? 2 : 1);
    game.score += pts;
    if (!onRun) {
      const M = CONFIG.golden.mode;
      game.goldenModeT = M.extendOnPickup ? game.goldenModeT + M.seconds : Math.max(game.goldenModeT, M.seconds);
    }
    floatText(`+${pts}${onRun ? '' : '  x2!'}`, CONFIG.ghost.x + 30, p.pickup.y - 30, CONFIG.colors.ghostGolden);
    for (let i = 0; i < 12; i++) game.sparkles.push({ x: p.x + p.pickup.dx, y: p.pickup.y, vx: rand(-90, 90), vy: rand(-90, 90), life: CONFIG.golden.sparkleLife });
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
    if (game.state === 'over') return;

    // --- playing ---
    const speed = (game.speed = currentSpeed());
    game.dist += speed * dt;
    if (game.cutscene) {
      updateCutscene(dt);
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

    for (const p of game.cols) p.x -= speed * dt;
    for (const h of game.hazards) h.x -= speed * dt;
    while (game.cols.length && game.cols[0].x + tw < -20) game.cols.shift();
    while (game.hazards.length && game.hazards[0].x + game.hazards[0].r < -20) game.hazards.shift();
    if (game.slotX !== null) game.slotX -= speed * dt;

    if (!game.cutscene) {
      // spawning
      if (!game.event) {
        if (game.slotX === null) {
          game.spawnTimer -= dt;
          if (game.spawnTimer <= 0) spawnSlot(W + CONFIG.tombstones.spawnMargin);
        } else {
          const spacing = spacingFor(game.pairs) + (peekEntry().spacingDelta || 0);
          if (game.slotX + spacing <= W + CONFIG.tombstones.spawnMargin) spawnSlot(game.slotX + spacing);
        }
      }
      updateEvent(dt);

      // scoring + collisions
      const r = hitboxRadius, hy = g.y + hitboxOffsetY;
      for (const p of game.cols) {
        if (!p.passed && G.x > p.x + tw) { p.passed = true; addPoint(); }
        if (p.pickup && !p.pickup.taken) {
          const dx = G.x - (p.x + p.pickup.dx), dy = hy - p.pickup.y, rr = pickupCfg().radius + r;
          if (dx * dx + dy * dy < rr * rr) collectPickup(p);
        }
        if (pairHits(p, G.x, hy, r)) { die('column'); if (game.state !== 'playing') return; }
      }
      for (const h of game.hazards) {
        const dx = G.x - h.x, dy = hy - hazardY(h, game.time), rr = h.r + r;
        if (dx * dx + dy * dy < rr * rr) { die('hazard:' + h.type); if (game.state !== 'playing') return; }
      }
      if (game.event && game.event.phase === 'active' && EVENTS[game.event.id].hits(game.event, G.x, hy, r)) {
        die('event:' + game.event.id); if (game.state !== 'playing') return;
      }
      if (hy - r <= 0 || hy + r >= GROUND_Y) {
        if (!game.god) g.y = g.prevY = clamp(hy, r, GROUND_Y - r) - hitboxOffsetY;
        else { g.y = g.prevY = clamp(g.y, r - hitboxOffsetY + 1, GROUND_Y - r - hitboxOffsetY - 1); g.vy = 0; }
        die(hy - r <= 0 ? 'ceiling' : 'ground');
        if (game.state !== 'playing') return;
      }
      if (game.goldenModeT > 0) game.goldenModeT = Math.max(0, game.goldenModeT - dt);
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
  const artBg = id => !!(sprites.bg[`${id}-far`] && sprites.bg[`${id}-mid`] && sprites.bg[`${id}-near`]);
  const bgFactor = (id, layer) => { const B = A.backgrounds; return ((B.parallaxByStage[id] || {})[layer]) || B.parallax[layer]; };
  function updateBgLayers(dt) {
    const B = A.backgrounds, TW = B.tileWidth, id = stage().id;
    for (const layer of B.layers) {
      let st = bgState[layer];
      if (!st) st = bgState[layer] = { cur: id, base: game.dist, trans: null, fade: null };
      if (st.cur !== id) {
        const from = st.cur, tile = sprites.bg[`trans-${from}-${id}-${layer}`];
        if (game.state !== 'playing' || game.cutscene || bgFactor(from, layer) !== bgFactor(id, layer)) {
          Object.assign(st, { cur: id, base: game.dist, trans: null, fade: null }); // QA jump or after the launch: offset 0
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
  let building = null, pumpScheduled = false, frameKeys = new Set(), lastFrameKeys = new Set();
  const layerScale = key => (key === 'launchSky' ? CONFIG.render.skyScale : /-far$/.test(key) ? CONFIG.render.farLayerScale : 1);
  function layerSrc(key) {
    const sky = key === 'launchSky';
    const img = sky ? sprites.sheets.launchSky && sprites.sheets.launchSky.img : sprites.bg[key];
    if (!img) return null;
    const ww = sky ? W : A.backgrounds.tileWidth, wh = sky ? sprites.sheets.launchSky.def.h : H;
    const [y0, y1] = sky ? [0, wh] : opaqueRows(key, img, wh);
    return { img, ww, wh, y0, y1 };
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
      layerCache.set(key, { img: bm, y0: src.y0, dw, dh, sc, bytes: bm.width * bm.height * 4 });
      game.stats.layerBuilds = (game.stats.layerBuilds || 0) + 1;
      if (DEBUG) (game.stats.buildLog = game.stats.buildLog || []).push([key, Math.round(game.dist), +(performance.now() - t0).toFixed(1)]);
      game.stats.layerBuildMs = Math.max(game.stats.layerBuildMs || 0, performance.now() - t0);
      evictLayers();
      schedulePump();
    });
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
  function prewarmKeys() { // per layer: while it transitions keep from+trans+cur, once settled cur+next+trans (<= 3 per layer)
    const B = A.backgrounds, cur = stage().id, keys = [];
    const next = STAGES[game.stageIndex + 1], launchNext = next && next.id === CONFIG.stages.loopFrom;
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
      if (next) { keys.push(`${next.id}-${l}`); if (!launchNext) keys.push(`trans-${cur}-${next.id}-${l}`); }
    }
    if (launchNext && B.layers.every(l => keys.includes(`${next.id}-${l}`))) keys.push('launchSky');
    return keys.filter(k => (k === 'launchSky' ? sprites.sheets.launchSky : sprites.bg[k]));
  }
  function prewarm() { // queue (never build inline) everything the next stage change will need
    if (game.state === 'loading' || !artBg(stage().id)) return;
    const sc = canvas.height / H;
    for (const k of prewarmKeys()) { const e = layerCache.get(k); if (!(e && e.sc === sc) && building !== k && !buildQueue.includes(k)) buildQueue.push(k); }
    if (buildQueue.length) schedulePump();
    lastFrameKeys = frameKeys; frameKeys = new Set();
  }
  function drawArtBackground(id) {
    const B = A.backgrounds, TW = B.tileWidth, m = ctx.getTransform(), sc = m.a, cwMax = canvas.width;
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
        for (const [key, al] of keyB ? [[keyA, 1], [keyB, a]] : [[keyA, 1]]) {
          const e = getLayer(key);
          if (e) { blit(e, dx, Math.round(m.f + e.y0 * m.d), al); continue; }
          // not cached yet (first frames, or right after a resize): draw straight from the source image
          const img = sprites.bg[key];
          ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); if (al < 1) ctx.globalAlpha *= al;
          ctx.drawImage(img, dx, Math.round(m.f), tw, Math.round(H * m.d)); ctx.restore();
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
    if (look.celestial === 'planet') {
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
        for (let y = originY + Math.floor((y0 - originY) / bodyH) * bodyH; y < y1; y += bodyH) { const a = sn(y), b = sn(y + bodyH); ctx.drawImage(t.body, L.sx, a, w, b - a + 1 / m2.d); }
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
        if (col.set) drawSpriteColumn(p, side); else drawShapeColumn(p, side);
      }
    }
  }

  // ---- Hazards / pickups / events --------------------------------------------------------------
  function drawHazards() {
    for (const h of game.hazards) {
      const y = hazardY(h, game.time), sh = sprites.sheets[h.type];
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
        case 'alien':
          ctx.fillStyle = c.alien; ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.9, 0, 0, TAU); ctx.fill();
          ctx.strokeStyle = c.alien; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-5, -r + 2); ctx.lineTo(-8, -r - 6); ctx.moveTo(5, -r + 2); ctx.lineTo(8, -r - 6); ctx.stroke();
          ctx.fillStyle = '#2b1d3d'; ctx.beginPath(); ctx.ellipse(0, -1, 5, 6, 0, 0, TAU); ctx.fill(); break;
      }
      ctx.restore();
    }
  }
  function drawPickups() {
    for (const p of game.cols) {
      if (!p.pickup || p.pickup.taken) continue;
      const x = p.x + p.pickup.dx, y = p.pickup.y;
      const nm = stage().id === 'space' && sprites.sheets.goldenPickupSpace ? 'goldenPickupSpace' : 'goldenPickup', sh = sprites.sheets[nm];
      if (sh) { const j = sh.json; drawSheet(nm, x - (j.cx || 28), y - (j.cy || 28), game.time); continue; }
      const size = CONFIG.golden.pickup.drawSize, strip = sprites.ghost.golden;
      ctx.fillStyle = 'rgba(255, 224, 138, 0.3)'; ctx.beginPath(); ctx.arc(x, y, size * 0.55 + Math.sin(game.time * 5) * 2, 0, TAU); ctx.fill();
      if (strip) { const fs = A.ghost.frameSize * sprites.res; ctx.drawImage(strip, 0, 0, fs, fs, x - size / 2, y - size / 2 + Math.sin(game.time * 4) * 2, size, size); }
      else { ctx.fillStyle = CONFIG.colors.ghostGolden; ctx.beginPath(); ctx.arc(x, y, CONFIG.golden.pickup.radius, 0, TAU); ctx.fill(); }
    }
  }
  function drawEvent() {
    const ev = game.event;
    if (!ev) return;
    const handler = EVENTS[ev.id];
    if (ev.phase === 'warning') {
      const lane = handler.lane(ev);
      const on = Math.floor(ev.t * 8) % 2 === 0;
      if (!drawSheet('warning', W - 46, lane.y - 20, ev.t)) {
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
    if (ev.phase === 'active' && ev.id === 'hearse') {
      const d = ev.data, top = GROUND_Y - d.h;
      if (d.sprite) { drawSheet('hearse', d.x, top, ev.t); return; }
      const c = CONFIG.colors;
      ctx.fillStyle = c.hearse; ctx.beginPath(); ctx.moveTo(d.x + 4, GROUND_Y - 10); ctx.lineTo(d.x + 4, top + 24); ctx.lineTo(d.x + 34, top + 4); ctx.lineTo(d.x + d.w - 8, top + 4); ctx.lineTo(d.x + d.w - 2, GROUND_Y - 10); ctx.closePath(); ctx.fill();
      ctx.fillStyle = c.hearseTrim; ctx.fillRect(d.x + 40, top + 12, 40, 16); ctx.fillRect(d.x + 88, top + 12, 50, 16); ctx.fillRect(d.x + 4, top + 34, d.w - 6, 4);
      ctx.fillStyle = '#1b1528'; for (const wx of [d.x + 30, d.x + d.w - 30]) { ctx.beginPath(); ctx.arc(wx, GROUND_Y - 8, 11, 0, TAU); ctx.fill(); }
    }
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
  // ---- Ghost -----------------------------------------------------------------------------------
  function drawGhost() {
    const G = CONFIG.ghost, g = game.ghost, s = G.size;
    const alpha = game.state === 'playing' && !game.cutscene ? Math.min(1, game.physAcc * CONFIG.world.physicsHz) : 1;
    const y = lerp(g.prevY, g.y, alpha); // render interpolation between fixed physics steps
    const cs = game.cutscene;
    if (cs && cs.ghostHidden) return;
    ctx.save();
    ctx.translate(cs && cs.gx != null ? cs.gx : G.x, y);
    if (cs && cs.ghostScale != null) ctx.scale(Math.max(0.01, cs.ghostScale), Math.max(0.01, cs.ghostScale));
    ctx.rotate(g.tilt * Math.PI / 180);
    const golden = game.golden || game.goldenModeT > 0;
    const strip = golden ? sprites.ghost.golden : sprites.ghost.normal;
    if (strip) {
      const AG = A.ghost, k = s / AG.frameSize, fs = AG.frameSize * sprites.res;
      let name;
      if (game.state === 'over') name = AG.deadFrame;
      else if (game.flapT >= 0) name = AG.flapFrames[Math.min(AG.flapFrames.length - 1, Math.floor(game.flapT * AG.flapFps))];
      else name = AG.idleFrames[Math.floor(game.time * AG.idleFps) % AG.idleFrames.length];
      const idx = Math.max(0, AG.frameOrder.indexOf(name));
      ctx.drawImage(strip, idx * fs, 0, fs, fs, -AG.anchor[0] * k, -AG.anchor[1] * k, AG.frameSize * k, AG.frameSize * k);
    } else {
      const hw = s * 0.32;
      ctx.fillStyle = golden ? CONFIG.colors.ghostGolden : CONFIG.colors.ghostBody;
      ctx.strokeStyle = golden ? CONFIG.colors.ghostGoldenShade : CONFIG.colors.ghostShade; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-hw, 2); ctx.arc(0, 2, hw, Math.PI, 0); ctx.lineTo(hw, hw);
      for (let i = 0; i < 4; i++) { const x0 = hw - i * (hw / 2); ctx.quadraticCurveTo(x0 - hw / 4, hw + 6, x0 - hw / 2, hw); }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = CONFIG.colors.eye;
      for (const ex of [-7, 7]) { ctx.beginPath(); ctx.ellipse(ex, 1, 3, 4, 0, 0, TAU); ctx.fill(); }
      ctx.fillStyle = CONFIG.colors.blush; ctx.globalAlpha = 0.8;
      ctx.beginPath(); ctx.ellipse(-12, 8, 3.5, 2.2, 0, 0, TAU); ctx.ellipse(12, 8, 3.5, 2.2, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
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
  function text(str, x, y, size, opts = {}) {
    ctx.font = `${opts.weight || 'bold'} ${size}px ${CONFIG.ui.font}`;
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
      text(`Best: ${game.best}`, W / 2, H - CONFIG.world.groundHeight / 2, 20);
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
      if (game.goldenModeT > 0) {
        const f = Math.min(1, game.goldenModeT / CONFIG.golden.mode.seconds);
        ctx.fillStyle = 'rgba(30,20,51,0.6)'; roundRect(W / 2 - 50, 98, 100, 10, 5); ctx.fill();
        ctx.fillStyle = CONFIG.colors.ghostGolden; roundRect(W / 2 - 50, 98, 100 * f, 10, 5); ctx.fill();
        text('x2', W / 2 + 64, 103, 14, { color: CONFIG.colors.ghostGolden });
      }
      if (game.banner) {
        const T = CONFIG.stages.transition.bannerSeconds, t = game.banner.t;
        ctx.globalAlpha = t < 0.15 ? t / 0.15 : t > T ? Math.max(0, 1 - (t - T) / 0.4) : 1;
        drawBannerPill(game.banner.text);
        ctx.globalAlpha = 1;
      }
      if (game.paused) { ctx.fillStyle = CONFIG.colors.panelBg; ctx.fillRect(0, 0, W, H); text('Paused', W / 2, H / 2 - 20, 36); text('Tap to resume', W / 2, H / 2 + 24, 20); }
      return;
    }
    const px = 40, py = 170, pw = W - 80, ph = 250;
    ctx.fillStyle = CONFIG.colors.panelBg; roundRect(px, py, pw, ph, 22); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = CONFIG.colors.accent; ctx.stroke();
    text('Game Over', W / 2, py + 42, 34);
    text(`Score: ${game.score}`, W / 2, py + 96, 26);
    text(`Best: ${game.best}`, W / 2, py + 132, 22);
    let y = py + 166;
    if (game.newBest) { text('New best!', W / 2, y, 18, { color: CONFIG.colors.accent }); y += 26; }
    const medal = medalFor(game.score);
    if (medal) text(medal, W / 2, y, 18, { color: CONFIG.colors.ghostGolden });
    if (game.time - game.deadTime >= CONFIG.ui.restartLockout) { ctx.globalAlpha = blink; text('Tap to restart', W / 2, py + ph + 44, 24); ctx.globalAlpha = 1; }
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
  function tapCuePos() { // beside the ghost; drops below it if it would touch the banner
    const g = game.ghost, x = CONFIG.ghost.x + 58, w = 64, h = 32;
    let y = g.y - 30;
    if (game.banner) { const [bx, by, bw, bh] = bannerRect(game.banner.text); if (x + w / 2 > bx && x - w / 2 < bx + bw && y + h / 2 > by - 6 && y - h / 2 < by + bh + 6) y = g.y + 52; }
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
    if (game.cutscene) { drawLaunchScene(); return; }
    drawStageBackground(cur);
    drawAmbientBack(cur, t);
    if (from && !(artBg(cur) && artBg(from))) { // placeholder crossfade: old stage rendered offscreen, composited at (1 - t)
      ctx = bgCtx;
      drawStageBackground(from);
      drawAmbientBack(from, 1);
      ctx = mainCtx;
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1 - t; ctx.drawImage(bgCanvas, 0, 0); ctx.restore();
    }
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
    if (game.state !== 'loading') drawGhost();
    if (game.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${game.flash * 0.5})`; ctx.fillRect(0, 0, W, H); }
    drawFloatTexts();
    drawHUD();
  }

  // ---- QA hooks ----------------------------------------------------------------------------------
  if (DEBUG) {
  game.setStage = n => {
    const idx = parseStage(n);
    if (idx == null) return false;
    game.pairs = STAGES[idx].startAt;
    if (game.state !== 'playing') { game.stageIndex = idx; game.fade = null; scheduleZoneEvent(); }
    return true; // while playing, the normal transition (or the launch) follows from pairs
  };
  game.triggerEvent = id => {
    const zone = Object.keys(CONFIG.events.list).find(z => CONFIG.events.list[z].id === id);
    if (id === 'rocket') { game.pairs = Math.max(game.pairs, CONFIG.launch.atScore); return true; }
    if (!zone) return false;
    game.eventDue = { zone, score: game.pairs, def: CONFIG.events.list[zone], forced: true };
    return true;
  };
  game.forcePickup = () => { game.forcePickupNext = true; };
  game._dbg = { nextReady: () => { const n = STAGES[game.stageIndex + 1]; if (!n) return true; const sc = canvas.height / H; return prewarmKeys().filter(k => k.includes(n.id) || k === 'launchSky').every(k => { const e = layerCache.get(k); return e && e.sc === sc; }) && A.backgrounds.layers.every(l => prewarmKeys().includes(`${n.id}-${l}`)); }, bgSettled: () => A.backgrounds.layers.every(l => { const st = bgState[l]; return st && st.cur === stage().id && !st.trans && !st.fade; }), prewarmReady: () => !building && !buildQueue.length && prewarmKeys().every(k => { const e = layerCache.get(k); return e && e.sc === canvas.height / H; }), hbFallbacks, coverageBreaks, hitsShapes, resolveColumn, stageIndexForPairs, pairHits, columnHitboxes, multiplier, physics, hazardY, speedFor, gapFor, spacingFor, EVENTS, currentSpeed, transitionActive, patternRunning, hitbox: () => ({ r: hitboxRadius, off: hitboxOffsetY }), getLayer, layerCache };
  }

  // ---- Main loop --------------------------------------------------------------------------------
  let lastT = performance.now();
  function frame(now) {
    const interval = now - lastT;
    const dt = Math.min(CONFIG.world.maxDt, Math.max(0, interval / 1000));
    lastT = now;
    const t0 = performance.now();
    if (!game.paused) update(dt);
    draw();
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
