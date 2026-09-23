import type { ActId } from './key.ts'

export type ShotKind = 'establishing' | 'push-in' | 'arc' | 'macro' | 'reveal'

export interface ShotProfile {
  kind: ShotKind
  /** Pose damping rate per second. */
  dampPerSecond: number
  /** Damping for the look-at target, usually slower than pose so the aim settles late. */
  targetDampPerSecond: number
  /** Max angular velocity in rad/s. Caps the whip on a hard flick. */
  maxAngularVelocity: number
  /** Max FOV change per second in degrees. Stops the lens snapping on fast scrub. */
  maxFovVelocity: number
  /** Settle fraction: portion of the move spent easing out. Target 0.2. */
  settle: number
}

/**
 * Caps a per-frame angular step to the velocity budget. A hard flick gets
 * a fast controlled move, never a whip.
 */
export function capAngularStep(
  current: number,
  goal: number,
  maxVel: number,
  delta: number,
): number {
  const max = maxVel * delta
  const d = goal - current
  if (d > max) return current + max
  if (d < -max) return current - max
  return goal
}
export const SHOTS: Record<ActId, ShotProfile> = {
  hero: {
    kind: 'establishing',
    dampPerSecond: 5.5,
    targetDampPerSecond: 4,
    maxAngularVelocity: 1.2,
    maxFovVelocity: 8,
    settle: 0.2,
  },
  detail: {
    kind: 'arc',
    dampPerSecond: 5.5,
    targetDampPerSecond: 4,
    maxAngularVelocity: 1.4,
    maxFovVelocity: 10,
    settle: 0.2,
  },
  exploded: {
    kind: 'reveal',
    dampPerSecond: 5,
    targetDampPerSecond: 4,
    maxAngularVelocity: 1,
    maxFovVelocity: 8,
    settle: 0.2,
  },
  xray: {
    kind: 'arc',
    dampPerSecond: 4.5,
    targetDampPerSecond: 3.5,
    maxAngularVelocity: 0.8,
    maxFovVelocity: 6,
    settle: 0.25,
  },
  mechanism: {
    kind: 'macro',
    dampPerSecond: 3.5,
    targetDampPerSecond: 3,
    maxAngularVelocity: 0.5,
    maxFovVelocity: 4,
    settle: 0.2,
  },
  reassembly: {
    kind: 'push-in',
    dampPerSecond: 6,
    targetDampPerSecond: 4.5,
    maxAngularVelocity: 1,
    maxFovVelocity: 8,
    settle: 0.2,
  },
  final: {
    kind: 'establishing',
    dampPerSecond: 5.5,
    targetDampPerSecond: 4,
    maxAngularVelocity: 1.2,
    maxFovVelocity: 8,
    settle: 0.2,
  },
}
