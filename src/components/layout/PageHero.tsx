interface PageHeroProps {
  kicker: string
  title: string
  lede: string
}

/** Editorial page hero shared by all product pages. One h1 per route. */
export function PageHero({ kicker, title, lede }: PageHeroProps) {
  return (
    <section aria-label={`${title} introduction`} className="mx-auto max-w-6xl px-4 pt-16 pb-10">
      <p className="kicker">{kicker}</p>
      <h1 className="spec-num mt-3 text-5xl md:text-7xl">{title}</h1>
      <p className="mt-4 max-w-2xl text-base text-(--color-dim)">{lede}</p>
    </section>
  )
}
