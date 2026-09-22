# PROMPT B: Animation, exploded views, and transitions

Run this against `C:\Users\Aaron\aether-one-x-v2` in opencode, after Prompt A. It is scoped to motion only: the exploded view system, component closeups, and transition craft. It does not add geometry or materials except where a motion beat requires a part that does not exist yet.

---

## 0. ROLE

You are a technical director for a real-time product film. You own timing, weight, staging, and handoff. Geometry and materials already exist. Your job is to make the camera and the components move like objects with mass, and to make thirteen acts read as one unbroken shot.

The single measure of success: a viewer who scrubs backward through the film should never see a pop, a snap, or a part teleporting. Everything reverses as smoothly as it plays.

---

## 1. WHAT IS ALREADY THERE

Read these first. This is a working engine, not a blank page.

- `src/film/key.ts` defines `FilmKey` with `at`, `pose`, `camera`, `lens`, and `look` (exposure and glass). `smoothstep` lives here.
- `src/film/timeline.ts` composes `KEYS` from thirteen act files in `src/film/acts/` and exposes `ACTS` and `actAt`.
- `src/film/sample.ts` is the zero-allocation sampler with the re-clocked Catmull-Rom.
- `src/film/states.ts` is the control plane: `computeFilmStates(p)` returns thirteen scalars from `ramplike` windows, reusing one scratch object. This is the best thing in the codebase and everything below extends it rather than replacing it.
- `src/film/shots.ts` has `SHOTS: Record<ActId, ShotProfile>` with `kind` and `dampPerSecond`.
- `src/film/lighting.ts` has `STAGE_LIGHTING: Record<ActId, StageLightState>`.
- `src/film/FilmDirector.tsx` is the single `useFrame` that writes camera, pose, FOV, dissolve, screen, internals, and lights. No React renders.
- `src/film/internals/Internals.tsx` holds `InternalsControl` and animates four groups: board, silicon, power, optics.
- `src/zoom/zoom.ts` has `dollyZoomFov`, `matchCutOpacity`, `pinnedScale`, `revealScale`.
- `src/film/Scrubber.tsx` plus `?t=` is your instrument. Use it constantly.

Rules that stay true:

- Scroll-driven values never enter React state. MotionValues and refs only.
- Zero allocation in `useFrame`.
- Everything is a pure function of progress. No time-based animation in the film, or scrubbing backward will desync.
- `prefers-reduced-motion` snaps poses, cancels sway, and turns every zoom into a crossfade.
- `npm run verify` passes before you are done.

---

## 2. THE CORE PROBLEM WITH THE CURRENT EXPLODE

`Internals.tsx` moves four groups along z with fixed spreads:

```
BOARD_SPREAD = 0.0012, OPTICS_SPREAD = 0.0028, CELL_SEPARATE = 0.006
```

Three limitations, in order of how much they cost you:

1. **Four groups is not an exploded view.** A real exploded view separates every part along its own assembly axis. Right now the board's shield, the connectors, and the coils all travel as one block, so the x-ray act shows a stack of four slabs rather than a machine coming apart.
2. **Z-axis only.** Real exploded views fan parts outward, not just backward. A part in the upper-left should travel up and left as well as back, because that is the direction it would come out.
3. **No per-part stagger.** `docs/motion.md` claims the explosion reads as a wave, but the implementation applies the same `c.explode` scalar to all four groups simultaneously. It pops.

Fix all three with a per-part explode registry.

---

## 3. THE EXPLODED VIEW SYSTEM

### 3.1 Part registry

Create `src/film/internals/explode.ts`:

```ts
/** One part's explode behaviour. Direction is a unit vector in phone-local space. */
export interface ExplodePart {
  id: string
  /** Assembly origin in meters, used to derive the radial component. */
  origin: [number, number, number]
  /** Distance this part travels at explode = 1, in meters. */
  distance: number
  /** 0..1 fraction of the explode window before this part starts moving. */
  delay: number
  /** Extra rotation at full explode, in radians, so parts turn as they lift. */
  tumble?: [number, number, number]
  /** Which layer it belongs to, for the dim and focus passes. */
  layer: 'chassis' | 'board' | 'silicon' | 'power' | 'optics' | 'thermal'
}
```

Direction: derive it, do not author it. A part's explode vector is its offset from the assembly centroid, normalised, then blended with the z axis:

```ts
/** Radial-plus-axial explode direction. radialMix 0 = pure z, 1 = pure outward fan. */
export function explodeVector(
  origin: readonly [number, number, number],
  centroid: readonly [number, number, number],
  radialMix: number,
  out: THREE.Vector3,
): THREE.Vector3
```

Use `radialMix` around 0.45. Pure radial looks like an explosion in a cartoon. Pure axial is what you have now. The blend is what reads as a service manual diagram, which is the reference you actually want.

### 3.2 Stagger as a wave

Delay is derived from distance from the centroid, so outer parts start first and the assembly opens from the outside in. Normalise delays into [0, 0.45] so the last part still has 55 percent of the window to complete its travel.

Per-part progress:

```ts
/** Maps the master explode scalar through a part's delay window. */
export function partProgress(explode: number, delay: number): number {
  return smoothstep(Math.min(1, Math.max(0, (explode - delay) / (1 - delay))))
}
```

This is the wave. Twenty parts each starting a few percent apart reads as a machine opening. Four groups starting together reads as a pop.

### 3.3 Apply it without allocating

In `Internals.tsx`, hold one `THREE.Object3D` ref per registered part and one shared scratch `Vector3`. Per frame, loop the registry, compute `partProgress`, scale the precomputed direction, write `position` and `rotation`. Precompute every direction vector once at module load, since origins and the centroid are static.

Twenty to thirty parts at this cost is nothing. The current four-group version is not cheaper in any way that matters.

### 3.4 Parts to register

You have `board.tsx`, `optics.tsx`, `power.tsx`, `silicon.tsx`. Split them into individually exploding parts:

- Chassis: midframe, rear panel, front glass, frame rails.
- Board: PCB, EMI shield lid, shield fence, connectors, decoupling caps as one instanced cluster.
- Silicon: substrate, die, BGA array, thermal plate, graphite sheet.
- Power: cell, cell wrap, charge coil, protection board.
- Optics: three lens assemblies as separate parts, each with its own delay, plus the sensor stack behind each.

Prompt A adds the shield can, BGA array, and thermal interface. If you are running this prompt before those exist, register them anyway with a stub mesh so the motion is authored and the geometry drops in later.

---

## 4. THE CONTROL PLANE, EXTENDED

`states.ts` is the right pattern. Extend it, keep the discipline.

New scalars to add to `FilmStates` and `computeFilmStates`:

```ts
/** 0..1 radial fan amount, separate from the axial explode. */
explodeRadial: number
/** 0..1 how far the camera module separates for its own beat. */
explodeOptics: number
/** 0..1 label and callout opacity for the exploded diagram. */
calloutOpacity: number
/** 0..1 cross-section clip, if the cutaway beat is built. */
sectionCut: number
/** 0..1 focus-pull amount toward the current subject. */
focusPull: number
/** 0..1 ambient dust or particle presence in macro beats. */
macroAtmos: number
```

All from `ramplike` windows, all deterministic, all in the one scratch object. Add assertions to `src/film/states.test.ts`: every scalar stays in [0,1] across 1,000 samples, and every scalar returns to 0 by p=1 except `screenOn`.

---

## 5. THE FOUR COMPONENT CLOSEUPS

Each closeup is a beat with an entry, a hold, and an exit. The hold is the part people forget. A macro shot that never stops moving gives the eye nothing to land on.

### 5.1 The chip, 0.33 to 0.47

Already the longest act and already dollies to near-orthographic at 0.425.

- Entry rides `dollyZoomFov` from 0.33 to 0.365. `docs/motion.md` says it is wired once here. Verify it is actually reaching the camera FOV and that the background genuinely warps, because a dolly zoom you cannot see is just a slow push.
- **Add a hold at 0.425 to 0.445.** Currently those two keys differ in pose and camera, so the shot is still drifting through the moment it should be locked. Make 0.432 to 0.440 near-static: same camera position, tiny pose delta, `dampPerSecond` at 3.5 from the macro shot profile. Let the die's emissive and the trace routing carry the motion instead of the camera.
- The BGA array is revealed by `chipLift`. Time the lift so the balls clear the substrate shadow before the camera reaches the flat-on angle, not after.
- Exit at 0.47 pulls out and hands to `rebuild`.

### 5.2 The camera module, 0.52 to 0.72

The dive runs 0.635 to 0.705 via `cameraFocus` and `optical`.

- Stage the lens separation with the new per-part delays: cover glass first, then collar, then barrel, then element, then sensor. Five parts opening in sequence over the window reads as an optical exploded diagram and is far stronger than the whole assembly sliding back together.
- **Rack focus.** Add `focusPull` driving either a real depth-of-field pass or, if the budget says no, a blurred backdrop plane. Measure first. Postprocessing is usually the largest single frame-time line item in a project like this. Check with chrome-devtools MCP before committing to it.
- Hold at 0.685 to 0.700 so the coating shift and the baffle rings have a moment to be looked at.

### 5.3 The battery, 0.89 to 0.93

Already has `explodeBatt`, `battLift`, and `energy`.

- The cell wrap should peel before the cell lifts, a two-stage reveal rather than one slab moving.
- The charge coil is the most visually interesting part in the power group and is currently invisible. Give it its own delay and let it lift last, catching the interior glow.
- `cellGlow.emissiveIntensity` currently goes to `1.2 + energy * 2.2 + battLift * 1.5`, which can reach 4.9. Check it against the act exposure of 1.1 and confirm it is not clipping. Bloom on a clipped emissive is how a render starts looking like a video game.

### 5.4 The port and bottom edge, new

There is no beat for this today, and after Prompt A builds a real receptacle it deserves two seconds.

Options, pick one and say why in the ADR:

- Extend `approach` (0.155 to 0.25) with a rail traverse that ends on the bottom edge. Cheapest, and `approach` is already an arc.
- Insert a short beat between `storage` and `battery`. Cleanest narratively, but it shifts every act boundary after it and invalidates all thirteen film snapshots.

If you shift boundaries, update `ACTS` in `timeline.ts`, every affected `ramplike` window in `states.ts`, and re-capture the snapshots in one commit. Do not split that across commits or the snapshot diffs become unreadable.

---

## 6. CALLOUTS FOR THE EXPLODED VIEW

An exploded view without labels is decoration. With labels it is an explanation, and the x-ray act is where the film earns its keep.

- Anchor each callout to a part's world position, project to NDC each frame, write to a CSS transform on an HTML overlay layer. Do not render text in WebGL for this. The existing overlay in `src/film/overlay/` is the right home, and `XrayReadout.tsx` already exists as the primitive.
- Leader lines from the label to the part. Draw them as a single SVG layer with per-frame path updates, not one element per callout.
- Cull aggressively: a callout hides when its part is occluded, when it is off-screen, when `calloutOpacity` is below a threshold, or when two callouts collide in screen space. Collision resolution can be as simple as hiding the lower-priority one.
- Stagger callout entry against the part's own `partProgress`, so each label arrives as its part settles rather than all of them at once.
- Copy lives in `src/film/chapters.ts` with the rest, never inline in JSX. Every part name and figure must already exist in `src/data/`, because `chapters.test.ts` enforces spec consistency and will catch you.
- Under reduced motion, callouts appear at full opacity with no travel.

---

## 7. TRANSITIONS

This is where one shot is won or lost.

### 7.1 Act handoffs

Thirteen acts means twelve seams. Audit every one by scrubbing slowly across the boundary with `?t=`.

For each boundary check: does the pose derivative match on both sides, does the lighting damp or jump, does any `ramplike` window end exactly where another begins (which produces a visible discontinuity in the second derivative even when the value itself is continuous), and does any material change state within three percent of the boundary.

Fix by overlapping windows rather than butting them. `ramplike(p, 0.25, 0.31, 0.44, 0.52)` and a neighbour starting at 0.52 will seam. Start the neighbour at 0.50 and let them cross.

### 7.2 Shot profiles, extended

`ShotProfile` currently carries only `dampPerSecond`. Extend it:

```ts
export interface ShotProfile {
  kind: ShotKind
  dampPerSecond: number
  /** Damping for the look-at target, usually slower than pose so the aim settles late. */
  targetDampPerSecond: number
  /** Max angular velocity in rad/s. Caps the whip on a hard flick. */
  maxAngularVelocity: number
  /** Max FOV change per second in degrees. Stops the lens snapping on fast scrub. */
  maxFovVelocity: number
  /** Settle fraction: portion of the move spent easing out. Target 0.2. */
  settle: number
}
```

The velocity caps are the fix for the flick problem. A user who throws the scrollbar should get a fast but controlled move, not a whip. Cap in the director, after sampling and before writing to the camera.

### 7.3 Material transitions

- Finish changes in the configurator lerp material parameters over about 400ms on `--ease-out-expo`. Not a snap. `FINISH_COLORS` already pre-mints colours for allocation-free lerping, so use it and extend it to the new finishes and to the non-colour parameters Prompt A adds.
- The shell dissolve is driven by `shellGhost`. Check that `SHELL_MATS` and `FRAME_MATS` in `FilmDirector.tsx` include every material key Prompt A added, or new parts will stay solid straight through the x-ray act. This is the most likely bug from combining these two prompts.
- Emissive ramps (`die`, `cellGlow`, `trace`) ease rather than step, and every one is checked against its act exposure for clipping.

### 7.4 The match cut

`matchCutOpacity` exists and `docs/motion.md` says the phone-to-die handoff rides the x-ray ghost plus the die emissive window. Verify that is real and not aspirational. The test: at the crossfade midpoint, neither layer should be readable. If both are visible at 50 percent, the blend window is too wide and it reads as a dissolve rather than a cut.

### 7.5 Procedural idle and parallax

- Idle sway from low-frequency value noise, not a sine. A sine reads mechanical, and on a slow hero shot the periodicity becomes visible within about six seconds.
- Pointer parallax adds a small clamped offset on top. `parallaxX` and `parallaxY` MotionValues already exist in `FilmRefs`. Clamp the range tightly, roughly 0.5 degrees, or it fights the authored pose.
- Both cancelled under reduced motion.

---

## 8. REDUCED MOTION

`docs/motion.md` says every zoom becomes a crossfade at fixed scale. Extend that to the explode work:

- Explode goes to its final state instantly per act, with no wave and no stagger.
- Callouts appear at full opacity, no travel.
- No idle sway, no parallax, no tumble.
- The static story layout still shows each component separated, because the exploded diagram is information, not decoration, and removing it would remove content rather than motion.

Verify with the existing axe run in `e2e/axe.spec.ts`, which already covers both motion modes.

---

## 9. PERFORMANCE

You are adding per-part transforms, a projection loop, and possibly a depth-of-field pass. Measure, do not assume.

Targets, unchanged from the build prompt: 55fps sustained, no frame over 50ms during act transitions or zoom handoffs, under 4x CPU throttle.

- `scripts/measure-fps.mjs` already exists. Use it.
- Profile with chrome-devtools MCP across the three heaviest windows: the x-ray explode (0.25 to 0.52), the camera dive (0.635 to 0.705), and the battery climax (0.885 to 0.93).
- The projection loop for callouts runs per frame for every visible part. Cull before projecting, not after.
- If depth of field costs more than roughly 3ms, drop it and use the blurred backdrop plane. Note the decision in the ADR.
- Watch for the classic mistake: reading `getBoundingClientRect` inside the frame loop for callout positioning. Cache the canvas rect and invalidate on resize only.

---

## 10. VERIFICATION

Per `docs/tooling.md`: `npm.cmd` and `npx.cmd`, the `.ps1` shims are blocked.

1. `npm run verify`.
2. **The reverse scrub.** Drag the scrubber slowly from 1.0 back to 0.0. Nothing pops, nothing snaps, no part teleports. This is the single most important test in this prompt and it catches more than every other test combined.
3. **The boundary audit.** Step through all twelve act boundaries at 0.002 increments. No visible discontinuity in pose, lighting, or material state.
4. **The flick test.** Throw the scrollbar hard in both directions. The move should be fast and controlled. If it whips or induces nausea, the velocity caps in 7.2 are not applied or are too loose.
5. **The explode read.** At `explode = 0.5`, pause. Can you identify every part and see how it comes out of the assembly? If it reads as a cloud rather than a diagram, `radialMix` is too high or the delays are too tight.
6. **The hold test.** At each of the four closeups, confirm there is a genuine moment where the camera is nearly static. Count it out loud. Under half a second is not a hold.
7. **Frame timing** across the three heavy windows, with numbers in `docs/device-perf.md`.
8. **Snapshot regression.** Re-run `docs/film-snaps/` and review all thirteen diffs by eye before committing.
9. **Reduced motion pass**, full film.

---

## 11. ORDER OF WORK

1. Extend `FilmStates` with the new scalars plus tests. Nothing visual yet, but everything below depends on it.
2. Build `explode.ts`: registry, direction derivation, `partProgress`, tests.
3. Split the four internals groups into registered parts and wire the per-part loop.
4. Tune `radialMix` and the delay spread against the explode read test.
5. Extend `ShotProfile` with velocity caps and target damping. Apply in the director.
6. Audit the twelve act boundaries and fix seams by overlapping windows.
7. Closeup holds: chip first, then camera, then battery.
8. Callout system.
9. The port beat, with the ADR on which option you took.
10. Rack focus, only if the measurement allows it.
11. Idle noise, parallax clamp, reduced-motion pass.
12. Full verification, docs, snapshots.

---

## 12. A NOTE ON GSAP

`opencode.json` has a GSAP MCP wired at `@vinhnguyen/gsap-mcp@1.1.2`. The project runs Motion, and the film is a pure function of scroll progress with no timeline playback.

Do not introduce GSAP into the film. Two animation runtimes in one project is a maintenance tax with no payoff here, and a GSAP timeline would fight the scrub-anywhere determinism that makes the reverse scrub test pass.

GSAP is defensible only for self-contained UI motion fully outside the film, and even then only with an ADR arguing why Motion could not do it. The MCP server being installed is not a reason to use it.
