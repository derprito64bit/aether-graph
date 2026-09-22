# ADR: fit-based responsive FOV

Date: 2026-09-19. Status: accepted.

Instead of fixed FOVs per breakpoint, the framing solver (`framing.ts`)
computes the FOV that fits the phone's projected silhouette to a target
share of the viewport at the current aspect, every frame.

Why: fixed FOVs clip on 32:9 and float tiny on narrow phones; every new
breakpoint would need hand-tuned values. Fit-based framing holds across
the whole aspect ladder (tested narrow phone through 32:9) with no
per-breakpoint constants.

Consequence: macro keys set explicit FOVs with `fit: null` where the
solver must not intervene, and `macroFloorFov` guards the floor on
portrait aspects.
