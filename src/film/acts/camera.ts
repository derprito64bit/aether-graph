import { key, type FilmKey } from '../key.ts'

/**
 * Clutch: approach the mechanism, turn until the nose is nearly flat-on,
 * then dive until the brass jaws fill the frame. Macro keys are anchored
 * to the clutch centre (hero-local y -0.053); the relative dive is
 * preserved exactly so the move keeps its authored feel. The macro dive
 * keeps its authored FOV.
 */
export const CAMERA_KEYS: FilmKey[] = [
  key({
    at: 0.56,
    pose: { rx: -0.3, ry: 1.55, rz: 0.02, scale: 1.2, px: 0, py: 0.02 },
    camera: { pos: [-0.0106, -0.02, 0.7], target: [-0.0206, -0.05, -0.02] },
    lens: { fov: 20, fit: 0.62 },
    look: { exposure: 1.05 },
  }),
  key({
    at: 0.6,
    pose: { rx: -0.35, ry: 1.85, rz: 0.03, scale: 1.35, px: 0, py: 0.03 },
    camera: { pos: [0.0037, -0.01, 0.55], target: [-0.0163, -0.05, -0.02] },
    lens: { fov: 22, fit: 0.62 },
    look: { exposure: 1.05 },
  }),
  key({
    at: 0.635,
    pose: { rx: -0.4, ry: 2.12, rz: 0.04, scale: 1.6, px: 0.002, py: 0.03 },
    camera: { pos: [-0.3, 0.1, 0.18], target: [0, -0.05, -0.02] },
    lens: { fov: 27 },
    look: { exposure: 1, glass: 0.3 },
  }),
  key({
    at: 0.66,
    pose: { rx: -0.42, ry: 2.85, rz: 0.05, scale: 1.95, px: 0.0035, py: 0.035 },
    camera: { pos: [-0.04, 0.12, 0.13], target: [0.012, -0.054, -0.022] },
    lens: { fov: 31 },
    // Macro sits a third of a stop below hero so brass highlights never clip.
    look: { exposure: 0.8, glass: 0.3 },
  }),
  key({
    at: 0.685,
    pose: { rx: -0.42, ry: 2.95, rz: 0.05, scale: 2, px: 0.001, py: 0.035 },
    camera: { pos: [-0.02, 0.08, 0.16], target: [0.008, -0.06, -0.025] },
    lens: { fov: 30 },
    look: { exposure: 0.8, glass: 0.3 },
    ease: 'smooth',
  }),
  key({
    at: 0.705,
    pose: { rx: -0.418, ry: 2.96, rz: 0.05, scale: 2.01, px: 0.001, py: 0.035 },
    camera: { pos: [-0.02, 0.08, 0.16], target: [0.008, -0.06, -0.025] },
    lens: { fov: 30 },
    look: { exposure: 0.8, glass: 0.3 },
    ease: 'smooth',
  }),
  // Hold 0.685 to 0.705: camera locked so the knock cycle and jaw spread
  // have a moment to be looked at.
  key({
    at: 0.7125,
    pose: { rx: -0.353, ry: 2.35, rz: 0.039, scale: 1.62, px: 0.0004, py: 0.0295 },
    camera: { pos: [-0.0219, 0.05, 0.2], target: [-0.0103, -0.02, -0.03] },
    lens: { fov: 27 },
    look: { exposure: 0.9, glass: 0.4 },
  }),
  key({
    at: 0.72,
    pose: { rx: -0.3, ry: 1.85, rz: 0.03, scale: 1.3, px: 0, py: 0.025 },
    camera: { pos: [-0.0191, 0.018, 0.2558], target: [-0.0291, -0.002, -0.0242] },
    lens: { fov: 24, fit: 0.5 },
    look: { exposure: 1, glass: 0.5 },
  }),
]
