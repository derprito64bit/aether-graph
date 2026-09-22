import { describe, expect, it } from 'vitest'
import { BATTERY } from '../data/product.ts'
import { consumedMah, hoursToEmpty, remainingPercent, totalHours } from './battery.ts'

describe('battery math', () => {
  it('computes consumed mAh deterministically from the drain table', () => {
    expect(
      consumedMah({ video: 1, gaming: 0, camera: 0, social: 0, navigation: 0, standby: 0 }),
    ).toBe(BATTERY.drainPerHour.video)
    expect(
      consumedMah({ video: 0, gaming: 2, camera: 0, social: 0, navigation: 0, standby: 0 }),
    ).toBe(2 * BATTERY.drainPerHour.gaming)
  })

  it('matches the balanced preset by hand', () => {
    const preset = BATTERY.presets.balanced
    const expected = 3 * 670 + 1 * 1040 + 1 * 790 + 4 * 430 + 2 * 540 + 10 * 13
    expect(consumedMah({ ...preset })).toBe(expected)
  })

  it('reports remaining percent clamped 0 to 100', () => {
    expect(
      remainingPercent({ video: 0, gaming: 0, camera: 0, social: 0, navigation: 0, standby: 0 }),
    ).toBe(100)
    expect(
      remainingPercent({
        video: 99,
        gaming: 99,
        camera: 99,
        social: 99,
        navigation: 99,
        standby: 99,
      }),
    ).toBe(0)
    const light = remainingPercent({ ...BATTERY.presets.light })
    expect(light).toBeGreaterThan(0)
    expect(light).toBeLessThan(100)
  })

  it('returns null hours-to-empty with no usage, 0 when over capacity', () => {
    expect(
      hoursToEmpty({ video: 0, gaming: 0, camera: 0, social: 0, navigation: 0, standby: 0 }),
    ).toBeNull()
    expect(
      hoursToEmpty({ video: 99, gaming: 99, camera: 99, social: 99, navigation: 99, standby: 99 }),
    ).toBe(0)
  })

  it('sums total hours', () => {
    expect(totalHours({ ...BATTERY.presets.light })).toBe(1 + 0 + 1 + 2 + 1 + 14)
  })
})
