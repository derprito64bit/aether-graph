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

/** Knurl canvases are expensive to compute; every material set reuses them. */
let knurlCache: { normal: HTMLCanvasElement; roughness: HTMLCanvasElement } | null = null
let knurlTextures: { normal: THREE.CanvasTexture; roughness: THREE.CanvasTexture } | null = null
let brushedTexture: THREE.CanvasTexture | null = null
let eraserTexture: THREE.CanvasTexture | null = null

/**
 * Marks a texture shared by every material set on the page (finish
 * independent): disposePencilMaterials leaves it alone, so one GPU copy per
 * renderer serves the hero, the finish fan, and the viewers.
 */
function shared<T extends THREE.Texture>(texture: T): T {
  texture.userData.shared = true
  return texture
}

/** Plain land at each end of the grip, as a share of its length. */
export const GRIP_LAND = 0.07

/**
 * True diamond knurl as a tangent-space normal map: a height field of
 * square pyramids on a 45 degree lattice, differentiated per texel, with
 * plain lands at both ends of the grip. U runs around the grip, V along
 * it (see axialUV in pencilGeometry). 70 diamonds around a 9 mm grip is
 * the 0.4 mm pitch. The roughness map reads the cut faces rougher than the
 * peaks, so the pattern sparkles instead of printing as a flat hatch.
 */
export function createKnurlNormalMaps(): {
  normal: THREE.CanvasTexture
  roughness: THREE.CanvasTexture
} {
  if (knurlCache === null) {
    const w = 1536
    const h = 768
    const around = 70
    const along = 52
    const height = (u: number, v: number): number => {
      if (v < GRIP_LAND || v > 1 - GRIP_LAND) return 0
      const a = u * around + v * along
      const b = u * around - v * along
      const tri = (x: number): number => 1 - 2 * Math.abs(x - Math.floor(x) - 0.5)
      return Math.min(tri(a), tri(b))
    }
    const normal = document.createElement('canvas')
    normal.width = w
    normal.height = h
    const rough = document.createElement('canvas')
    rough.width = w
    rough.height = h
    const nctx = normal.getContext('2d')
    const rctx = rough.getContext('2d')
    if (nctx !== null && rctx !== null) {
      const nimg = nctx.createImageData(w, h)
      const rimg = rctx.createImageData(w, h)
      const strength = 2.4
      for (let y = 0; y < h; y++) {
        const v = 1 - y / h
        for (let x = 0; x < w; x++) {
          const u = x / w
          const c = height(u, v)
          const dx = height(u + 1 / w, v) - height(u - 1 / w, v)
          const dy = height(u, v + 1 / h) - height(u, v - 1 / h)
          let nx = -dx * strength
          let ny = -dy * strength
          let nz = 1
          const len = Math.hypot(nx, ny, nz)
          nx /= len
          ny /= len
          nz /= len
          const i = (y * w + x) * 4
          nimg.data[i] = Math.round((nx * 0.5 + 0.5) * 255)
          nimg.data[i + 1] = Math.round((ny * 0.5 + 0.5) * 255)
          nimg.data[i + 2] = Math.round((nz * 0.5 + 0.5) * 255)
          nimg.data[i + 3] = 255
          const land = v < GRIP_LAND || v > 1 - GRIP_LAND
          const r = land ? 92 : Math.round(150 - c * 70)
          rimg.data[i] = r
          rimg.data[i + 1] = r
          rimg.data[i + 2] = r
          rimg.data[i + 3] = 255
        }
      }
      nctx.putImageData(nimg, 0, 0)
      rctx.putImageData(rimg, 0, 0)
    }
    knurlCache = { normal, roughness: rough }
  }
  if (knurlTextures === null) {
    const make = (canvas: HTMLCanvasElement): THREE.CanvasTexture => {
      const texture = new THREE.CanvasTexture(canvas)
      texture.wrapS = THREE.RepeatWrapping
      texture.wrapT = THREE.ClampToEdgeWrapping
      texture.anisotropy = 8
      return shared(texture)
    }
    knurlTextures = { normal: make(knurlCache.normal), roughness: make(knurlCache.roughness) }
  }
  return knurlTextures
}

/** Around-the-barrel position of the etched wordmark (0 and 1 are the clip line). */
const ETCH_V = 0.13

/**
 * Barrel colour and roughness maps in the barrel's axial UV space (U along
 * the tube from the ring to the cap, V around it). The wordmark is laser
 * etched beside the clip line: lighter metal showing through the
 * finish, a little rougher than the surface around it. Fine axial grain
 * runs the full length.
 */
export function createBarrelMaps(
  finishColor: string,
  etchColor: string,
  scale = 1,
): { map: THREE.CanvasTexture; roughness: THREE.CanvasTexture } {
  const k = scale
  const w = Math.round(2048 * k)
  const h = Math.round(704 * k)
  const draw = (base: string, ink: string, grain: boolean) => {
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (ctx === null) return canvas
    ctx.fillStyle = base
    ctx.fillRect(0, 0, w, h)
    if (grain) {
      for (let y = 0; y < h; y += 1) {
        const v = 128 + Math.floor((rand() - 0.5) * 44)
        ctx.fillStyle = `rgb(${v},${v},${v})`
        ctx.globalAlpha = 0.55
        ctx.fillRect(0, y, w, 1)
      }
      ctx.globalAlpha = 1
    }
    // Wordmark band a little round from the clip (V = 0 is the clip line),
    // so it faces the camera in the hero three-quarter and the grip close-up
    // instead of hiding behind the barrel. Reads tip to crown; the canvas is
    // mirrored on Y so the etch reads correctly from outside.
    ctx.save()
    ctx.translate(0, h)
    ctx.scale(1, -1)
    ctx.fillStyle = ink
    ctx.textBaseline = 'middle'
    ctx.font = `600 ${50 * k}px "Archivo Variable", "Geist Variable", sans-serif`
    const mid = h * ETCH_V
    const tracked = (text: string, x: number, spacing: number) => {
      let cx = x
      for (const ch of text) {
        ctx.fillText(ch, cx, mid)
        cx += ctx.measureText(ch).width + spacing
      }
      return cx
    }
    const end = tracked('AETHER GRAPH', w * 0.46, 9 * k)
    ctx.font = `500 ${42 * k}px "Geist Mono Variable", monospace`
    tracked('0.5', end + 46 * k, 4 * k)
    ctx.fillRect(w * 0.46 - 70 * k, mid - 1.5 * k, 44 * k, 3 * k)
    ctx.font = `500 ${30 * k}px "Geist Mono Variable", monospace`
    tracked('HB 0.5 MM', w * 0.12, 6 * k)
    ctx.restore()
    return canvas
  }
  const map = new THREE.CanvasTexture(draw(finishColor, etchColor, false))
  map.colorSpace = THREE.SRGBColorSpace
  map.anisotropy = 8
  const roughness = new THREE.CanvasTexture(draw('#6b6b6b', '#a6a6a6', true))
  roughness.anisotropy = 8
  return { map, roughness }
}

/** Axial brushed grain for the anodised barrel: fine vertical streaks. */
export function createBrushedTexture(): THREE.CanvasTexture {
  if (brushedTexture !== null) return brushedTexture
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
  brushedTexture = shared(texture)
  return brushedTexture
}

/** Fine speckle for the eraser rubber so it never reads as plastic. */
export function createEraserTexture(): THREE.CanvasTexture {
  if (eraserTexture !== null) return eraserTexture
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
  eraserTexture = shared(texture)
  return eraserTexture
}
