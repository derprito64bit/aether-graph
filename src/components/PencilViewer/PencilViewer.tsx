import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Suspense, lazy, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import * as THREE from 'three'
import type { PencilFinishId } from '../../data/pencil.ts'
import { AdaptiveDpr } from '../PhoneViewer/PhoneCanvas.tsx'
import { PencilConfigProvider, usePencilConfig } from './PencilConfig.tsx'
import { PencilEnvironment } from './pencilEnvironment.ts'
import { PencilFrame } from './PencilFrame.tsx'
import { PencilModel } from './PencilModel.tsx'
import { PENCIL_FINISH_PARAMS, createPencilMaterials } from './pencilMaterials.ts'

THREE.ColorManagement.enabled = true

/** Disposes every geometry and material in the scene exactly once on unmount. */
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
            physical.emissiveMap,
          ]) {
            if (slot !== null && slot !== undefined && !textures.has(slot.uuid)) {
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

/** Slow showroom turntable. Static under reduced motion. */
function Turntable({ children }: { children: ReactNode }) {
  const group = useRef<THREE.Group | null>(null)
  useFrame((_, delta) => {
    const g = group.current
    if (g === null || window.matchMedia(REDUCED_QUERY).matches) return
    g.rotation.y += delta * 0.25
  })
  return <group ref={group}>{children}</group>
}

function PencilCatalogScene({
  label,
  detail,
  finish,
}: {
  label: string
  detail: 'high' | 'low'
  finish: PencilFinishId
}) {
  const materials = useMemo(() => createPencilMaterials(PENCIL_FINISH_PARAMS[finish]), [finish])
  return (
    <group name={label}>
      <directionalLight position={[0.6, 0.9, 1.2]} intensity={2.6} color="#ffffff" />
      <directionalLight position={[-0.9, 0.2, 0.6]} intensity={0.8} color="#e8e2d4" />
      <directionalLight position={[-0.3, -0.6, -1]} intensity={1.4} color="#c9a06a" />
      <ambientLight intensity={0.35} color="#e8e2d4" />
      <PencilEnvironment />
      <Turntable>
        <group rotation={[0.1, 0.5, -0.45]}>
          <PencilModel materials={materials} detail={detail} />
        </group>
      </Turntable>
    </group>
  )
}

function PencilCanvas({
  label,
  dprCap,
  detail,
  finish,
  onContextLost,
}: {
  label: string
  dprCap: number
  detail: 'high' | 'low'
  finish: PencilFinishId
  onContextLost?: () => void
}) {
  return (
    <Canvas
      dpr={Math.min(window.devicePixelRatio || 1, dprCap)}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ fov: 22, near: 0.01, far: 10, position: [0.12, 0.05, 0.42] }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
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
      <PencilCatalogScene label={label} detail={detail} finish={finish} />
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
  className?: string
  /** Join an ancestor PencilConfigProvider instead of minting local state. */
  sharedConfig?: boolean
}

function PencilViewerInner({ label, className, sharedConfig = false, finish }: PencilViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const [nearViewport, setNearViewport] = useState(
    () => typeof IntersectionObserver === 'undefined',
  )
  const [contextLost, setContextLost] = useState(false)
  const [canRender] = useState(() => !fallbackForced() && webglAvailable())
  const config = usePencilConfig()
  const activeFinish = sharedConfig ? config.finish : (finish ?? config.finish)

  useEffect(() => {
    const el = mountRef.current
    if (el === null || !canRender || nearViewport) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setNearViewport(true)
            observer.disconnect()
          }
        }
      },
      { rootMargin: '400px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [canRender, nearViewport])

  const showFallback = !canRender || contextLost
  const coarse = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
  const dprCap = coarse ? 1.3 : 1.75
  const detail = coarse ? 'low' : 'high'

  return (
    <div
      ref={mountRef}
      className={className ?? 'flex min-h-[420px] items-center justify-center md:min-h-[520px]'}
      data-testid="pencil-viewer"
      data-fallback={showFallback ? 'true' : 'false'}
      role="img"
      aria-label={label}
    >
      {showFallback ? (
        <div className="flex flex-col items-center gap-3">
          <PencilFrame finish={activeFinish} label={label} />
          {contextLost && (
            <p role="status" className="text-sm text-(--color-dim)">
              3D paused after a graphics reset. Static view shown.
            </p>
          )}
        </div>
      ) : nearViewport ? (
        <Suspense
          fallback={
            <div className="flex min-h-[420px] items-center justify-center" role="status">
              <p className="kicker">Preparing 3D</p>
            </div>
          }
        >
          <div className="h-[420px] w-full md:h-[520px]" data-testid="pencil-canvas">
            <PencilCanvasLazy
              label={label}
              dprCap={dprCap}
              detail={detail}
              finish={activeFinish}
              onContextLost={() => setContextLost(true)}
            />
          </div>
        </Suspense>
      ) : (
        <div
          className="flex min-h-[420px] items-center justify-center"
          role="status"
          aria-label="3D pencil loading"
        >
          <PencilFrame finish={activeFinish} label={`${label} (preview)`} />
        </div>
      )}
    </div>
  )
}

/** Lazy 3D pencil study with the same lifecycle guarantees as the phone viewer. */
export function PencilViewer(props: PencilViewerProps) {
  if (props.sharedConfig === true) return <PencilViewerInner {...props} />
  return (
    <PencilConfigProvider>
      <PencilViewerInner {...props} />
    </PencilConfigProvider>
  )
}
