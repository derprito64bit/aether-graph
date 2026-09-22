import { describe, expect, it } from 'vitest'
import { FINISH_PARAMS } from '../components/PhoneViewer/phoneMaterials.ts'
import {
  BATTERY,
  CAMERA_LENSES,
  CHIPSET,
  DEFAULT_STORAGE_GB,
  DIMENSIONS,
  DISPLAY,
  FINISHES,
  FOCAL_LENGTHS,
  MEMORY,
  PERFORMANCE,
  SPEC_CATEGORIES,
  STORAGE_OPTIONS,
} from './product.ts'

/** WCAG relative luminance contrast between two hex colors. */
function contrastRatio(a: string, b: string): number {
  const lum = (hex: string): number => {
    const [r, g, bl] = [0, 2, 4].map((i) => {
      const c = Number.parseInt(hex.slice(i + 1, i + 3), 16) / 255
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (bl ?? 0)
  }
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x)
  return ((l1 ?? 0) + 0.05) / ((l2 ?? 0) + 0.05)
}

/** The film overlay and the specifications page must never disagree. */
describe('product data consistency', () => {
  it('has unique finish, lens, focal, and storage entries', () => {
    expect(new Set(FINISHES.map((f) => f.id)).size).toBe(FINISHES.length)
    expect(new Set(CAMERA_LENSES.map((l) => l.id)).size).toBe(CAMERA_LENSES.length)
    expect(new Set(FOCAL_LENGTHS.map((f) => f.zoom)).size).toBe(FOCAL_LENGTHS.length)
    expect(new Set(STORAGE_OPTIONS.map((s) => s.gb)).size).toBe(STORAGE_OPTIONS.length)
  })

  it('keeps the default storage inside the offered tiers', () => {
    expect(STORAGE_OPTIONS.some((s) => s.gb === DEFAULT_STORAGE_GB)).toBe(true)
  })

  it('keeps chipset facts aligned with the performance units', () => {
    expect(CHIPSET.npuTops).toBe(PERFORMANCE.npu.hero.value)
    expect(CHIPSET.cpuCores).toBe(8)
    expect(CHIPSET.gpuCores).toBe(14)
  })

  it('keeps every SoC metric inside its declared max', () => {
    for (const unit of Object.values(PERFORMANCE)) {
      for (const metric of unit.metrics) {
        expect(metric.value).toBeLessThanOrEqual(metric.max)
      }
    }
  })

  it('keeps battery presets and drain keys in sync', () => {
    const keys = Object.keys(BATTERY.drainPerHour).sort()
    for (const preset of Object.values(BATTERY.presets)) {
      expect(Object.keys(preset).sort()).toEqual(keys)
    }
  })

  it('mentions every key spec value somewhere in the spec tables', () => {
    const haystack = SPEC_CATEGORIES.flatMap((c) => c.rows.map((r) => r.value)).join(' | ')
    const required = [
      String(DISPLAY.peakNits),
      String(DISPLAY.refreshMax),
      String(BATTERY.capacity),
      String(DIMENSIONS.weightG),
      String(MEMORY.ramGb),
      String(CHIPSET.dieAreaMm2),
    ]
    for (const needle of required) {
      expect(haystack).toContain(needle)
    }
    expect(SPEC_CATEGORIES.length).toBeGreaterThan(10)
    for (const category of SPEC_CATEGORIES) {
      expect(category.rows.length).toBeGreaterThan(0)
    }
  })

  it('covers every finish id with a material parameter set', () => {
    for (const finish of FINISHES) {
      expect(FINISH_PARAMS[finish.id]).toBeDefined()
    }
    expect(Object.keys(FINISH_PARAMS)).toHaveLength(FINISHES.length)
  })

  it('pairs every finish accent at 4.5:1 against the surface', () => {
    for (const params of Object.values(FINISH_PARAMS)) {
      expect(contrastRatio(params.uiAccent, '#0f1014')).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('fits the data-layer capacity inside the modelled cell volume', () => {
    // Prompt C section 2.4: the visible hardware must agree with the sheet.
    const volumeCm3 = 5.8 * 7.8 * 0.42
    const densityWhL = ((BATTERY.capacity / 1000) * 3.8) / (volumeCm3 / 1000)
    expect(densityWhL).toBeGreaterThan(600)
    expect(densityWhL).toBeLessThan(950)
  })

  it('matches the etched micro-text against the lens data', () => {
    const byId = new Map(CAMERA_LENSES.map((l) => [l.id, l]))
    expect(byId.get('main')?.aperture).toBe('f/1.6')
    expect(byId.get('ultrawide')?.aperture).toBe('f/2.2')
    expect(byId.get('mid')?.aperture).toBe('f/1.9')
    expect(byId.get('periscope')?.aperture).toBe('f/3.0')
  })
})
