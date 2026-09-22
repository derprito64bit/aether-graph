import { useEffect, useRef } from 'react'
import type { MotionValue } from 'motion/react'
import * as THREE from 'three'
import { EXPLODE_PARTS, partProgress } from '../internals/explode.ts'
import { CALLOUTS } from '../chapters.ts'
import { computeFilmStates } from '../states.ts'
import { cursorAt } from '../teardown/layers.ts'
import { calloutBridge, layoutCallouts, type CalloutLayout } from './callouts.ts'

const ENTRY_TRAVEL = 14

/**
 * Exploded-diagram callouts (Prompt B section 6). One SVG leader layer,
 * one label pool, zero React state per frame: the rAF loop projects part
 * anchors and writes transforms directly. Runs only inside the exploded
 * diagram; parked otherwise.
 */
export function Callouts({ progress }: { progress: MotionValue<number> }) {
  const layerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const labelRefs = useRef<Array<HTMLDivElement | null>>([])
  const pathRefs = useRef<Array<SVGPathElement | null>>([])
  const scratch = useRef({
    world: new THREE.Vector3(),
    dir: new THREE.Vector3(),
    ray: new THREE.Raycaster(),
  })
  const rect = useRef({ w: 0, h: 0 })
  const widths = useRef<number[]>([])
  const pool = useRef<THREE.Vector3[]>([])

  useEffect(() => {
    let raf = 0
    let frame = 0
    const measure = (): void => {
      const el = layerRef.current?.parentElement
      if (el === null || el === undefined) return
      // Cached outside the frame loop; invalidated on resize only. Label
      // widths ride along because copy is static (never read offsetWidth
      // per frame: layout thrash in an overlay loop).
      const box = el.getBoundingClientRect()
      rect.current = { w: box.width, h: box.height }
      widths.current = labelRefs.current.map((label) => label?.offsetWidth ?? 0)
    }
    measure()
    window.addEventListener('resize', measure)

    const tick = (): void => {
      raf = requestAnimationFrame(tick)
      frame += 1
      const layer = layerRef.current
      const svg = svgRef.current
      if (layer === null || svg === null) return
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const p = progress.get()
      const st = computeFilmStates(p)
      // During the teardown feature run the layer copy carries the story,
      // so callouts only bracket it: establishing stack and restack. Nine
      // simultaneous labels over a featured layer is clutter, not diagram.
      const cursor = cursorAt(p)
      const inFeatureRun = p >= 0.25 && p < 0.52 && cursor > 0.5 && cursor < 9.5
      const active =
        st.calloutOpacity > 0.01 &&
        !inFeatureRun &&
        calloutBridge.camera !== null &&
        rect.current.w > 0
      layer.style.display = active ? 'block' : 'none'
      if (!active) return

      const camera = calloutBridge.camera
      if (camera === null) return
      const { w, h } = rect.current
      if (pool.current.length !== CALLOUTS.length) {
        pool.current = CALLOUTS.map(() => new THREE.Vector3())
      }
      const worlds = new Map<string, THREE.Vector3>()
      CALLOUTS.forEach((def, i) => {
        const groups = calloutBridge.anchors[def.partId]
        const first = groups?.[0]
        const slot = pool.current[i]
        if (first === undefined || slot === undefined) return
        first.getWorldPosition(slot)
        worlds.set(def.partId, slot)
      })
      const layouts = layoutCallouts(CALLOUTS, worlds, camera, w, h)

      // Occlusion: throttled raycast against the shell. A part hidden
      // behind nearer geometry loses its label (Prompt B section 6).
      // Ghosted shell (opacity under 0.5) does not occlude: the parts show
      // through it by design.
      const occluded = new Set<string>()
      if (frame % 4 === 0 && calloutBridge.occluders.length > 0) {
        const raycaster = scratch.current.ray
        for (const def of CALLOUTS) {
          const world = worlds.get(def.partId)
          if (world === undefined) continue
          scratch.current.dir.copy(world).sub(camera.position)
          const dist = scratch.current.dir.length()
          raycaster.set(camera.position, scratch.current.dir.normalize())
          const hits = raycaster.intersectObjects(calloutBridge.occluders, true)
          const first = hits[0]
          if (first === undefined) continue
          const material = (first.object as THREE.Mesh).material as
            THREE.Material | THREE.Material[]
          const opacity = Array.isArray(material)
            ? Math.min(...material.map((m) => m.opacity))
            : material.opacity
          if (first.distance < dist - 0.001 && opacity > 0.5) occluded.add(def.partId)
        }
      }

      const byId = new Map<string, CalloutLayout>()
      for (const layout of layouts) byId.set(layout.partId, layout)
      CALLOUTS.forEach((def, i) => {
        const label = labelRefs.current[i]
        const path = pathRefs.current[i]
        if (label === null || label === undefined || path === null || path === undefined) return
        const layout = byId.get(def.partId)
        const part = EXPLODE_PARTS.find((entry) => entry.id === def.partId)
        const entry = part === undefined ? 1 : partProgress(st.explodeXray, part.delay)
        const show = (layout?.visible ?? false) && !occluded.has(def.partId) && entry > 0.35
        const opacity = show
          ? st.calloutOpacity * (reduced ? 1 : Math.min(1, (entry - 0.35) / 0.3))
          : 0
        label.style.opacity = String(opacity)
        if (!show) {
          path.setAttribute('d', '')
          return
        }
        const lx = layout?.x ?? 0
        const ly = layout?.y ?? 0
        const side = layout?.side ?? 'right'
        // Entry rides the part's own progress: labels arrive as parts settle.
        const travel = reduced ? 0 : ENTRY_TRAVEL * (1 - Math.min(1, (entry - 0.35) / 0.4))
        const cachedWidth = widths.current[i] ?? 0
        const labelX = side === 'right' ? lx + 18 + travel : lx - 18 - travel - cachedWidth
        label.style.transform = `translate(${labelX.toFixed(1)}px, ${(ly - 14).toFixed(1)}px)`
        const anchorX = side === 'right' ? labelX : labelX + cachedWidth
        path.setAttribute(
          'd',
          `M ${lx.toFixed(1)} ${ly.toFixed(1)} L ${anchorX.toFixed(1)} ${(ly - 8).toFixed(1)}`,
        )
        path.style.opacity = String(opacity)
      })
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', measure)
    }
  }, [progress])

  return (
    <div ref={layerRef} className="pointer-events-none absolute inset-0" data-testid="callouts">
      <svg ref={svgRef} className="absolute inset-0 h-full w-full" aria-hidden="true">
        {CALLOUTS.map((def, i) => (
          <path
            key={def.partId}
            ref={(el) => {
              pathRefs.current[i] = el
            }}
            stroke="currentColor"
            className="text-(--color-dim)"
            strokeWidth={1}
            fill="none"
          />
        ))}
      </svg>
      {CALLOUTS.map((def, i) => (
        <div
          key={def.partId}
          ref={(el) => {
            labelRefs.current[i] = el
          }}
          className="absolute left-0 top-0 max-w-44"
          data-testid={`callout-${def.partId}`}
        >
          <p className="spec-tech text-(--color-ink)">{def.title}</p>
          <p className="spec-tech text-(--color-dim)">{def.body}</p>
        </div>
      ))}
    </div>
  )
}
