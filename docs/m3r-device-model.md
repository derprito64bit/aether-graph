# META PROMPT: Build the device model

A dedicated prompt for one job: making the Aether One X 3D model look like a real manufactured object rather than a rounded box with a camera sticker.

Run this on its own, against the existing repo, after the model exists in rough form (milestone M3 of the main build prompt). It replaces `src/components/PhoneViewer/PhoneModel.tsx`, the material set, and the lighting rig with something an industrial designer would not wince at.

---

## 0. ROLE AND SCOPE

You are a hard-surface 3D artist and rendering engineer. You have modelled consumer electronics for product launches. You know that the difference between a convincing phone render and a plastic toy is roughly twelve specific things, most of them under half a millimetre.

Your scope is the device only: geometry, materials, lens optics, screen response, and the lighting that reveals them. You do not touch the film timeline, the overlay, the routes, or the data layer. If something outside the model is broken, note it and move on.

Your output is a device that reads as real at three distances: as a silhouette at 200px, as a hero at full screen, and as a macro where the camera is 30cm from the lens barrel.

---

## 1. ORIGINALITY, AS A HARD CONSTRAINT

The Aether One X is a fictional product. The model must be original industrial design. This is not a disclaimer, it is a build requirement, and it is checked before merge.

**The rule:** a person who follows phones should not be able to name a real device from any render you produce.

Specifically:

- No real manufacturer's wordmark, logo, glyph, icon language, or typeface.
- No real device's camera island shape, layout, or plateau geometry.
- No real device's signature silhouette cue, button placement pattern, or frame treatment.
- No real model naming scheme, no real marketing phrase, no real sensor or chip brand name printed on anything.
- Do not work from a specific real product's CAD, teardown renders, press images, or 3D scan. Do not trace one.

**What you can and should study instead:** the physics and manufacturing of the category. How anodised aluminium takes a chamfer. How a brushed grain runs along an extruded rail. How an anti-reflective coating tints a lens cover green or magenta off-axis. How a polarizer makes an off screen not-quite-black. How injection-moulded speaker grilles are actually shaped. How panel gaps of 0.15mm catch a shadow. How a squircle differs from a circular fillet. These are properties of materials and processes, not of any one company's design, and they are where realism actually comes from.

**Useful legitimate references:** your own device, photographed under controlled light. Manufacturing and machining references. Optical coating and lens-design literature. CC0 and public-domain material scans. Physically measured IOR and roughness tables.

**The originality gate (run before merge):** render the device from five angles at full resolution. Look at them as a set. If any single view is identifiable as a specific real product, change the geometry until it is not. Record the five renders in `docs/device-originality.md` with a one-line sign-off.

---

## 2. THE DESIGN BRIEF

Build to this. It is an original design in the general genre of a premium camera-forward flagship, which is a genre in the same way "sedan" is a genre.

### 2.1 Body

- Overall: 159.6mm tall, 76.8mm wide, 7.8mm thick at the body, excluding the camera plateau. Work in metres throughout (`0.1596`, `0.0768`, `0.0078`), matching the existing `framing.ts` constants.
- Cross-section: **a superellipse, not a rounded rectangle.** See section 3.1. This is the single largest realism lever in the whole model and most hobby phone models get it wrong.
- Corner radius: an effective 11mm at the corners, expressed through the superellipse exponent rather than as a fillet.
- Weight cue: the design should read as dense. Thin, tight radii and a flat rail do this. Bulbous, uniform radii read as cheap.

### 2.2 Frame

- Flat perimeter rail, 1.6mm of visible metal face between the front and rear glass.
- A micro-chamfer at each glass meeting edge: 0.25mm at roughly 45 degrees. This chamfer is what catches the long specular line that makes a phone look like a phone. It is not optional.
- Antenna interruption bands: four, 1.4mm wide, in a colour-matched composite that is slightly less reflective than the metal. Model them as real geometry inset 0.05mm, not as a texture stripe.
- Machining: the rail carries a fine directional grain running lengthwise along each side, which means the grain direction changes at the corners. Handle this in the material, section 4.1.

### 2.3 Front

- Symmetric bezels: 1.5mm on all four sides. Equal bezels are a manufacturing flex and read as premium. Asymmetric bottom bezels read as mid-range.
- Glass edge: a 1.2mm micro-curve where the glass meets the rail, not a flat drop and not a waterfall curve. A subtle radius that catches light and then goes flat.
- Front camera: a 3.2mm punch-hole, centred, 4mm down from the top of the active area, with a visible 0.15mm dark ring and a tiny lens glint inside it.
- Earpiece slot: 12mm wide, 0.6mm tall, at the very top of the display area, half-hidden in the bezel line.

### 2.4 Back

- Matte glass with an etched surface. Not gloss. Matte reads as expensive and, more usefully, it shows off the lighting rig instead of mirroring the environment.
- A very fine sparkle in the etch, visible only in macro. Section 4.2.
- An original wordmark, laser-etched, low contrast, positioned in the lower third, rotated 90 degrees to run up the side. Design the wordmark yourself. Keep it geometric and unadorned.
- Regulatory text block, 3mm wide, illegible at any normal distance, present because real devices have one.

### 2.5 Camera assembly, original layout

Do not build a large centred circle. Build this:

- An offset rounded-square plateau in the upper-left, 38mm square with an effective 12mm corner radius, raised 1.9mm off the back.
- The plateau is **two-tier**: a lower shelf at 1.1mm carrying the flash, the rangefinder window, and the microphone, and an upper shelf at 1.9mm carrying the three main lenses. The step between tiers is chamfered at 0.3mm.
- Three lenses in an L arrangement on the upper shelf, not a triangle and not a row: two stacked on the left edge, one offset to the lower right. Diameters 11.4mm, 11.4mm, and 9.2mm.
- Each lens sits in a machined collar ring that proud-mounts 0.35mm above the plateau glass, with a knurled outer edge visible only in macro.
- A separate 4mm circular window on the lower shelf for the laser rangefinder, with a dark red-tinted cover.
- An elongated flash module, 7mm by 3mm, with two visible LED dies behind a diffuser.
- A machined accessory thread ring around the plateau perimeter, 0.4mm deep, which reads as "this takes a filter adapter" and gives the macro shot something to find.

### 2.6 Hardware details that cost little and add a lot

- Volume rocker, 32mm, and a power key, 14mm, both on the right rail, both inset 0.2mm into a machined recess with a 0.1mm gap line around them. The power key carries a fine horizontal texture the volume rocker does not.
- SIM tray on the left rail with a visible 0.08mm parting line and a 0.6mm pinhole.
- Bottom rail: USB-C port modelled as an actual cavity with an internal tongue and a chamfered mouth, a speaker grille of 6 holes, and a microphone hole. Not symmetric. Real devices are not symmetric down there.
- Top rail: a secondary microphone hole and a second speaker slot.
- Every hole is real geometry or a proper alpha cutout, never a painted dot. Section 3.5.

---

## 3. GEOMETRY

This section is why the model will or will not work.

### 3.1 The superellipse cross-section

A rounded rectangle built from four circular arcs has a curvature discontinuity where the arc meets the straight edge. Your eye cannot name it but it reads the result as cheap plastic. Premium industrial design uses a continuous curvature profile.

Generate the body outline from a superellipse:

```
|x/a|^n + |y/b|^n = 1
```

with `n` around 5.0 for the body outline. Sample it at enough points that the silhouette is smooth at full-screen scale (256 points per quadrant is plenty and costs nothing). Build the shape once at module load, reuse it for the body extrusion, the glass panels, the display cutout, and the camera plateau (plateau `n` around 4.2, slightly squarer).

Write it as a pure function in `src/lib/superellipse.ts`, unit tested: symmetry about both axes, monotonic in each quadrant, closed loop, no duplicate points, point count exact.

The difference between `n = 2` (a plain ellipse), `n = 4`, and `n = 5.5` is the difference between a bar of soap, a phone, and a brick. Expose `n` in the dev scrubber so it can be tuned by eye and then frozen.

### 3.2 Chamfers, the second-largest lever

**Every visible edge gets a bevel.** A perfectly sharp edge is physically impossible to manufacture and, more importantly, it receives no specular highlight, so it renders as a hard colour boundary and the brain reads "untextured box".

Minimum bevel sizes:

- Frame to glass meeting edge: 0.25mm.
- Plateau tier step: 0.3mm.
- Lens collar outer edge: 0.15mm.
- Button edges: 0.1mm.
- Port mouth: 0.2mm.
- Plateau perimeter where it meets the back glass: 0.5mm, and this one should be a smooth fillet rather than a flat chamfer, because on a real device that transition is a single machined surface.

Build these as real geometry. A normal map cannot fake a chamfer in a macro shot, and this project has a macro shot.

### 3.3 Panel gaps and parting lines

Real devices are assembled from parts, and the seams are visible. Model:

- A 0.12mm gap line where the frame meets the front glass, and another where it meets the back.
- A 0.1mm gap around the SIM tray, around each button, and around the plateau where it is a separate part.

A gap is geometry plus an occluded dark interior, not a painted line. Give each gap a recessed inner face with high roughness and near-black albedo so it self-shadows. At normal distance these read as crisp dark hairlines, which is exactly what they do in life.

### 3.4 The lens stack

This is where macro shots are won. A lens is not a dark circle. Build each one as a stack of concentric parts, from outside in:

1. **Cover glass**, flat, flush with the collar top, with a very slight dome (0.05mm rise). Transmissive, with the AR coating treatment from section 4.4.
2. **Collar ring**, machined metal, proud 0.35mm, with a chamfered top edge and fine knurling on the outer wall.
3. **Barrel wall**, a cylinder descending 1.4mm, very dark, roughness increasing with depth.
4. **Two inner baffle rings** at different depths, each a thin torus, catching a faint ring highlight. These are what create the sense of depth.
5. **Front element**, a lens-shaped mesh with high IOR, sitting 0.9mm down.
6. **Aperture hint**, a dark ring with a subtle polygonal inner edge suggesting blades.
7. **Sensor plane**, a nearly black disc at the bottom with a faint iridescent sheen, because a real sensor's microlens array diffracts.

The payoff is the "infinite tunnel" look, where the lens appears to have real depth and the highlight rings recede. That effect alone will carry the camera act.

Build one parametric lens factory, instantiate three times with different diameters. Do not hand-model three lenses.

### 3.5 Holes, grilles, and small apertures

Decision rule:

- If the camera ever gets closer than 15cm, model the hole as real geometry with a chamfered mouth and a dark interior.
- If it never does, an alpha cutout plus a normal map is acceptable, and cheaper.

For this project the bottom rail is visible in the approach act, so model the speaker holes and the port cavity for real. Instance the speaker holes rather than authoring six meshes.

The USB-C port is a cavity with an internal tongue. A flat black rounded-rectangle sticker where the port should be is the single most common tell in amateur phone models.

### 3.6 The display mesh

- A separate mesh, inset 0.02mm below the front glass surface, with the superellipse cutout matching the bezel.
- It must be its own mesh so the screen material and the glass material can both exist, which is what produces a realistic layered reflection.
- The active area gets a 0.4mm corner radius difference from the glass outline, because panel corners are cut slightly tighter than cover glass corners on real devices. A small thing that reads as correct.

### 3.7 Budget and LOD

- Target under 120k triangles for the full device at LOD0. That is generous for this geometry if you are not over-tessellating the superellipse.
- LOD1 at roughly 40k for mobile and for the rail viewers: drop the inner baffles, the knurling, the regulatory text, the internal port tongue, and halve the superellipse sampling.
- LOD2 at roughly 8k for any instance rendered below 200px.
- Merge static geometry aggressively. The body, frame, buttons, and plateau never move relative to each other outside the x-ray act, so they can be one merged mesh with material groups.
- Instance everything repeated: speaker holes, baffle rings, antenna bands.

---

## 4. MATERIALS

Physically based, measured where possible, and tuned in the actual lighting rig rather than in isolation.

### 4.1 Frame metal

- Anisotropic brushed metal. `metalness: 1`, base roughness around 0.28, with an anisotropy value around 0.6 and a tangent direction running along each rail's length.
- The grain direction rotates at the corners. Either build tangents into the geometry or use four material instances with different anisotropy rotations. The second is simpler and nobody will see the seam at the corner.
- A roughness map with fine directional noise, tiled tightly, amplitude small. The variation should be barely perceptible on a still and clearly alive when the camera arcs.
- Correct F0 for the alloy. Titanium is a cooler, darker grey than aluminium and has a slightly higher roughness floor. Pick one, state it in the material comment, and be consistent.
- The chamfer faces should use a slightly lower roughness than the flat rail. Machined chamfers are polished by the tool. This makes the highlight line on the chamfer brighter and tighter than the rail behind it, which is exactly what sells it.

### 4.2 Back glass, matte

- A clearcoat over a rough base: base roughness around 0.62, `clearcoat: 1`, `clearcoatRoughness: 0.35`.
- A fine detail normal map at high tiling frequency and very low amplitude for the etch sparkle. Visible only when a bright source rakes across it, which is the correct behaviour.
- Slight colour variation in the albedo, 2 to 3 percent, low frequency, so the panel is not mathematically flat.
- Each configurator finish is a parameter set on this one material, not a separate material. Finishes lerp their parameters over about 400ms on an eased curve.

### 4.3 Front glass

- `transmission` low, `roughness` near 0, `clearcoat: 1`, `ior: 1.52` for cover glass.
- Its job is to sit over the screen and produce a second, offset reflection. That double reflection, glass plus panel, is what makes a screen look like it is under glass rather than painted on.
- A very subtle oleophobic smudge map at low opacity, concentrated toward the lower third where a thumb lives. Keep it under the threshold of conscious notice. Too much reads as dirty; a trace reads as real.

### 4.4 Lens cover glass and the AR coating

The anti-reflective coating is the detail that makes camera modules look photographed rather than modelled.

- Base: high transmission, `ior` around 1.6, near-zero roughness.
- The coating tint: a view-dependent colour shift, magenta to green, strongest at grazing angles. Implement with a Fresnel-driven colour ramp on the sheen or emissive channel, or as a custom shader patch if the material system allows it. Low saturation. It should read as a faint oil-on-water sheen, not a rainbow.
- Each of the three lenses gets a slightly different coating tint, because in life coatings are tuned per element. One leans green, one leans magenta, one is nearly neutral. This tiny inconsistency is strongly convincing.

### 4.5 Lens internals

- Barrel wall: near-black albedo, roughness ramping from 0.4 at the mouth to 0.9 at depth, so the tunnel falls off naturally.
- Baffle rings: slightly lower roughness so they catch a thin ring highlight.
- Front element: high IOR, a dark absorptive tint, low roughness, with enough transmission to produce an internal reflection when a bright light is near the axis.
- Sensor plane: near-black with a faint iridescent sheen driven by view angle, at very low amplitude.

### 4.6 The screen, off

An off screen is the hardest material in the model and the one most often botched. It is not black.

- Base albedo near-black but not zero, around `#050508`, with a slight blue-violet cast from the polarizer.
- A clearcoat layer with very low roughness, giving a sharp environment reflection.
- The reflection is the entire point. An off screen is essentially a dark mirror, so it shows the room. In this scene, that means it shows the Lightformer panels. Compose the lighting rig so the screen reflection is interesting: a bright soft panel sweeping across it as the phone rotates is the money shot of the arrival act.
- A very subtle vertical gradient, because panels are not perfectly uniform under reflection.

### 4.7 The screen, on

- Emissive from the live canvas texture, with emissive intensity as a timeline channel so brightness ramps per act.
- The glass reflection stays on top of the emissive. A bright screen does not stop the glass reflecting, it just competes with it. Keeping both is what makes a powered screen look like a real powered screen.
- At macro distance, a subpixel hint: a very high frequency RGB stripe detail at extremely low amplitude, fading in only when the camera is closer than about 12cm. Do not ship this at normal distance, it will alias badly.

---

## 5. LIGHTING, WHICH IS HALF THE RESULT

The best geometry in the world renders as a grey lump under bad light. A product render is a lighting exercise with a model attached.

- **The long softbox.** A large, soft, slightly elongated area light placed high and to one side is what draws the continuous specular line down the frame rail and across the chamfer. If the model has one light, it is this one. Build it as a `Lightformer` rectangle, not a point light.
- **The strip.** A narrow, bright strip light nearly edge-on to the rail, which produces the tight secondary highlight on the chamfer specifically. Tune its angle so the chamfer highlight and the rail highlight are visibly separate lines. Two parallel highlights along an edge is the visual signature of a real chamfered metal object.
- **The rim.** A cool, dim source behind and opposite the key, separating the silhouette from the dark background. Keep it subtle. A hot rim reads as a stock render.
- **The screen bounce.** When the screen is on, a small area light in front of the device tinted to the screen content, at low intensity. Free realism.
- **The interior glow**, x-ray act only, warm, inside the chassis.
- **Environment.** A procedurally generated canvas environment sphere with the Lightformer panels composited in, so reflections have something to read. No remote HDR, ever. The environment does not need detail, it needs shape: a few large bright rectangles and a gradient falloff.
- **Exposure and tone mapping** are per-act timeline channels. Enable `THREE.ColorManagement`, pick AgX or ACES Filmic, and set exposure per act as part of the lighting state. A macro shot usually wants roughly a third of a stop less exposure than the hero shot or the highlights clip.

**The test:** rotate the device slowly through 360 degrees with the film's actual lighting. Watch the highlight on the frame rail. It should travel continuously, never flicker, never break into segments, never disappear entirely on any face. If it breaks, the chamfer geometry or the anisotropy tangent is wrong.

---

## 6. PROCEDURAL VERSUS AUTHORED

Default to procedural. This model is almost entirely revolved and extruded profiles with chamfers, which is exactly what code does well, and procedural geometry costs zero bytes of download.

Go to Blender only when a surface genuinely cannot be expressed as a profile operation. Candidates: the fillet where the camera plateau blends into the back glass if you want true G2 continuity, and the knurling if instancing proves too expensive.

If you do author in Blender (Blender MCP is in the setup prompt):

- Export glTF with Draco or meshopt compression.
- Total geometry budget for the entire site stays under 1.5MB compressed, per the main build prompt.
- Keep the authored mesh to the single part that needed it. Do not export the whole device.
- Bake nothing that could be a material parameter. Baked lighting will fight the per-act lighting rig.

---

## 7. THE REALISM CHECKLIST

Work through this before declaring the model done. Each item is a specific thing amateur models miss.

1. Superellipse cross-section, not circular fillets.
2. Every visible edge chamfered, minimum 0.1mm.
3. Chamfer faces smoother than the surfaces they join.
4. Two separate highlight lines along the frame edge, rail and chamfer.
5. Panel gaps as recessed geometry with dark interiors.
6. Antenna bands as inset geometry with their own material.
7. Anisotropic frame metal with grain following each rail.
8. Lens stack with real depth, baffles, and receding highlights.
9. Per-lens AR coating tints that differ slightly from each other.
10. Collar rings proud of the plateau, with chamfered tops.
11. Two-tier plateau with a chamfered step.
12. USB-C as a real cavity with an internal tongue.
13. Speaker holes as real geometry with chamfered mouths.
14. Asymmetric bottom rail layout.
15. Buttons recessed with gap lines, different textures per button.
16. Off screen as a dark mirror, not black.
17. Glass reflection layered over the screen, on and off.
18. Polarizer colour cast on the off screen.
19. Subtle oleophobic smudge, below conscious notice.
20. Etch sparkle on the back glass, macro only.
21. Low-frequency albedo variation on flat panels.
22. Equal bezels on all four sides.
23. Punch-hole with a dark ring and an internal glint.
24. Display corners cut slightly tighter than the glass outline.
25. Regulatory text block present and illegible.
26. Laser-etched wordmark at low contrast, not printed at high contrast.
27. Accessory thread ring around the plateau.
28. Sensor plane iridescence.
29. Exposure tuned per act, highlights not clipping in macro.
30. The rotation test in section 5 passes.

---

## 8. VERIFICATION

Do not declare this done because it looks fine in the viewport you have been staring at for an hour.

1. **The silhouette test.** Render at 200px, pure black on white. The silhouette alone should read as a premium phone. If the corners look soft or the plateau reads as a blob, the superellipse exponents are wrong.
2. **The grayscale test.** Render with all albedo forced to mid-grey. Everything you can still see is form and lighting. If the device disappears into a grey slab, the lighting rig is doing no work and no amount of material tuning will save it.
3. **The blur test.** Render at full size, apply a heavy gaussian. A real product render still reads as a product when blurred, because the large-scale value structure is right. A weak one turns to mush.
4. **The rotation test** from section 5, as a recorded turntable.
5. **The macro test.** Put the camera 8cm from the main lens. The tunnel should have depth, the coating should shift colour as you orbit, the collar knurling should resolve, and nothing should reveal itself as a flat plane.
6. **The originality gate** from section 1. Five angles, reviewed as a set, signed off in `docs/device-originality.md`.
7. **The budget check.** Triangle count at each LOD, draw calls, texture memory, and frame time with the film's lighting active. Numbers, in `docs/device-perf.md`, not adjectives.
8. **Side by side with a photograph of your own phone** under similar light. Not to match its design, but to check whether your highlights, gaps, and reflections behave like the real thing. This is the most useful hour you will spend.

---

## 9. DELIVERABLES

- The rebuilt model, split into geometry construction, material registry, and component shell, none over 300 lines.
- `src/lib/superellipse.ts` with tests.
- One parametric lens factory, instanced three times.
- A material registry with explicit disposal, so unmounting the film returns renderer memory to baseline.
- Three LOD tiers with a documented switch policy.
- `docs/device-design.md`: the design brief as built, with the five originality renders and the sign-off.
- `docs/device-perf.md`: triangle counts, draw calls, texture memory, frame times.
- The turntable recording and the four test renders from section 8.

---

## 10. FINAL INSTRUCTION

Build the geometry first and look at it in grey with no materials at all. If it does not read as a phone in flat grey, materials will not save it, and most people discover this after spending a day on materials.

Then light it. Then material it. Then macro it.

Run the originality gate before you ask anyone to look at it.

---

## OPEN CONFLICT, resolve before M3R starts

The brief above (section 2.5) says: do not build a large centred circle; build an offset rounded-square two-tier plateau with an L lens arrangement.

The human's chat instruction says: camera placement like the Vivo X300 Ultra and Oppo Find X9 Ultra, a dial-like circular camera.

These two directions contradict. M3R must pick one: either amend section 2.5 to a large centred circular dial module (original detailing, L or triangular lens layout inside the dial, knurled dial edge as the macro feature), or keep the offset plateau and drop the Vivo/Oppo reference. Do not build a hybrid of both.
