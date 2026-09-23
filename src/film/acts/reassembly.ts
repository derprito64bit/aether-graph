import { key, type FilmKey } from '../key.ts'

/**
 * Reassembly: the stack flies home. Components return precisely to their
 * positions with weight-damped motion — engineered, no bounce. The hero
 * stands back up as the last layer seats.
 */
export const REASSEMBLY_KEYS: FilmKey[] = [
  key({
    at: 0.755,
    pose: { rx: -1.0, ry: 1.0, rz: 0.03, scale: 1.3, px: 0, py: 0.02 },
    camera: { pos: [0, 0.15, 0.55], target: [0, -0.01, -0.01] },
    lens: { fov: 24, fit: 0.6 },
    look: { exposure: 1.1 },
  }),
  key({
    at: 0.795,
    pose: { rx: -0.6, ry: 0.7, rz: -0.1, scale: 1.45, px: 0, py: 0.02 },
    camera: { pos: [0, 0.08, 0.6], target: [0, 0, 0] },
    lens: { fov: 22, fit: 0.62 },
    look: { exposure: 1.1 },
  }),
  key({
    at: 0.84,
    pose: { rx: -0.35, ry: 0.5, rz: -0.3, scale: 1.55, px: 0, py: 0.03 },
    camera: { pos: [0, 0.03, 0.62], target: [0, 0.01, 0] },
    lens: { fov: 22, fit: 0.64 },
    look: { exposure: 1.1 },
  }),
]
