import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { MotionValue } from 'motion/react'
import * as THREE from 'three'
import { sampleFilm } from '../sample.ts'
import { computeFilmStates } from '../states.ts'
import { stageColors } from './stageColors.ts'

/**
 * The stage (Prompt D section 7, colour journey in section 8): the device
 * gets a place to be instead of floating in a void. An
 * orientation-independent room (gradient backdrop sphere with a horizon
 * value break, so it survives the film's full orbit), a matte floor, and a
 * soft contact pool. The backdrop repaints from the per-act stage colours
 * every frame from a 64x256 scratch canvas: cheap, continuous, and exactly
 * reversible on scrub.
 *
 * The contact pool is a baked radial-gradient plane, not a depth pass
 * (round 03 Part E): no drei, no per-frame render target. Its scale tracks
 * the device footprint (wider laid flat) and its opacity tracks height
 * above the floor, so grounding stays plausible through every act.
 *
 * Cost notes: one tiny canvas upload per frame, one floor draw, one
 * transparent quad. No real-time reflection yet (measured
 * separately per D 13.6).
 */
export function Stage({ progress }: { progress: MotionValue<number> }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 256
    const texture = new THREE.CanvasTexture(canvas)
    texture.mapping = THREE.EquirectangularReflectionMapping
    texture.colorSpace = THREE.SRGBColorSpace
    return texture
  }, [])
  const ctx = useMemo(() => {
    const canvas = texture.image as HTMLCanvasElement
    return canvas.getContext('2d')
  }, [texture])
  const paint = useRef({ base: '#000000', top: '#000000' })
  const pool = useRef<THREE.Mesh>(null)
  const poolMat = useRef<THREE.MeshBasicMaterial>(null)

  const poolTexture = useMemo(() => {
    const size = 128
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const c = canvas.getContext('2d')
    if (c !== null) {
      const g = c.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
      g.addColorStop(0, 'rgba(0,0,0,0.85)')
      g.addColorStop(0.55, 'rgba(0,0,0,0.38)')
      g.addColorStop(1, 'rgba(0,0,0,0)')
      c.fillStyle = g
      c.fillRect(0, 0, size, size)
    }
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    return texture
  }, [])

  useEffect(() => () => texture.dispose(), [texture])
  useEffect(() => () => poolTexture.dispose(), [poolTexture])

  useFrame(() => {
    if (ctx === null) return
    const { base, top } = stageColors(progress.get())
    const baseCss = `#${base.getHexString()}`
    const topCss = `#${top.getHexString()}`
    const last = paint.current
    if (last.base === baseCss && last.top === topCss) return
    last.base = baseCss
    last.top = topCss
    // Canvas row 0 is v=1 (flipY), the sphere's crown.
    const g = ctx.createLinearGradient(0, 0, 0, 256)
    g.addColorStop(0, topCss)
    g.addColorStop(0.42, baseCss)
    // Horizon value break at the equator: the eye orients on it. A
    // uniform gradient would read as fog, not a room.
    g.addColorStop(0.5, topCss)
    g.addColorStop(0.56, baseCss)
    // Lower room falls to warm shadow, never black: the cyclorama must
    // stay a paper studio from every orbit angle.
    g.addColorStop(0.75, '#c4b89f')
    g.addColorStop(1, '#9a8f78')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 64, 256)
    texture.needsUpdate = true
    // Contact pool follows the device: wider laid flat, fainter aloft.
    const mesh = pool.current
    const mat = poolMat.current
    if (mesh !== null && mat !== null) {
      const p = progress.get()
      const s = sampleFilm(p)
      const st = computeFilmStates(p)
      const heightAboveFloor = s.py + 0.42
      const closeness = Math.min(1, Math.max(0, 1 - heightAboveFloor / 0.9))
      const span = 1.4 * s.scale * (1 + 0.35 * st.layDown)
      mesh.position.set(s.px, -0.415, 0)
      mesh.scale.set(span, span, 1)
      mat.opacity = 0.34 * closeness
      mesh.visible = closeness > 0.01
    }
  })

  return (
    <group name="stage">
      {/* Room: gradient shell, BackSide so the orbit never leaves it.
          Tone mapping off: the room is a painted backdrop, not a subject;
          ACES would drag the paper down to mud. */}
      <mesh scale={[6, 6, 6]}>
        <sphereGeometry args={[1, 48, 32]} />
        <meshBasicMaterial map={texture} side={THREE.BackSide} depthWrite={false} toneMapped={false} />
      </mesh>
      {/* Floor: matte cream, no specular character. A backdrop, not a subject. */}
      <mesh position={[0, -0.42, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[3, 64]} />
        <meshStandardMaterial color={new THREE.Color('#d9d0ba')} roughness={0.95} metalness={0} />
      </mesh>
      {/* Contact pool: broad occlusion, the device's weight made visible. */}
      <mesh ref={pool} position={[0, -0.415, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          ref={poolMat}
          map={poolTexture}
          transparent
          depthWrite={false}
          opacity={0.34}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}
