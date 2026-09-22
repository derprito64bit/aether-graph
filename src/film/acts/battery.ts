import { key, type FilmKey } from '../key.ts'

/**
 * Balance: the pencil lays near-horizontal so its weight distribution
 * reads. The camera drops with it, then the pencil rises back to the
 * carry angle.
 */
export const BATTERY_KEYS: FilmKey[] = [
  key({
    at: 0.89,
    pose: { rx: -0.18, ry: 0.32, rz: 1.35, scale: 1.3, px: -0.03, py: 0 },
    camera: { pos: [0.0887, 0.0177, 0.4612], target: [0, 0, 0] },
    lens: { fov: 22, fit: 0.68 },
    look: { exposure: 1.1, glass: 0.4 },
  }),
  key({
    at: 0.902,
    pose: { rx: -0.22, ry: 0.24, rz: 1.4, scale: 1.5, px: 0.02, py: 0 },
    camera: { pos: [0.0495, 0.0293, 0.2972], target: [0.002, -0.045, 0] },
    lens: { fov: 24, fit: 0.62 },
    look: { exposure: 1.15, glass: 0.3 },
  }),
  key({
    at: 0.912,
    pose: { rx: -0.24, ry: 0.12, rz: 1.42, scale: 1.25, px: 0, py: 0 },
    camera: { pos: [0.0559, 0.1103, 0.405], target: [0.0008, -0.002, 0.0068] },
    lens: { fov: 24.5 },
    look: { exposure: 1.15, glass: 0.3 },
  }),
  key({
    at: 0.922,
    pose: { rx: -0.25, ry: 0.14, rz: 1.4, scale: 0.95, px: 0, py: 0 },
    camera: { pos: [0.0561, 0.0984, 0.35], target: [0.0003, -0.0015, 0.002] },
    lens: { fov: 24 },
    look: { exposure: 1.15, glass: 0.3 },
  }),
  key({
    at: 0.928,
    pose: { rx: -0.1, ry: 0.1, rz: 0.3, scale: 1.4, px: 0, py: 0 },
    camera: { pos: [0.0171, 0.0171, 0.5294], target: [0, 0, 0] },
    lens: { fov: 24, fit: 0.7 },
    look: { exposure: 1.05, glass: 0.4 },
  }),
]
