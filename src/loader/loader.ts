import {
  allDone,
  bytesLabel,
  planTasks,
  progressOf,
  statusOf,
  stepDisplay,
  type LoaderTask,
  type TaskFractions,
} from './progress.ts'

/**
 * Loading-page controller. index.html paints the pencil and runs the boot
 * half (window.__agl); this module takes over as soon as the app bundle
 * runs: it owns the task fractions, eases the bar toward the real progress,
 * names the running stage, and hands the page over when every planned task
 * has finished. Nothing here touches React state.
 */

interface BootApi {
  v: number
  boot: boolean
  done: boolean
  render: (v: number) => void
  status: (text: string, detail?: string) => void
  finish: (onRevealed?: () => void) => void
}

declare global {
  interface Window {
    __agl?: BootApi
  }
}

/** Never hold a visitor on the loading page longer than this. */
const SAFETY_MS = 15000

const fractions: TaskFractions = {}
let tasks: LoaderTask[] = []
let path = '/'
let display = 0
let last = 0
let raf = 0
let started = false
let revealed = false
let bytes: { loaded: number; total: number } | null = null
const waiting: Array<() => void> = []

function webglAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return canvas.getContext('webgl2') !== null || canvas.getContext('webgl') !== null
  } catch {
    return false
  }
}

function sitePath(): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  const p = window.location.pathname
  const inside = base !== '' && p.startsWith(base) ? p.slice(base.length) : p
  return inside === '' ? '/' : inside
}

function reveal(): void {
  if (revealed) return
  revealed = true
  for (const cb of waiting.splice(0)) cb()
}

function tick(now: number): void {
  const api = window.__agl
  if (api === undefined || api.done) return
  const dt = Math.min(0.1, (now - last) / 1000)
  last = now
  const target = progressOf(fractions, tasks)
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  display = reduced ? Math.max(display, target) : stepDisplay(display, target, dt)
  api.render(display)
  const assetsRunning = (fractions.assets ?? 0) < 1 && bytes !== null && bytes.total > 0
  api.status(
    statusOf(fractions, tasks, path),
    assetsRunning && bytes !== null ? bytesLabel(bytes.loaded, bytes.total) : '',
  )
  if (allDone(fractions, tasks) && display >= 0.999) {
    api.finish(reveal)
    return
  }
  raf = requestAnimationFrame(tick)
}

/**
 * Takes over from the boot script. Called once from main.tsx before React
 * renders; plans the tasks this page will run and starts the font load.
 */
export function startLoader(): void {
  if (started) return
  started = true
  const api = window.__agl
  if (api === undefined || api.done) {
    reveal()
    return
  }
  api.boot = false
  display = api.v
  path = sitePath()
  const params = new URLSearchParams(window.location.search)
  tasks = planTasks({
    path,
    webgl: webglAvailable(),
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    noGl: params.has('nogl'),
  })
  completeTask('boot')
  // Load the faces the first screen sets, so the page never reveals mid-swap.
  const faces = [
    '600 16px "Archivo Variable"',
    '16px "Geist Variable"',
    '16px "Geist Mono Variable"',
  ]
  Promise.all(faces.map((face) => document.fonts.load(face)))
    .catch(() => undefined)
    .then(() => completeTask('fonts'))
  window.setTimeout(() => {
    for (const task of tasks) fractions[task] = 1
  }, SAFETY_MS)
  last = performance.now()
  raf = requestAnimationFrame(tick)
}

/** Reports partial progress on a task (0..1). Never moves a task backwards. */
export function reportTask(task: LoaderTask, fraction: number): void {
  const prev = fractions[task] ?? 0
  if (fraction > prev) fractions[task] = Math.min(1, fraction)
}

/** Marks a task finished. Tasks outside the page's plan are ignored. */
export function completeTask(task: LoaderTask): void {
  fractions[task] = 1
}

/** Byte counter for the asset download, shown beside the status line. */
export function reportBytes(loaded: number, total: number): void {
  bytes = { loaded, total }
}

/** True while the loading page covers the site. */
export function isLoading(): boolean {
  return !revealed && window.__agl !== undefined && !window.__agl.done
}

/** Runs `cb` when the page is revealed (immediately if it already is). */
export function onRevealed(cb: () => void): void {
  if (revealed || window.__agl === undefined) cb()
  else waiting.push(cb)
}

/** Test hook: stops the loop (unit tests and hot reload). */
export function stopLoader(): void {
  cancelAnimationFrame(raf)
}
