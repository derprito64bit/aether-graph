import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  Suspense,
  lazy,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
  type ReactNode,
} from 'react'
import * as THREE from 'three'
import type { PencilFinishId } from '../../data/pencil.ts'
import { AdaptiveDpr } from '../PhoneViewer/PhoneCanvas.tsx'
import { PencilConfigProvider, usePencilConfig } from './PencilConfig.tsx'
import { PencilEnvironment } from './pencilEnvironment.ts'
import { PencilFrame } from './PencilFrame.tsx'
import { PencilModel } from './PencilModel.tsx'
import {
  PENCIL_FINISH_PARAMS,
  createPencilMaterials,
  disposePencilMaterials,
  type PencilMaterialSet,
} from './pencilMaterials.ts'
import { SketchReveal, type SketchClock } from './SketchReveal.tsx'
import { onRevealed } from '../../loader/loader.ts'

THREE.ColorManagement.enabled = true

/** Disposes every geometry, material, and texture slot in the scene once on unmount. */
function SceneDisposer() {
  const scene = useThree((state) => state.scene)
  useEffect(() => {
    return () => {
      const textures = new Set<string>()
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh
        if (!mesh.isMesh) return
        mesh.geometry?.dispose()
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        for (const material of materials) {
          const physical = material as THREE.MeshPhysicalMaterial
          for (const slot of [
            physical.map,
            physical.roughnessMap,
            physical.bumpMap,
            physical.normalMap,
            physical.emissiveMap,
          ]) {
            // Shared, finish-independent textures outlive any one canvas.
            if (
              slot !== null &&
              slot !== undefined &&
              slot.userData.shared !== true &&
              !textures.has(slot.uuid)
            ) {
              textures.add(slot.uuid)
              slot.dispose()
            }
          }
          material.dispose()
        }
      })
    }
  }, [scene])
  return null
}

const REDUCED_QUERY = '(prefers-reduced-motion: reduce)'

/** Turntable state shared between DOM pointer handlers and the frame loop. */
interface Spin {
  angle: number
  velocity: number
  dragging: boolean
  lastX: number
  lastT: number
  /** performance.now() of the last finish change, or 0. */
  popAt: number
}

/** Finish-change flourish: a quick lift and a fast extra turn, in seconds. */
const POP_SECONDS = 0.7
const POP_LIFT = 0.012
const POP_SCALE = 0.07
const POP_SPIN = 8

const AUTO_SPIN = 0.25

/**
 * Showroom turntable. Drifts at a slow constant rate; a horizontal drag
 * takes over and releases with inertia that eases back to the drift.
 * Static under reduced motion except while the visitor is dragging.
 */
function Turntable({ spin, children }: { spin: RefObject<Spin>; children: ReactNode }) {
  const group = useRef<THREE.Group | null>(null)
  useFrame((_, delta) => {
    const g = group.current
    if (g === null) return
    const s = spin.current
    if (!s.dragging) {
      const reduced = window.matchMedia(REDUCED_QUERY).matches
      const rest = reduced ? 0 : AUTO_SPIN
      s.velocity += (rest - s.velocity) * Math.min(1, delta * (reduced ? 12 : 1.6))
      s.angle += s.velocity * delta
    }
    g.rotation.y = s.angle
    // Finish change: rise and swell on a half sine, back to rest by the end.
    const age = s.popAt > 0 ? (performance.now() - s.popAt) / 1000 : POP_SECONDS
    const lift = age < POP_SECONDS ? Math.sin((age / POP_SECONDS) * Math.PI) : 0
    g.position.y = POP_LIFT * lift
    g.scale.setScalar(1 + POP_SCALE * lift)
  })
  return <group ref={group}>{children}</group>
}

/** Soft occlusion pool under the pencil: a baked radial gradient, no depth pass. */
function ContactShadow() {
  const texture = useMemo(() => {
    const size = 128
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (ctx !== null) {
      const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
      g.addColorStop(0, 'rgba(17,19,22,0.32)')
      g.addColorStop(0.5, 'rgba(17,19,22,0.1)')
      g.addColorStop(1, 'rgba(17,19,22,0)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, size, size)
    }
    const t = new THREE.CanvasTexture(canvas)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])
  useEffect(() => () => texture.dispose(), [texture])
  return (
    <mesh position={[0, -0.075, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.14, 0.035, 1]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  )
}

/**
 * One material set per finish, kept for the viewer's lifetime. Disposing the
 * old set on a change freed its shader programs before the new set first
 * drew, so every finish change recompiled the whole pencil (a visible hitch
 * mid-pop; seconds on software GL). Kept sets share those programs, and
 * coming back to a finish costs nothing.
 */
function useFinishMaterials(finish: PencilFinishId): PencilMaterialSet {
  const cache = useMemo(() => new Map<PencilFinishId, PencilMaterialSet>(), [])
  let set = cache.get(finish)
  if (set === undefined) {
    set = createPencilMaterials(PENCIL_FINISH_PARAMS[finish])
    cache.set(finish, set)
  }
  useEffect(
    () => () => {
      for (const kept of cache.values()) disposePencilMaterials(kept)
    },
    [cache],
  )
  return set
}

function PencilCatalogScene({
  label,
  detail,
  finish,
  spin,
  clock,
}: {
  label: string
  detail: 'high' | 'low'
  finish: PencilFinishId
  spin: RefObject<Spin>
  clock: SketchClock
}) {
  const materials = useFinishMaterials(finish)
  const model = useRef<THREE.Group | null>(null)
  return (
    <group name={label}>
      <directionalLight position={[0.6, 0.9, 1.2]} intensity={3} color="#ffffff" />
      <directionalLight position={[-0.9, 0.2, 0.6]} intensity={0.8} color="#eef0f2" />
      <directionalLight position={[-0.3, -0.6, -1]} intensity={1.6} color="#dfe5f2" />
      <ambientLight intensity={0.35} color="#eef0f2" />
      <PencilEnvironment studio="showroom" />
      <ContactShadow />
      <Turntable spin={spin}>
        <group ref={model} rotation={[0.1, 0.5, -0.45]}>
          <PencilModel materials={materials} detail={detail} />
        </group>
      </Turntable>
      <SketchReveal root={model} materials={materials} clock={clock} />
    </group>
  )
}

/** Calls `onWarm` once the scene has drawn twice: compiled and uploaded. */
function WarmUp({ onWarm }: { onWarm: () => void }) {
  const frames = useRef(0)
  useFrame(() => {
    frames.current += 1
    if (frames.current === 2) onWarm()
  })
  return null
}

function PencilCanvas({
  label,
  dprCap,
  detail,
  finish,
  spin,
  clock,
  onContextLost,
  onWarm,
  active,
}: {
  label: string
  dprCap: number
  detail: 'high' | 'low'
  finish: PencilFinishId
  spin: RefObject<Spin>
  clock: SketchClock
  onContextLost?: () => void
  onWarm: () => void
  active: boolean
}) {
  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      dpr={Math.min(window.devicePixelRatio || 1, dprCap)}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ fov: 22, near: 0.01, far: 10, position: [0.12, 0.05, 0.42] }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.05
        gl.domElement.addEventListener(
          'webglcontextlost',
          (event) => {
            event.preventDefault()
            onContextLost?.()
          },
          false,
        )
      }}
    >
      <AdaptiveDpr cap={dprCap} />
      <WarmUp onWarm={onWarm} />
      <PencilCatalogScene label={label} detail={detail} finish={finish} spin={spin} clock={clock} />
      <SceneDisposer />
    </Canvas>
  )
}

const PencilCanvasLazy = lazy(() => Promise.resolve({ default: PencilCanvas }))

function webglAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return canvas.getContext('webgl2') !== null || canvas.getContext('webgl') !== null
  } catch {
    return false
  }
}

function fallbackForced(): boolean {
  try {
    return new URLSearchParams(window.location.search).has('nogl')
  } catch {
    return false
  }
}

interface PencilViewerProps {
  finish?: PencilFinishId
  label: string
  /** Sizes the viewer box; the canvas fills it. */
  className?: string
  /** Join an ancestor PencilConfigProvider instead of minting local state. */
  sharedConfig?: boolean
  /** Horizontal drag turns the pencil. */
  interactive?: boolean
}

function PencilViewerInner({
  label,
  className,
  sharedConfig = false,
  finish,
  interactive = false,
}: PencilViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const spin = useRef<Spin>({
    angle: 0,
    velocity: AUTO_SPIN,
    dragging: false,
    lastX: 0,
    lastT: 0,
    popAt: 0,
  })
  const clock = useMemo<SketchClock>(() => ({ startedAt: null }), [])
  const [nearViewport, setNearViewport] = useState(
    () => typeof IntersectionObserver === 'undefined',
  )
  const [contextLost, setContextLost] = useState(false)
  const [onScreen, setOnScreen] = useState(true)
  // Drawn twice since mounting (shaders compiled, textures uploaded).
  const [warmed, setWarmed] = useState(false)
  const [canRender] = useState(() => !fallbackForced() && webglAvailable())
  const config = usePencilConfig()
  const activeFinish = sharedConfig ? config.finish : (finish ?? config.finish)

  // Mount the canvas a little before it scrolls in (400px margin); start the
  // sketch reveal only once the viewer is genuinely on screen. Two observers:
  // with a root margin the intersection ratio is measured against the grown
  // root, so a single observer would start the clock before it is visible.
  useEffect(() => {
    const el = mountRef.current
    if (el === null || !canRender) return
    const near = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNearViewport(true)
          near.disconnect()
        }
      },
      { rootMargin: '400px 0px' },
    )
    const seen = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.intersectionRatio >= 0.35)) {
          // The reveal plays where it can be seen: not behind the loader.
          onRevealed(() => {
            if (clock.startedAt === null) clock.startedAt = performance.now()
          })
          seen.disconnect()
        }
      },
      { threshold: 0.35 },
    )
    // Rendering pauses while the viewer is off screen. It still renders from
    // the mount until it has warmed up, so it compiles and uploads before it
    // scrolls in rather than as it does.
    const visible = new IntersectionObserver((entries) => {
      for (const entry of entries) setOnScreen(entry.isIntersecting)
    })
    near.observe(el)
    seen.observe(el)
    visible.observe(el)
    return () => {
      near.disconnect()
      seen.disconnect()
      visible.disconnect()
    }
  }, [canRender, clock])

  useEffect(() => {
    const el = mountRef.current
    if (el === null || !interactive) return
    const s = spin.current
    const onDown = (event: PointerEvent) => {
      s.dragging = true
      s.lastX = event.clientX
      s.lastT = performance.now()
      s.velocity = 0
      el.setPointerCapture(event.pointerId)
    }
    const onMove = (event: PointerEvent) => {
      if (!s.dragging) return
      const now = performance.now()
      const dx = event.clientX - s.lastX
      const dt = Math.max(1, now - s.lastT) / 1000
      s.angle += dx * 0.012
      s.velocity = Math.max(-8, Math.min(8, (dx * 0.012) / dt))
      s.lastX = event.clientX
      s.lastT = now
    }
    const onUp = (event: PointerEvent) => {
      s.dragging = false
      if (el.hasPointerCapture(event.pointerId)) el.releasePointerCapture(event.pointerId)
    }
    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
    }
  }, [interactive])

  // A new finish lands with a flourish (never on first mount, never under
  // reduced motion): an extra fast turn hides the material swap mid-spin.
  const lastFinish = useRef(activeFinish)
  useEffect(() => {
    if (lastFinish.current === activeFinish) return
    lastFinish.current = activeFinish
    if (window.matchMedia(REDUCED_QUERY).matches) return
    const s = spin.current
    s.popAt = performance.now()
    if (!s.dragging) s.velocity += POP_SPIN
  }, [activeFinish])

  const showFallback = !canRender || contextLost
  const coarse = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
  const dprCap = coarse ? 1.3 : 1.75
  const detail = coarse ? 'low' : 'high'

  return (
    <div
      ref={mountRef}
      className={`relative ${className ?? 'h-[420px] md:h-[520px]'} ${
        interactive ? 'cursor-grab touch-pan-y select-none active:cursor-grabbing' : ''
      }`}
      data-testid="pencil-viewer"
      data-fallback={showFallback ? 'true' : 'false'}
      role="img"
      aria-label={label}
    >
      {showFallback ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <PencilFrame finish={activeFinish} label={label} />
          {contextLost && (
            <p role="status" className="text-sm text-(--color-dim)">
              3D paused after a graphics reset. Static view shown.
            </p>
          )}
        </div>
      ) : nearViewport ? (
        <Suspense fallback={null}>
          <div className="absolute inset-0" data-testid="pencil-canvas">
            <PencilCanvasLazy
              label={label}
              dprCap={dprCap}
              detail={detail}
              finish={activeFinish}
              spin={spin}
              clock={clock}
              onContextLost={() => setContextLost(true)}
              onWarm={() => setWarmed(true)}
              active={onScreen || !warmed}
            />
          </div>
        </Suspense>
      ) : null}
    </div>
  )
}

/** Lazy 3D pencil study: drawn as a sketch on first view, then rendered. */
export function PencilViewer(props: PencilViewerProps) {
  if (props.sharedConfig === true) return <PencilViewerInner {...props} />
  return (
    <PencilConfigProvider>
      <PencilViewerInner {...props} />
    </PencilConfigProvider>
  )
}
