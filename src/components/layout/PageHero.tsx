import { WrittenHeading } from '../Lettering/WrittenHeading.tsx'

interface PageHeroProps {
  title: string
  lede: string
}

/** Editorial page hero for secondary routes. One h1 per route, clear of the fixed nav. */
export function PageHero({ title, lede }: PageHeroProps) {
  return (
    <section
      aria-label={`${title} introduction`}
      className="mx-auto max-w-[1400px] px-4 pt-32 pb-10 md:px-8 md:pt-40"
    >
      <WrittenHeading as="h1" className="spec-num display-xl max-w-4xl" text={title} />
      <p className="mt-5 max-w-xl text-lg text-(--color-dim)">{lede}</p>
    </section>
  )
}
