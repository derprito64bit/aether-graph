import { describe, expect, it } from 'vitest'
import { toProgress } from './progress.ts'

describe('toProgress', () => {
  it('clamps values into 0..1 in fraction units', () => {
    expect(toProgress(-2)).toBe(0)
    expect(toProgress(0.42)).toBeCloseTo(0.42)
    expect(toProgress(3)).toBe(1)
  })
})
