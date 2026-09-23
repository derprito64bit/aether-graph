import { AnimatePresence, motion, useMotionValueEvent, type MotionValue } from 'motion/react'
import { useEffect, useRef, useState, type RefObject } from 'react'
import { Glass } from '../../components/Glass/Glass.tsx'
import { CHAPTERS, TEARDOWN_COPY } from '../chapters.ts'
import { inspectHit } from '../inspect.ts'
import { scrimForStage, stageColors } from '../stage/stageColors.ts'
import { scrollToProgress } from '../scroll.ts'
import { TEARDOWN_LAYERS, cursorAt } from '../teardown/layers.ts'
import { ACTS } from '../timeline.ts'
import { useChapter } from '../useChapter.ts'
import { BigNumeral } from './BigNumeral.tsx'
import { Callouts } from './Callouts.tsx'
import { Headline } from './Headline.tsx'
import { Kicker } from './Kicker.tsx'
import { SpecLines } from './SpecLines.tsx'
import { XrayReadout } from './XrayReadout.tsx'

interface FilmOverlayProps {
  progress: MotionValue<number>
  /** Runway section: rail and keyboard jumps map progress through it. */
  runway: RefObject<HTMLElement | null>
}

/**
 * Editorial captions, act rail, scroll cue, and x-ray tooltip.
 * Chapters crossfade on opacity only (Jakub 200-400ms range); the rail
 * numbers a true sequence, so numbered markers encode real information.
 */
export function FilmOverlay({ progress, runway }: FilmOverlayProps) {
  const act = useChapter(progress)
  const [scrolled, setScrolled] = useState(false)
  const [readout, setReadout] = useState<string | null>(null)
  const chapter = CHAPTERS.find((c) => c.act === act.id) ?? CHAPTERS[0]
  // Teardown layer cursor: ten copy cards ride the feature run. HTML only.
  // Derived from progress directly, never from the act closure: on a ?t=
  // deep link the scroll jumps once while the act state is still stale,
  // which would wedge the copy on layer zero forever.
  const [layerIndex, setLayerIndex] = useState(0)
  useMotionValueEvent(progress, 'change', (p) => {
    const v = typeof p === 'number' ? p : 0
    if (v < 0.24 || v >= 0.48) return
    setLayerIndex(Math.min(9, Math.max(0, Math.floor(cursorAt(v)))))
  })
  const layerCopy = act.id === 'exploded' ? TEARDOWN_COPY[layerIndex] : undefined
  const layerAccent = act.id === 'exploded' ? TEARDOWN_LAYERS[layerIndex]?.accent : undefined

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const el = runway.current
      if (el !== null) scrollToProgress(el, next.start, reduced ? 'instant' : 'smooth')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [act.id, runway])

  // Scroll-driven page tint (Prompt D section 8.1): the act colour at low
  // opacity over the page. Written straight to the DOM, never React state.
  // Hooks stay above the empty-chapters bail so the order never changes.
  const tintRef = useRef<HTMLDivElement>(null)
  const scrimRef = useRef<HTMLDivElement>(null)
  useMotionValueEvent(progress, 'change', (p) => {
    const v = typeof p === 'number' ? p : 0
    const { base } = stageColors(v)
    const baseHex = `#${base.getHexString()}`
    const tint = tintRef.current
    if (tint !== null) tint.style.backgroundColor = `${baseHex}14`
    // Contrast scrim (Prompt D section 11): strengthens as the stage
    // brightens so text clears 4.5:1 everywhere (tested, not vibed).
    const scrim = scrimRef.current
    if (scrim !== null) scrim.style.opacity = String(scrimForStage(baseHex))
  })
  if (chapter === undefined) return null
  return (
    <div className="pointer-events-none absolute inset-0" aria-live="polite">
      <div ref={tintRef} aria-hidden="true" className="absolute inset-0" />
      <div
        ref={scrimRef}
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(105deg, rgba(239,231,211,0.92) 0%, rgba(239,231,211,0.92) 38%, rgba(239,231,211,0) 68%)',
          opacity: 0,
        }}
      />
      <div
        data-align={act.align}
        data-testid="film-chapter"
        data-act={act.id}
        className={
          act.id === 'exploded'
            ? // Showcase split: the exploded stack holds the left of frame
              // while the featured part takes its solo on the right, so
              // the copy lives in the right column beside it. Under 900px
              // the text drops to a compact bottom sheet and the stack
              // shifts up via the compact gap.
              'absolute inset-x-0 bottom-0 flex justify-center px-6 pb-10 text-center md:bottom-auto md:left-auto md:right-16 md:top-[36%] md:w-[38%] md:-translate-y-1/2 md:justify-start md:px-0 md:pb-0 md:text-left'
            : 'absolute inset-x-0 bottom-24 flex justify-center px-6 text-center data-[align=left]:justify-start data-[align=left]:text-left data-[align=right]:justify-end data-[align=right]:text-right md:inset-x-16'
        }
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={act.id === 'exploded' ? `teardown-${layerIndex}` : act.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="max-w-xl"
          >
            {layerCopy !== undefined ? (
              <>
                <div
                  aria-hidden="true"
                  className="mb-3 h-px w-10"
                  style={{ backgroundColor: layerAccent ?? '#7fb4ff' }}
                />
                <Kicker>{layerCopy.kicker}</Kicker>
                <h2 className="spec-num mt-3 text-5xl md:text-7xl">{layerCopy.headline}</h2>
                <p className="mt-3 hidden text-base text-(--color-dim) md:block">
                  {layerCopy.body}
                </p>
                <p className="spec-tech mt-3 text-(--color-dim)">{layerCopy.figure}</p>
              </>
            ) : (
              <>
                <Kicker>{chapter.kicker}</Kicker>
                <Headline>{chapter.headline}</Headline>
                <p className="mt-3 text-base text-(--color-dim)">{chapter.body}</p>
                {chapter.numeral !== undefined ? <BigNumeral numeral={chapter.numeral} /> : null}
                {chapter.spec !== undefined ? <SpecLines lines={chapter.spec} /> : null}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {readout !== null ? (
        <div className="absolute left-1/2 top-24 -translate-x-1/2">
          <Glass variant="tooltip" label="Inspected part">
            <XrayReadout readout={readout} />
          </Glass>
        </div>
      ) : null}

      {act.id === 'exploded' && <Callouts progress={progress} />}

      <nav
        aria-label="Film acts"
        className="pointer-events-auto absolute right-4 top-1/2 hidden -translate-y-1/2 flex-col gap-2 md:flex"
      >
        {ACTS.map((a, i) => (
          <a
            key={a.id}
            href={`#act-${a.id}`}
            aria-label={`Act ${i + 1}: ${a.id}`}
            aria-current={a.id === act.id ? 'true' : undefined}
            data-active={a.id === act.id}
            className="kicker opacity-40 data-[active=true]:opacity-100"
            onClick={(e) => {
              e.preventDefault()
              const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
              const el = runway.current
              if (el !== null) scrollToProgress(el, a.start, reduced ? 'instant' : 'smooth')
            }}
          >
            {String(i + 1).padStart(2, '0')}
          </a>
        ))}
      </nav>

      {!scrolled ? (
        <p className="spec-tech absolute bottom-8 left-1/2 -translate-x-1/2 animate-pulse">
          Scroll to play
        </p>
      ) : null}
    </div>
  )
}
