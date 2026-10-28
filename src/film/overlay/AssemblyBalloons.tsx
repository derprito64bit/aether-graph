import type { MotionValue } from 'motion/react'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { TEARDOWN_LAYERS, cursorAt } from '../teardown/layers.ts'
import { calloutBridge } from './callouts.ts'

/**
 * Drafting balloons for the exploded assembly: a numbered circle per part on
 * a leader line, the numbering matching the parts list. The director writes
 * each part's leader landing point and stand-off direction into the bridge;
 * this layer projects them every animation frame and writes transforms and
 * line ends straight to the DOM. No React state per frame.
 */
export function AssemblyBalloons({ progress }: { progress: MotionValue<number> }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const balloonRefs = useRef<Array<HTMLDivElement | null>>([])
  const lineRefs = useRef<Array<SVGLineElement | null>>([])
  const dotRefs = useRef<Array<SVGCircleElement | null>>([])

  useEffect(() => {
    const root = rootRef.current
    if (root === null) return
    const anchor = new THREE.Vector3()
    const off = new THREE.Vector3()
    let raf = 0
    let width = root.clientWidth
    let height = root.clientHeight
    const resize = new ResizeObserver(() => {
      width = root.clientWidth
      height = root.clientHeight
    })
    resize.observe(root)
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const camera = calloutBridge.camera
      const opacity = calloutBridge.balloonOpacity
      root.style.opacity = String(opacity)
      if (camera === null || opacity < 0.01) return
      const compact = width < 700
      const standOff = compact ? 34 : 54
      const radius = compact ? 10 : 13
      const c = cursorAt(progress.get())
      const featured = c > 0.02 && c < 9.98 ? Math.min(9, Math.floor(c)) : -1
      for (const layer of TEARDOWN_LAYERS) {
        const slot = calloutBridge.balloons[layer.id]
        const balloon = balloonRefs.current[layer.index]
        const line = lineRefs.current[layer.index]
        const dot = dotRefs.current[layer.index]
        if (slot === undefined || balloon === null || balloon === undefined) continue
        anchor.copy(slot.anchor).project(camera)
        const ax = ((anchor.x + 1) / 2) * width
        const ay = ((1 - anchor.y) / 2) * height
        off.copy(slot.anchor).addScaledVector(slot.away, 0.01).project(camera)
        let dx = ((off.x + 1) / 2) * width - ax
        let dy = ((1 - off.y) / 2) * height - ay
        const len = Math.hypot(dx, dy)
        if (len < 1e-3) {
          dx = 0
          dy = -1
        } else {
          dx /= len
          dy /= len
        }
        const bx = ax + dx * standOff
        const by = ay + dy * standOff
        const active = layer.index === featured
        balloon.style.transform = `translate3d(${bx - radius}px, ${by - radius}px, 0)`
        balloon.dataset.active = active ? 'true' : 'false'
        if (line !== null && line !== undefined) {
          line.setAttribute('x1', String(ax + dx * 3))
          line.setAttribute('y1', String(ay + dy * 3))
          line.setAttribute('x2', String(bx - dx * radius))
          line.setAttribute('y2', String(by - dy * radius))
          line.dataset.active = active ? 'true' : 'false'
        }
        if (dot !== null && dot !== undefined) {
          dot.setAttribute('cx', String(ax))
          dot.setAttribute('cy', String(ay))
          dot.dataset.active = active ? 'true' : 'false'
        }
      }
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      resize.disconnect()
    }
  }, [progress])

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      data-testid="assembly-balloons"
      className="assembly-balloons pointer-events-none absolute inset-0"
      style={{ opacity: 0 }}
    >
      <svg className="absolute inset-0 h-full w-full overflow-visible">
        {TEARDOWN_LAYERS.map((layer) => (
          <g key={layer.id}>
            <line
              ref={(el) => {
                lineRefs.current[layer.index] = el
              }}
              className="balloon-leader"
            />
            <circle
              ref={(el) => {
                dotRefs.current[layer.index] = el
              }}
              r={2}
              className="balloon-dot"
            />
          </g>
        ))}
      </svg>
      {TEARDOWN_LAYERS.map((layer) => (
        <div
          key={layer.id}
          ref={(el) => {
            balloonRefs.current[layer.index] = el
          }}
          className="balloon"
          data-part={layer.id}
        >
          {layer.index + 1}
        </div>
      ))}
      <style>{BALLOON_CSS}</style>
    </div>
  )
}

const BALLOON_CSS = `
.assembly-balloons .balloon {
  position: absolute; left: 0; top: 0; width: 26px; height: 26px; border-radius: 999px;
  display: grid; place-items: center;
  font-family: var(--font-mono); font-size: 11px; font-variant-numeric: tabular-nums;
  color: var(--color-ink); background: var(--color-night);
  border: 1px solid var(--color-ink);
  transition: background-color 0.3s var(--ease-out-quint), color 0.3s var(--ease-out-quint),
    border-color 0.3s var(--ease-out-quint), box-shadow 0.3s var(--ease-out-quint);
  will-change: transform;
}
.assembly-balloons .balloon[data-active='true'] {
  background: var(--color-aether-strong); color: var(--color-on-accent);
  border-color: var(--color-aether-strong);
  box-shadow: 0 0 0 4px rgba(47, 75, 214, 0.16);
}
.assembly-balloons .balloon-leader { stroke: var(--color-faint); stroke-width: 1; }
.assembly-balloons .balloon-leader[data-active='true'] { stroke: var(--color-aether); stroke-width: 1.25; }
.assembly-balloons .balloon-dot { fill: var(--color-ink); }
.assembly-balloons .balloon-dot[data-active='true'] { fill: var(--color-aether); }
@media (max-width: 699px) {
  .assembly-balloons .balloon { width: 20px; height: 20px; font-size: 10px; }
}
@media (prefers-reduced-motion: reduce) {
  .assembly-balloons .balloon { transition: none; }
}
`
