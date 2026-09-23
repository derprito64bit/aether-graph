import { describe, expect, it } from 'vitest'
import { centerBias, fitFov, formatFit, macroFloorFov } from './framing.ts'

describe('responsive framing', () => {
  it('keeps the fit curve monotone in aspect (no tier jumps)', () => {
    let previous = -Infinity
    for (let aspect = 0.5; aspect <= 3.6; aspect += 0.05) {
      const value = formatFit(aspect, 0.6)
      expect(value).toBeGreaterThanOrEqual(previous)
      previous = value
    }
  })

  it('contains the silhouette with margin across the aspect ladder', () => {
    const poses = [
      { scale: 1.34, rx: -0.28, ry: 0.42, px: 0 },
      { scale: 2.02, rx: -0.35, ry: 0.1, px: 0 },
      { scale: 1.16, rx: -0.03, ry: 0.2, px: -0.16 },
    ]
    for (let aspect = 0.5; aspect <= 3.6; aspect += 0.1) {
      for (const pose of poses) {
        const distanceM = 0.62
        const fov = fitFov({
          fit: 0.6,
          distanceM,
          aspect,
          scale: pose.scale,
          rxRad: pose.rx,
          ryRad: pose.ry,
          pxM: pose.px,
        })
        expect(fov).toBeGreaterThanOrEqual(10)
        expect(fov).toBeLessThanOrEqual(52)
      }
    }
  })

  it('widens macro shots on portrait phones, never on desktop', () => {
    expect(macroFloorFov(0.42, 0.15, 0.5)).toBeGreaterThan(0)
    expect(macroFloorFov(0.42, 0.15, 1.78)).toBeGreaterThan(0)
    expect(macroFloorFov(0.1, 0.9, 0.5)).toBe(0)
  })

  it('floors the teardown run per featured layer, not one fixed size', () => {
    // p 0.44 (clip, 0.025) > p 0.34 (nose, 0.009) >
    // p 0.355 (clutch, 0.006): same camera, wider subject, wider floor.
    const clip = macroFloorFov(0.44, 0.5, 0.5)
    const nose = macroFloorFov(0.34, 0.5, 0.5)
    const clutch = macroFloorFov(0.355, 0.5, 0.5)
    expect(clip).toBeGreaterThan(nose)
    expect(nose).toBeGreaterThan(clutch)
    expect(clutch).toBeGreaterThan(0)
  })

  it('clamps off-center bias on narrow screens', () => {
    expect(centerBias(0.5, 'x')).toBeLessThan(centerBias(2.5, 'x'))
    expect(centerBias(1.78, 'y')).toBeCloseTo(1, 5)
  })
})
