# ADR: WebGL glass on hero surfaces, CSS glass everywhere else

Date: 2026-09-19. Status: accepted.

Tier 1 (physical glass in WebGL) is reserved for hero surfaces on the 3D
stage. All HTML chrome (navbar, deck, tooltips, controls) uses Tier 2/3:
SVG-displacement refraction where Chromium supports it, layered
blur-and-rim fallback elsewhere.

Why: transmissive materials cost a render-target pass each and are
disabled on mobile and low-power by policy. Spending that budget on a
navbar would starve the device render, which is the whole point of the
site. Tier 2/3 give 90 percent of the read at negligible cost, with
forced-colors and reduced-transparency collapses the physical tier
cannot do declaratively.

Consequence: at most two transmissive surfaces on screen, never over a
moving canvas without measurement, automatic Tier 3 under quality
pressure.
