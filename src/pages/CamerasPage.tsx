import { useState } from 'react'
import { Head } from '../components/head/Head.tsx'
import { CtaBand } from '../components/layout/CtaBand.tsx'
import { PageHero } from '../components/layout/PageHero.tsx'
import { FocalStrip } from '../components/CameraStrip/FocalStrip.tsx'
import { PhoneConfigProvider } from '../components/PhoneViewer/PhoneConfig.tsx'
import { PhoneViewer } from '../components/PhoneViewer/PhoneViewer.tsx'
import { CAMERA_LENSES, FOCAL_LENGTHS } from '../data/product.ts'

/** Cameras page: focal strip, scene viewer, rear 3D study, lens legend. */
export function CamerasPage() {
  const [zoom, setZoom] = useState('1x')
  const scene = FOCAL_LENGTHS.find((f) => f.zoom === zoom) ?? FOCAL_LENGTHS[1]
  return (
    <>
      <Head
        title="Cameras — Aether One X"
        description="Fictional quad camera. Five focal lengths."
        path="/cameras"
        image="/og/cameras.svg"
      />
      <PageHero
        kicker="Cameras"
        title="Every focal length."
        lede="Main 23mm, ultra-wide 14mm, mid 50mm, and a 135mm folded periscope. Demonstration values throughout."
      />
      <PhoneConfigProvider>
        <FocalStrip onZoom={setZoom} />
        <section aria-label="Focal scene" className="mx-auto max-w-6xl px-4">
          {scene !== undefined ? (
            <figure>
              <img
                src={scene.image}
                alt={`${scene.zoom} sample scene, ${scene.note}`}
                data-testid="focal-scene"
                className="w-full rounded-2xl border border-(--color-border-hairline)"
                loading="lazy"
              />
              <figcaption className="spec-tech mt-2">
                {scene.zoom} · {scene.note} · procedural sample
              </figcaption>
            </figure>
          ) : null}
        </section>
        <PhoneViewer pose="rear" label="Aether One X rear camera study" sharedConfig />
      </PhoneConfigProvider>
      <section aria-label="Lens legend" className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="kicker">Lens legend</h2>
        <dl className="mt-4 grid gap-4 md:grid-cols-2">
          {CAMERA_LENSES.map((lens) => (
            <div
              key={lens.id}
              className="rounded-2xl border border-(--color-border-hairline) bg-(--color-surface) p-5"
            >
              <dt className="spec-num text-2xl">
                {lens.label} <span className="spec-unit">{lens.zoom}</span>
              </dt>
              <dd className="mt-2 text-sm text-(--color-dim)">{lens.detail}</dd>
              <dd className="spec-tech mt-2">
                {lens.sensor} · {lens.aperture} · {lens.stabilization}
              </dd>
            </div>
          ))}
        </dl>
      </section>
      <CtaBand />
    </>
  )
}
