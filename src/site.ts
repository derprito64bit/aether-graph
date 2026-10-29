/**
 * Where the site is mounted. `/` locally and in CI; `/aether-graph-prompting-design-test/` on
 * GitHub Pages (vite.config.ts `base`). Every root-relative URL the app
 * writes itself (meta tags, history entries, plain anchors) goes through
 * withBase; router links get the base from BrowserRouter's basename.
 */
export const BASE_URL = import.meta.env.BASE_URL

/** Router basename: the base without its trailing slash ('' at the root). */
export const ROUTER_BASENAME = BASE_URL.replace(/\/$/, '')

/** Prefixes a root-relative path ('/og/home.svg', '/?t=0.2') with the base. */
export function withBase(path: string): string {
  return `${ROUTER_BASENAME}${path.startsWith('/') ? path : `/${path}`}`
}

/** Absolute URL on the current host, base included. */
export function absoluteUrl(path: string): string {
  return `${window.location.origin}${withBase(path)}`
}
