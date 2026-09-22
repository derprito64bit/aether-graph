/**
 * Zoom-scroll modules as pure math. Every module maps scroll progress to
 * transform values only, so layout never shifts and scrubbing is exact.
 */

/** Clamp helper in fraction units. */
function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v))
}

/**
 * Dolly-zoom (Vertigo) FOV solver. Push the camera in by dollyM meters while
 * widening the lens so the subject holds screen size and the background
 * warps. Returns the compensated vertical FOV in degrees.
 */
export function dollyZoomFov(baseFovDeg: number, dollyM: number, distanceM: number): number {
  const half = (baseFovDeg * Math.PI) / 360
  const size = Math.tan(half) * distanceM
  const next = Math.max(0.01, distanceM - dollyM)
  return (2 * Math.atan(size / next) * 180) / Math.PI
}

/**
 * Infinite-zoom match cut. Layer A scales up past the viewport while layer B
 * scales in from near zero. Returns opacities for the crossfade window tuned
 * so no frame shows both layers readable: blend happens between ratio 2 and
 * ratio 4 of a fixed scale ratio of 8.
 */
export function matchCutOpacity(scaleRatio: number): { a: number; b: number } {
  const t = clamp01((scaleRatio - 2) / (4 - 2))
  const eased = t * t * (3 - 2 * t)
  return { a: 1 - eased, b: eased }
}

/**
 * Pinned zoom section. Maps progress across [start, end] to a scale from 1
 * to zoomMax with eased pacing identical on every viewport. Runway length
 * derives from the zoom range at the call site.
 */
export function pinnedScale(progress: number, start: number, end: number, zoomMax: number): number {
  const t = clamp01((progress - start) / Math.max(1e-5, end - start))
  const eased = t * t * (3 - 2 * t)
  return 1 + (zoomMax - 1) * eased
}

/**
 * Scroll-scrubbed reveal zoom. Low amplitude entry scale-in for editorial
 * blocks. Anything above 1.04 competes with the film.
 */
export function revealScale(viewProgress: number): number {
  const t = clamp01(viewProgress)
  return 1 + 0.04 * (1 - (1 - t) * (1 - t))
}
