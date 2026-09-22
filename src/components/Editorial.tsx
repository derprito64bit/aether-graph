import { PENCIL } from '../data/pencil.ts'

const BEATS = [
  {
    index: '01',
    kicker: 'Balance',
    headline: 'Heavy where the work happens.',
    body: `Twenty-two grams biased toward the point. The pencil presses itself into the line; your hand only steers.`,
    figure: `${PENCIL.weightG} g · tip-forward`,
  },
  {
    index: '02',
    kicker: 'Tolerance',
    headline: 'The lead cannot wander.',
    body: `Three brass jaws close to five hundredths of a millimetre. Wobble is not reduced. It is absent.`,
    figure: `${PENCIL.clutchToleranceMm} mm clutch`,
  },
  {
    index: '03',
    kicker: 'Grip',
    headline: 'Cut to hold still.',
    body: `A true diamond knurl at four-tenths pitch, bead-blasted between the teeth. Sweat, graphite, and hurry stay out of the story.`,
    figure: `${PENCIL.knurlPitchMm} mm knurl`,
  },
]

/**
 * Industrial-design interlude. The film rests; sparse editorial carries
 * one idea at a time. No cards, no chrome, no motion beyond the read.
 */
export function Editorial() {
  return (
    <section
      aria-label="Design philosophy"
      id="craft"
      className="mx-auto max-w-6xl px-4 py-24 md:py-36"
    >
      <p className="kicker">Philosophy</p>
      <h2 className="spec-num mt-3 max-w-3xl text-4xl md:text-6xl">Why it looks like this.</h2>
      <div className="mt-16 md:mt-24">
        {BEATS.map((beat) => (
          <article
            key={beat.index}
            className="grid gap-4 border-t border-(--color-border-hairline) py-12 md:grid-cols-12 md:gap-8 md:py-16"
          >
            <p className="spec-tech md:col-span-2">{beat.index}</p>
            <div className="md:col-span-6">
              <p className="kicker">{beat.kicker}</p>
              <h3 className="spec-num mt-3 text-3xl md:text-5xl">{beat.headline}</h3>
              <p className="mt-4 max-w-xl leading-relaxed text-(--color-dim)">{beat.body}</p>
            </div>
            <p className="spec-tech self-end md:col-span-4 md:text-right">{beat.figure}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
