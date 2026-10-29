import { Lettering } from '../Lettering/Lettering.tsx'
import { useWriteCue } from '../Lettering/useWriteCue.ts'
import { SketchFrame } from '../Sketch/SketchFrame.tsx'
import { useEffect, useRef, useState } from 'react'
import { PENCIL_FINISHES, pencilPrice, type PencilFinishId } from '../../data/pencil.ts'
import { formatPrice } from '../../lib/format.ts'
import { WrittenHeading } from '../Lettering/WrittenHeading.tsx'
import { scrollToElement } from '../../scroll/smooth.ts'
import { usePencilConfig } from '../PencilViewer/PencilConfig.tsx'
import { PencilViewer } from '../PencilViewer/PencilViewer.tsx'

/**
 * The four finishes. One sticky 3D study on the left; the finishes scroll
 * past on the right and the study takes on whichever sits at the centre of
 * the viewport, one finish per step (never a continuous scrub, never a
 * wheel hijack). Choosing a finish writes the shared configuration and
 * carries the visitor to the purchase deck.
 */
export function FinishesSection() {
  const { setFinish } = usePencilConfig()
  const [active, setActive] = useState<PencilFinishId>(PENCIL_FINISHES[0]?.id ?? 'graphite')
  const panels = useRef<Array<HTMLElement | null>>([])
  const [studyRef, cue] = useWriteCue<HTMLDivElement>(0.3)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const id = (entry.target as HTMLElement).dataset.finish as PencilFinishId | undefined
          if (id !== undefined) setActive(id)
        }
      },
      { rootMargin: '-45% 0px -45% 0px' },
    )
    for (const el of panels.current) if (el !== null) observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const choose = (id: PencilFinishId) => {
    setFinish(id)
    const buy = document.getElementById('buy')
    if (buy === null) return
    scrollToElement(buy)
    buy.focus({ preventScroll: true })
  }

  const current = PENCIL_FINISHES.find((f) => f.id === active) ?? PENCIL_FINISHES[0]
  return (
    <section id="finishes" aria-labelledby="finishes-title" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-[1400px] px-4 md:px-8">
        <WrittenHeading
          id="finishes-title"
          className="spec-num display-lg max-w-3xl"
          text="Four finishes. One mechanism."
        />
        <p className="mt-4 max-w-xl text-lg text-(--color-dim)">
          Every shell carries the same brass clutch inside. Only the metal you hold changes.
        </p>
      </div>
      <div className="mx-auto mt-10 grid max-w-[1400px] md:mt-16 md:grid-cols-12 md:gap-8 md:px-8">
        <div className="sticky top-[calc(var(--nav-h)+0.5rem)] z-10 h-[44svh] bg-(--color-night) md:top-24 md:col-span-7 md:h-[calc(100svh-8rem)] md:bg-transparent">
          <div ref={studyRef} className="relative h-full">
            <div className="absolute inset-0 overflow-hidden">
              <PencilViewer
                finish={active}
                label={`Aether Graph 0.5 in ${current?.name ?? 'Graphite'}`}
                className="h-full w-full"
                interactive
              />
            </div>
            <SketchFrame seed={2} className="hidden md:block" />
            <div className="pointer-events-none absolute top-4 left-4 md:top-6 md:left-6">
              <Lettering text="Fig. 2 · Finish study" size={9} weight={1.15} play={cue} />
            </div>
            <div className="pointer-events-none absolute bottom-4 left-4 md:bottom-6 md:left-6">
              <Lettering
                key={active}
                text={`${current?.name ?? ''} · drag to turn`}
                size={10}
                weight={1.1}
                play={cue}
                delay={cue ? 0.1 : 0.6}
              />
            </div>
          </div>
        </div>
        <ol className="px-4 md:col-span-5 md:px-0">
          {PENCIL_FINISHES.map((finish, i) => {
            const isActive = finish.id === active
            return (
              <li
                key={finish.id}
                ref={(el) => {
                  panels.current[i] = el
                }}
                data-finish={finish.id}
                data-active={isActive}
                data-testid={`finish-panel-${finish.id}`}
                className="group flex min-h-[62svh] flex-col justify-center border-l-2 border-transparent py-10 pl-5 transition-colors duration-500 data-[active=true]:border-(--color-aether) md:min-h-[78svh] md:pl-8"
              >
                <span
                  aria-hidden="true"
                  className="swatch block size-10 rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_6px_16px_-6px_rgba(17,19,22,0.45)]"
                  style={{ background: finish.swatch }}
                />
                <h3 className="spec-num mt-6 text-[clamp(3rem,6vw,5.5rem)] text-(--color-faint) transition-colors duration-500 group-data-[active=true]:text-(--color-ink)">
                  {finish.name}
                </h3>
                <p className="mt-3 text-lg">{finish.tagline}</p>
                <p className="mt-2 max-w-sm leading-relaxed text-(--color-dim)">
                  {finish.description}
                </p>
                <div className="mt-8 flex items-center gap-5">
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => choose(finish.id)}
                    data-testid={`choose-${finish.id}`}
                  >
                    Choose {finish.name}
                  </button>
                  <span className="spec-tech">
                    From {formatPrice(pencilPrice(finish.id, '05'))}
                  </span>
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
