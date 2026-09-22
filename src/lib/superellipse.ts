/**
 * Superellipse outline |x/a|^n + |y/b|^n = 1, sampled by sweeping the
 * parametric angle once around the perimeter. Exponent n controls corner
 * fullness: 2 is an ellipse (bar of soap), 4 reads as a phone, 5.5 as a
 * brick. The sweep keeps winding monotone by construction (never a
 * bow-tie). Pure math, no DOM, no three: shape construction lives with
 * the geometry factories that own the renderer types.
 */
export function superellipsePoints(
  halfW: number,
  halfH: number,
  n: number,
  perQuadrant: number,
): Array<[number, number]> {
  const total = perQuadrant * 4
  const inv = 2 / n
  const pts: Array<[number, number]> = []
  for (let i = 0; i < total; i++) {
    const t = (i / total) * Math.PI * 2
    // Snap axis crossings to exact zero: float dust (cos(pi/2) != 0) would
    // otherwise break mirror symmetry after the exponent amplifies it.
    const c = Math.abs(Math.cos(t)) < 1e-12 ? 0 : Math.cos(t)
    const s = Math.abs(Math.sin(t)) < 1e-12 ? 0 : Math.sin(t)
    pts.push([halfW * Math.sign(c) * Math.abs(c) ** inv, halfH * Math.sign(s) * Math.abs(s) ** inv])
  }
  return pts
}
