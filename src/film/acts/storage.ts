import { key, type FilmKey } from '../key.ts'

/** Lead: the pencil settles to one side, the tip owns the other. */
export const STORAGE_KEYS: FilmKey[] = [
  key({
    at: 0.86,
    pose: { rx: -0.03, ry: 0.2, rz: -0.2, scale: 1.2, px: -0.16, py: -0.01 },
    camera: { pos: [0.3, 0, 0.58], target: [-0.05, -0.05, 0] },
    lens: { fov: 22, fit: 0.56 },
    look: { exposure: 1 },
  }),
]
