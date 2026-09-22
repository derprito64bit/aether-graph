import { PENCIL_FINISHES, type PencilFinishId } from '../../data/pencil.ts'

interface PencilFrameProps {
  finish?: PencilFinishId
  label: string
}

/**
 * Body gradients for the static silhouette. Lifted from the swatch chips
 * (which go near-black mid-gradient and would vanish on the dark page).
 */
const FRAME_BODY: Record<PencilFinishId, string> = {
  graphite: 'linear-gradient(180deg,#5a5e66 0%,#2a2d33 60%,#43464d 100%)',
  steel: 'linear-gradient(180deg,#ffffff 0%,#9ba0ab 60%,#6a6f78 100%)',
  brass: 'linear-gradient(180deg,#f0cd8a 0%,#8a6a34 60%,#a8874e 100%)',
  ember: 'linear-gradient(180deg,#e8a06a 0%,#4a2e1a 60%,#8a5636 100%)',
}

/**
 * Static CSS pencil for no-WebGL, reduced-motion, and pre-hydration states.
 * A horizontal silhouette: lead point, steel sleeve, cone, barrel, cap.
 */
export function PencilFrame({ finish = 'graphite', label }: PencilFrameProps) {
  const active = PENCIL_FINISHES.find((f) => f.id === finish) ?? PENCIL_FINISHES[0]
  if (active === undefined) return null
  return (
    <div role="img" aria-label={label} className="flex items-center" data-testid="pencil-frame">
      <div
        aria-hidden="true"
        className="h-2 w-3 bg-[#2b2b2e]"
        style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 50%)' }}
      />
      <div aria-hidden="true" className="h-2.5 w-4 bg-gradient-to-b from-[#e8ebef] to-[#8b9098]" />
      <div
        aria-hidden="true"
        className="h-4 w-8 bg-[#1b1b1e]"
        style={{ clipPath: 'polygon(0 28%, 100% 0, 100% 100%, 0 72%)' }}
      />
      <div
        aria-hidden="true"
        className="h-5 w-44 rounded-r-sm md:w-56"
        style={{ background: FRAME_BODY[finish] }}
      />
      <div aria-hidden="true" className="h-5 w-5 rounded-r-full bg-[#c8ccd2]" />
    </div>
  )
}
