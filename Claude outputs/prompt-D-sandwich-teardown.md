# PROMPT D: The horizontal teardown sequence, stage, and colour journey

Run this against `C:\Users\Aaron\aether-one-x-v2` in opencode. It replaces the x-ray, chip, and rebuild acts with a single horizontal layer-by-layer teardown, and it rebuilds the 3D stage so the device is lit by an environment instead of floating in a void.

It depends on Prompt C's internal manifest (`src/film/internals/layout.ts`) and Prompt B's explode registry. Build those first.

---

## 1. WHAT THE CURRENT BUILD ACTUALLY LOOKS LIKE

These observations come from `docs/film-snaps/`. Read them as the problem statement.

**`act-xray.png`.** The phone is nearly invisible. A faint edge highlight is the only thing separating a near-black device from a near-black background. The internals are flat coloured rectangles: the board is a plain dark-green rect, and there is no sense of a stack. The x-ray readout (`AETHER A1 ULTRA · 3 NM · 171 MM²`) is dark grey text sitting directly on top of the dark board, effectively unreadable, and it overlaps the geometry it is describing.

**`act-battery.png`.** The cell is a flat blue-grey rectangle with a white outline. The numeral `4,000` runs straight into it, so the type and the subject collide. The phone reads as a dark slab with horizontal banding.

**`act-chip.png`.** The best of the three, because the type has room. But the subject is barely visible behind it, and the camera ring detail is lost in the dark.

**The common causes, in order of impact:**

1. There is no stage. The device floats in a void with no floor, no horizon, and no backdrop. Nothing gives it a place to be, and nothing gives its silhouette something to read against.
2. The page and the environment are both near-black (`--color-night: #0a0a0c`), so the subject and its background have almost no value separation.
3. Every act has the same neutral near-black look, so 1500vh of scrolling has no visual progression.
4. Overlay type and 3D subject occupy the same screen real estate and fight each other.

All four are addressed below.

---

## 2. THE CONCEPT

The phone lies down flat, like a specimen on a table seen from a low angle. Its layers lift apart into a vertical stack, a cross-section sandwich. Then, as the viewer scrolls, each layer in turn detaches from the stack, rotates to face the viewer, moves into a hero position on one side of the frame, and is explained by text on the other side. It then returns to the stack and the next layer takes its turn.

Three reasons this is better than the current overhead x-ray dive:

- A horizontal stack is legible. Nine layers separated vertically read as nine things. Nine parts exploding toward the camera read as overlapping shapes.
- The flip gives every component a moment where it is face-on, unoccluded, and at a known screen position, which is exactly the condition text needs.
- It removes the collision between type and subject, because the layout is a fixed two-column split for the whole sequence.

---

## 3. STAGING GEOMETRY

All values in metres and radians, consistent with `phoneDimensions.ts`.

### 3.1 The three poses

```ts
/** Upright, as the approach act leaves it. */
export const POSE_UPRIGHT = { rx: -0.28, ry: 0.42, rz: 0 } as const

/** Lying flat: face up and tipped slightly toward camera. The sandwich pose. */
export const POSE_FLAT = { rx: -1.352, ry: 0.185, rz: 0.02 } as const

/** A featured layer, rotated out of the stack to face the viewer. */
export const POSE_FEATURE = { rx: -0.06, ry: 0.1, rz: 0 } as const
```

`POSE_FLAT` at rx = -1.352 rad is about 77 degrees. Do not use a full 90 degrees. At 90 you see a pure edge, which is a line with no information in it. At 77 you see the layer edges as bands _plus_ a foreshortened sliver of each layer's face, which is what makes it read as a stack of distinct objects rather than a striped rectangle.

The camera sits slightly above the phone's plane and looks slightly down, roughly 14 degrees of elevation. Author this in the act keys; do not hardcode it in the director.

### 3.2 Layer separation

Layers separate along the phone's **local +z**, its face normal, which after `POSE_FLAT` points up and slightly toward camera in screen space. Separation is symmetric about the body centre so the stack grows in both directions and the composition stays centred.

```ts
/** Gap between adjacent layers at full separation. Heavily exaggerated from the real 7.8mm body. */
export const LAYER_GAP = 0.0085

/** Layer offset = (index - (count - 1) / 2) * LAYER_GAP * separation */
```

Ten layers at 8.5mm is an 85mm stack against a 159.6mm body length. That proportion reads well: tall enough to be clearly a stack, short enough to stay in frame at a sensible FOV.

The exaggeration is intentional and is what every exploded service diagram does. Do not try to keep it to scale.

---

## 4. THE LAYER MANIFEST

Order is the **physical stack front to back**, not narrative convenience. It is honest, and it teaches the viewer something: most people do not know the battery sits in front of the logic board.

Create `src/film/teardown/layers.ts`:

```ts
export interface TeardownLayer {
  id: string
  /** Stack index, 0 = frontmost. Drives the separation offset. */
  index: number
  /** Parts from Prompt C's layout manifest that travel with this layer. */
  parts: readonly string[]
  /** Kicker, headline, and one explanatory sentence. Copy lives in chapters.ts. */
  copyKey: string
  /** Accent hue for this layer's rim light and text accent. */
  accent: string
  /** Hero-side scale bump when featured. */
  featureScale: number
}
```

The ten layers:

| index | id            | what travels with it                     | what it explains                      |
| ----- | ------------- | ---------------------------------------- | ------------------------------------- |
| 0     | `cover-glass` | front glass, oleophobic layer            | the surface you touch, the reflection |
| 1     | `display`     | panel, polarizer, bezel ink              | 144 Hz, peak nits, colour             |
| 2     | `midframe`    | frame body, rails, antenna bands, screws | the structure everything mounts to    |
| 3     | `battery`     | cell, tabs, wrap                         | capacity and endurance                |
| 4     | `logic-board` | main board, sub board, flex, shield cans | the system                            |
| 5     | `silicon`     | SoC, RAM, NAND, modem, PMIC              | the A1 Ultra, the hero beat           |
| 6     | `thermal`     | vapour chamber, graphite                 | sustained performance                 |
| 7     | `power-coil`  | wireless coil, NFC ring                  | wireless charging                     |
| 8     | `camera`      | the full module from Prompt A2           | the optics                            |
| 9     | `rear-panel`  | back panel, wordmark, panel split        | the finish                            |

Silicon at index 5 lands almost exactly at the sequence midpoint, which is the right place for the strongest beat.

---

## 5. PER-LAYER CHOREOGRAPHY

Each layer's feature window runs through four phases. Express all of it as pure functions of a per-layer local progress derived from the master scroll value.

```ts
/** Local progress 0..1 for layer i within the feature run. */
export function layerProgress(
  p: number,
  index: number,
  count: number,
  runStart: number,
  runEnd: number,
): number
```

**Phase 1, detach (local 0 to 0.22).** The layer translates out of the stack toward the camera and to the left, clearing the other layers. Damping 5.5/s. The stack behind it does not move.

**Phase 2, flip (local 0.18 to 0.52).** Rotation eases from `POSE_FLAT` to `POSE_FEATURE`, cancelling the phone's tilt so the layer comes face-on. Overlap with phase 1 by 0.04 so the move and the turn blend rather than happening in sequence, which is what makes it feel like one gesture.

**Phase 3, hold (local 0.52 to 0.80).** Near-static. This is 28 percent of the window and it is not negotiable. It is when the text is read. The only motion is a slow drift of about 0.04 rad and the rim light travelling across the part. A featured layer that never stops moving cannot be read.

**Phase 4, restack (local 0.80 to 1.0).** Reverses phases 1 and 2 faster, roughly 1.6 times the outbound rate. Things come apart slowly and go back together quickly.

### 5.1 The unfeatured layers

While one layer is featured, the others must recede without disappearing:

- Opacity to 0.45.
- A desaturation and value pull toward the stage colour, so they read as context.
- No blur. A depth-of-field pass here is not worth its frame time, and value separation does the same job.
- The featured layer's index position in the stack stays visible as a gap, so the viewer can see where it came from. Do not close the gap.

### 5.2 Weight

Carry Prompt B's weight discipline through. The battery and midframe move slowly with almost no tumble. The cover glass and graphite sheet are light and can move faster with a slight overshoot on arrival. Screws travelling with the midframe spin on their own axis. Mass should be inferable from motion alone.

---

## 6. LAYOUT AND TEXT

A fixed two-column split for the entire sequence. This is the fix for the type-versus-subject collision visible in `act-battery.png`.

- **Left column, 42 percent width**: the text. Kicker, headline, one sentence, and the spec figure. Vertically centred.
- **Right column, 58 percent**: the featured layer and the stack behind it.
- The columns never overlap. The big numeral lives in the text column, not across the subject.
- On viewports under 900px the split becomes vertical: subject upper 55 percent, text lower 45 percent, with the stack shifted up.

Text motion: the outgoing layer's copy leaves on opacity and a 12px rise over 280ms; the incoming copy arrives the same way, with a 120ms gap between them so the two never cross-fade through each other. Copy lives in `src/film/chapters.ts` with everything else, and every figure must already exist in `src/data/product.ts` or `chapters.test.ts` will fail.

Keep the copy short. One kicker of two or three words, one headline of one line, one sentence of explanation, one figure. At the pacing in section 9 the viewer has roughly four seconds per layer.

---

## 7. THE STAGE

This is the single highest-impact change in this prompt. The device currently has no environment at all.

### 7.1 Cyclorama

Build an infinite-curve backdrop: a floor plane that curves up into a back wall with a large radius, the standard product photography cyclorama. It receives light and shows a soft vertical gradient, which immediately gives the subject a place to be and gives its silhouette something to read against.

- Radius of the curve roughly 1.2 times the framing distance.
- Its material is matte, roughness 0.9, no specular character. It is a backdrop, not a surface of interest.
- It must never be sharply lit. Light it with a broad, soft falloff so the gradient is smooth and there are no visible light shapes on it.

### 7.2 Floor and contact

- A soft contact shadow under the device. Not a hard shadow, a broad occlusion pool. This is what makes an object look like it has weight and is sitting somewhere.
- A faint reflection of the device in the floor at roughly 12 percent, fading out within about 1.5 device lengths. Cheap, and it does enormous work for perceived quality.
- During the teardown, each separated layer casts its own soft pool. Ten soft pools stacked is expensive, so approximate: one pool for the stack as a whole plus one for the featured layer.

### 7.3 Horizon

Where the floor meets the wall curve, keep a subtle value break. The eye uses it to orient. A completely uniform gradient reads as fog, not as a room.

---

## 8. THE COLOUR JOURNEY

Raise the base substantially and let colour progress through the film. The rule that keeps it from getting garish: **the stage carries the colour, the product stays neutral.** The device is titanium, glass, and ceramic. It should look like the same object under changing light, not like it is being tinted.

### 8.1 Page background

Raise `--color-night` from `#0a0a0c` to `#12141a`, and introduce a scroll-driven page tint layer above it that carries the act colour at low opacity. The page never becomes light; it becomes _lit_.

### 8.2 Per-act stage colour

Add `stage` and `stageTop` to `StageLightState` in `src/film/lighting.ts`. These drive the cyclorama gradient.

| act      | stage base                    | character                               |
| -------- | ----------------------------- | --------------------------------------- |
| arrival  | `#161a24`                     | deep blue-slate, the opening            |
| settle   | `#1a1f2b`                     | warming slightly                        |
| approach | `#1e2432`                     | cool steel                              |
| teardown | `#252c3a` rising to `#3a4252` | **gets lighter across the nine layers** |
| camera   | `#22303a`                     | teal-leaning, cool optics               |
| display  | `#4a5266`                     | the brightest stage in the film         |
| storage  | `#2e2a3e`                     | violet                                  |
| battery  | `#33301f`                     | warm olive-gold, energy                 |
| software | `#2a2d3e`                     | lavender-slate                          |
| ai       | `#1f2a42`                     | electric blue, deep                     |
| final    | `#3e4456`                     | rich, the hero                          |

The teardown ramp is the direct answer to wanting colour that develops as you keep going: the stage lightens continuously across the whole sequence, so arriving at the rear panel feels like emerging somewhere brighter than where you started.

The display act is deliberately the brightest stage in the film. An act about a screen should feel like light.

### 8.3 Per-layer accent

Each teardown layer gets an accent hue driving its rim light and its text accent colour. This is where the colour gets specific rather than just brighter.

- `cover-glass` ice blue `#9fd4ff`
- `display` white-cyan `#cfe9ff`
- `midframe` steel `#b8c2d0`
- `battery` amber-green `#c4d99a`
- `logic-board` jade `#7fd4b0`
- `silicon` warm gold `#ffc978`
- `thermal` violet-grey `#b9aecb`
- `power-coil` copper `#e09a5f`
- `camera` cool cyan `#8fd8e0`
- `rear-panel` the currently selected finish colour

The accent appears in three places only: the rim light on the featured part, the kicker text, and the spec figure's underline. Do not let it touch the product's own materials.

Load the `dataviz` skill before building the spec figures and meters in this sequence. It is installed for opencode at `~/.config/opencode/skills/dataviz/`.

---

## 9. TIMELINE INTEGRATION

### 9.1 Keep the outer boundary, so nothing downstream moves

The teardown occupies exactly the span currently held by `xray`, `chip`, and `rebuild`: **0.25 to 0.52.** Every act after it keeps its current boundaries. This avoids invalidating every downstream `ramplike` window in `states.ts`.

Internal budget:

- 0.250 to 0.272, lay down. The phone rotates from upright to `POSE_FLAT`.
- 0.272 to 0.295, separate and hold. Layers lift into the stack. **Hold the full stack for a beat before any flip.** This is the establishing shot of the sequence and it is what makes the concept legible.
- 0.295 to 0.495, ten feature windows of 0.020 each.
- 0.495 to 0.520, restack and stand back up, handing off to the camera act.

### 9.2 Fix the pacing with the runway, not the timeline

0.020 of timeline at the current 1500vh desktop runway is 30vh per layer, which is too fast to read a sentence.

Raise `--film-height` in `src/index.css` from `1500svh` to `1900svh` desktop and from `1100svh` to `1400svh` mobile. That gives 38vh per layer without moving a single act boundary, because every boundary is a fraction. This is the cheapest available pacing control and it is worth knowing about generally.

### 9.3 States

Replace the `xray`, `chip`, and `rebuild` scalars in `states.ts` with a teardown set. Keep the `ramplike` pattern and the single scratch object:

```ts
/** 0..1 phone rotates from upright to flat. */
layDown: number
/** 0..1 layers separate into the stack. */
stackSeparate: number
/** 0..(count) continuous layer cursor. Integer part = current layer, fraction = local progress. */
layerCursor: number
/** 0..1 how strongly unfeatured layers recede. */
contextRecede: number
/** 0..1 stage lightness ramp across the sequence. */
stageRamp: number
```

`layerCursor` as a single continuous float is the key simplification. Everything per-layer derives from it, it reverses exactly, and it is trivially testable.

### 9.4 Act definitions

`ACTS` in `timeline.ts` replaces three entries with one:

```ts
{ id: 'teardown', start: 0.25, end: 0.52, align: 'left' },
```

`align: 'left'` matches the two-column layout in section 6. `ActId` loses `xray`, `chip`, and `rebuild` and gains `teardown`, which will produce type errors in `shots.ts`, `lighting.ts`, `chapters.ts`, and the act files. Fix them all in one commit; the exhaustive `Record<ActId, ...>` types will find every site for you.

The chip is no longer its own act but it is still the strongest beat, as layer index 5. Its copy and its 12,480 figure move into the teardown copy set.

---

## 10. REDUCED MOTION AND SMALL SCREENS

- Reduced motion: the stack separates instantly at the start of the sequence and stays separated. Each layer snaps to face-on rather than flipping. The scroll still advances the cursor, so all the content remains reachable. No drift, no overshoot, no rim-light travel.
- Under 900px: vertical split per section 6, `LAYER_GAP` reduced to 0.0065 so the stack fits, and the featured layer's `featureScale` reduced so it does not crop.
- The static story layout must include all ten layers with their copy. The teardown is information, not decoration, so removing it removes content.

---

## 11. CONTRAST SAFETY

Raising the stage brightness threatens the text contrast that `docs/design-tokens.md` documents. This is the main risk in this prompt and it needs a test, not a vibe check.

- A scrim gradient sits behind the text column, opacity driven by the current stage lightness so it strengthens as the stage brightens.
- Add a check to the e2e suite: at 24 progress values across the film, sample the rendered luminance behind the text column's bounding box and assert primary text clears 4.5:1 and the headline clears 7:1. Fail the build otherwise.
- Re-run `e2e/axe.spec.ts` in both motion modes.
- Every per-layer accent must clear 4.5:1 against its own stage colour. Assert it in a unit test over the layer manifest, the same way `product.test.ts` already guards spec consistency.

---

## 12. RUBRIC

Twelve checks, pass or fail, recorded in `docs/teardown.md`.

1. **Silhouette separation.** At every point in the sequence the device reads clearly against the stage. Compare directly against `act-xray.png`, which fails this.
2. **The stack reads as a stack.** Paused at 0.290, a viewer counts ten distinct layers.
3. **Not a striped rectangle.** At `POSE_FLAT` each layer shows a sliver of its face, not just an edge. If it looks striped, the tilt is too close to 90 degrees.
4. **The hold is real.** Each layer has a genuinely near-static window. Time it. Under 0.8 seconds at the shipped runway is a fail.
5. **No collision.** Text and subject never overlap at any progress value, at any of the five test viewports.
6. **Context is legible.** Unfeatured layers are clearly present but clearly secondary. Fails if they vanish or if they compete.
7. **The gap persists.** The featured layer's slot stays open in the stack.
8. **Weight reads.** Battery and midframe move heavily, glass and graphite lightly, screws spin.
9. **Stage progression.** Comparing stills from 0.30 and 0.49 side by side, the lightening is obvious.
10. **Product stays neutral.** The device looks like the same object under different light, never tinted.
11. **Contrast test passes** at all 24 sample points.
12. **Reverse scrub.** 0.52 back to 0.25 slowly. Nothing pops, no layer teleports, the cursor reverses exactly.

---

## 13. VERIFICATION

Per `docs/tooling.md`: `npm.cmd` and `npx.cmd`, Context7 resolves drei as `/pmndrs/drei`.

1. `npm run verify`.
2. The twelve rubric checks with committed renders.
3. **New snapshot set.** `docs/film-snaps/` currently has one frame per act. Replace the three removed acts with ten teardown frames, one per layer, captured via `?t=`. Update `scripts/capture-film.mjs` accordingly.
4. **Before and after.** Put the old `act-xray.png` beside the new `teardown-silicon.png` in `docs/teardown.md`. If the improvement is not obvious at a glance, something is wrong.
5. **Frame time** across 0.25 to 0.52 under 4x CPU throttle via chrome-devtools MCP. This sequence now carries the most geometry and the longest runtime in the film.
6. **The cyclorama cost** measured separately. A large backdrop receiving soft light plus a floor reflection is not free.
7. Five viewports, including the vertical split under 900px.

---

## 14. ORDER OF WORK

1. Build the stage first: cyclorama, floor, contact pool, horizon. Ship it against the _existing_ acts and look at it. The device having a place to be is worth more than everything else in this prompt, and it is independently valuable.
2. Raise `--color-night`, add the per-act stage colours, add the page tint layer.
3. Run the contrast test. Fix the scrims until it passes. Do this before building the sequence, not after.
4. `layers.ts` manifest wired to Prompt C's part IDs.
5. `POSE_FLAT` and the lay-down transition. Look at the flat pose in grey before going further, and tune the tilt angle by eye.
6. Stack separation and the establishing hold.
7. `layerCursor` and `layerProgress` with unit tests, before any visual work on the flip.
8. The four-phase flip for one layer only. Get it right, then apply to all ten.
9. Context recede.
10. Two-column layout and copy.
11. Per-layer accents and the stage ramp.
12. Reduced motion, mobile split, reverse scrub, rubric, new snapshots.

Build the stage first and view it with the current film. You will be able to judge everything else against a device that is actually visible.
