import { Link } from 'react-router'
import { Head } from '../components/head/Head.tsx'

/** Catch-all route. Retired phone-era pages land here too. */
export function NotFoundPage() {
  return (
    <>
      <Head
        title="Page not found | Aether Graph 0.5"
        description="This page does not exist."
        path="/404"
      />
      <section className="mx-auto flex min-h-[80svh] max-w-[1400px] flex-col justify-center px-4 pt-28 pb-16 md:px-8">
        <p
          className="numeral text-[clamp(96px,22vw,280px)] text-(--color-faint)"
          aria-hidden="true"
        >
          404
        </p>
        <h1 className="spec-num display-lg mt-6">This page is not on the drawing.</h1>
        <p className="mt-4 max-w-md text-(--color-dim)">
          The address may be from an older version of the site.
        </p>
        <p className="mt-8 flex flex-wrap gap-3">
          <Link to="/" className="btn btn-ink">
            Watch the film
          </Link>
          <Link to="/specifications" className="btn btn-ghost">
            Specifications
          </Link>
        </p>
      </section>
    </>
  )
}
