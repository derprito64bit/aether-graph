import { key, type FilmKey } from '../key.ts'

/** Approach: down the barrel to the grip, ending low on the lead tip. */
export const APPROACH_KEYS: FilmKey[] = [
  key({
    at: 0.2,
    pose: { rx: -0.06, ry: 0.1, rz: -0.3, scale: 1.3, px: 0, py: 0.02 },
    camera: { pos: [0, 0.02, 0.62], target: [0, -0.01, 0] },
    lens: { fov: 20, fit: 0.66 },
    look: { exposure: 1 },
  }),
  key({
    at: 0.24,
    pose: { rx: -0.05, ry: 0.6, rz: -0.15, scale: 1.35, px: -0.14, py: 0.02 },
    camera: { pos: [0.24, 0.02, 0.68], target: [0, -0.02, 0] },
    lens: { fov: 22, fit: 0.7 },
    look: { exposure: 1 },
  }),
  key({
    at: 0.25,
    pose: { rx: 0.1, ry: 0.65, rz: -0.1, scale: 1.3, px: -0.1, py: -0.03 },
    camera: { pos: [0.14, -0.1, 0.6], target: [0, -0.045, 0] },
    lens: { fov: 26 },
    look: { exposure: 1 },
  }),
]
