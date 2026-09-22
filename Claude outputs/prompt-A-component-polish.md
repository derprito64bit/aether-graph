# PROMPT A: Component fidelity and finish

Run this against `C:\Users\Aaron\aether-one-x-v2` in opencode. It is scoped to the device's physical components and their materials. It does not touch the timeline, the overlay, the routes, or the data layer. Prompt B covers animation.

---

## 0. ROLE

You are a hard-surface 3D artist and rendering engineer working inside an existing, healthy codebase. Your job is to take the Aether One X device from "correct but plain" to "reads as a manufactured object at macro distance".

You are not redesigning the device. You are detailing it.

---

## 1. WHAT IS ALREADY THERE

Read these before changing anything. They are the contract you are working inside.

- `src/components/PhoneViewer/phoneDimensions.ts` is the single source of truth for every measurement, in metres. `DIM` is 0.0768 by 0.1596 by 0.0078. Every new constant goes here, named, with a comment giving the real-world millimetre value.
- `src/components/PhoneViewer/phoneGeometry.ts` holds the geometry factories and a `disposeGeometries` helper.
- `src/components/PhoneViewer/phoneMaterials.ts` holds `PhoneMaterialSet`, `MATERIAL_KEYS`, `FINISH_PARAMS`, `FINISH_COLORS`, and `disposePhoneMaterials`. Every material is created per instance so the film can own its own set.
- `src/components/PhoneViewer/CameraAssembly.tsx` builds the rear optics from `LENS_LAYOUT`.
- `src/components/PhoneViewer/phoneTextures.ts` generates the procedural maps.
- `src/film/internals/parts/silicon.tsx` is the A1 Ultra package, and `internalsMaterials.ts` is its material registry.
- `src/film/FilmDirector.tsx` lists `SHELL_MATS` and `FRAME_MATS`. **Any material key you add must be added to those arrays or it will not dissolve during the x-ray act.** This is the single most likely way to break the film from this prompt.

Constraints that stay true:

- Every material is transparent from birth so the opacity dissolve never triggers a mid-film shader recompile. Keep that.
- Zero allocation in `useFrame`. Scratch objects only.
- Dispose everything you create. `disposePhoneMaterials` walks `MATERIAL_KEYS` and disposes `map`, `roughnessMap`, and `emissiveMap`. If you use a slot it does not walk, such as `normalMap`, `clearcoatNormalMap`, `anisotropyMap`, or `iridescenceThicknessMap`, **extend the disposal walk in the same commit.**
- All assets stay procedural and local. Nothing is fetched.
- `npm run verify` passes before you are done.

---

## 2. ORIGINALITY GATE

The device is fictional and must stay original industrial design. You are building in the general genre of a pro-optic camera flagship, which is a genre the way "sedan" is a genre. You are not reproducing any specific real device.

- No real manufacturer's wordmark, logo, glyph language, or typeface.
- No real device's camera island shape, lens layout, or plateau geometry.
- Do not work from a specific real product's CAD, press renders, teardown photos, or 3D scans.
- What you study instead is physics and manufacturing: how an anti-reflective coating shifts colour off-axis, how a machined collar takes a chamfer, how a BGA package is actually assembled, how anodising differs from ceramic. These are material properties, not anyone's design.

Before you finish, render five angles, review them as a set, and confirm none is identifiable as a real product. Append the result to `docs/device-originality.md`.

---

## 3. THE FOUNDATION FIX: A REAL SUPERELLIPSE

`squirclePath()` in `phoneGeometry.ts` is misnamed. It traces corners with `quadraticCurveTo`, which is a Bézier approximation of a circular arc. That produces a curvature discontinuity where the corner meets the straight edge. Your eye cannot name it, but it reads the silhouette as cheap plastic. This is the highest-leverage change in this entire prompt, and everything else sits on top of it.

Create `src/lib/superellipse.ts`:

```ts
/** Samples one quadrant of |x/a|^n + |y/b|^n = 1 and mirrors it into a closed loop. */
export function superellipsePoints(
  halfW: number,
  halfH: number,
  n: number,
  perQuadrant: number,
): Array<[number, number]> {
  const pts: Array<[number, number]> = []
  const inv = 2 / n
  for (let q = 0; q < 4; q++) {
    for (let i = 0; i < perQuadrant; i++) {
      const t = (i / perQuadrant) * (Math.PI / 2)
      const c = Math.cos(t)
      const s = Math.sin(t)
      const x = halfW * Math.sign(c) * Math.abs(c) ** inv
      const y = halfH * Math.sign(s) * Math.abs(s) ** inv
      const sx = q === 0 || q === 3 ? 1 : -1
      const sy = q < 2 ? 1 : -1
      pts.push([x * sx, y * sy])
    }
  }
  return pts
}

/** Builds a closed THREE.Shape from a superellipse outline. */
export function superellipseShape(halfW: number, halfH: number, n: number, perQuadrant = 48) {
  const shape = new THREE.Shape()
  const pts = superellipsePoints(halfW, halfH, n, perQuadrant)
  // ... moveTo first, lineTo rest, closePath
  return shape
}
```

Watch the quadrant mirroring: naive mirroring reverses winding in two quadrants and produces a bow-tie. Sample quadrant one, then emit the mirrors in the order that keeps the loop monotone around the perimeter.

Unit test it in `src/lib/superellipse.test.ts`: symmetry about both axes, exactly `perQuadrant * 4` points, no duplicate consecutive points, closed loop, and monotone angle progression around the perimeter.

Then:

- Add `BODY_N = 5.0` and `ISLAND_N = 4.2` to `phoneDimensions.ts` with a comment explaining what the exponent controls.
- Rewrite `createFrameBodyGeometry`, `createFrameRingGeometry`, and `createSquircleGeometry` to build from `superellipseShape` instead of `roundedRectPath` and `squirclePath`.
- Keep `roundedRectPath` for genuinely rectangular parts (buttons, SIM tray, port collar). Rename `squirclePath` to `arcCornerPath` so nobody is misled again.
- Expose `BODY_N` in the dev scrubber so it can be tuned by eye, then frozen. The difference between n=2, n=4, and n=5.5 is the difference between a bar of soap, a phone, and a brick.

---

## 4. CHAMFERS

Current bevels are far too small to do their job. `createSquircleGeometry` uses `bevelSize = 0.00012`, which is 0.12mm, and `createFrameRingGeometry` uses 0.00016. A bevel that small receives no specular highlight, so it renders as a hard colour boundary.

Raise them to physically sensible values and put every one in `phoneDimensions.ts` as a named constant:

```ts
/** Chamfer sizes in meters. Every visible edge gets one or it renders as a hard boundary. */
export const CHAMFER = {
  glassMeet: 0.00025, // 0.25mm, frame to glass, carries the main specular line
  plateauStep: 0.0003, // 0.30mm, between camera pad tiers
  plateauBase: 0.0005, // 0.50mm, pad into the rear panel, a fillet not a flat
  collar: 0.00015, // 0.15mm, lens collar outer edge
  button: 0.0001, // 0.10mm
  portMouth: 0.0002, // 0.20mm
} as const
```

The chamfer faces must be **smoother than the surfaces they join**, because a machining tool polishes them. Give the frame a second material instance, `frameChamfer`, with roughness about 0.6 of `frameRoughness`, assigned to the bevel geometry group. The payoff is two parallel highlight lines running down the rail, one on the flat and one on the chamfer, which is the visual signature of real chamfered metal and is currently absent.

Raise `bevelSegments` from 2 or 3 to 4 on anything the macro camera reaches. That is the island, the collars, and the frame.

---

## 5. THE CAMERA MODULE

This is the largest single win available and the component the film spends the most time on. The camera act runs 0.52 to 0.72 of the timeline and dives to roughly 8cm.

### 5.1 What is wrong now

`CameraAssembly.tsx` builds each lens from five flat pieces: a collar cylinder, a barrel cylinder, a `circleGeometry` for the glass, a `ringGeometry` focus indicator, and a small `circleGeometry` sensor glint. There is no depth inside the lens. At macro the eye reads a dark disc with a ring around it, which is why it currently looks like a sticker.

The island is also single-tier, at `ISLAND.depth = 0.002`.

### 5.2 Two-tier plateau

Extend `phoneDimensions.ts`:

```ts
/** Camera pad, two tiers. Lower carries flash and rangefinder, upper carries optics. */
export const ISLAND_LOWER = { size: 0.0342, depth: 0.0011 } as const
export const ISLAND_UPPER = { size: 0.0262, depth: 0.0019, dx: -0.0032, dy: 0.0028 } as const
/** Machined accessory thread ring around the pad perimeter. */
export const THREAD_RING = { inner: 0.0163, outer: 0.0171, depth: 0.0004, teeth: 96 } as const
```

The step between tiers gets `CHAMFER.plateauStep`. The pad into the rear panel gets a smooth fillet at `CHAMFER.plateauBase`, not a flat chamfer, because on a real device that transition is one machined surface.

The thread ring is a thin instanced tooth ring. It reads as "this takes a filter adapter" and gives the macro shot something to find. Instance it, do not author 96 meshes.

### 5.3 The lens stack

Replace the flat lens with a parametric factory. One function, called three times. Build from outside in:

```ts
export interface LensSpec {
  key: FocusLensId
  x: number
  y: number
  r: number
  /** AR coating hue in radians around the colour wheel. Each lens differs slightly. */
  coatHue: number
  barrelDepth: number
}

/** Builds one optical assembly: cover glass, collar, barrel, baffles, element, aperture, sensor. */
export function createLensAssembly(spec: LensSpec, materials: PhoneMaterialSet): THREE.Group
```

The seven layers, with real z-separation:

1. **Cover glass**, flush with the collar top, very slight dome (0.05mm rise). Use a shallow `LatheGeometry` or a sphere cap, not a flat circle. The dome is what makes the highlight slide across the lens as the camera arcs, instead of popping on and off.
2. **Collar ring**, machined metal, proud 0.35mm, chamfered top edge, fine knurling on the outer wall. Instance the knurl teeth.
3. **Barrel wall**, a cylinder descending `barrelDepth` (1.4mm for the main lens). Roughness ramps from 0.4 at the mouth to 0.9 at depth. Use a vertical gradient roughness map, generated once in `phoneTextures.ts`.
4. **Two baffle rings**, thin tori at different depths, slightly lower roughness so each catches a thin ring highlight. **These are what create the sense of depth.** Without them the barrel is a black hole.
5. **Front element**, a lens-profile mesh at 0.9mm down, high IOR, dark absorptive tint, low roughness, enough transmission to throw an internal reflection when a bright source is near the axis.
6. **Aperture hint**, a dark ring with a subtly polygonal inner edge suggesting blades.
7. **Sensor plane**, a near-black disc at the bottom with a faint view-dependent iridescent sheen, because a real sensor's microlens array diffracts.

The result is the receding-ring "tunnel" look. That effect alone carries the camera act.

### 5.4 The AR coating, which is the detail that sells it

The anti-reflective coating is what makes a camera module look photographed rather than modelled. It is a view-dependent colour shift, magenta through green, strongest at grazing angles.

`lensGlass` already has `iridescence: 0.2, iridescenceIOR: 1.3`. That is the right starting point and it is currently uniform across all three lenses.

Do two things:

- Give each lens its own `lensGlass` instance with a different `iridescenceThicknessRange` and a slightly different base tint. One leans green, one leans magenta, one is near neutral. In life, coatings are tuned per element, and this tiny inconsistency is strongly convincing.
- Drive the effect with a proper thickness map rather than a constant. Generate a radial gradient `iridescenceThicknessMap` in `phoneTextures.ts` so the shift is stronger at the lens edge than at the centre, which is how a curved coated element actually behaves.

Keep the saturation low. It should read as a faint oil-on-water sheen. High amplitude reads as a bug.

Use context7 (`/pmndrs/drei` and the three docs) to confirm the current `MeshPhysicalMaterial` iridescence prop names before writing. They have changed across recent versions.

### 5.5 Lighting the module

A camera module renders well or badly almost entirely on one thing: whether a bright soft source is positioned to rake across the collar chamfer and drop a highlight arc into the cover glass.

In `src/film/lighting.ts`, the `camera` act currently runs `key: 2.4, fill: 0.6, rim: 1.4, env: 1, exposure: 1.05`. Add a per-act accent source specifically for this act, positioned off-axis and high, tuned so that at the macro keyframes (0.66 to 0.705 in `acts/camera.ts`) the collar carries a crescent highlight and the cover glass carries a separate, smaller one. Two distinct highlights on one lens is the whole trick.

Also add `envTint` to `StageLightState` so the camera act can push the environment slightly cooler, which makes the coating shift read more clearly.

---

## 6. THE CHARGING PORT AND BOTTOM EDGE

Currently `PORT_COLLAR` is a rounded rect at `depth: 0.0005`, which is a shallow collar, not a port. A flat dark rounded rectangle where a port should be is the most common tell in amateur phone models.

Build a real receptacle:

```ts
/** USB-C receptacle. Cavity, internal tongue, chamfered mouth. */
export const PORT = {
  w: 0.0084, // 8.4mm outer opening
  h: 0.0026, // 2.6mm
  r: 0.0013,
  cavityDepth: 0.0042, // 4.2mm deep, real depth so the interior goes dark
  tongue: { w: 0.0064, h: 0.0007, depth: 0.0032, z: 0 },
  mouthChamfer: 0.0002,
} as const
```

- The cavity is a real hole with a dark, high-roughness interior that self-shadows. Do not fake it with a black plane.
- The tongue sits centred in the cavity, lighter than the walls, with a row of contact pads on its face. The pads are a tiny emissive-free metal strip; at any normal distance they read as a glint, which is exactly right.
- The mouth gets `CHAMFER.portMouth`. Real ports have a lead-in chamfer so the connector self-aligns.

Bottom-rail layout, and this matters: **make it asymmetric.** Real devices are not symmetric down there. Current `GRILLE_XS` is four evenly spaced slots. Replace with:

- Port centred.
- Six speaker slots to the right of the port, evenly pitched.
- A single primary microphone hole to the left, at a different diameter from the speaker slots, offset so it does not read as part of the grille.
- Each slot is real geometry with a chamfered mouth and a dark interior, instanced. Not painted dots.

Top rail gets a secondary mic hole and a second speaker slot, also asymmetric.

Add material keys for `portTongue` and `portContact`, and remember section 1: add them to `SHELL_MATS` in `FilmDirector.tsx`.

---

## 7. THE CHIP

`silicon.tsx` is currently a substrate box, a die box, four gold corner marks, and a `ringGeometry` trace. The chip act runs 0.33 to 0.47, which is fourteen percent of the film, and the camera goes near-orthographic and flat-on at 0.425. It needs to hold up under that.

Rebuild the package as a real one:

- **Substrate**, green-black, with a visible solder-mask texture and fine routing.
- **BGA ball array** on the underside, instanced, roughly a 14 by 14 grid of small spheres. Visible when the die lifts on `chipLift`, which is exactly the shot that currently has nothing to reward it.
- **Die**, slightly smaller than the substrate, with a **laser-etched marking texture**: an original product code, a lot number, a fab code. Generate it in a new `siliconTextures.ts`. Keep it low contrast, like real laser marking, not printed white text.
- **Die surface detail**: a procedural floorplan map. Real dies have visible functional blocks at different reflectivities, arrays that look regular and logic that looks noisy. Generate a coarse block map and drive both roughness and a faint emissive. This is what makes a die look like silicon rather than a dark tile.
- **Decoupling capacitors** around the package edge, instanced, tiny dark rectangles with metal end caps.
- **EMI shield can** with a perforated lid and a visible fence, which lifts off separately during the explode. Add `shieldLid` and `shieldFence` to the internals material set.
- **Thermal interface**: a graphite sheet or vapour chamber plate above the package, matte and dark, which also separates during the explode.
- Upgrade the additive `trace` ring into a real routing map: a generated texture of traces fanning out from the package into the board, driven emissive, intensity following `chipFocus`.

Keep the marking text original. No real fab, foundry, process node branding, or chip vendor names.

Load the `dataviz` skill (installed for opencode at `~/.config/opencode/skills/dataviz/`) before you build the CPU, GPU, or NPU metric bars on `/performance`. Do not pick a bar colour before reading it.

---

## 8. COLOUR THEMES

Currently three finishes: `obsidian`, `titanium`, `glacier`, defined in `FINISH_PARAMS` and `FINISH_COLORS`. They differ by colour and two scalars. That is thin. A finish should differ by **material behaviour**, not just hue.

### 8.1 Extend the finish model

```ts
export interface FinishParams {
  key: FinishId
  label: string
  /** Surface family drives the material recipe, not just the colour. */
  family: 'ceramic' | 'anodised' | 'brushed' | 'glass' | 'textured'
  backColor: string
  backMetalness: number
  backRoughness: number
  backClearcoat: number
  backClearcoatRoughness: number
  /** Detail normal amplitude for the surface grain or etch sparkle. */
  grainAmplitude: number
  islandColor: string
  frameColor: string
  frameRoughness: number
  frameAnisotropy: number
  /** Antenna band colour, which on a real device is finish-matched, not always black. */
  antennaColor: string
  /** Environment tint multiplier so a warm finish does not read under a cool rig. */
  envTint: string
  /** UI accent pairing when this finish is selected in the configurator. */
  uiAccent: string
}
```

### 8.2 The five finishes

Keep the existing three, corrected, and add two:

- **Obsidian**, ceramic family. Near-black, matte, `backRoughness` 0.34, high clearcoat, low grain. Antenna bands nearly invisible against it. This is the default and the film hero.
- **Titanium**, brushed family. Directional grain, `frameAnisotropy` 0.7, `backMetalness` 1. Its antenna bands are a shade lighter, not darker, which is the correct behaviour on a metal-backed device.
- **Glacier**, glass family. Pale, cool, high clearcoat at low roughness, strong etch sparkle. The most reflective of the set, so it shows the lighting rig best and is the right finish for the configurator's opening frame.
- **Ember**, anodised family. A deep warm bronze. Anodised aluminium is distinct from ceramic: slightly higher roughness, no clearcoat, a subtle colour shift toward the grazing angle. Add `sheen` and `sheenColor` for that. This finish exists to prove the rig handles a warm subject, and it gives `envTint` something to do.
- **Slate**, textured family. A fine micro-textured matte, `backRoughness` around 0.55, grain amplitude high, near-zero clearcoat. It should look grippy. This is the finish that reads most differently from the others in the configurator and makes the set feel like a real range rather than three colours.

### 8.3 Per-finish material recipes

`createPhoneMaterials` currently applies one recipe with colour substituted. Switch on `family` and vary the actual construction:

- `ceramic`: clearcoat 0.7, clearcoatRoughness 0.2, ceramic mottle on both `map` and `roughnessMap`.
- `brushed`: metalness 1, anisotropy high, directional roughness map, envMapIntensity up.
- `glass`: clearcoat 1, clearcoatRoughness 0.08, high-frequency low-amplitude detail normal for sparkle.
- `anodised`: no clearcoat, sheen enabled, roughness 0.42, very fine isotropic grain.
- `textured`: strong detail normal, clearcoat 0.05, roughness 0.55.

### 8.4 Grain direction at the corners

`frame` currently sets `anisotropyRotation: Math.PI / 2` globally. On a real extruded rail the brush grain runs along each side, which means it rotates 90 degrees at every corner. As written, the grain is wrong on two of the four rails.

Simplest correct fix: four frame material instances with different `anisotropyRotation`, assigned per geometry group. Nobody will see the transition at the corner, and the two long rails will finally read correctly. Document the choice in a comment.

### 8.5 UI theming

Tokens in `src/index.css` are a dark ramp plus one blue accent family (`--color-aether`, `--color-aether-strong`, `--color-aether-deep`). Keep the site accent fixed. Do **not** retheme the whole UI per finish, which would wreck the contrast work already documented in `docs/design-tokens.md`.

Instead, let `uiAccent` drive only local elements: the configurator swatch ring, the selected-finish underline, and the 3D focus ring. Every `uiAccent` value must clear 4.5:1 against `--color-surface`. Add that assertion to a test in `src/data/product.test.ts`, which already exists and is the right home.

---

## 9. REMAINING SURFACE WORK

- **Antenna bands.** Currently a dark material with no geometry. Model four bands, 1.4mm wide, inset 0.05mm as real geometry, coloured from `antennaColor`.
- **Buttons.** Volume rocker 32mm and power key 14mm, both recessed 0.2mm into a machined pocket with a 0.1mm gap line around them. Give the power key a fine horizontal texture the volume rocker does not have.
- **SIM tray.** A visible 0.08mm parting line and a 0.6mm pinhole, both real geometry.
- **Panel gaps.** A 0.12mm gap where the frame meets the front glass and another at the back. Each gap is a recessed inner face with near-black albedo and high roughness so it self-shadows into a crisp hairline.
- **Screen, off.** `screen` is at `#06080d` with clearcoat 1 and roughness 0.045, which is close. Add a slight blue-violet polarizer cast and a very subtle vertical gradient. An off screen is a dark mirror, so what it actually shows is the Lightformer panels. That is the arrival act's money shot.
- **Oleophobic smudge.** A very low-opacity smudge map concentrated in the lower third where a thumb lives. Keep it under the threshold of conscious notice. A trace reads as real; too much reads as dirty.
- **Subpixel hint.** A very high frequency RGB stripe on the display at extremely low amplitude, faded in only below about 12cm camera distance. Do not ship it at normal distance, it will alias badly. Gate it on the same distance value the director already computes for framing.
- **Regulatory text block**, 3mm wide, illegible at any normal distance, present because real devices have one.

---

## 10. COLOUR MANAGEMENT

Confirm and make explicit, then write it into `docs/rendering.md`:

- `THREE.ColorManagement.enabled = true`.
- One tone mapping curve chosen and stated. AgX or ACES Filmic. Not `NoToneMapping`, and not two different curves in the film and the product-page viewers.
- Every authored colour is sRGB and converted once. Procedural canvas textures need their colour space set explicitly or they will be double-converted and come out washed.
- `look.exposure` already exists per keyframe in `key.ts`. Confirm it actually reaches `renderer.toneMappingExposure` in the director, and that the macro keyframes sit roughly a third of a stop below the hero keyframes, or the collar highlights will clip.

---

## 11. BUDGET

- Under 120k triangles at LOD0 for the whole device.
- LOD1 around 40k for mobile and the rail viewers: drop baffles, knurling, thread ring, BGA array, port tongue contacts, regulatory text, and halve the superellipse sampling.
- LOD2 around 8k for anything rendered below 200px.
- Merge the static shell. Body, frame, buttons, and plateau do not move relative to each other outside the x-ray act, so they can be one merged mesh with material groups.
- Instance everything repeated: speaker slots, baffle rings, knurl teeth, thread teeth, BGA balls, decoupling caps, antenna bands.
- Watch texture memory. You are adding several procedural maps. Generate at the smallest size that survives macro, share maps between materials where the content is identical, and extend `disposePhoneMaterials` to cover every new slot.

Record the numbers in `docs/device-perf.md`. Numbers, not adjectives.

---

## 12. VERIFICATION

Use the MCP servers already wired in `opencode.json`. Note from `docs/tooling.md`: use `npm.cmd` and `npx.cmd`, the PowerShell `.ps1` shims are blocked by execution policy. Context7 resolves drei as `/pmndrs/drei`.

1. `npm run verify`. Paste failures verbatim.
2. **Grayscale test.** Force all albedo to mid-grey and render. Everything still visible is form and lighting. If the device becomes a grey slab, the lighting rig is doing no work and no material tuning will rescue it.
3. **Silhouette test.** Render at 200px, pure black on white. If the corners look soft, `BODY_N` is too low.
4. **Rotation test.** Turntable through 360 degrees under the film's real lighting. Watch the highlight on the frame rail. It must travel continuously, never flicker, never segment, never vanish on a face. If it breaks, the chamfer geometry or the anisotropy rotation is wrong.
5. **Macro test.** Camera 8cm from the main lens. The tunnel should have depth, the baffle rings should resolve, the coating should shift as you orbit, the knurling should appear. Nothing should reveal itself as a flat plane.
6. **Port test.** Camera on the bottom rail. The cavity must go genuinely dark at depth and the tongue must catch a separate highlight.
7. **Chip test.** Jump the scrubber to 0.425, the flat-on macro. The die markings, the floorplan, and the decoupling caps should all be legible as distinct features.
8. **Finish test.** Cycle all five finishes at the final keyframe. Each must read as a different material, not a different hue. If Ember and Obsidian differ only in colour, the family recipes are not doing their job.
9. **Regression.** Re-run the film snapshots in `docs/film-snaps/` and review every diff by eye before committing new ones. You have changed geometry that appears in all thirteen.
10. **Originality gate**, section 2.

---

## 13. ORDER OF WORK

Do it in this order. Each step is committable and each one makes the next easier to judge.

1. Superellipse plus tests, wired into the three geometry factories.
2. Chamfer constants raised, `frameChamfer` material, bevel segments up.
3. Grain rotation fix on the frame.
4. Lens stack factory, then the two-tier plateau, then the thread ring.
5. AR coating per lens plus the thickness map.
6. Port cavity, tongue, asymmetric bottom rail.
7. Chip package rebuild.
8. Finish families and the two new finishes.
9. Remaining surface work in section 9.
10. Colour management audit, LODs, budget, docs, verification.

Build geometry first and look at it in flat grey with no materials at all. If it does not read as a phone in grey, materials will not save it, and most people discover that only after losing a day to materials.
