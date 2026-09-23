import { key, type FilmKey } from '../key.ts'

/**
 * Mechanism: dive onto the free-floating clutch assembly. The knock
 * presses, the brass jaws spread, the lead advances 0.6mm and locks —
 * the 3D object is the infographic. Macro hold at 0.68-0.70 so the
 * cycle has a moment to be looked at.
 */
export const MECHANISM_KEYS: FilmKey[] = [
  key({
    at: 0.615,
    pose: { rx: -0.4, ry: 1.9, rz: 0.03, scale: 1.4, px: 0, py: 0.02 },
    camera: { pos: [0, 0, 0.55], target: [-0.01, -0.045, -0.02] },
    lens: { fov: 23, fit: 0.6 },
    look: { exposure: 1 },
  }),
  key({
    at: 0.655,
    pose: { rx: -0.42, ry: 2.4, rz: 0.04, scale: 1.7, px: 0.001, py: 0.025 },
    camera: { pos: [-0.15, 0.08, 0.3], target: [0, -0.052, -0.022] },
    lens: { fov: 28 },
    look: { exposure: 0.9, glass: 0.3 },
  }),
  key({
    at: 0.68,
    pose: { rx: -0.42, ry: 2.9, rz: 0.05, scale: 2, px: 0.001, py: 0.03 },
    camera: { pos: [-0.02, 0.07, 0.17], target: [0.008, -0.058, -0.025] },
    lens: { fov: 30 },
    look: { exposure: 0.9, glass: 0.3 },
    ease: 'smooth',
  }),
  key({
    at: 0.7,
    pose: { rx: -0.418, ry: 2.91, rz: 0.05, scale: 2.01, px: 0.001, py: 0.03 },
    camera: { pos: [-0.02, 0.07, 0.17], target: [0.008, -0.058, -0.025] },
    lens: { fov: 30 },
    look: { exposure: 0.9, glass: 0.3 },
    ease: 'smooth',
  }),
  key({
    at: 0.725,
    pose: { rx: -0.35, ry: 2.3, rz: 0.04, scale: 1.6, px: 0, py: 0.025 },
    camera: { pos: [-0.02, 0.04, 0.22], target: [-0.01, -0.06, -0.022] },
    lens: { fov: 27 },
    look: { exposure: 1 },
  }),
]
