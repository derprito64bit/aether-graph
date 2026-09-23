import { key, type FilmKey } from '../key.ts'

/**
 * X-ray: the exploded stack held open with the outer shell dissolved.
 * Ghosted barrel, grip, and nose hang around the solid mechanism while
 * the camera works closer than the exploded drift, biased toward the
 * mechanism cluster (clutch, shaft, spring) so the innards read.
 */
export const XRAY_KEYS: FilmKey[] = [
  key({
    at: 0.49,
    pose: { rx: -1.0, ry: 0.7, rz: 0.02, scale: 1.35, px: 0, py: 0.02 },
    camera: { pos: [0.05, 0.22, 0.46], target: [0, -0.035, -0.01] },
    lens: { fov: 24, fit: 0.6 },
    look: { exposure: 1.1 },
  }),
  key({
    at: 0.54,
    pose: { rx: -0.9, ry: 1.1, rz: 0.02, scale: 1.38, px: 0, py: 0.02 },
    camera: { pos: [-0.05, 0.19, 0.44], target: [0, -0.035, -0.01] },
    lens: { fov: 24, fit: 0.6 },
    look: { exposure: 1.1 },
  }),
  key({
    at: 0.585,
    pose: { rx: -0.8, ry: 1.5, rz: 0.02, scale: 1.4, px: 0, py: 0.02 },
    camera: { pos: [-0.08, 0.13, 0.44], target: [0, -0.035, -0.01] },
    lens: { fov: 24, fit: 0.6 },
    look: { exposure: 1.1 },
  }),
]
