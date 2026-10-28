import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import { loaderPencilMarkup } from './src/loader/loaderMarkup.ts'

// GitHub Pages serves the site from /aether-graph/; the Pages workflow sets
// BASE_PATH. Everything else (dev, verify, CI e2e) builds for the root.
const base = process.env.BASE_PATH ?? '/'

/** The parts of a bundle chunk the loader manifest reads. */
interface BundleItem {
  type: string
  fileName: string
  code?: string
  imports?: string[]
  isEntry?: boolean
  facadeModuleId?: string | null
}

/**
 * Files each route needs beyond the entry, with their exact byte sizes, so
 * the loading page can show real download progress (src/loader/assets.ts).
 */
function routeAssets(bundle: Record<string, unknown>): Record<string, Array<[string, number]>> {
  const chunks = Object.values(bundle as Record<string, BundleItem>).filter(
    (c) => c.type === 'chunk',
  )
  const byFile = new Map(chunks.map((c) => [c.fileName, c]))
  const closure = (start: BundleItem | undefined, into: Set<string>): Set<string> => {
    if (start === undefined || into.has(start.fileName)) return into
    into.add(start.fileName)
    for (const file of start.imports ?? []) closure(byFile.get(file), into)
    return into
  }
  const shared = closure(
    chunks.find((c) => c.isEntry === true),
    new Set(),
  )
  const filesFor = (...patterns: RegExp[]): Array<[string, number]> => {
    const files = new Set<string>()
    for (const pattern of patterns) {
      const chunk = chunks.find((c) => pattern.test(c.facadeModuleId ?? ''))
      closure(chunk, files)
    }
    return [...files]
      .filter((file) => !shared.has(file))
      .map((file): [string, number] => [file, Buffer.byteLength(byFile.get(file)?.code ?? '')])
  }
  return {
    '/': filesFor(
      /[\\/]src[\\/]pages[\\/]HomePage\.tsx$/,
      /[\\/]src[\\/]film[\\/]FilmCanvas\.tsx$/,
    ),
    '/specifications': filesFor(/[\\/]src[\\/]pages[\\/]SpecificationsPage\.tsx$/),
  }
}

/**
 * Loading page: the pencil drawing (built from the same profile as the 3D
 * model) goes into index.html in dev and build; the asset manifest only
 * exists in a build, so dev falls back to milestone-only progress.
 */
function loadingPage(): Plugin {
  return {
    name: 'aether-loading-page',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const withPencil = html.replace('<!--ag-loader-pencil-->', loaderPencilMarkup())
        const manifest =
          ctx.bundle === undefined
            ? ''
            : `<script type="application/json" id="ag-assets">${JSON.stringify(routeAssets(ctx.bundle))}</script>`
        return withPencil.replace('<!--ag-assets-->', manifest)
      },
    },
    // The HTML hook sees chunk code before Vite's last rewrites, so its sizes
    // can be a few hundred bytes short. Rewrite them from the written files.
    writeBundle(options) {
      const dir = options.dir
      if (dir === undefined) return
      const indexPath = join(dir, 'index.html')
      let html: string
      try {
        html = readFileSync(indexPath, 'utf8')
      } catch {
        return
      }
      const re = /(<script type="application\/json" id="ag-assets">)([\s\S]*?)(<\/script>)/
      const match = re.exec(html)
      if (match === null || match[2] === undefined) return
      const assets = JSON.parse(match[2]) as Record<string, Array<[string, number]>>
      for (const files of Object.values(assets)) {
        for (const entry of files) entry[1] = statSync(join(dir, entry[0])).size
      }
      writeFileSync(indexPath, html.replace(re, `$1${JSON.stringify(assets)}$3`))
    },
  }
}

export default defineConfig({
  base,
  plugins: [react(), tailwindcss(), loadingPage()],
  build: {
    rolldownOptions: {
      output: {
        advancedChunks: {
          // React gets its own chunk at the highest priority. Groups capture
          // their matches' dependencies, so without it React landed inside
          // the r3f chunk and every page imported r3f, and with it all of
          // three.js, before the app could even render.
          groups: [
            {
              name: 'react',
              test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              priority: 3,
            },
            { name: 'three', test: /node_modules[\\/]three[\\/]/, priority: 2 },
            { name: 'r3f', test: /node_modules[\\/]@react-three[\\/]/, priority: 1 },
          ],
        },
      },
    },
  },
})
