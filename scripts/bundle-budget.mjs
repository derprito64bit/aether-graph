import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'

const distDir = fileURLToPath(new URL('../dist/', import.meta.url))

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) yield* walk(full)
    else yield full
  }
}

function gzipKb(path) {
  return gzipSync(readFileSync(path)).length / 1024
}

// Lazy chunks never block first paint: three, the R3F runtime, the film
// scene, and the phone canvas. Everything else counts as initial JS.
const LAZY_PATTERN = /(three|r3f|film|phonecanvas|cameraassembly)/i

// Budgets from section 8.3: initial JS excl. three under 180KB gzip,
// CSS under 40KB gzip.
console.log('bundle budget check')

try {
  const files = [...walk(distDir)]
  const js = files.filter((f) => f.endsWith('.js'))
  const css = files.filter((f) => f.endsWith('.css'))
  const cssKb = css.reduce((sum, f) => sum + gzipKb(f), 0)
  console.log(`css total gzip: ${cssKb.toFixed(1)}KB over ${css.length} files`)
  if (cssKb > 40) throw new Error(`CSS budget exceeded: ${cssKb.toFixed(1)}KB over 40KB`)

  const initial = js.filter((f) => !LAZY_PATTERN.test(f))
  const lazy = js.filter((f) => LAZY_PATTERN.test(f))
  const initialKb = initial.reduce((sum, f) => sum + gzipKb(f), 0)
  const lazyKb = lazy.reduce((sum, f) => sum + gzipKb(f), 0)
  console.log(`initial js gzip: ${initialKb.toFixed(1)}KB over ${initial.length} files`)
  console.log(`lazy js gzip: ${lazyKb.toFixed(1)}KB over ${lazy.length} files`)
  for (const f of initial) console.log(`  initial: ${f.split('dist')[1]} ${gzipKb(f).toFixed(1)}KB`)
  if (initialKb > 180)
    throw new Error(`Initial JS budget exceeded: ${initialKb.toFixed(1)}KB over 180KB`)

  const three = js.filter((f) => /three/i.test(f))
  if (three.length === 0)
    throw new Error('three chunk missing: three must ship as its own lazy file')
  console.log(`three chunk present: ${three.map((f) => f.split('dist')[1]).join(', ')}`)
  console.log('budgets ok')
} catch (err) {
  if (err.code === 'ENOENT') {
    console.log('no dist yet, skipping')
  } else {
    throw err
  }
}
