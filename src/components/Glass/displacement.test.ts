import { describe, expect, it } from 'vitest'
import { buildDisplacementMap, resolveGlassTier, sampleField } from './displacement.ts'

describe('glass displacement maps', () => {
  it('encodes a neutral center and a live convex rim', () => {
    const convex = sampleField(64, 'convex')
    const center = convex.x[32 * 64 + 32] ?? 1
    expect(Math.abs(center)).toBeLessThan(0.05)
    const rim = Math.abs(convex.x[32 * 64 + 63] ?? 0)
    expect(rim).toBeGreaterThan(0.5)
    expect(convex.maxDisplacement).toBeGreaterThan(0)
    const concave = sampleField(64, 'concave')
    const concaveCenter = concave.x[32 * 64 + 32] ?? 1
    expect(Math.abs(concaveCenter)).toBeLessThan(0.05)
  })

  it('differs per profile (convex, concave, lip are distinct surfaces)', () => {
    const convex = sampleField(32, 'convex')
    const concave = sampleField(32, 'concave')
    const lip = sampleField(32, 'lip')
    const differ = (a: number[], b: number[]): boolean =>
      a.some((v, i) => Math.abs(v - (b[i] ?? 0)) > 1e-6)
    expect(differ(convex.x, concave.x)).toBe(true)
    expect(differ(convex.x, lip.x)).toBe(true)
    expect(differ(concave.x, lip.x)).toBe(true)
  })

  it('builds a data URL stub outside browsers', () => {
    const map = buildDisplacementMap(64, 'convex')
    expect(map.dataUrl.startsWith('data:')).toBe(true)
    expect(map.maxDisplacement).toBeGreaterThan(0)
  })

  it('resolves tiers by capability, transmission first', () => {
    expect(resolveGlassTier({ webglTransmission: true, svgBackdropFilter: true })).toBe(
      'transmission',
    )
    expect(resolveGlassTier({ webglTransmission: false, svgBackdropFilter: true })).toBe(
      'displacement',
    )
    expect(resolveGlassTier({ webglTransmission: false, svgBackdropFilter: false })).toBe('layered')
  })
})
