import { key, type FilmKey } from '../key.ts'

/** Final: return to center, best lighting, large diagonal hero. */
export const FINAL_KEYS: FilmKey[] = [
  key({
    at: 0.875,
    pose: { rx: -0.28, ry: 0.42, rz: -0.38, scale: 1.6, px: 0, py: 0.035 },
    camera: { pos: [0, 0.02, 0.6], target: [0, 0, 0] },
    lens: { fov: 22, fit: 0.66 },
    look: { exposure: 1.15 },
  }),
  key({
    at: 0.92,
    pose: { rx: -0.28, ry: 0.42, rz: -0.38, scale: 1.62, px: 0, py: 0.035 },
    camera: { pos: [0, 0.02, 0.59], target: [0, 0, 0] },
    lens: { fov: 22, fit: 0.66 },
    look: { exposure: 1.15 },
    ease: 'smooth',
  }),
  key({
    at: 0.97,
    pose: { rx: -0.27, ry: 0.41, rz: -0.37, scale: 1.63, px: 0, py: 0.035 },
    camera: { pos: [0, 0.02, 0.585], target: [0, 0, 0] },
    lens: { fov: 22, fit: 0.67 },
    look: { exposure: 1.15 },
  }),
  key({
    at: 1,
    pose: { rx: -0.26, ry: 0.4, rz: -0.36, scale: 1.64, px: 0, py: 0.035 },
    camera: { pos: [0, 0.02, 0.58], target: [0, 0, 0] },
    lens: { fov: 22, fit: 0.68 },
    look: { exposure: 1.15 },
  }),
]
