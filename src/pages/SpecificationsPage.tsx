import { TechnicalDrawing } from '../components/Drawing/TechnicalDrawing.tsx'
import { Head } from '../components/head/Head.tsx'
import { ProductJsonLd } from '../components/head/ProductJsonLd.tsx'
import { PageHero } from '../components/layout/PageHero.tsx'
import {
  CONCEPT_NOTICE,
  PENCIL,
  PENCIL_FINISHES,
  SPEC_GROUPS,
  SPEC_HIGHLIGHTS,
  pencilPrice,
} from '../data/pencil.ts'
import { useInView } from 'motion/react'
import { useRef } from 'react'
import { useCountUp } from '../hooks/useCountUp.ts'
import { formatCount, formatPrice } from '../lib/format.ts'

/** Headline figure that counts up once, the first time it scrolls into view. */
function CountUp({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.6 })
  const target = Number(value)
  const shown = useCountUp(target, inView, 900)
  return (
    <span ref={ref} className="numeral text-[clamp(2.75rem,6vw,5rem)]">
      <span className="sr-only">{value}</span>
      <span aria-hidden="true">{inView ? formatCount(shown, value) : formatCount(0, value)}</span>
    </span>
  )
}

/** Specifications: the drawing, four headline figures, then the full sheet. */
export function SpecificationsPage() {
  return (
    <>
      <Head
        title="Specifications | Aether Graph 0.5"
        description="Every dimension of the Aether Graph 0.5, a fictional precision drafting pencil. All values are illustrative."
        path="/specifications"
        image="/og/specifications.svg"
      />
      <ProductJsonLd />
      <PageHero
        title="Every dimension, on the record."
        lede={`The full sheet for the ${PENCIL.fullName}. All values are illustrative.`}
      />

      <div className="mx-auto max-w-[1400px] px-4 md:px-8">
        <figure className="rounded-lg border border-(--color-border-hairline) p-4 md:p-10">
          <TechnicalDrawing
            title={`Side elevation of the ${PENCIL.fullName} with every principal dimension.`}
          />
          <figcaption className="spec-tech mt-4">Side elevation. Dimensions in mm.</figcaption>
        </figure>

        <dl
          className="mt-16 grid grid-cols-2 border-y border-(--color-border-hairline) md:grid-cols-4"
          data-testid="spec-highlights"
        >
          {SPEC_HIGHLIGHTS.map((h, i) => (
            <div
              key={h.label}
              className={`flex flex-col-reverse gap-3 py-8 md:py-10 ${i % 2 === 1 ? 'pl-5 md:pl-8' : ''} ${
                i > 0 ? 'md:border-l md:border-(--color-border-hairline) md:pl-8' : ''
              } ${i >= 2 ? 'border-t border-(--color-border-hairline) md:border-t-0' : ''}`}
            >
              <dt className="text-sm text-(--color-dim)">{h.label}</dt>
              <dd className="flex items-end gap-2">
                <CountUp value={h.value} />
                <span className="spec-unit pb-1.5">{h.unit}</span>
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-20 grid gap-x-16 gap-y-14 md:grid-cols-2">
          {SPEC_GROUPS.map((group) => (
            <section key={group.id} aria-labelledby={`spec-${group.id}`}>
              <h2 id={`spec-${group.id}`} className="spec-num display-md">
                {group.label}
              </h2>
              <dl className="mt-5 grid gap-y-3 border-t border-(--color-border-hairline) pt-5">
                {group.rows.map((row) => (
                  <div
                    key={row.label}
                    className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4"
                  >
                    <dt className="text-(--color-dim)">{row.label}</dt>
                    <dd className="text-right">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>

        <section aria-labelledby="spec-finishes" className="mt-24">
          <h2 id="spec-finishes" className="spec-num display-md">
            Finishes
          </h2>
          <ul className="mt-6 grid gap-6 border-t border-(--color-border-hairline) pt-6 sm:grid-cols-2 lg:grid-cols-4">
            {PENCIL_FINISHES.map((f) => (
              <li key={f.id} className="flex gap-4">
                <span
                  aria-hidden="true"
                  className="swatch size-9 shrink-0 rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
                  style={{ background: f.swatch }}
                />
                <div>
                  <p className="font-medium">{f.name}</p>
                  <p className="mt-1 text-sm leading-relaxed text-(--color-dim)">{f.description}</p>
                  <p className="spec-tech mt-2">From {formatPrice(pencilPrice(f.id, '05'))}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section aria-label="Fiction disclaimer" className="mt-20 mb-24 max-w-2xl">
          <p className="text-sm leading-relaxed text-(--color-dim)">{CONCEPT_NOTICE}</p>
        </section>
      </div>
    </>
  )
}
