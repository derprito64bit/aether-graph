import { useEffect } from 'react'
import { useLocation } from 'react-router'

/** Scroll management: reset on route change, honor hashes, respect reduced motion. */
export function ScrollManager() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (hash !== '') {
      const el = document.querySelector(hash)
      if (el !== null) {
        el.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'start' })
        return
      }
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname, hash])
  return null
}
