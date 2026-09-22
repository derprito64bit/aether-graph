import { describe, expect, it } from 'vitest'
import { dollyZoomFov, matchCutOpacity, pinnedScale, revealScale } from './zoom.ts'

describe('zoom modules', () => {
  it('widens FOV as the dolly pushes in (Vertigo holds subject size)', () => {
    const base = 24
    const near = dollyZoomFov(base, 0.05, 0.3)
    const far = dollyZoomFov(base, 0.01, 0.3)
    expect(near).toBeGreaterThan(far)
    expect(far).toBeGreaterThan(base)
  })

  it('never shows both match-cut layers readable', () => {
    expect(matchCutOpacity(1)).toEqual({ a: 1, b: 0 })
    expect(matchCutOpacity(8)).toEqual({ a: 0, b: 1 })
    const mid = matchCutOpacity(3)
    expect(mid.a).toBeLessThan(1)
    expect(mid.b).toBeGreaterThan(0)
    expect(mid.a + mid.b).toBeCloseTo(1, 6)
  })

  it('pins scale from 1 to zoomMax across the range', () => {
    expect(pinnedScale(0, 0.2, 0.8, 3)).toBe(1)
    expect(pinnedScale(0.8, 0.2, 0.8, 3)).toBe(3)
    expect(pinnedScale(0.1, 0.2, 0.8, 3)).toBe(1)
    expect(pinnedScale(0.9, 0.2, 0.8, 3)).toBe(3)
  })

  it('caps reveal zoom at a whisper above 1', () => {
    expect(revealScale(0)).toBe(1)
    expect(revealScale(1)).toBeCloseTo(1.04, 6)
  })
})
