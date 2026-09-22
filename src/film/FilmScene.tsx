import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { AdaptiveDpr } from '../components/PhoneViewer/PhoneCanvas.tsx'
import { PencilModel } from '../components/PencilViewer/PencilModel.tsx'
import type { PencilPartId } from '../components/PencilViewer/pencilDimensions.ts'
import {
  PENCIL_FINISH_PARAMS,
  createPencilMaterials,
  type PencilMaterialSet,
} from '../components/PencilViewer/pencilMaterials.ts'
import { PencilEnvironment } from '../components/PencilViewer/pencilEnvironment.ts'
import { FilmDirector, type FilmRefs } from './FilmDirector.tsx'
import { Stage } from './stage/Stage.tsx'
import { calloutBridge } from './overlay/callouts.ts'
import type { MotionValue } from 'motion/react'

interface FilmSceneProps {
  progress: MotionValue<number>
  parallaxX: MotionValue<number>
  parallaxY: MotionValue<number>
  label: string
}

/**
 * Film stage contents. Owns the film pencil material set, every ref the
 * director writes, and the warm studio. Explicit color: ACES Filmic tone
 * mapping on the Canvas, sRGB-authored colors converted once at creation.
 */
export function FilmScene({ progress, parallaxX, parallaxY, label }: FilmSceneProps) {
  const materials = useMemo<PencilMaterialSet>(
    () => createPencilMaterials(PENCIL_FINISH_PARAMS.graphite),
    [],
  )

  const hero = useRef<THREE.Group | null>(null)
  const parts = useRef<Record<PencilPartId, THREE.Group | null>>({
    lead: null,
    sleeve: null,
    nose: null,
    clutch: null,
    grip: null,
    shaft: null,
    spring: null,
    barrel: null,
    clip: null,
    cap: null,
  })
  const keyLight = useRef<THREE.DirectionalLight | null>(null)
  const fillLight = useRef<THREE.DirectionalLight | null>(null)
  const rimLight = useRef<THREE.DirectionalLight | null>(null)
  const accentLight = useRef<THREE.DirectionalLight | null>(null)
  // TEMP-DEBUG diagnosis hook. Removed before merge.
  const debugScene = useThree((state) => state.scene)
  const debugCamera = useThree((state) => state.camera)
  useEffect(() => {
    const w = window as unknown as {
      __scene?: THREE.Scene
      __ray?: (x: number, y: number) => string
    }
    w.__scene = debugScene
    const raycaster = new THREE.Raycaster()
    const ndc = new THREE.Vector2()
    w.__ray = (x, y) => {
      ndc.set(x, y)
      raycaster.setFromCamera(ndc, debugCamera)
      const hits = raycaster.intersectObjects(debugScene.children, true)
      return hits
        .slice(0, 6)
        .map((hit) => {
          const o = hit.object as THREE.Mesh
          if (!o.isMesh) return 'non-mesh'
          const m = o.material as THREE.Material | THREE.Material[]
          const mat = Array.isArray(m)
            ? `array[${o.geometry.groups.map((g) => g.materialIndex).join(',')}]`
            : `${m.type}:${(m as THREE.MeshPhysicalMaterial).color?.getHexString()}:op${(m as THREE.MeshPhysicalMaterial).opacity?.toFixed(2)}:side${(m as THREE.MeshPhysicalMaterial).side}:vis=${o.visible}:dw=${(m as THREE.MeshPhysicalMaterial).depthWrite}`
          return `${o.geometry.type}@${o.position
            .toArray()
            .map((v) => +v.toFixed(4))
            .join(',')} mat=${mat}`
        })
        .join('\n')
    }
  }, [debugScene, debugCamera])

  const refs = useMemo<FilmRefs>(
    () => ({
      hero,
      parts,
      keyLight,
      fillLight,
      rimLight,
      accentLight,
      parallaxX,
      parallaxY,
    }),
    [parallaxX, parallaxY],
  )

  return (
    <group name={label}>
      <directionalLight ref={keyLight} position={[0.6, 0.9, 1.2]} intensity={2.8} color="#ffffff" />
      <directionalLight
        ref={fillLight}
        position={[-0.9, 0.2, 0.6]}
        intensity={0.9}
        color="#e8e2d4"
      />
      <directionalLight
        ref={rimLight}
        position={[-0.3, -0.6, -1]}
        intensity={1.4}
        color="#c9a06a"
      />
      {/* Clutch-act accent: off-axis high source raking the brass jaws */}
      <directionalLight
        ref={accentLight}
        position={[0.5, 0.75, -0.35]}
        intensity={0}
        color="#ffe9c8"
      />
      <ambientLight intensity={0.5} color="#e8e2d4" />
      <PencilEnvironment />
      <Stage progress={progress} />
      <group ref={hero}>
        <PencilModel materials={materials} groups={refs.parts} progress={progress} />
      </group>
      <AdaptiveDpr cap={1.75} />
      <CalloutBridge refs={refs} />
      <FilmDirector progress={progress} materials={materials} refs={refs} />
    </group>
  )
}

/**
 * Feeds the HTML callout layer: the live camera plus the shell groups as
 * occlusion casters. Zero allocation after mount.
 */
function CalloutBridge({ refs }: { refs: FilmRefs }) {
  const camera = useThree((state) => state.camera)
  const occluders = useMemo<THREE.Object3D[]>(() => {
    calloutBridge.occluders = []
    return calloutBridge.occluders
  }, [])
  useFrame(() => {
    calloutBridge.camera = camera
    occluders.length = 0
    for (const part of ['barrel', 'grip', 'nose'] as const) {
      const grp = refs.parts.current[part]
      if (grp !== null) occluders.push(grp)
    }
  })
  return null
}
