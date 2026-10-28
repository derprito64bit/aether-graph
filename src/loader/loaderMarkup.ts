import {
  BARREL_TOP,
  CAP_TOP,
  CROWN,
  GRIP_TOP,
  JOINTS,
  NOSE_BASE,
  R,
  RING_TOP,
  SLEEVE_BASE,
  SLEEVE_MOUTH,
  TIP,
  clipPath,
  outlinePath,
} from '../components/Drawing/pencilProfile.ts'

/**
 * Loading-page pencil, built at build time (vite.config.ts injects it into
 * index.html) from the same profile as the technical drawing and the 3D
 * model. The pencil is the progress bar: an ink outline that a cobalt render
 * front sweeps tip to crown, leaving the rendered materials behind it.
 * Pure string building, no DOM.
 */

/** SVG viewBox: a little room before the tip, the scale line beneath. */
export const VIEW = { x: -3, y: -9, w: 149, h: 25 } as const
/** Y of the dimension scale under the pencil, drawing units. */
export const SCALE_Y = 11.5

const n = (v: number): string => String(Math.round(v * 1000) / 1000)

/** Material bands, tip to crown, as [from, to, fill]. */
const BANDS: ReadonlyArray<readonly [number, number, string]> = [
  [SLEEVE_MOUTH, SLEEVE_BASE, 'url(#agl-steel)'],
  [SLEEVE_BASE, NOSE_BASE, 'url(#agl-graphite)'],
  [NOSE_BASE, GRIP_TOP, 'url(#agl-graphite)'],
  [GRIP_TOP, RING_TOP, 'url(#agl-steel)'],
  [RING_TOP, BARREL_TOP, 'url(#agl-graphite)'],
  [BARREL_TOP, CAP_TOP, 'url(#agl-graphite)'],
  [CAP_TOP, CROWN + 1, 'url(#agl-steel-dark)'],
]

function scaleTicks(): string {
  const out: string[] = []
  for (let i = 0; i <= 10; i++) {
    const x = TIP + ((CROWN - TIP) * i) / 10
    const major = i % 5 === 0
    out.push(
      `<line x1="${n(x)}" y1="${n(SCALE_Y - (major ? 1.3 : 0.8))}" x2="${n(x)}" y2="${n(SCALE_Y + (major ? 1.3 : 0.8))}"/>`,
    )
  }
  return out.join('')
}

/** The loader's pencil SVG plus the moving percentage label. */
export function loaderPencilMarkup(): string {
  const outline = outlinePath()
  const clip = clipPath()
  const bands = BANDS.map(
    ([a, b, fill]) =>
      `<rect x="${n(a)}" y="${n(-R - 1)}" width="${n(b - a)}" height="${n(2 * R + 2)}" fill="${fill}"/>`,
  ).join('')
  const joints = JOINTS.map(
    ([x, r]) => `<line x1="${n(x)}" y1="${n(-r)}" x2="${n(x)}" y2="${n(r)}"/>`,
  ).join('')
  const labelTop = ((SCALE_Y - VIEW.y) / VIEW.h) * 100
  return `<div class="agl-pencil">
<svg class="agl-svg" viewBox="${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}" aria-hidden="true" focusable="false">
<defs>
<clipPath id="agl-silhouette"><path d="${outline}"/></clipPath>
<clipPath id="agl-progress"><rect id="agl-progress-rect" x="${VIEW.x}" y="${VIEW.y}" width="0" height="${VIEW.h}"/></clipPath>
<linearGradient id="agl-graphite" x1="0" y1="${n(-R)}" x2="0" y2="${n(R)}" gradientUnits="userSpaceOnUse">
<stop offset="0" stop-color="#4a4e56"/><stop offset=".22" stop-color="#8d929b"/><stop offset=".34" stop-color="#3a3e45"/><stop offset=".72" stop-color="#1b1d21"/><stop offset="1" stop-color="#3c4048"/>
</linearGradient>
<linearGradient id="agl-steel" x1="0" y1="${n(-R)}" x2="0" y2="${n(R)}" gradientUnits="userSpaceOnUse">
<stop offset="0" stop-color="#8f949b"/><stop offset=".25" stop-color="#f4f5f6"/><stop offset=".5" stop-color="#a7acb3"/><stop offset=".8" stop-color="#6b7077"/><stop offset="1" stop-color="#b9bdc3"/>
</linearGradient>
<linearGradient id="agl-steel-dark" x1="0" y1="${n(-R)}" x2="0" y2="${n(R)}" gradientUnits="userSpaceOnUse">
<stop offset="0" stop-color="#3a3d43"/><stop offset=".3" stop-color="#9aa0a8"/><stop offset=".6" stop-color="#2a2d33"/><stop offset="1" stop-color="#4a4e56"/>
</linearGradient>
<pattern id="agl-knurl" width="1.1" height="1.1" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
<path d="M0 0H1.1M0 0V1.1" stroke="#0e0f12" stroke-width=".32" fill="none"/>
</pattern>
</defs>
<g clip-path="url(#agl-progress)">
<rect class="agl-lead" x="${n(TIP)}" y="-0.25" width="${n(SLEEVE_MOUTH - TIP + 0.6)}" height="0.5" fill="#2b2b2e"/>
<g clip-path="url(#agl-silhouette)">${bands}
<rect x="${n(NOSE_BASE + 1.4)}" y="${n(-R)}" width="${n(GRIP_TOP - NOSE_BASE - 2.8)}" height="${n(2 * R)}" fill="url(#agl-knurl)" opacity=".75"/>
<text class="agl-etch" x="${n(RING_TOP + 20)}" y="0.85">AETHER GRAPH 0.5</text>
</g>
<path d="${clip}" fill="url(#agl-steel)"/>
</g>
<path class="agl-ink" d="${outline}"/>
<path class="agl-ink" d="${clip}"/>
<g class="agl-thin">${joints}</g>
<line class="agl-center" x1="-2" y1="0" x2="${n(CROWN + 3)}" y2="0"/>
<line id="agl-front" class="agl-front" x1="0" y1="${n(-R - 3)}" x2="0" y2="${n(R + 3)}"/>
<g class="agl-scale"><line x1="${n(TIP)}" y1="${n(SCALE_Y)}" x2="${n(CROWN)}" y2="${n(SCALE_Y)}"/>${scaleTicks()}</g>
</svg>
<p id="agl-label" class="agl-label" style="top:${n(labelTop)}%">0%</p>
</div>`
}
