import { Head } from '../components/head/Head.tsx'
import { CtaBand } from '../components/layout/CtaBand.tsx'
import { PageHero } from '../components/layout/PageHero.tsx'
import { AetherOSPhone } from '../components/PhoneOS/AetherOSPhone.tsx'
import { AI_CAPABILITIES } from '../data/product.ts'
import { SOFTWARE_PRINCIPLES } from '../data/software.ts'

/** Software product page: the interactive simulator plus principles. */
export function SoftwarePage() {
  return (
    <>
      <Head
        title="Software — Aether One X"
        description="Fictional AetherOS. On-device intelligence."
        path="/software"
      />
      <PageHero
        kicker="Software"
        title="Quiet software."
        lede="AetherOS with on-device intelligence. Nothing leaves the phone."
      />
      <AetherOSPhone />
      <section aria-label="Software principles" className="mx-auto max-w-6xl px-4 pb-4">
        <div className="grid gap-4 md:grid-cols-3">
          {SOFTWARE_PRINCIPLES.map((p) => (
            <article
              key={p.title}
              className="rounded-2xl border border-(--color-border-hairline) bg-(--color-surface) p-5"
            >
              <h2 className="spec-num text-xl">{p.title}</h2>
              <p className="mt-2 text-sm text-(--color-dim)">{p.body}</p>
            </article>
          ))}
        </div>
      </section>
      <section aria-label="On-device capabilities" className="mx-auto max-w-6xl px-4 pb-4">
        <ul className="grid gap-2 sm:grid-cols-2">
          {AI_CAPABILITIES.map((cap) => (
            <li
              key={cap}
              className="rounded-xl border border-(--color-border-hairline) bg-(--color-surface) p-4 text-sm"
            >
              {cap}
            </li>
          ))}
        </ul>
      </section>
      <CtaBand />
    </>
  )
}
