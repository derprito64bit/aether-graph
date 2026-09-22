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

Create `src/lib/superellipse.ts` with `superellipsePoints` (samples one quadrant of |x/a|^n + |y/b|^n = 1, mirrors into a closed loop, winding kept monotone) and `superellipseShape` (closed THREE.Shape). Watch the quadrant mirroring: naive mirroring reverses winding in two quadrants and produces a bow-tie.

Unit test in `src/lib/superellipse.test.ts`: symmetry about both axes, exactly `perQuadrant * 4` points, no duplicate consecutive points, closed loop, monotone angle progression.

Then: add `BODY_N = 5.0` and `ISLAND_N = 4.2` to `phoneDimensions.ts`; rewrite `createFrameBodyGeometry`, `createFrameRingGeometry`, and `createSquircleGeometry` from `superellipseShape`; keep `roundedRectPath` for genuinely rectangular parts; rename `squirclePath` to `arcCornerPath`. Expose `BODY_N` in the dev scrubber, then freeze it.

---

## 4. CHAMFERS

Raise bevels to physically sensible values in a `CHAMFER` constant in `phoneDimensions.ts`: glassMeet 0.25mm, plateauStep 0.30mm, plateauBase 0.50mm (fillet), collar 0.15mm, button 0.10mm, portMouth 0.20mm. Chamfer faces get a second material instance, `frameChamfer`, at 0.6 roughness, for the twin highlight lines. Bevel segments to 4 on macro-reached parts.

---

## 5. THE CAMERA MODULE

Two-tier plateau (`ISLAND_LOWER`, `ISLAND_UPPER`, `THREAD_RING` with 96 instanced teeth), parametric 7-layer lens factory (`createLensAssembly`: cover dome, knurled collar, gradient barrel, two baffles, front element, aperture hint, iridescent sensor), per-lens AR coating tints via `iridescenceThicknessRange` plus a radial thickness map (confirm prop names via context7 `/pmndrs/drei` + three docs, low saturation), and a per-act accent source for the camera act plus `envTint` in `StageLightState`.

---

## 6. THE CHARGING PORT AND BOTTOM EDGE

Real USB-C receptacle (`PORT` with cavity, tongue, contacts, mouth chamfer), asymmetric bottom rail (centred port, six speaker slots right, mic hole left at a different diameter, all instanced real geometry), top-rail mic + speaker slot. New `portTongue` and `portContact` material keys, added to `SHELL_MATS`.

---

## 7. THE CHIP

Substrate with solder-mask routing, instanced 14x14 BGA array, die with laser-etched marking texture (`siliconTextures.ts`, original codes only), procedural floorplan map, decoupling caps, perforated EMI shield can (lid + fence, new internals materials), graphite thermal plate, routing-map trace ring driven by `chipFocus`. Load `dataviz` before any metric bars on `/performance`.

---

## 8. COLOUR THEMES

Extend `FinishParams` with family, clearcoat recipe, grain amplitude, antenna colour, env tint, and UI accent. Five finishes: Obsidian (ceramic), Titanium (brushed), Glacier (glass), Ember (anodised, sheen), Slate (textured). Per-family material recipes in `createPhoneMaterials`. Four frame material instances for corner-correct grain rotation. Site accent stays fixed; `uiAccent` drives only local elements and must clear 4.5:1 on surface (assert in `product.test.ts`).

---

## 9. REMAINING SURFACE WORK

Antenna bands as inset geometry, recessed buttons with gap lines and distinct textures, SIM tray parting line + pinhole, 0.12mm panel gaps with dark interiors, off-screen polarizer cast + gradient, sub-threshold oleophobic smudge, subpixel hint gated below 12cm, regulatory text block.

---

## 10. COLOUR MANAGEMENT

`THREE.ColorManagement.enabled`, one tone curve (AgX or ACES), sRGB authored once, canvas texture colour spaces explicit, `look.exposure` confirmed reaching `toneMappingExposure`, macros a third-stop below heroes. Written into `docs/rendering.md`.

---

## 11. BUDGET

120k tris LOD0, 40k LOD1, 8k LOD2, merged static shell, instanced repeats, shared maps, extended disposal. Numbers in `docs/device-perf.md`.

---

## 12. VERIFICATION

`npm run verify`; grayscale test; silhouette test; 360-degree rotation test; 8cm macro test; port test; chip test at `?t=0.425`; five-finish test at final keyframe; film snapshot regression with eye-reviewed diffs; originality gate.

---

## 13. ORDER OF WORK

Superellipse, chamfers, grain rotation, lens stack + plateau + thread ring, AR coating, port + bottom rail, chip, finish families, surface work, colour audit + LODs + docs + verification. Geometry in grey first.

---

## OPEN CONFLICT, resolve before Prompt A starts

Section 5 assumes the offset two-tier plateau vocabulary. The human's chat instruction asks for a Vivo X300 Ultra / Oppo Ultra style dial-like circular camera. These contradict on module shape. Pick one (amend to a centred circular dial with original detailing, or keep the offset plateau and drop the dial reference) before building. Do not hybridise.
