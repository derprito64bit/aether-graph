import { Head } from '../components/head/Head.tsx'
import { BuyDeck } from '../components/Configurator/BuyDeck.tsx'
import { CraftSection } from '../components/Craft/CraftSection.tsx'
import { FinishesSection } from '../components/Finishes/FinishesSection.tsx'
import { PencilConfigProvider } from '../components/PencilViewer/PencilConfig.tsx'
import { Film } from '../film/Film.tsx'
import { Scrubber } from '../film/Scrubber.tsx'

/**
 * Home route: the film, the drawing, the finishes, the purchase. One
 * configuration is shared by the finishes and the purchase deck.
 */
export function HomePage() {
  return (
    <PencilConfigProvider>
      <Head
        title="Aether Graph 0.5: the instrument, not the accessory"
        description="A fictional precision drafting pencil, drawn and then rendered live in 3D. Scroll-driven product film, honest specs, no third-party requests."
        path="/"
      />
      <Film />
      <CraftSection />
      <FinishesSection />
      <BuyDeck />
      {import.meta.env.DEV ? <Scrubber /> : null}
    </PencilConfigProvider>
  )
}
