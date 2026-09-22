/** Format an integer with thousands separators in en-US. */
export function formatNumber(value: number): string {
  return Math.round(value).toLocaleString('en-US')
}

/** Format a whole-dollar price in USD with no cents. */
export function formatPrice(value: number): string {
  return `$${Math.round(value).toLocaleString('en-US')}`
}

/** Clamp a number into the closed interval [min, max]. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
