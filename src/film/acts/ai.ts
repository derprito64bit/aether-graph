import { key, type FilmKey } from '../key.ts'

/** Precision: the pencil holds to one side, the sleeved tip takes the other. */
export const AI_KEYS: FilmKey[] = [
  key({
    at: 0.95,
    pose: { rx: -0.12, ry: 0.28, rz: -0.15, scale: 1.3, px: -0.1, py: -0.03 },
    camera: { pos: [0.26, -0.03, 0.6], target: [-0.03, -0.055, 0] },
    lens: { fov: 21, fit: 0.56 },
    look: { exposure: 1 },
  }),
]
