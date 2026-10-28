import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { CROWN, TIP, outlinePath } from '../components/Drawing/pencilProfile.ts'
import { VIEW, loaderPencilMarkup } from './loaderMarkup.ts'

describe('loading-page pencil markup', () => {
  const html = loaderPencilMarkup()

  it('draws the same silhouette as the technical drawing', () => {
    expect(html).toContain(outlinePath())
  })

  it('carries every element the boot script drives', () => {
    for (const id of ['agl-progress-rect', 'agl-front', 'agl-label']) {
      expect(html).toContain(`id="${id}"`)
    }
  })

  it('hides the drawing from assistive tech (the progressbar carries the value)', () => {
    expect(html).toContain('aria-hidden="true"')
  })

  it('is deterministic', () => {
    expect(loaderPencilMarkup()).toBe(html)
  })

  it('matches the geometry the boot script in index.html draws with', () => {
    const index = readFileSync('index.html', 'utf8')
    expect(index).toContain(`data-x0="${VIEW.x}"`)
    expect(index).toContain(`data-w="${VIEW.w}"`)
    expect(index).toContain(`data-tip="${TIP}"`)
    expect(index).toContain(`data-len="${CROWN - TIP}"`)
    expect(index).toContain('<!--ag-loader-pencil-->')
    expect(index).toContain('<!--ag-assets-->')
  })
})
