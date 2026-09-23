import { motion, useScroll, useTransform } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { PENCIL_FINISHES, pencilPrice, type PencilFinishId } from '../../data/pencil.ts'
import { formatPrice } from '../../lib/format.ts'
import { PencilViewer } from '../PencilViewer/PencilViewer.tsx'

const TRACK_FINISHES: PencilFinishId[] = ['graphite', 'steel', 'brass']

/**
 * Product-family showroom: vertical scroll drives horizontal travel across
 * three finish alcoves. Each alcove pairs one large render with concise
 * copy, price, and a configurator jump. Under reduced motion the alcoves
 * stack vertically instead of travelling.
 */
export function VariantsTrack() {
  const runway = useRef<HTMLDivElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const lock = useRef(false)
  const [reducedMotion] = useState(() =>
    typeof window === 'undefined'
      ? false
      : window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const { scrollYProgress } = useScroll({ target: runway, offset: ['start start', 'end end'] })
  const x = useTransform(scrollYProgress, [0, 1], ['0vw', '-200vw'])

  const finishes = TRACK_FINISHES.map((id) => PENCIL_FINISHES.find((f) => f.id === id)).filter(
    (f) => f !== undefined,
  )
  const panelCount = finishes.length

  // One scroll gesture, one colour: while the stage is pinned, wheel
  // input pages between finishes instead of scrubbing continuously.
  // Native scroll (touch, keyboard, scrollbar) keeps working untouched,
  // and the ends release back to the page so nobody gets trapped.
  useEffect(() => {
    const el = runway.current
    const pinned = stage.current
    if (el === null || pinned === null || reducedMotion) return
    if (!window.matchMedia('(pointer: fine)').matches) return
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey) return
      const rect = el.getBoundingClientRect()
      const isPinned = rect.top <= 0 && rect.bottom >= window.innerHeight
      if (!isPinned) return
      const dir = (event.deltaY !== 0 ? event.deltaY : event.deltaX) > 0 ? 1 : -1
      const idx = Math.round(scrollYProgress.get() * (panelCount - 1))
      const next = Math.min(panelCount - 1, Math.max(0, idx + dir))
      if (next === idx) return
      event.preventDefault()
      if (lock.current) return
      lock.current = true
      const top = rect.top + window.scrollY
      const scrollable = rect.height - window.innerHeight
      window.scrollTo({ top: top + (next / (panelCount - 1)) * scrollable, behavior: 'smooth' })
      window.setTimeout(() => {
        lock.current = false
      }, 1100)
    }
    pinned.addEventListener('wheel', onWheel, { passive: false })
    return () => pinned.removeEventListener('wheel', onWheel)
  }, [scrollYProgress, panelCount, reducedMotion])

  if (reducedMotion) {
    return (
      <section
        aria-label="Aether Graph finishes"
        id="family"
        className="mx-auto max-w-6xl px-4 py-16"
      >
        <p className="kicker">Family</p>
        <h2 className="spec-num mt-3 text-4xl md:text-5xl">Three tempers.</h2>
        {finishes.map((finish) => (
          <article key={finish.id} className="grid gap-6 py-12 md:grid-cols-2">
            <div>
              <p className="kicker">{finish.name}</p>
              <p className="mt-3 text-(--color-dim)">{finish.description}</p>
              <p className="spec-tech mt-3">From {formatPrice(pencilPrice(finish.id, '05'))}</p>
            </div>
          </article>
        ))}
      </section>
    )
  }

  return (
    <section aria-label="Aether Graph finishes" id="family" ref={runway} className="h-[340vh]">
      <div
        ref={stage}
        className="sticky top-0 h-screen w-full overflow-hidden supports-[height:100svh]:h-[100svh]"
      >
        <motion.div style={{ x }} className="flex h-full w-[300vw]">
          {finishes.map((finish, i) => (
            <article
              key={finish.id}
              aria-label={`Finish ${finish.name}`}
              className="grid h-full w-screen shrink-0 items-center gap-6 px-6 md:grid-cols-2 md:px-16"
            >
              <div className="max-w-md">
                <p className="kicker">
                  {String(i + 1).padStart(2, '0')} / {String(finishes.length).padStart(2, '0')} ·
                  Family
                </p>
                <h2 className="spec-num mt-3 text-6xl md:text-8xl">{finish.name}</h2>
                <p className="mt-4 text-lg text-(--color-dim)">{finish.tagline}</p>
                <p className="mt-2 max-w-sm text-(--color-dim)">{finish.description}</p>
                <p className="spec-tech mt-6">From {formatPrice(pencilPrice(finish.id, '05'))}</p>
                <a
                  href="#buy"
                  className="mt-6 inline-block rounded-full bg-(--color-aether-strong) px-6 py-2.5 text-sm font-semibold text-black"
                >
                  Configure {finish.name}
                </a>
              </div>
              <div className="min-h-[320px]">
                <PencilViewer finish={finish.id} label={`Aether Graph 0.5 in ${finish.name}`} />
              </div>
            </article>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
