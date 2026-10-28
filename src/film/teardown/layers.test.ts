import { describe, expect, it } from 'vitest'
import { PENCIL_PARTS } from '../../components/PencilViewer/pencilDimensions.ts'
import { TEARDOWN_COPY } from '../chapters.ts'
import { TEARDOWN_LAYERS, cursorAt } from './layers.ts'

describe('teardown part manifest', () => {
  it('lists ten parts tip to crown, numbered in order', () => {
    expect(TEARDOWN_LAYERS.map((l) => l.id)).toEqual([...PENCIL_PARTS])
    TEARDOWN_LAYERS.forEach((layer, i) => expect(layer.index).toBe(i))
  })

  it('covers every pencil part group exactly once', () => {
    const groups = TEARDOWN_LAYERS.flatMap((l) => l.shell)
    expect(new Set(groups).size).toBe(groups.length)
    expect([...groups].sort()).toEqual([...PENCIL_PARTS].sort())
  })

  it('has copy and a parts-list material for every part, in the same order', () => {
    expect(TEARDOWN_COPY.map((c) => c.key)).toEqual(TEARDOWN_LAYERS.map((l) => l.copyKey))
    for (const copy of TEARDOWN_COPY) expect(copy.material.length).toBeGreaterThan(3)
  })

  it('runs the cursor 0 to 10 across the feature run', () => {
    expect(cursorAt(0.29)).toBe(0)
    expect(cursorAt(0.3)).toBe(0)
    expect(cursorAt(0.38)).toBeCloseTo(5, 9)
    expect(cursorAt(0.46)).toBeCloseTo(10, 9)
    expect(cursorAt(0.5)).toBe(10)
  })

  it('keeps every accent distinct', () => {
    const accents = TEARDOWN_LAYERS.map((l) => l.accent)
    expect(new Set(accents).size).toBe(accents.length)
  })
})
