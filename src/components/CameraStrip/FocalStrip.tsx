import { FOCAL_LENGTHS } from '../../data/product.ts'
import { usePhoneConfig, type FocusLensId } from '../PhoneViewer/PhoneConfig.tsx'

const FOCAL_TO_LENS: Record<string, FocusLensId> = {
  '0.5x': 'ultra',
  '1x': 'main',
  '2x': 'mid',
  '5x': 'periscope',
  '10x': 'periscope',
}

/**
 * Focal-length strip. Selecting a length re-focuses the matching 3D lens
 * through shared phone config; 2x notes the sensor crop, 10x the hybrid.
 */
export function FocalStrip({ onZoom }: { onZoom?: (zoom: string) => void }) {
  const { focusLens, setFocusLens } = usePhoneConfig()
  return (
    <section aria-label="Focal lengths" className="mx-auto max-w-6xl px-4 py-12">
      <div role="group" aria-label="Choose a focal length" className="flex flex-wrap gap-2">
        {FOCAL_LENGTHS.map((f) => {
          const active = FOCAL_TO_LENS[f.zoom] === focusLens
          return (
            <button
              key={f.zoom}
              type="button"
              onClick={() => {
                const lens = FOCAL_TO_LENS[f.zoom]
                if (lens !== undefined) setFocusLens(lens)
                onZoom?.(f.zoom)
              }}
              aria-pressed={active}
              data-testid={`focal-${f.zoom}`}
              data-active={active}
              className="min-h-11 rounded-full border border-(--color-border-hairline) px-5 text-sm text-(--color-dim) data-[active=true]:bg-(--color-elev) data-[active=true]:text-(--color-ink)"
            >
              {f.zoom} · {f.note}
            </button>
          )
        })}
      </div>
      <p className="spec-tech mt-4" data-testid="focal-detail">
        Focused lens: {focusLens}. 2x is the 50mm mid lens; 10x is a hybrid of the 135mm periscope.
      </p>
    </section>
  )
}
