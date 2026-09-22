import { key, type FilmKey } from '../key.ts'

/** Finish: the barrel turns through the key light, anodising on show. */
export const DISPLAY_KEYS: FilmKey[] = [
  key({
    at: 0.76,
    pose: { rx: -0.15, ry: 0.9, rz: -0.2, scale: 1.25, px: 0, py: 0.02 },
    camera: { pos: [0, 0.02, 0.6], target: [0, 0, 0] },
    lens: { fov: 21, fit: 0.62 },
    look: { exposure: 1.05, glass: 0.7 },
  }),
  key({
    at: 0.79,
    pose: { rx: -0.03, ry: 0.3, rz: -0.3, scale: 1.35, px: 0, py: 0.01 },
    camera: { pos: [0, 0.01, 0.54], target: [0, 0, 0] },
    lens: { fov: 24, fit: 0.64 },
    look: { exposure: 1.05, glass: 0.7 },
  }),
  key({
    at: 0.82,
    pose: { rx: 0, ry: 0, rz: -0.35, scale: 1.5, px: 0, py: 0 },
    camera: { pos: [0, 0, 0.47], target: [0, 0, 0] },
    lens: { fov: 28, fit: 0.66 },
    look: { exposure: 1.05, glass: 0.7 },
  }),
]
