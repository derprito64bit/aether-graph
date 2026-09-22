# Motion — shot grammar, zoom modules, tokens

## Shot grammar (`src/film/shots.ts`)

Every act names its move: establishing (slow, wide), push-in (accelerates,
eases out hard), arc (constant angular velocity), macro (locked off,
damp 3.5/s), reveal (fast in, long settle). The director reads the damp
rate per act. Timeline segments run linear (keys pass at speed; the
director's damping supplies the settle); `ease: 'smooth'` only on authored
holds.

## Zoom modules (`src/zoom/zoom.ts`)

- Camera dolly: the film transport itself.
- Dolly-zoom (Vertigo): `dollyZoomFov` widens the lens as the camera pushes
  so the subject holds size and the background warps. Wired once, on the
  silicon feature (layer cursor 5, p in [0.395, 0.415]). Twice would be
  a gimmick.
- Infinite-zoom match cut: `matchCutOpacity` crossfades layers A and B
  across a fixed scale ratio; no frame shows both readable. The phone to
  die handoff rides the x-ray ghost plus die emissive window.
- Pinned zoom: `pinnedScale` maps a progress range to 1..zoomMax for sticky
  2D sections. Runway length derives from the zoom range.
- Reveal zoom: `revealScale` caps at 1.04 for editorial blocks.
- CSS scroll-driven animations: decorative only, `@supports`-gated, never
  transport.

Rules: never hijack scroll, damp the driving value, transform and opacity
only, `will-change` toggled in range, CLS zero, reduced motion turns every
zoom into a crossfade at fixed scale. Demo and scrub targets: `/dev/zoom`
(DEV only).

## Tokens

Easings `--ease-out-expo/--ease-out-quint/--ease-in-out-soft`; durations
fast 180ms, base 320ms, slow 640ms, reveal 800ms. Springs for direct
manipulation (parallax, toggles), durations for system motion (chapters
crossfade 320ms, count-ups 640ms eased).

## Micro-interactions

Hover, active, focus-visible, and disabled defined together. Count-up
numerals on chapter entry (`useCountUp`, instant under reduced motion).
Cursor-follow highlight stays on glass only. No custom cursors, no layout
on hover, no click delayed past 100ms.
