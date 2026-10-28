import { useMotionValue, useScroll, type MotionValue } from 'motion/react'
import { Suspense, lazy, useEffect, useRef, useState, type RefObject } from 'react'
import { TechnicalDrawing } from '../components/Drawing/TechnicalDrawing.tsx'
import { AnchorLink } from '../components/layout/AnchorLink.tsx'
import { PENCIL, pencilPrice } from '../data/pencil.ts'
import { formatPrice } from '../lib/format.ts'
import { CHAPTERS, TEARDOWN_COPY } from './chapters.ts'
import { FilmOverlay } from './overlay/FilmOverlay.tsx'
import { scrollToProgress } from './scroll.ts'
import { completeTask } from '../loader/loader.ts'

const FilmCanvasLazy = lazy(() =>
  import('./FilmCanvas.tsx').then((m) => ({ default: m.FilmCanvas })),
)

function webglAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return canvas.getContext('webgl2') !== null || canvas.getContext('webgl') !== null
  } catch {
    return false
  }
}

function progressFromUrl(): number | null {
  try {
    const t = new URLSearchParams(window.location.search).get('t')
    if (t === null) return null
    const v = Number.parseFloat(t)
    return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : null
  } catch {
    return null
  }
}

/** Binds a MotionValue to the runway scroll position. */
function useRunwayProgress(runway: RefObject<HTMLElement | null>): MotionValue<number> {
  const { scrollYProgress } = useScroll({ target: runway, offset: ['start start', 'end end'] })
  return scrollYProgress
}

const DRAWING_LABEL = `Technical drawing of the ${PENCIL.fullName}, side elevation with dimensions.`

/** Static story row: copy left, technical figure right. */
function StoryRow({
  label,
  kicker,
  headline,
  body,
  figure,
}: {
  label: string
  kicker: string
  headline: string
  body: string
  figure?: string
}) {
  return (
    <article
      aria-label={label}
      className="grid gap-4 border-t border-(--color-border-hairline) py-10 md:grid-cols-12 md:gap-8"
    >
      <div className="md:col-span-7">
        <p className="kicker">{kicker}</p>
        <h2 className="spec-num display-md mt-3">{headline}</h2>
        <p className="mt-3 max-w-[52ch] leading-relaxed text-(--color-dim)">{body}</p>
      </div>
      {figure !== undefined ? (
        <p className="spec-tech text-(--color-aether-deep) md:col-span-4 md:col-start-9 md:self-end md:text-right">
          {figure}
        </p>
      ) : null}
    </article>
  )
}

/**
 * The product film: one sticky stage inside a long runway, driven by a
 * single master scroll progress. Falls back to a static story without
 * WebGL, on context loss, under reduced motion, or with ?nogl.
 */
export function Film() {
  const runway = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const progress = useRunwayProgress(runway)
  const parallaxX = useMotionValue(0)
  const parallaxY = useMotionValue(0)
  const [canRender] = useState(() => {
    try {
      return !new URLSearchParams(window.location.search).has('nogl') && webglAvailable()
    } catch {
      return false
    }
  })
  // Reduced motion gets the static story, not a snapped film: a
  // scroll-driven film is a barrier for some people and a nausea trigger
  // for others (meta prompt section 6.9). Same fallback as no-WebGL.
  const [reducedMotion] = useState(() => {
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    } catch {
      return false
    }
  })
  const [contextLost, setContextLost] = useState(false)
  const showFallback = !canRender || contextLost || reducedMotion

  // The static story has no scene to wait for (and a lost context never
  // finishes one): release the loading page.
  useEffect(() => {
    if (showFallback) completeTask('scene')
  }, [showFallback])

  // Pointer parallax for fine pointers only. MotionValues, never state.
  useEffect(() => {
    const el = stage.current
    if (el === null || !window.matchMedia('(pointer: fine)').matches) return
    const onMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      parallaxX.set(((event.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 2)
      parallaxY.set(((event.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 2)
    }
    const onLeave = () => {
      parallaxX.set(0)
      parallaxY.set(0)
    }
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)
    return () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
    }
  }, [parallaxX, parallaxY])

  // ?t=0.42 deep link: jump the runway itself to that progress on mount.
  // Mapped against the runway rect, not the document: buy deck and footer
  // below the film would otherwise offset every value.
  useEffect(() => {
    const t = progressFromUrl()
    const runwayEl = runway.current
    if (t === null || runwayEl === null) return
    scrollToProgress(runwayEl, t, 'instant')
  }, [])

  if (showFallback) {
    return (
      <section
        aria-label="Aether Graph 0.5 story"
        className="mx-auto max-w-[1400px] px-4 pt-32 pb-16 md:px-8 md:pt-40"
        data-testid="film-fallback"
      >
        <h1 className="spec-num display-xl max-w-4xl">The instrument, not the accessory.</h1>
        <p className="mt-5 max-w-xl text-lg text-(--color-dim)">{CHAPTERS[0]?.body}</p>
        <p className="mt-8">
          <AnchorLink id="buy" className="btn btn-primary">
            Buy from {formatPrice(pencilPrice('graphite', '05'))}
          </AnchorLink>
        </p>
        <figure className="mt-16">
          <TechnicalDrawing title={DRAWING_LABEL} />
        </figure>
        <div className="mt-16">
          {CHAPTERS.slice(1).map((chapter) =>
            chapter.act === 'exploded' ? (
              // The teardown is information, not decoration: the static story
              // carries all ten layers with their copy.
              <div key="teardown-layers">
                <StoryRow
                  label="Act exploded"
                  kicker={chapter.kicker}
                  headline={chapter.headline}
                  body={chapter.body}
                />
                <div className="grid gap-x-8 md:grid-cols-2">
                  {TEARDOWN_COPY.map((layer) => (
                    <StoryRow
                      key={layer.key}
                      label={`Teardown layer ${layer.key}`}
                      kicker={layer.kicker}
                      headline={layer.headline}
                      body={layer.body}
                      figure={layer.figure}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <StoryRow
                key={chapter.act}
                label={`Act ${chapter.act}`}
                kicker={chapter.kicker}
                headline={chapter.headline}
                body={chapter.body}
                figure={
                  chapter.numeral !== undefined
                    ? `${chapter.numeral.value} ${chapter.numeral.unit}`
                    : undefined
                }
              />
            ),
          )}
        </div>
        {contextLost && (
          <p role="status" className="mt-8 text-sm text-(--color-dim)">
            3D paused after a graphics reset. Static story shown.
          </p>
        )}
        {reducedMotion && !contextLost && (
          <p className="mt-8 text-sm text-(--color-dim)">
            Motion is reduced on this device, so the story is told in stills.
          </p>
        )}
      </section>
    )
  }

  return (
    <section
      ref={runway}
      aria-label="Aether Graph 0.5 product film"
      style={{ height: 'var(--film-height)' }}
      data-testid="film-runway"
    >
      <h1 className="sr-only">Aether Graph 0.5: the instrument, not the accessory.</h1>
      <div
        ref={stage}
        className="sticky top-0 h-screen w-full overflow-hidden supports-[height:100svh]:h-[100svh]"
      >
        <Suspense
          fallback={
            <div
              className="flex h-full items-center justify-center px-8 md:justify-end md:pr-[12vw]"
              role="status"
            >
              <span className="sr-only">Preparing the film</span>
              <div className="w-full max-w-3xl opacity-80 md:w-[55vw]">
                <TechnicalDrawing title={DRAWING_LABEL} />
              </div>
            </div>
          }
        >
          <FilmCanvasLazy
            progress={progress}
            parallaxX={parallaxX}
            parallaxY={parallaxY}
            onContextLost={() => setContextLost(true)}
          />
        </Suspense>
        <FilmOverlay progress={progress} runway={runway} />
      </div>
    </section>
  )
}
