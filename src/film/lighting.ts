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
 * Drafting-film studio: a cool, neutral paper cyclorama so the dark
 * instrument reads as ink on a sheet. Exposure rests at unity; the lamps do
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
    stage: '#e1e2de',
    stageTop: '#edeeea',
  },
  detail: {
    key: 2.8,
    fill: 1.0,
    rim: 1.3,
    env: 1.1,
    exposure: 1,
    envTint: '#ffffff',
    stage: '#dfe0dc',
    stageTop: '#ebece8',
  },
  exploded: {
    key: 2.2,
    fill: 1,
    rim: 1.4,
    env: 0.9,
    exposure: 1,
    envTint: '#f5ede0',
    stage: '#d9dbd6',
    stageTop: '#e6e7e3',
  },
  xray: {
    key: 2.4,
    fill: 1,
    rim: 1.6,
    env: 1,
    exposure: 1,
    envTint: '#ffe9c8',
    stage: '#eeefeb',
    stageTop: '#f6f7f3',
  },
  mechanism: {
    key: 3,
    fill: 1.0,
    rim: 1.5,
    env: 1.1,
    exposure: 1,
    envTint: '#ffe9c8',
    stage: '#dddfda',
    stageTop: '#e9eae6',
  },
  reassembly: {
    key: 2.6,
    fill: 1,
    rim: 1.3,
    env: 1,
    exposure: 1,
    envTint: '#ffffff',
    stage: '#dfe0dc',
    stageTop: '#ebece8',
  },
  final: {
    key: 2.8,
    fill: 1.1,
    rim: 1.4,
    env: 1.1,
    exposure: 1,
    envTint: '#ffffff',
    stage: '#e2e3df',
    stageTop: '#eeefeb',
  },
}
