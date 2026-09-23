import { key, type FilmKey } from '../key.ts'

/**
 * Exploded: the axial layer-by-layer sequence. Lay down (0.255-0.28),
 * separate and hold the stack (0.28-0.30), ten feature windows (0.30-0.46,
 * driven per-layer by the director, not by camera keys), begin the rise
 * toward x-ray (0.46-0.475). The camera holds a slow drift over the
 * stack; the layers do the moving.
 */
export const EXPLODED_KEYS: FilmKey[] = [
  key({
    at: 0.255,
    pose: { rx: -0.5, ry: 0.6, rz: 0, scale: 1.15, px: -0.04, py: 0 },
    camera: { pos: [0.08, -0.02, 0.6], target: [0, -0.03, -0.01] },
    lens: { fov: 24, fit: 0.55 },
    look: { exposure: 1.05 },
  }),
  key({
    at: 0.28,
    pose: { rx: -1.352, ry: 0.185, rz: 0.02, scale: 1.18, px: 0, py: 0.02 },
    camera: { pos: [0.02, 0.44, 0.5], target: [0, -0.015, -0.02] },
    lens: { fov: 25, fit: 0.5 },
    look: { exposure: 1.05, glass: 0.4 },
    ease: 'smooth',
  }),
  key({
    at: 0.3,
    pose: { rx: -1.352, ry: 0.185, rz: 0.02, scale: 1.18, px: 0, py: 0.02 },
    camera: { pos: [0.02, 0.435, 0.495], target: [0, -0.015, -0.02] },
    lens: { fov: 25, fit: 0.5 },
    look: { exposure: 1.05, glass: 0.4 },
    ease: 'smooth',
  }),
  key({
    at: 0.36,
    pose: { rx: -1.352, ry: 0.185, rz: 0.02, scale: 1.19, px: 0, py: 0.02 },
    camera: { pos: [0.018, 0.428, 0.482], target: [0, -0.015, -0.02] },
    lens: { fov: 25, fit: 0.5 },
    look: { exposure: 1.05, glass: 0.4 },
  }),
  key({
    at: 0.42,
    pose: { rx: -1.352, ry: 0.185, rz: 0.02, scale: 1.2, px: 0, py: 0.02 },
    camera: { pos: [0.01, 0.4, 0.46], target: [0, -0.015, -0.02] },
    lens: { fov: 25, fit: 0.5 },
    look: { exposure: 1.05, glass: 0.4 },
  }),
  key({
    at: 0.455,
    pose: { rx: -1.352, ry: 0.185, rz: 0.02, scale: 1.2, px: 0, py: 0.02 },
    camera: { pos: [0.01, 0.4, 0.46], target: [0, -0.015, -0.02] },
    lens: { fov: 25, fit: 0.5 },
    look: { exposure: 1.05, glass: 0.4 },
  }),
  key({
    at: 0.475,
    pose: { rx: -1.1, ry: 0.5, rz: 0.02, scale: 1.2, px: 0, py: 0.02 },
    camera: { pos: [0.01, 0.3, 0.5], target: [0, -0.005, -0.015] },
    lens: { fov: 24, fit: 0.52 },
    look: { exposure: 1.05, glass: 0.4 },
  }),
]
