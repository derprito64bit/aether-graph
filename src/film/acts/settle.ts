import { key, type FilmKey } from '../key.ts'

/** Settle: the title breathes, then the camera leans into the balance point. */
export const SETTLE_KEYS: FilmKey[] = [
  key({
    at: 0.155,
    pose: { rx: -0.2, ry: 0.25, rz: -0.35, scale: 1.5, px: 0, py: 0.035 },
    camera: { pos: [0, 0.01, 0.8], target: [0, 0, 0] },
    lens: { fov: 17, fit: 0.64 },
    look: { exposure: 1 },
  }),
]
