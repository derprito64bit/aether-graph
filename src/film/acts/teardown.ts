import { key, type FilmKey } from '../key.ts'

/**
 * Teardown: the axial layer-by-layer sequence within its exact span (0.25
 * to 0.52), so nothing downstream moves. Lay down (0.250-0.272), separate
 * and hold the stack (0.272-0.295), ten feature windows (0.295-0.495,
 * driven per-layer by the director, not by camera keys), restack and stand
 * (0.495-0.520). The camera holds a slow drift over the stack; the layers
 * do the moving. Scales stay near unity: the stack is long, so the camera
 * fits it instead of the pencil shrinking.
 */
export const TEARDOWN_KEYS: FilmKey[] = [
  // Handoff bridge: the approach ends low on the lead tip, so the first
  // teardown key meets it halfway instead of whipping across the frame in
  // one knot span.
  key({
    at: 0.26,
    pose: { rx: -0.5, ry: 0.5, rz: 0.01, scale: 1.12, px: -0.05, py: 0 },
    camera: { pos: [0.09, -0.03, 0.63], target: [0, -0.03, -0.01] },
    lens: { fov: 24, fit: 0.55 },
    look: { exposure: 1, glass: 0.4 },
  }),
  key({
    at: 0.272,
    pose: { rx: -1.352, ry: 0.185, rz: 0.02, scale: 1.15, px: 0, py: 0.02 },
    camera: { pos: [0.02, 0.44, 0.5], target: [0, -0.03, -0.02] },
    lens: { fov: 25, fit: 0.5 },
    look: { exposure: 1.05, glass: 0.4 },
    ease: 'smooth',
  }),
  key({
    at: 0.295,
    pose: { rx: -1.352, ry: 0.185, rz: 0.02, scale: 1.15, px: 0, py: 0.02 },
    camera: { pos: [0.02, 0.435, 0.495], target: [0, -0.03, -0.02] },
    lens: { fov: 25, fit: 0.5 },
    look: { exposure: 1.05, glass: 0.4 },
    ease: 'smooth',
  }),
  key({
    at: 0.34,
    pose: { rx: -1.352, ry: 0.185, rz: 0.02, scale: 1.16, px: 0, py: 0.02 },
    camera: { pos: [0.018, 0.428, 0.482], target: [0, -0.03, -0.02] },
    lens: { fov: 25, fit: 0.5 },
    look: { exposure: 1.05, glass: 0.4 },
  }),
  key({
    at: 0.4,
    pose: { rx: -1.352, ry: 0.185, rz: 0.02, scale: 1.18, px: 0, py: 0.02 },
    camera: { pos: [0.01, 0.4, 0.46], target: [0, -0.03, -0.02] },
    lens: { fov: 25, fit: 0.5 },
    look: { exposure: 1.05, glass: 0.4 },
  }),
  key({
    at: 0.45,
    pose: { rx: -1.352, ry: 0.185, rz: 0.02, scale: 1.18, px: 0, py: 0.02 },
    camera: { pos: [0.01, 0.4, 0.46], target: [0, -0.03, -0.02] },
    lens: { fov: 25, fit: 0.5 },
    look: { exposure: 1.05, glass: 0.4 },
  }),
  key({
    at: 0.49,
    pose: { rx: -1.352, ry: 0.185, rz: 0.02, scale: 1.18, px: 0, py: 0.02 },
    camera: { pos: [0.01, 0.4, 0.46], target: [0, -0.03, -0.02] },
    lens: { fov: 25, fit: 0.5 },
    look: { exposure: 1.05, glass: 0.4 },
  }),
  key({
    at: 0.52,
    pose: { rx: -0.35, ry: 1.85, rz: 0.03, scale: 1.15, px: 0, py: 0.03 },
    camera: { pos: [0.0104, 0.0348, 0.64], target: [-0.0096, 0.0548, 0] },
    lens: { fov: 22, fit: 0.62 },
    look: { exposure: 1.05, glass: 0.4 },
  }),
]
