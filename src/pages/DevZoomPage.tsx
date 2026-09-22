import { useMotionValueEvent, useScroll, type MotionValue } from 'motion/react'
import { useRef, useState } from 'react'
import { matchCutOpacity, pinnedScale, revealScale } from '../zoom/zoom.ts'

/**
 * Dev-only zoom module demo. Excluded from production by the DEV guard in
 * App. Each module scrubs via MotionValues with transform and opacity only.
 */
export function DevZoomPage() {
  const pinnedRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress: pinned } = useScroll({
    target: pinnedRef,
    offset: ['start end', 'end start'],
  })
  const revealRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress: reveal } = useScroll({
    target: revealRef,
    offset: ['start end', 'start start'],
  })

  return (
    <main className="mx-auto max-w-6xl px-4 py-16">
      <p className="kicker">Dev</p>
      <h1 className="spec-num mt-3 text-5xl">Zoom modules</h1>

      <section aria-label="Pinned zoom demo" className="py-16">
        <div
          ref={pinnedRef}
          data-testid="zoom-pinned"
          className="sticky top-24 mx-auto h-64 w-64 overflow-hidden rounded-2xl border border-(--color-border-hairline)"
        >
          <PinnedBox progress={pinned} />
        </div>
        <div style={{ height: '120vh' }} />
      </section>

      <section aria-label="Reveal zoom demo" className="py-16">
        <div ref={revealRef} data-testid="zoom-reveal" className="mx-auto w-64">
          <RevealBox progress={reveal} />
        </div>
      </section>

      <section aria-label="Match cut demo" className="py-16">
        <MatchCut />
      </section>
    </main>
  )
}

function PinnedBox({ progress }: { progress: MotionValue<number> }) {
  const [scale, setScale] = useState(1)
  useMotionValueEvent(progress, 'change', (v) => {
    setScale(pinnedScale(typeof v === 'number' ? v : 0, 0.25, 0.75, 3))
  })
  return (
    <div
      data-testid="zoom-pinned-box"
      data-scale={scale.toFixed(2)}
      className="h-full w-full bg-(--color-elev) will-change-transform"
      style={{ transform: `scale(${scale})` }}
    />
  )
}

function RevealBox({ progress }: { progress: MotionValue<number> }) {
  const [scale, setScale] = useState(1)
  useMotionValueEvent(progress, 'change', (v) => {
    setScale(revealScale(typeof v === 'number' ? v : 0))
  })
  return (
    <div
      data-testid="zoom-reveal-box"
      data-scale={scale.toFixed(3)}
      className="h-40 rounded-2xl border border-(--color-border-hairline) bg-(--color-surface)"
      style={{ transform: `scale(${scale})` }}
    />
  )
}

function MatchCut() {
  const [ratio, setRatio] = useState(1)
  const { a, b } = matchCutOpacity(ratio)
  return (
    <div data-testid="zoom-matchcut">
      <input
        type="range"
        min={1}
        max={8}
        step={0.1}
        value={ratio}
        onChange={(e) => setRatio(Number.parseFloat(e.target.value))}
        aria-label="Match cut scale ratio"
      />
      <div className="relative h-40">
        <div
          data-testid="zoom-matchcut-a"
          data-opacity={a.toFixed(2)}
          className="absolute inset-0 bg-(--color-elev)"
          style={{ opacity: a, transform: `scale(${ratio})` }}
        />
        <div
          data-testid="zoom-matchcut-b"
          data-opacity={b.toFixed(2)}
          className="absolute inset-0 bg-(--color-raise)"
          style={{ opacity: b, transform: `scale(${Math.max(0.05, ratio / 8)})` }}
        />
      </div>
    </div>
  )
}
