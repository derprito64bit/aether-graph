import { copyFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// GitHub Pages has no SPA rewrites. Two copies of the built index.html stand
// in for them:
// - 404.html: any unknown path boots the app, and the router renders the
//   site's own not-found page (served with a real 404 status).
// - <route>.html: Pages serves /aether-graph/specifications from
//   specifications.html with a 200, so deep links and refreshes work.
const ROUTES = ['specifications']

const dist = fileURLToPath(new URL('../dist/', import.meta.url))
const index = `${dist}index.html`
if (!existsSync(index)) throw new Error('dist/index.html missing: run the build first')

copyFileSync(index, `${dist}404.html`)
for (const route of ROUTES) copyFileSync(index, `${dist}${route}.html`)
console.log(`pages fallback: 404.html + ${ROUTES.map((r) => `${r}.html`).join(', ')}`)
