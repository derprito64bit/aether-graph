/**
 * The autopilot's tour, as pure data and maths: a list of scroll stops,
 * each reached over `travel` seconds on a smootherstep (a dolly that eases
 * off and in) and then held for `hold` seconds. Built from the page's
 * geometry by the runtime; tested here without a DOM.
 */
export interface TourStop {
  /** Document scroll position of the stop. */
  y: number
  travel: number
  hold: number
  /** What the visitor is looking at, for the control's label. */
  label: string
}

export interface TourPosition {
  y: number
  /** Index of the stop being travelled to or held at. */
  stop: number
  /** 0..1 through the whole tour, by time. */
  fraction: number
  done: boolean
}

/** 6t^5 - 15t^4 + 10t^3: zero velocity and acceleration at both ends. */
export function smootherstep(t: number): number {
  const x = Math.min(1, Math.max(0, t))
  return x * x * x * (x * (6 * x - 15) + 10)
}

export function tourDuration(stops: readonly TourStop[]): number {
  return stops.reduce((sum, s) => sum + s.travel + s.hold, 0)
}

/** Where the tour is `t` seconds after leaving `startY`. */
export function tourPosition(stops: readonly TourStop[], startY: number, t: number): TourPosition {
  const total = tourDuration(stops)
  let clock = Math.max(0, t)
  let from = startY
  for (let i = 0; i < stops.length; i++) {
    const s = stops[i]
    if (s === undefined) continue
    if (clock < s.travel) {
      const k = s.travel > 0 ? smootherstep(clock / s.travel) : 1
      return { y: from + (s.y - from) * k, stop: i, fraction: t / total, done: false }
    }
    clock -= s.travel
    if (clock < s.hold) return { y: s.y, stop: i, fraction: t / total, done: false }
    clock -= s.hold
    from = s.y
  }
  const last = stops[stops.length - 1]
  return {
    y: last?.y ?? startY,
    stop: Math.max(0, stops.length - 1),
    fraction: 1,
    done: true,
  }
}

/**
 * Drops the stops already behind the visitor, so the tour starts from
 * where they are rather than rewinding. The first remaining stop's travel
 * is scaled by how far is actually left to go.
 */
export function tourFrom(stops: readonly TourStop[], startY: number): TourStop[] {
  const ahead = stops.filter((s) => s.y > startY + 4)
  const first = ahead[0]
  if (first === undefined) return []
  const index = stops.indexOf(first)
  const prev = stops[index - 1]
  if (prev !== undefined && prev.y < first.y) {
    const share = Math.min(1, Math.max(0.25, (first.y - startY) / (first.y - prev.y)))
    ahead[0] = { ...first, travel: first.travel * share }
  }
  return ahead
}
