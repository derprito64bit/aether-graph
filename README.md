# Aether Graph 0.5 — fictional precision pencil product film

A scroll-driven 3D product film for a fictional drafting pencil. Real-time
three.js device model, Motion-driven editorial overlay, zero third-party
runtime requests. **All specs and prices are illustrative
demonstration values.** Licensed under LICENSE; the device, brand, and
copy are original fiction.

Forked from the aether-one-x-v2 film engine (timeline, sampler, director,
stage, overlay); the device, copy, and lighting are pencil-original.

## Commands

| command             | what                                                          |
| ------------------- | ------------------------------------------------------------- |
| `npm run dev`       | local dev server                                              |
| `npm run verify`    | typecheck + lint + format + test + build + analyze (the gate) |
| `npm run test`      | vitest unit suite                                             |
| `npm run e2e`       | playwright matrix (CI)                                        |
| `npm run e2e:quick` | chromium smoke + film (local loop)                            |
| `npm run build`     | production bundle                                             |
| `npm run analyze`   | bundle budgets (fails when exceeded)                          |

`npm.cmd` / `npx.cmd` only; the PowerShell `.ps1` shims are execution-policy blocked.

## Routes

`/`, `/cameras`, `/performance`, `/display`, `/software`,
`/specifications`. Dev-only: `/dev/zoom`, `/dev/kitchen-sink`
(`?t=` deep-links film progress, `?nogl=1` forces the static fallback,
`?bodyN=` tunes the body superellipse for a session).

## Architecture

```text
scroll ──► progress MV ──► sampleFilm(p) ──► FilmDirector ──► scene
                                │                  ├─ camera/pose/FOV (damped + capped)
                                │                  ├─ lighting states (damped per act)
                                │                  ├─ shell dissolve + internals control
                                │                  └─ screen mode/brightness
                                └─► computeFilmStates(p) ──► overlay chapters,
                                    callouts, screen, internals
```

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 120" role="img" aria-label="Film data flow: scroll progress feeds the sampler, director, scene, and overlay">
  <style>text{fill:currentColor;font:11px monospace}rect{fill:none;stroke:currentColor;stroke-width:1.2}</style>
  <rect x="8" y="40" width="90" height="40" rx="8"/><text x="20" y="64">scroll</text>
  <rect x="128" y="40" width="110" height="40" rx="8"/><text x="140" y="64">sampler</text>
  <rect x="268" y="40" width="110" height="40" rx="8"/><text x="280" y="64">director</text>
  <rect x="408" y="14" width="100" height="40" rx="8"/><text x="420" y="38">scene</text>
  <rect x="408" y="66" width="100" height="40" rx="8"/><text x="420" y="90">overlay</text>
  <rect x="538" y="40" width="94" height="40" rx="8"/><text x="550" y="64">data</text>
  <path d="M98 60h30M238 60h30M378 60h30M508 60h30" stroke="currentColor" stroke-width="1.2"/>
  <path d="M458 54v12" stroke="currentColor" stroke-width="1.2"/>
</svg>

- `src/film/`: acts (keyframes), timeline, sampler, states, director, overlay, internals.
- `src/components/PhoneViewer/`: procedural device (geometry, materials, textures, lighting, LOD).
- `src/data/product.ts`: single source of truth; film copy must match it (tested).
- `src/lib/`: pure math, imports neither React nor three (boundary tested).

How the film works in two minutes: one sticky stage inside a long
runway; scroll position maps to progress 0..1; pure functions sample
keyframes and state windows; the director damps everything toward the
sample (rotation/FOV capped, position glided); the overlay crossfades
chapters and projects exploded-part callouts. Reduced motion, missing
WebGL, or `?nogl` collapses to a static chapter list.

## Constraints

- Fictional product; no real brand imitation anywhere.
- No analytics, fonts, HDR, images, or beacons off-device (tested).
- ACES Filmic, one curve; sRGB authored colors converted once
  (`docs/rendering.md`).
- 120k triangle device budget; bundle budgets enforced (`docs/perf.md`).
- Accessibility: skip link, arrow-key act navigation, aria-live chapters,
  static story under reduced motion, contrast-tested tokens.

## Docs

`docs/FILM.md` (add an act), `docs/glass.md` (tiers), `docs/motion.md`
(grammar), `docs/rendering.md` (color), `docs/device-design.md` +
`docs/device-perf.md` + `docs/device-originality.md` (the device),
`docs/adr/` (big decisions), `docs/tooling.md` (environment).
