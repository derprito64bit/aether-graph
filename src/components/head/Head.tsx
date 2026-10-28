import { useEffect } from 'react'
import { absoluteUrl } from '../../site.ts'

interface HeadProps {
  title: string
  description: string
  path: string
  /** Local OG image, generated in public/og. No remote fetch. */
  image?: string
}

/** Minimal per-route head manager. No heavy dependency. */
export function Head({ title, description, path, image = '/og/home.svg' }: HeadProps) {
  useEffect(() => {
    document.title = title
    const set = (selector: string, attr: string, value: string) => {
      let el = document.head.querySelector(selector) as HTMLMetaElement | null
      if (el === null) {
        el = document.createElement('meta')
        document.head.appendChild(el)
      }
      el.setAttribute(attr, value)
    }
    set('meta[name="description"]', 'content', description)
    set('meta[property="og:title"]', 'content', title)
    set('meta[property="og:description"]', 'content', description)
    // Social cards need absolute image URLs, base included.
    set('meta[property="og:image"]', 'content', absoluteUrl(image))
    set('meta[name="twitter:image"]', 'content', absoluteUrl(image))
    let link = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
    if (link === null) {
      link = document.createElement('link')
      link.rel = 'canonical'
      document.head.appendChild(link)
    }
    // Canonical follows the host and base the site is served from, so it is
    // right on GitHub Pages, a preview, and localhost alike.
    link.href = absoluteUrl(path)
  }, [title, description, path, image])
  return null
}
