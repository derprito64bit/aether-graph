import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) yield* walk(full)
    else yield full
  }
}

/** No drei imports in app code (invariant 6): custom geometry instead. */
describe('no drei dependency', () => {
  it('imports nothing from @react-three/drei anywhere under src', () => {
    const hits: string[] = []
    for (const file of walk('src')) {
      if (!/\.(tsx?|css)$/.test(file)) continue
      if (file.endsWith('no-drei.test.ts')) continue
      const content = readFileSync(file, 'utf8')
      if (/@react-three\/drei/.test(content)) hits.push(file)
    }
    expect(hits).toEqual([])
  })
})
