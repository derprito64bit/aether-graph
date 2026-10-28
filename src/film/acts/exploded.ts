import { key, type FilmKey } from '../key.ts'

/** Lying horizontal, tip left: the exploded drawing's orientation. */
const FLAT = -Math.PI / 2

/** Aim a little below the pencil so it rides above the copy while it lies down. */
const TARGET: [number, number, number] = [0, -0.035, 0]

/**
 * Exploded: an assembly drawing in three dimensions. The pencil lies down
 * horizontal, tip left, seen from a little above (0.255-0.28); the parts
 * travel out to two rows, shell above and mechanism below (0.257-0.295,
 * staggered in teardown/assembly.ts); the drawing holds (0.28-0.30); ten
 * feature beats lift and turn one part each (0.30-0.46); the parts fold
 * home (0.455-0.474) and only then does the pencil turn toward the x-ray
 * view (0.468-0.49), so nothing is left floating while the camera moves.
 *
 * The keys own the pose and the camera direction. Inside the act the
 * director sizes and aims the shot from the measured drawing (and stands
 * it upright on tall screens), so the lens here is a fixed fallback.
 */
export const EXPLODED_KEYS: FilmKey[] = [
  key({
    at: 0.255,
    pose: { rx: 0.18, ry: 0.32, rz: -0.95, scale: 1.15, px: 0, py: 0 },
    camera: { pos: [0.02, 0.06, 0.62], target: TARGET },
    lens: { fov: 22 },
    look: { exposure: 1.05 },
  }),
  key({
    at: 0.28,
    pose: { rx: 0.42, ry: -0.16, rz: FLAT, scale: 1.12, px: 0, py: 0 },
    camera: { pos: [0, 0.06, 0.62], target: TARGET },
    lens: { fov: 22 },
    look: { exposure: 1.05 },
    ease: 'smooth',
  }),
  key({
    at: 0.3,
    pose: { rx: 0.42, ry: -0.16, rz: FLAT, scale: 1.12, px: 0, py: 0 },
    camera: { pos: [0, 0.06, 0.62], target: TARGET },
    lens: { fov: 22 },
    look: { exposure: 1.05 },
    ease: 'smooth',
  }),
  key({
    at: 0.34,
    pose: { rx: 0.43, ry: -0.14, rz: FLAT, scale: 1.12, px: 0, py: 0 },
    camera: { pos: [0.002, 0.06, 0.62], target: TARGET },
    lens: { fov: 22 },
    look: { exposure: 1.05 },
  }),
  key({
    at: 0.38,
    pose: { rx: 0.44, ry: -0.12, rz: FLAT, scale: 1.12, px: 0, py: 0 },
    camera: { pos: [0.004, 0.06, 0.62], target: TARGET },
    lens: { fov: 22 },
    look: { exposure: 1.05 },
  }),
  key({
    at: 0.42,
    pose: { rx: 0.43, ry: -0.1, rz: FLAT, scale: 1.12, px: 0, py: 0 },
    camera: { pos: [0.006, 0.06, 0.62], target: TARGET },
    lens: { fov: 22 },
    look: { exposure: 1.05 },
  }),
  key({
    at: 0.468,
    pose: { rx: 0.42, ry: -0.08, rz: FLAT, scale: 1.12, px: 0, py: 0 },
    camera: { pos: [0.008, 0.06, 0.62], target: TARGET },
    lens: { fov: 22 },
    look: { exposure: 1.05 },
  }),
  key({
    at: 0.478,
    pose: { rx: -0.6, ry: 0.3, rz: -0.6, scale: 1.18, px: 0, py: 0.015 },
    camera: { pos: [0.01, 0.2, 0.55], target: [0, -0.01, -0.01] },
    lens: { fov: 24, fit: 0.55 },
    look: { exposure: 1.05, glass: 0.4 },
  }),
]
