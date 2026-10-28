import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'motion/react'
import { useRef, useState } from 'react'
import { PENCIL } from '../../data/pencil.ts'
import { TechnicalDrawing, type DrawingFocus } from '../Drawing/TechnicalDrawing.tsx'

interface Beat {
  focus: Exclude<DrawingFocus, null>
  headline: string
  body: string
  figure: string
}

const BEATS: Beat[] = [
  {
    focus: 'balance',
    headline: 'Heavy where the work happens.',
    body: `${PENCIL.weightG} grams, balanced ${PENCIL.balanceFromTipMm} mm from the tip. The pencil leans into the line and your hand only steers.`,
    figure: `${PENCIL.weightG} g, tip-forward`,
  },
  {
    focus: 'tolerance',
    headline: 'The lead cannot wander.',
    body: `Three brass jaws close to ${PENCIL.clutchToleranceMm} mm. Wobble is not reduced. It is absent.`,
    figure: `±${PENCIL.clutchToleranceMm} mm clutch`,
  },
  {
    focus: 'grip',
    headline: 'Cut to hold still.',
    body: `A true diamond knurl at ${PENCIL.knurlPitchMm} mm pitch, bead-blasted between the teeth. It holds through sweat and graphite dust.`,
    figure: `${PENCIL.knurlPitchMm} mm knurl`,
  },
]

const TITLE = 'Why it looks like this.'
const DRAWING_LABEL = `Side elevation of the ${PENCIL.fullName}: ${PENCIL.lengthMm} mm long, ${PENCIL.barrelDiamMm} mm barrel, with the clutch, shaft, and spring shown as hidden lines.`

/** One segment of the beat progress bar, filled by scroll, never state. */
function Segment({ progress, index }: { progress: MotionValue<number>; index: number }) {
  const fill = useTransform(progress, (v) => Math.min(1, Math.max(0, v * BEATS.length - index)))
  return (
    <span className="relative h-px flex-1 overflow-hidden bg-(--color-rule)">
      <motion.span
        className="absolute inset-0 origin-left bg-(--color-aether)"
        style={{ scaleX: fill }}
      />
    </span>
  )
}

/**
 * Design philosophy, told against the drawing. The section pins while three
 * beats pass; each beat lifts its region of the drawing (balance point,
 * clutch, knurl). Scroll position maps to a beat index, and state changes
 * only when the index does. Reduced motion lays the beats out in full.
 */
export function CraftSection() {
  const reduced = useReducedMotion() === true
  const runway = useRef<HTMLElement>(null)
  const [active, setActive] = useState(0)
  const { scrollYProgress } = useScroll({ target: runway, offset: ['start start', 'end end'] })
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const next = Math.min(BEATS.length - 1, Math.max(0, Math.floor(v * BEATS.length)))
    setActive((prev) => (prev === next ? prev : next))
  })

  if (reduced) {
    return (
      <section
        id="craft"
        aria-labelledby="craft-title"
        className="mx-auto max-w-[1400px] px-4 py-24 md:px-8"
      >
        <h2 id="craft-title" className="spec-num display-lg">
          {TITLE}
        </h2>
        <figure className="mt-12">
          <TechnicalDrawing title={DRAWING_LABEL} />
          <figcaption className="spec-tech mt-3">Side elevation. Dimensions in mm.</figcaption>
        </figure>
        <div className="mt-16 grid gap-12 md:grid-cols-3">
          {BEATS.map((beat) => (
            <article key={beat.focus}>
              <h3 className="spec-num display-md">{beat.headline}</h3>
              <p className="mt-3 leading-relaxed text-(--color-dim)">{beat.body}</p>
              <p className="spec-tech mt-3">{beat.figure}</p>
            </article>
          ))}
        </div>
      </section>
    )
  }

  const beat = BEATS[active] ?? BEATS[0]
  if (beat === undefined) return null
  return (
    <section
      id="craft"
      ref={runway}
      aria-labelledby="craft-title"
      className="relative h-[330svh]"
      data-testid="craft"
    >
      <div className="sticky top-0 flex h-[100svh] flex-col overflow-hidden px-4 pt-28 pb-10 md:px-8 md:pt-32">
        <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col">
          <h2 id="craft-title" className="spec-num display-lg">
            {TITLE}
          </h2>
          <figure className="flex flex-1 flex-col justify-center py-6 md:py-8">
            <TechnicalDrawing title={DRAWING_LABEL} focus={beat.focus} />
            <figcaption className="spec-tech mt-2">Side elevation. Dimensions in mm.</figcaption>
          </figure>
          <div className="grid gap-6 md:grid-cols-12 md:items-end">
            <div
              className="relative min-h-[11rem] md:col-span-7 md:min-h-[9.5rem]"
              aria-live="polite"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.article
                  key={beat.focus}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                  data-testid="craft-beat"
                  data-focus={beat.focus}
                >
                  <h3 className="spec-num display-md">{beat.headline}</h3>
                  <p className="mt-3 max-w-[52ch] leading-relaxed text-(--color-dim)">
                    {beat.body}
                  </p>
                </motion.article>
              </AnimatePresence>
            </div>
            <div className="md:col-span-4 md:col-start-9">
              <p className="spec-tech text-(--color-aether-deep)">{beat.figure}</p>
              <div className="mt-3 flex gap-2" aria-hidden="true">
                {BEATS.map((b, i) => (
                  <Segment key={b.focus} progress={scrollYProgress} index={i} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
