import { key, type FilmKey } from '../key.ts'

/** Arrival: open already on the product. Diagonal three-quarter hero, breathing in. */
export const ARRIVAL_KEYS: FilmKey[] = [
  key({
    at: 0,
    pose: { rx: -0.32, ry: 0.5, rz: -0.42, scale: 1.42, px: 0, py: 0.035 },
    camera: { pos: [0, 0, 0.9], target: [0, 0, 0] },
    lens: { fov: 15, fit: 0.68 },
    look: { exposure: 1 },
  }),
  key({
    at: 0.04,
    pose: { rx: -0.3, ry: 0.43, rz: -0.41, scale: 1.45, px: 0, py: 0.035 },
    camera: { pos: [0, 0, 0.88], target: [0, 0, 0] },
    lens: { fov: 15.4, fit: 0.69 },
    look: { exposure: 1 },
  }),
  key({
    at: 0.08,
    pose: { rx: -0.29, ry: 0.38, rz: -0.4, scale: 1.47, px: 0, py: 0.035 },
    camera: { pos: [0, 0, 0.87], target: [0, 0, 0] },
    lens: { fov: 15.8, fit: 0.7 },
    look: { exposure: 1 },
  }),
  key({
    at: 0.1,
    pose: { rx: -0.28, ry: 0.35, rz: -0.38, scale: 1.5, px: 0, py: 0.035 },
    camera: { pos: [0, 0, 0.86], target: [0, 0, 0] },
    lens: { fov: 16, fit: 0.7 },
    look: { exposure: 1 },
  }),
]
