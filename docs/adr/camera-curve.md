# ADR: re-clocked Catmull-Rom camera path

Date: 2026-09-19. Status: accepted.

Three's `CatmullRomCurve3` uses uniform knots, so sampling at raw progress
lands keyframes at the wrong times: authored keys bunch where the curve
wants them, not where the story wants them. We sample the curve, then
re-clock: `sample.ts` maps timeline progress through the authored key
times (`key.at`) onto curve parameter space, so a key authored at 0.685
is reached exactly at 0.685.

Alternatives rejected: hand-rolled easing per segment (twelve seams to
maintain instead of one mapping), uniform re-timing of keys (destroys the
editorial rhythm the acts are written around).

Consequence: `sampleFilm` stays a pure function of progress, which is
what makes reverse scrub, holds, and the continuity tests possible.
