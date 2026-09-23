import { key, type FilmKey } from '../key.ts'

/**
 * Final: the closer. The pencil settles into the right column while the
 * purchase copy takes the left — a two-column handoff into the
 * configurator instead of a centered pile-up.
 */
export const FINAL_KEYS: FilmKey[] = [
  key({
    at: 0.875,
    pose: { rx: -0.28, ry: 0.42, rz: -0.38, scale: 1.42, px: 0.07, py: 0.05 },
    camera: { pos: [0, 0.02, 0.7], target: [0.02, 0, 0] },
    lens: { fov: 22, fit: 0.66 },
    look: { exposure: 1.15 },
  }),
  key({
    at: 0.92,
    pose: { rx: -0.28, ry: 0.42, rz: -0.38, scale: 1.44, px: 0.07, py: 0.05 },
    camera: { pos: [0, 0.02, 0.69], target: [0.02, 0, 0] },
    lens: { fov: 22, fit: 0.66 },
    look: { exposure: 1.15 },
    ease: 'smooth',
  }),
  key({
    at: 0.97,
    pose: { rx: -0.27, ry: 0.41, rz: -0.37, scale: 1.45, px: 0.07, py: 0.05 },
    camera: { pos: [0, 0.02, 0.685], target: [0.02, 0, 0] },
    lens: { fov: 22, fit: 0.67 },
    look: { exposure: 1.15 },
  }),
  key({
    at: 1,
    pose: { rx: -0.26, ry: 0.4, rz: -0.36, scale: 1.46, px: 0.07, py: 0.05 },
    camera: { pos: [0, 0.02, 0.68], target: [0.02, 0, 0] },
    lens: { fov: 22, fit: 0.68 },
    look: { exposure: 1.15 },
  }),
]
