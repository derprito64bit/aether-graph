import { useEffect, useRef, useState } from 'react'
import { DISPLAY } from '../../data/product.ts'

/**
 * Interactive 1-to-144 Hz demo. A dot crosses the rail once per simulated
 * frame: at 1 Hz it jumps, at 144 Hz it glides. Quantized in rAF, never in
 * state per frame. Reduced motion renders the readout statically.
 */
export function DisplayDemo() {
  const [hz, setHz] = useState(120)
  const [phase, setPhase] = useState(0)
  const track = useRef<HTMLDivElement>(null)
  const reduced =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    if (reduced) return
    let frame = 0
    let last = performance.now()
    let acc = 0
    const loop = (now: number) => {
      frame = requestAnimationFrame(loop)
      acc += (now - last) / 1000
      last = now
      const period = 1 / hz
      if (acc >= period) {
        acc = 0
        setPhase((p) => (p + 1 / Math.max(1, Math.round(hz / 60))) % 1)
      }
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [hz, reduced])

  const frameMs = 1000 / hz
  return (
    <section aria-label="Refresh rate demo" className="mx-auto max-w-6xl px-4 py-12">
      <p className="kicker">ProMotion-class, without the name</p>
      <h2 className="spec-num mt-3 text-4xl md:text-6xl">1 to 144 Hz.</h2>
      <p className="mt-3 max-w-xl text-(--color-dim)">
        Drag the rate. The dot crosses once per frame: watch it jump at 1 Hz and glide at 144 Hz.
      </p>
      <div
        ref={track}
        data-testid="hz-rail"
        className="relative mt-8 h-16 overflow-hidden rounded-2xl border border-(--color-border-hairline) bg-(--color-surface)"
      >
        <div
          data-testid="hz-dot"
          className="absolute top-1/2 h-4 w-4 rounded-full bg-(--color-aether)"
          style={{
            left: `calc(${(phase * 100).toFixed(1)}% - 8px)`,
            transform: 'translateY(-50%)',
          }}
        />
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <label htmlFor="hz-slider" className="spec-tech">
          Refresh rate
        </label>
        <input
          id="hz-slider"
          type="range"
          min={DISPLAY.refreshMin}
          max={DISPLAY.refreshMax}
          value={hz}
          onChange={(e) => setHz(Number.parseInt(e.target.value, 10))}
          aria-valuetext={`${hz} hertz`}
          className="w-64"
        />
        <p className="spec-num text-3xl" data-testid="hz-readout">
          {hz}
          <span className="spec-unit ml-2">Hz · {frameMs.toFixed(1)} ms</span>
        </p>
      </div>
      <p className="spec-tech mt-4">
        {DISPLAY.size} LTPO OLED · {DISPLAY.resolution} · {DISPLAY.peakNits} nits peak ·{' '}
        {DISPLAY.pwm} Hz dimming
      </p>
    </section>
  )
}
