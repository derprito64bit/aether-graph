import { CheckIcon } from '@phosphor-icons/react'
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useMotionValueEvent,
} from 'motion/react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { LEAD_OPTIONS, PENCIL_FINISHES, pencilPrice } from '../../data/pencil.ts'
import { formatPrice } from '../../lib/format.ts'
import { Lettering } from '../Lettering/Lettering.tsx'
import { useWriteCue } from '../Lettering/useWriteCue.ts'
import { WrittenHeading } from '../Lettering/WrittenHeading.tsx'
import { SketchFrame } from '../Sketch/SketchFrame.tsx'
import { usePencilConfig } from '../PencilViewer/PencilConfig.tsx'
import { PencilViewer } from '../PencilViewer/PencilViewer.tsx'

/**
 * Price that rolls to its new value on change. The DOM text has one owner:
 * React renders an empty span and the motion value writes its text, so a
 * re-render mid-roll can never fight the animation for the text node.
 */
function RollingPrice({ value }: { value: number }) {
  const reduced = useReducedMotion() === true
  const ref = useRef<HTMLSpanElement>(null)
  const mv = useMotionValue(value)
  useMotionValueEvent(mv, 'change', (v) => {
    if (ref.current !== null) ref.current.textContent = formatPrice(v)
  })
  useLayoutEffect(() => {
    if (ref.current !== null) ref.current.textContent = formatPrice(mv.get())
  }, [mv])
  useEffect(() => {
    if (reduced) {
      mv.set(value)
      return
    }
    const controls = animate(mv, value, { duration: 0.45, ease: [0.22, 1, 0.36, 1] })
    return () => controls.stop()
  }, [value, mv, reduced])
  return (
    <span
      ref={ref}
      className="numeral block text-[clamp(3rem,5vw,4.25rem)]"
      data-testid="buy-price"
    />
  )
}

/** Snappy spring for selection: settles in about 300ms with a little life. */
const SELECT = { type: 'spring', stiffness: 520, damping: 34, mass: 0.8 } as const
/** Bouncier spring for the swatch pop: one visible overshoot, then still. */
const POP = { type: 'spring', stiffness: 620, damping: 13 } as const

function delta(amount: number): string {
  return amount === 0 ? 'Included' : `+${formatPrice(amount)}`
}

/**
 * Purchase deck. Finish and lead write the shared configuration (the
 * finishes section above writes it too); the live study, the price, and
 * the summary follow. The site sells nothing, and the button says so in a
 * polite live region instead of pretending.
 */
export function BuyDeck() {
  const { finish, setFinish, leadId, setLeadId } = usePencilConfig()
  const reduced = useReducedMotion() === true
  const [added, setAdded] = useState(false)
  const option = LEAD_OPTIONS.find((l) => l.id === leadId) ?? LEAD_OPTIONS[0]
  const active = PENCIL_FINISHES.find((f) => f.id === finish) ?? PENCIL_FINISHES[0]
  useEffect(() => setAdded(false), [finish, leadId])
  const [figRef, cue] = useWriteCue<HTMLDivElement>(0.3)
  if (option === undefined || active === undefined) return null
  const price = pencilPrice(finish, option.id)

  return (
    <section
      id="buy"
      tabIndex={-1}
      aria-labelledby="buy-title"
      className="mx-auto max-w-[1400px] px-4 py-24 outline-none md:px-8 md:py-32"
    >
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-7">
          <div
            ref={figRef}
            className="relative h-[52svh] lg:sticky lg:top-24 lg:h-[min(78svh,760px)]"
          >
            <div className="absolute inset-0 overflow-hidden">
              <PencilViewer
                label={`Aether Graph 0.5 in ${active.name}`}
                sharedConfig
                interactive
                className="h-full w-full"
              />
            </div>
            <SketchFrame seed={3} />
            <div className="pointer-events-none absolute top-4 left-4 md:top-6 md:left-6">
              <Lettering
                key={`${finish}-${option.id}`}
                text={`Fig. 3 · ${active.name} · ${option.label} lead`}
                size={9}
                weight={1.15}
                play={cue}
              />
            </div>
            <p className="spec-tech pointer-events-none absolute bottom-4 left-4 md:bottom-6 md:left-6">
              Drag to turn
            </p>
          </div>
        </div>
        <div className="flex flex-col lg:col-span-5 lg:py-4">
          <WrittenHeading id="buy-title" className="spec-num display-lg" text="Make it yours." />
          <p className="mt-4 max-w-md text-(--color-dim)">
            Choose the shell and the lead. The mechanism inside is the same brass clutch in every
            one.
          </p>

          <fieldset className="mt-10">
            <legend className="text-sm font-medium">Finish</legend>
            <div className="mt-3 grid grid-cols-2 gap-2" role="group" aria-label="Choose a finish">
              {PENCIL_FINISHES.map((f) => {
                const on = finish === f.id
                return (
                  // The chosen tile pops out of the grid: it lifts, grows a
                  // touch, and casts a shadow; a cobalt ring glides to it
                  // from the last choice and its swatch springs.
                  <motion.button
                    key={f.id}
                    type="button"
                    onClick={() => setFinish(f.id)}
                    aria-pressed={on}
                    data-testid={`finish-${f.id}`}
                    data-active={on}
                    animate={reduced ? undefined : { y: on ? -4 : 0, scale: on ? 1.025 : 1 }}
                    whileHover={reduced || on ? undefined : { y: -2 }}
                    whileTap={reduced ? undefined : { scale: 0.97 }}
                    transition={SELECT}
                    className="relative flex items-center gap-3 rounded-lg border border-(--color-border-hairline) bg-(--color-night) p-3 text-left transition-[box-shadow,background-color,border-color] duration-300 hover:border-(--color-rule) data-[active=true]:border-transparent data-[active=true]:bg-(--color-surface) data-[active=true]:shadow-[0_14px_30px_-16px_rgba(17,19,22,0.5)]"
                  >
                    {on ? (
                      <motion.span
                        layoutId={reduced ? undefined : 'finish-ring'}
                        transition={SELECT}
                        aria-hidden="true"
                        className="pointer-events-none absolute -inset-px rounded-lg border-2 border-(--color-aether-strong)"
                      />
                    ) : null}
                    <motion.span
                      key={on ? 'on' : 'off'}
                      aria-hidden="true"
                      initial={on && !reduced ? { scale: 0.62 } : false}
                      animate={{ scale: 1 }}
                      transition={POP}
                      className="swatch size-8 shrink-0 rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
                      style={{ background: f.swatch }}
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{f.name}</span>
                      <span className="spec-tech block">{delta(f.priceDelta)}</span>
                    </span>
                  </motion.button>
                )
              })}
            </div>
            <p className="mt-3 text-sm text-(--color-dim)" data-testid="finish-name">
              {active.name}: {active.tagline}
            </p>
          </fieldset>

          <fieldset className="mt-8">
            <legend className="text-sm font-medium">Lead</legend>
            <div
              className="mt-3 grid grid-cols-2 gap-1 rounded-full bg-(--color-surface) p-1"
              role="group"
              aria-label="Choose a lead diameter"
            >
              {LEAD_OPTIONS.map((l) => {
                const on = leadId === l.id
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setLeadId(l.id)}
                    aria-pressed={on}
                    data-testid={`lead-${l.id}`}
                    data-active={on}
                    className="relative min-h-11 rounded-full px-4 text-sm text-(--color-dim) transition-colors data-[active=true]:text-(--color-ink)"
                  >
                    {/* The pill slides under the chosen size. */}
                    {on ? (
                      <motion.span
                        layoutId={reduced ? undefined : 'lead-pill'}
                        transition={SELECT}
                        aria-hidden="true"
                        className="absolute inset-0 rounded-full bg-(--color-night) shadow-[0_1px_2px_rgba(17,19,22,0.12),0_4px_12px_-6px_rgba(17,19,22,0.25)]"
                      />
                    ) : null}
                    <span className="relative">
                      {l.label}
                      <span className="sr-only">, grades {l.grades}</span>
                    </span>
                  </button>
                )
              })}
            </div>
            <p className="spec-tech mt-3">Grades {option.grades}</p>
          </fieldset>

          <div className="mt-10 border-t border-(--color-border-hairline) pt-8">
            <div className="flex items-end justify-between gap-6">
              <div>
                <p className="text-sm text-(--color-dim)">
                  {active.name}, {option.label} lead
                </p>
                <RollingPrice value={price} />
              </div>
            </div>
            <motion.button
              type="button"
              className="btn btn-primary relative mt-6 w-full overflow-hidden data-[added=true]:bg-(--color-ink)"
              onClick={() => setAdded(true)}
              data-testid="add-to-bag"
              data-added={added}
              whileTap={reduced ? undefined : { scale: 0.98 }}
            >
              {/* The label rolls up and a check springs in when it is added. */}
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={added ? 'added' : 'add'}
                  className="inline-flex items-center gap-2"
                  initial={reduced ? false : { y: 18, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={reduced ? { opacity: 0 } : { y: -18, opacity: 0 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                >
                  {added ? (
                    <>
                      <motion.span
                        initial={reduced ? false : { scale: 0, rotate: -30 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ ...POP, delay: 0.06 }}
                        className="inline-flex"
                      >
                        <CheckIcon size={18} weight="bold" aria-hidden="true" />
                      </motion.span>
                      Added
                    </>
                  ) : (
                    'Add to bag'
                  )}
                </motion.span>
              </AnimatePresence>
            </motion.button>
            <p
              className="mt-3 min-h-[3rem] text-sm text-(--color-dim)"
              role="status"
              aria-live="polite"
            >
              {added
                ? `${active.name}, ${option.label}, ${formatPrice(price)}. This is a concept product, so checkout ends here.`
                : 'Concept product. Nothing on this site is for sale.'}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
