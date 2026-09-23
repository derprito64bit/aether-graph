import { describe, expect, it } from 'vitest'
import { advanceAt, pressAt } from './PencilModel.tsx'

/** The knock cycle is a pure function of progress: scrub-safe both ways. */
describe('pencil mechanism', () => {
  it('rests unpressed outside the mechanism beat', () => {
    expect(pressAt(0)).toBe(0)
    expect(pressAt(0.62)).toBe(0)
    expect(pressAt(0.75)).toBe(0)
    expect(pressAt(1)).toBe(0)
  })

  it('presses and releases exactly once across the beat', () => {
    expect(pressAt(0.685)).toBeCloseTo(1, 5)
    expect(pressAt(0.66)).toBeGreaterThan(0)
    expect(pressAt(0.66)).toBeLessThan(1)
    // Symmetric: the same press force at mirrored progress.
    expect(pressAt(0.66)).toBeCloseTo(pressAt(0.71), 5)
  })

  it('advances the lead 0.6mm and holds it out', () => {
    expect(advanceAt(0.64)).toBe(0)
    expect(advanceAt(0.72)).toBeCloseTo(0.0006, 8)
    expect(advanceAt(1)).toBeCloseTo(0.0006, 8)
  })
})
