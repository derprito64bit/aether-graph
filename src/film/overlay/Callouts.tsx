import { useEffect, useRef } from 'react'
import type { MotionValue } from 'motion/react'
import * as THREE from 'three'
import { EXPLODE_PARTS, partProgress } from '../internals/explode.ts'
import { CALLOUTS } from '../chapters.ts'
import { computeFilmStates } from '../states.ts'
import { TEARDOWN_LAYERS, cursorAt } from '../teardown/layers.ts'
import { calloutBridge, layoutCallouts, type CalloutLayout } from './callouts.ts'

const ENTRY_TRAVEL = 14

/** Priority rank: outside the feature run only the top three labels show. */
const CALLOUT_RANK = new Map(
  [...CALLOUTS].sort((a, b) => a.priority - b.priority).map((def, i) => [def.partId, i] as const),
)

/**
 * Exploded-diagram callouts (Prompt B section 6). One SVG leader layer,
 * one label pool, zero React state per frame: the rAF loop projects part
 * anchors and writes transforms directly. Runs only inside the exploded
 * diagram; parked otherwise.
 */
export function Callouts({ progress }: { progress: MotionValue<number> }) {
  const layerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const ringRef = useRef<SVGCircleElement | null>(null)
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
      // During the whole exploded act only the featured part gets a ring
      // and connector: one label riding its own part while the overlay
      // copy tells the story. Floating text labels stay out of the act
      // entirely (the showcase panel carries the words). Outside the act
      // the top three labels bracket the establishing and restack.
      const cursor = cursorAt(p)
      const inExploded = p >= 0.24 && p < 0.48
      const inFeatureRun = inExploded && cursor < 9.99
      const featuredPart = inFeatureRun
        ? TEARDOWN_LAYERS[Math.min(9, Math.floor(Math.max(0, cursor)))]?.shell[0]
        : undefined
      const active =
        st.calloutOpacity > 0.01 &&
        calloutBridge.camera !== null &&
        rect.current.w > 0 &&
        (!inExploded || featuredPart !== undefined)
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
      // Spotlight ring follows the featured part; the showcase panel
      // carries its text, so no floating labels during the run.
      let ringX = 0
      let ringY = 0
      let ringVisible = false
      CALLOUTS.forEach((def, i) => {
        const label = labelRefs.current[i]
        const path = pathRefs.current[i]
        if (label === null || label === undefined || path === null || path === undefined) return
        const layout = byId.get(def.partId)
        const part = EXPLODE_PARTS.find((entry) => entry.id === def.partId)
        const entry = part === undefined ? 1 : partProgress(st.explodeXray, part.delay)
        const anchorVisible = (layout?.visible ?? false) && !occluded.has(def.partId)
        const isFeatured = inFeatureRun && def.partId === featuredPart
        if (isFeatured && anchorVisible && entry > 0.35) {
          ringX = layout?.x ?? 0
          ringY = layout?.y ?? 0
          ringVisible = true
          // Connector from the part to the showcase panel edge.
          const panelX = (
            rect.current.w < 700 ? rect.current.w - 32 : rect.current.w * 0.63
          ).toFixed(1)
          path.setAttribute(
            'd',
            `M ${(layout?.x ?? 0).toFixed(1)} ${(layout?.y ?? 0).toFixed(1)} L ${panelX} ${(layout?.y ?? 0).toFixed(1)}`,
          )
          path.style.opacity = String(st.calloutOpacity)
          label.style.opacity = '0'
          return
        }
        const rankOk = (CALLOUT_RANK.get(def.partId) ?? 99) < 3
        const show = !inExploded && rankOk && anchorVisible && entry > 0.35
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
        // Feature-run bubbles park right of their part with extra
        // clearance: the big layer copy owns the left column.
        const side = inFeatureRun ? 'right' : (layout?.side ?? 'right')
        const clearance = inFeatureRun ? 60 : 18
        // Entry rides the part's own progress: labels arrive as parts settle.
        const travel = reduced ? 0 : ENTRY_TRAVEL * (1 - Math.min(1, (entry - 0.35) / 0.4))
        const cachedWidth = widths.current[i] ?? 0
        const labelX = side === 'right' ? lx + clearance + travel : lx - 18 - travel - cachedWidth
        label.style.transform = `translate(${labelX.toFixed(1)}px, ${(ly - 14).toFixed(1)}px)`
        const anchorX = side === 'right' ? labelX : labelX + cachedWidth
        path.setAttribute(
          'd',
          `M ${lx.toFixed(1)} ${ly.toFixed(1)} L ${anchorX.toFixed(1)} ${(ly - 8).toFixed(1)}`,
        )
        path.style.opacity = String(opacity)
      })
      const ring = ringRef.current
      if (ring !== null) {
        if (ringVisible) {
          // Small parts get a tight ring, long parts a wide one.
          const halfM =
            TEARDOWN_LAYERS.find((l) => l.shell[0] === featuredPart)?.featureHalfM ?? 0.02
          const small = halfM < 0.01
          const r = rect.current.w < 700 ? (small ? 44 : 64) : small ? 60 : 96
          ring.setAttribute('cx', ringX.toFixed(1))
          ring.setAttribute('cy', ringY.toFixed(1))
          ring.setAttribute('r', String(r))
          ring.style.opacity = String(st.calloutOpacity)
        } else {
          ring.style.opacity = '0'
        }
      }
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
        <circle
          ref={(el) => {
            ringRef.current = el
          }}
          stroke="currentColor"
          className="text-(--color-dim)"
          strokeWidth={1.5}
          fill="none"
          style={{ opacity: 0 }}
        />
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
