import { describe, expect, it } from 'vitest'
import { superellipsePoints } from './superellipse.ts'

describe('superellipse', () => {
  it('emits exactly perQuadrant * 4 points', () => {
    expect(superellipsePoints(1, 2, 5, 48)).toHaveLength(192)
    expect(superellipsePoints(1, 2, 5, 12)).toHaveLength(48)
  })

  it('is symmetric about both axes', () => {
    const pts = superellipsePoints(3, 5, 4, 32)
    for (const [x, y] of pts) {
      expect(pts.some(([ox, oy]) => Math.abs(ox + x) < 1e-9 && Math.abs(oy - y) < 1e-9)).toBe(true)
      expect(pts.some(([ox, oy]) => Math.abs(ox - x) < 1e-9 && Math.abs(oy + y) < 1e-9)).toBe(true)
    }
  })

  it('has no duplicate consecutive points and closes the loop', () => {
    const pts = superellipsePoints(3, 5, 4, 32)
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i]
      const b = pts[(i + 1) % pts.length]
      if (a === undefined || b === undefined) continue
      expect(Math.hypot(b[0] - a[0], b[1] - a[1])).toBeGreaterThan(1e-9)
    }
  })

  it('progresses monotonically in angle around the perimeter', () => {
    const pts = superellipsePoints(3, 5, 4, 32)
    let prev: number | null = null
    let wraps = 0
    for (const [x, y] of pts) {
      const a = Math.atan2(y / 5, x / 3)
      if (prev !== null) {
        let d = a - prev
        if (d < 0) {
          d += Math.PI * 2
          wraps += 1
        }
        expect(d).toBeGreaterThanOrEqual(0)
        expect(d).toBeLessThan(Math.PI)
      }
      prev = a
    }
    expect(wraps).toBe(1)
  })
})
