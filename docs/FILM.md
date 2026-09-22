# FILM.md — how the product film works, and how to add an act

The homepage is one continuous camera shot. A long runway (1500vh desktop,
1100vh mobile) scrolls under a sticky stage. One master progress value 0..1
drives camera, phone pose, FOV, lighting, and overlay copy. Nothing reads
scroll independently.

## Files

- `src/film/key.ts` — `ActId`, `FilmKey`, the `key()` authoring API, `smoothstep`.
- `src/film/acts/<act>.ts` — one file per act, each exporting its keys.
- `src/film/timeline.ts` — `ACTS` (13 ranges + overlay alignment) and `KEYS`.
- `src/film/sample.ts` — `sampleFilm(p)`: Catmull-Rom camera path with
  re-clocked knots plus pose, FOV, and look. Segments interpolate
  linearly by default so keys pass at speed; `ease: 'smooth'` only on
  authored holds (0.272, 0.295, 0.685, 0.705, 0.98). Zero allocation.
- `src/film/framing.ts` — `fitFov`, `formatFit`, `centerBias`, `macroFloorFov`.
- `src/film/validate.ts` — `validateTimeline(keys)` run in dev and in tests.
- `src/film/Scrubber.tsx` — dev overlay (`.` key, `?t=` deep link).

## The re-clocked curve

Three's `CatmullRomCurve3` uses uniform knots: sampling at raw progress lands
key `i` at `i/(N-1)` instead of its authored `at`. `reclockedCurveParam`
maps progress onto the authored segment clock first, so camera travel, pose,
and FOV share one timeline. If the camera ever slides against the captions,
check this function before touching any keyframe.

## Validator rules

Strictly increasing `at`, first key at 0, last at 1, max gap 0.06, no NaN,
`fit` in (0, 1.4], `fov` in [10, 52], `fovMax` in (0, 60], every act
boundary covered by a key within 0.03 on each side, and no camera position
inside the phone slab ellipsoid (10mm margin, phone-local frame).

## Adding an act in an afternoon

1. Append the act range to `ACTS` in `timeline.ts` (keep ranges contiguous).
2. Create `src/film/acts/<act>.ts` with 2 to 4 `key()` calls. Copy the
   neighbor boundary key first so both sides of the boundary agree, then
   move the middle.
3. Open the dev scrubber (`.`), drag to the new range, pose the shot by
   eye, and use Copy pose as keyframe to paste exact numbers.
4. Run `npm run test`. The validator names the broken rule; the sampler
   tests prove authored landing and segment continuity.
5. Capture visual snapshots at the new keys (`?t=` values) and commit them.

## Debugging guide

- Camera passes through the phone: re-clocking, then tension, then add a key.
- Jump at an act boundary: missing key on one side; extend the validator.
- Whip on fast scroll: damp the driving value in the director (M5), never
  the keys.
