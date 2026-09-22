import { useCallback, useEffect, useState } from 'react'
import { actAt } from './timeline.ts'
import { sampleFilm } from './sample.ts'

function progressFromUrl(): number {
  try {
    const t = new URLSearchParams(window.location.search).get('t')
    if (t === null) return 0
    const v = Number.parseFloat(t)
    return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0
  } catch {
    return 0
  }
}

/**
 * Dev-only timeline scrubber. Toggle with the `.` key. Slider, current act,
 * live sampled pose and camera values, and a copy-this-pose-as-keyframe
 * button that writes the object literal to the clipboard. `?t=0.42` jumps.
 * Excluded from production by the DEV guard at the call site.
 */
export function Scrubber() {
  const [open, setOpen] = useState(false)
  const [progress, setProgress] = useState(progressFromUrl)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === '.') setOpen((v) => !v)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const copyKey = useCallback(async () => {
    const s = sampleFilm(progress)
    const literal = `key({
  at: ${progress.toFixed(3)},
  pose: { rx: ${s.rx.toFixed(3)}, ry: ${s.ry.toFixed(3)}, rz: ${s.rz.toFixed(3)}, scale: ${s.scale.toFixed(3)}, px: ${s.px.toFixed(4)}, py: ${s.py.toFixed(4)} },
  camera: { pos: [${s.pos.x.toFixed(4)}, ${s.pos.y.toFixed(4)}, ${s.pos.z.toFixed(4)}], target: [${s.target.x.toFixed(4)}, ${s.target.y.toFixed(4)}, ${s.target.z.toFixed(4)}] },
  lens: { fov: ${s.fov.toFixed(1)}${s.fit !== null ? `, fit: ${s.fit.toFixed(2)}` : ''} },
  look: { exposure: ${s.exposure.toFixed(2)}, glass: ${s.glass.toFixed(2)} },
}),`
    try {
      await navigator.clipboard.writeText(literal)
    } catch {
      // Clipboard unavailable; the readout below is still copyable by hand.
    }
  }, [progress])

  if (!open) return null
  const sample = sampleFilm(progress)
  const act = actAt(progress)
  return (
    <div
      role="dialog"
      aria-label="Film timeline scrubber"
      className="fixed bottom-4 left-4 z-50 w-80 rounded-xl border border-(--color-border-hairline) bg-(--color-surface) p-4 font-mono text-xs"
    >
      <p className="flex justify-between">
        <span>t = {progress.toFixed(3)}</span>
        <span>act: {act.id}</span>
      </p>
      <input
        type="range"
        min={0}
        max={1}
        step={0.001}
        value={progress}
        onChange={(e) => setProgress(Number.parseFloat(e.target.value))}
        aria-label="Film progress"
        className="mt-2 w-full"
      />
      <pre className="mt-2 overflow-x-auto whitespace-pre text-[10px] text-(--color-dim)">
        {`pos ${sample.pos.x.toFixed(3)} ${sample.pos.y.toFixed(3)} ${sample.pos.z.toFixed(3)}\ntgt ${sample.target.x.toFixed(3)} ${sample.target.y.toFixed(3)} ${sample.target.z.toFixed(3)}\npose rx ${sample.rx.toFixed(3)} ry ${sample.ry.toFixed(3)} s ${sample.scale.toFixed(2)}\nfov ${sample.fov.toFixed(1)} fit ${sample.fit === null ? 'macro' : sample.fit.toFixed(2)}`}
      </pre>
      <button
        type="button"
        onClick={() => void copyKey()}
        className="mt-2 rounded-full border border-(--color-border-hairline) px-3 py-1"
      >
        Copy pose as keyframe
      </button>
    </div>
  )
}
