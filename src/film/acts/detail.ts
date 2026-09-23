import { key, type FilmKey } from '../key.ts'

/**
 * Detail: an axial tracking shot. Full-length side view, push into the
 * knurled grip, then settle low on the lead tip. The camera travels with
 * the pencil instead of orbiting it.
 */
export const DETAIL_KEYS: FilmKey[] = [
  key({
    at: 0.13,
    pose: { rx: -0.1, ry: 1.2, rz: -0.25, scale: 1.35, px: 0, py: 0.01 },
    camera: { pos: [0.05, 0.02, 0.6], target: [0, -0.01, 0] },
    lens: { fov: 20, fit: 0.66 },
    look: { exposure: 1.1 },
  }),
  key({
    at: 0.18,
    pose: { rx: -0.08, ry: 1.45, rz: -0.15, scale: 1.55, px: -0.06, py: -0.01 },
    camera: { pos: [0.16, 0, 0.55], target: [-0.02, -0.035, 0] },
    lens: { fov: 22, fit: 0.6 },
    look: { exposure: 1.1 },
  }),
  key({
    at: 0.23,
    pose: { rx: 0.05, ry: 1.2, rz: -0.1, scale: 1.5, px: -0.08, py: -0.03 },
    camera: { pos: [0.12, -0.09, 0.55], target: [-0.01, -0.055, 0] },
    lens: { fov: 24 },
    look: { exposure: 1.1 },
  }),
]
