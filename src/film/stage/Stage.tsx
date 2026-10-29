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

  // Floor rim fade: opaque to 45% of the radius, gone by the edge.
  const floorFade = useMemo(() => {
    const size = 128
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const c = canvas.getContext('2d')
    if (c !== null) {
      const g = c.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
      g.addColorStop(0, '#ffffff')
      g.addColorStop(0.45, '#ffffff')
      g.addColorStop(1, '#000000')
      c.fillStyle = g
      c.fillRect(0, 0, size, size)
    }
    return new THREE.CanvasTexture(canvas)
  }, [])

  // Cutting-mat grid on the floor: centimetre cells in non-repro blue, a
  // heavier line every fifth. In perspective it gives the room depth and
  // the film its drafting table. Mipmapped and anisotropic so it fades to
  // an even tone in the distance instead of shimmering.
  const gridTexture = useMemo(() => {
    const size = 512
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const c = canvas.getContext('2d')
    if (c !== null) {
      c.fillStyle = '#ffffff'
      c.fillRect(0, 0, size, size)
      const cell = size / 10
      for (let i = 0; i < 10; i++) {
        const major = i % 5 === 0
        c.fillStyle = major ? 'rgba(42,68,194,0.26)' : 'rgba(42,68,194,0.13)'
        const w = major ? 3 : 2
        c.fillRect(i * cell, 0, w, size)
        c.fillRect(0, i * cell, size, w)
      }
    }
    const t = new THREE.CanvasTexture(canvas)
    t.colorSpace = THREE.SRGBColorSpace
    t.wrapS = THREE.RepeatWrapping
    t.wrapT = THREE.RepeatWrapping
    // The 6 m floor disc in 10 cm tiles of ten 1 cm cells.
    t.repeat.set(60, 60)
    t.anisotropy = 8
    return t
  }, [])

  // Light pool: a soft lift on the floor under the pencil, the key light
  // landing on the table. Additive, so it only ever brightens.
  const lightTexture = useMemo(() => {
    const size = 128
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const c = canvas.getContext('2d')
    if (c !== null) {
      const g = c.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
      g.addColorStop(0, 'rgba(255,255,255,0.9)')
      g.addColorStop(0.5, 'rgba(255,255,255,0.32)')
      g.addColorStop(1, 'rgba(255,255,255,0)')
      c.fillStyle = g
      c.fillRect(0, 0, size, size)
    }
    const t = new THREE.CanvasTexture(canvas)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])
  const light = useRef<THREE.Mesh>(null)

  useEffect(() => () => texture.dispose(), [texture])
  useEffect(() => () => poolTexture.dispose(), [poolTexture])
  useEffect(() => () => floorFade.dispose(), [floorFade])
  useEffect(() => () => gridTexture.dispose(), [gridTexture])
  useEffect(() => () => lightTexture.dispose(), [lightTexture])

  useFrame(() => {
    if (ctx === null) return
    const p = progress.get()
    // Contact pool and light pool follow the device every frame: wider laid
    // flat, the shadow fainter aloft. (These ran after the paint early-out
    // below, so they froze whenever the stage colour held still.)
    const s = sampleFilm(p)
    const st = computeFilmStates(p)
    const heightAboveFloor = s.py + 0.42
    const closeness = Math.min(1, Math.max(0, 1 - heightAboveFloor / 0.9))
    const span = 1.4 * s.scale * (1 + 0.35 * st.layDown)
    const mesh = pool.current
    const mat = poolMat.current
    if (mesh !== null && mat !== null) {
      mesh.position.set(s.px, -0.415, 0)
      mesh.scale.set(span, span, 1)
      mat.opacity = 0.34 * closeness
      mesh.visible = closeness > 0.01
    }
    const glow = light.current
    if (glow !== null) {
      glow.position.set(s.px, -0.416, 0)
      glow.scale.set(span * 2.2, span * 2.2, 1)
    }
    const { base, top } = stageColors(p)
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
    // Lower room falls to cool shadow, never black: the cyclorama must
    // stay a paper studio from every orbit angle.
    g.addColorStop(0.75, '#bdc0bb')
    g.addColorStop(1, '#8f938e')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 64, 256)
    texture.needsUpdate = true
  })

  return (
    <group name="stage">
      {/* Room: gradient shell, BackSide so the orbit never leaves it.
          Tone mapping off: the room is a painted backdrop, not a subject;
          ACES would drag the paper down to mud. */}
      <mesh scale={[6, 6, 6]}>
        <sphereGeometry args={[1, 48, 32]} />
        <meshBasicMaterial
          map={texture}
          side={THREE.BackSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      {/* Floor: matte paper, no specular character. Its rim fades out
          through a radial alpha map so the floor melts into the room
          instead of drawing a hard horizon arc behind the copy. Drawn
          before the pencil and never writes depth. */}
      <mesh position={[0, -0.42, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={-2}>
        <circleGeometry args={[3, 64]} />
        <meshStandardMaterial
          color={new THREE.Color('#d6d8d3')}
          map={gridTexture}
          roughness={0.95}
          metalness={0}
          alphaMap={floorFade}
          transparent
          depthWrite={false}
        />
      </mesh>
      {/* Light pool: the key light landing on the table under the pencil. */}
      <mesh ref={light} position={[0, -0.416, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={-2}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          map={lightTexture}
          transparent
          depthWrite={false}
          opacity={0.42}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
      {/* Contact pool: broad occlusion, the device's weight made visible. */}
      <mesh ref={pool} position={[0, -0.415, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={-1}>
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
