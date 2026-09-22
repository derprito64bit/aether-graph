import { Link } from 'react-router'

/** Closing call-to-action band pointing at the configurator deck. */
export function CtaBand() {
  return (
    <section aria-label="Configure your Aether One X" className="mx-auto max-w-6xl px-4 py-16">
      <div className="rounded-2xl border border-(--color-border-hairline) bg-(--color-surface) p-8 md:p-12">
        <p className="kicker">Configure</p>
        <h2 className="spec-num mt-2 text-4xl md:text-6xl">Make it yours.</h2>
        <p className="mt-3 max-w-xl text-(--color-dim)">
          Three finishes. Three capacities. One quiet flagship.
        </p>
        <p className="mt-6">
          <Link
            to="/#buy"
            className="rounded-full bg-(--color-aether-strong) px-5 py-2.5 text-sm font-semibold text-black"
          >
            Configure yours
          </Link>
        </p>
      </div>
    </section>
  )
}
