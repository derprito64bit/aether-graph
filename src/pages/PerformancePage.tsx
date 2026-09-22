import { Head } from '../components/head/Head.tsx'
import { CtaBand } from '../components/layout/CtaBand.tsx'
import { PageHero } from '../components/layout/PageHero.tsx'
import { PhoneViewer } from '../components/PhoneViewer/PhoneViewer.tsx'
import { SoCPanel } from '../components/SoC/SoCPanel.tsx'

/** Performance product page: the A1 Ultra die panel plus a side study. */
export function PerformancePage() {
  return (
    <>
      <Head
        title="Performance — Aether One X"
        description="Fictional A1 Ultra die. CPU, GPU, NPU."
        path="/performance"
        image="/og/performance.svg"
      />
      <PageHero
        kicker="Performance"
        title="A1 Ultra."
        lede="Eight cores, fourteen GPU cores, on-device inference. Demonstration figures."
      />
      <SoCPanel />
      <PhoneViewer pose="side" label="Aether One X side profile study" />
      <CtaBand />
    </>
  )
}
