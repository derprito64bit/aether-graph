import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useState } from 'react'
import * as THREE from 'three'
import { PhoneConfigProvider } from './PhoneConfig.tsx'
import { PhoneScene, type PhonePoseId } from './PhoneScene.tsx'

// Explicit per docs/rendering.md: sRGB pipeline, one ACES Filmic curve
// shared with the film canvas. R3F enables both by default; stated here so
// a default change upstream fails loudly instead of washing the catalog.
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
          for (const slot of [physical.map, physical.roughnessMap, physical.emissiveMap]) {
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

/** Adaptive quality: scales DPR from measured frame time, never per frame. */
export function AdaptiveDpr({ cap }: { cap: number }) {
  const gl = useThree((state) => state.gl)
  const [dpr, setDpr] = useState(Math.min(window.devicePixelRatio || 1, cap))
  useFrame((_, delta) => {
    frameAcc.ms += delta * 1000
    frameAcc.n += 1
    if (frameAcc.n < 90) return
    const avg = frameAcc.ms / frameAcc.n
    frameAcc.ms = 0
    frameAcc.n = 0
    if (avg > 22 && dpr > 1) setDpr(Math.max(1, dpr - 0.25))
    else if (avg < 12 && dpr < cap) setDpr(Math.min(cap, dpr + 0.25))
  })
  useEffect(() => {
    gl.setPixelRatio(dpr)
  }, [dpr, gl])
  return null
}

const frameAcc = { ms: 0, n: 0 }

interface PhoneCanvasProps {
  pose: PhonePoseId
  label: string
  dprCap: number
  /** Low drops knurling, thread ring, and the second baffle (mobile LOD). */
  detail?: 'high' | 'low'
  /** Skip the internal provider when an ancestor already provides config. */
  sharedConfig?: boolean
  onCreated?: (gl: THREE.WebGLRenderer) => void
  onContextLost?: () => void
}

/** The live WebGL canvas. Split into its own chunk so three never blocks first paint. */
export function PhoneCanvas({
  pose,
  label,
  dprCap,
  detail = 'high',
  sharedConfig = false,
  onCreated,
  onContextLost,
}: PhoneCanvasProps) {
  const scene = (
    <>
      <AdaptiveDpr cap={dprCap} />
      <PhoneScene pose={pose} label={label} detail={detail} />
      <SceneDisposer />
    </>
  )
  return (
    <Canvas
      dpr={Math.min(window.devicePixelRatio || 1, dprCap)}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ fov: 24, near: 0.01, far: 10, position: [0, 0.01, 0.62] }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        onCreated?.(gl)
        const canvas = gl.domElement
        const handleLost = (event: Event) => {
          event.preventDefault()
          onContextLost?.()
        }
        canvas.addEventListener('webglcontextlost', handleLost, false)
      }}
    >
      {sharedConfig ? scene : <PhoneConfigProvider>{scene}</PhoneConfigProvider>}
    </Canvas>
  )
}
