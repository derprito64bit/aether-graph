import Lenis from 'lenis'

/**
 * One page-wide smooth-scroll instance. Lenis eases wheel input so the HTML
 * overlay glides with the damped 3D camera instead of stepping per wheel
 * notch; touch keeps native momentum. It drives the real window scroll, so
 * Motion's useScroll and every scroll-progress MotionValue keep working
 * unchanged. Off under reduced motion: jumps are instant there.
 */
let instance: Lenis | null = null

function reducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return true
  }
}

/** Starts the shared instance. Returns a teardown for the mounting effect. */
export function startSmoothScroll(): () => void {
  if (instance !== null || reducedMotion()) return () => {}
  const lenis = new Lenis({ autoRaf: true, lerp: 0.12, wheelMultiplier: 0.9 })
  instance = lenis
  return () => {
    lenis.destroy()
    if (instance === lenis) instance = null
  }
}

/**
 * Scrolls the page to a document Y, smoothly unless told otherwise. Jumps
 * go through native scroll: Lenis caches the page height, and a jump made
 * right after a tall section mounts (a ?t= deep link into the film
 * runway) would be clamped to the stale limit. Lenis re-syncs from the
 * native scroll event. Smooth moves refresh that cache first.
 */
export function scrollToY(top: number, immediate = false): void {
  const smooth = !immediate && !reducedMotion()
  if (instance !== null && smooth) {
    instance.resize()
    instance.scrollTo(top, { force: true })
    return
  }
  window.scrollTo({ top, behavior: smooth ? 'smooth' : 'instant' })
}

/** Scrolls an element's top to the viewport top, under the fixed nav. */
export function scrollToElement(el: Element, immediate = false): void {
  const nav = Number.parseFloat(getComputedStyle(el).scrollMarginTop) || 0
  const top = el.getBoundingClientRect().top + window.scrollY - nav
  scrollToY(top, immediate)
}
