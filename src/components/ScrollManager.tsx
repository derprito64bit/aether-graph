import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { scrollToElement, scrollToY, startSmoothScroll } from '../scroll/smooth.ts'

/** How long a hash jump waits for a lazily mounted section, in ms. */
const HASH_WAIT_MS = 3000

/**
 * Scroll management: one smooth-scroll instance for the app, reset on route
 * change, honour hashes. Arriving from another route, the target section
 * mounts with the lazy route chunk, so the jump waits for it instead of
 * giving up at the top of the page. Reduced motion jumps instantly.
 */
export function ScrollManager() {
  const { pathname, hash } = useLocation()
  useEffect(() => startSmoothScroll(), [])
  useEffect(() => {
    if (hash === '') {
      scrollToY(0, true)
      return
    }
    let timer = 0
    const started = performance.now()
    const tryJump = () => {
      const el = document.querySelector(hash)
      if (el !== null) {
        scrollToElement(el, true)
        return
      }
      if (performance.now() - started < HASH_WAIT_MS) timer = window.setTimeout(tryJump, 80)
    }
    tryJump()
    return () => window.clearTimeout(timer)
  }, [pathname, hash])
  return null
}
