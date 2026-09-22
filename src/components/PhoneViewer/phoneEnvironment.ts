import { useEffect } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'

/**
 * Procedural studio environment, M3R section 5. A canvas-painted equirect
 * with shape, not detail: one long softbox, one narrow strip, a cool rim
 * band, and a faint screen-bounce glow over a dark studio falloff. No
 * remote HDR, ever. The panels in this texture are what draw the two
 * parallel highlight lines on the frame rail and chamfer.
 */
export function createStudioEnvironmentCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 512
  const ctx = canvas.getContext('2d')
  if (ctx === null) return canvas

  // Dark studio falloff: brighter crown, near-black floor.
  const falloff = ctx.createLinearGradient(0, 0, 0, 512)
  falloff.addColorStop(0, '#1a1c22')
  falloff.addColorStop(0.42, '#0b0b0e')
  falloff.addColorStop(0.62, '#060607')
  falloff.addColorStop(1, '#020203')
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
    // reflections (doubled by the clearcoat second reflection), so every
    // panel is a vertical gradient fading to transparent, plus a halo.
    // All passes stack additively over the dark falloff.
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
    ctx.globalAlpha = 0.85
    ctx.fillStyle = core
    ctx.fillRect(x, y, w, h)
    ctx.restore()
  }

  // The long softbox: compact and off-axis. A big panel washes the whole
  // flat screen white (a second-phone read); a compact one draws a band
  // that sweeps as the phone turns. Structure, not wash (Prompt C 5.1).
  softRect(140, 40, 170, 90, '#dfe6f5', 40)
  // Core hotspot, small and off-axis: the dark mirror shows a bright band
  // sweeping across it, never a full-face wash.
  softRect(165, 55, 70, 36, '#ffffff', 20)

  // The strip: narrow, bright, right of the key. Edge-on to the rail it
  // draws the second, tighter highlight on the chamfer faces.
  softRect(650, 80, 30, 260, '#e6efff', 26)
  softRect(656, 100, 18, 220, '#ffffff', 12)

  // Horizon where the notional floor meets the wall, ~40% height: one value
  // break the reflection can track as the phone rotates.
  const horizon = ctx.createLinearGradient(0, 196, 0, 214)
  horizon.addColorStop(0, 'rgba(120,140,190,0)')
  horizon.addColorStop(0.5, 'rgba(120,140,190,0.28)')
  horizon.addColorStop(1, 'rgba(120,140,190,0)')
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
    dot.addColorStop(0, 'rgba(255,255,255,0.95)')
    dot.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = dot
    ctx.beginPath()
    ctx.arc(px, py, pr * 3, 0, Math.PI * 2)
    ctx.fill()
  }

  // The rim: cool, dim, low and wide so the silhouette separates without
  // reading as a stock render.
  softRect(760, 200, 220, 90, '#4f66a8', 55)

  // Screen bounce: faint blue-violet pool below centre, the off-screen
  // mirror's room to reflect.
  const bounce = ctx.createRadialGradient(512, 400, 10, 512, 400, 220)
  bounce.addColorStop(0, 'rgba(140,160,255,0.4)')
  bounce.addColorStop(1, 'rgba(140,160,255,0)')
  ctx.fillStyle = bounce
  ctx.fillRect(0, 0, 1024, 512)
  return canvas
}

/** Equirect texture built from the studio canvas. */
export function createStudioEnvironmentTexture(): THREE.Texture {
  const texture = new THREE.CanvasTexture(createStudioEnvironmentCanvas())
  texture.mapping = THREE.EquirectangularReflectionMapping
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

/**
 * Mounts the PMREM-filtered studio environment on the current scene.
 * Owns its texture and render target: everything is released on unmount
 * so viewer mount cycles never leak GPU memory.
 */
export function StudioEnvironment() {
  const gl = useThree((state) => state.gl)
  const scene = useThree((state) => state.scene)
  useEffect(() => {
    const source = createStudioEnvironmentTexture()
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
