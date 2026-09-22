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
 * Shot grammar. Every act names its move instead of inventing an easing.
 * Macro runs nearly locked off; reveals settle long; arcs hold constant
 * angular velocity with damped entry and exit.
 */
export const SHOTS: Record<ActId, ShotProfile> = {
  arrival: {
    kind: 'establishing',
    dampPerSecond: 5.5,
    targetDampPerSecond: 4,
    maxAngularVelocity: 1.2,
    maxFovVelocity: 8,
    settle: 0.2,
  },
  settle: {
    kind: 'push-in',
    dampPerSecond: 6,
    targetDampPerSecond: 4.5,
    maxAngularVelocity: 1,
    maxFovVelocity: 8,
    settle: 0.2,
  },
  approach: {
    kind: 'arc',
    dampPerSecond: 5.5,
    targetDampPerSecond: 4,
    maxAngularVelocity: 1.4,
    maxFovVelocity: 10,
    settle: 0.2,
  },
  teardown: {
    kind: 'reveal',
    dampPerSecond: 5,
    targetDampPerSecond: 4,
    maxAngularVelocity: 1,
    maxFovVelocity: 8,
    settle: 0.2,
  },
  camera: {
    kind: 'macro',
    dampPerSecond: 3.5,
    targetDampPerSecond: 3,
    maxAngularVelocity: 0.5,
    maxFovVelocity: 4,
    settle: 0.25,
  },
  display: {
    kind: 'push-in',
    dampPerSecond: 6,
    targetDampPerSecond: 4.5,
    maxAngularVelocity: 1,
    maxFovVelocity: 8,
    settle: 0.2,
  },
  storage: {
    kind: 'arc',
    dampPerSecond: 5.5,
    targetDampPerSecond: 4,
    maxAngularVelocity: 1.2,
    maxFovVelocity: 8,
    settle: 0.2,
  },
  battery: {
    kind: 'reveal',
    dampPerSecond: 5,
    targetDampPerSecond: 4,
    maxAngularVelocity: 1,
    maxFovVelocity: 8,
    settle: 0.2,
  },
  software: {
    kind: 'establishing',
    dampPerSecond: 6,
    targetDampPerSecond: 4.5,
    maxAngularVelocity: 1.2,
    maxFovVelocity: 8,
    settle: 0.2,
  },
  ai: {
    kind: 'arc',
    dampPerSecond: 5.5,
    targetDampPerSecond: 4,
    maxAngularVelocity: 1.2,
    maxFovVelocity: 8,
    settle: 0.2,
  },
  final: {
    kind: 'establishing',
    dampPerSecond: 5,
    targetDampPerSecond: 4,
    maxAngularVelocity: 1,
    maxFovVelocity: 8,
    settle: 0.2,
  },
}

/**
 * Caps a per-frame rotation step to the shot's angular velocity budget.
 * Pure math, tested: the flick fix lives here, applied in the director
 * after sampling and before writing to the camera.
 */
export function capAngularStep(
  current: number,
  target: number,
  maxVel: number,
  delta: number,
): number {
  const step = target - current
  const maxStep = maxVel * delta
  if (step > maxStep) return current + maxStep
  if (step < -maxStep) return current - maxStep
  return target
}
