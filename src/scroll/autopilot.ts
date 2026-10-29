import { ACT_NAMES } from '../film/overlay/ActRuler.tsx'
import type { ActId } from '../film/key.ts'
import { TEARDOWN_COPY } from '../film/chapters.ts'
import { scrollToY } from './smooth.ts'
import { tourFrom, tourPosition, type TourStop } from './tour.ts'

/**
 * Autopilot: plays the page's animated parts by scrolling them, so every
 * scroll-driven effect runs exactly as it would by hand. Film acts are
 * held where their notes are fully written; the exploded parts are visited
 * one by one; then the craft beats, the four finishes, and the purchase.
 * Any wheel, touch, pointer or navigation key hands control straight back.
 */

/** Film stops in runway progress, with travel and hold in seconds. */
const FILM: Array<{ p: number; travel: number; hold: number; act: ActId; label?: string }> = [
  { p: 0.035, travel: 1.4, hold: 2.6, act: 'hero' },
  { p: 0.2, travel: 5, hold: 2.8, act: 'detail' },
  { p: 0.296, travel: 3.4, hold: 1.6, act: 'exploded' },
  ...Array.from({ length: 10 }, (_, i) => ({
    p: 0.3 + 0.016 * (i + 0.55),
    travel: i === 0 ? 1.2 : 1,
    hold: 0.75,
    act: 'exploded' as const,
    label: TEARDOWN_COPY[i]?.kicker,
  })),
  { p: 0.56, travel: 4.6, hold: 2.6, act: 'xray' },
  { p: 0.69, travel: 5, hold: 2.8, act: 'mechanism' },
  { p: 0.82, travel: 4.6, hold: 2.8, act: 'reassembly' },
  { p: 0.962, travel: 5.4, hold: 2.8, act: 'final' },
]

const docTop = (el: Element) => el.getBoundingClientRect().top + window.scrollY
const navH = () => Number.parseFloat(getComputedStyle(document.documentElement).fontSize) * 4.5

/** The tour, measured from the page as it is laid out now. */
export function buildTour(): TourStop[] {
  const vh = window.innerHeight
  const stops: TourStop[] = []
  const runway = document.querySelector('[data-testid="film-runway"]')
  if (runway !== null) {
    const top = docTop(runway)
    const span = runway.getBoundingClientRect().height - vh
    for (const s of FILM) {
      stops.push({
        y: top + s.p * span,
        travel: s.travel,
        hold: s.hold,
        label: s.label ?? ACT_NAMES[s.act],
      })
    }
  }
  const craft = document.querySelector('[data-testid="craft"]')
  if (craft !== null) {
    const top = docTop(craft)
    const span = craft.getBoundingClientRect().height - vh
    for (const v of [0.17, 0.5, 0.83]) {
      stops.push({ y: top + v * span, travel: v === 0.17 ? 3 : 1.6, hold: 2.6, label: 'Craft' })
    }
  }
  document.querySelectorAll<HTMLElement>('#finishes [data-finish]').forEach((panel, i) => {
    const rect = panel.getBoundingClientRect()
    const name = panel.querySelector('h3')?.textContent ?? 'Finishes'
    stops.push({
      y: docTop(panel) + rect.height / 2 - vh / 2,
      travel: i === 0 ? 2.6 : 1.5,
      hold: 2.2,
      label: name,
    })
  })
  const buy = document.getElementById('buy')
  if (buy !== null) stops.push({ y: docTop(buy) - navH(), travel: 2.4, hold: 0, label: 'Buy' })
  // Never ask the page to scroll backwards or past its end.
  const max = document.documentElement.scrollHeight - vh
  let floor = -Infinity
  return stops
    .map((s) => ({ ...s, y: Math.min(max, Math.max(0, s.y)) }))
    .filter((s) => {
      const ok = s.y >= floor
      if (ok) floor = s.y
      return ok
    })
}

export interface AutopilotState {
  playing: boolean
  label: string
}

let state: AutopilotState = { playing: false, label: '' }
const listeners = new Set<() => void>()
const frameListeners = new Set<(fraction: number) => void>()
let raf = 0
let started = 0
let startY = 0
let stops: TourStop[] = []

function setState(next: AutopilotState): void {
  if (next.playing === state.playing && next.label === state.label) return
  state = next
  for (const l of listeners) l()
}

export function subscribeAutopilot(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getAutopilot(): AutopilotState {
  return state
}

/** Per-frame tour fraction, for a progress bar written straight to the DOM. */
export function onAutopilotFrame(listener: (fraction: number) => void): () => void {
  frameListeners.add(listener)
  return () => frameListeners.delete(listener)
}

const PASS_KEYS = new Set(['Tab', 'Shift', 'Control', 'Alt', 'Meta', 'CapsLock'])

function insideControl(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest('[data-autopilot-control]') !== null
}

function interrupt(event: Event): void {
  if (insideControl(event.target)) return
  if (event instanceof KeyboardEvent && PASS_KEYS.has(event.key)) return
  stopAutopilot()
}

const EVENTS = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const

function step(now: number): void {
  const pos = tourPosition(stops, startY, (now - started) / 1000)
  scrollToY(pos.y, true)
  for (const l of frameListeners) l(pos.fraction)
  setState({ playing: true, label: stops[pos.stop]?.label ?? '' })
  if (pos.done) {
    stopAutopilot()
    return
  }
  raf = requestAnimationFrame(step)
}

export function startAutopilot(): void {
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  } catch {
    return
  }
  stopAutopilot()
  startY = window.scrollY
  stops = tourFrom(buildTour(), startY)
  if (stops.length === 0) return
  started = performance.now()
  for (const type of EVENTS) window.addEventListener(type, interrupt, { passive: true })
  setState({ playing: true, label: stops[0]?.label ?? '' })
  raf = requestAnimationFrame(step)
}

export function stopAutopilot(): void {
  cancelAnimationFrame(raf)
  for (const type of EVENTS) window.removeEventListener(type, interrupt)
  setState({ playing: false, label: '' })
}
