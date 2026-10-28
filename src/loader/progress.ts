/**
 * Loading-page progress model. Pure: no DOM, no timers. The controller in
 * loader.ts feeds it task fractions and draws whatever it returns.
 *
 * Progress is honest: every task is a real piece of work with a measured
 * fraction (bytes streamed, a promise settled, a frame rendered), weighted
 * by roughly how long it takes on a typical first visit. Tasks a page never
 * runs (no 3D on the specifications page, no WebGL, reduced motion) are left
 * out of the plan, so the bar still ends at exactly 100.
 */

export type LoaderTask = 'boot' | 'assets' | 'fonts' | 'route' | 'scene'

/** Relative weight of each task. The 3D engine download dominates a first visit. */
export const TASK_WEIGHT: Record<LoaderTask, number> = {
  boot: 6,
  assets: 56,
  fonts: 6,
  route: 8,
  scene: 24,
}

/** Order the status line reports tasks in. */
const STATUS_ORDER: readonly LoaderTask[] = ['assets', 'fonts', 'route', 'scene']

export interface LoaderPlanInput {
  /** Path inside the site base, e.g. '/' or '/specifications'. */
  path: string
  webgl: boolean
  reducedMotion: boolean
  /** ?nogl forces the static story. */
  noGl: boolean
}

/** Tasks the current page will actually run. */
export function planTasks(input: LoaderPlanInput): LoaderTask[] {
  const tasks: LoaderTask[] = ['boot', 'assets', 'fonts', 'route']
  const film = input.path === '/' && input.webgl && !input.reducedMotion && !input.noGl
  if (film) tasks.push('scene')
  return tasks
}

export type TaskFractions = Partial<Record<LoaderTask, number>>

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v))
}

/** Weighted progress 0..1 over the planned tasks. */
export function progressOf(fractions: TaskFractions, tasks: readonly LoaderTask[]): number {
  let total = 0
  let done = 0
  for (const task of tasks) {
    total += TASK_WEIGHT[task]
    done += TASK_WEIGHT[task] * clamp01(fractions[task] ?? 0)
  }
  return total > 0 ? done / total : 1
}

/** Every planned task has finished. */
export function allDone(fractions: TaskFractions, tasks: readonly LoaderTask[]): boolean {
  return tasks.every((task) => (fractions[task] ?? 0) >= 1)
}

/**
 * Next displayed value. Eases toward the target (so a finished download
 * reads as a sweep, not a jump), keeps a minimum pace so it never crawls
 * near the end, never passes the target, and never moves backwards.
 */
export function stepDisplay(display: number, target: number, dtSeconds: number): number {
  if (target <= display) return display
  const gap = target - display
  const eased = gap * (1 - Math.exp(-dtSeconds * 7))
  const floor = Math.min(gap, dtSeconds * 0.35)
  return display + Math.max(eased, floor)
}

/** Status line for whichever planned task is still running. */
export function statusOf(
  fractions: TaskFractions,
  tasks: readonly LoaderTask[],
  path: string,
): string {
  for (const task of STATUS_ORDER) {
    if (!tasks.includes(task)) continue
    const f = fractions[task] ?? 0
    if (f >= 1) continue
    if (task === 'assets') return path === '/' ? 'Downloading the 3D engine' : 'Loading the page'
    if (task === 'fonts') return 'Setting the type'
    if (task === 'route') return 'Building the page'
    if (f < 0.15) return 'Starting WebGL'
    if (f < 0.35) return 'Building the pencil'
    if (f < 0.85) return 'Compiling shaders'
    return 'Rendering the first frame'
  }
  return 'Ready'
}

/** "412 of 1,318 KB" for the byte counter. */
export function bytesLabel(loaded: number, total: number): string {
  const kb = (n: number): string => Math.round(n / 1024).toLocaleString('en-US')
  return `${kb(Math.min(loaded, total))} of ${kb(total)} KB`
}
