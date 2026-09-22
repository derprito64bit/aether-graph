import { describe, expect, it } from 'vitest'
import { progressForScrollTop, scrollTopForProgress, type RunwayGeometry } from './scroll.ts'

/** Part D: runway mapping round-trips, unlike the old document-fraction math. */
describe('runway scroll mapping', () => {
  // Review's measured geometry: runway top 48, scroll range 13000.
  const geometry: RunwayGeometry = { top: 48, height: 14000, viewportHeight: 1000 }

  it('round-trips progress across the whole runway', () => {
    for (let i = 0; i <= 40; i++) {
      const p = i / 40
      expect(progressForScrollTop(geometry, scrollTopForProgress(geometry, p))).toBeCloseTo(p, 9)
    }
  })

  it('reproduces the review table for the old document-fraction math', () => {
    // Old code scrolled to a.start * documentRange (14115 at the measured
    // viewport) instead of the runway range (13000): the error grows with p
    // and the last three acts collapse past the film end.
    const documentRange = 14115
    const broken = (start: number): number => progressForScrollTop(geometry, start * documentRange)
    expect(broken(0.25)).toBeCloseTo(0.2677, 4)
    expect(broken(0.52)).toBeCloseTo(0.5609, 4)
    expect(broken(0.89)).toBeCloseTo(0.9626, 4)
    expect(broken(0.93)).toBe(1)
    // The shared helper lands exactly, so every rail link hits its own act.
    for (const start of [0, 0.1, 0.155, 0.25, 0.52, 0.72, 0.84, 0.89, 0.93, 0.95, 0.975]) {
      expect(progressForScrollTop(geometry, scrollTopForProgress(geometry, start))).toBeCloseTo(
        start,
        9,
      )
    }
  })

  it('clamps outside scroll positions instead of returning garbage', () => {
    expect(progressForScrollTop(geometry, -100)).toBe(0)
    expect(progressForScrollTop(geometry, 1e9)).toBe(1)
    expect(progressForScrollTop({ top: 0, height: 500, viewportHeight: 1000 }, 0)).toBe(0)
  })
})
