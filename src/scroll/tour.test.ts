import { describe, expect, it } from 'vitest'
import { smootherstep, tourDuration, tourFrom, tourPosition, type TourStop } from './tour.ts'

const STOPS: TourStop[] = [
  { y: 1000, travel: 2, hold: 1, label: 'a' },
  { y: 3000, travel: 4, hold: 2, label: 'b' },
  { y: 3600, travel: 1, hold: 0.5, label: 'c' },
]

describe('autopilot tour', () => {
  it('eases off and in', () => {
    expect(smootherstep(0)).toBe(0)
    expect(smootherstep(1)).toBe(1)
    expect(smootherstep(0.5)).toBeCloseTo(0.5)
    expect(smootherstep(0.05)).toBeLessThan(0.01)
  })

  it('travels, holds, and finishes at the last stop', () => {
    expect(tourDuration(STOPS)).toBe(10.5)
    expect(tourPosition(STOPS, 0, 0).y).toBe(0)
    expect(tourPosition(STOPS, 0, 1).y).toBeCloseTo(500)
    expect(tourPosition(STOPS, 0, 2.5)).toMatchObject({ y: 1000, stop: 0, done: false })
    // Halfway through the second leg (3 s in, 2 of its 4 s).
    expect(tourPosition(STOPS, 0, 5)).toMatchObject({ y: 2000, stop: 1 })
    expect(tourPosition(STOPS, 0, 99)).toMatchObject({ y: 3600, done: true, fraction: 1 })
  })

  it('only ever moves forward, and never jumps', () => {
    let last = tourPosition(STOPS, 0, 0).y
    for (let t = 0; t <= 11; t += 1 / 60) {
      const y = tourPosition(STOPS, 0, t).y
      expect(y).toBeGreaterThanOrEqual(last - 1e-9)
      expect(y - last).toBeLessThan(40)
      last = y
    }
  })

  it('starts from where the visitor is', () => {
    const rest = tourFrom(STOPS, 2000)
    expect(rest.map((s) => s.label)).toEqual(['b', 'c'])
    // Halfway from a to b: half the travel left.
    expect(rest[0]?.travel).toBeCloseTo(2)
    expect(tourFrom(STOPS, 5000)).toEqual([])
  })
})
