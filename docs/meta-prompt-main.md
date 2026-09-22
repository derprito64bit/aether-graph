# Main build prompt — working reference (extracted, not verbatim)

Original META PROMPT: Build "AETHER ONE X v2", a refined scroll-driven 3D product film.
Reference to beat (audit, keep strengths, rebuild higher): https://github.com/Vasiniks/aether-one-x

## Mission axes, in order

1. One continuous film. 2. Best-in-class surface craft (real refraction).
2. Correct and verifiable (tested math, validated timeline, CI). 4. Fast with
   budgets enforced + graceful degradation. 5. Legible to the next engineer.

## Stack

React 19 + TS strict (`verbatimModuleSyntax`, `erasableSyntaxOnly`,
`noUnusedLocals/Parameters`, `noFallthroughCasesInSwitch`,
`noUncheckedIndexedAccess`). React Router v7+ library mode, route lazy.
Vite 8. Tailwind v4 via `@tailwindcss/vite`, tokens in `@theme`, no config
file. Motion (`motion/react`), no window scroll listeners. three +
`@react-three/fiber` + `@react-three/drei`. Phosphor icons tree-shaken.
Self-hosted variable fonts. oxlint, prettier, vitest, playwright, axe-core.
Postprocessing only with ADR + measurement.

Scripts: dev, build (`tsc -b && vite build`), preview, lint, format,
typecheck, test, test:watch, e2e, e2e:update, analyze
(`vite build && node scripts/bundle-budget.mjs`), verify (typecheck +
lint + format + test + build + analyze). `verify` green at every gate.

Conventions: no `any`, no non-null assertions outside commented escapes,
units in names, branded `Progress` type, pure math in `src/lib/` (no React
or three), zero allocation in hot paths, one-line doc comments with units,
conventional commits.

## Design system (src/index.css @theme, docs/design-tokens.md)

Night/surface/elev/raise surfaces; ink 7:1, dim 4.5:1, faint 3:1 technical
only; one blue accent family; glass tokens; semantic aliases. Three type
families, fixed scale, utility per role. Named easings, duration scale
180/320/640/800ms, 3D damping ~5.5/s, reduced motion is a layout.

## Routes

`/` film (13 acts) + `#buy` configurator. `/cameras` `/performance`
`/display` `/software` `/specifications`. Shared navbar/footer/hero/CTA.
Scroll reset on route change, hash honored, reduced-motion-aware.

## Film engine

One sticky stage in ~1500vh/1100vh runway (svh), one master
`scrollYProgress`. 13 acts: arrival settle approach xray chip rebuild
camera display storage battery software ai final. Object-literal keyframes
per act, typed `key()` API, validator (increasing `at`, 0..1 coverage,
boundary keys both sides, no NaN, fit/FOV ranges, camera outside shell).
Dev scrubber (`.` toggle, `?t=`). Re-clocked Catmull-Rom sampler, scratch
reuse, continuity tested. Fit-based responsive framing, aspect tiers,
ultrawide offset, macro floor. X-ray with separate film material set, real
internals geometry, explode, render-order discipline, hover inspection.
Per-act lighting table, local Lightformers + procedural env, explicit
AgX/ACES + per-act exposure. Live canvas screen at ~9fps, paused offscreen.
Overlay copy as data in chapters, one primitive per role, HTML OS overlay
at software act. Reduced motion = static story layout + skip-film control.

## Craft modules

Liquid glass in 3 tiers (WebGL transmission / SVG displacement /
layered), one `<Glass>` primitive with variants, capability detection on
data attribute, token-driven, transparency/forced-colors collapses, perf
rules, `docs/glass.md`. Zoom modules (dolly, Vertigo once, match cut,
pinned, reveal, decorative CSS-only), rules (no hijack, damped, transform

- opacity only, will-change toggled, CLS zero). 3D craft (shot grammar,
  weight, material channels, staggered explode, value-noise idle, rack
  focus measured, instancing, data-authored motion, Blender only with
  compression + 1.5MB budget). Micro-interactions (states together, springs
  for manipulation, no cursor hiding, no click delay; dataviz before meters).

## Refinements (requirements)

Tests: vitest pure modules, timeline invariants, spec consistency,
no-network scan, glass tiers, Playwright e2e, visual regression via `?t=`
(~20 progress x 5 viewports, frozen time, DPR 1), axe every route in both
motion modes. CI: check job, build+e2e job, nightly Lighthouse; branch
protection. Budgets enforced in `bundle-budget.mjs`: initial JS excl three
<180KB gzip, three own lazy chunk, film dynamic chunk, CSS <40KB gzip,
geometry+textures <1.5MB, first paint <400KB; LCP <2s CLS <0.05 INP
<200ms (4x throttle + Fast 3G); 55fps sustained. Resilience: per-route +
stage boundaries, context loss to CSS phone, front+rear CSS fallback, no
layout shift. Zero third-party runtime (test + CSP). A11y: landmarks, skip
link, focus, toggles, keyboard film nav + aria-live, canvas descriptions,
noscript. SEO: per-route meta + OG (locally generated), sitemap, robots,
JSON-LD fictional. Authoring: scrubber, `/dev/kitchen-sink` (DEV-gated),
FILM.md, glass.md, motion.md, ADRs, audit.md, README with diagram.

## Milestones M0-M10 with gates

M0 scaffold (verify on empty app). M1 system+shell (contrast docs, axe,
no shift). M2 data (tests incl battery+format). M3 phone (clean
mount/unmount, 60fps idle, fallback forced). M4 timeline (invariant tests,
scrubber). M5 film (55fps trace, no console errors, snapshots committed).
M6 craft (3-browser tiers + screenshots, collapses, CLS zero, layer
ceiling, frame budget). M7 modules (e2e each interaction, axe, keyboard).
M8 pages (axe both modes, meta + OG). M9 reduced motion + fallbacks
(usable with reduced motion, no WebGL, no JS). M10 hardening (verify + CI
green, budgets, Lighthouse, preview URL).

Self-verification protocol: verify, drive in browser with zero console
errors, DevTools trace under throttle, 3-browser glass screenshots,
review snapshot diffs, test degraded paths by hand, aspect ladder,
normal + flick scroll, read copy aloud. Gate reports: built, measured,
blocked, needs.

## Failure playbook (abridged)

Camera through phone = re-clocking, then tension, then key. Boundary jump
= missing key, extend validator. X-ray frame spikes = transparent sorting,
render order, dithered opacity. Glass slow = transmission resolution,
one surface, adaptive fall. Glass invisible in Safari = Tier 3 exists.
Zoom whip = undamped driver. Layout shift in zoom = box property animated.
Height jitter = svh. Scroll lag = state per frame. Flaky snapshots =
time/DPR/fonts. Unknown API = docs MCP (R19/R3Fv9/drei10/Router/Tailwind4/three r186+, transmission churn).
