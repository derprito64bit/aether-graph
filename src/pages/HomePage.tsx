import { Head } from '../components/head/Head.tsx'
import { BuyDeck } from '../components/Configurator/BuyDeck.tsx'
import { Editorial } from '../components/Editorial.tsx'
import { VariantsTrack } from '../components/Variants/VariantsTrack.tsx'
import { Film } from '../film/Film.tsx'
import { Scrubber } from '../film/Scrubber.tsx'

/** Home route: the pencil film, the philosophy, the family, the purchase. */
export function HomePage() {
  return (
    <>
      <Head
        title="Aether Graph 0.5 — The instrument, not the accessory."
        description="A fictional precision drafting pencil. Scroll-driven 3D film, honest specs, no third-party requests."
        path="/"
      />
      <Film />
      <Editorial />
      <VariantsTrack />
      <BuyDeck />
      {import.meta.env.DEV ? <Scrubber /> : null}
    </>
  )
}
