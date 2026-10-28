import { TechnicalDrawing, type DrawingFocus } from '../components/Drawing/TechnicalDrawing.tsx'
import { Glass, type GlassVariant } from '../components/Glass/Glass.tsx'
import { PencilFrame } from '../components/PencilViewer/PencilFrame.tsx'
import { PencilViewer } from '../components/PencilViewer/PencilViewer.tsx'
import { Reveal } from '../components/ui/Reveal.tsx'
import { PENCIL_FINISHES } from '../data/pencil.ts'

const GLASS_VARIANTS: GlassVariant[] = ['chrome', 'panel', 'tooltip', 'control']
const FOCI: DrawingFocus[] = [null, 'balance', 'tolerance', 'grip']

/**
 * Dev-only kitchen sink (meta prompt section 8.8): every shared component
 * in its key states on one page. DEV-guarded at the route so it never
 * ships to production.
 */
export function KitchenSinkPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 pt-32 pb-16 md:px-8">
      <h1 className="spec-num display-lg">Kitchen sink</h1>

      <h2 className="spec-num display-md mt-16">Type</h2>
      <p className="spec-num display-xl mt-6">Display XL</p>
      <p className="spec-num display-lg">Display LG</p>
      <p className="spec-num display-md">Display MD</p>
      <p className="numeral mt-4 text-8xl">0.05</p>
      <p className="kicker mt-4">Kicker</p>
      <p className="spec-tech">Technical figure 0.4 mm</p>

      <h2 className="spec-num display-md mt-16">Buttons</h2>
      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" className="btn btn-primary">
          Primary
        </button>
        <button type="button" className="btn btn-ink">
          Ink
        </button>
        <button type="button" className="btn btn-ghost">
          Ghost
        </button>
      </div>

      <h2 className="spec-num display-md mt-16">Glass</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        {GLASS_VARIANTS.map((variant) => (
          <Glass key={variant} variant={variant} label={`Glass ${variant}`}>
            <p className="px-5 py-4 text-sm">{variant}</p>
          </Glass>
        ))}
      </div>

      <h2 className="spec-num display-md mt-16">Drawing focus</h2>
      <div className="mt-6 grid gap-8">
        {FOCI.map((focus) => (
          <TechnicalDrawing
            key={focus ?? 'none'}
            focus={focus}
            title={`Drawing, focus ${focus ?? 'none'}`}
          />
        ))}
      </div>

      <h2 className="spec-num display-md mt-16">Static frames</h2>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {PENCIL_FINISHES.map((f) => (
          <PencilFrame key={f.id} finish={f.id} label={`${f.name} static frame`} />
        ))}
      </div>

      <h2 className="spec-num display-md mt-16">Viewer</h2>
      <Reveal>
        <PencilViewer
          label="Kitchen sink viewer"
          finish="brass"
          interactive
          className="mt-6 h-[480px] rounded-lg bg-(--color-surface)"
        />
      </Reveal>
    </div>
  )
}
