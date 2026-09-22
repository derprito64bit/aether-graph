import { describe, expect, it } from 'vitest'
import { SHOTS, capAngularStep } from './shots.ts'
import { ACTS } from './timeline.ts'

describe('shot profiles', () => {
  it('covers every act with sane budgets', () => {
    for (const act of ACTS) {
      const shot = SHOTS[act.id]
      expect(shot, act.id).toBeDefined()
      if (shot === undefined) continue
      expect(shot.dampPerSecond).toBeGreaterThan(0)
      expect(shot.targetDampPerSecond).toBeGreaterThan(0)
      expect(shot.maxAngularVelocity).toBeGreaterThan(0)
      expect(shot.maxFovVelocity).toBeGreaterThan(0)
      expect(shot.settle).toBeGreaterThan(0)
      expect(shot.settle).toBeLessThanOrEqual(0.3)
    }
  })

  it('holds macro acts nearly locked off', () => {
    expect(SHOTS.teardown?.maxAngularVelocity).toBeLessThanOrEqual(1)
    expect(SHOTS.camera?.maxAngularVelocity).toBeLessThanOrEqual(0.5)
    expect(SHOTS.camera?.maxFovVelocity).toBeLessThanOrEqual(4)
  })

  it('caps rotation steps to the velocity budget', () => {
    // Small step passes through.
    expect(capAngularStep(0, 0.01, 1, 1 / 60)).toBeCloseTo(0.01, 6)
    // Huge jump clamps to maxVel * delta.
    expect(capAngularStep(0, 3, 1, 1 / 60)).toBeCloseTo(1 / 60, 6)
    expect(capAngularStep(0, -3, 0.5, 0.1)).toBeCloseTo(-0.05, 6)
    // Exact budget edge lands on target.
    expect(capAngularStep(0, 0.1, 1, 0.1)).toBeCloseTo(0.1, 6)
  })
})
