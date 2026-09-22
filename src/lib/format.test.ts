import { describe, expect, it } from 'vitest'
import { clamp, formatNumber, formatPrice } from './format.ts'
import { cn } from './cn.ts'

describe('format helpers', () => {
  it('formats integers with en-US separators', () => {
    expect(formatNumber(12480)).toBe('12,480')
    expect(formatNumber(2800)).toBe('2,800')
  })

  it('formats whole-dollar prices', () => {
    expect(formatPrice(999)).toBe('$999')
    expect(formatPrice(1399)).toBe('$1,399')
  })

  it('clamps into range', () => {
    expect(clamp(5, 0, 1)).toBe(1)
    expect(clamp(-2, 0, 1)).toBe(0)
    expect(clamp(0.42, 0, 1)).toBeCloseTo(0.42)
  })

  it('joins class names dropping falsy parts', () => {
    expect(cn('a', false, null, undefined, 'b')).toBe('a b')
  })
})
