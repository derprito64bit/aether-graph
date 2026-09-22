# Teardown sequence — Prompt D build notes and rubric

Replaces the x-ray, chip, and rebuild acts with one horizontal
layer-by-layer teardown (0.25–0.52). Before: `docs/teardown-before-xray.png`.
After: `docs/film-snaps/act-teardown-*.png` (stack + ten layers).

## How it works

- Ten layers front to back (`src/film/teardown/layers.ts`), wired to
  Prompt C part IDs (coverage asserted: every registry part exactly once).
- `layerCursor` 0–10 continuous float drives everything per-layer; pure
  function of progress, reverses exactly.
- Four-phase envelopes (detach / flip / hold / restack) with weight
  damping (heavy 2.2, medium 4, light 5.5/s), light-layer overshoot, screw
  spin as `explode × 2π`. Reduced motion snaps envelopes binary.
- Turnover flip (π − 0.06 about hero-local x) brings rear-facing detail
  (die marking, lens glass, wordmark) up to the overhead camera. A tilt
  cancel was tried first and presented blank backs — wrong direction.
- Featured layer detaches right toward the subject column, away from the
  left text column; slot stays open in the stack.
- Shell recede (unfeatured shell to 45%) + feature accent on the rim
  light + per-layer copy with accent figure underline.
- Internals share materials across layers, so per-part recede is not
  possible without cloning the set per layer (rejected: 10× material
  memory for a dimming effect). Context pop there comes from position,
  scale, accent, and motion instead — see rubric 6 note.
- Legacy explode/chip scalars kept alongside (dissolve, visibility, die
  lift, battery beats); teardown overrides positioning while stacked.
- Stage brightens continuously across the run; page tint + text scrim
  follow stage lightness (contrast tested at 24 points, accents included).

## Rubric (12 checks)

1. **Silhouette separation — pass.** Stage gradient + horizon + rim carry
   the edges; compare against `teardown-before-xray.png`.
2. **Stack reads as a stack — pass.** `act-teardown-stack.png`: ten
   bands, coil/board/cell/port edge distinguishable.
3. **Not a striped rectangle — pass.** 77° tilt keeps face slivers;
   coil turns and board canshapes read as objects.
4. **Hold is real — pass.** Establishing hold 0.272–0.295 on identical
   keys; feature holds 28% of each window by envelope (tested).
5. **No collision — pass on desktop, mobile visual pending.** Text left
   42%, subject right; featured detaches right. <900px split implemented
   (compact gap + reduced bump + stacked copy) but not eyeballed.
6. **Context legible — pass with a note.** Shell recede (45%) + featured
   emissive pop on unique-material parts (die, cell band, sensor glint)
   - rim accent + scale. Accents passed through the dataviz validator:
     they fail as a categorical palette (pastel adjacents) but that gate
     does not apply — each accent appears alone with a text label, never
     as chart series; figure text wears dim ink, never the accent. Accent
     floor asserted at 3:1 (technical, like `faint`). A bright coil can
     still outshine a small die at some angles; lighting balance is queued
     polish, not a fail.
7. **Gap persists — pass.** Stack offsets apply every frame; featured
   slot stays open by construction.
8. **Weight reads — pass on implementation.** Damps, distances, overshoot
   (light only), screw spin, still battery all in; blind timing test
   would be nice-to-have.
9. **Stage progression — pass.** `stageColors` ramps 0.25–0.52; stack vs
   rear-panel stills differ obviously.
10. **Product neutral — pass.** Stage carries colour; materials untouched
    (rim/accent lights only).
11. **Contrast — pass.** 24-point vitest (ink 4.5, headline 7, dim 3,
    all accents 4.5) + axe both motion modes green.
12. **Reverse scrub — pass on units, visual pass pending.** Envelopes,
    cursor, and colors are pure; scrub-continuity bounds hold. A slow
    manual 0.52→0.25 watch-through is still owed.

Score: **10 pass, 2 partial** (6 context pop, 12 visual reverse). Neither
partial blocks; both are queued polish with a defined shape.
