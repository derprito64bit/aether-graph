import { describe, expect, it } from 'vitest'
import { DIM, silhouetteHeightM, silhouetteWidthM } from './phoneDimensions.ts'

describe('phone silhouette math', () => {
  it('returns the body height face-on at scale 1', () => {
    expect(silhouetteHeightM(1, 0)).toBeCloseTo(DIM.h)
  })

  it('returns the body width face-on at scale 1', () => {
    expect(silhouetteWidthM(1, 0)).toBeCloseTo(DIM.w)
  })

  it('scales linearly with group scale', () => {
    expect(silhouetteHeightM(2, 0)).toBeCloseTo(2 * DIM.h)
    expect(silhouetteWidthM(2, 0)).toBeCloseTo(2 * DIM.w)
  })

  it('never exceeds the face-on diagonal under rotation', () => {
    const diag = Math.hypot(DIM.h, DIM.t)
    for (const rx of [0.1, 0.3, 0.5, 1.0]) {
      expect(silhouetteHeightM(1, rx)).toBeLessThanOrEqual(diag + 1e-9)
    }
  })
})
