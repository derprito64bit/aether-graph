# Glass — liquid glass in three tiers

One `<Glass>` primitive (`src/components/Glass/`), four variants by parameter
set (`chrome`, `panel`, `tooltip`, `control`), never bespoke CSS. Every
parameter reads the glass tokens in `src/index.css`. Glass is punctuation:
navbar, buy card, x-ray tooltips, quick settings. Not every surface.

## Tier 1: physical glass in WebGL (hero surfaces)

The device glass itself: `MeshPhysicalMaterial` clearcoat over the screen
and ceramic panels, lit by the film rig. True refraction and specular
response, works in every WebGL browser. Cost: no extra render-target pass
(no `transmission` sampling), capped DPR, one hero subject. A full
`transmission` HTML panel was measured against this and deferred: it needs
its own stage plus an extra target pass on every scroll frame, and the
3D-stage glass already carries the hero read.

## Tier 2: SVG displacement refraction (Chromium)

`src/components/Glass/displacement.ts` builds the map:

- Squircle height function, Snell refraction at IOR 1.5, 127 radial samples.
- Polar-to-Cartesian encode: X in red, Y in green, `128 + c * 127`.
- Applied as `backdrop-filter: url(#glass-<variant>) saturate(...)`.
- Separate specular rim overlay (`.glass-rim`) — refraction without a rim
  reads as frosted plastic, so the rim ships before any blur tuning.

Limits: Chromium-only as backdrop, 2D shapes, one refraction event. Maps
are cached per size and profile and rebuilt only on variant change, never
per frame. Only `scale` animates, nothing else.

## Tier 3: layered fallback (Safari, Firefox, everything else)

Blur plus saturate on a tinted background, masked rim (inset shadows),
low-opacity noise against banding, top inner highlight plus bottom inner
shadow for thickness. Honest about being blur, expensive-looking anyway.

## Detection and collapses

`glassTier()` runs once at mount and caches. Resolved tier lands on
`data-tier` so tests assert it. Under `prefers-reduced-transparency` the
surface collapses to solid; under `forced-colors` it drops to system
colors with the rim hidden. Text always sits over the scrim, so 4.5:1
holds against the worst-case backdrop.

## Screenshots (`docs/glass-snaps/`)

- `tier-displacement.png` (Chromium): navbar pill refracting the hero.
- `tier-layered-firefox.png`, `tier-layered-webkit.png`: same pill, fallback.
- `tier-reduced-transparency.png`: solid collapse.
- `tier-forced-colors.png`: system colors, rim hidden.
