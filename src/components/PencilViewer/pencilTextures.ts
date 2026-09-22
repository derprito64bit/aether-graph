import * as THREE from 'three'

/**
 * Procedural pencil textures. Seeded canvas work only: no third-party
 * runtime requests, ever. Roughness and bump maps stay linear; nothing
 * here carries colour so no colour-space conversion applies.
 */

function canvasTexture(
  size: number,
  draw: (ctx: CanvasRenderingContext2D, size: number) => void,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (ctx === null) throw new Error('2d context unavailable')
  draw(ctx, size)
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.anisotropy = 4
  return texture
}

let seed = 0x2b4d6f

function rand(): number {
  seed = (seed * 1664525 + 1013904223) >>> 0
  return seed / 0xffffffff
}

/**
 * Diamond knurl for the grip: diagonal cross-hatch ridges. Consumed as a
 * bump map (profile) and as a roughness map (cut faces read rougher).
 */
export function createKnurlMaps(): { bump: THREE.CanvasTexture; roughness: THREE.CanvasTexture } {
  const draw = (ridge: string, valley: string) => (ctx: CanvasRenderingContext2D, size: number) => {
    ctx.fillStyle = valley
    ctx.fillRect(0, 0, size, size)
    ctx.strokeStyle = ridge
    ctx.lineWidth = Math.max(2, size / 32)
    const step = size / 8
    for (let i = -size; i < size * 2; i += step) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i + size, size)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(i + size, 0)
      ctx.lineTo(i, size)
      ctx.stroke()
    }
  }
  const bump = canvasTexture(256, draw('#ffffff', '#3a3a3a'))
  const roughness = canvasTexture(256, draw('#b0b0b0', '#5a5a5a'))
  bump.repeat.set(24, 6)
  roughness.repeat.set(24, 6)
  return { bump, roughness }
}

/** Axial brushed grain for the anodised barrel: fine vertical streaks. */
export function createBrushedTexture(): THREE.CanvasTexture {
  const texture = canvasTexture(256, (ctx, size) => {
    ctx.fillStyle = '#7d7d7d'
    ctx.fillRect(0, 0, size, size)
    for (let x = 0; x < size; x += 1) {
      const v = 100 + Math.floor(rand() * 60)
      ctx.fillStyle = `rgb(${v},${v},${v})`
      ctx.fillRect(x, 0, 1, size)
    }
  })
  texture.repeat.set(3, 1)
  return texture
}

/** Fine speckle for the eraser rubber so it never reads as plastic. */
export function createEraserTexture(): THREE.CanvasTexture {
  const texture = canvasTexture(128, (ctx, size) => {
    ctx.fillStyle = '#8a8a8a'
    ctx.fillRect(0, 0, size, size)
    for (let i = 0; i < 900; i++) {
      const v = 110 + Math.floor(rand() * 70)
      ctx.fillStyle = `rgb(${v},${v},${v})`
      ctx.fillRect(Math.floor(rand() * size), Math.floor(rand() * size), 1, 1)
    }
  })
  texture.repeat.set(2, 2)
  return texture
}
