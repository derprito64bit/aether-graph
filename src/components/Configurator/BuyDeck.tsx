import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { useEffect, useState } from 'react'
import { LEAD_OPTIONS, PENCIL_FINISHES, pencilPrice } from '../../data/pencil.ts'
import { formatPrice } from '../../lib/format.ts'
import { usePencilConfig } from '../PencilViewer/PencilConfig.tsx'
import { PencilViewer } from '../PencilViewer/PencilViewer.tsx'

/** Price that rolls to its new value on change, never through React state per frame. */
function RollingPrice({ value }: { value: number }) {
  const reduced = useReducedMotion() === true
  const mv = useMotionValue(value)
  const text = useTransform(mv, (v) => formatPrice(v))
  useEffect(() => {
    if (reduced) {
      mv.set(value)
      return
    }
    const controls = animate(mv, value, { duration: 0.45, ease: [0.22, 1, 0.36, 1] })
    return () => controls.stop()
  }, [value, mv, reduced])
  return (
    <motion.span className="numeral text-[clamp(3rem,5vw,4.25rem)]" data-testid="buy-price">
      {text}
    </motion.span>
  )
}

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
  const [added, setAdded] = useState(false)
  const option = LEAD_OPTIONS.find((l) => l.id === leadId) ?? LEAD_OPTIONS[0]
  const active = PENCIL_FINISHES.find((f) => f.id === finish) ?? PENCIL_FINISHES[0]
  useEffect(() => setAdded(false), [finish, leadId])
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
          <div className="relative h-[52svh] overflow-hidden rounded-lg bg-(--color-surface) lg:sticky lg:top-24 lg:h-[min(78svh,760px)]">
            <PencilViewer
              label={`Aether Graph 0.5 in ${active.name}`}
              sharedConfig
              interactive
              className="h-full w-full"
            />
            <p className="spec-tech pointer-events-none absolute bottom-4 left-4 md:bottom-6 md:left-6">
              Drag to turn
            </p>
          </div>
        </div>
        <div className="flex flex-col lg:col-span-5 lg:py-4">
          <h2 id="buy-title" className="spec-num display-lg">
            Make it yours.
          </h2>
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
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFinish(f.id)}
                    aria-pressed={on}
                    data-testid={`finish-${f.id}`}
                    data-active={on}
                    className="flex items-center gap-3 rounded-lg border border-(--color-border-hairline) p-3 text-left transition-colors hover:border-(--color-rule) data-[active=true]:border-(--color-ink) data-[active=true]:bg-(--color-surface)"
                  >
                    <span
                      aria-hidden="true"
                      className="size-8 shrink-0 rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
                      style={{ background: f.swatch }}
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{f.name}</span>
                      <span className="spec-tech block">{delta(f.priceDelta)}</span>
                    </span>
                  </button>
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
                    className="min-h-11 rounded-full px-4 text-sm text-(--color-dim) transition-colors data-[active=true]:bg-(--color-night) data-[active=true]:text-(--color-ink) data-[active=true]:shadow-[0_1px_2px_rgba(17,19,22,0.12)]"
                  >
                    {l.label}
                    <span className="sr-only">, grades {l.grades}</span>
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
            <button
              type="button"
              className="btn btn-primary mt-6 w-full"
              onClick={() => setAdded(true)}
              data-testid="add-to-bag"
            >
              Add to bag
            </button>
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
