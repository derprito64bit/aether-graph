# PROMPT A2: The circular camera module, medallion inlay, bezel, and panel split

Run this against `C:\Users\Aaron\aether-one-x-v2` in opencode.

**This supersedes section 5 of Prompt A** (the two-tier square plateau) and **extends section 9** (surface work) with the bezel and panel split. Everything else in Prompt A still stands: the superellipse body, the chamfer constants, the port cavity, the chip package, the finish families. If you have already built the square plateau, this replaces it.

---

## 0. ROLE AND THE POINT OF THIS

You are a hard-surface 3D artist. You are rebuilding the rear camera module as a large circular assembly with a machined collar, an inlaid metal medallion, arc-wrapped lens typography, a time-of-flight scanner, and a textured display bezel.

This is deliberately the hardest work in the project. Four things in it are genuinely difficult in real-time 3D and most attempts fail at least one:

1. A metal inlay set under glass that stays crisp at 8cm and reads as a different material, not a decal.
2. Text wrapped around a ring arc, legible at macro, aliasing-free at distance.
3. Knurling on a cylinder that reads as machined metal without costing 40k triangles.
4. A ToF window that reads as near-black but not flat, which is a narrow material target.

Section 12 scores you on all of it. Do not skip it.

---

## 1. ORIGINALITY

A large circular camera island is a generic form. Many manufacturers use one and a circle is not anyone's property. What makes a specific real module identifiable is the combination: exact ring proportions, lens count and arrangement, a partner optics brand's medallion, that brand's wordmark on the rail, a particular panel split, and a signature colourway. That combination is what you must not assemble.

- Build the circular module. Knurling and machined collars are manufacturing techniques, not designs.
- Use the original layout in section 2. It is not four lenses in a ring.
- The medallion is an **original mark for a fictional optics partner**. No real optics, camera, or lens manufacturer's name, letterform, or logo anywhere: not in a texture, not in a comment, not in an asset filename.
- Before inventing the partner name, check it does not collide with a real optics or camera brand. Candidates that appear clear: `NOVEK`, `OPTIVAR`, `HELION WORKS`. Search the one you pick, and record the choice in `docs/device-design.md`.
- The `AETHER` device wordmark already exists via `createLogoTexture`. Keep it on the lower rear panel.

Gate before merge: five angles, reviewed as a set, none identifiable as a real product. Append to `docs/device-originality.md`.

---

## 2. THE MODULE

All values in metres, all added to `phoneDimensions.ts` with the millimetre value in a comment. Body reference: `DIM.w = 0.0768`, `DIM.h = 0.1596`, half-height 0.0798.

### 2.1 Placement and overall form

```ts
/** Circular camera module. Centered on the body axis, upper third. */
export const MODULE = {
  cx: 0, // centered horizontally, not offset
  cy: 0.0458, // 45.8mm up from body center
  outerR: 0.0212, // 42.4mm diameter, 55% of body width
  proud: 0.0019, // 1.9mm total rise off the rear panel
  baseFillet: 0.0007, // 0.7mm blend into the rear panel, a fillet not a chamfer
} as const
```

Centring horizontally is a real differentiator and it composes better for the film, because the camera act can orbit the module without the phone's visual centre of mass appearing to shift.

`baseFillet` is a smooth G1 blend, not a flat chamfer. On real hardware the pad-to-panel transition is one machined surface. A flat chamfer there is a common tell.

### 2.2 The collar stack, outside in

```ts
/** Concentric collar rings. Two machined steps, not one band. */
export const COLLAR = {
  outer: { rOut: 0.0212, rIn: 0.0186, rise: 0.0019, knurlTeeth: 168, knurlDepth: 0.00018 },
  step: { rOut: 0.0186, rIn: 0.0172, rise: 0.0012 },
  glass: { r: 0.0172, rise: 0.0008, dome: 0.00006 },
} as const

/** Dark seal ring where the cover glass meets the step. Real assemblies show this line. */
export const GLASS_SEAL = { rOut: 0.01725, rIn: 0.0169, depth: 0.00006 } as const
```

The double step is the key differentiator from a single knurled band, and it gives two separate highlight arcs instead of one.

- Outer collar **outer wall**: knurled.
- Outer collar **top face**: flat and polished. Carries the typography in section 5.
- Step ring **top face**: matte bead-blasted, not polished.

Alternating polished and blasted surfaces across concentric rings is what real machined optical hardware looks like and it costs nothing but a second material.

The seal ring is a thin recessed groove with a near-black, high-roughness interior. It reads as a crisp dark hairline separating glass from metal, and its absence is one of the quieter reasons CG camera modules look moulded rather than assembled.

### 2.3 Lens layout, original

Three round lenses on an equilateral triangle, one rectangular periscope window, an arc flash, a ToF pair, and a microphone. Not four lenses in a ring.

```ts
/** Three round assemblies on a triangle, apex up. Radius from module center. */
export const LENS_RING_R = 0.0092

export const LENSES = [
  { key: 'main', angleDeg: 90, r: 0.0054, barrelDepth: 0.0016, elementZ: -0.0009, coatHue: 2.1 },
  { key: 'ultra', angleDeg: 210, r: 0.0044, barrelDepth: 0.001, elementZ: -0.0005, coatHue: 4.6 },
  { key: 'mid', angleDeg: 330, r: 0.0044, barrelDepth: 0.0021, elementZ: -0.0013, coatHue: 0.3 },
] as const
```

**The per-lens depths matter and are not cosmetic.** A wide-angle optic is physically shallow, a longer focal length is physically deep. If all three barrels are the same depth the module reads as three identical holes, which is the single most common failure in CG camera islands. Ultra is the shallowest at 1.0mm, main sits at 1.6mm, mid-tele is the deepest round lens at 2.1mm. At macro you should be able to tell which is which with the lights off.

```ts
/** Periscope window: a rounded rectangle, not a circle. Folded optic below the triangle. */
export const PERISCOPE = {
  x: 0,
  y: -0.0118,
  w: 0.0128,
  h: 0.0062,
  r: 0.0024,
  recess: 0.0004,
  prismAngleDeg: 40, // interior face angle, so you cannot see straight down
  cavityDepth: 0.0026,
} as const

/** Flash as an arc segment cut into the step ring, not a satellite circle. */
export const FLASH_ARC = {
  startDeg: 24,
  sweepDeg: 34,
  rIn: 0.0176,
  rOut: 0.0184,
  dies: 2, // two LED dies behind one diffuser
  diffuserRough: 0.62,
} as const

/** Module microphone. Present on real modules, almost never modelled. */
export const MODULE_MIC = {
  angleDeg: 152,
  ringR: 0.0152,
  d: 0.0007,
  depth: 0.0011,
} as const
```

The rectangular periscope window is the strongest original cue here. A round cluster plus one rectangular window reads as a folded-optics telephoto, it is visually distinct, and it gives the camera act a shape contrast to cut between.

The mic is 0.7mm and nobody will consciously notice it. That is the point. Its absence is felt; its presence is not. Same logic as the regulatory text block.

### 2.4 The lens stack

Seven layers per round lens, per Prompt A section 5.3: domed cover glass, collar ring, barrel with depth-ramped roughness, two baffle rings, front element, aperture hint, sensor plane. Build `createLensAssembly(spec, materials)` once and call it three times, reading `barrelDepth` and `elementZ` per lens so the depth difference from 2.3 actually reaches the geometry.

Baffle ring placement scales with barrel depth: put them at roughly 35 percent and 70 percent of the barrel. A shallow ultra lens gets its rings closer together, which is correct and reinforces the depth read.

AR coating per lens, per Prompt A section 5.4: each lens gets its own `lensGlass` instance with its `coatHue` driving a different `iridescenceThicknessRange`. Main leans green, ultra leans magenta, mid is near neutral.

### 2.5 The periscope interior

A folded optic looks wrong if you can see straight down into it.

- The cavity floor is an angled prism face at `prismAngleDeg`, catching one hard highlight that swings fast as the camera arcs. That fast-moving single highlight is the visual signature of a prism and it is what distinguishes the window from a dark rectangle.
- The cavity walls are near-black with roughness ramping to 0.9 at depth, same treatment as the round barrels.
- A thin bright edge where the cover glass meets the recess, from the glass thickness catching light. 0.15mm.

---

## 3. THE TIME-OF-FLIGHT SCANNER

You asked for this specifically and A2 previously had three numbers and no treatment. Here is the real thing.

### 3.1 It is two windows, not one

A ToF or laser AF module is an **emitter and a receiver**, and on real hardware they are two separate apertures at slightly different diameters, spaced a few millimetres apart. Modelling it as a single dot is the giveaway.

```ts
/** Time-of-flight scanner: separate emitter and receiver under a shared dark window. */
export const TOF = {
  ringR: 0.0128, // distance from module center
  angleDeg: 18,
  emitter: { d: 0.0021, offsetDeg: -4.2, depth: 0.0008 },
  receiver: { d: 0.0026, offsetDeg: 4.2, depth: 0.0011 },
  window: { w: 0.0082, h: 0.0034, r: 0.0017, recess: 0.00018 },
} as const
```

Both sit under one shared rounded-rectangle cover window, recessed 0.18mm into the step ring.

### 3.2 The material, which is the hard part

The window is an **IR-pass filter**. It has to read as near-black without being flat black, and that is a narrow target.

- Base colour extremely dark, around `#04060a`. Not pure black, which kills all shading information.
- Roughness very low, about 0.06, with clearcoat 1. It is a polished filter, so it should carry a sharp mirror reflection of the lighting rig even while reading as black. **The reflection is the only thing that stops it looking like a hole.**
- A deep red-violet sheen at grazing angles, which is how IR-pass glass actually behaves. Drive it with a Fresnel-weighted `sheenColor` around `#3a0d1e` at low intensity, or a narrow iridescence band. Keep it subtle. Visible head-on, it looks like a bug.
- The emitter aperture is slightly brighter inside than the receiver, because emitter optics are usually a diffusing element while receiver optics are a dark filter. That tiny asymmetry is convincing.

### 3.3 Internals visible through the window

At macro you should be able to just make out, through the dark filter:

- A faint circular diffuser texture over the emitter.
- A darker, flatter receiver aperture with a visible square sensor edge.
- The bridge of housing between them.

Model these as real geometry at very low contrast, sitting under the window material. They will be barely perceptible, which is exactly right. If you can see them clearly, your filter is too transparent.

### 3.4 During the x-ray act

The ToF module is part of `src/film/internals/parts/optics.tsx`. When the internals explode, it separates as its own part with its own delay, and its emitter should carry a faint emissive pulse during the camera act. Register it in the explode registry from Prompt B section 3.

Add material keys `tofWindow`, `tofEmitter`, `tofReceiver`, `tofHousing`.

---

## 4. THE MEDALLION INLAY

The mark sits at the centre of the lens triangle, inlaid under the cover glass.

### 4.1 The mark

An original glyph for the fictional optics partner:

- A six-blade aperture iris inside a thin ring. Aperture-blade iconography is generic optics imagery and is the right visual register.
- Blades are straight-edged, rotationally symmetric at 60 degrees, with a small hexagonal opening at the centre.
- Outer ring is a hairline, about 0.08mm wide at final scale.
- Total mark diameter 0.0062.
- No letterforms in the glyph. The partner name appears only as arc text in section 5.

Do not sketch this from any existing optics logo. Construct it from iris geometry: six identical quadrilateral blades rotated 60 degrees with a fixed overlap offset. That is how a real iris is built and it produces an original, correct-looking mark.

### 4.2 How it is physically made, which determines how you model it

On real hardware this is a metal inlay bonded under the cover glass, or a PVD deposit on the glass underside. Either way the mark is **below the glass surface**. That matters, because the glass reflection passes over the mark while the mark's own specular sits underneath it. Getting that layering right is most of what sells it.

```ts
/** Medallion: polished metal inlay bonded under the cover glass. */
export const MEDALLION = {
  r: 0.0031,
  z: -0.00012, // 0.12mm below the glass outer face
  thickness: 0.00008,
  ringWidth: 0.00008,
} as const
```

### 4.3 Two implementation paths, and you need both

**Path A, real geometry, for the silhouette.** Build the six-blade iris as a `THREE.Shape` with holes, extrude at `MEDALLION.thickness`, place at `MEDALLION.z`. Crisp at any camera distance, which is the point. At 8cm a texture-based mark shows its texel grid; geometry does not. Six straight-edged blades plus a ring is roughly 400 triangles.

**Path B, a texture, for the micro-detail.** Generate a small map in a new `medallionTexture.ts` for surface character only: fine radial brush marks on the blade faces, slightly different roughness on the ring than the blades. This is detail you cannot get from geometry at a sane triangle count, and it stops the inlay looking like flat vector art.

Do not use a texture for the shape. Do not use geometry for the brushing.

### 4.4 The material

Three specific requirements:

- **Metalness 1, roughness about 0.14.** Polished metal under glass, much sharper than the collar and much brighter than the barrels.
- **Its highlight must move differently from the glass highlight above it.** Because the inlay sits 0.12mm below a slightly domed glass, as the camera arcs the two specular highlights separate and recross. If your render shows one highlight moving as a unit, the z-offset is not being respected.
- **A faint anisotropic response** along the radial brush direction from path B, so each blade catches light along its own axis. Six blades each flashing at a slightly different camera angle is the effect.

Add `medallion` and `medallionRing`. **Both must go into `SHELL_MATS` in `FilmDirector.tsx`** or the medallion stays solid while the shell dissolves during the x-ray act. This is the most likely way to break the film from this prompt.

Extend `disposePhoneMaterials` to walk any new map slot you use, including `anisotropyMap` and `sheenColorMap`. The current walk covers only `map`, `roughnessMap`, and `emissiveMap`.

---

## 5. TYPOGRAPHY, AT TWO SCALES

Real optical hardware carries text at two distinct scales, and using only one is a tell.

### 5.1 Collar arc text, the large scale

On the polished top face of the outer collar:

- The partner name, arc-wrapped, spanning about 50 degrees on the lower-left of the ring.
- A small engraved index notch at 12 o'clock.

### 5.2 Inner micro-text, the small scale

On the cover glass surface, immediately outside each lens collar, tiny markings at each optic. This is the detail that makes the module look like instrumentation:

- Near main: `23MM 1:1.6`
- Near ultra: `14MM 1:2.2`
- Near mid: `50MM 1:1.9`
- Near the periscope window: `135MM 1:3.0`
- Near the ToF window: a small sensor designation, original, no real vendor codes.

Classic lens-barrel typography, entirely generic, and it instantly reads as optical hardware. These are roughly a third the size of the collar text and sit on a different surface at a different height, which is what creates the two-scale effect.

### 5.3 How to render text on curved and flat surfaces

Generate a single annular texture in `phoneTextures.ts` for the collar, and a separate flat map for the cover-glass micro-text. Draw into a canvas, using `rotate` and `translate` per glyph for the arc.

Requirements that separate a good result from a bad one:

- **2048 square minimum** for the collar map. Text occupies a thin band and macro gets close. Smaller will be mush at 8cm.
- **Apply as roughness and a subtle normal contribution, not as albedo.** Laser-etched text on polished metal is not a colour change, it is a roughness change. Etched areas scatter, polished areas reflect. Painted as light grey albedo it will look like a sticker and will betray itself at grazing angles by staying pale while the metal around it darkens.
- **Mip-mapping and anisotropic filtering both on.** Set `texture.anisotropy` to the renderer maximum. Thin arc text at a shallow angle is the worst aliasing case in the whole model.
- **Check the seam.** An annular texture wraps at zero degrees. No glyph may straddle it.
- Keep text tiny and low contrast. Oversized text is the fastest way to make the module look fake.

---

## 6. KNURLING WITHOUT THE TRIANGLE BUDGET

168 teeth as real geometry is roughly 4k triangles as simple wedges, which is affordable at LOD0 and not at LOD1.

- **LOD0**: instanced geometry. One wedge, 168 instances via `InstancedMesh` rotated around the collar axis. Real silhouette at macro.
- **LOD1**: normal map plus roughness map on a plain cylinder wall. Correct beyond about 25cm, costs nothing.
- **LOD2**: plain cylinder.

Switch on the camera-distance value the director already computes for framing, **not** on viewport size, because the macro act gets close at a fixed viewport.

At LOD0 the teeth must break the silhouette against the background. `knurlDepth` is 0.18mm for that reason. If the outline is smooth, they are too shallow.

---

## 7. THE DISPLAY BEZEL

Currently the repo has `BEZEL = 0.00145` and `DISPLAY_INSET = 0.0016` as pure geometry with no surface treatment, and the bezel material does not exist as a distinct key. A real bezel is not a black void and treating it as one flattens the whole front of the device.

```ts
/** Display bezel: a fine matte ink layer printed on the glass underside. */
export const BEZEL_SURFACE = {
  /** Not pure black. Pure black kills all shading information. */
  color: '#07080b',
  roughness: 0.84,
  /** The ink layer sits under the glass, so the glass reflection passes over it. */
  z: 0.0026,
  /** Soft feathered edge where ink meets the active area. Real ink is not a hard line. */
  feather: 0.00012,
} as const
```

Requirements:

- **The bezel is under the glass.** The front glass reflection passes across it unbroken. If your bezel is opaque black on top of the glass, the reflection will stop at the bezel edge and the front of the phone will look like two separate objects.
- **A fine matte grain**, low amplitude, high frequency. Printed ink has texture. A perfectly smooth bezel reads as a rendered void.
- **A feathered transition** to the active area, about 0.12mm. Real ink layers have a slight gradient at the edge from the printing process. A mathematically hard line is a tell.
- **A slight cool cast** relative to the off screen, because the ink and the panel are different materials. Very slight. If you can name the colour it is too much.
- **The punch-hole**: a 3.2mm aperture with a 0.15mm dark ring, a visible glass thickness edge inside the cut, and a tiny lens glint at the bottom of the well. The well has depth. A flat black circle is the single most common front-face failure.

Add material key `bezel`. Add it to `SHELL_MATS`.

---

## 8. THE REAR PANEL SPLIT

A two-material rear panel is a generic construction used across the industry and it is worth having, because it gives the rear face a horizontal line that stops the panel reading as one undifferentiated slab.

```ts
/** Optional two-material rear panel. Upper panel is the finish family, lower is textured. */
export const PANEL_SPLIT = {
  seamY: -0.0126, // 12.6mm below body center, lower third
  seamWidth: 0.00035,
  step: 0.00012, // lower panel sits 0.12mm proud of the upper
  seamChamfer: 0.00008,
} as const
```

- Make it **per finish**, not global. Add `panelSplit?: boolean` to `FinishParams`. Only `Slate` and `Ember` get it. `Obsidian`, `Titanium`, and `Glacier` are single-panel. A range where some colourways have a different construction is how real ranges work, and it makes the configurator meaningfully more interesting than a colour picker.
- The seam is **real geometry**: a recessed groove with a dark self-shadowing interior, plus a small step so the lower panel is physically proud. Both panels get a chamfer into the seam.
- The lower panel uses the `textured` family recipe from Prompt A section 8.3: strong detail normal, clearcoat near zero, roughness 0.55. It should look grippy against the smoother upper panel.
- The `AETHER` wordmark sits on the lower panel when the split is present, and centred on the single panel when it is not.

Add material keys `panelLower` and `panelSeam`. Add both to `SHELL_MATS`.

---

## 9. INTEGRATION WITH THE REPO

Things that will break if you miss them:

- `ISLAND`, `ISLAND_SEAT`, `ISLAND_FACE_Z`, `FLASH` in `phoneDimensions.ts` are for the old square pad. Remove them and update every reference. `createSquircleGeometry` and `createSeatRingGeometry` exist to serve them, so they go too unless something else uses them.
- `CameraAssembly.tsx` builds from a flat `LENS_LAYOUT` of three entries at hardcoded x and y. Replace with polar placement from `LENS_RING_R` and `angleDeg`.
- `lensRefs` is keyed by `FocusLensId` and is read by the camera focal strip on `/cameras` to re-focus the matching 3D lens. Keep those keys working. `mid` replaces `tele` as a round lens and the periscope is a new fourth target, so either extend `FocusLensId` to four entries or explicitly decide the periscope is not focusable and say so in a comment.
- `src/data/product.ts` has `CAMERA_LENSES` and `FOCAL_LENGTHS` driving `/cameras`. The focal lengths in section 5.2 must match what is in there, or `chapters.test.ts` and `product.test.ts` will fail on spec consistency. Update the data first, then the geometry.
- `SHELL_MATS` and `FRAME_MATS` in `FilmDirector.tsx`: add every new key. `medallion`, `medallionRing`, `collarOuter`, `collarStep`, `glassSeal`, `periscopeGlass`, `periscopePrism`, `flashArc`, `flashDiffuser`, `tofWindow`, `tofEmitter`, `tofReceiver`, `tofHousing`, `moduleMic`, `bezel`, `panelLower`, `panelSeam`.
- `src/film/internals/parts/optics.tsx` models the internal camera housings that explode during the x-ray act. Its geometry should roughly match the new module footprint, or the exploded view will show housings that do not line up with the lenses the viewer just saw. Add the ToF module as its own exploding part.
- The camera act keys in `src/film/acts/camera.ts` dive to specific world positions between 0.635 and 0.705. The module has moved from offset-left to centred, so **every one of those keys needs re-aiming.** Use the scrubber with `?t=`. Do not nudge numbers blind.
- Re-capture `docs/film-snaps/` after, and review all thirteen diffs by eye.

---

## 10. LIGHTING THE MODULE

A circular module lives or dies on a bright soft source raking across the collar so the knurl catches a travelling glint and the polished top face carries a clean arc highlight.

In `src/film/lighting.ts` the `camera` act is `key: 2.4, fill: 0.6, rim: 1.4, env: 1, exposure: 1.05`. Add a per-act accent source high and off-axis, tuned so that at the macro keyframes you can see, simultaneously and as separate things:

1. An arc highlight on the polished collar top face.
2. A travelling glint across the knurled outer wall.
3. A separate, smaller highlight on the domed cover glass.
4. The medallion's own sharp specular, underneath number 3 and moving independently.
5. The ToF window's mirror reflection, which is the only thing keeping it from reading as a hole.

Five distinguishable highlights on one component is the target. If you see two, the module is under-lit or the surfaces are too uniform in roughness.

Add `envTint` to `StageLightState` so the camera act can push the environment slightly cooler, which makes the AR coating shift, the medallion metal, and the ToF sheen all read more clearly.

---

## 11. BUDGET

- Whole device under 120k triangles at LOD0. The module is the largest single consumer: knurl 4k, three lens stacks about 9k, medallion 0.4k, collar rings 3k.
- LOD1 around 40k: knurl to normal map, drop baffle rings, drop ToF internals, drop micro-text map, halve collar segments.
- LOD2 around 8k: plain collar, flat lens discs, no medallion geometry.
- Instance everything repeated: knurl teeth, baffle rings, speaker slots, BGA balls.
- Texture memory is now the real risk. You are adding the collar annulus at 2048, the micro-text map, the medallion detail map, the bezel grain, and the lower panel texture. Share maps where content is identical, generate at the smallest size that survives macro, and extend the disposal walk.

Record in `docs/device-perf.md`. Numbers, not adjectives.

---

## 12. THE SCORING RUBRIC

Score yourself honestly in `docs/device-design.md`. Fifteen checks, pass or fail, no partial credit.

1. **Medallion crispness.** At 8cm, blade edges clean, no texel stepping, no soft ramp. Fails if a texture drove the shape.
2. **Medallion separation.** Orbit 40 degrees. Glass highlight and medallion highlight visibly separate and recross. Fails if they move as one.
3. **Medallion material.** Unmistakably different material from the glass above and the island below. Fails if it reads as printed artwork.
4. **Collar text legibility.** Readable at 8cm. No shimmer or crawling at 1m. Fails on either.
5. **Text material.** At a grazing angle the etched text darkens and scatters with the metal. Fails if it stays constant light grey.
6. **Two type scales.** Collar text and per-lens micro-text are visibly different sizes on different surfaces. Fails if there is only one scale.
7. **Lens depth differentiation.** With flat lighting, you can tell ultra from main from mid by barrel depth alone. Fails if all three read the same.
8. **Knurl silhouette.** At LOD0 against a dark background, individual teeth break the outline.
9. **Knurl LOD handoff.** Pull from 8cm to 60cm. No visible pop at the switch.
10. **ToF reads as two apertures.** Emitter and receiver are distinguishable at macro, at different diameters. Fails on a single dot.
11. **ToF is black but not flat.** It carries a sharp mirror reflection of the rig and a grazing-angle sheen. Fails if it reads as a hole or as flat black.
12. **Periscope reads as folded optics.** You cannot see straight down into it, and the prism face carries one fast-moving hard highlight.
13. **Bezel is not a void.** The front glass reflection passes unbroken across the bezel onto the screen, and the bezel has visible grain. Fails if the reflection stops at the bezel edge.
14. **Punch-hole has depth.** A visible well with a glass-thickness edge and an internal glint. Fails on a flat black circle.
15. **Originality gate.** Five angles reviewed as a set, none identifiable as a real product. Fails on any doubt.

Report as a number out of fifteen with a one-line note per failure. Do not claim a pass you have not rendered and looked at.

---

## 13. VERIFICATION

Per `docs/tooling.md`: use `npm.cmd` and `npx.cmd`, the PowerShell shims are blocked. Context7 resolves drei as `/pmndrs/drei`. Confirm current `MeshPhysicalMaterial` anisotropy, iridescence, and sheen prop names there before writing material code.

1. `npm run verify`.
2. The fifteen rubric checks, each with a committed render.
3. **Grayscale test.** Force all albedo to mid-grey. The module must still read as a machined assembly with distinct concentric parts and three different lens depths. If it flattens into a disc, roughness values are too uniform across the rings.
4. **Silhouette test** at 200px. Clean circle with visible texture at the rim.
5. **Aliasing sweep.** Render at 1m, 2m, 4m. No crawling on collar text, micro-text, or the knurl normal map at any distance. This is the check people skip and it ruins the wide shots.
6. **Front-face test.** Render the front at three angles with the screen off. Bezel, punch-hole well, and glass reflection must read as one layered assembly.
7. **Finish split test.** Cycle all five finishes. `Slate` and `Ember` show the seam and step; the other three do not. The seam must self-shadow into a crisp line.
8. **Triangle and texture memory** at all three LODs, in `docs/device-perf.md`.
9. **Frame time** through the camera act 0.52 to 0.72 under 4x CPU throttle via chrome-devtools MCP.
10. Re-run and review all thirteen film snapshots.

---

## 14. ORDER OF WORK

1. Update `src/data/product.ts` focal lengths first, so the spec tests stay green.
2. Strip the old square pad constants and geometry factories.
3. New module constants in `phoneDimensions.ts`.
4. Collar stack geometry, two rings plus seal groove, plain materials. **Look at it in flat grey before going further.**
5. Polar lens placement, then the lens assembly factory with per-lens depth.
6. Periscope window and prism interior.
7. Flash arc, ToF pair, module mic.
8. Medallion: geometry first, then micro-detail texture, then material.
9. Collar arc text, then per-lens micro-text.
10. Knurling: LOD0 instanced, then LOD1 maps, then the switch.
11. Bezel surface and punch-hole well.
12. Panel split, gated per finish.
13. Lighting pass until all five highlights are present.
14. Re-author the camera act keys with the scrubber.
15. LODs, budget, rubric, docs, snapshots.

Build the collar in flat grey before touching the medallion. If the concentric rings do not read as machined metal in grey with no maps at all, no amount of inlay detail will rescue the module.
