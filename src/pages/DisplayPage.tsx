import { Head } from '../components/head/Head.tsx'
import { CtaBand } from '../components/layout/CtaBand.tsx'
import { PageHero } from '../components/layout/PageHero.tsx'
import { DisplayDemo } from '../components/DisplayDemo/DisplayDemo.tsx'
import { PhoneViewer } from '../components/PhoneViewer/PhoneViewer.tsx'

/** Display product page: front study plus the interactive Hz demo. */
export function DisplayPage() {
  return (
    <>
      <Head
        title="Display — Aether One X"
        description="Fictional 6.7 inch LTPO OLED, 1 to 144 Hz."
        path="/display"
        image="/og/display.svg"
      />
      <PageHero
        kicker="Display"
        title="Light, controlled."
        lede="1 to 144 Hz adaptive, 2800 nits peak. Demonstration values."
      />
      <PhoneViewer pose="front" label="Aether One X front display study" />
      <DisplayDemo />
      <CtaBand />
    </>
  )
}
