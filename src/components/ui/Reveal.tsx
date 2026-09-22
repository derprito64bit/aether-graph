import { useEffect, useRef, type ReactNode } from 'react'

interface RevealProps {
  children: ReactNode
  delayMs?: number
}

/** Intersection reveal. Opacity and transform only, none under reduced motion. */
export function Reveal({ children, delayMs = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (el === null) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('is-visible')
      return
    }
    el.style.setProperty('--reveal-delay', `${delayMs}ms`)
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.classList.add('is-visible')
            observer.disconnect()
          }
        }
      },
      { threshold: 0.15 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [delayMs])
  return (
    <div ref={ref} className="reveal">
      {children}
    </div>
  )
}
