import { BATTERY, type UsageHours, type UsageKey } from '../data/product.ts'

/** Total energy consumed for a usage schedule, in mAh. Deterministic. */
export function consumedMah(usage: UsageHours): number {
  return (Object.entries(usage) as Array<[UsageKey, number]>).reduce(
    (total, [key, hours]) => total + hours * BATTERY.drainPerHour[key],
    0,
  )
}

/** Percentage of the cell remaining after the schedule. Clamped 0 to 100. */
export function remainingPercent(usage: UsageHours): number {
  const consumed = consumedMah(usage)
  const pct = ((BATTERY.capacity - consumed) / BATTERY.capacity) * 100
  return Math.round(Math.min(100, Math.max(0, pct)))
}

/** Rough remaining on-time from the measured average drain. Null when no usage given. */
export function hoursToEmpty(usage: UsageHours): number | null {
  const consumed = consumedMah(usage)
  const total = totalHours(usage)
  if (consumed >= BATTERY.capacity) return 0
  if (total <= 0) return null
  const avgDrain = consumed / total
  return (BATTERY.capacity - consumed) / avgDrain
}

/** Total scheduled hours across all activities. */
export function totalHours(usage: UsageHours): number {
  return (Object.values(usage) as number[]).reduce((a, b) => a + b, 0)
}
