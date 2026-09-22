import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Meta prompt section 8.9: src/lib/ is pure math that imports neither
 * React nor three. Enforced here (lint has no such rule) so a UI or
 * renderer dependency can never sneak into the portable core.
 */
describe('lib boundary', () => {
  it('keeps every lib module free of react and three imports', () => {
    const dir = join(process.cwd(), 'src', 'lib')
    const offenders: string[] = []
    for (const file of readdirSync(dir)) {
      if (!file.endsWith('.ts') || file.endsWith('.test.ts')) continue
      const source = readFileSync(join(dir, file), 'utf8')
      for (const line of source.split('\n')) {
        const forbidden =
          /from\s+['"]react['"]/.test(line) ||
          /from\s+['"]react-dom['"]/.test(line) ||
          /from\s+['"]three['"]/.test(line) ||
          /from\s+['"]@react-three\//.test(line)
        if (forbidden) offenders.push(`${file}: ${line.trim()}`)
      }
    }
    expect(offenders).toEqual([])
  })
})
