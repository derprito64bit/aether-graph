import type { ActId } from './key.ts'

export interface StageLightState {
  /** Key light intensity. */
  key: number
  /** Warm fill intensity. */
  fill: number
  /** Rim light intensity. */
  rim: number
  /** Environment reflection response for machined metal. */
  env: number
  /** Renderer exposure multiplier. */
  exposure: number
  /** Environment tint: the clutch act pushes warm so brass reads. */
  envTint: string
  /** Cyclorama base: the stage carries the colour, the product stays neutral. */
  stage: string
  /** Cyclorama crown: horizon glow tint. */
  stageTop: string
}

/**
 * Per-act studio lighting. Damped between acts at 5/s, never snapped.
 * Warm drafting-studio ramp: near-black umber that flatters brass edges
 * and graphite instead of swallowing them.
 */
export const STAGE_LIGHTING: Record<ActId, StageLightState> = {
  arrival: {
    key: 2.8,
    fill: 0.7,
    rim: 1.1,
    env: 0.9,
    exposure: 1,
    envTint: '#ffffff',
    stage: '#14110d',
    stageTop: '#262019',
  },
  settle: {
    key: 2.8,
    fill: 0.7,
    rim: 1.1,
    env: 0.9,
    exposure: 1,
    envTint: '#ffffff',
    stage: '#171310',
    stageTop: '#2a231b',
  },
  approach: {
    key: 2.8,
    fill: 0.6,
    rim: 1.2,
    env: 1,
    exposure: 1,
    envTint: '#ffffff',
    stage: '#1a1512',
    stageTop: '#302821',
  },
  teardown: {
    key: 1.6,
    fill: 0.9,
    rim: 1.5,
    env: 0.8,
    exposure: 1.05,
    envTint: '#f5ede0',
    stage: '#211c16',
    stageTop: '#3a3227',
  },
  camera: {
    key: 3,
    fill: 0.6,
    rim: 1.4,
    env: 1,
    exposure: 1.05,
    envTint: '#ffe9c8',
    stage: '#241b10',
    stageTop: '#3d2f1c',
  },
  display: {
    key: 2.6,
    fill: 0.8,
    rim: 1,
    env: 0.9,
    exposure: 1,
    envTint: '#ffffff',
    stage: '#38312a',
    stageTop: '#453d2d',
  },
  storage: {
    key: 2.2,
    fill: 0.7,
    rim: 1.1,
    env: 0.9,
    exposure: 1,
    envTint: '#ffffff',
    stage: '#2c2620',
    stageTop: '#443c30',
  },
  battery: {
    key: 1.6,
    fill: 0.9,
    rim: 1.5,
    env: 0.8,
    exposure: 1.1,
    envTint: '#f5efe2',
    stage: '#33291a',
    stageTop: '#4d4128',
  },
  software: {
    key: 2,
    fill: 0.8,
    rim: 1,
    env: 0.9,
    exposure: 1,
    envTint: '#ffffff',
    stage: '#292520',
    stageTop: '#3f3a30',
  },
  ai: {
    key: 2.2,
    fill: 0.7,
    rim: 1.1,
    env: 0.9,
    exposure: 1,
    envTint: '#ffffff',
    stage: '#1e1a15',
    stageTop: '#2f2a22',
  },
  final: {
    key: 3,
    fill: 0.7,
    rim: 1.3,
    env: 1,
    exposure: 1.05,
    envTint: '#ffffff',
    stage: '#241f18',
    stageTop: '#2e2822',
  },
}
