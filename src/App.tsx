import { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router'
import { RouteErrorBoundary } from './components/RouteErrorBoundary.tsx'
import { ScrollManager } from './components/ScrollManager.tsx'
import { PencilConfigProvider } from './components/PencilViewer/PencilConfig.tsx'
import { ROUTER_BASENAME } from './site.ts'
import { loadRoute } from './loader/assets.ts'
import { completeTask } from './loader/loader.ts'
import { Footer } from './components/layout/Footer.tsx'
import { Navbar } from './components/layout/Navbar.tsx'

const HomePage = lazy(
  loadRoute('/', () => import('./pages/HomePage.tsx').then((m) => ({ default: m.HomePage }))),
)
const SpecificationsPage = lazy(
  loadRoute('/specifications', () =>
    import('./pages/SpecificationsPage.tsx').then((m) => ({ default: m.SpecificationsPage })),
  ),
)
const NotFoundPage = lazy(
  loadRoute('*', () =>
    import('./pages/NotFoundPage.tsx').then((m) => ({ default: m.NotFoundPage })),
  ),
)
const DevZoomPage = lazy(
  loadRoute('*', () => import('./pages/DevZoomPage.tsx').then((m) => ({ default: m.DevZoomPage }))),
)
const KitchenSinkPage = lazy(
  loadRoute('*', () =>
    import('./pages/KitchenSinkPage.tsx').then((m) => ({ default: m.KitchenSinkPage })),
  ),
)

/** Tells the loading page the route has rendered (commits with the route, inside Suspense). */
function RouteReady() {
  useEffect(() => completeTask('route'), [])
  return null
}

/** Route-sized placeholder so the footer never jumps up while a chunk loads. */
function RouteLoading() {
  return (
    <div className="min-h-[100svh]" role="status">
      <span className="sr-only">Loading</span>
    </div>
  )
}

/** Root application shell with lazy routes and per-route error boundaries. */
export function App() {
  return (
    <BrowserRouter basename={ROUTER_BASENAME}>
      <PencilConfigProvider>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-(--color-ink) focus:px-4 focus:py-2 focus:text-(--color-night)"
        >
          Skip to content
        </a>
        <ScrollManager />
        <Navbar />
        <main id="main" tabIndex={-1} className="outline-none">
          <Suspense fallback={<RouteLoading />}>
            <Routes>
              <Route
                path="/"
                element={
                  <RouteErrorBoundary routeName="Home">
                    <HomePage />
                  </RouteErrorBoundary>
                }
              />
              <Route
                path="/specifications"
                element={
                  <RouteErrorBoundary routeName="Specifications">
                    <SpecificationsPage />
                  </RouteErrorBoundary>
                }
              />
              {import.meta.env.DEV ? (
                <Route
                  path="/dev/zoom"
                  element={
                    <RouteErrorBoundary routeName="DevZoom">
                      <DevZoomPage />
                    </RouteErrorBoundary>
                  }
                />
              ) : null}
              {import.meta.env.DEV ? (
                <Route
                  path="/dev/kitchen-sink"
                  element={
                    <RouteErrorBoundary routeName="KitchenSink">
                      <KitchenSinkPage />
                    </RouteErrorBoundary>
                  }
                />
              ) : null}
              <Route
                path="*"
                element={
                  <RouteErrorBoundary routeName="NotFound">
                    <NotFoundPage />
                  </RouteErrorBoundary>
                }
              />
            </Routes>
            <RouteReady />
          </Suspense>
        </main>
        <Footer />
      </PencilConfigProvider>
    </BrowserRouter>
  )
}
