/** Format an integer with thousands separators in en-US. */
export function formatNumber(value: number): string {
  return Math.round(value).toLocaleString('en-US')
}

/** Format a whole-dollar price in USD with no cents. */
export function formatPrice(value: number): string {
  return `$${Math.round(value).toLocaleString('en-US')}`
}

/**
 * Formats a count-up frame with the authored value's decimal places, so a
 * 0.4 mm numeral never renders as 0 mid-count or at rest.
 */
export function formatCount(value: number, authored: string): string {
  const decimals = authored.includes('.')
    ? (authored.split('.')[1]?.replace(/\D/g, '').length ?? 0)
    : 0
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

/** Clamp a number into the closed interval [min, max]. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
