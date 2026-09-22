import { describe, expect, it } from 'vitest'
import { CHAMFER } from './phoneDimensions.ts'
import {
  FINISH_PARAMS,
  MATERIAL_KEYS,
  RAIL_KEYS,
  createPhoneMaterials,
  disposePhoneMaterials,
} from './phoneMaterials.ts'

describe('phone material sets', () => {
  it('creates every material in the registry', () => {
    const set = createPhoneMaterials(FINISH_PARAMS.obsidian)
    for (const key of MATERIAL_KEYS) {
      expect(set[key]).toBeDefined()
    }
    expect(Object.keys(set)).toHaveLength(MATERIAL_KEYS.length)
    disposePhoneMaterials(set)
  })

  it('mints independent instances per call (film x-ray isolation)', () => {
    const a = createPhoneMaterials(FINISH_PARAMS.obsidian)
    const b = createPhoneMaterials(FINISH_PARAMS.obsidian)
    expect(a.framePX.uuid).not.toBe(b.framePX.uuid)
    a.framePX.opacity = 0.1
    expect(b.framePX.opacity).toBe(1)
    disposePhoneMaterials(a)
    disposePhoneMaterials(b)
  })

  it('splits the frame into four rails with alternating grain rotation', () => {
    const set = createPhoneMaterials(FINISH_PARAMS.titanium)
    expect(RAIL_KEYS).toHaveLength(4)
    expect(set.framePX.anisotropyRotation).toBe(0)
    expect(set.frameNX.anisotropyRotation).toBe(0)
    expect(set.framePY.anisotropyRotation).toBeCloseTo(Math.PI / 2, 6)
    expect(set.frameNY.anisotropyRotation).toBeCloseTo(Math.PI / 2, 6)
    for (const name of RAIL_KEYS) {
      expect(set[name].roughnessMap).toBeDefined()
    }
    disposePhoneMaterials(set)
  })

  it('scales brush tiling with grain amplitude', () => {
    const faint = createPhoneMaterials(FINISH_PARAMS.obsidian)
    const heavy = createPhoneMaterials(FINISH_PARAMS.slate)
    const faintRepeat = faint.framePX.roughnessMap?.repeat.x ?? 0
    const heavyRepeat = heavy.framePX.roughnessMap?.repeat.x ?? 0
    expect(heavyRepeat).toBeGreaterThan(faintRepeat)
    disposePhoneMaterials(faint)
    disposePhoneMaterials(heavy)
  })

  it('etches the wordmark at low contrast, not printed white', () => {
    for (const params of Object.values(FINISH_PARAMS)) {
      const set = createPhoneMaterials(params)
      expect(set.logo.opacity).toBeLessThanOrEqual(0.5)
      expect(set.logo.color.getHexString()).not.toBe('ffffff')
      disposePhoneMaterials(set)
    }
  })

  it('disposes without throwing (unmount cleanliness)', () => {
    const set = createPhoneMaterials(FINISH_PARAMS.titanium)
    expect(() => disposePhoneMaterials(set)).not.toThrow()
  })

  it('machines chamfer faces smoother than the rail they join', () => {
    const set = createPhoneMaterials(FINISH_PARAMS.obsidian)
    expect(set.frameChamfer.roughness).toBeLessThan(set.framePX.roughness)
    expect(set.frameChamfer.roughness).toBeCloseTo(set.framePX.roughness * 0.6, 6)
    disposePhoneMaterials(set)
  })

  it('sizes every chamfer above the invisible floor', () => {
    for (const value of Object.values(CHAMFER)) {
      expect(value).toBeGreaterThanOrEqual(0.0001)
    }
    expect(CHAMFER.moduleBase).toBeGreaterThan(CHAMFER.collarStep)
  })

  it('keeps the etched collar text in the roughness domain, not albedo', () => {
    const set = createPhoneMaterials(FINISH_PARAMS.obsidian)
    expect(set.collarTop.roughnessMap).not.toBeNull()
    expect(set.collarTop.map).toBeNull()
    expect(set.moduleGlass.roughnessMap).not.toBeNull()
    disposePhoneMaterials(set)
  })

  it('smokes the rear panel for the Clear finish', () => {
    const set = createPhoneMaterials(FINISH_PARAMS.clear)
    expect(set.back.opacity).toBeLessThan(1)
    expect(set.back.clearcoat).toBe(1)
    disposePhoneMaterials(set)
  })
})
