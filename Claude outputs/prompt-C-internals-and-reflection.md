# PROMPT C: Internal architecture, exploded choreography, and screen reflection

Run this against `C:\Users\Aaron\aether-one-x-v2` in opencode, after Prompt B.

**Relationship to Prompt B:** B builds the explode _system_ (the part registry, direction derivation, `partProgress` stagger, velocity caps). C supplies the _content_ that system consumes: the full internal component manifest with real positions, the transparent finish that makes it worth showing, and the choreography that stages it. If B is not built yet, build it first. Do not reimplement the registry here.

---

## 0. ROLE

You are a technical director and hardware modeller. You are building the inside of the Aether One X to the level where a teardown video would recognise it, then choreographing it coming apart, then adding a screen reflection system that makes the device look like it exists in a room.

Three deliverables:

1. A complete, positioned internal component manifest.
2. An exploded sequence with per-part staging.
3. A simulated screen reflection driven by the page itself.

---

## 1. FIRST, FIX THE COORDINATE SPACE

**Do this before anything else.** `src/film/internals/parts/silicon.tsx` positions the die at `[0.011, 0.098, 0.0012]`. The body's half-height is `DIM.h / 2 = 0.0798`. A y of 0.098 is 18mm above the top of the phone.

Either the internals group carries a compensating parent transform, or the internals have drifted out of the shell's coordinate space. Find out which, then:

- Unify everything on `phoneDimensions.ts`. Origin at body centre, +y up, +z toward the front face. Back face at `-DIM.t / 2 = -0.0039`, front face at `+0.0039`.
- Remove any compensating parent offset. A part's authored position should be its real position in the body.
- Add a test in `src/film/internals/` asserting every registered part's origin lies inside the body volume, with a small tolerance for the camera module which is legitimately outboard.

This matters more than it sounds. The explode system in Prompt B derives direction from each part's offset from the assembly centroid. If positions are in a shifted space, every explode vector will be wrong in a way that looks plausible and is impossible to debug by eye.

---

## 2. THE INTERNAL MANIFEST

All coordinates in metres, origin at body centre. Put these in a new `src/film/internals/layout.ts` as the single source of truth, with millimetre values in comments.

The z stack, back to front: back panel inner face at -0.0028, then coil and NFC, then graphite, then the boards with their components facing rearward, then the battery, then the display stack. Components face the back cover because the film's x-ray dive comes from behind. This is also how real assemblies are built, since the shield cans face the removable cover.

### 2.1 Boards

```ts
/** Main logic board, upper third. Component side faces the rear cover. */
export const MAIN_BOARD = {
  w: 0.066,
  h: 0.046,
  thickness: 0.0008,
  cx: 0,
  cy: 0.042,
  cz: -0.0012,
} as const

/** Daughterboard, bottom edge. Carries the port, SIM, and charge path. */
export const SUB_BOARD = {
  w: 0.062,
  h: 0.02,
  thickness: 0.0008,
  cx: 0,
  cy: -0.0625,
  cz: -0.0012,
} as const

/** Board-to-board flex, routed up the left edge. */
export const BTB_FLEX = {
  x: -0.0302,
  yTop: 0.0215,
  yBottom: -0.053,
  width: 0.0064,
  thickness: 0.00018,
} as const
```

The camera module from Prompt A2 mounts to the main board and protrudes rearward through the cover. It overlaps the board in plan view and sits outboard of it in z. That overlap is correct, not a bug.

### 2.2 Silicon and board components

Every one of these sits on the main board's rear face at `cz = -0.0016` unless noted. Sizes are width by height by height-off-board.

```ts
export const BOARD_PARTS = [
  // SoC plus RAM package-on-package stack. The hero of the chip act.
  { id: 'soc', x: -0.013, y: 0.0345, w: 0.016, h: 0.016, z: 0.0011, label: 'A1 Ultra' },
  { id: 'nand', x: 0.01, y: 0.0345, w: 0.011, h: 0.009, z: 0.0008, label: 'Storage' },
  { id: 'modem', x: 0.021, y: 0.048, w: 0.009, h: 0.009, z: 0.0007, label: 'Modem' },
  { id: 'pmic', x: -0.024, y: 0.048, w: 0.008, h: 0.007, z: 0.0006, label: 'Power' },
  { id: 'codec', x: -0.006, y: 0.0585, w: 0.005, h: 0.005, z: 0.0005, label: 'Audio' },
  { id: 'rf-a', x: 0.026, y: 0.0585, w: 0.005, h: 0.004, z: 0.0005, label: 'RF' },
  { id: 'rf-b', x: -0.028, y: 0.0585, w: 0.005, h: 0.004, z: 0.0005, label: 'RF' },
  { id: 'rf-c', x: 0.028, y: 0.03, w: 0.005, h: 0.004, z: 0.0005, label: 'RF' },
  { id: 'btb-up', x: 0.0, y: 0.0215, w: 0.008, h: 0.002, z: 0.0009, label: null },
] as const
```

Sub-board components at `cz = -0.0016`:

```ts
export const SUB_PARTS = [
  { id: 'charge-ic', x: -0.015, y: -0.062, w: 0.006, h: 0.005, z: 0.0006, label: 'Charge' },
  { id: 'sim-cage', x: 0.016, y: -0.0625, w: 0.012, h: 0.006, z: 0.0011, label: 'SIM' },
  { id: 'btb-low', x: 0.0, y: -0.053, w: 0.008, h: 0.002, z: 0.0009, label: null },
] as const
```

### 2.3 Shield cans

Four cans covering the component groups. These are the most visually distinctive board features because they are large, flat, and reflective, and they are what a viewer actually sees before the lids come off.

```ts
export const SHIELD_CANS = [
  { id: 'can-soc', x: -0.013, y: 0.0345, w: 0.019, h: 0.019, rise: 0.0014 },
  { id: 'can-mem', x: 0.0105, y: 0.0345, w: 0.014, h: 0.012, rise: 0.0011 },
  { id: 'can-rf', x: 0.021, y: 0.049, w: 0.013, h: 0.013, rise: 0.001 },
  { id: 'can-power', x: -0.023, y: 0.05, w: 0.013, h: 0.012, rise: 0.0009 },
] as const
```

Each can is a lid plus a fence. The lid lifts off separately during the explode, revealing the components underneath, which is the single best beat in the whole x-ray sequence. Lids get a perforated vent pattern (instanced holes, 0.4mm, 1.2mm pitch) and a visible clip detent around the rim.

### 2.4 Power

```ts
/** Battery cell. Largest single component. Verify volume against src/data/product.ts. */
export const BATTERY = {
  w: 0.058,
  h: 0.078,
  thickness: 0.0042,
  cx: 0,
  cy: -0.012,
  cz: -0.0005,
  tabX: 0.019,
  tabY: 0.037, // positive and negative tabs at the top edge
} as const

/** Wireless charging coil, flat litz, sitting over the cell. */
export const COIL = {
  rOut: 0.021,
  rIn: 0.011,
  turns: 18,
  wireW: 0.00052,
  thickness: 0.0004,
  cx: 0,
  cy: -0.008,
  cz: -0.0024,
} as const

/** NFC antenna ring, outboard of the coil. */
export const NFC = {
  rOut: 0.026,
  rIn: 0.023,
  thickness: 0.00012,
  cx: 0,
  cy: -0.008,
  cz: -0.0026,
} as const
```

**Check the battery against the data layer.** 0.058 × 0.078 × 0.0042 is 19cm³, which at roughly 700 Wh/L is about 13.3 Wh, or near 3500 mAh at 3.8V. If `src/data/product.ts` claims a different capacity, either change the data or change the cell dimensions. A spec sheet that disagrees with the visible hardware is exactly the kind of thing the existing `product.test.ts` consistency test exists to catch, and it is worth extending that test to cover cell volume.

The coil is the most visually rewarding internal part and is currently absent. Model the turns as real instanced geometry: 18 concentric flat rings of copper with a visible spiral break and a two-wire lead-out. At macro the individual turns must resolve.

### 2.5 Thermal

```ts
/** Vapor chamber over the SoC, extending down across the battery top. */
export const VAPOR_CHAMBER = {
  w: 0.048,
  h: 0.062,
  thickness: 0.0006,
  cx: 0,
  cy: 0.02,
  cz: -0.0019,
} as const

/** Graphite spreader, larger and thinner, outboard of the chamber. */
export const GRAPHITE = {
  w: 0.062,
  h: 0.09,
  thickness: 0.00012,
  cx: 0,
  cy: 0.01,
  cz: -0.0021,
} as const
```

The vapour chamber gets a stamped dimple pattern and a slightly warm copper tone. Graphite is near-black, very low roughness variation, almost no specular. Two thermal layers that look completely different from each other is a good detail.

### 2.6 Electromechanical

```ts
export const MECH = [
  // X-axis linear resonant actuator. Distinctive, rectangular, heavy-looking.
  { id: 'haptic', x: -0.019, y: -0.043, w: 0.024, h: 0.009, d: 0.003 },
  { id: 'speaker', x: 0.02, y: -0.064, w: 0.018, h: 0.011, d: 0.004 },
  { id: 'earpiece', x: 0.0, y: 0.072, w: 0.012, h: 0.004, d: 0.0025 },
  { id: 'port', x: 0.0, y: -0.0735, w: 0.0084, h: 0.0026, d: 0.0042 },
] as const

/** Coaxial RF cables routed along both edges. */
export const COAX = [
  { id: 'coax-l', x: -0.033, yTop: 0.056, yBottom: -0.056, d: 0.00085 },
  { id: 'coax-r', x: 0.033, yTop: 0.052, yBottom: -0.06, d: 0.00085 },
] as const

/** Midframe fasteners. Eight, Torx, perimeter. */
export const SCREWS = [
  { x: -0.03, y: 0.07 },
  { x: 0.03, y: 0.07 },
  { x: -0.033, y: 0.02 },
  { x: 0.033, y: 0.02 },
  { x: -0.033, y: -0.03 },
  { x: 0.033, y: -0.03 },
  { x: -0.029, y: -0.072 },
  { x: 0.029, y: -0.072 },
] as const
export const SCREW = { headD: 0.0016, headDepth: 0.0004, driveD: 0.0009 } as const
```

Screws sound trivial and are not. Eight small, bright, precisely placed fasteners around the midframe perimeter are what makes an internal view read as _assembled_ rather than _arranged_. Model the Torx drive recess as real geometry, six-lobe, at 0.9mm. It will be barely visible and it will matter.

The haptic motor deserves attention: a rectangular steel can with a visible flex tail, a mass you can infer, and a pair of mounting ears. It is one of the few internal parts a general audience recognises.

---

## 3. THE TRANSPARENT FINISH

All of section 2 is invisible in normal use, which is a lot of modelling for four seconds of x-ray. Make it pay for itself: add a sixth finish where the rear panel is transparent and the internals are permanently visible.

Exposed-component industrial design has a long history well before any current phone, from transparent handheld consoles to clear-shell computers to see-through calculators. The look is generic. What is not generic is any specific manufacturer's light-strip arrangement or graphic language, so do not reproduce one.

```ts
/** Sixth finish: transparent rear panel over a dressed internal assembly. */
{
  key: 'clear',
  label: 'Clear',
  family: 'glass',
  transparentBack: true,
  backColor: '#0b0e14',
  backRoughness: 0.06,
  backClearcoat: 1,
  // Smoked, not water-clear. Fully clear looks like a missing panel.
  backTransmission: 0.82,
  backTint: '#121722',
  frameColor: '#9aa2ae',
  antennaColor: '#6c737e',
  uiAccent: '#8fc2ff',
  panelSplit: false,
}
```

Requirements:

- **Smoked, not clear.** Transmission around 0.82 with a cool tint. A fully transparent panel reads as a rendering error rather than a design choice, and it also leaves the internals with no unifying colour.
- **Dress the internals for this finish.** When `transparentBack` is on, the shield cans get a brushed finish rather than plain, the screws get a brighter plating, and the coil gets its copper saturation raised. Real transparent-back products dress their internals for display. Dressed internals are the entire point.
- **An original light element.** Do not copy any existing light-strip arrangement. Use something functionally motivated and visually distinct: a ring of LEDs following the wireless coil perimeter, which reads as a charging indicator and reinforces the coil as the visual centre of the rear face. Sixteen emitters around the coil, individually addressable, driven by a single `coilRing` scalar in `FilmStates`.
- **Performance.** A transmissive rear panel over 40 internal parts is the most expensive thing in the project. Gate it: the transparent finish forces the internals to stay resident, so cap it to LOD0 and LOD1 only, and consider disabling the transmission pass entirely on mobile in favour of a heavily tinted opaque panel with a baked internal image. Measure before deciding.
- The `/specifications` page should note the Clear finish shows internal components, because it is a real product differentiator in the fiction.

---

## 4. EXPLODED CHOREOGRAPHY

Prompt B built the registry and `partProgress`. This is the staging data it consumes.

### 4.1 Layer order

Parts explode in assembly order, outermost first, because that is the order a technician would remove them and it is what makes the sequence legible rather than chaotic.

```ts
/** Removal order. Lower index leaves first. Delay derives from this plus radial distance. */
export const REMOVAL_ORDER = [
  'rear-panel', // 0
  'nfc',
  'coil', // 1
  'graphite', // 2
  'screws', // 3
  'shield-lids', // 4
  'vapor-chamber', // 5
  'coax',
  'btb-flex', // 6
  'battery', // 7
  'sub-board', // 8
  'mech', // 9
  'main-board', // 10
  'board-parts', // 11
  'camera-module', // 12
  'midframe', // 13
  'display-stack', // 14
] as const
```

Delay per part = 0.55 × (normalised removal order) + 0.30 × (normalised radial distance from centroid), clamped into [0, 0.45]. Order dominates, distance breaks ties within a layer so parts in the same layer do not move in lockstep.

### 4.2 Direction per layer

Prompt B blends radial and axial with `radialMix`. Vary it per layer instead of using one global value:

- Panels and sheets (rear panel, graphite, NFC, coil): `radialMix` 0.15. They lift almost straight back, because that is how a flat layer comes off.
- Shield lids: 0.25, with a small tumble so you see the underside.
- Board components: 0.55. They fan outward, which separates them from each other and makes the labels placeable.
- Screws: 0.85, almost purely radial, spinning as they go. Eight small bright objects fanning outward is a strong visual accent and it costs almost nothing.
- Battery: 0.10, straight back, slow. It is the heaviest thing in there and it should move like it.
- Camera module: 0.20 with a slight rotation so the lens faces the viewer at full explode.

### 4.3 Tumble

Add per-part rotation at full explode. Rules:

- Flat sheets get almost none, under 0.05 rad. A graphite sheet tumbling looks weightless.
- Shield lids get 0.25 rad about their long axis, enough to reveal the underside vents.
- Screws get a full 2π about their own axis, continuous, because a spinning screw reads as a screw.
- The battery gets none. It is heavy.
- The camera module gets 0.30 rad so the lens cluster turns toward the viewer.

Weight is communicated almost entirely through tumble amount and damping rate. Keep heavy things still.

### 4.4 Timing inside the existing windows

`states.ts` already owns `explodeXray` at `ramplike(p, 0.27, 0.32, 0.485, 0.515)`. Do not change that window. Everything above rides inside it through per-part delay.

Two additions to `FilmStates`:

```ts
/** 0..1 shield lids lifted, so board components are revealed. */
shieldLift: number
/** 0..1 coil LED ring brightness for the Clear finish. */
coilRing: number
```

`shieldLift` runs `ramplike(p, 0.315, 0.345, 0.47, 0.50)`, slightly inside the main explode so the lids come off after the outer layers have cleared and before the reassembly starts. That reveal is the moment the sequence earns its runtime, so give it its own window rather than folding it into the master scalar.

### 4.5 Reassembly

The window descends from 0.485 to 0.515, which means the whole thing runs backward in 3 percent of the timeline, roughly six times faster than it opened.

That is correct and it is a deliberate effect: things fall apart slowly and snap together fast. But it only works if every part reverses on exactly the path it took out. Any part with time-dependent motion, including the spinning screws, must be a pure function of the explode scalar or it will desync on reverse. The screw rotation is `explode × 2π`, never an accumulating angle.

### 4.6 Callouts

Prompt B section 6 built the callout system. The `label` field in the manifest above feeds it. Rules specific to this content:

- Label only the parts a general audience can care about: SoC, storage, battery, coil, vapour chamber, haptic, speaker, camera module. Nine labels maximum on screen at once.
- Never label the screws, the coax, the RF modules, or the board-to-board connectors. They are texture, not information.
- Every labelled figure must exist in `src/data/product.ts` or `chapters.test.ts` will fail.

---

## 5. SCREEN REFLECTION

The off screen is a dark mirror. What it reflects is the single biggest factor in whether the device looks like it is in a room or floating in a void. Right now the `screen` material has clearcoat 1 and roughness 0.045 and reflects a procedural environment sphere, which is a start and is not enough.

### 5.1 Build a room, not a gradient

The environment needs recognisable shapes, because a reflection of a smooth gradient reads as nothing.

In the procedural canvas environment, composite:

- Two large soft rectangles, the key softbox and a fill panel, at different intensities. These are what sweep across the screen as the phone rotates and they are the primary event.
- A horizon line where a notional floor meets a notional wall, at about 40 percent height. A single value break across the environment gives the reflection a structure the eye can track.
- Three or four small bright points at varying heights, reading as distant practicals. They produce the tiny sharp glints that make a screen look glossy rather than matte.
- A subtle vertical gradient overall, darker at the bottom.

None of this needs detail. It needs shape. Generate it once at 512 square into a canvas texture, convert to an environment map, and never touch it again.

### 5.2 Reflect the page itself

This is the part that makes it feel connected to the website rather than dropped in.

The phone sits on a dark page with a known accent colour and known bright elements: the overlay captions, the act rail, the big numerals. Feed a cheap abstraction of that back into the reflection.

Implementation:

- Maintain a small secondary environment contribution, a 128 square canvas, updated at most a few times per second.
- Draw into it: a soft blob positioned from the current act's overlay alignment (`ActDef.align` is already `center | left | right | bottom`), tinted with `--color-aether`, at low intensity. When the captions are on the right, a faint glow appears on the corresponding side of the screen's reflection.
- Blend it over the room environment at maybe 15 percent. It should never be identifiable as text. It is a suggestion that there is something bright off-camera on that side.
- Drive its intensity from the existing `look.glass` value in `FilmKey`, which already varies per keyframe and is currently underused.

The effect is subtle and the payoff is that the device reads as lit by the page it is sitting on.

### 5.3 The layering that makes it work

Per Prompt A2 section 7, the bezel is under the glass. The reflection layering front to back is:

1. Front glass specular, sharpest, reflecting the room environment.
2. Oleophobic smudge, modulating that specular in the lower third only.
3. Bezel ink, matte, with its own much weaker reflection.
4. Display panel, either near-black with a polarizer cast or emissive when on.

The critical rule: **the glass specular is continuous across the bezel and the active area.** It is one sheet of glass. If the reflection stops or changes at the bezel boundary, the front face falls apart into separate objects, and this is the most common front-face failure in phone renders.

### 5.4 When the screen is on

A bright screen does not stop the glass reflecting. It competes with it.

- Keep the glass specular at full strength over the emissive display.
- As `screenOn` rises, the reflection becomes _relatively_ less visible because the emissive overwhelms it in the bright areas, but it stays fully visible in the dark parts of the screen content. This happens naturally if you layer correctly and fight it if you crossfade between two materials.
- Add a faint screen bounce light in front of the device, tinted to the average colour of the current `LiveScreen` content, at low intensity. It is free realism and it makes the bezel and the frame's inner chamfer pick up colour from what is on screen.

### 5.5 Motion

- The reflection moves because the phone moves. Do not animate the environment.
- One exception: during the arrival act, arrange the key softbox so a single bright panel sweeps across the screen as the phone settles from its opening rotation. That sweep is the first thing the viewer sees and it is worth authoring deliberately rather than leaving to chance. Check it at `?t=0.02` through `?t=0.10`.
- Pointer parallax already exists as `parallaxX` and `parallaxY` in `FilmRefs`. A small clamped pointer tilt changes the reflection noticeably, which is a strong interactivity cue for almost no cost. Cap it tightly, around half a degree, and cancel under reduced motion.

### 5.6 Cost

- The room environment is generated once. Free thereafter.
- The page-reflection canvas at 128 square, updated a few times a second, is negligible, but **update it off the render loop**, not in `useFrame`. A canvas texture upload every frame is a real cost for no benefit.
- Screen-space reflections as a postprocessing pass are not needed here and are not worth their frame time. The environment map approach gets you most of the way at a fraction of the cost. If someone proposes SSR, measure first.

---

## 6. INTEGRATION

- New file `src/film/internals/layout.ts` holds the manifest. Parts files import from it. No coordinates live in JSX.
- `board.tsx`, `power.tsx`, `optics.tsx`, `silicon.tsx` become thin renderers that map over manifest entries. If a parts file still contains a hardcoded position after this work, it is not done.
- Every new material goes into the internals registry and, where it is shell-visible under the Clear finish, into `SHELL_MATS` in `FilmDirector.tsx`.
- The Clear finish needs the internals mounted outside the x-ray act, which they currently are not. Internals visibility becomes `internalOpacity > 0.01 || finish.transparentBack`. Check that this does not leave the internals resident on the product pages, where they are never seen and would cost frame time for nothing.
- Extend `disposeInternalsMaterials` for every new material and map.
- `product.test.ts` gains the battery volume consistency check.

---

## 7. RUBRIC

Score in `docs/device-design.md`. Twelve checks, pass or fail.

1. **Coordinate unification.** Every registered part's origin lies inside the body volume. The test passes.
2. **Board reads as a board.** At macro, shield cans, discrete components, and the board-to-board connector are distinguishable as different classes of thing.
3. **Shield lid reveal.** The lids lift and the components underneath are clearly exposed. Fails if the lids and components move together.
4. **Coil turns resolve.** At macro, individual litz turns are countable and the lead-out is visible.
5. **Screws read as screws.** The Torx recess is visible at macro and they spin on their own axis during the explode.
6. **Weight is legible.** The battery moves slowly with no tumble; the screws move fast with full spin. A viewer can infer mass from motion alone.
7. **Removal order reads.** Pausing at explode 0.4, the layer order is apparent. Outer things have gone further than inner things.
8. **Reassembly is exact.** Scrub backward through the full window. Every part retraces its path. Nothing desyncs, especially the screws.
9. **Clear finish is dressed.** Internals visibly change finish when Clear is selected. Fails if it is the same internals behind a transparent panel.
10. **Room reflection has structure.** Rotating the off screen, you can see distinct softbox shapes and a horizon move across it. Fails on a featureless gradient.
11. **Glass continuity.** The specular runs unbroken across the bezel onto the active area. Fails if it stops at the bezel edge.
12. **Screen-on layering.** With the screen bright, the reflection remains visible in the dark regions of the content. Fails if reflection and emissive crossfade.

---

## 8. VERIFICATION

Per `docs/tooling.md`: `npm.cmd` and `npx.cmd`, Context7 resolves drei as `/pmndrs/drei`.

1. `npm run verify`.
2. The twelve rubric checks, each with a committed render.
3. **The reverse scrub**, 1.0 to 0.0, slowly. This is the primary test for this prompt. Forty exploding parts is forty chances to desync.
4. **Explode read at 0.3, 0.5, 0.7.** Three stills. Each should be a legible diagram, not a cloud.
5. **Frame time** through 0.25 to 0.52 under 4x CPU throttle, via chrome-devtools MCP. This window now carries the most geometry in the film.
6. **Clear finish frame time**, separately, on both desktop and a mobile profile. This is the most expensive configuration in the project and it needs its own number.
7. **Arrival sweep.** Step `?t=` from 0.02 to 0.10 and confirm the softbox sweep across the screen actually reads.
8. **Triangle and draw-call count** with internals resident, which is now a normal state under Clear.
9. Re-run and review all thirteen film snapshots.

---

## 9. ORDER OF WORK

1. Diagnose and fix the coordinate space. Add the bounds test. Nothing else until this is green.
2. Write `layout.ts` with the full manifest.
3. Convert the four parts files to manifest-driven renderers.
4. Add the missing hardware: coil, NFC, vapour chamber, graphite, haptic, speakers, coax, screws, shield cans with lids and fences.
5. Register everything in the Prompt B explode registry with removal order and per-layer `radialMix`.
6. Tumble profiles and damping per weight class.
7. `shieldLift` window and the lid reveal.
8. Reverse-scrub test. Fix desyncs before going further.
9. Callout wiring for the nine labelled parts.
10. The room environment with real shapes.
11. Glass continuity across the bezel, screen-on layering, screen bounce light.
12. The page-reflection contribution, off the render loop.
13. The Clear finish, internals dressing, coil LED ring.
14. Performance pass, LOD gating for Clear, budgets, rubric, docs, snapshots.

Build the manifest and look at the internals with flat grey materials and no explode at all before touching choreography. If the static internal view does not read as a real assembly, no amount of staging will make the exploded view convincing.
