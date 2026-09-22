import { describe, expect, it } from 'vitest'
import { advanceAt, pressAt } from './PencilModel.tsx'

/** The knock cycle is a pure function of progress: scrub-safe both ways. */
describe('pencil mechanism', () => {
  it('rests unpressed outside the mechanism beat', () => {
    expect(pressAt(0)).toBe(0)
    expect(pressAt(0.59)).toBe(0)
    expect(pressAt(0.73)).toBe(0)
    expect(pressAt(1)).toBe(0)
  })

  it('presses and releases exactly once across the beat', () => {
    expect(pressAt(0.6625)).toBeCloseTo(1, 5)
    expect(pressAt(0.63)).toBeGreaterThan(0)
    expect(pressAt(0.63)).toBeLessThan(1)
    // Symmetric: the same press force at mirrored progress.
    expect(pressAt(0.63)).toBeCloseTo(pressAt(0.695), 5)
  })

  it('advances the lead 0.6mm and holds it out', () => {
    expect(advanceAt(0.6)).toBe(0)
    expect(advanceAt(0.7)).toBeCloseTo(0.0006, 8)
    expect(advanceAt(1)).toBeCloseTo(0.0006, 8)
  })
})
