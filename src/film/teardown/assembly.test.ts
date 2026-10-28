import { describe, expect, it } from 'vitest'
import {
  ASSEMBLY,
  ASSEMBLY_GAP,
  MECHANISM_ROW,
  SHELL_ROW,
  SPREAD_ORDER,
  assemblyDistance,
  featurePose,
  featureScale,
  layoutAssembly,
  spreadAt,
  subAssemblyAt,
  uprightRz,
  type AssemblyPart,
  type PartExtent,
} from './assembly.ts'
import { TEARDOWN_LAYERS } from './layers.ts'
import { sampleFilm } from '../sample.ts'

/** Rest extents close to the real model, metres along the axis. */
const EXT: Record<AssemblyPart, PartExtent> = {
  lead: { minY: -0.0002, maxY: 0.0555 },
  sleeve: { minY: 0.0016, maxY: 0.0058 },
  nose: { minY: 0.0056, maxY: 0.0236 },
  clutch: { minY: 0.0118, maxY: 0.0228 },
  grip: { minY: 0.0198, maxY: 0.0476 },
  shaft: { minY: 0.0186, maxY: 0.1176 },
  spring: { minY: 0.112, maxY: 0.1245 },
  barrel: { minY: 0.0438, maxY: 0.1296 },
  clip: { minY: 0.062, maxY: 0.1308 },
  cap: { minY: 0.1256, maxY: 0.1414 },
}
const CENTER = 0.071

function slotCenter(id: AssemblyPart, layout = layoutAssembly(EXT, CENTER)): number {
  return (EXT[id].minY + EXT[id].maxY) / 2 + layout.offsets[id].y
}

describe('exploded assembly layout', () => {
  it('covers every teardown layer exactly once across the rows and the clip', () => {
    const placed = [...SHELL_ROW, ...MECHANISM_ROW, 'clip']
    expect(new Set(placed).size).toBe(placed.length)
    expect([...placed].sort()).toEqual(TEARDOWN_LAYERS.map((l) => l.id).sort())
    expect([...SPREAD_ORDER].sort()).toEqual([...placed].sort())
  })

  it('keeps tip-to-crown order in each row with an even gap and no overlap', () => {
    const layout = layoutAssembly(EXT, CENTER)
    for (const row of [SHELL_ROW, MECHANISM_ROW]) {
      for (let i = 1; i < row.length; i++) {
        const a = row[i - 1] as AssemblyPart
        const b = row[i] as AssemblyPart
        const aMax = EXT[a].maxY + layout.offsets[a].y
        const bMin = EXT[b].minY + layout.offsets[b].y
        expect(bMin - aMax).toBeCloseTo(ASSEMBLY_GAP, 9)
      }
    }
  })

  it('centres both rows on the pencil centre', () => {
    const layout = layoutAssembly(EXT, CENTER)
    for (const row of [SHELL_ROW, MECHANISM_ROW]) {
      const first = row[0] as AssemblyPart
      const last = row[row.length - 1] as AssemblyPart
      const lo = EXT[first].minY + layout.offsets[first].y
      const hi = EXT[last].maxY + layout.offsets[last].y
      expect((lo + hi) / 2).toBeCloseTo(CENTER, 9)
    }
  })

  it('puts the mechanism on its own row and the clip above the barrel', () => {
    const layout = layoutAssembly(EXT, CENTER)
    for (const id of MECHANISM_ROW) expect(layout.offsets[id].x).toBeGreaterThan(0.015)
    for (const id of SHELL_ROW) expect(layout.offsets[id].x).toBe(0)
    expect(layout.offsets.clip.x).toBeLessThan(0)
    expect(layout.offsets.clip.y).toBe(layout.offsets.barrel.y)
    expect(slotCenter('lead')).toBeLessThan(slotCenter('spring'))
  })

  it('spreads every part out in order and has every part home before x-ray', () => {
    for (const id of SPREAD_ORDER) {
      expect(spreadAt(0.25, id)).toBe(0)
      expect(spreadAt(0.3, id)).toBe(1)
      expect(spreadAt(0.4, id)).toBe(1)
      expect(spreadAt(ASSEMBLY.homeBy, id)).toBe(0)
      expect(spreadAt(0.6, id)).toBe(0)
    }
    // Staggered: the first part leaves before the last.
    const mid = 0.27
    expect(spreadAt(mid, 'sleeve')).toBeGreaterThan(spreadAt(mid, 'spring'))
  })

  it('moves continuously in both directions (reverse scrub retraces)', () => {
    for (const id of SPREAD_ORDER) {
      let prev = spreadAt(0.24, id)
      for (let p = 0.24; p <= 0.5; p += 0.0001) {
        const v = spreadAt(p, id)
        expect(Math.abs(v - prev)).toBeLessThan(0.02)
        expect(spreadAt(p, id)).toBe(v)
        prev = v
      }
    }
  })

  it('opens sub-assemblies only while their parent has room', () => {
    for (const parent of ['grip', 'clutch', 'cap'] as const) {
      expect(subAssemblyAt(0.26, parent)).toBe(0)
      expect(subAssemblyAt(0.35, parent)).toBe(1)
      expect(subAssemblyAt(ASSEMBLY.homeBy, parent)).toBe(0)
      for (let p = 0.24; p <= 0.5; p += 0.0005) {
        // Never open while the parts are still packed together, and closed
        // before the parent is back in the pencil.
        if (subAssemblyAt(p, parent) > 0) {
          for (const id of SPREAD_ORDER) {
            if (p < 0.4) expect(spreadAt(p, id)).toBeGreaterThan(0.5)
          }
          expect(spreadAt(p, parent)).toBeGreaterThan(0.55)
        }
      }
    }
  })

  it('turns each featured part one full revolution and lands it back', () => {
    const pose = { lift: 0, spin: 0 }
    featurePose(0, pose)
    expect(pose.lift).toBe(0)
    expect(pose.spin).toBe(0)
    featurePose(0.5, pose)
    expect(pose.lift).toBe(1)
    featurePose(1, pose)
    expect(pose.lift).toBe(0)
    expect(pose.spin).toBeCloseTo(Math.PI * 2, 12)
    // Same object back: no allocation per frame.
    expect(featurePose(0.3, pose)).toBe(pose)
  })

  it('grows short parts more than long ones, within bounds', () => {
    expect(featureScale(0.004)).toBeGreaterThan(featureScale(0.08))
    expect(featureScale(0.001)).toBeLessThanOrEqual(1.6)
    expect(featureScale(0.2)).toBeGreaterThanOrEqual(1.05)
  })

  it('frames the drawing wider on wide screens and taller when upright', () => {
    const wide = assemblyDistance(0.24, 0.04, 24, 16 / 9, false)
    const tall = assemblyDistance(0.24, 0.04, 24, 390 / 844, true)
    expect(wide).toBeGreaterThan(0.3)
    expect(tall).toBeGreaterThan(0.3)
    // A narrower screen never brings the camera closer for the same drawing.
    expect(assemblyDistance(0.24, 0.04, 24, 1.3, false)).toBeGreaterThan(wide)
  })

  it('stands the drawing upright on tall screens without a wobble', () => {
    const roll = (p: number): number => uprightRz(p, sampleFilm(p).rz)
    // Exactly authored at the window's edges, upright while flat.
    expect(roll(0.24)).toBeCloseTo(sampleFilm(0.24).rz, 9)
    expect(roll(0.49)).toBeCloseTo(sampleFilm(0.49).rz, 9)
    expect(roll(0.35)).toBeCloseTo(0, 9)
    // Monotonic in each half: no back-and-forth on the way in or out.
    const sign = (a: number, b: number) => Math.sign(b - a)
    let dirIn = 0
    for (let p = 0.24; p < 0.3; p += 0.0005) {
      const s = sign(roll(p), roll(p + 0.0005))
      if (s !== 0 && dirIn === 0) dirIn = s
      if (s !== 0) expect(s).toBe(dirIn)
    }
    let dirOut = 0
    for (let p = 0.46; p < 0.49; p += 0.0005) {
      const s = sign(roll(p), roll(p + 0.0005))
      if (s !== 0 && dirOut === 0) dirOut = s
      if (s !== 0) expect(s).toBe(dirOut)
    }
  })
})
