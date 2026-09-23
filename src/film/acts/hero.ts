import { key, type FilmKey } from '../key.ts'

/** Hero: open already on the product. Large diagonal three-quarter, breathing in. */
export const HERO_KEYS: FilmKey[] = [
  key({
    at: 0,
    pose: { rx: -0.3, ry: 0.55, rz: -0.45, scale: 1.6, px: 0, py: 0.04 },
    camera: { pos: [0, 0, 0.88], target: [0, 0, 0] },
    lens: { fov: 15, fit: 0.72 },
    look: { exposure: 1.15 },
  }),
  key({
    at: 0.04,
    pose: { rx: -0.29, ry: 0.48, rz: -0.44, scale: 1.63, px: 0, py: 0.04 },
    camera: { pos: [0, 0, 0.86], target: [0, 0, 0] },
    lens: { fov: 15.4, fit: 0.73 },
    look: { exposure: 1.15 },
  }),
  key({
    at: 0.08,
    pose: { rx: -0.28, ry: 0.42, rz: -0.43, scale: 1.66, px: 0, py: 0.04 },
    camera: { pos: [0, 0, 0.85], target: [0, 0, 0] },
    lens: { fov: 15.8, fit: 0.74 },
    look: { exposure: 1.15 },
  }),
  key({
    at: 0.115,
    pose: { rx: -0.27, ry: 0.38, rz: -0.42, scale: 1.68, px: 0, py: 0.04 },
    camera: { pos: [0, 0, 0.84], target: [0, 0, 0] },
    lens: { fov: 16, fit: 0.74 },
    look: { exposure: 1.15 },
  }),
]
