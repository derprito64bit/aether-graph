import { Head } from '../components/head/Head.tsx'
import { AutopilotControl } from '../components/Autopilot/AutopilotControl.tsx'
import { BuyDeck } from '../components/Configurator/BuyDeck.tsx'
import { CraftSection } from '../components/Craft/CraftSection.tsx'
import { FinishesSection } from '../components/Finishes/FinishesSection.tsx'
import { Film } from '../film/Film.tsx'
import { Scrubber } from '../film/Scrubber.tsx'
import { PencilRule } from '../components/Sketch/SketchFrame.tsx'

/** A pencil rule with its scale between two sections of the sheet. */
function SectionRule({ seed }: { seed: number }) {
  return (
    <div className="mx-auto max-w-[1400px] px-4 md:px-8">
      <PencilRule seed={seed} />
    </div>
  )
}

/**
 * Home route: the film, the drawing, the finishes, the purchase. The
 * configuration they share lives at the app root (the nav shows it too).
 */
export function HomePage() {
  return (
    <>
      <Head
        title="Aether Graph 0.5: the instrument, not the accessory"
        description="A fictional precision drafting pencil, drawn and then rendered live in 3D. Scroll-driven product film, honest specs, no third-party requests."
        path="/"
      />
      <Film />
      <CraftSection />
      <SectionRule seed={5} />
      <FinishesSection />
      <SectionRule seed={6} />
      <BuyDeck />
      <AutopilotControl />
      {import.meta.env.DEV ? <Scrubber /> : null}
    </>
  )
}
