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
  /** Environment tint: the mechanism act pushes warm so brass reads. */
  envTint: string
  /** Cyclorama base: the stage carries the colour, the product stays neutral. */
  stage: string
  /** Cyclorama crown: horizon glow tint. */
  stageTop: string
}

/**
 * Per-act studio lighting. Damped between acts at 5/s, never snapped.
 * Paper-white drafting studio: light warm-gray cyclorama so the dark
 * instrument silhouettes crisply. Exposure rests at unity; the lamps do
 * the modelling, not the tone curve.
 */
export const STAGE_LIGHTING: Record<ActId, StageLightState> = {
  hero: {
    key: 2.6,
    fill: 1.1,
    rim: 1.2,
    env: 1,
    exposure: 1,
    envTint: '#ffffff',
    stage: '#e6ddc8',
    stageTop: '#f0e9d7',
  },
  detail: {
    key: 2.8,
    fill: 1.0,
    rim: 1.3,
    env: 1.1,
    exposure: 1,
    envTint: '#ffffff',
    stage: '#e4dac4',
    stageTop: '#eee6d3',
  },
  exploded: {
    key: 2.2,
    fill: 1,
    rim: 1.4,
    env: 0.9,
    exposure: 1,
    envTint: '#f5ede0',
    stage: '#e1d7c1',
    stageTop: '#ebe3d0',
  },
  xray: {
    key: 2.4,
    fill: 1,
    rim: 1.6,
    env: 1,
    exposure: 1,
    envTint: '#ffe9c8',
    stage: '#f0e7d3',
    stageTop: '#f6efdd',
  },
  mechanism: {
    key: 3,
    fill: 1.0,
    rim: 1.5,
    env: 1.1,
    exposure: 1,
    envTint: '#ffe9c8',
    stage: '#e6dcc5',
    stageTop: '#efe7d4',
  },
  reassembly: {
    key: 2.6,
    fill: 1,
    rim: 1.3,
    env: 1,
    exposure: 1,
    envTint: '#ffffff',
    stage: '#e3d9c4',
    stageTop: '#ece5d2',
  },
  final: {
    key: 2.8,
    fill: 1.1,
    rim: 1.4,
    env: 1.1,
    exposure: 1,
    envTint: '#ffffff',
    stage: '#e7dec9',
    stageTop: '#f0e9d8',
  },
}
