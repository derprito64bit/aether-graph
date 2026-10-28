import { describe, expect, it } from 'vitest'
import {
  allDone,
  bytesLabel,
  planTasks,
  progressOf,
  statusOf,
  stepDisplay,
  type LoaderTask,
} from './progress.ts'

const HOME = { path: '/', webgl: true, reducedMotion: false, noGl: false }

describe('loading-page progress', () => {
  it('plans the 3D scene only where the film will run', () => {
    expect(planTasks(HOME)).toContain('scene')
    expect(planTasks({ ...HOME, path: '/specifications' })).not.toContain('scene')
    expect(planTasks({ ...HOME, webgl: false })).not.toContain('scene')
    expect(planTasks({ ...HOME, reducedMotion: true })).not.toContain('scene')
    expect(planTasks({ ...HOME, noGl: true })).not.toContain('scene')
    expect(planTasks({ ...HOME, hash: '#buy' })).not.toContain('scene')
  })

  it('reaches exactly 1 when every planned task is done, whatever the plan', () => {
    for (const plan of [planTasks(HOME), planTasks({ ...HOME, path: '/specifications' })]) {
      const full = Object.fromEntries(plan.map((t) => [t, 1])) as Record<LoaderTask, number>
      expect(progressOf(full, plan)).toBe(1)
      expect(allDone(full, plan)).toBe(true)
      expect(progressOf({}, plan)).toBe(0)
    }
  })

  it('weights the 3D download as most of a first visit', () => {
    const plan = planTasks(HOME)
    const half = progressOf({ boot: 1, assets: 0.5 }, plan)
    expect(half).toBeGreaterThan(0.3)
    expect(half).toBeLessThan(0.4)
  })

  it('eases toward the target, never past it, never backwards', () => {
    let v = 0
    for (let i = 0; i < 400; i++) {
      const next = stepDisplay(v, 0.6, 1 / 60)
      expect(next).toBeGreaterThanOrEqual(v)
      expect(next).toBeLessThanOrEqual(0.6)
      v = next
    }
    expect(v).toBeCloseTo(0.6, 6)
    expect(stepDisplay(0.7, 0.5, 1 / 60)).toBe(0.7)
  })

  it('names whatever is still running', () => {
    const plan = planTasks(HOME)
    expect(statusOf({ boot: 1 }, plan, '/')).toBe('Downloading the 3D engine')
    expect(statusOf({ boot: 1, assets: 1 }, plan, '/')).toBe('Setting the type')
    expect(statusOf({ boot: 1, assets: 1, fonts: 1, route: 1, scene: 0.2 }, plan, '/')).toBe(
      'Building the pencil',
    )
    expect(statusOf({ boot: 1, assets: 1, fonts: 1, route: 1, scene: 0.5 }, plan, '/')).toBe(
      'Compiling shaders',
    )
    expect(statusOf({ boot: 1, assets: 1, fonts: 1, route: 1, scene: 1 }, plan, '/')).toBe('Ready')
  })

  it('formats the byte counter in whole kilobytes', () => {
    expect(bytesLabel(421_888, 1_349_632)).toBe('412 of 1,318 KB')
    expect(bytesLabel(2_000_000, 1_000_000)).toBe('977 of 977 KB')
  })
})
