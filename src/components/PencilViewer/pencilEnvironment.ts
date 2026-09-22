import { useEffect } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'

/**
 * Pencil studio environment. Same architecture as the phone studio (canvas
 * equirect, PMREM once, zero network), tuned for a long thin cylinder:
 * two tall vertical softboxes draw the continuous travelling highlight
 * down the barrel, a warm crown lifts anodised colour, and the falloff
 * stays dark enough for silhouette. Metals need bright panels to reflect;
 * a dark room renders them black.
 */
export function createPencilEnvironmentCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 512
  const ctx = canvas.getContext('2d')
  if (ctx === null) return canvas

  // Warm studio falloff: brighter crown than the phone room, near-black floor.
  const falloff = ctx.createLinearGradient(0, 0, 0, 512)
  falloff.addColorStop(0, '#2a251c')
  falloff.addColorStop(0.42, '#14110d')
  falloff.addColorStop(0.62, '#0a0908')
  falloff.addColorStop(1, '#040403')
  ctx.fillStyle = falloff
  ctx.fillRect(0, 0, 1024, 512)

  const softRect = (
    x: number,
    y: number,
    w: number,
    h: number,
    color: string,
    blur: number,
  ): void => {
    // Feathered panels: hard canvas edges print as hairlines in mirror
    // reflections, so every panel is a gradient fading to transparent.
    ctx.save()
    ctx.shadowColor = color
    ctx.shadowBlur = blur
    ctx.fillStyle = color
    ctx.fillRect(x + w * 0.2, y + h * 0.2, w * 0.6, h * 0.6)
    ctx.shadowBlur = 0
    const core = ctx.createLinearGradient(0, y, 0, y + h)
    core.addColorStop(0, 'rgba(0,0,0,0)')
    core.addColorStop(0.5, color)
    core.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.globalAlpha = 0.9
    ctx.fillStyle = core
    ctx.fillRect(x, y, w, h)
    ctx.restore()
  }

  // Key softbox: large, warm, off-axis. Anodised colour lives here.
  softRect(140, 40, 220, 120, '#f5e6cd', 40)
  softRect(180, 60, 90, 50, '#ffffff', 20)

  // Twin vertical strips: tall panels edge-on to the barrel draw the two
  // continuous highlights that travel as the pencil turns.
  softRect(610, 60, 34, 320, '#ffedd2', 26)
  softRect(617, 90, 20, 260, '#ffffff', 12)
  softRect(330, 60, 34, 320, '#e8d5b5', 26)
  softRect(337, 90, 20, 260, '#fff6e8', 12)

  // Horizon value break the reflection tracks while rotating.
  const horizon = ctx.createLinearGradient(0, 196, 0, 214)
  horizon.addColorStop(0, 'rgba(200,160,106,0)')
  horizon.addColorStop(0.5, 'rgba(200,160,106,0.35)')
  horizon.addColorStop(1, 'rgba(200,160,106,0)')
  ctx.fillStyle = horizon
  ctx.fillRect(0, 196, 1024, 18)

  // Distant practicals: tiny sharp glints that read glossy, not matte.
  for (const [px, py, pr] of [
    [80, 120, 4],
    [900, 90, 3],
    [500, 150, 5],
    [980, 300, 3],
  ] as const) {
    const dot = ctx.createRadialGradient(px, py, 0, px, py, pr * 3)
    dot.addColorStop(0, 'rgba(255,244,225,0.95)')
    dot.addColorStop(1, 'rgba(255,244,225,0)')
    ctx.fillStyle = dot
    ctx.beginPath()
    ctx.arc(px, py, pr * 3, 0, Math.PI * 2)
    ctx.fill()
  }

  // Rim: warm amber, low and wide, for silhouette separation.
  softRect(760, 200, 220, 90, '#8a5f30', 55)

  // Bench bounce: faint warm pool below centre for dark metal to reflect.
  const bounce = ctx.createRadialGradient(512, 400, 10, 512, 400, 220)
  bounce.addColorStop(0, 'rgba(255,220,170,0.45)')
  bounce.addColorStop(1, 'rgba(255,220,170,0)')
  ctx.fillStyle = bounce
  ctx.fillRect(0, 0, 1024, 512)
  return canvas
}

/** Equirect texture built from the pencil studio canvas. */
export function createPencilEnvironmentTexture(): THREE.Texture {
  const texture = new THREE.CanvasTexture(createPencilEnvironmentCanvas())
  texture.mapping = THREE.EquirectangularReflectionMapping
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

/**
 * Mounts the PMREM-filtered pencil studio on the current scene. Owns its
 * texture and render target: everything is released on unmount.
 */
export function PencilEnvironment() {
  const gl = useThree((state) => state.gl)
  const scene = useThree((state) => state.scene)
  useEffect(() => {
    const source = createPencilEnvironmentTexture()
    const pmrem = new THREE.PMREMGenerator(gl)
    const target = pmrem.fromEquirectangular(source)
    scene.environment = target.texture
    return () => {
      scene.environment = null
      target.dispose()
      pmrem.dispose()
      source.dispose()
    }
  }, [gl, scene])
  return null
}
