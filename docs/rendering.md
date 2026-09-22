# Rendering pipeline

Prompt A section 10 audit, written down so it stays true.

## Color management

- `THREE.ColorManagement.enabled = true`, set explicitly in
  `src/components/PhoneViewer/PhoneCanvas.tsx`. (R3F enables it by default;
  the explicit line turns an upstream default change into a loud failure
  instead of a washed catalog.)
- Every authored color is sRGB hex converted once through `new THREE.Color()`.

## Tone mapping: one curve

- **ACES Filmic everywhere.** `PhoneCanvas` sets
  `gl.toneMapping = THREE.ACESFilmicToneMapping` on creation; `FilmCanvas`
  sets the same. No `NoToneMapping`, no per-surface curves.
- Exposure is a timeline channel, not a constant: the film director writes
  `renderer.toneMappingExposure = keyframe.exposure * act.exposure` every
  frame (`src/film/FilmDirector.tsx`). Macro keyframes in the camera act
  (`src/film/acts/camera.ts`, 0.66–0.705) sit at 0.8 against a 1.05 hero —
  a third of a stop down, so collar highlights never clip.

## Procedural textures

- Color content (`map`, `emissiveMap`): `SRGBColorSpace` set explicitly on
  every canvas texture (`phoneTextures.ts`, live screen texture in
  `FilmScene.tsx`, studio environment in `phoneEnvironment.ts`).
- Data content (`roughnessMap`, `iridescenceThicknessMap`, smudge, brush,
  barrel gradient): `NoColorSpace`. A data map left in sRGB gets
  double-converted and reads washed; this was audited when the logo,
  regulatory, and wallpaper textures were found without a color space.
- The studio environment is a canvas equirect consumed through PMREM, never
  a remote HDR.

## What this rules out

- Adding a second tone mapper for "punch" in one viewer.
- Baked lighting in any authored mesh (nothing authored is baked today; the
  rule stands for the Blender path in M3R section 6).
- `emissiveMap` without `emissive` set: three multiplies the two, so a map
  alone renders black.
