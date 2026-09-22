/**
 * Runway scroll mapping (round 03 Part D). The film progress `p` is a
 * fraction of the *runway*, not of the document: the page also holds the
 * navbar, configurator, buy deck and footer, so `a.start * documentRange`
 * lands in the wrong act (error grows with p, up to +0.08 at the end).
 * All three jump sites — the `?t=` deep link, the act rail, the keyboard
 * handler — share this helper.
 */

export interface RunwayGeometry {
  /** Runway top in document coordinates (scrollY at p = 0). */
  top: number
  /** Runway height in px. */
  height: number
  /** Viewport height in px. */
  viewportHeight: number
}

/** Document scroll position that shows runway progress `p`. */
export function scrollTopForProgress(g: RunwayGeometry, p: number): number {
  return g.top + p * (g.height - g.viewportHeight)
}

/** Runway progress visible at a document scroll position. */
export function progressForScrollTop(g: RunwayGeometry, scrollTop: number): number {
  const span = g.height - g.viewportHeight
  if (span <= 0) return 0
  return Math.min(1, Math.max(0, (scrollTop - g.top) / span))
}

/** Scrolls the page so the runway shows progress `p`. */
export function scrollToProgress(
  runway: { getBoundingClientRect(): { top: number; height: number } },
  p: number,
  behavior: ScrollBehavior,
): void {
  const rect = runway.getBoundingClientRect()
  const top = rect.top + window.scrollY
  window.scrollTo({ top: top + p * (rect.height - window.innerHeight), behavior })
}
