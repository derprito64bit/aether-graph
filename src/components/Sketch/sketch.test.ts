import { describe, expect, it } from 'vitest'
import { sketchBox, sketchRule } from './sketch.ts'

describe('pencil construction lines', () => {
  it('rules four sides then a lighter second pass', () => {
    const lines = sketchBox(400, 300, 12, 3)
    expect(lines).toHaveLength(8)
    for (const l of lines.slice(0, 4)) expect(l.opacity).toBeGreaterThan(0.5)
    for (const l of lines.slice(4)) expect(l.opacity).toBeLessThan(0.4)
  })

  it('draws the first pass side after side', () => {
    const first = sketchBox(400, 300, 12, 3).slice(0, 4)
    for (let i = 1; i < first.length; i++) {
      expect(first[i]?.delay).toBeGreaterThan(first[i - 1]?.delay ?? 0)
    }
  })

  it('overshoots every corner but stays near the box', () => {
    const top = sketchBox(400, 300, 12, 3)[0]?.d ?? ''
    const nums = top.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? []
    const [x0, , , , x1] = nums
    expect(x0).toBeLessThan(0)
    expect(x0).toBeGreaterThan(-13)
    expect(x1).toBeGreaterThan(400)
    expect(x1).toBeLessThan(413)
  })

  it('is deterministic and draws a scale with majors every fifth tick', () => {
    expect(sketchBox(200, 100, 10, 7)).toEqual(sketchBox(200, 100, 10, 7))
    const rule = sketchRule(240, 24, 1)
    expect(rule).toHaveLength(1 + 11)
    expect(rule.filter((l) => l.d.endsWith(' 9'))).toHaveLength(3)
  })
})
