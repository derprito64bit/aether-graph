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

const FORBIDDEN = [
  /fetch\s*\(\s*['"]https?:/u,
  /new\s+EventSource\s*\(\s*['"]https?:/u,
  /new\s+WebSocket\s*\(\s*['"]https?:/u,
  /<img[^>]+src\s*=\s*["']https?:/iu,
  /<script[^>]+src\s*=\s*["']https?:/iu,
  /url\(\s*['"]?https?:/iu,
  /\bfrom\s+['"]https?:/u,
]

/** Zero third-party runtime requests. Canonical metadata is allowed. */
describe('no third-party runtime', () => {
  it('has no fetchable remote URLs in src, public, or index.html', () => {
    const roots = ['src', 'public', 'index.html']
    const hits: string[] = []
    for (const root of roots) {
      let files: string[] = []
      try {
        const st = statSync(root)
        files = st.isDirectory() ? [...walk(root)] : [root]
      } catch {
        continue
      }
      for (const file of files) {
        if (!/\.(tsx?|css|html|svg)$/.test(file)) continue
        const content = readFileSync(file, 'utf8')
        for (const pattern of FORBIDDEN) {
          if (pattern.test(content)) hits.push(`${file}: ${String(pattern)}`)
        }
      }
    }
    expect(hits).toEqual([])
  })
})
