import { useEffect } from 'react'
import { CONCEPT_NOTICE, PENCIL } from '../../data/pencil.ts'

/**
 * JSON-LD Product schema. The fictional nature is stated in the
 * description, and no fictional price is marked up as a real offer
 * (meta prompt section 8.7).
 */
export function ProductJsonLd() {
  useEffect(() => {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.dataset.productSchema = 'true'
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: `${PENCIL.fullName} (fictional concept)`,
      description: `A fictional precision drafting pencil. ${CONCEPT_NOTICE}`,
      brand: { '@type': 'Brand', name: 'Aether (fictional)' },
    })
    document.head.appendChild(script)
    return () => {
      script.remove()
    }
  }, [])
  return null
}
