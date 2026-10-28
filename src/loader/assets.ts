import { completeTask, reportBytes, reportTask } from './loader.ts'

/**
 * Route asset preloading with real byte progress. A build writes the files
 * each route needs (beyond the entry) and their exact sizes into index.html
 * (vite.config.ts). Streaming them here counts bytes as they arrive and
 * fills the HTTP cache, so the route's own import() that follows is served
 * from cache. Without a manifest (dev) it resolves at once and the route's
 * import marks the task done instead.
 */

type Manifest = Record<string, Array<[string, number]>>

let manifest: Manifest | null | undefined
const inflight = new Map<string, Promise<void>>()

function readManifest(): Manifest | null {
  if (manifest !== undefined) return manifest
  try {
    const el = document.getElementById('ag-assets')
    manifest = el?.textContent ? (JSON.parse(el.textContent) as Manifest) : null
  } catch {
    manifest = null
  }
  return manifest
}

async function stream(url: string, onBytes: (n: number) => void): Promise<void> {
  const response = await fetch(url)
  if (!response.ok || response.body === null) {
    onBytes(0)
    return
  }
  const reader = response.body.getReader()
  for (;;) {
    const { done, value } = await reader.read()
    if (done) return
    onBytes(value.byteLength)
  }
}

/**
 * Downloads a route's files once, reporting progress to the loading page.
 * Never rejects: a failed prefetch only means the import fetches normally.
 */
export function preloadRoute(path: string): Promise<void> {
  const existing = inflight.get(path)
  if (existing !== undefined) return existing
  const files = readManifest()?.[path] ?? []
  const total = files.reduce((sum, [, size]) => sum + size, 0)
  let loaded = 0
  const base = import.meta.env.BASE_URL
  const job =
    total === 0
      ? Promise.resolve()
      : Promise.all(
          files.map(([file]) =>
            stream(`${base}${file}`, (n) => {
              loaded += n
              reportBytes(loaded, total)
              reportTask('assets', loaded / total)
            }).catch(() => undefined),
          ),
        ).then(() => undefined)
  inflight.set(path, job)
  return job
}

/**
 * Wraps a route's lazy import: assets first (with progress), then the
 * module, then the assets task is done whatever the manifest said.
 */
export function loadRoute<T>(path: string, load: () => Promise<T>): () => Promise<T> {
  return () =>
    preloadRoute(path)
      .then(load)
      .then((mod) => {
        completeTask('assets')
        return mod
      })
}
