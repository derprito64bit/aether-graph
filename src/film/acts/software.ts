import { key, type FilmKey } from '../key.ts'

/** Craft: laid flat under the key light, every chamfer on show. */
export const SOFTWARE_KEYS: FilmKey[] = [
  key({
    at: 0.93,
    pose: { rx: -0.9, ry: 0.05, rz: -0.2, scale: 1.3, px: 0, py: 0 },
    camera: { pos: [0.01, 0.06, 0.52], target: [0, 0, 0] },
    lens: { fov: 26, fit: 0.62 },
    look: { exposure: 1, glass: 0.6 },
  }),
]
