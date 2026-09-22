import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

export type ScreenMode = 'off' | 'boot' | 'wallpaper' | 'viewfinder' | 'os' | 'ai'

interface LiveScreenProps {
  texture: THREE.CanvasTexture
  modeRef: { current: ScreenMode }
  brightnessRef: { current: number }
  runningRef: { current: boolean }
}

function paint(
  ctx: CanvasRenderingContext2D,
  mode: ScreenMode,
  t: number,
  brightness: number,
): void {
  const w = 256
  const h = 512
  ctx.fillStyle = '#02040a'
  ctx.fillRect(0, 0, w, h)
  if (mode === 'off') return
  const dim = 0.35 + brightness * 0.65
  if (mode === 'boot') {
    ctx.fillStyle = `rgba(240,245,252,${0.85 * dim})`
    ctx.font = '600 28px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('A E T H E R', w / 2, h / 2)
    return
  }
  const gradient = ctx.createLinearGradient(0, 0, 0, h)
  gradient.addColorStop(0, '#0a1322')
  gradient.addColorStop(0.45, '#0d1c33')
  gradient.addColorStop(1, '#0a1220')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, w, h)
  const glow = ctx.createRadialGradient(150, 150, 20, 150, 150, 220)
  glow.addColorStop(0, `rgba(127,180,255,${0.5 * dim})`)
  glow.addColorStop(1, 'rgba(127,180,255,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, w, h)
  if (mode === 'viewfinder') {
    ctx.strokeStyle = `rgba(240,246,255,${0.8 * dim})`
    ctx.lineWidth = 3
    ctx.strokeRect(24, 120, w - 48, 240)
    ctx.fillStyle = `rgba(127,180,255,${0.9 * dim})`
    ctx.beginPath()
    ctx.arc(w / 2 + Math.sin(t * 0.8) * 20, 240, 10, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = `rgba(240,246,255,${0.7 * dim})`
    ctx.font = '500 20px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('1x · 50 MP', w / 2, 400)
    return
  }
  if (mode === 'os') {
    ctx.fillStyle = `rgba(240,246,255,${0.9 * dim})`
    ctx.font = '600 44px sans-serif'
    ctx.textAlign = 'center'
    const hours = new Date().getHours().toString().padStart(2, '0')
    ctx.fillText(`${hours}:09`, w / 2, 120)
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        ctx.fillStyle = `rgba(127,180,255,${(0.25 + ((row + col) % 3) * 0.15) * dim})`
        ctx.beginPath()
        ctx.roundRect(28 + col * 56, 170 + row * 62, 40, 40, 10)
        ctx.fill()
      }
    }
    return
  }
  if (mode === 'ai') {
    ctx.fillStyle = `rgba(127,180,255,${(0.5 + 0.3 * Math.sin(t * 2)) * dim})`
    ctx.beginPath()
    ctx.arc(w / 2, h / 2 - 40, 54, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = `rgba(4,8,14,${dim})`
    ctx.font = '500 22px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('On-device', w / 2, h / 2 + 80)
    return
  }
  // wallpaper
  ctx.fillStyle = `rgba(240,246,255,${0.9 * dim})`
  ctx.beginPath()
  ctx.arc(178, 96, 26, 0, Math.PI * 2)
  ctx.fill()
}

/**
 * Live display painter. Redraws at roughly 9fps into the shared texture,
 * pauses when the document hides or the stage leaves the viewport.
 */
export function LiveScreen({ texture, modeRef, brightnessRef, runningRef }: LiveScreenProps) {
  const tick = useMemo(() => ({ acc: 0 }), [])
  useEffect(() => {
    let frame = 0
    let last = performance.now()
    const canvas = texture.image as HTMLCanvasElement
    const ctx = canvas.getContext('2d')
    const loop = (now: number) => {
      frame = requestAnimationFrame(loop)
      if (!runningRef.current || document.hidden || ctx === null) {
        last = now
        return
      }
      tick.acc += (now - last) / 1000
      last = now
      if (tick.acc < 0.11) return
      tick.acc = 0
      paint(ctx, modeRef.current, now / 1000, brightnessRef.current)
      texture.needsUpdate = true
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [texture, modeRef, brightnessRef, runningRef, tick])
  return null
}

export function useScreenRefs(): {
  modeRef: { current: ScreenMode }
  brightnessRef: { current: number }
  runningRef: { current: boolean }
} {
  const modeRef = useRef<ScreenMode>('wallpaper')
  const brightnessRef = useRef(0.6)
  const runningRef = useRef(true)
  return { modeRef, brightnessRef, runningRef }
}
