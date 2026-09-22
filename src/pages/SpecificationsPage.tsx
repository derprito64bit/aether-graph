import { Head } from '../components/head/Head.tsx'
import { ProductJsonLd } from '../components/head/ProductJsonLd.tsx'
import { PageHero } from '../components/layout/PageHero.tsx'
import { CONCEPT_NOTICE, SPEC_CATEGORIES } from '../data/product.ts'

/** Specifications page: every category expanded, disclaimer included. */
export function SpecificationsPage() {
  return (
    <>
      <Head
        title="Specifications — Aether One X"
        description="Every fictional spec, expanded."
        path="/specifications"
        image="/og/specifications.svg"
      />
      <ProductJsonLd />
      <PageHero
        kicker="Specifications"
        title="Nothing hidden."
        lede="Every category expanded. All values illustrative."
      />
      <div className="mx-auto max-w-6xl px-4 pb-8">
        {SPEC_CATEGORIES.map((category) => (
          <section
            key={category.label}
            aria-label={category.label}
            className="border-t border-(--color-border-hairline) py-6"
          >
            <h2 className="kicker">{category.label}</h2>
            <dl className="mt-3 grid gap-x-8 gap-y-2 md:grid-cols-2">
              {category.rows.map((row) => (
                <div
                  key={row.label}
                  className="flex justify-between gap-4 border-b border-(--color-border-hairline) py-2 text-sm"
                >
                  <dt className="text-(--color-dim)">{row.label}</dt>
                  <dd className="text-right text-(--color-ink)">{row.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
        <section aria-label="Fiction disclaimer" className="py-8">
          <p className="text-sm text-(--color-dim)">{CONCEPT_NOTICE}</p>
        </section>
      </div>
    </>
  )
}
