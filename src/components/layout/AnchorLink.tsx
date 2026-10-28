import type { MouseEvent, ReactNode } from 'react'
import { Link, useLocation } from 'react-router'
import { scrollToElement } from '../../scroll/smooth.ts'
import { withBase } from '../../site.ts'

interface AnchorLinkProps {
  /** Section id on the home route, without the hash. */
  id: string
  children: ReactNode
  className?: string
  onNavigate?: () => void
  testId?: string
}

/**
 * Link to a home-route section. On the home route it scrolls through the
 * shared smooth-scroll instance and moves focus to the section, so keyboard
 * and screen-reader users land where the eye does. From another route it
 * navigates and the ScrollManager finishes the jump once the section mounts.
 */
export function AnchorLink({ id, children, className, onNavigate, testId }: AnchorLinkProps) {
  const { pathname } = useLocation()
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onNavigate?.()
    // New tab, new window, download: leave modified clicks to the browser.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return
    if (pathname !== '/') return
    const el = document.getElementById(id)
    if (el === null) return
    event.preventDefault()
    window.history.replaceState(null, '', withBase(`/#${id}`))
    scrollToElement(el)
    if (el.tabIndex < 0 && !el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1')
    el.focus({ preventScroll: true })
  }
  return (
    <Link
      to={{ pathname: '/', hash: `#${id}` }}
      className={className}
      onClick={onClick}
      data-testid={testId}
    >
      {children}
    </Link>
  )
}
