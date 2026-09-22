/** Typed authoring API for the film timeline. One key per composed moment. */

export type ActId =
  | 'arrival'
  | 'settle'
  | 'approach'
  | 'teardown'
  | 'camera'
  | 'display'
  | 'storage'
  | 'battery'
  | 'software'
  | 'ai'
  | 'final'

export interface ActDef {
  id: ActId
  start: number
  end: number
  /** Overlay placement strategy for this act. */
  align: 'center' | 'left' | 'right' | 'bottom'
}

export interface FilmKey {
  /** Master progress 0..1 where this key lands. */
  at: number
  /** Phone group rotation in radians, scale, and world offset in meters. */
  pose: { rx: number; ry: number; rz: number; scale: number; px: number; py: number }
  /** Camera position and look-at target in meters. */
  camera: { pos: [number, number, number]; target: [number, number, number] }
  /** Author fallback FOV in degrees, responsive fit share, upper FOV clamp. */
  lens: { fov: number; fit?: number; fovMax?: number }
  /** Per-key lighting look: exposure multiplier and glass intensity 0..1. */
  look: { exposure: number; glass: number }
  /**
   * Segment easing leaving this key (round 01 A5). 'linear' everywhere by
   * default so the film glides at constant segment speed; 'smooth' only on
   * authored holds, where a genuine ease-in-out is wanted. Per-segment
   * smoothstep everywhere else stalls the camera at all 36 keys.
   */
  ease: 'smooth' | 'linear'
}

interface KeyInput {
  at: number
  pose: { rx: number; ry: number; rz: number; scale: number; px: number; py: number }
  camera: { pos: [number, number, number]; target: [number, number, number] }
  lens: { fov: number; fit?: number; fovMax?: number }
  look?: { exposure?: number; glass?: number }
  ease?: 'smooth' | 'linear'
}

/** Authors one timeline keyframe with named fields and lighting look defaults. */
export function key(input: KeyInput): FilmKey {
  return {
    at: input.at,
    pose: { ...input.pose },
    camera: { pos: [...input.camera.pos], target: [...input.camera.target] },
    lens: { ...input.lens },
    look: { exposure: input.look?.exposure ?? 1, glass: input.look?.glass ?? 0.5 },
    ease: input.ease ?? 'linear',
  }
}

/** Panic-free smoothing sigmoid used on every keyframed easing. */
export function smoothstep(t: number): number {
  const x = Math.min(1, Math.max(0, t))
  return x * x * (3 - 2 * x)
}
