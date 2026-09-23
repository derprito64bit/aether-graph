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

  // Bright working studio for the cream theme: dark lacquer needs
  // luminous panels to reflect, or it renders as silhouette. Mid-dark
  // falloff for mood, near-white softboxes for the travelling stripe.
  const falloff = ctx.createLinearGradient(0, 0, 0, 512)
  falloff.addColorStop(0, '#3a352a')
  falloff.addColorStop(0.42, '#201c15')
  falloff.addColorStop(0.62, '#12100c')
  falloff.addColorStop(1, '#080706')
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
  softRect(120, 30, 300, 160, '#f5e6cd', 40)
  softRect(170, 55, 120, 70, '#ffffff', 20)

  // Twin vertical strips: tall bright panels edge-on to the barrel draw
  // the two continuous highlight stripes that travel as the pencil turns
  // and rake across the knurl teeth.
  softRect(600, 40, 46, 360, '#ffedd2', 26)
  softRect(609, 70, 28, 300, '#ffffff', 12)
  softRect(320, 40, 46, 360, '#e8d5b5', 26)
  softRect(329, 70, 28, 300, '#fff6e8', 12)

  // Horizon value break the reflection tracks while rotating.
  const horizon = ctx.createLinearGradient(0, 196, 0, 214)
  horizon.addColorStop(0, 'rgba(255,217,168,0)')
  horizon.addColorStop(0.5, 'rgba(255,217,168,0.5)')
  horizon.addColorStop(1, 'rgba(255,217,168,0)')
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
  softRect(760, 200, 220, 90, '#a8763c', 55)

  // Bench bounce: warm pool below centre for dark metal to reflect.
  const bounce = ctx.createRadialGradient(512, 400, 10, 512, 400, 220)
  bounce.addColorStop(0, 'rgba(255,220,170,0.6)')
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
