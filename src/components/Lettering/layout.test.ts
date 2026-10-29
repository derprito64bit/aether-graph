import { describe, expect, it } from 'vitest'
import { layoutLettering, wrapLettering } from './layout.ts'
import { GLYPHS, isLetterable } from './strokeFont.ts'

describe('drafting lettering', () => {
  it('has every capital, digit and drawing symbol the site letters', () => {
    expect(isLetterable('ABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789 .,:;-–/×±Ø°()\'"#+=%→!$')).toBe(true)
    expect(isLetterable('knurl 0.4 × 0.18')).toBe(true)
    expect(isLetterable('café')).toBe(false)
  })

  it('keeps every glyph inside a sane box', () => {
    for (const [ch, g] of Object.entries(GLYPHS)) {
      for (const s of g.strokes) {
        expect(s.length, ch).toBeGreaterThanOrEqual(2)
        for (const [x, y] of s) {
          expect(x, ch).toBeGreaterThanOrEqual(-0.5)
          expect(x, ch).toBeLessThanOrEqual(g.w + 0.5)
          expect(y, ch).toBeGreaterThanOrEqual(-1.2)
          expect(y, ch).toBeLessThanOrEqual(11.8)
        }
      }
    }
  })

  it('writes strokes in order, each after the last, ending at 1', () => {
    const laid = layoutLettering('Knurl 0.4 × 0.18')
    expect(laid.strokes.length).toBeGreaterThan(10)
    let last = 0
    for (const s of laid.strokes) {
      expect(s.start).toBeGreaterThanOrEqual(last - 1e-9)
      expect(s.end).toBeGreaterThan(s.start)
      last = s.end
    }
    expect(laid.strokes.at(-1)?.end).toBeCloseTo(1, 9)
    expect(laid.strokes[0]?.start).toBe(0)
  })

  it('wraps on word boundaries to the width', () => {
    // CLUTCH LIFTS is 80 units wide; adding OUT would make 108.4.
    expect(wrapLettering('clutch lifts out for cleaning', 90)).toEqual([
      ['CLUTCH', 'LIFTS'],
      ['OUT', 'FOR'],
      ['CLEANING'],
    ])
    const laid = layoutLettering('clutch lifts out for cleaning', 90)
    expect(laid.lines).toBe(3)
    expect(laid.width).toBeLessThanOrEqual(90)
    expect(laid.height).toBe(42)
  })

  it('aligns wrapped lines within the block', () => {
    const firstX = (d: string) => Number(d.slice(1).split(' ')[0])
    const firstY = (d: string) => Number.parseFloat(d.slice(1).split(' ')[1] ?? '0')
    const left = layoutLettering('clutch lifts out for cleaning', 90, 'left')
    const right = layoutLettering('clutch lifts out for cleaning', 90, 'right')
    // Line 3 (CLEANING, y from 32) is the shortest: flush right it starts further in.
    const lastLine = (l: typeof left) => l.strokes.filter((s) => firstY(s.d) >= 30)
    expect(right.width).toBe(left.width)
    const leftStart = Math.min(...lastLine(left).map((s) => firstX(s.d)))
    const rightStart = Math.min(...lastLine(right).map((s) => firstX(s.d)))
    expect(rightStart - leftStart).toBeGreaterThan(20)
  })

  it('is pure', () => {
    expect(layoutLettering('Ø9 barrel')).toEqual(layoutLettering('Ø9 barrel'))
  })
})
