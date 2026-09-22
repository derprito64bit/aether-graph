# Performance budgets and measurements

Meta prompt section 8.3, enforced where automatable, recorded where not.

## Enforced in CI (`scripts/bundle-budget.mjs`, runs in `npm run verify`)

| budget                       | limit                                 | measured 2026-09-20                                         |
| ---------------------------- | ------------------------------------- | ----------------------------------------------------------- |
| Initial JS excl. three, gzip | < 180 KB                              | 139.3 KB                                                    |
| CSS, gzip                    | < 40 KB                               | 6.3 KB                                                      |
| three chunk                  | own lazy file, never initial          | ✅ separate chunk                                           |
| Film scene                   | own dynamic chunk, near-viewport only | ✅ lazy chunk                                               |
| 3D geometry + textures       | < 1.5 MB compressed                   | device ~28.9k tris, textures ~4 MB canvas (see device-perf) |

Device triangles are asserted per commit (`phoneBudget.test.ts`):
LOD0 28,896 / LOD1 21,668 against the 120k budget.

## Measured, not gated

- Idle FPS (SwiftShader software GL, `scripts/measure-fps.mjs`):
  **1.2 fps, worst frame 2.4 s** — a CPU-renderer lower bound dominated by
  shader compilation, not a device claim. Real-GPU 55 fps trace is the
  open M10 thread; SwiftShader cannot stand in for it.
- LCP / CLS / INP under 4x throttle + Fast 3G: **open**. Method: Chrome
  DevTools MCP trace over the full film; thresholds LCP < 2.0 s,
  CLS < 0.05, INP < 200 ms. The CLS tests (`buffered: false`, post-lazy,
  post-fonts) and zero-layout-shift reservation are the structural
  preconditions, already in place.
- Frame timing across the x-ray explode, camera dive, and battery climax
  windows: **open**, same trace. Velocity caps (rotation, FOV) and damped
  camera position bound flick behavior by construction (`shots.test.ts`,
  `holds.test.ts`); numbers await hardware.

## Techniques in place

Lazy three + film chunks, near-viewport canvas mounting, adaptive DPR
(1.75/1.3 caps), instanced repeated parts, mobile LOD1, disposal on
unmount, preloaded above-fold fonts with swap, local-only assets.
