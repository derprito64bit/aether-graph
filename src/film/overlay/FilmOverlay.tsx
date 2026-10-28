import { ArrowDownIcon } from '@phosphor-icons/react'
import { AnimatePresence, motion, useMotionValueEvent, type MotionValue } from 'motion/react'
import { useEffect, useRef, useState, type RefObject } from 'react'
import { AnchorLink } from '../../components/layout/AnchorLink.tsx'
import { Glass } from '../../components/Glass/Glass.tsx'
import { pencilPrice } from '../../data/pencil.ts'
import { formatPrice } from '../../lib/format.ts'
import { CHAPTERS, TEARDOWN_COPY } from '../chapters.ts'
import { inspectHit } from '../inspect.ts'
import type { ActDef } from '../key.ts'
import { scrimForStage, stageColors } from '../stage/stageColors.ts'
import { scrollToProgress } from '../scroll.ts'
import { cursorAt } from '../teardown/layers.ts'
import { ACTS } from '../timeline.ts'
import { useChapter } from '../useChapter.ts'
import { ActRuler } from './ActRuler.tsx'
import { BigNumeral } from './BigNumeral.tsx'
import { AssemblyBalloons } from './AssemblyBalloons.tsx'
import { BillOfMaterials } from './BillOfMaterials.tsx'
import { Headline } from './Headline.tsx'
import { Kicker } from './Kicker.tsx'
import { SpecLines } from './SpecLines.tsx'
import { XrayReadout } from './XrayReadout.tsx'

interface FilmOverlayProps {
  progress: MotionValue<number>
  /** Runway section: rail and keyboard jumps map progress through it. */
  runway: RefObject<HTMLElement | null>
}

const EASE = [0.16, 1, 0.3, 1] as const
const CHAPTER = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.045, delayChildren: 0.04 } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease: 'easeIn' as const } },
}
const FADE = {
  hidden: { opacity: 0, y: 12 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
}

const PAPER = '236,237,233'
const FROM_PRICE = formatPrice(pencilPrice('graphite', '05'))

/**
 * Where the chapter copy sits for each act. Under md it is always a bottom
 * sheet; above it the copy takes the side of frame the shot leaves empty,
 * clear of the act ruler on the right.
 */
function placement(act: ActDef): string {
  const sheet = 'absolute inset-x-0 bottom-[8svh] px-6 text-center md:px-0'
  if (act.id === 'exploded') {
    // The assembly drawing owns the upper frame; the part copy sits under
    // it at left and the parts list at right.
    return `${sheet} md:inset-x-auto md:bottom-[9svh] md:left-12 md:max-w-[min(34rem,40vw)] md:text-left lg:left-16`
  }
  if (act.id === 'hero' || act.align === 'left') {
    return `${sheet} md:inset-x-auto md:bottom-[11svh] md:left-12 md:max-w-[min(46rem,46vw)] md:text-left lg:left-16`
  }
  if (act.align === 'right') {
    return `${sheet} md:inset-x-auto md:right-32 md:bottom-[11svh] md:max-w-[min(40rem,40vw)] md:text-right lg:right-40`
  }
  return `${sheet} md:inset-x-0 md:bottom-[9svh] md:mx-auto md:max-w-3xl`
}

/** Cross-axis alignment for the chapter stack: numerals and specs follow the copy. */
function stackAlign(act: ActDef): string {
  if (act.id === 'exploded') return 'flex flex-col items-center md:items-start'
  if (act.id === 'hero' || act.align === 'left') return 'flex flex-col items-center md:items-start'
  if (act.align === 'right') return 'flex flex-col items-center md:items-end'
  return 'flex flex-col items-center'
}

/**
 * Paper scrim behind the copy, on the side the copy actually sits. The
 * exploded act keeps its copy and parts list under the drawing, so it
 * scrims from the bottom and never veils the parts.
 */
function sideScrim(act: ActDef): string {
  if (act.id === 'exploded')
    return `linear-gradient(0deg, rgba(${PAPER},0.9) 0%, rgba(${PAPER},0.6) 22%, rgba(${PAPER},0) 40%)`
  const copyLeft = act.id === 'hero' || act.align === 'left'
  const copyRight = act.align === 'right'
  const side = copyLeft ? 90 : copyRight ? 270 : 0
  if (side === 0) return `linear-gradient(0deg, rgba(${PAPER},0.9) 0%, rgba(${PAPER},0) 42%)`
  return `linear-gradient(${side}deg, rgba(${PAPER},0.92) 0%, rgba(${PAPER},0.82) 30%, rgba(${PAPER},0) 58%)`
}

/**
 * Editorial captions, act ruler, hero actions, and the x-ray tooltip.
 * Chapters enter word by word and leave on a short fade; everything that
 * follows scroll position is a MotionValue written outside React.
 */
export function FilmOverlay({ progress, runway }: FilmOverlayProps) {
  const act = useChapter(progress)
  const [readout, setReadout] = useState<string | null>(null)
  const chapter = CHAPTERS.find((c) => c.act === act.id) ?? CHAPTERS[0]
  // Teardown layer cursor: ten copy cards ride the feature run. HTML only.
  // Derived from progress directly, never from the act closure: on a ?t=
  // deep link the scroll jumps once while the act state is still stale,
  // which would wedge the copy on layer zero forever.
  // -1 before the feature run (the act's intro copy shows), -2 after it:
  // the parts fold home and the pencil turns toward the x-ray view with the
  // frame clear of copy and the parts list.
  const [layerIndex, setLayerIndex] = useState(-1)
  useMotionValueEvent(progress, 'change', (p) => {
    const v = typeof p === 'number' ? p : 0
    const c = cursorAt(v)
    const next = c >= 9.98 ? -2 : c > 0.02 ? Math.min(9, Math.floor(c)) : -1
    setLayerIndex((prev) => (prev === next ? prev : next))
  })
  const exploded = act.id === 'exploded'
  const outro = exploded && layerIndex === -2
  const layerCopy = act.id === 'exploded' && layerIndex >= 0 ? TEARDOWN_COPY[layerIndex] : undefined

  useEffect(() => {
    if (act.id !== 'exploded') {
      setReadout(null)
      return
    }
    const timer = window.setInterval(() => {
      const hit = inspectHit()
      setReadout(hit?.readout ?? null)
    }, 200)
    return () => window.clearInterval(timer)
  }, [act.id])

  const jump = (target: ActDef) => {
    const el = runway.current
    if (el !== null) scrollToProgress(el, target.start + 0.001, 'smooth')
  }

  // Keyboard film navigation: arrows jump between acts with an aria-live
  // announcement of the act name (the chapter container below is the live
  // region). Ignored inside text fields and the dev scrubber slider.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
      const target = event.target as HTMLElement | null
      if (target !== null && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return
      const index = ACTS.findIndex((a) => a.id === act.id)
      const next = event.key === 'ArrowRight' ? ACTS[index + 1] : ACTS[index - 1]
      if (next === undefined) return
      event.preventDefault()
      const el = runway.current
      if (el !== null) scrollToProgress(el, next.start + 0.001, 'smooth')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [act.id, runway])

  // Scroll-driven page tint (Prompt D section 8.1) and the contrast scrim
  // (section 11), written straight to the DOM, never React state.
  const tintRef = useRef<HTMLDivElement>(null)
  const scrimRef = useRef<HTMLDivElement>(null)
  const chapterRef = useRef<HTMLDivElement>(null)
  useMotionValueEvent(progress, 'change', (p) => {
    const v = typeof p === 'number' ? p : 0
    const { base } = stageColors(v)
    const baseHex = `#${base.getHexString()}`
    const tint = tintRef.current
    if (tint !== null) tint.style.backgroundColor = `${baseHex}14`
    const scrim = scrimRef.current
    if (scrim !== null) scrim.style.opacity = String(Math.max(0.4, scrimForStage(baseHex) * 4))
  })
  if (chapter === undefined) return null
  const isHero = act.id === 'hero'
  const contentKey = exploded && layerIndex >= 0 ? `teardown-${layerIndex}` : act.id

  return (
    <div className="pointer-events-none absolute inset-0">
      <div ref={tintRef} aria-hidden="true" className="absolute inset-0" />
      <div ref={scrimRef} aria-hidden="true" className="absolute inset-0 opacity-40">
        <div
          className="absolute inset-0 md:hidden"
          style={{
            background: `linear-gradient(0deg, rgba(${PAPER},0.94) 0%, rgba(${PAPER},0.75) 30%, rgba(${PAPER},0) 52%)`,
          }}
        />
        <div className="absolute inset-0 hidden md:block" style={{ background: sideScrim(act) }} />
      </div>

      <div
        data-align={act.align}
        ref={chapterRef}
        data-testid="film-chapter"
        data-act={act.id}
        aria-live="polite"
        tabIndex={-1}
        className={`${placement(act)} outline-none`}
      >
        <AnimatePresence mode="wait">
          {outro ? null : (
            <motion.div
              key={contentKey}
              variants={CHAPTER}
              initial="hidden"
              animate="shown"
              exit="exit"
              className={stackAlign(act)}
            >
              {layerCopy !== undefined ? (
                <>
                  <motion.div variants={FADE}>
                    <Kicker>
                      Part {layerIndex + 1} · {layerCopy.kicker}
                    </Kicker>
                  </motion.div>
                  <Headline size="md">{layerCopy.headline}</Headline>
                  <motion.p
                    variants={FADE}
                    className="mt-3 hidden max-w-md text-base text-(--color-dim) md:block"
                  >
                    {layerCopy.body}
                  </motion.p>
                  <motion.p variants={FADE} className="spec-tech mt-3 text-(--color-aether-deep)">
                    {layerCopy.figure}
                  </motion.p>
                </>
              ) : (
                <>
                  {/* On phones the hero kicker would sit on the pencil tip, and
                    the nav already names the product. */}
                  <motion.div variants={FADE} className={isHero ? 'hidden md:block' : undefined}>
                    <Kicker>{chapter.kicker}</Kicker>
                  </motion.div>
                  <Headline size={isHero ? 'xl' : 'lg'}>{chapter.headline}</Headline>
                  <motion.p
                    variants={FADE}
                    className={`mt-4 text-base text-(--color-dim) md:text-lg ${
                      act.align === 'right' && !isHero ? 'md:ml-auto' : ''
                    } max-w-[42ch] ${act.align === 'center' ? 'mx-auto' : ''}`}
                  >
                    {chapter.body}
                  </motion.p>
                  {isHero ? (
                    <motion.div
                      variants={FADE}
                      className="pointer-events-auto mt-8 flex flex-wrap items-center justify-center gap-3 md:justify-start"
                    >
                      <AnchorLink id="buy" className="btn btn-primary" testId="hero-buy">
                        Buy from {FROM_PRICE}
                      </AnchorLink>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => {
                          const next = ACTS[1]
                          if (next === undefined) return
                          // This button unmounts with the hero chapter; keep
                          // keyboard focus in the film instead of on <body>.
                          chapterRef.current?.focus({ preventScroll: true })
                          jump(next)
                        }}
                      >
                        Watch the film
                        <ArrowDownIcon
                          size={16}
                          className="btn-arrow rotate-0"
                          aria-hidden="true"
                        />
                      </button>
                    </motion.div>
                  ) : null}
                  {/* The final beat compacts on small screens: the purchase
                    deck with every option sits directly below. */}
                  <motion.div
                    variants={FADE}
                    className={act.id === 'final' ? 'hidden md:block' : ''}
                  >
                    {chapter.numeral !== undefined ? (
                      <BigNumeral numeral={chapter.numeral} />
                    ) : null}
                    {chapter.spec !== undefined ? <SpecLines lines={chapter.spec} /> : null}
                  </motion.div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {readout !== null ? (
        <div className="absolute top-24 left-1/2 -translate-x-1/2">
          <Glass variant="tooltip" label="Inspected part">
            <XrayReadout readout={readout} />
          </Glass>
        </div>
      ) : null}

      {exploded && !outro ? <BillOfMaterials active={layerIndex} /> : null}
      <AssemblyBalloons progress={progress} />

      <ActRuler progress={progress} active={act} onJump={jump} />
    </div>
  )
}
