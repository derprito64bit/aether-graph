import { CanvasTexture } from 'three'

function makeCanvas(
  w: number,
  h: number,
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D | null } {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  return { canvas, ctx: canvas.getContext('2d') }
}

/**
 * Laser-etched die marking. Original codes only, low contrast like real
 * laser marking, never printed white text.
 */
export function createDieMarkingTexture(): CanvasTexture {
  const { canvas, ctx } = makeCanvas(256, 256)
  if (ctx !== null) {
    ctx.clearRect(0, 0, 256, 256)
    ctx.fillStyle = 'rgba(200,212,228,0.5)'
    ctx.textAlign = 'center'
    ctx.font = '600 30px monospace'
    ctx.fillText('A1 ULTRA', 128, 84)
    ctx.font = '400 20px monospace'
    ctx.fillStyle = 'rgba(200,212,228,0.38)'
    ctx.fillText('AX24-0317', 128, 124)
    ctx.fillText('3NM · TW', 128, 154)
    ctx.strokeStyle = 'rgba(200,212,228,0.3)'
    ctx.strokeRect(52, 52, 152, 130)
  }
  const texture = new CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

/**
 * Procedural floorplan: regular arrays plus noisy logic at different
 * reflectivities, driving die roughness and faint emissive.
 */
export function createFloorplanTexture(): CanvasTexture {
  const { canvas, ctx } = makeCanvas(128, 128)
  if (ctx !== null) {
    ctx.fillStyle = '#808080'
    ctx.fillRect(0, 0, 128, 128)
    let v = 1237
    const rng = (): number => {
      v = (v * 9301 + 49297) % 233280
      return v / 233280
    }
    // Regular SRAM-like arrays top-left.
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const g = 110 + Math.round(rng() * 30)
        ctx.fillStyle = `rgb(${g},${g},${g})`
        ctx.fillRect(8 + c * 6, 8 + r * 6, 5, 5)
      }
    }
    // Noisy logic elsewhere.
    for (let i = 0; i < 260; i++) {
      const g = 70 + Math.round(rng() * 90)
      ctx.fillStyle = `rgb(${g},${g},${g})`
      ctx.fillRect(64 + rng() * 56, rng() * 120, 2 + rng() * 5, 1 + rng() * 3)
    }
    // Four large blocks at distinct reflectivity.
    ctx.fillStyle = '#a8a8a8'
    ctx.fillRect(8, 64, 48, 56)
    ctx.fillStyle = '#909090'
    ctx.fillRect(64, 64, 56, 24)
  }
  const texture = new CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

/** Illegible regulatory micro-text block for the rear panel. */
export function createRegulatoryTexture(): CanvasTexture {
  const { canvas, ctx } = makeCanvas(256, 48)
  if (ctx !== null) {
    ctx.clearRect(0, 0, 256, 48)
    ctx.fillStyle = 'rgba(220,228,238,0.4)'
    ctx.font = '400 11px monospace'
    ctx.fillText('AX-1U · 3.7V · IP68 · DESIGNED BY AETHER · SN 0042', 8, 20)
    ctx.fillText('RoHS · CE · FCC ID AX1U2026 · MADE FOR CONCEPT', 8, 36)
  }
  const texture = new CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}
